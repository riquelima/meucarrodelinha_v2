import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webpush from "https://esm.sh/web-push@3.6.6"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { title, body, url } = await req.json()

    // Inicializa Supabase com Service Role Key (necessário para deletar assinaturas)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Configura VAPID
    webpush.setVapidDetails(
      'mailto:meucarrodelinhasalinas.adm@gmail.com',
      Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
      Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
    )

    // Busca todas as assinaturas
    const { data: subscriptions, error: dbError } = await supabase
      .from('push_subscriptions')
      .select('*')

    if (dbError) throw dbError

    const notificationPayload = JSON.stringify({ title, body, url })

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, notificationPayload)
        return { success: true, id: sub.id }
      } catch (err) {
        // Se a assinatura não é mais válida (usuário desinstalou ou limpou cache)
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log(`Limpando assinatura inválida: ${sub.id}`)
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
        return { success: false, id: sub.id, error: err.message }
      }
    })

    const results = await Promise.all(sendPromises)
    const successful = results.filter(r => r.success).length

    return new Response(
      JSON.stringify({ message: `Enviado para ${successful} dispositivos de ${results.length}`, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

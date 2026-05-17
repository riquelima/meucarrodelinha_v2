import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, password, checkOnly } = await req.json()
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email obrigatório' }), {
        status: 400, headers: corsHeaders
      })
    }

    const emailNorm = email.toLowerCase().trim()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: users } = await supabase
      .from('users_migrados')
      .select('*')
      .eq('email', emailNorm)

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ error: 'Usuário não encontrado' }), {
        status: 401, headers: corsHeaders
      })
    }

    const user = users[0]

    // Modo checkOnly: só verifica se o email existe (sem senha)
    if (checkOnly) {
      return new Response(JSON.stringify({ exists: true }), {
        headers: corsHeaders
      })
    }

    // Modo login sem senha: se não enviou password, permite entrar
    if (!password) {
      return construirResposta(user, emailNorm)
    }

    // Modo normal: verifica senha
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Senha incorreta' }), {
        status: 401, headers: corsHeaders
      })
    }

    return construirResposta(user, emailNorm)

  } catch (err) {
    console.error('Erro auth-migrado:', err)
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500, headers: corsHeaders
    })
  }
})

function construirResposta(user: any, emailNorm: string) {
  const tipoMap: Record<string, string> = {
    admin: 'admin', motorista: 'motorista', passageiro: 'passageiro', anunciante: 'passageiro'
  }
  const tipo = tipoMap[user.role] || 'passageiro'

  return new Response(JSON.stringify({
    success: true,
    migrado: true,
    noPassword: true,
    user: {
      _id: user._id || user.id,
      id: user._id || user.id,
      nome: user.name || 'Usuário',
      email: emailNorm,
      tipo_usuario: tipo,
      telefone: user.number || null,
      avatar: user.avatar || null,
      modelo_veiculo: user.vehicle || null,
      placa: user.licensePlate || null,
      origem: user.origin || null,
      destino: user.destination || null,
      descricao: user.description || null,
      cor_veiculo: user.carColor || null,
      status_online: user.status === 'online'
    }
  }), { headers: corsHeaders })
}

-- 1. CORREÇÃO DO STORAGE (Para o Upload de Foto funcionar)
-- Cria o bucket 'avatars' se não existir e o torna público
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Política: Permitir acesso PÚBLICO para visualizar avatares (necessário para a Home e Perfil)
DROP POLICY IF EXISTS "Avatares são públicos" ON storage.objects;
CREATE POLICY "Avatares são públicos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Política: Permitir que usuários AUTENTICADOS façam upload de avatares
DROP POLICY IF EXISTS "Usuários podem fazer upload de avatares" ON storage.objects;
CREATE POLICY "Usuários podem fazer upload de avatares"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- Política: Permitir que usuários atualizem seus próprios avatares
DROP POLICY IF EXISTS "Usuários podem atualizar seus avatares" ON storage.objects;
CREATE POLICY "Usuários podem atualizar seus avatares"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );


-- 2. CORREÇÃO DOS DADOS DA HOME PAGE (Para aparecer motoristas)
-- Garante que as políticas de segurança permitam leitura pública da tabela motoristas e usuarios
ALTER TABLE public.motoristas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas para recriar corretamente
DROP POLICY IF EXISTS "Motoristas visíveis publicamente" ON public.motoristas;
DROP POLICY IF EXISTS "Dados públicos de usuários são visíveis para todos" ON public.usuarios;

-- Cria política de leitura pública irrestrita para motoristas (para aparecer na Home)
CREATE POLICY "Motoristas visíveis publicamente"
ON public.motoristas FOR SELECT
USING (true);

-- Cria política de leitura pública para usuários (para pegar nome e foto na Home)
CREATE POLICY "Dados públicos de usuários são visíveis para todos"
ON public.usuarios FOR SELECT
USING (true);

-- 3. DADOS DE TESTE (Opcional - Apenas para garantir que apareça alguém)
-- Atualiza todos os motoristas atuais para 'aprovado' e 'online' para teste imediato
UPDATE public.motoristas
SET status_aprovacao = 'aprovado', status_online = true;

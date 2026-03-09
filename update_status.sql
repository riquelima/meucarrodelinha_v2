-- Atualizar todos os motoristas existentes para ficarem ONLINE (Disponível)
UPDATE public.motoristas
SET status_online = true;

-- Definir o valor padrão da coluna status_online para TRUE (para novos cadastros)
ALTER TABLE public.motoristas
ALTER COLUMN status_online SET DEFAULT true;

-- Garantir que a coluna status_aprovacao também tenha um padrão amigável se necessário (opcional)
-- ALTER TABLE public.motoristas ALTER COLUMN status_aprovacao SET DEFAULT 'aprovado';

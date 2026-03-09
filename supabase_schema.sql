-- Habilitar a extensão UUID se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de Usuários (Estendendo a auth.users do Supabase)
-- Esta tabela armazena informações públicas dos usuários
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefone TEXT,
    tipo_usuario TEXT CHECK (tipo_usuario IN ('passageiro', 'motorista', 'admin')) DEFAULT 'passageiro',
    foto_perfil_url TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de Detalhes do Motorista
CREATE TABLE IF NOT EXISTS public.motoristas (
    usuario_id UUID PRIMARY KEY REFERENCES public.usuarios(id) ON DELETE CASCADE,
    cpf TEXT UNIQUE,
    modelo_veiculo TEXT,
    placa_veiculo TEXT,
    cor_veiculo TEXT,
    cnh_url TEXT, -- URL do documento na Storage
    documento_veiculo_url TEXT, -- URL do documento na Storage
    status_aprovacao TEXT CHECK (status_aprovacao IN ('pendente', 'aprovado', 'rejeitado')) DEFAULT 'pendente',
    status_online BOOLEAN DEFAULT FALSE,
    avaliacao_media NUMERIC(3, 2) DEFAULT 5.00,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Criar tabela de Viagens (Corridas)
CREATE TABLE IF NOT EXISTS public.viagens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    passageiro_id UUID REFERENCES public.usuarios(id),
    motorista_id UUID REFERENCES public.motoristas(usuario_id),
    origem_endereco TEXT NOT NULL,
    origem_lat NUMERIC,
    origem_lng NUMERIC,
    destino_endereco TEXT NOT NULL,
    destino_lat NUMERIC,
    destino_lng NUMERIC,
    data_hora_agendada TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('pendente', 'aceita', 'em_andamento', 'concluida', 'cancelada')) DEFAULT 'pendente',
    valor_estimado NUMERIC(10, 2),
    valor_final NUMERIC(10, 2),
    avaliacao_motorista INTEGER CHECK (avaliacao_motorista BETWEEN 1 AND 5),
    comentario_passageiro TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de Anúncios (Para a Home)
CREATE TABLE IF NOT EXISTS public.anuncios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    imagem_url TEXT,
    link_acao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    criado_por UUID REFERENCES public.usuarios(id), -- Admin que criou
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de Postagens do Blog
CREATE TABLE IF NOT EXISTS public.postagens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    titulo TEXT NOT NULL,
    slug TEXT UNIQUE, -- Para URLs amigáveis
    categoria TEXT CHECK (categoria IN ('noticias', 'dicas', 'promocoes', 'avisos')),
    conteudo TEXT NOT NULL,
    imagem_capa_url TEXT,
    autor_id UUID REFERENCES public.usuarios(id),
    publicado BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de Mensagens (Chat)
CREATE TABLE IF NOT EXISTS public.mensagens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    viagem_id UUID REFERENCES public.viagens(id), -- Opcional, se a msg for vinculada a uma viagem
    remetente_id UUID REFERENCES public.usuarios(id) NOT NULL,
    destinatario_id UUID REFERENCES public.usuarios(id) NOT NULL,
    conteudo TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    enviada_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de Suporte (Fale Conosco)
CREATE TABLE IF NOT EXISTS public.suporte (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    usuario_id UUID REFERENCES public.usuarios(id), -- Pode ser nulo se não logado
    nome TEXT, -- Caso não logado
    email TEXT, -- Caso não logado
    telefone TEXT,
    assunto TEXT,
    mensagem TEXT NOT NULL,
    status TEXT CHECK (status IN ('aberto', 'em_analise', 'resolvido')) DEFAULT 'aberto',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Configurar Row Level Security (RLS) - Segurança Básica

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motoristas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anuncios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suporte ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso (Exemplos)

-- Usuários: Todos podem ler perfis públicos (para motorista ver passageiro e vice-versa)
-- Mas apenas o próprio usuário pode editar seus dados
CREATE POLICY "Dados públicos de usuários são visíveis para todos autenticados" 
ON public.usuarios FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem atualizar seus próprios dados" 
ON public.usuarios FOR UPDATE USING (auth.uid() = id);

-- Motoristas: Leitura pública (para aparecer na lista), Edição apenas pelo próprio
CREATE POLICY "Motoristas visíveis publicamente" 
ON public.motoristas FOR SELECT USING (true);

CREATE POLICY "Motoristas editam seus próprios dados" 
ON public.motoristas FOR UPDATE USING (auth.uid() = usuario_id);

-- Viagens: Apenas o passageiro e o motorista envolvidos podem ver/editar
CREATE POLICY "Viagens visíveis para envolvidos" 
ON public.viagens FOR ALL USING (
    auth.uid() = passageiro_id OR auth.uid() = motorista_id
);

-- Anúncios e Postagens: Leitura pública, Escrita apenas Admins (simplificado aqui para authenticated por enquanto, idealmente checar flag admin)
CREATE POLICY "Anúncios visíveis para todos" 
ON public.anuncios FOR SELECT USING (true);

CREATE POLICY "Postagens visíveis para todos" 
ON public.postagens FOR SELECT USING (true);

-- Trigger para criar perfil de usuário automaticamente ao cadastrar no Auth
-- Função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome, email, tipo_usuario)
  VALUES (new.id, new.raw_user_meta_data->>'nome', new.email, COALESCE(new.raw_user_meta_data->>'tipo_usuario', 'passageiro'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

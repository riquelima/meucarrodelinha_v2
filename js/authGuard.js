/**
 * authGuard.js
 * Protege páginas que exigem login.
 * Incluir este script nas páginas como passageiro.html, motorista.html, etc.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Tenta pegar a sessão atual
    if (!window.supabaseClient) return;

    const { data: { session }, error } = await window.supabaseClient.auth.getSession();

    if (error || !session) {
        // Redireciona para a homepage se não estiver logado (evita o loop do splash screen)
        window.location.href = 'homepage.html';
        return;
    }

    const { user } = session;
    const currentPath = window.location.pathname;

    // Busca o tipo_usuario real no banco para garantir consistência
    const { data: userData, error: fetchError } = await window.supabaseClient
        .from('usuarios')
        .select('tipo_usuario, foto_perfil_url')
        .eq('id', user.id)
        .single();

    if (fetchError || !userData) {
        console.error('Erro ao verificar perfil do usuário:', fetchError);
        // Em caso de erro crítico no banco, podemos decidir se deslogamos ou permitimos
        return;
    }

    const tipoUsuario = userData.tipo_usuario;

    // Foto de Perfil Obrigatória para Motoristas
    if (tipoUsuario === 'motorista') {
        if (!userData.foto_perfil_url && !currentPath.includes('perfilMotorista.html')) {
            window.location.href = 'perfilMotorista.html';
            return;
        }
    }

    // Proteção de rotas do Motorista
    const motoristaPages = ['motorista.html', 'historicoViagens.html', 'meusganhos.html', 'perfilMotorista.html', 'mensagensMotorista.html', 'chatMotorista.html'];
    const isMotoristaPage = motoristaPages.some(page => currentPath.includes(page));

    if (isMotoristaPage && tipoUsuario !== 'motorista' && tipoUsuario !== 'admin') {
        console.warn("Acesso negado: área de motorista tentada por", tipoUsuario);
        window.location.href = 'passageiro.html';
        return;
    }

    // Proteção de rotas do Passageiro
    const passageiroPages = ['passageiro.html', 'minhasViagens.html', 'perfilPassageiro.html', 'mensagens.html', 'chat.html', 'agendarViagem.html', 'viagemSolicitada.html'];
    const isPassageiroPage = passageiroPages.some(page => currentPath.includes(page));

    if (isPassageiroPage && tipoUsuario !== 'passageiro' && tipoUsuario !== 'admin') {
        console.warn("Acesso negado: área de passageiro tentada por", tipoUsuario);
        window.location.href = 'motorista.html';
        return;
    }

    // Proteção de rotas do Admin
    if ((currentPath.includes('admin.html') || currentPath.includes('gerenciar') || currentPath.includes('perfilAdministrador.html')) && tipoUsuario !== 'admin') {
        alert("Acesso restrito ao administrador.");
        window.location.href = 'passageiro.html';
        return;
    }

    // Exibe ou oculta elementos baseados no login (opcional)
    document.body.classList.remove('hidden-until-auth');
});

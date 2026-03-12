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
        // Redireciona para fora (tela inicial) se não estiver logado
        window.location.href = 'index.html';
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
    if (currentPath.includes('motorista.html') && tipoUsuario !== 'motorista' && tipoUsuario !== 'admin') {
        alert("Acesso negado. Esta área é exclusiva para motoristas.");
        window.location.href = 'passageiro.html';
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

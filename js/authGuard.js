/**
 * authGuard.js
 * Protege páginas que exigem login.
 * Incluir este script nas páginas como passageiro.html, motorista.html, etc.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Tenta pegar a sessão atual
    if (!window.supabaseClient) return;

    let session = null;
    let user = null;
    let customSession = false;

    // 1. Tenta Supabase
    const { data: { session: sbSession }, error } = await window.supabaseClient.auth.getSession();
    if (sbSession) {
        session = sbSession;
        user = session.user;
    } else {
        // 2. Tenta Custom Session
        const custom = localStorage.getItem('mcl_custom_session');
        if (custom) {
            const parsed = JSON.parse(custom);
            session = parsed;
            user = parsed.user;
            customSession = true;
        } else {
            // 3. Tenta sessão migrada
            const migrado = localStorage.getItem('mcl_migrado');
            if (migrado) {
                const parsed = JSON.parse(migrado);
                session = { user: parsed };
                user = parsed;
                customSession = true;
            }
        }
    }

    if (!session || !user) {
        window.location.replace('homepage.html');
        return;
    }

    const currentPath = window.location.pathname;
    let userData = null;

    if (!customSession) {
        // Busca o tipo_usuario real no banco (usuários novos/Supabase)
        const { data, error: fetchError } = await window.supabaseClient
            .from('usuarios')
            .select('tipo_usuario, foto_perfil_url')
            .eq('id', user.id)
            .single();
        userData = data;
    } else {
        // Usuários migrados já têm os dados na sessão
        userData = user;
    }

    if (!userData) {
        console.warn('Dados de usuário não encontrados.');
        // Se for uma sessão customizada, os dados já devem estar lá. 
        // Se for Supabase e não achar no banco 'usuarios', talvez o cadastro esteja incompleto.
        if (!customSession) {
            // Pode decidir redirecionar ou não.
        }
    }

    const tipoUsuario = userData?.tipo_usuario || userData?.role || 'passageiro';

    // Proteção de rotas do Motorista
    const motoristaPages = ['motorista.html', 'historicoViagens.html', 'meusganhos.html', 'perfilMotorista.html', 'mensagensMotorista.html', 'chatMotorista.html'];
    const isMotoristaPage = motoristaPages.some(page => currentPath.includes(page));

    if (isMotoristaPage && tipoUsuario !== 'motorista' && tipoUsuario !== 'admin') {
        window.location.replace('passageiro.html');
        return;
    }

    // Proteção de rotas do Passageiro
    const passageiroPages = ['passageiro.html', 'minhasViagens.html', 'perfilPassageiro.html', 'mensagens.html', 'chat.html', 'agendarViagem.html', 'viagemSolicitada.html'];
    const isPassageiroPage = passageiroPages.some(page => currentPath.includes(page));

    if (isPassageiroPage && tipoUsuario !== 'passageiro' && tipoUsuario !== 'admin') {
        window.location.replace('motorista.html');
        return;
    }

    if ((currentPath.includes('admin.html') || currentPath.includes('gerenciar') || currentPath.includes('perfilAdministrador.html')) && tipoUsuario !== 'admin') {
        window.location.replace('passageiro.html');
        return;
    }

    document.body.classList.remove('hidden-until-auth');
});

window.handleLogout = async function() {
    if (window.supabaseClient) {
        await window.supabaseClient.auth.signOut();
    }
    localStorage.removeItem('mcl_custom_session');
    localStorage.removeItem('mcl_migrado');
    window.location.replace('index.html');
};

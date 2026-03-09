/**
 * authGuard.js
 * Protege páginas que exigem login.
 * Incluir este script nas páginas como passageiro.html, motorista.html, etc.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Tenta pegar a sessão atual
    const { data: { session }, error } = await supabaseClient.auth.getSession();

    if (error || !session) {
        // Redireciona para fora (tela inicial) se não estiver logado
        window.location.href = 'index.html';
        return;
    }

    const { user } = session;

    // Você pode fazer verificações extras aqui (ex: se um passageiro tentar acessar a área do motorista)
    const tipoUsuario = user.user_metadata?.tipo_usuario;
    const currentPath = window.location.pathname;

    if (currentPath.includes('motorista.html') && tipoUsuario !== 'motorista' && tipoUsuario !== 'admin') {
        const confirmMsg = confirm("Acesso negado. Você precisa ser motorista para acessar aqui. Voltar pro início?");
        if (confirmMsg) {
            window.location.href = 'passageiro.html';
        }
    }

    if (currentPath.includes('passageiro.html') && tipoUsuario !== 'passageiro' && tipoUsuario !== 'admin') {
        // Opcional, alguns motoristas também podem acessar a versão de passageiro. 
        // window.location.href = 'motorista.html';
    }

    // Exibe ou oculta elementos baseados no login
    document.body.classList.remove('hidden-until-auth');
});

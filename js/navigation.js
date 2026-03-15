/**
 * navigation.js
 * Lógica inteligente para o botão "Voltar".
 */

window.goBack = async function() {
    // Prioridade: Se o usuário veio da Home, ele deve voltar para a Home
    const referrer = document.referrer;
    if (referrer && (referrer.includes('homepage.html') || referrer.includes('index.html'))) {
        window.location.href = 'homepage.html';
        return;
    }

    try {
        if (!window.supabaseClient) {
            window.location.href = 'homepage.html';
            return;
        }

        const { data: { session } } = await window.supabaseClient.auth.getSession();
        
        if (!session) {
            window.location.href = 'homepage.html';
            return;
        }

        const { data: userData, error } = await window.supabaseClient
            .from('usuarios')
            .select('tipo_usuario')
            .eq('id', session.user.id)
            .single();

        if (error || !userData) {
            window.location.href = 'homepage.html';
            return;
        }

        // Redirecionamento baseado no tipo de usuário
        switch (userData.tipo_usuario) {
            case 'admin':
                // Se estiver em telas de criação específicas de admin, pode ser melhor voltar para o painel admin
                window.location.href = 'admin.html';
                break;
            case 'motorista':
                window.location.href = 'motorista.html';
                break;
            case 'passageiro':
                window.location.href = 'passageiro.html';
                break;
            default:
                window.location.href = 'homepage.html';
        }
    } catch (err) {
        console.error('Erro na navegação:', err);
        window.location.href = 'homepage.html';
    }
};

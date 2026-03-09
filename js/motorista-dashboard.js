
// Logic to handle driver data on the dashboard
document.addEventListener('DOMContentLoaded', async () => {
    const supabaseClient = window.supabaseClient;
    // Check if user is logged in (handled by authGuard but double check for data)
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (user) {
        // Fetch driver profile data
        const { data: driverData, error } = await supabaseClient
            .from('usuarios')
            .select('nome, foto_perfil_url')
            .eq('id', user.id)
            .single();

        if (driverData) {
            // Update greeting with first name only
            const firstName = driverData.nome.split(' ')[0];
            const greetingElement = document.getElementById('header-username');
            if (greetingElement) greetingElement.textContent = firstName;

            // Update avatar if available
            if (driverData.foto_perfil_url) {
                const avatarElement = document.getElementById('header-avatar');
                if (avatarElement) avatarElement.src = driverData.foto_perfil_url;
            }
        }
        
        // Fetch driver specific stats (rating)
        const { data: driverStats } = await supabaseClient
            .from('motoristas')
            .select('avaliacao_media')
            .eq('usuario_id', user.id)
            .single();
            
        if (driverStats) {
             const ratingElement = document.getElementById('header-rating');
             if (ratingElement) ratingElement.textContent = driverStats.avaliacao_media || '5.0';
        }
    }
});

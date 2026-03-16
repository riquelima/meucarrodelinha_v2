
// Logic to handle driver data and online status on the dashboard
document.addEventListener('DOMContentLoaded', async () => {
    const supabaseClient = window.supabaseClient;
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) return;

    // Elements
    const toggleBtn = document.getElementById('toggle-online-btn');
    const toggleIcon = document.getElementById('toggle-icon');
    const toggleText = document.getElementById('toggle-text');
    const statusText = document.getElementById('status-text');
    const notificationContainer = document.getElementById('notification-container');
    const notificationBox = document.getElementById('notification-box');
    const notificationIcon = document.getElementById('notification-icon');
    const notificationText = document.getElementById('notification-text');

    let currentOnlineStatus = false;

    // --- UI Helper Actions ---
    function updateOnlineUI(isOnline) {
        currentOnlineStatus = isOnline;
        if (isOnline) {
            // Online State
            toggleBtn?.classList.remove('bg-primary', 'shadow-primary/20', 'text-white');
            toggleBtn?.classList.add('bg-slate-700', 'text-slate-300', 'shadow-none');
            if (toggleText) toggleText.textContent = 'Ficar Offline';
            if (statusText) {
                statusText.textContent = 'Você está online e visível para passageiros';
                statusText.classList.add('text-green-500');
                statusText.classList.remove('text-slate-500');
            }
        } else {
            // Offline State
            toggleBtn?.classList.add('bg-primary', 'shadow-primary/20', 'text-white');
            toggleBtn?.classList.remove('bg-slate-700', 'text-slate-300', 'shadow-none');
            if (toggleText) toggleText.textContent = 'Ficar Online';
            if (statusText) {
                statusText.textContent = 'Você está offline no momento';
                statusText.classList.remove('text-green-500');
                statusText.classList.add('text-slate-500');
            }
        }
    }

    function showNotification(message, isOnlineStatus) {
        if (!notificationText || !notificationBox || !notificationContainer || !notificationIcon) return;
        
        notificationText.textContent = message;
        if (isOnlineStatus) {
            notificationBox.classList.remove('bg-slate-700');
            notificationBox.classList.add('bg-green-500');
            notificationIcon.textContent = 'check_circle';
        } else {
            notificationBox.classList.remove('bg-green-500');
            notificationBox.classList.add('bg-slate-700');
            notificationIcon.textContent = 'power_settings_new';
        }

        notificationContainer.classList.remove('-translate-y-full');
        setTimeout(() => {
            notificationContainer.classList.add('-translate-y-full');
        }, 3000);
    }

    // --- Data Management ---

    async function toggleStatus() {
        if (!user) return;
        const newStatus = !currentOnlineStatus;
        
        // Optimistic UI update or wait for DB? Let's wait for DB for consistency.
        const { error } = await supabaseClient
            .from('motoristas')
            .update({ status_online: newStatus })
            .eq('usuario_id', user.id);

        if (error) {
            console.error("Erro ao atualizar status:", error);
            showNotification('Erro ao atualizar status', false);
            return;
        }

        updateOnlineUI(newStatus);
        showNotification(newStatus ? 'Você está online' : 'Você está offline', newStatus);
    }

    // Initialize Dashboard Data
    async function initDashboard() {
        // Fetch profile and driver stats
        const [userData, driverStats] = await Promise.all([
            supabaseClient.from('usuarios').select('nome, foto_perfil_url').eq('id', user.id).single(),
            supabaseClient.from('motoristas').select('avaliacao_media, status_online').eq('usuario_id', user.id).single()
        ]);

        // Update User info
        if (userData.data) {
            const firstName = userData.data.nome.split(' ')[0];
            const greetingElement = document.getElementById('header-username');
            if (greetingElement) greetingElement.textContent = firstName;
            if (userData.data.foto_perfil_url) {
                const avatarElement = document.getElementById('header-avatar');
                if (avatarElement) avatarElement.src = userData.data.foto_perfil_url;
            }
        }

        // Update Driver stats and status
        if (driverStats.data) {
            const ratingElement = document.getElementById('header-rating');
            if (ratingElement) ratingElement.textContent = parseFloat(driverStats.data.avaliacao_media || 5.0).toFixed(1);
            
            updateOnlineUI(driverStats.data.status_online);
        }
    }

    // Events
    toggleBtn?.addEventListener('click', toggleStatus);

    // Initial Load
    initDashboard();
});

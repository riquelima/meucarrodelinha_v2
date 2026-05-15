
// Logic to handle driver data and online status on the dashboard
document.addEventListener('DOMContentLoaded', async () => {
    const supabaseClient = window.supabaseClient;

    // Check if migrated user (from localStorage)
    const customSession = localStorage.getItem('mcl_custom_session');
    const migradoData = localStorage.getItem('mcl_migrado');
    const isMigrated = !!(customSession || migradoData);
    let migratedUser = null;
    if (isMigrated) {
        const parsed = customSession ? JSON.parse(customSession) : JSON.parse(migradoData);
        migratedUser = parsed.user || parsed;
    }

    // Try Supabase auth first, fall back to migrated user
    const { data: { user: authUser } } = await supabaseClient.auth.getUser();
    const user = authUser || migratedUser;
    
    if (!user) return;

    // Elements
    const toggleBtn = document.getElementById('toggle-online-btn');
    const toggleIcon = document.getElementById('toggle-icon');
    const toggleText = document.getElementById('toggle-text');
    const statusText = document.getElementById('status-text');
    const statusLabel = document.getElementById('status-label');
    const notificationContainer = document.getElementById('notification-container');
    const notificationBox = document.getElementById('notification-box');
    const notificationIcon = document.getElementById('notification-icon');
    const notificationText = document.getElementById('notification-text');

    let currentOnlineStatus = false;

    // --- UI Helper Actions ---
    function updateOnlineUI(isOnline) {
        currentOnlineStatus = isOnline;
        const hint = document.getElementById('online-hint');
        if (isOnline) {
            toggleBtn?.classList.remove('bg-primary', 'shadow-primary/20', 'text-white');
            toggleBtn?.classList.add('bg-slate-800', 'text-slate-400', 'border', 'border-white/5');
            if (toggleText) toggleText.textContent = 'Ficar Offline';
            if (statusLabel) {
                statusLabel.textContent = 'Online';
                statusLabel.classList.add('text-green-400');
                statusLabel.classList.remove('text-slate-400');
            }
            if (hint) hint.classList.add('hidden');
        } else {
            toggleBtn?.classList.add('bg-primary', 'shadow-primary/20', 'text-white');
            toggleBtn?.classList.remove('bg-slate-800', 'text-slate-400', 'border', 'border-white/5');
            if (toggleText) toggleText.textContent = 'Ficar Online';
            if (statusLabel) {
                statusLabel.textContent = 'Offline';
                statusLabel.classList.remove('text-green-400');
                statusLabel.classList.add('text-slate-400');
            }
            if (hint) hint.classList.remove('hidden');
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

        if (isMigrated) {
            updateOnlineUI(newStatus);
            showNotification(newStatus ? 'Você está online' : 'Você está offline', newStatus);
            return;
        }
        
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
        if (isMigrated && migratedUser) {
            const nome = migratedUser.nome || 'Motorista';
            const avatar = migratedUser.avatar || null;
            const firstName = nome.split(' ')[0];

            const greetingElement = document.getElementById('header-username');
            if (greetingElement) greetingElement.textContent = firstName;

            if (avatar) {
                const avatarElement = document.getElementById('header-avatar');
                if (avatarElement) avatarElement.src = avatar;
                const profileAvatar = document.getElementById('profile-avatar');
                if (profileAvatar) profileAvatar.src = avatar;
            }

            const ratingElement = document.getElementById('header-rating');
            if (ratingElement) ratingElement.textContent = '5.0';

            updateOnlineUI(migratedUser.status_online === true);

            const profileNameEl = document.getElementById('profile-name');
            if (profileNameEl) profileNameEl.textContent = nome;
            const profileEmailEl = document.getElementById('profile-email');
            if (profileEmailEl && migratedUser.email) profileEmailEl.textContent = migratedUser.email;

            return;
        }

        const [userData, driverStats] = await Promise.all([
            supabaseClient.from('usuarios').select('nome, foto_perfil_url').eq('id', user.id).single(),
            supabaseClient.from('motoristas').select('avaliacao_media, status_online').eq('usuario_id', user.id).single()
        ]);

        if (userData.data) {
            const firstName = userData.data.nome.split(' ')[0];
            const greetingElement = document.getElementById('header-username');
            if (greetingElement) greetingElement.textContent = firstName;
            if (userData.data.foto_perfil_url) {
                const avatarElement = document.getElementById('header-avatar');
                if (avatarElement) avatarElement.src = userData.data.foto_perfil_url;
                const profileAvatar = document.getElementById('profile-avatar');
                if (profileAvatar) profileAvatar.src = userData.data.foto_perfil_url;
            }
        }

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

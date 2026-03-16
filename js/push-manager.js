/**
 * Gerenciador de Notificações Push para o app Meu Carro de Linha Salinas.
 */
const PushManager = {
    // Chave VAPID Pública oficial do projeto
    publicVapidKey: 'BOzm_7bkKsXs-s7nvH2YArjW8uQ_Sd0J4dludLNkAX91MGa6DRf7UKrQwY9bzuOQos7HmBKVg9GDlYQzmotvL50',

    async init() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications não são suportados neste navegador.');
            return;
        }

        // Verifica se já temos permissão
        if (Notification.permission === 'granted') {
            await this.subscribeUser();
        }
    },

    async requestPermission() {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Permissão concedida para notificações.');
            await this.subscribeUser();
            return true;
        } else {
            console.warn('Permissão negada para notificações.');
            return false;
        }
    },

    async subscribeUser() {
        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Verifica inscrição existente
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                await this.saveSubscriptionToSupabase(existingSubscription);
                return;
            }

            // Cria nova inscrição
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.publicVapidKey)
            });

            console.log('Usuário inscrito com sucesso:', subscription);
            await this.saveSubscriptionToSupabase(subscription);

        } catch (error) {
            console.error('Falha ao inscrever o usuário:', error);
        }
    },

    async saveSubscriptionToSupabase(subscription) {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) {
                console.log('Usuário não logado, inscrição não salva no banco.');
                return;
            }

            // Salva ou atualiza no banco
            const { error } = await window.supabaseClient
                .from('push_subscriptions')
                .upsert({
                    user_id: user.id,
                    subscription: subscription,
                    device_info: {
                        userAgent: navigator.userAgent,
                        platform: navigator.platform
                    }
                }, { onConflict: 'user_id, subscription' });

            if (error) throw error;
            console.log('Assinatura salva no Supabase com sucesso.');

        } catch (error) {
            console.error('Erro ao salvar assinatura no Supabase:', error);
        }
    },

    // Utilitário para converter a chave VAPID
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
};

// Inicializa quando o app carregar
// PushManager.init();

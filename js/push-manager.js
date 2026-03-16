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

        // Tenta sincronizar se já tivermos permissão
        if (Notification.permission === 'granted') {
            await this.subscribeUser();
        }

        // Listener para vincular usuário após login (se ele permitir enquanto deslogado)
        window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && Notification.permission === 'granted') {
                console.log('Usuário logou, sincronizando assinatura push...');
                await this.subscribeUser();
            }
        });
    },

    /**
     * Exibe o prompt de permissão apenas uma vez se ainda não foi decidido.
     */
    async promptOnce() {
        const hasPrompted = localStorage.getItem('push_prompt_seen');
        
        if (!hasPrompted && Notification.permission === 'default') {
            console.log('Exibindo prompt de notificação inicial...');
            
            // Pequeno delay para não assustar o usuário na primeira carga
            setTimeout(async () => {
                const granted = await this.requestPermission();
                localStorage.setItem('push_prompt_seen', 'true');
                if (granted) {
                    console.log('Usuário aceitou as notificações no prompt inicial.');
                }
            }, 3000);
        }
    },

    async requestPermission() {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                await this.subscribeUser();
                return true;
            }
            return false;
        } catch (err) {
            console.error('Erro ao solicitar permissão:', err);
            return false;
        }
    },

    async subscribeUser() {
        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Cria ou recupera inscrição
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.publicVapidKey)
            });

            await this.saveSubscriptionToSupabase(subscription);
            return subscription;

        } catch (error) {
            console.warn('Falha ao inscrever o usuário (provavelmente permissão negada):', error);
        }
    },

    async saveSubscriptionToSupabase(subscription) {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            
            // Prepara o objeto de salvamento
            const payload = {
                endpoint: subscription.endpoint,
                subscription: subscription,
                device_info: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    lastSync: new Date().toISOString()
                }
            };

            // Se o usuário estiver logado, vincula o ID
            if (user) {
                payload.user_id = user.id;
            }

            // Salva ou atualiza no banco
            const { error } = await window.supabaseClient
                .from('push_subscriptions')
                .upsert(payload, { 
                    onConflict: 'endpoint' // Usamos apenas endpoint para conflito se user_id puder ser nulo
                });

            if (error) {
                console.error('Erro ao salvar assinatura no Supabase:', error);
                throw error;
            }
            console.log('Assinatura persistida no Supabase.');

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
window.PushManager = PushManager;
// PushManager.init();

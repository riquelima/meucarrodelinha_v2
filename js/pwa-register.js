/**
 * PWA Register
 * Gerencia o registro do Service Worker e notificações de atualização.
 */

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('[PWA] Service Worker registrado com sucesso:', registration.scope);

                // BACKGROUND SYNC - Registra tag de sincronização
                if ('sync' in registration) {
                    registration.sync.register('sync-messages')
                        .catch(err => console.log('[PWA] Erro ao registrar Background Sync:', err));
                }

                // PERIODIC SYNC - Registra sincronização periódica (requer permissão e instalação)
                if ('periodicSync' in registration) {
                    const status = localStorage.getItem('periodic-sync-status');
                    if (!status) {
                        registration.periodicSync.register('update-cache', {
                            minInterval: 24 * 60 * 60 * 1000 // 24 horas
                        }).then(() => localStorage.setItem('periodic-sync-status', 'registered'))
                        .catch(err => console.log('[PWA] Erro ao registrar Periodic Sync:', err));
                    }
                }

                // NOTIFICAÇÕES - Removido daqui pois agora é gerenciado pelo PushManager no menu.html
                /*
                if ('Notification' in window && Notification.permission === 'default') {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            console.log('[PWA] Permissão de notificação concedida.');
                        }
                    });
                }
                */

                // Detecta atualizações no Service Worker
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Nova versão disponível!
                            console.log('[PWA] Nova versão disponível em background.');
                        }
                    });
                });
            })
            .catch(error => {
                console.error('[PWA] Erro ao registrar Service Worker:', error);
            });
    });

    // Recarrega a página quando o novo Service Worker assume o controle
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            window.location.reload();
            refreshing = true;
        }
    });
}

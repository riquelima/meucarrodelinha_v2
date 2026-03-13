/**
 * PWA Register
 * Gerencia o registro do Service Worker e notificações de atualização.
 */

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('[PWA] Service Worker registrado com sucesso:', registration.scope);

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

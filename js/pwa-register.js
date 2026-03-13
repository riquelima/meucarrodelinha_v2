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
                            showUpdateToast();
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

/**
 * Mostra um aviso discreto de que há uma nova versão disponível
 */
function showUpdateToast() {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-24 left-4 right-4 z-[9999] bg-primary text-white p-4 rounded-xl shadow-2xl flex items-center justify-between animate-slide-up';
    toast.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="material-symbols-outlined">update</span>
            <div class="flex flex-col">
                <span class="font-bold text-sm">Nova versão disponível</span>
                <span class="text-xs opacity-90">Atualize para as melhorias mais recentes.</span>
            </div>
        </div>
        <button id="btn-update-app" class="bg-white text-primary px-4 py-2 rounded-lg font-bold text-xs active:scale-95 transition-transform">
            ATUALIZAR
        </button>
    `;

    document.body.appendChild(toast);

    document.getElementById('btn-update-app').addEventListener('click', () => {
        // Envia mensagem para o SW pular a espera e ativar imediatamente
        navigator.serviceWorker.getRegistration().then(reg => {
            if (reg.waiting) {
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            } else {
                window.location.reload();
            }
        });
    });
}

(function() {
    'use strict';

    // ===== SERVICE WORKER: Desregistrar qualquer SW existente =====
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for (var i = 0; i < registrations.length; i++) {
                registrations[i].unregister();
                console.log('[PWA] Service Worker desregistrado');
            }
        });
    }

    var deferredPrompt = null;
    var installPromptShown = false;

    // Detecta iOS
    var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var isHomepage = window.location.pathname === '/' || window.location.pathname.endsWith('homepage.html');

    // Só mostra o banner na homepage (nunca na splash screen)
    if (!isHomepage) return;

    // Intercepta o beforeinstallprompt (Android Chrome)
    window.addEventListener('beforeinstallprompt', function(e) {
        e.preventDefault();
        deferredPrompt = e;
        if (!installPromptShown) {
            mostrarPromptInstalacao(false);
        }
    });

    // iOS: mostra prompt customizado após alguns segundos (sem beforeinstallprompt)
    if (isIOS && !window.matchMedia('(display-mode: standalone)').matches && !window.matchMedia('(display-mode: fullscreen)').matches) {
        try {
            var iosDismissed = localStorage.getItem('pwa-ios-dismissed');
            if (!iosDismissed || (Date.now() - parseInt(iosDismissed) > 7 * 24 * 60 * 60 * 1000)) {
                setTimeout(function() {
                    if (!installPromptShown) {
                        mostrarPromptInstalacao(true);
                    }
                }, 3000);
            }
        } catch(e) {}
    }

    function mostrarPromptInstalacao(isIOS) {
        var banner = document.createElement('div');
        banner.id = 'pwa-install-banner';
        var baseStyles = 'position:fixed;bottom:100px;left:16px;right:16px;z-index:99999;background:linear-gradient(135deg,#1a2233,#121520);border:1px solid rgba(249,115,22,0.3);border-radius:20px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,0.6),0 0 40px rgba(249,115,22,0.1);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);transform:translateY(30px);opacity:0;transition:all 0.5s cubic-bezier(0.16,1,0.3,1);max-width:400px;margin:0 auto';

        if (isIOS) {
            var iosKey = 'pwa-ios-dismissed';
            banner.style.cssText = baseStyles;
            banner.innerHTML = '<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px"><div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#f97316,#ea580c);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 8px 24px rgba(249,115,22,0.3)"><span class="material-symbols-outlined" style="color:white;font-size:26px">install_mobile</span></div><div><p style="color:white;font-weight:700;font-size:15px;margin:0;line-height:1.3">Instalar no iPhone</p><p style="color:rgba(255,255,255,0.5);font-size:12px;margin:2px 0 0 0">Toque em <b style="color:rgba(255,255,255,0.7)">Compartilhar</b> <span style="display:inline-block;vertical-align:middle;font-size:16px">⬆️</span> e depois <b style="color:rgba(255,255,255,0.7)">Adicionar à Tela de Início</b></p></div></div><div style="display:flex;gap:10px"><button id="pwa-install-btn" style="flex:1;padding:12px;border:none;border-radius:14px;background:#f97316;color:white;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 4px 16px rgba(249,115,22,0.3);transition:all 0.2s">Entendi</button><button id="pwa-dismiss-btn" style="padding:12px 16px;border:1px solid rgba(255,255,255,0.1);border-radius:14px;background:transparent;color:rgba(255,255,255,0.5);font-size:14px;cursor:pointer;transition:all 0.2s">Agora não</button></div>';

            document.body.appendChild(banner);

            requestAnimationFrame(function() {
                banner.style.transform = 'translateY(0)';
                banner.style.opacity = '1';
            });

            document.getElementById('pwa-install-btn').addEventListener('click', function() {
                fecharBanner(banner, iosKey);
            });
            document.getElementById('pwa-dismiss-btn').addEventListener('click', function() {
                fecharBanner(banner, iosKey);
            });
        } else {
            banner.style.cssText = baseStyles;
            banner.innerHTML = '<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px"><div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#f97316,#ea580c);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 8px 24px rgba(249,115,22,0.3)"><span class="material-symbols-outlined" style="color:white;font-size:26px">install_mobile</span></div><div><p style="color:white;font-weight:700;font-size:15px;margin:0;line-height:1.3">Instalar Carro de Linha</p><p style="color:rgba(255,255,255,0.5);font-size:12px;margin:2px 0 0 0">Adicione à tela inicial para acesso rápido</p></div></div><div style="display:flex;gap:10px"><button id="pwa-install-btn" style="flex:1;padding:12px;border:none;border-radius:14px;background:#f97316;color:white;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 4px 16px rgba(249,115,22,0.3);transition:all 0.2s">Instalar</button><button id="pwa-dismiss-btn" style="padding:12px 16px;border:1px solid rgba(255,255,255,0.1);border-radius:14px;background:transparent;color:rgba(255,255,255,0.5);font-size:14px;cursor:pointer;transition:all 0.2s">Agora não</button></div>';

            document.body.appendChild(banner);

            requestAnimationFrame(function() {
                banner.style.transform = 'translateY(0)';
                banner.style.opacity = '1';
            });

            document.getElementById('pwa-install-btn').addEventListener('click', function() {
                installPromptShown = true;
                banner.style.transform = 'translateY(30px)';
                banner.style.opacity = '0';
                setTimeout(function() { banner.remove(); }, 500);
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then(function(choiceResult) {
                        if (choiceResult.outcome === 'accepted') {
                            console.log('[PWA] Usuário instalou o app');
                        } else {
                            console.log('[PWA] Usuário recusou a instalação');
                        }
                        deferredPrompt = null;
                    });
                }
            });

            document.getElementById('pwa-dismiss-btn').addEventListener('click', function() {
                fecharBanner(banner, 'pwa-install-dismissed');
            });
        }

        function fecharBanner(el, storageKey) {
            installPromptShown = true;
            el.style.transform = 'translateY(30px)';
            el.style.opacity = '0';
            setTimeout(function() { el.remove(); }, 500);
            try { localStorage.setItem(storageKey, Date.now().toString()); } catch(e) {}
        }
    }

    // ===== SERVICE WORKER: Atualização forçada para evitar cache obsoleto =====
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for (var i = 0; i < registrations.length; i++) {
                var reg = registrations[i];
                if (reg.active) {
                    // Verifica se o SW está desatualizado e força atualização
                    reg.update().catch(function(err) {
                        console.log('[PWA] SW update check failed:', err);
                    });
                    // Escuta por nova versão disponível
                    reg.addEventListener('updatefound', function() {
                        var newWorker = reg.installing;
                        newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('[PWA] Nova versão disponível — recarregando');
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                                setTimeout(function() { window.location.reload(); }, 500);
                            }
                        });
                    });
                }
            }
        });
    }

    // Verifica se já foi instalado
    if (window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches || window.matchMedia('(display-mode: minimal-ui)').matches) {
        try { localStorage.setItem('pwa-install-dismissed', 'installed'); } catch(e) {}
    }

    // Re-mostrar se passou 7 dias desde o dismiss
    try {
        var dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed && dismissed !== 'installed') {
            var diff = Date.now() - parseInt(dismissed);
            if (diff < 7 * 24 * 60 * 60 * 1000) {
                installPromptShown = true; // Não mostrar de novo
            } else {
                localStorage.removeItem('pwa-install-dismissed');
            }
        }
    } catch(e) {}
})();

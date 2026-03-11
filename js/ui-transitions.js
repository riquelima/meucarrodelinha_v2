/**
 * ui-transitions.js
 * Gerencia efeitos de clique e animações de revelação.
 */

(function () {
    const UI = {
        init() {
            this.applyClickEffects();
            this.applyRevealAnimations();
            this.setupNavbarProtection();
            this.applyPageTransitions();
        },

        // Aplica efeito de scale em botões e links clicáveis
        applyClickEffects() {
            const selectors = 'button, a, .active-scale, .btn-click-effect';

            // Usando delegação de eventos para performance e suporte a elementos dinâmicos
            document.addEventListener('touchstart', (e) => {
                const target = e.target.closest(selectors);
                if (target && !target.classList.contains('no-effect')) {
                    target.style.transform = 'scale(0.96)';
                }
            }, { passive: true });

            document.addEventListener('touchend', (e) => {
                const target = e.target.closest(selectors);
                if (target) {
                    target.style.transform = 'scale(1)';
                }
            }, { passive: true });

            // Mouse events para desktop
            document.addEventListener('mousedown', (e) => {
                const target = e.target.closest(selectors);
                if (target && !target.classList.contains('no-effect')) {
                    target.style.transform = 'scale(0.96)';
                }
            });

            document.addEventListener('mouseup', (e) => {
                const target = e.target.closest(selectors);
                if (target) {
                    target.style.transform = 'scale(1)';
                }
            });
        },

        // Aplica a classe ui-reveal com atraso para elementos de lista
        applyRevealAnimations() {
            const listItems = document.querySelectorAll('#drivers-list-container > div, #view-recentes > div, #conversations-list > a, .menu-list > a, .stagger-item');

            listItems.forEach((item, index) => {
                item.classList.add('ui-reveal');
                if (![...item.classList].some(c => c.startsWith('stagger-'))) {
                    const delay = Math.min(index * 40, 300);
                    item.style.animationDelay = `${delay}ms`;
                }
            });
        },

        // Protege o Navbar contra qualquer transformação involuntária
        setupNavbarProtection() {
            const nav = document.querySelector('nav.fixed-navbar');
            if (nav) {
                // Garante que o nav nunca herde animações
                nav.style.animation = 'none';
                nav.style.transform = 'none';

                // Impede que eventos de clique na navbar causem transitions no container pai
                nav.addEventListener('click', (e) => {
                    // Prevenção opcional de efeitos colaterais
                }, { passive: true });
            }
        },

        // Aplica classe de transição na página se necessário
        applyPageTransitions() {
            const main = document.querySelector('main');
            if (main) {
                main.classList.add('page-enter');
            }
        },

        // Exibe um diálogo elegante personalizado
        showDialog(options = {}) {
            const { title = 'Aviso', message = '', icon = 'info', buttonText = 'OK', type = 'info' } = options;

            const oldDialog = document.querySelector('.dialog-overlay');
            if (oldDialog) oldDialog.remove();

            const overlay = document.createElement('div');
            overlay.className = 'dialog-overlay';

            const iconColor = type === 'error' ? 'text-red-500' : 'text-primary';

            overlay.innerHTML = `
                <div class="dialog-content text-center">
                    <div class="mb-4">
                        <span class="material-symbols-outlined text-5xl ${iconColor}">${icon}</span>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2">${title}</h3>
                    <p class="text-slate-400 mb-6 leading-relaxed">${message}</p>
                    <button class="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl active-scale transition-all">
                        ${buttonText}
                    </button>
                </div>
            `;

            document.body.appendChild(overlay);
            requestAnimationFrame(() => overlay.classList.add('active'));

            const btn = overlay.querySelector('button');
            btn.onclick = () => {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 300);
            };

            overlay.onclick = (e) => {
                if (e.target === overlay) btn.onclick();
            };
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => UI.init());
    } else {
        UI.init();
    }

    window.AppUI = UI;
})();

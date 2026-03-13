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

            document.addEventListener('mousedown', (e) => {
                const target = e.target.closest(selectors);
                if (target && !target.classList.contains('no-effect')) {
                    // Feedback visual via classe CSS para itens da navbar
                    if (target.closest('.fixed-navbar')) {
                        target.classList.add('navbar-item-active');
                        setTimeout(() => target.classList.remove('navbar-item-active'), 300);
                    } else {
                        target.style.transform = 'scale(0.96)';
                    }
                }
            });

            document.addEventListener('mouseup', (e) => {
                const target = e.target.closest(selectors);
                if (target && !target.closest('.fixed-navbar')) {
                    target.style.transform = 'scale(1)';
                }
            });

            // Touch events para mobile
            document.addEventListener('touchstart', (e) => {
                const target = e.target.closest(selectors);
                if (target && !target.classList.contains('no-effect')) {
                    if (target.closest('.fixed-navbar')) {
                        target.classList.add('navbar-item-active');
                        setTimeout(() => target.classList.remove('navbar-item-active'), 300);
                    } else {
                        target.style.transform = 'scale(0.96)';
                    }
                }
            }, { passive: true });

            document.addEventListener('touchend', (e) => {
                const target = e.target.closest(selectors);
                if (target && !target.closest('.fixed-navbar')) {
                    target.style.transform = 'scale(1)';
                }
            }, { passive: true });
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
                // Remove qualquer animação de entrada que possa ter sido aplicada ao body ou container
                nav.style.animation = 'none';
                nav.style.transform = 'none';
                nav.classList.remove('page-enter', 'content-enter');
            }
        },

        // Aplica classe de transição na página se necessário
        applyPageTransitions() {
            // Animar apenas o conteúdo principal, não a página inteira
            const main = document.querySelector('main');
            if (main) {
                main.classList.remove('page-enter'); // Remove legados
                main.classList.add('content-enter');
            }
            
            // Também animar headers se existirem e não forem a navbar
            const header = document.querySelector('header');
            if (header && !header.closest('.fixed-navbar')) {
                header.classList.add('content-enter');
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

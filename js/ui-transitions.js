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
        },

        // Aplica efeito de scale em botões e links clicáveis
        applyClickEffects() {
            const selectors = 'button, a, .active-scale, .btn-click-effect';
            document.addEventListener('mousedown', (e) => {
                const target = e.target.closest(selectors);
                if (target) {
                    target.style.transition = 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)';
                    target.style.transform = 'scale(0.95)';
                }
            });

            document.addEventListener('mouseup', (e) => {
                const target = e.target.closest(selectors);
                if (target) {
                    target.style.transform = 'scale(1)';
                }
            });

            document.addEventListener('touchstart', (e) => {
                const target = e.target.closest(selectors);
                if (target) {
                    target.style.transition = 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)';
                    target.style.transform = 'scale(0.95)';
                }
            }, { passive: true });

            document.addEventListener('touchend', (e) => {
                const target = e.target.closest(selectors);
                if (target) {
                    target.style.transform = 'scale(1)';
                }
            }, { passive: true });
        },

        // Aplica a classe ui-reveal com atraso para elementos de lista
        applyRevealAnimations() {
            // Itens de lista comuns nas telas do passageiro
            const listItems = document.querySelectorAll('#drivers-list-container > div, #view-recentes > div, #conversations-list > a, .menu-list > a');

            listItems.forEach((item, index) => {
                item.classList.add('ui-reveal');
                // Aplica o stagger dinamicamente se não houver classe stagger
                if (![...item.classList].some(c => c.startsWith('stagger-'))) {
                    const delay = Math.min(index * 50, 400);
                    item.style.animationDelay = `${delay}ms`;
                }
            });
        },

        // Protege o Navbar contra qualquer transformação involuntária
        setupNavbarProtection() {
            const nav = document.querySelector('nav');
            if (nav) {
                nav.classList.add('fixed-navbar');
                // Remove qualquer classe de animação que possa ter sido herdada
                nav.style.animation = 'none';
            }
        }
    };

    // Inicializa ao carregar o DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => UI.init());
    } else {
        UI.init();
    }

    // Expõe para uso global se necessário
    window.AppUI = UI;
})();

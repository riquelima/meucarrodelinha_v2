(function () {
    'use strict';

    var PN = {
        init: function () {
            this.setupNavigation();
            this.setupMicroInteractions();
        },

        setupNavigation: function () {
            var self = this;
            document.addEventListener('click', function (e) {
                var link = e.target.closest('a[href]');
                if (!link) return;
                var href = link.getAttribute('href');
                if (!href || href === '#' || href.startsWith('http') || href.startsWith('tel:') || href.startsWith('mailto:') || link.target === '_blank') return;

                var isBack = link.closest('.nav-back') !== null || href === 'homepage.html' || href.includes('homepage');
                e.preventDefault();
                self.navigate(href, isBack);
            });
        },

        navigate: function (url, isBack) {
            if (document.startViewTransition) {
                document.body.style.viewTransitionName = 'root';
                var t = document.startViewTransition(function () {
                    window.location.href = url;
                });
                t.finished.then(function () {});
            } else {
                document.body.classList.add('fade-out');
                var self = this;
                setTimeout(function () { window.location.href = url; }, 200);
            }
        },

        setupMicroInteractions: function () {
            var selectors = '.card-click, .blog-card, .post-card, .ad-card, .driver-card, .action-card, .menu-item, [class*="card"]:not(.no-effect), button:not(.no-effect):not([disabled])';

            function addTap(el) {
                if (el._hasTap) return;
                el._hasTap = true;
                el.addEventListener('touchstart', function () { if (!this.disabled) this.style.transform = 'scale(0.97)'; }, { passive: true });
                el.addEventListener('touchend', function () { this.style.transform = ''; }, { passive: true });
                el.addEventListener('mousedown', function () { if (!this.disabled) this.style.transform = 'scale(0.97)'; });
                el.addEventListener('mouseup', function () { this.style.transform = ''; });
                el.addEventListener('mouseleave', function () { this.style.transform = ''; });
            }

            document.querySelectorAll(selectors).forEach(addTap);
            var observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (m) {
                    m.addedNodes.forEach(function (n) {
                        if (n.nodeType === 1) {
                            if (n.matches && n.matches(selectors)) addTap(n);
                            if (n.querySelectorAll) n.querySelectorAll(selectors).forEach(addTap);
                        }
                    });
                });
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { PN.init(); });
    } else {
        PN.init();
    }
})();

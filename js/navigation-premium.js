(function () {
    'use strict';

    var PN = {
        init: function () {
            this.setupNavigation();
            this.setupMicroInteractions();
        },

        setupNavigation: function () {
            document.addEventListener('click', function (e) {
                var link = e.target.closest('a[href]');
                if (!link) return;
                var href = link.getAttribute('href');
                if (!href || href === '#' || href.startsWith('http') || href.startsWith('tel:') || href.startsWith('mailto:') || link.target === '_blank') return;
                e.preventDefault();
                window.location.href = href;
            });
        },

        setupMicroInteractions: function () {
            var selectors = 'a, button, .active-scale, [class*="card"]:not(.no-effect)';

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

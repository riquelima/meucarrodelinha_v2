(function () {
    'use strict';

    if (!window._navStack) {
        window._navStack = JSON.parse(sessionStorage.getItem('mclNavStack') || '[]');
    }

    function pushNav(page) {
        if (window._navStack[window._navStack.length - 1] !== page) {
            window._navStack.push(page);
            sessionStorage.setItem('mclNavStack', JSON.stringify(window._navStack));
        }
    }

    function popNav() {
        if (window._navStack.length === 0) return null;
        var page = window._navStack.pop();
        sessionStorage.setItem('mclNavStack', JSON.stringify(window._navStack));
        return page;
    }

    document.addEventListener('click', function (e) {
        var a = e.target.closest('a[href]');
        if (!a) return;
        var href = a.getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('#') ||
            href.startsWith('tel:') || href.startsWith('mailto:') ||
            href === 'javascript:void(0)') return;
        var current = window.location.pathname.split('/').pop() || 'index.html';
        if (current !== href) pushNav(current);
    });

    var startX = 0, startY = 0, startTime = 0;
    var isTracking = false, isSwiping = false;
    var currentOverlay = null, swipeStartTab = -1;
    var overlayTransform = '';

    var CONFIG = {
        EDGE_ZONE: 30,
        THRESHOLD: 70,
        MAX_Y_OFFSET: 100,
        VELOCITY_THRESHOLD: 0.2
    };

    function findOpenOverlay() {
        var els = document.querySelectorAll('.slide-in-view');
        for (var i = 0; i < els.length; i++) {
            if (!els[i].classList.contains('hidden') &&
                !els[i].classList.contains('translate-x-full')) return els[i];
        }
        var chat = document.getElementById('active-chat-view');
        if (chat && !chat.classList.contains('hidden') &&
            !chat.classList.contains('translate-x-full')) return chat;
        var sup = document.getElementById('suporte-view');
        if (sup && !sup.classList.contains('hidden') &&
            !sup.classList.contains('translate-x-full')) return sup;
        var rating = document.getElementById('rating-sheet');
        if (rating && !rating.classList.contains('hidden')) return rating;
        return null;
    }

    function getCurrentTabIndex() {
        var slider = document.getElementById('view-slider');
        if (!slider) return -1;
        var transform = slider.style.transform || '';
        if (!transform) {
            var cs = window.getComputedStyle(slider);
            transform = cs.transform || '';
        }
        var m = transform.match(/translate3d\((-?\d+)/);
        if (m) return Math.round(Math.abs(parseInt(m[1])) / 100);
        m = transform.match(/translateX\((-?\d+)/);
        if (m) return Math.round(Math.abs(parseInt(m[1])) / 100);
        m = transform.match(/matrix\(1,\s*0,\s*0,\s*1,\s*(-?\d+)/);
        if (m) {
            return Math.round(Math.abs(parseInt(m[1])) / window.innerWidth);
        }
        return 0;
    }

    function getTabList() {
        if (document.getElementById('view-dashboard')) return ['dashboard', 'users', 'settings'];
        if (document.getElementById('nav-home')) return ['home', 'chats', 'profile'];
        return [];
    }

    function triggerSwitchTab(tabName) {
        if (typeof window.switchTab === 'function') {
            window.switchTab(tabName);
            return true;
        }
        if (typeof switchTab === 'function') {
            switchTab(tabName);
            return true;
        }
        return false;
    }

    function closeOverlay(el) {
        var btn = el.querySelector('[onclick*="fechar" i], [onclick*="close" i], [onclick*="Close"]');
        if (btn) { btn.click(); return true; }
        var icon = el.querySelector('.material-symbols-outlined');
        if (icon) {
            var b = icon.closest('button, a');
            if (b) { b.click(); return true; }
        }
        return false;
    }

    function goBack() {
        window._navStack = JSON.parse(sessionStorage.getItem('mclNavStack') || '[]');
        var prev = popNav();
        if (prev && prev !== window.location.pathname.split('/').pop()) {
            window.location.href = prev;
            return;
        }
        if (window.history.length > 2) {
            window.history.back();
        } else {
            window.location.href = 'homepage.html';
        }
    }

    window.goBack = goBack;

    var backlight = null;

    function initBacklight() {
        if (backlight) return;
        backlight = document.createElement('div');
        backlight.style.cssText = 'position:fixed;top:0;left:0;bottom:0;width:4px;background:linear-gradient(to right,rgba(249,115,22,0.6),transparent);z-index:9999;pointer-events:none;opacity:0;transition:opacity 0.2s';
        document.body.appendChild(backlight);
    }

    document.addEventListener('touchstart', function (e) {
        var t = e.touches[0];
        if (t.clientX > CONFIG.EDGE_ZONE) return;
        isTracking = true;
        isSwiping = false;
        startX = t.clientX;
        startY = t.clientY;
        startTime = Date.now();
        currentOverlay = findOpenOverlay();
        swipeStartTab = getCurrentTabIndex();
        if (currentOverlay) {
            overlayTransform = currentOverlay.style.transform || '';
        }
    }, { passive: true });

    document.addEventListener('touchmove', function (e) {
        if (!isTracking) return;
        var t = e.touches[0];
        var dX = t.clientX - startX;
        var dY = Math.abs(t.clientY - startY);

        if (!isSwiping) {
            if (dY > CONFIG.MAX_Y_OFFSET || (dY > Math.abs(dX) && dY > 10)) {
                isTracking = false;
                return;
            }
            if (dX > 10) isSwiping = true;
        }
        if (!isSwiping) return;
        e.preventDefault();

        // Overlay: arrasta para a direita
        if (currentOverlay && currentOverlay.id !== 'rating-sheet') {
            currentOverlay.style.transition = 'none';
            currentOverlay.style.transform = 'translateX(' + Math.min(dX, window.innerWidth) + 'px)';
            currentOverlay.style.opacity = Math.max(0.2, 1 - (dX / window.innerWidth) * 0.8);
            return;
        }

        // SPA: arrasta o slider do view-slider
        var tabs = getTabList();
        if (tabs.length > 0 && swipeStartTab > 0) {
            var slider = document.getElementById('view-slider');
            if (slider) {
                var startPos = -(swipeStartTab * 100);
                var progress = (dX / window.innerWidth) * 100;
                var newPos = Math.min(startPos + progress * 0.85, 0);
                slider.style.transition = 'none';
                slider.style.transform = 'translate3d(' + newPos + 'vw, 0, 0)';
            }
            return;
        }

        // Página normal: feedback sutil
        initBacklight();
        backlight.style.opacity = Math.min(1, dX / CONFIG.THRESHOLD);
    }, { passive: false });

    document.addEventListener('touchend', function (e) {
        if (!isTracking) { isSwiping = false; return; }
        isTracking = false;

        var t = e.changedTouches[0];
        var dX = t.clientX - startX;
        var elapsed = Date.now() - startTime;
        var velocity = dX / Math.max(elapsed, 1);
        var shouldGo = dX > CONFIG.THRESHOLD || (dX > 30 && velocity > CONFIG.VELOCITY_THRESHOLD);

        if (!isSwiping) return;

        // Overlay
        if (currentOverlay) {
            if (shouldGo) {
                currentOverlay.style.transition = '';
                currentOverlay.style.transform = 'translateX(100vw)';
                currentOverlay.style.opacity = '0';
                var overlayEl = currentOverlay;
                setTimeout(function () {
                    overlayEl.style.transition = '';
                    overlayEl.style.transform = '';
                    overlayEl.style.opacity = '';
                    closeOverlay(overlayEl);
                }, 400);
            } else {
                currentOverlay.style.transition = '';
                currentOverlay.style.transform = overlayTransform;
                currentOverlay.style.opacity = '';
            }
            currentOverlay = null;
            isSwiping = false;
            return;
        }

        // SPA tab
        var tabs = getTabList();
        var slider = document.getElementById('view-slider');
        if (tabs.length > 0 && swipeStartTab > 0 && slider) {
            slider.style.transition = '';
            void slider.offsetHeight;
            if (shouldGo) {
                triggerSwitchTab(tabs[swipeStartTab - 1]);
            } else {
                slider.style.transform = 'translate3d(' + (-swipeStartTab * 100) + 'vw, 0, 0)';
            }
            swipeStartTab = -1;
            isSwiping = false;
            return;
        }
        swipeStartTab = -1;

        // Página normal
        if (backlight) backlight.style.opacity = '0';
        if (shouldGo) goBack();
        isSwiping = false;
    }, { passive: true });
})();

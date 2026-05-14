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

    var startX = 0,
        startY = 0,
        startTime = 0;
    var isTracking = false,
        isSwiping = false;
    var currentOverlay = null;
    var overlayTransform = '';

    var CONFIG = {
        EDGE_ZONE: 25,
        THRESHOLD: 80,
        MAX_DURATION: 400,
        MAX_Y_OFFSET: 80,
        VELOCITY_THRESHOLD: 0.25
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
        var m = slider.style.transform.match(/translate3d\((-?\d+)vw/);
        if (m) return Math.abs(parseInt(m[1])) / 100;
        m = slider.style.transform.match(/translateX\((-?\d+)vw\)/);
        if (m) return Math.abs(parseInt(m[1])) / 100;
        return 0;
    }

    function getTabList() {
        if (document.getElementById('view-dashboard')) return ['dashboard', 'users', 'settings'];
        if (document.getElementById('nav-home')) return ['home', 'chats', 'profile'];
        return [];
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

        var overlay = findOpenOverlay();
        if (overlay) {
            closeOverlay(overlay);
            return;
        }

        var tabs = getTabList();
        if (tabs.length > 0) {
            var idx = getCurrentTabIndex();
            if (idx > 0 && typeof window.switchTab === 'function') {
                window.switchTab(tabs[idx - 1]);
                return;
            }
        }

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

    document.addEventListener('touchstart', function (e) {
        var t = e.touches[0];
        if (t.clientX > CONFIG.EDGE_ZONE) return;
        isTracking = true;
        isSwiping = false;
        startX = t.clientX;
        startY = t.clientY;
        startTime = Date.now();
        currentOverlay = findOpenOverlay();
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

        if (currentOverlay && currentOverlay.id !== 'rating-sheet') {
            var p = Math.min(dX / CONFIG.THRESHOLD, 1);
            currentOverlay.style.transition = 'none';
            currentOverlay.style.transform = 'translateX(' + Math.min(dX, window.innerWidth) + 'px)';
            currentOverlay.style.opacity = Math.max(0.2, 1 - p * 0.8);
        }
    }, { passive: false });

    document.addEventListener('touchend', function (e) {
        if (!isTracking) { isSwiping = false; return; }
        isTracking = false;

        if (currentOverlay) {
            currentOverlay.style.transition = '';
            currentOverlay.style.transform = overlayTransform;
            currentOverlay.style.opacity = '';
            currentOverlay = null;
        }

        if (!isSwiping) return;

        var t = e.changedTouches[0];
        var dX = t.clientX - startX;
        var elapsed = Date.now() - startTime;
        var velocity = dX / Math.max(elapsed, 1);
        var shouldGo = dX > CONFIG.THRESHOLD || (dX > 30 && velocity > CONFIG.VELOCITY_THRESHOLD);

        if (shouldGo) goBack();
        isSwiping = false;
    }, { passive: true });
})();

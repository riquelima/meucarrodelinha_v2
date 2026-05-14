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
    var currentOverlay = null;
    var overlayTransform = '';
    var feedbackEl = null;

    var CONFIG = {
        EDGE_ZONE: 35,
        THRESHOLD: 60,
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
            var offset = parseInt(m[1]);
            return Math.round(Math.abs(offset) / window.innerWidth);
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

        var overlay = findOpenOverlay();
        if (overlay) {
            closeOverlay(overlay);
            return;
        }

        var tabs = getTabList();
        if (tabs.length > 0) {
            var idx = getCurrentTabIndex();
            if (idx > 0) {
                triggerSwitchTab(tabs[idx - 1]);
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

    function getFeedbackEl() {
        if (!feedbackEl) {
            feedbackEl = document.querySelector('#app-root > .relative') ||
                         document.querySelector('.page-container') ||
                         document.querySelector('.flex.h-full');
        }
        return feedbackEl;
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
        } else {
            var fb = getFeedbackEl();
            if (fb) {
                var p = Math.min(dX / window.innerWidth, 0.25);
                fb.style.transition = 'none';
                fb.style.transform = 'translateX(' + (dX * 0.2) + 'px)';
                fb.style.opacity = Math.max(0.5, 1 - p);
            }
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
        var fb = feedbackEl || getFeedbackEl();
        if (fb) {
            fb.style.transition = '';
            fb.style.transform = '';
            fb.style.opacity = '';
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

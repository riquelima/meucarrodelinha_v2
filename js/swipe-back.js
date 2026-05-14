(function() {
    'use strict';

    var startX = 0, startY = 0, startTime = 0;
    var isTracking = false, isSwiping = false;
    var currentSlideIn = null;
    var currentTranslate = 0;

    var CONFIG = {
        EDGE_ZONE: 30,
        THRESHOLD: 60,
        MAX_DURATION: 500,
        MAX_Y_OFFSET: 100,
        VELOCITY_THRESHOLD: 0.3
    };

    function findOpenSlideIn() {
        var els = document.querySelectorAll('.slide-in-view');
        for (var i = 0; i < els.length; i++) {
            if (!els[i].classList.contains('hidden')) return els[i];
        }
        return null;
    }

    function triggerBack() {
        var slideIn = findOpenSlideIn();
        if (slideIn) {
            var backBtn = slideIn.querySelector('[onclick*="fechar"], [onclick*="close"]');
            if (backBtn) { backBtn.click(); return; }
        }

        var backBtn = document.querySelector('[onclick*="fecharSuporte"], [onclick*="closeActiveChat"], [onclick*="fecharPost"], [onclick*="fecharAd"], [onclick*="fecharBlogManage"], [onclick*="fecharAdManage"], [onclick*="fecharSuporteAdmin"]');
        if (backBtn) { backBtn.click(); return; }

        var arrowBack = document.querySelector('.material-symbols-outlined');
        if (arrowBack) {
            var parentBtn = arrowBack.closest('button, a');
            if (parentBtn) { parentBtn.click(); return; }
        }

        if (typeof window.goBack === 'function') { window.goBack(); return; }
        if (typeof window.history.back === 'function') { window.history.back(); }
    }

    document.addEventListener('touchstart', function(e) {
        var touch = e.touches[0];
        if (touch.clientX > CONFIG.EDGE_ZONE && touch.clientX < window.innerWidth - CONFIG.EDGE_ZONE) return;

        isTracking = true;
        isSwiping = false;
        startX = touch.clientX;
        startY = touch.clientY;
        startTime = Date.now();
        currentSlideIn = findOpenSlideIn();
        currentTranslate = 0;
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
        if (!isTracking) return;
        var touch = e.touches[0];
        var deltaX = touch.clientX - startX;
        var deltaY = Math.abs(touch.clientY - startY);

        if (!isSwiping) {
            if (deltaY > CONFIG.MAX_Y_OFFSET || (deltaY > Math.abs(deltaX) && deltaY > 10)) {
                isTracking = false;
                return;
            }
            if (deltaX > 10) isSwiping = true;
        }

        if (!isSwiping) return;
        e.preventDefault();

        currentTranslate = deltaX;
        if (currentSlideIn) {
            var progress = Math.min(deltaX / CONFIG.THRESHOLD, 1);
            currentSlideIn.style.transition = 'none';
            currentSlideIn.style.transform = 'translateX(' + (-100 + (progress * 100)) + 'vw)';
            currentSlideIn.style.opacity = Math.max(0.3, 1 - (progress * 0.3));
        }
    }, { passive: false });

    document.addEventListener('touchend', function(e) {
        if (!isTracking) { isSwiping = false; return; }
        isTracking = false;

        var touch = e.changedTouches[0];
        var deltaX = touch.clientX - startX;
        var elapsed = Date.now() - startTime;
        var velocity = deltaX / Math.max(elapsed, 1);
        var shouldGo = deltaX > CONFIG.THRESHOLD || (deltaX > 30 && velocity > CONFIG.VELOCITY_THRESHOLD);

        if (currentSlideIn) {
            currentSlideIn.style.transition = '';
            currentSlideIn.style.transform = '';
            currentSlideIn.style.opacity = '';
            currentSlideIn = null;
        }

        if (shouldGo && isSwiping) {
            triggerBack();
        }
        isSwiping = false;
    }, { passive: true });
})();

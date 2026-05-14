(function() {
    'use strict';

    var touchStartX = 0;
    var touchStartY = 0;
    var touchStartTime = 0;
    var isTracking = false;
    var SWIPE_THRESHOLD = 80;
    var EDGE_ZONE = 35;
    var MAX_DURATION = 400;
    var MAX_Y_OFFSET = 120;

    function findBackButton() {
        var btns = document.querySelectorAll('[onclick*="fechar"], [onclick*="close"], [onclick*="voltar"]');
        for (var i = 0; i < btns.length; i++) {
            var icon = btns[i].querySelector('.material-symbols-outlined');
            if (icon && (icon.textContent === 'arrow_back' || icon.textContent === 'arrow_back_ios' || icon.textContent === 'close')) {
                return btns[i];
            }
            if (btns[i].textContent.includes('Voltar') || btns[i].textContent.includes('voltar')) {
                return btns[i];
            }
        }
        return null;
    }

    function findOpenSlideIn() {
        var views = document.querySelectorAll('.slide-in-view');
        for (var i = 0; i < views.length; i++) {
            if (!views[i].classList.contains('hidden')) {
                return views[i];
            }
        }
        return null;
    }

    function triggerBack() {
        var slideIn = findOpenSlideIn();
        if (slideIn) {
            var backBtn = slideIn.querySelector('[onclick*="fechar"], [onclick*="close"]');
            if (backBtn) { backBtn.click(); return; }
        }

        var backBtn = findBackButton();
        if (backBtn) { backBtn.click(); return; }

        if (typeof window.goBack === 'function') { window.goBack(); return; }
        if (typeof window.fecharSuporte === 'function') { window.fecharSuporte(); return; }
        if (typeof window.closeActiveChat === 'function') { window.closeActiveChat(); return; }
        if (typeof window.fecharSuporteAdmin === 'function') {
            var suporteView = document.getElementById('suporte-view');
            if (suporteView && !suporteView.classList.contains('hidden')) { window.fecharSuporteAdmin(); return; }
        }

        if (document.referrer && !document.referrer.includes(window.location.hostname)) {
            window.location.href = document.referrer;
        } else {
            window.history.back();
        }
    }

    document.addEventListener('touchstart', function(e) {
        var touch = e.touches[0];
        if (touch.clientX <= EDGE_ZONE || touch.clientX >= window.innerWidth - EDGE_ZONE) {
            isTracking = true;
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
        }
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
        if (!isTracking) return;
        var touch = e.touches[0];
        var deltaX = touch.clientX - touchStartX;
        var deltaY = Math.abs(touch.clientY - touchStartY);

        if (deltaY > MAX_Y_OFFSET) { isTracking = false; return; }

        if (deltaX > 0) {
            var progress = Math.min(deltaX / SWIPE_THRESHOLD, 1);
            var slideIn = findOpenSlideIn();
            if (slideIn) {
                slideIn.style.transform = 'translateX(' + (-100 + (progress * 100)) + 'vw)';
                slideIn.style.transition = 'none';
            }
        }
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        if (!isTracking) return;
        isTracking = false;
        var touch = e.changedTouches[0];
        var deltaX = touch.clientX - touchStartX;
        var elapsed = Date.now() - touchStartTime;

        var slideIn = findOpenSlideIn();
        if (slideIn) {
            slideIn.style.transform = '';
            slideIn.style.transition = '';
        }

        if (deltaX > SWIPE_THRESHOLD && elapsed < MAX_DURATION) {
            triggerBack();
        }
    }, { passive: true });
})();

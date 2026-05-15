(function () {
    'use strict';

    var SHARE_URL = window.location.origin + '/homepage.html';
    var SHARE_TEXT = 'Meu Carro de Linha Salinas - Tradição & Tecnologia. Encontre seu motorista pelo celular!';
    var SHARE_TITLE = 'Meu Carro de Linha Salinas';
    var LS_KEY = 'mcl_share_dismissed';

    function isDismissed() {
        try { return localStorage.getItem(LS_KEY) === 'true'; } catch (e) { return false; }
    }

    function setDismissed() {
        try { localStorage.setItem(LS_KEY, 'true'); } catch (e) {}
        var fab = document.getElementById('shareFab');
        if (fab) { fab.style.transform = 'scale(0)'; setTimeout(function () { fab.remove(); }, 400); }
    }

    window.dismissShareFab = setDismissed;

    window.shareApp = async function (source) {
        source = source || 'button';
        if (navigator.share) {
            try {
                await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: SHARE_URL });
                showToast('Compartilhado com sucesso!');
                return;
            } catch (e) {
                if (e.name !== 'AbortError' && e.name !== 'ShareError') {
                    showToast('Erro ao compartilhar');
                }
                return;
            }
        }
        try {
            await navigator.clipboard.writeText(SHARE_URL);
            showToast('Link copiado! Compartilhe onde quiser.');
        } catch (e) {
            fallbackCopy();
        }
    };

    function fallbackCopy() {
        var ta = document.createElement('textarea');
        ta.value = SHARE_URL;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            showToast('Link copiado!');
        } catch (e) {
            showToast(SHARE_URL);
        }
        document.body.removeChild(ta);
    }

    function showToast(msg) {
        var existing = document.querySelector('.share-toast');
        if (existing) existing.remove();
        var el = document.createElement('div');
        el.className = 'share-toast';
        el.innerHTML = '<span class="material-symbols-outlined">check_circle</span><p>' + msg + '</p>';
        document.body.appendChild(el);
        setTimeout(function () {
            el.classList.add('out');
            setTimeout(function () { el.remove(); }, 400);
        }, 2500);
    }

    if (isDismissed()) return;

    var fabHTML =
        '<style>' +
        '@keyframes shareFabIn{0%{opacity:0;transform:scale(0) translateY(40px)}60%{transform:scale(1.1) translateY(-4px)}100%{opacity:1;transform:scale(1) translateY(0)}}' +
        '@keyframes shareFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}' +
        '@keyframes sharePulse{0%,100%{box-shadow:0 8px 32px rgba(249,115,22,0.3),0 0 0 0 rgba(249,115,22,0.25)}50%{box-shadow:0 8px 40px rgba(249,115,22,0.4),0 0 0 10px rgba(249,115,22,0)}}' +
        '.share-fab{position:fixed;bottom:100px;right:20px;width:52px;height:52px;border-radius:16px;background:linear-gradient(135deg,rgba(249,115,22,0.92),rgba(234,88,12,0.96));border:1px solid rgba(255,255,255,0.15);box-shadow:0 8px 32px rgba(249,115,22,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:9998;animation:shareFabIn 0.6s cubic-bezier(.34,1.56,.64,1) 1.8s both,shareFloat 3s ease-in-out 2.6s infinite,sharePulse 3s ease-in-out 2.6s infinite;transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}' +
        '.share-fab:hover{transform:scale(1.08);box-shadow:0 12px 40px rgba(249,115,22,0.5)}' +
        '.share-fab:active{transform:scale(0.88);box-shadow:0 4px 16px rgba(249,115,22,0.2)}' +
        '.share-fab .material-symbols-outlined{color:#fff;font-size:24px;font-variation-settings:"FILL"1}' +
        '.share-fab-dismiss{position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;background:#1e293b;border:1.5px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:0;transition:opacity .2s;z-index:1}' +
        '.share-fab:hover .share-fab-dismiss{opacity:1}' +
        '.share-fab-dismiss .material-symbols-outlined{font-size:12px;color:rgba(255,255,255,0.5)}' +
        '@keyframes toastIn{0%{opacity:0;transform:translateY(20px) scale(.9)}100%{opacity:1;transform:translateY(0) scale(1)}}' +
        '@keyframes toastOut{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(10px) scale(.95)}}' +
        '.share-toast{position:fixed;bottom:170px;left:50%;transform:translateX(-50%);background:rgba(18,21,32,0.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(249,115,22,0.2);border-radius:14px;padding:12px 20px;display:flex;align-items:center;gap:10px;z-index:99999;box-shadow:0 10px 40px rgba(0,0,0,0.5);animation:toastIn .4s cubic-bezier(.34,1.56,.64,1) forwards;max-width:calc(100% - 40px);white-space:nowrap}' +
        '.share-toast.out{animation:toastOut .3s ease forwards}' +
        '.share-toast .material-symbols-outlined{color:#f97316;font-size:20px}' +
        '.share-toast p{color:#fff;font-size:13px;font-weight:600;margin:0}' +
        '</style>' +
        '<div class="share-fab" id="shareFab" title="Compartilhar" onclick="if(!event.target.closest(\'.share-fab-dismiss\'))window.shareApp(\'fab\')">' +
        '<div class="share-fab-dismiss" id="shareFabDismiss" title="Não ver mais" onclick="event.stopPropagation();window.dismissShareFab()">' +
        '<span class="material-symbols-outlined">close</span></div>' +
        '<span class="material-symbols-outlined">share</span></div>';

    function attachShareHandlers() {
        var fab = document.getElementById('shareFab');
        if (fab && !fab._handler) {
            fab._handler = true;
            fab.addEventListener('click', function(e) {
                if (e.target.closest('.share-fab-dismiss')) return;
                window.shareApp('fab');
            });
        }
    }

    if (document.body) {
        document.body.insertAdjacentHTML('beforeend', fabHTML);
        attachShareHandlers();
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            document.body.insertAdjacentHTML('beforeend', fabHTML);
            attachShareHandlers();
        });
    }
})();

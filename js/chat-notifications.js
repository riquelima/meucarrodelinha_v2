(function () {
    'use strict';

    var _channel = null;

    async function updateUnreadBadge() {
        try {
            var sb = window.supabaseClient;
            if (!sb) return;
            var { data: { user } } = await sb.auth.getUser();
            if (!user) return;
            var { count, error } = await sb
                .from('mensagens')
                .select('*', { count: 'exact', head: true })
                .eq('destinatario_id', user.id)
                .eq('lida', false);
            if (error) { console.warn('[ChatNotif]', error); return; }
            updateUI(count);
        } catch(e) { console.warn('[ChatNotif]', e); }
    }

    function updateUI(count) {
        var badges = document.querySelectorAll('.chat-badge');
        badges.forEach(function(badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        });
    }

    function setupRealtime(userId) {
        if (_channel) { _channel.unsubscribe(); _channel = null; }
        var sb = window.supabaseClient;
        if (!sb || !userId) return;
        _channel = sb.channel('notificacoes-chat');
        _channel.on('postgres_changes', {
            event: 'INSERT', schema: 'public', table: 'mensagens',
            filter: 'destinatario_id=eq.' + userId
        }, function() { updateUnreadBadge(); });
        _channel.on('postgres_changes', {
            event: 'UPDATE', schema: 'public', table: 'mensagens',
            filter: 'destinatario_id=eq.' + userId
        }, function() { updateUnreadBadge(); });
        _channel.subscribe();
        updateUnreadBadge();
    }

    function init() {
        var sb = window.supabaseClient;
        if (!sb) return;

        // Try Supabase Auth
        sb.auth.getUser().then(function(res) {
            if (res.data?.user) {
                setupRealtime(res.data.user.id);
            } else {
                // Fallback: migrated user - check localStorage
                try {
                    var mig = JSON.parse(localStorage.getItem('mcl_migrado') || '{}');
                    var mu = mig.user || mig;
                    if (mu && mu.email) setupRealtime(mu.id || mu._id);
                } catch(e) {}
            }
        }).catch(function() {});

        // Also listen for future sign-ins
        sb.auth.onAuthStateChange(function(event, session) {
            if (event === 'SIGNED_IN' && session?.user) {
                setupRealtime(session.user.id);
            }
        });
    }

    updateUnreadBadge();
    init();
})();

(function () {
    'use strict';

    var _channel = null;

    async function updateUnreadBadge() {
        try {
            var sb = window.supabaseClient;
            if (!sb) return;
            let u = null;
            var { data: { user } } = await sb.auth.getUser();
            if (user) {
                u = user;
            } else {
                const cs = localStorage.getItem('mcl_custom_session');
                const md = localStorage.getItem('mcl_migrado');
                if (cs || md) {
                    const parsed = cs ? JSON.parse(cs) : JSON.parse(md);
                    u = parsed.user || parsed;
                    if (u && !u.id && u._id) u.id = u._id;
                }
            }
            if (!u) return;

            var myUUID = window._toUUID(u.id);

            var { count, error } = await sb
                .from('mensagens')
                .select('*', { count: 'exact', head: true })
                .eq('destinatario_id', myUUID)
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
        
        var myUUID = window._toUUID(userId);
        _channel = sb.channel('notificacoes-chat-' + myUUID);
        
        _channel.on('postgres_changes', {
            event: 'INSERT', schema: 'public', table: 'mensagens',
            filter: 'destinatario_id=eq.' + myUUID
        }, function() { 
            updateUnreadBadge(); 
            if (typeof window.loadChatList === 'function') window.loadChatList();
        });
        
        _channel.on('postgres_changes', {
            event: 'UPDATE', schema: 'public', table: 'mensagens',
            filter: 'destinatario_id=eq.' + myUUID
        }, function() { 
            updateUnreadBadge(); 
            if (typeof window.loadChatList === 'function') window.loadChatList();
        });
        
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

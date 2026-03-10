/**
 * chat-notifications.js
 * Gerencia o contador de mensagens não lidas no navbar em tempo real.
 */

(function () {
    const supabase = window.supabaseClient;

    async function updateUnreadBadge() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { count, error } = await supabase
            .from('mensagens')
            .select('*', { count: 'exact', head: true })
            .eq('destinatario_id', user.id)
            .eq('lida', false);

        if (error) {
            console.error('Erro ao buscar mensagens não lidas:', error);
            return;
        }

        updateUI(count);
    }

    function updateUI(count) {
        const badges = document.querySelectorAll('.chat-badge');
        badges.forEach(badge => {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        });
    }

    function setupRealtime() {
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                const userId = session.user.id;

                // Inscreve para novas mensagens destinadas ao usuário logado
                const channel = supabase.channel('notificacoes-chat')
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'mensagens',
                            filter: `destinatario_id=eq.${userId}`
                        },
                        () => {
                            updateUnreadBadge();
                        }
                    )
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'mensagens',
                            filter: `destinatario_id=eq.${userId}`
                        },
                        () => {
                            updateUnreadBadge();
                        }
                    )
                    .subscribe();

                updateUnreadBadge();
            }
        });
    }

    // Inicializa se já estiver logado
    updateUnreadBadge();
    setupRealtime();
})();

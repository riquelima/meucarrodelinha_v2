/**
 * conversas-motorista.js
 * Gerencia a lista de conversas do motorista em tempo real.
 */

class ConversasMotorista {
    constructor() {
        this.supabase = window.supabaseClient;
        this.listContainer = document.getElementById('conversations-list');
        this.currentUser = null;
        this.init();
    }

    async init() {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) {
            window.location.href = 'loginMotorista.html';
            return;
        }
        this.currentUser = user;

        this.loadConversations();
        this.setupRealtime();
    }

    async loadConversations() {
        try {
            // Busca as últimas mensagens trocadas envolvendo o motorista
            const { data: messages, error } = await this.supabase
                .from('mensagens')
                .select(`
                    id, 
                    conteudo, 
                    enviada_em, 
                    lida, 
                    remetente_id, 
                    destinatario_id,
                    remetente:usuarios!remetente_id(id, nome, foto_perfil_url),
                    destinatario:usuarios!destinatario_id(id, nome, foto_perfil_url)
                `)
                .or(`remetente_id.eq.${this.currentUser.id},destinatario_id.eq.${this.currentUser.id}`)
                .order('enviada_em', { ascending: false });

            if (error) throw error;

            // Agrupar por contato (Passageiro)
            const conversationsMap = new Map();

            messages.forEach(msg => {
                const targetUser = msg.remetente_id === this.currentUser.id ? msg.destinatario : msg.remetente;
                if (!targetUser) return;

                if (!conversationsMap.has(targetUser.id)) {
                    conversationsMap.set(targetUser.id, {
                        user: targetUser,
                        lastMessage: msg,
                        unreadCount: (msg.destinatario_id === this.currentUser.id && !msg.lida) ? 1 : 0
                    });
                } else {
                    const conv = conversationsMap.get(targetUser.id);
                    if (msg.destinatario_id === this.currentUser.id && !msg.lida) {
                        conv.unreadCount++;
                    }
                }
            });

            this.renderList(Array.from(conversationsMap.values()));
        } catch (err) {
            console.error('Erro ao carregar conversas:', err);
            if (this.listContainer) {
                this.listContainer.innerHTML = '<div class="p-8 text-center text-red-500">Erro ao carregar conversas.</div>';
            }
        }
    }

    renderList(conversations) {
        if (!this.listContainer) return;

        if (conversations.length === 0) {
            this.listContainer.innerHTML = '<div class="p-8 text-center text-slate-500">Nenhuma conversa encontrada.</div>';
            return;
        }

        this.listContainer.innerHTML = '';
        conversations.forEach(conv => {
            const target = conv.user;
            const lastMsg = conv.lastMessage;
            const time = new Date(lastMsg.enviada_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const photoUrl = target.foto_perfil_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(target.nome)}&background=random&size=128`;
            const lastText = lastMsg.conteudo.startsWith('[LOCATION]') ? '📍 Localização' : lastMsg.conteudo;

            const card = document.createElement('a');
            card.href = `chatMotorista.html?userId=${target.id}&name=${encodeURIComponent(target.nome)}&photo=${encodeURIComponent(photoUrl)}`;
            card.className = `flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm mb-3 active:scale-[0.98] transition-all hover:bg-slate-50 dark:hover:bg-slate-800/80 ${conv.unreadCount > 0 ? 'ring-1 ring-primary/30' : ''}`;

            card.innerHTML = `
                <div class="relative">
                    <div class="size-14 rounded-full border-2 border-primary/20 overflow-hidden">
                        <img src="${photoUrl}" alt="${target.nome}" class="w-full h-full object-cover" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(target.nome)}&background=random'">
                    </div>
                    <div class="absolute bottom-0 right-0 size-3.5 bg-green-500 border-2 border-white dark:border-surface-dark rounded-full"></div>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-baseline mb-0.5">
                        <p class="font-bold text-slate-900 dark:text-slate-100 truncate">${target.nome}</p>
                        <p class="text-[10px] ${conv.unreadCount > 0 ? 'text-primary font-bold' : 'text-slate-500'}">${time}</p>
                    </div>
                    <p class="text-slate-500 dark:text-slate-400 text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold' : ''}">${lastText}</p>
                </div>
                ${conv.unreadCount > 0 ? `
                    <div class="size-5 bg-primary rounded-full flex items-center justify-center">
                        <p class="text-[10px] text-white font-bold">${conv.unreadCount}</p>
                    </div>
                ` : ''}
            `;
            this.listContainer.appendChild(card);
        });
    }

    setupRealtime() {
        // Canal para detectar novas mensagens e atualizar a lista
        this.supabase.channel('lista-conversas-motorista')
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'mensagens',
                    filter: `destinatario_id=eq.${this.currentUser.id}`
                },
                () => {
                    this.loadConversations();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'mensagens',
                    filter: `remetente_id=eq.${this.currentUser.id}`
                },
                () => {
                    this.loadConversations();
                }
            )
            .subscribe();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ConversasMotorista();
});

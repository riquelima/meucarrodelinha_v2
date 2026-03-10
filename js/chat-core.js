/**
 * chat-core.js
 * Lógica central para as páginas de chat (passageiro e motorista).
 */

class ChatManager {
    constructor(isMotorista = false) {
        this.supabase = window.supabaseClient;
        this.isMotorista = isMotorista;
        this.currentUser = null;
        this.targetUserId = null;
        this.viagemId = null;
        this.messagesContainer = document.querySelector('main');
        this.input = document.querySelector('input[type="text"]');
        this.sendBtn = document.querySelector('button .material-symbols-outlined[textContent="send"]')?.parentElement || document.querySelector('button.bg-primary');

        this.init();
    }

    async init() {
        const { data: { user } } = await this.supabase.auth.getUser();
        this.currentUser = user;
        if (!user) return;

        const params = new URLSearchParams(window.location.search);
        this.targetUserId = params.get('userId');
        this.viagemId = params.get('viagemId');

        if (this.targetUserId) {
            this.loadMessages();
            this.setupRealtime();
            this.markAsRead();
        }

        this.setupEventListeners();
    }

    async loadMessages() {
        const { data: messages, error } = await this.supabase
            .from('mensagens')
            .select('*')
            .or(`and(remetente_id.eq.${this.currentUser.id},destinatario_id.eq.${this.targetUserId}),and(remetente_id.eq.${this.targetUserId},destinatario_id.eq.${this.currentUser.id})`)
            .order('enviada_em', { ascending: true });

        if (error) {
            console.error('Erro ao carregar mensagens:', error);
            return;
        }

        this.messagesContainer.innerHTML = ''; // Limpar mensagens estáticas
        messages.forEach(msg => this.renderMessage(msg));
        this.scrollToBottom();
    }

    renderMessage(msg) {
        const isMe = msg.remetente_id === this.currentUser.id;
        const time = new Date(msg.enviada_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const div = document.createElement('div');
        div.className = `flex items-end gap-2 max-w-[85%] animate-fade-in ${isMe ? 'ml-auto' : ''}`;

        const bubbleClass = this.isMotorista
            ? (isMe ? 'bg-driver-bubble' : 'bg-passenger-bubble')
            : (isMe ? 'bg-passenger-bubble' : 'bg-driver-bubble');

        div.innerHTML = `
            <div class="${bubbleClass} px-4 py-3 rounded-2xl ${isMe ? 'rounded-br-none' : 'rounded-bl-none'} text-sm text-slate-200 shadow-lg">
                <p>${msg.conteudo}</p>
                <div class="text-[9px] text-slate-400 mt-1.5 text-right flex items-center justify-end gap-1">
                    ${time} ${isMe ? `<span class="material-symbols-outlined text-[12px] ${msg.lida ? 'text-accent-cyan' : ''}">done_all</span>` : ''}
                </div>
            </div>
        `;

        this.messagesContainer.appendChild(div);
    }

    async sendMessage() {
        const text = this.input.value.trim();
        if (!text || !this.targetUserId) return;

        this.input.value = '';

        const { data, error } = await this.supabase
            .from('mensagens')
            .insert({
                remetente_id: this.currentUser.id,
                destinatario_id: this.targetUserId,
                viagem_id: this.viagemId,
                conteudo: text
            })
            .select()
            .single();

        if (error) {
            console.error('Erro ao enviar mensagem:', error);
            alert('Erro ao enviar mensagem');
        }
    }

    async markAsRead() {
        await this.supabase
            .from('mensagens')
            .update({ lida: true })
            .eq('destinatario_id', this.currentUser.id)
            .eq('remetente_id', this.targetUserId)
            .eq('lida', false);
    }

    setupRealtime() {
        this.supabase.channel(`chat-${this.targetUserId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'mensagens',
                    filter: `remetente_id=eq.${this.targetUserId},destinatario_id=eq.${this.currentUser.id}`
                },
                (payload) => {
                    this.renderMessage(payload.new);
                    this.scrollToBottom();
                    this.markAsRead();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'mensagens',
                    filter: `remetente_id=eq.${this.currentUser.id},destinatario_id=eq.${this.targetUserId}`
                },
                (payload) => {
                    this.renderMessage(payload.new);
                    this.scrollToBottom();
                }
            )
            .subscribe();
    }

    setupEventListeners() {
        this.sendBtn?.addEventListener('click', () => this.sendMessage());
        this.input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

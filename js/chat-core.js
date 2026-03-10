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
        this.targetUserId = params.get('userId') || params.get('driverId');
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
        div.className = `flex flex-col items-end gap-2 ${isMe ? 'ml-auto' : ''} max-w-[90%] animate-fade-in`;

        const bubbleClass = this.isMotorista
            ? (isMe ? 'bg-driver-bubble' : 'bg-passenger-bubble')
            : (isMe ? 'bg-passenger-bubble' : 'bg-driver-bubble');

        if (msg.conteudo.startsWith('[LOCATION]')) {
            try {
                const coordsStr = msg.conteudo.replace('[LOCATION]', '');
                const [lat, lng] = coordsStr.split(',').map(c => c.trim());
                const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

                // Location Card Design based on localizacaoAtual.html
                div.innerHTML = `
                    <div class="flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}">
                         <div class="${bubbleClass} px-4 py-3 rounded-xl ${isMe ? 'rounded-br-none' : 'rounded-bl-none'} text-sm text-white shadow-lg shadow-primary/20">
                            <p>Aqui está minha localização atual:</p>
                        </div>
                    </div>
                    <div class="w-full max-w-sm overflow-hidden rounded-xl border border-primary/20 bg-slate-800/40 shadow-xl mt-2 backdrop-blur-sm">
                        <div class="relative h-48 w-full bg-slate-700 bg-cover bg-center" style="background-image: url('https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=400x200&markers=color:blue%7C${lat},${lng}&key=');">
                            <div class="absolute inset-0 flex items-center justify-center bg-slate-900/20">
                                <div class="relative">
                                    <div class="absolute -inset-4 bg-primary/30 rounded-full animate-ping"></div>
                                    <span class="material-symbols-outlined text-primary text-5xl relative z-10 drop-shadow-lg" style="font-variation-settings: 'FILL' 1">location_on</span>
                                </div>
                            </div>
                        </div>
                        <div class="p-4 flex flex-col gap-3">
                            <div class="flex justify-between items-start">
                                <div class="space-y-1">
                                    <h3 class="font-bold text-sm text-white">Localização em Tempo Real</h3>
                                    <div class="flex items-center gap-1.5 text-slate-400">
                                        <span class="material-symbols-outlined text-xs">my_location</span>
                                        <span class="text-[10px] uppercase font-semibold tracking-wider">Salinas - MG</span>
                                    </div>
                                </div>
                                <div class="bg-primary/10 px-2 py-1 rounded text-[10px] font-bold text-primary uppercase border border-primary/20">Ao vivo</div>
                            </div>
                            <a href="${mapsUrl}" target="_blank" class="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary/25 decoration-none">
                                <span class="material-symbols-outlined text-lg">map</span>
                                <span class="text-sm">Abrir no Google Maps</span>
                            </a>
                        </div>
                    </div>
                    <div class="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
                        ${time} ${isMe ? `<span class="material-symbols-outlined text-[12px] ${msg.lida ? 'text-accent-cyan' : ''}">done_all</span>` : ''}
                    </div>
                `;
            } catch (e) {
                console.error("Erro ao renderizar localização:", e);
                div.innerHTML = `<div class="${bubbleClass} px-4 py-2 rounded-xl text-sm">[Erro ao carregar mapa]</div>`;
            }
        } else {
            div.innerHTML = `
                <div class="flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}">
                    <div class="${bubbleClass} px-4 py-3 rounded-2xl ${isMe ? 'rounded-br-none' : 'rounded-bl-none'} text-sm text-slate-200 shadow-lg">
                        <p>${msg.conteudo}</p>
                        <div class="text-[9px] text-slate-400 mt-1.5 text-right flex items-center justify-end gap-1">
                            ${time} ${isMe ? `<span class="material-symbols-outlined text-[12px] ${msg.lida ? 'text-accent-cyan' : ''}">done_all</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }

        this.messagesContainer.appendChild(div);
    }

    async sendLocation() {
        if (!navigator.geolocation) {
            alert('Geolocalização não é suportada pelo seu navegador.');
            return;
        }

        const btn = document.getElementById('btn-send-location');
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span>';
        btn.disabled = true;

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const locationMsg = `[LOCATION]${latitude},${longitude}`;

                const { data, error } = await this.supabase
                    .from('mensagens')
                    .insert({
                        remetente_id: this.currentUser.id,
                        destinatario_id: this.targetUserId,
                        viagem_id: this.viagemId,
                        conteudo: locationMsg
                    })
                    .select()
                    .single();

                if (error) {
                    console.error('Erro ao enviar localização:', error);
                    alert('Erro ao enviar localização');
                }

                btn.innerHTML = originalContent;
                btn.disabled = false;
            },
            (error) => {
                console.error('Erro ao obter localização:', error);
                alert('Não foi possível obter sua localização. Verifique as permissões.');
                btn.innerHTML = originalContent;
                btn.disabled = false;
            },
            { enableHighAccuracy: true }
        );
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
        document.getElementById('btn-send-location')?.addEventListener('click', () => this.sendLocation());
        this.input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

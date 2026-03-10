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
        this.targetUserPhone = null;

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
            this.fetchTargetUserInfo();
        }

        this.setupEventListeners();
    }

    async fetchTargetUserInfo() {
        try {
            const { data, error } = await this.supabase
                .from('usuarios')
                .select('telefone')
                .eq('id', this.targetUserId)
                .single();

            if (data) {
                this.targetUserPhone = data.telefone;
            }
        } catch (e) {
            console.error("Erro ao buscar telefone do motorista:", e);
        }
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
        div.setAttribute('data-msg-id', msg.id);

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
                        <div class="relative h-32 w-full bg-slate-700 bg-cover bg-center" style="background-image: url('https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&z=15&l=map&size=400,150&pt=${lng},${lat},pm2blm');">
                            <div class="absolute inset-0 flex items-center justify-center bg-slate-900/20">
                                <div class="relative">
                                    <div class="absolute -inset-4 bg-primary/30 rounded-full animate-ping"></div>
                                    <span class="material-symbols-outlined text-primary text-4xl relative z-10 drop-shadow-lg" style="font-variation-settings: 'FILL' 1">location_on</span>
                                </div>
                            </div>
                        </div>
                        <div class="p-3 flex flex-col gap-2">
                            <div class="flex justify-between items-start">
                                <div class="space-y-0.5">
                                    <h3 class="font-bold text-xs text-white">Localização em Tempo Real</h3>
                                    <div class="flex items-center gap-1.5 text-slate-400">
                                        <span class="material-symbols-outlined text-[10px]">my_location</span>
                                        <span class="text-[9px] uppercase font-semibold tracking-wider">Salinas - MG</span>
                                    </div>
                                </div>
                                <div class="bg-primary/10 px-1.5 py-0.5 rounded text-[9px] font-bold text-primary uppercase border border-primary/20">Ao vivo</div>
                            </div>
                            <a href="${mapsUrl}" target="_blank" class="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-lg shadow-primary/25 decoration-none">
                                <span class="material-symbols-outlined text-sm">map</span>
                                <span class="text-xs">Abrir no Maps</span>
                            </a>
                        </div>
                    </div>
                    <div class="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
                        ${time} ${isMe ? `<span class="status-icon material-symbols-outlined text-[12px] ${msg.lida ? 'text-accent-cyan' : ''}">done_all</span>` : ''}
                    </div>
                `;
            } catch (e) {
                console.error("Erro ao renderizar localização:", e);
                div.innerHTML = `<div class="${bubbleClass} px-4 py-2 rounded-xl text-sm">[Erro ao carregar mapa]</div>`;
            }
        } else if (msg.conteudo.startsWith('[TRIP_REQUEST]')) {
            try {
                const data = JSON.parse(msg.conteudo.replace('[TRIP_REQUEST]', ''));
                div.innerHTML = `
                    <div class="bg-primary/10 dark:bg-slate-800/50 px-4 py-3 rounded-xl rounded-bl-none border border-primary/10 w-full">
                        <h3 class="text-primary font-bold text-sm uppercase tracking-wider mb-2">Nova Solicitação de Viagem</h3>
                        <div class="relative h-32 w-full bg-slate-700 rounded-lg overflow-hidden mb-3 border border-primary/20">
                            <img alt="Route map" class="w-full h-full object-cover opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-nJY_myfbt-ppHWtzIUPIArtqnek1l4npkifJyvzesWDhO3RvhSRCrbbxkq1hM6IiwYE6ZuJJaBTx2RQlyjeTqbitqZUL2jVvdAdhReuyIq8vmvZ8v7adAvbwbitggYbs6zjx-PtEW1a5BV-NQqFLLbYI2kFhPWwLeoCBJ2B9rdScu_XifLi9oS0nOzSjXlka5xmHeeQD65yRPlR4qtAlXg7WT4AdUpXZkahZVgTS0b59fjN5z9uiyCSjew6oqkz09Jxgh23ydrWo"/>
                            <div class="absolute inset-0 flex items-center justify-center">
                                <span class="material-symbols-outlined text-primary text-4xl drop-shadow-lg" style="font-variation-settings: 'FILL' 1">route</span>
                            </div>
                        </div>
                        <div class="space-y-3 mb-4">
                            <div class="flex gap-3 text-left">
                                <div class="flex flex-col items-center gap-1">
                                    <span class="material-symbols-outlined text-success text-lg" style="font-variation-settings: 'FILL' 1">fiber_manual_record</span>
                                    <div class="w-0.5 h-4 bg-slate-600"></div>
                                </div>
                                <div class="flex-1">
                                    <p class="text-[10px] text-slate-500 font-bold uppercase">ORIGEM</p>
                                    <p class="text-sm font-medium text-slate-200">${data.origem}</p>
                                </div>
                            </div>
                            <div class="flex gap-3 text-left">
                                <div class="flex flex-col items-center">
                                    <span class="material-symbols-outlined text-primary text-lg" style="font-variation-settings: 'FILL' 1">location_on</span>
                                </div>
                                <div class="flex-1">
                                    <p class="text-[10px] text-slate-500 font-bold uppercase">DESTINO</p>
                                    <p class="text-sm font-medium text-slate-200">${data.destino}</p>
                                </div>
                            </div>
                        </div>
                        <button class="w-full bg-primary/20 hover:bg-primary/30 text-primary font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors border border-primary/30">
                            <span class="material-symbols-outlined text-lg">map</span>
                            <span class="text-sm">Ver no Maps</span>
                        </button>
                    </div>
                    <div class="text-[9px] text-slate-500 mt-1">${time}</div>
                `;
            } catch (e) {
                console.error("Erro ao renderizar solicitação:", e);
                div.innerHTML = `<div class="${bubbleClass} px-4 py-2 rounded-xl text-sm">[Erro ao carregar solicitação]</div>`;
            }
        } else if (msg.conteudo.startsWith('[VALUE_PROPOSAL]')) {
            try {
                const data = JSON.parse(msg.conteudo.replace('[VALUE_PROPOSAL]', ''));
                div.innerHTML = `
                    <div class="bg-slate-900/40 border border-primary/20 rounded-xl p-4 space-y-4 backdrop-blur-sm w-full">
                        <div class="flex flex-col items-center text-center gap-1">
                            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest">Proposta de Valor</h4>
                            <div class="flex items-baseline gap-1">
                                <span class="text-xs font-medium text-slate-500">VALOR SUGERIDO:</span>
                                <span class="text-lg font-bold text-primary">R$ ${data.valor}</span>
                            </div>
                        </div>
                        <div class="flex flex-col gap-3">
                            <div class="relative">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                                <input class="w-full bg-slate-800 border-2 border-primary/30 rounded-xl py-3 pl-10 pr-4 text-xl font-bold text-center focus:ring-primary focus:border-primary text-slate-100" type="number" value="${data.valor.replace(',', '.')}" />
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <button class="bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-sm font-bold border border-slate-700 transition-colors text-slate-200">+ R$ 5,00</button>
                                <button class="bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-sm font-bold border border-slate-700 transition-colors text-slate-200">+ R$ 10,00</button>
                            </div>
                        </div>
                        <div class="flex gap-3 pt-2">
                            <button class="flex-1 border border-slate-600 text-slate-400 font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors">Recusar</button>
                            <button class="flex-[2] bg-success hover:bg-success/90 text-white font-bold py-3 rounded-xl shadow-lg shadow-success/20 transition-all active:scale-[0.98]">Aceitar Corrida</button>
                        </div>
                    </div>
                    <div class="text-[9px] text-slate-500 mt-1">${time}</div>
                `;
            } catch (e) {
                console.error("Erro ao renderizar proposta:", e);
                div.innerHTML = `<div class="${bubbleClass} px-4 py-2 rounded-xl text-sm">[Erro ao carregar proposta]</div>`;
            }
        } else {
            div.innerHTML = `
                <div class="flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}">
                    <div class="${bubbleClass} px-4 py-3 rounded-2xl ${isMe ? 'rounded-br-none' : 'rounded-bl-none'} text-sm text-slate-200 shadow-lg">
                        <p>${msg.conteudo}</p>
                        <div class="text-[9px] text-slate-400 mt-1.5 text-right flex items-center justify-end gap-1">
                            ${time} ${isMe ? `<span class="status-icon material-symbols-outlined text-[12px] ${msg.lida ? 'text-accent-cyan' : ''}">done_all</span>` : ''}
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
        // Canal para mensagens
        this.supabase.channel(`chat-${this.targetUserId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'mensagens',
                    filter: `destinatario_id=eq.${this.currentUser.id}`
                },
                (payload) => {
                    // Só renderiza se o remetente for o alvo atual
                    if (payload.new.remetente_id === this.targetUserId) {
                        this.renderMessage(payload.new);
                        this.scrollToBottom();
                        this.markAsRead();
                    }
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
                (payload) => {
                    // Mensagem que EU enviei em outro dispositivo ou aba
                    if (payload.new.destinatario_id === this.targetUserId) {
                        // Verifica se a mensagem já não está na tela (evitar duplicados de envios locais)
                        if (!document.querySelector(`[data-msg-id="${payload.new.id}"]`)) {
                            this.renderMessage(payload.new);
                            this.scrollToBottom();
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'mensagens',
                    filter: `remetente_id=eq.${this.currentUser.id}`
                },
                (payload) => {
                    // Quando o destinatário lê minha mensagem
                    if (payload.new.lida && payload.new.destinatario_id === this.targetUserId) {
                        const msgEl = document.querySelector(`[data-msg-id="${payload.new.id}"]`);
                        if (msgEl) {
                            const icon = msgEl.querySelector('.status-icon');
                            if (icon) icon.classList.add('text-accent-cyan');
                        }
                    }
                }
            )
            .subscribe();
    }

    setupEventListeners() {
        this.sendBtn?.addEventListener('click', () => this.sendMessage());
        document.getElementById('btn-send-location')?.addEventListener('click', () => this.sendLocation());
        document.getElementById('btn-call-driver')?.addEventListener('click', () => {
            if (this.targetUserPhone) {
                window.location.href = `tel:${this.targetUserPhone}`;
            } else {
                alert('Número de telefone não disponível.');
            }
        });
        this.input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

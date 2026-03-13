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
        // Pular renderização de cards de broadcast para o passageiro
        const isBroadcast = msg.conteudo.startsWith('[TRIP_REQUEST]') || msg.conteudo.startsWith('[VALUE_PROPOSAL]');
        if (!this.isMotorista && isBroadcast) return;

        const isMe = msg.remetente_id === this.currentUser.id;
        const time = new Date(msg.enviada_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const div = document.createElement('div');
        div.className = `flex flex-col items-end gap-2 ${isMe ? 'ml-auto' : ''} max-w-[90%] animate-fade-in`;
        div.setAttribute('data-msg-id', msg.id);
        if (msg.viagem_id) div.setAttribute('data-viagem-id', msg.viagem_id);

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
                                <div class="bg-orange-500/10 px-1.5 py-0.5 rounded text-[9px] font-bold text-orange-500 uppercase border border-orange-500/20">Ao vivo</div>
                            </div>
                            <a href="${mapsUrl}" target="_blank" class="w-full bg-orange-500 hover:bg-orange-500/90 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-lg shadow-orange-500/25 decoration-none">
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
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.destino)}`;
                const distId = `dist-${msg.id}`;

                div.innerHTML = `
                    <div class="trip-card bg-orange-500/10 dark:bg-slate-800/50 px-4 py-3 rounded-xl rounded-bl-none border border-orange-500/10 w-full text-left relative overflow-hidden">
                        <div class="absolute top-3 right-4 flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full z-10">
                            <span class="material-symbols-outlined text-[12px] text-orange-500">distance</span>
                            <span id="${distId}" class="text-[10px] font-bold text-orange-500 italic">calculando...</span>
                        </div>
                        <h3 class="text-orange-500 font-bold text-sm uppercase tracking-wider mb-2">Nova Solicitação de Viagem</h3>
                        <div class="relative h-32 w-full bg-slate-700 rounded-lg overflow-hidden mb-3 border border-orange-500/20">
                            <img alt="Route map" class="w-full h-full object-cover opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-nJY_myfbt-ppHWtzIUPIArtqnek1l4npkifJyvzesWDhO3RvhSRCrbbxkq1hM6IiwYE6ZuJJaBTx2RQlyjeTqbitqZUL2jVvdAdhReuyIq8vmvZ8v7adAvbwbitggYbs6zjx-PtEW1a5BV-NQqFLLbYI2kFhPWwLeoCBJ2B9rdScu_XifLi9oS0nOzSjXlka5xmHeeQD65yRPlR4qtAlXg7WT4AdUpXZkahZVgTS0b59fjN5z9uiyCSjew6oqkz09Jxgh23ydrWo"/>
                            <div class="absolute inset-0 flex items-center justify-center">
                                <span class="material-symbols-outlined text-orange-500 text-4xl drop-shadow-lg" style="font-variation-settings: 'FILL' 1">route</span>
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
                                    <span class="material-symbols-outlined text-orange-500 text-lg" style="font-variation-settings: 'FILL' 1">location_on</span>
                                </div>
                                <div class="flex-1">
                                    <p class="text-[10px] text-slate-500 font-bold uppercase">DESTINO</p>
                                    <p class="text-sm font-medium text-slate-200">${data.destino}</p>
                                </div>
                            </div>
                        </div>
                        <a href="${mapsUrl}" target="_blank" class="w-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-500 font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors border border-orange-500/30 decoration-none no-underline">
                            <span class="material-symbols-outlined text-lg">map</span>
                            <span class="text-sm">Ver no Maps</span>
                        </a>
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
                    <div class="proposal-card bg-slate-900/40 border border-orange-500/20 rounded-xl p-4 space-y-4 backdrop-blur-sm w-full text-center">
                        <h4 class="text-xs font-bold text-orange-500 uppercase tracking-widest block">Proposta de Valor</h4>
                        <div class="flex flex-col gap-3">
                            <div class="relative">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                                <input class="proposal-input w-full bg-slate-800 border-2 border-orange-500/30 rounded-xl py-3 pl-10 pr-4 text-xl font-bold text-center focus:ring-orange-500 focus:border-orange-500 text-slate-100" type="text" value="0,00" />
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <button class="btn-inc-val bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-sm font-bold border border-slate-700 transition-colors text-slate-200" data-val="5">+ R$ 5,00</button>
                                <button class="btn-inc-val bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-sm font-bold border border-slate-700 transition-colors text-slate-200" data-val="10">+ R$ 10,00</button>
                            </div>
                        </div>
                        <div class="flex gap-3 pt-2">
                            <button class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-900/20 active:scale-[0.98]">
                                Recusar
                            </button>
                            <button class="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-900/20 transition-all active:scale-[0.98]">
                                Aceitar Corrida
                            </button>
                        </div>
                    </div>
                    <div class="text-[9px] text-slate-500 mt-1">${time}</div>
                `;
            } catch (e) {
                console.error("Erro ao renderizar proposta:", e);
                div.innerHTML = `<div class="${bubbleClass} px-4 py-2 rounded-xl text-sm">[Erro ao carregar proposta]</div>`;
            }
        } else if (msg.conteudo.startsWith('[TRIP_ACCEPTED]')) {
            // Mensagem de sistema silenciosa, não renderiza card visual no chat
            // Pode ser usado apenas para atualizar status ou disparar notificações
            return;
        } else if (msg.conteudo.startsWith('[DRIVER_PROPOSAL]')) {
            try {
                const data = JSON.parse(msg.conteudo.replace('[DRIVER_PROPOSAL]', ''));
                div.innerHTML = `
                    <div class="flex flex-col gap-2 w-full">
                        <div class="driver-proposal-card ml-auto bg-slate-900/40 border border-primary/20 rounded-xl overflow-hidden shadow-xl w-full max-w-sm">
                            <div class="h-24 bg-center bg-no-repeat bg-cover relative grayscale-[0.3]" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuDAmZ3BknIvtNQ7SHXGNgqayylCjUfoSSuIdfAojUQR42TKU-gUCFyFzpGeolrciNsQiWhcqe7cizHd1EsNgxfWCx4cMz7Z8qRwcTEETH2pJ21r6abXRIokZa5S8_u0x3uqm7EulKut-fVA-5o3KBfhZ5fZIb2xpGLlzyCc4cotrvSl-7hNhJhfiLjY3YHal7jJhg0f1wIFNCsH5PdAu7gUf3SBYUSW1zwwQOsC3CqhtWV0v1SN0Syjrlt3GjHAgODoKelQLc2CzlgQ')">
                                <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                            </div>
                            <div class="p-4 flex flex-col gap-4">
                                <div class="flex justify-between items-start">
                                    <div class="space-y-1">
                                        <p class="text-primary text-[10px] font-bold uppercase tracking-wider">Proposta de Valor</p>
                                        <p class="text-slate-100 text-2xl font-black leading-tight">R$ ${data.valor}</p>
                                        <p class="text-slate-500 text-[10px]">Valor sugerido para a corrida selecionada.</p>
                                    </div>
                                    <span class="material-symbols-outlined text-primary/40 text-sm">info</span>
                                </div>
                                <div class="flex flex-col gap-2">
                                    <button class="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-green-900/20">
                                        <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1">check_circle</span>
                                        Concordar com o Valor
                                    </button>
                                    <div class="flex gap-2">
                                        <button class="flex-1 border border-yellow-500/30 hover:bg-yellow-500/10 text-yellow-500 py-2 rounded-lg font-bold text-xs transition-colors">
                                            Negociar
                                        </button>
                                        <button class="flex-1 border border-red-500/30 hover:bg-red-500/10 text-red-500 py-2 rounded-lg font-bold text-xs transition-colors">
                                            Recusar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="text-[9px] text-slate-500 mt-1">${time}</div>
                    </div>
                `;
            } catch (e) {
                console.error("Erro ao renderizar proposta do motorista:", e);
                div.innerHTML = `<div class="${bubbleClass} px-4 py-2 rounded-xl text-sm">[Erro na proposta]</div>`;
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

        // Se for uma solicitação de viagem, buscar a distância
        if (msg.conteudo.startsWith('[TRIP_REQUEST]')) {
            try {
                const data = JSON.parse(msg.conteudo.replace('[TRIP_REQUEST]', ''));
                this.fetchDistance(data.origem, data.destino, `dist-${msg.id}`);
            } catch (e) {
                console.error("Erro ao disparar fetchDistance:", e);
            }
        }
    }

    async fetchDistance(origin, destination, elementId) {
        if (!window.google || !window.google.maps) return;

        const service = new google.maps.DistanceMatrixService();
        try {
            const response = await service.getDistanceMatrix({
                origins: [origin],
                destinations: [destination],
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC,
            });

            const element = document.getElementById(elementId);
            if (element && response.rows[0].elements[0].status === "OK") {
                element.textContent = response.rows[0].elements[0].distance.text;
            } else if (element) {
                element.textContent = "N/D";
            }
        } catch (error) {
            console.error("Erro no DistanceMatrix:", error);
            const element = document.getElementById(elementId);
            if (element) element.textContent = "Erro";
        }
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

        const executeLocationRequest = () => {
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
        };

        if (window.requestLocationPermission) {
            window.requestLocationPermission()
                .then(() => executeLocationRequest())
                .catch((error) => {
                    console.log("Location permission dismissed:", error);
                    btn.innerHTML = originalContent;
                    btn.disabled = false;
                });
        } else {
            executeLocationRequest();
        }
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
        const callBtn = document.getElementById('btn-call-driver') || document.getElementById('btn-call-user');
        callBtn?.addEventListener('click', () => {
            if (this.targetUserPhone) {
                // Limpar caracteres não numéricos para o link tel:
                const cleanPhone = this.targetUserPhone.replace(/\D/g, '');
                window.location.href = `tel:${cleanPhone}`;
            } else {
                alert('Número de telefone não disponível.');
            }
        });
        this.input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Event delegation para os botões dos cards
        this.messagesContainer?.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            if (btn.textContent.includes('Aceitar Corrida')) {
                this.handleAcceptTrip(btn);
            } else if (btn.textContent.includes('Recusar') && this.isMotorista) {
                this.handleDeclineTrip(btn);
            } else if (btn.textContent.includes('Negociar')) {
                this.handlePassengerAction(btn, 'negotiate');
            } else if (btn.textContent.includes('Concordar com o Valor')) {
                this.handlePassengerAction(btn, 'agree');
            } else if (btn.textContent.includes('Recusar') && !this.isMotorista) {
                this.handlePassengerAction(btn, 'decline');
            } else if (btn.classList.contains('btn-inc-val')) {
                const card = btn.closest('.proposal-card');
                const input = card?.querySelector('.proposal-input');
                if (input) {
                    let currentVal = parseFloat(input.value.replace(',', '.')) || 0;
                    const increment = parseFloat(btn.dataset.val) || 0;
                    currentVal += increment;
                    input.value = currentVal.toFixed(2).replace('.', ',');
                }
            }
        });
    }

    async handlePassengerAction(btn, action) {
        // Obter nome do motorista do contexto da página
        const driverNameEl = document.getElementById('driver-name');
        const driverName = driverNameEl ? driverNameEl.textContent.trim() : 'Motorista';

        let messageText = '';

        switch (action) {
            case 'negotiate':
                messageText = `Olá ${driverName}, você aceita negociar o valor?`;
                break;
            case 'agree':
                messageText = `Olá ${driverName}, Eu concordo com o valor. Me avise quando estiver a caminho.`;
                break;
            case 'decline':
                messageText = `Olá ${driverName}, infelizmente precisarei cancelar a solicitação. Muito obrigado!`;
                break;
        }

        if (messageText) {
            // Preencher input e enviar
            if (this.input) {
                this.input.value = messageText;
                await this.sendMessage();
            }

            // Opcional: Feedback visual ou desabilitar botões após ação
            const card = btn.closest('.proposal-card') || btn.closest('.driver-proposal-card');
            if (card) {
                card.style.opacity = '0.7';
                card.querySelectorAll('button').forEach(b => b.disabled = true);
            }
        }
    }

    async handleAcceptTrip(btn) {
        if (!this.isMotorista) return; // Só motorista aceita

        const msgDiv = btn.closest('[data-viagem-id]');
        const currentViagemId = msgDiv?.getAttribute('data-viagem-id') || this.viagemId;

        if (!currentViagemId) {
            console.error("ID da viagem não encontrado no card.");
            return;
        }

        // Pegar o valor atual do input do card de proposta
        const valueInput = msgDiv?.querySelector('input');
        const acceptedValue = valueInput?.value || "85,00";

        // Feedback visual
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span>';
        btn.disabled = true;

        try {
            // Enviar mensagem de Proposta do Motorista (Card de Resposta)
            const proposalData = JSON.stringify({ valor: acceptedValue });
            const { error: errorProposal } = await this.supabase
                .from('mensagens')
                .insert({
                    remetente_id: this.currentUser.id,
                    destinatario_id: this.targetUserId,
                    viagem_id: currentViagemId,
                    conteudo: `[DRIVER_PROPOSAL]${proposalData}`
                });

            if (errorProposal) throw errorProposal;

            // Enviar banner de aceitação (Opcional - mas mantém o feedback visual de confirmada)
            await this.supabase
                .from('mensagens')
                .insert({
                    remetente_id: this.currentUser.id,
                    destinatario_id: this.targetUserId,
                    viagem_id: currentViagemId,
                    conteudo: '[TRIP_ACCEPTED]'
                });

            // Atualizar status da viagem
            await this.supabase
                .from('viagens')
                .update({ status: 'aceita', motorista_id: this.currentUser.id })
                .eq('id', currentViagemId);

            btn.innerHTML = 'Aceito!';
            btn.classList.add('bg-slate-600');
        } catch (err) {
            console.error('Erro ao aceitar viagem:', err);
            alert('Erro ao aceitar viagem.');
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    }

    async handleDeclineTrip(btn) {
        // Apenas oculta o card localmente ou remove a mensagem se desejar
        const card = btn.closest('.proposal-card') || btn.closest('.trip-card');
        if (card) {
            card.style.opacity = '0.5';
            card.style.pointerEvents = 'none';
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

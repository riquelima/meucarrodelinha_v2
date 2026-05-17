# Meu Carro de Linha Salinas — Análise Completa do Projeto

## Stack
- **Frontend:** HTML5 + Tailwind CSS (CDN) + Material Symbols + Google Maps API
- **Backend:** Supabase (Auth, Database, Storage, Edge Functions, Realtime)
- **PWA:** Service Worker (sw.js) + Push Notifications + Install Prompt
- **Hosting:** Vercel (static SPA)
- **Auth:** Supabase Auth + Custom Edge Function (auth-migrado) for legacy BCrypt users
- **Schema:** `supabase_schema.sql` + `supabase_schema` (tables used: `usuarios`, `motoristas`, `users_migrados`, `mensagens`, `viagens`, `anuncios`, `postagens`, `suporte`, `push_subscriptions`, `fotos_perfil`, `documentos_motoristas`, `avatars`)

## Estrutura de Arquivos

### JS Compartilhado (`js/`)
| Arquivo | Propósito |
|---------|-----------|
| `supabaseClient.js` | Init Supabase client + `window._toUUID()` global |
| `auth.js` | `signUpPassageiro()`, `signUpMotorista()`, `signIn()`, `signOut()`, `getCurrentUser()` |
| `authGuard.js` | Proteção de rotas: redireciona baseado em `tipo_usuario` |
| `chat-core.js` | `ChatManager` class — lógica de chat completa (mensagens, localização, propostas) |
| `chat-notifications.js` | Badge de chats não lidos + realtime |
| `conversas-motorista.js` | `ConversasMotorista` class — lista de conversas do motorista em `mensagensMotorista.html` |
| `data-cache.js` | `window.DataCache` — cache em localStorage com TTL |
| `gerenciar-usuarios.js` | Admin: CRUD de usuários (editar/deletar), busca, paginação |
| `homepage.js` | Homepage: autocomplete Google Places, listar motoristas/anúncios/blog |
| `location-modal.js` | `window.requestLocationPermission()` — modal elegante de permissão |
| `motorista-dashboard.js` | Botão online/offline, status, notificações |
| `navigation.js` | `window.goBack()` simples |
| `navigation-premium.js` | Micro-interações (tap scale) em todos os elementos clicáveis |
| `perfil-motorista.js` | Upload de foto + perfil do motorista |
| `push-manager.js` | `PushManager` — subscription push + salvar em `push_subscriptions` |
| `pwa-register.js` | Banner de instalação PWA (Android + iOS) |
| `share.js` | FAB de compartilhar o app |
| `sw-cleanup.js` | Limpeza de service workers antigos |
| `swipe-back.js` | Vazio (placeholder) |
| `tailwind-cdn.js` | CDN Tailwind |
| `todosmotoristas.js` | Lista de motoristas em `todosmotoristas.html` |
| `ui-transitions.js` | `window.AppUI` — efeitos de clique, revelação, diálogos |

### Páginas HTML (Principais)

#### Homepage / Splash
- **`index.html`** — Splash screen / entry point (animação, redireciona para homepage)
- **`homepage.html`** — Landing page (busca destino, lista motoristas, anúncios, blog, PWA install)

#### Passageiro (`passageiro.html`)
- **Views:** Home (busca + mapa), Chats (lista conversas + chat ativo), Perfil
- **Funções-chave:** `openActiveChat(driver)`, `sendActiveChatMessage()`, `chamarMotorista()`, `loadChatList()`
- **Cria stubs em `usuarios` para users migrados** antes de enviar mensagem
- **localStorage:** `mcl_custom_session`, `mcl_migrado`

#### Motorista (`motorista.html`)
- **Views:** Home (mapa + toggle online), Chats (lista conversas + chat ativo), Perfil (dados veículo, suporte)
- **Funções-chave:** `openActiveChat(targetUser)`, `sendActiveChatMessage()`, `ensureUserExists()`, `loadChatList()`, `abrirVeiculo()`
- **localStorage:** `mcl_custom_session`, `mcl_migrado`

#### Admin (`admin.html`)
- Dashboard com cards de estatísticas, gerenciamento de usuários, blog, anúncios, suporte

#### Páginas de Login/Cadastro
- `loginPassageiro.html`, `loginMotorista.html`
- `cadastroMotorista.html`, `criarConta.html`
- `confirmacaoCadastroMotorista.html`, `contaCriada.html`

#### Páginas de Chat (standalone)
- **`chat.html`** — Chat passageiro (usa `chat-core.js` → `ChatManager`)
- **`chatMotorista.html`** — Chat motorista (usa `chat-core.js` → `ChatManager`)
- **`mensagens.html`** — Lista conversas passageiro
- **`mensagensMotorista.html`** — Lista conversas motorista (usa `conversas-motorista.js`)

#### Páginas de Viagem
- `agendarViagem.html`, `viagemSolicitada.html`, `solicitadaComSucesso.html`
- `historicoViagens.html`, `minhasViagens.html`
- `propostaValor.html`, `confirmarSaida.html`
- `localizacaoAtual.html`

#### Páginas de Veículo / Motorista
- `perfilMotorista.html`, `perfilPassageiro.html`, `perfilAdministrador.html`
- `novoMotorista.html`, `solicitacaoMotorista.html`
- `meusganhos.html`, `minhasAvaliacoes.html`
- `todosmotoristas.html`

#### Admin Pages
- `gerenciarUsuarios.html`, `gerenciarAnuncios.html`, `gerenciarBlog.html`
- `novoAnuncio.html`, `novoPost.html`, `editarUsuario.html`
- `emailMarketing.html`, `emailMarketingClientes.html`, `enviarNotificacoes.html`
- `cobrancaAnuncio.html`
- `mensagensSuporte.html`

#### Outras
- `blog.html`, `blogPost.html`, `anuncios.html`, `anuncioCriado.html`
- `faleConosco.html`, `politicaPrivacidade.html`, `menu.html`
- `configuracoesPassageiro.html`, `historicoGeral.html`
- `offline.html`, `loggofModal.html`

## Supabase Tables Usadas

| Tabela | Propósito |
|--------|-----------|
| `usuarios` | Perfis oficiais (UUID do Auth). Campos: id, nome, email, telefone, foto_perfil_url, tipo_usuario, criado_em |
| `users_migrados` | Usuários legados (MongoDB → Supabase). Campos: _id, name, email, number, role, avatar, vehicle, plate, carColor, profileViews |
| `motoristas` | Dados extras do motorista. FK: usuario_id → usuarios.id. Campos: cpf, modelo_veiculo, placa_veiculo, cor_veiculo, status_online, avaliacao_media |
| `viagens` | Corridas. FK: passageiro_id, motorista_id. Campos: origem/destino, valor, status |
| `mensagens` | Chat. FK: remetente_id, destinatario_id → usuarios.id. Campos: conteudo, enviada_em, lida, viagem_id |
| `anuncios` | Anúncios na homepage. Campos: titulo, imagem_url, link_acao, ativo |
| `postagens` | Blog. Campos: titulo, slug, conteudo, imagem_capa_url, categoria, publicado |
| `suporte` | Chamados de suporte. Campos: usuario_id, nome, email, assunto, mensagem, status, conversa[] |
| `push_subscriptions` | Inscrições push notification |

## localStorage Keys
| Key | Propósito |
|-----|-----------|
| `mcl_custom_session` | Sessão customizada (users migrados) |
| `mcl_migrado` | Dados do user migrado direto |
| `mcl_share_dismissed` | FAB share foi fechado |
| `mcls_cache_*` | Cache do DataCache |
| `locationModalAccepted` | Permissão de localização aceita |
| `push_prompt_seen` | Prompt de push já exibido |
| `pwa-install-dismissed` | Banner PWA fechado |
| `mcl_suporte_read_*` | Última leitura de chamados |

## Fluxo de Autenticação (Dual)
1. Tenta Supabase Auth (`signInWithPassword`)
2. Se falhar, tenta Edge Function `/functions/v1/auth-migrado` (BCrypt → MongoDB → Supabase)
3. Se sucesso na Edge, salva `mcl_migrado` + `mcl_custom_session` no localStorage
4. `authGuard.js` verifica session em todas páginas protegidas

## Fluxo de Chat (Migrados)
1. Passageiro seleciona motorista → `openActiveChat(driver)` no `passageiro.html`
2. Gera UUID determinístico via `_toUUID(driver.id)` → cria stub em `usuarios` se não existir
3. Mensagem inserida em `mensagens` com `remetente_id` e `destinatario_id` = UUIDs
4. Motorista carrega `loadChatList()` → busca mensagens com `_toUUID(user.id)`
5. **IMPORTANTE:** `_toUUID` está em `supabaseClient.js:16` (ambos lados usam o mesmo)

## Service Worker (`sw.js`)
- Cache-first para assets estáticos
- Network-first para páginas HTML
- Stale-while-revalidate para API Supabase REST
- Bypass para Edge Functions, Google Maps
- Push notifications
- Background sync

## Vercel (`vercel.json`)
- Rotas amigáveis: `/homepage`, `/loginPassageiro`, `/loginMotorista`, etc.
- Headers de segurança (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
- Cache de assets estáticos (1 ano)

## Esquema de Cores
- **Primária:** Laranja (#f97316 / #FF9100)
- **Fundo escuro:** #121520 / #0a0c14
- **Superfície:** #1a1e2e / #1c2131
- **Motorista (chat):** Bolha azul (#1e40ae) para motorista, cinza para passageiro
- **Passageiro (chat):** Bolha laranja (#f97316) para passageiro, cinza para motorista
const CACHE_NAME = 'meu-carro-de-linha-v1';
const OFFLINE_URL = 'offline.html';

const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/homepage.html',
    '/offline.html',
    '/manifest.json',
    '/logoTransparente.png',
    '/splashScreen.jpeg',
    '/js/supabaseClient.js',
    '/js/pwa-register.js',
    '/js/auth.js',
    '/js/authGuard.js',
    'https://cdn.tailwindcss.com?plugins=forms,container-queries',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Pré-caching offline pages e assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Estratégia de Fetch
self.addEventListener('fetch', (event) => {
    // Apenas requisições GET
    if (event.request.method !== 'GET') return;

    // Para páginas HTML, usar Network-First (queremos dados sempre atualizados do servidor/Supabase)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(OFFLINE_URL);
            })
        );
        return;
    }

    // Para outros assets, usar Cache-First
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchResponse) => {
                // Opcionalmente: colocar novas requisições no cache aqui (Stale-While-Revalidate seria melhor)
                return fetchResponse;
            });
        }).catch(() => {
            // Se falhar tudo (ex: imagem externa que não está no cache)
            if (event.request.destination === 'image') {
                return caches.match('/logoTransparente.png');
            }
        })
    );
});

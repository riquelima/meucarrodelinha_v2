const CACHE_NAME = 'meucarrosalinas-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/homepage.html',
  '/manifest.json',
  '/splashScreen.jpeg',
  '/logoTransparente.png',
  '/gifSplashScreen.gif',
  '/js/supabaseClient.js',
  '/js/homepage.js',
  '/js/location-modal.js',
  '/offline.html',
  '/admin.html',
  '/gerenciarUsuarios.html',
  '/gerenciarBlog.html',
  '/gerenciarAnuncios.html',
  '/perfilAdministrador.html',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(err => console.error('[SW] Cache installation error:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[SW] Deleting old cache:', key);
          return caches.delete(key);
        }
      })
    ))
  );
  self.clients.claim();
});

// Listener para forçar atualização
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // BYPASS for APIs and Analytics
  if (url.hostname.includes('maps.googleapis.com') ||
    url.hostname.includes('maps.gstatic.com') ||
    url.pathname.includes('/rest/v1/') || // Supabase REST API
    url.pathname.includes('/auth/v1/') || // Supabase Auth API
    url.hostname.includes('google-analytics.com')) {
    return; // Pass through to network
  }

  // Strategy: Network First for HTML, Cache First for others
  if (event.request.mode === 'navigate' || (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Update cache with fresh version
          const resClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
          return response;
        })
        .catch(() => {
          // Offline? Try cache, then fallback to offline.html
          return caches.match(event.request).then(response => {
            return response || caches.match('/offline.html');
          });
        })
    );
  } else {
    // Cache First for resources (images, scripts, fonts)
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).catch(err => {
          console.log('[SW] Fetch failed for:', event.request.url);
          // Return nothing or an empty response to avoid console noise if needed
          return new Response('', { status: 408, statusText: 'Network Timeout' });
        });
      })
    );
  }
});

// BACKGROUND SYNC - Garante que ações pendentes sejam enviadas ao recuperar conexão
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    console.log('[SW] Background sync: sync-messages');
    // Aqui poderíamos chamar uma função para processar mensagens salvas no IndexedDB
  }
});

// PERIODIC BACKGROUND SYNC - Atualiza dados periodicamente
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-cache') {
    console.log('[SW] Periodic background sync: update-cache');
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
    );
  }
});

// PUSH NOTIFICATIONS - Recebe notificações do servidor
self.addEventListener('push', (event) => {
    let data = { 
        title: 'Meu Carro de Linha', 
        body: 'Você tem uma nova mensagem!',
        icon: '/splashScreen.jpeg',
        url: '/'
    };

    if (event.data) {
        try {
            const json = event.data.json();
            data = { ...data, ...json };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        badge: '/logoTransparente.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/'
        },
        actions: [
            { action: 'open', title: 'Ver Agora' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// NOTIFICATION CLICK - Abre o app e vai para a URL específica
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
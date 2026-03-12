const CACHE_NAME = 'meucarrosalinas-v3';
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
        .catch(() => caches.match(event.request)) // Offline? Try cache
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
const CACHE_NAME = 'meucarrosalinas-v2';
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
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // BYPASS Google Maps API and Supabase (Avoid ERR_FAILED & Opaque errors)
  if (url.hostname.includes('maps.googleapis.com') ||
    url.hostname.includes('maps.gstatic.com') ||
    url.hostname.includes('supabase.co')) {
    return; // Let it go to the network
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
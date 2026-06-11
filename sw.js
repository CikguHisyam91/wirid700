const CACHE = 'w700-v7';
const STATIC = [
  './', './index.html', './manifest.json', './icon.svg',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap',
  'https://fonts.gstatic.com/s/amiri/v27/J7aRnpd8CGxBHpUrtLMA7w.woff2',
  'https://fonts.gstatic.com/s/amiri/v27/J7aRnpd8CGxBHpUrtLYA.woff2'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  // Network-first for GAS requests
  if (url.includes('script.google.com')) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(res => {
        if (res.ok && (url.includes('fonts.g') || url.endsWith('.html') || url.endsWith('.js'))) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => cached || new Response('Offline', {status: 503}));
      return cached || net;
    })
  );
});

// Show notification from app
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'NOTIFY') {
    self.registration.showNotification(e.data.title, {
      body: e.data.body,
      icon: './icon.svg',
      badge: './icon.svg',
      tag: e.data.tag || 'wirid700',
      requireInteraction: false
    });
  }
});

// Service Worker — Raspadora Brasília PWA
// HTML/navegação: network-first (deploy aparece na hora). Dados da API NUNCA são cacheados.
const CACHE = 'raspadora-v66';
const ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Detecta se a requisição é do documento HTML (app shell) — precisa ser sempre fresca.
function isHTML(req, url) {
  return req.mode === 'navigate'
    || url.pathname === '/'
    || url.pathname === '/index.html'
    || (req.headers.get('accept') || '').includes('text/html');
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Nunca cacheia chamadas de API nem outros hosts (Supabase) — sempre rede.
  if (e.request.method !== 'GET' || url.pathname.startsWith('/api/') || url.origin !== self.location.origin) {
    return; // deixa o browser lidar (rede)
  }

  // HTML / navegação → NETWORK-FIRST: sempre tenta a versão nova; cai no cache só se estiver offline.
  if (isHTML(e.request, url)) {
    e.respondWith(
      fetch(e.request).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/index.html', copy));
        }
        return res;
      }).catch(() => caches.match('/index.html').then((c) => c || caches.match(e.request)))
    );
    return;
  }

  // Demais assets estáticos (ícones, manifest, etc.) → cache-first com atualização em segundo plano.
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetched = fetch(e.request).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});

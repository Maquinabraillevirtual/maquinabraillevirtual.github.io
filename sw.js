/* Máquina Braille Virtual — caché para funcionar sin conexión.
   Al publicar una versión nueva, cambia VERSION para que los equipos la descarguen. */
const VERSION = 'mbv-2026-11-02-1';
const FILES = ['./', './index.html', './manifest.webmanifest',
  './iconos/icono-192.png', './iconos/icono-512.png', './iconos/icono-maskable-512.png', './iconos/icono-180.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    /* Páginas: primero la red (para recibir actualizaciones), si no hay conexión, la copia guardada */
    if (e.request.mode === 'navigate') {
      e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put('./index.html', c)); return r; })
        .catch(() => caches.match('./index.html')));
      return;
    }
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
    return;
  }
  /* Tipografía Atkinson Hyperlegible: se guarda la primera vez que se descarga */
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const c = res.clone(); caches.open(VERSION).then(x => x.put(e.request, c)); return res; })));
  }
});

/* TagAi service worker. It only does one thing: when a page cannot load because the phone is offline,
   show a friendly "No connection" page instead of the browser error. Nothing else is cached, so an
   update of the app is never held back by an old copy. */
const OFFLINE = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('tagai-offline-v1').then((c) => c.add(OFFLINE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('tagai-offline-') && k !== 'tagai-offline-v1').map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE)));
});

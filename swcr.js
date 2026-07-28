/* CR HSE — CDES · Service worker
 * Rend l'appli installable (« Installer l'application » dans Chrome)
 * et utilisable hors connexion (réseau d'abord, cache en secours). */
const CACHE = 'crhse-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return; // l'envoi PA / l'IA (POST) passent en direct
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok && req.url.startsWith(self.location.origin)) {
          const copie = res.clone();
          caches.open(CACHE).then(c => c.put(req, copie));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});

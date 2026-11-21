// Ancienne adresse de RiftDex : ce service worker remplace l'ancien, vide ses caches, se désinstalle
// et recharge les pages ouvertes, qui affichent alors le renvoi vers la nouvelle adresse.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url);
})()));

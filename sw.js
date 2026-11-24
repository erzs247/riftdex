// Cache hors ligne : l'interface et les images sont servies depuis le cache, les données sont rafraîchies dès que possible.
// Seules les réponses valides sont mises en cache : une erreur passagère (réseau coupé, mise à jour du site)
// n'est jamais mémorisée, la ressource est simplement redemandée la fois suivante.
const CACHE = 'riftdex-v28';
// les images des cartes restent hébergées sur GitHub Pages (gratuit et sans limite de trafic) : l'appli les y demande
const IMAGES = 'https://erzs247.github.io/riftdex/';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon.svg?v=3', 'data/config.json'];
const keep = (req, r) => { if (r && r.ok && r.type === 'basic') { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return r; };
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  // supprime les anciens caches
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // pages de connexion de Firebase (/__/auth/…) : jamais interceptées ni gardées en cache
  if (url.pathname.startsWith('/__/')) return;
  if (url.pathname.includes('/data/') || /\/(app\.js|styles\.css|index\.html)?$/.test(url.pathname)) {
    // données et code de l'appli : réseau d'abord (mises à jour visibles tout de suite), cache si hors ligne
    // (cache: 'no-cache' : on revalide auprès du serveur, sans resservir une copie gardée par le navigateur)
    e.respondWith(fetch(e.request, { cache: 'no-cache' }).then((r) => keep(e.request, r)).catch(() => caches.match(e.request)));
  } else if (url.pathname.includes('/images/') && !location.hostname.endsWith('github.io')) {
    // images de cartes : cache d'abord, sinon GitHub Pages (en CORS, pour pouvoir les garder hors ligne)
    const remote = IMAGES + url.pathname.slice(url.pathname.indexOf('images/')) + url.search;
    e.respondWith(caches.match(e.request).then((hit) => (hit && hit.ok ? hit : fetch(remote, { mode: 'cors' }).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      return r;
    }))));
  } else {
    // images : cache d'abord (rapide, hors ligne), sinon réseau
    e.respondWith(caches.match(e.request).then((hit) => (hit && hit.ok ? hit : fetch(e.request).then((r) => keep(e.request, r)))));
  }
});

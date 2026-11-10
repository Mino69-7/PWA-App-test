// Service worker : met tout le jeu en cache pour qu'il marche hors-ligne.
// Pour publier une mise à jour, augmenter le numéro de VERSION (voir README).

const VERSION = 2;
// Le cache porte le chemin du site : la version de test (/PWA-App-test/) et la vraie
// (/PWA-App/) partagent le même domaine sans jamais effacer le cache l'une de l'autre.
const SCOPE = new URL(self.registration.scope).pathname;
const CACHE = `coucou-v${VERSION}${SCOPE}`;

const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/base.css',
  './js/main.js',
  './js/core/input.js',
  './js/core/audio.js',
  './js/core/layout.js',
  './js/core/session.js',
  './js/core/homeGuard.js',
  './js/core/effects.js',
  './js/core/game.js',
  './js/core/levels.js',
  './js/data/art.js',
  './js/data/phrases.js',
  './js/data/recordings.js',
  './js/games/train.js',
  './js/games/bubbles.js',
  './js/games/shapes.js',
  './js/games/colors.js',
  './js/games/coloring.js',
  './js/games/peekaboo.js',
  './js/games/food.js',
  './js/games/music.js',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // Ajouter ici les éventuels fichiers audio enregistrés, ex. './audio/chat.m4a'
];

// Liste des voix générées (audio/voix/liste.js, créé par outils/voix/generer.mjs).
self.VOICE_FILES = [];
try { importScripts('./audio/voix/liste.js'); } catch (_) { /* pas encore de voix */ }
FILES.push(...self.VOICE_FILES);

// En local (développement), on privilégie le réseau pour voir les modifications tout de suite.
const DEV = ['localhost', '127.0.0.1'].includes(self.location.hostname);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k.endsWith(SCOPE)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(DEV ? networkFirst(req) : cacheFirst(req));
});

async function cacheFirst(req) {
  const cached = await (await caches.open(CACHE)).match(req, { ignoreSearch: req.mode === 'navigate' });
  if (cached) return cached;
  return fetchAndStore(req);
}

async function networkFirst(req) {
  try {
    return await fetchAndStore(req);
  } catch (err) {
    const cached = await (await caches.open(CACHE)).match(req, { ignoreSearch: req.mode === 'navigate' });
    if (cached) return cached;
    throw err;
  }
}

async function fetchAndStore(req) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch (err) {
    if (req.mode === 'navigate') {
      const index = await (await caches.open(CACHE)).match('./index.html');
      if (index) return index;
    }
    throw err;
  }
}

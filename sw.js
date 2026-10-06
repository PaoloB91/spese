/* Service worker: rende l'app apribile anche senza rete.
   CACHE_VERSION va incrementata a ogni pubblicazione (lo fa deploy.sh). */
const CACHE_VERSION = "spese-v2";
const FILE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./icon-maskable-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(c => c.addAll(FILE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(n => n !== CACHE_VERSION).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

/* Rete prima (per prendere gli aggiornamenti), cache come rete di sicurezza. */
self.addEventListener("fetch", e => {
  if(e.request.method !== "GET") return;
  /* solo i file dell'app: le chiamate all'archivio online non vanno mai in cache */
  if(new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const copia = r.clone();
        caches.open(CACHE_VERSION).then(c => c.put(e.request, copia)).catch(() => {});
        return r;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});

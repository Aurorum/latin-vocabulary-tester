const OFFLINE_VERSION = 2;
const CACHE_NAME = "offline";

const URLS_TO_CACHE = [
    "manifest.json",
    "scripts.js",
    "style.css",
    "./vocab-lists/cambridge-latin-course.js",
    "./vocab-lists/literature.js",
    "./vocab-lists/alevel-ocr.js",
    "./vocab-lists/gcse-eduqas.js",
    "./vocab-lists/gcse-ocr.js",
    "./assets/dictionary.svg",
    "./assets/dropdown-white.svg",
    "./assets/laurel.svg",
    "./assets/gladiator.svg",
    "./assets/confetti.png",
    "./assets/scroll.svg",
    "./assets/helmet.svg",
    "./assets/start.svg",
    "./assets/colosseum.svg",
    "./assets/close.svg",
    "./assets/arena.jpg",
    "./assets/dropdown.svg",
    "./assets/favicon.png",
    "./assets/click.mp3",
    "./assets/screenshots/scrabble.png",
    "./assets/screenshots/word-bites.png",
    "./assets/screenshots/wordle.png",
    "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&family=Roboto&display=swap",   
    "https://fonts.gstatic.com/s/montserrat/v25/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.add(new Request("/",{cache:"reload"}));
      URLS_TO_CACHE.map( (url) => cache.add(url));              
    })()
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {

      if ("navigationPreload" in self.registration) {
        await self.registration.navigationPreload.enable();
      }
    })()
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {

    event.respondWith(
      (async () => {
        try {

          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }

         const networkResponse = await fetch(event.request);

         return networkResponse;


        } catch (error) {     
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(event.request.url);
          return cachedResponse;
        }
      })()
    );
});
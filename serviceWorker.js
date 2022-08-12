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
    "https://www.gravatar.com/avatar/581e9719c44732a58a27b872f282c053.jpg?s=60",
    "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Roboto&display=swap",   
    "https://fonts.gstatic.com/s/montserrat/v25/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2",
    "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Roboto&display=swap"
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Setting {cache: 'reload'} in the new request ensures that the
      // response isn't fulfilled from the HTTP cache; i.e., it will be
      // from the network.
      await cache.add(new Request("/",{cache:"reload"}));
      URLS_TO_CACHE.map( (url) => cache.add(url));              
    })()
  );
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Enable navigation preload if it's supported.
      // See https://developers.google.com/web/updates/2017/02/navigation-preload
      if ("navigationPreload" in self.registration) {
        await self.registration.navigationPreload.enable();
      }
    })()
  );

  // Tell the active service worker to take control of the page immediately.
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only call event.respondWith() if this is a navigation request
  // for an HTML page.
  //if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          // First, try to use the navigation preload response if it's
          // supported.
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }

        //   Always try the network first.
         const networkResponse = await fetch(event.request);

         return networkResponse;


        } catch (error) {
          // catch is only triggered if an exception is thrown, which is
          // likely due to a network error.
          // If fetch() returns a valid HTTP response with a response code in
          // the 4xx or 5xx range, the catch() will NOT be called.
        
//          console.log(event.request.url);
//          console.log("Fetch failed; returning offline page instead.", error);

          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(event.request.url);
//          console.log(cachedResponse)
          //cachedResponse.headers.append("Warning","ReturnedFromServiceWorker")
          return cachedResponse;


        }
      })()
    );
  //}

  // If our if() condition is false, then this fetch handler won't
  // intercept the request. If there are any other fetch handlers
  // registered, they will get a chance to call event.respondWith().
  // If no fetch handlers call event.respondWith(), the request
  // will be handled by the browser as if there were no service
  // worker involvement.
});
let OFFLINE_VERSION = 5;
let CACHE_NAME = 'offline';

let URLS_TO_CACHE = [
	'manifest.json',
	'scripts.js',
	'style.css',
	'./vocab-lists/cambridge-latin-course.json',
	'./vocab-lists/literature.json',
	'./vocab-lists/alevel-ocr.json',
	'./vocab-lists/gcse-eduqas.json',
	'./vocab-lists/gcse-ocr.json',
	'./assets/dictionary.svg',
	'./assets/dropdown-white.svg',
	'./assets/laurel.svg',
	'./assets/gladiator.svg',
	'./assets/confetti.svg',
	'./assets/scroll.svg',
	'./assets/helmet.svg',
	'./assets/start.svg',
	'./assets/colosseum.svg',
	'./assets/close.svg',
	'./assets/arena.jpg',
	'./assets/dropdown.svg',
	'./assets/favicon.png',
	'./assets/click.mp3',
	'./assets/screenshots/scrabble.png',
	'./assets/screenshots/word-bites.png',
	'./assets/screenshots/wordle.png',
	'https://www.gravatar.com/avatar/581e9719c44732a58a27b872f282c053.jpg?s=360',
	'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap',
	'https://fonts.gstatic.com/s/montserrat/v25/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2',
];

self.addEventListener( 'install', ( event ) => {
	event.waitUntil(
		( async () => {
			let cache = await caches.open( CACHE_NAME );
			await cache.add( new Request( '/', { cache: 'reload' } ) );
			URLS_TO_CACHE.map( ( url ) => cache.add( url ) );
		} )()
	);
	self.skipWaiting();
} );

self.addEventListener( 'activate', ( event ) => {
	event.waitUntil(
		( async () => {
			if ( 'navigationPreload' in self.registration ) {
				await self.registration.navigationPreload.enable();
			}
		} )()
	);

	self.clients.claim();
} );

self.addEventListener( 'fetch', ( event ) => {
	event.respondWith(
		( async () => {
			try {
				let preloadResponse = await event.preloadResponse;
				if ( preloadResponse ) {
					return preloadResponse;
				}

				let networkResponse = await fetch( event.request );

				return networkResponse;
			} catch ( error ) {
				let cache = await caches.open( CACHE_NAME );
				let cachedResponse = await cache.match( event.request.url );
				return cachedResponse;
			}
		} )()
	);
} );

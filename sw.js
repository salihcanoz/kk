// Offline support: after the first visit the reader, the learn page and their
// data files are served from cache. Corpus lookups and fonts are cached as they
// are used, so previously viewed words keep their translations offline.
const CACHE_VERSION = 'v1';
const APP_CACHE = `app-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const CORPUS_CACHE = 'corpus-v1';

const APP_FILES = [
    './',
    'i.html',
    'index.html',
    'style.css',
    'script.js',
    'surahs.js',
    'tr.js',
    'tr.diyanet.js',
    'tajweed.js',
    'favicon.png',
    'learn/',
    'learn/index.html',
    'learn/learn.css',
    'learn/learn.js'
];

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

function scopeUrl(path) {
    return new URL(path, self.registration.scope).href;
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(APP_CACHE).then((cache) => Promise.all(
            // Add files one by one so a single missing file does not abort the install.
            APP_FILES.map((file) => cache.add(new Request(scopeUrl(file), {cache: 'reload'}))
                .catch((error) => console.warn(`Offline cache skipped ${file}`, error)))
        )).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    const keep = new Set([APP_CACHE, RUNTIME_CACHE, CORPUS_CACHE]);
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

function isCacheable(response) {
    return response && (response.ok || response.type === 'opaque');
}

async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (isCacheable(response)) {
        cache.put(request, response.clone());
    }
    return response;
}

// Serve from cache immediately and refresh the cached copy in the background.
async function staleWhileRevalidate(request, event) {
    const cache = await caches.open(APP_CACHE);
    const cached = await cache.match(request, {ignoreSearch: true});
    const network = fetch(request)
        .then((response) => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        });

    if (cached) {
        event.waitUntil(network.catch(() => {}));
        return cached;
    }

    try {
        return await network;
    }
    catch (error) {
        if (request.mode === 'navigate') {
            const fallback = await cache.match(scopeUrl('i.html'));
            if (fallback) return fallback;
        }
        throw error;
    }
}

async function healthCheck(request) {
    try {
        return await fetch(request);
    }
    catch (error) {
        // Offline: keep word tools enabled so cached corpus translations still show.
        return new Response('offline', {
            status: 200,
            headers: {'Content-Type': 'text/plain; charset=utf-8', 'X-Offline': '1'}
        });
    }
}

self.addEventListener('fetch', (event) => {
    const {request} = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    if (FONT_HOSTS.includes(url.hostname)) {
        event.respondWith(cacheFirst(request, RUNTIME_CACHE));
        return;
    }

    if (url.origin !== self.location.origin) return;

    const scopePath = new URL(self.registration.scope).pathname;
    const path = url.pathname.startsWith(scopePath) ? url.pathname.slice(scopePath.length) : url.pathname;

    if (path === 'health') {
        event.respondWith(healthCheck(request));
        return;
    }

    if (path === 'corpus-wordbyword' || path === 'corpus-dictionary') {
        // Requests without parameters are availability probes; never cache them.
        if (!url.search) return;
        event.respondWith(cacheFirst(request, CORPUS_CACHE));
        return;
    }

    event.respondWith(staleWhileRevalidate(request, event));
});

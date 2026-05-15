// postlio_frontend/public/sw.js
const CACHE_VERSION = 'postlio-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Zasoby do cache'owania od razu (App Shell)
const STATIC_ASSETS = [
    '/',
    '/offline',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
];

// Strategie cache'owania
const CACHE_STRATEGIES = {
    // Cache First - dla statycznych zasobów
    cacheFirst: async (request, cacheName = STATIC_CACHE) => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        try {
            const networkResponse = await fetch(request);
            if (networkResponse.ok) {
                const cache = await caches.open(cacheName);
                // Clone PRZED użyciem
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        } catch (error) {
            return null;
        }
    },

    // Network First - dla dynamicznych danych
    networkFirst: async (request, cacheName = DYNAMIC_CACHE) => {
        try {
            const networkResponse = await fetch(request);
            if (networkResponse.ok) {
                const cache = await caches.open(cacheName);
                // Clone PRZED użyciem
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        } catch (error) {
            const cachedResponse = await caches.match(request);
            return cachedResponse || null;
        }
    },

    // Stale While Revalidate - NAPRAWIONE
    staleWhileRevalidate: async (request, cacheName = DYNAMIC_CACHE) => {
        const cachedResponse = await caches.match(request);

        // Revalidate w tle
        const fetchPromise = fetch(request)
            .then(async (networkResponse) => {
                if (networkResponse.ok) {
                    const cache = await caches.open(cacheName);
                    // Clone PRZED cache.put
                    await cache.put(request, networkResponse.clone());
                }
                return networkResponse;
            })
            .catch(() => null);

        // Zwróć cache od razu, lub czekaj na network
        return cachedResponse || fetchPromise;
    }
};

// Instalacja Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Aktywacja - usuwanie starych cache'ów
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name.startsWith('postlio-') &&
                            name !== STATIC_CACHE &&
                            name !== DYNAMIC_CACHE &&
                            name !== IMAGE_CACHE)
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Obsługa żądań
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignoruj zewnętrzne domeny
    if (!url.origin.includes(self.location.origin)) {
        return;
    }

    // Ignoruj API requests
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // Ignoruj _next/webpack-hmr (dev)
    if (url.pathname.includes('webpack-hmr') || url.pathname.includes('_next/static/webpack')) {
        return;
    }

    // Ignoruj RSC requests (Next.js Server Components) - to powodowało problemy!
    if (url.searchParams.has('_rsc')) {
        return;
    }

    // Obrazy - Cache First
    if (request.destination === 'image') {
        event.respondWith(
            CACHE_STRATEGIES.cacheFirst(request, IMAGE_CACHE)
                .then((response) => response || fetch(request))
                .catch(() => null)
        );
        return;
    }

    // Strony nawigacyjne - Network First z fallback na offline
    if (request.mode === 'navigate') {
        event.respondWith(
            CACHE_STRATEGIES.networkFirst(request)
                .then((response) => {
                    if (response) return response;
                    return caches.match('/offline');
                })
                .catch(() => caches.match('/offline'))
        );
        return;
    }

    // Statyczne assety Next.js - Cache First
    if (url.pathname.startsWith('/_next/static/')) {
        event.respondWith(
            CACHE_STRATEGIES.cacheFirst(request, STATIC_CACHE)
                .then((response) => response || fetch(request))
                .catch(() => null)
        );
        return;
    }

    // Pozostałe - Network First (bezpieczniejsze niż staleWhileRevalidate)
    event.respondWith(
        CACHE_STRATEGIES.networkFirst(request)
            .then((response) => response || fetch(request))
            .catch(() => null)
    );
});

// Obsługa wiadomości
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Push notifications
self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();

        event.waitUntil(
            self.registration.showNotification(data.title || 'Postlio', {
                body: data.body || 'Nowe powiadomienie',
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                data: { url: data.url || '/' }
            })
        );
    } catch (e) {
        console.error('[SW] Push error:', e);
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        self.clients.openWindow(event.notification.data?.url || '/')
    );
});
/**
 * Service Worker: VKU Field Survey PWA
 * Caching Strategy: Network-First with Offline Cache Fallback (đảm bảo luôn cập nhật bản mới nhất khi Online và chạy 100% Offline khi mất mạng)
 */

const CACHE_NAME = 'vku-survey-cache-v15';
const APP_SHELL_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './db.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

// 1. Giai đoạn INSTALL: Pre-cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Giai đoạn ACTIVATE: Dọn dẹp cache phiên bản cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Giai đoạn FETCH: Network-First với Offline Cache Fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (
    event.request.url.includes('/api/') ||
    event.request.url.includes('__healthcheck') ||
    event.request.url.includes('_rt=')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          event.request.url.startsWith(self.location.origin)
        ) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request, { ignoreSearch: true }).then((cached) => {
          if (cached) return cached;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// 4. Background Sync API
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-vku-surveys') {
    console.log('[Service Worker Background Sync] Kích hoạt đồng bộ ngầm');
  }
});

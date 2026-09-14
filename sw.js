/**
 * Service Worker: VKU Field Survey PWA
 * Caching Strategy: Cache-First for App Shell (HTML, CSS, JS, Manifest)
 * Hỗ trợ Background Sync API cho việc đồng bộ ngầm khi có mạng.
 */

const CACHE_NAME = 'vku-survey-cache-v7';
const APP_SHELL_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './db.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// 1. Giai đoạn INSTALL: Pre-cache App Shell
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Đang tải trước App Shell vào Cache Storage...');
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
            console.log('[Service Worker] Đang dọn dẹp cache cũ:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Giai đoạn FETCH: Cache-First Strategy cho sub-second boot
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Bỏ qua cache đối với request API đám mây và kiểm tra kết nối mạng (healthcheck)
  if (event.request.url.includes('/api/') || event.request.url.includes('__healthcheck')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Tìm thấy trong bộ nhớ đệm Cache Storage -> Trả về ngay lập tức
        return cachedResponse;
      }

      // Chưa có trong cache -> Thực hiện tải qua mạng và nạp thêm vào cache
      return fetch(event.request)
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
          // Khi hoàn toàn offline và người dùng tải lại trang HTML
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
        });
    })
  );
});

// 4. Background Sync API: Tự động kích hoạt khi có kết nối mạng ngầm
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-vku-surveys') {
    console.log('[Service Worker Background Sync] Bắt được sự kiện mạng, kích hoạt đồng bộ ngầm');
  }
});

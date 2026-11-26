const CACHE_NAME = 'trip-copilot-v2.7';
const CORE_ASSETS = [
  './',
  './copilot/trip-copilot.css',
  './copilot/trip-copilot.js',
  './copilot/icon-192.png',
  './copilot/icon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first for HTML/JS/CSS (always fresh when online, tunnel-safe offline fallback);
// Stale-while-revalidate for images.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (/\.(png|jpg|jpeg|webp|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(req);
        const net = fetch(req).then(res => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => cached);
        return cached || net;
      })
    );
    return;
  }

  event.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => caches.match(req))
  );
});

// Page-triggered native notification (works on iOS 16.4+ Home Screen PWA & Android Chrome)
self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type === 'SHOW_NOTIFICATION' && data.title) {
    const opts = Object.assign({
      body: '',
      icon: new URL('./copilot/icon-192.png', self.registration.scope).href,
      badge: new URL('./copilot/icon-192.png', self.registration.scope).href,
      tag: 'trip-copilot-alert',
      renotify: true,
      requireInteraction: Boolean(data.urgent),
      vibrate: data.urgent ? [300, 120, 300, 120, 500] : [200, 100, 200],
      data: { url: data.url || self.registration.scope }
    }, data.options || {});
    event.waitUntil(self.registration.showNotification(data.title, opts));
  }
});

// Standard Web Push payload support
self.addEventListener('push', event => {
  let payload = { title: '🚗 自驾护航提醒', body: '行程进度有新动态，请点击查看重排方案' };
  try {
    if (event.data) payload = Object.assign(payload, event.data.json());
  } catch (_) {
    if (event.data) payload.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: new URL('./copilot/icon-192.png', self.registration.scope).href,
      badge: new URL('./copilot/icon-192.png', self.registration.scope).href,
      tag: payload.tag || 'trip-copilot-push',
      renotify: true,
      requireInteraction: true,
      vibrate: [300, 120, 300, 120, 500],
      data: { url: payload.url || self.registration.scope }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || self.registration.scope;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.split('#')[0].split('?')[0] === targetUrl.split('#')[0].split('?')[0] && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});

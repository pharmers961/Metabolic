const CACHE = 'mm-tracker-v2.5.0'; // bump this on every release so clients get the update toast
const ASSETS = ['./', './index.html', './app.js', './program.js', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// The app shows an "update ready" toast; refreshing posts this message.
// REST_SCHEDULE / REST_CANCEL run the rest alarm here so it survives the page
// being minimized: Android freezes the page's timers, but waitUntil keeps this
// worker alive for the countdown (Chrome allows ~5 min — rests are ≤3 min).
let restAlarm = null;
function clearRestAlarm() {
  if (restAlarm) { clearTimeout(restAlarm.t); restAlarm.resolve(); restAlarm = null; }
}
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') { self.skipWaiting(); return; }
  const d = e.data || {};
  if (d.type === 'REST_SCHEDULE') {
    clearRestAlarm();
    const delay = d.end - Date.now();
    if (delay <= 0) return;
    e.waitUntil(new Promise((resolve) => {
      const t = setTimeout(async () => {
        restAlarm = null;
        try {
          const cs = await self.clients.matchAll({ type: 'window' });
          const visible = cs.some((c) => c.visibilityState === 'visible');
          // If the app is on screen, its own chime/vibration handles it.
          if (!visible) {
            await self.registration.showNotification('Rest over', {
              body: d.next ? `Back to ${d.next}` : 'Back to work',
              icon: 'icon-192.png', badge: 'icon-192.png',
              vibrate: [200, 100, 200, 100, 400], tag: 'mm-rest', renotify: true,
            });
          }
        } catch (err) {}
        resolve();
      }, delay);
      restAlarm = { t, resolve };
    }));
  } else if (d.type === 'REST_CANCEL') {
    clearRestAlarm();
  }
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((cs) => {
    if (cs.length) return cs[0].focus();
    return self.clients.openWindow('./');
  }));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Never cache API/auth calls
  if (url.hostname.includes('fitbit.com') || url.hostname.includes('googleapis.com') || url.hostname.includes('google.com')) return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetched = fetch(e.request)
        .then((res) => {
          if (res.ok && url.origin === location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});

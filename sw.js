// 앱 설치용 최소 서비스 워커: 항상 인터넷에서 최신 내용을 먼저 받고, 연결이 끊겼을 때만 저장본을 보여준다.
const CACHE = 'pn-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req.url.split('?')[0], copy)); }
      return res;
    }).catch(() => caches.match(req.url.split('?')[0]))
  );
});

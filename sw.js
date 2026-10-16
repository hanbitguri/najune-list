const C='najune-v28';const A=['./','index.html','styles.css?v=28','app.js?v=28','i18n.js?v=28','map.js?v=28','directions.js?v=28','store.js?v=28','paste.js?v=28','manifest.json','icon.svg','apple-touch-icon.png','icon-192.png','icon-512.png','favicon-32.png'];
// new versions take over immediately (home-screen PWAs are rarely fully closed) and old caches are removed
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(A)));});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||/supabase\.co|kakao\.com|kakaocdn\.net|daumcdn\.net/.test(e.request.url))return;
  const same=new URL(e.request.url).origin===location.origin;
  // network-first, bypassing the HTTP cache for our own files so an update is never served stale
  e.respondWith(fetch(same?new Request(e.request,{cache:'no-cache'}):e.request).then(r=>{if(same&&r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));}return r}).catch(()=>caches.match(e.request)))});

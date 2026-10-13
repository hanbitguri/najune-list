const C='najune-v4';const A=['./','index.html','styles.css','app.js','i18n.js','store.js','manifest.json','icon.svg','apple-touch-icon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A))));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||e.request.url.includes('supabase.co'))return;e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();if(new URL(e.request.url).origin===location.origin)caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request)))});

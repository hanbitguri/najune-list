/* Map adapter (Kakao Maps JS SDK). App code only talks to MapView. */
const KAKAO_KEY = '4c7db2d207638e9973f03ea2354825df'; // public JS key, domain-restricted
const MapView = (() => {
  let map, ps, ready = false, overlays = [], lines = [], pending = {}, onLong = null, anim = 0;
  const LL = (lat, lng) => new kakao.maps.LatLng(lat, lng);
  function loadSdk() {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services&autoload=false`;
      const to = setTimeout(() => rej(new Error('timeout')), 10000);
      s.onerror = () => { clearTimeout(to); rej(new Error('sdk load failed')); };
      s.onload = () => { if (!window.kakao?.maps?.load) { clearTimeout(to); return rej(new Error('sdk invalid')); }
        kakao.maps.load(() => { clearTimeout(to); res(); }); };
      document.head.appendChild(s);
    });
  }
  function clear() { overlays.forEach(o => o.setMap(null)); lines.forEach(l => l.setMap(null)); overlays = []; lines = []; cancelAnimationFrame(anim); }
  function el(html, onClick) { const d = document.createElement('div'); d.innerHTML = html; const n = d.firstElementChild;
    if (onClick) { n.style.cursor = 'pointer'; n.addEventListener('click', e => { e.stopPropagation(); onClick(); }); } return n; }
  function draw({ places, stops, onPin }) {
    clear(); const inTrip = new Set(stops.map(p => p.id));
    places.filter(p => !inTrip.has(p.id)).forEach(p => {
      const o = new kakao.maps.CustomOverlay({ position: LL(p.lat, p.lng), yAnchor: 1, zIndex: 2,
        content: el(`<div class="pinwrap"><div class="pin ${p.status === 'done' ? 'done' : ''}" style="background:${p._color}"><span>${p._emoji}</span></div></div>`, () => onPin(p)) });
      o.setMap(map); overlays.push(o);
    });
    if (stops.length > 1) {
      const path = stops.map(p => LL(p.lat, p.lng));
      const under = new kakao.maps.Polyline({ path: [path[0]], strokeWeight: 8, strokeColor: '#FFFFFF', strokeOpacity: .9 });
      const top = new kakao.maps.Polyline({ path: [path[0]], strokeWeight: 4, strokeColor: '#9B87D9', strokeOpacity: 1, strokeStyle: 'shortdash' });
      under.setMap(map); top.setMap(map); lines.push(under, top);
      // "draw-in" animation along the route
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, dur = reduce ? 0 : 700, t0 = performance.now();
      const step = now => { const k = dur ? Math.max(0, Math.min(1, (now - t0) / dur)) : 1, e = 1 - Math.pow(1 - k, 3), f = e * (path.length - 1), i = Math.floor(f);
        const pts = path.slice(0, i + 1);
        if (i < path.length - 1) { const a = path[i], b = path[i + 1], r = f - i; pts.push(LL(a.getLat() + (b.getLat() - a.getLat()) * r, a.getLng() + (b.getLng() - a.getLng()) * r)); }
        under.setPath(pts); top.setPath(pts); if (k < 1) anim = requestAnimationFrame(step); };
      anim = requestAnimationFrame(step);
    }
    stops.forEach((p, i) => { const o = new kakao.maps.CustomOverlay({ position: LL(p.lat, p.lng), zIndex: 5,
      content: el(`<div class="stopnum" style="animation-delay:${i * 80}ms">${i + 1}</div>`, () => onPin(p)) }); o.setMap(map); overlays.push(o); });
  }
  function fit(points, pad) {
    if (!points.length) return; const b = new kakao.maps.LatLngBounds(); points.forEach(p => b.extend(LL(p.lat, p.lng)));
    map.setBounds(b, pad[0], pad[1], pad[2], pad[3]); if (map.getLevel() < 3) map.setLevel(3);
  }
  function longPress() {
    const box = map.getNode(); let tm = null, start = null;
    const cancel = () => { clearTimeout(tm); tm = null; };
    box.addEventListener('touchstart', e => { if (e.touches.length !== 1) return cancel(); const tc = e.touches[0], r = box.getBoundingClientRect();
      start = [tc.clientX, tc.clientY]; const pt = new kakao.maps.Point(tc.clientX - r.left, tc.clientY - r.top);
      tm = setTimeout(() => { const ll = map.getProjection().coordsFromContainerPoint(pt); navigator.vibrate?.(10); onLong?.(ll.getLat(), ll.getLng()); }, 600); }, { passive: true });
    box.addEventListener('touchmove', e => { const tc = e.touches[0]; if (start && Math.hypot(tc.clientX - start[0], tc.clientY - start[1]) > 8) cancel(); }, { passive: true });
    box.addEventListener('touchend', cancel); box.addEventListener('touchcancel', cancel);
    kakao.maps.event.addListener(map, 'rightclick', e => onLong?.(e.latLng.getLat(), e.latLng.getLng()));
  }
  return {
    get ready() { return ready; },
    async init(elId) {
      await loadSdk();
      map = new kakao.maps.Map(document.getElementById(elId), { center: LL(37.5665, 126.978), level: 7 });
      ps = new kakao.maps.services.Places(); ready = true; longPress();
      if (pending.draw) draw(pending.draw); if (pending.fit) fit(...pending.fit); pending = {};
    },
    draw(args) { ready ? draw(args) : (pending.draw = args); },
    fit(points, pad) { ready ? fit(points, pad) : (pending.fit = [points, pad]); },
    flyTo(lat, lng) { if (!ready) return; if (map.getLevel() > 4) map.setLevel(4, { anchor: LL(lat, lng), animate: { duration: 350 } }); setTimeout(() => map.panTo(LL(lat, lng)), map.getLevel() > 4 ? 360 : 0); },
    zoom(d) { ready && map.setLevel(map.getLevel() + d, { animate: { duration: 250 } }); },
    relayout() { ready && map.relayout(); },
    onLongPress(cb) { onLong = cb; },
    search(q) {
      return new Promise((res, rej) => { if (!ready) return rej(new Error('map not ready'));
        const CAT = { FD6: 'food', CE7: 'cafe', AD5: 'stay', AT4: 'sight' };
        ps.keywordSearch(q, (data, status) => {
          if (status === kakao.maps.services.Status.OK) res(data.slice(0, 10).map(d => ({ name: d.place_name, address: d.road_address_name || d.address_name,
            sub: d.category_name, lat: +d.y, lng: +d.x, category: CAT[d.category_group_code] || 'etc', kakaoId: d.id })));
          else if (status === kakao.maps.services.Status.ZERO_RESULT) res([]); else rej(new Error(status));
        }, { location: map.getCenter(), size: 10 });
      });
    }
  };
})();
const kakaoLink = p => `https://map.kakao.com/link/to/${encodeURIComponent(p.name || '목적지')},${p.lat},${p.lng}`;

/* Travel time between stops.
   Car  : Kakao Mobility Directions API (real road time) when a REST key is set on this device.
          Without a key → estimate (straight line × 1.35 at 15 km/h + 4 min), labelled 예상.
   Walk : Kakao has no public walking API → always an estimate (straight line × 1.25 at 4.5 km/h).
   The REST key is NOT in the public repo; it is entered per device (공유 tab) and kept in localStorage. */
const DIRECTIONS_PROXY = ''; // optional Edge Function URL (see supabase/functions/directions); empty = call Kakao directly
const Directions = (() => {
  const KEY_LS = 'najune-kakao-rest', CACHE_LS = 'najune-dir-cache-v1';
  let cache = {}; try { cache = JSON.parse(localStorage.getItem(CACHE_LS)) || {}; } catch {}
  const inflight = new Map();
  const R = x => x.toFixed(4);
  const ck = (a, b) => `${R(a.lng)},${R(a.lat)}>${R(b.lng)},${R(b.lat)}`;
  const saveCache = () => { const ks = Object.keys(cache); if (ks.length > 300) ks.slice(0, ks.length - 300).forEach(k => delete cache[k]); localStorage.setItem(CACHE_LS, JSON.stringify(cache)); };
  return {
    get key() { return localStorage.getItem(KEY_LS) || ''; },
    setKey(k) { k ? localStorage.setItem(KEY_LS, k.trim()) : localStorage.removeItem(KEY_LS); },
    walk(km) { const d = km * 1.25; return { sec: d / 4.5 * 3600, km: d, est: true }; },
    carEstimate(km) { const d = km * 1.35; return { sec: d / 15 * 3600 + 240, km: d, est: true }; },  // Seoul city traffic: ~15 km/h + 4 min parking/lights
    cachedCar(a, b) { const c = cache[ck(a, b)]; return c && Date.now() - c.ts < 7 * 864e5 ? c : null; },
    async car(a, b) {
      const k = ck(a, b), hit = this.cachedCar(a, b); if (hit) return hit;
      if (!this.key && !DIRECTIONS_PROXY) return null; if (inflight.has(k)) return inflight.get(k);
      const p = (async () => {
        try {
          const q = `origin=${a.lng},${a.lat}&destination=${b.lng},${b.lat}`;
          const r = DIRECTIONS_PROXY ? await fetch(`${DIRECTIONS_PROXY}?${q}`, { headers: { apikey: SUPABASE_KEY } })
            : await fetch(`https://apis-navi.kakaomobility.com/v1/directions?${q}&priority=RECOMMEND&summary=true`, { headers: { Authorization: 'KakaoAK ' + this.key } });
          if (r.status === 401 || r.status === 403) return { error: 'auth' };
          const j = await r.json(), rt = j.routes?.[0];
          if (!rt) return { error: 'fail' };
          if (rt.result_code === 104) { const v = { sec: 0, km: 0, est: false, ts: Date.now() }; cache[k] = v; saveCache(); return v; } // within 5 m
          if (rt.result_code !== 0) return { error: 'noroute' };
          const v = { sec: rt.summary.duration, km: rt.summary.distance / 1000, est: false, ts: Date.now() }; cache[k] = v; saveCache(); return v;
        } catch { return { error: 'net' }; } finally { inflight.delete(k); }
      })();
      inflight.set(k, p); return p;
    }
  };
})();
const fmtDur = (sec, L) => { const m = Math.max(1, Math.round(sec / 60)); if (m < 60) return t('min', { m }); const h = Math.floor(m / 60), r = m % 60; return r ? t('hmin', { h, m: r }) : t('hour', { h }); };

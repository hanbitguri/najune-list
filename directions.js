/* Travel time between stops — all estimates (labelled 예상), no external API calls.
   Road distance = straight line × factor (1.3 short → 1.2 beyond 30 km).
   Time is piecewise over the road distance: each band of km is driven at that band's speed,
   so long trips get highway / rail speeds instead of city speeds.
   Car     : 0–3 km 16 km/h · 3–15 km 33 · 15–30 km 60 · 30–100 km 80 · >100 km 95   + 4 min
   Transit : 0–3 km 15 km/h · 3–15 km 28 · 15–40 km 55 · 40–100 km 80 · >100 km 180 (KTX) + 8 min (+15 min >100 km)
   Walk    : × 1.25 at 4.5 km/h; far = true beyond 5 km (UI shows a hint) */
const Directions = (() => {
  const factor = km => km <= 5 ? 1.3 : km >= 30 ? 1.2 : 1.3 - 0.1 * (km - 5) / 25;
  const bands = (d, B) => { let h = 0, prev = 0; for (const [to, v] of B) { if (d <= prev) break; h += (Math.min(d, to) - prev) / v; prev = to; } return h * 3600; };
  const CAR = [[3, 16], [15, 33], [30, 60], [100, 80], [Infinity, 95]];
  const TRANSIT = [[3, 15], [15, 28], [40, 55], [100, 80], [Infinity, 180]];
  return {
    WALK_FAR_KM: 5,
    walk(km) { const d = km * 1.25; return { sec: d / 4.5 * 3600, km: d, est: true, far: km > 5 }; },
    transit(km) { const d = km * factor(km); return { sec: bands(d, TRANSIT) + 8 * 60 + (d > 100 ? 15 * 60 : 0), km: d, est: true }; },
    carEstimate(km) { const d = km * factor(km); return { sec: bands(d, CAR) + 240, km: d, est: true }; },
  };
})();
const fmtDur = (sec) => { const m = Math.max(1, Math.round(sec / 60)); if (m < 60) return t('min', { m }); const h = Math.floor(m / 60), r = m % 60; return r ? t('hmin', { h, m: r }) : t('hour', { h }); };
if (typeof module !== 'undefined') module.exports = { Directions };

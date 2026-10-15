/* Travel time between stops — all estimates (labelled 예상), no external API calls.
   Car     : straight line × 1.35 at 15 km/h + 4 min (Seoul city traffic, parking/lights)
   Walk    : straight line × 1.25 at 4.5 km/h
   Transit : straight line × 1.3 at 25 km/h + 8 min wait/walk */
const Directions = {
  walk(km) { const d = km * 1.25; return { sec: d / 4.5 * 3600, km: d, est: true }; },
  transit(km) { const d = km * 1.3; return { sec: d / 25 * 3600 + 8 * 60, km: d, est: true }; },
  carEstimate(km) { const d = km * 1.35; return { sec: d / 15 * 3600 + 240, km: d, est: true }; },
};
const fmtDur = (sec) => { const m = Math.max(1, Math.round(sec / 60)); if (m < 60) return t('min', { m }); const h = Math.floor(m / 60), r = m % 60; return r ? t('hmin', { h, m: r }) : t('hour', { h }); };

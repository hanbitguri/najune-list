// node tests/directions.test.js — sanity targets for the estimate model
const { Directions } = require('../directions.js');
const hav = (a, b) => { const R = 6371, r = x => x * Math.PI / 180, dl = r(b[0] - a[0]), dg = r(b[1] - a[1]);
  return 2 * R * Math.asin(Math.sqrt(Math.sin(dl / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dg / 2) ** 2)); };
const P = { 안국: [37.5765, 126.9854], 광장시장: [37.5700, 126.9996], 홍대입구: [37.5572, 126.9245], 강남역: [37.4979, 127.0276],
  인천공항: [37.4492, 126.4510], 서울역: [37.5547, 126.9707], 부산역: [37.1149 - 2, 129.0403] };
P.부산역 = [35.1149, 129.0403];
const cases = [ // [from, to, mode, minMin, maxMin]
  ['안국', '광장시장', 'car', 10, 15], ['홍대입구', '강남역', 'car', 35, 45], ['인천공항', '안국', 'car', 60, 75], ['서울역', '부산역', 'car', 270, 300],
  ['인천공항', '안국', 'transit', 75, 90], ['안국', '광장시장', 'transit', 12, 25], ['홍대입구', '강남역', 'transit', 35, 55],
  ['안국', '광장시장', 'walk', 15, 35] ];
let fail = 0; const rows = [];
for (const [a, b, m, lo, hi] of cases) { const km = hav(P[a], P[b]); const r = m === 'walk' ? Directions.walk(km) : m === 'car' ? Directions.carEstimate(km) : Directions.transit(km);
  const min = r.sec / 60, ok = min >= lo && min <= hi; fail += !ok; rows.push(`${ok ? 'PASS' : 'FAIL'} ${a}→${b} ${m}: ${km.toFixed(1)}km straight, ${min.toFixed(0)}min (target ${lo}–${hi})`); }
const far = Directions.walk(6), near = Directions.walk(4); if (!far.far || near.far) { fail++; rows.push('FAIL walk far flag'); } else rows.push('PASS walk far flag (>5km)');
console.log(rows.join('\n')); process.exit(fail ? 1 : 0);

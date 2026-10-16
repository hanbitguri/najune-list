let CATS = {};
const catLabel = c => (c.name && c.name.trim()) || (c.key ? t(c.key) : '');
function rebuildCats() { CATS = {}; (Store.get().categories || DEFAULT_CATS).forEach(c => { CATS[c.id] = { id: c.id, emoji: c.emoji, color: c.color, get label() { return catLabel(c); } }; }); }
const cat = id => CATS[id] || CATS.etc || { emoji: '📍', color: '#F3EDE3', label: '' };
const STATUS = { wish:{get label(){return t('stWish')},color:'#F7C6D0'}, planned:{get label(){return t('stPlanned')},color:'#D9CFF3'}, done:{get label(){return t('stDone')},color:'#BFE6D6'} };
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const won = n => n ? t('won',{n:Number(n).toLocaleString(LANG)}) : '';
function dist(a, b) { const R=6371, r=x=>x*Math.PI/180, dLa=r(b.lat-a.lat), dLo=r(b.lng-a.lng);
  const h=Math.sin(dLa/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dLo/2)**2; return 2*R*Math.asin(Math.sqrt(h)); }
const fmtKm = d => d < 1 ? Math.round(d*1000)+'m' : d.toFixed(1)+'km';

let filter = 'all', editing = null, pending = null, fitted = false;

function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 1800); }

/* ---------- rendering ---------- */
/* Keyed list patching: unchanged nodes are kept (no animation replay), changed ones are swapped in place,
   only genuinely new ones get the entry animation, and moved ones glide to their new spot (FLIP). */
function patchList(box, list, emptyHtml) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!list.length) { box.innerHTML = emptyHtml || ''; box.__keys = null; return; }
  const old = new Map(), first = new Map();
  [...box.children].forEach(n => { if (n.dataset.key) { old.set(n.dataset.key, n); first.set(n.dataset.key, n.getBoundingClientRect().top); } else n.remove(); });
  let fresh = 0; const seen = new Set();
  list = list.filter(r => !seen.has(r.key) && seen.add(r.key));
  const nodes = list.map(({ key, html }) => {
    const n = old.get(key); if (n && n.__h === html) { old.delete(key); return n; }
    const tp = document.createElement('template'); tp.innerHTML = html.trim(); const m = tp.content.firstElementChild;
    m.dataset.key = key; m.__h = html;
    if (n) { old.delete(key); n.remove(); m.classList.add('swap'); m.addEventListener('animationend', () => m.classList.remove('swap'), { once: true }); }
    else { m.classList.add('enter'); m.style.animationDelay = Math.min(fresh++, 12) * 30 + 'ms'; m.addEventListener('animationend', e => { if (e.target === m) { m.classList.remove('enter'); m.style.animationDelay = ''; } }, { once: true }); }
    return m; });
  old.forEach(n => n.remove());
  nodes.forEach((n, i) => { if (box.children[i] !== n) box.insertBefore(n, box.children[i] || null); });
  if (reduce) return;
  nodes.forEach(n => { const k = n.dataset.key; if (!first.has(k) || n.classList.contains('enter')) return;
    const dy = first.get(k) - n.getBoundingClientRect().top;
    if (Math.abs(dy) > 1) n.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' }); });
}
function render() {
  rebuildCats();
  const s = Store.get(), trip = Store.activeTrip();
  // filters
  const fs = [['all',t('fAll')],['heart',t('fHeart')],...Object.entries(CATS).map(([k,v])=>[k,v.emoji+' '+v.label]),...Object.entries(STATUS).map(([k,v])=>['s:'+k,v.label])];
  if (filter !== 'all' && filter !== 'heart' && !filter.startsWith('s:') && !CATS[filter]) filter = 'all';
  $('#filters').innerHTML = fs.map(([k,l]) => `<button class="chip ${filter===k?'on':''}" data-f="${k}">${esc(l)}</button>`).join('') + `<button class="chip manage" id="manageCats" aria-label="${t('manageCats')}">⚙︎ ${t('manageCats')}</button>`;
  const shown = s.places.filter(p => filter==='all' || (filter==='heart'?p.heart: filter.startsWith('s:')? p.status===filter.slice(2) : p.category===filter))
    .sort((a,b)=>(b.heart-a.heart)||(b.createdAt-a.createdAt));
  patchList($('#placeList'), shown.map(p => ({ key: p.id, html: `
    <li class="item" data-id="${p.id}">
      ${thumbHtml(p)}
      <div class="body" data-act="edit"><h4>${esc(p.name)}</h4>
        <p><span class="badge" style="background:${STATUS[p.status].color}">${STATUS[p.status].label}</span>${esc([won(p.cost), p.memo, p.addedBy && t('by',{name:p.addedBy})].filter(Boolean).join(' · '))}</p></div>
      <button class="iconbtn heart ${p.heart?'on':''}" data-act="heart" aria-label="${t('heart')}">${p.heart?'💟':'🤍'}</button>
      <a class="iconbtn" href="${kakaoLink(p)}" target="_blank" rel="noopener" aria-label="${t('openKakao')}" title="${t('openKakao')}">🧭</a>
      <button class="iconbtn" data-act="stop" aria-label="${t('addToTrip')}">＋</button>
    </li>` })), `<p class="hint">${t('emptyPlaces')}</p>`);

  // trips
  $('#tripPick').innerHTML = trip ? `<span><b>${esc(trip.name)}</b>${trip.date ? `<small>${fmtDate(trip.date)}</small>` : ''}</span><i class="chev" aria-hidden="true"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></i>` : `<span><b>${t('noTrips')}</b></span><i class="chev" aria-hidden="true"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></i>`;
  $('#editTrip').style.display = trip ? '' : 'none';
  const stops = trip ? trip.stops.map(id => s.places.find(p => p.id === id)).filter(Boolean) : [];
  const meta = trip?.meta || {}; let cost = 0; const rows = []; const TT = computeTimes(stops, meta);
  stops.forEach((p, i) => {
    if (i) rows.push({ key: 'leg:' + stops[i-1].id + '>' + p.id, html: `<li class="leg" data-leg="${i}" data-k="${stops[i-1].id}>${p.id}">${legText(stops[i-1], p).html}</li>` });
    cost += +p.cost || 0; const m = meta[p.id] || {};
    rows.push({ key: 'stop:' + p.id, html: `<li class="item" data-id="${p.id}" data-idx="${i}">
      <div class="num">${i+1}</div><div class="body" data-act="fly"><h4>${cat(p.category).emoji} ${esc(p.name)}</h4>
        <p>${TT[i].tight ? `<span class="tight">⚠︎ ${t('tight')}</span>` : ''}<button type="button" class="staychip" data-act="meta">⏳ ${TT[i].stay ? t('stayChip', { d: fmtDur(TT[i].stay * 60) }) : p.category === 'stay' ? t('stayNight') : t('stayNone')}</button>${esc(m.note || won(p.cost) || p.memo || '')}</p></div>
      <button class="timechip ${TT[i].pinned ? 'set' : TT[i].time ? 'auto' : ''}" data-act="meta" aria-label="${t('time')}">${TT[i].pinned ? '📌 ' + esc(TT[i].time) : TT[i].time ? `${esc(TT[i].time)}${TT[i].day ? `<sup>+${TT[i].day}</sup>` : ''}<small>${t('mAuto')}</small>` : '＋ ' + t('time')}</button>
      <a class="iconbtn" href="${kakaoLink(p)}" target="_blank" rel="noopener" aria-label="${t('openKakao')}">🧭</a>
      <button class="iconbtn" data-act="unstop" aria-label="${t('removeStop')}">✕</button><span class="handle" aria-label="${t('reorder')}">☰</span></li>` });
  });
  patchList($('#stopList'), rows, '');
  const nTimes = stops.filter(p => meta[p.id]?.time).length;
  $('#tripMeta').innerHTML = trip ? `<div class="row between">
      <div class="legend" aria-hidden="true"><span><i class="ln walk"></i>${t('mWalk')}</span><span><i class="ln car"></i>${t('mCar')}</span><span><i class="ln transit"></i>${t('mTransit')}</span></div>
      <div class="row tight">${nTimes >= 2 ? `<button class="chip" id="sortTime">${t('sortByTime')}</button>` : ''}<button class="chip ${mapTimes ? 'on' : ''}" id="mapTimes">${t('mapTimes')}</button></div></div>
    <p id="tripTotals" class="totals"></p>` : t('tripEmpty');
  tripCost = cost; updateTotals(stops); fillLegs(stops);
  $('#me').value = Store.me;

  // map
  s.places.forEach(p => { Object.defineProperty(p, '_color', { value: cat(p.category).color, configurable: true }); Object.defineProperty(p, '_emoji', { value: cat(p.category).emoji, configurable: true }); });
  MapView.draw({ places: s.places, stops, modes: stops.slice(1).map((b, i) => legMode(stops[i], b).mode), labels: stops.map((p, i) => mapTimes ? TT[i].time || '' : ''), onPin: p => { MapView.flyTo(p.lat, p.lng); openForm(p); } });
  if (!fitted && s.places.length) { fitted = true; const mob = innerWidth < 900;
    MapView.fit(stops.length > 1 ? stops : s.places, mob ? [80, 24, 340, 24] : [96, 48, 48, 420]); }
}
Store.on(render);

/* ---------- interactions ---------- */
$('#filters').onclick = e => { if (e.target.closest('#manageCats')) return openCats(); const f = e.target.dataset.f; if (f) { filter = f; render(); } };
$('#placeList').onclick = e => {
  const li = e.target.closest('.item'); if (!li) return; const id = li.dataset.id, act = e.target.closest('[data-act]')?.dataset.act;
  const p = Store.get().places.find(x => x.id === id);
  if (act === 'heart') Store.updatePlace(id, { heart: !p.heart });
  else if (act === 'stop') { Store.addStop(id); toast(t('tAdded',{name:p.name})); }
  else { MapView.flyTo(p.lat, p.lng); if (act==='edit') openForm(p); }
};
$('#stopList').onclick = e => {
  const li = e.target.closest('.item'); if (!li) return; const act = e.target.closest('[data-act]')?.dataset.act;
  const p = Store.get().places.find(x => x.id === li.dataset.id);
  if (act === 'unstop') Store.removeStop(p.id); else if (act === 'fly') MapView.flyTo(p.lat, p.lng); else if (act === 'meta') openStop(p, +li.dataset.idx);
};
// travel time
let mapTimes = localStorage.getItem('najune-maptime') !== '0', tripCost = 0;
const fmtDate = iso => { try { return new Intl.DateTimeFormat(LANG, { month: 'short', day: 'numeric', weekday: 'short' }).format(new Date(iso + 'T00:00')); } catch { return iso; } };
const MODE_ICON = { walk: '🚶', car: '🚗', transit: '🚇' }, CYCLE = [null, 'walk', 'car', 'transit'];
function legMode(a, b) { const ov = Store.activeTrip()?.legModes?.[a.id + '>' + b.id];
  return ov ? { mode: ov, auto: false } : { mode: dist(a, b) <= Store.settings.walkMaxKm ? 'walk' : 'car', auto: true }; }
function legResult(a, b, mode) { const km = dist(a, b);
  return mode === 'walk' ? Directions.walk(km) : mode === 'transit' ? Directions.transit(km) : Directions.carEstimate(km); }
function legText(a, b) { const { mode, auto } = legMode(a, b), r = legResult(a, b, mode);
  return { r, mode, html: `<button class="legmode m-${mode} ${auto ? 'auto' : ''}" data-cycle aria-label="${t('legModeTap')}" title="${t('legModeTap')}">${MODE_ICON[mode]}${auto ? `<small>${t('mAuto')}</small>` : ''}</button>
    <span class="legtxt">${fmtDur(r.sec)} · ${fmtKm(r.km)}${r.est ? `<em>${t('legEst')}</em>` : ''}${r.far ? `<em class="far">${t('walkFar')}</em>` : ''}</span>${mode === 'transit' ? `<button class="legInfo" data-info aria-label="${t('transitInfoTitle')}">ⓘ</button>` : ''}` }; }
// auto schedule: pinned times (meta.time) are anchors; others = prev arrival + stay + leg estimate
const STAY_DEFAULT = { food: 60, cafe: 45, sight: 90, stay: 0, curious: 45, etc: 30 };
const stayOf = (p, m) => m && m.stay != null && m.stay !== '' ? +m.stay : (STAY_DEFAULT[p.category] ?? 30);
const toMin = s => { const [h, m] = String(s).split(':').map(Number); return h * 60 + m; };
const hhmm = n => { n = Math.round(n); const d = Math.floor(n / 1440), x = ((n % 1440) + 1440) % 1440; return [String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'), d]; };
function computeTimes(stops, meta) { let cur = null, base = 0;
  return stops.map((p, i) => { const m = meta[p.id] || {}, stay = stayOf(p, m);
    const arr = i && cur != null ? cur + legResult(stops[i - 1], p, legMode(stops[i - 1], p).mode).sec / 60 : null;
    let at = null, pinned = false, tight = false;
    if (m.time) { pinned = true; at = toMin(m.time); if (cur != null) { while (at + 1440 * base < cur - 720) base++; at += 1440 * base; } tight = arr != null && at < arr - 2; }
    else if (arr != null) at = arr;
    if (at != null) cur = at + stay;
    const [time, day] = at != null ? hhmm(at) : ['', 0];
    return { time, day, pinned, tight, stay, auto: !pinned && at != null }; }); }
function updateTotals(stops) { const el = $('#tripTotals'); if (!el) return;
  let sec = 0, km = 0, est = false; for (let i = 1; i < stops.length; i++) { const { r } = legText(stops[i-1], stops[i]); sec += r.sec; km += r.km; est ||= r.est; }
  el.innerHTML = t('tripTotal', { n: stops.length, time: stops.length > 1 ? fmtDur(sec) : '–', d: fmtKm(km) }) + (est && stops.length > 1 ? `<em>${t('legEst')}</em>` : '') + (tripCost ? t('tripCost', { c: won(tripCost) }) : ''); }
const currentStops = () => { const tr = Store.activeTrip(), s = Store.get(); return tr ? tr.stops.map(id => s.places.find(p => p.id === id)).filter(Boolean) : []; };
function fillLegs() {}  // car times are always estimates now (no Kakao Mobility calls)
// leg row: tap icon → cycle 자동 → 🚶 → 🚗 → 🚇 → 자동 ; ⓘ → transit disclosure sheet
$('#stopList').addEventListener('click', e => { const leg = e.target.closest('.leg'); if (!leg) return; e.stopPropagation();
  const [aId, bId] = leg.dataset.k.split('>'), s = Store.get(), A = s.places.find(p => p.id === aId), B = s.places.find(p => p.id === bId); if (!A || !B) return;
  if (e.target.closest('[data-info]')) return openTransitInfo(A, B);
  if (e.target.closest('[data-cycle]')) { const ov = Store.activeTrip()?.legModes?.[leg.dataset.k] || null;
    const next = CYCLE[(CYCLE.indexOf(ov) + 1) % CYCLE.length]; Store.setLegMode(leg.dataset.k, next);
    toast(next ? `${MODE_ICON[next]} ${t('m' + next[0].toUpperCase() + next.slice(1))}` : t('tLegAuto', { km: Store.settings.walkMaxKm })); } }, true);
const kakaoTransitLink = (a, b) => `https://map.kakao.com/link/by/traffic/${encodeURIComponent(a.name)},${a.lat},${a.lng}/${encodeURIComponent(b.name)},${b.lat},${b.lng}`;
function openTransitInfo(a, b) { $('#infoRoute').textContent = `${a.name} → ${b.name}`; $('#infoLink').href = kakaoTransitLink(a, b); $('#infoModal').classList.add('show'); }
$('#infoClose').onclick = () => $('#infoModal').classList.remove('show');
$('#infoModal').onclick = e => { if (e.target.id === 'infoModal') $('#infoModal').classList.remove('show'); };
// walking threshold (synced per space)
function syncThreshold() { const v = Store.settings.walkMaxKm; $('#walkMax').value = v; $('#walkMaxVal').textContent = fmtKm(v); $('#walkMax').style.setProperty('--p', ((v - .3) / (3 - .3) * 100) + '%'); }
$('#walkMax').addEventListener('input', e => { const v = +e.target.value; $('#walkMaxVal').textContent = fmtKm(v); e.target.style.setProperty('--p', ((v - .3) / (3 - .3) * 100) + '%'); });
$('#walkMax').addEventListener('change', e => Store.setSetting('walkMaxKm', Math.round(+e.target.value * 10) / 10));
Store.on(() => { if (document.activeElement !== $('#walkMax')) syncThreshold(); });
$('#tripMeta').addEventListener('click', e => {
  if (e.target.closest('#sortTime')) { Store.sortStopsByTime(); toast(t('tSorted')); }
  if (e.target.closest('#mapTimes')) { mapTimes = !mapTimes; localStorage.setItem('najune-maptime', mapTimes ? '1' : '0'); render(); } });

// custom picker (bottom sheet on mobile, popover card on desktop)
function openPicker({ title, items, value, onPick }) {
  $('#pickTitle').textContent = title;
  $('#pickList').innerHTML = items.map((it, i) => `<li><button type="button" data-v="${esc(it.value)}" class="${it.value === value ? 'on' : ''}" style="animation-delay:${i*25}ms">
    <span><b>${esc(it.label)}</b>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</span><i>${it.value === value ? '✓' : ''}</i></button></li>`).join('');
  $('#pickList').onclick = e => { const b = e.target.closest('button[data-v]'); if (!b) return;
    $('#pickList').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); setTimeout(() => { closePicker(); onPick(b.dataset.v); }, 160); };
  $('#pickModal').classList.add('show');
}
const closePicker = () => $('#pickModal').classList.remove('show');
$('#pickModal').onclick = e => { if (e.target.id === 'pickModal') closePicker(); };
$('#tripPick').onclick = () => { const s = Store.get(); if (!s.trips.length) return $('#newTrip').click();
  const items = [...s.trips].sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))
    .map(tr => ({ value: tr.id, label: tr.name, sub: [tr.date ? fmtDate(tr.date) : t('noDate'), t('nPlaces', { n: tr.stops.length })].join(' · ') }));
  openPicker({ title: t('pickTrip'), items, value: s.activeTripId, onPick: id => { fitted = false; Store.setActiveTrip(id); } }); };

// trip sheet (create + edit)
let editingTrip = null;
function openTrip(tr) { editingTrip = tr; const f = $('#tripForm'), n = Store.get().trips.length + 1;
  f.name.value = tr ? tr.name : ''; f.date.value = tr?.date || ''; f.name.placeholder = t('presetDay', { n });
  $('#tripTitle').textContent = tr ? t('editTrip') : t('newTripTitle'); $('#tripSubmit').textContent = tr ? t('save') : t('create');
  $('#delTrip').style.display = tr ? '' : 'none'; $('#tripPresets').style.display = tr ? 'none' : '';
  $('#tripPresets').innerHTML = [t('presetDay',{n}), t('presetWeekend'), t('presetFood'), t('presetCafe')].map(x => `<button type="button">${x}</button>`).join('');
  $('#tripModal').classList.add('show'); setTimeout(() => f.name.focus(), 350); }
$('#newTrip').onclick = () => openTrip(null);
$('#editTrip').onclick = () => openTrip(Store.activeTrip());
$('#tripPresets').onclick = e => { if (e.target.tagName === 'BUTTON') $('#tripForm').name.value = e.target.textContent; };
const closeTrip = () => { $('#tripModal').classList.remove('show'); $('#tripForm').name.blur(); };
$('#cancelTrip').onclick = closeTrip; $('#tripModal').onclick = e => { if (e.target.id === 'tripModal') closeTrip(); };
$('#delTrip').onclick = () => { if (editingTrip && confirm(t('cDeleteTrip', { name: editingTrip.name }))) { Store.removeTrip(editingTrip.id); closeTrip(); } };
$('#tripForm').onsubmit = e => { e.preventDefault(); const f = e.target, v = f.name.value.trim() || f.name.placeholder, date = f.date.value;
  if (editingTrip) { Store.updateTrip(editingTrip.id, { name: v, date }); closeTrip(); }
  else { Store.addTrip(v, date); closeTrip(); toast(t('tTripMade',{name:v})); } };

// stop sheet (time + note)
let editingStop = null;
function openStop(p, idx) { editingStop = p; const m = Store.activeTrip()?.meta?.[p.id] || {}, f = $('#stopForm');
  $('#stopTitle').textContent = `${idx + 1}. ${p.name}`; f.time.value = m.time || ''; f.note.value = m.note || '';
  const tr = Store.activeTrip(), stops = tr.stops.map(id => Store.get().places.find(x => x.id === id)).filter(Boolean), TT = computeTimes(stops, tr.meta || {}), k = stops.indexOf(p);
  $('#autoHint').textContent = TT[k]?.auto ? t('autoHint', { t: TT[k].time }) : TT[k]?.pinned ? t('pinHint') : t('noAnchor');
  const def = STAY_DEFAULT[p.category] ?? 30, opts = [0, 15, 30, 45, 60, 90, 120, 150, 180, 240];
  f.stay.innerHTML = `<option value="">${t('stayDefault', { d: def ? fmtDur(def * 60) : t('stayNone') })}</option>` + opts.map(v => `<option value="${v}">${v ? fmtDur(v * 60) : t('stayNone')}</option>`).join('');
  f.stay.value = m.stay != null && m.stay !== '' ? String(m.stay) : '';
  $('#stopModal').classList.add('show'); }
const closeStop = () => $('#stopModal').classList.remove('show');
$('#cancelStop').onclick = closeStop; $('#stopModal').onclick = e => { if (e.target.id === 'stopModal') closeStop(); };
$('#clearTime').onclick = () => { $('#stopForm').time.value = ''; };
$('#stopForm').onsubmit = e => { e.preventDefault(); const f = e.target; Store.setStopMeta(editingStop.id, { time: f.time.value, note: f.note.value.trim(), stay: f.stay.value === '' ? null : +f.stay.value }); closeStop(); };
$('#me').onchange = e => Store.setMe(e.target.value.trim());

// tabs
document.querySelectorAll('.tab').forEach((b, i) => b.onclick = () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === b));
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + b.dataset.tab));
  $('.tab-ink').style.transform = `translateX(${i*100}%)`;
});

// drag-to-reorder: lift → follow finger 1:1 → neighbours slide (FLIP-style) → springy settle → commit
(() => {
  const list = $('#stopList'), buzz = ms => { try { navigator.vibrate?.(ms); } catch {} };
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let drag = null;
  const blockScroll = e => { if (drag) e.preventDefault(); };
  list.addEventListener('touchmove', blockScroll, { passive: false });
  list.addEventListener('pointerdown', e => {
    if (drag || !e.target.classList.contains('handle')) return;
    const li = e.target.closest('.item'); e.preventDefault();
    const items = [...list.querySelectorAll('.item')], rects = items.map(x => x.getBoundingClientRect());
    const from = items.indexOf(li);
    drag = { li, items, rects, from, to: from, y0: e.clientY, dy: 0, id: e.pointerId, handle: e.target, panel: list.closest('.panel') };
    drag.panel.style.overflow = 'hidden'; list.classList.add('dragging');
    items.forEach(it => { if (it !== li) it.style.transition = 'transform 200ms cubic-bezier(.2,.8,.2,1)'; });
    li.style.transition = 'box-shadow 200ms ease, transform 0s'; li.classList.add('drag');
    li.style.transform = 'translate3d(0,0,0) scale(1.03) rotate(.6deg)';
    e.target.setPointerCapture(e.pointerId); buzz(8);
  });
  list.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return; e.preventDefault();
    const { li, items, rects, from } = drag, dy = drag.dy = e.clientY - drag.y0;
    li.style.transform = `translate3d(0,${dy}px,0) scale(1.03) rotate(.6deg)`;
    const cy = rects[from].top + rects[from].height / 2 + dy;
    const to = rects.filter((r, i) => i !== from && r.top + r.height / 2 < cy).length;   // slots whose centre we've passed
    if (to !== drag.to) { drag.to = to; buzz(4);
      items.forEach((it, i) => { if (it === li) return; let s = 0;
        if (from < to && i > from && i <= to) s = rects[i - 1].top - rects[i].top;      // slide up into previous slot
        if (from > to && i < from && i >= to) s = rects[i + 1].top - rects[i].top;      // slide down into next slot
        it.style.transform = s ? `translate3d(0,${s}px,0)` : ''; }); }
  });
  const end = e => {
    if (!drag || (e && e.pointerId !== drag.id)) return; const d = drag; drag = null;
    const { li, items, rects, from, to } = d;
    try { d.handle.releasePointerCapture(d.id); } catch {}
    const target = rects[to].top - rects[from].top;
    const finish = () => { if (finish.done) return; finish.done = true;
      d.panel.style.overflow = ''; list.classList.remove('dragging');
      if (from !== to) { list.classList.add('settled'); Store.reorder(from, to); setTimeout(() => list.classList.remove('settled'), 60); }
      else { li.classList.remove('drag', 'settle'); li.style.cssText = li.style.cssText.replace(/transform[^;]*;?|transition[^;]*;?/g, ''); items.forEach(it => { it.style.transform = ''; it.style.transition = ''; }); } };
    if (reduce()) return finish();
    li.classList.remove('drag'); li.classList.add('settle');
    li.style.transition = 'transform 350ms cubic-bezier(.34,1.56,.64,1), box-shadow 350ms ease';
    requestAnimationFrame(() => { li.style.transform = `translate3d(0,${target}px,0) scale(1) rotate(0deg)`; });
    li.addEventListener('transitionend', ev => { if (ev.propertyName === 'transform') finish(); });
    setTimeout(finish, 420); if (from !== to) buzz(6);
  };
  list.addEventListener('pointerup', end); list.addEventListener('pointercancel', end);
})();

// bottom sheet: whole header (handle + tab bar) is a grab zone. Tap → next snap; drag → follow + velocity snap.
(() => {
  const sheet = $('#sheet'), tabs = $('.tabs'), STATES = ['min', '', 'full'];
  const cur = () => sheet.classList.contains('full') ? 2 : sheet.classList.contains('min') ? 0 : 1;
  const set = i => { sheet.classList.remove('min', 'full'); if (STATES[i]) sheet.classList.add(STATES[i]); };
  const snaps = () => { const H = sheet.offsetHeight; return [H - 112, Math.max(0, H - 300), 0]; };   // translateY per state (matches CSS)
  let g = null, swallowClick = false;
  const down = e => { if (innerWidth >= 900 || g) return;
    g = { id: e.pointerId, y0: e.clientY, y: e.clientY, t: performance.now(), base: snaps()[cur()], v: 0, dragging: false, onTab: !!e.target.closest('.tab'), el: e.currentTarget }; };
  const move = e => { if (!g || e.pointerId !== g.id) return; const dy = e.clientY - g.y0;
    if (!g.dragging && Math.abs(dy) > 8) { g.dragging = true; sheet.classList.add('dragging'); try { g.el.setPointerCapture(g.id); } catch {} }
    if (!g.dragging) return; e.preventDefault();
    const now = performance.now(), dt = Math.max(1, now - g.t); g.v = 0.6 * g.v + 0.4 * ((e.clientY - g.y) / dt); g.y = e.clientY; g.t = now;  // px/ms, smoothed
    const max = snaps()[0], y = g.base + dy; sheet.style.transform = `translateY(${y < 0 ? y / 4 : y > max ? max + (y - max) / 4 : y}px)`; };   // rubber-band at the ends
  const up = e => { if (!g || e.pointerId !== g.id) return; const s = g; g = null;
    if (!s.dragging) { if (!s.onTab) set((cur() + 1) % 3); return; }      // tap: a tab keeps its own click; anywhere else cycles the snap
    swallowClick = true; setTimeout(() => swallowClick = false, 60);
    const sn = snaps(), c = cur(), proj = s.base + (s.y - s.y0) + s.v * 180;
    let best = 0; sn.forEach((p, i) => { if (Math.abs(p - proj) < Math.abs(sn[best] - proj)) best = i; });
    if (Math.abs(s.v) > 0.5 && best === c) best = Math.max(0, Math.min(2, c + (s.v < 0 ? 1 : -1)));   // a flick always moves one step
    sheet.classList.remove('dragging'); sheet.style.transform = ''; set(best); };
  [$('#grab'), tabs].forEach(z => { z.addEventListener('pointerdown', down); z.addEventListener('pointermove', move, { passive: false }); z.addEventListener('pointerup', up); z.addEventListener('pointercancel', up); });
  tabs.addEventListener('click', e => { if (swallowClick) { e.stopPropagation(); e.preventDefault(); } }, true);   // a drag that began on a tab is not a tab tap
})();

// search (Kakao Places, biased to map center)
let st; $('#q').addEventListener('input', e => { clearTimeout(st); const q = e.target.value.trim(); if (q.length < 2) return $('#results').classList.remove('show'); st = setTimeout(() => search(q), 350); });
async function search(q) {
  try {
    const data = await MapView.search(q);
    $('#results').innerHTML = data.length ? data.map((d, i) => `<li data-i="${i}">${cat(d.category).emoji} ${esc(d.name)}<small>${esc(d.address)}</small></li>`).join('') : `<li>${t('noResults')}</li>`;
    $('#results').classList.add('show'); $('#results')._data = data;
  } catch { toast(t('tSearchFail')); }
}
$('#results').onclick = e => { const li = e.target.closest('li'); const d = $('#results')._data?.[li?.dataset.i]; if (!d) return;
  $('#results').classList.remove('show'); $('#q').value = ''; $('#q').blur();
  MapView.flyTo(d.lat, d.lng);
  openForm(null, { name: d.name, lat: d.lat, lng: d.lng, category: CATS[d.category] ? d.category : 'etc', address: d.address, kakaoId: d.kakaoId });
};
document.addEventListener('click', e => { if (!e.target.closest('.search')) $('#results').classList.remove('show'); });
MapView.onLongPress((lat, lng) => openForm(null, { name: '', lat, lng, category: 'etc' }));
$('#zoomIn').onclick = () => MapView.zoom(-1); $('#zoomOut').onclick = () => MapView.zoom(1);

// thumbnails: Kakao gives no photo API; user sets one by URL or upload (resized JPEG dataURL)
const thumbHtml = p => { const c = cat(p.category);
  return p.thumb ? `<div class="ico thumb" style="background:${c.color}"><img src="${esc(p.thumb)}" alt="" loading="lazy" onerror="this.remove()"><i>${c.emoji}</i></div>`
    : `<div class="ico ph" style="--c:${c.color}">${c.emoji}</div>`; };
let thumbDraft = '';
function showThumb() { const box = $('#thumbPreview'); const c = cat($('#catSeg').dataset.v);
  box.innerHTML = thumbDraft ? `<img src="${esc(thumbDraft)}" alt="">` : `<span>${c.emoji}</span>`; box.style.setProperty('--c', c.color);
  $('#thumbRemove').style.display = thumbDraft ? '' : 'none'; $('#thumbUrl').value = thumbDraft.startsWith('data:') ? '' : thumbDraft; }
function resizeImage(file, max = 300) {
  return new Promise((res, rej) => { const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.72)); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(); }; img.src = url; });
}
$('#thumbFile').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { thumbDraft = await resizeImage(f); showThumb(); } catch { toast(t('tPhotoFail')); } e.target.value = ''; };
$('#thumbUrl').onchange = e => { const v = e.target.value.trim(); if (!v) return; if (!/^https:\/\//.test(v)) return toast(t('tPhotoFail'));
  const img = new Image(); img.onload = () => { thumbDraft = v; showThumb(); }; img.onerror = () => toast(t('tPhotoFail')); img.src = v; };
$('#thumbRemove').onclick = () => { thumbDraft = ''; showThumb(); };
$('#catSeg').addEventListener('click', () => setTimeout(showThumb));

// category manager
function openCats() { renderCats(); $('#catModal').classList.add('show'); }
function renderCats() { rebuildCats(); const cs = Store.get().categories;
  $('#catList').innerHTML = cs.map((c, i) => `<li class="catrow" data-id="${c.id}">
    <input class="emoji" value="${esc(c.emoji)}" maxlength="4" aria-label="emoji" data-k="emoji">
    <input class="cname" value="${esc(c.name || '')}" placeholder="${esc(c.key ? t(c.key) : t('catNamePh'))}" maxlength="20" data-k="name">
    <div class="swatches">${CAT_PALETTE.map(col => `<button type="button" class="sw ${col === c.color ? 'on' : ''}" style="background:${col}" data-color="${col}" aria-label="${col}"></button>`).join('')}</div>
    <div class="catbtns"><button type="button" class="iconbtn" data-mv="-1" ${i ? '' : 'disabled'} aria-label="${t('moveUp')}">↑</button><button type="button" class="iconbtn" data-mv="1" ${i < cs.length - 1 ? '' : 'disabled'} aria-label="${t('moveDown')}">↓</button>
    ${c.id === 'etc' ? '' : `<button type="button" class="iconbtn del" data-del aria-label="${t('delete')}">🗑</button>`}</div></li>`).join(''); }
$('#catList').addEventListener('change', e => { const row = e.target.closest('.catrow'), k = e.target.dataset.k; if (!row || !k) return;
  const v = e.target.value.trim(); if (k === 'emoji' && !v) return renderCats(); Store.updateCategory(row.dataset.id, { [k]: v }); });
$('#catList').addEventListener('click', e => { const row = e.target.closest('.catrow'); if (!row) return; const id = row.dataset.id;
  const sw = e.target.closest('[data-color]'), mv = e.target.closest('[data-mv]');
  if (sw) { Store.updateCategory(id, { color: sw.dataset.color }); renderCats(); }
  else if (mv) { Store.moveCategory(id, +mv.dataset.mv); renderCats(); }
  else if (e.target.closest('[data-del]')) { const c = cat(id); if (confirm(t('cDeleteCat', { name: c.label }))) { Store.removeCategory(id); renderCats(); } } });
$('#addCat').onclick = () => { Store.addCategory({ name: t('newCat') }); renderCats(); setTimeout(() => { const ins = $('#catList').querySelectorAll('.cname'); ins[ins.length - 2]?.select(); }, 50); };
$('#closeCats').onclick = () => $('#catModal').classList.remove('show');
$('#catModal').onclick = e => { if (e.target.id === 'catModal') $('#catModal').classList.remove('show'); };
document.addEventListener('langchange', () => { if ($('#catModal').classList.contains('show')) renderCats(); });

// mobile: collapse sheet when the map is actually dragged
MapView.onDragStart(() => { if (innerWidth >= 900) return; const sh = $('#sheet'); if (!sh.classList.contains('min')) { sh.classList.remove('full'); sh.classList.add('min'); } });

// form
function seg(el, obj, val) { el.innerHTML = Object.entries(obj).map(([k,v]) => `<button type="button" data-v="${k}" class="${k===val?'on':''}">${v.emoji? v.emoji+' ':''}${v.label}</button>`).join('');
  el.onclick = e => { const b = e.target.closest('button'); if (!b) return; el.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); el.dataset.v = b.dataset.v; }; el.dataset.v = val; }
function openForm(p, draft) {
  editing = p; pending = draft; const f = $('#placeForm'), d = p || draft;
  $('#formTitle').textContent = p ? t('editPlace') : t('addPlace'); f.name.value = d.name || ''; f.cost.value = p?.cost || ''; f.memo.value = p?.memo || '';
  rebuildCats(); seg($('#catSeg'), CATS, CATS[d.category] ? d.category : 'etc'); thumbDraft = p ? (p.thumb || '') : (d.thumb || ''); showThumb(); seg($('#statusSeg'), STATUS, p?.status || 'wish');
  $('#delPlace').style.display = p ? '' : 'none'; $('#kakaoLink').href = kakaoLink(d); $('#kakaoLink').style.display = d.lat ? '' : 'none'; $('#modal').classList.add('show');
}
const closeForm = () => $('#modal').classList.remove('show');
$('#cancelForm').onclick = closeForm; $('#modal').onclick = e => { if (e.target.id === 'modal') closeForm(); };
$('#delPlace').onclick = () => { if (editing && confirm(t('cDelete'))) { Store.removePlace(editing.id); closeForm(); } };
$('#placeForm').onsubmit = e => { e.preventDefault(); const f = e.target;
  const v = { name: f.name.value.trim(), cost: +f.cost.value || 0, memo: f.memo.value.trim(), category: $('#catSeg').dataset.v, status: $('#statusSeg').dataset.v, thumb: thumbDraft || '' };
  if (editing) Store.updatePlace(editing.id, v); else { Store.addPlace({ ...pending, ...v }); toast(t('tPinned')); }
  closeForm(); };

// share
$('#exportBtn').onclick = () => { const b = new Blob([JSON.stringify(Store.get(), null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(b), download: `najune-list-${new Date().toISOString().slice(0,10)}.json` }); a.click(); toast(t('tExported')); };
if ($('#importFile')) $('#importFile').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { Store.merge(JSON.parse(await f.text())); fitted = false; render(); toast(t('tMerged')); } catch { toast(t('tBadFile')); } e.target.value = ''; };
if ($('#resetBtn')) $('#resetBtn').onclick = () => confirm(t('cReset')) && Store.reset();
if ($('#sampleBtn')) $('#sampleBtn').onclick = () => { loadSample(); toast(t('tSample')); };

function loadSample() {
  const P = [
    ['경복궁','sight',37.5796,126.9770,3000,'한복 입고 가기','planned',true],
    ['광장시장 육회','food',37.5700,126.9996,25000,'빈대떡도!','planned',true],
    ['익선동 카페거리','cafe',37.5743,126.9893,12000,'','planned',false],
    ['남산서울타워','sight',37.5512,126.9882,26000,'자물쇠 챙기기','planned',true],
    ['성수 카페 어니언','cafe',37.5447,127.0582,14000,'','wish',true],
    ['한강 뚝섬공원','sight',37.5292,127.0669,0,'돗자리','wish',false],
    ['을지로 노가리골목','food',37.5660,126.9918,30000,'','done',false],
    ['롯데호텔 서울','stay',37.5651,126.9810,250000,'','wish',false],
  ].map(([name,category,lat,lng,cost,memo,status,heart],i)=>({id:'s'+i,name,category,lat,lng,cost,memo,status,heart,addedBy:i%2?'여자친구':'한빛',createdAt:Date.now()-i*1000}));
  Store.replace({ places: P, trips: [{ id:'t1', name:'서울 데이트 1일차', date:'2026-10-24', stops:['s0','s2','s1','s3'], meta:{ s0:{time:'10:30',note:'한복 대여 먼저'}, s2:{time:'13:00'}, s1:{time:'15:30',note:'빈대떡!'}, s3:{time:'19:00',note:'야경'} } }, { id:'t2', name:'성수 데이트', date:'2026-10-25', stops:['s4','s5'], meta:{} }], activeTripId:'t1' });
  fitted = false; render();
}

// sync status + space UI
let lastSync = ['connecting'];
function syncUI(s, msg) {
  lastSync = [s, msg];
  $('#syncDot').className = 'dot ' + s;
  if (adapter.mode === 'v2' && !$('#noticeBanner').dataset.k) $('#syncMode').textContent = t('syncV2');
  $('#syncText').textContent = s === 'online' ? t('syncOnline') : s === 'connecting' ? t('syncConnecting') : (msg ? t(msg) : t('syncLocal'));
  const b = $('#banner'); if (s === 'local' && msg) { b.textContent = '⚠️ ' + t(msg); b.classList.add('show'); } else b.classList.remove('show');
}
const adapter = SyncAdapter(Space.get());
adapter.onStatus(syncUI); syncUI('connecting');
$('#spaceCode').textContent = Space.get();
$('#joinSpace').onclick = () => { if (!Space.set($('#spaceInput').value)) toast(t('tShort')); };
$('#newSpace').onclick = () => { if (confirm(t('cNewSpace'))) Space.set('najune-' + Math.random().toString(36).slice(2, 8)); };
$('#copyLink').onclick = async () => { const l = Space.link();
  try { if (navigator.share) await navigator.share({ title: t('appName'), url: l }); else { await navigator.clipboard.writeText(l); toast(t('tCopied')); } } catch {} };
localStorage.removeItem('najune-kakao-rest'); localStorage.removeItem('najune-dir-cache-v1');  // REST key feature removed: clear anything stored
adapter.onNotice(k => { $('#syncMode').textContent = t(k); const b = $('#noticeBanner'); b.textContent = 'ℹ️ ' + t(k); b.dataset.k = k; b.classList.add('show'); if (k !== 'noticeNoV2') setTimeout(() => b.classList.remove('show'), 10000); });  // missing-table notice stays until tapped
$('#noticeBanner').onclick = () => $('#noticeBanner').classList.remove('show');
$('#banner').onclick = () => $('#banner').classList.remove('show');
Store.on((s, remote) => { if (remote) toast(t('tRemote')); });

document.querySelectorAll('.lang button').forEach(b => b.onclick = () => setLang(b.dataset.lang));
document.addEventListener('langchange', () => { render(); { const b = $('#noticeBanner'); if (b.dataset.k) { $('#syncMode').textContent = t(b.dataset.k); b.textContent = 'ℹ️ ' + t(b.dataset.k); } } syncUI(...lastSync); if ($('#modal').classList.contains('show')) $('#formTitle').textContent = editing ? t('editPlace') : t('addPlace'); });
applyI18n();
MapView.init('map').catch(err => { console.warn('Kakao map failed:', err.message); const b = $('#mapBanner'); b.textContent = '🗺️ ' + t('errMap'); b.classList.add('show'); document.body.classList.add('nomap'); });
addEventListener('resize', () => MapView.relayout());
document.addEventListener('langchange', () => { if ($('#mapBanner').classList.contains('show')) $('#mapBanner').textContent = '🗺️ ' + t('errMap'); });
Store.init(adapter).then(() => {
  const qs = new URLSearchParams(location.search);
  if (qs.has('sample')) loadSample();
  if (qs.get('tab')) document.querySelector(`.tab[data-tab="${qs.get('tab')}"]`)?.click();
});
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  const hadController = !!navigator.serviceWorker.controller; let reloaded = false;
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(r => r.update()).catch(() => {});
  // when a new version takes control, reload once so HTML/CSS/JS all come from the same version
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloaded) { reloaded = true; location.reload(); } });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') navigator.serviceWorker.getRegistration().then(r => r?.update()).catch(() => {}); });
}

// 🥚 easter egg: tap the bear 10 times (each gap < 1.5s) → purple heart shower
(() => {
  const bear = $('#bear'); if (!bear) return;
  const GAP = 1500, COUNT = 10;
  let n = 0, last = 0;
  bear.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); });
  bear.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); });
  bear.addEventListener('pointerup', e => {
    e.preventDefault(); e.stopPropagation();
    const now = performance.now();
    if (now - last > GAP) n = 0;                       // idle too long → start over
    last = now; n++;
    bear.classList.remove('boop'); void bear.offsetWidth; bear.classList.add('boop');
    if (n >= COUNT) { n = 0; last = 0; hearts(); }
  });
  function hearts() {
    try { navigator.vibrate?.([10, 40, 10]); } catch {}
    bear.classList.remove('boop'); void bear.offsetWidth; bear.classList.add('love');
    setTimeout(() => bear.classList.remove('love'), 900);
    const layer = document.createElement('div'); layer.className = 'heart-shower'; document.body.appendChild(layer);
    const W = innerWidth, H = innerHeight, glyphs = ['💜', '💟', '💜', '💜', '🤍'];
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {       // gentle static burst around the bear
      const r = bear.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      for (let i = 0; i < 12; i++) { const s = document.createElement('span'), ang = i / 12 * Math.PI * 2, d = 36 + (i % 3) * 14;
        s.textContent = glyphs[i % 2]; s.style.cssText = `left:${cx + Math.cos(ang) * d}px;top:${cy + 40 + Math.sin(ang) * d}px;font-size:${16 + (i % 3) * 4}px`; layer.appendChild(s); }
      layer.animate([{ opacity: 0 }, { opacity: 1, offset: .2 }, { opacity: 1, offset: .75 }, { opacity: 0 }], { duration: 2000, fill: 'forwards' });
      return setTimeout(() => layer.remove(), 2100);
    }
    const N = W < 600 ? 64 : 80;
    for (let i = 0; i < N; i++) {
      const s = document.createElement('span'), size = 14 + Math.random() * 26, x = Math.random() * W, drift = (Math.random() - .5) * 160;
      const rot0 = (Math.random() - .5) * 60, rot1 = rot0 + (Math.random() - .5) * 240, dur = 2400 + Math.random() * 1400, delay = Math.random() * 900;
      const up = Math.random() < .3;                                   // a few float up from the bottom, most rain down
      s.textContent = glyphs[(Math.random() * glyphs.length) | 0]; s.style.cssText = `left:${x}px;top:0;font-size:${size}px`;
      if (i % 7 === 0) s.style.filter = 'hue-rotate(-20deg) saturate(.8)';
      layer.appendChild(s);
      const y0 = up ? H + 40 : -60, y1 = up ? H * (.15 + Math.random() * .35) : H + 60;
      s.animate([
        { transform: `translate3d(0,${y0}px,0) rotate(${rot0}deg) scale(.6)`, opacity: 0 },
        { transform: `translate3d(${drift * .4}px,${y0 + (y1 - y0) * .25}px,0) rotate(${rot0 + (rot1 - rot0) * .25}deg) scale(1)`, opacity: 1, offset: .2 },
        { transform: `translate3d(${drift}px,${y0 + (y1 - y0) * .8}px,0) rotate(${rot0 + (rot1 - rot0) * .8}deg) scale(1)`, opacity: .9, offset: .8 },
        { transform: `translate3d(${drift * 1.1}px,${y1}px,0) rotate(${rot1}deg) scale(.9)`, opacity: 0 }
      ], { duration: dur, delay, easing: 'cubic-bezier(.25,.6,.35,1)', fill: 'both' });
    }
    setTimeout(() => layer.remove(), 4400);
  }
  window.__hearts = hearts;   // handy for screenshots/tests
})();

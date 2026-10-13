const CATS = { food:{get label(){return t('catFood')},emoji:'🍜',color:'#F7C6D0'}, cafe:{get label(){return t('catCafe')},emoji:'☕️',color:'#F8E7A8'}, stay:{get label(){return t('catStay')},emoji:'🛏️',color:'#D9CFF3'}, sight:{get label(){return t('catSight')},emoji:'🎡',color:'#BFE6D6'}, etc:{get label(){return t('catEtc')},emoji:'📍',color:'#F3EDE3'} };
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
function render() {
  const s = Store.get(), trip = Store.activeTrip();
  // filters
  const fs = [['all',t('fAll')],['heart',t('fHeart')],...Object.entries(CATS).map(([k,v])=>[k,v.emoji+' '+v.label]),...Object.entries(STATUS).map(([k,v])=>['s:'+k,v.label])];
  $('#filters').innerHTML = fs.map(([k,l]) => `<button class="chip ${filter===k?'on':''}" data-f="${k}">${l}</button>`).join('');
  const shown = s.places.filter(p => filter==='all' || (filter==='heart'?p.heart: filter.startsWith('s:')? p.status===filter.slice(2) : p.category===filter))
    .sort((a,b)=>(b.heart-a.heart)||(b.createdAt-a.createdAt));
  $('#placeList').innerHTML = shown.length ? shown.map((p,i) => `
    <li class="item" style="animation-delay:${i*30}ms" data-id="${p.id}">
      <div class="ico" style="background:${CATS[p.category].color}">${CATS[p.category].emoji}</div>
      <div class="body" data-act="edit"><h4>${esc(p.name)}</h4>
        <p><span class="badge" style="background:${STATUS[p.status].color}">${STATUS[p.status].label}</span>${esc([won(p.cost), p.memo, p.addedBy && t('by',{name:p.addedBy})].filter(Boolean).join(' · '))}</p></div>
      <button class="iconbtn heart ${p.heart?'on':''}" data-act="heart" aria-label="${t('heart')}">${p.heart?'💗':'🤍'}</button>
      <a class="iconbtn" href="${kakaoLink(p)}" target="_blank" rel="noopener" aria-label="${t('openKakao')}" title="${t('openKakao')}">🧭</a>
      <button class="iconbtn" data-act="stop" aria-label="${t('addToTrip')}">＋</button>
    </li>`).join('') : `<p class="hint">${t('emptyPlaces')}</p>`;

  // trips
  $('#tripSelect').innerHTML = s.trips.length ? s.trips.map(t => `<option value="${t.id}" ${t.id===s.activeTripId?'selected':''}>${esc(t.name)}</option>`).join('') : `<option>${t('noTrips')}</option>`;
  const stops = trip ? trip.stops.map(id => s.places.find(p => p.id === id)).filter(Boolean) : [];
  let total = 0, cost = 0, html = '';
  stops.forEach((p, i) => {
    if (i) { const d = dist(stops[i-1], p); total += d; html += `<li class="leg">${t('leg',{d:fmtKm(d)})}</li>`; }
    cost += +p.cost || 0;
    html += `<li class="item" data-id="${p.id}" data-idx="${i}" style="animation-delay:${i*40}ms">
      <div class="num">${i+1}</div><div class="body" data-act="fly"><h4>${CATS[p.category].emoji} ${esc(p.name)}</h4><p>${esc(won(p.cost) || p.memo || '')}</p></div>
      <a class="iconbtn" href="${kakaoLink(p)}" target="_blank" rel="noopener" aria-label="${t('openKakao')}">🧭</a>
      <button class="iconbtn" data-act="unstop" aria-label="${t('removeStop')}">✕</button><span class="handle" aria-label="${t('reorder')}">☰</span></li>`;
  });
  $('#stopList').innerHTML = html;
  $('#tripMeta').textContent = trip ? t('tripMeta',{n:stops.length,d:fmtKm(total)}) + (cost ? t('tripCost',{c:won(cost)}) : '') : t('tripEmpty');
  $('#me').value = Store.me;

  // map
  s.places.forEach(p => { Object.defineProperty(p, '_color', { value: CATS[p.category].color, configurable: true }); Object.defineProperty(p, '_emoji', { value: CATS[p.category].emoji, configurable: true }); });
  MapView.draw({ places: s.places, stops, onPin: p => { MapView.flyTo(p.lat, p.lng); openForm(p); } });
  if (!fitted && s.places.length) { fitted = true; const mob = innerWidth < 900;
    MapView.fit(stops.length > 1 ? stops : s.places, mob ? [80, 24, 340, 24] : [96, 48, 48, 420]); }
}
Store.on(render);

/* ---------- interactions ---------- */
$('#filters').onclick = e => { const f = e.target.dataset.f; if (f) { filter = f; render(); } };
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
  if (act === 'unstop') Store.removeStop(p.id); else if (act === 'fly') MapView.flyTo(p.lat, p.lng);
};
$('#tripSelect').onchange = e => Store.setActiveTrip(e.target.value);
$('#newTrip').onclick = () => { const f = $('#tripForm'), n = Store.get().trips.length + 1; f.name.value = '';
  f.name.placeholder = t('presetDay',{n});
  $('#tripPresets').innerHTML = [t('presetDay',{n}), t('presetWeekend'), t('presetFood'), t('presetCafe')].map(x => `<button type="button">${x}</button>`).join('');
  $('#tripModal').classList.add('show'); setTimeout(() => f.name.focus(), 350); };
$('#tripPresets').onclick = e => { if (e.target.tagName === 'BUTTON') $('#tripForm').name.value = e.target.textContent; };
const closeTrip = () => { $('#tripModal').classList.remove('show'); $('#tripForm').name.blur(); };
$('#cancelTrip').onclick = closeTrip; $('#tripModal').onclick = e => { if (e.target.id === 'tripModal') closeTrip(); };
$('#tripForm').onsubmit = e => { e.preventDefault(); const v = e.target.name.value.trim() || e.target.name.placeholder; Store.addTrip(v); closeTrip(); toast(t('tTripMade',{name:v})); };
$('#me').onchange = e => Store.setMe(e.target.value.trim());

// tabs
document.querySelectorAll('.tab').forEach((b, i) => b.onclick = () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === b));
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + b.dataset.tab));
  $('.tab-ink').style.transform = `translateX(${i*100}%)`;
});

// drag-to-reorder (pointer events, works on touch)
(() => {
  let drag = null;
  $('#stopList').addEventListener('pointerdown', e => {
    if (!e.target.classList.contains('handle')) return;
    const li = e.target.closest('.item'); e.preventDefault();
    const items = [...document.querySelectorAll('#stopList .item')];
    drag = { li, from: +li.dataset.idx, to: +li.dataset.idx, y0: e.clientY, items, rects: items.map(x => x.getBoundingClientRect()) };
    li.classList.add('drag'); li.setPointerCapture(e.pointerId);
  });
  $('#stopList').addEventListener('pointermove', e => {
    if (!drag) return; const dy = e.clientY - drag.y0; drag.li.style.transform = `translateY(${dy}px) scale(1.03)`;
    const cy = drag.rects[drag.from].top + drag.rects[drag.from].height/2 + dy;
    let to = drag.rects.findIndex(r => cy < r.top + r.height/2); if (to < 0) to = drag.rects.length - 1;
    drag.to = to; const h = drag.rects[drag.from].height + 8;
    drag.items.forEach((it, i) => { if (it === drag.li) return; let s = 0;
      if (drag.from < to && i > drag.from && i <= to) s = -h; if (drag.from > to && i < drag.from && i >= to) s = h;
      it.style.transition = 'transform .3s var(--spring)'; it.style.transform = s ? `translateY(${s}px)` : ''; });
  });
  const end = () => { if (!drag) return; const { from, to } = drag; drag = null; if (from !== to) Store.reorder(from, to); else render(); };
  $('#stopList').addEventListener('pointerup', end); $('#stopList').addEventListener('pointercancel', end);
})();

// bottom sheet drag (mobile)
(() => {
  const sheet = $('#sheet'), grab = $('#grab'); let y0 = null, base = 0;
  const states = ['min', '', 'full'];
  const cur = () => sheet.classList.contains('full') ? 2 : sheet.classList.contains('min') ? 0 : 1;
  const set = i => { sheet.classList.remove('min','full'); if (states[i]) sheet.classList.add(states[i]); };
  grab.addEventListener('pointerdown', e => { y0 = e.clientY; base = cur(); sheet.classList.add('dragging'); grab.setPointerCapture(e.pointerId); });
  grab.addEventListener('pointermove', e => { if (y0 === null) return; const m = new DOMMatrix(getComputedStyle(sheet).transform);
    sheet.style.transform = `translateY(${Math.max(0, m.m42 + e.clientY - y0)}px)`; y0 = e.clientY; base = base; grab._dy = (grab._dy||0) + e.movementY; });
  grab.addEventListener('pointerup', () => { sheet.classList.remove('dragging'); sheet.style.transform = ''; const dy = grab._dy || 0; grab._dy = 0; y0 = null;
    if (Math.abs(dy) < 6) set((base + 1) % 3); else set(Math.max(0, Math.min(2, base + (dy < 0 ? 1 : -1)))); });
})();

// search (Kakao Places, biased to map center)
let st; $('#q').addEventListener('input', e => { clearTimeout(st); const q = e.target.value.trim(); if (q.length < 2) return $('#results').classList.remove('show'); st = setTimeout(() => search(q), 350); });
async function search(q) {
  try {
    const data = await MapView.search(q);
    $('#results').innerHTML = data.length ? data.map((d, i) => `<li data-i="${i}">${CATS[d.category].emoji} ${esc(d.name)}<small>${esc(d.address)}</small></li>`).join('') : `<li>${t('noResults')}</li>`;
    $('#results').classList.add('show'); $('#results')._data = data;
  } catch { toast(t('tSearchFail')); }
}
$('#results').onclick = e => { const li = e.target.closest('li'); const d = $('#results')._data?.[li?.dataset.i]; if (!d) return;
  $('#results').classList.remove('show'); $('#q').value = ''; $('#q').blur();
  MapView.flyTo(d.lat, d.lng);
  openForm(null, { name: d.name, lat: d.lat, lng: d.lng, category: d.category, address: d.address });
};
document.addEventListener('click', e => { if (!e.target.closest('.search')) $('#results').classList.remove('show'); });
MapView.onLongPress((lat, lng) => openForm(null, { name: '', lat, lng, category: 'etc' }));
$('#zoomIn').onclick = () => MapView.zoom(-1); $('#zoomOut').onclick = () => MapView.zoom(1);

// form
function seg(el, obj, val) { el.innerHTML = Object.entries(obj).map(([k,v]) => `<button type="button" data-v="${k}" class="${k===val?'on':''}">${v.emoji? v.emoji+' ':''}${v.label}</button>`).join('');
  el.onclick = e => { const b = e.target.closest('button'); if (!b) return; el.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); el.dataset.v = b.dataset.v; }; el.dataset.v = val; }
function openForm(p, draft) {
  editing = p; pending = draft; const f = $('#placeForm'), d = p || draft;
  $('#formTitle').textContent = p ? t('editPlace') : t('addPlace'); f.name.value = d.name || ''; f.cost.value = p?.cost || ''; f.memo.value = p?.memo || '';
  seg($('#catSeg'), CATS, d.category || 'etc'); seg($('#statusSeg'), STATUS, p?.status || 'wish');
  $('#delPlace').style.display = p ? '' : 'none'; $('#kakaoLink').href = kakaoLink(d); $('#kakaoLink').style.display = d.lat ? '' : 'none'; $('#modal').classList.add('show');
}
const closeForm = () => $('#modal').classList.remove('show');
$('#cancelForm').onclick = closeForm; $('#modal').onclick = e => { if (e.target.id === 'modal') closeForm(); };
$('#delPlace').onclick = () => { if (editing && confirm(t('cDelete'))) { Store.removePlace(editing.id); closeForm(); } };
$('#placeForm').onsubmit = e => { e.preventDefault(); const f = e.target;
  const v = { name: f.name.value.trim(), cost: +f.cost.value || 0, memo: f.memo.value.trim(), category: $('#catSeg').dataset.v, status: $('#statusSeg').dataset.v };
  if (editing) Store.updatePlace(editing.id, v); else { Store.addPlace({ ...pending, ...v }); toast(t('tPinned')); }
  closeForm(); };

// share
$('#exportBtn').onclick = () => { const b = new Blob([JSON.stringify(Store.get(), null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(b), download: `najune-list-${new Date().toISOString().slice(0,10)}.json` }); a.click(); toast(t('tExported')); };
$('#importFile').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { Store.merge(JSON.parse(await f.text())); fitted = false; render(); toast(t('tMerged')); } catch { toast(t('tBadFile')); } e.target.value = ''; };
$('#resetBtn').onclick = () => confirm(t('cReset')) && Store.reset();
$('#sampleBtn').onclick = () => { loadSample(); toast(t('tSample')); };

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
  Store.replace({ places: P, trips: [{ id:'t1', name:'서울 데이트 1일차', stops:['s0','s2','s1','s3'] }, { id:'t2', name:'성수 데이트', stops:['s4','s5'] }], activeTripId:'t1' });
  fitted = false; render();
}

// sync status + space UI
let lastSync = ['connecting'];
function syncUI(s, msg) {
  lastSync = [s, msg];
  $('#syncDot').className = 'dot ' + s;
  $('#syncText').textContent = s === 'online' ? t('syncOnline') : s === 'connecting' ? t('syncConnecting') : (msg ? t(msg) : t('syncLocal'));
  const b = $('#banner'); if (s === 'local' && msg) { b.textContent = '⚠️ ' + t(msg); b.classList.add('show'); } else b.classList.remove('show');
}
const adapter = SupabaseAdapter(Space.get());
adapter.onStatus(syncUI); syncUI('connecting');
$('#spaceCode').textContent = Space.get();
$('#joinSpace').onclick = () => { if (!Space.set($('#spaceInput').value)) toast(t('tShort')); };
$('#newSpace').onclick = () => { if (confirm(t('cNewSpace'))) Space.set('najune-' + Math.random().toString(36).slice(2, 8)); };
$('#copyLink').onclick = async () => { const l = Space.link();
  try { if (navigator.share) await navigator.share({ title: t('appName'), url: l }); else { await navigator.clipboard.writeText(l); toast(t('tCopied')); } } catch {} };
$('#banner').onclick = () => $('#banner').classList.remove('show');
Store.on((s, remote) => { if (remote) toast(t('tRemote')); });

document.querySelectorAll('.lang button').forEach(b => b.onclick = () => setLang(b.dataset.lang));
document.addEventListener('langchange', () => { render(); syncUI(...lastSync); if ($('#modal').classList.contains('show')) $('#formTitle').textContent = editing ? t('editPlace') : t('addPlace'); });
applyI18n();
MapView.init('map').catch(err => { console.warn('Kakao map failed:', err.message); const b = $('#mapBanner'); b.textContent = '🗺️ ' + t('errMap'); b.classList.add('show'); document.body.classList.add('nomap'); });
addEventListener('resize', () => MapView.relayout());
document.addEventListener('langchange', () => { if ($('#mapBanner').classList.contains('show')) $('#mapBanner').textContent = '🗺️ ' + t('errMap'); });
Store.init(adapter).then(() => {
  const qs = new URLSearchParams(location.search);
  if (qs.has('sample')) loadSample();
  if (qs.get('tab')) document.querySelector(`.tab[data-tab="${qs.get('tab')}"]`)?.click();
});
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(()=>{});

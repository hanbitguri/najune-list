/* Data layer.
   Adapter interface: load() -> state|null, save(state), subscribe(cb), status
   SupabaseAdapter = primary (realtime) with localStorage as offline cache.
   Falls back to local-only if the table is missing or the network is down. */
const SUPABASE_URL = 'https://nykoziboiyyrjxfozwaj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oyTFWq5MBTRDYHtUlCRPZQ_2resblCI'; // public client key

const Space = {
  get() {
    const qs = new URLSearchParams(location.search).get('space');
    const code = (qs || localStorage.getItem('najune-space') || 'najune').trim().toLowerCase();
    localStorage.setItem('najune-space', code); return code;
  },
  set(code) { const c = code.trim().toLowerCase().replace(/[^a-z0-9가-힣_-]/g, '');
    if (c.length < 3) return false; localStorage.setItem('najune-space', c);
    const u = new URL(location.href); u.searchParams.set('space', c); u.searchParams.delete('sample'); location.href = u; return true; },
  link() { const u = new URL(location.href); u.search = ''; u.searchParams.set('space', this.get()); return u.toString(); }
};

const LocalAdapter = (space) => ({
  KEY: 'najune-list-v1:' + space, status: 'local',
  async load() { try { return JSON.parse(localStorage.getItem(this.KEY)) || null; } catch { return null; } },
  async save(state) { localStorage.setItem(this.KEY, JSON.stringify(state)); },
  subscribe(cb) { window.addEventListener('storage', e => { if (e.key === this.KEY && e.newValue) cb(JSON.parse(e.newValue)); }); }
});

const SupabaseAdapter = (space) => {
  const local = LocalAdapter(space);
  const clientId = localStorage.getItem('najune-client') || (() => { const c = Math.random().toString(36).slice(2); localStorage.setItem('najune-client', c); return c; })();
  let sb = null, t = null, lastUp = 0, onStatus = () => {};
  const a = {
    status: 'connecting', space, onStatus: f => { onStatus = f; },
    setStatus(s, msg) { a.status = s; onStatus(s, msg); },
    async load() {
      const cached = await local.load();
      if (!window.supabase) { a.setStatus('local', 'errNoLib'); return cached; }
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
      try {
        const { data, error } = await sb.from('spaces').select('data,updated_at').eq('id', space).maybeSingle();
        if (error) throw error;
        if (data) { lastUp = Date.parse(data.updated_at); await local.save(data.data); return data.data; }
        if (cached) a.push(cached); return cached; // new space: seed with local data
      } catch (e) {
        sb = null; const missing = e.code === 'PGRST205' || e.code === '42P01';
        a.setStatus('local', missing ? 'errNoTable' : 'errOffline');
        return cached;
      }
    },
    async push(state) {
      if (!sb) return;
      const { places, trips, categories, settings } = state;
      const { error } = await sb.from('spaces').upsert({ id: space, data: { version: 3, places, trips, categories, settings }, client_id: clientId, updated_at: new Date().toISOString() });
      if (error) a.setStatus('local', 'errSync');
    },
    async save(state) { await local.save(state); clearTimeout(t); t = setTimeout(() => a.push(state), 300); },
    subscribe(cb) {
      local.subscribe(cb);
      if (!sb) return;
      sb.channel('space:' + space)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'spaces', filter: `id=eq.${space}` }, p => {
          const row = p.new; if (!row || row.client_id === clientId) return;
          const ts = Date.parse(row.updated_at); if (ts < lastUp) return; lastUp = ts;
          local.save(row.data); cb(row.data, true);
        })
        .subscribe(async s => {
          if (s === 'SUBSCRIBED') {
            // catch up on anything written while the channel was joining / reconnecting
            const { data } = await sb.from('spaces').select('data,updated_at,client_id').eq('id', space).maybeSingle();
            if (data && Date.parse(data.updated_at) > lastUp && data.client_id !== clientId) { lastUp = Date.parse(data.updated_at); local.save(data.data); cb(data.data, true); }
            a.setStatus('online');
          } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') a.setStatus('local', 'errRealtime'); });
      window.addEventListener('online', () => a.load().then(s => s && cb(s, true)));
    }
  };
  return a;
};

/* v2: one row per place / trip / category (public.items). Per-item last-write-wins,
   so two people editing different things never clobber each other. */
const ItemsAdapter = (space, sb, clientId, local, hooks) => {
  let snap = new Map(), ord = new Map(), cur = null, t = null, cb = () => {};
  const key = (k, id) => k + ':' + id;
  const toItems = s => { const m = new Map();
    (s.categories || []).forEach((c, i) => m.set(key('category', c.id), { kind: 'category', id: c.id, data: { ...c, order: i } }));
    (s.trips || []).forEach((tr, i) => m.set(key('trip', tr.id), { kind: 'trip', id: tr.id, data: { ...tr, order: i } }));
    (s.places || []).forEach(p => m.set(key('place', p.id), { kind: 'place', id: p.id, data: p }));
    if (s.settings) m.set(key('category', '__settings'), { kind: 'category', id: '__settings', data: { __settings: true, ...s.settings } });
    return m; };
  const fromItems = (m, base = {}) => { m.forEach((x, k) => { if (x.data.order !== undefined) ord.set(k, x.data.order); }); const by = k => [...m.values()].filter(x => x.kind === k).map(x => x.data);
    const strip = ({ order, ...r }) => r, byOrd = (a, b) => (a.order ?? 0) - (b.order ?? 0);
    const cats = by("category"), st = cats.find(c => c.__settings); const { __settings, ...settings } = st || {};
    return { ...base, version: 3, places: by('place'), trips: by("trip").sort(byOrd).map(strip), categories: cats.filter(c => !c.__settings).sort(byOrd).map(strip), settings: st ? settings : (base.settings || {}) }; };
  const applyRow = (m, r) => { const k = key(r.kind, r.id);
    if (r.deleted) { m.delete(k); snap.delete(k); } else { m.set(k, { kind: r.kind, id: r.id, data: r.data }); snap.set(k, JSON.stringify(r.data)); } };
  async function push() {
    if (!cur) return; const m = toItems(cur), rows = [], now = new Date().toISOString();
    m.forEach((it, k) => { const j = JSON.stringify(it.data); if (snap.get(k) !== j) rows.push({ space_id: space, kind: it.kind, id: it.id, data: it.data, deleted: false, client_id: clientId, updated_at: now, _j: j, _k: k }); });
    snap.forEach((j, k) => { if (!m.has(k)) { const [kind, ...rest] = k.split(':'); rows.push({ space_id: space, kind, id: rest.join(':'), data: JSON.parse(j), deleted: true, client_id: clientId, updated_at: now, _k: k }); } });
    if (!rows.length) return;
    const { error } = await sb.from('items').upsert(rows.map(({ _j, _k, ...r }) => r), { onConflict: 'space_id,kind,id' });
    if (error) return hooks.setStatus('local', 'errSync');
    rows.forEach(r => r.deleted ? snap.delete(r._k) : snap.set(r._k, r._j));
  }
  async function fetchAll() { const { data, error } = await sb.from('items').select('kind,id,data,deleted,client_id,updated_at').eq('space_id', space); if (error) throw error; return data; }
  return {
    mode: 'v2',
    async load(cached) {
      const rows = await fetchAll();
      if (!rows.length) {   // first time on v2: migrate the old single-row space if present
        const { data } = await sb.from('spaces').select('data').eq('id', space).maybeSingle();
        cur = data?.data || cached || null; if (cur) { await push(); hooks.notice?.('noticeMigrated'); }
        return cur;
      }
      const m = new Map(); rows.forEach(r => applyRow(m, r)); cur = fromItems(m); await local.save(cur); return cur;
    },
    save(state) { cur = state; clearTimeout(t); t = setTimeout(push, 300); },
    subscribe(fn) { cb = fn;
      const onRow = r => { if (!r || r.client_id === clientId || !cur) return; const m = toItems(cur);
        m.forEach((x, k) => { if (ord.has(k) && x.data.order !== undefined) x.data = { ...x.data, order: ord.get(k) }; });  // keep server order for untouched rows
        applyRow(m, r);
        cur = fromItems(m, cur); local.save(cur); cb(cur, true); };
      sb.channel('items:' + space)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `space_id=eq.${space}` }, p => onRow(p.new))
        .subscribe(async s => {
          if (s === 'SUBSCRIBED') { try { (await fetchAll()).forEach(r => { if (r.client_id !== clientId && snap.get(key(r.kind, r.id)) !== (r.deleted ? undefined : JSON.stringify(r.data))) onRow(r); }); } catch {}
            hooks.setStatus('online'); }
          else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') hooks.setStatus('local', 'errRealtime'); });
    }
  };
};

/* Picks v2 (items) when the table exists, otherwise v1 (single jsonb row) + a notice banner. */
const SyncAdapter = (space) => {
  const local = LocalAdapter(space);
  const clientId = localStorage.getItem('najune-client') || (() => { const c = Math.random().toString(36).slice(2); localStorage.setItem('najune-client', c); return c; })();
  let inner = null, onStatus = () => {}, onNotice = () => {};
  const a = {
    status: 'connecting', mode: null, space,
    onStatus: f => { onStatus = f; }, onNotice: f => { onNotice = f; },
    setStatus(s, msg) { a.status = s; onStatus(s, msg); },
    async load() {
      const cached = await local.load();
      if (!window.supabase) { a.setStatus('local', 'errNoLib'); return cached; }
      const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
      const probe = await sb.from('items').select('id').eq('space_id', space).limit(1);
      if (!probe.error) {
        inner = ItemsAdapter(space, sb, clientId, local, { setStatus: a.setStatus, notice: k => onNotice(k) }); a.mode = 'v2';
        try { return await inner.load(cached); } catch { inner = null; a.setStatus('local', 'errOffline'); return cached; }
      }
      if (probe.error.code === 'PGRST205' || probe.error.code === '42P01') { a.mode = 'v1'; inner = SupabaseAdapter(space); inner.onStatus(a.setStatus); onNotice('noticeNoV2'); return inner.load(); }
      a.setStatus('local', 'errOffline'); return cached;
    },
    async save(state) { await local.save(state); inner?.save(state); },
    subscribe(cb) { local.subscribe(cb); inner?.subscribe(cb); }
  };
  return a;
};

const DEFAULT_CATS = [
  { id:'food',    key:'catFood',    emoji:'🍜', color:'#F7C6D0' },
  { id:'cafe',    key:'catCafe',    emoji:'☕️', color:'#F8E7A8' },
  { id:'stay',    key:'catStay',    emoji:'🛏️', color:'#D9CFF3' },
  { id:'sight',   key:'catSight',   emoji:'🎡', color:'#BFE6D6' },
  { id:'curious', key:'catCurious', emoji:'🤔', color:'#CFE3F7' },
  { id:'etc',     key:'catEtc',     emoji:'📍', color:'#F3EDE3' },
];
const CAT_PALETTE = ['#F7C6D0','#F8E7A8','#D9CFF3','#BFE6D6','#CFE3F7','#FAD6BF','#E6D3C2','#F3EDE3'];
// Migrate older space data: add categories, make sure every place points to a real category.
function migrate(s) {
  let changed = false;
  if (!Array.isArray(s.categories) || !s.categories.length) { s.categories = DEFAULT_CATS.map(c => ({ ...c })); changed = true; }
  if (!s.categories.find(c => c.id === 'etc')) { s.categories.push({ ...DEFAULT_CATS.at(-1) }); changed = true; }
  const ids = new Set(s.categories.map(c => c.id));
  (s.places || []).forEach(p => { if (!ids.has(p.category)) { p.category = 'etc'; changed = true; } });
  // dedupe places by id and sanitize trip stops (null / duplicate ids)
  if (Array.isArray(s.places)) { const m = new Map(); s.places.forEach(p => p && p.id && m.set(p.id, p)); if (m.size !== s.places.length) { s.places = [...m.values()]; changed = true; } }
  (s.trips || []).forEach(tr => { const st = [...new Set((tr.stops || []).filter(x => typeof x === 'string' && x))]; if (st.length !== (tr.stops || []).length) { tr.stops = st; changed = true; } });
  return changed;
}

const Store = (() => {
  let adapter, state = empty(), listeners = [];
  function empty() { return { version: 3, places: [], trips: [], categories: DEFAULT_CATS.map(c => ({ ...c })), settings: {}, activeTripId: null }; }
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const emit = (remote) => listeners.forEach(f => f(state, remote));
  const commit = () => { adapter.save(state); emit(); };
  const fixActive = () => { if (!state.trips.find(t => t.id === state.activeTripId)) state.activeTripId = state.trips[0]?.id || null; };
  return {
    uid, get adapter() { return adapter; },
    async init(a) {
      adapter = a; const active = localStorage.getItem('najune-active-trip');
      const loaded = await adapter.load(); state = { ...empty(), ...(loaded || {}) }; const mig = migrate(state); state.activeTripId = active; fixActive(); if (loaded && mig) adapter.save(state);
      adapter.subscribe((s, remote) => { const act = state.activeTripId; state = { ...empty(), ...s, activeTripId: act }; migrate(state); fixActive(); emit(remote); });
      emit();
    },
    get: () => state,
    get me() { return localStorage.getItem('najune-me') || ''; },
    on: f => listeners.push(f),
    setMe(n) { localStorage.setItem('najune-me', n); emit(); },   // per-device, not synced
    addPlace(p) { const place = { id: uid(), status: 'wish', heart: false, cost: 0, memo: '', category: 'etc', addedBy: this.me, createdAt: Date.now(), ...p }; state.places.push(place); commit(); return place; },
    updatePlace(id, patch) { Object.assign(state.places.find(p => p.id === id) || {}, patch, { updatedAt: Date.now() }); commit(); },
    removePlace(id) { state.places = state.places.filter(p => p.id !== id); state.trips.forEach(t => { if (t.stops.includes(id)) { t.stops = t.stops.filter(s => s !== id); if (t.meta) delete t.meta[id]; } }); commit(); },
    addTrip(name, date) { const t = { id: uid(), name, stops: [], meta: {}, ...(date ? { date } : {}) }; state.trips.push(t); this.setActiveTrip(t.id, true); commit(); return t; },
    setActiveTrip(id, quiet) { state.activeTripId = id; localStorage.setItem('najune-active-trip', id); if (!quiet) emit(); },  // per-device view
    activeTrip() { return state.trips.find(t => t.id === state.activeTripId) || null; },
    addStop(pid) { let tr = this.activeTrip() || this.addTrip(t('firstTrip')); if (!tr.stops.includes(pid)) tr.stops.push(pid);
      const p = state.places.find(x => x.id === pid); if (p && p.status === 'wish') p.status = 'planned'; commit(); },
    removeStop(pid) { const t = this.activeTrip(); if (t) t.stops = t.stops.filter(s => s !== pid); commit(); },
    reorder(from, to) { const t = this.activeTrip(); if (!t) return; const L = t.stops.length; if (!(from >= 0 && from < L && to >= 0 && to < L) || from === to) return; const [m] = t.stops.splice(from, 1); t.stops.splice(to, 0, m); commit(); },
    replace(s) { state = { ...empty(), ...s }; migrate(state); fixActive(); if (s.activeTripId) this.setActiveTrip(s.activeTripId, true); commit(); },
    merge(s) {
      const byId = new Map(state.places.map(p => [p.id, p]));
      (s.places || []).forEach(p => { const o = byId.get(p.id); if (!o || (p.updatedAt || 0) > (o.updatedAt || 0)) byId.set(p.id, p); });
      state.places = [...byId.values()];
      const tr = new Map(state.trips.map(t => [t.id, t])); (s.trips || []).forEach(t => tr.set(t.id, t));
      state.trips = [...tr.values()];
      const cs = new Map(state.categories.map(c => [c.id, c])); (s.categories || []).forEach(c => { if (!cs.has(c.id)) { state.categories.splice(state.categories.length - 1, 0, c); cs.set(c.id, c); } });
      migrate(state); fixActive(); commit(); },
    // categories
    addCategory(c) { const cat = { id: 'c' + uid(), name: '', emoji: '⭐️', color: CAT_PALETTE[state.categories.length % CAT_PALETTE.length], ...c };
      state.categories.splice(Math.max(0, state.categories.length - 1), 0, cat); commit(); return cat; },   // keep 기타 last
    updateCategory(id, patch) { const c = state.categories.find(x => x.id === id); if (!c) return;
      if ('name' in patch && c.key && patch.name.trim() === '') patch.name = undefined; Object.assign(c, patch); if (c.name === undefined) delete c.name; commit(); },
    moveCategory(id, dir) { const a = state.categories, i = a.findIndex(c => c.id === id), j = i + dir; if (i < 0 || j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; commit(); },
    removeCategory(id) { if (id === 'etc') return; state.categories = state.categories.filter(c => c.id !== id);
      state.places.forEach(p => { if (p.category === id) { p.category = 'etc'; p.updatedAt = Date.now(); } }); commit(); },
    updateTrip(id, patch) { const tr = state.trips.find(x => x.id === id); if (!tr) return; Object.assign(tr, patch); if (!tr.date) delete tr.date; commit(); },
    removeTrip(id) { state.trips = state.trips.filter(x => x.id !== id); fixActive(); this.setActiveTrip(state.activeTripId, true); commit(); },
    setStopMeta(pid, patch) { const tr = this.activeTrip(); if (!tr) return; tr.meta = tr.meta || {}; const m = { ...(tr.meta[pid] || {}), ...patch };
      Object.keys(m).forEach(k => { if (!m[k]) delete m[k]; }); if (Object.keys(m).length) tr.meta[pid] = m; else delete tr.meta[pid]; commit(); },
    // space-wide settings (synced) & per-leg travel mode overrides (synced in the trip)
    get settings() { return { walkMaxKm: 1.2, ...(state.settings || {}) }; },
    setSetting(k, v) { state.settings = { ...(state.settings || {}), [k]: v }; commit(); },
    setLegMode(legKey, mode) { const tr = this.activeTrip(); if (!tr) return; const lm = { ...(tr.legModes || {}) };
      const adj = new Set(tr.stops.slice(1).map((id, i) => tr.stops[i] + '>' + id)); Object.keys(lm).forEach(k => { if (!adj.has(k)) delete lm[k]; }); // prune stale legs
      if (mode) lm[legKey] = mode; else delete lm[legKey]; tr.legModes = lm; commit(); },
    sortStopsByTime() { const tr = this.activeTrip(); if (!tr) return; const tm = id => tr.meta?.[id]?.time || '99:99';
      tr.stops = tr.stops.map((id, i) => [id, i]).sort((a, b) => tm(a[0]).localeCompare(tm(b[0])) || a[1] - b[1]).map(x => x[0]); commit(); },
    reset() { state = empty(); commit(); }
  };
})();

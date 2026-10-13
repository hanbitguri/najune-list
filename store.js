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
      const { places, trips } = state;
      const { error } = await sb.from('spaces').upsert({ id: space, data: { version: 1, places, trips }, client_id: clientId, updated_at: new Date().toISOString() });
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

const Store = (() => {
  let adapter, state = empty(), listeners = [];
  function empty() { return { version: 1, places: [], trips: [], activeTripId: null }; }
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const emit = (remote) => listeners.forEach(f => f(state, remote));
  const commit = () => { adapter.save(state); emit(); };
  const fixActive = () => { if (!state.trips.find(t => t.id === state.activeTripId)) state.activeTripId = state.trips[0]?.id || null; };
  return {
    uid, get adapter() { return adapter; },
    async init(a) {
      adapter = a; const active = localStorage.getItem('najune-active-trip');
      state = { ...empty(), ...((await adapter.load()) || {}) }; state.activeTripId = active; fixActive();
      adapter.subscribe((s, remote) => { const act = state.activeTripId; state = { ...empty(), ...s, activeTripId: act }; fixActive(); emit(remote); });
      emit();
    },
    get: () => state,
    get me() { return localStorage.getItem('najune-me') || ''; },
    on: f => listeners.push(f),
    setMe(n) { localStorage.setItem('najune-me', n); emit(); },   // per-device, not synced
    addPlace(p) { const place = { id: uid(), status: 'wish', heart: false, cost: 0, memo: '', category: 'etc', addedBy: this.me, createdAt: Date.now(), ...p }; state.places.push(place); commit(); return place; },
    updatePlace(id, patch) { Object.assign(state.places.find(p => p.id === id) || {}, patch, { updatedAt: Date.now() }); commit(); },
    removePlace(id) { state.places = state.places.filter(p => p.id !== id); state.trips.forEach(t => t.stops = t.stops.filter(s => s !== id)); commit(); },
    addTrip(name) { const t = { id: uid(), name, stops: [] }; state.trips.push(t); this.setActiveTrip(t.id, true); commit(); return t; },
    setActiveTrip(id, quiet) { state.activeTripId = id; localStorage.setItem('najune-active-trip', id); if (!quiet) emit(); },  // per-device view
    activeTrip() { return state.trips.find(t => t.id === state.activeTripId) || null; },
    addStop(pid) { let tr = this.activeTrip() || this.addTrip(t('firstTrip')); if (!tr.stops.includes(pid)) tr.stops.push(pid);
      const p = state.places.find(x => x.id === pid); if (p && p.status === 'wish') p.status = 'planned'; commit(); },
    removeStop(pid) { const t = this.activeTrip(); if (t) t.stops = t.stops.filter(s => s !== pid); commit(); },
    reorder(from, to) { const t = this.activeTrip(); if (!t) return; const [m] = t.stops.splice(from, 1); t.stops.splice(to, 0, m); commit(); },
    replace(s) { state = { ...empty(), ...s }; fixActive(); if (s.activeTripId) this.setActiveTrip(s.activeTripId, true); commit(); },
    merge(s) {
      const byId = new Map(state.places.map(p => [p.id, p]));
      (s.places || []).forEach(p => { const o = byId.get(p.id); if (!o || (p.updatedAt || 0) > (o.updatedAt || 0)) byId.set(p.id, p); });
      state.places = [...byId.values()];
      const tr = new Map(state.trips.map(t => [t.id, t])); (s.trips || []).forEach(t => tr.set(t.id, t));
      state.trips = [...tr.values()]; fixActive(); commit(); },
    reset() { state = empty(); commit(); }
  };
})();

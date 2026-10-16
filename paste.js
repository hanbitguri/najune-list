/* 📋 paste free-form itinerary text → parsed rows → Kakao Places matches → review → stops */
const ItinParse = (() => {
  const LABEL = '아침|조식|점심|중식|저녁|석식|브런치|간식|디저트|야식|술집|2차|카페|숙소|체크인|체크아웃|산책|야경|쇼핑|관광|구경|숙박|휴식|숙박지|朝食|朝ごはん|昼食|昼ごはん|ランチ|夕食|夜ごはん|ディナー|カフェ|ホテル|観光|散歩|ショッピング|おやつ|チェックイン|チェックアウト';
  const reLabelSep = new RegExp(`^(${LABEL})(?:은|는|엔|으로|은요)?\\s*(?:[-–—:|：>]|\\s)\\s*(.+)$`, 'i');
  const reLabelTail = new RegExp(`\\s+(${LABEL.replace('카페|', '')})(?:\\s*(?:하기|먹기|타임))?$`, 'i');
  const reLabelOnly = new RegExp(`^(${LABEL})$`, 'i');
  const FILL = /\s*(?:에\s*가기|에\s*가서|으로|에서|에|가기|가서|가고|가자|먹기|먹고|먹자|마시기|구경하기|구경하고|구경|보기|보고|들르기|들러서|들러|방문하기|방문|도착|출발|이동|귀가|투어|산책하기|산책|타기|하기|へ行く|に行く|へ|に行き|で食事|観光|散策|訪問|到着)$/;
  const MOVE = /^(?:이동|지하철|버스|택시|도보|걸어서|자차|렌트카|ktx|srt|기차|비행기|귀가|집으로|집|휴식|자유\s*시간|각자|移動|電車|地下鉄|バス|タクシー|徒歩|帰宅|休憩|自由時間)(?:로|으로|타고|で)?(?:\s+|$)/i;
  const TITLE = /(?:코스|데이트|여행|일정|투어|\d\s*박|당일치기|요일|plan|旅行|プラン|デート|コース)/i;
  const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\uFE0F\u200D\u20E3]/gu;
  const DAY = /^[\[\(【<#\s]*(?:(\d{1,2})\s*일\s*차|day\s*(\d{1,2})|(\d{1,2})\s*日目|第\s*(\d{1,2})\s*日|(첫|둘|셋|넷|다섯)\s*째\s*날|(\d{1,2})\s*일\s*째)\s*[\]\)】>]*\s*[:.\-–—]?\s*(.*)$/i;
  const KN = { 첫: 1, 둘: 2, 셋: 3, 넷: 4, 다섯: 5 };
  const PM = /^(?:오후|낮|밤|저녁|午後|夜|夕方|pm|p\.m\.)$/i, AM = /^(?:오전|아침|새벽|午前|am|a\.m\.)$/i;
  const T1 = /(오전|오후|낮|밤|저녁|아침|새벽|午前|午後|夜|夕方|朝|am|pm)?\s*(\d{1,2})\s*[:：]\s*(\d{2})\s*(am|pm)?/i;
  const T2 = /(오전|오후|낮|밤|저녁|아침|새벽|午前|午後|夜|夕方|朝)?\s*(\d{1,2})\s*(?:시|時)\s*(?:(반|半)|(\d{1,2})\s*(?:분|分))?/;
  const RANGE = /^\s*(?:~|〜|-|–|부터)\s*(?:(?:오전|오후)?\s*\d{1,2}\s*(?:[:：]\s*\d{2}|(?:시|時)(?:\s*(?:반|半|\d{1,2}\s*(?:분|分)))?))?\s*(?:까지)?/;
  const pad = n => String(n).padStart(2, '0');
  function takeTime(s) {
    let m = s.match(T1), h, mi, mark;
    if (m) { h = +m[2]; mi = +m[3]; mark = m[1] || m[4]; }
    else if ((m = s.match(T2))) { h = +m[2]; mi = m[3] ? 30 : m[4] ? +m[4] : 0; mark = m[1]; }
    if (!m || h > 24 || mi > 59) return [null, s];
    if (mark && PM.test(mark) && h < 12) h += 12; else if (mark && AM.test(mark) && h === 12) h = 0;
    else if (!mark && h >= 1 && h <= 6 && !/^0/.test(m[2])) h += 12;            // "1시 점심" → 13:00
    else if (!mark && h >= 7 && h <= 11 && /저녁|석식|야경|야식|밤|夕食|ディナー|夜/.test(s)) h += 12;   // "7시 저녁"
    let rest = s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length).replace(RANGE, ' ');
    return [pad(h % 24) + ':' + pad(mi), rest];
  }
  const clean = s => s.replace(/[“”"'`~!?.,·…]+/g, ' ').replace(/\s+/g, ' ').trim();
  function parseLine(raw) {
    let s = raw.replace(EMOJI, ' ').replace(/^\s*(?:[-–—•·∙◦▪■□●○◆◇✓✔☑]|\d{1,2}[.)](?![\d])|[①-⑳]|[가-하][.)]\s)\s*/, '');
    const notes = []; let time; [time, s] = takeTime(s);
    s = s.replace(/[(\[（【]([^)\]）】]*)[)\]）】]/g, (_, x) => { if (x.trim()) notes.push(x.trim()); return ' '; });
    s = clean(s.replace(/^[:：\-–—|>\s]+/, ''));
    let m;
    if ((m = s.match(reLabelSep))) { notes.unshift(m[1]); s = m[2]; }
    else if ((m = s.match(/^(.{2,30}?)\s+[-–—:|：]\s+(.+)$/))) { s = m[1]; notes.push(m[2]); }
    if ((m = s.match(/^(.+?)(?:에서|で)\s+(.+)$/))) { s = m[1]; notes.push(m[2]); }
    if ((m = s.match(/^(.+?)\s*(?:도착\s*후|도착해서|도착하면|들렀다가|후에?|하고|して)\s+(.+)$/))) { s = m[1]; notes.push(m[2]); }
    s = s.replace(/\s+(?:ktx|srt|itx|기차|버스|지하철|택시)$/i, '');
    if ((m = s.match(reLabelTail))) { notes.unshift(m[1]); s = s.slice(0, m.index); }
    for (let i = 0; i < 3; i++) { const n = s.replace(FILL, '').trim(); if (n === s) break; s = n; }
    s = s.replace(MOVE, '').replace(/[-–—:|：>]+$/, '').trim();
    if (reLabelOnly.test(s)) { notes.unshift(s); s = ''; }
    return { time, query: s.length >= 2 && /[\p{L}\d]/u.test(s) ? s : '', note: [...new Set(notes)].join(' · ').slice(0, 60) };
  }
  function parse(text) {
    const lines = text.replace(/\r/g, '').replace(/[：]/g, ':')
      .replace(/\s*(?:→|->|=>|⇒|➡|➔|⟶|▶|▷|》)\s*/g, '\n').split('\n');
    const days = []; let day = null, title = ''; const cur = () => day || (day = { n: 1, title: '', rows: [] }, days.push(day), day);
    lines.forEach(line => {
      const raw = line.trim(); if (!raw) return;
      const d = raw.replace(EMOJI, ' ').trim().match(DAY);
      if (d) { const n = +(d[1] || d[2] || d[3] || d[4] || d[6]) || KN[d[5]] || days.length + 1;
        if (day && !day.rows.length && !days.find(x => x !== day && x.n === n)) { day.n = n; day.title = clean(d[7] || ''); }
        else { day = { n, title: clean(d[7] || ''), rows: [] }; days.push(day); } return; }
      if (/^\s*(?:ㄴ|└|※|\*|\+|>>?)\s*/.test(raw) && cur().rows.length) {         // continuation → note of previous row
        const p = day.rows.at(-1); const x = clean(raw.replace(/^\s*(?:ㄴ|└|※|\*|\+|>>?)\s*/, '').replace(EMOJI, ''));
        if (x) p.note = [p.note, x].filter(Boolean).join(' · ').slice(0, 60); return; }
      const r = parseLine(raw);
      if (!r.query) return;
      if (!r.time && TITLE.test(raw) && !(day && day.rows.length) && !days.some(x => x.rows.length)) { if (day) day.title = day.title || clean(raw.replace(EMOJI, ' ')); else title = title || clean(raw.replace(EMOJI, ' ')); return; }
      cur().rows.push({ raw, ...r });
    });
    const out = days.filter(d => d.rows.length); out.title = title; return out;
  }
  // pick/rerank Kakao results: keep accuracy order, but penalize far-away hits once we know where we are
  function rank(res, near) {
    if (!near) return res;
    return res.map((r, i) => ({ r, s: i + Math.min(r.dist ?? 0, 60000) / 6000 })).sort((a, b) => a.s - b.s).map(x => x.r);
  }
  return { parse, parseLine, rank };
})();

(() => {
  const $ = s => document.querySelector(s);
  const M = $('#pasteModal'); if (!M) return;
  let days = [], busy = false;
  const open = () => { M.classList.add('show'); step(1); setTimeout(() => $('#pasteText').focus(), 350); };
  const close = () => { M.classList.remove('show'); $('#pasteText').blur(); };
  const step = n => { M.dataset.step = n; };
  $('#pasteBtn').onclick = open; $('#pasteCancel').onclick = close; $('#pasteClose').onclick = close;
  M.onclick = e => { if (e.target === M) close(); };
  $('#pasteBack').onclick = () => step(1);
  const dkm = (a, b) => { const R = 6371, r = x => x * Math.PI / 180, dl = r(b.lat - a.lat), dg = r(b.lng - a.lng);
    return 2 * R * Math.asin(Math.sqrt(Math.sin(dl / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dg / 2) ** 2)); };
  async function find(q, near) {
    const words = q.split(' '); const tries = [q];
    if (words.length > 1) { tries.push(words.slice(0, -1).join(' ')); tries.push(words[0]); }
    for (const x of [...new Set(tries)].filter(x => x.length >= 2)) {
      try { const r = await MapView.search(x, near); if (r.length) return ItinParse.rank(r, near).slice(0, 5); } catch {}
    }
    return [];
  }
  const existing = c => Store.get().places.find(p => (c.kakaoId && p.kakaoId === c.kakaoId) || (p.name === c.name && p.lat && dkm(p, c) < 0.06));
  $('#pasteGo').onclick = async () => {
    if (busy) return; days = ItinParse.parse($('#pasteText').value);
    const total = days.reduce((a, d) => a + d.rows.length, 0);
    if (!total) return toast(t('pasteEmpty'));
    busy = true; const btn = $('#pasteGo'); btn.classList.add('busy'); let k = 0, near = null;
    for (const d of days) for (const r of d.rows) {
      btn.textContent = t('pasteFinding', { n: ++k, m: total });
      r.cands = await find(r.query, near); r.pick = 0; r.skip = !r.cands.length;
      if (r.cands[0]) near = { lat: r.cands[0].lat, lng: r.cands[0].lng };
    }
    busy = false; btn.classList.remove('busy'); btn.textContent = t('pasteAnalyze');
    review(); step(2);
  };
  function rowHtml(r, di, ri) {
    const c = r.cands[r.pick], ex = c && existing(c);
    return `<li class="prow ${r.skip ? 'skip' : ''} ${c ? '' : 'none'}" data-d="${di}" data-r="${ri}" style="--i:${ri}">
      <input class="ptime" type="time" value="${r.time || ''}" aria-label="${t('time')}">
      <div class="pbody">
        <small class="praw">${esc(r.raw)}</small>
        ${c ? `<div class="pmatch"><b>${cat(c.category).emoji} ${esc(c.name)}</b>${ex ? `<em>${t('pasteExisting')}</em>` : ''}<small>${esc(c.address || '')}${c.sub ? ' · ' + esc(c.sub.split(' > ').at(-1)) : ''}</small></div>`
              : `<div class="pmatch miss">${t('pasteNoMatch')}</div>`}
        <div class="pctl">
          ${r.cands.length > 1 ? `<label class="psel">${t('pasteOthers')}<select>${r.cands.map((x, i) => `<option value="${i}" ${i === r.pick ? 'selected' : ''}>${esc(x.name)} · ${esc((x.address || '').split(' ').slice(0, 3).join(' '))}</option>`).join('')}</select></label>` : ''}
          <input class="pq" value="${esc(r.query)}" aria-label="${t('pasteQuery')}" enterkeyhint="search">
          ${r.note ? `<span class="pnote">📝 ${esc(r.note)}</span>` : ''}
        </div>
      </div>
      <button type="button" class="ptoggle" aria-pressed="${!r.skip}" ${c ? '' : 'disabled'} aria-label="${t('pasteSkip')}">${r.skip ? '' : '✓'}</button>
    </li>`;
  }
  function review() {
    const multi = days.length > 1, s = Store.get();
    $('#pasteList').innerHTML = days.map((d, di) => `${multi ? `<li class="pday">${esc(t('dayN', { n: d.n }))}${d.title ? ` · ${esc(d.title)}` : ''}</li>` : ''}${d.rows.map((r, ri) => rowHtml(r, di, ri)).join('')}`).join('');
    const sel = $('#pasteTarget');
    sel.innerHTML = multi ? `<option value="__days">${esc(t('pastePerDay', { n: days.length }))}</option>`
      : `<option value="__new">${esc(t('pasteNewTrip'))}</option>` + s.trips.map(tr => `<option value="${tr.id}">${esc(tr.name)}</option>`).join('');
    $('#pasteName').value = (multi ? days.title : days.title || days[0].title) || t('pasteDefault');
    $('#pasteNameWrap').style.display = '';
    sel.onchange = () => { $('#pasteNameWrap').style.display = sel.value.startsWith('__') ? '' : 'none'; };
    count();
  }
  function count() { const n = days.reduce((a, d) => a + d.rows.filter(r => !r.skip && r.cands[r.pick]).length, 0);
    $('#pasteAdd').textContent = t('pasteAddN', { n }); $('#pasteAdd').disabled = !n; }
  const rowOf = el => { const li = el.closest('.prow'); return li && [li, days[li.dataset.d].rows[li.dataset.r]]; };
  const repaint = (li, r) => { const tmp = document.createElement('template'); tmp.innerHTML = rowHtml(r, li.dataset.d, li.dataset.r).trim();
    const n = tmp.content.firstElementChild; n.classList.add('swap'); n.style.animation = 'none'; li.replaceWith(n); count(); };
  $('#pasteList').addEventListener('click', e => { const b = e.target.closest('.ptoggle'); if (!b) return; const [li, r] = rowOf(b);
    if (!r.cands[r.pick]) return; r.skip = !r.skip; li.classList.toggle('skip', r.skip); b.setAttribute('aria-pressed', !r.skip); b.textContent = r.skip ? '' : '✓'; count(); });
  $('#pasteList').addEventListener('change', async e => { const x = rowOf(e.target); if (!x) return; const [li, r] = x;
    if (e.target.matches('select')) { r.pick = +e.target.value; r.skip = false; repaint(li, r); }
    else if (e.target.matches('.ptime')) r.time = e.target.value;
    else if (e.target.matches('.pq')) { const q = e.target.value.trim(); if (q.length < 2) return; r.query = q; li.classList.add('loading');
      const prev = days.flatMap(d => d.rows).slice(0, days.flatMap(d => d.rows).indexOf(r)).reverse().find(y => y.cands?.[y.pick]);
      r.cands = await find(q, prev ? prev.cands[prev.pick] : null); r.pick = 0; r.skip = !r.cands.length; repaint(li, r); } });
  $('#pasteList').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('.pq')) { e.preventDefault(); e.target.blur(); } });
  $('#pasteAdd').onclick = () => {
    const target = $('#pasteTarget').value, base = $('#pasteName').value.trim() || t('pasteDefault'), multi = days.length > 1;
    let added = 0, firstTrip = null; const keepActive = Store.get().activeTripId;
    days.forEach(d => {
      const rows = d.rows.filter(r => !r.skip && r.cands[r.pick]); if (!rows.length) return;
      let tr = target.startsWith('__') ? null : Store.get().trips.find(x => x.id === target);
      if (!tr) tr = Store.addTrip((multi ? `${base} ${t('dayN', { n: d.n })}` : base) + (multi && d.title ? ` · ${d.title}` : ''));
      firstTrip = firstTrip || tr; Store.setActiveTrip(tr.id, true);
      rows.forEach(r => { const c = r.cands[r.pick];
        const p = existing(c) || Store.addPlace({ name: c.name, lat: c.lat, lng: c.lng, category: CATS[c.category] ? c.category : 'etc', address: c.address, kakaoId: c.kakaoId, status: 'planned' });
        const had = tr.stops.includes(p.id); Store.addStop(p.id);
        if (!had) { Store.setStopMeta(p.id, { time: r.time || '', note: r.note || '' }); added++; } });
    });
    if (firstTrip) Store.setActiveTrip(firstTrip.id); else if (keepActive) Store.setActiveTrip(keepActive);
    close(); $('#pasteText').value = ''; toast(t('pasteDone', { n: added }));
    document.querySelector('.tab[data-tab="trips"]')?.click();
  };
  window.__paste = { parse: ItinParse.parse, get days() { return days; } };
})();

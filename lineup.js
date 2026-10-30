/* 채널 라인업 화면
   window.renderLineup(root, data)
   data = { plats:[{name,kind,vsb,src,basis,date,prods}], chans:[{n,g,corp,c:{platIdx:[no,tier]}}], me:[channel names] } */
(function () {
  const GC = { '종교': '#7c3aed', '영화': '#dc2626', '해외드라마': '#db2777', '국내드라마': '#ea580c', '음악': '#c026d3', '스포츠': '#16a34a', '시사·경제': '#0891b2', '교양·생활정보': '#0d9488', '예능·오락': '#d97706', '취미·레저': '#65a30d', '어린이·교육': '#2563eb', '기타': '#64748b', '홈쇼핑': '#a16207', '지상파·종편·보도': '#334155', '유료채널': '#9333ea', '평가 외·해외': '#94a3b8' };
  const GORDER = ['지상파·종편·보도', '홈쇼핑', '국내드라마', '해외드라마', '예능·오락', '영화', '스포츠', '시사·경제', '교양·생활정보', '어린이·교육', '취미·레저', '음악', '종교', '기타', '유료채널', '평가 외·해외'];
  const ME = /JEI|재능/;
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const CSS = `
  .lu { display: flex; flex-direction: column; gap: 1.4em; }
  .lu-h { display: flex; flex-direction: column; gap: .2em; }
  .lu-h h2 { margin: 0; font-size: 1.3em; font-weight: 800; padding-left: .7em; border-left: 6px solid var(--lu-accent); }
  .lu-h span { color: var(--lu-muted); font-size: .95em; }
  .lu-me { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 22em), 1fr)); gap: .8em; }
  .lu-mecard { background: linear-gradient(135deg, color-mix(in srgb, var(--lu-accent) 12%, var(--lu-card)), var(--lu-card) 70%); border: 1.5px solid color-mix(in srgb, var(--lu-accent) 35%, var(--lu-line)); border-radius: 18px; padding: 1.1em 1.2em; display: flex; flex-direction: column; gap: .7em; }
  .lu-mecard h3 { margin: 0; font-size: 1.2em; font-weight: 800; display: flex; align-items: center; gap: .5em; }
  .lu-nums { display: grid; grid-template-columns: repeat(auto-fill, minmax(6.6em, 1fr)); gap: .45em; }
  .lu-num { background: var(--lu-card); border: 1.5px solid var(--lu-line); border-radius: 12px; padding: .45em .6em; display: flex; flex-direction: column; }
  .lu-num small { font-size: .74em; font-weight: 700; color: var(--lu-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lu-num b { font-size: 1.35em; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1.15; }
  .lu-num.na b { color: var(--lu-muted); font-size: 1em; }
  .lu-seg { display: flex; flex-wrap: wrap; gap: .5em; }
  .lu-seg button { font: inherit; font-weight: 800; min-height: 46px; padding: 0 1.15em; border-radius: 999px; border: 2px solid var(--lu-line); background: var(--lu-card); color: var(--lu-ink); cursor: pointer; }
  .lu-seg button[aria-pressed="true"] { background: var(--lu-accent); border-color: var(--lu-accent); color: #fff; box-shadow: 0 3px 10px color-mix(in srgb, var(--lu-accent) 30%, transparent); }
  .lu-ctl { display: flex; flex-wrap: wrap; gap: .6em; align-items: center; }
  .lu-ctl input, .lu-ctl select { font: inherit; min-height: 48px; padding: 0 1em; border-radius: 12px; border: 2px solid var(--lu-line); background: var(--lu-card); color: var(--lu-ink); min-width: 0; }
  .lu-ctl input { flex: 1 1 14em; } .lu-ctl select { flex: 0 1 auto; font-weight: 700; }
  .lu-g { display: flex; flex-wrap: wrap; gap: .4em; }
  .lu-g button { font: inherit; font-size: .9em; font-weight: 800; min-height: 38px; padding: 0 .85em; border-radius: 999px; cursor: pointer; color: var(--gc); background: color-mix(in srgb, var(--gc) 10%, var(--lu-card)); border: 1.5px solid color-mix(in srgb, var(--gc) 40%, transparent); }
  .lu-g button[aria-pressed="true"] { background: var(--gc); color: #fff; border-color: var(--gc); }
  .lu-g button small { opacity: .75; margin-left: .3em; font-weight: 700; }
  .lu-wrap { overflow: auto; max-height: 75vh; border: 1.5px solid var(--lu-line); border-radius: 16px; background: var(--lu-card); }
  .lu-t { border-collapse: separate; border-spacing: 0; width: max-content; min-width: 100%; font-variant-numeric: tabular-nums; }
  .lu-t th, .lu-t td { padding: .55em .7em; border-bottom: 1px solid var(--lu-line); text-align: center; white-space: nowrap; }
  .lu-t thead th { position: sticky; top: 0; z-index: 2; background: var(--lu-card); font-size: .82em; font-weight: 800; color: var(--lu-muted); border-bottom: 2px solid var(--lu-line); vertical-align: bottom; }
  .lu-t thead th .k { display: block; font-size: .85em; font-weight: 700; opacity: .8; }
  .lu-t th.ch, .lu-t td.ch { position: sticky; left: 0; z-index: 1; background: var(--lu-card); text-align: left; min-width: 11em; max-width: 15em; white-space: normal; border-right: 1.5px solid var(--lu-line); }
  .lu-t thead th.ch { z-index: 3; }
  .lu-t td.ch { font-weight: 800; border-left: 5px solid var(--gc); }
  .lu-t td.ch small { display: block; font-weight: 600; font-size: .78em; color: var(--lu-muted); }
  .lu-t tr.me td { background: color-mix(in srgb, var(--lu-accent) 9%, var(--lu-card)); }
  .lu-t tr.me td.ch { background: color-mix(in srgb, var(--lu-accent) 14%, var(--lu-card)); }
  .lu-t td.no { font-weight: 800; }
  .lu-t td.no.t1 { color: #2563eb; } .lu-t td.no.t2 { color: #7c3aed; } .lu-t td.no.t3 { color: #db2777; }
  .lu-t td.na { color: color-mix(in srgb, var(--lu-muted) 55%, transparent); }
  .lu-t tbody tr:hover td { background: color-mix(in srgb, var(--lu-ink) 4%, var(--lu-card)); }
  .lu-t th.lu-gl, .lu-t td.lu-gl { border-left: 2px solid var(--lu-line); }
  .lu-leg { display: flex; flex-wrap: wrap; gap: .3em 1em; font-size: .85em; color: var(--lu-muted); }
  .lu-leg b { font-weight: 800; }
  .lu-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 15em), 1fr)); gap: .45em; }
  .lu-item { display: grid; grid-template-columns: 3.4em minmax(0, 1fr); gap: .5em; align-items: center; background: var(--lu-card); border: 1.5px solid var(--lu-line); border-left: 5px solid var(--gc); border-radius: 10px; padding: .45em .6em; }
  .lu-item b { font-size: 1.15em; font-weight: 800; text-align: right; font-variant-numeric: tabular-nums; }
  .lu-item span { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .lu-item small { grid-column: 2; font-size: .75em; color: var(--lu-muted); margin-top: -.3em; }
  .lu-item.me { background: color-mix(in srgb, var(--lu-accent) 12%, var(--lu-card)); border-color: var(--lu-accent); }
  .lu-src { background: var(--lu-card); border: 1.5px solid var(--lu-line); border-radius: 14px; padding: .9em 1.1em; display: flex; flex-wrap: wrap; gap: .4em 1.4em; font-size: .9em; }
  .lu-src b { font-weight: 800; }
  .lu-note { margin: 0; font-size: .88em; color: var(--lu-muted); line-height: 1.6; }
  .lu-sub { margin: .3em 0 0; font-size: 1.05em; font-weight: 800; display: flex; align-items: center; gap: .5em; }
  .lu-sub::before { content: ''; width: .7em; height: .7em; border-radius: 3px; background: var(--gc); }
  @media (max-width: 720px) {
    .lu-seg button { min-height: 40px; padding: 0 .9em; }
    .lu-ctl input, .lu-ctl select { min-height: 44px; flex: 1 1 100%; }
    .lu-t th, .lu-t td { padding: .45em .5em; }
    .lu-t th.ch, .lu-t td.ch { min-width: 8.5em; }
    .lu-wrap { max-height: 70vh; }
  }`;
  function addStyle() { if (document.getElementById('lu-style')) return; const s = el('style'); s.id = 'lu-style'; s.textContent = CSS; document.head.appendChild(s); }
  const pname = (p) => p.name + (p.vsb ? ' 8VSB' : '');
  const kindOrder = { 'IPTV': 0, '위성': 1, 'SO': 2 };

  function meCards(D) {
    const box = el('div', 'lu-me');
    D.chans.filter((c) => ME.test(c.n) && Object.keys(c.c).length > 2).forEach((c) => {
      const card = el('div', 'lu-mecard');
      const h = el('h3', '', '⭐ ' + c.n); card.append(h);
      const nums = el('div', 'lu-nums');
      D.plats.forEach((p, i) => { const v = c.c[i]; const n = el('div', 'lu-num' + (v ? '' : ' na')); n.append(el('small', '', pname(p)), el('b', '', v ? v[0] + '번' : '목록에 없음')); nums.append(n); });
      card.append(nums); box.append(card);
    });
    return box;
  }

  function matrix(D, state, rerender) {
    const box = el('div', 'lu');
    const ctl = el('div', 'lu-ctl');
    const inp = el('input'); inp.type = 'search'; inp.placeholder = '채널 이름으로 찾기 (예: 투니버스, tvN, 재능)'; inp.value = state.q; inp.setAttribute('aria-label', '채널 검색');
    inp.addEventListener('input', () => { clearTimeout(state.t); state.t = setTimeout(() => { state.q = inp.value.trim(); rerender(); }, 300); });
    const kind = el('select'); kind.setAttribute('aria-label', '플랫폼 구분');
    [['', '전체 플랫폼'], ['IPTV', 'IPTV'], ['위성', '위성'], ['SO', '케이블(SO) 디지털'], ['8VSB', '케이블 8VSB']].forEach(([k, l]) => kind.append(new Option(l, k))); kind.value = state.k;
    kind.addEventListener('change', () => { state.k = kind.value; rerender(); });
    const sort = el('select'); sort.setAttribute('aria-label', '정렬');
    [['g', '정렬: 장르별'], ['n', '정렬: 이름순'], ['cnt', '정렬: 편성 플랫폼 많은 순']].concat(D.plats.map((p, i) => ['p' + i, '정렬: ' + pname(p) + ' 번호순'])).forEach(([k, l]) => sort.append(new Option(l, k))); sort.value = state.s;
    sort.addEventListener('change', () => { state.s = sort.value; rerender(); });
    ctl.append(inp, kind, sort); box.append(ctl);
    // 장르
    const gb = el('div', 'lu-g');
    const counts = {}; D.chans.forEach((c) => { counts[c.g] = (counts[c.g] || 0) + 1; });
    const mk = (g, l, n) => { const b = el('button'); b.type = 'button'; b.style.setProperty('--gc', GC[g] || '#334155'); b.setAttribute('aria-pressed', String(state.g === g)); b.append(l); if (n != null) b.append(el('small', '', n)); b.addEventListener('click', () => { state.g = state.g === g ? '' : g; rerender(); }); gb.append(b); };
    mk('', '전체 장르', D.chans.length);
    GORDER.forEach((g) => { if (counts[g]) mk(g, g, counts[g]); });
    box.append(gb);
    // 열
    const cols = D.plats.map((p, i) => ({ p, i })).filter(({ p }) => !state.k || (state.k === '8VSB' ? p.vsb : (!p.vsb && p.kind === state.k))).sort((a, b) => kindOrder[a.p.kind] - kindOrder[b.p.kind] || (a.p.vsb || 0) - (b.p.vsb || 0));
    const q = state.q.toLowerCase();
    let rows = D.chans.filter((c) => (!state.g || c.g === state.g) && (!q || (c.n + ' ' + (c.corp || '') + ' ' + (c.al || '')).toLowerCase().includes(q)) && cols.some(({ i }) => c.c[i]));
    const numv = (v) => { if (!v) return 1e9; const m = String(v[0]).match(/^(\d+)(?:-(\d+))?/); return m ? +m[1] + (m[2] ? +m[2] / 100 : 0) : 1e9; };
    if (state.s === 'n') rows.sort((a, b) => a.n.localeCompare(b.n, 'ko'));
    else if (state.s === 'cnt') rows.sort((a, b) => Object.keys(b.c).length - Object.keys(a.c).length || a.n.localeCompare(b.n, 'ko'));
    else if (state.s[0] === 'p') { const pi = +state.s.slice(1); rows.sort((a, b) => numv(a.c[pi]) - numv(b.c[pi])); }
    else rows.sort((a, b) => GORDER.indexOf(a.g) - GORDER.indexOf(b.g) || Object.keys(b.c).length - Object.keys(a.c).length || a.n.localeCompare(b.n, 'ko'));
    box.append(el('p', 'lu-note', `채널 ${rows.length}개 · 플랫폼 ${cols.length}곳` + (state.g ? ' · ' + state.g : '')));
    const wrap = el('div', 'lu-wrap'); const t = el('table', 'lu-t');
    const hr = el('tr'); const th0 = el('th', 'ch', '채널'); hr.append(th0);
    let lastKind = '';
    cols.forEach(({ p }) => { const k = p.vsb ? '8VSB' : p.kind; const th = el('th', k !== lastKind ? 'lu-gl' : ''); th.append(el('span', 'k', k), document.createTextNode(p.name)); hr.append(th); lastKind = k; });
    const thd = el('thead'); thd.append(hr); t.append(thd);
    const tb = el('tbody');
    rows.slice(0, state.lim).forEach((c) => {
      const tr = el('tr', ME.test(c.n) ? 'me' : '');
      const td0 = el('td', 'ch'); td0.style.setProperty('--gc', GC[c.g] || '#94a3b8'); td0.append(c.n, el('small', '', c.g + (c.corp ? ' · ' + c.corp : ''))); tr.append(td0);
      lastKind = '';
      cols.forEach(({ p, i }) => { const v = c.c[i]; const k = p.vsb ? '8VSB' : p.kind; const td = el('td', (v ? 'no' + (v[1] > 0 ? ' t' + Math.min(3, v[1]) : '') : 'na') + (k !== lastKind ? ' lu-gl' : ''), v ? v[0] : '—'); if (v && p.prods && p.prods[v[1]]) td.title = p.prods[v[1]] + '부터'; tr.append(td); lastKind = k; });
      tb.append(tr);
    });
    t.append(tb); wrap.append(t); box.append(wrap);
    if (rows.length > state.lim) { const more = el('button', '', `더 보기 (${rows.length - state.lim}개 더)`); more.type = 'button'; more.className = 'lu-more'; more.style.cssText = 'font:inherit;font-weight:800;min-height:46px;border-radius:12px;border:2px solid var(--lu-line);background:var(--lu-card);color:var(--lu-ink);cursor:pointer'; more.addEventListener('click', () => { state.lim += 120; rerender(); }); box.append(more); }
    const leg = el('div', 'lu-leg'); leg.append(el('span', '', '숫자 = 채널번호 · — = 해당 자료에 없음 · 색 = 상위 상품에서만 제공'), el('b', '', ''));
    [['#2563eb', '2단계 상품'], ['#7c3aed', '3단계 상품'], ['#db2777', '4단계 이상']].forEach(([c, l]) => { const s = el('span', '', '■ ' + l); s.style.color = c; leg.append(s); });
    box.append(leg);
    return box;
  }

  function byPlat(D, state, rerender) {
    const box = el('div', 'lu');
    const ctl = el('div', 'lu-ctl'); const sel = el('select'); sel.setAttribute('aria-label', '플랫폼');
    D.plats.forEach((p, i) => sel.append(new Option(pname(p) + ' (' + p.kind + ')', String(i)))); sel.value = String(state.p);
    sel.addEventListener('change', () => { state.p = +sel.value; rerender(); }); ctl.append(sel); box.append(ctl);
    const p = D.plats[state.p], pi = state.p;
    const src = el('div', 'lu-src'); src.append(el('span', '', '자료: '), el('b', '', p.src), el('span', '', '기준: ' + p.basis), el('span', '', '확인일: ' + p.date)); box.append(src);
    if (p.prods && p.prods.length) { const leg = el('div', 'lu-leg'); leg.append(el('b', '', '상품 단계: ')); p.prods.forEach((x, k) => leg.append(el('span', '', (k + 1) + '. ' + x))); box.append(leg); }
    const list = D.chans.filter((c) => c.c[pi] && (!state.g || c.g === state.g)).map((c) => ({ c, v: c.c[pi] }));
    const numv = (v) => { const m = String(v[0]).match(/^(\d+)(?:-(\d+))?/); return m ? +m[1] + (m[2] ? +m[2] / 100 : 0) : 1e9; };
    list.sort((a, b) => numv(a.v) - numv(b.v));
    const groups = state.pg ? GORDER.filter((g) => list.some((x) => x.c.g === g)) : [null];
    const tg = el('div', 'lu-seg'); [[0, '번호순'], [1, '장르별로 묶기']].forEach(([k, l]) => { const b = el('button', '', l); b.type = 'button'; b.setAttribute('aria-pressed', String(state.pg === k)); b.addEventListener('click', () => { state.pg = k; rerender(); }); tg.append(b); }); box.append(tg);
    box.append(el('p', 'lu-note', `편성 채널 ${list.length}개`));
    groups.forEach((g) => {
      const items = list.filter((x) => !g || x.c.g === g);
      if (g) { const h = el('h4', 'lu-sub', g + ' · ' + items.length); h.style.setProperty('--gc', GC[g]); box.append(h); }
      const grid = el('div', 'lu-list');
      items.forEach(({ c, v }) => { const it = el('div', 'lu-item' + (ME.test(c.n) ? ' me' : '')); it.style.setProperty('--gc', GC[c.g] || '#94a3b8'); it.append(el('b', '', v[0]), el('span', '', c.n)); const sm = [c.g]; if (p.prods && p.prods[v[1]] && v[1] > 0) sm.push(p.prods[v[1]] + '부터'); it.append(el('small', '', sm.join(' · '))); grid.append(it); });
      box.append(grid);
    });
    return box;
  }

  window.renderLineup = function (root, D) {
    addStyle();
    const state = root.__lu || (root.__lu = { v: 'mx', q: '', k: '', s: 'g', g: '', lim: 120, p: 0, pg: 0 });
    const rerender = () => window.renderLineup(root, D);
    const wrap = el('div', 'lu');
    wrap.append(meCards(D));
    const seg = el('div', 'lu-seg');
    [['mx', '채널 × 플랫폼 비교'], ['pl', '플랫폼별 라인업']].forEach(([k, l]) => { const b = el('button', '', l); b.type = 'button'; b.setAttribute('aria-pressed', String(state.v === k)); b.addEventListener('click', () => { state.v = k; rerender(); }); seg.append(b); });
    wrap.append(seg);
    wrap.append(state.v === 'mx' ? matrix(D, state, rerender) : byPlat(D, state, rerender));
    const notes = el('div', 'lu-src'); notes.append(el('b', '', '자료 출처'));
    D.plats.forEach((p) => notes.append(el('span', '', pname(p) + ': ' + p.src + ' (' + p.basis + ', ' + p.date + ')')));
    wrap.append(notes, el('p', 'lu-note', 'SO는 방송구역마다 채널번호가 다를 수 있어 표시한 구역 기준입니다. 장르는 2024 채널평가 채널군 분류(플랫폼 다수 기준)이며, 평가 대상이 아닌 지상파·종편·보도·홈쇼핑·공공채널은 별도로 묶었습니다.'));
    root.replaceChildren(wrap);
  };
})();

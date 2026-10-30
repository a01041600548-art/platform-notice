/* 방송사업자 재산상황 화면 (2025년도 방송사업자 재산상황 공표집 기준)
   window.renderFinance(root, data) — root: 빈 요소, data: [{id,name,full,media,group,sub,size,y:{'2025':{...},'2024':{...}}}] (단위 백만원) */
(function () {
  const Y = '2025', P = '2024';
  const MEDIA = ['IPTV', 'SO', '위성방송', 'PP', '지상파', 'CP'];
  const PLAT = ['IPTV', 'SO', '위성방송'];
  const ME = '재능방송';
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const v = (c, y, k) => (c.y[y] && c.y[y][k]) || 0;
  const eok = (m) => m / 100; // 백만원 → 억원
  const money = (m) => {
    if (m == null || isNaN(m)) return '—';
    const e = eok(m), a = Math.abs(e), s = e < 0 ? '-' : '';
    if (a >= 10000) return s + (a / 10000).toFixed(a >= 100000 ? 1 : 2).replace(/\.?0+$/, '') + '조';
    if (a >= 100) return s + Math.round(a).toLocaleString('ko-KR') + '억';
    if (a >= 1) return s + a.toFixed(1).replace(/\.0$/, '') + '억';
    return s + Math.round(Math.abs(m)).toLocaleString('ko-KR') + '백만';
  };
  const pct = (a, b) => (b ? a / b * 100 : null);
  const chg = (cur, prev) => {
    const s = el('span', 'fx-chg');
    if (!prev || !cur) { s.textContent = ''; return s; }
    const p = (cur - prev) / Math.abs(prev) * 100;
    s.textContent = (p > 0 ? '▲' : p < 0 ? '▼' : '') + Math.abs(p).toFixed(1) + '%';
    s.classList.add(p > 0 ? 'up' : p < 0 ? 'down' : 'flat');
    return s;
  };
  const sum = (rows, y, k) => rows.reduce((t, c) => t + v(c, y, k), 0);

  const CSS = `
  .fx { display: flex; flex-direction: column; gap: 1.6em; }
  .fx-note { margin: 0; font-size: .9em; color: var(--fx-muted); line-height: 1.6; }
  .fx-seg { display: flex; flex-wrap: wrap; gap: .5em; }
  .fx-seg button { font: inherit; font-weight: 800; min-height: 46px; padding: 0 1.2em; border-radius: 999px; border: 2px solid var(--fx-line); background: var(--fx-card); color: var(--fx-ink); cursor: pointer; }
  .fx-seg button[aria-pressed="true"] { background: var(--fx-ink); color: var(--fx-bg); border-color: var(--fx-ink); }
  .fx-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 14em), 1fr)); gap: .8em; }
  .fx-card { background: var(--fx-card); border: 1.5px solid var(--fx-line); border-radius: 16px; padding: 1.1em 1.2em; display: flex; flex-direction: column; gap: .45em; box-shadow: 0 1px 2px rgba(0,0,0,.04); }
  .fx-card h3 { margin: 0; font-size: 1.12em; font-weight: 800; }
  .fx-k { font-size: .9em; font-weight: 700; color: var(--fx-muted); }
  .fx-big { font-size: 1.9em; font-weight: 800; line-height: 1.1; font-variant-numeric: tabular-nums; }
  .fx-row { display: flex; justify-content: space-between; align-items: baseline; gap: .6em; flex-wrap: wrap; }
  .fx-chg { font-size: .85em; font-weight: 800; font-variant-numeric: tabular-nums; }
  .fx-chg.up { color: var(--fx-up); } .fx-chg.down { color: var(--fx-down); } .fx-chg.flat { color: var(--fx-muted); }
  .fx-neg { color: var(--fx-down); }
  .fx-h { display: flex; flex-direction: column; gap: .2em; }
  .fx-h h2 { margin: 0; font-size: 1.3em; font-weight: 800; }
  .fx-h span { color: var(--fx-muted); font-size: .95em; }
  .fx-tablewrap { overflow-x: auto; background: var(--fx-card); border: 1.5px solid var(--fx-line); border-radius: 16px; }
  .fx-table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; min-width: 640px; }
  .fx-table th { text-align: right; font-size: .85em; color: var(--fx-muted); font-weight: 800; padding: .8em .9em; border-bottom: 1.5px solid var(--fx-line); white-space: nowrap; background: var(--fx-card); }
  .fx-table th:first-child, .fx-table td:first-child { text-align: left; }
  .fx-table td { text-align: right; padding: .75em .9em; border-bottom: 1px solid var(--fx-line); white-space: nowrap; }
  .fx-table tr:last-child td { border-bottom: 0; }
  .fx-table td small { display: block; }
  .fx-table tbody tr.me td { background: color-mix(in srgb, var(--fx-accent) 10%, var(--fx-card)); font-weight: 800; }
  .fx-table tbody tr.click { cursor: pointer; } .fx-table tbody tr.click:hover td { background: color-mix(in srgb, var(--fx-ink) 4%, var(--fx-card)); }
  .fx-bars { display: flex; flex-direction: column; gap: .55em; }
  .fx-bar { display: grid; grid-template-columns: 9.5em minmax(0, 1fr) 5.5em; gap: .7em; align-items: center; }
  .fx-bar b { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .fx-bar .track { height: 14px; border-radius: 999px; background: color-mix(in srgb, var(--fx-ink) 8%, transparent); overflow: hidden; }
  .fx-bar .fill { height: 100%; border-radius: 999px; background: var(--fx-c2); }
  .fx-bar.me .fill { background: var(--fx-accent); } .fx-bar.me b { color: var(--fx-accent); }
  .fx-bar span { text-align: right; font-variant-numeric: tabular-nums; font-weight: 700; }
  .fx-insight { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .7em; }
  .fx-insight li { background: var(--fx-card); border: 1.5px solid var(--fx-line); border-left: 5px solid var(--fx-accent); border-radius: 12px; padding: .85em 1em; line-height: 1.6; }
  .fx-search { display: flex; flex-wrap: wrap; gap: .6em; }
  .fx-search input, .fx-search select { font: inherit; min-height: 50px; padding: 0 1em; border-radius: 12px; border: 2px solid var(--fx-line); background: var(--fx-bg); color: var(--fx-ink); min-width: 0; }
  .fx-search input { flex: 1 1 14em; } .fx-search select { flex: 0 1 11em; }
  .fx-detail { background: var(--fx-card); border: 2px solid var(--fx-ink); border-radius: 18px; padding: 1.3em 1.4em; display: flex; flex-direction: column; gap: 1em; }
  .fx-detail header { display: flex; justify-content: space-between; gap: 1em; flex-wrap: wrap; align-items: flex-start; }
  .fx-detail h3 { margin: 0; font-size: 1.45em; font-weight: 800; }
  .fx-tags { display: flex; gap: .4em; flex-wrap: wrap; margin-top: .4em; }
  .fx-tag { font-size: .85em; font-weight: 800; padding: .1em .7em; border-radius: 999px; border: 1.5px solid var(--fx-line); color: var(--fx-muted); }
  .fx-close { font: inherit; font-weight: 800; min-height: 42px; padding: 0 1em; border-radius: 10px; border: 2px solid var(--fx-line); background: var(--fx-bg); color: var(--fx-ink); cursor: pointer; }
  .fx-sub { margin: .2em 0 0; font-size: 1.1em; font-weight: 800; }
  .fx-chs { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 17em), 1fr)); gap: .6em; }
  .fx-ch { border: 1.5px solid var(--fx-line); border-radius: 12px; padding: .75em .9em; display: flex; flex-direction: column; gap: .45em; }
  .fx-ch b { font-size: 1.08em; }
  .fx-pills { display: flex; flex-wrap: wrap; gap: .3em; }
  .fx-pill { font-size: .82em; padding: .15em .55em; border-radius: 999px; border: 1.5px solid var(--fx-line); white-space: nowrap; }
  .fx-pill.on { border-color: var(--fx-ink); font-weight: 700; }
  .fx-pill.off { opacity: .45; text-decoration: line-through; }
  .fx-mix { display: flex; height: 12px; border-radius: 6px; overflow: hidden; background: var(--fx-line); }
  .fx-mix i { display: block; height: 100%; margin: 0; padding: 0; border: 0; min-width: 0; }
  .fx-leg { display: flex; flex-wrap: wrap; gap: .2em .8em; font-size: .82em; color: var(--fx-muted); }
  .fx-leg span::before { content: ''; display: inline-block; width: .7em; height: .7em; border-radius: 2px; margin-right: .3em; background: var(--c); vertical-align: -.05em; }
  .fx-corps { display: flex; flex-direction: column; gap: .7em; }
  .fx-corp { background: var(--fx-card); border: 1.5px solid var(--fx-line); border-radius: 16px; padding: 1em 1.15em; display: flex; flex-direction: column; gap: .6em; cursor: pointer; text-align: left; font: inherit; color: inherit; }
  .fx-corp:hover { border-color: var(--fx-ink); }
  .fx-corp.me { border: 2px solid var(--fx-accent); }
  .fx-corp-top { display: flex; justify-content: space-between; align-items: baseline; gap: .4em 1em; flex-wrap: wrap; }
  .fx-corp-top b { font-size: 1.15em; font-weight: 800; }
  .fx-corp-top .fx-rev { font-weight: 800; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .fx-corp-meta { font-size: .88em; color: var(--fx-muted); }
  .fx-chips { display: flex; flex-wrap: wrap; gap: .4em; }
  .fx-chip { border: 1.5px solid var(--fx-line); border-radius: 10px; padding: .3em .6em; display: inline-flex; flex-direction: column; gap: .05em; background: var(--fx-bg); }
  .fx-chip span { font-weight: 700; font-size: .95em; }
  .fx-chip small { font-size: .76em; color: var(--fx-muted); white-space: nowrap; }
  .fx-none { font-size: .88em; color: var(--fx-muted); }
  .fx-rank th:nth-child(2), .fx-rank td:nth-child(2) { text-align: left; white-space: normal; min-width: 9em; }
  .fx-rank td.rk { text-align: center; font-weight: 800; color: var(--fx-muted); width: 3em; }
  .fx-rank tr.tot td { font-weight: 800; background: color-mix(in srgb, var(--fx-ink) 6%, var(--fx-card)); }
  .fx-rank tr.sub td { font-size: .9em; background: color-mix(in srgb, var(--fx-ink) 3%, var(--fx-card)); }
  .fx-rank tr.sub td:nth-child(2) { padding-left: 2em; }
  .fx-rank tr.exp { cursor: pointer; }
  .fx-rank tr.exp td:nth-child(2)::after { content: ' ▾'; color: var(--fx-muted); }
  .fx-rank tr.exp.open td:nth-child(2)::after { content: ' ▴'; }
  .fx-share { display: inline-block; height: 8px; border-radius: 4px; background: var(--fx-accent); vertical-align: middle; margin-right: .4em; opacity: .75; }
  .fx-ctl { display: flex; flex-wrap: wrap; gap: .6em; align-items: center; }
  .fx-ctl select { font: inherit; font-weight: 700; min-height: 46px; padding: 0 1em; border-radius: 12px; border: 2px solid var(--fx-line); background: var(--fx-card); color: var(--fx-ink); max-width: 100%; }
  .fx-kv { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 12em), 1fr)); gap: .6em; }
  .fx-kv div { border: 1.5px solid var(--fx-line); border-radius: 12px; padding: .7em .85em; display: flex; flex-direction: column; gap: .2em; }
  .fx-kv b { font-size: 1.25em; font-weight: 800; font-variant-numeric: tabular-nums; }
  .fx-kv small { color: var(--fx-muted); font-variant-numeric: tabular-nums; }
  .fx-empty { color: var(--fx-muted); margin: 0; padding: 1em; }
  @media (max-width: 720px) {
    .fx { gap: 1.2em; } .fx-big { font-size: 1.5em; } .fx-card { padding: .9em 1em; border-radius: 12px; }
    .fx-bar { grid-template-columns: 6.5em minmax(0, 1fr) 4.5em; gap: .5em; font-size: .92em; }
    .fx-detail { padding: 1em; border-radius: 14px; } .fx-detail h3 { font-size: 1.2em; }
    .fx-seg button { min-height: 40px; padding: 0 .9em; }
    .fx-search input, .fx-search select { min-height: 44px; flex: 1 1 100%; }
  }`;

  function addStyle() {
    if (document.getElementById('fx-style')) return;
    const s = document.createElement('style'); s.id = 'fx-style'; s.textContent = CSS; document.head.appendChild(s);
  }

  function bars(rows, getVal, fmt, max) {
    const box = el('div', 'fx-bars');
    const m = max || Math.max(...rows.map(getVal), 1);
    rows.forEach((c) => {
      const r = el('div', 'fx-bar' + (c.name === ME ? ' me' : ''));
      const tr = el('div', 'track'), f = el('div', 'fill'); f.style.width = Math.max(1, getVal(c) / m * 100) + '%'; tr.append(f);
      r.append(el('b', '', c.name), tr, el('span', '', fmt(getVal(c))));
      box.append(r);
    });
    return box;
  }

  // ── 플랫폼 순위·사용료 ──
  const ppf = (c, y) => v(c, y, 'basicprog') + v(c, y, 'payprog');
  const MET = [
    ['subfee', '수신료매출'], ['basicfee', '기본채널 수신료'], ['brev', '방송사업매출'], ['hsfee', '홈쇼핑 송출수수료'],
    ['pp', 'PP 프로그램사용료 (기본+유료)'], ['basicprog', '기본채널 프로그램사용료'], ['payprog', '유료채널 프로그램사용료'], ['vodprog', 'VOD 프로그램사용료'], ['retranscost', '지상파 재송신비용'],
    ['r_pp', 'PP 사용료 ÷ 수신료 (%)'], ['r_basic', '기본채널 사용료 ÷ 기본채널 수신료 (%)'],
  ];
  const RATIO = { r_pp: ['pp', 'subfee'], r_basic: ['basicprog', 'basicfee'] };
  const tot = (rows, y, k) => rows.reduce((t, c) => t + (k === 'pp' ? ppf(c, y) : v(c, y, k)), 0);
  const metric = (rows, y, k) => RATIO[k] ? pct(tot(rows, y, RATIO[k][0]), tot(rows, y, RATIO[k][1])) : tot(rows, y, k);
  const MSO = { 'LG계열': 'LG헬로비전', 'SKBB계열': 'SK브로드밴드(SO)', '딜라이브계열': '딜라이브', 'CMB계열': 'CMB', 'HCN계열': 'HCN' };
  const PNAME = { '케이티': 'KT (IPTV)', '에스케이브로드밴드': 'SK브로드밴드 (IPTV)', '엘지유플러스': 'LG유플러스 (IPTV)', '케이티스카이라이프': 'KT스카이라이프 (위성)' };
  function units(data, mode) {
    const pl = data.filter((c) => PLAT.includes(c.media));
    const so = pl.filter((c) => c.media === 'SO');
    const one = (c) => ({ name: PNAME[c.name] || c.name, kind: c.media === '위성방송' ? '위성' : c.media, rows: [c] });
    const mso = (g) => ({ name: MSO[g], kind: 'MSO · SO ' + so.filter((c) => c.group === g).length + '곳', rows: so.filter((c) => c.group === g), subs: true });
    const indiv = so.filter((c) => c.group === '개별 SO').map((c) => ({ name: c.name, kind: '개별 SO', rows: [c] }));
    const by = (n) => pl.find((c) => c.name === n);
    if (mode === 'so') return so.map((c) => ({ name: c.name, kind: MSO[c.group] || '개별 SO', rows: [c] }));
    if (mode === 'grp') return [
      { name: 'KT 계열', kind: 'IPTV+위성+HCN', rows: [by('케이티'), by('케이티스카이라이프'), ...so.filter((c) => c.group === 'HCN계열')], parts: [one(by('케이티')), one(by('케이티스카이라이프')), mso('HCN계열')] },
      { name: 'SK 계열', kind: 'IPTV+SO', rows: [by('에스케이브로드밴드'), ...so.filter((c) => c.group === 'SKBB계열')], parts: [one(by('에스케이브로드밴드')), mso('SKBB계열')] },
      { name: 'LG 계열', kind: 'IPTV+SO', rows: [by('엘지유플러스'), ...so.filter((c) => c.group === 'LG계열')], parts: [one(by('엘지유플러스')), mso('LG계열')] },
      mso('딜라이브계열'), mso('CMB계열'), ...indiv,
    ];
    return [...pl.filter((c) => c.media !== 'SO').map(one), ...Object.keys(MSO).map(mso), ...indiv];
  }
  function platforms(data, state, rerender) {
    const box = el('section', 'fx');
    const pl = data.filter((c) => PLAT.includes(c.media));
    // 1) 전체 요약
    const h1 = el('div', 'fx-h'); h1.append(el('h2', '', '유료방송 전체 수신료와 PP 사용료'), el('span', '', 'IPTV·SO·위성 합계, 2025년 실적 · 전년 대비'));
    const g = el('div', 'fx-grid');
    const card = (label, k, note) => {
      const a = metric(pl, Y, k), b = metric(pl, P, k);
      const c = el('div', 'fx-card'); const top = el('div', 'fx-row'); top.append(el('span', 'fx-k', label), chg(a, b));
      c.append(top, el('div', 'fx-big', money(a)), el('span', 'fx-k', '2024년 ' + money(b) + ' · ' + (a >= b ? '+' : '') + money(a - b) + (note ? ' · ' + note : '')));
      g.append(c);
    };
    card('수신료매출', 'subfee'); card('PP 프로그램사용료 (기본+유료)', 'pp'); card('그중 기본채널 사용료', 'basicprog');
    card('VOD 프로그램사용료', 'vodprog'); card('지상파 재송신비용', 'retranscost'); card('홈쇼핑 송출수수료', 'hsfee');
    box.append(h1, g);
    // 2) 매체별
    const h2 = el('div', 'fx-h'); h2.append(el('h2', '', '매체별 수신료 대비 사용료'), el('span', '', '괄호 안은 전년 대비'));
    const tw = el('div', 'fx-tablewrap'); const t = el('table', 'fx-table'); const hr = el('tr');
    ['매체', '수신료매출', 'PP 사용료(기본+유료)', 'VOD 사용료', '재송신비용', 'PP 사용료÷수신료', '기본채널 사용료÷기본 수신료'].forEach((x) => hr.append(el('th', '', x)));
    const th = el('thead'); th.append(hr); t.append(th); const tb = el('tbody');
    const cell = (a, b) => { const td = el('td', '', money(a)); const sm = el('small'); sm.append(chg(a, b)); td.append(sm); return td; };
    const rcell = (a, b) => { const td = el('td', '', a == null ? '—' : a.toFixed(1) + '%'); td.append(el('small', 'fx-k', b == null ? '' : '전년 ' + b.toFixed(1) + '% (' + (a - b >= 0 ? '+' : '') + (a - b).toFixed(1) + '%p)')); return td; };
    [...PLAT.map((m) => [m === '위성방송' ? '위성' : m, pl.filter((c) => c.media === m)]), ['합계', pl]].forEach(([m, rows]) => {
      const tr = el('tr', m === '합계' ? 'me' : '');
      tr.append(el('td', '', m), cell(metric(rows, Y, 'subfee'), metric(rows, P, 'subfee')), cell(metric(rows, Y, 'pp'), metric(rows, P, 'pp')), cell(metric(rows, Y, 'vodprog'), metric(rows, P, 'vodprog')), cell(metric(rows, Y, 'retranscost'), metric(rows, P, 'retranscost')), rcell(metric(rows, Y, 'r_pp'), metric(rows, P, 'r_pp')), rcell(metric(rows, Y, 'r_basic'), metric(rows, P, 'r_basic')));
      tb.append(tr);
    });
    t.append(tb); tw.append(t); box.append(h2, tw);
    // 3) 순위
    const h3 = el('div', 'fx-h'); h3.append(el('h2', '', '플랫폼 순위'), el('span', '', '항목과 묶음 단위를 고르세요 · MSO·계열 줄을 누르면 구성이 펼쳐집니다'));
    const ctl = el('div', 'fx-ctl');
    const ms = el('select'); ms.setAttribute('aria-label', '순위 항목'); MET.forEach(([k, l]) => ms.append(new Option(l, k))); ms.value = state.pm;
    ms.addEventListener('change', () => { state.pm = ms.value; rerender(); });
    const seg = el('div', 'fx-seg');
    [['biz', '사업자별 (MSO 합산)'], ['grp', '계열별'], ['so', 'SO 방송구역별']].forEach(([k, l]) => { const b = el('button', '', l); b.type = 'button'; b.setAttribute('aria-pressed', String(state.pu === k)); b.addEventListener('click', () => { state.pu = k; state.pexp = {}; rerender(); }); seg.append(b); });
    ctl.append(ms); box.append(h3, ctl, seg);
    const k = state.pm, isR = !!RATIO[k];
    const us = units(data, state.pu).map((u) => ({ ...u, a: metric(u.rows, Y, k), b: metric(u.rows, P, k) }))
      .filter((u) => u.a != null && (u.a !== 0 || u.b)).sort((x, y) => y.a - x.a);
    const total = metric(state.pu === 'so' ? pl.filter((c) => c.media === 'SO') : pl, Y, k), totalP = metric(state.pu === 'so' ? pl.filter((c) => c.media === 'SO') : pl, P, k);
    const maxA = Math.max(...us.map((u) => Math.abs(u.a)), 1);
    const rw = el('div', 'fx-tablewrap'); const rt = el('table', 'fx-table fx-rank'); const rh = el('tr');
    ['순위', state.pu === 'so' ? 'SO' : '사업자', '2025년', '2024년', '증감', isR ? '' : '비중'].forEach((x) => rh.append(el('th', '', x)));
    const rth = el('thead'); rth.append(rh); rt.append(rth); const rb = el('tbody');
    const fmt = (x) => (x == null ? '—' : isR ? x.toFixed(1) + '%' : money(x));
    const dif = (a, b) => { if (a == null || b == null) return el('td', '', '—'); if (isR) return el('td', '', (a - b >= 0 ? '▲' : '▼') + Math.abs(a - b).toFixed(1) + '%p'); const td = el('td'); td.append(chg(a, b)); td.append(el('small', 'fx-k', (a - b >= 0 ? '+' : '') + money(a - b))); return td; };
    const row = (cls, rk, name, kind, a, b) => {
      const tr = el('tr', cls); tr.append(el('td', 'rk', rk));
      const nm = el('td'); nm.append(el('div', '', name)); if (kind) nm.append(el('small', 'fx-k', kind)); tr.append(nm);
      tr.append(el('td', '', fmt(a)), el('td', '', fmt(b)), dif(a, b));
      const sh = el('td'); if (!isR && total) { const w = Math.max(2, Math.abs(a) / maxA * 60); const bar = el('span', 'fx-share'); bar.style.width = w + 'px'; sh.append(bar, document.createTextNode((a / total * 100).toFixed(1) + '%')); } tr.append(sh);
      return tr;
    };
    rb.append(row('tot', '', state.pu === 'so' ? 'SO 전체' : '유료방송 전체', state.pu === 'so' ? 'SO 90곳' : 'IPTV·SO·위성', total, totalP));
    us.forEach((u, i) => {
      const kids = u.parts || (u.subs && state.pu !== 'so' ? u.rows.map((c) => ({ name: c.name, kind: '', rows: [c] })) : null);
      const tr = row(kids ? 'exp' + (state.pexp[u.name] ? ' open' : '') : '', String(i + 1), u.name, u.kind, u.a, u.b);
      if (kids) tr.addEventListener('click', () => { state.pexp[u.name] = !state.pexp[u.name]; rerender(); });
      rb.append(tr);
      if (kids && state.pexp[u.name]) kids.map((x) => ({ ...x, a: metric(x.rows, Y, k), b: metric(x.rows, P, k) })).sort((x, y) => (y.a || 0) - (x.a || 0)).forEach((x) => rb.append(row('sub', '', x.name, x.kind, x.a, x.b)));
    });
    rt.append(rb); rw.append(rt); box.append(rw);
    box.append(el('p', 'fx-note', 'PP 프로그램사용료 = 기본채널 + 유료채널 프로그램사용료(VOD·지상파 재송신비용 제외). SO는 공표집에 방송구역(법인)별로 나뉘어 있어 MSO별로 더했습니다. 계열별: KT 계열 = KT IPTV + KT스카이라이프 + HCN, SK 계열 = SK브로드밴드 IPTV + SO, LG 계열 = LG유플러스 IPTV + LG헬로비전.'));
    return box;
  }

  function industry(data, openCo) {
    const box = el('section', 'fx');
    // 매체별 방송사업매출
    const h1 = el('div', 'fx-h'); h1.append(el('h2', '', '매체별 방송사업매출'), el('span', '', '2025년, 괄호는 전년 대비'));
    const g = el('div', 'fx-grid');
    MEDIA.forEach((m) => {
      const rows = data.filter((c) => c.media === m);
      const cur = sum(rows, Y, 'brev'), prev = sum(rows, P, 'brev'), op = sum(rows, Y, 'op');
      const c = el('div', 'fx-card');
      const top = el('div', 'fx-row'); top.append(el('span', 'fx-k', m + ' · ' + rows.length + '곳'), chg(cur, prev));
      const opl = el('span', 'fx-k', '영업손익 ' + money(op)); if (op < 0) opl.classList.add('fx-neg');
      c.append(top, el('div', 'fx-big', money(cur)), opl);
      g.append(c);
    });
    box.append(h1, g);

    // 유료방송 플랫폼 수익 구조
    const h2 = el('div', 'fx-h'); h2.append(el('h2', '', '유료방송 플랫폼의 수신료와 PP 사용료'), el('span', '', 'PP 사용료 = 기본+유료채널 프로그램사용료 (VOD·지상파 재송신 제외)'));
    const tw = el('div', 'fx-tablewrap'); const t = el('table', 'fx-table');
    const hd = el('thead'); const hr = el('tr');
    ['매체', '수신료매출', '홈쇼핑 송출수수료', 'PP 사용료(기본+유료)', '그중 기본채널', 'PP 사용료 ÷ 수신료'].forEach((x) => hr.append(el('th', '', x)));
    hd.append(hr); t.append(hd);
    const tb = el('tbody');
    const ratios = [];
    PLAT.forEach((m) => {
      const rows = data.filter((c) => c.media === m);
      const tr = el('tr');
      const sf = sum(rows, Y, 'subfee'), sfp = sum(rows, P, 'subfee');
      const pf = tot(rows, Y, 'pp'), pfp = tot(rows, P, 'pp');
      const hs = sum(rows, Y, 'hsfee'), hsp = sum(rows, P, 'hsfee');
      const bp = sum(rows, Y, 'basicprog'), bpp = sum(rows, P, 'basicprog');
      const cell = (a, b) => { const td = el('td', '', money(a)); const s = el('small'); s.append(chg(a, b)); td.append(s); return td; };
      const r = pct(pf, sf), rp = pct(pfp, sfp);
      ratios.push([m, r, rp, pct(bp, sf)]);
      const rt = el('td', '', r != null ? r.toFixed(1) + '%' : '—'); const sm = el('small', 'fx-k', '전년 ' + (rp != null ? rp.toFixed(1) + '%' : '—')); rt.append(sm);
      tr.append(el('td', '', m), cell(sf, sfp), cell(hs, hsp), cell(pf, pfp), cell(bp, bpp), rt);
      tb.append(tr);
    });
    t.append(tb); tw.append(t);
    box.append(h2, tw);

    // 한눈에 보는 포인트
    const so = data.filter((c) => c.media === 'SO'), ip = data.filter((c) => c.media === 'IPTV');
    const ppAll = data.filter((c) => c.media === 'PP');
    const ps = sum(ppAll, Y, 'progsupply'), psp = sum(ppAll, P, 'progsupply');
    const soHs = sum(so, Y, 'hsfee'), soSub = sum(so, Y, 'subfee');
    const h3 = el('div', 'fx-h'); h3.append(el('h2', '', '한눈에 보는 포인트'), el('span', '', '공표집 수치로 계산한 영업 참고 사항'));
    const ul = el('ul', 'fx-insight');
    const li = (t) => ul.append(el('li', '', t));
    const r0 = (x) => (x == null ? '—' : x.toFixed(1) + '%');
    ratios.forEach(([m, r, rp, b]) => li(`${m === '위성방송' ? '위성' : m}는 수신료매출 대비 PP 프로그램사용료(기본+유료)를 ${r0(r)} 지급했습니다(전년 ${r0(rp)}). 그중 기본채널 몫은 수신료의 ${r0(b)}입니다.`));
    li(`SO는 홈쇼핑 송출수수료(${money(soHs)})가 수신료매출(${money(soSub)})보다 ${soHs > soSub ? '많아' : '적어'}, 채널 편성에서 홈쇼핑 채널 비중이 계속 중요하게 작동합니다.`);
    li(`PP 전체의 방송프로그램제공매출(플랫폼에서 받은 사용료)은 ${money(ps)}로 전년 대비 ${(((ps - psp) / psp) * 100).toFixed(1)}% 변했습니다.`);
    const me = data.find((c) => c.name === ME);
    if (me) {
      const ranked = ppAll.filter((c) => v(c, Y, 'progsupply') > 0).sort((a, b) => v(b, Y, 'progsupply') - v(a, Y, 'progsupply'));
      const rank = ranked.findIndex((c) => c.name === ME) + 1;
      li(`재능방송의 프로그램제공매출은 ${money(v(me, Y, 'progsupply'))}(PP ${ranked.length}곳 중 ${rank}위, 점유율 ${(v(me, Y, 'progsupply') / ps * 100).toFixed(2)}%)이고, 전년 대비 ${(((v(me, Y, 'progsupply') - v(me, P, 'progsupply')) / v(me, P, 'progsupply')) * 100).toFixed(1)}% 변했습니다.`);
    }
    box.append(h3, ul);

    // PP 프로그램제공매출 순위
    const h4 = el('div', 'fx-h'); h4.append(el('h2', '', 'PP 프로그램제공매출 상위'), el('span', '', '플랫폼에서 받은 프로그램 사용료 기준 · 막대를 누르면 회사 상세'));
    const ranked = ppAll.filter((c) => v(c, Y, 'progsupply') > 0).sort((a, b) => v(b, Y, 'progsupply') - v(a, Y, 'progsupply'));
    const top = ranked.slice(0, 15); if (me && !top.includes(me)) top.push(me);
    const bb = bars(top, (c) => v(c, Y, 'progsupply'), money, v(ranked[0], Y, 'progsupply'));
    [...bb.children].forEach((row, i) => { row.style.cursor = 'pointer'; row.addEventListener('click', () => openCo(top[i])); });
    const wrap = el('div', 'fx-card'); wrap.append(bb);
    box.append(h4, wrap);
    return box;
  }

  function detail(c, close) {
    const d = el('article', 'fx-detail');
    const hd = el('header'); const left = el('div');
    left.append(el('h3', '', c.full || c.name));
    const tags = el('div', 'fx-tags'); [c.media, c.group, c.sub, c.size].filter(Boolean).forEach((t) => tags.append(el('span', 'fx-tag', t)));
    left.append(tags);
    const x = el('button', 'fx-close', '닫기 ✕'); x.type = 'button'; x.addEventListener('click', close);
    hd.append(left, x); d.append(hd);
    const kv = el('div', 'fx-kv');
    const item = (label, k, opt) => {
      const a = v(c, Y, k), b = v(c, P, k);
      if (!a && !b) return;
      const box = el('div'); box.append(el('span', 'fx-k', label));
      const n = el('b', '', money(a)); if (a < 0) n.classList.add('fx-neg'); box.append(n);
      const s = el('small', '', '2024년 ' + money(b) + ' '); s.append(chg(a, b)); box.append(s);
      kv.append(box);
    };
    item('매출액', 'rev'); item('방송사업매출', 'brev'); item('영업손익', 'op'); item('당기순손익', 'net');
    if (PLAT.includes(c.media)) { item('유료방송 수신료매출', 'subfee'); item('홈쇼핑 송출수수료', 'hsfee'); item('방송프로그램사용료 전체(재송신 포함)', 'progfee'); item('기본채널 사용료', 'basicprog'); item('유료채널 사용료', 'payprog'); item('VOD 사용료', 'vodprog'); item('재송신 비용', 'retranscost'); }
    else { item('프로그램제공매출(플랫폼 수입)', 'progsupply'); item('광고매출', 'ad'); item('협찬매출', 'sponsor'); item('프로그램판매', 'progsale'); item('홈쇼핑방송매출', 'hsrev'); item('제작비', 'prodcost'); item('구입비', 'buycost'); item('재송신매출', 'retrans'); }
    item('인건비', 'labor'); item('방송통신발전기금', 'fund'); item('자산총계', 'asset'); item('부채총계', 'debt'); item('자본총계', 'equity');
    d.append(kv);
    const eq = v(c, Y, 'equity'), db = v(c, Y, 'debt');
    const notes = [];
    if (PLAT.includes(c.media) && v(c, Y, 'subfee')) notes.push(`수신료매출 대비 PP 사용료(기본+유료) ${pct(ppf(c, Y), v(c, Y, 'subfee')).toFixed(1)}% (전년 ${v(c, P, 'subfee') ? pct(ppf(c, P), v(c, P, 'subfee')).toFixed(1) + '%' : '—'})`);
    if (v(c, Y, 'brev')) notes.push(`영업이익률 ${(v(c, Y, 'op') / v(c, Y, 'rev') * 100).toFixed(1)}%`);
    if (eq > 0) notes.push(`부채비율 ${(db / eq * 100).toFixed(0)}%`);
    if (notes.length) d.append(el('p', 'fx-note', notes.join(' · ')));
    if (c.media === 'IPTV') d.append(el('p', 'fx-note', '※ IPTV 3사의 영업손익·자산 등은 통신 등 방송 외 사업이 포함된 회사 전체 수치입니다.'));
    if (c.mpp || c.emp) {
      d.append(el('h4', 'fx-sub', '회사 정보'));
      const ik = el('div', 'fx-kv');
      const box = (k, val, sub) => { const b = el('div'); b.append(el('span', 'fx-k', k), el('b', '', val)); if (sub) b.append(el('small', '', sub)); ik.append(b); };
      if (c.mpp) box('소속 그룹 (MPP)', c.mpp.g, 'PP 방송사업매출 점유율 ' + c.mpp.sh + '%' + (c.mpp.with.length ? ' · 계열 ' + c.mpp.with.join(', ') : ''));
      if (c.ch) box('운영 채널 수', c.ch.length + '개', c.ch.map((x) => x.n).join(', '));
      if (c.emp) { const e = c.emp; box('종사자', e[12].toLocaleString('ko-KR') + '명', c.group === '홈쇼핑' ? '' : `방송직 ${e[3] + e[4] + e[5] + e[6] + e[7]} · 경영 ${e[2]} · 기술 ${e[8]} · 영업/홍보 ${e[10]}`); }
      d.append(ik);
    }
    const chs = (c.ch || []).filter((x) => x.tx || x.prem != null || x.src);
    if (chs.length) {
      d.append(el('h4', 'fx-sub', '보유 채널'));
      const COL = ['#c2410c', '#2563eb', '#16a34a', '#a855f7'], SN = ['자체제작', '외주제작', '국내구매', '국외구매'];
      const leg = el('div', 'fx-leg'); SN.forEach((t, i) => { const sp = el('span', '', t); sp.style.setProperty('--c', COL[i]); leg.append(sp); });
      const grid = el('div', 'fx-chs');
      chs.forEach((x) => {
        const card = el('div', 'fx-ch'); card.append(el('b', '', x.n));
        if (x.tx) {
          const pl = el('div', 'fx-pills');
          [['SO', x.tx[0], '/90'], ['위성', x.tx[1], ''], ['IPTV', x.tx[3], '/3'], ['DMB', x.tx[2], '']].forEach(([k, n, of]) => {
            if (k === 'DMB' && !n) return;
            pl.append(el('span', 'fx-pill ' + (n ? 'on' : 'off'), k === '위성' ? '위성 ' + (n ? 'O' : 'X') : k + ' ' + n + of));
          });
          card.append(pl);
        }
        if (x.prem != null) card.append(el('small', 'fx-k', '본방송 비율 ' + x.prem.toFixed(1) + '%'));
        if (x.src && x.src.some((v) => v)) {
          const bar = el('div', 'fx-mix'); x.src.forEach((v, i) => { if (v) { const s2 = el('i'); s2.style.flex = v + ' 0 0'; s2.style.margin = '0'; s2.style.background = COL[i]; s2.title = SN[i] + ' ' + v + '%'; bar.append(s2); } });
          card.append(bar, el('small', 'fx-k', x.src.map((v, i) => v ? SN[i] + ' ' + v.toFixed(0) + '%' : '').filter(Boolean).join(' · ')));
        }
        grid.append(card);
      });
      d.append(grid, leg, el('p', 'fx-note', 'SO 송출은 전체 90개 SO 중 송출 SO 수, IPTV는 3사 중 송출사 수입니다. 2025 방송산업 실태조사(2024년 기준).'));
    }
    return d;
  }

  function companies(data, state, rerender) {
    const box = el('section', 'fx');
    const h = el('div', 'fx-h'); h.append(el('h2', '', '업체별 재산상황'), el('span', '', '회사·채널 이름으로 찾거나 매체를 고른 뒤, 줄을 누르면 상세(재무·보유 채널)가 열립니다'));
    const sb = el('div', 'fx-search');
    const inp = el('input'); inp.type = 'search'; inp.placeholder = '회사·채널·그룹 이름 (예: 재능방송, tvN, 중앙홀딩스)'; inp.value = state.q; inp.setAttribute('aria-label', '회사 검색');
    const sel = el('select'); sel.setAttribute('aria-label', '매체'); ['전체', ...MEDIA, '지상파DMB'].forEach((m) => sel.append(new Option(m === '전체' ? '전체 매체' : m, m === '전체' ? '' : m))); sel.value = state.media;
    const go = () => { state.q = inp.value.trim(); state.media = sel.value; state.open = null; rerender(); };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    inp.addEventListener('input', () => { clearTimeout(state.t); state.t = setTimeout(go, 350); });
    sel.addEventListener('change', go);
    const meBtn = el('button', 'fx-close', '⭐ 재능방송 보기'); meBtn.type = 'button';
    meBtn.addEventListener('click', () => { state.q = ''; state.media = 'PP'; state.open = (data.find((c) => c.name === ME) || {}).id; rerender(); });
    sb.append(inp, sel, meBtn);
    box.append(h, sb);
    const open = data.find((c) => c.id === state.open);
    if (open) box.append(detail(open, () => { state.open = null; rerender(); }));
    const q = state.q.toLowerCase();
    const rows = data.filter((c) => (!state.media || c.media === state.media) && (!q || (c.full + c.name + c.group + c.sub + (c.mpp ? c.mpp.g : '') + (c.ch || []).map((x) => x.n).join(' ')).toLowerCase().includes(q)))
      .sort((a, b) => v(b, Y, 'brev') - v(a, Y, 'brev'));
    const plat = state.media && PLAT.includes(state.media);
    const tw = el('div', 'fx-tablewrap'); const t = el('table', 'fx-table');
    const hr = el('tr');
    const cols = plat ? ['회사', '방송사업매출', '수신료매출', 'PP 사용료(기본+유료)', 'PP 사용료÷수신료', '영업손익'] : ['회사', '방송사업매출', state.media === 'PP' ? '프로그램제공매출' : '광고매출', '영업손익', '당기순손익', '규모'];
    cols.forEach((x) => hr.append(el('th', '', x)));
    const th = el('thead'); th.append(hr); t.append(th);
    const tb = el('tbody');
    rows.slice(0, state.limit).forEach((c) => {
      const tr = el('tr', 'click' + (c.name === ME ? ' me' : ''));
      const name = el('td'); name.append(el('div', '', c.name)); const sm = el('small', 'fx-k', c.media + ' · ' + (c.group || '')); name.append(sm);
      const m = (k) => { const td = el('td', '', money(v(c, Y, k))); if (v(c, Y, k) < 0) td.classList.add('fx-neg'); const s = el('small'); s.append(chg(v(c, Y, k), v(c, P, k))); td.append(s); return td; };
      if (plat) {
        const r = pct(ppf(c, Y), v(c, Y, 'subfee'));
        const ppt = el('td', '', money(ppf(c, Y))); const pps = el('small'); pps.append(chg(ppf(c, Y), ppf(c, P))); ppt.append(pps);
        tr.append(name, m('brev'), m('subfee'), ppt, el('td', '', r != null ? r.toFixed(1) + '%' : '—'), m('op'));
      } else {
        tr.append(name, m('brev'), m(state.media === 'PP' ? 'progsupply' : 'ad'), m('op'), m('net'), el('td', '', c.size || ''));
      }
      tr.addEventListener('click', () => { state.open = c.id; rerender(); window.scrollTo({ top: Math.max(0, box.getBoundingClientRect().top + window.scrollY - 80), behavior: 'smooth' }); });
      tb.append(tr);
    });
    t.append(tb); tw.append(t);
    if (!rows.length) box.append(el('p', 'fx-empty', '조건에 맞는 회사가 없습니다.'));
    else box.append(tw);
    if (rows.length > state.limit) {
      const more = el('button', 'fx-close', `더 보기 (${rows.length - state.limit}곳 더)`); more.type = 'button';
      more.addEventListener('click', () => { state.limit += 30; rerender(); });
      box.append(more);
    }
    return box;
  }

  const GRP = [['', '전체'], ['종합편성', '종합편성'], ['보도전문', '보도전문'], ['계열', '지상파·통신 계열'], ['개별PP', '개별PP'], ['홈쇼핑', '홈쇼핑']];
  const txText = (x) => { if (!x.tx) return x.mo ? '송출 자료 없음' : ''; const t = x.tx, a = []; a.push('SO ' + t[0]); if (t[1]) a.push('위성'); a.push('IPTV ' + t[3]); if (t[2]) a.push('DMB'); return a.join(' · '); };
  function corps(data, state, rerender) {
    const box = el('section', 'fx');
    const all = data.filter((c) => c.media === 'PP');
    const h = el('div', 'fx-h');
    h.append(el('h2', '', '채널법인 현황'), el('span', '', `채널사용사업자(PP) ${all.length}곳 · 채널 ${all.reduce((t, c) => t + (c.ch || []).length, 0)}개 — 법인을 누르면 재무와 채널 상세가 열립니다`));
    const seg = el('div', 'fx-seg');
    GRP.forEach(([k, label]) => { const b = el('button', '', label); b.type = 'button'; b.setAttribute('aria-pressed', String(state.cg === k)); b.addEventListener('click', () => { state.cg = k; state.copen = null; state.climit = 30; rerender(); }); seg.append(b); });
    const sb = el('div', 'fx-search');
    const inp = el('input'); inp.type = 'search'; inp.placeholder = '법인·채널·그룹 이름 (예: 재능방송, tvN, 씨제이)'; inp.value = state.cq; inp.setAttribute('aria-label', '채널법인 검색');
    const go = () => { state.cq = inp.value.trim(); state.copen = null; rerender(); };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    inp.addEventListener('input', () => { clearTimeout(state.t); state.t = setTimeout(go, 350); });
    const meBtn = el('button', 'fx-close', '⭐ 재능방송'); meBtn.type = 'button';
    meBtn.addEventListener('click', () => { state.cq = ''; state.cg = ''; state.copen = (data.find((c) => c.name === ME) || {}).id; rerender(); });
    sb.append(inp, meBtn);
    box.append(h, seg, sb);
    const q = state.cq.toLowerCase();
    const inG = (c) => !state.cg || (state.cg === '계열' ? /계열$/.test(c.group || '') : c.group === state.cg);
    let rows = all.filter((c) => inG(c) && (!q || (c.full + c.name + (c.mpp ? c.mpp.g : '') + (c.ch || []).map((x) => x.n).join(' ')).toLowerCase().includes(q)))
      .sort((a, b) => v(b, Y, 'brev') - v(a, Y, 'brev'));
    if (state.copen) { const i = rows.findIndex((c) => c.id === state.copen); if (i >= state.climit) state.climit = i + 1; }
    const list = el('div', 'fx-corps');
    rows.slice(0, state.climit).forEach((c) => {
      if (c.id === state.copen) { const d = detail(c, () => { state.copen = null; rerender(); }); const sub = d.querySelector('.fx-sub'); if (sub) { const hd = d.querySelector('header'); const mv = []; for (let n = sub; n; n = n.nextSibling) mv.push(n); hd.after(...mv); const fin = el('h4', 'fx-sub', '재무 현황 (2025 재산상황 공표집)'); mv[mv.length - 1].after(fin); } list.append(d); setTimeout(() => d.scrollIntoView({ block: 'start', behavior: 'smooth' }), 30); return; }
      const card = el('button', 'fx-corp' + (c.name === ME ? ' me' : '')); card.type = 'button';
      const top = el('div', 'fx-corp-top'); const nm = el('div');
      nm.append(el('b', '', c.name));
      const tags = el('div', 'fx-tags'); [c.group, c.mpp && c.mpp.g !== c.name ? c.mpp.g + ' 그룹' : null].filter(Boolean).forEach((t) => tags.append(el('span', 'fx-tag', t)));
      nm.append(tags);
      const rv = el('span', 'fx-rev', '방송매출 ' + money(v(c, Y, 'brev')));
      top.append(nm, rv); card.append(top);
      const meta = []; if (c.ch) meta.push('채널 ' + c.ch.length + '개'); if (c.emp) meta.push('종사자 ' + c.emp[12].toLocaleString('ko-KR') + '명'); meta.push('영업손익 ' + money(v(c, Y, 'op')));
      card.append(el('div', 'fx-corp-meta', meta.join(' · ')));
      if (c.ch && c.ch.length) {
        const chips = el('div', 'fx-chips');
        c.ch.forEach((x) => { const ch = el('span', 'fx-chip'); ch.append(el('span', '', x.n)); const t = txText(x); if (t) ch.append(el('small', '', t)); chips.append(ch); });
        card.append(chips);
      } else card.append(el('span', 'fx-none', '실태조사 채널 자료 없음'));
      card.addEventListener('click', () => { state.copen = c.id; rerender(); });
      list.append(card);
    });
    if (!rows.length) box.append(el('p', 'fx-empty', '조건에 맞는 법인이 없습니다.')); else box.append(list);
    if (rows.length > state.climit) { const more = el('button', 'fx-close', `더 보기 (${rows.length - state.climit}곳 더)`); more.type = 'button'; more.addEventListener('click', () => { state.climit += 30; rerender(); }); box.append(more); }
    box.append(el('p', 'fx-note', '법인 목록·재무: 2025년도 방송사업자 재산상황 공표집 · 채널·송출(SO 90곳 중, IPTV 3사 중)·본방송·제작원·MPP 소속·종사자: 2025 방송산업 실태조사(2024년 말 기준).'));
    return box;
  }

  window.renderFinance = function (root, data) {
    addStyle();
    const state = root.__fx || (root.__fx = { view: 'industry', q: '', media: '', open: null, limit: 30, cg: '', cq: '', copen: null, climit: 30, pm: 'subfee', pu: 'biz', pexp: {} });
    const rerender = () => window.renderFinance(root, data);
    const wrap = el('div', 'fx');
    const seg = el('div', 'fx-seg');
    [['industry', '업계 요약'], ['plat', '플랫폼 순위·사용료'], ['corps', '채널법인 현황'], ['company', '업체별 재무 조회']].forEach(([k, label]) => {
      const b = el('button', '', label); b.type = 'button'; b.setAttribute('aria-pressed', String(state.view === k));
      b.addEventListener('click', () => { state.view = k; rerender(); }); seg.append(b);
    });
    wrap.append(seg);
    const openCo = (c) => { state.view = 'company'; state.media = c.media; state.q = ''; state.open = c.id; rerender(); window.scrollTo({ top: Math.max(0, root.getBoundingClientRect().top + window.scrollY - 80) }); };
    wrap.append(state.view === 'industry' ? industry(data, openCo) : state.view === 'corps' ? corps(data, state, rerender) : state.view === 'plat' ? platforms(data, state, rerender) : companies(data, state, rerender));
    wrap.append(el('p', 'fx-note', '자료: 방송미디어통신위원회 「2025년도 방송사업자 재산상황 공표집」(2026.6), 「2025 방송산업 실태조사」 · 재무는 2025년 실적, 전년(2024년) 대비 · 사업자가 제출한 자료로 감사·검증을 거치지 않은 수치이며, 방송 외 사업 실적이 포함될 수 있습니다.'));
    root.replaceChildren(wrap);
  };
})();

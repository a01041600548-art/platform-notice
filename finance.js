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
    return s + Math.round(m).toLocaleString('ko-KR') + '백만';
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
    const h2 = el('div', 'fx-h'); h2.append(el('h2', '', '유료방송 플랫폼의 수신료와 프로그램사용료'), el('span', '', 'PP에게 돌아오는 몫을 보여주는 핵심 지표입니다'));
    const tw = el('div', 'fx-tablewrap'); const t = el('table', 'fx-table');
    const hd = el('thead'); const hr = el('tr');
    ['매체', '수신료매출', '홈쇼핑 송출수수료', '프로그램사용료 지급', '그중 기본채널', '사용료 ÷ 수신료'].forEach((x) => hr.append(el('th', '', x)));
    hd.append(hr); t.append(hd);
    const tb = el('tbody');
    const ratios = [];
    PLAT.forEach((m) => {
      const rows = data.filter((c) => c.media === m);
      const tr = el('tr');
      const sf = sum(rows, Y, 'subfee'), sfp = sum(rows, P, 'subfee');
      const pf = sum(rows, Y, 'progfee'), pfp = sum(rows, P, 'progfee');
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
    ratios.forEach(([m, r, rp, b]) => li(`${m}는 수신료매출 대비 프로그램사용료를 ${r0(r)} 지급했습니다(전년 ${r0(rp)}). 그중 기본채널 몫은 수신료의 ${r0(b)}입니다.`));
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
    if (PLAT.includes(c.media)) { item('유료방송 수신료매출', 'subfee'); item('홈쇼핑 송출수수료', 'hsfee'); item('프로그램사용료 지급', 'progfee'); item('기본채널 사용료', 'basicprog'); item('유료채널 사용료', 'payprog'); item('VOD 사용료', 'vodprog'); item('재송신 비용', 'retranscost'); }
    else { item('프로그램제공매출(플랫폼 수입)', 'progsupply'); item('광고매출', 'ad'); item('협찬매출', 'sponsor'); item('프로그램판매', 'progsale'); item('홈쇼핑방송매출', 'hsrev'); item('제작비', 'prodcost'); item('구입비', 'buycost'); item('재송신매출', 'retrans'); }
    item('인건비', 'labor'); item('방송통신발전기금', 'fund'); item('자산총계', 'asset'); item('부채총계', 'debt'); item('자본총계', 'equity');
    d.append(kv);
    const eq = v(c, Y, 'equity'), db = v(c, Y, 'debt');
    const notes = [];
    if (PLAT.includes(c.media) && v(c, Y, 'subfee')) notes.push(`수신료매출 대비 프로그램사용료 ${pct(v(c, Y, 'progfee'), v(c, Y, 'subfee')).toFixed(1)}% (전년 ${v(c, P, 'subfee') ? pct(v(c, P, 'progfee'), v(c, P, 'subfee')).toFixed(1) + '%' : '—'})`);
    if (v(c, Y, 'brev')) notes.push(`영업이익률 ${(v(c, Y, 'op') / v(c, Y, 'rev') * 100).toFixed(1)}%`);
    if (eq > 0) notes.push(`부채비율 ${(db / eq * 100).toFixed(0)}%`);
    if (notes.length) d.append(el('p', 'fx-note', notes.join(' · ')));
    if (c.media === 'IPTV') d.append(el('p', 'fx-note', '※ IPTV 3사의 영업손익·자산 등은 통신 등 방송 외 사업이 포함된 회사 전체 수치입니다.'));
    return d;
  }

  function companies(data, state, rerender) {
    const box = el('section', 'fx');
    const h = el('div', 'fx-h'); h.append(el('h2', '', '업체별 재산상황'), el('span', '', '회사 이름으로 찾거나 매체를 고른 뒤, 줄을 누르면 상세가 열립니다'));
    const sb = el('div', 'fx-search');
    const inp = el('input'); inp.type = 'search'; inp.placeholder = '회사 이름 (예: 딜라이브, 재능방송, CJ)'; inp.value = state.q; inp.setAttribute('aria-label', '회사 검색');
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
    const rows = data.filter((c) => (!state.media || c.media === state.media) && (!q || (c.full + c.name + c.group + c.sub).toLowerCase().includes(q)))
      .sort((a, b) => v(b, Y, 'brev') - v(a, Y, 'brev'));
    const plat = state.media && PLAT.includes(state.media);
    const tw = el('div', 'fx-tablewrap'); const t = el('table', 'fx-table');
    const hr = el('tr');
    const cols = plat ? ['회사', '방송사업매출', '수신료매출', '프로그램사용료', '사용료÷수신료', '영업손익'] : ['회사', '방송사업매출', state.media === 'PP' ? '프로그램제공매출' : '광고매출', '영업손익', '당기순손익', '규모'];
    cols.forEach((x) => hr.append(el('th', '', x)));
    const th = el('thead'); th.append(hr); t.append(th);
    const tb = el('tbody');
    rows.slice(0, state.limit).forEach((c) => {
      const tr = el('tr', 'click' + (c.name === ME ? ' me' : ''));
      const name = el('td'); name.append(el('div', '', c.name)); const sm = el('small', 'fx-k', c.media + ' · ' + (c.group || '')); name.append(sm);
      const m = (k) => { const td = el('td', '', money(v(c, Y, k))); if (v(c, Y, k) < 0) td.classList.add('fx-neg'); const s = el('small'); s.append(chg(v(c, Y, k), v(c, P, k))); td.append(s); return td; };
      if (plat) {
        const r = pct(v(c, Y, 'progfee'), v(c, Y, 'subfee'));
        tr.append(name, m('brev'), m('subfee'), m('progfee'), el('td', '', r != null ? r.toFixed(1) + '%' : '—'), m('op'));
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

  window.renderFinance = function (root, data) {
    addStyle();
    const state = root.__fx || (root.__fx = { view: 'industry', q: '', media: '', open: null, limit: 30 });
    const rerender = () => window.renderFinance(root, data);
    const wrap = el('div', 'fx');
    const seg = el('div', 'fx-seg');
    [['industry', '업계 요약'], ['company', '업체별 조회']].forEach(([k, label]) => {
      const b = el('button', '', label); b.type = 'button'; b.setAttribute('aria-pressed', String(state.view === k));
      b.addEventListener('click', () => { state.view = k; rerender(); }); seg.append(b);
    });
    wrap.append(seg);
    const openCo = (c) => { state.view = 'company'; state.media = c.media; state.q = ''; state.open = c.id; rerender(); window.scrollTo({ top: Math.max(0, root.getBoundingClientRect().top + window.scrollY - 80) }); };
    wrap.append(state.view === 'industry' ? industry(data, openCo) : companies(data, state, rerender));
    wrap.append(el('p', 'fx-note', '자료: 방송미디어통신위원회 「2025년도 방송사업자 재산상황 공표집」(2026.6) · 2025년 실적, 전년(2024년) 대비 · 사업자가 제출한 자료로 감사·검증을 거치지 않은 수치이며, 방송 외 사업 실적이 포함될 수 있습니다.'));
    root.replaceChildren(wrap);
  };
})();

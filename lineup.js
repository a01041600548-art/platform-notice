/* 채널 라인업 화면 v2 — 상품 유형(디지털·8VSB·IP) · 방송구역별
   window.renderLineup(root, data)
   data = { plats:[{op,kind,type,region,src,basis,date,prods}], chans:[{n,g,corp,al,c:{platIdx:[no,tier]}}] } */
(function () {
  const GC = { '종교': '#7c3aed', '영화': '#dc2626', '해외드라마': '#db2777', '국내드라마': '#ea580c', '음악': '#c026d3', '스포츠': '#16a34a', '시사·경제': '#0891b2', '교양·생활정보': '#0d9488', '예능·오락': '#d97706', '취미·레저': '#65a30d', '어린이·교육': '#2563eb', '기타': '#64748b', '홈쇼핑': '#a16207', '지상파·종편·보도': '#334155', '유료채널': '#9333ea', '평가 외·해외': '#94a3b8' };
  const GORDER = ['지상파·종편·보도', '홈쇼핑', '국내드라마', '해외드라마', '예능·오락', '영화', '스포츠', '시사·경제', '교양·생활정보', '어린이·교육', '취미·레저', '음악', '종교', '기타', '유료채널', '평가 외·해외'];
  const TC = { '디지털': '#2563eb', '8VSB': '#ea580c', 'IP': '#7c3aed', 'IPTV': '#0f766e', '위성': '#0369a1' };
  const ME = /JEI|재능/;
  const MINE = () => document.body.classList.contains('mine');
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const CSS = `
  .lu { display: flex; flex-direction: column; gap: 1.3em; }
  .lu-card { background: var(--lu-card); border: 1px solid var(--lu-line); border-radius: 18px; box-shadow: 0 1px 2px rgba(16,24,40,.05), 0 8px 24px rgba(16,24,40,.05); }
  .lu-seg { display: inline-flex; flex-wrap: wrap; gap: 4px; padding: 4px; background: color-mix(in srgb, var(--lu-ink) 6%, var(--lu-card)); border-radius: 14px; width: fit-content; max-width: 100%; }
  .lu-seg button { font: inherit; font-weight: 800; min-height: 42px; padding: 0 1.05em; border-radius: 10px; border: 0; background: transparent; color: var(--lu-muted); cursor: pointer; transition: background .15s, color .15s; }
  .lu-seg button[aria-pressed="true"] { background: var(--lu-card); color: var(--lu-ink); box-shadow: 0 1px 3px rgba(0,0,0,.12); }
  .lu-type { display: flex; flex-wrap: wrap; gap: .45em; }
  .lu-type button { font: inherit; font-weight: 800; font-size: .92em; min-height: 40px; padding: 0 1em; border-radius: 999px; cursor: pointer; border: 1.5px solid color-mix(in srgb, var(--tc) 40%, transparent); color: var(--tc); background: color-mix(in srgb, var(--tc) 8%, var(--lu-card)); }
  .lu-type button[aria-pressed="true"] { background: var(--tc); color: #fff; border-color: var(--tc); }
  .tb { display: inline-flex; align-items: center; font-size: .72em; font-weight: 800; padding: .12em .55em; border-radius: 6px; color: #fff; background: var(--tc); letter-spacing: .02em; white-space: nowrap; }
  .rb { display: inline-flex; align-items: center; gap: .25em; font-size: .78em; font-weight: 700; color: var(--lu-muted); white-space: nowrap; }
  .rb::before { content: '📍'; font-size: .9em; }
  .lu-me { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 26em), 1fr)); gap: 1em; }
  .lu-mecard { padding: 1.2em 1.3em; display: flex; flex-direction: column; gap: .8em; background: linear-gradient(160deg, color-mix(in srgb, var(--lu-accent) 10%, var(--lu-card)) 0%, var(--lu-card) 55%); }
  .lu-mecard h3 { margin: 0; font-size: 1.25em; font-weight: 800; display: flex; align-items: center; gap: .45em; }
  .lu-mecard h3 small { font-size: .62em; font-weight: 700; color: var(--lu-muted); }
  .lu-merow { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .2em .8em; align-items: center; padding: .55em 0; border-top: 1px dashed var(--lu-line); }
  .lu-merow:first-of-type { border-top: 0; }
  .lu-merow .who { display: flex; align-items: center; gap: .45em; flex-wrap: wrap; font-weight: 800; }
  .lu-merow .num { font-size: 1.45em; font-weight: 800; font-variant-numeric: tabular-nums; text-align: right; }
  .lu-merow .num.na { font-size: .95em; color: var(--lu-muted); font-weight: 700; }
  .lu-merow small { grid-column: 1 / -1; color: var(--lu-muted); font-size: .82em; }
  .lu-bar { padding: 1em 1.1em; display: flex; flex-direction: column; gap: .8em; }
  .lu-row { display: flex; flex-wrap: wrap; gap: .6em; align-items: center; }
  .lu-row > b { font-size: .85em; color: var(--lu-muted); min-width: 4.5em; }
  .lu-in { font: inherit; min-height: 46px; padding: 0 1em; border-radius: 12px; border: 1.5px solid var(--lu-line); background: var(--lu-bg); color: var(--lu-ink); min-width: 0; }
  input.lu-in { flex: 1 1 15em; }
  select.lu-in { font-weight: 700; }
  .lu-regs { display: flex; flex-wrap: wrap; gap: .6em; }
  .lu-regs label { display: inline-flex; align-items: center; gap: .45em; font-weight: 800; font-size: .9em; padding: .25em .35em .25em .8em; border-radius: 12px; background: color-mix(in srgb, var(--lu-ink) 5%, var(--lu-card)); }
  .lu-regs select { font: inherit; font-weight: 700; min-height: 38px; border-radius: 9px; border: 1.5px solid var(--lu-line); background: var(--lu-card); color: var(--lu-ink); padding: 0 .6em; }
  .lu-g { display: flex; flex-wrap: wrap; gap: .4em; }
  .lu-g button { font: inherit; font-size: .86em; font-weight: 800; min-height: 34px; padding: 0 .8em; border-radius: 999px; cursor: pointer; color: var(--gc); background: color-mix(in srgb, var(--gc) 9%, var(--lu-card)); border: 1.5px solid color-mix(in srgb, var(--gc) 35%, transparent); }
  .lu-g button[aria-pressed="true"] { background: var(--gc); color: #fff; border-color: var(--gc); }
  .lu-g button small { opacity: .7; margin-left: .3em; }
  .lu-wrap { overflow: auto; max-height: 72vh; }
  .lu-t { border-collapse: separate; border-spacing: 0; width: max-content; min-width: 100%; font-variant-numeric: tabular-nums; }
  .lu-t th, .lu-t td { padding: .6em .75em; border-bottom: 1px solid var(--lu-line); text-align: center; white-space: nowrap; }
  .lu-t thead th { position: sticky; top: 0; z-index: 2; background: var(--lu-card); font-size: .85em; font-weight: 800; color: var(--lu-ink); border-bottom: 2px solid var(--lu-line); vertical-align: bottom; line-height: 1.35; }
  .lu-t thead th .tb { margin-bottom: .3em; }
  .lu-t thead th .rb { display: flex; justify-content: center; margin-top: .2em; }
  .lu-t th.ch, .lu-t td.ch { position: sticky; left: 0; z-index: 1; background: var(--lu-card); text-align: left; min-width: 11.5em; max-width: 15em; white-space: normal; border-right: 1px solid var(--lu-line); }
  .lu-t thead th.ch { z-index: 3; }
  .lu-t td.ch { font-weight: 800; box-shadow: inset 4px 0 0 var(--gc); padding-left: 1em; }
  .lu-t td.ch small { display: block; font-weight: 600; font-size: .78em; color: var(--lu-muted); margin-top: .1em; }
  .lu-t tr.me td { background: color-mix(in srgb, var(--lu-accent) 8%, var(--lu-card)); }
  .lu-t td.no { font-weight: 800; font-size: 1.02em; }
  .lu-t td.no.t1 { color: #2563eb; } .lu-t td.no.t2 { color: #7c3aed; } .lu-t td.no.t3 { color: #db2777; }
  .lu-t td.na { color: color-mix(in srgb, var(--lu-muted) 45%, transparent); }
  .lu-t tbody tr:hover td { background: color-mix(in srgb, var(--lu-ink) 3.5%, var(--lu-card)); }
  .lu-t .gl { border-left: 1px solid var(--lu-line); }
  .lu-leg { display: flex; flex-wrap: wrap; gap: .35em 1.1em; font-size: .84em; color: var(--lu-muted); align-items: center; }
  .lu-leg i { font-style: normal; font-weight: 800; }
  .lu-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 15.5em), 1fr)); gap: .5em; }
  .lu-item { display: grid; grid-template-columns: 3.6em minmax(0, 1fr); gap: .1em .6em; align-items: center; background: var(--lu-card); border: 1px solid var(--lu-line); border-radius: 12px; padding: .55em .7em; box-shadow: inset 4px 0 0 var(--gc); }
  .lu-item b { font-size: 1.15em; font-weight: 800; text-align: right; font-variant-numeric: tabular-nums; grid-row: span 2; }
  .lu-item span { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .lu-item small { font-size: .74em; color: var(--lu-muted); }
  .lu-item.me { background: color-mix(in srgb, var(--lu-accent) 10%, var(--lu-card)); border-color: color-mix(in srgb, var(--lu-accent) 45%, var(--lu-line)); }
  .lu-sub { margin: .4em 0 0; font-size: 1.02em; font-weight: 800; display: flex; align-items: center; gap: .5em; }
  .lu-sub::before { content: ''; width: .75em; height: .75em; border-radius: 4px; background: var(--gc); }
  .lu-info { padding: .9em 1.1em; display: flex; flex-wrap: wrap; gap: .4em 1.3em; font-size: .9em; align-items: center; }
  .lu-note { margin: 0; font-size: .86em; color: var(--lu-muted); line-height: 1.65; }
  .lu-rg { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 19em), 1fr)); gap: 1em; }
  .lu-rgcard { padding: 1em 1.1em; display: flex; flex-direction: column; gap: .6em; }
  .lu-rgcard h4 { margin: 0; display: flex; align-items: center; gap: .5em; font-size: 1.05em; }
  .lu-rgl { display: grid; grid-template-columns: 1fr auto; gap: 0; }
  .lu-rgl div { padding: .38em .2em; border-bottom: 1px solid var(--lu-line); font-size: .92em; }
  .lu-rgl div:nth-child(2n) { text-align: right; font-weight: 800; font-variant-numeric: tabular-nums; }
  .lu-rgl div.diff { color: var(--lu-accent); }
  .lu-more { font: inherit; font-weight: 800; min-height: 46px; border-radius: 12px; border: 1.5px solid var(--lu-line); background: var(--lu-card); color: var(--lu-ink); cursor: pointer; }

  .lu-mesum { padding: 1.1em 1.2em; display: flex; flex-direction: column; gap: .8em; background: linear-gradient(160deg, color-mix(in srgb, var(--lu-accent) 8%, var(--lu-card)) 0%, var(--lu-card) 45%); }
  .lu-mesum-h { display: flex; flex-wrap: wrap; align-items: baseline; gap: .3em 1em; }
  .lu-mesum-h h3 { margin: 0; font-size: 1.2em; font-weight: 800; }
  .lu-mesum-h span { font-size: .85em; color: var(--lu-muted); }
  .lu-wrap2 { overflow-x: auto; }
  .lu-mt { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
  .lu-mt th { text-align: right; font-size: .85em; color: var(--lu-muted); font-weight: 800; padding: .5em .7em; border-bottom: 2px solid var(--lu-line); white-space: nowrap; }
  .lu-mt th:first-child { text-align: left; }
  .lu-mt td { padding: .55em .7em; border-bottom: 1px solid var(--lu-line); vertical-align: middle; }
  .lu-mt td.lw { font-weight: 800; white-space: nowrap; }
  @media (max-width: 720px) { .lu-mt { font-size: .9em; } .lu-mt td.lw { white-space: normal; } .lu-mt td, .lu-mt th { padding-left: .4em; padding-right: .4em; } .lu-mt td.n b { font-size: 1.2em; } }
  .lu-mt td.n em.lu-prod { display: block; font-style: normal; font-size: .72em; font-weight: 700; color: var(--lu-muted); margin-top: .1em; white-space: nowrap; }
  td.gl small.lu-cp { display: block; font-size: .66em; font-weight: 600; opacity: .85; white-space: nowrap; line-height: 1.2; }
  .lu-mt td.lw small { display: block; font-weight: 600; font-size: .78em; color: var(--lu-muted); margin-top: .15em; }
  .lu-mt td.n { text-align: right; white-space: nowrap; }
  .lu-mt td.n b { font-size: 1.35em; font-weight: 800; }
  .lu-mt td.n small { display: block; font-size: .76em; color: var(--lu-muted); font-weight: 700; }
  .lu-mt td.na { color: color-mix(in srgb, var(--lu-muted) 50%, transparent); text-align: right; font-weight: 800; }
  .lu-mt tr.det td { padding: 0 .7em .6em; border-bottom: 1px solid var(--lu-line); }
  .lu-mt details summary { cursor: pointer; font-size: .85em; font-weight: 800; color: var(--lu-accent); padding: .2em 0; }
  .lu-detg { display: grid; grid-template-columns: repeat(auto-fill, minmax(8.5em, 1fr)); gap: .35em; margin-top: .4em; }
  .lu-detg div { display: flex; gap: .5em; align-items: baseline; background: color-mix(in srgb, var(--lu-ink) 4%, var(--lu-card)); border-radius: 8px; padding: .3em .55em; font-size: .85em; }
  .lu-detg span { flex: 1; color: var(--lu-muted); font-weight: 700; }
  .lu-detg b { font-variant-numeric: tabular-nums; } .lu-detg b.df { color: var(--lu-accent); } .lu-detg b.na { color: var(--lu-muted); }
  .lu-fold { display: flex; justify-content: space-between; align-items: center; gap: .6em; }
  .lu-fold button { font: inherit; font-size: .85em; font-weight: 800; border: 0; background: transparent; color: var(--lu-muted); cursor: pointer; }
  .lu-ev { display: inline-block; margin-left: .25em; font-size: .78em; font-weight: 800; cursor: help; vertical-align: top; }
  .lu-ev.vp { color: #16a34a; } .lu-ev.vc { color: #d97706; } .lu-ev.va, .lu-ev.ff { color: var(--lu-muted); }
  @media (max-width: 720px) {
    .lu-seg button { min-height: 38px; padding: 0 .8em; font-size: .92em; }
    .lu-in { min-height: 42px; } input.lu-in, select.lu-in { flex: 1 1 100%; }
    .lu-t th, .lu-t td { padding: .45em .5em; }
    .lu-t th.ch, .lu-t td.ch { min-width: 8.5em; }
    .lu-wrap { max-height: 70vh; }
    .lu-row > b { min-width: 100%; }
  }
  /* 가독성 보강 — 숫자가 많은 표를 더 쉽게 훑어볼 수 있도록 */
  .lu-t tbody tr:nth-child(even) td { background: color-mix(in srgb, var(--lu-ink) 2%, var(--lu-card)); }
  .lu-t tbody tr:nth-child(even):hover td { background: color-mix(in srgb, var(--lu-ink) 4.5%, var(--lu-card)); }
  .lu-t tr.me td { box-shadow: inset 0 1px 0 color-mix(in srgb, var(--lu-accent) 25%, transparent); }
  .lu-t tr.me td.ch { box-shadow: inset 4px 0 0 var(--lu-accent); }
  .lu-t thead th { letter-spacing: .01em; }
  .lu-t thead th .tb { font-size: .76em; }
  .lu-leg { padding: .7em 0 0; border-top: 1px dashed var(--lu-line); margin-top: .2em; line-height: 1.7; }
  .lu-leg i { margin-right: .15em; }
  .lu-mecard, .lu-mesum { border: 1px solid color-mix(in srgb, var(--lu-accent) 22%, var(--lu-line)); }
  @media (max-width: 720px) { .lu-leg { font-size: .78em; gap: .3em .8em; } }
  .lu-t td.ch { cursor: pointer; }
  .lu-t td.ch:hover { background: color-mix(in srgb, var(--lu-accent) 6%, var(--lu-card)); }
  .lu-t td.ch::after { content: '상세 ›'; display: block; font-size: .72em; font-weight: 700; color: var(--lu-accent); margin-top: .25em; opacity: .85; }
  dialog.lu-dialog { border: 0; border-radius: 18px; padding: 0; width: min(92vw, 42em); max-height: 85vh; color: var(--lu-ink); background: var(--lu-card); box-shadow: 0 24px 60px rgba(0,0,0,.3); }
  dialog.lu-dialog::backdrop { background: rgba(10,10,10,.5); }
  .lu-dialog-h { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 1em; padding: 1em 1.2em; border-bottom: 1px solid var(--lu-line); background: var(--lu-card); }
  .lu-dialog-h h3 { margin: 0; font-size: 1.2em; font-weight: 800; }
  .lu-dialog-x { font: inherit; min-width: 36px; min-height: 36px; border-radius: 10px; border: 1.5px solid var(--lu-line); background: var(--lu-bg); color: var(--lu-ink); cursor: pointer; }
  .lu-dialog-body { padding: .4em 1.2em 1.3em; overflow-y: auto; }
  .lu-cd-op { padding: .9em 0; border-bottom: 1px solid var(--lu-line); }
  .lu-cd-op:last-child { border-bottom: 0; }
  .lu-cd-op h4 { margin: 0 0 .5em; font-size: .98em; font-weight: 800; }
  .lu-cd-t { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
  .lu-cd-t td { padding: .35em .3em; border-bottom: 1px dashed var(--lu-line); vertical-align: middle; font-size: .92em; }
  .lu-cd-t tr:last-child td { border-bottom: 0; }
  .lu-cd-t td.n { font-weight: 800; font-size: 1.05em; text-align: center; white-space: nowrap; }
  .lu-cd-t td.tier { text-align: right; color: var(--lu-muted); white-space: nowrap; }
  .lu-cd-t td.tier b { color: var(--lu-accent); font-weight: 800; }
  .lu-empty-list { font-variant-numeric: tabular-nums; word-break: break-all; }`;
  function addStyle() { if (document.getElementById('lu-style')) return; const s = el('style'); s.id = 'lu-style'; s.textContent = CSS; document.head.appendChild(s); }
  const tlabel = (p) => p.kind === '케이블' ? p.type : p.kind;
  const tbadge = (p) => { const b = el('span', 'tb', tlabel(p)); b.style.setProperty('--tc', TC[tlabel(p)] || '#64748b'); return b; };
  const shortReg = (r) => (r || '').replace(/방송$/, '');
  const numv = (v) => { if (!v) return 1e9; const m = String(v[0]).match(/^(\d+)(?:-(\d+))?/); return m ? +m[1] + (m[2] ? +m[2] / 100 : 0) : 1e9; };

  function groupsOf(D) { // 운영사·유형별 세트 묶음
    const g = []; const map = {};
    D.plats.forEach((p, i) => { const k = p.op + '|' + tlabel(p); if (!map[k]) { map[k] = { op: p.op, p, type: tlabel(p), kind: p.kind, idx: [] }; g.push(map[k]); } map[k].idx.push(i); });
    const order = { 'IPTV': 0, '위성': 1, '디지털': 2, '8VSB': 3, 'IP': 4 };
    return g.sort((a, b) => order[a.type] - order[b.type] || a.op.localeCompare(b.op, 'ko'));
  }
  const pick = (D, gr, state) => { if (gr.idx.length === 1) return gr.idx[0]; const r = state.reg[gr.op]; const f = gr.idx.find((i) => D.plats[i].region === r); return f != null ? f : gr.idx[0]; };

  const sp = (s) => String(s || '').replace(/^(B tv |tv |지니 TV |U\+tv |iTV |UHD |헬로tv )/i, '').trim();
  const prodOf = (p, v) => (v && p && p.prods && v[1] >= 0 && p.prods[v[1]]) ? sp(p.prods[v[1]]) : '';
  const tierLabel = (p, v) => (!v || v[1] <= 0) ? '저티어 · 기본 포함' : ('고티어 · ' + (prodOf(p, v) || ('상품 ' + (v[1] + 1) + '단계')) + '부터');

  function channelDetailBody(D, c) {
    const wrap = el('div', 'lu-dialog-body');
    const rows = D.plats.map((p, i) => ({ p, i, v: c.c[i] })).filter((x) => x.v);
    if (!rows.length) { wrap.append(el('p', 'lu-note', '편성된 플랫폼이 없습니다.')); return wrap; }
    const byOp = {};
    rows.forEach((r) => { (byOp[r.p.op] = byOp[r.p.op] || []).push(r); });
    Object.keys(byOp).sort((a, b) => a.localeCompare(b, 'ko')).forEach((op) => {
      const sec = el('div', 'lu-cd-op'); sec.append(el('h4', '', op));
      const t = el('table', 'lu-cd-t');
      byOp[op].sort((a, b) => tlabel(a.p).localeCompare(tlabel(b.p), 'ko') || (a.p.region || '').localeCompare(b.p.region || '', 'ko')).forEach(({ p, v }) => {
        const tr = el('tr');
        const td1 = el('td'); td1.append(tbadge(p)); if (p.region) td1.append(document.createTextNode(' '), el('span', 'rb', shortReg(p.region)));
        const td2 = el('td', 'n', v[0] + '번');
        const td3 = el('td', 'tier');
        const [cat, rest] = tierLabel(p, v).split(' · ');
        td3.append(el('b', '', cat), document.createTextNode(' · ' + rest));
        tr.append(td1, td2, td3); t.append(tr);
      });
      sec.append(t); wrap.append(sec);
    });
    return wrap;
  }

  function showDialog(title, bodyEl) {
    let dlg = document.getElementById('lu-dialog');
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.id = 'lu-dialog'; dlg.className = 'lu-dialog';
      document.body.appendChild(dlg);
      dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    }
    dlg.replaceChildren();
    const head = el('div', 'lu-dialog-h'); head.append(el('h3', '', title));
    const x = el('button', 'lu-dialog-x', '✕'); x.type = 'button'; x.setAttribute('aria-label', '닫기'); x.addEventListener('click', () => dlg.close());
    head.append(x);
    dlg.append(head, bodyEl);
    dlg.showModal();
  }

  function openChannelDetail(D, c) { showDialog(c.n, channelDetailBody(D, c)); }
  const EV_ICON = { verified_present: ['✓', 'vp', '검증됨'], source_conflict: ['⚠', 'vc', '자료 상충'], verified_absent: ['✗', 'va', '미편성 확인'], extraction_failed: ['·', 'ff', '추출 실패'], fetch_failed: ['·', 'ff', '자료 확인 불가'], unknown: ['', '', ''] };
  function evOf(D, i, name) { return D.evidence && D.evidence[i + '|' + name]; }
  function evBadge(D, i, name) {
    const e = evOf(D, i, name); if (!e) return null;
    const ic = EV_ICON[e.status] || EV_ICON.unknown; if (!ic[0]) return null;
    const s = el('sup', 'lu-ev ' + ic[1], ic[0]);
    const bits = [ic[2]];
    if (e.sourceId) bits.push('자료: ' + e.sourceId + (e.pdfPage ? ' ' + e.pdfPage + '쪽' : ''));
    if (e.tableLabel) bits.push(e.tableLabel);
    if (e.effectiveDate) bits.push('기준일: ' + e.effectiveDate);
    if (e.regionalCondition) bits.push(e.regionalCondition);
    if (e.reviewNote) bits.push(e.reviewNote);
    s.title = bits.join(' · ');
    return s;
  }
  function meCards(D) {
    const G = groupsOf(D);
    const mine = D.chans.filter((c) => ME.test(c.n)).sort((a, b) => (/English/i.test(a.n) ? 1 : 0) - (/English/i.test(b.n) ? 1 : 0));
    const card = el('div', 'lu-card lu-mesum');
    const h = el('div', 'lu-mesum-h'); h.append(el('h3', '', '재능방송 채널 번호'), el('span', '', '구역별로 다르면 가장 많은 번호를 표시 · ▸ 구역별 보기')); card.append(h);
    const wrap = el('div', 'lu-wrap2'); const t = el('table', 'lu-mt'); const hr = el('tr'); hr.append(el('th', '', '라인업'));
    mine.forEach((c) => hr.append(el('th', '', c.n.replace(/^JEI\s*/, '')))); const th = el('thead'); th.append(hr); t.append(th);
    const tb = el('tbody');
    G.forEach((gr) => {
      const tr = el('tr'); const td0 = el('td', 'lw'); td0.append(tbadge(gr.p), document.createTextNode(' ' + gr.op)); const pl = gr.idx.map((i) => D.plats[i]); const dt = pl.map((x) => x.date || '').sort().pop(); const srcK = pl.some((x) => /약관/.test(x.src || '')) ? '이용약관' : '홈페이지';
      td0.append(el('small', '', [gr.idx.length > 1 ? '방송구역 ' + gr.idx.length + '곳' : '', srcK + (dt ? ' · ' + dt.slice(2).replace(/-/g, '.') : '')].filter(Boolean).join(' · '))); tr.append(td0);
      const details = [];
      mine.forEach((c) => {
        const vals = gr.idx.map((i) => ({ i, v: c.c[i] })).filter((x) => x.v);
        const td = el('td', 'n');
        if (!vals.length) { td.classList.add('na'); td.textContent = '—'; tr.append(td); return; }
        const cnt = {}; vals.forEach((x) => { cnt[x.v[0]] = (cnt[x.v[0]] || 0) + 1; });
        const mode = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0][0];
        td.append(el('b', '', mode));
        const mv = vals.find((x) => x.v[0] === mode); const pn = mv ? prodOf(D.plats[mv.i], mv.v) : '';
        if (pn) td.append(el('em', 'lu-prod', pn + (mv.v[1] > 0 ? '부터' : ' 포함')));
        if (gr.idx.length > 1) {
          const diff = vals.filter((x) => x.v[0] !== mode).length, miss = gr.idx.length - vals.length;
          if (diff || miss) td.append(el('small', '', [diff ? '다름 ' + diff : '', miss ? '없음 ' + miss : ''].filter(Boolean).join(' · ')));
          else td.append(el('small', '', '전 구역'));
          details.push({ c, vals, mode });
        }
        tr.append(td);
      });
      tb.append(tr);
      if (details.some((d) => d.vals.some((x) => x.v[0] !== d.mode) || d.vals.length < gr.idx.length)) {
        const dr = el('tr', 'det'); const dd = el('td'); dd.colSpan = mine.length + 1;
        const det = el('details'); det.append(el('summary', '', '구역별 번호 보기'));
        const grid = el('div', 'lu-detg');
        gr.idx.forEach((i) => { const box = el('div'); box.append(el('span', '', shortReg(D.plats[i].region))); mine.forEach((c) => { const v = c.c[i]; const m = details.find((d) => d.c === c); box.append(el('b', v && m && v[0] !== m.mode ? 'df' : (v ? '' : 'na'), v ? v[0] : '—')); }); grid.append(box); });
        det.append(grid); dd.append(det); dr.append(dd); tb.append(dr);
      }
    });
    t.append(tb); wrap.append(t); card.append(wrap);
    return card;
  }

  function regionPickers(D, G, state, rerender) {
    const wrap = el('div', 'lu-regs');
    const ops = [...new Set(G.filter((g) => g.idx.length > 1).map((g) => g.op))];
    ops.forEach((op) => {
      const regs = [...new Set(D.plats.filter((p) => p.op === op && p.kind === '케이블' && p.region && p.region !== 'SO 공통').map((p) => p.region))];
      const lab = el('label'); lab.append(op);
      const s = el('select'); regs.forEach((r) => s.append(new Option(r, r))); s.value = state.reg[op] || regs[0];
      s.addEventListener('change', () => { state.reg[op] = s.value; rerender(); });
      lab.append(s); wrap.append(lab);
    });
    return wrap;
  }

  function matrix(D, state, rerender) {
    const box = el('div', 'lu');
    const G = groupsOf(D);
    const bar = el('div', 'lu-card lu-bar');
    const fold = el('div', 'lu-fold'); const sumTxt = [state.k ? (state.k === 'IPTV' || state.k === '위성' ? state.k : '케이블 ' + state.k) : '전체 유형', state.g || '전체 장르', state.q ? '"' + state.q + '"' : ''].filter(Boolean).join(' · ');
    const fb = el('button', '', state.fold ? '필터 펼치기 ▾' : '필터 접기 ▴'); fb.type = 'button'; fb.addEventListener('click', () => { state.fold = !state.fold; rerender(); });
    fold.append(el('b', '', '보기 조건: ' + sumTxt), fb); bar.append(fold);
    if (state.fold) { box.append(bar); }
    const r1 = el('div', 'lu-row'); r1.append(el('b', '', '상품 유형'));
    const tt = el('div', 'lu-type');
    [['', '전체'], ['IPTV', 'IPTV'], ['위성', '위성'], ['디지털', '케이블 디지털'], ['8VSB', '케이블 8VSB'], ['IP', '케이블 IP']].forEach(([k, l]) => { const b = el('button', '', l); b.type = 'button'; b.style.setProperty('--tc', TC[k] || '#334155'); b.setAttribute('aria-pressed', String(state.k === k)); b.addEventListener('click', () => { state.k = k; rerender(); }); tt.append(b); });
    r1.append(tt); bar.append(r1);
    const r2 = el('div', 'lu-row'); r2.append(el('b', '', '방송구역')); r2.append(regionPickers(D, G, state, rerender)); bar.append(r2);
    const r3 = el('div', 'lu-row'); r3.append(el('b', '', '찾기'));
    const inp = el('input', 'lu-in'); inp.type = 'search'; inp.placeholder = '채널 이름 (예: 투니버스, tvN, OCN)'; inp.value = state.q; inp.setAttribute('aria-label', '채널 검색');
    inp.addEventListener('input', () => { clearTimeout(state.t); state.t = setTimeout(() => { state.q = inp.value.trim(); updateBody(); }, 150); });
    const sort = el('select', 'lu-in'); sort.setAttribute('aria-label', '정렬');
    const cols = G.filter((g) => !state.k || g.type === state.k).map((g) => ({ g, i: pick(D, g, state) }));
    [['g', '장르별'], ['n', '이름순'], ['cnt', '편성 많은 순']].concat(cols.map(({ g, i }) => ['p' + i, g.op + ' ' + tlabel(g.p) + ' 번호순'])).forEach(([k, l]) => sort.append(new Option('정렬: ' + l, k)));
    if (![...sort.options].some((o) => o.value === state.s)) state.s = 'g';
    sort.value = state.s; sort.addEventListener('change', () => { state.s = sort.value; rerender(); });
    r3.append(inp, sort); bar.append(r3);
    const gb = el('div', 'lu-g');
    const counts = {}; D.chans.forEach((c) => { if (cols.some(({ i }) => c.c[i])) counts[c.g] = (counts[c.g] || 0) + 1; });
    const mk = (g, l, n) => { const b = el('button'); b.type = 'button'; b.style.setProperty('--gc', GC[g] || '#334155'); b.setAttribute('aria-pressed', String(state.g === g)); b.append(l); if (n != null) b.append(el('small', '', n)); b.addEventListener('click', () => { state.g = state.g === g ? '' : g; rerender(); }); gb.append(b); };
    mk('', '전체 장르', Object.values(counts).reduce((a, b) => a + b, 0));
    GORDER.forEach((g) => { if (counts[g]) mk(g, g, counts[g]); });
    bar.append(gb); if (state.fold) [...bar.children].slice(1).forEach((n) => n.remove()); else box.append(bar);
    const bodyBox = el('div');
    function updateBody() {
      bodyBox.replaceChildren();
      const q = state.q.toLowerCase();
      const rows = D.chans.filter((c) => (!state.g || c.g === state.g) && (!q || (c.n + ' ' + (c.corp || '') + ' ' + (c.al || '')).toLowerCase().includes(q)) && cols.some(({ i }) => c.c[i]));
      if (state.s === 'n') rows.sort((a, b) => a.n.localeCompare(b.n, 'ko'));
      else if (state.s === 'cnt') rows.sort((a, b) => cols.filter(({ i }) => b.c[i]).length - cols.filter(({ i }) => a.c[i]).length || a.n.localeCompare(b.n, 'ko'));
      else if (state.s[0] === 'p') { const pi = +state.s.slice(1); rows.sort((a, b) => numv(a.c[pi]) - numv(b.c[pi])); }
      else rows.sort((a, b) => GORDER.indexOf(a.g) - GORDER.indexOf(b.g) || cols.filter(({ i }) => b.c[i]).length - cols.filter(({ i }) => a.c[i]).length || a.n.localeCompare(b.n, 'ko'));
      bodyBox.append(el('p', 'lu-note', `채널 ${rows.length}개 · 비교 ${cols.length}개 라인업` + (state.g ? ' · ' + state.g : '')));
      const card = el('div', 'lu-card lu-wrap'); const t = el('table', 'lu-t');
      const hr = el('tr'); hr.append(el('th', 'ch', '채널'));
      cols.forEach(({ g, i }) => { const p = D.plats[i]; const th = el('th', 'gl'); th.append(tbadge(p), el('div', '', g.op)); if (p.region) th.append(el('span', 'rb', shortReg(p.region))); hr.append(th); });
      const thd = el('thead'); thd.append(hr); t.append(thd);
      const tb = el('tbody');
      rows.slice(0, state.lim).forEach((c) => {
        const tr = el('tr', ME.test(c.n) && MINE() ? 'me' : '');
        const td0 = el('td', 'ch'); td0.style.setProperty('--gc', GC[c.g] || '#94a3b8'); td0.append(c.n, el('small', '', c.g + (c.corp ? ' · ' + c.corp : ''))); td0.tabIndex = 0; td0.setAttribute('role', 'button'); td0.title = '클릭하면 전체 플랫폼 상세(채널번호·티어)를 봅니다'; td0.addEventListener('click', () => openChannelDetail(D, c)); td0.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openChannelDetail(D, c); } }); tr.append(td0);
        cols.forEach(({ i }) => { const p = D.plats[i]; const v = c.c[i]; const td = el('td', 'gl ' + (v ? 'no' + (v[1] > 0 ? ' t' + Math.min(3, v[1]) : '') : 'na'), v ? v[0] : '—'); const ev = evBadge(D, i, c.n); if (ev) td.append(ev); if (v && v[1] > 0) { const pn = prodOf(p, v); if (pn) { td.append(el('small', 'lu-cp', pn)); td.title = p.prods[v[1]] + '부터 제공'; } } tr.append(td); });
        tb.append(tr);
      });
      t.append(tb); card.append(t); bodyBox.append(card);
      if (rows.length > state.lim) { const more = el('button', 'lu-more', `더 보기 (${rows.length - state.lim}개 더)`); more.type = 'button'; more.addEventListener('click', () => { state.lim += 150; updateBody(); }); bodyBox.append(more); }
      const leg = el('div', 'lu-leg'); leg.append(el('span', '', '숫자 = 채널번호 · — = 해당 라인업에 없음 · 번호 위에 마우스를 올리면 제공 상품이 보입니다'));
      [['#2563eb', '2단계 상품부터'], ['#7c3aed', '3단계 상품부터'], ['#db2777', '4단계 이상'], ['#64748b', '번호 아래 작은 글씨 = 그 상품부터 시청 가능']].forEach(([cl, l]) => { const s = el('i', '', '■ ' + l); s.style.color = cl; leg.append(s); });
      if (D.evidence) leg.append(el('span', '', '✓ = 원문 재검증됨 · ⚠ = 자료 상충(지역별 상이) — 마우스를 올리면 근거가 보입니다'));
      bodyBox.append(leg);
    }
    updateBody();
    box.append(bodyBox);
    return box;
  }

  function byRegion(D, state, rerender) {
    const box = el('div', 'lu');
    const bar = el('div', 'lu-card lu-bar'); const r = el('div', 'lu-row'); r.append(el('b', '', '채널 선택'));
    const sel = el('select', 'lu-in');
    const cands = D.chans.filter((c) => D.plats.some((p, i) => p.kind === '케이블' && c.c[i])).sort((a, b) => (MINE() ? ME.test(b.n) - ME.test(a.n) : 0) || a.n.localeCompare(b.n, 'ko'));
    cands.forEach((c) => sel.append(new Option(c.n + ' (' + c.g + ')', c.n)));
    if (!state.rc) state.rc = (cands[0] || {}).n; sel.value = state.rc;
    sel.addEventListener('change', () => { state.rc = sel.value; rerender(); });
    r.append(sel); bar.append(r); box.append(bar);
    const c = D.chans.find((x) => x.n === state.rc); if (!c) return box;
    const grid = el('div', 'lu-rg');
    groupsOf(D).filter((g) => g.kind === '케이블').forEach((g) => {
      const card = el('div', 'lu-card lu-rgcard'); const h = el('h4'); h.append(tbadge(g.p), g.op); card.append(h);
      const vals = g.idx.map((i) => ({ p: D.plats[i], v: c.c[i] }));
      const cnt = {}; vals.forEach((x) => { if (x.v) cnt[x.v[0]] = (cnt[x.v[0]] || 0) + 1; });
      const mode = (Object.entries(cnt).sort((a, b) => b[1] - a[1])[0] || [''])[0];
      const l = el('div', 'lu-rgl');
      vals.forEach(({ p, v }) => { l.append(el('div', '', p.region)); const n = el('div', v && v[0] !== mode ? 'diff' : '', v ? v[0] + '번' + (v[1] > 0 && p.prods[v[1]] ? ' · ' + p.prods[v[1]] : '') : '미편성'); l.append(n); });
      card.append(l); grid.append(card);
    });
    box.append(grid, el('p', 'lu-note', '주황색 번호는 다른 방송구역과 번호가 다른 곳입니다. 상품명은 해당 채널이 처음 포함되는 상품입니다.'));
    return box;
  }

  function emptyNumbersFor(D, i) {
    // 채널번호는 보통 장르별로 블록(100번대=영화, 200번대=드라마 …)을 미리
    // 떼어두고 그 안에서 채우는 방식이라, 단순히 min~max 사이 빈 숫자를
    // 전부 나열하면 "장르 블록 안의 미사용 예약 구간"까지 수백 개씩 섞여
    // 들어가 영업상 의미가 없다. 그래서 연속된 빈 번호를 "구간(run)"으로
    // 묶어서, 5개 이하로 짧게 비어있는 구간(= 거의 다 찬 블록의 마지막 빈
    // 자리, 영업 걸기 좋은 후보)과 그보다 긴 구간(= 아직 통째로 비어있는
    // 예약 블록)을 구분해서 보여준다.
    const nums = [];
    D.chans.forEach((c) => { const v = c.c[i]; if (v) { const m = String(v[0]).match(/^(\d+)$/); if (m) nums.push(+m[1]); } });
    if (!nums.length) return { min: 0, max: 0, used: 0, runs: [] };
    const min = Math.min(...nums), max = Math.max(...nums), set = new Set(nums), runs = [];
    let i2 = min;
    while (i2 <= max) {
      if (set.has(i2)) { i2++; continue; }
      let j = i2; while (j <= max && !set.has(j)) j++;
      runs.push([i2, j - 1]); i2 = j;
    }
    return { min, max, used: nums.length, runs };
  }

  function emptyView(D, state, rerender) {
    const box = el('div', 'lu');
    box.append(el('p', 'lu-note', '플랫폼별로 실제 쓰이고 있는 채널번호의 최소~최대 구간 안에서, 어느 채널에도 배정되지 않은 번호입니다. "26-2"처럼 복수 피드로 붙는 번호는 집계에서 뺐습니다. 신규 채널 영업 시 빈 자리 후보로 참고하세요.'));
    const r1 = el('div', 'lu-row'); r1.append(el('b', '', '상품 유형'));
    const tt = el('div', 'lu-type');
    [['', '전체'], ['IPTV', 'IPTV'], ['위성', '위성'], ['디지털', '케이블 디지털'], ['8VSB', '케이블 8VSB'], ['IP', '케이블 IP']].forEach(([k, l]) => { const b = el('button', '', l); b.type = 'button'; b.style.setProperty('--tc', TC[k] || '#334155'); b.setAttribute('aria-pressed', String(state.ek === k)); b.addEventListener('click', () => { state.ek = k; rerender(); }); tt.append(b); });
    r1.append(tt); const ebar = el('div', 'lu-card lu-bar'); ebar.append(r1); box.append(ebar);
    const G = groupsOf(D).filter((g) => !state.ek || g.type === state.ek);
    const grid = el('div', 'lu-rg');
    G.forEach((gr) => {
      gr.idx.forEach((i) => {
        const p = D.plats[i];
        const data = emptyNumbersFor(D, i);
        const card = el('div', 'lu-card lu-rgcard');
        const h = el('h4'); h.append(tbadge(p), document.createTextNode(' ' + p.op)); if (p.region) h.append(el('span', 'rb', shortReg(p.region))); card.append(h);
        if (!data.max) card.append(el('p', 'lu-note', '데이터 없음'));
        else if (!data.runs.length) card.append(el('p', 'lu-note', `${data.min}~${data.max}번 구간(사용 ${data.used}개)에 빈 번호 없음`));
        else {
          const short = data.runs.filter((r) => r[1] - r[0] < 5);
          const long = data.runs.filter((r) => r[1] - r[0] >= 5);
          card.append(el('p', 'lu-note', `${data.min}~${data.max}번 구간 · 사용 ${data.used}개`));
          if (short.length) {
            const nums = short.flatMap((r) => { const a = []; for (let n = r[0]; n <= r[1]; n++) a.push(n); return a; });
            card.append(el('p', '', ''), el('p', '', '영업 후보 (짧게 빈 자리)'));
            card.append(el('p', 'lu-note lu-empty-list', nums.join(', ') + '번'));
          }
          if (long.length) {
            card.append(el('p', '', '통째로 빈 블록'));
            card.append(el('p', 'lu-note lu-empty-list', long.map((r) => `${r[0]}~${r[1]}번 (${r[1] - r[0] + 1}개)`).join(' · ')));
          }
        }
        grid.append(card);
      });
    });
    box.append(grid);
    return box;
  }

  function byPlat(D, state, rerender) {
    const box = el('div', 'lu');
    const G = groupsOf(D);
    const bar = el('div', 'lu-card lu-bar'); const r = el('div', 'lu-row'); r.append(el('b', '', '라인업'));
    const gs = el('select', 'lu-in'); G.forEach((g, k) => gs.append(new Option(g.op + ' · ' + tlabel(g.p), String(k)))); gs.value = String(state.pgk || 0);
    gs.addEventListener('change', () => { state.pgk = +gs.value; rerender(); }); r.append(gs);
    const g = G[state.pgk || 0];
    if (g.idx.length > 1) { const rs = el('select', 'lu-in'); g.idx.forEach((i) => rs.append(new Option(D.plats[i].region, D.plats[i].region))); rs.value = D.plats[pick(D, g, state)].region; rs.addEventListener('change', () => { state.reg[g.op] = rs.value; rerender(); }); r.append(rs); }
    bar.append(r);
    const tg = el('div', 'lu-seg'); [[0, '번호순'], [1, '장르별로 묶기']].forEach(([k, l]) => { const b = el('button', '', l); b.type = 'button'; b.setAttribute('aria-pressed', String(state.pg === k)); b.addEventListener('click', () => { state.pg = k; rerender(); }); tg.append(b); }); bar.append(tg);
    box.append(bar);
    const pi = pick(D, g, state), p = D.plats[pi];
    const info = el('div', 'lu-card lu-info'); info.append(tbadge(p), el('b', '', p.op)); if (p.region) info.append(el('span', 'rb', p.region)); info.append(el('span', '', '자료: ' + p.src), el('span', '', '기준: ' + p.basis), el('span', '', '확인일: ' + p.date)); box.append(info);
    const list = D.chans.filter((c) => c.c[pi]).map((c) => ({ c, v: c.c[pi] })).sort((a, b) => numv(a.v) - numv(b.v));
    box.append(el('p', 'lu-note', `편성 채널 ${list.length}개`));
    const groups = state.pg ? GORDER.filter((x) => list.some((y) => y.c.g === x)) : [null];
    groups.forEach((gg) => {
      const items = list.filter((x) => !gg || x.c.g === gg);
      if (gg) { const h = el('h4', 'lu-sub', gg + ' · ' + items.length); h.style.setProperty('--gc', GC[gg]); box.append(h); }
      const grid = el('div', 'lu-list');
      items.forEach(({ c, v }) => { const it = el('div', 'lu-item' + (ME.test(c.n) && MINE() ? ' me' : '')); it.style.setProperty('--gc', GC[c.g] || '#94a3b8'); it.style.cursor = 'pointer'; it.tabIndex = 0; it.setAttribute('role', 'button'); it.title = '클릭하면 전체 플랫폼 상세를 봅니다'; it.addEventListener('click', () => openChannelDetail(D, c)); it.append(el('b', '', v[0]), el('span', '', c.n)); const sm = [c.g]; if (p.prods && p.prods[v[1]] && v[1] > 0) sm.push(p.prods[v[1]] + '부터'); it.append(el('small', '', sm.join(' · '))); grid.append(it); });
      box.append(grid);
    });
    return box;
  }

  window.renderLineup = function (root, D) {
    addStyle();
    const state = root.__lu || (root.__lu = { v: 'mx', q: '', k: '', s: 'g', g: '', lim: 150, pg: 0, pgk: 0, reg: {}, rc: '' });
    const rerender = () => window.renderLineup(root, D);
    const wrap = el('div', 'lu');
    if (MINE()) wrap.append(meCards(D));
    const seg = el('div', 'lu-seg');
    [['mx', '채널 × 플랫폼 비교'], ['rg', '방송구역별 번호'], ['pl', '라인업 전체 보기'], ['em', '빈 채널번호']].forEach(([k, l]) => { const b = el('button', '', l); b.type = 'button'; b.setAttribute('aria-pressed', String(state.v === k)); b.addEventListener('click', () => { state.v = k; rerender(); }); seg.append(b); });
    if (window.pnMineBtn) seg.append(window.pnMineBtn());
    wrap.append(seg);
    wrap.append(state.v === 'mx' ? matrix(D, state, rerender) : state.v === 'rg' ? byRegion(D, state, rerender) : state.v === 'em' ? emptyView(D, state, rerender) : byPlat(D, state, rerender));
    root.replaceChildren(wrap);
  };
})();

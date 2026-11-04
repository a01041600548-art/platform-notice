/* 대가산정 계산기 — 사업자별 모수(공표집 수신료 증감률·산정 방식) 자동 설정
   회사(재능방송) 실제 사용료는 넣지 않는다. 입력값은 저장하지 않는다. */
(function () {
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const num = (v) => { const n = Number(String(v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; };
  const won = (n) => Math.round(n).toLocaleString('ko-KR') + '원';
  const eok = (n) => { const a = Math.abs(n), s = n < 0 ? '-' : ''; if (a >= 1e8) return s + (a / 1e8).toFixed(2).replace(/\.?0+$/, '') + '억원'; if (a >= 1e4) return s + Math.round(a / 1e4).toLocaleString('ko-KR') + '만원'; return s + Math.round(a).toLocaleString('ko-KR') + '원'; };
  const pc = (n, d = 1) => (n >= 0 ? '+' : '') + (n * 100).toFixed(d) + '%';

  /* 사업자별 산정 방식 */
  const IPTV_W = {
    small: [['성과(시청)', .4, '닐슨 시청점유율 30% · IPTV 자체 시청점유율 70%'], ['투자', .2, '제작비 점유율 50% · 구매비 점유율 50% (재산상황공표집)'], ['다양성', .4, '채널평가 편성항목 점수 점유율']],
    large: [['성과(시청)', .5, '닐슨 50% · IPTV 자체 50%'], ['투자', .25, '제작비 60% · 구매비 40%'], ['기여', .25, '홈쇼핑 송출수수료 매출 점유율']],
  };
  const LGU_W = {
    small: [['성과(시청)', .4, 'U+ 셋톱 시청점유율 100% (전체 20% · 장르별 80%)'], ['투자', .2, '제작비 50% · 구매비 50% (각 전체 20% · 장르별 80%)'], ['다양성', .4, 'PP평가 편성항목 점수 → 편성 점유율']],
    large: IPTV_W.large,
  };
  const CABLE_W = [['시청점유율', .5, '가정치 — 개정안에 가중치 미공개'], ['채널평가', .5, '가정치 — 개정안에 가중치 미공개']];
  const OPS = [
    { id: 'kt', name: 'KT', kind: 'iptv', fin: '케이티', W: IPTV_W, src: 'IPTV 3사 공통 산정 방안(2024.1)' },
    { id: 'skb', name: 'SK브로드밴드', kind: 'iptv', fin: '에스케이브로드밴드', W: IPTV_W, src: 'SK브로드밴드 공지 「콘텐츠 사용료 산정 방안」(2024.1.19)' },
    { id: 'lgu', name: 'LG유플러스', kind: 'iptv', fin: '엘지유플러스', W: LGU_W, src: 'IPTV 3사 공통 산정 방안 · LG유플러스 산정서 항목 구조' },
    { id: 'lghv', name: 'LG헬로비전', kind: 'cable', grp: 'LG계열' },
    { id: 'skbc', name: 'SKB 케이블', kind: 'cable', grp: 'SKBB계열' },
    { id: 'dlive', name: '딜라이브', kind: 'cable', grp: '딜라이브계열' },
    { id: 'hcn', name: 'HCN', kind: 'cable', grp: 'HCN계열' },
    { id: 'cmb', name: 'CMB', kind: 'cable', grp: 'CMB계열' },
    { id: 'iso', name: '개별 SO', kind: 'cable', grp: '개별 SO' },
  ];

  function params(op, FIN) {
    const C = (FIN && (FIN.companies || FIN)) || [];
    const v = (c, y, k) => ((c.y || {})[y] || {})[k] || 0;
    const sum = (rows, y, k) => rows.reduce((t, c) => t + v(c, y, k), 0);
    let rows = [];
    if (op.kind === 'iptv') rows = C.filter((c) => c.name === op.fin);
    else rows = C.filter((c) => c.media === 'SO' && c.group === op.grp);
    const g = (k) => { const a = sum(rows, '2024', k), b = sum(rows, '2025', k); return a ? b / a - 1 : null; };
    return { basic: g('basicfee'), hs: g('hsfee'), prog: g('basicprog'), n: rows.length,
      basicAmt: sum(rows, '2025', 'basicfee') * 1e6, progAmt: sum(rows, '2025', 'basicprog') * 1e6 };
  }

  const css = `
  .cx { display: flex; flex-direction: column; gap: 1.3em; }
  .cx-ops { display: flex; flex-wrap: wrap; gap: .4em; }
  .cx-ops .cx-grp { font-size: .74em; font-weight: 700; letter-spacing: .1em; color: var(--ink2); width: 100%; margin-top: .3em; }
  .cx-ops button { font: inherit; font-weight: 600; font-size: .92em; padding: .5em .95em; border: 1px solid var(--line); border-radius: 3px; background: var(--card); color: var(--ink); cursor: pointer; }
  .cx-ops button[aria-pressed="true"] { background: var(--ink); color: var(--card); border-color: var(--ink); }
  .cx-how { background: var(--card); border: 1px solid var(--line); border-radius: 6px; padding: .9em 1.2em; }
  .cx-how summary { cursor: pointer; font-weight: 700; }
  .cx-how ol { margin: .8em 0 .4em; padding-left: 1.3em; display: flex; flex-direction: column; gap: .45em; font-size: .92em; line-height: 1.6; }
  .cx-how .f { font-family: ui-monospace, Menlo, monospace; font-size: .86em; background: var(--bg); border: 1px solid var(--line); padding: .5em .7em; border-radius: 4px; margin: .5em 0 0; line-height: 1.7; white-space: pre-wrap; }
  .cx-grid { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: 1.2em; align-items: start; }
  .cx-card { background: var(--card); border: 1px solid var(--line); border-radius: 6px; padding: 1.2em 1.3em; display: flex; flex-direction: column; gap: .9em; }
  .cx-card h3 { margin: 0; font-size: 1.02em; font-weight: 700; padding-bottom: .6em; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; gap: .5em; flex-wrap: wrap; }
  .cx-card h3 small { font-weight: 600; color: var(--ink2); font-size: .8em; }
  .cx-f { display: grid; grid-template-columns: minmax(0, 1fr) 11em; gap: .45em 1em; align-items: center; }
  .cx-f label { font-size: .9em; font-weight: 600; }
  .cx-f label small { display: block; color: var(--ink2); font-weight: 500; font-size: .84em; margin-top: .1em; }
  .cx-f input, .cx-f select { font: inherit; text-align: right; padding: .5em .7em; border: 1px solid var(--line); border-radius: 4px; background: var(--bg); color: var(--ink); width: 100%; min-width: 0; font-variant-numeric: tabular-nums; }
  .cx-f select { text-align: left; }
  .cx-f input:focus, .cx-f select:focus { outline: 2px solid color-mix(in srgb, var(--ink) 25%, transparent); border-color: var(--ink); }
  .cx-f input.auto { background: color-mix(in srgb, #b08d57 9%, var(--card)); }
  .cx-sub { grid-column: 1 / -1; font-size: .76em; font-weight: 700; letter-spacing: .08em; color: var(--ink2); margin-top: .4em; padding-top: .5em; border-top: 1px dashed var(--line); }
  .cx-mo { width: 100%; border-collapse: collapse; font-size: .88em; }
  .cx-mo td, .cx-mo th { padding: .45em .3em; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
  .cx-mo th { color: var(--ink2); font-weight: 600; font-size: .85em; }
  .cx-mo td.r { text-align: right; font-weight: 700; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .cx-mo td small { color: var(--ink2); }
  .cx-res { border-top: 2px solid var(--ink); }
  .cx-big { display: flex; flex-wrap: wrap; align-items: baseline; gap: .2em .8em; }
  .cx-big b { font-size: 2em; font-weight: 600; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
  .cx-big span { font-weight: 700; } .cx-up { color: #15803d; } .cx-dn { color: #c2410c; }
  .cx-t { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; font-size: .92em; }
  .cx-t td, .cx-t th { padding: .5em .3em; border-bottom: 1px solid var(--line); text-align: right; }
  .cx-t th { color: var(--ink2); font-weight: 600; font-size: .85em; }
  .cx-t td:first-child, .cx-t th:first-child { text-align: left; }
  .cx-t tr.tot td { font-weight: 700; border-top: 1px solid var(--ink); border-bottom: 0; }
  .cx-flag { font-size: .86em; padding: .6em .8em; border-left: 2px solid #c2410c; background: color-mix(in srgb, #c2410c 6%, transparent); line-height: 1.6; }
  .cx-flag.ok { border-left-color: #15803d; background: color-mix(in srgb, #15803d 6%, transparent); }
  .cx-note { font-size: .84em; color: var(--ink2); line-height: 1.65; margin: 0; } .cx-note b { color: var(--ink); }
  details.cx-chk { border-top: 1px solid var(--line); padding-top: .8em; }
  details.cx-chk summary { cursor: pointer; font-weight: 700; font-size: .95em; }
  .cx-src { font-size: .8em; color: var(--ink2); border-top: 1px solid var(--line); padding-top: .8em; line-height: 1.7; } .cx-src a { color: var(--ink2); }
  .cx-aud { border-top: 2px solid #b08d57; }
  .cx-ck { display: flex; flex-direction: column; gap: .6em; }
  .cx-ckh { font-weight: 700; font-size: .95em; }
  .cx-cks { display: flex; flex-wrap: wrap; gap: .4em; font-size: .85em; font-weight: 700; }
  .cx-cks span { padding: .3em .7em; border-radius: 999px; border: 1px solid var(--line); }
  .cx-cks .ok, .cx-ck li.ok i { color: #15803d; } .cx-cks .warn, .cx-ck li.warn i { color: #c2410c; } .cx-cks .info, .cx-ck li.info i { color: #1d4ed8; }
  .cx-ck ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .45em; }
  .cx-ck li { display: flex; gap: .6em; padding: .6em .75em; border: 1px solid var(--line); border-radius: 6px; font-size: .9em; line-height: 1.5; }
  .cx-ck li.warn { border-color: color-mix(in srgb, #c2410c 45%, var(--line)); background: color-mix(in srgb, #c2410c 6%, transparent); }
  .cx-ck li i { font-style: normal; font-weight: 800; }
  .cx-ck li small { display: block; color: var(--ink2); margin-top: .15em; }
  @media (max-width: 900px) { .cx-grid { grid-template-columns: 1fr; } .cx-f { grid-template-columns: minmax(0, 1fr) 9.5em; } .cx-big b { font-size: 1.6em; } }`;

  const fld = (box, label, val, sub, cls) => { const l = el('label'); l.append(label); if (sub) l.append(el('small', '', sub)); const i = el('input'); i.inputMode = 'decimal'; i.value = val; if (cls) i.className = cls; box.append(l, i); return i; };
  const sel = (box, label, opts, val, sub) => { const l = el('label'); l.append(label); if (sub) l.append(el('small', '', sub)); const s = el('select'); opts.forEach(([v, t]) => s.append(new Option(t, v))); s.value = val; box.append(l, s); return s; };
  const money = (i) => i.addEventListener('blur', () => { const n = num(i.value); i.value = n ? n.toLocaleString('ko-KR') : ''; });

  function howto() {
    const d = el('details', 'cx-how'); d.innerHTML = `<summary>계산기 사용 방법</summary>
      <ol>
        <li><b>사업자를 고릅니다.</b> 고르면 그 사업자의 <b>모수</b>(배분 재원 증감률·보장률·지표 가중치)가 자동으로 채워집니다. 재원 증감률은 2025년도 재산상황 공표집의 기본채널 수신료매출(케이블은 계열 SO 합계) 전년 대비 증감률입니다. 금색 칸은 자동값이며 고칠 수 있습니다.</li>
        <li><b>전년 사용료</b>에 해당 사업자에서 받은 작년 연간 금액을 넣습니다. 이 사이트에는 회사의 실제 금액을 저장하지 않으며, 입력값도 화면을 닫으면 사라집니다.</li>
        <li><b>지표 변화</b>에 작년 대비 우리 채널의 점유율이 얼마나 변했다고 보는지 넣습니다. 예: 시청점유율이 10% 늘었다면 10, 편성점수가 5% 줄었다면 -5. 모르면 0(작년과 같음)으로 둡니다.</li>
        <li>오른쪽에서 <b>올해 추정 금액</b>과 보장분·평가분 구성을 확인합니다. 케이블은 투자·홀드백 가점과 동시 유통 감점도 고를 수 있습니다.</li>
        <li>사업자에게서 <b>산정서(대가산정 결과)</b>를 받았다면 아래 <b>‘받은 산정서 점검’</b>에 적힌 숫자를 그대로 옮겨 넣으세요. 산식을 다시 계산해서 <b>✔ 맞음 · ⚠ 확인 필요 · ℹ 참고</b>로 바로 표시합니다. IPTV는 항목별 배분액형, 케이블은 채널군(대형·중소) 총액형입니다.</li>
      </ol>
      <div class="f">올해 사용료 = 보장분 + 평가분 (+ 가점 − 감점)
보장분 = 전년 사용료 × 보장률
평가분 = (전년 사용료 × (1 + 재원 증감률) − 보장분) × 평가 지수
평가 지수 = Σ 지표 가중치 × (1 + 지표 점유율 변화)</div>`;
    return d;
  }

  function render(root, FIN, state) {
    const op = OPS.find((o) => o.id === state.op);
    const P = params(op, FIN);
    root.replaceChildren();
    const g = el('div', 'cx-grid'); const L = el('div', 'cx-card'); const R = el('div', 'cx-card cx-res');
    g.append(L, R); root.append(g);
    L.append(Object.assign(el('h3'), { innerHTML: '모수 · 입력 <small>' + op.name + (op.kind === 'cable' ? ' (계열 SO ' + P.n + '개사)' : '') + '</small>' }));
    const f = el('div', 'cx-f'); L.append(f);
    let type = { value: 'small' };
    if (op.kind === 'iptv') type = sel(f, '사업자 구분', [['small', '보호대상 중소 PP'], ['large', '대형 콘텐츠사업자']], state.type || 'small', '방송사업매출 누적 점유율 90% 이상 구간 = 보호대상');
    const W = op.kind === 'iptv' ? op.W[type.value] : CABLE_W;
    const rDef = op.kind === 'iptv' ? (type.value === 'large' && P.basic != null && P.hs != null ? null : P.basic) : P.basic;
    let rAuto;
    if (op.kind === 'iptv' && type.value === 'large') {
      // 대형: (기본채널 수신료매출 + 홈쇼핑 송출수수료) 합계 증감률
      const C = (FIN && (FIN.companies || FIN)) || []; const c = C.find((x) => x.name === op.fin);
      const vv = (y, k) => ((c && c.y[y]) || {})[k] || 0; const a = vv('2024', 'basicfee') + vv('2024', 'hsfee'), b = vv('2025', 'basicfee') + vv('2025', 'hsfee');
      rAuto = a ? b / a - 1 : 0;
    } else rAuto = rDef != null ? rDef : 0;
    f.append(el('div', 'cx-sub', '모수 (자동 설정)'));
    const r = fld(f, '배분 재원 증감률(%)', (rAuto * 100).toFixed(2), op.kind === 'iptv' ? (type.value === 'large' ? '기본채널 수신료매출+홈쇼핑 송출수수료 증감 (공표집 2025/2024)' : '기본채널 수신료매출 증감 (공표집 2025/2024)') : '계열 SO 기본채널 수신료매출 증감 (공표집 2025/2024)', 'auto');
    const gDef = op.kind === 'iptv' ? 90 : 80;
    const gi = fld(f, '보장률(%)', String(gDef), op.kind === 'iptv' ? '전년 금액 중 평가 없이 지급되는 비율 · 각사 산정서로 확인' : 'KCTA 2026 개정안: 매년 전년의 80% 보장', 'auto');
    let cy = null;
    if (op.kind === 'cable') cy = sel(f, '보장 기준', [['new', '2026 개정안 · 매년 80%'], ['1', '기존 1년차 · 80%'], ['2', '기존 2년차 · 60%'], ['3', '기존 3년차 · 40%'], ['4', '기존 4년차 이후 · 0%']], 'new');
    // 모수 표
    const mo = el('table', 'cx-mo'); mo.innerHTML = '<thead><tr><th>평가 지표</th><th>반영 방식</th><th style="text-align:right">가중치</th></tr></thead>';
    const mb = el('tbody'); W.forEach(([n, w, d]) => { const tr = el('tr'); tr.append(el('td', '', n), Object.assign(el('td'), { innerHTML: '<small>' + d + '</small>' }), el('td', 'r', Math.round(w * 100) + '%')); mb.append(tr); }); mo.append(mb);
    const moWrap = el('div'); moWrap.style.gridColumn = '1 / -1'; moWrap.append(mo); f.append(moWrap);
    f.append(el('div', 'cx-sub', '우리 채널 입력'));
    const prev = fld(f, '전년 사용료(원)', '', '이 사업자에서 받은 작년 연간 금액'); prev.placeholder = '예: 100,000,000'; money(prev);
    const dIn = W.map(([n]) => fld(f, n + ' 점유율 변화(%)', '0', '작년 대비 · 모르면 0'));
    let inv = null, hb = null, pen = null;
    if (op.kind === 'cable') {
      f.append(el('div', 'cx-sub', '가점 · 감점 (KCTA 2026 개정안)'));
      inv = sel(f, '제작·구매비 증가율', [['0', '10% 미만 · 0%'], ['3', '10~30% · +3%'], ['6', '30~50% · +6%'], ['9', '50~70% · +9%'], ['12', '70~90% · +12%'], ['15', '90% 이상 · +15%']], '0');
      hb = fld(f, '홀드백 가점(%)', '0', '다음날 0시까지 홀드백 시 1~10%');
      pen = sel(f, '동시·조기 유통', [['0', '해당 없음'], ['5', '다음날 0시 전 VOD 공개 · -5%'], ['7', '실시간 동시 송출 · -7%']], '0');
    }
    const inputs = [type, r, gi, cy, prev, ...dIn, inv, hb, pen].filter(Boolean);
    if (type.addEventListener) type.addEventListener('change', () => { state.type = type.value; render(root, FIN, state); });

    const calc = () => {
      const Pv = num(prev.value);
      let gr = num(gi.value) / 100;
      if (cy) { gr = ({ new: .8, 1: .8, 2: .6, 3: .4, 4: 0 })[cy.value]; gi.value = String(Math.round(gr * 100)); }
      const rr = num(r.value) / 100;
      const idx = W.reduce((t, [, w], k) => t + w * (1 + num(dIn[k].value) / 100), 0);
      const fixed = Pv * gr, pool = Math.max(0, Pv * (1 + rr) - fixed), evalPart = pool * idx;
      let base = fixed + evalPart; const add = inv ? base * (num(inv.value) + num(hb.value)) / 100 : 0; const minus = pen ? base * num(pen.value) / 100 : 0;
      let cur = base + add - minus, floored = false; if (cur < fixed) { cur = fixed; floored = true; }
      const d = cur - Pv;
      R.replaceChildren(Object.assign(el('h3'), { innerHTML: '결과 · 올해 추정 사용료 <small>' + op.name + '</small>' }));
      if (!Pv) { R.append(el('p', 'cx-note', '왼쪽 “전년 사용료”를 입력하면 계산됩니다. 모수는 사업자를 고르면 자동으로 들어갑니다.')); }
      else {
        const big = el('div', 'cx-big'); big.append(el('b', '', won(cur)), el('span', d >= 0 ? 'cx-up' : 'cx-dn', (d >= 0 ? '▲ ' : '▼ ') + eok(Math.abs(d)) + ' (' + pc(d / Pv) + ')')); R.append(big);
        const t = el('table', 'cx-t'); t.innerHTML = '<thead><tr><th>구성</th><th>금액</th></tr></thead>'; const tb = el('tbody');
        const row = (a, b, c) => { const tr = el('tr', c || ''); tr.append(el('td', '', a), el('td', '', b)); tb.append(tr); };
        row('① 보장분 (전년 × ' + Math.round(gr * 100) + '%)', won(fixed));
        row('② 평가 재원 (전년 × (1' + (rr >= 0 ? '+' : '') + (rr * 100).toFixed(2) + '%) − ①)', won(pool));
        row('③ 평가분 (② × 지수 ' + (idx * 100).toFixed(1) + '%)', won(evalPart));
        if (add) row('④ 투자·홀드백 가점', won(add)); if (minus) row('⑤ 동시·조기 유통 감점', '-' + won(minus));
        if (floored) row('보장 하한 적용', won(fixed));
        row('올해 추정 (① + ③' + (add ? ' + ④' : '') + (minus ? ' − ⑤' : '') + ')', won(cur), 'tot'); t.append(tb); R.append(t);
        R.append(Object.assign(el('div', 'cx-flag' + (d >= 0 ? ' ok' : '')), { innerHTML: '<b>읽는 법</b> — 재원이 ' + pc(rr, 2) + ' 변하고 평가 지수가 ' + (idx * 100).toFixed(1) + '%이면 작년보다 ' + pc(d / Pv) + '. 지수가 100%면 작년 점유율을 유지한다는 뜻입니다.' }));
      }
      R.append(Object.assign(el('p', 'cx-note'), { innerHTML: '<b>참고</b> — 평가분은 가중치가 아니라 각 지표 안에서 우리 채널이 차지하는 <b>점유율</b>로 나뉩니다. 이 계산기는 “작년 점유율 대비 변화”로 근사하므로, 실제 금액은 각사 산정서로 확정됩니다.' }));
    };
    inputs.forEach((i) => i.addEventListener && i.addEventListener('input', calc)); calc();

    const src = el('div', 'cx-src');
    src.innerHTML = op.kind === 'iptv'
      ? '<b>근거</b> — ' + op.src + '. 배분 대상 금액: 보호대상 = 전년 × (1 + 기본채널 수신료매출 증감률), 대형 = 전년 × (1 + 기본채널 수신료매출+홈쇼핑 송출수수료 증감률). 보호대상 중소 PP는 단계적 적용으로 보장분을 둡니다. 재원 증감률 기본값은 2025년도 방송사업자 재산상황 공표집(2025 실적, 2024 대비). 참고: <a href="https://www.bworld.co.kr/m/customer/notice/view.do?menu_id=C05010000&nt_keynum=2299" target="_blank" rel="noopener">SK브로드밴드 산정 방안 공지</a>'
      : '<b>근거</b> — 한국케이블TV방송협회 2026 SO 콘텐츠 대가산정 기준 개정안(2026.8.13 설명회·9.4 의견수렴): 전년 80% 매년 보장, 잔여 재원에 시청점유율·채널평가 적용, 투자 증가율별 3~15% 가점, 홀드백 1~10% 가점, 동시송출 -7%·조기 VOD -5% 감점(보장 하한 우선). 시청점유율·채널평가 가중치는 공개되지 않아 50:50으로 가정했습니다. 재원 증감률 기본값은 공표집의 계열 SO 기본채널 수신료매출 합계 증감률입니다.';
    root.append(audit(op, P, W, type.value, r));
    root.append(src);
  }


  /* ── 받은 산정서 점검 ── */
  const OK = 'ok', WARN = 'warn', INFO = 'info';
  function audit(op, P, W, typ, rIn) {
    const card = el('div', 'cx-card cx-aud');
    card.append(Object.assign(el('h3'), { innerHTML: '받은 산정서 점검 <small>숫자를 옮겨 넣으면 오류·확인 사항을 자동으로 표시 · 저장되지 않음</small>' }));
    const g2 = el('div', 'cx-grid'); const f = el('div', 'cx-f'); const out = el('div', 'cx-ck'); g2.append(f, out); card.append(g2);
    const ins = [];
    const F = (label, sub, m) => { const i = fld(f, label, '', sub); if (m) money(i); ins.push(i); return i; };
    const res = (list) => {
      out.replaceChildren(el('div', 'cx-ckh', '점검 결과'));
      if (!list.length) { out.append(el('p', 'cx-note', '왼쪽에 산정서 숫자를 넣으면 여기에 결과가 나옵니다. 빈칸은 건너뜁니다.')); return; }
      const n = { ok: 0, warn: 0, info: 0 }; list.forEach((x) => n[x[0]]++);
      const sm = el('div', 'cx-cks'); sm.append(el('span', 'ok', '✔ 맞음 ' + n.ok), el('span', 'warn', '⚠ 확인 필요 ' + n.warn), el('span', 'info', 'ℹ 참고 ' + n.info)); out.append(sm);
      const ul = el('ul'); list.sort((a, b) => ({ warn: 0, info: 1, ok: 2 })[a[0]] - ({ warn: 0, info: 1, ok: 2 })[b[0]]).forEach(([k, t, d]) => { const li = el('li', k); li.append(el('i', '', k === OK ? '✔' : k === WARN ? '⚠' : 'ℹ')); const sp = el('div'); sp.append(el('b', '', t)); if (d) sp.append(el('small', '', d)); li.append(sp); ul.append(li); }); out.append(ul);
      if (n.warn) out.append(el('p', 'cx-note', '⚠ 항목은 사업자에게 산식·원자료(점유율 원값, 재원 총액, 반올림 방식)를 요청해 확인하세요.'));
    };
    const near = (a, b, tol) => Math.abs(a - b) <= tol;
    const f0 = (x, d = 0) => x.toLocaleString('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: d });
    const rr = () => num(rIn.value) / 100;

    if (op.kind === 'iptv') {
      f.append(el('div', 'cx-sub', 'IPTV 산정서 (항목별 배분액형 · 원 단위)'));
      const prev = F('전년(\'25년) 금액', '산정서의 전년 금액', 1), cur = F('올해(\'26년) 금액', '산정서의 올해 금액', 1), rate = F('산정서 증감률(%)', '적혀 있으면 입력');
      // 지표 항목: 투자는 제작·구매로 나눔
      const items = []; W.forEach(([n, w]) => { if (n === '투자') { const a = typ === 'large' ? [.6, .4] : [.5, .5]; items.push(['제작비', w * a[0]], ['구매비', w * a[1]]); } else items.push([n, w]); });
      const it = items.map(([n, w]) => [n, w, F(n + ' 배분액', '가중치 ' + Math.round(w * 1000) / 10 + '%', 1)]);
      const tot = F('배분 총액(산정서)', '적혀 있으면 입력', 1);
      const run = () => {
        const Pv = num(prev.value), AC = num(cur.value), A = it.map((x) => num(x[2].value)), sa = A.reduce((t, x) => t + x, 0), L = [];
        if (num(tot.value) && sa) L.push(near(num(tot.value), sa, 2) ? [OK, '항목별 배분액 합계 = 배분 총액', won(sa)] : [WARN, '항목 합계와 배분 총액이 다릅니다', '항목 합계 ' + won(sa) + ' · 총액 ' + won(num(tot.value)) + ' · 차이 ' + won(num(tot.value) - sa)]);
        if (Pv && AC && num(rate.value)) { const c = AC / Pv - 1; L.push(near(c * 100, num(rate.value), .006) ? [OK, '증감률 표기 일치', pc(c, 2)] : [WARN, '증감률 표기가 계산과 다릅니다', '계산 ' + pc(c, 3) + ' · 표기 ' + num(rate.value) + '%']); }
        if (Pv && AC && sa) {
          const g = (AC - sa) / Pv, gN = Math.round(g * 1000) / 1000;
          L.push(near(g, gN, .0005) ? [OK, '보장률 ' + (gN * 100).toFixed(1) + '% 적용 확인', '(올해 − 배분 총액) ÷ 전년 = ' + (g * 100).toFixed(3) + '%'] : [WARN, '보장률이 딱 떨어지지 않습니다', '역산 ' + (g * 100).toFixed(3) + '% — 보장률·배분액 중 하나가 표와 다를 수 있음']);
          if (gN < .8 || gN > 1) L.push([WARN, '보장률이 일반 범위(80~100%)를 벗어남', (gN * 100).toFixed(1) + '%']);
          const raw = Pv * gN + sa, ms = [['월 천원 올림 ×12', Math.ceil(raw / 12 / 1000) * 1000 * 12], ['월 천원 반올림 ×12', Math.round(raw / 12 / 1000) * 1000 * 12], ['월 천원 내림 ×12', Math.floor(raw / 12 / 1000) * 1000 * 12], ['연 천원 반올림', Math.round(raw / 1000) * 1000], ['원 단위 그대로', Math.round(raw)]];
          const hit = ms.find(([, x]) => x === AC);
          L.push(hit ? [OK, '계산 재현: ' + hit[0] + ' 방식과 원 단위까지 일치', '전년×' + (gN * 100).toFixed(1) + '% + 배분 총액 = ' + won(raw) + ' → ' + won(AC)] : [WARN, '어떤 반올림 방식으로도 산정서 금액이 재현되지 않습니다', '재구성 ' + won(raw) + ' · 산정서 ' + won(AC) + ' · 차이 ' + won(AC - raw)]);
          // 지표별 지수
          const pool = Pv * (1 + rr()) - Pv * gN;
          if (pool > 0) {
            L.push([INFO, '재원 증감률 ' + pc(rr(), 2) + ' 기준 전년 수준 평가분 ' + won(pool), '실제 배분 총액 ' + won(sa) + ' → 지수 ' + (sa / pool * 100).toFixed(0) + '% (100% = 작년 점유율 유지)']);
            it.forEach(([n, w], k) => { if (!A[k]) return; const x = A[k] / (pool * w); if (x < .5) L.push([WARN, n + ' 배분액이 전년 수준의 ' + (x * 100).toFixed(0) + '%', won(A[k]) + ' (전년 수준 ' + won(pool * w) + ') — 점유율 원값·집계 누락·장르 매칭 확인']); else if (x > 2) L.push([INFO, n + ' 배분액이 전년 수준의 ' + (x * 100).toFixed(0) + '%', '크게 늘어난 항목 — 근거 자료 보관 권장']); else L.push([OK, n + ' 지수 ' + (x * 100).toFixed(0) + '%', won(A[k])]); });
          }
          const ch = AC / Pv - 1; if (ch < gN - 1 - 1e-9) L.push([WARN, '보장 하한보다 적게 지급', '증감률 ' + pc(ch, 2)]);
        }
        res(L);
      };
      ins.forEach((i) => i.addEventListener('input', run)); run();
    } else {
      f.append(el('div', 'cx-sub', '① 채널군 모수 (산정서 표 · 백만원)'));
      const grp = sel(f, '채널군', [['중소', '중소'], ['대형', '대형']], '중소'); ins.push(grp);
      const prevT = F('채널군 전년 총액', '적혀 있지 않으면 비워 두세요(보장액으로 역산)'), corr = F('1단계 보정옵션(%)', '예: -9.09'), s1 = F('1단계 채널군 총액'), gRate = F('보장률(%)', '예: 80'); gRate.value = '80';
      const a = F('전년도 보장 (a)'), r0 = F('잔여 배분 (조정 전)'), perf = F('시청점유율 증감 성과(%)', '예: 1.34'), adj = F('조정 금액'), b = F('잔여 배분 (조정 후, b)'), s2 = F('2단계 총액 (a+b)');
      f.append(el('div', 'cx-sub', '② 채널 배분 (우리 채널)'));
      const w1 = F('지표1 가중치(%)', '예: 시청데이터 40'), p1 = F('지표1 점유율(%)'), w2 = F('지표2 가중치(%)', '예: 평가점수 60'), p2 = F('지표2 점유율(%)'), sh = F('채널 배분 비율(%)'), chg = F('최종 증감률(%)', '예: -17.03'), pv = F('채널 전년 금액(선택)', '넣으면 금액까지 재계산', 1);
      w1.value = '40'; w2.value = '60';
      const run = () => {
        const L = [], G = num(gRate.value) / 100 || .8, T = num(prevT.value), A = num(a.value), S1 = num(s1.value), R0 = num(r0.value), B = num(b.value), S2 = num(s2.value), AJ = num(adj.value), PF = num(perf.value) / 100, C = num(corr.value) / 100;
        const T0 = T || (A ? A / G : 0);
        if (A && !T) L.push([INFO, '채널군 전년 총액(역산) ' + f0(T0) + '백만원', '보장액 ' + f0(A) + ' ÷ ' + Math.round(G * 100) + '%']);
        if (A && T) L.push(near(A, T * G, .6) ? [OK, '보장액 = 전년 총액 × ' + Math.round(G * 100) + '%', f0(A)] : [WARN, '보장액이 전년 총액 × 보장률과 다릅니다', '계산 ' + f0(T * G, 1) + ' · 표기 ' + f0(A)]);
        if (T0 && S1) { const c = S1 / T0 - 1; L.push(!corr.value ? [INFO, '1단계 증감률 ' + pc(c, 2), '전년 총액 대비'] : near(c, C, .0006) ? [OK, '1단계 총액 = 전년 총액 × (1' + (C >= 0 ? '+' : '') + (C * 100).toFixed(2) + '%)', f0(S1)] : [WARN, '1단계 총액이 보정옵션과 맞지 않습니다', '실제 ' + pc(c, 2) + ' · 표기 ' + (C * 100).toFixed(2) + '%']);
          if (Math.abs(S1 * 1.1 - T0) / T0 < .0007) L.push([INFO, '보정옵션 = 전년 총액 ÷ 1.1 (10%를 깎은 게 아니라 1.1로 나눈 값)', '근거 문구 요청 권장']);
          if (P.basic != null) { const gap = c - P.basic; L.push([Math.abs(gap) > .03 ? WARN : INFO, '공표집 계열 기본채널 수신료매출 ' + pc(P.basic, 2) + ' vs 1단계 ' + pc(c, 2), Math.abs(gap) > .03 ? '수신료 매출 흐름과 ' + (gap * 100).toFixed(1) + '%p 차이 — 대형·중소 재원 배분 근거 요청' : '수신료 흐름과 비슷']); } }
        if (S1 && A && R0) L.push(near(R0, S1 - A, 1.01) ? [OK, '잔여 배분(조정 전) = 1단계 − 보장', f0(R0)] : [WARN, '잔여 배분(조정 전)이 1단계 − 보장과 다릅니다', f0(S1) + ' − ' + f0(A) + ' = ' + f0(S1 - A) + ' 인데 표기 ' + f0(R0) + ' (차이 ' + f0(R0 - (S1 - A)) + ')']);
        if (R0 && AJ && B) L.push(near(B, R0 + AJ, 1.01) ? [OK, '조정 후 잔여 = 조정 전 + 조정 금액', f0(B)] : [WARN, '조정 후 잔여가 맞지 않습니다', f0(R0) + ' + ' + f0(AJ) + ' ≠ ' + f0(B)]);
        if (A && B && S2) L.push(near(S2, A + B, 1.01) ? [OK, '2단계 총액 = 보장 + 조정 후 잔여', f0(S2)] : [WARN, '2단계 총액이 a+b와 다릅니다', f0(A + B) + ' vs ' + f0(S2)]);
        if (AJ && PF) { const base = AJ / PF, cand = [['전년 총액', T0], ['1단계 총액', S1], ['보장액', A], ['잔여(조정 전)', R0], ['2단계 총액', S2]].filter(([, x]) => x); const m = cand.find(([, x]) => Math.abs(x * PF - AJ) <= .5); L.push(m ? [OK, '조정 금액 = ' + m[0] + ' × 성과 ' + (PF * 100).toFixed(2) + '%', f0(m[1] * PF, 1)] : [WARN, '조정 금액의 산식을 알 수 없습니다', f0(AJ) + ' ÷ ' + (PF * 100).toFixed(2) + '% = 기준 ' + f0(base) + ' — 표의 어떤 금액과도 맞지 않음']); }
        if (S2 && T0) L.push([INFO, '채널군 최종 증감 ' + pc(S2 / T0 - 1, 2), '전년 ' + f0(T0) + ' → ' + f0(S2) + '백만원']);
        const W1 = num(w1.value) / 100, W2 = num(w2.value) / 100, P1 = num(p1.value), P2 = num(p2.value), SH = num(sh.value);
        if (SH && (P1 || P2)) { const c = W1 * P1 + W2 * P2; L.push(near(c, SH, .0051) ? [OK, '채널 배분 비율 = 가중합', f0(W1 * 100) + '%×' + P1 + ' + ' + f0(W2 * 100) + '%×' + P2 + ' = ' + c.toFixed(3) + '%'] : [WARN, '채널 배분 비율이 가중합과 다릅니다', '계산 ' + c.toFixed(3) + '% · 표기 ' + SH + '%']); }
        const CH = chg.value ? num(chg.value) / 100 : null;
        if (CH != null && CH < G - 1 - 1e-9) L.push([WARN, '보장 하한(' + Math.round(G * 100) + '%)보다 더 깎였습니다', '증감률 ' + pc(CH, 2)]);
        if (B && SH && CH != null) {
          const PV = num(pv.value), add = B * SH / 100 * 1e6;
          if (PV) { const exp = PV * G + add, ec = exp / PV - 1; L.push(near(ec, CH, .0006) ? [OK, '채널 금액 재현: 전년×' + Math.round(G * 100) + '% + b×배분비율', won(exp) + ' (' + pc(ec, 2) + ')'] : [WARN, '채널 증감률이 재현되지 않습니다', '계산 ' + won(exp) + ' (' + pc(ec, 2) + ') · 표기 ' + pc(CH, 2) + ' — 채널별 산식이 다를 수 있음']); }
          else if ((1 + CH) - G > 0) { const imp = add / ((1 + CH) - G); L.push([INFO, '이 산식이 맞다면 채널 전년 금액은 약 ' + eok(imp), '실제 전년 계약 금액과 같으면 계산 오류 없음 (전년×' + Math.round(G * 100) + '% + b×배분비율 가정)']); }
        }
        res(L);
      };
      ins.forEach((i) => i.addEventListener(i.tagName === 'SELECT' ? 'change' : 'input', run)); run();
    }
    return card;
  }

  window.renderCalc = function (root, FIN) {
    if (!document.getElementById('cx-css')) { const s = el('style'); s.id = 'cx-css'; s.textContent = css; document.head.append(s); }
    const state = { op: 'kt', type: 'small' };
    const box = el('div', 'cx'); const ops = el('div', 'cx-ops'); const body = el('div');
    const mk = (title, kind) => { ops.append(el('span', 'cx-grp', title)); OPS.filter((o) => o.kind === kind).forEach((o) => { const b = el('button', '', o.name); b.type = 'button'; b.dataset.id = o.id; b.addEventListener('click', () => { state.op = o.id; draw(); }); ops.append(b); }); };
    mk('IPTV', 'iptv'); mk('케이블 MSO · SO', 'cable');
    const draw = () => { ops.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === state.op))); render(body, FIN, state); };
    box.append(howto(), ops, body); root.replaceChildren(box); draw();
  };
})();

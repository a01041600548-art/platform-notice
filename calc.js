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
  @media (max-width: 900px) { .cx-grid { grid-template-columns: 1fr; } .cx-f { grid-template-columns: minmax(0, 1fr) 9.5em; } .cx-big b { font-size: 1.6em; } }`;

  const fld = (box, label, val, sub, cls) => { const l = el('label'); l.append(label); if (sub) l.append(el('small', '', sub)); const i = el('input'); i.inputMode = 'decimal'; i.value = val; if (cls) i.className = cls; box.append(l, i); return i; };
  const sel = (box, label, opts, val, sub) => { const l = el('label'); l.append(label); if (sub) l.append(el('small', '', sub)); const s = el('select'); opts.forEach(([v, t]) => s.append(new Option(t, v))); s.value = val; box.append(l, s); return s; };
  const money = (i) => i.addEventListener('blur', () => { const n = num(i.value); i.value = n ? n.toLocaleString('ko-KR') : ''; });

  function howto() {
    const d = el('details', 'cx-how'); d.innerHTML = `<summary>계산기 사용 방법</summary>
      <ol>
        <li><b>사업자를 고릅니다.</b> 고르면 그 사업자의 <b>모수</b>(배분 재원 증감률·보장률·지표 가중치)가 자동으로 채워집니다. 재원 증감률은 2025년도 재산상황 공표집의 기본채널 수신료(케이블은 계열 SO 합계) 전년 대비 증감률입니다. 금색 칸은 자동값이며 고칠 수 있습니다.</li>
        <li><b>전년 사용료</b>에 해당 사업자에서 받은 작년 연간 금액을 넣습니다. 이 사이트에는 회사의 실제 금액을 저장하지 않으며, 입력값도 화면을 닫으면 사라집니다.</li>
        <li><b>지표 변화</b>에 작년 대비 우리 채널의 점유율이 얼마나 변했다고 보는지 넣습니다. 예: 시청점유율이 10% 늘었다면 10, 편성점수가 5% 줄었다면 -5. 모르면 0(작년과 같음)으로 둡니다.</li>
        <li>오른쪽에서 <b>올해 추정 금액</b>과 보장분·평가분 구성을 확인합니다. 케이블은 투자·홀드백 가점과 동시 유통 감점도 고를 수 있습니다.</li>
        <li>IPTV 산정서를 받았다면 <b>산정서 검증</b>을 펼쳐 항목별 배분액을 넣으면, 실제 적용된 기본지급률과 계산 차이를 확인할 수 있습니다.</li>
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
      // 대형: (기본채널 수신료 + 홈쇼핑 송출수수료) 합계 증감률
      const C = (FIN && (FIN.companies || FIN)) || []; const c = C.find((x) => x.name === op.fin);
      const vv = (y, k) => ((c && c.y[y]) || {})[k] || 0; const a = vv('2024', 'basicfee') + vv('2024', 'hsfee'), b = vv('2025', 'basicfee') + vv('2025', 'hsfee');
      rAuto = a ? b / a - 1 : 0;
    } else rAuto = rDef != null ? rDef : 0;
    f.append(el('div', 'cx-sub', '모수 (자동 설정)'));
    const r = fld(f, '배분 재원 증감률(%)', (rAuto * 100).toFixed(2), op.kind === 'iptv' ? (type.value === 'large' ? '기본채널 수신료+홈쇼핑 송출수수료 증감 (공표집 2025/2024)' : '기본채널 수신료 증감 (공표집 2025/2024)') : '계열 SO 기본채널 수신료 증감 (공표집 2025/2024)', 'auto');
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
    // 산정서 검증 (IPTV)
    let chk = null;
    if (op.kind === 'iptv') {
      chk = { d: el('details', 'cx-chk') }; chk.d.append(el('summary', '', '산정서 검증 (받은 산정서 값 입력)'));
      const f2 = el('div', 'cx-f'); f2.style.marginTop = '.7em'; chk.d.append(f2);
      chk.a = W.map(([n]) => { const i = fld(f2, n + ' 배분액(원)', ''); money(i); return i; });
      if (W.length === 3 && W[1][0] === '투자') { /* 투자는 제작·구매 합계로 입력 */ chk.a[1].previousSibling.firstChild.textContent = '투자 배분액(제작+구매, 원)'; }
      chk.act = fld(f2, '산정서 올해 금액(원)', ''); money(chk.act);
      L.append(chk.d);
    }
    const inputs = [type, r, gi, cy, prev, ...dIn, inv, hb, pen, ...(chk ? [...chk.a, chk.act] : [])].filter(Boolean);
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
      if (chk) {
        const A = chk.a.map((i) => num(i.value)), sa = A.reduce((t, x) => t + x, 0), AC = num(chk.act.value);
        if (sa && Pv) {
          const recon = Pv * gr + sa, implied = AC ? (AC - sa) / Pv : null, back = Pv * (1 - gr);
          R.append(Object.assign(el('div', 'cx-flag' + (sa >= back ? ' ok' : '')), { innerHTML: '<b>산정서 검증</b> — 평가 배분액 합계 ' + won(sa) + ' · 평가 재원으로 낸 ' + won(back) + ' 대비 회수율 <b>' + (back ? (sa / back * 100).toFixed(0) : '—') + '%</b><br>재구성 금액(전년×보장률+배분액) ' + won(recon) + (AC ? '<br>산정서 금액과 차이 ' + won(AC - recon) + ' · 역산한 실제 보장률 <b>' + (implied * 100).toFixed(3) + '%</b>' : '') }));
        }
      }
      R.append(Object.assign(el('p', 'cx-note'), { innerHTML: '<b>참고</b> — 평가분은 가중치가 아니라 각 지표 안에서 우리 채널이 차지하는 <b>점유율</b>로 나뉩니다. 이 계산기는 “작년 점유율 대비 변화”로 근사하므로, 실제 금액은 각사 산정서로 확정됩니다.' }));
    };
    inputs.forEach((i) => i.addEventListener && i.addEventListener('input', calc)); calc();

    const src = el('div', 'cx-src');
    src.innerHTML = op.kind === 'iptv'
      ? '<b>근거</b> — ' + op.src + '. 배분 대상 금액: 보호대상 = 전년 × (1 + 기본채널 수신료매출 증감률), 대형 = 전년 × (1 + 기본채널 수신료+홈쇼핑 송출수수료 증감률). 보호대상 중소 PP는 단계적 적용으로 보장분을 둡니다. 재원 증감률 기본값은 2025년도 방송사업자 재산상황 공표집(2025 실적, 2024 대비). 참고: <a href="https://www.bworld.co.kr/m/customer/notice/view.do?menu_id=C05010000&nt_keynum=2299" target="_blank" rel="noopener">SK브로드밴드 산정 방안 공지</a>'
      : '<b>근거</b> — 한국케이블TV방송협회 2026 SO 콘텐츠 대가산정 기준 개정안(2026.8.13 설명회·9.4 의견수렴): 전년 80% 매년 보장, 잔여 재원에 시청점유율·채널평가 적용, 투자 증가율별 3~15% 가점, 홀드백 1~10% 가점, 동시송출 -7%·조기 VOD -5% 감점(보장 하한 우선). 시청점유율·채널평가 가중치는 공개되지 않아 50:50으로 가정했습니다. 재원 증감률 기본값은 공표집의 계열 SO 기본채널 수신료 합계 증감률입니다.';
    root.append(src);
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

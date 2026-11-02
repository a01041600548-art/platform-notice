/* 대가산정 계산기 — IPTV(3사 공통 산정 방안) · 케이블(KCTA 2026 개정안) */
(function () {
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const num = (v) => { const n = Number(String(v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; };
  const won = (n) => (Math.round(n)).toLocaleString('ko-KR') + '원';
  const eok = (n) => { const a = Math.abs(n); const s = n < 0 ? '-' : ''; if (a >= 1e8) return s + (a / 1e8).toFixed(a >= 1e10 ? 0 : 2).replace(/\.?0+$/, '') + '억원'; if (a >= 1e4) return s + Math.round(a / 1e4).toLocaleString('ko-KR') + '만원'; return s + Math.round(a).toLocaleString('ko-KR') + '원'; };
  const pct = (n, d = 1) => (n >= 0 ? '+' : '') + (n * 100).toFixed(d) + '%';

  const css = `
  .cx { display: flex; flex-direction: column; gap: 1.4em; }
  .cx-seg { display: flex; border-bottom: 1px solid var(--line); }
  .cx-seg button { font: inherit; font-weight: 600; background: none; border: 0; border-bottom: 2px solid transparent; padding: .7em 1.1em; color: var(--ink2); cursor: pointer; }
  .cx-seg button[aria-pressed="true"] { color: var(--ink); border-bottom-color: var(--ink); }
  .cx-grid { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: 1.2em; align-items: start; }
  .cx-card { background: var(--card); border: 1px solid var(--line); border-radius: 6px; padding: 1.2em 1.3em; display: flex; flex-direction: column; gap: .9em; }
  .cx-card h3 { margin: 0; font-size: 1.02em; font-weight: 700; letter-spacing: -.01em; padding-bottom: .6em; border-bottom: 1px solid var(--line); }
  .cx-f { display: grid; grid-template-columns: minmax(0, 1fr) 11.5em; gap: .4em 1em; align-items: center; }
  .cx-f label { font-size: .9em; color: var(--ink); font-weight: 600; }
  .cx-f label small { display: block; color: var(--ink2); font-weight: 500; font-size: .85em; margin-top: .1em; }
  .cx-f input, .cx-f select { font: inherit; text-align: right; padding: .5em .7em; border: 1px solid var(--line); border-radius: 4px; background: var(--bg); color: var(--ink); min-width: 0; width: 100%; font-variant-numeric: tabular-nums; }
  .cx-f select { text-align: left; }
  .cx-f input:focus, .cx-f select:focus { outline: 2px solid color-mix(in srgb, var(--ink) 25%, transparent); border-color: var(--ink); }
  .cx-sub { font-size: .78em; font-weight: 700; letter-spacing: .08em; color: var(--ink2); margin-top: .3em; }
  .cx-res { border-top: 2px solid var(--ink); }
  .cx-big { display: flex; flex-wrap: wrap; align-items: baseline; gap: .2em .8em; }
  .cx-big b { font-size: 2.1em; font-weight: 600; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
  .cx-big span { font-weight: 700; }
  .cx-up { color: #15803d; } .cx-dn { color: #c2410c; }
  .cx-t { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; font-size: .92em; }
  .cx-t td, .cx-t th { padding: .5em .3em; border-bottom: 1px solid var(--line); text-align: right; }
  .cx-t th { color: var(--ink2); font-weight: 600; font-size: .85em; }
  .cx-t td:first-child, .cx-t th:first-child { text-align: left; }
  .cx-t tr.tot td { font-weight: 700; border-top: 1px solid var(--ink); border-bottom: 0; }
  .cx-bar { height: 6px; background: var(--line); border-radius: 1px; overflow: hidden; display: flex; }
  .cx-bar i { display: block; height: 100%; }
  .cx-note { font-size: .84em; color: var(--ink2); line-height: 1.65; margin: 0; }
  .cx-note b { color: var(--ink); }
  .cx-flag { font-size: .86em; padding: .6em .8em; border-left: 2px solid #c2410c; background: color-mix(in srgb, #c2410c 6%, transparent); }
  .cx-flag.ok { border-left-color: #15803d; background: color-mix(in srgb, #15803d 6%, transparent); }
  .cx-src { font-size: .8em; color: var(--ink2); border-top: 1px solid var(--line); padding-top: .8em; line-height: 1.7; }
  .cx-src a { color: var(--ink2); }
  @media (max-width: 900px) { .cx-grid { grid-template-columns: 1fr; } .cx-f { grid-template-columns: minmax(0, 1fr) 9.5em; } .cx-big b { font-size: 1.7em; } }`;

  function field(box, id, label, val, sub, attrs) {
    const l = el('label'); l.htmlFor = id; l.append(label); if (sub) l.append(el('small', '', sub));
    const i = el('input'); i.id = id; i.inputMode = 'decimal'; i.value = val; if (attrs && attrs.dataset) Object.assign(i.dataset, attrs.dataset);
    box.append(l, i); return i;
  }
  function select(box, id, label, opts, val, sub) {
    const l = el('label'); l.htmlFor = id; l.append(label); if (sub) l.append(el('small', '', sub));
    const s = el('select'); s.id = id; opts.forEach(([v, t]) => s.append(new Option(t, v))); s.value = val; box.append(l, s); return s;
  }
  const fmtInput = (i) => i.addEventListener('blur', () => { const n = num(i.value); if (i.dataset.money) i.value = n ? n.toLocaleString('ko-KR') : ''; });

  /* ───────── IPTV ───────── */
  const W = {
    small: { perf: .4, inv: .2, third: .4, perfA: .3, perfB: .7, prod: .5, buy: .5, thirdName: '다양성(채널평가 편성점수)' },
    large: { perf: .5, inv: .25, third: .25, perfA: .5, perfB: .5, prod: .6, buy: .4, thirdName: '기여(홈쇼핑 송출수수료 매출)' },
  };
  function iptv(root) {
    const g = el('div', 'cx-grid'); const L = el('div', 'cx-card'); const R = el('div', 'cx-card cx-res');
    L.append(el('h3', '', '입력 · 플랫폼 산정서 값'));
    const f = el('div', 'cx-f'); L.append(f);
    const type = select(f, 'ip-type', '사업자 구분', [['small', '보호대상 중소 PP'], ['large', '대형 콘텐츠사업자']], 'small', '재능방송 = 보호대상 중소 PP');
    const prev = field(f, 'ip-prev', '전년 콘텐츠 사용료', '400,000,000', '산정서 “전년 금액”', { dataset: { money: 1 } });
    const g0 = field(f, 'ip-g', '기본 지급률(%)', '90', '전년 금액 중 평가 없이 보장되는 비율');
    f.append(el('div', 'cx-sub', '평가 배분액 (산정서 항목별)'), el('div'));
    const a1 = field(f, 'ip-a1', '성과 · 시청 지표', '20,000,000', '닐슨·IPTV 셋톱 시청점유율', { dataset: { money: 1 } });
    const a2 = field(f, 'ip-a2', '투자 · 제작비', '8,000,000', '재산상황공표집 제작비 점유율', { dataset: { money: 1 } });
    const a3 = field(f, 'ip-a3', '투자 · 구매비', '4,000,000', '재산상황공표집 구매비 점유율', { dataset: { money: 1 } });
    const a4 = field(f, 'ip-a4', '다양성 / 기여', '18,000,000', '편성점수 점유율(중소) · 홈쇼핑 기여(대형)', { dataset: { money: 1 } });
    f.append(el('div', 'cx-sub', '검증 · 시뮬레이션'), el('div'));
    const act = field(f, 'ip-act', '산정서 올해 금액', '', '입력하면 차이·실제 기본지급률을 계산', { dataset: { money: 1 } });
    const sim = field(f, 'ip-sim', '시청 지표 변화(%)', '0', '예: 10 → 시청 배분액 10% 증가 가정');
    const sim2 = field(f, 'ip-sim2', '투자 지표 변화(%)', '0', '제작·구매비 점유율 변화 가정');
    [prev, a1, a2, a3, a4, act].forEach(fmtInput);
    g.append(L, R); root.append(g);

    const calc = () => {
      const w = W[type.value]; a4.previousSibling.firstChild.textContent = type.value === 'small' ? '다양성 · 편성점수' : '기여 · 홈쇼핑';
      const P = num(prev.value), gr = num(g0.value) / 100;
      const s1 = 1 + num(sim.value) / 100, s2 = 1 + num(sim2.value) / 100;
      const A = [num(a1.value) * s1, num(a2.value) * s2, num(a3.value) * s2, num(a4.value)];
      const fixed = P * gr, pool = P * (1 - gr), ret = A.reduce((t, x) => t + x, 0), cur = fixed + ret, d = cur - P;
      R.replaceChildren(el('h3', '', '결과 · 올해 콘텐츠 사용료'));
      const big = el('div', 'cx-big'); big.append(el('b', '', won(cur))); const ch = el('span', d >= 0 ? 'cx-up' : 'cx-dn', (d >= 0 ? '▲ ' : '▼ ') + eok(Math.abs(d)) + ' (' + pct(P ? d / P : 0) + ')'); big.append(ch); R.append(big);
      const t = el('table', 'cx-t'); const tb = el('tbody');
      const row = (a, b, c, cls) => { const tr = el('tr', cls || ''); [a, b, c].forEach((x) => tr.append(el('td', '', x))); tb.append(tr); };
      t.append(Object.assign(el('thead'), { innerHTML: '<tr><th>구성</th><th>금액</th><th>비중</th></tr>' }));
      row('① 보장분 (전년 × ' + (gr * 100).toFixed(1) + '%)', won(fixed), cur ? (fixed / cur * 100).toFixed(1) + '%' : '—');
      const names = ['성과 · 시청', '투자 · 제작비', '투자 · 구매비', type.value === 'small' ? '다양성 · 편성' : '기여 · 홈쇼핑'];
      A.forEach((x, i) => row('② ' + names[i], won(x), cur ? (x / cur * 100).toFixed(1) + '%' : '—'));
      row('합계', won(cur), '100%', 'tot'); t.append(tb); R.append(t);
      const bar = el('div', 'cx-bar'); const cols = ['#0d1b2e', '#b08d57', '#c9a56b', '#8a94a6', '#5b6472'];
      [fixed, ...A].forEach((x, i) => { const s = el('i'); s.style.width = (cur ? x / cur * 100 : 0) + '%'; s.style.background = cols[i]; bar.append(s); }); R.append(bar);
      const rr = pool ? ret / pool : 0;
      R.append(Object.assign(el('div', 'cx-flag' + (rr >= 1 ? ' ok' : '')), { innerHTML: '<b>평가 회수율 ' + (rr * 100).toFixed(0) + '%</b> — 평가 재원으로 낸 ' + eok(pool) + ' 대비 ' + eok(ret) + '를 돌려받았습니다. ' + (rr >= 1 ? '100%를 넘으면 증액입니다.' : '100% 미만이면 전년보다 감액됩니다.') }));
      const AC = num(act.value);
      if (AC) {
        const impl = P ? (AC - ret) / P : 0, diff = AC - cur;
        R.append(Object.assign(el('div', 'cx-flag' + (Math.abs(diff) < 1e5 ? ' ok' : '')), { innerHTML: '<b>산정서 검증</b> — 산정서 금액 ' + won(AC) + ' · 계산값과 차이 ' + won(diff) + '<br>산정서 금액에서 역산한 실제 기본지급률: <b>' + (impl * 100).toFixed(3) + '%</b>' + (Math.abs(diff) < 1e5 ? ' (원 단위 절사 수준 차이)' : ' — 기본지급률이나 항목 금액을 확인해 보세요') }));
      }
      // 지표 비중 참고
      const wt = el('p', 'cx-note'); wt.innerHTML = '<b>지표 가중치(' + (type.value === 'small' ? '보호대상 중소' : '대형') + ')</b> 성과 ' + w.perf * 100 + '% (닐슨 ' + w.perfA * 100 + ' : IPTV 자체 ' + w.perfB * 100 + ') · 투자 ' + w.inv * 100 + '% (제작비 ' + w.prod * 100 + ' : 구매비 ' + w.buy * 100 + ') · ' + w.thirdName + ' ' + w.third * 100 + '%<br>채널별 배분액은 가중치가 아니라 <b>각 지표 안에서 우리 채널의 점유율</b>로 정해집니다. 그래서 배분액 비율이 40:20:40과 다를 수 있습니다.';
      R.append(wt);
    };
    [type, prev, g0, a1, a2, a3, a4, act, sim, sim2].forEach((i) => i.addEventListener('input', calc)); calc();
  }

  /* ───────── 케이블 (KCTA 2026 개정안) ───────── */
  function cable(root) {
    const g = el('div', 'cx-grid'); const L = el('div', 'cx-card'); const R = el('div', 'cx-card cx-res');
    L.append(el('h3', '', '입력 · SO 산정 조건'));
    const f = el('div', 'cx-f'); L.append(f);
    const mode = select(f, 'cb-mode', '적용 기준', [['new', '2026 개정안 (매년 80% 보장)'], ['old', '기존 기준 (연차별 80→60→40%)']], 'new');
    const year = select(f, 'cb-year', '평가 적용 연차 (기존 기준)', [['1', '1년차 · 80% 보장'], ['2', '2년차 · 60% 보장'], ['3', '3년차 · 40% 보장'], ['4', '4년차 이후 · 전면 평가']], '1');
    const prev = field(f, 'cb-prev', '전년 프로그램 사용료', '120,000,000', '해당 SO(또는 MSO 합계) 연간 금액', { dataset: { money: 1 } });
    const total = field(f, 'cb-total', '올해 전체 재원 증감(%)', '-2', 'SO 매출 증감 등 반영한 전체 대가 규모 변화');
    const idx = field(f, 'cb-idx', '평가 배분 지수(%)', '100', '잔여 재원에서 우리 몫 ÷ 전년 비중 (100 = 전년과 같은 점유율)');
    f.append(el('div', 'cx-sub', '가점 · 감점'), el('div'));
    const inv = select(f, 'cb-inv', '제작·구매비 전년 대비 증가율', [['0', '10% 미만 · 0%'], ['3', '10~30% · +3%'], ['6', '30~50% · +6%'], ['9', '50~70% · +9%'], ['12', '70~90% · +12%'], ['15', '90% 이상 · +15%']], '0');
    const hb = field(f, 'cb-hb', '홀드백 가점(%)', '0', '방송 다음날 0시까지 홀드백 유지 시 1~10% (시청률 1% 이상 최대 10%)');
    const pen = select(f, 'cb-pen', '동시·조기 유통 감점', [['0', '해당 없음'], ['5', '다음날 0시 전 VOD 공개 · -5%'], ['7', '타 플랫폼 실시간 동시 송출 · -7%']], '0');
    [prev].forEach(fmtInput);
    g.append(L, R); root.append(g);
    const calc = () => {
      year.parentElement && (year.disabled = mode.value === 'new'); year.style.opacity = mode.value === 'new' ? .45 : 1;
      const P = num(prev.value), T = 1 + num(total.value) / 100, I = num(idx.value) / 100;
      const gr = mode.value === 'new' ? .8 : ({ 1: .8, 2: .6, 3: .4, 4: 0 })[year.value];
      const fixed = P * gr;
      const evalPart = Math.max(0, P * T - fixed) * I; // 잔여 재원 중 우리 몫(전년 점유율 기준 × 평가 지수)
      const base = fixed + evalPart;
      const add = base * (num(inv.value) + num(hb.value)) / 100, minus = base * num(pen.value) / 100;
      let cur = base + add - minus; const floor = P * gr; let floored = false; if (cur < floor) { cur = floor; floored = true; }
      const d = cur - P;
      R.replaceChildren(el('h3', '', '결과 · 올해 프로그램 사용료(추정)'));
      const big = el('div', 'cx-big'); big.append(el('b', '', won(cur)), el('span', d >= 0 ? 'cx-up' : 'cx-dn', (d >= 0 ? '▲ ' : '▼ ') + eok(Math.abs(d)) + ' (' + pct(P ? d / P : 0) + ')')); R.append(big);
      const t = el('table', 'cx-t'); const tb = el('tbody');
      t.append(Object.assign(el('thead'), { innerHTML: '<tr><th>구성</th><th>금액</th></tr>' }));
      const row = (a, b, cls) => { const tr = el('tr', cls || ''); tr.append(el('td', '', a), el('td', '', b)); tb.append(tr); };
      row('① 보장분 (전년 × ' + Math.round(gr * 100) + '%)', won(fixed));
      row('② 평가 배분 (잔여 재원 × 지수 ' + Math.round(I * 100) + '%)', won(evalPart));
      if (add) row('③ 투자·홀드백 가점 (+' + (num(inv.value) + num(hb.value)) + '%)', won(add));
      if (minus) row('④ 동시·조기 유통 감점 (-' + num(pen.value) + '%)', '-' + won(minus));
      if (floored) row('보장 하한 적용', won(floor));
      row('합계', won(cur), 'tot'); t.append(tb); R.append(t);
      R.append(Object.assign(el('div', 'cx-flag' + (d >= 0 ? ' ok' : '')), { innerHTML: '<b>하한</b> — 어떤 경우에도 전년의 ' + Math.round(gr * 100) + '%(' + eok(floor) + ') 아래로 내려가지 않습니다' + (floored ? ' (이번 조건에서 하한이 적용됐습니다).' : '.') }));
      R.append(Object.assign(el('p', 'cx-note'), { innerHTML: '평가 배분 지수는 SO가 통보한 평가 결과(시청점유율·채널평가)를 넣는 칸입니다. 모르면 100%(전년과 같은 점유율)로 두고, 평가가 좋아지면 110%, 나빠지면 90%처럼 바꿔 보세요.' }));
    };
    [mode, year, prev, total, idx, inv, hb, pen].forEach((i) => i.addEventListener('input', calc)); calc();
  }

  window.renderCalc = function (root) {
    if (!document.getElementById('cx-css')) { const s = el('style'); s.id = 'cx-css'; s.textContent = css; document.head.append(s); }
    const box = el('div', 'cx'); const state = { v: 'iptv' };
    const seg = el('div', 'cx-seg'); const body = el('div');
    const draw = () => {
      seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === state.v)));
      body.replaceChildren(); (state.v === 'iptv' ? iptv : cable)(body);
      const src = el('div', 'cx-src');
      src.innerHTML = state.v === 'iptv'
        ? '<b>근거</b> — IPTV 3사 콘텐츠 사용료 산정 방안(2024.1 정부 제출·각사 공지, 예: <a href="https://www.bworld.co.kr/m/customer/notice/view.do?menu_id=C05010000&nt_keynum=2299" target="_blank" rel="noopener">SK브로드밴드 공지</a>). 배분 대상 금액 = 전년 금액 × (1 + 기본채널 수신료매출 증감률, 대형은 홈쇼핑 송출수수료 증감 포함). 보호대상 중소 PP는 보장분을 두고 단계적으로 평가를 적용하며, 기본지급률은 각사 산정서로 확인합니다. LG유플러스 2026년 산정서는 기본지급률 90%로 역산됩니다.'
        : '<b>근거</b> — 한국케이블TV방송협회 2026 SO 콘텐츠 대가산정 기준 개정안(2026.8.13 설명회, 9.4까지 의견수렴): 전년 사용료 80% 매년 우선 보장, 잔여 재원에 시청점유율·채널평가 적용, 제작·구매비 증가율별 3~15% 가점, 홀드백 1~10% 가점, 동시송출 -7%·조기 VOD -5% 감점(보장 하한 우선). 기존 기준은 연차별 80·60·40% 보장 후 4년차 전면 평가. 잔여 재원 지표별 가중치는 공개 기사에 없어 “평가 배분 지수”로 단순화했습니다.';
      body.append(src);
    };
    [['iptv', 'IPTV (KT · SKB · LG U+)'], ['cable', '케이블 SO']].forEach(([v, t]) => { const b = el('button', '', t); b.type = 'button'; b.dataset.v = v; b.addEventListener('click', () => { state.v = v; draw(); }); seg.append(b); });
    box.append(seg, body); root.replaceChildren(box); draw();
  };
})();

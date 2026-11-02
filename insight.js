/* 시청률 예상순위 · 대표이사/협회장 — insight.enc.json */
(function () {
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const ME = /^JEI/i;
  const GRADES = [['가', 25, 5], ['나', 20, 4], ['다', 15, 3], ['라', 10, 2], ['마', 5, 1]];
  const css = `
  .ix { display: flex; flex-direction: column; gap: 1.2em; }
  .ix-seg { display: flex; flex-wrap: wrap; gap: .4em; }
  .ix-seg button { font: inherit; font-weight: 600; font-size: .92em; padding: .5em .95em; border: 1px solid var(--line); border-radius: 3px; background: var(--card); color: var(--ink); cursor: pointer; }
  .ix-seg button[aria-pressed="true"] { background: var(--ink); color: var(--card); border-color: var(--ink); }
  .ix-lb { font-size: .74em; font-weight: 700; letter-spacing: .1em; color: var(--ink2); }
  .ix-seg { align-items: center; }
  .ix-seg .lb { font-size: .74em; font-weight: 700; letter-spacing: .1em; color: var(--ink2); width: 100%; }
  .ix-card { background: var(--card); border: 1px solid var(--line); border-radius: 6px; padding: 1.1em 1.2em; display: flex; flex-direction: column; gap: .8em; }
  .ix-card h3 { margin: 0; font-size: 1.02em; font-weight: 700; display: flex; justify-content: space-between; gap: .5em; flex-wrap: wrap; padding-bottom: .55em; border-bottom: 1px solid var(--line); }
  .ix-card h3 small { font-weight: 600; color: var(--ink2); font-size: .8em; }
  .ix-me { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 15em), 1fr)); gap: .6em; }
  .ix-me > div { border: 1px solid var(--line); border-left: 3px solid #b08d57; border-radius: 4px; padding: .7em .85em; display: flex; flex-direction: column; gap: .2em; }
  .ix-me b { font-size: 1.35em; font-variant-numeric: tabular-nums; }
  .ix-me span { font-size: .84em; color: var(--ink2); }
  .ix-wrap { overflow-x: auto; }
  .ix-t { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; font-size: .92em; }
  .ix-t th, .ix-t td { padding: .55em .45em; border-bottom: 1px solid var(--line); text-align: right; white-space: nowrap; }
  .ix-t th { color: var(--ink2); font-weight: 600; font-size: .84em; }
  .ix-t td.l, .ix-t th.l { text-align: left; white-space: normal; }
  .ix-t td.rk { text-align: center; font-weight: 800; width: 3em; }
  .ix-t tr.me td { background: color-mix(in srgb, #b08d57 13%, var(--card)); font-weight: 700; }
  .ix-t small { display: block; color: var(--ink2); font-weight: 500; font-size: .8em; }
  .ix-g { display: inline-block; min-width: 2.2em; text-align: center; padding: .15em .45em; border-radius: 3px; font-weight: 800; font-size: .86em; }
  .ix-g.g가 { background: #0d1b2e; color: #fff; } .ix-g.g나 { background: #33507a; color: #fff; } .ix-g.g다 { background: #8aa0bf; color: #0d1b2e; } .ix-g.g라 { background: #d8dfe9; color: #0d1b2e; } .ix-g.g마 { background: transparent; border: 1px solid var(--line); color: var(--ink2); }
  .ix-up { color: #15803d; } .ix-dn { color: #c2410c; }
  .ix-bar { display: inline-block; height: .5em; background: #b08d57; border-radius: 1px; vertical-align: middle; margin-left: .4em; }
  .ix-note { font-size: .84em; color: var(--ink2); line-height: 1.7; margin: 0; } .ix-note b { color: var(--ink); } .ix-note a { color: var(--ink2); }
  details.ix-how summary { cursor: pointer; font-weight: 700; }
  details.ix-how ul { margin: .6em 0 0; padding-left: 1.2em; display: flex; flex-direction: column; gap: .35em; font-size: .9em; line-height: 1.6; }
  .ix-q { font: inherit; padding: .55em .8em; border: 1px solid var(--line); border-radius: 4px; background: var(--bg); color: var(--ink); width: min(100%, 22em); }
  .ix-pp { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 17em), 1fr)); gap: .6em; }
  .ix-p { border: 1px solid var(--line); border-radius: 4px; padding: .8em .9em; display: flex; flex-direction: column; gap: .25em; background: var(--card); }
  .ix-p .co { font-size: .84em; color: var(--ink2); font-weight: 700; }
  .ix-p .nm { font-size: 1.25em; font-weight: 700; font-family: 'Noto Serif KR', serif; }
  .ix-p .nm.unk { font-size: 1em; color: var(--ink2); font-family: inherit; }
  .ix-p .role { font-size: .84em; color: var(--ink2); }
  .ix-p .mt { font-size: .78em; color: var(--ink2); margin-top: .2em; } .ix-p .mt a { color: var(--ink2); }
  .ix-p .rm { font-size: .8em; color: #8a6a35; }
  @media (max-width: 720px) { .ix-seg { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; } .ix-seg::-webkit-scrollbar { display: none; } .ix-seg button { flex: none; } .ix-t { font-size: .86em; } .ix-t .qcol { display: none; } }`;
  const addCss = () => { if (!document.getElementById('ix-css')) { const s = el('style'); s.id = 'ix-css'; s.textContent = css; document.head.append(s); } };
  const avg = (a) => { const v = a.filter((x) => x != null); return v.length ? v.reduce((t, x) => t + x, 0) / v.length : null; };
  const grade = (r, n) => { const p = (n - r + 1) / n; return GRADES[p > .8 ? 0 : p > .6 ? 1 : p > .4 ? 2 : p > .2 ? 3 : 4]; };
  function ranked(plat, g) {
    const rows = plat.ch.filter((c) => c.g === g).map((c) => ({ c, a: avg(c.s), last: c.s[c.s.length - 1], prev: c.s.length > 1 ? c.s[c.s.length - 2] : null })).filter((x) => x.a != null);
    rows.sort((x, y) => y.a - x.a); rows.forEach((x, i) => { x.rank = i + 1; x.gr = grade(i + 1, rows.length); });
    const byLast = rows.filter((x) => x.last != null).slice().sort((x, y) => y.last - x.last); byLast.forEach((x, i) => { x.rl = i + 1; });
    const byPrev = rows.filter((x) => x.prev != null).slice().sort((x, y) => y.prev - x.prev); byPrev.forEach((x, i) => { x.rp = i + 1; });
    return rows;
  }

  window.renderRatings = function (root, R) {
    addCss();
    const st = root.__ix || (root.__ix = { p: 'kt', g: '어린이·교육' });
    const draw = () => {
      const plat = R.plats.find((p) => p.id === st.p);
      const box = el('div', 'ix');
      const sp = el('div', 'ix-seg');
      R.plats.forEach((p) => { const b = el('button', '', p.name + (p.q.length ? ' · ' + p.q.join('·') : ' · 미공개')); b.type = 'button'; b.setAttribute('aria-pressed', String(p.id === st.p)); b.addEventListener('click', () => { st.p = p.id; draw(); }); sp.append(b); });
      const sg = el('div', 'ix-seg');
      R.genres.forEach((g) => { const n = plat.ch.filter((c) => c.g === g).length; const b = el('button', '', g + (n ? ' ' + n : '')); b.type = 'button'; b.disabled = !n && plat.ch.length > 0; b.setAttribute('aria-pressed', String(g === st.g)); b.addEventListener('click', () => { st.g = g; draw(); }); sg.append(b); });
      box.append(el('span', 'ix-lb', '플랫폼'), sp, el('span', 'ix-lb', '평가 채널군(장르)'), sg); box.querySelectorAll('.ix-lb').forEach((x) => { x.style.marginBottom = '-.8em'; });
      // 우리 채널 요약 (전 플랫폼)
      const mc = el('div', 'ix-card'); mc.append(Object.assign(el('h3'), { innerHTML: '재능 채널 예상 위치 <small>공시된 2026년 분기 평균 기준 · 시청점유율 항목(25점)</small>' }));
      const mg = el('div', 'ix-me');
      R.plats.filter((p) => p.ch.length).forEach((p) => p.ch.filter((c) => ME.test(c.n.replace(/\s/g, ''))).forEach((c) => { const rows = ranked(p, c.g); const x = rows.find((y) => y.c === c); if (!x) return; const d = el('div'); d.append(el('span', '', p.name + ' · ' + c.n + ' (' + c.g + ')')); const b = el('b'); b.append(x.rank + '위 / ' + rows.length + ' ', Object.assign(el('span', 'ix-g g' + x.gr[0], x.gr[0]))); d.append(b, el('span', '', '예상 ' + x.gr[1] + '점 · 평균 점유율 ' + x.a.toFixed(3) + '%')); mg.append(d); }));
      if (!mg.children.length) mg.append(el('p', 'ix-note', '공시 자료에 재능 채널이 없습니다.'));
      mc.append(mg); box.append(mc);
      const card = el('div', 'ix-card');
      card.append(Object.assign(el('h3'), { innerHTML: plat.name + ' · ' + st.g + ' <small>' + (plat.q.length ? '2026년 ' + plat.q.join('·') + ' 공시 · 누적 평균 순' : '자료 없음') + '</small>' }));
      if (!plat.ch.length) { card.append(el('p', 'ix-note', plat.src)); }
      else {
        const rows = ranked(plat, st.g); const max = Math.max(...rows.map((x) => x.a), 1e-9);
        const w = el('div', 'ix-wrap'); const t = el('table', 'ix-t');
        const hr = el('tr'); [['순위', ''], ['채널', 'l'], ...plat.q.map((q) => [q, 'qcol']), ['평균 점유율', ''], ['최근 분기 순위', ''], ['예상 등급', '']].forEach(([x, c]) => hr.append(el('th', c, x)));
        const th = el('thead'); th.append(hr); t.append(th); const tb = el('tbody');
        rows.forEach((x) => {
          const tr = el('tr', ME.test(x.c.n.replace(/\s/g, '')) ? 'me' : '');
          const nm = el('td', 'l'); nm.append(x.c.n); nm.append(el('small', '', 'ch ' + x.c.no));
          const av = el('td'); av.append(x.a.toFixed(3) + '%'); const bar = el('span', 'ix-bar'); bar.style.width = Math.max(2, x.a / max * 60) + 'px'; av.append(bar);
          const mv = el('td'); if (x.rl) { mv.append(x.rl + '위'); if (x.rp) { const dlt = x.rp - x.rl; if (dlt) mv.append(el('small', dlt > 0 ? 'ix-up' : 'ix-dn', (dlt > 0 ? '▲' : '▼') + Math.abs(dlt) + ' (직전 ' + x.rp + '위)')); else mv.append(el('small', '', '직전과 같음')); } } else mv.textContent = '—';
          const gd = el('td'); gd.append(el('span', 'ix-g g' + x.gr[0], x.gr[0])); gd.append(el('small', '', x.gr[1] + '점'));
          tr.append(el('td', 'rk', x.rank), nm, ...x.c.s.map((v) => el('td', 'qcol', v == null ? '—' : v.toFixed(3) + '%')), av, mv, gd); tb.append(tr);
        });
        t.append(tb); w.append(t); card.append(w);
        const cut = [1, 2, 3, 4].map((k) => rows.filter((x) => GRADES.indexOf(x.gr) < k).length);
        card.append(el('p', 'ix-note', `${rows.length}개 채널 · 등급 구간: 가 1~${cut[0]}위 · 나 ~${cut[1]}위 · 다 ~${cut[2]}위 · 라 ~${cut[3]}위 · 마 그 아래`));
      }
      const how = el('details', 'ix-how'); how.innerHTML = '<summary>예상 순위 계산 방법</summary><ul>' +
        '<li><b>근거</b> 방미통위 「PP평가 기준 및 절차 표준안」: 유료방송사 자체 시청점유율 <b>25점</b>, 같은 채널군 안에서 1위부터 순위를 매겨 상위 20%씩 가(25)·나(20)·다(15)·라(10)·마(5)점. 조사기관(닐슨) 시청점유율 5점은 별도.</li>' +
        '<li><b>계산</b> 공시된 2026년 분기별 시청점유율의 평균으로 채널군 안 순위를 매기고, 위 등급 구간을 적용했습니다.</li>' +
        '<li><b>주의</b> 공시 수치는 <b>티어별 커버리지 보정·번호대역 보정 전</b> 값입니다. 실제 평가는 보정 후 연간(1~12월) 수치로 하므로 순위가 달라질 수 있습니다. 4분기 자료가 나오면 다시 계산됩니다.</li>' +
        '<li><b>채널군</b> ' + (plat.gsrc || '—') + '</li></ul>';
      box.append(card, how);
      const src = el('p', 'ix-note'); src.innerHTML = '<b>자료</b> ' + plat.src + ' · <a href="' + plat.url + '" target="_blank" rel="noopener">공지 목록</a>'; box.append(src);
      root.replaceChildren(box);
    };
    draw();
  };

  window.renderPeople = function (root, P) {
    addCss();
    const st = { q: '' };
    const box = el('div', 'ix');
    const q = el('input', 'ix-q'); q.type = 'search'; q.placeholder = '회사·이름 검색 (예: 헬로비전, 협회)';
    const body = el('div', 'ix');
    const draw = () => {
      body.replaceChildren();
      const w = st.q.toLowerCase();
      P.groups.forEach((g) => {
        const list = P.people.filter((p) => p.grp === g && (!w || (p.co + p.name + (p.role || '') + (p.rm || '')).toLowerCase().includes(w)));
        if (!list.length) return;
        const c = el('div', 'ix-card'); c.append(Object.assign(el('h3'), { innerHTML: g + ' <small>' + list.length + '곳</small>' }));
        const grid = el('div', 'ix-pp');
        list.forEach((p) => { const d = el('div', 'ix-p'); d.append(el('span', 'co', p.co)); d.append(el('span', 'nm' + (p.name ? '' : ' unk'), p.name || '확인 필요')); d.append(el('span', 'role', p.role || '')); if (p.rm) d.append(el('span', 'rm', p.rm)); const mt = el('span', 'mt'); mt.append('출처: '); if (p.url) { const a = el('a', '', p.src); a.href = p.url; a.target = '_blank'; a.rel = 'noopener'; mt.append(a); } else mt.append(p.src); mt.append(' · ' + p.at + ' 확인'); d.append(mt); grid.append(d); });
        c.append(grid); body.append(c);
      });
      if (!body.children.length) body.append(el('p', 'ix-note', '검색 결과가 없습니다.'));
    };
    q.addEventListener('input', () => { st.q = q.value.trim(); draw(); });
    box.append(q, body, Object.assign(el('p', 'ix-note'), { innerHTML: '<b>기준</b> 각사 공식 홈페이지 하단 사업자 정보의 대표자(법인 등기 대표) 표기와 최근 언론 보도를 대조했습니다. 공동대표는 함께 적었습니다. 인사 발표가 나오면 매일 자동 갱신 때 반영합니다.' }));
    draw();
    root.replaceChildren(box);
  };
})();

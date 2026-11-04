/* 방미통위 · 주요 언론사 공식일정 캘린더 — 달력(월간 그리드) 보기
   window.renderCalendar(root, data)
   data = { updated, events: [{category, org, title, kind, date, url, note}] } */
(function () {
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const CAT_COLOR = { '방미통위': 'var(--c0)', '언론사': 'var(--c4)' };
  const ccol = (cat) => CAT_COLOR[cat] || 'var(--c6)';
  const WD = ['일', '월', '화', '수', '목', '금', '토'];
  const CSS = `
  .cal { display: flex; flex-direction: column; gap: 1.1em; }
  .cal-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .8em; }
  .cal-seg { display: inline-flex; flex-wrap: wrap; gap: 4px; padding: 4px; background: color-mix(in srgb, var(--ink) 6%, var(--card)); border-radius: 14px; }
  .cal-seg button { font: inherit; font-weight: 800; font-size: .92em; min-height: 40px; padding: 0 1em; border-radius: 10px; border: 0; background: transparent; color: var(--ink2); cursor: pointer; transition: background .15s, color .15s; }
  .cal-seg button[aria-pressed="true"] { background: var(--card); color: var(--ink); box-shadow: 0 1px 3px rgba(0,0,0,.12); }
  .cal-stats { display: flex; flex-wrap: wrap; gap: .5em; font-size: .85em; color: var(--ink2); }
  .cal-stat { display: inline-flex; align-items: center; gap: .4em; font-weight: 700; }
  .cal-stat i { width: 9px; height: 9px; border-radius: 999px; display: inline-block; }

  .cal-nav { display: flex; align-items: center; justify-content: space-between; gap: .8em; padding: .3em .2em; }
  .cal-nav h3 { margin: 0; font-size: 1.25em; font-weight: 800; }
  .cal-navbtns { display: flex; gap: .4em; align-items: center; }
  .cal-navbtns button { min-height: 38px; min-width: 38px; border-radius: 10px; border: 1px solid var(--line); background: var(--card); color: var(--ink); font: inherit; font-weight: 800; cursor: pointer; }
  .cal-navbtns button:hover { background: color-mix(in srgb, var(--ink) 6%, var(--card)); }
  .cal-navbtns .today { min-width: auto; padding: 0 .9em; font-size: .85em; }

  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
  .cal-wd { text-align: center; font-size: .78em; font-weight: 800; color: var(--ink2); padding: .3em 0; }
  .cal-wd.sun { color: #dc2626; } .cal-wd.sat { color: #2563eb; }
  .cal-cell { min-height: 5.6em; border: 1px solid var(--line); border-radius: 10px; background: var(--card); padding: .4em; display: flex; flex-direction: column; gap: .25em; cursor: pointer; text-align: left; font: inherit; color: inherit; }
  .cal-cell:hover { border-color: color-mix(in srgb, var(--c0) 55%, var(--line)); }
  .cal-cell.out { opacity: .35; }
  .cal-cell.today { border-color: var(--c0); box-shadow: inset 0 0 0 1.5px var(--c0); }
  .cal-cell.sel { background: color-mix(in srgb, var(--c0) 10%, var(--card)); border-color: var(--c0); }
  .cal-cell .cd-num { font-weight: 800; font-size: .88em; font-variant-numeric: tabular-nums; }
  .cal-cell .cd-chips { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .cal-chip { display: block; font-size: .68em; font-weight: 700; color: #fff; border-radius: 5px; padding: .08em .4em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cal-more { font-size: .68em; font-weight: 700; color: var(--ink2); }

  .cal-detail { display: flex; flex-direction: column; gap: .7em; border: 1px solid var(--line); border-radius: var(--radius); background: var(--card); box-shadow: var(--shadow); padding: 1.1em 1.2em; }
  .cal-detail h4 { margin: 0; font-size: 1.05em; font-weight: 800; }
  .cal-detail .cal-empty { padding: 1em 0; text-align: center; color: var(--ink2); }
  .cal-ev { display: flex; flex-direction: column; gap: .35em; padding: .8em 0; border-top: 1px dashed var(--line); }
  .cal-ev:first-of-type { border-top: 0; padding-top: 0; }
  .cal-badges { display: flex; flex-wrap: wrap; gap: .4em; align-items: center; }
  .cal-cat { display: inline-flex; align-items: center; gap: .35em; font-size: .72em; font-weight: 800; padding: .15em .6em; border-radius: 999px; color: #fff; white-space: nowrap; }
  .cal-kind { display: inline-flex; font-size: .72em; font-weight: 700; color: var(--ink2); border: 1px solid var(--line); padding: .1em .55em; border-radius: 999px; white-space: nowrap; }
  .cal-org { font-weight: 700; color: var(--ink2); font-size: .88em; }
  .cal-title { font-weight: 800; color: var(--ink); line-height: 1.4; }
  .cal-note { font-size: .86em; color: var(--ink2); line-height: 1.5; }
  .cal-ev-act a { font-size: .82em; font-weight: 800; color: var(--c0); white-space: nowrap; text-decoration: none; }
  .cal-ev-act a:hover { text-decoration: underline; }

  @media (max-width: 640px) {
    .cal-cell { min-height: 4.4em; padding: .3em; }
    .cal-chip { font-size: 0; height: 6px; border-radius: 999px; padding: 0; }
    .cal-grid { gap: 4px; }
  }
  `;
  function addStyle() { if (document.getElementById('cal-style')) return; const s = el('style'); s.id = 'cal-style'; s.textContent = CSS; document.head.appendChild(s); }

  const linkEl = (u, t) => {
    if (typeof u !== 'string' || !/^https:\/\//.test(u)) return null;
    const a = el('a', null, t); a.href = u; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a;
  };
  const todayStr = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

  function evCard(e) {
    const c = el('div', 'cal-ev');
    const badges = el('div', 'cal-badges');
    const cat = el('span', 'cal-cat', e.category); cat.style.background = ccol(e.category);
    badges.append(cat);
    if (e.org) badges.append(el('span', 'cal-org', e.org));
    if (e.kind) badges.append(el('span', 'cal-kind', e.kind));
    c.append(badges, el('div', 'cal-title', e.title));
    if (e.note) c.append(el('div', 'cal-note', e.note));
    const a = linkEl(e.url, '원문 보기 ↗');
    if (a) { const act = el('div', 'cal-ev-act'); act.append(a); c.append(act); }
    return c;
  }

  window.renderCalendar = function (root, data) {
    addStyle();
    const events = (data && data.events) || [];
    const byDate = new Map();
    events.forEach((e) => { if (!byDate.has(e.date)) byDate.set(e.date, []); byDate.get(e.date).push(e); });

    const todays = todayStr();
    const lastEventYm = events.length ? events.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)))[0].date.slice(0, 7) : todays.slice(0, 7);
    const [ty, tm] = todays.split('-').map(Number);
    const curYm = (ty + '-' + String(tm).padStart(2, '0') <= lastEventYm) ? todays.slice(0, 7) : lastEventYm;

    const state = { cat: 'all', ym: curYm, sel: byDate.has(todays) ? todays : null };

    const wrap = el('div', 'cal');
    const top = el('div', 'cal-top');
    const seg = el('div', 'cal-seg');
    const cats = ['all', '방미통위', '언론사'].filter((c) => c === 'all' || events.some((e) => e.category === c));
    const labels = { all: '전체' };
    const buttons = cats.map((c) => {
      const b = el('button', null, labels[c] || c); b.type = 'button'; b.setAttribute('aria-pressed', String(c === state.cat));
      b.addEventListener('click', () => { state.cat = c; buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b))); renderAll(); });
      seg.append(b); return b;
    });
    const stats = el('div', 'cal-stats');
    ['방미통위', '언론사'].forEach((c) => {
      const n = events.filter((e) => e.category === c).length;
      if (!n) return;
      const s = el('span', 'cal-stat'); const dot = el('i'); dot.style.background = ccol(c);
      s.append(dot, c + ' ' + n + '건'); stats.append(s);
    });
    top.append(seg, stats);

    const nav = el('div', 'cal-nav');
    const navBtns = el('div', 'cal-navbtns');
    const prevBtn = el('button', null, '‹'); prevBtn.type = 'button'; prevBtn.setAttribute('aria-label', '이전 달');
    const todayBtn = el('button', 'today', '오늘'); todayBtn.type = 'button';
    const nextBtn = el('button', null, '›'); nextBtn.type = 'button'; nextBtn.setAttribute('aria-label', '다음 달');
    navBtns.append(prevBtn, todayBtn, nextBtn);
    const h3 = el('h3');
    nav.append(h3, navBtns);

    const wdRow = el('div', 'cal-grid');
    WD.forEach((w, i) => { const c = el('div', 'cal-wd' + (i === 0 ? ' sun' : i === 6 ? ' sat' : ''), w); wdRow.append(c); });
    const grid = el('div', 'cal-grid');
    const detail = el('div', 'cal-detail');

    function shiftMonth(delta) {
      const [y, m] = state.ym.split('-').map(Number);
      const d = new Date(Date.UTC(y, m - 1 + delta, 1));
      state.ym = d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0');
      renderAll();
    }
    prevBtn.addEventListener('click', () => shiftMonth(-1));
    nextBtn.addEventListener('click', () => shiftMonth(1));
    todayBtn.addEventListener('click', () => { state.ym = todays.slice(0, 7); state.sel = byDate.has(todays) ? todays : null; renderAll(); });

    function filteredEventsFor(dateStr) {
      const list = byDate.get(dateStr) || [];
      return state.cat === 'all' ? list : list.filter((e) => e.category === state.cat);
    }

    function renderGrid() {
      h3.textContent = state.ym.split('-')[0] + '년 ' + Number(state.ym.split('-')[1]) + '월';
      const [y, m] = state.ym.split('-').map(Number);
      const first = new Date(Date.UTC(y, m - 1, 1));
      const startDow = first.getUTCDay();
      const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
      const prevDays = new Date(Date.UTC(y, m - 1, 0)).getUTCDate();
      const cells = [];
      for (let i = 0; i < startDow; i++) cells.push({ d: prevDays - startDow + 1 + i, out: true, ym: null });
      for (let d = 1; d <= daysInMonth; d++) cells.push({ d, out: false, ym: state.ym });
      let nextD = 1;
      while (cells.length % 7 !== 0) cells.push({ d: nextD++, out: true, ym: null });

      const frag = document.createDocumentFragment();
      cells.forEach((c) => {
        const dateStr = c.out ? null : state.ym + '-' + String(c.d).padStart(2, '0');
        const btn = el('button', 'cal-cell' + (c.out ? ' out' : '') + (dateStr === todays ? ' today' : '') + (dateStr && dateStr === state.sel ? ' sel' : ''));
        btn.type = 'button';
        btn.append(el('div', 'cd-num', String(c.d)));
        if (dateStr) {
          const evs = filteredEventsFor(dateStr);
          if (evs.length) {
            const chipsBox = el('div', 'cd-chips');
            evs.slice(0, 3).forEach((e) => { const chip = el('span', 'cal-chip', e.title); chip.style.background = ccol(e.category); chipsBox.append(chip); });
            if (evs.length > 3) chipsBox.append(el('span', 'cal-more', '+' + (evs.length - 3) + '건 더'));
            btn.append(chipsBox);
          }
          btn.addEventListener('click', () => { state.sel = dateStr; renderGrid(); renderDetail(); });
        } else {
          btn.disabled = true;
        }
        frag.append(btn);
      });
      grid.replaceChildren(frag);
    }

    function renderDetail() {
      if (!state.sel) { detail.replaceChildren(el('div', 'cal-empty', '날짜를 선택하면 해당 일정이 여기에 표시됩니다.')); return; }
      const evs = filteredEventsFor(state.sel);
      const [y, m, d] = state.sel.split('-');
      const head = el('h4', null, y + '년 ' + Number(m) + '월 ' + Number(d) + '일');
      if (!evs.length) { detail.replaceChildren(head, el('div', 'cal-empty', '이 날짜에는 일정이 없습니다.')); return; }
      const frag = document.createDocumentFragment();
      frag.append(head);
      evs.forEach((e) => frag.append(evCard(e)));
      detail.replaceChildren(frag);
    }

    function renderAll() { renderGrid(); renderDetail(); }
    renderAll();

    wrap.append(top, nav, wdRow, grid, detail);
    root.replaceChildren(wrap);
  };
})();

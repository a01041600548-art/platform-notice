/* 방미통위 · 주요 언론사 공식일정 캘린더
   window.renderCalendar(root, data)
   data = { updated, events: [{category, org, title, kind, date, url, note}] } */
(function () {
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const CAT_COLOR = { '방미통위': 'var(--c0)', '언론사': 'var(--c4)' };
  const ccol = (cat) => CAT_COLOR[cat] || 'var(--c6)';
  const CSS = `
  .cal { display: flex; flex-direction: column; gap: 1.1em; }
  .cal-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .8em; }
  .cal-seg { display: inline-flex; flex-wrap: wrap; gap: 4px; padding: 4px; background: color-mix(in srgb, var(--ink) 6%, var(--card)); border-radius: 14px; }
  .cal-seg button { font: inherit; font-weight: 800; font-size: .92em; min-height: 40px; padding: 0 1em; border-radius: 10px; border: 0; background: transparent; color: var(--ink2); cursor: pointer; transition: background .15s, color .15s; }
  .cal-seg button[aria-pressed="true"] { background: var(--card); color: var(--ink); box-shadow: 0 1px 3px rgba(0,0,0,.12); }
  .cal-stats { display: flex; flex-wrap: wrap; gap: .5em; font-size: .85em; color: var(--ink2); }
  .cal-stat { display: inline-flex; align-items: center; gap: .4em; font-weight: 700; }
  .cal-stat i { width: 9px; height: 9px; border-radius: 999px; display: inline-block; }
  .cal-month { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; background: var(--card); box-shadow: var(--shadow); }
  .cal-mhead { padding: .7em 1.1em; font-weight: 800; font-size: 1.02em; background: color-mix(in srgb, var(--ink) 4%, var(--card)); border-bottom: 1px solid var(--line); }
  .cal-row { display: grid; grid-template-columns: 4.6em 1fr auto; gap: .8em; align-items: start; padding: .85em 1.1em; border-top: 1px solid var(--line); }
  .cal-row:first-of-type { border-top: 0; }
  .cal-day { font-weight: 800; font-variant-numeric: tabular-nums; color: var(--ink); line-height: 1.2; }
  .cal-day small { display: block; font-weight: 700; font-size: .7em; color: var(--ink2); }
  .cal-body { display: flex; flex-direction: column; gap: .3em; min-width: 0; }
  .cal-badges { display: flex; flex-wrap: wrap; gap: .4em; align-items: center; }
  .cal-cat { display: inline-flex; align-items: center; gap: .35em; font-size: .72em; font-weight: 800; padding: .15em .6em; border-radius: 999px; color: #fff; white-space: nowrap; }
  .cal-kind { display: inline-flex; font-size: .72em; font-weight: 700; color: var(--ink2); border: 1px solid var(--line); padding: .1em .55em; border-radius: 999px; white-space: nowrap; }
  .cal-org { font-weight: 700; color: var(--ink2); font-size: .88em; }
  .cal-title { font-weight: 800; color: var(--ink); line-height: 1.4; }
  .cal-note { font-size: .86em; color: var(--ink2); line-height: 1.5; }
  .cal-act { align-self: center; }
  .cal-act a { font-size: .82em; font-weight: 800; color: var(--c0); white-space: nowrap; text-decoration: none; }
  .cal-act a:hover { text-decoration: underline; }
  .cal-empty { padding: 2em 1em; text-align: center; color: var(--ink2); }
  @media (max-width: 560px) {
    .cal-row { grid-template-columns: 3.6em 1fr; }
    .cal-act { grid-column: 1 / -1; }
  }
  `;
  function addStyle() { if (document.getElementById('cal-style')) return; const s = el('style'); s.id = 'cal-style'; s.textContent = CSS; document.head.appendChild(s); }

  const linkEl = (u, t) => {
    if (typeof u !== 'string' || !/^https:\/\//.test(u)) return null;
    const a = el('a', null, t); a.href = u; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a;
  };

  function row(ev) {
    const r = el('div', 'cal-row');
    const [, m, d] = String(ev.date).split('-');
    const day = el('div', 'cal-day'); day.append(Number(d) + '일', el('small', null, Number(m) + '월'));
    const body = el('div', 'cal-body');
    const badges = el('div', 'cal-badges');
    const cat = el('span', 'cal-cat', ev.category); cat.style.background = ccol(ev.category);
    badges.append(cat);
    if (ev.org) badges.append(el('span', 'cal-org', ev.org));
    if (ev.kind) badges.append(el('span', 'cal-kind', ev.kind));
    body.append(badges, el('div', 'cal-title', ev.title));
    if (ev.note) body.append(el('div', 'cal-note', ev.note));
    r.append(day, body);
    const a = linkEl(ev.url, '원문 보기 ↗');
    if (a) { const act = el('div', 'cal-act'); act.append(a); r.append(act); }
    return r;
  }

  window.renderCalendar = function (root, data) {
    addStyle();
    const events = (data && data.events) || [];
    const state = { cat: 'all' };
    const wrap = el('div', 'cal');
    const top = el('div', 'cal-top');
    const seg = el('div', 'cal-seg');
    const cats = ['all', '방미통위', '언론사'].filter((c) => c === 'all' || events.some((e) => e.category === c));
    const labels = { all: '전체' };
    const buttons = cats.map((c) => {
      const b = el('button', null, labels[c] || c); b.type = 'button'; b.setAttribute('aria-pressed', String(c === state.cat));
      b.addEventListener('click', () => { state.cat = c; buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b))); renderList(); });
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
    const listBox = el('div');
    wrap.append(top, listBox);

    function renderList() {
      const filtered = state.cat === 'all' ? events : events.filter((e) => e.category === state.cat);
      if (!filtered.length) { listBox.replaceChildren(el('div', 'cal-empty', '표시할 일정이 없습니다.')); return; }
      const byMonth = new Map();
      filtered.forEach((e) => { const ym = String(e.date).slice(0, 7); if (!byMonth.has(ym)) byMonth.set(ym, []); byMonth.get(ym).push(e); });
      const months = Array.from(byMonth.keys()).sort().reverse();
      const frag = document.createDocumentFragment();
      months.forEach((ym) => {
        const card = el('div', 'cal-month');
        const [y, m] = ym.split('-');
        card.append(el('div', 'cal-mhead', y + '년 ' + Number(m) + '월'));
        byMonth.get(ym).forEach((e) => card.append(row(e)));
        frag.append(card);
      });
      listBox.replaceChildren(frag);
    }
    renderList();
    root.replaceChildren(wrap);
  };
})();

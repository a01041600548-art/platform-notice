/* 채널 라인업 화면 v3 — 상품 유형(디지털·8VSB·IP) · 방송구역별 · 검증 상태·근거 패널
   window.renderLineup(root, data)
   data = { plats:[{op,kind,type,region,src,basis,date,prods}],
            chans:[{n,g,corp,al,c:{platIdx:[no,tier]}}],
            evidence:{ "<platIdx>|<채널명>": {status, sourceId, sourceUrl, pdfPage, tableLabel,
                       effectiveDate, collectedAt, verifiedAt, regionalCondition, reviewNote,
                       extractionMethod, conflictWith, ...} },
            evidenceMeta:{...} }

   ---- 데이터 모델 어댑터 (지시문 E) ----
   기존 lineup.enc.json의 c/evidence 포맷은 그대로 유지한다(로딩·암호화 방식 불변).
   evRecord()가 지시문 E의 필드 목록(operatorId, serviceType, regionId, channelNumber(string),
   productIds/paidOption, status, sourceId/sourceUrl/sourceFileHash/pdfPage/printedPage/
   sourceQuote, effectiveDate/publishedDate/collectedAt/verifiedAt, reviewNote 등)을 담은
   정규화된 레코드로 "조회 시점에" 변환해 돌려준다. 실제로 갖고 있지 않은 근거(원문 해시,
   인쇄본 페이지 등)는 null로 두고 지어내지 않는다. evidence에 없는 셀은 기본값 status:'unknown'
   (빈 셀) 또는 'present_unverified'(값은 있으나 원문 재검증 전)로 취급해, 값이 있다고 해서
   자동으로 검증된 것처럼 보이지 않게 한다. */
(function () {
  // 홈쇼핑은 생방송 TV홈쇼핑(7개사)과 데이터홈쇼핑(T커머스, 10개사)이 승인 근거·규제가 서로 달라 나눠 둔다
  const GC = { '종교': '#7c3aed', '영화': '#dc2626', '해외드라마': '#db2777', '국내드라마': '#ea580c', '음악': '#c026d3', '스포츠': '#16a34a', '시사·경제': '#0891b2', '교양·생활정보': '#0d9488', '예능·오락': '#d97706', '취미·레저': '#65a30d', '어린이·교육': '#2563eb', '기타': '#64748b', 'TV홈쇼핑': '#a16207', '데이터홈쇼핑': '#ca8a04', '홈쇼핑': '#a16207', '지상파·종편·보도': '#334155', '유료채널': '#9333ea', '평가 외·해외': '#94a3b8' };
  const GORDER = ['지상파·종편·보도', 'TV홈쇼핑', '데이터홈쇼핑', '홈쇼핑', '국내드라마', '해외드라마', '예능·오락', '영화', '스포츠', '시사·경제', '교양·생활정보', '어린이·교육', '취미·레저', '음악', '종교', '기타', '유료채널', '평가 외·해외'];
  const TC = { '디지털': '#2563eb', '8VSB': '#ea580c', 'IP': '#7c3aed', 'IPTV': '#0f766e', '위성': '#0369a1' };
  const ME = /JEI|재능/;
  const MINE = () => document.body.classList.contains('mine');
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const CSS = `
  /* --lu-* 토큰은 보통 #lineupTab 안에서만 정의된다. 근거 패널·상세 다이얼로그는
     document.body에 직접 붙어(#lineupTab 바깥) 그 값을 상속받지 못해 배경이
     투명해지는 문제가 있었다 — :root에 동일한 기본값을 둬서 해결한다. */
  :root { --lu-bg: var(--bg); --lu-card: var(--card); --lu-ink: var(--ink); --lu-muted: var(--ink2); --lu-line: var(--line); --lu-accent: var(--navy, var(--c0)); }
  .lu { display: flex; flex-direction: column; gap: 1.3em; position: relative; }
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
  .lu-t th, .lu-t td { padding: .7em .75em; border-bottom: 1px solid var(--lu-line); text-align: center; white-space: nowrap; font-size: .97em; }
  .lu-t.dense th, .lu-t.dense td { padding: .4em .6em; font-size: .9em; }
  .lu-t thead th { position: sticky; top: 0; z-index: 2; background: var(--lu-card); font-size: .85em; font-weight: 800; color: var(--lu-ink); border-bottom: 2px solid var(--lu-line); vertical-align: bottom; line-height: 1.35; }
  .lu-t thead th .tb { margin-bottom: .3em; }
  .lu-t thead th .rb { display: flex; justify-content: center; margin-top: .2em; }
  .lu-t th.ch, .lu-t td.ch { position: sticky; left: 0; z-index: 1; background: var(--lu-card); text-align: left; min-width: 11.5em; max-width: 15em; white-space: normal; border-right: 1px solid var(--lu-line); }
  .lu-t thead th.ch { z-index: 3; }
  .lu-t td.ch { font-weight: 800; box-shadow: inset 4px 0 0 var(--gc); padding-left: 1em; }
  .lu-t td.ch small { display: block; font-weight: 600; font-size: .78em; color: var(--lu-muted); margin-top: .1em; }
  .lu-t tr.me td { background: color-mix(in srgb, var(--lu-accent) 8%, var(--lu-card)); }
  .lu-t td.no { font-weight: 800; font-size: 1.02em; cursor: pointer; }
  .lu-t td.no:hover, .lu-t td.na:hover { outline: 1.5px dashed color-mix(in srgb, var(--lu-accent) 50%, transparent); outline-offset: -1.5px; }
  .lu-t td.no.t1 { color: #2563eb; } .lu-t td.no.t2 { color: #7c3aed; } .lu-t td.no.t3 { color: #db2777; }
  .lu-t td.na { color: var(--lu-muted); font-size: .82em; font-weight: 700; cursor: pointer; }
  .lu-t td.na.st-va { color: #15803d; } .lu-t td.na.st-ef, .lu-t td.na.st-ff { color: var(--bad, #c2410c); } .lu-t td.na.st-vc { color: var(--warn, #a16207); }
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
  details.lu-rgcard { padding: .85em 1.1em; }
  details.lu-rgcard summary { cursor: pointer; display: flex; align-items: center; flex-wrap: wrap; gap: .5em; font-size: 1.05em; font-weight: 800; list-style: revert; }
  details.lu-rgcard summary::marker { color: var(--lu-muted); }
  details.lu-rgcard[open] summary { margin-bottom: .6em; }
  .lu-rgstat { margin-left: auto; font-size: .78em; font-weight: 700; color: var(--lu-muted); }
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
  .lu-ev.vp { color: #16a34a; } .lu-ev.vc { color: var(--warn, #a16207); } .lu-ev.va { color: var(--lu-muted); } .lu-ev.ef, .lu-ev.ff { color: var(--bad, #c2410c); }
  .lu-tu { display: inline-block; margin-left: .2em; font-size: .72em; font-weight: 800; color: var(--lu-muted); cursor: help; vertical-align: top; }
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
  .lu-empty-list { font-variant-numeric: tabular-nums; word-break: break-all; }

  /* ---- F. 업무 화면 개편 — 상단 바 ---- */
  .lu-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .7em; padding: .2em 0; }
  .lu-top .scope { font-size: .92em; color: var(--lu-muted); font-weight: 700; }
  .lu-top .scope b { color: var(--lu-ink); font-variant-numeric: tabular-nums; }
  .lu-export { font: inherit; font-weight: 800; font-size: .88em; min-height: 42px; padding: 0 1.1em; border-radius: 10px; border: 1.5px solid var(--lu-accent); background: color-mix(in srgb, var(--lu-accent) 10%, var(--lu-card)); color: var(--lu-accent); cursor: pointer; }
  .lu-export:hover { background: color-mix(in srgb, var(--lu-accent) 18%, var(--lu-card)); }

  /* ---- 상태 요약 바 ---- */
  .lu-stat { display: grid; grid-template-columns: repeat(auto-fit, minmax(9.5em, 1fr)); gap: .6em; padding: 1em 1.1em; }
  .lu-stat button { font: inherit; text-align: left; border-radius: 12px; border: 1.5px solid var(--lu-line); background: var(--lu-bg); cursor: pointer; padding: .7em .9em; display: flex; flex-direction: column; gap: .15em; }
  .lu-stat button[aria-pressed="true"] { border-color: var(--lu-accent); background: color-mix(in srgb, var(--lu-accent) 10%, var(--lu-bg)); }
  .lu-stat button b { font-size: 1.5em; font-weight: 800; font-variant-numeric: tabular-nums; }
  .lu-stat button span { font-size: .84em; font-weight: 700; color: var(--lu-muted); display: flex; align-items: center; gap: .35em; }
  .lu-stat .dot { width: .6em; height: .6em; border-radius: 50%; display: inline-block; flex: none; }
  .lu-stat .d-vp { background: #15803d; } .lu-stat .d-vc { background: var(--warn, #a16207); } .lu-stat .d-ef { background: var(--bad, #c2410c); } .lu-stat .d-ff { background: #6b7280; }
  .lu-stat .cap { font-size: .72em; color: var(--lu-muted); font-weight: 600; }
  .lu-stat-cap { grid-column: 1 / -1; margin: 0 0 .1em; font-size: .83em; color: var(--lu-muted); font-weight: 600; line-height: 1.5; }

  /* ---- 도구막대 2행 + 칩 ---- */
  .lu-tool2 { display: flex; flex-wrap: wrap; gap: .6em 1em; align-items: flex-start; }
  .lu-fld { display: flex; flex-direction: column; gap: .3em; min-width: 9em; flex: 1 1 11em; }
  .lu-fld > span { font-size: .78em; font-weight: 800; color: var(--lu-muted); }
  .lu-chips { display: flex; flex-wrap: wrap; gap: .4em; align-items: center; padding-top: .2em; }
  .lu-chip { display: inline-flex; align-items: center; gap: .35em; font-size: .82em; font-weight: 700; padding: .3em .35em .3em .8em; border-radius: 999px; background: color-mix(in srgb, var(--lu-accent) 12%, var(--lu-card)); color: var(--lu-accent); border: 1px solid color-mix(in srgb, var(--lu-accent) 35%, transparent); }
  .lu-chip button { font: inherit; width: 1.4em; height: 1.4em; border-radius: 50%; border: 0; background: color-mix(in srgb, var(--lu-accent) 18%, transparent); color: inherit; cursor: pointer; line-height: 1; }
  .lu-reset { font: inherit; font-weight: 800; font-size: .82em; border: 0; background: transparent; color: var(--lu-muted); text-decoration: underline; cursor: pointer; padding: .3em .2em; }

  /* ---- 비교 플랫폼 선택 ---- */
  .lu-colsel { position: relative; }
  .lu-colsel > summary { list-style: none; cursor: pointer; font: inherit; font-weight: 800; font-size: .88em; min-height: 46px; display: inline-flex; align-items: center; padding: 0 1em; border-radius: 12px; border: 1.5px solid var(--lu-line); background: var(--lu-bg); color: var(--lu-ink); }
  .lu-colsel > summary::-webkit-details-marker { display: none; }
  .lu-colsel[open] > summary { border-color: var(--lu-accent); }
  .lu-colsel-pop { position: absolute; z-index: 5; top: calc(100% + .4em); left: 0; width: min(26em, 90vw); max-height: 60vh; overflow: auto; background: var(--lu-card); border: 1.5px solid var(--lu-line); border-radius: 14px; box-shadow: 0 16px 40px rgba(0,0,0,.18); padding: .7em; }
  .lu-colsel-pop label { display: flex; align-items: center; gap: .6em; padding: .5em .4em; border-radius: 8px; font-size: .92em; cursor: pointer; }
  .lu-colsel-pop label:hover { background: color-mix(in srgb, var(--lu-ink) 5%, transparent); }
  .lu-colsel-pop .all { font-weight: 800; border-bottom: 1px dashed var(--lu-line); margin-bottom: .3em; padding-bottom: .6em; }
  .lu-mine-btn { font: inherit; font-weight: 800; font-size: .88em; min-height: 46px; padding: 0 1.1em; border-radius: 12px; border: 1.5px solid var(--lu-line); background: var(--lu-bg); color: var(--lu-ink); cursor: pointer; }
  .lu-mine-btn[aria-pressed="true"] { border-color: var(--lu-accent); background: color-mix(in srgb, var(--lu-accent) 14%, var(--lu-bg)); color: var(--lu-accent); }
  .lu-dens { display: inline-flex; gap: 2px; padding: 2px; border-radius: 10px; background: color-mix(in srgb, var(--lu-ink) 6%, var(--lu-card)); }
  .lu-dens button { font: inherit; font-size: .82em; font-weight: 700; min-height: 38px; padding: 0 .8em; border-radius: 8px; border: 0; background: transparent; color: var(--lu-muted); cursor: pointer; }
  .lu-dens button[aria-pressed="true"] { background: var(--lu-card); color: var(--lu-ink); }

  /* ---- 근거 패널(셀 선택 시 오른쪽) ---- */
  .lu-panel-ov { position: fixed; inset: 0; background: rgba(10,10,10,.35); z-index: 59; display: none; }
  .lu-panel-ov.open { display: block; }
  .lu-panel { position: fixed; top: 0; right: 0; height: 100vh; width: min(26em, 100vw); background: var(--lu-card); color: var(--lu-ink); border-left: 1px solid var(--lu-line); box-shadow: -18px 0 40px rgba(0,0,0,.18); z-index: 60; transform: translateX(100%); transition: transform .2s ease; display: flex; flex-direction: column; }
  .lu-panel.open { transform: translateX(0); }
  .lu-panel-h { display: flex; align-items: flex-start; justify-content: space-between; gap: .8em; padding: 1.1em 1.2em .8em; border-bottom: 1px solid var(--lu-line); }
  .lu-panel-h h3 { margin: 0; font-size: 1.15em; font-weight: 800; }
  .lu-panel-h p { margin: .2em 0 0; font-size: .85em; color: var(--lu-muted); }
  .lu-panel-x { font: inherit; min-width: 36px; min-height: 36px; border-radius: 10px; border: 1.5px solid var(--lu-line); background: var(--lu-bg); color: var(--lu-ink); cursor: pointer; flex: none; }
  .lu-panel-b { padding: 1em 1.2em 1.6em; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 1.1em; }
  .lu-pf { display: flex; flex-direction: column; gap: .25em; }
  .lu-pf > span { font-size: .76em; font-weight: 800; color: var(--lu-muted); letter-spacing: .02em; }
  .lu-pf > div, .lu-pf > a { font-size: .97em; font-weight: 700; word-break: break-word; }
  .lu-pf > a { color: var(--lu-accent); text-decoration: underline; }
  .lu-pbig { font-size: 1.9em; font-weight: 800; font-variant-numeric: tabular-nums; }
  .lu-pbadge { display: inline-flex; align-items: center; gap: .4em; font-size: .85em; font-weight: 800; padding: .3em .7em; border-radius: 999px; }
  .lu-pbadge.vp { background: color-mix(in srgb, #15803d 15%, transparent); color: #15803d; }
  .lu-pbadge.vc { background: color-mix(in srgb, var(--warn, #a16207) 18%, transparent); color: var(--warn, #a16207); }
  .lu-pbadge.va { background: color-mix(in srgb, var(--lu-muted) 18%, transparent); color: var(--lu-muted); }
  .lu-pbadge.ef, .lu-pbadge.ff { background: color-mix(in srgb, var(--bad, #c2410c) 15%, transparent); color: var(--bad, #c2410c); }
  .lu-pbadge.un { background: color-mix(in srgb, var(--lu-ink) 10%, transparent); color: var(--lu-muted); }
  .lu-pconf { border: 1.5px dashed var(--warn, #a16207); border-radius: 10px; padding: .7em .8em; background: color-mix(in srgb, var(--warn, #a16207) 8%, transparent); font-size: .9em; }
  @media (max-width: 480px) { .lu-panel { width: 100vw; } }

  /* ---- 모바일 카드형 비교(≤480px) ---- */
  .lu-cards { display: flex; flex-direction: column; gap: .6em; }
  .lu-cardrow { background: var(--lu-card); border: 1px solid var(--lu-line); border-radius: 14px; padding: .9em 1em; box-shadow: inset 4px 0 0 var(--gc); }
  .lu-cardrow h5 { margin: 0 0 .5em; font-size: 1em; font-weight: 800; display: flex; align-items: center; justify-content: space-between; gap: .5em; }
  .lu-cardrow h5 small { font-weight: 600; color: var(--lu-muted); font-size: .78em; }
  .lu-cardgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(8em, 1fr)); gap: .5em; }
  .lu-cardcell { border-radius: 10px; background: color-mix(in srgb, var(--lu-ink) 4%, var(--lu-card)); padding: .5em .6em; min-height: 44px; display: flex; flex-direction: column; justify-content: center; gap: .1em; cursor: pointer; border: 0; text-align: left; font: inherit; }
  .lu-cardcell b { font-size: 1.1em; font-variant-numeric: tabular-nums; }
  .lu-cardcell small { color: var(--lu-muted); font-size: .72em; }
  `;
  function addStyle() { if (document.getElementById('lu-style')) return; const s = el('style'); s.id = 'lu-style'; s.textContent = CSS; document.head.appendChild(s); }
  const tlabel = (p) => p.kind === '케이블' ? p.type : p.kind;
  const tbadge = (p) => { const b = el('span', 'tb', tlabel(p)); b.style.setProperty('--tc', TC[tlabel(p)] || '#64748b'); return b; };
  const shortReg = (r) => (r || '').replace(/방송$/, '');
  const numv = (v) => { if (!v) return 1e9; const m = String(v[0]).match(/^(\d+)(?:-(\d+))?/); return m ? +m[1] + (m[2] ? +m[2] / 100 : 0) : 1e9; };

  function groupsOf(D) { // 운영사·유형별 세트 묶음
    const g = []; const map = {};
    D.plats.forEach((p, i) => { const k = p.op + '|' + tlabel(p); if (!map[k]) { map[k] = { key: k, op: p.op, p, type: tlabel(p), kind: p.kind, idx: [] }; g.push(map[k]); } map[k].idx.push(i); });
    const order = { 'IPTV': 0, '위성': 1, '디지털': 2, '8VSB': 3, 'IP': 4 };
    return g.sort((a, b) => order[a.type] - order[b.type] || a.op.localeCompare(b.op, 'ko'));
  }
  const pick = (D, gr, state) => { if (gr.idx.length === 1) return gr.idx[0]; const r = state.reg[gr.op]; const f = gr.idx.find((i) => D.plats[i].region === r); return f != null ? f : gr.idx[0]; };

  const sp = (s) => String(s || '').replace(/^(B tv |tv |지니 TV |U\+tv |iTV |UHD |헬로tv )/i, '').trim();
  const prodOf = (p, v) => (v && p && p.prods && v[1] >= 0 && p.prods[v[1]]) ? sp(p.prods[v[1]]) : '';
  // 상품 단계: v[1] === -1 → 상품 미확인(최저 상품 포함 여부를 원문에서 특정하지 못함, 추정 금지)
  //           v[1] === 0  → 최저 상품에 포함되는 것까지 확인됨
  //           v[1]  >  0  → 해당 색인 상품부터 포함(prods[v[1]])
  const tierKind = (v) => !v ? 'none' : (v[1] === -1 ? 'unk' : (v[1] === 0 ? 'base' : 'higher'));
  const tierText = (p, v) => { const k = tierKind(v); if (k === 'unk') return '상품 미확인 — 어느 상품부터 포함되는지 원문 미확인'; if (k === 'base') return '최저 상품에 포함'; if (k === 'higher') return (prodOf(p, v) || ('상품 ' + (v[1] + 1) + '단계')) + '부터 포함'; return ''; };

  // ---- E. 근거 레코드 어댑터 ----
  // 지시문 E의 필드 목록으로 정규화한다. evidence에 실제로 있는 값만 옮기고,
  // 갖고 있지 않은 근거(파일 해시, 인쇄 쪽수, 원문 발췌 좌표 등)는 null로 둔다.
  // 플랫폼 단위 원문 대조 결과(verified/verifiedSrc) 조회용 — 매번 배열을 훑지 않도록 Set으로 캐시
  let VSET = null;
  function verifiedSet(D, platIdx) {
    if (!VSET) {
      VSET = {};
      Object.keys(D.verified || {}).forEach((k) => { VSET[k] = new Set(D.verified[k]); });
    }
    return VSET[platIdx] || null;
  }
  function evRecord(D, platIdx, chan, v) {
    const p = D.plats[platIdx] || {};
    const raw = (D.evidence && D.evidence[platIdx + '|' + chan.n]) || null;
    // 셀 단위 예외 기록이 우선, 없으면 플랫폼 단위 원문 대조 결과를 본다
    const vs = verifiedSet(D, platIdx);
    const vsrc = (D.verifiedSrc && D.verifiedSrc[platIdx]) || null;
    const byList = !raw && v && vs && vs.has(chan.n) ? vsrc : null;
    const status = raw ? raw.status : (byList ? 'verified_present' : (v ? 'present_unverified' : 'unknown'));
    if (byList) {
      return {
        operatorId: p.op || null, serviceType: tlabel(p) || null, regionId: p.region || null,
        audienceType: null, channelId: chan.n, canonicalName: chan.n, rawName: chan.n,
        channelNumber: String(v[0]),
        quality: null,
        productIds: tierKind(v) === 'unk' ? null : [v[1]],
        paidOption: null, regionalCondition: null, status,
        sourceId: byList.sourceId || null, sourceUrl: null,
        sourceFileHash: byList.sourceFileHash || null,
        pdfPage: (byList.pdfPages || []).join(', ') || null,
        printedPage: null, tableLabel: byList.tableLabel || null, sourceQuote: null,
        effectiveDate: byList.effectiveDate || null, publishedDate: null,
        collectedAt: p.date || null, verifiedAt: byList.verifiedAt || null,
        extractionMethod: byList.extractionMethod || null,
        reviewNote: byList.scopeLabel || null, conflictWith: null,
      };
    }
    return {
      operatorId: p.op || null,
      serviceType: tlabel(p) || null,
      regionId: p.region || null,
      audienceType: null, // 원문에서 가정용/사업장용 구분 근거를 확보하지 못함 — 지어내지 않음
      channelId: chan.n, // 정규 채널 ID 체계가 없어 채널명을 키로 사용(별칭은 chan.al 참고)
      canonicalName: chan.n,
      rawName: chan.n,
      channelNumber: v ? String(v[0]) : null,
      quality: /HD|UHD|SD/.test(chan.n) ? (chan.n.match(/UHD|HD|SD/) || [null])[0] : null,
      productIds: v ? (tierKind(v) === 'unk' ? null : [v[1]]) : null,
      paidOption: null,
      regionalCondition: (raw && raw.regionalCondition) || null,
      status,
      sourceId: (raw && raw.sourceId) || null,
      sourceUrl: (raw && raw.sourceUrl) || null,
      sourceFileHash: null, // 검증대장.json에 파일 단위 SHA-256은 있으나 셀 단위로 연결된 값은 없음
      pdfPage: (raw && raw.pdfPage) || null,
      printedPage: null, // 인쇄 쪽번호는 PDF 뷰어 쪽수와 다를 수 있어 별도 확인 전 비워둠
      tableLabel: (raw && raw.tableLabel) || null,
      sourceQuote: null,
      effectiveDate: (raw && raw.effectiveDate) || null,
      publishedDate: null,
      collectedAt: (raw && raw.collectedAt) || p.date || null,
      verifiedAt: (raw && raw.verifiedAt) || null,
      extractionMethod: (raw && raw.extractionMethod) || null,
      reviewNote: (raw && raw.reviewNote) || null,
      conflictWith: (raw && raw.conflictWith) || null,
    };
  }
  const STATUS_META = {
    verified_present: { label: '확인완료', short: '확인됨', icon: '✓', cls: 'vp' },
    source_conflict: { label: '자료 충돌', short: '충돌', icon: '⚠', cls: 'vc' },
    verified_absent: { label: '미편성 확인', short: '미편성', icon: '○', cls: 'va' },
    extraction_failed: { label: '인식 필요', short: '인식필요', icon: '!', cls: 'ef' },
    fetch_failed: { label: '수집 실패', short: '수집실패', icon: '×', cls: 'ff' },
    present_unverified: { label: '값 있음 · 원문 미검증', short: '', icon: '', cls: 'un' },
    // '미확인'이라는 단어만 셀에 그대로 찍으면 "미편성"과 헷갈린다는 피드백이 있어
    // 표 안에서는 대시(─)로만 보여주고, 실제 뜻("아직 원문 대조를 못 했다 — 없는 게 확정된 게 아니다")은
    // 툴팁(aria-label/title)과 범례에서 풀어서 설명한다.
    unknown: { label: '미확인 — 원문 대조 전', short: '─', icon: '', cls: 'un' },
  };
  function statusCounts(D) {
    const c = { verified_present: 0, source_conflict: 0, extraction_failed: 0, fetch_failed: 0 };
    Object.values(D.evidence || {}).forEach((e) => { if (c[e.status] !== undefined) c[e.status]++; });
    // 플랫폼 단위 원문 대조로 확인된 셀도 함께 센다(셀 단위 예외 기록과 중복되지 않게 제외)
    Object.keys(D.verified || {}).forEach((pi) => {
      (D.verified[pi] || []).forEach((n) => { if (!(D.evidence || {})[pi + '|' + n]) c.verified_present++; });
    });
    return c;
  }
  // 특정 검증상태를 가진 (채널명) 집합 — 상태 요약 바 클릭 시 행 필터용
  function namesWithStatus(D, status) {
    const s = new Set();
    Object.entries(D.evidence || {}).forEach(([k, e]) => { if (e.status === status) s.add(k.split('|').slice(1).join('|')); });
    if (status === 'verified_present') {
      Object.keys(D.verified || {}).forEach((pi) => (D.verified[pi] || []).forEach((n) => s.add(n)));
    }
    return s;
  }

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
        const k = tierKind(v);
        td3.append(el('b', '', k === 'base' ? '최저 포함' : k === 'unk' ? '상품 미확인' : '고티어'), document.createTextNode(' · ' + (k === 'higher' ? tierText(p, v) : k === 'unk' ? '추정 안 함' : '기본 상품')));
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

  // ---- 근거 패널(셀 선택 시 오른쪽) ----
  let panelTrigger = null;
  function getPanelEls() {
    let ov = document.getElementById('lu-panel-ov'), pn = document.getElementById('lu-panel');
    if (!pn) {
      ov = el('div', 'lu-panel-ov'); ov.id = 'lu-panel-ov';
      pn = el('div', 'lu-panel'); pn.id = 'lu-panel'; pn.setAttribute('role', 'dialog'); pn.setAttribute('aria-modal', 'false'); pn.setAttribute('aria-label', '채널 근거 정보');
      document.body.append(ov, pn);
      ov.addEventListener('click', closePanel);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && pn.classList.contains('open')) closePanel(); });
    }
    return { ov, pn };
  }
  function closePanel() {
    const { ov, pn } = getPanelEls();
    pn.classList.remove('open'); ov.classList.remove('open');
    if (panelTrigger && panelTrigger.isConnected) panelTrigger.focus();
    panelTrigger = null;
  }
  function row(label, val) { const d = el('div', 'lu-pf'); d.append(el('span', '', label)); const v = el('div', '', val == null ? '—' : val); d.append(v); return d; }
  function openCellPanel(D, platIdx, c, v, triggerEl) {
    panelTrigger = triggerEl || null;
    const { ov, pn } = getPanelEls();
    const p = D.plats[platIdx]; const r = evRecord(D, platIdx, c, v); const meta = STATUS_META[r.status] || STATUS_META.unknown;
    pn.replaceChildren();
    const head = el('div', 'lu-panel-h');
    const htxt = el('div'); htxt.append(el('h3', '', c.n), el('p', '', p.op + ' · ' + tlabel(p) + (p.region ? ' · ' + p.region : '')));
    head.append(htxt);
    const x = el('button', 'lu-panel-x', '✕'); x.type = 'button'; x.setAttribute('aria-label', '근거 패널 닫기'); x.addEventListener('click', closePanel);
    head.append(x); pn.append(head);
    const body = el('div', 'lu-panel-b');
    const cur = el('div', 'lu-pf'); cur.append(el('span', '', '현재 값'));
    const curBox = el('div'); curBox.append(el('span', 'lu-pbig', v ? v[0] + '번' : '미확인'));
    curBox.append(document.createTextNode(' ')); const bd = el('span', 'lu-pbadge ' + meta.cls); bd.append((meta.icon ? meta.icon + ' ' : '') + meta.label); curBox.append(bd);
    cur.append(curBox); body.append(cur);
    body.append(row('상품 조건', v ? tierText(p, v) : '편성되지 않음(또는 미확인)'));
    body.append(row('지역 조건', r.regionalCondition || (p.region ? p.region + ' 기준 대표값' : '지역 구분 없음 / 추가 확인 없음')));
    if (r.conflictWith) { const cf = el('div', 'lu-pconf'); cf.append('⚠ 충돌 값: ' + r.conflictWith); body.append(cf); }
    body.append(row('원문 자료', r.sourceId ? r.sourceId + (r.pdfPage ? ' · ' + r.pdfPage + '쪽' : '') : '연결된 원문 없음(원문 전수 대조 전)'));
    if (r.sourceUrl) { const a = el('div', 'lu-pf'); a.append(el('span', '', '원문 링크')); const l = el('a', '', '공식 자료 열기 ↗'); l.href = r.sourceUrl; l.target = '_blank'; l.rel = 'noopener'; a.append(l); body.append(a); }
    if (r.tableLabel) body.append(row('표 명칭', r.tableLabel));
    body.append(row('시행일 / 확인일', [r.effectiveDate ? '시행 ' + r.effectiveDate : null, r.verifiedAt ? '검수 ' + r.verifiedAt : (r.collectedAt ? '수집 ' + r.collectedAt : null)].filter(Boolean).join(' · ') || null));
    if (r.extractionMethod) body.append(row('추출 방식', r.extractionMethod));
    if (r.reviewNote) body.append(row('검수 메모', r.reviewNote));
    body.append(row('별칭', c.al || null));
    pn.append(body);
    ov.classList.add('open'); pn.classList.add('open');
    x.focus();
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
        const mv = vals.find((x) => x.v[0] === mode); const pn2 = mv ? prodOf(D.plats[mv.i], mv.v) : '';
        if (pn2) td.append(el('em', 'lu-prod', pn2 + (mv.v[1] > 0 ? '부터' : ' 포함')));
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

  function regionPickers(D, G, state, rerender, onlyOps) {
    const wrap = el('div', 'lu-regs');
    let ops = [...new Set(G.filter((g) => g.idx.length > 1).map((g) => g.op))];
    if (onlyOps) ops = ops.filter((op) => onlyOps.has(op));
    ops.forEach((op) => {
      const regs = [...new Set(D.plats.filter((p) => p.op === op && p.kind === '케이블' && p.region && p.region !== 'SO 공통').map((p) => p.region))];
      const lab = el('label'); lab.append(op);
      const s = el('select'); regs.forEach((r) => s.append(new Option(r, r))); s.value = state.reg[op] || regs[0];
      s.addEventListener('change', () => { state.reg[op] = s.value; rerender(); });
      lab.append(s); wrap.append(lab);
    });
    return wrap;
  }

  // 비교 플랫폼 선택(기본 3~5개 열 + 전체 보기)
  function colSelector(D, G, state, rerender) {
    const det = el('details', 'lu-colsel'); det.open = Boolean(state.colOpen);
    det.addEventListener('toggle', () => { state.colOpen = det.open; });
    const shown = state.allCols ? G.length : Math.min(G.length, (state.cols || []).length || 0);
    const sum = el('summary', '', `비교 플랫폼 선택 (${state.allCols ? G.length : shown}/${G.length})`);
    det.append(sum);
    const pop = el('div', 'lu-colsel-pop');
    const allLab = el('label', 'all'); const allCb = el('input'); allCb.type = 'checkbox'; allCb.checked = Boolean(state.allCols);
    allCb.addEventListener('change', () => { state.allCols = allCb.checked; rerender(); });
    allLab.append(allCb, document.createTextNode(' 전체 보기 (' + G.length + '개)')); pop.append(allLab);
    G.forEach((g) => {
      const lab = el('label'); const cb = el('input'); cb.type = 'checkbox';
      cb.checked = state.allCols || (state.cols || []).includes(g.key);
      cb.disabled = Boolean(state.allCols);
      cb.addEventListener('change', () => {
        const set = new Set(state.cols || []);
        if (cb.checked) set.add(g.key); else set.delete(g.key);
        state.cols = [...set]; rerender();
      });
      const txt = el('span'); txt.append(tbadge(g.p), document.createTextNode(' ' + g.op + (g.idx.length > 1 ? ' (' + g.idx.length + '구역)' : '')));
      lab.append(cb, txt); pop.append(lab);
    });
    det.append(pop);
    return det;
  }

  function chipsBar(state, rerender, cols, G) {
    const wrap = el('div', 'lu-chips');
    const items = [];
    if (state.q) items.push(['검색 "' + state.q + '"', () => { state.q = ''; }]);
    if (state.k) items.push([(state.k === 'IPTV' || state.k === '위성' ? state.k : '케이블 ' + state.k), () => { state.k = ''; }]);
    if (state.g) items.push(['장르 ' + state.g, () => { state.g = ''; }]);
    if (state.pf) items.push([state.pf === 'known' ? '상품 단계 확인됨만' : '상품 미확인만', () => { state.pf = ''; }]);
    if (state.vf) items.push(['검증상태 ' + (STATUS_META[state.vf] || {}).label, () => { state.vf = ''; }]);
    if (!state.allCols && cols && G && cols.length < G.length) items.push(['비교 ' + cols.length + '개 열', () => { state.allCols = true; }]);
    if (!items.length) return null;
    items.forEach(([label, clear]) => {
      const c = el('span', 'lu-chip'); c.append(document.createTextNode(label));
      const x = el('button', '', '✕'); x.type = 'button'; x.setAttribute('aria-label', label + ' 조건 해제'); x.addEventListener('click', () => { clear(); rerender(); });
      c.append(x); wrap.append(c);
    });
    const reset = el('button', 'lu-reset', '전체 초기화'); reset.type = 'button';
    reset.addEventListener('click', () => { state.q = ''; state.k = ''; state.g = ''; state.pf = ''; state.vf = ''; state.allCols = false; state.cols = null; rerender(); });
    wrap.append(reset);
    return wrap;
  }

  function statusBar(D, state, rerender) {
    const counts = statusCounts(D);
    const checked = Object.values(counts).reduce((a, b) => a + b, 0);
    const platDone = Object.keys(D.verified || {}).length;
    const platAll = D.plats.length;
    const card = el('div', 'lu-card lu-stat'); card.setAttribute('role', 'group'); card.setAttribute('aria-label', '검증 상태 요약 — 클릭하면 해당 상태로 걸러 봅니다');
    card.append(el('p', 'lu-stat-cap', `라인업 ${platAll}개 가운데 ${platDone}개를 각사 이용약관 원문(PDF)과 번호 단위로 대조했고, 그 결과 ${checked.toLocaleString()}칸이 확인됐습니다. 아직 대조하지 않은 칸은 표에 "─"로 비어 보입니다 — 확인이 안 됐다는 뜻이지 그 채널이 없다는 뜻이 아닙니다.`));
    [['verified_present', 'd-vp'], ['source_conflict', 'd-vc'], ['extraction_failed', 'd-ef'], ['fetch_failed', 'd-ff']].forEach(([key, dot]) => {
      const meta = STATUS_META[key];
      const b = el('button'); b.type = 'button'; b.setAttribute('aria-pressed', String(state.vf === key));
      b.append(el('b', '', String(counts[key] || 0)));
      const sp2 = el('span'); sp2.append(el('i', 'dot ' + dot), meta.label); b.append(sp2);
      b.append(el('span', 'cap', key === 'verified_present' ? '원문 재검증됨' : key === 'source_conflict' ? '원문·현황 상충' : key === 'extraction_failed' ? '이미지 표 등 재판독 필요' : '다운로드·접속 실패'));
      b.addEventListener('click', () => { state.vf = state.vf === key ? '' : key; rerender(); });
      card.append(b);
    });
    return card;
  }

  function matrix(D, state, rerender) {
    const box = el('div', 'lu');
    const G = groupsOf(D);
    const cols0 = G.filter((g) => !state.k || g.type === state.k);
    if (!state.cols) state.cols = cols0.slice(0, 5).map((g) => g.key);
    const cols1 = state.allCols ? cols0 : cols0.filter((g) => (state.cols || []).includes(g.key));
    const cols = (cols1.length ? cols1 : cols0.slice(0, 5)).map((g) => ({ g, i: pick(D, g, state) }));
    const colOps = new Set(cols.map(({ g }) => g.op));
    // 선택 범위 / 전체 등록 — 분모를 명확히 표시
    const topbar = el('div', 'lu-top');
    topbar.append(el('div', 'scope', ''));
    const exportBtn = el('button', 'lu-export', '⬇ CSV 내보내기'); exportBtn.type = 'button';
    topbar.append(exportBtn);
    box.append(topbar);
    box.append(statusBar(D, state, rerender));

    const bar = el('div', 'lu-card lu-bar');
    const fold = el('div', 'lu-fold'); const sumTxt = [state.k ? (state.k === 'IPTV' || state.k === '위성' ? state.k : '케이블 ' + state.k) : '전체 유형', state.g || '전체 장르', state.q ? '"' + state.q + '"' : ''].filter(Boolean).join(' · ');
    const fb = el('button', '', state.fold ? '필터 펼치기 ▾' : '필터 접기 ▴'); fb.type = 'button'; fb.addEventListener('click', () => { state.fold = !state.fold; rerender(); });
    fold.append(el('b', '', '보기 조건: ' + sumTxt), fb); bar.append(fold);
    if (state.fold) { box.append(bar); }

    // 도구막대 1행 — 채널 검색 · 우리 채널 · 비교 플랫폼 선택
    const r1 = el('div', 'lu-row');
    const inp = el('input', 'lu-in'); inp.type = 'search'; inp.placeholder = '채널 이름·별칭 검색 (예: 투니버스, tvN, OCN)'; inp.value = state.q; inp.setAttribute('aria-label', '채널 이름 또는 별칭 검색');
    inp.addEventListener('input', () => { clearTimeout(state.t); state.t = setTimeout(() => { state.q = inp.value.trim(); updateBody(); }, 150); });
    r1.append(inp);
    const mineBtn = el('button', 'lu-mine-btn', MINE() ? '우리 채널 보임' : '우리 채널 보기'); mineBtn.type = 'button'; mineBtn.setAttribute('aria-pressed', String(MINE()));
    mineBtn.addEventListener('click', () => { document.body.classList.toggle('mine'); try { window.dispatchEvent(new Event('pn-mine-change')); } catch (e) {} rerender(); });
    r1.append(mineBtn);
    r1.append(colSelector(D, cols0, state, rerender));
    const sort = el('select', 'lu-in'); sort.setAttribute('aria-label', '정렬');
    bar.append(r1);

    // 도구막대 2행 — 방식 · 지역 · 상품 · 검증상태
    const r2 = el('div', 'lu-tool2');
    const fType = el('div', 'lu-fld'); fType.append(el('span', '', '방식'));
    const tt = el('div', 'lu-type');
    [['', '전체'], ['IPTV', 'IPTV'], ['위성', '위성'], ['디지털', '케이블 디지털'], ['8VSB', '케이블 8VSB'], ['IP', '케이블 IP']].forEach(([k, l]) => { const b = el('button', '', l); b.type = 'button'; b.style.setProperty('--tc', TC[k] || '#334155'); b.setAttribute('aria-pressed', String(state.k === k)); b.addEventListener('click', () => { state.k = k; rerender(); }); tt.append(b); });
    fType.append(tt); r2.append(fType);
    const fReg = el('div', 'lu-fld'); fReg.append(el('span', '', '지역')); fReg.append(regionPickers(D, G, state, rerender, colOps)); r2.append(fReg);
    const fProd = el('div', 'lu-fld'); fProd.append(el('span', '', '상품'));
    const pSel = el('select', 'lu-in'); pSel.setAttribute('aria-label', '상품 단계 필터');
    [['', '전체'], ['known', '상품 단계 확인된 값만'], ['unk', '상품 미확인만']].forEach(([k, l]) => pSel.append(new Option(l, k)));
    pSel.value = state.pf || ''; pSel.addEventListener('change', () => { state.pf = pSel.value; rerender(); });
    fProd.append(pSel); r2.append(fProd);
    const fVer = el('div', 'lu-fld'); fVer.append(el('span', '', '검증 상태'));
    const vSel = el('select', 'lu-in'); vSel.setAttribute('aria-label', '검증 상태 필터');
    [['', '전체'], ['verified_present', '확인완료'], ['source_conflict', '자료 충돌'], ['extraction_failed', '인식 필요'], ['fetch_failed', '수집 실패']].forEach(([k, l]) => vSel.append(new Option(l, k)));
    vSel.value = state.vf || ''; vSel.addEventListener('change', () => { state.vf = vSel.value; rerender(); });
    fVer.append(vSel); r2.append(fVer);
    const fDens = el('div', 'lu-fld'); fDens.append(el('span', '', '표 밀도'));
    const dens = el('div', 'lu-dens'); [['comfy', '보통'], ['dense', '좁게']].forEach(([k, l]) => { const b = el('button', '', l); b.type = 'button'; b.setAttribute('aria-pressed', String((state.dense ? 'dense' : 'comfy') === k)); b.addEventListener('click', () => { state.dense = k === 'dense'; rerender(); }); dens.append(b); });
    fDens.append(dens); r2.append(fDens);
    bar.append(r2);

    const chips = chipsBar(state, rerender, cols, cols0);
    if (chips) bar.append(chips);

    sort.append(new Option('정렬: 장르별', 'g'), new Option('정렬: 이름순', 'n'), new Option('정렬: 편성 많은 순', 'cnt'));
    cols.forEach(({ g, i }) => sort.append(new Option('정렬: ' + g.op + ' ' + tlabel(g.p) + ' 번호순', 'p' + i)));
    if (![...sort.options].some((o) => o.value === state.s)) state.s = 'g';
    sort.value = state.s; sort.addEventListener('change', () => { state.s = sort.value; rerender(); });
    r1.append(sort);

    const gb = el('div', 'lu-g');
    const counts = {}; D.chans.forEach((c) => { if (cols.some(({ i }) => c.c[i])) counts[c.g] = (counts[c.g] || 0) + 1; });
    const mk = (g, l, n) => { const b = el('button'); b.type = 'button'; b.style.setProperty('--gc', GC[g] || '#334155'); b.setAttribute('aria-pressed', String(state.g === g)); b.append(l); if (n != null) b.append(el('small', '', n)); b.addEventListener('click', () => { state.g = state.g === g ? '' : g; rerender(); }); gb.append(b); };
    mk('', '전체 장르', Object.values(counts).reduce((a, b) => a + b, 0));
    GORDER.forEach((g) => { if (counts[g]) mk(g, g, counts[g]); });
    bar.append(gb); if (state.fold) [...bar.children].slice(1).forEach((n) => n.remove()); else box.append(bar);

    const bodyBox = el('div');
    const isMobile = window.matchMedia && window.matchMedia('(max-width: 480px)').matches;

    function matchesFilters(c) {
      if (state.g && c.g !== state.g) return false;
      const q = state.q.toLowerCase();
      if (q && !(c.n + ' ' + (c.corp || '') + ' ' + (c.al || '')).toLowerCase().includes(q)) return false;
      if (!cols.some(({ i }) => c.c[i])) return false;
      if (state.pf) {
        const ok = cols.some(({ i }) => { const v = c.c[i]; if (!v) return false; const k = tierKind(v); return state.pf === 'known' ? k !== 'unk' : k === 'unk'; });
        if (!ok) return false;
      }
      if (state.vf) {
        const names = namesWithStatus(D, state.vf);
        if (!names.has(c.n)) return false;
      }
      return true;
    }

    function updateBody() {
      bodyBox.replaceChildren();
      const rows = D.chans.filter(matchesFilters);
      if (state.s === 'n') rows.sort((a, b) => a.n.localeCompare(b.n, 'ko'));
      else if (state.s === 'cnt') rows.sort((a, b) => cols.filter(({ i }) => b.c[i]).length - cols.filter(({ i }) => a.c[i]).length || a.n.localeCompare(b.n, 'ko'));
      else if (state.s[0] === 'p') { const pi = +state.s.slice(1); rows.sort((a, b) => numv(a.c[pi]) - numv(b.c[pi])); }
      else rows.sort((a, b) => GORDER.indexOf(a.g) - GORDER.indexOf(b.g) || cols.filter(({ i }) => b.c[i]).length - cols.filter(({ i }) => a.c[i]).length || a.n.localeCompare(b.n, 'ko'));

      topbar.querySelector('.scope').replaceChildren('선택 범위 ', el('b', '', String(rows.length) + '개'), ' / 전체 등록 ', el('b', '', String(D.chans.length) + '개'), ' · 비교 ', el('b', '', String(cols.length) + '개 라인업'));

      if (!rows.length) {
        const empty = el('div', 'lu-card'); const p1 = el('p', 'lu-note', state.q || state.g || state.pf || state.vf ? '현재 선택 결과 없음 — 검색어·필터 조건을 확인하세요.' : '현재 조건에 맞는 채널이 없습니다.');
        const rb = el('button', 'lu-reset', '필터 초기화'); rb.type = 'button'; rb.addEventListener('click', () => { state.q = ''; state.g = ''; state.pf = ''; state.vf = ''; rerender(); });
        empty.style.padding = '1.6em 1.3em'; empty.append(p1, rb); bodyBox.append(empty);
        return;
      }

      if (isMobile) { bodyBox.append(mobileCards(D, cols, rows)); return; }

      const card = el('div', 'lu-card lu-wrap'); const t = el('table', 'lu-t' + (state.dense ? ' dense' : ''));
      const hr = el('tr'); hr.append(el('th', 'ch', '채널'));
      cols.forEach(({ g, i }) => { const p = D.plats[i]; const th = el('th', 'gl'); th.append(tbadge(p), el('div', '', g.op)); if (p.region) th.append(el('span', 'rb', shortReg(p.region))); hr.append(th); });
      const thd = el('thead'); thd.append(hr); t.append(thd);
      const tb = el('tbody');
      rows.slice(0, state.lim).forEach((c) => {
        const tr = el('tr', ME.test(c.n) && MINE() ? 'me' : '');
        const td0 = el('td', 'ch'); td0.style.setProperty('--gc', GC[c.g] || '#94a3b8'); td0.append(c.n, el('small', '', c.g + (c.corp ? ' · ' + c.corp : ''))); td0.tabIndex = 0; td0.setAttribute('role', 'button'); td0.title = '클릭하면 전체 플랫폼 상세(채널번호·티어)를 봅니다'; td0.addEventListener('click', () => openChannelDetail(D, c)); td0.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openChannelDetail(D, c); } }); tr.append(td0);
        cols.forEach(({ i }) => {
          const p = D.plats[i]; const v = c.c[i];
          const r = evRecord(D, i, c, v); const meta = STATUS_META[r.status] || STATUS_META.unknown;
          const td = el('td', 'gl ' + (v ? ('no' + (v[1] > 0 ? ' t' + Math.min(3, v[1]) : '')) : ('na st-' + meta.cls)));
          td.tabIndex = 0; td.setAttribute('role', 'button');
          td.setAttribute('aria-label', c.n + ' · ' + p.op + ' ' + tlabel(p) + ' · ' + (v ? v[0] + '번' : meta.label) + ' · 근거 보기');
          td.textContent = v ? v[0] : meta.short || '미확인';
          if (meta.icon) { const ic = el('sup', 'lu-ev ' + meta.cls, meta.icon); ic.title = meta.label + (r.reviewNote ? ' · ' + r.reviewNote : ''); td.append(ic); }
          if (v) {
            const k = tierKind(v);
            if (k === 'unk') { const u = el('sup', 'lu-tu', '?'); u.title = '상품 미확인 — 어느 상품부터 포함되는지 원문 미확인(추정 아님)'; td.append(u); }
            else if (k === 'higher') { const pn2 = prodOf(p, v); if (pn2) { td.append(el('small', 'lu-cp', pn2)); } }
          }
          td.addEventListener('click', () => openCellPanel(D, i, c, v, td));
          td.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCellPanel(D, i, c, v, td); } });
          tr.append(td);
        });
        tb.append(tr);
      });
      t.append(tb); card.append(t); bodyBox.append(card);
      if (rows.length > state.lim) { const more = el('button', 'lu-more', `더 보기 (${rows.length - state.lim}개 더)`); more.type = 'button'; more.addEventListener('click', () => { state.lim += 150; updateBody(); }); bodyBox.append(more); }
      const leg = el('div', 'lu-leg'); leg.append(el('span', '', '숫자 = 채널번호 · 셀을 클릭하면 근거 패널이 열립니다 · 번호 위에 마우스를 올리면 제공 상품이 보입니다'));
      [['#2563eb', '2단계 상품부터'], ['#7c3aed', '3단계 상품부터'], ['#db2777', '4단계 이상'], ['#64748b', '숫자 아래 작은 글씨 = 그 상품부터 시청 가능']].forEach(([cl, l]) => { const s = el('i', '', '■ ' + l); s.style.color = cl; leg.append(s); });
      leg.append(el('span', '', '✓ 확인완료 · ⚠ 자료 충돌 · ! 인식 필요 · × 수집 실패 · ? 상품 미확인'));
      leg.append(el('span', '', '─ (빈 칸) = 아직 원문을 대조하지 못한 칸 · "미편성 확정"이 아니라 "모름"이라는 뜻입니다'));
      bodyBox.append(leg);
    }
    updateBody();
    box.append(bodyBox);

    exportBtn.addEventListener('click', () => exportCsv(D, state, cols));
    return box;
  }

  function mobileCards(D, cols, rows) {
    const box = el('div', 'lu-cards');
    rows.forEach((c) => {
      const row2 = el('div', 'lu-cardrow'); row2.style.setProperty('--gc', GC[c.g] || '#94a3b8');
      const h = el('h5'); h.append(c.n, el('small', '', c.g)); row2.append(h);
      const grid = el('div', 'lu-cardgrid');
      cols.forEach(({ g, i }) => {
        const p = D.plats[i]; const v = c.c[i]; const r = evRecord(D, i, c, v); const meta = STATUS_META[r.status] || STATUS_META.unknown;
        const cell = el('button', 'lu-cardcell'); cell.type = 'button';
        cell.setAttribute('aria-label', c.n + ' · ' + g.op + ' ' + tlabel(g.p) + ' · ' + (v ? v[0] + '번' : meta.label) + ' · 근거 보기');
        cell.append(el('b', '', v ? v[0] : (meta.short || '미확인')));
        cell.append(el('small', '', g.op + ' ' + tlabel(g.p) + (meta.icon ? ' ' + meta.icon : '')));
        cell.addEventListener('click', () => openCellPanel(D, i, c, v, cell));
        grid.append(cell);
      });
      row2.append(grid); box.append(row2);
    });
    return box;
  }

  function csvCell(s) { s = String(s == null ? '' : s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function exportCsv(D, state, cols) {
    const rows = D.chans.filter((c) => {
      if (state.g && c.g !== state.g) return false;
      const q = (state.q || '').toLowerCase();
      if (q && !(c.n + ' ' + (c.corp || '') + ' ' + (c.al || '')).toLowerCase().includes(q)) return false;
      return cols.some(({ i }) => c.c[i]);
    });
    const condTxt = [state.k ? (state.k === 'IPTV' || state.k === '위성' ? state.k : '케이블 ' + state.k) : '전체 방식', state.g || '전체 장르', state.q ? '검색:' + state.q : '', state.pf === 'known' ? '상품 단계 확인됨만' : state.pf === 'unk' ? '상품 미확인만' : '', state.vf ? '검증상태:' + ((STATUS_META[state.vf] || {}).label || state.vf) : ''].filter(Boolean).join(' / ');
    const lines = [];
    lines.push('# 필터 조건: ' + condTxt);
    lines.push('# 내보낸 시각: ' + new Date().toISOString());
    lines.push('# 열별 원문 기준일(src/basis/date)은 각 플랫폼 열 옆 괄호 참고. 빈 칸은 미편성이 아니라 미확인일 수 있습니다.');
    const head = ['채널명', '장르'];
    cols.forEach(({ g, i }) => { const p = D.plats[i]; head.push(g.op + ' ' + tlabel(g.p) + (p.region ? ' ' + p.region : '') + ' (' + (p.date || '기준일 미기재') + ') 번호', g.op + ' ' + tlabel(g.p) + ' 검증상태'); });
    lines.push(head.map(csvCell).join(','));
    rows.forEach((c) => {
      const line = [c.n, c.g];
      cols.forEach(({ i }) => { const v = c.c[i]; const r = evRecord(D, i, c, v); const meta = STATUS_META[r.status] || STATUS_META.unknown; line.push(v ? v[0] : '', meta.label); });
      lines.push(line.map(csvCell).join(','));
    });
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '채널라인업_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.append(a); a.click(); a.remove();
  }

  function byRegion(D, state, rerender) {
    const box = el('div', 'lu');
    const bar = el('div', 'lu-card lu-bar'); const r = el('div', 'lu-row'); r.append(el('b', '', '채널 선택'));
    const sel = el('select', 'lu-in');
    const cands = D.chans.filter((c) => D.plats.some((p, i) => p.kind === '케이블' && c.c[i])).sort((a, b) => (MINE() ? ME.test(b.n) - ME.test(a.n) : 0) || a.n.localeCompare(b.n, 'ko'));
    // 장르별로 묶어서 보여달라는 요청 반영 — GORDER 순서대로 <optgroup>, 그룹 안에서는 기존 정렬 유지
    const byGenre = {};
    cands.forEach((c) => { const g = c.g || '장르 미지정'; (byGenre[g] = byGenre[g] || []).push(c); });
    const genreOrder = GORDER.filter((g) => byGenre[g]).concat(Object.keys(byGenre).filter((g) => !GORDER.includes(g)));
    genreOrder.forEach((g) => {
      const og = el('optgroup'); og.label = g;
      byGenre[g].forEach((c) => og.append(new Option(c.n, c.n)));
      sel.append(og);
    });
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
      vals.forEach(({ p, v }) => { l.append(el('div', '', p.region)); const n = el('div', v && v[0] !== mode ? 'diff' : '', v ? v[0] + '번' + (v[1] > 0 && p.prods[v[1]] ? ' · ' + p.prods[v[1]] : '') : '미확인'); l.append(n); });
      card.append(l); grid.append(card);
    });
    box.append(grid, el('p', 'lu-note', '주황색 번호는 다른 방송구역과 번호가 다른 곳입니다. 상품명은 해당 채널이 처음 포함되는 상품입니다. "미확인"은 해당 구역 자료에서 채널을 찾지 못했다는 뜻으로, 미편성이 확정된 것은 아닙니다.'));
    return box;
  }

  function emptyNumbersFor(D, i) {
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
    r1.append(tt); const ebar = el('div', 'lu-card lu-bar'); ebar.append(r1);
    // 124개 카드가 한 번에 쫙 나열되면 보기 번거롭다는 피드백 반영 —
    // 사업자 검색으로 좁히고, 카드는 기본 접어서 요약(사용/빈자리 개수)만 먼저 보여준다
    const r2 = el('div', 'lu-row'); r2.append(el('b', '', '사업자 검색'));
    const einp = el('input', 'lu-in'); einp.type = 'search'; einp.placeholder = '사업자 이름 (예: 딜라이브, HCN)'; einp.value = state.eq || ''; einp.setAttribute('aria-label', '사업자 검색');
    einp.addEventListener('input', () => { clearTimeout(state.et); state.et = setTimeout(() => { state.eq = einp.value.trim(); rerender(); }, 150); });
    r2.append(einp); ebar.append(r2);
    box.append(ebar);
    const G = groupsOf(D).filter((g) => !state.ek || g.type === state.ek);
    const eq = (state.eq || '').toLowerCase();
    const cards = [];
    G.forEach((gr) => {
      if (eq && !gr.op.toLowerCase().includes(eq)) return;
      gr.idx.forEach((i) => {
        const p = D.plats[i];
        const data = emptyNumbersFor(D, i);
        const det = el('details', 'lu-card lu-rgcard'); det.open = Boolean(eq);
        const sum = el('summary'); sum.append(tbadge(p), document.createTextNode(' ' + p.op)); if (p.region) sum.append(el('span', 'rb', shortReg(p.region)));
        const emptyCnt = data.runs.reduce((a, r) => a + (r[1] - r[0] + 1), 0);
        sum.append(el('span', 'lu-rgstat', data.max ? `사용 ${data.used}개 · 빈자리 ${emptyCnt}개` : '데이터 없음'));
        det.append(sum);
        if (!data.max) det.append(el('p', 'lu-note', '데이터 없음'));
        else if (!data.runs.length) det.append(el('p', 'lu-note', `${data.min}~${data.max}번 구간(사용 ${data.used}개)에 빈 번호 없음`));
        else {
          const short = data.runs.filter((r) => r[1] - r[0] < 5);
          const long = data.runs.filter((r) => r[1] - r[0] >= 5);
          det.append(el('p', 'lu-note', `${data.min}~${data.max}번 구간 · 사용 ${data.used}개`));
          if (short.length) {
            const nums = short.flatMap((r) => { const a = []; for (let n = r[0]; n <= r[1]; n++) a.push(n); return a; });
            det.append(el('p', '', ''), el('p', '', '영업 후보 (짧게 빈 자리)'));
            det.append(el('p', 'lu-note lu-empty-list', nums.join(', ') + '번'));
          }
          if (long.length) {
            det.append(el('p', '', '통째로 빈 블록'));
            det.append(el('p', 'lu-note lu-empty-list', long.map((r) => `${r[0]}~${r[1]}번 (${r[1] - r[0] + 1}개)`).join(' · ')));
          }
        }
        cards.push(det);
      });
    });
    const grid = el('div', 'lu-rg');
    if (!cards.length) grid.append(el('p', 'lu-note', '검색 결과가 없습니다.'));
    else cards.forEach((c) => grid.append(c));
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
    const state = root.__lu || (root.__lu = { v: 'mx', q: '', k: '', s: 'g', g: '', lim: 150, pg: 0, pgk: 0, reg: {}, rc: '', cols: null, allCols: false, pf: '', vf: '', dense: false });
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

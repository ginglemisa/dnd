const style = document.createElement('style');
style.textContent = `
:root { --bg:#f5f6fb; --card:#fff; --text:#1f2937; --muted:#6b7280; --brand:#4f46e5; --line:#d9dce5; --ok:#0f766e; --warn:#b45309; }
* { box-sizing: border-box; }
body { margin:0 auto; max-width:520px; background:var(--bg); color:var(--text); font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; padding:108px 12px 88px; }
.topbar { position:fixed; top:0; left:0; right:0; max-width:520px; margin:0 auto; z-index:20; background:#fff; border-bottom:1px solid var(--line); padding:10px 12px; display:flex; justify-content:space-between; align-items:center; }
.brand { font-weight:800; }
.switch-label { font-size:13px; display:flex; gap:6px; align-items:center; }
.tabs { position:fixed; top:50px; left:0; right:0; max-width:520px; margin:0 auto; display:flex; overflow:auto; gap:6px; padding:8px 10px; background:#eef1ff; border-bottom:1px solid var(--line); z-index:19; }
.tab-btn { border:none; border-radius:12px; background:#fff; padding:10px 14px; white-space:nowrap; font-weight:700; color:#374151; }
.tab-btn.active { background:var(--brand); color:#fff; }
.tab-panel { display:none; }
.tab-panel.active { display:block; }
.card { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:12px; margin-bottom:10px; }
.grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
label { display:block; font-size:13px; font-weight:700; margin-bottom:4px; }
input,select,button { width:100%; padding:10px; border-radius:10px; border:1px solid #c9cfdd; background:#fff; }
button { font-weight:700; }
.stat-big { font-size:30px; font-weight:900; color:#111827; }
.muted { color:var(--muted); font-size:12px; }
.step-title { font-weight:800; color:var(--brand); margin-bottom:8px; }
.adv-only { display:none; }
.beginner-mode .beginner-hidden { display:none !important; }
.beginner-mode details.long-rule:not([open]) { opacity:.95; }
.beginner-mode .card { padding:14px; }
.tag { display:inline-block; padding:4px 8px; border-radius:999px; font-size:12px; background:#eef2ff; margin-right:4px; margin-bottom:4px; }
.warn { color:var(--warn); font-weight:700; }
.ok { color:var(--ok); font-weight:700; }
.list { margin:0; padding-left:20px; }
.spell-item { border:1px solid var(--line); border-radius:10px; padding:8px; margin-bottom:8px; background:#fff; }
.row { display:flex; gap:8px; align-items:center; }
.row > * { flex:1; }
.star { width:40px; font-size:20px; padding:6px; }
.hud { position:sticky; top:98px; z-index:10; box-shadow:0 4px 12px rgba(0,0,0,.08); }
.shortcut { display:flex; flex-wrap:wrap; gap:6px; }
.shortcut span { background:#fef3c7; border:1px solid #fcd34d; border-radius:999px; padding:4px 8px; font-size:12px; }
hr { border:none; border-top:1px solid var(--line); margin:12px 0; }
`;
document.head.appendChild(style);

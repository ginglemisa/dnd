// css.js
const style = document.createElement("style");
style.innerHTML = `
  #scrollToTopBtn {
    position: fixed;
    right: 12px;
    bottom: 12px;
    z-index: 999;
    width: 1.85em;
    height: 1.85em;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    line-height: 1;
    border-radius: 999px;
    border: 1px solid #cfd5df;
    background: rgba(255,255,255,0.92);
    color: #2a3442;
    cursor: pointer;
    opacity: 0.92;
    box-shadow: 0 8px 24px rgba(25, 35, 52, 0.12);
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  #scrollToTopBtn:hover {
    opacity: 1;
    transform: translateY(-1px);
  }

  :root {
    --bg: #f0f2f8;
    --panel: rgba(255, 255, 255, 0.72);
    --panel-soft: rgba(248, 250, 255, 0.6);
    --panel-muted: #eef2f7;
    --border: rgba(180, 195, 225, 0.55);
    --border-strong: rgba(140, 162, 205, 0.7);
    --text: #1a2338;
    --muted: #5a6880;
    --accent: #5b7cfa;
    --accent-2: #8b6ff5;
    --accent-soft: rgba(91, 124, 250, 0.1);
    --shadow: 0 8px 28px rgba(28, 45, 100, 0.07), 0 2px 8px rgba(28, 45, 100, 0.04);
    --shadow-hover: 0 14px 36px rgba(28, 45, 100, 0.12), 0 4px 12px rgba(91, 124, 250, 0.1);
    --radius: 18px;
    --radius-sm: 10px;
    --glass: blur(16px) saturate(160%);
  }

  * {
    box-sizing: border-box;
  }

  html {
    background: var(--bg);
  }

  body {
    max-width: 480px;
    margin: 0 auto;
    padding: 84px 12px 28px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif;
    line-height: 1.5;
    margin-bottom: 92px;
    background:
      radial-gradient(ellipse 75% 50% at 20% 0%, rgba(91, 124, 250, 0.1) 0%, transparent 65%),
      radial-gradient(ellipse 55% 45% at 85% 90%, rgba(139, 111, 245, 0.09) 0%, transparent 60%),
      linear-gradient(170deg, #eef1f9 0%, #e9edf8 55%, #eaeaf6 100%) !important;
    color: var(--text);
    font-size: 16px;
    min-height: 100vh;
  }

  .tabs {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    backdrop-filter: var(--glass);
    -webkit-backdrop-filter: var(--glass);
    background: rgba(238, 242, 251, 0.88) !important;
    padding: 10px 6px 4px;
    display: flex;
    justify-content: space-around;
    gap: 6px;
    flex-wrap: nowrap;
    z-index: 1000;
    border-bottom: 1px solid rgba(180, 195, 225, 0.45) !important;
    max-width: 480px;
    margin: 0 auto;
    box-shadow: 0 8px 24px rgba(24, 40, 100, 0.06), 0 1px 0 rgba(255, 255, 255, 0.7) inset;
  }

  .tab-button {
    flex: 1;
    min-width: 0;
    padding: 11px 6px;
    background: rgba(255, 255, 255, 0.78) !important;
    border: 1px solid rgba(180, 195, 225, 0.5) !important;
    border-radius: 14px !important;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.2;
    text-align: center;
    color: var(--muted);
    min-height: 46px;
    letter-spacing: 0.02em;
    box-shadow: 0 1px 4px rgba(24, 33, 47, 0.04), 0 1px 0 rgba(255, 255, 255, 0.9) inset;
    transition: background 0.2s ease, color 0.2s ease, transform 0.18s ease, box-shadow 0.2s ease;
  }

  .tab-button:hover:not(.active) {
    background: rgba(255, 255, 255, 0.95) !important;
    color: var(--text);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(24, 40, 100, 0.08), 0 1px 0 rgba(255, 255, 255, 0.9) inset;
  }

  .tab-button.active {
    background: linear-gradient(135deg, #6c8dff 0%, #8b6ff5 100%) !important;
    color: #fff !important;
    border-color: transparent !important;
    box-shadow: 0 8px 22px rgba(91, 124, 250, 0.32), 0 1px 0 rgba(255, 255, 255, 0.25) inset;
    transform: translateY(-1px);
  }

  .tab-content {
    display: none;
    width: 100%;
  }

  .tab-content.active {
    display: block;
  }

  .form-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 12px;
    align-items: flex-start;
  }

  select,
  input[type="number"],
  input[type="text"],
  textarea {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    border: 1px solid rgba(170, 188, 225, 0.65) !important;
    border-radius: 12px !important;
    background: rgba(255, 255, 255, 0.88) !important;
    color: var(--text);
    box-shadow: inset 0 1px 3px rgba(28, 45, 100, 0.05), 0 1px 0 rgba(255, 255, 255, 0.9);
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    outline: none;
  }

  select:focus,
  input[type="number"]:focus,
  input[type="text"]:focus,
  textarea:focus {
    border-color: rgba(91, 124, 250, 0.7) !important;
    background: rgba(255, 255, 255, 0.98) !important;
    box-shadow: 0 0 0 3px rgba(91, 124, 250, 0.14), inset 0 1px 3px rgba(28, 45, 100, 0.04) !important;
  }

  select,
  input[type="text"],
  textarea {
    padding: 10px 12px;
    font-size: 16px;
  }

  input[type="number"] {
    min-height: 44px;
    padding: 8px 10px;
    font-size: 20px;
    font-weight: 700;
    text-align: center;
    line-height: 1.1;
  }

  input[type="checkbox"] {
    width: 20px;
    height: 20px;
    margin: 0;
    accent-color: var(--accent);
    vertical-align: middle;
  }

  textarea {
    min-height: 96px;
    resize: vertical;
  }

  label {
    width: 100%;
    font-weight: 700;
    margin-bottom: 6px;
    color: var(--text);
  }

  .section {
    margin-bottom: 14px;
    background: rgba(255, 255, 255, 0.72) !important;
    backdrop-filter: blur(14px) saturate(150%);
    -webkit-backdrop-filter: blur(14px) saturate(150%);
    border: 1px solid rgba(200, 215, 240, 0.6) !important;
    border-radius: var(--radius);
    padding: 16px !important;
    box-shadow: var(--shadow), 0 1px 0 rgba(255, 255, 255, 0.8) inset;
    transition: border-color 0.22s ease, box-shadow 0.22s ease;
  }

  .section:hover,
  details.section:hover {
    border-color: rgba(91, 124, 250, 0.28) !important;
    box-shadow: var(--shadow-hover), 0 1px 0 rgba(255, 255, 255, 0.85) inset;
  }

  .section > h3,
  .section summary h3 {
    margin: 0;
    font-size: 1.08rem;
    line-height: 1.3;
  }

  details > summary {
    cursor: pointer;
  }

  .spell-toolbar {
    position: sticky;
    top: 68px;
    z-index: 30;
    background: rgba(255,255,255,0.96);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 8px;
    box-shadow: var(--shadow);
  }

  .spell-toolbar-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: nowrap;
    width: 100%;
    min-width: 0;
  }

  .spell-toolbar #spell-search {
    flex: 1 1 auto;
    min-width: 0;
    height: 38px;
    padding: 8px 12px;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .spell-toolbar-actions {
    display: flex;
    gap: 8px;
    flex: 0 0 auto;
    margin-left: auto;
    justify-content: flex-end;
  }

  .spell-toolbar-actions button {
    height: 38px;
    padding: 0 12px;
    white-space: nowrap;
    flex: 0 0 auto;
    width: auto;
    margin-bottom: 0;
    font-weight: 600;
    border-radius: 10px;
    border: 1px solid #cfd8e6;
    background: #f7f9fc;
    color: #2a3447;
    box-shadow: none;
  }

  .spell-toolbar-actions button:hover {
    background: #eef3fa;
    border-color: #bcc9dc;
  }

  .spell-picked-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    margin-top: 12px;
  }

  .spell-picked-box {
    padding: 8px 10px;
  }

  .spell-picked-content {
    white-space: pre-line;
    font-size: 0.94rem;
    line-height: 1.45;
    color: #2c3645;
  }

  .spell-level-section > summary {
    cursor: pointer;
    list-style: none;
  }

  .spell-level-section > summary::-webkit-details-marker {
    display: none;
  }

  .output {
    background: var(--panel-soft);
    border: 1px solid #dde3ec;
    padding: 12px;
    border-radius: 12px;
    white-space: pre-wrap;
    line-height: 1.5;
  }

  #backgroundFeatures {
    white-space: normal;
  }

  .ability-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .ability {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: linear-gradient(180deg, #ffffff 0%, #f8faff 100%);
    border: 1px solid var(--border);
    border-radius: 14px;
    box-shadow: 0 4px 14px rgba(25, 35, 52, 0.05);
  }

  .modifier {
    min-height: 30px;
    margin-top: 0;
    font-weight: 800;
    font-size: 1.5rem;
    text-align: center;
    color: #1f3fb6;
  }

  button {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 12px;
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 8px;
    border-radius: 12px !important;
    border: 1px solid rgba(180, 200, 235, 0.55) !important;
    background: linear-gradient(160deg, rgba(255, 255, 255, 0.92) 0%, rgba(235, 241, 255, 0.8) 100%);
    color: var(--text);
    min-height: 44px;
    box-shadow: 0 2px 8px rgba(24, 40, 100, 0.07), 0 1px 0 rgba(255, 255, 255, 0.95) inset;
    transition: transform 0.18s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease;
    cursor: pointer;
  }

  button:hover {
    transform: translateY(-1.5px);
    background: linear-gradient(160deg, #ffffff 0%, rgba(225, 233, 255, 0.9) 100%);
    box-shadow: 0 8px 20px rgba(24, 40, 100, 0.11), 0 0 0 1px rgba(91, 124, 250, 0.2), 0 1px 0 rgba(255, 255, 255, 0.95) inset;
    border-color: rgba(91, 124, 250, 0.3) !important;
  }

  button:active {
    transform: translateY(0) scale(0.975);
    box-shadow: 0 2px 6px rgba(24, 40, 100, 0.08);
    transition-duration: 0.08s;
  }

  .small-text {
    font-size: 0.95rem;
    color: var(--muted);
    line-height: 1.55;
  }

  .condition-display-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .condition-display-card {
    background: var(--panel-soft);
    border: 1px solid #dde3ec;
    border-radius: 12px;
    padding: 12px;
  }

  .condition-title-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 8px;
    font-size: 0.98rem;
    font-weight: 700;
  }

  .condition-title-row span {
    color: var(--muted);
    font-weight: 600;
  }

  .condition-display-card ul {
    margin: 0;
    padding-left: 18px;
  }

  #condition-button-grid .active-condition {
    background: var(--accent-soft);
    border-color: #b8c8ff;
    color: #2447c7;
  }

  @media (min-width: 481px) {
    html, body {
      background-color: transparent;
    }
  }

  .save-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-top: 10px;
  }

  .save-pair {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 64px;
    align-items: center;
    gap: 8px;
    padding: 10px;
    background: var(--panel-soft);
    border: 1px solid #dde3ec;
    border-radius: 12px;
  }

  .save-pair label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    margin: 0;
    min-width: 0;
  }

  .save-pair input[type="number"] {
    width: 64px;
    min-width: 64px;
  }

  .skill-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-top: 12px;
  }

  .skill-cell {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
    background: var(--panel-soft);
    border: 1px solid #dde3ec;
    border-radius: 12px;
  }

  .skill-cell label {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    font-weight: 700;
    margin-bottom: 0;
    font-size: 1.03rem;
    line-height: 1.35;
  }

  .skill-cell input[type="number"] {
    width: 100%;
  }

  .form-grid-3col {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: end;
    gap: 10px;
    margin-bottom: 12px;
  }

  .form-grid-2col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 12px;
  }

  .form-grid-6col {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 8px;
    align-items: center;
    font-size: 0.98rem;
    margin-bottom: 12px;
    background: var(--panel-soft);
    border: 1px solid #dde3ec;
    border-radius: 12px;
    padding: 10px;
  }

  .form-grid-6col label {
    margin-bottom: 0;
    font-weight: 700;
    color: var(--muted);
  }

  #ac-display {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--accent-soft);
    color: #2547c8;
    font-size: 1.25rem !important;
    font-weight: 800;
    border: 1px solid #bfd0ff;
  }

  #hp-display {
    display: inline-block;
    margin-left: 6px;
    color: #2447c7;
    font-size: 1.3rem;
    font-weight: 800;
  }

  #warlock-invocation-summary,
  #weapon-mastery-summary {
    background: var(--panel-soft) !important;
    border: 1px solid #dde3ec !important;
    border-radius: 12px !important;
    padding: 10px !important;
  }

  .beast-tip {
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  #beastPopup {
    position: fixed;
    z-index: 9999;
    max-width: 320px;
    background: #111827;
    color: #fff;
    border: 1px solid rgba(255,255,255,.18);
    border-radius: 12px;
    padding: 10px 12px;
    box-shadow: 0 12px 30px rgba(0,0,0,.35);
    font-size: 14px;
    line-height: 1.45;
    display: none;
  }

  #beastPopup .title {
    font-weight: 700;
    margin-bottom: 6px;
    font-size: 15px;
  }

  #beastPopup .row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  #beastPopup .muted {
    opacity: .85;
  }

  #beastPopup .close {
    float: right;
    cursor: pointer;
    opacity: .85;
    margin-left: 10px;
  }

  .circle-checkbox {
    appearance: none;
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border: 2px solid #7a8697;
    border-radius: 50%;
    background: #fff;
    margin-left: 0;
    vertical-align: middle;
    cursor: pointer;
    position: relative;
    flex: 0 0 auto;
  }

  .circle-checkbox:checked {
    border-color: #4a6cf7;
    background: #4a6cf7;
    box-shadow: inset 0 0 0 4px #fff;
  }

  #tab-skills > .section:nth-of-type(2) > div[style*="font-size: 0.92em"] {
    font-size: 1rem !important;
    font-weight: 700;
    color: var(--muted) !important;
    background: var(--panel-soft);
    border: 1px solid #dde3ec;
    border-radius: 12px;
    padding: 10px 12px;
    line-height: 1.45;
  }

  @media (max-width: 420px) {
    body {
      padding: 82px 10px 24px;
    }

    .tab-button {
      font-size: 0.95rem;
      padding: 10px 4px;
    }

    .form-grid-2col,
    .save-grid,
    .skill-grid,
    .spell-picked-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .ability-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .form-grid-6col {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px 10px;
    }

    .form-grid-6col > span:empty {
      display: none;
    }

    .skill-cell label {
      font-size: 1rem;
    }

    .save-pair {
      grid-template-columns: minmax(0, 1fr) 54px;
      padding: 8px;
    }

    .save-pair input[type="number"] {
      width: 54px;
      min-width: 54px;
      min-height: 38px;
      font-size: 1rem;
    }

    .save-pair label {
      gap: 6px;
      align-items: flex-start;
    }

    .spell-toolbar,
    .section {
      padding: 10px;
    }

    .spell-picked-grid {
      gap: 6px;
    }
  }

  @media (max-width: 339px) {
    .form-grid-2col,
    .save-grid,
    .skill-grid,
    .spell-picked-grid,
    .form-grid-6col {
      grid-template-columns: 1fr;
    }
  }
`;
document.head.appendChild(style);


(function initScrollToTopButton() {
  if (document.getElementById("scrollToTopBtn")) return;

  const scrollToTopBtn = document.createElement("button");
  scrollToTopBtn.id = "scrollToTopBtn";
  scrollToTopBtn.type = "button";
  scrollToTopBtn.textContent = "▲";
  scrollToTopBtn.setAttribute("aria-label", "回到頁面頂端");
  scrollToTopBtn.style.display = "none";

  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const updateVisibility = () => {
    scrollToTopBtn.style.display = window.scrollY > 220 ? "block" : "none";
  };

  document.body.appendChild(scrollToTopBtn);
  window.addEventListener("scroll", updateVisibility, { passive: true });
  updateVisibility();
})();

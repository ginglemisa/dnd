// 冒險者聯盟規則頁（/al/，私人 repo 的頁面）的「回到角卡」。
// 頁面本身不含按鈕，部署時 site.yml 在每頁 </body> 前插入這支程式；只有從角卡點進來（al-rules.js 在同一個分頁記下來源）才顯示。
// 按下去退回當初那一頁角卡：規則頁的每一筆瀏覽紀錄都標上「離角卡幾步」，目錄的 # 錨點跳過幾段都能一次退回，
// 不開新分頁，也不讓紀錄越來越長。直接開網址、從外部連進來或另開新分頁時都不顯示。
(function () {
  "use strict";
  const SOURCE_KEY = "twd20.alReturn.v1";
  const DEPTH = "twd20AlDepth";

  let fromSheet = false;
  try {
    fromSheet = sessionStorage.getItem(SOURCE_KEY) === "1";
    sessionStorage.removeItem(SOURCE_KEY);
  } catch { /* 讀不到就當作不是從角卡來的 */ }

  function stateWithDepth(depth) {
    const state = history.state && typeof history.state === "object" ? history.state : {};
    return Object.assign({}, state, { [DEPTH]: depth });
  }
  const currentDepth = () => Number(history.state?.[DEPTH]) || 0;

  if (fromSheet) history.replaceState(stateWithDepth(1), "");
  // 重新整理或從角卡按「下一頁」回來時，這筆紀錄已經有標記。
  if (currentDepth() < 1) return;

  let depth = currentDepth();
  window.addEventListener("hashchange", () => {
    // 在紀錄間來回時沿用那一筆的標記；點目錄新增的紀錄多一步。
    if (currentDepth() >= 1) depth = currentDepth();
    else {
      depth += 1;
      history.replaceState(stateWithDepth(depth), "");
    }
  });

  const style = document.createElement("style");
  style.textContent = [
    ".twd20-al-return{position:fixed;right:max(1rem,env(safe-area-inset-right,0px));bottom:max(1rem,env(safe-area-inset-bottom,0px));z-index:20;display:inline-flex;align-items:center;gap:.6rem;min-height:3.5rem;padding:.8rem 1.2rem .8rem .95rem;border:1px solid rgba(255,255,255,.55);border-radius:999px;background:linear-gradient(135deg,#a8322b 0%,var(--accent,#8a1c1c) 100%);color:#fff;box-shadow:0 12px 28px rgba(90,20,15,.32);font:800 16px/1 var(--sans,system-ui,sans-serif);letter-spacing:.01em;cursor:pointer;transition:transform 160ms ease,box-shadow 160ms ease,filter 160ms ease}",
    ".twd20-al-return svg{width:1.25rem;height:1.25rem;fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:2.5;transition:transform 160ms ease}",
    ".twd20-al-return:hover{filter:brightness(1.08);transform:translateY(-3px);box-shadow:0 16px 32px rgba(90,20,15,.38)}",
    ".twd20-al-return:hover svg{transform:translateX(-3px)}",
    ".twd20-al-return:active{transform:translateY(-1px) scale(.98)}",
    ".twd20-al-return:focus-visible{outline:3px solid rgba(138,28,28,.38);outline-offset:4px}",
    "@media (prefers-reduced-motion:reduce){.twd20-al-return,.twd20-al-return svg{transition:none}}",
    "@media (min-width:620px){.twd20-al-return{right:max(1.5rem,env(safe-area-inset-right,0px));bottom:max(1.5rem,env(safe-area-inset-bottom,0px))}}",
    "@media print{.twd20-al-return{display:none}}"
  ].join("\n");
  document.head.appendChild(style);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "twd20-al-return";
  button.setAttribute("aria-label", "回到角卡");
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M19 12H5m7-7-7 7 7 7"/></svg><span>回到角卡</span>';
  button.addEventListener("click", () => {
    const steps = currentDepth();
    if (steps < 1) {
      location.href = "/";
      return;
    }
    // 退不回去（紀錄被瀏覽器清掉）時改為直接開角卡；離開頁面就取消，免得從角卡按「下一頁」回來時又被帶走。
    const fallback = setTimeout(() => { location.href = "/"; }, 1500);
    window.addEventListener("pagehide", () => clearTimeout(fallback), { once: true });
    history.go(-steps);
  });
  document.body.appendChild(button);
})();

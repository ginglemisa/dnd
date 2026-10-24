/**
 * 角色卡共用小工具（傳統 script，不使用 defer）。
 *
 * - 自 index.html 原封搬出，於第一段內嵌角色卡 script 之前同步載入，
 *   維持全域函式名稱供 index.html 與其他模組呼叫。
 * - 只放函式與狀態宣告，不在頂層執行任何初始化。
 */
function bindEventById(id, eventName, handler) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener(eventName, handler);
}

function findNthIndex(text, needle, nth = 1) {
  if (!text || !needle || nth < 1) return -1;
  let fromIndex = 0;
  let found = -1;
  for (let i = 0; i < nth; i++) {
    found = text.indexOf(needle, fromIndex);
    if (found === -1) return -1;
    fromIndex = found + needle.length;
  }
  return found;
}

function escapeRegExp(text) {
  return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Compare both requested markup and current DOM: restored unknown options and
// other callers' changes must invalidate this local write cache.
const characterHtmlWrites = new WeakMap();
function setCharacterHtml(element, html) {
  const previous = characterHtmlWrites.get(element);
  const current = element.innerHTML;
  if (previous?.html === html && previous.rendered === current) return;
  if (current !== html) element.innerHTML = html;
  characterHtmlWrites.set(element, { html, rendered: element.innerHTML });
}

// ✅ 簡單防 XSS：把純文字安全地放進 innerHTML
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

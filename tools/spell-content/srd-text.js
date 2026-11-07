// SRD 版法術說明（srd 區塊）轉成網站顯示的 HTML。支援 SRD 直譯用到的 Markdown 子集：
// 段落（空行分隔；段落內換行保留為 <br>）、「- 」清單、「## 」「#### 」小標、GFM 表格、_斜體_ 或 *斜體*、**粗體**。
// 內文出現「<」「>」「&」或其他不支援的寫法一律報錯，不靜默輸出。
"use strict";
const { ContentError } = require("../content/errors");

const escapeHtml = text => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inline(text, where) {
  if (/[<>&`\\]/.test(text)) throw new ContentError(`${where}：SRD 文字不可有 <、>、&、反引號或反斜線：${text}`);
  const html = escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>");
  if (/[*_]/.test(html)) throw new ContentError(`${where}：SRD 文字有未成對的 * 或 _：${text}`);
  return html;
}

function table(lines, where) {
  const cells = line => line.replace(/^\|/, "").replace(/\|$/, "").split("|").map(cell => cell.trim());
  if (lines.length < 2 || !cells(lines[1]).every(cell => /^:?-{3,}:?$/.test(cell))) throw new ContentError(`${where}：表格第二行應為 | --- | 分隔列`);
  const head = cells(lines[0]);
  const rows = lines.slice(2).map(cells);
  if (rows.some(row => row.length !== head.length)) throw new ContentError(`${where}：表格各列欄數不同`);
  return `<table class="spell-srd-table"><thead><tr>${head.map(cell => `<th>${inline(cell, where)}</th>`).join("")}</tr></thead>`
    + `<tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${inline(cell, where)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function body(text, where) {
  return text.split(/\n{2,}/).map(block => {
    const lines = block.split("\n");
    const heading = block.match(/^(#{2,4}) (.+)$/);
    if (heading && lines.length === 1) return `<h4 class="spell-srd-heading">${inline(heading[2], where)}</h4>`;
    if (lines.every(line => line.startsWith("|"))) return table(lines, where);
    if (lines.every(line => line.startsWith("- "))) return `<ul class="spell-desc-list">${lines.map(line => `<li>${inline(line.slice(2), where)}</li>`).join("")}</ul>`;
    if (lines.some(line => /^(#|\||- )/.test(line))) throw new ContentError(`${where}：小標、表格或清單須自成一段（前後空一行）`);
    return `<p>${lines.map(line => inline(line, where)).join("<br>")}</p>`;
  }).join("");
}

// headerLines：[[標籤, 內容], …]（與網站版相同的標頭，材料與觸發條件為 SRD 譯文）。
function renderSrdText(headerLines, text, where) {
  return {
    header: headerLines.map(([label, value]) => `${escapeHtml(label)}: ${inline(value, `${where} 標頭`)}`).join("<br>"),
    html: body(text, `${where} srd.body`)
  };
}

// 怪物 SRD 版（tools/monster-content）共用同一套轉換。
module.exports = { renderSrdText, inline, body, escapeHtml };

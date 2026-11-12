// 職業頁「SRD 版」（職業與子職內容檔的 srd 區塊）轉成網站顯示的 HTML，只供顯示：網站程式不從中讀取規則。
// 輸出結構比照 classFeatures：data-class-feature-panel="creation"（核心特質、成為某職業、特性表）與 "class"（1–20 級能力）；
// 能力段落帶 data-feature-level，子職段落另帶 data-subclass，網站以和網站版相同的函式（getClassFeatureHtmlBeforeLevel）篩選。
// 不輸出 data-feature-id（職業頁找能力位置只看網站版）、表單控制項或 id。
// Markdown 子集：段落（空行分隔；段落內換行保留為 <br>）、「- 」清單、「### 」「#### 」小標、GFM 表格、_斜體_、**粗體**。
// 第一列就是 | --- | 分隔列的表格沒有表頭，輸出成核心特質那種兩欄表。行內寫法沿用法術 SRD 版（tools/spell-content/srd-text.js）。
// 每行以「> 」開頭的區塊是側欄（原文框起來的補充，例如聖騎士「違背誓言」）：只有「>」的行分段，
// 第一段可寫「> ### 標題」當側欄標題，其餘只能是段落與清單。
"use strict";
const { ContentError } = require("../content/errors");
const { inline, escapeHtml } = require("../spell-content/srd-text");

const cells = line => line.replace(/^\|/, "").replace(/\|$/, "").split("|").map(cell => cell.trim());
const isSeparator = line => cells(line).every(cell => /^-{3,}$/.test(cell));

// 多列表頭（分隔列之前有兩列以上，例如施法職業特性表的「各環階法術位」）：表頭儲存格可留空，
// 空格若在上一列只佔這一欄的儲存格正下方，併入上方儲存格（跨列）；否則併入同列左邊的儲存格（跨欄）；
// 都不符合（例如第一列開頭）時輸出空白表頭格。
function headerRows(rows, where) {
  const owner = rows.map(() => []);
  const html = rows.map((row, r) => {
    const out = [];
    row.forEach((text, c) => {
      const above = r > 0 ? owner[r - 1][c] : null;
      const left = c > 0 ? owner[r][c - 1] : null;
      if (text) {
        owner[r][c] = { text, row: r, colspan: 1, rowspan: 1 };
        out.push(owner[r][c]);
      } else if (above && above.text && above.colspan === 1) {
        above.rowspan++;
        owner[r][c] = above;
      } else if (left && left.row === r && left.text) {
        left.colspan++;
        owner[r][c] = left;
      } else {
        owner[r][c] = { text: "", row: r, colspan: 1, rowspan: 1 };
        out.push(owner[r][c]);
      }
    });
    return out;
  });
  return html.map(row => `<tr>${row.map(cell => {
    const span = `${cell.colspan > 1 ? ` colspan="${cell.colspan}"` : ""}${cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : ""}`;
    return `<th${span}>${cell.text ? inline(cell.text, where) : ""}</th>`;
  }).join("")}</tr>`).join("");
}

function table(lines, where) {
  const separatorIndex = lines.findIndex(isSeparator);
  const headerless = separatorIndex === 0;
  if (separatorIndex < 0 || lines.length < separatorIndex + 2) throw new ContentError(`${where}：表格要有 | --- | 分隔列與內容列（沒有表頭的表格第一行寫分隔列）`);
  const separator = cells(lines[separatorIndex]);
  const rows = lines.slice(separatorIndex + 1).map(cells);
  if (rows.some(row => row.length !== separator.length) || rows.flat().some(cell => !cell)) throw new ContentError(`${where}：表格各列欄數須相同且儲存格不可空白`);
  const body = `<tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${inline(cell, where)}</td>`).join("")}</tr>`).join("")}</tbody>`;
  if (headerless) return `<table class="class-core-profile-table class-srd-profile-table">${body}</table>`;
  const head = lines.slice(0, separatorIndex).map(cells);
  if (head.some(row => row.length !== separator.length)) throw new ContentError(`${where}：表頭與分隔列欄數不同`);
  if (head.length === 1 && head[0].some(cell => !cell)) throw new ContentError(`${where}：單列表頭的儲存格不可空白`);
  return `<div class="class-feature-table-wrap"><table class="class-feature-table class-srd-table"><thead>${headerRows(head, where)}</thead>${body}</table></div>`;
}

// headings：允許的小標層級（overview 為 ### 與 ####；能力全文與子職說明不可有小標）。
function blocks(text, where, { headings = [], tables = true, sidebars = true } = {}) {
  return text.trim().split(/\n{2,}/).map(block => {
    const lines = block.split("\n");
    if (lines.every(line => /^>( |$)/.test(line))) {
      if (!sidebars) throw new ContentError(`${where}：側欄內不可再有側欄`);
      const parts = lines.map(line => line.replace(/^> ?/, "")).join("\n").trim().split(/\n{2,}/);
      const title = parts[0].match(/^### (.+)$/);
      const content = (title ? parts.slice(1) : parts).join("\n\n");
      if (!content.trim()) throw new ContentError(`${where}：側欄要有內文`);
      return `<aside class="class-srd-sidebar">${title ? `<h4 class="class-srd-sidebar__title">${inline(title[1], where)}</h4>` : ""}`
        + `${blocks(content, `${where}（側欄）`, { tables: false, sidebars: false })}</aside>`;
    }
    const heading = block.match(/^(#{1,6}) (.+)$/);
    if (heading && lines.length === 1) {
      const level = heading[1].length;
      if (!headings.includes(level)) throw new ContentError(`${where}：不可使用 ${heading[1]} 小標`);
      return level === 3 ? `<h3 class="class-srd-heading">${inline(heading[2], where)}</h3>` : `<h4 class="class-srd-subheading">${inline(heading[2], where)}</h4>`;
    }
    if (lines.every(line => line.startsWith("|"))) {
      if (!tables) throw new ContentError(`${where}：不可使用表格`);
      return table(lines, where);
    }
    if (lines.every(line => line.startsWith("- "))) return `<ul class="class-rule-list">${lines.map(line => `<li>${inline(line.slice(2), where)}</li>`).join("")}</ul>`;
    if (lines.some(line => /^(#|\||- |• |>)/.test(line))) throw new ContentError(`${where}：小標、表格、清單或側欄須自成一段（前後空一行），清單用「- 」，側欄每行以「> 」開頭`);
    return `<p>${lines.map(line => inline(line, where)).join("<br>")}</p>`;
  }).join("");
}

function featureSection(feature, where, subclassId = "") {
  const attributes = `data-feature-level="${feature.level}"${subclassId ? ` data-subclass="${escapeHtml(subclassId)}"` : ""}`;
  return `<section class="class-feature-section class-srd-feature" ${attributes}><h3>${feature.level} 級：${inline(feature.name, where)}</h3>`
    + `${blocks(feature.text, `${where}（${feature.level} 級：${feature.name}）`)}</section>`;
}

// subclasses：依網站子職順序（預設子職在前）；沒有 srd 區塊的子職不輸出。沒有 srd 區塊的職業回傳 null。
function renderClassSrd(classDef, subclasses) {
  if (!classDef.srd) return null;
  const where = `${classDef.file} srd`;
  const features = classDef.srd.features.map(feature => featureSection(feature, `${where}.features`));
  for (const subclass of subclasses.filter(item => item.srd)) {
    const subWhere = `${subclass.file} srd`;
    features.push(`<section class="class-feature-section class-srd-subclass" data-feature-level="${classDef.subclassLevel}" data-subclass="${escapeHtml(subclass.id)}">`
      + `<h3>${inline(subclass.srd.title, `${subWhere}.title`)}</h3>${blocks(subclass.srd.intro, `${subWhere}.intro`, { tables: false })}</section>`);
    features.push(...subclass.srd.features.map(feature => featureSection(feature, `${subWhere}.features`, subclass.id)));
  }
  return `<section class="class-creation-content class-srd-creation" data-class-feature-panel="creation">${blocks(classDef.srd.overview, `${where}.overview`, { headings: [3, 4] })}</section>\n`
    + `<div class="class-feature-content class-srd-content" data-class-feature-panel="class">\n${features.join("\n")}\n</div>`;
}

module.exports = { renderClassSrd };

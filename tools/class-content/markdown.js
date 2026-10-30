// 職業內容檔的文字格式：標準 Markdown 的小子集，加上 [[提示]] 與 {數值|頁面文字} 兩種標記。
// 支援：段落、「- 」清單、行尾「\」強制換行、**粗體**、「#### 標題」小節（到下一個 #### 或文字結束）。
// 內文出現「<」或其他不支援的寫法一律報錯，不靜默輸出。
"use strict";

const { loadTipTables } = require("./legacy");

class ContentError extends Error {}

function escapeHtml(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// options.resolveValue(token) 回傳 data-tabletop-value 的 key；查不到時丟出錯誤。
function renderInline(source, options, where) {
  const text = String(source);
  if (text.includes("<")) throw new ContentError(`${where}：內文不可使用 HTML（出現「<」）`);
  const { skills, conditions } = loadTipTables();
  let html = "";
  let index = 0;
  const pattern = /\*\*(.+?)\*\*|\[\[([^\]|]+)\]\]|\{([A-Za-z][A-Za-z0-9]*)\|([^{}]*)\}/g;
  for (const match of text.matchAll(pattern)) {
    html += escapeHtml(text.slice(index, match.index));
    index = match.index + match[0].length;
    // 粗體內只有一個數值標記（**{名稱|文字}**）時，數值標記直接加在 <strong> 上。
    const boldValue = match[1]?.match(/^\{([A-Za-z][A-Za-z0-9]*)\|([^{}]*)\}$/);
    if (boldValue) {
      html += `<strong data-tabletop-value="${escapeHtml(options.resolveValue(boldValue[1], where))}">${escapeHtml(boldValue[2])}</strong>`;
    } else if (match[1] !== undefined) {
      html += `<strong>${renderInline(match[1], options, where)}</strong>`;
    } else if (match[2] !== undefined) {
      const name = match[2];
      if (conditions.has(name)) html += `<span class="condition-tip" data-condition="${conditions.get(name)}">${escapeHtml(name)}</span>`;
      else if (skills.has(name)) html += `<span class="skill-tip" data-skill="${escapeHtml(name)}">${escapeHtml(name)}</span>`;
      else throw new ContentError(`${where}：[[${name}]] 不是已知的技能、規則或狀態名稱`);
    } else {
      const key = options.resolveValue(match[3], where);
      html += `<span data-tabletop-value="${escapeHtml(key)}">${escapeHtml(match[4])}</span>`;
    }
  }
  const rest = text.slice(index);
  if (/\*\*|\[\[|\]\]|[{}]/.test(rest)) throw new ContentError(`${where}：無法解析的標記「${rest.match(/\*\*|\[\[|\]\]|[{}]/)[0]}」`);
  return html + escapeHtml(rest);
}

// 把一段內文切成區塊：{ type: "p" | "ul" | "h4", lines }。
function parseBlocks(source, where) {
  const lines = String(source ?? "").replace(/\r\n?/g, "\n").replace(/\n+$/, "").split("\n");
  const blocks = [];
  let current = null;
  const close = () => { if (current) blocks.push(current); current = null; };
  lines.forEach((line, number) => {
    const at = `${where} 第 ${number + 1} 行`;
    if (!line.trim()) return close();
    if (/^#### /.test(line)) {
      close();
      blocks.push({ type: "h4", text: line.slice(5).trim() });
      return;
    }
    if (/^#/.test(line)) throw new ContentError(`${at}：只支援「#### 」小節標題`);
    if (/^- /.test(line)) {
      if (current?.type !== "ul") { close(); current = { type: "ul", items: [] }; }
      current.items.push([line.slice(2)]);
      return;
    }
    if (/^  \S/.test(line) && current?.type === "ul") {
      const item = current.items[current.items.length - 1];
      if (!item[item.length - 1].endsWith("\\")) throw new ContentError(`${at}：清單內換行請在上一行結尾加「\\」`);
      item.push(line.slice(2));
      return;
    }
    if (/^\s/.test(line)) throw new ContentError(`${at}：段落不可縮排`);
    if (current?.type === "ul") close();
    if (!current) current = { type: "p", lines: [] };
    else if (!current.lines[current.lines.length - 1].endsWith("\\")) throw new ContentError(`${at}：段落內換行請在上一行結尾加「\\」`);
    current.lines.push(line);
  });
  close();
  return blocks;
}

function joinHardBreaks(lines, options, where) {
  return lines.map((line, index) => {
    const isLast = index === lines.length - 1;
    if (isLast && line.endsWith("\\")) throw new ContentError(`${where}：最後一行不可用「\\」結尾`);
    return renderInline(isLast ? line : line.slice(0, -1), options, where);
  }).join("<br>");
}

// 輸出與舊版 class-features.js 相同的區塊標記；subsectionClass 為小節的 class，
// blockAttributes 加在最外層區塊（段落、清單、小節）的開頭標籤上。
function renderMarkdown(source, options, where) {
  const blocks = parseBlocks(source, where);
  const outer = options.blockAttributes ? ` ${options.blockAttributes}` : "";
  const renderBlock = (block, attributes = "") => block.type === "p"
    ? `<p${attributes}>${joinHardBreaks(block.lines, options, where)}</p>`
    : `<ul class="class-rule-list"${attributes}>${block.items.map(item => `<li>${joinHardBreaks(item, options, where)}</li>`).join("")}</ul>`;
  let html = "";
  let subsection = null;
  const closeSubsection = () => {
    if (subsection !== null) html += `<div class="${options.subsectionClass || "class-rule-subsection"}"${outer}>${subsection}</div>`;
    subsection = null;
  };
  for (const block of blocks) {
    if (block.type === "h4") {
      closeSubsection();
      subsection = `<h4>${renderInline(block.text, options, where)}</h4>`;
    } else if (subsection !== null) subsection += renderBlock(block);
    else html += renderBlock(block, outer);
  }
  closeSubsection();
  return html;
}

module.exports = { ContentError, escapeHtml, renderInline, renderMarkdown };

// 職業內容檔的文字格式：標準 Markdown 的小子集，加上 [[提示]] 與 {數值|頁面文字} 兩種標記。
// 支援：段落、「- 」清單、行尾「\」強制換行、**粗體**、「#### 標題」小節（到下一個 #### 或文字結束）、GFM 表格、「---」分隔線。
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
  const { skills, conditions, beasts } = loadTipTables();
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
      else if (beasts.has(name)) html += `<span class="beast-tip" data-beast="${beasts.get(name)}">${escapeHtml(name)}</span>`;
      else throw new ContentError(`${where}：[[${name}]] 不是已知的技能、規則、狀態或野獸名稱`);
    } else {
      // 頁面文字可含粗體（{名稱|**粗體**其他文字}）；不可再含數值標記（[^{}] 已排除）。
      // 頁面文字留空（{名稱|}）＝只在跑團出現：輸出成跑團限定的數值 span。
      // options.valueFrame(名稱) 回傳 [前綴, 後綴] 時（引用其他數值並帶 format），外框輸出成包住數值的跑團限定文字。
      const key = escapeHtml(options.resolveValue(match[3], where));
      const frame = options.valueFrame?.(match[3]);
      if (frame && match[4]) throw new ContentError(`${where}：{${match[3]}|…} 的 format 外框只在跑團顯示，頁面文字須留空`);
      if (frame) html += `<span data-tabletop-only hidden>${escapeHtml(frame[0])}<span data-tabletop-value="${key}"></span>${escapeHtml(frame[1])}</span>`;
      else if (!match[4]) html += `<span data-tabletop-only hidden data-tabletop-value="${key}"></span>`;
      else html += `<span data-tabletop-value="${key}">${renderInline(match[4], options, where)}</span>`;
    }
  }
  const rest = text.slice(index);
  if (/\*\*|\[\[|\]\]|[{}]/.test(rest)) throw new ContentError(`${where}：無法解析的標記「${rest.match(/\*\*|\[\[|\]\]|[{}]/)[0]}」`);
  return html + escapeHtml(rest);
}

// 把一段內文切成區塊：{ type: "p" | "ul" | "h4" | "table" | "hr", lines }。
function parseBlocks(source, where) {
  const lines = String(source ?? "").replace(/\r\n?/g, "\n").replace(/\n+$/, "").split("\n");
  const blocks = [];
  let current = null;
  const close = () => { if (current) blocks.push(current); current = null; };
  lines.forEach((line, number) => {
    const at = `${where} 第 ${number + 1} 行`;
    if (!line.trim()) return close();
    // GFM 表格：表頭列、分隔列（只能用 ---）、表身列，每列以「|」開頭與結尾；表格前後須空行。
    if (/^\|/.test(line)) {
      if (current && current.type !== "table") throw new ContentError(`${at}：表格前須空一行`);
      if (!/^\|.*\|$/.test(line)) throw new ContentError(`${at}：表格列須以「|」開頭與結尾`);
      if (line.includes("\\")) throw new ContentError(`${at}：表格內不支援「\\」`);
      current ||= { type: "table", rows: [] };
      current.rows.push(line.slice(1, -1).split("|").map(cell => cell.trim()));
      return;
    }
    if (current?.type === "table") throw new ContentError(`${at}：表格後須空一行`);
    // 分隔線：單獨一行「---」，前後須空行（緊接段落的「---」在標準 Markdown 是標題寫法）。
    if (line === "---") {
      if (lines[number - 1]?.trim() || lines[number + 1]?.trim()) throw new ContentError(`${at}：分隔線前後須空一行`);
      blocks.push({ type: "hr" });
      return;
    }
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
  blocks.filter(block => block.type === "table").forEach(block => {
    const [header, delimiter, ...rows] = block.rows;
    if (!delimiter || !delimiter.every(cell => /^-{3,}$/.test(cell))) throw new ContentError(`${where}：表格第二列須為「| --- | --- |」分隔列（不支援對齊冒號）`);
    if (!rows.length || [delimiter, ...rows].some(cells => cells.length !== header.length)) throw new ContentError(`${where}：表格每列的欄數須與表頭相同，且至少一列表身`);
    if ([header, ...rows].some(cells => cells.some(cell => !cell))) throw new ContentError(`${where}：表格儲存格不可空白`);
    Object.assign(block, { header, rows });
  });
  return blocks;
}

function joinHardBreaks(lines, options, where) {
  return lines.map((line, index) => {
    const isLast = index === lines.length - 1;
    if (isLast && line.endsWith("\\")) throw new ContentError(`${where}：最後一行不可用「\\」結尾`);
    return renderInline(isLast ? line : line.slice(0, -1), options, where);
  }).join("<br>");
}

// 表格外框：frame 為能力 tables 中對應的一項（{ label, style, kind, rowHeaders, rowHeaderSuffix, cellLabels }）。
// 表頭輸出 <th scope="col">，表身輸出 <td>；rowHeaders 時每列第一格輸出 <th scope="row">（rowHeaderSuffix 包成窄螢幕才顯示的
// <span class="rule-level-suffix">），cellLabels 依序成為表身 <td> 的 data-label（窄螢幕的欄位名稱）。
// style 預設是進程表（rule-progress-table rule-progress-table--樣式）；kind: reference 時表格只加樣式名稱的 class。
function renderTable(block, frame, options, where, attributes) {
  const shell = frame.style ? `rule-table-shell rule-table-shell--${frame.style}` : "rule-table-shell";
  const table = !frame.style ? "rule-reference-table"
    : frame.kind === "reference" ? `rule-reference-table ${frame.style}` : `rule-reference-table rule-progress-table rule-progress-table--${frame.style}`;
  const dataColumns = block.header.length - (frame.rowHeaders ? 1 : 0);
  if (frame.cellLabels && frame.cellLabels.length !== dataColumns) throw new ContentError(`${where}：表格「${frame.label}」的 cellLabels 有 ${frame.cellLabels.length} 項，表身資料欄有 ${dataColumns} 欄`);
  if (frame.rowHeaderSuffix && !frame.rowHeaders) throw new ContentError(`${where}：表格「${frame.label}」有 rowHeaderSuffix 時須寫 rowHeaders: true`);
  const header = block.header.map(cell => `<th scope="col">${renderInline(cell, options, where)}</th>`).join("");
  const row = cells => cells.map((cell, index) => {
    const content = renderInline(cell, options, where);
    if (frame.rowHeaders && index === 0) return `<th scope="row">${content}${frame.rowHeaderSuffix ? `<span class="rule-level-suffix">${escapeHtml(frame.rowHeaderSuffix)}</span>` : ""}</th>`;
    const label = frame.cellLabels?.[index - (frame.rowHeaders ? 1 : 0)];
    return `<td${label ? ` data-label="${escapeHtml(label)}"` : ""}>${content}</td>`;
  }).join("");
  return `<div class="${shell}"${attributes}><table class="${table}" aria-label="${escapeHtml(frame.label)}">`
    + `<thead><tr>${header}</tr></thead>`
    + `<tbody>${block.rows.map(cells => `<tr>${row(cells)}</tr>`).join("")}</tbody></table></div>`;
}

// 輸出與舊版 class-features.js 相同的區塊標記；subsectionClass 為小節的 class，
// blockAttributes 加在最外層區塊（段落、清單、表格、小節）的開頭標籤上。
// options.tables：表格外框清單，依出現順序對應文字中的表格，數量須相同；沒有提供時文字不可有表格。
// options.tablesOptional：文字可以完全沒有表格（tabletop 省略只在職業頁顯示的表格時）。
// options.blockNewlines：區塊、清單項目與小節內的標籤之間換行（網站以字串切割讀取的附錄，換行會影響讀出的段落）。
// options.plainHeadings：「#### 」只輸出 <h4>，不另包小節（文字本身已在小節內，例如附錄小節「書之魔契」的「戲法與儀式」）。
// 分隔線「---」輸出 <hr class="class-rule-divider">（樣式由 styles.css 設定，不輸出行內 style）。
function renderMarkdown(source, options, where) {
  const blocks = parseBlocks(source, where);
  const outer = options.blockAttributes ? ` ${options.blockAttributes}` : "";
  const newline = options.blockNewlines ? "\n" : "";
  const tableCount = blocks.filter(block => block.type === "table").length;
  if (tableCount && !options.tables) throw new ContentError(`${where}：表格只能寫在能力的 text／tabletop，並在 tables 列出外框`);
  if (options.tables && tableCount !== options.tables.length && !(options.tablesOptional && !tableCount)) throw new ContentError(`${where}：文字有 ${tableCount} 個表格，tables 列了 ${options.tables.length} 個`);
  let tableIndex = 0;
  const renderBlock = (block, attributes = "") => block.type === "p"
    ? `<p${attributes}>${joinHardBreaks(block.lines, options, where)}</p>`
    : block.type === "hr" ? `<hr class="class-rule-divider"${attributes}>`
    : block.type === "table" ? renderTable(block, options.tables[tableIndex++], options, where, attributes)
    : `<ul class="class-rule-list"${attributes}>${newline}${block.items.map(item => `<li>${joinHardBreaks(item, options, where)}</li>`).join(newline)}${newline}</ul>`;
  const html = [];
  let subsection = null;
  const closeSubsection = () => {
    if (subsection !== null) html.push(`<div class="${options.subsectionClass || "class-rule-subsection"}"${outer}>${newline}${subsection.join(newline)}${newline}</div>`);
    subsection = null;
  };
  for (const block of blocks) {
    if (block.type === "h4" && options.plainHeadings) {
      html.push(`<h4>${renderInline(block.text, options, where)}</h4>`);
    } else if (block.type === "h4") {
      closeSubsection();
      subsection = [`<h4>${renderInline(block.text, options, where)}</h4>`];
    } else if (subsection !== null) subsection.push(renderBlock(block));
    else html.push(renderBlock(block, outer));
  }
  closeSubsection();
  return html.join(newline);
}

module.exports = { ContentError, escapeHtml, renderInline, renderMarkdown };

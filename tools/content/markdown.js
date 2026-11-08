// 內容檔的文字格式：標準 Markdown 的小子集，加上 [[提示]]、{數值|頁面文字} 與 [文字]{網站功能標記} 三種標記。
// 支援：段落、「- 」清單、行尾「\」強制換行、**粗體**、「#### 標題」小節（到下一個 #### 或文字結束）、GFM 表格、「---」分隔線。
// 內文出現「<」或其他不支援的寫法一律報錯，不靜默輸出。
"use strict";

const { loadTipTables } = require("./site-sources");
const { ContentError } = require("./errors");

// [文字]{名稱} 可用的網站功能標記：輸出 <span data-名稱>文字</span>，職業頁與跑團版相同。只列網站程式會讀取的標記，
// 不在清單內的名稱一律報錯。
// 目前沒有網站程式讀取的標記，清單為空。
const MARKS = new Set([]);

function escapeHtml(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// options.view：省略時輸出職業頁 HTML；"tabletop"（跑團動作說明）或 "overview"（跑團總覽）時輸出跑團版。
// 數值標記 {名稱|頁面文字} 在職業頁只輸出頁面文字，跑團版包成 data-tabletop-value（網站依等級與屬性換成算出的數值）；
// 頁面文字留空（{名稱|}）＝只在跑團出現。options.resolveValue(token) 回傳數值名稱；查不到時丟出錯誤。
function renderInline(source, options, where) {
  const text = String(source);
  if (text.includes("<")) throw new ContentError(`${where}：內文不可使用 HTML（出現「<」）`);
  const { skills, conditions, beasts } = loadTipTables();
  let html = "";
  let index = 0;
  const pattern = /\*\*(.+?)\*\*|\[\[([^\]|]+)\]\]|\{([A-Za-z][A-Za-z0-9]*)\|([^{}]*)\}|\[([^[\]]+)\]\{([a-z][a-z0-9-]*)\}/g;
  for (const match of text.matchAll(pattern)) {
    html += escapeHtml(text.slice(index, match.index));
    index = match.index + match[0].length;
    // 粗體內只有一個數值標記（**{名稱|文字}**）時，數值標記直接加在 <strong> 上。
    const boldValue = match[1]?.match(/^\{([A-Za-z][A-Za-z0-9]*)\|([^{}]*)\}$/);
    if (boldValue) {
      const key = escapeHtml(options.resolveValue(boldValue[1], where));
      html += `<strong${options.view ? ` data-tabletop-value="${key}"` : ""}>${escapeHtml(boldValue[2])}</strong>`;
    } else if (match[1] !== undefined) {
      html += `<strong>${renderInline(match[1], options, where)}</strong>`;
    } else if (match[2] !== undefined) {
      const name = match[2];
      if (conditions.has(name)) html += `<span class="condition-tip" data-condition="${conditions.get(name)}">${escapeHtml(name)}</span>`;
      else if (skills.has(name)) html += `<span class="skill-tip" data-skill="${escapeHtml(name)}">${escapeHtml(name)}</span>`;
      else if (beasts.has(name)) html += `<span class="beast-tip" data-beast="${beasts.get(name)}">${escapeHtml(name)}</span>`;
      else throw new ContentError(`${where}：[[${name}]] 不是已知的技能、規則、狀態或野獸名稱`);
    } else if (match[5] !== undefined) {
      if (!MARKS.has(match[6])) throw new ContentError(`${where}：[…]{${match[6]}} 不是網站功能標記（可用：${[...MARKS].join("、")}）`);
      html += `<span data-${match[6]}>${renderInline(match[5], options, where)}</span>`;
    } else {
      // 頁面文字可含粗體（{名稱|**粗體**其他文字}）；不可再含數值標記（[^{}] 已排除）。
      const key = escapeHtml(options.resolveValue(match[3], where));
      const text = match[4] ? renderInline(match[4], options, where) : "";
      html += options.view ? `<span data-tabletop-value="${key}">${text}</span>` : text;
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
      // 標題結尾的「{#名稱}」：特殊排版的小節，交給能力 behavior 的 renderSubsection()（見 renderMarkdown）。
      const special = line.slice(5).trim().match(/^(.*?)\s*\{#([a-z][a-z0-9-]*)\}$/);
      blocks.push(special ? { type: "h4", text: special[1], special: special[2] } : { type: "h4", text: line.slice(5).trim() });
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
// options.blockNewlines：區塊、清單項目與小節內的標籤之間換行（超魔法附錄沿用舊版排版，跑團說明依換行分段）。
// options.plainHeadings：「#### 」只輸出 <h4>，不另包小節（文字本身已在小節內，例如附錄小節「書之魔契」的「戲法與儀式」）。
// options.view（見 renderInline）：跑團版不輸出表格（跑團說明不顯示表格）。
// 分隔線「---」輸出 <hr class="class-rule-divider">（樣式在 css/base.css，不輸出行內 style）。
// options.behavior：{ name, renderSubsection, nextSubsectionClass }（能力的 behavior）。標題寫成「#### 標題 {#名稱}」的小節
// （名稱須等於 behavior 名稱）不照一般小節輸出，改由 renderSubsection(blocks, helpers) 依小節內解析好的區塊產生 HTML；
// nextSubsectionClass 加在緊接其後的小節上（後面沒有小節時報錯）。
function renderMarkdown(source, options, where) {
  const blocks = parseBlocks(source, where);
  const outer = options.blockAttributes ? ` ${options.blockAttributes}` : "";
  const newline = options.blockNewlines ? "\n" : "";
  const tableCount = blocks.filter(block => block.type === "table").length;
  if (tableCount && !options.tables) throw new ContentError(`${where}：表格只能寫在能力的 text／tabletop，並在 tables 列出外框`);
  if (options.tables && tableCount !== options.tables.length && !(options.tablesOptional && !tableCount)) throw new ContentError(`${where}：文字有 ${tableCount} 個表格，tables 列了 ${options.tables.length} 個`);
  let tableIndex = 0;
  // 段落只有一個跑團限定數值 {名稱|} 時，整段只在跑團顯示，職業頁不留空白段落。
  const tabletopOnly = block => block.lines.length === 1 && /^\{[A-Za-z][A-Za-z0-9]*\|\}$/.test(block.lines[0]);
  const renderTableBlock = (block, attributes) => {
    const html = renderTable(block, options.tables[tableIndex++], options, where, attributes);
    return options.view ? "" : html;
  };
  const renderParagraph = (block, attributes) => {
    const html = `<p${attributes}>${joinHardBreaks(block.lines, options, where)}</p>`;
    return tabletopOnly(block) && !options.view ? "" : html;
  };
  const renderBlock = (block, attributes = "") => block.type === "p"
    ? renderParagraph(block, attributes)
    : block.type === "hr" ? `<hr class="class-rule-divider"${attributes}>`
    : block.type === "table" ? renderTableBlock(block, attributes)
    : `<ul class="class-rule-list"${attributes}>${newline}${block.items.map(item => `<li>${joinHardBreaks(item, options, where)}</li>`).join(newline)}${newline}</ul>`;
  // 區塊的內部 HTML（段落：不含 <p>；清單：<li> 項目），供 behavior 的 renderSubsection() 使用。
  const inner = block => block.type === "p" ? joinHardBreaks(block.lines, options, where)
    : block.type === "ul" ? block.items.map(item => `<li>${joinHardBreaks(item, options, where)}</li>`).join("")
    : (() => { throw new ContentError(`${where}：特殊小節只能有段落與清單`); })();
  const html = [];
  let subsection = null;
  let special = null;
  let extraClass = "";
  const closeSubsection = () => {
    if (special) {
      const output = options.behavior.renderSubsection(special.blocks, { heading: special.heading, inner, view: options.view, where });
      html.push(output.html);
      extraClass = output.nextSubsectionClass ? ` ${output.nextSubsectionClass}` : "";
      special = null;
      return;
    }
    if (subsection !== null) {
      html.push(`<div class="${options.subsectionClass || "class-rule-subsection"}${extraClass}"${outer}>${newline}${subsection.filter(Boolean).join(newline)}${newline}</div>`);
      extraClass = "";
    }
    subsection = null;
  };
  for (const block of blocks) {
    if (block.special) {
      const behavior = options.behavior;
      if (!behavior?.renderSubsection || behavior.name !== block.special) throw new ContentError(`${where}：「#### ${block.text} {#${block.special}}」的名稱須等於此能力的 behavior，且該 behavior 提供小節排版`);
      if (options.plainHeadings) throw new ContentError(`${where}：這裡的「#### 」只輸出標題，不可寫 {#${block.special}}`);
      closeSubsection();
      special = { heading: block.text, blocks: [] };
    } else if (block.type === "h4" && options.plainHeadings) {
      html.push(`<h4>${renderInline(block.text, options, where)}</h4>`);
    } else if (block.type === "h4") {
      closeSubsection();
      subsection = [`<h4>${renderInline(block.text, options, where)}</h4>`];
    } else if (special) special.blocks.push(block);
    else if (subsection !== null) subsection.push(renderBlock(block));
    else html.push(renderBlock(block, outer));
  }
  closeSubsection();
  if (extraClass) throw new ContentError(`${where}：特殊小節之後須緊接一個「#### 」小節`);
  return html.filter(Boolean).join(newline);
}

// values 的 fromTable：由能力文字中的表格組出跑團文字（例如術士生成法術位的換算），表格只寫一次。
// spec：{ feature: 能力 ID, table: 第幾個表格（預設 1）, row: 每列的樣板（{1}、{2}… 代入該列各欄）, join, end }。
function tableValueText(features, spec, where) {
  const feature = features.find(item => item.id === spec.feature);
  if (!feature) throw new ContentError(`${where}：fromTable 的能力「${spec.feature}」不存在`);
  const tables = parseBlocks(feature.text, `${where}（${spec.feature}）`).filter(block => block.type === "table");
  const table = tables[(spec.table || 1) - 1];
  if (!table) throw new ContentError(`${where}：能力「${spec.feature}」的文字沒有第 ${spec.table || 1} 個表格`);
  const columns = [...spec.row.matchAll(/\{(\d+)\}/g)].map(match => Number(match[1]));
  if (!columns.length || columns.some(column => column < 1 || column > table.header.length)) {
    throw new ContentError(`${where}：fromTable 的 row 只能用 {1}～{${table.header.length}}`);
  }
  if (/[<{}]|\*\*|\[\[/.test(spec.row.replace(/\{\d+\}/g, ""))) throw new ContentError(`${where}：fromTable 的 row 不可含其他標記`);
  return table.rows.map(cells => spec.row.replace(/\{(\d+)\}/g, (all, column) => cells[Number(column) - 1])).join(spec.join ?? "") + (spec.end ?? "");
}

module.exports = { escapeHtml, renderInline, renderMarkdown, parseBlocks, tableValueText };

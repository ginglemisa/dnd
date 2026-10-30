// 比對內容檔渲染的職業 HTML 與舊版 class-features.js：以正規化 DOM 與三種讀取方式（職業頁、跑團動作、跑團總覽）核對。
// 用法：node tools/class-content/compare.js [職業 ID…]（省略時比對所有已轉換的職業）
"use strict";
const fs = require("fs");
const path = require("path");
const parse5 = require("parse5");
const { loadLegacyClassFeatures } = require("./legacy");
const { loadContent } = require("./load");
const { renderClass } = require("./render");

const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
const has = (node, name) => Boolean(node.attrs?.some(item => item.name === name));
const classes = node => (attr(node, "class") || "").split(/\s+/).filter(Boolean);
const findAll = (node, test, out = []) => { if (test(node)) out.push(node); (node.childNodes || []).forEach(child => findAll(child, test, out)); return out; };
const textOf = node => node.nodeName === "#text" ? node.value : (node.childNodes || []).map(textOf).join("");
const squash = text => text.replace(/ /g, " ").replace(/[ \t\r]*\n\s*/g, "").replace(/[ \t]+/g, " ");

// 職業頁的閱讀內容：保留粗體、提示框、數值標記、勾選框與區塊層級，忽略排版用空白與 style。
function richText(node, skip = () => false) {
  const out = [];
  let line = "";
  const flush = prefix => { if (line.trim()) out.push(`${prefix}${line.trim()}`); line = ""; };
  const walk = (current, prefix) => {
    if (current.nodeName === "#text") { line += squash(current.value); return; }
    if (current.nodeName === "#comment" || skip(current)) return;
    const name = current.nodeName;
    if (name === "br") { line += "⏎"; return; }
    if (name === "strong") { line += "**"; current.childNodes.forEach(child => walk(child, prefix)); line += "**"; return; }
    if (name === "span" && classes(current).includes("skill-tip")) { line += `[[${attr(current, "data-skill")}]]`; return; }
    if (name === "span" && classes(current).includes("condition-tip")) { line += `[[${textOf(current)}:${attr(current, "data-condition")}]]`; return; }
    if (name === "input") { line += `☐${attr(current, "id")}${attr(current, "data-feature-choice-group") ? `@${attr(current, "data-feature-choice-group")}` : ""}`; return; }
    if (name === "span" && has(current, "data-tabletop-value")) { line += `{${attr(current, "data-tabletop-value")}|`; current.childNodes.forEach(child => walk(child, prefix)); line += "}"; return; }
    if (["span", "label", "em", "b"].includes(name)) { current.childNodes.forEach(child => walk(child, prefix)); return; }
    const childPrefix = name === "li" ? `${prefix}- ` : name === "h3" ? `${prefix}### ` : name === "h4" ? `${prefix}#### ` : prefix;
    flush(prefix);
    const nested = ["div", "ul", "section", "blockquote", "table", "tbody", "thead", "tr"].includes(name) && classes(current).some(item => /subsection|mission-option$/.test(item)) ? `${prefix}  ` : childPrefix;
    current.childNodes.forEach(child => walk(child, nested === prefix ? childPrefix : nested));
    flush(childPrefix);
  };
  walk(node, "");
  return out;
}

// action-panel.js classDescriptionToPlainText 的同等版本（跑團動作與總覽讀取段落時使用）。
const SKIPPED = new Set(["table", "input", "button", "select", "label", "script", "style"]);
const BLOCKS = new Set(["p", "div", "section", "ul", "ol", "h4", "h5", "h6", "blockquote", "details", "summary"]);
function tabletopText(block, removed) {
  const lines = [];
  let text = "";
  let inListItem = false;
  const flush = () => {
    const line = text.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim();
    if (line) lines.push({ line: inListItem ? `- ${line}` : line, listItem: inListItem });
    text = "";
  };
  const walk = node => {
    if (node.nodeName === "#text") { text += node.value.replace(/ /g, " ").replace(/[ \t\r]*\n\s*/g, ""); return; }
    if (node.nodeName === "#comment") return;
    const tabletopOnly = has(node, "data-tabletop-only");
    if (SKIPPED.has(node.nodeName) || removed(node) || (has(node, "hidden") && !tabletopOnly) || classes(node).includes("is-hidden")) return;
    if (node.nodeName === "br") { text += "\n"; return; }
    if (has(node, "data-tabletop-value")) { text += `{${attr(node, "data-tabletop-value")}|${textOf(node)}}`; return; }
    const isListItem = node.nodeName === "li";
    const isBlock = isListItem || BLOCKS.has(node.nodeName);
    const outer = inListItem;
    if (isBlock) flush();
    if (isListItem) inListItem = true;
    node.childNodes.forEach(walk);
    if (isBlock) flush();
    inListItem = outer;
  };
  block.childNodes.forEach(walk);
  flush();
  return lines.map((entry, index) => (!index ? entry.line : `${entry.listItem && lines[index - 1].listItem ? "\n" : "\n\n"}${entry.line}`)).join("");
}
const actionView = block => tabletopText(block, node => node.nodeName === "h3" || has(node, "data-tabletop-hide"));
const overviewView = block => tabletopText(block, node => node.nodeName === "h3" || has(node, "data-tabletop-hide") || has(node, "data-overview-hide"))
  .split("\n").map(line => line.replace(/^- /u, "").trim()).filter(Boolean).join("");

// 嚴格比對用：正規化後的 DOM 標記（忽略 style 與排版空白，屬性排序）。
function canonicalLines(node, depth = 0, out = []) {
  for (const child of node.childNodes || []) {
    if (child.nodeName === "#comment") continue;
    if (child.nodeName === "#text") {
      const text = squash(child.value);
      if (text.trim()) out.push(`${"  ".repeat(depth)}"${text}"`);
      continue;
    }
    const attributes = (child.attrs || []).filter(item => item.name !== "style")
      .map(item => (item.name === "class" ? { ...item, value: classes(child).sort().join(" ") } : item))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(item => (item.value === "" ? item.name : `${item.name}="${item.value}"`));
    out.push(`${"  ".repeat(depth)}<${child.nodeName}${attributes.length ? ` ${attributes.join(" ")}` : ""}>`);
    canonicalLines(child, depth + 1, out);
  }
  return out;
}

// 最長共同子序列的逐行差異。
function diffLines(before, after) {
  const table = Array.from({ length: before.length + 1 }, () => new Uint32Array(after.length + 1));
  for (let i = before.length - 1; i >= 0; i -= 1) for (let j = after.length - 1; j >= 0; j -= 1) {
    table[i][j] = before[i] === after[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
  }
  const changes = [];
  let i = 0;
  let j = 0;
  while (i < before.length || j < after.length) {
    if (i < before.length && j < after.length && before[i] === after[j]) { i += 1; j += 1; }
    else if (j < after.length && (i === before.length || table[i][j + 1] >= table[i + 1][j])) changes.push(`+ ${after[j++]}`);
    else changes.push(`- ${before[i++]}`);
  }
  return changes;
}

function sectionSummary(root) {
  const panel = findAll(root, node => attr(node, "data-class-feature-panel") === "class")[0];
  return findAll(panel, node => node.nodeName === "section" && has(node, "data-feature-level")).map(section => ({
    level: attr(section, "data-feature-level"),
    actionId: attr(section, "data-action-id") || "",
    restChange: attr(section, "data-rest-change") || "",
    heading: textOf(findAll(section, node => node.nodeName === "h3")[0] || { nodeName: "#text", value: "" }).trim(),
    node: section
  }));
}

function creationSummary(root) {
  const creation = findAll(root, node => attr(node, "data-class-feature-panel") === "creation")[0];
  const pick = name => findAll(creation, node => classes(node).includes(name))[0];
  const profile = findAll(pick("class-core-profile-table"), node => node.nodeName === "tr").map(tr => {
    const [label, value] = findAll(tr, node => node.nodeName === "td");
    return `${textOf(label).trim()}：${richText(value).join(" ")}`;
  });
  const info = pick("class-core-creation-info");
  const table = findAll(info, node => node.nodeName === "table")[0];
  const note = richText({ nodeName: "div", childNodes: info.childNodes.slice(info.childNodes.indexOf(table) + 1) }).join(" ");
  const featureTable = findAll(pick("class-feature-table-details"), node => node.nodeName === "tr")
    .map(tr => findAll(tr, node => node.nodeName === "td" || node.nodeName === "th").map(cell => textOf(cell).trim()).join(" | "));
  return [
    `tagline：${textOf(pick("class-feature-tagline")).trim()}`,
    `quote：${textOf(pick("class-flavor-quote")).trim()}`,
    ...profile,
    `裝備說明：${note}`,
    ...featureTable.map(row => `表格：${row}`)
  ];
}

// output：renderClass() 的結果；tabletop／summaries 是建置輸出的資料，有寫時取代該段落的跑團文字。
function compareClass(classId, legacyHtml, output, accepted = []) {
  const legacy = parse5.parseFragment(legacyHtml);
  const rendered = parse5.parseFragment(output.html);
  const fromData = (map, id) => (Object.hasOwn(map, id) ? parse5.parseFragment(`<div>${map[id]}</div>`).childNodes[0] : null);
  const report = { classId, checks: [] };
  const check = (name, before, after) => {
    const all = diffLines(before, after);
    const changes = all.filter(change => !accepted.includes(change));
    report.checks.push({ name, ok: !changes.length, changes, accepted: all.length - changes.length });
  };

  check("創角資訊與特性表", creationSummary(legacy), creationSummary(rendered));

  const legacySections = sectionSummary(legacy);
  const renderedSections = sectionSummary(rendered);
  const sectionKey = section => `等級 ${section.level}｜${section.heading || "（補充段落）"}${section.restChange ? `｜rest=${section.restChange}` : ""}`;
  check("能力段落順序、等級、標題", legacySections.map(sectionKey), renderedSections.map(sectionKey));
  check("職業頁內文（隱藏跑團專用文字）", legacySections.flatMap(section => [`== ${sectionKey(section)}`, ...richText(section.node, node => has(node, "data-tabletop-only"))]),
    renderedSections.flatMap(section => [`== ${sectionKey(section)}`, ...richText(section.node, node => has(node, "data-tabletop-only"))]));

  const blocks = root => new Map(findAll(root, node => has(node, "data-action-id")).map(node => [attr(node, "data-action-id"), node]));
  const legacyBlocks = blocks(legacy);
  const renderedBlocks = blocks(rendered);
  const missing = [...legacyBlocks.keys()].filter(id => !renderedBlocks.has(id));
  check("舊版 data-action-id 全部存在", missing.map(id => `缺少 ${id}`), []);
  const ids = [...legacyBlocks.keys()].filter(id => renderedBlocks.has(id));
  check("跑團動作說明（每個 data-action-id）", ids.flatMap(id => [`== ${id}`, ...actionView(legacyBlocks.get(id)).split("\n")]),
    ids.flatMap(id => [`== ${id}`, ...actionView(fromData(output.tabletop, id) || renderedBlocks.get(id)).split("\n")]));
  check("跑團總覽一句話（每個 data-action-id）", ids.map(id => `${id}：${overviewView(legacyBlocks.get(id))}`),
    ids.map(id => `${id}：${overviewView(fromData(output.summaries, id) || fromData(output.tabletop, id) || renderedBlocks.get(id))}`));
  report.addedActionIds = [...renderedBlocks.keys()].filter(id => !legacyBlocks.has(id));
  report.strict = diffLines(canonicalLines(legacy), canonicalLines(rendered));
  return report;
}

function printReport(report) {
  console.log(`\n# ${report.classId}`);
  for (const item of report.checks) {
    console.log(`${item.ok ? "✔" : "✘"} ${item.name}${item.ok ? "" : `（${item.changes.length} 行不同）`}${item.accepted ? `（已核准差異 ${item.accepted} 行）` : ""}`);
    item.changes.slice(0, 40).forEach(change => console.log(`    ${change}`));
  }
  if (report.addedActionIds.length) console.log(`ℹ 新增的 data-action-id（舊版沒有，不影響讀取）：${report.addedActionIds.join("、")}`);
  console.log(`ℹ 嚴格 DOM 比對（忽略 style 與空白）：${report.strict.length} 行不同`);
}

if (require.main === module) {
  const legacy = loadLegacyClassFeatures();
  const { classes } = loadContent();
  // 使用者已核准、與舊版刻意不同的地方（逐行比對結果）；舊版 class-features.js 移除後此檔一併刪除。
  const acceptedDifferences = JSON.parse(fs.readFileSync(path.join(__dirname, "accepted-differences.json"), "utf8"));
  const ids = process.argv.slice(2).filter(arg => !arg.startsWith("--"));
  const strict = process.argv.includes("--strict");
  let failed = false;
  for (const classId of ids.length ? ids : [...classes.keys()]) {
    const report = compareClass(classId, legacy[classId], renderClass(classes.get(classId)), acceptedDifferences[classId] || []);
    printReport(report);
    if (strict) report.strict.forEach(change => console.log(`    ${change}`));
    failed ||= report.checks.some(item => !item.ok);
  }
  process.exitCode = failed ? 1 : 0;
}

module.exports = { compareClass };

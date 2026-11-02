// 網站讀取的種族資料：npm run build 由 content/srd/races 產生根目錄的 race-content.generated.js（衍生產物，不提交）。
// raceRules 是結構化規則（體型、速度、黑暗視覺、抗性、血統選項、法術、資源、跑團動作與提示），raceText 是建置組好的顯示文字。
// index.html 載入此檔的快取版本（?v=）是檔案內容的雜湊，只在上線建置（--stamp-version）時改寫。
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { ROOT, loadSpellCatalog, damageTypeLabel } = require("../content/site-sources");
const { ContentError } = require("../content/errors");
const { escapeHtml, renderInline, parseBlocks } = require("../content/markdown");
const { writeIfChanged, contentVersion, stampScriptVersion } = require("../content/output");
const { getRaceActions, optionHeading, optionLabel, optionPdfLabel, optionDraftValue } = require("./load");

const OUTPUT_NAME = "race-content.generated.js";
const OUTPUT_FILE = path.join(ROOT, OUTPUT_NAME);
const INDEX_FILE = path.join(ROOT, "index.html");

const inline = (text, where) => renderInline(text, { resolveValue: () => { throw new ContentError(`${where}：種族文字不可使用數值標記`); } }, where);
const plainText = html => html.replace(/<[^>]+>/g, "").replace(/&quot;/g, "\"").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

// 特質文字的區塊：只允許單行段落與單行清單項目（種族頁每行一段）。回傳 [{ type: "p", html } | { type: "ul", items: [html] }]。
function textBlocks(text, where) {
  return parseBlocks(text, where).map(block => {
    if (block.type === "p" && block.lines.length === 1) return { type: "p", html: inline(block.lines[0], where) };
    if (block.type === "ul" && block.items.every(item => item.length === 1)) return { type: "ul", items: block.items.map(([item]) => inline(item, where)) };
    throw new ContentError(`${where}：種族文字只能有單行段落與「- 」清單（不可有小節、表格、分隔線或「\\」換行）`);
  });
}

const blocksHtml = blocks => blocks.map(block => block.type === "p" ? `<p>${block.html}</p>` : `<ul class="class-rule-list">${block.items.map(item => `<li>${item}</li>`).join("")}</ul>`).join("");
// 跑團說明用的純文字：段落一行，清單項目以「  - 」開頭（與舊版從種族文字擷取的結果相同）。
const blocksPlain = blocks => blocks.map(block => block.type === "p" ? plainText(block.html) : block.items.map(item => `  - ${plainText(item)}`).join("\n")).join("\n");
// 舊版 race.js 的原始文字（過渡用）。
const blocksLegacy = blocks => blocks.map(block => block.type === "p" ? block.html : block.items.map(item => `  - ${item}`).join("\n")).join("\n");

function resolveSpells(spells) {
  const catalog = loadSpellCatalog();
  return (spells || []).map(entry => {
    const spell = catalog.getSpell(entry.spell);
    return { spellId: entry.spell, level: entry.level, ring: spell.level === 0 ? "cantrips" : spell.level, ...(entry.freeUses ? { freeUses: entry.freeUses } : {}) };
  });
}

const traitText = (race, trait) => trait.text || `你擁有 ${race.darkvision} 呎黑暗視覺。`;

function raceRules(race) {
  const traits = race.traits;
  const choice = race.choice;
  const options = choice?.options.map(option => ({
    value: option.value,
    name: option.name,
    heading: optionHeading(option),
    label: optionLabel(option),
    pdfLabel: optionPdfLabel(option),
    draftValue: optionDraftValue(option),
    ...(option.short ? { short: option.short } : {}),
    ...(option.subtitle ? { subtitle: option.subtitle } : {}),
    ...(option.damage ? { damage: option.damage } : {}),
    ...(option.resistance ? { resistance: option.resistance } : {}),
    ...(option.speed ? { speed: option.speed } : {}),
    ...(option.darkvision ? { darkvision: option.darkvision } : {}),
    spells: resolveSpells(option.spells),
    ...(option.cantripChoice ? { cantripChoice: { field: option.cantripChoice.field, spellList: option.cantripChoice.spellList, default: option.cantripChoice.default } } : {})
  }));
  const actions = getRaceActions(race).map(({ action, trait, option }) => ({
    id: action.id,
    key: action.key,
    mode: action.mode,
    label: action.label,
    level: action.level || trait?.level || 1,
    ...(option ? { choiceValue: option.value } : { trait: trait.id }),
    ...(action.className ? { className: action.className } : {}),
    ...(action.resource ? { resource: action.resource } : {}),
    ...(action.behavior ? { behavior: action.behavior } : {}),
    ...(action.proficiencyValue ? { proficiencyValue: true } : {}),
    ...(action.tabletopOnly ? { tabletopOnly: true } : {})
  }));
  const spells = traits.flatMap(trait => resolveSpells(trait.spells).map(spell => ({ ...spell, trait: trait.id })));
  const hpPerLevel = traits.reduce((sum, trait) => sum + (trait.hpPerLevel || 0), 0);
  const carryMultiplier = traits.find(trait => trait.carryMultiplier)?.carryMultiplier;
  return {
    name: race.name,
    source: race.source,
    creatureType: race.creatureType,
    sizes: race.sizes.map(size => size.size),
    speed: race.speed,
    ...(race.darkvision ? { darkvision: race.darkvision } : {}),
    resistances: traits.flatMap(trait => trait.resistances || []),
    spellcasting: Boolean(spells.length || options?.some(option => option.spells.length || option.cantripChoice)),
    ...(race.languageOptions ? { languageOptions: [...race.languageOptions] } : {}),
    ...(hpPerLevel ? { hpPerLevel } : {}),
    ...(carryMultiplier ? { carryMultiplier } : {}),
    ...(choice ? { choice: { id: choice.id, label: choice.label, quickBuildLabel: choice.quickBuildLabel || choice.label, draftField: choice.draftField, options } } : {}),
    spells,
    traits: traits.map(trait => ({
      id: trait.id,
      name: trait.name,
      level: trait.level || 1,
      ...(trait.hint ? { hint: { panels: [...trait.hint.panels] } } : {}),
      ...(trait.resource ? { resource: { ...trait.resource, label: trait.resource.label || trait.name } } : {}),
      ...(trait.skillChoice ? { skillChoice: Array.isArray(trait.skillChoice) ? [...trait.skillChoice] : trait.skillChoice } : {}),
      ...(trait.feat ? { feat: { ...trait.feat } } : {}),
      ...(trait.longRest ? { longRest: trait.longRest } : {}),
      ...(trait.flight ? { flight: true } : {})
    })),
    actions
  };
}

// marks 為 true 時，各血統選項的格子、欄與小節加上 data-race-choice-option（網站依所選血統隱藏其他選項）。
const mark = (option, marks) => marks ? ` data-race-choice-option="${escapeHtml(option.value)}"` : "";

const indent = (lines, depth) => lines.map(line => `${"  ".repeat(depth)}${line}`);

// 龍族血統這類「名稱＋傷害」的格子表。
function ancestryTable(race, marks) {
  const { display, options } = race.choice;
  const rows = [];
  for (let index = 0; index < options.length; index += display.columns) rows.push(options.slice(index, index + display.columns));
  return [
    `<table class="dragon-ancestry-table" aria-label="${escapeHtml(display.label)}">`,
    ...indent(["<tbody>", ...indent(rows.flatMap(row => ["<tr>", ...indent(row.map(option => `<td${mark(option, marks)}><span class="dragon-ancestry-name">${escapeHtml(option.name)}</span><span class="dragon-ancestry-damage">${escapeHtml(option.damage)}</span></td>`), 1), "</tr>"]), 1), "</tbody>"], 1),
    "</table>"
  ].join("\n");
}

// 依等級列出各血統能力的表：1 級格先列速度、黑暗視覺、抗性，再列當級取得的法術（粗體）與自選戲法。
function lineageTable(race, marks) {
  const { display, options } = race.choice;
  const catalog = loadSpellCatalog();
  const cell = (option, level) => {
    const parts = [];
    if (level === 1 && option.darkvision) parts.push(`黑暗視覺${option.darkvision}呎`);
    if (level === 1 && option.speed) parts.push(`速度${option.speed}呎`);
    if (level === 1 && option.resistance) parts.push(`${escapeHtml(damageTypeLabel(option.resistance))}傷害${inline("[[抗性]]", race.file)}`);
    (option.spells || []).filter(spell => spell.level === level).forEach(spell => parts.push(`<strong>${escapeHtml(catalog.getSpell(spell.spell).nameZh)}</strong>`));
    if (level === 1 && option.cantripChoice) {
      parts.push(`<strong>${escapeHtml(catalog.getSpell(option.cantripChoice.default).nameZh)}</strong>`);
      parts.push(`<span class="lineage-detail">${option.cantripChoice.detail.map(escapeHtml).join("<br>")}</span>`);
    }
    if (!parts.length) throw new ContentError(`${race.file}：選項「${option.value}」在 ${level} 級沒有可列入表格的內容`);
    return parts.join("<br>");
  };
  const levels = [...new Set([1, ...options.flatMap(option => (option.spells || []).map(spell => spell.level))])].sort((a, b) => a - b);
  return [
    `<table class="race-lineage-table" aria-label="${escapeHtml(display.label)}">`,
    ...indent([
      "<thead>", ...indent(["<tr>", ...indent(["<th scope=\"col\">等級</th>", ...options.map(option => `<th scope="col"${mark(option, marks)}>${escapeHtml(option.name)}</th>`)], 1), "</tr>"], 1), "</thead>",
      "<tbody>", ...indent(levels.flatMap(level => ["<tr>", ...indent([`<th scope="row">${level}</th>`, ...options.map(option => `<td${mark(option, marks)}>${cell(option, level)}</td>`)], 1), "</tr>"]), 1), "</tbody>"
    ], 1),
    "</table>"
  ].join("\n");
}

// 種族頁的段落：特質依序成為小節；choice 特質之後接表格（或每個血統選項一個小節）。
// 回傳 [{ heading, blocks, table, afterChoice }]，舊版原始文字與新版 HTML 都由此產生。
function raceSections(race, marks = false) {
  const sections = [];
  const display = race.choice?.display.type;
  race.traits.forEach(trait => {
    const where = `${race.file} 特質「${trait.name}」`;
    const section = { heading: trait.name, blocks: textBlocks(traitText(race, trait), where) };
    if (trait.choice && display === "ancestry-table") section.table = ancestryTable(race, marks);
    if (trait.choice && display === "lineage-table") section.table = lineageTable(race, marks);
    if (trait.afterChoice) section.afterChoice = textBlocks(trait.afterChoice, `${where} afterChoice`);
    sections.push(section);
    if (trait.choice && display === "sections") {
      race.choice.options.forEach(option => sections.push({ heading: optionHeading(option), option, blocks: textBlocks(option.text, `${race.file} 選項「${option.value}」`) }));
    }
  });
  return sections;
}

function raceIntro(race) {
  const sizes = race.sizes.map(size => `${size.size}（${size.height}）`).join("或");
  return {
    profile: [`生物類型：${race.creatureType}`, `體型：${sizes}`, `速度：${race.speed} 呎`].map(line => escapeHtml(line)),
    description: race.description.replace(/\n+$/, "").split(/\n\n/).map(paragraph => escapeHtml(paragraph)),
    optionDescriptions: (race.choice?.options || []).filter(option => option.description).map(option => ({ option, html: escapeHtml(`${option.short}：${option.description}`) })),
    traitIntro: escapeHtml(`作為${race.name}，你有以下特質。`)
  };
}

// 種族頁 HTML（#raceFeatures）。marks 為 true 時血統選項帶 data-race-choice-option；介紹中的血統說明包成 <span>，
// 連同其後的空行一起隱藏。
function raceHtml(race, { marks = false } = {}) {
  const { profile, description, optionDescriptions, traitIntro } = raceIntro(race);
  const tagline = marks
    ? [...description, ""].join("<br><br>") + optionDescriptions.map(({ option, html }) => `<span${mark(option, true)}>${html}<br><br></span>`).join("") + traitIntro
    : [...description, ...optionDescriptions.map(({ html }) => html), traitIntro].join("<br><br>");
  const sections = raceSections(race, marks).map(section => {
    const body = blocksHtml(section.blocks)
      + (section.table ? `<div class="race-feature-table-wrap">${section.table}</div>` : "")
      + (section.afterChoice ? blocksHtml(section.afterChoice) : "");
    return `<section class="class-feature-section"${section.option ? mark(section.option, marks) : ""}><h3>${escapeHtml(section.heading)}</h3>${body}</section>`;
  }).join("");
  return `${profile.map(line => `<div class="race-feature-line">${line}</div>`).join("")}<div class="class-feature-tagline">${tagline}</div><div class="class-feature-content">${sections}</div>`;
}

// 過渡用：舊版 race.js 的 raceFeatures 原始文字，供尚未改讀結構化資料的程式使用。
function raceLegacyText(race) {
  const { profile, description, optionDescriptions, traitIntro } = raceIntro(race);
  const tagline = [...description, ...optionDescriptions.map(({ html }) => html), traitIntro];
  const sections = raceSections(race).map(section => [
    `${escapeHtml(section.heading)}：${blocksLegacy(section.blocks)}`,
    ...(section.table ? [section.table] : []),
    ...(section.afterChoice ? [blocksLegacy(section.afterChoice)] : [])
  ].join("\n"));
  return `${[profile.join("\n"), ...tagline, ...sections].join("\n\n")}\n`;
}

function raceText(race) {
  const plain = (text, where) => blocksPlain(textBlocks(text, where));
  const traits = Object.fromEntries(race.traits.map(trait => [trait.id, plain(traitText(race, trait), race.file)]));
  const options = Object.fromEntries((race.choice?.options || []).filter(option => option.text).map(option => [option.value, plain(option.text, race.file)]));
  const actions = Object.fromEntries(getRaceActions(race).map(({ action, trait, option }) => [action.key, {
    text: action.tabletop || (action.behavior ? "" : option ? options[option.value] : traits[trait.id]),
    ...(action.tabletopSuffix ? { suffix: action.tabletopSuffix } : {})
  }]));
  const hints = Object.fromEntries(race.traits.filter(trait => trait.hint).map(trait => [trait.id, trait.hint.summary]));
  const pdfOptions = Object.fromEntries((race.choice?.options || []).filter(option => option.pdf).map(option => [option.value, option.pdf]));
  return {
    html: raceHtml(race, { marks: true }),
    traits,
    ...(Object.keys(options).length ? { options } : {}),
    actions,
    hints,
    pdf: { ...(race.pdf.choiceFallback ? { choiceFallback: race.pdf.choiceFallback } : {}), lines: race.pdf.lines, ...(Object.keys(pdfOptions).length ? { options: pdfOptions } : {}) }
  };
}

function renderRaceData(races) {
  const ids = [...races.keys()];
  const rules = Object.fromEntries(ids.map(id => [id, raceRules(races.get(id))]));
  const text = Object.fromEntries(ids.map(id => [id, raceText(races.get(id))]));
  const legacy = Object.fromEntries(ids.map(id => [id, raceLegacyText(races.get(id))]));
  const display = Object.fromEntries(ids.map(id => [id, raceHtml(races.get(id))]));
  const entries = map => ids.map(id => `  ${id}: ${JSON.stringify(map[id])}`).join(",\n");
  const source = `// ${OUTPUT_NAME}：由 npm run build 從 content/srd/races 的種族內容檔產生，請勿手動修改。
// raceRules：各種族的結構化規則（來源、體型、速度、黑暗視覺、抗性、血統選項與其法術、特質的資源與提示、跑團動作）。
// raceText：建置組好的顯示文字（html 為種族頁；traits／options 為特質與血統選項的跑團純文字；actions 為動作說明；hints 為跑團提示；pdf 為 PDF 種族特質欄）。
const raceRules = {
${entries(rules)}
};

const raceText = {
${entries(text)}
};

// 過渡用（之後移除）：舊版 race.js 的原始文字與種族頁 HTML。
const raceFeatures = {
${entries(legacy)}
};

const raceFeatureDisplay = {
${entries(display)}
};
`;
  // 確認產生的程式執行結果與資料相同。
  const context = {};
  vm.runInNewContext(`${source}\nthis.result = { raceRules, raceText, raceFeatures, raceFeatureDisplay };`, context);
  if (JSON.stringify(context.result) !== JSON.stringify({ raceRules: rules, raceText: text, raceFeatures: legacy, raceFeatureDisplay: display })) throw new ContentError(`${OUTPUT_NAME}：產生結果與資料不同`);
  return source;
}

// 寫入產生檔；stampIndex 為 true 時一併更新 index.html 的快取版本。內容沒變時不改檔案。回傳有變更的檔名。
function writeRaceData(races, { stampIndex = false } = {}) {
  const source = renderRaceData(races);
  const changed = [];
  const html = fs.readFileSync(INDEX_FILE, "utf8");
  const updated = stampScriptVersion(html, OUTPUT_NAME, contentVersion(source));
  writeIfChanged(OUTPUT_FILE, source, changed);
  if (stampIndex && updated !== html) {
    fs.writeFileSync(INDEX_FILE, updated);
    changed.push("index.html");
  }
  return changed;
}

module.exports = { renderRaceData, writeRaceData };

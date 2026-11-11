// 網站讀取的法術資料：npm run build 由 content/srd/spells 產生根目錄的兩個檔案（衍生產物，不提交）。
// - spell-content.generated.js：spellRules（全部法術的結構化規則；playable 為角色可用）、spellText（可用法術的網站版顯示文字）、
//   spellSrdFile（SRD 版產物的檔名與快取版本）。網站經 spell-list.js 的 SpellCatalog 讀取。
// - spell-srd.generated.js：spellSrdText（SRD 版的標頭與說明 HTML），法術詳情切到「SRD 版」時才載入；離線版內嵌。
// 英文原文（en 區塊）只供校對，不寫進任何產物。
// index.html 載入 spell-content.generated.js 的快取版本（?v=）是檔案內容的雜湊，只在上線建置（--stamp-version）時改寫。
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { ROOT } = require("../content/site-sources");
const { ContentError } = require("../content/errors");
const { writeIfChanged, contentVersion, stampScriptVersion } = require("../content/output");
const { renderSrdText } = require("./srd-text");

const OUTPUT_NAME = "spell-content.generated.js";
const SRD_OUTPUT_NAME = "spell-srd.generated.js";
const INDEX_FILE = path.join(ROOT, "index.html");
const CLASS_ORDER = ["bard", "cleric", "druid", "paladin", "ranger", "sorcerer", "warlock", "wizard"];
const SCHOOL_LABELS = Object.freeze({
  abjuration: "防護", conjuration: "咒法", divination: "預言", enchantment: "惑控",
  evocation: "塑能", illusion: "幻術", necromancy: "死靈", transmutation: "變化"
});
const TIME_LABELS = Object.freeze({ action: "動作", "bonus-action": "附贈動作", reaction: "反應動作" });
const RANGE_LABELS = Object.freeze({ self: "自身", touch: "觸及", sight: "視線內", unlimited: "無限", special: "特殊" });
const DURATION_LABELS = Object.freeze({
  instantaneous: "立即", "until-dispelled": "直到被解除", "until-dispelled-or-triggered": "直到被解除或觸發", special: "特殊"
});
const UNIT_LABELS = Object.freeze({ rounds: "輪", minutes: "分鐘", hours: "小時", days: "天", feet: "呎", miles: "英里" });

const amountText = value => Object.entries(value).filter(([key]) => key !== "upTo").map(([unit, amount]) => `${amount}${UNIT_LABELS[unit]}`).join("");
const timeText = time => typeof time === "string" ? TIME_LABELS[time] : amountText(time);
const castingTimeText = (spell, trigger) => [...spell.castingTime.map(timeText), ...(spell.ritual ? ["儀式"] : [])].join("或") + (trigger ? `，${trigger}` : "");
const rangeText = range => typeof range === "string" ? RANGE_LABELS[range] : amountText(range);
const durationText = spell => typeof spell.duration === "string" ? DURATION_LABELS[spell.duration]
  : `${spell.concentration ? "專注，最長" : spell.duration.upTo ? "最長" : ""}${amountText(spell.duration)}`;

// 標頭各行（[標籤, 內容]），網站版與 SRD 版共用；材料與觸發條件取自各自的區塊。
function headerLines(spell, block) {
  return [
    ["學派", SCHOOL_LABELS[spell.school]],
    ["施法時間", castingTimeText(spell, block.trigger)],
    ["射程", rangeText(spell.range)],
    ["成分", spell.components.join("、")],
    ...(block.material ? [["材料", block.material]] : []),
    ["持續時間", durationText(spell)]
  ];
}

const headerText = (spell, block) => headerLines(spell, block).map(([label, value]) => `${label}: ${value}`).join("\n");

// 德魯伊荒野夥伴施放獲得魔寵的版本：施法時間、成分與持續時間照能力規則，沒有材料；學派與射程同法術。
function wildCompanionText(spell, variant) {
  const lines = [
    ["學派", SCHOOL_LABELS[spell.school]],
    ["施法時間", variant.castingTime],
    ["射程", rangeText(spell.range)],
    ["成分", variant.components.join("、")],
    ["持續時間", variant.duration]
  ];
  return `${lines.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\n${variant.body}`;
}

// 結構化規則：網站以此判斷施法時間、儀式、專注、成分、升環與跑團施法結果，不從顯示文字反推。
function spellRules(spell) {
  return {
    name: spell.name,
    nameEn: spell.nameEn,
    source: spell.source,
    level: spell.level,
    school: spell.school,
    classes: CLASS_ORDER.filter(classId => spell.classes.includes(classId)),
    ...(spell.srd?.classes ? { srdClasses: CLASS_ORDER.filter(classId => spell.srd.classes.includes(classId)) } : {}),
    castingTime: spell.castingTime,
    ...(spell.ritual ? { ritual: true } : {}),
    range: spell.range,
    components: spell.components,
    duration: spell.duration,
    ...(spell.concentration ? { concentration: true } : {}),
    ...(spell.upcast ? { upcast: true } : {}),
    // 只有 SRD 版的法術：outcomes 只供從魔法物品施放（SpellCatalog.getItemSpell），沒有 playable，不是角色可用的法術。
    ...(spell.site ? { playable: true, outcomes: spell.site.outcomes || [] } : spell.srd?.outcomes ? { outcomes: spell.srd.outcomes } : {})
  };
}

// 網站版顯示文字：desc 是標頭加說明（法術詳情、搜尋）；tabletop 是跑團版說明（沒寫時網站用 desc）；
// wildCompanion 是荒野夥伴施放時的跑團說明（只有獲得魔寵）；
// header 是標頭各項的顯示字串（PDF、跑團與法術書讀取，不再解析 desc）。
function spellText(spell) {
  const site = spell.site;
  const header = Object.fromEntries(headerLines(spell, site).map(([label, value]) => [label, value]));
  return {
    desc: `${headerText(spell, site)}\n\n${site.body}`,
    ...(site.tabletop ? { tabletop: `${headerText(spell, site)}\n\n${site.tabletop}` } : {}),
    ...(site.wildCompanion ? { wildCompanion: wildCompanionText(spell, site.wildCompanion) } : {}),
    header: {
      school: header["學派"],
      castingTime: header["施法時間"],
      range: header["射程"],
      components: header["成分"],
      ...(site.material ? { material: site.material } : {}),
      duration: header["持續時間"]
    }
  };
}

const entries = (ids, map) => ids.map(id => `  ${JSON.stringify(id)}: ${JSON.stringify(map[id])}`).join(",\n");

function renderSrdData(spells) {
  const ids = [...spells.keys()].filter(id => spells.get(id).srd);
  const text = Object.fromEntries(ids.map(id => {
    const spell = spells.get(id);
    return [id, renderSrdText(headerLines(spell, spell.srd), spell.srd.body, spell.file)];
  }));
  const source = `// ${SRD_OUTPUT_NAME}：由 npm run build 從 content/srd/spells 的 srd 區塊產生，請勿手動修改。
// 法術詳情的「SRD 版」（SRD 5.2.1 繁中直譯，CC BY 4.0）：header 是標頭各行的 HTML，html 是說明。網頁版在第一次切到 SRD 版時才載入。
globalThis.spellSrdText = {
${entries(ids, text)}
};
`;
  const context = {};
  vm.runInNewContext(source, context);
  if (JSON.stringify(context.spellSrdText) !== JSON.stringify(text)) throw new ContentError(`${SRD_OUTPUT_NAME}：產生結果與資料不同`);
  return source;
}

function renderSpellData(spells, srdSource) {
  const ids = [...spells.keys()];
  const playableIds = ids.filter(id => spells.get(id).site);
  const rules = Object.fromEntries(ids.map(id => [id, spellRules(spells.get(id))]));
  const text = Object.fromEntries(playableIds.map(id => [id, spellText(spells.get(id))]));
  const srdFile = `${SRD_OUTPUT_NAME}?v=${contentVersion(srdSource)}`;
  const source = `// ${OUTPUT_NAME}：由 npm run build 從 content/srd/spells 的法術內容檔產生，請勿手動修改。
// spellRules：全部法術的結構化規則（依環階、spellId 排序）；playable 為角色可用的法術（有網站版），其餘只供查閱；
// srdClasses 是與網站法表（classes）不同的 SRD 職業清單，只用於查閱分類。
// spellText：可用法術的網站版顯示文字（desc 標頭＋說明、tabletop 跑團版說明、wildCompanion 荒野夥伴施放時的跑團說明、header 標頭各項）。
// spellSrdFile：SRD 版產物（spell-srd.generated.js）的網址與快取版本。
const spellRules = {
${entries(ids, rules)}
};

const spellText = {
${entries(playableIds, text)}
};

const spellSrdFile = ${JSON.stringify(srdFile)};
`;
  const context = {};
  vm.runInNewContext(`${source}\nthis.result = { spellRules, spellText, spellSrdFile };`, context);
  if (JSON.stringify(context.result) !== JSON.stringify({ spellRules: rules, spellText: text, spellSrdFile: srdFile })) throw new ContentError(`${OUTPUT_NAME}：產生結果與資料不同`);
  return source;
}

// 建置時其他內容（種族法術）讀取法術目錄用：產生檔的原始碼（不寫檔）。
function renderSpellSources(spells) {
  const srdSource = renderSrdData(spells);
  return { srdSource, source: renderSpellData(spells, srdSource) };
}

// 寫入產生檔；stampIndex 為 true 時一併更新 index.html 的快取版本。內容沒變時不改檔案。回傳有變更的檔名。
function writeSpellData(spells, { stampIndex = false } = {}) {
  const { source, srdSource } = renderSpellSources(spells);
  const changed = [];
  const html = fs.readFileSync(INDEX_FILE, "utf8");
  const updated = stampScriptVersion(html, OUTPUT_NAME, contentVersion(source));
  writeIfChanged(path.join(ROOT, OUTPUT_NAME), source, changed);
  writeIfChanged(path.join(ROOT, SRD_OUTPUT_NAME), srdSource, changed);
  if (stampIndex && updated !== html) {
    fs.writeFileSync(INDEX_FILE, updated);
    changed.push("index.html");
  }
  return changed;
}

module.exports = { renderSpellSources, writeSpellData, headerText };

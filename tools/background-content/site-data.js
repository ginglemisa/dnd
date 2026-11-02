// 網站讀取的背景資料：npm run build 由 content/srd/backgrounds 產生根目錄的 background-content.generated.js（衍生產物，不提交）。
// backgroundRules 是結構化規則（網站以此判斷屬性、專長、技能、工具與裝備），backgroundText 是建置組好的顯示文字。
// index.html 載入此檔的快取版本（?v=）是檔案內容的雜湊，只在上線建置（--stamp-version）時改寫。
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { ROOT, loadToolCatalog } = require("../content/site-sources");
const { ContentError } = require("../content/errors");
const { renderInline } = require("../content/markdown");
const { writeIfChanged, contentVersion, stampScriptVersion } = require("../content/output");

const OUTPUT_NAME = "background-content.generated.js";
const OUTPUT_FILE = path.join(ROOT, OUTPUT_NAME);
const INDEX_FILE = path.join(ROOT, "index.html");
const ABILITY_LABELS = Object.freeze({ str: "力量", dex: "敏捷", con: "體質", int: "智力", wis: "感知", cha: "魅力" });

function backgroundRules(background) {
  const feat = typeof background.feat === "string" ? { id: background.feat } : { ...background.feat };
  const tool = typeof background.tool === "string" ? { fixed: background.tool } : { chooseFrom: background.tool.chooseFrom };
  return {
    name: background.name,
    expansion: background.expansion === true,
    abilities: [...background.abilities],
    feat,
    skills: [...background.skills],
    tool,
    equipment: { A: { items: background.equipment.A.items.map(item => typeof item === "string" ? item : { toolChoice: true }), gold: background.equipment.A.gold }, B: { gold: background.equipment.B.gold } }
  };
}

const goldText = gold => `${gold} 金幣`;
const inline = (text, where) => renderInline(text, { resolveValue: () => { throw new ContentError(`${where}：背景文字不可使用數值標記`); } }, where);

function backgroundText(background, rules, classes) {
  const where = background.file;
  const group = rules.tool.chooseFrom ? loadToolCatalog().groups.find(item => item.id === rules.tool.chooseFrom) : null;
  const items = rules.equipment.A.items.map(item => typeof item === "string" ? item : `${group.label}擇一`);
  return {
    abilities: rules.abilities.map(id => ABILITY_LABELS[id]).join(","),
    feat: rules.feat.spellList ? `${rules.feat.id}（${classes.get(rules.feat.spellList).name}）` : rules.feat.id,
    skills: rules.skills.map(skill => inline(`[[${skill}]]`, where)).join(","),
    tool: group ? `擇一${group.label}：${group.options.join(",")}` : rules.tool.fixed,
    equipmentA: [...items, ...(rules.equipment.A.gold ? [goldText(rules.equipment.A.gold)] : [])].join("、"),
    equipmentB: goldText(rules.equipment.B.gold),
    description: inline(background.description.replace(/\n+$/, ""), `${where} description`)
  };
}

// 過渡期：舊的 backgrounds.js 格式（中文 key），網站讀取端改用 backgroundRules／backgroundText 後移除。
function legacyEntry(rules, text) {
  return {
    名稱: rules.name,
    ...(rules.expansion ? { 擴充: true } : {}),
    屬性: text.abilities,
    專長: text.feat,
    技能熟練: text.skills,
    工具熟練: text.tool,
    裝備: "A、B 二擇一",
    裝備A: text.equipmentA,
    裝備B: text.equipmentB,
    描述: text.description
  };
}

function renderBackgroundData(backgrounds, classes) {
  const ids = [...backgrounds.keys()];
  const rules = Object.fromEntries(ids.map(id => [id, backgroundRules(backgrounds.get(id))]));
  const text = Object.fromEntries(ids.map(id => [id, backgroundText(backgrounds.get(id), rules[id], classes)]));
  const legacy = Object.fromEntries(ids.map(id => [id, legacyEntry(rules[id], text[id])]));
  const entries = map => ids.map(id => `  ${id}: ${JSON.stringify(map[id])}`).join(",\n");
  const source = `// ${OUTPUT_NAME}：由 npm run build 從 content/srd/backgrounds 的背景內容檔產生，請勿手動修改。
// backgroundRules：各背景的結構化規則（屬性 ID、專長 ID 與魔法學徒法術列表、技能 ID、工具或工具組、裝備項目與金幣）。
// backgroundText：建置組好的顯示文字（技能含提示框 HTML）。
const backgroundRules = {
${entries(rules)}
};

const backgroundText = {
${entries(text)}
};

// 過渡期的舊格式（原 backgrounds.js），網站讀取端改用上面兩者後移除。
const detailedBackgroundFeatures = {
${entries(legacy)}
};
`;
  // 確認產生的程式執行結果與資料相同。
  const context = {};
  vm.runInNewContext(`${source}\nthis.result = { backgroundRules, backgroundText, detailedBackgroundFeatures };`, context);
  if (JSON.stringify(context.result) !== JSON.stringify({ backgroundRules: rules, backgroundText: text, detailedBackgroundFeatures: legacy })) throw new ContentError(`${OUTPUT_NAME}：產生結果與資料不同`);
  return source;
}

// 寫入產生檔；stampIndex 為 true 時一併更新 index.html 的快取版本。內容沒變時不改檔案。回傳有變更的檔名。
function writeBackgroundData(backgrounds, classes, { stampIndex = false } = {}) {
  const source = renderBackgroundData(backgrounds, classes);
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

module.exports = { renderBackgroundData, writeBackgroundData };

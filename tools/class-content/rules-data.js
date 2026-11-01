// 網站讀取的職業機制資料（class-content.generated.js 的 classRules）：內容檔去掉說明文字後的結構化資料，
// 由 character-rules.js 等網站程式計算資源次數、法術位、特性表數值、跑團數值、選項與動作。
"use strict";
const { renderInline, tableValueText } = require("./markdown");
const { orderedSubclasses } = require("./render");

const ABILITY_CODES = Object.freeze({ 力量: "str", 敏捷: "dex", 體質: "con", 智力: "int", 感知: "wis", 魅力: "cha" });
// 只供職業頁與跑團說明使用的文字欄位：機制資料不含這些欄位。
const TEXT_FIELDS = new Set(["text", "tabletop", "summary", "afterFeatChoice", "collapsible", "tables"]);

function stripText(value) {
  if (Array.isArray(value)) return value.map(stripText);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !TEXT_FIELDS.has(key))
    .map(([key, item]) => [key, stripText(item)]));
}

// 選項的 text 是勾選框說明，網站程式不需要；select 只保留 ID 與選項（值、名稱）。
function featureRules(feature) {
  const rules = stripText(feature);
  if (rules.options) rules.options = rules.options.map(option => stripText(option));
  if (rules.select) rules.select = { id: feature.select.id, choices: feature.select.choices };
  return rules;
}

// 創角資訊欄位的純文字（PDF 用）：行尾「\」換行改為「,」，提示框與粗體只留文字。
function profileText(text, where) {
  return text.split("\\\n").map(line => renderInline(line, {}, where)).join(",").replace(/<[^>]+>/g, "");
}

// 只有文字的等級補充說明（沒有 name）沒有機制，不輸出。
function namedFeatures(features) {
  return features.filter(feature => feature.name).map(featureRules);
}

// fromTable 在建置時由表格組成文字，網站收到的是與 byLevel 相同的 1 級起文字。
function siteValues(classDef) {
  const features = [classDef, ...classDef.subclasses].flatMap(owner => owner.features);
  return Object.fromEntries(Object.entries(classDef.values || {}).map(([name, value]) => [name, value.fromTable
    ? { byLevel: { 1: tableValueText(features, value.fromTable, `${classDef.file} values.${name}`) } }
    : value]));
}

// appendixHtml：render.js 依附錄、小節順序產生的小節內文 HTML（選擇卡片與跑團說明使用）。
function classRules(classDef, appendixHtml = []) {
  return {
    id: classDef.id,
    name: classDef.name,
    maxLevel: classDef.maxLevel,
    subclassLevel: classDef.subclassLevel,
    defaultSubclass: classDef.defaultSubclass,
    hitDie: classDef.hitDie,
    saves: classDef.saves.map(name => ABILITY_CODES[name]),
    spellcasting: classDef.spellcasting.progression,
    profile: {
      weapons: profileText(classDef.weapons, `${classDef.file} weapons`),
      armor: profileText(classDef.armor, `${classDef.file} armor`),
      equipment: profileText(classDef.equipment.A, `${classDef.file} equipment.A`)
    },
    progression: classDef.progression || {},
    values: siteValues(classDef),
    features: namedFeatures(classDef.features),
    // 子職（預設子職在前）：網站的子職選單依此順序。
    subclasses: orderedSubclasses(classDef).map(subclass => ({
      id: subclass.id,
      name: subclass.name,
      shortName: subclass.shortName,
      features: namedFeatures(subclass.features)
    })),
    appendix: (classDef.appendix || []).map((item, index) => ({
      name: item.name,
      ...(item.kind ? { kind: item.kind } : {}),
      parts: (item.parts || []).map((part, partIndex) => ({ ...stripText(part), html: appendixHtml[index]?.[partIndex] ?? "" }))
    }))
  };
}

module.exports = { classRules, ABILITY_CODES };

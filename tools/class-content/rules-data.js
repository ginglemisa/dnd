// 網站讀取的職業機制資料（class-content.generated.js 的 classRules）：內容檔去掉說明文字後的結構化資料，
// 由 character-rules.js 等網站程式計算資源次數、法術位、特性表數值、跑團數值、選項與動作。
"use strict";

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

// 選項的 text 是勾選框說明，網站程式不需要；select 只保留 ID 與選項值。
function featureRules(feature) {
  const rules = stripText(feature);
  if (rules.options) rules.options = rules.options.map(option => stripText(option));
  if (rules.select) rules.select = { id: feature.select.id, values: feature.select.choices.map(choice => choice.value) };
  return rules;
}

// 只有文字的等級補充說明（沒有 name）沒有機制，不輸出。
function namedFeatures(features) {
  return features.filter(feature => feature.name).map(featureRules);
}

function classRules(classDef) {
  return {
    id: classDef.id,
    name: classDef.name,
    maxLevel: classDef.maxLevel,
    subclassLevel: classDef.subclassLevel,
    defaultSubclass: classDef.defaultSubclass,
    hitDie: classDef.hitDie,
    saves: classDef.saves.map(name => ABILITY_CODES[name]),
    spellcasting: classDef.spellcasting.progression,
    progression: classDef.progression || {},
    values: classDef.values || {},
    features: namedFeatures(classDef.features),
    subclasses: classDef.subclasses.map(subclass => ({
      id: subclass.id,
      name: subclass.name,
      shortName: subclass.shortName,
      features: namedFeatures(subclass.features)
    })),
    appendix: (classDef.appendix || []).map(item => ({
      name: item.name,
      parts: (item.parts || []).map(part => stripText(part))
    }))
  };
}

module.exports = { classRules, ABILITY_CODES };

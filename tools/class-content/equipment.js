// 職業起始裝備：把 YAML 的 equipment 整理成網站規則資料（classRules.equipment），並產生職業頁（A）列的顯示文字。
"use strict";
const { escapeHtml } = require("../content/markdown");
const { loadPackNames } = require("../content/site-sources");

// 只有一種組合時 id 為 default（快速創角草稿沿用的選擇值）。
function equipmentOptions(classDef) {
  const { A } = classDef.equipment;
  return A.options
    ? A.options.map(option => ({ id: option.id, label: option.label, items: option.items, gold: option.gold }))
    : [{ id: "default", label: "", items: A.items, gold: A.gold }];
}

// classRules.equipment：A 是各組合（items 照 YAML：字串、{ name, weight } 或 { choose, tools | from }），B 是金幣。
function equipmentRules(classDef) {
  return { A: equipmentOptions(classDef), B: { gold: classDef.equipment.B.gold } };
}

const goldText = gold => `${gold} 金幣`;
const itemName = item => typeof item === "string" ? item : item.name ?? item.choose;

// 套組名稱加上提示框（內容物取自 equipment-data.js，網站點擊時才組文字）。
function itemHtml(item) {
  const name = itemName(item);
  const base = name.replace(/\s*×\s*\d+$/u, "");
  return typeof item === "string" && loadPackNames().has(base)
    ? `<span class="skill-tip" data-skill="${escapeHtml(base)}">${escapeHtml(base)}</span>${escapeHtml(name.slice(base.length))}`
    : escapeHtml(name);
}

function setHtml(option) {
  const parts = [...option.items.map(itemHtml), ...(option.gold ? [goldText(option.gold)] : [])];
  return `${option.label ? `${escapeHtml(option.label)}：` : ""}${parts.join("、")}`;
}

function equipmentHtml(classDef) {
  return { A: equipmentOptions(classDef).map(setHtml).join("<br>"), B: goldText(classDef.equipment.B.gold) };
}

module.exports = { equipmentRules, equipmentHtml };

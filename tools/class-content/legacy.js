// 讀取既有網站資料（舊版 classFeatures、提示框詞表、跑團動作定義），供轉換、建置檢查與比對使用。
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "../..");
const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");

function loadLegacyClassFeatures(file = path.join(ROOT, "class-features.js")) {
  const skillTipSource = read("monster.js").match(/function skillTip\(skillName\) \{[\s\S]*?\r?\n\}/)[0];
  const context = { globalThis: {} };
  vm.createContext(context);
  vm.runInContext(`${skillTipSource}\n${read("druid-wild-shape-beasts.js")}\n${fs.readFileSync(file, "utf8")}\nglobalThis.__classFeatures = classFeatures;`, context);
  return context.globalThis.__classFeatures;
}

// [[名稱]] 的查表來源：技能／規則用 monster.js 的 skills_example_uses（含別名），狀態用 condition.js 的 CONDITIONS，
// 野獸／怪物用 monster.js 的 BEAST_STATS（中文名取 name「小魔鬼 (Imp) CR:1」括號前的部分）。
let tipTables = null;
function loadTipTables() {
  if (tipTables) return tipTables;
  const monster = read("monster.js");
  const pick = name => monster.match(new RegExp(String.raw`const ${name} = (\{[\s\S]*?\r?\n\});`))[1];
  const skills = vm.runInNewContext(`(${pick("skills_example_uses")})`);
  const aliases = vm.runInNewContext(`(${pick("SKILL_NAME_ALIASES")})`);
  const conditions = new Map();
  const conditionSource = read("condition.js");
  const conditionBlock = conditionSource.slice(conditionSource.indexOf("const CONDITIONS = "), conditionSource.indexOf("const HAZARDS = "));
  for (const match of conditionBlock.matchAll(/key: "([a-z_-]+)",\s*zh: "([^"]+)"/g)) conditions.set(match[2], match[1]);
  const beasts = new Map();
  for (const [key, beast] of Object.entries(vm.runInNewContext(`(${pick("BEAST_STATS")})`))) {
    const name = beast.name.split(" (")[0];
    if (beasts.has(name)) throw new Error(`monster.js BEAST_STATS 的中文名「${name}」重複`);
    beasts.set(name, key);
  }
  tipTables = { skills: new Set([...Object.keys(skills), ...Object.keys(aliases)]), conditions, beasts };
  return tipTables;
}

// action-panel.js 的 CLASS_ACTION_RULES（僅轉換器使用；第 2 步改由內容檔提供後移除）。
// 回傳 { rules, labelAt }：函式型 label 依角色等級變化，以 labelAt(rule, 等級) 取得指定等級的文字。
function loadLegacyClassActionRules() {
  const source = read("action-panel.js");
  const start = source.indexOf("const CLASS_ACTION_RULES = Object.freeze({");
  const end = source.indexOf("const RACE_ACTION_RULES", start);
  const block = source.slice(start, end).replace("const CLASS_ACTION_RULES =", "globalThis.__rules =");
  const context = { globalThis: {}, level: 1 };
  context.getCharacterLevel = () => context.level;
  vm.createContext(context);
  vm.runInContext(block, context);
  const labelAt = (rule, level) => {
    if (typeof rule.label !== "function") return rule.label;
    context.level = level;
    return rule.label();
  };
  return { rules: context.globalThis.__rules, labelAt };
}

// 網站程式中的字串常數（例如 class-features-ui.js 的攻擊備註），轉換時照抄。
function loadLegacyConstant(file, name) {
  const match = read(file).match(new RegExp(String.raw`const ${name} = "([^"\\]*)";`));
  if (!match) throw new Error(`${file} 找不到字串常數 ${name}`);
  return match[1];
}

// 網站程式中的陣列常數（例如 druid-wild-shape-beasts.js 的 DRUID_WILD_SHAPE_BEASTS），供 behavior 照舊產生 HTML；只讀不複製。
function loadLegacyArray(file, name) {
  const match = read(file).match(new RegExp(String.raw`const ${name} = (\[[\s\S]*?\]);`));
  if (!match) throw new Error(`${file} 找不到陣列常數 ${name}`);
  return vm.runInNewContext(`(${match[1]})`);
}

module.exports = { ROOT, loadLegacyClassFeatures, loadTipTables, loadLegacyClassActionRules, loadLegacyConstant, loadLegacyArray };

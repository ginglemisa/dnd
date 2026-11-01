// 建置讀取的既有網站資料：專案根目錄、提示框詞表（[[名稱]]）與野獸清單等陣列常數。
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "../..");
const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");
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

// 網站程式中的陣列常數（例如 druid-wild-shape-beasts.js 的 DRUID_WILD_SHAPE_BEASTS），供 behavior 照舊產生 HTML；只讀不複製。
function loadLegacyArray(file, name) {
  const match = read(file).match(new RegExp(String.raw`const ${name} = (\[[\s\S]*?\]);`));
  if (!match) throw new Error(`${file} 找不到陣列常數 ${name}`);
  return vm.runInNewContext(`(${match[1]})`);
}

module.exports = { ROOT, loadTipTables, loadLegacyArray };

// 建置讀取的既有網站資料：專案根目錄、提示框詞表（[[名稱]]）與德魯伊野獸清單。
// 網站資料檔照網站載入方式整份執行（獨立的 vm 沙箱，沒有 document），再讀取頂層常數或檔案公開的全域；不截取原始碼。
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "../..");

// 執行網站資料檔，回傳 names 列出的頂層常數，以及檔案指派到全域的值（globals）。
function runSiteScript(file, names = []) {
  const globals = {};
  const values = vm.runInNewContext(`${fs.readFileSync(path.join(ROOT, file), "utf8")}\n;({ ${names.join(", ")} });`, globals, { filename: file });
  return { ...values, globals };
}

let monsterData = null;
function loadMonsterData() {
  monsterData ||= runSiteScript("monster.js", ["skills_example_uses", "SKILL_NAME_ALIASES", "BEAST_STATS"]);
  return monsterData;
}

// [[名稱]] 的查表來源：技能／規則用 monster.js 的 skills_example_uses（含別名），狀態用 condition.js 公開的 DND_CONDITIONS，
// 野獸／怪物用 monster.js 的 BEAST_STATS（中文名取 name「小魔鬼 (Imp) CR:1」括號前的部分）。
let tipTables = null;
function loadTipTables() {
  if (tipTables) return tipTables;
  const { skills_example_uses: skills, SKILL_NAME_ALIASES: aliases, BEAST_STATS: beastStats } = loadMonsterData();
  const conditions = new Map(runSiteScript("condition.js").globals.DND_CONDITIONS.map(condition => [condition.zh, condition.key]));
  const beasts = new Map();
  for (const [key, beast] of Object.entries(beastStats)) {
    const name = beast.name.split(" (")[0];
    if (beasts.has(name)) throw new Error(`monster.js BEAST_STATS 的中文名「${name}」重複`);
    beasts.set(name, key);
  }
  tipTables = { skills: new Set([...Object.keys(skills), ...Object.keys(aliases)]), conditions, beasts };
  return tipTables;
}

// druid-wild-shape-beasts.js 的野獸清單與 CR 順序（職業頁「查看其他動物」）；只讀不複製。
// 每個 key 都須存在於 monster.js 的 BEAST_STATS（網站依此顯示野獸提示框），否則建置失敗。
function loadWildShapeBeasts() {
  const { DRUID_WILD_SHAPE_BEASTS: beasts, DRUID_WILD_SHAPE_CR_ORDER: crOrder } = runSiteScript("druid-wild-shape-beasts.js", ["DRUID_WILD_SHAPE_BEASTS", "DRUID_WILD_SHAPE_CR_ORDER"]);
  const { BEAST_STATS: beastStats } = loadMonsterData();
  const missing = beasts.map(beast => beast.key).filter(key => !Object.hasOwn(beastStats, key));
  if (missing.length) throw new Error(`druid-wild-shape-beasts.js 的野獸 key 不在 monster.js 的 BEAST_STATS：${missing.join("、")}`);
  return { beasts, crOrder };
}

module.exports = { ROOT, loadTipTables, loadWildShapeBeasts };

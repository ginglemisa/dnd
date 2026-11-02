// 建置讀取的既有網站資料：專案根目錄、提示框詞表（[[名稱]]）、德魯伊野獸清單，以及背景檢查用的技能、工具、專長與 index.html 選單。
// 網站資料檔照網站載入方式整份執行（獨立的 vm 沙箱，沒有 document），再讀取頂層常數或檔案公開的全域；不截取原始碼。
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "../..");

// 執行網站資料檔，回傳 names 列出的頂層常數，以及檔案指派到全域的值（globals）。
// 以 IIFE 掛在 window 上的檔案（例如 character-rules.js）讓 window 指向沙箱本身。
function runSiteScript(file, names = []) {
  const globals = {};
  globals.window = globals;
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

// 技能 ID（character-rules.js 的 CharacterSkillAbilities：中文名 → 屬性）。
let skillAbilities = null;
function loadSkillAbilities() {
  skillAbilities ||= runSiteScript("character-rules.js").globals.CharacterSkillAbilities;
  return skillAbilities;
}

// 工具目錄（tool-data.js 的 ToolProficiencyCatalog：工具名稱與工具組）。
let toolCatalog = null;
function loadToolCatalog() {
  toolCatalog ||= runSiteScript("tool-data.js").globals.ToolProficiencyCatalog;
  return toolCatalog;
}

// 專長清單與取得規則（feats.js 的 FEAT_OPTIONS、FEAT_RULES）。
let featData = null;
function loadFeatData() {
  featData ||= runSiteScript("feats.js", ["FEAT_OPTIONS", "FEAT_RULES"]);
  return featData;
}

// index.html 中 <select id="…"> 的選項（value 與顯示文字）；找不到選單時回傳 null。
// 每次重讀（npm run dev 在同一個程序中重複建置）。
function readIndexSelectOptions(id) {
  const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const start = indexHtml.indexOf(`<select id="${id}"`);
  const select = start < 0 ? null : indexHtml.slice(start).match(/^[^>]*>([\s\S]*?)<\/select>/);
  return select ? [...select[1].matchAll(/<option value="([^"]*)"[^>]*>([^<]*)<\/option>/g)].map(match => ({ value: match[1], label: match[2] })) : null;
}

module.exports = { ROOT, loadTipTables, loadWildShapeBeasts, loadSkillAbilities, loadToolCatalog, loadFeatData, readIndexSelectOptions };

// 建置讀取的既有網站資料：專案根目錄、提示框詞表（[[名稱]]，野獸名取自建置中的怪物內容）、德魯伊野獸清單，以及背景檢查用的技能、內容來源標籤、工具與 index.html 選單。
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

// rule-tips.js 的浮層只在有 document 時建立，沙箱內只會執行到詞表與函式宣告。
let ruleTipData = null;
function loadRuleTipData() {
  ruleTipData ||= runSiteScript("rule-tips.js", ["skills_example_uses", "SKILL_NAME_ALIASES"]);
  return ruleTipData;
}

// 怪物內容（content/srd/monsters）：建置先載入怪物內容檔，再以 useMonsterContent 指定（key → 中文名），不讀舊的產生檔。
let monsterNames = null;
function useMonsterContent(monsters) {
  monsterNames = new Map([...monsters.values()].map(monster => [monster.id, monster.name]));
  tipTables = null;
}
function loadMonsterNames() {
  if (!monsterNames) throw new Error("怪物內容尚未載入：先載入怪物內容檔（useMonsterContent）");
  return monsterNames;
}

// [[名稱]] 的查表來源：技能／規則用 rule-tips.js 的 skills_example_uses（含別名），狀態用 condition.js 公開的 DND_CONDITIONS，
// 野獸／怪物用怪物內容檔的中文名（name）。
let tipTables = null;
function loadTipTables() {
  if (tipTables) return tipTables;
  const { skills_example_uses: skills, SKILL_NAME_ALIASES: aliases } = loadRuleTipData();
  const conditions = new Map(runSiteScript("condition.js").globals.DND_CONDITIONS.map(condition => [condition.zh, condition.key]));
  const beasts = new Map();
  for (const [key, name] of loadMonsterNames()) {
    if (beasts.has(name)) throw new Error(`怪物內容檔的中文名「${name}」重複`);
    beasts.set(name, key);
  }
  tipTables = { skills: new Set([...Object.keys(skills), ...Object.keys(aliases)]), conditions, beasts };
  return tipTables;
}

// druid-wild-shape-beasts.js 的野獸清單與 CR 順序（職業頁「查看其他動物」）；只讀不複製。
// 每個 key 都須是怪物內容檔（content/srd/monsters）的 key（網站依此顯示野獸提示框），否則建置失敗。
function loadWildShapeBeasts() {
  const { DRUID_WILD_SHAPE_BEASTS: beasts, DRUID_WILD_SHAPE_CR_ORDER: crOrder } = runSiteScript("druid-wild-shape-beasts.js", ["DRUID_WILD_SHAPE_BEASTS", "DRUID_WILD_SHAPE_CR_ORDER"]);
  const names = loadMonsterNames();
  const missing = beasts.map(beast => beast.key).filter(key => !names.has(key));
  if (missing.length) throw new Error(`druid-wild-shape-beasts.js 的野獸 key 不在怪物內容檔：${missing.join("、")}`);
  return { beasts, crOrder };
}

// character-rules.js 公開的全域（沙箱內沒有其他網站資料，只用不依賴產生檔的部分）。
let characterRules = null;
function loadCharacterRules() {
  characterRules ||= runSiteScript("character-rules.js").globals;
  return characterRules;
}

// 狀態的顯示名稱（condition.js 的 DND_CONDITIONS：key → 中文名，例如 poisoned →「中毒」）。
let conditionLabels = null;
function loadConditionLabels() {
  conditionLabels ||= Object.fromEntries(runSiteScript("condition.js").globals.DND_CONDITIONS.map(condition => [condition.key, condition.zh]));
  return conditionLabels;
}

// 技能 ID（character-rules.js 的 CharacterSkillAbilities：中文名 → 屬性）。
const loadSkillAbilities = () => loadCharacterRules().CharacterSkillAbilities;

// 內容來源的顯示標籤與說明（character-rules.js 的 getContentSourceLabel、getContentSourceNotice，例如 extended →「擴充」），
// 以及加上標籤的名稱（formatContentSourceName，例如「耕者(擴充)」）。
const contentSourceLabel = source => loadCharacterRules().getContentSourceLabel(source);
const contentSourceName = (name, source, tags) => loadCharacterRules().formatContentSourceName(name, source, tags);
const contentSourceNotice = source => loadCharacterRules().getContentSourceNotice(source);

// 傷害類型的顯示名稱（character-rules.js 的 getDamageTypeLabel，例如 poison →「毒素」）。
const damageTypeLabel = id => loadCharacterRules().getDamageTypeLabel(id);

// 專長類別的顯示名稱（character-rules.js 的 getFeatTypeLabel，例如 origin →「起源」／「起源專長」）。
const featTypeLabel = type => loadCharacterRules().getFeatTypeLabel(type);

// 法術目錄（spell-list.js 的 SpellCatalog）：種族法術的 ID、環階與中文名。
// 資料來自建置中的法術內容檔：建置先以 useSpellContent 指定 spell-content.generated.js 的原始碼（不必先寫檔）。
let spellContentSource = null;
let spellCatalog = null;
function useSpellContent(source) {
  spellContentSource = source;
  spellCatalog = null;
}
function loadSpellCatalog() {
  if (spellContentSource === null) throw new Error("法術目錄尚未建置：先載入法術內容檔（useSpellContent）");
  if (!spellCatalog) {
    const globals = {};
    vm.runInNewContext(`${spellContentSource}\n${fs.readFileSync(path.join(ROOT, "spell-list.js"), "utf8")}`, globals, { filename: "spell-list.js" });
    spellCatalog = globals.SpellCatalog;
  }
  return spellCatalog;
}

// 套組名稱（equipment-data.js 的 EQUIPMENT_PACK_CONTENTS）：職業起始裝備的套組加上內容物提示框。
let packNames = null;
function loadPackNames() {
  packNames ||= new Set(Object.keys(runSiteScript("equipment-data.js").globals.EQUIPMENT_PACK_CONTENTS));
  return packNames;
}

// 工具目錄（tool-data.js 的 ToolProficiencyCatalog：工具名稱與工具組）。
let toolCatalog = null;
function loadToolCatalog() {
  toolCatalog ||= runSiteScript("tool-data.js").globals.ToolProficiencyCatalog;
  return toolCatalog;
}

// index.html 中 <select id="…"> 的選項（value 與顯示文字）；找不到選單時回傳 null。
// 每次重讀（npm run dev 在同一個程序中重複建置）。
function readIndexSelectOptions(id) {
  const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const start = indexHtml.indexOf(`<select id="${id}"`);
  const select = start < 0 ? null : indexHtml.slice(start).match(/^[^>]*>([\s\S]*?)<\/select>/);
  return select ? [...select[1].matchAll(/<option value="([^"]*)"[^>]*>([^<]*)<\/option>/g)].map(match => ({ value: match[1], label: match[2] })) : null;
}

module.exports = { ROOT, useMonsterContent, loadTipTables, loadWildShapeBeasts, loadSkillAbilities, loadConditionLabels, contentSourceLabel, contentSourceName, contentSourceNotice, damageTypeLabel, featTypeLabel, useSpellContent, loadSpellCatalog, loadToolCatalog, loadPackNames, readIndexSelectOptions };

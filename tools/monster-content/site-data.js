// 網站讀取的怪物資料：npm run build 由 content/srd/monsters 產生根目錄的兩個檔案（衍生產物，不提交）。
// - monster-content.generated.js：monsterRules（結構化數值）、monsterText（網站版：資料卡文字 statBlock、用途短說明、特性與動作說明）、
//   monsterLabels（跑團顯示用的傷害類型、速度、屬性等名稱）、monsterSrdFile（SRD 版產物的檔名與快取版本）。網站經 monster.js 的 BeastCatalog 讀取。
// - monster-srd.generated.js：monsterSrdText（SRD 版資料卡的 HTML），野獸資料卡切到「SRD 版」時才載入；離線版內嵌。
// 英文原文（en 區塊）只供校對，不寫進任何產物。
// index.html 載入 monster-content.generated.js 的快取版本（?v=）是檔案內容的雜湊，只在上線建置（--stamp-version）時改寫。
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { ROOT, loadSpellCatalog, loadConditionLabels } = require("../content/site-sources");
const { ContentError } = require("../content/errors");
const { writeIfChanged, contentVersion, stampScriptVersion } = require("../content/output");
const { inline, body, escapeHtml } = require("../spell-content/srd-text");
const { SPEED_LABELS, ABILITY_LABELS, CONDITIONAL_LABELS, TIMING_LABELS, averageOf, fillActionText, statBlock, srdHtml } = require("./format");

const OUTPUT_NAME = "monster-content.generated.js";
const SRD_OUTPUT_NAME = "monster-srd.generated.js";
const INDEX_FILE = path.join(ROOT, "index.html");

const labelsFor = () => ({ damage: loadSpellCatalog().damageTypeLabels, conditions: loadConditionLabels() });

// 結構化數值：去掉文字區塊，傷害加上平均值（跑團固定值）。
function monsterRules(monster) {
  const { id, file, site, srd, en, ...rules } = monster;
  const withAverage = damage => damage.map(item => item.dice ? { ...item, average: averageOf(item.dice) } : item);
  return {
    ...rules,
    actions: monster.actions.map(action => ({
      ...action,
      ...(action.damage ? { damage: withAverage(action.damage) } : {}),
      ...(action.conditional ? { conditional: withAverage(action.conditional) } : {})
    }))
  };
}

// 網站版文字：statBlock 是資料卡的各行（renderBeastPopupHtml、跑團讀取），traits 與 actions 是各自分開的說明（已代入數值）。
function monsterText(monster, labels) {
  const site = monster.site;
  return {
    statBlock: statBlock(monster, labels),
    ...(site.summary ? { summary: site.summary } : {}),
    traits: site.traits || [],
    actions: Object.fromEntries(monster.actions.map(action => {
      const text = fillActionText(action, site.actions[action.id].text, labels);
      return [action.id, { name: site.actions[action.id].name, ...(text ? { text } : {}) }];
    })),
    ...(site.languages ? { languages: site.languages } : {}),
    ...(site.gear ? { gear: site.gear } : {})
  };
}

const entries = (ids, map) => ids.map(id => `  ${JSON.stringify(id)}: ${JSON.stringify(map[id])}`).join(",\n");

function renderSrdData(monsters, labels) {
  const ids = [...monsters.keys()].filter(id => monsters.get(id).srd);
  const text = Object.fromEntries(ids.map(id => [id, { html: srdHtml(monsters.get(id), labels, { inline, body, escapeHtml }) }]));
  const source = `// ${SRD_OUTPUT_NAME}：由 npm run build 從 content/srd/monsters 的 srd 區塊產生，請勿手動修改。
// 野獸資料卡的「SRD 版」（SRD 5.2.1 繁中直譯，CC BY 4.0）：html 是數據塊的 HTML。網頁版在第一次切到 SRD 版時才載入。
globalThis.monsterSrdText = {
${entries(ids, text)}
};
`;
  const context = {};
  vm.runInNewContext(source, context);
  if (JSON.stringify(context.monsterSrdText) !== JSON.stringify(text)) throw new ContentError(`${SRD_OUTPUT_NAME}：產生結果與資料不同`);
  return source;
}

function renderMonsterData(monsters, labels, srdSource) {
  const ids = [...monsters.keys()];
  const rules = Object.fromEntries(ids.map(id => [id, monsterRules(monsters.get(id))]));
  const text = Object.fromEntries(ids.map(id => [id, monsterText(monsters.get(id), labels)]));
  const runtimeLabels = {
    damage: Object.fromEntries(Object.entries(labels.damage).map(([type, label]) => [type, `${label}傷害`])),
    speed: SPEED_LABELS, ability: ABILITY_LABELS, conditional: CONDITIONAL_LABELS, timing: TIMING_LABELS
  };
  const srdFile = `${SRD_OUTPUT_NAME}?v=${contentVersion(srdSource)}`;
  const source = `// ${OUTPUT_NAME}：由 npm run build 從 content/srd/monsters 的怪物內容檔產生，請勿手動修改。
// monsterRules：結構化數值（體型、類型、CR、AC、HP、速度、屬性、豁免、技能、感官、抗性免疫、動作的攻擊／豁免／傷害／使用限制）。
// monsterText：網站版文字（statBlock 資料卡各行、summary 用途短說明、traits 特性、actions 動作說明、languages、gear）。
// monsterLabels：跑團顯示用的名稱（傷害類型、速度、屬性、條件傷害、傷害時機）。monsterSrdFile：SRD 版產物（${SRD_OUTPUT_NAME}）的網址與快取版本。
// 網站經 monster.js 的 BeastCatalog 讀取。
const monsterRules = {
${entries(ids, rules)}
};

const monsterText = {
${entries(ids, text)}
};

const monsterLabels = ${JSON.stringify(runtimeLabels)};

const monsterSrdFile = ${JSON.stringify(srdFile)};
`;
  const context = {};
  vm.runInNewContext(`${source}\nthis.result = { monsterRules, monsterText, monsterLabels, monsterSrdFile };`, context);
  if (JSON.stringify(context.result) !== JSON.stringify({ monsterRules: rules, monsterText: text, monsterLabels: runtimeLabels, monsterSrdFile: srdFile })) throw new ContentError(`${OUTPUT_NAME}：產生結果與資料不同`);
  return source;
}

// 寫入產生檔；stampIndex 為 true 時一併更新 index.html 的快取版本。內容沒變時不改檔案。回傳有變更的檔名。
function writeMonsterData(monsters, { stampIndex = false } = {}) {
  const labels = labelsFor();
  const srdSource = renderSrdData(monsters, labels);
  const source = renderMonsterData(monsters, labels, srdSource);
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

module.exports = { writeMonsterData };

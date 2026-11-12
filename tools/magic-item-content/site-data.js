// 網站讀取的魔法物品資料：npm run build 由 content/srd/magic-items/ 產生根目錄的兩個檔案（衍生產物，不提交）。
// - magic-item-content.generated.js：magicItemRules（規則與名稱）、magicItemLabels（類別、小標、稀有度的名稱）、magicItemBaseLists（「任意某類」基本款的展開清單）、
//   magicItemTextFile（說明本文產物的檔名與快取版本）。網頁一開始就載入，網站經 magic-items.js 的 MagicItemCatalog 讀取。
// - magic-item-text.generated.js：magicItemText（說明本文的 HTML），第一次需要時才載入；離線版內嵌。
// index.html 載入 magic-item-content.generated.js 的快取版本（?v=）是檔案內容的雜湊，只在上線建置（--stamp-version）時改寫。
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { ROOT } = require("../content/site-sources");
const { ContentError } = require("../content/errors");
const { writeIfChanged, contentVersion, stampScriptVersion } = require("../content/output");
const { body } = require("../spell-content/srd-text");

const OUTPUT_NAME = "magic-item-content.generated.js";
const TEXT_OUTPUT_NAME = "magic-item-text.generated.js";
const INDEX_FILE = path.join(ROOT, "index.html");
// 譯文的註腳星號（\*）不是 Markdown 記號：轉換時先換成私用區字元，轉完再還原。
const LITERAL_ASTERISK = "";

const LABELS = Object.freeze({
  category: { weapon: "武器", armor: "護甲", potion: "藥水", ring: "戒指", scroll: "卷軸", rod: "權杖", staff: "法杖", wand: "魔杖", wondrous: "奇物" },
  group: { wearable: "穿戴", container: "容器", consumable: "消耗品", tool: "工具與載具", book: "書籍", curio: "奇珍" },
  rarity: { common: "常見", uncommon: "非常見", rare: "稀有", "very-rare": "極稀有", legendary: "傳說", artifact: "神器" }
});

function itemRules(item) {
  const { id, file, text, ...rules } = item;
  return rules;
}

function itemHtml(item) {
  const html = body(item.text.replace(/\\\*/g, LITERAL_ASTERISK), `${item.file} ${item.id} text`);
  return { html: html.split(LITERAL_ASTERISK).join("*") };
}

const entries = (ids, map) => ids.map(id => `  ${JSON.stringify(id)}: ${JSON.stringify(map[id])}`).join(",\n");

function renderText(items) {
  const ids = [...items.keys()];
  const text = Object.fromEntries(ids.map(id => [id, itemHtml(items.get(id))]));
  const source = `// ${TEXT_OUTPUT_NAME}：由 npm run build 從 content/srd/magic-items/ 產生，請勿手動修改。
// 魔法物品的說明本文（SRD 5.2.1 繁中譯文，CC BY 4.0）：html 是說明的 HTML。網頁版在第一次需要時才載入。
globalThis.magicItemText = {
${entries(ids, text)}
};
`;
  const context = {};
  vm.runInNewContext(source, context);
  if (JSON.stringify(context.magicItemText) !== JSON.stringify(text)) throw new ContentError(`${TEXT_OUTPUT_NAME}：產生結果與資料不同`);
  return source;
}

function renderContent(items, baseLists, textSource) {
  const ids = [...items.keys()];
  const rules = Object.fromEntries(ids.map(id => [id, itemRules(items.get(id))]));
  const textFile = `${TEXT_OUTPUT_NAME}?v=${contentVersion(textSource)}`;
  const source = `// ${OUTPUT_NAME}：由 npm run build 從 content/srd/magic-items/ 產生，請勿手動修改。
// magicItemRules：規則與名稱（類別、稀有度、同調、基本款、選項、自動計算的固定數值）。magicItemLabels：類別、小標、稀有度的名稱。
// magicItemBaseLists：「任意某類」基本款的展開清單。magicItemTextFile：說明本文產物（${TEXT_OUTPUT_NAME}）的網址與快取版本。
// 網站經 magic-items.js 的 MagicItemCatalog 讀取。
const magicItemRules = {
${entries(ids, rules)}
};

const magicItemLabels = ${JSON.stringify(LABELS)};

const magicItemBaseLists = ${JSON.stringify(baseLists)};

const magicItemTextFile = ${JSON.stringify(textFile)};
`;
  const context = {};
  vm.runInNewContext(`${source}\nthis.result = { magicItemRules, magicItemLabels, magicItemBaseLists, magicItemTextFile };`, context);
  if (JSON.stringify(context.result) !== JSON.stringify({ magicItemRules: rules, magicItemLabels: LABELS, magicItemBaseLists: baseLists, magicItemTextFile: textFile })) throw new ContentError(`${OUTPUT_NAME}：產生結果與資料不同`);
  return source;
}

// 寫入產生檔；stampIndex 為 true 時一併更新 index.html 的快取版本。內容沒變時不改檔案。回傳有變更的檔名。
function writeMagicItemData({ items, baseLists }, { stampIndex = false } = {}) {
  const textSource = renderText(items);
  const source = renderContent(items, baseLists, textSource);
  const changed = [];
  const html = fs.readFileSync(INDEX_FILE, "utf8");
  const updated = stampScriptVersion(html, OUTPUT_NAME, contentVersion(source));
  writeIfChanged(path.join(ROOT, OUTPUT_NAME), source, changed);
  writeIfChanged(path.join(ROOT, TEXT_OUTPUT_NAME), textSource, changed);
  if (stampIndex && updated !== html) {
    fs.writeFileSync(INDEX_FILE, updated);
    changed.push("index.html");
  }
  return changed;
}

module.exports = { writeMagicItemData };

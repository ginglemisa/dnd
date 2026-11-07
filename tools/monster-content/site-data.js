// 網站讀取的怪物資料：npm run build 由 content/srd/monsters 產生根目錄的 monster-content.generated.js（衍生產物，不提交）。
// - monsterRules：跑團的結構化數值（tabletop）。
// - monsterText：網站版資料卡的顯示文字（statBlock）。
// 網站經 monster.js 的 BeastCatalog 讀取。index.html 載入它的快取版本（?v=）是檔案內容的雜湊，只在上線建置（--stamp-version）時改寫。
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { ROOT } = require("../content/site-sources");
const { ContentError } = require("../content/errors");
const { writeIfChanged, contentVersion, stampScriptVersion } = require("../content/output");

const OUTPUT_NAME = "monster-content.generated.js";
const INDEX_FILE = path.join(ROOT, "index.html");

const entries = (ids, map) => ids.map(id => `  ${JSON.stringify(id)}: ${JSON.stringify(map[id])}`).join(",\n");

function renderMonsterData(monsters) {
  const ids = [...monsters.keys()];
  const rules = Object.fromEntries(ids.map(id => {
    const monster = monsters.get(id);
    return [id, { name: monster.name, nameEn: monster.nameEn, ...(monster.tabletop ? { tabletop: monster.tabletop } : {}) }];
  }));
  const text = Object.fromEntries(ids.map(id => [id, { statBlock: monsters.get(id).site }]));
  const source = `// ${OUTPUT_NAME}：由 npm run build 從 content/srd/monsters 的怪物內容檔產生，請勿手動修改。
// monsterRules：跑團的結構化數值（tabletop）；monsterText：網站版資料卡的顯示文字（statBlock）。網站經 monster.js 的 BeastCatalog 讀取。
const monsterRules = {
${entries(ids, rules)}
};

const monsterText = {
${entries(ids, text)}
};
`;
  const context = {};
  vm.runInNewContext(`${source}\nthis.result = { monsterRules, monsterText };`, context);
  if (JSON.stringify(context.result) !== JSON.stringify({ monsterRules: rules, monsterText: text })) throw new ContentError(`${OUTPUT_NAME}：產生結果與資料不同`);
  return source;
}

// 寫入產生檔；stampIndex 為 true 時一併更新 index.html 的快取版本。內容沒變時不改檔案。回傳有變更的檔名。
function writeMonsterData(monsters, { stampIndex = false } = {}) {
  const source = renderMonsterData(monsters);
  const changed = [];
  const html = fs.readFileSync(INDEX_FILE, "utf8");
  const updated = stampScriptVersion(html, OUTPUT_NAME, contentVersion(source));
  writeIfChanged(path.join(ROOT, OUTPUT_NAME), source, changed);
  if (stampIndex && updated !== html) {
    fs.writeFileSync(INDEX_FILE, updated);
    changed.push("index.html");
  }
  return changed;
}

module.exports = { writeMonsterData };

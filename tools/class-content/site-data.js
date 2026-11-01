// 網站讀取的職業資料：npm run build 由公開內容包產生根目錄的 class-content.generated.js，
// 並另產生 class-content.private.generated.js（本機有私人內容包時為含私人內容的職業資料，否則為空檔）。
// 兩者都是衍生產物，不提交進 repo（.gitignore）：本機預覽、回歸腳本與離線建置前先 npm run build；上線時由 GitHub Actions 產生。
// 私人內容包不寫進 class-content.generated.js。index.html 載入此檔的快取版本（?v=）是檔案內容的雜湊，
// 只在上線建置（npm run build -- --stamp-version）時改寫，本機建置不動 index.html。
"use strict";
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { ROOT } = require("./legacy");
const { ContentError } = require("./markdown");
const { renderClass } = require("./render");
const { classRules } = require("./rules-data");

const OUTPUT_NAME = "class-content.generated.js";
const OUTPUT_FILE = path.join(ROOT, OUTPUT_NAME);
const PRIVATE_OUTPUT_NAME = "class-content.private.generated.js";
const PRIVATE_OUTPUT_FILE = path.join(ROOT, PRIVATE_OUTPUT_NAME);
const INDEX_FILE = path.join(ROOT, "index.html");
const SCRIPT_TAG = /(<script src="class-content\.generated\.js\?v=)([^"]*)(")/g;

// 樣板字串：保留 HTML 換行，方便閱讀與比對差異。
const template = text => `\`${text.replace(/[\\`]/g, "\\$&").replace(/\$\{/g, "\\${")}\``;
const textMap = (map, indent) => {
  const entries = Object.keys(map).sort().map(id => `${indent}  ${JSON.stringify(id)}: ${template(map[id])}`);
  return entries.length ? `{\n${entries.join(",\n")}\n${indent}}` : "{}";
};

// textMap 依 ID 排序輸出，比對時同樣排序。
const sortKeys = map => Object.fromEntries(Object.keys(map).sort().map(key => [key, map[key]]));

function renderEntries(classes, ids) {
  const rendered = ids.map(id => [id, renderClass(classes.get(id))]);
  const rules = ids.map((id, index) => [id, classRules(classes.get(id), rendered[index][1].appendix)]);
  const features = rendered.map(([id, output]) => `  ${id}: ${template(output.html)}`).join(",\n");
  const text = rendered.map(([id, output]) => `  ${id}: {\n    tabletop: ${textMap(output.tabletop, "    ")},\n    summaries: ${textMap(output.summaries, "    ")}\n  }`).join(",\n");
  const rulesSource = rules.map(([id, data]) => `  ${id}: ${JSON.stringify(data)}`).join(",\n");
  return { rendered, rules, features, text, rulesSource };
}

// 確認樣板字串的跳脫正確：執行產生的程式，結果須與渲染結果完全相同。
function verifySource(name, source, { rendered, rules }, prelude = "") {
  const context = {};
  vm.runInNewContext(`${prelude}${source}\nthis.result = { classFeatures, classTabletopText, classRules };`, context);
  for (const [id, data] of rules) {
    if (JSON.stringify(context.result.classRules[id]) !== JSON.stringify(data)) throw new ContentError(`${name}：${id} 的機制資料輸出有誤`);
  }
  for (const [id, output] of rendered) {
    const same = context.result.classFeatures[id] === output.html
      && JSON.stringify(context.result.classTabletopText[id]) === JSON.stringify({ tabletop: sortKeys(output.tabletop), summaries: sortKeys(output.summaries) });
    if (!same) throw new ContentError(`${name}：${id} 的產生結果與渲染結果不同（樣板字串跳脫有誤）`);
  }
}

function renderSiteData(classes) {
  const entries = renderEntries(classes, [...classes.keys()].sort());
  const source = `// ${OUTPUT_NAME}：由 npm run build 從 content/srd 的職業內容檔產生，請勿手動修改。
// classFeatures：各職業的職業頁 HTML（data-class-feature-panel="creation" 為創角頁籤，"class" 為各等級能力；
// 子職能力帶 data-subclass，網站只顯示目前選擇的子職）。
// classTabletopText：段落 ID → 跑團版 HTML（action-panel.js 讀取，data-tabletop-value 由網站換成目前數值）。
// tabletop 是每個段落的跑團動作說明，summaries 是跑團總覽與 tabletop 不同時的版本。
// classRules：各職業的機制資料（內容檔去掉說明文字），character-rules.js 等以此計算資源、法術位、數值、選項與動作。
const classFeatures = {
${entries.features}
};

const classTabletopText = {
${entries.text}
};

const classRules = {
${entries.rulesSource}
};
`;
  verifySource(OUTPUT_NAME, source, entries);
  return source;
}

// 私人資料檔：網站在公開資料之後載入，以含私人內容的完整資料取代用到私人內容包的職業（例如加上私人子職）。
// 沒有私人內容（或上線建置）時是空檔，網站照常只用公開資料。
const PRIVATE_STUB = `// ${PRIVATE_OUTPUT_NAME}：沒有私人內容包（或為上線建置），網站只使用公開職業資料。由 npm run build 產生，請勿手動修改。
`;

function renderPrivateData(classes) {
  const ids = [...classes.keys()].sort().filter(id => {
    const classDef = classes.get(id);
    return classDef.pack !== "srd" || classDef.extendedBy || classDef.subclasses.some(subclass => subclass.pack !== "srd");
  });
  if (!ids.length) return PRIVATE_STUB;
  const entries = renderEntries(classes, ids);
  const source = `// ${PRIVATE_OUTPUT_NAME}：由 npm run build 從私人內容包（content/private）產生，只在本機使用：
// 不提交、不分享，上線建置與離線角色卡都不含這些內容。請勿手動修改。
// 網站載入公開職業資料（${OUTPUT_NAME}）後，以下列職業的完整資料（含私人子職等）取代。
(function applyPrivateClassContent() {
  Object.assign(classFeatures, {
${entries.features}
  });
  Object.assign(classTabletopText, {
${entries.text}
  });
  Object.assign(classRules, {
${entries.rulesSource}
  });
})();
`;
  verifySource(PRIVATE_OUTPUT_NAME, source, entries, "const classFeatures = {}, classTabletopText = {}, classRules = {};\n");
  return source;
}

function writeIfChanged(file, source, changed) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n") : null;
  if (current === source) return;
  fs.writeFileSync(file, source);
  changed.push(path.basename(file));
}

// 寫入產生檔：publicClasses 為公開內容包，privateClasses 為含私人內容包的全部內容（null 時私人資料檔為空檔）；
// stampIndex 為 true 時一併更新 index.html 的快取版本。內容沒變時不改檔案。回傳有變更的檔名。
function writeSiteData(publicClasses, { privateClasses = null, stampIndex = false } = {}) {
  const source = renderSiteData(publicClasses);
  const version = crypto.createHash("sha256").update(source).digest("hex").slice(0, 12);
  const changed = [];
  const html = fs.readFileSync(INDEX_FILE, "utf8");
  const tags = html.match(SCRIPT_TAG) || [];
  if (tags.length !== 1) throw new ContentError(`index.html 應有一個 <script src="${OUTPUT_NAME}?v=…"> 標籤（目前 ${tags.length} 個）`);
  if (!html.includes(`<script src="${PRIVATE_OUTPUT_NAME}" defer></script>`)) throw new ContentError(`index.html 應有 <script src="${PRIVATE_OUTPUT_NAME}" defer></script> 標籤`);
  writeIfChanged(OUTPUT_FILE, source, changed);
  writeIfChanged(PRIVATE_OUTPUT_FILE, privateClasses ? renderPrivateData(privateClasses) : PRIVATE_STUB, changed);
  const updated = html.replace(SCRIPT_TAG, `$1${version}$3`);
  if (stampIndex && updated !== html) {
    fs.writeFileSync(INDEX_FILE, updated);
    changed.push("index.html");
  }
  return changed;
}

module.exports = { renderSiteData, renderPrivateData, writeSiteData, PRIVATE_STUB, PRIVATE_OUTPUT_NAME };

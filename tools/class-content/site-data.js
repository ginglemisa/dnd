// 網站讀取的職業資料：npm run build 由公開內容包產生根目錄的 class-content.generated.js。
// 這是衍生產物，不提交進 repo（.gitignore）：本機預覽、回歸腳本與離線建置前先 npm run build；上線時由 GitHub Actions 產生。
// 私人內容包不寫進這個檔案。index.html 載入此檔的快取版本（?v=）是檔案內容的雜湊，
// 只在上線建置（npm run build -- --stamp-version）時改寫，本機建置不動 index.html。
"use strict";
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { ROOT } = require("./legacy");
const { ContentError } = require("./markdown");
const { renderClass } = require("./render");

const OUTPUT_NAME = "class-content.generated.js";
const OUTPUT_FILE = path.join(ROOT, OUTPUT_NAME);
const INDEX_FILE = path.join(ROOT, "index.html");
const SCRIPT_TAG = /(<script src="class-content\.generated\.js\?v=)([^"]*)(")/g;

// 樣板字串：保留 HTML 換行，方便閱讀與比對差異。
const template = text => `\`${text.replace(/[\\`]/g, "\\$&").replace(/\$\{/g, "\\${")}\``;
const textMap = (map, indent) => {
  const entries = Object.keys(map).sort().map(id => `${indent}  ${JSON.stringify(id)}: ${template(map[id])}`);
  return entries.length ? `{\n${entries.join(",\n")}\n${indent}}` : "{}";
};

function renderSiteData(classes) {
  const rendered = [...classes.keys()].sort().map(id => [id, renderClass(classes.get(id))]);
  const source = `// ${OUTPUT_NAME}：由 npm run build 從 content/srd 的職業內容檔產生，請勿手動修改。
// classFeatures：各職業的職業頁 HTML（data-class-feature-panel="creation" 為創角頁籤，"class" 為各等級能力）。
// classTabletopText：能力 ID → 行內 HTML。tabletop 取代該段落的跑團動作說明，summaries 取代跑團總覽的一句話；
// 沒有寫的能力由 action-panel.js 改讀 classFeatures 的同一段落。
const classFeatures = {
${rendered.map(([id, output]) => `  ${id}: ${template(output.html)}`).join(",\n")}
};

const classTabletopText = {
${rendered.map(([id, output]) => `  ${id}: {\n    tabletop: ${textMap(output.tabletop, "    ")},\n    summaries: ${textMap(output.summaries, "    ")}\n  }`).join(",\n")}
};
`;
  // 確認樣板字串的跳脫正確：執行產生的程式，結果須與渲染結果完全相同。
  const context = {};
  vm.runInNewContext(`${source}\nthis.result = { classFeatures, classTabletopText };`, context);
  for (const [id, output] of rendered) {
    const same = context.result.classFeatures[id] === output.html
      && JSON.stringify(context.result.classTabletopText[id]) === JSON.stringify({ tabletop: output.tabletop, summaries: output.summaries });
    if (!same) throw new ContentError(`${OUTPUT_NAME}：${id} 的產生結果與渲染結果不同（樣板字串跳脫有誤）`);
  }
  return source;
}

// 寫入產生檔；stampIndex 為 true 時一併更新 index.html 的快取版本。內容沒變時不改檔案。回傳有變更的檔名。
function writeSiteData(classes, { stampIndex = false } = {}) {
  const source = renderSiteData(classes);
  const version = crypto.createHash("sha256").update(source).digest("hex").slice(0, 12);
  const changed = [];
  const html = fs.readFileSync(INDEX_FILE, "utf8");
  const tags = html.match(SCRIPT_TAG) || [];
  if (tags.length !== 1) throw new ContentError(`index.html 應有一個 <script src="${OUTPUT_NAME}?v=…"> 標籤（目前 ${tags.length} 個）`);
  const current = fs.existsSync(OUTPUT_FILE) ? fs.readFileSync(OUTPUT_FILE, "utf8").replace(/\r\n/g, "\n") : null;
  if (current !== source) {
    fs.writeFileSync(OUTPUT_FILE, source);
    changed.push(OUTPUT_NAME);
  }
  const updated = html.replace(SCRIPT_TAG, `$1${version}$3`);
  if (stampIndex && updated !== html) {
    fs.writeFileSync(INDEX_FILE, updated);
    changed.push("index.html");
  }
  return changed;
}

module.exports = { renderSiteData, writeSiteData };

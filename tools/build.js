// npm run build：讀取 content/ 的職業內容檔，做格式與跨檔檢查、持久化 ID 基準檔比對，
// 再由公開內容包產生網站讀取的 class-content.generated.js（並更新 index.html 的快取版本）。
// npm run build -- --update-id-baseline：確認 ID 變動是刻意的之後，改寫基準檔。
// 任何錯誤都讓建置失敗（結束碼 1）。
"use strict";
const fs = require("fs");
const path = require("path");
const { ContentError } = require("./class-content/markdown");
const { loadContent } = require("./class-content/load");
const { checkIdBaseline } = require("./class-content/id-baseline");
const { writeSiteData } = require("./class-content/site-data");

function build({ quiet = false, updateIdBaseline = false } = {}) {
  const log = quiet ? () => {} : console.log;
  const { classes, multiclassRules } = loadContent();
  const idProblems = checkIdBaseline(classes, { update: updateIdBaseline });
  if (idProblems.length) throw new ContentError(`持久化 ID 與基準檔不符：\n- ${idProblems.join("\n- ")}`);
  if (updateIdBaseline) log("已更新持久化 ID 基準檔。");
  // 網站資料只含公開內容包：另外載入一次，私人內容包（子職、兼職補充）不會寫進提交的檔案。
  const changed = writeSiteData(loadContent({ packs: ["srd"] }).classes);
  const packs = ["srd", "private"].filter(pack => fs.existsSync(path.join(__dirname, "..", "content", pack)));
  log(`內容檢查通過：${classes.size} 個職業、${[...classes.values()].reduce((sum, classDef) => sum + classDef.subclasses.length, 0)} 個子職（內容包：${packs.join("、")}${multiclassRules ? "，含兼職規則" : ""}）。`);
  log(changed.length ? `已更新：${changed.join("、")}。` : "網站職業資料沒有變動。");
  return changed;
}

if (require.main === module) {
  try {
    build({ updateIdBaseline: process.argv.includes("--update-id-baseline") });
  } catch (error) {
    if (!(error instanceof ContentError)) throw error;
    console.error(`建置失敗：${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { build };

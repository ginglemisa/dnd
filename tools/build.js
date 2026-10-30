// npm run build：讀取 content/ 的職業內容檔，做格式與跨檔檢查、持久化 ID 基準檔比對，再與現有 class-features.js 比對。
// npm run build -- --update-id-baseline：確認 ID 變動是刻意的之後，改寫基準檔。
// 任何錯誤都讓建置失敗（結束碼 1）。轉換期還沒有產生檔案；之後由此輸出網站讀取的職業資料。
"use strict";
const fs = require("fs");
const path = require("path");
const { ContentError } = require("./class-content/markdown");
const { loadContent } = require("./class-content/load");
const { renderClass } = require("./class-content/render");
const { compareClass } = require("./class-content/compare");
const { loadLegacyClassFeatures } = require("./class-content/legacy");
const { checkIdBaseline } = require("./class-content/id-baseline");

function build({ quiet = false, updateIdBaseline = false } = {}) {
  const log = quiet ? () => {} : console.log;
  const { classes, multiclassRules } = loadContent();
  const idProblems = checkIdBaseline(classes, { update: updateIdBaseline });
  if (idProblems.length) throw new ContentError(`持久化 ID 與基準檔不符：\n- ${idProblems.join("\n- ")}`);
  if (updateIdBaseline) log("已更新持久化 ID 基準檔。");
  const legacy = loadLegacyClassFeatures();
  const accepted = JSON.parse(fs.readFileSync(path.join(__dirname, "class-content", "accepted-differences.json"), "utf8"));
  const problems = [];
  for (const [classId, classDef] of classes) {
    const report = compareClass(classId, legacy[classId], renderClass(classDef), accepted[classId] || []);
    report.checks.filter(item => !item.ok).forEach(item => problems.push(`${classId}：${item.name}\n${item.changes.slice(0, 20).map(change => `    ${change}`).join("\n")}`));
  }
  if (problems.length) throw new ContentError(`與現有 class-features.js 不一致（執行 npm run classes:check 看完整差異）：\n${problems.join("\n")}`);
  const packs = ["srd", "private"].filter(pack => fs.existsSync(path.join(__dirname, "..", "content", pack)));
  log(`內容檢查通過：${classes.size} 個職業、${[...classes.values()].reduce((sum, classDef) => sum + classDef.subclasses.length, 0)} 個子職（內容包：${packs.join("、")}${multiclassRules ? "，含兼職規則" : ""}）。`);
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

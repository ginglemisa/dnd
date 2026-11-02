// 持久化 ID 基準檔的比對：內容檔中會寫進存檔、分享網址或跑團偏好的 ID，不見或改名就讓建置失敗。各種內容（職業等）共用。
// 基準檔是 { 分類: [ID…] } 的 JSON；確實要新增、移除或改名時（移除／改名須先處理舊資料相容），執行 npm run build -- --update-id-baseline。
"use strict";
const fs = require("fs");
const path = require("path");
const { ROOT } = require("./site-sources");

// current 為 { 分類: 排序後的 ID 陣列 }，categories 為 分類 → 說明。回傳問題清單；update 為 true 時改寫基準檔並回傳空清單。
function compareBaseline(file, current, categories, { update = false } = {}) {
  const where = path.relative(ROOT, file).replace(/\\/g, "/");
  if (update) {
    // 內容沒變（舊基準檔缺少的分類視為空）時不改寫，避免只為新增分類而改動其他內容包的基準檔。
    const baseline = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
    const same = baseline && Object.keys(categories).every(category => JSON.stringify(baseline[category] || []) === JSON.stringify(current[category]));
    if (!same) fs.writeFileSync(file, `${JSON.stringify(current, null, 2)}\n`);
    return [];
  }
  if (!fs.existsSync(file)) return [`${where} 不存在：執行 npm run build -- --update-id-baseline 建立`];
  const problems = [];
  const baseline = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const [category, label] of Object.entries(categories)) {
    const before = new Set(baseline[category] || []);
    const after = new Set(current[category]);
    const missing = [...before].filter(id => !after.has(id));
    const added = [...after].filter(id => !before.has(id));
    if (missing.length) problems.push(`${label} 不見了（被刪除或改名）：${missing.join("、")}。這些 ID 會寫進存檔、分享網址或跑團偏好；確實要移除或改名時，先處理舊資料相容，再更新 ${where}`);
    if (added.length) problems.push(`新的 ${label} 尚未列入 ${where}：${added.join("、")}。確認是刻意新增後執行 npm run build -- --update-id-baseline`);
  }
  return problems;
}

module.exports = { compareBaseline };

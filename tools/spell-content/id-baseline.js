// 法術的持久化 ID 基準檔（根目錄 spell-id-baseline.json，spellId 的清單）：角色可用的法術（有 site 區塊）
// 會以 spellId 寫進存檔、分享網址與 JSON，不見或改名就讓建置失敗。只供查閱的法術（只有 srd 區塊）不在基準檔。
"use strict";
const fs = require("fs");
const path = require("path");
const { ROOT } = require("../content/site-sources");

const BASELINE_FILE = path.join(ROOT, "spell-id-baseline.json");

function checkSpellIdBaseline(spells, { update = false } = {}) {
  const current = [...spells.values()].filter(spell => spell.site).map(spell => spell.id).sort();
  const where = path.relative(ROOT, BASELINE_FILE).replace(/\\/g, "/");
  const baseline = fs.existsSync(BASELINE_FILE) ? JSON.parse(fs.readFileSync(BASELINE_FILE, "utf8")) : null;
  if (update) {
    if (!baseline || JSON.stringify([...baseline].sort()) !== JSON.stringify(current)) fs.writeFileSync(BASELINE_FILE, `${JSON.stringify(current, null, 2)}\n`);
    return [];
  }
  if (!baseline) return [`${where} 不存在：執行 npm run build -- --update-id-baseline 建立`];
  const before = new Set(baseline);
  const after = new Set(current);
  const missing = baseline.filter(id => !after.has(id));
  const added = current.filter(id => !before.has(id));
  const problems = [];
  if (missing.length) problems.push(`可用法術的 spellId 不見了（被刪除、改名或移除 site 區塊）：${missing.join("、")}。這些 ID 會寫進存檔與分享網址；確實要移除或改名時，先處理舊資料相容，再更新 ${where}`);
  if (added.length) problems.push(`新的可用法術尚未列入 ${where}：${added.join("、")}。確認是刻意新增後執行 npm run build -- --update-id-baseline`);
  return problems;
}

module.exports = { checkSpellIdBaseline };

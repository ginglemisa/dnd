// 持久化 ID 基準檔：內容檔中會寫進存檔、分享網址或跑團偏好的 ID，不見或改名就讓建置失敗。
// 公開內容包對照根目錄 class-id-baseline.json；私人內容包對照 content/private/class-id-baseline.json（不進公開 repo）。
// 確實要新增、移除或改名時（移除／改名須先處理舊資料相容），執行 npm run build -- --update-id-baseline。
"use strict";
const fs = require("fs");
const path = require("path");
const { ROOT } = require("./legacy");
const { CONTENT_DIR, getActions, getAppendixActions } = require("./load");

const BASELINE_FILES = Object.freeze({
  srd: path.join(ROOT, "class-id-baseline.json"),
  private: path.join(CONTENT_DIR, "private", "class-id-baseline.json")
});
const CATEGORIES = Object.freeze({
  classes: "職業 ID",
  subclasses: "子職 ID（職業/子職）",
  options: "選項 ID",
  actionKeys: "跑團動作 key",
  resourceKeys: "資源 key",
  selects: "下拉選單 ID",
  selectValues: "下拉選單的選項值（下拉選單 ID=值）",
  attackNotes: "選項的攻擊備註（存進角色攻擊備註欄，取消勾選時以相同字串移除）"
});

function collectPersistedIds(classes) {
  const packs = {};
  const add = (pack, category, id) => {
    packs[pack] ||= Object.fromEntries(Object.keys(CATEGORIES).map(name => [name, new Set()]));
    packs[pack][category].add(id);
  };
  const addFeatures = (pack, features) => {
    for (const feature of features) {
      (feature.options || []).forEach(option => {
        add(pack, "options", option.id);
        if (option.attackNote) add(pack, "attackNotes", option.attackNote);
      });
      getActions(feature).forEach(action => [action.key, ...(action.legacyKeys || [])].forEach(key => add(pack, "actionKeys", key)));
      if (feature.resource) add(pack, "resourceKeys", feature.resource.key);
      if (feature.select) {
        add(pack, "selects", feature.select.id);
        feature.select.choices.forEach(choice => add(pack, "selectValues", `${feature.select.id}=${choice.value}`));
      }
    }
  };
  for (const classDef of classes.values()) {
    add(classDef.pack, "classes", classDef.id);
    addFeatures(classDef.pack, classDef.features);
    getAppendixActions(classDef).forEach(action => [action.key, ...(action.legacyKeys || [])].forEach(key => add(classDef.pack, "actionKeys", key)));
    for (const subclass of classDef.subclasses) {
      add(subclass.pack, "subclasses", `${classDef.id}/${subclass.id}`);
      addFeatures(subclass.pack, subclass.features);
    }
  }
  return Object.fromEntries(Object.entries(packs).map(([pack, sets]) => [pack, Object.fromEntries(
    Object.entries(sets).map(([category, ids]) => [category, [...ids].sort()])
  )]));
}

// 回傳問題清單；update 為 true 時改寫基準檔並回傳空清單。
function checkIdBaseline(classes, { update = false } = {}) {
  const problems = [];
  for (const [pack, current] of Object.entries(collectPersistedIds(classes))) {
    const file = BASELINE_FILES[pack];
    const where = path.relative(ROOT, file).replace(/\\/g, "/");
    if (update) {
      // 內容沒變（舊基準檔缺少的分類視為空）時不改寫，避免只為新增分類而改動其他內容包的基準檔。
      const baseline = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
      const same = baseline && Object.keys(CATEGORIES).every(category => JSON.stringify(baseline[category] || []) === JSON.stringify(current[category]));
      if (!same) fs.writeFileSync(file, `${JSON.stringify(current, null, 2)}\n`);
      continue;
    }
    if (!fs.existsSync(file)) {
      problems.push(`${where} 不存在：執行 npm run build -- --update-id-baseline 建立`);
      continue;
    }
    const baseline = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const [category, label] of Object.entries(CATEGORIES)) {
      const before = new Set(baseline[category] || []);
      const after = new Set(current[category]);
      const missing = [...before].filter(id => !after.has(id));
      const added = [...after].filter(id => !before.has(id));
      if (missing.length) problems.push(`${label} 不見了（被刪除或改名）：${missing.join("、")}。這些 ID 會寫進存檔、分享網址或跑團偏好；確實要移除或改名時，先處理舊資料相容，再更新 ${where}`);
      if (added.length) problems.push(`新的 ${label} 尚未列入 ${where}：${added.join("、")}。確認是刻意新增後執行 npm run build -- --update-id-baseline`);
    }
  }
  return problems;
}

module.exports = { checkIdBaseline, collectPersistedIds };

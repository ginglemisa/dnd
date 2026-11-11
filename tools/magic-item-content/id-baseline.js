// 魔法物品的持久化 ID 基準檔（根目錄 magic-item-id-baseline.json）：
// - items：物品 id，寫進物品欄存檔的 magic.id。
// - options：「物品 id:選項 id:選項值」，選項 id 是 magic 物件的欄位名，選項值是它的內容；可切換的形態是「物品 id:form:形態 id」；
//   次數池是「物品 id:pool:池 id」（物品欄存檔 charges 的鍵），能力是「物品 id:action:能力 id」（跑團隱藏偏好的 key）。
// 不見或改名就讓建置失敗；確實要新增、移除或改名時（移除／改名須先處理舊資料相容），執行 npm run build -- --update-id-baseline。
"use strict";
const path = require("path");
const { ROOT } = require("../content/site-sources");
const { compareBaseline } = require("../content/baseline");

const BASELINE_FILE = path.join(ROOT, "magic-item-id-baseline.json");
const CATEGORIES = Object.freeze({ items: "魔法物品 id", options: "魔法物品選項（物品 id:選項 id:選項值）" });

function itemOptions(item) {
  return [
    ...(item.options || []).flatMap(option => option.choices.map(choice => `${item.id}:${option.id}:${choice.value}`)),
    ...(item.forms || []).map(form => `${item.id}:form:${form.id}`),
    ...(item.pools || []).map(pool => `${item.id}:pool:${pool.id}`),
    ...(item.actions || []).map(action => `${item.id}:action:${action.id}`)
  ];
}

function checkMagicItemIdBaseline(items, { update = false } = {}) {
  const current = {
    items: [...items.keys()].sort(),
    options: [...items.values()].flatMap(itemOptions).sort()
  };
  return compareBaseline(BASELINE_FILE, current, CATEGORIES, { update });
}

module.exports = { checkMagicItemIdBaseline };

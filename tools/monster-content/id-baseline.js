// 怪物的持久化 ID 基準檔（根目錄 monster-id-baseline.json）：
// - monsters：怪物 key，寫進跑團狀態（德魯伊已知形態、目前形態）、職業頁 data-beast 與法術頁的野獸按鈕。
// - actions：「key:動作 id」，寫進跑團狀態（beastUsed）、跑團動作 key（druid-beast-<key>-<動作 id>）與動作偏好。
// 不見或改名就讓建置失敗；確實要新增、移除或改名時（移除／改名須先處理舊資料相容），執行 npm run build -- --update-id-baseline。
"use strict";
const path = require("path");
const { ROOT } = require("../content/site-sources");
const { compareBaseline } = require("../content/baseline");

const BASELINE_FILE = path.join(ROOT, "monster-id-baseline.json");
const CATEGORIES = Object.freeze({ monsters: "怪物 key", actions: "怪物動作 ID（key:動作 id）" });

function monsterActions(monster) {
  return (monster.tabletop?.actions || []).map(action => `${monster.id}:${action.id}`);
}

function checkMonsterIdBaseline(monsters, { update = false } = {}) {
  const current = {
    monsters: [...monsters.keys()].sort(),
    actions: [...monsters.values()].flatMap(monsterActions).sort()
  };
  return compareBaseline(BASELINE_FILE, current, CATEGORIES, { update });
}

module.exports = { checkMonsterIdBaseline };

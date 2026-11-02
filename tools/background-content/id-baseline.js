// 背景的持久化 ID 基準檔（根目錄 background-id-baseline.json）：背景 ID 會寫進存檔、JSON、分享網址與購點紀錄，不見或改名就讓建置失敗。
"use strict";
const path = require("path");
const { ROOT } = require("../content/site-sources");
const { compareBaseline } = require("../content/baseline");

const BASELINE_FILE = path.join(ROOT, "background-id-baseline.json");
const CATEGORIES = Object.freeze({ backgrounds: "背景 ID" });

function checkBackgroundIdBaseline(backgrounds, { update = false } = {}) {
  return compareBaseline(BASELINE_FILE, { backgrounds: [...backgrounds.keys()].sort() }, CATEGORIES, { update });
}

module.exports = { checkBackgroundIdBaseline };

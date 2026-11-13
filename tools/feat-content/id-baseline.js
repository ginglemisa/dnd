// 專長的持久化 ID 基準檔（根目錄 feat-id-baseline.json）：專長 ID、專長選擇欄位、快速創角草稿的專長名稱與跑團動作 key
// 會寫進存檔、分享網址、快速創角草稿或跑團偏好，不見或改名就讓建置失敗。
"use strict";
const path = require("path");
const { ROOT } = require("../content/site-sources");
const { compareBaseline } = require("../content/baseline");
const { backgroundFeatName } = require("../background-content/site-data");

const BASELINE_FILE = path.join(ROOT, "feat-id-baseline.json");
const CATEGORIES = Object.freeze({
  feats: "專長 ID（專長選單值；存檔、分享網址與快速創角草稿的專長值）",
  featFields: "專長選擇的存檔欄位（feat-choice-<來源>、derived-feat-<來源>；<次數> 為第幾次選擇遠古者的教誨）",
  draftNames: "快速創角草稿的專長取得名稱（背景專長、人類起源專長、戰鬥風格）",
  actionKeys: "跑團動作 key"
});

// 專長選擇的來源 key，與 feat-ui.js 的 getFeatChoiceSpecs 相同：種族特質的 feat.key、職業的屬性值提升（職業-level-等級）、
// 戰鬥風格（職業能力 feat: style 或勾選給予專長的選項為 fighting-style-職業，子職能力的 feat: style 為第二個，加 -2）、
// 魔能祈喚「遠古者的教誨」（lessons-次數）。背景專長的列為 derived-feat-background。只算公開內容包。
function featChoiceKeys(classes, races) {
  const keys = new Set(["lessons-<次數>"]);
  races.forEach(race => race.traits.forEach(trait => { if (trait.feat) keys.add(trait.feat.key); }));
  classes.forEach(classDef => {
    if (classDef.pack !== "srd") return;
    classDef.features.forEach(feature => {
      if (feature.feat === "level") keys.add(`${classDef.id}-level-${feature.level}`);
      if (feature.feat === "style" || (feature.options || []).some(option => option.featChoice)) keys.add(`fighting-style-${classDef.id}`);
    });
    classDef.subclasses.filter(subclass => subclass.pack === "srd").forEach(subclass => subclass.features.forEach(feature => {
      if (feature.feat === "style") keys.add(`fighting-style-${classDef.id}-2`);
    }));
  });
  return keys;
}

function checkFeatIdBaseline(feats, { classes, races, backgrounds }, { update = false } = {}) {
  const fields = new Set(["derived-feat-background"]);
  featChoiceKeys(classes, races).forEach(key => { fields.add(`feat-choice-${key}`); fields.add(`derived-feat-${key}`); });
  const draftNames = new Set([...feats].filter(([, feat]) => feat.type !== "general").map(([id]) => id));
  backgrounds.forEach(background => draftNames.add(backgroundFeatName(typeof background.feat === "string" ? { id: background.feat } : background.feat, classes)));
  const current = {
    feats: [...feats.keys()].sort(),
    featFields: [...fields].sort(),
    draftNames: [...draftNames].sort(),
    actionKeys: [...feats.values()].flatMap(feat => (feat.actions || []).map(action => action.key)).sort()
  };
  return compareBaseline(BASELINE_FILE, current, CATEGORIES, { update });
}

module.exports = { checkFeatIdBaseline };

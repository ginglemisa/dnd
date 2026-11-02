// 種族的持久化 ID 基準檔（根目錄 race-id-baseline.json）：種族 ID、血統選單與選項值、快速創角草稿的血統值、
// 跑團動作 key、資源 key 與勾選框、種族法術的來源識別碼會寫進存檔、草稿或跑團偏好，不見或改名就讓建置失敗。
"use strict";
const path = require("path");
const { ROOT, loadSpellCatalog } = require("../content/site-sources");
const { compareBaseline } = require("../content/baseline");
const { getRaceActions, optionDraftValue } = require("./load");

const BASELINE_FILE = path.join(ROOT, "race-id-baseline.json");
const CATEGORIES = Object.freeze({
  races: "種族 ID",
  selects: "血統選單 ID（存檔欄位）",
  selectValues: "血統選單的選項值（選單 ID=值）",
  draftValues: "快速創角草稿的血統值（種族 ID=值）",
  actionKeys: "跑團動作 key",
  resourceKeys: "資源 key",
  checkboxes: "資源勾選框 ID 前綴",
  spellSourceKeys: "種族法術的來源識別碼（存進角色法術清單；以 20 級、預設戲法計算）"
});

// 種族法術的來源識別碼，與 spell-sources.js 的 getRacialDerivedSpellSpecs 相同：種族特質法術、自選戲法、血統法術依序編號。
function spellSourceKeys(raceId, race) {
  const catalog = loadSpellCatalog();
  const ring = spellId => catalog.getSpell(spellId).level || "cantrips";
  const raceSpells = race.traits.flatMap(trait => trait.spells || []).map(entry => entry.spell);
  return (race.choice?.options || []).flatMap(option => {
    const spells = [...raceSpells, ...(option.cantripChoice ? [option.cantripChoice.default] : []), ...(option.spells || []).map(entry => entry.spell)];
    return spells.map((spellId, index) => `race-${raceId}-${option.value}-${ring(spellId)}-${spellId}-${index}`);
  });
}

function checkRaceIdBaseline(races, { update = false } = {}) {
  const current = Object.fromEntries(Object.keys(CATEGORIES).map(category => [category, new Set()]));
  races.forEach((race, id) => {
    current.races.add(id);
    if (race.choice) {
      current.selects.add(race.choice.id);
      race.choice.options.forEach(option => {
        current.selectValues.add(`${race.choice.id}=${option.value}`);
        current.draftValues.add(`${id}=${optionDraftValue(option)}`);
        if (option.cantripChoice) current.selects.add(option.cantripChoice.field);
      });
    }
    getRaceActions(race).forEach(({ action }) => current.actionKeys.add(action.key));
    race.traits.forEach(trait => {
      if (trait.resource) current.resourceKeys.add(trait.resource.key);
      if (trait.resource?.checkbox) current.checkboxes.add(trait.resource.checkbox);
      if (trait.feat) current.selects.add(`feat-choice-${trait.feat.key}`);
    });
    spellSourceKeys(id, race).forEach(key => current.spellSourceKeys.add(key));
  });
  const sorted = Object.fromEntries(Object.entries(current).map(([category, ids]) => [category, [...ids].sort()]));
  return compareBaseline(BASELINE_FILE, sorted, CATEGORIES, { update });
}

module.exports = { checkRaceIdBaseline };

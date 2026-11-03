// 持久化 ID 基準檔：內容檔中會寫進存檔、分享網址或跑團偏好的 ID，不見或改名就讓建置失敗。
// 公開內容包對照根目錄 class-id-baseline.json；私人內容包對照 content/private/class-id-baseline.json（不進公開 repo）。
// 確實要新增、移除或改名時（移除／改名須先處理舊資料相容），執行 npm run build -- --update-id-baseline。
"use strict";
const path = require("path");
const { ROOT } = require("../content/site-sources");
const { CONTENT_DIR } = require("../content/yaml");
const { compareBaseline } = require("../content/baseline");
const { getActions, getAppendixActions, getPickFields } = require("./load");

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
  attackNotes: "選項的攻擊備註（存進角色攻擊備註欄，取消勾選時以相同字串移除）",
  spellSourceKeys: "子職法術的來源識別碼（存進角色法術清單）",
  fields: "職業選擇的存檔欄位 ID（武器精通、職業額外語言、職業工具、選項戲法）"
});

function collectPersistedIds(classes) {
  const packs = {};
  const add = (pack, category, id) => {
    packs[pack] ||= Object.fromEntries(Object.keys(CATEGORIES).map(name => [name, new Set()]));
    packs[pack][category].add(id);
  };
  const addFeatures = (pack, features, classDef, subclass) => {
    const classId = classDef.id;
    for (const feature of features) {
      (feature.picks || []).forEach(pick => getPickFields(classDef, feature, pick).forEach(id => add(pack, "fields", id)));
      (feature.grants?.languages || []).forEach(language => add(pack, "fields", language.field));
      // 網站的子職法術來源識別碼為「subclass-職業-名稱-環階-法術-序號」，名稱改字會讓舊存檔的法術清單對不上。
      const sourceName = feature.spellSourceKey || subclass?.name;
      if (subclass && feature.spells) add(pack, "spellSourceKeys", `subclass-${classId}-${sourceName}`);
      (feature.spellsByChoice?.choices || []).forEach(choice => add(pack, "spellSourceKeys", `subclass-${classId}-${sourceName}・${choice.name}`));
      (feature.options || []).forEach(option => {
        add(pack, "options", option.id);
        // 選項給的自選戲法欄位（網站 getMissionCantripChoices／getClassFeatureCantripChoices 依相同規則命名）。
        const cantrips = option.grants?.cantrips;
        if (cantrips?.count === 1) add(pack, "fields", `${option.id}-cantrip`);
        else if (cantrips) for (let slot = 1; slot <= cantrips.count; slot += 1) add(pack, "fields", `class-${option.id}-cantrip-${slot}`);
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
    const tools = classDef.proficiencies?.tools;
    if (tools?.fixed) add(classDef.pack, "fields", tools.field);
    else if (tools) Array.from({ length: tools.count }, (_, index) => add(classDef.pack, "fields", `${tools.field}${index + 1}`));
    addFeatures(classDef.pack, classDef.features, classDef, null);
    getAppendixActions(classDef).forEach(action => [action.key, ...(action.legacyKeys || [])].forEach(key => add(classDef.pack, "actionKeys", key)));
    for (const subclass of classDef.subclasses) {
      add(subclass.pack, "subclasses", `${classDef.id}/${subclass.id}`);
      addFeatures(subclass.pack, subclass.features, classDef, subclass);
    }
  }
  return Object.fromEntries(Object.entries(packs).map(([pack, sets]) => [pack, Object.fromEntries(
    Object.entries(sets).map(([category, ids]) => [category, [...ids].sort()])
  )]));
}

// 回傳問題清單；update 為 true 時改寫基準檔並回傳空清單。
function checkIdBaseline(classes, { update = false } = {}) {
  return Object.entries(collectPersistedIds(classes))
    .flatMap(([pack, current]) => compareBaseline(BASELINE_FILES[pack], current, CATEGORIES, { update }));
}

module.exports = { checkIdBaseline, collectPersistedIds };

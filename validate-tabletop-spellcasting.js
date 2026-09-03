"use strict";

const assert = require("assert/strict");
const childProcess = require("child_process");
const fs = require("fs");
const vm = require("vm");

function loadSpellCatalog(source) {
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(`${source}\n;globalThis.__spellCatalog = SpellCatalog;`, sandbox);
  return sandbox.__spellCatalog;
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function assertSameValues(actual, expected, message) {
  assert.deepEqual(sorted(actual), sorted(expected), message);
}

function canParseDiceExpression(expression) {
  const compact = String(expression || "").replace(/\s+/g, "").toLowerCase();
  return /^\d+d(?:100|20|12|10|8|6|4)(?:[+-](?:\d+d(?:100|20|12|10|8|6|4)|\d+))*$/.test(compact);
}

const spellSource = fs.readFileSync("spell-list.js", "utf8");
const catalog = loadSpellCatalog(spellSource);
const spells = [...catalog.getAllSpells()];
const spellIds = spells.map(spell => spell.spellId);
const spellsByLevel = Object.fromEntries([0, 1, 2, 3, 4].map(level => [
  level,
  spells.filter(spell => spell.level === level).length
]));

assert.equal(spells.length, 215, "法術總數應為 215");
assert.deepEqual(spellsByLevel, { 0: 28, 1: 56, 2: 55, 3: 42, 4: 34 });
assert.equal(new Set(spellIds).size, spellIds.length, "spellId 不得重複");

const headSpellSource = childProcess.execFileSync(
  "git",
  ["show", "HEAD:spell-list.js"],
  { encoding: "utf8" }
);
const headCatalog = loadSpellCatalog(headSpellSource);
assertSameValues(
  spellIds,
  headCatalog.getAllSpells().map(spell => spell.spellId),
  "既有 spellId 不得遺失或新增意外 ID"
);

const expectedCantripIds = [
  "starry-wisp",
  "thunderclap",
  "vicious-mockery",
  "sacred-flame",
  "poison-spray",
  "produce-flame",
  "acid-splash",
  "chill-touch",
  "fire-bolt",
  "ray-of-frost",
  "shocking-grasp",
  "sorcerous-burst",
  "eldritch-blast"
];
const castableCantripIds = spells
  .filter(spell => spell.level === 0 && catalog.canCastFromTabletop(spell.spellId))
  .map(spell => spell.spellId);
assertSameValues(catalog.tabletopDamageCantripIds, expectedCantripIds, "戲法白名單必須恰好為指定 13 個");
assertSameValues(castableCantripIds, expectedCantripIds, "只有指定 13 個戲法可顯示施法按鈕");
assert.equal(
  spells.filter(spell => spell.level > 0 && catalog.canCastFromTabletop(spell.spellId)).length,
  187,
  "所有 1 環以上法術都必須可進入施法流程"
);
expectedCantripIds.forEach(spellId => {
  const lowLevel = [...catalog.resolveCastOutcomes(spellId, { characterLevel: 1 })];
  const highLevel = [...catalog.resolveCastOutcomes(spellId, { characterLevel: 5 })];
  assert(lowLevel.length > 0, `${spellId} 必須有戲法傷害 metadata`);
  assert(
    lowLevel.map(outcome => outcome.expression).join("|") !== highLevel.map(outcome => outcome.expression).join("|")
      || lowLevel.length !== highLevel.length,
    `${spellId} 必須依角色總等級處理 5 級成長`
  );
});
assert.equal(catalog.resolveCastOutcomes("produce-flame")[0].autoOnCast, true, "燃火術必須直接擲傷害");
assert.equal(catalog.resolveCastOutcomes("sorcerous-burst", { characterLevel: 5 }).length, 1, "術法衝擊只產生基礎傷害結果");

const ritualIdsFromText = spells
  .filter(spell => /^施法時間\s*[:：][^\n]*儀式/im.test(spell.desc))
  .map(spell => spell.spellId);
const structuredRitualIds = spells.filter(spell => catalog.isRitual(spell)).map(spell => spell.spellId);
assertSameValues(structuredRitualIds, ritualIdsFromText, "儀式結構化資料必須完整對應專案法術文字");

const upcastTextPattern = /(?:更高環階|提升法術位|高階法術位|提升\s*[:：])/;
const upcastIdsFromText = spells
  .filter(spell => spell.level > 0 && upcastTextPattern.test(spell.desc))
  .map(spell => spell.spellId);
const structuredUpcastIds = spells.filter(spell => catalog.hasUpcastEffect(spell)).map(spell => spell.spellId);
assertSameValues(structuredUpcastIds, upcastIdsFromText, "升環結構化資料必須完整對應專案法術文字");

const allowedDamageTypes = new Set(Object.keys(catalog.damageTypeLabels));
let outcomeCount = 0;
let autoOutcomeCount = 0;
spells.forEach(spell => {
  const metadata = catalog.getCastMetadata(spell.spellId);
  assert(metadata && typeof metadata === "object", `${spell.spellId} 缺少 cast metadata`);
  assert.equal(typeof metadata.ritual, "boolean", `${spell.spellId} ritual 必須為布林值`);
  assert.equal(typeof metadata.hasUpcastEffect, "boolean", `${spell.spellId} hasUpcastEffect 必須為布林值`);
  metadata.outcomes.forEach((outcome, outcomeIndex) => {
    outcomeCount += 1;
    assert(["damage", "healing", "temporary-hp"].includes(outcome.kind), `${spell.spellId} outcome ${outcomeIndex} kind 無效`);
    assert.equal(typeof outcome.autoOnCast, "boolean", `${spell.spellId} outcome ${outcomeIndex} autoOnCast 必須明確設定`);
    if (outcome.autoOnCast) autoOutcomeCount += 1;
    if (outcome.damageType) assert(allowedDamageTypes.has(outcome.damageType), `${spell.spellId} 傷害類型無效`);
    (outcome.damageTypes || []).forEach(type => assert(allowedDamageTypes.has(type), `${spell.spellId} 可選傷害類型無效`));
    (outcome.modifierTags || []).forEach(tag => assert.equal(typeof tag, "string", `${spell.spellId} modifier tag 無效`));
  });

  const damageTypes = catalog.getSelectableCastDamageTypes(spell.spellId);
  const selectedTypes = damageTypes.length ? damageTypes : [""];
  selectedTypes.forEach(damageType => {
    [1, 5].forEach(characterLevel => {
      const maximumLevel = Math.max(spell.level, 4);
      for (let effectiveLevel = spell.level; effectiveLevel <= maximumLevel; effectiveLevel += 1) {
        catalog.resolveCastOutcomes(spell.spellId, {
          characterLevel,
          effectiveLevel,
          damageType,
          spellcastingModifier: 3,
          modifiers: [{ id: "validation", label: "驗證加值", value: 2, frequency: "once" }]
        }).forEach((outcome, outcomeIndex) => {
          assert(
            outcome.expression ? canParseDiceExpression(outcome.expression) : Number.isFinite(outcome.fixed),
            `${spell.spellId} resolved outcome ${outcomeIndex} 無有效骰式或固定值`
          );
          if (outcome.autoOnCast) {
            assert(outcome.expression || Number.isFinite(outcome.fixed), `${spell.spellId} 自動結果不得為空白`);
          }
        });
      }
    });
  });
});
assertSameValues(
  spells
    .filter(spell => catalog.hasCastOutcomeTag(spell.spellId, "can-restore-other-creature-hit-points"))
    .map(spell => spell.spellId),
  ["cure-wounds", "healing-word", "prayer-of-healing", "mass-healing-word"],
  "只有能在施法時實際治療其他生物的法術可觸發神佑醫者"
);

const numericOutcomeCandidates = spells.filter(spell => (
  /\b\d+d(?:4|6|8|10|12|20|100)\b|\d+點(?:傷害|生命值)|受到\d+/.test(spell.desc || "")
));
const candidatesWithoutOutcome = numericOutcomeCandidates
  .filter(spell => !catalog.getCastMetadata(spell.spellId).outcomes.length)
  .map(spell => spell.spellId);
assertSameValues(candidatesWithoutOutcome, [
  "true-strike",
  "guidance",
  "resistance",
  "bless",
  "blink",
  "ray-of-enfeeblement",
  "confusion"
], "只有明確排除或非傷害／治療結果的數字法術可沒有 outcome metadata");

require("./tabletop-mode.js");
assert.equal(typeof globalThis.TabletopMode.restoreHitPoints, "function", "TabletopMode 必須提供共用 HP 回復 API");
const {
  applyHealingState,
  buildSorcererElementalAffinityEntry,
  buildSpellCastOptions,
  validateSpellCastSelection
} = globalThis.TabletopMode.logic;
assert.deepEqual(
  buildSorcererElementalAffinityEntry({
    className: "sorcerer",
    characterLevel: 6,
    damageType: "lightning"
  }),
  { label: "元素親和", detail: "抗性：閃電傷害減半。" },
  "6 級術士選擇元素親和傷害類型後，桌邊總覽必須顯示對應抗性"
);
assert.equal(
  buildSorcererElementalAffinityEntry({ className: "sorcerer", characterLevel: 5, damageType: "fire" }),
  null,
  "6 級前不得顯示元素親和抗性"
);
assert.equal(
  buildSorcererElementalAffinityEntry({ className: "wizard", characterLevel: 6, damageType: "fire" }),
  null,
  "非術士不得顯示元素親和抗性"
);
assert.equal(
  buildSorcererElementalAffinityEntry({ className: "sorcerer", characterLevel: 6, damageType: "" }),
  null,
  "尚未選擇傷害類型時不得顯示空白元素親和抗性"
);
assert.deepEqual(
  applyHealingState(8, 10, 5),
  { currentHp: 10, restoredHp: 2 },
  "共用 HP 回復邏輯不得超過最大生命值"
);
require("./tabletop-spells.js");
const { buildLifeDiscipleModifier, buildBlessedHealerRecovery } = globalThis.TabletopSpells.logic;
const lifeDiscipleAtLevel1 = buildLifeDiscipleModifier({
  className: "cleric",
  characterLevel: 3,
  castMethod: "slot",
  effectiveLevel: 1
});
assert.equal(lifeDiscipleAtLevel1.value, 3, "生命門徒以 1 環法術位施法時必須增加 3 點治療");
assert.equal(lifeDiscipleAtLevel1.kind, "healing", "生命門徒只能進入治療 modifier pipeline");
assert.equal(
  buildLifeDiscipleModifier({ className: "cleric", characterLevel: 3, castMethod: "free", effectiveLevel: 1 }),
  null,
  "免費施法不得套用生命門徒"
);
assert.equal(
  buildLifeDiscipleModifier({ className: "cleric", characterLevel: 2, castMethod: "slot", effectiveLevel: 1 }),
  null,
  "牧師 3 級前不得套用生命門徒"
);
assert.equal(
  buildLifeDiscipleModifier({ className: "druid", characterLevel: 3, castMethod: "slot", effectiveLevel: 1 }),
  null,
  "非牧師不得套用生命門徒"
);
assert.equal(
  catalog.resolveCastOutcomes("cure-wounds", {
    effectiveLevel: 1,
    spellcastingModifier: 3,
    modifiers: [lifeDiscipleAtLevel1]
  })[0].expression,
  "2d8+3+3",
  "生命門徒必須加入療傷術的自動治療骰式"
);
const lifeDiscipleAtLevel3 = buildLifeDiscipleModifier({
  className: "cleric",
  characterLevel: 5,
  castMethod: "slot",
  effectiveLevel: 3
});
assert.equal(
  catalog.resolveCastOutcomes("cure-wounds", {
    effectiveLevel: 3,
    spellcastingModifier: 3,
    modifiers: [lifeDiscipleAtLevel3]
  })[0].expression,
  "2d8+2d8+2d8+3+5",
  "生命門徒必須使用實際法術位環級計算 2＋環級"
);
assert.equal(
  catalog.resolveCastOutcomes("aid", { effectiveLevel: 2, modifiers: [lifeDiscipleAtLevel3] })[0].fixed,
  5,
  "生命門徒不得誤加到援助術的生命值上限提升"
);
assert.equal(
  catalog.resolveCastOutcomes("revivify", { effectiveLevel: 3, modifiers: [lifeDiscipleAtLevel3] })[0].fixed,
  1,
  "生命門徒不得誤加到回生術的固定復活生命值"
);
const blessedHealerAtLevel1 = buildBlessedHealerRecovery({
  className: "cleric",
  characterLevel: 6,
  castMethod: "slot",
  effectiveLevel: 1,
  restoresOtherCreatureHitPoints: true
});
assert.equal(blessedHealerAtLevel1.amount, 3, "神佑醫者以 1 環法術位治療其他生物後必須回復 3 HP");
assert.equal(
  buildBlessedHealerRecovery({
    className: "cleric",
    characterLevel: 6,
    castMethod: "slot",
    effectiveLevel: 4,
    restoresOtherCreatureHitPoints: true
  }).amount,
  6,
  "神佑醫者必須使用本次實際法術位環級"
);
assert.equal(
  buildBlessedHealerRecovery({
    className: "cleric",
    characterLevel: 5,
    castMethod: "slot",
    effectiveLevel: 1,
    restoresOtherCreatureHitPoints: true
  }),
  null,
  "牧師 6 級前不得套用神佑醫者"
);
assert.equal(
  buildBlessedHealerRecovery({
    className: "cleric",
    characterLevel: 6,
    castMethod: "free",
    effectiveLevel: 1,
    restoresOtherCreatureHitPoints: true
  }),
  null,
  "免費施法不得觸發神佑醫者"
);
assert.equal(
  buildBlessedHealerRecovery({
    className: "cleric",
    characterLevel: 6,
    castMethod: "slot",
    effectiveLevel: 1,
    restoresOtherCreatureHitPoints: false
  }),
  null,
  "沒有其他生物恢復生命值時不得觸發神佑醫者"
);
assert.equal(
  buildBlessedHealerRecovery({
    className: "druid",
    characterLevel: 6,
    castMethod: "slot",
    effectiveLevel: 1,
    restoresOtherCreatureHitPoints: true
  }),
  null,
  "非牧師不得觸發神佑醫者"
);
const freeAndSlots = buildSpellCastOptions({
  baseLevel: 1,
  castMode: "free-or-slot",
  fixedCastLevel: 1,
  hasUpcastEffect: false,
  freeControls: [{ id: "free-1", checked: false, disabled: false, label: "魔法學徒" }],
  slotGroups: [
    { level: 1, controls: [{ id: "slot-1-a", checked: false }] },
    { level: 2, controls: [{ id: "slot-2-a", checked: true }, { id: "slot-2-b", checked: false }] },
    { level: 3, controls: [{ id: "slot-3-a", checked: false }] }
  ]
});
assert.equal(freeAndSlots.defaultMethod, "free", "尚有免費次數時必須預設免費施法");
assert.equal(freeAndSlots.methods.find(method => method.id === "free").effectiveLevel, 1, "魔法學徒免費施法固定 1 環");
assert.deepEqual(freeAndSlots.slots.map(slot => slot.level), [1, 2, 3], "法術位候選須包含所有大於等於基礎環位的可用環位");
assert(freeAndSlots.slots.filter(slot => slot.level > 1).every(slot => slot.noExtraEffect), "無升環效果仍須保留高環選項並標示");
assert.equal(freeAndSlots.defaultSlotLevel, 1, "多環位預設最低合法環位");
assert.equal(
  validateSpellCastSelection(freeAndSlots, { method: "free", resourceId: "free-1" }).ok,
  true,
  "相同 canonical 免費格才可提交"
);
assert.equal(
  validateSpellCastSelection(freeAndSlots, { method: "free", resourceId: "free-old" }).reason,
  "resource-changed",
  "提交前資源 ID 變更時不得改扣其他格"
);
assert.equal(
  validateSpellCastSelection(freeAndSlots, { method: "slot", slotLevel: 2, resourceId: "slot-2-a" }).reason,
  "resource-changed",
  "提交前法術位已改由下一格候選時不得沿用舊格"
);
assert.equal(
  validateSpellCastSelection(freeAndSlots, { method: "slot", slotLevel: 2, resourceId: "slot-2-b" }).ok,
  true,
  "重新確認後可提交目前 canonical 法術位"
);

const singleSlot = buildSpellCastOptions({
  baseLevel: 2,
  slotGroups: [{ level: 3, controls: [{ id: "slot-3-only", checked: false }] }]
});
assert.equal(singleSlot.slots.length, 1, "單一可用環位應形成單一選項");
assert.equal(singleSlot.defaultSlotLevel, 3, "單一可用環位應直接選定");

const ritualOnly = buildSpellCastOptions({ baseLevel: 1, ritual: true, ritualAllowed: true });
assert.deepEqual(ritualOnly.methods.map(method => method.id), ["ritual"], "儀式可在沒有法術位時單獨施放");
assert.equal(validateSpellCastSelection(ritualOnly, { method: "ritual" }).resourceId, "", "儀式不消耗法術位");

const atWill = buildSpellCastOptions({
  baseLevel: 1,
  castMode: "at-will",
  ritual: true,
  ritualAllowed: true,
  freeControls: [{ id: "free-at-will", checked: false }],
  slotGroups: [{ level: 1, controls: [{ id: "slot-at-will", checked: false }] }]
});
assert.deepEqual(atWill.methods.map(method => method.id), ["at-will"], "隨意來源不得重複提供免費、儀式或法術位方式");
assert.equal(validateSpellCastSelection(atWill, { method: "at-will" }).resourceId, "", "隨意施法不消耗資源");

const eldritchAt5 = catalog.resolveCastOutcomes("eldritch-blast", {
  characterLevel: 5,
  modifiers: [{ id: "agonizing", label: "苦痛魔爆", value: 3, frequency: "each-roll" }]
});
assert.equal(eldritchAt5.length, 2, "5 級魔能爆必須分成兩束");
assert(eldritchAt5.every(outcome => outcome.expression === "1d10+3"), "苦痛魔爆須套用到每束獨立傷害骰");
const eldritchOnce = catalog.resolveCastOutcomes("eldritch-blast", {
  characterLevel: 5,
  modifiers: [{ id: "once", label: "一次加值", value: 3, frequency: "once" }]
});
assert.deepEqual([...eldritchOnce].map(outcome => outcome.expression), ["1d10+3", "1d10"], "一次型 modifier 不得對多束重複加值");
assert.equal(catalog.resolveCastOutcomes("lightning-bolt")[0].damageType, "lightning");
assert.equal(catalog.resolveCastOutcomes("thunderwave")[0].damageType, "thunder");
assert.notEqual(catalog.damageTypeLabels.lightning, catalog.damageTypeLabels.thunder, "閃電與雷鳴必須為不同 canonical 類型");
const lightningAffinity = [{
  id: "elemental-affinity",
  label: "元素親和",
  value: 3,
  frequency: "once",
  damageType: "lightning"
}];
assert.equal(
  catalog.resolveCastOutcomes("lightning-bolt", { modifiers: lightningAffinity })[0].expression,
  "8d6+3",
  "元素親和必須套用到 canonical lightning"
);
assert.equal(
  catalog.resolveCastOutcomes("thunderwave", { modifiers: lightningAffinity })[0].expression,
  "2d8",
  "元素親和 lightning 不得錯套到 thunder"
);

const tabletopSpellSource = fs.readFileSync("tabletop-spells.js", "utf8");
const tabletopModeSource = fs.readFileSync("tabletop-mode.js", "utf8");
const diceSource = fs.readFileSync("dice-roller.js", "utf8");
const indexSource = fs.readFileSync("index.html", "utf8");
assert(!/window\.(?:confirm|prompt)\s*\(/.test(tabletopSpellSource), "施法流程不得使用瀏覽器原生對話框");
assert(tabletopSpellSource.includes("commitSpellCastResource"), "桌邊法術必須透過 TabletopMode 提交資源");
assert(tabletopSpellSource.includes('entry.spellClass === "cleric"'), "牧師強力施法必須核對實際法表來源");
assert(tabletopSpellSource.includes('entry.spellClass === "druid"'), "德魯伊強力施法必須核對實際法表來源");
assert(tabletopSpellSource.includes('entry.spellClass === "warlock"'), "苦痛魔爆必須核對實際契術師法術來源");
assert(tabletopModeSource.includes("resourceId !== String(selection.resourceId"), "資源提交必須驗證原 canonical ID");
assert(diceSource.includes("rollExpressionsInModal"), "DiceRoller 必須提供公開自動擲骰 modal API");
assert(diceSource.includes("if (!toggle.checked)"), "自動擲骰不得繞過停用狀態");
assert(indexSource.includes("SpellCatalog.isRitual(spell)"), "儀式選項不得由描述文字臨時猜測");
assert(indexSource.includes('row.dataset.ritualAllowed = String(spec.level === 1)'), "魔法學徒一環法術必須保留永遠準備的儀式能力");
assert(indexSource.includes("getAgonizingBlastSelectId"), "苦痛魔爆每個祈喚項目必須有穩定下拉 ID");
assert(indexSource.includes("accepted.has(previous)"), "苦痛魔爆必須清除重複戲法選擇");
assert(indexSource.includes("isAgonizingBlastSelectId(id)"), "匯入時必須延後還原苦痛魔爆下拉值");
assert(indexSource.includes("applyAgonizingBlastState(data)"), "苦痛魔爆下拉值必須納入還原流程");

console.log(JSON.stringify({
  spells: spells.length,
  levels: spellsByLevel,
  uniqueSpellIds: new Set(spellIds).size,
  leveledCastable: spells.filter(spell => spell.level > 0 && catalog.canCastFromTabletop(spell.spellId)).length,
  castableCantrips: castableCantripIds.length,
  rituals: structuredRitualIds.length,
  upcastSpells: structuredUpcastIds.length,
  spellsWithOutcomes: spells.filter(spell => catalog.getCastMetadata(spell.spellId).outcomes.length).length,
  outcomes: outcomeCount,
  autoOnCastOutcomes: autoOutcomeCount,
  status: "ok"
}, null, 2));

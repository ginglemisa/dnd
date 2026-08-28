const test = require("node:test");
const assert = require("node:assert/strict");

require("./tabletop-mode.js");

const {
  appendConcentrationSaveReminder,
  calculateConcentrationSaveDc,
  normalizeConcentrationSpellId,
  normalizeCustomResources
} = globalThis.TabletopMode.logic;

test("專注受傷豁免 DC 取傷害一半向下、最低 10、最高 30", () => {
  assert.equal(calculateConcentrationSaveDc(1), 10);
  assert.equal(calculateConcentrationSaveDc(20), 10);
  assert.equal(calculateConcentrationSaveDc(21), 10);
  assert.equal(calculateConcentrationSaveDc(22), 11);
  assert.equal(calculateConcentrationSaveDc(60), 30);
  assert.equal(calculateConcentrationSaveDc(100), 30);
});

test("只有專注中受傷才附加體質豁免提醒", () => {
  globalThis.TabletopMode.applyState({ concentrationSpellId: "bless" });
  assert.equal(
    appendConcentrationSaveReminder("受到 15 點傷害。", 15),
    "受到 15 點傷害。專注中受傷，請進行體質豁免，難度 10。"
  );

  globalThis.TabletopMode.applyState({ concentrationSpellId: "" });
  assert.equal(
    appendConcentrationSaveReminder("受到 15 點傷害。", 15),
    "受到 15 點傷害。"
  );
});

test("舊存檔缺少第二階段資料時使用安全預設", () => {
  assert.equal(normalizeConcentrationSpellId(undefined), "");
  assert.deepEqual(normalizeCustomResources(undefined), []);
});

test("自訂資源匯入會限制數值並修復重複 ID", () => {
  const resources = normalizeCustomResources([
    { id: "focus", label: "專注點", current: 9, max: 5, recoveryNote: "短休回滿" },
    { id: "focus", label: "狂暴", current: -3, max: 0 },
    { id: "bad id", label: "  戰技骰  ", current: 2, max: 4 },
    { id: "ignored", label: "", current: 1, max: 1 },
    null
  ]);

  assert.equal(resources.length, 3);
  assert.deepEqual(resources[0], {
    id: "focus",
    label: "專注點",
    current: 5,
    max: 5,
    recoveryNote: "短休回滿"
  });
  assert.equal(resources[1].id, "focus-2");
  assert.equal(resources[1].current, 0);
  assert.equal(resources[1].max, 1);
  assert.match(resources[2].id, /^custom-/);
});

test("異常專注 ID 僅正規化字串而不靜默清除未知法術", () => {
  assert.equal(normalizeConcentrationSpellId("  removed-spell  "), "removed-spell");
  assert.equal(normalizeConcentrationSpellId({ spellId: "removed-spell" }), "");
});

test("既有戰鬥狀態與第二階段資料可經共用 collect/apply API 往返", () => {
  globalThis.TabletopMode.applyState({
    temporaryHp: 4,
    deathSaveSuccesses: 1,
    deathSaveFailures: 2,
    exhaustionLevel: 1,
    concentrationSpellId: "removed-spell",
    customResources: [
      { id: "focus", label: "專注點", current: 3, max: 5, recoveryNote: "短休回滿" }
    ]
  });

  const state = globalThis.TabletopMode.collectState();
  assert.equal(state.temporaryHp, 4);
  assert.equal(state.deathSaveSuccesses, 1);
  assert.equal(state.deathSaveFailures, 2);
  assert.equal(state.exhaustionLevel, 1);
  assert.equal(state.concentrationSpellId, "removed-spell");
  assert.deepEqual(state.customResources, [
    { id: "focus", label: "專注點", current: 3, max: 5, recoveryNote: "短休回滿" }
  ]);
});

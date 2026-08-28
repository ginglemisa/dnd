"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const SOURCE = fs.readFileSync(path.join(__dirname, "quick-build.js"), "utf8");
const STORAGE_KEY = "dnd.quickBuildDraft.v1";

function loadQuickBuild(initialValue = null) {
  const values = new Map();
  if (initialValue !== null) values.set(STORAGE_KEY, initialValue);
  const removed = [];
  const storage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); return true; },
    removeItem(key) { removed.push(key); values.delete(key); return true; }
  };
  const context = {
    console,
    structuredClone,
    localStorage: storage,
    document: { addEventListener() {} },
    CSS: { escape: String },
    requestAnimationFrame() {}
  };
  context.window = context;
  context.globalThis = context;
  context.dndStorage = storage;
  vm.createContext(context);
  vm.runInContext(SOURCE, context, { filename: "quick-build.js" });
  return { api: context.quickBuild, values, removed };
}

test("creates only the current draft schema when storage is empty", () => {
  const { api } = loadQuickBuild();
  const draft = api.getDraft();

  assert.equal(typeof api.openSpellPrepareDetail, "function");
  assert.equal(draft.version, 12);
  assert.deepEqual(Object.keys(draft.ui).sort(), ["confirmedStepSignatures", "currentStepId", "view"]);
  assert.equal("currentStep" in draft, false);
  assert.equal("stage" in draft.choices.classOptions, false);
  assert.equal("summaryConfirmed" in draft.choices.levelOne, false);
});

test("discards stale draft versions without migration", () => {
  const stale = JSON.stringify({ version: 11, choices: { background: "sage" } });
  const { api, values, removed } = loadQuickBuild(stale);

  assert.equal(api.getDraft().version, 12);
  assert.equal(api.getDraft().choices.background, null);
  assert.equal(values.has(STORAGE_KEY), false);
  assert.deepEqual(removed, [STORAGE_KEY]);
});

test("discards invalid JSON safely", () => {
  const { api, values, removed } = loadQuickBuild("{not-json");

  assert.equal(api.getDraft().version, 12);
  assert.equal(values.has(STORAGE_KEY), false);
  assert.deepEqual(removed, [STORAGE_KEY]);
});

test("normalizes malformed fields in a current-version draft", () => {
  const malformed = JSON.stringify({
    version: 12,
    ui: "bad",
    choices: "bad",
    selections: [],
    acquisitions: "bad"
  });
  const { api, removed } = loadQuickBuild(malformed);
  const draft = api.getDraft();

  assert.equal(draft.version, 12);
  assert.equal(draft.ui.currentStepId, "background");
  assert.equal(draft.choices.background, null);
  assert.ok(Array.isArray(draft.acquisitions.skills));
  assert.deepEqual(removed, []);
});

test("saves and reloads a canonical current draft", () => {
  const first = loadQuickBuild();
  assert.equal(first.api.saveDraft(), true);
  const saved = first.values.get(STORAGE_KEY);
  const persisted = JSON.parse(saved);

  assert.equal(persisted.version, 12);
  assert.equal("currentStep" in persisted, false);
  assert.equal("confirmationSchemaVersion" in persisted.ui, false);

  const second = loadQuickBuild(saved);
  assert.deepEqual(second.api.getDraft(), persisted);
});

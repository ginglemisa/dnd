const test = require("node:test");
const assert = require("node:assert/strict");

require("./spell-list.js");

test("SpellCatalog 由 canonical 說明判定專注法術", () => {
  assert.equal(globalThis.SpellCatalog.isConcentration("bless"), true);
  assert.equal(globalThis.SpellCatalog.isConcentration(
    globalThis.SpellCatalog.getSpell("light")
  ), false);
  assert.equal(globalThis.SpellCatalog.isConcentration("missing-spell"), false);
});

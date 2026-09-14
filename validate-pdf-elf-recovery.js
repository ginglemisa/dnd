"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const sandbox = {
  window: null,
  classFeatures: {},
  raceFeatures: {},
  detailedBackgroundFeatures: {},
  BASE_LANGUAGE_OPTIONS: [],
  EXTRA_LANGUAGE_OPTIONS: []
};
sandbox.window = sandbox;
vm.runInNewContext(fs.readFileSync("pdf-field-map.js", "utf8"), sandbox);

function getElfFeatures(level) {
  return sandbox.buildPdfFieldPayload({
    race: "elf",
    level: String(level),
    "elf-lineage": "high_elf"
  }, {
    elfLineage: "high_elf"
  }).specie_features1;
}

assert.equal(getElfFeatures(1).includes("長休後環法恢復"), false);
assert.equal(getElfFeatures(2).includes("長休後環法恢復"), false);
assert.equal(getElfFeatures(3).includes("長休後環法恢復"), true);
assert.equal(getElfFeatures(5).includes("長休後環法恢復"), true);

console.log("Elf PDF leveled-spell recovery visibility passed.");

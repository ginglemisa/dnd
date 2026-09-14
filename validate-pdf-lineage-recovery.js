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

function getRaceFeatures(race, level, lineageOptions) {
  return sandbox.buildPdfFieldPayload({
    race,
    level: String(level)
  }, lineageOptions).specie_features1;
}

const lineageRaces = [
  ["elf", { elfLineage: "high_elf" }],
  ["tiefling", { tieflingLegacy: "infernal" }]
];

for (const [race, options] of lineageRaces) {
  assert.equal(getRaceFeatures(race, 1, options).includes("長休後環法恢復"), false);
  assert.equal(getRaceFeatures(race, 2, options).includes("長休後環法恢復"), false);
  assert.equal(getRaceFeatures(race, 3, options).includes("長休後環法恢復"), true);
  assert.equal(getRaceFeatures(race, 5, options).includes("長休後環法恢復"), true);
}

console.log("Elf and tiefling PDF leveled-spell recovery visibility passed.");

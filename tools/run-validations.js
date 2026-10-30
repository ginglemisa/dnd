// npm test：依序執行全部既有回歸腳本（與 AGENTS.md「回歸腳本對照」相同），任一失敗即結束碼 1。
// 用法：npm test，或 npm test -- validate-ui.js validate-spellbook.js 只跑指定腳本。
"use strict";
const { spawnSync } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SCRIPTS = [
  "validate-tabletop-spellcasting.js",
  "validate-action-metadata.js",
  "validate-tabletop-druid.js",
  "validate-spellbook.js",
  "validate-spell-search.js",
  "validate-ability-roll.js",
  "validate-onboarding.js",
  "validate-tabletop-rest.js",
  "validate-ui.js"
];

const selected = process.argv.slice(2);
const unknown = selected.filter(name => !SCRIPTS.includes(name));
if (unknown.length) {
  console.error(`不認得的腳本：${unknown.join("、")}`);
  process.exit(1);
}
const results = [];
for (const script of selected.length ? selected : SCRIPTS) {
  console.log(`\n▶ node ${script}`);
  const started = Date.now();
  const { status } = spawnSync(process.execPath, [script], { cwd: ROOT, stdio: "inherit" });
  results.push({ script, ok: status === 0, seconds: Math.round((Date.now() - started) / 1000) });
}
console.log("\n結果：");
results.forEach(({ script, ok, seconds }) => console.log(`  ${ok ? "✔" : "✘"} ${script}（${seconds} 秒）`));
process.exitCode = results.every(result => result.ok) ? 0 : 1;

// npm test：先 npm run build 產生職業資料（package.json），再依序執行全部既有回歸腳本（與 AGENTS.md「驗證」的腳本表相同），任一失敗即結束碼 1。
// 用法：npm test，或 npm test -- validate-ui.js validate-spellbook.js 只跑指定腳本。
// 沒有私人 repo（例如 fork）時加 --no-private-assets，只略過需要官方角色卡檔案的檢查（見 tools/copy-private-assets.js）。
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

const privateAssets = require("./copy-private-assets");
const args = process.argv.slice(2);
const noPrivateAssets = args.includes(privateAssets.SKIP_FLAG);
const selected = args.filter(arg => arg !== privateAssets.SKIP_FLAG);
const unknown = selected.filter(name => !SCRIPTS.includes(name));
if (unknown.length) {
  console.error(`不認得的腳本：${unknown.join("、")}`);
  process.exit(1);
}
try {
  const copied = privateAssets.copyPrivateAssets();
  if (copied.length) console.log(`已從私人 repo 補上：${copied.join("、")}`);
} catch (error) {
  if (!noPrivateAssets) {
    console.error(`官方角色卡的測試需要私人 repo 的檔案。${error.message}\n\n${privateAssets.MISSING_HELP}`);
    process.exit(1);
  }
}
const env = { ...process.env };
delete env[privateAssets.SKIP_ENV];
if (noPrivateAssets) {
  const missing = privateAssets.missingPrivateAssets();
  if (missing.length) {
    env[privateAssets.SKIP_ENV] = "1";
    console.log(`沒有私人 repo 的檔案（${missing.join("、")}），略過需要官方角色卡檔案的檢查；其他測試照常執行。`);
  } else {
    console.log(`官方角色卡的檔案都在，${privateAssets.SKIP_FLAG} 不生效，照常執行全部檢查。`);
  }
}
const results = [];
for (const script of selected.length ? selected : SCRIPTS) {
  console.log(`\n▶ node ${script}`);
  const started = Date.now();
  const { status } = spawnSync(process.execPath, [script], { cwd: ROOT, stdio: "inherit", env });
  results.push({ script, ok: status === 0, seconds: Math.round((Date.now() - started) / 1000) });
}
console.log("\n結果：");
results.forEach(({ script, ok, seconds }) => console.log(`  ${ok ? "✔" : "✘"} ${script}（${seconds} 秒）`));
if (env[privateAssets.SKIP_ENV]) console.log("\n略過（沒有私人 repo 的檔案）：validate-ui.js 的官方角色卡 PDF 匯出；validate-spellbook.js 的官方角色卡選項改用模擬的檔案存在回應。");
process.exitCode = results.every(result => result.ok) ? 0 : 1;

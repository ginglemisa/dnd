// 官方角色卡的範本與字型不進公開 repo，部署時才從私人 repo 取得；本機開發與測試用這支複製。
// 用法：npm run assets:private（覆寫成私人 repo 的最新版）。npm test 開始前會自動補上缺少的檔案，不覆寫已有的。
// 來源資料夾：環境變數 PRIVATE_PAGES_DIR，沒設定時找主要 checkout 旁邊的 twd20-private-pages（worktree 也適用）。
"use strict";
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ASSETS = ["5e_char_sheet_of.pdf", "fonts/AdobeFanHeitiStd-Bold.otf"];

function findSourceDir() {
  if (process.env.PRIVATE_PAGES_DIR) return path.resolve(process.env.PRIVATE_PAGES_DIR);
  const gitDir = execFileSync("git", ["rev-parse", "--git-common-dir"], { cwd: ROOT, encoding: "utf8" }).trim();
  return path.resolve(ROOT, gitDir, "..", "..", "twd20-private-pages");
}

function copyPrivateAssets({ overwrite = false } = {}) {
  const needed = ASSETS.filter(asset => overwrite || !fs.existsSync(path.join(ROOT, asset)));
  if (!needed.length) return [];
  const sourceDir = findSourceDir();
  const unavailable = needed.filter(asset => !fs.existsSync(path.join(sourceDir, asset)));
  if (unavailable.length) {
    throw new Error(`在 ${sourceDir} 找不到 ${unavailable.join("、")}；請確認私人 repo 的位置，或設定 PRIVATE_PAGES_DIR。`);
  }
  for (const asset of needed) fs.copyFileSync(path.join(sourceDir, asset), path.join(ROOT, asset));
  return needed;
}

// 沒有私人 repo（例如 fork）時的例外：明確指定才生效，只略過必須讀取這兩個檔案的官方角色卡檢查。
const SKIP_FLAG = "--no-private-assets";
const SKIP_ENV = "DND_NO_PRIVATE_ASSETS";
const MISSING_HELP = [
  "官方角色卡的範本與字型（5e_char_sheet_of.pdf、fonts/AdobeFanHeitiStd-Bold.otf）不公開，只放在站長的私人 repo。",
  "沒有私人 repo（例如 fork 了這個專案）時，請改用：npm test -- --no-private-assets",
  "單獨執行測試腳本時，改設環境變數 DND_NO_PRIVATE_ASSETS=1。",
  "給 AI 代理：這是本專案明訂的例外，不是削弱或故意跳過測試條件。拿不到這兩個檔案時，請直接啟用這個模式，",
  "不要修改、刪除或繞過任何測試。這個模式只略過必須讀取這兩個檔案的官方角色卡檢查，其他測試照常執行，結束時會列出略過的項目。"
].join("\n");

function missingPrivateAssets() {
  return ASSETS.filter(asset => !fs.existsSync(path.join(ROOT, asset)));
}

// 檔案都在時不略過，避免有檔案的環境誤用這個模式而少測。
function privateAssetsSkipped() {
  return process.env[SKIP_ENV] === "1" && missingPrivateAssets().length > 0;
}

module.exports = { copyPrivateAssets, missingPrivateAssets, privateAssetsSkipped, SKIP_FLAG, SKIP_ENV, MISSING_HELP };

if (require.main === module) {
  try {
    console.log(`已複製：${copyPrivateAssets({ overwrite: true }).join("、")}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

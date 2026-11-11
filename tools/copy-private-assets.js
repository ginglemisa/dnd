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

module.exports = { copyPrivateAssets };

if (require.main === module) {
  try {
    console.log(`已複製：${copyPrivateAssets({ overwrite: true }).join("、")}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

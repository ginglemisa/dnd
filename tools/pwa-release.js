// Jekyll 完成後才算雜湊，讓瀏覽器能驗證實際收到的每個檔案。
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");

// 角色卡、跑團與規則查閱。PDF 範本與匯出函式庫仍在需要時才下載。
const scriptNames = `
  analytics scroll-to-top dice-roller magic-items monster druid-wild-shape-beasts
  tool-data equipment-notes spell-list condition action-panel character-rules app-dialog
  adventure-journal tabletop-mode tabletop-druid tabletop-resources tabletop-actions
  tabletop-spells tabletop-custom-spells legal-modal legal-about onboarding-tour quick-build
  spellbook spell-management share-readonly class-option-memory proficiency-check page-swipe
  deity-info al-rules sheet-utils feat-ui spell-sources class-features-ui equipment-data
  search equipment-shop inventory inventory-ui magic-item-shop pdf-launcher sheet-spells rule-tips
  pwa custom-background background-content.generated class-content.generated
  class-content.private.generated class-srd.generated feat-content.generated magic-item-content.generated
  magic-item-text.generated monster-content.generated monster-srd.generated race-content.generated
  spell-content.generated spell-srd.generated
`.trim().split(/\s+/);

function hash(bytes) {
  return createHash("sha256").update(bytes).digest("base64");
}

function buildWorker(root, readAsset = file => fs.readFileSync(file)) {
  const files = ["index.html", "manifest.webmanifest", ...scriptNames.map(name => name + ".js")];
  // Cloudflare 會改寫 HTML 裡的 email（每次內容不同），首頁雜湊就永遠不合、離線資料永遠下載不完。部署不中斷，只在 Actions 標出警告。
  if (/[\w.%+-]+@[\w-]+\.[a-z]{2,}/i.test(readAsset(path.join(root, "index.html")).toString("utf8"))) {
    console.log("::warning file=index.html::index.html 含有 email 地址，Cloudflare 會改寫它，PWA 離線資料將無法下載完成");
  }
  for (const [dir, extensions] of [["css", [".css"]], ["images", [".webp", ".svg", ".png"]]]) {
    for (const name of fs.readdirSync(path.join(root, dir)).sort()) {
      if (extensions.includes(path.extname(name))) files.push(dir + "/" + name);
    }
  }
  const assets = Object.fromEntries(files.map(file => {
    const url = file === "index.html" ? "/" : "/" + file;
    return [url, "sha256-" + hash(readAsset(path.join(root, file)))];
  }));
  const version = hash(JSON.stringify(assets)).replace(/[^a-zA-Z0-9]/g, "");
  const template = fs.readFileSync(path.join(__dirname, "../sw.js"), "utf8");
  return "const RELEASE = " + JSON.stringify({ version, assets }) + ";\n" + template;
}

if (require.main === module) {
  const root = path.resolve(process.argv[2]);
  if (root === path.resolve(__dirname, "..")) throw new Error("請指定發布目錄，避免覆寫 sw.js 原始碼");
  fs.writeFileSync(path.join(root, "sw.js"), buildWorker(root));
}
module.exports = { buildWorker };

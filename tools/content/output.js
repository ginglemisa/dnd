// 寫出網站讀取的產生檔（*.generated.js）：樣板字串跳脫、內容沒變時不改檔案、index.html 載入標籤的快取版本（?v=）。
// 各種內容（職業等）共用。
"use strict";
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { ContentError } = require("./errors");

// 樣板字串：保留 HTML 換行，方便閱讀與比對差異。
const template = text => `\`${text.replace(/[\\`]/g, "\\$&").replace(/\$\{/g, "\\${")}\``;

function writeIfChanged(file, source, changed) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n") : null;
  if (current === source) return;
  fs.writeFileSync(file, source);
  changed.push(path.basename(file));
}

// 快取版本：產生檔內容的雜湊。
const contentVersion = source => crypto.createHash("sha256").update(source).digest("hex").slice(0, 12);

const versionedScriptTag = name => new RegExp(`(<script src="${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\?v=)([^"]*)(")`, "g");

// 把 html 中 <script src="name?v=…"> 的版本換成 version；標籤須剛好一個。回傳換好的 html。
function stampScriptVersion(html, name, version) {
  const pattern = versionedScriptTag(name);
  const tags = html.match(pattern) || [];
  if (tags.length !== 1) throw new ContentError(`index.html 應有一個 <script src="${name}?v=…"> 標籤（目前 ${tags.length} 個）`);
  return html.replace(pattern, `$1${version}$3`);
}

module.exports = { template, writeIfChanged, contentVersion, stampScriptVersion };

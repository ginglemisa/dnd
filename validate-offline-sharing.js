"use strict";

// Run after build-offline-nopdf.ps1. URL mocks verify path independence, not
// operating-system file-provider permissions or browser storage support.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const html = fs.readFileSync(path.join(__dirname, "TWD20-offline.html"), "utf8");

assert(!html.includes("twd20-url.ginglemisa.workers.dev/api/create"));
assert(!html.includes("async function createShortShareUrl("));
assert(!html.includes("可修改後輸出 PDF，或匯出 JSON 保存。"));
for (const match of html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
  new vm.Script(match[1]);
}

const start = html.indexOf("let exitShareDialogPending = false;");
const end = html.indexOf("function downloadStateAsJson()", start);
assert(start >= 0 && end > start, "offline lifecycle and sharing functions retained");
const script = new vm.Script(html.slice(start, end));
const paths = [
  "file:///C:/Characters/TWD20-offline.html",
  "file:///home/player/TWD20-offline.html",
  "file:///Users/player/My%20Characters/TWD20-offline.html",
  "file:///storage/emulated/0/Download/TWD20-offline.html",
  "file:///private/var/mobile/Containers/Data/Application/example/TWD20-offline.html",
  "content://com.android.externalstorage.documents/document/primary%3ADownload%2FTWD20-offline.html"
];

(async () => {
  for (const base of paths) {
    let copied = "";
    let confirmed = false;
    let replaced = "";
    let reloads = 0;
    const context = vm.createContext({
      URL,
      SHARE_MODE: false,
      location: { href: `${base}#s2=original`, reload() { reloads++; } },
      history: { replaceState(_state, _title, url) { replaced = url; } },
      document: { getElementById() { return {}; } },
      navigator: { clipboard: { async writeText(value) { copied = value; } } },
      collectShareState() { return { str: "17" }; },
      async encodeStateToHash(data) {
        assert.equal(data.str, "17");
        return "#s2=current";
      },
      window: { AppDialog: {
        notify() {},
        async requestDecision() { return confirmed; },
        async showCopy(options) { copied = options.copyValue; }
      } }
    });
    script.runInContext(context);
    await context.copyShareUrl();
    assert.equal(copied, "https://twd20.com/#s2=current", base);
    context.navigator.clipboard.writeText = async () => { throw new Error("clipboard denied"); };
    copied = "";
    await context.copyShareUrl();
    assert.equal(copied, "https://twd20.com/#s2=current", "manual copy fallback");
    context.SHARE_MODE = true;
    copied = "";
    await context.copyShareUrl();
    assert.equal(copied, "", "sharing disabled in share mode");
    await context.exitShareMode({ preventDefault() {} });
    assert.equal(replaced, "", "cancel does not navigate");
    assert.equal(reloads, 0);
    confirmed = true;
    await context.exitShareMode({ preventDefault() {} });
    assert.equal(replaced, base, "exit preserves current path");
    assert.equal(reloads, 1);
    assert.equal(context.SHARE_MODE, true, "autosave remains blocked until reload");
  }
  console.log("Offline sharing: syntax, no short URL API, six URL forms, clipboard fallback, share guard and confirmed exit passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });

# SRD 法術譯文工具

`content/srd/spells/<spellId>.yaml` 收錄 SRD 5.2.1 全部 339 個法術（戲法 27、1–9 環 312）。每個檔的 `srd` 區塊是逐句直譯的繁體中文（網站法術詳情的「SRD 版」），`en` 區塊是 SRD 英文原文（只供校對，建置不會送到網站）。格式見 [content/README.md](../../content/README.md) 的「法術」。

這裡的工具只檢查譯文；格式、欄位一致與網站版由 `npm run build` 檢查。

| 檔案 | 用途 |
| --- | --- |
| `validate.js` | 譯文檢查：禁用字與用語、表格列數、段落與斜體小標數、骰式與數字（譯文 vs 英文）、網站版標籤是否沿用；`--srd` 另與 SRD 英文逐項比對 |
| `parse-srd.js` | 解析 SRD 5.2.1 英文 Markdown（`spells.md`），供 `validate.js --srd` 比對 |
| `glossary.md` | 翻譯術語表（單位、學派、傷害類型、狀態、規則用語），與網站一致 |
| `reviewed-suspects.json` | 人工確認過、不需修改的疑點與理由；`validate.js` 不再列出，清單項目不再出現時會提示刪除 |

```bash
node tools/spell-reference/validate.js --srd <SRD 5.2.1 的 spells.md 路徑>
```

「疑點」只是提示（例如骰式次數與英文不同、網站版的標籤在譯文沒有出現），需要人工確認；錯誤才會讓指令失敗，加 `--strict` 則疑點也算失敗。確認不需修改的疑點，把 `疑點 ` 後面的整段文字連同理由加進 `reviewed-suspects.json`。

## 翻譯與比對的約定

- 譯文由 SRD 英文直接逐句直譯，用語見 `glossary.md`。網站已有的法術沿用網站的法術名稱與效果名稱。
- 英文原文照 SRD 不改（含原文的排版殘留，例如 mind-spike 的段落斷句、bestow-curse 多出的「•」）。
- 職業清單：網站已有的法術，頂層 `classes` 是網站法表（網站只做到 8 級，聖騎士、遊俠刻意沒列三環以上法術）；與 SRD 不同時，SRD 的清單寫在 `srd.classes`。`--srd` 比對 `srd.classes`，沒寫時比對 `classes`。只供查閱的法術直接以 `classes` 寫 SRD 清單。
- 植物滋長在 SRD 的施法時間附有效果名稱（Overgrowth／Enrichment），內容檔不另存，名稱寫在說明內。

SRD 原文為 CC BY 4.0（Wizards of the Coast），授權與 Attribution 見 README。

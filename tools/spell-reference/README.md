# SRD 法術參考資料工具

`content/srd/spells/<spellId>.yaml` 收錄 SRD 5.2.1 全部 339 個法術（戲法 27、1–9 環 312）：結構化欄位、SRD 英文原文（`en`）與逐句直譯的繁體中文（`zh`）。**網站目前不讀取這個資料夾**，`npm run build` 也不掃描它；格式定義在 [content/schema/spell.schema.json](../../content/schema/spell.schema.json)，日後網站版的法術資料可併入同一個檔案。

## 檔案格式

```yaml
spellId: fireball          # 網站已有的法術沿用網站 spellId；其餘由 SRD 英文名轉 kebab-case
source: srd
level: 3                   # 0 = 戲法
school: evocation
classes: [ sorcerer, wizard ]
ritual: false
concentration: false
castingTime:               # 可多項；「動作或儀式」是 action、ritual 兩項
  - { unit: action }       # 反應、附贈動作的觸發條件與植物滋長的效果名稱放在 note: { en, zh }
range: { type: distance, amount: 150, unit: feet }
components: { v: true, s: true, m: true }
duration: { type: instantaneous }   # concentration 為 true 時 duration 是 time + upTo
en: { name: …, material: …, body: … }   # SRD 英文原文（段落以空行分隔的 GFM Markdown）
zh: { name: …, material: …, body: … }   # 繁體中文直譯；用語見 glossary.md
```

## 腳本

| 腳本 | 用途 |
| --- | --- |
| `parse-srd.js` | 解析 SRD 5.2.1 英文 Markdown（`spells.md`），拆出結構化欄位與英文內文 |
| `write-yaml.js`、`apply-translations.js` | 把翻譯 JSON 與 SRD 英文合併，寫出 YAML |
| `validate.js` | 檢查：schema、欄位一致、禁用字與用語、骰式與數字比對；`--srd` 另與 SRD 英文逐項比對；`--site` 另核對網站既有法術 |
| `glossary.md` | 翻譯術語表（單位、學派、傷害類型、狀態、規則用語），與網站一致 |

```bash
node tools/spell-reference/validate.js --srd <SRD 5.2.1 的 spells.md 路徑> --site
```

「疑點」只是提示（例如骰式次數與英文不同，需要人工確認），錯誤才會讓指令失敗；加 `--strict` 則疑點也算失敗。

SRD 原文為 CC BY 4.0（Wizards of the Coast），授權與 Attribution 見 README。

## 翻譯流程紀錄

- 翻譯做法：由 Sonnet 直接從 SRD 英文逐句直譯（每批 8～12 個同環階法術，附術語表）。試點比較過「舊譯文換術語後只校對」，但草稿幾乎整段被重寫（41 段僅 1 段原樣保留），沒有比較省，因此不採用。
- 網站已有的法術 `zh.name` 沿用網站 `nameZh`；網站沒有的法術名為提議譯名，待確認。
- 逐項檢查用 `validate.js`；`疑點` 只是提示，需要人工確認。

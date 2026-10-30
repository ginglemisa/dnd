# 職業內容檔（試行中）

每個職業、子職各一個 YAML 檔。說明文字和機制（特性表、選項、跑團按鈕、資源）寫在同一份檔案。

> 試行階段：目前只轉換了野蠻人、遊俠、戰士、盜賊與聖騎士，網站仍讀取 `class-features.js`。格式確認後才逐步改由這裡產生。

## 檔案位置

| 內容 | 位置 |
| --- | --- |
| 公開職業 | `content/srd/classes/<職業 ID>.yaml` |
| 公開子職 | `content/srd/subclasses/<職業 ID>-<子職 ID>.yaml` |
| 私人內容包（不進公開 repo） | `content/private/classes/`、`content/private/subclasses/` |
| 私人內容包補充既有職業（例如兼職） | `content/private/class-extensions/<職業 ID>.yaml` |
| 私人內容包的兼職共用規則與法術位表 | `content/private/rules/multiclass.yaml` |
| 格式定義（JSON Schema） | `content/schema/` |

`content/private/` 整個資料夾被 git 忽略，只存在你的電腦；公開網站不會出現兼職等私人內容。

VS Code 安裝 Red Hat 的「YAML」擴充套件後，會依檔案第一行的 `$schema` 自動補完欄位、標出錯誤，滑鼠停在欄位上可看說明。

## 文字寫法

`text` 一律用 `|` 開頭，下一行起縮排書寫。

- 段落之間空一行；清單用 `- `；粗體用 `**粗體**`。
- 同一段內要換行，在行尾加 `\`（清單項目的下一行再縮排兩格）。創角資訊的單行欄位（例如 `equipment.A`）也可用同樣寫法換行。
- `#### 標題` 開始一個小節，直到下一個 `####` 或文字結束。
- `[[運動]]`、`[[抗性]]`、`[[失能]]`：提示框，名稱須存在於技能／規則提示表或狀態表。
- `{rageDamage|數值見特性表}`：職業頁顯示 `|` 後的文字，跑團模式換成目前數值。名稱須是 `progression` 欄位、`values` 或內建的 `level`、`proficiencyBonus`。
- 不可寫 HTML（出現 `<` 就報錯），也不可寫行內樣式。

## 同一個能力的三種文字

| 欄位 | 用在哪裡 | 什麼時候寫 |
| --- | --- | --- |
| `text` | 職業頁全文 | 一定要寫 |
| `tabletop` | 跑團動作按鈕的說明 | 只在和 `text` 不同時，寫一份完整版本 |
| `summary` | 跑團總覽的一句話 | 只在和 `text` 不同時 |

特性表「職業特性」欄預設列出當級能力的 `name`；要顯示不同文字（例如「動作如潮（一次使用）」）時寫 `tableName`。

## 職業層級的欄位

- `primaryAbility`：`{ all: [敏捷, 感知] }` 顯示為「敏捷與感知」；`{ any: [力量, 敏捷] }` 顯示為「力量或敏捷」。
- `spellcasting.progression`：`full`（全施法者）、`half`（半施法者）、`pact`（契約魔法）、`none`。
- `progression.<欄位>.format`：特性表顯示格式，`{}` 代入數值，例如 `+{}`（+2）、`{}d6`（1d6）。
- `values`：公式只能用數字、`d`、四則運算與 `{數值}`，例如 `"{rageDamage}d6"`。公式中另可引用屬性調整值 `{strModifier}`、`{dexModifier}`、`{conModifier}`、`{intModifier}`、`{wisModifier}`、`{chaModifier}`（沒有屬性值時視為 0；文字中不可直接引用）。

## 不可改名的 ID

選項的 `id`、動作的 `key`／`legacyKeys`、`resource.key`、子職 `id` 會寫進存檔、分享網址或跑團偏好。改顯示文字沒關係，這些 ID 不可改。

這些 ID 都列在根目錄的 `class-id-baseline.json`（私人內容包另有 `content/private/class-id-baseline.json`）。ID 不見、改名或新增而基準檔沒更新時，建置會失敗。確定是刻意新增時執行：

```bash
npm run build -- --update-id-baseline
```

## 能力的資源

`resource` 定義能力的使用次數：`uses` 是次數（固定數字，或特性表欄位／`values` 名稱），`recover` 是短休（`short`）、長休（`long`）恢復的次數，`all` 為全部。點數池（例如聖療，每次可消耗任意點數）另寫 `kind: points`，此時 `uses` 是點數池總量。

## 能力給予的法術

`spells` 列出能力給予的法術（例如始終準備），`id` 是法術 ID，須存在於 `spell-id-baseline.json`；`freeUses` 是免費施放次數，可寫數字或特性表欄位名稱。

## 檢查與預覽

| 指令 | 用途 |
| --- | --- |
| `npm run dev` | 開本機預覽，存檔後自動重新檢查；畫面網址會顯示在終端機 |
| `npm run build` | 檢查全部內容檔，有錯就列出檔案與位置 |
| `npm run classes:check` | 逐項列出和現有 `class-features.js` 的差異 |

刻意與舊版不同、已經確認過的地方，逐行列在 `tools/class-content/accepted-differences.json`。

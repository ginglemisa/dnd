# 職業內容檔

每個職業、子職各一個 YAML 檔。說明文字和機制（特性表、選項、跑團按鈕、資源）寫在同一份檔案。

> 十二個職業（野蠻人、遊俠、戰士、盜賊、聖騎士、吟遊詩人、武僧、牧師、法師、術士、契術師與德魯伊）的職業頁與跑團文字都由這裡產生：`npm run build` 輸出根目錄的 `class-content.generated.js`，網站直接載入這個檔案。部分機制（資源次數、選項清單、跑團數值計算等）仍寫在網站程式，之後逐步搬進內容檔。

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
- `#### 標題` 開始一個小節，直到下一個 `####` 或文字結束。只是排版分段時用它；小節有自己的跑團按鈕時改用子能力（見下方「子能力」），預設收合的小節改用 `collapsible`（見下方「可收合小節」）。
- `[[運動]]`、`[[抗性]]`、`[[失能]]`、`[[小魔鬼]]`：提示框，名稱須存在於技能／規則提示表、狀態表或野獸表（`monster.js` 的 `BEAST_STATS`，取中文名）。
- `{rageDamage|數值見特性表}`：職業頁顯示 `|` 後的文字，跑團模式換成目前數值。名稱須是 `progression` 欄位、`values` 或內建的 `level`、`proficiencyBonus`。整個數值標記要粗體時寫 `**{名稱|文字}**`；只有部分頁面文字粗體時寫在 `|` 後，例如 `{searUndeadDice|**等同感知調整值數量的 d8**（至少 1d8）}`。
- `{spellSaveDc|}`：`|` 後留空＝只在跑團出現。職業頁不顯示，跑團模式顯示目前數值（`values` 有 `format` 時套用格式，例如「（DC 13）」）。
- 規則表格用標準 GFM 表格，見下方「表格」。
- 分隔線：單獨一行 `---`，前後各空一行，輸出 `<hr class="class-rule-divider">`（樣式由 styles.css 設定）。
- 不可寫 HTML（出現 `<` 就報錯），也不可寫行內樣式。

## 同一個能力的三種文字

| 欄位 | 用在哪裡 | 什麼時候寫 |
| --- | --- | --- |
| `text` | 職業頁全文 | 一定要寫 |
| `tabletop` | 跑團動作按鈕的說明 | 只在和 `text` 不同時，寫一份完整版本 |
| `summary` | 跑團總覽的一句話 | 只在和 `text` 不同時 |

特性表「職業特性」欄預設列出當級能力的 `name`；要顯示不同文字（例如「動作如潮（一次使用）」）時寫 `tableName`。當級有子職能力時自動加上「子職特性」：只有子職能力時只顯示「子職特性」；另有職業能力、但不是選擇子職的等級（例如武僧 6 級「真力駐拳，子職特性」），接在職業能力之後。

屬性值提升等有專長選單的能力，要接在選單之後的文字（例如 4 級的「施法補充」，額外戲法選單接在它後面）寫在 `afterFeatChoice`，寫法同 `text`；有 `tabletop`／`summary` 時須一併包含這段。

## 子能力

小節有自己的跑團按鈕時（例如牧師引導神力的「神聖火花」、「驅散不死生物」），寫在能力的 `parts`；只是排版分段（例如狂暴的「狂暴期間」）照舊用 `####`。子能力接在能力的 `text` 之後，輸出成帶自己 ID 的小節。

| 欄位 | 必填 | 說明 |
| --- | --- | --- |
| `id` | 是 | 子能力 ID，與能力 ID 共用、全職業不可重複；舊版已有的照抄。 |
| `name` | 是 | 小節標題名稱，例如「神聖火花」。 |
| `activation` | 否 | 標題括弧內的使用方式，例如「魔法動作」，顯示為「神聖火花（魔法動作）」。 |
| `text` | 是 | 職業頁全文，寫法同能力的 `text`，但不可用 `####`。 |
| `tabletop`／`summary` | 否 | 同能力，只在和 `text` 不同時寫。 |
| `actions` | 否 | 跑團按鈕；按鈕文字預設為「等級 N：子能力名稱」，N 是外層能力等級（子職檔加「（簡稱子職）」）。 |

- 子能力的等級同外層能力；不可再有 `parts`、`resource`、`options`、`choose`。資源寫在外層能力，按鈕以 `resource` 引用。
- 按鈕寫了 `resource` 時，跑團版標題自動加上「，消耗 1 次［資源名稱］」（資源名稱是定義該資源的能力名稱，例如「神聖火花（魔法動作，消耗 1 次引導神力）」），不必寫 `tabletop`。
- 子職追加的同類效果（例如「維持生命」）照舊是子職檔的獨立能力，按鈕寫同一個 `resource` 即可共用次數。

## 選項與跑團按鈕

- `options` 的勾選框寫 `changeOn: rest`（短休或長休後可改選）時自動標記為同一選擇組；不能改選、但仍屬同一選擇組的（例如神佑打擊）寫 `choiceGroup: true`。
- 選項自己的跑團按鈕寫在選項底下（`options[].actions`，例如神佑打擊的「神聖打擊」）：勾選該選項且達到能力等級才出現，說明為選項文字，按鈕文字預設為「等級 N：選項名稱」。同一能力的能力層 `actions` 與選項層 `actions` 只能擇一。
- `options[].attackNote`：勾選後加進武器攻擊備註的文字（例如 `+1d8光/黯傷害`）。這段字串會存進角色資料、取消勾選時靠相同字串移除，列在 ID 基準檔，不可改字。
- 依已選魔能祈喚出現的按鈕寫 `invocation`（須已選此祈喚，例如「饑渴魔刃」）與 `requiresInvocation`（另須已選的先決祈喚，例如「刃之魔契」）。
- `actions[].label` 省略時為「等級 N：名稱（子職）」；按鈕名稱隨等級改變時寫 `label: { byLevel: { 5: 等級 5：焚燒不死生物 } }`，從該等級起改用此文字，更低等級使用省略時的文字。
- 由 `tabletop-druid.js` 操作的按鈕寫 `druidOperation`：`shape`（荒野形態變形）、`companion`（荒野夥伴）、`aid`（大地之援）。
- 卡片選項（`optionStyle: cards`，且沒有選項層 `actions`）的 `text` 可空一行分成多段：第一段接在勾選框之後，其餘段落接在卡片標題列下方（例如原初使命的巫祝）。

## 可收合小節

預設收合、點標題才展開的小節（例如施法的「擴充與替換法術書」）寫在能力的 `collapsible`，每項有 `name`（粗體標題）與 `text`（寫法同能力的 `text`，但不可用 `####`）。接在能力的 `text` 之後、子能力之前。跑團說明與總覽照舊讀取整段（含可收合小節），所以有 `collapsible` 的能力不可寫 `tabletop`／`summary`。

## 表格

能力的 `text`（與 `tabletop`）可用標準 GFM 表格，前後各空一行：

```markdown
| 法術位環階 | 術法點消耗 | 最低術士等級 |
| --- | --- | --- |
| 1 | 2 | 2 |
```

- 第一列是表頭，第二列只能寫 `---`（不支援對齊冒號），儲存格不可空白，也不可含 `|`（因此不能放數值標記）。
- 每個表格的外框依出現順序寫在能力的 `tables`：`label` 是表格的無障礙名稱（必填），`style` 是進程表樣式（例如 `spell-slot`，對應 styles.css 的 `rule-table-shell--spell-slot`、`rule-progress-table--spell-slot`）。`text` 的表格數量須等於 `tables` 的項數；`tabletop` 也相同，或完全不寫表格（表格在只限職業頁的小節時，例如荒野形態的野獸形態進程表）。
- 外框的其他欄位（皆可省略）：

  | 欄位 | 說明 |
  | --- | --- |
  | `kind` | 有 `style` 時的表格種類：`progress`（預設，進程表）；`reference` 時表格只加樣式名稱的 class（例如大地結社的 `druid-terrain-spells`）。 |
  | `rowHeaders` | `true`：表身每列第一格是列標題（`<th scope="row">`，例如地貌、德魯伊等級）。 |
  | `rowHeaderSuffix` | 接在每個列標題後、只在窄螢幕顯示的文字，例如 `級`（儲存格只寫 `2`）。須有 `rowHeaders`。 |
  | `cellLabels` | 表身資料欄（不含列標題）依序的欄位名稱，窄螢幕版面顯示在每格上方，例如 `[已知形態, 最大 CR, 飛行]`。 |
- 跑團說明與總覽不顯示表格；需要的跑團文字寫在 `tabletop`（例如術士魔力泉湧的 `{slotCreationCosts|見上表}`，跑團模式顯示由表格組成的換算文字）。

## 下拉選擇卡片

能力要讓玩家從下拉選單選一個值（例如元素親和的傷害類型）時寫 `select`，接在內文與選項之後：

| 欄位 | 必填 | 說明 |
| --- | --- | --- |
| `id` | 是 | 下拉選單 ID，會寫進存檔與分享網址，不可改名。 |
| `placeholder` | 是 | 未選擇時的提示文字（空值選項）。 |
| `choices` | 是 | 可選的值，每項 `{ value: acid, name: 強酸 }`；`value` 會寫進存檔，不可改名。 |
| `text` | 否 | 卡片說明，寫法同 `text`，但不可用 `####`。 |

跑團說明與總覽照舊讀取整段（含卡片說明），所以有 `select` 的能力不可寫 `tabletop`／`summary`。

## 附錄

不屬於任何等級的參考小節（例如術士的「超魔法選項」）寫在職業檔的 `appendix`，每項有 `name`（標題）與 `text`（可用 `####` 小節，不可有表格），接在所有能力之後。網站以字串切割讀取這段（超魔法選項卡片），小節標題的寫法（例如「謹慎法術－消耗：1 術法點」）須照舊。

有小節需要自己的跑團按鈕時（例如契術師「魔能祈喚選項」的魔能斬擊、饑渴魔刃），該附錄的小節全部寫成 `parts`（保留順序），`text` 只寫小節之前的說明：

| 欄位 | 必填 | 說明 |
| --- | --- | --- |
| `name` | 是 | 小節名稱，例如「刃之魔契」。網站以名稱切割讀取各魔能祈喚，不可改字。 |
| `prerequisite` | 否 | 先決條件，標題顯示為「名稱（先決條件：…）」。 |
| `text` | 是 | 內文，寫法同 `text`，不可有表格；`####` 只輸出標題、不另包小節（例如書之魔契的「戲法與儀式（持有書時）」）。 |
| `id` | 有 `actions` 時 | 小節 ID，與能力 ID 共用、全職業不可重複；舊版已有的照抄。 |
| `actions` | 否 | 跑團按鈕，說明為此小節。附錄沒有等級，按鈕須寫 `level`；按鈕文字預設為小節名稱。 |

小節之間與小節內不換行（同舊版寫法），網站切出的各祈喚文字才會相同。

## 特殊機制

網站程式另外插入控制項或辨識標記的能力寫 `behavior: <名稱>`，對應 `tools/class-content/behaviors/<名稱>.js`：

- `magical-discoveries`：在內文之後產生魔法發現的法術選擇區。
- `wizard-spellbook-recommendations`：把「**法術書：**」清單項目「推薦：」之後、句號之前的法術名稱標記為法術書推薦（可直接寫入法術書）；找不到這段文字時建置失敗。
- `wild-shape-known-forms`：把荒野形態的「#### 已知形態」小節（說明段落、推薦段落、規則清單三個區塊）輸出成已知形態區塊（推薦框等排版），並在區塊末端接上「查看其他動物」的野獸清單；緊接其後的小節（變形規則）加上分隔樣式。野獸清單是另外整理的參考資料，不寫進內容檔，讀取 `druid-wild-shape-beasts.js` 的 `DRUID_WILD_SHAPE_BEASTS`（跑團模式的 `DruidBeastForms` 也來自這份清單）。找不到這段結構時建置失敗。
- `druid-land-choice`：在能力的 section 加上 `data-druid-land-choice`，網站以此找到大地結社地貌選擇所屬的能力（缺項檢查與跳轉）；地貌下拉選單在 index.html。

## 職業層級的欄位

- `primaryAbility`：`{ all: [敏捷, 感知] }` 顯示為「敏捷與感知」；`{ any: [力量, 敏捷] }` 顯示為「力量或敏捷」。
- `spellcasting.progression`：`full`（全施法者）、`half`（半施法者）、`pact`（契約魔法）、`none`。
- `progression.<欄位>.format`：特性表顯示格式，`{}` 代入數值，例如 `+{}`（+2）、`{}d6`（1d6）、`1d{}`（1d8，數值是骰面）。
- `values`：公式只能用數字、`d`、四則運算、`max()`／`min()`／`floor()`（無條件捨去，例如 `floor({level} / 2)`）與 `{數值}`，例如 `"{rageDamage}d6"`、`"max(1, {chaModifier})"`。公式中另可引用屬性調整值 `{strModifier}`、`{dexModifier}`、`{conModifier}`、`{intModifier}`、`{wisModifier}`、`{chaModifier}`（沒有屬性值時視為 0；文字中不可直接引用）。
  要套用顯示格式時寫 `{ formula: "8 + {proficiencyBonus} + {wisModifier}", format: （DC {}） }`，`{}` 代入計算結果；公式只引用另一個特性表欄位或 `values` 時（例如 `{ formula: "{saveDc}", format: （DC {}） }`）可為同一數值另取帶格式的名稱；只引用內建的 `level`／`proficiencyBonus`（例如 `{ formula: "{level}", format: （目前 {} 點） }`）時是獨立的值。
  跑團顯示的是依等級變化的文字（不是數字）時寫 `{ byLevel: { 5: 短休或長休後全部恢復 } }`：從該等級起換成此文字，更低等級保留頁面文字；這種值只能用在文字，不可用於公式或次數。

## 不可改名的 ID

選項的 `id`、下拉選單的 `select.id` 與選項值、動作的 `key`／`legacyKeys`、`resource.key`、子職 `id` 會寫進存檔、分享網址或跑團偏好；選項的 `attackNote` 會寫進角色的攻擊備註。改顯示文字沒關係，這些 ID 不可改。

這些 ID 都列在根目錄的 `class-id-baseline.json`（私人內容包另有 `content/private/class-id-baseline.json`）。ID 不見、改名或新增而基準檔沒更新時，建置會失敗。確定是刻意新增時執行：

```bash
npm run build -- --update-id-baseline
```

## 能力的資源

`resource` 定義能力的使用次數：`uses` 是次數（固定數字，或特性表欄位／`values` 名稱），`recover` 是短休（`short`）、長休（`long`）恢復的次數，`all` 為全部；恢復方式隨等級改變時，另寫 `recoverByLevel: { 5: { short: all, long: all } }`，從該等級起整個取代 `recover`。點數池（例如聖療，每次可消耗任意點數）另寫 `kind: points`，此時 `uses` 是點數池總量。

## 能力給予的法術

`spells` 列出能力給予的法術（例如始終準備），`id` 是法術 ID，須存在於 `spell-id-baseline.json`；`freeUses` 是免費施放次數，可寫數字或特性表欄位名稱。

## 檢查與預覽

| 指令 | 用途 |
| --- | --- |
| `npm run dev` | 開本機預覽，存檔後自動重新建置，重新整理瀏覽器即可看到；畫面網址會顯示在終端機 |
| `npm run build` | 檢查全部內容檔並產生 `class-content.generated.js`，有錯就列出檔案與位置 |
| `npm run classes:check` | 轉換期工具：逐項列出和舊版 `class-features.js`（退役前最後一版的 git 紀錄）的差異 |

改完內容檔只要提交內容檔本身。`class-content.generated.js` 是產生的檔案，不放進 repo、不可手改：本機用 `npm run dev` 或 `npm run build` 產生，上線時由 GitHub Actions 產生。只有公開內容包會寫進產生檔。

轉換時刻意與舊版不同、已經確認過的地方，逐行列在 `tools/class-content/accepted-differences.json`（只供 `npm run classes:check` 使用）。

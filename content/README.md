# 內容檔

網站的職業、子職、專長、背景、種族、法術與怪物資料寫在 `content/` 的 YAML 內容檔，每個職業、子職、專長、背景、種族、法術、怪物各一個檔。`npm run build` 檢查格式與跨檔關係後，產生網站讀取的資料檔。本文件大部分在說明職業與子職的寫法；專長、背景、種族、法術與怪物見下方「專長」「背景」「種族」「法術」「怪物」。

職業與子職的說明文字和機制（特性表、選項、跑團按鈕、資源）寫在同一份檔案。

> 十二個職業（野蠻人、遊俠、戰士、盜賊、聖騎士、吟遊詩人、武僧、牧師、法師、術士、契術師與德魯伊）的職業頁、跑團文字與機制資料都由這裡產生：`npm run build` 輸出根目錄的 `class-content.generated.js`，網站直接載入這個檔案。機制資料（`classRules`）是內容檔去掉說明文字後的結構，網站以此計算生命骰、豁免、法術位、準備法術與戲法數量、資源次數等。

## 檔案位置

| 內容 | 位置 |
| --- | --- |
| 公開職業 | `content/srd/classes/<職業 ID>.yaml` |
| 公開子職 | `content/srd/subclasses/<職業 ID>-<子職 ID>.yaml` |
| 公開專長與選單順序 | `content/srd/feats/<英文檔名>.yaml`、`content/srd/feat-order.yaml` |
| 公開背景 | `content/srd/backgrounds/<背景 ID>.yaml` |
| 公開種族 | `content/srd/races/<種族 ID>.yaml` |
| 公開法術 | `content/srd/spells/<法術 ID>.yaml` |
| 公開怪物（野獸、召喚物） | `content/srd/monsters/<key>.yaml` |
| 私人內容包（不進公開 repo） | `content/private/classes/`、`content/private/subclasses/` |
| 私人法術（格式已訂、尚未啟用） | `content/private/spells/<法術 ID>.yaml` |
| 私人內容包補充既有職業（例如兼職） | `content/private/class-extensions/<職業 ID>.yaml` |
| 私人內容包的兼職共用規則與法術位表 | `content/private/rules/multiclass.yaml` |
| 格式定義（JSON Schema） | `content/schema/` |

`content/private/` 整個資料夾被 git 忽略，只存在你的電腦；公開網站不會出現兼職等私人內容。

本機執行 `npm run build`（或 `npm run dev`）時，私人內容包的子職與 `class-extensions/` 會寫進根目錄的 `class-content.private.generated.js`（同樣被 git 忽略），網站在公開資料之後載入它，你的電腦上就看得到私人子職（例如子職選單出現兩個以上的選項）。沒有私人內容包、上線建置或執行 `npm run build -- --public-only` 時，這個檔案是空的，網站只有公開內容；離線角色卡一律只含公開內容。私人內容包的持久化 ID 另列在 `content/private/class-id-baseline.json`。

私人內容包目前不支援背景與種族：選單是 `index.html` 的固定選項，沒有加入私人選項的方式。也不支援專長：私人資料檔只放職業資料。`content/private/backgrounds/`、`content/private/races/`、`content/private/feats/` 存在時建置會失敗。私人法術（`content/private/spells/`）的格式已訂好，但尚未啟用：建置不讀取這個資料夾（見下方「法術」）。

VS Code 安裝 Red Hat 的「YAML」擴充套件後，會依檔案第一行的 `$schema` 自動補完欄位、標出錯誤，滑鼠停在欄位上可看說明。

## 子職

一個職業可以有多個子職檔，職業檔的 `defaultSubclass` 是預設子職，`subclassLevel` 是選擇子職的等級。

- 角色卡依職業的 `subclassLevel` 顯示子職選單（只有一個子職時不顯示，直接使用預設子職）；選擇的子職存進角色資料的 `subclass` 欄位（子職 `id`）。舊存檔、JSON、分享網址沒有這個欄位時使用 `defaultSubclass`；無法辨識的子職改為預設子職並提示。
- 職業頁、跑團動作與資源、跑團提示、選項與缺項提醒、衍生法術、PDF 的子職名稱與職業特性欄，都只使用目前選擇的子職。
- 網站資料包含職業的全部子職：子職能力的段落帶 `data-subclass`（子職 ID），特性表的「子職特性」在只有部分子職於該等級有能力時也依子職顯示。子職選單依預設子職在前、其餘依檔名排列。
- 有 `id` 的能力，段落帶 `data-feature-id`（能力 ID），網站以此在職業頁找到能力的位置（專長選單、缺項提示與跳轉；例如大地結社地貌對應 `druid-circle-of-the-land-spells`）。能力 `id` 改名時須一併搜尋網站程式。
- 同一職業各子職的能力 `id`、選項 `id`、動作 `key`、`resource.key` 不可重複（建置會檢查）。

## 文字寫法

`text` 一律用 `|` 開頭，下一行起縮排書寫。

- 段落之間空一行；清單用 `- `；粗體用 `**粗體**`。
- 同一段內要換行，在行尾加 `\`（清單項目的下一行再縮排兩格）。創角資訊的單行欄位（例如 `weapons`）也可用同樣寫法換行。
- `#### 標題` 開始一個小節，直到下一個 `####` 或文字結束。只是排版分段時用它；小節有自己的跑團按鈕時改用子能力（見下方「子能力」），預設收合的小節改用 `collapsible`（見下方「可收合小節」）。
- `[[運動]]`、`[[抗性]]`、`[[失能]]`、`[[小魔鬼]]`：提示框，名稱須存在於技能／規則提示表、狀態表或怪物內容檔的中文名（見下方「怪物」）。
- `{rageDamageText|數值見特性表}`：職業頁顯示 `|` 後的文字，跑團模式換成目前數值（網站依目前等級與屬性值計算）。名稱須是 `progression` 欄位、`values` 或內建的 `level`、`proficiencyBonus`；特性表欄位套用欄位的 `format`，要另加跑團字樣（例如「3 次」「目前 +2」）時在 `values` 另取名稱並寫 `format`（見下方「職業層級的欄位」）。整個數值標記要粗體時寫 `**{名稱|文字}**`；只有部分頁面文字粗體時寫在 `|` 後，例如 `{searUndeadDice|**等同感知調整值數量的 d8**（至少 1d8）}`。
- `[文字]{標記名}`：網站功能標記，把方括號內的文字標給網站程式使用，職業頁與跑團說明的顯示不變。**只供網站功能使用，一般文字不要用。** 標記名須是建置工具（`tools/content/markdown.js` 的 `MARKS`）列出的名稱，否則建置失敗；方括號內可有粗體，不可再有 `[`、`]`（也就不能放提示框）。目前沒有可用的標記（清單為空）。
- `{spellSaveDc|}`：`|` 後留空＝只在跑團出現。職業頁不顯示，跑團模式顯示目前數值（`values` 有 `format` 時套用格式，例如「（DC 13）」）。
- 規則表格用標準 GFM 表格，見下方「表格」。
- 分隔線：單獨一行 `---`，前後各空一行，輸出 `<hr class="class-rule-divider">`（樣式在 `css/base.css`）。
- 不可寫 HTML（出現 `<` 就報錯），也不可寫行內樣式。

## 同一個能力的三種文字

| 欄位 | 用在哪裡 | 什麼時候寫 |
| --- | --- | --- |
| `text` | 職業頁全文 | 一定要寫 |
| `tabletop` | 跑團動作按鈕的說明 | 只在和 `text` 不同時，寫一份完整版本 |
| `summary` | 跑團總覽的一句話 | 只在和 `text` 不同時 |

特性表「職業特性」欄預設列出當級能力的 `name`；要顯示不同文字（例如「動作如潮（一次使用）」）時寫 `tableName`。當級有子職能力時自動加上「子職特性」：只有子職能力時只顯示「子職特性」；另有職業能力、但不是選擇子職的等級（例如武僧 6 級「真力駐拳，子職特性」），接在職業能力之後。

給予專長選擇的能力寫 `feat`：`level`（屬性值提升，存檔欄位為「職業-level-等級」）或 `style`（戰鬥風格專長）；網站依此決定哪些等級有專長選單，並把選單放進該能力段落。勾選後才給予戰鬥風格專長的選項（聖騎士、遊俠）改在選項寫 `featChoice: true`。

屬性值提升等有專長選單的能力，要接在選單之後的文字（例如 4 級的「施法補充」，額外戲法選單接在它後面）寫在 `afterFeatChoice`，寫法同 `text`；有 `tabletop`／`summary` 時須一併包含這段。額外戲法選單的標籤（例如「施法補充」，顯示為「施法補充：額外吟遊詩人戲法」）寫在同一能力的 `cantripChoiceLabel`，須與 `afterFeatChoice` 裡的粗體標籤一致；選單的等級取自該能力的 `level`。

## 跑團提示

被動能力要在跑團模式顯示提示時寫 `hint`（達到能力等級才出現），標題為能力名稱，文字為 `summary`（沒有時為職業頁段落），同一頁籤依職業頁順序：

```yaml
hint: {panels: [skills], hideWhenIncapacitated: true}
summary: 你的敏捷豁免有優勢。
```

- `panels`：`overview`（總覽）、`skills`（技能頁的豁免與檢定）、`spells`（法術頁）、`weapons`（動作頁的武器提示），可寫多個。
- `hideWhenIncapacitated: true`：失能時隱藏（只影響總覽與技能頁籤）。
- 選項也可寫 `hint`：勾選該選項時才顯示，標題為選項名稱（例如防守戰術的衝出重圍、多重防禦）。
- 會依角色數值計算的提示（守護靈氣的豁免加值、黑暗之賜的臨時生命值、元素親和）仍由網站程式產生。

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

- `options` 是可勾選的選項，網站依此決定勾選框所屬職業與可用等級（能力等級）、缺項提醒與互斥：`choose: 1` 的選項互斥（勾選一項時取消其他項）；達到能力等級仍未勾選時提醒「職業名＋能力名稱尚未選擇。」，提醒名稱和能力名稱不同時寫 `choiceName`（例如戰鬥風格的「戰鬥風格類型」，下拉選擇卡片的「元素親和傷害類型」）。勾選後給予專長選擇的選項（例如「選 1 個戰鬥風格專長」）寫 `featChoice: true`，玩家自行管理專長時不提醒。
- `options` 的勾選框寫 `changeOn: rest`（短休或長休後可改選）時，休息對話框的選項說明取自選項的跑團段落（建置自動產生，不必寫 `actions`）；同時自動標記為同一選擇組；不能改選、但仍屬同一選擇組的（例如神佑打擊）寫 `choiceGroup: true`。
- 選項自己的跑團按鈕寫在選項底下（`options[].actions`，例如神佑打擊的「神聖打擊」）：勾選該選項且達到能力等級才出現，說明為選項文字，按鈕文字預設為「等級 N：選項名稱」。同一能力的能力層 `actions` 與選項層 `actions` 只能擇一。
- `options[].attackNote`：勾選後加進武器攻擊備註的文字（例如 `+1d8光/黯傷害`）。這段字串會存進角色資料、取消勾選時靠相同字串移除，列在 ID 基準檔，不可改字。
- 依已選魔能祈喚出現的按鈕寫 `invocation`（須已選此祈喚，例如「饑渴魔刃」）與 `requiresInvocation`（另須已選的先決祈喚，例如「刃之魔契」）。
- `actions[].label` 省略時為「等級 N：名稱（子職）」；按鈕名稱隨等級改變時寫 `label: { byLevel: { 5: 等級 5：焚燒不死生物 } }`，從該等級起改用此文字，更低等級使用省略時的文字。
- 跑團動作按鈕全部來自內容檔（能力、子能力、選項與附錄小節的 `actions`），同一分頁內依職業頁順序排列；出現條件只看等級、勾選的選項與魔能祈喚。
- 按鈕的跑團說明只顯示勾選中的選項段落時（例如狩獵目標）寫 `selectedOptionOnly: true`；未勾選時提示「請在職業能力中選擇能力名稱。」。
- `tabletopHidden: true`：跑團模式不顯示此按鈕（例如本能飛撲已併入狂暴說明，只保留 key 給舊偏好）；`tabletopAlso: action`：跑團模式另外在該分頁顯示同一個按鈕（例如吟遊詩人激勵也列在動作分頁）。
- 魔能祈喚本身的按鈕（例如刃之魔契、鏈主賦能）寫在契術師附錄的小節，加上 `source: invocation`：按鈕來源顯示「魔能祈喚」，說明為整段祈喚文字，須已選擇該祈喚。
- 武器攻擊備註：選項的 `attackNote` 在勾選且達到能力等級時自動加進主手／副手攻擊備註。
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
- 每個表格的外框依出現順序寫在能力的 `tables`：`label` 是表格的無障礙名稱（必填），`style` 是進程表樣式（例如 `spell-slot`，對應 `css/base.css` 的 `rule-table-shell--spell-slot`、`rule-progress-table--spell-slot`）。`text` 的表格數量須等於 `tables` 的項數；`tabletop` 也相同，或完全不寫表格（表格在只限職業頁的小節時，例如荒野形態的野獸形態進程表）。
- 外框的其他欄位（皆可省略）：

  | 欄位 | 說明 |
  | --- | --- |
  | `kind` | 有 `style` 時的表格種類：`progress`（預設，進程表）；`reference` 時表格只加樣式名稱的 class（例如大地結社的 `druid-terrain-spells`）。 |
  | `rowHeaders` | `true`：表身每列第一格是列標題（`<th scope="row">`，例如地貌、德魯伊等級）。 |
  | `rowHeaderSuffix` | 接在每個列標題後、只在窄螢幕顯示的文字，例如 `級`（儲存格只寫 `2`）。須有 `rowHeaders`。 |
  | `cellLabels` | 表身資料欄（不含列標題）依序的欄位名稱，窄螢幕版面顯示在每格上方，例如 `[已知形態, 最大 CR, 飛行]`。 |
- 跑團說明與總覽不顯示表格。需要把表格內容變成一行跑團文字時，用 `values` 的 `fromTable` 從表格組出文字，再在表格後面單獨寫一段 `{名稱|}`（整段只在跑團顯示）。例如術士魔力泉湧的 `{slotCreationCosts|}`，跑團模式顯示「1 環消耗 2 點（術士等級 2 起）；……」；改表格時文字自動跟著變。

## 下拉選擇卡片

能力要讓玩家從下拉選單選一個值（例如元素親和的傷害類型）時寫 `select`，接在內文與選項之後：

| 欄位 | 必填 | 說明 |
| --- | --- | --- |
| `id` | 是 | 下拉選單 ID，會寫進存檔與分享網址，不可改名。 |
| `placeholder` | 是 | 未選擇時的提示文字（空值選項）。 |
| `choices` | 是 | 可選的值，每項 `{ value: acid, name: 強酸 }`；`value` 會寫進存檔，不可改名。 |
| `text` | 否 | 卡片說明，寫法同 `text`，但不可用 `####`。 |

跑團說明與總覽照舊讀取整段（含卡片說明），所以有 `select` 的能力不可寫 `tabletop`／`summary`。

## 選擇與固定獲得

能力要玩家做的選擇（選幾個、從哪裡選）寫 `picks`；取得能力或勾選選項就固定獲得的項目寫 `grants`。網站依此決定欄位數、可選項目與缺項提醒，快速創角也讀同一份資料，不另寫規則。

```yaml
- id: rogue-thieves-cant
  level: 1
  name: 盜賊黑話
  grants:
    languages: [{ id: thieves-cant, field: language-extra-1 }]
  picks:
    - { kind: language, count: 1, from: any, exclude: [thieves-cant], fields: [language-extra-2] }
```

| `picks[]` 欄位 | 說明 |
| --- | --- |
| `kind` | `weaponMastery`（武器精通）、`expertise`（技能專精）、`skill`（技能熟練）、`language`（語言）、`spellbookSpell`（免費加入法術書的法術）。 |
| `count` | 要選幾個：數字，或特性表欄位名稱（例如 `weaponMastery`，數量隨等級增加）。 |
| `from` | 可選範圍：`proficient`（已熟練的武器或技能；武器精通、專精用）、`class`（職業初始技能清單）、`any`（全部；語言為一般與稀有語言），或列出技能名稱（專精時再限縮於已熟練的技能，例如法師的學者）。 |
| `exclude` | 語言：不能選的語言（語言選單的 value）。 |
| `fields` | 語言：沿用既有存檔欄位 ID（例如 `language-extra-2`），數量須等於 `count`。 |
| `changeOn` | 可改選的時機（`longRest`、`levelUp`），說明用。 |
| `school`、`maxLevel` | `spellbookSpell`：限定的法術學派與環階上限。 |

- 武器精通：職業頁的能力段落輸出選單，存檔欄位自動產生「能力 ID-pick-序號」（例如 `fighter-weapon-mastery-pick-1`），欄位數是 `count` 在 `maxLevel` 以內的最大值；網站只顯示目前等級的數量，其餘欄位保留值但隱藏。選項是職業熟練（`proficiencies.weapons`）且有精通屬性的武器，值為武器名稱；選了精通武器後，攻擊列的精通標籤只顯示在所選武器上（一個都沒選時全部顯示）。
- 專精沿用技能列的專精勾選框（職業有 `expertise` 選擇時才顯示勾選框）；語言使用 `fields` 的欄位，這兩種沒有新的存檔欄位。
- 缺項提醒：武器精通、專精（專精勾選框總數少於本職業此等級的專精數量）與職業額外語言，達到能力等級仍未選滿時提醒。`skill`（先祖學識、額外熟練項）與 `spellbookSpell`（塑能學者）無法分辨技能或法術的來源，只有資料、網站不提醒。
- `grants`（能力層）目前只支援 `languages`：`[{ id: 語言, field: 顯示此語言的欄位 ID }]`。
- 選項的 `grants`：`weapons`（`[martial]` 等武器類別）、`armor`（`light`／`medium`／`heavy`／`shield`）、`cantrips`（`{ count, list: 職業 ID, label }`，額外戲法的數量與法表；`label` 是法術來源、缺項提醒與 PDF 顯示的名稱，未寫時用選項名稱。數量 1 是選項下方的戲法選單，欄位 `選項 ID-cantrip`，例如魔術使；2 以上在角色能力視窗與法術頁選，欄位 `class-選項 ID-cantrip-序號`，例如受祝福的勇士）、`checkBonus`（`{ skills, ability, min }`，這些技能檢定加上屬性調整值，至少 `min`）。勾選且達到能力等級才生效。
- 欄位 ID（`fields`、語言的 `field`、自動產生的武器精通欄位、職業工具欄位）會寫進存檔與分享網址，列在 `class-id-baseline.json` 的 `fields`，不可改名。

## 插入點

網站程式要在能力段落內插入自己的控制項（例如吟遊詩人逸聞子職「魔法發現」的法術選單）時寫 `mount`，在內文、選項與下拉選擇卡片之後輸出一個空容器 `<div id="ID" class="ID" aria-label="說明">`：

```yaml
mount: { id: bard-magical-discoveries, label: 魔法發現法術選擇 }
```

`id` 是網站程式尋找容器用的 DOM ID（同一職業內不可與選項、下拉選單 ID 重複），改名時須一併搜尋網站程式；`label` 是給螢幕報讀的說明。容器只用於職業頁與跑團說明的排版，不進 `classRules`。

## 附錄

不屬於任何等級的參考小節（例如術士的「超魔法選項」、契術師的「魔能祈喚選項」）寫在職業檔的 `appendix`，接在所有能力之後。每項有 `name`（標題）與 `text`（可用 `####` 小節，不可有表格）；小節要讓網站讀取或有自己的跑團按鈕時，改寫成 `parts`（保留順序），`text` 只寫小節之前的說明（可省略）。

網站做成選擇卡片的附錄寫 `kind`：`metamagic`（術士超魔法）、`invocations`（契術師魔能祈喚）。卡片內容、可選等級與給予的法術都讀取各小節，職業能力頁籤不顯示這段。**卡片勾選框依小節順序編號並寫進存檔**：只能在最後新增小節，不可刪除或調換順序；小節名稱也會寫進存檔與跑團偏好，不可改字。

| 欄位 | 必填 | 說明 |
| --- | --- | --- |
| `name` | 是 | 小節名稱，例如「刃之魔契」。 |
| `prerequisite` | 否 | 先決條件，標題顯示為「名稱（先決條件：…）」。 |
| `detail` | 否 | 沒有先決條件時接在名稱後的標題文字，例如超魔法的「－消耗：1 術法點」。 |
| `level` | 否 | 可選擇此小節的最低職業等級（魔能祈喚的「契術師等級 5+」寫 `level: 5`）；省略為 1。 |
| `repeatable` | 否 | `true`：可重複選擇（例如苦痛魔爆）。 |
| `spell` | 否 | 選擇後給予的法術：`{ id: mage-armor, use: at-will }`；`use` 為 `at-will`（隨意施放）或 `once`（每次長休 1 次）。 |
| `text` | 是 | 內文，寫法同 `text`，不可有表格；`####` 只輸出標題、不另包小節（例如書之魔契的「戲法與儀式（持有書時）」）。 |
| `id` | 有 `actions` 時 | 小節 ID，與能力 ID 共用、全職業不可重複；舊版已有的照抄。 |
| `actions` | 否 | 跑團按鈕，說明為此小節。附錄沒有等級，按鈕須寫 `level`；按鈕文字預設為小節名稱。 |

超魔法的小節照舊版換行排列（跑團的瞬發法術說明依此分段），其他附錄的小節之間與小節內不換行。

## 特殊機制

一般欄位表達不了的特殊排版寫 `behavior: <名稱>`，對應 `tools/class-content/behaviors/<名稱>.js`，並在 `text` 中把要特殊排版的小節標題寫成 `#### 標題 {#名稱}`（名稱同 `behavior`，只能有一個）。這個小節不照一般小節輸出，改由 behavior 依小節內的段落與清單產生；標記缺少、名稱不符或小節內容不符時建置失敗。網站程式只需要插入點或標記時，改用 `mount`（見「插入點」）或網站功能標記 `[文字]{標記名}`（見「文字寫法」）。

- `wild-shape-known-forms`：荒野形態的 `#### 已知形態 {#wild-shape-known-forms}` 小節（依序為說明段落、推薦段落、規則清單）輸出成已知形態區塊（推薦框等排版），並在區塊末端接上「查看其他動物」的野獸清單；緊接其後須有一個小節（變形規則），會加上分隔樣式。野獸清單是另外整理的參考資料，不寫進內容檔，讀取 `druid-wild-shape-beasts.js` 的 `DRUID_WILD_SHAPE_BEASTS`（跑團模式的 `DruidBeastForms` 也來自這份清單），每個 `key` 須是怪物內容檔的 key，`label`、`cr`、`hasFlight` 須與該野獸一致，否則建置失敗；清單之後接只供查閱的野獸（第二層收合，見下方「怪物」）。

## 職業層級的欄位

- `primaryAbility`：`{ all: [敏捷, 感知] }` 顯示為「敏捷與感知」；`{ any: [力量, 敏捷] }` 顯示為「力量或敏捷」。
- `spellcasting.progression`：`full`（全施法者）、`half`（半施法者）、`pact`（契約魔法）、`none`。
- `progression.<欄位>.format`：特性表顯示格式，`{}` 代入數值，例如 `+{}`（+2）、`{}d6`（1d6）、`1d{}`（1d8，數值是骰面）。
- 網站依欄位名稱讀取的特性表欄位：`cantrips`（戲法數量）、`preparedSpells`（準備法術數量）、`spellSlots1`～`spellSlots4`（各環法術位）；契約魔法（`pact`）為 `spellSlots`（法術位數量）與 `spellSlotLevel`（法術位環階）；契術師的 `invocations`（魔能祈喚數量）。改名會讓網站讀不到。
- `hitDie`、`saves`、`spellcasting.progression` 也供網站計算生命值、豁免熟練與是否具施法能力；`skills` 供快速創角的技能選擇。
- `weapons`、`armor`、`tools` 是創角頁的顯示文字；機制資料寫在 `proficiencies`，改其中一邊時另一邊要一併修改：
  - `weapons`：`{ categories: [simple, martial], martialWithProperty: [靈巧, 輕型] }`，`martialWithProperty` 是另外熟練的軍用武器屬性（武器資料的屬性名稱）。
  - `armor`：`[light, medium, heavy, shield]`，沒有時寫 `[]`。
  - `tools`：`{ fixed: 盜賊工具, field: 欄位 ID }`，或 `{ chooseFrom: [instrument], count: 3, field: 欄位 ID 前綴 }`（工具組 ID 見 `tool-data.js`，欄位為前綴加序號）。
  - 網站依此判斷武器與護甲熟練、武器精通可選的武器與職業工具欄位；守護者、哨衛等選項的額外熟練寫在選項的 `grants`。契術師刃之魔契的軍用武器與武僧的武藝仍由網站程式處理。
- `equipment`：起始裝備，A、B 二擇一。職業頁的（A）列由建置依 `items` 組成（以「、」連接，最後接「N 金幣」），套組名稱自動加上內容物提示框（內容物取自 `equipment-data.js` 的 `EQUIPMENT_PACK_CONTENTS`）；職業頁點（A）（B）與快速創角都依此把物品加進物品欄。
  - `A`：`{ items: [...], gold: 15 }`；有兩種以上組合時寫 `options: [{ id, label, items, gold }]`（例如戰士的力量型、敏捷型；`id` 會寫進快速創角草稿，不可改名，列在 `class-id-baseline.json` 的 `equipmentOptions`）。
  - `items` 的每一項：裝備說明的品名，數量寫成「名稱 ×n」（例如「箭矢 ×20」）；裝備說明沒有的物品寫 `{ name: 法術書, weight: 3 }`（每件磅數）；擇一的物品寫 `{ choose: 樂器擇一, tools: [instrument] }`（從工具組選，工具組 ID 見 `tool-data.js`）或 `{ choose: 聖徽, from: [聖物匣, 徽章, 護身符] }`（從列出的品名選），`choose` 是顯示文字。
  - `B`：`{ gold: 75 }`。
  - 品名須對得到物品欄的目錄（裝備說明的品名或 `inventory.js` 的別名），`validate-spell-search.js` 會在網頁中逐項檢查。
- `values`：公式只能用數字、`d`、四則運算、`max()`／`min()`／`floor()`（無條件捨去，例如 `floor({level} / 2)`）／`ceil()`（無條件進位）與 `{數值}`，例如 `"{rageDamage}d6"`、`"max(1, {chaModifier})"`。公式中另可引用屬性調整值 `{strModifier}`、`{dexModifier}`、`{conModifier}`、`{intModifier}`、`{wisModifier}`、`{chaModifier}`（沒有屬性值時視為 0；文字中不可直接引用）。
  跑團顯示要加字樣時寫 `{ formula: "8 + {proficiencyBonus} + {wisModifier}", format: "（DC {}）" }`，`{}` 代入計算結果；`format` 的前後空白也會保留（夾在中文之間時用來和數值區隔，例如 `" {} 點"`）。同一個數值要在不同地方顯示不同字樣時另取名稱，例如 `rageUsesText: { formula: "{rageUses}", format: "{} 次" }`；只引用一個特性表欄位且該等級為「-」時保留頁面文字。骰子公式顯示為「1d8 + 3」（有常數項時一律顯示正負號，0 顯示「+ 0」）。
  屬性值或等級未填時，屬性調整值視為 0、等級視為 1；要改顯示其他文字時寫 `blank: "…"`，寫 `blank: keep` 則保留頁面文字。flow 寫法（`{ … }`）中含 `{}` 的字串須加引號。
  跑團顯示的是依等級變化的文字（不是數字）時寫 `{ byLevel: { 5: 短休或長休後全部恢復 } }`：從該等級起換成此文字，更低等級保留頁面文字；這種值只能用在文字，不可用於公式或次數。
  由表格組成的文字寫 `{ fromTable: { feature: 能力 ID, row: "{1} 環消耗 {2} 點（術士等級 {3} 起）", join: "；", end: "。" } }`：`{1}`、`{2}`… 代入表格每一列的第 1、2… 欄，`table` 可指定該能力文字中的第幾個表格（預設第 1 個）；同樣只能用在文字。

## 不可改名的 ID

選項的 `id`、起始裝備組合的 `id`、下拉選單的 `select.id` 與選項值、動作的 `key`／`legacyKeys`、`resource.key`、子職 `id` 會寫進存檔、分享網址或跑團偏好；選項的 `attackNote` 會寫進角色的攻擊備註；子職法術的來源識別碼（見「能力給予的法術」）會寫進角色的法術清單。改顯示文字沒關係，這些 ID 不可改。

這些 ID 都列在根目錄的 `class-id-baseline.json`（私人內容包另有 `content/private/class-id-baseline.json`）；專長、背景、種族、法術與怪物各有 `feat-id-baseline.json`、`background-id-baseline.json`、`race-id-baseline.json`、`spell-id-baseline.json`、`monster-id-baseline.json`（見各節）。ID 不見、改名或新增而基準檔沒更新時，建置會失敗。確定是刻意新增時執行：

```bash
npm run build -- --update-id-baseline
```

## PDF 角色紙

PDF 匯出讀取內容檔：職業與子職名稱、生命骰、`weapons`、`armor`（勾選輕甲／中甲／重甲），以及職業特性欄的「等級 N：能力名稱」（子職能力加「（簡稱）」，不列「選擇子職」的能力）。

- 同等級要寫在同一行的能力各加 `pdfMerge: true`，依職業頁順序以「、」連接，例如「等級 1：狂暴、無甲防禦」。
- 有 `options`（不含 `changeOn` 與 `featChoice` 的選項）或 `select` 的能力，勾選或選擇的項目接在標題後，例如「等級 1：神聖使命／守護者」。

## 能力的資源

`resource` 定義能力的使用次數，跑團模式的資源區依此顯示與恢復（達到能力等級才出現）。`label` 是資源區顯示的名稱（例如聚氣凝神的「專注點」），省略時用能力名稱；恢復說明（例如「短休回 1 次，長休全回。」）由 `recover` 自動產生。`uses` 是次數（固定數字，或特性表欄位／`values` 名稱），`recover` 是短休（`short`）、長休（`long`）恢復的次數，`all` 為全部；恢復方式隨等級改變時，另寫 `recoverByLevel: { 5: { short: all, long: all } }`，從該等級起整個取代 `recover`。點數池（例如聖療，每次可消耗任意點數）另寫 `kind: points`，此時 `uses` 是點數池總量。

自動產生的恢復說明不適用時寫 `note`，`{名稱}` 換成目前數值（特性表欄位或 `values`）。完成短休時可選擇恢復其他資源的能力（奧術回想、術法復甦、自然恢復）寫 `restChoice`，跑團模式的休息視窗依此提供選項：

```yaml
resource:
  key: wizard-arcane-recovery
  uses: 1
  recover: {long: all}
  restChoice: {when: shortRest, restores: spellSlots, budget: arcaneRecoveryBudget, maxSlotLevel: 5}
  note: 完成短休時，恢復環階總和最多 {arcaneRecoveryBudget} 的已消耗法術位（法師等級一半，進位；單一法術位最高 5 環）。每次長休前只能使用 1 次；完成長休後恢復。
```

- `restores: spellSlots`：恢復法術位，環階總和不超過 `budget`（`values` 的公式，例如 `arcaneRecoveryBudget: ceil({level} / 2)`），`maxSlotLevel` 是單一法術位的最高環階。
- `restores: points`：恢復 `target` 資源的點數，最多 `budget` 點（例如術法復甦的 `target: sorcerer-sorcery-points`）。

## 能力給予的法術

`spells` 列出能力給予的法術（例如始終準備），`id` 是法術 ID，須存在於 `spell-id-baseline.json`；`freeUses` 是免費施放次數，可寫數字或特性表欄位名稱；`level` 是取得該法術的職業等級（省略時同能力等級，例如子職法術的 5 級、7 級）。

子職能力的 `spells` 由網站自動加入角色的法術清單（目前子職、達到法術的等級才加入），環階取自法術資料。依下拉選單給予不同法術時（例如大地結社依地貌）改寫 `spellsByChoice`：

```yaml
spellsByChoice:
  control: druid-land          # index.html 的下拉選單 ID，選項值須存在於該選單
  choices:
    - value: arid
      name: 旱地               # 法術來源顯示為「大地結社・旱地」
      spells:
        - id: fire-bolt
        - id: fireball
          level: 5
```

子職法術的來源識別碼「subclass-職業-名稱-…」會寫進角色的法術清單，名稱是子職名稱（依下拉選單時接「・選項名稱」），列在 ID 基準檔：子職名稱或選項名稱改字前須處理舊資料相容。舊版識別碼和子職名稱不同時寫 `spellSourceKey`（例如邪魔宗主沿用舊版的 `spellSourceKey: 邪魔`）。

## 專長

每個專長一個檔：`content/srd/feats/<英文檔名>.yaml`（例如 `grappler.yaml`），格式定義是 `content/schema/feat.schema.json`。專長選單的順序寫在 `content/srd/feat-order.yaml`（須剛好列出全部專長）。角色卡的專長選單與說明、自訂背景與快速創角的起源專長、跑團動作、PDF 專長欄都由這裡產生。

```yaml
# yaml-language-server: $schema=../../schema/feat.schema.json
id: 擒抱者
source: srd
type: general
prerequisite: { abilities: [str, dex] }
effects:
  - name: 屬性提升
    text: 力量或敏捷擇一 +1（最高 20）。
  - name: 重拳擒抱
    text: 每回合 1 次，徒手攻擊命中時可同時造成傷害並[[擒抱]]目標。
  - name: 攻擊優勢
    text: 對被你[[擒抱]]的目標攻擊具有[[優勢]]。
actions:
  - { mode: action, label: 重拳擒抱, key: dynamic-action-feat-curated-1cls37s, level: 4 }
pdf: [擒抱者(通用), 力量or敏捷+1, 徒手命中可擒抱]
```

| 欄位 | 說明 |
| --- | --- |
| `id` | 專長 ID（中文名），也是畫面上的專長名稱。檔名與 ID 無關：只用小寫英文、數字與連字號，SRD 專長用 SRD 5.2.1 的英文名（例如 `magic-initiate`），擴充專長依中文字義另取。會寫進存檔、JSON、分享網址與快速創角草稿，不可改字（列在 `feat-id-baseline.json`）；網站程式判斷特定專長時也用 ID（例如 `hasSelectedFeat("警覺")`）。 |
| `source` | 內容來源（`srd`／`extended`，同背景）。`extended` 的選單文字與說明副標加上來源標籤，說明最後加上來源說明；字樣由 `character-rules.js` 的 `getContentSourceLabel`、`getContentSourceNotice` 決定；選單文字「醫療兵(起源・擴充)」由 `formatContentSourceName` 產生（半形括號，類別與來源以「・」連接）。 |
| `type` | 類別：`origin` 起源專長、`general` 通用專長、`style` 戰鬥風格專長。決定哪些專長選擇列出它（背景與種族的起源專長、屬性值提升的等級專長、戰鬥風格，以及自行管理專長的分類選單），選單文字「擒抱者(通用)」與說明副標由此產生；類別字樣由 `character-rules.js` 的 `getFeatTypeLabel` 決定，新增類別時須一併加上字樣，否則建置失敗。 |
| `prerequisite` | 通用專長的先決條件，擇一：`abilities`（其中一項屬性值達 13）、`heavyArmor: true`（具重甲訓練）、`spellcasting: true`（具施法能力）。不符合時專長列顯示警示；副標的條件文字（例如「4 級以上；力量或敏捷 13+」）由此產生。 |
| `repeatable` | `true` 時可多次選擇。 |
| `grantsSpellcasting` | `true`：此專長提供施法來源（例如魔法學徒）。自訂背景選了這個起源專長時，角色視為有施法來源（顯示施法屬性欄、可選須具施法能力的專長）。 |
| `effects` | 效果，依說明順序，顯示為粗體「名稱：內容」。`text` 是一行文字，可用 `[[提示]]`（技能、規則或狀態名稱，例如 `[[優勢]]`、`[[擒抱]]`）；`list` 是接在後面的「·」清單；`after` 是清單之後空一行的補充段落。 |
| `actions` | 跑團按鈕：`mode`（`action`／`bonus`／`reaction`／`movement`）、`label`、`key`（進跑團隱藏偏好，不可改字，列在基準檔）、`level`（達到才出現，省略為 1）。說明預設是與 `label` 同名的效果內容，`effects` 可改列多個效果；需要另寫時用 `tabletop`（純文字，可換行）。`proficiencyValue: true` 時，已選等級就把說明中的「熟練加值」換成數值。 |
| `pdf` | PDF 專長欄的各行，第一行是空間不夠時只列的標題。省略時只有一行「名稱(類別)」。魔法學徒選完法表與法術後，PDF 改列所選法術，這裡的行是還沒選完時的提示。 |

- 建置檢查檔名與 `feat-order.yaml`、只有通用專長可寫 `prerequisite`、效果名稱不重複、動作的效果存在、動作 key 的分頁與 `mode` 相同且不重複、`[[提示]]` 是已知名稱；背景的起源專長須是 `type: origin`。
- `feat-id-baseline.json` 列出專長 ID、專長選擇的存檔欄位（`feat-choice-<來源>`、`derived-feat-<來源>`）、快速創角草稿的專長名稱（含背景的「魔法學徒（牧師）」）與跑團動作 key。
- `npm run build` 產生根目錄的 `feat-content.generated.js`：`featRules` 是結構化規則（類別、來源、可否重複、先決條件、跑團動作），`featText` 是組好的顯示文字（選單文字、說明 HTML、純文字說明、PDF 行、跑團說明）。網站經 `character-rules.js` 的 `getFeatRules`、`getFeatText`、`getAllFeatRules` 讀取，不從顯示文字反推規則。
- 跑團提示（例如警覺、醫療兵在總覽與法術頁的提醒）與依專長計算的數值（強韌體魄的 HP、迅捷步法的速度等）仍寫在網站程式，以專長 ID 判斷。

## 背景

每個背景一個檔：`content/srd/backgrounds/<背景 ID>.yaml`，格式定義是 `content/schema/background.schema.json`。

```yaml
# yaml-language-server: $schema=../../schema/background.schema.json
id: acolyte
name: 侍僧
source: srd
abilities: [int, wis, cha]
feat: { id: 魔法學徒, spellList: cleric }
skills: [洞悉, 宗教]
tool: 書法工具
equipment:
  A:
    items: [書法工具, 書籍（禱文）, { choose: 聖徽, from: [聖物匣, 徽章, 護身符] }, 羊皮紙 ×10, 祭袍]
    gold: 8
  B: { gold: 50 }
description: |
  你曾在神殿、修院或其他宗教場所度日，……
```

| 欄位 | 說明 |
| --- | --- |
| `id` | 背景 ID，須等於檔名。會寫進存檔、JSON、分享網址與購點紀錄，不可改名（列在 `background-id-baseline.json`）。 |
| `name` | 背景名稱，最多四字。 |
| `source` | 內容來源（必填）：`srd` 出自 SRD 5.2.1；`extended` 是本站另外撰寫的內容，選單名稱、背景頁與快速創角卡片會加上來源標籤，背景頁另顯示說明。標籤字樣由 `character-rules.js` 的 `getContentSourceLabel` 決定，名稱加標籤的寫法（例如「耕者(擴充)」）由 `formatContentSourceName` 產生。之後可再增加其他值。 |
| `abilities` | 可調整的三項屬性 ID（`str`、`dex`、`con`、`int`、`wis`、`cha`），購點與快速創角依此限制背景加值。畫面顯示為「智力、感知、魅力」。 |
| `feat` | 起源專長，寫專長 ID（`content/srd/feats` 的起源專長，ID 是中文名）。魔法學徒寫成 `{ id: 魔法學徒, spellList: 職業 ID }`，`spellList` 是法術列表（`cleric`、`druid`、`wizard`），畫面顯示為「魔法學徒（牧師）」。起源專長有 `grantsSpellcasting`（例如魔法學徒）時，背景也讓角色具有施法能力。 |
| `skills` | 兩項技能 ID（`character-rules.js` 的 `CharacterSkillAbilities`，目前是中文名），畫面自動加上提示框。 |
| `tool` | 工具熟練：工具 ID（`tool-data.js` 的工具名稱），或 `{ chooseFrom: 工具組 ID }` 從該組擇一（例如士兵的 `gaming`，畫面顯示「擇一賭具：……」，依工具目錄順序）。 |
| `equipment.A` | 預設裝備：`items` 是各項物品的純文字（例如「羊皮紙 ×10」），`gold` 是金幣數（顯示在最後，例如「8 金幣」）。擇一的工具寫 `{ toolChoice: true }`（只能用在 `tool` 為 `chooseFrom` 的背景），顯示為「賭具擇一」，快速創角換成玩家選的工具。擇一的物品寫 `{ choose: 聖徽, from: [聖物匣, 徽章, 護身符] }`，顯示為 `choose` 的文字，點按（A）時在視窗選；快速創角直接給 `choose` 這個通稱品項。 |
| `equipment.B` | 只有 `gold`（目前都是 50 金幣）。 |
| `description` | 背景描述，一段文字。可用 `**粗體**` 與 `[[提示]]`，不可有 HTML、數值標記或換行。 |

- 背景選單是 `index.html` 的固定選項：新增或改名時須一併修改，選項文字為 `name`，有來源標籤時加「(標籤)」（例如「耕者(擴充)」）。選單與內容檔對不上時建置會失敗。
- 建置檢查技能、工具與工具組、專長（須是起源專長）、法術列表的職業是否存在。
- `npm run build` 產生根目錄的 `background-content.generated.js`：`backgroundRules` 是結構化規則（含 `source`），`backgroundText` 是組好的顯示文字。網站經 `character-rules.js` 的 `getBackgroundRules`、`getBackgroundText`、`getBackgroundSource` 讀取，不從顯示文字反推規則。
- 自訂背景（`custom-background.js`）不是內容檔，存檔格式另訂；`getBackgroundRules("custom")` 會轉成同樣的規則結構，來源為 `custom`。
- 快速創角的背景卡片有自己的順序（`quick-build.js` 的 `BACKGROUND_ORDER`），新增背景時要加進去（回歸測試會檢查）。

## 種族

每個種族一個檔：`content/srd/races/<種族 ID>.yaml`，格式定義是 `content/schema/race.schema.json`。種族頁、角色卡計算、跑團動作與提示、PDF 種族特質欄、快速創角的種族資料都由這裡產生。

```yaml
# yaml-language-server: $schema=../../schema/race.schema.json
id: dwarf
name: 矮人
source: srd
creatureType: 類人生物
sizes:
  - { size: 中型, height: 約 4-5 呎高 }
speed: 30
darkvision: 120
description: |
  矮人身形矮壯、蓄長鬚，……
traits:
  - { id: darkvision, name: 黑暗視覺 }
  - id: dwarven-resilience
    name: 矮人體魄
    text: 對抗[[中毒]]狀態的豁免具有優勢，受到的毒素傷害減半。
    resistances: [poison]
    hint: { panels: [skills], summary: 對中毒狀態的豁免有優勢。 }
  - id: stonecunning
    name: 石中精妙
    text: 使用**附贈**獲得 60 呎**震顫感知**，……使用次數＝熟練加值，長休後恢復。
    resource: { key: dwarf-stonecunning, uses: proficiencyBonus }
    actions:
      - { id: stonecunning, mode: bonus, label: 石中精妙, key: dynamic-bonus-race-m9n3bt, resource: dwarf-stonecunning }
pdf:
  lines: [黑暗視覺120呎, 毒素抗性, ……, "限用{proficiency}次"]
```

### 種族欄位

| 欄位 | 說明 |
| --- | --- |
| `id` | 種族 ID，須等於檔名。會寫進存檔、JSON 與分享網址，不可改名（列在 `race-id-baseline.json`）。 |
| `name`、`source` | 種族名稱（最多四字）與內容來源（`srd`／`extended`，同背景）。 |
| `creatureType`、`sizes`、`speed` | 種族頁開頭的三行。`sizes` 有兩項時（人類、提夫林）角色卡顯示體型選單，預設第一項；只有一項時體型固定。 |
| `speed` | 速度（呎）。角色卡的基礎速度欄預設 30；種族或所選血統的速度不是 30 時（歌利亞、木精靈 35）以內容檔為準。 |
| `darkvision` | 黑暗視覺（呎），跑團技能頁顯示。`id: darkvision` 且沒寫 `text` 的特質，文字自動產生「你擁有 N 呎黑暗視覺。」。 |
| `languageOptions` | 額外開放選擇的語言（語言選單的 value，例如提夫林的 `infernal`）；選單中該選項須帶 `data-race-language`。 |
| `description` | 種族介紹，純文字，段落之間空一行。 |
| `choice` | 血統等下拉選擇（每個種族最多一個，見下方「血統選擇」）。 |
| `traits` | 特質，依種族頁順序（見下方「特質」）。 |
| `pdf` | PDF 種族特質欄（見下方「PDF」）。 |

### 特質

| 欄位 | 說明 |
| --- | --- |
| `id`、`name` | 特質 ID（種族內不可重複）與名稱（種族頁小節標題）。 |
| `text` | 種族頁內文：單行段落與「- 」清單，可用 `**粗體**` 與 `[[提示]]`。跑團動作的說明預設也用這段文字（純文字，清單項目以「  - 」開頭）。 |
| `level` | 達到此等級才有效（資源、動作、飛行），例如龍翔天際、巨化形體的 5。 |
| `choice: true`、`afterChoice` | 在此特質的文字之後顯示血統選擇（表格或各選項小節）；`afterChoice` 是接在表格後的文字。 |
| `resource` | 跑團資源。`key` 進存檔（列在基準檔）；`uses` 是數字或 `proficiencyBonus`；`recover: { short: all }` 表示短休也全部恢復。`kind: checkboxes` 是角色卡上的勾選框（`container` 為外框 ID，`checkbox` 為勾選框 ID 前綴，`requiresChoice` 表示選了血統才出現）；`kind: inspiration` 是長休獲得英雄激勵。 |
| `actions` | 跑團按鈕：`key` 進跑團隱藏偏好（列在基準檔，不可改字）、`mode`、`label`、`resource`（資源 `key` 或勾選框的 `container`）、`level`、`className`、`tabletopOnly`、`proficiencyValue`。說明和特質文字不同時寫 `tabletop`；`tabletopSuffix` 空一行接在說明後；需依角色數值計算的說明寫 `behavior`（由 `action-panel.js` 的同名函式產生）。 |
| `hint` | 跑團提示：`panels`（`overview`／`skills`）與 `summary`，標題為特質名稱。 |
| `spells` | 種族特質給予的法術（例如提夫林的奇術）：`spell` 是法術 ID，`level` 是取得等級，`freeUses` 是免費施展次數；戲法或環階由法術目錄決定。 |
| `resistances` | 固定的傷害抗性（傷害類型 ID，例如 `poison`），名稱由 `character-rules.js` 的 `getDamageTypeLabel` 決定。 |
| `skillChoice` | 選一項技能熟練：技能 ID 清單，或 `any`。 |
| `feat` | 起源專長選擇：`key`（專長欄位 `feat-choice-<key>` 進存檔）與 `label`。 |
| `hpPerLevel`、`carryMultiplier`、`longRest`、`flight` | 每級 HP 上限加值、負重倍數、長休視窗開頭的文字（例如「傳思 4 小時」）、達到等級後跑團移動頁顯示飛行。 |

### 血統選擇

`choice` 的 `id` 是 `index.html` 的選單 ID，也是存檔欄位名；`label` 是選擇的名稱（選單、未選提醒、PDF 匯出標題）；`draftField` 是快速創角草稿存放此選擇的欄位名（`quickBuildLabel` 是快速創角上的名稱）。`display.type` 決定種族頁的呈現：`ancestry-table`（名稱＋傷害的格子表，寫 `columns`）、`lineage-table`（依等級列出法術的表）、`sections`（每個選項一個小節，選項寫 `text`）。

每個選項：

| 欄位 | 說明 |
| --- | --- |
| `value` | 選單值，進存檔，不可改字（列在基準檔）。 |
| `name`、`subtitle` | 種族頁上的名稱（表格欄名、小節標題）；有 `subtitle` 時標題為「名稱（subtitle）」。 |
| `label`、`pdfLabel`、`draftValue` | 角色卡選單文字（預設 `name`）、PDF 欄的名稱（預設 `label`）、快速創角草稿的值（預設小節標題；進草稿與綠背確認，不可改字，列在基準檔）。 |
| `short`、`description` | 種族介紹中的血統說明，顯示為「簡稱：說明」。 |
| `damage`、`resistance`、`speed`、`darkvision` | 吐息與表格的傷害文字、傷害抗性（傷害類型 ID）、速度、黑暗視覺（取代種族的值）。`lineage-table` 的 1 級格會自動列出速度、黑暗視覺與抗性。 |
| `spells`、`cantripChoice` | 血統法術（表格依等級列出法術名稱）、1 級自選戲法（例如高等精靈：`field` 為選單 ID、`spellList`、`default`、表格小字 `detail`）。 |
| `actions`、`pdf` | 選了此項才出現的跑團按鈕（只用於 `sections`）；PDF 依等級插入的行。 |

- 種族選單與血統選單是 `index.html` 的固定選項：新增或改名時須一併修改（選項值、文字、「--請選擇○○--」與順序），對不上時建置會失敗。選了血統後，種族頁只顯示該選項（建置在相關格子與小節加上 `data-race-choice-option`）。
- 私人內容包目前不支援種族：`content/private/races/` 存在時建置會失敗。

### PDF

`pdf.lines` 是 PDF 種族特質欄的各行。字串可用 `{proficiency}`（熟練加值，未填等級為 P）、`{choice}`（所選血統的 `pdfLabel`，未選時為 `choiceFallback`）、`{conModifier}`、`{breathSaveDc}`、`{breathDice}`。`{ choice: 等級, fallback: [...] }` 插入所選血統選項 `pdf` 中該等級的行（未選時用 `fallback`）；`{ minLevel: 等級, lines: [...] }` 只在等級達到或未填等級時出現。

### 建置與讀取

- 建置檢查技能、法術、自選戲法、語言、資源與動作的對應，以及 `race-id-baseline.json`（種族 ID、血統選單與選項值、草稿欄位與值、跑團動作 key、資源 key、勾選框前綴、種族法術來源識別碼）。
- `npm run build` 產生根目錄的 `race-content.generated.js`：`raceRules` 是結構化規則，`raceText` 是組好的顯示文字（種族頁 HTML、跑團純文字、動作說明、提示、PDF 行）。網站經 `character-rules.js` 的 `getRaceRules`、`getRaceText`、`getAllRaceRules`、`getRaceChoiceOption` 讀取，不從顯示文字反推規則。
- 快速創角的種族卡片說明、血統短評與完成摘要是快速創角自己的介紹文字，留在 `quick-build.js`（以種族 ID 與草稿值為 key）；新增種族或血統時要補上（回歸測試會檢查）。

## 法術

每個法術一個檔：`content/srd/spells/<法術 ID>.yaml`，格式定義是 `content/schema/spell.schema.json`。收錄 SRD 5.2.1 全部 339 個法術。上半部是規則欄位（只寫一次）；下半部是文字區塊：

- `site`：網站版，玩家實際使用的版本（分行條列的說明、跑團擲骰）。**有 `site` 的法術才是角色可用的法術**：職業法表、準備法術、法術書、快速創角、跑團與 PDF 都只看得到它們。規則和 SRD 不同時（例如職業法表）以網站版為準。
- `srd`：SRD 繁中直譯，法術詳情的「SRD 版」（唯讀、沒有擲骰按鈕，頁尾註明譯自 SRD 5.2.1）。
- `en`：SRD 英文原文，只供校對，建置不會送到網站。

只有 `srd`、`en`、沒有 `site` 的法術（目前是五至九環的 122 個）只供查閱，任何情況下都不能準備或加入角色。

```yaml
# yaml-language-server: $schema=../../schema/spell.schema.json
id: fire-bolt
name: 火焰箭
nameEn: Fire Bolt
source: srd
level: 0
school: evocation
classes: [ sorcerer, wizard ]
castingTime: [ action ]
range: { feet: 120 }
components: [ V, S ]
duration: instantaneous
site:
  outcomes:
    - { kind: damage, attack: spell, formula: 1d10, cantripAt5: 2d10, damageType: fire, autoOnCast: true, context: 命中時傷害 }
  body: |-
    - 向射程內一個生物或物體擲出火焰，對目標進行一次遠程法術攻擊
    - 命中時，目標受到1d10火焰傷害
    - ……
srd:
  body: |-
    你朝射程內的一個生物或物體擲出一團火焰。……

    _戲法升級。_ 當你達到5級（2d10）、11級（3d10）與17級（4d10）時，傷害增加1d10。
en:
  body: |-
    You hurl a mote of fire at a creature or an object within range. …
```

### 規則欄位

| 欄位 | 說明 |
| --- | --- |
| `id` | 法術 ID（spellId），須等於檔名。會寫進存檔、JSON 與分享網址，不可改名；有 `site` 的法術列在 `spell-id-baseline.json`。 |
| `name`、`nameEn` | 中文名、英文名（畫面顯示「火焰箭 Fire Bolt」）。舊存檔以名稱記錄法術時用它們轉成 ID，改字前須處理相容；全部法術的名稱不可重複。網站已有的法術沿用網站名稱。 |
| `source` | 內容來源：`srd`（須有 `srd` 區塊）、`extended`（本站撰寫）、`private`（私人內容包）。 |
| `level`、`school` | 環階（0 為戲法）；學派：`abjuration` 防護、`conjuration` 咒法、`divination` 預言、`enchantment` 惑控、`evocation` 塑能、`illusion` 幻術、`necromancy` 死靈、`transmutation` 變化。 |
| `classes` | 哪些職業的法表有此法術。法表內依環階、再依 ID 排序，不另寫順序。有 `site` 的法術以網站法表為準；SRD 的職業清單不同時（例如網站法表刻意不列聖騎士、遊俠的三、四環法術），另寫在 `srd.classes`。 |
| `castingTime` | 施法時間，可有多個：`action`、`bonus-action`、`reaction`、`{ minutes: N }`、`{ hours: N }`。例如植物滋長 `[ action, { hours: 8 } ]` 顯示「動作或8小時」。跑團的動作／附贈／反應分頁與法術按鈕上的小標依此決定。 |
| `ritual` | `true`：可儀式施法（顯示「或儀式」）。 |
| `range` | `self` 自身、`touch` 觸及、`sight` 視線內、`unlimited` 無限、`special` 特殊、`{ feet: N }`、`{ miles: N }`。 |
| `components` | `[ V, S, M ]`（依此順序）。有 `M` 時各文字區塊都要寫 `material`。 |
| `duration` | `instantaneous` 立即、`until-dispelled` 直到被解除、`until-dispelled-or-triggered` 直到被解除或觸發、`special` 特殊，或 `{ rounds: N }`（輪；分鐘、小時、天為 `minutes`、`hours`、`days`）；`upTo: true` 顯示「最長」。 |
| `concentration` | `true`：需要專注（顯示「專注，最長…」，跑團追蹤專注）。 |
| `upcast` | `true`：以更高環位施放有額外效果（跑團施法視窗可選更高環位）。網站版說明須有「使用更高環階法術位」的段落，建置會核對。 |

### 文字區塊

| 欄位 | 說明 |
| --- | --- |
| `material` | 材料內容，顯示為「材料: …」。網站版與 SRD 版各寫各的。 |
| `trigger` | 反應或附贈動作的觸發條件，顯示在施法時間後面（「反應動作，當你…」）。反應動作必填。 |
| `body` | 說明。`site.body` 是「- 」開頭的分行條列（前置兩個空白為巢狀）；`srd.body` 是段落（空行分隔）、`_斜體小標_`、`**粗體**`、「- 」清單、`#### 小標` 與表格。開頭的學派、施法時間等標頭由規則欄位自動產生，不寫在 `body`。 |
| `srd.classes` | SRD 的職業清單，只在有 `site`、且與 `classes` 不同時才寫。只用於查閱與搜尋的職業分類（兩者的聯集），不影響職業法表與準備法術。建置檢查職業 ID，`tools/spell-reference/validate.js --srd` 與 SRD 比對。 |
| `site.tabletop` | 跑團版說明（跑團動作分頁與跑團法術詳情）；省略時用 `site.body`。目前沒有法術使用。 |
| `site.wildCompanion` | 德魯伊荒野夥伴施放時的跑團說明（特例，只有 `find-familiar`）：`castingTime`、`components`（不含材料）、`duration`、`body`，學派與射程同法術。只有跑團的荒野夥伴動作與法術頁的荒野夥伴法術詳情使用；SRD 版、法術書、搜尋與其他職業仍是一般版本。 |
| `site.outcomes` | 跑團施法結果（擲骰按鈕）：`kind`（`damage`／`healing`／`temporary-hp`／`attack`）、`formula` 或 `fixed`、`cantripAt5`、`upcastDice`、`damageType`（或可選的 `damageTypes`）、`autoOnCast`（施法時自動擲骰）、`context` 等，欄位說明見格式定義。 |

- 建置檢查：格式、檔名、名稱不重複、成分與材料、觸發條件、`upcast` 與網站版說明、`outcomes` 的骰式與升環欄位，以及 `spell-id-baseline.json`（只列有 `site` 的法術；新增可用法術或移除 `site` 都須確認後更新基準檔）。
- `npm run build` 產生根目錄的 `spell-content.generated.js`：`spellRules`（全部法術的規則；`playable` 為角色可用）、`spellText`（網站版的 `desc` 標頭＋說明、`header` 標頭各項、`tabletop`、`wildCompanion`）。網站經 `spell-list.js` 的 `SpellCatalog` 讀取，不從說明文字反推規則。`spell-srd.generated.js` 是 SRD 版的 HTML，網站第一次切到「SRD 版」時才載入，離線版內嵌。英文原文不寫進任何產生檔。
- SRD 譯文的用語與檢查見 [tools/spell-reference/README.md](../tools/spell-reference/README.md)。

### 私人法術（尚未啟用）

私人法術放 `content/private/spells/<法術 ID>.yaml`，格式相同，`source: private`，只需要 `site` 區塊；非 SRD 的直譯與英文原文放 `reference`、`referenceEn`（只在你的電腦上）。**目前建置不讀取這個資料夾**，私人法術不會出現在網站上；啟用時另需私人 ID 基準檔與產生檔。下面是示意（虛構的法術）：

```yaml
# yaml-language-server: $schema=../../schema/spell.schema.json
id: example-spark
name: 示範火花
nameEn: Example Spark
source: private
level: 1
school: evocation
classes: [ sorcerer, wizard ]
castingTime: [ action ]
range: { feet: 60 }
components: [ V, S ]
duration: instantaneous
site:
  body: |-
    - （網站版的分行說明）
reference:
  body: |-
    （中文直譯）
referenceEn:
  body: |-
    (English original)
```

## 怪物

每個怪物一個檔：`content/srd/monsters/<key>.yaml`，格式定義是 `content/schema/monster.schema.json`。收錄德魯伊荒野形態清單的野獸、CR 2 以上的 SRD 野獸（只供查閱，之後給私人內容的子職用）、獲得魔寵／尋獲坐騎的召喚物與魔寵（小魔鬼、偽龍等）。做法比照法術：上半部是只寫一次的結構化數值；下半部是文字區塊：

- `site`：網站版，只寫特性與動作各自的說明、用途短說明（`summary`）、語言與裝備。資料卡的數值行（AC、HP、速度、屬性、豁免、技能、感官、攻擊檢定與傷害）由頂層數值產生，不手寫。網站版不顯示 XP、熟練加值、陣營、先攻，沒有語言時不顯示語言。跑團荒野形態也直接用這些文字：變形視窗的形態卡片顯示 `summary`，行動頁的野獸攻擊卡與特性小卡顯示各動作的 `text` 與各特性。
- `srd`：SRD 5.2.1 繁中直譯，野獸資料卡的「SRD 版」（唯讀，頁尾註明譯自 SRD 5.2.1）。特性與動作的名稱沿用網站版。
- `en`：SRD 英文原文，只供校對，建置不會送到網站。

```yaml
# yaml-language-server: $schema=../../schema/monster.schema.json
id: wolf
name: 狼
nameEn: Wolf
source: srd
size: medium
type: beast
alignment: unaligned
cr: "1/4"
xp: 50
ac: 12
initiative: 2
hp: { average: 11, dice: 2d8+2 }
speed: { walk: 40 }
abilities: { str: 14, dex: 15, con: 12, int: 3, wis: 12, cha: 6 }
skills: { 察覺: 5, 隱匿: 4 }
senses: { darkvision: 60 }
passivePerception: 15
actions:
  - id: attack-0
    attack: { kind: melee, hit: 4, reach: 5 }
    damage: [ { type: piercing, dice: 1d6+2 } ]
site:
  summary: 群體戰鬥、追蹤
  traits:
    - name: 群攻
      text: 若目標5呎內至少有一名狼的盟友，且該盟友未陷入失能，狼對該目標的攻擊檢定具有優勢。
  actions:
    attack-0: { name: 咬擊, text: 命中中型或更小的目標：目標倒地。 }
srd:
  traits:
    - name: 群攻
      text: ……
  actions:
    - name: 咬擊
      text: _近戰攻擊檢定：_ +4，觸及5呎。_命中：_ 5（1d6 + 2）穿刺傷害。若目標是中型或更小的生物，目標陷入倒地狀態。
en:
  traits:
    - name: Pack Tactics
      text: ……
  actions:
    - name: Bite
      text: "_Melee Attack Roll:_ +4, reach 5 ft. _Hit:_ 5 (1d6 + 2) Piercing damage. If the target is a Medium or smaller creature, it has the Prone condition."
```

### 數值欄位

| 欄位 | 說明 |
| --- | --- |
| `id` | 怪物 key，英文名轉小寫、以底線連接，須等於檔名。寫進跑團狀態（德魯伊已知形態、目前形態）、職業頁 `data-beast` 與法術頁的野獸按鈕，不可改名（列在 `monster-id-baseline.json`）。 |
| `name`、`nameEn` | 中文名、英文名。職業頁的 `[[中文名]]` 提示框以中文名查表，全部怪物不可重複。 |
| `size`、`type`、`subtype` | 體型（`tiny`～`gargantuan`）、生物類型（可選類型的召喚物寫成陣列）、類型標籤（`devil` 魔鬼、`demon` 惡魔、`dinosaur` 恐龍）。 |
| `alignment`、`xp`、`initiative` | 陣營、經驗值、先攻調整值，只在 SRD 版顯示。熟練加值由 CR 計算。 |
| `cr` | 挑戰等級（字串，`"1/4"`）。德魯伊荒野形態依此判斷可選範圍。 |
| `ac`、`hp` | AC；HP 寫 `{ average, dice }`，建置核對平均值。 |
| `speed` | `walk`、`burrow`、`climb`、`fly`、`swim`（呎），`hover: true` 為懸浮。 |
| `abilities`、`saves`、`skills` | 屬性值；與調整值不同（具熟練）的豁免加值；技能加值（key 是網站的技能名稱）。跑團變形後的豁免與技能和角色自己的取高。 |
| `senses`、`passivePerception` | `blindsight`、`darkvision`、`tremorsense`、`truesight`（呎）；被動察覺。 |
| `damageResistances`、`damageImmunities`、`damageVulnerabilities`、`conditionImmunities` | 傷害類型 ID（同法術的 `damageType`）；狀態免疫用 `condition.js` 的狀態 key。 |
| `variable` | `true`：AC、HP 隨施法變化的召喚物（異界坐騎）。不寫 `ac`、`hp`、`initiative`，改在 `site`、`srd`、`en` 各寫 `ac`、`hp`、`cr` 文字；沒有跑團數值。 |

### 動作

`actions` 依 SRD 順序列出動作、附贈動作（`mode: bonus`）與反應動作（`mode: reaction`）。

- `id`：寫進跑團狀態（`beastUsed` 的「key:id」）、跑團動作 key（`druid-beast-<key>-<id>`）與動作偏好，不可改名。有攻擊檢定的動作依序為 `attack-0`、`attack-1`…，其他動作用英文名（多重攻擊為 `multi`，例如 `web`、`ink`）。
- `attack`：`{ kind: melee | ranged | melee-or-ranged, hit, reach, range: [正常, 最遠] }`。
- `save`：`{ ability, dc, half: true }`（`half` 為成功減半）。
- `damage`：`[{ type, dice }]` 或 `[{ type, fixed: 1 }]`，第二項起顯示為「外加」；平均值由建置計算。之後才發生的傷害（吞下）加 `timing: next-turn-end | each-turn-end`。
- `recovery`：`recharge-5`、`recharge-6`、`daily`（次數寫 `uses`）、`long-rest`；跑團依此追蹤已使用。
- `conditional`：條件成立時的額外或替代傷害 `[{ when, type, dice }]`，`when` 為 `charge-extra`（衝鋒額外）、`charge-instead`（衝鋒替代）、`bloodied-target-instead`（目標受創時替代）；跑團另有擲骰按鈕。

`site.actions` 以 id 對應每個動作的 `name` 與 `text`。攻擊動作的 `text` 接在產生的「近戰攻擊檢定+4，觸及5呎；命中：5（1d6+2）穿刺傷害。」之後，只寫額外效果；其他動作的 `text` 是整句說明，可用 `{save}`（「DC12力量豁免」）、`{damage}`、`{conditional}` 代入數值（豁免動作必須用 `{save}`，沒有攻擊檢定的傷害必須用 `{damage}`），數值不手寫。

### 文字區塊與檢查

- `srd`、`en` 的 `traits`、`actions`、`bonusActions`、`reactions` 依 SRD 順序，項目數須與 `site.traits`、頂層 `actions`（依 `mode`）相同；SRD 版名稱沿用網站版（使用限制寫在名稱後，例如「蛛網（充能5–6）」）。語言、裝備與黑暗視覺附註寫在 `languages`、`gear`、`senseNotes`。
- 建置檢查：格式、檔名、中文名不重複、技能名稱與狀態 key、HP 平均值、動作 id 與 `site.actions` 對應、代入標記、SRD 版與英文的項目數與骰式一致，以及 `monster-id-baseline.json`（`monsters` 為 key，`actions` 為「key:動作 id」）。
- `npm run build` 產生根目錄的 `monster-content.generated.js`：`monsterRules`（結構化數值）、`monsterText`（網站版資料卡文字 `statBlock`、`summary`、`traits`、`actions`）、`monsterLabels`（跑團顯示的名稱）。網站經 `monster.js` 的 `BeastCatalog`（`get`、`getStatBlock`、`getRules`）讀取，資料卡由 `createBeastCard`（含「網站版｜SRD 版」切換）與 `renderBeastPopupHtml` 產生。`monster-srd.generated.js` 是 SRD 版的 HTML，第一次切到「SRD 版」時才載入，離線版內嵌。英文原文不寫進任何產生檔。
- 德魯伊荒野形態可選的野獸另列在 `druid-wild-shape-beasts.js`（使用者自編的參考清單）；`label`、`cr`、`hasFlight` 須與該野獸的中文名、CR、飛行速度一致，建置會檢查。類型為野獸、但不在這份清單的野獸（目前是 CR 2 以上的 20 種）只供查閱：職業頁「查看其他動物」下方的第二層收合「其他野獸（只供查閱）」依 CR 列出並註明無法變形，跑團模式不顯示。
- 存檔裡的已知形態與目前形態：有跑團數值的野獸 key 即使不在清單也保留（例如私人內容才能選的形態），只是不顯示、不能變形、不計入已知數量；目前形態不在清單時視為原形但不清掉，autosave、JSON 與分享都照原樣帶著。
- 異界坐騎不在 SRD 的怪物章節，是尋獲坐騎法術內附的數據塊；`srd`、`en` 取自該法術的 SRD 譯文與原文。
- 用語同法術譯文（見 [tools/spell-reference/glossary.md](../tools/spell-reference/glossary.md)）：傷害類型用 `SpellCatalog.damageTypeLabels`、狀態用 `condition.js` 的名稱，數字與單位之間不留空格。

## 檢查與預覽

| 指令 | 用途 |
| --- | --- |
| `npm run dev` | 開本機預覽，存檔後自動重新建置，重新整理瀏覽器即可看到；畫面網址會顯示在終端機 |
| `npm run build` | 檢查全部內容檔並產生 `monster-content.generated.js`、`monster-srd.generated.js`、`spell-content.generated.js`、`spell-srd.generated.js`、`class-content.generated.js`、`class-content.private.generated.js`、`feat-content.generated.js`、`background-content.generated.js` 與 `race-content.generated.js`，有錯就列出檔案與位置 |
| `npm run build -- --public-only` | 同上，但私人資料檔為空檔（只看公開內容） |
| `npm run build -- --update-id-baseline` | 確定是刻意新增 ID 時更新各基準檔（見「不可改名的 ID」） |
| `node tools/spell-reference/validate.js` | 檢查法術的 SRD 譯文（見 [tools/spell-reference/README.md](../tools/spell-reference/README.md)） |

改完內容檔只要提交內容檔本身。`monster-content.generated.js`、`monster-srd.generated.js`、`spell-content.generated.js`、`spell-srd.generated.js`、`class-content.generated.js`、`feat-content.generated.js`、`background-content.generated.js`、`race-content.generated.js` 是產生的檔案，不放進 repo、不可手改：本機用 `npm run dev` 或 `npm run build` 產生，上線時由 GitHub Actions 產生。這些檔案只含公開內容包；私人內容只寫進 `class-content.private.generated.js`（同樣不提交），上線建置與離線角色卡的這個檔一律是空檔。

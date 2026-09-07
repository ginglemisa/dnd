# Action metadata migration

## 範圍與完成狀態

基準：`76a417298b345f5685b3a05e24353b2188fa7c88`。
盤點來源為 repository 中的 `class-features.js`、`race.js`、`feats.js`、
`backgrounds.js`、`index.html` 與各桌邊模組；沒有使用外部 D&D 規則。

本次完成非 Spell 動作的 explicit metadata 遷移，保留現有全域 API、DOM
角色選擇、兩個 Action UI、法術 timing parser 與資料儲存格式。

## 資料流與 parser 盤點

遷移前，`getDynamicOptions()` 合併下列來源：

| 路徑 | 舊機制 | 完成後 |
| --- | --- | --- |
| 職業／子職 | `getFeatureEntries()` 掃描 `#classFeatures.innerHTML`，再由 `extractTimedFeatureEntries()` 猜 Bonus／Reaction | `CLASS_ACTION_RULES` 明定 class、mode、level、id／key、description 或 descriptionId |
| 種族／血統 | 同一 parser 掃描 `#raceFeatures.innerHTML`，再以名稱排除其他血統 | `RACE_ACTION_RULES` 明定 race、level、mode 與 choiceId／choiceValue |
| 專長 | `getSelectedFeatEntries()` 解析尚未被 curated 規則覆蓋的 `featsDesc` | 所有既有動作由 `TABLETOP_FEAT_ACTION_RULES` 明定 modes 與專長／等級條件 |
| 超魔法 | 已勾選卡片說明含「附贈動作」才建立按鈕 | 明確限定已選「瞬發法術」、術士、等級 2+ |
| 魔能祈喚 | mode 對應的明確名稱白名單 | `INVOCATION_ACTION_RULES` 合併 mode、等級與前置祈喚 |
| 魯莽攻擊 | 搜尋渲染後 h3 的文字取得能力段落 | 固定 descriptionId 指向原始 class data |
| 法術 | 已選法術的 `SpellCatalog` 說明，由專用施法時間 regex 分類 | 完整保留，函式內容未改動 |

`sourceToPlainText()` 仍用於說明文字的 HTML 轉純文字。
`getClassActionDescription()` 只讀取 canonical class data 中指定的
`data-action-id`；移除 h3 只是避免顯示重複標題。
`getNamedRuleDescription()` 只取得 metadata 已明確指定的種族／專長說明，
並保留續行和清單。這些函式均不決定能力是否存在、等級或動作分類。
`index.html` 既有的祈喚／超魔法說明擷取與法術衍生選項流程也保持原狀。

## 職業與子職 migration checklist

全部 12 職業、等級 1–8 均已比對。專案目前每職業只提供一個固定子職，
沒有獨立 subclass form control；子職能力由所屬 class 與取得等級限制。
沒有新增子職選單或假設 repository 未提供的子職。

| 職業（固定子職） | 原本依賴 broad parser 的有效按鈕 | 既有 explicit／其他路徑及本次補齊 |
| --- | --- | --- |
| 野蠻人（狂戰士） | 無；狂暴、直覺猛撲已由 curated 覆蓋 | 保留狂暴、魯莽、狂怒、額外攻擊、快速移動、直覺猛撲；統一 resolver |
| 吟遊詩人（逸聞） | 激勵 1／Bonus、語出驚人 3／Reaction、反迷惑 7／Reaction | 保留激勵骰動態說明 |
| 牧師（生命） | 無 | 補引導神力 2／Action（含神聖火花、驅散不死生物）、維持生命 3／Action |
| 德魯伊（大地） | 荒野形態 2／Bonus | 補荒野夥伴 2／Action、大地之援 3／Action |
| 戰士（勇士） | 回氣 1／Bonus、戰術轉移 5／Bonus | 補動作如潮 2／Action |
| 武僧（散打） | 武藝 1／Bonus、撥擋化勁 3／Reaction、輕身墜 4／Reaction、混元體 6／Bonus | 保留聚氣凝神、散打技巧、震懾擊的 curated 說明 |
| 聖騎士（奉獻） | 聖療 1／Bonus、神聖感知 3／Bonus | 補祝聖武器 3／Action；至聖斬沿用衍生法術 |
| 遊俠（獵人） | 無 | 無需 broad parser；獵人印記等沿用衍生法術 |
| 盜賊（妙手） | 靈巧動作 2／Bonus、快手 3／Bonus、手穩就準 3／Bonus、直覺閃避 5／Reaction | 全部 explicit |
| 術士（龍族） | 天生術法 1／Bonus、魔力泉湧 2／Bonus、術法化身 7／Bonus | 保留既有 curated 說明；瞬發法術由明確選擇識別 |
| 契術師（邪魔） | 無獨立 class parser 按鈕 | 已選祈喚與衍生法術分別處理 |
| 法師（塑能） | 無 | 無需 broad parser；既有法術路徑保留 |

沒有為了對稱性新增所有被動特性或把休息能力變成新的回合動作。
舊的 Action curated 項目也包含攻擊修飾能力，保持原有產品分類。

## 種族、專長、背景與選擇

| 來源 | 明確 coverage |
| --- | --- |
| 龍裔 | 保留吐息及其傷害／DC／血統計算；龍翔天際 Bonus 限 5+ |
| 矮人 | 石中精妙 Bonus |
| 侏儒 | 岩石血統的發條裝置 Bonus；補拆除裝置 Action；森林血統不顯示 |
| 歌利亞 | 雲／Bonus；火、霜、山丘／Action；石、風暴／Reaction；巨化形體 Bonus 限 5+。只有選定血統出現 |
| 半身人 | 保留吉運、天生善匿 Action、半身人靈巧 Movement；盜賊 2+ 另有天生善匿 Bonus |
| 獸人 | 熱血湧動 Bonus，保留熟練加值實際數字並顯示來源中的使用次數／恢復說明 |
| 精靈、人類、提夫林 | 無其他獨立 timed non-spell 按鈕；種族法術／專長沿用既有選擇流程 |
| 原本 explicit 專長 | 醫療兵、擒抱者、衝鋒猛擊、雙持追擊、最佳旅伴、封鎖者、迅捷步法 |
| 原本 parser 專長缺口 | 雙持追擊 Bonus、尋物好手的信手拈來 Bonus、臨陣施法的迎擊法術 Reaction，已補齊 |
| 其餘專長 | 20 個 `featsDesc` 項目均已盤點；無新增獨立 timed action。武器摘要／被動效果的原有處理保留 |
| 背景 | `backgrounds.js` 無獨立回合動作；經 `syncDerivedFeatRows()`／法術來源取得能力。測試實際選「孤芳」後出現醫療兵動作 |
| 祈喚 | 刃之魔契 Bonus、鏈之魔契 Action；共視感官 Bonus 限 5+；鏈主賦能 Bonus／Reaction 限 5+ 且已選鏈之魔契 |
| 祈喚施法 | 原本有 spellId 的祈喚繼續經衍生法術列與原 spell parser，不再新增平行法術按鈕 |
| 超魔法 | 所有 10 項已檢查，只有瞬發法術授予本系統的 Bonus 按鈕 |

## 分類、去重、顯示偏好與相容性

- Basic 與共用 Movement／Bonus／Reaction 規則仍由 `STATIC_OPTIONS` 提供。
- 桌邊 Movement 原有特殊速度／速度變化過濾，以及龍裔 5+ 的飛行顯示條件保持原狀。
- `getOptions()` 和 legacy Action UI 保留原本的 static-only 行為；
  `getTabletopOptions()` 繼續提供 static + resolved dynamic options。
- 類別／種族共用 `resolveFeatureRules()`；feat 格式化、祈喚和法術維持各自必要的 adapter。
- 保留全部既有 option key，包括 parser 以前產生的 key；改說明或標籤不必讓隱藏偏好失效。
- 保留最終全來源去重，包含 `spellSourceKey`，所以同法術不同來源仍可各自施放。
- `tabletop-actions.js` 的 `official:<mode>:<key>`／`custom:<id>` 過濾、
  自訂動作新增／修改／移除，以及 `TabletopMode` 的 preference normalization 完整保留。
- 動作偏好原本儲存在 `dnd.tabletopActionPreferences.v1`，屬於本機設定，
  不包含在角色 JSON／分享 schema 中。本次沒有改變這個產品行為。
- 未變更 TabletopMode facade、DiceRoller、生命值、死亡豁免、資源或施法流程。
- 只更新實際修改的 JS cache versions；沒有重建離線衍生檔。

## 移除的 obsolete code

已移除 `extractTimedFeatureEntries()`、`getFeatureEntries()`、
`getSelectedFeatEntries()`、`findFeatureTitle()`、`cleanFeatureTitle()`、
`isMeaningfulInlineTitle()`、`isStandaloneFeatureHeading()`、`relevantParagraph()`、
從標題猜等級的 `getRequiredLevel()`、`applySpecialFeatureRule()` 與
`SPECIAL_FEATURE_RULES` 的事後修補入口。

`MONK_REMOVED_LABELS`、`NON_FEATURE_HEADINGS`、`BARBARIAN_CURATED_FEATURE_LABELS`、
feat curated 排除名單，以及石巨人的 parser 排除項只在 parser 路徑被使用，
因此一併刪除。原血統選擇過濾的產品意義則搬入 explicit choice 條件。
`data-action-description` 沒有其他 caller，已移除其兩處標記。
原 MONK／BARBARIAN custom definitions 與 race 特例整合進 metadata，
不再維護一組只為 parser 去重而存在的額外名稱清單。

## 有意修正的行為

1. 原 parser 只辨識 Bonus／Reaction，漏掉的六個 class Action 按鈕和岩石侏儒拆除動作已補齊。
2. 明定通用專長 4+、祈喚 5+／前置魔契、超魔法 2+，避免低等級或殘留勾選外洩。
3. parser 的段落截斷改為完整指定能力說明；專長續行清單不再被截掉，包含封鎖者的兩種觸發與速度歸零效果。
4. 霜巨人的動作說明改讀 `race.js`，明確指出降速作用於目標，修正舊 curated 摘要省略主詞的歧義。

## 驗證紀錄與重跑

- 刪除 parser 前，以真實瀏覽器擷取原始結果，再切換 explicit 路徑比較：
  230 筆跨職業／等級／種族血統／專長的既有 option 均保留原 key。
- 原 `getSelectedSpellEntries()` 函式逐字相同；額外將 215 個法術各放入兩個不同來源，
  新舊完整輸出一致：Action 344、Bonus 44、Reaction 8 個選項；其他施法時間不進入這三類。
- `validate-action-metadata.js`：4,801 個 coverage assertions，包含所有 class／level、
  種族／血統、20 專長、祈喚／超魔法限制、無重複、完整說明、隱藏 key 相容性，
  以及替換渲染後 prose 不影響動作輸出的驗證。
- 同一腳本操作桌邊與 legacy UI、自訂動作 CRUD、隱藏官方／自訂動作、分類恢復、
  JSON 下載／匯入、分享編解碼、autosave reload 與本機偏好還原。
- `node validate-tabletop-spellcasting.js`：215 法術、85 outcomes，通過。
- 修改的 JS 與驗證腳本執行 `node --check`；`index.html` inline scripts 另行擷取做語法檢查。
- Edge headless 的桌面 1280×720、手機 390×844 畫面已目視檢查。

重跑（使用環境已提供的 Playwright，不需要新增專案依賴）：

```powershell
# 若 Playwright 不在預設 module path，NODE_PATH 指向該環境的既有 node_modules。
$env:DND_BROWSER_CHANNEL = 'msedge' # 或省略，使用 Playwright 的 Chromium
node validate-action-metadata.js
node validate-tabletop-spellcasting.js
node --check action-panel.js
node --check class-features.js
```

驗證的產品範圍是目前 1–8 級與既有固定子職；未新增或驗證尚未提供的子職 UI，
也未重新產生／驗證離線角色卡。

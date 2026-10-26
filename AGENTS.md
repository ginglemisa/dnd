# AI Agent 專案指示

## 範圍與工作邊界

本檔適用於整個專案，使用者當次明確指示優先；僅維護長期規範、資料入口與驗證條件，不累積交接、暫時限制或通用教學。

* 限於當次需求，優先穩定性、資料／行為相容與可預測性，再考量維護性及美觀；保留適用設計，避免無關重構。
* 依任務選讀下列入口，追蹤受影響的實際資料流與依賴即可；不需每次通讀全部模組或文件。
* 持續到修改、適用驗證與本次造成的失敗已處理，不停在計畫／第一版待批；低風險、可逆且不改產品意義的細節自行決定。
* 只有當多個合理選擇會實質影響玩家行為、規則、持久化資料或相容性，且專案證據不足以判定時，才詢問使用者。先完成不依賴該決策的工作。
* 若本檔與 repository 不符，以實際程式、資料與呼叫路徑確認現況，採取完成需求的最小相容修改，並回報已確認的衝突。

## 前端架構與相容性

* 原生 HTML／CSS／JavaScript 靜態網站；`index.html` 以傳統 `<script defer>` 依序載入全域模組，不新增前端框架、build pipeline 或 runtime dependency。驗證沿用 Node.js／Playwright，不新增測試框架或依賴。
* `index.html` 負責角色卡 DOM、初始化、表單串接、持久化與分享；僅依任務需要拆分，不因檔案大小／一致性重寫架構。樣式以 `styles.css` 為準，外觀／互動先查 [DESIGN.md](DESIGN.md)。
* 自 `index.html` 搬出的角色卡程式（`sheet-utils.js`、`feat-ui.js`、`spell-sources.js`、`class-features-ui.js`、`sheet-spells.js`、`pdf-launcher.js`）以不加 defer／async 的本機 `<script src>` 同步載入（`sheet-spells.js`、`pdf-launcher.js` 在原區塊位置，其餘只含宣告者提前於第一段內嵌 script），維持全域名稱；除 `sheet-spells.js` 保留原有頂層初始化外只放函式與狀態宣告，頂層程式不得依賴後載入 script 的宣告；驗證腳本以此辨識並一併檢查，離線建置保留各標籤的 defer 與否。搬移與功能修改分開提交。
* 變更全域 API、DOM ID、data attribute、檔名或載入／初始化順序時，搜尋並同步處理受影響的 JavaScript、CSS 與呼叫端。
* 表單控制項與結構化 DOM 可作為角色目前選擇的 canonical state，無需另建中央 store。純顯示文字不作為主要規則資料來源，除非該解析本身是明確保留的設計。
* LocalStorage 沿用 `window.dndStorage`。變更持久化欄位或意義時，檢查 LocalStorage、自動存檔、JSON 匯入／匯出與分享網址的還原相容性；UI 調整不應意外改變資料格式。
* 角色 JSON／分享／autosave 的安全預檢集中於 `index.html`；輸入、解壓、文字、結構及動態控制項須沿用共用安全上限，不以角色規則代替資源限制。套用前完整驗證；拒絕或損壞資料不得覆寫原存檔，必要時停止 autosave。檔案欄位不保存／還原，來源標籤以純文字顯示。
* JSON 匯入取代角色，清理範圍以 `index.html` 的 `APP_STORAGE_KEYS` 為準：含 autosave、其他職業／手動法術記憶、頭像、創角／購點、跑團偏好與角色 UI／導覽記憶；不得清空網站儲存，須保留日誌（含待遷移資料）、主題、擲骰歷史。匯出僅含目前角色、兩份法術書、跑團動作偏好（`__tabletopActionPreferences`）與頭像（`__tabletopAvatar`，超過 2 MiB 時省略並提示），不是完整本機備份；後兩者不進 autosave／分享，分享模式匯出時省略並提示，匯入檔有該欄位才於清理後寫回。變更清理範圍須核對匯出與使用者提示。
* 匯入預檢後，須確認新資料與舊紀錄副本已寫入 sessionStorage 才清理／套用；新角色與完成標記存妥後重載，清除模組記憶體舊偏好，再移除暫存。完成標記防止暫存刪除失敗造成重複匯入；暫存失敗保留角色與未存編輯，套用／存檔失敗停止 autosave、保留副本並嘗試復原，提示保留分頁與重試。清除紀錄前須取消／作廢待套用匯入。
* `adventure-journal.js` 獨立使用 IndexedDB `twd20-adventure-journal`；對外 JSON 維持版本 1、相容舊欄位且不含內部 revision。既有 IndexedDB 優先；舊 LocalStorage `dnd.adventureJournal.v1` 僅在遷移 transaction 完成後移除。寫入須在同一 transaction 核對 revision，衝突不覆寫；讀取／遷移／儲存失敗保留原資料與編輯、提供重試／可讀資料備份，不另建可寫入的 LocalStorage 日誌。日誌／搜尋不加入角色 JSON、分享或 autosave，角色清理不刪日誌；搜尋需存檔時成功後才跳頁，IME 選字不提交。
* 修改正式部署載入的 CSS／JavaScript 時，依 `index.html` 既有查詢字串策略更新對應快取版本，只處理本次變動資源。
* 分享流程入口為 `index.html` 的 `copyShareUrl()`，對話框沿用 `AppDialog`。短網址只在使用者明確選擇後建立，傳送當次編碼產生的區域變數 `hash`，不可改用可能過期的 `location.hash`；保留 `#s=`／`#s2=` 格式相容性與永久網址的複製 fallback。
* 短網址僅供正式 Origin `https://twd20.com`、`#s2=` 且 hash 長度 ≤10000 使用，離線頁不得呼叫服務。90 天有效期由 Worker／KV 管理；建立失敗須明確提示並保留改選永久網址的操作，不可悄悄改複製長網址，也不可自動重試建立請求。
* 分享模式不 autosave 角色修改、不得再次分享或匯入 JSON；成功載入時鎖定職業、等級、種族、背景，並關閉快速創角與兩種導覽入口（含程式入口），自訂背景僅供查看；解碼失敗的空白卡不鎖定。離開須確認、移除分享資料並重載本機存檔。角色／法術還原不得被本機其他角色記憶覆蓋；跑團動作偏好與頭像仍屬本機保存，不加入分享。主題與擲骰歷史同樣不隨角色傳送。
* GA4 啟用閘門在 `index.html`，事件入口在 `analytics.js`。只允許 HTTP(S) 且 hostname 精確為 `twd20.com`／`www.twd20.com`，owner 排除優先；除已識別的 `analytics=owner`／`analytics=user` 外，任何 query 或 fragment（含 `#s=`／`#s2=`）均不得載入 Google 追蹤腳本或送出事件。`analytics=user` 僅解除 owner 偏好，不能繞過網址限制；儲存失敗時當次 owner 仍生效並保留參數。
* 追蹤不得傳送角色／日誌文字或分享資料；`page_location` 不含 query／fragment，`page_referrer` 僅保留 HTTP(S) origin，Google 腳本使用 `no-referrer`。測試流量與 GA4 模擬限制見下方「執行與停止條件」。

## Cloudflare 短網址服務

* Worker 的 source of truth 為 `cloudflare/twd20-url/worker.js`，bindings 與部署設定在同目錄的 `wrangler.jsonc`；修改前查閱 [Worker README](cloudflare/twd20-url/README.md)。網站前端與 Worker 分開部署，不因修改程式碼而自行部署。
* 維持前後端的 7 碼英數短網址、HMAC 驗證與分享格式相容性。建立 API 的限流不得套用到 GET redirect；具體設定以 Worker 設定檔與 README 為準。
* 不將 Secret、token、API key 的實際值或 KV runtime 資料寫入 repo；不猜測資源 ID，也不自行更換 `HMAC_SECRET`，以免既有短網址失效。

## 規則與資料入口

專案內規則文本、結構化 metadata 與角色選項資料是主要來源。未經使用者明確要求，不查網路 D&D 規則，也不以模型記憶或網路內容覆蓋、修正或擴充規則。

| 任務涉及 | 優先查閱 |
| --- | --- |
| 共用角色計算與規則 | `character-rules.js`／`CharacterRules` |
| 職業、種族、背景、專長、工具 | `class-features.js`、`race.js`、`backgrounds.js`、`feats.js`、`tool-data.js` |
| 野獸／怪物 | `monster.js` |
| 裝備 | `equipment-data.js`、`equipment-notes.js` |
| 法術、狀態、神祇 | `spell-list.js`／`SpellCatalog`、`condition.js`、`deity-info.js` |
| 創角與角色選項串接／自訂背景 | `index.html`、`quick-build.js`、`custom-background.js`，並核對上述規則來源 |
| 專長列 UI、自動／自行管理、資格警示、收合記憶、衍生專長列 | `feat-ui.js`；專長資料為 `feats.js`，魔法學徒子選項與衍生法術在 `spell-sources.js` |
| 職業能力 UI：祈喚、超魔、苦痛魔爆、互斥／進階選項與攻擊備註、角色能力視窗、補齊職業選項提示與缺項檢查、使命／升級戲法、職業選項記憶接線 | `class-features-ui.js`；職業資料為 `class-features.js`，職業選項記憶儲存在 `class-option-memory.js`；種族／背景能力與初始化仍在 `index.html` |
| 角色卡法術頁：法表與準備、已選清單、法術位、免費次數、法術描述 | `sheet-spells.js`；魔法學徒、書之魔契、魔法發現與種族／子職／職業／祈喚衍生法術為 `spell-sources.js` |
| 法術目前清單、來源、自動／手動管理與遷移 | `spell-management.js`／`SpellManagement`；法術書與管理視窗為 `spellbook.js`／`Spellbook` |
| 法術／裝備搜尋與獨立查閱 | `search.js`；保留工具列與導覽使用的全域入口 |
| 商店：分類、購物清單、法術卷軸與結帳 | `equipment-shop.js`；品項由 `equipment-notes.js` 依說明原文整理為 `EQUIPMENT_SHOP_ITEMS`，結帳入口為 `index.html` 的 `MoneyTracker.purchaseItems()` |
| 新手與跑團導覽 | `onboarding-tour.js`，並核對創角／匯入／PDF 生命週期 |
| PDF 匯出與欄位 | 前置檢查／輸出視窗／延遲載入為 `pdf-launcher.js`；`pdf-export.js`、`pdf-field-map.js`；按需載入 `pdf-lib.custom.min.js`／`fontkit.custom.min.js`，部署須包含 PDF 與字型素材 |

* UI 模組沿用主要資料與公開 API，不複製平行規則。若任務涉及的 UI 與明確規則來源不符，修正實作；既有錯誤行為不是規格。
* `spellId` 是持久化與引用識別，不隨顯示名稱改動。確需新增、移除或更名時，須同步更新 `spell-id-baseline.json` 並核對引用及舊資料相容性；基準檔不得用來掩蓋意外遺失。
* 規則來源互相矛盾時，先查實際使用路徑；仍無法判定且會改變角色規則或計算結果時，列出差異與建議交由使用者決定。

## 動作、擲骰與跑團模式

| 模組 | 責任 |
| --- | --- |
| `action-panel.js` | 動作選項與既有 Action UI |
| `tabletop-mode.js`／`TabletopMode` | 跑團模式共用狀態與公開 API：模式、生命值、死亡豁免、專注、資源、自訂資源及動作偏好 |
| `tabletop-actions.js` | 跑團模式動作呈現與操作 |
| `tabletop-druid.js` | 荒野形態、已知形態、野獸攻擊與德魯伊專屬資源操作 |
| `tabletop-spells.js` | 法術、施法操作與專注 UI |
| `tabletop-resources.js` | 資源呈現與操作 |
| `dice-roller.js`／`DiceRoller` | 擲骰啟用狀態、骰式解析、結果與歷史紀錄的唯一入口 |

* 非法術能力沿用結構化定義的穩定 key、分類、等級及角色條件；識別／分類變更須相容自訂動作、隱藏偏好、過濾與持久化。
* 按鈕拆合、升級替換與摘要須先核對規則及 UI 設計；法術時間沿用既有分類，其他結構化施法規則以 `SpellCatalog` 為準。
* 跑團模式子模組透過 `TabletopMode`、`SpellCatalog`、`CharacterRules`、`DiceRoller` 協作；不另建競爭的共用狀態、持久化、亂數或擲骰歷史。必要的內部拆分保持 `window.TabletopMode` 公開 API 相容。
* 自動管理專長保留來源分類及固定背景來源，來源選項不以先決條件或重複取得限制停用／清空；不合格的已選專長顯示主題警示，數值計算與衍生法術使用共用資格判斷。PDF 前置檢查只提醒，仍可繼續輸出。自行管理不套用資格限制或警示，保留既有計算行為。

## 對話框與資訊頁

* 新 dialog／toast 沿用 `app-dialog.js`；除特殊平台限制或使用者要求外，不改用原生 `alert`、`confirm`、`prompt`。
* Legal／About 網站內容維護於按需載入的 `legal-about.js`，入口為 `index.html#legal-about-modal`；README 保留對外授權、素材來源與完整 SRD Attribution。`LICENSE.txt` 的 MIT 僅涵蓋有權授權的原始程式碼；SRD 5.2.1／CC BY 4.0、字型、角色紙、圖像與第三方函式庫各依原授權，不可混為 MIT。AGENTS 不取代授權檔或網站法律聲明。
* `info-pages.css` 負責獨立資訊頁樣式；`legal-modal.js` 控制歡迎視窗與 About 按需載入，About 沿用 `AppDialog` 與主頁主題。`ddals1.html` 是官方免費冒險外部連結整理頁，不是規則來源。

## 離線角色卡

* 一般任務只更新來源檔案。只有使用者明確要求建立、測試或更新離線角色卡時，才執行 `build-offline-nopdf.ps1` 並驗證產製結果。
* 例外：每次 push `main` 至 `origin` 前，先執行 `.\build-offline-nopdf.ps1` 重新產生 `twD20-offline.html`；產物有變更時另建 commit 與本次 push 一併送出。此為常規操作，不需另行報備或詢問；建置或驗證失敗則停止 push 並回報。
* `twD20-offline.html` 是衍生產物，不能作為 source of truth 或只修改它。產生腳本內嵌本機 CSS、JavaScript、圖片與 About 模組，並停用 PDF 匯出。離線分享須產生正式站的永久網址，不含本機路徑或呼叫短網址服務；完全離線交換使用 JSON。
* 根目錄以 PowerShell／Node.js 20 以上執行 `.\build-offline-nopdf.ps1`；自動驗證產物語法、離線分享／複製 fallback、分享限制與離開流程，失敗即建置失敗。成品驗證不另列產品 regression；Node.js 模擬 URL／瀏覽器 API 不代表手機權限／儲存實機驗證。

## 驗證條件

依本次 diff、實際呼叫路徑與行為選擇驗證，不按檔名／關鍵字／腳本數量決定；共用檔案變更不代表所有功能受影響，既有修改不自動納入。環境、命令、分項與限制統一維護於本節，腳本入口／責任變更須同步更新。

### 選擇驗證範圍

* **文件、文案或局部排版**：Markdown 僅核對連結、命令與描述，不跑功能驗證。畫面文案／排版驗證受影響區域；先確認未被規則、動作摘要或 PDF 解析使用，且未改變控制項、事件或持久化。規則原文與 HTML 結構變更須追查消費端。
* **局部 UI 互動**：未改規則、共用機制或資料格式時，優先用既有分項；無合適分項可用最小瀏覽器流程。須涵蓋開啟／操作／關閉及受影響的取消、重試、焦點、狀態保留，不能只確認元素出現。
* **規則、計算、資料或共用機制**：執行下表對應回歸；共用狀態、事件、初始化或持久化變更須沿受影響呼叫端追加驗證。持久化涵蓋 LocalStorage／autosave、JSON、分享還原相容性，不以局部畫面代替資料驗證，不因多支腳本測存檔而刪除不同資料案例。
* **語法與外觀**：JavaScript 變更執行 `node --check <檔案>`，HTML 內嵌 JS 檢查該區塊；僅改 script URL 不需全查。版面選受影響區域的桌機／窄螢幕及必要主題；共用斷點、主題機制或多處共用樣式改變才擴大矩陣，局部沿用主題色不算主題系統變更。
* **執行前簡述選擇**：用一句話交代本次影響的行為及要跑的檢查，不需逐項列出所有不跑的腳本或等待批准。
* **永久案例與 suite 邊界**：新增功能／修正 bug 需保護重要回歸風險，優先補進最接近的既有系統級 suite。低風險可逆修改用既有檢查或不提交的臨時驗證，不為形式完整新增測試；沒有 testcase 不等於需要新檔。只有獨立、長期且易回歸的子系統、併入既有 suite 會破壞責任邊界時才新增永久 suite。單一 bug、UI、欄位、文案或 edge case 原則上不足以新增 `validate-*.js`／`check-*.js`／test file；臨時腳本收尾前清除。

### 回歸腳本對照

依上述範圍判斷選擇對應責任，不以關鍵字命中整套執行。

| 系統級責任 | 驗證 |
| --- | --- |
| 法術 ID／metadata、跑團施法條件、法術位、專注與自動擲骰 | `node validate-tabletop-spellcasting.js`（純 Node.js，含 ID baseline） |
| 動作定義／摘要與角色卡／跑團操作、收合／記憶／清除、搜尋不重建靜態動作、合併分類偏好與還原、法術入口／時間標記；狀態／危害檢定與專注中斷／分頁提示；專長來源同步／鎖定、資格／計算／PDF、自行管理與新舊還原／空白列清理／新增；武器衝突、AC／摘要、還原／PDF | `node validate-action-metadata.js`；PDF 匯出使用替身 |
| 德魯伊荒野形態、野獸攻擊、荒野夥伴、野性復甦、自然恢復、原初打擊與資源／狀態保存 | `node validate-tabletop-druid.js` |
| 法術書推薦／儀式／匯入、跑團儀式分組／去重／施法；結構化清單與各環顯示／收合／排序／分欄／免費次數／無法術位、跑團隔離；閱讀／草稿管理與篩選、來源／不可用項計數、子視窗／焦點／草稿保留；準備限制／來源／免費使用；職業／手動記憶與切換、降級／超額／高環保留；舊資料遷移／提醒／清除、書籍歸屬／載入優先／手動來源隔離、快速創角／書之魔契／未知 ID；批次還原立即讀存、JSON／autosave／分享、跑團／PDF、法術位與響應式／主題版面 | `node validate-spellbook.js` |
| 法術全文／職業別名／環位搜尋與排序（含 Artificer 無資料／模擬資料）、獨立查閱篩選／隔離／關閉／焦點；裝備詳情／規則說明、商店購物清單／法術卷軸／結帳、各工具列查看與職業工具自動化／JSON／分享／autosave 還原、切頁及導覽還原 | `node validate-spell-search.js`；含搜尋模組與主頁內嵌語法。僅裝備／工具可加 `--equipment-only` |
| 屬性產生、購點／結果分配／背景加值、共用擲骰備註／取消／鍵盤／觸控、歷史相容與 autosave | `node validate-ability-roll.js`；可擇一加 `--point-buy-only` 或 `--dice-only` |
| 導覽身分雙段提示／詳情返回、屬性引導／觸控、各段退出／非同步取消與定位失敗解鎖、創角匯入與 PDF 載入取消、分享模式關閉創角／導覽入口、八步跑團導覽／選單／擲骰開啟與導覽內擲骰／骰子試用與關閉清除結果／先攻強調與速度示例／法術與資源預覽、導覽按鈕文字、共用導覽與減少動態效果 | `node validate-onboarding.js`；優先選 `--touch-only`（含身分詳情提示）或 `--imports-only`，影響共用流程再完整執行；PDF 繪製使用替身 |
| 短休／長休與取消、生命骰回血／關閉後完成提示、專注清除、休息後選項同步、各來源資源恢復／最佳旅伴／可選恢復及 autosave 還原 | `node validate-tabletop-rest.js` |
| 日誌 IndexedDB 遷移／失敗復原／跨分頁衝突、JSON 相容、全文搜尋／IME／儲存／跳頁、角色隔離與桌機／手機版面 | `node validate-ui.js --journal-only`；IME／手機觸控為瀏覽器模擬 |
| GA4 隔離（純模擬、不連線）、共用 UI 與 PDF；各分項責任如下 | `node validate-ui.js` 完整執行，或擇一使用下列分項 |

`validate-ui.js` 分項：

* `--data-only`：JSON／分享／autosave 的 XSS、分享身分下拉鎖定與解碼失敗不鎖、輸入／解壓／數量上限、拒絕資料保留、乾淨匯入與記憶體偏好隔離、暫存／套用／存檔失敗副本、復原與重試；職業選項記憶的換職業／等級還原、殘留清除、舊存檔搬移、分享隔離、毀損資料與清除。
* `--appearance-only`：四種外觀、停用下拉灰底與對比、保存／素材、工具選單／技能等共用版面、Legal／About 主題與焦點。
* `--dialogs-only`：AppDialog／toast 層級／inert／倒數／滑鼠與觸控手勢／暫停／事件隔離；About 載入／重試／網址；角色能力頁籤與創角／表格顯示、子視窗／法術技能動物參考、焦點／選項保存、缺項補填／跳轉／高亮、各職業等級選項自動補選、專長／準備標示與還原；自訂背景編輯／取消／分享唯讀、專長／工具同步、PDF 名稱與還原。
* `--pdf-only`：欄位與實際可編輯 PDF 匯出；`--pdf-fields-only` 僅驗欄位、不需 PDF／字型素材。涵蓋全部法術材料成分、新舊資料與描述隔離、職業工具、專長／魔法學徒子選項、手動法術模式、盾牌受訓與血統提示。

持續法術效果改變一般角色或野獸的 AC／速度計算、施法操作或狀態保存時，也需執行 `node validate-tabletop-druid.js`；僅調整其顯示字色、字級或間距不因此觸發整套德魯伊回歸。

### 執行環境

* 從專案根目錄執行，使用 Node.js 20 以上。`validate-tabletop-spellcasting.js` 為純 Node.js，其餘上表腳本使用 Playwright／Chromium，會自行啟動並關閉本機伺服器與瀏覽器；不需另外啟動網站。完整 `validate-ui.js`／`--pdf-only` 需專案 PDF 與字型素材。
* 沿用既有依賴；新環境使用 `npm ci`、`npx --no-install playwright install chromium`。可用 `$env:DND_BROWSER_CHANNEL = "msedge"` 選擇已安裝的 Edge，以 `Remove-Item Env:DND_BROWSER_CHANNEL` 恢復預設；環境提供套件時可將 `NODE_PATH` 指向其 `node_modules`。
* 截圖輸出參數由各腳本內的 `DND_*SCREENSHOT*` 環境變數維護，只在需要視覺檢查時使用；先建立輸出目錄，不提交產物。IME／觸控模擬不代表實機輸入法驗證；離線成品模擬限制見「離線角色卡」。

### 執行與停止條件

* 先用既有分項／最小重現，充分涵蓋時不補跑完整版本。腳本無分項不等於要重構測試或跑遍功能，但規則、資料、共用機制仍須完成對應回歸，不因省時略過。
* 同版本已有確認通過紀錄可沿用，後續修改影響程式、依賴或測試前提才重跑；不以臨時瀏覽器重做已涵蓋流程，除非補視覺／互動或排查失敗。
* 失敗先縮小情境，必要時對照修改前版本，區分本次回歸、環境／測試或既有問題。修正本次失敗並重跑相關範圍，不反覆跑無關完整流程求偶然通過；無關問題回報證據與未通過範圍，不擴大修復或算作通過。
* **測試流量排除**：使用 Playwright（CLI 或一般 API）、任何 agent 瀏覽器、人工瀏覽器測試或程式回歸測試時，凡載入本站頁面的網址都必須加入 `analytics=owner`，不論正式站、localhost／127.0.0.1 或直接開啟 `index.html`（`file://`）。沒有 query 時用 `?analytics=owner`，已有 query 時用 `&analytics=owner`（既有 analytics 值須替換），參數必須放在 `#s=`／`#s2=` 等 hash 之前；程式組合網址使用 `URL.searchParams.set("analytics", "owner")`。新分頁、獨立 browser context 與分享網址也須帶入，不依賴別的分頁已保存 owner；頁面清理參數後，不可直接以 `page.url()` 作為新測試入口。重新整理前若清除了網站儲存，須重新帶入 owner 參數。
* 非正式網域的 GA4 阻擋不能取代上述 owner 規範；GA4 啟用分支只用隔離模擬與追蹤替身驗證，禁止向真實 GA4 傳送測試事件。
* 涉及 DOM 互動、responsive layout、焦點、modal、事件、LocalStorage、autosave 或跨頁狀態，且靜態檢查不足時，驗證最小必要 UI 流程；僅在需要瀏覽器驗證時啟動本機伺服器。
* 需要臨時瀏覽器檢查時，先讀取 [.agents/skills/playwright-cli/SKILL.md](.agents/skills/playwright-cli/SKILL.md)，使用既有 dependency 的 `npx --no-install playwright cli`。沿用現有 regression scripts，不另建 Playwright Test 或 Test Agents。
* 瀏覽器依 `open → snapshot/find → interact → assertion` 操作必要元素，唯讀可省略 interact；優先局部 snapshot／locator／console／network，限制輸出。DOM／文字／狀態足以判斷時不截圖；視覺問題才截相關區域與 viewport。完成後關閉本次 session／伺服器，不自由探索無關功能。
* 發現產品 bug 時，修正產品或回報問題，不得藉由削弱、跳過或移除測試條件讓 regression test 通過。
* 適用檢查通過後即可收尾；只有新修改、失敗或未解疑慮才擴大或重複驗證。環境缺少條件時完成其餘可執行檢查，明確回報未驗證範圍。

## 工作區與交付

* 沿用環境提供的 task branch／worktree，不自行改寫 `main`。保留使用者既有修改，未受要求不 merge、force push、改寫歷史或刪除他人 branch；只要求工作區修改時不必額外 commit。
* `private/` 開頭的 branch（目前為 `private/subclass`，本機 worktree 位於 `C:\Git\dnd-private`）含不可公開的資料，只保留在本機：不得 push 至 `origin` 或任何 remote、不得設定 upstream，也不得將其 commit 或檔案 merge、cherry-pick、複製到 `main`。同步方向只能由 `main` 帶入 private branch；在 private worktree 執行驗證時，以 `NODE_PATH` 指向 `C:\Git\dnd\node_modules`。
* 完成代表需求已實作、受影響的呼叫端與資料相容性已處理、適用驗證已有結果。收尾檢查 diff 與 git status，清除本次產生的 debug code、臨時檔及無關修改。
* 簡短回報修改內容、驗證結果及未驗證部分；任務外問題如需提及，列出但不順帶修復。

## 自動稽核判讀

稽核警告需以程式與瀏覽器行為確認，不以警告歸零為目標。`addEventListener` 綁定的按鈕可能被誤報為無動作；先檢查事件綁定，不為消除警告改成 inline handler。保留既有 textarea 的 `resize: vertical` 與原生 `<select>`，不因通用稽核建議而替換正常運作的控制項。其他警告仍需依實際影響調查。

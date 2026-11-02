# AI Agent 專案指示

本檔只放長期規範、資料入口與驗證方式；使用者當次指示優先。細節以程式、測試與連結文件為準，本檔與 repository 不符時以實際程式確認現況，並回報衝突。

## 工作方式

* 只處理當次需求，優先穩定性與資料／行為相容；保留適用設計，不順帶做無關重構。架構重構只在使用者指定的範圍內進行，搬移與行為修改分開提交。
* 追蹤受影響的資料流與呼叫端即可，不需通讀全部模組。做到修改、適用驗證與本次造成的失敗都處理完；低風險、可逆的細節自行決定。
* 只有會實質影響玩家行為、規則、持久化資料或相容性，且專案證據不足時才詢問使用者；先完成不依賴該決策的部分。
* 規則以專案內資料為準。未經使用者要求，不查網路 D&D 規則，也不以模型記憶修改、擴充規則；規則來源互相矛盾且會改變計算結果時，列出差異交由使用者決定。

## 架構

* 原生 HTML／CSS／JavaScript 靜態網站，`index.html` 以傳統 `<script>` 依序載入全域模組。未經使用者同意，不新增前端框架、runtime dependency 或測試框架；開發依賴僅 `yaml`、`ajv`、Playwright。
* 載入順序與每個標籤是否 `defer` 屬於契約：部分自 `index.html` 搬出的模組為同步載入，頂層只放宣告，驗證腳本與離線建置都依賴這個配置。變更全域 API、DOM ID、data attribute、檔名或載入順序時，搜尋並同步所有 JS、CSS、驗證腳本與 `build-offline-nopdf.ps1`。
* 唯一的建置是內容檔：`npm run build` 驗證 `content/` 的 YAML，產生 `class-content.generated.js`（`classFeatures`、`classTabletopText`、`classRules`，網站經 `character-rules.js` 的 `getClassRules()` 等讀取）與 `background-content.generated.js`（`backgroundRules`、`backgroundText`，經 `getBackgroundRules()`、`getBackgroundText()`、`getBackgroundSource()` 讀取）。寫法見 [content/README.md](content/README.md)。產物不提交、不手改。
* `content/private/` 是私人內容包（gitignore），只在本機另產生 `class-content.private.generated.js`；不得提交或複製到公開檔案，公開建置不得依賴它。
* 持久化 ID 以基準檔把關：職業／子職／選項／動作 key／資源 key 用 `class-id-baseline.json`，背景用 `background-id-baseline.json`，法術用 `spell-id-baseline.json`。只在確認刻意新增，或已處理舊資料相容的移除／改名後，才更新基準檔（`npm run build -- --update-id-baseline`）；不得用基準檔掩蓋意外遺失。`spellId` 不隨顯示名稱改動。
* UI 模組讀取主要資料與公開 API，不複製平行規則、狀態、亂數或擲骰歷史。表單控制項可作為角色目前選擇的 canonical state；純顯示文字不作為規則資料來源。既有錯誤行為不是規格。
* 職業機制以 `classRules` 為準，`classFeatures` HTML 與能力名稱、標題只供顯示：程式不得從中反推規則，判斷特定能力時用能力 id。職業頁上找能力的位置用 `data-feature-id`；建置工具不以正則解析產生後的 HTML 或網站原始碼。
* 樣式以 `styles.css` 為準，外觀與互動先查 [DESIGN.md](DESIGN.md)。新 dialog／toast 用 `app-dialog.js`，不用原生 `alert`／`confirm`／`prompt`。圖片放 `images/`、字型放 `fonts/`；`og-image.jpg` 必須留在根目錄（短網址 Worker 固定引用）。
* 修改正式部署載入的 CSS／JS 時，只更新該資源在 `index.html` 的 `?v=`；`class-content.generated.js` 的 `?v=` 由上線建置自動產生。

## 資料相容（不可破壞）

* **儲存**：LocalStorage 一律經 `window.dndStorage`。變更持久化欄位或意義時，須確認 LocalStorage／autosave、JSON 匯入匯出與分享網址都能還原舊資料。
* **匯入**：安全預檢與上限集中在 `index.html`，須完整驗證後才套用；拒絕或損壞的資料不得覆寫原存檔。清理範圍以 `APP_STORAGE_KEYS` 為準，不得清掉日誌、主題與擲骰歷史。匯入的暫存、套用與失敗復原流程照現有實作，修改時一併核對。
* **匯出**：內容為目前角色、兩份法術書、跑團動作偏好與頭像，不是完整備份。動作偏好與頭像不進 autosave 與分享。
* **分享**：入口為 `copyShareUrl()`，保留 `#s=`／`#s2=` 格式與永久網址的複製 fallback。分享模式不 autosave、不可再分享或匯入，並鎖定角色身分欄位；分享資料不得被本機記憶覆蓋。
* **短網址**：只在使用者明確選擇後建立，送出當次編碼的區域變數 `hash`。僅限 `https://twd20.com`、`#s2=` 且長度 ≤10000；離線頁不呼叫。建立失敗時明確提示，不自動重試，也不悄悄改成複製長網址。Worker 程式在 `cloudflare/twd20-url/`（見其 [README](cloudflare/twd20-url/README.md)），與網站分開部署，不自行部署；不寫入 secret 值、不猜測資源 ID、不更換 `HMAC_SECRET`。
* **日誌**：`adventure-journal.js` 獨立使用 IndexedDB `twd20-adventure-journal`，對外 JSON 維持版本 1。寫入時核對 revision，失敗保留原資料。日誌不進角色 JSON、分享或 autosave。
* **GA4**：閘門在 `index.html`，事件入口在 `analytics.js`。只在 hostname 精確為 `twd20.com`／`www.twd20.com` 時啟用；網址除 `analytics=owner|user` 外帶任何 query 或 fragment 就不載入、不送事件。不傳送角色、日誌或分享內容。

## 規則與功能入口

| 範圍 | 檔案 |
| --- | --- |
| 共用計算 | `character-rules.js`（函式直接掛在 `window`，沒有 `CharacterRules` 物件） |
| 職業／子職 | `content/srd/`（建置產物見上）；德魯伊野獸清單 `druid-wild-shape-beasts.js` |
| 背景 | `content/srd/backgrounds/`（建置產物見上）；自訂背景 `custom-background.js` |
| 種族、專長、工具、怪物 | `race.js`、`feats.js`、`tool-data.js`、`monster.js` |
| 法術、狀態、神祇 | `spell-list.js`（`SpellCatalog`）、`condition.js`、`deity-info.js` |
| 裝備與商店 | `equipment-data.js`、`equipment-notes.js`、`equipment-shop.js` |
| 角色卡 DOM、初始化、持久化、分享 | `index.html` |
| 創角 | `quick-build.js`、`custom-background.js` |
| 職業能力 UI 與選項記憶 | `class-features-ui.js`、`class-option-memory.js` |
| 專長列 | `feat-ui.js` |
| 法術頁、衍生法術、法術管理、法術書 | `sheet-spells.js`、`spell-sources.js`、`spell-management.js`、`spellbook.js` |
| 搜尋 | `search.js` |
| 動作 | `action-panel.js` |
| 跑團模式 | `tabletop-mode.js`（`TabletopMode` 共用狀態與公開 API），子模組 `tabletop-*.js` 經 `TabletopMode`、`SpellCatalog`、`character-rules.js`、`DiceRoller` 協作 |
| 擲骰 | `dice-roller.js`（`DiceRoller` 是擲骰與歷史的唯一入口） |
| 導覽 | `onboarding-tour.js` |
| PDF | `pdf-launcher.js`、`pdf-export.js`、`pdf-field-map.js` |
| Legal／About | `legal-about.js`、`legal-modal.js` |

* 跑團非法術能力使用穩定 key；key 或分類變更須相容自訂動作、隱藏偏好與持久化。
* 授權：`LICENSE.txt` 的 MIT 只涵蓋有權授權的原始碼；SRD（CC BY 4.0）、字型、角色紙、圖像與第三方函式庫各依原授權。完整 Attribution 在 README。

## 部署與離線版

* 回歸測試只在本機推送前執行。GitHub Actions（`.github/workflows/site.yml`）在 push 到 `main` 時建置、產生離線角色卡並部署 GitHub Pages，不跑回歸測試。
* `twD20-offline.html` 是 Actions 產生的衍生產物，不提交、不手改。離線版除了停用 PDF 匯出，功能應與網頁版相同；不含私人內容，分享只產生正式站的永久網址。
* 改動可能影響離線版（載入順序、內嵌的 script／CSS／圖片、新增產物檔、路徑或離線分享）時，自行在本機執行 `npm run build:offline`（先 `npm run build`；腳本內含自身驗證），測完刪除產物。

## 驗證

依本次 diff 與實際呼叫路徑選擇驗證，不按檔名或關鍵字整套執行；開始前用一句話說明要跑什麼。

* Markdown 只核對連結與命令。JS 變更執行 `node --check`。版面變更檢查受影響區域的桌機與窄螢幕。
* 規則、計算、資料或共用機制的變更，執行下表對應腳本；持久化變更須涵蓋 autosave、JSON 與分享還原。
* 新增的回歸案例優先補進最接近的既有腳本；臨時腳本在收尾前刪除。不得削弱或跳過測試條件來讓測試通過。
* 失敗時先縮小範圍，分清是本次造成、環境問題，還是原本就有的問題；無關問題只回報，不順帶修。

| 腳本（先 `npm run build`；`npm test` 全跑） | 主要範圍 |
| --- | --- |
| `validate-tabletop-spellcasting.js`（純 Node） | 法術 ID／metadata、法術位、專注、自動擲骰 |
| `validate-action-metadata.js` | 動作定義與摘要、跑團操作與偏好、專長來源與資格、武器／AC、自創法術與自訂骰式 |
| `validate-tabletop-druid.js` | 荒野形態、野獸攻擊、德魯伊資源；持續法術對 AC／速度的影響 |
| `validate-spellbook.js` | 法術書、準備與來源、職業／手動記憶、舊資料遷移、法術頁版面 |
| `validate-spell-search.js` | 法術／裝備搜尋、商店、工具（`--equipment-only`） |
| `validate-ability-roll.js` | 屬性產生、購點、擲骰（`--point-buy-only`／`--dice-only`） |
| `validate-onboarding.js` | 導覽、創角匯入、PDF 載入取消（`--touch-only`／`--imports-only`） |
| `validate-tabletop-rest.js` | 短休／長休、資源恢復、休息後選項 |
| `validate-ui.js` | `--data-only` 存檔／分享／匯入安全、職業選項記憶、子職；`--dialogs-only` 對話框、角色能力視窗、缺項提示；`--appearance-only` 主題外觀；`--pdf-only`／`--pdf-fields-only` PDF；`--journal-only` 日誌；不帶參數另含 GA4 隔離模擬 |

* 環境為 Node.js 20 以上，在專案根目錄執行。Playwright 腳本會自行啟動伺服器與 Chromium（`DND_BROWSER_CHANNEL=msedge` 可改用 Edge）。新環境先執行 `npm ci` 與 `npx --no-install playwright install chromium`。新的 worktree 沒有 `content/private/`，建置結果只含公開內容。
* **測試流量**：任何方式載入本站（本機、正式站、`file://`、新分頁、新 context、分享網址），網址都必須帶 `analytics=owner`，並放在 `#` 之前；禁止向真實 GA4 送測試事件。
* 需要臨時瀏覽器檢查時，先讀 [.agents/skills/playwright-cli/SKILL.md](.agents/skills/playwright-cli/SKILL.md)，只操作必要元素，結束時關閉。自動稽核警告須實際確認（`addEventListener` 綁定常被誤報）；不要為了消除警告而替換原生 `<select>` 或 textarea 的 `resize: vertical`。

## 交付

* 沿用環境提供的 branch／worktree，保留使用者既有修改。未經要求不 merge、force push、改寫歷史或刪除他人 branch。
* 收尾時檢查 diff 與 git status，清除 debug code 與臨時檔。用繁體中文、白話簡短回報修改、驗證結果與未驗證範圍；任務外的問題只列出，不順帶修。

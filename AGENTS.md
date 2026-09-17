# AI Agent 專案指示

## 範圍與工作邊界

本檔適用於整個專案；使用者當次明確指示優先。只保留長期有效的專案限制、資料入口與驗證條件，不累積歷史交接、暫時性限制或通用操作教學。

* 以完成當次需求為範圍，優先維持穩定性、資料與行為相容性、可預測行為，再考量可維護性、修改範圍與美觀。保留仍適用的既有設計，避免無關重構。
* 依任務選讀下列入口，追蹤受影響的實際資料流與依賴即可；不需每次通讀全部模組或文件。
* 實作任務應持續到修改、適用驗證及本次變更造成的失敗都已處理，不停在計畫或第一版等待批准。低風險、可逆且不改變產品意義的細節可自行決定。
* 只有當多個合理選擇會實質影響玩家行為、規則、持久化資料或相容性，且專案證據不足以判定時，才詢問使用者。先完成不依賴該決策的工作。
* 若本檔與 repository 不符，以實際程式、資料與呼叫路徑確認現況，採取完成需求的最小相容修改，並回報已確認的衝突。

## 前端架構與相容性

* 網頁使用原生 HTML、CSS、JavaScript，`index.html` 以傳統 `<script defer>` 依序載入全域模組，沒有前端框架或打包流程。一般功能沿用此架構，不新增框架、build pipeline 或第三方 runtime dependency；驗證使用既有 Node.js／Playwright 環境。
* `index.html` 包含主要角色卡 DOM、初始化、表單串接、持久化、分享及 PDF 延遲載入。只有任務需要時才拆分 inline 邏輯或模組，不因檔案大小、形式一致性而重寫架構。
* 變更全域 API、DOM ID、data attribute、檔名或載入／初始化順序時，搜尋並同步處理受影響的 JavaScript、CSS 與呼叫端。
* 表單控制項與結構化 DOM 可作為角色目前選擇的 canonical state，無需另建中央 store。純顯示文字不作為主要規則資料來源，除非該解析本身是明確保留的設計。
* LocalStorage 沿用 `window.dndStorage`。變更持久化欄位或意義時，檢查 LocalStorage、自動存檔、JSON 匯入／匯出與分享網址的還原相容性；UI 調整不應意外改變資料格式。
* 修改正式部署載入的 CSS／JavaScript 時，依 `index.html` 既有查詢字串策略更新對應快取版本，只處理本次變動資源。
* 分享流程入口為 `index.html` 的 `copyShareUrl()`，對話框沿用 `AppDialog`。短網址只在使用者明確選擇後建立，傳送當次編碼產生的區域變數 `hash`，不可改用可能過期的 `location.hash`；保留 `#s=`／`#s2=` 格式相容性與永久網址的複製 fallback。
* 短網址僅供正式 Origin `https://twd20.com`、`#s2=` 且 hash 長度 ≤10000 使用，離線頁不得呼叫服務。90 天有效期由 Worker／KV 管理；建立失敗須明確提示並保留改選永久網址的操作，不可悄悄改複製長網址，也不可自動重試建立請求。

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
| 創角與角色選項串接 | `index.html`、`quick-build.js`，並核對上述規則來源 |

* UI 模組沿用主要資料與公開 API，不複製平行規則。若任務涉及的 UI 與明確規則來源不符，修正實作；既有錯誤行為不是規格。
* 規則來源互相矛盾時，先查實際使用路徑；仍無法判定且會改變角色規則或計算結果時，列出差異與建議交由使用者決定。

## 動作、擲骰與桌邊模式

| 模組 | 責任 |
| --- | --- |
| `action-panel.js` | 動作選項與既有 Action UI |
| `tabletop-mode.js`／`TabletopMode` | 桌邊模式共用狀態與公開 API：模式、生命值、死亡豁免、專注、資源、自訂資源及動作偏好 |
| `tabletop-actions.js` | 桌邊動作呈現與操作 |
| `tabletop-druid.js` | 荒野形態、已知形態、野獸攻擊與德魯伊專屬資源操作 |
| `tabletop-spells.js` | 法術、施法操作與專注 UI |
| `tabletop-resources.js` | 資源呈現與操作 |
| `dice-roller.js`／`DiceRoller` | 擲骰啟用狀態、骰式解析、結果與歷史紀錄的唯一入口 |

* 非法術能力使用結構化動作定義，保留穩定 key、分類、等級與角色選擇條件。調整識別或分類時，維持自訂動作、玩家隱藏偏好、過濾及其持久化相容性。
* 按鈕拆分、合併、升級替換與摘要可能是產品設計，修改前同時核對規則與 UI 定義。法術施法時間沿用現有分類機制，其他已有結構化欄位的施法規則以 `SpellCatalog` 為準。
* 桌邊子模組透過 `TabletopMode`、`SpellCatalog`、`CharacterRules`、`DiceRoller` 協作；不另建競爭的共用狀態、持久化、亂數或擲骰歷史。必要的內部拆分保持 `window.TabletopMode` 公開 API 相容。
* `action-panel.js` 與 `tabletop-actions.js` 保留各自責任及公開 API。

## 對話框與資訊頁

* 新 dialog／toast 沿用 `app-dialog.js`；除特殊平台限制或使用者要求外，不改用原生 `alert`、`confirm`、`prompt`。
* Legal、About、授權與 attribution 完整文字只維護於 `about.html`；README 與其他頁面保留摘要並連回該頁。
* `info-pages.css` 負責獨立資訊頁樣式，`legal-modal.js` 只控制首頁 iframe modal 的開關與定位。`ddals1.html` 是官方免費冒險外部連結整理頁，不是規則來源。

## 離線角色卡

* 一般任務只更新來源檔案。只有使用者明確要求建立、測試或更新離線角色卡時，才執行 `build-offline-nopdf.ps1` 並驗證產製結果。
* `TWD20-offline.html` 是衍生產物，不能作為 source of truth 或只修改它。產生腳本內嵌本機 CSS、JavaScript、圖片與 About iframe，並停用 PDF 匯出。

## 驗證條件

修改功能後，優先執行最相關的既有 `validate-*.js` regression script，並依下表補足適用檢查；除非修改範圍跨越多個系統，不執行全部 regression tests。

| 變更範圍 | 驗證 |
| --- | --- |
| JavaScript | 對受影響檔案執行 `node --check <檔案>` |
| `spell-list.js` 施法 metadata、桌邊施法、法術位、專注或自動擲骰 | `node validate-tabletop-spellcasting.js` |
| 非施法能力結構化動作、Action UI、桌邊動作、自訂／隱藏偏好及其持久化 | `node validate-action-metadata.js` |
| 德魯伊荒野形態、野獸資料與攻擊／資源操作、荒野夥伴、野性復甦、自然恢復、原初打擊及相關桌邊狀態、autosave、responsive UI | `node validate-tabletop-druid.js` |
| 法術書、準備法術總數、儀式施法、法術書匯入／持久化及其 UI | `node validate-spellbook.js` |
| 僅 Markdown | 核對檔名、連結、命令與結構描述，不執行 JavaScript 驗證 |

* 可直接使用既有本機驗證工具與瀏覽器，修正本次變更造成的失敗並重跑受影響檢查，無需逐步取得批准。Action 與德魯伊驗證依賴 Playwright 及瀏覽器，沿用專案或環境已有安裝，不為測試新增框架或依賴。
* 涉及 DOM 互動、responsive layout、焦點、modal、事件、LocalStorage、autosave 或跨頁狀態，且靜態檢查不足時，驗證最小必要 UI 流程；僅在需要瀏覽器驗證時啟動本機伺服器。
* 需要臨時瀏覽器檢查時，先讀取 [.agents/skills/playwright-cli/SKILL.md](.agents/skills/playwright-cli/SKILL.md)，使用既有 dependency 的 `npx --no-install playwright cli`。沿用現有 regression scripts，不另建 Playwright Test 或 Test Agents。
* Browser workflow 優先採用 `open → snapshot/find → interact → assertion`，僅操作本次驗證所需元素；唯讀確認可省略 interact。完成後關閉本次 browser session 與本機伺服器，不為單一修改自由探索整個網站。
* 優先讀取局部 snapshot、locator、console 或 network 資訊；使用 `find`、`snapshot <target>`／`--depth`、`--raw` 等限制輸出，避免輸出整頁大型 DOM。
* DOM、文字或狀態足以判斷時，不使用 screenshot，包括只確認 DOM／文字結果的 CSS 修改。只有真正的視覺、排版問題，或 snapshot 無法判斷時才截圖，並限於相關區域與 viewport。
* 發現產品 bug 時，修正產品或回報問題，不得藉由削弱、跳過或移除測試條件讓 regression test 通過。
* 適用檢查通過後即可收尾；只有新修改、失敗或未解疑慮才擴大或重複驗證。環境缺少條件時完成其餘可執行檢查，明確回報未驗證範圍。

## 工作區與交付

* 沿用環境提供的 task branch／worktree，不自行改寫 `main`。保留使用者既有修改，未受要求不 merge、force push、改寫歷史或刪除他人 branch；只要求工作區修改時不必額外 commit。
* 完成代表需求已實作、受影響的呼叫端與資料相容性已處理、適用驗證已有結果。收尾檢查 diff 與 git status，清除本次產生的 debug code、臨時檔及無關修改。
* 簡短回報修改內容、驗證結果及未驗證部分；任務外問題如需提及，列出但不順帶修復。

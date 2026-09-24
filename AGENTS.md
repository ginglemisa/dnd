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

* 非法術能力使用結構化動作定義，保留穩定 key、分類、等級與角色選擇條件。調整識別或分類時，維持自訂動作、玩家隱藏偏好、過濾及其持久化相容性。
* 按鈕拆分、合併、升級替換與摘要可能是產品設計，修改前同時核對規則與 UI 定義。法術施法時間沿用現有分類機制，其他已有結構化欄位的施法規則以 `SpellCatalog` 為準。
* 跑團模式子模組透過 `TabletopMode`、`SpellCatalog`、`CharacterRules`、`DiceRoller` 協作；不另建競爭的共用狀態、持久化、亂數或擲骰歷史。必要的內部拆分保持 `window.TabletopMode` 公開 API 相容。
* `action-panel.js` 與 `tabletop-actions.js` 保留各自責任及公開 API。

## 對話框與資訊頁

* 新 dialog／toast 沿用 `app-dialog.js`；除特殊平台限制或使用者要求外，不改用原生 `alert`、`confirm`、`prompt`。
* Legal／About 網站內容維護於按需載入的 `legal-about.js`，入口為 `index.html#legal-about-modal`；README 整合必要說明與素材連結，SRD Attribution 必須完整保留。
* `info-pages.css` 負責獨立資訊頁樣式；`legal-modal.js` 控制歡迎視窗與 About 按需載入，About 沿用 `AppDialog` 與主頁主題。`ddals1.html` 是官方免費冒險外部連結整理頁，不是規則來源。

## 離線角色卡

* 一般任務只更新來源檔案。只有使用者明確要求建立、測試或更新離線角色卡時，才執行 `build-offline-nopdf.ps1` 並驗證產製結果。
* `TWD20-offline.html` 是衍生產物，不能作為 source of truth 或只修改它。產生腳本內嵌本機 CSS、JavaScript、圖片與 About 模組，並停用 PDF 匯出。

## 驗證條件

依本次 diff、實際呼叫路徑與改變的行為選擇驗證，不以檔名、關鍵字或腳本數量決定。`index.html`、`styles.css`、`tabletop-mode.js` 等共用檔案被修改，不代表其中所有功能都受影響；工作區既有且非本次修改也不自動納入。執行環境、命令、選項與限制統一維護於 [README：維護與驗證](README.md#維護與驗證)；新增或調整驗證腳本時同步更新兩處。

### 選擇驗證範圍

* **文件、純文案或局部排版**：僅修改 Markdown 時核對連結、命令與描述，不執行 JavaScript 或功能驗證；畫面文案與排版驗證受影響區域即可，不預設啟動整支功能回歸。先確認文字未被規則、動作摘要或 PDF 解析使用，且未改變控制項、事件與持久化資料。種族／職業的標題、行距、列表樣式可採此方式；修改原始規則文字或 HTML 結構時須追查其消費端。
* **局部 UI 互動**：僅影響單一對話框、區域或流程，且不改變角色規則、共用機制或資料格式時，優先使用涵蓋該行為的既有分項驗證；沒有合適分項時，可用最小必要瀏覽器流程取代夾帶無關功能的整支腳本。按實際變更涵蓋開啟／操作／關閉，以及相關的取消、失敗重試、焦點或狀態保留，不能只確認元素出現。
* **規則、計算、資料或共用機制**：執行下表對應的回歸；修改共用狀態、事件分派、初始化或持久化時，沿實際受影響的呼叫端追加驗證。持久化變更須涵蓋相關 LocalStorage／autosave、JSON 與分享還原相容性；不以局部畫面成功代替資料驗證，也不因多支腳本都測存檔就刪除不同資料的案例。
* **語法與外觀**：修改 JavaScript 時對受影響檔案執行 `node --check <檔案>`；修改 HTML 內嵌 JavaScript 時檢查該程式區塊語法，單純更新 script URL 不需重跑全部 JS 語法。排版先選受影響區域的桌機／窄螢幕與必要主題；只有共用斷點、主題切換／變數或多處共用樣式改變時才擴大矩陣。局部使用既有主題色不等於修改主題系統。
* **執行前簡述選擇**：用一句話交代本次影響的行為及要跑的檢查，不需逐項列出所有不跑的腳本或等待批准。新增功能或修正 bug 若既有驗證未涵蓋，補上必要案例；低風險文案／排版不為形式完整而新增永久測試。

### 回歸腳本對照

下表是行為與腳本的對照，不是關鍵字命中即全部執行的清單；局部文案、排版與 UI 互動先適用上述範圍判斷。

| 變更範圍 | 驗證 |
| --- | --- |
| 施法 metadata、跑團模式施法條件、法術位、專注或施法自動擲骰 | `node validate-tabletop-spellcasting.js` |
| 非施法能力動作定義／摘要解析、動作選項與操作、自訂／隱藏偏好及其持久化 | `node validate-action-metadata.js` |
| 德魯伊荒野形態、野獸資料與攻擊／資源操作、荒野夥伴、野性復甦、自然恢復、原初打擊及其狀態／持久化 | `node validate-tabletop-druid.js` |
| 法術書管理、準備法術總數、儀式施法、法術書匯入／持久化 | `node validate-spellbook.js` |
| 屬性擲骰、結果分配、背景加值及其擲骰歷史／自動儲存 | `node validate-ability-roll.js`；僅 27 購點套用與還原可用 `node validate-ability-roll.js --point-buy-only` |
| 擲骰備註、長按／鍵盤／觸控操作、取消或歷史相容性 | `node validate-dice-roll-notes.js` |
| 主手2、盾牌、雙手武器衝突、相關 AC／裝備摘要／PDF 欄位 | `node validate-main2-shield.js` |
| 導覽屬性引導／觸控；創角匯入銜接／PDF 載入取消；共用導覽流程 | 分別優先使用 `node validate-onboarding.js --touch-only`、`node validate-onboarding.js --imports-only`；影響共用導覽或分項不足以涵蓋時執行完整 `node validate-onboarding.js` |
| 短休／長休、生命骰、資源恢復或最佳旅伴 | `node validate-tabletop-rest.js` |
| 共用主題切換／保存、主題變數／素材、技能網格共用版面、PDF 盾牌受訓或實際可編輯 PDF 匯出 | `node validate-ui-themes.js`；此腳本混合主題、About、技能及 PDF，局部 About 內容／互動依上方原則驗證，不自動連帶驗證 PDF 或導覽 |
| PDF 精靈／魔人血統環法恢復提示 | `node validate-pdf-lineage-recovery.js`；涉及實際匯出時加跑 `node validate-ui-themes.js` |
| 明確要求建立、測試或更新離線角色卡 | 先執行 `build-offline-nopdf.ps1`，再執行 `node validate-offline-sharing.js` |

持續法術效果改變一般角色或野獸的 AC／速度計算、施法操作或狀態保存時，也需執行 `node validate-tabletop-druid.js`；僅調整其顯示字色、字級或間距不因此觸發整套德魯伊回歸。

### 執行與停止條件

* 先用既有分項或最小重現驗證修改，再依影響範圍決定是否需要完整腳本；分項已充分涵蓋時不自動補跑完整版本。腳本沒有分項不代表必須重構測試或跑遍所有功能，但規則、資料與共用機制仍須完成對應回歸，不得以節省時間為由略過。
* 同一程式版本已有可確認通過紀錄的檢查可沿用；只有後續修改影響該檢查的程式、依賴或測試前提時才重跑。既有腳本已涵蓋的流程不再用臨時瀏覽器重做，除非需要補足視覺、未涵蓋的互動或排查失敗。
* 失敗後先縮小到失敗情境，確認是本次回歸、測試／環境問題或既有問題；必要時用修改前版本對照。修正本次造成的失敗，再重跑受修正影響的範圍，不反覆執行無關的完整流程直到偶然通過。確認與本次無關後回報證據及未通過範圍，不擅自擴大修復，也不能將失敗算作通過。
* 沿用專案或環境已有的 Playwright 與瀏覽器，不為測試新增框架或依賴。
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

## 自動稽核判讀

稽核警告需以程式與瀏覽器行為確認，不以警告歸零為目標。`addEventListener` 綁定的按鈕可能被誤報為無動作；先檢查事件綁定，不為消除警告改成 inline handler。保留既有 textarea 的 `resize: vertical` 與原生 `<select>`，不因通用稽核建議而替換正常運作的控制項。其他警告仍需依實際影響調查。

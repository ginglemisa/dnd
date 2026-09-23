# twD20｜5.5 版手機角卡

twD20 是為 TRPG 新手、帶團者與教學活動設計的手機優先創角與桌邊輔助工具。它以較低的規則負擔協助玩家建立 1～8 級角色，快速看懂角色並開始遊戲。

- 正式網站：[twd20.com](https://twd20.com)
- Legal & About：[完整說明、授權與 attribution](https://twd20.com/about.html)
- GitHub：[ginglemisa/dnd](https://github.com/ginglemisa/dnd)

> twD20 是獨立製作的第三方 5.5 版相容工具，與 Wizards of the Coast LLC 或其他官方品牌無關。

## 適用情境

- 第一次接觸 5.5 版奇幻 TRPG 的玩家
- DM／教學者在桌邊帶領新手創角
- TRPG 推廣活動、體驗場與收費團
- 希望減少準備與查表時間的團務

本工具以手機操作為主，並預設現場有主持人或教學者協助說明規則。它不附帶朋友和地下城主，找團請洽 TRPG 網路或在地社群。

## 目前功能

### 創角與角色卡

- 數值、技能、裝備、動作、法術五個角色卡分頁
- 1～8 級角色資料與選項，以及可切換的關鍵數值自動計算
- 27 點購買、屬性擲骰、職業屬性範本、創角小幫手與新手導覽
- 裝備與法術搜尋、動態動作選項及規則摘要
- 法師法術書與契術師影之書管理，以及準備法術與書內儀式施法
- 經典藍色與暖紙磚紅兩套主題，各自支援亮色／暗色；包含主題專用 Logo、骰子動畫與暖紙亮色紙紋

### 桌邊模式

- 總覽、技能、動作、法術、資源五個桌邊分頁，與原角色卡共用資料
- HP、臨時 HP、狀態、死亡豁免與專注追蹤
- 武器命中與傷害擲骰、角色可用行動查閱；可隱藏既有項目或建立僅顯示文字說明的自訂行動
- 法術位、已選法術、施法方式與資源消耗管理，並支援可用結果的自動擲骰或治療處理
- 依目前職業、種族與等級顯示內建資源，也可建立自訂資源

### 儲存、分享與輸出

- 可選用的擲骰系統，支援常用骰、骰式結果與本機歷史紀錄
- 瀏覽器本機自動儲存，以及 JSON 角色紀錄匯入／匯出
- 分享角卡網址與指向 `https://twd20.com` 的 QR Code
- PDF 角色卡匯出
- 可直接下載開啟的單檔離線版本

右上角工具選單集中提供外觀與模式切換、操作設定、紀錄管理、QR Code、PDF 匯出、分享角卡、神祇參考及新手導覽。

「更換主題顏色」開關切換經典／暖紙，左側 🌓 按鈕切換亮色／暗色，下方文字顯示目前組合。預設暖紙，沿用既有明暗偏好；兩個設定會各自記住，不包含在角色 JSON 或分享網址中。

## 資料保存與分享

一般模式下，角色資料與部分操作偏好會儲存在目前瀏覽器的 LocalStorage。清除瀏覽器資料或更換裝置後，資料不會自動保留；建議定期匯出 JSON 備份，需要時再匯入還原。

按「分享角卡」後，可選擇兩種網址：

- **永久網址**：完整角色資料包含在網址中，網址較長，不會因短網址服務到期。
- **TWD20 短網址**：網址較短、方便傳送，僅保存 **90 天**；選擇後才會建立。

短網址僅在正式網站 `https://twd20.com`、分享格式為 `#s2=` 且 hash 長度不超過 10000 字元時可用。本機與離線環境保留原有長網址流程，不呼叫短網址服務。建立失敗時會顯示錯誤，可重試或改選永久網址，不會自動改複製長網址。兩種方式皆保留剪貼簿失敗時的手動複製功能，永久網址超過 4000 字元時仍會提醒。

透過有效分享網址開啟角色時會進入分享模式。分享模式中的角色修改不會自動寫入本機儲存，可先匯出 JSON 保存；「分享角卡」與「匯入 JSON」停用。「離開分享模式」經確認後會移除網址的分享資料，重新載入目前頁面並還原本機角色存檔（若有）；離線版保留目前 HTML 的路徑。

桌邊動作的隱藏設定、自訂按鈕與動作筆記屬於目前瀏覽器的操作偏好，獨立於角色資料保存，不包含在角色 JSON 或分享網址中；在分享模式下調整這些偏好仍會存到本機。

## 本機執行

本專案是原生 HTML、CSS、JavaScript 靜態網站，網站執行不需 npm 安裝或編譯。`index.html` 以傳統 `<script defer>` 依序載入全域模組，並保留初始化與表單串接等 inline 程式。以任意靜態 HTTP 伺服器提供專案目錄，再開啟 `index.html` 即可；例如環境已有 Python 時：

```powershell
python -m http.server 8000
```

接著開啟 `http://localhost:8000/`。多數功能可直接開啟 HTML 使用，但 PDF 匯出需透過 HTTP 伺服器載入相關檔案。

## 專案結構

- 網站入口與共用樣式：`index.html`、`styles.css`
- 外觀與版面規格：[DESIGN.md](DESIGN.md)
- 資料與共用規則：`character-rules.js`、`class-features.js`、`race.js`、`backgrounds.js`、`feats.js`、`tool-data.js`、`monster.js`、`equipment-data.js`、`equipment-notes.js`、`spell-list.js`、`condition.js`、`deity-info.js`
- 角色卡互動：`action-panel.js`、`dice-roller.js`、`spellbook.js`、`quick-build.js`、`onboarding-tour.js`、`app-dialog.js`、`scroll-to-top.js`
- 桌邊模式：`tabletop-mode.js`（狀態與共用 API）、`tabletop-actions.js`（武器與行動）、`tabletop-druid.js`（德魯伊形態與職業專屬操作）、`tabletop-spells.js`（施法與專注）、`tabletop-resources.js`（內建與自訂資源）
- PDF 匯出：`pdf-export.js`、`pdf-field-map.js`、`pdf-lib.custom.min.js`、`fontkit.custom.min.js`，以及角色紙與字型素材
- 資訊頁面：`about.html`、`ddals1.html`、`info-pages.css`、`legal-modal.js`
- 維護工具：`validate-*.js`（各功能回歸驗證）、`build-offline-nopdf.ps1`（離線版本產製）
- 衍生檔案：`TWD20-offline.html`
- 短網址後端：`cloudflare/twd20-url/worker.js`（Worker 原碼）、`wrangler.jsonc`（Cloudflare bindings 與部署設定）；API、90 天保存期限、IP 限流及維護方式見 [Worker README](cloudflare/twd20-url/README.md)。此服務與網站前端分開部署。

`character-rules.js` 提供共用角色計算與規則。`SpellCatalog` 由 `spell-list.js` 提供，是法術內容及桌邊施法 metadata 的來源。`ActionPanel` 依明確的非施法能力動作定義及角色選擇，建立職業、種族、專長、魔能祈喚與超魔等動作選項；法術施法時間則沿用既有分類機制。動作 key、分類、等級與選擇條件由結構化定義控制，說明取自規則資料或既有個人化摘要。

`action-panel.js` 負責動作選項與角色卡的動作 UI，`tabletop-actions.js` 負責桌邊呈現與操作。桌邊模組經由 `TabletopMode` 共用 API 協作，角色目前選擇仍由既有表單／DOM 提供，擲骰統一經由 `DiceRoller`，本機儲存則透過 `window.dndStorage` 存取。

`tabletop-druid.js` 負責德魯伊專屬的桌邊操作，包括荒野形態與已知形態、野獸攻擊、荒野夥伴、野性復甦、自然恢復及原初打擊。形態、資源及夥伴狀態仍透過 `TabletopMode` 管理，野獸規則資料則沿用專案既有的結構化資料來源。

PDF 程式與素材只會在使用 PDF 匯出時動態載入。正式網站若保留 PDF 匯出入口，需一併提供這些檔案；離線精簡版由產生腳本停用 PDF 匯出。

## 維護與驗證

從專案根目錄執行下列命令，依修改範圍選擇相關腳本即可。修改 JavaScript 時，另執行 `node --check <受影響檔案.js>`；只修改 Markdown 時，核對檔名、連結、命令與說明，不需執行功能驗證。

### 執行環境

使用 Node.js 20 以上。標示「瀏覽器」的腳本需要 Playwright 與 Chromium，會自行啟動及關閉本機伺服器，不需手動啟動網站。新環境可執行：

```powershell
npm ci
npx --no-install playwright install chromium
```

已有可用依賴與瀏覽器時不需重裝。除 `validate-main2-shield.js` 固定使用 Playwright Chromium 外，其餘瀏覽器腳本可用 `$env:DND_BROWSER_CHANNEL = "msedge"` 選用已安裝的 Edge；執行 `Remove-Item Env:DND_BROWSER_CHANNEL` 可恢復預設。使用環境提供的 Playwright 套件時，可設定 `NODE_PATH` 指向其 `node_modules`。

### 驗證腳本

| 執行命令 | 用途與檢查範圍 | 額外需求／限制 |
| --- | --- | --- |
| `node validate-ability-roll.js` | 屬性擲骰、去最低骰、結果分配、背景加值、歷史與自動儲存、工具選單及不同寬度版面 | 瀏覽器 |
| `node validate-action-metadata.js` | 非施法動作定義、角色卡／桌邊動作、自訂與隱藏偏好、手動副武器、JSON／分享／自動儲存 | 瀏覽器 |
| `node validate-dice-roll-notes.js` | 擲骰備註、長按與 Shift+Enter、取消、觸控、焦點及舊歷史格式相容性 | 瀏覽器 |
| `node validate-main2-shield.js` | 主手2 搭配盾牌、雙手武器衝突確認、AC、裝備摘要、狀態還原與 PDF 欄位 | 瀏覽器；固定使用 Playwright Chromium |
| `node validate-offline-sharing.js` | 離線成品的 inline 語法、永久分享網址、禁止短網址 API、複製 fallback、分享模式與離開流程 | 純 Node.js；須先產生 `TWD20-offline.html`，見[離線版本](#離線版本)。使用 URL 模擬，不代表手機檔案權限或儲存已通過實機驗證 |
| `node validate-onboarding.js` | 新手／桌邊導覽（含第 3 步點擊推進、減少動態效果）、創角小幫手匯入、觸控、取消、資料與焦點保留、PDF 載入及取消流程 | 瀏覽器；PDF 繪製以替身驗證，未測實際成品 |
| `node validate-pdf-lineage-recovery.js` | 精靈與魔人於不同等級的 PDF 血統環法恢復提示 | 純 Node.js；只檢查欄位資料 |
| `node validate-spellbook.js` | 法術書、準備數量、書內儀式、創角匯入、PDF 法術書選項、JSON／分享／自動儲存及版面 | 瀏覽器 |
| `node validate-tabletop-druid.js` | 荒野形態、野獸攻擊、德魯伊資源、持續法術效果（含一般／野獸 AC 與速度）、專注、儲存與版面 | 瀏覽器 |
| `node validate-tabletop-rest.js` | 短休／長休、生命骰、職業與種族資源恢復、最佳旅伴、可選恢復、取消與自動儲存 | 瀏覽器 |
| `node validate-tabletop-spellcasting.js` | 法術 metadata、施法條件、法術位、專注與自動擲骰 | 純 Node.js 與 Git；需可讀取 `HEAD:spell-list.js`，比對既有法術 ID |
| `node validate-ui-themes.js` | 四種外觀、偏好保存、技能版面、主題素材、桌邊／創角 UI，以及 PDF 盾牌受訓與血統提示 | 瀏覽器；會實際匯出並重新讀取可編輯 PDF，需專案 PDF 與字型素材 |

`validate-onboarding.js` 可加 `--imports-only` 只跑匯入與 PDF 生命週期，或加 `--touch-only` 只跑觸控流程；不加參數才是完整驗證。PDF 血統提示的小範圍修改可先用 `validate-pdf-lineage-recovery.js`，涉及實際匯出時再用 `validate-ui-themes.js`。

需要檢查視覺版面時，部分腳本可透過下列環境變數輸出截圖；一般驗證不需設定。請先建立輸出目錄，避免將截圖加入版本控制。

| 腳本 | 截圖目錄環境變數 |
| --- | --- |
| `validate-ability-roll.js` | `DND_ABILITY_SCREENSHOT_DIR` |
| `validate-action-metadata.js`、`validate-tabletop-druid.js` | `DND_SCREENSHOT_DIR` |
| `validate-onboarding.js` | `DND_ONBOARDING_SCREENSHOT_DIR` |
| `validate-spellbook.js` | `DND_SPELLBOOK_SCREENSHOTS` |
| `validate-ui-themes.js` | `DND_THEME_SCREENSHOT_DIR` |

完整變更與驗證條件見 [AGENTS.md](AGENTS.md)。臨時瀏覽器檢查沿用 [Playwright CLI skill](.agents/skills/playwright-cli/SKILL.md) 與 `npx --no-install playwright cli`。

## 離線版本

`TWD20-offline.html` 是由來源檔產生的單檔版本，會內嵌本機 CSS、JavaScript、圖片與 Legal & About 內容，產生後可直接以瀏覽器開啟。精簡離線版不包含 PDF 匯出功能。

離線版一般模式的「分享角卡」會在本機編碼資料，直接複製 `https://twd20.com/#s2=...`（或相容的 `#s=...`）永久網址，不建立短網址，也不傳送建立請求。網址不包含本機磁碟路徑或 Android 檔案提供者的 `content://` 路徑；接收者需連網開啟正式網站。完全離線交換角色請使用 JSON 匯出／匯入。

離線分享模式仍支援讀取目前網址的分享資料。檔案能否執行 JavaScript、重新載入與保存本機資料，取決於瀏覽器或檔案開啟 App；不能將手機檔案預覽視為完整瀏覽器，也不保證 `content://` 的存取權限或重新載入行為。跨平台網址處理不等於所有平台已完成實機驗證。

維護者只有在確定要同步離線成品時，才需從 PowerShell 執行：

```powershell
.\build-offline-nopdf.ps1
```

請勿直接只修改 `TWD20-offline.html`；功能與文案應先修改來源檔，再於需要同步離線成品時重新產生。一般來源修改不會自動更新此檔，離線成品可能與目前網站來源不同步。

## 授權、素材與法律聲明

本專案使用並改編 SRD 5.2.1，並包含另有授權條件的字型、角色紙、函式庫與其他第三方內容。專案原始程式碼、SRD 內容、第三方素材、AI 協作說明、商標及免責聲明的適用範圍不同；請以 [`about.html`](about.html)／[線上 Legal & About](https://twd20.com/about.html) 的完整說明與 attribution 為準。

## 問題回報與參與

- Email：tsai.reggie428@gmail.com
- 巴哈姆特站內信：`reggietsai`
- GitHub repository：[ginglemisa/dnd](https://github.com/ginglemisa/dnd)

歡迎 fork 專案並依團務需求調整介面或功能。若這個工具對你或玩家有幫助，也歡迎分享網站或替專案加上 Star。

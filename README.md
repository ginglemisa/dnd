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

- 數值、技能、動作、裝備、法術五個角色卡分頁
- 1～8 級角色資料與選項，以及可切換的關鍵數值自動計算
- 27 點購買、職業屬性範本、創角小幫手與新手導覽
- 裝備與法術搜尋、動態動作選項及規則摘要
- 藍白與深色外觀

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

## 資料保存與分享

一般模式下，角色資料與部分操作偏好會儲存在目前瀏覽器的 LocalStorage。清除瀏覽器資料或更換裝置後，資料不會自動保留；建議定期匯出 JSON 備份，需要時再匯入還原。

透過有效分享網址開啟角色時會進入分享模式。分享模式中的角色修改不會自動寫入本機儲存，可先匯出 JSON 保存；匯入 JSON 後會退出分享模式，將匯入的角色資料存到本機。

桌邊動作的隱藏設定、自訂按鈕與動作筆記屬於目前瀏覽器的操作偏好，獨立於角色資料保存，不包含在角色 JSON 或分享網址中；在分享模式下調整這些偏好仍會存到本機。

## 本機執行

本專案是原生 HTML、CSS、JavaScript 靜態網站，網站執行不需 npm 安裝或編譯。`index.html` 以傳統 `<script defer>` 依序載入全域模組，並保留初始化與表單串接等 inline 程式。以任意靜態 HTTP 伺服器提供專案目錄，再開啟 `index.html` 即可；例如環境已有 Python 時：

```powershell
python -m http.server 8000
```

接著開啟 `http://localhost:8000/`。多數功能可直接開啟 HTML 使用，但 PDF 匯出需透過 HTTP 伺服器載入相關檔案。

## 專案結構

- 網站入口與共用樣式：`index.html`、`styles.css`
- 資料與共用規則：`character-rules.js`、`class-features.js`、`race.js`、`backgrounds.js`、`feats.js`、`tool-data.js`、`monster.js`、`equipment-data.js`、`equipment-notes.js`、`spell-list.js`、`condition.js`、`deity-info.js`
- 角色卡互動：`action-panel.js`、`dice-roller.js`、`quick-build.js`、`onboarding-tour.js`、`app-dialog.js`、`scroll-to-top.js`
- 桌邊模式：`tabletop-mode.js`（狀態與共用 API）、`tabletop-actions.js`（武器與行動）、`tabletop-spells.js`（施法與專注）、`tabletop-resources.js`（內建與自訂資源）
- PDF 匯出：`pdf-export.js`、`pdf-field-map.js`、`pdf-lib.custom.min.js`、`fontkit.custom.min.js`，以及角色紙與字型素材
- 資訊頁面：`about.html`、`ddals1.html`、`info-pages.css`、`legal-modal.js`
- 維護工具：`validate-tabletop-spellcasting.js`、`validate-action-metadata.js`、`build-offline-nopdf.ps1`
- 動作系統遷移紀錄：`ACTION-METADATA-MIGRATION.md`（歷史盤點與驗證紀錄；目前行為仍以實際程式與資料為準）
- 衍生檔案：`TWD20-offline.html`

`character-rules.js` 提供共用角色計算與規則。`SpellCatalog` 由 `spell-list.js` 提供，是法術內容及桌邊施法 metadata 的來源。`ActionPanel` 依明確的非施法能力動作定義及角色選擇，建立職業、種族、專長、魔能祈喚與超魔等動作選項；法術施法時間則沿用既有分類機制。動作 key、分類、等級與選擇條件由結構化定義控制，說明取自規則資料或既有個人化摘要。

`action-panel.js` 負責動作選項與角色卡的動作 UI，`tabletop-actions.js` 負責桌邊呈現與操作。桌邊模組經由 `TabletopMode` 共用 API 協作，角色目前選擇仍由既有表單／DOM 提供，擲骰統一經由 `DiceRoller`，本機儲存則透過 `window.dndStorage` 存取。

PDF 程式與素材只會在使用 PDF 匯出時動態載入。正式網站若保留 PDF 匯出入口，需一併提供這些檔案；離線精簡版由產生腳本停用 PDF 匯出。

## 維護與驗證

修改 JavaScript 後，可先執行最低成本的語法檢查：

```powershell
node --check .\受影響的檔案.js
```

若修改法術 metadata 或桌邊施法、法術位、專注、自動擲骰流程，從專案根目錄執行專用驗證（需要 Node.js 與 Git，會讀取 `HEAD:spell-list.js` 比對）：

```powershell
node .\validate-tabletop-spellcasting.js
```

若修改非施法能力動作定義、動作 UI 或桌邊動作偏好，可執行瀏覽器回歸驗證：

```powershell
node .\validate-action-metadata.js
```

此腳本需要環境已提供可由 Node.js 載入的 `playwright` 與可用瀏覽器，會自行啟動本機靜態伺服器，檢查動作條件、角色卡／桌邊 UI、自訂與隱藏動作，以及 JSON、分享與自動儲存流程。若使用環境內附的套件，可用 `NODE_PATH` 指向其 `node_modules`；使用已安裝的 Microsoft Edge 時，可先在 PowerShell 設定 `$env:DND_BROWSER_CHANNEL = "msedge"`。

專案未建立套件管理或通用測試框架；上述瀏覽器腳本沿用環境已有的 Playwright，不需為一般修改新增專案相依。只修改 Markdown 時，檢查檔名、連結、命令與內容是否符合現況即可。修改正式載入的 CSS／JavaScript 時，亦應檢查 `index.html` 對應資源的快取版本。

## 離線版本

[`TWD20-offline.html`](TWD20-offline.html) 是由來源檔產生的單檔版本，會內嵌本機 CSS、JavaScript、圖片與 Legal & About 內容，可下載後直接以瀏覽器開啟。精簡離線版不包含 PDF 匯出功能。

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

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
- 武器攻擊與角色可用行動查閱；可隱藏既有項目或建立自訂行動
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

透過分享網址開啟角色時會進入分享模式。分享模式中的修改不會自動寫入本機儲存，請使用匯入／匯出功能保存需要的內容。

## 本機執行

本專案是原生 HTML、CSS、JavaScript 靜態網站，沒有 npm 相依套件或必要的編譯步驟。以任意靜態 HTTP 伺服器提供專案目錄，再開啟 `index.html` 即可；例如環境已有 Python 時：

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
- 維護工具：`validate-tabletop-spellcasting.js`、`build-offline-nopdf.ps1`
- 衍生檔案：`TWD20-offline.html`

`SpellCatalog` 由 `spell-list.js` 提供，是法術內容及桌邊施法 metadata 的來源。`ActionPanel` 從既有職業、種族、專長與法術資料建立角色可用動作。桌邊模組則統一經由 `TabletopMode` 同步狀態，擲骰由 `DiceRoller` 提供。

PDF 程式與素材只會在使用 PDF 匯出時動態載入；不需要 PDF 功能的部署可省略這些檔案。

## 維護與驗證

修改 JavaScript 後，可先執行最低成本的語法檢查：

```powershell
node --check .\受影響的檔案.js
```

若修改法術 metadata 或桌邊施法、法術位、專注、自動擲骰流程，另執行專用驗證：

```powershell
node .\validate-tabletop-spellcasting.js
```

專案沒有通用測試框架。請避免為一般修改新增套件管理器或建置相依。

## 離線版本

[`TWD20-offline.html`](TWD20-offline.html) 是由來源檔產生的單檔版本，會內嵌本機 CSS、JavaScript、圖片與 Legal & About 內容，可下載後直接以瀏覽器開啟。精簡離線版不包含 PDF 匯出功能。

維護者只有在確定要同步離線成品時，才需從 PowerShell 執行：

```powershell
.\build-offline-nopdf.ps1
```

請勿直接只修改 `TWD20-offline.html`；功能與文案應先修改來源檔，再重新產生離線版本。

## 授權、素材與法律聲明

本專案使用並改編 SRD 5.2.1，並包含另有授權條件的字型、角色紙、函式庫與其他第三方內容。專案原始程式碼、SRD 內容、第三方素材、AI 協作說明、商標及免責聲明的適用範圍不同；請以 [`about.html`](about.html)／[線上 Legal & About](https://twd20.com/about.html) 的完整說明與 attribution 為準。

## 問題回報與參與

- Email：tsai.reggie428@gmail.com
- 巴哈姆特站內信：`reggietsai`
- GitHub repository：[ginglemisa/dnd](https://github.com/ginglemisa/dnd)

歡迎 fork 專案並依團務需求調整介面或功能。若這個工具對你或玩家有幫助，也歡迎分享網站或替專案加上 Star。

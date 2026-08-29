# TWD20 | 5.5版手機角卡

給 TRPG 新手、帶團者與教學活動使用的手機創角網站。以較低的規則負擔協助玩家建立 1～8 級角色，快速開始第一場冒險。

- 正式網站：[https://twd20.com](https://twd20.com)
- Legal & About：[版權宣告](https://twd20.com/about.html)
- GitHub：[https://github.com/ginglemisa/dnd](https://github.com/ginglemisa/dnd)

> TWD20 是獨立製作的第三方 5.5 版相容工具，與任何官方品牌無關。

## 適用情境

- 第一次接觸 5.5 版奇幻 TRPG 的玩家
- DM／教學者在桌邊帶領新手創角
- TRPG 推廣活動、體驗場與收費團
- 希望減少準備時間的快速開團

本工具以手機操作為主，並預設現場有主持人或教學者協助說明規則。

本工具不附帶朋友和地下城主，找團請洽詢 TRPG 網路或在地社群。

## 目前功能

- 五個角色卡分頁：數值、技能、動作、裝備、法術
- 支援 1～8 級角色資料與相關選項
- 桌邊模式（戰鬥用分頁）
- 簡易擲骰系統
- 本機自動儲存角色資料
- JSON 角色紀錄匯入與匯出
- 分享角卡網址
- 指向 `https://twd20.com` 的 QR Code
- PDF 角色卡匯出
- 藍白外觀與深色外觀
- 創角小幫手
- 可獨立開啟的離線版本

右上角工具選單集中提供外觀切換、紀錄管理、QR Code、PDF 匯出、分享角卡與新手導覽。

## 資料保存與分享

一般模式下，角色資料會自動儲存在目前瀏覽器的 LocalStorage。清除瀏覽器資料或更換裝置後，資料不會自動保留；建議定期使用「匯出紀錄」備份 JSON 檔案，需要時再以「匯入紀錄」還原。

透過分享網址開啟角色時會進入分享模式。在分享模式中的修改不會自動寫入本機儲存，請使用匯入／匯出功能保存需要的內容。

## 離線版本

專案提供單檔離線角卡：[`TWD20-offline.html`](TWD20-offline.html)。下載後可直接以瀏覽器開啟，不必安裝應用程式。

離線版本無法輸出 PDF 文件，請注意。

## 專案結構

這是原生 HTML、CSS 與 JavaScript 的靜態網頁專案；PDF 匯出功能需要以伺服器啟動 `index.html` 方能生效。

- 入口與樣式：`index.html`、`styles.css`
- Legal & About：`about.html`、`info-pages.css`、`legal-modal.js`（首頁 iframe modal）
- 主要功能與資料：`scroll-to-top.js`、`action-panel.js`、`monster.js`、`class-features.js`、`race.js`、`backgrounds.js`、`tool-data.js`、`feats.js`、`equipment-notes.js`、`equipment-data.js`、`spell-list.js`、`condition.js`、`character-rules.js`、`onboarding-tour.js`、`quick-build.js`、`deity-info.js`
- 桌邊模式：`tabletop-mode.js`（主頁面）、`tabletop-actions.js`（武器與行動查閱）、`tabletop-spells.js`（法術與專注）、`tabletop-resources.js`（既有與自訂資源）；`app-dialog.js` 提供全站共用的對話框與通知
- PDF 匯出程式：`pdf-lib.custom.min.js`、`fontkit.custom.min.js`、`pdf-field-map.js`、`pdf-export.js`
- PDF 匯出素材：`5e_char_sheet.pdf`、`NotoSansTC-Regular-IdentityCID.otf`、`SourceHanSerifTC-Bold.otf`
- Legal & About 視窗圖像：`logo.png`

`action-panel.js` 負責「動作」分頁的動作、附贈動作與反應選項面板：提供基本選項，並依目前職業、種族、專長、已選法術與魔能祈喚，從既有資料顯示可用的動態按鈕；含有「等級 X：」的能力會依角色等級顯示。

桌邊模式的資料與原角色卡欄位同步。`tabletop-mode.js` 是此模式的狀態與切換入口，並對其他桌邊模組提供 `TabletopMode` API 與 `tabletopstatechange`／`tabletop-panelchange` 事件；其餘三個 `tabletop-*.js` 僅負責各自分頁的呈現與操作，不應重複保存或推算規則資料。

`pdf-export.js` 與其相依檔案只會在使用 PDF 匯出時動態載入；若不需要該功能，可省略「PDF 匯出程式」與「PDF 匯出素材」兩類。`TWD20-offline.html` 是另行產生的單檔離線版本，並非 `index.html` 的相依檔案。

## 中文角色紙

- [SRD 中文角色紙](https://tinyurl.com/srd5etw)：具備表單功能，可先填寫再列印
- 角色卡排版作者：[赤赤@AkaA](https://x.com/AkaAAkaAka)
- [無表單 PDF／原 PNG 檔](https://drive.google.com/drive/folders/1brrzdbRcxMvxHcYYjyzs2N_8aPaQewW6?usp=sharing)
- PDF 使用字型：[Noto Sans TC](https://fonts.google.com/download?family=Noto%20Sans%20TC)、[思源宋體 SourceHanSerifTC-Bold.otf](https://github.com/adobe-fonts/source-han-serif/tree/release/OTF/TraditionalChinese)

## 授權與法律聲明

### 規則內容

本專案使用並改編 System Reference Document 5.2.1（SRD 5.2.1）的內容。SRD 5.2.1 採 [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/legalcode) 授權。

### 專案內容

專案原始程式碼、原創說明文字、介面結構與功能可依 MIT License 使用；引用或改編自 SRD 5.2.1 的內容仍依 CC BY 4.0 使用。重製、改作或商用時，請保留必要 attribution，並自行確認所在地與使用平台的規範。

完整說明請見 [Legal & About](https://twd20.com/about.html)。

### SRD Attribution

This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

## 問題回報與參與

如果發現 Bug 或有改善建議，可透過以下方式聯絡：

- Email：ginglemisa@gmail.com
- 巴哈姆特站內信：`reggietsai`
- GitHub repository：[ginglemisa/dnd](https://github.com/ginglemisa/dnd)

歡迎 fork 專案並依團務需求調整介面或功能。若這個工具對你或玩家有幫助，也歡迎分享網站或替專案加上 Star。

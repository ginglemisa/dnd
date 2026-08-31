# TWD20 | 5.5版手機角卡

給 TRPG 新手、帶團者與教學活動使用的手機創角網站。以較低的規則負擔協助玩家建立 1～8 級角色，快速開始第一場冒險。

- 正式網站：[https://twd20.com](https://twd20.com)
- Legal & About：[版權宣告](https://twd20.com/about.html)
- GitHub：[https://github.com/ginglemisa/dnd](https://github.com/ginglemisa/dnd)

> twD20 是獨立製作的第三方 5.5 版相容工具，與 Wizards of the Coast LLC 或其他官方品牌無關。

## 適用情境

- 第一次接觸 5.5 版奇幻 TRPG 的玩家
- DM／教學者在桌邊帶領新手創角
- TRPG 推廣活動、體驗場與收費團
- 希望減少準備時間的快速開團

本工具以手機操作為主，並預設現場有主持人或教學者協助玩家並說明規則。

本工具不附帶朋友和地下城主，找團請洽詢 TRPG 網路或在地社群。

## 目前功能

- 五個角色卡分頁：數值、技能、動作、裝備、法術
- 支援 1～8 級角色資料與相關選項
- 桌邊模式
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
- 桌邊模式：`tabletop-mode.js`（桌邊模式控制器）、`tabletop-actions.js`（武器與行動查閱）、`tabletop-spells.js`（法術與專注）、`tabletop-resources.js`（既有與自訂資源）；`app-dialog.js` 提供全站共用的對話框與通知
- PDF 匯出程式：`pdf-lib.custom.min.js`、`fontkit.custom.min.js`、`pdf-field-map.js`、`pdf-export.js`
- PDF 匯出素材：`5e_char_sheet.pdf`、`NotoSansTC-Regular-IdentityCID.otf`、`SourceHanSerifTC-Bold.otf`
- Legal & About 視窗圖像：`logo.png`

`action-panel.js` 負責「動作」分頁的動作、附贈動作與反應選項面板：提供基本選項，並依目前職業、種族、專長、已選法術與魔能祈喚，從既有資料顯示可用的動態按鈕；含有「等級 X：」的能力會依角色等級顯示。

桌邊模式的資料與原角色卡欄位同步。`tabletop-mode.js` 是此模式的狀態與切換入口，並對其他桌邊模組提供 `TabletopMode` API 與 `tabletopstatechange`／`tabletop-panelchange` 事件；其餘三個 `tabletop-*.js` 負責各自分頁的呈現與操作，規則狀態統一由 `tabletop-mode.js` 管理。

`pdf-export.js` 與其他相關檔案只會在使用 PDF 匯出時動態載入；若不需要該功能，可省略「PDF 匯出程式」與「PDF 匯出素材」兩類。

`TWD20-offline.html` 是另行產生的單檔離線版本，可獨立運行。

## 中文角色紙

- [SRD 中文角色紙](https://tinyurl.com/srd5etw)：具備表單功能，可先填寫再列印
- 角色卡排版作者：[赤赤@AkaA](https://x.com/AkaAAkaAka)
- [無表單 PDF／原 PNG 檔](https://drive.google.com/drive/folders/1brrzdbRcxMvxHcYYjyzs2N_8aPaQewW6?usp=sharing)
- PDF 使用字型：[Noto Sans TC](https://fonts.google.com/download?family=Noto%20Sans%20TC)、[思源宋體 SourceHanSerifTC-Bold.otf](https://github.com/adobe-fonts/source-han-serif/tree/release/OTF/TraditionalChinese)

## 授權與法律聲明

### 規則內容

本專案使用並改編 System Reference Document 5.2.1（SRD 5.2.1）的內容。

SRD 5.2.1 採 Creative Commons Attribution 4.0 International（CC BY 4.0）授權。依該授權使用、重製或改編相關內容時，應保留適當的來源與授權資訊，並於修改內容時依授權條件標示相關變更。

本專案對 SRD 內容所做的翻譯、縮寫、重新編排或介面呈現，不改變原始 SRD 內容適用的授權條件。

### 專案原始程式碼

除另有標示的第三方內容外，本專案中由專案作者創作、修改或有權授權的原始程式碼，以 MIT License 提供。

MIT License 允許使用、複製、修改、合併、發布、散布、再授權及商業使用相關程式碼，但使用者應依 License 文件保留必要的著作權與授權聲明。

MIT License 僅適用於本專案有權以該授權提供的內容，不代表 repository 中所有第三方素材、SRD 內容、字型或其他外部作品均採 MIT License。

完整條款請見專案中的 LICENSE 文件。

### AI 協作開發

本專案部分原始程式碼與文字內容曾使用生成式 AI 協助產生、修改、整理、檢查或除錯，並經人工選擇、整合與調整。
MIT License 所提供的授權，以專案作者依法具有著作權或其他授權權限的範圍為限。對於依法不受著作權保護、屬第三方權利，或另受其他授權條款拘束的內容，本專案不主張以 MIT License 取得或授予超出依法可授權範圍的權利。

### 第三方素材

本專案包含或搭配使用部分第三方素材，包括但不限於：
System Reference Document 5.2.1：依 CC BY 4.0 使用 Noto Sans TC 字型：依其原始字型授權條款使用 Source Han Serif／思源宋體字型：依其原始字型授權條款使用

PDF 角色紙、排版、圖像或其他標示作者／來源的素材：權利仍屬各該權利人，並依其個別授權或使用條件處理
第三方 JavaScript 函式庫及其他外部元件：依各自的 License 使用

除非另有明確標示，本專案的 MIT License 不取代上述第三方內容原有的授權條款。

使用者若重製、修改、重新散布或商業使用本專案，應自行確認實際使用內容所適用的授權條件。

#$# 商標與品牌
本專案名稱、說明或規則文字中可能出現用於辨識相容性、來源或規則內容的第三方名稱。

除依法或相關授權所允許的使用外，本專案不主張任何第三方商標、品牌名稱、標誌或其他識別標誌的權利，亦不表示相關權利人對 TWD20 有任何贊助、認可或合作關係。

### 免責聲明
本專案以現況（AS IS）提供，不保證內容完全正確、完整或適合任何特定用途。

規則摘要與介面文字以方便遊戲與新手使用為目的，可能經過翻譯、縮寫或重新整理；如需確認完整規則，應以相關授權來源及其正式文件為準。

使用者應自行判斷本專案及其內容是否符合所在地法律、活動需求、平台規範與第三方授權條件。

SRD Attribution
This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd.
The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

完整的專案、第三方內容與相關說明請見 [Legal & About](https://twd20.com/about.html)。

## 問題回報與參與

如果發現 Bug 或有改善建議，可透過以下方式聯絡：

- Email：tsai.reggie428@gmail.com
- 巴哈姆特站內信：`reggietsai`
- GitHub repository：[ginglemisa/dnd](https://github.com/ginglemisa/dnd)

歡迎 fork 專案並依團務需求調整介面或功能。若這個工具對你或玩家有幫助，也歡迎分享網站或替專案加上 Star。

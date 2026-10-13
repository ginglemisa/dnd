# twD20｜5.5 版手機角卡

twD20 是 Reggie Tsai / 瑞基製作的手機創角工具，協助新手、DM 與教學活動快速建立 1～8 級角色、查閱摘要並開始遊戲。適用於體驗場、推廣活動及收費團；預設現場有主持人協助說明規則。

[正式網站](https://twd20.com) · [Legal & About](https://twd20.com/#legal-about-modal) · [GitHub](https://github.com/ginglemisa/dnd)

## 主要功能

- **創角與角色卡**：27 點購買、屬性擲骰、職業範本、快速創角與導覽，自動整理數值、技能、裝備、動作及法術。
- **跑團模式**：管理生命值、狀態、死亡豁免、專注、法術位與職業資源，操作武器攻擊、施法及擲骰。
- **保存與輸出**：本機自動儲存、JSON 匯入／匯出、分享網址、QR Code 與 PDF 角色卡。
- **冒險日誌**：記錄團錄與獎勵，支援書頁閱讀、全文搜尋及整本匯入／匯出。
- **外觀與離線使用**：暖紙／經典主題、亮色／暗色，以及不含 PDF 匯出的單檔離線版。

## 資料保存與分享

角色與冒險日誌保存在目前瀏覽器。清除網站資料、更換瀏覽器、App 或裝置可能遺失紀錄，請定期匯出 JSON 備份。**角色與日誌須分別匯出**；角色 JSON 不包含日誌、頭像及所有本機偏好，也不是整個網站資料的備份。

匯入角色 JSON 會取代目前角色，並重設相關本機紀錄與偏好；日誌及外觀設定會保留。匯入日誌則會經確認後取代整本日誌，請先備份。若角色匯入失敗並提示保留分頁，請保持該分頁開啟，排除儲存問題後重新整理重試；分頁暫存不能取代永久備份。

「分享角卡」可選擇資料直接包含在網址中的**永久網址**，或保存 **90 天**的 **TWD20 短網址**。短網址只在正式網站、符合格式與長度限制且使用者選擇後建立；失敗時可自行重試或改選永久網址。分享網址含角色資料，請只交給願意分享的對象。

分享模式不自動儲存角色修改，並停用再次分享與 JSON 匯入；請匯出 JSON 或 PDF 保存。離開分享模式需確認，之後回到本機存檔。日誌不隨角色分享，清除角色紀錄也不會刪除日誌。

離線版能否保存資料取決於瀏覽器或檔案 App。離線版產生的分享網址仍需接收者連網開啟；完全離線交換請使用 JSON。

本站使用 Google Analytics 觀察整體使用情況，供更新參考，不用於商業行為；分享網址停用追蹤。

## 本機啟動與參與

這是原生 HTML、CSS、JavaScript 靜態網站，不需編譯。在專案目錄執行：

```powershell
python -m http.server 8000
```

開啟 `http://localhost:8000/?analytics=owner`，其中 `analytics=owner` 用於排除開發／測試流量。PDF 匯出須透過 HTTP 載入素材。

歡迎回報問題、提出修改、fork 或分享網站。參與開發前請閱讀 [AGENTS.md](AGENTS.md)，了解專案限制與驗證方式。

## 授權、素材與法律聲明

本專案有權授權的原始程式碼採 [MIT License](LICENSE.txt)，使用與散布時須保留其著作權及授權聲明；第三方內容仍依各自原始條件處理，不因本專案而改授權為 MIT。

規則內容改編自 [SRD 5.2.1](https://www.dndbeyond.com/srd)，採 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode)，經翻譯、縮寫、整理與重新呈現。摘要不取代完整規則；更高等級、其他角色選項或規則疑義，請查正式來源並依實際團務裁定。

使用素材：

- [Noto Sans TC](https://fonts.google.com/noto/specimen/Noto+Sans+TC)、[Source Han Serif](https://github.com/adobe-fonts/source-han-serif)
- [SRD 中文角色紙](https://tinyurl.com/srd5etw)，排版：[赤赤@AkaA](https://x.com/AkaAAkaAka)；[無表格 PDF／原 PNG](https://drive.google.com/drive/folders/1brrzdbRcxMvxHcYYjyzs2N_8aPaQewW6?usp=sharing)
- [pdf-lib](https://github.com/Hopding/pdf-lib)、[fontkit](https://github.com/Hopding/fontkit)

大部分程式碼與文字由生成式 AI 協助產生、整理或除錯，再由作者選擇、測試與整合；MIT 授權僅限作者依法有權授予的範圍，不涵蓋第三方權利或另有授權的內容。

twD20 是獨立第三方相容工具，並非 Wizards of the Coast LLC 製作、贊助、認可或授權的官方產品；所提及名稱與商標屬各自權利人。本工具依現況（AS IS）提供，不保證規則、翻譯、計算或功能完全正確；重製、改編、散布或商用時，請確認適用法律、平台規範及第三方授權。

### SRD Attribution

This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

## 聯絡

Email：[tsai.reggie428@gmail.com](mailto:tsai.reggie428@gmail.com) · 巴哈姆特站內信：`reggietsai`

# twD20｜5.5 版手機角卡

twD20 是 Reggie Tsai / 瑞基製作的手機創角工具，協助新手、DM 與教學活動快速建立 1～8 級角色、查閱摘要並開始遊戲。適用於體驗場、推廣活動及收費團；預設現場有主持人協助說明規則。

[正式網站](https://twd20.com) · [Legal & About](https://twd20.com/#legal-about-modal) · [GitHub](https://github.com/ginglemisa/dnd)

## 功能

- **創角與角色卡**：數值、技能、裝備、動作、法術；支援 27 點購買、屬性擲骰、職業範本、自動計算、創角小幫手及新手導覽。
- **跑團模式操作**：HP、臨時 HP、狀態、死亡豁免、專注、武器攻擊、法術位與職業資源；可隱藏或自訂行動，管理法術書與儀式施法。
- **紀錄與輸出**：本機自動儲存、JSON 匯入／匯出、分享網址、QR Code、PDF 角色卡及單檔離線版；可選用擲骰與歷史紀錄。
- **冒險日誌**：獨立書頁閱讀與編輯、分頁及整本 JSON 匯入／匯出；手動記錄角色資訊、團錄與獎勵，使用 `dnd.adventureJournal.v1` 保存，不包含在角色 JSON、分享或角色自動存檔中，清除角色紀錄也會保留日誌。匯入會經確認後取代整本日誌，請先匯出備份。
- **外觀**：工具選單切換暖紙／經典，🌓 切換亮色／暗色；預設暖紙並沿用既有明暗偏好。兩項設定各自保存，不包含在角色 JSON 或分享網址中。

## 資料保存與分享

一般模式將角色存於目前瀏覽器的 LocalStorage。清除瀏覽器資料、更換 App 或裝置可能遺失紀錄，請定期匯出 JSON 備份。本站使用 Google Analytics 觀察整體使用情況，供更新參考，不用於商業行為。

「分享角卡」提供：

- **永久網址**：角色資料直接包含於網址中，不受短網址服務期限影響；超過 4000 字元會提醒。
- **TWD20 短網址**：選擇後才建立，保存 **90 天**。僅限正式 Origin `https://twd20.com`、`#s2=` 格式及 hash ≤10000 字元；本機與離線版不呼叫服務。

建立短網址失敗會明確提示，可自行重試或改選永久網址，不自動重試或改複製長網址。兩種方式均保留剪貼簿失敗時的手動複製。

分享模式不自動儲存角色修改，且停用再次分享與 JSON 匯入；可匯出 JSON 或 PDF 保存。「離開分享模式」經確認後移除分享資料、重新載入目前頁面並還原本機存檔。跑團模式隱藏／自訂動作及動作筆記屬於瀏覽器偏好，分享模式仍會保存，但不包含在角色 JSON 或分享網址中。

## 本機執行與架構

原生 HTML、CSS、JavaScript 靜態網站，不需前端框架或編譯。以靜態 HTTP 伺服器提供專案目錄，例如：

```powershell
python -m http.server 8000
```

開啟 `http://localhost:8000/`。多數功能也可直接開啟 HTML；PDF 匯出須透過 HTTP 載入素材。

| 入口 | 責任 |
| --- | --- |
| `index.html`、`styles.css` | 角色卡 DOM、依序載入全域模組、初始化、持久化、分享及主題；外觀規格見 [DESIGN.md](DESIGN.md) |
| `character-rules.js` | 共用角色計算與規則 |
| `class-features.js`、`race.js`、`backgrounds.js`、`feats.js`、`tool-data.js`、`monster.js`、`equipment-data.js`、`equipment-notes.js`、`spell-list.js`、`condition.js`、`deity-info.js` | 職業、種族、背景、專長、工具、野獸、裝備、法術、狀態及神祇資料 |
| `action-panel.js`、`spellbook.js`、`quick-build.js`、`onboarding-tour.js` | 動作選項、法術書、創角及導覽 |
| `adventure-journal.js` | 獨立冒險日誌、版本化 JSON、本機保存與匯入／匯出 |
| `search.js` | 法術全文／職業／環位搜尋、裝備搜尋與結果詳情；保留工具列與導覽使用的全域入口 |
| `tabletop-mode.js` | 跑團模式共用狀態與 `TabletopMode` API |
| `tabletop-actions.js`、`tabletop-druid.js`、`tabletop-spells.js`、`tabletop-resources.js` | 跑團模式動作、德魯伊形態／能力、施法及資源操作 |
| `dice-roller.js`、`app-dialog.js`、`scroll-to-top.js` | 擲骰與歷史、共用對話框、頁面捲動 |
| `legal-modal.js`、`legal-about.js` | 歡迎視窗與按需載入的 About 內容；`#legal-about-modal` 可直接開啟，使用主頁主題 |
| `ddals1.html`、`info-pages.css` | 官方免費冒險外部連結頁及獨立資訊頁樣式 |
| `pdf-export.js`、`pdf-field-map.js`、`pdf-lib.custom.min.js`、`fontkit.custom.min.js` | 按需載入的 PDF 匯出；部署需包含角色紙與字型素材 |
| `validate-*.js`、`build-offline-nopdf.ps1` | 系統級回歸；離線版本產製與成品驗證 |
| `cloudflare/twd20-url/` | 短網址 Worker，與網站分開部署；API、KV、限流與維護見 [Worker README](cloudflare/twd20-url/README.md) |

角色選擇由既有表單／DOM 提供；跑團模式模組共用 `TabletopMode`、`SpellCatalog`、`CharacterRules`、`DiceRoller`，儲存統一使用 `window.dndStorage`。非施法動作以穩定 key、分類、等級及角色選擇條件定義，沿用主要規則資料。

### 在類似專案整合搜尋

以 [search.js](search.js) 為搜尋實作入口，檔案開頭列出整合契約。沿用原生 `<script defer>`，放在 `equipment-data.js` 後載入並加上資源版本；法術來源仍是 `SpellCatalog`，裝備來源仍是結構化陣列及 `equipment-notes.js` 產生的說明 DOM。

另一個專案需同步核對 `index.html` 的法術／裝備搜尋表單與結果 DOM、`styles.css` 的搜尋與裝備詳情樣式，以及 `scroll-to-top.js` 的搜尋開關／切頁行為。搜尋本身不包含這些 UI 素材，也不接管角色保存。法術結果呼叫宿主的 `window.autoPrepareSpellFromFeature(spellId, trigger)`；裝備購買沿用原說明區的購買連結。若宿主的 DOM 或詳情 API 不同，應在這些邊界調整串接。

`window.searchAllSpells()`、`window.clearSpellSearchResults()`、`window.applyEquipmentFilter()` 保留供工具列與導覽還原使用；索引與輔助函式封裝於檔案內。法術索引於載入時預建，裝備索引於首次搜尋建立，因此必須等裝備說明 DOM 就緒再開放搜尋。分享與 autosave 繼續排除 `spell-search`、`equipment-search`，不改變既有角色資料格式。

搜尋別名包含德魯伊的「小D／小德」、Warlock 的「邪術／邪術師／魔導／魔導師／魔導士」，並支援「奇械／奇械師」的全職業與指定環位查詢（例如「奇械法術」「奇械師法術」「奇械一環」）。Artificer 法術須由宿主 `SpellCatalog.getClassIds()` 回傳 `artificer`；本專案未加入該職業或法術資料，因此相關查詢會顯示空結果。

## 維護與驗證

從專案根目錄執行下列命令，依修改範圍選擇相關腳本即可。修改 JavaScript 時，另執行 `node --check <受影響檔案.js>`；只修改 Markdown 時，核對檔名、連結、命令與說明，不需執行功能驗證。

必要的永久 regression case 優先加入最接近的既有系統級 suite，不為單次修改、單一 bug 或 UI 細節另建 validator。小型、低風險、可逆修改優先使用既有 regression、build／check 命令或不提交的臨時驗證，臨時腳本須於收尾前清除。只有獨立、長期存在且容易回歸的子系統，並且既有 suite 無法合理承接時，才新增永久 suite；完整判斷原則見 [AGENTS.md](AGENTS.md#驗證條件)。

### 執行環境

使用 Node.js 20 以上。標示「瀏覽器」的腳本需要 Playwright 與 Chromium，會自行啟動及關閉本機伺服器，不需手動啟動網站。新環境可執行：

```powershell
npm ci
npx --no-install playwright install chromium
```

已有可用依賴與瀏覽器時不需重裝。瀏覽器腳本皆可用 `$env:DND_BROWSER_CHANNEL = "msedge"` 選用已安裝的 Edge；執行 `Remove-Item Env:DND_BROWSER_CHANNEL` 可恢復預設。使用環境提供的 Playwright 套件時，可設定 `NODE_PATH` 指向其 `node_modules`。

### 驗證腳本

| 執行命令 | 用途與檢查範圍 | 額外需求／限制 |
| --- | --- | --- |
| `node validate-ability-roll.js` | 屬性產生與共用擲骰：27 購點、去最低骰、結果分配、背景加值、備註、長按／鍵盤／觸控與取消、焦點、舊歷史相容性、自動儲存及擲骰版面 | 瀏覽器；完整執行包含購點與一般擲骰分項 |
| `node validate-action-metadata.js` | 非施法動作定義、角色卡／跑團模式動作、自訂與隱藏偏好、狀態／危害連動與專注中斷、危害檢定及分頁提示、專長來源雙向選擇／自動同步／固定來源灰階鎖定／資格警示與數值停用／自行管理增刪與新舊資料／分享還原、武器裝備互動（含主手2／盾牌／雙手衝突、AC、摘要、還原與 PDF 對應）、JSON／分享／自動儲存 | 瀏覽器；PDF 檢查欄位資料及資格提醒後繼續輸出（匯出函式使用替身） |
| `node validate-onboarding.js` | 新手／跑團模式導覽（含第 3 步自動開啟選單、雙高亮與按鈕點擊、法術與資源教學預覽、減少動態效果）、創角小幫手匯入、觸控、取消、資料與焦點保留、PDF 載入及取消流程 | 瀏覽器；PDF 繪製以替身驗證，未測實際成品 |
| `node validate-spellbook.js` | 法術書（含法師六個推薦法術的專屬寫入入口）、準備數量、清空已準備／固定來源保留、書內儀式、創角匯入、PDF 法術書選項、JSON／分享／自動儲存及版面 | 瀏覽器 |
| `node validate-spell-search.js` | 法術全文搜尋、職業全名／別名與指定環位、排序、空結果／清空、鍵盤、窄螢幕與詳情／焦點保留；含 Artificer 無資料與模擬資料案例，以及裝備索引、詳情／規則關鍵字說明／購買取消、四種工具熟練列的查看按鈕、切頁及導覽還原 | 瀏覽器；可加 `--equipment-only` 僅驗證裝備搜尋與工具查看，含桌機／窄螢幕、說明開關及焦點還原；同時檢查 `search.js` 與主頁內嵌 JavaScript 語法 |
| `node validate-tabletop-druid.js` | 荒野形態、野獸攻擊、德魯伊資源、持續法術效果（含一般／野獸 AC 與速度）、專注、儲存與版面 | 瀏覽器 |
| `node validate-tabletop-rest.js` | 短休／長休、休息後選項同步與還原、生命骰（含擲骰關閉時的單顆／連續回血）、職業與種族資源恢復、最佳旅伴、可選恢復、取消與自動儲存 | 瀏覽器 |
| `node validate-tabletop-spellcasting.js` | 法術 metadata、施法條件、法術位、專注與自動擲骰 | 純 Node.js；以 `spell-id-baseline.json` 比對既有法術 ID |
| `node validate-ui.js` | 共用 UI：四種外觀／保存／素材、工具選單與技能版面、跑團模式／創角 UI、Legal／About 載入與焦點、AppDialog toast 堆疊／倒數／關閉／觸控滑除，以及 PDF 欄位與匯出 | 瀏覽器；完整執行會實際匯出並重新讀取可編輯 PDF，需專案 PDF 與字型素材 |

`validate-ability-roll.js` 可加 `--point-buy-only` 只驗證 27 購點未用滿時的提醒、確認、套用與還原，或加 `--dice-only` 只跑一般擲骰備註、取消與歷史相容性。`validate-onboarding.js` 可加 `--imports-only` 只跑匯入與 PDF 生命週期，或加 `--touch-only` 只跑觸控流程；不加參數才是完整驗證。

`validate-ui.js` 內部分項共用同一個瀏覽器／伺服器生命週期，案例以獨立 context 隔離資料。不加參數執行全部，或擇一使用 `--appearance-only`（四種外觀、Legal／About 主題與焦點、保存及共用版面）、`--dialogs-only`（toast、About 載入重試／網址定位，以及角色能力頁籤視窗的創角／表格顯示移位、頁籤條件、選項保存、子視窗、法術／技能／動物參考浮層、焦點與補填入口）、`--pdf-only`（欄位及實際匯出）、`--pdf-fields-only`（僅盾牌受訓及精靈／魔人血統提示欄位，不需 PDF／字型素材）。局部內容或互動依實際影響選分項或最小必要流程，不因共用 UI 檔案改動而連帶跑完整矩陣。

有意新增、移除或更名法術 ID 時，須同步檢查並更新 `spell-id-baseline.json`。

需要檢查視覺版面時，部分腳本可透過下列環境變數輸出截圖；一般驗證不需設定。請先建立輸出目錄，避免將截圖加入版本控制。

| 腳本 | 截圖目錄環境變數 |
| --- | --- |
| `validate-ability-roll.js` | `DND_ABILITY_SCREENSHOT_DIR` |
| `validate-action-metadata.js`、`validate-tabletop-druid.js` | `DND_SCREENSHOT_DIR` |
| `validate-onboarding.js` | `DND_ONBOARDING_SCREENSHOT_DIR` |
| `validate-spellbook.js` | `DND_SPELLBOOK_SCREENSHOTS` |
| `validate-ui.js` | `DND_UI_SCREENSHOT_DIR` |

完整變更與驗證條件見 [AGENTS.md](AGENTS.md)。臨時瀏覽器檢查沿用 [Playwright CLI skill](.agents/skills/playwright-cli/SKILL.md) 與 `npx --no-install playwright cli`。

## 離線版本

`TWD20-offline.html` 是衍生的單檔精簡版，內嵌本機 CSS、JavaScript、圖片與 About 模組，不包含 PDF 匯出。建置需 PowerShell 與 Node.js 20 以上；只有需要同步或驗證成品時才執行：

```powershell
.\build-offline-nopdf.ps1
```

建置腳本會自動執行 offline build verification：檢查產物 inline JavaScript 語法、排除短網址 API、六種本機 URL 形式下的永久分享、剪貼簿失敗 fallback、分享模式限制，以及取消／確認離開流程；任一檢查失敗即回報建置失敗。這是建置後的成品驗證，不另列為產品 regression suite。URL 與瀏覽器 API 使用 Node.js 模擬，不能取代手機檔案權限或本機儲存的實機驗證。

先修改來源檔，不直接修改成品；一般來源變更不會自動更新離線版。離線分享在本機編碼，產生 `https://twd20.com/#s2=...`（相容 `#s=...`）永久網址，不含本機路徑，也不呼叫短網址服務；接收者需連網，完全離線交換請使用 JSON。

離線分享模式保留讀取與離開流程。JavaScript、本機儲存及重新載入能否運作，取決於瀏覽器／檔案 App；手機預覽與 `content://` 權限不等同完整瀏覽器，尚不能視為所有平台皆已實機驗證。

## 授權、素材與法律聲明

本專案有權授權的原始程式碼採 [MIT License](LICENSE)，使用與散布時須保留其著作權及授權聲明；第三方內容仍依各自原始條件處理，不因本專案而改授權為 MIT。

規則內容改編自 [SRD 5.2.1](https://www.dndbeyond.com/srd)，採 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode)，經翻譯、縮寫、整理與重新呈現。摘要不取代完整規則；更高等級、其他角色選項或規則疑義，請查正式來源並依實際團務裁定。

使用素材：

- [ambientCG Paper 002](https://ambientcg.com/view?id=Paper002)（[CC0](https://docs.ambientcg.com/license/)）
- [Noto Sans TC](https://fonts.google.com/noto/specimen/Noto+Sans+TC)、[Source Han Serif](https://github.com/adobe-fonts/source-han-serif)
- [SRD 中文角色紙](https://tinyurl.com/srd5etw)，排版：[赤赤@AkaA](https://x.com/AkaAAkaAka)；[無表格 PDF／原 PNG](https://drive.google.com/drive/folders/1brrzdbRcxMvxHcYYjyzs2N_8aPaQewW6?usp=sharing)
- [pdf-lib](https://github.com/Hopding/pdf-lib)、[fontkit](https://github.com/Hopding/fontkit)

大部分程式碼與文字由生成式 AI 協助產生、整理或除錯，再由作者選擇、測試與整合；MIT 授權僅限作者依法有權授予的範圍，不涵蓋第三方權利或另有授權的內容。

twD20 是獨立第三方相容工具，並非 Wizards of the Coast LLC 製作、贊助、認可或授權的官方產品；所提及名稱與商標屬各自權利人。本工具依現況（AS IS）提供，不保證規則、翻譯、計算或功能完全正確；重製、改編、散布或商用時，請確認適用法律、平台規範及第三方授權。

### SRD Attribution

This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

## 聯絡與參與

Email：[tsai.reggie428@gmail.com](mailto:tsai.reggie428@gmail.com) · 巴哈姆特站內信：`reggietsai`

歡迎回報問題、fork 調整、分享網站或加上 Star。

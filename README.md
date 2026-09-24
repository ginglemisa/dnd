# twD20｜5.5 版手機角卡

twD20 是 Reggie Tsai / 瑞基製作的手機創角工具，協助新手、DM 與教學活動快速建立 1～8 級角色、查閱摘要並開始遊戲。適用於體驗場、推廣活動及收費團；預設現場有主持人協助說明規則。

[正式網站](https://twd20.com) · [Legal & About](https://twd20.com/#legal-about-modal) · [GitHub](https://github.com/ginglemisa/dnd)

## 功能

- **創角與角色卡**：數值、技能、裝備、動作、法術；支援 27 點購買、屬性擲骰、職業範本、自動計算、創角小幫手及新手導覽。
- **跑團模式操作**：HP、臨時 HP、狀態、死亡豁免、專注、武器攻擊、法術位與職業資源；可隱藏或自訂行動，管理法術書與儀式施法。
- **紀錄與輸出**：本機自動儲存、JSON 匯入／匯出、分享網址、QR Code、PDF 角色卡及單檔離線版；可選用擲骰與歷史紀錄。
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
| `tabletop-mode.js` | 跑團模式共用狀態與 `TabletopMode` API |
| `tabletop-actions.js`、`tabletop-druid.js`、`tabletop-spells.js`、`tabletop-resources.js` | 跑團模式動作、德魯伊形態／能力、施法及資源操作 |
| `dice-roller.js`、`app-dialog.js`、`scroll-to-top.js` | 擲骰與歷史、共用對話框、頁面捲動 |
| `legal-modal.js`、`legal-about.js` | 歡迎視窗與按需載入的 About 內容；`#legal-about-modal` 可直接開啟，使用主頁主題 |
| `ddals1.html`、`info-pages.css` | 官方免費冒險外部連結頁及獨立資訊頁樣式 |
| `pdf-export.js`、`pdf-field-map.js`、`pdf-lib.custom.min.js`、`fontkit.custom.min.js` | 按需載入的 PDF 匯出；部署需包含角色紙與字型素材 |
| `validate-*.js`、`build-offline-nopdf.ps1` | 回歸驗證與離線版本產製 |
| `cloudflare/twd20-url/` | 短網址 Worker，與網站分開部署；API、KV、限流與維護見 [Worker README](cloudflare/twd20-url/README.md) |

角色選擇由既有表單／DOM 提供；跑團模式模組共用 `TabletopMode`、`SpellCatalog`、`CharacterRules`、`DiceRoller`，儲存統一使用 `window.dndStorage`。非施法動作以穩定 key、分類、等級及角色選擇條件定義，沿用主要規則資料。

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
| `node validate-action-metadata.js` | 非施法動作定義、角色卡／跑團模式動作、自訂與隱藏偏好、手動副武器、JSON／分享／自動儲存 | 瀏覽器 |
| `node validate-app-dialog-toast.js` | 共用提示最多三則、顯示順序、獨立倒數、關閉按鈕及左右觸控滑除 | 瀏覽器 |
| `node validate-dice-roll-notes.js` | 擲骰備註、長按與 Shift+Enter、取消、觸控、焦點及舊歷史格式相容性 | 瀏覽器 |
| `node validate-main2-shield.js` | 主手2 搭配盾牌、雙手武器衝突確認、AC、裝備摘要、狀態還原與 PDF 欄位 | 瀏覽器；固定使用 Playwright Chromium |
| `node validate-offline-sharing.js` | 離線成品的 inline 語法、永久分享網址、禁止短網址 API、複製 fallback、分享模式與離開流程 | 純 Node.js；須先產生 `TWD20-offline.html`，見[離線版本](#離線版本)。使用 URL 模擬，不代表手機檔案權限或儲存已通過實機驗證 |
| `node validate-onboarding.js` | 新手／跑團模式導覽（含第 3 步自動開啟選單、雙高亮與按鈕點擊、法術與資源教學預覽、減少動態效果）、創角小幫手匯入、觸控、取消、資料與焦點保留、PDF 載入及取消流程 | 瀏覽器；PDF 繪製以替身驗證，未測實際成品 |
| `node validate-pdf-lineage-recovery.js` | 精靈與魔人於不同等級的 PDF 血統環法恢復提示 | 純 Node.js；只檢查欄位資料 |
| `node validate-spellbook.js` | 法術書、準備數量、書內儀式、創角匯入、PDF 法術書選項、JSON／分享／自動儲存及版面 | 瀏覽器 |
| `node validate-tabletop-druid.js` | 荒野形態、野獸攻擊、德魯伊資源、持續法術效果（含一般／野獸 AC 與速度）、專注、儲存與版面 | 瀏覽器 |
| `node validate-tabletop-rest.js` | 短休／長休、生命骰、職業與種族資源恢復、最佳旅伴、可選恢復、取消與自動儲存 | 瀏覽器 |
| `node validate-tabletop-spellcasting.js` | 法術 metadata、施法條件、法術位、專注與自動擲骰 | 純 Node.js；以 `spell-id-baseline.json` 比對既有法術 ID |
| `node validate-ui-themes.js` | 四種外觀、About 載入／重試／定位與焦點、偏好保存、技能版面、主題素材、跑團模式／創角 UI，以及 PDF 盾牌受訓與血統提示 | 瀏覽器；會實際匯出並重新讀取可編輯 PDF，需專案 PDF 與字型素材 |

`validate-ability-roll.js` 可加 `--point-buy-only` 只驗證 27 購點未用滿時的提醒、確認、套用與還原。`validate-onboarding.js` 可加 `--imports-only` 只跑匯入與 PDF 生命週期，或加 `--touch-only` 只跑觸控流程；不加參數才是完整驗證。PDF 血統提示的小範圍修改可先用 `validate-pdf-lineage-recovery.js`，涉及實際匯出時再用 `validate-ui-themes.js`。

有意新增、移除或更名法術 ID 時，須同步檢查並更新 `spell-id-baseline.json`。

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

`TWD20-offline.html` 是衍生的單檔精簡版，內嵌本機 CSS、JavaScript、圖片與 About 模組，不包含 PDF 匯出。只有需要同步成品時才執行：

```powershell
.\build-offline-nopdf.ps1
node validate-offline-sharing.js
```

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

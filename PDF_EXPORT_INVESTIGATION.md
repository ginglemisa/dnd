# PDF 匯出調查（平面 PDF vs 表單 PDF）

> 日期：2026-04-14
> 範圍：僅做差異檢查與問題定位，不實作新修正。

## 1) 兩個按鈕在程式流程的實際差異

在 `exportCharacterPdfFromState(state, { mode })` 中，兩個模式的差異是：

1. `mode === "flat"`
   - `shouldFlatten = true`
   - 字型嵌入使用 `subset: true`
   - 會執行 `form.flatten({ updateFieldAppearances: false })`
   - 儲存時 `updateFieldAppearances: false`
   - 儲存時 `useObjectStreams: false`

2. `mode === "form"`
   - `shouldFlatten = false`
   - 字型嵌入使用 `subset: false`
   - 不會 flatten
   - 會執行 `normalizeProblematicFieldDA(...)`
   - 儲存時 `updateFieldAppearances: rebuilt`
   - 儲存時 `useObjectStreams: true`

## 2) 先輸出平面 PDF，再檢查輸出檔案

我用 `pdf-lib.min.js + fontkit.umd.min.js` 在本機腳本重現匯出流程，生成：

- `/tmp/form-sample.pdf`
- `/tmp/flat-sample.pdf`

結果：

- form：`6540656 bytes`，欄位數 `411`
- flat：`2290920 bytes`，欄位數 `0`

表示 flatten 本身有發生，且 pdf-lib 可以重新載入平面檔（結構上不是完全損毀）。

## 3) 目前可觀察到的平面 PDF 具體異常點

### A. 平面檔仍保留 AcroForm，且 DA 是 `/Helv 0 Tf 0 g`

在 `/tmp/flat-sample.pdf` 可以看到：

- AcroForm 存在（但 `Fields` 為空陣列）
- `DA` 為 `(/Helv 0 Tf 0 g )`，字級為 `0`

這代表 flatten 後雖然沒有可編輯欄位，但文件根物件還留著一個「字級為 0 的預設外觀設定」。

### B. 平面檔內有多個 Noto 字型資源別名

平面檔的 AcroForm `/DR /Font` 中可見多組 Noto 相關別名（例如 `/Noto`, `/NotoS`, `/NotoSn` ...）。

這本身不一定錯，但顯示匯出後資源結構較複雜，且與「flatten 之後理應不再依賴表單外觀」的預期不完全一致。

## 4) 對「平面字體異常 + Adobe Reader 開檔失敗」的定位結論（先不修）

目前最具體、可重現的可疑點是：

1. **flatten 後仍保留 AcroForm root，且 DA 為 `Helv 0 Tf`（字級 0）**。
2. **平面檔內仍殘留一組表單字型資源字典（多重 Noto 別名）**。

這兩點在一般 PDF 引擎可能被忽略，但 Adobe Reader 解析較嚴格時，可能觸發相容性問題（尤其與 CJK 字型外觀一起出現時）。

> 注意：在目前環境中無法直接跑 Adobe Reader，因此上述是基於輸出 PDF 結構檢查的具體定位，不是 Adobe 內部錯誤碼的最終驗證。

## 5) 前一版兩個修正各自是在做什麼

1. **把 `normalizeProblematicFieldDA` 限縮到 form 模式**
   - 目的：避免 flat 模式在 flatten 前再改 DA，降低對平面輸出的副作用。

2. **flat 模式儲存改為 `useObjectStreams: false`**
   - 目的：輸出傳統 PDF 物件格式，避免某些 Reader 對 object stream 的相容性差異。

這兩項是「降低風險」的相容性調整，但從本次檢查看來，仍不足以完全消除平面檔的結構可疑點（尤其是 AcroForm/DA 殘留）。

# 美觀易讀版 PDF 字型

第三方角色卡「美觀易讀版」PDF 使用 `fonts/twD20SerifTC-Bold.otf`。它是 Adobe 思源宋體繁中 Bold 的子集：

- 只留 Big5 全部字元（常用與次常用字），加上 ASCII、Latin-1、一般標點、中日文符號與假名、全形字元，以及網站內容與程式用到的字（例如 Big5 沒有的「獁」「−」）。
- 拿掉日、韓、簡體、香港等語言的地區異體字形。PDF 產生器不指定語言，本來就不會用到它們，所以排出來的字形與位置和原字型相同。
- 思源宋體採 [SIL Open Font License 1.1](https://openfontlicense.org/)，並保留了「Source」這個名稱，修改後的字型不得沿用，所以改名為 twD20 Serif TC。著作權與授權說明仍保留在字型的名稱表裡。

不在字型裡的字（簡體字、韓文、Big5 以外的罕用字）在 PDF 上會顯示成空白方框。網站內容用到的字由 `node validate-ui.js --pdf-only` 檢查；內容檔加了字型沒有的字，測試會失敗，這時重新產生字型。

## 重新產生

需要 Python 3 與 [fontTools](https://github.com/fonttools/fonttools)（`pip install fonttools`，只有產生字型時用，網站與測試不需要）。

1. 從 [adobe-fonts/source-han-serif](https://github.com/adobe-fonts/source-han-serif) 的 release 取得 `OTF/TraditionalChinese/SourceHanSerifTC-Bold.otf`（目前用的是 2.003 版）。
2. 執行：

```bash
python tools/pdf-font/subset-serif.py <SourceHanSerifTC-Bold.otf 路徑>
```

結果寫到 `fonts/twD20SerifTC-Bold.otf`，同一個來源重複執行結果相同。產生後執行 `npm run build`，再執行 `node validate-ui.js --pdf-only`。

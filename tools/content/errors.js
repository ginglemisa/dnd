// 內容檔建置的錯誤：內容檔格式、跨檔檢查或持久化 ID 基準檔有問題時丟出，建置列出訊息並以結束碼 1 結束。
"use strict";

class ContentError extends Error {}

module.exports = { ContentError };

// 法術書推薦（法師施法）：sheet-spells.js 只對 #classFeatures [data-wizard-spellbook-recommendations] 內的推薦法術
// 提供「寫入法術書」，validate-spellbook.js 也依此標記檢查。內容檔只寫文字，這裡把「**法術書：**」清單項目
// 「推薦：」之後、句號之前的法術名稱包成舊版標記；找不到時報錯，避免內容改字後靜默失去功能。
"use strict";
const { ContentError } = require("../markdown");

const RECOMMENDATIONS = /(<li><strong>法術書：<\/strong>(?:(?!<\/li>).)*?<br>推薦：)([^<]+?)(。<\/li>)/;

module.exports = {
  // 能力 text 的 HTML → 加上推薦標記。
  decorateText(html, where) {
    if (!RECOMMENDATIONS.test(html)) throw new ContentError(`${where}：behaviors/wizard-spellbook-recommendations.js 找不到「**法術書：**…推薦：…。」清單項目`);
    return html.replace(RECOMMENDATIONS, (all, before, names, after) => `${before}<span data-wizard-spellbook-recommendations>${names}</span>${after}`);
  }
};

// 大地結社地貌（德魯伊大地子職）：class-features-ui.js 以 #classFeatures section[data-druid-land-choice] 找到地貌選擇
// 所屬的能力（缺項檢查、跳轉與高亮）；地貌下拉 #druid-land 在 index.html。轉換期在能力 section 上輸出相同的標記。
"use strict";

module.exports = {
  // 加在能力 <section> 開頭標籤上的屬性。
  sectionAttributes: () => "data-druid-land-choice"
};

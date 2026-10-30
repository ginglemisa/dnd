// 魔法發現（吟遊詩人逸聞子職）：spell-sources.js 依 #bard-magical-discoveries 插入法術選擇控制項，
// class-features-ui.js 以同一 id 做缺項檢查與跳轉。轉換期輸出與舊版 class-features.js 相同的空白容器。
"use strict";

module.exports = {
  // 接在能力內文（與選項）之後的 HTML。
  afterText: () => `<div id="bard-magical-discoveries" class="bard-magical-discoveries" aria-label="魔法發現法術選擇"></div>`
};

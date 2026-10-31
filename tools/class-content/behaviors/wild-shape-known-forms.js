// 荒野形態的「已知形態」（德魯伊）：styles.css 依 wild-shape-known-forms 系列 class 排版（推薦框、規則清單、野獸清單），
// 「查看其他動物」的野獸清單是另外整理的參考資料，不寫進內容檔：讀取 druid-wild-shape-beasts.js 的
// DRUID_WILD_SHAPE_BEASTS／DRUID_WILD_SHAPE_CR_ORDER，照舊版範本產生。
// 內容檔把「已知形態」寫成一般小節（說明段落、推薦段落、規則清單），這裡改回舊版的 <section> 標記並接上野獸清單；
// 緊接其後的小節（變形規則）加上 druid-rule-subsection--transformation（與已知形態區塊之間的分隔樣式）。
// 找不到這段結構時報錯，避免內容改寫後靜默失去排版或野獸清單。
"use strict";
const { ContentError, escapeHtml } = require("../markdown");
const { loadLegacyArray } = require("../legacy");

const KNOWN_FORMS = /<div class="class-rule-subsection druid-rule-subsection"><h4>已知形態<\/h4><p>((?:(?!<\/p>).)*)<\/p><p>((?:(?!<\/p>).)*)<\/p><ul class="class-rule-list">((?:(?!<\/ul>).)*)<\/ul><\/div><div class="class-rule-subsection druid-rule-subsection">/s;

// 與舊版 class-features.js 的 DRUID_WILD_SHAPE_BEAST_LIST_HTML 相同的範本（含排版空白）。
function beastListHtml() {
  const beasts = loadLegacyArray("druid-wild-shape-beasts.js", "DRUID_WILD_SHAPE_BEASTS");
  const crOrder = loadLegacyArray("druid-wild-shape-beasts.js", "DRUID_WILD_SHAPE_CR_ORDER");
  return `<details class="wild-shape-beast-disclosure">
  <summary>
    <span class="wild-shape-beast-disclosure__show">查看其他動物</span>
    <span class="wild-shape-beast-disclosure__hide">收起其他動物</span>
  </summary>
  <div class="wild-shape-beast-groups">
    ${crOrder.map((cr) => {
      const group = beasts.filter((beast) => beast.cr === cr);
      return `<section class="wild-shape-beast-group" aria-labelledby="wild-shape-cr-${cr.replace("/", "-")}">
        <h4 id="wild-shape-cr-${cr.replace("/", "-")}">CR ${cr}</h4>
        <div class="wild-shape-beast-grid">${group.map(({ key, label, hasFlight }) => `<span class="beast-tip" data-beast="${escapeHtml(key)}">${escapeHtml(label)}${hasFlight ? "（飛行；8 級+）" : ""}</span>`).join("")}</div>
      </section>`;
    }).join("")}
  </div>
</details>`;
}

module.exports = {
  // 能力 text 的 HTML → 已知形態區塊改回舊版標記並接上野獸清單。
  decorateText(html, where) {
    if (!KNOWN_FORMS.test(html)) throw new ContentError(`${where}：behaviors/wild-shape-known-forms.js 找不到「#### 已知形態」小節（說明段落、推薦段落、規則清單）與緊接其後的小節`);
    return html.replace(KNOWN_FORMS, (all, intro, recommendation, rules) => '<section class="wild-shape-known-forms" aria-labelledby="wild-shape-known-forms-heading" data-tabletop-hide>'
      + '<h4 id="wild-shape-known-forms-heading">已知形態</h4>'
      + `<p class="wild-shape-known-forms__intro">${intro}</p>`
      + `<p class="wild-shape-known-forms__recommendation">${recommendation}</p>`
      + `<ul class="wild-shape-known-forms__rules">${rules}</ul>`
      + `${beastListHtml()}</section>`
      + '<div class="class-rule-subsection druid-rule-subsection druid-rule-subsection--transformation">');
  }
};

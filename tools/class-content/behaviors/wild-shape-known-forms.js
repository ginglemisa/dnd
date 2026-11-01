// 荒野形態的「已知形態」（德魯伊）：styles.css 依 wild-shape-known-forms 系列 class 排版（推薦框、規則清單、野獸清單），
// 「查看其他動物」的野獸清單是另外整理的參考資料，不寫進內容檔：讀取 druid-wild-shape-beasts.js 的
// DRUID_WILD_SHAPE_BEASTS／DRUID_WILD_SHAPE_CR_ORDER，照舊版範本產生。
// 內容檔把小節標題寫成「#### 已知形態 {#wild-shape-known-forms}」，小節內為說明段落、推薦段落、規則清單；
// 這裡依解析好的區塊輸出舊版的 <section> 標記並接上野獸清單，緊接其後的小節（變形規則）加上
// druid-rule-subsection--transformation（與已知形態區塊之間的分隔樣式）。區塊不符時報錯。
"use strict";
const { ContentError, escapeHtml } = require("../markdown");
const { loadWildShapeBeasts } = require("../legacy");

// 與舊版 class-features.js 的 DRUID_WILD_SHAPE_BEAST_LIST_HTML 相同的範本（含排版空白）。
function beastListHtml() {
  const { beasts, crOrder } = loadWildShapeBeasts();
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
  // 「#### 已知形態 {#wild-shape-known-forms}」小節 → 已知形態區塊；跑團版（view）不含已知形態區塊，下一個小節照一般小節輸出。
  renderSubsection(blocks, { heading, inner, view, where }) {
    if (blocks.map(block => block.type).join() !== "p,p,ul") throw new ContentError(`${where}：「#### ${heading} {#wild-shape-known-forms}」小節須依序為說明段落、推薦段落、規則清單`);
    if (view) return { html: "" };
    const [intro, recommendation, rules] = blocks.map(inner);
    return {
      html: '<section class="wild-shape-known-forms" aria-labelledby="wild-shape-known-forms-heading">'
        + `<h4 id="wild-shape-known-forms-heading">${escapeHtml(heading)}</h4>`
        + `<p class="wild-shape-known-forms__intro">${intro}</p>`
        + `<p class="wild-shape-known-forms__recommendation">${recommendation}</p>`
        + `<ul class="wild-shape-known-forms__rules">${rules}</ul>`
        + `${beastListHtml()}</section>`,
      nextSubsectionClass: "druid-rule-subsection--transformation"
    };
  }
};

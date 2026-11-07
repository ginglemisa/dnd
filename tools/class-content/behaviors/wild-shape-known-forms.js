// 荒野形態的「已知形態」（德魯伊）：styles.css 依 wild-shape-known-forms 系列 class 排版（推薦框、規則清單、野獸清單），
// 「查看其他動物」的野獸清單是另外整理的參考資料，不寫進內容檔：讀取 druid-wild-shape-beasts.js 的
// DRUID_WILD_SHAPE_BEASTS／DRUID_WILD_SHAPE_CR_ORDER，照舊版範本產生。
// 內容檔把小節標題寫成「#### 已知形態 {#wild-shape-known-forms}」，小節內為說明段落、推薦段落、規則清單；
// 這裡依解析好的區塊輸出舊版的 <section> 標記並接上野獸清單，緊接其後的小節（變形規則）加上
// druid-rule-subsection--transformation（與已知形態區塊之間的分隔樣式）。區塊不符時報錯。
"use strict";
const { ContentError } = require("../../content/errors");
const { escapeHtml } = require("../../content/markdown");
const { loadWildShapeBeasts, loadReferenceOnlyBeasts } = require("../../content/site-sources");

// CR 2 以上、只供查閱的野獸：「查看其他動物」清單下方的第二層小字收合，註明無法用荒野形態變身（跑團模式不顯示）。
function referenceBeastsHtml() {
  const { beasts, crOrder } = loadReferenceOnlyBeasts();
  if (!beasts.length) return "";
  return `
  <details class="wild-shape-reference-beasts">
    <summary>其他野獸（只供查閱）</summary>
    <p class="wild-shape-reference-beasts__note">以下野獸目前<strong>無法用荒野形態變身</strong>，只提供資料查閱；跑團模式不會列出。</p>
    <div class="wild-shape-beast-groups">
      ${crOrder.map(cr => `<section class="wild-shape-beast-group" aria-labelledby="wild-shape-reference-cr-${cr}">
        <h4 id="wild-shape-reference-cr-${cr}">CR ${cr}</h4>
        <div class="wild-shape-beast-grid">${beasts.filter(beast => beast.cr === cr).map(({ key, label }) => `<span class="beast-tip" data-beast="${escapeHtml(key)}">${escapeHtml(label)}</span>`).join("")}</div>
      </section>`).join("")}
    </div>
  </details>`;
}

// 與舊版 class-features.js 的 DRUID_WILD_SHAPE_BEAST_LIST_HTML 相同的範本（含排版空白），清單之後接只供查閱的野獸。
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
  </div>${referenceBeastsHtml()}
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

// 網站讀取的專長資料：npm run build 由 content/srd/feats 產生根目錄的 feat-content.generated.js（衍生產物，不提交）。
// featRules 是結構化規則（網站以此判斷類別、資格、可否重複與跑團動作），featText 是建置組好的顯示文字。
// 選單的類別與來源字樣、副標的先決條件文字都由規則產生；來源標籤與說明取自 character-rules.js。
// index.html 載入此檔的快取版本（?v=）是檔案內容的雜湊，只在上線建置（--stamp-version）時改寫。
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { ROOT, contentSourceLabel, contentSourceName, contentSourceNotice } = require("../content/site-sources");
const { ContentError } = require("../content/errors");
const { renderInline } = require("../content/markdown");
const { writeIfChanged, contentVersion, stampScriptVersion } = require("../content/output");
const { actionEffectNames } = require("./load");

const OUTPUT_NAME = "feat-content.generated.js";
const OUTPUT_FILE = path.join(ROOT, OUTPUT_NAME);
const INDEX_FILE = path.join(ROOT, "index.html");
const ABILITY_LABELS = Object.freeze({ str: "力量", dex: "敏捷", con: "體質", int: "智力", wis: "感知", cha: "魅力" });
// 類別：選單與 PDF 的簡稱、說明副標的全名。
const TYPE_LABELS = Object.freeze({
  origin: { short: "起源", full: "起源專長" },
  general: { short: "通用", full: "通用專長" },
  style: { short: "戰鬥風格", full: "戰鬥風格專長" }
});

function featRules(feat) {
  return {
    type: feat.type,
    source: feat.source,
    ...(feat.repeatable ? { repeatable: true } : {}),
    ...(feat.prerequisite?.abilities ? { abilities: [...feat.prerequisite.abilities] } : {}),
    ...(feat.prerequisite?.heavyArmor ? { heavyArmor: true } : {}),
    ...(feat.prerequisite?.spellcasting ? { spellcasting: true } : {}),
    ...(feat.grantsSpellcasting ? { grantsSpellcasting: true } : {}),
    actions: (feat.actions || []).map(action => ({
      key: action.key,
      mode: action.mode,
      label: action.label,
      level: action.level || 1,
      ...(action.proficiencyValue ? { proficiencyValue: true } : {})
    }))
  };
}

// 副標的先決條件：通用專長為「4 級以上」加 prerequisite；戰鬥風格專長須有職業特性。
function prerequisiteText(feat) {
  if (feat.type === "style") return "需具備職業特性「戰鬥風格」";
  if (feat.type !== "general") return "";
  const prerequisite = feat.prerequisite || {};
  const condition = prerequisite.abilities ? `${prerequisite.abilities.map(id => ABILITY_LABELS[id]).join("或")} 13+`
    : prerequisite.heavyArmor ? "具重甲訓練"
      : prerequisite.spellcasting ? "具施法或契約魔法能力" : "";
  return ["4 級以上", condition].filter(Boolean).join("；");
}

const escapeHtml = text => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const inline = (text, where) => renderInline(text, { resolveValue: () => { throw new ContentError(`${where}：專長文字不可使用數值標記`); } }, where);
const plain = text => text.replace(/\[\[([^\]]+)\]\]/g, "$1");
// 效果的純文字（跑團動作說明、快速創角草稿）：內容、「·」清單、空一行的補充段落。
const effectPlain = effect => plain(`${effect.text}${(effect.list || []).map(item => `\n·${item}`).join("")}${effect.after ? `\n\n${effect.after}` : ""}`);

function featText(feat) {
  const where = feat.file;
  const type = TYPE_LABELS[feat.type];
  const sourceLabel = contentSourceLabel(feat.source);
  const notice = contentSourceNotice(feat.source);
  const prerequisite = prerequisiteText(feat);
  const subtitle = `${type.full}${sourceLabel ? `・${sourceLabel}` : ""}${prerequisite ? `（${prerequisite}）` : ""}`;
  const spacer = `<div class="feat-desc-spacer"></div>`;
  // 說明 HTML：標題、副標，內文每個效果前空一段；提示框輸出為 span（網站顯示時換成說明按鈕，見 feat-ui.js）。
  const body = feat.effects.map((effect, index) => {
    const at = `${where} effects[${index}]`;
    return spacer + `<div><strong>${escapeHtml(effect.name)}</strong>：${inline(effect.text, at)}</div>`
      + (effect.list || []).map(item => `<div>${inline(`·${item}`, at)}</div>`).join("")
      + (effect.after ? spacer + `<div>${inline(effect.after, at)}</div>` : "");
  }).join("") + (notice ? spacer + `<div class="feat-expansion-notice">${escapeHtml(notice)}</div>` : "");
  const effects = new Map(feat.effects.map(effect => [effect.name, effect]));
  return {
    label: contentSourceName(feat.id, feat.source, [type.short]),
    html: `<div class="feat-desc-title">${escapeHtml(feat.id)}</div><div class="feat-desc-subtitle">${escapeHtml(subtitle)}</div><div class="feat-desc-body">${body}</div>`,
    plain: [feat.id, subtitle, "", feat.effects.map(effect => `${effect.name}：${effectPlain(effect)}`).join("\n\n"), ...(notice ? ["", notice] : [])].join("\n"),
    // PDF 不列來源標籤。
    pdf: feat.pdf ? [...feat.pdf] : [contentSourceName(feat.id, "", [type.short])],
    actions: Object.fromEntries((feat.actions || []).map(action => [action.key, action.tabletop || actionEffectNames(action).map(name => effectPlain(effects.get(name))).join(" ")]))
  };
}

function renderFeatData(feats) {
  const ids = [...feats.keys()];
  const rules = Object.fromEntries(ids.map(id => [id, featRules(feats.get(id))]));
  const text = Object.fromEntries(ids.map(id => [id, featText(feats.get(id))]));
  const entries = map => ids.map(id => `  ${JSON.stringify(id)}: ${JSON.stringify(map[id])}`).join(",\n");
  const source = `// ${OUTPUT_NAME}：由 npm run build 從 content/srd/feats 的專長內容檔產生，請勿手動修改。
// featRules：各專長的結構化規則（類別、來源、可否重複、先決條件、跑團動作的 key／分頁／名稱／等級），依專長選單順序。
// featText：建置組好的顯示文字（label 選單文字、html 說明、plain 純文字說明、pdf PDF 專長欄各行、actions 跑團動作說明）。
const featRules = {
${entries(rules)}
};

const featText = {
${entries(text)}
};
`;
  // 確認產生的程式執行結果與資料相同。
  const context = {};
  vm.runInNewContext(`${source}\nthis.result = { featRules, featText };`, context);
  if (JSON.stringify(context.result) !== JSON.stringify({ featRules: rules, featText: text })) throw new ContentError(`${OUTPUT_NAME}：產生結果與資料不同`);
  return source;
}

// 寫入產生檔；stampIndex 為 true 時一併更新 index.html 的快取版本。內容沒變時不改檔案。回傳有變更的檔名。
function writeFeatData(feats, { stampIndex = false } = {}) {
  const source = renderFeatData(feats);
  const changed = [];
  const html = fs.readFileSync(INDEX_FILE, "utf8");
  const updated = stampScriptVersion(html, OUTPUT_NAME, contentVersion(source));
  writeIfChanged(OUTPUT_FILE, source, changed);
  if (stampIndex && updated !== html) {
    fs.writeFileSync(INDEX_FILE, updated);
    changed.push("index.html");
  }
  return changed;
}

module.exports = { renderFeatData, writeFeatData };

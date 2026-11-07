// monster.js
// 共用怪物/野獸資料（BeastCatalog）與野獸資料卡的 HTML（renderBeastPopupHtml）；資料來自 content/srd/monsters 的怪物內容檔，
// 由 npm run build 產生 monster-content.generated.js（monsterRules、monsterText）。提示框浮層與技能／規則說明在 rule-tips.js。

// 網站版資料卡的顯示文字（name、size_type、ac、hp、speed、ability、senses、skills、traits、attacks）。
const BEAST_STATS = Object.freeze(Object.fromEntries(Object.entries(monsterText).map(([key, text]) => [key, text.statBlock])));

// 跑團的結構化數值（abilities、skills、speeds、actions、conditionalDamage）；只有可變形的野獸有。
const BEAST_TABLETOP_DATA = Object.freeze(Object.fromEntries(Object.entries(monsterRules).filter(([, rules]) => rules.tabletop).map(([key, rules]) => [key, rules.tabletop])));
globalThis.BeastCatalog = Object.freeze({
  getStatBlock(key) { return BEAST_STATS[key] || null; },
  get(key) { const stats = BEAST_STATS[key], data = BEAST_TABLETOP_DATA[key]; return stats && data ? { ...stats, ...data, key } : null; }
});

// 野獸資料卡（職業頁 .beast-tip 浮層、法術頁召喚物、跑團已知形態共用）。
function renderBeastPopupHtml(s) {
  const renderDetailLine = (label, value, className = "") => {
    const text = String(value ?? "").trim();
    if (!text || text === "—") return "";
    const content = escapeHtml(text).replaceAll("\n", "<br>");
    return `<div class="monster-detail-line${className ? ` ${className}` : ""}"><strong>${label}</strong> ${content}</div>`;
  };

  return `
    <div class="title">${escapeHtml(s.name)} <span class="muted">${escapeHtml(s.size_type)}</span></div>
    <div class="row">
      <div><strong>AC</strong> ${escapeHtml(String(s.ac))}</div>
      <div><strong>HP</strong> ${escapeHtml(String(s.hp))}</div>
      <div><strong>速度</strong> ${escapeHtml(String(s.speed))}</div>
    </div>
${renderDetailLine("能力值", s.ability, "monster-detail-line--first")}
${renderDetailLine("感官", s.senses)}
${renderDetailLine("技能", s.skills)}
${renderDetailLine("特性", s.traits)}
${renderDetailLine("攻擊", s.attacks)}
  `;
}

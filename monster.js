// monster.js
// 共用怪物/野獸資料（BeastCatalog）與野獸資料卡的 HTML（renderBeastPopupHtml）；資料來自 content/srd/monsters 的怪物內容檔，
// 由 npm run build 產生 monster-content.generated.js（monsterRules、monsterText、monsterLabels）。提示框浮層與技能／規則說明在 rule-tips.js。

// 網站版資料卡的顯示文字（name、size_type、ac、hp、speed、ability、savingThrows、senses、skills、traits、attacks），建置由數值產生。
const BEAST_STATS = Object.freeze(Object.fromEntries(Object.entries(monsterText).map(([key, text]) => [key, Object.freeze({ ...text.statBlock })])));

// 跑團讀取的野獸數值：資料卡文字加上 abilities、saves、skills（技能名 → 加值）、speeds（中文速度名 → 呎）、
// actions（name、hit、damage[{ type, expression, fixed }]、id、mode、recovery、save{ ability, dc }）與 conditionalDamage。
// 數值隨施法變化的召喚物（異界坐騎）沒有跑團數值，回傳 null。
function beastTabletopView(key) {
  const rules = monsterRules[key], text = monsterText[key];
  if (!rules || !text || rules.variable) return null;
  const damageType = item => `${monsterLabels.damage[item.type]}${item.timing ? `（${monsterLabels.timing[item.timing]}）` : ""}`;
  const damage = item => ({ type: damageType(item), expression: item.dice || "", fixed: item.dice ? item.average : item.fixed });
  return {
    ...text.statBlock,
    abilities: { ...rules.abilities },
    ...(rules.saves ? { saves: { ...rules.saves } } : {}),
    skills: { ...(rules.skills || {}) },
    speeds: Object.fromEntries(Object.entries(rules.speed).filter(([type]) => type !== "hover").map(([type, feet]) => [monsterLabels.speed[type], feet])),
    actions: rules.actions.map(action => ({
      name: text.actions[action.id].name,
      ...(action.attack ? { hit: action.attack.hit } : {}),
      ...(action.damage ? { damage: action.damage.map(damage) } : {}),
      id: action.id,
      mode: action.mode || "action",
      ...(action.recovery ? { recovery: action.recovery } : {}),
      ...(action.save ? { save: { ability: monsterLabels.ability[action.save.ability], dc: action.save.dc } } : {})
    })),
    conditionalDamage: rules.actions.flatMap(action => (action.conditional || []).map(item => ({ name: monsterLabels.conditional[item.when], expression: item.dice }))),
    ...(text.summary ? { summary: text.summary } : {}),
    traitList: text.traits.map(trait => ({ ...trait })),
    key
  };
}

globalThis.BeastCatalog = Object.freeze({
  getStatBlock(key) { return BEAST_STATS[key] || null; },
  get: beastTabletopView,
  // 結構化數值（CR、體型、速度、感官等；荒野形態的篩選與之後的形態比較讀這裡）。
  getRules(key) { return monsterRules[key] || null; },
  keys() { return Object.keys(monsterRules); }
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
${renderDetailLine("豁免", s.savingThrows)}
${renderDetailLine("感官", s.senses)}
${renderDetailLine("技能", s.skills)}
${renderDetailLine("特性", s.traits)}
${renderDetailLine("攻擊", s.attacks)}
  `;
}

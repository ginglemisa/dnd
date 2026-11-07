// monster.js
// 共用怪物/野獸資料（BeastCatalog）與野獸資料卡的 HTML（renderBeastPopupHtml）；資料來自 content/srd/monsters 的怪物內容檔，
// 由 npm run build 產生 monster-content.generated.js（monsterRules、monsterText、monsterLabels）。提示框浮層與技能／規則說明在 rule-tips.js。

// 網站版資料卡的顯示文字（name、size_type、ac、hp、speed、ability、savingThrows、senses、skills、traits、attacks），建置由數值產生。
const BEAST_STATS = Object.freeze(Object.fromEntries(Object.entries(monsterText).map(([key, text]) => [key, Object.freeze({ ...text.statBlock })])));

// 跑團讀取的野獸數值：資料卡文字加上 cr、abilities、saves、skills（技能名 → 加值）、speeds（中文速度名 → 呎）、
// senseList（[{ label, feet }]）、actions（name、text（網站版的動作說明，攻擊只有額外效果）、hit、attack{ kind, reach, range }、
// damage[{ type, expression, fixed }]、conditional[{ name, expression }]、id、mode、recovery、uses、save{ ability, dc }）、
// conditionalDamage（各動作的 conditional 攤平）、summary（用途短說明）與 traitList（特性 [{ name, text }]）。
// 數值隨施法變化的召喚物（異界坐騎）沒有跑團數值，回傳 null。
function beastTabletopView(key) {
  if (!Object.hasOwn(monsterRules, key) || !Object.hasOwn(monsterText, key)) return null;
  const rules = monsterRules[key], text = monsterText[key];
  if (rules.variable) return null;
  const damageType = item => `${monsterLabels.damage[item.type]}${item.timing ? `（${monsterLabels.timing[item.timing]}）` : ""}`;
  const damage = item => ({ type: damageType(item), expression: item.dice || "", fixed: item.dice ? item.average : item.fixed });
  const conditional = action => (action.conditional || []).map(item => ({ name: monsterLabels.conditional[item.when], expression: item.dice }));
  const attack = item => ({ kind: monsterLabels.attack[item.kind], ...(item.reach ? { reach: item.reach } : {}), ...(item.range ? { range: [...item.range] } : {}) });
  return {
    ...text.statBlock,
    cr: rules.cr,
    abilities: { ...rules.abilities },
    ...(rules.saves ? { saves: { ...rules.saves } } : {}),
    skills: { ...(rules.skills || {}) },
    speeds: Object.fromEntries(Object.entries(rules.speed).filter(([type]) => type !== "hover").map(([type, feet]) => [monsterLabels.speed[type], feet])),
    senseList: Object.entries(rules.senses || {}).map(([type, feet]) => ({ label: monsterLabels.sense[type], feet })),
    actions: rules.actions.map(action => ({
      name: text.actions[action.id].name,
      ...(text.actions[action.id].text ? { text: text.actions[action.id].text } : {}),
      ...(action.attack ? { hit: action.attack.hit, attack: attack(action.attack) } : {}),
      ...(action.damage ? { damage: action.damage.map(damage) } : {}),
      ...(action.conditional ? { conditional: conditional(action) } : {}),
      id: action.id,
      mode: action.mode || "action",
      ...(action.recovery ? { recovery: action.recovery } : {}),
      ...(action.uses ? { uses: action.uses } : {}),
      ...(action.save ? { save: { ability: monsterLabels.ability[action.save.ability], dc: action.save.dc } } : {})
    })),
    conditionalDamage: rules.actions.flatMap(conditional),
    ...(text.summary ? { summary: text.summary } : {}),
    traitList: text.traits.map(trait => ({ ...trait })),
    key
  };
}

// SRD 版（資料卡的「SRD 版」，SRD 5.2.1 繁中直譯）：monster-srd.generated.js 在第一次需要時才載入，離線版已內嵌。
function hasBeastSrdText(key) {
  return Object.hasOwn(monsterRules, key) && monsterRules[key].source === "srd";
}

let beastSrdPromise = null;
function loadBeastSrdData() {
  if (globalThis.monsterSrdText) return Promise.resolve(globalThis.monsterSrdText);
  beastSrdPromise ||= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = typeof monsterSrdFile === "string" ? monsterSrdFile : "monster-srd.generated.js";
    script.onload = () => globalThis.monsterSrdText ? resolve(globalThis.monsterSrdText) : reject(new Error("SRD 版資料格式不符"));
    script.onerror = () => {
      script.remove();
      reject(new Error("SRD 版資料載入失敗"));
    };
    document.head.appendChild(script);
  }).catch(error => {
    beastSrdPromise = null;
    throw error;
  });
  return beastSrdPromise;
}

// 回傳 { html }（建置產生的 HTML）；沒有 SRD 版時為 null，載入失敗時 reject（之後可再試）。
async function loadBeastSrdText(key) {
  if (!hasBeastSrdText(key)) return null;
  const data = await loadBeastSrdData();
  return Object.hasOwn(data, key) ? data[key] : null;
}

globalThis.BeastCatalog = Object.freeze({
  getStatBlock(key) { return Object.hasOwn(BEAST_STATS, key) ? BEAST_STATS[key] : null; },
  get: beastTabletopView,
  // 結構化數值（CR、體型、速度、感官等；荒野形態的篩選與之後的形態比較讀這裡）。
  getRules(key) { return Object.hasOwn(monsterRules, key) ? monsterRules[key] : null; },
  keys() { return Object.keys(monsterRules); },
  hasSrdText: hasBeastSrdText,
  loadSrdText: loadBeastSrdText
});

// 野獸資料卡（職業頁 .beast-tip 浮層、法術頁召喚物、跑團已知形態共用）。
// renderBeastPopupHtml(s) 是整張網站版資料卡（標題＋內容）；createBeastCard(key) 另加「網站版｜SRD 版」切換（sheet-spells.js 的 createContentVersionView）。
function renderBeastPopupTitle(s) {
  return `<div class="title">${escapeHtml(s.name)} <span class="muted">${escapeHtml(s.size_type)}</span></div>`;
}

function renderBeastPopupBody(s) {
  const renderDetailLine = (label, value, className = "") => {
    const text = String(value ?? "").trim();
    if (!text || text === "—") return "";
    const content = escapeHtml(text).replaceAll("\n", "<br>");
    return `<div class="monster-detail-line${className ? ` ${className}` : ""}"><strong>${label}</strong> ${content}</div>`;
  };

  return `
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

function renderBeastPopupHtml(s) {
  return `
    ${renderBeastPopupTitle(s)}${renderBeastPopupBody(s)}`;
}

// 野獸資料卡元素：標題、版本切換（網站版／SRD 版）與內容。沒有該 key 時回傳 null。onChange(version) 在切換版本後呼叫（浮層重新定位用）。
function createBeastCard(key, { onChange = null } = {}) {
  const stats = Object.hasOwn(BEAST_STATS, key) ? BEAST_STATS[key] : null;
  if (!stats) return null;
  const card = document.createElement("div");
  card.className = "beast-card";
  card.dataset.beast = key;
  card.innerHTML = renderBeastPopupTitle(stats);
  const renderSite = container => { container.innerHTML = renderBeastPopupBody(stats); };
  if (typeof createContentVersionView !== "function") {
    const body = document.createElement("div");
    renderSite(body);
    card.appendChild(body);
    return card;
  }
  card.appendChild(createContentVersionView({ renderSite, loadSrd: hasBeastSrdText(key) ? () => loadBeastSrdText(key) : null, onChange }));
  return card;
}

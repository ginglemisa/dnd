// 怪物資料卡的顯示：由結構化數值產生網站版的資料卡文字（statBlock）與 SRD 版的 HTML。
// 用詞與法術內容檔一致：傷害類型取自 spell-list.js 的 SpellCatalog.damageTypeLabels，狀態取自 condition.js，數字與單位之間不留空格（60呎）。
"use strict";
const { ContentError } = require("../content/errors");

const SIZE_LABELS = Object.freeze({ tiny: "微型", small: "小型", medium: "中型", large: "大型", huge: "巨型", gargantuan: "超巨型" });
const TYPE_LABELS = Object.freeze({
  aberration: "異怪", beast: "野獸", celestial: "天界生物", construct: "構裝生物", dragon: "龍類", elemental: "元素生物", fey: "精類",
  fiend: "邪魔", giant: "巨人", humanoid: "人型生物", monstrosity: "怪獸", ooze: "軟泥怪", plant: "植物", undead: "不死生物"
});
const SUBTYPE_LABELS = Object.freeze({ devil: "魔鬼", demon: "惡魔", dinosaur: "恐龍" });
const ALIGNMENT_LABELS = Object.freeze({
  unaligned: "無陣營", "lawful-good": "守序善良", "neutral-good": "中立善良", "chaotic-good": "混亂善良", "lawful-neutral": "守序中立",
  neutral: "中立", "chaotic-neutral": "混亂中立", "lawful-evil": "守序邪惡", "neutral-evil": "中立邪惡", "chaotic-evil": "混亂邪惡"
});
const SPEED_LABELS = Object.freeze({ walk: "步行", burrow: "挖掘", climb: "攀爬", fly: "飛行", swim: "游泳" });
const SENSE_LABELS = Object.freeze({ blindsight: "盲視", darkvision: "黑暗視覺", tremorsense: "顫動感知", truesight: "真實視覺" });
const ABILITY_LABELS = Object.freeze({ str: "力量", dex: "敏捷", con: "體質", int: "智力", wis: "感知", cha: "魅力" });
const ABILITY_SHORT = Object.freeze({ str: "力", dex: "敏", con: "體", int: "智", wis: "感", cha: "魅" });
const ATTACK_LABELS = Object.freeze({ melee: "近戰", ranged: "遠程", "melee-or-ranged": "近戰或遠程" });
const CONDITIONAL_LABELS = Object.freeze({ "charge-extra": "衝鋒額外傷害", "charge-instead": "衝鋒替代傷害", "bloodied-target-instead": "受創目標替代傷害" });
const TIMING_LABELS = Object.freeze({ "next-turn-end": "下回合結束", "each-turn-end": "每個回合結束" });
const MODE_PREFIX = Object.freeze({ action: "", bonus: "附贈動作─", reaction: "反應動作─" });
const SECTION_LABELS = Object.freeze([["traits", "特性"], ["actions", "動作"], ["bonusActions", "附贈動作"], ["reactions", "反應動作"]]);
const XP_BY_CR = Object.freeze({ "1/8": 25, "1/4": 50, "1/2": 100, 1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800, 6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900 });

const averageOf = dice => {
  const match = String(dice).match(/^(\d+)d(\d+)(?:([+-])(\d+))?$/);
  return Math.floor(Number(match[1]) * (Number(match[2]) + 1) / 2 + (match[3] === "-" ? -1 : 1) * Number(match[4] || 0));
};
const modifier = score => Math.floor((score - 10) / 2);
const signed = value => `${value >= 0 ? "+" : "-"}${Math.abs(value)}`;
const spacedDice = dice => dice.replace(/([+-])/, " $1 ");
const crValue = cr => cr.includes("/") ? cr.split("/").reduce((a, b) => Number(a) / Number(b)) : Number(cr);
const proficiencyBonus = cr => 2 + Math.max(0, Math.floor((Math.max(crValue(cr), 1) - 1) / 4));

function typeText(monster, chosen) {
  const types = [].concat(monster.type).map(type => TYPE_LABELS[type]);
  const text = types.length > 1 ? `${types.slice(0, -1).join("、")}或${types.at(-1)}${chosen}` : types[0];
  return `${SIZE_LABELS[monster.size]}${text}${monster.subtype ? `（${SUBTYPE_LABELS[monster.subtype]}）` : ""}`;
}

// 傷害文字：網站版「5（1d6+2）穿刺傷害外加7（2d6）毒素傷害」；SRD 版骰式加空格「5（1d6 + 2）」。
function damageText(damage, labels, { srd = false } = {}) {
  return damage.map((item, index) => {
    const value = item.dice ? `${averageOf(item.dice)}（${srd ? spacedDice(item.dice) : item.dice}）` : `${item.fixed}點`;
    return `${index ? "外加" : ""}${value}${labels.damage[item.type]}傷害`;
  }).join("");
}

const recoveryText = action => ({ "recharge-5": "（充能5–6）", "recharge-6": "（充能6）", daily: `（每天${action.uses || 1}次）`, "long-rest": "（長休後恢復）" })[action.recovery] || "";

// 網站版動作說明：代入 {save}、{damage}、{conditional}。
function fillActionText(action, text, labels) {
  return String(text || "")
    .replace("{save}", action.save ? `DC${action.save.dc}${ABILITY_LABELS[action.save.ability]}豁免` : "")
    .replace("{damage}", action.damage ? damageText(action.damage, labels) : "")
    .replace("{conditional}", action.conditional ? damageText(action.conditional, labels) : "");
}

// 網站版資料卡的一行動作：「附贈動作─名稱（充能6）：近戰攻擊檢定+4，觸及5呎；命中：5（1d6+2）穿刺傷害。說明」。
function actionLine(action, siteAction, labels) {
  let mechanics = "";
  if (action.attack) {
    const reach = [action.attack.reach ? `觸及${action.attack.reach}呎` : "", action.attack.range ? `射程${action.attack.range.join("/")}呎` : ""].filter(Boolean).join("或");
    mechanics = `${ATTACK_LABELS[action.attack.kind]}攻擊檢定${signed(action.attack.hit)}，${reach}；命中：${damageText(action.damage || [], labels)}。`;
  }
  return `${MODE_PREFIX[action.mode || "action"]}${siteAction.name}${recoveryText(action)}：${mechanics}${fillActionText(action, siteAction.text, labels)}`;
}

function defenseLines(monster, labels) {
  const damage = list => (list || []).map(type => labels.damage[type]).join("、");
  const immunities = [damage(monster.damageImmunities), (monster.conditionImmunities || []).map(key => labels.conditions[key]).join("、")].filter(Boolean).join("；");
  return [["抗性", damage(monster.damageResistances)], ["易傷", damage(monster.damageVulnerabilities)], ["免疫", immunities]].filter(([, text]) => text);
}

function speedParts(monster, separator) {
  return Object.entries(monster.speed).filter(([type]) => type !== "hover")
    .map(([type, feet]) => `${type === "walk" ? "" : SPEED_LABELS[type]}${feet}呎${type === "fly" && monster.speed.hover ? "（懸浮）" : ""}`).join(separator);
}

function senseParts(monster, notes = {}) {
  return Object.entries(monster.senses || {}).map(([sense, feet]) => `${SENSE_LABELS[sense]}${feet}呎${notes[sense] ? `（${notes[sense]}）` : ""}`);
}

// 網站版資料卡的顯示文字（renderBeastPopupHtml 與跑團讀取；欄位與搬移前相同，另加 savingThrows 豁免）。
function statBlock(monster, labels) {
  const site = monster.site;
  const cr = monster.variable ? site.cr : monster.cr;
  const traits = [
    ...(site.traits || []).map(trait => `${trait.name}：${trait.text}`),
    ...defenseLines(monster, labels).map(([label, text]) => `${label}：${text}`),
    ...(site.languages ? [`語言：${site.languages}`] : []),
    ...(site.gear ? [`裝備：${site.gear}`] : [])
  ];
  return {
    name: `${monster.name} (${monster.nameEn}) CR:${cr}`,
    size_type: typeText(monster, "（由你選擇）"),
    ac: monster.variable ? site.ac : monster.ac,
    hp: monster.variable ? site.hp : `${monster.hp.average} (${monster.hp.dice})`,
    speed: `${speedParts(monster, "、")}${site.speedNote ? `（${site.speedNote}）` : ""}`,
    ability: Object.entries(monster.abilities).map(([key, score]) => `${ABILITY_SHORT[key]}${score}(${signed(modifier(score))})`).join("、"),
    savingThrows: Object.entries(monster.saves || {}).map(([key, value]) => `${ABILITY_LABELS[key]}${signed(value)}`).join("、") || "—",
    senses: [...senseParts(monster, site.senseNotes), `被動察覺${monster.passivePerception}`].join("、"),
    skills: Object.entries(monster.skills || {}).map(([skill, value]) => `${skill}${signed(value)}`).join("、") || "—",
    traits: traits.join("\n") || "—",
    attacks: monster.actions.map(action => actionLine(action, site.actions[action.id], labels)).join("\n")
  };
}

// SRD 版 HTML（SRD 5.2.1 數據塊的直譯排版）。inline／body 是法術 SRD 版的 Markdown 子集轉換。
function srdHtml(monster, labels, { inline, body, escapeHtml }) {
  const srd = monster.srd;
  const where = `${monster.file} srd`;
  const line = (label, value) => value ? `<strong>${escapeHtml(label)}</strong> ${inline(value, where)}` : "";
  const block = lines => `<p class="monster-srd__stats">${lines.filter(Boolean).join("<br>")}</p>`;
  const cr = monster.variable ? srd.cr : `${monster.cr}（XP ${monster.xp.toLocaleString("en-US")}；PB +${proficiencyBonus(monster.cr)}）`;
  if (!monster.variable && monster.cr !== "0" && XP_BY_CR[monster.cr] !== monster.xp) throw new ContentError(`${monster.file}：xp 應為 ${XP_BY_CR[monster.cr]}（CR ${monster.cr}）`);
  const saves = monster.saves || {};
  const abilityRows = Object.entries(monster.abilities).map(([key, score]) => {
    const mod = modifier(score);
    return `<tr><th>${ABILITY_LABELS[key]}</th><td>${score}</td><td>${signed(mod)}</td><td>${signed(saves[key] ?? mod)}</td></tr>`;
  }).join("");
  const senses = [senseParts(monster, srd.senseNotes).join("，"), `被動察覺${monster.passivePerception}`].filter(Boolean).join("；");
  const sections = SECTION_LABELS.filter(([key]) => srd[key]).map(([key, label]) => `<h4 class="spell-srd-heading">${label}</h4>`
    + srd[key].map(entry => body(`**_${entry.name}。_** ${entry.text}`, `${where}.${key}`)).join("")).join("");
  return `<p class="monster-srd__type"><em>${escapeHtml(`${typeText(monster, "（由你選擇）")}，${ALIGNMENT_LABELS[monster.alignment]}`)}</em></p>`
    + block([
      monster.variable ? line("AC", srd.ac) : `<strong>AC</strong> ${monster.ac}　<strong>先攻</strong> ${signed(monster.initiative)}（${10 + monster.initiative}）`,
      monster.variable ? line("HP", srd.hp) : `<strong>HP</strong> ${monster.hp.average}（${spacedDice(monster.hp.dice)}）`,
      line("速度", `${speedParts(monster, "，")}${srd.speedNote ? `（${srd.speedNote}）` : ""}`)
    ])
    + `<table class="spell-srd-table monster-srd__abilities"><thead><tr><th></th><th></th><th>調整值</th><th>豁免</th></tr></thead><tbody>${abilityRows}</tbody></table>`
    + block([
      line("技能", Object.entries(monster.skills || {}).map(([skill, value]) => `${skill} ${signed(value)}`).join("，")),
      ...defenseLines(monster, labels).map(([label, text]) => line(label, text)),
      line("裝備", srd.gear),
      line("感官", senses),
      line("語言", srd.languages || "無"),
      line("CR", cr)
    ])
    + sections;
}

module.exports = {
  SIZE_LABELS, SPEED_LABELS, SENSE_LABELS, ATTACK_LABELS, ABILITY_LABELS, CONDITIONAL_LABELS, TIMING_LABELS,
  averageOf, damageText, fillActionText, statBlock, srdHtml
};

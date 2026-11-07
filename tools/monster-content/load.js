// 讀取 content/srd/monsters 的怪物內容檔，做 schema 驗證與檢查。任何錯誤都丟出 ContentError。
// 頂層是結構化數值（網站版資料卡與跑團數值都由此產生）；site 是網站版的特性與動作說明，srd 是 SRD 繁中直譯，en 是英文原文（只供校對）。
"use strict";
const path = require("path");
const { ROOT, loadSkillAbilities, loadConditionLabels } = require("../content/site-sources");
const { ContentError } = require("../content/errors");
const { CONTENT_DIR, createSchemaValidators, schemaErrors, readYamlFile, listYaml } = require("../content/yaml");
const { averageOf } = require("./format");

const SECTIONS = Object.freeze({ action: "actions", bonus: "bonusActions", reaction: "reactions" });
const VARIABLE_FIELDS = ["ac", "hp", "cr"];

// 回傳 Map（怪物 key → 內容，依 key 排序）。
function loadMonsters() {
  const errors = [];
  const validate = createSchemaValidators(["monster"]).monster;
  const monsters = [];
  for (const file of listYaml(path.join(CONTENT_DIR, "srd", "monsters"))) {
    const where = path.relative(ROOT, file).replace(/\\/g, "/");
    let data;
    try { data = readYamlFile(file); } catch (error) { errors.push(error.message); continue; }
    if (!validate(data)) { errors.push(...schemaErrors(validate, where)); continue; }
    if (path.basename(file).replace(/\.ya?ml$/, "") !== data.id) errors.push(`${where}：檔名應為 ${data.id}.yaml`);
    checkMonster(data, where, errors);
    monsters.push({ ...data, file: where });
  }
  checkNames(monsters, errors);
  if (errors.length) throw new ContentError(`怪物內容檢查失敗（${errors.length} 項）：\n- ${errors.join("\n- ")}`);
  monsters.sort((a, b) => (a.id < b.id ? -1 : 1));
  return new Map(monsters.map(monster => [monster.id, monster]));
}

function checkMonster(monster, where, errors) {
  const blocks = ["site", "srd", "en"].filter(name => monster[name]);
  // 數值隨施法變化的怪物（異界坐騎）：AC、HP、CR 寫在各文字區塊。
  if (monster.variable) {
    ["ac", "hp", "initiative"].filter(field => monster[field] !== undefined).forEach(field => errors.push(`${where}：variable 的怪物不寫 ${field}（寫在各文字區塊）`));
    if (monster.cr !== "none") errors.push(`${where}：variable 的怪物 cr 應為 none`);
    blocks.forEach(name => VARIABLE_FIELDS.filter(field => !monster[name][field]).forEach(field => errors.push(`${where}：${name} 缺少 ${field}（variable 的怪物）`)));
  } else {
    ["ac", "hp", "initiative"].filter(field => monster[field] === undefined).forEach(field => errors.push(`${where}：缺少 ${field}`));
    if (monster.cr === "none") errors.push(`${where}：cr: none 只用於 variable 的怪物`);
    blocks.forEach(name => VARIABLE_FIELDS.filter(field => monster[name][field]).forEach(field => errors.push(`${where}：${name}.${field} 只用於 variable 的怪物`)));
    if (monster.hp && averageOf(monster.hp.dice) !== monster.hp.average) errors.push(`${where}：hp.average 應為 ${averageOf(monster.hp.dice)}（${monster.hp.dice} 的平均）`);
  }
  const skills = loadSkillAbilities();
  Object.keys(monster.skills || {}).filter(skill => !skills[skill]).forEach(skill => errors.push(`${where}：skills 的「${skill}」不是網站的技能名稱`));
  const conditions = loadConditionLabels();
  (monster.conditionImmunities || []).filter(key => !conditions[key]).forEach(key => errors.push(`${where}：conditionImmunities 的「${key}」不是 condition.js 的狀態 key`));
  checkActions(monster, where, errors);
  if (monster.srd && monster.en) checkSrd(monster, where, errors);
  const languages = blocks.filter(name => monster[name].languages).length;
  if (languages && languages !== blocks.length) errors.push(`${where}：languages 須在 ${blocks.join("、")} 都寫或都不寫`);
}

function checkActions(monster, where, errors) {
  const ids = monster.actions.map(action => action.id);
  if (new Set(ids).size !== ids.length) errors.push(`${where}：actions 的 id 重複`);
  const site = monster.site.actions;
  ids.filter(id => !site[id]).forEach(id => errors.push(`${where}：site.actions 缺少 ${id}`));
  Object.keys(site).filter(id => !ids.includes(id)).forEach(id => errors.push(`${where}：site.actions 的 ${id} 不在 actions`));
  let attackIndex = 0;
  for (const action of monster.actions) {
    const at = `${where} actions ${action.id}`;
    if (action.attack ? action.id !== `attack-${attackIndex++}` : /^attack-/.test(action.id)) errors.push(`${at}：有攻擊檢定的動作依序為 attack-0、attack-1…，其他動作不可用 attack- 開頭`);
    if (action.uses && action.recovery !== "daily") errors.push(`${at}：uses 只用於 recovery: daily`);
    if (action.save?.half && !action.damage) errors.push(`${at}：save.half 需要 damage`);
    (action.damage || []).forEach(damage => { if (Boolean(damage.dice) === (damage.fixed !== undefined)) errors.push(`${at}：damage 的 dice 與 fixed 擇一`); });
    const text = site[action.id]?.text || "";
    const tokens = { "{save}": Boolean(action.save), "{damage}": Boolean(action.damage) && !action.attack, "{conditional}": Boolean(action.conditional) };
    if (action.save && !text.includes("{save}")) errors.push(`${at}：豁免動作的 site 說明須含 {save}`);
    if (action.damage && !action.attack && !text.includes("{damage}")) errors.push(`${at}：沒有攻擊檢定的傷害須以 {damage} 寫進 site 說明`);
    if (action.conditional && !text.includes("{conditional}")) errors.push(`${at}：有 conditional 的動作，site 說明須含 {conditional}`);
    Object.entries(tokens).filter(([token, allowed]) => !allowed && text.includes(token)).forEach(([token]) => errors.push(`${at}：site 說明不可用 ${token}`));
    if ((text.match(/\{[^}]*\}/g) || []).some(token => !(token in tokens))) errors.push(`${at}：site 說明只能用 {save}、{damage}、{conditional}`);
  }
}

// SRD 版與英文原文：各區塊項目數與動作對應、名稱沿用網站版、骰式與英文一致。
function checkSrd(monster, where, errors) {
  const siteTraits = monster.site.traits || [];
  for (const name of ["srd", "en"]) {
    const block = monster[name];
    if ((block.traits || []).length !== siteTraits.length) errors.push(`${where}：${name}.traits 應有 ${siteTraits.length} 項（與 site.traits 相同）`);
    for (const [mode, section] of Object.entries(SECTIONS)) {
      const expected = monster.actions.filter(action => (action.mode || "action") === mode);
      if ((block[section] || []).length !== expected.length) errors.push(`${where}：${name}.${section} 應有 ${expected.length} 項（對應 actions 中的 ${expected.map(action => action.id).join("、") || "無"}）`);
      if (name === "srd") (block[section] || []).forEach((entry, index) => {
        const siteName = expected[index] && monster.site.actions[expected[index].id]?.name;
        if (siteName && !entry.name.startsWith(siteName)) errors.push(`${where}：srd.${section}[${index}] 的名稱應沿用網站版「${siteName}」`);
      });
    }
    if (name === "srd") (block.traits || []).forEach((entry, index) => {
      if (siteTraits[index] && entry.name !== siteTraits[index].name) errors.push(`${where}：srd.traits[${index}] 的名稱應沿用網站版「${siteTraits[index].name}」`);
    });
  }
  const diceIn = block => Object.values(SECTIONS).concat("traits").flatMap(section => (block[section] || []).flatMap(entry => entry.text.match(/\d+d\d+(?:\s*[+−-]\s*\d+)?/g) || []))
    .map(dice => dice.replace(/\s/g, "").replace(/−/g, "-")).sort();
  const en = diceIn(monster.en), srd = diceIn(monster.srd);
  if (en.join() !== srd.join()) errors.push(`${where}：srd 的骰式與 en 不同（en：${en.join("、") || "無"}；srd：${srd.join("、") || "無"}）`);
}

// 中文名是 [[中文名]] 提示框的查表依據，不可重複。
function checkNames(monsters, errors) {
  const owners = new Map();
  monsters.forEach(monster => {
    const owner = owners.get(monster.name);
    if (owner) errors.push(`${monster.file}：中文名「${monster.name}」與 ${owner} 重複`);
    owners.set(monster.name, monster.id);
  });
}

module.exports = { loadMonsters, SECTIONS };

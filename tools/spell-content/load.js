// 讀取 content/srd/spells 的法術內容檔，做 schema 驗證與檢查。任何錯誤都丟出 ContentError。
// 有 site 區塊的法術才是角色可用的法術（職業法表、準備法術、跑團、PDF）；只有 srd 區塊的法術只供查閱。
// 私人內容包的法術（content/private/spells/）目前尚未啟用：建置不讀取，格式見 content/README.md。
"use strict";
const path = require("path");
const { ROOT } = require("../content/site-sources");
const { ContentError } = require("../content/errors");
const { CONTENT_DIR, createSchemaValidators, schemaErrors, readYamlFile, listYaml } = require("../content/yaml");

const TEXT_BLOCKS = ["site", "srd", "en"];
const TRIGGER_TIMES = new Set(["reaction", "bonus-action"]);
// 網站版說明中，以更高環位施放的段落（upcast: true 的法術須有，其餘不可有）。
const UPCAST_TEXT = /(?:更高環階|提升法術位|高階法術位|提升\s*[:：])/;
const DICE = /^\d+d(?:4|6|8|10|12|20|100)(?:\+\d+)?$/;

// 回傳 Map（法術 ID → 內容，依環階再依 ID 排序）。
function loadSpells() {
  const errors = [];
  const validate = createSchemaValidators(["spell"]).spell;
  const spells = [];
  for (const file of listYaml(path.join(CONTENT_DIR, "srd", "spells"))) {
    const where = path.relative(ROOT, file).replace(/\\/g, "/");
    let data;
    try { data = readYamlFile(file); } catch (error) { errors.push(error.message); continue; }
    if (!validate(data)) { errors.push(...schemaErrors(validate, where)); continue; }
    if (path.basename(file).replace(/\.ya?ml$/, "") !== data.id) errors.push(`${where}：檔名應為 ${data.id}.yaml`);
    checkSpell(data, where, errors);
    spells.push({ ...data, file: where });
  }
  checkNames(spells, errors);
  if (errors.length) throw new ContentError(`法術內容檢查失敗（${errors.length} 項）：\n- ${errors.join("\n- ")}`);
  spells.sort((a, b) => a.level - b.level || (a.id < b.id ? -1 : 1));
  return new Map(spells.map(spell => [spell.id, spell]));
}

function checkSpell(spell, where, errors) {
  if (spell.source === "private") errors.push(`${where}：source: private 只用於私人內容包（content/private/spells/）`);
  if (spell.source === "srd" && !spell.srd) errors.push(`${where}：SRD 法術須有 srd 區塊`);
  if (spell.source !== "srd" && (spell.srd || spell.en)) errors.push(`${where}：只有 source: srd 的法術可寫 srd、en 區塊`);
  if (spell.reference || spell.referenceEn) errors.push(`${where}：reference、referenceEn 只用於私人內容包`);
  if (!spell.site && !spell.srd) errors.push(`${where}：至少要有 site 或 srd 區塊`);
  const times = spell.castingTime.map(time => typeof time === "string" ? time : JSON.stringify(time));
  if (new Set(times).size !== times.length) errors.push(`${where}：castingTime 重複`);
  if (spell.concentration && typeof spell.duration === "object" && spell.duration.upTo) errors.push(`${where}：專注法術已顯示「最長」，duration 不需寫 upTo`);
  if (typeof spell.duration === "object" && Object.keys(spell.duration).filter(key => key !== "upTo").length !== 1) errors.push(`${where}：duration 只能有一種時間單位`);
  const order = ["V", "S", "M"];
  if (spell.components.join() !== order.filter(item => spell.components.includes(item)).join()) errors.push(`${where}：components 須依 V、S、M 順序`);
  const hasMaterial = spell.components.includes("M");
  const canTrigger = spell.castingTime.some(time => TRIGGER_TIMES.has(time));
  TEXT_BLOCKS.filter(name => spell[name]).forEach(name => {
    const block = spell[name];
    if (hasMaterial && !block.material) errors.push(`${where}：${name} 缺少 material（components 有 M）`);
    if (!hasMaterial && block.material) errors.push(`${where}：${name} 寫了 material，但 components 沒有 M`);
    if (block.trigger && !canTrigger) errors.push(`${where}：${name} 的 trigger 只能用在反應或附贈動作`);
    if (spell.castingTime.includes("reaction") && !block.trigger) errors.push(`${where}：${name} 缺少反應動作的 trigger`);
  });
  if (spell.upcast && spell.level === 0) errors.push(`${where}：戲法不可寫 upcast（戲法升級寫在 outcomes 的 cantripAt5／repeatAt5）`);
  if (!spell.site) return;
  if (spell.level > 0 && Boolean(spell.upcast) !== UPCAST_TEXT.test(spell.site.body)) {
    errors.push(`${where}：${spell.upcast ? "upcast: true 但網站版說明沒有以更高環位施放的段落" : "網站版說明有以更高環位施放的段落，但沒有 upcast: true"}`);
  }
  if (!spell.classes.length) errors.push(`${where}：有 site 的法術至少要在一個職業法表`);
  (spell.site.outcomes || []).forEach((outcome, index) => {
    const at = `${where} site.outcomes[${index}]`;
    if (outcome.kind !== "attack" && !outcome.formula && outcome.fixed === undefined) errors.push(`${at}：需要 formula 或 fixed`);
    if (outcome.kind === "attack" && (outcome.formula || outcome.fixed !== undefined)) errors.push(`${at}：attack 不寫 formula、fixed`);
    if ((outcome.cantripAt5 || outcome.repeatAt5) && spell.level !== 0) errors.push(`${at}：cantripAt5、repeatAt5 只用於戲法`);
    if ((outcome.upcastDice || outcome.upcastFixed || outcome.repeatPerSlot) && !spell.upcast) errors.push(`${at}：升環欄位需要法術的 upcast: true`);
    if (outcome.damageType && outcome.damageTypes) errors.push(`${at}：damageType 與 damageTypes 擇一`);
    [outcome.formula, outcome.cantripAt5, outcome.upcastDice].filter(Boolean).forEach(dice => { if (!DICE.test(dice)) errors.push(`${at}：骰式「${dice}」無法解析`); });
  });
}

// 中文名、英文名與「中文名 英文名」會用來把舊存檔的名稱轉成 ID，不可重複。
function checkNames(spells, errors) {
  const owners = new Map();
  spells.forEach(spell => [spell.name, spell.nameEn, `${spell.name} ${spell.nameEn}`].forEach(name => {
    const owner = owners.get(name);
    if (owner && owner !== spell.id) errors.push(`${spell.file}：名稱「${name}」與 ${owner} 重複`);
    owners.set(name, spell.id);
  }));
}

module.exports = { loadSpells };

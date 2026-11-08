// 讀取 content/srd/magic-items.yaml（魔法物品，單一檔），做 schema 驗證與跨資料檢查。任何錯誤都丟出 ContentError。
"use strict";
const path = require("path");
const { ROOT, loadEquipmentData, loadSpellCatalog } = require("../content/site-sources");
const { ContentError } = require("../content/errors");
const { CONTENT_DIR, createSchemaValidators, schemaErrors, readYamlFile } = require("../content/yaml");

const FILE = path.join(CONTENT_DIR, "srd", "magic-items.yaml");
const WHERE = path.relative(ROOT, FILE).replace(/\\/g, "/");
// 彈藥在 equipment-data.js 只有名稱對照，沒有獨立清單；這裡列出物品欄使用的品名。
const AMMUNITION = Object.freeze(["箭矢", "弩矢", "子彈，火器", "彈丸，投石索", "針"]);
const RESERVED_OPTION_IDS = new Set(["id", "base"]);

// 「任意某類」的展開清單：品名與 equipment-data.js 相同。
function loadBaseLists() {
  const data = loadEquipmentData();
  const names = list => list.map(entry => entry["名稱"]);
  const armor = category => data.armors.filter(entry => entry["分類"] === category).map(entry => entry["名稱"]);
  const missing = AMMUNITION.filter(name => !Object.hasOwn(data.EQUIPMENT_ENGLISH_NAMES, name));
  if (missing.length) throw new ContentError(`${WHERE}：equipment-data.js 沒有彈藥品名 ${missing.join("、")}`);
  return {
    "simple-weapon": [...names(data.weapons_simple_melee), ...names(data.weapons_simple_ranged)],
    "martial-weapon": [...names(data.weapons_martial_melee), ...names(data.weapons_martial_ranged)],
    "melee-weapon": [...names(data.weapons_simple_melee), ...names(data.weapons_martial_melee)],
    "light-armor": armor("輕甲"),
    "medium-armor": armor("中甲"),
    "heavy-armor": armor("重甲"),
    ammunition: [...AMMUNITION]
  };
}

function knownEquipment(lists) {
  const data = loadEquipmentData();
  return new Set([...Object.values(lists).flat(), ...data.shield.map(entry => entry["名稱"])]);
}

// nameEn 轉 kebab-case：括弧內的別名不算，「X, +1, +2, or +3」為 x-plus。
function expectedId(nameEn) {
  const plus = nameEn.match(/^(.*), \+1, \+2, or \+3$/);
  return (plus ? `${plus[1]} plus` : nameEn.replace(/\s*\(.*\)$/, "")).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function checkBase(item, at, lists, known, errors) {
  const { base } = item;
  if (!base) {
    if (item.category === "weapon" || item.category === "armor") errors.push(`${at}：武器與護甲須有 base`);
    return;
  }
  if (!["weapon", "armor", "staff", "rod"].includes(item.category)) errors.push(`${at}：${item.category} 不可有 base`);
  const kinds = ["fixed", "from", "any"].filter(kind => base[kind] !== undefined);
  if (kinds.length !== 1) { errors.push(`${at}：base 的 fixed、from、any 須剛好一個`); return; }
  if (base.any) {
    if (!base.label) errors.push(`${at}：base.any 須有 label`);
    const expanded = new Set(base.any.flatMap(group => lists[group]));
    (base.except || []).filter(name => !expanded.has(name)).forEach(name => errors.push(`${at}：base.except 的「${name}」不在 ${base.any.join("、")}`));
    return;
  }
  if (base.label || base.except) errors.push(`${at}：label、except 只用於 base.any`);
  [base.fixed, ...(base.from || [])].filter(Boolean).filter(name => !known.has(name)).forEach(name => errors.push(`${at}：基本款「${name}」不是 equipment-data.js 的武器、護甲或盾牌`));
}

function checkEffects(effects, at, { bonusOption, allowCondition }, errors) {
  if (!effects) return;
  const values = Object.entries(effects).filter(([key]) => key !== "condition");
  if (!values.length) errors.push(`${at}：effects 沒有數值`);
  if (values.some(([, value]) => value === "bonus") && !bonusOption) errors.push(`${at}：effects 用 bonus 須有 bonus 選項`);
  if (effects.condition && !allowCondition) errors.push(`${at}：選項的 effects 不可寫 condition`);
  if (effects.condition && effects.ac === undefined && effects.saves === undefined) errors.push(`${at}：effects.condition 只適用 ac、saves`);
}

function checkOptions(item, at, damageLabels, errors) {
  const options = item.options || [];
  const ids = options.map(option => option.id);
  if (new Set(ids).size !== ids.length) errors.push(`${at}：options 的 id 重複`);
  ids.filter(id => RESERVED_OPTION_IDS.has(id)).forEach(id => errors.push(`${at}：選項 id「${id}」保留給物品欄存檔`));
  const withRarity = options.filter(option => option.choices.some(choice => choice.rarity));
  for (const option of options) {
    const values = option.choices.map(choice => choice.value);
    if (new Set(values).size !== values.length) errors.push(`${at} ${option.id}：choices 的 value 重複`);
    if (option.choices.some(choice => choice.rarity) && !option.choices.every(choice => choice.rarity)) errors.push(`${at} ${option.id}：rarity 須每個 choice 都寫或都不寫`);
    if (option.id === "bonus" && !values.every(value => Number.isInteger(value) && value > 0)) errors.push(`${at} bonus：value 須是正整數`);
    if (option.id === "damageType") option.choices.filter(choice => damageLabels[choice.value] !== choice.label).forEach(choice => errors.push(`${at} damageType：「${choice.value}」應對應 ${damageLabels[choice.value] || "SpellCatalog.damageTypeLabels 的傷害類型"}`));
    option.choices.forEach(choice => checkEffects(choice.effects, `${at} ${option.id}:${choice.value}`, { bonusOption: false, allowCondition: false }, errors));
  }
  if (item.rarity === "varies" && withRarity.length !== 1) errors.push(`${at}：rarity 為 varies 時，須剛好一組選項帶 rarity`);
  if (item.rarity !== "varies" && withRarity.length) errors.push(`${at}：選項帶 rarity 時，物品的 rarity 應為 varies`);
  if (item.rarityText && item.rarity !== "varies") errors.push(`${at}：rarityText 只用於 varies`);
}

function checkItem(item, index, { lists, known, damageLabels, equipmentNames }, errors) {
  const at = `${WHERE} items[${index}] ${item.id}`;
  if (item.equipmentName && !equipmentNames.has(item.equipmentName)) errors.push(`${at}：equipmentName「${item.equipmentName}」不是 equipment-data.js 的品名`);
  if (item.id !== expectedId(item.nameEn)) errors.push(`${at}：id 應為 ${expectedId(item.nameEn)}（由 nameEn 轉成）`);
  if (item.category === "wondrous" && !item.group) errors.push(`${at}：奇物須有 group`);
  if (item.category !== "wondrous" && item.group) errors.push(`${at}：只有奇物寫 group`);
  if (typeof item.attunement === "string" && !item.attunement.startsWith("由")) errors.push(`${at}：attunement 的限定條件以「由」開頭（顯示為「需由…同調」）`);
  checkBase(item, at, lists, known, errors);
  checkOptions(item, at, damageLabels, errors);
  checkEffects(item.effects, at, { bonusOption: (item.options || []).some(option => option.id === "bonus"), allowCondition: true }, errors);
  const tokens = (item.displayName || "").match(/\{[^}]*\}/g) || [];
  const allowed = new Set([...(item.base ? ["{base}"] : []), ...(item.options || []).map(option => `{${option.id}}`)]);
  tokens.filter(token => !allowed.has(token)).forEach(token => errors.push(`${at}：displayName 的 ${token} 不是基本款或選項`));
  if (/[A-Za-z]{4,}/.test(item.text)) errors.push(`${at}：text 只放中文，不放英文內文`);
}

function checkUnique(items, field, errors) {
  const seen = new Set();
  items.forEach(item => {
    if (seen.has(item[field])) errors.push(`${WHERE}：${field}「${item[field]}」重複`);
    seen.add(item[field]);
  });
}

// 回傳 Map（物品 id → 內容，依內容檔順序）與 baseLists（「任意某類」的展開清單）。
function loadMagicItems() {
  const validate = createSchemaValidators(["magic-item"])["magic-item"];
  const data = readYamlFile(FILE);
  if (!validate(data)) throw new ContentError(`魔法物品內容檢查失敗：\n- ${schemaErrors(validate, WHERE).join("\n- ")}`);
  const lists = loadBaseLists();
  const context = { lists, known: knownEquipment(lists), damageLabels: loadSpellCatalog().damageTypeLabels, equipmentNames: new Set(Object.keys(loadEquipmentData().EQUIPMENT_ENGLISH_NAMES)) };
  const errors = [];
  data.items.forEach((item, index) => checkItem(item, index, context, errors));
  ["id", "name", "nameEn"].forEach(field => checkUnique(data.items, field, errors));
  if (errors.length) throw new ContentError(`魔法物品內容檢查失敗（${errors.length} 項）：\n- ${errors.join("\n- ")}`);
  return { items: new Map(data.items.map(item => [item.id, { ...item, file: WHERE }])), baseLists: lists };
}

module.exports = { loadMagicItems };

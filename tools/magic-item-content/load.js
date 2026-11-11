// 讀取 content/srd/magic-items 的魔法物品內容檔（一件一檔），做 schema 驗證與跨資料檢查。任何錯誤都丟出 ContentError。
"use strict";
const path = require("path");
const { ROOT, loadEquipmentData, loadSpellCatalog, loadMagicItemCatalog, loadSkillAbilities } = require("../content/site-sources");
const { ContentError } = require("../content/errors");
const { CONTENT_DIR, createSchemaValidators, schemaErrors, readYamlFile, listYaml } = require("../content/yaml");

const DIR = path.join(CONTENT_DIR, "srd", "magic-items");
const WHERE = path.relative(ROOT, DIR).replace(/\\/g, "/");
// 彈藥在 equipment-data.js 只有名稱對照，沒有獨立清單；這裡列出物品欄使用的品名。
const AMMUNITION = Object.freeze(["箭矢", "弩矢", "子彈，火器", "彈丸，投石索", "針"]);
// id、base 是 magic 物件的欄位；form、pool、action 是基準檔「物品 id:form|pool|action:…」用的，不可當選項 id。
const RESERVED_OPTION_IDS = new Set(["id", "base", "form", "pool", "action"]);
// 只用於武器類（有基本款且不是護甲、盾牌）的 effects；finesse、thrown 另外要固定基本款。
const WEAPON_EFFECT_KEYS = Object.freeze(["extraDamage", "damageType", "finesse", "thrown", "proficiencyAs"]);
// 只用於護甲類（category: armor）的 effects：講的是這件護甲本身。
const ARMOR_EFFECT_KEYS = Object.freeze(["trained", "noStrengthRequirement", "noStealthDisadvantage"]);
// 提示裡產生固定說法的詞，只放在跑團總覽（panel 省略或 overview）。
const STRUCTURED_HINT_KEYS = Object.freeze(["resistances", "immunities", "darkvision", "languages", "advantage"]);

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

// 武器類：有基本款且不是護甲類別（武器、法杖、權杖）。效果加在拿著它的那一手。
function isWeaponLike(item) {
  return Boolean(item.base) && item.category !== "armor";
}

// 武器的屬性欄位最多 4 個（屬性1～屬性4）；靈巧、投擲會補進空的欄位。
function propertySlots(name) {
  const data = loadEquipmentData();
  const weapon = [...data.weapons_simple_melee, ...data.weapons_simple_ranged, ...data.weapons_martial_melee, ...data.weapons_martial_ranged].find(entry => entry["名稱"] === name);
  if (!weapon) return null;
  return [1, 2, 3, 4].filter(index => !String(weapon[`屬性${index}`] ?? "").trim() || /^-+$/.test(String(weapon[`屬性${index}`]).trim())).length;
}

function checkWeaponEffects(effects, at, { item, weaponNames }, errors) {
  const keys = WEAPON_EFFECT_KEYS.filter(key => effects[key] !== undefined);
  if (keys.length && !isWeaponLike(item)) errors.push(`${at}：${keys.join("、")} 只用於武器類（有基本款且不是護甲、盾牌）`);
  const added = ["finesse", "thrown"].filter(key => effects[key] !== undefined);
  if (added.length && item.base?.fixed === undefined) errors.push(`${at}：${added.join("、")} 只用於固定基本款的物品`);
  if (added.length && item.base?.fixed !== undefined && propertySlots(item.base.fixed) < added.length) errors.push(`${at}：基本款「${item.base.fixed}」的屬性欄位不夠放 ${added.join("、")}`);
  if (effects.thrown && effects.thrown[0] > effects.thrown[1]) errors.push(`${at}：thrown 的一般射程不可大於遠射程`);
  [...(effects.proficiencyAs || []), ...(effects.weapons?.names || []), ...(effects.proficiencies || [])].filter(name => !weaponNames.has(name)).forEach(name => errors.push(`${at}：「${name}」不是 equipment-data.js 的武器`));
  const armorKeys = ARMOR_EFFECT_KEYS.filter(key => effects[key] !== undefined);
  if (armorKeys.length && item.category !== "armor") errors.push(`${at}：${armorKeys.join("、")} 只用於護甲類`);
}

function checkHints(hints, at, { item, skills }, errors) {
  (hints || []).forEach((hint, index) => {
    const where = `${at} hints[${index}]`;
    const structured = STRUCTURED_HINT_KEYS.filter(key => hint[key] !== undefined);
    if (!structured.length && !hint.text) errors.push(`${where}：要有 text 或 ${STRUCTURED_HINT_KEYS.join("、")} 其中之一`);
    if (structured.length && (hint.panel || "overview") !== "overview") errors.push(`${where}：${structured.join("、")} 只放在跑團總覽（panel 省略或 overview）`);
    if (hint.panel === "weapon" && !isWeaponLike(item)) errors.push(`${where}：panel: weapon 只用於武器類`);
    if (hint.panel === "weapon" && hint.when) errors.push(`${where}：武器說明跟著拿在手上的武器，不寫 when`);
    (hint.advantage || []).filter(target => target !== "先攻" && !Object.hasOwn(skills, target)).forEach(target => errors.push(`${where}：advantage 的「${target}」不是技能 ID 或「先攻」`));
    if (hint.text && !/[。！？）]$/.test(hint.text)) errors.push(`${where}：text 以句號結尾`);
  });
}

function checkEffects(effects, at, { bonusOption, allowCondition, skills }, errors) {
  if (!effects) return;
  Object.keys(effects.skills || {}).filter(skill => !Object.hasOwn(skills, skill)).forEach(skill => errors.push(`${at}：skills 的「${skill}」不是技能 ID`));
  if (effects.movement?.hover && !effects.movement.fly) errors.push(`${at}：movement.hover 要和 fly 一起寫`);
  const values = Object.entries(effects).filter(([key]) => key !== "condition");
  if (!values.length) errors.push(`${at}：effects 沒有數值`);
  if (values.some(([, value]) => value === "bonus") && !bonusOption) errors.push(`${at}：effects 用 bonus 須有 bonus 選項`);
  if (effects.condition && !allowCondition) errors.push(`${at}：選項的 effects 不可寫 condition`);
  if (effects.condition && ["ac", "saves", "spellAttack", "spellSaveDc"].every(key => effects[key] === undefined)) errors.push(`${at}：effects.condition 只適用 ac、saves、spellAttack、spellSaveDc`);
}

function checkOptions(item, at, context, errors) {
  const { damageLabels } = context;
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
    option.choices.forEach((choice) => {
      const where = `${at} ${option.id}:${choice.value}`;
      checkEffects(choice.effects, where, { bonusOption: false, allowCondition: false, skills: context.skills }, errors);
      if (choice.effects) checkWeaponEffects(choice.effects, where, { item, ...context }, errors);
      checkHints(choice.hints, where, { item, ...context }, errors);
    });
  }
  if (item.rarity === "varies" && withRarity.length !== 1) errors.push(`${at}：rarity 為 varies 時，須剛好一組選項帶 rarity`);
  if (item.rarity !== "varies" && withRarity.length) errors.push(`${at}：選項帶 rarity 時，物品的 rarity 應為 varies`);
  if (item.rarityText && item.rarity !== "varies") errors.push(`${at}：rarityText 只用於 varies`);
}

function checkItem(item, context, errors) {
  const { lists, known, equipmentNames } = context;
  const at = item.file;
  if (item.equipmentName && !equipmentNames.has(item.equipmentName)) errors.push(`${at}：equipmentName「${item.equipmentName}」不是 equipment-data.js 的品名`);
  if (item.id !== expectedId(item.nameEn)) errors.push(`${at}：id 應為 ${expectedId(item.nameEn)}（由 nameEn 轉成）`);
  if (item.category === "wondrous" && !item.group) errors.push(`${at}：奇物須有 group`);
  if (item.category !== "wondrous" && item.group) errors.push(`${at}：只有奇物寫 group`);
  if (typeof item.attunement === "string" && !item.attunement.startsWith("由")) errors.push(`${at}：attunement 的限定條件以「由」開頭（顯示為「需由…同調」）`);
  checkBase(item, at, lists, known, errors);
  // 有基本款的物品（武器、護甲、盾牌、法杖等）用裝備欄位，不寫使用方式；其他有固定數值的物品要寫，才知道什麼時候生效。
  if (item.use && item.base) errors.push(`${at}：有 base 的物品用裝備欄位，不寫 use`);
  const hasEffects = Boolean(item.effects) || (item.options || []).some(option => option.choices.some(choice => choice.effects));
  if (!item.use && !item.base && hasEffects) errors.push(`${at}：有 effects 的物品須寫 use`);
  const allHints = [...(item.hints || []), ...(item.options || []).flatMap(option => option.choices.flatMap(choice => choice.hints || [])), ...(item.forms || []).flatMap(form => form.hints || [])];
  if (!item.use && !item.base && allHints.some(hint => hint.when !== "owned")) errors.push(`${at}：有 hints 的物品須寫 use（或 hints 寫 when: owned）`);
  if (item.use && item.effects?.condition === "held") errors.push(`${at}：寫了 use 的物品不用 effects.condition: held`);
  checkOptions(item, at, context, errors);
  checkEffects(item.effects, at, { bonusOption: (item.options || []).some(option => option.id === "bonus"), allowCondition: true, skills: context.skills }, errors);
  if (item.effects) checkWeaponEffects(item.effects, at, { item, ...context }, errors);
  checkHints(item.hints, at, { item, ...context }, errors);
  (item.forms || []).forEach((form) => {
    const where = `${at} 形態 ${form.id}`;
    checkEffects(form.effects, where, { bonusOption: false, allowCondition: false, skills: context.skills }, errors);
    if (form.effects) checkWeaponEffects(form.effects, where, { item, ...context }, errors);
    checkHints(form.hints, where, { item, ...context }, errors);
  });
  const tokens = (item.displayName || "").match(/\{[^}]*\}/g) || [];
  const allowed = new Set([...(item.base ? ["{base}"] : []), ...(item.options || []).map(option => `{${option.id}}`)]);
  tokens.filter(token => !allowed.has(token)).forEach(token => errors.push(`${at}：displayName 的 ${token} 不是基本款或選項`));
  const formIds = (item.forms || []).map(form => form.id);
  if (new Set(formIds).size !== formIds.length) errors.push(`${at}：forms 的 id 重複`);
  if (item.forms && item.base?.fixed === undefined) errors.push(`${at}：forms 只用於固定基本款的物品`);
  (item.forms || []).filter(form => form.base && !known.has(form.base)).forEach(form => errors.push(`${at}：形態 ${form.id} 的基本款「${form.base}」不是 equipment-data.js 的武器、護甲或盾牌`));
  if (item.bonusTransfer && !item.effects?.attack) errors.push(`${at}：bonusTransfer 要有 effects.attack`);
  if ((item.siteText || item.sitePrice) && !item.equipmentName) errors.push(`${at}：siteText、sitePrice 只用於寫了 equipmentName 的物品`);
  if (Boolean(item.siteText) !== Boolean(item.sitePrice)) errors.push(`${at}：siteText 與 sitePrice 要一起寫`);
  if (/[A-Za-z]{4,}/.test(item.text)) errors.push(`${at}：text 只放中文，不放英文內文`);
  checkPoolsAndActions(item, at, context, errors);
}

// 次數池與能力：id 不重複、能力扣的池存在、cost 要和 pool 一起寫、[最少, 最多] 不超過池的最大值；
// 能力的生效條件和效果相同，所以沒有基本款的物品要寫 use（或能力寫 when: owned）。
// 從物品施放的法術（spell）：法術存在、環階不低於法術本身、升環不超過 9 環（或 maxLevel）、數字來源擇一。
function checkPoolsAndActions(item, at, context, errors) {
  const pools = item.pools || [];
  const actions = item.actions || [];
  const poolIds = pools.map(pool => pool.id);
  if (new Set(poolIds).size !== poolIds.length) errors.push(`${at}：pools 的 id 重複`);
  pools.forEach((pool) => {
    const where = `${at} 池 ${pool.id}`;
    if (pool.cooldown && pool.recover !== "cooldown") errors.push(`${where}：cooldown 只用於 recover: cooldown`);
    if (pool.recover === "cooldown" && !pool.cooldown) errors.push(`${where}：recover: cooldown 要寫 cooldown（冷卻多久）`);
    if (pool.amount !== undefined && !pool.recover) errors.push(`${where}：amount 要和 recover 一起寫`);
    if (typeof pool.amount === "number" && pool.amount >= pool.max) errors.push(`${where}：amount 大於等於 max 時省略（全部恢復）`);
  });
  const actionIds = actions.map(action => action.id);
  if (new Set(actionIds).size !== actionIds.length) errors.push(`${at}：actions 的 id 重複`);
  actions.forEach((action) => {
    const where = `${at} 能力 ${action.id}`;
    const pool = pools.find(entry => entry.id === action.pool);
    if (action.pool && !pool) errors.push(`${where}：pool「${action.pool}」不是這件物品的 pools`);
    if (action.cost !== undefined && !action.pool) errors.push(`${where}：cost 要和 pool 一起寫`);
    if (Array.isArray(action.cost) && (action.cost[0] >= action.cost[1] || (pool && action.cost[1] > pool.max))) errors.push(`${where}：cost 的 [最少, 最多] 要由小到大，且不超過池的 max`);
    if (typeof action.cost === "number" && pool && action.cost > pool.max) errors.push(`${where}：cost 超過池的 max`);
    if (action.text && !/[。！？）]$/.test(action.text)) errors.push(`${where}：text 以句號結尾`);
    if (action.note && !/[。！？）]$/.test(action.note)) errors.push(`${where}：note 以句號結尾`);
    if (action.alsoPool && (!action.pool || action.alsoPool === action.pool || !pools.some(entry => entry.id === action.alsoPool))) errors.push(`${where}：alsoPool 要和 pool 一起寫，且是這件物品的另一個池`);
    Object.entries(action.option || {}).forEach(([optionId, value]) => {
      const option = (item.options || []).find(entry => entry.id === optionId);
      if (!option || !option.choices.some(choice => choice.value === value)) errors.push(`${where}：option 的 ${optionId}: ${value} 不是這件物品的選項`);
    });
    if (action.spell) checkItemSpell(action, where, context, errors);
    if (!item.use && !item.base && action.when !== "owned") errors.push(`${where}：沒有基本款的物品要寫 use（或能力寫 when: owned）`);
  });
}

function checkItemSpell(action, where, context, errors) {
  const spell = context.spells.getItemSpell(action.spell);
  if (!spell) { errors.push(`${where}：spell「${action.spell}」不是法術 ID`); return; }
  const level = action.level ?? spell.level;
  if (action.level !== undefined && action.level < spell.level) errors.push(`${where}：level 不可低於法術本身的 ${spell.level} 環`);
  if (spell.level === 0 && action.level !== undefined) errors.push(`${where}：戲法不寫 level`);
  const extra = Array.isArray(action.cost) ? action.cost[1] - action.cost[0] : 0;
  if (action.maxLevel !== undefined && (!extra || action.maxLevel <= level)) errors.push(`${where}：maxLevel 只用於 cost 是範圍時，且要高於 level`);
  if (extra && spell.level === 0) errors.push(`${where}：戲法不能多付花費升環`);
  if (extra && !action.maxLevel && level + extra > 9) errors.push(`${where}：多付花費會超過 9 環，請寫 maxLevel`);
  if (action.stats && (action.saveDc !== undefined || action.attackBonus !== undefined)) errors.push(`${where}：stats: yours 與 saveDc／attackBonus 擇一`);
  if (action.concentration === false && !spell.concentration) errors.push(`${where}：法術本身不需專注，不寫 concentration`);
  if (action.castingTime && spell.castingTimes.length === 1 && spell.castingTimes[0] === action.castingTime) errors.push(`${where}：castingTime 和法術本身相同，不需寫`);
}

// effects.abilities 的 setBonus：from 列的物品要存在，且在物品本身或選項寫了同一個屬性的 set（雷神之錘加在巨人之力腰帶、食人魔力量護手上）。
function checkAbilityReferences(items, errors) {
  const byId = new Map(items.map(item => [item.id, item]));
  const effectsOf = item => [item.effects, ...(item.forms || []).map(form => form.effects), ...(item.options || []).flatMap(option => option.choices.map(choice => choice.effects))].filter(Boolean);
  items.forEach(item => effectsOf(item).forEach(effects => Object.entries(effects.abilities || {}).forEach(([ability, effect]) => {
    (effect.from || []).forEach((id) => {
      const target = byId.get(id);
      if (!target) errors.push(`${item.file}：abilities.${ability}.from 的「${id}」不是魔法物品 id`);
      else if (id === item.id) errors.push(`${item.file}：abilities.${ability}.from 不可寫自己`);
      else if (!effectsOf(target).some(other => other.abilities?.[ability]?.set)) errors.push(`${item.file}：abilities.${ability}.from 的「${id}」沒有 ${ability} 的 set`);
    });
  })));
}

function checkUnique(items, field, errors) {
  const seen = new Set();
  items.forEach(item => {
    if (seen.has(item[field])) errors.push(`${WHERE}：${field}「${item[field]}」重複`);
    seen.add(item[field]);
  });
}

// 裝備欄位直接存魔法款的名稱，所以所有魔法武器、護甲、盾牌與手持物品（魔杖等）的可能名稱要彼此唯一，也不能與普通品名相撞。
function checkEquipmentNames(items, lists, equipmentNames) {
  const rules = Object.fromEntries(items.map(({ id, file, text, ...rule }) => [id, rule]));
  const owners = new Map();
  const errors = [];
  for (const { name, id, base } of loadMagicItemCatalog(rules, lists).getEquipmentVariants()) {
    const owner = base ? `${id}（${base}）` : id;
    if (equipmentNames.has(name)) errors.push(`${owner}：裝備名稱「${name}」與普通品名相撞`);
    if (owners.has(name) && owners.get(name) !== owner) errors.push(`${owner}：裝備名稱「${name}」與 ${owners.get(name)} 重複`);
    else if (owners.has(name)) errors.push(`${owner}：不同選項的裝備名稱都是「${name}」`);
    owners.set(name, owner);
  }
  if (errors.length) throw new ContentError(`魔法物品內容檢查失敗（${errors.length} 項）：\n- ${errors.slice(0, 40).join("\n- ")}`);
}

// 物品的固定順序依 SRD「魔法物品 A–Z」：英文名去掉「, +1, +2, or +3」，複數的 Potions 視為 Potion，只比字母與數字。
function orderKey(nameEn) {
  return nameEn.replace(/, \+1, \+2, or \+3$/, "").replace(/^Potions of/, "Potion of").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// 回傳 Map（物品 id → 內容，依 SRD 順序）與 baseLists（「任意某類」的展開清單）。
function loadMagicItems() {
  const validate = createSchemaValidators(["magic-item"])["magic-item"];
  const errors = [];
  const items = [];
  for (const file of listYaml(DIR)) {
    const where = path.relative(ROOT, file).replace(/\\/g, "/");
    let data;
    try { data = readYamlFile(file); } catch (error) { errors.push(error.message); continue; }
    if (!validate(data)) { errors.push(...schemaErrors(validate, where)); continue; }
    if (path.basename(file).replace(/\.ya?ml$/, "") !== data.id) errors.push(`${where}：檔名應為 ${data.id}.yaml`);
    items.push({ ...data, file: where });
  }
  const lists = loadBaseLists();
  const context = {
    lists,
    known: knownEquipment(lists),
    damageLabels: loadSpellCatalog().damageTypeLabels,
    spells: loadSpellCatalog(),
    equipmentNames: new Set(Object.keys(loadEquipmentData().EQUIPMENT_ENGLISH_NAMES)),
    weaponNames: new Set([...lists["simple-weapon"], ...lists["martial-weapon"]]),
    skills: loadSkillAbilities()
  };
  items.forEach(item => checkItem(item, context, errors));
  checkAbilityReferences(items, errors);
  ["id", "name", "nameEn"].forEach(field => checkUnique(items, field, errors));
  if (errors.length) throw new ContentError(`魔法物品內容檢查失敗（${errors.length} 項）：\n- ${errors.join("\n- ")}`);
  items.sort((a, b) => { const [x, y] = [orderKey(a.nameEn), orderKey(b.nameEn)]; return x < y ? -1 : x > y ? 1 : 0; });
  checkEquipmentNames(items, lists, context.equipmentNames);
  return { items: new Map(items.map(item => [item.id, item])), baseLists: lists };
}

module.exports = { loadMagicItems };

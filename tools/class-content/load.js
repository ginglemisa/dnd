// 讀取 content/<內容包>/classes 與 subclasses 的 YAML，做 schema 驗證與跨檔檢查。任何錯誤都丟出 ContentError。
"use strict";
const fs = require("fs");
const path = require("path");
const { ROOT, loadSkillAbilities, loadToolCatalog } = require("../content/site-sources");
const { ContentError } = require("../content/errors");
const { tableValueText } = require("../content/markdown");
const { CONTENT_DIR, createSchemaValidators, schemaErrors, readYamlFile, listYaml } = require("../content/yaml");

// 公開內容包在前；私人內容包（gitignore）存在時一併載入。
const PACKS = ["srd", "private"];
const BUILT_IN_VALUES = Object.freeze({ level: "character-level", proficiencyBonus: "proficiency-bonus" });
// 只能在 values 公式中引用的屬性調整值（沒有屬性值時視為 0）；文字不可直接寫 {dexModifier|…}。
const ABILITY_MODIFIERS = Object.freeze(["strModifier", "dexModifier", "conModifier", "intModifier", "wisModifier", "chaModifier"]);

let spellIds = null;
function getSpellIds() {
  spellIds ||= new Set(JSON.parse(fs.readFileSync(path.join(ROOT, "spell-id-baseline.json"), "utf8")));
  return spellIds;
}

// index.html 中下拉選單的選項值（spellsByChoice 的 control）；找不到選單時回傳 null。
let indexHtml = null;
function getIndexSelectValues(id) {
  indexHtml ??= fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const start = indexHtml.indexOf(`<select id="${id}"`);
  const select = start < 0 ? null : indexHtml.slice(start).match(/^[^>]*>([\s\S]*?)<\/select>/);
  return select ? new Set([...select[1].matchAll(/<option value="([^"]*)"/g)].map(match => match[1]).filter(Boolean)) : null;
}

function createValidators() {
  const kinds = { class: "class", subclass: "subclass", extension: "class-extension", multiclassRules: "multiclass-rules" };
  const validators = createSchemaValidators(["feature", ...Object.values(kinds)]);
  return Object.fromEntries(Object.entries(kinds).map(([kind, name]) => [kind, validators[name]]));
}

function loadContent({ packs = PACKS } = {}) {
  const validators = createValidators();
  const errors = [];
  const classes = new Map();
  const subclasses = [];
  const extensions = [];
  let multiclassRules = null;
  const read = (file, kind) => {
    const where = path.relative(ROOT, file).replace(/\\/g, "/");
    let data;
    try { data = readYamlFile(file); } catch (error) { errors.push(error.message); return null; }
    if (!validators[kind](data)) {
      errors.push(...schemaErrors(validators[kind], where));
      return null;
    }
    const expected = { class: data.id, subclass: `${data.class}-${data.id}`, extension: data.class, multiclassRules: "multiclass" }[kind];
    if (path.basename(file).replace(/\.ya?ml$/, "") !== expected) errors.push(`${where}：檔名應為 ${expected}.yaml`);
    return { ...data, file: where };
  };
  for (const pack of packs) {
    for (const file of listYaml(path.join(CONTENT_DIR, pack, "classes"))) {
      const data = read(file, "class");
      if (!data) continue;
      if (classes.has(data.id)) errors.push(`${data.file}：職業 ID「${data.id}」重複（${classes.get(data.id).file}）`);
      else classes.set(data.id, { ...data, pack, subclasses: [] });
    }
    for (const file of listYaml(path.join(CONTENT_DIR, pack, "subclasses"))) {
      const data = read(file, "subclass");
      if (data) subclasses.push({ ...data, pack });
    }
    // 內容包可補充其他內容包的職業（例如私人內容包為 SRD 職業加上兼職資料）。
    for (const file of listYaml(path.join(CONTENT_DIR, pack, "class-extensions"))) {
      const data = read(file, "extension");
      if (data) extensions.push(data);
    }
    const rulesFile = path.join(CONTENT_DIR, pack, "rules", "multiclass.yaml");
    if (fs.existsSync(rulesFile)) {
      const data = read(rulesFile, "multiclassRules");
      if (data && multiclassRules) errors.push(`${data.file}：兼職規則重複（${multiclassRules.file}）`);
      else if (data) multiclassRules = data;
    }
  }
  for (const extension of extensions) {
    const owner = classes.get(extension.class);
    if (!owner) { errors.push(`${extension.file}：找不到要補充的職業「${extension.class}」`); continue; }
    for (const [key, value] of Object.entries(extension)) {
      if (key === "class" || key === "file") continue;
      if (Object.hasOwn(owner, key)) errors.push(`${extension.file}：${key} 已由 ${owner.extendedBy?.[key] || owner.file} 定義`);
      else { owner[key] = value; (owner.extendedBy ||= {})[key] = extension.file; }
    }
  }
  const withMulticlass = [...classes.values()].find(classDef => classDef.multiclass);
  if (withMulticlass && !multiclassRules) errors.push(`${withMulticlass.extendedBy.multiclass}：有兼職資料時須提供 rules/multiclass.yaml`);
  for (const subclass of subclasses) {
    const owner = classes.get(subclass.class);
    if (!owner) errors.push(`${subclass.file}：找不到所屬職業「${subclass.class}」`);
    else if (owner.subclasses.some(item => item.id === subclass.id)) errors.push(`${subclass.file}：子職 ID「${subclass.id}」重複`);
    else owner.subclasses.push(subclass);
  }
  if (!errors.length) classes.forEach(classDef => checkClass(classDef, errors));
  // 選項給予的戲法須指向存在的職業法術列表。
  if (!errors.length) classes.forEach(classDef => [classDef, ...classDef.subclasses].forEach(owner => owner.features.forEach(feature => {
    (feature.options || []).filter(option => option.grants?.cantrips && !classes.has(option.grants.cantrips.list))
      .forEach(option => errors.push(`${owner.file}（${feature.name}）：選項 ${option.id} 的 grants.cantrips.list「${option.grants.cantrips.list}」不是職業 ID`));
  })));
  if (errors.length) throw new ContentError(`內容檢查失敗（${errors.length} 項）：\n- ${errors.join("\n- ")}`);
  return { classes, multiclassRules };
}

// 文字中 {名稱|…} 的來源：特性表欄位、values 或內建數值。
function getValueNames(classDef) {
  return new Set([...Object.keys(classDef.progression || {}), ...Object.keys(classDef.values || {}), ...Object.keys(BUILT_IN_VALUES)]);
}

// 選擇（picks）最多要幾個欄位：數字，或特性表欄位在 maxLevel 以內的最大值。
function pickSlotCount(classDef, pick) {
  if (typeof pick.count === "number") return pick.count;
  return Math.max(0, ...Object.values(classDef.progression?.[pick.count]?.byLevel || {}).filter(Number.isInteger));
}

// 選擇寫進存檔的欄位 ID：fields 沿用既有欄位；武器精通自動產生「能力ID-pick-序號」；其他種類沒有自己的欄位
// （專精、技能是既有的技能勾選框，法術書法術存在法術書）。
function getPickFields(classDef, feature, pick) {
  if (pick.fields) return pick.fields;
  if (pick.kind !== "weaponMastery") return [];
  return Array.from({ length: pickSlotCount(classDef, pick) }, (_, index) => `${feature.id}-pick-${index + 1}`);
}

// 能力的所有跑團按鈕：能力層、子能力（parts）與選項層。
function getActions(feature) {
  return [...(feature.actions || []), ...(feature.parts || []).flatMap(part => part.actions || []), ...(feature.options || []).flatMap(option => option.actions || [])];
}

// 職業附錄小節的跑團按鈕（例如魔能祈喚的魔能斬擊）。
function getAppendixActions(classDef) {
  return (classDef.appendix || []).flatMap(item => (item.parts || []).flatMap(part => part.actions || []));
}

const PICK_FROM = Object.freeze({
  weaponMastery: ["proficient"],
  expertise: ["proficient", "list"],
  skill: ["class", "any", "list"],
  language: ["any"],
  spellbookSpell: ["any"]
});

function checkPicks(classDef, feature, where, errors, claimField) {
  const skills = loadSkillAbilities();
  const checkSkills = (names, label) => names.filter(name => !Object.hasOwn(skills, name))
    .forEach(name => errors.push(`${where}：${label}的技能「${name}」不存在`));
  (feature.picks || []).forEach((pick, index) => {
    const label = `picks[${index}]（${pick.kind}）`;
    const from = Array.isArray(pick.from) ? "list" : pick.from;
    if (!PICK_FROM[pick.kind].includes(from)) errors.push(`${where}：${label}的 from 只能是 ${PICK_FROM[pick.kind].join("、")}`);
    if (Array.isArray(pick.from)) checkSkills(pick.from, label);
    if (typeof pick.count === "string" && !classDef.progression?.[pick.count]) errors.push(`${where}：${label}的 count「${pick.count}」不是特性表欄位`);
    if ((pick.school || pick.maxLevel) && pick.kind !== "spellbookSpell") errors.push(`${where}：${label}的 school／maxLevel 只用於 spellbookSpell`);
    if (pick.kind === "spellbookSpell" && !(pick.school && pick.maxLevel)) errors.push(`${where}：${label}須寫 school 與 maxLevel`);
    if (pick.exclude && pick.kind !== "language") errors.push(`${where}：${label}的 exclude 只用於語言`);
    if (pick.kind === "language" && !pick.fields) errors.push(`${where}：${label}須寫 fields（語言的存檔欄位）`);
    if (pick.fields && pick.kind !== "language") errors.push(`${where}：${label}的 fields 只用於語言`);
    if (pick.fields && pick.fields.length !== pickSlotCount(classDef, pick)) errors.push(`${where}：${label}的 fields 數量須等於 count`);
    getPickFields(classDef, feature, pick).forEach(claimField);
  });
  const grantSources = [{ grants: feature.grants, label: "grants" }, ...(feature.options || []).map(option => ({ grants: option.grants, label: `選項 ${option.id} 的 grants` }))];
  grantSources.filter(source => source.grants).forEach(({ grants, label }) => {
    (grants.languages || []).forEach(language => claimField(language.field));
    if (grants.checkBonus) checkSkills(grants.checkBonus.skills, `${label}.checkBonus `);
  });
  if (feature.grants && Object.keys(feature.grants).some(key => key !== "languages")) errors.push(`${where}：能力的 grants 目前只支援 languages（其他項目寫在選項）`);
}

// 職業層的熟練機制資料：工具須存在於 tool-data.js 的工具目錄。
function checkProficiencies(classDef, errors, claimField) {
  const tools = classDef.proficiencies?.tools;
  if (!tools) return;
  const catalog = loadToolCatalog();
  const groupIds = new Set(catalog.groups.map(group => group.id));
  if (tools.fixed && !catalog.isTool(tools.fixed)) errors.push(`${classDef.file}：proficiencies.tools.fixed「${tools.fixed}」不在工具目錄`);
  (tools.chooseFrom || []).filter(id => !groupIds.has(id)).forEach(id => errors.push(`${classDef.file}：proficiencies.tools.chooseFrom 的工具組「${id}」不存在`));
  if (tools.fixed) claimField(tools.field);
  else Array.from({ length: tools.count }, (_, index) => claimField(`${tools.field}${index + 1}`));
}

function checkClass(classDef, errors) {
  const featureIds = new Map();
  const persistedIds = new Map();
  const valueNames = getValueNames(classDef);
  const claim = (map, id, where, label) => {
    if (map.has(id)) errors.push(`${where}：${label}「${id}」重複（${map.get(id)}）`);
    else map.set(id, where);
  };
  if (!classDef.subclasses.some(subclass => subclass.id === classDef.defaultSubclass)) {
    errors.push(`${classDef.file}：defaultSubclass「${classDef.defaultSubclass}」沒有對應的子職檔`);
  }
  const subclassEntries = classDef.features.filter(feature => feature.type === "subclass");
  if (subclassEntries.length !== 1 || subclassEntries[0].level !== classDef.subclassLevel) {
    errors.push(`${classDef.file}：須有且只有一項 type: subclass 的能力，且等級等於 subclassLevel`);
  }
  for (const [name, column] of Object.entries(classDef.progression || {})) {
    const levels = Object.keys(column.byLevel).map(Number);
    if (!levels.includes(1)) errors.push(`${classDef.file}：特性表欄位 ${name} 須包含 1 級`);
    levels.filter(level => level > classDef.maxLevel).forEach(level => errors.push(`${classDef.file}：特性表欄位 ${name} 的 ${level} 級超過 maxLevel`));
  }
  checkProficiencies(classDef, errors, id => claim(persistedIds, id, classDef.file, "工具欄位 ID"));
  // 依等級的文字值（values 的 byLevel）只能用在文字的 {名稱|…}，不可用於公式、次數。
  const textValues = new Set(Object.entries(classDef.values || {}).filter(([, value]) => value.byLevel || value.fromTable).map(([name]) => name));
  const allFeatures = [classDef, ...classDef.subclasses].flatMap(owner => owner.features);
  for (const [name, value] of Object.entries(classDef.values || {})) {
    if (value.fromTable) {
      try { tableValueText(allFeatures, value.fromTable, `${classDef.file} values.${name}`); } catch (error) { errors.push(error.message); }
      continue;
    }
    if (textValues.has(name)) {
      Object.keys(value.byLevel).map(Number).filter(level => level > classDef.maxLevel).forEach(level => errors.push(`${classDef.file}：values.${name} 的 ${level} 級超過 maxLevel`));
      Object.values(value.byLevel).filter(text => /[<{}]|\*\*|\[\[/.test(text)).forEach(text => errors.push(`${classDef.file}：values.${name} 的文字不可含標記：${text}`));
      continue;
    }
    // { formula, format }：format 由 schema 確認含 {}，公式檢查同字串公式。
    const stripped = (value.formula ?? value).replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (all, token) => {
      if ((!valueNames.has(token) && !ABILITY_MODIFIERS.includes(token)) || token === name || textValues.has(token)) errors.push(`${classDef.file}：values.${name} 引用了不存在的數值 {${token}}`);
      return "1";
    });
    if (!/^[0-9d+\-*/(), ]+$/.test(stripped.replace(/\b(?:max|min|floor|ceil)\(/g, "("))) errors.push(`${classDef.file}：values.${name} 只能使用數字、d、四則運算、max()／min()／floor()／ceil() 與 {數值}`);
  }
  const sources = [{ owner: classDef, features: classDef.features }, ...classDef.subclasses.map(subclass => ({ owner: subclass, features: subclass.features }))];
  for (const { owner, features } of sources) {
    let previousLevel = 0;
    features.forEach((feature, index) => {
      const where = `${owner.file} features[${index}]${feature.name ? `（${feature.name}）` : ""}`;
      if (feature.level < previousLevel) errors.push(`${where}：能力須依等級排列`);
      previousLevel = feature.level;
      if (feature.level > classDef.maxLevel) errors.push(`${where}：等級超過職業的 maxLevel ${classDef.maxLevel}`);
      if (owner !== classDef && feature.level < classDef.subclassLevel) errors.push(`${where}：子職能力等級低於 subclassLevel`);
      if (owner !== classDef && feature.type) errors.push(`${where}：子職能力不可使用 type`);
      if (feature.id) claim(featureIds, feature.id, where, "能力 ID");
      if (feature.options && !feature.choose) errors.push(`${where}：有 options 時須寫 choose`);
      if (feature.choose && (!feature.options || feature.choose > feature.options.length)) errors.push(`${where}：choose 超過選項數`);
      if ((feature.changeOn || feature.choiceGroup || feature.optionStyle) && !feature.options) errors.push(`${where}：changeOn／choiceGroup／optionStyle 只用於有 options 的能力`);
      if (feature.choiceName && !feature.options && !feature.select) errors.push(`${where}：choiceName 只用於有 options 或 select 的能力`);
      if (feature.changeOn && feature.choiceGroup) errors.push(`${where}：changeOn 已自動標記選擇組，不必再寫 choiceGroup`);
      (feature.options || []).forEach(option => claim(persistedIds, option.id, where, "選項 ID"));
      if (feature.actions && (feature.options || []).some(option => option.actions)) errors.push(`${where}：能力層與選項層的 actions 只能擇一`);
      for (const part of feature.parts || []) {
        claim(featureIds, part.id, where, "子能力 ID");
        if (/^#/m.test(part.text) || /^#/m.test(part.tabletop || "")) errors.push(`${where} 子能力 ${part.name}：子能力的文字不可使用「#### 」小節`);
        if (new Set((part.actions || []).map(action => action.resource)).size > 1) errors.push(`${where} 子能力 ${part.name}：按鈕消耗的資源須相同（標題的消耗字樣只有一種）`);
      }
      getActions(feature).forEach(action => {
        if (action.source) errors.push(`${where}：動作 ${action.key} 的 source 只用於魔能祈喚附錄的小節`);
        if (action.selectedOptionOnly && !(feature.actions || []).includes(action)) errors.push(`${where}：selectedOptionOnly 只用於能力層的按鈕`);
        if (action.selectedOptionOnly && !feature.options) errors.push(`${where}：selectedOptionOnly 的能力須有 options`);
        if (action.tabletopAlso === action.mode) errors.push(`${where}：動作 ${action.key} 的 tabletopAlso 與 mode 相同`);
        claim(persistedIds, action.key, where, "動作 key");
        (action.legacyKeys || []).forEach(key => claim(persistedIds, key, where, "舊動作 key"));
        Object.keys(action.label?.byLevel || {}).map(Number).filter(level => level < (action.level ?? feature.level) || level > classDef.maxLevel)
          .forEach(level => errors.push(`${where}：動作 ${action.key} 的 label.byLevel ${level} 級不可低於按鈕出現等級或超過 maxLevel`));
      });
      if (feature.resource) {
        claim(persistedIds, feature.resource.key, where, "資源 key");
        if (typeof feature.resource.uses === "string" && (!valueNames.has(feature.resource.uses) || textValues.has(feature.resource.uses))) errors.push(`${where}：resource.uses「${feature.resource.uses}」不是特性表欄位或數值公式`);
        for (const match of (feature.resource.note || "").matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g)) {
          if (!valueNames.has(match[1]) || textValues.has(match[1])) errors.push(`${where}：resource.note 引用了不存在的數值 {${match[1]}}`);
        }
        const restChoice = feature.resource.restChoice;
        if (restChoice && (!valueNames.has(restChoice.budget) || textValues.has(restChoice.budget))) errors.push(`${where}：resource.restChoice.budget「${restChoice.budget}」不是特性表欄位或數值公式`);
        if (restChoice && (restChoice.restores === "points") !== Boolean(restChoice.target)) errors.push(`${where}：resource.restChoice 恢復點數（restores: points）時須寫 target，恢復法術位時不寫`);
        if (restChoice?.maxSlotLevel && restChoice.restores !== "spellSlots") errors.push(`${where}：resource.restChoice.maxSlotLevel 只用於恢復法術位`);
        Object.keys(feature.resource.recoverByLevel || {}).map(Number).filter(level => level <= feature.level || level > classDef.maxLevel)
          .forEach(level => errors.push(`${where}：resource.recoverByLevel 的 ${level} 級須高於能力等級且不超過 maxLevel`));
      }
      // behavior 排版 text 中標題寫成「#### 標題 {#名稱}」的小節：須有且只有一個（名稱不符或寫在其他欄位時由渲染報錯）。
      if (feature.behavior && !fs.existsSync(path.join(__dirname, "behaviors", `${feature.behavior}.js`))) errors.push(`${where}：找不到 tools/class-content/behaviors/${feature.behavior}.js`);
      if (feature.behavior && (feature.text || "").split(/\r?\n/).filter(line => /^#### /.test(line) && line.trimEnd().endsWith(`{#${feature.behavior}}`)).length !== 1) {
        errors.push(`${where}：behavior: ${feature.behavior} 的 text 須有一個「#### 標題 {#${feature.behavior}}」小節`);
      }
      // spell-id-baseline.json 由建置與法術內容檔比對（只列角色可用、有網站版的法術）。
      const choiceSpells = (feature.spellsByChoice?.choices || []).flatMap(choice => choice.spells);
      for (const spell of [...(feature.spells || []), ...choiceSpells]) {
        if (!getSpellIds().has(spell.id)) errors.push(`${where}：法術 ID「${spell.id}」不存在於 spell-id-baseline.json`);
        if (typeof spell.freeUses === "string" && (!valueNames.has(spell.freeUses) || textValues.has(spell.freeUses))) errors.push(`${where}：法術 ${spell.id} 的 freeUses「${spell.freeUses}」不是特性表欄位或數值公式`);
        if (spell.level !== undefined && (spell.level < feature.level || spell.level > classDef.maxLevel)) errors.push(`${where}：法術 ${spell.id} 的 level 須介於能力等級與 maxLevel 之間`);
      }
      // 子職法術的來源識別碼（subclass-職業-名稱-…）會寫進存檔；依選項給予的法術讀取 index.html 的下拉選單。
      if ((feature.spellsByChoice || feature.spellSourceKey) && owner === classDef) errors.push(`${where}：spellsByChoice／spellSourceKey 只用於子職能力`);
      if (feature.spellSourceKey && !feature.spells && !feature.spellsByChoice) errors.push(`${where}：spellSourceKey 只用於有 spells／spellsByChoice 的能力`);
      if (feature.spells && feature.spellsByChoice) errors.push(`${where}：spells 與 spellsByChoice 只能擇一`);
      if (feature.spellsByChoice) {
        const { control, choices } = feature.spellsByChoice;
        const values = choices.map(choice => choice.value);
        if (new Set(values).size !== values.length) errors.push(`${where}：spellsByChoice 的選項值重複`);
        const options = getIndexSelectValues(control);
        if (!options) errors.push(`${where}：index.html 找不到下拉選單 #${control}`);
        else values.filter(value => !options.has(value)).forEach(value => errors.push(`${where}：下拉選單 #${control} 沒有選項值「${value}」`));
      }
      // 可收合小節：不可再有小節；跑團說明與總覽讀取整段，寫 tabletop／summary 會漏掉可收合小節。
      for (const item of feature.collapsible || []) {
        if (/^#/m.test(item.text)) errors.push(`${where} 可收合小節 ${item.name}：文字不可使用「#### 」小節`);
      }
      if (feature.collapsible && (feature.tabletop || feature.summary)) errors.push(`${where}：有 collapsible 的能力不可寫 tabletop／summary`);
      // 下拉選擇卡片：ID 與能力的選項 ID 共用命名空間；跑團說明與總覽讀取整段（含卡片說明），故不可寫 tabletop／summary。
      if (feature.select) {
        claim(persistedIds, feature.select.id, where, "下拉選單 ID");
        const values = feature.select.choices.map(choice => choice.value);
        if (new Set(values).size !== values.length) errors.push(`${where}：下拉選單 ${feature.select.id} 的選項值重複`);
        if (/^#/m.test(feature.select.text || "")) errors.push(`${where}：下拉選擇卡片的文字不可使用「#### 」小節`);
        if (feature.tabletop || feature.summary) errors.push(`${where}：有 select 的能力不可寫 tabletop／summary`);
      }
      // 選擇（picks）與固定獲得（grants）：數量、範圍與存檔欄位。
      checkPicks(classDef, feature, where, errors, id => claim(persistedIds, id, where, "選擇欄位 ID"));
      // 4 級額外戲法選單的標籤：網站由 classRules 取得，須和 afterFeatChoice 文字裡的粗體標籤一致。
      if (feature.cantripChoiceLabel && !feature.afterFeatChoice?.includes(`**${feature.cantripChoiceLabel}`)) errors.push(`${where}：afterFeatChoice 須以粗體寫出 cantripChoiceLabel「${feature.cantripChoiceLabel}」`);
      // 插入點：DOM ID 與選項、下拉選單 ID 同在職業頁上，不可重複。
      if (feature.mount) claim(persistedIds, feature.mount.id, where, "插入點 ID");
      const partTexts = (feature.parts || []).flatMap(part => [part.text, part.tabletop, part.summary]);
      const collapsibleTexts = (feature.collapsible || []).map(item => item.text);
      for (const text of [feature.text, feature.tabletop, feature.summary, feature.afterFeatChoice, feature.select?.text, ...collapsibleTexts, ...partTexts, ...(feature.options || []).map(option => option.text)].filter(Boolean)) {
        for (const match of text.matchAll(/\{([A-Za-z][A-Za-z0-9]*)\|/g)) {
          if (!valueNames.has(match[1])) errors.push(`${where}：文字引用了不存在的數值 {${match[1]}|…}`);
        }
      }
    });
  }
  // 附錄小節：ID 與能力共用命名空間；沒有能力等級可沿用，按鈕須寫 level。
  (classDef.appendix || []).forEach((item, index) => {
    const where = `${classDef.file} appendix[${index}]（${item.name}）`;
    if (item.parts && /^#/m.test(item.text || "")) errors.push(`${where}：有 parts 時 text 不可使用「#### 」小節（小節寫在 parts）`);
    if (item.kind && !item.parts) errors.push(`${where}：kind 附錄的選項須寫成 parts`);
    if (item.kind && classDef.appendix.filter(other => other.kind === item.kind).length > 1) errors.push(`${where}：kind「${item.kind}」重複`);
    const partNames = new Set();
    for (const part of item.parts || []) {
      if (part.id) claim(featureIds, part.id, where, "附錄小節 ID");
      if (partNames.has(part.name)) errors.push(`${where}：附錄小節名稱「${part.name}」重複`);
      partNames.add(part.name);
      if (part.detail && part.prerequisite) errors.push(`${where} 附錄小節 ${part.name}：detail 與 prerequisite 只能擇一`);
      if (part.level > classDef.maxLevel) errors.push(`${where} 附錄小節 ${part.name}：level 超過 maxLevel`);
      if (part.spell && !getSpellIds().has(part.spell.id)) errors.push(`${where} 附錄小節 ${part.name}：法術 ID「${part.spell.id}」不存在於 spell-id-baseline.json`);
      for (const match of part.text.matchAll(/\{([A-Za-z][A-Za-z0-9]*)\|/g)) {
        if (!valueNames.has(match[1])) errors.push(`${where} 附錄小節 ${part.name}：文字引用了不存在的數值 {${match[1]}|…}`);
      }
      for (const action of part.actions || []) {
        if (action.source === "invocation" && item.kind !== "invocations") errors.push(`${where} 附錄小節 ${part.name}：source: invocation 只用於 kind: invocations 的附錄`);
        if (action.selectedOptionOnly) errors.push(`${where} 附錄小節 ${part.name}：附錄小節的動作不支援 selectedOptionOnly`);
        claim(persistedIds, action.key, where, "動作 key");
        (action.legacyKeys || []).forEach(key => claim(persistedIds, key, where, "舊動作 key"));
        if (action.level === undefined) errors.push(`${where} 附錄小節 ${part.name}：動作 ${action.key} 須寫 level（附錄沒有等級）`);
        if (action.append) errors.push(`${where} 附錄小節 ${part.name}：附錄小節的動作不支援 append`);
        Object.keys(action.label?.byLevel || {}).map(Number).filter(level => level < (action.level ?? 1) || level > classDef.maxLevel)
          .forEach(level => errors.push(`${where}：動作 ${action.key} 的 label.byLevel ${level} 級不可低於按鈕出現等級或超過 maxLevel`));
      }
    }
  });
  // 動作的 append 與 resource 須指向本職業的能力與資源。
  const resourceKeys = new Set(sources.flatMap(({ features }) => features.map(feature => feature.resource?.key).filter(Boolean)));
  getAppendixActions(classDef).filter(action => action.resource && !resourceKeys.has(action.resource))
    .forEach(action => errors.push(`${classDef.file} appendix：動作消耗的資源「${action.resource}」沒有定義`));
  const partIds = new Set([
    ...sources.flatMap(({ features }) => features.flatMap(feature => (feature.parts || []).map(part => part.id))),
    ...(classDef.appendix || []).flatMap(item => (item.parts || []).map(part => part.id).filter(Boolean))
  ]);
  const appendedIds = new Set(sources.flatMap(({ features }) => features.flatMap(feature => getActions(feature).flatMap(action => action.append || []))));
  for (const { owner, features } of sources) {
    for (const feature of features) {
      if (feature.tabletop && !feature.actions && !appendedIds.has(feature.id)) {
        errors.push(`${owner.file}（${feature.name}）：有 tabletop 的能力須有 actions，或被其他動作 append`);
      }
      (feature.parts || []).filter(part => part.tabletop && !part.actions).forEach(part => errors.push(`${owner.file}（${feature.name}）：子能力 ${part.name} 有 tabletop 時須有 actions`));
      for (const action of getActions(feature)) {
        (action.append || []).forEach(id => {
          if (!featureIds.has(id) || partIds.has(id)) errors.push(`${owner.file}（${feature.name}）：append 的能力「${id}」不存在（子能力不可被 append）`);
        });
        if (action.resource && !resourceKeys.has(action.resource)) errors.push(`${owner.file}（${feature.name}）：動作消耗的資源「${action.resource}」沒有定義`);
      }
    }
  }
}

module.exports = { loadContent, getActions, getAppendixActions, getPickFields, BUILT_IN_VALUES };

// 讀取 content/srd/races 的種族內容檔，做 schema 驗證與跨檔檢查。任何錯誤都丟出 ContentError。
// 私人內容包目前不支援種族：種族與血統選單是 index.html 的固定選項，沒有插入私人選項的機制。
"use strict";
const fs = require("fs");
const path = require("path");
const { ROOT, loadSkillAbilities, contentSourceName, loadSpellCatalog, readIndexSelectOptions } = require("../content/site-sources");
const { ContentError } = require("../content/errors");
const { CONTENT_DIR, createSchemaValidators, schemaErrors, readYamlFile, listYaml } = require("../content/yaml");

const PDF_PLACEHOLDERS = new Set(["proficiency", "choice", "conModifier", "breathSaveDc", "breathDice"]);

// 選項的預設文字：label 預設 name、pdfLabel 預設 label、draftValue 預設小節標題（name，有 subtitle 時加括號）。
const optionHeading = option => option.subtitle ? `${option.name}（${option.subtitle}）` : option.name;
const optionLabel = option => option.label || option.name;
const optionPdfLabel = option => option.pdfLabel || optionLabel(option);
const optionDraftValue = option => option.draftValue || optionHeading(option);

// 種族的全部跑團動作，依種族頁順序（血統選項的動作接在 choice 特質之後），附上所屬的特質或選項。
function getRaceActions(race) {
  return race.traits.flatMap(trait => [
    ...(trait.actions || []).map(action => ({ action, trait })),
    ...(trait.choice ? race.choice.options.flatMap(option => (option.actions || []).map(action => ({ action, option }))) : [])
  ]);
}

// 回傳 Map（種族 ID → 內容，依檔名排序）。
function loadRaces() {
  const errors = [];
  const privateDir = path.join(CONTENT_DIR, "private", "races");
  if (fs.existsSync(privateDir)) errors.push("content/private/races/：私人內容包尚未支援種族（種族與血統選單是 index.html 的固定選項），請移除此資料夾");
  const validate = createSchemaValidators(["feature", "race"]).race;
  const races = new Map();
  for (const file of listYaml(path.join(CONTENT_DIR, "srd", "races"))) {
    const where = path.relative(ROOT, file).replace(/\\/g, "/");
    let data;
    try { data = readYamlFile(file); } catch (error) { errors.push(error.message); continue; }
    if (!validate(data)) { errors.push(...schemaErrors(validate, where)); continue; }
    if (path.basename(file).replace(/\.ya?ml$/, "") !== data.id) errors.push(`${where}：檔名應為 ${data.id}.yaml`);
    if (races.has(data.id)) errors.push(`${where}：種族 ID「${data.id}」重複（${races.get(data.id).file}）`);
    else races.set(data.id, { ...data, file: where });
  }
  if (!errors.length) {
    races.forEach(race => checkRace(race, errors));
    checkUniqueAcrossRaces(races, errors);
    checkIndexSelects(races, errors);
  }
  if (errors.length) throw new ContentError(`種族內容檢查失敗（${errors.length} 項）：\n- ${errors.join("\n- ")}`);
  return races;
}

function checkRace(race, errors) {
  const where = race.file;
  const catalog = loadSpellCatalog();
  const skills = loadSkillAbilities();
  const choice = race.choice;
  const options = choice?.options || [];
  const display = choice?.display.type;
  const traitIds = new Set();
  race.traits.forEach(trait => {
    if (traitIds.has(trait.id)) errors.push(`${where}：特質 ID「${trait.id}」重複`);
    traitIds.add(trait.id);
    if (!trait.text && !(trait.id === "darkvision" && race.darkvision)) errors.push(`${where}：特質「${trait.name}」須有 text（只有 id 為 darkvision 且種族有 darkvision 時可省略）`);
    if (trait.afterChoice && !trait.choice) errors.push(`${where}：特質「${trait.name}」有 afterChoice 時須寫 choice: true`);
    if (trait.afterChoice && display !== "lineage-table") errors.push(`${where}：afterChoice 只能接在 lineage-table 表格之後`);
    if (Array.isArray(trait.skillChoice)) trait.skillChoice.forEach(skill => {
      if (!Object.hasOwn(skills, skill)) errors.push(`${where}：技能「${skill}」不在 character-rules.js 的 CharacterSkillAbilities`);
    });
    const resource = trait.resource;
    if (resource) {
      const checkboxes = resource.kind === "checkboxes";
      if (checkboxes !== Boolean(resource.container && resource.checkbox)) errors.push(`${where}：資源「${resource.key}」的 container 與 checkbox 只能（且必須）用在 kind: checkboxes`);
      if (resource.requiresChoice && (!checkboxes || !choice)) errors.push(`${where}：資源「${resource.key}」的 requiresChoice 只能用在有 choice 的種族的 checkboxes 資源`);
      if ((resource.kind === "inspiration") === Boolean(resource.uses)) errors.push(`${where}：資源「${resource.key}」${resource.kind === "inspiration" ? "（inspiration）不可寫" : "須寫"} uses`);
      if (resource.recover && resource.kind) errors.push(`${where}：資源「${resource.key}」的 recover 只能用在次數資源`);
    }
  });
  const choiceTraits = race.traits.filter(trait => trait.choice);
  if (choice ? choiceTraits.length !== 1 : choiceTraits.length) errors.push(`${where}：有 choice 時須剛好一個特質寫 choice: true（沒有 choice 時不可寫）`);

  const values = new Set();
  const drafts = new Set();
  options.forEach(option => {
    const at = `${where} 選項「${option.value}」`;
    if (values.has(option.value)) errors.push(`${at}：選項值重複`);
    values.add(option.value);
    if (drafts.has(optionDraftValue(option))) errors.push(`${at}：快速創角的值「${optionDraftValue(option)}」重複`);
    drafts.add(optionDraftValue(option));
    if (option.description && !option.short) errors.push(`${at}：有 description 時須寫 short`);
    if (Boolean(option.text) !== (display === "sections")) errors.push(`${at}：text ${display === "sections" ? "必填（display 為 sections）" : "只能用在 display 為 sections"}`);
    if (option.actions && display !== "sections") errors.push(`${at}：選項的 actions 只能用在 display 為 sections`);
    if (Boolean(option.damage) !== (display === "ancestry-table")) errors.push(`${at}：damage ${display === "ancestry-table" ? "必填（display 為 ancestry-table）" : "只能用在 ancestry-table"}`);
    if (option.cantripChoice) {
      const cantrips = catalog.getSpells(option.cantripChoice.spellList, "cantrips");
      if (!cantrips.length) errors.push(`${at}：cantripChoice 的法術表「${option.cantripChoice.spellList}」沒有戲法`);
      else if (!cantrips.some(spell => spell.spellId === option.cantripChoice.default)) errors.push(`${at}：預設戲法「${option.cantripChoice.default}」不在 ${option.cantripChoice.spellList} 戲法表`);
    }
    Object.keys(option.pdf || {}).forEach(level => {
      if (!pdfChoiceLevels(race.pdf.lines).has(Number(level))) errors.push(`${at}：pdf 的 ${level} 級沒有被種族 pdf 的 { choice: ${level} } 使用`);
    });
    (option.pdf ? Object.values(option.pdf).flat() : []).forEach(line => checkPdfPlaceholders(line, at, errors));
  });
  if (display === "lineage-table" && !choice.display.label) errors.push(`${where}：lineage-table 須寫 display.label`);
  if (display === "ancestry-table" && !(choice.display.label && choice.display.columns)) errors.push(`${where}：ancestry-table 須寫 display.label 與 display.columns`);

  [...race.traits.map(trait => [trait.spells, `特質「${trait.name}」`]), ...options.map(option => [option.spells, `選項「${option.value}」`])].forEach(([spells, at]) => {
    (spells || []).forEach(entry => {
      const spell = catalog.getSpell(entry.spell);
      if (!spell) errors.push(`${where} ${at}：法術「${entry.spell}」不是可用法術（content/srd/spells 中有 site 區塊的法術）`);
      else if (spell.level === 0 && entry.freeUses) errors.push(`${where} ${at}：戲法「${entry.spell}」不可寫 freeUses`);
    });
  });

  const resources = new Set(race.traits.flatMap(trait => trait.resource ? [trait.resource.key, trait.resource.container].filter(Boolean) : []));
  getRaceActions(race).forEach(({ action }) => {
    if (action.resource && !resources.has(action.resource)) errors.push(`${where} 動作「${action.id}」：resource「${action.resource}」不是此種族的資源 key 或 container`);
    if (action.behavior && action.tabletop) errors.push(`${where} 動作「${action.id}」：behavior 與 tabletop 只能擇一`);
  });

  if (!choice && (race.pdf.choiceFallback || pdfChoiceLevels(race.pdf.lines).size)) errors.push(`${where}：沒有 choice 的種族，pdf 不可用 choiceFallback 或 { choice }`);
  if (choice && !race.pdf.choiceFallback) errors.push(`${where}：有 choice 的種族，pdf 須寫 choiceFallback`);
  flattenPdfStrings(race.pdf.lines).forEach(line => checkPdfPlaceholders(line, `${where} pdf`, errors));
  if (/\n\n\n/.test(race.description)) errors.push(`${where}：description 的段落之間只空一行`);
  if (/[<>]|\*\*|\[\[/.test(race.description)) errors.push(`${where}：description 只能是純文字`);

  (race.languageOptions || []).forEach(language => {
    const listed = readIndexSelectOptions("language1") || [];
    if (!listed.some(option => option.value === language)) errors.push(`${where}：語言「${language}」不在 index.html 的語言選單`);
  });
}

function pdfChoiceLevels(lines, found = new Set()) {
  lines.forEach(line => {
    if (typeof line === "string") return;
    if (line.choice) found.add(line.choice);
    if (line.lines) pdfChoiceLevels(line.lines, found);
  });
  return found;
}

function flattenPdfStrings(lines) {
  return lines.flatMap(line => typeof line === "string" ? [line] : line.lines ? flattenPdfStrings(line.lines) : line.fallback);
}

function checkPdfPlaceholders(line, where, errors) {
  for (const match of line.matchAll(/\{([^{}]*)\}/g)) {
    if (!PDF_PLACEHOLDERS.has(match[1])) errors.push(`${where}：「${line}」的 {${match[1]}} 不是 PDF 可用的數值（可用：${[...PDF_PLACEHOLDERS].join("、")}）`);
  }
}

// 跑團動作 key、資源 key、選單 ID 在所有種族間不可重複。
function checkUniqueAcrossRaces(races, errors) {
  const seen = new Map();
  const claim = (kind, id, owner) => {
    const key = `${kind}:${id}`;
    if (seen.has(key)) errors.push(`${owner}：${kind}「${id}」與 ${seen.get(key)} 重複`);
    else seen.set(key, owner);
  };
  races.forEach(race => {
    getRaceActions(race).forEach(({ action }) => claim("動作 key", action.key, race.file));
    race.traits.forEach(trait => { if (trait.resource) claim("資源 key", trait.resource.key, race.file); });
    if (race.choice) claim("選單 ID", race.choice.id, race.file);
  });
}

// index.html 的種族選單與各血統選單（固定選項）須與內容檔相同：選項值、顯示文字與空值選項的提示文字。
function checkIndexSelects(races, errors) {
  const raceOptions = readIndexSelectOptions("race");
  if (!raceOptions) { errors.push("index.html 找不到 <select id=\"race\">"); return; }
  const listed = raceOptions.filter(option => option.value);
  listed.forEach(option => {
    const race = races.get(option.value);
    if (!race) { errors.push(`index.html 的種族選單有「${option.value}」，但沒有 content/srd/races/${option.value}.yaml`); return; }
    const expected = contentSourceName(race.name, race.source);
    if (option.label !== expected) errors.push(`index.html 的種族選單「${option.value}」顯示為「${option.label}」，應為「${expected}」`);
  });
  if (listed.map(option => option.value).join() !== [...races.keys()].join()) errors.push(`index.html 的種族選單應依序列出：${[...races.keys()].join("、")}`);
  races.forEach(race => {
    if (!race.choice) return;
    const options = readIndexSelectOptions(race.choice.id);
    if (!options) { errors.push(`${race.file}：index.html 找不到 <select id="${race.choice.id}">`); return; }
    const expected = [{ value: "", label: `--請選擇${race.choice.label}--` }, ...race.choice.options.map(option => ({ value: option.value, label: optionLabel(option) }))];
    if (JSON.stringify(options) !== JSON.stringify(expected)) errors.push(`${race.file}：index.html 的 <select id="${race.choice.id}"> 應為 ${expected.map(option => `${option.value || "（空）"}=${option.label}`).join("、")}`);
  });
}

module.exports = { loadRaces, getRaceActions, optionHeading, optionLabel, optionPdfLabel, optionDraftValue };

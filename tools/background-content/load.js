// 讀取 content/srd/backgrounds 的背景內容檔，做 schema 驗證與跨檔檢查。任何錯誤都丟出 ContentError。
// 私人內容包目前不支援背景：背景選單是 index.html 的固定選項，沒有插入私人選項的機制。
"use strict";
const fs = require("fs");
const path = require("path");
const { ROOT, loadSkillAbilities, contentSourceLabel, loadToolCatalog, readIndexSelectOptions } = require("../content/site-sources");
const { ContentError } = require("../content/errors");
const { CONTENT_DIR, createSchemaValidators, schemaErrors, readYamlFile, listYaml } = require("../content/yaml");

// 選單中不是背景內容檔的選項：未選擇與自訂背景（custom-background.js）。
const NON_CONTENT_OPTIONS = new Set(["", "custom"]);

// classes：職業內容（魔法學徒的 spellList 須是職業 ID）；feats：專長內容（背景專長須是起源專長）。回傳 Map（背景 ID → 內容，依檔名排序）。
function loadBackgrounds(classes, feats) {
  const errors = [];
  const privateDir = path.join(CONTENT_DIR, "private", "backgrounds");
  if (fs.existsSync(privateDir)) errors.push("content/private/backgrounds/：私人內容包尚未支援背景（背景選單是 index.html 的固定選項），請移除此資料夾");
  const validate = createSchemaValidators(["feature", "background"]).background;
  const backgrounds = new Map();
  for (const file of listYaml(path.join(CONTENT_DIR, "srd", "backgrounds"))) {
    const where = path.relative(ROOT, file).replace(/\\/g, "/");
    let data;
    try { data = readYamlFile(file); } catch (error) { errors.push(error.message); continue; }
    if (!validate(data)) { errors.push(...schemaErrors(validate, where)); continue; }
    if (path.basename(file).replace(/\.ya?ml$/, "") !== data.id) errors.push(`${where}：檔名應為 ${data.id}.yaml`);
    if (backgrounds.has(data.id)) errors.push(`${where}：背景 ID「${data.id}」重複（${backgrounds.get(data.id).file}）`);
    else backgrounds.set(data.id, { ...data, file: where });
  }
  if (!errors.length) {
    backgrounds.forEach(background => checkBackground(background, classes, feats, errors));
    checkIndexSelect(backgrounds, errors);
  }
  if (errors.length) throw new ContentError(`背景內容檢查失敗（${errors.length} 項）：\n- ${errors.join("\n- ")}`);
  return backgrounds;
}

function checkBackground(background, classes, feats, errors) {
  const where = background.file;
  const skills = loadSkillAbilities();
  background.skills.forEach(skill => {
    if (!Object.hasOwn(skills, skill)) errors.push(`${where}：技能「${skill}」不在 character-rules.js 的 CharacterSkillAbilities`);
  });
  const catalog = loadToolCatalog();
  const group = typeof background.tool === "string" ? null : catalog.groups.find(item => item.id === background.tool.chooseFrom);
  if (typeof background.tool === "string") {
    if (!catalog.isTool(background.tool)) errors.push(`${where}：工具「${background.tool}」不在 tool-data.js 的工具目錄`);
  } else if (!group) {
    errors.push(`${where}：工具組「${background.tool.chooseFrom}」不在 tool-data.js（可用：${catalog.groups.map(item => item.id).join("、")}）`);
  }
  if (!group && background.equipment.A.items.some(item => typeof item !== "string")) errors.push(`${where}：裝備的 toolChoice 只能用在 tool 為 chooseFrom 的背景`);
  const featId = typeof background.feat === "string" ? background.feat : background.feat.id;
  if (!feats.has(featId)) errors.push(`${where}：專長「${featId}」沒有 content/srd/feats/${featId}.yaml`);
  else if (feats.get(featId).type !== "origin") errors.push(`${where}：專長「${featId}」不是起源專長（type 須為 origin）`);
  if (background.feat.spellList && !classes.has(background.feat.spellList)) errors.push(`${where}：魔法學徒的法術列表「${background.feat.spellList}」不是職業 ID`);
  if (/\n./.test(background.description.replace(/\n+$/, ""))) errors.push(`${where}：description 只能有一段（不可換行）`);
}

// index.html 的背景選單（固定選項）須剛好列出全部背景內容檔，顯示文字為名稱，有來源標籤時加「(標籤)」（標籤取自 character-rules.js）。
function checkIndexSelect(backgrounds, errors) {
  const options = readIndexSelectOptions("background");
  if (!options) { errors.push("index.html 找不到 <select id=\"background\">"); return; }
  const listed = options.filter(option => !NON_CONTENT_OPTIONS.has(option.value));
  listed.forEach(option => {
    const background = backgrounds.get(option.value);
    if (!background) errors.push(`index.html 的背景選單有「${option.value}」，但沒有 content/srd/backgrounds/${option.value}.yaml`);
    else {
      const label = contentSourceLabel(background.source);
      const expected = `${background.name}${label ? `(${label})` : ""}`;
      if (option.label !== expected) errors.push(`index.html 的背景選單「${option.value}」顯示為「${option.label}」，應為「${expected}」`);
    }
  });
  backgrounds.forEach((background, id) => {
    if (!listed.some(option => option.value === id)) errors.push(`${background.file}：index.html 的背景選單沒有「${id}」選項`);
  });
}

module.exports = { loadBackgrounds };

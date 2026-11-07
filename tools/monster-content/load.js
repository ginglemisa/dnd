// 讀取 content/srd/monsters 的怪物內容檔，做 schema 驗證與檢查。任何錯誤都丟出 ContentError。
"use strict";
const path = require("path");
const { ROOT } = require("../content/site-sources");
const { ContentError } = require("../content/errors");
const { CONTENT_DIR, createSchemaValidators, schemaErrors, readYamlFile, listYaml } = require("../content/yaml");

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
    monsters.push({ ...data, file: where });
  }
  checkNames(monsters, errors);
  if (errors.length) throw new ContentError(`怪物內容檢查失敗（${errors.length} 項）：\n- ${errors.join("\n- ")}`);
  monsters.sort((a, b) => (a.id < b.id ? -1 : 1));
  return new Map(monsters.map(monster => [monster.id, monster]));
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

module.exports = { loadMonsters };

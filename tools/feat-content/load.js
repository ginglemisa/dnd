// 讀取 content/srd/feats 的專長內容檔與 content/srd/feat-order.yaml（選單順序），做 schema 驗證與跨檔檢查。任何錯誤都丟出 ContentError。
// 私人內容包目前不支援專長：私人資料檔（class-content.private.generated.js）只放職業資料，私人專長另需私人基準檔與產物合併。
"use strict";
const fs = require("fs");
const path = require("path");
const { ROOT } = require("../content/site-sources");
const { ContentError } = require("../content/errors");
const { CONTENT_DIR, createSchemaValidators, schemaErrors, readYamlFile, listYaml } = require("../content/yaml");

const ORDER_FILE = path.join(CONTENT_DIR, "srd", "feat-order.yaml");

// 跑團動作說明由哪些效果組成：effects，省略時為與按鈕同名的效果。
const actionEffectNames = action => action.effects || [action.label];

// 回傳 Map（專長 ID → 內容，依 feat-order.yaml 的順序）。
function loadFeats() {
  const errors = [];
  const privateDir = path.join(CONTENT_DIR, "private", "feats");
  if (fs.existsSync(privateDir)) errors.push("content/private/feats/：私人內容包尚未支援專長（私人資料檔只放職業資料），請移除此資料夾");
  const validate = createSchemaValidators(["feat"]).feat;
  const byId = new Map();
  for (const file of listYaml(path.join(CONTENT_DIR, "srd", "feats"))) {
    const where = path.relative(ROOT, file).replace(/\\/g, "/");
    let data;
    try { data = readYamlFile(file); } catch (error) { errors.push(error.message); continue; }
    if (!validate(data)) { errors.push(...schemaErrors(validate, where)); continue; }
    if (path.basename(file).replace(/\.ya?ml$/, "") !== data.id) errors.push(`${where}：檔名應為 ${data.id}.yaml`);
    if (byId.has(data.id)) errors.push(`${where}：專長 ID「${data.id}」重複（${byId.get(data.id).file}）`);
    else byId.set(data.id, { ...data, file: where });
  }
  const feats = new Map();
  if (!errors.length) {
    readOrder(byId, errors).forEach(id => feats.set(id, byId.get(id)));
    feats.forEach(feat => checkFeat(feat, errors));
    checkActionKeys(feats, errors);
  }
  if (errors.length) throw new ContentError(`專長內容檢查失敗（${errors.length} 項）：\n- ${errors.join("\n- ")}`);
  return feats;
}

// feat-order.yaml：專長 ID 的清單，須剛好列出全部專長內容檔各一次。
function readOrder(byId, errors) {
  const where = path.relative(ROOT, ORDER_FILE).replace(/\\/g, "/");
  if (!fs.existsSync(ORDER_FILE)) { errors.push(`${where} 不存在`); return []; }
  let order;
  try { order = readYamlFile(ORDER_FILE); } catch (error) { errors.push(error.message); return []; }
  if (!Array.isArray(order) || !order.every(id => typeof id === "string")) { errors.push(`${where}：應為專長 ID 的清單`); return []; }
  const seen = new Set();
  order.forEach(id => {
    if (seen.has(id)) errors.push(`${where}：「${id}」重複`);
    else if (!byId.has(id)) errors.push(`${where}：「${id}」沒有 content/srd/feats/${id}.yaml`);
    seen.add(id);
  });
  byId.forEach((feat, id) => { if (!seen.has(id)) errors.push(`${feat.file}：${where} 沒有列出「${id}」`); });
  return [...new Set(order)].filter(id => byId.has(id));
}

function checkFeat(feat, errors) {
  const where = feat.file;
  if (feat.prerequisite && feat.type !== "general") errors.push(`${where}：只有通用專長（type: general）可寫 prerequisite`);
  const names = new Set();
  feat.effects.forEach(effect => {
    if (names.has(effect.name)) errors.push(`${where}：效果名稱「${effect.name}」重複`);
    names.add(effect.name);
    if (effect.after && !effect.list) errors.push(`${where}：效果「${effect.name}」的 after 只能接在 list 之後`);
  });
  (feat.actions || []).forEach(action => {
    if (!action.key.startsWith(`dynamic-${action.mode}-feat-`)) errors.push(`${where}：動作「${action.label}」的 key 應以 dynamic-${action.mode}-feat- 開頭（與 mode 相同）`);
    if (action.tabletop && action.effects) errors.push(`${where}：動作「${action.label}」寫了 tabletop，不需要 effects`);
    if (!action.tabletop) actionEffectNames(action).filter(name => !names.has(name)).forEach(name => errors.push(`${where}：動作「${action.label}」的效果「${name}」不存在`));
  });
}

function checkActionKeys(feats, errors) {
  const owners = new Map();
  feats.forEach(feat => (feat.actions || []).forEach(action => {
    if (owners.has(action.key)) errors.push(`${feat.file}：動作 key「${action.key}」與 ${owners.get(action.key)} 重複`);
    owners.set(action.key, feat.file);
  }));
}

module.exports = { loadFeats, actionEffectNames };

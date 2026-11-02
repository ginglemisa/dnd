// 讀取 content/ 的 YAML 內容檔，並以 content/schema 的 JSON Schema 驗證。各種內容（職業等）共用。
"use strict";
const fs = require("fs");
const path = require("path");
const YAML = require("yaml");
const Ajv = require("ajv");
const { ROOT } = require("./site-sources");
const { ContentError } = require("./errors");

const CONTENT_DIR = path.join(ROOT, "content");
const SCHEMA_DIR = path.join(CONTENT_DIR, "schema");

// names 為 content/schema 下的檔名（不含 .schema.json）；全部載入同一個 Ajv，彼此可用 $ref 引用。回傳 名稱 → 驗證函式。
function createSchemaValidators(names) {
  const ajv = new Ajv({ allErrors: true, strict: true, strictRequired: false, allowUnionTypes: true });
  names.forEach(name => ajv.addSchema(JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, `${name}.schema.json`), "utf8"))));
  return Object.fromEntries(names.map(name => [name, ajv.getSchema(`${name}.schema.json`)]));
}

// 驗證失敗時的訊息（每項一行，前綴檔案位置）。
function schemaErrors(validate, where) {
  // 「多出未知欄位」通常是打錯字，排在最前面；其餘為其連帶錯誤。
  return [...validate.errors].sort((a, b) => (b.keyword === "additionalProperties") - (a.keyword === "additionalProperties")).map(error => `${where}${error.instancePath || ""}：${error.message}${error.params?.additionalProperty ? `（${error.params.additionalProperty}）` : ""}`);
}

function readYamlFile(file) {
  const document = YAML.parseDocument(fs.readFileSync(file, "utf8"), { uniqueKeys: true });
  if (document.errors.length) throw new ContentError(`${path.relative(ROOT, file)}：YAML 格式錯誤\n${document.errors.map(error => error.message).join("\n")}`);
  return document.toJS();
}

function listYaml(dir) {
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter(name => /\.ya?ml$/.test(name)).sort().map(name => path.join(dir, name)) : [];
}

module.exports = { CONTENT_DIR, createSchemaValidators, schemaErrors, readYamlFile, listYaml };

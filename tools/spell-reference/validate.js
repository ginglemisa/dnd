// 檢查 content/srd/spells 的法術參考資料。
// 用法：node tools/spell-reference/validate.js [--srd <spells.md 路徑>] [--site] [--strict] [id ...]
//   不帶參數：檢查 content/srd/spells 下全部檔案（schema、檔名與 ID、欄位一致、禁用字與用語、骰式與數字比對）。
//   --srd：另外與 SRD 英文 Markdown 逐項比對（結構化欄位與英文原文是否被改動），並確認共 339 個（戲法 27）。
//   --site：另外檢查網站既有法術都有對應檔案，且 zh.name、level 與網站相同。
//   --strict：「疑點」也算失敗（預設只列出供人工確認）。
//   有帶 id 時只檢查那幾個。「疑點」是需要人工確認的提示，不一定是錯誤。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createSchemaValidators, schemaErrors, readYamlFile, listYaml, CONTENT_DIR } = require('../content/yaml');
const { parseSrdSpells } = require('./parse-srd');

const SPELL_DIR = path.join(CONTENT_DIR, 'srd', 'spells');
const ROOT = path.join(__dirname, '..', '..');

const args = process.argv.slice(2);
const flag = name => args.includes(name);
const srdPath = flag('--srd') ? args[args.indexOf('--srd') + 1] : null;
const onlyIds = args.filter((arg, i) => !arg.startsWith('--') && args[i - 1] !== '--srd');

// 禁用寫法（見 glossary.md）：[正則, 說明]
const BANNED = [
  [/[爲着裏啓衞麪僞衹纔]/, '簡體衍生字形'],
  [/豁免檢定/, '應寫「豁免」'],
  [/類人(?!型)/, '應寫「人型生物」'],
  [/麻痹/, '應寫「麻痺」'],
  [/物件/, '應寫「物體」'],
  [/被動感知/, '應寫「被動察覺」'],
  [/調諧/, '應寫「同調」'],
  [/具有[一-鿿]{1,4}狀態/,'應寫「陷入X狀態」'],
  [/屬性資料/, '應寫「數據塊」'],
  [/生命點/, '應寫「生命值」'],
  [/\d\s*尺/, '距離單位應為「呎」'],
  [/\bGM\b|遊戲主持人|地下城主/, '應寫「DM」'],
];

const CHINESE = /[一-鿿]/;
const failures = [];
const suspects = [];
const fail = (id, message) => failures.push(`${id}：${message}`);
const suspect = (id, message) => suspects.push(`${id}：${message}`);

// 骰式與數字比對：英文原文出現的每個骰式／數字，中文都要出現（英文數字詞不比）
function tokens(text) {
  const dice = text.match(/\d+d\d+/g) || [];
  const numbers = (text.replace(/\d+d\d+/g, ' ').match(/\d+(?:,\d{3})*/g) || []).map(n => n.replace(/,/g, ''));
  return { dice, numbers };
}
function countMap(list) {
  const map = new Map();
  list.forEach(item => map.set(item, (map.get(item) || 0) + 1));
  return map;
}

function checkSpell(file, doc, validate) {
  const id = path.basename(file, '.yaml');
  if (!validate(doc)) { schemaErrors(validate, id).forEach(e => failures.push(e)); return; }
  if (doc.spellId !== id) fail(id, `spellId「${doc.spellId}」與檔名不同`);
  if (doc.components.m !== Boolean(doc.en.material)) fail(id, 'en.material 與 components.m 不一致');
  if (doc.components.m !== Boolean(doc.zh.material)) fail(id, 'zh.material 與 components.m 不一致');
  if (doc.ritual !== doc.castingTime.some(o => o.unit === 'ritual')) fail(id, 'ritual 與 castingTime 不一致');
  if (doc.concentration && !(doc.duration.type === 'time' && doc.duration.upTo)) fail(id, '專注法術的持續時間應為「最長 N」');
  doc.castingTime.forEach((o, i) => {
    if ((o.unit === 'minute' || o.unit === 'hour') !== (o.amount !== undefined)) fail(id, `castingTime[${i}] 的 amount 與 unit 不符`);
  });
  if (doc.range.type === 'distance' && !(doc.range.amount && doc.range.unit)) fail(id, 'range 缺少 amount／unit');
  if (doc.duration.type === 'time' && !(doc.duration.amount && doc.duration.unit)) fail(id, 'duration 缺少 amount／unit');

  const zhTexts = [['name', doc.zh.name], ['material', doc.zh.material], ['body', doc.zh.body],
    ...doc.castingTime.filter(o => o.note).map(o => ['castingTime.note', o.note.zh])].filter(([, text]) => text);
  for (const [field, text] of zhTexts) {
    if (!CHINESE.test(text)) fail(id, `zh.${field} 沒有中文`);
    for (const [pattern, why] of BANNED) {
      const match = text.match(pattern);
      if (match) fail(id, `zh.${field}：${why}（${match[0]}）`);
    }
  }
  if (/[ \t]+$/m.test(doc.zh.body)) fail(id, 'zh.body 行尾有空白');
  if ((doc.en.body.match(/^\|/gm) || []).length !== (doc.zh.body.match(/^\|/gm) || []).length) fail(id, '表格列數與英文不同');
  if ((doc.en.body.match(/\n\n/g) || []).length !== (doc.zh.body.match(/\n\n/g) || []).length) suspect(id, '段落數與英文不同');
  const enItalics = (doc.en.body.match(/^_[^_\n]+\._/gm) || []).length;
  const zhItalics = (doc.zh.body.match(/^_[^_\n]+[.。]_/gm) || []).length;
  if (enItalics !== zhItalics) suspect(id, `斜體小標數量不同（英文 ${enItalics}、中文 ${zhItalics}）`);

  const en = tokens(doc.en.body), zh = tokens(doc.zh.body);
  const enDice = countMap(en.dice), zhDice = countMap(zh.dice);
  for (const [die, count] of enDice) {
    if ((zhDice.get(die) || 0) !== count) suspect(id, `骰式 ${die} 英文 ${count} 次，中文 ${zhDice.get(die) || 0} 次`);
  }
  for (const die of zhDice.keys()) if (!enDice.has(die)) suspect(id, `中文多出骰式 ${die}`);
  const zhNumbers = new Set(zh.numbers);
  for (const number of new Set(en.numbers)) if (!zhNumbers.has(number)) suspect(id, `英文數字 ${number} 在中文沒有出現`);
  for (const number of zhNumbers) if (!en.numbers.includes(number) && !en.dice.some(d => d.includes(number))) suspect(id, `中文多出數字 ${number}`);
}

function compareWithSrd(docs, markdown) {
  const srd = parseSrdSpells(markdown);
  const byId = new Map(docs.map(d => [d.spellId, d]));
  if (!onlyIds.length) {
    srd.filter(s => !byId.has(s.spellId)).forEach(s => fail(s.spellId, '缺少檔案'));
    docs.filter(d => !srd.some(s => s.spellId === d.spellId)).forEach(d => fail(d.spellId, '不在 SRD 之內'));
  }
  for (const spell of srd) {
    const doc = byId.get(spell.spellId);
    if (!doc) continue;
    const id = spell.spellId;
    for (const key of ['level', 'school', 'classes', 'ritual', 'concentration', 'range', 'components', 'duration']) {
      if (JSON.stringify(doc[key]) !== JSON.stringify(spell[key])) fail(id, `${key} 與 SRD 不同`);
    }
    const expected = spell.castingTime.map(({ noteEn, ...rest }) => (noteEn ? { ...rest, note: noteEn } : rest));
    const actual = doc.castingTime.map(({ note, ...rest }) => (note ? { ...rest, note: note.en } : rest));
    if (JSON.stringify(expected) !== JSON.stringify(actual)) fail(id, 'castingTime 與 SRD 不同');
    if (doc.en.name !== spell.nameEn) fail(id, 'en.name 與 SRD 不同');
    if ((doc.en.material || '') !== (spell.materialEn || '')) fail(id, 'en.material 與 SRD 不同');
    if (doc.en.body !== spell.bodyEn) fail(id, 'en.body 與 SRD 不同');
  }
}

function checkSite(docs) {
  const context = {};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'spell-list.js'), 'utf8'), context);
  const byId = new Map(docs.map(d => [d.spellId, d]));
  for (const spell of context.SpellCatalog.getAllSpells()) {
    const doc = byId.get(spell.spellId);
    if (!doc) { fail(spell.spellId, '網站有此法術，但沒有對應檔案'); continue; }
    if (doc.zh.name !== spell.nameZh) fail(spell.spellId, `zh.name「${doc.zh.name}」與網站 nameZh「${spell.nameZh}」不同`);
    if (doc.level !== spell.level) fail(spell.spellId, `level 與網站不同（${doc.level} / ${spell.level}）`);
  }
}

function main() {
  const { spell: validate } = createSchemaValidators(['spell']);
  let files = listYaml(SPELL_DIR);
  if (onlyIds.length) files = files.filter(f => onlyIds.includes(path.basename(f, '.yaml')));
  const docs = files.map(file => readYamlFile(file));
  docs.forEach((doc, i) => checkSpell(files[i], doc, validate));
  if (srdPath) compareWithSrd(docs, fs.readFileSync(srdPath, 'utf8'));
  if (flag('--site') && !onlyIds.length) checkSite(docs);
  if (srdPath && !onlyIds.length) {
    const cantrips = docs.filter(d => d.level === 0).length;
    if (docs.length !== 339 || cantrips !== 27) fail('total', `應為 339 個（戲法 27），實際 ${docs.length}（戲法 ${cantrips}）`);
  }
  suspects.forEach(s => console.log(`疑點 ${s}`));
  failures.forEach(f => console.error(`錯誤 ${f}`));
  console.log(`檢查 ${docs.length} 個法術：錯誤 ${failures.length}、疑點 ${suspects.length}`);
  process.exit(failures.length || (flag('--strict') && suspects.length) ? 1 : 0);
}

main();

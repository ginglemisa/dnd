// 檢查法術內容檔的 SRD 譯文（srd 區塊）與英文原文（en 區塊）。格式、欄位一致與網站版的檢查由 npm run build 負責。
// 用法：node tools/spell-reference/validate.js [--srd <spells.md 路徑>] [--strict] [id ...]
//   不帶參數：禁用字與用語、表格列數、段落與斜體小標數、骰式與數字比對（譯文 vs 英文），以及網站版標籤是否沿用。
//   --srd：另外與 SRD 5.2.1 英文 Markdown 逐項比對（英文原文、材料、觸發條件與規則欄位是否被改動），並確認共 339 個（戲法 27）。
//          職業清單比對 srd.classes；沒寫時比對 classes（表示網站法表與 SRD 相同）。
//   --strict：「疑點」也算失敗（預設只列出供人工確認）。
//   有帶 id 時只檢查那幾個。「疑點」是需要人工確認的提示，不一定是錯誤。
'use strict';
const fs = require('fs');
const path = require('path');
const { readYamlFile, listYaml, CONTENT_DIR } = require('../content/yaml');
const { parseSrdSpells } = require('./parse-srd');

const SPELL_DIR = path.join(CONTENT_DIR, 'srd', 'spells');

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
  [/移動速度/, '「movement」是「移動力」，「Speed」是「速度」，不用「移動速度」'],
  [/雷龍|塔拉斯克/, 'Tarrasque 應寫「泰拉斯奎巨獸」'],
  [/乙太/, '應寫「以太位面」（網站用語）'],
  [/調諧/, '應寫「同調」'],
  [/具有[一-鿿]{1,4}狀態/, '應寫「陷入X狀態」'],
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

function checkTranslation(doc) {
  const id = doc.id;
  if (!doc.srd || !doc.en) { fail(id, 'SRD 法術須有 srd 與 en 區塊'); return; }
  const zhTexts = [['name', doc.name], ['material', doc.srd.material], ['trigger', doc.srd.trigger], ['body', doc.srd.body]].filter(([, text]) => text);
  for (const [field, text] of zhTexts) {
    if (!CHINESE.test(text)) fail(id, `srd.${field} 沒有中文`);
    for (const [pattern, why] of BANNED) {
      if (field === 'name' && pattern.source === '物件') continue; // 網站既有的法術名（例：物件定位術）優先
      const match = text.match(pattern);
      if (match) fail(id, `srd.${field}：${why}（${match[0]}）`);
    }
  }
  if (/[ \t]+$/m.test(doc.srd.body)) fail(id, 'srd.body 行尾有空白');
  if ((doc.en.body.match(/^\|/gm) || []).length !== (doc.srd.body.match(/^\|/gm) || []).length) fail(id, '表格列數與英文不同');
  if ((doc.en.body.match(/\n\n/g) || []).length !== (doc.srd.body.match(/\n\n/g) || []).length) suspect(id, '段落數與英文不同');
  const enItalics = (doc.en.body.match(/^_[^_\n]+\._/gm) || []).length;
  const zhItalics = (doc.srd.body.match(/^_[^_\n]+[.。]_/gm) || []).length;
  if (enItalics !== zhItalics) suspect(id, `斜體小標數量不同（英文 ${enItalics}、中文 ${zhItalics}）`);

  const en = tokens(doc.en.body), zh = tokens(doc.srd.body);
  const enDice = countMap(en.dice), zhDice = countMap(zh.dice);
  for (const [die, count] of enDice) {
    if ((zhDice.get(die) || 0) !== count) suspect(id, `骰式 ${die} 英文 ${count} 次，中文 ${zhDice.get(die) || 0} 次`);
  }
  for (const die of zhDice.keys()) if (!enDice.has(die)) suspect(id, `中文多出骰式 ${die}`);
  const zhNumbers = new Set(zh.numbers);
  for (const number of new Set(en.numbers)) if (!zhNumbers.has(number)) suspect(id, `英文數字 ${number} 在中文沒有出現`);
  for (const number of zhNumbers) if (!en.numbers.includes(number) && !en.dice.some(d => d.includes(number))) suspect(id, `中文多出數字 ${number}`);

  // 網站版 bullet 開頭的「標籤：」（效果名稱、子選項名稱）在譯文要有同樣的詞；網站自己的說明性小標會誤報，列為疑點由人判斷
  if (doc.site) {
    const zhText = doc.srd.body + (doc.srd.trigger || '');
    const GENERIC = /^(使用更高環階法術位|戲法升級|豁免失敗|豁免成功|失敗|成功|命中|未命中|受影響的目標|戰鬥)$/;
    const labels = [...doc.site.body.matchAll(/^\s*- ([^：:，；。\n]{1,14}?)(?:（[^）]*）)?：/gm)].map(m => m[1]).filter(l => !GENERIC.test(l));
    for (const label of new Set(labels)) if (!zhText.includes(label)) suspect(id, `網站的標籤「${label}」在 srd 沒有出現（名稱應沿用網站寫法）`);
  }
}

// parse-srd.js 的結構化欄位轉成內容檔的寫法（見 content/schema/spell.schema.json）。
function srdFields(spell) {
  const range = spell.range.type === 'distance' ? { [spell.range.unit === 'feet' ? 'feet' : 'miles']: spell.range.amount } : spell.range.type;
  const d = spell.duration;
  const duration = d.type === 'time'
    ? { [`${d.unit}s`]: d.amount, ...(d.upTo && !spell.concentration ? { upTo: true } : {}) }
    : d.type;
  return {
    level: spell.level,
    school: spell.school,
    classes: spell.classes,
    castingTime: spell.castingTime.filter(t => t.unit !== 'ritual').map(t => t.unit === 'minute' ? { minutes: t.amount } : t.unit === 'hour' ? { hours: t.amount } : t.unit),
    ritual: spell.castingTime.some(t => t.unit === 'ritual') || undefined,
    range,
    components: ['V', 'S', 'M'].filter(k => spell.components[k.toLowerCase()]),
    duration,
    concentration: spell.concentration || undefined
  };
}

function compareWithSrd(docs, markdown) {
  const srd = parseSrdSpells(markdown);
  const byId = new Map(docs.map(d => [d.id, d]));
  if (!onlyIds.length) {
    srd.filter(s => !byId.has(s.spellId)).forEach(s => fail(s.spellId, '缺少檔案'));
    docs.filter(d => !srd.some(s => s.spellId === d.id)).forEach(d => fail(d.id, '不在 SRD 之內'));
  }
  for (const spell of srd) {
    const doc = byId.get(spell.spellId);
    if (!doc) continue;
    const id = spell.spellId;
    const expected = srdFields(spell);
    for (const [key, value] of Object.entries(expected)) {
      if (key === 'classes') {
        const srdClasses = doc.srd?.classes || doc.classes;
        if ([...srdClasses].sort().join() !== [...value].sort().join()) fail(id, `${doc.srd?.classes ? 'srd.classes' : 'classes'} 與 SRD 不同（SRD：${value.join(', ')}）`);
        continue;
      }
      if (JSON.stringify(doc[key]) !== JSON.stringify(value)) fail(id, `${key} 與 SRD 不同`);
    }
    // 植物滋長的施法時間效果名稱（Overgrowth／Enrichment）寫在說明內，不另存；其餘 note 是反應或附贈動作的觸發條件。
    const trigger = spell.castingTime.find(t => t.noteEn && ['reaction', 'bonus-action'].includes(t.unit))?.noteEn;
    if ((doc.en.trigger || '') !== (trigger || '')) fail(id, 'en.trigger 與 SRD 不同');
    if (!doc.site && doc.nameEn !== spell.nameEn) fail(id, 'nameEn 與 SRD 不同');
    if ((doc.en.material || '') !== (spell.materialEn || '')) fail(id, 'en.material 與 SRD 不同');
    if (doc.en.body !== spell.bodyEn) fail(id, 'en.body 與 SRD 不同');
  }
}

function main() {
  let files = listYaml(SPELL_DIR);
  if (onlyIds.length) files = files.filter(f => onlyIds.includes(path.basename(f, '.yaml')));
  const docs = files.map(file => readYamlFile(file));
  docs.forEach(checkTranslation);
  if (srdPath) compareWithSrd(docs, fs.readFileSync(srdPath, 'utf8'));
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

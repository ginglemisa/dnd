// 解析 SRD 5.2.1 法術 Markdown（英文原文）為結構化資料。
// 用法：const { parseSrdSpells } = require('./parse-srd'); parseSrdSpells(markdownText) → 339 筆
'use strict';

const CLASS_IDS = ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard'];
const SCHOOLS = ['abjuration', 'conjuration', 'divination', 'enchantment', 'evocation', 'illusion', 'necromancy', 'transmutation'];

function kebab(name) {
  return name.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// HTML 表格 → GFM 表格（展開 colspan；沒有 thead 時以第一列當表頭）
function htmlTableToMarkdown(html) {
  const rows = [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(r =>
    [...r[1].matchAll(/<t[dh]([^>]*)>([\s\S]*?)<\/t[dh]>/g)].flatMap(c => {
      const span = Number((/colspan="(\d+)"/.exec(c[1]) || [])[1] || 1);
      return [c[2].replace(/\s+/g, ' ').trim(), ...Array(span - 1).fill('')];
    }));
  const width = Math.max(...rows.map(r => r.length));
  const pad = r => r.concat(Array(width - r.length).fill(''));
  const line = r => `| ${pad(r).map(c => c.replace(/\|/g, '\|')).join(' | ')} |`;
  return [line(rows[0]), `|${' --- |'.repeat(width)}`, ...rows.slice(1).map(line)].join('\n');
}

// 段落內的硬換行合併成一行；表格、清單、引言、粗體開頭的資料列維持原樣
function normalizeBody(body) {
  const withTables = body.replace(/<table>[\s\S]*?<\/table>/g, m => htmlTableToMarkdown(m));
  const out = [];
  for (const line of withTables.split('\n')) {
    const prev = out[out.length - 1];
    const joinable = prev !== undefined && prev !== '' && line !== '' &&
      !/^(\*\*|- |\* |\||>|#|\d+\. )/.test(line) && !/^\|/.test(prev) && !/^#/.test(prev) &&
      !/^\*\*[^*]+\*\* /.test(prev);
    if (joinable) out[out.length - 1] = `${prev} ${line}`;
    else out.push(line);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function parseCastingTime(text) {
  const [head, ...restParts] = text.split(/,\s+(?=which\b)/);
  const note = restParts.join(', ') || undefined;
  const parts = head.split(/\s+or\s+/);
  const options = parts.map(part => {
    const p = part.trim();
    let m;
    if ((m = /^Action(?: \((\w+)\))?$/.exec(p))) return { unit: 'action', ...(m[1] ? { noteEn: m[1] } : {}) };
    if (/^Bonus Action$/.test(p)) return { unit: 'bonus-action' };
    if (/^Reaction$/.test(p)) return { unit: 'reaction' };
    if (/^Ritual$/.test(p)) return { unit: 'ritual' };
    if ((m = /^(\d+) (minute|hour)s?(?: \((\w+)\))?$/.exec(p))) return { unit: m[2], amount: Number(m[1]), ...(m[3] ? { noteEn: m[3] } : {}) };
    throw new Error(`未知施法時間：${text}`);
  });
  if (note) options[0].noteEn = note;
  return options;
}

function parseRange(text) {
  let m;
  if (/^(Self|Touch|Sight|Unlimited|Special)$/.test(text)) return { type: text.toLowerCase() };
  if ((m = /^(\d+) (feet|miles?)$/.exec(text))) return { type: 'distance', amount: Number(m[1]), unit: m[2].replace(/s$/, '') };
  throw new Error(`未知射程：${text}`);
}

function parseDuration(text) {
  let m;
  const concentration = /^Concentration, /.test(text);
  const t = text.replace(/^Concentration, /, '');
  if (t === 'Instantaneous') return { concentration, duration: { type: 'instantaneous' } };
  if (t === 'Until dispelled') return { concentration, duration: { type: 'until-dispelled' } };
  if (t === 'Until dispelled or triggered') return { concentration, duration: { type: 'until-dispelled-or-triggered' } };
  if (t === 'Special') return { concentration, duration: { type: 'special' } };
  if ((m = /^(up to )?(\d+) (round|minute|hour|day)s?$/i.exec(t))) {
    return { concentration, duration: { type: 'time', amount: Number(m[2]), unit: m[3].toLowerCase(), ...(m[1] ? { upTo: true } : {}) } };
  }
  throw new Error(`未知持續時間：${text}`);
}

function parseComponents(text) {
  const m = /^([VSM](?:, [VSM])*)(?: \((.*)\))?$/.exec(text);
  if (!m) throw new Error(`未知成分：${text}`);
  const letters = m[1].split(', ');
  const components = { v: letters.includes('V'), s: letters.includes('S'), m: letters.includes('M') };
  if (components.m !== Boolean(m[2])) throw new Error(`材料與 M 不一致：${text}`);
  return { components, materialEn: m[2] };
}

function parseSrdSpells(markdown) {
  const text = markdown.replace(/^\uFEFF/, '').replace(/\r/g, '');
  const sections = text.slice(text.indexOf('## Spell Descriptions')).split(/\n(?=#### )/).slice(1);
  const spells = [];
  for (const section of sections) {
    const lines = section.split('\n');
    const name = lines[0].replace(/^#### /, '').trim();
    const head = /^_(?:Level (\d) (\w+)|(\w+) Cantrip) \(([^)]*)\)_$/.exec(lines[2] || '');
    if (!head) {
      if (!spells.length) throw new Error(`第一個區塊不是法術：${name}`);
      spells[spells.length - 1].rawBody += `\n\n${lines[0]}\n${lines.slice(1).join('\n')}`; // 召喚物數據塊的小節
      continue;
    }
    const school = (head[2] || head[3]).toLowerCase();
    if (!SCHOOLS.includes(school)) throw new Error(`未知學派 ${name}: ${school}`);
    const classes = head[4].split(', ').map(c => c.toLowerCase());
    classes.forEach(c => { if (!CLASS_IDS.includes(c)) throw new Error(`未知職業 ${name}: ${c}`); });
    const field = label => {
      const m = new RegExp(`^[*][*]${label}:[*][*] (.*)$`, 'm').exec(section);
      if (!m) throw new Error(`${name} 缺少 ${label}`);
      return m[1].trim();
    };
    const casting = field('Casting Time');
    const { components, materialEn } = parseComponents(field('Components?'));
    const { concentration, duration } = parseDuration(field('Duration'));
    const bodyStart = lines.findIndex((l, i) => i > 2 && /^\*\*Duration:\*\*/.test(l)) + 1;
    spells.push({
      spellId: kebab(name),
      nameEn: name,
      level: head[1] ? Number(head[1]) : 0,
      school,
      classes,
      ritual: /\bRitual\b/.test(casting),
      concentration,
      castingTime: parseCastingTime(casting),
      range: parseRange(field('Range')),
      components,
      materialEn,
      duration,
      rawBody: lines.slice(bodyStart).join('\n'),
    });
  }
  spells.forEach(s => { s.bodyEn = normalizeBody(s.rawBody); delete s.rawBody; });
  return spells;
}

module.exports = { parseSrdSpells, kebab, CLASS_IDS, SCHOOLS };

// 把解析後的 SRD 法術資料加上中文翻譯，寫成 content/srd/spells/<spellId>.yaml。
'use strict';
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const HEADER = '# yaml-language-server: $schema=../../schema/spell.schema.json\n';

function buildDocument(spell, zh) {
  const castingTime = spell.castingTime.map((option, index) => {
    const { noteEn, ...rest } = option;
    const noteZh = zh.notes && zh.notes[index];
    if (noteEn && !noteZh) throw new Error(`${spell.spellId}：施法時間第 ${index + 1} 項缺少中文說明`);
    return noteEn ? { ...rest, note: { en: noteEn, zh: noteZh } } : rest;
  });
  if (spell.components.m && !zh.material) throw new Error(`${spell.spellId}：缺少中文材料`);
  const object = {
    spellId: spell.spellId,
    source: 'srd',
    level: spell.level,
    school: spell.school,
    classes: spell.classes,
    ritual: spell.ritual,
    concentration: spell.concentration,
    castingTime,
    range: spell.range,
    components: spell.components,
    duration: spell.duration,
    en: { name: spell.nameEn, ...(spell.materialEn ? { material: spell.materialEn } : {}), body: spell.bodyEn },
    zh: { name: zh.name, ...(zh.material ? { material: zh.material } : {}), body: zh.body.trim() },
  };
  const document = new YAML.Document(object);
  YAML.visit(document, {
    Scalar(key, node) {
      if (typeof node.value === 'string' && node.value.includes('\n')) node.type = 'BLOCK_LITERAL';
    },
    Pair(_, pair) {
      const name = pair.key?.value;
      if (name === 'classes' && YAML.isSeq(pair.value)) pair.value.flow = true;
      if (['range', 'components', 'duration'].includes(name) && YAML.isMap(pair.value)) pair.value.flow = true;
    },
    Map(key, node, parents) {
      const parent = parents[parents.length - 1];
      if (YAML.isSeq(parent) && node.items.every(item => !YAML.isMap(item.value))) node.flow = true;
    },
  });
  return document;
}

function renderSpellYaml(spell, zh) {
  return HEADER + buildDocument(spell, zh).toString({ lineWidth: 0, blockQuote: 'literal' });
}

function writeSpellYaml(spell, zh, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${spell.spellId}.yaml`), renderSpellYaml(spell, zh), 'utf8');
}

module.exports = { renderSpellYaml, writeSpellYaml };

// 把翻譯結果（JSON）合併 SRD 英文原文，寫成 content/srd/spells/<spellId>.yaml。
// 用法：node tools/spell-reference/apply-translations.js --srd <spells.md 路徑> <翻譯.json> [...]
// 翻譯 JSON 格式：{ "<spellId>": { "name": "中文名", "material": "中文材料（有 M 才需要）",
//   "notes": ["施法時間第 1 項的中文說明或 null", ...]（只有施法時間含說明時才需要）, "body": "中文說明（Markdown）" } }
'use strict';
const fs = require('fs');
const path = require('path');
const { parseSrdSpells } = require('./parse-srd');
const { writeSpellYaml } = require('./write-yaml');

const args = process.argv.slice(2);
const srdIndex = args.indexOf('--srd');
if (srdIndex < 0 || !args[srdIndex + 1]) { console.error('需要 --srd <spells.md 路徑>'); process.exit(1); }
const srdPath = args[srdIndex + 1];
const inputs = args.filter((arg, i) => i !== srdIndex && i !== srdIndex + 1);
if (!inputs.length) { console.error('需要至少一個翻譯 JSON'); process.exit(1); }

const spells = new Map(parseSrdSpells(fs.readFileSync(srdPath, 'utf8')).map(s => [s.spellId, s]));
const outDir = path.join(__dirname, '..', '..', 'content', 'srd', 'spells');
let written = 0;
for (const input of inputs) {
  const translations = JSON.parse(fs.readFileSync(input, 'utf8'));
  for (const [id, zh] of Object.entries(translations)) {
    const spell = spells.get(id);
    if (!spell) throw new Error(`${input}：SRD 沒有 ${id}`);
    writeSpellYaml(spell, zh, outDir);
    written++;
  }
}
console.log(`已寫入 ${written} 個法術到 ${path.relative(process.cwd(), outDir)}`);

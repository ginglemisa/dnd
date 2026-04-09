(function attachPdfFieldMap(globalScope) {
  function getClassFeaturesMap() {
    if (typeof classFeatures !== 'undefined') return classFeatures;
    return globalScope.classFeatures || {};
  }

  function getRaceFeaturesMap() {
    if (typeof raceFeatures !== 'undefined') return raceFeatures;
    return globalScope.raceFeatures || {};
  }

  function getBackgroundMap() {
    if (typeof detailedBackgroundFeatures !== 'undefined') return detailedBackgroundFeatures;
    return globalScope.detailedBackgroundFeatures || {};
  }

  function getSpellListMap() {
    if (typeof spellList !== 'undefined') return spellList;
    return globalScope.spellList || {};
  }

  function getLanguageOptions() {
    const base = (typeof BASE_LANGUAGE_OPTIONS !== 'undefined') ? BASE_LANGUAGE_OPTIONS : (globalScope.BASE_LANGUAGE_OPTIONS || []);
    const extra = (typeof EXTRA_LANGUAGE_OPTIONS !== 'undefined') ? EXTRA_LANGUAGE_OPTIONS : (globalScope.EXTRA_LANGUAGE_OPTIONS || []);
    return [...base, ...extra];
  }

  const DIRECT_FIELD_MAP = Object.freeze({
    class: 'Class',
    level: 'Level',
    background: 'Background',
    race: 'Specie',
    alignment: 'alignment',
    str: 'str',
    dex: 'dex',
    con: 'con',
    int: 'int',
    wis: 'wis',
    cha: 'cha',
    'save-str': 'strSaveMod',
    'save-dex': 'dexSaveMod',
    'save-con': 'conSaveMod',
    'save-int': 'intSaveMod',
    'save-wis': 'wisSaveMod',
    'save-cha': 'chaSaveMod',
    'initiative-input': 'initiative',
    'speed-input': 'speed',
    'passive-perception': 'passivePerception',
    hp: 'hp_now',
    'ac-display': 'AC',
    'hp-display': 'hp_max',
    lifedicen: 'hp_dice_used',
    'spellcasting-ability': 'spell_cast_attri',
    'spell-adjustment': 'spell_cast_Mod',
    'spell-save-dc': 'spell_cast_DC',
    'spell-attack-bonus': 'spell_cast_toHit',
    'atk-main-name': 'attack-weap-name-1',
    'atk-main-hit': 'toHit1',
    'atk-main-dmg': 'dmg_type_1',
    'atk-main-note': 'wp-note-1',
    'atk-off-name': 'attack-weap-name-2',
    'atk-off-hit': 'toHit2',
    'atk-off-dmg': 'dmg_type_2',
    'atk-off-note': 'wp-note-2',
    'gear-notes': 'equipment'
  });

  const CHECKBOX_FIELD_MAP = Object.freeze({
    'heroic-inspiration': 'heroInspiration',
    'prof-str': 'strSaveChk',
    'prof-dex': 'dexSaveChk',
    'prof-con': 'conSaveChk',
    'prof-int': 'intSaveChk',
    'prof-wis': 'wisSaveChk',
    'prof-cha': 'chaSaveChk'
  });

  const SKILL_ROWS = Object.freeze([
    { name: '運動', profId: 'prof-運動', expId: 'exp-運動', modId: 'skill-運動', chkField: 'athleticsChk', modField: 'athleticsMod' },
    { name: '體操', profId: 'prof-體操', expId: 'exp-體操', modId: 'skill-體操', chkField: 'acrobaticsChk', modField: 'acrobaticsMod' },
    { name: '巧手', profId: 'prof-巧手', expId: 'exp-巧手', modId: 'skill-巧手', chkField: 'sleightOfHandChk', modField: 'sleightOfHandMod' },
    { name: '隱匿', profId: 'prof-隱匿', expId: 'exp-隱匿', modId: 'skill-隱匿', chkField: 'stealthChk', modField: 'stealthMod' },
    { name: '奧秘', profId: 'prof-奧秘', expId: 'exp-奧秘', modId: 'skill-奧秘', chkField: 'arcanaChk', modField: 'arcanaMod' },
    { name: '歷史', profId: 'prof-歷史', expId: 'exp-歷史', modId: 'skill-歷史', chkField: 'historyChk', modField: 'historyMod' },
    { name: '調查', profId: 'prof-調查', expId: 'exp-調查', modId: 'skill-調查', chkField: 'investigationChk', modField: 'investigationMod' },
    { name: '自然', profId: 'prof-自然', expId: 'exp-自然', modId: 'skill-自然', chkField: 'natureChk', modField: 'natureMod' },
    { name: '宗教', profId: 'prof-宗教', expId: 'exp-宗教', modId: 'skill-宗教', chkField: 'religionChk', modField: 'religionMod' },
    { name: '馴獸', profId: 'prof-馴獸', expId: 'exp-馴獸', modId: 'skill-馴獸', chkField: 'animalHandlingChk', modField: 'animalHandlingMod' },
    { name: '洞悉', profId: 'prof-洞悉', expId: 'exp-洞悉', modId: 'skill-洞悉', chkField: 'insightChk', modField: 'insightMod' },
    { name: '醫藥', profId: 'prof-醫藥', expId: 'exp-醫藥', modId: 'skill-醫藥', chkField: 'medicineChk', modField: 'medicineMod' },
    { name: '察覺', profId: 'prof-察覺', expId: 'exp-察覺', modId: 'skill-察覺', chkField: 'perceptionChk', modField: 'perceptionMod' },
    { name: '求生', profId: 'prof-求生', expId: 'exp-求生', modId: 'skill-求生', chkField: 'survivalChk', modField: 'survivalMod' },
    { name: '欺瞞', profId: 'prof-欺瞞', expId: 'exp-欺瞞', modId: 'skill-欺瞞', chkField: 'deceptionChk', modField: 'deceptionMod' },
    { name: '威嚇', profId: 'prof-威嚇', expId: 'exp-威嚇', modId: 'skill-威嚇', chkField: 'intimidationChk', modField: 'intimidationMod' },
    { name: '表演', profId: 'prof-表演', expId: 'exp-表演', modId: 'skill-表演', chkField: 'performanceChk', modField: 'performanceMod' },
    { name: '遊說', profId: 'prof-遊說', expId: 'exp-遊說', modId: 'skill-遊說', chkField: 'persuasionChk', modField: 'persuasionMod' }
  ]);

  const CLASS_LABELS = Object.freeze({
    barbarian: '野蠻人',
    bard: '吟遊詩人',
    cleric: '牧師',
    druid: '德魯伊',
    fighter: '戰士',
    monk: '武僧',
    paladin: '聖武士',
    ranger: '遊俠',
    rogue: '遊蕩者',
    sorcerer: '術士',
    warlock: '契術師',
    wizard: '法師'
  });

  const SUBCLASS_LABELS = Object.freeze({
    barbarian: '狂戰士道途',
    bard: '逸聞學院',
    cleric: '生命領域',
    druid: '大地結社',
    fighter: '勇士',
    monk: '散打鬥士',
    paladin: '奉獻之誓',
    ranger: '獵人',
    rogue: '盜賊',
    sorcerer: '龍族術法',
    warlock: '邪魔宗主',
    wizard: '塑能師'
  });

  const BACKGROUND_LABELS = Object.freeze({
    acolyte: '侍僧',
    soldier: '士兵',
    criminal: '罪犯',
    sage: '賢者'
  });

  const RACE_LABELS = Object.freeze({
    dragonborn: '龍裔',
    dwarf: '矮人',
    elf: '精靈',
    gnome: '侏儒',
    goliath: '歌利亞',
    halfling: '半身人',
    human: '人類',
    orc: '獸人',
    tiefling: '提夫林'
  });

  const ALIGNMENT_LABELS = Object.freeze({
    LG: '守序善良',
    NG: '中立善良',
    CG: '混亂善良',
    LN: '守序中立',
    TN: '絕對中立',
    CN: '混亂中立',
    LE: '守序邪惡',
    NE: '中立邪惡',
    CE: '混亂邪惡'
  });

  const SPELL_CAST_ABILITY_LABELS = Object.freeze({
    int: '智力',
    wis: '感知',
    cha: '魅力'
  });

  const METAMAGIC_OPTION_NAMES = Object.freeze([
    '謹慎法術',
    '遠程法術',
    '強效法術',
    '延效法術',
    '升階法術',
    '瞬發法術',
    '追蹤法術',
    '精妙法術',
    '轉化法術',
    '孿生法術'
  ]);

  const ELDRITCH_INVOCATION_OPTIONS = Object.freeze([
    { name: '刃之魔契', max: 1 },
    { name: '鏈之魔契', max: 1 },
    { name: '書之魔契', max: 1 },
    { name: '幽影護甲', max: 1 },
    { name: '魔能意志', max: 1 },
    { name: '邪魔活力', max: 1 },
    { name: '千面之臉', max: 1 },
    { name: '幻象迷蹤', max: 1 },
    { name: '超凡跳躍', max: 1 },
    { name: '魔鬼視界', max: 1 },
    { name: '原初之一教習', max: 3 },
    { name: '苦痛魔爆', max: 3 },
    { name: '魔能長槍', max: 3 },
    { name: '斥力魔爆', max: 3 },
    { name: '星移步法', max: 1 },
    { name: '萬形之主', max: 1 },
    { name: '融身入影', max: 1 },
    { name: '深海饋贈', max: 1 },
    { name: '共視感官', max: 1 },
    { name: '魔能斬擊', max: 1 },
    { name: '饑渴魔刃', max: 1 },
    { name: '鏈主賦能', max: 1 }
  ]);

  const GOLIATH_ANCESTRY_LABELS = Object.freeze({
    cloud: '雲巨人',
    fire: '火巨人',
    frost: '霜巨人',
    hill: '山丘巨人',
    stone: '石巨人',
    storm: '風暴巨人'
  });

  const DRAGONBORN_ANCESTRY_LABELS = Object.freeze({
    black_acid: '黑龍-酸',
    blue_lightning: '藍龍-電',
    brass_fire: '黃銅龍-火',
    bronze_lightning: '青銅龍-電',
    copper_acid: '赤銅龍-酸',
    gold_fire: '金龍-火',
    green_poison: '綠龍-毒',
    red_fire: '紅龍-火',
    silver_cold: '銀龍-冰',
    white_cold: '白龍-冰'
  });

  const ELF_LINEAGE_LABELS = Object.freeze({
    drow: '卓爾',
    high_elf: '高等精靈',
    wood_elf: '木精靈'
  });

  const GNOME_LINEAGE_LABELS = Object.freeze({
    forest_gnome: '森林侏儒',
    rock_gnome: '岩石侏儒'
  });

  const TIEFLING_LEGACY_LABELS = Object.freeze({
    abyssal: '深淵',
    chthonic: '冥界',
    infernal: '煉獄'
  });

  function normalizeText(value) {
    if (value === undefined || value === null) return '';
    return String(value).trim();
  }

  function normalizeCommaList(values) {
    return values.map(normalizeText).filter(Boolean).join('、');
  }

  function getSignedAbilityModifier(score) {
    const parsed = Number.parseInt(score, 10);
    if (!Number.isFinite(parsed)) return '';
    const mod = Math.floor((parsed - 10) / 2);
    return mod > 0 ? `+${mod}` : String(mod);
  }

  function getProficiencyBonusByLevel(level) {
    const lv = Number.parseInt(level, 10);
    if (!Number.isFinite(lv) || lv <= 0) return '';
    if (lv >= 17) return '+6';
    if (lv >= 13) return '+5';
    if (lv >= 9) return '+4';
    if (lv >= 5) return '+3';
    return '+2';
  }

  function getHitDieByClass(classKey) {
    const map = {
      barbarian: 'd12',
      fighter: 'd10',
      paladin: 'd10',
      ranger: 'd10',
      artificer: 'd8',
      bard: 'd8',
      cleric: 'd8',
      druid: 'd8',
      monk: 'd8',
      rogue: 'd8',
      warlock: 'd8',
      sorcerer: 'd6',
      wizard: 'd6'
    };
    return map[classKey] || '';
  }

  function getToolsProficiencyText(backgroundKey, classKey) {
    const backgroundToolsMap = {
      acolyte: '書法家工具',
      soldier: '擇一賭具：骰子、紙牌、龍棋、三龍牌',
      criminal: '盜賊工具',
      sage: '書法工具'
    };
    const tools = [];
    const base = backgroundToolsMap[backgroundKey];
    if (base) tools.push(base);

    if (classKey === 'bard') tools.push('任選三種樂器');
    if (classKey === 'druid') tools.push('草藥工具');
    if (classKey === 'monk') tools.push('任選一種工匠工具或樂器');
    if (classKey === 'rogue') tools.push('盜賊工具');

    return normalizeCommaList(tools);
  }

  function countDisplayUnits(text) {
    return Array.from(normalizeText(text)).reduce((sum, ch) => {
      return sum + (/[\u3400-\u9FFF\uF900-\uFAFF]/.test(ch) ? 2 : 1);
    }, 0);
  }

  function wrapTextForPdf(rawText, options = {}) {
    const text = normalizeText(rawText).replace(/\r/g, '').replace(/\t/g, ' ');
    if (!text) return '';
    const maxUnitsPerLine = options.maxUnitsPerLine || 40;
    const maxLines = options.maxLines || 3;
    const sourceLines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const wrapped = [];

    sourceLines.forEach((line) => {
      let chunk = '';
      for (const ch of Array.from(line)) {
        const next = chunk + ch;
        if (countDisplayUnits(next) > maxUnitsPerLine && chunk) {
          wrapped.push(chunk);
          chunk = ch;
        } else {
          chunk = next;
        }
      }
      if (chunk) wrapped.push(chunk);
    });

    return wrapped.slice(0, maxLines).join('\n');
  }

  function extractClassFeatureHeadings(rawText, levelLimit) {
    const text = normalizeText(rawText).replace(/<[^>]+>/g, '\n');
    const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const limit = Number.parseInt(levelLimit, 10);
    const output = [];
    const seen = new Set();

    lines.forEach((line) => {
      const matched = line.match(/^等級\s*(\d+)：(.+)$/);
      if (!matched) return;
      const lv = Number.parseInt(matched[1], 10);
      if (Number.isFinite(limit) && lv > limit) return;
      const entry = `等級 ${matched[1]}：${matched[2].trim()}`;
      if (seen.has(entry)) return;
      seen.add(entry);
      output.push(entry);
    });

    return output;
  }

  function splitLinesForPdf(lines, chunkSize) {
    const result = ['', ''];
    lines.forEach((line) => {
      if (!line) return;
      const candidate = result[0] ? `${result[0]}\n${line}` : line;
      if (candidate.length <= chunkSize || !result[0]) {
        result[0] = candidate;
      } else {
        result[1] = result[1] ? `${result[1]}\n${line}` : line;
      }
    });
    return { classFeatures1: result[0], classFeatures2: result[1] };
  }

  function extractRaceFeatureHeadings(rawText) {
    const markerIdx = rawText.indexOf('你有以下特質');
    const target = markerIdx >= 0 ? rawText.slice(markerIdx) : rawText;
    const clean = target.replace(/<[^>]+>/g, '\n');
    const matches = clean.match(/([^\n：]{2,30})：/g) || [];
    const seen = new Set();
    return matches
      .map((item) => item.replace('：', '').trim())
      .filter((title) => {
        if (!title || seen.has(title)) return false;
        seen.add(title);
        return true;
      });
  }

  function findSpellDesc(classKey, level, spellName) {
    const allSpells = getSpellListMap();
    if (!classKey || !spellName || !allSpells?.[classKey]) return '';
    const levelKey = String(level);
    const spells = allSpells[classKey][levelKey] || [];
    const found = spells.find((spell) => spell.name === spellName);
    return found?.desc || '';
  }

  function getSpellLine(desc, label) {
    const pattern = new RegExp(`${label}\s*:\s*([^\n]+)`);
    const matched = desc.match(pattern);
    return matched ? matched[1].trim() : '';
  }

  function extractChineseSpellName(name) {
    if (!name) return '';
    const englishIndex = name.search(/[A-Za-z]/);
    if (englishIndex === -1) return name.trim();
    return name.slice(0, englishIndex).trim();
  }

  function convertCastTimeText(raw) {
    const text = normalizeText(raw);
    if (!text) return '';
    if (text.includes('附贈')) return '附贈';
    if (text.includes('反應')) return '反應';

    const minute = text.match(/(\d+)\s*分(?:鐘)?/);
    if (minute) return `${minute[1]}M`;

    const hour = text.match(/(\d+)\s*(?:小時|時)/);
    if (hour) return `${hour[1]}H`;

    if (text.includes('分鐘')) return 'M';
    if (text.includes('小時') || text.includes('時')) return 'H';

    return text.includes('動作') ? '動作' : text;
  }

  function buildSpellRows(state) {
    const rows = [];
    const areaConfig = [
      { area: 'cantrips-area', level: 0 },
      { area: 'level1spells-area', level: 1 },
      { area: 'level2spells-area', level: 2 },
      { area: 'level3spells-area', level: 3 }
    ];

    areaConfig.forEach(({ area, level }) => {
      const classRegex = new RegExp(`^${area}-class-(\\d+)$`);
      Object.keys(state)
        .map((key) => {
          const matched = key.match(classRegex);
          if (!matched) return null;
          const idx = matched[1];
          const classKey = state[key];
          const spellName = state[`${area}-spell-${idx}`];
          if (!classKey || !spellName) return null;
          return { idx: Number.parseInt(idx, 10), level, classKey, spellName };
        })
        .filter(Boolean)
        .sort((a, b) => a.idx - b.idx)
        .forEach((item) => rows.push(item));
    });

    return rows;
  }

  function parseSpellSlotsFromClassFeature(classKey, level) {
    const classLevel = Number.parseInt(level, 10);
    if (!Number.isFinite(classLevel)) return { slot1: '', slot2: '', slot3: '' };

    const fullCasterSlotMap = {
      1: { slot1: '2', slot2: '', slot3: '' },
      2: { slot1: '3', slot2: '', slot3: '' },
      3: { slot1: '4', slot2: '2', slot3: '' },
      4: { slot1: '4', slot2: '3', slot3: '' },
      5: { slot1: '4', slot2: '3', slot3: '2' }
    };

    const halfCasterSlotMap = {
      1: { slot1: '2', slot2: '', slot3: '' },
      2: { slot1: '2', slot2: '', slot3: '' },
      3: { slot1: '3', slot2: '', slot3: '' },
      4: { slot1: '3', slot2: '', slot3: '' },
      5: { slot1: '4', slot2: '2', slot3: '' }
    };

    const fullCasterClasses = new Set(['bard', 'cleric', 'druid', 'sorcerer', 'warlock']);
    const halfCasterClasses = new Set(['paladin', 'ranger', 'wizard']);

    if (fullCasterClasses.has(classKey)) {
      return fullCasterSlotMap[classLevel] || { slot1: '', slot2: '', slot3: '' };
    }

    if (halfCasterClasses.has(classKey)) {
      return halfCasterSlotMap[classLevel] || { slot1: '', slot2: '', slot3: '' };
    }

    return { slot1: '', slot2: '', slot3: '' };
  }

  function parseClassTableValue(classKey, label) {
    const raw = getClassFeaturesMap()[classKey] || '';
    if (!raw) return '';
    const normalizedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${normalizedLabel}[\\s\\S]*?<\\/td>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`, 'i');
    const match = raw.match(regex);
    if (!match) return '';
    return normalizeText(match[1].replace(/<br\s*\/?>/gi, '、').replace(/<[^>]+>/g, ''));
  }

  function parseClassDefaultEquipment(classKey) {
    const raw = getClassFeaturesMap()[classKey] || '';
    if (!raw) return '';
    const match = raw.match(/（A）[\s\S]*?<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/);
    if (!match) return '';
    return normalizeText(match[1].replace(/<br\s*\/?>/gi, '、').replace(/<[^>]+>/g, ''));
  }

  function getLanguageLabelByValue(value) {
    if (!value) return '';
    const lookup = getLanguageOptions();
    const found = lookup.find((item) => item.value === value);
    return found?.label || '';
  }

  function collectExtraLanguageLabels(state) {
    return Object.keys(state)
      .filter((key) => /^language-extra-\d+$/.test(key))
      .sort()
      .map((key) => getLanguageLabelByValue(state[key]))
      .filter(Boolean);
  }

  function getSelectedFeatNames(state) {
    return Object.keys(state)
      .filter((key) => /^feat-\d+$/.test(key))
      .sort((a, b) => Number.parseInt(a.split('-')[1], 10) - Number.parseInt(b.split('-')[1], 10))
      .map((key) => normalizeText(state[key]))
      .filter(Boolean);
  }

  function getSelectedMetamagicNames(state) {
    return METAMAGIC_OPTION_NAMES
      .map((name, index) => ({ name, checked: Boolean(state[`metamagic-option-${index + 1}`]) }))
      .filter((item) => item.checked)
      .map((item) => item.name);
  }

  function getSelectedEldritchInvocationNames(state) {
    const picks = [];
    ELDRITCH_INVOCATION_OPTIONS.forEach((option, index) => {
      for (let slot = 1; slot <= option.max; slot++) {
        if (state[`eldritch-invocation-${index}-${slot}`]) {
          picks.push(option.name);
        }
      }
    });
    return picks;
  }

  function buildGoliathRaceFeatureText(level, selectedAncestry) {
    const lines = ['巨人血統', '身強力壯'];
    const ancestryLabel = GOLIATH_ANCESTRY_LABELS[selectedAncestry];
    if (ancestryLabel) {
      lines.push(`${ancestryLabel}特性`);
    }

    const parsedLevel = Number.parseInt(level, 10);
    if (Number.isFinite(parsedLevel) && parsedLevel >= 5) {
      lines.push('巨化形體');
    }

    return wrapTextForPdf(lines.join('\n'), { maxUnitsPerLine: 34, maxLines: 8 });
  }

  function appendChoiceToHeading(lines, heading, choiceLabel) {
    if (!choiceLabel) return lines;
    return lines.map((line) => (line === heading ? `${heading}：${choiceLabel}` : line));
  }

  function buildPdfFieldPayload(state, options = {}) {
    const payload = {};
    const classKey = normalizeText(state.class);
    const backgroundKey = normalizeText(state.background);
    const level = normalizeText(state.level);

    Object.entries(DIRECT_FIELD_MAP).forEach(([stateKey, pdfFieldName]) => {
      payload[pdfFieldName] = normalizeText(state[stateKey]);
    });

    const mapMoneyField = (value, candidates) => {
      const text = normalizeText(value);
      candidates.forEach((name) => {
        payload[name] = text;
      });
    };

    // PDF 金錢欄位支援（琥珀金幣依需求不寫入 PDF）
    mapMoneyField(state['money-balance-cp'] ?? state['money-cp'], ['cp', 'CP', 'copper']);
    mapMoneyField(state['money-balance-sp'] ?? state['money-sp'], ['sp', 'SP', 'silver']);
    mapMoneyField(state['money-balance-gp'] ?? state['money-gp'], ['gp', 'GP', 'gold']);
    mapMoneyField(state['money-balance-pp'] ?? state['money-pp'], ['pp', 'PP', 'platinum']);

    const levelNumber = Number.parseInt(level, 10);
    if (Number.isFinite(levelNumber) && levelNumber > 0) {
      const hitDie = getHitDieByClass(classKey);
      payload.hp_dice_max = hitDie ? `${levelNumber}${hitDie}` : String(levelNumber);
    }
    payload.hp_dice_used = '';

    payload.Class = CLASS_LABELS[classKey] || payload.Class;
    payload.Subclass = (Number.isFinite(levelNumber) && levelNumber >= 3)
      ? (SUBCLASS_LABELS[classKey] || '')
      : '';
    payload.Background = BACKGROUND_LABELS[backgroundKey] || payload.Background;
    payload.Specie = RACE_LABELS[normalizeText(state.race)] || payload.Specie;
    payload.alignment = ALIGNMENT_LABELS[normalizeText(state.alignment)] || payload.alignment;
    payload.spell_cast_attri = SPELL_CAST_ABILITY_LABELS[normalizeText(state['spellcasting-ability'])] || payload.spell_cast_attri;

    payload.strMod = getSignedAbilityModifier(state.str);
    payload.dexMod = getSignedAbilityModifier(state.dex);
    payload.conMod = getSignedAbilityModifier(state.con);
    payload.intMod = getSignedAbilityModifier(state.int);
    payload.wisMod = getSignedAbilityModifier(state.wis);
    payload.chaMod = getSignedAbilityModifier(state.cha);

    const profBonus = getProficiencyBonusByLevel(level);
    payload.proficiencyBonus = profBonus;
    payload.prof_bonus = profBonus;
    payload.PB = profBonus;

    payload.toolsProficiency = getToolsProficiencyText(backgroundKey, classKey);

    if (options.size) {
      payload.size = options.size;
    }

    Object.entries(CHECKBOX_FIELD_MAP).forEach(([stateKey, pdfFieldName]) => {
      payload[pdfFieldName] = Boolean(state[stateKey]);
    });

    SKILL_ROWS.forEach((skill) => {
      payload[skill.chkField] = Boolean(state[skill.profId] || state[skill.expId]);
      payload[skill.modField] = normalizeText(state[skill.modId]);
    });

    const baseLang = normalizeCommaList(['通用', getLanguageLabelByValue(state.language1), getLanguageLabelByValue(state.language2)]);
    payload.language = baseLang;

    const classFeatureLines = extractClassFeatureHeadings(getClassFeaturesMap()[classKey] || '', level);
    const extraLanguages = collectExtraLanguageLabels(state);
    if (classKey === 'ranger' || classKey === 'rogue') {
      extraLanguages.forEach((label) => classFeatureLines.push(`額外語言：${label}`));
    }
    const classFeatureText = splitLinesForPdf(classFeatureLines, 140);
    payload.classFeatures1 = classFeatureText.classFeatures1;
    payload.classFeatures2 = classFeatureText.classFeatures2;

    const extraClassLines = [];
    if (classKey === 'sorcerer') {
      const metamagicNames = getSelectedMetamagicNames(state);
      if (metamagicNames.length) {
        extraClassLines.push(`超魔法：${metamagicNames.join('、')}`);
      }
    }
    if (classKey === 'warlock') {
      const invocationNames = getSelectedEldritchInvocationNames(state);
      if (invocationNames.length) {
        extraClassLines.push(`魔能祈喚：${invocationNames.join('、')}`);
      }
    }

    const classExtraText = normalizeText(state['class-extra']);
    if (classExtraText) {
      extraClassLines.push(classExtraText);
    }
    if (extraClassLines.length) {
      payload.classFeatures2 = payload.classFeatures2
        ? `${payload.classFeatures2}\n${extraClassLines.join('\n')}`
        : extraClassLines.join('\n');
    }

    if (state.race === 'goliath') {
      payload.specie_features = buildGoliathRaceFeatureText(level, options.goliathAncestry);
    } else {
      let raceHeadings = extractRaceFeatureHeadings(getRaceFeaturesMap()[state.race] || '');
      if (state.race === 'dragonborn') {
        raceHeadings = appendChoiceToHeading(
          raceHeadings,
          '龍族血統',
          DRAGONBORN_ANCESTRY_LABELS[options.dragonbornAncestry]
        );
      } else if (state.race === 'elf') {
        raceHeadings = appendChoiceToHeading(
          raceHeadings,
          '精靈傳承',
          ELF_LINEAGE_LABELS[options.elfLineage]
        );
      } else if (state.race === 'gnome') {
        raceHeadings = appendChoiceToHeading(
          raceHeadings,
          '侏儒血統',
          GNOME_LINEAGE_LABELS[options.gnomeLineage]
        );
      } else if (state.race === 'tiefling') {
        raceHeadings = appendChoiceToHeading(
          raceHeadings,
          '邪魔遺贈',
          TIEFLING_LEGACY_LABELS[options.tieflingLegacy]
        );
      }
      payload.specie_features = wrapTextForPdf(raceHeadings.join('\n'), { maxUnitsPerLine: 34, maxLines: 8 });
    }

    payload.weaponsProficiency = parseClassTableValue(classKey, '武器熟練項');
    const armorTraining = parseClassTableValue(classKey, '護甲訓練');
    payload.chk_light = /輕甲/.test(armorTraining);
    payload.chk_medium = /中甲/.test(armorTraining);
    payload.chk_heavy = /重甲/.test(armorTraining);
    payload.chk_shld = /盾牌/.test(armorTraining);

    const featNames = getSelectedFeatNames(state);
    payload.feats = wrapTextForPdf(featNames.join('\n'), { maxUnitsPerLine: 34, maxLines: 8 });

    const spellRows = buildSpellRows(state);
    if (spellRows.length <= 30) {
      spellRows.forEach((row, index) => {
        const xx = String(index + 1).padStart(2, '0');
        const desc = findSpellDesc(row.classKey, row.level === 0 ? 'cantrips' : row.level, row.spellName);
        const school = getSpellLine(desc, '學派');
        const castTimeRaw = getSpellLine(desc, '施法時間');
        const durationRaw = getSpellLine(desc, '持續時間');
        const rangeRaw = getSpellLine(desc, '射程');

        payload[`sp-level-${xx}`] = String(row.level);
        payload[`sp-name-${xx}`] = wrapTextForPdf(extractChineseSpellName(row.spellName), { maxUnitsPerLine: 14, maxLines: 2 });
        payload[`sp-cast-time-${xx}`] = convertCastTimeText(castTimeRaw);
        payload[`sp-range-${xx}`] = rangeRaw;
        payload[`sp-c-${xx}`] = /專注/.test(durationRaw);
        payload[`sp-r-${xx}`] = /儀式/.test(castTimeRaw);
        payload[`sp-m-${xx}`] = /材料|成分\s*:\s*.*M/i.test(desc);
        payload[`note${xx}`] = wrapTextForPdf([school, durationRaw].filter(Boolean).join(' '), { maxUnitsPerLine: 22, maxLines: 2 });
      });
    }

    const slots = parseSpellSlotsFromClassFeature(classKey, level);
    payload['spell-level-1'] = slots.slot1;
    payload['spell-level-2'] = slots.slot2;
    payload['spell-level-3'] = slots.slot3;

    if (options.characterName) {
      payload.Name = normalizeText(options.characterName);
    }

    if (options.includeDefaultEquipment) {
      const classEq = parseClassDefaultEquipment(classKey);
      const bgEq = normalizeText(getBackgroundMap()[backgroundKey]?.裝備A);
      payload.equipment = wrapTextForPdf([classEq, bgEq, payload.equipment].filter(Boolean).join('\n'), {
        maxUnitsPerLine: 52,
        maxLines: 12
      });
    } else {
      payload.equipment = wrapTextForPdf(payload.equipment, { maxUnitsPerLine: 52, maxLines: 12 });
    }

    return payload;
  }

  globalScope.PDF_FIELD_MAP = {
    DIRECT_FIELD_MAP,
    CHECKBOX_FIELD_MAP,
    SKILL_ROWS
  };
  globalScope.buildPdfFieldPayload = buildPdfFieldPayload;
})(window);

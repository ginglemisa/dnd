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

  function normalizeText(value) {
    if (value === undefined || value === null) return '';
    return String(value).trim();
  }

  function normalizeCommaList(values) {
    return values.map(normalizeText).filter(Boolean).join(',');
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
    if (classKey === 'ranger') {
      const rangerSlotMap = {
        1: { slot1: '2', slot2: '', slot3: '' },
        2: { slot1: '2', slot2: '', slot3: '' },
        3: { slot1: '3', slot2: '', slot3: '' },
        4: { slot1: '3', slot2: '', slot3: '' },
        5: { slot1: '4', slot2: '2', slot3: '' }
      };
      if (rangerSlotMap[classLevel]) return rangerSlotMap[classLevel];
    }

    const raw = getClassFeaturesMap()[classKey] || '';
    if (!raw) return { slot1: '', slot2: '', slot3: '' };

    const normalized = raw.replace(/\r/g, '');
    const rows = normalized.match(/<tr[\s\S]*?<\/tr>/g) || [];
    const wantedLevel = String(level);

    for (const row of rows) {
      const cells = Array.from(row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g))
        .map((match) => normalizeText(match[1].replace(/<[^>]+>/g, '')));
      if (!cells.length) continue;
      if (cells[0] !== wantedLevel) continue;
      const tail = cells.slice(-3).map((cell) => (cell === '-' || cell === '--' ? '' : cell));
      return {
        slot1: tail[0] || '',
        slot2: tail[1] || '',
        slot3: tail[2] || ''
      };
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

  function buildPdfFieldPayload(state, options = {}) {
    const payload = {};
    const classKey = normalizeText(state.class);
    const level = normalizeText(state.level);

    Object.entries(DIRECT_FIELD_MAP).forEach(([stateKey, pdfFieldName]) => {
      payload[pdfFieldName] = normalizeText(state[stateKey]);
    });

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

    const classExtraText = normalizeText(state['class-extra']);
    if (classExtraText) {
      payload.classFeatures2 = payload.classFeatures2
        ? `${payload.classFeatures2}\n\n${classExtraText}`
        : classExtraText;
    }

    const raceHeadings = extractRaceFeatureHeadings(getRaceFeaturesMap()[state.race] || '');
    payload.specie_features = raceHeadings.join('\n');

    payload.weaponsProficiency = parseClassTableValue(classKey, '武器熟練項');
    const armorTraining = parseClassTableValue(classKey, '護甲訓練');
    payload.chk_light = /輕甲/.test(armorTraining);
    payload.chk_medium = /中甲/.test(armorTraining);
    payload.chk_heavy = /重甲/.test(armorTraining);
    payload.chk_shld = /盾牌/.test(armorTraining);

    const featNames = getSelectedFeatNames(state);
    payload.feats = featNames.join('\n');

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
        payload[`sp-name-${xx}`] = extractChineseSpellName(row.spellName);
        payload[`sp-cast-time-${xx}`] = convertCastTimeText(castTimeRaw);
        payload[`sp-range-${xx}`] = rangeRaw;
        payload[`sp-c-${xx}`] = /專注/.test(durationRaw);
        payload[`sp-r-${xx}`] = /儀式/.test(castTimeRaw);
        payload[`sp-m-${xx}`] = /材料|成分\s*:\s*.*M/i.test(desc);
        payload[`note${xx}`] = [school, durationRaw].filter(Boolean).join(' ');
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
      const bgEq = normalizeText(getBackgroundMap()[state.background]?.裝備A);
      payload.equipment = [classEq, bgEq, payload.equipment].filter(Boolean).join('；');
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

(function attachPdfFieldMap(globalScope) {
  // 職業機制資料（class-content.generated.js 的 classRules，由 content/ 的職業內容檔產生）。
  function getClassRules(classKey) {
    const rules = typeof classRules !== 'undefined' ? classRules : (globalScope.classRules || {});
    return Object.hasOwn(rules, classKey) ? rules[classKey] : null;
  }

  function getClassFeatureRules(classKey) {
    return globalScope.getClassFeatureRules?.(classKey) || [];
  }

  // 內建背景的規則與顯示文字（background-content.generated.js）；自訂背景另讀 state.__customBackground。
  function getBuiltInBackground(backgroundKey) {
    const rules = typeof backgroundRules !== 'undefined' ? backgroundRules : (globalScope.backgroundRules || {});
    const text = typeof backgroundText !== 'undefined' ? backgroundText : (globalScope.backgroundText || {});
    return Object.hasOwn(rules, backgroundKey) ? { rules: rules[backgroundKey], text: text[backgroundKey] } : null;
  }

  function getSpellCatalog() {
    const root = typeof globalThis !== 'undefined' ? globalThis : globalScope;
    const catalog = root?.SpellCatalog || globalScope?.SpellCatalog;
    return catalog && typeof catalog.getSpell === 'function' ? catalog : null;
  }

  function getLanguageOptions() {
    const base = (typeof BASE_LANGUAGE_OPTIONS !== 'undefined') ? BASE_LANGUAGE_OPTIONS : (globalScope.BASE_LANGUAGE_OPTIONS || []);
    const extra = (typeof EXTRA_LANGUAGE_OPTIONS !== 'undefined') ? EXTRA_LANGUAGE_OPTIONS : (globalScope.EXTRA_LANGUAGE_OPTIONS || []);
    return [...base, ...extra];
  }

  const DIRECT_FIELD_MAP = Object.freeze({
    class: 'Class1',
    level: 'Level1',
    background: 'Background2',
    race: 'Specie1',
    alignment: 'alignment1',
    // The template's internal ability-score and modifier field names are
    // opposite to their visible labels.
    str: 'strMod1',
    dex: 'dexMod1',
    con: 'conMod1',
    int: 'intMod1',
    wis: 'wisMod1',
    cha: 'chaMod1',
    'save-str': 'strSaveMod1',
    'save-dex': 'dexSaveMod1',
    'save-con': 'conSaveMod1',
    'save-int': 'intSaveMod1',
    'save-wis': 'wisSaveMod1',
    'save-cha': 'chaSaveMod1',
    'initiative-input': 'initiative1',
    'speed-input': 'speed1',
    'passive-perception': 'passivePerception1',
    'ac-display': 'AC1',
    'hp-display': 'hp_max1',
    'spellcasting-ability': 'spell_cast_attri1',
    'spell-adjustment': 'spell_cast_Mod1',
    'spell-save-dc': 'spell_cast_DC1',
    'spell-attack-bonus': 'spell_cast_toHit1',
    'atk-main-name': 'attack-weap-name-1',
    'atk-main-hit': 'toHit1',
    'atk-main-dmg': 'dmg_type_1',
    'atk-main-note': 'wp-note-1',
    'atk-off-name': 'attack-weap-name-2',
    'atk-off-hit': 'toHit2',
    'atk-off-dmg': 'dmg_type_2',
    'atk-off-note': 'wp-note-2',
    'gear-notes': 'equipment1'
  });

  const CHECKBOX_FIELD_MAP = Object.freeze({
    'heroic-inspiration': 'heroInspiration1',
    'prof-str': 'strSaveChk1',
    'prof-dex': 'dexSaveChk1',
    'prof-con': 'conSaveChk1',
    'prof-int': 'intSaveChk1',
    'prof-wis': 'wisSaveChk1',
    'prof-cha': 'chaSaveChk1'
  });

  // Text specs recalibrated against the resized PDF fields using the
  // calibration overlay. Values are intentionally conservative so form
  // rendering has some headroom for punctuation and mixed-width text.
  const PDF_TEXT_SPECS = Object.freeze({
    classFeatures1: Object.freeze({ maxUnitsPerLine: 28, maxLines: 10 }),
    // classFeatures2 maps to player-authored textarea content. The PDF field
    // is multiline, scrollable, and has no MaxLen, so we preserve the full
    // text instead of truncating it during export.
    classFeatures2: Object.freeze({ maxUnitsPerLine: 28, maxLines: Number.MAX_SAFE_INTEGER }),
    // 14 display units fit seven CJK glyphs per line. Ten lines keep these
    // narrow columns readable when printed on A4 paper.
    specie_features1: Object.freeze({ maxUnitsPerLine: 14, maxLines: 10, maxTotalUnits: 140 }),
    feats1: Object.freeze({ maxUnitsPerLine: 14, maxLines: 10, maxTotalUnits: 140 })
  });
  const MAX_PDF_SPELL_ROWS = 19;
  const MAX_PDF_WEAPON_ROWS = 7;

  // The official sheet's multiline fields are wider and taller. Units assume
  // a 9 pt appearance: each CJK glyph takes two units of 4.5 pt.
  const OFFICIAL_PDF_TEXT_SPECS = Object.freeze({
    classFeatures1: Object.freeze({ maxUnitsPerLine: 38, maxLines: 17 }),
    classFeatures2: Object.freeze({ maxUnitsPerLine: 38, maxLines: Number.MAX_SAFE_INTEGER }),
    specie_features1: Object.freeze({ maxUnitsPerLine: 36, maxLines: 14, maxTotalUnits: 36 * 14 }),
    feats1: Object.freeze({ maxUnitsPerLine: 38, maxLines: 14, maxTotalUnits: 38 * 14 })
  });
  const OFFICIAL_MAX_PDF_SPELL_ROWS = 30;
  const OFFICIAL_MAX_PDF_WEAPON_ROWS = 6;
  const OFFICIAL_SPELL_ROW_SUFFIXES = Array.from('123456789abcdefghijklmnopqrstu');

  function isOfficialSheet(options = {}) {
    return options.sheetTemplate === 'official';
  }

  function getPdfTextSpecs(options = {}) {
    return isOfficialSheet(options) ? OFFICIAL_PDF_TEXT_SPECS : PDF_TEXT_SPECS;
  }

  const SKILL_ROWS = Object.freeze([
    { name: '運動', profId: 'prof-運動', expId: 'exp-運動', modId: 'skill-運動', chkField: 'athleticsChk1', modField: 'athleticsMod1' },
    { name: '體操', profId: 'prof-體操', expId: 'exp-體操', modId: 'skill-體操', chkField: 'acrobaticsChk1', modField: 'acrobaticsMod1' },
    { name: '巧手', profId: 'prof-巧手', expId: 'exp-巧手', modId: 'skill-巧手', chkField: 'sleightOfHandChk1', modField: 'sleightOfHandMod1' },
    { name: '隱匿', profId: 'prof-隱匿', expId: 'exp-隱匿', modId: 'skill-隱匿', chkField: 'stealthChk1', modField: 'stealthMod1' },
    { name: '奧秘', profId: 'prof-奧秘', expId: 'exp-奧秘', modId: 'skill-奧秘', chkField: 'arcanaChk1', modField: 'arcanaMod1' },
    { name: '歷史', profId: 'prof-歷史', expId: 'exp-歷史', modId: 'skill-歷史', chkField: 'historyChk1', modField: 'historyMod1' },
    { name: '調查', profId: 'prof-調查', expId: 'exp-調查', modId: 'skill-調查', chkField: 'investigationChk1', modField: 'investigationMod1' },
    { name: '自然', profId: 'prof-自然', expId: 'exp-自然', modId: 'skill-自然', chkField: 'natureChk1', modField: 'natureMod1' },
    { name: '宗教', profId: 'prof-宗教', expId: 'exp-宗教', modId: 'skill-宗教', chkField: 'religionChk1', modField: 'religionMod1' },
    { name: '馴獸', profId: 'prof-馴獸', expId: 'exp-馴獸', modId: 'skill-馴獸', chkField: 'animalHandlingChk2', modField: 'animalHandlingMod2' },
    { name: '洞悉', profId: 'prof-洞悉', expId: 'exp-洞悉', modId: 'skill-洞悉', chkField: 'insightChk1', modField: 'insightMod1' },
    { name: '醫藥', profId: 'prof-醫藥', expId: 'exp-醫藥', modId: 'skill-醫藥', chkField: 'medicineChk1', modField: 'medicineMod1' },
    { name: '察覺', profId: 'prof-察覺', expId: 'exp-察覺', modId: 'skill-察覺', chkField: 'perceptionChk1', modField: 'perceptionMod1' },
    { name: '求生', profId: 'prof-求生', expId: 'exp-求生', modId: 'skill-求生', chkField: 'survivalChk1', modField: 'survivalMod1' },
    { name: '欺瞞', profId: 'prof-欺瞞', expId: 'exp-欺瞞', modId: 'skill-欺瞞', chkField: 'deceptionChk1', modField: 'deceptionMod1' },
    { name: '威嚇', profId: 'prof-威嚇', expId: 'exp-威嚇', modId: 'skill-威嚇', chkField: 'intimidationChk1', modField: 'intimidationMod1' },
    { name: '表演', profId: 'prof-表演', expId: 'exp-表演', modId: 'skill-表演', chkField: 'performanceChk1', modField: 'performanceMod1' },
    { name: '遊說', profId: 'prof-遊說', expId: 'exp-遊說', modId: 'skill-遊說', chkField: 'persuasionChk1', modField: 'persuasionMod1' }
  ]);

  // 職業名稱與子職名稱（PDF 的 Subclass1／Class1 欄）取自職業內容檔；子職目前為各職業的預設子職。
  function getClassLabel(classKey) {
    return getClassRules(classKey)?.name || '';
  }

  function getSubclassLabel(classKey) {
    return globalScope.getSelectedSubclass?.(classKey)?.name || '';
  }

  // A selected option is appended to its heading as "／選項"; nextLine specs
  // print "選擇：選項" below instead. Unselected options leave the heading as is.
  // 一般選項與下拉選擇卡片的選擇由職業內容檔推得（getClassFeatureChoiceSpecs）；
  // 下列是給予專長或戲法的選擇（戰鬥風格、受祝福的勇士、德魯伊教戰士），另讀角色的專長與戲法。
  const CLASS_FEATURE_CHOICE_SPECS = Object.freeze({
    fighter: Object.freeze([
      Object.freeze({ heading: '等級 1：戰鬥風格', featStateKey: 'derived-feat-fighting-style-fighter' }),
      Object.freeze({ heading: '等級 7：額外戰鬥風格（勇士）', featStateKey: 'derived-feat-fighting-style-fighter-2', nextLine: true })
    ]),
    paladin: Object.freeze([
      Object.freeze({
        heading: '等級 2：戰鬥風格',
        featureId: 'paladin-fighting-style',
        styleStateKey: 'paladin-fighting-style',
        featStateKey: 'derived-feat-fighting-style-paladin'
      })
    ]),
    ranger: Object.freeze([
      Object.freeze({
        heading: '等級 2：戰鬥風格',
        featureId: 'ranger-fighting-style',
        styleStateKey: 'ranger-fighting-style',
        featStateKey: 'derived-feat-fighting-style-ranger'
      })
    ])
  });

  // 職業特性欄的標題：「等級 N：能力名稱」，子職能力加上「（子職簡稱）」；依職業頁順序，略過「選擇子職」的入口。
  function getClassFeatureHeading(feature, classKey) {
    const rules = getClassRules(classKey);
    const subclass = feature.subclass ? rules?.subclasses.find((item) => item.id === feature.subclass) : null;
    return `等級 ${feature.level}：${feature.name}${subclass ? `（${subclass.shortName}）` : ''}`;
  }

  function getClassFeatureHeadings(classKey, levelLimit) {
    const limit = Number.parseInt(levelLimit, 10);
    return [...new Set(getClassFeatureRules(classKey)
      .filter((feature) => feature.type !== 'subclass' && !(Number.isFinite(limit) && feature.level > limit))
      .map((feature) => getClassFeatureHeading(feature, classKey)))];
  }

  // 選項與下拉選擇卡片：勾選的選項接在標題後（「／選項」）。短休或長休可改選的選項（changeOn）與給予專長的選項不列。
  function getClassFeatureChoiceSpecs(classKey) {
    const derived = getClassFeatureRules(classKey).flatMap((feature) => {
      const heading = getClassFeatureHeading(feature, classKey);
      if (feature.select) {
        return [{ heading, selectStateKey: feature.select.id, labels: Object.fromEntries(feature.select.choices.map((choice) => [choice.value, choice.name])) }];
      }
      if (!feature.options || feature.changeOn || feature.options.some((option) => option.featChoice)) return [];
      return [{ heading, choices: feature.options.map((option) => ({ stateKey: option.id, label: option.name })) }];
    });
    return [...derived, ...(CLASS_FEATURE_CHOICE_SPECS[classKey] || []).map((spec) => (
      spec.featureId ? { ...spec, ...getClassFeatureCantripSpec(classKey, spec.featureId) } : spec
    ))];
  }

  // 改選自選戲法的選項（內容檔選項 grants.cantrips 數量 2 以上，例如受祝福的勇士）：選了就以該選項取代戰鬥風格標題。
  // 戲法欄位鍵與網站 getClassFeatureCantripChoices 相同：class-<選項 ID>-cantrip-<序號>。
  function getClassFeatureCantripSpec(classKey, featureId) {
    const feature = getClassRules(classKey)?.features.find((item) => item.id === featureId);
    const option = feature?.options?.find((item) => item.grants?.cantrips?.count > 1);
    if (!option) return {};
    const { count, label } = option.grants.cantrips;
    return {
      magicStateKey: option.id,
      magicHeading: `等級 ${feature.level}：${label || option.name}`,
      cantripKeys: Array.from({ length: count }, (_, index) => `class-${option.id}-cantrip-${index + 1}`)
    };
  }

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

  const MAGIC_INITIATE_CLASS_LABELS = Object.freeze({
    cleric: '牧師',
    druid: '德魯伊',
    wizard: '法師'
  });

  const MAGIC_INITIATE_PDF_SPELL_LABELS = Object.freeze({
    'create-or-destroy-water': '造水/枯水',
    'detect-poison-and-disease': '偵測毒與病'
  });

  // PDF 種族特質欄：種族內容檔的 pdf 行（raceText.pdf）。{choice} 為所選血統選項的 pdfLabel（PDF 匯出選項傳入），
  // { choice: 等級 } 插入該選項該等級的行，{ minLevel } 的行在等級達到或未填等級時出現。
  function buildRaceTemplateText(state, options = {}) {
    const raceKey = normalizeText(state?.race);
    const pdf = globalScope.getRaceText?.(raceKey)?.pdf;
    const choiceId = globalScope.getRaceRules?.(raceKey)?.choice?.id;
    const option = choiceId ? globalScope.getRaceChoiceOption?.(raceKey, normalizeText(options[globalScope.getRaceChoiceOptionKey(choiceId)])) : null;
    const constitutionModifier = getAbilityModifierNumber(state?.con);
    const values = {
      proficiency: getPdfProficiencyValueByLevel(state?.level),
      choice: option?.pdfLabel || pdf?.choiceFallback || '',
      conModifier: formatFormulaModifier(constitutionModifier),
      breathSaveDc: getDragonbornBreathSaveDc(state?.level, constitutionModifier),
      breathDice: getDragonbornBreathDamageDice(state?.level)
    };
    const fill = (line) => line.replace(/\{([A-Za-z]+)\}/g, (all, name) => values[name] ?? all);
    const expand = (lines) => lines.flatMap((line) => {
      if (typeof line === 'string') return [fill(line)];
      if (line.lines) return shouldShowAtOrAboveSelectedLevel(state?.level, line.minLevel) ? expand(line.lines) : [];
      return (option ? (pdf.options?.[option.value]?.[line.choice] || []) : line.fallback).map(fill);
    });
    const lines = pdf ? expand(pdf.lines) : [];
    return wrapTextForPdf(lines.join('\n'), getPdfTextSpecs(options).specie_features1);
  }

  function normalizeText(value) {
    if (value === undefined || value === null) return '';
    return String(value).trim();
  }

  function formatSkillModifierForPdf(value) {
    const text = normalizeText(value).replace(/\s+/g, '');
    if (!/^[+-]?\d+$/.test(text)) return text;

    const modifier = Number.parseInt(text, 10);
    if (!Number.isSafeInteger(modifier)) return text;
    if (modifier >= 10) return String(modifier);
    if (modifier >= 0) return `+${modifier}`;
    return String(modifier);
  }

  // Both PDF fonts carry proportional Latin widths, so dice and bonuses stay
  // half-width; full-width forms would spread "1d12" across the field.
  function formatDamageTypeForPdf(value) {
    return normalizeText(value).replace(/\s+/g, ' ');
  }

  function getSelectedLevelNumber(level) {
    const text = normalizeText(level);
    if (!text) return null;
    const parsed = Number.parseInt(text, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  function shouldShowAtOrAboveSelectedLevel(level, targetLevel) {
    const parsedLevel = getSelectedLevelNumber(level);
    return parsedLevel === null || parsedLevel >= targetLevel;
  }

  function normalizeCommaList(values) {
    return values.map(normalizeText).filter(Boolean).join(',');
  }

  function getAbilityModifierNumber(score) {
    const parsed = Number.parseInt(score, 10);
    if (!Number.isFinite(parsed)) return null;
    return Math.floor((parsed - 10) / 2);
  }

  function getSignedAbilityModifier(score) {
    const mod = getAbilityModifierNumber(score);
    if (!Number.isFinite(mod)) return '';
    return mod > 0 ? `+${mod}` : String(mod);
  }

  function formatCompactSavingThrowModifier(value) {
    const text = normalizeText(value);
    return /^\+\d{2}$/.test(text) ? text.slice(1) : text;
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

  function getPdfProficiencyValueByLevel(level) {
    const profBonus = getProficiencyBonusByLevel(level);
    return profBonus ? profBonus.replace(/^\+/, '') : 'P';
  }

  function getProficiencyBonusNumberByLevel(level) {
    const profBonus = getProficiencyBonusByLevel(level);
    const parsed = Number.parseInt(profBonus, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function getDragonbornBreathSaveDc(level, constitutionModifier) {
    const parsedLevel = getSelectedLevelNumber(level);
    const proficiencyBonus = getProficiencyBonusNumberByLevel(level);
    if (parsedLevel === null || !Number.isFinite(constitutionModifier) || !Number.isFinite(proficiencyBonus)) {
      return '__';
    }
    return String(8 + proficiencyBonus + constitutionModifier);
  }

  function getDragonbornBreathDamageDice(level) {
    const parsedLevel = getSelectedLevelNumber(level);
    if (parsedLevel === null) return '_';
    return parsedLevel >= 5 ? '2' : '1';
  }

  function formatFormulaModifier(modifier, fallback = '+C') {
    if (!Number.isFinite(modifier)) return fallback;
    return modifier >= 0 ? `+${modifier}` : String(modifier);
  }

  function getHitDieByClass(classKey) {
    const hitDie = getClassRules(classKey)?.hitDie;
    return hitDie ? String(hitDie) : '';
  }

  // 目前職業此等級生效的 grants（能力層與勾選中的選項，例如守護者、哨衛），等級未填時同網站視為 1 級。
  function getActiveClassGrantsForPdf(state) {
    const classKey = normalizeText(state?.class);
    const level = getSelectedLevelNumber(state?.level) || 1;
    return getClassGrants(classKey, level, (id) => state?.[id] === true);
  }

  // 職業的護甲訓練（內容檔 proficiencies.armor 與選項 grants.armor：light／medium／heavy／shield）。
  function getClassArmorTrainingForPdf(state) {
    const classKey = normalizeText(state?.class);
    return [
      ...(getClassRules(classKey)?.proficiencies?.armor || []),
      ...getActiveClassGrantsForPdf(state).flatMap((item) => item.grants.armor || [])
    ];
  }

  // 武器熟練：職業內容檔的純文字，再接上選項 grants.weapons 給予、職業本身沒有的類別（例如守護者的軍用武器）。
  const WEAPON_CATEGORY_LABELS = Object.freeze({ simple: '簡易武器', martial: '軍用武器' });

  function getWeaponProficiencyTextForPdf(state) {
    const classKey = normalizeText(state?.class);
    const categories = getClassRules(classKey)?.proficiencies?.weapons?.categories || [];
    const extra = [...new Set(getActiveClassGrantsForPdf(state).flatMap((item) => item.grants.weapons || []))]
      .filter((category) => !categories.includes(category) && WEAPON_CATEGORY_LABELS[category])
      .map((category) => WEAPON_CATEGORY_LABELS[category]);
    return [getClassProfileText(classKey, 'weapons'), ...extra].filter(Boolean).join('和');
  }

  function hasShieldProficiencyForPdf(state) {
    return getClassArmorTrainingForPdf(state).includes('shield');
  }

  function hasEffectiveShieldForPdf(state) {
    const weaponList = [
      ...(globalScope.weapons_simple_melee || []),
      ...(globalScope.weapons_simple_ranged || []),
      ...(globalScope.weapons_martial_melee || []),
      ...(globalScope.weapons_martial_ranged || [])
    ];
    const isTwoHandedWeapon = name => {
      const weapon = weaponList.find(item => item?.名稱 === name);
      return [weapon?.屬性1, weapon?.屬性2, weapon?.屬性3, weapon?.屬性4]
        .some(property => String(property || '').includes('雙手'));
    };
    if (typeof globalScope.isEffectiveShieldEquippedForState === 'function') {
      return globalScope.isEffectiveShieldEquippedForState(state, {
        isShieldProficient: hasShieldProficiencyForPdf,
        isTwoHandedWeapon
      });
    }
    return state.offHandAsMain !== true && normalizeText(state.offHand) === '盾牌';
  }

  function collectToolProficiencyNames(state) {
    const seen = new Set();
    return Object.keys(state)
      .filter((key) => /^(?:tool-proficiency|bard-instrument|monk-tool-proficiency)-\d+$/.test(key)
        || /^(?:druid|rogue)-fixed-tool-proficiency$/.test(key))
      .sort((a, b) => {
        const aGroup = a.startsWith('tool-proficiency-') ? 0 : 1;
        const bGroup = b.startsWith('tool-proficiency-') ? 0 : 1;
        const slot = key => Number.parseInt(key.split('-').at(-1), 10) || 1;
        return aGroup - bGroup || slot(a) - slot(b);
      })
      .map((key) => normalizeText(state[key]))
      .filter((value) => {
        if (!value || seen.has(value)) return false;
        seen.add(value);
        return true;
      });
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
    const maxTotalUnits = Number.isFinite(options.maxTotalUnits) ? options.maxTotalUnits : Number.POSITIVE_INFINITY;
    const sourceLines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const wrapped = [];
    let consumedUnits = 0;
    let reachedTotalLimit = false;

    sourceLines.forEach((line) => {
      if (reachedTotalLimit) return;
      let chunk = '';
      for (const ch of Array.from(line)) {
        const charUnits = countDisplayUnits(ch);
        if ((consumedUnits + charUnits) > maxTotalUnits) {
          reachedTotalLimit = true;
          break;
        }
        const next = chunk + ch;
        if (countDisplayUnits(next) > maxUnitsPerLine && chunk) {
          wrapped.push(chunk);
          chunk = ch;
        } else {
          chunk = next;
        }
        consumedUnits += charUnits;
      }
      if (chunk) wrapped.push(chunk);
    });

    return wrapped.slice(0, maxLines).join('\n');
  }

  // equipment1 / extra1 keep only source line breaks here. pdf-export.js wraps
  // them by measured glyph widths when it draws the field appearance.
  function normalizeUserTextForPdf(rawText) {
    const lines = [];
    normalizeText(rawText).replace(/\r/g, '').replace(/\t/g, ' ').split('\n').forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine) lines.push(trimmedLine);
      else if (lines.length > 0 && lines.at(-1) !== '') lines.push('');
    });
    return lines.join('\n');
  }

  function normalizeEquipmentListForPdf(rawText) {
    return normalizeText(rawText).replace(/\r/g, '').replace(/\t/g, ' ')
      .split(/\n+/)
      .map((line) => line.split('、').map((item) => item.trim()).filter(Boolean).join('、'))
      .filter(Boolean)
      .join('\n');
  }

  const PDF_BASE_LANGUAGE_LABELS = Object.freeze({
    'common-sign': '手語',
    draconic: '龍語',
    dwarvish: '矮人語',
    elvish: '精靈語',
    giant: '巨人語',
    gnomish: '侏儒語',
    goblin: '哥布林語',
    halfling: '半身人語',
    orc: '獸人語'
  });

  function getBaseLanguageLabelForPdf(value) {
    const normalizedValue = normalizeText(value);
    return PDF_BASE_LANGUAGE_LABELS[normalizedValue] || getLanguageLabelByValue(normalizedValue);
  }

  function getSpareTheDyingRangeForPdf(level) {
    const parsedLevel = getSelectedLevelNumber(level);
    if (parsedLevel === null) return '變動';
    if (parsedLevel <= 4) return '15呎';
    if (parsedLevel <= 10) return '30呎';
    if (parsedLevel <= 16) return '60呎';
    return '120呎';
  }

  function wrapTextForPdfWithOverflow(rawText, options = {}) {
    const text = normalizeText(rawText).replace(/\r/g, '').replace(/\t/g, ' ');
    if (!text) {
      return {
        text: '',
        overflow: '',
        truncated: false
      };
    }

    const maxUnitsPerLine = options.maxUnitsPerLine || 40;
    const maxLines = options.maxLines || 3;
    const maxTotalUnits = Number.isFinite(options.maxTotalUnits) ? options.maxTotalUnits : Number.POSITIVE_INFINITY;
    const sourceLines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const wrapped = [];
    let consumedUnits = 0;
    let reachedTotalLimit = false;

    sourceLines.forEach((line) => {
      if (reachedTotalLimit) return;
      let chunk = '';
      for (const ch of Array.from(line)) {
        const charUnits = countDisplayUnits(ch);
        if ((consumedUnits + charUnits) > maxTotalUnits) {
          reachedTotalLimit = true;
          break;
        }
        const next = chunk + ch;
        if (countDisplayUnits(next) > maxUnitsPerLine && chunk) {
          wrapped.push(chunk);
          chunk = ch;
        } else {
          chunk = next;
        }
        consumedUnits += charUnits;
      }
      if (chunk) wrapped.push(chunk);
    });

    const fittedLines = wrapped.slice(0, maxLines);
    const overflowLines = wrapped.slice(maxLines);
    return {
      text: fittedLines.join('\n'),
      overflow: overflowLines.join('\n'),
      truncated: reachedTotalLimit || overflowLines.length > 0
    };
  }

  function wrapTextForPdfWithEllipsis(rawText, options = {}) {
    const result = wrapTextForPdfWithOverflow(rawText, options);
    if (!result.truncated || !result.text) return result.text;

    const maxUnitsPerLine = options.maxUnitsPerLine || 40;
    const lines = result.text.split('\n');
    let finalLine = lines.at(-1) || '';
    while (finalLine && countDisplayUnits(`${finalLine}…`) > maxUnitsPerLine) {
      finalLine = Array.from(finalLine).slice(0, -1).join('');
    }
    lines[lines.length - 1] = `${finalLine}…`;
    return lines.join('\n');
  }

  function getSelectedClassFeatureChoiceLabel(spec, state) {
    if (spec.selectStateKey) {
      return spec.labels?.[normalizeText(state[spec.selectStateKey])] || '';
    }
    if (spec.featStateKey) {
      return normalizeText(state[spec.featStateKey]);
    }
    return spec.choices?.find((choice) => Boolean(state[choice.stateKey]))?.label || '';
  }

  function getClassFeatureCantripNames(state, keys) {
    const saved = state.__spellManagement?.classFeatureCantrips || state.__classFeatureCantrips || {};
    return keys
      .map((key) => getCanonicalSpell(resolveStateSpellId(normalizeText(saved[key])))?.nameZh)
      .filter(Boolean);
  }

  function getClassFeatureChoiceLines(spec, state) {
    // Paladin/ranger level 2: the magic option replaces the fighting style
    // heading; the style feat is shown only while Fighting Style is chosen.
    if (spec.magicStateKey && state[spec.magicStateKey]) {
      const cantrips = getClassFeatureCantripNames(state, spec.cantripKeys);
      return cantrips.length ? [spec.magicHeading, `選擇：${cantrips.join('、')}`] : [spec.magicHeading];
    }
    if (spec.styleStateKey && !state[spec.styleStateKey]) return [spec.heading];
    const label = getSelectedClassFeatureChoiceLabel(spec, state);
    if (!label) return [spec.heading];
    return spec.nextLine ? [spec.heading, `選擇：${label}`] : [`${spec.heading}／${label}`];
  }

  function insertSelectedClassFeatureChoices(lines, classKey, state) {
    const specs = getClassFeatureChoiceSpecs(classKey);
    if (!specs.length) return lines;

    const specByHeading = new Map(specs.map((spec) => [spec.heading, spec]));
    return lines.flatMap((line) => {
      const spec = specByHeading.get(line);
      return spec ? getClassFeatureChoiceLines(spec, state) : [line];
    });
  }

  // 同等級標記 pdfMerge 的能力（職業內容檔）合併成一行，依職業頁順序以「、」連接，放在第一個的位置。
  function mergeClassFeatureHeadings(lines, classKey) {
    let output = [...lines];
    const groups = new Map();
    getClassFeatureRules(classKey).filter((feature) => feature.pdfMerge).forEach((feature) => {
      if (!groups.has(feature.level)) groups.set(feature.level, []);
      groups.get(feature.level).push(feature.name);
    });
    groups.forEach((titles, level) => {
      const presentTitles = titles.filter((title) => output.includes(`等級 ${level}：${title}`));
      if (presentTitles.length < 2) return;
      const presentHeadings = new Set(presentTitles.map((title) => `等級 ${level}：${title}`));
      let placed = false;
      output = output.flatMap((line) => {
        if (!presentHeadings.has(line)) return [line];
        if (placed) return [];
        placed = true;
        return [`等級 ${level}：${presentTitles.join('、')}`];
      });
    });
    return output;
  }

  function getCanonicalSpell(spellId) {
    const catalog = getSpellCatalog();
    if (!catalog || typeof spellId !== 'string') return null;
    try {
      return catalog.getSpell(spellId) || null;
    } catch (_) {
      return null;
    }
  }

  function resolveStateSpellId(value) {
    const rawValue = typeof value === 'string' ? value : '';
    const catalog = getSpellCatalog();
    if (!rawValue || !catalog) return '';

    const directSpell = getCanonicalSpell(rawValue);
    if (directSpell) return rawValue;
    if (typeof catalog.resolveSpellId !== 'function') return '';
    try {
      const legacySpellId = catalog.resolveSpellId(rawValue);
      return getCanonicalSpell(legacySpellId) ? legacySpellId : '';
    } catch (_) {
      return '';
    }
  }

  // 法術標頭（學派、施法時間、射程、持續時間、專注、儀式、材料）讀結構化資料：
  // 目錄法術用 SpellCatalog.getSpellHeader，自創法術用其 header（同形狀），不解析說明文字。
  function getSpellRowHeader(row) {
    if (row.customSpell) return row.customSpell.header || {};
    const catalog = getSpellCatalog();
    try {
      return catalog?.getSpellHeader?.(row.spellId) || {};
    } catch (_) {
      return {};
    }
  }

  const PDF_CAST_TIME_LABELS = Object.freeze({ action: '動作', 'bonus-action': '附贈', reaction: '反應' });

  // 角色紙的施法時間欄：多種施法時間以「或」連接，附贈／反應用簡稱，不列儀式與觸發條件。
  function formatPdfCastTimes(castingTimes) {
    return castingTimes.map(time => (typeof time === 'string' ? PDF_CAST_TIME_LABELS[time]
      : time.minutes ? `${time.minutes}分鐘` : `${time.hours}小時`)).join('或');
  }


  // Non-spell display fallback for legacy feat class labels only; never use for spell identity.
  function extractChineseDisplayLabel(value) {
    const text = normalizeText(value);
    const englishIndex = text.search(/[A-Za-z]/);
    return englishIndex === -1 ? text : text.slice(0, englishIndex).trim();
  }

  // 自創法術的施法時間文字（可為玩家自訂）轉成角色紙的簡短寫法。
  function convertCastTimeText(raw) {
    const text = normalizeText(raw);
    // Trigger conditions belong in the spell description and can overflow the
    // character sheet's compact casting-time field. Keep the full Chinese
    // action name while omitting the clause that follows it.
    return text
      .replace(/\s*或儀式\s*$/u, '')
      .replace(/^((?:附贈|反應)動作)\s*[,，].*$/, '$1')
      .replaceAll('附贈動作', '附贈')
      .replaceAll('反應動作', '反應');
  }

  function convertSpellSchoolForNote(raw) {
    const school = normalizeText(raw);
    return school ? `學派:${school}` : '';
  }

  function convertDurationForNote(raw) {
    const text = normalizeText(raw);
    if (!text || text === '立即') return '';
    const duration = text
      .replace(/專注\s*[,，、;；:：]?\s*/gu, '')
      .replace(/\s+/gu, '')
      .trim();
    return duration ? `持續:${duration}` : '';
  }

  function buildSpellRows(state) {
    if (state.__spellManagement?.version === 2 && Array.isArray(state.__spellManagement.entries)) {
      return state.__spellManagement.entries.flatMap((entry, idx) => {
        const spellId = resolveStateSpellId(entry.spellId);
        const spell = getCanonicalSpell(spellId);
        if (!spell || spell.level > 4) return [];
        if (typeof globalScope.SpellManagement?.isEntryAvailable === 'function'
          && !globalScope.SpellManagement.isEntryAvailable(entry, { state })) return [];
        return [{ idx, level: spell.level, classKey: entry.spellClass || state.class || '', spellId }];
      }).sort((a, b) => a.level - b.level || a.idx - b.idx);
    }
    // Legacy saved characters remain readable by the standalone PDF mapper.
    const rows = [];
    const areaConfig = [
      { area: 'cantrips-area', level: 0 },
      { area: 'level1spells-area', level: 1 },
      { area: 'level2spells-area', level: 2 },
      { area: 'level3spells-area', level: 3 },
      { area: 'level4spells-area', level: 4 }
    ];

    areaConfig.forEach(({ area, level }) => {
      const classRegex = new RegExp(`^${area}-class-(\\d+)$`);
      Object.keys(state)
        .map((key) => {
          const matched = key.match(classRegex);
          if (!matched) return null;
          const idx = matched[1];
          const classKey = state[key];
          const spellId = resolveStateSpellId(state[`${area}-spell-${idx}`]);
          const spell = getCanonicalSpell(spellId);
          if (!classKey || !spell || spell.level !== level) return null;
          return { idx: Number.parseInt(idx, 10), level, classKey, spellId };
        })
        .filter(Boolean)
        .sort((a, b) => a.idx - b.idx)
        .forEach((item) => rows.push(item));
    });

    return rows;
  }

  const DAMAGE_CANTRIP_EXPORT_MAP = Object.freeze({
    'fire-bolt': Object.freeze({ name: '火焰箭', mode: 'attack', dmg: '1d10 火焰', dmg5: '2d10 火焰', note: '120呎' }),
    'true-strike': Object.freeze({ name: '克敵機先', mode: 'attack', dmg: '武器骰', dmg5: '武骰+1d6', note: '傷害可改光耀', usesSpellAdjustment: true }),
    'ray-of-frost': Object.freeze({ name: '冷凍射線', mode: 'attack', dmg: '1d8 冷凍', dmg5: '2d8 冷凍', note: '60呎' }),
    'poison-spray': Object.freeze({ name: '毒氣噴濺', mode: 'attack', dmg: '1d12 毒素', dmg5: '2d12 毒素', note: '30呎' }),
    'starry-wisp': Object.freeze({ name: '流光閃靈', mode: 'attack', dmg: '1d8 光耀', dmg5: '2d8 光耀', note: '60呎/發微光消隱形' }),
    'chill-touch': Object.freeze({ name: '凍寒之觸', mode: 'attack', dmg: '1d10 黯蝕', dmg5: '2d10 黯蝕', note: '觸及/不能回復HP' }),
    'sorcerous-burst': Object.freeze({ name: '術法衝擊', mode: 'attack', dmg: '1d8自選', dmg5: '2d8自選', note: '120呎/傷害出8可再次擲骰' }),
    'vicious-mockery': Object.freeze({ name: '惡言相加', mode: 'save', dmg: '1d6 精神', dmg5: '2d6 精神', note: '60呎/感知豁免/攻擊劣勢' }),
    'sacred-flame': Object.freeze({ name: '聖火術', mode: 'save', dmg: '1d8 光耀', dmg5: '2d8 光耀', note: '60呎/敏捷豁免' }),
    'shocking-grasp': Object.freeze({ name: '電爪', mode: 'attack', dmg: '1d8 閃電', dmg5: '2d8 閃電', note: '觸及/不能藉機' }),
    'acid-splash': Object.freeze({ name: '酸液飛濺', mode: 'save', dmg: '1d6 強酸', dmg5: '2d6 強酸', note: '60呎/敏捷豁免' }),
    'shillelagh': Object.freeze({ name: '橡棍術', mode: 'attack', dmg: '1d8 自選', dmg5: '1d10 自選', note: '力場or鈍擊/附贈/1分', usesSpellAdjustment: true }),
    'produce-flame': Object.freeze({ name: '燃火術', mode: 'attack', dmg: '1d8 火焰', dmg5: '2d8 火焰', note: '60呎/附贈/可照明' }),
    'eldritch-blast': Object.freeze({ name: '魔能爆', mode: 'attack', dmg: '1d10 力場', note: '120呎', note5: '120呎/2束分別攻擊' })
  });

  function shouldApplyPotentSpellcasting(spellId, state) {
    const level = getSelectedLevelNumber(state.level);
    if (level === null || level < 7) return false;
    if (
      state.class === 'cleric'
      && state['cleric-blessed-strikes-potent-spellcasting'] === true
    ) {
      return spellId === 'sacred-flame';
    }
    if (
      state.class === 'druid'
      && state['druid-elemental-fury-potent-spellcasting'] === true
    ) {
      return ['poison-spray', 'produce-flame', 'starry-wisp'].includes(spellId);
    }
    return false;
  }

  function getDamageCantripExportValues(config, spellId, state) {
    const level = getSelectedLevelNumber(state.level);
    const isLevel5 = level !== null && level >= 5;
    const baseDamage = isLevel5 && config.dmg5 ? config.dmg5 : config.dmg;
    let damage = baseDamage;

    if (config.usesSpellAdjustment) {
      const rawAdjustment = normalizeText(state['spell-adjustment']).replace(/\s+/g, '');
      const adjustment = /^[+-]?\d+$/.test(rawAdjustment)
        ? formatSkillModifierForPdf(rawAdjustment)
        : '';
      if (adjustment) {
        damage = baseDamage.replace(/^(武器骰|武骰|1d\d+)/, `$1${adjustment}`);
      }
    }

    if (shouldApplyPotentSpellcasting(spellId, state)) {
      const wisdomModifier = getAbilityModifierNumber(state.wis);
      if (Number.isFinite(wisdomModifier)) {
        damage = damage.replace(/^(\d+d\d+)/, `$1${formatFormulaModifier(wisdomModifier)}`);
      }
    }

    return {
      damage,
      note: isLevel5 && config.note5 ? config.note5 : config.note
    };
  }

function isWeaponRowEmpty(payload, slot) {
  const weaponName = normalizeText(payload[`attack-weap-name-${slot}`]);
  const otherValues = [
    payload[`toHit${slot}`],
    payload[`dmg_type_${slot}`],
    payload[`wp-note-${slot}`]
  ];
  const otherFieldsAreEmpty = otherValues.every((value) => !normalizeText(value));

  // A two-handed main weapon leaves a disabled placeholder in the off-hand
  // name field. When the rest of row 2 is blank, let a damage cantrip replace
  // that placeholder just as it would replace a fully empty row.
  if (
    slot === 2
    && /^[（(]\s*雙手[佔占]用\s*[）)]$/u.test(weaponName)
    && otherFieldsAreEmpty
  ) {
    return true;
  }

  return !weaponName && otherFieldsAreEmpty;
}

  function fillDamageCantripsToWeaponRows(payload, spellRows, state, maxSlots = MAX_PDF_WEAPON_ROWS) {
    const cantripRows = spellRows.filter((row) => row.level === 0);
    if (!cantripRows.length) return;

    const attackBonus = normalizeText(state['spell-attack-bonus']);
    const saveDc = normalizeText(state['spell-save-dc']);
    let slot = 3;

    if (isWeaponRowEmpty(payload, 1)) {
      slot = 1;
    } else if (isWeaponRowEmpty(payload, 2)) {
      slot = 2;
    }

    for (const row of cantripRows) {
      if (slot > maxSlots) break;
      const config = DAMAGE_CANTRIP_EXPORT_MAP[row.spellId];
      if (!config) continue;
      const exportValues = getDamageCantripExportValues(config, row.spellId, state);

      payload[`attack-weap-name-${slot}`] = config.name;
      payload[`toHit${slot}`] = config.mode === 'save'
        ? (saveDc ? `DC${saveDc}` : 'DC')
        : attackBonus;
      payload[`dmg_type_${slot}`] = exportValues.damage;
      payload[`wp-note-${slot}`] = exportValues.note;
      slot += 1;

      while (slot <= 2 && !isWeaponRowEmpty(payload, slot)) {
        slot += 1;
      }

      if (slot === 2 && !isWeaponRowEmpty(payload, 2)) {
        slot = 3;
      }
    }
  }

  function parseSpellSlotsFromClassFeature(classKey, level) {
    const getSlotCounts = globalScope.getSpellSlotCounts;
    const counts = typeof getSlotCounts === 'function'
      ? getSlotCounts(classKey, level)
      : [0, 0, 0, 0];
    const toPdfValue = (count) => Number(count) > 0 ? String(count) : '';
    return {
      slot1: toPdfValue(counts[0]),
      slot2: toPdfValue(counts[1]),
      slot3: toPdfValue(counts[2]),
      slot4: toPdfValue(counts[3])
    };
  }

  // 武器熟練項、護甲訓練與起始裝備（A）：職業內容檔的純文字（換行改為「,」）。
  function getClassProfileText(classKey, field) {
    return normalizeText(getClassRules(classKey)?.profile?.[field] || '');
  }

  function parseClassDefaultEquipment(classKey) {
    return getClassProfileText(classKey, 'equipment');
  }

  function parseBackgroundDefaultEquipment(backgroundKey) {
    const background = getBuiltInBackground(backgroundKey);
    if (!background) return '';
    return normalizeText(background.text.equipmentA);
  }

  function hasQuickBuildInitialEquipment(state) {
    const gearNotes = state?.['gear-notes'];
    try {
      if (typeof globalScope.quickBuild?.hasImportedInitialEquipment === 'function') {
        return globalScope.quickBuild.hasImportedInitialEquipment(gearNotes);
      }
    } catch (error) {
      void error;
    }
    return /^\s*初始裝備：\s*\S/um.test(String(gearNotes || ''));
  }

  function getLanguageLabelByValue(value) {
    if (!value) return '';
    const lookup = getLanguageOptions();
    const found = lookup.find((item) => item.value === value);
    return found?.label || '';
  }

  // Class features that grant languages, by feature id: the ranger's two
  // languages follow Deft Explorer; Thieves' Cant joins the rogue's extra language.
  const CLASS_LANGUAGE_FEATURE_IDS = Object.freeze({
    ranger: 'ranger-deft-explorer',
    rogue: 'rogue-thieves-cant'
  });

  // The feature and its class-feature line, built the same way as getClassFeatureHeadings().
  function getClassLanguageFeature(classKey) {
    const feature = getClassFeatureRules(classKey).find((item) => item.id === CLASS_LANGUAGE_FEATURE_IDS[classKey]);
    return feature ? { feature, heading: getClassFeatureHeading(feature, classKey) } : null;
  }

  // Languages a class grants once its feature line is present.
  function getClassLanguageLabels(classFeatureLines, classKey, state) {
    const granted = getClassLanguageFeature(classKey);
    if (!granted || !classFeatureLines.includes(granted.heading)) return [];
    if (classKey === 'ranger') {
      return [state['language-extra-1'], state['language-extra-2']]
        .map(getLanguageLabelByValue)
        .filter(Boolean);
    }
    return [granted.feature.name, getLanguageLabelByValue(state['language-extra-2'])].filter(Boolean);
  }

  function insertClassLanguageLines(classFeatureLines, classKey, state) {
    const lines = [...classFeatureLines];
    const granted = getClassLanguageFeature(classKey);
    const headingIndex = granted ? lines.indexOf(granted.heading) : -1;
    if (headingIndex < 0) return lines;

    if (classKey === 'rogue') {
      // Thieves' Cant and the extra language share one line without a level.
      lines[headingIndex] = [granted.feature.name, getLanguageLabelByValue(state['language-extra-2'])]
        .filter(Boolean)
        .join('、');
      return lines;
    }

    const languageText = [state['language-extra-1'], state['language-extra-2']]
      .map(getLanguageLabelByValue)
      .filter(Boolean)
      .join('、');
    if (languageText) lines.splice(headingIndex + 1, 0, languageText);
    return lines;
  }

  function getSelectedFeatEntries(state) {
    return Object.keys(state)
      // Match source rows only, excluding feat-choice mirrors and Magic Initiate subfields.
      .filter((key) => /^feat-\d+$/.test(key) || /^derived-feat-(?:background|human-origin|fighting-style-[a-z]+(?:-\d+)?|[a-z]+-level-\d+|lessons-\d+)$/.test(key))
      .sort((a, b) => {
        const aDerived = a.startsWith('derived-feat-') ? 0 : 1;
        const bDerived = b.startsWith('derived-feat-') ? 0 : 1;
        if (aDerived !== bDerived) return aDerived - bDerived;
        if (!aDerived) return a.localeCompare(b, 'zh-Hant');
        return Number.parseInt(a.split('-')[1], 10) - Number.parseInt(b.split('-')[1], 10);
      })
      .map((key) => ({
        key,
        name: normalizeText(state[key])
      }))
      .filter((entry) => entry.name);
  }

  function getMagicInitiateFeatLines(state, featKey) {
    const manual = state.__spellManagement?.version === 2
      ? state.__spellManagement.manual === true : state['manual-spell-management'] === true;
    if (manual) return [getFeatPdfTitle({ name: '魔法學徒' })];
    const classValue = normalizeText(state[`${featKey}-magic-initiate-class`]);
    const cantrip1 = normalizeText(state[`${featKey}-magic-initiate-cantrip-1`]);
    const cantrip2 = normalizeText(state[`${featKey}-magic-initiate-cantrip-2`]);
    const level1 = normalizeText(state[`${featKey}-magic-initiate-level-1`]);

    const cantrip1Spell = getCanonicalSpell(resolveStateSpellId(cantrip1));
    const cantrip2Spell = getCanonicalSpell(resolveStateSpellId(cantrip2));
    const level1Spell = getCanonicalSpell(resolveStateSpellId(level1));
    // 還沒選完法表與法術時，列出內容檔的 PDF 行（選擇方式的提示）。
    if (!classValue || !cantrip1Spell || !cantrip2Spell || !level1Spell) return getFeatPdfLines('魔法學徒');

    const classLabel = MAGIC_INITIATE_CLASS_LABELS[classValue] || extractChineseDisplayLabel(classValue);
    const level1Label = MAGIC_INITIATE_PDF_SPELL_LABELS[level1Spell.spellId] || level1Spell.nameZh;
    return [
      `${classLabel}魔法學徒`,
      `${cantrip1Spell.nameZh}`,
      `${cantrip2Spell.nameZh}`,
      `${level1Label} ◇`
    ];
  }

  // PDF 專長欄的各行：專長內容檔的 pdf（featText.pdf，第一行是標題）；不認得的專長只列名稱。
  function getFeatPdfLines(featName) {
    return [...(globalScope.getFeatText?.(featName)?.pdf || [normalizeText(featName)])];
  }

  function getFeatPdfLineGroup(state, entry) {
    if (entry.name === '魔法學徒') {
      return getMagicInitiateFeatLines(state, entry.key);
    }
    return getFeatPdfLines(entry.name);
  }

  // Magic Initiate's detailed heading includes the selected class; the
  // title-only fallback must omit choices as well as the chosen spells.
  function getFeatPdfTitle(entry) {
    return getFeatPdfLines(entry.name)[0];
  }

  function buildFeatPdfText(state, options = {}) {
    const featSpec = getPdfTextSpecs(options).feats1;
    const entries = getSelectedFeatEntries(state);
    const detailedLines = entries.flatMap((entry) => getFeatPdfLineGroup(state, entry));
    const detailedResult = wrapTextForPdfWithOverflow(
      detailedLines.join('\n'), featSpec
    );
    if (!detailedResult.truncated) {
      return { text: detailedResult.text, overflowTitles: [] };
    }

    // When any detailed feat would be omitted, switch the entire field to
    // titles before deciding whether anything needs the secondary field.
    const titles = entries.map(getFeatPdfTitle);
    const titleResult = wrapTextForPdfWithOverflow(titles.join('\n'), featSpec);
    if (!titleResult.truncated) {
      return { text: titleResult.text, overflowTitles: [] };
    }

    // Count actual wrapped PDF lines, keeping each title intact and reserving
    // the final line for the existing overflow notice.
    const shownLines = [];
    const maxContentLines = featSpec.maxLines - 1;
    let shownCount = 0;
    for (const title of titles) {
      const titleLines = wrapTextForPdf(title, {
        ...featSpec,
        maxLines: Number.MAX_SAFE_INTEGER
      }).split('\n');
      if (shownLines.length + titleLines.length > maxContentLines) break;
      shownLines.push(...titleLines);
      shownCount++;
    }
    return {
      text: [...shownLines, '另有專長未列出'].join('\n'),
      overflowTitles: titles.slice(shownCount)
    };
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
      let count = 0;
      for (let slot = 1; slot <= option.max; slot++) {
        if (state[`eldritch-invocation-${index}-${slot}`]) count++;
      }
      if (count) picks.push(count > 1 ? `${option.name}×${count}` : option.name);
    });
    return picks;
  }

  // 種族所選的血統選項值：PDF 匯出選項（getRaceChoiceOptionKey，例如 elfLineage）優先，沒有時取角色資料。
  function getPdfRaceChoiceValue(state, options = {}) {
    const choiceId = globalScope.getRaceRules?.(normalizeText(state?.race))?.choice?.id;
    if (!choiceId) return '';
    return normalizeText(options[globalScope.getRaceChoiceOptionKey(choiceId)] || state[choiceId]);
  }

  function resolveSpeedForPdf(state, options = {}) {
    if (state['auto-calculate-key-stats-toggle'] === false) {
      return normalizeText(state['speed-display']);
    }
    if (typeof globalScope.calculateCharacterSpeed !== 'function') {
      return normalizeText(state['speed-input']);
    }
    const armorName = normalizeText(state.armor);
    const armorList = typeof armors !== 'undefined' ? armors : (globalScope.armors || []);
    const armor = armorList.find((item) => item.名稱 === armorName);
    const isShield = typeof globalScope.isShieldItem === 'function'
      ? globalScope.isShieldItem
      : () => false;
    return globalScope.calculateCharacterSpeed({
      baseSpeed: state['speed-input'],
      race: state.race,
      raceChoice: getPdfRaceChoiceValue(state, options),
      className: state.class,
      level: state.level,
      isWearingArmor: Boolean(armorName) && !isShield(armorName),
      isWearingHeavyArmor: armor?.分類 === '重甲',
      hasShield: isShield(armorName) || hasEffectiveShieldForPdf(state)
    });
  }

  function buildPdfFieldPayload(state, options = {}) {
    const payload = {};
    const classKey = normalizeText(state.class);
    const backgroundKey = normalizeText(state.background);
    const level = normalizeText(state.level);
    const official = isOfficialSheet(options);
    const textSpecs = getPdfTextSpecs(options);

    Object.entries(DIRECT_FIELD_MAP).forEach(([stateKey, pdfFieldName]) => {
      payload[pdfFieldName] = normalizeText(state[stateKey]);
    });

    if (!official && options.outputMode === 'compact') {
      ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach((ability) => {
        const fieldName = `${ability}SaveMod1`;
        payload[fieldName] = formatCompactSavingThrowModifier(payload[fieldName]);
      });
    }

    const mapMoneyField = (value, candidates) => {
      const text = normalizeText(value);
      candidates.forEach((name) => {
        payload[name] = text;
      });
    };

    // PDF 金錢欄位支援。
    mapMoneyField(state['money-balance-cp'] ?? state['money-cp'], ['cp-coin1']);
    mapMoneyField(state['money-balance-sp'] ?? state['money-sp'], ['sp-coin1']);
    mapMoneyField(state['money-balance-gp'] ?? state['money-gp'], ['gp-coin1']);
    mapMoneyField(state['money-balance-pp'] ?? state['money-pp'], ['pp-coin1']);

    const levelNumber = Number.parseInt(level, 10);
    const hitDie = getHitDieByClass(classKey);
    if (hitDie) payload.hp_dice_max1 = String(hitDie);

    // The template's internal field names are opposite to their visible labels.
    payload.Subclass1 = getClassLabel(classKey) || payload.Class1;
    payload.Class1 = (Number.isFinite(levelNumber) && levelNumber >= (getClassRules(classKey)?.subclassLevel ?? 3))
      ? getSubclassLabel(classKey)
      : '';
    payload.Background2 = backgroundKey === 'custom'
      ? normalizeText(state.__customBackground?.名稱)
      : (getBuiltInBackground(backgroundKey)?.rules.name || payload.Background2);
    payload.Specie1 = globalScope.getRaceRules?.(normalizeText(state.race))?.name || payload.Specie1;
    payload.alignment1 = ALIGNMENT_LABELS[normalizeText(state.alignment)] || payload.alignment1;
    payload.spell_cast_attri1 = SPELL_CAST_ABILITY_LABELS[normalizeText(state['spellcasting-ability'])] || payload.spell_cast_attri1;

    payload.str1 = getSignedAbilityModifier(state.str);
    payload.dex1 = getSignedAbilityModifier(state.dex);
    payload.con1 = getSignedAbilityModifier(state.con);
    payload.int1 = getSignedAbilityModifier(state.int);
    payload.wis1 = getSignedAbilityModifier(state.wis);
    payload.cha1 = getSignedAbilityModifier(state.cha);

    const profBonus = getProficiencyBonusByLevel(level);
    payload.proficiencyBonus1 = profBonus;

    const selectedToolNames = collectToolProficiencyNames(state);
    // The official sheet's tool field is multiline and holds every tool.
    payload.toolsProficiency1 = (official ? selectedToolNames : selectedToolNames.slice(0, 2)).join('、');

    Object.entries(CHECKBOX_FIELD_MAP).forEach(([stateKey, pdfFieldName]) => {
      payload[pdfFieldName] = Boolean(state[stateKey]);
    });
    payload.chk_shld1 = hasShieldProficiencyForPdf(state);

    const characterSize = normalizeText(state['character-size']);
    payload['SIZE-CHK-S'] = characterSize === '小型';
    payload['SIZE-CHK-M'] = characterSize === '中型';

    SKILL_ROWS.forEach((skill) => {
      payload[skill.chkField] = Boolean(state[skill.profId] || state[skill.expId]);
      payload[skill.modField] = formatSkillModifierForPdf(state[skill.modId]);
    });

    payload.language1 = [state.language1, state.language2]
      .map(getBaseLanguageLabelForPdf)
      .filter(Boolean)
      .join(', ');

    const mergedClassFeatureLines = mergeClassFeatureHeadings(
      insertSelectedClassFeatureChoices(
        getClassFeatureHeadings(classKey, level),
        classKey,
        state
      ),
      classKey
    );
    // The official language field holds Common and every class language, so
    // class features keep only their own headings there.
    const classFeatureLines = official
      ? mergedClassFeatureLines
      : insertClassLanguageLines(mergedClassFeatureLines, classKey, state);
    if (official) {
      payload.language1 = [...new Set([
        '通用語',
        ...[state.language1, state.language2].map(getBaseLanguageLabelForPdf),
        ...getClassLanguageLabels(mergedClassFeatureLines, classKey, state)
      ].filter(Boolean))].join('、');
    }
    const classFeatureResult1 = wrapTextForPdfWithOverflow(
      classFeatureLines.join('\n'),
      textSpecs.classFeatures1
    );
    payload.classFeatures1 = classFeatureResult1.text;
    payload.classFeatures2 = classFeatureResult1.overflow;

    const extraClassLines = [];
    if (classKey === 'sorcerer') {
      const metamagicNames = getSelectedMetamagicNames(state);
      if (metamagicNames.length) {
        extraClassLines.push(`超魔法：${metamagicNames.join(',')}`);
      }
    }
    if (classKey === 'warlock') {
      const invocationNames = getSelectedEldritchInvocationNames(state);
      if (invocationNames.length) {
        extraClassLines.push(`魔能祈喚：${invocationNames.join(',')}`);
      }
    }

    const classExtraText = normalizeText(state['class-extra']);
    if (classExtraText) {
      extraClassLines.push(classExtraText);
    }
    const skillExtraText = normalizeText(state['skill-extra']);
    if (skillExtraText) {
      extraClassLines.push(skillExtraText);
    }
    if (extraClassLines.length) {
      payload.classFeatures2 = payload.classFeatures2
        ? `${payload.classFeatures2}\n${extraClassLines.join('\n')}`
        : extraClassLines.join('\n');
    }
    const featResult = buildFeatPdfText(state, options);
    payload.feats1 = featResult.text;
    if (featResult.overflowTitles.length) {
      const remainingFeats = `其餘專長:${featResult.overflowTitles.join(', ')}`;
      payload.classFeatures2 = payload.classFeatures2
        ? `${payload.classFeatures2}\n${remainingFeats}`
        : remainingFeats;
    }
    // Compact normally limits this visible field to the first column's line
    // count, but must not truncate either existing content or appended feat
    // titles when they spill.
    payload.classFeatures2 = options.outputMode === 'compact' && !featResult.overflowTitles.length
      ? wrapTextForPdfWithEllipsis(payload.classFeatures2, {
        ...textSpecs.classFeatures2,
        maxLines: textSpecs.classFeatures1.maxLines
      })
      : wrapTextForPdf(payload.classFeatures2, textSpecs.classFeatures2);

    payload.specie_features1 = buildRaceTemplateText(state, options);
    payload.speed1 = resolveSpeedForPdf(state, options);

    payload.weaponsProficiency1 = getWeaponProficiencyTextForPdf(state);
    const armorTraining = getClassArmorTrainingForPdf(state);
    payload.chk_light1 = armorTraining.includes('light');
    payload.chk_medium1 = armorTraining.includes('medium');
    payload.chk_heavy1 = armorTraining.includes('heavy');


    // The replacement character sheet supplies rows 1-19 only. Preserve any
    // remaining prepared spells as a compact summary in the notes field.
    // The official sheet marks a shield with its AC checkbox, so a bare
    // shield attack row is dropped and attack cantrips move up into it.
    if (official) {
      let removedShieldRow = false;
      for (let slot = 1; slot <= 2; slot++) {
        const fields = [`attack-weap-name-${slot}`, `toHit${slot}`, `dmg_type_${slot}`, `wp-note-${slot}`];
        const [name, hit, damage, note] = fields.map((fieldName) => normalizeText(payload[fieldName]));
        if (name === '盾牌' && !hit && !damage && ['', '盾面繪有聖徽'].includes(note)) {
          fields.forEach((fieldName) => { payload[fieldName] = ''; });
          removedShieldRow = true;
        }
      }
      if (removedShieldRow && isWeaponRowEmpty(payload, 1) && !isWeaponRowEmpty(payload, 2)) {
        ['attack-weap-name-', 'toHit', 'dmg_type_', 'wp-note-'].forEach((prefix) => {
          payload[`${prefix}1`] = payload[`${prefix}2`];
          payload[`${prefix}2`] = '';
        });
      }
    }

    const maxSpellRows = official ? OFFICIAL_MAX_PDF_SPELL_ROWS : MAX_PDF_SPELL_ROWS;
    // Explicit export-only snapshots keep local custom definitions out of the
    // serialized character and prevent the mapper reading another local sheet.
    const customRows = (Array.isArray(options.customSpells) ? options.customSpells : []).slice(0, 50)
      .filter(spell => spell && /^custom-spell-/.test(spell.spellId) && Number.isInteger(spell.level) && spell.level >= 0 && spell.level <= 4)
      .map((spell, idx) => ({ idx, spellId: spell.spellId, level: spell.level, customSpell: spell }));
    const allSpellRows = [...buildSpellRows(state), ...customRows].sort((a, b) => a.level - b.level);
    const spellRows = allSpellRows.slice(0, maxSpellRows);
    const remainingSpellRows = allSpellRows.slice(maxSpellRows);
    fillDamageCantripsToWeaponRows(
      payload,
      spellRows,
      state,
      official ? OFFICIAL_MAX_PDF_WEAPON_ROWS : MAX_PDF_WEAPON_ROWS
    );
    if (spellRows.length > 0) {
      spellRows.forEach((row, index) => {
        const xx = String(index + 1);
        const header = getSpellRowHeader(row);

        payload[`sp-level-${xx}`] = String(row.level);
        const spellName = row.customSpell?.nameZh || getCanonicalSpell(row.spellId)?.nameZh || '';
        // Spell-name fields on both sheets are single-line and fit by width.
        payload[`sp-name-${xx}`] = normalizeText(spellName);
        payload[`sp-cast-time-${xx}`] = header.castingTimes
          ? formatPdfCastTimes(header.castingTimes)
          : convertCastTimeText(header.castingTime || '');
        payload[`sp-range-${xx}`] = row.spellId === 'spare-the-dying'
          ? getSpareTheDyingRangeForPdf(level)
          : header.range || '';
        payload[`sp-c-${xx}`] = Boolean(header.concentration);
        payload[`sp-r-${xx}`] = Boolean(header.ritual);
        payload[`sp-m-${xx}`] = Boolean(header.hasMaterial);
        // Keep spell notes unwrapped here. The two PDF modes use different
        // fonts and field heights, so pdf-export.js measures the real glyph
        // widths and chooses either the comfortable or smaller single-line
        // style for the selected template.
        payload[`note${xx}`] = [
          convertSpellSchoolForNote(header.school),
          convertDurationForNote(header.duration)
        ].filter(Boolean).join(' | ');
      });
    }

    const slots = parseSpellSlotsFromClassFeature(classKey, level);
    payload['spell-level-1'] = slots.slot1;
    payload['spell-level-2'] = slots.slot2;
    payload['spell-level-3'] = slots.slot3;
    payload['spell-level-4'] = slots.slot4;

    const extraNotes = [];
    const overflowToolNames = official ? [] : selectedToolNames.slice(2);
    if (overflowToolNames.length > 0) {
      extraNotes.push(`其他工具熟練：${overflowToolNames.join('、')}`);
    }
    if (remainingSpellRows.length > 0) {
      const remainingSpellText = remainingSpellRows
        .map((row) => `${row.customSpell?.nameZh || getCanonicalSpell(row.spellId)?.nameZh || ''}(${row.level})`)
        .join('、');
      extraNotes.push(`其他準備法術：${remainingSpellText}。`);
    }

    const spellNotesText = normalizeText(state['spell-notes']);
    const manualSpellbook = state.__spellManagement?.version === 2
      ? state.__spellManagement.manual === true : state['manual-spell-management'] === true;
    const showSpellbook = manualSpellbook || state.class === 'wizard';
    const bookState = state.__wizardSpellbook;
    const bookIds = bookState?.version >= 2
      ? (manualSpellbook ? bookState.manualSpellIds : bookState.wizardSpellIds)
      : bookState?.spellIds;
    if (options.includeSpellbook !== false && showSpellbook && Array.isArray(bookIds)) {
      const bookSpells = [...new Set(bookIds)].map(getCanonicalSpell).filter(Boolean);
      if (bookSpells.length) extraNotes.push(`法術書：${bookSpells.map(spell => `${spell.nameZh}(${spell.level}環)${getSpellCatalog()?.isRitual(spell) ? '*' : ''}`).join('、')}。* 為儀式法術。`);
    }
    if (spellNotesText) {
      extraNotes.push(spellNotesText);
    }

    if (options.characterName) {
      payload.Name1 = normalizeText(options.characterName);
    }
    if (options.englishName) {
      payload.Name2 = normalizeText(options.englishName);
    }

    const gearExtraText = normalizeText(state['gear-extra']);
    if (gearExtraText) {
      extraNotes.push(`其他備註：${gearExtraText}`);
    }

    if (extraNotes.length) {
      payload.extra1 = normalizeUserTextForPdf(extraNotes.join('\n'));
    }

    if (options.includeDefaultEquipment && !hasQuickBuildInitialEquipment(state)) {
      const classEq = parseClassDefaultEquipment(classKey);
      const bgEq = parseBackgroundDefaultEquipment(backgroundKey);
      payload.equipment1 = normalizeEquipmentListForPdf(
        [classEq, bgEq, payload.equipment1].filter(Boolean).join('\n')
      );
    } else {
      payload.equipment1 = normalizeEquipmentListForPdf(payload.equipment1);
    }

    for (let slot = 1; slot <= 7; slot++) {
      const fieldName = `dmg_type_${slot}`;
      if (Object.prototype.hasOwnProperty.call(payload, fieldName)) {
        payload[fieldName] = formatDamageTypeForPdf(payload[fieldName]);
      }
    }

    return official ? convertPayloadToOfficialSheet(payload, state) : payload;
  }

  const OFFICIAL_ABILITY_FIELD_PREFIXES = Object.freeze({
    str: 'str', dex: 'dex', con: 'con', int: 'int', wis: 'wis', cha: 'chr'
  });

  const OFFICIAL_SKILL_FIELD_NAMES = Object.freeze({
    athletics: 'str-ath',
    acrobatics: 'dex-acr',
    sleightOfHand: 'dex-soh',
    stealth: 'dex-ste',
    arcana: 'int-arc',
    history: 'int-his',
    investigation: 'int-inv',
    nature: 'int-nat',
    religion: 'int-rel',
    animalHandling: 'wis-ah',
    insight: 'wis-ins',
    medicine: 'wis-med',
    perception: 'wis-per',
    survival: 'wis-sur',
    deception: 'chr-dec',
    intimidation: 'chr-thr',
    performance: 'chr-per',
    persuasion: 'chr-psu'
  });

  const OFFICIAL_DIRECT_FIELD_NAMES = Object.freeze({
    Name1: 'name',
    Background2: 'bg',
    Specie1: 'spiece',
    // The third-party template stores the class label in Subclass1 and the
    // subclass label in Class1; the official sheet uses visible names.
    Subclass1: 'class',
    Class1: 'sub',
    Level1: 'LV',
    AC1: 'AC',
    hp_max1: 'max',
    initiative1: 'initiative',
    speed1: 'speed',
    passivePerception1: 'passiv-dcp',
    proficiencyBonus1: 'pro',
    heroInspiration1: 'hero insp',
    chk_light1: 'light',
    chk_medium1: 'medium',
    chk_heavy1: 'heavy',
    chk_shld1: 'shld_pro',
    weaponsProficiency1: 'wp_pro',
    toolsProficiency1: 'tool_pro',
    classFeatures1: 'class-a-1',
    classFeatures2: 'class-a-2',
    specie_features1: 'speice-trat',
    feats1: 'feat-trat',
    spell_cast_attri1: 'cast_atri',
    spell_cast_Mod1: 'cast_m',
    spell_cast_DC1: 'cast_dc',
    spell_cast_toHit1: 'cast_hit',
    alignment1: 'Ali',
    language1: 'Lang',
    'cp-coin1': 'CP',
    'sp-coin1': 'SP',
    'gp-coin1': 'GP',
    'pp-coin1': 'PP'
  });

  // Translate the shared payload into the official sheet's field names. The
  // shared builder still owns every rule and text decision.
  function convertPayloadToOfficialSheet(payload, state) {
    const official = {};
    const copy = (sourceName, targetName) => {
      if (Object.prototype.hasOwnProperty.call(payload, sourceName)) {
        official[targetName] = payload[sourceName];
      }
    };

    Object.entries(OFFICIAL_DIRECT_FIELD_NAMES).forEach(([sourceName, targetName]) => {
      copy(sourceName, targetName);
    });

    Object.entries(OFFICIAL_ABILITY_FIELD_PREFIXES).forEach(([ability, prefix]) => {
      // Third-party names are swapped: `${ability}Mod1` holds the score.
      copy(`${ability}Mod1`, prefix);
      copy(`${ability}1`, `${prefix}-m`);
      copy(`${ability}SaveMod1`, `${prefix}-st`);
      copy(`${ability}SaveChk1`, `${prefix}-st-c`);
    });

    SKILL_ROWS.forEach((skill) => {
      const key = skill.modField.replace(/Mod\d$/, '');
      const targetName = OFFICIAL_SKILL_FIELD_NAMES[key];
      if (!targetName) return;
      copy(skill.modField, targetName);
      copy(skill.chkField, `${targetName}-c`);
    });

    for (let slot = 1; slot <= OFFICIAL_MAX_PDF_WEAPON_ROWS; slot++) {
      copy(`attack-weap-name-${slot}`, `attack-wp-name${slot}`);
      copy(`toHit${slot}`, `tohit${slot}`);
      copy(`dmg_type_${slot}`, `dmg-type${slot}`);
      copy(`wp-note-${slot}`, `note${slot}`);
    }

    for (let level = 1; level <= 9; level++) {
      copy(`spell-level-${level}`, `lvl-${level}`);
    }

    OFFICIAL_SPELL_ROW_SUFFIXES.forEach((suffix, index) => {
      const row = index + 1;
      copy(`sp-level-${row}`, `sp${suffix}`);
      copy(`sp-name-${row}`, `spn-${suffix}`);
      copy(`sp-cast-time-${row}`, `spt-${suffix}`);
      // The template names only the first range field without a hyphen.
      copy(`sp-range-${row}`, row === 1 ? 'spr1' : `spr-${suffix}`);
      copy(`sp-c-${row}`, `chk-c${suffix}`);
      copy(`sp-r-${row}`, `chk-r${suffix}`);
      copy(`sp-m-${row}`, `chk-m${suffix}`);
      copy(`note${row}`, `spnt-${suffix}`);
    });

    official.size = normalizeText(state['character-size']);
    official.shld = hasEffectiveShieldForPdf(state);
    const hitDie = normalizeText(payload.hp_dice_max1);
    const levelNumber = getSelectedLevelNumber(state.level);
    official['max-hd'] = hitDie ? `${levelNumber || ''}d${hitDie}` : '';
    // The official sheet has no notes field, so notes follow the equipment.
    official.Equip = [payload.equipment1, payload.extra1]
      .map(normalizeText)
      .filter(Boolean)
      .join('\n');

    return official;
  }

  globalScope.PDF_FIELD_MAP = {
    DIRECT_FIELD_MAP,
    CHECKBOX_FIELD_MAP,
    SKILL_ROWS
  };
  globalScope.buildPdfFieldPayload = buildPdfFieldPayload;
})(window);

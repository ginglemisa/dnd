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
    // classFeatures2 / extra1 / equipment1 map to player-authored textarea
    // content. These PDF fields are multiline, scrollable, and have no MaxLen,
    // so we preserve the full text instead of truncating it during export.
    classFeatures2: Object.freeze({ maxUnitsPerLine: 28, maxLines: Number.MAX_SAFE_INTEGER }),
    // 14 display units fit seven CJK glyphs per line. Ten lines keep these
    // narrow columns readable when printed on A4 paper.
    specie_features1: Object.freeze({ maxUnitsPerLine: 14, maxLines: 10, maxTotalUnits: 140 }),
    feats1: Object.freeze({ maxUnitsPerLine: 14, maxLines: 10, maxTotalUnits: 140 }),
    extra1: Object.freeze({ maxUnitsPerLine: 52, maxLines: Number.MAX_SAFE_INTEGER }),
    equipment1: Object.freeze({ maxUnitsPerLine: 52, maxLines: Number.MAX_SAFE_INTEGER })
  });
  const MAX_PDF_SPELL_ROWS = 19;

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

  const CLASS_LABELS = Object.freeze({
    barbarian: '野蠻人',
    bard: '吟遊詩人',
    cleric: '牧師',
    druid: '德魯伊',
    fighter: '戰士',
    monk: '武僧',
    paladin: '聖騎士',
    ranger: '遊俠',
    rogue: '盜賊',
    sorcerer: '術士',
    warlock: '契術師',
    wizard: '法師'
  });

  const SUBCLASS_LABELS = Object.freeze({
    barbarian: '狂戰道途',
    bard: '逸聞學院',
    cleric: '生命領域',
    druid: '大地結社',
    fighter: '勇士',
    monk: '散打鬥士',
    paladin: '奉獻誓言',
    ranger: '獵人',
    rogue: '妙手',
    sorcerer: '龍族術法',
    warlock: '邪魔宗主',
    wizard: '塑能學派'
  });

  const BACKGROUND_LABELS = Object.freeze({
    acolyte: '侍僧',
    soldier: '士兵',
    criminal: '罪犯',
    sage: '賢者',
    seeker: '孤芳',
    fieldhand: '耕者'
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
    hill: '丘陵巨人',
    stone: '石巨人',
    storm: '風暴巨人'
  });

  const GOLIATH_ANCESTRY_ABILITY_LINES = Object.freeze({
    cloud: Object.freeze(['附贈傳送30呎', '內可見無人空間']),
    fire: Object.freeze(['命中+1d10火傷']),
    frost: Object.freeze(['命中+1d6冰傷', '目標速度-10呎']),
    hill: Object.freeze(['大型以下可擊倒']),
    stone: Object.freeze(['反應減1d12+C傷']),
    storm: Object.freeze(['受傷可反應反擊', '60呎內1d8雷鳴'])
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
    silver_cold: '銀龍-寒',
    white_cold: '白龍-寒'
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
    abyssal: '深淵血統',
    chthonic: '冥界血統',
    infernal: '煉獄血統'
  });

  const MAGIC_INITIATE_CLASS_LABELS = Object.freeze({
    cleric: '牧師',
    druid: '德魯伊',
    wizard: '法師'
  });

  const MAGIC_INITIATE_PDF_SPELL_LABELS = Object.freeze({
    'create-or-destroy-water': '造水/枯水',
    'detect-poison-and-disease': '偵測毒與病'
  });

  const FEAT_PDF_LINES = Object.freeze({
    警覺: Object.freeze([
      '警覺(起源)',
      '先攻可加熟練',
      '可與盟友換先攻'
    ]),
    兇蠻打手: Object.freeze([
      '兇蠻打手(起源)',
      '每回合 1 次',
      '武器傷擲二取高'
    ]),
    熟習: Object.freeze([
      '熟習(起源)',
      '獲得 3 項熟練',
      '可選技能或工具'
    ]),
    醫療兵: Object.freeze([
      '醫療兵(起源)',
      '動作使用醫護包',
      '5呎內骰+熟練',
      '恢復骰1可重擲'
    ]),
    強韌體魄: Object.freeze([
      '強韌體魄(起源)',
      'HP上限+等級×2'
    ]),
    屬性值提升: Object.freeze([
      '屬性提升(通用)',
      '屬性+2或兩項+1'
    ]),
    擒抱者: Object.freeze([
      '擒抱者(通用)',
      '力量or敏捷+1',
      '徒手命中可擒抱',
      '打擒抱目標優勢',
      '擒抱同型不減速'
    ]),
    箭術: Object.freeze([
      '箭術(戰鬥風格)',
      '遠程武器命中+2'
    ]),
    防禦: Object.freeze([
      '防禦(戰鬥風格)',
      '穿護甲時AC+1'
    ]),
    巨武器戰鬥: Object.freeze([
      '巨武(戰鬥風格)',
      '雙手(兩用)武器',
      '傷害骰1/2可改3'
    ]),
    雙武器戰鬥: Object.freeze([
      '雙武(戰鬥風格)',
      '副手輕武器傷害',
      '可加屬性調整值'
    ])
  });

  const RACE_PDF_TEMPLATES = Object.freeze({
    dragonborn: Object.freeze((context = {}) => {
      const ancestry = normalizeText(context.dragonbornAncestryLabel) || '未選祖源（預備）';
      const proficiencyValue = context.proficiencyValue || 'P';
      const breathSaveDc = getDragonbornBreathSaveDc(context.level, context.constitutionModifier);
      const breathDamageDice = getDragonbornBreathDamageDice(context.level);
      const lines = [
        '黑暗視覺：60呎',
        `${ancestry}抗性`,
        '使用攻擊動作時',
        '單次攻擊可吐息',
        `限用${proficiencyValue}次,長休回`,
        '15呎錐/30呎直',
        `目標敏豁DC${breathSaveDc}`,
        `傷害：${breathDamageDice}d10`,
        '５等附贈可飛行',
        '限10分長休恢復'
      ];
      return lines;
    }),
    dwarf: Object.freeze((context = {}) => {
      const proficiencyValue = context.proficiencyValue || 'P';
      return [
      '黑暗視覺120呎',
      '毒素抗性',
      '中毒豁免優勢',
      '每等級額外+1HP',
      '附贈開石之感應',
      '10分內震動感知',
      '範圍60呎',
      `限用${proficiencyValue}次`,
      '長休後恢復次數'
      ];
    }),
    elf: Object.freeze((context = {}) => {
      const lineage = normalizeText(context.elfLineageLabel) || '未選亞種（預備）';
      const lineageKey = normalizeText(context.elfLineageKey);
      const firstLevelSpellLine = lineageKey === 'drow'
        ? '舞光術戲法'
        : (lineageKey === 'high_elf' ? '魔法伎倆' : (lineageKey === 'wood_elf' ? '德魯伊伎倆戲法' : '血統戲法'));
      const firstLevelBonusLine = lineageKey === 'drow'
        ? '二倍黑暗視覺'
        : (lineageKey === 'high_elf' ? '長休後可換戲法' : (lineageKey === 'wood_elf' ? '速度加５呎' : '血統特性'));
      const thirdLevelSpellLine = lineageKey === 'drow'
        ? '妖火 ◇'
        : (lineageKey === 'high_elf' ? '偵測魔法 ◇' : (lineageKey === 'wood_elf' ? '大步奔行 ◇' : '血統一環'));
      const fifthLevelSpellLine = lineageKey === 'drow'
        ? '黑暗術 ◇'
        : (lineageKey === 'high_elf' ? '迷蹤步 ◇' : (lineageKey === 'wood_elf' ? '行動無蹤 ◇' : '血統二環'));
      const lines = [
        '黑暗視覺60呎',
        '抵抗魅惑優勢',
        '敏銳感官',
        '長休=冥想4小時',
        `${lineage}傳承`,
        firstLevelSpellLine,
        firstLevelBonusLine
      ];
      const leveledSpellLines = [];
      if (shouldShowAtOrAboveSelectedLevel(context.level, 3)) {
        leveledSpellLines.push(thirdLevelSpellLine);
      }
      if (shouldShowAtOrAboveSelectedLevel(context.level, 5)) {
        leveledSpellLines.push(fifthLevelSpellLine);
      }
      if (leveledSpellLines.length) {
        lines.push(...leveledSpellLines);
      }
      lines.push(
        '長休後環法恢復'
      );
      return lines;
    }),
    gnome: Object.freeze((context = {}) => {
      const lineage = normalizeText(context.gnomeLineageLabel) || '未選';
      const lineageKey = normalizeText(context.gnomeLineageKey);
      const proficiencyValue = context.proficiencyValue || 'P';
      const lines = [
        '黑暗視覺60呎',
        '智感魅豁免優勢',
        `${lineage}血統`,
        '施法屬性：自選'
      ];
      if (lineageKey === 'forest_gnome') {
        lines.push(
          '次級幻影戲法',
          '動物交談法術',
          `可免費施展${proficiencyValue}次`,
          '長休後恢復'
        );
      } else if (lineageKey === 'rock_gnome') {
        lines.push(
          '修復術戲法',
          '魔法伎倆戲法',
          '花10分製作玩具',
          'AC=5,HP=1',
          '可附贈啟動',
          '效果同魔法伎倆'
        );
      } else {
        lines.push('血統戲法：依血統');
      }
      return lines;
    }),
    goliath: Object.freeze((context = {}) => {
      const ancestry = normalizeText(context.goliathAncestryLabel) || '未選巨人';
      const ancestryKey = normalizeText(context.goliathAncestryKey);
      const ancestryAbilityLines = getGoliathAncestryAbilityLines(
        ancestryKey,
        context.constitutionModifier
      );
      const proficiencyValue = context.proficiencyValue || 'P';
      const parsedLevel = getSelectedLevelNumber(context.level);
      const lines = [
        '掙脫擒抱有優勢',
        '攜帶重量×2',
        `${ancestry}血統`,
        `能力${proficiencyValue}次/長休`,
        ...ancestryAbilityLines
      ];
      if (parsedLevel === null || parsedLevel >= 5) {
        lines.push(
          '巨化形體(LV5)◇',
          '附贈巨化10分',
          '速度+10',
          '力量檢定優勢'
        );
      }
      return lines;
    }),
    halfling: Object.freeze(() => ([
      '半身人勇氣',
      '抗恐慌豁免優勢',
      '半身人靈巧',
      '可穿越大型目標',
      '但不可停留同格',
      '可躲大型生物後',
      '半身人吉運',
      'D20出1可重擲'
    ])),
    human: Object.freeze(() => ([
      '人類足智多謀',
      '長休獲英雄激勵',
      '人類技藝嫻熟',
      '自選1技能熟練',
      '人類靈活人才',
      '自選1起源專長'
    ])),
    orc: Object.freeze((context = {}) => {
      const proficiencyValue = context.proficiencyValue || 'P';
      return [
        '黑暗視覺120呎',
        '獸人熱血湧動',
        '附贈/速度×2',
        `臨時HP=${proficiencyValue}`,
        `限${proficiencyValue}次`,
        '短休/長休恢復',
        '獸人堅韌不屈',
        '非即死HP歸零時',
        '強制HP=1',
        '限1次/長休回'
      ];
    }),
    tiefling: Object.freeze((context = {}) => {
      const legacy = normalizeText(context.tieflingLegacyLabel) || '未選血統';
      const legacyKey = normalizeText(context.tieflingLegacyKey);
      const firstLevelLine1 = legacyKey === 'abyssal'
        ? '毒素傷害抗性'
        : (legacyKey === 'chthonic' ? '黯蝕傷害抗性' : (legacyKey === 'infernal' ? '火焰傷害抗性' : '傷害抗性未選'));
      const firstLevelLine2 = legacyKey === 'abyssal'
        ? '毒氣噴濺戲法'
        : (legacyKey === 'chthonic' ? '凍寒之觸戲法' : (legacyKey === 'infernal' ? '火焰箭戲法' : '血統戲法'));
      const thirdLevelLine = legacyKey === 'abyssal'
        ? '致病射線 ◇'
        : (legacyKey === 'chthonic' ? '虛假生命 ◇' : (legacyKey === 'infernal' ? '煉獄叱喝 ◇' : '血統一環'));
      const fifthLevelLine = legacyKey === 'abyssal'
        ? '人類定身術 ◇'
        : (legacyKey === 'chthonic' ? '衰弱射線 ◇' : (legacyKey === 'infernal' ? '黑暗術 ◇' : '血統二環'));
      const lines = [
        '黑暗視覺60呎',
        '異界姿態',
        '奇術戲法',
        `${legacy}遺贈`,
        firstLevelLine1,
        firstLevelLine2
      ];
      if (shouldShowAtOrAboveSelectedLevel(context.level, 3)) {
        lines.push(thirdLevelLine);
      }
      if (shouldShowAtOrAboveSelectedLevel(context.level, 5)) {
        lines.push(fifthLevelLine);
      }
      lines.push(
        '長休後環法恢復'
      );
      return lines;
    })
  });

  function buildFallbackRacePdfText() {
    return [];
  }

  function buildRaceTemplateText(state, options = {}) {
    const raceKey = normalizeText(state?.race);
    const templateBuilder = RACE_PDF_TEMPLATES[raceKey];
    const pdfProficiencyValue = getPdfProficiencyValueByLevel(state?.level);
    const constitutionModifier = getAbilityModifierNumber(state?.con);
    const context = {
      level: state?.level,
      proficiencyValue: pdfProficiencyValue,
      constitutionModifier,
      goliathAncestryLabel: getGoliathAncestryLabel(options.goliathAncestry, constitutionModifier),
      goliathAncestryKey: options.goliathAncestry,
      dragonbornAncestryLabel: DRAGONBORN_ANCESTRY_LABELS[options.dragonbornAncestry],
      elfLineageLabel: ELF_LINEAGE_LABELS[options.elfLineage],
      elfLineageKey: options.elfLineage,
      gnomeLineageLabel: GNOME_LINEAGE_LABELS[options.gnomeLineage],
      gnomeLineageKey: options.gnomeLineage,
      tieflingLegacyLabel: TIEFLING_LEGACY_LABELS[options.tieflingLegacy],
      tieflingLegacyKey: options.tieflingLegacy
    };
    const lines = typeof templateBuilder === 'function'
      ? templateBuilder(context)
      : buildFallbackRacePdfText();
    return wrapTextForPdf(lines.join('\n'), PDF_TEXT_SPECS.specie_features1);
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

  function formatDamageTypeForPdf(value) {
    return normalizeText(value)
      .replace(/\s+/g, '')
      .replace(/[!-~]/g, (character) =>
        String.fromCharCode(character.charCodeAt(0) + 0xFEE0)
      );
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

  function getGoliathAncestryLabel(ancestryKey, constitutionModifier) {
    return GOLIATH_ANCESTRY_LABELS[ancestryKey];
  }

  function getGoliathAncestryAbilityLines(ancestryKey, constitutionModifier) {
    const lines = GOLIATH_ANCESTRY_ABILITY_LINES[ancestryKey];
    if (!lines) return ['血統能力未選'];
    if (ancestryKey !== 'stone') return [...lines];
    return lines.map((line) => (
      line.replace('1d12+C', `1d12${formatFormulaModifier(constitutionModifier)}`)
    ));
  }

  function getHitDieByClass(classKey) {
    const map = {
      barbarian: '12',
      fighter: '10',
      paladin: '10',
      ranger: '10',
      bard: '8',
      cleric: '8',
      druid: '8',
      monk: '8',
      rogue: '8',
      warlock: '8',
      sorcerer: '6',
      wizard: '6'
    };
    return map[classKey] || '';
  }

  function collectToolProficiencyNames(state) {
    const seen = new Set();
    return Object.keys(state)
      .filter((key) => /^tool-proficiency-\d+$/.test(key) || /^bard-instrument-\d+$/.test(key))
      .sort((a, b) => {
        const aGroup = a.startsWith('tool-proficiency-') ? 0 : 1;
        const bGroup = b.startsWith('tool-proficiency-') ? 0 : 1;
        return aGroup - bGroup || Number.parseInt(a.split('-').at(-1), 10) - Number.parseInt(b.split('-').at(-1), 10);
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

  function splitPdfTokenToLines(token, maxUnitsPerLine) {
    const lines = [];
    let chunk = '';
    Array.from(token).forEach((character) => {
      const next = `${chunk}${character}`;
      if (chunk && countDisplayUnits(next) > maxUnitsPerLine) {
        lines.push(chunk);
        chunk = character;
      } else {
        chunk = next;
      }
    });
    if (chunk) lines.push(chunk);
    return lines;
  }

  function getUserTextWrapTokens(line) {
    const Segmenter = globalScope.Intl?.Segmenter;
    const segments = Segmenter
      ? Array.from(new Segmenter('zh-Hant', { granularity: 'word' }).segment(line), ({ segment }) => segment)
      : Array.from(line);
    const tokens = [];
    const closingPunctuationPattern = /^[、，。；：！？,.;:!?]+$/u;

    segments.forEach((segment) => {
      if (closingPunctuationPattern.test(segment) && tokens.length > 0) {
        tokens[tokens.length - 1] += segment;
      } else {
        tokens.push(segment);
      }
    });
    return tokens;
  }

  function wrapUserTextLineForPdf(line, maxUnitsPerLine) {
    const wrapped = [];
    let chunk = '';

    getUserTextWrapTokens(line).forEach((rawToken) => {
      const token = chunk ? rawToken : rawToken.trimStart();
      if (!token) return;
      const next = `${chunk}${token}`;
      if (countDisplayUnits(next) <= maxUnitsPerLine) {
        chunk = next;
        return;
      }

      if (chunk.trim()) wrapped.push(chunk.trimEnd());
      const tokenLines = splitPdfTokenToLines(token.trimStart(), maxUnitsPerLine);
      if (tokenLines.length > 1) wrapped.push(...tokenLines.slice(0, -1));
      chunk = tokenLines.at(-1) || '';
    });

    if (chunk.trim()) wrapped.push(chunk.trimEnd());
    return wrapped;
  }

  function wrapUserTextForPdf(rawText, options = {}) {
    const text = normalizeText(rawText).replace(/\r/g, '').replace(/\t/g, ' ');
    if (!text) return '';
    const maxUnitsPerLine = options.maxUnitsPerLine || 40;
    const maxLines = options.maxLines || 3;
    const wrapped = [];

    text.split('\n').forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        if (wrapped.length > 0 && wrapped.at(-1) !== '') wrapped.push('');
        return;
      }
      wrapped.push(...wrapUserTextLineForPdf(trimmedLine, maxUnitsPerLine));
    });

    return wrapped.slice(0, maxLines).join('\n');
  }

  function wrapEquipmentListForPdf(rawText, options = {}) {
    const text = normalizeText(rawText).replace(/\r/g, '').replace(/\t/g, ' ');
    if (!text) return '';
    const maxUnitsPerLine = options.maxUnitsPerLine || 40;
    const maxLines = options.maxLines || 3;
    const wrapped = [];

    text.split(/\n+/).forEach((sourceLine) => {
      let chunk = '';
      sourceLine.split('、').map((item) => item.trim()).filter(Boolean).forEach((item) => {
        const next = chunk ? `${chunk}、${item}` : item;
        if (countDisplayUnits(next) <= maxUnitsPerLine) {
          chunk = next;
          return;
        }

        if (chunk) wrapped.push(chunk);
        const itemLines = wrapUserTextLineForPdf(item, maxUnitsPerLine);
        if (itemLines.length > 1) wrapped.push(...itemLines.slice(0, -1));
        chunk = itemLines.at(-1) || '';
      });
      if (chunk) wrapped.push(chunk);
    });

    return wrapped.slice(0, maxLines).join('\n');
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

  function extractClassFeatureHeadings(rawText, levelLimit) {
    const text = normalizeText(rawText).replace(/<[^>]+>/g, '\n');
    const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const limit = Number.parseInt(levelLimit, 10);
    const output = [];
    const seen = new Set();

    lines.forEach((line) => {
      const matched = line.match(/^等級\s*(\d+)\s*[:：]?\s*(.+)$/);
      if (!matched) return;
      const lv = Number.parseInt(matched[1], 10);
      if (Number.isFinite(limit) && lv > limit) return;
      const title = removeSubclassTextInsideParentheses(matched[2].trim());
      const entry = `等級 ${matched[1]}：${title}`;
      if (seen.has(entry)) return;
      seen.add(entry);
      output.push(entry);
    });

    return output;
  }

  function removeSubclassTextInsideParentheses(text) {
    return normalizeText(text)
      .replace(/（([^）]*)）/g, (_, inner) => `（${inner.replace(/子職/g, '')}）`)
      .replace(/\(([^)]*)\)/g, (_, inner) => `(${inner.replace(/子職/g, '')})`);
  }

  function extractRaceFeatureHeadings(rawText) {
    const target = rawText;
    const clean = target.replace(/<[^>]+>/g, '\n');
    const matches = clean.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const seen = new Set();
    return matches
      .map((item) => item.replace(/：$/, '').trim())
      .filter((title) => {
        if (!title || seen.has(title) || title.length > 30) return false;
        seen.add(title);
        return true;
      });
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

  function findSpellDesc(spellId) {
    return getCanonicalSpell(spellId)?.desc || '';
  }

  function getSpellLine(desc, label) {
    const pattern = new RegExp(`${label}\\s*[:：]\\s*([^\\n]+)`);
    const matched = desc.match(pattern);
    return matched ? matched[1].trim() : '';
  }


  // Non-spell display fallback for legacy feat class labels only; never use for spell identity.
  function extractChineseDisplayLabel(value) {
    const text = normalizeText(value);
    const englishIndex = text.search(/[A-Za-z]/);
    return englishIndex === -1 ? text : text.slice(0, englishIndex).trim();
  }

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
    'sorcerous-burst': Object.freeze({ name: '術法衝擊', mode: 'attack', dmg: '1d8自選', dmg5: '2d8自選', note: '120呎/傷害出8可再丟' }),
    'vicious-mockery': Object.freeze({ name: '惡言相加', mode: 'save', dmg: '1d6 精神', dmg5: '2d6 精神', note: '60呎/感知豁免/攻擊劣勢' }),
    'sacred-flame': Object.freeze({ name: '聖火術', mode: 'save', dmg: '1d8 光耀', dmg5: '2d8 光耀', note: '60呎/敏捷豁免' }),
    'shocking-grasp': Object.freeze({ name: '電爪', mode: 'attack', dmg: '1d8 閃電', dmg5: '2d8 閃電', note: '觸及/不能藉機' }),
    'acid-splash': Object.freeze({ name: '酸液飛濺', mode: 'save', dmg: '1d6 強酸', dmg5: '2d6 強酸', note: '60呎/敏捷豁免' }),
    'thunderclap': Object.freeze({ name: '鳴雷破', mode: 'save', dmg: '1d6 雷鳴', dmg5: '2d6 雷鳴', note: '自身5呎內體質豁免' }),
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
  return [
    payload[`attack-weap-name-${slot}`],
    payload[`toHit${slot}`],
    payload[`dmg_type_${slot}`],
    payload[`wp-note-${slot}`]
  ].every((value) => !normalizeText(value));
}

  function fillDamageCantripsToWeaponRows(payload, spellRows, state) {
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
      if (slot > 7) break;
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

  function parseClassTableValue(classKey, label) {
    const raw = getClassFeaturesMap()[classKey] || '';
    if (!raw) return '';
    const normalizedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${normalizedLabel}[\\s\\S]*?<\\/td>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`, 'i');
    const match = raw.match(regex);
    if (!match) return '';
    return normalizeText(match[1].replace(/<br\s*\/?>/gi, ',').replace(/<[^>]+>/g, ''));
  }

  function parseClassDefaultEquipment(classKey) {
    const raw = getClassFeaturesMap()[classKey] || '';
    if (!raw) return '';
    const optionAMatch = raw.match(/（A）[\s\S]*?<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/);
    if (optionAMatch) {
      return normalizeText(optionAMatch[1].replace(/<br\s*\/?>/gi, ',').replace(/<[^>]+>/g, ''));
    }

    const fallbackMatch = raw.match(/裝備[\s\S]*?<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/);
    if (!fallbackMatch) return '';
    return normalizeText(fallbackMatch[1].replace(/<br\s*\/?>/gi, ',').replace(/<[^>]+>/g, ''));
  }

  function parseBackgroundDefaultEquipment(backgroundKey) {
    const raw = getBackgroundMap()[backgroundKey];
    if (!raw) return '';
    return normalizeText(raw['裝備A']);
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

  function insertClassLanguageLines(classFeatureLines, classKey, state) {
    const lines = [...classFeatureLines];
    let heading = '';
    let languageText = '';

    if (classKey === 'ranger') {
      heading = '等級 2：熟練探險家';
      languageText = [state['language-extra-1'], state['language-extra-2']]
        .map(getLanguageLabelByValue)
        .filter(Boolean)
        .join('、');
    } else if (classKey === 'rogue') {
      heading = '等級 1：盜賊黑話';
      languageText = getLanguageLabelByValue(state['language-extra-2']);
    }

    if (!languageText) return lines;
    const headingIndex = lines.indexOf(heading);
    if (headingIndex < 0) return lines;
    lines.splice(headingIndex + 1, 0, languageText);
    return lines;
  }

  function getSelectedFeatEntries(state) {
    return Object.keys(state)
      .filter((key) => /^feat-\d+$/.test(key) || /^derived-feat-(?:background|fighting-style-[a-z]+)$/.test(key))
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
    const classValue = normalizeText(state[`${featKey}-magic-initiate-class`]);
    const cantrip1 = normalizeText(state[`${featKey}-magic-initiate-cantrip-1`]);
    const cantrip2 = normalizeText(state[`${featKey}-magic-initiate-cantrip-2`]);
    const level1 = normalizeText(state[`${featKey}-magic-initiate-level-1`]);

    const cantrip1Spell = getCanonicalSpell(resolveStateSpellId(cantrip1));
    const cantrip2Spell = getCanonicalSpell(resolveStateSpellId(cantrip2));
    const level1Spell = getCanonicalSpell(resolveStateSpellId(level1));
    if (!classValue || !cantrip1Spell || !cantrip2Spell || !level1Spell) {
      return [
        '魔法學徒(起源)',
        '選1職業法表',
        '2戲法+1一環'
      ];
    }

    const classLabel = MAGIC_INITIATE_CLASS_LABELS[classValue] || extractChineseDisplayLabel(classValue);
    const level1Label = MAGIC_INITIATE_PDF_SPELL_LABELS[level1Spell.spellId] || level1Spell.nameZh;
    return [
      `${classLabel}魔法學徒`,
      `${cantrip1Spell.nameZh}`,
      `${cantrip2Spell.nameZh}`,
      `${level1Label} ◇`
    ];
  }

  function getFeatPdfDisplayLabel(featName) {
    const normalizedName = normalizeText(featName);
    const featOption = typeof FEAT_OPTIONS !== 'undefined'
      ? FEAT_OPTIONS.find((option) => option.value === normalizedName)
      : null;
    return normalizeText(featOption?.label || normalizedName)
      .replace(/[・·]\s*擴充/gu, '')
      .replace(/擴充/gu, '')
      .replace(/\(\s*\)/gu, '')
      .trim();
  }

  function getFeatPdfLineGroup(state, entry) {
    if (entry.name === '魔法學徒') {
      return getMagicInitiateFeatLines(state, entry.key);
    }
    return FEAT_PDF_LINES[entry.name] || [getFeatPdfDisplayLabel(entry.name)];
  }

  function applyFeatPdfLineLimit(lineGroups, maxLines) {
    const allLines = lineGroups.flat();
    if (allLines.length <= maxLines) return allLines;

    const output = [];
    const reserveLinesForNotice = 1;
    const maxContentLines = Math.max(0, maxLines - reserveLinesForNotice);
    for (const group of lineGroups) {
      if ((output.length + group.length) > maxContentLines) break;
      output.push(...group);
    }
    output.push('另有專長未列出');
    return output;
  }

  function buildFeatPdfText(state) {
    const lineGroups = getSelectedFeatEntries(state).map((entry) => getFeatPdfLineGroup(state, entry));
    const lines = applyFeatPdfLineLimit(lineGroups, PDF_TEXT_SPECS.feats1.maxLines);
    return wrapTextForPdf(lines.join('\n'), PDF_TEXT_SPECS.feats1);
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
      elfLineage: options.elfLineage || state['elf-lineage'],
      className: state.class,
      level: state.level,
      isWearingArmor: Boolean(armorName) && !isShield(armorName),
      isWearingHeavyArmor: armor?.分類 === '重甲',
      hasShield: isShield(armorName) || normalizeText(state.offHand) === '盾牌'
    });
  }

  function buildPdfFieldPayload(state, options = {}) {
    const payload = {};
    const classKey = normalizeText(state.class);
    const backgroundKey = normalizeText(state.background);
    const level = normalizeText(state.level);
    // Compact gives these wide author-entered fields a larger preferred size.
    // Reflow before exporting so editable-width lines do not force the entire
    // compact field to shrink.
    const compactLongTextSpec = (fieldName) => (
      options.outputMode === 'compact'
        ? { ...PDF_TEXT_SPECS[fieldName], maxUnitsPerLine: 34 }
        : PDF_TEXT_SPECS[fieldName]
    );

    Object.entries(DIRECT_FIELD_MAP).forEach(([stateKey, pdfFieldName]) => {
      payload[pdfFieldName] = normalizeText(state[stateKey]);
    });

    if (options.outputMode === 'compact') {
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
    payload.Subclass1 = CLASS_LABELS[classKey] || payload.Class1;
    payload.Class1 = (Number.isFinite(levelNumber) && levelNumber >= 3)
      ? (SUBCLASS_LABELS[classKey] || '')
      : '';
    payload.Background2 = BACKGROUND_LABELS[backgroundKey] || payload.Background2;
    payload.Specie1 = RACE_LABELS[normalizeText(state.race)] || payload.Specie1;
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
    payload.toolsProficiency1 = selectedToolNames.slice(0, 2).join('、');

    Object.entries(CHECKBOX_FIELD_MAP).forEach(([stateKey, pdfFieldName]) => {
      payload[pdfFieldName] = Boolean(state[stateKey]);
    });

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

    const classFeatureLines = insertClassLanguageLines(
      extractClassFeatureHeadings(getClassFeaturesMap()[classKey] || '', level),
      classKey,
      state
    );
    const classFeatureResult1 = wrapTextForPdfWithOverflow(
      classFeatureLines.join('\n'),
      PDF_TEXT_SPECS.classFeatures1
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
      extraClassLines.push(`技能備註：${skillExtraText}`);
    }
    if (extraClassLines.length) {
      payload.classFeatures2 = payload.classFeatures2
        ? `${payload.classFeatures2}\n${extraClassLines.join('\n')}`
        : extraClassLines.join('\n');
    }
    payload.classFeatures2 = options.outputMode === 'compact'
      ? wrapTextForPdfWithEllipsis(payload.classFeatures2, {
        ...PDF_TEXT_SPECS.classFeatures2,
        maxLines: 10
      })
      : wrapTextForPdf(payload.classFeatures2, PDF_TEXT_SPECS.classFeatures2);

    payload.specie_features1 = buildRaceTemplateText(state, options);
    payload.speed1 = resolveSpeedForPdf(state, options);

    payload.weaponsProficiency1 = parseClassTableValue(classKey, '武器熟練項');
    const armorTraining = parseClassTableValue(classKey, '護甲訓練');
    payload.chk_light1 = /輕甲/.test(armorTraining);
    payload.chk_medium1 = /中甲/.test(armorTraining);
    payload.chk_heavy1 = /重甲/.test(armorTraining);

    payload.feats1 = buildFeatPdfText(state);

    // The replacement character sheet supplies rows 1-19 only. Preserve any
    // remaining prepared spells as a compact summary in the notes field.
    const allSpellRows = buildSpellRows(state);
    const spellRows = allSpellRows.slice(0, MAX_PDF_SPELL_ROWS);
    const remainingSpellRows = allSpellRows.slice(MAX_PDF_SPELL_ROWS);
    fillDamageCantripsToWeaponRows(payload, spellRows, state);
    if (spellRows.length > 0) {
      spellRows.forEach((row, index) => {
        const xx = String(index + 1);
        const desc = findSpellDesc(row.spellId);
        const school = getSpellLine(desc, '學派');
        const castTimeRaw = getSpellLine(desc, '施法時間');
        const durationRaw = getSpellLine(desc, '持續時間');
        const rangeRaw = getSpellLine(desc, '射程');

        payload[`sp-level-${xx}`] = String(row.level);
        payload[`sp-name-${xx}`] = wrapTextForPdf(getCanonicalSpell(row.spellId)?.nameZh || '', { maxUnitsPerLine: 14, maxLines: 2 });
        payload[`sp-cast-time-${xx}`] = convertCastTimeText(castTimeRaw);
        payload[`sp-range-${xx}`] = row.spellId === 'spare-the-dying'
          ? getSpareTheDyingRangeForPdf(level)
          : rangeRaw;
        payload[`sp-c-${xx}`] = /專注/.test(durationRaw);
        payload[`sp-r-${xx}`] = /儀式/.test(castTimeRaw);
        payload[`sp-m-${xx}`] = /材料|成分\s*:\s*.*M/i.test(desc);
        // Keep spell notes unwrapped here. The two PDF modes use different
        // fonts and field heights, so pdf-export.js measures the real glyph
        // widths and chooses either the comfortable or smaller single-line
        // style for the selected template.
        payload[`note${xx}`] = [
          convertSpellSchoolForNote(school),
          convertDurationForNote(durationRaw)
        ].filter(Boolean).join(' | ');
      });
    }

    const slots = parseSpellSlotsFromClassFeature(classKey, level);
    payload['spell-level-1'] = slots.slot1;
    payload['spell-level-2'] = slots.slot2;
    payload['spell-level-3'] = slots.slot3;
    payload['spell-level-4'] = slots.slot4;

    const extraNotes = [];
    const overflowToolNames = selectedToolNames.slice(2);
    if (overflowToolNames.length > 0) {
      extraNotes.push(`其他工具熟練：${overflowToolNames.join('、')}`);
    }
    if (remainingSpellRows.length > 0) {
      const remainingSpellText = remainingSpellRows
        .map((row) => `${getCanonicalSpell(row.spellId)?.nameZh || ''}(${row.level})`)
        .join('、');
      extraNotes.push(`其他準備法術：${remainingSpellText}。`);
    }

    const spellNotesText = normalizeText(state['spell-notes']);
    if (spellNotesText) {
      extraNotes.push(`法術筆記：${spellNotesText}`);
    }

    if (options.characterName) {
      payload.Name1 = normalizeText(options.characterName);
    }

    const gearExtraText = normalizeText(state['gear-extra']);
    if (gearExtraText) {
      extraNotes.push(`其他備註：${gearExtraText}`);
    }

    if (extraNotes.length) {
      payload.extra1 = wrapUserTextForPdf(extraNotes.join('\n'), compactLongTextSpec('extra1'));
    }

    if (options.includeDefaultEquipment && !hasQuickBuildInitialEquipment(state)) {
      const classEq = parseClassDefaultEquipment(classKey);
      const bgEq = parseBackgroundDefaultEquipment(backgroundKey);
      payload.equipment1 = wrapEquipmentListForPdf(
        [classEq, bgEq, payload.equipment1].filter(Boolean).join('\n'),
        compactLongTextSpec('equipment1')
      );
    } else {
      payload.equipment1 = wrapEquipmentListForPdf(payload.equipment1, compactLongTextSpec('equipment1'));
    }

    for (let slot = 1; slot <= 7; slot++) {
      const fieldName = `dmg_type_${slot}`;
      if (Object.prototype.hasOwnProperty.call(payload, fieldName)) {
        payload[fieldName] = formatDamageTypeForPdf(payload[fieldName]);
      }
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

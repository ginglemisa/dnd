(() => {
  "use strict";

  const STORAGE_KEY = "dnd.quickBuildDraft.v1";
  const DRAFT_VERSION = 12;
  const storage = window.dndStorage || {
    getItem(key) { try { return localStorage.getItem(key); } catch (_error) { return null; } },
    setItem(key, value) { try { localStorage.setItem(key, value); return true; } catch (_error) { return false; } },
    removeItem(key) { try { localStorage.removeItem(key); return true; } catch (_error) { return false; } }
  };
  const MOBILE_INITIAL_EQUIPMENT_PREFIX = "初始裝備：";
  const BASE_STEPS = [
    { id: "background", title: "背景" },
    { id: "race", title: "種族" },
    { id: "class", title: "職業與屬性" },
    { id: "equipment", title: "裝備" },
    { id: "level-one", title: "完成 1 級" },
    { id: "level-one-review", title: "1 級總覽" }
  ];

  function activeSteps(target) {
    const configuredLevelUps = Array.isArray(target?.choices?.levelUps) ? target.choices.levelUps : [];
    const futureLevelSteps = configuredLevelUps
      .filter(entry => Number(entry?.level) > 1)
      .sort((left, right) => Number(left.level) - Number(right.level))
      .map(entry => ({ id: `level-up:${Number(entry.level)}`, title: `完成 ${Number(entry.level)} 級`, level: Number(entry.level), future: true }));
    return [...BASE_STEPS.slice(0, -1), ...futureLevelSteps, BASE_STEPS[BASE_STEPS.length - 1]];
  }
  const BACKGROUND_ORDER = ["acolyte", "criminal", "sage", "seeker", "fieldhand", "soldier"];
  const BACKGROUND_LABELS = { acolyte: "侍僧", criminal: "罪犯", sage: "賢者", seeker: "孤芳", fieldhand: "耕者", soldier: "士兵" };
  const RACE_ORDER = ["dragonborn", "dwarf", "elf", "gnome", "goliath", "halfling", "human", "orc", "tiefling"];
  const RACE_LABELS = { dragonborn: "龍裔", dwarf: "矮人", elf: "精靈", gnome: "侏儒", goliath: "歌利亞", halfling: "半身人", human: "人類", orc: "獸人", tiefling: "提夫林" };
  const ALIGNMENT_OPTIONS = [
    ["LG", "守序善良"], ["NG", "中立善良"], ["CG", "混亂善良"],
    ["LN", "守序中立"], ["TN", "絕對中立"], ["CN", "混亂中立"],
    ["LE", "守序邪惡"], ["NE", "中立邪惡"], ["CE", "混亂邪惡"]
  ];
  const SKILL_OPTIONS = ["運動", "體操", "巧手", "隱匿", "奧秘", "歷史", "調查", "自然", "宗教", "馴獸", "洞悉", "醫藥", "察覺", "求生", "欺瞞", "威嚇", "表演", "遊說"];
  const SKILL_ABILITY_LABELS = {
    "運動": "力量", "體操": "敏捷", "巧手": "敏捷", "隱匿": "敏捷",
    "奧秘": "智力", "歷史": "智力", "調查": "智力", "自然": "智力", "宗教": "智力",
    "馴獸": "感知", "洞悉": "感知", "醫藥": "感知", "察覺": "感知", "求生": "感知",
    "欺瞞": "魅力", "威嚇": "魅力", "表演": "魅力", "遊說": "魅力"
  };
  const TOOL_CATALOG = globalThis.ToolProficiencyCatalog;
  const TOOL_CATALOG_AVAILABLE = Boolean(
    TOOL_CATALOG &&
    Array.isArray(TOOL_CATALOG.artisanTools) &&
    Array.isArray(TOOL_CATALOG.otherTools) &&
    Array.isArray(TOOL_CATALOG.gamingSets) &&
    Array.isArray(TOOL_CATALOG.instruments)
  );
  const ARTISAN_TOOL_OPTIONS = TOOL_CATALOG_AVAILABLE ? [...TOOL_CATALOG.artisanTools] : [];
  const TOOL_OPTIONS = TOOL_CATALOG_AVAILABLE ? [...TOOL_CATALOG.artisanTools, ...TOOL_CATALOG.otherTools] : [];
  const GAME_TOOL_OPTIONS = TOOL_CATALOG_AVAILABLE ? [...TOOL_CATALOG.gamingSets] : [];
  const INSTRUMENT_TOOL_OPTIONS = TOOL_CATALOG_AVAILABLE ? [...TOOL_CATALOG.instruments] : [];

  function skillOptionLabel(name) {
    return SKILL_ABILITY_LABELS[name] ? `${name}(${SKILL_ABILITY_LABELS[name]})` : name;
  }

  function raceOptionLabel(value) {
    return SKILL_ABILITY_LABELS[value] ? skillOptionLabel(value) : value;
  }

  function orderedSkillOptions(values) {
    const allowed = new Set(Array.isArray(values) ? values : []);
    return SKILL_OPTIONS.filter(name => allowed.has(name));
  }

  function humanOriginFeatOptions() {
    const featOptions = typeof FEAT_OPTIONS === "object" && Array.isArray(FEAT_OPTIONS) ? FEAT_OPTIONS : [];
    return featOptions
      .filter(option => /[（(]起源(?:・擴充)?[）)]/u.test(option.label || ""))
      .map(option => ({
        value: option.value,
        label: `${option.value}${/起源・擴充/u.test(option.label || "") ? "（擴充）" : ""}`
      }));
  }

  function humanOriginFeatValues() {
    return humanOriginFeatOptions().map(option => option.value);
  }

  function humanOriginFeatLabel(value) {
    return humanOriginFeatOptions().find(option => option.value === value)?.label || value;
  }

  function uniqueValidSlots(values, count, isValid) {
    const source = Array.isArray(values) ? values : [];
    const seen = new Set();
    return Array.from({ length: count }, (_, index) => {
      const value = source[index] || "";
      if (!value || !isValid(value) || seen.has(value)) return "";
      seen.add(value);
      return value;
    });
  }
  const CLASS_ORDER = ["barbarian", "bard", "cleric", "druid", "fighter", "monk", "paladin", "ranger", "rogue", "sorcerer", "warlock", "wizard"];
  const QUICK_BUILD_LEVEL = 1;
  const SPELLCASTER_CLASS_IDS = new Set(["bard", "cleric", "druid", "paladin", "ranger", "sorcerer", "warlock", "wizard"]);
  const MAGIC_INITIATE_SPELL_CLASSES = new Set(["cleric", "druid", "wizard"]);
  const SPELLCASTER_RACE_IDS = new Set(["elf", "gnome", "tiefling"]);
  const SPELLCASTER_BACKGROUND_IDS = new Set(["acolyte", "sage"]);
  const HUMAN_MAGIC_INITIATE_BLOCKED_CLASS_BY_BACKGROUND = { acolyte: "cleric", sage: "wizard" };
  const CLASS_LABELS = {
    barbarian: "野蠻人", bard: "吟遊詩人", cleric: "牧師", druid: "德魯伊",
    fighter: "戰士", monk: "武僧", paladin: "聖騎士", ranger: "遊俠",
    rogue: "盜賊", sorcerer: "術士", warlock: "契術師", wizard: "法師"
  };
  const CLASS_CARD_DESCRIPTIONS = {
    barbarian: "高血量、狂暴抗打、強力近戰",
    bard: "激勵隊友、交涉、技能專家、魅惑控場",
    cleric: "治療、輔助、神祇代行、可兼近戰",
    druid: "自然法術、控場、變形、治療",
    fighter: "多種武器專家、戰鬥風格多變",
    monk: "高機動、徒手連擊、閃避反擊、干擾敵人",
    paladin: "重甲、有限治療、守護、強力近戰",
    ranger: "鎖定獵物、武器戰鬥、自然魔法、追蹤探索",
    rogue: "潛行開鎖、技能專家、精準偷襲、靈活脫身",
    sorcerer: "天生施法者、超魔法強化改造法術",
    warlock: "契約賦能祕術施法、近戰遠攻視特性發展",
    wizard: "最廣泛的法術選擇、知識導向、萬用百寶箱"
  };
  const ABILITY_ORDER = ["str", "dex", "con", "int", "wis", "cha"];
  const ABILITY_LABELS = { str: "力量", dex: "敏捷", con: "體質", int: "智力", wis: "感知", cha: "魅力" };
  const ABILITY_KEYS_BY_LABEL = Object.fromEntries(Object.entries(ABILITY_LABELS).map(([key, label]) => [label, key]));
  const POINT_BUY_COSTS = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
  const CLASS_TYPE_OPTIONS = {
    cleric: [
      { id: "guardian", label: "守護者", description: "熟練軍用武器與重甲，提供更強的傷害與防禦。" },
      { id: "thaumaturge", label: "魔術使", description: "多學一種牧師戲法，博聞強記，對宗教與魔法所知更多。" }
    ],
    fighter: [
      { id: "strength", label: "力量型", description: "身穿重甲，擅長運動，以巨力奮勇殺敵。" },
      { id: "dexterity", label: "敏捷型", description: "身手敏捷，擅長靈巧武器與遠程武器。" }
    ]
  };
  const DEFAULT_ABILITIES_BY_BUILD_AND_BACKGROUND = {
    barbarian: { acolyte: [[14,14,14,8,10,12], { int: 1, wis: 2 }], criminal: [[14,13,14,8,12,12], { dex: 1, con: 2 }], sage: [[14,14,15,8,10,10], { con: 1, wis: 2 }], soldier: [[14,14,15,8,10,10], { str: 2, con: 1 }] },
    bard: { acolyte: [[8,14,14,8,12,15], { int: 2, cha: 1 }], criminal: [[8,14,15,10,10,14], { dex: 2, con: 1 }], sage: [[8,14,15,8,12,14], { con: 1, int: 2 }], soldier: [[8,14,15,10,10,14], { dex: 2, con: 1 }] },
    "cleric:thaumaturge": { acolyte: [[8,14,14,8,15,12], { int: 2, wis: 1 }], criminal: [[8,13,14,12,14,12], { dex: 1, con: 2 }], sage: [[8,14,14,10,15,10], { con: 2, wis: 1 }], soldier: [[8,13,14,12,14,12], { dex: 1, con: 2 }] },
    "cleric:guardian": { acolyte: [[14,10,14,8,15,10], { wis: 1, cha: 2 }], criminal: [[14,8,15,8,14,12], { dex: 2, con: 1 }], sage: [[14,8,14,8,15,12], { con: 2, wis: 1 }], soldier: [[14,8,15,8,14,12], { str: 2, con: 1 }] },
    druid: { acolyte: [[8,14,14,10,15,10], { int: 2, wis: 1 }], criminal: [[8,13,14,12,14,12], { dex: 1, con: 2 }], sage: [[8,14,14,10,15,10], { con: 2, wis: 1 }], soldier: [[8,13,14,12,14,12], { dex: 1, con: 2 }] },
    "fighter:strength": { acolyte: [[14,12,14,8,13,12], { int: 2, wis: 1 }], criminal: [[14,11,14,10,12,12], { dex: 1, con: 2 }], sage: [[14,12,14,9,12,12], { con: 2, int: 1 }], soldier: [[15,9,15,8,12,12], { str: 1, dex: 1, con: 1 }] },
    "fighter:dexterity": { acolyte: [[10,14,14,10,13,12], { int: 2, wis: 1 }], criminal: [[8,15,15,9,12,12], { dex: 1, con: 1, int: 1 }], sage: [[10,14,14,11,12,12], { con: 2, int: 1 }], soldier: [[9,14,15,10,12,12], { dex: 2, con: 1 }] },
    monk: { acolyte: [[10,14,14,8,15,10], { int: 2, wis: 1 }], criminal: [[8,14,15,10,14,10], { dex: 2, con: 1 }], sage: [[8,14,14,10,15,10], { con: 2, wis: 1 }], soldier: [[8,14,15,10,14,10], { dex: 2, con: 1 }] },
    paladin: { acolyte: [[14,10,14,8,10,15], { wis: 2, cha: 1 }], criminal: [[14,8,15,8,12,14], { dex: 2, con: 1 }], sage: [[14,10,15,8,10,14], { con: 1, wis: 2 }], soldier: [[14,8,15,8,12,14], { str: 2, con: 1 }] },
    ranger: { acolyte: [[10,14,14,8,15,10], { int: 2, wis: 1 }], criminal: [[8,14,15,10,14,10], { dex: 2, con: 1 }], sage: [[8,14,14,10,15,10], { con: 2, wis: 1 }], soldier: [[8,14,15,10,14,10], { dex: 2, con: 1 }] },
    rogue: { acolyte: [[8,14,14,11,13,13], { int: 1, wis: 1, cha: 1 }], criminal: [[8,14,15,10,10,14], { dex: 2, con: 1 }], sage: [[8,14,14,12,13,12], { con: 2, wis: 1 }], soldier: [[8,14,15,10,10,14], { dex: 2, con: 1 }] },
    sorcerer: { acolyte: [[8,14,14,8,12,15], { int: 2, cha: 1 }], criminal: [[8,14,15,8,12,14], { dex: 2, con: 1 }], sage: [[8,14,15,8,12,14], { con: 1, int: 2 }], soldier: [[8,14,15,8,12,14], { dex: 2, con: 1 }] },
    warlock: { acolyte: [[8,14,14,8,12,15], { int: 2, cha: 1 }], criminal: [[8,14,15,8,12,14], { dex: 2, con: 1 }], sage: [[8,14,15,8,12,14], { con: 1, int: 2 }], soldier: [[8,14,15,8,12,14], { dex: 2, con: 1 }] },
    wizard: { acolyte: [[8,14,14,15,10,10], { int: 1, wis: 2 }], criminal: [[8,13,15,15,10,10], { dex: 1, con: 1, int: 1 }], sage: [[8,14,14,15,10,10], { con: 2, int: 1 }], soldier: [[10,13,14,14,12,10], { dex: 1, con: 2 }] }
  };
  const DEFAULT_ABILITIES_BY_CLASS = Object.fromEntries(Object.entries(DEFAULT_ABILITIES_BY_BUILD_AND_BACKGROUND).filter(([key]) => !key.includes(":"))
    .map(([key, entries]) => [key, Object.fromEntries(["str", "dex", "con", "int", "wis", "cha"].map((ability, index) => [ability, entries.acolyte[0][index]]))]));
  const CLASS_KEY_ABILITY_TEXT = {
    barbarian: "力量", bard: "魅力", cleric: "感知", druid: "感知",
    fighter: "力量或敏捷", monk: "敏捷與感知", paladin: "力量與魅力", ranger: "敏捷與感知",
    rogue: "敏捷", sorcerer: "魅力", warlock: "魅力", wizard: "智力"
  };
  const CLASS_HIT_DICE = {
    barbarian: "D12，每級多一顆", fighter: "D10，每級多一顆", paladin: "D10，每級多一顆", ranger: "D10，每級多一顆",
    bard: "D8，每級多一顆", cleric: "D8，每級多一顆", druid: "D8，每級多一顆", monk: "D8，每級多一顆", rogue: "D8，每級多一顆", warlock: "D8，每級多一顆",
    sorcerer: "D6，每級多一顆", wizard: "D6，每級多一顆"
  };
  const CLASS_BUILD_DEFINITIONS = {
    barbarian: { keyAbilities: ["力量"], saves: ["力量", "體質"], skillOptions: ["馴獸", "運動", "威嚇", "自然", "察覺", "求生"], skillCount: 2, weaponProficiencies: "簡易，軍用武器", armorTraining: "輕甲，中甲，盾牌" },
    bard: { keyAbilities: ["魅力"], saves: ["敏捷", "魅力"], skillOptions: SKILL_OPTIONS, skillCount: 3, toolOptions: INSTRUMENT_TOOL_OPTIONS, toolCount: 3, toolLabel: "樂器", weaponProficiencies: "簡易武器", armorTraining: "輕甲", spellcastingAbility: "cha" },
    cleric: { keyAbilities: ["感知"], saves: ["感知", "魅力"], skillOptions: ["歷史", "洞悉", "醫藥", "遊說", "宗教"], skillCount: 2, weaponProficiencies: "簡易武器", armorTraining: "輕甲、中甲和盾牌", spellcastingAbility: "wis" },
    druid: { keyAbilities: ["感知"], saves: ["智力", "感知"], skillOptions: ["奧秘", "馴獸", "洞悉", "醫藥", "自然", "察覺", "宗教", "求生"], skillCount: 2, fixedTools: ["草藥工具"], weaponProficiencies: "簡易武器", armorTraining: "輕甲和盾牌", spellcastingAbility: "wis" },
    fighter: { keyAbilities: ["力量", "敏捷"], saves: ["力量", "體質"], skillOptions: ["體操", "馴獸", "運動", "歷史", "洞悉", "威嚇", "遊說", "察覺", "求生"], skillCount: 2, weaponProficiencies: "簡易武器和軍用武器", armorTraining: "輕甲、中甲、重甲和盾牌" },
    monk: { keyAbilities: ["敏捷", "感知"], saves: ["力量", "敏捷"], skillOptions: ["體操", "運動", "歷史", "洞悉", "宗教", "隱匿"], skillCount: 2, toolOptions: ARTISAN_TOOL_OPTIONS.concat(INSTRUMENT_TOOL_OPTIONS), toolCount: 1, toolLabel: "工匠工具或樂器", weaponProficiencies: "簡易武器和具有輕型屬性的軍用武器", armorTraining: "無" },
    paladin: { keyAbilities: ["力量", "魅力"], saves: ["感知", "魅力"], skillOptions: ["運動", "洞悉", "威嚇", "醫藥", "遊說", "宗教"], skillCount: 2, weaponProficiencies: "簡易武器和軍用武器", armorTraining: "輕甲、中甲、重甲和盾牌", spellcastingAbility: "cha" },
    ranger: { keyAbilities: ["敏捷", "感知"], saves: ["力量", "敏捷"], skillOptions: ["馴獸", "運動", "洞悉", "調查", "自然", "察覺", "隱匿", "求生"], skillCount: 3, weaponProficiencies: "簡易武器和軍用武器", armorTraining: "輕甲、中甲和盾牌", spellcastingAbility: "wis" },
    rogue: { keyAbilities: ["敏捷"], saves: ["智力", "敏捷"], skillOptions: ["體操", "運動", "欺瞞", "洞悉", "威嚇", "調查", "察覺", "遊說", "巧手", "隱匿"], skillCount: 4, fixedTools: ["盜賊工具"], weaponProficiencies: "簡易武器和具有靈巧或輕型屬性的軍用武器", armorTraining: "輕甲" },
    sorcerer: { keyAbilities: ["魅力"], saves: ["體質", "魅力"], skillOptions: ["奧秘", "欺瞞", "洞悉", "威嚇", "遊說", "宗教"], skillCount: 2, weaponProficiencies: "簡易武器", armorTraining: "無", spellcastingAbility: "cha" },
    warlock: { keyAbilities: ["魅力"], saves: ["感知", "魅力"], skillOptions: ["奧秘", "欺瞞", "歷史", "威嚇", "調查", "自然", "宗教"], skillCount: 2, weaponProficiencies: "簡易武器", armorTraining: "輕甲", spellcastingAbility: "cha" },
    wizard: { keyAbilities: ["智力"], saves: ["智力", "感知"], skillOptions: ["奧秘", "歷史", "洞悉", "調查", "醫藥", "自然", "宗教"], skillCount: 2, weaponProficiencies: "簡易武器", armorTraining: "無", spellcastingAbility: "int" }
  };
  const CLASS_EQUIPMENT_DEFINITIONS = {
    barbarian: { gold: 75, defaults: [{ id: "default", label: "預設裝備", items: [["巨斧", 1], ["手斧", 4], ["探索套組", 1]], gp: 15, main: ["巨斧", "手斧"], off: { 巨斧: [], 手斧: ["手斧"] } }] },
    bard: { gold: 90, defaults: [{ id: "default", label: "預設裝備", items: [["皮甲", 1], ["匕首", 2], ["藝人套組", 1]], gp: 19, main: ["匕首"], off: { 匕首: [] }, armor: "皮甲", instrument: true, specialWrites: [{ field: "offHandAttack", name: "樂器", note: "施法用" }] }] },
    cleric: { gold: 110, defaults: [{ id: "default", label: "預設裝備", items: [["半身鎖甲", 1], ["盾牌", 1], ["硬頭錘", 1], ["聖徽", 1], ["祭司套組", 1]], gp: 7, main: ["硬頭錘"], off: { 硬頭錘: ["盾牌"] }, armor: "半身鎖甲", specialWrites: [{ field: "offHandAttackNote", note: "施法聖徽畫在盾牌上" }] }] },
    druid: { gold: 50, defaults: [{ id: "default", label: "預設裝備", items: [["皮甲", 1], ["盾牌", 1], ["鐮刀", 1], ["德魯伊法器（長棍）", 1], ["探索套組", 1], ["草藥工具", 1]], gp: 9, main: ["鐮刀"], off: { 鐮刀: ["盾牌"] }, armor: "皮甲" }] },
    fighter: { gold: 155, defaults: [
      { id: "strength-default", label: "力量型預設裝備", items: [["鎖子甲", 1], ["巨劍", 1], ["連枷", 1], ["標槍", 8], ["地城套組", 1]], gp: 4, main: ["巨劍"], off: { 巨劍: [] }, armor: "鎖子甲" },
      { id: "dexterity-default", label: "敏捷型預設裝備", items: [["鑲釘皮甲", 1], ["彎刀", 1], ["短劍", 1], ["長弓", 1], ["箭矢", 20], ["箭袋", 1], ["地城套組", 1]], gp: 11, main: ["長弓", "彎刀", "短劍"], off: { 長弓: [], 彎刀: ["短劍"], 短劍: ["彎刀"] }, armor: "鑲釘皮甲" }
    ] },
    monk: { gold: 50, defaults: [{ id: "default", label: "預設裝備", items: [["短矛", 1], ["匕首", 5], ["所選熟練項對應的工匠工具或樂器", 1], ["探索套組", 1]], gp: 11, main: ["短矛", "匕首"], off: { 短矛: ["武藝"], 匕首: ["武藝"] } }] },
    paladin: { gold: 150, defaults: [{ id: "default", label: "預設裝備", items: [["鎖子甲", 1], ["盾牌", 1], ["長劍", 1], ["標槍", 6], ["聖徽", 1], ["祭司套組", 1]], gp: 9, main: ["長劍", "標槍"], off: { 長劍: ["盾牌"], 標槍: ["盾牌"] }, armor: "鎖子甲", specialWrites: [{ field: "offHandAttackNote", note: "施法聖徽畫在盾牌上" }] }] },
    ranger: { gold: 150, defaults: [{ id: "default", label: "預設裝備", items: [["鑲釘皮甲", 1], ["彎刀", 1], ["短劍", 1], ["長弓", 1], ["箭矢", 20], ["箭袋", 1], ["德魯伊法器（槲寄生枝條）", 1], ["探索套組", 1]], gp: 7, main: ["長弓", "彎刀", "短劍"], off: { 長弓: [], 彎刀: ["短劍"], 短劍: ["彎刀"] }, armor: "鑲釘皮甲" }] },
    rogue: { gold: 100, defaults: [{ id: "default", label: "預設裝備", items: [["皮甲", 1], ["匕首", 2], ["短劍", 1], ["短弓", 1], ["箭矢", 20], ["箭袋", 1], ["盜賊工具", 1], ["竊賊套組", 1]], gp: 8, main: ["短弓", "短劍", "匕首"], off: { 短弓: [], 短劍: [], 匕首: [] }, armor: "皮甲" }] },
    sorcerer: { gold: 50, defaults: [{ id: "default", label: "預設裝備", items: [["短矛", 1], ["匕首", 2], ["奧術法器（水晶）", 1], ["地城套組", 1]], gp: 28, main: ["匕首"], off: { 匕首: [] }, specialWrites: [{ field: "offHandAttackNote", note: "奧術法器（水晶），施法用。" }] }] },
    warlock: { gold: 100, defaults: [{ id: "default", label: "預設裝備", items: [["皮甲", 1], ["鐮刀", 1], ["匕首", 2], ["奧術法器（寶珠）", 1], ["書（玄秘學識）", 1], ["學者套組", 1]], gp: 15, main: ["匕首"], off: { 匕首: [] }, armor: "皮甲", specialWrites: [{ field: "offHandAttackNote", note: "奧術法器（寶珠），施法用。" }] }] },
    wizard: { gold: 55, defaults: [{ id: "default", label: "預設裝備", items: [["匕首", 2], ["奧術法器（長棍）", 1], ["長袍", 1], ["法術書", 1], ["學者套組", 1]], gp: 5, main: ["匕首"], off: { 匕首: [] }, specialWrites: [{ field: "offHandAttackNote", note: "奧術法器（長棍），施法用。" }] }] }
  };

  const BASE_LANGUAGE_OPTIONS = [
    { value: "common-sign", label: "通用手語" }, { value: "draconic", label: "龍語" }, { value: "dwarvish", label: "矮人語" },
    { value: "elvish", label: "精靈語" }, { value: "giant", label: "巨人語" }, { value: "gnomish", label: "侏儒語" },
    { value: "goblin", label: "哥布林語" }, { value: "halfling", label: "半身人語" }, { value: "orc", label: "獸人語" }
  ];
  const RARE_LANGUAGE_OPTIONS = [
    { value: "abyssal", label: "深淵語" }, { value: "celestial", label: "天界語" }, { value: "deep-speech", label: "深潛語" },
    { value: "druidic", label: "德魯伊語" }, { value: "infernal", label: "煉獄語" }, { value: "primordial", label: "原初語" },
    { value: "sylvan", label: "木族語" }, { value: "thieves-cant", label: "盜賊黑話" }, { value: "undercommon", label: "地底通用語" }
  ];
  const LANGUAGE_OPTIONS = BASE_LANGUAGE_OPTIONS.concat(RARE_LANGUAGE_OPTIONS);
  const WEAPON_MASTERY_OPTIONS = {
    simple: [["短棒", "緩速"], ["匕首", "迅切"], ["巨棒", "推離"], ["手斧", "侵擾"], ["標槍", "緩速"], ["輕錘", "迅切"], ["硬頭錘", "削弱"], ["長棍", "失衡"], ["鐮刀", "迅切"], ["短矛", "削弱"], ["輕弩", "緩速"], ["飛鏢", "侵擾"], ["短弓", "侵擾"], ["投石索", "緩速"]],
    martial: [["戰斧", "失衡"], ["連枷", "削弱"], ["長柄刀", "劃傷"], ["巨斧", "順劈"], ["巨劍", "劃傷"], ["長戟", "順劈"], ["騎槍", "失衡"], ["長劍", "削弱"], ["巨錘", "失衡"], ["釘頭錘", "削弱"], ["長矛", "推離"], ["刺劍", "侵擾"], ["彎刀", "迅切"], ["短劍", "侵擾"], ["三叉戟", "失衡"], ["戰鎬", "削弱"], ["戰錘", "推離"], ["鞭", "緩速"], ["吹箭筒", "侵擾"], ["手弩", "侵擾"], ["重弩", "推離"], ["長弓", "緩速"], ["火繩槍", "緩速"], ["手槍", "侵擾"]]
  };
  const LEVEL_ONE_DEFINITIONS = {
    barbarian: { fixed: ["狂暴", "無甲防禦"], summaryFixed: ["狂暴", "無甲防禦"], languages: 2, weaponMastery: 2, prefillMasteryFromDefaultWeapon: true },
    bard: { fixed: ["吟遊詩人激勵"], summaryFixed: ["吟遊詩人激勵"], languages: 2, cantrips: 2, preparedSpells: 4, defaultCantrips: ["dancing-lights", "vicious-mockery"], defaultPreparedSpells: ["charm-person", "color-spray", "dissonant-whispers", "healing-word"] },
    cleric: { summaryFixed: ["神聖使命"], languages: 2, cantrips: 3, preparedSpells: 4, extraCantripClassType: "thaumaturge", defaultCantrips: ["guidance", "sacred-flame", "thaumaturgy"], defaultPreparedSpells: ["bless", "cure-wounds", "guiding-bolt", "shield-of-faith"] },
    druid: { fixed: ["德魯伊語", "動物交談（始終準備）"], summaryFixed: ["德魯伊語"], languages: 2, classOption: { key: "primalOrder", label: "原初使命", options: [{ id: "magician", label: "巫祝" }, { id: "warden", label: "哨衛" }] }, cantrips: 2, preparedSpells: 4, extraCantripOption: "magician", alwaysPrepared: ["speak-with-animals"], defaultCantrips: ["druidcraft", "produce-flame"], defaultPreparedSpells: ["animal-friendship", "cure-wounds", "faerie-fire", "thunderwave"] },
    fighter: { fixed: ["回氣"], summaryFixed: ["回氣"], languages: 2, fightingStyle: true, weaponMastery: 3, prefillMasteryFromDefaultWeapon: true },
    monk: { fixed: ["武藝", "無甲防禦"], summaryFixed: ["武藝", "無甲防禦"], languages: 2 },
    paladin: { fixed: ["聖療"], summaryFixed: ["聖療"], languages: 2, preparedSpells: 2, weaponMastery: 2, defaultWeaponMasteries: ["長劍", "標槍"], defaultPreparedSpells: ["heroism", "searing-smite"] },
    ranger: { fixed: ["宿敵：獵人印記始終準備，可免費施放 2 次"], summaryFixed: ["宿敵"], languages: 2, preparedSpells: 2, weaponMastery: 2, defaultWeaponMasteries: ["長弓", "短劍"], alwaysPrepared: ["hunters-mark"], alwaysPreparedFeature: "遊俠等級 1：宿敵", alwaysPreparedFreeUses: { 1: 2 }, defaultPreparedSpells: ["cure-wounds", "ensnaring-strike"] },
    rogue: { fixed: ["偷襲", "盜賊黑話"], summaryFixed: ["偷襲", "盜賊黑話"], languages: 3, expertise: 2, weaponMastery: 2, defaultWeaponMasteries: ["匕首", "短弓"] },
    sorcerer: { fixed: ["天生術法"], summaryFixed: ["天生術法"], languages: 2, cantrips: 4, preparedSpells: 2, defaultCantrips: ["light", "prestidigitation", "shocking-grasp", "sorcerous-burst"], defaultPreparedSpells: ["burning-hands", "detect-magic"] },
    warlock: { summaryFixed: ["契約魔法"], languages: 2, cantrips: 2, preparedSpells: 2, invocations: 1, defaultInvocations: ["pact-of-the-tome"], defaultCantrips: ["eldritch-blast", "prestidigitation"], defaultPreparedSpells: ["charm-person", "hex"] },
    wizard: { fixed: ["儀式精通", "奧術回想"], summaryFixed: ["儀式精通", "奧術回想"], languages: 2, cantrips: 3, spellbookSpells: 6, preparedSpells: 4, defaultCantrips: ["light", "mage-hand", "ray-of-frost"], defaultSpellbookSpells: ["detect-magic", "feather-fall", "mage-armor", "magic-missile", "sleep", "thunderwave"], defaultPreparedSpells: ["mage-armor", "feather-fall", "sleep", "magic-missile"] }
  };
  const ELDRITCH_INVOCATION_OPTIONS = [
    { id: "armor-of-shadows", label: "幽影護甲", description: "你可隨意施展法師護甲，不耗法術位。" },
    { id: "eldritch-mind", label: "魔能意志", description: "你維持法術專注的體質豁免具有優勢。" },
    { id: "fiendish-vigor", label: "邪魔活力", description: "你可隨意施展虛假生命且不耗法術位。", minWarlockLevel: 2 },
    { id: "lessons-of-the-first-ones", label: "原初之一教習", description: "選 1 個你符合先決條件的起源專長。可重複選此祈喚，但每次必須選不同的起源專長。", minWarlockLevel: 2, extra: { type: "originFeat" } },
    { id: "mask-of-many-faces", label: "千面之臉", description: "你可隨意施展易容術且不耗法術位。", minWarlockLevel: 2 },
    { id: "misty-visions", label: "幻象迷蹤", description: "你可隨意施展無聲幻影且不耗法術位。", minWarlockLevel: 2 },
    { id: "otherworldly-leap", label: "超凡跳躍", description: "你可隨意施展跳躍術且不耗法術位。", minWarlockLevel: 2 },
    { id: "pact-of-the-blade", label: "刃之魔契", description: "你可召喚或綁定契約武器。" },
    { id: "pact-of-the-chain", label: "鏈之魔契", description: "你學會獲得魔寵，施法不耗法術位。" },
    { id: "pact-of-the-tome", label: "書之魔契", description: "持有魔契書時，選 3 個任一職業戲法與 2 個任一職業儀式一環法術。這些法術視為契術師法術。", extra: { type: "tomeSpells", cantrips: 3, rituals: 2 } }
  ];

  const RACE_CARD_DESCRIPTIONS = {
    dragonborn: "中型；吐息；元素抗性；黑暗視覺；5級能短暫飛行",
    dwarf: "中型；黑暗視覺；耐毒；高HP；地震感知",
    elf: "中型；黑暗視覺；感官敏銳；自帶魔法",
    gnome: "小型；黑暗視覺；抗魔體質；生活魔法",
    goliath: "中型；速度較快；血統異能；5級巨大化",
    halfling: "小型；利於躲藏；性格勇敢；移動靈活；天生幸運",
    human: "中型或小型；能力平均；自選專長",
    orc: "中型；黑暗視覺；衝刺加速；瀕死不倒",
    tiefling: "中型或小型；黑暗視覺、邪魔血統、元素抗性、自帶魔法"
  };
  const RACE_OPTION_DEFINITIONS = {
    dragonborn: { ancestry: ["黑龍-酸", "藍龍-電", "黃銅龍-火", "青銅龍-電", "赤銅龍-酸", "金龍-火", "綠龍-毒", "紅龍-火", "銀龍-冰", "白龍-冰"] },
    elf: { lineage: ["卓爾血統", "高等精靈血統", "木精靈血統"], skill: ["洞悉", "察覺", "求生"] },
    gnome: { lineage: ["森林侏儒", "岩石侏儒"] },
    goliath: { ancestry: ["雲遊四方（雲巨人）", "星火燎原（火巨人）", "凜若冰霜（霜巨人）", "地動山搖（山丘巨人）", "堅若磐石（石巨人）", "轟雷掣電（風暴巨人）"] },
    human: { size: ["中型", "小型"] },
    tiefling: { size: ["中型", "小型"], legacy: ["深淵血統", "冥界血統", "煉獄血統"] }
  };
  const RACE_LINEAGE_SPELLS = {
    elf: {
      "卓爾血統": [["dancing-lights", "cantrip", 1], ["faerie-fire", 1, 3], ["darkness", 2, 5]],
      "高等精靈血統": [["detect-magic", 1, 3], ["misty-step", 2, 5]],
      "木精靈血統": [["druidcraft", "cantrip", 1], ["longstrider", 1, 3], ["pass-without-trace", 2, 5]]
    },
    gnome: {
      "森林侏儒": [["minor-illusion", "cantrip", 1], ["speak-with-animals", 1, 1]],
      "岩石侏儒": [["mending", "cantrip", 1], ["prestidigitation", "cantrip", 1]]
    },
    tiefling: {
      "深淵血統": [["poison-spray", "cantrip", 1], ["ray-of-sickness", 1, 3], ["hold-person", 2, 5]],
      "冥界血統": [["chill-touch", "cantrip", 1], ["false-life", 1, 3], ["ray-of-enfeeblement", 2, 5]],
      "煉獄血統": [["fire-bolt", "cantrip", 1], ["hellish-rebuke", 1, 3], ["darkness", 2, 5]]
    }
  };
  const DRAGONBORN_SUMMARY = {
    "黑龍-酸": { ancestry: "黑龍", damage: "酸蝕" },
    "藍龍-電": { ancestry: "藍龍", damage: "雷電" },
    "黃銅龍-火": { ancestry: "黃銅龍", damage: "火焰" },
    "青銅龍-電": { ancestry: "青銅龍", damage: "雷電" },
    "赤銅龍-酸": { ancestry: "赤銅龍", damage: "酸液" },
    "金龍-火": { ancestry: "金龍", damage: "火焰" },
    "綠龍-毒": { ancestry: "綠龍", damage: "毒素" },
    "紅龍-火": { ancestry: "紅龍", damage: "火焰" },
    "銀龍-冰": { ancestry: "銀龍", damage: "寒冰" },
    "白龍-冰": { ancestry: "白龍", damage: "寒冰" }
  };
  const GOLIATH_ANCESTRY_DETAILS = {
    "雲遊四方（雲巨人）": "使用附贈魔法傳送 30 英呎內你能看見的未佔據空間。",
    "星火燎原（火巨人）": "攻擊命中目標時增加 1d10 火焰傷害。",
    "凜若冰霜（霜巨人）": "攻擊命中目標時增加 1d6 冷凍傷害，在你下回合開始前，目標速度降低 10 英呎。",
    "地動山搖（山丘巨人）": "攻擊命中大型以下的生物可令其陷入倒地狀態。",
    "堅若磐石（石巨人）": "受傷時可用反應扣除傷害，擲 1d12 + 體質調整值。",
    "轟雷掣電（風暴巨人）": "使用反應對 60 英呎內傷害你的生物造成 1d8 雷鳴傷害。"
  };
  const TIEFLING_SUMMARY = {
    "深淵血統": { legacy: "深淵", resistance: "毒素", spells: ["奇術", "毒氣噴濺", "致病射線（3 級）", "人類定身術（5 級）"] },
    "冥界血統": { legacy: "冥界", resistance: "黯蝕", spells: ["奇術", "凍寒之觸", "虛假生命（3 級）", "衰弱射線（5 級）"] },
    "煉獄血統": { legacy: "煉獄", resistance: "火焰", spells: ["奇術", "火焰箭", "煉獄叱喝（3 級）", "黑暗術（5 級）"] }
  };

  function createDraft() {
    return {
      version: DRAFT_VERSION,
      ui: {
        currentStepId: "background",
        view: "edit",
        confirmedStepSignatures: {}
      },
      choices: {
        background: null,
        backgroundAbilities: [],
        backgroundWealth: null,
        backgroundCurrency: { cp: 0, sp: 0, gp: 0, pp: 0 },
        backgroundToolChoice: null,
        backgroundMagic: { cantrips: [], levelOneSpells: [] },
        race: null,
        raceOptions: {},
        class: null,
        abilityMethod: null,
        abilities: {},
        backgroundAbilityBonuses: {},
        spellcastingAbility: null,
        classOptions: {},
        classEquipmentMethod: null,
        classEquipment: [],
        defaultWeapon: null,
        classEquipmentOptions: {},
        levelOne: {},
        alignment: "",
        targetLevel: 1,
        levelUps: []
      },
      selections: {
        background: null,
        backgroundEquipment: null,
        backgroundSpells: [],
        race: null,
        raceSpells: [],
        class: null,
        classEquipment: null,
        levelOne: null
      },
      acquisitions: {
        skills: [], expertise: [], languages: [], spells: [], tools: [], feats: [],
        abilityBonuses: [], skillBonuses: [], equipment: [], other: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function loadDraft() {
    try {
      const serialized = storage.getItem(STORAGE_KEY);
      if (!serialized) return createDraft();
      const saved = JSON.parse(serialized);
      if (!isPlainObject(saved) || saved.version !== DRAFT_VERSION) throw new Error("Unsupported quick-build draft");
      const blank = createDraft();
      return reconcileDraft({
        ...blank,
        ...saved,
        version: DRAFT_VERSION,
        choices: {
          ...blank.choices,
          ...(isPlainObject(saved.choices) ? saved.choices : {}),
          backgroundMagic: {
            ...blank.choices.backgroundMagic,
            ...(isPlainObject(saved.choices?.backgroundMagic) ? saved.choices.backgroundMagic : {})
          },
          backgroundCurrency: {
            ...blank.choices.backgroundCurrency,
            ...(isPlainObject(saved.choices?.backgroundCurrency) ? saved.choices.backgroundCurrency : {})
          },
          levelOne: isPlainObject(saved.choices?.levelOne) ? saved.choices.levelOne : {}
        },
        selections: { ...blank.selections, ...(isPlainObject(saved.selections) ? saved.selections : {}) },
        acquisitions: { ...blank.acquisitions, ...(isPlainObject(saved.acquisitions) ? saved.acquisitions : {}) },
        ui: isPlainObject(saved.ui) ? {
          ...blank.ui,
          ...saved.ui,
          confirmedStepSignatures: isPlainObject(saved.ui.confirmedStepSignatures) ? saved.ui.confirmedStepSignatures : {}
        } : { ...blank.ui }
      });
    } catch (_error) {
      storage.removeItem(STORAGE_KEY);
      return createDraft();
    }
  }

  let draft = loadDraft();
  let previouslyFocused = null;
  let spellDetailTrigger = null;
  let spellDetailOpenedOutsideWizard = false;
  let pageLock = null;
  const expandedChoiceGroups = new Set();
  let pendingChoiceCardScrollGroup = null;

  function reconcileDraft(target) {
    normalizeDraft(target);
    reconcileBackgroundDraft(target);
    reconcileRaceDraft(target);
    reconcileClassDraft(target);
    reconcileEquipmentDraft(target);
    reconcileLevelOneDraft(target);
    return normalizeDraft(target);
  }

  function saveDraft() {
    reconcileDraft(draft);
    draft.updatedAt = new Date().toISOString();
    try {
      return storage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch (_error) {
      return false;
    }
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    })[character]);
  }

  function backgroundData(key) {
    return typeof detailedBackgroundFeatures === "object" ? detailedBackgroundFeatures[key] : null;
  }

  function plainText(value) {
    const container = document.createElement("div");
    container.innerHTML = String(value ?? "");
    return container.textContent.trim();
  }

  function emptyAbilityMap(value = 0) {
    return Object.fromEntries(ABILITY_ORDER.map(key => [key, value]));
  }

  function normalizeAbilityScores(values) {
    const source = isPlainObject(values) ? values : {};
    return Object.fromEntries(ABILITY_ORDER.map(key => {
      const score = Number(source[key]);
      return [key, Number.isInteger(score) && score >= 8 && score <= 15 ? score : null];
    }));
  }

  function normalizeBackgroundBonuses(values, allowedLabels = []) {
    const source = isPlainObject(values) ? values : {};
    const labels = Array.isArray(allowedLabels) ? allowedLabels : [];
    const allowed = new Set(labels.map(label => ABILITY_KEYS_BY_LABEL[label]).filter(Boolean));
    return Object.fromEntries(ABILITY_ORDER.map(key => {
      const bonus = Number(source[key]);
      return [key, allowed.has(key) && Number.isInteger(bonus) ? Math.min(2, Math.max(0, bonus)) : 0];
    }));
  }


  function classBuildKey(target = draft) {
    const classId = target.choices?.class;
    const classType = target.choices?.classOptions?.classType;
    return classType && CLASS_TYPE_OPTIONS[classId]?.some(option => option.id === classType) ? `${classId}:${classType}` : classId;
  }

  function abilityMapFromArray(values) {
    return Object.fromEntries(ABILITY_ORDER.map((key, index) => [key, Number(values?.[index]) || 8]));
  }

  function defaultAbilityPreset(target = draft) {
    const buildKey = classBuildKey(target);
    const backgroundKey = BACKGROUND_ORDER.includes(target.choices?.background) ? target.choices.background : "acolyte";
    const buildPresets = DEFAULT_ABILITIES_BY_BUILD_AND_BACKGROUND[buildKey] || DEFAULT_ABILITIES_BY_BUILD_AND_BACKGROUND[target.choices?.class];
    const preset = buildPresets?.[backgroundKey];
    if (preset) return { abilities: abilityMapFromArray(preset[0]), bonuses: { ...emptyAbilityMap(0), ...preset[1] } };

    // 擴充背景沿用同職業既有的合法 27 購點，再依背景可調整屬性與職業關鍵屬性安排 +2/+1。
    const fallback = buildPresets?.acolyte || Object.values(buildPresets || {})[0];
    const data = backgroundData(backgroundKey);
    if (!fallback || !data) return null;
    const abilities = abilityMapFromArray(fallback[0]);
    const keyAbilities = new Set((CLASS_BUILD_DEFINITIONS[target.choices?.class]?.keyAbilities || []).map(label => ABILITY_KEYS_BY_LABEL[label]));
    const allowed = displayList(data.屬性).split("、").map(label => ABILITY_KEYS_BY_LABEL[label]).filter(Boolean)
      .sort((left, right) => Number(keyAbilities.has(right)) - Number(keyAbilities.has(left)) || abilities[right] - abilities[left] || ABILITY_ORDER.indexOf(left) - ABILITY_ORDER.indexOf(right));
    if (allowed.length < 2) return null;
    return { abilities, bonuses: { ...emptyAbilityMap(0), [allowed[0]]: 2, [allowed[1]]: 1 } };
  }

  function abilityPointCost(abilities) {
    return ABILITY_ORDER.reduce((sum, key) => sum + (POINT_BUY_COSTS[abilities?.[key]] ?? 99), 0);
  }

  function backgroundBonusTotal(bonuses) {
    return ABILITY_ORDER.reduce((sum, key) => sum + (Number(bonuses?.[key]) || 0), 0);
  }

  function abilityTotal(target, key) {
    return (Number(target.choices.abilities?.[key]) || 0) + (Number(target.choices.backgroundAbilityBonuses?.[key]) || 0);
  }

  function abilityModifier(score) {
    return Math.floor((Number(score) - 10) / 2);
  }

  function signedNumberParts(value) {
    const number = Number(value) || 0;
    return { sign: number >= 0 ? "+" : "-", value: Math.abs(number) };
  }

  function preferredMentalAbility(target) {
    return ["int", "wis", "cha"].reduce((best, key) => abilityTotal(target, key) > abilityTotal(target, best) ? key : best, "int");
  }

  function spellcastingSourceForDraft(target) {
    const classId = target.choices.class;
    if (SPELLCASTER_CLASS_IDS.has(classId)) {
      return { type: "class", id: classId, label: CLASS_LABELS[classId], fixedAbility: CLASS_BUILD_DEFINITIONS[classId]?.spellcastingAbility || null };
    }
    const raceId = target.choices.race;
    const humanMagicInitiate = raceId === "human" && target.choices.raceOptions?.feat === "魔法學徒";
    if (SPELLCASTER_RACE_IDS.has(raceId) || humanMagicInitiate) {
      return { type: "race", id: raceId, label: RACE_LABELS[raceId], fixedAbility: null };
    }
    const backgroundId = target.choices.background;
    if (SPELLCASTER_BACKGROUND_IDS.has(backgroundId)) {
      return { type: "background", id: backgroundId, label: BACKGROUND_LABELS[backgroundId], fixedAbility: null };
    }
    return null;
  }

  function hasDraftSpellcasting(target = draft) {
    return Boolean(spellcastingSourceForDraft(target));
  }

  function normalizeDraft(target) {
    const blank = createDraft();
    if (!isPlainObject(target.choices)) target.choices = { ...blank.choices };
    if (!isPlainObject(target.selections)) target.selections = { ...blank.selections };
    if (!isPlainObject(target.acquisitions)) target.acquisitions = { ...blank.acquisitions };
    Object.keys(blank.acquisitions).forEach(type => {
      const seen = new Set();
      const entries = Array.isArray(target.acquisitions[type]) ? target.acquisitions[type] : [];
      target.acquisitions[type] = entries.filter(item => {
        if (!isPlainObject(item)) return false;
        const identity = item.id || `${item.sourceType || ""}:${item.sourceId || ""}:${item.name || ""}`;
        if (!identity || seen.has(identity)) return false;
        seen.add(identity);
        return true;
      });
    });
    const magic = isPlainObject(target.choices.backgroundMagic) ? target.choices.backgroundMagic : {};
    const cantrips = Array.isArray(magic.cantrips) ? magic.cantrips.slice(0, 2).map(name => String(name || "")) : ["", ""];
    while (cantrips.length < 2) cantrips.push("");
    target.choices.backgroundMagic = { cantrips, levelOneSpells: Array.isArray(magic.levelOneSpells) ? magic.levelOneSpells.filter(Boolean).slice(0, 1) : [] };
    target.choices.backgroundCurrency = Object.fromEntries(["cp", "sp", "gp", "pp"].map(currency => [currency, Math.max(0, Number(target.choices.backgroundCurrency?.[currency]) || 0)]));
    target.choices.raceOptions = isPlainObject(target.choices.raceOptions) ? target.choices.raceOptions : {};
    target.choices.abilities = normalizeAbilityScores(target.choices.abilities);
    target.choices.backgroundAbilityBonuses = isPlainObject(target.choices.backgroundAbilityBonuses) ? target.choices.backgroundAbilityBonuses : emptyAbilityMap();
    target.choices.classOptions = isPlainObject(target.choices.classOptions) ? target.choices.classOptions : {};
    target.choices.classEquipmentOptions = isPlainObject(target.choices.classEquipmentOptions) ? target.choices.classEquipmentOptions : {};
    target.choices.levelOne = isPlainObject(target.choices.levelOne) ? target.choices.levelOne : {};
    target.choices.alignment = ALIGNMENT_OPTIONS.some(([value]) => value === target.choices.alignment) ? target.choices.alignment : "";
    target.choices.spellcastingAbility = ["int", "wis", "cha"].includes(target.choices.spellcastingAbility) ? target.choices.spellcastingAbility : null;
    target.ui = isPlainObject(target.ui) ? target.ui : { ...blank.ui };
    target.ui.confirmedStepSignatures = isPlainObject(target.ui.confirmedStepSignatures) ? target.ui.confirmedStepSignatures : {};
    const steps = activeSteps(target);
    if (!steps.some(step => step.id === target.ui.currentStepId)) target.ui.currentStepId = steps[0]?.id || "background";
    target.ui.view = target.ui.view === "review" ? "review" : "edit";
    const selectionIds = new Set();
    target.selections.backgroundSpells = (Array.isArray(target.selections.backgroundSpells) ? target.selections.backgroundSpells : []).filter(selection => {
      if (!isPlainObject(selection) || !selection.id || selectionIds.has(selection.id)) return false;
      selectionIds.add(selection.id);
      return true;
    });
    return target;
  }

  function raceData(key) {
    return typeof raceFeatures === "object" ? raceFeatures[key] : null;
  }

  function raceSource(key) {
    return { type: "race", id: key, label: RACE_LABELS[key], dataFile: "race.js" };
  }

  function reconcileRaceDraft(target) {
    const blank = createDraft();
    if (!isPlainObject(target.choices)) target.choices = { ...blank.choices };
    if (!isPlainObject(target.selections)) target.selections = { ...blank.selections };
    if (!isPlainObject(target.acquisitions)) target.acquisitions = { ...blank.acquisitions };
    Object.keys(blank.acquisitions).forEach(type => {
      target.acquisitions[type] = (Array.isArray(target.acquisitions[type]) ? target.acquisitions[type] : []).filter(item => item?.sourceType !== "race");
    });
    target.selections.race = null;
    target.selections.raceSpells = [];

    const key = target.choices.race;
    if (!RACE_ORDER.includes(key) || !raceData(key)) {
      target.choices.race = null;
      target.choices.raceOptions = {};
      return target;
    }
    let options = isPlainObject(target.choices.raceOptions) ? target.choices.raceOptions : {};
    if (["dwarf", "halfling", "orc"].includes(key)) {
      options = {};
      target.choices.raceOptions = options;
    }
    if (key === "human" && options.feat === "魔法學徒") {
      const savedFeatOptions = isPlainObject(options.featOptions) ? options.featOptions : {};
      const blockedSpellClass = HUMAN_MAGIC_INITIATE_BLOCKED_CLASS_BY_BACKGROUND[target.choices.background];
      const spellClass = MAGIC_INITIATE_SPELL_CLASSES.has(savedFeatOptions.spellClass) && savedFeatOptions.spellClass !== blockedSpellClass
        ? savedFeatOptions.spellClass
        : "";
      const cantrips = spellClass ? validSpellIds(SpellCatalog.getSpells(spellClass, "cantrips", spellMode()), savedFeatOptions.cantrips, 2) : [];
      const levelOneSpells = spellClass ? validSpellIds(SpellCatalog.getSpells(spellClass, "1", spellMode()), savedFeatOptions.levelOneSpells, 1) : [];
      const featOptions = { spellClass, cantrips, levelOneSpells };
      options = { ...options, featOptions };
      target.choices.raceOptions = options;
    }
    if (key === "elf" && options.lineage === "高等精靈血統") {
      const validCantrip = canonicalSpell(options.cantrip)?.level === 0 && SpellCatalog.getSpells("wizard", "cantrips", spellMode()).some(spell => spell.spellId === options.cantrip);
      if (!validCantrip) options = { ...options, cantrip: "" };
      target.choices.raceOptions = options;
    }
    const source = raceSource(key);
    target.selections.race = { id: key, label: RACE_LABELS[key], source, content: { text: raceData(key), options: structuredClone(options), pendingChoices: racePendingChoices(key, options, target) } };

    if (key === "elf" && RACE_OPTION_DEFINITIONS.elf.skill.includes(options.skill)) {
      addDerivedAcquisition(target, "skills", { id: `race:elf:skill:${options.skill}`, name: options.skill, sourceType: "race", sourceId: key, source: { ...source, feature: "敏銳感官" }, content: { proficiency: "skill" } });
    }
    if (key === "human" && SKILL_OPTIONS.includes(options.skill)) {
      addDerivedAcquisition(target, "skills", { id: `race:human:skill:${options.skill}`, name: options.skill, sourceType: "race", sourceId: key, source: { ...source, feature: "技藝嫻熟" }, content: { proficiency: "skill" } });
    }
    if (key === "human" && humanOriginFeatValues().includes(options.feat)) {
      addDerivedAcquisition(target, "feats", { id: `race:human:feat:${options.feat}`, name: options.feat, sourceType: "race", sourceId: key, source: { ...source, feature: "靈活人才", dataFile: "feats.js" }, content: { type: "origin feat", description: typeof featsDesc === "object" ? featsDesc[options.feat] : null } });
    }
    const humanFeatOptions = isPlainObject(options.featOptions) ? options.featOptions : {};
    if (key === "human" && options.feat === "魔法學徒" && MAGIC_INITIATE_SPELL_CLASSES.has(humanFeatOptions.spellClass)) {
      const spellFeature = `靈活人才：魔法學徒（${CLASS_LABELS[humanFeatOptions.spellClass]}）`;
      (humanFeatOptions.cantrips || []).filter(Boolean).forEach(name => addRaceSpell(target, key, name, "cantrip", 1, spellFeature));
      (humanFeatOptions.levelOneSpells || []).filter(Boolean).forEach(name => addRaceSpell(target, key, name, 1, 1, spellFeature));
    }
    if (key === "human" && options.feat === "熟習") {
      const proficiencies = Array.isArray(humanFeatOptions.proficiencies) ? humanFeatOptions.proficiencies : [];
      proficiencies.forEach(value => {
        const [type, name] = String(value).split(":");
        if (type === "skill" && SKILL_OPTIONS.includes(name)) addDerivedAcquisition(target, "skills", { id: `race:human:skilled:skill:${name}`, name, sourceType: "race", sourceId: key, source: { ...source, feature: "靈活人才：熟習", dataFile: "feats.js" }, content: { proficiency: "skill" } });
        const allTools = TOOL_OPTIONS.concat(GAME_TOOL_OPTIONS, INSTRUMENT_TOOL_OPTIONS);
        if (type === "tool" && allTools.includes(name)) addDerivedAcquisition(target, "tools", { id: `race:human:skilled:tool:${name}`, name, sourceType: "race", sourceId: key, source: { ...source, feature: "靈活人才：熟習", dataFile: "equipment-notes.js" }, content: { proficiency: "tool" } });
      });
    }
    const lineage = options.lineage || options.legacy;
    (RACE_LINEAGE_SPELLS[key]?.[lineage] || []).forEach(([name, level, gainedAt]) => addRaceSpell(target, key, name, level, gainedAt, lineage));
    if (key === "elf" && options.lineage === "高等精靈血統" && options.cantrip) addRaceSpell(target, key, options.cantrip, "cantrip", 1, "高等精靈血統");
    if (key === "tiefling") addRaceSpell(target, key, "thaumaturgy", "cantrip", 1, "異界姿態");
    const spellConflicts = target.acquisitions.spells.filter(item => item.sourceType === "race" && acquisitionAppliesAtLevel(item)).flatMap(item =>
      acquisitionConflicts(target, "spells", item.spellId, "race")
        .filter(conflict => conflict.sourceType === "background")
        .map(conflict => {
          const conflictId = `spell:${item.spellId}:background-race`;
          return { type: "spell", id: conflictId, spellId: item.spellId, name: spellNameZh(item.spellId), sources: [conflict.source, item.source], blocking: false };
        })
    );
    const conflictNames = new Set(spellConflicts.map(conflict => conflict.spellId));
    target.selections.raceSpells.forEach(item => { item.content.crossSourceDuplicate = conflictNames.has(item.spellId); });
    target.acquisitions.spells.filter(item => item.sourceType === "race").forEach(item => { item.content.crossSourceDuplicate = conflictNames.has(item.spellId); });
    target.selections.race.content.conflicts = spellConflicts;
    return target;
  }

  function backgroundEquipmentDetails(key, method, toolChoice = null) {
    const data = backgroundData(key) || {}; const raw = method === "gold" ? data.裝備B : data.裝備A; const currency = { cp: 0, sp: 0, gp: 0, pp: 0 };
    const items = String(raw || "").split(/[、,，]/u).map(item => item.trim()).filter(Boolean).map(item => key === "soldier" && method === "default" && item === "賭具擇一" && GAME_TOOL_OPTIONS.includes(toolChoice) ? toolChoice : item).filter(item => { const match = item.match(/^(\d+)\s*金幣$/u); if (!match) return true; currency.gp += Number(match[1]); return false; });
    return { items, currency };
  }
  function displayList(value) { return plainText(value).replace(/[，,]/gu, "、"); }
  function backgroundSource(key) { return { type: "background", id: key, label: BACKGROUND_LABELS[key], dataFile: "backgrounds.js" }; }
  function spellSourceForBackground(key) { return key === "acolyte" ? "cleric" : "wizard"; }

  function spellMode() {
    return typeof SPELL_MODE === "string" && ["basic", "full"].includes(SPELL_MODE) ? SPELL_MODE : "basic";
  }

  function canonicalSpell(spellId) {
    return typeof SpellCatalog === "object" ? SpellCatalog.getSpell(spellId) || null : null;
  }

  function spellNameZh(spellId) { return canonicalSpell(spellId)?.nameZh || ""; }
  function spellDisplayName(spellId) { return SpellCatalog.getDisplayName(spellId) || spellNameZh(spellId); }

  function acquisitionAppliesAtLevel(acquisition, characterLevel = QUICK_BUILD_LEVEL) {
    const gainedAt = Number(acquisition?.content?.gainedAt ?? acquisition?.source?.level);
    return !Number.isFinite(gainedAt) || gainedAt <= characterLevel;
  }

  function acquisitionConflicts(target, type, identity, sourceType) {
    return (target.acquisitions?.[type] || []).filter(item =>
      (type === "spells" ? item.spellId === identity : item.name === identity) && item.sourceType !== sourceType && (type !== "spells" || acquisitionAppliesAtLevel(item))
    );
  }

  function crossSourceDuplicateGroups(target, type, sourceTypes = null) {
    const allowed = sourceTypes ? new Set(sourceTypes) : null;
    const groups = new Map();
    (target.acquisitions?.[type] || []).forEach(item => {
      const identity = type === "spells" ? item?.spellId : item?.name;
      if (!identity || (allowed && !allowed.has(item.sourceType)) || (type === "spells" && !acquisitionAppliesAtLevel(item))) return;
      if (!groups.has(identity)) groups.set(identity, []);
      groups.get(identity).push(item);
    });
    return [...groups.entries()].flatMap(([identity, items]) => new Set(items.map(item => `${item.sourceType}:${item.source?.feature || item.sourceId || ""}`)).size > 1
      ? [{ type, spellId: type === "spells" ? identity : null, name: type === "spells" ? spellNameZh(identity) : identity, items }]
      : []);
  }

  function duplicateGroupText(group) {
    const sources = [...new Set(group.items.map(item => item.source?.label || item.sourceType || "其他來源"))];
    return group.name + "（" + sources.join("／") + "）";
  }

  function duplicateSourceLabels(type, identity, excludedSourceType = null, target = draft) {
    return [...new Set((target.acquisitions?.[type] || [])
      .filter(item => {
        const itemIdentity = type === "spells" ? item.spellId : item.name;
        return itemIdentity === identity && item.sourceType !== excludedSourceType && (type !== "spells" || acquisitionAppliesAtLevel(item));
      })
      .map(item => item.source?.label || item.sourceType || "其他來源"))];
  }

  function annotatedDuplicateName(type, identity, sourceType, verb) {
    const sources = duplicateSourceLabels(type, identity, sourceType);
    return `${type === "spells" ? spellNameZh(identity) : identity}${sources.length ? `（${sources.join("、")}${verb}）` : ""}`;
  }

  function duplicateWarningsForReview() {
    return crossSourceDuplicateGroups(draft, "skills")
      .concat(crossSourceDuplicateGroups(draft, "spells"))
      .concat(crossSourceDuplicateGroups(draft, "tools"));
  }

  function duplicateReviewWarning() {
    const duplicates = duplicateWarningsForReview();
    return duplicates.length
      ? `<div class="quick-build-warning quick-build-duplicate-warning"><strong>重複選項提醒</strong><br>${duplicates.map(group => escapeHtml(duplicateGroupText(group))).join("、")}。所有來源都會保留。</div>`
      : "";
  }

  function addRaceSpell(target, key, spellId, level, gainedAt, sourceDetail) {
    const record = canonicalSpell(spellId);
    if (!record) return;
    const source = { ...raceSource(key), feature: sourceDetail };
    const content = { spellId, name: record.nameZh, level, gainedAt };
    const id = "race:" + key + ":spell:" + sourceDetail + ":" + spellId + ":" + gainedAt;
    target.selections.raceSpells.push({ id, spellId, source, content });
    addDerivedAcquisition(target, "spells", { id, spellId, name: record.nameZh, sourceType: "race", sourceId: key, source, content: { ...content, spellId } });
  }

  function spellOptionsForBackground(key, level) { return SpellCatalog.getSpells(spellSourceForBackground(key), level, spellMode()); }
  function selectedSpellForBackground(key, spellId, level) { return spellOptionsForBackground(key, level).find(spell => spell.spellId === spellId) || null; }
  function validSpellIds(entries, spellIds, limit) {
    const allowed = new Set((Array.isArray(entries) ? entries : []).map(spell => spell.spellId));
    return uniqueValidSlots(spellIds, limit, spellId => allowed.has(spellId));
  }

  function addDerivedAcquisition(target, type, acquisition) {
    if (!target.acquisitions[type].some(item => item.id === acquisition.id)) {
      target.acquisitions[type].push(acquisition);
    }
  }

  function reconcileBackgroundDraft(target) {
    const blank = createDraft();
    if (!isPlainObject(target.choices)) target.choices = { ...blank.choices };
    if (!isPlainObject(target.selections)) target.selections = { ...blank.selections };
    if (!isPlainObject(target.acquisitions)) target.acquisitions = { ...blank.acquisitions };
    Object.keys(blank.acquisitions).forEach(type => {
      const entries = Array.isArray(target.acquisitions[type]) ? target.acquisitions[type] : [];
      target.acquisitions[type] = entries.filter(item => item?.sourceType !== "background");
    });
    target.selections.background = null;
    target.selections.backgroundEquipment = null;
    target.selections.backgroundSpells = [];

    const key = target.choices.background;
    const data = BACKGROUND_ORDER.includes(key) ? backgroundData(key) : null;
    if (!data) {
      target.choices.background = null;
      target.choices.backgroundAbilities = [];
      target.choices.backgroundWealth = null;
      target.choices.backgroundToolChoice = null;
      target.choices.backgroundCurrency = { cp: 0, sp: 0, gp: 0, pp: 0 };
      target.choices.backgroundMagic = { cantrips: ["", ""], levelOneSpells: [] };
      target.choices.backgroundAbilityBonuses = emptyAbilityMap();
      return target;
    }

    const source = backgroundSource(key);
    const skills = displayList(data.技能熟練).split("、").filter(Boolean);
    const abilities = displayList(data.屬性).split("、").filter(Boolean);
    target.choices.backgroundAbilities = abilities;
    target.choices.backgroundAbilityBonuses = normalizeBackgroundBonuses(target.choices.backgroundAbilityBonuses, abilities);
    if (key !== "soldier") target.choices.backgroundToolChoice = null;
    const backgroundTool = key === "soldier" ? (GAME_TOOL_OPTIONS.includes(target.choices.backgroundToolChoice) ? target.choices.backgroundToolChoice : null) : displayList(data.工具熟練);
    target.selections.background = {
      id: key, label: BACKGROUND_LABELS[key], source,
      content: { skills, feat: data.專長, tool: backgroundTool, adjustableAbilities: abilities, abilityBonuses: structuredClone(target.choices.backgroundAbilityBonuses) }
    };
    skills.forEach(name => addDerivedAcquisition(target, "skills", {
      id: `background:${key}:skill:${name}`, name, sourceType: "background", sourceId: key, source, content: { proficiency: "skill" }
    }));
    if (data.專長) addDerivedAcquisition(target, "feats", {
      id: `background:${key}:feat`, name: data.專長, sourceType: "background", sourceId: key, source, content: { type: "origin feat" }
    });
    if (backgroundTool) addDerivedAcquisition(target, "tools", {
      id: `background:${key}:tool:${backgroundTool}`, name: backgroundTool, sourceType: "background", sourceId: key, source: { ...source, feature: "工具熟練" }, content: { proficiency: "tool" }
    });
    ABILITY_ORDER.forEach(ability => {
      const bonus = target.choices.backgroundAbilityBonuses[ability];
      if (!bonus) return;
      addDerivedAcquisition(target, "abilityBonuses", {
        id: `background:${key}:ability-bonus:${ability}`, name: `${ABILITY_LABELS[ability]} +${bonus}`,
        sourceType: "background", sourceId: key, source: { ...source, feature: "背景屬性加值" },
        content: { ability, abilityLabel: ABILITY_LABELS[ability], bonus }
      });
    });

    const method = target.choices.backgroundWealth;
    if (["default", "gold"].includes(method)) {
      const { items, currency } = backgroundEquipmentDetails(key, method, target.choices.backgroundToolChoice);
      target.choices.backgroundCurrency = currency;
      target.selections.backgroundEquipment = {
        id: `${key}:${method}`, label: method === "default" ? "預設裝備" : "50 金幣自購",
        source, content: { method, items, currency, raw: method === "default" ? data.裝備A : data.裝備B }
      };
      if (items.length) addDerivedAcquisition(target, "equipment", {
        id: `background:${key}:${method}`, name: items.join("、"), sourceType: "background", sourceId: key, source, content: { items, currency }
      });
    } else {
      target.choices.backgroundWealth = null;
      target.choices.backgroundCurrency = { cp: 0, sp: 0, gp: 0, pp: 0 };
    }

    if (!["acolyte", "sage"].includes(key)) {
      target.choices.backgroundMagic = { cantrips: ["", ""], levelOneSpells: [] };
      return target;
    }

    const savedMagic = target.choices.backgroundMagic;
    const cantrips = validSpellIds(spellOptionsForBackground(key, "cantrips"), savedMagic.cantrips, 2);
    while (cantrips.length < 2) cantrips.push("");
    const levelOneSpells = validSpellIds(spellOptionsForBackground(key, "1"), savedMagic.levelOneSpells, 1);
    target.choices.backgroundMagic = { cantrips, levelOneSpells };
    const magic = target.choices.backgroundMagic;
    [["cantrips", magic.cantrips], ["1", magic.levelOneSpells]].forEach(([level, names]) => {
      (Array.isArray(names) ? names : []).filter(Boolean).forEach(spellId => {
        const chineseName = spellNameZh(spellId);
        const content = { spellId, name: chineseName, level: level === "cantrips" ? "cantrip" : Number(level), gainedAt: 1 };
        const spellSource = spellSourceForBackground(key);
        const spellSourceRecord = { ...source, feature: "魔法學徒", optionList: spellSource };
        target.selections.backgroundSpells.push({ id: `background:${key}:spell:${level}:${spellId}`, spellId, source: spellSourceRecord, content });
        addDerivedAcquisition(target, "spells", {
          id: `background:${key}:spell:${spellId}`, spellId, name: chineseName, sourceType: "background", sourceId: key, source: spellSourceRecord, content
        });
      });
    });
    return target;
  }

  function classSource(key) {
    return { type: "class", id: key, label: CLASS_LABELS[key], dataFile: "class-features.js" };
  }

  function applyDefaultClassAbilityPreset(target = draft) {
    const preset = defaultAbilityPreset(target);
    if (!preset) return false;
    target.choices.abilities = preset.abilities;
    target.choices.backgroundAbilityBonuses = normalizeBackgroundBonuses(preset.bonuses, target.choices.backgroundAbilities);
    if (isPlainObject(target.choices.classOptions)) {
      target.choices.classOptions.defaultPresetKey = `${classBuildKey(target)}:${target.choices.background || "none"}`;
      target.choices.classOptions.abilitiesCustomized = false;
    }
    return true;
  }

  function classChoiceConflicts(target, type, names) {
    return names.flatMap(name => (target.acquisitions[type] || [])
      .filter(item => item.name === name && item.sourceType !== "class")
      .map(item => ({ type, name, existingSource: item.source, classSource: classSource(target.choices.class) })));
  }

  function reconcileClassDraft(target) {
    const blank = createDraft();
    if (!isPlainObject(target.choices)) target.choices = { ...blank.choices };
    if (!isPlainObject(target.selections)) target.selections = { ...blank.selections };
    if (!isPlainObject(target.acquisitions)) target.acquisitions = { ...blank.acquisitions };
    Object.keys(blank.acquisitions).forEach(type => {
      const entries = Array.isArray(target.acquisitions[type]) ? target.acquisitions[type] : [];
      target.acquisitions[type] = entries.filter(item => item?.sourceType !== "class");
    });
    target.selections.class = null;

    const key = target.choices.class;
    const definition = CLASS_ORDER.includes(key) ? CLASS_BUILD_DEFINITIONS[key] : null;
    if (!definition) {
      target.choices.class = null;
      target.choices.abilityMethod = null;
      target.choices.abilities = emptyAbilityMap(null);
      target.choices.backgroundAbilityBonuses = normalizeBackgroundBonuses(target.choices.backgroundAbilityBonuses, target.choices.backgroundAbilities);
      target.choices.spellcastingAbility = null;
      target.choices.classOptions = {};
      return target;
    }

    const source = classSource(key);
    const options = isPlainObject(target.choices.classOptions) ? target.choices.classOptions : {};
    const typeOptions = CLASS_TYPE_OPTIONS[key] || [];
    const effectiveDefinition = { ...definition };
    if (key === "cleric" && options.classType === "guardian") {
      effectiveDefinition.weaponProficiencies = "簡易武器和軍用武器";
      effectiveDefinition.armorTraining = "輕甲、中甲、重甲和盾牌";
    }
    if (key === "druid" && target.choices.levelOne?.classOption === "warden") {
      effectiveDefinition.weaponProficiencies = "簡易武器和軍用武器";
      effectiveDefinition.armorTraining = "輕甲、中甲和盾牌";
    }
    if (typeOptions.length && !typeOptions.some(option => option.id === options.classType)) {
      options.classType = null;
    }
    const presetKey = `${classBuildKey(target)}:${target.choices.background || "none"}`;
    const normalizedAbilities = normalizeAbilityScores(target.choices.abilities);
    const hasCompleteAbilities = ABILITY_ORDER.every(ability => normalizedAbilities[ability] !== null);
    if (!hasCompleteAbilities || (!options.backgroundBonusInvalidated && !options.abilitiesCustomized && options.defaultPresetKey !== presetKey)) {
      applyDefaultClassAbilityPreset(target);
    } else {
      target.choices.abilities = normalizedAbilities;
      target.choices.backgroundAbilityBonuses = normalizeBackgroundBonuses(target.choices.backgroundAbilityBonuses, target.choices.backgroundAbilities);
    }
    target.choices.abilityMethod = "class-default-customized";

    const skillSlots = uniqueValidSlots(options.skills, effectiveDefinition.skillCount,
      name => effectiveDefinition.skillOptions.includes(name));
    const toolSlots = uniqueValidSlots(options.tools, effectiveDefinition.toolCount || 0,
      name => (effectiveDefinition.toolOptions || []).includes(name));
    const skillChoices = skillSlots.filter(Boolean);
    const toolChoices = toolSlots.filter(Boolean);
    const spellcastingSource = spellcastingSourceForDraft(target);
    const spellcastingSourceKey = spellcastingSource ? `${spellcastingSource.type}:${spellcastingSource.id}` : null;
    const fixedSpellcastingAbility = spellcastingSource?.type === "class" ? spellcastingSource.fixedAbility : null;
    if (options.spellcastingSourceKey !== spellcastingSourceKey) options.spellcastingAbilityManual = false;
    options.spellcastingSourceKey = spellcastingSourceKey;
    if (!spellcastingSource) {
      target.choices.spellcastingAbility = null;
      options.spellcastingAbilityManual = false;
    } else if (fixedSpellcastingAbility) {
      target.choices.spellcastingAbility = fixedSpellcastingAbility;
      options.spellcastingAbilityManual = false;
    } else if (!options.spellcastingAbilityManual || !["int", "wis", "cha"].includes(target.choices.spellcastingAbility)) {
      target.choices.spellcastingAbility = preferredMentalAbility(target);
      options.spellcastingAbilityManual = false;
    }
    options.skills = skillSlots;
    options.tools = toolSlots;

    const abilityCost = abilityPointCost(target.choices.abilities);
    const bonusTotal = backgroundBonusTotal(target.choices.backgroundAbilityBonuses);
    const pendingChoices = [];
    if (typeOptions.length && !options.classType) pendingChoices.push("職業類型");
    if (abilityCost !== 27) pendingChoices.push("屬性購點須剛好分配 27 點");
    if (bonusTotal !== 3) pendingChoices.push("背景屬性加值須剛好分配 3 點");
    if (spellcastingSource && !target.choices.spellcastingAbility) pendingChoices.push("施法屬性");
    if (skillChoices.length !== effectiveDefinition.skillCount) pendingChoices.push(`職業技能 ${effectiveDefinition.skillCount} 項`);
    if (toolChoices.length !== (effectiveDefinition.toolCount || 0)) pendingChoices.push(`職業工具 ${effectiveDefinition.toolCount} 項`);
    target.choices.classOptions = options;

    const selectedTools = (effectiveDefinition.fixedTools || []).concat(toolChoices);
    const conflicts = classChoiceConflicts(target, "skills", skillChoices)
      .concat(classChoiceConflicts(target, "tools", selectedTools));
    target.selections.class = {
      id: key, label: CLASS_LABELS[key], source,
      content: {
        classType: options.classType || null,
        classTypeLabel: typeOptions.find(option => option.id === options.classType)?.label || null,
        keyAbilities: [...effectiveDefinition.keyAbilities],
        keyAbilityText: CLASS_KEY_ABILITY_TEXT[key], hitDie: CLASS_HIT_DICE[key],
        abilities: structuredClone(target.choices.abilities),
        backgroundAbilityBonuses: structuredClone(target.choices.backgroundAbilityBonuses),
        totals: Object.fromEntries(ABILITY_ORDER.map(ability => [ability, abilityTotal(target, ability)])),
        spellcastingAbility: target.choices.spellcastingAbility,
        spellcastingSource: spellcastingSource ? structuredClone(spellcastingSource) : null,
        spellcastingAbilitySource: !spellcastingSource ? "none" : fixedSpellcastingAbility ? "class" : options.spellcastingAbilityManual ? "player-override" : "highest-mental-ability",
        saves: [...effectiveDefinition.saves], skills: [...skillChoices], tools: [...selectedTools],
        weaponProficiencies: effectiveDefinition.weaponProficiencies, armorTraining: effectiveDefinition.armorTraining,
        pendingChoices, conflicts
      }
    };

    if (options.classType) addDerivedAcquisition(target, "other", {
      id: `class:${key}:type:${options.classType}`, name: typeOptions.find(option => option.id === options.classType)?.label || options.classType, sourceType: "class", sourceId: key,
      source: { ...source, feature: "職業類型" }, content: { type: "classType", classType: options.classType }
    });
    skillChoices.forEach(name => addDerivedAcquisition(target, "skills", {
      id: `class:${key}:skill:${name}`, name, sourceType: "class", sourceId: key,
      source: { ...source, feature: "技能熟練項" }, content: { proficiency: "skill", selectedFrom: [...effectiveDefinition.skillOptions] }
    }));
    if (key === "cleric" && options.classType === "thaumaturge") {
      const bonus = Math.max(1, abilityModifier(abilityTotal(target, "wis")));
      ["奧秘", "宗教"].forEach(skill => addDerivedAcquisition(target, "skillBonuses", {
        id: `class:${key}:skill-bonus:${skill}`, name: `${skill}額外 +${bonus}`, sourceType: "class", sourceId: key,
        source: { ...source, feature: "神聖使命：魔術使" },
        content: { type: "skillCheckBonus", skill, checkAbility: "int", bonusAbility: "wis", minimum: 1, value: bonus }
      }));
    }
    selectedTools.forEach(name => addDerivedAcquisition(target, "tools", {
      id: `class:${key}:tool:${name}`, name, sourceType: "class", sourceId: key,
      source: { ...source, feature: "工具熟練項" }, content: { proficiency: "tool", fixed: (effectiveDefinition.fixedTools || []).includes(name), selectedFrom: (effectiveDefinition.toolOptions || []).slice() }
    }));
    effectiveDefinition.saves.forEach(name => addDerivedAcquisition(target, "other", {
      id: `class:${key}:save:${name}`, name: `${name}豁免熟練`, sourceType: "class", sourceId: key,
      source: { ...source, feature: "豁免熟練項" }, content: { type: "savingThrowProficiency", ability: ABILITY_KEYS_BY_LABEL[name], abilityLabel: name }
    }));
    addDerivedAcquisition(target, "other", {
      id: `class:${key}:hit-die`, name: CLASS_HIT_DICE[key], sourceType: "class", sourceId: key,
      source: { ...source, feature: "生命骰" }, content: { type: "hitDie", text: CLASS_HIT_DICE[key] }
    });
    addDerivedAcquisition(target, "other", {
      id: `class:${key}:weapons`, name: effectiveDefinition.weaponProficiencies, sourceType: "class", sourceId: key,
      source: { ...source, feature: "武器熟練項" }, content: { type: "weaponProficiency", text: effectiveDefinition.weaponProficiencies }
    });
    if (effectiveDefinition.armorTraining !== "無") addDerivedAcquisition(target, "other", {
      id: `class:${key}:armor`, name: effectiveDefinition.armorTraining, sourceType: "class", sourceId: key,
      source: { ...source, feature: "護甲訓練" }, content: { type: "armorTraining", text: effectiveDefinition.armorTraining }
    });
    if (fixedSpellcastingAbility) addDerivedAcquisition(target, "other", {
      id: `class:${key}:spellcasting-ability`, name: `施法屬性：${ABILITY_LABELS[fixedSpellcastingAbility]}`,
      sourceType: "class", sourceId: key, source: { ...source, feature: "施法" },
      content: { type: "spellcastingAbility", ability: fixedSpellcastingAbility, abilityLabel: ABILITY_LABELS[fixedSpellcastingAbility] }
    });
    return target;
  }


  function levelOneSource(key) {
    return { type: "level-one", id: key, label: CLASS_LABELS[key], level: 1, dataFile: "class-features.js" };
  }

  function allWeaponMasteryOptionsForClass(key) {
    const simple = WEAPON_MASTERY_OPTIONS.simple;
    const martial = WEAPON_MASTERY_OPTIONS.martial;
    if (["barbarian", "fighter", "paladin", "ranger"].includes(key)) return simple.concat(martial);
    if (key === "rogue") return simple.concat(martial.filter(([name]) => ["刺劍", "彎刀", "短劍", "手弩"].includes(name)));
    return [];
  }

  function levelOneSpellOptions(classId, level) { return SpellCatalog.getSpells(classId, level, spellMode()); }
  function allSpellOptions(level, predicate = null) {
    return SpellCatalog.getAllSpells().filter(spell => spell.level === (level === "cantrips" ? 0 : Number(level)) && SpellCatalog.getClassIds(spell.spellId, spellMode()).length && (!predicate || predicate(spell))).sort((a, b) => a.nameZh.localeCompare(b.nameZh, "zh-Hant"));
  }
  function levelOneInvocationOptions() { return ELDRITCH_INVOCATION_OPTIONS.filter(option => !option.minWarlockLevel || option.minWarlockLevel <= 1); }
  function isRitualSpell(spell) { return Boolean(spell) && /儀式/u.test(spell.desc || ""); }
  function knownSpellSources(target, excludedFeature = "") {
    const map = new Map();
    (target.acquisitions.spells || []).forEach(item => {
      if (item.source?.feature === excludedFeature || !acquisitionAppliesAtLevel(item) || !item.spellId) return;
      if (!map.has(item.spellId)) map.set(item.spellId, []);
      map.get(item.spellId).push(item.source?.label || item.sourceType || "其他來源");
    });
    return map;
  }
  function validDefaultSpellIds(classId, level, spellIds, knownSpellIds = new Set()) {
    const options = level === "all-cantrips" ? allSpellOptions("cantrips") : level === "all-rituals-1" ? allSpellOptions("1", isRitualSpell) : levelOneSpellOptions(classId, level);
    const valid = new Set(options.map(spell => spell.spellId));
    return (Array.isArray(spellIds) ? spellIds : []).filter(spellId => valid.has(spellId) && !knownSpellIds.has(spellId));
  }

  function languageOptionsForDraft(target, index = 0) {
    if (target.choices.class === "rogue" && index >= 2) {
      return LANGUAGE_OPTIONS.filter(option => option.value !== "thieves-cant");
    }
    const options = [...BASE_LANGUAGE_OPTIONS];
    if (target.choices.race === "tiefling") {
      options.push(RARE_LANGUAGE_OPTIONS.find(option => option.value === "infernal"));
    }
    return options.filter(Boolean);
  }

  function languageFieldIdForDraft(target, index) {
    if (target.choices.class === "rogue" && index >= 2) return `language-extra-${index}`;
    return `language${index + 1}`;
  }

  function normalizeLevelOneChoices(target) {
    const key = target.choices.class;
    const definition = LEVEL_ONE_DEFINITIONS[key];
    const previous = isPlainObject(target.choices.levelOne) ? target.choices.levelOne : {};
    if (!definition) return {};
    if (previous.classId && previous.classId !== key) return { classId: key };
    return { ...previous, classId: key };
  }

  function levelOneCantripCount(target, definition) {
    let count = definition.cantrips || 0;
    if (target.choices.class === "cleric" && target.choices.classOptions?.classType === definition.extraCantripClassType) count += 1;
    if (target.choices.class === "druid" && target.choices.levelOne?.classOption === definition.extraCantripOption) count += 1;
    return count;
  }

  function expertiseSkillOptions(target) {
    return [...new Set((target.acquisitions.skills || [])
      .filter(item => ["background", "race", "class"].includes(item.sourceType))
      .map(item => item.name)
      .filter(Boolean))];
  }

  function reconcileLevelOneDraft(target) {
    const blank = createDraft();
    if (!isPlainObject(target.choices)) target.choices = { ...blank.choices };
    if (!isPlainObject(target.selections)) target.selections = { ...blank.selections };
    if (!isPlainObject(target.acquisitions)) target.acquisitions = { ...blank.acquisitions };
    Object.keys(blank.acquisitions).forEach(type => {
      target.acquisitions[type] = (Array.isArray(target.acquisitions[type]) ? target.acquisitions[type] : [])
        .filter(item => item?.sourceType !== "level-one");
    });
    target.selections.levelOne = null;
    const key = target.choices.class;
    const definition = LEVEL_ONE_DEFINITIONS[key];
    if (!definition) { target.choices.levelOne = {}; return target; }
    const source = levelOneSource(key);
    const choices = normalizeLevelOneChoices(target);
    const pendingChoices = [];
    const fixed = [...(definition.fixed || [])];
    const knownSpellIds = new Set((target.acquisitions.spells || []).filter(item => acquisitionAppliesAtLevel(item)).map(item => item.spellId).filter(Boolean));
    if (!Array.isArray(choices.cantrips) || choices.cantrips.filter(Boolean).length === 0) choices.cantrips = validDefaultSpellIds(key, "cantrips", definition.defaultCantrips, knownSpellIds);
    if (!Array.isArray(choices.spellbookSpells) || choices.spellbookSpells.filter(Boolean).length === 0) choices.spellbookSpells = validDefaultSpellIds("wizard", "1", definition.defaultSpellbookSpells, knownSpellIds);
    if (!Array.isArray(choices.preparedSpells) || choices.preparedSpells.filter(Boolean).length === 0) choices.preparedSpells = validDefaultSpellIds(definition.spellbookSpells ? "wizard" : key, "1", definition.defaultPreparedSpells, knownSpellIds);
    if (!Array.isArray(choices.invocations) || choices.invocations.filter(Boolean).length === 0) choices.invocations = (Array.isArray(definition.defaultInvocations) ? definition.defaultInvocations : []).filter(id => levelOneInvocationOptions().some(option => option.id === id));
    if (definition.classOption) {
      const valid = definition.classOption.options.some(option => option.id === choices.classOption);
      if (!valid) choices.classOption = null;
      if (!choices.classOption) pendingChoices.push(definition.classOption.label);
    }
    const cantripCount = levelOneCantripCount(target, definition);
    const cantripSlots = uniqueValidSlots(choices.cantrips, cantripCount,
      spellId => levelOneSpellOptions(key, "cantrips").some(spell => spell.spellId === spellId));
    const cantrips = cantripSlots.filter(Boolean);
    if (cantrips.length !== cantripCount) pendingChoices.push(`戲法 ${cantripCount} 個`);
    const spellbookSlots = uniqueValidSlots(choices.spellbookSpells, definition.spellbookSpells || 0,
      spellId => levelOneSpellOptions("wizard", "1").some(spell => spell.spellId === spellId));
    const spellbookSpells = spellbookSlots.filter(Boolean);
    if (spellbookSpells.length !== (definition.spellbookSpells || 0)) pendingChoices.push(`法術書一環法術 ${definition.spellbookSpells} 個`);
    let preparedCandidates = definition.spellbookSpells ? spellbookSpells : null;
    const preparedSlots = uniqueValidSlots(choices.preparedSpells, definition.preparedSpells || 0,
      spellId => preparedCandidates ? preparedCandidates.includes(spellId) : levelOneSpellOptions(key, "1").some(spell => spell.spellId === spellId));
    const preparedSpells = preparedSlots.filter(Boolean);
    if (preparedSpells.length !== (definition.preparedSpells || 0)) pendingChoices.push(`準備法術 ${definition.preparedSpells} 個`);
    const weaponOptions = allWeaponMasteryOptionsForClass(key).map(([name]) => name);
    let weaponMasterySlots = uniqueValidSlots(choices.weaponMasteries, definition.weaponMastery || 0, name => weaponOptions.includes(name));
    if (!weaponMasterySlots.some(Boolean)) weaponMasterySlots = uniqueValidSlots(definition.defaultWeaponMasteries, definition.weaponMastery || 0, name => weaponOptions.includes(name));
    if (!weaponMasterySlots.some(Boolean) && definition.prefillMasteryFromDefaultWeapon && target.choices.defaultWeapon && weaponOptions.includes(target.choices.defaultWeapon)) weaponMasterySlots = [target.choices.defaultWeapon];
    const weaponMasteries = weaponMasterySlots.filter(Boolean);
    if (weaponMasteries.length !== (definition.weaponMastery || 0)) pendingChoices.push(`武器精通 ${definition.weaponMastery} 種`);
    const fightingStyles = (typeof FEAT_OPTIONS === "object" ? FEAT_OPTIONS : []).filter(option => /戰鬥風格/u.test(option.label || "")).map(option => option.value);
    const fightingStyle = definition.fightingStyle && fightingStyles.includes(choices.fightingStyle) ? choices.fightingStyle : null;
    if (definition.fightingStyle && !fightingStyle) pendingChoices.push("戰鬥風格");
    const expertiseOptions = expertiseSkillOptions(target);
    const rawExpertise = Array.isArray(choices.expertise) ? choices.expertise.slice(0, definition.expertise || 0) : [];
    while (rawExpertise.length < (definition.expertise || 0)) rawExpertise.push("");
    const seenExpertise = new Set();
    const expertiseSlots = rawExpertise.map(name => {
      if (!name || seenExpertise.has(name)) return "";
      seenExpertise.add(name);
      return name;
    });
    const expertise = expertiseSlots.filter(name => expertiseOptions.includes(name));
    if (expertise.length !== (definition.expertise || 0)) pendingChoices.push(`專精 ${definition.expertise} 項`);
    const rawLanguages = Array.isArray(choices.languages) ? choices.languages : [];
    const selectedLanguageValues = new Set();
    const languageSlots = Array.from({ length: definition.languages || 0 }, (_, index) => {
      const languageValues = new Map(languageOptionsForDraft(target, index).map(item => [item.value, item.label]));
      const value = rawLanguages[index] || "";
      if (!languageValues.has(value) || selectedLanguageValues.has(value)) return "";
      selectedLanguageValues.add(value);
      return value;
    });
    const languageDetails = languageSlots.flatMap((value, index) => {
      if (!value) return [];
      const option = languageOptionsForDraft(target, index).find(item => item.value === value);
      return [{ value, label: option?.label || value, slot: index, category: index < 2 ? "base" : "class-extra", fieldId: languageFieldIdForDraft(target, index) }];
    });
    const languages = languageDetails.map(item => item.value);
    if (languages.length !== (definition.languages || 0)) pendingChoices.push(`初始語言 ${definition.languages} 種`);
    let invocations = Array.isArray(choices.invocations) ? choices.invocations.filter(id => levelOneInvocationOptions().some(option => option.id === id)).slice(0, definition.invocations || 0) : [];
    if (invocations.length !== (definition.invocations || 0)) pendingChoices.push(`魔能祈喚 ${definition.invocations} 個`);
    const tome = isPlainObject(choices.tome) ? choices.tome : {};
    const hasTome = invocations.includes("pact-of-the-tome");
    const tomeCantripSlots = hasTome ? uniqueValidSlots(tome.cantrips, 3, spellId => canonicalSpell(spellId)?.level === 0 && SpellCatalog.getClassIds(spellId, spellMode()).length) : [];
    const tomeRitualSlots = hasTome ? uniqueValidSlots(tome.rituals, 2, spellId => canonicalSpell(spellId)?.level === 1 && isRitualSpell(canonicalSpell(spellId)) && SpellCatalog.getClassIds(spellId, spellMode()).length) : [];
    const tomeCantrips = tomeCantripSlots.filter(Boolean);
    const tomeRituals = tomeRitualSlots.filter(Boolean);
    if (hasTome && tomeCantrips.length !== 3) pendingChoices.push("書之魔契戲法 3 個");
    if (hasTome && tomeRituals.length !== 2) pendingChoices.push("書之魔契儀式一環法術 2 個");
    const alignment = ALIGNMENT_OPTIONS.some(([value]) => value === target.choices.alignment) ? target.choices.alignment : "";
    target.choices.alignment = alignment;
    if (!alignment) pendingChoices.push("陣營");
    target.choices.levelOne = { ...choices, cantrips: cantripSlots, spellbookSpells: spellbookSlots, preparedSpells: preparedSlots, weaponMasteries: weaponMasterySlots, fightingStyle, expertise: expertiseSlots, languages: languageSlots, invocations, tome: { cantrips: tomeCantripSlots, rituals: tomeRitualSlots } };
    target.selections.levelOne = { id: key, label: `${CLASS_LABELS[key]}完成 1 級`, source, content: { fixed, classOption: choices.classOption, cantrips, spellbookSpells, preparedSpells, weaponMasteries, fightingStyle, expertise, languages, languageDetails, invocations, tome: { cantrips: tomeCantrips, rituals: tomeRituals }, alignment, pendingChoices } };
    fixed.forEach((name, index) => addDerivedAcquisition(target, "other", { id: `level-one:${key}:fixed:${index}:${name}`, name, sourceType: "level-one", sourceId: key, source: { ...source, feature: "1 級固定能力" }, content: { type: "classFeature" } }));
    if (choices.classOption) addDerivedAcquisition(target, "other", { id: `level-one:${key}:option:${choices.classOption}`, name: definition.classOption?.options.find(option => option.id === choices.classOption)?.label || choices.classOption, sourceType: "level-one", sourceId: key, source: { ...source, feature: definition.classOption?.label || "職業選項" }, content: { type: "classOption", option: choices.classOption } });
    if (key === "druid" && choices.classOption === "magician") {
      const bonus = Math.max(1, abilityModifier(abilityTotal(target, "wis")));
      ["奧秘", "自然"].forEach(skill => addDerivedAcquisition(target, "skillBonuses", {
        id: `level-one:${key}:skill-bonus:${skill}`, name: `${skill}額外 +${bonus}`, sourceType: "level-one", sourceId: key,
        source: { ...source, feature: "原初使命：巫祝" },
        content: { type: "skillCheckBonus", skill, checkAbility: "int", bonusAbility: "wis", minimum: 1, value: bonus }
      }));
    }
    if (fightingStyle) addDerivedAcquisition(target, "feats", { id: `level-one:${key}:fighting-style:${fightingStyle}`, name: fightingStyle, sourceType: "level-one", sourceId: key, source: { ...source, feature: "戰鬥風格", dataFile: "feats.js" }, content: { type: "fightingStyle" } });
    weaponMasteries.forEach(name => addDerivedAcquisition(target, "other", { id: `level-one:${key}:weapon-mastery:${name}`, name: `${name}精通`, sourceType: "level-one", sourceId: key, source: { ...source, feature: "武器精通" }, content: { type: "weaponMastery", weapon: name } }));
    expertise.forEach(name => addDerivedAcquisition(target, "expertise", { id: `level-one:${key}:expertise:${name}`, name, sourceType: "level-one", sourceId: key, source: { ...source, feature: key === "rogue" ? "盜賊 1 級專精" : "1 級專精" }, content: { type: "expertise", skill: name } }));
    languageDetails.forEach(item => addDerivedAcquisition(target, "languages", { id: `level-one:${key}:language:${item.slot}:${item.value}`, name: item.label, sourceType: "level-one", sourceId: key, source: { ...source, feature: item.category === "class-extra" ? "盜賊黑話：額外語言" : "初始語言" }, content: { type: "language", value: item.value, category: item.category, fieldId: item.fieldId, slot: item.slot } }));
    cantrips.forEach(name => addDerivedAcquisition(target, "spells", { id: `level-one:${key}:cantrip:${name}`, spellId: name, name: spellNameZh(name), sourceType: "level-one", sourceId: key, source: { ...source, feature: "1 級戲法" }, content: { spellId: name, name: spellNameZh(name), level: "cantrip", prepared: true } }));
    if (!definition.spellbookSpells) preparedSpells.forEach(name => addDerivedAcquisition(target, "spells", { id: `level-one:${key}:prepared:${name}`, spellId: name, name: spellNameZh(name), sourceType: "level-one", sourceId: key, source: { ...source, feature: "1 級準備法術" }, content: { spellId: name, name: spellNameZh(name), level: 1, prepared: true } }));
    spellbookSpells.forEach(name => addDerivedAcquisition(target, "spells", { id: `level-one:${key}:spellbook:${name}`, spellId: name, name: spellNameZh(name), sourceType: "level-one", sourceId: key, source: { ...source, feature: "法術書" }, content: { spellId: name, name: spellNameZh(name), level: 1, spellbook: true, prepared: preparedSpells.includes(name), ritual: isRitualSpell(canonicalSpell(name)) } }));
    (definition.alwaysPrepared || []).forEach(name => addDerivedAcquisition(target, "spells", { id: `level-one:${key}:always:${name}`, spellId: name, name: spellNameZh(name), sourceType: "level-one", sourceId: key, source: { ...source, feature: definition.alwaysPreparedFeature || "始終準備" }, content: { spellId: name, name: spellNameZh(name), level: 1, prepared: true, alwaysPrepared: true, countsAgainstPrepared: false, freeUses: definition.alwaysPreparedFreeUses?.[1] || null } }));
    invocations.forEach(id => addDerivedAcquisition(target, "other", { id: `level-one:${key}:invocation:${id}`, name: ELDRITCH_INVOCATION_OPTIONS.find(option => option.id === id)?.label || id, sourceType: "level-one", sourceId: key, source: { ...source, feature: "魔能祈喚" }, content: { type: "eldritchInvocation", invocation: id } }));
    tomeCantrips.forEach(name => addDerivedAcquisition(target, "spells", { id: `level-one:${key}:tome-cantrip:${name}`, spellId: name, name: spellNameZh(name), sourceType: "level-one", sourceId: key, source: { ...source, feature: "書之魔契" }, content: { spellId: name, name: spellNameZh(name), level: "cantrip", prepared: true, pactTome: true } }));
    tomeRituals.forEach(name => addDerivedAcquisition(target, "spells", { id: `level-one:${key}:tome-ritual:${name}`, spellId: name, name: spellNameZh(name), sourceType: "level-one", sourceId: key, source: { ...source, feature: "書之魔契" }, content: { spellId: name, name: spellNameZh(name), level: 1, prepared: true, ritual: true, pactTome: true } }));
    return target;
  }

  function equipmentSource(key) {
    return { type: "class-equipment", id: key, label: `${CLASS_LABELS[key]}初始裝備`, dataFile: "class-features.js" };
  }

  function selectedClassEquipmentPackage(target) {
    const definition = CLASS_EQUIPMENT_DEFINITIONS[target.choices.class];
    if (!definition) return null;
    return definition.defaults.find(option => option.id === target.choices.classEquipmentMethod) || null;
  }

  function classEquipmentInstrumentOptions(target) {
    if (target.choices.class !== "bard") return [];
    return (Array.isArray(target.choices.classOptions?.tools) ? target.choices.classOptions.tools : [])
      .filter(name => INSTRUMENT_TOOL_OPTIONS.includes(name));
  }

  function reconcileEquipmentDraft(target) {
    const blank = createDraft();
    if (!isPlainObject(target.choices)) target.choices = { ...blank.choices };
    if (!isPlainObject(target.selections)) target.selections = { ...blank.selections };
    if (!isPlainObject(target.acquisitions)) target.acquisitions = { ...blank.acquisitions };
    Object.keys(blank.acquisitions).forEach(type => {
      target.acquisitions[type] = (Array.isArray(target.acquisitions[type]) ? target.acquisitions[type] : [])
        .filter(item => item?.sourceType !== "class-equipment");
    });
    target.selections.classEquipment = null;

    const key = target.choices.class;
    const definition = CLASS_EQUIPMENT_DEFINITIONS[key];
    if (!definition) {
      target.choices.classEquipmentMethod = null;
      target.choices.classEquipment = [];
      target.choices.defaultWeapon = null;
      target.choices.classEquipmentOptions = {};
      return target;
    }

    const validMethods = definition.defaults.map(option => option.id).concat("gold");
    if (!validMethods.includes(target.choices.classEquipmentMethod)) {
      target.choices.classEquipmentMethod = null;
      target.choices.classEquipment = [];
      target.choices.defaultWeapon = null;
      target.choices.classEquipmentOptions = {};
      return target;
    }

    const source = equipmentSource(key);
    const method = target.choices.classEquipmentMethod;
    const options = isPlainObject(target.choices.classEquipmentOptions) ? target.choices.classEquipmentOptions : {};
    if (method === "gold") {
      target.choices.classEquipment = [];
      target.choices.defaultWeapon = null;
      target.choices.classEquipmentOptions = {};
      const currency = { cp: 0, sp: 0, gp: definition.gold, pp: 0 };
      target.selections.classEquipment = {
        id: `${key}:gold`, label: `${definition.gold} 金幣`, source,
        content: { method, items: [], currency, loadout: { mainHand: null, offHand: null, armor: null }, operationOrder: [] }
      };
      addDerivedAcquisition(target, "equipment", {
        id: `class-equipment:${key}:gold`, name: `${definition.gold} 金幣`, sourceType: "class-equipment", sourceId: key,
        source: { ...source, feature: "初始資金" }, content: { itemType: "currency", currency }
      });
      return target;
    }

    const equipmentPackage = selectedClassEquipmentPackage(target);
    if (!equipmentPackage) return target;
    const mainHand = equipmentPackage.main.includes(options.mainHand) ? options.mainHand : equipmentPackage.main.length === 1 ? equipmentPackage.main[0] : null;
    const offCandidates = mainHand ? (equipmentPackage.off[mainHand] || []) : [];
    const offHand = offCandidates.includes(options.offHand) ? options.offHand : offCandidates.length === 1 ? offCandidates[0] : null;
    const instrumentOptions = classEquipmentInstrumentOptions(target);
    const instrument = equipmentPackage.instrument && instrumentOptions.includes(options.instrument) ? options.instrument : null;
    const completeChoices = Boolean(mainHand) && (!offCandidates.length || Boolean(offHand)) && (!equipmentPackage.instrument || Boolean(instrument));
    const specialWrites = [...(equipmentPackage.specialWrites || [])];
    const operationOrder = [
      { order: 1, action: "writeEquipmentFields", mainHand, offHand, armor: equipmentPackage.armor || null },
      ...specialWrites.map((operation, index) => ({ order: index + 2, action: "writeSpecialAttackField", ...operation }))
    ];
    const monkTool = key === "monk" ? target.choices.classOptions?.tools?.[0] : null;
    const items = equipmentPackage.items.map(([name, quantity]) => ({
      name: name === "自選樂器" && instrument ? instrument : name === "所選熟練項對應的工匠工具或樂器" && monkTool ? monkTool : name,
      quantity
    }));
    if (instrument) items.push({ name: instrument, quantity: 1 });
    target.choices.classEquipment = items.map(item => ({ ...item }));
    target.choices.defaultWeapon = mainHand;
    target.choices.classEquipmentOptions = { mainHand, offHand, instrument };
    const currency = { cp: 0, sp: 0, gp: equipmentPackage.gp, pp: 0 };
    target.selections.classEquipment = {
      id: `${key}:${method}`, label: equipmentPackage.label, source,
      content: { method, items, currency, loadout: { mainHand, offHand, armor: equipmentPackage.armor || null }, specialWrites, operationOrder, pendingChoices: [!mainHand && "主手武器", offCandidates.length && !offHand && "副手", equipmentPackage.instrument && !instrument && "樂器"].filter(Boolean) }
    };
    items.forEach((item, index) => addDerivedAcquisition(target, "equipment", {
      id: `class-equipment:${key}:${method}:item:${index}:${item.name}`, name: item.name, sourceType: "class-equipment", sourceId: key,
      source: { ...source, feature: equipmentPackage.label }, content: { itemType: "item", quantity: item.quantity, equipped: [mainHand, offHand, equipmentPackage.armor].includes(item.name) }
    }));
    addDerivedAcquisition(target, "equipment", {
      id: `class-equipment:${key}:${method}:currency`, name: `${equipmentPackage.gp} 金幣`, sourceType: "class-equipment", sourceId: key,
      source: { ...source, feature: equipmentPackage.label }, content: { itemType: "currency", currency }
    });
    return target;
  }

  /*
   * selections 與 background acquisitions 一律由 reconcileBackgroundDraft()
   * 根據 choices 重建；事件處理器不得直接修改這些衍生資料。
   * class selections 與 acquisitions 同理由 reconcileClassDraft() 完整重建。
   */
  function backgroundSpellsComplete() {
    const magic = draft.choices.backgroundMagic;
    return Array.isArray(magic?.cantrips) && magic.cantrips.length === 2 && magic.cantrips.every(Boolean) &&
      new Set(magic.cantrips).size === 2 && Array.isArray(magic?.levelOneSpells) &&
      magic.levelOneSpells.length === 1;
  }

  function backgroundComplete() {
    if (!draft.choices.background) return false;
    if (draft.choices.background === "soldier" && !GAME_TOOL_OPTIONS.includes(draft.choices.backgroundToolChoice)) return false;
    return !["acolyte", "sage"].includes(draft.choices.background) || backgroundSpellsComplete();
  }

  function racePendingChoices(key = draft.choices.race, options = draft.choices.raceOptions, target = draft) {
    if (!key) return ["種族"];
    const pending = [];
    if (key === "dragonborn" && !RACE_OPTION_DEFINITIONS.dragonborn.ancestry.includes(options.ancestry)) pending.push("龍族血統");
    if (key === "elf") {
      if (!RACE_OPTION_DEFINITIONS.elf.lineage.includes(options.lineage)) pending.push("精靈傳承");
      if (!RACE_OPTION_DEFINITIONS.elf.skill.includes(options.skill)) pending.push("敏銳感官技能");
      if (options.lineage === "高等精靈血統" && !options.cantrip) pending.push("法師戲法");
    }
    if (key === "gnome") {
      if (!RACE_OPTION_DEFINITIONS.gnome.lineage.includes(options.lineage)) pending.push("侏儒血統");
    }
    if (key === "goliath") {
      if (!RACE_OPTION_DEFINITIONS.goliath.ancestry.includes(options.ancestry)) pending.push("巨人血統恩賜");
    }
    if (key === "human") {
      if (!RACE_OPTION_DEFINITIONS.human.size.includes(options.size)) pending.push("體型");
      if (!SKILL_OPTIONS.includes(options.skill)) pending.push("技能熟練");
      if (!humanOriginFeatValues().includes(options.feat)) pending.push("起源專長");
      if ((target.acquisitions.feats || []).some(item => item.sourceType === "background" && item.name === options.feat)) pending.push("起源專長已由背景取得");
      const featOptions = isPlainObject(options.featOptions) ? options.featOptions : {};
      if (options.feat === "魔法學徒") {
        const blockedSpellClass = HUMAN_MAGIC_INITIATE_BLOCKED_CLASS_BY_BACKGROUND[target.choices.background];
        if (!MAGIC_INITIATE_SPELL_CLASSES.has(featOptions.spellClass) || featOptions.spellClass === blockedSpellClass) pending.push("魔法學徒職業法術表");
        if (!Array.isArray(featOptions.cantrips) || featOptions.cantrips.length !== 2 || featOptions.cantrips.some(name => !name) || new Set(featOptions.cantrips).size !== 2) pending.push("魔法學徒的 2 個不同戲法");
        if (!Array.isArray(featOptions.levelOneSpells) || featOptions.levelOneSpells.length !== 1 || !featOptions.levelOneSpells[0]) pending.push("魔法學徒的 1 個一環法術");
      }
      if (options.feat === "熟習") {
        const proficiencies = Array.isArray(featOptions.proficiencies) ? featOptions.proficiencies : [];
        if (proficiencies.length !== 3 || proficiencies.some(value => !value) || new Set(proficiencies).size !== 3) pending.push("熟習的 3 項不同技能或工具");
      }
    }
    if (key === "tiefling") {
      if (!RACE_OPTION_DEFINITIONS.tiefling.size.includes(options.size)) pending.push("體型");
      if (!RACE_OPTION_DEFINITIONS.tiefling.legacy.includes(options.legacy)) pending.push("邪魔遺贈");
    }
    return pending;
  }

  function raceComplete() {
    return racePendingChoices().filter(item => !item.includes("後續步驟選擇")).length === 0;
  }

  function spellSource() {
    return draft.choices.background === "acolyte" ? "cleric" : "wizard";
  }

  function spellOptions(level) { return SpellCatalog.getSpells(spellSource(), level, spellMode()); }

  function selectedSpell(name, level) {
    return spellOptions(level).find(spell => spell.spellId === name) || null;
  }

  function ensureStyles() {
    if (document.getElementById("quick-build-wizard-styles")) return;
    const style = document.createElement("style");
    style.id = "quick-build-wizard-styles";
    style.textContent = `
      #quick-build-wizard{position:fixed;inset:0;z-index:10020;display:none;align-items:center;justify-content:center;width:100%;max-width:none;padding:16px;overflow:hidden;overscroll-behavior:contain;background:var(--qb-overlay)}
      #quick-build-wizard.open{display:flex}
      #quick-build-pact-tome{position:fixed;inset:0;z-index:10020;display:none;align-items:center;justify-content:center;width:100%;max-width:none;padding:16px;overflow:hidden;overscroll-behavior:contain;background:var(--qb-overlay)}
      #quick-build-pact-tome.open{display:flex}
      #quick-build-pact-tome .quick-build-pact-tome-shell{display:flex;flex-direction:column;width:680px;max-width:100%;max-height:calc(100dvh - 32px);overflow:hidden;border:1px solid var(--qb-border-strong);border-radius:16px;background:var(--qb-surface);color:var(--qb-text);box-shadow:var(--qb-shadow)}
      #quick-build-pact-tome .quick-build-header{display:flex;flex:0 0 auto;gap:16px;align-items:flex-start;justify-content:space-between;padding:20px;border-bottom:1px solid var(--qb-border)}
      #quick-build-pact-tome .quick-build-header h2{margin:0;color:var(--qb-text);font-size:1.35rem}#quick-build-pact-tome .quick-build-close{display:grid;flex:0 0 40px;place-items:center;width:40px;min-width:40px;height:40px;min-height:40px;margin:0;padding:0;border:0;border-radius:8px;background:transparent;color:var(--qb-text);font-size:1.25rem;cursor:pointer}
      #quick-build-pact-tome .quick-build-pact-tome-body{padding:20px;overflow-x:hidden;overflow-y:auto}#quick-build-pact-tome .quick-build-pact-tome-body h3{margin:0 0 8px;color:var(--qb-text)}
      #quick-build-pact-tome .quick-build-pact-tome-actions{display:flex;justify-content:flex-end;gap:12px;padding:16px 20px;border-top:1px solid var(--qb-border)}#quick-build-pact-tome .quick-build-pact-tome-actions button{min-height:42px;padding:8px 16px;border:1px solid var(--qb-border-strong);border-radius:8px;background:var(--qb-surface-elevated);color:var(--qb-text);cursor:pointer}#quick-build-pact-tome .quick-build-pact-tome-actions button.primary{border-color:var(--qb-accent);background:var(--qb-accent-hover);color:#fff}#quick-build-pact-tome .quick-build-pact-tome-actions button:disabled{cursor:not-allowed;opacity:.55}
      #quick-build-wizard .quick-build-shell{display:flex;flex-direction:column;width:780px;max-width:100%;max-height:calc(100dvh - 32px);overflow:hidden;border:1px solid var(--qb-border-strong);border-radius:16px;background:var(--qb-surface);color:var(--qb-text);box-shadow:var(--qb-shadow)}
      #quick-build-wizard .quick-build-header{display:flex;flex:0 0 auto;gap:16px;align-items:flex-start;justify-content:space-between;min-width:0;padding:20px 20px 12px;border-bottom:1px solid var(--qb-border)}
      #quick-build-wizard .quick-build-header>div{flex:1 1 auto;min-width:0}#quick-build-wizard .quick-build-title-row{display:flex;flex-wrap:nowrap;align-items:center;gap:8px}#quick-build-wizard .quick-build-header h2{margin:0;color:var(--qb-text);font-size:1.35rem;line-height:1.3}#quick-build-wizard .quick-build-reset{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;width:auto;min-width:0;min-height:24px;margin:0;padding:3px 8px;border:1px solid var(--qb-border-strong);border-radius:999px;background:var(--qb-surface-soft);color:var(--qb-text-muted);font-size:.72rem;font-weight:700;line-height:1;white-space:nowrap;cursor:pointer}#quick-build-wizard .quick-build-reset:hover,#quick-build-wizard .quick-build-reset:focus-visible{border-color:var(--qb-danger);color:var(--qb-danger-text);outline:2px solid transparent}
      #quick-build-wizard .quick-build-progress{margin:5px 0 0;color:var(--qb-text-muted);font-size:.9rem;line-height:1.45}
      #quick-build-wizard button.quick-build-close{display:grid;flex:0 0 40px;place-items:center;width:40px;min-width:40px;height:40px;min-height:40px;margin:0;padding:0;border:0;border-radius:8px;background:transparent;color:var(--qb-text);font-size:1.25rem;line-height:1;box-shadow:none;cursor:pointer}
      #quick-build-wizard .quick-build-body{min-height:250px;padding:24px 20px;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain}#quick-build-wizard .quick-build-body h3{margin:0 0 8px;color:var(--qb-text)}
      #quick-build-wizard .quick-build-lead{margin:0 0 18px;color:var(--qb-text-muted)}.quick-build-background-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.quick-build-class-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.quick-build-background-grid.is-choice-collapsed,.quick-build-class-grid.is-choice-collapsed{grid-template-columns:1fr}
      #quick-build-wizard .quick-build-card{width:100%;min-height:0;padding:16px;border:1px solid var(--qb-border);border-radius:12px;background:var(--qb-surface-elevated);color:var(--qb-text);text-align:left;cursor:pointer;transition:border-color .18s ease,background-color .18s ease,box-shadow .18s ease,opacity .18s ease}
      #quick-build-wizard .quick-build-card:hover,#quick-build-wizard .quick-build-card:focus-visible{border-color:var(--qb-accent);background:var(--qb-accent-soft);outline:2px solid transparent}.quick-build-card h4{margin:0 0 10px;font-size:1.12rem;color:var(--qb-accent-text)}
      .quick-build-summary{display:grid;grid-template-columns:auto 1fr;gap:6px 10px;margin:0;font-size:.9rem;line-height:1.45}.quick-build-summary dt{color:var(--qb-text-muted)}.quick-build-summary dd{margin:0;color:var(--qb-text-body)}.quick-build-expansion-tag{display:inline-flex;align-items:center;min-height:24px;margin-left:8px;padding:2px 8px;border:1px solid var(--qb-border-strong);border-radius:999px;color:var(--qb-text-muted);font-size:.7rem;vertical-align:middle}.quick-build-card-toggle-hint{display:block;margin-top:12px;color:var(--qb-accent-text);font-size:.78rem;font-weight:700}
      .quick-build-choice-panel{padding:18px;border:1px solid var(--qb-border);border-radius:12px;background:var(--qb-surface-soft)}.quick-build-review-panel+ .quick-build-review-panel{margin-top:14px}.quick-build-review-panel>h4{margin:0 0 14px;color:var(--qb-text)}.quick-build-equipment-list{margin:12px 0 20px;padding:14px;border-radius:8px;background:var(--qb-surface-muted);line-height:1.7;color:var(--qb-text-body)}
      .quick-build-race-options{display:grid;gap:16px}.quick-build-option-note{margin:6px 0 0;color:var(--qb-text-muted);font-size:.9rem}.quick-build-ancestry-detail{margin:0;padding:14px;border:1px solid var(--qb-border);border-radius:9px;background:var(--qb-surface-muted);color:var(--qb-text-body);line-height:1.65}.quick-build-ancestry-detail strong{display:block;margin-bottom:5px;color:var(--qb-accent-text)}.quick-build-warning{margin:14px 0;padding:12px;border-left:4px solid var(--qb-warning-border);border-radius:7px;background:var(--qb-warning-bg);color:var(--qb-warning-text)}.quick-build-pending{margin-top:14px;padding:12px;border-radius:7px;background:var(--qb-pending-bg);color:var(--qb-pending-text)}
      .quick-build-choice-actions{display:grid;grid-template-columns:1fr 1fr;gap:12px}.quick-build-choice-actions button{min-height:48px;padding:10px;border:1px solid var(--qb-border-strong);border-radius:8px;background:var(--qb-surface-elevated);color:var(--qb-text);cursor:pointer}.quick-build-choice-actions button.primary{border-color:var(--qb-accent);background:var(--qb-accent-hover);color:#fff}.quick-build-choice-actions .quick-build-choice-action-full{grid-column:1/-1}
      .quick-build-spell-layout{display:grid;gap:16px}
      .quick-build-spell-fields{display:flex;flex-direction:column;gap:14px}.quick-build-field label{display:block;margin-bottom:6px;color:var(--qb-text-muted)}.quick-build-field-control{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.quick-build-field select{width:100%;min-height:44px;padding:8px;border:1px solid var(--qb-border-strong);border-radius:7px;background:var(--qb-input);color:var(--qb-text)}.quick-build-spell-view{min-width:64px;margin:0;padding:8px 12px;border:1px solid var(--qb-border-strong);border-radius:7px;background:var(--qb-surface-elevated);color:var(--qb-text);cursor:pointer}.quick-build-spell-view:disabled{color:var(--qb-disabled-text);cursor:not-allowed;opacity:.65}
      #quick-build-wizard option.quick-build-known-option{color:var(--qb-text-muted)}
      #quick-build-spell-detail{position:fixed;inset:0;z-index:10030;display:none;align-items:center;justify-content:center;width:100%;max-width:none;padding:32px;overflow:hidden;overscroll-behavior:contain;background:var(--qb-overlay-nested)}
      #quick-build-spell-detail.open{display:flex}#quick-build-spell-detail .quick-build-spell-detail-shell{display:flex;flex-direction:column;width:680px;max-width:calc(100% - 32px);max-height:calc(100dvh - 80px);overflow:hidden;border:1px solid var(--qb-border-strong);border-radius:14px;background:var(--qb-surface);color:var(--qb-text);box-shadow:var(--qb-shadow)}
      #quick-build-spell-detail .quick-build-spell-detail-header{display:flex;flex:0 0 auto;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px;border-bottom:1px solid var(--qb-border)}#quick-build-spell-detail-title{margin:0;color:var(--qb-text);font-size:1.2rem}
      #quick-build-spell-detail .quick-build-spell-detail-close{display:grid;flex:0 0 44px;place-items:center;width:44px;min-width:44px;height:44px;min-height:44px;margin:0;padding:0;border:1px solid transparent;border-radius:9px;background:var(--qb-surface-elevated);color:var(--qb-text);font-size:1.5rem;line-height:1;cursor:pointer;touch-action:manipulation}#quick-build-spell-detail .quick-build-spell-detail-close:hover,#quick-build-spell-detail .quick-build-spell-detail-close:focus-visible{border-color:var(--qb-accent);background:var(--qb-accent-soft);outline:2px solid transparent}
      #quick-build-spell-detail-content{min-height:120px;padding:20px;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;white-space:pre-wrap;color:var(--qb-text-body);line-height:1.65}#quick-build-spell-detail-content strong{display:block;margin-bottom:12px;color:var(--qb-accent-text);font-size:1.08rem}.quick-build-expansion-notice{margin-top:12px;padding-top:8px;border-top:1px solid var(--qb-border);color:var(--qb-text-muted);font-size:.78rem;line-height:1.45}
      .quick-build-ability-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:0 0 16px}.quick-build-ability-heading h3{margin:0!important}.quick-build-ability-status{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}.quick-build-status-pill{padding:6px 10px;border:1px solid var(--qb-border);border-radius:999px;background:var(--qb-surface-soft);color:var(--qb-text-muted);font-size:.82rem;line-height:1.2}.quick-build-status-pill strong{color:var(--qb-text)}.quick-build-status-pill.is-complete{border-color:var(--qb-success-border);background:var(--qb-success-bg);color:var(--qb-success-text)}.quick-build-ability-grid{display:grid;gap:12px;padding:14px}.quick-build-ability-row{display:grid;grid-template-columns:minmax(92px,.7fr) minmax(0,2fr) minmax(74px,.55fr);gap:16px;align-items:center;padding:14px 16px;border:1px solid var(--qb-border);border-radius:10px;background:var(--qb-surface-muted)}.quick-build-ability-name{display:flex;flex-direction:column;gap:3px}.quick-build-ability-name strong{font-size:1.05rem;color:var(--qb-text)}.quick-build-ability-name small{color:var(--qb-text-muted);font-size:.76rem}.quick-build-ability-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.quick-build-ability-field{display:grid;gap:6px;min-width:0;color:var(--qb-text-muted);font-size:.82rem}.quick-build-ability-field select{width:100%;min-width:0;min-height:44px;margin:0;padding:8px 34px 8px 12px;border:1px solid var(--qb-border-strong);border-radius:8px;background:var(--qb-input);color:var(--qb-text);font:inherit;font-size:1rem}.quick-build-ability-field select:focus-visible{border-color:var(--qb-accent);outline:2px solid var(--qb-accent);outline-offset:1px}.quick-build-ability-field select:disabled{border-color:var(--qb-border);background:var(--qb-disabled);color:var(--qb-disabled-text);opacity:1}.quick-build-ability-total{display:grid;gap:2px;justify-items:end}.quick-build-ability-total span{color:var(--qb-text-muted);font-size:.75rem}.quick-build-ability-total strong{color:var(--qb-accent-text);font-size:1.45rem;line-height:1}.quick-build-ability-help{display:flex;flex-wrap:wrap;gap:6px 16px;margin:0 0 18px;color:var(--qb-text-muted);font-size:.88rem}.quick-build-ability-help strong{color:var(--qb-text-body)}.quick-build-complete{padding:18px;border-left:4px solid var(--qb-success-border);border-radius:8px;background:var(--qb-success-bg);color:var(--qb-success-text)}.quick-build-plan{margin:20px 0 0;padding-left:1.4rem;line-height:1.8;color:var(--qb-text-body)}.quick-build-plan li.current{color:var(--qb-accent-text);font-weight:700}
      .quick-build-ability-table-head,.quick-build-ability-row{display:grid;grid-template-columns:72px minmax(0,1fr) minmax(0,1fr) 48px;align-items:center;gap:6px}.quick-build-ability-table-head{padding:4px 10px;color:var(--qb-text-muted);font-size:.8rem;font-weight:700;text-align:center}.quick-build-ability-table-head span:first-child{text-align:left}.quick-build-ability-grid{gap:6px}.quick-build-ability-row{padding:8px 10px;background:var(--qb-surface-elevated)}.quick-build-ability-row.is-bonus-locked{background:var(--qb-surface-muted)}.quick-build-ability-control{display:flex;align-items:center;justify-content:center;gap:6px}.quick-build-ability-step{display:inline-flex;align-items:center;justify-content:center;width:34px;min-width:34px;height:34px;min-height:34px;margin:0;padding:0;border:1px solid var(--qb-border-strong);border-radius:999px;background:var(--qb-surface-elevated);color:var(--qb-text);font-size:1rem;font-weight:900;line-height:1;cursor:pointer}.quick-build-ability-step:disabled{cursor:not-allowed;opacity:.4}.quick-build-ability-value{min-width:28px;color:var(--qb-text);font-weight:700;text-align:center}.quick-build-ability-value.is-bonus{color:var(--qb-accent-text)}.quick-build-ability-total{display:block;text-align:center}.quick-build-ability-total strong{font-size:1.15rem}
      .quick-build-class-card{min-height:128px!important}.quick-build-class-card p{margin:0;color:var(--qb-text-body);line-height:1.55}.quick-build-substep-actions{display:flex;justify-content:space-between;gap:12px;margin-top:18px}.quick-build-substep-actions button{min-height:46px;padding:9px 16px;border:1px solid var(--qb-border-strong);border-radius:8px;background:var(--qb-surface-elevated);color:var(--qb-text);cursor:pointer}.quick-build-substep-actions button.primary{border-color:var(--qb-accent);background:var(--qb-accent-hover);color:#fff}.quick-build-substep-actions button:disabled{cursor:not-allowed;opacity:.55}.quick-build-proficiency-grid{display:grid;gap:14px}.quick-build-fixed-list{margin:12px 0 0;padding:12px;border-radius:8px;background:var(--qb-surface-muted);color:var(--qb-text-body);line-height:1.6}.quick-build-summary-list{display:grid;grid-template-columns:auto 1fr;gap:8px 14px;margin:0}.quick-build-summary-list dt{color:var(--qb-text-muted)}.quick-build-summary-list dd{margin:0;color:var(--qb-text)}.quick-build-ability-summary{display:grid;gap:6px}.quick-build-ability-summary-row{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:baseline}.quick-build-ability-summary-row>span{white-space:nowrap}.quick-build-ability-summary.wrap-all .quick-build-ability-summary-row{display:grid;grid-template-columns:1fr;gap:2px}.quick-build-ability-summary.wrap-all .quick-build-ability-modifier{padding-inline-start:1em}.quick-build-ability-modifier{font-weight:800;color:var(--qb-accent-text)}.quick-build-ability-modifier-sign{color:var(--qb-warning-text)}.quick-build-ability-modifier-value{color:var(--qb-accent)}.quick-build-complete .quick-build-summary-list dt,.quick-build-complete .quick-build-summary-list dd{color:var(--qb-success-text)}.quick-build-source-warning{margin-top:10px;color:var(--qb-warning-text);font-size:.9rem}
      #quick-build-wizard .quick-build-body.is-review{background:var(--qb-success-bg)}
      #quick-build-wizard .quick-build-flow-section{padding:0 0 24px}#quick-build-wizard .quick-build-flow-section.is-newly-revealed{animation:quick-build-flow-in .34s cubic-bezier(.22,1,.36,1) both}#quick-build-wizard .quick-build-flow-section+ .quick-build-flow-section{padding-top:24px;border-top:1px solid var(--qb-border)}
      #quick-build-wizard .quick-build-card.is-selected{border-color:var(--qb-accent);background:var(--qb-accent-soft);box-shadow:inset 0 0 0 2px var(--qb-accent),0 2px 6px color-mix(in srgb,var(--qb-accent) 16%,transparent)}#quick-build-wizard .quick-build-card.is-choice-hidden{display:none}
      #quick-build-wizard .quick-build-duplicate-warning{border-left-color:var(--qb-danger);background:color-mix(in srgb,var(--qb-danger) 14%,var(--qb-surface));color:var(--qb-danger-text)}
      #quick-build-wizard .quick-build-footer{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));flex:0 0 auto;align-items:center;gap:12px;padding:16px 20px;border-top:1px solid var(--qb-border)}#quick-build-wizard .quick-build-footer[hidden]{display:none}
      #quick-build-wizard .quick-build-footer button{width:100%;min-width:0;min-height:50px;padding:10px clamp(10px,2vw,20px);border:1px solid var(--qb-border-strong);border-radius:8px;background:var(--qb-surface-elevated);color:var(--qb-text);font-size:clamp(.95rem,2.4vw,1.05rem);font-weight:700;cursor:pointer;transition:border-color .18s ease,background-color .18s ease,color .18s ease,box-shadow .18s ease,transform .18s ease}#quick-build-wizard .quick-build-footer button.primary{border-color:var(--qb-accent);background:var(--qb-accent-hover);color:#fff;box-shadow:0 0 0 3px var(--qb-accent-soft)}#quick-build-wizard .quick-build-footer button.is-ready{animation:quick-build-next-ready .52s cubic-bezier(.22,1,.36,1)}#quick-build-wizard .quick-build-footer button:disabled{cursor:not-allowed;opacity:.55;box-shadow:none}
      #quick-build-wizard .quick-build-previous{grid-column:1}#quick-build-wizard .quick-build-modify{grid-column:2;border-color:var(--qb-accent);color:var(--qb-accent-text);font-weight:800}#quick-build-wizard .quick-build-next{grid-column:3}
      .quick-build-summary-list .quick-build-summary-full-label{grid-column:1/-1}.quick-build-summary-list .quick-build-summary-full-value{grid-column:1/-1;padding-inline-start:1em;text-align:left}
      #quick-build-wizard .quick-build-equipment-actions button.is-selected{border-color:var(--qb-accent);background:var(--qb-accent-hover);color:#fff;box-shadow:inset 0 0 0 1px var(--qb-accent)}
      @keyframes quick-build-flow-in{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:translateY(0)}}@keyframes quick-build-next-ready{0%{transform:scale(.96);box-shadow:0 0 0 0 var(--qb-accent-soft)}55%{transform:scale(1.04);box-shadow:0 0 0 7px var(--qb-accent-soft)}100%{transform:scale(1);box-shadow:0 0 0 3px var(--qb-accent-soft)}}
      @media(max-width:760px){.quick-build-class-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:620px){.quick-build-ability-grid{padding:8px}.quick-build-ability-table-head,.quick-build-ability-row{grid-template-columns:58px minmax(88px,1fr) minmax(88px,1fr) 36px;gap:2px;padding-right:5px;padding-left:5px}.quick-build-ability-step{width:30px;min-width:30px;height:30px;min-height:30px}.quick-build-ability-control{gap:2px}.quick-build-ability-value{min-width:22px}#quick-build-wizard .quick-build-body{padding:20px 16px}.quick-build-ability-heading{display:grid;gap:12px}.quick-build-ability-status{justify-content:flex-start}.quick-build-background-grid,.quick-build-class-grid{grid-template-columns:1fr}.quick-build-choice-actions{grid-template-columns:1fr}.quick-build-substep-actions:not(.quick-build-inline-actions){display:grid;grid-template-columns:1fr}.quick-build-substep-actions button{width:100%}.quick-build-inline-actions button{flex:1 1 0;width:auto;min-width:0}#quick-build-wizard .quick-build-footer{gap:8px;padding:12px}#quick-build-wizard .quick-build-footer button{min-height:48px;padding-right:8px;padding-left:8px}#quick-build-spell-detail{padding:16px}#quick-build-spell-detail .quick-build-spell-detail-shell{max-width:100%;max-height:calc(100dvh - 32px)}#quick-build-spell-detail-content{padding:18px 16px}}
      @media(max-width:380px){#quick-build-wizard{padding:8px}#quick-build-wizard .quick-build-shell{max-height:calc(100dvh - 16px)}#quick-build-wizard .quick-build-header{padding:14px 12px 10px}#quick-build-wizard .quick-build-body{padding:16px 10px}.quick-build-choice-panel.quick-build-ability-grid{padding:4px}.quick-build-ability-table-head,.quick-build-ability-row{grid-template-columns:44px minmax(70px,1fr) minmax(70px,1fr) 30px;gap:2px;padding:5px 4px}.quick-build-ability-step{width:26px;min-width:26px;height:28px;min-height:28px;font-size:.88rem}.quick-build-ability-value{min-width:18px;font-size:.9rem}.quick-build-ability-name strong{font-size:.92rem}.quick-build-ability-name small{font-size:.65rem}.quick-build-ability-table-head{font-size:.72rem}#quick-build-wizard .quick-build-footer{gap:6px;padding:10px 8px}#quick-build-wizard .quick-build-footer button{padding-right:4px;padding-left:4px;font-size:.9rem}}
      @media(prefers-reduced-motion:reduce){#quick-build-wizard .quick-build-flow-section.is-newly-revealed,#quick-build-wizard .quick-build-footer button.is-ready{animation:none}#quick-build-wizard .quick-build-footer button{transition:none}}
    `;
    document.head.appendChild(style);
  }

  function ensureWizard() {
    let modal = document.getElementById("quick-build-wizard");
    if (modal) return modal;
    ensureStyles();
    modal = document.createElement("div");
    modal.id = "quick-build-wizard";
    modal.inert = true;
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <section class="quick-build-shell" role="dialog" aria-modal="true" aria-labelledby="quick-build-title">
        <header class="quick-build-header"><div><div class="quick-build-title-row"><h2 id="quick-build-title">創角小幫手</h2><button type="button" class="quick-build-reset" aria-label="重置小幫手">重置</button></div><p class="quick-build-progress" aria-live="polite"></p></div><button type="button" class="quick-build-close" aria-label="關閉創角小幫手">✕</button></header>
        <main class="quick-build-body"></main>
        <footer class="quick-build-footer"><button type="button" class="quick-build-previous">上一步</button><button type="button" class="quick-build-modify" hidden>↑修改↑</button><button type="button" class="quick-build-next">下一步</button></footer>
      </section>`;
    document.body.appendChild(modal);
    modal.querySelector(".quick-build-reset").addEventListener("click", discardDraft);
    modal.querySelector(".quick-build-close").addEventListener("click", closeWizard);
    modal.querySelector(".quick-build-previous").addEventListener("click", goPreviousStep);
    modal.querySelector(".quick-build-modify").addEventListener("click", editCurrentStep);
    modal.querySelector(".quick-build-next").addEventListener("click", goNextStep);
    modal.addEventListener("click", event => { if (event.target === modal) closeWizard(); });
    modal.addEventListener("keydown", trapWizardKeyboard);
    window.addEventListener("resize", () => syncAbilitySummaryWrapping(modal));
    return modal;
  }

  function ensureSpellDetailModal() {
    ensureStyles();
    let modal = document.getElementById("quick-build-spell-detail");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "quick-build-spell-detail";
    modal.inert = true;
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <section class="quick-build-spell-detail-shell" role="dialog" aria-modal="true" aria-labelledby="quick-build-spell-detail-title" aria-describedby="quick-build-spell-detail-content">
        <header class="quick-build-spell-detail-header"><h2 id="quick-build-spell-detail-title">法術詳情</h2><button type="button" class="quick-build-spell-detail-close" aria-label="關閉法術詳情">×</button></header>
        <div id="quick-build-spell-detail-content" tabindex="0"></div>
      </section>`;
    document.body.appendChild(modal);
    modal.querySelector(".quick-build-spell-detail-close").addEventListener("click", closeSpellDetail);
    modal.addEventListener("click", event => { if (event.target === modal) closeSpellDetail(); });
    modal.addEventListener("keydown", trapSpellDetailKeyboard);
    return modal;
  }

  function renderBackgroundCards(body) {
    body.innerHTML = `<h3>選擇背景</h3><p class="quick-build-lead">背景是玩家角色成為冒險者之前的身分</p><div class="quick-build-background-grid">${BACKGROUND_ORDER.map(key => {
      const data = backgroundData(key) || {};
      const tool = key === "soldier" ? "賭具" : plainText(data.工具熟練);
      return `<button type="button" class="quick-build-card" data-background="${key}"><h4>${BACKGROUND_LABELS[key]}${data.擴充 ? '<span class="quick-build-expansion-tag">擴充</span>' : ""}</h4><dl class="quick-build-summary"><dt>技能熟練</dt><dd>${escapeHtml(plainText(data.技能熟練))}</dd><dt>起源專長</dt><dd>${escapeHtml(data.專長)}</dd><dt>工具</dt><dd>${escapeHtml(tool)}</dd><dt>可調整屬性</dt><dd>${escapeHtml(data.屬性)}</dd></dl></button>`;
    }).join("")}</div>`;
    body.querySelectorAll("[data-background]").forEach(card => card.addEventListener("click", () => handleChoiceCardSelection("background", card.dataset.background, chooseBackground)));
  }

  function renderBackgroundEquipment(body) {
    const key = draft.choices.background;
    const data = backgroundData(key) || {};
    body.innerHTML = `<h3>${BACKGROUND_LABELS[key]}：背景裝備</h3><p class="quick-build-lead">是否取得背景提供的預設裝備？若選否，改為獲得 50 金幣。</p><section class="quick-build-choice-panel"><strong>預設裝備 A</strong><div class="quick-build-equipment-list">${escapeHtml(data.裝備A)}</div><div class="quick-build-choice-actions quick-build-equipment-actions"><button type="button" data-wealth="default">取得預設裝備</button><button type="button" data-wealth="gold">否，取得 50 金幣</button></div></section>`;
    body.querySelectorAll("[data-wealth]").forEach(button => button.addEventListener("click", () => chooseBackgroundWealth(button.dataset.wealth)));
  }

  function renderBackgroundToolChoice(body) {
    const selected = draft.choices.backgroundToolChoice || "";
    body.innerHTML = `<h3>士兵：熟練賭具選擇</h3><p class="quick-build-lead">選擇士兵背景提供的賭具熟練項。</p><section class="quick-build-choice-panel"><div class="quick-build-field"><label for="quick-build-background-game-tool">熟練賭具</label><select id="quick-build-background-game-tool"><option value="">請選擇</option>${GAME_TOOL_OPTIONS.map(name => `<option value="${escapeHtml(name)}"${name === selected ? " selected" : ""}>${escapeHtml(name)}</option>`).join("")}</select></div></section>`;
    body.querySelector("#quick-build-background-game-tool").addEventListener("change", chooseBackgroundTool);
  }

  function spellSelect(id, label, entries, value, excluded = "") {
    return `<div class="quick-build-field"><label for="${id}">${label}</label><div class="quick-build-field-control"><select id="${id}" data-spell-field><option value="">請選擇</option>${entries.map(spell => {
      const spellId = spell.spellId;
       const peerDuplicate = spellId === excluded && spellId !== value;
       const sourceType = id.startsWith("quick-build-human-") ? "race" : "background";
       const sources = duplicateSourceLabels("spells", spellId, sourceType);
       return `<option value="${escapeHtml(spellId)}"${spellId === value ? " selected" : ""}${peerDuplicate ? " disabled" : ""}${sources.length && !peerDuplicate ? ' class="quick-build-known-option"' : ""}>${escapeHtml(spell.nameZh)}${peerDuplicate ? "（本頁已選）" : sources.length ? `（${escapeHtml(sources.join("、"))}已學會）` : ""}</option>`;
    }).join("")}</select><button type="button" class="quick-build-spell-view" data-spell-view="${id}"${value ? "" : " disabled"}>查看</button></div></div>`;
  }

  function renderBackgroundSpells(body) {
    const magic = draft.choices.backgroundMagic;
    const cantrips = spellOptions("cantrips");
    const levelOne = spellOptions("1");
    body.innerHTML = `<h3>${BACKGROUND_LABELS[draft.choices.background]}：選擇法術</h3><p class="quick-build-lead">選擇2個不同的戲法與1個一環法術；按「查看」可在法術詳情視窗中閱讀完整敘述。</p><div class="quick-build-spell-layout"><div class="quick-build-spell-fields">${spellSelect("quick-build-cantrip-1", "戲法 1", cantrips, magic.cantrips[0], magic.cantrips[1])}${spellSelect("quick-build-cantrip-2", "戲法 2", cantrips, magic.cantrips[1], magic.cantrips[0])}${spellSelect("quick-build-level-one", "一環法術", levelOne, magic.levelOneSpells[0])}</div></div>`;
    body.querySelectorAll("[data-spell-field]").forEach(select => {
      select.addEventListener("change", event => updateBackgroundSpells(event.currentTarget));
    });
    body.querySelectorAll("[data-spell-view]").forEach(button => {
      button.addEventListener("click", () => {
        const select = body.querySelector(`#${button.dataset.spellView}`);
        showSpellDescription(select, button);
      });
    });
    refreshBackgroundSpellControls(body);
  }

  function renderBackgroundComplete(body) {
    const data = backgroundData(draft.choices.background) || {};
    const spells = draft.choices.backgroundMagic.cantrips
      .concat(draft.choices.backgroundMagic.levelOneSpells)
      .filter(Boolean);
    const skills = displayList(data.技能熟練).split("、").filter(Boolean)
      .map(name => annotatedDuplicateName("skills", name, "background", "已熟練"));
    const toolName = draft.choices.background === "soldier" ? draft.choices.backgroundToolChoice : displayList(data.工具熟練);
    const tool = toolName ? annotatedDuplicateName("tools", toolName, "background", "已熟練") : "無";
    const annotatedSpells = spells.map(spellId => annotatedDuplicateName("spells", spellId, "background", "已學會"));
    const classBonusWarning = draft.choices.classOptions?.backgroundBonusInvalidated ? `<div class="quick-build-warning"><strong>改變背景需要重新設定屬性加值</strong><br>你的 27 點基礎屬性已保留，但背景加值已重設為 0/3；按下一步後會前往「職業：屬性與背景加值」重新分配。</div>` : "";
    body.innerHTML = `<h3>背景選擇完成</h3><div class="quick-build-complete"><strong>${BACKGROUND_LABELS[draft.choices.background]}</strong><br>技能：${skills.map(escapeHtml).join("、")}<br>起源專長：${escapeHtml(data.專長)}<br>工具：${escapeHtml(tool)}<br>可調整屬性：${escapeHtml(displayList(data.屬性))}${annotatedSpells.length ? `<br>法術：${annotatedSpells.map(escapeHtml).join("、")}` : ""}</div>${classBonusWarning}${duplicateReviewWarning()}`;
  }

  function raceSelect(field, label, values, { disabled = [], note = "" } = {}) {
    const selected = draft.choices.raceOptions[field] || "";
    const options = field === "skill" ? orderedSkillOptions(values) : values;
    return `<div class="quick-build-field"><label for="quick-build-race-${field}">${label}</label><select id="quick-build-race-${field}" data-race-option="${field}"><option value="">請選擇</option>${options.map(value => {
      const sources = field === "skill" ? duplicateSourceLabels("skills", value, "race") : [];
      return `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}${sources.length ? ' class="quick-build-known-option"' : ""}>${escapeHtml(raceOptionLabel(value))}${sources.length ? `（${escapeHtml(sources.join("、"))}已熟練）` : ""}</option>`;
    }).join("")}</select>${note ? `<p class="quick-build-option-note">${escapeHtml(note)}</p>` : ""}</div>`;
  }

  function raceSelectWithDetail(field, label, values, { showSpellView = false, formatOption = value => value } = {}) {
    const selected = draft.choices.raceOptions[field] || "";
    return `<div class="quick-build-field"><label for="quick-build-race-${field}">${label}</label><div class="quick-build-field-control"><select id="quick-build-race-${field}" data-race-option="${field}"><option value="">請選擇</option>${values.map(value => `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(raceOptionLabel(formatOption(value)))}</option>`).join("")}</select>${showSpellView ? `<button type="button" class="quick-build-spell-view" data-race-spell-view="${field}"${selected ? "" : " disabled"}>查看</button>` : ""}</div></div>`;
  }

  function raceFeatSelect(label, values, { disabled = [], note = "" } = {}) {
    const selected = draft.choices.raceOptions.feat || "";
    const options = values.map(value => isPlainObject(value) ? value : { value, label: value });
    return `<div class="quick-build-field"><label for="quick-build-race-feat">${label}</label><div class="quick-build-field-control"><select id="quick-build-race-feat" data-race-option="feat"><option value="">請選擇</option>${options.map(option => `<option value="${escapeHtml(option.value)}"${option.value === selected ? " selected" : ""}${disabled.includes(option.value) ? " disabled" : ""}>${escapeHtml(option.label)}${disabled.includes(option.value) ? "（已由其他來源取得）" : ""}</option>`).join("")}</select><button type="button" class="quick-build-spell-view" data-race-feat-view${selected ? "" : " disabled"}>查看</button></div>${note ? `<p class="quick-build-option-note">${escapeHtml(note)}</p>` : ""}</div>`;
  }

  function renderRaceCards(body) {
    body.innerHTML = `<h3>選擇種族</h3><p class="quick-build-lead">種族決定角色的外觀、體型、速度以及特殊能力。</p><div class="quick-build-background-grid">${RACE_ORDER.map(key => `<button type="button" class="quick-build-card" data-race="${key}"><h4>${RACE_LABELS[key]}</h4><p>${escapeHtml(RACE_CARD_DESCRIPTIONS[key])}</p></button>`).join("")}</div>`;
    body.querySelectorAll("[data-race]").forEach(card => card.addEventListener("click", () => handleChoiceCardSelection("race", card.dataset.race, chooseRace)));
  }

  function humanMagicSpellSelect(id, label, entries, value, excluded = "") {
    return spellSelect(id, label, entries, value, excluded).replace("data-spell-field", "data-human-magic-spell");
  }

  function renderHumanMagicFeatOptions() {
    const featOptions = isPlainObject(draft.choices.raceOptions.featOptions) ? draft.choices.raceOptions.featOptions : {};
    const spellClass = featOptions.spellClass || "";
    const blockedSpellClass = HUMAN_MAGIC_INITIATE_BLOCKED_CLASS_BY_BACKGROUND[draft.choices.background];
    const cantrips = MAGIC_INITIATE_SPELL_CLASSES.has(spellClass) ? SpellCatalog.getSpells(spellClass, "cantrips", spellMode()) : [];
    const levelOne = MAGIC_INITIATE_SPELL_CLASSES.has(spellClass) ? SpellCatalog.getSpells(spellClass, "1", spellMode()) : [];
    const selectedCantrips = Array.isArray(featOptions.cantrips) ? featOptions.cantrips : ["", ""];
    return `<section class="quick-build-choice-panel"><h4>魔法學徒選項</h4><p class="quick-build-option-note">按「查看」可在法術詳情視窗中閱讀完整敘述。</p><div class="quick-build-spell-fields"><div class="quick-build-field"><label for="quick-build-human-spell-class">--職業--</label><select id="quick-build-human-spell-class" data-human-spell-class><option value="">--職業--</option><option value="cleric"${spellClass === "cleric" ? " selected" : ""}${blockedSpellClass === "cleric" ? " disabled" : ""}>牧師</option><option value="druid"${spellClass === "druid" ? " selected" : ""}>德魯伊</option><option value="wizard"${spellClass === "wizard" ? " selected" : ""}${blockedSpellClass === "wizard" ? " disabled" : ""}>法師</option></select></div>${humanMagicSpellSelect("quick-build-human-cantrip-1", "戲法 1", cantrips, selectedCantrips[0], selectedCantrips[1])}${humanMagicSpellSelect("quick-build-human-cantrip-2", "戲法 2", cantrips, selectedCantrips[1], selectedCantrips[0])}${humanMagicSpellSelect("quick-build-human-level-one", "一環法術", levelOne, featOptions.levelOneSpells?.[0] || "")}</div></section>`;
  }

  function mixedProficiencySelect(index, selected, excluded, acquiredSkills, acquiredTools) {
    const options = [`<option value="">請選擇</option>`, `<option disabled>--------- 技能 ---------</option>`]
      .concat(SKILL_OPTIONS.map(name => {
        const value = `skill:${name}`;
        const peerDuplicate = excluded.includes(value);
        const sources = duplicateSourceLabels("skills", name, "race");
        if (acquiredSkills.has(name)) sources.push(RACE_LABELS[draft.choices.race] || "種族");
        return `<option value="skill:${escapeHtml(name)}"${selected === value ? " selected" : ""}${peerDuplicate ? " disabled" : ""}${sources.length && !peerDuplicate ? ' class="quick-build-known-option"' : ""}>技能：${escapeHtml(skillOptionLabel(name))}${peerDuplicate ? "（本頁已選）" : sources.length ? `（${escapeHtml(sources.join("、"))}已熟練）` : ""}</option>`;
      }))
      .concat(`<option disabled>--------- 工具 ---------</option>`)
      .concat(TOOL_OPTIONS.map(name => {
        const value = `tool:${name}`;
        const peerDuplicate = excluded.includes(value);
        const sources = duplicateSourceLabels("tools", name, "race");
        if (acquiredTools.has(name)) sources.push(RACE_LABELS[draft.choices.race] || "種族");
        return `<option value="tool:${escapeHtml(name)}"${selected === value ? " selected" : ""}${peerDuplicate ? " disabled" : ""}${sources.length && !peerDuplicate ? ' class="quick-build-known-option"' : ""}>工具：${escapeHtml(name)}${peerDuplicate ? "（本頁已選）" : sources.length ? `（${escapeHtml(sources.join("、"))}已熟練）` : ""}</option>`;
      }))
      .concat(`<option disabled>--------- 賭具與樂器 ---------</option>`)
      .concat(GAME_TOOL_OPTIONS.concat(INSTRUMENT_TOOL_OPTIONS).map(name => {
        const value = `tool:${name}`;
        const peerDuplicate = excluded.includes(value);
        const sources = duplicateSourceLabels("tools", name, "race");
        if (acquiredTools.has(name)) sources.push(RACE_LABELS[draft.choices.race] || "種族");
        return `<option value="tool:${escapeHtml(name)}"${selected === value ? " selected" : ""}${peerDuplicate ? " disabled" : ""}${sources.length && !peerDuplicate ? ' class="quick-build-known-option"' : ""}>工具：${escapeHtml(name)}${peerDuplicate ? "（本頁已選）" : sources.length ? `（${escapeHtml(sources.join("、"))}已熟練）` : ""}</option>`;
      }));
    return `<div class="quick-build-field"><label for="quick-build-human-skilled-${index}">熟習選項 ${index + 1}</label><select id="quick-build-human-skilled-${index}" data-human-skilled>${options.join("")}</select></div>`;
  }

  function renderHumanSkilledFeatOptions() {
    const featOptions = isPlainObject(draft.choices.raceOptions.featOptions) ? draft.choices.raceOptions.featOptions : {};
    const selected = Array.isArray(featOptions.proficiencies) ? featOptions.proficiencies.slice(0, 3) : [];
    while (selected.length < 3) selected.push("");
    const acquiredSkills = new Set((draft.acquisitions.skills || []).filter(item => item.source?.feature !== "靈活人才：熟習").map(item => item.name));
    const acquiredTools = new Set((draft.acquisitions.tools || []).filter(item => item.source?.feature !== "靈活人才：熟習").map(item => item.name));
    return `<section class="quick-build-choice-panel"><h4>熟習選項</h4><p class="quick-build-option-note">選擇 3 項不同的技能或工具；其他來源已熟練的項目仍可選擇。</p><div class="quick-build-race-options">${selected.map((value, index) => mixedProficiencySelect(index, value, selected.filter((_, other) => other !== index), acquiredSkills, acquiredTools)).join("")}</div></section>`;
  }

  function renderRaceOptions(body) {
    const key = draft.choices.race;
    const options = draft.choices.raceOptions;
    const backgroundSkills = (draft.acquisitions.skills || []).filter(item => item.sourceType === "background").map(item => item.name);
    const backgroundFeats = (draft.acquisitions.feats || []).filter(item => item.sourceType === "background").map(item => item.name);
    const originFeats = humanOriginFeatOptions();
    const fields = [];
    if (key === "dragonborn") fields.push(raceSelect("ancestry", "龍族血統", RACE_OPTION_DEFINITIONS.dragonborn.ancestry));
    if (key === "elf") {
      fields.push(raceSelect("lineage", "精靈傳承", RACE_OPTION_DEFINITIONS.elf.lineage));
      fields.push(raceSelect("skill", "敏銳感官技能熟練", RACE_OPTION_DEFINITIONS.elf.skill, { disabled: backgroundSkills, note: "其他來源已熟練的技能會標示來源，但仍可選擇。" }));
      if (options.lineage === "高等精靈血統") fields.push(raceSelectWithDetail("cantrip", "法師戲法", SpellCatalog.getSpells("wizard", "cantrips", spellMode()).map(spell => spell.spellId), { showSpellView: true, formatOption: spellNameZh }));
    }
    if (key === "gnome") {
      fields.push(raceSelect("lineage", "侏儒血統", RACE_OPTION_DEFINITIONS.gnome.lineage));
    }
    if (key === "goliath") fields.push(raceSelectWithDetail("ancestry", "巨人血統恩賜", RACE_OPTION_DEFINITIONS.goliath.ancestry));
    if (key === "human") {
      fields.push(raceSelect("size", "體型", RACE_OPTION_DEFINITIONS.human.size));
      fields.push(raceSelect("skill", "技藝嫻熟：技能熟練", SKILL_OPTIONS, { disabled: backgroundSkills, note: "其他來源已熟練的技能會標示來源，但仍可選擇。" }));
      fields.push(raceFeatSelect("靈活人才：起源專長", originFeats, { disabled: backgroundFeats, note: "已從背景取得的相同專長不可重複選擇。魔法學徒與熟習會繼續顯示專長選項。" }));
    }
    if (key === "tiefling") {
      fields.push(raceSelect("size", "體型", RACE_OPTION_DEFINITIONS.tiefling.size));
      fields.push(raceSelect("legacy", "邪魔遺贈", RACE_OPTION_DEFINITIONS.tiefling.legacy));
    }
    const humanFeatPanel = key === "human" && options.feat === "魔法學徒" ? renderHumanMagicFeatOptions() : key === "human" && options.feat === "熟習" ? renderHumanSkilledFeatOptions() : "";
    const goliathDetail = key === "goliath" && GOLIATH_ANCESTRY_DETAILS[options.ancestry]
      ? `<div class="quick-build-ancestry-detail"><strong>${escapeHtml(options.ancestry)}</strong>${escapeHtml(GOLIATH_ANCESTRY_DETAILS[options.ancestry])}</div>`
      : "";
    body.innerHTML = `<h3>${RACE_LABELS[key]}種族選項</h3><p class="quick-build-lead">請選擇下列種族細節</p><section class="quick-build-choice-panel quick-build-race-options">${fields.join("")}${goliathDetail}</section>${humanFeatPanel}`;
    body.querySelectorAll("[data-race-option]").forEach(select => select.addEventListener("change", updateRaceOption));
    body.querySelectorAll("[data-race-spell-view]").forEach(button => button.addEventListener("click", () => showRaceSpellDescription(button.dataset.raceSpellView, button)));
    body.querySelector("[data-race-feat-view]")?.addEventListener("click", event => showHumanFeatDescription(event.currentTarget));
    body.querySelector("[data-human-spell-class]")?.addEventListener("change", updateHumanMagicFeat);
    body.querySelectorAll("[data-human-magic-spell]").forEach(select => select.addEventListener("change", updateHumanMagicFeat));
    body.querySelectorAll("[data-spell-view]").forEach(button => button.addEventListener("click", () => showHumanFeatSpellDescription(button.dataset.spellView, button)));
    body.querySelectorAll("[data-human-skilled]").forEach(select => select.addEventListener("change", updateHumanSkilledFeat));
  }

  function elfSummarySpells(options) {
    if (options.lineage === "卓爾血統") return "舞光術、妖火（3 級）、黑暗術（5 級）";
    if (options.lineage === "高等精靈血統") return `${spellNameZh(options.cantrip)}、偵測魔法（3 級）、迷蹤步（5 級）`;
    return "德魯伊伎倆、大步奔行（3 級）、行動無蹤跡（5 級）";
  }

  function raceCompletionLines(key, options) {
    if (key === "dragonborn") {
      const choice = DRAGONBORN_SUMMARY[options.ancestry] || {};
      return ["體型：中型", "速度：30 呎", `血統：${choice.ancestry || ""}`, `吐息元素與抗性：${choice.damage || ""}`, "黑暗視覺 60 呎", "５級後可飛行 10 分鐘"];
    }
    if (key === "dwarf") return ["體型：中型", "速度：30 呎", "黑暗視覺 120 呎", "中毒豁免優勢", "毒素傷害減半", "每級 HP 上限 +1", "站石地上可感知震動"];
    if (key === "elf") return ["體型：中型", `速度：${options.lineage === "木精靈血統" ? "35" : "30"} 呎`, `血統：${String(options.lineage || "").replace("血統", "")}`, `黑暗視覺 ${options.lineage === "卓爾血統" ? "120" : "60"} 呎`, `種族法術：${elfSummarySpells(options)}`, "魅惑狀態豁免優勢", `技能熟練：${options.skill}`];
    if (key === "gnome") {
      const forest = options.lineage === "森林侏儒";
      return ["體型：小型", "速度：30 呎", `血統：${String(options.lineage || "").replace("侏儒", "")}侏儒`, "黑暗視覺 60 呎", "智感魅力屬性豁免優勢。", `種族法術：${forest ? "次級幻影（1 級）、動物交談（1 級）" : "修復術、魔法伎倆"}`];
    }
    if (key === "goliath") {
      const match = String(options.ancestry || "").match(/^(.+)（(.+)巨人）$/u);
      return ["體型：中型", "速度：35 呎", `血統：${match?.[2] || ""}巨人`, `異能：${match?.[1] || ""}`, "５級後可變大", "（速度 +10、力量檢定優勢）"];
    }
    if (key === "halfling") return ["體型：小型", "速度：30 呎", "恐慌狀態豁免優勢", "檢定出 1 時可重擲一次", "移動時可穿越比你大的生物", "可躲藏比你大的生物後方"];
    if (key === "human") {
      const featOptions = isPlainObject(options.featOptions) ? options.featOptions : {};
      const featName = options.feat === "魔法學徒" && MAGIC_INITIATE_SPELL_CLASSES.has(featOptions.spellClass)
        ? `魔法學徒（${CLASS_LABELS[featOptions.spellClass]}）`
        : humanOriginFeatLabel(options.feat || "");
      const lines = [`體型：${options.size || ""}`, "速度：30 呎", `技能：${options.skill || ""}`, "長休後獲得英雄激勵骰", `起始專長：${featName}`];
      if (options.feat === "魔法學徒") {
        lines.push("專長選項：");
        lines.push(`戲法：${(featOptions.cantrips || []).map(spellNameZh).filter(Boolean).join("、")}`);
        lines.push(`一環法術：${(featOptions.levelOneSpells || []).map(spellNameZh).filter(Boolean).join("、")}`);
      }
      if (options.feat === "熟習") {
        const groups = { skill: [], tool: [] };
        (featOptions.proficiencies || []).filter(Boolean).forEach(value => {
          const [type, name] = String(value).split(":");
          if (groups[type] && name) groups[type].push(name);
        });
        if (groups.skill.length) lines.push(`技能：${groups.skill.join("、")}`);
        if (groups.tool.length) lines.push(`工具：${groups.tool.join("、")}`);
      }
      return lines;
    }
    if (key === "orc") return ["體型：中型", "速度：30 呎", "黑暗視覺 120 呎", "戰鬥中可短暫加速和 +HP", "HP 被打至 0 可鎖血一次"];
    if (key === "tiefling") {
      const choice = TIEFLING_SUMMARY[options.legacy] || { spells: [] };
      return [`體型：${options.size || ""}`, "速度：30 呎", `血統：${choice.legacy || ""}`, `抗性：${choice.resistance || ""}`, "黑暗視覺：60 英呎", `種族法術：${choice.spells.join("、")}`];
    }
    return [];
  }

  function renderRaceComplete(body) {
    const key = draft.choices.race;
    const raceIdentities = [...new Map([
      ...(draft.acquisitions.skills || []).filter(item => item.sourceType === "race").map(item => ({ type: "skills", id: item.name, verb: "已熟練" })),
      ...(draft.acquisitions.tools || []).filter(item => item.sourceType === "race").map(item => ({ type: "tools", id: item.name, verb: "已熟練" })),
      ...(draft.acquisitions.spells || []).filter(item => item.sourceType === "race" && acquisitionAppliesAtLevel(item)).map(item => ({ type: "spells", id: item.spellId, verb: "已學會" }))
    ].map(item => [`${item.type}:${item.id}`, item])).values()];
    const completionLines = raceCompletionLines(key, draft.choices.raceOptions).map(line => raceIdentities.reduce((text, item) => {
      const name = item.type === "spells" ? spellNameZh(item.id) : item.id;
      return name ? text.replaceAll(name, annotatedDuplicateName(item.type, item.id, "race", item.verb)) : text;
    }, line));
    const pending = racePendingChoices().filter(item => item.includes("後續步驟選擇"));
    body.innerHTML = `<h3>種族選擇完成</h3><div class="quick-build-complete"><strong>${RACE_LABELS[key]}</strong>${completionLines.map(line => `<br>${escapeHtml(line)}`).join("")}</div>${duplicateReviewWarning()}${pending.length ? `<div class="quick-build-pending"><strong>尚未完成的後續必要選擇</strong><br>${pending.map(escapeHtml).join("、")}。</div>` : ""}`;
  }

  function classAbilitiesComplete(target = draft) {
    return ABILITY_ORDER.every(key => Number.isInteger(target.choices.abilities?.[key]) && target.choices.abilities[key] >= 8 && target.choices.abilities[key] <= 15) &&
      abilityPointCost(target.choices.abilities) === 27 && backgroundBonusTotal(target.choices.backgroundAbilityBonuses) === 3;
  }

  function classProficienciesComplete(target = draft) {
    const definition = CLASS_BUILD_DEFINITIONS[target.choices.class];
    const options = target.choices.classOptions || {};
    if (!definition) return false;
    const skills = Array.isArray(options.skills) ? options.skills.filter(Boolean) : [];
    const tools = Array.isArray(options.tools) ? options.tools.filter(Boolean) : [];
    return skills.length === definition.skillCount && new Set(skills).size === definition.skillCount &&
      tools.length === (definition.toolCount || 0) && new Set(tools).size === (definition.toolCount || 0);
  }

  function classComplete(target = draft) {
    const spellcastingComplete = !hasDraftSpellcasting(target) || Boolean(target.choices.spellcastingAbility);
    return Boolean(target.choices.class && classAbilitiesComplete(target) && spellcastingComplete &&
      classProficienciesComplete(target));
  }

  function renderClassCards(body) {
    body.innerHTML = `<h3>選擇職業</h3><p class="quick-build-lead">選擇角色的 1 級職業；裝備與其他 1 級必要選擇會在後續獨立步驟處理。</p><div class="quick-build-class-grid">${CLASS_ORDER.map(key => `<button type="button" class="quick-build-card quick-build-class-card" data-class-choice="${key}"><h4>${CLASS_LABELS[key]}</h4><p>${escapeHtml(CLASS_CARD_DESCRIPTIONS[key])}</p></button>`).join("")}</div>`;
    body.querySelectorAll("[data-class-choice]").forEach(card => card.addEventListener("click", () => handleChoiceCardSelection("class", card.dataset.classChoice, chooseClass)));
  }

  function renderClassType(body) {
    const key = draft.choices.class;
    const typeOptions = CLASS_TYPE_OPTIONS[key] || [];
    body.innerHTML = `<h3>${CLASS_LABELS[key]}：選擇職業類型</h3><p class="quick-build-lead">選擇此職業的快速建立方向；下一步會依職業類型與背景預填屬性。</p><div class="quick-build-class-grid">${typeOptions.map(option => `<button type="button" class="quick-build-card quick-build-class-card" data-class-type-choice="${option.id}"><h4>${escapeHtml(option.label)}</h4><p>${escapeHtml(option.description)}</p></button>`).join("")}</div>`;
    body.querySelectorAll("[data-class-type-choice]").forEach(card => card.addEventListener("click", () => chooseClassType(card.dataset.classTypeChoice)));
  }

  function renderClassAbilities(body) {
    const key = draft.choices.class;
    const allowedBonuses = new Set((draft.choices.backgroundAbilities || []).map(label => ABILITY_KEYS_BY_LABEL[label]));
    const spent = abilityPointCost(draft.choices.abilities);
    const bonusTotal = backgroundBonusTotal(draft.choices.backgroundAbilityBonuses);
    const backgroundBonusWarning = draft.choices.classOptions?.backgroundBonusInvalidated ? `<div class="quick-build-warning"><strong>改變背景需要重新設定屬性加值</strong><br>已保留你上次的 27 點基礎屬性；請重新分配背景加值 3 點後再確認。</div>` : "";
    body.innerHTML = `<div class="quick-build-ability-heading"><h3>${CLASS_LABELS[key]}${draft.choices.classOptions.classType ? `（${CLASS_TYPE_OPTIONS[key]?.find(option => option.id === draft.choices.classOptions.classType)?.label || ""}）` : ""}：屬性與背景加值</h3><div class="quick-build-ability-status"><span class="quick-build-status-pill${spent === 27 ? " is-complete" : ""}">購點 <strong>${spent}</strong> / 27</span><span class="quick-build-status-pill${bonusTotal === 3 ? " is-complete" : ""}">背景加值 <strong>${bonusTotal}</strong> / 3</span></div></div>${backgroundBonusWarning}<p class="quick-build-lead">使用 ▲／▼ 調整起始屬性與背景加值；起始屬性必須剛好分配 27 點，背景加值必須分配 3 點且單項最多 +2。</p><div class="quick-build-ability-help"><span>目前背景：<strong>${escapeHtml(BACKGROUND_LABELS[draft.choices.background] || "未選擇")}</strong></span><span>可加值：<strong>${escapeHtml((draft.choices.backgroundAbilities || []).join("、") || "無")}</strong></span></div><section class="quick-build-choice-panel quick-build-ability-grid"><div class="quick-build-ability-table-head"><span>屬性</span><span>基礎值</span><span>背景加值</span><span>總值</span></div>${ABILITY_ORDER.map(ability => {
      const bonusEnabled = allowedBonuses.has(ability);
      const baseValue = draft.choices.abilities[ability];
      const bonusValue = draft.choices.backgroundAbilityBonuses[ability] || 0;
      const nextBaseCost = POINT_BUY_COSTS[baseValue + 1];
      const canIncreaseBase = baseValue < 15 && spent - POINT_BUY_COSTS[baseValue] + nextBaseCost <= 27;
      const canIncreaseBonus = bonusEnabled && bonusValue < 2 && bonusTotal < 3;
      return `<div class="quick-build-ability-row${bonusEnabled ? "" : " is-bonus-locked"}"><div class="quick-build-ability-name"><strong>${ABILITY_LABELS[ability]}</strong><small>${ability.toUpperCase()}</small></div><div class="quick-build-ability-control"><button type="button" class="quick-build-ability-step" data-class-ability-base="${ability}" data-ability-adjustment="-1" aria-label="降低${ABILITY_LABELS[ability]}基礎值"${baseValue > 8 ? "" : " disabled"}>▼</button><span class="quick-build-ability-value">${baseValue}</span><button type="button" class="quick-build-ability-step" data-class-ability-base="${ability}" data-ability-adjustment="1" aria-label="提高${ABILITY_LABELS[ability]}基礎值"${canIncreaseBase ? "" : " disabled"}>▲</button></div><div class="quick-build-ability-control"><button type="button" class="quick-build-ability-step" data-class-ability-bonus="${ability}" data-ability-adjustment="-1" aria-label="降低${ABILITY_LABELS[ability]}背景加值"${bonusEnabled && bonusValue > 0 ? "" : " disabled"}>▼</button><span class="quick-build-ability-value is-bonus">${bonusEnabled ? `+${bonusValue}` : "—"}</span><button type="button" class="quick-build-ability-step" data-class-ability-bonus="${ability}" data-ability-adjustment="1" aria-label="提高${ABILITY_LABELS[ability]}背景加值"${canIncreaseBonus ? "" : " disabled"}>▲</button></div><div class="quick-build-ability-total"><strong>${abilityTotal(draft, ability)}</strong></div></div>`;
    }).join("")}</section>${spent !== 27 ? '<div class="quick-build-warning">基礎值必須剛好滿足 27 購點後才能繼續。</div>' : ""}${bonusTotal !== 3 ? '<div class="quick-build-warning">背景加值必須剛好分配 3 點後才能繼續。</div>' : ""}`;
    body.querySelectorAll("[data-class-ability-base],[data-class-ability-bonus]").forEach(button => button.addEventListener("click", updateClassAbility));
  }

  function renderClassSpellcasting(body) {
    const castingSource = spellcastingSourceForDraft(draft);
    if (!castingSource) {
      renderClassProficiencies(body);
      return;
    }
    const fixed = castingSource.type === "class" ? castingSource.fixedAbility : null;
    const selected = draft.choices.spellcastingAbility || preferredMentalAbility(draft);
    const mentalTotals = ["int", "wis", "cha"].map(key => `${ABILITY_LABELS[key]} ${abilityTotal(draft, key)}`).join("、");
    const choiceLead = fixed ? "" : '<p class="quick-build-lead">請選擇智力、感知或魅力作為施法屬性</p>';
    body.innerHTML = `<h3>${escapeHtml(castingSource.label)}：決定施法屬性</h3>${choiceLead}<section class="quick-build-choice-panel"><div class="quick-build-field"><label for="quick-build-class-spellcasting">施法屬性</label><select id="quick-build-class-spellcasting" data-class-spellcasting${fixed ? " disabled" : ""}>${["int", "wis", "cha"].map(ability => `<option value="${ability}"${ability === selected ? " selected" : ""}>${ABILITY_LABELS[ability]}</option>`).join("")}</select></div><div class="quick-build-fixed-list">目前${escapeHtml(mentalTotals)}</div></section>`;
    body.querySelector("[data-class-spellcasting]")?.addEventListener("change", updateClassSpellcasting);
  }

  function classProficiencySelect(type, index, values, selectedValues, disabledBySource = new Set()) {
    const selected = selectedValues[index] || "";
    const otherSelections = new Set(selectedValues.filter((_, otherIndex) => otherIndex !== index));
    const label = type === "skill" ? `技能 ${index + 1}` : `工具 ${index + 1}`;
    const options = type === "skill" ? orderedSkillOptions(values) : values;
    return `<div class="quick-build-field"><label for="quick-build-class-${type}-${index}">${label}</label><select id="quick-build-class-${type}-${index}" data-class-${type}><option value="">請選擇</option>${options.map(name => {
      const peerDuplicate = otherSelections.has(name) && name !== selected;
      const sources = duplicateSourceLabels(type === "skill" ? "skills" : "tools", name, "class");
      const displayName = type === "skill" ? skillOptionLabel(name) : name;
      return `<option value="${escapeHtml(name)}"${name === selected ? " selected" : ""}${peerDuplicate ? " disabled" : ""}${sources.length && !peerDuplicate ? ' class="quick-build-known-option"' : ""}>${escapeHtml(displayName)}${peerDuplicate ? "（本頁已選）" : sources.length ? `（${escapeHtml(sources.join("、"))}已熟練）` : ""}</option>`;
    }).join("")}</select></div>`;
  }

  function renderClassProficiencies(body) {
    const definition = CLASS_BUILD_DEFINITIONS[draft.choices.class];
    const options = draft.choices.classOptions;
    const skills = Array.isArray(options.skills) ? options.skills : [];
    const tools = Array.isArray(options.tools) ? options.tools : [];
    const backgroundSkills = new Set((draft.acquisitions.skills || []).filter(item => item.sourceType === "background").map(item => item.name));
    body.innerHTML = `<h3>${CLASS_LABELS[draft.choices.class]}：技能與工具</h3><p class="quick-build-lead">其他來源已熟練的技能或工具會標示來源，但仍可選擇。</p><div class="quick-build-proficiency-grid"><section class="quick-build-choice-panel"><h4>技能熟練：選擇 ${definition.skillCount} 項</h4><div class="quick-build-spell-fields">${Array.from({ length: definition.skillCount }, (_, index) => classProficiencySelect("skill", index, definition.skillOptions, skills, backgroundSkills)).join("")}</div></section>${definition.toolCount ? `<section class="quick-build-choice-panel"><h4>工具熟練：選擇 ${definition.toolCount} 項${definition.toolLabel ? `（${escapeHtml(definition.toolLabel)}）` : ""}</h4><div class="quick-build-spell-fields">${Array.from({ length: definition.toolCount }, (_, index) => classProficiencySelect("tool", index, definition.toolOptions, tools)).join("")}</div></section>` : ""}${(definition.fixedTools || []).length ? `<section class="quick-build-choice-panel"><h4>固定工具熟練</h4><div class="quick-build-fixed-list">${definition.fixedTools.map(escapeHtml).join("、")}</div></section>` : ""}</div>`;
    body.querySelectorAll("[data-class-skill],[data-class-tool]").forEach(select => select.addEventListener("change", updateClassProficiencies));
  }

  function renderClassSummary(body) {
    const selection = draft.selections.class;
    const content = selection?.content || {};
    const abilitySummary = ABILITY_ORDER.map(key => {
      const total = content.totals?.[key] ?? abilityTotal(draft, key);
      const modifier = signedNumberParts(abilityModifier(total));
      return `<div class="quick-build-ability-summary-row"><span>${escapeHtml(ABILITY_LABELS[key])} ${escapeHtml(total)}（${escapeHtml(draft.choices.abilities[key])}+${escapeHtml(draft.choices.backgroundAbilityBonuses[key] || 0)}）</span><span class="quick-build-ability-modifier">調整值 <span class="quick-build-ability-modifier-sign">${modifier.sign}</span><span class="quick-build-ability-modifier-value">${modifier.value}</span></span></div>`;
    }).join("");
    const skillSummary = content.skills?.length ? content.skills.map(name => annotatedDuplicateName("skills", name, "class", "已熟練")).join("、") : "無";
    const toolSummary = content.tools?.length ? content.tools.map(name => annotatedDuplicateName("tools", name, "class", "已熟練")).join("、") : "無";
    const hitDieSummary = String(content.hitDie || "").replace(/，每級多一顆$/, "");
    const spellcastingSourceLabel = content.spellcastingAbilitySource === "class" ? "職業固定" : content.spellcastingAbilitySource === "player-override" ? `${content.spellcastingSource?.label || "來源"}選擇` : `${content.spellcastingSource?.label || "來源"}預選`;
    const spellcastingSummary = content.spellcastingSource ? `<dt>施法屬性</dt><dd>${escapeHtml(ABILITY_LABELS[content.spellcastingAbility] || "")}（${escapeHtml(spellcastingSourceLabel)}）</dd>` : "";
    const skillBonusSummary = sourceAwareAcquisitions("skillBonuses", item => item.sourceType === "class");
    const optionalRow = (label, value) => !value || value === "無" ? "" : `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`;
    body.innerHTML = `<h3>職業與屬性摘要確認</h3><section class="quick-build-complete"><dl class="quick-build-summary-list"><dt>職業</dt><dd>${escapeHtml(selection?.label || "")}${content.classTypeLabel ? `（${escapeHtml(content.classTypeLabel)}）` : ""}</dd><dt>關鍵屬性</dt><dd>${escapeHtml(content.keyAbilityText || "")}</dd><dt>生命骰</dt><dd>${escapeHtml(hitDieSummary)}</dd><dt class="quick-build-summary-full-label">屬性總值</dt><dd class="quick-build-summary-full-value"><div class="quick-build-ability-summary">${abilitySummary}</div></dd>${spellcastingSummary}<dt>豁免熟練</dt><dd>${escapeHtml((content.saves || []).join("、"))}</dd><dt>技能熟練</dt><dd>${escapeHtml(skillSummary)}</dd>${optionalRow("技能額外加值", skillBonusSummary)}${optionalRow("工具熟練", toolSummary)}${optionalRow("武器熟練", content.weaponProficiencies)}${optionalRow("護甲訓練", content.armorTraining)}</dl></section>${duplicateReviewWarning()}`;
  }

  function classEquipmentComplete(target = draft) {
    const content = target.selections.classEquipment?.content;
    return Boolean(content && !(content.pendingChoices || []).length);
  }

  function equipmentComplete(target = draft) {
    return classEquipmentComplete(target) && ["default", "gold"].includes(target.choices.backgroundWealth);
  }

  function equipmentItemText(equipmentPackage) {
    const items = equipmentPackage.items.map(([name, quantity]) => `${name}${quantity > 1 ? ` ×${quantity}` : ""}`);
    if (equipmentPackage.instrument) items.push("自選一個樂器");
    if (equipmentPackage.gp) items.push(`${equipmentPackage.gp} 金幣`);
    return items.join("、");
  }


  function equipmentCombatItemText(equipmentPackage) {
    const combatNames = new Set([
      equipmentPackage.armor,
      ...(equipmentPackage.main || []),
      ...Object.values(equipmentPackage.off || {}).flat(),
    ].filter(name => name && name !== "武藝" && name !== "德魯伊法器"));
    if (Object.values(equipmentPackage.off || {}).flat().includes("盾牌")) combatNames.add("盾牌");
    const items = [];
    equipmentPackage.items.forEach(([name, quantity]) => {
      const displayName = combatNames.has(name) ? name : Array.from(combatNames).find(combatName => name.includes(combatName));
      if (displayName && !items.some(item => item.name === displayName)) items.push({ name: displayName, quantity });
    });
    return items.map(({ name, quantity }) => `${name}${quantity > 1 ? ` ×${quantity}` : ""}`).join("、");
  }


  function equipmentConfigurationFields(equipmentPackage) {
    return [
      (equipmentPackage.main || []).length > 1 && "mainHand",
      equipmentPackage.instrument && "instrument"
    ].filter(Boolean);
  }

  function equipmentNeedsConfiguration(equipmentPackage) {
    return equipmentConfigurationFields(equipmentPackage).length > 0;
  }

  function classEquipmentCompleteSummary(selection) {
    const content = selection?.content;
    if (!content) return "";
    if (content.method === "gold") return `取得 ${content.currency?.gp || 0} 金幣<br>不取得職業預設裝備，之後自行購買，這筆職業金幣會與背景金幣相加。`;
    const loadout = content.loadout || {};
    const rows = [
      `<strong>取得 ${escapeHtml(selection.label)}</strong>`,
      `攜帶物品：${escapeHtml((content.items || []).map(item => `${item.name}${Number(item.quantity) > 1 ? ` ×${item.quantity}` : ""}`).join("、") || "無")}`,
      `主手：${escapeHtml(loadout.mainHand || "空著")}`,
      `副手：${escapeHtml(loadout.offHand || "空著")}`,
      loadout.armor && `身著護甲：${escapeHtml(loadout.armor)}`,
      (content.specialWrites || []).map(write => write.note).filter(Boolean).length && `備註：${escapeHtml((content.specialWrites || []).map(write => write.note).filter(Boolean).join("、"))}`
    ].filter(Boolean);
    return rows.join("<br>");
  }

  function renderEquipmentMethod(body) {
    const key = draft.choices.class;
    const definition = CLASS_EQUIPMENT_DEFINITIONS[key];
    if (!definition) {
      body.innerHTML = '<div class="quick-build-warning">目前職業沒有可用的裝備資料，請返回職業步驟。</div>';
      return;
    }
    const fighterWarning = key === "fighter" ? `<div class="quick-build-warning"><strong>先確認戰士屬性路線</strong><br>力量型套裝適合力量戰士，敏捷型套裝適合敏捷戰士。若你沿用職業預填屬性且沒有調整，建議選擇力量型預設裝備。<div class="quick-build-option-note">目前 力量=${abilityTotal(draft, "str")} 敏捷=${abilityTotal(draft, "dex")}</div></div>` : "";
    body.innerHTML = `<h3>${CLASS_LABELS[key]}：選擇初始裝備</h3><p class="quick-build-lead">是否取得職業提供的預設裝備？若選否，改為取得金幣並由玩家自行購買。</p>${fighterWarning}<section class="quick-build-choice-panel">${definition.defaults.map(option => `<strong>${escapeHtml(option.label)}</strong><div class="quick-build-equipment-list">${escapeHtml(equipmentItemText(option))}</div>`).join("")}<div class="quick-build-choice-actions quick-build-equipment-actions">${definition.defaults.map(option => `<button type="button" data-class-equipment-method="${option.id}">${definition.defaults.length === 1 ? "取得預設裝備" : `取得${escapeHtml(option.label)}`}</button>`).join("")}<button type="button"${key === "fighter" ? " class=\"quick-build-choice-action-full\"" : ""} data-class-equipment-method="gold">否，取得 ${definition.gold} 金幣</button></div></section>`;
    body.querySelectorAll("[data-class-equipment-method]").forEach(button => button.addEventListener("click", () => chooseClassEquipmentMethod(button.dataset.classEquipmentMethod)));
  }

  function equipmentSelect(id, label, values, selected, dataName) {
    return `<div class="quick-build-field"><label for="${id}">${escapeHtml(label)}</label><select id="${id}" ${dataName}><option value="">請選擇</option>${values.map(value => `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(value)}</option>`).join("")}</select></div>`;
  }

  function renderEquipmentComplete(body) {
    const key = draft.choices.class;
    const selection = draft.selections.classEquipment;
    body.innerHTML = `<h3>${CLASS_LABELS[key]}：裝備選擇完成</h3><div class="quick-build-complete"><strong>職業裝備</strong><br>${classEquipmentCompleteSummary(selection)}<br><br><strong>背景裝備</strong><br>${escapeHtml(formatEquipmentSelection(draft.selections.backgroundEquipment))}</div>`;
  }

  function renderEquipmentConfiguration(body) {
    const key = draft.choices.class;
    const method = draft.choices.classEquipmentMethod;
    const selection = draft.selections.classEquipment;
    const options = draft.choices.classEquipmentOptions || {};
    if (method === "gold") return;
    const equipmentPackage = selectedClassEquipmentPackage(draft);
    if (!equipmentPackage) { renderEquipmentMethod(body); return; }
    if (!equipmentNeedsConfiguration(equipmentPackage)) {
      return;
    }
    const configurationFields = equipmentConfigurationFields(equipmentPackage);
    const mainHand = options.mainHand || "";
    const offCandidates = mainHand ? (equipmentPackage.off[mainHand] || []) : [];
    const offControl = mainHand ? `<div class="quick-build-fixed-list"><strong>副手：</strong>${escapeHtml(offCandidates[0] || "空著")}</div>` : `<div class="quick-build-fixed-list"><strong>副手：</strong>請先選擇主手</div>`;
    const fixedArmor = equipmentPackage.armor ? `<div class="quick-build-fixed-list"><strong>身著護甲：</strong>${escapeHtml(equipmentPackage.armor)}</div>` : "";
    const mainControl = configurationFields.includes("mainHand") ? equipmentSelect("quick-build-equipment-main", "主手", equipmentPackage.main, mainHand, "data-equipment-main") : `<div class="quick-build-fixed-list"><strong>主手：</strong>${escapeHtml(options.mainHand || equipmentPackage.main[0] || "空著")}</div>`;
    const instrumentControl = configurationFields.includes("instrument") ? equipmentSelect("quick-build-equipment-instrument", "預設裝備提供的樂器", classEquipmentInstrumentOptions(draft), options.instrument || "", "data-equipment-instrument") : "";
    body.innerHTML = `<h3>${CLASS_LABELS[key]}：${escapeHtml(equipmentPackage.label)}</h3><div class="quick-build-equipment-list">${escapeHtml(equipmentCombatItemText(equipmentPackage))}</div><section class="quick-build-choice-panel"><div class="quick-build-spell-fields">${mainControl}${offControl}${fixedArmor}${instrumentControl}</div></section>`;
    body.querySelector("[data-equipment-main]")?.addEventListener("change", updateClassEquipmentOptions);
    body.querySelector("[data-equipment-instrument]")?.addEventListener("change", updateClassEquipmentOptions);
  }


  function levelOneComplete(target = draft) {
    const definition = LEVEL_ONE_DEFINITIONS[target.choices.class];
    if (!definition) return false;
    if (definition.autoComplete) return true;
    return Array.isArray(target.selections.levelOne?.content?.pendingChoices) && target.selections.levelOne.content.pendingChoices.length === 0;
  }

  function levelOneStages() {
    const key = draft.choices.class;
    const definition = LEVEL_ONE_DEFINITIONS[key] || {};
    return [
      (definition.classOption || definition.fightingStyle || definition.invocations) && "options",
      definition.languages && "languages",
      (levelOneCantripCount(draft, definition) || definition.preparedSpells || definition.spellbookSpells) && "spells",
      definition.weaponMastery && "mastery",
      definition.expertise && "expertise",
      "summary"
    ].filter(Boolean);
  }

  function updateLevelOneField(updater, preserve = true) {
    const next = { ...(draft.choices.levelOne || {}) };
    updater(next);
    draft.choices.levelOne = next;
    saveDraft();
    render(preserve);
  }

  function spellSelectControl(id, label, spells, selected, selectedPeerNames = [], knownSources = new Map(), dataAttr = "data-level-one-spell", allowKnownDuplicates = false) {
    return `<div class="quick-build-field"><label for="${id}">${escapeHtml(label)}</label><div class="quick-build-field-control"><select id="${id}" ${dataAttr}><option value="">-- 選擇法術 --</option>${spells.map(spell => {
      const spellId = spell.spellId;
       const peerDuplicate = selectedPeerNames.includes(spellId) && spellId !== selected;
       const known = [...new Set(knownSources.get(spellId) || [])];
       const suffix = peerDuplicate ? "（本頁已選）" : known.length ? `（${escapeHtml(known.join("、"))}已學會）` : "";
       return `<option value="${escapeHtml(spellId)}"${spellId === selected ? " selected" : ""}${peerDuplicate ? " disabled" : ""}${known.length && !peerDuplicate ? ' class="quick-build-known-option"' : ""}>${escapeHtml(spellDisplayName(spellId))}${suffix}</option>`;
    }).join("")}</select><button type="button" class="quick-build-spell-view" data-spell-view="${escapeHtml(id)}"${selected ? "" : " disabled"}>查看</button></div></div>`;
  }

  function pactTomeSelectionComplete(selection) {
    const cantrips = Array.isArray(selection?.cantrips) ? selection.cantrips.filter(Boolean) : [];
    const rituals = Array.isArray(selection?.rituals) ? selection.rituals.filter(Boolean) : [];
    return cantrips.length === 3 && new Set(cantrips).size === 3
      && rituals.length === 2 && new Set(rituals).size === 2;
  }

  function ensurePactTomeModal() {
    ensureStyles();
    let modal = document.getElementById("quick-build-pact-tome");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "quick-build-pact-tome";
    modal.inert = true;
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <section class="quick-build-pact-tome-shell" role="dialog" aria-modal="true" aria-labelledby="quick-build-pact-tome-title">
        <header class="quick-build-header"><div><h2 id="quick-build-pact-tome-title">書之魔契法術</h2></div><button type="button" class="quick-build-close" data-pact-tome-cancel aria-label="取消書之魔契選擇">✕</button></header>
        <main class="quick-build-pact-tome-body"></main>
        <footer class="quick-build-pact-tome-actions"><button type="button" data-pact-tome-cancel>取消</button><button type="button" class="primary" data-pact-tome-confirm>確認選擇</button></footer>
      </section>`;
    document.body.appendChild(modal);
    return modal;
  }

  function openPactTomeModal(options = {}) {
    const modal = ensurePactTomeModal();
    const body = modal.querySelector(".quick-build-pact-tome-body");
    const knownSources = new Map((options.knownSpellIds || []).map(spellId => [spellId, ["角色卡"]]));
    const initial = options.initial || {};
    const selection = {
      cantrips: Array.from({ length: 3 }, (_, index) => initial.cantrips?.[index] || ""),
      rituals: Array.from({ length: 2 }, (_, index) => initial.rituals?.[index] || "")
    };
    const trigger = document.activeElement;

    return new Promise(resolve => {
      let settled = false;
      const finish = value => {
        if (settled) return;
        settled = true;
        unlockPage();
        trigger?.focus?.();
        if (modal.contains(document.activeElement)) document.activeElement.blur();
        modal.inert = true;
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
        modal.removeEventListener("click", onBackdrop);
        modal.removeEventListener("keydown", onKeydown);
        modal.remove();
        resolve(value);
      };
      const onBackdrop = event => { if (event.target === modal) finish(null); };
      const onKeydown = event => {
        if (event.key === "Escape") { event.preventDefault(); finish(null); return; }
        if (event.key !== "Tab") return;
        const focusable = [...modal.querySelectorAll("button:not(:disabled),select:not(:disabled)")].filter(element => element.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      };
      const renderSelection = focusId => {
        const cantripFields = Array.from({ length: 3 }, (_, index) => spellSelectControl(`pact-tome-cantrip-${index}`, `魔契書戲法 ${index + 1}`, allSpellOptions("cantrips"), selection.cantrips[index], selection.cantrips, knownSources, "data-pact-tome-cantrip")).join("");
        const ritualFields = Array.from({ length: 2 }, (_, index) => spellSelectControl(`pact-tome-ritual-${index}`, `魔契書儀式 ${index + 1}`, allSpellOptions("1", isRitualSpell), selection.rituals[index], selection.rituals, knownSources, "data-pact-tome-ritual")).join("");
        body.innerHTML = `<h3>選擇魔契書法術</h3><p class="quick-build-lead">選擇 3 個任一職業戲法與 2 個任一職業的一環儀式法術；五個法術都選好後才能確認。</p><section class="quick-build-choice-panel"><div class="quick-build-spell-fields">${cantripFields}${ritualFields}</div></section>`;
        body.querySelectorAll(".quick-build-spell-view").forEach(button => button.remove());
        body.querySelectorAll("[data-pact-tome-cantrip]").forEach((select, index) => select.addEventListener("change", () => { selection.cantrips[index] = select.value || ""; renderSelection(select.id); }));
        body.querySelectorAll("[data-pact-tome-ritual]").forEach((select, index) => select.addEventListener("change", () => { selection.rituals[index] = select.value || ""; renderSelection(select.id); }));
        modal.querySelector("[data-pact-tome-confirm]").disabled = !pactTomeSelectionComplete(selection);
        if (focusId) body.querySelector(`#${CSS.escape(focusId)}`)?.focus();
      };
      modal.querySelectorAll("[data-pact-tome-cancel]").forEach(button => button.onclick = () => finish(null));
      modal.querySelector("[data-pact-tome-confirm]").onclick = () => finish(pactTomeSelectionComplete(selection) ? structuredClone(selection) : null);
      modal.addEventListener("click", onBackdrop);
      modal.addEventListener("keydown", onKeydown);
      renderSelection();
      modal.inert = false;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      lockPage(modal);
      modal.querySelector("select")?.focus();
    });
  }

  function renderLevelOneOptions(body) {
    const key = draft.choices.class;
    const definition = LEVEL_ONE_DEFINITIONS[key] || {};
    const choices = draft.choices.levelOne || {};
    const panels = [];
    if (definition.classOption) {
      panels.push(`<section class="quick-build-choice-panel"><h4>${escapeHtml(definition.classOption.label)}</h4><div class="quick-build-spell-fields"><div class="quick-build-field"><label for="quick-build-level-one-class-option">職業選項</label><select id="quick-build-level-one-class-option" data-level-one-class-option><option value="">請選擇</option>${definition.classOption.options.map(option => `<option value="${option.id}"${choices.classOption === option.id ? " selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}</select></div></div></section>`);
    }
    const skillBonuses = (draft.acquisitions.skillBonuses || []).filter(item => item.sourceType === "level-one" && item.sourceId === key);
    if (skillBonuses.length) panels.push(`<section class="quick-build-complete"><strong>技能額外加值：</strong>${escapeHtml(skillBonuses.map(item => item.name).join("、"))}</section>`);
    if (definition.fightingStyle) {
      const styles = (typeof FEAT_OPTIONS === "object" ? FEAT_OPTIONS : []).filter(option => /戰鬥風格/u.test(option.label || ""));
      panels.push(`<section class="quick-build-choice-panel"><h4>戰鬥風格</h4><div class="quick-build-field"><label for="quick-build-fighting-style">戰鬥風格</label><select id="quick-build-fighting-style" data-level-one-fighting-style><option value="">請選擇</option>${styles.map(option => `<option value="${escapeHtml(option.value)}"${choices.fightingStyle === option.value ? " selected" : ""}>${escapeHtml(option.value)}</option>`).join("")}</select></div></section>`);
    }
    if (definition.invocations) {
      const selected = choices.invocations?.[0] || "";
      const invocationOptions = levelOneInvocationOptions();
      const option = invocationOptions.find(item => item.id === selected);
      panels.push(`<section class="quick-build-choice-panel"><h4>魔能祈喚</h4><div class="quick-build-field-control"><select id="quick-build-invocation" data-level-one-invocation><option value="">請選擇</option>${invocationOptions.map(item => `<option value="${item.id}"${selected === item.id ? " selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select><button type="button" class="quick-build-spell-view" data-invocation-view${selected ? "" : " disabled"}>查看</button></div>${option ? `<p class="quick-build-option-note">${escapeHtml(option.description)}</p>` : ""}</section>`);
    }
    body.innerHTML = `<h3>${CLASS_LABELS[key]}：職業選項</h3>${panels.join("")}`;
    body.querySelector("[data-level-one-class-option]")?.addEventListener("change", event => updateLevelOneField(next => { next.classOption = event.currentTarget.value || null; next.cantrips = []; }));
    body.querySelector("[data-level-one-fighting-style]")?.addEventListener("change", event => updateLevelOneField(next => { next.fightingStyle = event.currentTarget.value || null; }));
    body.querySelector("[data-level-one-invocation]")?.addEventListener("change", event => updateLevelOneField(next => { next.invocations = event.currentTarget.value ? [event.currentTarget.value] : []; next.tome = {}; }));
    body.querySelector("[data-invocation-view]")?.addEventListener("click", event => {
      const invocationId = body.querySelector("[data-level-one-invocation]")?.value || "";
      const selectedOption = levelOneInvocationOptions().find(item => item.id === invocationId);
      openInvocationDetail(selectedOption, event.currentTarget);
    });
  }

  function renderLevelOneLanguages(body) {
    const selected = draft.choices.levelOne?.languages || [];
    const select = index => `<div class="quick-build-field"><label for="quick-build-language-${index}">${draft.choices.class === "rogue" && index >= 2 ? "額外語言" : `語言 ${index + 1}`}</label><select id="quick-build-language-${index}" data-level-one-language><option value="">-- 請選擇 --</option>${LANGUAGE_OPTIONS.map(option => {
      const availableOptions = languageOptionsForDraft(draft, index);
      if (!availableOptions.some(available => available.value === option.value)) return "";
      const peerDuplicate = selected.includes(option.value) && selected[index] !== option.value;
      return `<option value="${option.value}"${selected[index] === option.value ? " selected" : ""}${peerDuplicate ? " disabled" : ""}>${escapeHtml(option.label)}${peerDuplicate ? "（本頁已選）" : ""}</option>`;
    }).join("")}</select></div>`;
    body.innerHTML = `<h3>${CLASS_LABELS[draft.choices.class]}：初始語言</h3><section class="quick-build-choice-panel"><div class="quick-build-spell-fields">${Array.from({ length: LEVEL_ONE_DEFINITIONS[draft.choices.class].languages }, (_, index) => select(index)).join("")}</div></section>`;
    body.querySelectorAll("[data-level-one-language]").forEach((selectEl, index) => selectEl.addEventListener("change", () => updateLevelOneField(next => { const values = [...body.querySelectorAll("[data-level-one-language]")].map(item => item.value || ""); next.languages = values; })));
  }

  function renderLevelOneSpells(body) {
    const key = draft.choices.class;
    const definition = LEVEL_ONE_DEFINITIONS[key] || {};
    const choices = draft.choices.levelOne || {};
    const knownFor = feature => knownSpellSources(draft, feature);
    const cantripCount = levelOneCantripCount(draft, definition);
    const cantrips = choices.cantrips || [];
    const prepared = choices.preparedSpells || [];
    const spellbook = choices.spellbookSpells || [];
    const sections = [];
    if (cantripCount) sections.push(`<section class="quick-build-choice-panel"><h4>戲法</h4><div class="quick-build-spell-fields">${Array.from({ length: cantripCount }, (_, index) => spellSelectControl(`quick-build-cantrip-${index}`, `戲法 ${index + 1}`, levelOneSpellOptions(key, "cantrips"), cantrips[index] || "", cantrips, knownFor("1 級戲法"), "data-level-one-cantrip")).join("")}</div></section>`);
    if (definition.spellbookSpells) sections.push(`<section class="quick-build-choice-panel"><h4>法術書法術</h4><div class="quick-build-spell-fields">${Array.from({ length: definition.spellbookSpells }, (_, index) => spellSelectControl(`quick-build-spellbook-${index}`, `法術書 ${index + 1}`, levelOneSpellOptions("wizard", "1"), spellbook[index] || "", spellbook, knownFor("法術書"), "data-level-one-spellbook")).join("")}</div></section>`);
    if (definition.preparedSpells) {
      const spells = definition.spellbookSpells ? spellbook.map(name => canonicalSpell(name)).filter(Boolean) : levelOneSpellOptions(key, "1");
      sections.push(`<section class="quick-build-choice-panel"><h4>準備法術</h4><div class="quick-build-spell-fields">${Array.from({ length: definition.preparedSpells }, (_, index) => spellSelectControl(`quick-build-prepared-${index}`, `準備法術 ${index + 1}`, spells, prepared[index] || "", prepared, knownFor("1 級準備法術"), "data-level-one-prepared", Boolean(definition.spellbookSpells))).join("")}</div></section>`);
    }
    if ((choices.invocations || []).includes("pact-of-the-tome")) {
      const tome = choices.tome || {};
      const tomeCantrips = tome.cantrips || [];
      const tomeRituals = tome.rituals || [];
      sections.push(`<section class="quick-build-choice-panel"><h4>書之魔契</h4><p class="quick-build-option-note">選 3 個任一職業戲法與 2 個任一職業儀式一環法術。</p><div class="quick-build-spell-fields">${Array.from({ length: 3 }, (_, index) => spellSelectControl(`quick-build-tome-cantrip-${index}`, `魔契書戲法 ${index + 1}`, allSpellOptions("cantrips"), tomeCantrips[index] || "", tomeCantrips, knownFor("書之魔契"), "data-level-one-tome-cantrip")).join("")}${Array.from({ length: 2 }, (_, index) => spellSelectControl(`quick-build-tome-ritual-${index}`, `魔契書儀式 ${index + 1}`, allSpellOptions("1", isRitualSpell), tomeRituals[index] || "", tomeRituals, knownFor("書之魔契"), "data-level-one-tome-ritual")).join("")}</div></section>`);
    }
    body.innerHTML = `<h3>${CLASS_LABELS[key]}：法術選擇</h3>${sections.join("")}`;
    const collect = selector => [...body.querySelectorAll(selector)].map(item => item.value || "");
    body.querySelectorAll("[data-level-one-cantrip],[data-level-one-spellbook],[data-level-one-prepared],[data-level-one-tome-cantrip],[data-level-one-tome-ritual]").forEach(select => select.addEventListener("change", () => updateLevelOneField(next => { next.cantrips = collect("[data-level-one-cantrip]"); next.spellbookSpells = collect("[data-level-one-spellbook]"); next.preparedSpells = collect("[data-level-one-prepared]"); next.tome = { cantrips: collect("[data-level-one-tome-cantrip]"), rituals: collect("[data-level-one-tome-ritual]") }; })));
    body.querySelectorAll("[data-spell-view]").forEach(button => button.addEventListener("click", event => {
      const select = body.querySelector(`#${CSS.escape(button.dataset.spellView)}`);
      const value = select?.value || "";
      const spell = value ? canonicalSpell(value) : null;
      openSpellDetail(spell, event.currentTarget);
    }));
  }

  function renderLevelOneMastery(body) {
    const key = draft.choices.class;
    const count = LEVEL_ONE_DEFINITIONS[key].weaponMastery;
    const selected = draft.choices.levelOne?.weaponMasteries || [];
    const options = allWeaponMasteryOptionsForClass(key);
    const select = index => `<div class="quick-build-field"><label for="quick-build-mastery-${index}">-- 選擇精通武器 --</label><select id="quick-build-mastery-${index}" data-level-one-mastery><option value="">-- 選擇精通武器 --</option>${options.map(([name, mastery]) => {
      const peerDuplicate = selected.includes(name) && selected[index] !== name;
      return `<option value="${escapeHtml(name)}"${selected[index] === name ? " selected" : ""}${peerDuplicate ? " disabled" : ""}>${escapeHtml(name)}（${escapeHtml(mastery)}）${peerDuplicate ? "（本頁已選）" : ""}</option>`;
    }).join("")}</select></div>`;
    body.innerHTML = `<h3>武器精通選擇</h3><section class="quick-build-choice-panel"><div class="quick-build-spell-fields">${Array.from({ length: count }, (_, index) => select(index)).join("")}</div></section>`;
    body.querySelectorAll("[data-level-one-mastery]").forEach(selectEl => selectEl.addEventListener("change", () => updateLevelOneField(next => { next.weaponMasteries = [...body.querySelectorAll("[data-level-one-mastery]")].map(item => item.value || ""); })));
  }

  function renderLevelOneExpertise(body) {
    const selected = draft.choices.levelOne?.expertise || [];
    const options = orderedSkillOptions(expertiseSkillOptions(draft));
    const requiredCount = LEVEL_ONE_DEFINITIONS[draft.choices.class].expertise;
    const select = index => {
      const current = selected[index] || "";
      const stale = current && !options.includes(current) ? `<option value="${escapeHtml(current)}" selected>${escapeHtml(skillOptionLabel(current))}（目前未熟練）</option>` : "";
      return `<div class="quick-build-field"><label for="quick-build-expertise-${index}">專精 ${index + 1}</label><select id="quick-build-expertise-${index}" data-level-one-expertise><option value="">請選擇</option>${stale}${options.map(name => {
        const peerDuplicate = selected.includes(name) && current !== name;
        return `<option value="${escapeHtml(name)}"${current === name ? " selected" : ""}${peerDuplicate ? " disabled" : ""}>${escapeHtml(skillOptionLabel(name))}${peerDuplicate ? "（本頁已選）" : ""}</option>`;
      }).join("")}</select></div>`;
    };
    body.innerHTML = `<h3>${CLASS_LABELS[draft.choices.class]}：專精</h3><section class="quick-build-choice-panel"><p class="quick-build-option-note">只能選擇已從背景、種族或職業取得熟練的技能。</p><div class="quick-build-spell-fields">${Array.from({ length: requiredCount }, (_, index) => select(index)).join("")}</div></section>`;
    body.querySelectorAll("[data-level-one-expertise]").forEach(selectEl => selectEl.addEventListener("change", () => updateLevelOneField(next => { next.expertise = [...body.querySelectorAll("[data-level-one-expertise]")].map(item => item.value || ""); })));
  }

  function alignmentLabel(value = draft.choices.alignment) {
    return ALIGNMENT_OPTIONS.find(([optionValue]) => optionValue === value)?.[1] || "";
  }

  function renderLevelOneAlignment(body) {
    body.innerHTML = `<h3>選擇陣營</h3><p class="quick-build-lead">陣營會一併匯入角色卡。</p><section class="quick-build-choice-panel"><div class="quick-build-field"><label for="quick-build-alignment">陣營</label><select id="quick-build-alignment" data-level-one-alignment><option value="">請選擇</option>${ALIGNMENT_OPTIONS.map(([value, label]) => `<option value="${value}"${draft.choices.alignment === value ? " selected" : ""}>${escapeHtml(label)}</option>`).join("")}</select></div></section>`;
    body.querySelector("[data-level-one-alignment]")?.addEventListener("change", event => {
      draft.choices.alignment = ALIGNMENT_OPTIONS.some(([value]) => value === event.currentTarget.value) ? event.currentTarget.value : "";
      saveDraft();
      render(true);
    });
  }

  function renderLevelOneSummary(body) {
    const content = draft.selections.levelOne?.content || {};
    const pending = content.pendingChoices || [];
    const classOptionLabel = LEVEL_ONE_DEFINITIONS[draft.choices.class]?.classOption?.options
      ?.find(option => option.id === content.classOption)?.label;
    const optionSummary = [classOptionLabel, content.fightingStyle, ...(content.invocations || []).map(id => ELDRITCH_INVOCATION_OPTIONS.find(option => option.id === id)?.label || id)]
      .filter(Boolean).join("、");
    const summaryRow = (label, value) => {
      const text = String(value ?? "").trim();
      return !text || text === "無" || text === "—" ? "" : `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(text)}</dd>`;
    };
    const spellbookSummary = content.spellbookSpells?.length
      ? `法術書：一環-${content.spellbookSpells.map(spellId => `${spellNameZh(spellId)}${isRitualSpell(canonicalSpell(spellId)) ? "（儀式）" : ""}`).join("、")}`
      : "";
    const summaryRows = [
      summaryRow("固定能力", (content.fixed || []).join("、")),
      summaryRow("職業選項", optionSummary),
      summaryRow("技能額外加值", sourceAwareAcquisitions("skillBonuses")),
      summaryRow("戲法", (content.cantrips || []).concat(content.tome?.cantrips || []).map(spellNameZh).join("、")),
      summaryRow("準備法術", (content.preparedSpells || []).concat(content.tome?.rituals || []).map(spellNameZh).join("、")),
      summaryRow("法術書筆記", spellbookSummary),
      summaryRow("武器精通", (content.weaponMasteries || []).join("、")),
      summaryRow("專精", (content.expertise || []).join("、")),
      summaryRow("語言", (content.languages || []).map(value => LANGUAGE_OPTIONS.find(option => option.value === value)?.label || value).join("、")),
      summaryRow("陣營", alignmentLabel())
    ].join("");
    const summarySection = summaryRows ? `<section class="quick-build-complete"><dl class="quick-build-summary-list">${summaryRows}</dl></section>` : "";
    body.innerHTML = `<h3>${CLASS_LABELS[draft.choices.class]}：完成 1 級摘要</h3>${pending.length ? `<div class="quick-build-warning"><strong>尚未完成</strong><br>${pending.map(escapeHtml).join("<br>")}</div>` : `<section class="quick-build-complete"><strong>完成 1 級選擇已齊全，可前往 1 級總覽。</strong></section>`}${summarySection}${duplicateReviewWarning()}`;
  }

  function formatCurrency(currency) {
    const labels = { cp: "銅幣", sp: "銀幣", gp: "金幣", pp: "白金幣" };
    return Object.entries(currency || {}).filter(([, amount]) => Number(amount) > 0)
      .map(([type, amount]) => `${amount} ${labels[type] || type}`).join("、");
  }

  function formatEquipmentSelection(selection) {
    if (!selection?.content) return "無";
    const items = (selection.content.items || []).map(item => typeof item === "string"
      ? item
      : `${item.name}${Number(item.quantity) > 1 ? ` ×${item.quantity}` : ""}`);
    const currency = formatCurrency(selection.content.currency);
    const loadout = selection.content.loadout || {};
    const loadoutText = [loadout.mainHand && `主手：${loadout.mainHand}`, loadout.offHand && `副手：${loadout.offHand}`, loadout.armor && `護甲：${loadout.armor}`].filter(Boolean).join("、");
    return [selection.label, items.join("、"), currency, loadoutText].filter(Boolean).join("｜") || "無";
  }

  function sourceAwareAcquisitions(type, predicate = () => true, formatSource = item => item.source?.feature
    ? `${item.source?.label || item.sourceType}：${item.source.feature}`
    : (item.source?.label || item.sourceType || "未知來源")) {
    // 創角小幫手目前只支援 1 級；保留未來等級取得資料，待升級功能完成後再顯示。
    const entries = (draft.acquisitions[type] || []).filter(item => acquisitionAppliesAtLevel(item) && predicate(item));
    if (!entries.length) return "無";
    return entries.map(item => {
      const source = formatSource(item);
      const gainedAt = Number(item.content?.gainedAt) > 1 ? `，${item.content.gainedAt} 級取得` : "";
      const sourceText = `${source}${gainedAt}`;
      return sourceText ? `${item.name}（${sourceText}）` : item.name;
    }).join("、");
  }

  function raceOptionSummary() {
    const options = draft.choices.raceOptions || {};
    const labels = { ancestry: "血統／恩賜", lineage: "傳承／血統", legacy: "邪魔遺贈", size: "體型", skill: "技能", cantrip: "戲法", feat: "起源專長" };
    const details = Object.entries(options)
      .filter(([key, value]) => labels[key] && typeof value === "string" && value)
      .map(([key, value]) => `${labels[key]}：${key === "cantrip" ? spellNameZh(value) : key === "feat" ? humanOriginFeatLabel(value) : value}`);
    const featOptions = isPlainObject(options.featOptions) ? options.featOptions : {};
    if (featOptions.spellClass) details.push(`魔法學徒職業：${CLASS_LABELS[featOptions.spellClass] || featOptions.spellClass}`);
    if (Array.isArray(featOptions.cantrips) && featOptions.cantrips.some(Boolean)) details.push(`魔法學徒戲法：${featOptions.cantrips.filter(Boolean).map(spellNameZh).join("、")}`);
    if (Array.isArray(featOptions.levelOneSpells) && featOptions.levelOneSpells.some(Boolean)) details.push(`魔法學徒一環法術：${featOptions.levelOneSpells.filter(Boolean).map(spellNameZh).join("、")}`);
    if (Array.isArray(featOptions.proficiencies) && featOptions.proficiencies.some(Boolean)) details.push(`熟習：${featOptions.proficiencies.filter(Boolean).map(value => value.replace(/^skill:/u, "技能：").replace(/^tool:/u, "工具：")).join("、")}`);
    return details.join("；") || "無額外選項";
  }

  function renderLevelOneReview(body) {
    const background = draft.selections.background?.content || {};
    const classContent = draft.selections.class?.content || {};
    const levelOne = draft.selections.levelOne?.content || {};
    const abilitySummary = ABILITY_ORDER.map(key => `${ABILITY_LABELS[key]} ${classContent.totals?.[key] ?? "—"}`).join("、");
    const backgroundBonuses = ABILITY_ORDER.filter(key => Number(background.abilityBonuses?.[key]) > 0)
      .map(key => `${ABILITY_LABELS[key]} +${background.abilityBonuses[key]}`).join("、") || "無";
    const classOption = LEVEL_ONE_DEFINITIONS[draft.choices.class]?.classOption?.options
      ?.find(option => option.id === levelOne.classOption)?.label;
    const invocations = (levelOne.invocations || []).map(id => ELDRITCH_INVOCATION_OPTIONS.find(option => option.id === id)?.label || id);
    const fixedSpecialLanguages = (levelOne.fixed || []).filter(name => ["德魯伊語", "盜賊黑話"].includes(name))
      .map(name => `${name}（${CLASS_LABELS[draft.choices.class]}）`);
    const selectedLanguages = sourceAwareAcquisitions("languages", () => true, item => {
      if (item.sourceId === "rogue") return CLASS_LABELS.rogue;
      if (draft.choices.race === "tiefling" && item.content?.value === "infernal") return RACE_LABELS.tiefling;
      return "";
    });
    const languageSummary = [selectedLanguages === "無" ? "" : selectedLanguages, ...fixedSpecialLanguages].filter(Boolean).join("、") || "無";
    const levelOneOptions = [classOption, ...invocations].filter(Boolean).join("、") || "無";
    const fightingStyle = levelOne.fightingStyle || "無";
    const weaponMasteries = (levelOne.weaponMasteries || []).map(name => {
      const mastery = WEAPON_MASTERY_OPTIONS.simple.concat(WEAPON_MASTERY_OPTIONS.martial).find(([weapon]) => weapon === name)?.[1];
      return mastery ? `${name}（${mastery}）` : name;
    }).join("、") || "無";
    const duplicateWarning = duplicateReviewWarning();
    const summaryField = (label, value) => value === "無" ? "" : `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`;
    body.innerHTML = `<h3>1 級角色總覽</h3><p class="quick-build-lead">以下保留每一筆取得內容及其來源，供匯入手機角卡前確認。</p>${duplicateWarning}
      <section class="quick-build-choice-panel quick-build-review-panel"><h4>背景、種族與職業</h4><dl class="quick-build-summary-list">
        ${summaryField("背景", draft.selections.background?.label || "無")}
        ${summaryField("背景屬性加值", backgroundBonuses)}
        ${summaryField("種族", draft.selections.race?.label || "無")}
        ${summaryField("種族選項", raceOptionSummary())}
        ${summaryField("職業", `${draft.selections.class?.label || "無"}${classContent.classTypeLabel ? `（${classContent.classTypeLabel}）` : ""}`)}
        ${summaryField("陣營", alignmentLabel() || "無")}
        ${summaryField("屬性總值", abilitySummary)}
        ${summaryField("施法屬性", ABILITY_LABELS[classContent.spellcastingAbility] || "無")}
        ${summaryField("生命骰", String(classContent.hitDie || "無").replace(/，每級多一顆$/, ""))}
        ${summaryField("豁免熟練", (classContent.saves || []).join("、") || "無")}
        ${summaryField("武器熟練", classContent.weaponProficiencies || "無")}
        ${summaryField("護甲訓練", classContent.armorTraining || "無")}
      </dl></section>
      <section class="quick-build-choice-panel quick-build-review-panel"><h4>能力與取得內容</h4><dl class="quick-build-summary-list">
        ${summaryField("1 級固定能力", (LEVEL_ONE_DEFINITIONS[draft.choices.class]?.summaryFixed || levelOne.fixed || []).join("、") || "無")}
        ${summaryField("職業選項", levelOneOptions)}
        ${summaryField("專長", sourceAwareAcquisitions("feats", item => item.content?.type !== "fightingStyle", item => item.source?.label || item.sourceType || "未知來源"))}
        ${summaryField("戰鬥風格", fightingStyle)}
        ${summaryField("武器精通", weaponMasteries)}
        ${summaryField("技能熟練", sourceAwareAcquisitions("skills", () => true, item => item.source?.label || item.sourceType || "未知來源"))}
        ${summaryField("專精", sourceAwareAcquisitions("expertise"))}
        ${summaryField("技能額外加值", sourceAwareAcquisitions("skillBonuses"))}
        ${summaryField("工具熟練", sourceAwareAcquisitions("tools", () => true, item => item.source?.label || item.sourceType || "未知來源"))}
        ${summaryField("語言", languageSummary)}
        ${summaryField("法術", sourceAwareAcquisitions("spells", () => true, item => item.source?.label || item.sourceType || "未知來源"))}
      </dl></section>
      <section class="quick-build-choice-panel quick-build-review-panel"><h4>裝備選擇</h4><dl class="quick-build-summary-list">
        ${summaryField("背景裝備", formatEquipmentSelection(draft.selections.backgroundEquipment))}
        ${summaryField("職業裝備", formatEquipmentSelection(draft.selections.classEquipment))}
      </dl></section>
      <div class="quick-build-substep-actions quick-build-inline-actions"><button type="button" data-review-return>返回修改</button><button type="button" class="primary" data-import-mobile-card>匯入手機角卡</button></div>`;
    body.querySelector("[data-review-return]")?.addEventListener("click", () => {
      draft.ui = { ...draft.ui, currentStepId: "level-one", view: viewForStep("level-one") };
      saveDraft();
      render();
    });
    body.querySelector("[data-import-mobile-card]")?.addEventListener("click", importDraftToMobileCard);
  }

  const MOBILE_RACE_OPTION_VALUES = {
    dragonborn: {
      field: "dragonborn-ancestry",
      values: {
        "黑龍-酸": "black_acid", "藍龍-電": "blue_lightning", "黃銅龍-火": "brass_fire", "青銅龍-電": "bronze_lightning",
        "赤銅龍-酸": "copper_acid", "金龍-火": "gold_fire", "綠龍-毒": "green_poison", "紅龍-火": "red_fire",
        "銀龍-冰": "silver_cold", "白龍-冰": "white_cold"
      },
      choice: "ancestry"
    },
    elf: { field: "elf-lineage", values: { "卓爾血統": "drow", "高等精靈血統": "high_elf", "木精靈血統": "wood_elf" }, choice: "lineage" },
    gnome: { field: "gnome-lineage", values: { "森林侏儒": "forest_gnome", "岩石侏儒": "rock_gnome" }, choice: "lineage" },
    goliath: {
      field: "goliath-ancestry",
      values: {
        "雲遊四方（雲巨人）": "cloud", "星火燎原（火巨人）": "fire", "凜若冰霜（霜巨人）": "frost",
        "地動山搖（山丘巨人）": "hill", "堅若磐石（石巨人）": "stone", "轟雷掣電（風暴巨人）": "storm"
      },
      choice: "ancestry"
    },
    tiefling: { field: "tiefling-legacy", values: { "深淵血統": "abyssal", "冥界血統": "chthonic", "煉獄血統": "infernal" }, choice: "legacy" }
  };

  function mobileImportWarning(message, warnings) {
    if (message && !warnings.includes(message)) warnings.push(message);
  }

  function dispatchMobileField(element, eventName = "change") {
    element?.dispatchEvent(new Event(eventName, { bubbles: true }));
  }

  function setMobileField(id, value, warnings, label = id, eventName = "change") {
    const element = document.getElementById(id);
    if (!element) {
      mobileImportWarning(`${label}：角色卡沒有對應欄位`, warnings);
      return false;
    }
    const normalized = value == null ? "" : String(value);
    if (element.tagName === "SELECT") {
      const matchingOption = [...element.options].find(option => option.value === normalized && !option.disabled);
      if (!matchingOption && normalized) {
        mobileImportWarning(`${label}：找不到「${normalized}」選項`, warnings);
        return false;
      }
      if (!matchingOption && !normalized) {
        element.selectedIndex = [...element.options].findIndex(option => !option.disabled);
        if (element.selectedIndex < 0) element.selectedIndex = 0;
        dispatchMobileField(element, eventName);
        return true;
      }
    }
    element.value = normalized;
    dispatchMobileField(element, eventName);
    return element.value === normalized;
  }

  function trimDynamicMobileRows() {
    if (typeof removeMagicInitiateDerivedSpellRows === "function") removeMagicInitiateDerivedSpellRows();
    if (typeof getSpellAreaConfigs === "function") {
      getSpellAreaConfigs().forEach(({ id, level }) => {
        const area = document.getElementById(id);
        if (!area) return;
        const manualRows = [...area.querySelectorAll(":scope > .spell-entry")].filter(row => !row.dataset.spellSource);
        const defaultCount = typeof level === "number" && level >= 4 ? 0 : 1;
        manualRows.slice(defaultCount).forEach(row => row.remove());
        if (typeof refreshSpellRows === "function") refreshSpellRows(id);
      });
    }
    const featArea = document.getElementById("feats-area");
    [...(featArea?.children || [])].slice(2).forEach(row => row.remove());
    if (typeof refreshFeatRows === "function") refreshFeatRows();
  }

  function resetMobileCardForImport(warnings) {
    if (typeof applyStateObject !== "function") {
      mobileImportWarning("角色卡匯入介面尚未載入", warnings);
      return false;
    }
    trimDynamicMobileRows();
    const blankState = {};
    document.querySelectorAll("#main-content input[id], #main-content select[id], #main-content textarea[id]").forEach(element => {
      if (element.type === "checkbox") blankState[element.id] = element.defaultChecked;
      else if (element.tagName === "SELECT") blankState[element.id] = [...element.options].find(option => option.defaultSelected)?.value ?? element.options[0]?.value ?? "";
      else blankState[element.id] = element.defaultValue;
    });
    if (typeof getSpellAreaConfigs === "function") {
      getSpellAreaConfigs().forEach(({ id, level }) => {
        const defaultCount = typeof level === "number" && level >= 4 ? 0 : 1;
        blankState[`${id}-count`] = defaultCount;
        if (defaultCount) {
          blankState[`${id}-class-0`] = "";
          blankState[`${id}-spell-0`] = "";
        }
      });
    }
    blankState["feats-area-count"] = 2;
    blankState["tool-proficiency-list-count"] = 1;
    blankState["tool-proficiency-0"] = "";
    blankState.__deletedSpellRowCache = {};
    applyStateObject(blankState);
    const highLevelSpells = document.getElementById("highlevel-spells");
    if (highLevelSpells) highLevelSpells.style.display = "none";
    return true;
  }

  function fullMobileSpellName(classId, level, spellId) { return SpellCatalog.getSpells(classId, level, spellMode()).some(spell => spell.spellId === spellId) ? spellDisplayName(spellId) : ""; }
  function chooseMobileSpellClass(level, spellId, preferredClass = "") {
    const allowed = level === "cantrips" ? CLASS_ORDER.filter(id => !["barbarian", "fighter", "monk", "paladin", "ranger", "rogue"].includes(id)) : [...SPELLCASTER_CLASS_IDS];
    return [preferredClass, ...allowed].find((classId, index, values) => classId && values.indexOf(classId) === index && fullMobileSpellName(classId, level, spellId)) || "";
  }

  function addManualMobileSpell({ spellId, level, classId }, warnings) {
    const areaId = level === "cantrips" ? "cantrips-area" : `level${level}spells-area`;
    const area = document.getElementById(areaId);
    const sourceClass = chooseMobileSpellClass(level, spellId, classId);
    if (!area || !sourceClass) {
      mobileImportWarning(`法術「${spellNameZh(spellId)}」：找不到可匯入的職業或環位選項`, warnings);
      return false;
    }
    let row = [...area.querySelectorAll(":scope > .spell-entry")].find(candidate => {
      if (candidate.dataset.spellSource) return false;
      return !candidate.querySelector("select[id*='-spell-']")?.value;
    });
    if (!row && typeof createSingleSpellRow === "function") row = createSingleSpellRow(areaId, level);
    const classSelect = row?.querySelector("select[id*='-class-']");
    const spellSelect = row?.querySelector("select[id*='-spell-']");
    if (!classSelect || !spellSelect) {
      mobileImportWarning(`法術「${spellNameZh(spellId)}」：無法建立法術列`, warnings);
      return false;
    }
    classSelect.value = sourceClass;
    dispatchMobileField(classSelect);
    const option = [...spellSelect.options].find(item => item.value === spellId);
    if (!option) {
      mobileImportWarning(`法術「${spellNameZh(spellId)}」：手機角卡目前的法術清單沒有這個選項`, warnings);
      classSelect.value = "";
      dispatchMobileField(classSelect);
      return false;
    }
    spellSelect.value = option.value;
    dispatchMobileField(spellSelect);
    return true;
  }

  function ensureMobileFeatRows(count) {
    const area = document.getElementById("feats-area");
    const getCount = () => typeof getManualFeatRows === "function" ? getManualFeatRows().length : (area?.childElementCount || 0);
    while (area && getCount() < count && typeof createSingleFeatRow === "function") createSingleFeatRow();
    if (typeof refreshFeatRows === "function") refreshFeatRows();
  }

  function setMobileFeat(index, featName, warnings, sourceLabel) {
    ensureMobileFeatRows(index + 1);
    const select = document.getElementById(`feat-${index}`);
    if (!select || ![...select.options].some(option => option.value === featName)) {
      mobileImportWarning(`${sourceLabel || "專長"}「${featName}」：找不到角色卡選項`, warnings);
      return null;
    }
    select.value = featName;
    dispatchMobileField(select);
    return select.closest(".form-row");
  }

  function setMobileMagicInitiate(row, spellClass, cantrips, levelOneSpells, warnings, sourceLabel) {
    if (!row || typeof getMagicInitiateSelect !== "function") return;
    const classSelect = getMagicInitiateSelect(row, "class");
    if (!classSelect || ![...classSelect.options].some(option => option.value === spellClass)) {
      mobileImportWarning(`${sourceLabel}：找不到魔法學徒職業選項`, warnings);
      return;
    }
    classSelect.value = spellClass;
    dispatchMobileField(classSelect);
    [
      ["cantrip1", cantrips?.[0]], ["cantrip2", cantrips?.[1]], ["level1", levelOneSpells?.[0]]
    ].forEach(([field, spellId]) => {
      if (!spellId) return;
      const select = getMagicInitiateSelect(row, field);
      const option = [...(select?.options || [])].find(item => item.value === spellId);
      if (!select || !option) mobileImportWarning(`${sourceLabel}法術「${spellNameZh(spellId)}」：找不到角色卡選項`, warnings);
      else {
        select.value = option.value;
        dispatchMobileField(select);
      }
    });
    if (typeof syncMagicInitiateDerivedSpellRows === "function") syncMagicInitiateDerivedSpellRows();
  }

  function mobileEquipmentItems(selection) {
    return (selection?.content?.items || []).map(item => typeof item === "string" ? item : `${item.name}${Number(item.quantity) > 1 ? ` ×${item.quantity}` : ""}`);
  }

  function hasImportedInitialEquipment(value) {
    return String(value || "").split(/\r?\n/u).some(line => {
      const text = line.trimStart();
      return text.startsWith(MOBILE_INITIAL_EQUIPMENT_PREFIX)
        && text.slice(MOBILE_INITIAL_EQUIPMENT_PREFIX.length).trim().length > 0;
    });
  }

  function importMobileEquipment(warnings) {
    const equipmentSelections = [draft.selections.backgroundEquipment, draft.selections.classEquipment].filter(Boolean);
    const items = equipmentSelections.flatMap(mobileEquipmentItems);
    setMobileField("gear-notes", items.length ? `${MOBILE_INITIAL_EQUIPMENT_PREFIX}${items.join("、")}` : "", warnings, "攜帶物品", "input");
    const currency = { cp: 0, sp: 0, gp: 0, pp: 0 };
    equipmentSelections.forEach(selection => Object.keys(currency).forEach(key => { currency[key] += Number(selection.content?.currency?.[key]) || 0; }));
    Object.entries(currency).forEach(([key, amount]) => setMobileField(`money-balance-${key}`, amount, warnings, `${key} 財產`));
    dispatchMobileField(document.getElementById("money-count-weight"));

    const loadout = draft.selections.classEquipment?.content?.loadout || {};
    setMobileField("mainHand", loadout.mainHand || "", warnings, "主手");
    setMobileField("offHand", loadout.offHand || "", warnings, "副手");
    setMobileField("armor", loadout.armor || "", warnings, "護甲");
    (draft.selections.classEquipment?.content?.specialWrites || []).forEach(operation => {
      if (operation.field === "offHandAttackNote" && operation.note) setMobileField("atk-off-note", operation.note, warnings, "副手備註", "input");
      if (operation.field === "offHandAttack") {
        const note = [operation.name, operation.note].filter(Boolean).join("：");
        if (note) setMobileField("atk-off-note", note, warnings, "副手備註", "input");
      }
    });
  }

  function importMobileRaceOptions(warnings) {
    const raceId = draft.choices.race;
    const mapping = MOBILE_RACE_OPTION_VALUES[raceId];
    if (mapping) {
      const sourceValue = draft.choices.raceOptions?.[mapping.choice];
      const value = mapping.values[sourceValue];
      if (!value) mobileImportWarning(`${RACE_LABELS[raceId]}選項「${sourceValue || "未選擇"}」：無法對應角色卡`, warnings);
      else setMobileField(mapping.field, value, warnings, `${RACE_LABELS[raceId]}選項`);
    }
    if (raceId === "elf" && draft.choices.raceOptions?.lineage === "高等精靈血統" && draft.choices.raceOptions?.cantrip) {
      const select = document.getElementById("high-elf-cantrip");
      const option = [...(select?.options || [])].find(item => item.value === draft.choices.raceOptions.cantrip);
      if (!select || !option) mobileImportWarning(`高等精靈戲法「${draft.choices.raceOptions.cantrip}」：找不到角色卡選項`, warnings);
      else { select.value = option.value; dispatchMobileField(select); }
    }
  }

  function importMobileClassOptions(warnings) {
    const classTypeMap = {
      "cleric:guardian": "cleric-guardian", "cleric:thaumaturge": "cleric-trickster",
      "druid:magician": "druid-shaman", "druid:warden": "druid-sentinel"
    };
    const classTypeKey = draft.choices.class === "druid"
      ? `druid:${draft.selections.levelOne?.content?.classOption || ""}`
      : `${draft.choices.class}:${draft.choices.classOptions?.classType || ""}`;
    const checkboxId = classTypeMap[classTypeKey];
    if (checkboxId) {
      const checkbox = document.getElementById(checkboxId);
      if (!checkbox) mobileImportWarning(`職業選項：找不到「${classTypeKey}」對應欄位`, warnings);
      else { checkbox.checked = true; dispatchMobileField(checkbox); }
    }
    const levelOneContent = draft.selections.levelOne?.content || {};
    if ((levelOneContent.invocations || []).includes("pact-of-the-tome") && typeof window.setPactTomeSpellSelection === "function") {
      window.setPactTomeSpellSelection(levelOneContent.tome, { sync: false });
    }
    (levelOneContent.invocations || []).forEach(id => {
      const label = ELDRITCH_INVOCATION_OPTIONS.find(option => option.id === id)?.label || id;
      const checkbox = [...document.querySelectorAll("#eldritch-invocations-output input[data-invocation-name]")]
        .find(input => input.dataset.invocationName === label);
      if (!checkbox) mobileImportWarning(`魔能祈喚「${label}」：找不到角色卡選項`, warnings);
      else { checkbox.checked = true; dispatchMobileField(checkbox); }
    });
  }

  function importMobileSkillsAndLanguages(warnings) {
    const expertise = new Set((draft.acquisitions.expertise || []).map(item => item.name));
    const skills = new Set((draft.acquisitions.skills || []).map(item => item.name));
    skills.forEach(name => {
      const id = expertise.has(name) ? `exp-${name}` : `prof-${name}`;
      const checkbox = document.getElementById(id);
      if (!checkbox) mobileImportWarning(`技能「${name}」：找不到角色卡欄位`, warnings);
      else { checkbox.checked = true; dispatchMobileField(checkbox); }
    });
    expertise.forEach(name => {
      if (skills.has(name)) return;
      mobileImportWarning(`專精「${name}」：draft 沒有對應的技能熟練來源`, warnings);
    });
    const toolNames = [...new Set((draft.acquisitions.tools || []).map(item => item.name).filter(Boolean))];
    const skillBonuses = (draft.acquisitions.skillBonuses || []).map(item => `${item.name}（${item.source?.feature || item.source?.label || "職業能力"}）`);
    const backgroundTool = draft.selections.background?.content?.tool || draft.choices.backgroundToolChoice || "";
    if (typeof window.replaceToolProficiencies === "function") {
      window.replaceToolProficiencies(toolNames, { backgroundTool });
    } else {
      mobileImportWarning("找不到工具熟練匯入介面", warnings);
    }
    const skillNotes = [skillBonuses.length ? `技能額外加值：${skillBonuses.join("、")}` : ""].filter(Boolean);
    setMobileField("skill-extra", skillNotes.join("；"), warnings, "技能筆記", "input");

    const languageDetails = draft.selections.levelOne?.content?.languageDetails || [];
    languageDetails.forEach(item => setMobileField(item.fieldId, item.value, warnings, item.category === "class-extra" ? "職業額外語言" : `語言 ${item.slot + 1}`));
  }

  function importMobileFeats(warnings) {
    let nextFeatIndex = 0;
    const backgroundMagic = draft.choices.backgroundMagic || {};
    if (["acolyte", "sage"].includes(draft.choices.background)) {
      const row = document.getElementById("derived-feat-background")?.closest(".form-row");
      setMobileMagicInitiate(row, spellSourceForBackground(draft.choices.background), backgroundMagic.cantrips, backgroundMagic.levelOneSpells, warnings, "背景魔法學徒");
    }
    if (draft.choices.race === "human" && draft.choices.raceOptions?.feat) {
      const feat = draft.choices.raceOptions.feat;
      const row = setMobileFeat(nextFeatIndex++, feat, warnings, "人類起源專長");
      if (feat === "魔法學徒") {
        const options = draft.choices.raceOptions.featOptions || {};
        setMobileMagicInitiate(row, options.spellClass, options.cantrips, options.levelOneSpells, warnings, "人類魔法學徒");
      }
    }
    const fightingStyle = draft.selections.levelOne?.content?.fightingStyle;
    if (fightingStyle) {
      const select = document.getElementById(`derived-feat-fighting-style-${draft.choices.class}`);
      if (!select || ![...select.options].some(option => option.value === fightingStyle)) {
        mobileImportWarning(`戰鬥風格「${fightingStyle}」：找不到角色卡選項`, warnings);
      } else {
        select.value = fightingStyle;
        dispatchMobileField(select);
      }
    }
  }

  function importMobileSpells(warnings) {
    const content = draft.selections.levelOne?.content || {};
    (content.cantrips || []).forEach(spellId => addManualMobileSpell({ spellId, level: "cantrips", classId: draft.choices.class }, warnings));
    (content.preparedSpells || []).forEach(spellId => addManualMobileSpell({ spellId, level: 1, classId: draft.choices.class }, warnings));
    if (content.spellbookSpells?.length) {
      const note = `法術書（一環）：${content.spellbookSpells.map(spellId => {
        const acquisition = (draft.acquisitions.spells || []).find(item => item.content?.spellbook && item.spellId === spellId);
        return `${spellNameZh(spellId)}${acquisition?.content?.ritual ? "（儀式）" : ""}`;
      }).join("、")}`;
      setMobileField("spell-notes", note, warnings, "法術筆記", "input");
    }
    if (typeof syncOriginAndSubclassDerivedSpellRows === "function") syncOriginAndSubclassDerivedSpellRows();
    if (typeof updatePickedSpellBoxes === "function") updatePickedSpellBoxes();
  }

  function finishMobileImport(warnings) {
    if (typeof fillSaves === "function") fillSaves();
    else mobileImportWarning("無法執行「計算屬性豁免」", warnings);
    const calculateSkillsButton = document.getElementById("calculate-skills-button");
    if (calculateSkillsButton) calculateSkillsButton.click();
    else mobileImportWarning("找不到「計算技能加值」按鈕", warnings);
    const automation = document.getElementById("weapon-attack-automation");
    if (automation) {
      automation.checked = true;
      dispatchMobileField(automation);
    } else mobileImportWarning("找不到武器攻擊自動化開關", warnings);
    if (typeof populateHandAttacks === "function") populateHandAttacks({ force: true });
    if (typeof updateSpellCastingStats === "function") updateSpellCastingStats();
    if (typeof saveAllFields === "function") saveAllFields();
  }

  function importDraftToMobileCard() {
    if (!window.confirm("匯入角色卡會清空玩家目前在手機角卡中的所有資料，且無法復原。確定要繼續嗎？")) return;
    saveDraft();
    const warnings = [];
    if (!resetMobileCardForImport(warnings)) {
      window.alert(`匯入失敗。\n\n${warnings.join("\n")}`);
      return;
    }
    if (typeof SHARE_MODE !== "undefined") {
      SHARE_MODE = false;
      window.SHARE_MODE = false;
    }
    if (location.hash.startsWith("#s=") || location.hash.startsWith("#s2=")) {
      history.replaceState(null, "", `${location.pathname}${location.search}`);
    }
    let completed = false;
    try {
      setMobileField("background", draft.choices.background, warnings, "背景");
      setMobileField("class", draft.choices.class, warnings, "職業");
      setMobileField("level", 1, warnings, "等級");
      setMobileField("lifedicen", 1, warnings, "生命骰");
      setMobileField("race", draft.choices.race, warnings, "種族");
      setMobileField("alignment", draft.choices.alignment, warnings, "陣營");
      importMobileRaceOptions(warnings);
      const importedCharacterSize = draft.choices.raceOptions?.size;
      if (importedCharacterSize && typeof window.setCharacterSize === "function") {
        window.setCharacterSize(importedCharacterSize);
      }
      ABILITY_ORDER.forEach(key => setMobileField(key, draft.selections.class?.content?.totals?.[key], warnings, `${ABILITY_LABELS[key]}屬性`, "input"));
      if (draft.choices.spellcastingAbility) setMobileField("spellcasting-ability", draft.choices.spellcastingAbility, warnings, "施法屬性");
      importMobileClassOptions(warnings);
      importMobileFeats(warnings);
      importMobileSkillsAndLanguages(warnings);
      importMobileEquipment(warnings);
      importMobileSpells(warnings);
      finishMobileImport(warnings);
      completed = true;
    } catch (error) {
      console.warn("創角小幫手匯入角色卡時發生錯誤：", error);
      mobileImportWarning(`匯入流程中斷：${error?.message || "未知錯誤"}`, warnings);
    }
    closeWizard();
    const warningText = warnings.length ? `\n\n第一輪未完成／已略過：\n${warnings.map(item => `• ${item}`).join("\n")}` : "\n\n第一輪沒有偵測到略過項目。";
    const resultText = completed
      ? "角色卡匯入完成。已計算屬性豁免與技能加值、匯入技能熟練與專精，並開啟武器攻擊自動化；巫祝與魔術使的技能額外加值也已納入計算。"
      : "角色卡只完成部分匯入，請依下列問題檢查。";
    window.alert(`${resultText}${warningText}`);
  }

  function selectedChoiceForGroup(group) {
    if (group === "background") return draft.choices.background;
    if (group === "race") return draft.choices.race;
    if (group === "class") return draft.choices.class;
    return null;
  }

  function choiceGroupForCard(card) {
    if (card.dataset.background) return "background";
    if (card.dataset.race) return "race";
    if (card.dataset.classChoice) return "class";
    return null;
  }

  function handleChoiceCardSelection(group, value, choose) {
    pendingChoiceCardScrollGroup = group;
    if (selectedChoiceForGroup(group) === value) {
      if (expandedChoiceGroups.has(group)) expandedChoiceGroups.delete(group);
      else expandedChoiceGroups.add(group);
      render(true);
      return;
    }
    expandedChoiceGroups.delete(group);
    choose(value);
  }

  function cleanFlowSection(section) {
    section.querySelectorAll(".quick-build-card").forEach(card => {
      const selected = card.hasAttribute("data-background") && card.dataset.background === draft.choices.background ||
        card.hasAttribute("data-race") && card.dataset.race === draft.choices.race ||
        card.hasAttribute("data-class-choice") && card.dataset.classChoice === draft.choices.class ||
        card.hasAttribute("data-class-type-choice") && card.dataset.classTypeChoice === draft.choices.classOptions?.classType ||
        card.hasAttribute("data-class-equipment-method") && card.dataset.classEquipmentMethod === draft.choices.classEquipmentMethod;
      card.classList.toggle("is-selected", selected);
      card.setAttribute("aria-pressed", String(selected));
      const group = choiceGroupForCard(card);
      if (group && selectedChoiceForGroup(group)) {
        const expanded = expandedChoiceGroups.has(group);
        card.classList.toggle("is-choice-hidden", !selected && !expanded);
        if (selected) {
          card.setAttribute("aria-expanded", String(expanded));
          card.insertAdjacentHTML("beforeend", `<span class="quick-build-card-toggle-hint">${expanded ? "再次點擊可收合其他選項" : "再次點擊可展開其他選項"}</span>`);
        }
      }
    });
    section.querySelectorAll("[data-class-equipment-method]").forEach(button => {
      const selected = button.dataset.classEquipmentMethod === draft.choices.classEquipmentMethod;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    section.querySelectorAll(".quick-build-background-grid,.quick-build-class-grid").forEach(grid => {
      const selected = grid.querySelector(".quick-build-card.is-selected");
      const group = selected && choiceGroupForCard(selected);
      if (selected && group && expandedChoiceGroups.has(group)) grid.prepend(selected);
      grid.classList.toggle("is-choice-collapsed", Boolean(grid.querySelector(".is-choice-hidden")));
    });
    section.querySelectorAll("[data-wealth]").forEach(button => {
      const selected = button.dataset.wealth === draft.choices.backgroundWealth;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    return section;
  }

  function appendFlowSection(body, renderer, id) {
    const section = document.createElement("section");
    section.className = "quick-build-flow-section";
    section.dataset.flowSection = id;
    renderer(section);
    cleanFlowSection(section);
    body.appendChild(section);
    return section;
  }

  function renderBackgroundEdit(body) {
    appendFlowSection(body, renderBackgroundCards, "background-choice");
    if (!draft.choices.background) return;
    if (draft.choices.background === "soldier") appendFlowSection(body, renderBackgroundToolChoice, "background-tool");
    if (["acolyte", "sage"].includes(draft.choices.background)) appendFlowSection(body, renderBackgroundSpells, "background-spells");
  }

  function renderRaceEdit(body) {
    appendFlowSection(body, renderRaceCards, "race-choice");
    if (!draft.choices.race || ["dwarf", "halfling", "orc"].includes(draft.choices.race)) return;
    appendFlowSection(body, renderRaceOptions, "race-options");
  }

  function renderClassEdit(body) {
    appendFlowSection(body, renderClassCards, "class-choice");
    const key = draft.choices.class;
    if (!key) return;
    const typeRequired = Boolean(CLASS_TYPE_OPTIONS[key]?.length);
    if (typeRequired) appendFlowSection(body, renderClassType, "class-type");
    if (typeRequired && !draft.choices.classOptions?.classType) return;
    appendFlowSection(body, renderClassAbilities, "class-abilities");
    if (!classAbilitiesComplete()) return;
    if (hasDraftSpellcasting()) {
      appendFlowSection(body, renderClassSpellcasting, "class-spellcasting");
      if (!draft.choices.spellcastingAbility) return;
    }
    appendFlowSection(body, renderClassProficiencies, "class-proficiencies");
  }

  function renderEquipmentEdit(body) {
    appendFlowSection(body, renderEquipmentMethod, "equipment-method");
    if (!draft.choices.classEquipmentMethod) return;
    if (draft.choices.classEquipmentMethod !== "gold") {
      const equipmentPackage = selectedClassEquipmentPackage(draft);
      if (equipmentPackage && equipmentNeedsConfiguration(equipmentPackage)) {
        appendFlowSection(body, renderEquipmentConfiguration, "equipment-configuration");
      }
    }
    if (!classEquipmentComplete()) return;
    appendFlowSection(body, renderBackgroundEquipment, "equipment-background");
  }

  function levelOneStageComplete(stage) {
    const definition = LEVEL_ONE_DEFINITIONS[draft.choices.class] || {};
    const choices = draft.choices.levelOne || {};
    if (stage === "options") {
      return (!definition.classOption || Boolean(choices.classOption)) &&
        (!definition.fightingStyle || Boolean(choices.fightingStyle)) &&
        (!definition.invocations || (choices.invocations || []).filter(Boolean).length === definition.invocations);
    }
    if (stage === "languages") {
      const values = (choices.languages || []).filter(Boolean);
      return values.length === (definition.languages || 0) && new Set(values).size === values.length;
    }
    if (stage === "spells") {
      const completeGroup = (values, count) => {
        const selected = (Array.isArray(values) ? values : []).filter(Boolean);
        return selected.length === count && new Set(selected).size === count;
      };
      return completeGroup(choices.cantrips, levelOneCantripCount(draft, definition)) &&
        completeGroup(choices.spellbookSpells, definition.spellbookSpells || 0) &&
        completeGroup(choices.preparedSpells, definition.preparedSpells || 0) &&
        (!(choices.invocations || []).includes("pact-of-the-tome") || pactTomeSelectionComplete(choices.tome));
    }
    if (stage === "mastery") {
      const values = (choices.weaponMasteries || []).filter(Boolean);
      return values.length === (definition.weaponMastery || 0) && new Set(values).size === values.length;
    }
    if (stage === "expertise") {
      const valid = new Set(expertiseSkillOptions(draft));
      const values = (choices.expertise || []).filter(name => valid.has(name));
      return values.length === (definition.expertise || 0) && new Set(values).size === values.length;
    }
    return true;
  }

  function renderLevelOneEdit(body) {
    const renderers = {
      options: renderLevelOneOptions,
      languages: renderLevelOneLanguages,
      spells: renderLevelOneSpells,
      mastery: renderLevelOneMastery,
      expertise: renderLevelOneExpertise
    };
    const stages = levelOneStages().filter(stage => stage !== "summary");
    if (!stages.length) {
      appendFlowSection(body, section => {
        section.innerHTML = `<div class="quick-build-complete"><strong>${escapeHtml(CLASS_LABELS[draft.choices.class] || "此職業")}的 1 級職業選擇已自動備妥。</strong></div>`;
      }, "level-one-ready");
    } else {
      for (const stage of stages) {
        appendFlowSection(body, renderers[stage], `level-one-${stage}`);
        if (!levelOneStageComplete(stage)) return;
      }
    }
    appendFlowSection(body, renderLevelOneAlignment, "level-one-alignment");
  }

  function renderStepReview(body, renderer) {
    renderer(body);
    cleanFlowSection(body);
    if (!body.querySelector(".quick-build-duplicate-warning")) body.insertAdjacentHTML("beforeend", duplicateReviewWarning());
  }

  const STEP_REGISTRY = new Map([
    ["background", { id: "background", title: "背景", renderEdit: renderBackgroundEdit, renderReview: body => renderStepReview(body, renderBackgroundComplete), isComplete: backgroundComplete }],
    ["race", { id: "race", title: "種族", renderEdit: renderRaceEdit, renderReview: body => renderStepReview(body, renderRaceComplete), isComplete: raceComplete }],
    ["class", { id: "class", title: "職業與屬性", renderEdit: renderClassEdit, renderReview: body => renderStepReview(body, renderClassSummary), isComplete: classComplete }],
    ["equipment", { id: "equipment", title: "裝備", renderEdit: renderEquipmentEdit, renderReview: body => renderStepReview(body, renderEquipmentComplete), isComplete: equipmentComplete }],
    ["level-one", { id: "level-one", title: "完成 1 級", renderEdit: renderLevelOneEdit, renderReview: body => renderStepReview(body, renderLevelOneSummary), isComplete: levelOneComplete }],
    ["level-one-review", { id: "level-one-review", title: "1 級總覽", renderReview: renderLevelOneReview, isComplete: () => true }]
  ]);

  function stableSignature(value) {
    const normalize = item => {
      if (Array.isArray(item)) return item.map(normalize);
      if (!isPlainObject(item)) return item;
      return Object.fromEntries(Object.keys(item).sort().map(key => [key, normalize(item[key])]));
    };
    return JSON.stringify(normalize(value));
  }

  function sortedStrings(values) {
    return (Array.isArray(values) ? values : []).filter(Boolean).map(String).sort((left, right) => left.localeCompare(right, "zh-Hant"));
  }

  function semanticChoiceValue(value, excludedKeys = new Set()) {
    if (Array.isArray(value)) return value.map(item => semanticChoiceValue(item, excludedKeys));
    if (!isPlainObject(value)) return value;
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !excludedKeys.has(key))
      .map(([key, item]) => [key, semanticChoiceValue(item, excludedKeys)]));
  }

  function normalizedCurrency(currency) {
    return Object.fromEntries(["cp", "sp", "gp", "pp"].map(key => [key, Number(currency?.[key]) || 0]));
  }

  function normalizedEquipmentItems(items) {
    return (Array.isArray(items) ? items : []).map(item => typeof item === "string"
      ? { name: item, quantity: 1 }
      : { name: String(item?.name || ""), quantity: Number(item?.quantity) || 1 })
      .filter(item => item.name)
      .sort((left, right) => left.name.localeCompare(right.name, "zh-Hant") || left.quantity - right.quantity);
  }

  function equipmentSelectionSignature(selection) {
    const content = selection?.content;
    if (!content) return null;
    return {
      method: content.method || null,
      items: normalizedEquipmentItems(content.items),
      currency: normalizedCurrency(content.currency),
      loadout: semanticChoiceValue(content.loadout || {}),
      specialWrites: semanticChoiceValue(content.specialWrites || []),
      operationOrder: semanticChoiceValue(content.operationOrder || [])
    };
  }

  function acquisitionEffectSignature(type, sourceTypes, target = draft) {
    const allowedSources = new Set(sourceTypes);
    return (target.acquisitions?.[type] || [])
      .filter(item => allowedSources.has(item.sourceType))
      .map(item => ({
        name: item.name || "",
        content: semanticChoiceValue(item.content || {}, new Set(["crossSourceDuplicate", "fieldId"]))
      }))
      .sort((left, right) => stableSignature(left).localeCompare(stableSignature(right), "zh-Hant"));
  }

  // 綠背確認只追蹤會改變角色結果的內容；來源名稱與重複提示會即時更新，但不會使步驟失效。
  function stepEffectiveSignature(stepId, target = draft) {
    if (stepId === "background") {
      return stableSignature({
        background: target.choices.background || null,
        tool: target.choices.backgroundToolChoice || null,
        cantrips: sortedStrings(target.choices.backgroundMagic?.cantrips),
        levelOneSpells: sortedStrings(target.choices.backgroundMagic?.levelOneSpells)
      });
    }
    if (stepId === "race") {
      return stableSignature({
        race: target.choices.race || null,
        options: semanticChoiceValue(target.choices.raceOptions || {})
      });
    }
    if (stepId === "class") {
      const content = target.selections.class?.content || {};
      return stableSignature({
        class: target.choices.class || null,
        classType: content.classType || null,
        abilities: semanticChoiceValue(content.abilities || {}),
        backgroundAbilityBonuses: semanticChoiceValue(content.backgroundAbilityBonuses || {}),
        spellcastingAbility: content.spellcastingAbility || null,
        saves: sortedStrings(content.saves),
        skills: sortedStrings(content.skills),
        tools: sortedStrings(content.tools),
        weaponProficiencies: content.weaponProficiencies || null,
        armorTraining: content.armorTraining || null,
        skillBonuses: acquisitionEffectSignature("skillBonuses", ["class"], target)
      });
    }
    if (stepId === "equipment") {
      return stableSignature({
        classEquipment: equipmentSelectionSignature(target.selections.classEquipment),
        backgroundEquipment: equipmentSelectionSignature(target.selections.backgroundEquipment)
      });
    }
    if (stepId === "level-one") {
      const content = target.selections.levelOne?.content || {};
      return stableSignature({
        class: target.choices.class || null,
        fixed: sortedStrings(content.fixed),
        classOption: content.classOption || null,
        cantrips: sortedStrings(content.cantrips),
        spellbookSpells: sortedStrings(content.spellbookSpells),
        preparedSpells: sortedStrings(content.preparedSpells),
        weaponMasteries: sortedStrings(content.weaponMasteries),
        fightingStyle: content.fightingStyle || null,
        expertise: sortedStrings(content.expertise),
        languages: sortedStrings(content.languages),
        invocations: sortedStrings(content.invocations),
        tome: {
          cantrips: sortedStrings(content.tome?.cantrips),
          rituals: sortedStrings(content.tome?.rituals)
        },
        alignment: content.alignment || null,
        skillBonuses: acquisitionEffectSignature("skillBonuses", ["class", "level-one"], target)
      });
    }
    return null;
  }

  function stepHasValidConfirmation(stepId, target = draft) {
    const step = STEP_REGISTRY.get(stepId);
    const savedSignature = target.ui?.confirmedStepSignatures?.[stepId];
    return Boolean(step && stepId !== "level-one-review" && savedSignature && step.isComplete?.(target) && savedSignature === stepEffectiveSignature(stepId, target));
  }

  function viewForStep(stepId, target = draft) {
    return stepId === "level-one-review" || stepHasValidConfirmation(stepId, target) ? "review" : "edit";
  }

  function confirmStep(stepId, target = draft) {
    const signature = stepEffectiveSignature(stepId, target);
    if (!signature) return;
    target.ui.confirmedStepSignatures = { ...target.ui.confirmedStepSignatures, [stepId]: signature };
  }

  function currentStepDefinition() {
    return STEP_REGISTRY.get(draft.ui.currentStepId) || null;
  }

  function stepIsComplete(step) {
    const activeStep = arguments.length ? step : currentStepDefinition();
    return Boolean(activeStep?.isComplete?.(draft));
  }

  function renderPlaceholder(body, step) {
    const steps = activeSteps(draft);
    body.innerHTML = `<h3>${step.title}</h3><p class="quick-build-lead">此等級步驟尚未提供規則內容。</p><ol class="quick-build-plan">${steps.map(item => `<li class="${item.id === draft.ui.currentStepId ? "current" : ""}">${item.title}</li>`).join("")}</ol>`;
  }

  function render(preserveBodyScroll = false) {
    const modal = ensureWizard();
    const nextButton = modal.querySelector(".quick-build-next");
    const nextWasDisabled = nextButton.disabled;
    const steps = activeSteps(draft);
    const stepIndex = Math.max(0, steps.findIndex(item => item.id === draft.ui.currentStepId));
    const stepMeta = steps[stepIndex] || steps[0];
    const step = STEP_REGISTRY.get(stepMeta.id);
    if (stepMeta.id !== "level-one-review" && draft.ui.view === "review" && !stepHasValidConfirmation(stepMeta.id)) {
      draft.ui = { ...draft.ui, view: "edit" };
    }
    const workflowSteps = steps.filter(item => item.id !== "level-one-review");
    const workflowIndex = workflowSteps.findIndex(item => item.id === stepMeta.id);
    modal.querySelector(".quick-build-progress").textContent = stepMeta.id === "level-one-review"
      ? "1 級總覽"
      : `步驟 ${workflowIndex + 1} / ${workflowSteps.length}：${stepMeta.title}${draft.ui.view === "review" ? "（確認）" : ""}`;
    const body = modal.querySelector(".quick-build-body");
    const previousScrollTop = preserveBodyScroll ? body.scrollTop : 0;
    const focusedFieldId = preserveBodyScroll && body.contains(document.activeElement) ? document.activeElement?.id : "";
    const previousFlowSections = new Set([...body.querySelectorAll("[data-flow-section]")].map(section => section.dataset.flowSection));
    body.innerHTML = "";
    body.classList.toggle("is-review", draft.ui.view === "review" || stepMeta.id === "level-one-review");
    if (!step) renderPlaceholder(body, stepMeta);
    else if (stepMeta.id === "level-one-review") step.renderReview(body);
    else if (draft.ui.view === "review") step.renderReview(body);
    else step.renderEdit(body);
    if (!TOOL_CATALOG_AVAILABLE) {
      body.insertAdjacentHTML(
        "afterbegin",
        '<div class="quick-build-warning" role="alert"><strong>工具資料載入失敗</strong><br>創角小幫手仍可使用，但士兵賭具、吟遊詩人與武僧的工具選擇，以及「熟習」的工具選項目前不可用。請重新載入頁面；若問題持續，請確認 tool-data.js 可正常載入。</div>'
      );
    }
    body.scrollTop = preserveBodyScroll ? previousScrollTop : 0;
    if (focusedFieldId) {
      const field = body.querySelector(`#${CSS.escape(focusedFieldId)}`);
      field?.focus?.({ preventScroll: true });
    }
    const newlyRevealed = [...body.querySelectorAll("[data-flow-section]")]
      .find(section => !previousFlowSections.has(section.dataset.flowSection));
    if (newlyRevealed) {
      newlyRevealed.classList.add("is-newly-revealed");
    }
    const cardScrollTarget = pendingChoiceCardScrollGroup
      ? body.querySelector(`.quick-build-card.is-selected[data-${pendingChoiceCardScrollGroup === "class" ? "class-choice" : pendingChoiceCardScrollGroup}]`)
      : null;
    const scrollTarget = cardScrollTarget || newlyRevealed;
    pendingChoiceCardScrollGroup = null;
    if (preserveBodyScroll && previousFlowSections.size && scrollTarget) {
      const reveal = () => {
        const targetTop = body.scrollTop + scrollTarget.getBoundingClientRect().top - body.getBoundingClientRect().top - 16;
        const reducedMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        body.scrollTo({ top: Math.max(0, targetTop), behavior: reducedMotion ? "auto" : "smooth" });
      };
      if (typeof requestAnimationFrame === "function") requestAnimationFrame(reveal);
      else reveal();
    }
    const previous = modal.querySelector(".quick-build-previous");
    const modify = modal.querySelector(".quick-build-modify");
    const next = nextButton;
    modal.querySelector(".quick-build-footer").hidden = stepMeta.id === "level-one-review";
    previous.disabled = stepIndex === 0;
    modify.hidden = draft.ui.view !== "review";
    next.disabled = draft.ui.view === "edit" && !stepIsComplete(step);
    next.classList.toggle("primary", !next.disabled);
    next.classList.toggle("is-ready", nextWasDisabled && !next.disabled);
    next.textContent = "下一步";
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => syncAbilitySummaryWrapping(modal));
    else syncAbilitySummaryWrapping(modal);
  }

  function syncAbilitySummaryWrapping(root = document) {
    root.querySelectorAll(".quick-build-ability-summary").forEach(summary => {
      summary.classList.remove("wrap-all");
      const wrapped = [...summary.querySelectorAll(".quick-build-ability-summary-row")].some(row => {
        const [value, modifier] = row.children;
        return value && modifier && modifier.offsetTop >= value.offsetTop + value.offsetHeight;
      });
      summary.classList.toggle("wrap-all", wrapped);
    });
  }

  function chooseBackground(key) {
    if (!BACKGROUND_ORDER.includes(key) || !backgroundData(key)) return;
    if (draft.choices.background === key) return;
    const backgroundChanged = Boolean(draft.choices.background && draft.choices.background !== key);
    const backgroundChangedAfterClassComplete = Boolean(backgroundChanged && classComplete(draft));
    const nextBackgroundAbilities = displayList(backgroundData(key).屬性).split("、").filter(Boolean);
    const preservedBonuses = normalizeBackgroundBonuses(draft.choices.backgroundAbilityBonuses, nextBackgroundAbilities);
    const bonusesRemainComplete = backgroundBonusTotal(preservedBonuses) === 3;
    draft.choices.background = key;
    // 保留裝備取得方式與仍合法的下游選擇；後續由有效內容簽章判斷哪些綠背需要重看。
    draft.choices.backgroundAbilityBonuses = preservedBonuses;
    const blockedSpellClass = HUMAN_MAGIC_INITIATE_BLOCKED_CLASS_BY_BACKGROUND[key];
    if (draft.choices.raceOptions?.feat === "魔法學徒" && draft.choices.raceOptions.featOptions?.spellClass === blockedSpellClass) {
      draft.choices.raceOptions = { ...draft.choices.raceOptions, featOptions: {} };
    }
    if (backgroundChangedAfterClassComplete) {
      draft.choices.classOptions = {
        ...draft.choices.classOptions,
        abilitiesCustomized: true,
        backgroundBonusInvalidated: !bonusesRemainComplete
      };
    }
    clearFutureLevelChoices();
    saveDraft();
    render(true);
  }

  function chooseRace(key) {
    if (!RACE_ORDER.includes(key) || !raceData(key)) return;
    if (draft.choices.race === key) return;
    draft.choices.race = key;
    draft.choices.raceOptions = {};
    clearFutureLevelChoices();
    saveDraft();
    render(true);
  }

  function clearFutureLevelChoices() {
    draft.choices.targetLevel = 1;
    draft.choices.levelUps = [];
  }

  function chooseClass(key) {
    if (!CLASS_ORDER.includes(key) || !CLASS_BUILD_DEFINITIONS[key]) return;
    if (draft.choices.class === key) return;
    draft.choices.class = key;
    draft.choices.abilityMethod = "class-default-customized";
    draft.choices.abilities = { ...DEFAULT_ABILITIES_BY_CLASS[key] };
    draft.choices.backgroundAbilityBonuses = normalizeBackgroundBonuses(draft.choices.backgroundAbilityBonuses, draft.choices.backgroundAbilities);
    draft.choices.classOptions = { classType: null, skills: [], tools: [], spellcastingAbilityManual: false };
    if (!CLASS_TYPE_OPTIONS[key]?.length) applyDefaultClassAbilityPreset(draft);
    draft.choices.classEquipmentMethod = null;
    draft.choices.classEquipment = [];
    draft.choices.defaultWeapon = null;
    draft.choices.classEquipmentOptions = {};
    draft.choices.levelOne = {};
    draft.choices.targetLevel = 1;
    draft.choices.levelUps = [];
    const castingSource = spellcastingSourceForDraft(draft);
    draft.choices.spellcastingAbility = castingSource ? castingSource.fixedAbility || preferredMentalAbility(draft) : null;
    saveDraft();
    render(true);
  }

  function chooseClassType(type) {
    const key = draft.choices.class;
    if (!CLASS_TYPE_OPTIONS[key]?.some(option => option.id === type)) return;
    if (draft.choices.classOptions?.classType === type) return;
    draft.choices.classOptions = { ...draft.choices.classOptions, classType: type, skills: [], tools: [], abilitiesCustomized: false };
    draft.choices.levelOne = {};
    draft.choices.targetLevel = 1;
    draft.choices.levelUps = [];
    applyDefaultClassAbilityPreset(draft);
    const castingSource = spellcastingSourceForDraft(draft);
    draft.choices.spellcastingAbility = castingSource ? castingSource.fixedAbility || preferredMentalAbility(draft) : null;
    saveDraft();
    render(true);
  }

  function updateClassAbility(event) {
    const baseKey = event.currentTarget.dataset.classAbilityBase;
    const bonusKey = event.currentTarget.dataset.classAbilityBonus;
    const adjustment = Number(event.currentTarget.dataset.abilityAdjustment || 0);
    const value = Number(event.currentTarget.value || (baseKey
      ? draft.choices.abilities[baseKey] + adjustment
      : (draft.choices.backgroundAbilityBonuses[bonusKey] || 0) + adjustment));
    if (baseKey && ABILITY_ORDER.includes(baseKey) && Number.isInteger(value) && value >= 8 && value <= 15) {
      const next = { ...draft.choices.abilities, [baseKey]: value };
      if (abilityPointCost(next) <= 27) draft.choices.abilities = next;
    }
    if (bonusKey && ABILITY_ORDER.includes(bonusKey) && Number.isInteger(value) && value >= 0 && value <= 2) {
      const allowed = new Set((draft.choices.backgroundAbilities || []).map(label => ABILITY_KEYS_BY_LABEL[label]));
      const next = { ...draft.choices.backgroundAbilityBonuses, [bonusKey]: value };
      if (allowed.has(bonusKey) && backgroundBonusTotal(next) <= 3) draft.choices.backgroundAbilityBonuses = next;
    }
    draft.choices.classOptions = {
      ...draft.choices.classOptions,
      abilitiesCustomized: true,
      backgroundBonusInvalidated: classAbilitiesComplete() ? false : draft.choices.classOptions.backgroundBonusInvalidated
    };
    saveDraft();
    render(true);
  }

  function updateClassSpellcasting(event) {
    const ability = event.currentTarget.value;
    const castingSource = spellcastingSourceForDraft(draft);
    if (!castingSource || castingSource.type === "class" || !["int", "wis", "cha"].includes(ability)) return;
    draft.choices.spellcastingAbility = ability;
    draft.choices.classOptions = { ...draft.choices.classOptions, spellcastingAbilityManual: true };
    saveDraft();
    render(true);
  }

  function updateClassProficiencies() {
    const body = ensureWizard().querySelector(".quick-build-body");
    const skills = [...body.querySelectorAll("[data-class-skill]")].map(select => select.value || "");
    const tools = [...body.querySelectorAll("[data-class-tool]")].map(select => select.value || "");
    draft.choices.classOptions = { ...draft.choices.classOptions, skills, tools };
    saveDraft();
    render(true);
  }

  function chooseClassEquipmentMethod(method) {
    const definition = CLASS_EQUIPMENT_DEFINITIONS[draft.choices.class];
    if (!definition || !definition.defaults.map(option => option.id).concat("gold").includes(method)) return;
    if (draft.choices.classEquipmentMethod === method) return;
    draft.choices.classEquipmentMethod = method;
    draft.choices.classEquipment = [];
    draft.choices.defaultWeapon = null;
    draft.choices.classEquipmentOptions = {};
    draft.choices.levelOne = { ...(draft.choices.levelOne || {}), weaponMasteries: [] };
    saveDraft();
    render(true);
  }

  function updateClassEquipmentOptions() {
    const body = ensureWizard().querySelector(".quick-build-body");
    const previous = draft.choices.classEquipmentOptions || {};
    const mainHand = body.querySelector("[data-equipment-main]")?.value || previous.mainHand || null;
    const equipmentPackage = selectedClassEquipmentPackage(draft);
    const offCandidates = mainHand ? (equipmentPackage?.off?.[mainHand] || []) : [];
    const selectedOff = body.querySelector("[data-equipment-off]")?.value || null;
    const offHand = offCandidates.includes(selectedOff) ? selectedOff : offCandidates.length === 1 ? offCandidates[0] : null;
    const instrument = body.querySelector("[data-equipment-instrument]")?.value || previous.instrument || null;
    draft.choices.classEquipmentOptions = { mainHand, offHand, instrument };
    saveDraft();
    render(true);
  }

  function updateRaceOption(event) {
    const field = event.currentTarget.dataset.raceOption;
    const value = event.currentTarget.value;
    const options = { ...draft.choices.raceOptions };
    if (value) options[field] = value; else delete options[field];
    if (field === "lineage") {
      if (value !== "高等精靈血統") delete options.cantrip;
    }
    if (field === "feat") options.featOptions = {};
    draft.choices.raceOptions = options;
    clearFutureLevelChoices();
    saveDraft();
    render(true);
  }

  function showRaceSpellDescription(field, trigger) {
    const select = ensureWizard().querySelector(`#quick-build-race-${field}`);
    const spell = select?.value ? selectedSpellForBackground("sage", select.value, "cantrips") : null;
    openSpellDetail(spell, trigger);
  }

  function showHumanFeatDescription(trigger) {
    const value = ensureWizard().querySelector("#quick-build-race-feat")?.value || "";
    const description = value && typeof featsDesc === "object" ? featsDesc[value] : null;
    openFeatDetail(description, trigger);
  }

  function updateHumanMagicFeat(event) {
    const body = ensureWizard().querySelector(".quick-build-body");
    const previous = isPlainObject(draft.choices.raceOptions.featOptions) ? draft.choices.raceOptions.featOptions : {};
    const spellClass = body.querySelector("[data-human-spell-class]")?.value || "";
    const classChanged = event.currentTarget.matches("[data-human-spell-class]") && spellClass !== previous.spellClass;
    const cantrips = classChanged ? ["", ""] : [body.querySelector("#quick-build-human-cantrip-1")?.value || "", body.querySelector("#quick-build-human-cantrip-2")?.value || ""];
    const levelOne = classChanged ? "" : body.querySelector("#quick-build-human-level-one")?.value || "";
    draft.choices.raceOptions = { ...draft.choices.raceOptions, featOptions: { spellClass, cantrips, levelOneSpells: levelOne ? [levelOne] : [] } };
    clearFutureLevelChoices();
    saveDraft();
    render(true);
  }

  function showHumanFeatSpellDescription(fieldId, trigger) {
    const body = ensureWizard().querySelector(".quick-build-body");
    const select = body.querySelector(`#${fieldId}`);
    const spellClass = body.querySelector("[data-human-spell-class]")?.value;
    if (!select?.value || !MAGIC_INITIATE_SPELL_CLASSES.has(spellClass)) {
      openSpellDetail(null, trigger);
      return;
    }
    const level = fieldId === "quick-build-human-level-one" ? "1" : "cantrips";
    const spell = SpellCatalog.getSpell(select.value) || null;
    openSpellDetail(spell, trigger);
  }

  function updateHumanSkilledFeat() {
    const values = [...ensureWizard().querySelectorAll("[data-human-skilled]")].map(select => select.value || "");
    draft.choices.raceOptions = { ...draft.choices.raceOptions, featOptions: { proficiencies: values } };
    clearFutureLevelChoices();
    saveDraft();
    render(true);
  }

  function chooseBackgroundWealth(method) {
    if (!["default", "gold"].includes(method)) return;
    draft.choices.backgroundWealth = method;
    saveDraft();
    render(true);
  }

  function chooseBackgroundTool(event) {
    const value = event.currentTarget.value;
    draft.choices.backgroundToolChoice = GAME_TOOL_OPTIONS.includes(value) ? value : null;
    clearFutureLevelChoices();
    saveDraft();
    render();
  }

  function updateBackgroundSpells(changedSelect) {
    const body = ensureWizard().querySelector(".quick-build-body");
    let first = body.querySelector("#quick-build-cantrip-1")?.value || "";
    let second = body.querySelector("#quick-build-cantrip-2")?.value || "";
    const levelOne = body.querySelector("#quick-build-level-one")?.value || "";
    if (first && first === second) {
      if (changedSelect?.id === "quick-build-cantrip-1") first = "";
      else second = "";
      if (changedSelect) changedSelect.value = "";
    }
    draft.choices.backgroundMagic = {
      cantrips: [first, second],
      levelOneSpells: [levelOne].filter(Boolean)
    };
    clearFutureLevelChoices();
    saveDraft();
    refreshBackgroundSpellControls(body);
    render(true);
  }

  function refreshBackgroundSpellControls(body) {
    const first = body.querySelector("#quick-build-cantrip-1")?.value || "";
    const second = body.querySelector("#quick-build-cantrip-2")?.value || "";
    syncCantripOptionAvailability(body, first, second);
    body.querySelectorAll("[data-spell-view]").forEach(button => {
      const select = body.querySelector(`#${CSS.escape(button.dataset.spellView)}`);
      button.disabled = !select?.value;
    });
  }

  function syncCantripOptionAvailability(body, first, second) {
    const firstSelect = body.querySelector("#quick-build-cantrip-1");
    const secondSelect = body.querySelector("#quick-build-cantrip-2");
    firstSelect?.querySelectorAll("option").forEach(option => { option.disabled = Boolean(second && option.value === second && option.value !== first); });
    secondSelect?.querySelectorAll("option").forEach(option => { option.disabled = Boolean(first && option.value === first && option.value !== second); });
  }

  function showSpellDescription(select, trigger) {
    if (!select?.value) {
      openSpellDetail(null, trigger);
      return;
    }
    const level = select.id === "quick-build-level-one" ? "1" : "cantrips";
    const spell = selectedSpell(select.value, level);
    openSpellDetail(spell, trigger);
  }

  function openSpellDetail(spell, trigger) {
    const modal = ensureSpellDetailModal();
    const wizard = document.getElementById("quick-build-wizard");
    const wizardIsOpen = wizard?.classList.contains("open");
    const wizardShell = wizard?.querySelector(".quick-build-shell");
    const content = modal.querySelector("#quick-build-spell-detail-content");
    modal.querySelector("#quick-build-spell-detail-title").textContent = "法術詳情";
    spellDetailTrigger = trigger || document.activeElement;
    const record = typeof spell === "string" ? canonicalSpell(spell) : spell;
    content.innerHTML = record ? `<strong>${escapeHtml(spellDisplayName(record.spellId))}</strong>${escapeHtml(record.desc)}` : "<span>你還沒有選擇法術喔！</span>";
    content.scrollTop = 0;
    spellDetailOpenedOutsideWizard = !wizardIsOpen;
    modal.inert = false;
    modal.removeAttribute("inert");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    modal.querySelector(".quick-build-spell-detail-close")?.focus();
    if (wizardIsOpen) {
      wizardShell?.setAttribute("inert", "");
      wizardShell?.setAttribute("aria-hidden", "true");
    } else {
      lockPage(modal);
    }
  }

  function classFeaturePlainText(html) {
    return String(html || "")
      .replace(/<hr\b[^>]*>/giu, "\n")
      .replace(/<br\s*\/?>/giu, "\n")
      .replace(/<[^>]+>/gu, "")
      .replace(/&nbsp;/gu, " ")
      .replace(/&lt;/gu, "<")
      .replace(/&gt;/gu, ">")
      .replace(/&amp;/gu, "&")
      .replace(/\n{3,}/gu, "\n\n")
      .trim();
  }

  function invocationDetailFromClassFeatures(option) {
    const label = option?.label || "";
    const raw = typeof classFeatures === "object" ? classFeatures?.warlock || "" : "";
    const optionIndex = raw.lastIndexOf("魔能祈喚選項");
    if (!label || optionIndex === -1) return "";
    const block = raw.slice(optionIndex);
    const start = block.indexOf(label);
    if (start === -1) return "";
    const nextPositions = ELDRITCH_INVOCATION_OPTIONS
      .map(item => item.label)
      .filter(name => name && name !== label)
      .map(name => block.indexOf(name, start + label.length))
      .filter(index => index !== -1);
    const end = nextPositions.length ? Math.min(...nextPositions) : block.length;
    return classFeaturePlainText(`${label}\n${block.slice(start + label.length, end)}`);
  }

  function openInvocationDetail(option, trigger) {
    const detail = invocationDetailFromClassFeatures(option) || option?.description || "";
    openFeatDetail(detail, trigger, "魔能祈喚詳情");
  }

  function openFeatDetail(description, trigger, title = "專長詳情") {
    const modal = ensureSpellDetailModal();
    const wizardShell = ensureWizard().querySelector(".quick-build-shell");
    const content = modal.querySelector("#quick-build-spell-detail-content");
    spellDetailTrigger = trigger || document.activeElement;
    modal.querySelector("#quick-build-spell-detail-title").textContent = title;
    if (description) {
      const lines = String(description).replace(/\r\n/g, "\n").split("\n");
      const noticeIndex = lines.findIndex(line => line.trim().startsWith("「擴充」為本站"));
      if (noticeIndex >= 0) {
        const notice = lines.splice(noticeIndex, 1)[0].trim();
        content.innerHTML = `${escapeHtml(lines.join("\n").trimEnd())}<div class="quick-build-expansion-notice">${escapeHtml(notice)}</div>`;
      } else {
        content.textContent = description;
      }
    } else {
      content.innerHTML = "<span>你還沒有選擇專長喔！</span>";
    }
    content.scrollTop = 0;
    spellDetailOpenedOutsideWizard = false;
    modal.inert = false;
    modal.removeAttribute("inert");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    modal.querySelector(".quick-build-spell-detail-close")?.focus();
    wizardShell?.setAttribute("inert", "");
    wizardShell?.setAttribute("aria-hidden", "true");
  }

  function closeSpellDetail() {
    const modal = document.getElementById("quick-build-spell-detail");
    const wizardShell = document.querySelector("#quick-build-wizard .quick-build-shell");
    if (!modal?.classList.contains("open")) {
      if (modal) modal.inert = true;
      wizardShell?.removeAttribute("inert");
      wizardShell?.removeAttribute("aria-hidden");
      return;
    }
    wizardShell?.removeAttribute("inert");
    wizardShell?.removeAttribute("aria-hidden");
    if (spellDetailOpenedOutsideWizard) unlockPage();
    spellDetailOpenedOutsideWizard = false;
    spellDetailTrigger?.focus?.();
    spellDetailTrigger = null;
    if (modal.contains(document.activeElement)) document.activeElement.blur();
    modal.inert = true;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  function trapSpellDetailKeyboard(event) {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeSpellDetail(); return; }
    if (event.key !== "Tab") return;
    const focusable = [...event.currentTarget.querySelectorAll("button:not(:disabled),[tabindex='0']")].filter(element => element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function goPreviousStep() {
    const steps = activeSteps(draft);
    const index = steps.findIndex(step => step.id === draft.ui.currentStepId);
    if (index <= 0) return;
    const target = steps[index - 1];
    draft.ui = { ...draft.ui, currentStepId: target.id, view: viewForStep(target.id) };
    saveDraft();
    render();
  }

  function editCurrentStep() {
    if (draft.ui.currentStepId === "level-one-review") return;
    draft.ui = { ...draft.ui, view: "edit" };
    saveDraft();
    render();
  }

  function goNextStep() {
    const step = currentStepDefinition();
    if (draft.ui.view === "edit") {
      if (!stepIsComplete(step)) return;
      confirmStep(step.id);
      draft.ui = { ...draft.ui, view: "review" };
      saveDraft();
      render();
      return;
    }
    const steps = activeSteps(draft);
    const index = steps.findIndex(item => item.id === draft.ui.currentStepId);
    const target = steps[index + 1];
    if (!target) return;
    draft.ui = { ...draft.ui, currentStepId: target.id, view: viewForStep(target.id) };
    saveDraft();
    render();
  }

  function lockPage(activeModal = null) {
    if (pageLock) return;
    const modal = activeModal || ensureWizard();
    const scrollY = window.scrollY;
    const inertElements = [...document.body.children]
      .filter(element => element !== modal && element.id !== "quick-build-spell-detail")
      .map(element => ({ element, inert: element.inert }));
    inertElements.forEach(({ element }) => { element.inert = true; });
    pageLock = {
      scrollY, inertElements,
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverflow: document.body.style.overflow,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyWidth: document.body.style.width
    };
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
  }

  function unlockPage() {
    if (!pageLock) return;
    const saved = pageLock;
    saved.inertElements.forEach(({ element, inert }) => { element.inert = inert; });
    document.documentElement.style.overflow = saved.htmlOverflow;
    document.body.style.overflow = saved.bodyOverflow;
    document.body.style.position = saved.bodyPosition;
    document.body.style.top = saved.bodyTop;
    document.body.style.width = saved.bodyWidth;
    pageLock = null;
    window.scrollTo(0, saved.scrollY);
  }

  function trapWizardKeyboard(event) {
    if (event.key === "Escape") { event.preventDefault(); closeWizard(); return; }
    if (event.key !== "Tab") return;
    const focusable = [...event.currentTarget.querySelectorAll("button:not(:disabled),select:not(:disabled),[tabindex='0']")].filter(element => element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function openWizard() {
    const modal = ensureWizard();
    const wizardShell = modal.querySelector(".quick-build-shell");
    const spellDetail = document.getElementById("quick-build-spell-detail");
    wizardShell?.removeAttribute("inert");
    wizardShell?.removeAttribute("aria-hidden");
    if (spellDetail?.contains(document.activeElement)) document.activeElement.blur();
    if (spellDetail) spellDetail.inert = true;
    spellDetail?.classList.remove("open");
    spellDetail?.setAttribute("aria-hidden", "true");
    const abilityChoiceModal = document.getElementById("ability-choice-modal");
    const focusBeforeOpening = document.activeElement;
    previouslyFocused = abilityChoiceModal?.contains(focusBeforeOpening)
      ? document.getElementById("set-default-abilities")
      : focusBeforeOpening;
    if (abilityChoiceModal?.contains(document.activeElement)) document.activeElement.blur();
    if (abilityChoiceModal) {
      abilityChoiceModal.inert = true;
      abilityChoiceModal.classList.remove("open");
      abilityChoiceModal.setAttribute("aria-hidden", "true");
    }
    draft = loadDraft();
    expandedChoiceGroups.clear();
    pendingChoiceCardScrollGroup = null;
    render();
    modal.inert = false;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    lockPage();
    modal.querySelector(".quick-build-close")?.focus();
  }

  function discardDraft() {
    if (!window.confirm("確定要重置創角小幫手嗎？背景、種族、職業、裝備與其他選擇將無法復原。")) return;
    storage.removeItem(STORAGE_KEY);
    draft = createDraft();
    expandedChoiceGroups.clear();
    pendingChoiceCardScrollGroup = null;
    closeWizard(false);
  }

  function closeWizard(save = true) {
    const modal = document.getElementById("quick-build-wizard");
    if (!modal?.classList.contains("open")) return;
    closeSpellDetail();
    if (save) saveDraft();
    unlockPage();
    previouslyFocused?.focus?.();
    if (modal.contains(document.activeElement)) document.activeElement.blur();
    modal.inert = true;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("quick-card-builder")?.addEventListener("click", openWizard);
  });

  window.quickBuild = {
    open: openWizard, close: closeWizard, createDraft,
    openSpellDetail, openPactTomeModal,
    getDraft: () => structuredClone(draft), saveDraft,
    hasImportedInitialEquipment,
    storageKey: STORAGE_KEY
  };
})();

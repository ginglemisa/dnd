(() => {
  "use strict";

  const STORAGE_KEY = "dnd.quickBuildDraft.v1";
  const DRAFT_VERSION = 7;
  const MOBILE_INITIAL_EQUIPMENT_PREFIX = "初始裝備：";
  const STEPS = [
    { id: "background", title: "背景" },
    { id: "race", title: "種族" },
    { id: "class", title: "職業與屬性" },
    { id: "equipment", title: "裝備" },
    { id: "level-one", title: "完成 1 級" },
    { id: "level-one-review", title: "1 級總覽" }
  ];
  const BACKGROUND_ORDER = ["acolyte", "criminal", "sage", "soldier"];
  const BACKGROUND_LABELS = { acolyte: "侍僧", criminal: "罪犯", sage: "賢者", soldier: "士兵" };
  const RACE_ORDER = ["dragonborn", "dwarf", "elf", "gnome", "goliath", "halfling", "human", "orc", "tiefling"];
  const RACE_LABELS = { dragonborn: "龍裔", dwarf: "矮人", elf: "精靈", gnome: "侏儒", goliath: "歌利亞", halfling: "半身人", human: "人類", orc: "獸人", tiefling: "提夫林" };
  const SKILL_OPTIONS = ["體操", "馴獸", "奧秘", "運動", "欺瞞", "歷史", "洞悉", "威嚇", "調查", "醫藥", "自然", "察覺", "表演", "遊說", "宗教", "巧手", "隱匿", "求生"];
  const TOOL_OPTIONS = ["煉金師工具", "釀酒師工具", "書法工具", "木匠工具", "制圖師工具", "鞋匠工具", "廚師工具", "玻璃匠工具", "珠寶匠工具", "皮匠工具", "石匠工具", "畫家工具", "陶匠工具", "鐵匠工具", "修補匠工具", "裁縫工具", "木雕師工具", "易容工具", "文書偽造工具", "草藥工具", "領航員工具", "制毒師工具", "盜賊工具"];
  const GAME_TOOL_OPTIONS = ["骰子", "龍棋", "紙牌", "三龍牌"];
  const INSTRUMENT_TOOL_OPTIONS = ["風笛", "鼓", "揚琴", "長笛", "角號", "魯特琴", "里拉琴", "排簫", "蘆笛", "提琴"];
  const ARTISAN_TOOL_OPTIONS = TOOL_OPTIONS.slice(0, 17);
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
    rogue: "遊蕩者", sorcerer: "術士", warlock: "契術師", wizard: "法師"
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
    bard: { fixed: ["吟遊詩人激勵"], summaryFixed: ["吟遊詩人激勵"], languages: 2, cantrips: 2, preparedSpells: 4, defaultCantrips: ["舞光術", "惡言相加"], defaultPreparedSpells: ["魅惑人類", "七彩噴射", "不諧低語", "治癒真言"] },
    cleric: { summaryFixed: ["神聖使命"], languages: 2, cantrips: 3, preparedSpells: 4, extraCantripClassType: "thaumaturge", defaultCantrips: ["神導術", "聖火術", "奇術"], defaultPreparedSpells: ["祝福術", "療傷術", "光導箭", "虔誠護盾"] },
    druid: { fixed: ["德魯伊語", "動物交談（始終準備）"], summaryFixed: ["德魯伊語"], languages: 2, classOption: { key: "primalOrder", label: "原初使命", options: [{ id: "magician", label: "巫祝" }, { id: "warden", label: "哨衛" }] }, cantrips: 2, preparedSpells: 4, extraCantripOption: "magician", alwaysPrepared: ["動物交談"], defaultCantrips: ["德魯伊伎倆", "燃火術"], defaultPreparedSpells: ["化獸為友", "療傷術", "妖火", "雷鳴波"] },
    fighter: { fixed: ["回氣"], summaryFixed: ["回氣"], languages: 2, fightingStyle: true, weaponMastery: 3, prefillMasteryFromDefaultWeapon: true },
    monk: { fixed: ["武藝", "無甲防禦"], summaryFixed: ["武藝", "無甲防禦"], languages: 2 },
    paladin: { fixed: ["聖療"], summaryFixed: ["聖療"], languages: 2, preparedSpells: 2, weaponMastery: 2, defaultWeaponMasteries: ["長劍", "標槍"], defaultPreparedSpells: ["英雄氣概", "熾焰斬"] },
    ranger: { fixed: ["宿敵：獵人印記始終準備，可免費施放 2 次"], summaryFixed: ["宿敵"], languages: 2, preparedSpells: 2, weaponMastery: 2, defaultWeaponMasteries: ["長弓", "短劍"], alwaysPrepared: ["獵人印記"], alwaysPreparedFeature: "遊俠等級 1：宿敵", alwaysPreparedFreeUses: { 1: 2 }, defaultPreparedSpells: ["療傷術", "誘捕打擊"] },
    rogue: { fixed: ["偷襲", "盜賊黑話"], summaryFixed: ["偷襲", "盜賊黑話"], languages: 3, expertise: 2, weaponMastery: 2, defaultWeaponMasteries: ["匕首", "短弓"] },
    sorcerer: { fixed: ["天生術法"], summaryFixed: ["天生術法"], languages: 2, cantrips: 4, preparedSpells: 2, defaultCantrips: ["光亮術", "魔法伎倆", "電爪", "術法衝擊"], defaultPreparedSpells: ["燃燒之手", "偵測魔法"] },
    warlock: { summaryFixed: ["契約魔法"], languages: 2, cantrips: 2, preparedSpells: 2, invocations: 1, defaultInvocations: ["pact-of-the-tome"], defaultCantrips: ["魔能爆", "魔法伎倆"], defaultPreparedSpells: ["魅惑人類", "脆弱詛咒"] },
    wizard: { fixed: ["儀式精通", "奧術回想"], summaryFixed: ["儀式精通", "奧術回想"], languages: 2, cantrips: 3, spellbookSpells: 6, preparedSpells: 4, defaultCantrips: ["光亮術", "法師之手", "冷凍射線"], defaultSpellbookSpells: ["偵測魔法", "羽落術", "法師護甲", "魔法飛彈", "睡眠術", "雷鳴波"], defaultPreparedSpells: ["法師護甲", "羽落術", "睡眠術", "魔法飛彈"] }
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
      "卓爾血統": [["舞光術", "cantrip", 1], ["妖火", 1, 3], ["黑暗術", 2, 5]],
      "高等精靈血統": [["偵測魔法", 1, 3], ["迷蹤步", 2, 5]],
      "木精靈血統": [["德魯伊伎倆", "cantrip", 1], ["大步奔行", 1, 3], ["行動無蹤", 2, 5]]
    },
    gnome: {
      "森林侏儒": [["次級幻影", "cantrip", 1], ["動物交談", 1, 1]],
      "岩石侏儒": [["修復術", "cantrip", 1], ["魔法伎倆", "cantrip", 1]]
    },
    tiefling: {
      "深淵血統": [["毒氣噴濺", "cantrip", 1], ["致病射線", 1, 3], ["人類定身術", 2, 5]],
      "冥界血統": [["凍寒之觸", "cantrip", 1], ["虛假生命", 1, 3], ["衰弱射線", 2, 5]],
      "煉獄血統": [["火焰箭", "cantrip", 1], ["煉獄叱喝", 1, 3], ["黑暗術", 2, 5]]
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
      currentStep: 0,
      choices: {
        background: null,
        backgroundAbilities: [],
        backgroundWealth: null,
        backgroundCurrency: { cp: 0, sp: 0, gp: 0, pp: 0 },
        backgroundToolChoice: null,
        backgroundMagic: { cantrips: [], levelOneSpells: [] },
        backgroundMagicLastSelected: null,
        backgroundMagicConfirmed: false,
        spellConflictResolutions: {},
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
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!isPlainObject(saved) || saved.version !== DRAFT_VERSION) return createDraft();
      const blank = createDraft();
      return normalizeDraft({
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
          spellConflictResolutions: isPlainObject(saved.choices?.spellConflictResolutions) ? saved.choices.spellConflictResolutions : {},
          levelOne: isPlainObject(saved.choices?.levelOne) ? saved.choices.levelOne : {}
        },
        selections: { ...blank.selections, ...(isPlainObject(saved.selections) ? saved.selections : {}) },
        acquisitions: { ...blank.acquisitions, ...(isPlainObject(saved.acquisitions) ? saved.acquisitions : {}) },
        currentStep: Math.min(Math.max(Number(saved.currentStep) || 0, 0), STEPS.length - 1)
      });
    } catch (_error) {
      return createDraft();
    }
  }

  let draft = loadDraft();
  reconcileBackgroundDraft(draft);
  reconcileRaceDraft(draft);
  reconcileClassDraft(draft);
  reconcileEquipmentDraft(draft);
  reconcileLevelOneDraft(draft);
  let previouslyFocused = null;
  let spellDetailTrigger = null;
  let spellDetailOpenedOutsideWizard = false;
  let pageLock = null;

  function saveDraft() {
    normalizeDraft(draft);
    reconcileBackgroundDraft(draft);
    reconcileRaceDraft(draft);
    reconcileClassDraft(draft);
    reconcileEquipmentDraft(draft);
    reconcileLevelOneDraft(draft);
    normalizeDraft(draft);
    draft.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      return true;
    } catch (_error) {
      return false;
    }
  }

  function addAcquisition(type, acquisition) {
    if (!Object.prototype.hasOwnProperty.call(draft.acquisitions, type) || !Array.isArray(draft.acquisitions[type])) {
      throw new Error(`Unknown acquisition type: ${type}`);
    }
    if (!isPlainObject(acquisition) || !acquisition.id || !acquisition.sourceType || !acquisition.sourceId) {
      throw new Error("Acquisitions require id, sourceType, and sourceId.");
    }
    const duplicate = draft.acquisitions[type].some(item => item.id === acquisition.id);
    if (!duplicate) draft.acquisitions[type].push({ ...acquisition });
    saveDraft();
    return !duplicate;
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
    const preset = DEFAULT_ABILITIES_BY_BUILD_AND_BACKGROUND[buildKey]?.[backgroundKey] || DEFAULT_ABILITIES_BY_BUILD_AND_BACKGROUND[target.choices?.class]?.[backgroundKey];
    return preset ? { abilities: abilityMapFromArray(preset[0]), bonuses: { ...emptyAbilityMap(0), ...preset[1] } } : null;
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
    if (cantrips[0] && cantrips[0] === cantrips[1]) cantrips[1] = "";
    target.choices.backgroundMagic = { cantrips, levelOneSpells: Array.isArray(magic.levelOneSpells) ? magic.levelOneSpells.filter(Boolean).slice(0, 1) : [] };
    target.choices.backgroundCurrency = Object.fromEntries(["cp", "sp", "gp", "pp"].map(currency => [currency, Math.max(0, Number(target.choices.backgroundCurrency?.[currency]) || 0)]));
    target.choices.raceOptions = isPlainObject(target.choices.raceOptions) ? target.choices.raceOptions : {};
    target.choices.abilities = normalizeAbilityScores(target.choices.abilities);
    target.choices.backgroundAbilityBonuses = isPlainObject(target.choices.backgroundAbilityBonuses) ? target.choices.backgroundAbilityBonuses : emptyAbilityMap();
    target.choices.classOptions = isPlainObject(target.choices.classOptions) ? target.choices.classOptions : {};
    target.choices.classEquipmentOptions = isPlainObject(target.choices.classEquipmentOptions) ? target.choices.classEquipmentOptions : {};
    target.choices.levelOne = isPlainObject(target.choices.levelOne) ? target.choices.levelOne : {};
    target.choices.spellcastingAbility = ["int", "wis", "cha"].includes(target.choices.spellcastingAbility) ? target.choices.spellcastingAbility : null;
    target.choices.spellConflictResolutions = isPlainObject(target.choices.spellConflictResolutions) ? target.choices.spellConflictResolutions : {};
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

  function spellChineseName(name) {
    const value = String(name || "").trim();
    const englishStart = value.search(/[A-Za-z]/u);
    return (englishStart < 0 ? value : value.slice(0, englishStart)).trim();
  }

  function acquisitionAppliesAtLevel(acquisition, characterLevel = QUICK_BUILD_LEVEL) {
    const gainedAt = Number(acquisition?.content?.gainedAt);
    return !Number.isFinite(gainedAt) || gainedAt <= characterLevel;
  }

  function acquisitionConflicts(target, type, name, sourceType) {
    return (target.acquisitions?.[type] || []).filter(item =>
      item.name === name && item.sourceType !== sourceType && (type !== "spells" || acquisitionAppliesAtLevel(item))
    );
  }

  function crossSourceDuplicateGroups(target, type, sourceTypes = null) {
    const allowed = sourceTypes ? new Set(sourceTypes) : null;
    const groups = new Map();
    (target.acquisitions?.[type] || []).forEach(item => {
      if (!item?.name || (allowed && !allowed.has(item.sourceType)) || (type === "spells" && !acquisitionAppliesAtLevel(item))) return;
      if (!groups.has(item.name)) groups.set(item.name, []);
      groups.get(item.name).push(item);
    });
    return [...groups.entries()].flatMap(([name, items]) => {
      const sourceTypeCount = new Set(items.map(item => item.sourceType)).size;
      return sourceTypeCount > 1 ? [{ type, name, items }] : [];
    });
  }

  function duplicateGroupText(group) {
    const sources = [...new Set(group.items.map(item => item.source?.label || item.sourceType || "其他來源"))];
    return `${group.name}（${sources.join("／")}）`;
  }

  function addRaceSpell(target, key, shortName, level, gainedAt, sourceDetail) {
    const name = spellChineseName(shortName);
    const source = { ...raceSource(key), feature: sourceDetail };
    const content = { name, level, gainedAt };
    const id = `race:${key}:spell:${sourceDetail}:${shortName}:${gainedAt}`;
    target.selections.raceSpells.push({ id, source, content });
    addDerivedAcquisition(target, "spells", { id, name, sourceType: "race", sourceId: key, source, content });
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
      const cantrips = spellClass ? validSpellNames(spellList?.[spellClass]?.cantrips, savedFeatOptions.cantrips, 2) : [];
      const levelOneSpells = spellClass ? validSpellNames(spellList?.[spellClass]?.[1], savedFeatOptions.levelOneSpells, 1) : [];
      const featOptions = { spellClass, cantrips, levelOneSpells };
      const changed = spellClass !== (savedFeatOptions.spellClass || "") ||
        cantrips.length !== (savedFeatOptions.cantrips || []).length ||
        cantrips.some((name, index) => name !== savedFeatOptions.cantrips[index]) ||
        levelOneSpells.length !== (savedFeatOptions.levelOneSpells || []).length ||
        levelOneSpells.some((name, index) => name !== savedFeatOptions.levelOneSpells[index]);
      options = { ...options, featOptions, ...(changed ? { confirmed: false } : {}) };
      target.choices.raceOptions = options;
    }
    const source = raceSource(key);
    target.selections.race = { id: key, label: RACE_LABELS[key], source, content: { text: raceData(key), options: structuredClone(options), pendingChoices: racePendingChoices(key, options) } };

    if (key === "elf" && RACE_OPTION_DEFINITIONS.elf.skill.includes(options.skill)) {
      addDerivedAcquisition(target, "skills", { id: `race:elf:skill:${options.skill}`, name: options.skill, sourceType: "race", sourceId: key, source: { ...source, feature: "敏銳感官" }, content: { proficiency: "skill" } });
    }
    if (key === "human" && SKILL_OPTIONS.includes(options.skill)) {
      addDerivedAcquisition(target, "skills", { id: `race:human:skill:${options.skill}`, name: options.skill, sourceType: "race", sourceId: key, source: { ...source, feature: "技藝嫻熟" }, content: { proficiency: "skill" } });
    }
    if (key === "human" && ["警覺", "魔法學徒", "兇蠻打手", "熟習"].includes(options.feat)) {
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
    if (key === "tiefling") addRaceSpell(target, key, "奇術", "cantrip", 1, "異界姿態");
    const spellConflicts = target.acquisitions.spells.filter(item => item.sourceType === "race" && acquisitionAppliesAtLevel(item)).flatMap(item =>
      acquisitionConflicts(target, "spells", item.name, "race")
        .filter(conflict => conflict.sourceType === "background")
        .map(conflict => {
          const conflictId = `spell:${item.name}:background-race`;
          const resolution = target.choices.spellConflictResolutions[conflictId] || null;
          return { type: "spell", id: conflictId, name: item.name, sources: [conflict.source, item.source], resolution, blocking: false, requiresFinalAcknowledgment: resolution !== "acknowledged-final" };
        })
    );
    const conflictNames = new Set(spellConflicts.map(conflict => conflict.name));
    target.selections.raceSpells.forEach(item => { item.content.crossSourceDuplicate = conflictNames.has(item.content.name); });
    target.acquisitions.spells.filter(item => item.sourceType === "race").forEach(item => { item.content.crossSourceDuplicate = conflictNames.has(item.name); });
    target.selections.race.content.conflicts = spellConflicts;
    return target;
  }

  function backgroundEquipmentDetails(key, method, toolChoice = null) {
    const data = backgroundData(key) || {};
    const raw = method === "gold" ? data.裝備B : data.裝備A;
    const currency = { cp: 0, sp: 0, gp: 0, pp: 0 };
    const items = String(raw || "").split(/[、,，]/u).map(item => item.trim()).filter(Boolean).map(item => {
      if (key === "soldier" && method === "default" && item === "賭具擇一" && GAME_TOOL_OPTIONS.includes(toolChoice)) {
        return toolChoice;
      }
      return item;
    }).filter(item => {
      const match = item.match(/^(\d+)\s*金幣$/u);
      if (!match) return true;
      currency.gp += Number(match[1]);
      return false;
    });
    return { items, currency };
  }

  function displayList(value) {
    return plainText(value).replace(/[，,]/gu, "、");
  }

  function backgroundSource(key) {
    return { type: "background", id: key, label: BACKGROUND_LABELS[key], dataFile: "backgrounds.js" };
  }

  function spellSourceForBackground(key) {
    return key === "acolyte" ? "cleric" : "wizard";
  }

  function spellOptionsForBackground(key, level) {
    const source = spellSourceForBackground(key);
    const entries = typeof spellList === "object" ? spellList?.[source]?.[level] : [];
    return Array.isArray(entries) ? entries : [];
  }

  function selectedSpellForBackground(key, name, level) {
    return spellOptionsForBackground(key, level).find(spell => spellChineseName(spell.name) === spellChineseName(name)) || null;
  }

  function validSpellNames(entries, names, limit) {
    const selected = [];
    (Array.isArray(names) ? names : []).forEach(name => {
      const spell = (Array.isArray(entries) ? entries : []).find(entry => spellChineseName(entry.name) === spellChineseName(name));
      const canonicalName = spell ? spellChineseName(spell.name) : "";
      if (canonicalName && !selected.includes(canonicalName) && selected.length < limit) selected.push(canonicalName);
    });
    return selected;
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
      target.choices.backgroundMagicLastSelected = null;
      target.choices.backgroundMagicConfirmed = false;
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
      target.choices.backgroundMagicLastSelected = null;
      target.choices.backgroundMagicConfirmed = false;
      return target;
    }

    const savedMagic = target.choices.backgroundMagic;
    const cantrips = validSpellNames(spellOptionsForBackground(key, "cantrips"), savedMagic.cantrips, 2);
    while (cantrips.length < 2) cantrips.push("");
    const levelOneSpells = validSpellNames(spellOptionsForBackground(key, "1"), savedMagic.levelOneSpells, 1);
    const magicChanged = cantrips.some((name, index) => name !== (savedMagic.cantrips || [])[index]) ||
      levelOneSpells.some((name, index) => name !== (savedMagic.levelOneSpells || [])[index]) ||
      (savedMagic.levelOneSpells || []).length !== levelOneSpells.length;
    target.choices.backgroundMagic = { cantrips, levelOneSpells };
    if (magicChanged) target.choices.backgroundMagicConfirmed = false;
    const magic = target.choices.backgroundMagic;
    [["cantrips", magic.cantrips], ["1", magic.levelOneSpells]].forEach(([level, names]) => {
      (Array.isArray(names) ? names : []).filter(Boolean).forEach(name => {
        const chineseName = spellChineseName(name);
        const content = { name: chineseName, level: level === "cantrips" ? "cantrip" : Number(level), gainedAt: 1 };
        const spellSource = spellSourceForBackground(key);
        const spellSourceRecord = { ...source, feature: "魔法學徒", optionList: spellSource };
        target.selections.backgroundSpells.push({ id: `background:${key}:spell:${level}:${chineseName}`, source: spellSourceRecord, content });
        addDerivedAcquisition(target, "spells", {
          id: `background:${key}:spell:${chineseName}`, name: chineseName, sourceType: "background", sourceId: key, source: spellSourceRecord, content
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
      options.stage = "classType";
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

    const backgroundSkills = new Set((target.acquisitions.skills || []).filter(item => item.sourceType === "background").map(item => item.name));
    const skillChoices = [...new Set((Array.isArray(options.skills) ? options.skills : [])
      .filter(name => effectiveDefinition.skillOptions.includes(name) && !backgroundSkills.has(name)))].slice(0, effectiveDefinition.skillCount);
    const toolChoices = [...new Set((Array.isArray(options.tools) ? options.tools : [])
      .filter(name => (effectiveDefinition.toolOptions || []).includes(name)))].slice(0, effectiveDefinition.toolCount || 0);
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
    options.skills = skillChoices;
    options.tools = toolChoices;
    options.stage = ["classType", "abilities", "spellcasting", "proficiencies", "summary"].includes(options.stage) ? options.stage : (typeOptions.length && !options.classType ? "classType" : "abilities");
    if (typeOptions.length && !options.classType) options.stage = "classType";
    if (!spellcastingSource && options.stage === "spellcasting") options.stage = "proficiencies";

    const abilityCost = abilityPointCost(target.choices.abilities);
    const bonusTotal = backgroundBonusTotal(target.choices.backgroundAbilityBonuses);
    const pendingChoices = [];
    if (typeOptions.length && !options.classType) pendingChoices.push("職業類型");
    if (abilityCost !== 27) pendingChoices.push("屬性購點須剛好分配 27 點");
    if (bonusTotal !== 3) pendingChoices.push("背景屬性加值須剛好分配 3 點");
    if (spellcastingSource && !target.choices.spellcastingAbility) pendingChoices.push("施法屬性");
    if (skillChoices.length !== effectiveDefinition.skillCount) pendingChoices.push(`職業技能 ${effectiveDefinition.skillCount} 項`);
    if (toolChoices.length !== (effectiveDefinition.toolCount || 0)) pendingChoices.push(`職業工具 ${effectiveDefinition.toolCount} 項`);
    if (pendingChoices.length) options.summaryConfirmed = false;
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
        pendingChoices, conflicts, summaryConfirmed: Boolean(options.summaryConfirmed)
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
    return { type: "level-one", id: key, label: CLASS_LABELS[key], dataFile: "class-features.js" };
  }

  function allWeaponMasteryOptionsForClass(key) {
    const simple = WEAPON_MASTERY_OPTIONS.simple;
    const martial = WEAPON_MASTERY_OPTIONS.martial;
    if (["barbarian", "fighter", "paladin", "ranger"].includes(key)) return simple.concat(martial);
    if (key === "rogue") return simple.concat(martial.filter(([name]) => ["刺劍", "彎刀", "短劍", "手弩"].includes(name)));
    return [];
  }

  function levelOneSpellOptions(classId, level) {
    const entries = typeof spellList === "object" ? spellList?.[classId]?.[level] : [];
    return Array.isArray(entries) ? entries : [];
  }

  function spellOptionByChineseName(classId, level, name) {
    return levelOneSpellOptions(classId, level).find(spell => spellChineseName(spell.name) === spellChineseName(name)) || null;
  }

  function allSpellOptions(level, predicate = null) {
    const seen = new Map();
    Object.values(typeof spellList === "object" ? spellList : {}).forEach(levels => {
      (Array.isArray(levels?.[level]) ? levels[level] : []).forEach(spell => {
        const name = spellChineseName(spell.name);
        if (name && (!predicate || predicate(spell)) && !seen.has(name)) seen.set(name, spell);
      });
    });
    return [...seen.values()].sort((a, b) => spellChineseName(a.name).localeCompare(spellChineseName(b.name), "zh-Hant"));
  }

  function levelOneInvocationOptions() {
    return ELDRITCH_INVOCATION_OPTIONS.filter(option => !option.minWarlockLevel || option.minWarlockLevel <= 1);
  }

  function isRitualSpell(spell) {
    return /儀式/u.test(`${spell?.name || ""}\n${spell?.desc || ""}`);
  }

  function knownSpellSources(target, excludeSourceType = "level-one") {
    const map = new Map();
    (target.acquisitions.spells || []).forEach(item => {
      if (item.sourceType === excludeSourceType || !acquisitionAppliesAtLevel(item)) return;
      const name = spellChineseName(item.name);
      if (!name) return;
      if (!map.has(name)) map.set(name, []);
      map.get(name).push(item.source?.label || item.sourceType || "其他來源");
    });
    return map;
  }

  function validDefaultSpellNames(classId, level, names, knownNames = new Set()) {
    const options = level === "all-cantrips" ? allSpellOptions("cantrips")
      : level === "all-rituals-1" ? allSpellOptions("1", isRitualSpell)
      : levelOneSpellOptions(classId, level);
    const valid = new Set(options.map(spell => spellChineseName(spell.name)));
    return (Array.isArray(names) ? names : []).filter(name => valid.has(name) && !knownNames.has(name));
  }

  function firstLevelOneStageForDefinition(definition) {
    if (definition.classOption || definition.fightingStyle || definition.invocations) return "options";
    if (definition.languages) return "languages";
    return "spells";
  }

  function usedLanguageLabels(target) {
    return new Set((target.acquisitions.languages || []).map(item => item.name));
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
    if (previous.classId && previous.classId !== key) return { classId: key, stage: firstLevelOneStageForDefinition(definition) };
    return { ...previous, classId: key, stage: previous.stage || firstLevelOneStageForDefinition(definition) };
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
    const knownSpellNames = new Set((target.acquisitions.spells || [])
      .filter(item => acquisitionAppliesAtLevel(item))
      .map(item => spellChineseName(item.name))
      .filter(Boolean));
    if (!Array.isArray(choices.cantrips) || choices.cantrips.filter(Boolean).length === 0) choices.cantrips = validDefaultSpellNames(key, "cantrips", definition.defaultCantrips, knownSpellNames);
    if (!Array.isArray(choices.spellbookSpells) || choices.spellbookSpells.filter(Boolean).length === 0) choices.spellbookSpells = validDefaultSpellNames("wizard", "1", definition.defaultSpellbookSpells, knownSpellNames);
    if (!Array.isArray(choices.preparedSpells) || choices.preparedSpells.filter(Boolean).length === 0) choices.preparedSpells = validDefaultSpellNames(definition.spellbookSpells ? "wizard" : key, "1", definition.defaultPreparedSpells, knownSpellNames);
    if (!Array.isArray(choices.invocations) || choices.invocations.filter(Boolean).length === 0) choices.invocations = (Array.isArray(definition.defaultInvocations) ? definition.defaultInvocations : []).filter(id => levelOneInvocationOptions().some(option => option.id === id));
    if (definition.classOption) {
      const valid = definition.classOption.options.some(option => option.id === choices.classOption);
      if (!valid) choices.classOption = null;
      if (!choices.classOption) pendingChoices.push(definition.classOption.label);
    }
    const cantripCount = levelOneCantripCount(target, definition);
    const cantrips = [...new Set((Array.isArray(choices.cantrips) ? choices.cantrips : []).filter(name => name && !knownSpellNames.has(name)))].slice(0, cantripCount);
    if (cantrips.length !== cantripCount) pendingChoices.push(`戲法 ${cantripCount} 個`);
    const spellbookSpells = [...new Set((Array.isArray(choices.spellbookSpells) ? choices.spellbookSpells : []).filter(name => name && !knownSpellNames.has(name)))].slice(0, definition.spellbookSpells || 0);
    if (spellbookSpells.length !== (definition.spellbookSpells || 0)) pendingChoices.push(`法術書一環法術 ${definition.spellbookSpells} 個`);
    let preparedCandidates = definition.spellbookSpells ? spellbookSpells : null;
    const alwaysPrepared = new Set(definition.alwaysPrepared || []);
    const preparedSpells = [...new Set((Array.isArray(choices.preparedSpells) ? choices.preparedSpells : []).filter(name => name && !knownSpellNames.has(name) && !alwaysPrepared.has(name) && (!preparedCandidates || preparedCandidates.includes(name))))].slice(0, definition.preparedSpells || 0);
    if (preparedSpells.length !== (definition.preparedSpells || 0)) pendingChoices.push(`準備法術 ${definition.preparedSpells} 個`);
    const weaponOptions = allWeaponMasteryOptionsForClass(key).map(([name]) => name);
    let weaponMasteries = Array.isArray(choices.weaponMasteries) ? choices.weaponMasteries.filter(name => weaponOptions.includes(name)) : [];
    if (!weaponMasteries.length) weaponMasteries = (Array.isArray(definition.defaultWeaponMasteries) ? definition.defaultWeaponMasteries : []).filter(name => weaponOptions.includes(name));
    if (!weaponMasteries.length && definition.prefillMasteryFromDefaultWeapon && target.choices.defaultWeapon && weaponOptions.includes(target.choices.defaultWeapon)) weaponMasteries = [target.choices.defaultWeapon];
    weaponMasteries = [...new Set(weaponMasteries)].slice(0, definition.weaponMastery || 0);
    if (weaponMasteries.length !== (definition.weaponMastery || 0)) pendingChoices.push(`武器精通 ${definition.weaponMastery} 種`);
    const fightingStyles = (typeof FEAT_OPTIONS === "object" ? FEAT_OPTIONS : []).filter(option => /戰鬥風格/u.test(option.label || "")).map(option => option.value);
    const fightingStyle = definition.fightingStyle && fightingStyles.includes(choices.fightingStyle) ? choices.fightingStyle : null;
    if (definition.fightingStyle && !fightingStyle) pendingChoices.push("戰鬥風格");
    const expertiseOptions = expertiseSkillOptions(target);
    const expertise = [...new Set((Array.isArray(choices.expertise) ? choices.expertise : []).filter(name => expertiseOptions.includes(name)))].slice(0, definition.expertise || 0);
    if (expertise.length !== (definition.expertise || 0)) pendingChoices.push(`專精 ${definition.expertise} 項`);
    const knownLanguages = usedLanguageLabels(target);
    const rawLanguages = Array.isArray(choices.languages) ? choices.languages : [];
    const selectedLanguageValues = new Set();
    const languageSlots = Array.from({ length: definition.languages || 0 }, (_, index) => {
      const languageValues = new Map(languageOptionsForDraft(target, index).map(item => [item.value, item.label]));
      const value = rawLanguages[index] || "";
      if (!languageValues.has(value) || knownLanguages.has(languageValues.get(value)) || selectedLanguageValues.has(value)) return "";
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
    const tomeCantrips = hasTome ? [...new Set((Array.isArray(tome.cantrips) ? tome.cantrips : []).filter(name => name && !knownSpellNames.has(name)))].slice(0, 3) : [];
    const tomeRituals = hasTome ? [...new Set((Array.isArray(tome.rituals) ? tome.rituals : []).filter(name => name && !knownSpellNames.has(name)))].slice(0, 2) : [];
    if (hasTome && tomeCantrips.length !== 3) pendingChoices.push("書之魔契戲法 3 個");
    if (hasTome && tomeRituals.length !== 2) pendingChoices.push("書之魔契儀式一環法術 2 個");
    const summaryConfirmed = pendingChoices.length === 0;
    target.choices.levelOne = { ...choices, cantrips, spellbookSpells, preparedSpells, weaponMasteries, fightingStyle, expertise, languages: languageSlots, invocations, tome: { cantrips: tomeCantrips, rituals: tomeRituals }, summaryConfirmed };
    target.selections.levelOne = { id: key, label: `${CLASS_LABELS[key]}完成 1 級`, source, content: { fixed, classOption: choices.classOption, cantrips, spellbookSpells, preparedSpells, weaponMasteries, fightingStyle, expertise, languages, languageDetails, invocations, tome: { cantrips: tomeCantrips, rituals: tomeRituals }, pendingChoices, summaryConfirmed } };
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
    expertise.forEach(name => addDerivedAcquisition(target, "expertise", { id: `level-one:${key}:expertise:${name}`, name, sourceType: "level-one", sourceId: key, source: { ...source, feature: key === "rogue" ? "遊蕩者 1 級專精" : "1 級專精" }, content: { type: "expertise", skill: name } }));
    languageDetails.forEach(item => addDerivedAcquisition(target, "languages", { id: `level-one:${key}:language:${item.slot}:${item.value}`, name: item.label, sourceType: "level-one", sourceId: key, source: { ...source, feature: item.category === "class-extra" ? "盜賊黑話：額外語言" : "初始語言" }, content: { type: "language", value: item.value, category: item.category, fieldId: item.fieldId, slot: item.slot } }));
    cantrips.forEach(name => addDerivedAcquisition(target, "spells", { id: `level-one:${key}:cantrip:${name}`, name, sourceType: "level-one", sourceId: key, source: { ...source, feature: "1 級戲法" }, content: { name, level: "cantrip", prepared: true } }));
    if (!definition.spellbookSpells) preparedSpells.forEach(name => addDerivedAcquisition(target, "spells", { id: `level-one:${key}:prepared:${name}`, name, sourceType: "level-one", sourceId: key, source: { ...source, feature: "1 級準備法術" }, content: { name, level: 1, prepared: true } }));
    spellbookSpells.forEach(name => addDerivedAcquisition(target, "spells", { id: `level-one:${key}:spellbook:${name}`, name, sourceType: "level-one", sourceId: key, source: { ...source, feature: "法術書" }, content: { name, level: 1, spellbook: true, prepared: preparedSpells.includes(name), ritual: isRitualSpell(spellOptionByChineseName("wizard", "1", name)) } }));
    (definition.alwaysPrepared || []).forEach(name => addDerivedAcquisition(target, "spells", { id: `level-one:${key}:always:${name}`, name, sourceType: "level-one", sourceId: key, source: { ...source, feature: definition.alwaysPreparedFeature || "始終準備" }, content: { name, level: 1, prepared: true, alwaysPrepared: true, countsAgainstPrepared: false, freeUses: definition.alwaysPreparedFreeUses?.[1] || null } }));
    invocations.forEach(id => addDerivedAcquisition(target, "other", { id: `level-one:${key}:invocation:${id}`, name: ELDRITCH_INVOCATION_OPTIONS.find(option => option.id === id)?.label || id, sourceType: "level-one", sourceId: key, source: { ...source, feature: "魔能祈喚" }, content: { type: "eldritchInvocation", invocation: id } }));
    tomeCantrips.forEach(name => addDerivedAcquisition(target, "spells", { id: `level-one:${key}:tome-cantrip:${name}`, name, sourceType: "level-one", sourceId: key, source: { ...source, feature: "書之魔契" }, content: { name, level: "cantrip", prepared: true, pactTome: true } }));
    tomeRituals.forEach(name => addDerivedAcquisition(target, "spells", { id: `level-one:${key}:tome-ritual:${name}`, name, sourceType: "level-one", sourceId: key, source: { ...source, feature: "書之魔契" }, content: { name, level: 1, prepared: true, ritual: true, pactTome: true } }));
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
      target.choices.classEquipmentOptions = { confirmed: true };
      const currency = { cp: 0, sp: 0, gp: definition.gold, pp: 0 };
      target.selections.classEquipment = {
        id: `${key}:gold`, label: `${definition.gold} 金幣`, source,
        content: { method, items: [], currency, loadout: { mainHand: null, offHand: null, armor: null }, operationOrder: [], confirmed: true }
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
    const confirmed = completeChoices;
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
    target.choices.classEquipmentOptions = { mainHand, offHand, instrument, confirmed };
    const currency = { cp: 0, sp: 0, gp: equipmentPackage.gp, pp: 0 };
    target.selections.classEquipment = {
      id: `${key}:${method}`, label: equipmentPackage.label, source,
      content: { method, items, currency, loadout: { mainHand, offHand, armor: equipmentPackage.armor || null }, specialWrites, operationOrder, pendingChoices: [!mainHand && "主手武器", offCandidates.length && !offHand && "副手", equipmentPackage.instrument && !instrument && "樂器"].filter(Boolean), confirmed }
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
  function getBackgroundStage() {
    if (!draft.choices.background) return "cards";
    if (!draft.choices.backgroundWealth) return "equipment";
    if (draft.choices.background === "soldier" && !GAME_TOOL_OPTIONS.includes(draft.choices.backgroundToolChoice)) return "tool";
    if (["acolyte", "sage"].includes(draft.choices.background) && (!backgroundSpellsComplete() || !draft.choices.backgroundMagicConfirmed)) return "spells";
    return "complete";
  }

  function backgroundSpellsComplete() {
    const magic = draft.choices.backgroundMagic;
    return Array.isArray(magic?.cantrips) && magic.cantrips.length === 2 && magic.cantrips.every(Boolean) &&
      new Set(magic.cantrips).size === 2 && Array.isArray(magic?.levelOneSpells) &&
      magic.levelOneSpells.length === 1;
  }

  function backgroundComplete() {
    return getBackgroundStage() === "complete";
  }

  function racePendingChoices(key = draft.choices.race, options = draft.choices.raceOptions) {
    if (!key) return ["種族"];
    const pending = [];
    if (key === "dragonborn" && !RACE_OPTION_DEFINITIONS.dragonborn.ancestry.includes(options.ancestry)) pending.push("龍族血統");
    if (key === "elf") {
      if (!RACE_OPTION_DEFINITIONS.elf.lineage.includes(options.lineage)) pending.push("精靈傳承");
      if (!RACE_OPTION_DEFINITIONS.elf.skill.includes(options.skill)) pending.push("敏銳感官技能");
      if (options.lineage === "高等精靈血統" && !options.cantrip) pending.push("法師戲法");
      if (options.lineage === "高等精靈血統" && options.cantrip && !options.cantripConfirmed) pending.push("確認法師戲法");
    }
    if (key === "gnome") {
      if (!RACE_OPTION_DEFINITIONS.gnome.lineage.includes(options.lineage)) pending.push("侏儒血統");
    }
    if (key === "goliath") {
      if (!RACE_OPTION_DEFINITIONS.goliath.ancestry.includes(options.ancestry)) pending.push("巨人血統恩賜");
      else if (!options.confirmed) pending.push("確認巨人血統恩賜");
    }
    if (key === "human") {
      if (!RACE_OPTION_DEFINITIONS.human.size.includes(options.size)) pending.push("體型");
      if (!SKILL_OPTIONS.includes(options.skill)) pending.push("技能熟練");
      if (!["警覺", "魔法學徒", "兇蠻打手", "熟習"].includes(options.feat)) pending.push("起源專長");
      const featOptions = isPlainObject(options.featOptions) ? options.featOptions : {};
      if (options.feat === "魔法學徒") {
        const blockedSpellClass = HUMAN_MAGIC_INITIATE_BLOCKED_CLASS_BY_BACKGROUND[draft.choices.background];
        if (!MAGIC_INITIATE_SPELL_CLASSES.has(featOptions.spellClass) || featOptions.spellClass === blockedSpellClass) pending.push("魔法學徒職業法術表");
        if (!Array.isArray(featOptions.cantrips) || featOptions.cantrips.length !== 2 || featOptions.cantrips.some(name => !name) || new Set(featOptions.cantrips).size !== 2) pending.push("魔法學徒的 2 個不同戲法");
        if (!Array.isArray(featOptions.levelOneSpells) || featOptions.levelOneSpells.length !== 1 || !featOptions.levelOneSpells[0]) pending.push("魔法學徒的 1 個一環法術");
      }
      if (options.feat === "熟習") {
        const proficiencies = Array.isArray(featOptions.proficiencies) ? featOptions.proficiencies : [];
        if (proficiencies.length !== 3 || proficiencies.some(value => !value) || new Set(proficiencies).size !== 3) pending.push("熟習的 3 項不同技能或工具");
        const existingSkills = new Set((draft.acquisitions.skills || []).filter(item => item.sourceType === "background").map(item => item.name).concat(options.skill || []));
        const existingTools = new Set((draft.acquisitions.tools || []).filter(item => item.sourceType === "background").map(item => item.name));
        if (proficiencies.some(value => {
          const [type, name] = String(value).split(":");
          return type === "skill" ? existingSkills.has(name) : type === "tool" && existingTools.has(name);
        })) pending.push("熟習選項不可與背景或種族既有熟練項重複");
      }
      if (!options.confirmed) pending.push("確認人類種族選項");
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

  function spellOptions(level) {
    const entries = typeof spellList === "object" ? spellList?.[spellSource()]?.[level] : [];
    return Array.isArray(entries) ? entries : [];
  }

  function selectedSpell(name, level) {
    return spellOptions(level).find(spell => spellChineseName(spell.name) === spellChineseName(name)) || null;
  }

  function ensureStyles() {
    if (document.getElementById("quick-build-wizard-styles")) return;
    const style = document.createElement("style");
    style.id = "quick-build-wizard-styles";
    style.textContent = `
      #quick-build-wizard{position:fixed;inset:0;z-index:10020;display:none;align-items:center;justify-content:center;width:100%;max-width:none;padding:16px;overflow:hidden;overscroll-behavior:contain;background:rgba(8,12,20,.76)}
      #quick-build-wizard.open{display:flex}
      #quick-build-wizard .quick-build-shell{display:flex;flex-direction:column;width:780px;max-width:100%;max-height:calc(100dvh - 32px);overflow:hidden;border:1px solid #64748b;border-radius:16px;background:#111827;color:#f8fafc;box-shadow:0 24px 70px rgba(0,0,0,.5)}
      #quick-build-wizard .quick-build-header{display:flex;flex:0 0 auto;gap:16px;align-items:flex-start;justify-content:space-between;min-width:0;padding:20px 20px 12px;border-bottom:1px solid #334155}
      #quick-build-wizard .quick-build-header>div{flex:1 1 auto;min-width:0}#quick-build-wizard .quick-build-header h2{margin:0;color:#f8fafc;font-size:1.35rem;line-height:1.3}
      #quick-build-wizard .quick-build-progress{margin:5px 0 0;color:#cbd5e1;font-size:.9rem;line-height:1.45}
      #quick-build-wizard button.quick-build-close{display:grid;flex:0 0 40px;place-items:center;width:40px;min-width:40px;height:40px;min-height:40px;margin:0;padding:0;border:0;border-radius:8px;background:transparent;color:#f8fafc;font-size:1.25rem;line-height:1;box-shadow:none;cursor:pointer}
      #quick-build-wizard .quick-build-body{min-height:250px;padding:24px 20px;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain}#quick-build-wizard .quick-build-body h3{margin:0 0 8px;color:#f8fafc}
      #quick-build-wizard .quick-build-lead{margin:0 0 18px;color:#cbd5e1}.quick-build-background-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.quick-build-class-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
      #quick-build-wizard .quick-build-card{width:100%;min-height:0;padding:16px;border:1px solid #475569;border-radius:12px;background:#1e293b;color:#f8fafc;text-align:left;cursor:pointer}
      #quick-build-wizard .quick-build-card:hover,#quick-build-wizard .quick-build-card:focus-visible{border-color:#38bdf8;background:#243449;outline:2px solid transparent}.quick-build-card h4{margin:0 0 10px;font-size:1.12rem;color:#7dd3fc}
      .quick-build-summary{display:grid;grid-template-columns:auto 1fr;gap:6px 10px;margin:0;font-size:.9rem;line-height:1.45}.quick-build-summary dt{color:#94a3b8}.quick-build-summary dd{margin:0;color:#f1f5f9}
      .quick-build-choice-panel{padding:18px;border:1px solid #475569;border-radius:12px;background:#172033}.quick-build-review-panel+ .quick-build-review-panel{margin-top:14px}.quick-build-review-panel>h4{margin:0 0 14px;color:#f8fafc}.quick-build-equipment-list{margin:12px 0 20px;padding:14px;border-radius:8px;background:#0f172a;line-height:1.7;color:#e2e8f0}
      .quick-build-race-options{display:grid;gap:16px}.quick-build-option-note{margin:6px 0 0;color:#94a3b8;font-size:.9rem}.quick-build-ancestry-detail{margin:0;padding:14px;border:1px solid #475569;border-radius:9px;background:#0f172a;color:#e2e8f0;line-height:1.65}.quick-build-ancestry-detail strong{display:block;margin-bottom:5px;color:#7dd3fc}.quick-build-warning{margin:14px 0;padding:12px;border-left:4px solid #f59e0b;border-radius:7px;background:#422006;color:#fef3c7}.quick-build-pending{margin-top:14px;padding:12px;border-radius:7px;background:#312e81;color:#e0e7ff}
      .quick-build-choice-actions{display:grid;grid-template-columns:1fr 1fr;gap:12px}.quick-build-choice-actions button{min-height:48px;padding:10px;border:1px solid #64748b;border-radius:8px;background:#1e293b;color:#fff;cursor:pointer}.quick-build-choice-actions button.primary{border-color:#0284c7;background:#0369a1}.quick-build-choice-actions .quick-build-choice-action-full{grid-column:1/-1}
      .quick-build-change{margin:0 0 14px;padding:0;border:0;background:transparent;color:#7dd3fc;text-decoration:underline;cursor:pointer}.quick-build-spell-layout{display:grid;gap:16px}
      .quick-build-spell-finish{width:100%;min-height:52px;margin:0;padding:12px 18px;border:1px solid #38bdf8;border-radius:9px;background:#0369a1;color:#fff;font-size:1rem;font-weight:700;cursor:pointer}.quick-build-spell-finish:hover{background:#075985}.quick-build-spell-finish:disabled{border-color:#64748b;background:#334155;color:#94a3b8;cursor:not-allowed}.quick-build-human-race-finish{display:block;width:12em;max-width:100%;min-height:46px;margin-right:auto;margin-left:auto;padding:9px 16px;border-color:#0284c7;border-radius:8px;font-size:inherit}.quick-build-human-race-finish-top{margin-bottom:18px}.quick-build-human-race-finish-bottom{margin-top:18px}
      .quick-build-spell-fields{display:flex;flex-direction:column;gap:14px}.quick-build-field label{display:block;margin-bottom:6px;color:#cbd5e1}.quick-build-field-control{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.quick-build-field-control.has-confirm{grid-template-columns:minmax(0,1fr) auto auto}.quick-build-field select{width:100%;min-height:44px;padding:8px;border:1px solid #64748b;border-radius:7px;background:#0f172a;color:#fff}.quick-build-spell-view,.quick-build-option-confirm{min-width:64px;margin:0;padding:8px 12px;border:1px solid #64748b;border-radius:7px;background:#1e293b;color:#fff;cursor:pointer}.quick-build-option-confirm{border-color:#0284c7;background:#0369a1}.quick-build-spell-view:disabled,.quick-build-option-confirm:disabled{color:#94a3b8;cursor:not-allowed;opacity:.55}
      #quick-build-spell-detail{position:fixed;inset:0;z-index:10030;display:none;align-items:center;justify-content:center;width:100%;max-width:none;padding:32px;overflow:hidden;overscroll-behavior:contain;background:rgba(2,6,23,.82)}
      #quick-build-spell-detail.open{display:flex}#quick-build-spell-detail .quick-build-spell-detail-shell{display:flex;flex-direction:column;width:680px;max-width:calc(100% - 32px);max-height:calc(100dvh - 80px);overflow:hidden;border:1px solid #64748b;border-radius:14px;background:#111827;color:#f8fafc;box-shadow:0 28px 80px rgba(0,0,0,.68)}
      #quick-build-spell-detail .quick-build-spell-detail-header{display:flex;flex:0 0 auto;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px;border-bottom:1px solid #334155}#quick-build-spell-detail-title{margin:0;color:#f8fafc;font-size:1.2rem}
      #quick-build-spell-detail .quick-build-spell-detail-close{display:grid;flex:0 0 44px;place-items:center;width:44px;min-width:44px;height:44px;min-height:44px;margin:0;padding:0;border:1px solid transparent;border-radius:9px;background:#1e293b;color:#f8fafc;font-size:1.5rem;line-height:1;cursor:pointer;touch-action:manipulation}#quick-build-spell-detail .quick-build-spell-detail-close:hover,#quick-build-spell-detail .quick-build-spell-detail-close:focus-visible{border-color:#38bdf8;background:#243449;outline:2px solid transparent}
      #quick-build-spell-detail-content{min-height:120px;padding:20px;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;white-space:pre-wrap;color:#e2e8f0;line-height:1.65}#quick-build-spell-detail-content strong{display:block;margin-bottom:12px;color:#7dd3fc;font-size:1.08rem}
      .quick-build-ability-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:0 0 16px}.quick-build-ability-heading h3{margin:0!important}.quick-build-ability-status{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}.quick-build-status-pill{padding:6px 10px;border:1px solid #475569;border-radius:999px;background:#172033;color:#cbd5e1;font-size:.82rem;line-height:1.2}.quick-build-status-pill strong{color:#f8fafc}.quick-build-status-pill.is-complete{border-color:#166534;background:#052e24;color:#bbf7d0}.quick-build-ability-confirm{display:block;width:12em;max-width:100%;min-height:46px;margin:0 auto 18px;padding:9px 16px;border:1px solid #0284c7;border-radius:8px;background:#0369a1;color:#fff;cursor:pointer}.quick-build-ability-confirm:disabled{border-color:#64748b;background:#334155;color:#94a3b8;cursor:not-allowed}.quick-build-ability-grid{display:grid;gap:12px;padding:14px}.quick-build-ability-row{display:grid;grid-template-columns:minmax(92px,.7fr) minmax(0,2fr) minmax(74px,.55fr);gap:16px;align-items:center;padding:14px 16px;border:1px solid #334155;border-radius:10px;background:#0f172a}.quick-build-ability-name{display:flex;flex-direction:column;gap:3px}.quick-build-ability-name strong{font-size:1.05rem;color:#f8fafc}.quick-build-ability-name small{color:#94a3b8;font-size:.76rem}.quick-build-ability-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.quick-build-ability-field{display:grid;gap:6px;min-width:0;color:#cbd5e1;font-size:.82rem}.quick-build-ability-field select{width:100%;min-width:0;min-height:44px;margin:0;padding:8px 34px 8px 12px;border:1px solid #64748b;border-radius:8px;background:#111827;color:#f8fafc;font:inherit;font-size:1rem}.quick-build-ability-field select:focus-visible{border-color:#38bdf8;outline:2px solid #38bdf8;outline-offset:1px}.quick-build-ability-field select:disabled{border-color:#334155;background:#172033;color:#64748b;opacity:1}.quick-build-ability-total{display:grid;gap:2px;justify-items:end}.quick-build-ability-total span{color:#94a3b8;font-size:.75rem}.quick-build-ability-total strong{color:#7dd3fc;font-size:1.45rem;line-height:1}.quick-build-ability-help{display:flex;flex-wrap:wrap;gap:6px 16px;margin:0 0 18px;color:#94a3b8;font-size:.88rem}.quick-build-ability-help strong{color:#e2e8f0}.quick-build-complete{padding:18px;border-left:4px solid #22c55e;border-radius:8px;background:#052e24;color:#d1fae5}.quick-build-plan{margin:20px 0 0;padding-left:1.4rem;line-height:1.8;color:#e2e8f0}.quick-build-plan li.current{color:#7dd3fc;font-weight:700}
      .quick-build-class-card{min-height:128px!important}.quick-build-class-card p{margin:0;color:#dbeafe;line-height:1.55}.quick-build-substep-actions{display:flex;justify-content:space-between;gap:12px;margin-top:18px}.quick-build-substep-actions button{min-height:46px;padding:9px 16px;border:1px solid #64748b;border-radius:8px;background:#1e293b;color:#fff;cursor:pointer}.quick-build-substep-actions button.primary{border-color:#0284c7;background:#0369a1}.quick-build-substep-actions button:disabled{cursor:not-allowed;opacity:.45}.quick-build-proficiency-grid{display:grid;gap:14px}.quick-build-fixed-list{margin:12px 0 0;padding:12px;border-radius:8px;background:#0f172a;color:#e2e8f0;line-height:1.6}.quick-build-summary-list{display:grid;grid-template-columns:auto 1fr;gap:8px 14px;margin:0}.quick-build-summary-list dt{color:#94a3b8}.quick-build-summary-list dd{margin:0;color:#f8fafc}.quick-build-ability-summary{display:grid;gap:6px}.quick-build-ability-summary-row{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:baseline}.quick-build-ability-modifier{font-weight:800;color:#bfdbfe}.quick-build-ability-modifier-sign{color:#fbbf24}.quick-build-ability-modifier-value{color:#67e8f9}.quick-build-complete .quick-build-summary-list dt{color:#a7f3d0}.quick-build-complete .quick-build-summary-list dd{color:#ecfdf5}.quick-build-source-warning{margin-top:10px;color:#fde68a;font-size:.9rem}.quick-build-complete{padding:18px;border-left:4px solid #22c55e;border-radius:8px;background:#052e24;color:#d1fae5}.quick-build-plan{margin:20px 0 0;padding-left:1.4rem;line-height:1.8;color:#e2e8f0}.quick-build-plan li.current{color:#7dd3fc;font-weight:700}
      #quick-build-wizard .quick-build-footer{display:flex;flex:0 0 auto;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px;border-top:1px solid #334155}#quick-build-wizard .quick-build-footer[hidden]{display:none}#quick-build-wizard .quick-build-footer-group{display:flex;gap:10px}
      #quick-build-wizard .quick-build-footer button{width:auto;min-width:0;min-height:42px;padding:8px 16px;border:1px solid #64748b;border-radius:8px;background:#1e293b;color:#fff;cursor:pointer}.quick-build-footer button.primary{border-color:#0284c7;background:#0369a1}.quick-build-footer button:disabled{cursor:not-allowed;opacity:.45}
      #quick-build-wizard .quick-build-footer button.quick-build-discard{border-color:#b91c1c;background:transparent;color:#fca5a5}
      @media(max-width:760px){.quick-build-class-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:620px){#quick-build-wizard .quick-build-body{padding:20px 16px}.quick-build-ability-heading{display:grid;gap:12px}.quick-build-ability-status{justify-content:flex-start}.quick-build-ability-grid{gap:10px;padding:10px}.quick-build-ability-row{grid-template-columns:minmax(72px,.55fr) minmax(0,1.45fr) 50px;gap:10px;padding:12px}.quick-build-ability-controls{grid-template-columns:1fr;gap:9px}.quick-build-ability-field{gap:4px}.quick-build-ability-field select{min-height:42px}.quick-build-ability-total strong{font-size:1.3rem}.quick-build-field-control.has-confirm{grid-template-columns:minmax(0,1fr) auto}.quick-build-field-control.has-confirm .quick-build-option-confirm{grid-column:1/-1}.quick-build-background-grid,.quick-build-class-grid{grid-template-columns:1fr}.quick-build-choice-actions{grid-template-columns:1fr}.quick-build-substep-actions:not(.quick-build-inline-actions){display:grid;grid-template-columns:1fr}.quick-build-substep-actions button{width:100%}.quick-build-inline-actions button{flex:1 1 0;width:auto;min-width:0}#quick-build-wizard .quick-build-footer{align-items:stretch;flex-direction:column}#quick-build-wizard .quick-build-footer-group{display:grid;grid-template-columns:1fr 1fr}#quick-build-wizard .quick-build-footer button{width:100%}#quick-build-spell-detail{padding:16px}#quick-build-spell-detail .quick-build-spell-detail-shell{max-width:100%;max-height:calc(100dvh - 32px)}#quick-build-spell-detail-content{padding:18px 16px}}
    `;
    document.head.appendChild(style);
  }

  function ensureWizard() {
    let modal = document.getElementById("quick-build-wizard");
    if (modal) return modal;
    ensureStyles();
    modal = document.createElement("div");
    modal.id = "quick-build-wizard";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <section class="quick-build-shell" role="dialog" aria-modal="true" aria-labelledby="quick-build-title">
        <header class="quick-build-header"><div><h2 id="quick-build-title">創角精靈</h2><p class="quick-build-progress" aria-live="polite"></p></div><button type="button" class="quick-build-close" aria-label="儲存草稿並關閉">✕</button></header>
        <main class="quick-build-body"></main>
        <footer class="quick-build-footer"><div class="quick-build-footer-group"><button type="button" class="quick-build-save-close">儲存並離開</button><button type="button" class="quick-build-discard">捨棄草稿</button></div><div class="quick-build-footer-group"><button type="button" class="quick-build-previous">上一步</button><button type="button" class="quick-build-next primary">下一步</button></div></footer>
      </section>`;
    document.body.appendChild(modal);
    modal.querySelector(".quick-build-close").addEventListener("click", closeWizard);
    modal.querySelector(".quick-build-save-close").addEventListener("click", closeWizard);
    modal.querySelector(".quick-build-discard").addEventListener("click", discardDraft);
    modal.querySelector(".quick-build-previous").addEventListener("click", () => goToStep(draft.currentStep - 1));
    modal.querySelector(".quick-build-next").addEventListener("click", () => goToStep(draft.currentStep + 1));
    modal.addEventListener("click", event => { if (event.target === modal) closeWizard(); });
    modal.addEventListener("keydown", trapWizardKeyboard);
    return modal;
  }

  function ensureSpellDetailModal() {
    ensureStyles();
    let modal = document.getElementById("quick-build-spell-detail");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "quick-build-spell-detail";
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
      return `<button type="button" class="quick-build-card" data-background="${key}"><h4>${BACKGROUND_LABELS[key]}</h4><dl class="quick-build-summary"><dt>技能熟練</dt><dd>${escapeHtml(plainText(data.技能熟練))}</dd><dt>起源專長</dt><dd>${escapeHtml(data.專長)}</dd><dt>工具</dt><dd>${escapeHtml(tool)}</dd><dt>可調整屬性</dt><dd>${escapeHtml(data.屬性)}</dd></dl></button>`;
    }).join("")}</div>`;
    body.querySelectorAll("[data-background]").forEach(card => card.addEventListener("click", () => chooseBackground(card.dataset.background)));
  }

  function renderBackgroundEquipment(body) {
    const key = draft.choices.background;
    const data = backgroundData(key) || {};
    body.innerHTML = `<button type="button" class="quick-build-change">← 重新選擇背景</button><h3>${BACKGROUND_LABELS[key]}：背景裝備</h3><p class="quick-build-lead">是否取得背景提供的預設裝備？若選否，改為獲得 50 金幣。</p><section class="quick-build-choice-panel"><strong>預設裝備 A</strong><div class="quick-build-equipment-list">${escapeHtml(data.裝備A)}</div><div class="quick-build-choice-actions"><button type="button" class="primary" data-wealth="default">取得預設裝備</button><button type="button" data-wealth="gold">否，取得 50 金幣</button></div></section>`;
    body.querySelector(".quick-build-change").addEventListener("click", resetBackground);
    body.querySelectorAll("[data-wealth]").forEach(button => button.addEventListener("click", () => chooseBackgroundWealth(button.dataset.wealth)));
  }

  function renderBackgroundToolChoice(body) {
    const selected = draft.choices.backgroundToolChoice || "";
    body.innerHTML = `<button type="button" class="quick-build-change">← 返回裝備選擇</button><h3>士兵：熟練賭具選擇</h3><p class="quick-build-lead">選擇士兵背景提供的賭具熟練項。</p><section class="quick-build-choice-panel"><div class="quick-build-field"><label for="quick-build-background-game-tool">熟練賭具</label><select id="quick-build-background-game-tool"><option value="">請選擇</option>${GAME_TOOL_OPTIONS.map(name => `<option value="${escapeHtml(name)}"${name === selected ? " selected" : ""}>${escapeHtml(name)}</option>`).join("")}</select></div></section>`;
    body.querySelector(".quick-build-change").addEventListener("click", returnToBackgroundEquipment);
    body.querySelector("#quick-build-background-game-tool").addEventListener("change", chooseBackgroundTool);
  }

  function spellSelect(id, label, entries, value, excluded = "") {
    return `<div class="quick-build-field"><label for="${id}">${label}</label><div class="quick-build-field-control"><select id="${id}" data-spell-field><option value="">請選擇</option>${entries.map(spell => {
      const name = spellChineseName(spell.name);
      return `<option value="${escapeHtml(name)}"${name === value ? " selected" : ""}${name === excluded ? " disabled" : ""}>${escapeHtml(name)}</option>`;
    }).join("")}</select><button type="button" class="quick-build-spell-view" data-spell-view="${id}"${value ? "" : " disabled"}>查看</button></div></div>`;
  }

  function renderBackgroundSpells(body) {
    const magic = draft.choices.backgroundMagic;
    const cantrips = spellOptions("cantrips");
    const levelOne = spellOptions("1");
    body.innerHTML = `<button type="button" class="quick-build-change">← 返回裝備選擇</button><h3>${BACKGROUND_LABELS[draft.choices.background]}：選擇法術</h3><p class="quick-build-lead">選擇2個不同的戲法與1個一環法術；按「查看」可在法術詳情視窗中閱讀完整敘述。</p><div class="quick-build-spell-layout"><div class="quick-build-spell-fields">${spellSelect("quick-build-cantrip-1", "戲法 1", cantrips, magic.cantrips[0], magic.cantrips[1])}${spellSelect("quick-build-cantrip-2", "戲法 2", cantrips, magic.cantrips[1], magic.cantrips[0])}${spellSelect("quick-build-level-one", "一環法術", levelOne, magic.levelOneSpells[0])}</div><button type="button" class="quick-build-spell-finish"${backgroundSpellsComplete() ? "" : " disabled"}>我選好了</button></div>`;
    body.querySelector(".quick-build-change").addEventListener("click", returnToBackgroundEquipment);
    body.querySelectorAll("[data-spell-field]").forEach(select => {
      select.addEventListener("input", event => updateBackgroundSpells(event.currentTarget));
      select.addEventListener("change", event => updateBackgroundSpells(event.currentTarget));
    });
    body.querySelectorAll("[data-spell-view]").forEach(button => {
      button.addEventListener("click", () => {
        const select = body.querySelector(`#${button.dataset.spellView}`);
        showSpellDescription(select, button);
      });
    });
    body.querySelector(".quick-build-spell-finish").addEventListener("click", finishBackgroundSpells);
    refreshBackgroundSpellControls(body);
  }

  function renderBackgroundComplete(body) {
    const data = backgroundData(draft.choices.background) || {};
    const wealth = draft.choices.backgroundWealth === "default" ? data.裝備A : "50 金幣自購";
    const spells = draft.choices.backgroundMagic.cantrips
      .concat(draft.choices.backgroundMagic.levelOneSpells)
      .filter(Boolean);
    const tool = draft.choices.background === "soldier" ? draft.choices.backgroundToolChoice : displayList(data.工具熟練);
    const classBonusWarning = draft.choices.classOptions?.backgroundBonusInvalidated ? `<div class="quick-build-warning"><strong>改變背景需要重新設定屬性加值</strong><br>你的 27 點基礎屬性已保留，但背景加值已重設為 0/3；按下一步後會前往「職業：屬性與背景加值」重新分配。</div>` : "";
    const duplicateWarnings = crossSourceDuplicateGroups(draft, "skills", ["background", "race", "class", "level-one"])
      .concat(crossSourceDuplicateGroups(draft, "spells", ["background", "race", "class", "level-one"]));
    const duplicateWarning = duplicateWarnings.length ? `<div class="quick-build-warning"><strong>跨步驟同能力提醒</strong><br>${duplicateWarnings.map(group => escapeHtml(duplicateGroupText(group))).join("、")}。後續步驟的同名選項也會列入檢查；來源紀錄都會保留。</div>` : "";
    body.innerHTML = `<button type="button" class="quick-build-change">← 修改背景選擇</button><h3>背景選擇完成</h3><div class="quick-build-complete"><strong>${BACKGROUND_LABELS[draft.choices.background]}</strong><br>技能：${escapeHtml(displayList(data.技能熟練))}<br>起源專長：${escapeHtml(data.專長)}<br>工具：${escapeHtml(tool)}<br>裝備：${escapeHtml(wealth)}<br>可調整屬性：${escapeHtml(displayList(data.屬性))}${spells.length ? `<br>法術：${spells.map(escapeHtml).join("、")}` : ""}</div>${classBonusWarning}${duplicateWarning}`;
    body.querySelector(".quick-build-change").addEventListener("click", returnToBackgroundEquipment);
  }

  function renderBackground(body) {
    const stage = getBackgroundStage();
    if (stage === "cards") renderBackgroundCards(body);
    else if (stage === "equipment") renderBackgroundEquipment(body);
    else if (stage === "tool") renderBackgroundToolChoice(body);
    else if (stage === "spells") renderBackgroundSpells(body);
    else renderBackgroundComplete(body);
  }

  function raceSelect(field, label, values, { disabled = [], note = "" } = {}) {
    const selected = draft.choices.raceOptions[field] || "";
    return `<div class="quick-build-field"><label for="quick-build-race-${field}">${label}</label><select id="quick-build-race-${field}" data-race-option="${field}"><option value="">請選擇</option>${values.map(value => `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}${disabled.includes(value) ? " disabled" : ""}>${escapeHtml(value)}${disabled.includes(value) ? "（已由其他來源取得）" : ""}</option>`).join("")}</select>${note ? `<p class="quick-build-option-note">${escapeHtml(note)}</p>` : ""}</div>`;
  }

  function raceConfirmedSelect(field, label, values, { showSpellView = false, confirmed = false } = {}) {
    const selected = draft.choices.raceOptions[field] || "";
    return `<div class="quick-build-field"><label for="quick-build-race-${field}">${label}</label><div class="quick-build-field-control has-confirm"><select id="quick-build-race-${field}" data-race-option="${field}"><option value="">請選擇</option>${values.map(value => `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(value)}</option>`).join("")}</select>${showSpellView ? `<button type="button" class="quick-build-spell-view" data-race-spell-view="${field}"${selected ? "" : " disabled"}>查看</button>` : ""}<button type="button" class="quick-build-option-confirm" data-race-option-confirm="${field}"${selected && !confirmed ? "" : " disabled"}>${confirmed ? "已確定" : "確定"}</button></div></div>`;
  }

  function raceFeatSelect(label, values, { disabled = [], note = "" } = {}) {
    const selected = draft.choices.raceOptions.feat || "";
    return `<div class="quick-build-field"><label for="quick-build-race-feat">${label}</label><div class="quick-build-field-control"><select id="quick-build-race-feat" data-race-option="feat"><option value="">請選擇</option>${values.map(value => `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}${disabled.includes(value) ? " disabled" : ""}>${escapeHtml(value)}${disabled.includes(value) ? "（已由其他來源取得）" : ""}</option>`).join("")}</select><button type="button" class="quick-build-spell-view" data-race-feat-view${selected ? "" : " disabled"}>查看</button></div>${note ? `<p class="quick-build-option-note">${escapeHtml(note)}</p>` : ""}</div>`;
  }

  function renderRaceCards(body) {
    body.innerHTML = `<h3>選擇種族</h3><p class="quick-build-lead">種族決定角色的外觀、體型、速度以及特殊能力。</p><div class="quick-build-background-grid">${RACE_ORDER.map(key => `<button type="button" class="quick-build-card" data-race="${key}"><h4>${RACE_LABELS[key]}</h4><p>${escapeHtml(RACE_CARD_DESCRIPTIONS[key])}</p></button>`).join("")}</div>`;
    body.querySelectorAll("[data-race]").forEach(card => card.addEventListener("click", () => chooseRace(card.dataset.race)));
  }

  function humanMagicSpellSelect(id, label, entries, value, excluded = "") {
    return spellSelect(id, label, entries, value, excluded).replace("data-spell-field", "data-human-magic-spell");
  }

  function renderHumanMagicFeatOptions() {
    const featOptions = isPlainObject(draft.choices.raceOptions.featOptions) ? draft.choices.raceOptions.featOptions : {};
    const spellClass = featOptions.spellClass || "";
    const blockedSpellClass = HUMAN_MAGIC_INITIATE_BLOCKED_CLASS_BY_BACKGROUND[draft.choices.background];
    const cantrips = MAGIC_INITIATE_SPELL_CLASSES.has(spellClass) ? spellList?.[spellClass]?.cantrips || [] : [];
    const levelOne = MAGIC_INITIATE_SPELL_CLASSES.has(spellClass) ? spellList?.[spellClass]?.[1] || [] : [];
    const selectedCantrips = Array.isArray(featOptions.cantrips) ? featOptions.cantrips : ["", ""];
    return `<section class="quick-build-choice-panel"><h4>魔法學徒選項</h4><p class="quick-build-option-note">按「查看」可在法術詳情視窗中閱讀完整敘述。</p><div class="quick-build-spell-fields"><div class="quick-build-field"><label for="quick-build-human-spell-class">--職業--</label><select id="quick-build-human-spell-class" data-human-spell-class><option value="">--職業--</option><option value="cleric"${spellClass === "cleric" ? " selected" : ""}${blockedSpellClass === "cleric" ? " disabled" : ""}>牧師</option><option value="druid"${spellClass === "druid" ? " selected" : ""}>德魯伊</option><option value="wizard"${spellClass === "wizard" ? " selected" : ""}${blockedSpellClass === "wizard" ? " disabled" : ""}>法師</option></select></div>${humanMagicSpellSelect("quick-build-human-cantrip-1", "戲法 1", cantrips, selectedCantrips[0], selectedCantrips[1])}${humanMagicSpellSelect("quick-build-human-cantrip-2", "戲法 2", cantrips, selectedCantrips[1], selectedCantrips[0])}${humanMagicSpellSelect("quick-build-human-level-one", "一環法術", levelOne, featOptions.levelOneSpells?.[0] || "")}</div></section>`;
  }

  function mixedProficiencySelect(index, selected, excluded, acquiredSkills, acquiredTools) {
    const options = [`<option value="">請選擇</option>`, `<option disabled>--------- 技能 ---------</option>`]
      .concat(SKILL_OPTIONS.map(name => `<option value="skill:${escapeHtml(name)}"${selected === `skill:${name}` ? " selected" : ""}${excluded.includes(`skill:${name}`) || acquiredSkills.has(name) ? " disabled" : ""}>技能：${escapeHtml(name)}</option>`))
      .concat(`<option disabled>--------- 工具 ---------</option>`)
      .concat(TOOL_OPTIONS.map(name => `<option value="tool:${escapeHtml(name)}"${selected === `tool:${name}` ? " selected" : ""}${excluded.includes(`tool:${name}`) || acquiredTools.has(name) ? " disabled" : ""}>工具：${escapeHtml(name)}</option>`))
      .concat(`<option disabled>--------- 賭具與樂器 ---------</option>`)
      .concat(GAME_TOOL_OPTIONS.concat(INSTRUMENT_TOOL_OPTIONS).map(name => `<option value="tool:${escapeHtml(name)}"${selected === `tool:${name}` ? " selected" : ""}${excluded.includes(`tool:${name}`) || acquiredTools.has(name) ? " disabled" : ""}>工具：${escapeHtml(name)}</option>`));
    return `<div class="quick-build-field"><label for="quick-build-human-skilled-${index}">熟習選項 ${index + 1}</label><select id="quick-build-human-skilled-${index}" data-human-skilled>${options.join("")}</select></div>`;
  }

  function renderHumanSkilledFeatOptions() {
    const featOptions = isPlainObject(draft.choices.raceOptions.featOptions) ? draft.choices.raceOptions.featOptions : {};
    const selected = Array.isArray(featOptions.proficiencies) ? featOptions.proficiencies.slice(0, 3) : [];
    while (selected.length < 3) selected.push("");
    const acquiredSkills = new Set((draft.acquisitions.skills || []).filter(item => item.source?.feature !== "靈活人才：熟習").map(item => item.name));
    const acquiredTools = new Set((draft.acquisitions.tools || []).filter(item => item.source?.feature !== "靈活人才：熟習").map(item => item.name));
    return `<section class="quick-build-choice-panel"><h4>熟習選項</h4><p class="quick-build-option-note">選擇 3 項不同的技能或工具。已從背景或種族取得的熟練項不可重複選擇。</p><div class="quick-build-race-options">${selected.map((value, index) => mixedProficiencySelect(index, value, selected.filter((_, other) => other !== index), acquiredSkills, acquiredTools)).join("")}</div></section>`;
  }

  function renderRaceOptions(body) {
    const key = draft.choices.race;
    const options = draft.choices.raceOptions;
    const backgroundSkills = (draft.acquisitions.skills || []).filter(item => item.sourceType === "background").map(item => item.name);
    const backgroundFeats = (draft.acquisitions.feats || []).filter(item => item.sourceType === "background").map(item => item.name);
    const originFeats = ["警覺", "魔法學徒", "兇蠻打手", "熟習"];
    const fields = [];
    if (key === "dragonborn") fields.push(raceSelect("ancestry", "龍族血統", RACE_OPTION_DEFINITIONS.dragonborn.ancestry));
    if (key === "elf") {
      fields.push(raceSelect("lineage", "精靈傳承", RACE_OPTION_DEFINITIONS.elf.lineage));
      fields.push(raceSelect("skill", "敏銳感官技能熟練", RACE_OPTION_DEFINITIONS.elf.skill, { disabled: backgroundSkills, note: "背景的固定技能不可重複；已由背景取得的項目會停用。" }));
      if (options.lineage === "高等精靈血統") fields.push(raceConfirmedSelect("cantrip", "法師戲法", spellOptionsForBackground("sage", "cantrips").map(spell => spellChineseName(spell.name)), { showSpellView: true, confirmed: Boolean(options.cantripConfirmed) }));
    }
    if (key === "gnome") {
      fields.push(raceSelect("lineage", "侏儒血統", RACE_OPTION_DEFINITIONS.gnome.lineage));
    }
    if (key === "goliath") fields.push(raceConfirmedSelect("ancestry", "巨人血統恩賜", RACE_OPTION_DEFINITIONS.goliath.ancestry, { confirmed: Boolean(options.confirmed) }));
    if (key === "human") {
      fields.push(raceSelect("size", "體型", RACE_OPTION_DEFINITIONS.human.size));
      fields.push(raceSelect("skill", "技藝嫻熟：技能熟練", SKILL_OPTIONS, { disabled: backgroundSkills, note: "背景的固定技能不可重複；已由背景取得的項目會停用。" }));
      fields.push(raceFeatSelect("靈活人才：起源專長", originFeats, { disabled: backgroundFeats, note: "已從背景取得的相同專長不可重複選擇。魔法學徒與熟習會繼續顯示專長選項。" }));
    }
    if (key === "tiefling") {
      fields.push(raceSelect("size", "體型", RACE_OPTION_DEFINITIONS.tiefling.size));
      fields.push(raceSelect("legacy", "邪魔遺贈", RACE_OPTION_DEFINITIONS.tiefling.legacy));
    }
    const humanFeatPanel = key === "human" && options.feat === "魔法學徒" ? renderHumanMagicFeatOptions() : key === "human" && options.feat === "熟習" ? renderHumanSkilledFeatOptions() : "";
    const humanFinish = position => key === "human" ? `<button type="button" class="quick-build-spell-finish quick-build-human-race-finish quick-build-human-race-finish-${position}" data-human-race-confirm${humanRaceOptionsComplete(options) ? "" : " disabled"}>我選好了</button>` : "";
    const goliathDetail = key === "goliath" && GOLIATH_ANCESTRY_DETAILS[options.ancestry]
      ? `<div class="quick-build-ancestry-detail"><strong>${escapeHtml(options.ancestry)}</strong>${escapeHtml(GOLIATH_ANCESTRY_DETAILS[options.ancestry])}</div>`
      : "";
    body.innerHTML = `<button type="button" class="quick-build-change">← 重新選擇種族</button><h3>${RACE_LABELS[key]}種族選項</h3><p class="quick-build-lead">請選擇下列種族細節</p>${humanFinish("top")}<section class="quick-build-choice-panel quick-build-race-options">${fields.join("")}${goliathDetail}</section>${humanFeatPanel}${humanFinish("bottom")}`;
    body.querySelector(".quick-build-change").addEventListener("click", resetRace);
    body.querySelectorAll("[data-race-option]").forEach(select => select.addEventListener("change", updateRaceOption));
    body.querySelectorAll("[data-race-option-confirm]").forEach(button => button.addEventListener("click", confirmRaceOption));
    body.querySelectorAll("[data-race-spell-view]").forEach(button => button.addEventListener("click", () => showRaceSpellDescription(button.dataset.raceSpellView, button)));
    body.querySelector("[data-race-feat-view]")?.addEventListener("click", event => showHumanFeatDescription(event.currentTarget));
    body.querySelector("[data-human-spell-class]")?.addEventListener("change", updateHumanMagicFeat);
    body.querySelectorAll("[data-human-magic-spell]").forEach(select => select.addEventListener("change", updateHumanMagicFeat));
    body.querySelectorAll("[data-spell-view]").forEach(button => button.addEventListener("click", () => showHumanFeatSpellDescription(button.dataset.spellView, button)));
    body.querySelectorAll("[data-human-skilled]").forEach(select => select.addEventListener("change", updateHumanSkilledFeat));
    body.querySelectorAll("[data-human-race-confirm]").forEach(button => button.addEventListener("click", confirmHumanRaceOptions));
  }

  function humanRaceOptionsComplete(options = draft.choices.raceOptions) {
    return racePendingChoices("human", { ...options, confirmed: true }).length === 0;
  }

  function raceSpellConflicts() {
    return (draft.acquisitions.spells || []).filter(item => item.sourceType === "race" && acquisitionAppliesAtLevel(item)).flatMap(item =>
      acquisitionConflicts(draft, "spells", item.name, "race")
        .filter(conflict => conflict.sourceType === "background")
        .map(conflict => {
          const id = `spell:${item.name}:background-race`;
          return { id, name: item.name, resolution: draft.choices.spellConflictResolutions[id] || null };
        })
    );
  }

  function elfSummarySpells(options) {
    if (options.lineage === "卓爾血統") return "舞光術、妖火（3 級）、黑暗術（5 級）";
    if (options.lineage === "高等精靈血統") return `${options.cantrip}、偵測魔法（3 級）、迷蹤步（5 級）`;
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
        : options.feat || "";
      const lines = [`體型：${options.size || ""}`, "速度：30 呎", `技能：${options.skill || ""}`, "長休後獲得英雄激勵骰", `起始專長：${featName}`];
      if (options.feat === "魔法學徒") {
        lines.push("專長選項：");
        lines.push(`戲法：${(featOptions.cantrips || []).filter(Boolean).join("、")}`);
        lines.push(`一環法術：${(featOptions.levelOneSpells || []).filter(Boolean).join("、")}`);
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
    const completionLines = raceCompletionLines(key, draft.choices.raceOptions);
    const conflicts = raceSpellConflicts();
    const allDuplicates = crossSourceDuplicateGroups(draft, "skills", ["background", "race", "class", "level-one"])
      .concat(crossSourceDuplicateGroups(draft, "spells", ["background", "race", "class", "level-one"]));
    const duplicateWarning = allDuplicates.length ? `<div class="quick-build-warning"><strong>跨步驟同能力提醒</strong><br>${allDuplicates.map(group => escapeHtml(duplicateGroupText(group))).join("、")}。前後步驟的同名項目都會列入檢查；來源紀錄都會保留。</div>` : "";
    const pending = racePendingChoices().filter(item => item.includes("後續步驟選擇"));
    body.innerHTML = `<button type="button" class="quick-build-change">← 修改種族選擇</button><h3>種族選擇完成</h3><div class="quick-build-complete"><strong>${RACE_LABELS[key]}</strong>${completionLines.map(line => `<br>${escapeHtml(line)}`).join("")}</div>${conflicts.length ? `<div class="quick-build-warning"><strong>法術跨來源同名</strong><br>${conflicts.map(item => escapeHtml(item.name)).join("、")} 同時來自背景與種族。你可回背景修改，或直接進入下一步；1 級總覽會保留並標示每一筆來源。<div class="quick-build-choice-actions"><button type="button" data-spell-conflict="edit-background">回背景修改</button></div></div>` : ""}${duplicateWarning}${pending.length ? `<div class="quick-build-pending"><strong>尚未完成的後續必要選擇</strong><br>${pending.map(escapeHtml).join("、")}。此狀態已保存在 draft，後續步驟實作時必須完成。</div>` : ""}`;
    body.querySelector(".quick-build-change").addEventListener("click", () => {
      if (["dwarf", "halfling", "orc"].includes(key)) resetRace();
      else { draft.choices.raceOptions.editing = true; saveDraft(); render(); }
    });
    body.querySelectorAll("[data-spell-conflict]").forEach(button => button.addEventListener("click", () => resolveRaceSpellConflicts(button.dataset.spellConflict)));
  }

  function renderRace(body) {
    if (!draft.choices.race) renderRaceCards(body);
    else if (draft.choices.raceOptions.editing || racePendingChoices().filter(item => !item.includes("後續步驟選擇")).length) renderRaceOptions(body);
    else renderRaceComplete(body);
  }

  function classAbilitiesComplete(target = draft) {
    return ABILITY_ORDER.every(key => Number.isInteger(target.choices.abilities?.[key]) && target.choices.abilities[key] >= 8 && target.choices.abilities[key] <= 15) &&
      abilityPointCost(target.choices.abilities) === 27 && backgroundBonusTotal(target.choices.backgroundAbilityBonuses) === 3;
  }

  function classProficienciesComplete(target = draft) {
    const definition = CLASS_BUILD_DEFINITIONS[target.choices.class];
    const options = target.choices.classOptions || {};
    if (!definition) return false;
    return Array.isArray(options.skills) && options.skills.length === definition.skillCount && new Set(options.skills).size === definition.skillCount &&
      Array.isArray(options.tools) && options.tools.length === (definition.toolCount || 0) && new Set(options.tools).size === (definition.toolCount || 0);
  }

  function classComplete(target = draft) {
    const spellcastingComplete = !hasDraftSpellcasting(target) || Boolean(target.choices.spellcastingAbility);
    return Boolean(target.choices.class && classAbilitiesComplete(target) && spellcastingComplete &&
      classProficienciesComplete(target) && target.choices.classOptions?.stage === "summary");
  }

  function renderClassCards(body) {
    body.innerHTML = `<h3>選擇職業</h3><p class="quick-build-lead">選擇角色的 1 級職業；裝備與其他 1 級必要選擇會在後續獨立步驟處理。</p><div class="quick-build-class-grid">${CLASS_ORDER.map(key => `<button type="button" class="quick-build-card quick-build-class-card" data-class-choice="${key}"><h4>${CLASS_LABELS[key]}</h4><p>${escapeHtml(CLASS_CARD_DESCRIPTIONS[key])}</p></button>`).join("")}</div>`;
    body.querySelectorAll("[data-class-choice]").forEach(card => card.addEventListener("click", () => chooseClass(card.dataset.classChoice)));
  }

  function abilityBaseOptions(key) {
    const current = draft.choices.abilities[key];
    const currentCost = POINT_BUY_COSTS[current] || 0;
    const spent = abilityPointCost(draft.choices.abilities);
    return Object.keys(POINT_BUY_COSTS).map(value => {
      const score = Number(value);
      const disabled = spent - currentCost + POINT_BUY_COSTS[score] > 27;
      return `<option value="${score}"${score === current ? " selected" : ""}${disabled ? " disabled" : ""}>${score}</option>`;
    }).join("");
  }

  function abilityBonusOptions(key, enabled) {
    const current = draft.choices.backgroundAbilityBonuses[key] || 0;
    const total = backgroundBonusTotal(draft.choices.backgroundAbilityBonuses);
    return [0, 1, 2].map(value => {
      const disabled = !enabled || total - current + value > 3;
      return `<option value="${value}"${value === current ? " selected" : ""}${disabled ? " disabled" : ""}>+${value}</option>`;
    }).join("");
  }

  function renderClassType(body) {
    const key = draft.choices.class;
    const typeOptions = CLASS_TYPE_OPTIONS[key] || [];
    body.innerHTML = `<button type="button" class="quick-build-change" data-reset-class>← 重新選擇職業</button><h3>${CLASS_LABELS[key]}：選擇職業類型</h3><p class="quick-build-lead">選擇此職業的快速建立方向；下一步會依職業類型與背景預填屬性。</p><div class="quick-build-class-grid">${typeOptions.map(option => `<button type="button" class="quick-build-card quick-build-class-card" data-class-type-choice="${option.id}"><h4>${escapeHtml(option.label)}</h4><p>${escapeHtml(option.description)}</p></button>`).join("")}</div>`;
    body.querySelector("[data-reset-class]").addEventListener("click", resetClass);
    body.querySelectorAll("[data-class-type-choice]").forEach(card => card.addEventListener("click", () => chooseClassType(card.dataset.classTypeChoice)));
  }

  function renderClassAbilities(body) {
    const key = draft.choices.class;
    const allowedBonuses = new Set((draft.choices.backgroundAbilities || []).map(label => ABILITY_KEYS_BY_LABEL[label]));
    const spent = abilityPointCost(draft.choices.abilities);
    const bonusTotal = backgroundBonusTotal(draft.choices.backgroundAbilityBonuses);
    const backgroundBonusWarning = draft.choices.classOptions?.backgroundBonusInvalidated ? `<div class="quick-build-warning"><strong>改變背景需要重新設定屬性加值</strong><br>已保留你上次的 27 點基礎屬性；請重新分配背景加值 3 點後再確認。</div>` : "";
    body.innerHTML = `<button type="button" class="quick-build-change" data-reset-class>← 重新選擇職業</button><div class="quick-build-ability-heading"><h3>${CLASS_LABELS[key]}${draft.choices.classOptions.classType ? `（${CLASS_TYPE_OPTIONS[key]?.find(option => option.id === draft.choices.classOptions.classType)?.label || ""}）` : ""}：屬性與背景加值</h3><div class="quick-build-ability-status"><span class="quick-build-status-pill${spent === 27 ? " is-complete" : ""}">購點 <strong>${spent}</strong> / 27</span><span class="quick-build-status-pill${bonusTotal === 3 ? " is-complete" : ""}">背景加值 <strong>${bonusTotal}</strong> / 3</span></div></div>${backgroundBonusWarning}<p class="quick-build-lead">起始屬性在 8～15 之間，必須剛好分配 27 點；背景的 3 點加值只能分配到指定屬性，單項最多 +2。</p><div class="quick-build-ability-help"><span>目前背景：<strong>${escapeHtml(BACKGROUND_LABELS[draft.choices.background] || "未選擇")}</strong></span><span>可加值：<strong>${escapeHtml((draft.choices.backgroundAbilities || []).join("、") || "無")}</strong></span></div><button type="button" class="quick-build-ability-confirm" data-class-ability-confirm${classAbilitiesComplete() ? "" : " disabled"}>屬性確認</button><section class="quick-build-choice-panel quick-build-ability-grid">${ABILITY_ORDER.map(ability => {
      const bonusEnabled = allowedBonuses.has(ability);
      return `<div class="quick-build-ability-row"><div class="quick-build-ability-name"><strong>${ABILITY_LABELS[ability]}</strong><small>${ability.toUpperCase()}</small></div><div class="quick-build-ability-controls"><label class="quick-build-ability-field">基礎值<select data-class-ability-base="${ability}">${abilityBaseOptions(ability)}</select></label><label class="quick-build-ability-field">背景加值<select data-class-ability-bonus="${ability}"${bonusEnabled ? "" : " disabled"}>${abilityBonusOptions(ability, bonusEnabled)}</select></label></div><div class="quick-build-ability-total"><span>總值</span><strong>${abilityTotal(draft, ability)}</strong></div></div>`;
    }).join("")}</section>${spent !== 27 ? '<div class="quick-build-warning">基礎值必須剛好滿足 27 購點後才能繼續。</div>' : ""}${bonusTotal !== 3 ? '<div class="quick-build-warning">背景加值必須剛好分配 3 點後才能繼續。</div>' : ""}`;
    body.querySelector("[data-reset-class]").addEventListener("click", resetClass);
    body.querySelectorAll("[data-class-ability-base],[data-class-ability-bonus]").forEach(select => select.addEventListener("change", updateClassAbility));
    body.querySelector("[data-reset-abilities]")?.addEventListener("click", resetClassAbilities);
    body.querySelector("[data-class-ability-confirm]")?.addEventListener("click", advanceAfterClassAbilities);
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
    body.innerHTML = `<button type="button" class="quick-build-change" data-class-stage-back="abilities">← 修改屬性</button><h3>${escapeHtml(castingSource.label)}：決定施法屬性</h3>${choiceLead}<section class="quick-build-choice-panel"><div class="quick-build-field"><label for="quick-build-class-spellcasting">施法屬性</label><select id="quick-build-class-spellcasting" data-class-spellcasting${fixed ? " disabled" : ""}>${["int", "wis", "cha"].map(ability => `<option value="${ability}"${ability === selected ? " selected" : ""}>${ABILITY_LABELS[ability]}</option>`).join("")}</select></div><div class="quick-build-fixed-list">目前${escapeHtml(mentalTotals)}</div></section><div class="quick-build-substep-actions quick-build-inline-actions"><button type="button" data-class-stage-back="abilities">返回屬性</button><button type="button" class="primary" data-class-stage-next="proficiencies">選擇技能與工具</button></div>`;
    body.querySelectorAll("[data-class-stage-back]").forEach(button => button.addEventListener("click", () => setClassStage(button.dataset.classStageBack)));
    body.querySelector("[data-class-spellcasting]")?.addEventListener("change", updateClassSpellcasting);
    body.querySelector("[data-class-stage-next]")?.addEventListener("click", () => setClassStage("proficiencies"));
  }

  function classProficiencySelect(type, index, values, selectedValues, disabledBySource = new Set()) {
    const selected = selectedValues[index] || "";
    const otherSelections = new Set(selectedValues.filter((_, otherIndex) => otherIndex !== index));
    const label = type === "skill" ? `技能 ${index + 1}` : `工具 ${index + 1}`;
    return `<div class="quick-build-field"><label for="quick-build-class-${type}-${index}">${label}</label><select id="quick-build-class-${type}-${index}" data-class-${type}><option value="">請選擇</option>${values.map(name => {
      const sourceDisabled = disabledBySource.has(name);
      const disabled = otherSelections.has(name) || sourceDisabled;
      return `<option value="${escapeHtml(name)}"${name === selected ? " selected" : ""}${disabled ? " disabled" : ""}>${escapeHtml(name)}${sourceDisabled ? "（背景已取得）" : otherSelections.has(name) ? "（已選）" : ""}</option>`;
    }).join("")}</select></div>`;
  }

  function renderClassProficiencies(body) {
    const definition = CLASS_BUILD_DEFINITIONS[draft.choices.class];
    const options = draft.choices.classOptions;
    const skills = Array.isArray(options.skills) ? options.skills : [];
    const tools = Array.isArray(options.tools) ? options.tools : [];
    const backgroundSkills = new Set((draft.acquisitions.skills || []).filter(item => item.sourceType === "background").map(item => item.name));
    const conflicts = draft.selections.class?.content?.conflicts || [];
    const conflictText = conflicts.map(conflict => `${conflict.name}（已由${conflict.existingSource?.label || conflict.existingSource?.type || "其他來源"}取得）`);
    const previousStage = hasDraftSpellcasting() ? "spellcasting" : "abilities";
    const previousLabel = hasDraftSpellcasting() ? "施法屬性" : "屬性";
    body.innerHTML = `<button type="button" class="quick-build-change" data-class-stage-back="${previousStage}">← 修改${previousLabel}</button><h3>${CLASS_LABELS[draft.choices.class]}：技能與工具</h3><p class="quick-build-lead">請選擇職業的熟練技能；技能重複時會顯示提醒。</p><div class="quick-build-proficiency-grid"><section class="quick-build-choice-panel"><h4>技能熟練：選擇 ${definition.skillCount} 項</h4><div class="quick-build-spell-fields">${Array.from({ length: definition.skillCount }, (_, index) => classProficiencySelect("skill", index, definition.skillOptions, skills, backgroundSkills)).join("")}</div></section>${definition.toolCount ? `<section class="quick-build-choice-panel"><h4>工具熟練：選擇 ${definition.toolCount} 項${definition.toolLabel ? `（${escapeHtml(definition.toolLabel)}）` : ""}</h4><div class="quick-build-spell-fields">${Array.from({ length: definition.toolCount }, (_, index) => classProficiencySelect("tool", index, definition.toolOptions, tools)).join("")}</div></section>` : ""}${(definition.fixedTools || []).length ? `<section class="quick-build-choice-panel"><h4>固定工具熟練</h4><div class="quick-build-fixed-list">${definition.fixedTools.map(escapeHtml).join("、")}</div></section>` : ""}</div>${conflictText.length ? `<div class="quick-build-warning"><strong>跨來源同名熟練</strong><br>${conflictText.map(escapeHtml).join("、")}。來源紀錄都會保留，可返回前面步驟改選。</div>` : ""}<div class="quick-build-substep-actions quick-build-inline-actions"><button type="button" data-class-stage-back="${previousStage}">返回${previousLabel}</button><button type="button" class="primary" data-class-stage-next="summary"${classProficienciesComplete() ? "" : " disabled"}>查看摘要</button></div>`;
    body.querySelectorAll("[data-class-stage-back]").forEach(button => button.addEventListener("click", () => setClassStage(button.dataset.classStageBack)));
    body.querySelectorAll("[data-class-skill],[data-class-tool]").forEach(select => select.addEventListener("change", updateClassProficiencies));
    body.querySelector("[data-class-stage-next]")?.addEventListener("click", () => setClassStage("summary"));
  }

  function renderClassSummary(body) {
    const selection = draft.selections.class;
    const content = selection?.content || {};
    const conflicts = content.conflicts || [];
    const duplicateWarnings = crossSourceDuplicateGroups(draft, "skills", ["background", "race", "class", "level-one"])
      .concat(crossSourceDuplicateGroups(draft, "spells", ["background", "race", "class", "level-one"]));
    const duplicateWarning = duplicateWarnings.length ? `<div class="quick-build-warning"><strong>跨步驟同能力提醒</strong><br>${duplicateWarnings.map(group => escapeHtml(duplicateGroupText(group))).join("、")}。已包含完成 1 級提供的選項；來源紀錄都會保留。</div>` : "";
    const abilitySummary = ABILITY_ORDER.map(key => {
      const total = content.totals?.[key] ?? abilityTotal(draft, key);
      const modifier = signedNumberParts(abilityModifier(total));
      return `<div class="quick-build-ability-summary-row"><span>${escapeHtml(ABILITY_LABELS[key])} ${escapeHtml(total)}（${escapeHtml(draft.choices.abilities[key])}+${escapeHtml(draft.choices.backgroundAbilityBonuses[key] || 0)}）</span><span class="quick-build-ability-modifier">調整值 <span class="quick-build-ability-modifier-sign">${modifier.sign}</span><span class="quick-build-ability-modifier-value">${modifier.value}</span></span></div>`;
    }).join("");
    const toolSummary = content.tools?.length ? content.tools.join("、") : "無";
    const hitDieSummary = String(content.hitDie || "").replace(/，每級多一顆$/, "");
    const spellcastingSourceLabel = content.spellcastingAbilitySource === "class" ? "職業固定" : content.spellcastingAbilitySource === "player-override" ? `${content.spellcastingSource?.label || "來源"}選擇` : `${content.spellcastingSource?.label || "來源"}預選`;
    const spellcastingSummary = content.spellcastingSource ? `<dt>施法屬性</dt><dd>${escapeHtml(ABILITY_LABELS[content.spellcastingAbility] || "")}（${escapeHtml(spellcastingSourceLabel)}）</dd>` : "";
    const skillBonusSummary = sourceAwareAcquisitions("skillBonuses", item => item.sourceType === "class");
    body.innerHTML = `<button type="button" class="quick-build-change" data-class-stage-back="proficiencies">← 修改技能與工具</button><h3>職業與屬性摘要確認</h3><section class="quick-build-complete"><dl class="quick-build-summary-list"><dt>職業</dt><dd>${escapeHtml(selection?.label || "")}${content.classTypeLabel ? `（${escapeHtml(content.classTypeLabel)}）` : ""}</dd><dt>關鍵屬性</dt><dd>${escapeHtml(content.keyAbilityText || "")}</dd><dt>生命骰</dt><dd>${escapeHtml(hitDieSummary)}</dd><dt>屬性總值</dt><dd><div class="quick-build-ability-summary">${abilitySummary}</div></dd>${spellcastingSummary}<dt>豁免熟練</dt><dd>${escapeHtml((content.saves || []).join("、"))}</dd><dt>技能熟練</dt><dd>${escapeHtml((content.skills || []).join("、"))}</dd><dt>技能額外加值</dt><dd>${escapeHtml(skillBonusSummary)}</dd><dt>工具熟練</dt><dd>${escapeHtml(toolSummary)}</dd><dt>武器熟練</dt><dd>${escapeHtml(content.weaponProficiencies || "")}</dd><dt>護甲訓練</dt><dd>${escapeHtml(content.armorTraining || "")}</dd></dl></section>${conflicts.length ? `<div class="quick-build-warning"><strong>跨來源重複提醒</strong><br>${conflicts.map(conflict => `${escapeHtml(conflict.name)}（${escapeHtml(conflict.existingSource?.label || "其他來源")}／${escapeHtml(CLASS_LABELS[draft.choices.class])}）`).join("、")}。兩邊來源都會保留。</div>` : ""}${duplicateWarning}<div class="quick-build-substep-actions quick-build-inline-actions"><button type="button" data-class-stage-back="proficiencies">返回修改</button></div>`;
    body.querySelectorAll("[data-class-stage-back]").forEach(button => button.addEventListener("click", () => setClassStage(button.dataset.classStageBack)));
  }

  function optionsConfirmedAttribute(confirmed) {
    return confirmed ? " disabled" : "";
  }

  function renderClass(body) {
    if (!draft.choices.class) {
      renderClassCards(body);
      return;
    }
    const stage = draft.choices.classOptions.stage || (CLASS_TYPE_OPTIONS[draft.choices.class]?.length ? "classType" : "abilities");
    if (stage === "classType") renderClassType(body);
    else if (stage === "abilities") renderClassAbilities(body);
    else if (stage === "spellcasting") renderClassSpellcasting(body);
    else if (stage === "proficiencies") renderClassProficiencies(body);
    else renderClassSummary(body);
  }

  function equipmentComplete(target = draft) {
    return Boolean(target.selections.classEquipment?.content?.confirmed);
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
    body.innerHTML = `<h3>${CLASS_LABELS[key]}：選擇初始裝備</h3><p class="quick-build-lead">是否取得職業提供的預設裝備？若選否，改為取得金幣並由玩家自行購買。</p>${fighterWarning}<section class="quick-build-choice-panel">${definition.defaults.map(option => `<strong>${escapeHtml(option.label)}</strong><div class="quick-build-equipment-list">${escapeHtml(equipmentItemText(option))}</div>`).join("")}<div class="quick-build-choice-actions">${definition.defaults.map(option => `<button type="button" class="primary" data-class-equipment-method="${option.id}">${definition.defaults.length === 1 ? "取得預設裝備" : `取得${escapeHtml(option.label)}`}</button>`).join("")}<button type="button"${key === "fighter" ? " class=\"quick-build-choice-action-full\"" : ""} data-class-equipment-method="gold">否，取得 ${definition.gold} 金幣</button></div></section>`;
    body.querySelectorAll("[data-class-equipment-method]").forEach(button => button.addEventListener("click", () => chooseClassEquipmentMethod(button.dataset.classEquipmentMethod)));
  }

  function equipmentSelect(id, label, values, selected, dataName) {
    return `<div class="quick-build-field"><label for="${id}">${escapeHtml(label)}</label><select id="${id}" ${dataName}><option value="">請選擇</option>${values.map(value => `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(value)}</option>`).join("")}</select></div>`;
  }

  function renderEquipmentComplete(body) {
    const key = draft.choices.class;
    const selection = draft.selections.classEquipment;
    body.innerHTML = `<button type="button" class="quick-build-change" data-equipment-reset>← 重新選擇裝備取得方式</button><h3>${CLASS_LABELS[key]}：裝備選擇完成</h3><div class="quick-build-complete">${classEquipmentCompleteSummary(selection)}</div>`;
    body.querySelector("[data-equipment-reset]").addEventListener("click", resetClassEquipment);
  }

  function renderEquipmentConfiguration(body) {
    const key = draft.choices.class;
    const method = draft.choices.classEquipmentMethod;
    const selection = draft.selections.classEquipment;
    const options = draft.choices.classEquipmentOptions || {};
    if (method === "gold" || selection?.content?.confirmed) {
      renderEquipmentComplete(body);
      return;
    }
    const equipmentPackage = selectedClassEquipmentPackage(draft);
    if (!equipmentPackage) { renderEquipmentMethod(body); return; }
    if (!equipmentNeedsConfiguration(equipmentPackage)) {
      renderEquipmentComplete(body);
      return;
    }
    const configurationFields = equipmentConfigurationFields(equipmentPackage);
    const mainHand = options.mainHand || "";
    const offCandidates = mainHand ? (equipmentPackage.off[mainHand] || []) : [];
    const offControl = mainHand ? `<div class="quick-build-fixed-list"><strong>副手：</strong>${escapeHtml(offCandidates[0] || "空著")}</div>` : `<div class="quick-build-fixed-list"><strong>副手：</strong>請先選擇主手</div>`;
    const fixedArmor = equipmentPackage.armor ? `<div class="quick-build-fixed-list"><strong>身著護甲：</strong>${escapeHtml(equipmentPackage.armor)}</div>` : "";
    const mainControl = configurationFields.includes("mainHand") ? equipmentSelect("quick-build-equipment-main", "主手", equipmentPackage.main, mainHand, "data-equipment-main") : `<div class="quick-build-fixed-list"><strong>主手：</strong>${escapeHtml(options.mainHand || equipmentPackage.main[0] || "空著")}</div>`;
    const instrumentControl = configurationFields.includes("instrument") ? equipmentSelect("quick-build-equipment-instrument", "預設裝備提供的樂器", classEquipmentInstrumentOptions(draft), options.instrument || "", "data-equipment-instrument") : "";
    body.innerHTML = `<button type="button" class="quick-build-change" data-equipment-reset>← 重新選擇預設裝備</button><h3>${CLASS_LABELS[key]}：${escapeHtml(equipmentPackage.label)}</h3><div class="quick-build-equipment-list">${escapeHtml(equipmentCombatItemText(equipmentPackage))}</div><section class="quick-build-choice-panel"><div class="quick-build-spell-fields">${mainControl}${offControl}${fixedArmor}${instrumentControl}</div></section>`;
    body.querySelector("[data-equipment-reset]").addEventListener("click", resetClassEquipment);
    body.querySelector("[data-equipment-main]")?.addEventListener("change", updateClassEquipmentOptions);
    body.querySelector("[data-equipment-instrument]")?.addEventListener("change", updateClassEquipmentOptions);
  }

  function renderEquipment(body) {
    if (!draft.choices.classEquipmentMethod) renderEquipmentMethod(body);
    else renderEquipmentConfiguration(body);
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

  function setLevelOneStage(stage) {
    if (stage === "equipment") {
      goToStep(draft.currentStep - 1);
      return;
    }
    if (!levelOneStages().includes(stage)) return;
    draft.choices.levelOne = { ...draft.choices.levelOne, stage, summaryConfirmed: false };
    saveDraft();
    render();
  }

  function nextLevelOneStage(current) {
    const stages = levelOneStages();
    return stages[Math.min(stages.indexOf(current) + 1, stages.length - 1)] || "summary";
  }

  function previousLevelOneStage(current) {
    const stages = levelOneStages();
    const index = stages.indexOf(current);
    return index <= 0 ? "equipment" : stages[index - 1];
  }

  function updateLevelOneField(updater, preserve = true) {
    const next = { ...(draft.choices.levelOne || {}) };
    updater(next);
    next.summaryConfirmed = false;
    draft.choices.levelOne = next;
    saveDraft();
    render(preserve);
  }

  function spellSelectControl(id, label, spells, selected, selectedPeerNames = [], knownSources = new Map(), dataAttr = "data-level-one-spell", allowKnownDuplicates = false) {
    return `<div class="quick-build-field"><label for="${id}">${escapeHtml(label)}</label><div class="quick-build-field-control"><select id="${id}" ${dataAttr}><option value="">-- 選擇法術 --</option>${spells.map(spell => {
      const short = spellChineseName(spell.name);
      const peerDuplicate = selectedPeerNames.includes(short) && short !== selected;
      const known = knownSources.get(short) || [];
      const disabled = peerDuplicate || (!allowKnownDuplicates && known.length && short !== selected);
      const suffix = peerDuplicate ? "（本組已選）" : known.length && short !== selected ? `（${escapeHtml(known.join("、"))}已學會）` : "";
      return `<option value="${escapeHtml(short)}"${short === selected ? " selected" : ""}${disabled ? " disabled" : ""}>${escapeHtml(spell.name)}${suffix}</option>`;
    }).join("")}</select><button type="button" class="quick-build-spell-view" data-spell-view="${escapeHtml(id)}"${selected ? "" : " disabled"}>查看</button></div></div>`;
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
    body.innerHTML = `<button type="button" class="quick-build-change" data-level-one-stage-back="${previousLevelOneStage("options")}">← 返回</button><h3>${CLASS_LABELS[key]}：職業選項</h3>${panels.join("")}<div class="quick-build-substep-actions quick-build-inline-actions"><button type="button" data-level-one-stage-back="${previousLevelOneStage("options")}">返回</button><button type="button" class="primary" data-level-one-stage-next="${nextLevelOneStage("options")}">下一步</button></div>`;
    body.querySelectorAll("[data-level-one-stage-back]").forEach(button => button.addEventListener("click", () => setLevelOneStage(button.dataset.levelOneStageBack)));
    body.querySelector("[data-level-one-stage-next]")?.addEventListener("click", event => setLevelOneStage(event.currentTarget.dataset.levelOneStageNext));
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
    const known = usedLanguageLabels(draft);
    const select = index => `<div class="quick-build-field"><label for="quick-build-language-${index}">${draft.choices.class === "rogue" && index >= 2 ? "額外語言" : `語言 ${index + 1}`}</label><select id="quick-build-language-${index}" data-level-one-language><option value="">-- 請選擇 --</option>${LANGUAGE_OPTIONS.map(option => {
      const availableOptions = languageOptionsForDraft(draft, index);
      if (!availableOptions.some(available => available.value === option.value)) return "";
      const alreadyKnown = known.has(option.label) && selected[index] !== option.value;
      const disabled = alreadyKnown || (selected.includes(option.value) && selected[index] !== option.value);
      return `<option value="${option.value}"${selected[index] === option.value ? " selected" : ""}${disabled ? " disabled" : ""}>${escapeHtml(option.label)}${alreadyKnown ? "（已會）" : ""}</option>`;
    }).join("")}</select></div>`;
    body.innerHTML = `<button type="button" class="quick-build-change" data-level-one-stage-back="${previousLevelOneStage("languages")}">← 返回</button><h3>${CLASS_LABELS[draft.choices.class]}：初始語言</h3><section class="quick-build-choice-panel"><div class="quick-build-spell-fields">${Array.from({ length: LEVEL_ONE_DEFINITIONS[draft.choices.class].languages }, (_, index) => select(index)).join("")}</div></section><div class="quick-build-substep-actions quick-build-inline-actions"><button type="button" data-level-one-stage-back="${previousLevelOneStage("languages")}">返回</button><button type="button" class="primary" data-level-one-stage-next="${nextLevelOneStage("languages")}">下一步</button></div>`;
    body.querySelectorAll("[data-level-one-stage-back]").forEach(button => button.addEventListener("click", () => setLevelOneStage(button.dataset.levelOneStageBack)));
    body.querySelector("[data-level-one-stage-next]")?.addEventListener("click", event => setLevelOneStage(event.currentTarget.dataset.levelOneStageNext));
    body.querySelectorAll("[data-level-one-language]").forEach((selectEl, index) => selectEl.addEventListener("change", () => updateLevelOneField(next => { const values = [...body.querySelectorAll("[data-level-one-language]")].map(item => item.value || ""); next.languages = values; })));
  }

  function renderLevelOneSpells(body) {
    const key = draft.choices.class;
    const definition = LEVEL_ONE_DEFINITIONS[key] || {};
    const choices = draft.choices.levelOne || {};
    const known = knownSpellSources(draft);
    (definition.alwaysPrepared || []).forEach(name => {
      const sources = known.get(name) || [];
      sources.push(definition.alwaysPreparedFeature || "始終準備");
      known.set(name, sources);
    });
    const cantripCount = levelOneCantripCount(draft, definition);
    const cantrips = choices.cantrips || [];
    const prepared = choices.preparedSpells || [];
    const spellbook = choices.spellbookSpells || [];
    const sections = [];
    if (cantripCount) sections.push(`<section class="quick-build-choice-panel"><h4>戲法</h4><div class="quick-build-spell-fields">${Array.from({ length: cantripCount }, (_, index) => spellSelectControl(`quick-build-cantrip-${index}`, `戲法 ${index + 1}`, levelOneSpellOptions(key, "cantrips"), cantrips[index] || "", cantrips, known, "data-level-one-cantrip")).join("")}</div></section>`);
    if (definition.spellbookSpells) sections.push(`<section class="quick-build-choice-panel"><h4>法術書法術</h4><div class="quick-build-spell-fields">${Array.from({ length: definition.spellbookSpells }, (_, index) => spellSelectControl(`quick-build-spellbook-${index}`, `法術書 ${index + 1}`, levelOneSpellOptions("wizard", "1"), spellbook[index] || "", spellbook, known, "data-level-one-spellbook")).join("")}</div></section>`);
    if (definition.preparedSpells) {
      const spells = definition.spellbookSpells ? spellbook.map(name => spellOptionByChineseName("wizard", "1", name)).filter(Boolean) : levelOneSpellOptions(key, "1");
      sections.push(`<section class="quick-build-choice-panel"><h4>準備法術</h4><div class="quick-build-spell-fields">${Array.from({ length: definition.preparedSpells }, (_, index) => spellSelectControl(`quick-build-prepared-${index}`, `準備法術 ${index + 1}`, spells, prepared[index] || "", prepared, known, "data-level-one-prepared", Boolean(definition.spellbookSpells))).join("")}</div></section>`);
    }
    if ((choices.invocations || []).includes("pact-of-the-tome")) {
      const tome = choices.tome || {};
      const tomeCantrips = tome.cantrips || [];
      const tomeRituals = tome.rituals || [];
      sections.push(`<section class="quick-build-choice-panel"><h4>書之魔契</h4><p class="quick-build-option-note">選 3 個任一職業戲法與 2 個任一職業儀式一環法術。</p><div class="quick-build-spell-fields">${Array.from({ length: 3 }, (_, index) => spellSelectControl(`quick-build-tome-cantrip-${index}`, `魔契書戲法 ${index + 1}`, allSpellOptions("cantrips"), tomeCantrips[index] || "", tomeCantrips, known, "data-level-one-tome-cantrip")).join("")}${Array.from({ length: 2 }, (_, index) => spellSelectControl(`quick-build-tome-ritual-${index}`, `魔契書儀式 ${index + 1}`, allSpellOptions("1", isRitualSpell), tomeRituals[index] || "", tomeRituals, known, "data-level-one-tome-ritual")).join("")}</div></section>`);
    }
    body.innerHTML = `<button type="button" class="quick-build-change" data-level-one-stage-back="${previousLevelOneStage("spells")}">← 返回</button><h3>${CLASS_LABELS[key]}：法術選擇</h3>${sections.join("")}<div class="quick-build-substep-actions quick-build-inline-actions"><button type="button" data-level-one-stage-back="${previousLevelOneStage("spells")}">返回</button><button type="button" class="primary" data-level-one-stage-next="${nextLevelOneStage("spells")}">下一步</button></div>`;
    body.querySelectorAll("[data-level-one-stage-back]").forEach(button => button.addEventListener("click", () => setLevelOneStage(button.dataset.levelOneStageBack)));
    body.querySelector("[data-level-one-stage-next]")?.addEventListener("click", event => setLevelOneStage(event.currentTarget.dataset.levelOneStageNext));
    const collect = selector => [...body.querySelectorAll(selector)].map(item => item.value || "");
    body.querySelectorAll("[data-level-one-cantrip],[data-level-one-spellbook],[data-level-one-prepared],[data-level-one-tome-cantrip],[data-level-one-tome-ritual]").forEach(select => select.addEventListener("change", () => updateLevelOneField(next => { next.cantrips = collect("[data-level-one-cantrip]"); next.spellbookSpells = collect("[data-level-one-spellbook]"); next.preparedSpells = collect("[data-level-one-prepared]"); next.tome = { cantrips: collect("[data-level-one-tome-cantrip]"), rituals: collect("[data-level-one-tome-ritual]") }; })));
    body.querySelectorAll("[data-spell-view]").forEach(button => button.addEventListener("click", event => {
      const select = body.querySelector(`#${CSS.escape(button.dataset.spellView)}`);
      const value = select?.value || "";
      const spell = value ? allSpellOptions("cantrips").concat(allSpellOptions("1")).find(item => spellChineseName(item.name) === value) : null;
      openSpellDetail(spell, event.currentTarget);
    }));
  }

  function renderLevelOneMastery(body) {
    const key = draft.choices.class;
    const count = LEVEL_ONE_DEFINITIONS[key].weaponMastery;
    const selected = draft.choices.levelOne?.weaponMasteries || [];
    const options = allWeaponMasteryOptionsForClass(key);
    const select = index => `<div class="quick-build-field"><label for="quick-build-mastery-${index}">-- 選擇精通武器 --</label><select id="quick-build-mastery-${index}" data-level-one-mastery><option value="">-- 選擇精通武器 --</option>${options.map(([name, mastery]) => `<option value="${escapeHtml(name)}"${selected[index] === name ? " selected" : ""}${selected.includes(name) && selected[index] !== name ? " disabled" : ""}>${escapeHtml(name)}（${escapeHtml(mastery)}）</option>`).join("")}</select></div>`;
    body.innerHTML = `<button type="button" class="quick-build-change" data-level-one-stage-back="${previousLevelOneStage("mastery")}">← 返回</button><h3>武器精通選擇</h3><section class="quick-build-choice-panel"><div class="quick-build-spell-fields">${Array.from({ length: count }, (_, index) => select(index)).join("")}</div></section><div class="quick-build-substep-actions quick-build-inline-actions"><button type="button" data-level-one-stage-back="${previousLevelOneStage("mastery")}">返回</button><button type="button" class="primary" data-level-one-stage-next="${nextLevelOneStage("mastery")}">下一步</button></div>`;
    body.querySelectorAll("[data-level-one-stage-back]").forEach(button => button.addEventListener("click", () => setLevelOneStage(button.dataset.levelOneStageBack)));
    body.querySelector("[data-level-one-stage-next]")?.addEventListener("click", event => setLevelOneStage(event.currentTarget.dataset.levelOneStageNext));
    body.querySelectorAll("[data-level-one-mastery]").forEach(selectEl => selectEl.addEventListener("change", () => updateLevelOneField(next => { next.weaponMasteries = [...body.querySelectorAll("[data-level-one-mastery]")].map(item => item.value || ""); })));
  }

  function renderLevelOneExpertise(body) {
    const selected = draft.choices.levelOne?.expertise || [];
    const options = expertiseSkillOptions(draft);
    const requiredCount = LEVEL_ONE_DEFINITIONS[draft.choices.class].expertise;
    const complete = [...new Set(selected.filter(name => options.includes(name)))].length === requiredCount;
    const select = index => `<div class="quick-build-field"><label for="quick-build-expertise-${index}">專精 ${index + 1}</label><select id="quick-build-expertise-${index}" data-level-one-expertise><option value="">請選擇</option>${options.map(name => `<option value="${escapeHtml(name)}"${selected[index] === name ? " selected" : ""}${selected.includes(name) && selected[index] !== name ? " disabled" : ""}>${escapeHtml(name)}</option>`).join("")}</select></div>`;
    body.innerHTML = `<button type="button" class="quick-build-change" data-level-one-stage-back="${previousLevelOneStage("expertise")}">← 返回</button><h3>${CLASS_LABELS[draft.choices.class]}：專精</h3><section class="quick-build-choice-panel"><p class="quick-build-option-note">只能選擇已從背景、種族或職業取得熟練的技能。</p><div class="quick-build-spell-fields">${Array.from({ length: requiredCount }, (_, index) => select(index)).join("")}</div></section><div class="quick-build-substep-actions quick-build-inline-actions"><button type="button" data-level-one-stage-back="${previousLevelOneStage("expertise")}">返回</button><button type="button" class="primary" data-level-one-stage-next="${nextLevelOneStage("expertise")}"${complete ? "" : " disabled"}>下一步</button></div>`;
    body.querySelectorAll("[data-level-one-stage-back]").forEach(button => button.addEventListener("click", () => setLevelOneStage(button.dataset.levelOneStageBack)));
    body.querySelector("[data-level-one-stage-next]")?.addEventListener("click", event => setLevelOneStage(event.currentTarget.dataset.levelOneStageNext));
    body.querySelectorAll("[data-level-one-expertise]").forEach(selectEl => selectEl.addEventListener("change", () => updateLevelOneField(next => { next.expertise = [...body.querySelectorAll("[data-level-one-expertise]")].map(item => item.value || ""); })));
  }

  function renderLevelOneSummary(body) {
    const content = draft.selections.levelOne?.content || {};
    const pending = content.pendingChoices || [];
    const classOptionLabel = LEVEL_ONE_DEFINITIONS[draft.choices.class]?.classOption?.options
      ?.find(option => option.id === content.classOption)?.label;
    const optionSummary = [classOptionLabel, content.fightingStyle, ...(content.invocations || []).map(id => ELDRITCH_INVOCATION_OPTIONS.find(option => option.id === id)?.label || id)]
      .filter(Boolean).join("、") || "無";
    const duplicateWarnings = crossSourceDuplicateGroups(draft, "skills", ["background", "race", "class", "level-one"])
      .concat(crossSourceDuplicateGroups(draft, "spells", ["background", "race", "class", "level-one"]));
    const duplicateWarning = duplicateWarnings.length ? `<div class="quick-build-warning"><strong>跨來源同名提醒</strong><br>${duplicateWarnings.map(group => escapeHtml(duplicateGroupText(group))).join("、")}。完成 1 級的預設選項若已由前面步驟取得，會維持為「尚未選擇」等待改選。</div>` : "";
    const spellbookNote = content.spellbookSpells?.length ? `<dt>法術書筆記</dt><dd>${escapeHtml(`法術書：一環-${content.spellbookSpells.map(name => `${name}${content.spellbookSpells.includes(name) && isRitualSpell(spellOptionByChineseName("wizard", "1", name)) ? "（儀式）" : ""}`).join("、")}`)}</dd>` : "";
    body.innerHTML = `<button type="button" class="quick-build-change" data-level-one-stage-back="${previousLevelOneStage("summary")}">← 返回修改</button><h3>${CLASS_LABELS[draft.choices.class]}：完成 1 級摘要</h3>${pending.length ? `<div class="quick-build-warning"><strong>尚未完成</strong><br>${pending.map(escapeHtml).join("<br>")}</div>` : `<section class="quick-build-complete"><strong>完成 1 級選擇已齊全，可前往 1 級總覽。</strong></section>`}<section class="quick-build-complete"><dl class="quick-build-summary-list"><dt>固定能力</dt><dd>${escapeHtml((content.fixed || []).join("、") || "無")}</dd><dt>職業選項</dt><dd>${escapeHtml(optionSummary)}</dd><dt>技能額外加值</dt><dd>${escapeHtml(sourceAwareAcquisitions("skillBonuses"))}</dd><dt>戲法</dt><dd>${escapeHtml((content.cantrips || []).concat(content.tome?.cantrips || []).join("、") || "無")}</dd><dt>準備法術</dt><dd>${escapeHtml((content.preparedSpells || []).concat(content.tome?.rituals || []).join("、") || "無")}</dd>${spellbookNote}<dt>武器精通</dt><dd>${escapeHtml((content.weaponMasteries || []).join("、") || "無")}</dd><dt>專精</dt><dd>${escapeHtml((content.expertise || []).join("、") || "無")}</dd><dt>語言</dt><dd>${escapeHtml((content.languages || []).map(value => LANGUAGE_OPTIONS.find(option => option.value === value)?.label || value).join("、") || "無")}</dd></dl></section>${duplicateWarning}<div class="quick-build-substep-actions quick-build-inline-actions"><button type="button" data-level-one-stage-back="${previousLevelOneStage("summary")}">返回修改</button></div>`;
    body.querySelectorAll("[data-level-one-stage-back]").forEach(button => button.addEventListener("click", () => setLevelOneStage(button.dataset.levelOneStageBack)));
  }

  function renderLevelOne(body) {
    const stages = levelOneStages();
    const stage = stages.includes(draft.choices.levelOne?.stage) ? draft.choices.levelOne.stage : (stages[0] || "summary");
    if (stage === "options") renderLevelOneOptions(body);
    else if (stage === "languages") renderLevelOneLanguages(body);
    else if (stage === "spells") renderLevelOneSpells(body);
    else if (stage === "mastery") renderLevelOneMastery(body);
    else if (stage === "expertise") renderLevelOneExpertise(body);
    else renderLevelOneSummary(body);
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
    // 創角精靈目前只支援 1 級；保留未來等級取得資料，待升級功能完成後再顯示。
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
      .map(([key, value]) => `${labels[key]}：${value}`);
    const featOptions = isPlainObject(options.featOptions) ? options.featOptions : {};
    if (featOptions.spellClass) details.push(`魔法學徒職業：${CLASS_LABELS[featOptions.spellClass] || featOptions.spellClass}`);
    if (Array.isArray(featOptions.cantrips) && featOptions.cantrips.some(Boolean)) details.push(`魔法學徒戲法：${featOptions.cantrips.filter(Boolean).join("、")}`);
    if (Array.isArray(featOptions.levelOneSpells) && featOptions.levelOneSpells.some(Boolean)) details.push(`魔法學徒一環法術：${featOptions.levelOneSpells.filter(Boolean).join("、")}`);
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
    const duplicates = crossSourceDuplicateGroups(draft, "skills", ["background", "race", "class", "level-one"])
      .concat(crossSourceDuplicateGroups(draft, "spells", ["background", "race", "class", "level-one"]));
    const duplicateWarning = duplicates.length ? `<div class="quick-build-warning"><strong>跨來源同名提醒</strong><br>${duplicates.map(group => escapeHtml(duplicateGroupText(group))).join("、")}。總覽已保留每一筆來源。</div>` : "";
    const summaryField = (label, value) => value === "無" ? "" : `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`;
    body.innerHTML = `<h3>1 級角色總覽</h3><p class="quick-build-lead">以下保留每一筆取得內容及其來源，供匯入手機角卡前確認。</p>${duplicateWarning}
      <section class="quick-build-choice-panel quick-build-review-panel"><h4>背景、種族與職業</h4><dl class="quick-build-summary-list">
        ${summaryField("背景", draft.selections.background?.label || "無")}
        ${summaryField("背景屬性加值", backgroundBonuses)}
        ${summaryField("種族", draft.selections.race?.label || "無")}
        ${summaryField("種族選項", raceOptionSummary())}
        ${summaryField("職業", `${draft.selections.class?.label || "無"}${classContent.classTypeLabel ? `（${classContent.classTypeLabel}）` : ""}`)}
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
      draft.currentStep = STEPS.findIndex(step => step.id === "level-one");
      draft.choices.levelOne = { ...draft.choices.levelOne, stage: "summary" };
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
    blankState.__deletedSpellRowCache = {};
    applyStateObject(blankState);
    const highLevelSpells = document.getElementById("highlevel-spells");
    if (highLevelSpells) highLevelSpells.style.display = "none";
    return true;
  }

  function fullMobileSpellName(classId, level, name) {
    const list = spellList?.[classId]?.[level];
    return (Array.isArray(list) ? list : []).find(spell => spellChineseName(spell.name) === spellChineseName(name))?.name || "";
  }

  function chooseMobileSpellClass(level, name, preferredClass = "") {
    const allowed = level === "cantrips" ? CLASS_ORDER.filter(id => !["barbarian", "fighter", "monk", "paladin", "ranger", "rogue"].includes(id)) : [...SPELLCASTER_CLASS_IDS];
    return [preferredClass, ...allowed].find((classId, index, values) => classId && values.indexOf(classId) === index && fullMobileSpellName(classId, level, name)) || "";
  }

  function addManualMobileSpell({ name, level, classId }, warnings) {
    const areaId = level === "cantrips" ? "cantrips-area" : `level${level}spells-area`;
    const area = document.getElementById(areaId);
    const sourceClass = chooseMobileSpellClass(level, name, classId);
    if (!area || !sourceClass) {
      mobileImportWarning(`法術「${name}」：找不到可匯入的職業或環位選項`, warnings);
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
      mobileImportWarning(`法術「${name}」：無法建立法術列`, warnings);
      return false;
    }
    classSelect.value = sourceClass;
    dispatchMobileField(classSelect);
    const option = [...spellSelect.options].find(item => spellChineseName(item.value) === spellChineseName(name));
    if (!option) {
      mobileImportWarning(`法術「${name}」：手機角卡目前的法術清單沒有這個選項`, warnings);
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
    while (area && area.childElementCount < count && typeof createSingleFeatRow === "function") createSingleFeatRow();
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
    ].forEach(([field, name]) => {
      if (!name) return;
      const select = getMagicInitiateSelect(row, field);
      const option = [...(select?.options || [])].find(item => spellChineseName(item.value) === spellChineseName(name));
      if (!select || !option) mobileImportWarning(`${sourceLabel}法術「${name}」：找不到角色卡選項`, warnings);
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
      const option = [...(select?.options || [])].find(item => spellChineseName(item.value) === spellChineseName(draft.choices.raceOptions.cantrip));
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
    (draft.selections.levelOne?.content?.invocations || []).forEach(id => {
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
    const skillNotes = [toolNames.length ? `工具／賭具／樂器熟練：${toolNames.join("、")}` : "", skillBonuses.length ? `技能額外加值：${skillBonuses.join("、")}` : ""].filter(Boolean);
    setMobileField("skill-extra", skillNotes.join("；"), warnings, "技能筆記", "input");

    const languageDetails = draft.selections.levelOne?.content?.languageDetails || [];
    languageDetails.forEach(item => setMobileField(item.fieldId, item.value, warnings, item.category === "class-extra" ? "職業額外語言" : `語言 ${item.slot + 1}`));
  }

  function importMobileFeats(warnings) {
    let nextFeatIndex = 1;
    const backgroundMagic = draft.choices.backgroundMagic || {};
    if (["acolyte", "sage"].includes(draft.choices.background)) {
      const row = document.getElementById("feat-0")?.closest(".form-row");
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
    if (fightingStyle) setMobileFeat(nextFeatIndex++, fightingStyle, warnings, "戰鬥風格");
  }

  function importMobileSpells(warnings) {
    const content = draft.selections.levelOne?.content || {};
    (content.cantrips || []).forEach(name => addManualMobileSpell({ name, level: "cantrips", classId: draft.choices.class }, warnings));
    (content.preparedSpells || []).forEach(name => addManualMobileSpell({ name, level: 1, classId: draft.choices.class }, warnings));
    (content.tome?.cantrips || []).forEach(name => addManualMobileSpell({ name, level: "cantrips", classId: "warlock" }, warnings));
    (content.tome?.rituals || []).forEach(name => addManualMobileSpell({ name, level: 1, classId: "warlock" }, warnings));
    if (content.spellbookSpells?.length) {
      const note = `法術書（一環）：${content.spellbookSpells.map(name => {
        const acquisition = (draft.acquisitions.spells || []).find(item => item.content?.spellbook && item.name === name);
        return `${name}${acquisition?.content?.ritual ? "（儀式）" : ""}`;
      }).join("、")}`;
      setMobileField("spell-notes", note, warnings, "法術筆記", "input");
    }
    if (typeof syncOriginAndSubclassDerivedSpellRows === "function") syncOriginAndSubclassDerivedSpellRows();
    if (typeof updatePickedSpellBoxes === "function") updatePickedSpellBoxes();
  }

  function importMobileWeaponMasteries(warnings) {
    const masteryLookup = new Map(WEAPON_MASTERY_OPTIONS.simple.concat(WEAPON_MASTERY_OPTIONS.martial));
    const masteryNames = [...new Set((draft.selections.levelOne?.content?.weaponMasteries || []).map(weapon => masteryLookup.get(weapon)).filter(Boolean))];
    masteryNames.forEach(name => {
      const checkbox = [...document.querySelectorAll("#weapon-mastery-details input[data-mastery-name]")]
        .find(input => input.dataset.masteryName === name);
      if (!checkbox) mobileImportWarning(`武器精通屬性「${name}」：找不到角色卡選項`, warnings);
      else if (!checkbox.checked) { checkbox.checked = true; dispatchMobileField(checkbox); }
    });
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
      importMobileWeaponMasteries(warnings);
      finishMobileImport(warnings);
      completed = true;
    } catch (error) {
      console.warn("創角精靈匯入角色卡時發生錯誤：", error);
      mobileImportWarning(`匯入流程中斷：${error?.message || "未知錯誤"}`, warnings);
    }
    closeWizard();
    const warningText = warnings.length ? `\n\n第一輪未完成／已略過：\n${warnings.map(item => `• ${item}`).join("\n")}` : "\n\n第一輪沒有偵測到略過項目。";
    const resultText = completed
      ? "角色卡匯入完成。已計算屬性豁免與技能加值、匯入技能熟練與專精，並開啟武器攻擊自動化；巫祝與魔術使的技能額外加值也已納入計算。"
      : "角色卡只完成部分匯入，請依下列問題檢查。";
    window.alert(`${resultText}${warningText}`);
  }

  function resolveFinalSpellList(target = draft) {
    const index = new Map();
    Object.entries(typeof spellList === "object" ? spellList : {}).forEach(([collection, levels]) => {
      Object.entries(levels || {}).forEach(([level, entries]) => {
        (Array.isArray(entries) ? entries : []).forEach(spell => {
          const chineseName = spellChineseName(spell.name);
          if (!index.has(chineseName)) index.set(chineseName, new Map());
          const matches = index.get(chineseName);
          if (!matches.has(spell.name)) matches.set(spell.name, { fullName: spell.name, locations: [] });
          matches.get(spell.name).locations.push({ dataFile: "spell-list.js", collection, level });
        });
      });
    });
    const resolutions = {};
    const finalSpells = (target.acquisitions.spells || []).map(acquisition => {
      const chineseName = spellChineseName(acquisition.name);
      const candidates = [...(index.get(chineseName)?.values() || [])];
      const status = candidates.length === 1 ? "resolved" : candidates.length ? "ambiguous" : "missing";
      resolutions[chineseName] = { status, chineseName, candidates };
      const finalName = status === "resolved" ? candidates[0].fullName : chineseName;
      return { ...acquisition, name: finalName, content: { ...acquisition.content, name: finalName }, resolutionStatus: status };
    });
    return { finalSpells, resolutions, pending: Object.values(resolutions).filter(item => item.status !== "resolved") };
  }

  function renderFinalReview(body) {
    const result = resolveFinalSpellList();
    const conflicts = raceSpellConflicts();
    const classConflicts = draft.selections.class?.content?.conflicts || [];
    const conflictsAcknowledged = conflicts.every(conflict => conflict.resolution === "acknowledged-final");
    body.innerHTML = `<h3>最終確認</h3><p class="quick-build-lead">此處才以中文名稱查詢專案法術資料並建立完整名稱對照；解析結果不會寫回中間 draft。</p><section class="quick-build-choice-panel"><strong>最終法術列表</strong><div class="quick-build-equipment-list">${result.finalSpells.length ? result.finalSpells.map(item => `${escapeHtml(item.name)}｜來源：${escapeHtml(item.source?.label || item.sourceType)}`).join("<br>") : "尚無法術"}</div>${result.pending.length ? `<div class="quick-build-warning"><strong>待確認</strong><br>${result.pending.map(item => `${escapeHtml(item.chineseName)}：${item.status === "missing" ? "找不到專案資料" : "無法唯一對應"}`).join("<br>")}</div>` : ""}</section>${classConflicts.length ? `<section class="quick-build-warning"><strong>技能／工具跨來源同名</strong><br>${classConflicts.map(item => `${escapeHtml(item.name)}：${escapeHtml(item.existingSource?.label || "其他來源")}、${escapeHtml(item.classSource?.label || "職業")}`).join("<br>")}<br>所有來源紀錄均已保留。</section>` : ""}${conflicts.length ? `<section class="quick-build-warning"><strong>法術跨來源同名</strong><br>${conflicts.map(item => escapeHtml(item.name)).join("、")} 同時來自背景與種族。確認後仍會保留每一筆來源紀錄。<div class="quick-build-choice-actions">${conflictsAcknowledged ? "<strong>已確認保留所有重複來源</strong>" : '<button type="button" data-final-spell-conflict-ack>我知道仍有重複，保留所有來源</button>'}</div></section>` : ""}`;
    body.querySelector("[data-final-spell-conflict-ack]")?.addEventListener("click", acknowledgeFinalSpellConflicts);
  }

  function acknowledgeFinalSpellConflicts() {
    const resolutions = { ...draft.choices.spellConflictResolutions };
    raceSpellConflicts().forEach(conflict => { resolutions[conflict.id] = "acknowledged-final"; });
    draft.choices.spellConflictResolutions = resolutions;
    saveDraft();
    render();
  }

  function renderPlaceholder(body, step) {
    body.innerHTML = `<h3>${step.title}</h3><p class="quick-build-lead">此步驟將在後續依照本網站資料實作。</p><ol class="quick-build-plan">${STEPS.map((item, index) => `<li class="${index === draft.currentStep ? "current" : ""}">${item.title}</li>`).join("")}</ol>`;
  }

  function render(preserveBodyScroll = false) {
    const modal = ensureWizard();
    const step = STEPS[draft.currentStep];
    modal.querySelector(".quick-build-progress").textContent = `步驟 ${draft.currentStep + 1} / ${STEPS.length}：${step.title}`;
    const body = modal.querySelector(".quick-build-body");
    const previousScrollTop = preserveBodyScroll ? body.scrollTop : 0;
    const focusedFieldId = preserveBodyScroll && body.contains(document.activeElement) ? document.activeElement?.id : "";
    if (step.id === "background") renderBackground(body);
    else if (step.id === "race") renderRace(body);
    else if (step.id === "class") renderClass(body);
    else if (step.id === "equipment") renderEquipment(body);
    else if (step.id === "level-one") renderLevelOne(body);
    else if (step.id === "level-one-review") renderLevelOneReview(body);
    else renderPlaceholder(body, step);
    body.scrollTop = preserveBodyScroll ? previousScrollTop : 0;
    if (focusedFieldId) {
      const field = body.querySelector(`#${CSS.escape(focusedFieldId)}`);
      field?.focus?.({ preventScroll: true });
    }
    const previous = modal.querySelector(".quick-build-previous");
    const next = modal.querySelector(".quick-build-next");
    modal.querySelector(".quick-build-footer").hidden = step.id === "level-one-review";
    previous.disabled = draft.currentStep === 0;
    next.disabled = draft.currentStep === STEPS.length - 1 || (step.id === "background" && !backgroundComplete()) || (step.id === "race" && !raceComplete()) || (step.id === "class" && !classComplete()) || (step.id === "equipment" && !equipmentComplete()) || (step.id === "level-one" && !levelOneComplete());
    next.textContent = draft.currentStep === STEPS.length - 1 ? "等待完成必要選擇" : "下一步";
  }

  function chooseBackground(key) {
    if (!BACKGROUND_ORDER.includes(key) || !backgroundData(key)) return;
    const backgroundChangedAfterClassComplete = Boolean(draft.choices.background && draft.choices.background !== key && classComplete(draft));
    draft.choices.background = key;
    draft.choices.backgroundWealth = null;
    draft.choices.backgroundToolChoice = null;
    draft.choices.backgroundMagic = { cantrips: [], levelOneSpells: [] };
    draft.choices.backgroundMagicLastSelected = null;
    draft.choices.backgroundMagicConfirmed = false;
    draft.choices.backgroundAbilityBonuses = emptyAbilityMap();
    draft.choices.spellConflictResolutions = {};
    const blockedSpellClass = HUMAN_MAGIC_INITIATE_BLOCKED_CLASS_BY_BACKGROUND[key];
    if (draft.choices.raceOptions?.feat === "魔法學徒" && draft.choices.raceOptions.featOptions?.spellClass === blockedSpellClass) {
      draft.choices.raceOptions = { ...draft.choices.raceOptions, confirmed: false, featOptions: {} };
    }
    if (backgroundChangedAfterClassComplete) {
      draft.choices.classOptions = {
        ...draft.choices.classOptions,
        stage: "abilities",
        summaryConfirmed: false,
        abilitiesCustomized: true,
        backgroundBonusInvalidated: true
      };
    } else {
      invalidateClassAfterUpstreamChange("abilities");
    }
    saveDraft();
    render();
  }

  function chooseRace(key) {
    if (!RACE_ORDER.includes(key) || !raceData(key)) return;
    draft.choices.race = key;
    draft.choices.raceOptions = {};
    draft.choices.spellConflictResolutions = {};
    invalidateClassAfterUpstreamChange();
    saveDraft();
    render();
  }

  function invalidateClassAfterUpstreamChange(stage = null) {
    if (!draft.choices.class || !isPlainObject(draft.choices.classOptions)) return;
    draft.choices.classOptions = {
      ...draft.choices.classOptions,
      ...(stage ? { stage } : {}),
      summaryConfirmed: false
    };
    draft.choices.levelOne = {};
    draft.choices.targetLevel = 1;
    draft.choices.levelUps = [];
  }

  function chooseClass(key) {
    if (!CLASS_ORDER.includes(key) || !CLASS_BUILD_DEFINITIONS[key]) return;
    draft.choices.class = key;
    draft.choices.abilityMethod = "class-default-customized";
    draft.choices.abilities = { ...DEFAULT_ABILITIES_BY_CLASS[key] };
    draft.choices.backgroundAbilityBonuses = normalizeBackgroundBonuses(draft.choices.backgroundAbilityBonuses, draft.choices.backgroundAbilities);
    draft.choices.classOptions = { stage: CLASS_TYPE_OPTIONS[key]?.length ? "classType" : "abilities", classType: null, skills: [], tools: [], spellcastingAbilityManual: false, summaryConfirmed: false };
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
    render();
  }

  function chooseClassType(type) {
    const key = draft.choices.class;
    if (!CLASS_TYPE_OPTIONS[key]?.some(option => option.id === type)) return;
    draft.choices.classOptions = { ...draft.choices.classOptions, classType: type, stage: "abilities", skills: [], tools: [], abilitiesCustomized: false, summaryConfirmed: false };
    draft.choices.levelOne = {};
    draft.choices.targetLevel = 1;
    draft.choices.levelUps = [];
    applyDefaultClassAbilityPreset(draft);
    const castingSource = spellcastingSourceForDraft(draft);
    draft.choices.spellcastingAbility = castingSource ? castingSource.fixedAbility || preferredMentalAbility(draft) : null;
    saveDraft();
    render();
  }

  function resetClass() {
    draft.choices.class = null;
    draft.choices.abilityMethod = null;
    draft.choices.abilities = emptyAbilityMap(null);
    draft.choices.spellcastingAbility = null;
    draft.choices.classOptions = {};
    draft.choices.classEquipmentMethod = null;
    draft.choices.classEquipment = [];
    draft.choices.defaultWeapon = null;
    draft.choices.classEquipmentOptions = {};
    draft.choices.levelOne = {};
    draft.choices.targetLevel = 1;
    draft.choices.levelUps = [];
    saveDraft();
    render();
  }

  function setClassStage(stage) {
    if (!["classType", "abilities", "spellcasting", "proficiencies", "summary"].includes(stage)) return;
    if (stage === "abilities" && CLASS_TYPE_OPTIONS[draft.choices.class]?.length && !draft.choices.classOptions?.classType) return;
    if (["spellcasting", "proficiencies", "summary"].includes(stage) && !classAbilitiesComplete()) return;
    if (stage === "spellcasting" && !hasDraftSpellcasting()) stage = "proficiencies";
    if (stage === "summary" && !classProficienciesComplete()) return;
    draft.choices.classOptions = { ...draft.choices.classOptions, stage, summaryConfirmed: false };
    saveDraft();
    render();
  }


  function advanceAfterClassAbilities() {
    if (!classAbilitiesComplete()) return;
    draft.choices.classOptions = { ...draft.choices.classOptions, backgroundBonusInvalidated: false };
    setClassStage(hasDraftSpellcasting() ? "spellcasting" : "proficiencies");
  }

  function updateClassAbility(event) {
    const baseKey = event.currentTarget.dataset.classAbilityBase;
    const bonusKey = event.currentTarget.dataset.classAbilityBonus;
    const value = Number(event.currentTarget.value);
    if (baseKey && ABILITY_ORDER.includes(baseKey) && Number.isInteger(value) && value >= 8 && value <= 15) {
      const next = { ...draft.choices.abilities, [baseKey]: value };
      if (abilityPointCost(next) <= 27) draft.choices.abilities = next;
    }
    if (bonusKey && ABILITY_ORDER.includes(bonusKey) && Number.isInteger(value) && value >= 0 && value <= 2) {
      const allowed = new Set((draft.choices.backgroundAbilities || []).map(label => ABILITY_KEYS_BY_LABEL[label]));
      const next = { ...draft.choices.backgroundAbilityBonuses, [bonusKey]: value };
      if (allowed.has(bonusKey) && backgroundBonusTotal(next) <= 3) draft.choices.backgroundAbilityBonuses = next;
    }
    draft.choices.classOptions = { ...draft.choices.classOptions, abilitiesCustomized: true, summaryConfirmed: false };
    draft.choices.levelOne = { ...(draft.choices.levelOne || {}), summaryConfirmed: false };
    saveDraft();
    render(true);
  }

  function updateClassSpellcasting(event) {
    const ability = event.currentTarget.value;
    const castingSource = spellcastingSourceForDraft(draft);
    if (!castingSource || castingSource.type === "class" || !["int", "wis", "cha"].includes(ability)) return;
    draft.choices.spellcastingAbility = ability;
    draft.choices.classOptions = { ...draft.choices.classOptions, spellcastingAbilityManual: true, summaryConfirmed: false };
    draft.choices.levelOne = { ...(draft.choices.levelOne || {}), summaryConfirmed: false };
    saveDraft();
    render(true);
  }

  function updateClassProficiencies() {
    const body = ensureWizard().querySelector(".quick-build-body");
    const skills = [...body.querySelectorAll("[data-class-skill]")].map(select => select.value || "").filter(Boolean);
    const tools = [...body.querySelectorAll("[data-class-tool]")].map(select => select.value || "").filter(Boolean);
    draft.choices.classOptions = { ...draft.choices.classOptions, skills, tools, summaryConfirmed: false };
    draft.choices.levelOne = { ...(draft.choices.levelOne || {}), summaryConfirmed: false, expertise: [] };
    saveDraft();
    render(true);
  }

  function confirmClassSummary() {
    const spellcastingComplete = !hasDraftSpellcasting() || Boolean(draft.choices.spellcastingAbility);
    if (!classAbilitiesComplete() || !spellcastingComplete || !classProficienciesComplete()) return;
    draft.choices.classOptions = { ...draft.choices.classOptions, stage: "summary", summaryConfirmed: true };
    saveDraft();
    render();
  }

  function chooseClassEquipmentMethod(method) {
    const definition = CLASS_EQUIPMENT_DEFINITIONS[draft.choices.class];
    if (!definition || !definition.defaults.map(option => option.id).concat("gold").includes(method)) return;
    draft.choices.classEquipmentMethod = method;
    draft.choices.classEquipment = [];
    draft.choices.defaultWeapon = null;
    draft.choices.classEquipmentOptions = {};
    draft.choices.levelOne = { ...(draft.choices.levelOne || {}), summaryConfirmed: false, weaponMasteries: [] };
    saveDraft();
    render();
  }

  function resetClassEquipment() {
    draft.choices.classEquipmentMethod = null;
    draft.choices.classEquipment = [];
    draft.choices.defaultWeapon = null;
    draft.choices.classEquipmentOptions = {};
    draft.choices.levelOne = { ...(draft.choices.levelOne || {}), summaryConfirmed: false, weaponMasteries: [] };
    saveDraft();
    render();
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
    draft.choices.levelOne = { ...(draft.choices.levelOne || {}), summaryConfirmed: false };
    saveDraft();
    render(true);
  }

  function confirmClassEquipment() {
    const selection = draft.selections.classEquipment;
    if (!selection || selection.content.pendingChoices?.some(item => item !== "確認裝備")) return;
    draft.choices.classEquipmentOptions = { ...draft.choices.classEquipmentOptions, confirmed: true };
    saveDraft();
    render();
  }

  function resetRace() {
    draft.choices.race = null;
    draft.choices.raceOptions = {};
    draft.choices.spellConflictResolutions = {};
    invalidateClassAfterUpstreamChange();
    saveDraft();
    render();
  }

  function updateRaceOption(event) {
    const field = event.currentTarget.dataset.raceOption;
    const value = event.currentTarget.value;
    const options = { ...draft.choices.raceOptions, editing: false };
    if (value) options[field] = value; else delete options[field];
    if (field === "lineage") {
      options.cantripConfirmed = false;
      if (value !== "高等精靈血統") delete options.cantrip;
    }
    if (field === "cantrip") options.cantripConfirmed = false;
    if (draft.choices.race === "goliath" && field === "ancestry") options.confirmed = false;
    if (field === "feat") options.featOptions = {};
    if (draft.choices.race === "human") options.confirmed = false;
    draft.choices.raceOptions = options;
    draft.choices.spellConflictResolutions = {};
    invalidateClassAfterUpstreamChange();
    saveDraft();
    render(draft.choices.race === "human" && ["魔法學徒", "熟習"].includes(options.feat));
  }

  function confirmRaceOption(event) {
    const field = event.currentTarget.dataset.raceOptionConfirm;
    const options = { ...draft.choices.raceOptions, editing: false };
    if (field === "cantrip" && options.cantrip) options.cantripConfirmed = true;
    else if (field === "ancestry" && draft.choices.race === "goliath" && RACE_OPTION_DEFINITIONS.goliath.ancestry.includes(options.ancestry)) options.confirmed = true;
    else return;
    draft.choices.raceOptions = options;
    saveDraft();
    render();
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
    draft.choices.raceOptions = { ...draft.choices.raceOptions, confirmed: false, featOptions: { spellClass, cantrips, levelOneSpells: levelOne ? [levelOne] : [] } };
    draft.choices.spellConflictResolutions = {};
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
    const spell = spellList?.[spellClass]?.[level]?.find(entry => spellChineseName(entry.name) === spellChineseName(select.value)) || null;
    openSpellDetail(spell, trigger);
  }

  function updateHumanSkilledFeat() {
    const values = [...ensureWizard().querySelectorAll("[data-human-skilled]")].map(select => select.value || "");
    draft.choices.raceOptions = { ...draft.choices.raceOptions, confirmed: false, featOptions: { proficiencies: values } };
    invalidateClassAfterUpstreamChange();
    saveDraft();
    render(true);
  }

  function confirmHumanRaceOptions() {
    if (!humanRaceOptionsComplete()) return;
    draft.choices.raceOptions = { ...draft.choices.raceOptions, editing: false, confirmed: true };
    saveDraft();
    render();
  }

  function resolveRaceSpellConflicts(decision) {
    if (decision === "edit-background") {
      draft.currentStep = 0;
      saveDraft();
      render();
    }
  }

  function resetBackground() {
    draft.choices.background = null;
    draft.choices.backgroundWealth = null;
    draft.choices.backgroundToolChoice = null;
    draft.choices.backgroundMagic = { cantrips: [], levelOneSpells: [] };
    draft.choices.backgroundMagicLastSelected = null;
    draft.choices.backgroundMagicConfirmed = false;
    draft.choices.backgroundAbilityBonuses = emptyAbilityMap();
    draft.choices.spellConflictResolutions = {};
    invalidateClassAfterUpstreamChange("abilities");
    saveDraft();
    render();
  }

  function returnToBackgroundEquipment() {
    draft.choices.backgroundWealth = null;
    draft.choices.backgroundToolChoice = null;
    draft.choices.backgroundMagicConfirmed = false;
    draft.choices.spellConflictResolutions = {};
    saveDraft();
    render();
  }

  function chooseBackgroundWealth(method) {
    if (!["default", "gold"].includes(method)) return;
    draft.choices.backgroundWealth = method;
    draft.choices.backgroundToolChoice = null;
    draft.choices.backgroundMagicConfirmed = false;
    draft.choices.spellConflictResolutions = {};
    saveDraft();
    render();
  }

  function chooseBackgroundTool(event) {
    const value = event.currentTarget.value;
    draft.choices.backgroundToolChoice = GAME_TOOL_OPTIONS.includes(value) ? value : null;
    invalidateClassAfterUpstreamChange();
    saveDraft();
    render();
  }

  function updateBackgroundSpells(changedSelect) {
    const body = ensureWizard().querySelector(".quick-build-body");
    let first = body.querySelector("#quick-build-cantrip-1")?.value || "";
    let second = body.querySelector("#quick-build-cantrip-2")?.value || "";
    const levelOne = body.querySelector("#quick-build-level-one")?.value || "";
    const previousLastSelected = draft.choices.backgroundMagicLastSelected;
    let duplicateRejected = false;
    if (first && first === second) {
      duplicateRejected = true;
      if (changedSelect?.id === "quick-build-cantrip-1") first = "";
      else second = "";
      if (changedSelect) changedSelect.value = "";
    }
    draft.choices.backgroundMagic = {
      cantrips: [first, second],
      levelOneSpells: [levelOne].filter(Boolean)
    };
    draft.choices.backgroundMagicLastSelected = duplicateRejected ? previousLastSelected : changedSelect?.value ? {
      name: changedSelect.value,
      level: changedSelect.id === "quick-build-level-one" ? "1" : "cantrips"
    } : null;
    draft.choices.backgroundMagicConfirmed = false;
    draft.choices.spellConflictResolutions = {};
    saveDraft();
    refreshBackgroundSpellControls(body);
  }

  function refreshBackgroundSpellControls(body) {
    const first = body.querySelector("#quick-build-cantrip-1")?.value || "";
    const second = body.querySelector("#quick-build-cantrip-2")?.value || "";
    const levelOne = body.querySelector("#quick-build-level-one")?.value || "";
    syncCantripOptionAvailability(body, first, second);
    const finish = body.querySelector(".quick-build-spell-finish");
    if (finish) finish.disabled = !(first && second && first !== second && levelOne);
  }

  function syncCantripOptionAvailability(body, first, second) {
    const firstSelect = body.querySelector("#quick-build-cantrip-1");
    const secondSelect = body.querySelector("#quick-build-cantrip-2");
    firstSelect?.querySelectorAll("option").forEach(option => { option.disabled = Boolean(second && option.value === second && option.value !== first); });
    secondSelect?.querySelectorAll("option").forEach(option => { option.disabled = Boolean(first && option.value === first && option.value !== second); });
  }

  function finishBackgroundSpells() {
    if (!backgroundSpellsComplete()) return;
    draft.choices.backgroundMagicConfirmed = true;
    saveDraft();
    render();
  }

  function createSageExampleDraft() {
    const example = createDraft();
    const key = "sage";
    const data = backgroundData(key) || {};
    const { currency } = backgroundEquipmentDetails(key, "default");
    example.choices.background = key;
    example.choices.backgroundAbilities = displayList(data.屬性).split("、");
    example.choices.backgroundWealth = "default";
    example.choices.backgroundCurrency = currency;
    example.choices.backgroundMagic = { cantrips: ["火焰箭", "修復術"], levelOneSpells: ["偵測魔法"] };
    example.choices.backgroundMagicConfirmed = true;
    reconcileBackgroundDraft(example);
    return example;
  }

  function loadSageExampleDraft() {
    draft = createSageExampleDraft();
    saveDraft();
    if (document.getElementById("quick-build-wizard")?.classList.contains("open")) render();
    return structuredClone(draft);
  }

  function auditDraft(target = draft) {
    const duplicateIds = [];
    Object.entries(target.acquisitions || {}).forEach(([type, entries]) => {
      const seen = new Set();
      (Array.isArray(entries) ? entries : []).forEach(item => {
        const identity = item?.id || `${item?.sourceType || ""}:${item?.sourceId || ""}:${item?.name || ""}`;
        if (seen.has(identity)) duplicateIds.push(`${type}:${identity}`);
        seen.add(identity);
      });
    });
    return { clean: duplicateIds.length === 0, duplicateIds };
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
    content.innerHTML = spell ? `<strong>${escapeHtml(spell.name)}</strong>${escapeHtml(spell.desc)}` : "<span>你還沒有選擇法術喔！</span>";
    content.scrollTop = 0;
    spellDetailOpenedOutsideWizard = !wizardIsOpen;
    if (wizardIsOpen) {
      wizardShell?.setAttribute("inert", "");
      wizardShell?.setAttribute("aria-hidden", "true");
    } else {
      lockPage(modal);
    }
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    modal.querySelector(".quick-build-spell-detail-close")?.focus();
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
    content.innerHTML = description ? escapeHtml(description) : "<span>你還沒有選擇專長喔！</span>";
    content.scrollTop = 0;
    wizardShell?.setAttribute("inert", "");
    wizardShell?.setAttribute("aria-hidden", "true");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    modal.querySelector(".quick-build-spell-detail-close")?.focus();
  }

  function closeSpellDetail() {
    const modal = document.getElementById("quick-build-spell-detail");
    if (!modal?.classList.contains("open")) return;
    const wizardShell = document.querySelector("#quick-build-wizard .quick-build-shell");
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    wizardShell?.removeAttribute("inert");
    wizardShell?.removeAttribute("aria-hidden");
    if (spellDetailOpenedOutsideWizard) unlockPage();
    spellDetailOpenedOutsideWizard = false;
    spellDetailTrigger?.focus?.();
    spellDetailTrigger = null;
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

  function goToStep(index) {
    if (index > draft.currentStep && STEPS[draft.currentStep].id === "background" && !backgroundComplete()) return;
    if (index > draft.currentStep && STEPS[draft.currentStep].id === "race" && !raceComplete()) return;
    if (index > draft.currentStep && STEPS[draft.currentStep].id === "class" && !classComplete()) return;
    if (index > draft.currentStep && STEPS[draft.currentStep].id === "equipment" && !equipmentComplete()) return;
    if (index > draft.currentStep && STEPS[draft.currentStep].id === "level-one" && !levelOneComplete()) return;
    if (index > draft.currentStep && STEPS[draft.currentStep].id === "background" && draft.choices.classOptions?.backgroundBonusInvalidated) {
      draft.currentStep = STEPS.findIndex(step => step.id === "class");
      draft.choices.classOptions = { ...draft.choices.classOptions, stage: "abilities" };
    } else {
      draft.currentStep = Math.min(Math.max(index, 0), STEPS.length - 1);
    }
    saveDraft();
    render();
  }

  function lockPage(activeModal = null) {
    if (pageLock) return;
    const modal = activeModal || ensureWizard();
    const scrollY = window.scrollY;
    const inertElements = [...document.body.children].filter(element => element !== modal).map(element => ({ element, inert: element.inert }));
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
    previouslyFocused = document.activeElement;
    document.getElementById("ability-choice-modal")?.classList.remove("open");
    document.getElementById("ability-choice-modal")?.setAttribute("aria-hidden", "true");
    draft = loadDraft();
    render();
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    lockPage();
    modal.querySelector(".quick-build-close")?.focus();
  }

  function discardDraft() {
    if (!window.confirm("確定要捨棄創角精靈草稿嗎？背景、裝備、法術等選擇將無法復原。")) return;
    localStorage.removeItem(STORAGE_KEY);
    draft = createDraft();
    closeWizard(false);
  }

  function closeWizard(save = true) {
    const modal = document.getElementById("quick-build-wizard");
    if (!modal?.classList.contains("open")) return;
    closeSpellDetail();
    if (save) saveDraft();
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    unlockPage();
    previouslyFocused?.focus?.();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("quick-card-builder")?.addEventListener("click", openWizard);
  });

  window.quickBuild = {
    open: openWizard, close: closeWizard, createDraft,
    openSpellDetail,
    getDraft: () => structuredClone(draft), saveDraft, addAcquisition,
    createSageExampleDraft, loadSageExampleDraft, auditDraft, reconcileRaceDraft, reconcileClassDraft, reconcileEquipmentDraft, resolveFinalSpellList,
    hasImportedInitialEquipment,
    storageKey: STORAGE_KEY
  };
})();

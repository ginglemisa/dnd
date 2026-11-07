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
    { id: "level-one", title: "最後選擇" },
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
  // 快速創角背景卡片的顯示順序（與角色卡背景選單不同）；背景資料取自背景內容檔，回歸測試確認此清單涵蓋全部背景。
  const BACKGROUND_ORDER = ["acolyte", "criminal", "sage", "seeker", "fieldhand", "soldier"];
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
  // 裝備步驟商店的暫存購買；載入草稿時即用於驗證。
  const SHOP_CURRENCY_COPPER = { 銅幣: 1, 銀幣: 10, 金幣: 100, 白金幣: 1000 };
  const SHOP_ITEM_LIMIT = 200;
  const SHOP_TEXT_LIMIT = 120;
  const SHOP_QUANTITY_MAX = 999;
  const SHOP_CART_ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="19.5" r="1.5" fill="currentColor"/><circle cx="17" cy="19.5" r="1.5" fill="currentColor"/></svg>';

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

  function skillDescriptionButton(skill) {
    const normalizedSkill = SKILL_OPTIONS.includes(skill) ? skill : "";
    return `<button type="button" class="quick-build-skill-info skill-tip" data-skill="${escapeHtml(normalizedSkill)}"${normalizedSkill ? "" : " disabled"} aria-label="${escapeHtml(normalizedSkill ? `${normalizedSkill}：查看技能說明` : "請先選擇技能，再查看說明")}">查看</button>`;
  }

  function weaponMasteryDescriptionButton(mastery) {
    const normalizedMastery = String(mastery || "");
    return `<button type="button" class="quick-build-skill-info" data-weapon-rule-kind="mastery" data-weapon-rule="${escapeHtml(normalizedMastery)}"${normalizedMastery ? "" : " disabled"} aria-label="${escapeHtml(normalizedMastery ? `${normalizedMastery}精通：查看說明` : "請先選擇精通武器，再查看精通")}">查看</button>`;
  }

  function optionNote(text) {
    return text ? `<p class="quick-build-option-note">${escapeHtml(text)}</p>` : "";
  }

  // 規則說明的提示入口：內容在 monster.js 的 skills_example_uses；鍵盤操作由 ensureWizard 統一處理。
  function infoTip(key, label = key) {
    const name = String(label).replace(/\s*ℹ️$/u, "");
    return `<span class="skill-tip" data-skill="${escapeHtml(key)}" role="button" tabindex="0" aria-label="${escapeHtml(`${name}：開啟說明`)}">${escapeHtml(label)}</span>`;
  }

  function conceptHelp(key) {
    return `<p class="quick-build-equipment-help">${infoTip(key)}</p>`;
  }

  // 物品與工具的「查看」：點擊由 ensureWizard 統一接到 search.js 的裝備詳情。
  function equipmentDetailButton(name, emptyLabel) {
    return `<button type="button" class="quick-build-spell-view" data-equipment-detail="${escapeHtml(name || "")}"${name ? ` aria-label="${escapeHtml(`${name}：查看說明`)}"` : ` disabled aria-label="${escapeHtml(emptyLabel)}"`}>查看</button>`;
  }

  function quickBuildProficiencyBonus() {
    return window.calculateProficiencyBonus?.(QUICK_BUILD_LEVEL) ?? 2;
  }

  // 起源專長（專長內容檔 type: origin），依專長選單順序；有來源標籤的加上標籤（例如「醫療兵(擴充)」）。
  function humanOriginFeatOptions() {
    return Object.entries(window.getAllFeatRules?.() || {})
      .filter(([, rule]) => rule.type === "origin")
      .map(([id, rule]) => ({ value: id, label: window.formatContentSourceName(id, rule.source) }));
  }

  // 戰鬥風格專長（專長內容檔 type: style）的專長 ID，依專長選單順序。
  function fightingStyleFeatIds() {
    return Object.entries(window.getAllFeatRules?.() || {}).filter(([, rule]) => rule.type === "style").map(([id]) => id);
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
  const CLASS_LABELS = {
    barbarian: "野蠻人", bard: "吟遊詩人", cleric: "牧師", druid: "德魯伊",
    fighter: "戰士", monk: "武僧", paladin: "聖騎士", ranger: "遊俠",
    rogue: "盜賊", sorcerer: "術士", warlock: "契術師", wizard: "法師"
  };
  const CLASS_CARD_DESCRIPTIONS = {
    barbarian: "前線硬漢：血量最高，能狂暴強化力量與韌性。",
    bard: "能施法、激勵同伴，又善於交涉，是隊伍裡的萬金油。",
    cleric: "披甲持盾的神術施法者，能治療支援，也能站上前線。",
    druid: "操使自然魔法，能攻擊也能治療；2 級起可化身野獸。",
    fighter: "能穿所有護甲、用所有武器，適應各種戰鬥方式。",
    monk: "不靠護甲，以高速移動與徒手或武器連擊制敵。",
    paladin: "穿重甲近戰，以神聖之力治療、守護同伴。",
    ranger: "結合武藝、自然魔法與野外本領的出色獵手。",
    rogue: "擅長潛行開鎖，抓住破綻就能偷襲重創敵人。",
    sorcerer: "靠天生魔力施法，2 級起能改造法術效果。",
    warlock: "透過超自然契約，換取力量與獨特魔法。",
    wizard: "學習大量法術，靠知識與事前準備應付各種情況。"
  };
  const ABILITY_ORDER = ["str", "dex", "con", "int", "wis", "cha"];
  const ABILITY_LABELS = { str: "力量", dex: "敏捷", con: "體質", int: "智力", wis: "感知", cha: "魅力" };
  const ABILITY_KEYS_BY_LABEL = Object.fromEntries(Object.entries(ABILITY_LABELS).map(([key, label]) => [label, key]));
  const POINT_BUY_COSTS = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
  const CLASS_TYPE_OPTIONS = {
    cleric: [
      { id: "guardian", label: "守護者", description: "獲得軍用武器熟練與重甲訓練\n適合站上前線近戰" },
      { id: "thaumaturge", label: "魔術使", description: "額外學會 1 個牧師戲法\n奧秘和宗教檢定額外加感知調整值（至少 +1）" }
    ],
    fighter: [
      { id: "strength", label: "力量型", description: "先幫你把力量配高\n適合穿重甲、用巨劍等近戰武器" },
      { id: "dexterity", label: "敏捷型", description: "先幫你把敏捷配高\n適合用長弓、彎刀等靠敏捷的武器" }
    ]
  };
  // 牧師的類型是神聖使命（規則選擇），戰士的類型只決定預填屬性，兩者的標題與引導句不同。
  const CLASS_TYPE_COPY = {
    cleric: { name: "神聖使命", lead: "選擇你侍奉神祇的方式：披甲上陣，還是鑽研學識？" },
    fighter: { name: "預填方向", lead: "這只決定系統先幫你配好的屬性，不會改變戰士的能力，之後都能調整。" }
  };
  const CLASS_TOOL_NOTES = {
    monk: "挑一個符合角色形象的就好，不影響攻擊；拿初始裝備時會一起拿到它。",
    bard: "任選 3 種你會演奏的樂器；初始裝備會從中送你 1 件。"
  };
  const FIXED_TOOL_INTROS = {
    草藥工具: "草藥工具：辨識植物，也能製作抗毒劑、醫療包、治療藥水等。",
    盜賊工具: "盜賊工具：用來開鎖和解除陷阱。"
  };
  const SUMMARY_TIP_LABELS = new Set(["關鍵屬性", "生命骰", "豁免熟練", "技能額外加值", "武器熟練", "護甲訓練"]);
  function summaryLabel(label) {
    return SUMMARY_TIP_LABELS.has(label) ? infoTip(label) : escapeHtml(label);
  }
  function signedModifierText(total) {
    const { sign, value } = signedNumberParts(abilityModifier(total));
    return `${sign}${value}`;
  }
  const DEFAULT_ABILITIES_BY_BUILD_AND_BACKGROUND = {
    barbarian: { acolyte: [[14,14,14,8,10,12], { int: 1, wis: 2 }], criminal: [[14,13,14,8,12,12], { dex: 1, con: 2 }], sage: [[14,14,15,8,10,10], { con: 1, wis: 2 }], soldier: [[14,14,15,8,10,10], { str: 2, con: 1 }], fieldhand: [[14,14,15,8,10,10], { str: 2, con: 1 }], seeker: [[14,14,15,8,10,10], { con: 1, wis: 2 }] },
    bard: { acolyte: [[8,14,14,8,12,15], { int: 2, cha: 1 }], criminal: [[8,14,15,10,10,14], { dex: 2, con: 1 }], sage: [[8,14,15,8,12,14], { con: 1, int: 2 }], soldier: [[8,14,15,10,10,14], { dex: 2, con: 1 }], fieldhand: [[8,14,15,8,12,14], { con: 1, wis: 2 }], seeker: [[8,14,14,8,12,15], { con: 2, cha: 1 }] },
    "cleric:thaumaturge": { acolyte: [[8,14,14,8,15,12], { int: 2, wis: 1 }], criminal: [[8,13,14,12,14,12], { dex: 1, con: 2 }], sage: [[8,14,14,10,15,10], { con: 2, wis: 1 }], soldier: [[8,13,14,12,14,12], { dex: 1, con: 2 }], fieldhand: [[8,14,14,8,15,12], { con: 2, wis: 1 }], seeker: [[8,14,14,8,15,12], { con: 2, wis: 1 }] },
    "cleric:guardian": { acolyte: [[14,10,14,8,15,10], { wis: 1, cha: 2 }], criminal: [[14,8,15,8,14,12], { dex: 2, con: 1 }], sage: [[14,8,14,8,15,12], { con: 2, wis: 1 }], soldier: [[14,8,15,8,14,12], { str: 2, con: 1 }], fieldhand: [[14,10,14,8,15,10], { str: 2, wis: 1 }], seeker: [[14,10,14,8,15,10], { con: 2, wis: 1 }] },
    druid: { acolyte: [[8,14,14,10,15,10], { int: 2, wis: 1 }], criminal: [[8,13,14,12,14,12], { dex: 1, con: 2 }], sage: [[8,14,14,10,15,10], { con: 2, wis: 1 }], soldier: [[8,13,14,12,14,12], { dex: 1, con: 2 }], fieldhand: [[8,14,14,10,15,10], { con: 2, wis: 1 }], seeker: [[8,14,14,10,15,10], { con: 2, wis: 1 }] },
    "fighter:strength": { acolyte: [[14,12,14,8,13,12], { int: 2, wis: 1 }], criminal: [[14,11,14,10,12,12], { dex: 1, con: 2 }], sage: [[14,12,14,9,12,12], { con: 2, int: 1 }], soldier: [[15,9,15,8,12,12], { str: 1, dex: 1, con: 1 }], fieldhand: [[14,12,14,8,13,12], { str: 2, wis: 1 }], seeker: [[14,12,14,8,13,12], { con: 2, wis: 1 }] },
    "fighter:dexterity": { acolyte: [[10,14,14,10,13,12], { int: 2, wis: 1 }], criminal: [[8,15,15,9,12,12], { dex: 1, con: 1, int: 1 }], sage: [[10,14,14,11,12,12], { con: 2, int: 1 }], soldier: [[9,14,15,10,12,12], { dex: 2, con: 1 }], fieldhand: [[10,14,14,10,13,12], { con: 2, wis: 1 }], seeker: [[10,14,14,10,13,12], { con: 2, wis: 1 }] },
    monk: { acolyte: [[10,14,14,8,15,10], { int: 2, wis: 1 }], criminal: [[8,14,15,10,14,10], { dex: 2, con: 1 }], sage: [[8,14,14,10,15,10], { con: 2, wis: 1 }], soldier: [[8,14,15,10,14,10], { dex: 2, con: 1 }], fieldhand: [[10,14,14,8,15,10], { con: 2, wis: 1 }], seeker: [[10,14,14,8,15,10], { con: 2, wis: 1 }] },
    paladin: { acolyte: [[14,10,14,8,10,15], { wis: 2, cha: 1 }], criminal: [[14,8,15,8,12,14], { dex: 2, con: 1 }], sage: [[14,10,15,8,10,14], { con: 1, wis: 2 }], soldier: [[14,8,15,8,12,14], { str: 2, con: 1 }], fieldhand: [[14,10,15,8,10,14], { str: 2, con: 1 }], seeker: [[14,10,14,8,10,15], { con: 2, cha: 1 }] },
    ranger: { acolyte: [[10,14,14,8,15,10], { int: 2, wis: 1 }], criminal: [[8,14,15,10,14,10], { dex: 2, con: 1 }], sage: [[8,14,14,10,15,10], { con: 2, wis: 1 }], soldier: [[8,14,15,10,14,10], { dex: 2, con: 1 }], fieldhand: [[10,14,14,8,15,10], { con: 2, wis: 1 }], seeker: [[10,14,14,8,15,10], { con: 2, wis: 1 }] },
    rogue: { acolyte: [[8,14,14,11,13,13], { int: 1, wis: 1, cha: 1 }], criminal: [[8,14,15,10,10,14], { dex: 2, con: 1 }], sage: [[8,14,14,12,13,12], { con: 2, wis: 1 }], soldier: [[8,14,15,10,10,14], { dex: 2, con: 1 }], fieldhand: [[8,14,14,12,13,12], { con: 2, wis: 1 }], seeker: [[8,14,14,12,13,12], { con: 2, wis: 1 }] },
    sorcerer: { acolyte: [[8,14,14,8,12,15], { int: 2, cha: 1 }], criminal: [[8,14,15,8,12,14], { dex: 2, con: 1 }], sage: [[8,14,15,8,12,14], { con: 1, int: 2 }], soldier: [[8,14,15,8,12,14], { dex: 2, con: 1 }], fieldhand: [[8,14,15,8,12,14], { con: 1, wis: 2 }], seeker: [[8,14,14,8,12,15], { con: 2, cha: 1 }] },
    warlock: { acolyte: [[8,14,14,8,12,15], { int: 2, cha: 1 }], criminal: [[8,14,15,8,12,14], { dex: 2, con: 1 }], sage: [[8,14,15,8,12,14], { con: 1, int: 2 }], soldier: [[8,14,15,8,12,14], { dex: 2, con: 1 }], fieldhand: [[8,14,15,8,12,14], { con: 1, wis: 2 }], seeker: [[8,14,14,8,12,15], { con: 2, cha: 1 }] },
    wizard: { acolyte: [[8,14,14,15,10,10], { int: 1, wis: 2 }], criminal: [[8,13,15,15,10,10], { dex: 1, con: 1, int: 1 }], sage: [[8,14,14,15,10,10], { con: 2, int: 1 }], soldier: [[10,13,14,14,12,10], { dex: 1, con: 2 }], fieldhand: [[8,14,15,14,10,10], { con: 1, wis: 2 }], seeker: [[8,14,15,14,10,10], { con: 1, wis: 2 }] }
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
  // 職業的豁免、技能選擇與職業工具取自職業內容檔（classRules 的 saves、skills、proficiencies.tools）；
  // 這裡只留快速創角自己的推薦屬性、施法屬性、工具標籤與摘要文字。
  const CLASS_BUILD_DEFINITIONS = withClassBuildRules({
    barbarian: { keyAbilities: ["力量"], weaponProficiencies: "簡易武器和軍用武器", armorTraining: "輕甲、中甲和盾牌" },
    bard: { keyAbilities: ["魅力"], toolLabel: "樂器", weaponProficiencies: "簡易武器", armorTraining: "輕甲", spellcastingAbility: "cha" },
    cleric: { keyAbilities: ["感知"], weaponProficiencies: "簡易武器", armorTraining: "輕甲、中甲和盾牌", spellcastingAbility: "wis" },
    druid: { keyAbilities: ["感知"], weaponProficiencies: "簡易武器", armorTraining: "輕甲和盾牌", spellcastingAbility: "wis" },
    fighter: { keyAbilities: ["力量", "敏捷"], weaponProficiencies: "簡易武器和軍用武器", armorTraining: "輕甲、中甲、重甲和盾牌" },
    monk: { keyAbilities: ["敏捷", "感知"], toolLabel: "工匠工具或樂器", weaponProficiencies: "簡易武器和具有輕型屬性的軍用武器", armorTraining: "無" },
    paladin: { keyAbilities: ["力量", "魅力"], weaponProficiencies: "簡易武器和軍用武器", armorTraining: "輕甲、中甲、重甲和盾牌", spellcastingAbility: "cha" },
    ranger: { keyAbilities: ["敏捷", "感知"], weaponProficiencies: "簡易武器和軍用武器", armorTraining: "輕甲、中甲和盾牌", spellcastingAbility: "wis" },
    rogue: { keyAbilities: ["敏捷"], weaponProficiencies: "簡易武器和具有靈巧或輕型屬性的軍用武器", armorTraining: "輕甲" },
    sorcerer: { keyAbilities: ["魅力"], weaponProficiencies: "簡易武器", armorTraining: "無", spellcastingAbility: "cha" },
    warlock: { keyAbilities: ["魅力"], weaponProficiencies: "簡易武器", armorTraining: "輕甲", spellcastingAbility: "cha" },
    wizard: { keyAbilities: ["智力"], weaponProficiencies: "簡易武器", armorTraining: "無", spellcastingAbility: "int" }
  });

  function withClassBuildRules(definitions) {
    return Object.fromEntries(Object.entries(definitions).map(([key, definition]) => {
      const rules = window.getClassRules?.(key);
      const tools = rules?.proficiencies?.tools;
      const toolGroups = TOOL_CATALOG_AVAILABLE ? TOOL_CATALOG.groups : [];
      return [key, {
        ...definition,
        saves: (rules?.saves || []).map(ability => ABILITY_LABELS[ability]),
        skillOptions: rules?.skills.from === "any" ? SKILL_OPTIONS : [...(rules?.skills.from || [])],
        skillCount: rules?.skills.choose || 0,
        ...(tools?.fixed ? { fixedTools: [tools.fixed] } : {}),
        ...(tools?.chooseFrom ? { toolOptions: tools.chooseFrom.flatMap(id => toolGroups.find(group => group.id === id)?.options || []), toolCount: tools.count } : {})
      }];
    }));
  }

  // 1 級的數量取自職業內容檔：戲法、準備法術與魔能祈喚讀特性表，武器精通、專精與職業額外語言讀 picks；
  // 語言另有所有角色都有的 2 種初始語言。數量為 0 的欄位不列出（同沒有這項選擇）。
  function withLevelOneRules(definitions) {
    return Object.fromEntries(Object.entries(definitions).map(([key, definition]) => {
      const pickCount = kind => (window.getClassPicks?.(key, QUICK_BUILD_LEVEL, { kind }) || []).reduce((sum, item) => sum + item.count, 0);
      const counts = {
        cantrips: window.getClassProgressionValue?.(key, "cantrips", QUICK_BUILD_LEVEL),
        preparedSpells: window.getClassProgressionValue?.(key, "preparedSpells", QUICK_BUILD_LEVEL),
        invocations: window.getClassProgressionValue?.(key, "invocations", QUICK_BUILD_LEVEL),
        weaponMastery: pickCount("weaponMastery"),
        expertise: pickCount("expertise")
      };
      return [key, {
        ...definition,
        languages: 2 + pickCount("language"),
        ...Object.fromEntries(Object.entries(counts).filter(([, value]) => value))
      }];
    }));
  }
  // 職業初始裝備的物品與金幣取自職業內容檔（classRules.equipment）；這裡只放快速創角給新手的配置：
  // 主手候選與對應的副手、身著護甲、寫入攻擊備註的提示（specialWrites），以及擇一物品直接給的品項（pick，鍵為內容檔 choose 文字）。
  // 鍵為內容檔的組合 ID（只有一組時為 default）。
  const CLASS_EQUIPMENT_LOADOUTS = {
    barbarian: { default: { main: ["巨斧", "手斧"], off: { 巨斧: [], 手斧: ["手斧"] } } },
    bard: { default: { main: ["匕首"], off: { 匕首: [] }, armor: "皮甲" } },
    cleric: { default: { main: ["硬頭錘"], off: { 硬頭錘: ["盾牌"] }, armor: "半身鎖甲", pick: { 聖徽: "徽章" }, specialWrites: [{ field: "offHandAttackNote", note: "盾面繪有聖徽" }] } },
    druid: { default: { main: ["鐮刀"], off: { 鐮刀: ["盾牌"] }, armor: "皮甲" } },
    fighter: {
      "strength-default": { main: ["巨劍"], off: { 巨劍: [] }, armor: "鎖子甲" },
      "dexterity-default": { main: ["長弓", "彎刀", "短劍"], off: { 長弓: [], 彎刀: ["短劍"], 短劍: ["彎刀"] }, armor: "鑲釘皮甲" }
    },
    monk: { default: { main: ["短矛", "匕首"], off: { 短矛: ["武藝"], 匕首: ["武藝"] } } },
    paladin: { default: { main: ["長劍", "標槍"], off: { 長劍: ["盾牌"], 標槍: ["盾牌"] }, armor: "鎖子甲", pick: { 聖徽: "徽章" }, specialWrites: [{ field: "offHandAttackNote", note: "盾面繪有聖徽" }] } },
    ranger: { default: { main: ["長弓", "彎刀", "短劍"], off: { 長弓: [], 彎刀: ["短劍"], 短劍: ["彎刀"] }, armor: "鑲釘皮甲" } },
    rogue: { default: { main: ["短弓", "短劍", "匕首"], off: { 短弓: [], 短劍: [], 匕首: [] }, armor: "皮甲" } },
    sorcerer: { default: { main: ["匕首"], off: { 匕首: [] } } },
    warlock: { default: { main: ["匕首"], off: { 匕首: [] }, armor: "皮甲" } },
    wizard: { default: { main: ["匕首"], off: { 匕首: ["長棍"] }, specialWrites: [{ field: "offHandAttackNote", note: "奧術法器，施法用。" }] } }
  };

  // 內容檔物品寫法「名稱 ×n」拆成 [名稱, 數量]。
  function splitEquipmentQuantity(text) {
    const match = String(text).match(/^(.*?)\s*×\s*(\d+)$/u);
    return match ? [match[1].trim(), Number(match[2])] : [String(text), 1];
  }

  // 初始裝備組合：items 為 [名稱, 數量, 附註]，附註 weight 是自訂物品的磅數、proficiencyTool 是從工具熟練帶入的擇一物品。
  // 工具熟練只選一種（武僧）時直接給那一項；選多種（吟遊詩人的樂器）時改由 instrument 下拉選擇。
  function classEquipmentDefinition(key) {
    const rules = window.getClassRules?.(key);
    const loadouts = CLASS_EQUIPMENT_LOADOUTS[key];
    if (!rules?.equipment || !loadouts) return null;
    const toolCount = rules.proficiencies?.tools?.count || 0;
    const defaults = rules.equipment.A.map(option => {
      const loadout = loadouts[option.id];
      if (!loadout) return null;
      let instrument = false;
      const items = option.items.flatMap(item => {
        if (typeof item === "string") return [splitEquipmentQuantity(item)];
        if (item.name) return [[item.name, 1, { weight: item.weight }]];
        if (item.from) return [[loadout.pick?.[item.choose] || item.from[0], 1]];
        if (toolCount > 1) {
          instrument = true;
          return [];
        }
        return [[item.choose, 1, { proficiencyTool: true }]];
      });
      const { pick, ...rest } = loadout;
      return { id: option.id, label: option.label ? `${option.label}初始裝備` : "初始裝備", items, gp: option.gold, ...rest, ...(instrument ? { instrument: true } : {}) };
    }).filter(Boolean);
    return defaults.length ? { gold: rules.equipment.B.gold, defaults } : null;
  }

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
  // 1 級的武器精通、專精數量與職業額外語言數取自職業內容檔的 picks（見 withLevelOneRules）；
  // 這裡只留快速創角自己的固定能力摘要、預設選擇與職業選項。
  const LEVEL_ONE_DEFINITIONS = withLevelOneRules({
    barbarian: { fixed: ["狂暴", "無甲防禦"], prefillMasteryFromDefaultWeapon: true },
    bard: { fixed: ["吟遊詩人激勵"], spellChange: { cantrip: "每升 1 級可換 1 個。", prepared: "每升 1 級可換 1 個。" }, defaultCantrips: ["dancing-lights", "vicious-mockery"], defaultPreparedSpells: ["charm-person", "color-spray", "dissonant-whispers", "healing-word"] },
    cleric: { extraCantripClassType: "thaumaturge", spellChange: { cantrip: "每升 1 級可換 1 個。", prepared: "每次長休後可全部更換。" }, defaultCantrips: ["guidance", "sacred-flame", "thaumaturgy"], defaultPreparedSpells: ["bless", "cure-wounds", "guiding-bolt", "shield-of-faith"] },
    druid: { fixed: ["德魯伊語", "動物交談（始終準備）"], classOption: { key: "primalOrder", label: "原初使命", lead: "選擇你守護自然的方式：鑽研魔法知識，還是投身武裝戰鬥？", options: [{ id: "magician", label: "巫祝", intro: "額外學會 1 個德魯伊戲法\n奧秘和自然技能檢定額外 +{X}（等於感知調整值，至少 +1）" }, { id: "warden", label: "哨衛", intro: "獲得軍用武器熟練與中甲訓練\n可使用長劍、戰斧等武器，穿半身鎖甲等中甲；初始裝備不變，之後可自行添購。" }] }, extraCantripOption: "magician", alwaysPrepared: ["speak-with-animals"], alwaysPreparedIntros: { "speak-with-animals": "能理解野獸並與牠們交談。" }, spellChange: { cantrip: "每升 1 級可換 1 個。", prepared: "每次長休後可全部更換。" }, defaultCantrips: ["druidcraft", "produce-flame"], defaultPreparedSpells: ["animal-friendship", "cure-wounds", "faerie-fire", "thunderwave"] },
    fighter: { fixed: ["回氣"], fightingStyle: true, prefillMasteryFromDefaultWeapon: true },
    monk: { fixed: ["武藝", "無甲防禦"] },
    paladin: { fixed: ["聖療"], spellChange: { prepared: "每次長休後可換 1 個。" }, defaultWeaponMasteries: ["長劍", "標槍"], defaultPreparedSpells: ["heroism", "searing-smite"] },
    ranger: { fixed: ["宿敵：獵人印記始終準備，可免費施放 2 次"], spellChange: { prepared: "每次長休後可換 1 個。" }, defaultWeaponMasteries: ["長弓", "短劍"], alwaysPrepared: ["hunters-mark"], alwaysPreparedIntros: { "hunters-mark": "標記 1 個目標，攻擊命中時多 1d6 力場傷害。可不耗法術位施放 {宿敵次數} 次，長休恢復。" }, alwaysPreparedFeature: "遊俠等級 1：宿敵", alwaysPreparedFreeUses: { 1: 2 }, defaultPreparedSpells: ["cure-wounds", "ensnaring-strike"] },
    rogue: { fixed: ["偷襲", "盜賊黑話"], defaultWeaponMasteries: ["匕首", "短弓"] },
    sorcerer: { fixed: ["天生術法"], spellChange: { cantrip: "每升 1 級可換 1 個。", prepared: "每升 1 級可換 1 個。" }, defaultCantrips: ["light", "prestidigitation", "shocking-grasp", "sorcerous-burst"], defaultPreparedSpells: ["burning-hands", "detect-magic"] },
    warlock: { spellChange: { cantrip: "每升 1 級可換 1 個。", prepared: "每升 1 級可換 1 個。" }, spellSlotKey: "spellSlots", spellSlotRecovery: "短休或長休後", defaultInvocations: ["pact-of-the-tome"], defaultCantrips: ["eldritch-blast", "prestidigitation"], defaultPreparedSpells: ["charm-person", "hex"] },
    wizard: { fixed: ["儀式精通", "奧術回想"], spellChange: { cantrip: "每次長休後可換 1 個。" }, spellbookSpells: 6, defaultCantrips: ["light", "mage-hand", "ray-of-frost"], defaultSpellbookSpells: ["detect-magic", "feather-fall", "mage-armor", "magic-missile", "sleep", "thunderwave"], defaultPreparedSpells: ["mage-armor", "feather-fall", "sleep", "magic-missile"] }
  });
  // 1 級自動獲得的能力：id 為職業內容檔的能力 id，名稱與「查看」內容讀內容檔；這裡只放給新手的一句話介紹。回歸測試確認 id 都存在。
  const LEVEL_ONE_FEATURE_INTROS = {
    barbarian: [
      { id: "barbarian-rage", text: ctx => `未穿重甲時可進入狂暴：受到的鈍擊、穿刺、揮砍傷害減半，用力量攻擊時傷害 +${ctx.value("rageDamage")}，但不能施法。\n可用 ${ctx.value("rageUses")} 次，短休恢復 1 次，長休後全部恢復。` },
      { id: "barbarian-unarmored-defense", text: () => "沒穿護甲時，AC = 10 + 敏捷調整值 + 體質調整值；可以持盾。" }
    ],
    bard: [{ id: "bard-inspiration", text: ctx => `給 60 呎內 1 名同伴一顆 d${ctx.value("inspirationDie")} 激勵骰；對方之後擲 d20 失敗時，可以擲這顆骰加上去。\n可用 ${Math.max(1, ctx.mod("cha"))} 次，長休後全部恢復。` }],
    cleric: [{ id: "cleric-divine-order", text: ctx => ctx.classType === "thaumaturge"
      ? `額外學會 1 個牧師戲法；奧秘和宗教檢定額外 +${Math.max(1, ctx.mod("wis"))}（等於感知調整值，至少 +1）。`
      : "獲得軍用武器熟練與重甲訓練。" }],
    druid: [{ id: "druid-druidic", text: () => "會說德魯伊的祕密語言「德魯伊語」，也能留下只有懂這種語言的人才會自動發現的暗號。" }],
    fighter: [{ id: "fighter-second-wind", text: ctx => `關鍵時刻恢復 1d10 + ${QUICK_BUILD_LEVEL} 生命值。\n可用 ${ctx.value("secondWindUses")} 次，短休恢復 1 次，長休後全部恢復。` }],
    monk: [
      { id: "monk-martial-arts", text: ctx => `未穿護甲、未持盾時：可多打 1 次徒手攻擊，傷害可改用 1d${ctx.value("martialArtsDie")}，攻擊與傷害可用敏捷取代力量。\n只適用徒手或武僧武器。` },
      { id: "monk-unarmored-defense", text: () => "未穿護甲、未持盾時，AC = 10 + 敏捷調整值 + 感知調整值。" }
    ],
    paladin: [{ id: "paladin-lay-on-hands", text: () => `擁有 ${QUICK_BUILD_LEVEL * 5} 點治療能量，觸碰生物（可以是自己）分配點數回血；也可花 5 點改為移除中毒。\n長休後全部恢復。` }],
    ranger: [{ id: "ranger-favored-enemy", text: ctx => `始終準備獵人印記，可不耗法術位施放 ${ctx.value("favoredEnemy")} 次，長休後恢復。` }],
    rogue: [
      { id: "rogue-sneak-attack", text: ctx => `每回合 1 次，用靈巧或遠程武器命中時，若有優勢，或目標 5 呎內有未失能的同伴且沒有劣勢，傷害多 ${ctx.value("sneakAttackDice")}d6。` },
      { id: "rogue-thieves-cant", text: () => "學會盜賊黑話，並額外學會 1 種語言（在語言區選）。" }
    ],
    sorcerer: [{ id: "sorcerer-innate-sorcery", text: () => "啟動後 1 分鐘內，敵人更難抵抗你的法術（豁免難度 +1），法術攻擊具有優勢。\n可用 2 次，長休後全部恢復。" }],
    warlock: [{ id: "warlock-pact-magic", text: ctx => `法術位只有 ${ctx.value("spellSlots")} 個，但短休或長休都會全部恢復。` }],
    wizard: [
      { id: "wizard-ritual-adept", text: () => "法術書裡有「儀式」標籤的法術，不用準備也能施放：多花 10 分鐘、要讀法術書，不耗法術位。" },
      { id: "wizard-arcane-recovery", text: () => `短休時可恢復部分法術位，總環階最多 ${Math.ceil(QUICK_BUILD_LEVEL / 2)}；用過後要長休才能再用。` }
    ]
  };
  function levelOneFeatureName(key, id) {
    return window.getClassRules?.(key)?.features?.find(feature => feature.id === id)?.name || id;
  }
  function levelOneFeatureNames(key) {
    return (LEVEL_ONE_FEATURE_INTROS[key] || []).map(({ id }) => levelOneFeatureName(key, id));
  }
  const FIGHTING_STYLE_INTROS = {
    箭術: "遠程武器的攻擊檢定 +2，更容易命中。\n適合主要用弓或弩的戰士。",
    防禦: "只要穿著護甲，AC（護甲等級）+1，更難被打中。\n適合所有穿甲的戰士。",
    巨武器戰鬥: "用雙手或兩用武器時，傷害骰擲出 1 或 2 都當 3 算。\n適合巨劍、巨斧、長劍這類武器。",
    雙武器戰鬥: "兩手各拿輕型武器時，額外那一擊的傷害也能加屬性調整值。\n適合彎刀配短劍這類組合。"
  };
  const WEAPON_MASTERY_SUMMARIES = {
    順劈: "順劈：近戰命中後，可再攻擊旁邊另一個敵人（不加屬性調整值）。每回合一次。",
    劃傷: "劃傷：沒打中也會造成傷害，數值等於這次攻擊的屬性調整值。",
    迅切: "迅切：輕型武器的額外攻擊可併入攻擊動作，不必用附贈動作。每回合一次。",
    推離: "推離：命中大型或更小的敵人時，可把它推開最多 10 呎。",
    削弱: "削弱：命中後，目標在你下回合開始前的下一次攻擊有劣勢。",
    緩速: "緩速：命中並造成傷害時，目標速度降低 10 呎，直到你下回合開始。",
    失衡: "失衡：命中後，可逼目標做體質豁免，失敗就倒地。",
    侵擾: "侵擾：命中並造成傷害後，你下回合結束前對它的下一次攻擊有優勢。"
  };
  const ALIGNMENT_DESCRIPTIONS = {
    LG: "守序善良：守規矩，也真心幫助別人。",
    NG: "中立善良：想做好事，不特別在意規矩。",
    CG: "混亂善良：跟著良心走，不喜歡被約束。",
    LN: "守序中立：照規矩、傳統或自己的信條行事。",
    TN: "絕對中立：不偏向任何一方，看情況行動。",
    CN: "混亂中立：重視自由，想做什麼就做什麼。",
    LE: "守序邪惡：利用規則和秩序，達成自己的目的。",
    NE: "中立邪惡：只顧自己，傷害別人也不在乎。",
    CE: "混亂邪惡：任性破壞，不在乎別人死活。"
  };
  // 裝備步驟的主手說明：括號內的傷害讀武器目錄。回歸測試確認涵蓋每個可選的主手。
  const RANGED_DUAL_MAIN_HAND_NOTES = {
    長弓: "雙手拿，遠距離射擊，射程 150／600 呎。",
    彎刀: "近戰，可用敏捷攻擊。副手拿短劍，攻擊後可多砍一次。",
    短劍: "近戰，可用敏捷攻擊。副手拿彎刀，攻擊後可多砍一次。"
  };
  const MAIN_HAND_NOTES = {
    barbarian: { 巨斧: "雙手拿，單次傷害高。", 手斧: "兩手各拿一把，也能投擲。攻擊後可用另一把多砍一次。" },
    monk: { 短矛: "近戰或投擲都行，投擲射程 20／60 呎。", 匕首: "輕巧，也能投擲，初始裝備有好幾把可丟。" },
    paladin: { 長劍: "近戰主武器，另一手舉盾。", 標槍: "可投擲攻擊遠處敵人，射程 30／120 呎，另一手舉盾。" },
    fighter: RANGED_DUAL_MAIN_HAND_NOTES,
    ranger: RANGED_DUAL_MAIN_HAND_NOTES,
    rogue: { 短弓: "雙手拿，遠距離射擊，射程 80／320 呎。可以偷襲。", 短劍: "近戰，可用敏捷攻擊。可以偷襲。", 匕首: "近戰或投擲，可用敏捷攻擊。可以偷襲。" }
  };
  const EQUIPMENT_NOTE_DISPLAY = {
    盾面繪有聖徽: "聖徽就畫在盾牌上，可當施法器具。",
    "奧術法器，施法用。": "長棍也是奧術法器，施法時可使用。"
  };
  const EQUIPMENT_LIST_NOTE = "點物品名稱可以看說明。「套組」是一整包常用的冒險用品。";

  function findWeaponEntry(name) {
    const { simple, martial } = weaponMasteryCatalog();
    return [...simple, ...martial].find(weapon => weapon.名稱 === name) || null;
  }

  function weaponHasProperty(name, property) {
    const weapon = findWeaponEntry(name);
    return Boolean(weapon) && [weapon.屬性1, weapon.屬性2, weapon.屬性3, weapon.屬性4].some(value => value?.includes(property));
  }

  // 裝備清單的物品名稱：查得到裝備說明的做成按鈕（法術書等沒有說明的物品、「擇一」與金幣維持文字）。
  function equipmentLinks(names) {
    return names.map(raw => {
      const [name] = splitEquipmentQuantity(raw);
      const stripped = name.replace(/（.*?）/gu, "").trim();
      const target = stripped === "徽章" ? "聖徽" : stripped;
      const hasDetail = !/擇一|自選|金幣/u.test(raw) && window.renderEquipmentDetailInto?.(document.createElement("div"), target);
      return hasDetail ? `<button type="button" class="quick-build-item-link" data-equipment-detail="${escapeHtml(target)}">${escapeHtml(raw)}</button>` : escapeHtml(raw);
    }).join("、");
  }
  const ELDRITCH_INVOCATION_OPTIONS = [
    { id: "armor-of-shadows", label: "幽影護甲", description: "隨時可施展法師護甲，不耗法術位。\n沒穿護甲時，基礎 AC 變成 13 + 敏捷調整值。" },
    { id: "eldritch-mind", label: "魔能意志", description: "維持專注的體質豁免具有優勢（擲兩次取高），法術更不容易被打斷。" },
    { id: "fiendish-vigor", label: "邪魔活力", description: "隨時可施展虛假生命，不耗法術位，臨時生命值視為擲滿。" },
    { id: "lessons-of-the-first-ones", label: "原初之一教習", description: "獲得 1 個起源專長。可重複選這項，但每次要選不同專長。", extra: { type: "originFeat" } },
    { id: "mask-of-many-faces", label: "千面之臉", description: "隨時可施展易容術，不耗法術位。" },
    { id: "misty-visions", label: "幻象迷蹤", description: "隨時可施展無聲幻影，不耗法術位。" },
    { id: "otherworldly-leap", label: "超凡跳躍", description: "隨時可施展跳躍術，不耗法術位。" },
    { id: "pact-of-the-blade", label: "刃之魔契", description: "召喚一把近戰武器並自動熟練，攻擊與傷害可改用魅力。\n適合想拿武器近戰的契術師。" },
    { id: "pact-of-the-chain", label: "鏈之魔契", description: "學會獲得魔寵，施放不耗法術位。\n魔寵聽你指揮，你攻擊時也能讓牠代打一次。" },
    { id: "pact-of-the-tome", label: "書之魔契", description: "得到一本影之書，多會 3 個戲法和 2 個儀式法術，任一職業都能選。\n下方法術區會多一組欄位。", extra: { type: "tomeSpells", cantrips: 3, rituals: 2 } }
  ];

  // 快速創角的種族卡片說明、血統短評與完成摘要（DRAGONBORN_SUMMARY、TIEFLING_SUMMARY、raceCompletionLines）是快速創角自己的介紹文字，
  // 以種族 ID 與草稿的血統值為 key；種族的名稱、選項、法術與規則取自種族內容檔（見 raceRules）。回歸測試確認涵蓋全部種族與血統。
  const RACE_CARD_DESCRIPTIONS = {
    dragonborn: "中型。可用吐息攻擊，並抗一種傷害（減半）；黑暗中可視物；5 級起可短暫飛行。",
    dwarf: "中型。毒素傷害減半、HP 較高；黑暗中可視物（120 呎）；可感知石地上的震動。",
    elf: "中型。黑暗中可視物；不易被魅惑；多 1 項技能熟練；傳承帶來魔法；長休只要 4 小時。",
    gnome: "小型。黑暗中可視物；智力、感知、魅力豁免有優勢；血統帶來戲法。",
    goliath: "中型。速度 35 呎（較快）；可選一種巨人能力；5 級起可變成大型。",
    halfling: "小型。D20 擲出 1 可重擲；不易恐慌；能穿過比你大的生物，也能躲在其身後。",
    human: "中型或小型。多 1 項技能熟練和 1 個起源專長；長休後可獲得重擲機會。",
    orc: "中型。黑暗中可視物（120 呎）；可短暫加速並得到臨時 HP；HP 歸零時可改留 1 點。",
    tiefling: "中型或小型。黑暗中可視物；邪魔遺贈決定一種傷害抗性（減半）和魔法。"
  };
  const RACE_LINEAGE_DESCRIPTIONS = {
    "木精靈血統": "身手矯健，熟悉自然。速度增為 35 呎；學會德魯伊伎倆，3 級大步奔行、5 級行動無蹤。",
    "高等精靈血統": "優雅高貴，天生具奧術天賦。自選 1 個法師戲法，3 級偵測魔法、5 級迷蹤步。",
    "卓爾血統": "又稱黑暗精靈，多居地底。黑暗視覺增為 120 呎；學會舞光術，3 級妖火、5 級黑暗術。",
    "森林侏儒": "與森林生靈淵源深厚。學會次級幻影；始終準備動物交談，可免費施展 {熟練加值} 次，長休恢復。",
    "岩石侏儒": "以巧思機關聞名。學會修復術和魔法伎倆；花 10 分鐘可做出微型發條裝置。",
    "深淵血統": "源自混亂扭曲的異界。毒素傷害減半；學會毒氣噴濺，3 級致病射線、5 級人類定身術。",
    "冥界血統": "與陰鬱的死亡之境相關。黯蝕傷害減半；學會凍寒之觸，3 級虛假生命、5 級衰弱射線。",
    "煉獄血統": "重視秩序與契約的地獄勢力。火焰傷害減半；學會火焰箭，3 級煉獄叱喝、5 級黑暗術。"
  };
  function raceLineageNote(value) {
    return (RACE_LINEAGE_DESCRIPTIONS[value] || "").replace("{熟練加值}", quickBuildProficiencyBonus());
  }
  // 種族內容檔有身高，但建置產物只留體型名稱；這裡是快速創角下拉的說明文字。
  const RACE_SIZE_HEIGHTS = {
    human: { 中型: "約 4-7 呎高", 小型: "約 2-4 呎高" },
    tiefling: { 中型: "約 4-7 呎高", 小型: "約 3-4 呎高" }
  };
  const RACE_SIZE_NOTE = "兩者主要差在身高，照你想像中的角色選就好；移動速度和能背多重都一樣。";
  const KNOWN_PROFICIENCY_NOTE = "標示「已熟練」的技能你已經會了（例如來自背景），再選也不會更強，建議換別的。";
  // 起源專長（專長內容檔 type: origin）的一句話介紹，回歸測試確認涵蓋全部起源專長。
  const ORIGIN_FEAT_BLURBS = {
    警覺: "戰鬥時更容易搶先行動，也能和隊友交換順序。",
    兇蠻打手: "每回合 1 次，武器傷害可擲兩次，選你要的結果。",
    強韌體魄: "HP 上限增加「角色等級 × 2」（1 級時 +2）。",
    醫療兵: "可用醫療包替 5 呎內的人恢復 HP；恢復骰擲出 1 可重擲。",
    魔法學徒: "學 2 個戲法和 1 個一環法術，任何職業都能施展；下方會請你選。",
    熟習: "多 3 項技能或工具熟練，任意組合；下方會請你選。"
  };
  function backgroundFeatBlurb(feat) {
    if (feat?.spellList) return `學 2 個${CLASS_LABELS[feat.spellList]}戲法和 1 個一環法術，任何職業都能施展。`;
    return ORIGIN_FEAT_BLURBS[feat?.id] || "";
  }
  const BACKGROUND_TOOL_COPY = {
    賭具: {
      lead: "你的角色平常愛玩哪種賭具？冒險時不一定用得上，但能看出角色的個性。不管選哪一種，規則效果都一樣。",
      note: "真的遇上賭局時，你也比較能看出誰在作弊。"
    }
  };
  const DRAGONBORN_SUMMARY = {
    "黑龍-酸": { ancestry: "黑龍", damage: "強酸" },
    "藍龍-電": { ancestry: "藍龍", damage: "閃電" },
    "黃銅龍-火": { ancestry: "黃銅龍", damage: "火焰" },
    "青銅龍-電": { ancestry: "青銅龍", damage: "閃電" },
    "赤銅龍-酸": { ancestry: "赤銅龍", damage: "強酸" },
    "金龍-火": { ancestry: "金龍", damage: "火焰" },
    "綠龍-毒": { ancestry: "綠龍", damage: "毒素" },
    "紅龍-火": { ancestry: "紅龍", damage: "火焰" },
    "銀龍-冰": { ancestry: "銀龍", damage: "冷凍" },
    "白龍-冰": { ancestry: "白龍", damage: "冷凍" }
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
        shop: null,
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
  let shopCartFunding = shopFundingSignature(draft);
  let previouslyFocused = null;
  let spellDetailTrigger = null;
  let spellDetailOpenedOutsideWizard = false;
  let spellPrepareDecisionResolver = null;
  let spellbookWriteAction = null;
  let pageLock = null;
  const expandedChoiceGroups = new Set();
  let pendingChoiceCardScrollGroup = null;

  function reconcileDraft(target) {
    normalizeDraft(target);
    reconcileBackgroundDraft(target);
    reconcileRaceDraft(target);
    reconcileClassDraft(target);
    reconcileEquipmentDraft(target);
    reconcileShopDraft(target);
    reconcileLevelOneDraft(target);
    return normalizeDraft(target);
  }

  function saveDraft() {
    const previousShopItems = shopItems();
    reconcileDraft(draft);
    // 只有這次被歸零的已購品項才退回購物清單。
    syncShopCartFunding(draft.choices.shop ? [] : normalizeShopItems(previousShopItems) || []);
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

  // 內建背景的規則與顯示文字（background-content.generated.js，經 character-rules.js 讀取）；快速創角不含自訂背景。
  function presetBackground(key) {
    const rules = key === "custom" ? null : window.getBackgroundRules?.(key);
    return rules ? { rules, text: window.getBackgroundText(key) } : null;
  }
  function backgroundName(key) { return presetBackground(key)?.rules.name; }
  function backgroundAbilityLabels(key) { return (presetBackground(key)?.rules.abilities || []).map(id => ABILITY_LABELS[id]); }
  // 背景魔法學徒的法術列表（職業 ID）；沒有時為 undefined。
  function backgroundSpellList(key) { return presetBackground(key)?.rules.feat.spellList; }
  // 背景工具熟練為「從工具組擇一」時的可選工具；固定工具或沒有背景時為 null。
  function backgroundToolChoices(key) {
    const groupId = presetBackground(key)?.rules.tool.chooseFrom;
    if (!groupId) return null;
    return [...((TOOL_CATALOG_AVAILABLE && TOOL_CATALOG.groups?.find(group => group.id === groupId)?.options) || [])];
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

    // 尚無專用配置的背景沿用同職業既有的合法 27 購點，再依可調整屬性與職業關鍵屬性安排 +2/+1。
    const fallback = buildPresets?.acolyte || Object.values(buildPresets || {})[0];
    const background = presetBackground(backgroundKey);
    if (!fallback || !background) return null;
    const abilities = abilityMapFromArray(fallback[0]);
    const keyAbilities = new Set((CLASS_BUILD_DEFINITIONS[target.choices?.class]?.keyAbilities || []).map(label => ABILITY_KEYS_BY_LABEL[label]));
    const allowed = [...background.rules.abilities]
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
    if (raceRules(raceId)?.spellcasting || humanMagicInitiate) {
      return { type: "race", id: raceId, label: raceName(raceId), fixedAbility: null };
    }
    const backgroundId = target.choices.background;
    if (backgroundSpellList(backgroundId)) {
      return { type: "background", id: backgroundId, label: backgroundName(backgroundId), fixedAbility: null };
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

  // 種族規則與顯示文字（race-content.generated.js，經 character-rules.js 讀取），順序同角色卡種族選單。
  function raceRules(key) { return window.getRaceRules?.(key) || null; }
  function raceName(key) { return raceRules(key)?.name; }
  function raceIds() { return Object.keys(window.getAllRaceRules?.() || {}); }
  function raceData(key) { return window.getRaceText?.(key)?.html || null; }
  // 血統選項：草稿以 choice.draftField 欄位存 draftValue（例如 ancestry:「黑龍-酸」）。
  function raceChoiceDraftValues(key) { return (raceRules(key)?.choice?.options || []).map(option => option.draftValue); }
  function raceChoiceOption(key, options) {
    const choice = raceRules(key)?.choice;
    return choice ? choice.options.find(option => option.draftValue === options?.[choice.draftField]) || null : null;
  }
  // 選一項技能熟練的特質（例如精靈的敏銳感官；skillChoice 為 any 時是全部技能）。
  function raceSkillTrait(key) { return raceRules(key)?.traits.find(trait => trait.skillChoice) || null; }
  function raceSkillChoices(key) {
    const choice = raceSkillTrait(key)?.skillChoice;
    return choice === "any" ? SKILL_OPTIONS : choice || [];
  }
  // 草稿要記錄選項的種族：有血統、可選體型、技能或專長選擇。
  function raceHasDraftOptions(key) {
    const rules = raceRules(key);
    return Boolean(rules && (rules.choice || rules.sizes.length > 1 || rules.traits.some(trait => trait.skillChoice || trait.feat)));
  }

  // dataFile 隨草稿存檔（取得項目的 source），沿用舊檔名讓既有草稿內容不變；沒有程式讀取，也不參與綠背確認簽章。
  function raceSource(key) {
    return { type: "race", id: key, label: raceName(key), dataFile: "race.js" };
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
    if (!raceIds().includes(key) || !raceData(key)) {
      target.choices.race = null;
      target.choices.raceOptions = {};
      return target;
    }
    let options = isPlainObject(target.choices.raceOptions) ? target.choices.raceOptions : {};
    if (!raceHasDraftOptions(key)) {
      options = {};
      target.choices.raceOptions = options;
    }
    if (key === "human" && options.feat === "魔法學徒") {
      const savedFeatOptions = isPlainObject(options.featOptions) ? options.featOptions : {};
      const blockedSpellClass = backgroundSpellList(target.choices.background);
      const spellClass = MAGIC_INITIATE_SPELL_CLASSES.has(savedFeatOptions.spellClass) && savedFeatOptions.spellClass !== blockedSpellClass
        ? savedFeatOptions.spellClass
        : "";
      const cantrips = spellClass ? validSpellIds(SpellCatalog.getSpells(spellClass, "cantrips"), savedFeatOptions.cantrips, 2) : [];
      const levelOneSpells = spellClass ? validSpellIds(SpellCatalog.getSpells(spellClass, "1"), savedFeatOptions.levelOneSpells, 1) : [];
      const featOptions = { spellClass, cantrips, levelOneSpells };
      options = { ...options, featOptions };
      target.choices.raceOptions = options;
    }
    const lineageOption = raceChoiceOption(key, options);
    const cantripChoice = lineageOption?.cantripChoice;
    if (cantripChoice) {
      const validCantrip = canonicalSpell(options.cantrip)?.level === 0 && SpellCatalog.getSpells(cantripChoice.spellList, "cantrips").some(spell => spell.spellId === options.cantrip);
      if (!validCantrip) options = { ...options, cantrip: "" };
      target.choices.raceOptions = options;
    }
    const source = raceSource(key);
    target.selections.race = { id: key, label: raceName(key), source, content: { text: raceData(key), options: structuredClone(options), pendingChoices: racePendingChoices(key, options, target) } };

    if (raceSkillChoices(key).includes(options.skill)) {
      addDerivedAcquisition(target, "skills", { id: `race:${key}:skill:${options.skill}`, name: options.skill, sourceType: "race", sourceId: key, source: { ...source, feature: raceSkillTrait(key).name }, content: { proficiency: "skill" } });
    }
    if (key === "human" && humanOriginFeatValues().includes(options.feat)) {
      addDerivedAcquisition(target, "feats", { id: `race:human:feat:${options.feat}`, name: options.feat, sourceType: "race", sourceId: key, source: { ...source, feature: "靈活人才", dataFile: "feats.js" }, content: { type: "origin feat", description: window.getFeatText(options.feat).plain } });
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
    // 種族法術：血統法術、血統的自選戲法（來源記為血統的草稿值），再加種族特質的法術（來源記為特質名稱）。
    const spellLevel = spell => spell.ring === "cantrips" ? "cantrip" : spell.ring;
    (lineageOption?.spells || []).forEach(spell => addRaceSpell(target, key, spell.spellId, spellLevel(spell), spell.level, lineageOption.draftValue));
    if (cantripChoice && options.cantrip) addRaceSpell(target, key, options.cantrip, "cantrip", 1, lineageOption.draftValue);
    raceRules(key).spells.forEach(spell => addRaceSpell(target, key, spell.spellId, spellLevel(spell), spell.level, raceRules(key).traits.find(trait => trait.id === spell.trait).name));
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
    const background = presetBackground(key); const currency = { cp: 0, sp: 0, gp: 0, pp: 0 };
    if (!background) return { items: [], currency };
    const equipment = method === "gold" ? background.rules.equipment.B : background.rules.equipment.A;
    currency.gp = equipment.gold;
    // 「擇一工具」項目換成已選的工具；未選時保留顯示文字（例如「賭具擇一」）。
    const items = method === "gold" ? [] : background.text.equipmentAItems.map((item, index) => equipment.items[index]?.toolChoice && backgroundToolChoices(key)?.includes(toolChoice) ? toolChoice : item);
    return { items, currency };
  }
  function displayList(value) { return plainText(value).replace(/[，,]/gu, "、"); }
  // dataFile 隨草稿存檔（取得項目的 source），沿用舊檔名讓既有草稿內容不變；沒有程式讀取，也不參與綠背確認簽章。
  function backgroundSource(key) { return { type: "background", id: key, label: backgroundName(key), dataFile: "backgrounds.js" }; }
  function spellSourceForBackground(key) { return backgroundSpellList(key); }

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
    const advice = group.type === "spells"
      ? "這個法術你已經會了，建議改學別的；不改也能繼續。"
      : "同一項熟練重複取得也只算一次，建議回前面改選；不改也能繼續。";
    return `${group.name}（${sources.join("／")}）：${advice}`;
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
    // 背景固定工具與職業固定工具相同（例如罪犯與盜賊的盜賊工具）時，不列為重複。
    const backgroundTool = presetBackground(draft.choices.background)?.rules.tool.fixed;
    const fixedToolOverlap = backgroundTool && (CLASS_BUILD_DEFINITIONS[draft.choices.class]?.fixedTools || []).includes(backgroundTool);
    return crossSourceDuplicateGroups(draft, "skills")
      .concat(crossSourceDuplicateGroups(draft, "spells"))
      .concat(crossSourceDuplicateGroups(draft, "tools").filter(group => !(
        fixedToolOverlap && group.name === backgroundTool &&
        group.items.every(item =>
          (item.sourceType === "background" && item.sourceId === draft.choices.background) ||
          (item.sourceType === "class" && item.sourceId === draft.choices.class && item.content?.fixed)
        )
      )));
  }

  function duplicateReviewWarning() {
    const duplicates = duplicateWarningsForReview();
    return duplicates.length
      ? `<div class="quick-build-warning quick-build-duplicate-warning"><strong>有重複的選擇</strong><br>${duplicates.map(group => escapeHtml(duplicateGroupText(group))).join("<br>")}</div>`
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

  function spellOptionsForBackground(key, level) { return SpellCatalog.getSpells(spellSourceForBackground(key), level); }
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
    const background = BACKGROUND_ORDER.includes(key) ? presetBackground(key) : null;
    if (!background) {
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
    const skills = [...background.rules.skills];
    const abilities = backgroundAbilityLabels(key);
    target.choices.backgroundAbilities = abilities;
    target.choices.backgroundAbilityBonuses = normalizeBackgroundBonuses(target.choices.backgroundAbilityBonuses, abilities);
    const toolChoices = backgroundToolChoices(key);
    if (!toolChoices) target.choices.backgroundToolChoice = null;
    const backgroundTool = toolChoices ? (toolChoices.includes(target.choices.backgroundToolChoice) ? target.choices.backgroundToolChoice : null) : background.rules.tool.fixed;
    // 專長名稱（例如「魔法學徒（牧師）」）與裝備原文會存進草稿的取得項目，須與既有草稿逐字相同。
    const featName = background.text.feat;
    target.selections.background = {
      id: key, label: background.rules.name, source,
      content: { skills, feat: featName, tool: backgroundTool, adjustableAbilities: abilities, abilityBonuses: structuredClone(target.choices.backgroundAbilityBonuses) }
    };
    skills.forEach(name => addDerivedAcquisition(target, "skills", {
      id: `background:${key}:skill:${name}`, name, sourceType: "background", sourceId: key, source, content: { proficiency: "skill" }
    }));
    addDerivedAcquisition(target, "feats", {
      id: `background:${key}:feat`, name: featName, sourceType: "background", sourceId: key, source, content: { type: "origin feat" }
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
        id: `${key}:${method}`, label: method === "default" ? "初始裝備" : "50 金幣自購",
        source, content: { method, items, currency, raw: method === "default" ? background.text.equipmentA : background.text.equipmentB }
      };
      if (items.length) addDerivedAcquisition(target, "equipment", {
        id: `background:${key}:${method}`, name: items.join("、"), sourceType: "background", sourceId: key, source, content: { items, currency }
      });
    } else {
      target.choices.backgroundWealth = null;
      target.choices.backgroundCurrency = { cp: 0, sp: 0, gp: 0, pp: 0 };
    }

    if (!backgroundSpellList(key)) {
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
    if (typeOptions.length && !options.classType) pendingChoices.push(CLASS_TYPE_COPY[key]?.name || "職業類型");
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

  // 武器資料（equipment-data.js）的 [武器名稱, 精通]；簡易與軍用武器分開。
  function weaponMasteryCatalog() {
    const list = name => (Array.isArray(globalThis[name]) ? globalThis[name] : []);
    return {
      simple: [...list("weapons_simple_melee"), ...list("weapons_simple_ranged")],
      martial: [...list("weapons_martial_melee"), ...list("weapons_martial_ranged")]
    };
  }

  // 職業可選精通的武器：有武器精通選擇（內容檔 picks）時，取職業熟練的武器（proficiencies.weapons）。
  function allWeaponMasteryOptionsForClass(key) {
    if (!LEVEL_ONE_DEFINITIONS[key]?.weaponMastery) return [];
    const proficiencies = window.getClassProficiencies?.(key)?.weapons || {};
    const categories = proficiencies.categories || [];
    const { simple, martial } = weaponMasteryCatalog();
    const hasProperty = weapon => (proficiencies.martialWithProperty || [])
      .some(property => [weapon.屬性1, weapon.屬性2, weapon.屬性3, weapon.屬性4].some(value => value?.includes(property)));
    return [
      ...(categories.includes("simple") ? simple : []),
      ...martial.filter(weapon => categories.includes("martial") || hasProperty(weapon))
    ].map(weapon => [weapon.名稱, weapon.精通]);
  }

  function levelOneSpellOptions(classId, level) { return SpellCatalog.getSpells(classId, level); }
  function allSpellOptions(level, predicate = null) {
    return SpellCatalog.getAllSpells().filter(spell => spell.level === (level === "cantrips" ? 0 : Number(level)) && SpellCatalog.getClassIds(spell.spellId).length && (!predicate || predicate(spell))).sort((a, b) => a.nameZh.localeCompare(b.nameZh, "zh-Hant"));
  }
  // 魔能祈喚的內文與可選等級取自契術師內容檔的附錄（class-features-ui.js 的 eldritchInvocations）。
  function getEldritchInvocation(label) {
    return (typeof eldritchInvocations === "undefined" ? [] : eldritchInvocations).find(item => item.name === label) || null;
  }
  function levelOneInvocationOptions() {
    return ELDRITCH_INVOCATION_OPTIONS.filter(option => {
      const invocation = getEldritchInvocation(option.label);
      return Boolean(invocation) && !(invocation.minWarlockLevel > 1);
    });
  }
  function isRitualSpell(spell) { return Boolean(spell) && SpellCatalog.isRitual(spell); }
  function knownSpellSources(target, excludedFeatures = "") {
    const excluded = [].concat(excludedFeatures);
    const map = new Map();
    (target.acquisitions.spells || []).forEach(item => {
      if (excluded.includes(item.source?.feature) || !acquisitionAppliesAtLevel(item) || !item.spellId) return;
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

  // 第 3 種起是職業額外語言（內容檔 picks 的 language，依序對應其存檔欄位，例如盜賊黑話的 language-extra-2）。
  function classLanguageSlotForDraft(target, index) {
    if (index < 2) return null;
    const slots = (window.getClassPicks?.(target.choices.class, QUICK_BUILD_LEVEL, { kind: "language" }) || [])
      .flatMap(({ feature, pick }) => pick.fields.map(field => ({ field, exclude: pick.exclude || [], featureName: feature.name })));
    return slots[index - 2] || null;
  }

  function languageOptionsForDraft(target, index = 0) {
    const classSlot = classLanguageSlotForDraft(target, index);
    if (classSlot) return LANGUAGE_OPTIONS.filter(option => !classSlot.exclude.includes(option.value));
    const options = [...BASE_LANGUAGE_OPTIONS];
    (raceRules(target.choices.race)?.languageOptions || []).forEach(value => options.push(RARE_LANGUAGE_OPTIONS.find(option => option.value === value)));
    return options.filter(Boolean);
  }

  function languageFieldIdForDraft(target, index) {
    const classSlot = classLanguageSlotForDraft(target, index);
    if (classSlot) return classSlot.field;
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
    const fightingStyles = fightingStyleFeatIds();
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
    const tomeCantripSlots = hasTome ? uniqueValidSlots(tome.cantrips, 3, spellId => canonicalSpell(spellId)?.level === 0 && SpellCatalog.getClassIds(spellId).length) : [];
    const tomeRitualSlots = hasTome ? uniqueValidSlots(tome.rituals, 2, spellId => canonicalSpell(spellId)?.level === 1 && isRitualSpell(canonicalSpell(spellId)) && SpellCatalog.getClassIds(spellId).length) : [];
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
    languageDetails.forEach(item => addDerivedAcquisition(target, "languages", { id: `level-one:${key}:language:${item.slot}:${item.value}`, name: item.label, sourceType: "level-one", sourceId: key, source: { ...source, feature: item.category === "class-extra" ? `${classLanguageSlotForDraft(target, item.slot)?.featureName || "職業"}：額外語言` : "初始語言" }, content: { type: "language", value: item.value, category: item.category, fieldId: item.fieldId, slot: item.slot } }));
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
    const definition = classEquipmentDefinition(target.choices.class);
    if (!definition) return null;
    return definition.defaults.find(option => option.id === target.choices.classEquipmentMethod) || null;
  }

  function classEquipmentInstrumentOptions(target) {
    if (!classEquipmentDefinition(target.choices.class)?.defaults.some(option => option.instrument)) return [];
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
    const definition = classEquipmentDefinition(key);
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
    const proficiencyTool = target.choices.classOptions?.tools?.[0] || null;
    const items = equipmentPackage.items.map(([name, quantity, extra]) => ({
      name: extra?.proficiencyTool && proficiencyTool ? proficiencyTool : name,
      quantity,
      ...(Number.isFinite(extra?.weight) ? { weight: extra.weight } : {})
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
    const toolChoices = backgroundToolChoices(draft.choices.background);
    if (toolChoices && !toolChoices.includes(draft.choices.backgroundToolChoice)) return false;
    return !backgroundSpellList(draft.choices.background) || backgroundSpellsComplete();
  }

  function racePendingChoices(key = draft.choices.race, options = draft.choices.raceOptions, target = draft) {
    if (!key) return ["種族"];
    const pending = [];
    const rules = raceRules(key);
    const choice = rules?.choice;
    const choiceMissing = choice && !raceChoiceDraftValues(key).includes(options[choice.draftField]);
    if (key === "dragonborn" && choiceMissing) pending.push(choice.quickBuildLabel);
    if (key === "elf") {
      if (choiceMissing) pending.push(choice.quickBuildLabel);
      if (!raceSkillChoices(key).includes(options.skill)) pending.push(`${raceSkillTrait(key).name}技能`);
      const cantripChoice = raceChoiceOption(key, options)?.cantripChoice;
      if (cantripChoice && !options.cantrip) pending.push(`${CLASS_LABELS[cantripChoice.spellList]}戲法`);
    }
    if (key === "gnome") {
      if (choiceMissing) pending.push(choice.quickBuildLabel);
    }
    if (key === "goliath") {
      if (choiceMissing) pending.push(choice.quickBuildLabel);
    }
    if (key === "human") {
      if (!rules.sizes.includes(options.size)) pending.push("體型");
      if (!SKILL_OPTIONS.includes(options.skill)) pending.push("技能熟練");
      if (!humanOriginFeatValues().includes(options.feat)) pending.push("起源專長");
      if ((target.acquisitions.feats || []).some(item => item.sourceType === "background" && item.name === options.feat)) pending.push("起源專長已由背景取得");
      const featOptions = isPlainObject(options.featOptions) ? options.featOptions : {};
      if (options.feat === "魔法學徒") {
        const blockedSpellClass = backgroundSpellList(target.choices.background);
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
      if (!rules.sizes.includes(options.size)) pending.push("體型");
      if (choiceMissing) pending.push(choice.quickBuildLabel);
    }
    return pending;
  }

  function raceComplete() {
    return racePendingChoices().filter(item => !item.includes("後續步驟選擇")).length === 0;
  }

  function spellSource() {
    return spellSourceForBackground(draft.choices.background);
  }

  function spellOptions(level) { return SpellCatalog.getSpells(spellSource(), level); }

  function selectedSpell(name, level) {
    return spellOptions(level).find(spell => spell.spellId === name) || null;
  }

  function ensureStyles() {
    if (document.getElementById("quick-build-wizard-styles")) return;
    const style = document.createElement("style");
    style.id = "quick-build-wizard-styles";
    style.textContent = `
      #quick-build-wizard {position:fixed;inset:0;z-index:10020;display:none;align-items:center;justify-content:center;width:100%;max-width:none;padding:max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));overflow:hidden;overscroll-behavior:contain;background:var(--qb-overlay)}
      #quick-build-wizard.open {display:flex}
      #quick-build-pact-tome {position:fixed;inset:0;z-index:10020;display:none;align-items:center;justify-content:center;width:100%;max-width:none;padding:16px;overflow:hidden;overscroll-behavior:contain;background:var(--qb-overlay)}
      #quick-build-pact-tome.open {display:flex}
      :where(html:not([data-ui-theme="warm"])) #quick-build-pact-tome .quick-build-pact-tome-shell {display:flex;flex-direction:column;width:680px;max-width:100%;max-height:calc(100dvh - 32px);overflow:hidden;border:1px solid var(--qb-border-strong);border-radius:16px;background:var(--qb-surface);color:var(--qb-text);box-shadow:var(--qb-shadow)}
      :where(html[data-ui-theme="warm"]) #quick-build-pact-tome .quick-build-pact-tome-shell {display:flex;flex-direction:column;width:680px;max-width:100%;max-height:calc(100dvh - 32px);overflow:hidden;border:1px solid var(--qb-border-strong);border-radius:var(--radius-md);background:var(--qb-surface);color:var(--qb-text);box-shadow:var(--qb-shadow)}
      #quick-build-pact-tome .quick-build-header {display:flex;flex:0 0 auto;gap:16px;align-items:flex-start;justify-content:space-between;padding:20px;border-bottom:1px solid var(--qb-border)}
      #quick-build-pact-tome .quick-build-header h2 {margin:0;color:var(--qb-text);font-size:1.35rem}:where(html:not([data-ui-theme="warm"])) #quick-build-pact-tome .quick-build-close {display:grid;flex:0 0 40px;place-items:center;width:40px;min-width:40px;height:40px;min-height:40px;margin:0;padding:0;border:0;border-radius:8px;background:transparent;color:var(--qb-text);font-size:1.25rem;cursor:pointer}:where(html[data-ui-theme="warm"]) #quick-build-pact-tome .quick-build-close {display:grid;flex:0 0 40px;place-items:center;width:40px;min-width:40px;height:40px;min-height:40px;margin:0;padding:0;border:0;border-radius:var(--radius-md);background:transparent;color:var(--qb-text);font-size:1.25rem;cursor:pointer}
      #quick-build-pact-tome .quick-build-pact-tome-body {padding:20px;overflow-x:hidden;overflow-y:auto}#quick-build-pact-tome .quick-build-pact-tome-body h3 {margin:0 0 8px;color:var(--qb-text)}
      #quick-build-pact-tome .quick-build-pact-tome-actions {display:flex;justify-content:flex-end;gap:12px;padding:16px 20px;border-top:1px solid var(--qb-border)}:where(html:not([data-ui-theme="warm"])) #quick-build-pact-tome .quick-build-pact-tome-actions button {min-height:42px;padding:8px 16px;border:1px solid var(--qb-border-strong);border-radius:8px;background:var(--qb-surface-elevated);color:var(--qb-text);cursor:pointer}:where(html[data-ui-theme="warm"]) #quick-build-pact-tome .quick-build-pact-tome-actions button {min-height:42px;padding:8px 16px;border:1px solid var(--qb-border-strong);border-radius:var(--radius-md);background:var(--qb-surface-elevated);color:var(--qb-text);cursor:pointer}:where(html:not([data-ui-theme="warm"])) #quick-build-pact-tome .quick-build-pact-tome-actions button.primary {border-color:var(--qb-accent);background:var(--qb-accent-hover);color:var(--on-accent)}:where(html[data-ui-theme="warm"]) #quick-build-pact-tome .quick-build-pact-tome-actions button.primary {border-color:var(--qb-accent);background:var(--qb-accent-hover);color:var(--on-accent)}#quick-build-pact-tome .quick-build-pact-tome-actions button:disabled {cursor:not-allowed;opacity:.55}
      :where(html:not([data-ui-theme="warm"])) #quick-build-wizard .quick-build-shell {display:flex;flex-direction:column;width:100%;max-width:700px;height:min(900px,100%);min-height:0;overflow:hidden;border:1px solid var(--qb-border-strong);border-radius:16px;background:var(--qb-surface);color:var(--qb-text);box-shadow:var(--qb-shadow)}
      :where(html[data-ui-theme="warm"]) #quick-build-wizard .quick-build-shell {display:flex;flex-direction:column;width:100%;max-width:700px;height:min(900px,100%);min-height:0;overflow:hidden;border:1px solid var(--qb-border-strong);border-radius:var(--radius-md);background:var(--qb-surface);color:var(--qb-text);box-shadow:var(--qb-shadow)}
      #quick-build-wizard .quick-build-header {display:flex;flex:0 0 auto;gap:16px;align-items:flex-start;justify-content:space-between;min-width:0;padding:20px 20px 12px;border-bottom:1px solid var(--qb-border)}
      #quick-build-wizard .quick-build-header>div {flex:1 1 auto;min-width:0}#quick-build-wizard .quick-build-title-row {display:flex;flex-wrap:nowrap;align-items:center;gap:8px}#quick-build-wizard .quick-build-header h2 {margin:0;color:var(--qb-text);font-size:1.35rem;line-height:1.3}:where(html:not([data-ui-theme="warm"])) #quick-build-wizard .quick-build-reset {display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;width:auto;min-width:0;min-height:24px;margin:0;padding:3px 8px;border:1px solid var(--qb-border-strong);border-radius:999px;background:var(--qb-surface-soft);color:var(--qb-text-muted);font-size:.72rem;font-weight:700;line-height:1;white-space:nowrap;cursor:pointer}:where(html[data-ui-theme="warm"]) #quick-build-wizard .quick-build-reset {display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;width:auto;min-width:0;min-height:24px;margin:0;padding:3px 8px;border:1px solid var(--qb-border-strong);border-radius:var(--radius-md);background:var(--qb-surface-soft);color:var(--qb-text-muted);font-size:.72rem;font-weight:700;line-height:1;white-space:nowrap;cursor:pointer}:where(html:not([data-ui-theme="warm"])) #quick-build-wizard .quick-build-reset:hover,
:where(html:not([data-ui-theme="warm"])) #quick-build-wizard .quick-build-reset:focus-visible {border-color:var(--qb-danger);color:var(--qb-danger-text);outline:2px solid transparent}:where(html[data-ui-theme="warm"]) #quick-build-wizard .quick-build-reset:hover,
:where(html[data-ui-theme="warm"]) #quick-build-wizard .quick-build-reset:focus-visible {border-color:var(--qb-danger);color:var(--qb-danger-text);outline:2px solid var(--focus-ring);outline-offset:2px}
      #quick-build-wizard .quick-build-progress {margin:5px 0 0;color:var(--qb-text-muted);font-size:.9rem;line-height:1.45}
      :where(html:not([data-ui-theme="warm"])) #quick-build-wizard button.quick-build-close {display:grid;flex:0 0 40px;place-items:center;width:40px;min-width:40px;height:40px;min-height:40px;margin:0;padding:0;border:0;border-radius:8px;background:transparent;color:var(--qb-text);font-size:1.25rem;line-height:1;box-shadow:none;cursor:pointer}
      :where(html[data-ui-theme="warm"]) #quick-build-wizard button.quick-build-close {display:grid;flex:0 0 40px;place-items:center;width:40px;min-width:40px;height:40px;min-height:40px;margin:0;padding:0;border:0;border-radius:var(--radius-md);background:transparent;color:var(--qb-text);font-size:1.25rem;line-height:1;box-shadow:none;cursor:pointer}
      #quick-build-wizard .quick-build-body {flex:1 1 auto;min-height:0;scrollbar-gutter:stable;padding:24px 20px;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain}#quick-build-wizard .quick-build-body h3 {margin:0 0 8px;color:var(--qb-text)}
      #quick-build-wizard .quick-build-lead {margin:0 0 18px;color:var(--qb-text-muted)}.quick-build-background-grid {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.quick-build-class-grid {display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.quick-build-background-grid.is-choice-collapsed,.quick-build-class-grid.is-choice-collapsed {grid-template-columns:1fr}
      :where(html:not([data-ui-theme="warm"])) #quick-build-wizard .quick-build-card {width:100%;min-height:0;padding:16px;border:1px solid var(--qb-border);border-radius:12px;background:var(--qb-surface-elevated);color:var(--qb-text);text-align:left;cursor:pointer;transition:border-color .18s ease,background-color .18s ease,box-shadow .18s ease,opacity .18s ease}
      :where(html[data-ui-theme="warm"]) #quick-build-wizard .quick-build-card {width:100%;min-height:0;padding:16px;border:1px solid var(--qb-border);border-radius:var(--radius-md);background:var(--qb-surface-elevated);color:var(--qb-text);text-align:left;cursor:pointer;transition:border-color 120ms ease,background-color 120ms ease,box-shadow 120ms ease,opacity 120ms ease}
      :where(html:not([data-ui-theme="warm"])) #quick-build-wizard .quick-build-card:hover,
:where(html:not([data-ui-theme="warm"])) #quick-build-wizard .quick-build-card:focus-visible {border-color:var(--qb-accent);background:var(--qb-accent-soft);outline:2px solid transparent}
      :where(html[data-ui-theme="warm"]) #quick-build-wizard .quick-build-card:hover,
:where(html[data-ui-theme="warm"]) #quick-build-wizard .quick-build-card:focus-visible {border-color:var(--qb-accent);background:var(--qb-accent-soft);outline:2px solid var(--focus-ring);outline-offset:2px}.quick-build-card h4 {margin:0 0 10px;font-size:1.12rem;color:var(--qb-accent-text)}
      .quick-build-summary {display:grid;grid-template-columns:auto 1fr;gap:6px 10px;margin:0;font-size:.9rem;line-height:1.45}.quick-build-summary dt {color:var(--qb-text-muted)}.quick-build-summary dd {margin:0;color:var(--qb-text-body)}:where(html:not([data-ui-theme="warm"])) .quick-build-expansion-tag {display:inline-flex;align-items:center;min-height:24px;margin-left:8px;padding:2px 8px;border:1px solid var(--qb-border-strong);border-radius:999px;color:var(--qb-text-muted);font-size:.7rem;vertical-align:middle}:where(html[data-ui-theme="warm"]) .quick-build-expansion-tag {display:inline-flex;align-items:center;min-height:24px;margin-left:8px;padding:2px 8px;border:1px solid var(--qb-border-strong);border-radius:var(--radius-md);color:var(--qb-text-muted);font-size:.7rem;vertical-align:middle}.quick-build-card-toggle-hint {display:block;margin-top:12px;color:var(--qb-accent-text);font-size:.78rem;font-weight:700}
      :where(html:not([data-ui-theme="warm"])) .quick-build-choice-panel {padding:18px;border:1px solid var(--qb-border);border-radius:12px;background:var(--qb-surface-soft)}
      :where(html[data-ui-theme="warm"]) .quick-build-choice-panel {padding:18px;border:1px solid var(--qb-border);border-radius:var(--radius-md);background:var(--qb-surface-soft)}.quick-build-review-panel+ .quick-build-review-panel {margin-top:14px}.quick-build-review-panel>h4 {margin:0 0 14px;color:var(--qb-text)}:where(html:not([data-ui-theme="warm"])) .quick-build-equipment-list {margin:12px 0 20px;padding:14px;border-radius:8px;background:var(--qb-surface-muted);line-height:1.7;color:var(--qb-text-body)}:where(html[data-ui-theme="warm"]) .quick-build-equipment-list {margin:12px 0 20px;padding:14px;border-radius:var(--radius-md);background:var(--qb-surface-muted);line-height:1.7;color:var(--qb-text-body)}.quick-build-equipment-help {margin:12px 0 0;color:var(--qb-accent-text);font-size:.92rem;font-weight:800}.quick-build-equipment-help .skill-tip {color:inherit}.quick-build-equipment-help .skill-tip:hover,.quick-build-equipment-help .skill-tip:focus-visible {color:var(--qb-accent);text-decoration-thickness:2px}:where(html:not([data-ui-theme="warm"])) .quick-build-equipment-help .skill-tip:focus-visible {outline:2px solid var(--qb-accent);outline-offset:3px;border-radius:3px}:where(html[data-ui-theme="warm"]) .quick-build-equipment-help .skill-tip:focus-visible {outline:2px solid var(--qb-accent);outline-offset:3px;border-radius:var(--radius-md)}
      .quick-build-race-options {display:grid;gap:16px}.quick-build-option-note {margin:6px 0 0;color:var(--qb-text-muted);font-size:.9rem}:where(html:not([data-ui-theme="warm"])) .quick-build-ancestry-detail {margin:0;padding:14px;border:1px solid var(--qb-border);border-radius:9px;background:var(--qb-surface-muted);color:var(--qb-text-body);line-height:1.65}:where(html[data-ui-theme="warm"]) .quick-build-ancestry-detail {margin:0;padding:14px;border:1px solid var(--qb-border);border-radius:var(--radius-md);background:var(--qb-surface-muted);color:var(--qb-text-body);line-height:1.65}.quick-build-ancestry-detail strong {display:block;margin-bottom:5px;color:var(--qb-accent-text)}:where(html:not([data-ui-theme="warm"])) .quick-build-warning {margin:14px 0;padding:12px;border-left:4px solid var(--qb-warning-border);border-radius:7px;background:var(--qb-warning-bg);color:var(--qb-warning-text)}:where(html[data-ui-theme="warm"]) .quick-build-warning {margin:14px 0;padding:12px;border-left:4px solid var(--qb-warning-border);border-radius:var(--radius-md);background:var(--qb-warning-bg);color:var(--qb-warning-text)}:where(html:not([data-ui-theme="warm"])) .quick-build-pending {margin-top:14px;padding:12px;border-radius:7px;background:var(--qb-pending-bg);color:var(--qb-pending-text)}:where(html[data-ui-theme="warm"]) .quick-build-pending {margin-top:14px;padding:12px;border-radius:var(--radius-md);background:var(--qb-pending-bg);color:var(--qb-pending-text)}
      .quick-build-choice-actions {display:grid;grid-template-columns:1fr 1fr;gap:12px}:where(html:not([data-ui-theme="warm"])) .quick-build-choice-actions button {min-height:48px;padding:10px;border:1px solid var(--qb-border-strong);border-radius:8px;background:var(--qb-surface-elevated);color:var(--qb-text);cursor:pointer}:where(html[data-ui-theme="warm"]) .quick-build-choice-actions button {min-height:48px;padding:10px;border:1px solid var(--qb-border-strong);border-radius:var(--radius-md);background:var(--qb-surface-elevated);color:var(--qb-text);cursor:pointer}:where(html:not([data-ui-theme="warm"])) .quick-build-choice-actions button.primary {border-color:var(--qb-accent);background:var(--qb-accent-hover);color:var(--on-accent)}:where(html[data-ui-theme="warm"]) .quick-build-choice-actions button.primary {border-color:var(--qb-accent);background:var(--qb-accent-hover);color:var(--on-accent)}.quick-build-choice-actions .quick-build-choice-action-full {grid-column:1/-1}
      .quick-build-shop-actions {margin-top:16px}#quick-build-wizard .quick-build-shop-open {display:flex;align-items:center;justify-content:center;gap:8px;font-weight:700}#quick-build-wizard .quick-build-shop-open svg {flex:0 0 auto}
      .quick-build-spell-layout {display:grid;gap:16px}
      .quick-build-spell-fields {display:flex;flex-direction:column;gap:14px}.quick-build-field label {display:block;margin-bottom:6px;color:var(--qb-text-muted)}.quick-build-field-control {display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}:where(html:not([data-ui-theme="warm"])) .quick-build-field select {width:100%;min-height:44px;padding:8px;border:1px solid var(--qb-border-strong);border-radius:7px;background:var(--qb-input);color:var(--qb-text)}:where(html[data-ui-theme="warm"]) .quick-build-field select {width:100%;min-height:44px;padding:8px;border:1px solid var(--qb-border-strong);border-radius:var(--radius-md);background:var(--qb-input);color:var(--qb-text)}:where(html:not([data-ui-theme="warm"])) .quick-build-spell-view,
:where(html:not([data-ui-theme="warm"])) .quick-build-skill-info {min-width:64px;margin:0;padding:8px 12px;border:1px solid var(--qb-border-strong);border-radius:7px;background:var(--qb-surface-elevated);color:var(--qb-text);cursor:pointer}:where(html[data-ui-theme="warm"]) .quick-build-spell-view,
:where(html[data-ui-theme="warm"]) .quick-build-skill-info {min-width:64px;margin:0;padding:8px 12px;border:1px solid var(--qb-border-strong);border-radius:var(--radius-md);background:var(--qb-surface-elevated);color:var(--qb-text);cursor:pointer}.quick-build-skill-info {font-size:.88rem;font-weight:700;text-decoration:none}:where(html:not([data-ui-theme="warm"])) .quick-build-skill-info:hover,
:where(html:not([data-ui-theme="warm"])) .quick-build-skill-info:focus-visible {border-color:var(--qb-accent);background:var(--qb-accent-soft);outline:2px solid transparent}:where(html[data-ui-theme="warm"]) .quick-build-skill-info:hover,
:where(html[data-ui-theme="warm"]) .quick-build-skill-info:focus-visible {border-color:var(--qb-accent);background:var(--qb-accent-soft);outline:2px solid var(--focus-ring);outline-offset:2px}.quick-build-spell-view:disabled,.quick-build-skill-info:disabled {color:var(--qb-disabled-text);cursor:not-allowed;opacity:.65}
      #quick-build-wizard option.quick-build-known-option {color:var(--qb-text-muted)}
      #quick-build-spell-detail {position:fixed;inset:0;z-index:10030;display:none;align-items:center;justify-content:center;width:100%;max-width:none;padding:32px;overflow:hidden;overscroll-behavior:contain;background:var(--qb-overlay-nested)}
      #quick-build-spell-detail.open {display:flex}:where(html:not([data-ui-theme="warm"])) #quick-build-spell-detail .quick-build-spell-detail-shell {display:flex;flex-direction:column;width:680px;max-width:calc(100% - 32px);max-height:calc(100dvh - 80px);overflow:hidden;border:1px solid var(--qb-border-strong);border-radius:14px;background:var(--qb-surface);color:var(--qb-text);box-shadow:var(--qb-shadow)}:where(html[data-ui-theme="warm"]) #quick-build-spell-detail .quick-build-spell-detail-shell {display:flex;flex-direction:column;width:680px;max-width:calc(100% - 32px);max-height:calc(100dvh - 80px);overflow:hidden;border:1px solid var(--qb-border-strong);border-radius:var(--radius-md);background:var(--qb-surface);color:var(--qb-text);box-shadow:var(--qb-shadow)}
      #quick-build-spell-detail .quick-build-spell-detail-header {display:flex;flex:0 0 auto;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px;border-bottom:1px solid var(--qb-border)}#quick-build-spell-detail-title {margin:0;color:var(--qb-text);font-size:1.2rem}
      :where(html:not([data-ui-theme="warm"])) #quick-build-spell-detail .quick-build-spell-detail-close {display:grid;flex:0 0 44px;place-items:center;width:44px;min-width:44px;height:44px;min-height:44px;margin:0;padding:0;border:1px solid transparent;border-radius:9px;background:var(--qb-surface-elevated);color:var(--qb-text);font-size:1.5rem;line-height:1;cursor:pointer;touch-action:manipulation}
      :where(html[data-ui-theme="warm"]) #quick-build-spell-detail .quick-build-spell-detail-close {display:grid;flex:0 0 44px;place-items:center;width:44px;min-width:44px;height:44px;min-height:44px;margin:0;padding:0;border:1px solid transparent;border-radius:var(--radius-md);background:var(--qb-surface-elevated);color:var(--qb-text);font-size:1.5rem;line-height:1;cursor:pointer;touch-action:manipulation}:where(html:not([data-ui-theme="warm"])) #quick-build-spell-detail .quick-build-spell-detail-close:hover,
:where(html:not([data-ui-theme="warm"])) #quick-build-spell-detail .quick-build-spell-detail-close:focus-visible {border-color:var(--qb-accent);background:var(--qb-accent-soft);outline:2px solid transparent}:where(html[data-ui-theme="warm"]) #quick-build-spell-detail .quick-build-spell-detail-close:hover,
:where(html[data-ui-theme="warm"]) #quick-build-spell-detail .quick-build-spell-detail-close:focus-visible {border-color:var(--qb-accent);background:var(--qb-accent-soft);outline:2px solid var(--focus-ring);outline-offset:2px}
      #quick-build-spell-detail-content {min-height:0;flex:1 1 auto;padding:20px;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;white-space:pre-wrap;color:var(--qb-text-body);line-height:1.65}#quick-build-spell-detail-content strong {display:block;margin-bottom:12px;color:var(--qb-accent-text);font-size:1.08rem}      #quick-build-spell-detail .quick-build-spell-prepare {display:flex;flex:0 0 auto;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px;border-top:1px solid var(--qb-border);background:var(--qb-surface-soft)}#quick-build-spell-detail .quick-build-spell-prepare[hidden] {display:none}#quick-build-spell-prepare-question {margin:0;color:var(--qb-text);font-weight:700;line-height:1.45}.quick-build-spell-prepare-actions {display:flex;flex:0 0 auto;gap:10px}:where(html:not([data-ui-theme="warm"])) .quick-build-spell-prepare-actions button {min-height:44px;margin:0;padding:8px 14px;border:1px solid var(--qb-border-strong);border-radius:8px;background:var(--qb-surface-elevated);color:var(--qb-text);font-weight:700;cursor:pointer}:where(html[data-ui-theme="warm"]) .quick-build-spell-prepare-actions button {min-height:44px;margin:0;padding:8px 14px;border:1px solid var(--qb-border-strong);border-radius:var(--radius-md);background:var(--qb-surface-elevated);color:var(--qb-text);font-weight:700;cursor:pointer}:where(html:not([data-ui-theme="warm"])) .quick-build-spell-prepare-actions button:hover,
:where(html:not([data-ui-theme="warm"])) .quick-build-spell-prepare-actions button:focus-visible {border-color:var(--qb-accent);background:var(--qb-accent-soft);outline:2px solid transparent}:where(html[data-ui-theme="warm"]) .quick-build-spell-prepare-actions button:hover,
:where(html[data-ui-theme="warm"]) .quick-build-spell-prepare-actions button:focus-visible {border-color:var(--qb-accent);background:var(--qb-accent-soft);outline:2px solid var(--focus-ring);outline-offset:2px}:where(html:not([data-ui-theme="warm"])) .quick-build-spell-prepare-actions button:active {box-shadow:inset 0 2px 5px color-mix(in srgb,var(--qb-text) 18%,transparent)}:where(html[data-ui-theme="warm"]) .quick-build-spell-prepare-actions button:active {box-shadow:none;translate:1px 1px}:where(html:not([data-ui-theme="warm"])) .quick-build-spell-prepare-actions .quick-build-spell-prepare-confirm {border-color:var(--qb-accent);background:var(--qb-accent-hover);color:var(--on-accent)}:where(html[data-ui-theme="warm"]) .quick-build-spell-prepare-actions .quick-build-spell-prepare-confirm {border-color:var(--qb-accent);background:var(--qb-accent-hover);color:var(--on-accent)}:where(html:not([data-ui-theme="warm"])) .quick-build-spell-prepare-actions .quick-build-spell-prepare-confirm:hover,
:where(html:not([data-ui-theme="warm"])) .quick-build-spell-prepare-actions .quick-build-spell-prepare-confirm:focus-visible {background:var(--qb-accent);color:var(--on-accent)}:where(html[data-ui-theme="warm"]) .quick-build-spell-prepare-actions .quick-build-spell-prepare-confirm:hover,
:where(html[data-ui-theme="warm"]) .quick-build-spell-prepare-actions .quick-build-spell-prepare-confirm:focus-visible {background:var(--action-hover);color:var(--on-accent)}
      #quick-build-spell-detail .quick-build-spell-prepare.has-spellbook-action {flex-wrap:wrap}
      .has-spellbook-action .quick-build-spell-prepare-actions {margin-left:auto}
      .quick-build-spell-prepare-actions button[hidden] {display:none}
      .quick-build-spell-prepare-actions .quick-build-spell-prepare-confirm,
      .quick-build-spell-prepare-actions .quick-build-spellbook-write {white-space:nowrap}
      .quick-build-spell-prepare-actions .quick-build-spellbook-write:disabled {opacity:.55;cursor:not-allowed;background:var(--qb-surface-elevated);border-color:var(--qb-border-strong);color:var(--qb-text);translate:none;box-shadow:none}
      @media(max-width:620px) {.has-spellbook-action .quick-build-spellbook-write {grid-column:1 / -1}}
      .quick-build-ability-heading {display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:0 0 16px}.quick-build-ability-heading h3 {margin:0!important}.quick-build-ability-status {display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}:where(html:not([data-ui-theme="warm"])) .quick-build-status-pill {padding:6px 10px;border:1px solid var(--qb-border);border-radius:999px;background:var(--qb-surface-soft);color:var(--qb-text-muted);font-size:.82rem;line-height:1.2}:where(html[data-ui-theme="warm"]) .quick-build-status-pill {padding:6px 10px;border:1px solid var(--qb-border);border-radius:var(--radius-md);background:var(--qb-surface-soft);color:var(--qb-text-muted);font-size:.82rem;line-height:1.2}.quick-build-status-pill strong {color:var(--qb-text)}.quick-build-status-pill.is-complete {border-color:var(--qb-success-border);background:var(--qb-success-bg);color:var(--qb-success-text)}.quick-build-ability-grid {display:grid;gap:12px;padding:14px}:where(html:not([data-ui-theme="warm"])) .quick-build-ability-row {display:grid;grid-template-columns:minmax(92px,.7fr) minmax(0,2fr) minmax(74px,.55fr);gap:16px;align-items:center;padding:14px 16px;border:1px solid var(--qb-border);border-radius:10px;background:var(--qb-surface-muted)}:where(html[data-ui-theme="warm"]) .quick-build-ability-row {display:grid;grid-template-columns:minmax(92px,.7fr) minmax(0,2fr) minmax(74px,.55fr);gap:16px;align-items:center;padding:14px 16px;border:1px solid var(--qb-border);border-radius:var(--radius-md);background:var(--qb-surface-muted)}.quick-build-ability-name {display:flex;flex-direction:column;gap:3px}.quick-build-ability-name strong {font-size:1.05rem;color:var(--qb-text)}.quick-build-ability-name small {color:var(--qb-text-muted);font-size:.76rem}.quick-build-ability-controls {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.quick-build-ability-field {display:grid;gap:6px;min-width:0;color:var(--qb-text-muted);font-size:.82rem}:where(html:not([data-ui-theme="warm"])) .quick-build-ability-field select {width:100%;min-width:0;min-height:44px;margin:0;padding:8px 34px 8px 12px;border:1px solid var(--qb-border-strong);border-radius:8px;background:var(--qb-input);color:var(--qb-text);font:inherit;font-size:1rem}:where(html[data-ui-theme="warm"]) .quick-build-ability-field select {width:100%;min-width:0;min-height:44px;margin:0;padding:8px 34px 8px 12px;border:1px solid var(--qb-border-strong);border-radius:var(--radius-md);background:var(--qb-input);color:var(--qb-text);font:inherit;font-size:1rem}.quick-build-ability-field select:focus-visible {border-color:var(--qb-accent);outline:2px solid var(--qb-accent);outline-offset:1px}.quick-build-ability-field select:disabled {border-color:var(--qb-border);background:var(--qb-disabled);color:var(--qb-disabled-text);opacity:1}.quick-build-ability-total {display:grid;gap:2px;justify-items:end}.quick-build-ability-total span {color:var(--qb-text-muted);font-size:.75rem}.quick-build-ability-total strong {color:var(--qb-accent-text);font-size:1.45rem;line-height:1}.quick-build-ability-help {display:flex;flex-wrap:wrap;gap:6px 16px;margin:0 0 18px;color:var(--qb-text-muted);font-size:.88rem}.quick-build-ability-help strong {color:var(--qb-text-body)}:where(html:not([data-ui-theme="warm"])) .quick-build-complete {padding:18px;border-left:4px solid var(--qb-success-border);border-radius:8px;background:var(--qb-success-bg);color:var(--qb-success-text)}:where(html[data-ui-theme="warm"]) .quick-build-complete {padding:18px;border-left:4px solid var(--qb-success-border);border-radius:var(--radius-md);background:var(--qb-success-bg);color:var(--qb-success-text)}.quick-build-plan {margin:20px 0 0;padding-left:1.4rem;line-height:1.8;color:var(--qb-text-body)}.quick-build-plan li.current {color:var(--qb-accent-text);font-weight:700}
      .quick-build-card-note {display:block;margin-top:2px;color:var(--qb-text-muted);font-size:.84rem;line-height:1.45}.quick-build-card-detail {margin-top:12px}.quick-build-class-card p {white-space:pre-line}.quick-build-class-card p.quick-build-option-note {margin-top:8px;color:var(--qb-text-muted);font-size:.84rem;line-height:1.45}.quick-build-option-note {white-space:pre-line}.quick-build-choice-panel>h4 {margin:0 0 6px}.quick-build-choice-panel>h4+.quick-build-option-note {margin:0 0 12px}.quick-build-flow-section>h3+.quick-build-option-note,.quick-build-lead+.quick-build-option-note {margin:-10px 0 14px}.quick-build-total-head small,.quick-build-ability-total small {display:block;font-size:.72rem;font-weight:400;line-height:1.2}.quick-build-ability-total small {color:var(--qb-text-muted);text-align:center}.quick-build-lead+.quick-build-equipment-help {margin:-8px 0 14px}.quick-build-fixed-tool {align-items:center;margin-top:8px}.quick-build-fixed-tool .quick-build-fixed-list {margin:0}.quick-build-subheading {margin:4px 0 0;color:var(--qb-text-muted);font-size:.9rem;font-weight:700}.quick-build-feature-list {display:grid;gap:12px}.quick-build-feature-row .quick-build-option-note {margin-top:2px}.quick-build-feature-row strong {color:var(--qb-text)}
      #quick-build-wizard .quick-build-item-link {display:inline;width:auto;min-width:0;min-height:0;margin:0;padding:0;border:0;background:none;box-shadow:none;color:var(--qb-accent-text);font:inherit;text-decoration:underline;text-underline-offset:2px;cursor:pointer}#quick-build-wizard .quick-build-item-link:focus-visible {outline:2px solid var(--qb-accent);outline-offset:2px}
      #quick-build-spell-detail-content.is-rich-text {white-space:normal}#quick-build-spell-detail-content.is-rich-text strong {display:inline;margin:0;color:inherit;font-size:inherit}#quick-build-spell-detail-content.is-rich-text h3 {margin:0 0 10px;color:var(--qb-text);font-size:1.08rem}#quick-build-spell-detail-content.is-rich-text h4 {margin:14px 0 6px;color:var(--qb-text)}#quick-build-spell-detail-content.is-rich-text p {margin:0 0 10px}#quick-build-spell-detail-content.is-rich-text ul {margin:0 0 10px;padding-inline-start:1.3em}
      .quick-build-ability-table-head,.quick-build-ability-row {display:grid;grid-template-columns:72px minmax(0,1fr) minmax(0,1fr) 56px;align-items:center;gap:6px}.quick-build-ability-table-head {padding:4px 10px;color:var(--qb-text-muted);font-size:.8rem;font-weight:700;text-align:center}.quick-build-ability-table-head span:first-child {text-align:left}.quick-build-ability-grid {gap:6px}.quick-build-ability-row {padding:8px 10px;background:var(--qb-surface-elevated)}.quick-build-ability-row.is-bonus-locked {background:var(--qb-surface-muted)}.quick-build-ability-control {display:flex;align-items:center;justify-content:center;gap:6px}:where(html:not([data-ui-theme="warm"])) .quick-build-ability-step {display:inline-flex;align-items:center;justify-content:center;width:34px;min-width:34px;height:34px;min-height:34px;margin:0;padding:0;border:1px solid var(--qb-border-strong);border-radius:999px;background:var(--qb-surface-elevated);color:var(--qb-text);font-size:1rem;font-weight:900;line-height:1;cursor:pointer}:where(html[data-ui-theme="warm"]) .quick-build-ability-step {display:inline-flex;align-items:center;justify-content:center;width:34px;min-width:34px;height:34px;min-height:34px;margin:0;padding:0;border:1px solid var(--qb-border-strong);border-radius:var(--radius-md);background:var(--qb-surface-elevated);color:var(--qb-text);font-size:1rem;font-weight:900;line-height:1;cursor:pointer}.quick-build-ability-step:disabled {cursor:not-allowed;opacity:.4}.quick-build-ability-value {min-width:28px;color:var(--qb-text);font-weight:700;text-align:center}.quick-build-ability-value.is-bonus {color:var(--qb-accent-text)}.quick-build-ability-total {display:block;text-align:center}.quick-build-ability-total strong {font-size:1.15rem}
      .quick-build-class-card {min-height:128px!important}.quick-build-class-card p {margin:0;color:var(--qb-text-body);line-height:1.55}.quick-build-substep-actions {display:flex;justify-content:space-between;gap:12px;margin-top:18px}:where(html:not([data-ui-theme="warm"])) .quick-build-substep-actions button {min-height:46px;padding:9px 16px;border:1px solid var(--qb-border-strong);border-radius:8px;background:var(--qb-surface-elevated);color:var(--qb-text);cursor:pointer}:where(html[data-ui-theme="warm"]) .quick-build-substep-actions button {min-height:46px;padding:9px 16px;border:1px solid var(--qb-border-strong);border-radius:var(--radius-md);background:var(--qb-surface-elevated);color:var(--qb-text);cursor:pointer}:where(html:not([data-ui-theme="warm"])) .quick-build-substep-actions button.primary {border-color:var(--qb-accent);background:var(--qb-accent-hover);color:var(--on-accent)}:where(html[data-ui-theme="warm"]) .quick-build-substep-actions button.primary {border-color:var(--qb-accent);background:var(--qb-accent-hover);color:var(--on-accent)}.quick-build-substep-actions button:disabled {cursor:not-allowed;opacity:.55}.quick-build-proficiency-grid {display:grid;gap:14px}:where(html:not([data-ui-theme="warm"])) .quick-build-fixed-list {margin:12px 0 0;padding:12px;border-radius:8px;background:var(--qb-surface-muted);color:var(--qb-text-body);line-height:1.6}:where(html[data-ui-theme="warm"]) .quick-build-fixed-list {margin:12px 0 0;padding:12px;border-radius:var(--radius-md);background:var(--qb-surface-muted);color:var(--qb-text-body);line-height:1.6}.quick-build-summary-list {display:grid;grid-template-columns:auto 1fr;gap:8px 14px;margin:0}.quick-build-summary-list dt {color:var(--qb-text-muted)}.quick-build-summary-list dd {margin:0;color:var(--qb-text)}.quick-build-ability-summary {display:grid;gap:6px}.quick-build-ability-summary-row {display:flex;flex-wrap:wrap;gap:6px 10px;align-items:baseline}.quick-build-ability-summary-row>span {white-space:nowrap}.quick-build-ability-summary.wrap-all .quick-build-ability-summary-row {display:grid;grid-template-columns:1fr;gap:2px}.quick-build-ability-summary.wrap-all .quick-build-ability-modifier {padding-inline-start:1em}.quick-build-ability-modifier {font-weight:800;color:var(--qb-accent-text)}.quick-build-ability-modifier-sign {color:var(--qb-warning-text)}.quick-build-ability-modifier-value {color:var(--qb-accent)}.quick-build-complete .quick-build-summary-list dt,.quick-build-complete .quick-build-summary-list dd {color:var(--qb-success-text)}.quick-build-source-warning {margin-top:10px;color:var(--qb-warning-text);font-size:.9rem}
      #quick-build-wizard .quick-build-body.is-review {background:var(--qb-success-bg)}
      #quick-build-wizard .quick-build-flow-section {padding:0 0 24px}#quick-build-wizard .quick-build-flow-section.is-newly-revealed {animation:quick-build-flow-in .34s cubic-bezier(.22,1,.36,1) both}#quick-build-wizard .quick-build-flow-section+ .quick-build-flow-section {padding-top:24px;border-top:1px solid var(--qb-border)}
      :where(html:not([data-ui-theme="warm"])) #quick-build-wizard .quick-build-validation-message {display:flex;align-items:center;gap:8px;margin:0 0 12px;padding:10px 12px;border-left:3px solid var(--qb-warning-border);border-radius:7px;background:var(--qb-warning-bg);color:var(--qb-warning-text);font-size:.9rem;font-weight:700;line-height:1.45}
      :where(html[data-ui-theme="warm"]) #quick-build-wizard .quick-build-validation-message {display:flex;align-items:center;gap:8px;margin:0 0 12px;padding:10px 12px;border-left:3px solid var(--qb-warning-border);border-radius:var(--radius-md);background:var(--qb-warning-bg);color:var(--qb-warning-text);font-size:.9rem;font-weight:700;line-height:1.45}:where(html:not([data-ui-theme="warm"])) #quick-build-wizard .quick-build-validation-message::before {content:"!";display:grid;flex:0 0 22px;place-items:center;width:22px;height:22px;border:1px solid var(--qb-warning-border);border-radius:999px;color:var(--qb-warning-text);font-size:.8rem;font-weight:900}:where(html[data-ui-theme="warm"]) #quick-build-wizard .quick-build-validation-message::before {content:"!";display:grid;flex:0 0 22px;place-items:center;width:22px;height:22px;border:1px solid var(--qb-warning-border);border-radius:var(--radius-md);color:var(--qb-warning-text);font-size:.8rem;font-weight:900}
      #quick-build-wizard .quick-build-needs-attention {position:relative;border-color:var(--qb-warning-border)!important;background:var(--qb-warning-bg)!important;box-shadow:0 0 0 3px color-mix(in srgb,var(--qb-warning-border) 24%,transparent);animation:quick-build-attention .48s cubic-bezier(.22,1,.36,1)}
      :where(html:not([data-ui-theme="warm"])) #quick-build-wizard .quick-build-card.is-selected {border-color:var(--qb-accent);background:var(--qb-accent-soft);box-shadow:inset 0 0 0 2px var(--qb-accent),0 2px 6px color-mix(in srgb,var(--qb-accent) 16%,transparent)}
      :where(html[data-ui-theme="warm"]) #quick-build-wizard .quick-build-card.is-selected {border-color:var(--qb-accent);background:var(--qb-accent-soft);box-shadow:inset 3px 0 0 var(--qb-accent)}#quick-build-wizard .quick-build-card.is-choice-hidden {display:none}
      #quick-build-wizard .quick-build-duplicate-warning {border-left-color:var(--qb-danger);background:color-mix(in srgb,var(--qb-danger) 14%,var(--qb-surface));color:var(--qb-danger-text)}
      #quick-build-wizard .quick-build-footer {display:grid;grid-template-columns:repeat(3,minmax(0,1fr));flex:0 0 auto;align-items:center;gap:12px;padding:16px 20px;border-top:1px solid var(--qb-border)}#quick-build-wizard .quick-build-footer[hidden] {display:none}
      :where(html:not([data-ui-theme="warm"])) #quick-build-wizard .quick-build-footer button {width:100%;min-width:0;min-height:50px;padding:10px clamp(10px,2vw,20px);border:1px solid var(--qb-border-strong);border-radius:8px;background:var(--qb-surface-elevated);color:var(--qb-text);font-size:clamp(.95rem,2.4vw,1.05rem);font-weight:700;cursor:pointer;transition:border-color .18s ease,background-color .18s ease,color .18s ease,box-shadow .18s ease,transform .18s ease}
      :where(html[data-ui-theme="warm"]) #quick-build-wizard .quick-build-footer button {width:100%;min-width:0;min-height:50px;padding:10px clamp(10px,2vw,20px);border:1px solid var(--qb-border-strong);border-radius:var(--radius-md);background:var(--qb-surface-elevated);color:var(--qb-text);font-size:clamp(.95rem,2.4vw,1.05rem);font-weight:700;cursor:pointer;transition:border-color 120ms ease,background-color 120ms ease,color 120ms ease,box-shadow 120ms ease,transform 120ms ease}:where(html:not([data-ui-theme="warm"])) #quick-build-wizard .quick-build-footer button.primary {border-color:var(--qb-accent);background:var(--qb-accent-hover);color:var(--on-accent);box-shadow:0 0 0 3px var(--qb-accent-soft)}:where(html[data-ui-theme="warm"]) #quick-build-wizard .quick-build-footer button.primary {border-color:var(--qb-accent);background:var(--qb-accent-hover);color:var(--on-accent);box-shadow:var(--shadow-control)}#quick-build-wizard .quick-build-footer button.is-incomplete {box-shadow:none}:where(html:not([data-ui-theme="warm"])) #quick-build-wizard .quick-build-footer button.is-incomplete:hover,
:where(html:not([data-ui-theme="warm"])) #quick-build-wizard .quick-build-footer button.is-incomplete:focus-visible {box-shadow:0 0 0 3px var(--qb-accent-soft)}:where(html[data-ui-theme="warm"]) #quick-build-wizard .quick-build-footer button.is-incomplete:hover,
:where(html[data-ui-theme="warm"]) #quick-build-wizard .quick-build-footer button.is-incomplete:focus-visible {box-shadow:var(--shadow-control)}:where(html:not([data-ui-theme="warm"])) #quick-build-wizard .quick-build-footer button.is-ready {animation:quick-build-next-ready .52s cubic-bezier(.22,1,.36,1)}:where(html[data-ui-theme="warm"]) #quick-build-wizard .quick-build-footer button.is-ready {animation:none}#quick-build-wizard .quick-build-footer button:disabled {cursor:not-allowed;opacity:.55;box-shadow:none}
      :where(html[data-ui-theme="warm"]) #quick-build-wizard .quick-build-footer button:not(:disabled):active {box-shadow:none;translate:1px 1px}
      #quick-build-wizard .quick-build-previous {grid-column:1}#quick-build-wizard .quick-build-modify {grid-column:2;border-color:var(--qb-accent);color:var(--qb-accent-text);font-weight:800}#quick-build-wizard .quick-build-next {grid-column:3}
      #quick-build-wizard .quick-build-review-footer {grid-template-columns:repeat(2,minmax(0,1fr))}
      .quick-build-summary-list .quick-build-summary-full-label {grid-column:1/-1}.quick-build-summary-list .quick-build-summary-full-value {grid-column:1/-1;padding-inline-start:1em;text-align:left}.quick-build-review-panel .quick-build-source-groups {white-space:pre-line}
      :where(html:not([data-ui-theme="warm"])) #quick-build-wizard .quick-build-equipment-actions button.is-selected {border-color:var(--qb-accent);background:var(--qb-accent-hover);color:var(--on-accent);box-shadow:inset 0 0 0 1px var(--qb-accent)}
      :where(html[data-ui-theme="warm"]) #quick-build-wizard .quick-build-equipment-actions button.is-selected {border-color:var(--qb-accent);background:var(--qb-accent-hover);color:var(--on-accent);box-shadow:inset 0 0 0 1px var(--qb-accent)}
      @keyframes quick-build-flow-in {from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:translateY(0)}}@keyframes quick-build-next-ready {0%{transform:scale(.96);box-shadow:0 0 0 0 var(--qb-accent-soft)}55%{transform:scale(1.04);box-shadow:0 0 0 7px var(--qb-accent-soft)}100%{transform:scale(1);box-shadow:0 0 0 3px var(--qb-accent-soft)}}@keyframes quick-build-attention {0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--qb-warning-border) 0%,transparent)}55%{box-shadow:0 0 0 7px color-mix(in srgb,var(--qb-warning-border) 28%,transparent)}100%{box-shadow:0 0 0 3px color-mix(in srgb,var(--qb-warning-border) 24%,transparent)}}
      @media(max-width:760px) {.quick-build-class-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:620px) {.quick-build-ability-grid{padding:8px}.quick-build-ability-table-head,.quick-build-ability-row{grid-template-columns:58px minmax(88px,1fr) minmax(88px,1fr) 44px;gap:2px;padding-right:5px;padding-left:5px}.quick-build-ability-step{width:30px;min-width:30px;height:30px;min-height:30px}.quick-build-ability-control{gap:2px}.quick-build-ability-value{min-width:22px}#quick-build-wizard .quick-build-body{padding:20px 16px}.quick-build-ability-heading{display:grid;gap:12px}.quick-build-ability-status{justify-content:flex-start}.quick-build-background-grid,.quick-build-class-grid{grid-template-columns:1fr}.quick-build-choice-actions{grid-template-columns:1fr}.quick-build-substep-actions:not(.quick-build-inline-actions){display:grid;grid-template-columns:1fr}.quick-build-substep-actions button{width:100%}.quick-build-inline-actions button{flex:1 1 0;width:auto;min-width:0}#quick-build-wizard .quick-build-footer{gap:8px;padding:12px}#quick-build-wizard .quick-build-footer button{min-height:48px;padding-right:8px;padding-left:8px}#quick-build-spell-detail{padding:16px}#quick-build-spell-detail .quick-build-spell-detail-shell{max-width:100%;max-height:calc(100dvh - 32px)}#quick-build-spell-detail-content{padding:18px 16px}#quick-build-spell-detail .quick-build-spell-prepare{align-items:stretch;flex-direction:column;padding:14px 16px}.quick-build-spell-prepare-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:100%}.quick-build-spell-prepare-actions button{width:100%;padding-right:8px;padding-left:8px}}
      @media(max-width:380px) {#quick-build-wizard .quick-build-header{padding:14px 12px 10px}#quick-build-wizard .quick-build-body{padding:16px 10px}.quick-build-choice-panel.quick-build-ability-grid{padding:4px}.quick-build-ability-table-head,.quick-build-ability-row{grid-template-columns:44px minmax(70px,1fr) minmax(70px,1fr) 36px;gap:2px;padding:5px 4px}.quick-build-ability-step{width:26px;min-width:26px;height:28px;min-height:28px;font-size:.88rem}.quick-build-ability-value{min-width:18px;font-size:.9rem}.quick-build-ability-name strong{font-size:.92rem}.quick-build-ability-name small{font-size:.65rem}.quick-build-ability-table-head{font-size:.72rem}#quick-build-wizard .quick-build-footer{gap:6px;padding:10px 8px}#quick-build-wizard .quick-build-footer button{padding-right:4px;padding-left:4px;font-size:.9rem}}
      @media(prefers-reduced-motion:reduce) {#quick-build-wizard .quick-build-flow-section.is-newly-revealed,#quick-build-wizard .quick-build-footer button.is-ready,#quick-build-wizard .quick-build-needs-attention{animation:none}#quick-build-wizard .quick-build-footer button{transition:none}}
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
        <header class="quick-build-header"><div><div class="quick-build-title-row"><h2 id="quick-build-title">快速創角</h2><button type="button" class="quick-build-reset" aria-label="重置快速創角">重置</button></div><p class="quick-build-progress" aria-live="polite"></p></div><button type="button" class="quick-build-close" aria-label="關閉快速創角">✕</button></header>
        <main class="quick-build-body"></main>
        <footer class="quick-build-footer"><button type="button" class="quick-build-previous">上一步</button><button type="button" class="quick-build-modify" hidden>↑修改↑</button><button type="button" class="quick-build-next">下一步</button></footer>
        <footer class="quick-build-footer quick-build-review-footer" hidden><button type="button" data-review-return>返回修改</button><button type="button" class="primary" data-import-mobile-card>匯入角色卡</button></footer>
      </section>`;
    document.body.appendChild(modal);
    modal.querySelector(".quick-build-reset").addEventListener("click", discardDraft);
    modal.querySelector(".quick-build-close").addEventListener("click", closeWizard);
    modal.querySelector(".quick-build-previous").addEventListener("click", goPreviousStep);
    modal.querySelector(".quick-build-modify").addEventListener("click", editCurrentStep);
    modal.querySelector(".quick-build-next").addEventListener("click", goNextStep);
    modal.querySelector("[data-review-return]").addEventListener("click", () => {
      draft.ui = { ...draft.ui, currentStepId: "level-one", view: viewForStep("level-one") };
      saveDraft();
      render();
    });
    modal.querySelector("[data-import-mobile-card]").addEventListener("click", importDraftToMobileCard);
    modal.addEventListener("click", event => {
      if (event.target === modal) { closeWizard(); return; }
      const detailTrigger = event.target.closest?.("[data-equipment-detail]");
      if (detailTrigger && !detailTrigger.disabled) window.openEquipmentDetailDialog?.(detailTrigger.dataset.equipmentDetail, detailTrigger);
    });
    modal.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const tip = event.target.closest?.('.skill-tip[role="button"]');
      if (!tip) return;
      event.preventDefault();
      tip.click();
    });
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
      <section class="quick-build-spell-detail-shell" role="dialog" aria-modal="true" aria-labelledby="quick-build-spell-detail-title" aria-describedby="quick-build-spell-detail-content quick-build-spell-prepare-question">
        <header class="quick-build-spell-detail-header"><h2 id="quick-build-spell-detail-title">法術詳情</h2><button type="button" class="quick-build-spell-detail-close" aria-label="關閉法術詳情">×</button></header>
        <div id="quick-build-spell-detail-content" tabindex="0"></div>
        <footer class="quick-build-spell-prepare" hidden>
          <p id="quick-build-spell-prepare-question">是否準備這個法術？</p>
          <div class="quick-build-spell-prepare-actions">
            <button type="button" class="quick-build-spell-prepare-cancel">暫不準備</button>
            <button type="button" class="quick-build-spell-prepare-confirm">準備法術</button>
            <button type="button" class="quick-build-spellbook-write" hidden>寫入法術書</button>
          </div>
        </footer>
      </section>`;
    document.body.appendChild(modal);
    modal.querySelector(".quick-build-spell-detail-close").addEventListener("click", closeSpellDetail);
    modal.querySelector(".quick-build-spell-prepare-cancel").addEventListener("click", closeSpellDetail);
    modal.querySelector(".quick-build-spell-prepare-confirm").addEventListener("click", () => finishSpellPrepareDecision(true));
    modal.querySelector(".quick-build-spellbook-write").addEventListener("click", () => {
      if (spellbookWriteAction?.()) finishSpellPrepareDecision(false);
    });
    modal.addEventListener("click", event => { if (event.target === modal) closeSpellDetail(); });
    modal.addEventListener("keydown", trapSpellDetailKeyboard);
    return modal;
  }

  function renderBackgroundCards(body) {
    const wizardIntro = draft.choices.background ? "" : `<p class="quick-build-lead">${activeSteps(draft).length - 1} 步建立你的新角色。<br>進度自動保存，隨時可以離開；按下最後的「匯入」，創角才會完成。</p>`;
    const featDetail = draft.choices.background ? `<div class="quick-build-card-detail"><button type="button" class="quick-build-spell-view" data-background-feat-view>查看起源專長</button></div>` : "";
    body.innerHTML = `${wizardIntro}<h3>選擇背景</h3><p class="quick-build-lead">背景是角色在成為冒險者之前的身分，例如侍僧、士兵或賢者。</p><p class="quick-build-equipment-help">${infoTip("卡片上的項目是什麼？ ℹ️")}</p><div class="quick-build-background-grid">${BACKGROUND_ORDER.map(key => {
      const { rules, text } = presetBackground(key);
      const tool = text.toolGroup || rules.tool.fixed;
      const sourceLabel = window.getContentSourceLabel(window.getBackgroundSource(key));
      return `<button type="button" class="quick-build-card" data-background="${key}"><h4>${rules.name}${sourceLabel ? `<span class="quick-build-expansion-tag">${escapeHtml(sourceLabel)}</span>` : ""}</h4><dl class="quick-build-summary"><dt>技能熟練</dt><dd>${escapeHtml(rules.skills.join("、"))}</dd><dt>起源專長</dt><dd>${escapeHtml(text.feat)}<span class="quick-build-card-note">${escapeHtml(backgroundFeatBlurb(rules.feat))}</span></dd><dt>工具熟練</dt><dd>${escapeHtml(tool)}</dd><dt>可調整屬性</dt><dd>${escapeHtml(text.abilities)}</dd></dl></button>`;
    }).join("")}</div>${featDetail}`;
    body.querySelectorAll("[data-background]").forEach(card => card.addEventListener("click", () => handleChoiceCardSelection("background", card.dataset.background, chooseBackground)));
    body.querySelector("[data-background-feat-view]")?.addEventListener("click", event => {
      openFeatDetail({ feat: presetBackground(draft.choices.background)?.rules.feat.id }, event.currentTarget, "起源專長詳情");
    });
  }

  function renderBackgroundEquipment(body) {
    const key = draft.choices.background;
    const text = presetBackground(key)?.text || {};
    const gold = presetBackground(key)?.rules.equipment.B.gold;
    body.innerHTML = `<h3>${backgroundName(key)}：背景裝備</h3><p class="quick-build-lead">背景會附一套初始裝備，新手建議直接拿。</p><section class="quick-build-choice-panel"><strong>背景初始裝備</strong>${optionNote(EQUIPMENT_LIST_NOTE)}<div class="quick-build-equipment-list">${equipmentLinks(String(text.equipmentA || "").split("、"))}</div><div class="quick-build-choice-actions quick-build-equipment-actions"><button type="button" data-wealth="default">取得初始裝備</button><button type="button" data-wealth="gold">改拿 ${gold} 金幣，自己買</button></div></section>${conceptHelp("為什麼初始裝備要選兩次？ ℹ️")}`;
    body.querySelectorAll("[data-wealth]").forEach(button => button.addEventListener("click", () => chooseBackgroundWealth(button.dataset.wealth)));
  }

  function renderBackgroundToolChoice(body) {
    const selected = draft.choices.backgroundToolChoice || "";
    const key = draft.choices.background;
    const group = presetBackground(key)?.text.toolGroup || "";
    const copy = BACKGROUND_TOOL_COPY[group] || { lead: `選一種你的角色拿手的${group}。不管選哪一種，規則效果都一樣。` };
    body.innerHTML = `<h3>${backgroundName(key)}：選擇拿手的${group}</h3><p class="quick-build-lead">${escapeHtml(copy.lead)}</p><section class="quick-build-choice-panel"><div class="quick-build-field"><label for="quick-build-background-game-tool">${group}</label><select id="quick-build-background-game-tool"><option value="">請選擇</option>${(backgroundToolChoices(key) || []).map(name => `<option value="${escapeHtml(name)}"${name === selected ? " selected" : ""}>${escapeHtml(name)}</option>`).join("")}</select>${optionNote(copy.note)}</div></section>`;
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
    body.innerHTML = `<h3>${backgroundName(draft.choices.background)}：選擇法術</h3><p class="quick-build-lead">起源專長「${escapeHtml(presetBackground(draft.choices.background)?.rules.feat.id || "")}」讓你學會這些法術。</p>${optionNote("戲法：小型法術，想用幾次就用幾次。\n一環法術：效果較強，每次長休（休息 8 小時）後可以免費施放 1 次。\n施法要靠哪項屬性，會在步驟 3 決定；按「查看」可以看法術效果。")}<div class="quick-build-spell-layout"><div class="quick-build-spell-fields">${spellSelect("quick-build-cantrip-1", "戲法 1", cantrips, magic.cantrips[0], magic.cantrips[1])}${spellSelect("quick-build-cantrip-2", "戲法 2", cantrips, magic.cantrips[1], magic.cantrips[0])}${spellSelect("quick-build-level-one", "一環法術", levelOne, magic.levelOneSpells[0])}</div></div>`;
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
    const { rules, text } = presetBackground(draft.choices.background);
    const spells = draft.choices.backgroundMagic.cantrips
      .concat(draft.choices.backgroundMagic.levelOneSpells)
      .filter(Boolean);
    const skills = rules.skills
      .map(name => annotatedDuplicateName("skills", name, "background", "已熟練"));
    const toolName = rules.tool.chooseFrom ? draft.choices.backgroundToolChoice : rules.tool.fixed;
    const tool = toolName ? annotatedDuplicateName("tools", toolName, "background", "已熟練") : "無";
    const annotatedSpells = spells.map(spellId => annotatedDuplicateName("spells", spellId, "background", "已學會"));
    const classBonusWarning = draft.choices.classOptions?.backgroundBonusInvalidated ? `<div class="quick-build-warning"><strong>換了背景，背景加值要重新分配</strong><br>你分配好的 27 點屬性都還在，只有背景給的 3 點已經歸零。按「下一步」會帶你回到屬性頁重新分配。</div>` : "";
    body.innerHTML = `<h3>背景選擇完成</h3><div class="quick-build-complete"><strong>${rules.name}</strong><br>技能：${skills.map(escapeHtml).join("、")}<br>起源專長：${escapeHtml(text.feat)}<br>工具：${escapeHtml(tool)}<br>可調整屬性：${escapeHtml(backgroundAbilityLabels(draft.choices.background).join("、"))}${annotatedSpells.length ? `<br>法術：${annotatedSpells.map(escapeHtml).join("、")}` : ""}</div>${classBonusWarning}${duplicateReviewWarning()}`;
  }

  function raceSelect(field, label, values, { disabled = [], note = "", formatOption = raceOptionLabel } = {}) {
    const selected = draft.choices.raceOptions[field] || "";
    const options = field === "skill" ? orderedSkillOptions(values) : values;
    const selectId = `quick-build-race-${field}`;
    const select = `<select id="${selectId}" data-race-option="${field}"><option value="">請選擇</option>${options.map(value => {
      const sources = field === "skill" ? duplicateSourceLabels("skills", value, "race") : [];
      return `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}${sources.length ? ' class="quick-build-known-option"' : ""}>${escapeHtml(formatOption(value))}${sources.length ? `（${escapeHtml(sources.join("、"))}已熟練）` : ""}</option>`;
    }).join("")}</select>`;
    return `<div class="quick-build-field"><label for="${selectId}">${label}</label>${field === "skill" ? `<div class="quick-build-field-control">${select}${skillDescriptionButton(selected)}</div>` : select}${note ? `<p class="quick-build-option-note">${escapeHtml(note)}</p>` : ""}</div>`;
  }

  function raceSelectWithDetail(field, label, values, { showSpellView = false, formatOption = value => value, note = "" } = {}) {
    const selected = draft.choices.raceOptions[field] || "";
    return `<div class="quick-build-field"><label for="quick-build-race-${field}">${label}</label><div class="quick-build-field-control"><select id="quick-build-race-${field}" data-race-option="${field}"><option value="">請選擇</option>${values.map(value => `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(raceOptionLabel(formatOption(value)))}</option>`).join("")}</select>${showSpellView ? `<button type="button" class="quick-build-spell-view" data-race-spell-view="${field}"${selected ? "" : " disabled"}>查看</button>` : ""}</div>${optionNote(note)}</div>`;
  }

  function raceFeatSelect(label, values, { disabled = [], note = "" } = {}) {
    const selected = draft.choices.raceOptions.feat || "";
    const options = values.map(value => isPlainObject(value) ? value : { value, label: value });
    return `<div class="quick-build-field"><label for="quick-build-race-feat">${label}</label><div class="quick-build-field-control"><select id="quick-build-race-feat" data-race-option="feat"><option value="">請選擇</option>${options.map(option => `<option value="${escapeHtml(option.value)}"${option.value === selected ? " selected" : ""}${disabled.includes(option.value) ? " disabled" : ""}>${escapeHtml(option.label)}${disabled.includes(option.value) ? "（已由其他來源取得）" : ""}</option>`).join("")}</select><button type="button" class="quick-build-spell-view" data-race-feat-view${selected ? "" : " disabled"}>查看</button></div>${note ? `<p class="quick-build-option-note">${escapeHtml(note)}</p>` : ""}</div>`;
  }

  function renderRaceCards(body) {
    const raceDetail = draft.choices.race ? `<div class="quick-build-card-detail"><button type="button" class="quick-build-spell-view" data-race-detail-view>查看種族完整能力</button></div>` : "";
    body.innerHTML = `<h3>選擇種族</h3><p class="quick-build-lead">種族決定角色的外貌、體型、移動速度，以及與生俱來的特殊能力。</p><div class="quick-build-background-grid">${raceIds().map(key => `<button type="button" class="quick-build-card" data-race="${key}"><h4>${raceName(key)}</h4><p>${escapeHtml(RACE_CARD_DESCRIPTIONS[key])}</p></button>`).join("")}</div>${raceDetail}`;
    body.querySelectorAll("[data-race]").forEach(card => card.addEventListener("click", () => handleChoiceCardSelection("race", card.dataset.race, chooseRace)));
    body.querySelector("[data-race-detail-view]")?.addEventListener("click", event => {
      openFeatDetail({ html: raceData(draft.choices.race) }, event.currentTarget, `${raceName(draft.choices.race)}：完整能力`);
    });
  }

  function humanMagicSpellSelect(id, label, entries, value, excluded = "") {
    return spellSelect(id, label, entries, value, excluded).replace("data-spell-field", "data-human-magic-spell");
  }

  function renderHumanMagicFeatOptions() {
    const featOptions = isPlainObject(draft.choices.raceOptions.featOptions) ? draft.choices.raceOptions.featOptions : {};
    const spellClass = featOptions.spellClass || "";
    const blockedSpellClass = backgroundSpellList(draft.choices.background);
    const cantrips = MAGIC_INITIATE_SPELL_CLASSES.has(spellClass) ? SpellCatalog.getSpells(spellClass, "cantrips") : [];
    const levelOne = MAGIC_INITIATE_SPELL_CLASSES.has(spellClass) ? SpellCatalog.getSpells(spellClass, "1") : [];
    const selectedCantrips = Array.isArray(featOptions.cantrips) ? featOptions.cantrips : ["", ""];
    return `<section class="quick-build-choice-panel"><h4>魔法學徒選項</h4><p class="quick-build-option-note">選一個職業的法術列表，從中學 2 個戲法和 1 個一環法術。</p><div class="quick-build-spell-fields"><div class="quick-build-field"><label for="quick-build-human-spell-class">法術列表</label><select id="quick-build-human-spell-class" data-human-spell-class><option value="">請選擇</option><option value="cleric"${spellClass === "cleric" ? " selected" : ""}${blockedSpellClass === "cleric" ? " disabled" : ""}>牧師${blockedSpellClass === "cleric" ? "（背景已選）" : ""}</option><option value="druid"${spellClass === "druid" ? " selected" : ""}>德魯伊</option><option value="wizard"${spellClass === "wizard" ? " selected" : ""}${blockedSpellClass === "wizard" ? " disabled" : ""}>法師${blockedSpellClass === "wizard" ? "（背景已選）" : ""}</option></select></div>${humanMagicSpellSelect("quick-build-human-cantrip-1", "戲法 1", cantrips, selectedCantrips[0], selectedCantrips[1])}${humanMagicSpellSelect("quick-build-human-cantrip-2", "戲法 2", cantrips, selectedCantrips[1], selectedCantrips[0])}${humanMagicSpellSelect("quick-build-human-level-one", "一環法術", levelOne, featOptions.levelOneSpells?.[0] || "")}</div></section>`;
  }

  function mixedProficiencySelect(index, selected, excluded, acquiredSkills, acquiredTools) {
    const options = [`<option value="">請選擇</option>`, `<option disabled>--------- 技能 ---------</option>`]
      .concat(SKILL_OPTIONS.map(name => {
        const value = `skill:${name}`;
        const peerDuplicate = excluded.includes(value);
        const sources = duplicateSourceLabels("skills", name, "race");
        if (acquiredSkills.has(name)) sources.push(raceName(draft.choices.race) || "種族");
        return `<option value="skill:${escapeHtml(name)}"${selected === value ? " selected" : ""}${peerDuplicate ? " disabled" : ""}${sources.length && !peerDuplicate ? ' class="quick-build-known-option"' : ""}>技能：${escapeHtml(skillOptionLabel(name))}${peerDuplicate ? "（本頁已選）" : sources.length ? `（${escapeHtml(sources.join("、"))}已熟練）` : ""}</option>`;
      }))
      .concat(`<option disabled>--------- 工具 ---------</option>`)
      .concat(TOOL_OPTIONS.map(name => {
        const value = `tool:${name}`;
        const peerDuplicate = excluded.includes(value);
        const sources = duplicateSourceLabels("tools", name, "race");
        if (acquiredTools.has(name)) sources.push(raceName(draft.choices.race) || "種族");
        return `<option value="tool:${escapeHtml(name)}"${selected === value ? " selected" : ""}${peerDuplicate ? " disabled" : ""}${sources.length && !peerDuplicate ? ' class="quick-build-known-option"' : ""}>工具：${escapeHtml(name)}${peerDuplicate ? "（本頁已選）" : sources.length ? `（${escapeHtml(sources.join("、"))}已熟練）` : ""}</option>`;
      }))
      .concat(`<option disabled>--------- 賭具與樂器 ---------</option>`)
      .concat(GAME_TOOL_OPTIONS.concat(INSTRUMENT_TOOL_OPTIONS).map(name => {
        const value = `tool:${name}`;
        const peerDuplicate = excluded.includes(value);
        const sources = duplicateSourceLabels("tools", name, "race");
        if (acquiredTools.has(name)) sources.push(raceName(draft.choices.race) || "種族");
        return `<option value="tool:${escapeHtml(name)}"${selected === value ? " selected" : ""}${peerDuplicate ? " disabled" : ""}${sources.length && !peerDuplicate ? ' class="quick-build-known-option"' : ""}>工具：${escapeHtml(name)}${peerDuplicate ? "（本頁已選）" : sources.length ? `（${escapeHtml(sources.join("、"))}已熟練）` : ""}</option>`;
      }));
    const selectId = `quick-build-human-skilled-${index}`;
    const selectedValue = String(selected || "");
    const selectedSkill = selectedValue.startsWith("skill:") ? selectedValue.slice("skill:".length) : "";
    const selectedTool = selectedValue.startsWith("tool:") ? selectedValue.slice("tool:".length) : "";
    const detailButton = selectedSkill ? skillDescriptionButton(selectedSkill) : equipmentDetailButton(selectedTool, "請先選擇項目，再查看說明");
    return `<div class="quick-build-field"><label for="${selectId}">熟練項目 ${index + 1}</label><div class="quick-build-field-control"><select id="${selectId}" data-human-skilled>${options.join("")}</select>${detailButton}</div></div>`;
  }

  function renderHumanSkilledFeatOptions() {
    const featOptions = isPlainObject(draft.choices.raceOptions.featOptions) ? draft.choices.raceOptions.featOptions : {};
    const selected = Array.isArray(featOptions.proficiencies) ? featOptions.proficiencies.slice(0, 3) : [];
    while (selected.length < 3) selected.push("");
    const acquiredSkills = new Set((draft.acquisitions.skills || []).filter(item => item.source?.feature !== "靈活人才：熟習").map(item => item.name));
    const acquiredTools = new Set((draft.acquisitions.tools || []).filter(item => item.source?.feature !== "靈活人才：熟習").map(item => item.name));
    return `<section class="quick-build-choice-panel"><h4>熟習選項</h4><p class="quick-build-option-note">選 3 項不同的技能或工具。標示「已熟練」的你已經會了，再選也不會更強。</p><div class="quick-build-race-options">${selected.map((value, index) => mixedProficiencySelect(index, value, selected.filter((_, other) => other !== index), acquiredSkills, acquiredTools)).join("")}</div></section>`;
  }

  function renderRaceOptions(body) {
    const key = draft.choices.race;
    const options = draft.choices.raceOptions;
    const backgroundSkills = (draft.acquisitions.skills || []).filter(item => item.sourceType === "background").map(item => item.name);
    const backgroundFeats = (draft.acquisitions.feats || []).filter(item => item.sourceType === "background").map(item => item.name);
    const originFeats = humanOriginFeatOptions();
    const fields = [];
    const rules = raceRules(key);
    const choice = rules?.choice;
    const choiceSelect = (selectOptions = {}) => raceSelect(choice.draftField, choice.quickBuildLabel, raceChoiceDraftValues(key), selectOptions);
    const sizeSelectOptions = { note: RACE_SIZE_NOTE, formatOption: value => `${value}（${RACE_SIZE_HEIGHTS[key]?.[value] || ""}）` };
    if (key === "dragonborn") {
      const ancestry = DRAGONBORN_SUMMARY[options.ancestry];
      fields.push(choiceSelect({
        formatOption: value => `${DRAGONBORN_SUMMARY[value]?.ancestry || value}（${DRAGONBORN_SUMMARY[value]?.damage || ""}）`,
        note: `血統決定你吐息的傷害種類，受到同種傷害時也只會承受一半。元素相同的龍，規則效果完全一樣，挑喜歡的顏色就好。${ancestry ? `\n吐息造成${ancestry.damage}傷害；受到${ancestry.damage}傷害時減半。` : ""}`
      }));
    }
    if (key === "elf") {
      fields.push(choiceSelect({ note: raceLineageNote(options.lineage) }));
      fields.push(raceSelect("skill", `${raceSkillTrait(key).name}：多熟練 1 項技能`, raceSkillChoices(key), { disabled: backgroundSkills, note: KNOWN_PROFICIENCY_NOTE }));
      const cantripChoice = raceChoiceOption(key, options)?.cantripChoice;
      if (cantripChoice) fields.push(raceSelectWithDetail("cantrip", `${raceChoiceOption(key, options)?.label}：自選 1 個${CLASS_LABELS[cantripChoice.spellList]}戲法`, SpellCatalog.getSpells(cantripChoice.spellList, "cantrips").map(spell => spell.spellId), { showSpellView: true, formatOption: spellNameZh, note: `戲法是小型法術，想用幾次就用幾次。每次長休後，可以換成別的${CLASS_LABELS[cantripChoice.spellList]}戲法。` }));
    }
    if (key === "gnome") {
      fields.push(choiceSelect({ note: raceLineageNote(options.lineage) }));
    }
    if (key === "goliath") fields.push(raceSelectWithDetail(choice.draftField, choice.quickBuildLabel, raceChoiceDraftValues(key), { formatOption: value => { const option = choice.options.find(item => item.draftValue === value); return option ? `${option.label}（${option.name}）` : value; } }));
    if (key === "human") {
      fields.push(raceSelect("size", "體型", rules.sizes, sizeSelectOptions));
      fields.push(raceSelect("skill", `${raceSkillTrait(key).name}：多熟練 1 項技能`, raceSkillChoices(key), { disabled: backgroundSkills, note: KNOWN_PROFICIENCY_NOTE }));
      fields.push(raceFeatSelect("靈活人才：選 1 個起源專長", originFeats, { disabled: backgroundFeats, note: ORIGIN_FEAT_BLURBS[options.feat] || "起源專長是角色一開始就擁有的特殊能力。不知道選什麼的話，推薦「熟習」。" }));
    }
    if (key === "tiefling") {
      fields.push(raceSelect("size", "體型", rules.sizes, sizeSelectOptions));
      fields.push(choiceSelect({ note: raceLineageNote(options.legacy) }));
    }
    const humanFeatPanel = key === "human" && options.feat === "魔法學徒" ? renderHumanMagicFeatOptions() : key === "human" && options.feat === "熟習" ? renderHumanSkilledFeatOptions() : "";
    // 歌利亞的祖源能力說明：所選血統選項的種族頁文字（純文字）。
    const ancestryOption = key === "goliath" ? raceChoiceOption(key, options) : null;
    const ancestryDetail = ancestryOption ? window.getRaceText?.(key)?.options?.[ancestryOption.value] : "";
    const goliathDetail = ancestryDetail
      ? `<div class="quick-build-ancestry-detail"><strong>${escapeHtml(`${ancestryOption.label}（${ancestryOption.name}）`)}</strong>${escapeHtml(ancestryDetail)}</div>`
      : "";
    body.innerHTML = `<h3>${raceName(key)}種族選項</h3><p class="quick-build-lead">選好下面幾項，你的種族能力就確定了。</p><section class="quick-build-choice-panel quick-build-race-options">${fields.join("")}${goliathDetail}</section>${humanFeatPanel}`;
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
    return "德魯伊伎倆、大步奔行（3 級）、行動無蹤（5 級）";
  }

  function raceCompletionLines(key, options) {
    if (key === "dragonborn") {
      const choice = DRAGONBORN_SUMMARY[options.ancestry] || {};
      return ["體型：中型", "速度：30 呎", `血統：${choice.ancestry || ""}`, `吐息與抗性：${choice.damage || ""}（吐息造成此傷害，受到此傷害時減半）`, "黑暗視覺：60 呎", "5 級起可飛行 10 分鐘"];
    }
    if (key === "dwarf") return ["體型：中型", "速度：30 呎", "黑暗視覺：120 呎", "抵抗中毒時有優勢（擲兩次取高）", "毒素傷害減半", "HP 上限 +1，每升 1 級再 +1", "站在石面上可感知 60 呎內的震動"];
    const option = raceChoiceOption(key, options);
    if (key === "elf") return ["體型：中型", `速度：${option?.speed || raceRules(key).speed} 呎`, `精靈傳承：${option?.label || ""}`, `黑暗視覺：${option?.darkvision || raceRules(key).darkvision} 呎`, `種族法術：${elfSummarySpells(options)}`, "抵抗魅惑時有優勢（擲兩次取高）", `技能熟練：${options.skill}`, "不需睡眠，長休改為 4 小時冥想"];
    if (key === "gnome") {
      const forest = options.lineage === "森林侏儒";
      return ["體型：小型", "速度：30 呎", `血統：${option?.name || "侏儒"}`, "黑暗視覺：60 呎", "智力、感知、魅力豁免有優勢（擲兩次取高）", `種族法術：${forest ? "次級幻影、動物交談" : "修復術、魔法伎倆"}`];
    }
    if (key === "goliath") {
      return ["體型：中型", "速度：35 呎", `巨人裔祖源：${option?.label || ""}`, `能力：${option?.name || ""}（次數＝熟練加值，長休恢復）`, "掙脫擒抱時有優勢（擲兩次取高）", "5 級起可變成大型（速度 +10 呎、力量檢定有優勢）"];
    }
    if (key === "halfling") return ["體型：小型", "速度：30 呎", "抵抗恐慌時有優勢（擲兩次取高）", "D20 擲出 1 時可重擲一次", "移動時可穿過比你大的生物，但不能停在同一格", "可躲在比你大的生物後方"];
    if (key === "human") {
      const featOptions = isPlainObject(options.featOptions) ? options.featOptions : {};
      const featName = options.feat === "魔法學徒" && MAGIC_INITIATE_SPELL_CLASSES.has(featOptions.spellClass)
        ? `魔法學徒（${CLASS_LABELS[featOptions.spellClass]}）`
        : humanOriginFeatLabel(options.feat || "");
      const lines = [`體型：${options.size || ""}`, "速度：30 呎", `技能熟練：${options.skill || ""}`, "長休後獲得英雄激勵（可重擲自己剛擲的一顆骰子）", `起源專長：${featName}`];
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
    if (key === "orc") return ["體型：中型", "速度：30 呎", "黑暗視覺：120 呎", "可讓速度加倍並得到臨時 HP（次數＝熟練加值，短休或長休恢復）", "HP 降到 0 且未即死時可改為 1（長休後才能再用）"];
    if (key === "tiefling") {
      const choice = TIEFLING_SUMMARY[options.legacy] || { spells: [] };
      return [`體型：${options.size || ""}`, "速度：30 呎", `邪魔遺贈：${choice.legacy || ""}`, `傷害抗性：${choice.resistance || ""}（此傷害減半）`, "黑暗視覺：60 呎", `種族法術：${choice.spells.join("、")}`];
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
    body.innerHTML = `<h3>種族選擇完成</h3><div class="quick-build-complete"><strong>${raceName(key)}</strong>${completionLines.map(line => `<br>${escapeHtml(line).replace("黑暗視覺", infoTip("黑暗視覺")).replace("豁免", infoTip("豁免"))}`).join("")}</div>${duplicateReviewWarning()}${pending.length ? `<div class="quick-build-pending"><strong>後面的步驟還要選</strong><br>${pending.map(escapeHtml).join("、")}。</div>` : ""}`;
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
    body.innerHTML = `<h3>選擇職業</h3><p class="quick-build-lead">職業決定你在隊伍裡擔任什麼角色：怎麼戰鬥、會不會施法。</p><div class="quick-build-class-grid">${CLASS_ORDER.map(key => `<button type="button" class="quick-build-card quick-build-class-card" data-class-choice="${key}"><h4>${CLASS_LABELS[key]}</h4><p>${escapeHtml(CLASS_CARD_DESCRIPTIONS[key])}</p><p class="quick-build-option-note">關鍵屬性：${escapeHtml(CLASS_KEY_ABILITY_TEXT[key])}｜${SPELLCASTER_CLASS_IDS.has(key) ? "施法職業" : "不靠施法"}</p></button>`).join("")}</div>`;
    body.querySelectorAll("[data-class-choice]").forEach(card => card.addEventListener("click", () => handleChoiceCardSelection("class", card.dataset.classChoice, chooseClass)));
  }

  function renderClassType(body) {
    const key = draft.choices.class;
    const typeOptions = CLASS_TYPE_OPTIONS[key] || [];
    const typeCopy = CLASS_TYPE_COPY[key];
    body.innerHTML = `<h3>${CLASS_LABELS[key]}：選擇${escapeHtml(typeCopy.name)}</h3><p class="quick-build-lead">${escapeHtml(typeCopy.lead)}</p><div class="quick-build-class-grid">${typeOptions.map(option => `<button type="button" class="quick-build-card quick-build-class-card" data-class-type-choice="${option.id}"><h4>${escapeHtml(option.label)}</h4><p>${escapeHtml(option.description)}</p></button>`).join("")}</div>`;
    body.querySelectorAll("[data-class-type-choice]").forEach(card => card.addEventListener("click", () => chooseClassType(card.dataset.classTypeChoice)));
  }

  function renderClassAbilities(body) {
    const key = draft.choices.class;
    const allowedBonuses = new Set((draft.choices.backgroundAbilities || []).map(label => ABILITY_KEYS_BY_LABEL[label]));
    const spent = abilityPointCost(draft.choices.abilities);
    const bonusTotal = backgroundBonusTotal(draft.choices.backgroundAbilityBonuses);
    const backgroundBonusWarning = draft.choices.classOptions?.backgroundBonusInvalidated ? `<div class="quick-build-warning"><strong>換了背景，背景加值要重新分配</strong><br>你分配好的 27 點屬性都還在；請把新背景給的 3 點重新加上。</div>` : "";
    const bonusAbilities = draft.choices.backgroundAbilities || [];
    const bonusAbilityText = bonusAbilities.length > 1 ? `${bonusAbilities.slice(0, -1).join("、")}或${bonusAbilities[bonusAbilities.length - 1]}` : bonusAbilities[0] || "無";
    body.innerHTML = `<div class="quick-build-ability-heading"><h3>${CLASS_LABELS[key]}${draft.choices.classOptions.classType ? `（${CLASS_TYPE_OPTIONS[key]?.find(option => option.id === draft.choices.classOptions.classType)?.label || ""}）` : ""}的屬性</h3><div class="quick-build-ability-status"><span class="quick-build-status-pill${spent === 27 ? " is-complete" : ""}">購點 <strong>${spent}</strong> / 27</span><span class="quick-build-status-pill${bonusTotal === 3 ? " is-complete" : ""}">背景加值 <strong>${bonusTotal}</strong> / 3</span></div></div>${backgroundBonusWarning}<p class="quick-build-lead">${draft.choices.classOptions?.abilitiesCustomized || draft.choices.classOptions?.backgroundBonusInvalidated ? "按 ▲▼ 調整屬性。" : "我們已按照職業特長配好數值，不想調整可直接下一步。"}</p><div class="quick-build-ability-help"><span>${CLASS_LABELS[key]}最需要：<strong>${escapeHtml(CLASS_KEY_ABILITY_TEXT[key] || "")}</strong></span><span>背景加值：「${escapeHtml(backgroundName(draft.choices.background) || "背景")}」背景讓你額外獲得 3 點，可加在<strong>${escapeHtml(bonusAbilityText)}</strong>（例如 +2/+1，或各 +1）。其他屬性無法加點，會顯示「—」。</span></div><section class="quick-build-choice-panel quick-build-ability-grid"><div class="quick-build-ability-table-head"><span>屬性</span><span>基礎值</span><span>背景加值</span><span class="skill-tip quick-build-total-head" data-skill="調整值" role="button" tabindex="0" aria-label="總值與調整值：開啟說明">總值<small>調整值</small></span></div>${ABILITY_ORDER.map(ability => {
      const bonusEnabled = allowedBonuses.has(ability);
      const baseValue = draft.choices.abilities[ability];
      const bonusValue = draft.choices.backgroundAbilityBonuses[ability] || 0;
      const nextBaseCost = POINT_BUY_COSTS[baseValue + 1];
      const canIncreaseBase = baseValue < 15 && spent - POINT_BUY_COSTS[baseValue] + nextBaseCost <= 27;
      const canIncreaseBonus = bonusEnabled && bonusValue < 2 && bonusTotal < 3;
      return `<div class="quick-build-ability-row${bonusEnabled ? "" : " is-bonus-locked"}"><div class="quick-build-ability-name"><strong>${infoTip(ABILITY_LABELS[ability])}</strong><small>${ability.toUpperCase()}</small></div><div class="quick-build-ability-control"><button type="button" class="quick-build-ability-step" data-class-ability-base="${ability}" data-ability-adjustment="-1" aria-label="降低${ABILITY_LABELS[ability]}基礎值"${baseValue > 8 ? "" : " disabled"}>▼</button><span class="quick-build-ability-value">${baseValue}</span><button type="button" class="quick-build-ability-step" data-class-ability-base="${ability}" data-ability-adjustment="1" aria-label="提高${ABILITY_LABELS[ability]}基礎值"${canIncreaseBase ? "" : " disabled"}>▲</button></div><div class="quick-build-ability-control"><button type="button" class="quick-build-ability-step" data-class-ability-bonus="${ability}" data-ability-adjustment="-1" aria-label="降低${ABILITY_LABELS[ability]}背景加值"${bonusEnabled && bonusValue > 0 ? "" : " disabled"}>▼</button><span class="quick-build-ability-value is-bonus">${bonusEnabled ? `+${bonusValue}` : "—"}</span><button type="button" class="quick-build-ability-step" data-class-ability-bonus="${ability}" data-ability-adjustment="1" aria-label="提高${ABILITY_LABELS[ability]}背景加值"${canIncreaseBonus ? "" : " disabled"}>▲</button></div><div class="quick-build-ability-total"><strong>${abilityTotal(draft, ability)}</strong><small>${signedModifierText(abilityTotal(draft, ability))}</small></div></div>`;
    }).join("")}</section>${optionNote("你有 27 點可分配到六項屬性。\n每項從 8 開始，最高 15；點數需全部用完才能下一步。")}${conceptHelp("屬性怎麼調整？ ℹ️")}${spent !== 27 ? `<div class="quick-build-warning">還有 ${27 - spent} 點沒分配，全部用完才能下一步。</div>` : ""}${bonusTotal !== 3 ? `<div class="quick-build-warning">背景加值還有 ${3 - bonusTotal} 點沒分配，分完才能下一步。</div>` : ""}`;
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
    const label = escapeHtml(castingSource.label);
    if (fixed) {
      const total = abilityTotal(draft, fixed);
      body.innerHTML = `<h3>${label}：施法屬性</h3><div class="quick-build-fixed-list">${label}固定用${ABILITY_LABELS[fixed]}施法（目前 ${total}，調整值 ${signedModifierText(total)}）。</div>${conceptHelp("什麼是施法屬性？ ℹ️")}`;
      return;
    }
    body.innerHTML = `<h3>${label}：選擇施法屬性</h3><p class="quick-build-lead">${label}的法術強弱取決於這項屬性。已幫你選好目前最高的一項，也可以自己改。</p><section class="quick-build-choice-panel"><div class="quick-build-field"><label for="quick-build-class-spellcasting">施法屬性</label><select id="quick-build-class-spellcasting" data-class-spellcasting>${["int", "wis", "cha"].map(ability => `<option value="${ability}"${ability === selected ? " selected" : ""}>${ABILITY_LABELS[ability]} ${abilityTotal(draft, ability)}（${signedModifierText(abilityTotal(draft, ability))}）</option>`).join("")}</select></div></section>${conceptHelp("什麼是施法屬性？ ℹ️")}`;
    body.querySelector("[data-class-spellcasting]")?.addEventListener("change", updateClassSpellcasting);
  }

  function classProficiencySelect(type, index, values, selectedValues, disabledBySource = new Set()) {
    const selected = selectedValues[index] || "";
    const otherSelections = new Set(selectedValues.filter((_, otherIndex) => otherIndex !== index));
    const label = type === "skill" ? `技能 ${index + 1}` : `工具 ${index + 1}`;
    const options = type === "skill" ? orderedSkillOptions(values) : values;
    const selectId = `quick-build-class-${type}-${index}`;
    const select = `<select id="${selectId}" data-class-${type}><option value="">請選擇</option>${options.map(name => {
      const peerDuplicate = otherSelections.has(name) && name !== selected;
      const sources = duplicateSourceLabels(type === "skill" ? "skills" : "tools", name, "class");
      const displayName = type === "skill" ? skillOptionLabel(name) : name;
      return `<option value="${escapeHtml(name)}"${name === selected ? " selected" : ""}${peerDuplicate ? " disabled" : ""}${sources.length && !peerDuplicate ? ' class="quick-build-known-option"' : ""}>${escapeHtml(displayName)}${peerDuplicate ? "（本頁已選）" : sources.length ? `（${escapeHtml(sources.join("、"))}已熟練）` : ""}</option>`;
    }).join("")}</select>`;
    return `<div class="quick-build-field"><label for="${selectId}">${label}</label><div class="quick-build-field-control">${select}${type === "skill" ? skillDescriptionButton(selected) : equipmentDetailButton(selected, "請先選擇工具，再查看說明")}</div></div>`;
  }

  function renderClassProficiencies(body) {
    const definition = CLASS_BUILD_DEFINITIONS[draft.choices.class];
    const options = draft.choices.classOptions;
    const skills = Array.isArray(options.skills) ? options.skills : [];
    const tools = Array.isArray(options.tools) ? options.tools : [];
    const backgroundSkills = new Set((draft.acquisitions.skills || []).filter(item => item.sourceType === "background").map(item => item.name));
    const proficiencyBonus = quickBuildProficiencyBonus();
    const toolIntro = `使用這些工具擲骰時，同樣會多加 +${proficiencyBonus}。`;
    const toolNote = [toolIntro, CLASS_TOOL_NOTES[draft.choices.class]].filter(Boolean).join("\n");
    body.innerHTML = `<h3>${CLASS_LABELS[draft.choices.class]}：技能與工具</h3><p class="quick-build-lead">挑出角色拿手的事。做這類事情擲骰時，會多加 +${proficiencyBonus}。</p><div class="quick-build-proficiency-grid"><section class="quick-build-choice-panel"><h4>選擇 ${definition.skillCount} 項拿手技能</h4>${optionNote("括號內是這項技能依靠的屬性，該屬性越高，越容易成功。\n標示「已熟練」的技能你已經會了（例如來自背景），再選也不會更強，建議換別的。")}<div class="quick-build-spell-fields">${Array.from({ length: definition.skillCount }, (_, index) => classProficiencySelect("skill", index, definition.skillOptions, skills, backgroundSkills)).join("")}</div></section>${definition.toolCount ? `<section class="quick-build-choice-panel"><h4>選擇 ${definition.toolCount} 項會用的${escapeHtml(definition.toolLabel || "工具")}</h4>${optionNote(toolNote)}<div class="quick-build-spell-fields">${Array.from({ length: definition.toolCount }, (_, index) => classProficiencySelect("tool", index, definition.toolOptions, tools)).join("")}</div></section>` : ""}${(definition.fixedTools || []).length ? `<section class="quick-build-choice-panel"><h4>職業附帶的工具熟練</h4>${optionNote(toolIntro)}${definition.fixedTools.map(tool => `<div class="quick-build-field-control quick-build-fixed-tool"><div class="quick-build-fixed-list">${escapeHtml(FIXED_TOOL_INTROS[tool] || tool)}</div>${equipmentDetailButton(tool)}</div>`).join("")}</section>` : ""}</div>`;
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
    const skillBonusSummary = groupedSourceAcquisitions("skillBonuses", item => item.sourceType === "class", compactFeatureSource);
    const optionalRow = (label, value) => !value || value === "無" ? "" : `<dt>${summaryLabel(label)}</dt><dd>${escapeHtml(value)}</dd>`;
    body.innerHTML = `<h3>確認職業與屬性</h3><section class="quick-build-complete"><dl class="quick-build-summary-list"><dt>職業</dt><dd>${escapeHtml(selection?.label || "")}${content.classTypeLabel ? `（${escapeHtml(content.classTypeLabel)}）` : ""}</dd><dt>${summaryLabel("關鍵屬性")}</dt><dd>${escapeHtml(content.keyAbilityText || "")}</dd><dt>${summaryLabel("生命骰")}</dt><dd>${escapeHtml(hitDieSummary)}</dd><dt class="quick-build-summary-full-label">屬性總值（基礎值＋背景加值）・${infoTip("調整值")}</dt><dd class="quick-build-summary-full-value"><div class="quick-build-ability-summary">${abilitySummary}</div></dd>${spellcastingSummary}<dt>${summaryLabel("豁免熟練")}</dt><dd>${escapeHtml((content.saves || []).join("、"))}</dd><dt>技能熟練</dt><dd>${escapeHtml(skillSummary)}</dd>${optionalRow("技能額外加值", skillBonusSummary)}${optionalRow("工具熟練", toolSummary)}${optionalRow("武器熟練", content.weaponProficiencies)}${optionalRow("護甲訓練", content.armorTraining)}</dl></section>${duplicateReviewWarning()}`;
  }

  function classEquipmentComplete(target = draft) {
    const content = target.selections.classEquipment?.content;
    return Boolean(content && !(content.pendingChoices || []).length);
  }

  function equipmentComplete(target = draft) {
    return classEquipmentComplete(target) && ["default", "gold"].includes(target.choices.backgroundWealth);
  }

  /*
   * 裝備步驟的商店只暫存在 draft.choices.shop：{ funding, items }，items 為合併後的購買清單，
   * 剩餘金額＝起始金額－清單總價。funding 記錄起始金額的來源（背景、職業、職業裝備方式、背景財富）；
   * 任何一項改變就整份歸零（已購品項退回記憶體中的購物清單，見 syncShopCartFunding），主手、樂器等套裝內選項
   * 與只切換步驟都不算。匯入手機角卡前不經過角色卡的 MoneyTracker。
   */
  function normalizeShopItems(items) {
    if (!Array.isArray(items) || items.length > SHOP_ITEM_LIMIT) return null;
    const normalized = items.map(item => {
      const name = String(item?.name || "").trim();
      const gearName = String(item?.gearName || "").trim();
      const amount = Number(item?.amount);
      const quantity = Number(item?.quantity);
      if (!name || name.length > SHOP_TEXT_LIMIT || gearName.length > SHOP_TEXT_LIMIT || !Object.hasOwn(SHOP_CURRENCY_COPPER, item?.currency)
        || !Number.isSafeInteger(amount) || amount < 1 || !Number.isInteger(quantity) || quantity < 1 || quantity > SHOP_QUANTITY_MAX) return null;
      return { name, gearName, amount, currency: item.currency, quantity };
    });
    return normalized.includes(null) ? null : normalized;
  }

  function shopFundingSignature(target = draft) {
    return stableSignature({
      background: target.choices.background || null,
      class: target.choices.class || null,
      classEquipmentMethod: target.choices.classEquipmentMethod || null,
      backgroundWealth: target.choices.backgroundWealth || null
    });
  }

  // 未結帳清單不在草稿內；資金來源改變時立即處理，不能等到下一次開店才比較。
  // 玩家改選項（傳入改選前的已購品項）時，已購品項退回購物清單、未結帳清單保留，
  // 都只留在記憶體並須重新結帳；載入或重新開始草稿則整份清空。
  function syncShopCartFunding(previousItems = null) {
    const funding = shopFundingSignature();
    if (funding === shopCartFunding) return;
    const fromId = `quick-build:${shopCartFunding}`;
    shopCartFunding = funding;
    if (!previousItems) {
      window.EquipmentShop?.clearWalletCart?.(fromId);
      return;
    }
    const missing = window.EquipmentShop?.moveWalletCart?.(fromId, `quick-build:${funding}`, previousItems) ?? previousItems;
    if (!previousItems.length) return;
    const returned = previousItems.filter(item => !missing.includes(item));
    window.AppDialog?.notify?.([
      returned.length && `起始資金已變更，已購買的${formatShopItems(returned)}退回購物清單，可在商店重新結帳。`,
      missing.length && `${formatShopItems(missing)}已不在商店，無法退回。`
    ].filter(Boolean).join(""), { tone: missing.length ? "warning" : "info" });
  }

  function shopStartingCopper(target = draft) {
    return [target.selections.backgroundEquipment, target.selections.classEquipment].filter(Boolean)
      .reduce((sum, selection) => sum + Object.entries({ cp: 1, sp: 10, gp: 100, pp: 1000 })
        .reduce((subtotal, [key, rate]) => subtotal + (Number(selection.content?.currency?.[key]) || 0) * rate, 0), 0);
  }

  function shopItemsCopper(items) {
    return items.reduce((sum, item) => sum + item.amount * SHOP_CURRENCY_COPPER[item.currency] * item.quantity, 0);
  }

  function shopItems(target = draft) {
    return target.choices.shop?.items || [];
  }

  function shopBalanceCopper(target = draft) {
    return shopStartingCopper(target) - shopItemsCopper(shopItems(target));
  }

  function reconcileShopDraft(target) {
    const saved = isPlainObject(target.choices.shop) ? target.choices.shop : null;
    const items = saved ? normalizeShopItems(saved.items) : null;
    // 套裝選項暫時失效（例如移除已選樂器的熟練）不代表起始資金改變。
    const funding = shopFundingSignature(target);
    target.choices.shop = funding && items?.length && saved.funding === funding && shopItemsCopper(items) <= shopStartingCopper(target)
      ? { funding, items }
      : null;
    return target;
  }

  // 創角的金額以金幣為主，不像角色卡財產摘要把十枚金幣進位成白金幣。
  function formatCopperAmount(copper) {
    const value = Math.abs(copper);
    const parts = [[Math.floor(value / 100), "金幣"], [Math.floor(value % 100 / 10), "銀幣"], [value % 10, "銅幣"]]
      .filter(([amount]) => amount).map(([amount, label]) => `${amount} ${label}`);
    return `${copper < 0 ? "-" : ""}${parts.join(" ") || "0 銅幣"}`;
  }

  function formatShopItems(items) {
    return items.map(item => item.quantity > 1 ? `${item.name} ×${item.quantity}` : item.name).join("、");
  }

  function equipmentItemNames(equipmentPackage) {
    const items = equipmentPackage.items.map(([name, quantity]) => `${name}${quantity > 1 ? ` ×${quantity}` : ""}`);
    if (equipmentPackage.instrument) items.push("自選一個樂器");
    if (equipmentPackage.gp) items.push(`${equipmentPackage.gp} 金幣`);
    return items;
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
    if (content.method === "gold") return `${content.currency?.gp || 0} 金幣：沒有職業裝備，可在商店購買。`;
    const loadout = content.loadout || {};
    const notes = (content.specialWrites || []).map(write => write.note).filter(Boolean).map(note => EQUIPMENT_NOTE_DISPLAY[note] || note);
    const rows = [
      escapeHtml(selection.label),
      `攜帶物品：${escapeHtml((content.items || []).map(item => `${item.name}${Number(item.quantity) > 1 ? ` ×${item.quantity}` : ""}`).join("、") || "無")}`,
      content.currency?.gp && `金幣：${escapeHtml(content.currency.gp)}`,
      `開場裝備：主手 ${escapeHtml(loadout.mainHand || "空著")}、副手 ${escapeHtml(loadout.offHand || "空著")}${loadout.armor ? `、護甲 ${escapeHtml(loadout.armor)}` : ""}`,
      notes.length && `備註：${escapeHtml(notes.join("、"))}`
    ].filter(Boolean);
    return rows.join("<br>");
  }

  function backgroundEquipmentCompleteSummary(selection) {
    const content = selection?.content;
    if (!content) return "無";
    const gold = content.currency?.gp || 0;
    if (draft.choices.backgroundWealth === "gold") return `${escapeHtml(gold)} 金幣：沒有背景裝備，可在商店購買。`;
    const items = (content.items || []).map(item => typeof item === "string" ? item : `${item.name}${Number(item.quantity) > 1 ? ` ×${item.quantity}` : ""}`);
    return [escapeHtml(selection.label), `攜帶物品：${escapeHtml(items.join("、") || "無")}`, gold && `金幣：${escapeHtml(gold)}`].filter(Boolean).join("<br>");
  }

  function fighterEquipmentNotice() {
    const type = draft.choices.classOptions?.classType;
    const str = abilityTotal(draft, "str");
    const dex = abilityTotal(draft, "dex");
    if (type === "strength" && dex > str) return `<div class="quick-build-warning"><strong>選和屬性相符的裝備</strong><br>你選了力量型，但目前敏捷較高（力量 ${str}、敏捷 ${dex}）。建議選敏捷型裝備，或回頭調整屬性。</div>`;
    if (type === "dexterity" && str > dex) return `<div class="quick-build-warning"><strong>選和屬性相符的裝備</strong><br>你選了敏捷型，但目前力量較高（力量 ${str}、敏捷 ${dex}）。建議選力量型裝備，或回頭調整屬性。</div>`;
    const matched = type === "dexterity" ? `你是敏捷型（敏捷 ${dex}、力量 ${str}），建議選敏捷型裝備。` : `你是力量型（力量 ${str}、敏捷 ${dex}），建議選力量型裝備。`;
    return `<div class="quick-build-fixed-list"><strong>選和屬性相符的裝備</strong><br>${matched}</div>`;
  }

  // 戰士兩套裝備的屬性提醒：鎖子甲的力量需求與重型武器、長弓的門檻都是 13。
  function fighterPackageNote(optionId) {
    if (optionId === "strength-default" && abilityTotal(draft, "str") < 13) return "力量未滿 13：穿鎖子甲速度 -10 呎，用巨劍攻擊有劣勢。";
    if (optionId === "dexterity-default" && abilityTotal(draft, "dex") < 13) return "敏捷未滿 13：用長弓攻擊有劣勢。";
    return "";
  }

  function offHandDescription(mainHand, offHand) {
    if (!offHand) return weaponHasProperty(mainHand, "雙手") ? "空著（這把武器要雙手拿）" : "空著";
    if (offHand === "盾牌") return `盾牌（AC +${globalThis.shield?.[0]?.AC ?? 2}，更難被打中）`;
    if (offHand === "武藝") return "武藝（徒手攻擊，不用拿武器。未穿護甲、未持盾才能用，攻擊後可用附贈動作再打一次）";
    return weaponHasProperty(offHand, "輕型") ? `${offHand}（攻擊後可用附贈動作再砍一次，這次傷害不加屬性調整值）` : offHand;
  }

  function mainHandNote(key, mainHand) {
    const note = MAIN_HAND_NOTES[key]?.[mainHand];
    if (!note) return "";
    const damage = findWeaponEntry(mainHand)?.傷害;
    return `${mainHand}${damage ? `（${damage}）` : ""}：${note}`;
  }

  function renderEquipmentMethod(body) {
    const key = draft.choices.class;
    const definition = classEquipmentDefinition(key);
    if (!definition) {
      body.innerHTML = '<div class="quick-build-warning">目前職業沒有可用的裝備資料，請返回職業步驟。</div>';
      return;
    }
    const fighterNotice = key === "fighter" ? fighterEquipmentNotice() : "";
    const goldNote = draft.choices.classEquipmentMethod === "gold" ? optionNote("你沒有職業裝備，記得在這一步最後的商店買武器和護甲。") : "";
    body.innerHTML = `<h3>${CLASS_LABELS[key]}：選擇初始裝備</h3><p class="quick-build-lead">新手建議選初始裝備：需要的東西都配好了，還附一點零用金。</p>${fighterNotice}<section class="quick-build-choice-panel">${optionNote(EQUIPMENT_LIST_NOTE)}${definition.defaults.map(option => `<strong>${escapeHtml(option.label)}</strong><div class="quick-build-equipment-list">${equipmentLinks(equipmentItemNames(option))}</div>${key === "fighter" ? optionNote(fighterPackageNote(option.id)) : ""}`).join("")}<div class="quick-build-choice-actions quick-build-equipment-actions">${definition.defaults.map(option => `<button type="button" data-class-equipment-method="${option.id}">${definition.defaults.length === 1 ? "取得初始裝備" : `取得${escapeHtml(option.label)}`}</button>`).join("")}<button type="button"${key === "fighter" ? " class=\"quick-build-choice-action-full\"" : ""} data-class-equipment-method="gold">改拿 ${definition.gold} 金幣，自己買</button></div>${goldNote}</section>`;
    body.querySelectorAll("[data-class-equipment-method]").forEach(button => button.addEventListener("click", () => chooseClassEquipmentMethod(button.dataset.classEquipmentMethod)));
  }

  function equipmentSelect(id, label, values, selected, dataName, { detail = false, note = "" } = {}) {
    const select = `<select id="${id}" ${dataName}><option value="">請選擇</option>${values.map(value => `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(value)}</option>`).join("")}</select>`;
    return `<div class="quick-build-field"><label for="${id}">${escapeHtml(label)}</label>${detail ? `<div class="quick-build-field-control">${select}${equipmentDetailButton(selected, "請先選擇，再查看說明")}</div>` : select}${optionNote(note)}</div>`;
  }

  function renderEquipmentComplete(body) {
    const key = draft.choices.class;
    const selection = draft.selections.classEquipment;
    const shopSummary = shopItems().length
      ? `<br><br><strong>商店</strong><br>已購買：${escapeHtml(formatShopItems(shopItems()))}<br>剩餘金額：${escapeHtml(formatCopperAmount(shopBalanceCopper()))}`
      : "";
    body.innerHTML = `<h3>${CLASS_LABELS[key]}：裝備選擇完成</h3><div class="quick-build-complete"><strong>職業裝備</strong><br>${classEquipmentCompleteSummary(selection)}<br><br><strong>背景裝備</strong><br>${backgroundEquipmentCompleteSummary(draft.selections.backgroundEquipment)}${shopSummary}</div>`;
  }

  function renderEquipmentShop(body) {
    const items = shopItems();
    const classGold = draft.selections.classEquipment?.content?.currency?.gp || 0;
    const backgroundGold = draft.selections.backgroundEquipment?.content?.currency?.gp || 0;
    body.innerHTML = `<h3>商店（可略過）</h3><p class="quick-build-lead">用手上的錢買其他物品；不買也可以，直接按下一步。</p><section class="quick-build-choice-panel"><dl class="quick-build-summary-list"><dt>起始金額</dt><dd>${escapeHtml(formatCopperAmount(shopStartingCopper()))}</dd>${items.length ? `<dt>已購買</dt><dd>${escapeHtml(formatShopItems(items))}</dd>` : ""}<dt>剩餘金額</dt><dd>${escapeHtml(formatCopperAmount(shopBalanceCopper()))}</dd></dl>${optionNote(`起始金額＝職業 ${classGold} 金幣＋背景 ${backgroundGold} 金幣。沒花完的錢會帶進角色卡，之後也能在角色卡上開商店購物。`)}<div class="quick-build-choice-actions quick-build-shop-actions"><button type="button" id="quick-build-shop-open" class="primary quick-build-choice-action-full quick-build-shop-open" aria-haspopup="dialog">${SHOP_CART_ICON}<span>開啟商店</span></button></div></section>`;
    body.querySelector("#quick-build-shop-open").addEventListener("click", openDraftShop);
  }

  // 商店只在合計不超過剩餘金額時允許結帳；這裡再檢查一次，並把同名同價的品項合併數量。
  function purchaseDraftShopItems(requestedItems) {
    const purchased = normalizeShopItems(requestedItems);
    if (!purchased?.length || !equipmentComplete() || shopItemsCopper(purchased) > shopBalanceCopper()) return false;
    const items = shopItems().map(item => ({ ...item }));
    for (const item of purchased) {
      const existing = items.find(entry => entry.name === item.name && entry.gearName === item.gearName && entry.amount === item.amount && entry.currency === item.currency);
      if (existing) existing.quantity += item.quantity;
      else items.push(item);
    }
    if (items.length > SHOP_ITEM_LIMIT || items.some(item => item.quantity > SHOP_QUANTITY_MAX)) return false;
    draft.choices.shop = { funding: shopFundingSignature(), items };
    saveDraft();
    return true;
  }

  async function openDraftShop(event) {
    const trigger = event.currentTarget;
    if (!equipmentComplete()) return;
    if (typeof window.EquipmentShop?.open !== "function") {
      await window.AppDialog.showMessage({ title: "商店無法開啟", message: "商店尚未載入，請重新載入頁面後再試。", trigger });
      return;
    }
    await window.EquipmentShop.open({
      trigger,
      wallet: {
        id: `quick-build:${shopFundingSignature()}`,
        readTotal: () => shopBalanceCopper(),
        formatAmount: formatCopperAmount,
        purchaseItems: async items => purchaseDraftShopItems(items),
        balanceLabel: "剩餘金額",
        checkoutNotice: "已記下購買內容，匯入角色卡時一併寫入。"
      }
    });
    // 商店開啟期間只更新 draft；關閉後才重繪，焦點依 id 回到開啟商店按鈕。
    render(true);
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
    const choosesMainHand = configurationFields.includes("mainHand");
    const effectiveMainHand = choosesMainHand ? mainHand : (options.mainHand || equipmentPackage.main[0] || "");
    const offControl = effectiveMainHand ? `<div class="quick-build-fixed-list"><strong>副手：</strong>${escapeHtml(offHandDescription(effectiveMainHand, (equipmentPackage.off[effectiveMainHand] || [])[0]))}</div>` : `<div class="quick-build-fixed-list"><strong>副手：</strong>請先選擇主手</div>`;
    const fixedArmor = equipmentPackage.armor ? `<div class="quick-build-fixed-list"><strong>護甲：</strong>${escapeHtml(equipmentPackage.armor)}</div>` : "";
    const mainControl = choosesMainHand ? equipmentSelect("quick-build-equipment-main", "主手", equipmentPackage.main, mainHand, "data-equipment-main", { detail: true, note: mainHandNote(key, mainHand) }) : `<div class="quick-build-fixed-list"><strong>主手：</strong>${escapeHtml(options.mainHand || equipmentPackage.main[0] || "空著")}</div>`;
    const instrumentControl = configurationFields.includes("instrument") ? equipmentSelect("quick-build-equipment-instrument", "選 1 件樂器帶在身上", classEquipmentInstrumentOptions(draft), options.instrument || "", "data-equipment-instrument", { note: "只會列出你在前面選過的樂器。" }) : "";
    const configurationLead = choosesMainHand ? '<p class="quick-build-lead">選擇一開始拿在手上的武器。其他武器仍帶在身上，之後隨時能在角色卡上換。</p>' : "";
    body.innerHTML = `<h3>${CLASS_LABELS[key]}：${choosesMainHand ? "選主手武器" : "選樂器"}</h3>${configurationLead}<section class="quick-build-choice-panel"><div class="quick-build-spell-fields">${mainControl}${offControl}${fixedArmor}${instrumentControl}</div></section>`;
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
    const markRituals = dataAttr === "data-level-one-spellbook";
    return `<div class="quick-build-field"><label for="${id}">${escapeHtml(label)}</label><div class="quick-build-field-control"><select id="${id}" ${dataAttr}><option value="">-- 選擇法術 --</option>${spells.map(spell => {
      const spellId = spell.spellId;
       const peerDuplicate = selectedPeerNames.includes(spellId) && spellId !== selected;
       const known = [...new Set(knownSources.get(spellId) || [])];
       const suffix = peerDuplicate ? "（本頁已選）" : known.length ? `（${escapeHtml(known.join("、"))}已學會）` : "";
       return `<option value="${escapeHtml(spellId)}"${spellId === selected ? " selected" : ""}${peerDuplicate ? " disabled" : ""}${known.length && !peerDuplicate ? ' class="quick-build-known-option"' : ""}>${escapeHtml(spellDisplayName(spellId))}${markRituals && isRitualSpell(spell) ? "（儀式）" : ""}${suffix}</option>`;
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
        const cantripFields = Array.from({ length: 3 }, (_, index) => spellSelectControl(`pact-tome-cantrip-${index}`, `影之書戲法 ${index + 1}`, allSpellOptions("cantrips"), selection.cantrips[index], selection.cantrips, knownSources, "data-pact-tome-cantrip")).join("");
        const ritualFields = Array.from({ length: 2 }, (_, index) => spellSelectControl(`pact-tome-ritual-${index}`, `影之書儀式 ${index + 1}`, allSpellOptions("1", isRitualSpell), selection.rituals[index], selection.rituals, knownSources, "data-pact-tome-ritual")).join("");
        body.innerHTML = `<h3>選擇影之書法術</h3><p class="quick-build-lead">選 3 個戲法和 2 個 1 環儀式法術，任一職業的都能選；五個都選好後才能確認。</p><section class="quick-build-choice-panel"><div class="quick-build-spell-fields">${cantripFields}${ritualFields}</div></section>`;
        body.querySelectorAll(".quick-build-spell-view").forEach(button => button.remove());
        markTransientControls(body);
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
      const skillBonus = (draft.acquisitions.skillBonuses || []).find(item => item.sourceType === "level-one" && item.sourceId === key)?.content?.value;
      const selectedOption = definition.classOption.options.find(option => option.id === choices.classOption);
      const intro = selectedOption?.intro?.replace("{X}", skillBonus ?? 1);
      panels.push(`<section class="quick-build-choice-panel"><h4>${escapeHtml(definition.classOption.label)}</h4>${optionNote(definition.classOption.lead)}<div class="quick-build-spell-fields"><div class="quick-build-field"><label class="sr-only" for="quick-build-level-one-class-option">${escapeHtml(definition.classOption.label)}</label><select id="quick-build-level-one-class-option" data-level-one-class-option><option value="">請選擇</option>${definition.classOption.options.map(option => `<option value="${option.id}"${choices.classOption === option.id ? " selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}</select>${optionNote(intro)}</div></div></section>`);
    }
    if (definition.fightingStyle) {
      const mainHand = draft.selections.classEquipment?.content?.loadout?.mainHand;
      const styleLead = `選一種你擅長的戰鬥方式，依你主要用的武器來挑。不確定就選「防禦」。${mainHand ? `\n你的主手武器：${mainHand}` : ""}`;
      panels.push(`<section class="quick-build-choice-panel"><h4>戰鬥風格</h4>${optionNote(styleLead)}<div class="quick-build-field"><label class="sr-only" for="quick-build-fighting-style">戰鬥風格</label><div class="quick-build-field-control"><select id="quick-build-fighting-style" data-level-one-fighting-style><option value="">請選擇</option>${fightingStyleFeatIds().map(id => `<option value="${escapeHtml(id)}"${choices.fightingStyle === id ? " selected" : ""}>${escapeHtml(id)}</option>`).join("")}</select><button type="button" class="quick-build-spell-view" data-fighting-style-view${choices.fightingStyle ? "" : " disabled"}>查看</button></div>${optionNote(FIGHTING_STYLE_INTROS[choices.fightingStyle])}</div></section>`);
    }
    if (definition.invocations) {
      const selected = choices.invocations?.[0] || "";
      const invocationOptions = levelOneInvocationOptions();
      const option = invocationOptions.find(item => item.id === selected);
      const invocationLead = `你從契約中獲得一項超自然能力，每次升級都可以換。${selected && selected === definition.defaultInvocations?.[0] ? `已先幫你選好「${option?.label || ""}」。` : ""}`;
      panels.push(`<section class="quick-build-choice-panel"><h4>魔能祈喚</h4>${optionNote(invocationLead)}<label class="sr-only" for="quick-build-invocation">魔能祈喚</label><div class="quick-build-field-control"><select id="quick-build-invocation" data-level-one-invocation><option value="">請選擇</option>${invocationOptions.map(item => `<option value="${item.id}"${selected === item.id ? " selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select><button type="button" class="quick-build-spell-view" data-invocation-view${selected ? "" : " disabled"}>查看</button></div>${option ? `<p class="quick-build-option-note">${escapeHtml(option.description)}</p>` : ""}</section>`);
    }
    body.innerHTML = `<h3>${CLASS_LABELS[key]}：職業選項</h3>${panels.join("")}`;
    body.querySelector("[data-level-one-class-option]")?.addEventListener("change", event => updateLevelOneField(next => { next.classOption = event.currentTarget.value || null; next.cantrips = []; }));
    body.querySelector("[data-level-one-fighting-style]")?.addEventListener("change", event => updateLevelOneField(next => { next.fightingStyle = event.currentTarget.value || null; }));
    body.querySelector("[data-fighting-style-view]")?.addEventListener("click", event => openFeatDetail({ feat: draft.choices.levelOne?.fightingStyle }, event.currentTarget, "戰鬥風格詳情"));
    body.querySelector("[data-level-one-invocation]")?.addEventListener("change", event => updateLevelOneField(next => { next.invocations = event.currentTarget.value ? [event.currentTarget.value] : []; next.tome = {}; }));
    body.querySelector("[data-invocation-view]")?.addEventListener("click", event => {
      const invocationId = body.querySelector("[data-level-one-invocation]")?.value || "";
      const selectedOption = levelOneInvocationOptions().find(item => item.id === invocationId);
      openInvocationDetail(selectedOption, event.currentTarget);
    });
  }

  // 職業 1 級直接學會的語言（德魯伊語、盜賊黑話），名稱取自語言選項。
  function levelOneGrantedLanguages(key) {
    return (window.getClassRules?.(key)?.features || [])
      .filter(feature => feature.level === QUICK_BUILD_LEVEL)
      .flatMap(feature => feature.grants?.languages || [])
      .map(language => LANGUAGE_OPTIONS.find(option => option.value === language.id)?.label)
      .filter(Boolean);
  }

  function renderLevelOneFeatures(body) {
    const key = draft.choices.class;
    const stageLabels = { options: "職業選項", languages: "語言", spells: "法術", mastery: "武器精通", expertise: "專精" };
    const stageList = levelOneStages().map(stage => stageLabels[stage]).filter(Boolean).concat("陣營").join("、");
    const context = {
      value: name => window.getClassProgressionValue?.(key, name, QUICK_BUILD_LEVEL),
      mod: ability => abilityModifier(abilityTotal(draft, ability)),
      classType: draft.choices.classOptions?.classType
    };
    const rows = (LEVEL_ONE_FEATURE_INTROS[key] || []).map(({ id, text }) => `<div class="quick-build-feature-row"><div class="quick-build-field-control"><div><strong>${escapeHtml(levelOneFeatureName(key, id))}</strong>${optionNote(text(context))}</div><button type="button" class="quick-build-spell-view" data-level-one-feature-view="${escapeHtml(id)}">查看</button></div></div>`).join("");
    body.innerHTML = `<p class="quick-build-lead">最後一步，接下來要選：${escapeHtml(stageList)}。</p><h3>1 級自動獲得的能力</h3><p class="quick-build-lead">這些能力不用選，1 級就自動擁有。按「查看」可以看完整規則。</p><div class="quick-build-feature-list">${rows}</div>`;
    body.querySelectorAll("[data-level-one-feature-view]").forEach(button => button.addEventListener("click", event => {
      const id = button.dataset.levelOneFeatureView;
      openFeatDetail({ html: classFeatureSectionHtml(key, id) }, event.currentTarget, levelOneFeatureName(key, id));
    }));
  }

  function renderLevelOneLanguages(body) {
    const selected = draft.choices.levelOne?.languages || [];
    const key = draft.choices.class;
    const grantedLanguages = levelOneGrantedLanguages(key);
    const fieldLabel = index => {
      const slot = classLanguageSlotForDraft(draft, index);
      return slot ? `${slot.featureName}：額外語言` : `語言 ${index + 1}`;
    };
    const select = index => `<div class="quick-build-field"><label for="quick-build-language-${index}">${escapeHtml(fieldLabel(index))}</label><select id="quick-build-language-${index}" data-level-one-language><option value="">-- 請選擇 --</option>${LANGUAGE_OPTIONS.map(option => {
      const availableOptions = languageOptionsForDraft(draft, index);
      if (!availableOptions.some(available => available.value === option.value)) return "";
      const peerDuplicate = selected.includes(option.value) && selected[index] !== option.value;
      return `<option value="${option.value}"${selected[index] === option.value ? " selected" : ""}${peerDuplicate ? " disabled" : ""}>${escapeHtml(option.label)}${peerDuplicate ? "（本頁已選）" : ""}</option>`;
    }).join("")}</select>${selected[index] === "common-sign" ? optionNote("通用手語用手勢溝通，和通用語是不同語言。") : ""}</div>`;
    const grantedLine = grantedLanguages.length ? `你也學會了${grantedLanguages.join("、")}，不用另外選。` : "";
    body.innerHTML = `<h3>${CLASS_LABELS[draft.choices.class]}：初始語言</h3><p class="quick-build-lead">你已經會通用語，再選 2 種語言。不確定就選隊友會說的，或問 DM。${escapeHtml(grantedLine)}</p>${optionNote("語言只影響角色能和誰溝通，不影響戰鬥數值。")}<section class="quick-build-choice-panel"><div class="quick-build-spell-fields">${Array.from({ length: LEVEL_ONE_DEFINITIONS[draft.choices.class].languages }, (_, index) => select(index)).join("")}</div></section>`;
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
    const extraCantripName = key === "druid"
      ? definition.classOption?.options.find(option => option.id === definition.extraCantripOption)?.label
      : CLASS_TYPE_OPTIONS[key]?.find(option => option.id === definition.extraCantripClassType)?.label;
    const hasExtraCantrip = Boolean(definition.cantrips) && cantripCount > definition.cantrips;
    const cantripNote = [`小型法術，想用幾次就用幾次，不消耗法術位。${definition.spellChange?.cantrip || ""}`, hasExtraCantrip ? `因為選了${extraCantripName}，多學 1 個${CLASS_LABELS[key]}戲法。` : ""].filter(Boolean).join("\n");
    const cantripLabel = index => hasExtraCantrip && index >= definition.cantrips ? `戲法 ${index + 1}（${extraCantripName}額外）` : `戲法 ${index + 1}`;
    if (cantripCount) sections.push(`<section class="quick-build-choice-panel"><h4>戲法</h4>${optionNote(cantripNote)}<div class="quick-build-spell-fields">${Array.from({ length: cantripCount }, (_, index) => spellSelectControl(`quick-build-cantrip-${index}`, cantripLabel(index), levelOneSpellOptions(key, "cantrips"), cantrips[index] || "", cantrips, knownFor("1 級戲法"), "data-level-one-cantrip")).join("")}</div></section>`);
    if (definition.spellbookSpells) sections.push(`<section class="quick-build-choice-panel"><h4>法術書法術</h4>${optionNote(`法術書是你的法術庫，先記下 ${definition.spellbookSpells} 個 1 環法術。\n標「（儀式）」的不用準備也能施放：多花 10 分鐘、要讀法術書，不耗法術位。`)}<div class="quick-build-spell-fields">${Array.from({ length: definition.spellbookSpells }, (_, index) => spellSelectControl(`quick-build-spellbook-${index}`, `法術書 ${index + 1}`, levelOneSpellOptions("wizard", "1"), spellbook[index] || "", spellbook, knownFor(["法術書", "1 級準備法術"]), "data-level-one-spellbook")).join("")}</div></section>`);
    if (definition.preparedSpells) {
      const spells = definition.spellbookSpells ? spellbook.map(name => canonicalSpell(name)).filter(Boolean) : levelOneSpellOptions(key, "1");
      const slots = window.getClassProgressionValue?.(key, definition.spellSlotKey || "spellSlots1", QUICK_BUILD_LEVEL);
      const slotRecovery = definition.spellSlotRecovery || "長休後";
      const preparedNote = definition.spellbookSpells
        ? `從法術書挑 ${definition.preparedSpells} 個準備好的法術，冒險時就能施放；每次長休後可全部更換。\n你有 ${slots} 個 1 環法術位，${slotRecovery}全部恢復。`
        : `準備好的法術才能施放，每施放一次通常要用掉 1 個法術位。\n你有 ${slots} 個 1 環法術位，${slotRecovery}全部恢復。${definition.spellChange?.prepared ? `\n準備的法術${definition.spellChange.prepared}` : ""}`;
      const alwaysPrepared = (definition.alwaysPrepared || []).map(spellId => {
        const intro = (definition.alwaysPreparedIntros?.[spellId] || "").replace("{宿敵次數}", window.getClassProgressionValue?.(key, "favoredEnemy", QUICK_BUILD_LEVEL));
        return `<div class="quick-build-field-control quick-build-fixed-tool"><div>${escapeHtml(spellNameZh(spellId))}：${escapeHtml(intro)}</div><button type="button" class="quick-build-spell-view" data-always-prepared-view="${escapeHtml(spellId)}">查看</button></div>`;
      }).join("");
      const alwaysPreparedBlock = alwaysPrepared ? `<div class="quick-build-fixed-list"><strong>已自動準備，不佔上面的名額：</strong>${alwaysPrepared}</div>` : "";
      sections.push(`<section class="quick-build-choice-panel"><h4>準備法術</h4>${optionNote(preparedNote)}<div class="quick-build-spell-fields">${Array.from({ length: definition.preparedSpells }, (_, index) => spellSelectControl(`quick-build-prepared-${index}`, `準備法術 ${index + 1}`, spells, prepared[index] || "", prepared, knownFor(definition.spellbookSpells ? ["1 級準備法術", "法術書"] : "1 級準備法術"), "data-level-one-prepared", Boolean(definition.spellbookSpells))).join("")}</div>${alwaysPreparedBlock}</section>`);
    }
    if ((choices.invocations || []).includes("pact-of-the-tome")) {
      const tome = choices.tome || {};
      const tomeCantrips = tome.cantrips || [];
      const tomeRituals = tome.rituals || [];
      sections.push(`<section class="quick-build-choice-panel"><h4>書之魔契</h4>${optionNote("你有一本影之書，持有時多會下面這些法術，任一職業的都能選。\n它們視為已準備，不佔上面的名額。")}<div class="quick-build-spell-fields"><p class="quick-build-subheading">3 個戲法：不耗法術位、次數不限。</p>${Array.from({ length: 3 }, (_, index) => spellSelectControl(`quick-build-tome-cantrip-${index}`, `影之書戲法 ${index + 1}`, allSpellOptions("cantrips"), tomeCantrips[index] || "", tomeCantrips, knownFor("書之魔契"), "data-level-one-tome-cantrip")).join("")}<p class="quick-build-subheading">2 個 1 環儀式法術：多花 10 分鐘施放就不耗法術位。</p>${Array.from({ length: 2 }, (_, index) => spellSelectControl(`quick-build-tome-ritual-${index}`, `影之書儀式 ${index + 1}`, allSpellOptions("1", isRitualSpell), tomeRituals[index] || "", tomeRituals, knownFor("書之魔契"), "data-level-one-tome-ritual")).join("")}</div></section>`);
    }
    body.innerHTML = `<h3>${CLASS_LABELS[key]}：法術選擇</h3><p class="quick-build-lead">已先幫你填好推薦法術，可以直接用；想換的話，按「查看」了解效果，再從選單改選。</p>${sections.join("")}`;
    body.querySelectorAll("[data-always-prepared-view]").forEach(button => button.addEventListener("click", event => {
      openSpellDetail(canonicalSpell(button.dataset.alwaysPreparedView), event.currentTarget);
    }));
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
    const select = index => {
      const selectId = `quick-build-mastery-${index}`;
      const masteryName = options.find(([name]) => name === selected[index])?.[1];
      return `<div class="quick-build-field"><label for="${selectId}">精通武器 ${index + 1}</label><div class="quick-build-field-control"><select id="${selectId}" data-level-one-mastery><option value="">-- 選擇精通武器 --</option>${options.map(([name, mastery]) => {
      const peerDuplicate = selected.includes(name) && selected[index] !== name;
      return `<option value="${escapeHtml(name)}"${selected[index] === name ? " selected" : ""}${peerDuplicate ? " disabled" : ""}>${escapeHtml(name)}（${escapeHtml(mastery)}）${peerDuplicate ? "（本頁已選）" : ""}</option>`;
    }).join("")}</select>${weaponMasteryDescriptionButton(masteryName)}</div>${optionNote(WEAPON_MASTERY_SUMMARIES[masteryName])}</div>`;
    };
    const prefilled = selected.some(Boolean) && (LEVEL_ONE_DEFINITIONS[key].defaultWeaponMasteries || LEVEL_ONE_DEFINITIONS[key].prefillMasteryFromDefaultWeapon);
    const prefillNote = !prefilled ? "" : draft.choices.classEquipmentMethod === "gold" ? "已先填好新手推薦，可直接用或自行更換；空格再自己選。" : "已先填入初始裝備的武器，可直接用，也能改。";
    body.innerHTML = `<h3>${CLASS_LABELS[key]}：選 ${count} 種精通武器</h3><p class="quick-build-lead">用這些武器攻擊時，多一種戰術效果。選你實際會用的武器，長休後可改選。${prefillNote}</p><section class="quick-build-choice-panel"><div class="quick-build-spell-fields">${Array.from({ length: count }, (_, index) => select(index)).join("")}</div></section>${conceptHelp("什麼是武器精通？ ℹ️")}`;
    body.querySelectorAll("[data-level-one-mastery]").forEach(selectEl => selectEl.addEventListener("change", () => updateLevelOneField(next => { next.weaponMasteries = [...body.querySelectorAll("[data-level-one-mastery]")].map(item => item.value || ""); })));
  }

  function renderLevelOneExpertise(body) {
    const selected = draft.choices.levelOne?.expertise || [];
    const options = orderedSkillOptions(expertiseSkillOptions(draft));
    const requiredCount = LEVEL_ONE_DEFINITIONS[draft.choices.class].expertise;
    const select = index => {
      const current = selected[index] || "";
      const stale = current && !options.includes(current) ? `<option value="${escapeHtml(current)}" selected>${escapeHtml(skillOptionLabel(current))}（目前未熟練）</option>` : "";
      const selectId = `quick-build-expertise-${index}`;
      return `<div class="quick-build-field"><label for="${selectId}">專精 ${index + 1}</label><div class="quick-build-field-control"><select id="${selectId}" data-level-one-expertise><option value="">請選擇</option>${stale}${options.map(name => {
        const peerDuplicate = selected.includes(name) && current !== name;
        return `<option value="${escapeHtml(name)}"${current === name ? " selected" : ""}${peerDuplicate ? " disabled" : ""}>${escapeHtml(skillOptionLabel(name))}${peerDuplicate ? "（本頁已選）" : ""}</option>`;
      }).join("")}</select>${skillDescriptionButton(current)}</div></div>`;
    };
    body.innerHTML = `<h3>${CLASS_LABELS[draft.choices.class]}：專精</h3><section class="quick-build-choice-panel"><p class="quick-build-option-note">從你已熟練的技能中選 ${requiredCount} 項，擲骰時的額外加分加倍（+${quickBuildProficiencyBonus()} 變成 +${quickBuildProficiencyBonus() * 2}）。${draft.choices.class === "rogue" ? "\n推薦：巧手、隱匿。清單裡找不到的技能，代表你還沒熟練，可以回步驟 3 調整。" : ""}</p><div class="quick-build-spell-fields">${Array.from({ length: requiredCount }, (_, index) => select(index)).join("")}</div></section>`;
    body.querySelectorAll("[data-level-one-expertise]").forEach(selectEl => selectEl.addEventListener("change", () => updateLevelOneField(next => { next.expertise = [...body.querySelectorAll("[data-level-one-expertise]")].map(item => item.value || ""); })));
  }

  function alignmentLabel(value = draft.choices.alignment) {
    return ALIGNMENT_OPTIONS.find(([optionValue]) => optionValue === value)?.[1] || "";
  }

  function renderLevelOneAlignment(body) {
    body.innerHTML = `<h3>選擇陣營</h3><p class="quick-build-lead">陣營是角色的行事與道德傾向，用來幫助扮演，不影響數值。</p>${optionNote("不確定就選中立善良，或問 DM 有沒有限制。")}<section class="quick-build-choice-panel"><div class="quick-build-field"><label for="quick-build-alignment">陣營</label><select id="quick-build-alignment" data-level-one-alignment><option value="">請選擇</option>${ALIGNMENT_OPTIONS.map(([value, label]) => `<option value="${value}"${draft.choices.alignment === value ? " selected" : ""}>${escapeHtml(label)}</option>`).join("")}</select>${optionNote(ALIGNMENT_DESCRIPTIONS[draft.choices.alignment])}</div></section>`;
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
      return !text || text === "無" || text === "—" ? "" : `<dt>${summaryLabel(label)}</dt><dd>${escapeHtml(text)}</dd>`;
    };
    const spellbookSummary = content.spellbookSpells?.length
      ? `法術書：一環-${content.spellbookSpells.map(spellId => `${spellNameZh(spellId)}${isRitualSpell(canonicalSpell(spellId)) ? "（儀式）" : ""}`).join("、")}`
      : "";
    const summaryRows = [
      summaryRow("職業特性", levelOneFeatureNames(draft.choices.class).join("、")),
      summaryRow("職業選項", optionSummary),
      summaryRow("技能額外加值", groupedSourceAcquisitions("skillBonuses", () => true, compactFeatureSource)),
      summaryRow("戲法", (content.cantrips || []).concat(content.tome?.cantrips || []).map(spellNameZh).join("、")),
      summaryRow("準備法術", (content.preparedSpells || []).concat(content.tome?.rituals || []).map(spellNameZh).join("、")),
      summaryRow("法術書", spellbookSummary),
      summaryRow("武器精通", (content.weaponMasteries || []).join("、")),
      summaryRow("專精", (content.expertise || []).join("、")),
      summaryRow("語言", (content.languages || []).map(value => LANGUAGE_OPTIONS.find(option => option.value === value)?.label || value).join("、")),
      summaryRow("陣營", alignmentLabel())
    ].join("");
    const summarySection = summaryRows ? `<section class="quick-build-complete"><dl class="quick-build-summary-list">${summaryRows}</dl></section>` : "";
    body.innerHTML = `<h3>${CLASS_LABELS[draft.choices.class]}：最後選擇摘要</h3>${pending.length ? `<div class="quick-build-warning"><strong>還有這些沒選</strong><br>${pending.map(escapeHtml).join("<br>")}</div>` : `<section class="quick-build-complete"><strong>都選好了！下一步確認整張角色卡。</strong></section>`}${summarySection}${duplicateReviewWarning()}`;
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

  function groupedSourceAcquisitions(type, predicate = () => true, formatSource = item => item.source?.label || item.sourceType || "未知來源") {
    const entries = (draft.acquisitions[type] || []).filter(item => acquisitionAppliesAtLevel(item) && predicate(item));
    if (!entries.length) return "無";
    const groups = [];
    entries.forEach(item => {
      const source = formatSource(item);
      const gainedAt = Number(item.content?.gainedAt) > 1 ? `，${item.content.gainedAt} 級取得` : "";
      const sourceText = `${source}${gainedAt}`;
      const lastGroup = groups[groups.length - 1];
      if (lastGroup?.source === sourceText) lastGroup.names.push(item.name);
      else groups.push({ source: sourceText, names: [item.name] });
    });
    return groups.map(group => `${group.names.join("、")}${group.source ? `（${group.source}）` : ""}`).join("\n");
  }


  function compactFeatureSource(item) {
    return item.source?.feature || item.source?.label || item.sourceType || "未知來源";
  }

  function compactExpertiseSource(item) {
    const sourceLabel = item.source?.label || item.sourceType || "未知來源";
    const feature = String(item.source?.feature || "").replace(/\s*1\s*級/u, "").trim();
    if (!feature || feature === "專精") return `${sourceLabel}專精`;
    return feature;
  }

  function raceOptionSummary() {
    const options = draft.choices.raceOptions || {};
    const labels = { ancestry: raceRules(draft.choices.race)?.choice?.label || "血統", lineage: "傳承／血統", legacy: "邪魔遺贈", size: "體型", skill: "技能", cantrip: "戲法", feat: "起源專長" };
    const details = Object.entries(options)
      .filter(([key, value]) => labels[key] && typeof value === "string" && value)
      .map(([key, value]) => `${labels[key]}：${key === "cantrip" ? spellNameZh(value) : key === "feat" ? humanOriginFeatLabel(value) : key === "ancestry" && draft.choices.race === "goliath" ? raceChoiceOption("goliath", options)?.label || value : value}`);
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
    const selectedLanguages = groupedSourceAcquisitions("languages", () => true, item => {
      if (item.sourceId === "rogue") return CLASS_LABELS.rogue;
      if ((raceRules(draft.choices.race)?.languageOptions || []).includes(item.content?.value)) return raceName(draft.choices.race);
      return "";
    });
    const languageSummary = [selectedLanguages === "無" ? "" : selectedLanguages, ...fixedSpecialLanguages].filter(Boolean).join("\n") || "無";
    const levelOneOptions = [classOption, ...invocations].filter(Boolean).join("、") || "無";
    const fightingStyle = levelOne.fightingStyle || "無";
    const weaponMasteries = (levelOne.weaponMasteries || []).map(name => {
      const { simple, martial } = weaponMasteryCatalog();
      const mastery = [...simple, ...martial].find(weapon => weapon.名稱 === name)?.精通;
      return mastery ? `${name}（${mastery}）` : name;
    }).join("、") || "無";
    const duplicateWarning = duplicateReviewWarning();
    const summaryField = (label, value, grouped = false) => value === "無" ? "" : `<dt>${summaryLabel(label)}</dt><dd${grouped ? ' class="quick-build-source-groups"' : ""}>${escapeHtml(value)}</dd>`;
    body.innerHTML = `<h3>1 級角色總覽</h3><p class="quick-build-lead">確認角色內容。匯入後，這名角色會取代目前角色卡上的資料。</p>${duplicateWarning}
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
        ${summaryField("1 級職業特性", levelOneFeatureNames(draft.choices.class).join("、") || "無")}
        ${summaryField("職業選項", levelOneOptions)}
        ${summaryField("專長", sourceAwareAcquisitions("feats", item => item.content?.type !== "fightingStyle", item => item.source?.label || item.sourceType || "未知來源"))}
        ${summaryField("戰鬥風格", fightingStyle)}
        ${summaryField("武器精通", weaponMasteries)}
        ${summaryField("技能熟練", groupedSourceAcquisitions("skills"), true)}
        ${summaryField("專精", groupedSourceAcquisitions("expertise", () => true, compactExpertiseSource), true)}
        ${summaryField("技能額外加值", groupedSourceAcquisitions("skillBonuses", () => true, compactFeatureSource), true)}
        ${summaryField("工具熟練", groupedSourceAcquisitions("tools"), true)}
        ${summaryField("語言", languageSummary, true)}
        ${summaryField("法術", groupedSourceAcquisitions("spells"), true)}
      </dl></section>
      <section class="quick-build-choice-panel quick-build-review-panel"><h4>裝備選擇</h4><dl class="quick-build-summary-list">
        ${summaryField("背景裝備", formatEquipmentSelection(draft.selections.backgroundEquipment))}
        ${summaryField("職業裝備", formatEquipmentSelection(draft.selections.classEquipment))}
        ${summaryField("商店購買", formatShopItems(shopItems()) || "無")}
        ${shopItems().length ? summaryField("匯入後財產", formatCopperAmount(shopBalanceCopper())) : ""}
      </dl></section>`;
  }

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
      if (element.type === "file") return;
      if (element.type === "checkbox") blankState[element.id] = element.defaultChecked;
      else if (element.tagName === "SELECT") blankState[element.id] = [...element.options].find(option => option.defaultSelected)?.value ?? element.options[0]?.value ?? "";
      else blankState[element.id] = element.defaultValue;
    });
    blankState.__spellManagement = { version: 2, manual: false, entries: [] };
    // 沿用目前角色「只以文字管理物品」的選擇。
    blankState.__inventory = window.Inventory?.isTextOnly() ? { version: 1, textOnly: true, items: [] } : { version: 1, items: [] };
    // 重置角色卡時一併清掉各職業的法術與職業選項記憶；舊版遷移備份與提醒偏好保留。
    window.SpellManagement?.clearMemories?.({ memoriesOnly: true });
    window.ClassOptionMemory?.clearMemories?.();
    blankState["feats-area-count"] = 2;
    blankState["tool-proficiency-list-count"] = 1;
    blankState["tool-proficiency-0"] = "";
    applyStateObject(blankState);
    const highLevelSpells = document.getElementById("highlevel-spells");
    if (highLevelSpells) highLevelSpells.style.display = "none";
    return true;
  }

  function fullMobileSpellName(classId, level, spellId) { return SpellCatalog.getSpells(classId, level).some(spell => spell.spellId === spellId) ? spellDisplayName(spellId) : ""; }
  function chooseMobileSpellClass(level, spellId, preferredClass = "") {
    const allowed = level === "cantrips" ? CLASS_ORDER.filter(id => !["barbarian", "fighter", "monk", "paladin", "ranger", "rogue"].includes(id)) : [...SPELLCASTER_CLASS_IDS];
    return [preferredClass, ...allowed].find((classId, index, values) => classId && values.indexOf(classId) === index && fullMobileSpellName(classId, level, spellId)) || "";
  }

  function addManualMobileSpell({ spellId, level, classId }, warnings) {
    const sourceClass = chooseMobileSpellClass(level, spellId, classId);
    if (!sourceClass) {
      mobileImportWarning(`法術「${spellNameZh(spellId)}」：找不到可匯入的職業或環位選項`, warnings);
      return false;
    }
    if (!window.SpellManagement?.addPlayerSpell?.(spellId, { spellClass: sourceClass })) {
      mobileImportWarning(`法術「${spellNameZh(spellId)}」：無法加入目前準備清單`, warnings);
      return false;
    }
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

  // 物品欄的加入請求；裝備說明沒有的物品（例如法術書）帶內容檔給的重量。
  function mobileEquipmentRequests(selection) {
    const texts = mobileEquipmentItems(selection);
    return (selection?.content?.items || []).map((item, index) => ({ text: texts[index], ...(Number.isFinite(item?.weight) ? { weight: item.weight } : {}) }));
  }

  function importMobileEquipment(warnings) {
    const equipmentSelections = [draft.selections.backgroundEquipment, draft.selections.classEquipment].filter(Boolean);
    const items = equipmentSelections.flatMap(mobileEquipmentItems);
    // 初始裝備放進物品欄（套組拆成容器與內容物），要在寫入主手／副手／護甲之前，裝備下拉才有選項；
    // 只以文字管理物品時寫成攜帶物品的「初始裝備：」行。
    if (window.Inventory && !window.Inventory.isTextOnly()) {
      window.Inventory.clear();
      if (items.length && !window.Inventory.add(equipmentSelections.flatMap(mobileEquipmentRequests), { source: "initial" })) mobileImportWarning("初始裝備：物品欄放不下", warnings);
      setMobileField("gear-notes", "", warnings, "攜帶物品", "input");
    } else {
      setMobileField("gear-notes", items.length ? `${MOBILE_INITIAL_EQUIPMENT_PREFIX}${items.join("、")}` : "", warnings, "攜帶物品", "input");
    }
    const currency = { cp: 0, sp: 0, gp: 0, pp: 0 };
    equipmentSelections.forEach(selection => Object.keys(currency).forEach(key => { currency[key] += Number(selection.content?.currency?.[key]) || 0; }));
    Object.entries(currency).forEach(([key, amount]) => setMobileField(`money-balance-${key}`, amount, warnings, `${key} 財產`));
    dispatchMobileField(document.getElementById("money-count-weight"));

    const loadout = draft.selections.classEquipment?.content?.loadout || {};
    const offHandAsMain = document.getElementById("offHandAsMain");
    if (offHandAsMain) {
      offHandAsMain.checked = false;
      dispatchMobileField(offHandAsMain);
    }
    setMobileField("mainHand", loadout.mainHand || "", warnings, "主手");
    setMobileField("offHand", loadout.offHand || "", warnings, "副手");
    setMobileField("armor", loadout.armor || "", warnings, "護甲");
    (draft.selections.classEquipment?.content?.specialWrites || []).forEach(operation => {
      if (operation.field === "offHandAttackNote" && operation.note) setMobileField("atk-off-note", operation.note, warnings, "副手備註", "input");
    });
  }

  // 起始財產寫入後，把暫存的購買清單一次交給角色卡的結帳入口，留下交易紀錄並合併攜帶物品。
  async function importMobileShopPurchases(warnings) {
    const items = shopItems();
    if (!items.length) return;
    const label = formatShopItems(items);
    if (typeof window.MoneyTracker?.purchaseItems !== "function") {
      mobileImportWarning(`商店購買「${label}」：找不到角色卡的結帳介面`, warnings);
    } else if (shopItemsCopper(items) > (window.MoneyTracker.readTotal?.() ?? 0)) {
      mobileImportWarning(`商店購買「${label}」：角色卡財產不足，未匯入`, warnings);
    } else if (!(await window.MoneyTracker.purchaseItems(items))) {
      mobileImportWarning(`商店購買「${label}」：無法寫入角色卡`, warnings);
    }
  }

  // 血統選項：草稿值（choice.draftField）換成角色卡血統選單的值；血統的自選戲法寫入對應選單。
  function importMobileRaceOptions(warnings) {
    const raceId = draft.choices.race;
    const choice = raceRules(raceId)?.choice;
    const lineageOption = raceChoiceOption(raceId, draft.choices.raceOptions);
    if (choice) {
      const sourceValue = draft.choices.raceOptions?.[choice.draftField];
      if (!lineageOption) mobileImportWarning(`${raceName(raceId)}選項「${sourceValue || "未選擇"}」：無法對應角色卡`, warnings);
      else setMobileField(choice.id, lineageOption.value, warnings, `${raceName(raceId)}選項`);
    }
    if (lineageOption?.cantripChoice && draft.choices.raceOptions?.cantrip) {
      const select = document.getElementById(lineageOption.cantripChoice.field);
      const option = [...(select?.options || [])].find(item => item.value === draft.choices.raceOptions.cantrip);
      if (!select || !option) mobileImportWarning(`${lineageOption.label}戲法「${draft.choices.raceOptions.cantrip}」：找不到角色卡選項`, warnings);
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
    // 武器精通寫進職業頁的武器精通選單（內容檔 picks 的存檔欄位，依序對應）。
    const masteryFields = (window.getClassPicks?.(draft.choices.class, QUICK_BUILD_LEVEL, { kind: "weaponMastery" }) || []).flatMap(({ pick }) => pick.fields);
    if ((levelOneContent.weaponMasteries || []).length) window.renderClassPickChoices?.();
    (levelOneContent.weaponMasteries || []).forEach((name, index) => {
      if (masteryFields[index]) setMobileField(masteryFields[index], name, warnings, `武器精通 ${index + 1}`);
      else mobileImportWarning(`武器精通「${name}」：找不到角色卡欄位`, warnings);
    });
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
    const skillBonuses = (draft.acquisitions.skillBonuses || []).map(item => {
      const feature = item.source?.feature || item.source?.label || "職業能力";
      const source = feature.includes("：") ? feature.split("：").at(-1) : feature;
      return `${item.name}（${source}）`;
    });
    const backgroundTool = draft.selections.background?.content?.tool || draft.choices.backgroundToolChoice || "";
    if (typeof window.replaceToolProficiencies === "function") {
      window.replaceToolProficiencies(toolNames, { backgroundTool });
    } else {
      mobileImportWarning("找不到工具熟練匯入介面", warnings);
    }
    const skillNotes = [skillBonuses.length ? skillBonuses.join("\n") : ""].filter(Boolean);
    setMobileField("skill-extra", skillNotes.join("；"), warnings, "技能筆記", "input");

    const languageDetails = draft.selections.levelOne?.content?.languageDetails || [];
    languageDetails.forEach(item => setMobileField(item.fieldId, item.value, warnings, item.category === "class-extra" ? "職業額外語言" : `語言 ${item.slot + 1}`));
  }

  function importMobileFeats(warnings) {
    const backgroundMagic = draft.choices.backgroundMagic || {};
    if (backgroundSpellList(draft.choices.background)) {
      const row = document.getElementById("derived-feat-background")?.closest(".form-row");
      setMobileMagicInitiate(row, spellSourceForBackground(draft.choices.background), backgroundMagic.cantrips, backgroundMagic.levelOneSpells, warnings, "背景魔法學徒");
    }
    if (draft.choices.race === "human" && draft.choices.raceOptions?.feat) {
      const feat = draft.choices.raceOptions.feat;
      setMobileField("feat-choice-human-origin", feat, warnings, "人類起源專長");
      const row = document.getElementById("derived-feat-human-origin")?.closest(".form-row");
      if (feat === "魔法學徒") {
        const options = draft.choices.raceOptions.featOptions || {};
        setMobileMagicInitiate(row, options.spellClass, options.cantrips, options.levelOneSpells, warnings, "人類魔法學徒");
      }
    }
    const fightingStyle = draft.selections.levelOne?.content?.fightingStyle;
    if (fightingStyle) {
      const select = document.getElementById(`feat-choice-fighting-style-${draft.choices.class}`);
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
    const cantrips = [...(content.cantrips || [])];
    const missionId = { cleric: "cleric-trickster", druid: "druid-shaman" }[draft.choices.class];
    if (missionId && document.getElementById(missionId)?.checked
        && cantrips.length > LEVEL_ONE_DEFINITIONS[draft.choices.class].cantrips) {
      setMobileField(`${missionId}-cantrip`, cantrips.pop(), warnings, "使命額外戲法");
    }
    cantrips.forEach(spellId => addManualMobileSpell({ spellId, level: "cantrips", classId: draft.choices.class }, warnings));
    if (draft.choices.class === "wizard") {
      window.Spellbook.setState({ spellIds: content.spellbookSpells || [] }, { sync: false });
    }
    (content.preparedSpells || []).forEach(spellId => addManualMobileSpell({ spellId, level: 1, classId: draft.choices.class }, warnings));
    if (typeof syncOriginAndSubclassDerivedSpellRows === "function") syncOriginAndSubclassDerivedSpellRows();
    if (typeof updatePickedSpellBoxes === "function") updatePickedSpellBoxes();
  }

  function finishMobileImport(warnings) {
    if (typeof fillSaves === "function") {
      window.applyClassSaveProficiencies?.();
      fillSaves();
    } else mobileImportWarning("無法計算屬性豁免", warnings);
    if (typeof fillSkills === "function") fillSkills();
    else mobileImportWarning("無法計算技能加值", warnings);
    const automation = document.getElementById("weapon-attack-automation");
    if (automation) {
      automation.checked = true;
      dispatchMobileField(automation);
    } else mobileImportWarning("找不到武器攻擊自動化開關", warnings);
    if (typeof populateHandAttacks === "function") populateHandAttacks({ force: true });
    if (typeof updateSpellCastingStats === "function") updateSpellCastingStats();
    if (typeof updateHPDisplay === "function") updateHPDisplay();
    setMobileField("hp", document.getElementById("hp-display")?.value, warnings, "目前 HP", "input");
    if (typeof saveAllFields === "function") saveAllFields();
  }

  async function importDraftToMobileCard(event) {
    if (window.SHARE_MODE === true) return;
    const confirmed = await window.AppDialog.requestDecision({
      title: "匯入至角色卡",
      message: "這會清除目前角色卡的所有角色資料，且無法復原。",
      cancelLabel: "保留目前資料",
      confirmLabel: "刪除並匯入",
      intent: "danger",
      trigger: event?.currentTarget
    });
    if (!confirmed) return;
    saveDraft();
    const warnings = [];
    window.SpellManagement?.beginRestoreBatch();
    if (!resetMobileCardForImport(warnings)) {
      window.SpellManagement?.endRestoreBatch();
      await window.AppDialog.showMessage({
        title: "匯入失敗",
        message: warnings.join("\n") || "無法重置目前角色卡。",
        confirmLabel: "關閉"
      });
      return;
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
      await importMobileShopPurchases(warnings);
      importMobileSpells(warnings);
      finishMobileImport(warnings);
      completed = true;
    } catch (error) {
      console.warn("創角小幫手匯入角色卡時發生錯誤：", error);
      mobileImportWarning(`匯入流程中斷：${error?.message || "未知錯誤"}`, warnings);
    } finally {
      window.SpellManagement?.endRestoreBatch();
      window.SpellManagement?.setPlayerEntries(window.SpellManagement.getPlayerEntries());
    }
    closeWizard();
    if (completed) window.twAnalytics?.track?.("quick_build_complete");
    if (completed && warnings.length) window.twAnalytics?.track?.("quick_build_with_warnings");
    const warningText = warnings.length ? `\n\n以下項目未完成匯入：\n${warnings.map(item => `• ${item}`).join("\n")}` : "";
    const completionAction = await window.AppDialog.showMessage({
      title: completed ? "角色卡匯入完成" : "角色卡部分匯入",
      variant: completed ? "quick-build-complete" : undefined,
      message: completed ? "" : `角色卡只完成部分匯入，請依下列問題檢查。${warningText}`,
      renderContent: completed ? body => {
        body.innerHTML = `<p><strong>角色完成，可以開始冒險了！</strong></p>
          <ul>
            <li>下載PDF：下載可列印的角色卡，方便面團使用。</li>
            <li>分享角卡：取得網址連結，將角色卡分享給 DM 查看。</li>
            <li>初次遊玩：透過導覽，認識手機跑團模式的基本操作。</li>
          </ul>`;
        if (warningText) {
          const warning = document.createElement("p");
          warning.textContent = warningText.trim();
          body.appendChild(warning);
        }
      } : undefined,
      actions: completed ? [
        { label: "下載PDF", intent: "secondary", value: "download-compact-pdf" },
        { label: "分享角卡", intent: "secondary", value: "share-card" },
        { label: "初次遊玩", intent: "primary", value: "first-table", disabled: warnings.length > 0 }
      ] : undefined,
      confirmLabel: "知道了"
    });
    if (completionAction === "download-compact-pdf") {
      await window.downloadQuickBuildCompactPdf?.();
    } else if (completionAction === "share-card" && completed) {
      await window.copyShareUrl?.();
    } else if (completionAction === "first-table" && completed && warnings.length === 0) {
      await window.onboardingTour?.startTabletop?.();
    }
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
    if (backgroundToolChoices(draft.choices.background)) appendFlowSection(body, renderBackgroundToolChoice, "background-tool");
    if (backgroundSpellList(draft.choices.background)) appendFlowSection(body, renderBackgroundSpells, "background-spells");
  }

  function renderRaceEdit(body) {
    appendFlowSection(body, renderRaceCards, "race-choice");
    if (!draft.choices.race || !raceHasDraftOptions(draft.choices.race)) return;
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
    if (!equipmentComplete()) return;
    appendFlowSection(body, renderEquipmentShop, "equipment-shop");
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
    if ((LEVEL_ONE_FEATURE_INTROS[draft.choices.class] || []).length) appendFlowSection(body, renderLevelOneFeatures, "level-one-features");
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
    ["level-one", { id: "level-one", title: "最後選擇", renderEdit: renderLevelOneEdit, renderReview: body => renderStepReview(body, renderLevelOneSummary), isComplete: levelOneComplete }],
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

  // 快速創角視窗內的控制項只用來編輯 draft；標成 transient，角色卡的 autosave、JSON 與分享不收集也不還原它們。
  function markTransientControls(root) {
    root.querySelectorAll("input, select, textarea").forEach(control => { control.dataset.stateTransient = "true"; });
  }

  function render(preserveBodyScroll = false) {
    const modal = ensureWizard();
    const nextButton = modal.querySelector(".quick-build-next");
    const nextWasIncomplete = nextButton.classList.contains("is-incomplete");
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
        '<div class="quick-build-warning" role="alert"><strong>工具資料載入失敗</strong><br>快速創角仍可使用，但士兵賭具、吟遊詩人與武僧的工具選擇，以及「熟習」的工具選項目前不可用。請重新載入頁面；若問題持續，請確認 tool-data.js 可正常載入。</div>'
      );
    }
    markTransientControls(modal);
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
    modal.querySelector(".quick-build-review-footer").hidden = stepMeta.id !== "level-one-review";
    previous.disabled = stepIndex === 0;
    modify.hidden = draft.ui.view !== "review";
    const nextIsIncomplete = draft.ui.view === "edit" && !stepIsComplete(step);
    next.disabled = false;
    next.classList.add("primary");
    next.classList.toggle("is-incomplete", nextIsIncomplete);
    next.classList.toggle("is-ready", nextWasIncomplete && !nextIsIncomplete);
    next.setAttribute("aria-label", nextIsIncomplete ? "下一步，目前尚有選項未完成" : "下一步");
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
    if (!BACKGROUND_ORDER.includes(key) || !presetBackground(key)) return;
    if (draft.choices.background === key) return;
    const backgroundChanged = Boolean(draft.choices.background && draft.choices.background !== key);
    const backgroundChangedAfterClassComplete = Boolean(backgroundChanged && classComplete(draft));
    const nextBackgroundAbilities = backgroundAbilityLabels(key);
    const preservedBonuses = normalizeBackgroundBonuses(draft.choices.backgroundAbilityBonuses, nextBackgroundAbilities);
    const bonusesRemainComplete = backgroundBonusTotal(preservedBonuses) === 3;
    draft.choices.background = key;
    // 保留裝備取得方式與仍合法的下游選擇；後續由有效內容簽章判斷哪些綠背需要重看。
    draft.choices.backgroundAbilityBonuses = preservedBonuses;
    const blockedSpellClass = backgroundSpellList(key);
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
    if (!raceIds().includes(key) || !raceData(key)) return;
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
    const definition = classEquipmentDefinition(draft.choices.class);
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
    if (field === raceRules(draft.choices.race)?.choice?.draftField && !raceChoiceOption(draft.choices.race, options)?.cantripChoice) delete options.cantrip;
    if (field === "feat") options.featOptions = {};
    draft.choices.raceOptions = options;
    clearFutureLevelChoices();
    saveDraft();
    render(true);
  }

  function showRaceSpellDescription(field, trigger) {
    const select = ensureWizard().querySelector(`#quick-build-race-${field}`);
    const spell = select?.value ? SpellCatalog.getSpells("wizard", "cantrips").find(entry => entry.spellId === select.value) || null : null;
    openSpellDetail(spell, trigger);
  }

  function showHumanFeatDescription(trigger) {
    const value = ensureWizard().querySelector("#quick-build-race-feat")?.value || "";
    openFeatDetail(value && window.getFeatText?.(value) ? { feat: value } : null, trigger);
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
    draft.choices.backgroundToolChoice = (backgroundToolChoices(draft.choices.background) || []).includes(value) ? value : null;
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

  function settleSpellPrepareDecision(result) {
    const resolve = spellPrepareDecisionResolver;
    spellPrepareDecisionResolver = null;
    resolve?.(result);
  }

  function finishSpellPrepareDecision(result) {
    const resolve = spellPrepareDecisionResolver;
    spellPrepareDecisionResolver = null;
    closeSpellDetail();
    resolve?.(result);
  }

  function openSpellDetail(spell, trigger, options = {}) {
    if (!options.askToPrepare) settleSpellPrepareDecision(false);
    const modal = ensureSpellDetailModal();
    const wizard = document.getElementById("quick-build-wizard");
    const wizardIsOpen = wizard?.classList.contains("open");
    const wizardShell = wizard?.querySelector(".quick-build-shell");
    const content = modal.querySelector("#quick-build-spell-detail-content");
    content.classList.remove("is-rich-text");
    const prepareFooter = modal.querySelector(".quick-build-spell-prepare");
    modal.querySelector("#quick-build-spell-detail-title").textContent = "法術詳情";
    // 只供查閱的法術（沒有網站版）只顯示 SRD 版，不詢問是否準備。
    const lookupOnly = Boolean(spell) && typeof spell === "object" && !canonicalSpell(spell.spellId);
    if (lookupOnly) options = { ...options, askToPrepare: false };
    prepareFooter.hidden = !options.askToPrepare;
    modal.querySelector("#quick-build-spell-prepare-question").textContent = options.question || "是否準備這個法術？";
    modal.querySelector(".quick-build-spell-prepare-confirm").textContent = options.confirmLabel || "準備法術";
    modal.querySelector(".quick-build-spell-prepare-cancel").textContent = options.cancelLabel || "暫不準備";
    spellbookWriteAction = options.askToPrepare && typeof options.onWriteSpellbook === "function"
      ? options.onWriteSpellbook : null;
    const writeButton = modal.querySelector(".quick-build-spellbook-write");
    writeButton.hidden = !spellbookWriteAction;
    writeButton.disabled = Boolean(options.spellbookAlreadyRecorded);
    writeButton.title = options.spellbookAlreadyRecorded ? "此法術已在法術書中" : "";
    prepareFooter.classList.toggle("has-spellbook-action", Boolean(spellbookWriteAction));
    spellDetailTrigger = trigger || document.activeElement;
    const record = typeof spell === "string" ? canonicalSpell(spell) : spell;
    const displayName = record && (lookupOnly ? `${record.nameZh} ${record.nameEn}` : spellDisplayName(record.spellId));
    content.innerHTML = record ? `<strong>${escapeHtml(displayName)}</strong>` : "<span>你還沒有選擇法術喔！</span>";
    const renderSite = lookupOnly ? null : target => {
      if (typeof window.appendSpellDescription === "function") {
        window.appendSpellDescription(target, record.spellId, record.desc, (node, text) => node.append(text));
      } else target.append(record.desc || "");
    };
    if (record && typeof window.createSpellVersionView === "function") content.appendChild(window.createSpellVersionView(record.spellId, renderSite));
    else if (record && renderSite) renderSite(content);
    if (options.stateNote) {
      const note = document.createElement("p");
      note.textContent = options.stateNote;
      content.appendChild(note);
    }
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

  function openSpellPrepareDetail(spellId, trigger, options = {}) {
    settleSpellPrepareDecision(false);
    const spell = canonicalSpell(spellId);
    if (!spell) {
      openSpellDetail(null, trigger);
      return Promise.resolve(false);
    }
    return new Promise(resolve => {
      spellPrepareDecisionResolver = resolve;
      openSpellDetail(spell, trigger, { ...options, askToPrepare: true });
    });
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

  // 1 級能力的「查看」：只顯示職業頁內容（classFeatures 是顯示用 HTML），以能力 id 取段落。
  function classFeatureSectionHtml(key, id) {
    const raw = typeof classFeatures === "undefined" ? "" : classFeatures[key];
    if (!raw) return "";
    const template = document.createElement("template");
    template.innerHTML = String(raw);
    return template.content.querySelector(`[data-feature-id="${CSS.escape(id)}"]`)?.innerHTML || "";
  }

  function invocationDetailFromClassFeatures(option) {
    const invocation = getEldritchInvocation(option?.label);
    return invocation ? classFeaturePlainText(`${invocation.name}\n${getFeatureChoiceSourceHtml(invocation)}`) : "";
  }

  function openInvocationDetail(option, trigger) {
    const detail = invocationDetailFromClassFeatures(option) || option?.description || "";
    openFeatDetail(detail, trigger, "魔能祈喚詳情");
  }

  // detail：{ feat: 專長 ID } 顯示專長說明（與角色卡相同）；文字（例如魔能祈喚說明）照原文顯示；空值為尚未選擇。
  function openFeatDetail(detail, trigger, title = "專長詳情") {
    const modal = ensureSpellDetailModal();
    const wizardShell = ensureWizard().querySelector(".quick-build-shell");
    const content = modal.querySelector("#quick-build-spell-detail-content");
    spellDetailTrigger = trigger || document.activeElement;
    modal.querySelector("#quick-build-spell-detail-title").textContent = title;
    modal.querySelector(".quick-build-spell-prepare").hidden = true;
    settleSpellPrepareDecision(false);
    content.classList.toggle("is-rich-text", Boolean(detail?.html));
    if (detail?.feat) {
      content.innerHTML = getFeatDescriptionHtml(detail.feat);
    } else if (detail?.html) {
      content.innerHTML = detail.html;
    } else if (detail) {
      content.textContent = detail;
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
    spellbookWriteAction = null;
    const modal = document.getElementById("quick-build-spell-detail");
    const wizardShell = document.querySelector("#quick-build-wizard .quick-build-shell");
    if (!modal?.classList.contains("open")) {
      if (modal) modal.inert = true;
      wizardShell?.removeAttribute("inert");
      wizardShell?.removeAttribute("aria-hidden");
      settleSpellPrepareDecision(false);
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
    settleSpellPrepareDecision(false);
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

  function firstIncompleteChoiceArea(body) {
    const candidates = body.querySelectorAll([
      "select:not(:disabled)",
      ".quick-build-background-grid",
      ".quick-build-class-grid",
      ".quick-build-equipment-actions"
    ].join(","));
    for (const candidate of candidates) {
      if (candidate.matches("select")) {
        if (candidate.value) continue;
        return {
          target: candidate.closest(".quick-build-choice-panel") || candidate.closest(".quick-build-field") || candidate,
          control: candidate
        };
      }
      const choiceButtons = [...candidate.querySelectorAll("button")];
      if (!choiceButtons.length || choiceButtons.some(button => button.classList.contains("is-selected") || button.getAttribute("aria-pressed") === "true")) continue;
      return {
        target: candidate.closest(".quick-build-choice-panel") || candidate,
        control: choiceButtons.find(button => !button.disabled) || null
      };
    }
    const sections = [...body.querySelectorAll(".quick-build-flow-section")];
    const section = sections[sections.length - 1];
    if (!section) return null;
    return {
      target: section.querySelector(".quick-build-choice-panel") || section,
      control: section.querySelector("select:not(:disabled),button:not(:disabled)")
    };
  }

  function clearIncompleteChoicePrompt(body) {
    body.querySelector(".quick-build-validation-message")?.remove();
    body.querySelectorAll(".quick-build-needs-attention").forEach(element => element.classList.remove("quick-build-needs-attention"));
    body.querySelectorAll("[data-quick-build-validation-control]").forEach(control => {
      const describedBy = (control.getAttribute("aria-describedby") || "").split(/\s+/u).filter(id => id && id !== "quick-build-validation-message");
      if (describedBy.length) control.setAttribute("aria-describedby", describedBy.join(" "));
      else control.removeAttribute("aria-describedby");
      control.removeAttribute("aria-invalid");
      control.removeAttribute("data-quick-build-validation-control");
    });
  }

  function revealFirstIncompleteChoice() {
    const body = ensureWizard().querySelector(".quick-build-body");
    clearIncompleteChoicePrompt(body);
    const incomplete = firstIncompleteChoiceArea(body);
    if (!incomplete?.target?.parentNode) return;
    const message = document.createElement("div");
    message.id = "quick-build-validation-message";
    message.className = "quick-build-validation-message";
    message.setAttribute("role", "alert");
    message.textContent = "這裡還有選項沒完成，選好才能下一步。";
    incomplete.target.parentNode.insertBefore(message, incomplete.target);
    incomplete.target.classList.add("quick-build-needs-attention");
    if (incomplete.control) {
      const describedBy = new Set((incomplete.control.getAttribute("aria-describedby") || "").split(/\s+/u).filter(Boolean));
      describedBy.add(message.id);
      incomplete.control.setAttribute("aria-describedby", [...describedBy].join(" "));
      if (incomplete.control.matches("select,input,textarea")) incomplete.control.setAttribute("aria-invalid", "true");
      incomplete.control.setAttribute("data-quick-build-validation-control", "");
    }
    const reveal = () => {
      const targetTop = body.scrollTop + message.getBoundingClientRect().top - body.getBoundingClientRect().top - 16;
      const reducedMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      body.scrollTo({ top: Math.max(0, targetTop), behavior: reducedMotion ? "auto" : "smooth" });
      incomplete.control?.focus?.({ preventScroll: true });
    };
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(reveal);
    else reveal();
  }

  function goNextStep() {
    const step = currentStepDefinition();
    if (draft.ui.view === "edit") {
      if (!stepIsComplete(step)) {
        revealFirstIncompleteChoice();
        return;
      }
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
      .filter(element => element !== modal && element.id !== "app-toast" && element.id !== "quick-build-spell-detail" && element.id !== "skillPopup" && element.id !== "weaponRulePopup")
      .map(element => ({ element, inert: element.inert }));
    inertElements.forEach(({ element }) => { element.inert = true; });
    pageLock = {
      scrollY, inertElements,
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverflow: document.body.style.overflow,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyRight: document.body.style.right,
      bodyLeft: document.body.style.left,
      bodyWidth: document.body.style.width
    };
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.right = "0";
    document.body.style.left = "0";
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
    document.body.style.right = saved.bodyRight;
    document.body.style.left = saved.bodyLeft;
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
    // Share mode keeps the shared identity and never imports a draft over it.
    if (window.SHARE_MODE === true) return;
    window.twAnalytics?.track?.("quick_build_start");
    const modal = ensureWizard();
    const wizardShell = modal.querySelector(".quick-build-shell");
    const spellDetail = document.getElementById("quick-build-spell-detail");
    ["skillPopup", "weaponRulePopup"].forEach(id => document.getElementById(id)?.style.setProperty("z-index", "10040"));
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
    syncShopCartFunding();
    expandedChoiceGroups.clear();
    pendingChoiceCardScrollGroup = null;
    render();
    modal.inert = false;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    lockPage();
    modal.querySelector(".quick-build-close")?.focus();
  }

  async function discardDraft(event) {
    const confirmed = await window.AppDialog.requestDecision({
      title: "重置快速創角",
      message: "背景、種族、職業、裝備與其他選擇都會清除，且無法復原。",
      cancelLabel: "保留進度",
      confirmLabel: "重置快速創角",
      intent: "danger",
      trigger: event?.currentTarget
    });
    if (!confirmed) return;
    storage.removeItem(STORAGE_KEY);
    draft = createDraft();
    syncShopCartFunding();
    expandedChoiceGroups.clear();
    pendingChoiceCardScrollGroup = null;
    closeWizard(false);
  }

  function closeWizard(save = true) {
    const modal = document.getElementById("quick-build-wizard");
    if (!modal?.classList.contains("open")) return;
    closeSpellDetail();
    ["skillPopup", "weaponRulePopup"].forEach(id => {
      const popup = document.getElementById(id);
      if (!popup) return;
      popup.style.display = "none";
      popup.style.removeProperty("z-index");
    });
    if (save) saveDraft();
    unlockPage();
    previouslyFocused?.focus?.();
    if (modal.contains(document.activeElement)) document.activeElement.blur();
    modal.inert = true;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  window.quickBuild = {
    open: openWizard, close: closeWizard, createDraft,
    openSpellDetail, openSpellPrepareDetail, openPactTomeModal,
    getDraft: () => structuredClone(draft), saveDraft,
    storageKey: STORAGE_KEY
  };
})();

(function attachCharacterRules(globalScope) {
  const HIT_DICE_BY_CLASS = Object.freeze({
    barbarian: Object.freeze({ Y: 12, Z: 7 }),
    fighter: Object.freeze({ Y: 10, Z: 6 }),
    paladin: Object.freeze({ Y: 10, Z: 6 }),
    ranger: Object.freeze({ Y: 10, Z: 6 }),
    bard: Object.freeze({ Y: 8, Z: 5 }),
    cleric: Object.freeze({ Y: 8, Z: 5 }),
    druid: Object.freeze({ Y: 8, Z: 5 }),
    monk: Object.freeze({ Y: 8, Z: 5 }),
    rogue: Object.freeze({ Y: 8, Z: 5 }),
    warlock: Object.freeze({ Y: 8, Z: 5 }),
    sorcerer: Object.freeze({ Y: 6, Z: 4 }),
    wizard: Object.freeze({ Y: 6, Z: 4 })
  });

  const CLASS_SAVE_PROFICIENCIES = Object.freeze({
    barbarian: Object.freeze(["str", "con"]),
    bard: Object.freeze(["dex", "cha"]),
    cleric: Object.freeze(["wis", "cha"]),
    druid: Object.freeze(["int", "wis"]),
    fighter: Object.freeze(["str", "con"]),
    monk: Object.freeze(["str", "dex"]),
    paladin: Object.freeze(["wis", "cha"]),
    ranger: Object.freeze(["str", "dex"]),
    rogue: Object.freeze(["dex", "int"]),
    sorcerer: Object.freeze(["con", "cha"]),
    warlock: Object.freeze(["wis", "cha"]),
    wizard: Object.freeze(["int", "wis"])
  });

  const FIXED_CHARACTER_SIZE_BY_RACE = Object.freeze({
    dragonborn: "中型",
    dwarf: "中型",
    elf: "中型",
    gnome: "小型",
    goliath: "中型",
    halfling: "小型",
    orc: "中型"
  });

  const NON_SPELLCASTER_CLASSES = new Set(["barbarian", "fighter", "monk", "rogue"]);
  const SPELLCASTER_CLASSES = new Set(["bard", "cleric", "druid", "paladin", "ranger", "sorcerer", "warlock", "wizard"]);
  const NON_SPELLCASTER_BACKGROUNDS = new Set(["soldier", "criminal"]);
  const SPELLCASTER_BACKGROUNDS = new Set(["acolyte", "sage"]);
  const NON_SPELLCASTER_RACES = new Set(["dragonborn", "dwarf", "goliath", "halfling", "human", "orc"]);
  const SPELLCASTER_RACES = new Set(["elf", "gnome", "tiefling"]);
  const SHIELD_PROFICIENT_CLASSES = new Set(["barbarian", "cleric", "druid", "fighter", "paladin", "ranger"]);

  const STANDARD_SPELL_SLOTS = Object.freeze({
    1: Object.freeze([2, 0, 0]),
    2: Object.freeze([3, 0, 0]),
    3: Object.freeze([4, 2, 0]),
    4: Object.freeze([4, 3, 0]),
    5: Object.freeze([4, 3, 2])
  });

  const HALF_CASTER_SPELL_SLOTS = Object.freeze({
    1: Object.freeze([2, 0, 0]),
    2: Object.freeze([2, 0, 0]),
    3: Object.freeze([3, 0, 0]),
    4: Object.freeze([3, 0, 0]),
    5: Object.freeze([4, 2, 0])
  });

  const WARLOCK_SPELL_SLOTS = Object.freeze({
    1: Object.freeze([1, 0, 0]),
    2: Object.freeze([2, 0, 0]),
    3: Object.freeze([0, 2, 0]),
    4: Object.freeze([0, 2, 0]),
    5: Object.freeze([0, 0, 2])
  });

  /** 將屬性值換算成屬性調整值；無效輸入視為 0。 */
  function calculateAbilityModifier(score) {
    const numericScore = Number(score);
    if (!Number.isFinite(numericScore)) return 0;
    return Math.floor((numericScore - 10) / 2);
  }

  /** 取得職業生命骰資料：Y 為一級生命值，Z 為後續每級固定生命值。 */
  function getHitDiceValues(className) {
    return HIT_DICE_BY_CLASS[className] || { Y: 0, Z: 0 };
  }

  /** 計算最大生命值，包含矮人與術士的專案既有加值規則。 */
  function calculateCharacterMaxHp(options = {}) {
    const className = String(options.className || "").trim();
    const level = Number.parseInt(options.level, 10);
    const normalizedLevel = Number.isFinite(level) && level > 0 ? level : 1;
    const constitutionModifier = calculateAbilityModifier(options.constitutionScore);
    const { Y: firstLevelHp, Z: laterLevelHp } = getHitDiceValues(className);

    let maxHp = firstLevelHp
      + constitutionModifier * normalizedLevel
      + laterLevelHp * (normalizedLevel - 1);

    if (options.race === "dwarf") maxHp += normalizedLevel;
    if (className === "sorcerer" && normalizedLevel >= 3) maxHp += normalizedLevel;
    if (options.hasToughFeat) maxHp += normalizedLevel * 2;
    return maxHp;
  }

  /** 將生命值輸入四捨五入並限制在 0～200；空值或無效值回傳空字串。 */
  function clampHpValue(rawValue) {
    if (rawValue === "" || rawValue === null || rawValue === undefined) return "";
    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric)) return "";
    const rounded = Math.round(numeric);
    return String(Math.min(200, Math.max(0, rounded)));
  }

  /** 只接受目前角色卡支援的「小型」與「中型」體型。 */
  function normalizeCharacterSize(value) {
    return value === "小型" || value === "中型" ? value : "";
  }

  /** 優先使用種族固定體型；沒有固定體型時採用經驗證的備用值。 */
  function getCharacterSizeForRace(race, fallbackSize = "") {
    return FIXED_CHARACTER_SIZE_BY_RACE[race] || normalizeCharacterSize(fallbackSize);
  }

  /** 依角色等級計算 1～20 級的熟練加值。 */
  function calculateProficiencyBonus(level) {
    const numericLevel = Number.parseInt(level, 10);
    if (numericLevel >= 17) return 6;
    if (numericLevel >= 13) return 5;
    if (numericLevel >= 9) return 4;
    if (numericLevel >= 5) return 3;
    return 2;
  }

  /** 取得指定職業熟練的兩項豁免屬性代號。 */
  function getClassSaveProficiencies(classId) {
    return CLASS_SAVE_PROFICIENCIES[classId] || [];
  }

  /** 判斷職業、背景、種族或魔法學徒專長是否提供施法能力。 */
  function hasSpellcastingCapabilityForSelections(options = {}) {
    const className = String(options.className || "").trim();
    const background = String(options.background || "").trim();
    const race = String(options.race || "").trim();

    if (SPELLCASTER_CLASSES.has(className)) return true;
    if (SPELLCASTER_BACKGROUNDS.has(background)) return true;
    if (SPELLCASTER_RACES.has(race)) return true;
    if (options.hasMagicInitiate) return true;

    return !(
      NON_SPELLCASTER_CLASSES.has(className)
      && NON_SPELLCASTER_BACKGROUNDS.has(background)
      && NON_SPELLCASTER_RACES.has(race)
    );
  }

  /** 回傳目前角色卡允許選擇的超魔法數量。 */
  function getMetamagicSelectionLimit() {
    return 2;
  }

  /** 依職業與等級計算魔能祈喚選擇上限；非契術師回傳 0。 */
  function calculateWarlockInvocationSelectionLimit(className, level) {
    if (className !== "warlock") return 0;
    const numericLevel = Number.parseInt(level, 10);
    if (numericLevel <= 1 || !Number.isFinite(numericLevel)) return 1;
    if (numericLevel <= 4) return 3;
    return 5;
  }

  /** 依等級取得武僧武藝傷害骰。 */
  function getMonkMartialArtsDieByLevel(level) {
    return Number(level) >= 5 ? "1d8" : "1d6";
  }

  /** 取得指定職業與等級的一至三環法術位數量。 */
  function getSpellSlotCounts(className, level) {
    if (["bard", "cleric", "druid", "sorcerer", "wizard"].includes(className)) {
      return STANDARD_SPELL_SLOTS[level] || [0, 0, 0];
    }
    if (["paladin", "ranger"].includes(className)) {
      return HALF_CASTER_SPELL_SLOTS[level] || [0, 0, 0];
    }
    if (className === "warlock") return WARLOCK_SPELL_SLOTS[level] || [0, 0, 0];
    return [0, 0, 0];
  }

  /** 計算 AC，包含無甲防禦、護甲、盾牌及防禦戰鬥風格。 */
  function calculateArmorClass(options = {}) {
    const className = String(options.className || "").trim();
    const level = Number.parseInt(options.level, 10) || 1;
    const dexModifier = calculateAbilityModifier(options.dexterityScore);
    const constitutionModifier = calculateAbilityModifier(options.constitutionScore);
    const wisdomModifier = calculateAbilityModifier(options.wisdomScore);
    const charismaModifier = calculateAbilityModifier(options.charismaScore);
    const armor = options.armor || null;
    if (options.hasArmor && !armor) return null;

    let armorClass;
    if (!armor && className === "sorcerer" && level >= 3) {
      armorClass = 10 + charismaModifier + dexModifier;
    } else if (!armor && !options.hasAnyShield && className === "monk") {
      armorClass = 10 + dexModifier + wisdomModifier;
    } else if (!armor && className === "barbarian") {
      armorClass = 10 + dexModifier + constitutionModifier;
    } else if (!armor) {
      armorClass = 10 + dexModifier;
    } else {
      const armorBase = Number.parseInt(armor.AC, 10);
      if (!Number.isFinite(armorBase)) return null;
      if (armor.分類 === "重甲") armorClass = armorBase;
      else if (armor.分類 === "中甲") {
        const mediumArmorDexterityCap = options.hasMediumArmorAgility
          && Number(options.dexterityScore) >= 16 ? 3 : 2;
        armorClass = armorBase + Math.min(mediumArmorDexterityCap, dexModifier);
      }
      else if (armor.分類 === "輕甲") armorClass = armorBase + dexModifier;
      else return null;
    }

    if (options.hasShield && SHIELD_PROFICIENT_CLASSES.has(className)) armorClass += 2;
    if (armor && options.hasDefenseFightingStyle) armorClass += 1;
    return armorClass;
  }

  /** 將有限數值格式化為帶正負號的顯示文字；正數補上「+」。 */
  function formatSignedValue(value) {
    if (!Number.isFinite(value)) return "";
    if (value > 0) return `+${value}`;
    return String(value);
  }

  /** 將可能帶正負號的文字轉成整數；空值或無效值視為 0。 */
  function parseSignedValue(value) {
    const normalized = String(value ?? "").trim();
    if (!normalized) return 0;
    const parsed = Number.parseInt(normalized, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  /** 計算角色速度，包含種族覆寫及武僧、野蠻人的職業加值條件。 */
  function calculateCharacterSpeed(options = {}) {
    const baseSpeedValue = Number.parseFloat(options.baseSpeed);
    const race = String(options.race || "").trim();
    const elfLineage = String(options.elfLineage || "").trim();
    const className = String(options.className || "").trim();
    const level = Number.parseInt(options.level, 10);

    const hasRaceSpeedOverride = race === "goliath"
      || (race === "elf" && elfLineage === "wood_elf");
    const baseSpeed = hasRaceSpeedOverride ? 35 : baseSpeedValue;
    if (!Number.isFinite(baseSpeed)) return "";

    const monkBonusApplies = className === "monk"
      && Number.isFinite(level)
      && level >= 2
      && !options.isWearingArmor
      && !options.hasShield;
    const barbarianBonusApplies = className === "barbarian"
      && Number.isFinite(level)
      && level >= 5
      && !options.isWearingHeavyArmor;

    const classSpeedBonus = (monkBonusApplies || barbarianBonusApplies) ? 10 : 0;
    const featSpeedBonus = options.hasSpeedyFeat ? 10 : 0;
    return String(baseSpeed + classSpeedBonus + featSpeedBonus);
  }

  // 將純規則函式提供給 index.html 的傳統 script 呼叫。
  Object.assign(globalScope, {
    calculateAbilityModifier,
    calculateArmorClass,
    calculateCharacterMaxHp,
    calculateCharacterSpeed,
    calculateProficiencyBonus,
    calculateWarlockInvocationSelectionLimit,
    clampHpValue,
    formatSignedValue,
    getCharacterSizeForRace,
    getClassSaveProficiencies,
    getHitDiceValues,
    getMetamagicSelectionLimit,
    getMonkMartialArtsDieByLevel,
    getSpellSlotCounts,
    hasSpellcastingCapabilityForSelections,
    normalizeCharacterSize,
    parseSignedValue
  });
})(window);

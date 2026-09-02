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
  const CLASS_CANTRIP_CLASSES = new Set(["bard", "cleric", "druid", "sorcerer", "warlock", "wizard"]);
  const SHILLELAGH_WEAPON_NAMES = new Set(["短棒", "長棍"]);
  const STANDARD_SPELL_SLOTS = Object.freeze({
    1: Object.freeze([2, 0, 0, 0]),
    2: Object.freeze([3, 0, 0, 0]),
    3: Object.freeze([4, 2, 0, 0]),
    4: Object.freeze([4, 3, 0, 0]),
    5: Object.freeze([4, 3, 2, 0]),
    6: Object.freeze([4, 3, 3, 0]),
    7: Object.freeze([4, 3, 3, 1]),
    8: Object.freeze([4, 3, 3, 2])
  });

  const HALF_CASTER_SPELL_SLOTS = Object.freeze({
    1: Object.freeze([2, 0, 0, 0]),
    2: Object.freeze([2, 0, 0, 0]),
    3: Object.freeze([3, 0, 0, 0]),
    4: Object.freeze([3, 0, 0, 0]),
    5: Object.freeze([4, 2, 0, 0]),
    6: Object.freeze([4, 2, 0, 0]),
    7: Object.freeze([4, 3, 0, 0]),
    8: Object.freeze([4, 3, 0, 0])
  });

  const WARLOCK_SPELL_SLOTS = Object.freeze({
    1: Object.freeze([1, 0, 0, 0]),
    2: Object.freeze([2, 0, 0, 0]),
    3: Object.freeze([0, 2, 0, 0]),
    4: Object.freeze([0, 2, 0, 0]),
    5: Object.freeze([0, 0, 2, 0]),
    6: Object.freeze([0, 0, 2, 0]),
    7: Object.freeze([0, 0, 0, 2]),
    8: Object.freeze([0, 0, 0, 2])
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

  /** 依目前職業、種族、等級與屬性計算桌邊模式應顯示的內建資源。 */
  function getCharacterResourceSpecs(options = {}) {
    const className = String(options.className || "").trim();
    const race = String(options.race || "").trim();
    const level = Number.parseInt(options.level, 10);
    if (!Number.isInteger(level) || level < 1) return [];
    const proficiency = calculateProficiencyBonus(level);
    const wisdomModifier = Math.max(1, calculateAbilityModifier(options.wisdomScore ?? 10));
    const charismaModifier = Math.max(1, calculateAbilityModifier(options.charismaScore ?? 10));
    const resources = [];
    const addUses = (key, label, maximum, recoveryNote) => resources.push({
      key,
      kind: "uses",
      label,
      maximum,
      recoveryNote
    });
    const addPoints = (key, label, maximum, recoveryNote) => resources.push({
      key,
      kind: "points",
      label,
      maximum,
      recoveryNote
    });

    if (race === "dragonborn" && level >= 5) addUses("dragonborn-dragon-flight", "龍翔天際", 1, "長休後回復。");
    if (race === "dwarf") addUses("dwarf-stonecunning", "石中精妙", proficiency, "長休後全回復。");
    if (race === "goliath" && level >= 5) addUses("goliath-large-form", "巨化形體", 1, "長休後回復。");
    if (race === "orc") {
      addUses("orc-adrenaline-rush", "熱血湧動", proficiency, "短休或長休後全回復。");
      addUses("orc-relentless-endurance", "堅韌不屈", 1, "長休後回復。");
    }

    if (className === "barbarian") {
      addUses("barbarian-rage", "狂暴", level >= 6 ? 4 : (level >= 3 ? 3 : 2), "短休回 1 次，長休全回。");
    }
    if (className === "bard") {
      addUses(
        "bard-inspiration",
        "吟遊詩人激勵",
        charismaModifier,
        level >= 5 ? "短休或長休後全回復。" : "長休後全回復。"
      );
    }
    if (className === "cleric" && level >= 2) {
      addUses("cleric-channel-divinity", "引導神力", level >= 6 ? 3 : 2, "短休回 1 次，長休全回。");
    }
    if (className === "druid" && level >= 2) {
      addUses("druid-wild-shape", "荒野形態", level >= 6 ? 3 : 2, "短休回 1 次，長休全回。");
      if (level >= 5) {
        addUses(
          "druid-wild-resurgence-spell-slot",
          "野性復甦（法術位）",
          1,
          "無需動作；消耗 1 次荒野形態，恢復 1 個 1 環法術位。每次長休前只能使用 1 次；完成長休後恢復。"
        );
      }
      if (level >= 6) {
        addUses(
          "druid-natural-recovery-spell-slots",
          "自然恢復（法術位）",
          1,
          `完成短休時，可恢復環階總和 ${Math.ceil(level / 2)} 的已消耗法術位（德魯伊等級一半，進位；每個法術位須低於 6 環）。每次長休前只能使用 1 次；完成長休後恢復。`
        );
      }
    }
    if (className === "fighter") {
      addUses("fighter-second-wind", "回氣", level >= 4 ? 3 : 2, "短休回 1 次，長休全回。");
      if (level >= 2) addUses("fighter-action-surge", "動作如潮", 1, "短休或長休後回復。");
    }
    if (className === "monk" && level >= 2) {
      addPoints("monk-focus-points", "專注點", level, "短休或長休後全回復。");
      addUses("monk-uncanny-metabolism", "吐故納新", 1, "長休後回復。");
      if (level >= 6) addUses("monk-wholeness", "混元體", wisdomModifier, "長休後全回復。");
    }
    if (className === "paladin") {
      addPoints("paladin-lay-on-hands", "聖療", level * 5, "長休後全回復。");
      if (level >= 3) addUses("paladin-channel-divinity", "引導神力", 2, "短休回 1 次，長休全回。");
    }
    if (className === "sorcerer") {
      addUses("sorcerer-innate-sorcery", "天生術法", 2, "長休後全回復。");
      if (level >= 2) addPoints("sorcerer-sorcery-points", "術法點", level, "長休後全回復。");
      if (level >= 5) {
        addUses(
          "sorcerer-sorcerous-restoration",
          "術法復甦",
          1,
          `完成短休時，恢復最多 ${Math.floor(level / 2)} 點已消耗的術法點（術士等級一半，捨去）。每次長休前只能使用 1 次；完成長休後恢復。`
        );
      }
    }
    if (className === "warlock") {
      if (level >= 2) {
        const pactSlotMaximum = Math.max(...getSpellSlotCounts("warlock", level));
        addUses(
          "warlock-magical-cunning",
          "秘法回流",
          1,
          `進行 1 分鐘儀式；恢復最多 ${Math.ceil(pactSlotMaximum / 2)} 個已消耗的契約魔法法術位（法術位最大值一半，進位）。每次長休前只能使用 1 次；完成長休後恢復。`
        );
      }
      if (level >= 6) addUses("warlock-dark-ones-own-luck", "黑暗強運", charismaModifier, "長休後全回復。");
    }
    if (className === "wizard") {
      addUses(
        "wizard-arcane-recovery",
        "奧術回想",
        1,
        `完成短休時，恢復環階總和最多 ${Math.ceil(level / 2)} 的已消耗法術位（法師等級一半，進位；單一法術位最高 5 環）。每次長休前只能使用 1 次；完成長休後恢復。`
      );
    }
    return resources.map(resource => Object.freeze(resource));
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
    if (numericLevel <= 6) return 5;
    return 6;
  }

  /** 依等級取得武僧武藝傷害骰。 */
  function getMonkMartialArtsDieByLevel(level) {
    return Number(level) >= 5 ? "1d8" : "1d6";
  }

  /** 套用橡棍術至短棒或長棍；5 級起傷害骰提升為 1d10。 */
  function getShillelaghWeaponEffect(options = {}) {
    const weaponName = String(options.weaponName || "").trim();
    if (!options.isPrepared || !SHILLELAGH_WEAPON_NAMES.has(weaponName)) return null;

    const normalizeModifier = value => value === null || value === undefined || value === "" ? Number.NaN : Number(value);
    const strengthModifier = normalizeModifier(options.strengthModifier);
    const spellcastingModifier = normalizeModifier(options.spellcastingModifier);
    const availableModifiers = [strengthModifier, spellcastingModifier].filter(Number.isFinite);
    const abilityModifier = availableModifiers.length ? Math.max(...availableModifiers) : 0;
    const level = Number.parseInt(options.level, 10);

    return Object.freeze({
      damageDie: Number.isFinite(level) && level >= 5 ? "1d10" : "1d8",
      abilityModifier,
      abilityLabel: Number.isFinite(spellcastingModifier) && spellcastingModifier > strengthModifier
        ? "施法"
        : (Number.isFinite(spellcastingModifier) && spellcastingModifier === strengthModifier ? "力量／施法" : "力量"),
      damageType: "鈍擊/力場"
    });
  }

  /** 橡棍術一次只套用一把武器；符合時優先選擇主手，否則選擇副手。 */
  function getShillelaghTargetHand(options = {}) {
    if (!options.isPrepared) return null;
    if (SHILLELAGH_WEAPON_NAMES.has(String(options.mainHandWeaponName || "").trim())) return "main";
    if (SHILLELAGH_WEAPON_NAMES.has(String(options.offHandWeaponName || "").trim())) return "off";
    return null;
  }

  /** 取得指定職業與等級的一至四環法術位數量。 */
  function getSpellSlotCounts(className, level) {
    const numericLevel = Number(level);
    if (!Number.isInteger(numericLevel)) return [0, 0, 0, 0];
    if (["bard", "cleric", "druid", "sorcerer", "wizard"].includes(className)) {
      return STANDARD_SPELL_SLOTS[numericLevel] || [0, 0, 0, 0];
    }
    if (["paladin", "ranger"].includes(className)) {
      return HALF_CASTER_SPELL_SLOTS[numericLevel] || [0, 0, 0, 0];
    }
    if (className === "warlock") return WARLOCK_SPELL_SLOTS[numericLevel] || [0, 0, 0, 0];
    return [0, 0, 0, 0];
  }

  /** 判斷職業在指定角色等級是否可使用某一法術環階。 */
  function classCanAccessSpellLevel(className, characterLevel, spellLevel) {
    const numericSpellLevel = Number(spellLevel);
    if (!Number.isInteger(numericSpellLevel) || numericSpellLevel < 0 || numericSpellLevel > 4) return false;
    if (numericSpellLevel === 0) return CLASS_CANTRIP_CLASSES.has(className);

    const slotCounts = getSpellSlotCounts(className, characterLevel);
    const highestSpellLevel = slotCounts.reduce(
      (highest, count, index) => count > 0 ? index + 1 : highest,
      0
    );
    return numericSpellLevel <= highestSpellLevel;
  }

  /** 計算聖騎士守護靈氣提供的豁免加值。 */
  function getPaladinAuraSavingThrowBonus(className, level, charismaScore) {
    const numericLevel = Number(level);
    if (className !== "paladin" || !Number.isInteger(numericLevel) || numericLevel < 6) return 0;
    return Math.max(1, calculateAbilityModifier(charismaScore));
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
      else if (armor.分類 === "中甲") armorClass = armorBase + Math.min(2, dexModifier);
      else if (armor.分類 === "輕甲") armorClass = armorBase + dexModifier;
      else return null;
    }

    if (options.hasShield) armorClass += 2;
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

  /** 計算角色速度，包含種族覆寫及武僧、野蠻人、遊俠的職業加值條件。 */
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
    const rangerBonusApplies = className === "ranger"
      && Number.isFinite(level)
      && level >= 6
      && !options.isWearingHeavyArmor;

    let classSpeedBonus = 0;
    if (monkBonusApplies) classSpeedBonus = level >= 6 ? 15 : 10;
    else if (barbarianBonusApplies || rangerBonusApplies) classSpeedBonus = 10;
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
    classCanAccessSpellLevel,
    clampHpValue,
    formatSignedValue,
    getCharacterSizeForRace,
    getCharacterResourceSpecs,
    getClassSaveProficiencies,
    getHitDiceValues,
    getMetamagicSelectionLimit,
    getMonkMartialArtsDieByLevel,
    getPaladinAuraSavingThrowBonus,
    getShillelaghTargetHand,
    getShillelaghWeaponEffect,
    getSpellSlotCounts,
    hasSpellcastingCapabilityForSelections,
    normalizeCharacterSize,
    parseSignedValue
  });
})(window);

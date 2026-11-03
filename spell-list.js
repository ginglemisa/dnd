// 法術目錄（SpellCatalog）：法術資料來自 content/srd/spells 的內容檔，npm run build 產生 spell-content.generated.js
// （spellRules、spellText，須在本檔之前載入）。本檔只建立索引與公開 API，不另存規則資料。
// 只有角色可用的法術（spellRules 的 playable，有網站版）進入 getSpell／getAllSpells／職業法表等 API；只供查閱的 SRD 法術不在其中。
globalThis.SpellCatalog = (() => {
  if (typeof spellRules === "undefined" || typeof spellText === "undefined") {
    throw new Error("法術資料（spell-content.generated.js）尚未載入：請先執行 npm run build");
  }
  const CLASS_IDS = Object.freeze(["bard", "cleric", "druid", "paladin", "ranger", "sorcerer", "warlock", "wizard"]);

  // spellRules 依環階、再依 spellId 排序；每個法術的紀錄只建立一次並有永久 ID。
  const spellsById = Object.freeze(Object.fromEntries(Object.entries(spellRules)
    .filter(([, rules]) => rules.playable)
    .map(([spellId, rules]) => [spellId, Object.freeze({
      spellId,
      nameZh: rules.name,
      nameEn: rules.nameEn,
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      desc: spellText[spellId].desc,
      level: rules.level
    })])));

  // 職業法表只存 ID；依環階分組由各法術的 level 決定。
  const fullSpellIdsByClass = Object.freeze(Object.fromEntries(CLASS_IDS.map(classId => [classId,
    Object.freeze(Object.keys(spellsById).filter(spellId => spellRules[spellId].classes.includes(classId)))])));

  const classIdsBySpellId = new Map();
  for (const [classId, spellIds] of Object.entries(fullSpellIdsByClass)) {
    for (const spellId of new Set(spellIds)) {
      if (!classIdsBySpellId.has(spellId)) classIdsBySpellId.set(spellId, []);
      classIdsBySpellId.get(spellId).push(classId);
    }
  }

  const DAMAGE_TYPE_LABELS = Object.freeze({
    acid: "強酸",
    bludgeoning: "鈍擊",
    cold: "冷凍",
    fire: "火焰",
    force: "力場",
    lightning: "閃電",
    necrotic: "黯蝕",
    piercing: "穿刺",
    poison: "毒素",
    psychic: "心靈",
    radiant: "光耀",
    slashing: "揮砍",
    thunder: "雷鳴"
  });

  function freezeOutcome(outcome) {
    const frozen = { ...outcome };
    if (Array.isArray(outcome.damageTypes)) frozen.damageTypes = Object.freeze([...outcome.damageTypes]);
    if (Array.isArray(outcome.modifierTags)) frozen.modifierTags = Object.freeze([...outcome.modifierTags]);
    return Object.freeze(frozen);
  }

  // 跑團施法結果（內容檔的 site.outcomes）：骰式、升環骰、傷害類型等。
  const outcomeMetadataBySpellId = Object.freeze(Object.fromEntries(Object.keys(spellsById)
    .map(spellId => [spellId, Object.freeze(spellRules[spellId].outcomes.map(freezeOutcome))])));

  // 有傷害結果的戲法可從跑團施法（另有克敵機先以攻擊結果施法）。
  const TABLETOP_DAMAGE_CANTRIP_IDS = Object.freeze(Object.keys(spellsById).filter(spellId => (
    spellsById[spellId].level === 0 && outcomeMetadataBySpellId[spellId].some(outcome => outcome.kind === "damage")
  )));

  function appendExpressionTerm(expression, term, times) {
    const count = Math.max(0, Number.parseInt(times, 10) || 0);
    return count ? `${expression}${Array.from({ length: count }, () => `+${term}`).join("")}` : expression;
  }

  function appendNumericModifier(expression, modifier) {
    const value = Number(modifier) || 0;
    if (!value) return expression;
    return `${expression}${value < 0 ? "" : "+"}${value}`;
  }

  function resolveCastOutcomes(spellId, options = {}) {
    const spell = spellsById[spellId];
    if (!spell) return Object.freeze([]);
    const effectiveLevel = Math.max(spell.level, Number.parseInt(options.effectiveLevel, 10) || spell.level);
    const characterLevel = Math.max(1, Number.parseInt(options.characterLevel, 10) || 1);
    const spellcastingModifier = Number.isSafeInteger(Number(options.spellcastingModifier))
      ? Number(options.spellcastingModifier)
      : 0;
    const modifiers = Array.isArray(options.modifiers) ? options.modifiers : [];
    const usedOnceModifiers = new Set();
    const resolved = [];

    (outcomeMetadataBySpellId[spellId] || []).forEach((outcome, outcomeIndex) => {
      let expression = characterLevel >= 5 && outcome.cantripAt5
        ? outcome.cantripAt5
        : outcome.formula || "";
      const slotDifference = Math.max(0, effectiveLevel - spell.level);
      if (expression && outcome.upcastDice) {
        expression = appendExpressionTerm(expression, outcome.upcastDice, slotDifference);
      }
      if (expression && outcome.abilityModifier === "spellcasting") {
        expression = appendNumericModifier(expression, spellcastingModifier);
      }
      if (expression && outcome.addSlotLevel) {
        expression = appendNumericModifier(expression, effectiveLevel);
      }
      let fixed = Number.isFinite(outcome.fixed) ? Number(outcome.fixed) : null;
      if (options.maximizeDice && Number.isFinite(outcome.maximizedFixed)) {
        expression = "";
        fixed = outcome.maximizedFixed;
      }
      if (expression && Number.isFinite(outcome.upcastFixed)) {
        expression = appendNumericModifier(expression, slotDifference * Number(outcome.upcastFixed));
      }
      if (fixed !== null && Number.isFinite(outcome.upcastFixed)) {
        fixed += slotDifference * Number(outcome.upcastFixed);
      }
      const damageType = outcome.damageTypes?.includes(options.damageType)
        ? options.damageType
        : outcome.damageType || outcome.damageTypes?.[0] || "";
      let repeat = Math.max(1, Number.parseInt(outcome.repeat, 10) || 1);
      if (characterLevel >= 5 && outcome.repeatAt5) repeat = Math.max(repeat, outcome.repeatAt5);
      if (outcome.repeatPerSlot) repeat += slotDifference * outcome.repeatPerSlot;

      for (let repeatIndex = 0; repeatIndex < repeat; repeatIndex += 1) {
        let rollExpression = outcome.kind === "attack"
          ? appendNumericModifier("1d20", spellcastingModifier + (Number(options.proficiencyBonus) || 0))
          : expression;
        let rollFixed = fixed;
        const modifierLabels = [];
        modifiers.forEach((modifier, modifierIndex) => {
          const value = Number(modifier?.value) || 0;
          if (!value || outcome.kind !== (modifier.kind || "damage")) return;
          if (modifier.requiredTag && !outcome.modifierTags?.includes(modifier.requiredTag)) return;
          if (modifier.damageType && modifier.damageType !== damageType) return;
          const modifierKey = String(modifier.id || modifierIndex);
          if (modifier.frequency === "once" && usedOnceModifiers.has(modifierKey)) return;
          if (rollExpression) rollExpression = appendNumericModifier(rollExpression, value);
          else if (rollFixed !== null) rollFixed += value;
          else return;
          modifierLabels.push(String(modifier.label || "加值"));
          if (modifier.frequency === "once") usedOnceModifiers.add(modifierKey);
        });
        resolved.push(Object.freeze({
          spellId,
          outcomeIndex,
          repeatIndex,
          repeat,
          repeatLabel: outcome.repeatLabel || "",
          kind: outcome.kind,
          attack: outcome.attack || "",
          expression: rollExpression,
          fixed: rollFixed,
          damageType,
          damageTypeLabel: DAMAGE_TYPE_LABELS[damageType] || "",
          autoOnCast: Boolean(outcome.autoOnCast),
          context: outcome.context || "",
          modifierLabels: Object.freeze(modifierLabels)
        }));
      }
    });
    return Object.freeze(resolved);
  }

  const castMetadataBySpellId = Object.freeze(Object.fromEntries(
    Object.values(spellsById).map(spell => [spell.spellId, Object.freeze({
      spellId: spell.spellId,
      baseLevel: spell.level,
      tabletopCast: spell.level > 0 || outcomeMetadataBySpellId[spell.spellId].length > 0,
      ritual: Boolean(spellRules[spell.spellId].ritual),
      ritualExtraTime: spellRules[spell.spellId].ritual ? "額外 10 分鐘" : "",
      hasUpcastEffect: Boolean(spellRules[spell.spellId].upcast),
      outcomes: outcomeMetadataBySpellId[spell.spellId]
    })])
  ));

  function getCastMetadata(spellId) {
    return typeof spellId === "string" && Object.hasOwn(castMetadataBySpellId, spellId) ? castMetadataBySpellId[spellId] : undefined;
  }

  function canCastFromTabletop(spellId) {
    return Boolean(getCastMetadata(spellId)?.tabletopCast);
  }

  function isRitual(spellOrId) {
    const spellId = typeof spellOrId === "string" ? spellOrId : spellOrId?.spellId;
    return Boolean(getCastMetadata(spellId)?.ritual);
  }

  function hasUpcastEffect(spellOrId) {
    const spellId = typeof spellOrId === "string" ? spellOrId : spellOrId?.spellId;
    return Boolean(getCastMetadata(spellId)?.hasUpcastEffect);
  }

  function getCastDamageTypes(spellId) {
    const types = (getCastMetadata(spellId)?.outcomes || []).flatMap(outcome => (
      outcome.damageTypes || (outcome.damageType ? [outcome.damageType] : [])
    ));
    return [...new Set(types)];
  }

  function getSelectableCastDamageTypes(spellId) {
    const types = (getCastMetadata(spellId)?.outcomes || []).flatMap(outcome => outcome.damageTypes || []);
    return [...new Set(types)];
  }

  function hasCastOutcomeTag(spellId, tag) {
    if (typeof tag !== "string" || !tag) return false;
    return (getCastMetadata(spellId)?.outcomes || [])
      .some(outcome => outcome.modifierTags?.includes(tag));
  }

  const exactNameToSpellId = new Map();
  function addExactNameAlias(name, spellId) {
    const existing = exactNameToSpellId.get(name);
    if (existing !== undefined && existing !== spellId) {
      throw new Error(`Spell name alias collision: ${name}`);
    }
    exactNameToSpellId.set(name, spellId);
  }
  for (const spell of Object.values(spellsById)) {
    addExactNameAlias(spell.nameZh, spell.spellId);
    addExactNameAlias(spell.nameEn, spell.spellId);
    addExactNameAlias(spell.name, spell.spellId);
  }

  function normalizeLevel(level) {
    if (level === "cantrip" || level === "cantrips") return 0;
    if (typeof level === "number" && Number.isInteger(level) && level >= 0) return level;
    if (typeof level === "string" && /^(?:0|[1-9]\d*)$/.test(level)) return Number(level);
    return undefined;
  }

  function getSpell(spellId) {
    return typeof spellId === "string" && Object.hasOwn(spellsById, spellId) ? spellsById[spellId] : undefined;
  }

  // 全部法術依環階、再依 spellId 排序（與職業法表相同規則）。
  const allSpells = Object.freeze(Object.values(spellsById));

  function getAllSpells() {
    return [...allSpells];
  }

  function getSpellIds(classId, level) {
    const normalizedLevel = normalizeLevel(level);
    const classSpellIds = typeof classId === "string" && Object.hasOwn(fullSpellIdsByClass, classId) ? fullSpellIdsByClass[classId] : undefined;
    if (!classSpellIds || normalizedLevel === undefined) return [];
    return classSpellIds.filter(spellId => spellsById[spellId].level === normalizedLevel);
  }

  function getSpells(classId, level) {
    return getSpellIds(classId, level).map(spellId => spellsById[spellId]);
  }

  function getClassIds(spellId) {
    if (!getSpell(spellId)) return [];
    return (classIdsBySpellId.get(spellId) || []).slice();
  }

  function getDisplayName(spellId) {
    const spell = getSpell(spellId);
    return spell ? `${spell.nameZh} ${spell.nameEn}` : undefined;
  }

  function resolveSpellId(exactName) {
    return typeof exactName === "string" ? exactNameToSpellId.get(exactName) : undefined;
  }

  const spellIdOf = spellOrId => typeof spellOrId === "string" ? spellOrId : spellOrId?.spellId;

  // 標頭各項的顯示字串與規則旗標（學派、施法時間、射程、成分、材料、持續時間、專注、儀式），
  // PDF、跑團與法術書讀取，不解析 desc。自創法術提供同形狀的 header（tabletop-custom-spells.js）。
  const headersBySpellId = Object.freeze(Object.fromEntries(Object.keys(spellsById).map(spellId => {
    const rules = spellRules[spellId];
    return [spellId, Object.freeze({
      ...spellText[spellId].header,
      castingTimes: Object.freeze(rules.castingTime.map(time => typeof time === "string" ? time : Object.freeze({ ...time }))),
      concentration: Boolean(rules.concentration),
      ritual: Boolean(rules.ritual),
      hasMaterial: rules.components.includes("M")
    })];
  })));

  function getSpellHeader(spellOrId) {
    const spellId = spellIdOf(spellOrId);
    return typeof spellId === "string" && Object.hasOwn(headersBySpellId, spellId) ? headersBySpellId[spellId] : undefined;
  }

  // 施法時間（"action"、"bonus-action"、"reaction"、{ minutes }、{ hours }），可有多個。
  function getCastingTimes(spellOrId) {
    return [...(getSpellHeader(spellOrId)?.castingTimes || [])];
  }

  // 跑團版說明（內容檔的 site.tabletop，含標頭）；沒寫時用網站版說明。
  function getTabletopText(spellOrId) {
    const spellId = spellIdOf(spellOrId);
    if (!getSpell(spellId)) return undefined;
    return spellText[spellId].tabletop || spellsById[spellId].desc;
  }

  // 查閱用：全部法術（含只供查閱、沒有網站版的 SRD 法術）的名稱、環階與職業，依環階、spellId 排序。
  // classIds 是網站法表與 SRD 職業清單（srdClasses）的聯集，只用於查閱分類；角色可準備的職業法表一律用 getClassIds 等 API。
  // playable 為角色可用的法術；只供查閱的法術不在 getSpell 等其他 API，任何情況下都不能準備或加入角色。
  const referenceSpellsById = Object.freeze(Object.fromEntries(Object.entries(spellRules).map(([spellId, rules]) => [spellId, Object.freeze({
    spellId,
    nameZh: rules.name,
    nameEn: rules.nameEn,
    level: rules.level,
    playable: Boolean(rules.playable),
    classIds: Object.freeze(CLASS_IDS.filter(classId => rules.classes.includes(classId) || rules.srdClasses?.includes(classId)))
  })])));
  const allReferenceSpells = Object.freeze(Object.values(referenceSpellsById));

  function getReferenceSpell(spellOrId) {
    const spellId = spellIdOf(spellOrId);
    return typeof spellId === "string" && Object.hasOwn(referenceSpellsById, spellId) ? referenceSpellsById[spellId] : undefined;
  }

  function getAllReferenceSpells() {
    return [...allReferenceSpells];
  }

  // SRD 版（法術詳情的「SRD 版」，SRD 5.2.1 繁中直譯）：spell-srd.generated.js 在第一次需要時才載入，離線版已內嵌。
  function hasSrdText(spellOrId) {
    const spellId = spellIdOf(spellOrId);
    return typeof spellId === "string" && Object.hasOwn(spellRules, spellId) && spellRules[spellId].source === "srd";
  }

  let srdTextPromise = null;
  function loadSrdTextData() {
    if (globalThis.spellSrdText) return Promise.resolve(globalThis.spellSrdText);
    srdTextPromise ||= new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = typeof spellSrdFile === "string" ? spellSrdFile : "spell-srd.generated.js";
      script.onload = () => globalThis.spellSrdText ? resolve(globalThis.spellSrdText) : reject(new Error("SRD 版資料格式不符"));
      script.onerror = () => {
        script.remove();
        reject(new Error("SRD 版資料載入失敗"));
      };
      document.head.appendChild(script);
    }).catch(error => {
      srdTextPromise = null;
      throw error;
    });
    return srdTextPromise;
  }

  // 回傳 { header, html }（建置產生的 HTML）；沒有 SRD 版時為 null，載入失敗時 reject（之後可再試）。
  async function loadSrdText(spellOrId) {
    const spellId = spellIdOf(spellOrId);
    if (!hasSrdText(spellId)) return null;
    const data = await loadSrdTextData();
    return Object.hasOwn(data, spellId) ? data[spellId] : null;
  }

  // 專注：目錄內的法術讀規則欄位；目錄外的法術物件（自創法術）讀其 concentration。
  function isConcentration(spellOrId) {
    const header = getSpellHeader(spellOrId);
    if (header) return header.concentration;
    return typeof spellOrId === "object" && spellOrId !== null && spellOrId.concentration === true;
  }

  const compatSpellList = {};
  for (const [classId, spellIds] of Object.entries(fullSpellIdsByClass)) {
    const levels = {};
    for (const spellId of spellIds) {
      const spell = spellsById[spellId];
      const levelKey = spell.level === 0 ? "cantrips" : String(spell.level);
      (levels[levelKey] ??= []).push(spell);
    }
    for (const spells of Object.values(levels)) Object.freeze(spells);
    compatSpellList[classId] = Object.freeze(levels);
  }
  Object.freeze(compatSpellList);

  return Object.freeze({
    schemaVersion: 3,
    getSpell,
    getAllSpells,
    getSpellIds,
    getSpells,
    getClassIds,
    getDisplayName,
    resolveSpellId,
    getSpellHeader,
    getCastingTimes,
    getTabletopText,
    getReferenceSpell,
    getAllReferenceSpells,
    hasSrdText,
    loadSrdText,
    isConcentration,
    getCastMetadata,
    canCastFromTabletop,
    isRitual,
    hasUpcastEffect,
    getCastDamageTypes,
    getSelectableCastDamageTypes,
    hasCastOutcomeTag,
    resolveCastOutcomes,
    damageTypeLabels: DAMAGE_TYPE_LABELS,
    tabletopDamageCantripIds: TABLETOP_DAMAGE_CANTRIP_IDS,
    compatSpellList
  });
})();

const spellList = SpellCatalog.compatSpellList;

(function attachCharacterRules(globalScope) {
  const SHILLELAGH_WEAPON_NAMES = new Set(["短棒", "長棍"]);
  const ABILITY_MODIFIER_TOKENS = Object.freeze({
    strModifier: "str", dexModifier: "dex", conModifier: "con", intModifier: "int", wisModifier: "wis", chaModifier: "cha"
  });

  // 背景規則：background-content.generated.js 由 content/srd/backgrounds 產生 backgroundRules（屬性、專長、技能、工具、裝備）。
  // "custom" 為自訂背景（custom-background.js，存檔格式另訂），轉成同樣的結構；沒有選擇或不認得的背景回傳 null。
  function getBackgroundRules(background) {
    if (background === "custom") return globalScope.CustomBackground?.getRules() || null;
    const rules = typeof backgroundRules === "undefined" ? null : backgroundRules;
    return rules && Object.hasOwn(rules, background) ? rules[background] : null;
  }

  /** 內建背景的顯示文字（backgroundText：屬性、專長、技能提示框 HTML、工具、裝備 A／B、描述）；自訂背景由 custom-background.js 自行顯示。 */
  function getBackgroundText(background) {
    const text = typeof backgroundText === "undefined" ? null : backgroundText;
    return text && Object.hasOwn(text, background) ? text[background] : null;
  }

  // 背景來源標籤：內容檔 source 為 extended（本站另外撰寫）與自訂背景顯示的字樣；srd 不加標籤。
  const BACKGROUND_SOURCE_LABELS = Object.freeze({ extended: "擴充", custom: "擴充" });

  /** 背景來源：內建背景為內容檔的 source（srd／extended），自訂背景為 custom；沒有選擇或不認得時為空字串。讀取來源只經過這裡。 */
  function getBackgroundSource(background) {
    return getBackgroundRules(background)?.source || "";
  }

  /** 背景來源的顯示標籤（例如「擴充」，不含括號）；沒有標籤時為空字串。建置檢查背景選單文字時也讀這裡。 */
  function getBackgroundSourceLabel(source) {
    return BACKGROUND_SOURCE_LABELS[source] || "";
  }

  // 傷害類型（種族內容檔的 resistance 等）的顯示名稱。
  const DAMAGE_TYPE_LABELS = Object.freeze({ acid: "強酸", cold: "冷凍", fire: "火焰", lightning: "閃電", necrotic: "黯蝕", poison: "毒素" });

  /** 傷害類型 ID 的顯示名稱（例如 poison →「毒素」）；不認得時為空字串。建置產生種族表格文字時也讀這裡。 */
  function getDamageTypeLabel(damageType) {
    return DAMAGE_TYPE_LABELS[damageType] || "";
  }

  // 種族規則：race-content.generated.js 由 content/srd/races 產生 raceRules（體型、速度、黑暗視覺、抗性、血統選項、特質的資源與動作）；
  // 沒有選擇或不認得的種族回傳 null。
  function getRaceRules(race) {
    const rules = typeof raceRules === "undefined" ? null : raceRules;
    return rules && Object.hasOwn(rules, race) ? rules[race] : null;
  }

  /** 種族的顯示文字（raceText：種族頁 HTML、特質與血統選項的跑團純文字、動作說明、跑團提示、PDF 種族特質欄）。 */
  function getRaceText(race) {
    const text = typeof raceText === "undefined" ? null : raceText;
    return text && Object.hasOwn(text, race) ? text[race] : null;
  }

  /** 全部種族的規則（種族 ID → raceRules），依種族選單順序。 */
  function getAllRaceRules() {
    return typeof raceRules === "undefined" ? {} : raceRules;
  }

  /** 種族目前所選的血統選項（依種族 choice 的選單 ID 讀取 value；沒有選擇或不認得時為 null）。 */
  function getRaceChoiceOption(race, value) {
    return getRaceRules(race)?.choice?.options.find(option => option.value === value) || null;
  }

  // 職業機制資料：class-content.generated.js 由 content/ 的職業內容檔產生 classRules（特性表、數值、資源、選項與動作）。
  function getClassRules(className) {
    const rules = typeof classRules === "undefined" ? null : classRules;
    return rules && Object.hasOwn(rules, className) ? rules[className] : null;
  }

  /** 特性表欄位在指定等級的數值（只寫有變化的等級）；沒有此欄位、未達最低等級或為「-」時回傳 null。 */
  function getClassProgressionValue(className, name, level) {
    const column = getClassRules(className)?.progression?.[name];
    const numericLevel = Number(level);
    if (!column || !Number.isFinite(numericLevel)) return null;
    let value = null;
    for (const [from, entry] of Object.entries(column.byLevel)) if (Number(from) <= numericLevel) value = entry;
    return value ?? null;
  }

  /**
   * 目前選擇的子職 ID：角色卡的 #subclass（目前職業的有效子職）優先，否則為職業內容檔的 defaultSubclass。
   * 沒有職業資料時回傳空字串；不在瀏覽器（純 Node.js 驗證）時為預設子職。
   */
  function getSelectedSubclassId(className) {
    const rules = getClassRules(className);
    if (!rules) return "";
    const doc = globalScope.document;
    const selected = doc?.getElementById?.("class")?.value === className ? doc.getElementById("subclass")?.value || "" : "";
    return rules.subclasses.some(item => item.id === selected) ? selected : rules.defaultSubclass;
  }

  /** 目前選擇的子職資料（id、name、shortName、features）；沒有職業資料時回傳 null。 */
  function getSelectedSubclass(className) {
    const id = getSelectedSubclassId(className);
    return getClassRules(className)?.subclasses.find(item => item.id === id) || null;
  }

  /** 職業能力（含指定子職的能力；未指定或無效時為目前子職）；每項加上 subclass（子職 ID，職業能力為 null），依等級排列。 */
  function getClassFeatureRules(className, subclassId) {
    const rules = getClassRules(className);
    if (!rules) return [];
    const wanted = rules.subclasses.some(item => item.id === subclassId) ? subclassId : getSelectedSubclassId(className);
    const subclass = rules.subclasses.find(item => item.id === wanted);
    // 排列同職業頁：各等級的子職能力接在「選擇子職」能力之後，其他等級接在該級職業能力之後。
    const levels = [...new Set([...rules.features, ...(subclass?.features || [])].map(feature => feature.level))].sort((a, b) => a - b);
    return levels.flatMap(level => {
      const own = rules.features.filter(feature => feature.level === level).map(feature => ({ ...feature, subclass: null }));
      const sub = (subclass?.features || []).filter(feature => feature.level === level).map(feature => ({ ...feature, subclass: subclass.id }));
      const entryIndex = own.findIndex(feature => feature.type === "subclass");
      const insertAt = entryIndex >= 0 ? entryIndex + 1 : own.length;
      return [...own.slice(0, insertAt), ...sub, ...own.slice(insertAt)];
    });
  }

  /** 角色在此等級是否具有職業能力（含目前子職或指定子職的能力，以內容檔的能力 ID 判斷）。 */
  function hasClassFeature(className, featureId, level, subclassId) {
    const numericLevel = Number.parseInt(level, 10) || 0;
    return getClassFeatureRules(className, subclassId).some(feature => feature.id === featureId && numericLevel >= feature.level);
  }

  // 內容檔 values 公式：數字、NdM 骰子、四則運算、max()／min()／floor()／ceil() 與 {數值}。
  // 結果是數字，或骰子加常數（{ dice: [{ count, sides }], constant, hasConstant }），顯示為「1d8 + 3」。
  function tokenizeClassFormula(formula) {
    const tokens = [];
    const pattern = /\s*(?:(\d+(?:\.\d+)?)|\{([A-Za-z][A-Za-z0-9]*)\}|(max|min|floor|ceil)\(|([-+*/(),d]))/gy;
    let index = 0;
    let match;
    while (index < formula.length && (match = pattern.exec(formula))) {
      if (match[1] !== undefined) tokens.push({ type: "number", value: Number(match[1]) });
      else if (match[2] !== undefined) tokens.push({ type: "name", value: match[2] });
      else if (match[3] !== undefined) tokens.push({ type: "function", value: match[3] });
      else tokens.push({ type: "symbol", value: match[4] });
      index = pattern.lastIndex;
    }
    if (formula.slice(index).trim()) throw new Error(`無法解析的公式：${formula}`);
    return tokens;
  }

  const isDiceValue = value => typeof value === "object" && value !== null;
  function addClassFormulaValues(left, right, sign) {
    if (!isDiceValue(left) && !isDiceValue(right)) return left + sign * right;
    if (isDiceValue(right) && sign < 0) throw new Error("骰子不可相減");
    const base = isDiceValue(left) ? left : { dice: [], constant: left, hasConstant: true };
    if (isDiceValue(right)) {
      return { dice: [...base.dice, ...right.dice], constant: base.constant + right.constant, hasConstant: base.hasConstant || right.hasConstant };
    }
    return { dice: base.dice, constant: base.constant + sign * right, hasConstant: true };
  }

  function evaluateClassFormula(formula, resolveName) {
    const tokens = tokenizeClassFormula(String(formula));
    let position = 0;
    const peek = value => tokens[position]?.type !== "number" && tokens[position]?.type !== "name" && tokens[position]?.value === value;
    const take = value => {
      const token = tokens[position];
      if (!token || (value !== undefined && token.value !== value)) throw new Error(`公式缺少「${value}」：${formula}`);
      position += 1;
      return token;
    };
    const number = value => {
      if (isDiceValue(value)) throw new Error(`骰子只能相加：${formula}`);
      return value;
    };
    const parseExpression = () => {
      let value = parseTerm();
      while (peek("+") || peek("-")) {
        const sign = take().value === "+" ? 1 : -1;
        value = addClassFormulaValues(value, parseTerm(), sign);
      }
      return value;
    };
    const parseTerm = () => {
      let value = parseDice();
      while (peek("*") || peek("/")) {
        const operator = take().value;
        const right = number(parseDice());
        value = operator === "*" ? number(value) * right : number(value) / right;
      }
      return value;
    };
    // d 的優先順序高於乘除：max(1, {wisModifier})d8、1d{martialArtsDie}、{rageDamage}d6。
    const parseDice = () => {
      const count = parseUnary();
      if (!peek("d")) return count;
      take("d");
      return { dice: [{ count: number(count), sides: number(parseUnary()) }], constant: 0, hasConstant: false };
    };
    const parseUnary = () => {
      if (!peek("-")) return parsePrimary();
      take("-");
      return -number(parseUnary());
    };
    const parsePrimary = () => {
      const token = take();
      if (token.type === "number") return token.value;
      if (token.type === "name") return resolveName(token.value);
      if (token.type === "function") {
        const args = [number(parseExpression())];
        while (peek(",")) {
          take(",");
          args.push(number(parseExpression()));
        }
        take(")");
        return token.value === "floor" || token.value === "ceil" ? Math[token.value](args[0]) : Math[token.value](...args);
      }
      if (token.value === "(") {
        const value = parseExpression();
        take(")");
        return value;
      }
      throw new Error(`公式有多餘的「${token.value}」：${formula}`);
    };
    const value = parseExpression();
    if (position < tokens.length) throw new Error(`公式有多餘的內容：${formula}`);
    return value;
  }

  function formatClassFormulaValue(value) {
    if (!isDiceValue(value)) return String(value);
    const dice = value.dice.map(item => `${item.count}d${item.sides}`).join(" + ");
    if (!value.hasConstant || !dice) return dice || String(value.constant);
    return `${dice} ${value.constant < 0 ? "-" : "+"} ${Math.abs(value.constant)}`;
  }

  // context：{ level, levelBlank, abilityScores: { str: "14", … } }。
  // 屬性值空白或無效時調整值視為 0、未填等級時視為 1，並記錄為 blank（values 的 blank 決定顯示）。
  function createClassValueScope(className, context = {}) {
    const rules = getClassRules(className);
    const level = Number.parseInt(context.level, 10) || 1;
    const state = { blank: false };
    const resolving = new Set();
    const resolveName = name => {
      if (name === "level") {
        if (context.levelBlank) state.blank = true;
        return level;
      }
      if (name === "proficiencyBonus") return calculateProficiencyBonus(level);
      if (Object.hasOwn(ABILITY_MODIFIER_TOKENS, name)) {
        const raw = String(context.abilityScores?.[ABILITY_MODIFIER_TOKENS[name]] ?? "").trim();
        if (!/^[+-]?\d+$/u.test(raw)) {
          state.blank = true;
          return 0;
        }
        return calculateAbilityModifier(raw);
      }
      if (Object.hasOwn(rules?.progression || {}, name)) return getClassProgressionValue(className, name, level) ?? 0;
      const entry = rules?.values?.[name];
      if (entry === undefined || entry.byLevel || resolving.has(name)) throw new Error(`${className}：無法計算 {${name}}`);
      resolving.add(name);
      try {
        return evaluateClassFormula(entry.formula ?? entry, resolveName);
      } finally {
        resolving.delete(name);
      }
    };
    return { rules, level, state, resolveName };
  }

  /** 計算職業 values 或特性表欄位的數值（數字，或骰子加常數的物件）；無法計算時回傳 null。 */
  function evaluateClassValue(className, name, context = {}) {
    try {
      return createClassValueScope(className, context).resolveName(name);
    } catch (error) {
      return null;
    }
  }

  /**
   * 跑團顯示的職業數值文字（職業內容檔文字中的 {名稱|…}）：特性表欄位套用欄位的 format；
   * values 公式套用 format；byLevel 文字取目前等級。回傳 null 表示保留職業頁文字
   * （未達等級、欄位為「-」，或屬性值／等級未填且 blank 為 keep）。
   */
  function getClassValueText(className, name, context = {}) {
    const scope = createClassValueScope(className, context);
    const { rules, level, state } = scope;
    if (name === "level" || name === "proficiencyBonus") return String(scope.resolveName(name));
    if (!rules) return null;
    const column = rules.progression?.[name];
    if (column) {
      const value = getClassProgressionValue(className, name, level);
      if (value === null) return null;
      return column.format ? column.format.replace("{}", String(value)) : String(value);
    }
    const entry = rules.values?.[name];
    if (entry === undefined) return null;
    if (entry.byLevel) {
      let text = null;
      for (const [from, item] of Object.entries(entry.byLevel)) if (Number(from) <= level) text = item;
      return text;
    }
    // 只引用一個特性表欄位（例如 { formula: "{rageUses}", format: "{} 次" }）且該欄位為「-」時保留職業頁文字。
    const onlyColumn = String(entry.formula ?? entry).match(/^\{([A-Za-z][A-Za-z0-9]*)\}$/)?.[1];
    if (onlyColumn && Object.hasOwn(rules.progression || {}, onlyColumn) && getClassProgressionValue(className, onlyColumn, level) === null) return null;
    let value;
    try {
      value = scope.resolveName(name);
    } catch (error) {
      return null;
    }
    if (state.blank && entry.blank !== undefined) return entry.blank === "keep" ? null : entry.blank;
    const text = formatClassFormulaValue(value);
    return entry.format ? entry.format.replace("{}", text) : text;
  }

  /** 跑團數值名稱是否由職業資料提供（回歸檢查用）。 */
  function hasClassValue(className, name) {
    const rules = getClassRules(className);
    return name === "level" || name === "proficiencyBonus"
      || Object.hasOwn(rules?.progression || {}, name) || Object.hasOwn(rules?.values || {}, name);
  }

  function getPreparedSpellLimit(className, level) {
    if (!Number.isInteger(Number(level)) || !Object.hasOwn(getClassRules(className)?.progression || {}, "preparedSpells")) return null;
    return getClassProgressionValue(className, "preparedSpells", Number(level));
  }

  function getClassCantripLimit(className, level) {
    const numericLevel = Number(level);
    if (!Number.isInteger(numericLevel) || numericLevel < 1) return 0;
    // Origin/ability cantrips are independent sources and do not enlarge the spellcasting allowance.
    return getClassProgressionValue(className, "cantrips", numericLevel) || 0;
  }

  /** 將屬性值換算成屬性調整值；無效輸入視為 0。 */
  function calculateAbilityModifier(score) {
    const numericScore = Number(score);
    if (!Number.isFinite(numericScore)) return 0;
    return Math.floor((numericScore - 10) / 2);
  }

  /** 取得職業生命骰資料：Y 為一級生命值，Z 為後續每級固定生命值。 */
  function getHitDiceValues(className) {
    const hitDie = getClassRules(className)?.hitDie;
    return hitDie ? Object.freeze({ Y: hitDie, Z: hitDie / 2 + 1 }) : { Y: 0, Z: 0 };
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

    maxHp += (getRaceRules(options.race)?.hpPerLevel || 0) * normalizedLevel;
    if (hasClassFeature(className, "sorcerer-draconic-resilience", normalizedLevel, options.subclass)) maxHp += normalizedLevel;
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

  /** 種族可選體型超過一種時（例如人類、提夫林），角色卡顯示體型選單。 */
  function canChooseCharacterSize(race) {
    return (getRaceRules(race)?.sizes.length || 0) > 1;
  }

  /** 優先使用種族固定體型；可選體型或沒有種族時採用經驗證的備用值。 */
  function getCharacterSizeForRace(race, fallbackSize = "") {
    const sizes = getRaceRules(race)?.sizes || [];
    return sizes.length === 1 ? sizes[0] : normalizeCharacterSize(fallbackSize);
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

  /** 萬事通只加在尚未套用熟練加值的能力檢定。 */
  function getJackOfAllTradesBonus(className, level, hasProficiency = false) {
    if (className !== "bard" || !(Number.parseInt(level, 10) >= 2) || hasProficiency) return 0;
    return Math.floor(calculateProficiencyBonus(level) / 2);
  }

  // 資源說明（resource.note）中的 {名稱} 換成目前數值。
  function formatClassResourceNote(className, note, context) {
    return note.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (all, name) => {
      const value = evaluateClassValue(className, name, context);
      return value === null ? all : formatClassFormulaValue(value);
    });
  }

  // 短休特殊恢復（resource.restChoice，例如奧術回想、術法復甦、自然恢復）：恢復的內容與總量取自職業內容檔。
  function getClassResourceRestChoice(className, restChoice, context) {
    if (!restChoice) return null;
    const budget = evaluateClassValue(className, restChoice.budget, context);
    if (restChoice.restores === "points") {
      return { when: restChoice.when, effect: "points", targetKey: restChoice.target, budget };
    }
    return { when: restChoice.when, effect: "spellSlots", budget, ...(restChoice.maxSlotLevel ? { maximumSlotLevel: restChoice.maxSlotLevel } : {}) };
  }

  /** 依目前職業、種族、等級與屬性計算跑團模式應顯示的內建資源。 */
  function getCharacterResourceSpecs(options = {}) {
    const className = String(options.className || "").trim();
    const race = String(options.race || "").trim();
    const level = Number.parseInt(options.level, 10);
    if (!Number.isInteger(level) || level < 1) return [];
    const proficiency = calculateProficiencyBonus(level);
    const resources = [];
    const recovery = (shortRest = null) => Object.freeze({ shortRest, longRest: "all" });
    const addUses = (key, label, maximum, recoveryNote, shortRest = null, restChoice = null) => resources.push({
      key,
      kind: "uses",
      label,
      maximum,
      recoveryNote,
      target: Object.freeze({ type: "builtIn", key }),
      recovery: recovery(shortRest),
      restChoice: restChoice && Object.freeze(restChoice)
    });
    const addPoints = (key, label, maximum, recoveryNote, shortRest = null) => resources.push({
      key,
      kind: "points",
      label,
      maximum,
      recoveryNote,
      target: Object.freeze({ type: "builtIn", key }),
      recovery: recovery(shortRest)
    });

    const recoveryNoteFor = (uses, shortRest) => {
      const fully = uses === 1 ? "回復" : "全回復";
      return shortRest === null ? `長休後${fully}。` : (shortRest === "all" ? `短休或長休後${fully}。` : `短休回 ${shortRest} 次，長休全回。`);
    };

    // 種族資源：種族內容檔各特質的 resource，達到特質等級才出現（次數資源在職業資源之前，勾選框在職業資源之後）。
    const raceResourceTraits = (getRaceRules(race)?.traits || []).filter(trait => trait.resource && level >= trait.level);
    const raceUses = uses => uses === "proficiencyBonus" ? proficiency : uses;
    raceResourceTraits.filter(trait => !trait.resource.kind).forEach(({ resource }) => {
      const shortRest = resource.recover?.short ?? null;
      addUses(resource.key, resource.label, raceUses(resource.uses), recoveryNoteFor(resource.uses, shortRest), shortRest);
    });

    // 職業資源：職業內容檔各能力（含子職）的 resource，達到能力等級才出現。
    const valueContext = { level, abilityScores: { wis: options.wisdomScore ?? 10, cha: options.charismaScore ?? 10 } };
    for (const feature of getClassFeatureRules(className)) {
      const resource = feature.resource;
      if (!resource || level < feature.level) continue;
      const maximum = typeof resource.uses === "number" ? resource.uses : evaluateClassValue(className, resource.uses, valueContext);
      let recover = resource.recover;
      for (const [from, entry] of Object.entries(resource.recoverByLevel || {})) if (Number(from) <= level) recover = entry;
      const shortRest = recover.short ?? null;
      const recoveryNote = resource.note ? formatClassResourceNote(className, resource.note, valueContext) : recoveryNoteFor(resource.uses, shortRest);
      const label = resource.label || feature.name;
      if (resource.kind === "points") addPoints(resource.key, label, maximum, recoveryNote, shortRest);
      else addUses(resource.key, label, maximum, recoveryNote, shortRest, getClassResourceRestChoice(className, resource.restChoice, valueContext));
    }
    // Canonical controls are described here; callers only supply existing spell-source identities.
    const addControls = (key, label, ids, shortRest = null) => resources.push({
      key, label, kind: "canonical", maximum: ids.length,
      target: Object.freeze({ type: "checkboxes", ids: Object.freeze(ids) }),
      recovery: recovery(shortRest)
    });
    // 種族的勾選框資源（例如吐息元素）；requiresChoice 的資源在選了血統選項（options.raceChoice）後才出現。
    raceResourceTraits.filter(trait => trait.resource.kind === "checkboxes").forEach(({ resource }) => {
      if (resource.requiresChoice && !options.raceChoice) return;
      addControls(resource.key, resource.label, Array.from({ length: raceUses(resource.uses) }, (_, i) => `${resource.checkbox}${i + 1}`));
    });
    if (hasClassFeature(className, "druid-natural-recovery", level, options.subclass) && options.druidLand) {
      addControls("druid-natural-recovery-free", "自然恢復（免費施法）", ["druid-natural-recovery-used"]);
    }
    for (const group of options.spellSlotGroups || []) {
      addControls(`spell-slots-${group.level}`, `${group.level} 環法術位`, [...group.ids], className === "warlock" ? "all" : null);
    }
    for (const group of options.freeSpellUses || []) {
      addControls(`free-${group.key}`, group.label, [...group.ids]);
    }
    raceResourceTraits.filter(trait => trait.resource.kind === "inspiration").forEach(({ resource }) => resources.push({
      key: resource.key, label: resource.label, kind: "canonical",
      target: Object.freeze({ type: "checkbox", id: "heroic-inspiration" }),
      recovery: Object.freeze({ shortRest: null, longRest: "grant" })
    }));
    if (options.hasTravelCompanion) resources.push({
      key: "travel-companion", label: "最佳旅伴", kind: "restChoice",
      target: Object.freeze({ type: "state", key: "temporaryHp" }),
      restChoice: Object.freeze({ when: "either", effect: "temporaryHp", level,
        abilities: Object.freeze(["wis", "cha"]) })
    });
    return resources.map(resource => Object.freeze(resource));
  }

  /** 取得指定職業熟練的兩項豁免屬性代號。 */
  function getClassSaveProficiencies(classId) {
    return getClassRules(classId)?.saves || [];
  }

  /** 判斷職業、背景、種族或魔法學徒專長是否提供施法能力。 */
  function hasSpellcastingCapabilityForSelections(options = {}) {
    const className = String(options.className || "").trim();
    const background = String(options.background || "").trim();
    const raceRule = getRaceRules(String(options.race || "").trim());
    const spellcasting = getClassRules(className)?.spellcasting;
    // 只看內建背景：給予魔法學徒（有法術列表）的背景提供施法；自訂背景與未選擇時不判定（魔法學徒另由 hasMagicInitiate 傳入）。
    const builtInBackground = background === "custom" ? null : getBackgroundRules(background);

    if (spellcasting && spellcasting !== "none") return true;
    if (builtInBackground?.feat.spellList) return true;
    if (raceRule?.spellcasting) return true;
    if (options.hasMagicInitiate) return true;

    return !(
      spellcasting === "none"
      && builtInBackground
      && raceRule
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
    return getClassProgressionValue(className, "invocations", Number.isFinite(numericLevel) && numericLevel > 1 ? numericLevel : 1) || 0;
  }

  /** 依等級取得武僧武藝傷害骰（特性表「武藝」欄）。 */
  function getMonkMartialArtsDieByLevel(level) {
    const numericLevel = Number(level);
    return getClassValueText("monk", "martialArtsDie", { level: Number.isFinite(numericLevel) && numericLevel >= 1 ? numericLevel : 1 });
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

  /**
   * 取得指定職業與等級的一至四環法術位數量，依特性表欄位：spellSlots1～spellSlots4（各環數量），
   * 契約魔法（spellcasting: pact）為 spellSlots（數量）與 spellSlotLevel（環階）。
   */
  function getSpellSlotCounts(className, level) {
    const numericLevel = Number(level);
    const rules = getClassRules(className);
    if (!Number.isInteger(numericLevel) || !rules || rules.spellcasting === "none") return [0, 0, 0, 0];
    if (rules.spellcasting === "pact") {
      const slotLevel = getClassProgressionValue(className, "spellSlotLevel", numericLevel);
      const count = getClassProgressionValue(className, "spellSlots", numericLevel) || 0;
      return [1, 2, 3, 4].map(spellLevel => (spellLevel === slotLevel ? count : 0));
    }
    return [1, 2, 3, 4].map(spellLevel => getClassProgressionValue(className, `spellSlots${spellLevel}`, numericLevel) || 0);
  }

  /** 判斷職業在指定角色等級是否可使用某一法術環階。 */
  function classCanAccessSpellLevel(className, characterLevel, spellLevel) {
    const numericSpellLevel = Number(spellLevel);
    if (!Number.isInteger(numericSpellLevel) || numericSpellLevel < 0 || numericSpellLevel > 4) return false;
    if (numericSpellLevel === 0) return Object.hasOwn(getClassRules(className)?.progression || {}, "cantrips");

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
    if (!armor && hasClassFeature(className, "sorcerer-draconic-resilience", level, options.subclass)) {
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

  // 角色卡的基礎速度欄（speed-input）預設 30，適用速度 30 呎的種族；種族或所選血統的速度不是 30 時以內容檔為準。
  const DEFAULT_BASE_SPEED = 30;

  /** 計算角色速度，包含種族（options.raceChoice 為所選血統）速度及武僧、野蠻人、遊俠的職業加值條件。 */
  function calculateCharacterSpeed(options = {}) {
    const baseSpeedValue = Number.parseFloat(options.baseSpeed);
    const race = String(options.race || "").trim();
    const className = String(options.className || "").trim();
    const level = Number.parseInt(options.level, 10);

    const raceSpeed = getRaceChoiceOption(race, String(options.raceChoice || "").trim())?.speed ?? getRaceRules(race)?.speed;
    const baseSpeed = raceSpeed && raceSpeed !== DEFAULT_BASE_SPEED ? raceSpeed : baseSpeedValue;
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
    if (monkBonusApplies) classSpeedBonus = getClassProgressionValue("monk", "unarmoredMovement", level) || 0;
    else if (barbarianBonusApplies || rangerBonusApplies) classSpeedBonus = 10;
    const featSpeedBonus = options.hasSpeedyFeat ? 10 : 0;
    return String(baseSpeed + classSpeedBonus + featSpeedBonus);
  }

  // 已知形態、最大 CR 與飛行以職業文本的 2／4／8 級野獸形態表為準；使用次數與時數取自德魯伊內容檔。
  function getDruidWildShapeRules(level) {
    const value = Number.parseInt(level, 10) || 0;
    return Object.freeze({
      known: value >= 8 ? 8 : value >= 4 ? 6 : value >= 2 ? 4 : 0,
      maxCr: value >= 8 ? 1 : value >= 4 ? 0.5 : 0.25,
      flight: value >= 8,
      maximum: getClassProgressionValue("druid", "wildShapeUses", value) || 0,
      hours: value >= 1 ? evaluateClassValue("druid", "wildShapeHours", { level: value }) ?? 0 : 0,
      aidDice: value >= 14 ? "4d6" : value >= 10 ? "3d6" : "2d6"
    });
  }

  const CharacterSkillAbilities = Object.freeze({
    "運動": "str", "體操": "dex", "巧手": "dex", "隱匿": "dex",
    "奧秘": "int", "歷史": "int", "調查": "int", "自然": "int", "宗教": "int",
    "馴獸": "wis", "洞悉": "wis", "醫藥": "wis", "察覺": "wis", "求生": "wis",
    "欺瞞": "cha", "威嚇": "cha", "表演": "cha", "遊說": "cha"
  });

  function isDruidBeastAllowed(form, level) {
    if (!form) return false;
    const rule = getDruidWildShapeRules(level);
    const parts = String(form.cr).split("/").map(Number);
    const cr = parts.length === 2 ? parts[0] / parts[1] : parts[0];
    return rule.known > 0 && cr <= rule.maxCr && (!form.hasFlight || rule.flight);
  }

  // 保留角色熟練與特性加值，以新屬性重算，再與野獸明列的技能／豁免取高。
  function calculateWildShapeCheck(originalTotal, originalScore, effectiveScore, beastTotal) {
    const own = Number(originalTotal) - calculateAbilityModifier(originalScore) + calculateAbilityModifier(effectiveScore);
    return Number.isFinite(beastTotal) ? Math.max(own, beastTotal) : own;
  }

  // 將純規則函式提供給 index.html 的傳統 script 呼叫。
  Object.assign(globalScope, {
    calculateAbilityModifier,
    CharacterSkillAbilities,
    getDruidWildShapeRules,
    isDruidBeastAllowed,
    calculateWildShapeCheck,
    calculateArmorClass,
    calculateCharacterMaxHp,
    calculateCharacterSpeed,
    calculateProficiencyBonus,
    calculateWarlockInvocationSelectionLimit,
    classCanAccessSpellLevel,
    clampHpValue,
    formatSignedValue,
    getCharacterSizeForRace,
    canChooseCharacterSize,
    getRaceRules,
    getRaceText,
    getAllRaceRules,
    getRaceChoiceOption,
    getBackgroundRules,
    getBackgroundText,
    getBackgroundSource,
    getBackgroundSourceLabel,
    getDamageTypeLabel,
    getCharacterResourceSpecs,
    getClassSaveProficiencies,
    getClassRules,
    getClassProgressionValue,
    getClassFeatureRules,
    getSelectedSubclassId,
    getSelectedSubclass,
    hasClassFeature,
    evaluateClassValue,
    getClassValueText,
    hasClassValue,
    getHitDiceValues,
    getJackOfAllTradesBonus,
    getMetamagicSelectionLimit,
    getMonkMartialArtsDieByLevel,
    getPaladinAuraSavingThrowBonus,
    getShillelaghTargetHand,
    getShillelaghWeaponEffect,
    getSpellSlotCounts,
    getPreparedSpellLimit,
    getClassCantripLimit,
    hasSpellcastingCapabilityForSelections,
    normalizeCharacterSize,
    parseSignedValue
  });
})(window);

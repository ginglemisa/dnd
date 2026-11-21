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

  // 內容來源標籤：內容檔（背景、專長等）source 為 extended（本站另外撰寫）與自訂背景顯示的字樣；srd 不加標籤。
  const CONTENT_SOURCE_LABELS = Object.freeze({ extended: "擴充", custom: "擴充" });

  /** 背景來源：內建背景為內容檔的 source（srd／extended），自訂背景為 custom；沒有選擇或不認得時為空字串。讀取來源只經過這裡。 */
  function getBackgroundSource(background) {
    return getBackgroundRules(background)?.source || "";
  }

  /** 內容來源的顯示標籤（例如「擴充」，不含括號）；沒有標籤時為空字串。建置產生選單與說明文字時也讀這裡，標籤字樣只在這裡決定。 */
  function getContentSourceLabel(source) {
    return CONTENT_SOURCE_LABELS[source] || "";
  }

  /** 內容來源的說明（extended 為「「擴充」為本站以 SRD 為基底另行編寫。」）；其他來源為空字串。建置產生專長說明時也讀這裡。 */
  function getContentSourceNotice(source) {
    return source === "extended" ? `「${getContentSourceLabel(source)}」為本站以 SRD 為基底另行編寫。` : "";
  }

  /**
   * 名稱加上類別與來源標籤，例如「醫療兵(起源・擴充)」「耕者(擴充)」「警覺(起源)」；沒有標籤時只有名稱。
   * tags 是放在來源標籤前的其他標籤（例如專長類別）。選單、背景頁與快速創角的標籤寫法都由這裡產生（半形括號、以「・」連接）。
   */
  function formatContentSourceName(name, source, tags = []) {
    const labels = [...tags, getContentSourceLabel(source)].filter(Boolean);
    return labels.length ? `${name}(${labels.join("・")})` : String(name);
  }

  // 專長規則：feat-content.generated.js 由 content/srd/feats 產生 featRules（類別、來源、可否重複、先決條件、跑團動作）；
  // 專長 ID 即存檔的專長值。不認得的專長回傳 null。
  function getFeatRules(feat) {
    const rules = typeof featRules === "undefined" ? null : featRules;
    return rules && Object.hasOwn(rules, feat) ? rules[feat] : null;
  }

  /** 專長的顯示文字（featText：選單文字、說明 HTML、純文字說明、PDF 專長欄各行、跑團動作說明）。 */
  function getFeatText(feat) {
    const text = typeof featText === "undefined" ? null : featText;
    return text && Object.hasOwn(text, feat) ? text[feat] : null;
  }

  /** 全部專長的規則（專長 ID → featRules），依專長選單順序。 */
  function getAllFeatRules() {
    return typeof featRules === "undefined" ? {} : featRules;
  }

  // 專長類別（專長內容檔的 type）的顯示名稱，依自行管理專長分類選單的順序：short 為選單與 PDF 的簡稱，full 為說明副標的全名。
  // 建置產生專長文字時也讀這裡，類別字樣只在這裡決定。
  const FEAT_TYPE_LABELS = Object.freeze({
    origin: Object.freeze({ short: "起源", full: "起源專長" }),
    general: Object.freeze({ short: "通用", full: "通用專長" }),
    style: Object.freeze({ short: "戰鬥風格", full: "戰鬥風格專長" }),
    epic: Object.freeze({ short: "傳奇恩惠", full: "傳奇恩惠專長" })
  });

  /** 專長類別的顯示名稱（{ short, full }）；不認得時為 null。 */
  function getFeatTypeLabel(type) {
    return Object.hasOwn(FEAT_TYPE_LABELS, type) ? FEAT_TYPE_LABELS[type] : null;
  }

  // 專長類別的等級門檻（角色等級）：說明副標的「N 級以上」由此產生；傳奇恩惠未達等級時不列在專長選單上。
  const FEAT_TYPE_MIN_LEVELS = Object.freeze({ general: 4, epic: 19 });

  /** 專長類別的等級門檻；沒有門檻時為 1。 */
  function getFeatTypeMinLevel(type) {
    return Object.hasOwn(FEAT_TYPE_MIN_LEVELS, type) ? FEAT_TYPE_MIN_LEVELS[type] : 1;
  }

  /** 全部專長類別，依分類選單順序。 */
  function getFeatTypes() {
    return Object.keys(FEAT_TYPE_LABELS);
  }

  // 傷害類型（種族內容檔的 resistance、魔法物品的額外傷害與抗性等）的顯示名稱，與 SpellCatalog.damageTypeLabels 相同。
  const DAMAGE_TYPE_LABELS = Object.freeze({
    acid: "強酸", bludgeoning: "鈍擊", cold: "冷凍", fire: "火焰", force: "力場", lightning: "閃電", necrotic: "黯蝕",
    piercing: "穿刺", poison: "毒素", psychic: "心靈", radiant: "光耀", slashing: "揮砍", thunder: "雷鳴"
  });

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

  /** PDF 匯出選項中存放血統選擇的 key：選單 ID 的駝峰寫法（例如 elf-lineage → elfLineage）。 */
  function getRaceChoiceOptionKey(choiceId) {
    return String(choiceId).replace(/-([a-z])/g, (all, letter) => letter.toUpperCase());
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

  /**
   * 準備法術（一環以上）可以挑選的職業法表：自己的職業，加上已取得能力的 extraSpellLists（例如吟遊詩人 10 級「魔法奧祕」）。
   * 戲法不受影響，仍只用自己的職業法表。從其他法表準備的法術仍算本職業的法術（spellClass 是本職業）。
   */
  function getClassSpellListIds(className, level, subclassId) {
    const numericLevel = Number.parseInt(level, 10) || 0;
    if (!className) return [];
    const extra = getClassFeatureRules(className, subclassId)
      .filter(feature => numericLevel >= feature.level && Array.isArray(feature.extraSpellLists))
      .flatMap(feature => feature.extraSpellLists);
    return [...new Set([className, ...extra])];
  }

  /**
   * 用能使用精通屬性的武器攻擊時，可以改用的精通屬性（內容檔的 masteryOptions，例如戰士 9 級「戰術大師」的推離、削弱、緩速）。
   * 只回傳已取得能力給的名稱，不含武器本身的精通；沒有時是空陣列。
   */
  function getClassMasteryOptions(className, level, subclassId) {
    const numericLevel = Number.parseInt(level, 10) || 0;
    return [...new Set(getClassFeatureRules(className, subclassId)
      .filter(feature => numericLevel >= feature.level && Array.isArray(feature.masteryOptions))
      .flatMap(feature => feature.masteryOptions))];
  }

  /** 職業與子職能力在短休時額外減少的力竭等級（內容檔的 exhaustionRecovery.shortRest，加總）。 */
  function getClassShortRestExhaustionRecovery(className, level, subclassId) {
    const numericLevel = Number.parseInt(level, 10) || 0;
    return getClassFeatureRules(className, subclassId)
      .filter(feature => numericLevel >= feature.level && feature.exhaustionRecovery)
      .reduce((total, feature) => total + (feature.exhaustionRecovery.shortRest || 0), 0);
  }

  /**
   * 職業與子職能力給的傷害抗性（內容檔的 resistances、勾選選項的 resistances、resistancesByChoice 依下拉選單）：
   * 回傳傷害類型 ID，不重複。選項與選單讀角色卡目前的勾選與值。
   */
  function getClassResistances(className, level, subclassId) {
    const numericLevel = Number.parseInt(level, 10) || 0;
    const doc = globalScope.document;
    const types = getClassFeatureRules(className, subclassId).filter(feature => numericLevel >= feature.level).flatMap(feature => [
      ...(feature.resistances || []),
      ...(feature.options || []).filter(option => option.resistances && doc?.getElementById?.(option.id)?.checked).flatMap(option => option.resistances),
      ...(feature.resistancesByChoice ? feature.resistancesByChoice.choices
        .find(choice => choice.value === doc?.getElementById?.(feature.resistancesByChoice.control)?.value)?.resistances || [] : [])
    ]);
    return [...new Set(types)];
  }

  /**
   * 不消耗法術位的施法方式（能力的 freeCast，例如牧師 10 級「神聖干預」）：已取得能力時回傳
   * { featureId, label, resource, maxLevel, lists, excludeCastingTimes }，由跑團施法視窗列為一種施法方式，扣該能力的資源。
   */
  function getClassFreeCastFeatures(className, level, subclassId) {
    const numericLevel = Number.parseInt(level, 10) || 0;
    return getClassFeatureRules(className, subclassId)
      .filter(feature => numericLevel >= feature.level && feature.freeCast)
      .map(feature => Object.freeze({
        featureId: feature.id,
        label: feature.name,
        resource: feature.freeCast.resource,
        maxLevel: feature.freeCast.maxLevel,
        lists: Object.freeze([...(feature.freeCast.lists || [className])]),
        excludeCastingTimes: Object.freeze([...(feature.freeCast.excludeCastingTimes || [])])
      }));
  }

  /** 職業的熟練機制資料（proficiencies：武器類別、護甲訓練、職業工具）；沒有時回傳 null。 */
  function getClassProficiencies(className) {
    return getClassRules(className)?.proficiencies || null;
  }

  /** 選擇在指定等級的數量：數字，或特性表欄位在該等級的值（未達最低等級時為 0）。 */
  function getClassPickCount(className, pick, level) {
    return typeof pick.count === "number" ? pick.count : getClassProgressionValue(className, pick.count, level) ?? 0;
  }

  /**
   * 角色在此等級已取得的選擇（內容檔能力的 picks，含目前子職）；kind 有值時只列該種類。
   * 每項為 { feature, pick, count }，count 是目前等級的數量，pick.fields 是存檔欄位 ID（可能比 count 多）。
   */
  function getClassPicks(className, level, { kind, subclassId } = {}) {
    const numericLevel = Number.parseInt(level, 10) || 0;
    return getClassFeatureRules(className, subclassId)
      .filter(feature => feature.picks && numericLevel >= feature.level)
      .flatMap(feature => feature.picks.filter(pick => !kind || pick.kind === kind)
        .map(pick => ({ feature, pick, count: getClassPickCount(className, pick, numericLevel) })));
  }

  /**
   * 此等級生效的 grants：能力層（取得能力即生效）與勾選中的選項（isChecked(選項 ID) 為 true）。
   * 每項為 { feature, option, grants }，能力層的 option 為 null。
   */
  function getClassGrants(className, level, isChecked = () => false, subclassId) {
    const numericLevel = Number.parseInt(level, 10) || 0;
    return getClassFeatureRules(className, subclassId).filter(feature => numericLevel >= feature.level).flatMap(feature => [
      ...(feature.grants ? [{ feature, option: null, grants: feature.grants }] : []),
      ...(feature.options || []).filter(option => option.grants && isChecked(option.id)).map(option => ({ feature, option, grants: option.grants }))
    ]);
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
      // context.proficiencyBonus：角色卡算好的熟練加值（含魔法物品，index.html 的 getProficiencyBonus）；沒給時依等級。
      if (name === "proficiencyBonus") return Number.isFinite(context.proficiencyBonus) ? context.proficiencyBonus : calculateProficiencyBonus(level);
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

  /** 職業或子職能力的顯示名稱（計算說明用；規則判斷仍用能力 ID）。 */
  function getClassFeatureName(className, featureId, subclassId) {
    return getClassFeatureRules(className, subclassId).find(feature => feature.id === featureId)?.name || "";
  }

  /**
   * 最大生命值的算式明細，calculateCharacterMaxHp 與計算說明視窗共用：{ total, hitDie, level, rows }。
   * rows 為 [{ label, detail, expression, value }]，不符合條件的加值不列；體質調整值一定列。
   * magicHitPointSources 是 [{ label, perLevel }]（getActiveMagicEffects().sources 的 hitPointsPerLevel），沒給時以「魔法物品」一行顯示。
   */
  function getCharacterMaxHpBreakdown(options = {}) {
    const className = String(options.className || "").trim();
    const level = Number.parseInt(options.level, 10);
    const normalizedLevel = Number.isFinite(level) && level > 0 ? level : 1;
    const constitutionModifier = calculateAbilityModifier(options.constitutionScore);
    const { Y: firstLevelHp, Z: laterLevelHp } = getHitDiceValues(className);
    const rows = [];
    const add = (label, detail, expression, value) => rows.push({ label, detail, expression, value });

    add("1 級：生命骰最大值", `d${firstLevelHp} 的最大值`, String(firstLevelHp), firstLevelHp);
    if (normalizedLevel > 1) {
      add("2 級起每級固定值", `${firstLevelHp} ÷ 2 + 1 = ${laterLevelHp}，共 ${normalizedLevel - 1} 個等級`,
        `${laterLevelHp} × ${normalizedLevel - 1}`, laterLevelHp * (normalizedLevel - 1));
    }
    add("體質調整值 × 等級", "", `${formatSignedValue(constitutionModifier) || "0"} × ${normalizedLevel}`, constitutionModifier * normalizedLevel);

    const race = getRaceRules(options.race);
    const racePerLevel = race?.hpPerLevel || 0;
    if (racePerLevel) {
      const traitNames = (race.traits || []).filter(trait => trait.hpPerLevel).map(trait => trait.name);
      add(traitNames.join("、") || race.name, `種族：每級 +${racePerLevel}`, `${racePerLevel} × ${normalizedLevel}`, racePerLevel * normalizedLevel);
    }
    if (hasClassFeature(className, "sorcerer-draconic-resilience", normalizedLevel, options.subclass)) {
      add(getClassFeatureName(className, "sorcerer-draconic-resilience", options.subclass), "子職：每級 +1", `1 × ${normalizedLevel}`, normalizedLevel);
    }
    if (options.hasToughFeat) add("強韌體魄", "專長：每級 +2", `2 × ${normalizedLevel}`, normalizedLevel * 2);
    // 魔法物品的每級生命值上限加值（狂戰斧，getActiveMagicEffects().hitPointsPerLevel）。
    const magicPerLevel = Number(options.magicHitPointsPerLevel) || 0;
    const magicSources = (options.magicHitPointSources || []).filter(source => source.perLevel);
    const listed = magicSources.reduce((sum, source) => sum + source.perLevel, 0) === magicPerLevel
      ? magicSources : magicPerLevel ? [{ label: "魔法物品", perLevel: magicPerLevel }] : [];
    listed.forEach(source => add(source.label, `魔法物品：每級 ${formatSignedValue(source.perLevel)}`,
      `${source.perLevel} × ${normalizedLevel}`, source.perLevel * normalizedLevel));

    return { total: rows.reduce((sum, row) => sum + row.value, 0), hitDie: firstLevelHp, level: normalizedLevel, rows };
  }

  /** 計算最大生命值，包含矮人與術士的專案既有加值規則（明細見 getCharacterMaxHpBreakdown）。 */
  function calculateCharacterMaxHp(options = {}) {
    return getCharacterMaxHpBreakdown(options).total;
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

  /** 萬事通只加在尚未套用熟練加值的能力檢定；proficiencyBonus 可傳角色卡算好的熟練加值（含魔法物品），沒給時依等級。 */
  function getJackOfAllTradesBonus(className, level, hasProficiency = false, proficiencyBonus) {
    if (className !== "bard" || !(Number.parseInt(level, 10) >= 2) || hasProficiency) return 0;
    return Math.floor((Number.isFinite(proficiencyBonus) ? proficiencyBonus : calculateProficiencyBonus(level)) / 2);
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
    // options.proficiencyBonus：角色卡算好的熟練加值（含魔法物品）；沒給時依等級。
    const proficiency = Number.isFinite(options.proficiencyBonus) ? options.proficiencyBonus : calculateProficiencyBonus(level);
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
    const valueContext = { level, proficiencyBonus: proficiency, abilityScores: { wis: options.wisdomScore ?? 10, cha: options.charismaScore ?? 10 } };
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
    // 內建與自訂背景都看起源專長的 grantsSpellcasting（例如魔法學徒）；未選擇或自訂背景尚未設定時不判定。
    const backgroundRule = getBackgroundRules(background);

    if (spellcasting && spellcasting !== "none") return true;
    if (getFeatRules(backgroundRule?.feat.id)?.grantsSpellcasting) return true;
    if (raceRule?.spellcasting) return true;
    if (options.hasMagicInitiate) return true;

    return !(
      spellcasting === "none"
      && backgroundRule
      && raceRule
    );
  }

  /** 回傳目前角色卡允許選擇的超魔法數量。 */
  // 超魔法可勾選數量：術士內容檔的 values.metamagicKnown（依等級）；沒給等級時讀角色卡目前等級。
  function getMetamagicSelectionLimit(level) {
    const numericLevel = Number.parseInt(level ?? globalScope.document?.getElementById?.("level")?.value, 10) || 1;
    const value = hasClassValue("sorcerer", "metamagicKnown") ? evaluateClassValue("sorcerer", "metamagicKnown", { level: numericLevel }) : null;
    return Number.isFinite(value) && value > 0 ? value : 2;
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

  /** 套用橡棍術至短棒或長棍；5 級起傷害骰提升為 1d10。damageType 為選定的傷害類型（力場或武器原本的鈍擊），未給時為鈍擊。 */
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
      damageType: String(options.damageType || "").trim() || "鈍擊"
    });
  }

  /** 橡棍術一次只套用一把武器；符合時優先選擇主手，否則選擇副手。 */
  function getShillelaghTargetHand(options = {}) {
    if (!options.isPrepared) return null;
    if (SHILLELAGH_WEAPON_NAMES.has(String(options.mainHandWeaponName || "").trim())) return "main";
    if (SHILLELAGH_WEAPON_NAMES.has(String(options.offHandWeaponName || "").trim())) return "off";
    return null;
  }

  // 法術環階的上限（SRD 的九環）。各職業實際有幾環法術位全看特性表欄位，這裡只決定陣列長度。
  const MAX_SPELL_SLOT_LEVEL = 9;

  /**
   * 取得指定職業與等級的一至九環法術位數量（固定 9 格，沒有的環階為 0），依特性表欄位：spellSlots1～spellSlots9（各環數量），
   * 契約魔法（spellcasting: pact）為 spellSlots（數量）與 spellSlotLevel（環階）。
   */
  function getSpellSlotCounts(className, level) {
    const numericLevel = Number(level);
    const rules = getClassRules(className);
    const rings = Array.from({ length: MAX_SPELL_SLOT_LEVEL }, (_, index) => index + 1);
    if (!Number.isInteger(numericLevel) || !rules || rules.spellcasting === "none") return rings.map(() => 0);
    if (rules.spellcasting === "pact") {
      const slotLevel = getClassProgressionValue(className, "spellSlotLevel", numericLevel);
      const count = getClassProgressionValue(className, "spellSlots", numericLevel) || 0;
      return rings.map(spellLevel => (spellLevel === slotLevel ? count : 0));
    }
    return rings.map(spellLevel => getClassProgressionValue(className, `spellSlots${spellLevel}`, numericLevel) || 0);
  }

  /** 判斷職業在指定角色等級是否可使用某一法術環階（看特性表的法術位）。 */
  function classCanAccessSpellLevel(className, characterLevel, spellLevel) {
    const numericSpellLevel = Number(spellLevel);
    if (!Number.isInteger(numericSpellLevel) || numericSpellLevel < 0 || numericSpellLevel > MAX_SPELL_SLOT_LEVEL) return false;
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

  // 目前是否穿甲、持盾（防禦護腕的「沒穿護甲且沒用盾牌」）；未受盾牌訓練也算持盾。
  // handBases：主手、副手的基本款品名（魔法款回基本款，武僧的「武藝」原樣），給 effects.weapons 與 unarmedStrike 比對。
  function readMagicEffectContext() {
    const field = id => globalScope.document?.getElementById?.(id)?.value || "";
    const armorName = field("armor");
    const armorIsShield = globalScope.isShieldItem?.(armorName) === true;
    const baseName = name => (name && globalScope.getEquipmentBaseName?.(name)) || name;
    return {
      wearingArmor: Boolean(armorName) && !armorIsShield,
      usingShield: armorIsShield || globalScope.isEffectiveEquippedShield?.() === true,
      handBases: { mainHand: baseName(field("mainHand")), offHand: baseName(field("offHand")) }
    };
  }

  /**
   * 荒野形態變身時的裝備格（跑團 combatState.druid.equipment 的 key），對應只寫在這裡：
   * 護甲欄（魔法護甲，或放在護甲欄的盾牌）→ armor；主手（武器、法杖、手持物品）→ main；
   * 副手與主手 2 的盾牌（盾牌、手持物品）→ off；其他穿戴或帶在身上的物品（戒指、斗篷、靴子、艾恩石、背包裡 when: owned 的效果）→ other。
   */
  function getWildShapeEquipmentGroup(entry) {
    if (entry.slot === "armor") return "armor";
    if (entry.slot === "mainHand") return "main";
    if (entry.slot === "offHand" || entry.slot === "shield") return "off";
    return "other";
  }

  // 武僧武藝的攻擊列名稱（index.html 的 getMonkMartialArtsWeapon）：魔法物品的 unarmedStrike 只加在這一手。
  const UNARMED_ATTACK_NAME = "武藝";

  function emptyMagicHand() {
    return { attack: 0, damage: 0, label: "", sources: [], extraDamage: [], damageType: "", finesse: false, thrown: null, proficiencyAs: [], unarmed: null, notes: [] };
  }

  // 提示的固定說法（hints 的結構化詞）接上自由文字，例如「火焰傷害抗性；懂矮人語。」。
  function formatMagicItemHint(hint) {
    const labels = types => types.map(getDamageTypeLabel).join("、");
    const parts = [
      hint.resistances && `${labels(hint.resistances)}傷害抗性`,
      hint.immunities && `免疫${labels(hint.immunities)}傷害`,
      hint.darkvision && `黑暗視覺 ${hint.darkvision} 呎`,
      hint.languages && `懂${hint.languages.join("、")}`,
      hint.advantage && `${hint.advantage.map(target => target === "先攻" ? "先攻擲骰" : `${target}檢定`).join("、")}有優勢`
    ].filter(Boolean);
    return `${parts.length ? `${parts.join("；")}。` : ""}${hint.text || ""}`;
  }

  /**
   * 目前生效的魔法物品固定加值，規則只在這裡：物品不需同調或已同調才算。
   * - 沒有基本款的物品依使用方式（MagicItemCatalog.getUse()）：worn 要穿上（entry.worn）、held 要放在主手或副手、
   *   wornOrHeld 穿上或放在手上都算、carried 持有就算。有基本款的武器、護甲、盾牌、法杖依下面的裝備位置規則。
   * - hands.mainHand／offHand 的 attack、damage、label：裝備在那一手才算，只影響那一手。
   * - ac.armor、ac.shield：魔法護甲穿著、魔法盾牌持用中才算（盾牌訓練等既有條件由呼叫端判斷）；ac.other 是戒指、斗篷等其他物品。
   * - saves：有基本款的物品持有就算（吉兆之刃不必手持）。
   * - condition held 要裝備在手上，unarmored 要沒穿護甲且沒用盾牌。
   * - spellAttack、spellSaveDc：法術攻擊與法術豁免 DC 加值，條件同 saves。
   * - deathSave：死亡豁免原骰的下限（癒合護符，effects.deathSaveMinimum）與來源物品名稱，條件同技能加值（裝備著才算）。
   * - sources：不靠裝備位置的加值來源 [{ label, ac, saves, spellAttack, spellSaveDc }]，裝備摘要顯示用。
   * - hands 的其他欄位（只影響那一手的武器）：sources [{ label, attack, damage }]（attack、damage 的各來源；label 是來源名稱接起來）、
   *   extraDamage [{ dice, type, label }]（type 為傷害類型 ID 或 weapon）、damageType、finesse、thrown [一般, 遠]、proficiencyAs、
   *   unarmed { dice, type, label }（這一手是武藝時的 unarmedStrike）、notes（武器說明的提示文字）。
   *   weapons（射手護腕等）與 unarmedStrike 來自裝備著的物品，依那一手的基本款（context.handBases）套用。
   * - abilities：屬性效果 { str: [{ label, itemId, set }｜{ label, itemId, bonus, max }｜{ label, itemId, setBonus, max, from }], … }，
   *   物品生效（已同調；有基本款的要裝備著，沒有基本款的依使用方式；效果寫 when: owned 時持有就算）才列；有效值由 getEffectiveAbilityScore() 計算。
   * - hints：提示 [{ uid, label, panel, detail, advantage }]，同一件物品在同一處合成一筆；panel 為 overview 或 skills。
   *   有基本款的物品要裝備著（拿在手上或穿著），沒有基本款的依使用方式；hint.when 為 owned 時持有就算。
   * - skills（技能 ID → 加值）、checks（所有屬性檢定）、proficiencyBonus、hitPointsPerLevel：條件同 saves 以外的一般效果
   *   （hitPoints.when 為 owned 時持有就算）；來源也列在 sources（skills、checks、proficiencyBonus、hitPointsPerLevel 欄位）。
   * - weaponProficiencies：effects.proficiencies 的武器品名（射手護腕）。unarmoredAc：沒穿護甲時的基礎 AC（取最高，0 為沒有）。
   * - armor：穿著中的魔法護甲本身 { trained, noStrengthRequirement, noStealthDisadvantage }。
   * - movement：{ swim, climb, fly: [{ value, label }]（value 為呎數或 "speed"）, hover: [物品名稱], minimum: 0, ignoreArmorStrength: [物品名稱] }。
   * - actions：能力（跑團按鈕）[{ uid, itemId, label, action, pool, alsoPool? }]：action 是 YAML 的 actions 一筆，pool 是它扣的次數池（Inventory.getCharges() 的一筆，含 left）或 null，
   *   alsoPool 是另外再扣 1 次的池；action.spell 是從物品施放的法術（跑團法術頁的「物品」分組，tabletop-spells.js 的 getItemSpellEntries）。
   *   條件同提示（action.when 為 owned 時持有就算；action.option 要選了那個選項），同一種物品的同一個能力只列第一件。
   * context 可傳 { wearingArmor, usingShield, handBases }，省略的欄位讀目前的裝備欄位。
   * context.wildShape 為 { armor, main, off, other }（荒野形態的跑團畫面，變身時每一格是否選「穿戴」）：物品依所在的格子
   * （getWildShapeEquipmentGroup）生效，那一格選穿戴時照平常規則算，融入或掉落時整件不算（含 when: owned 的效果）。
   */
  function getActiveMagicEffects(context = {}) {
    context = { ...readMagicEffectContext(), ...context };
    const result = {
      hands: { mainHand: emptyMagicHand(), offHand: emptyMagicHand() },
      ac: { armor: 0, shield: 0, other: 0 },
      saves: 0,
      spellAttack: 0,
      spellSaveDc: 0,
      sources: [],
      abilities: {},
      hints: [],
      skills: {},
      checks: 0,
      proficiencyBonus: 0,
      hitPointsPerLevel: 0,
      weaponProficiencies: [],
      unarmoredAc: 0,
      armor: { trained: false, noStrengthRequirement: false, noStealthDisadvantage: false },
      movement: { swim: [], climb: [], fly: [], hover: [], minimum: 0, ignoreArmorStrength: [] },
      deathSave: { minimum: 0, sources: [] },
      actions: []
    };
    const addHandBonus = (hand, label, attack, damage) => {
      if (!attack && !damage) return;
      hand.attack += attack || 0;
      hand.damage += damage || 0;
      hand.sources.push({ label, attack: attack || 0, damage: damage || 0 });
      hand.label = hand.sources.map(source => source.label).join("、");
    };
    const handBases = context.handBases || {};
    const catalog = globalScope.MagicItemCatalog;
    const inventory = globalScope.Inventory;
    if (!catalog || !inventory) return result;
    inventory.entries().forEach((entry) => {
      const rule = entry.magic ? catalog.get(entry.magic.id) : null;
      if (!rule || (rule.attunement && !entry.attuned)) return;
      const kind = inventory.getCatalogItem(entry.itemId)?.kind;
      // 荒野形態：物品所在的那一格（護甲、主手、副手、其他）變身時選了穿戴才生效。
      if (context.wildShape && context.wildShape[getWildShapeEquipmentGroup(entry)] !== true) return;
      const use = catalog.getUse(rule.id);
      const inHand = entry.slot === "mainHand" || entry.slot === "offHand";
      const usable = !((use === "worn" && !entry.worn) || (use === "held" && !inHand) || (use === "wornOrHeld" && !entry.worn && !inHand));
      // 有基本款的物品要裝備著（拿在手上或穿著）；沒有基本款的依使用方式。
      const equipped = rule.base ? Boolean(entry.slot) : usable;
      const selection = inventory.getMagicSelection(entry);
      const label = inventory.getLabel(entry);
      const hand = result.hands[entry.slot] || null;
      catalog.getHints(rule.id, selection).forEach((hint) => {
        if (hint.when !== "owned" && !equipped) return;
        const panel = hint.panel || "overview";
        const detail = formatMagicItemHint(hint);
        if (panel === "weapon") {
          if (hand) hand.notes.push(detail);
          return;
        }
        const existing = result.hints.find(item => item.uid === entry.uid && item.panel === panel);
        if (existing) {
          existing.detail += detail;
          existing.advantage.push(...(hint.advantage || []));
        } else {
          result.hints.push({ uid: entry.uid, label, panel, detail, advantage: [...(hint.advantage || [])] });
        }
      });
      // 能力（跑團按鈕與物品法術）：生效條件同提示；寫了 option 的只在選了那個選項時才有；同一種物品同一個能力只列第一件。
      catalog.getActions(rule.id).forEach((action) => {
        if (action.when !== "owned" && !equipped) return;
        if (Object.entries(action.option || {}).some(([optionId, value]) => selection[optionId] !== value)) return;
        if (result.actions.some(item => item.itemId === rule.id && item.action.id === action.id)) return;
        const charges = action.pool ? inventory.getCharges(entry) : [];
        const pool = charges.find(item => item.id === action.pool) || null;
        const alsoPool = action.alsoPool ? charges.find(item => item.id === action.alsoPool) || null : null;
        result.actions.push({ uid: entry.uid, itemId: rule.id, label, action, pool, ...(alsoPool ? { alsoPool } : {}) });
      });
      const effects = catalog.getEffects(entry.magic.id, selection);
      // 屬性效果寫 when: owned 時持有（需同調的已同調）就算，不看穿戴或手持（雷鳴巨棒、雷神之錘）。
      Object.entries(effects.abilities || {}).forEach(([ability, { when, ...effect }]) => {
        if (when === "owned" || equipped) (result.abilities[ability] ||= []).push({ ...effect, label, itemId: rule.id });
      });
      const hitPointsPerLevel = effects.hitPoints && (effects.hitPoints.when === "owned" || equipped) ? effects.hitPoints.perLevel : 0;
      result.hitPointsPerLevel += hitPointsPerLevel;
      if (!usable) {
        if (hitPointsPerLevel) result.sources.push({ label, ac: 0, saves: 0, spellAttack: 0, spellSaveDc: 0, hitPointsPerLevel });
        return;
      }
      // 防禦者：玩家把部分加值轉到 AC 時，攻擊與傷害減少、AC 增加相同數值（裝備在手上且已同調才有 getBonusTransfer）。
      const transferred = hand ? inventory.getBonusTransfer?.(entry.uid)?.value || 0 : 0;
      if (transferred) {
        effects.attack -= transferred;
        effects.damage -= transferred;
      }
      if (effects.condition === "held" && !hand) return;
      if (effects.condition === "unarmored" && (context.wearingArmor || context.usingShield)) return;
      // 裝備中的魔法彈藥：命中與傷害加值加到拿著「用這種彈藥的武器」的那一手（依兩手目前的基本款，例如箭矢對短弓、長弓）。
      // ×0 的彈藥仍是裝備中，但沒有彈藥可射，加值不算。
      if (entry.ammo && entry.quantity > 0) {
        const ammunition = inventory.getAmmunitionType(entry.itemId);
        Object.entries(result.hands).forEach(([slot, target]) => {
          if (ammunition && inventory.getWeaponAmmunition(handBases[slot]) === ammunition) addHandBonus(target, label, effects.attack, effects.damage);
        });
      }
      if (hand) {
        addHandBonus(hand, label, effects.attack, effects.damage);
        (effects.extraDamage || []).forEach(extra => hand.extraDamage.push({ ...extra, label }));
        if (effects.damageType) hand.damageType = effects.damageType;
        if (effects.finesse) hand.finesse = true;
        if (effects.thrown) hand.thrown = [...effects.thrown];
        hand.proficiencyAs.push(...(effects.proficiencyAs || []));
      }
      // 裝備著的物品對特定武器（射手護腕）與徒手打擊（惡魔護甲）的效果，依兩手目前的基本款套用。
      if (equipped) {
        Object.entries(result.hands).forEach(([slot, target]) => {
          if (effects.weapons?.names.includes(handBases[slot])) addHandBonus(target, label, effects.weapons.attack, effects.weapons.damage);
          if (effects.unarmedStrike && handBases[slot] === UNARMED_ATTACK_NAME) {
            target.unarmed = { dice: effects.unarmedStrike.dice, type: effects.unarmedStrike.type, label };
            addHandBonus(target, label, effects.unarmedStrike.attack, effects.unarmedStrike.damage);
          }
        });
      }
      const source = { label, ac: transferred, saves: effects.saves || 0, spellAttack: effects.spellAttack || 0, spellSaveDc: effects.spellSaveDc || 0, hitPointsPerLevel };
      // 技能、檢定、熟練加值、移動與武器熟練：物品生效（裝備著，或沒有基本款的依使用方式）才算。
      if (equipped) {
        source.skills = { ...(effects.skills || {}) };
        source.checks = effects.checks || 0;
        source.proficiencyBonus = effects.proficiencyBonus || 0;
        Object.entries(source.skills).forEach(([skill, bonus]) => { result.skills[skill] = (result.skills[skill] || 0) + bonus; });
        result.checks += source.checks;
        result.proficiencyBonus += source.proficiencyBonus;
        result.weaponProficiencies.push(...(effects.proficiencies || []).filter(name => !result.weaponProficiencies.includes(name)));
        if (effects.unarmoredAc) result.unarmoredAc = Math.max(result.unarmoredAc, effects.unarmoredAc);
        if (effects.deathSaveMinimum) {
          result.deathSave.minimum = Math.max(result.deathSave.minimum, effects.deathSaveMinimum);
          result.deathSave.sources.push(label);
        }
        const movement = effects.movement || {};
        ["swim", "climb", "fly"].forEach((mode) => { if (movement[mode]) result.movement[mode].push({ value: movement[mode], label }); });
        if (movement.hover) result.movement.hover.push(label);
        if (movement.minimum) result.movement.minimum = Math.max(result.movement.minimum, movement.minimum);
        if (movement.ignoreArmorStrength) result.movement.ignoreArmorStrength.push(label);
      }
      // 護甲本身的規則（精靈鏈甲、秘銀護甲）：穿在護甲欄才算。
      if (rule.category === "armor" && kind === "armor" && entry.slot === "armor") {
        ["trained", "noStrengthRequirement", "noStealthDisadvantage"].forEach((key) => { if (effects[key]) result.armor[key] = true; });
      }
      result.ac.other += transferred;
      if (effects.ac) {
        if (rule.category !== "armor" && rule.category !== "weapon") {
          result.ac.other += effects.ac;
          source.ac += effects.ac;
        } else if (kind === "armor" && entry.slot === "armor") result.ac.armor += effects.ac;
        else if (kind === "shield" && (entry.slot === "offHand" || entry.slot === "shield")) result.ac.shield += effects.ac;
      }
      result.saves += source.saves;
      result.spellAttack += source.spellAttack;
      result.spellSaveDc += source.spellSaveDc;
      if (source.ac || source.saves || source.spellAttack || source.spellSaveDc || source.hitPointsPerLevel || source.checks
        || source.proficiencyBonus || Object.keys(source.skills || {}).length) result.sources.push(source);
    });
    return result;
  }

  /**
   * 魔法物品給的無條件優勢（hints 的 advantage）：{ 技能 ID 或「先攻」: [來源物品名稱…] }，只列目前生效的。
   * 角色卡技能格、跑團技能按鈕與先攻格的「優勢」標籤都讀這裡；effects 可傳已算好的 getActiveMagicEffects()。
   */
  function getMagicItemAdvantages(effects = getActiveMagicEffects()) {
    const result = {};
    (effects.hints || []).forEach(hint => hint.advantage.forEach((target) => {
      result[target] ||= [];
      if (!result[target].includes(hint.label)) result[target].push(hint.label);
    }));
    return result;
  }

  /**
   * 永久、無條件的優勢與劣勢（角色卡文字右側的圓框 A／D），純計算：畫面上的裝備與數值由呼叫端整理成 context。
   * 來源：職業能力與種族特質的 advantage（內容檔）、魔法物品的無條件優勢（getMagicItemAdvantages）、
   * 穿著的護甲（隱匿劣勢、未受過訓練時力量與敏捷的 D20 檢定）、重型武器（近戰力量、遠程敏捷未達 13）。
   * context：{ className, level, subclassId, race,
   *   armor: { name, trained, stealthDisadvantage } 或 null（沒穿護甲；trained、stealthDisadvantage 已含精靈鏈甲與秘銀護甲），
   *   hands: [{ key: "main"|"off", weaponName, heavy, ranged, attackAbility }]（attackAbility 為命中用的屬性 ID，橡棍術、契約武器可能是 wis、cha），
   *   abilityScores: { str, dex }（有效值數字，屬性欄空白時為 null）, weaponAutomation（武器攻擊自動化；關閉時不判斷重型武器）,
   *   magicAdvantages（getMagicItemAdvantages() 的結果） }。
   * 回傳 { 目標: { mode, advantage: [來源…], disadvantage: [來源…] } }，只列有淨結果的目標：同時有優勢與劣勢時互相抵銷，不列。
   * 目標：技能 ID、「先攻」、save:<屬性 ID>（豁免）、check:<屬性 ID>（屬性檢定）、attack:<main|off>（那一手的命中）。
   */
  function getRollModeMarks(context = {}) {
    const marks = {};
    const add = (target, kind, label) => {
      const mark = marks[target] ||= { advantage: [], disadvantage: [] };
      if (!mark[kind].includes(label)) mark[kind].push(label);
    };
    const contentTarget = target => Object.hasOwn(SAVE_ROLL_TARGETS, target) ? `save:${SAVE_ROLL_TARGETS[target]}` : target;
    const level = Number.parseInt(context.level, 10) || 0;
    const classRules = getClassRules(context.className);
    if (classRules) {
      getClassFeatureRules(context.className, context.subclassId).filter(feature => feature.advantage && level >= feature.level).forEach((feature) => {
        const subclass = feature.subclass ? classRules.subclasses.find(item => item.id === feature.subclass) : null;
        const owner = subclass ? subclass.shortName || subclass.name : classRules.name;
        feature.advantage.forEach(target => add(contentTarget(target), "advantage", `${feature.name}（${owner} ${feature.level} 級）`));
      });
    }
    const raceRules = getRaceRules(context.race);
    (raceRules?.traits || []).filter(trait => trait.advantage && level >= trait.level)
      .forEach(trait => trait.advantage.forEach(target => add(contentTarget(target), "advantage", `${trait.name}（${raceRules.name}）`)));
    Object.entries(context.magicAdvantages || {}).forEach(([target, labels]) => labels.forEach(label => add(contentTarget(target), "advantage", label)));
    const armor = context.armor;
    if (armor?.stealthDisadvantage) add("隱匿", "disadvantage", `隱匿劣勢（${armor.name}）`);
    const hands = context.hands || [];
    if (armor && !armor.trained) {
      const label = `未受訓的護甲（${armor.name}）`;
      ["str", "dex"].forEach((ability) => {
        add(`check:${ability}`, "disadvantage", label);
        add(`save:${ability}`, "disadvantage", label);
      });
      Object.entries(CharacterSkillAbilities).filter(([, ability]) => ability === "str" || ability === "dex").forEach(([skill]) => add(skill, "disadvantage", label));
      add("先攻", "disadvantage", label);
      hands.filter(hand => hand.attackAbility === "str" || hand.attackAbility === "dex").forEach(hand => add(`attack:${hand.key}`, "disadvantage", label));
    }
    const scores = context.abilityScores || {};
    if (context.weaponAutomation !== false && Number.isFinite(scores.str) && Number.isFinite(scores.dex)) {
      hands.filter(hand => hand.heavy).forEach((hand) => {
        const ability = hand.ranged ? "dex" : "str";
        if (scores[ability] < 13) add(`attack:${hand.key}`, "disadvantage", `重型武器（${hand.weaponName}），${CharacterAbilityLabels[ability]}未達 13`);
      });
    }
    return Object.fromEntries(Object.entries(marks)
      .filter(([, mark]) => !mark.advantage.length !== !mark.disadvantage.length)
      .map(([target, mark]) => [target, { mode: mark.advantage.length ? "advantage" : "disadvantage", ...mark }]));
  }

  /**
   * 屬性有效值（純計算）：rawText 是屬性欄的原值，contributions 是 getActiveMagicEffects().abilities 的其中一項。
   * 順序：原值 → 加值依序加上（每筆夾在自己的上限，不會降低）→ 與設定值比（setBonus 加在 from 物品的設定值上，夾上限）→ 取最高。
   * 回傳 { raw, base, score, value, sources, changed }：base 是原值數字、score 是有效值數字（原值不是整數時兩者為 null，物品不影響），
   * value 是給計算用的文字（原值空白時為空字串）、sources 是決定有效值的物品名稱（原值最高時為空陣列）。
   */
  function calculateEffectiveAbilityScore(rawText, contributions = []) {
    const raw = String(rawText ?? "").trim();
    const base = /^[+-]?\d+$/.test(raw) ? Number(raw) : null;
    if (base === null) return { raw, base: null, score: null, value: raw, sources: [], changed: false };
    let score = base;
    let sources = [];
    contributions.filter(item => item.bonus).forEach((item) => {
      const next = Math.min(score + item.bonus, item.max ?? Infinity);
      if (next <= score) return;
      score = next;
      sources = [...sources, item.label];
    });
    contributions.filter(item => item.set).forEach((item) => {
      const boosters = contributions.filter(other => other.setBonus && other.from.includes(item.itemId));
      const boosted = boosters.reduce((value, other) => Math.min(value + other.setBonus, other.max), item.set);
      if (boosted <= score) return;
      score = boosted;
      sources = [item.label, ...boosters.filter(() => boosted > item.set).map(other => other.label)];
    });
    return { raw, base, score, value: String(score), sources, changed: score !== base };
  }

  /** 目前屬性欄（#str 等）的有效值：原值加上目前生效的魔法物品（見 calculateEffectiveAbilityScore）；effects 可傳已算好的 getActiveMagicEffects()。 */
  function getEffectiveAbilityScore(ability, effects = getActiveMagicEffects()) {
    const field = globalScope.document?.getElementById?.(ability);
    return calculateEffectiveAbilityScore(field ? field.value : "", effects.abilities?.[ability] || []);
  }

  /** 計算用的屬性值文字：原值空白時為空字串（呼叫端照舊補 10），其餘是有效值。 */
  function getEffectiveAbilityValue(ability, effects) {
    return getEffectiveAbilityScore(ability, effects).value;
  }

  /**
   * calculateArmorClass 採用的算法（kind）與它讀的屬性（abilities，屬性欄 id）。兩者共用同一份判斷：
   * 角色卡在自動計算時，任一個要讀的屬性空白就讓 AC 留空（重甲不讀屬性，照算）。
   * 選項同 calculateArmorClass（armor、className、level、subclass、hasAnyShield）；未知的護甲分類 kind 為 null。
   */
  function getArmorClassFormula(options = {}) {
    const className = String(options.className || "").trim();
    const level = Number.parseInt(options.level, 10) || 1;
    const armor = options.armor || null;
    if (armor) {
      if (armor.分類 === "重甲") return { kind: "heavy", abilities: [] };
      if (armor.分類 === "中甲") return { kind: "medium", abilities: ["dex"] };
      if (armor.分類 === "輕甲") return { kind: "light", abilities: ["dex"] };
      return { kind: null, abilities: [] };
    }
    if (hasClassFeature(className, "sorcerer-draconic-resilience", level, options.subclass)) return { kind: "draconic", abilities: ["dex", "cha"] };
    if (!options.hasAnyShield && className === "monk") return { kind: "monk", abilities: ["dex", "wis"] };
    if (className === "barbarian") return { kind: "barbarian", abilities: ["dex", "con"] };
    return { kind: "unarmored", abilities: ["dex"] };
  }

  /**
   * AC 的算式明細，calculateArmorClass 與計算說明視窗共用：{ total, summary, rows: [{ label, detail, value }] }；算不出來時為 null。
   * summary 是採用哪一種算法的一句話。選項同 calculateArmorClass，另可傳：
   * armorLabel（護甲的顯示名稱）、unarmoredBaseLabel（給沒穿護甲基礎 AC 的物品名稱）、
   * shieldNote（持盾但不加 AC 的原因，例如未受盾牌訓練）、magicBonuses（[{ label, value }]，有給時取代 magicBonus）。
   */
  function getArmorClassBreakdown(options = {}) {
    const className = String(options.className || "").trim();
    const dexModifier = calculateAbilityModifier(options.dexterityScore);
    const constitutionModifier = calculateAbilityModifier(options.constitutionScore);
    const wisdomModifier = calculateAbilityModifier(options.wisdomScore);
    const charismaModifier = calculateAbilityModifier(options.charismaScore);
    const armor = options.armor || null;
    if (options.hasArmor && !armor) return null;

    const { kind } = getArmorClassFormula(options);
    let rows = [];
    let summary = "";
    const base = (label, detail = "") => ({ label, detail, value: 10 });
    const ability = (label, value, detail = "") => ({ label: `${label}調整值`, detail, value });
    if (armor) {
      const armorBase = Number.parseInt(armor.AC, 10);
      if (!Number.isFinite(armorBase)) return null;
      const name = options.armorLabel || armor.名稱 || "護甲";
      if (kind === "heavy") {
        summary = `穿著${name}（重甲）：護甲的 AC，不加敏捷調整值。`;
        rows = [{ label: `${name}（重甲）`, detail: "", value: armorBase }];
      } else if (kind === "medium") {
        summary = `穿著${name}（中甲）：護甲的 AC ＋ 敏捷調整值，敏捷最多加 2。`;
        rows = [{ label: `${name}（中甲）`, detail: "", value: armorBase },
          ability("敏捷", Math.min(2, dexModifier), dexModifier > 2 ? `敏捷調整值 ${formatSignedValue(dexModifier)}，中甲最多 +2` : "")];
      } else if (kind === "light") {
        summary = `穿著${name}（輕甲）：護甲的 AC ＋ 敏捷調整值。`;
        rows = [{ label: `${name}（輕甲）`, detail: "", value: armorBase }, ability("敏捷", dexModifier)];
      } else {
        return null;
      }
    } else {
      if (kind === "draconic") {
        const feature = getClassFeatureName(className, "sorcerer-draconic-resilience", options.subclass);
        summary = `沒穿護甲，有${feature}：10 ＋ 敏捷調整值 ＋ 魅力調整值。`;
        rows = [base("基礎", feature), ability("敏捷", dexModifier), ability("魅力", charismaModifier)];
      } else if (kind === "monk") {
        const feature = getClassFeatureName(className, "monk-unarmored-defense");
        summary = `沒穿護甲也沒持盾，有${feature}：10 ＋ 敏捷調整值 ＋ 感知調整值。`;
        rows = [base("基礎", feature), ability("敏捷", dexModifier), ability("感知", wisdomModifier)];
      } else if (kind === "barbarian") {
        const feature = getClassFeatureName(className, "barbarian-unarmored-defense");
        summary = `沒穿護甲，有${feature}：10 ＋ 敏捷調整值 ＋ 體質調整值。`;
        rows = [base("基礎", feature), ability("敏捷", dexModifier), ability("體質", constitutionModifier)];
      } else {
        summary = "沒穿護甲：10 ＋ 敏捷調整值。";
        rows = [base("基礎"), ability("敏捷", dexModifier)];
      }
      // 大法師法袍：沒穿護甲時基礎 AC 15＋敏捷，和上面的算法取最高（一樣高時照上面的算法說明）。
      const unarmoredBaseAc = Number(options.unarmoredBaseAc) || 0;
      if (unarmoredBaseAc && unarmoredBaseAc + dexModifier > rows.reduce((sum, row) => sum + row.value, 0)) {
        const label = options.unarmoredBaseLabel || "魔法物品";
        summary = `沒穿護甲，${label}的基礎 AC 比較高：${unarmoredBaseAc} ＋ 敏捷調整值。`;
        rows = [{ label: `${label}的基礎 AC`, detail: "", value: unarmoredBaseAc }, ability("敏捷", dexModifier)];
      }
    }

    if (options.hasShield) rows.push({ label: "盾牌", detail: "", value: 2 });
    else if (options.hasAnyShield && options.shieldNote) rows.push({ label: "盾牌", detail: options.shieldNote, value: 0 });
    if (armor && options.hasDefenseFightingStyle) rows.push({ label: "防禦戰鬥風格", detail: "穿著護甲時", value: 1 });
    const magicBonus = Number(options.magicBonus) || 0;
    const magicBonuses = Array.isArray(options.magicBonuses) ? options.magicBonuses
      : magicBonus ? [{ label: "魔法物品", value: magicBonus }] : [];
    magicBonuses.filter(item => item.value).forEach(item => rows.push({ label: item.label, detail: "魔法物品", value: item.value }));
    return { total: rows.reduce((sum, row) => sum + row.value, 0), summary, rows };
  }

  /**
   * 計算 AC，包含無甲防禦、護甲、盾牌、防禦戰鬥風格與魔法物品加值（magicBonus，由 getActiveMagicEffects() 算出、呼叫端決定哪些部分生效）。
   * unarmoredBaseAc：魔法物品給的沒穿護甲時基礎 AC（大法師法袍 15，加敏捷調整值，可用盾牌），和無甲防禦等算法取最高。
   * 明細見 getArmorClassBreakdown。
   */
  function calculateArmorClass(options = {}) {
    return getArmorClassBreakdown(options)?.total ?? null;
  }

  /** 將有限數值格式化為帶正負號的顯示文字；正數補上「+」。 */
  function formatSignedValue(value) {
    if (!Number.isFinite(value)) return "";
    if (value > 0) return `+${value}`;
    return String(value);
  }

  /** 全形數字、全形正負號與常見減號變體轉成半形；其他文字不動，帶符號整數順便去掉中間的空白。 */
  function normalizeSignedValueText(value) {
    const normalized = String(value ?? "")
      .replace(/[\uFF10-\uFF19]/g, digit => String.fromCharCode(digit.charCodeAt(0) - 0xFEE0))
      .replace(/[\uFF0B\uFE62]/g, "+")
      .replace(/[\uFF0D\uFE63\u2212\u2010\u2011\u2012\u2013\u2014]/g, "-")
      .trim();
    return /^[+-]\s+\d+$/.test(normalized) ? normalized.replace(/\s+/g, "") : normalized;
  }

  /** 完全符合帶正負號整數才回傳數字，否則回傳 null（比對數字是否相同時用，不把「abc」當成 0）。 */
  function parseExactSignedValue(value) {
    const normalized = normalizeSignedValueText(value);
    return /^[+-]?\d+$/.test(normalized) ? Number(normalized) : null;
  }

  /** 將可能帶正負號的文字轉成整數；空值或無效值視為 0。 */
  function parseSignedValue(value) {
    const normalized = normalizeSignedValueText(value);
    if (!normalized) return 0;
    const parsed = Number.parseInt(normalized, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  // 角色卡的基礎速度欄（speed-input）預設 30，適用速度 30 呎的種族；種族或所選血統的速度不是 30 時以內容檔為準。
  const DEFAULT_BASE_SPEED = 30;

  /** 護甲資料的「力量需求」（例如「力量 13」）轉成需求數值；「--」、「-」、空白等沒有數字的寫法回傳 0（沒有需求）。 */
  function parseArmorStrengthRequirement(value) {
    if (Number.isFinite(value)) return value > 0 ? value : 0;
    const match = normalizeSignedValueText(value).match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  /**
   * 計算角色速度，包含種族（options.raceChoice 為所選血統）速度及武僧、野蠻人、遊俠的職業加值條件。
   * 穿著護甲（options.isWearingArmor）且力量（options.strengthScore）低於護甲的力量需求
   * （options.armorStrengthRequirement，可傳護甲資料的原始文字）時速度降低 10 呎；力量無法判讀時不扣。
   * 魔法物品：options.ignoreArmorStrength 為 true 時不因力量需求降速（跑跳之靴），options.minimumSpeed 是速度至少的呎數（取較高）。
   * 沒有種族（options.race 空白）時回傳空字串。
   */
  function calculateCharacterSpeed(options = {}) {
    const breakdown = getCharacterSpeedBreakdown(options);
    return breakdown ? String(breakdown.total) : "";
  }

  /**
   * 速度的算式明細，calculateCharacterSpeed 與計算說明視窗共用：{ total, rows: [{ label, detail, value, display? }] }；
   * 沒有種族或基礎速度不是數字時為 null。選項同 calculateCharacterSpeed，另可傳 minimumSpeedLabel（給「速度至少」的物品名稱）。
   * 「速度至少」那一行不是加減，value 為 0、display 是顯示文字。
   */
  function getCharacterSpeedBreakdown(options = {}) {
    const baseSpeedValue = Number.parseFloat(options.baseSpeed);
    const race = String(options.race || "").trim();
    const className = String(options.className || "").trim();
    const level = Number.parseInt(options.level, 10);
    // 種族決定基礎速度：還沒選種族時不算（角色卡自動計算與 PDF 都留空）。
    if (!race) return null;

    const raceRules = getRaceRules(race);
    const raceChoice = getRaceChoiceOption(race, String(options.raceChoice || "").trim());
    const raceSpeed = raceChoice?.speed ?? raceRules?.speed;
    const usesRaceSpeed = Boolean(raceSpeed && raceSpeed !== DEFAULT_BASE_SPEED);
    const baseSpeed = usesRaceSpeed ? raceSpeed : baseSpeedValue;
    if (!Number.isFinite(baseSpeed)) return null;
    // 種族速度 30 時數字取自基礎速度欄；欄位仍是 30（和種族一樣）就照樣寫出種族，玩家改過才寫「基礎速度欄」。
    const raceSpeedName = raceChoice?.speed ? raceChoice.name : raceRules?.name;
    const rows = [{
      label: "基礎速度",
      detail: (usesRaceSpeed || baseSpeed === raceSpeed) && raceSpeedName ? `種族：${raceSpeedName}` : "基礎速度欄",
      value: baseSpeed
    }];

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

    if (monkBonusApplies) {
      const bonus = getClassProgressionValue("monk", "unarmoredMovement", level) || 0;
      if (bonus) rows.push({ label: getClassFeatureName("monk", "monk-unarmored-movement"), detail: "沒穿護甲、沒持盾", value: bonus });
    } else if (barbarianBonusApplies) {
      rows.push({ label: getClassFeatureName("barbarian", "barbarian-fast-movement"), detail: "沒穿重甲", value: 10 });
    } else if (rangerBonusApplies) {
      rows.push({ label: getClassFeatureName("ranger", "ranger-roving"), detail: "沒穿重甲", value: 10 });
    }
    if (options.hasSpeedyFeat) rows.push({ label: "迅捷步法", detail: "專長", value: 10 });
    const strengthRequirement = options.isWearingArmor ? parseArmorStrengthRequirement(options.armorStrengthRequirement) : 0;
    const strengthScore = parseExactSignedValue(options.strengthScore);
    if (!options.ignoreArmorStrength && strengthRequirement > 0 && strengthScore !== null && strengthScore < strengthRequirement) {
      rows.push({ label: "護甲力量需求", detail: `力量 ${strengthScore} 低於需求 ${strengthRequirement}`, value: -10 });
    }
    const speed = Math.max(0, rows.reduce((sum, row) => sum + row.value, 0));
    const minimumSpeed = Number(options.minimumSpeed) || 0;
    if (minimumSpeed > speed) {
      rows.push({ label: options.minimumSpeedLabel || "魔法物品", detail: `速度至少 ${minimumSpeed} 呎，取較高`, value: 0, display: `至少 ${minimumSpeed}` });
    }
    return { total: Math.max(speed, minimumSpeed), rows };
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

  // 內容檔 advantage 寫豁免時的名稱（「智力豁免」）與屬性 ID；可寫的擲骰另有技能 ID 與「先攻」（getRollModeMarks）。
  const SAVE_ROLL_TARGETS = Object.freeze({ 力量豁免: "str", 敏捷豁免: "dex", 體質豁免: "con", 智力豁免: "int", 感知豁免: "wis", 魅力豁免: "cha" });
  const CharacterRollModeTargets = Object.freeze(["先攻", ...Object.keys(CharacterSkillAbilities), ...Object.keys(SAVE_ROLL_TARGETS)]);

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
  // 屬性 ID 的中文名稱（計算說明的「力量調整值」等顯示文字）。
  const CharacterAbilityLabels = Object.freeze({ str: "力量", dex: "敏捷", con: "體質", int: "智力", wis: "感知", cha: "魅力" });

  Object.assign(globalScope, {
    calculateAbilityModifier,
    CharacterSkillAbilities,
    CharacterRollModeTargets,
    CharacterAbilityLabels,
    getCharacterMaxHpBreakdown,
    getArmorClassBreakdown,
    getCharacterSpeedBreakdown,
    getDruidWildShapeRules,
    isDruidBeastAllowed,
    calculateWildShapeCheck,
    calculateArmorClass,
    getArmorClassFormula,
    getActiveMagicEffects,
    getMagicItemAdvantages,
    getRollModeMarks,
    calculateEffectiveAbilityScore,
    getEffectiveAbilityScore,
    getEffectiveAbilityValue,
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
    getRaceChoiceOptionKey,
    getBackgroundRules,
    getBackgroundText,
    getBackgroundSource,
    getContentSourceLabel,
    formatContentSourceName,
    getContentSourceNotice,
    getFeatRules,
    getFeatText,
    getAllFeatRules,
    getFeatTypeLabel,
    getFeatTypeMinLevel,
    getFeatTypes,
    getDamageTypeLabel,
    getCharacterResourceSpecs,
    getClassSaveProficiencies,
    getClassRules,
    getClassProgressionValue,
    getClassFeatureRules,
    getSelectedSubclassId,
    getSelectedSubclass,
    hasClassFeature,
    getClassSpellListIds,
    getClassMasteryOptions,
    getClassFreeCastFeatures,
    getClassResistances,
    getClassShortRestExhaustionRecovery,
    getClassProficiencies,
    getClassPickCount,
    getClassPicks,
    getClassGrants,
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
    normalizeSignedValueText,
    parseExactSignedValue,
    parseSignedValue
  });
})(window);

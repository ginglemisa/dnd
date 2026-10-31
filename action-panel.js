(function attachActionPanel(globalScope) {
  "use strict";

  const STATIC_OPTIONS = Object.freeze({
    basic: Object.freeze([
      { key: "attack", label: "攻擊", englishLabel: "Attack", description: "拾取或拔出一把武器進行攻擊。" },
      { key: "unarmed", label: "徒手", englishLabel: "Unarmed Strike", description: "對 5 呎內的目標拳打、踢擊或以其他方式徒手攻擊。命中加值為力量調整值加熟練加值；命中時造成 1 加力量調整值的鈍擊傷害。" },
      { key: "grapple", label: "擒抱", englishLabel: "Grapple", description: "以一次擒抱替代一次攻擊，以空手抓住 5 呎內、且體型不超過你一級的目標。目標進行力量或敏捷豁免（DC = 8 + 力量調整值 + 熟練加值）；失敗時陷入擒抱狀態。" },
      { key: "shove", label: "推撞", englishLabel: "Shove", description: "以一次推撞替代一次攻擊，選擇 5 呎內、且體型不超過你一級的目標。目標進行力量或敏捷豁免（DC = 8 + 力量調整值 + 熟練加值）；失敗時由你將其推開 5 呎或擊倒。" },
      { key: "dash", label: "衝刺", englishLabel: "Dash", description: "在本回合剩餘時間內，獲得等同於你速度的額外移動力。" },
      { key: "disengage", label: "撤離", englishLabel: "Disengage", description: "在本回合剩餘時間內，你的移動不會引發藉機攻擊。" },
      { key: "dodge", label: "閃避", englishLabel: "Dodge", description: "直到你下一回合開始前，對你的攻擊擲骰具有劣勢，且你的敏捷豁免具有優勢。若你陷入失能狀態或速度為 0，便失去此效果。" },
      { key: "help", label: "協助", englishLabel: "Help", description: "協助另一個生物進行屬性檢定或攻擊擲骰，也可以對其施予急救。" },
      { key: "hide", label: "躲藏", englishLabel: "Hide", description: "進行一次敏捷（隱匿）檢定，難度 15，嘗試避開其他生物的注意。" },
      { key: "influence", label: "影響", englishLabel: "Influence", description: "進行魅力（欺瞞、威嚇、表演或遊說）或感知（馴獸）檢定，嘗試改變生物的態度。" },
      { key: "magic", label: "魔法", englishLabel: "Magic", description: "施放施法時間為動作的法術、使用魔法物品，或啟動需要魔法動作的特性。" },
      { key: "ready", label: "準備", englishLabel: "Ready", description: "設定一個可感知的觸發條件，並指定條件發生時要執行的動作。觸發後，你使用反應執行該動作。" },
      { key: "search", label: "搜索", englishLabel: "Search", description: "進行感知（洞悉、醫藥、察覺或生存）檢定，尋找隱藏的生物、物品或線索。" },
      { key: "study", label: "研究", englishLabel: "Study", description: "進行智力（奧秘、歷史、調查、自然或宗教）檢定，回想或分析相關資訊。" },
      { key: "utilize", label: "使用", englishLabel: "Utilize", description: "操作或使用需要動作的非魔法物品。" }
    ]),
    action: Object.freeze([

    ]),
    bonus: Object.freeze([
      { key: "drink-potion", label: "喝藥水", description: "以附贈喝下一瓶治療藥水，恢復 2d4 + 2 點生命值。" },
      { key: "offhand-attack", label: "二次攻擊", description: "在自身回合以「輕型」武器執行攻擊動作後，可用「附贈」以另一把輕型武器再攻擊一次。這次攻擊的傷害不加屬性調整值（負值仍須計入）。" }
    ]),
    reaction: Object.freeze([
      { key: "opportunity-attack", label: "藉機攻擊", englishLabel: "Opportunity Attack", description: "當你能看見的生物自行離開你的觸及範圍時，你可以使用反應，對該生物進行一次近戰攻擊。" },
      { key: "execute-ready", label: "執行準備", description: "先前使用「準備」且指定觸發條件成立時發生" }
    ]),
    movement: Object.freeze([
      {
        key: "special-speeds",
        label: "特殊速度",
        description: "有些生物具有特殊速度，例如掘穴速度、攀爬速度、飛行速度或游泳速度；各詞條定義見本詞彙。\n\n如果你有不只一種速度，移動時要先選擇這次使用哪一種；你也可以在同一次移動中途切換。\n\n每次切換時，從新速度中扣除你已移動的距離；結果就是你還能以該速度再移動多遠。若結果為 0 或更低，你在這次移動期間就不能使用新的速度。\n\n例如，如果你的速度為 30 呎，飛行速度為 40 呎，你可以先飛 10 呎、走 10 呎，再跳到空中多飛 20 呎。"
      },
      {
        key: "speed-changes",
        label: "速度變化",
        description: "若某效果在一段時間內提高或降低你的速度，你擁有的每一種特殊速度也會在相同持續時間內等量提高或降低。\n\n例如，如果你的速度被降為 0，而你具有攀爬速度，則你的攀爬速度也會降為 0。\n\n同樣地，如果你的速度減半，而你具有飛行速度，你的飛行速度也會減半。"
      },
      {
        key: "climbing",
        label: "攀爬",
        description: "攀爬一格地圖花費 10 呎移動力；若為困難地形，則花費 15 呎。有攀爬速度的生物不受此限制。攀爬濕滑表面時，可能需要依主持人判斷通過運動檢定。"
      },
      {
        key: "crawling",
        label: "匍匐",
        description: "匍匐一格地圖花費 10 呎移動力；若為困難地形，則花費 15 呎。"
      },
      {
        key: "flying",
        label: "飛行",
        description: "生物可以透過各種效果獲得飛行能力。飛行中的生物若陷入失能或倒地狀態，或飛行速度降至 0，就會墜落；有滯空能力的生物不受此限制。"
      },
      {
        key: "long-jump",
        label: "跳遠",
        description: "助跑至少 10 呎後，可以跳躍等同力量值的呎數；立定跳遠減半。每跳 1 呎花費 1 呎移動力。落在困難地形時，必須通過 DC 10 體操檢定，否則倒地。越過高度不超過跳躍距離四分之一的障礙物時，主持人可要求通過 DC 10 運動檢定，否則撞上障礙物。"
      },
      {
        key: "high-jump",
        label: "跳高",
        description: "助跑至少 10 呎後，可以向上跳躍 3 + 力量調整值 呎，最低為 0 呎；立定跳高減半。每跳 1 呎花費 1 呎移動力。向上伸手時，最高可觸及 跳躍高度 + 1.5 倍身高。"
      },
      {
        key: "swimming",
        label: "游泳",
        description: "游泳一格地圖花費 10 呎移動力；若為困難地形，則花費 15 呎。有游泳速度的生物不受此限制。在湍急水域移動時，主持人可要求通過 DC 15 運動檢定。"
      }
    ])
  });

  const TABLETOP_ACTION_OPTIONS = Object.freeze([
    { key: "natural-20", label: "擲出２０", buttonTag: "規則", description: "攻擊骰子出 20 必中，造成重擊。\n傷害骰擲兩次，固定加值只加一次。\n\n例如長劍一般傷害為 1d8＋3\n重擊傷害則是 2d8＋3\n額外傷害骰（如至聖斬）也會加倍" }
  ]);

  const TABLETOP_MOVEMENT_OPTIONS = Object.freeze([
    { key: "cover", label: "遮蔽", buttonTag: "規則", description: "半身遮蔽：AC 與敏捷豁免獲得 +2，例如躲在齊腰高的矮牆後，或有其他生物擋在前方。\n\n3／4遮蔽：AC 與敏捷豁免獲得 +5，例如躲在城牆射箭孔或粗大樹幹後方。\n\n完全遮蔽：視線完全看不到，通常無法被指定為目標。" }
  ]);

  const MODE_META = Object.freeze({
    basic: { timing: "每回合一次", summary: "執行主要行動，例如攻擊或閃避。", prompt: "請選擇一個動作查看說明。" },
    action: { timing: "每回合一次", summary: "執行專屬行動，例如魯莽攻擊。", prompt: "請選擇一個專屬動作查看說明。" },
    bonus: { timing: "每回合最多一次", summary: "執行有條件的額外動作，只有規則或能力允許時才能使用。", prompt: "請選擇一個附贈查看說明。" },
    reaction: { timing: "每輪最多一次", summary: "在自己或別人的回合符合觸發條件時使用。", prompt: "請選擇一個反應查看說明。" },
    movement: { timing: "自己的回合中", summary: "改變你的位置，移動可分段穿插在動作前後。", prompt: "請選擇一項移動規則查看說明。" }
  });

  const FEATURE_SOURCE_LABELS = Object.freeze({
    class: "職業",
    race: "種族",
    feat: "專長",
    spell: "法術",
    invocation: "魔能祈喚",
    metamagic: "超魔法"
  });

  const TABLETOP_FEAT_ACTION_RULES = Object.freeze([
    { feat: "臨陣施法", level: 4, modes: ["reaction"], label: "迎擊法術", ruleNames: ["迎擊法術"], legacyKeys: { reaction: "dynamic-reaction-feat-dkui7n" } },
    { feat: "尋物好手", level: 4, modes: ["bonus"], label: "信手拈來", ruleNames: ["信手拈來"], legacyKeys: { bonus: "dynamic-bonus-feat-a4ncv1" } },
    { feat: "醫療兵", modes: ["action"], label: "急救處置", ruleNames: ["急救處置"], proficiencyValue: true },
    { feat: "醫療兵", modes: ["action"], label: "穩定療效", ruleNames: ["穩定療效"] },
    { feat: "擒抱者", level: 4, modes: ["action"], label: "重拳擒抱", ruleNames: ["重拳擒抱"] },
    { feat: "擒抱者", level: 4, modes: ["movement"], label: "迅捷摔技", ruleNames: ["迅捷摔技"] },
    { feat: "衝鋒猛擊", level: 4, modes: ["movement"], label: "加速疾走", ruleNames: ["加速疾走"] },
    { feat: "衝鋒猛擊", level: 4, modes: ["action", "movement"], label: "直線衝擊", ruleNames: ["直線衝擊"], numberedChoices: true },
    { feat: "雙持追擊", level: 4, modes: ["action", "bonus"], legacyKeys: { bonus: "dynamic-bonus-feat-rklusa" }, label: "雙持追擊", ruleNames: ["雙持追擊", "傷害調整"], quickMasteryLabel: true },
    { feat: "雙持追擊", level: 4, modes: ["action"], label: "快速換手", ruleNames: ["快速換手"] },
    { feat: "最佳旅伴", level: 4, modes: ["action"], label: "妙語如珠", ruleNames: ["妙語如珠"] },
    { feat: "封鎖者", level: 4, modes: ["reaction"], label: "封鎖者", ruleNames: ["封鎖者"], numberedTriggers: true },
    { feat: "迅捷步法", level: 4, modes: ["action", "movement"], label: "跨越險地", ruleNames: ["跨越險地"] }
  ]);

  // 職業動作：職業內容檔各能力（含子職能力、子能力、選項與附錄小節）的 actions（class-content.generated.js 的 classRules）。
  // key／legacyKeys 是跑團偏好記住的按鈕識別（class-id-baseline.json 把關）。出現條件只看等級、勾選的選項與魔能祈喚；
  // 說明段落以 data-action-id 選取，不解析職業頁標題或內文。附錄小節的 source: invocation 按鈕是魔能祈喚本身。
  const classActionRuleCache = new Map();

  function getClassActionLabel(label, fallback) {
    if (typeof label === "string") return label;
    if (!label?.byLevel) return fallback;
    return () => {
      let text = fallback;
      for (const [from, entry] of Object.entries(label.byLevel)) if (getCharacterLevel() >= Number(from)) text = entry;
      return text;
    };
  }

  function getClassActionRules(className) {
    const rules = globalScope.getClassRules?.(className);
    if (!rules) return [];
    const cached = classActionRuleCache.get(className);
    if (cached?.rules === rules) return cached.list;
    const features = globalScope.getClassFeatureRules(className);
    const featureLevels = new Map(features.map(feature => [feature.id, feature.level]));
    const subclassNames = new Map(rules.subclasses.map(subclass => [subclass.id, subclass.shortName]));
    const list = [];
    const add = (action, { name, level, subclass, descriptionId, extra = {}, plainLabel = false }) => {
      const suffix = subclass ? `（${subclassNames.get(subclass)}子職）` : "";
      list.push(Object.freeze({
        mode: action.mode,
        level: action.level ?? level,
        key: action.key,
        label: getClassActionLabel(action.label, plainLabel ? name : `等級 ${level}：${name}${suffix}`),
        descriptionIds: Object.freeze([descriptionId, ...(action.append || []).map(id => Object.freeze({ id, level: featureLevels.get(id) }))]),
        source: action.source === "invocation" ? "invocation" : "class",
        ...(action.legacyKeys ? { legacyKeys: Object.freeze([...action.legacyKeys]) } : {}),
        ...(action.resource ? { resourceKey: action.resource } : {}),
        ...(action.druidOperation ? { druidOperation: action.druidOperation } : {}),
        ...(action.invocation ? { invocation: action.invocation } : {}),
        ...(action.requiresInvocation ? { requiresInvocation: action.requiresInvocation } : {}),
        ...(action.tabletopHidden ? { tabletopHidden: true } : {}),
        ...(action.tabletopAlso ? { tabletopAlso: action.tabletopAlso } : {}),
        ...extra
      }));
    };
    for (const feature of features) {
      const context = { level: feature.level, subclass: feature.subclass };
      // 只顯示勾選中的選項（selectedOptionOnly，例如狩獵目標）：記下選項勾選框與說明段落。
      const optionBlocks = (feature.options || []).map(option => ({
        inputId: option.id,
        blockId: `${className}-${option.id.slice(feature.id.length + 1)}`
      }));
      (feature.actions || []).forEach(action => add(action, {
        ...context,
        name: feature.name,
        descriptionId: feature.id,
        extra: action.selectedOptionOnly ? { selectedOptionOnly: Object.freeze({ name: feature.name, options: Object.freeze(optionBlocks) }) } : {}
      }));
      (feature.parts || []).forEach(part => (part.actions || []).forEach(action => add(action, { ...context, name: part.name, descriptionId: part.id })));
      (feature.options || []).forEach((option, index) => (option.actions || []).forEach(action => add(action, {
        ...context,
        name: option.name,
        descriptionId: optionBlocks[index].blockId,
        extra: { checkedId: option.id }
      })));
    }
    (rules.appendix || []).forEach(item => (item.parts || []).forEach(part => (part.actions || []).forEach(action => add(action, {
      level: action.level,
      name: part.name,
      descriptionId: part.id,
      plainLabel: true,
      extra: action.source === "invocation" ? { invocation: part.name } : {}
    }))));
    classActionRuleCache.set(className, { rules, list });
    return list;
  }

  const RACE_ACTION_RULES = Object.freeze([
    { id: "breath", race: "dragonborn", level: 1, mode: "action", label: "吐息元素", key: "dynamic-action-race-1loctyz", resourceKey: "dragonborn-breath-uses", description: getDragonbornBreathDescription },
    { id: "fire-burn", race: "goliath", level: 1, mode: "action", label: "星火燎原", key: "dynamic-action-race-1vjg9hw", resourceKey: "goliath-giant-ancestry-uses", choiceId: "goliath-ancestry", choiceValue: "fire", description: "攻擊命中目標時增加 1d10 火焰傷害。" },
    { id: "frost-chill", race: "goliath", level: 1, mode: "action", label: "凜若冰霜", key: "dynamic-action-race-cc167a", resourceKey: "goliath-giant-ancestry-uses", choiceId: "goliath-ancestry", choiceValue: "frost", ruleName: "凜若冰霜（霜巨人）" },
    { id: "hill-tumble", race: "goliath", level: 1, mode: "action", label: "地動山搖", key: "dynamic-action-race-11249i9", resourceKey: "goliath-giant-ancestry-uses", choiceId: "goliath-ancestry", choiceValue: "hill", description: "攻擊命中大型以下的生物可令其陷入「倒地」狀態。" },
    { id: "stone-endurance", race: "goliath", level: 1, mode: "reaction", label: "堅若磐石", key: "dynamic-reaction-race-16nfphm", resourceKey: "goliath-giant-ancestry-uses", choiceId: "goliath-ancestry", choiceValue: "stone", description: () => {
      const modifier = getAbilityModifier("con");
      const dice = modifier === null ? "1d12 + 體質調整值" : formatDiceWithModifier("1d12", modifier);
      return getGoliathAncestryDescription("堅若磐石（石巨人）", `受傷時可用反應扣除 ${dice} 傷害。`);
    } },
    { id: "nimbleness", race: "halfling", level: 1, mode: "movement", label: "半身人靈巧", key: "dynamic-movement-race-hkw7d1", description: "可穿過體型比你大的生物\n不能停在同一格", tabletopOnly: true },
    { id: "lucky", race: "halfling", level: 1, mode: "action", label: "吉運", key: "dynamic-action-race-1migdkt", description: "任何 D20 檢定中擲出 1 都可以重擲一次。", tabletopOnly: true },
    { id: "naturally-stealthy", race: "halfling", level: 1, mode: "action", label: "天生善匿", key: "dynamic-action-race-150qsdc", description: "你可以在體型比你大的生物後方使用躲藏動作。", tabletopOnly: true },
    { id: "naturally-stealthy", race: "halfling", level: 2, mode: "bonus", label: "天生善匿", className: "rogue", description: "你可以在體型比你大的生物後方使用躲藏動作。", tabletopOnly: true, key: "dynamic-bonus-race-150qsdc" },
    { id: "draconic-flight", race: "dragonborn", level: 5, mode: "bonus", label: "等級 5：龍翔天際", key: "dynamic-bonus-race-1h4jffx", resourceKey: "dragonborn-dragon-flight", ruleName: "龍翔天際" },
    { id: "stonecunning", race: "dwarf", level: 1, mode: "bonus", label: "石中精妙", key: "dynamic-bonus-race-m9n3bt", resourceKey: "dwarf-stonecunning", ruleName: "石中精妙" },
    { id: "clockwork-device", race: "gnome", level: 1, mode: "bonus", label: "岩石侏儒", key: "dynamic-bonus-race-1ljlrzt", ruleName: "岩石侏儒", choiceId: "gnome-lineage", choiceValue: "rock_gnome" },
    { id: "dismantle-device", race: "gnome", level: 1, mode: "action", label: "拆除發條裝置", ruleName: "岩石侏儒", choiceId: "gnome-lineage", choiceValue: "rock_gnome" },
    { id: "cloud-jaunt", race: "goliath", level: 1, mode: "bonus", label: "雲遊四方", key: "dynamic-bonus-race-r7ggqg", resourceKey: "goliath-giant-ancestry-uses", description: () => getGoliathAncestryDescription("雲遊四方（雲巨人）"), choiceId: "goliath-ancestry", choiceValue: "cloud" },
    { id: "storm-thunder", race: "goliath", level: 1, mode: "reaction", label: "轟雷掣電", key: "dynamic-reaction-race-4cc8u8", resourceKey: "goliath-giant-ancestry-uses", description: () => getGoliathAncestryDescription("轟雷掣電（風暴巨人）"), choiceId: "goliath-ancestry", choiceValue: "storm" },
    { id: "large-form", race: "goliath", level: 5, mode: "bonus", label: "等級 5：巨化形體", key: "dynamic-bonus-race-1svsj4g", resourceKey: "goliath-large-form", ruleName: "巨化形體" },
    { id: "adrenaline-rush", race: "orc", level: 1, mode: "bonus", label: "熱血湧動", key: "dynamic-bonus-race-ydqmx5", resourceKey: "orc-adrenaline-rush", ruleName: "熱血湧動", proficiencyValue: true }
  ]);

  let currentMode = "action";
  let selectedOptionKey = "";
  let scheduledRefresh = 0;
  let panelElements = null;

  function sourceToPlainText(raw) {
    const holder = document.createElement("div");
    holder.innerHTML = String(raw ?? "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<hr\b[^>]*>/gi, "\n")
      .replace(/<\/(?:div|p|li|tr|h[1-6]|details)>/gi, "$&\n");
    holder.querySelectorAll("table, input, button, select, label, [hidden], .is-hidden").forEach(element => element.remove());
    return (holder.textContent || "")
      .replace(/\u00a0/g, " ")
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function stableKeyHash(value) {
    let hash = 2166136261;
    for (const character of String(value)) {
      hash ^= character.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function getCharacterLevel() {
    return Number(document.getElementById("level")?.value) || 1;
  }

  function getProficiencyBonus() {
    return globalScope.calculateProficiencyBonus?.(getCharacterLevel()) || 2;
  }

  function getSelectedFeatNames() {
    return new Set(Array.from(document.querySelectorAll("#feats-area select"), select => select.value).filter(Boolean));
  }

  function getFeatRuleText(featName, ruleName) {
    return getNamedRuleDescription(typeof featsDesc === "undefined" ? "" : featsDesc[featName], ruleName);
  }

  function formatTabletopFeatRule(rule) {
    let description = rule.ruleNames
      .map(ruleName => getFeatRuleText(rule.feat, ruleName))
      .filter(Boolean)
      .join(" ");
    if (!description) return "";
    if (rule.proficiencyValue && document.getElementById("level")?.value) {
      description = description.replace(/熟練加值/gu, String(getProficiencyBonus()));
    }
    if (rule.quickMasteryLabel) {
      description = description
        .replace(/；?\s*可與「迅切」並用。?/u, "；可與「迅切」武器精通並用。")
        .replace(/。\s*若無/u, "；若無");
    }
    if (rule.numberedChoices) {
      description = description.replace(/：\s*\+1d8 傷害；或將/u, "：\n\n1️⃣+1d8 傷害\n2️⃣將");
    }
    if (rule.numberedTriggers) {
      description = description.replace(/：進行「撤離」行動；攻擊命中他人。?$/u, "：\n\n1️⃣進行「撤離」行動的目標\n2️⃣攻擊命中他人的目標。");
    }
    return description;
  }

  function getTabletopFeatRuleEntries(mode) {
    const selectedFeats = getSelectedFeatNames();
    return TABLETOP_FEAT_ACTION_RULES.flatMap(rule => {
      if (!rule.modes.includes(mode) || !selectedFeats.has(rule.feat) || getCharacterLevel() < (rule.level || 1)) return [];
      const description = formatTabletopFeatRule(rule);
      if (!description) return [];
      return [{
        key: rule.legacyKeys?.[mode] || `dynamic-${mode}-feat-curated-${stableKeyHash(`${rule.feat}|${rule.label}`)}`,
        label: rule.label,
        source: rule.source || FEATURE_SOURCE_LABELS.feat,
        description,
        dynamic: true
      }];
    });
  }

  function getAbilityModifier(abilityId) {
    const rawScore = String(document.getElementById(abilityId)?.value || "").trim();
    if (!/^[+-]?\d+$/u.test(rawScore)) return null;
    const score = Number(rawScore);
    return Number.isSafeInteger(score) ? Math.floor((score - 10) / 2) : null;
  }

  function getGoliathAncestryDescription(ruleName, override = "") {
    const description = override || getNamedRuleDescription(typeof raceFeatures === "undefined" ? "" : raceFeatures.goliath, ruleName);
    return description ? `${description}\n\n使用次數＝熟練加值，長休後恢復。` : "";
  }

  function getDragonbornBreathDamageDice(level) {
    if (level >= 17) return "4d10";
    if (level >= 11) return "3d10";
    if (level >= 5) return "2d10";
    return "1d10";
  }

  function getDragonbornBreathDamageType() {
    const ancestry = document.getElementById("dragonborn-ancestry")?.value || "";
    const damageTypes = {
      acid: "酸",
      lightning: "電",
      fire: "火",
      poison: "毒",
      cold: "冷凍"
    };
    return damageTypes[ancestry.split("_").at(-1)] || "";
  }

  function getDragonbornBreathDescription() {
    const constitutionModifier = getAbilityModifier("con");
    const saveDc = constitutionModifier === null
      ? "8+熟練+體質加值"
      : String(8 + getProficiencyBonus() + constitutionModifier);
    return `將１次攻擊換為吐息\n15呎錐形 或 5呎寬、30呎長直線\n範圍內生物敏捷豁免 DC ${saveDc}\n失敗造成 ${getDragonbornBreathDamageDice(getCharacterLevel())} 點${getDragonbornBreathDamageType()}傷害，成功傷害減半。\n使用次數＝熟練加值，長休後恢復。`;
  }

  function getSelectedSpellEntries(mode) {
    if (typeof SpellCatalog === "undefined") return [];
    const timingPattern = mode === "action"
      ? /(?:施法時間\s*[：:]\s*動作(?:或儀式)?(?=[ \t]*(?:\r?\n|$))|施法時間\s*[：:][ \t]*(?:\r?\n)+[ \t]*-[ \t]*動作(?:（[^）]+）)?)/u
      : mode === "bonus"
        ? /施法時間\s*[：:]\s*附贈動作/u
        : /施法時間\s*[：:]\s*反應動作/u;
    return (globalScope.SpellManagement?.getEntries({ availableOnly: true }) || []).flatMap(entry => {
      const spellId = entry.spellId || "";
      const spell = SpellCatalog.getSpell(spellId);
      // 燃火術以附贈動作施法，也能以魔法動作投擲現有火焰。
      const isProduceFlameAction = spellId === "produce-flame" && mode === "action";
      if (!spell || (!isProduceFlameAction && !timingPattern.test(spell.desc || ""))) return [];
      const sourceTag = typeof globalScope.getPickedSpellSourceTag === "function"
        ? globalScope.getPickedSpellSourceTag(entry)
        : "";
      const sourceKey = entry.sourceKey;
      const sourceLabel = entry.sourceLabel || "來源：職業法表";
      const levelTag = spell.level === 0
        ? "戲法"
        : `${["", "一", "二", "三", "四", "五", "六", "七", "八", "九"][spell.level] || spell.level}環`;
      const shortSourceLabel = sourceTag || sourceLabel.replace(/^來源[：:]\s*/u, "");
      return [{
        key: `dynamic-${mode}-spell-${spellId}-${stableKeyHash(sourceKey)}`,
        spellId,
        spellSourceKey: sourceKey,
        label: spell.nameZh,
        source: FEATURE_SOURCE_LABELS.spell,
        buttonTag: shortSourceLabel ? `${levelTag} · ${shortSourceLabel}` : levelTag,
        description: spell.desc,
        dynamic: true
      }];
    });
  }

  // 魔能祈喚本身的按鈕（內容檔附錄小節的 source: invocation 動作）：說明為整段祈喚文字。
  function getSelectedInvocationEntries(mode) {
    if (typeof eldritchInvocations === "undefined" || document.getElementById("class")?.value !== "warlock") return [];
    return getClassActionRules("warlock").filter(rule => rule.source === "invocation" && rule.mode === mode).flatMap(rule => {
      if (getCharacterLevel() < rule.level || !hasSelectedEldritchInvocation(rule.invocation)) return [];
      if (rule.requiresInvocation && !hasSelectedEldritchInvocation(rule.requiresInvocation)) return [];
      const invocation = eldritchInvocations.find(entry => entry.name === rule.invocation);
      if (!invocation) return [];
      return [{
        key: rule.key,
        label: invocation.name,
        source: FEATURE_SOURCE_LABELS.invocation,
        description: sourceToPlainText(invocation.text || ""),
        dynamic: true
      }];
    });
  }

  function getSelectedMetamagicEntries(mode) {
    if (mode !== "bonus" || document.getElementById("class")?.value !== "sorcerer" || getCharacterLevel() < 2) return [];

    return Array.from(
      document.querySelectorAll("#metamagicOptions input[data-metamagic-name]:checked")
    ).flatMap(input => {
      if (input.dataset.metamagicName !== "瞬發法術") return [];
      const option = typeof metamagicOptions === "undefined" ? null : metamagicOptions.find(entry => entry.name === "瞬發法術");
      const description = sourceToPlainText(option?.text || "");
      if (!description) return [];

      const label = input.dataset.metamagicName || "超魔法";
      return [{
        key: `dynamic-${mode}-metamagic-${stableKeyHash(label)}`,
        label,
        source: FEATURE_SOURCE_LABELS.metamagic,
        description,
        dynamic: true
      }];
    });
  }


  function formatSignedModifier(value) {
    const modifier = Number(value);
    if (!Number.isFinite(modifier) || modifier === 0) return "+ 0";
    return modifier > 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`;
  }

  function formatDiceWithModifier(dice, modifier) {
    return `${dice} ${formatSignedModifier(modifier)}`;
  }


  function hasSelectedEldritchInvocation(invocationName) {
    if (!invocationName) return true;
    return Array.from(
      document.querySelectorAll("#eldritch-invocations-output input[data-invocation-name]:checked")
    ).some(input => input.dataset.invocationName === invocationName);
  }


  // 職業描述來自 class-content.generated.js（由 content/ 的職業內容檔建置）：classFeatures 為職業頁 HTML，
  // classTabletopText 為與職業頁不同的跑團說明（tabletop）與總覽一句話（summaries）。跑團擷取段落時只處理下列標記：
  // - data-tabletop-value="名稱"：內文是職業詳情的通用文字，跑團改顯示該職業內容檔數值（特性表欄位、values）
  //   依目前等級與屬性值算出的文字（character-rules.js 的 getClassValueText，套用 format）；無值時保留通用文字。
  // - data-tabletop-hide：只在職業詳情顯示，跑團擷取時移除。
  // - data-tabletop-only：只在跑團顯示，職業詳情由 styles.css 隱藏。
  // - data-overview-hide：跑團總覽的一句話提醒另外移除（引言、選項名稱）；動作按鈕仍顯示。
  function getClassValueContext() {
    const field = id => String(document.getElementById(id)?.value || "").trim();
    return {
      level: getCharacterLevel(),
      levelBlank: !field("level"),
      abilityScores: Object.fromEntries(["str", "dex", "con", "int", "wis", "cha"].map(id => [id, field(id)]))
    };
  }

  // 職業描述段落轉為跑團純文字：忽略原始碼縮排，區塊之間空一行，清單項目以「- 」開頭並連續排列。
  const CLASS_DESCRIPTION_SKIPPED = "table, input, button, select, label, [hidden], .is-hidden, script, style";
  const CLASS_DESCRIPTION_BLOCKS = new Set(["P", "DIV", "SECTION", "UL", "OL", "H4", "H5", "H6", "BLOCKQUOTE", "DETAILS", "SUMMARY"]);

  function classDescriptionToPlainText(root) {
    const lines = [];
    let text = "";
    let inListItem = false;
    const flush = () => {
      const line = text.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim();
      if (line) lines.push({ line: inListItem ? `- ${line}` : line, listItem: inListItem });
      text = "";
    };
    const walk = node => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.nodeValue.replace(/ /g, " ").replace(/[ \t\r]*\n\s*/g, "");
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE || node.matches(CLASS_DESCRIPTION_SKIPPED)) return;
      if (node.tagName === "BR") {
        text += "\n";
        return;
      }
      const isListItem = node.tagName === "LI";
      const isBlock = isListItem || CLASS_DESCRIPTION_BLOCKS.has(node.tagName);
      const outerListItem = inListItem;
      if (isBlock) flush();
      if (isListItem) inListItem = true;
      node.childNodes.forEach(walk);
      if (isBlock) flush();
      inListItem = outerListItem;
    };
    root.childNodes.forEach(walk);
    flush();
    return lines.map((entry, index) => {
      if (!index) return entry.line;
      return `${entry.listItem && lines[index - 1].listItem ? "\n" : "\n\n"}${entry.line}`;
    }).join("");
  }

  const classDescriptionCache = new Map();

  function getClassDescriptionSource(className) {
    const raw = typeof classFeatures === "undefined" ? "" : String(classFeatures[className] || "");
    let cached = classDescriptionCache.get(className);
    if (!cached || cached.raw !== raw) {
      const holder = document.createElement("div");
      holder.innerHTML = raw;
      const blocks = new Map(Array.from(holder.querySelectorAll("[data-action-id]"), block => [block.dataset.actionId, block]));
      cached = { raw, holder, blocks, textBlocks: new Map() };
      classDescriptionCache.set(className, cached);
    }
    return cached;
  }

  // 內容檔另寫的跑團文字（kind 為 "tabletop" 或 "summaries"），包成與職業頁段落相同讀法的區塊；沒有時回傳 null。
  function getClassTextBlock(className, kind, id) {
    const map = typeof classTabletopText === "undefined" ? null : classTabletopText[className]?.[kind];
    if (!map || !Object.hasOwn(map, id)) return null;
    const { textBlocks } = getClassDescriptionSource(className);
    const cacheKey = `${kind}:${id}`;
    if (!textBlocks.has(cacheKey)) {
      const block = document.createElement("div");
      block.innerHTML = String(map[id]);
      textBlocks.set(cacheKey, block);
    }
    return textBlocks.get(cacheKey);
  }

  function getClassTextBlocks(className) {
    const entries = typeof classTabletopText === "undefined" ? {} : classTabletopText[className] || {};
    return ["tabletop", "summaries"].flatMap(kind => Object.keys(entries[kind] || {}).map(id => getClassTextBlock(className, kind, id)));
  }

  function resolveTabletopValue(element, className, context) {
    let value = null;
    try {
      value = globalScope.getClassValueText?.(className, element.dataset.tabletopValue, context) ?? null;
    } catch (error) {
      value = null;
    }
    if (value !== null && String(value).trim()) element.textContent = String(value);
  }

  function getTabletopBlockText(block, removedSelector, className) {
    const copy = block.cloneNode(true);
    copy.querySelectorAll(removedSelector).forEach(element => element.remove());
    copy.querySelectorAll("[data-tabletop-only][hidden]").forEach(element => element.removeAttribute("hidden"));
    const context = getClassValueContext();
    copy.querySelectorAll("[data-tabletop-value]").forEach(element => resolveTabletopValue(element, className, context));
    return classDescriptionToPlainText(copy);
  }

  // descriptionIds 為 "id" 或 ["id", { id, level }]；已達等級的段落依序以空行串接。
  // 任一需要的段落缺少時回傳空字串：按鈕不出現，並由回歸檢查回報。
  function getClassActionDescription(className, descriptionIds) {
    const level = getCharacterLevel();
    const { blocks } = getClassDescriptionSource(className);
    const parts = [];
    for (const item of [].concat(descriptionIds || [])) {
      const isGated = Boolean(item) && typeof item === "object";
      if (isGated && level < (Number(item.level) || 0)) continue;
      const id = isGated ? item.id : item;
      const block = getClassTextBlock(className, "tabletop", id) || blocks.get(id);
      if (!block) return "";
      parts.push(getTabletopBlockText(block, "h3, [data-tabletop-hide]", className));
    }
    return parts.filter(Boolean).join("\n\n");
  }

  // 跑團總覽是一句話提醒：與動作按鈕同一段落，另移除 data-overview-hide，清單併為一行。
  // 顯示條件與等級門檻由呼叫端決定；段落缺少時回傳空字串。依序讀取 summaries、tabletop、職業頁段落。
  function getClassOverviewDescription(className, descriptionId) {
    const block = getClassTextBlock(className, "summaries", descriptionId)
      || getClassTextBlock(className, "tabletop", descriptionId)
      || getClassDescriptionSource(className).blocks.get(descriptionId);
    if (!block) return "";
    return getTabletopBlockText(block, "h3, [data-tabletop-hide], [data-overview-hide]", className)
      .split("\n")
      .map(line => line.replace(/^- /u, "").trim())
      .filter(Boolean)
      .join("");
  }

  function getClassDescriptionIssues() {
    const issues = [];
    const classNames = new Set([
      ...(typeof classFeatures === "undefined" ? [] : Object.keys(classFeatures)),
      ...(typeof classRules === "undefined" ? [] : Object.keys(classRules))
    ]);
    classNames.forEach(className => {
      const { holder, blocks } = getClassDescriptionSource(className);
      // 動作說明段落、只顯示勾選選項的段落，以及內容檔每個能力與子能力的段落（跑團總覽依 ID 讀取）。
      const ids = [
        ...getClassActionRules(className).flatMap(rule => [
          ...rule.descriptionIds,
          ...(rule.selectedOptionOnly?.options || []).map(option => option.blockId)
        ]),
        ...(globalScope.getClassFeatureRules?.(className) || []).flatMap(feature => [feature.id, ...(feature.parts || []).map(part => part.id)])
      ].map(item => (item && typeof item === "object" ? item.id : item));
      new Set(ids).forEach(id => {
        if (!blocks.has(id)) issues.push(`${className}: 找不到 data-action-id="${id || ""}" 的職業描述段落`);
      });
      new Set([holder, ...getClassTextBlocks(className)].flatMap(root => Array.from(root.querySelectorAll("[data-tabletop-value]"), element => element.dataset.tabletopValue))).forEach(key => {
        if (!globalScope.hasClassValue?.(className, key)) issues.push(`${className}: data-tabletop-value="${key}" 不是此職業內容檔的數值`);
      });
    });
    return issues;
  }

  // Exact named-rule lookup is display-only; metadata supplies every mode and gate.
  // Preserve continuation lines (including lists), unlike the old one-line feat copy.
  function getNamedRuleDescription(raw, ruleName) {
    const text = sourceToPlainText(raw);
    const escaped = ruleName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = new RegExp('(?:^|\\n)' + escaped + '[：:]\\s*([\\s\\S]*?)(?=\\n[^\\n：:]+[：:]|\\n「擴充」|$)', 'u').exec(text);
    return match ? match[1].trim() : "";
  }

  function resolveFeatureRules(rules, mode, source, describe) {
    const level = getCharacterLevel();
    return rules.flatMap(rule => {
      if (rule.mode !== mode || level < rule.level) return [];
      if (rule.className && document.getElementById("class")?.value !== rule.className) return [];
      if (rule.choiceId && document.getElementById(rule.choiceId)?.value !== rule.choiceValue) return [];
      if (rule.checkedId && !document.getElementById(rule.checkedId)?.checked) return [];
      if (rule.invocation && !hasSelectedEldritchInvocation(rule.invocation)) return [];
      if (rule.requiresInvocation && !hasSelectedEldritchInvocation(rule.requiresInvocation)) return [];
      let description = typeof rule.description === "function" ? rule.description() : rule.description || describe(rule);
      if (!description) return [];
      if (rule.proficiencyValue) description = description.replace(/熟練加值/gu, String(getProficiencyBonus()));
      return [{
        key: rule.key || `dynamic-${mode}-${source}-${rule.id}`,
        label: typeof rule.label === "function" ? rule.label() : rule.label,
        source: FEATURE_SOURCE_LABELS[source],
        description,
        requiredLevel: rule.level,
        ...(rule.legacyKeys ? { legacyKeys: rule.legacyKeys } : {}),
        ...(rule.resourceKey ? { resourceKey: rule.resourceKey } : {}),
        ...(rule.druidOperation ? { druidOperation: rule.druidOperation } : {}),
        ...(rule.tabletopOnly ? { tabletopOnly: true } : {}),
        dynamic: true
      }];
    });
  }

  function getExplicitClassEntries(mode) {
    const className = document.getElementById("class")?.value || "";
    return resolveFeatureRules(getClassActionRules(className).filter(rule => rule.source === "class"), mode, "class",
      rule => getClassActionDescription(className, rule.descriptionIds));
  }

  function getExplicitRaceEntries(mode) {
    const raceName = document.getElementById("race")?.value || "";
    return resolveFeatureRules(RACE_ACTION_RULES.filter(rule => rule.race === raceName), mode, "race",
      rule => getNamedRuleDescription(typeof raceFeatures === "undefined" ? "" : raceFeatures[raceName], rule.ruleName));
  }

  function getDynamicOptions(mode) {
    if (mode !== "action" && mode !== "bonus" && mode !== "reaction" && mode !== "movement") return [];
    const entries = [
      ...getExplicitClassEntries(mode),
      ...getExplicitRaceEntries(mode),
      ...getTabletopFeatRuleEntries(mode),
      ...getSelectedInvocationEntries(mode),
      ...getSelectedMetamagicEntries(mode),
      ...((mode === "action" || mode === "bonus" || mode === "reaction") ? getSelectedSpellEntries(mode) : [])
    ];
    const seen = new Set();
    return entries.filter(entry => {
      const fingerprint = `${entry.source}|${entry.label}|${entry.description}|${entry.spellSourceKey || ""}`.replace(/\s+/g, " ");
      if (seen.has(fingerprint)) return false;
      seen.add(fingerprint);
      return true;
    });
  }

  function renderDescription(option) {
    const description = panelElements.description;
    description.replaceChildren();
    if (!option) {
      description.textContent = MODE_META[currentMode].prompt;
      return;
    }

    const heading = document.createElement("div");
    heading.className = "action-description-heading";
    const titleGroup = document.createElement("div");
    titleGroup.className = "action-description-title";
    const title = document.createElement("strong");
    title.textContent = option.label;
    titleGroup.appendChild(title);
    if (option.englishLabel) {
      const english = document.createElement("span");
      english.className = "action-description-english";
      english.lang = "en";
      english.textContent = option.englishLabel;
      titleGroup.appendChild(english);
    }
    heading.appendChild(titleGroup);
    if (option.source) {
      const source = document.createElement("span");
      source.textContent = option.source;
      heading.appendChild(source);
    }

    const copy = document.createElement("div");
    copy.className = "action-description-copy";
    if (option.spellId && typeof globalScope.appendSpellDescContent === "function") {
      globalScope.appendSpellDescContent(copy, option.description);
    } else {
      copy.textContent = option.description;
    }
    description.append(heading, copy);
  }

function getButtonLabel(option) {
  return String(option.label).replace(/^等級\s*\d+\s*[：:]\s*/u, "");
}

  function createOptionButton(option) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "action-option-button";
    button.dataset.actionOptionKey = option.key;
    if (option.dynamic) button.classList.add("is-character-option");

    const label = document.createElement("span");
    label.className = "action-option-label";
    label.textContent = getButtonLabel(option);
    button.appendChild(label);
    if (option.source) {
      const source = document.createElement("span");
      source.className = "action-option-source";
      source.textContent = option.source;
      button.appendChild(source);
    }

    button.addEventListener("click", () => {
      selectedOptionKey = option.key;
      panelElements.grid.querySelectorAll(".action-option-button").forEach(item => {
        item.classList.toggle("is-selected", item === button);
        item.setAttribute("aria-pressed", item === button ? "true" : "false");
      });
      renderDescription(option);
    });
    button.setAttribute("aria-pressed", option.key === selectedOptionKey ? "true" : "false");
    if (option.key === selectedOptionKey) button.classList.add("is-selected");
    return button;
  }

  function getAvailableStaticOptions(mode) {
    return STATIC_OPTIONS[mode] || [];
  }

function getModeOptions(mode) {
  if (!STATIC_OPTIONS[mode]) return [];
  return [...getAvailableStaticOptions(mode), ...getDynamicOptions(mode)];
}

  function getPublicModeOptions(mode) {
    return Object.freeze(
      getAvailableStaticOptions(mode).map(option => Object.freeze({ ...option }))
    );
  }

  function getCurrentClassActionRule(option) {
    if (option.source !== FEATURE_SOURCE_LABELS.class) return null;
    return getClassActionRules(document.getElementById("class")?.value || "").find(rule => rule.key === option.key) || null;
  }

  function getTabletopDescription(option) {
    let description = option.description;
    const selectedOnly = getCurrentClassActionRule(option)?.selectedOptionOnly;
    if (selectedOnly) {
      // 跑團只顯示目前勾選的選項段落（例如狩獵目標）。
      const className = document.getElementById("class")?.value || "";
      const choice = selectedOnly.options.find(item => document.getElementById(item.inputId)?.checked);
      description = (choice && getClassActionDescription(className, choice.blockId)) || `請在職業能力中選擇${selectedOnly.name}。`;
    }
    return { ...option, description };
  }

  // 跑團分頁：內容檔的 tabletopAlso 讓按鈕另外列在其他分頁（例如吟遊詩人激勵也列在動作）；tabletopHidden 不顯示。
  function getTabletopAlsoOptions(mode) {
    const className = document.getElementById("class")?.value || "";
    const rules = getClassActionRules(className).filter(rule => rule.tabletopAlso === mode);
    return [...new Set(rules.map(rule => rule.mode))].flatMap(otherMode => getModeOptions(otherMode)
      .filter(option => rules.some(rule => rule.mode === otherMode && rule.key === option.key)));
  }

  function getPublicTabletopModeOptions(mode) {
    return Object.freeze(
      [...(mode === "action" ? TABLETOP_ACTION_OPTIONS : []), ...(mode === "movement" ? TABLETOP_MOVEMENT_OPTIONS : []), ...getModeOptions(mode), ...getTabletopAlsoOptions(mode)]
        .filter(option => {
          if (getCurrentClassActionRule(option)?.tabletopHidden) return false;
          if (mode !== "movement") return true;
          if (option.key === "special-speeds" || option.key === "speed-changes") return false;
          return option.key !== "flying"
            || (document.getElementById("race")?.value === "dragonborn" && getCharacterLevel() >= 5)
            || Boolean(globalScope.TabletopMode?.getDruidForm?.()?.speeds?.["飛行"] || globalScope.TabletopMode?.getDruidForm?.()?.speeds?.["游泳"])
            || (document.getElementById("class")?.value === "wizard" && globalScope.TabletopSpells?.isSpellCurrentlySelected?.("fly"));
        })
        .map(option => Object.freeze(getTabletopDescription(option)))
    );
  }

  function getPublicModeMeta(mode) {
    return MODE_META[mode]
      ? Object.freeze({ ...MODE_META[mode] })
      : null;
  }

function renderMode(mode, preserveSelection = false) {
  if (!MODE_META[mode]) return;

  const modeOptions = Object.fromEntries(
    Object.keys(MODE_META).map(tabMode => [
      tabMode,
      getAvailableStaticOptions(tabMode)
    ])
  );

  panelElements.tabs.forEach(tab => {
    const tabMode = tab.dataset.actionMode;
    tab.hidden = modeOptions[tabMode].length === 0;
  });

  if (modeOptions[mode].length === 0) {
    const fallbackTab = panelElements.tabs.find(
      tab => !tab.hidden
    );

    if (fallbackTab) {
      mode = fallbackTab.dataset.actionMode;
    }
  }

  currentMode = mode;
  if (!preserveSelection) selectedOptionKey = "";

  const meta = MODE_META[mode];
  const options = modeOptions[mode];

    panelElements.tabs.forEach(tab => {
  const tabMode = tab.dataset.actionMode;
  const hasOptions = getAvailableStaticOptions(tabMode).length > 0;

  tab.hidden = !hasOptions;
});

    panelElements.tabs.forEach(tab => {
      const active = tab.dataset.actionMode === mode;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
      tab.tabIndex = active ? 0 : -1;
    });
    const activeTab = panelElements.tabs.find(tab => tab.dataset.actionMode === mode);
    panelElements.panel.setAttribute("aria-labelledby", activeTab.id);
    panelElements.timing.textContent = meta.timing;
    panelElements.summary.textContent = meta.summary;
    panelElements.grid.setAttribute("aria-label", `${activeTab.textContent.trim()}選項`);
    panelElements.grid.dataset.actionMode = mode;

    panelElements.grid.replaceChildren(...options.map(createOptionButton));
    const selected = options.find(option => option.key === selectedOptionKey);
    if (!selected) selectedOptionKey = "";
    renderDescription(selected || null);

    globalScope.dispatchEvent?.(new CustomEvent("actionpanelchange", {
      detail: { mode }
    }));
  }

  function scheduleDynamicRefresh() {
    if (scheduledRefresh) return;
    scheduledRefresh = requestAnimationFrame(() => {
      scheduledRefresh = 0;
      // The legacy panel displays fixed rules. Character changes only invalidate
      // its dynamic consumers; keep the static buttons, selection and focus intact.
      // getTabletopOptions still reads canonical controls synchronously.
      if (currentMode === "action" || currentMode === "bonus" || currentMode === "reaction" || currentMode === "movement") {
        globalScope.dispatchEvent?.(new CustomEvent("actionpanelchange", {
          detail: { mode: currentMode, source: "character" }
        }));
      }
    });
  }

  function handleDynamicSourceChange(event) {
    const target = event.target;
    if (!target?.matches) return;
    if (target.matches("#class, #race, #level, #str, #dex, #con, #int, #wis, #cha")
      || target.closest("#classFeatures, #raceFeatures, #feats-area, #eldritch-invocations-output, #metamagicOptions")) {
      scheduleDynamicRefresh();
    }
  }

  function bindTabKeyboardNavigation(event) {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const tabs = panelElements.tabs;
    const currentIndex = tabs.indexOf(event.currentTarget);
    let nextIndex = currentIndex;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    tabs[nextIndex].focus();
    renderMode(tabs[nextIndex].dataset.actionMode);
  }

  function observeDynamicSources() {
    const observer = new MutationObserver(scheduleDynamicRefresh);
    [
      "classFeatures", "raceFeatures", "feats-area", "eldritch-invocations-output", "metamagicOptions"
    ].forEach(id => {
      const target = document.getElementById(id);
      if (target) observer.observe(target, { childList: true, subtree: true, characterData: true });
    });
    document.addEventListener("change", handleDynamicSourceChange);
    document.addEventListener("input", handleDynamicSourceChange);
    globalScope.addEventListener("spellmanagementchange", scheduleDynamicRefresh);
  }

  function initializeActionPanel() {
    const panel = document.getElementById("action-mode-panel");
    const grid = document.getElementById("action-option-grid");
    const description = document.getElementById("action-description");
    if (!panel || !grid || !description) return;

    panelElements = {
      panel,
      grid,
      description,
      timing: document.getElementById("action-mode-timing"),
      summary: document.getElementById("action-mode-summary"),
      tabs: Array.from(document.querySelectorAll(".action-mode-tab"))
    };
    panelElements.tabs.forEach(tab => {
      tab.addEventListener("click", () => renderMode(tab.dataset.actionMode));
      tab.addEventListener("keydown", bindTabKeyboardNavigation);
    });
    observeDynamicSources();
    renderMode("basic");
  }

  globalScope.ActionPanel = Object.freeze({
    getModes() {
      return Object.freeze(Object.keys(MODE_META));
    },
    getModeMeta: getPublicModeMeta,
    getOptions: getPublicModeOptions,
    getTabletopOptions: getPublicTabletopModeOptions,
    getSourceLabels() {
      return Object.freeze({ ...FEATURE_SOURCE_LABELS });
    },
    getButtonLabel,
    getClassDescription: getClassActionDescription,
    getClassOverviewDescription,
    getClassDescriptionIssues,
    requestRefresh: scheduleDynamicRefresh
  });

  document.addEventListener("DOMContentLoaded", initializeActionPanel);
})(typeof window !== "undefined" ? window : globalThis);

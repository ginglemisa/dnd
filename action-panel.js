(function attachActionPanel(globalScope) {
  "use strict";

  const STATIC_OPTIONS = Object.freeze({
    action: Object.freeze([
      { key: "attack", label: "攻擊", description: "拾取或拔出一把武器進行攻擊。" },
      { key: "unarmed", label: "徒手", description: "對 5 呎內的目標拳打、踢擊或以其他方式徒手攻擊。命中加值為力量調整值加熟練加值；命中時造成 1 加力量調整值的鈍擊傷害。" },
      { key: "grapple", label: "擒抱", description: "以一次擒抱替代一次攻擊，以空手抓住 5 呎內、且體型不超過你一級的目標。目標進行力量或敏捷豁免（DC = 8 + 力量調整值 + 熟練加值）；失敗時陷入擒抱狀態。" },
      { key: "shove", label: "推撞", description: "以一次推撞替代一次攻擊，選擇 5 呎內、且體型不超過你一級的目標。目標進行力量或敏捷豁免（DC = 8 + 力量調整值 + 熟練加值）；失敗時由你將其推開 5 呎或擊倒。" },
      { key: "dash", label: "衝刺", description: "在本回合剩餘時間內，獲得等同於你速度的額外移動力。" },
      { key: "disengage", label: "撤離", description: "在本回合剩餘時間內，你的移動不會引發藉機攻擊。" },
      { key: "dodge", label: "閃避", description: "直到你下一回合開始前，對你的攻擊擲骰具有劣勢，且你的敏捷豁免具有優勢。若你陷入失能狀態或速度為 0，便失去此效果。" },
      { key: "help", label: "協助", description: "協助另一個生物進行屬性檢定或攻擊擲骰，也可以對其施予急救。" },
      { key: "hide", label: "躲藏", description: "進行一次敏捷（隱匿）檢定，嘗試避開其他生物的注意。" },
      { key: "influence", label: "影響", description: "進行魅力（欺瞞、威嚇、表演或遊說）或感知（馴獸）檢定，嘗試改變生物的態度。" },
      { key: "magic", label: "魔法", description: "施放施法時間為動作的法術、使用魔法物品，或啟動需要魔法動作的特性。" },
      { key: "ready", label: "準備", description: "設定一個可感知的觸發條件，並指定條件發生時要執行的動作。觸發後，你使用反應執行該動作。" },
      { key: "search", label: "搜索", description: "進行感知（洞悉、醫藥、察覺或生存）檢定，尋找隱藏的生物、物品或線索。" },
      { key: "study", label: "研究", description: "進行智力（奧秘、歷史、調查、自然或宗教）檢定，回想或分析相關資訊。" },
      { key: "utilize", label: "使用", description: "操作或使用需要動作的非魔法物品。" }
    ]),
    bonus: Object.freeze([
      { key: "drink-potion", label: "喝藥水", description: "以附贈動作喝下一瓶治療藥水，恢復 2d4 + 2 點生命值。" },
      { key: "offhand-attack", label: "二次攻擊", description: "以輕型武器完成攻擊後，可用附贈動作持另一把輕型武器再攻擊一次。除非具備特定專長，這次攻擊的傷害不加正值屬性調整值。" }
    ]),
    reaction: Object.freeze([
      { key: "opportunity-attack", label: "藉機攻擊", description: "當你能看見的生物離開你的觸及範圍時，你可以使用反應，對該生物進行一次近戰攻擊。" }
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

  const MODE_META = Object.freeze({
    action: { timing: "每回合一次", summary: "執行主要行動，例如攻擊或閃避。", prompt: "請選擇一個動作查看說明。" },
    bonus: { timing: "每回合最多一次", summary: "執行有條件的額外動作，只有規則或能力允許時才能使用。", prompt: "請選擇一個附贈動作查看說明。" },
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

  const GOLIATH_ANCESTRY_FEATURES = Object.freeze({
    cloud: "雲遊四方",
    fire: "星火燎原",
    frost: "凜若冰霜",
    hill: "地動山搖",
    stone: "堅若磐石",
    storm: "轟雷掣電"
  });
  const GOLIATH_ANCESTRY_FEATURE_NAMES = new Set(Object.values(GOLIATH_ANCESTRY_FEATURES));

  const INVOCATION_OPTIONS_BY_MODE = Object.freeze({
    action: new Set(["鏈之魔契"]),
    bonus: new Set(["刃之魔契", "共視感官", "鏈主賦能"]),
    reaction: new Set(["鏈主賦能"])
  });

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

  function cleanFeatureTitle(value, fallback) {
    const cleaned = String(value || "")
      .replace(/^[-*•]\s*/, "")
      .replace(/[：:]\s*$/, "")
      .replace(/[－—-]\s*消耗\s*[：:]?[^）\n]+$/u, "")
      .replace(/[（(](?:先決條件[^）)]*|[^）)]*子職|[^）)]*巨人|消耗[^）)]*|\s*\d+\s*點)[）)]\s*$/u, "")
      .replace(/[\p{Extended_Pictographic}\p{Emoji_Modifier}\uFE0F]/gu, "")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned && cleaned.length <= 36 ? cleaned : fallback;
  }

  function isMeaningfulInlineTitle(value) {
    const candidate = String(value || "").trim();
    if (!candidate || candidate.length > 28) return false;
    if (/(?:附贈|反應|[藉借]機攻擊)/u.test(candidate)) return false;
    if (/^(?:施法時間|觸發|響應|效果|備註|使用方式|持續時間|聯結結束條件|你|你的|當|若|如果)/u.test(candidate)) return false;
    return !/[。；，,]$/u.test(candidate);
  }

  function isStandaloneFeatureHeading(lines, index) {
    const line = lines[index]?.trim() || "";
    const previousLine = lines[index - 1]?.trim() || "";
    if (!line || previousLine || /^[-*•\d]/u.test(line) || line.length > 48) return false;
    if (/[。；，,]$/u.test(line)) return false;
    if (/(?:以下|用法|使用方式|持續時間|期間|結束條件|次數|回復|恢復)/u.test(line)) return false;
    return true;
  }

  function findFeatureTitle(lines, matchIndex, sourceLabel) {
    const matchedLine = lines[matchIndex] || "";
    const inlineHeading = matchedLine.match(/^[-*•]?\s*(?:等級\s*\d+\s*[：:]\s*)?([^：:]{1,36})[：:]/u)?.[1];
    if (isMeaningfulInlineTitle(inlineHeading)) {
      return cleanFeatureTitle(inlineHeading, `${sourceLabel}能力`);
    }

    const earliestIndex = Math.max(0, matchIndex - 60);
    for (let index = matchIndex; index >= earliestIndex; index -= 1) {
      const line = lines[index]?.trim();
      if (!line) continue;
      if (/^等級\s*\d+\s*[：:]\s*.{1,36}$/u.test(line)) {
        return cleanFeatureTitle(line, `${sourceLabel}能力`);
      }
      if (index < matchIndex && isStandaloneFeatureHeading(lines, index)) return cleanFeatureTitle(line, `${sourceLabel}能力`);
    }

    return `${sourceLabel}能力`;
  }

  function relevantParagraph(lines, matchIndex) {
    let start = matchIndex;
    let end = matchIndex;
    while (start > 0 && lines[start - 1].trim()) start -= 1;
    while (end + 1 < lines.length && lines[end + 1].trim()) end += 1;
    const paragraph = lines.slice(start, end + 1).map(line => line.trim()).filter(Boolean).join("\n");
    if (paragraph.length <= 760) return paragraph;

    const compactStart = Math.max(start, matchIndex - 1);
    const compactEnd = Math.min(end, matchIndex + 4);
    return lines.slice(compactStart, compactEnd + 1).map(line => line.trim()).filter(Boolean).join("\n");
  }

  function stableKeyHash(value) {
    let hash = 2166136261;
    for (const character of String(value)) {
      hash ^= character.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  // These are deliberate one-to-one metadata rules for features whose source
  // wording does not expose its level or selection requirement to the extractor.
  const SPECIAL_FEATURE_RULES = Object.freeze({
    "龍翔天際": { label: "等級 5：龍翔天際", requiredLevel: 5 },
    "岩石侏儒": { gnomeLineage: "rock_gnome" },
    "巨化形體": { label: "等級 5：巨化形體", requiredLevel: 5 }
  });

  const MONK_REMOVED_LABELS = new Set(["疾風連擊", "閃轉騰挪", "疾步如風"]);
  const MONK_CUSTOM_OPTIONS = Object.freeze([
    {
      mode: "bonus", level: 2, label: "等級 2：聚氣凝神",
      description: "等級 2：聚氣凝神\n你可使用「專注點」施展武僧技巧。專注點上限見武僧特性表，短休或長休後全回復。\n\n你一開始有 3 種用法：\n\n- 疾風連擊（1 點）：附贈動作打 2 次徒手。\n- 閃轉騰挪：附贈動作可撤離；再花 1 點可同時撤離 + 回避。\n- 疾步如風：附贈動作可疾走；再花 1 點可同時撤離 + 疾走，且本回合跳躍距離加倍。\n\n若特性要求豁免，DC = 8 + 熟練加值 + 感知調整值。"
    },
    {
      mode: "bonus", level: 3, label: "等級 3：散打技巧",
      description: "等級 3：散打技巧\n當你用「疾風連擊」命中時，可讓目標承受 1 種效果：\n\n- 截擊：到你下回合結束前，目標不能發動借機攻擊。\n- 擊退：目標力量豁免失敗則被推離你最多 15 呎。\n- 擊倒：目標敏捷豁免失敗則倒地。"
    },
    {
      mode: "action", level: 5, label: "等級 5：震懾擊",
      description: "等級 5：震懾擊\n每回合 1 次，當你用武僧武器或徒手命中時，可花 1 點專注點發動震懾打擊。 目標需做體質豁免：\n  - 失敗：震懾到你下回合開始。\n  - 成功：速度減半，且到你下回合開始前，下一次對它的攻擊有優勢。"
    }
  ]);

  function getCharacterLevel() {
    return Number(document.getElementById("level")?.value) || 1;
  }

  function getRequiredLevel(entry) {
    return entry.requiredLevel || Number(String(entry.label).match(/^等級\s*(\d+)\s*[：:]/u)?.[1]) || 1;
  }

  function applySpecialFeatureRule(entry) {
    const rule = SPECIAL_FEATURE_RULES[entry.label];
    if (!rule) return entry;
    return { ...entry, label: rule.label || entry.label, requiredLevel: rule.requiredLevel, gnomeLineage: rule.gnomeLineage };
  }

  function getMonkCustomEntries(mode) {
    if (document.getElementById("class")?.value !== "monk") return [];
    const level = getCharacterLevel();
    return MONK_CUSTOM_OPTIONS
      .filter(option => option.mode === mode && level >= option.level)
      .map(option => ({ ...option, key: `dynamic-${mode}-class-${stableKeyHash(option.label)}`, source: FEATURE_SOURCE_LABELS.class, dynamic: true }));
  }

  function extractTimedFeatureEntries(raw, mode, source) {
    const timingPattern = mode === "bonus"
      ? /(?:附贈動作|(?:使用|用|消耗|以)[^。；\n]{0,6}「?附贈」?)/u
      : /(?:反應(?:動作)?|[藉借]機攻擊)/u;
    const passiveOrUnavailablePattern = mode === "bonus"
      ? /(?:無法|不能)[^。；\n]{0,14}(?:附贈|動作)|附贈動作[^。；\n]{0,10}(?:被浪費|無法使用|(?:主動)?(?:解除|結束))/u
      : /(?:無法|不能)[^。；\n]{0,14}反應|反應[^。；\n]{0,10}(?:被浪費|無法使用)|(?:不(?:會)?引發|不能發動|無法發動|針對你的|以你為目標的)[^。；\n]{0,12}[藉借]機攻擊|[藉借]機攻擊[^。；\n]{0,12}(?:具有|承受)[^。；\n]{0,6}(?:優勢|劣勢)/u;
    const sourceLabel = FEATURE_SOURCE_LABELS[source] || "角色";
    const entriesByLabel = new Map();
    const seen = new Set();

    function addEntry(label, description, requiredLevel) {
      const fingerprint = `${label}|${description}`.replace(/\s+/g, " ");
      if (seen.has(fingerprint)) return;
      seen.add(fingerprint);
      const existing = entriesByLabel.get(label);
      if (existing) {
        existing.description = `${existing.description}\n\n${description}`;
      } else {
        const entry = {
          key: `dynamic-${mode}-${source}-${stableKeyHash(`${source}|${label}`)}`,
          label,
          source: sourceLabel,
          description,
          dynamic: true
        };
        if (requiredLevel) entry.requiredLevel = requiredLevel;
        entriesByLabel.set(label, entry);
      }
    }

    let remainingRaw = String(raw ?? "");
    if (remainingRaw.includes("data-action-description")) {
      const holder = document.createElement("div");
      holder.innerHTML = remainingRaw;
      holder.querySelectorAll("[data-action-description]").forEach(block => {
        const description = sourceToPlainText(block.innerHTML).replace(/\n{2,}/g, "\n");
        if (!timingPattern.test(description) || passiveOrUnavailablePattern.test(description)) return;
        const featureSection = block.closest("section[data-feature-level]");
        const heading = featureSection?.querySelector("h3")?.textContent || "";
        const label = cleanFeatureTitle(heading, `${sourceLabel}能力`);
        addEntry(label, description, Number(featureSection?.dataset.featureLevel) || undefined);
        block.remove();
      });
      remainingRaw = holder.innerHTML;
    }

    const plainText = sourceToPlainText(remainingRaw);
    if (!plainText) return Array.from(entriesByLabel.values()).map(applySpecialFeatureRule);
    const lines = plainText.split("\n");

    lines.forEach((line, index) => {
      if (!timingPattern.test(line) || passiveOrUnavailablePattern.test(line)) return;
      const description = relevantParagraph(lines, index);
      const label = findFeatureTitle(lines, index, sourceLabel);
      addEntry(label, description);
    });

    return Array.from(entriesByLabel.values()).map(applySpecialFeatureRule);
  }

  function getSelectedFeatEntries(mode) {
    if (typeof featsDesc === "undefined") return [];
    const values = new Set(Array.from(document.querySelectorAll("#feats-area select"), select => select.value).filter(Boolean));
    return Array.from(values)
      .flatMap(value => extractTimedFeatureEntries(featsDesc[value], mode, "feat"))
      .filter(entry => getCharacterLevel() >= getRequiredLevel(entry));
  }

  function filterRaceEntriesForSelections(entries, selectedRace, selectedGoliathAncestry) {
    const selectedFeature = GOLIATH_ANCESTRY_FEATURES[selectedGoliathAncestry];
    const selectedGnomeLineage = document.getElementById("gnome-lineage")?.value || "";
    return entries.filter(entry => {
      if (selectedRace === "goliath" && GOLIATH_ANCESTRY_FEATURE_NAMES.has(entry.label) && entry.label !== selectedFeature) return false;
      if (entry.gnomeLineage && entry.gnomeLineage !== selectedGnomeLineage) return false;
      return getCharacterLevel() >= getRequiredLevel(entry);
    });
  }

  function getFeatureEntries(mode) {
    let classText = document.getElementById("classFeatures")?.innerHTML || "";
    const invocationOptionsIndex = classText.lastIndexOf("魔能祈喚選項");
    if (invocationOptionsIndex !== -1) {
      classText = classText.slice(0, invocationOptionsIndex);
    }
    const raceText = document.getElementById("raceFeatures")?.innerHTML || "";
    const raceEntries = extractTimedFeatureEntries(raceText, mode, "race");
    const selectedRace = document.getElementById("race")?.value || "";
    const selectedGoliathAncestry = document.getElementById("goliath-ancestry")?.value || "";
    const availableRaceEntries = filterRaceEntriesForSelections(raceEntries, selectedRace, selectedGoliathAncestry);
    const selectedClass = document.getElementById("class")?.value || "";
    const classEntries = extractTimedFeatureEntries(classText, mode, "class")
      .filter(entry => getCharacterLevel() >= getRequiredLevel(entry))
      .filter(entry => selectedClass !== "monk" || !MONK_REMOVED_LABELS.has(entry.label));
    return [
      ...classEntries,
      ...availableRaceEntries,
      ...getSelectedFeatEntries(mode)
    ];
  }

  function getSelectedSpellEntries(mode) {
    if (typeof SpellCatalog === "undefined") return [];
    const timingPattern = mode === "bonus"
      ? /施法時間\s*[：:]\s*附贈動作/u
      : /施法時間\s*[：:]\s*反應動作/u;
    const spellIds = new Set(Array.from(document.querySelectorAll('#tab-spells select[id*="-spell-"]'), select => select.value).filter(Boolean));

    return Array.from(spellIds).flatMap(spellId => {
      const spell = SpellCatalog.getSpell(spellId);
      if (!spell || !timingPattern.test(spell.desc || "")) return [];
      return [{
        key: `dynamic-${mode}-spell-${spellId}`,
        label: spell.nameZh,
        source: FEATURE_SOURCE_LABELS.spell,
        description: spell.desc,
        dynamic: true
      }];
    });
  }

  function getSelectedInvocationEntries(mode) {
    if (typeof eldritchInvocations === "undefined") return [];
    const availableNames = INVOCATION_OPTIONS_BY_MODE[mode];
    if (!availableNames) return [];
    const selectedNames = new Set(Array.from(
      document.querySelectorAll("#eldritch-invocations-output input[data-invocation-name]:checked"),
      input => input.dataset.invocationName
    ).filter(Boolean));

    return eldritchInvocations.flatMap(invocation => {
      if (!selectedNames.has(invocation.name) || !availableNames.has(invocation.name)) return [];
      const invocationText = sourceToPlainText(invocation.text || "");

      return [{
        key: `dynamic-${mode}-invocation-${stableKeyHash(invocation.name)}`,
        label: invocation.name,
        source: FEATURE_SOURCE_LABELS.invocation,
        description: invocationText,
        dynamic: true
      }];
    });
  }

  function getSelectedMetamagicEntries(mode) {
    if (mode !== "bonus") return [];

    return Array.from(
      document.querySelectorAll("#metamagicOptions input[data-metamagic-name]:checked")
    ).flatMap(input => {
      const card = input.closest(".feature-choice-card--metamagic");
      const description = sourceToPlainText(card?.innerHTML || "");
      if (!description || !/附贈動作/u.test(description)) return [];

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

  function getDynamicOptions(mode) {
    if (mode !== "action" && mode !== "bonus" && mode !== "reaction") return [];
    const entries = [
      ...(mode === "action" ? getMonkCustomEntries(mode) : [...getFeatureEntries(mode), ...getMonkCustomEntries(mode)]),
      ...getSelectedInvocationEntries(mode),
      ...getSelectedMetamagicEntries(mode),
      ...(mode === "action" ? [] : getSelectedSpellEntries(mode))
    ];
    const seen = new Set();
    return entries.filter(entry => {
      const fingerprint = `${entry.source}|${entry.label}|${entry.description}`.replace(/\s+/g, " ");
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
    const title = document.createElement("strong");
    title.textContent = option.label;
    heading.appendChild(title);
    if (option.source) {
      const source = document.createElement("span");
      source.textContent = option.source;
      heading.appendChild(source);
    }

    const copy = document.createElement("div");
    copy.className = "action-description-copy";
    copy.textContent = option.description;
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

  function getModeOptions(mode) {
    if (!STATIC_OPTIONS[mode]) return [];
    return [...STATIC_OPTIONS[mode], ...getDynamicOptions(mode)];
  }

  function getPublicModeOptions(mode) {
    return Object.freeze(
      getModeOptions(mode).map(option => Object.freeze({ ...option }))
    );
  }

  function getPublicModeMeta(mode) {
    return MODE_META[mode]
      ? Object.freeze({ ...MODE_META[mode] })
      : null;
  }

  function renderMode(mode, preserveSelection = false) {
    if (!MODE_META[mode]) return;
    currentMode = mode;
    if (!preserveSelection) selectedOptionKey = "";
    const meta = MODE_META[mode];
    const options = getModeOptions(mode);
    const dynamicCount = options.filter(option => option.dynamic).length;

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
    panelElements.count.textContent = dynamicCount
      ? `${STATIC_OPTIONS[mode].length} 項基本・${dynamicCount} 項角色能力`
      : `${options.length} 項`;

    panelElements.grid.replaceChildren(...options.map(createOptionButton));
    const selected = options.find(option => option.key === selectedOptionKey);
    if (!selected) selectedOptionKey = "";
    renderDescription(selected || null);

    globalScope.dispatchEvent?.(new CustomEvent("actionpanelchange", {
      detail: { mode }
    }));
  }

  function scheduleDynamicRefresh() {
    if (scheduledRefresh) cancelAnimationFrame(scheduledRefresh);
    scheduledRefresh = requestAnimationFrame(() => {
      scheduledRefresh = 0;
      if (currentMode === "action" || currentMode === "bonus" || currentMode === "reaction") renderMode(currentMode, true);
    });
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
    ["classFeatures", "raceFeatures", "feats-area", "tab-spells"].forEach(id => {
      const target = document.getElementById(id);
      if (target) observer.observe(target, { childList: true, subtree: true, characterData: true });
    });
    document.addEventListener("change", scheduleDynamicRefresh);
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
      count: document.getElementById("action-option-count"),
      tabs: Array.from(document.querySelectorAll(".action-mode-tab"))
    };
    panelElements.tabs.forEach(tab => {
      tab.addEventListener("click", () => renderMode(tab.dataset.actionMode));
      tab.addEventListener("keydown", bindTabKeyboardNavigation);
    });
    observeDynamicSources();
    renderMode("action");
  }

  globalScope.ActionPanel = Object.freeze({
    getModes() {
      return Object.freeze(Object.keys(MODE_META));
    },
    getModeMeta: getPublicModeMeta,
    getOptions: getPublicModeOptions,
    getSourceLabels() {
      return Object.freeze({ ...FEATURE_SOURCE_LABELS });
    },
    getButtonLabel,
    requestRefresh: scheduleDynamicRefresh
  });

  document.addEventListener("DOMContentLoaded", initializeActionPanel);
})(typeof window !== "undefined" ? window : globalThis);

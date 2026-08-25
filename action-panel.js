(function () {
  "use strict";

  const STATIC_OPTIONS = Object.freeze({
    action: Object.freeze([
      { key: "attack", label: "攻擊", description: "拾取或拔出一把武器進行攻擊。" },
      { key: "unarmed", label: "徒手", description: "對 5 呎內的目標拳打、踢擊或以其他方式徒手攻擊。命中加值為力量調整值加熟練加值；命中時造成 1 加力量調整值的鈍擊傷害。" },
      { key: "grapple", label: "擒抱", description: "以空手抓住 5 呎內、且體型不超過你一級的目標。目標進行力量或敏捷豁免（DC = 8 + 力量調整值 + 熟練加值）；失敗時陷入擒抱狀態。" },
      { key: "shove", label: "推撞", description: "推動 5 呎內、且體型不超過你一級的目標。目標進行力量或敏捷豁免（DC = 8 + 力量調整值 + 熟練加值）；失敗時由你將其推開 5 呎或擊倒。" },
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
        description: "當你攀爬時，每移動 1 呎需要多花 1 呎移動力；在困難地形中則多花 2 呎。\n\n若你具有攀爬速度，且以它進行攀爬，則可忽略這項額外消耗。\n\n由 DM 決定，攀爬濕滑表面或可抓握處很少的表面時，可能需要通過一次 DC 15 的力量（運動）檢定。"
      },
      {
        key: "crawling",
        label: "匍匐",
        description: "當你匍匐時，每移動 1 呎需要多花 1 呎移動力；在困難地形中則多花 2 呎。\n\n另見「速度」。"
      },
      {
        key: "flying",
        label: "飛行",
        description: "各種效果都可能讓生物飛行。\n\n當你飛行時，如果你處於失能或倒地狀態，或你的飛行速度降為 0，你就會墜落。\n\n若你具有滯空能力，則即使處於上述情況仍可留在空中。\n\n另見「墜落」與「飛行速度」。"
      },
      {
        key: "long-jump",
        label: "跳遠",
        description: "進行跳遠時，若你在起跳前立刻以步行移動至少 10 呎，則可水平跳躍最遠等同於你力量值的距離（單位：呎）。\n\n若是立定跳遠，你只能跳出上述距離的一半。\n\n無論哪種方式，你跳躍的每 1 呎都要消耗 1 呎移動力。\n\n若你落在困難地形上，必須通過一次 DC 10 的敏捷（體操）檢定，否則陷入倒地狀態。\n\n這條跳遠規則假設跳躍高度不重要，例如跨越溪流或裂谷。\n\n由 DM 決定，若要越過低矮障礙物，例如樹籬或矮牆，且其高度不超過跳躍距離的四分之一，則你必須通過一次 DC 10 的力量（運動）檢定，否則會撞上該障礙物。"
      },
      {
        key: "high-jump",
        label: "跳高",
        description: "進行跳高時，若你在起跳前立刻以步行移動至少 10 呎，則可向上跳起等同於 3 + 你的力量調整值的高度，最少為 0 呎。\n\n若是立定跳高，你只能跳出上述高度的一半。\n\n無論哪種方式，跳躍的每 1 呎都要消耗 1 呎移動力。\n\n在跳躍過程中，你可以將雙臂伸到自己頭頂上方半個身高的距離。\n\n因此，你能觸及的高度等於跳躍高度加上你身高的 1.5 倍。"
      },
      {
        key: "swimming",
        label: "游泳",
        description: "當你游泳時，每移動 1 呎需要多花 1 呎移動力；在困難地形中則多花 2 呎。\n\n若你具有游泳速度，且以它進行游泳，則可忽略這項額外消耗。\n\n由 DM 決定，在湍急水域中移動任何距離時，可能需要通過一次 DC 15 的力量（運動）檢定。"
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
    invocation: "魔能祈喚"
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

  function extractTimedFeatureEntries(raw, mode, source) {
    const plainText = sourceToPlainText(raw);
    if (!plainText) return [];
    const lines = plainText.split("\n");
    const timingPattern = mode === "bonus"
      ? /(?:附贈動作|(?:使用|用|消耗|以)[^。；\n]{0,6}「?附贈」?)/u
      : /(?:反應(?:動作)?|[藉借]機攻擊)/u;
    const unavailablePattern = mode === "bonus"
      ? /(?:無法|不能)[^。；\n]{0,14}(?:附贈|動作)|附贈動作[^。；\n]{0,10}(?:被浪費|無法使用)/u
      : /(?:無法|不能)[^。；\n]{0,14}反應|反應[^。；\n]{0,10}(?:被浪費|無法使用)|(?:不(?:會)?引發|不能發動|無法發動|針對你的)[^。；\n]{0,12}[藉借]機攻擊/u;
    const sourceLabel = FEATURE_SOURCE_LABELS[source] || "角色";
    const entriesByLabel = new Map();
    const seen = new Set();

    lines.forEach((line, index) => {
      if (!timingPattern.test(line) || unavailablePattern.test(line)) return;
      const description = relevantParagraph(lines, index);
      const label = findFeatureTitle(lines, index, sourceLabel);
      const fingerprint = `${label}|${description}`.replace(/\s+/g, " ");
      if (seen.has(fingerprint)) return;
      seen.add(fingerprint);
      const existing = entriesByLabel.get(label);
      if (existing) {
        existing.description = `${existing.description}\n\n${description}`;
      } else {
        entriesByLabel.set(label, {
          key: `dynamic-${mode}-${source}-${stableKeyHash(`${source}|${label}`)}`,
          label,
          source: sourceLabel,
          description,
          dynamic: true
        });
      }
    });

    return Array.from(entriesByLabel.values());
  }

  function getSelectedFeatEntries(mode) {
    if (typeof featsDesc === "undefined") return [];
    const values = new Set(Array.from(document.querySelectorAll("#feats-area select"), select => select.value).filter(Boolean));
    return Array.from(values).flatMap(value => extractTimedFeatureEntries(featsDesc[value], mode, "feat"));
  }

  function filterRaceEntriesForSelections(entries, selectedRace, selectedGoliathAncestry) {
    if (selectedRace !== "goliath") return entries;
    const selectedFeature = GOLIATH_ANCESTRY_FEATURES[selectedGoliathAncestry];
    return entries.filter(entry => !GOLIATH_ANCESTRY_FEATURE_NAMES.has(entry.label) || entry.label === selectedFeature);
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
    return [
      ...extractTimedFeatureEntries(classText, mode, "class"),
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

  function getDynamicOptions(mode) {
    if (mode !== "action" && mode !== "bonus" && mode !== "reaction") return [];
    const entries = [
      ...(mode === "action" ? [] : getFeatureEntries(mode)),
      ...getSelectedInvocationEntries(mode),
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

  function createOptionButton(option) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "action-option-button";
    button.dataset.actionOptionKey = option.key;
    if (option.dynamic) button.classList.add("is-character-option");

    const label = document.createElement("span");
    label.className = "action-option-label";
    label.textContent = option.label;
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
    return [...STATIC_OPTIONS[mode], ...getDynamicOptions(mode)];
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

  document.addEventListener("DOMContentLoaded", initializeActionPanel);
})();

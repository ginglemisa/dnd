(function attachTabletopActions(globalScope) {
  "use strict";

  const MODE_PREFERENCE_KEY = "dnd.tabletopActionMode.v1";
  const MODES = Object.freeze(["action", "bonus", "reaction", "movement"]);
  const selectedOptionKeys = new Map(MODES.map(mode => [mode, ""]));
  const elements = {};
  let currentMode = "action";
  let scheduledRender = 0;
  let initialized = false;

  function createElement(tagName, className = "", text = "") {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function readField(id) {
    const field = document.getElementById(id);
    return field && "value" in field ? String(field.value || "").trim() : "";
  }

  function getWeaponData(hand) {
    const prefix = hand === "main" ? "atk-main" : "atk-off";
    const mastery = document.getElementById(`${prefix}-mastery`);
    return {
      hand,
      label: hand === "main" ? "主手" : "副手",
      name: readField(`${prefix}-name`),
      hit: readField(`${prefix}-hit`),
      damage: readField(`${prefix}-dmg`),
      note: readField(`${prefix}-note`),
      mastery: mastery && !mastery.hidden ? String(mastery.textContent || "").trim() : ""
    };
  }

  function hasWeaponData(weapon) {
    return Boolean(weapon.name || weapon.hit || weapon.damage || weapon.note || weapon.mastery);
  }

  function parseModifier(value) {
    const normalized = String(value || "").trim().replace(/−/g, "-");
    if (!/^[+-]?\d+$/.test(normalized)) return null;
    const modifier = Number(normalized);
    return Number.isSafeInteger(modifier) ? modifier : null;
  }

  function appendDefinition(list, term, value, rollType = "", label = "", weapon = null) {
    const item = createElement("div", "tabletop-weapon-field");
    const description = createElement("dd");
    const displayValue = value || "—";
    if (rollType) {
      const button = createElement("button", "tabletop-inline-roll", displayValue);
      button.type = "button";
      const modifier = rollType === "hit"
        ? parseModifier(value)
        : rollType === "attack"
          ? parseModifier(weapon?.hit)
          : null;
      const canRoll = rollType === "hit"
        ? modifier !== null
        : rollType === "attack"
          ? Boolean(
              weapon?.name
              && modifier !== null
              && globalScope.DiceRoller?.canRollExpression?.(weapon.damage)
            )
          : Boolean(globalScope.DiceRoller?.canRollExpression?.(value));
      button.disabled = !canRoll || !globalScope.DiceRoller?.isEnabled?.();
      button.setAttribute(
        "aria-label",
        button.disabled ? `${label}${term}；請先開啟擲骰系統` : `擲${label}${term}`
      );
      button.addEventListener("click", () => {
        if (rollType === "attack") {
          const hitExpression = `1d20${modifier < 0 ? "" : "+"}${modifier}`;
          globalScope.DiceRoller?.rollExpressions?.([
            { expression: hitExpression, label: "命中" },
            { expression: weapon.damage, label: "傷害" }
          ]);
          return;
        }
        if (rollType === "hit") {
          globalScope.DiceRoller?.roll?.({
            count: 1,
            sides: 20,
            modifier,
            includeModifier: true,
            label: `${label}${term}`
          });
          return;
        }
        globalScope.DiceRoller?.rollExpression?.(value, { label: `${label}${term}` });
      });
      description.appendChild(button);
    } else {
      description.textContent = displayValue;
    }
    item.append(createElement("dt", "", term), description);
    list.appendChild(item);
  }

  function createWeaponSummary(weapon) {
    const section = createElement("section", "tabletop-weapon-row");
    const heading = createElement("h4", "tabletop-weapon-row__heading", weapon.label);
    if (weapon.mastery) {
      heading.appendChild(createElement("span", "tabletop-source-tag", `精通：${weapon.mastery}`));
    }
    section.appendChild(heading);

    const list = createElement("dl", "tabletop-weapon-fields");
    appendDefinition(
      list,
      "名稱",
      weapon.name || "未裝備",
      "attack",
      `${weapon.label}${weapon.name ? ` ${weapon.name}` : ""}命中與傷害`,
      weapon
    );
    appendDefinition(list, "命中", weapon.hit, "hit", `${weapon.label}${weapon.name ? ` ${weapon.name}` : ""}`);
    appendDefinition(list, "傷害", weapon.damage, "damage", `${weapon.label}${weapon.name ? ` ${weapon.name}` : ""}`);
    appendDefinition(list, "備註", weapon.note);
    section.appendChild(list);
    return section;
  }

  function renderWeapons() {
    if (!elements.weaponSummary) return;
    const weapons = [getWeaponData("main"), getWeaponData("off")];
    if (!weapons.some(hasWeaponData)) {
      const empty = createElement("div", "tabletop-empty-state");
      empty.append(
        createElement("strong", "", "尚未裝備武器"),
        createElement("p", "", "請先在角色卡的裝備頁選擇武器；若已關閉武器攻擊自動化，也可在角色卡動作頁手動填寫攻擊資料。")
      );
      elements.weaponSummary.replaceChildren(empty);
      return;
    }
    elements.weaponSummary.replaceChildren(...weapons.map(createWeaponSummary));
  }

  function createActionDescription(option, prompt) {
    const description = createElement("div", "tabletop-action-description");
    description.setAttribute("role", "status");
    description.setAttribute("aria-live", "polite");
    if (!option) {
      description.appendChild(createElement("p", "tabletop-action-description__prompt", prompt));
      return description;
    }

    const heading = createElement("div", "tabletop-action-description__heading");
    heading.appendChild(createElement("strong", "", option.label));
    if (option.source) heading.appendChild(createElement("span", "tabletop-source-tag", option.source));
    const copy = createElement("div", "tabletop-action-description__copy", option.description);
    description.append(heading, copy);
    return description;
  }

  function renderActionPanel(mode) {
    const panel = elements.panels?.find(candidate => candidate.dataset.tabletopActionPanel === mode);
    const api = globalScope.ActionPanel;
    if (!panel || !api) return;
    const meta = api.getModeMeta(mode);
    const options = api.getOptions(mode);
    if (!meta) return;

    let selectedKey = selectedOptionKeys.get(mode) || "";
    let selected = options.find(option => option.key === selectedKey) || null;
    if (!selected) {
      selectedKey = "";
      selectedOptionKeys.set(mode, "");
    }

    const context = createElement("div", "tabletop-action-context");
    const contextCopy = createElement("div");
    contextCopy.append(
      createElement("strong", "", meta.timing),
      createElement("span", "", meta.summary)
    );
    const dynamicCount = options.filter(option => option.dynamic).length;
    context.append(
      contextCopy,
      createElement("span", "tabletop-action-count", dynamicCount ? `${options.length - dynamicCount} 項基本・${dynamicCount} 項角色能力` : `${options.length} 項`)
    );

    const layout = createElement("div", "tabletop-action-layout");
    const optionList = createElement("div", "tabletop-action-options");
    optionList.setAttribute("aria-label", "可用選項");
    options.forEach(option => {
      const button = createElement("button", "tabletop-action-option");
      button.type = "button";
      button.dataset.actionOptionKey = option.key;
      button.setAttribute("aria-pressed", String(option.key === selectedKey));
      if (option.key === selectedKey) button.classList.add("is-selected");
      if (option.key === "drink-potion" && globalScope.DiceRoller?.isEnabled?.()) {
        button.classList.add("has-quick-roll");
        button.title = "點擊擲 2d4 + 2 恢復生命值";
        button.setAttribute("aria-label", `${option.label}；擲 2d4 + 2 恢復生命值`);
      }
      button.appendChild(createElement("span", "", api.getButtonLabel(option)));
      if (option.source) button.appendChild(createElement("span", "tabletop-source-tag", option.source));
      button.addEventListener("click", () => {
        selectedOptionKeys.set(mode, option.key);
        renderActionPanel(mode);
        if (option.key === "drink-potion" && globalScope.DiceRoller?.isEnabled?.()) {
          globalScope.DiceRoller.rollExpression("2d4+2", { label: "喝藥水恢復生命值" });
        }
      });
      optionList.appendChild(button);
    });
    layout.append(optionList, createActionDescription(selected, meta.prompt));
    panel.replaceChildren(context, layout);
  }

  function renderNotice() {
    if (!elements.notice) return;
    const hasClass = Boolean(document.getElementById("class")?.value);
    const hasLevel = Boolean(document.getElementById("level")?.value);
    elements.notice.hidden = hasClass && hasLevel;
    elements.notice.textContent = "請先在角色卡的數值頁選擇職業與等級；基本動作仍可查閱，角色能力會在完成選擇後加入。";
  }

  function render() {
    if (!initialized) return;
    renderNotice();
    renderWeapons();
    renderActionPanel(currentMode);
  }

  function scheduleRender() {
    if (scheduledRender) cancelAnimationFrame(scheduledRender);
    scheduledRender = requestAnimationFrame(() => {
      scheduledRender = 0;
      render();
    });
  }

  function setMode(mode, { persist = true, focusTab = false } = {}) {
    currentMode = MODES.includes(mode) ? mode : "action";
    elements.tabs?.forEach(tab => {
      const selected = tab.dataset.tabletopActionTab === currentMode;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      tab.classList.toggle("is-active", selected);
      if (selected && focusTab) tab.focus({ preventScroll: true });
    });
    elements.panels?.forEach(panel => {
      panel.hidden = panel.dataset.tabletopActionPanel !== currentMode;
    });
    if (persist) globalScope.dndStorage?.setItem(MODE_PREFERENCE_KEY, currentMode);
    renderActionPanel(currentMode);
  }

  function handleTabKeydown(event) {
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const tabs = elements.tabs || [];
    const index = tabs.indexOf(event.currentTarget);
    let nextIndex = index;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    const nextTab = tabs[nextIndex];
    if (nextTab) setMode(nextTab.dataset.tabletopActionTab, { focusTab: true });
  }

  function init() {
    Object.assign(elements, {
      notice: document.getElementById("tabletop-actions-notice"),
      weaponSummary: document.getElementById("tabletop-weapon-summary"),
      tabs: Array.from(document.querySelectorAll("[data-tabletop-action-tab]")),
      panels: Array.from(document.querySelectorAll("[data-tabletop-action-panel]"))
    });
    if (!elements.weaponSummary || !elements.panels.length || !globalScope.ActionPanel) return;
    initialized = true;

    elements.tabs.forEach(tab => {
      tab.addEventListener("click", () => setMode(tab.dataset.tabletopActionTab));
      tab.addEventListener("keydown", handleTabKeydown);
    });
    document.addEventListener("input", scheduleRender);
    document.addEventListener("change", scheduleRender);
    globalScope.addEventListener("actionpanelchange", scheduleRender);
    globalScope.addEventListener("dicerollmodechange", scheduleRender);
    globalScope.addEventListener("tabletop-panelchange", event => {
      if (event.detail?.panel === "actions") scheduleRender();
    });

    const sourcePanel = document.getElementById("tab-actions");
    if (sourcePanel && globalScope.MutationObserver) {
      new MutationObserver(scheduleRender).observe(sourcePanel, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      });
    }

    setMode(globalScope.dndStorage?.getItem(MODE_PREFERENCE_KEY), {
      persist: false
    });
    render();
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", init);
  }
})(typeof window !== "undefined" ? window : globalThis);

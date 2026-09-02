(function attachTabletopSpells(globalScope) {
  "use strict";

  const LEVEL_LABELS = Object.freeze(["戲法", "一環", "二環", "三環", "四環"]);
  const DICE_TOKEN_PATTERN = /\d+\s*d\s*(?:100|20|12|10|8|6|4)(?:\s*[+-]\s*(?:\d+\s*d\s*(?:100|20|12|10|8|6|4)|\d+))*/gi;
  const elements = {};
  let initialized = false;
  let scheduledRender = 0;

  function createElement(tagName, className = "", text = "") {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function getSelectedSpellEntries() {
    if (!globalScope.SpellCatalog) return [];
    return Array.from(document.querySelectorAll('#tab-spells .spell-entry select[id*="-spell-"]'))
      .flatMap(select => {
        const spellId = select.value || "";
        const spell = globalScope.SpellCatalog.getSpell(spellId);
        if (!spell) return [];
        const row = select.closest(".spell-entry");
        const source = typeof globalScope.getPickedSpellSourceTag === "function"
          ? globalScope.getPickedSpellSourceTag(row)
          : "";
        return [{
          spellId,
          spell,
          spellSelect: select,
          source: source || (row?.dataset.spellSource ? "能力" : "職業"),
          sourceLabel: row?.dataset.sourceLabel || "",
          sourceKey: row?.dataset.sourceKey || ""
        }];
      });
  }

  function isSpellCurrentlySelected(spellId) {
    return getSelectedSpellEntries().some(entry => entry.spellId === spellId);
  }

  function createSpellUseMirrors(entry) {
    const useControls = globalScope.getSpellFreeUseControls?.(entry.spellSelect) || [];
    if (!useControls.length) return null;

    const controls = createElement("span", "tabletop-spell-card__uses");
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-label", `${entry.spell.nameZh}免費施法次數；勾選表示已使用`);
    useControls.forEach(({ canonical, label, title }) => {
      const mirror = document.createElement("input");
      mirror.type = "checkbox";
      mirror.checked = canonical.checked;
      mirror.setAttribute("aria-label", label || `${entry.spell.nameZh}免費施法已使用`);
      mirror.title = title || "免費施法";
      mirror.addEventListener("change", () => {
        globalScope.TabletopResources?.setCanonicalCheckbox?.(canonical, mirror.checked);
      });
      controls.appendChild(mirror);
    });
    return controls;
  }

  function getFieldValue(id) {
    const field = document.getElementById(id);
    return field && "value" in field ? String(field.value || "").trim() : "";
  }

  function getSelectedLabel(id) {
    const select = document.getElementById(id);
    return select instanceof HTMLSelectElement && select.value
      ? select.selectedOptions[0]?.textContent?.trim() || "—"
      : "—";
  }

  function renderCastingSummary() {
    if (!elements.castingSummary) return;
    const rows = [
      ["施法屬性", getSelectedLabel("spellcasting-ability")],
      ["法術豁免 DC", getFieldValue("spell-save-dc") || "—"],
      ["法術命中加值", getFieldValue("spell-attack-bonus") || "—"]
    ].map(([term, value]) => {
      const row = createElement("div", "tabletop-casting-summary__item");
      const name = createElement("dt");
      const number = createElement("dd");
      if (term === "法術命中加值") {
  const modifier = parseModifier(value);

  name.textContent = term;

  const button = createElement("button", "tabletop-inline-roll", value);
  button.type = "button";
  button.disabled = modifier === null || !globalScope.DiceRoller?.isEnabled?.();
  button.setAttribute(
    "aria-label",
    button.disabled ? `${term}；請先開啟擲骰系統` : `擲${term}`
  );
  button.addEventListener("click", () => {
    globalScope.DiceRoller?.roll?.({
      count: 1,
      sides: 20,
      modifier,
      includeModifier: true,
      label: term
    });
  });

  number.appendChild(button);
} else {
        name.textContent = term;
        number.textContent = value;
      }
      row.append(name, number);
      return row;
    });
    elements.castingSummary.replaceChildren(...rows);
  }

  function renderSpellSlots() {
    const slotCount = globalScope.TabletopResources?.renderSpellSlots(elements.spellSlots) || 0;
    if (elements.spellSlotsSection) elements.spellSlotsSection.hidden = slotCount === 0;
  }

  function renderSelectedSpells(entries) {
    if (!elements.selectedSpells) return;
    const groups = LEVEL_LABELS.flatMap((label, level) => {
      const spells = entries.filter(entry => entry.spell.level === level);
      if (!spells.length) return [];
      const section = createElement("section", "tabletop-spell-level");
      section.appendChild(createElement("h4", "", label));
      const list = createElement("div", "tabletop-spell-list");
      spells.forEach(entry => {
        const card = createElement("div", "tabletop-spell-card");
        const button = createElement("button", "tabletop-spell-button");
        button.type = "button";
        button.dataset.spellId = entry.spellId;
        button.setAttribute("aria-haspopup", "dialog");
        const names = createElement("span", "tabletop-spell-button__names");
        names.append(
          createElement("strong", "", entry.spell.nameZh),
          createElement("span", "", entry.spell.nameEn)
        );
        button.append(names, createElement("span", "tabletop-source-tag", entry.source));
        button.addEventListener("click", () => showSpellDetail(entry.spellId, button));
        card.appendChild(button);
        const useMirrors = createSpellUseMirrors(entry);
        if (useMirrors) card.appendChild(useMirrors);
        list.appendChild(card);
      });
      section.appendChild(list);
      return [section];
    });
    elements.selectedSpells.replaceChildren(...groups);
  }

  function createSpellDetailContent(spell) {
    const content = createElement("div", "tabletop-spell-detail");
    content.appendChild(createElement("p", "tabletop-spell-detail__english", spell.nameEn));
    const copy = createElement("div", "tabletop-spell-detail__copy");
    const description = String(spell.desc || "");
    let cursor = 0;
    for (const match of description.matchAll(DICE_TOKEN_PATTERN)) {
      const expression = match[0].replace(/\s+/g, "").toLowerCase();
      copy.appendChild(document.createTextNode(description.slice(cursor, match.index)));
      const button = createElement("button", "tabletop-dice-expression", expression);
      button.type = "button";
      button.disabled = !globalScope.DiceRoller?.isEnabled?.();
      button.setAttribute(
        "aria-label",
        button.disabled ? `${expression}；請先開啟擲骰系統` : `擲 ${expression}`
      );
      button.addEventListener("click", () => {
        globalScope.DiceRoller?.rollExpression?.(expression, {
          label: `${spell.nameZh} ${expression}`
        });
      });
      copy.appendChild(button);
      cursor = match.index + match[0].length;
    }
    copy.appendChild(document.createTextNode(description.slice(cursor)));
    content.appendChild(copy);
    return content;
  }

  function parseModifier(value) {
    const normalized = String(value || "").trim().replace(/−/g, "-");
    if (!/^[+-]?\d+$/.test(normalized)) return null;
    const modifier = Number(normalized);
    return Number.isSafeInteger(modifier) ? modifier : null;
  }

  function rollConcentrationSave(spellName) {
    const modifier = parseModifier(getFieldValue("save-con"));
    if (modifier === null) return null;
    return globalScope.DiceRoller?.roll?.({
      count: 1,
      sides: 20,
      modifier,
      includeModifier: true,
      label: `${spellName}專注體質豁免`
    });
  }

  function getConcentrationName(spellId) {
    const spell = globalScope.SpellCatalog?.getSpell(spellId);
    return spell?.nameZh || `未知法術（${spellId}）`;
  }

  function restoreStableFocus(spellId = "", preferredTarget = null) {
    globalScope.requestAnimationFrame(() => {
      if (
        preferredTarget instanceof HTMLElement
        && preferredTarget.isConnected
        && !preferredTarget.closest("[inert]")
      ) {
        preferredTarget.focus({ preventScroll: true });
        return;
      }
      const inSpellPanel = globalScope.TabletopMode?.getPanel?.() === "spells";
      const spellButton = inSpellPanel
        ? Array.from(document.querySelectorAll(".tabletop-spell-button[data-spell-id]"))
          .find(button => button.dataset.spellId === spellId)
        : null;
      const target = spellButton || document.getElementById(
        inSpellPanel ? "tabletop-tab-spells" : "tabletop-tab-overview"
      );
      target?.focus({ preventScroll: true });
    });
  }

  async function beginConcentration(spellId, trigger) {
    const spell = globalScope.SpellCatalog?.getSpell(spellId);
    if (!spell || !globalScope.SpellCatalog.isConcentration(spell)) return false;
    const currentId = globalScope.TabletopMode?.getConcentrationSpellId?.() || "";
    if (!currentId) {
      globalScope.TabletopMode?.setConcentrationSpellId(spellId, `開始專注於${spell.nameZh}。`);
      globalScope.AppDialog?.notify(`開始專注：${spell.nameZh}。`, { tone: "success" });
      restoreStableFocus(spellId, trigger);
      return true;
    }
    if (currentId === spellId) return true;

    const confirmed = await globalScope.AppDialog?.requestDecision({
      title: "替換專注法術",
      message: `目前專注：${getConcentrationName(currentId)}\n即將開始：${spell.nameZh}\n\n原專注會結束，並保留提醒供你確認；不會消耗法術位。`,
      cancelLabel: "取消",
      confirmLabel: "替換專注",
      dismissOnBackdrop: false,
      trigger
    });
    if (!confirmed) return false;
    globalScope.TabletopMode?.setConcentrationSpellId(spellId, `已將專注替換為${spell.nameZh}。`);
    globalScope.AppDialog?.notify(`已替換專注：${spell.nameZh}。`, { tone: "success" });
    restoreStableFocus(spellId, trigger);
    return true;
  }

  async function showSpellDetail(spellId, trigger) {
    const spell = globalScope.SpellCatalog?.getSpell(spellId);
    if (!spell || !globalScope.AppDialog) return;
    const isConcentration = globalScope.SpellCatalog.isConcentration(spell);
    const currentId = globalScope.TabletopMode?.getConcentrationSpellId?.() || "";
    const actions = [{ label: "關閉", value: "close" }];
    if (isConcentration) {
      actions.push({
        label: currentId === spellId ? "停止專注" : "開始專注",
        value: "concentration",
        intent: currentId === spellId ? "secondary" : "primary"
      });
    }

    const result = await globalScope.AppDialog.showContent({
      title: spell.nameZh,
      content: createSpellDetailContent(spell),
      actions,
      trigger
    });
    if (result !== "concentration") return;
    if (currentId === spellId) {
      globalScope.TabletopMode?.stopConcentration(`已停止專注於${spell.nameZh}。`);
      globalScope.AppDialog.notify(`已停止專注：${spell.nameZh}。`, { tone: "info" });
      restoreStableFocus(spellId, trigger);
      return;
    }
    await beginConcentration(spellId, trigger);
  }

  function getActiveConcentrationNote(spellId, spell) {
    if (!spell) {
      return `匯入的 spellId「${spellId}」不在目前法術目錄中；記錄未被清除，可手動停止專注。`;
    }
    if (!globalScope.SpellCatalog.isConcentration(spell)) {
      return "這筆匯入記錄的來源法術不是專注法術；記錄未被清除，可手動停止專注。";
    }
    if (!isSpellCurrentlySelected(spellId)) {
      return "來源法術已移除；專注記錄會保留，直到你手動停止。";
    }
    return "";
  }

  function createConcentrationCard(record, viewName, index) {
    const ended = record.status === "ended";
    const spell = globalScope.SpellCatalog?.getSpell(record.spellId);
    const replacementSpell = ended
      ? globalScope.SpellCatalog?.getSpell(record.replacementSpellId)
      : null;
    const card = createElement(
      "section",
      `tabletop-concentration${ended ? " tabletop-concentration--ended" : ""}`
    );
    const titleKey = String(record.noticeId || record.spellId || index)
      .replace(/[^A-Za-z0-9_-]/g, "-")
      .slice(0, 80);
    const titleId = `tabletop-concentration-${viewName}-${titleKey}-${index}`;
    card.setAttribute("aria-labelledby", titleId);

    const copy = createElement("div");
    copy.appendChild(createElement("span", "tabletop-eyebrow", ended ? "專注已結束" : "目前專注"));

    const detail = createElement("button", "tabletop-concentration__detail");
    detail.type = "button";
    detail.disabled = !spell;
    detail.dataset.concentrationAction = ended ? "ended-detail" : "active-detail";
    detail.dataset.spellId = record.spellId;
    const title = createElement(
      "span",
      "",
      spell
        ? `${ended ? "已結束" : "專注"}：${spell.nameZh}`
        : `${ended ? "已結束" : "專注"}：來源法術不存在`
    );
    title.id = titleId;
    detail.appendChild(title);

    const diceEnabled = !ended && Boolean(globalScope.DiceRoller?.isEnabled?.());
    if (!diceEnabled) detail.setAttribute("aria-haspopup", "dialog");
    detail.setAttribute(
      "aria-label",
      diceEnabled && spell
        ? `擲${spell.nameZh}專注體質豁免`
        : `查看${spell?.nameZh || "專注法術"}說明`
    );
    copy.appendChild(detail);

    const note = ended
      ? replacementSpell
        ? `因開始專注於「${replacementSpell.nameZh}」而結束。`
        : "因開始另一個專注法術而結束。"
      : getActiveConcentrationNote(record.spellId, spell);
    if (note) copy.appendChild(createElement("p", "", note));

    const action = createElement(
      "button",
      "tabletop-concentration__stop",
      ended ? "關閉" : "停止專注"
    );
    action.type = "button";
    action.dataset.concentrationAction = ended ? "dismiss" : "stop";
    if (record.noticeId) action.dataset.noticeId = record.noticeId;
    action.setAttribute(
      "aria-label",
      ended
        ? `關閉${spell?.nameZh || "這筆"}專注結束提醒`
        : `停止專注於${spell?.nameZh || "目前法術"}`
    );

    card.append(copy, action);
    return card;
  }

  function renderConcentrationSummaries() {
    const views = [elements.concentrationOverview, elements.concentrationSpells].filter(Boolean);
    if (!views.length) return;

    const spellId = globalScope.TabletopMode?.getConcentrationSpellId?.() || "";
    const ended = globalScope.TabletopMode?.getEndedConcentrations?.() || [];
    const records = [
      ...(spellId ? [{ status: "active", spellId }] : []),
      ...ended.slice().reverse().map(entry => ({
        status: "ended",
        noticeId: entry.id,
        spellId: entry.spellId,
        replacementSpellId: entry.replacementSpellId
      }))
    ];

    views.forEach(view => {
      view.hidden = records.length === 0;
      view.replaceChildren(...records.map((record, index) => (
        createConcentrationCard(record, view.dataset.concentrationView || "view", index)
      )));
    });
  }

  function renderEmptyState(message) {
    const empty = createElement("div");
    empty.appendChild(createElement("strong", "", message.title));
    empty.appendChild(createElement("p", "", message.body));
    elements.empty.replaceChildren(empty);
  }

  function getEmptyMessage(entries) {
    const hasClass = Boolean(document.getElementById("class")?.value);
    const hasLevel = Boolean(document.getElementById("level")?.value);
    if (!hasClass || !hasLevel) return {
      title: "尚未完成角色基礎選擇",
      body: "請先在角色卡的數值頁選擇職業與等級，再到法術頁完成法術選擇。"
    };
    const canCast = typeof globalScope.hasSpellcastingCapability === "function"
      ? globalScope.hasSpellcastingCapability()
      : true;
    if (!canCast) return {
      title: "目前角色沒有施法來源",
      body: "可在角色卡調整職業、種族、背景或專長；桌邊模式不會自行建立法術能力。"
    };
    if (!entries.length) return {
      title: "尚未選擇法術",
      body: "請到角色卡的法術頁新增或完成法術選擇；只有實際選取與能力衍生的法術會顯示在這裡。"
    };
    return null;
  }

  function render() {
    if (!initialized) return;
    const entries = getSelectedSpellEntries();
    const emptyMessage = getEmptyMessage(entries);
    elements.empty.hidden = !emptyMessage;
    elements.content.hidden = false;
    if (emptyMessage) renderEmptyState(emptyMessage);
    renderCastingSummary();
    renderSpellSlots();
    renderSelectedSpells(entries);
    renderConcentrationSummaries();
  }

  function scheduleRender() {
    if (scheduledRender) cancelAnimationFrame(scheduledRender);
    scheduledRender = requestAnimationFrame(() => {
      scheduledRender = 0;
      render();
    });
  }

  function handleConcentrationAction(event) {
    const button = event.target.closest("button[data-concentration-action]");
    if (!button || !event.currentTarget.contains(button)) return;
    const action = button.dataset.concentrationAction;
    const spellId = button.dataset.spellId || "";

    if (action === "active-detail") {
      if (globalScope.DiceRoller?.isEnabled?.()) {
        const spellName = getConcentrationName(spellId);
        if (rollConcentrationSave(spellName)) return;
      }
      if (spellId) showSpellDetail(spellId, button);
      return;
    }

    if (action === "ended-detail") {
      if (spellId) showSpellDetail(spellId, button);
      return;
    }

    if (action === "stop") {
      const currentId = globalScope.TabletopMode?.getConcentrationSpellId?.() || "";
      if (!currentId) return;
      const name = getConcentrationName(currentId);
      globalScope.TabletopMode.stopConcentration(`已停止專注於${name}。`);
      globalScope.AppDialog?.notify(`已停止專注：${name}。`, { tone: "info" });
      restoreStableFocus();
      return;
    }

    if (action !== "dismiss") return;
    const noticeId = button.dataset.noticeId || "";
    const notice = globalScope.TabletopMode?.getEndedConcentrations?.()
      .find(entry => entry.id === noticeId);
    if (!notice) return;
    const name = getConcentrationName(notice.spellId);
    if (!globalScope.TabletopMode.dismissEndedConcentration(
      noticeId,
      `已關閉${name}的專注結束提醒。`
    )) return;
    globalScope.AppDialog?.notify(`已關閉專注提醒：${name}。`, { tone: "info" });
    restoreStableFocus();
  }

  function init() {
    Object.assign(elements, {
      empty: document.getElementById("tabletop-spells-empty"),
      content: document.getElementById("tabletop-spells-content"),
      castingSummary: document.getElementById("tabletop-casting-summary"),
      spellSlotsSection: document.getElementById("tabletop-spell-slots-section"),
      spellSlots: document.getElementById("tabletop-spell-slots"),
      selectedSpells: document.getElementById("tabletop-selected-spells"),
      concentrationOverview: document.getElementById("tabletop-concentration-overview"),
      concentrationSpells: document.getElementById("tabletop-concentration-spells")
    });
    if (
      !elements.empty
      || (!elements.concentrationOverview && !elements.concentrationSpells)
      || !globalScope.TabletopMode
      || !globalScope.SpellCatalog
    ) return;
    initialized = true;

    [
      [elements.concentrationOverview, "overview"],
      [elements.concentrationSpells, "spells"]
    ].forEach(([view, name]) => {
      if (!view) return;
      view.dataset.concentrationView = name;
      view.addEventListener("click", handleConcentrationAction);
    });
    document.addEventListener("input", scheduleRender);
    document.addEventListener("change", scheduleRender);
    globalScope.addEventListener("tabletopstatechange", scheduleRender);
    globalScope.addEventListener("dicerollmodechange", scheduleRender);
    globalScope.addEventListener("tabletop-panelchange", event => {
      if (event.detail?.panel === "overview" || event.detail?.panel === "spells") scheduleRender();
    });

    const spellPanel = document.getElementById("tab-spells");
    if (spellPanel && globalScope.MutationObserver) {
      new MutationObserver(scheduleRender).observe(spellPanel, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      });
    }
    render();
  }

  globalScope.TabletopSpells = Object.freeze({
    getSelectedSpellEntries,
    isSpellCurrentlySelected,
    showSpellDetail,
    refresh: scheduleRender
  });

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", init);
  }
})(typeof window !== "undefined" ? window : globalThis);

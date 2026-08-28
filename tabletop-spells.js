(function attachTabletopSpells(globalScope) {
  "use strict";

  const LEVEL_LABELS = Object.freeze(["戲法", "一環", "二環", "三環", "四環"]);
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
          source: source || (row?.dataset.spellSource ? "能力" : "職業"),
          sourceLabel: row?.dataset.sourceLabel || "",
          sourceKey: row?.dataset.sourceKey || ""
        }];
      });
  }

  function isSpellCurrentlySelected(spellId) {
    return getSelectedSpellEntries().some(entry => entry.spellId === spellId);
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
      row.append(createElement("dt", "", term), createElement("dd", "", value));
      return row;
    });
    elements.castingSummary.replaceChildren(...rows);
  }

  function renderSpellSlotsAndUses() {
    const slotCount = globalScope.TabletopResources?.renderSpellSlots(elements.spellSlots) || 0;
    const useCount = globalScope.TabletopResources?.renderSpellUsage(elements.spellUses) || 0;
    if (elements.spellSlotsSection) elements.spellSlotsSection.hidden = slotCount === 0;
    if (elements.spellUsesSection) elements.spellUsesSection.hidden = useCount === 0;
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
        list.appendChild(button);
      });
      section.appendChild(list);
      return [section];
    });
    elements.selectedSpells.replaceChildren(...groups);
  }

  function createSpellDetailContent(spell) {
    const content = createElement("div", "tabletop-spell-detail");
    content.appendChild(createElement("p", "tabletop-spell-detail__english", spell.nameEn));
    content.appendChild(createElement("div", "tabletop-spell-detail__copy", spell.desc));
    return content;
  }

  function getConcentrationName(spellId) {
    const spell = globalScope.SpellCatalog?.getSpell(spellId);
    return spell?.nameZh || `未知法術（${spellId}）`;
  }

  function restoreStableFocus(spellId = "") {
    globalScope.requestAnimationFrame(() => {
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
      restoreStableFocus(spellId);
      return true;
    }
    if (currentId === spellId) return true;

    const confirmed = await globalScope.AppDialog?.requestDecision({
      title: "替換專注法術",
      message: `目前專注：${getConcentrationName(currentId)}\n即將開始：${spell.nameZh}\n\n替換後只會保留新的專注記錄，不會消耗法術位。`,
      cancelLabel: "取消",
      confirmLabel: "替換專注",
      dismissOnBackdrop: false,
      trigger
    });
    if (!confirmed) return false;
    globalScope.TabletopMode?.setConcentrationSpellId(spellId, `已將專注替換為${spell.nameZh}。`);
    globalScope.AppDialog?.notify(`已替換專注：${spell.nameZh}。`, { tone: "success" });
    restoreStableFocus(spellId);
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
      restoreStableFocus(spellId);
      return;
    }
    await beginConcentration(spellId, trigger);
  }

  function renderConcentrationSummary() {
    if (!elements.concentration) return;
    const spellId = globalScope.TabletopMode?.getConcentrationSpellId?.() || "";
    elements.concentration.hidden = !spellId;
    if (!spellId) return;

    const spell = globalScope.SpellCatalog?.getSpell(spellId);
    const selected = spell ? isSpellCurrentlySelected(spellId) : false;
    const isConcentrationSpell = spell
      ? globalScope.SpellCatalog.isConcentration(spell)
      : false;
    elements.concentrationTitle.textContent = spell
      ? `專注：${spell.nameZh}`
      : "專注：來源法術不存在";
    elements.concentrationDetail.disabled = !spell;
    elements.concentrationDetail.dataset.spellId = spellId;
    const note = !spell
      ? `匯入的 spellId「${spellId}」不在目前法術目錄中；記錄未被清除，可手動停止專注。`
      : !isConcentrationSpell
        ? "這筆匯入記錄的來源法術不是專注法術；記錄未被清除，可手動停止專注。"
      : !selected
        ? "來源法術已移除；專注記錄會保留，直到你手動停止。"
        : "";
    elements.concentrationNote.textContent = note;
    elements.concentrationNote.hidden = !note;
  }

  function renderEmptyState(message, concentrationId = "") {
    const empty = createElement("div");
    empty.appendChild(createElement("strong", "", message.title));
    empty.appendChild(createElement("p", "", message.body));
    if (concentrationId) {
      const note = createElement("p", "tabletop-warning-text", `目前仍保存專注記錄：${getConcentrationName(concentrationId)}。`);
      const stop = createElement("button", "tabletop-compact-button", "停止這筆專注");
      stop.type = "button";
      stop.addEventListener("click", () => {
        const name = getConcentrationName(concentrationId);
        globalScope.TabletopMode?.stopConcentration(`已停止專注於${name}。`);
        globalScope.AppDialog?.notify(`已停止專注：${name}。`, { tone: "info" });
        restoreStableFocus();
      });
      empty.append(note, stop);
    }
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
    const concentrationId = globalScope.TabletopMode?.getConcentrationSpellId?.() || "";
    elements.empty.hidden = !emptyMessage;
    elements.content.hidden = Boolean(emptyMessage);
    if (emptyMessage) renderEmptyState(emptyMessage, concentrationId);
    else {
      renderCastingSummary();
      renderSpellSlotsAndUses();
      renderSelectedSpells(entries);
    }
    renderConcentrationSummary();
  }

  function scheduleRender() {
    if (scheduledRender) cancelAnimationFrame(scheduledRender);
    scheduledRender = requestAnimationFrame(() => {
      scheduledRender = 0;
      render();
    });
  }

  function init() {
    Object.assign(elements, {
      empty: document.getElementById("tabletop-spells-empty"),
      content: document.getElementById("tabletop-spells-content"),
      castingSummary: document.getElementById("tabletop-casting-summary"),
      spellSlotsSection: document.getElementById("tabletop-spell-slots-section"),
      spellSlots: document.getElementById("tabletop-spell-slots"),
      spellUsesSection: document.getElementById("tabletop-spell-uses-section"),
      spellUses: document.getElementById("tabletop-spell-uses"),
      selectedSpells: document.getElementById("tabletop-selected-spells"),
      concentration: document.getElementById("tabletop-concentration"),
      concentrationTitle: document.getElementById("tabletop-concentration-title"),
      concentrationNote: document.getElementById("tabletop-concentration-note"),
      concentrationDetail: document.getElementById("tabletop-concentration-detail"),
      concentrationStop: document.getElementById("tabletop-concentration-stop")
    });
    if (!elements.empty || !elements.concentration || !globalScope.TabletopMode || !globalScope.SpellCatalog) return;
    initialized = true;

    elements.concentrationDetail.addEventListener("click", () => {
      const spellId = elements.concentrationDetail.dataset.spellId || "";
      if (spellId) showSpellDetail(spellId, elements.concentrationDetail);
    });
    elements.concentrationStop.addEventListener("click", () => {
      const name = getConcentrationName(globalScope.TabletopMode.getConcentrationSpellId());
      globalScope.TabletopMode.stopConcentration(`已停止專注於${name}。`);
      globalScope.AppDialog?.notify(`已停止專注：${name}。`, { tone: "info" });
      restoreStableFocus();
    });
    document.addEventListener("input", scheduleRender);
    document.addEventListener("change", scheduleRender);
    globalScope.addEventListener("tabletopstatechange", scheduleRender);
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

(function attachSpellbook(globalScope) {
  "use strict";

  let spellIds = [];
  const levels = ["戲法", "一環", "二環", "三環", "四環"];
  const catalog = () => globalScope.SpellCatalog;
  const isWizard = () => document.getElementById("class")?.value === "wizard";
  const isTome = () => document.getElementById("class")?.value === "warlock"
    && globalScope.hasWarlockInvocation?.("書之魔契");
  const wizardSpells = () => catalog().getAllSpells().filter(spell => spell.level > 0
    && catalog().getClassIds(spell.spellId).includes("wizard"));

  function node(tag, className = "", text = "") {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
  }

  function normalize(value) {
    const allowed = new Set(wizardSpells().map(spell => spell.spellId));
    return [...new Set((Array.isArray(value) ? value : []).filter(id => allowed.has(id)))];
  }

  function getState() {
    return { version: 1, spellIds: [...spellIds] };
  }

  function setState(value, options = {}) {
    spellIds = normalize(value?.spellIds);
    if (options.sync !== false) changed();
  }

  function preparedRows(id) {
    return Array.from(document.querySelectorAll('#tab-spells .spell-entry:not([data-spell-source])'))
      .filter(row => row.querySelector('select[id*="-class-"]')?.value === "wizard"
        && (!id || row.querySelector('select[id*="-spell-"]')?.value === id));
  }

  function restoreState(data) {
    // Missing legacy data can seed the book from existing wizard preparation;
    // an explicitly empty new book must stay empty.
    setState(data.__wizardSpellbook || { spellIds: data.class === "wizard"
      ? preparedRows().map(row => row.querySelector('select[id*="-spell-"]')?.value) : [] }, { sync: false });
    render();
  }

  function changed() {
    render();
    globalScope.TabletopSpells?.refresh?.();
    globalScope.scheduleSaveAllFields?.();
  }

  function render() {
    const card = document.getElementById("spellbook-card");
    if (!card) return;
    card.hidden = !isWizard() && !isTome();
    if (card.hidden) return;
    const tome = isTome();
    document.getElementById("spellbook-title").textContent = tome ? "影之書（書之魔契）" : "法術書";
    const selection = globalScope.getPactTomeSpellSelection?.() || {};
    const ids = tome ? [...(selection.cantrips || []), ...(selection.rituals || [])] : spellIds;
    const grid = document.getElementById("spellbook-list");
    grid.replaceChildren();
    levels.forEach((label, level) => {
      const spells = ids.map(id => catalog().getSpell(id)).filter(spell => spell?.level === level);
      if (!spells.length) return;
      const group = node("section", "spellbook-ring output");
      group.appendChild(node("h4", "", label));
      const list = node("div", "spellbook-names");
      spells.forEach(spell => {
        const prepared = tome || preparedRows(spell.spellId).length > 0;
        const button = node("button", `spellbook-spell${prepared ? " is-prepared" : ""}`,
          `[${spell.nameZh}${catalog().isRitual(spell) ? "*" : ""}]`);
        button.type = "button";
        button.dataset.spellId = spell.spellId;
        button.setAttribute("aria-label", `${spell.nameZh}${prepared ? "，已準備" : ""}${catalog().isRitual(spell) ? "，儀式法術" : ""}`);
        button.addEventListener("click", () => openDetail(spell, button));
        list.appendChild(button);
      });
      group.appendChild(list);
      grid.appendChild(group);
    });
    if (!ids.length) grid.appendChild(node("p", "spell-note-muted", "尚無書內法術，請使用「管理法術書」加入。"));
  }

  async function openDetail(spell, trigger) {
    if (isTome()) {
      globalScope.quickBuild.openSpellDetail(spell, trigger, { stateNote: "持有影之書時視為已準備。" });
      return;
    }
    const prepared = preparedRows(spell.spellId).length > 0;
    const confirmed = await globalScope.quickBuild.openSpellPrepareDetail(spell.spellId, trigger, {
      question: prepared ? "取消準備這個法術？法術仍保留在法術書。" : "是否準備這個法術？",
      confirmLabel: prepared ? "取消準備" : "準備法術",
      cancelLabel: "關閉"
    });
    if (!confirmed || !isWizard()) return;
    if (prepared) {
      preparedRows(spell.spellId).forEach(row => {
        const select = row.querySelector('select[id*="-spell-"]');
        select.value = "";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
    } else {
      const level = Number(document.getElementById("level")?.value);
      if (!globalScope.classCanAccessSpellLevel("wizard", level, spell.level)) {
        globalScope.AppDialog.notify("目前法師等級尚未開放此環階。書內法術已保留。");
        return;
      }
      const areaId = `level${spell.level}spells-area`;
      const row = globalScope.findEmptySpellRow(areaId) || globalScope.createSingleSpellRow(areaId, spell.level);
      const classSelect = row.querySelector('select[id*="-class-"]');
      classSelect.value = "wizard";
      classSelect.dispatchEvent(new Event("change", { bubbles: true }));
      const select = row.querySelector('select[id*="-spell-"]');
      select.value = spell.spellId;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    globalScope.updatePickedSpellBoxes();
    globalScope.scheduleStructuralSaveAllFields();
    changed();
    document.querySelector(`#spellbook-list button[data-spell-id="${spell.spellId}"]`)?.focus({ preventScroll: true });
  }

  function getRitualEntries() {
    if (!isWizard()) return [];
    const level = Number(document.getElementById("level")?.value);
    return spellIds.flatMap(id => {
      const spell = catalog().getSpell(id);
      if (!catalog().isRitual(spell) || preparedRows(id).length
        || !globalScope.classCanAccessSpellLevel("wizard", level, spell.level)) return [];
      return [{ spellId: id, spell, spellSource: "wizard-spellbook", spellClass: "wizard",
        source: "書內儀式", sourceLabel: "來源：法術書；未準備，僅可儀式施法，須能閱讀法術書。",
        sourceKey: `wizard-spellbook-${id}`, castMode: "ritual-only", spellUse: "ritual-only",
        ritualAllowed: true, fixedCastLevel: spell.level, freeUseControls: [] }];
    });
  }

  function legacyNoteIds() {
    const text = document.getElementById("spell-notes")?.value || "";
    const line = text.split(/\r?\n/).find(value => /^法術書[（(]一環[）)][:：]/.test(value));
    if (!line) return [];
    const names = line.replace(/^.*?[:：]/, "").split("、").map(value => value.replace(/（儀式）/g, "").trim());
    return wizardSpells().filter(spell => spell.level === 1 && names.includes(spell.nameZh)).map(spell => spell.spellId);
  }

  async function manageWizard(trigger) {
    const selected = new Set(spellIds);
    const body = node("div", "spellbook-manager");
    const toolbar = node("div", "spellbook-toolbar");
    const search = node("input");
    search.type = "search";
    search.placeholder = "搜尋法術名稱";
    search.setAttribute("aria-label", "搜尋法術名稱");
    const ring = node("select");
    ring.setAttribute("aria-label", "篩選環階");
    [["", "所有環階"], ...levels.slice(1).map((label, i) => [String(i + 1), label])].forEach(([value, label]) => {
      const option = node("option", "", label);
      option.value = value;
      ring.appendChild(option);
    });
    toolbar.append(search, ring);
    const legacy = legacyNoteIds().filter(id => !selected.has(id));
    if (legacy.length) {
      const importButton = node("button", "", "勾選舊筆記法術");
      importButton.type = "button";
      importButton.addEventListener("click", () => { legacy.forEach(id => selected.add(id)); draw(); });
      toolbar.appendChild(importButton);
    }
    body.append(toolbar, node("p", "spell-note-muted", "勾選書內法術；取消勾選只移出法術書，既有準備列表保持不變。"));
    const list = node("div", "spellbook-options");
    body.appendChild(list);
    function draw() {
      const spells = wizardSpells().filter(spell => (!ring.value || spell.level === Number(ring.value))
        && `${spell.nameZh} ${spell.nameEn}`.toLowerCase().includes(search.value.trim().toLowerCase()));
      list.replaceChildren();
      spells.sort((a, b) => a.level - b.level || a.nameZh.localeCompare(b.nameZh, "zh-Hant")).forEach(spell => {
        const label = node("label", "spellbook-option");
        const input = node("input");
        input.type = "checkbox";
        input.value = spell.spellId;
        input.checked = selected.has(spell.spellId);
        input.addEventListener("change", () => input.checked ? selected.add(spell.spellId) : selected.delete(spell.spellId));
        // School is display-only text from the canonical description.
        const school = spell.desc.match(/^學派[:：]\s*([^\r\n]+)/)?.[1] || "";
        label.append(input, node("small", "", levels[spell.level]), node("span", "", `${spell.nameZh}${catalog().isRitual(spell) ? "*" : ""}`), node("small", "", school));
        list.appendChild(label);
      });
      if (!spells.length) list.appendChild(node("p", "spell-note-muted", "沒有符合條件的法術。"));
    }
    search.addEventListener("input", draw);
    ring.addEventListener("change", draw);
    draw();
    const saved = await globalScope.AppDialog.showContent({ title: "管理法術書", content: body,
      variant: "spellbook", confirmLabel: "儲存", cancelLabel: "取消", trigger });
    if (saved && isWizard()) setState({ spellIds: [...selected] });
  }

  async function openTomeSelection(options = {}) {
    const initial = options.initial || globalScope.getPactTomeSpellSelection();
    const known = new Set(options.knownSpellIds || globalScope.getNonPactTomeSelectedSpellIds());
    const body = node("div", "spellbook-tome-manager");
    const selects = [];
    [0, 0, 0, 1, 1].forEach((level, index) => {
      const label = node("label", "spellbook-tome-field", level ? `一環儀式 ${index - 2}` : `戲法 ${index + 1}`);
      const select = node("select");
      const empty = node("option", "", "請選擇法術");
      empty.value = "";
      select.appendChild(empty);
      catalog().getAllSpells().filter(spell => spell.level === level && catalog().getClassIds(spell.spellId).length
        && (!level || catalog().isRitual(spell))).forEach(spell => {
        const option = node("option", "", catalog().getDisplayName(spell.spellId));
        option.value = spell.spellId;
        select.appendChild(option);
      });
      select.value = (level ? initial.rituals?.[index - 3] : initial.cantrips?.[index]) || "";
      label.appendChild(select);
      body.appendChild(label);
      selects.push(select);
    });
    const sync = () => {
      selects.forEach(select => Array.from(select.options).forEach(option => {
        option.disabled = Boolean(option.value && option.value !== select.value
          && (known.has(option.value) || selects.some(peer => peer !== select && peer.value === option.value)));
      }));
      const confirm = body.closest(".app-dialog")?.querySelector(".app-dialog__button--primary");
      if (confirm) confirm.disabled = selects.some(select => !select.value) || new Set(selects.map(select => select.value)).size !== 5;
    };
    selects.forEach(select => select.addEventListener("change", sync));
    const decision = globalScope.AppDialog.showContent({ title: "管理法術書：影之書", content: body,
      variant: "spellbook", confirmLabel: "儲存", cancelLabel: "取消", trigger: options.trigger });
    sync();
    const saved = await decision;
    return saved ? { cantrips: selects.slice(0, 3).map(select => select.value), rituals: selects.slice(3).map(select => select.value) } : null;
  }

  function init() {
    document.getElementById("spellbook-manage")?.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      if (isTome()) {
        const selection = await openTomeSelection({ trigger: event.currentTarget });
        if (selection && isTome()) { globalScope.setPactTomeSpellSelection(selection); changed(); }
      } else if (isWizard()) await manageWizard(event.currentTarget);
    });
    render();
  }

  globalScope.Spellbook = Object.freeze({ getState, setState, restoreState, render, getRitualEntries, openTomeSelection });
  document.addEventListener("DOMContentLoaded", init);
})(window);

(function attachSpellbook(globalScope) {
  "use strict";

  const books = { wizard: [], manual: [] };
  const levels = ["戲法", "一環", "二環", "三環", "四環"];
  const catalog = () => globalScope.SpellCatalog;
  const isManual = () => globalScope.SpellManagement?.isManual() === true;
  const isWizard = () => document.getElementById("class")?.value === "wizard";
  const isTome = () => !isManual() && document.getElementById("class")?.value === "warlock"
    && globalScope.hasWarlockInvocation?.("書之魔契");
  const wizardSpells = () => catalog().getAllSpells().filter(spell => spell.level > 0
    && spell.level <= 4 && catalog().getClassIds(spell.spellId).includes("wizard"));
  const management = () => globalScope.SpellManagement;
  const playerEntries = () => management()?.getPlayerEntries() || [];
  const activeBookIds = () => isManual() ? books.manual : books.wizard;
  const canManageBook = () => isWizard() || isManual();

  function supportedSpells(minLevel = 0) {
    const classes = new Set();
    for (let level = minLevel; level <= 4; level += 1) {
      (globalScope.getAvailableSpellSourceClasses?.(level === 0 ? "cantrips" : level) || [])
        .forEach(option => classes.add(option.value));
    }
    return catalog().getAllSpells().filter(spell => spell.level >= minLevel && spell.level <= 4
      && catalog().getClassIds(spell.spellId).some(id => classes.has(id)));
  }

  function node(tag, className = "", text = "") {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
  }

  function normalize(value) {
    return [...new Set((Array.isArray(value) ? value : []).filter(id => typeof id === "string" && id.trim()
      && (!catalog().getSpell(id) || (catalog().getSpell(id).level >= 1 && catalog().getSpell(id).level <= 4))))];
  }

  function getState() {
    return { version: 2, spellIds: [...activeBookIds()],
      wizardSpellIds: [...books.wizard], manualSpellIds: [...books.manual] };
  }

  function setState(value, options = {}) {
    if (value?.version >= 2) {
      books.wizard = normalize(value.wizardSpellIds);
      books.manual = normalize(value.manualSpellIds);
    } else {
      books[isManual() ? "manual" : "wizard"] = normalize(value?.spellIds);
    }
    if (options.sync !== false) changed();
  }

  function addWizardSpell(spellId) {
    const spell = catalog()?.getSpell(spellId);
    const ids = activeBookIds();
    if (!isWizard() || !spell || spell.level < 1
      || !catalog().getClassIds(spellId).includes("wizard") || ids.includes(spellId)) return false;
    ids.push(spellId);
    changed();
    return true;
  }

  function preparedEntries(id) {
    return (management()?.getEntries({ availableOnly: true }) || [])
      .filter(entry => (isManual() || entry.spellClass === "wizard") && (!id || entry.spellId === id));
  }

  function restoreState(data) {
    // Missing legacy data can seed the book from existing wizard preparation;
    // an explicitly empty new book must stay empty.
    const saved = data.__wizardSpellbook;
    if (saved?.version >= 2) {
      setState(saved, { sync: false });
    } else {
      // v1 shared a single book across modes. Preserve all legacy entries in
      // both books; subsequent changes are independent and saved as v2.
      const legacy = normalize(saved?.spellIds ?? (data.class === "wizard"
        ? preparedEntries().map(entry => entry.spellId) : []));
      books.wizard = [...legacy];
      books.manual = [...legacy];
    }
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
    card.hidden = !isManual() && !isWizard() && !isTome();
    if (card.hidden) return;
    const tome = isTome();
    document.getElementById("spellbook-title").textContent = tome ? "影之書（書之魔契）" : "法術書";
    const manageButton = document.getElementById("spellbook-manage");
    if (manageButton) {
      manageButton.disabled = !tome && !canManageBook();
      manageButton.title = manageButton.disabled ? "手動管理或法師職業可編輯保留的法術書。" : "";
    }
    const selection = globalScope.getPactTomeSpellSelection?.() || {};
    const ids = tome ? [...(selection.cantrips || []), ...(selection.rituals || [])] : activeBookIds();
    const grid = document.getElementById("spellbook-list");
    grid.replaceChildren();
    levels.forEach((label, level) => {
      const spells = ids.map(id => catalog().getSpell(id)).filter(spell => spell?.level === level);
      if (!spells.length) return;
      const group = node("section", "spellbook-ring output");
      group.appendChild(node("h4", "", label));
      const list = node("div", "spellbook-names");
      spells.forEach(spell => {
        const prepared = tome || preparedEntries(spell.spellId).length > 0;
        const button = node("button", `spellbook-spell${prepared ? " is-prepared" : ""}`,
          `${spell.nameZh}${catalog().isRitual(spell) ? "*" : ""}`);
        button.type = "button";
        button.dataset.spellId = spell.spellId;
        button.setAttribute("aria-label", `${spell.nameZh}${prepared ? "，已準備" : ""}${catalog().isRitual(spell) ? "，儀式法術" : ""}`);
        button.addEventListener("click", () => openDetail(spell, button));
        list.appendChild(button);
      });
      group.appendChild(list);
      grid.appendChild(group);
    });
    const unknown = ids.filter(id => !catalog().getSpell(id));
    if (unknown.length) {
      const group = node("section", "spellbook-ring output");
      group.appendChild(node("h4", "", "保留的法術紀錄"));
      unknown.forEach(id => {
        const button = node("button", "spellbook-spell", `未知法術（${id}）`);
        button.type = "button";
        button.dataset.spellId = id;
        button.addEventListener("click", () => openReadOnly(id, button));
        group.appendChild(button);
      });
      grid.appendChild(group);
    }
    if (!ids.length) grid.appendChild(node("p", "spell-note-muted", "尚無書內法術，請使用「管理法術書」加入。"));
  }

  async function openDetail(spell, trigger) {
    if (isTome()) {
      openReadOnly(spell.spellId, trigger, { stateNote: "持有影之書時視為已準備。" });
      return;
    }
    const api = management();
    if (!api?.canManage() || (!isWizard() && !isManual())) {
      openReadOnly(spell.spellId, trigger, { stateNote: !api?.canManage()
        ? "請先選好職業、等級、背景與種族，才能使用『準備法術』。"
        : "法術書紀錄已保留；可切換手動管理來準備書內法術。" });
      return;
    }
    const manual = isManual();
    const currentClass = document.getElementById("class")?.value;
    const source = manual ? [] : api.getEntries({ availableOnly: true }).filter(entry => entry.spellSource && entry.spellId === spell.spellId);
    if (source.length) {
      openReadOnly(spell.spellId, trigger, { stateNote: `已由${source.map(entry => entry.sourceLabel || entry.spellSource).join("、")}準備。` });
      return;
    }
    const prepared = playerEntries().filter(entry => entry.spellId === spell.spellId && api.isEntryAvailable(entry));
    const confirmed = await globalScope.quickBuild.openSpellPrepareDetail(spell.spellId, trigger, {
      question: prepared.length ? "取消準備這個法術？法術仍保留在法術書。" : "是否準備這個法術？",
      confirmLabel: prepared.length ? "取消準備" : "準備法術", cancelLabel: "關閉"
    });
    if (!confirmed || !api.canManage() || manual !== isManual()
      || currentClass !== document.getElementById("class")?.value || (!isWizard() && !manual)) return;
    if (prepared.length) {
      prepared.forEach(entry => api.removePlayerSpell(entry));
    } else {
      const level = Number(document.getElementById("level")?.value);
      const classes = catalog().getClassIds(spell.spellId);
      if (!manual && !classes.includes("wizard")) {
        globalScope.AppDialog.notify("此法術不在法師法表中；書內紀錄已保留。");
        return;
      }
      if (!manual && !globalScope.classCanAccessSpellLevel("wizard", level, spell.level)) {
        globalScope.AppDialog.notify("目前法師等級尚未開放此環階。書內法術已保留。");
        return;
      }
      const count = playerEntries().filter(entry => Number(entry.level) >= 1 && Number(entry.level) <= 4 && api.isEntryAvailable(entry)).length;
      const limit = api.getLimits().prepared;
      if (!manual && Number.isFinite(limit) && count >= limit) {
        globalScope.AppDialog.notify("已達一至四環共用準備上限；請先取消準備其他法術。");
        return;
      }
      api.addPlayerSpell(spell.spellId, { spellClass: manual
        ? (classes.includes(currentClass) ? currentClass : classes[0] || currentClass) : "wizard" });
    }
    changed();
    Array.from(document.querySelectorAll("#spellbook-list button[data-spell-id]"))
      .find(button => button.dataset.spellId === spell.spellId)?.focus({ preventScroll: true });
  }

  function getRitualEntries() {
    if (!isWizard()) return [];
    const preparedIds = new Set((management()?.getEntries({ availableOnly: true }) || []).map(entry => entry.spellId));
    return activeBookIds().flatMap(id => {
      const spell = catalog().getSpell(id);
      if (!catalog().getClassIds(id).includes("wizard")) return [];
      if (!catalog().isRitual(spell) || preparedIds.has(id)) return [];
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

  function openReadOnly(spellId, trigger, options = {}) {
    const spell = catalog()?.getSpell(spellId);
    const body = node("div", "spell-readonly-detail");
    if (spell) {
      body.appendChild(node("h3", "spell-readonly-name", catalog().getDisplayName(spellId)));
      const description = node("div", "spell-readonly-description");
      if (typeof globalScope.renderSpellDescHtml === "function") description.innerHTML = globalScope.renderSpellDescHtml(spell.desc || "—");
      else description.textContent = spell.desc || "—";
      // A reference is a nested AppDialog so it remains keyboard accessible
      // inside the reader's inert background, rather than using a page popup.
      description.querySelectorAll(".beast-tip").forEach(tip => {
        const button = node("button", "spell-readonly-reference", tip.textContent);
        button.type = "button";
        button.addEventListener("click", event => {
          event.stopPropagation();
          const stats = globalScope.BeastCatalog?.getStatBlock?.(tip.dataset.beast);
          if (!stats || typeof globalScope.renderBeastPopupHtml !== "function") return;
          const content = node("div", "spell-readonly-beast");
          content.innerHTML = globalScope.renderBeastPopupHtml(stats);
          globalScope.AppDialog.showContent({ title: tip.textContent, content, variant: "spell-readonly",
            confirmLabel: "關閉", trigger: button, allowNested: true });
        });
        tip.replaceWith(button);
      });
      body.appendChild(description);
    } else {
      body.appendChild(node("p", "spell-note-muted", `找不到法術資料：${spellId || "未選擇法術"}。原法術編號仍會保留。`));
    }
    if (options.stateNote) body.appendChild(node("p", "spell-note-muted", options.stateNote));
    return globalScope.AppDialog.showContent({ title: "法術詳情", content: body, variant: "spell-readonly",
      confirmLabel: "關閉", trigger, allowNested: true });
  }

  // The book and preparation manager share the same compact picker. No full
  // spell text or per-row spell/class menus are created until a reader opens.
  function createSpellPicker(options) {
    const prepared = options.mode === "prepared";
    const body = node("div", "spellbook-manager");
    const toolbar = node("div", "spellbook-toolbar spell-picker-toolbar");
    const search = node("input");
    search.type = "search";
    search.placeholder = "搜尋法術名稱";
    search.setAttribute("aria-label", "搜尋法術名稱");
    search.dataset.stateTransient = "true";
    const clear = node("button", "spell-picker-clear", "×");
    clear.type = "button";
    clear.hidden = true;
    clear.setAttribute("aria-label", "清除法術搜尋");
    const schoolOf = spell => spell.desc?.match(/^學派\s*[：:]\s*([^\r\n]+)/mu)?.[1].trim() || "";
    const filter = node("select");
    filter.setAttribute("aria-label", prepared ? "篩選環階" : "篩選學派");
    filter.dataset.stateTransient = "true";
    const filters = prepared ? [["", "所有環階"], ...levels.map((label, i) => [String(i), label])]
      : [["", "所有學派"], ...[...new Set(options.getSpells().map(schoolOf).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, "zh-Hant")).map(school => [school, school])];
    filters.forEach(([value, label]) => {
      const option = node("option", "", label);
      option.value = value;
      filter.appendChild(option);
    });
    const selectedOnly = node("button", "spell-picker-selected-toggle", "只看已選");
    selectedOnly.type = "button";
    selectedOnly.dataset.stateTransient = "true";
    selectedOnly.setAttribute("aria-pressed", "false");
    const searchField = node("div", "spell-picker-search-field");
    searchField.append(search, clear);
    toolbar.append(searchField, filter, selectedOnly);
    body.appendChild(toolbar);
    const count = node("p", "spell-picker-count spell-note-muted");
    count.setAttribute("role", "status");
    const ringInputs = [];
    const summary = node("div", "spell-picker-results-summary");
    if (!prepared) {
      const rings = node("div", "spell-picker-levels");
      rings.setAttribute("role", "group");
      rings.setAttribute("aria-label", "篩選環階");
      levels.forEach((_, level) => {
        if (level < options.minLevel) return;
        const label = node("label", "spell-picker-level");
        const input = node("input");
        input.type = "checkbox";
        input.value = String(level);
        input.checked = true;
        input.dataset.stateTransient = "true";
        input.addEventListener("change", () => draw(true));
        label.append(input, node("span", "", `${level}環`));
        const separator = node("span", "", "|");
        separator.setAttribute("aria-hidden", "true");
        rings.append(label, separator);
        ringInputs.push(input);
      });
      summary.appendChild(rings);
    }
    summary.appendChild(count);
    const list = node("div", "spellbook-options");
    const more = node("button", "spell-picker-more", "顯示更多法術");
    more.type = "button";
    body.append(summary, list, more);
    const batchSize = 50;
    let visibleCount = batchSize;
    let composing = false;
    function draw(reset = false) {
      if (reset) { visibleCount = batchSize; list.scrollTop = 0; }
      clear.hidden = !search.value;
      const selectedRings = ringInputs.filter(input => input.checked).map(input => Number(input.value));
      const spells = options.getSpells().filter(spell => (prepared
        ? (!filter.value || spell.level === Number(filter.value))
        : (!filter.value || schoolOf(spell) === filter.value)
          && (selectedRings.includes(spell.level) || (spell.level === -1 && selectedRings.length === ringInputs.length)))
        && (selectedOnly.getAttribute("aria-pressed") !== "true" || options.getState(spell).checked)
        && `${spell.nameZh || spell.spellId} ${spell.nameEn || ""}`.toLowerCase().includes(search.value.trim().toLowerCase()));
      spells.sort((a, b) => a.level - b.level || (a.nameEn || a.spellId).localeCompare(b.nameEn || b.spellId, "en"));
      count.textContent = `${spells.length} 個法術，已顯示 ${Math.min(visibleCount, spells.length)} 個${options.getCountSuffix?.() || ""}`;
      list.replaceChildren();
      spells.slice(0, visibleCount).forEach(spell => {
        const state = options.getState(spell);
        const row = node("div", "spellbook-option spell-picker-option");
        row.classList.toggle("is-unavailable", Boolean(state.unavailable));
        const label = node("label", "spell-picker-check");
        const input = node("input");
        input.type = "checkbox";
        input.value = spell.spellId;
        input.checked = Boolean(state.checked);
        input.disabled = Boolean(state.disabled);
        input.dataset.stateTransient = "true";
        input.setAttribute("aria-label", `選擇${spell.nameZh || spell.spellId}`);
        if (state.note) input.title = state.note;
        input.addEventListener("change", () => {
          options.onToggle(spell, input.checked);
          options.onChange?.();
          draw();
          const checks = Array.from(list.querySelectorAll('input[type="checkbox"]'));
          (checks.find(element => element.value === spell.spellId) || checks.find(element => !element.disabled) || selectedOnly)
            .focus({ preventScroll: true });
        });
        label.appendChild(input);
        const name = node("button", "spell-picker-name");
        name.type = "button";
        name.dataset.spellId = spell.spellId;
        name.append(node("span", "", `${spell.nameZh || `未知法術（${spell.spellId}）`}${catalog().isRitual(spell) ? "*" : ""}`));
        if (spell.nameEn) name.appendChild(node("small", "", spell.nameEn));
        name.setAttribute("aria-label", `閱讀${spell.nameZh || spell.spellId}`);
        name.addEventListener("click", () => openReadOnly(spell.spellId, name));
        row.append(label, node("small", "spell-picker-ring", levels[spell.level] || "未知"), name);
        if (state.note) row.appendChild(node("small", "spell-picker-note", state.note));
        list.appendChild(row);
      });
      if (!spells.length) list.appendChild(node("p", "spell-note-muted", "沒有符合條件的法術。"));
      more.hidden = spells.length <= visibleCount;
    }
    search.addEventListener("compositionstart", () => { composing = true; });
    search.addEventListener("compositionend", () => { composing = false; draw(true); });
    search.addEventListener("input", () => { if (!composing) draw(true); });
    clear.addEventListener("click", () => { search.value = ""; draw(true); search.focus(); });
    filter.addEventListener("change", () => draw(true));
    selectedOnly.addEventListener("click", () => {
      selectedOnly.setAttribute("aria-pressed", String(selectedOnly.getAttribute("aria-pressed") !== "true"));
      draw(true);
    });
    more.addEventListener("click", () => { visibleCount += batchSize; draw(); });
    draw();
    return { body, toolbar, redraw: draw };
  }

  function attachSpellBrowserHeader(body) {
    const header = body.closest(".app-dialog").querySelector(".app-dialog__header");
    header.classList.add("spell-prepared-header");
    const title = header.querySelector("h2");
    const titleGroup = node("div", "spell-prepared-title-group");
    const browseHint = node("p", "spell-prepared-browse-hint spell-note-muted");
    const browse = node("button", "spell-prepared-browse", "全職業法術查詢");
    browse.type = "button";
    browse.setAttribute("aria-haspopup", "dialog");
    browse.title = "查閱法術";
    browse.addEventListener("click", () => globalScope.openSpellBrowser(browse));
    browseHint.appendChild(browse);
    title.before(titleGroup);
    titleGroup.append(title, browseHint);
  }

  async function manageWizard(trigger) {
    if (!canManageBook()) return;
    const manual = isManual();
    const currentClass = document.getElementById("class")?.value;
    const selected = new Set(activeBookIds());
    const picker = createSpellPicker({ minLevel: 1, getSpells: () => [...new Map([...(manual ? supportedSpells(1) : wizardSpells()), ...[...selected]
      .map(id => catalog().getSpell(id) || { spellId: id, level: -1, nameZh: "", nameEn: "" })]
      .map(spell => [spell.spellId, spell])).values()],
      getState: spell => ({ checked: selected.has(spell.spellId),
        note: manual || catalog().getClassIds(spell.spellId).includes("wizard") ? "" : "已保留原有紀錄；目前不在法師法表中。" }),
      onToggle: (spell, checked) => checked ? selected.add(spell.spellId) : selected.delete(spell.spellId) });
    const { body, toolbar } = picker;
    const legacy = legacyNoteIds().filter(id => !selected.has(id));
    if (legacy.length) {
      const importButton = node("button", "spell-picker-import", "勾選舊筆記法術");
      importButton.type = "button";
      importButton.addEventListener("click", () => { legacy.forEach(id => selected.add(id)); picker.redraw(); });
      toolbar.appendChild(importButton);
    }
    toolbar.after(node("p", "spell-note-muted", "勾選=新增法術；取消勾選=移出法術書，不影響準備法術清單。"));
    const decision = globalScope.AppDialog.showContent({ title: "管理法術書", content: body,
      variant: "spellbook", confirmLabel: "儲存", cancelLabel: "取消", trigger, allowNested: true });
    attachSpellBrowserHeader(body);
    const saved = await decision;
    if (saved && manual === isManual() && currentClass === document.getElementById("class")?.value
      && canManageBook()) setState({ spellIds: [...selected] });
  }

  async function openPreparedManager(trigger) {
    const api = management();
    if (!api?.canManage()) {
      globalScope.AppDialog.notify("請先選好職業、等級、背景與種族，才能使用『準備法術』。");
      return false;
    }
    const manual = isManual();
    const currentClass = document.getElementById("class").value;
    const currentLevel = document.getElementById("level").value;
    let draft = playerEntries().map(entry => ({ ...entry }));
    const sources = manual ? [] : (api.getSourceEntries?.() || api.getEntries().filter(entry => entry.spellSource));
    const retained = manual ? draft.filter(entry => entry.spellSource) : [];
    const limits = api.getLimits();
    const body = node("div", "spell-prepared-manager");
    const sourceList = node("div", "spell-prepared-sources spell-overview-card");
    sourceList.dataset.expanded = "true";
    const countSummary = node("div", "spell-prepared-count-summary");
    countSummary.setAttribute("role", "status");
    const counts = node("p", "spell-prepared-draft-counts");
    countSummary.appendChild(counts);
    const limitWarning = node("p", "spell-prepared-limit-warning spell-capability-warning");
    limitWarning.setAttribute("role", "status");
    limitWarning.hidden = true;
    const clear = node("button", "spell-prepared-clear app-dialog__button app-dialog__button--secondary", "清空準備");
    clear.type = "button";
    body.append(sourceList, countSummary, limitWarning);
    const retainedSelected = () => retained.filter(entry => draft.includes(entry));
    const blockingSources = () => manual ? retainedSelected() : sources;
    const sourceLabels = id => [...new Set(blockingSources().filter(entry => entry.spellId === id)
      .map(entry => entry.sourceLabel || entry.source || entry.spellSource || "來源能力"))];
    const editable = () => draft.filter(entry => !entry.spellSource);
    const countAt = cantrip => editable().filter(entry => (Number(entry.level) === 0) === cantrip
      && (manual || api.isEntryAvailable(entry)) && !sourceLabels(entry.spellId).length).length;
    const canClear = entry => Number(entry.level) >= 1 && Number(entry.level) <= 4
      && (manual || (!entry.spellSource && api.isEntryAvailable(entry)));
    const limitAt = cantrip => Number.isFinite(cantrip ? limits.cantrips : limits.prepared)
      ? (cantrip ? limits.cantrips : limits.prepared) : Infinity;
    function drawSources() {
      sourceList.replaceChildren();
      const entries = manual ? retained : sources;
      sourceList.hidden = !entries.length;
      if (!entries.length) return;
      const heading = node("div", "spell-overview-card-heading");
      const toggle = node("button", "spell-overview-toggle");
      toggle.type = "button";
      toggle.setAttribute("aria-expanded", sourceList.dataset.expanded);
      toggle.setAttribute("aria-controls", "spell-prepared-source-options");
      const arrow = node("span", "spell-overview-arrow", "▶");
      arrow.setAttribute("aria-hidden", "true");
      toggle.append(arrow, node("span", "", manual ? "保留的來源法術" : "永久準備"));
      heading.appendChild(toggle);
      sourceList.appendChild(heading);
      const list = node("div", "spell-picked-content spell-prepared-source-options");
      list.id = "spell-prepared-source-options";
      list.hidden = sourceList.dataset.expanded !== "true";
      toggle.addEventListener("click", () => {
        const expanded = sourceList.dataset.expanded !== "true";
        sourceList.dataset.expanded = String(expanded);
        toggle.setAttribute("aria-expanded", String(expanded));
        list.hidden = !expanded;
        globalScope.schedulePickedSpellLayout?.();
      });
      entries.forEach((entry, index) => {
        const spell = catalog().getSpell(entry.spellId);
        const row = node("div", "spell-picked-item spell-prepared-source");
        const check = node("label", "spell-picker-check");
        const input = node("input");
        input.type = "checkbox";
        input.checked = !manual || draft.includes(entry);
        input.disabled = !manual;
        input.dataset.stateTransient = "true";
        input.dataset.sourceKey = entry.sourceKey || entry.key || "";
        input.dataset.sourceIndex = String(index);
        input.setAttribute("aria-label", `${manual ? "保留" : "自動準備"}${spell?.nameZh || entry.spellId}，${entry.sourceLabel || entry.spellSource}`);
        input.addEventListener("change", () => {
          if (input.checked) { if (!draft.includes(entry)) draft.push(entry); }
          else draft = draft.filter(item => item !== entry);
          refresh();
          sourceList.querySelector(`[data-source-index="${index}"]`)?.focus({ preventScroll: true });
        });
        const name = node("button", "spell-picker-name", spell?.nameZh || `未知法術（${entry.spellId}）`);
        name.type = "button";
        name.dataset.spellId = entry.spellId;
        name.addEventListener("click", () => openReadOnly(entry.spellId, name));
        const text = node("span", "spell-prepared-source-name");
        text.appendChild(name);
        check.appendChild(input);
        row.append(check, text);
        list.appendChild(row);
      });
      sourceList.appendChild(list);
      globalScope.schedulePickedSpellLayout?.();
    }
    function candidateSpells() {
      const candidates = new Map();
      for (let level = 0; level <= 4; level += 1) {
        const ring = level === 0 ? "cantrips" : level;
        (globalScope.getAvailableSpellSourceClasses?.(ring) || []).forEach(option => {
          globalScope.getClassSpells(option.value, ring).forEach(spell => candidates.set(spell.spellId, spell));
        });
      }
      // Preserve unknown imported IDs and selections that became unavailable.
      editable().forEach(entry => candidates.set(entry.spellId, catalog().getSpell(entry.spellId)
        || { spellId: entry.spellId, level: Number(entry.level), nameZh: "", nameEn: "" }));
      return [...candidates.values()];
    }
    const picker = createSpellPicker({ mode: "prepared", getSpells: candidateSpells,
      getCountSuffix: () => ` | ${[1, 2, 3, 4].map(ring => `${ring}環 ${editable().filter(entry => Number(entry.level) === ring).length}`).join(" | ")} |`,
      getState(spell) {
        const selected = editable().some(entry => entry.spellId === spell.spellId);
        const labels = sourceLabels(spell.spellId);
        if (labels.length) return { checked: true, disabled: true };
        const unavailable = !manual && !api.isEntryAvailable({ spellId: spell.spellId, spellClass: currentClass, level: spell.level });
        const full = !manual && !selected && countAt(spell.level === 0) >= limitAt(spell.level === 0);
        const reason = unavailable && api.getAvailabilityReason?.({ spellId: spell.spellId, spellClass: currentClass, level: spell.level });
        return { checked: selected, disabled: !selected && (unavailable || full), unavailable,
          note: reason === "目前等級尚未開放此法術環階。" ? `目前不可用：${reason}` : "" };
      },
      onToggle(spell, checked) {
        if (!checked) draft = draft.filter(entry => entry.spellSource || entry.spellId !== spell.spellId);
        else if (!editable().some(entry => entry.spellId === spell.spellId) && !sourceLabels(spell.spellId).length
          && (manual || (api.isEntryAvailable({ spellId: spell.spellId, spellClass: currentClass, level: spell.level })
            && countAt(spell.level === 0) < limitAt(spell.level === 0)))) {
          const classes = catalog().getClassIds(spell.spellId);
          draft.push({ spellId: spell.spellId, spellClass: manual ? (classes.includes(currentClass) ? currentClass : classes[0] || "") : currentClass,
            level: spell.level });
        }
      }, onChange: () => refresh(false) });
    body.appendChild(picker.body);
    picker.toolbar.before(node("p", "spell-note-muted", "勾選要準備的法術，點法術名稱可閱讀。儲存後才會套用變更。"));
    function refresh(redraw = true) {
      const cantripExcess = manual ? 0 : Math.max(0, countAt(true) - limitAt(true));
      const preparedExcess = manual ? 0 : Math.max(0, countAt(false) - limitAt(false));
      counts.textContent = manual ? "手動管理：不限制法表、環階與準備數量。"
        : `戲法 ${countAt(true)}／${limits.cantrips ?? 0}｜一至四環 ${countAt(false)}／${limits.prepared ?? 0}`;
      counts.classList.toggle("is-over-limit", cantripExcess > 0 || preparedExcess > 0);
      limitWarning.hidden = !cantripExcess && !preparedExcess;
      limitWarning.textContent = [cantripExcess ? `戲法超過上限 ${cantripExcess} 個` : "",
        preparedExcess ? `一至四環共用準備超過上限 ${preparedExcess} 個` : ""].filter(Boolean).join("；")
        + (limitWarning.hidden ? "" : "。仍可取消選取或儲存目前清單；新增前請先減少選取。");
      clear.disabled = !draft.some(canClear);
      drawSources();
      if (redraw) picker.redraw();
    }
    clear.addEventListener("click", () => {
      draft = draft.filter(entry => !canClear(entry));
      refresh();
    });
    refresh();
    const sourceObserver = globalScope.ResizeObserver
      ? new globalScope.ResizeObserver(() => globalScope.schedulePickedSpellLayout?.()) : null;
    sourceObserver?.observe(sourceList);
    try {
      const decision = globalScope.AppDialog.showContent({ title: "管理已準備法術", content: body,
        variant: "spellbook", confirmLabel: "儲存", cancelLabel: "取消", trigger, allowNested: true,
        resolveConfirm() {
          if (!api.canManage() || manual !== isManual() || currentClass !== document.getElementById("class").value
            || currentLevel !== document.getElementById("level").value) {
            globalScope.AppDialog.notify("角色選項已變更，請取消後重新開啟準備法術。");
            return false;
          }
          api.setPlayerEntries(draft);
          return true;
        } });
      const dialog = body.closest(".app-dialog");
      dialog.querySelector(".app-dialog__actions").prepend(clear);
      attachSpellBrowserHeader(body);
      return await decision;
    } finally { sourceObserver?.disconnect(); }
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
    globalScope.markPreparedSpellOptions?.(body);
    const sync = () => {
      globalScope.markPreparedSpellOptions?.(body);
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
      } else if (canManageBook()) await manageWizard(event.currentTarget);
    });
    render();
  }

  globalScope.Spellbook = Object.freeze({ getState, setState, addWizardSpell, restoreState, render, getRitualEntries,
    openTomeSelection, openReadOnly, openPreparedManager });
  document.addEventListener("DOMContentLoaded", init);
})(window);

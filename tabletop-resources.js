(function attachTabletopResources(globalScope) {
  "use strict";

  const CUSTOM_RESOURCE_MAX = 999;
  const elements = {};
  let initialized = false;
  let scheduledRender = 0;

  function createElement(tagName, className = "", text = "") {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function dispatchCanonicalUpdate(control) {
    control.dispatchEvent(new Event("input", { bubbles: true }));
    control.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function setCanonicalCheckbox(canonical, checked) {
    if (!(canonical instanceof HTMLInputElement) || canonical.disabled) return;
    canonical.checked = Boolean(checked);
    dispatchCanonicalUpdate(canonical);
  }

  function createResourceRow(label, note = "") {
    const row = createElement("section", "tabletop-resource-row");
    const copy = createElement("div", "tabletop-resource-row__copy");
    copy.appendChild(createElement("h4", "", label));
    if (note) copy.appendChild(createElement("p", "", note));
    const controls = createElement("div", "tabletop-resource-row__controls");
    row.append(copy, controls);
    return { row, controls };
  }

  function createCheckboxMirrors(label, note, canonicalInputs) {
    const row = createElement(
      "div",
      "proficiency-use-checks tabletop-resource-inline-checks"
    );
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", note ? `${label}；${note}` : label);
    row.appendChild(createElement(
      "span",
      "proficiency-use-checks__label",
      label
    ));

    canonicalInputs.forEach((canonical, index) => {
      const mirror = document.createElement("input");
      mirror.type = "checkbox";
      mirror.checked = canonical.checked;
      mirror.setAttribute(
        "aria-label",
        canonicalInputs.length === 1
          ? label
          : `${label} ${index + 1}/${canonicalInputs.length}`
      );
      mirror.addEventListener("change", () => setCanonicalCheckbox(canonical, mirror.checked));
      row.appendChild(mirror);
    });
    return row;
  }

  function createSpellSlotMirrors(label, canonicalInputs) {
    const column = createElement(
      "div",
      "spell-slot-column tabletop-spell-slot-column"
    );
    column.setAttribute("role", "group");
    column.setAttribute("aria-label", `${label}法術位，勾選表示已消耗`);
    column.appendChild(createElement("span", "spell-slot-label", label));

    canonicalInputs.forEach((canonical, index) => {
      const mirror = document.createElement("input");
      mirror.type = "checkbox";
      mirror.checked = canonical.checked;
      mirror.setAttribute(
        "aria-label",
        `${label}法術位 ${index + 1}/${canonicalInputs.length}，勾選表示已消耗`
      );
      mirror.addEventListener("change", () => {
        setCanonicalCheckbox(canonical, mirror.checked);
      });
      column.appendChild(mirror);
    });

    return column;
  }

  function createHeroicInspirationRow() {
    const canonical = document.getElementById("heroic-inspiration");
    if (!(canonical instanceof HTMLInputElement)) return null;
    return createCheckboxMirrors(
      "英雄激勵",
      "與角色卡數值頁同步。",
      [canonical]
    );
  }

  function createHitDiceRow() {
    const canonical = document.getElementById("lifedicen");
    const hasClass = Boolean(document.getElementById("class")?.value);
    const level = Number.parseInt(document.getElementById("level")?.value || "0", 10);
    if (!(canonical instanceof HTMLSelectElement) || !hasClass || level < 1) return null;
    const availableValues = Array.from(canonical.options)
      .filter(option => !option.disabled)
      .map(option => Number.parseInt(option.value, 10))
      .filter(Number.isFinite);
    const maximum = availableValues.length ? Math.max(...availableValues) : level;
    const current = Number.parseInt(canonical.value || "0", 10) || 0;
    const { row, controls } = createResourceRow("生命骰", "手動追蹤目前剩餘顆數。") ;
    controls.classList.add("tabletop-resource-stepper");

    const decrease = createElement("button", "", "−");
    decrease.type = "button";
    decrease.disabled = current <= 0;
    decrease.setAttribute("aria-label", "生命骰減少 1");
    const output = createElement("output", "", `${current}／${maximum}`);
    output.setAttribute("aria-label", `生命骰 ${current}/${maximum}`);
    const increase = createElement("button", "", "+");
    increase.type = "button";
    increase.disabled = current >= maximum;
    increase.setAttribute("aria-label", "生命骰增加 1");

    const setValue = value => {
      const next = Math.min(maximum, Math.max(0, value));
      const option = Array.from(canonical.options).find(candidate => Number(candidate.value) === next && !candidate.disabled);
      if (!option) return;
      canonical.value = option.value;
      dispatchCanonicalUpdate(canonical);
    };
    decrease.addEventListener("click", () => setValue(current - 1));
    increase.addEventListener("click", () => setValue(current + 1));
    controls.append(decrease, output, increase);
    return row;
  }

  function getRaceUseGroups() {
    const race = document.getElementById("race")?.value || "";
    const gnomeLineage = document.getElementById("gnome-lineage")?.value || "";
    const goliathAncestry = document.getElementById("goliath-ancestry")?.value || "";
    const configs = [
      { visible: race === "dragonborn", id: "dragonborn-breath-uses", label: "吐息次數" },
      { visible: race === "gnome" && gnomeLineage === "forest_gnome", id: "forest-gnome-animal-speech-uses", label: "動物交談次數" },
      { visible: race === "goliath" && Boolean(goliathAncestry), id: "goliath-giant-ancestry-uses", label: "巨人血統異能" }
    ];

    return configs.flatMap(config => {
      if (!config.visible) return [];
      const canonicalInputs = Array.from(document.querySelectorAll(`#${config.id} input[type="checkbox"]`))
        .filter(input => !input.disabled && !input.hidden);
      return canonicalInputs.length ? [{ ...config, canonicalInputs }] : [];
    });
  }

  function findSpellLabelForUseGroup(group) {
    let sibling = group.previousElementSibling;
    while (sibling && !sibling.classList.contains("spell-picked-jump")) {
      sibling = sibling.previousElementSibling;
    }
    const spellId = sibling?.dataset.spellId || "";
    return globalScope.SpellCatalog?.getSpell(spellId)?.nameZh
      || sibling?.textContent?.replace(/[\[\]]/g, "").trim()
      || "免費施法";
  }

  function getSpellUseGroups() {
    const groups = Array.from(document.querySelectorAll(".free-spell-use-checks")).flatMap(group => {
      const canonicalInputs = Array.from(group.querySelectorAll(".free-spell-use-check"))
        .filter(input => !input.disabled && !input.hidden);
      if (!canonicalInputs.length) return [];
      const title = canonicalInputs[0].title || "與角色卡的免費施法次數同步。";
      return [{
        label: findSpellLabelForUseGroup(group),
        note: title,
        canonicalInputs
      }];
    });

    const naturalRecovery = document.getElementById("druid-natural-recovery-used");
    const hasNaturalRecovery = typeof globalScope.hasDruidNaturalRecoverySpells === "function"
      && globalScope.hasDruidNaturalRecoverySpells();
    if (hasNaturalRecovery && naturalRecovery instanceof HTMLInputElement) {
      groups.push({
        label: "自然恢復",
        note: "勾選表示本次免費施法已使用。",
        canonicalInputs: [naturalRecovery]
      });
    }
    return groups;
  }

  function renderSpellUsage(target) {
    if (!(target instanceof HTMLElement)) return 0;
    const groups = getSpellUseGroups();
    target.replaceChildren(...groups.map(group => createCheckboxMirrors(
      group.label,
      group.note,
      group.canonicalInputs
    )));
    return groups.length;
  }

  function renderSpellSlots(target) {
    if (!(target instanceof HTMLElement)) return 0;
    const management = document.getElementById("spell-slot-management-wrap");
    if (!management || management.classList.contains("is-hidden")) {
      target.replaceChildren();
      return 0;
    }

    const groups = [1, 2, 3, 4].flatMap(ring => {
      const row = document.getElementById(`spellslot${ring}-row`);
      if (!row || row.style.display === "none") return [];
      const canonicalInputs = Array.from(row.querySelectorAll('input[type="checkbox"][id]'))
        .filter(input => !input.disabled && !input.hidden && input.style.display !== "none");
      return canonicalInputs.length ? [{
        label: `${["一", "二", "三", "四"][ring - 1]}環`,
        note: "勾選表示已消耗。",
        canonicalInputs
      }] : [];
    });
    target.replaceChildren(...groups.map(group => createSpellSlotMirrors(
      group.label,
      group.canonicalInputs
    )));
    return groups.length;
  }

  function renderBuiltInResources() {
    if (!elements.builtInResources) return;
    const rows = [];
    const inspiration = createHeroicInspirationRow();
    const hitDice = createHitDiceRow();
    if (inspiration) rows.push(inspiration);
    if (hitDice) rows.push(hitDice);
    else {
      const note = createElement("div", "tabletop-inline-empty", "請先在角色卡的數值頁選擇職業與等級，之後即可追蹤生命骰。");
      rows.push(note);
    }

    const raceGroups = getRaceUseGroups();
    raceGroups.forEach(group => rows.push(createCheckboxMirrors(
      group.label,
      "只顯示目前角色等級可用的使用格。",
      group.canonicalInputs
    )));
    if (!raceGroups.length) {
      rows.push(createElement("div", "tabletop-inline-empty", "目前沒有可顯示的種族／祖源使用次數；選定相關種族與血統後會出現。"));
    }

    getSpellUseGroups().forEach(group => rows.push(createCheckboxMirrors(
      group.label,
      group.note,
      group.canonicalInputs
    )));
    elements.builtInResources.replaceChildren(...rows);
  }

  function announce(message) {
    if (!elements.status) return;
    elements.status.textContent = "";
    requestAnimationFrame(() => { elements.status.textContent = message; });
  }

  function closeCustomResourceForm({ restoreFocus = true } = {}) {
    elements.customForm.hidden = true;
    elements.customAdd.setAttribute("aria-expanded", "false");
    elements.customAdd.textContent = "新增資源";
    elements.customError.textContent = "";
    [elements.customLabel, elements.customCurrent, elements.customMax].forEach(input => {
      input.removeAttribute("aria-invalid");
    });
    elements.customForm.reset();
    elements.customId.value = "";
    if (restoreFocus) elements.customAdd.focus();
  }

  function openCustomResourceForm(resource = null) {
    elements.customForm.hidden = false;
    elements.customAdd.setAttribute("aria-expanded", "true");
    elements.customAdd.textContent = resource ? "編輯資源中" : "新增資源中";
    elements.customId.value = resource?.id || "";
    elements.customLabel.value = resource?.label || "";
    elements.customCurrent.value = String(resource?.current ?? 0);
    elements.customMax.value = String(resource?.max ?? 1);
    elements.customRecovery.value = resource?.recoveryNote || "";
    elements.customError.textContent = "";
    elements.customLabel.focus();
  }

  function validateCustomResourceForm() {
    const label = elements.customLabel.value.trim();
    const current = Number(elements.customCurrent.value);
    const maximum = Number(elements.customMax.value);
    [elements.customLabel, elements.customCurrent, elements.customMax].forEach(input => input.removeAttribute("aria-invalid"));

    if (!label) {
      elements.customLabel.setAttribute("aria-invalid", "true");
      elements.customError.textContent = "請輸入資源名稱。";
      elements.customLabel.focus();
      return null;
    }
    if (!Number.isSafeInteger(maximum) || maximum < 1 || maximum > CUSTOM_RESOURCE_MAX) {
      elements.customMax.setAttribute("aria-invalid", "true");
      elements.customError.textContent = `最大值必須是 1～${CUSTOM_RESOURCE_MAX} 的整數。`;
      elements.customMax.focus();
      return null;
    }
    if (!Number.isSafeInteger(current) || current < 0 || current > maximum) {
      elements.customCurrent.setAttribute("aria-invalid", "true");
      elements.customError.textContent = `目前值必須是 0～${maximum} 的整數。`;
      elements.customCurrent.focus();
      return null;
    }
    return {
      label,
      current,
      max: maximum,
      recoveryNote: elements.customRecovery.value.trim()
    };
  }

  function handleCustomResourceSubmit(event) {
    event.preventDefault();
    const values = validateCustomResourceForm();
    if (!values) return;
    const resourceId = elements.customId.value;
    const succeeded = resourceId
      ? globalScope.TabletopMode?.updateCustomResource(resourceId, values)
      : globalScope.TabletopMode?.addCustomResource(values);
    if (!succeeded) {
      elements.customError.textContent = resourceId
        ? "無法更新這筆資源，請重新整理後再試。"
        : "自訂資源已達 50 筆上限，請先刪除不再使用的項目。";
      return;
    }
    closeCustomResourceForm({ restoreFocus: false });
    elements.customAdd.focus();
  }

  function createCustomResourceItem(resource) {
    const item = createElement("article", "tabletop-custom-resource");
    item.dataset.customResourceId = resource.id;
    const heading = createElement("div", "tabletop-custom-resource__heading");
    const copy = createElement("div");
    copy.appendChild(createElement("h4", "", resource.label));
    if (resource.recoveryNote) copy.appendChild(createElement("p", "", resource.recoveryNote));
    const total = createElement("strong", "tabletop-custom-resource__total", `${resource.current}／${resource.max}`);
    total.setAttribute("aria-label", `${resource.label} ${resource.current}/${resource.max}`);
    heading.append(copy, total);

    const stepper = createElement("div", "tabletop-custom-resource__stepper");
    const decrease = createElement("button", "", "−1");
    decrease.type = "button";
    decrease.disabled = resource.current <= 0;
    decrease.setAttribute("aria-label", `${resource.label}減少 1`);
    decrease.addEventListener("click", () => {
      globalScope.TabletopMode?.setCustomResourceCurrent(resource.id, resource.current - 1);
      announce(`${resource.label}已減少為 ${Math.max(0, resource.current - 1)}。`);
    });
    const increase = createElement("button", "", "+1");
    increase.type = "button";
    increase.disabled = resource.current >= resource.max;
    increase.setAttribute("aria-label", `${resource.label}增加 1`);
    increase.addEventListener("click", () => {
      globalScope.TabletopMode?.setCustomResourceCurrent(resource.id, resource.current + 1);
      announce(`${resource.label}已增加為 ${Math.min(resource.max, resource.current + 1)}。`);
    });
    const refill = createElement("button", "tabletop-compact-button", "回滿此項");
    refill.type = "button";
    refill.disabled = resource.current >= resource.max;
    refill.setAttribute("aria-label", `只將${resource.label}回滿`);
    refill.addEventListener("click", () => {
      globalScope.TabletopMode?.setCustomResourceCurrent(resource.id, resource.max);
      announce(`${resource.label}已回滿。`);
    });
    stepper.append(decrease, increase, refill);

    const exactForm = createElement("form", "tabletop-custom-resource__exact");
    exactForm.noValidate = true;
    const exactLabel = createElement("label", "sr-only", `精確設定${resource.label}目前值`);
    const exactInput = document.createElement("input");
    exactInput.id = `tabletop-custom-exact-${resource.id}`;
    exactLabel.htmlFor = exactInput.id;
    exactInput.type = "number";
    exactInput.min = "0";
    exactInput.max = String(resource.max);
    exactInput.step = "1";
    exactInput.inputMode = "numeric";
    exactInput.value = String(resource.current);
    exactInput.setAttribute("aria-label", `精確設定${resource.label}目前值`);
    const exactButton = createElement("button", "tabletop-compact-button", "設定");
    exactButton.type = "submit";
    exactForm.append(exactLabel, exactInput, exactButton);
    exactForm.addEventListener("submit", event => {
      event.preventDefault();
      const next = Number(exactInput.value);
      if (!Number.isSafeInteger(next) || next < 0 || next > resource.max) {
        exactInput.setAttribute("aria-invalid", "true");
        announce(`請輸入 0～${resource.max} 的整數。`);
        exactInput.focus();
        return;
      }
      globalScope.TabletopMode?.setCustomResourceCurrent(resource.id, next);
      announce(`${resource.label}已設定為 ${next}。`);
    });

    const actions = createElement("div", "tabletop-custom-resource__actions");
    const edit = createElement("button", "tabletop-compact-button", "編輯");
    edit.type = "button";
    edit.addEventListener("click", () => openCustomResourceForm(resource));
    const remove = createElement("button", "tabletop-compact-button tabletop-danger-button", "刪除");
    remove.type = "button";
    remove.addEventListener("click", async () => {
      const confirmed = await globalScope.AppDialog?.requestDecision({
        title: `刪除「${resource.label}」`,
        message: "這會從角色資料移除這筆手動資源，且無法復原。其他角色欄位不受影響。",
        cancelLabel: "取消",
        confirmLabel: "刪除資源",
        intent: "danger",
        dismissOnBackdrop: false,
        trigger: remove
      });
      if (!confirmed) return;
      globalScope.TabletopMode?.removeCustomResource(resource.id);
      announce(`已刪除${resource.label}。`);
      globalScope.requestAnimationFrame(() => {
        elements.customAdd?.focus({ preventScroll: true });
      });
    });
    actions.append(edit, remove);
    item.append(heading, stepper, exactForm, actions);
    return item;
  }

  function renderCustomResources() {
    if (!elements.customList) return;
    const resources = globalScope.TabletopMode?.getCustomResources?.() || [];
    if (!resources.length) {
      const empty = createElement("div", "tabletop-empty-state");
      empty.append(
        createElement("strong", "", "尚未登記自訂資源"),
        createElement("p", "", "可登記狂暴、專注點等角色資源；數值由玩家手動維護，不會依職業規則自動產生。")
      );
      elements.customList.replaceChildren(empty);
      return;
    }
    elements.customList.replaceChildren(...resources.map(createCustomResourceItem));
  }

  function render() {
    if (!initialized) return;
    renderBuiltInResources();
    renderCustomResources();
    if (elements.spellUses) renderSpellUsage(elements.spellUses);
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
      builtInResources: document.getElementById("tabletop-built-in-resources"),
      spellUses: document.getElementById("tabletop-spell-uses"),
      customList: document.getElementById("tabletop-custom-resources"),
      customAdd: document.getElementById("tabletop-custom-resource-add"),
      customForm: document.getElementById("tabletop-custom-resource-form"),
      customId: document.getElementById("tabletop-custom-resource-id"),
      customLabel: document.getElementById("tabletop-custom-resource-label"),
      customCurrent: document.getElementById("tabletop-custom-resource-current"),
      customMax: document.getElementById("tabletop-custom-resource-max"),
      customRecovery: document.getElementById("tabletop-custom-resource-recovery"),
      customError: document.getElementById("tabletop-custom-resource-error"),
      customCancel: document.getElementById("tabletop-custom-resource-cancel"),
      status: document.getElementById("tabletop-resource-status")
    });
    if (!elements.builtInResources || !elements.customForm || !globalScope.TabletopMode) return;
    initialized = true;

    elements.customAdd.addEventListener("click", () => {
      if (elements.customForm.hidden) openCustomResourceForm();
      else closeCustomResourceForm();
    });
    elements.customCancel.addEventListener("click", () => closeCustomResourceForm());
    elements.customForm.addEventListener("submit", handleCustomResourceSubmit);
    document.addEventListener("change", scheduleRender);
    globalScope.addEventListener("tabletopstatechange", scheduleRender);
    globalScope.addEventListener("tabletop-panelchange", event => {
      if (event.detail?.panel === "resources" || event.detail?.panel === "spells") scheduleRender();
    });

    [document.getElementById("tab-basic"), document.getElementById("tab-spells")]
      .filter(Boolean)
      .forEach(root => {
        if (!globalScope.MutationObserver) return;
        new MutationObserver(scheduleRender).observe(root, {
          childList: true,
          subtree: true,
          attributes: true
        });
      });
    render();
  }

  globalScope.TabletopResources = Object.freeze({
    renderSpellSlots,
    renderSpellUsage,
    refresh: scheduleRender
  });

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", init);
  }
})(typeof window !== "undefined" ? window : globalThis);

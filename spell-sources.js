/**
 * 衍生法術來源：魔法學徒、書之魔契、魔法發現、種族／子職／職業／祈喚的自動準備法術（傳統 script，不使用 defer）。
 *
 * - 自 index.html 原封搬出，於第一段內嵌角色卡 script 之前同步載入，
 *   維持全域名稱供 index.html、spellbook.js、spell-management.js 等呼叫。
 * - 只放函式與狀態宣告；頂層只登記 window.setPactTomeSpellSelection。
 */
const MAGIC_INITIATE_FEAT_NAME = "魔法學徒";
const MAGIC_INITIATE_SOURCE = "magic-initiate";
const RACE_SPELL_SOURCE = "race";
const SUBCLASS_SPELL_SOURCE = "subclass";
const CLASS_SPELL_SOURCE = "class";
const ELDRITCH_INVOCATION_SPELL_SOURCE = "eldritch-invocation";
const PACT_TOME_SPELL_SOURCE = "pact-tome";
let pactTomeSpellSelection = { cantrips: [], rituals: [] };
let pactTomeInvocationRemembered = false;
function restorePactTomeInvocationSelection(data) {
  const index = eldritchInvocations.findIndex(option => option.name === "書之魔契");
  const id = getInvocationCheckboxId(index, 1);
  pactTomeInvocationRemembered = Object.hasOwn(data, "__pactTomeInvocationSelected")
    ? data.__pactTomeInvocationSelected === true
    : Object.hasOwn(data, id) ? data[id] === true : hasCompletePactTomeSpellSelection();
}



function normalizePactTomeSpellSelection(selection) {
  const cantrips = Array.isArray(selection?.cantrips) ? selection.cantrips.filter(spellId => SpellCatalog.getSpell(spellId)?.level === 0).slice(0, 3) : [];
  const rituals = Array.isArray(selection?.rituals) ? selection.rituals.filter(spellId => {
    const spell = SpellCatalog.getSpell(spellId);
    return spell?.level === 1 && SpellCatalog.isRitual(spell);
  }).slice(0, 2) : [];
  return { cantrips: [...new Set(cantrips)], rituals: [...new Set(rituals)] };
}

function getPactTomeSpellSelection() {
  return { cantrips: [...pactTomeSpellSelection.cantrips], rituals: [...pactTomeSpellSelection.rituals] };
}

function hasCompletePactTomeSpellSelection(selection = pactTomeSpellSelection) {
  return selection.cantrips.length === 3 && selection.rituals.length === 2;
}

function setPactTomeSpellSelection(selection, options = {}) {
  pactTomeSpellSelection = normalizePactTomeSpellSelection(selection);
  if (options.sync !== false && typeof syncOriginAndSubclassDerivedSpellRows === "function") {
    syncOriginAndSubclassDerivedSpellRows();
  }
}

function getNonPactTomeSelectedSpellIds() {
  return (window.SpellManagement?.getEntries({ availableOnly: true }) || [])
    .filter(entry => entry.spellSource !== PACT_TOME_SPELL_SOURCE).map(entry => entry.spellId);
}

window.setPactTomeSpellSelection = setPactTomeSpellSelection;
const MAGIC_INITIATE_CLASS_OPTIONS = [
  { value: "cleric", text: "牧師" },
  { value: "druid", text: "德魯伊" },
  { value: "wizard", text: "法師" }
];
const MAGIC_INITIATE_CLASS_BY_LABEL = {
  "牧師": "cleric",
  "德魯伊": "druid",
  "法師": "wizard"
};
const BARD_MAGICAL_DISCOVERY_SLOT_COUNT = 2;
let bardMagicalDiscoverySelection = Array.from(
  { length: BARD_MAGICAL_DISCOVERY_SLOT_COUNT },
  () => ({ classValue: "", ring: "", spellId: "" })
);

function normalizeBardMagicalDiscoverySelection(selection) {
  return Array.from({ length: BARD_MAGICAL_DISCOVERY_SLOT_COUNT }, (_, index) => {
    const item = Array.isArray(selection) ? selection[index] : null;
    const classValue = MAGIC_INITIATE_CLASS_OPTIONS.some(option => option.value === item?.classValue)
      ? item.classValue
      : "";
    const ring = item?.ring === "cantrips" || /^[1-4]$/.test(String(item?.ring || ""))
      ? String(item.ring)
      : "";
    const spellId = String(item?.spellId || "");
    const spellLevel = ring === "cantrips" ? 0 : Number(ring);
    const isValidSpell = Boolean(classValue && ring && getClassSpells(classValue, ring === "cantrips" ? "cantrips" : spellLevel)
      .some(spell => spell.spellId === spellId));
    return { classValue, ring, spellId: isValidSpell ? spellId : "" };
  });
}

function getBardMagicalDiscoverySelection() {
  return bardMagicalDiscoverySelection.map(item => ({ ...item }));
}

function setBardMagicalDiscoverySelection(selection, options = {}) {
  bardMagicalDiscoverySelection = normalizeBardMagicalDiscoverySelection(selection);
  if (options.sync !== false && typeof syncOriginAndSubclassDerivedSpellRows === "function") {
    syncOriginAndSubclassDerivedSpellRows();
  }
}

function getBardMagicalDiscoveryMaxSpellLevel() {
  const level = Number.parseInt(document.getElementById("level")?.value || "0", 10) || 0;
  return getSpellSlotCounts("bard", level).reduce(
    (highest, count, index) => count > 0 ? index + 1 : highest,
    0
  );
}

function getBardMagicalDiscoveryControl(slot, field) {
  return document.querySelector(`[data-bard-magical-discovery-slot="${slot}"][data-bard-magical-discovery-field="${field}"]`);
}

function syncBardMagicalDiscoveryDetailButton(row) {
  const spellSelect = row?.querySelector('[data-bard-magical-discovery-field="spell"]');
  const detailButton = row?.querySelector(".bard-magical-discovery-detail");
  const spell = SpellCatalog.getSpell(spellSelect?.value);
  if (!detailButton) return;
  detailButton.disabled = !spell;
  detailButton.title = spell ? `查看${spell.nameZh}的法術詳情` : "請先選擇法術";
}

function updateBardMagicalDiscoverySpellOptions(row, preferredSpellId = "") {
  if (!row) return;
  const classValue = row.querySelector('[data-bard-magical-discovery-field="class"]')?.value || "";
  const ringValue = row.querySelector('[data-bard-magical-discovery-field="ring"]')?.value || "";
  const spellSelect = row.querySelector('[data-bard-magical-discovery-field="spell"]');
  if (!spellSelect) return;
  const spells = classValue && ringValue
    ? getClassSpells(classValue, ringValue === "cantrips" ? "cantrips" : Number(ringValue))
    : [];
  const previousValue = preferredSpellId || spellSelect.value;
  spellSelect.innerHTML = '<option value="">--法術名稱--</option>' + spells.map(spell => (
    `<option value="${escapeHtml(spell.spellId)}">${escapeHtml(SpellCatalog.getDisplayName(spell.spellId))}</option>`
  )).join("");
  spellSelect.value = spells.some(spell => spell.spellId === previousValue) ? previousValue : "";
  spellSelect.disabled = !classValue || !ringValue;
  syncBardMagicalDiscoveryDetailButton(row);
  markPreparedSpellOptions(spellSelect);
}

function captureBardMagicalDiscoverySelectionFromControls() {
  const mount = document.getElementById("bard-magical-discoveries");
  if (!mount) return;
  bardMagicalDiscoverySelection = normalizeBardMagicalDiscoverySelection(
    Array.from({ length: BARD_MAGICAL_DISCOVERY_SLOT_COUNT }, (_, index) => {
      const slot = index + 1;
      return {
        classValue: getBardMagicalDiscoveryControl(slot, "class")?.value || "",
        ring: getBardMagicalDiscoveryControl(slot, "ring")?.value || "",
        spellId: getBardMagicalDiscoveryControl(slot, "spell")?.value || ""
      };
    })
  );
}

function commitBardMagicalDiscoverySelection() {
  captureBardMagicalDiscoverySelectionFromControls();
  syncOriginAndSubclassDerivedSpellRows();
  scheduleSaveAllFields();
}

function createBardMagicalDiscoveryField(labelText, control, controlId) {
  const field = document.createElement("div");
  field.className = "bard-magical-discovery-field";
  const label = document.createElement("span");
  label.className = "bard-magical-discovery-field__label";
  label.textContent = labelText;
  label.id = `${controlId}-label`;
  const labelledControl = control.matches?.("select, input, textarea, button")
    ? control
    : control.querySelector?.("select, input, textarea, button");
  labelledControl?.setAttribute("aria-labelledby", label.id);
  field.append(label, control);
  return field;
}

function renderBardMagicalDiscoveryControls() {
  const mount = document.getElementById("bard-magical-discoveries");
  if (!mount) return;
  const maxSpellLevel = getBardMagicalDiscoveryMaxSpellLevel();
  const rows = bardMagicalDiscoverySelection.map((selection, index) => {
    const slot = index + 1;
    const row = document.createElement("div");
    row.className = "bard-magical-discovery-row";
    row.dataset.bardMagicalDiscoveryRow = String(slot);

    const marker = document.createElement("strong");
    marker.className = "bard-magical-discovery-row__marker";
    marker.textContent = `選擇 ${slot}`;

    const classSelect = document.createElement("select");
    classSelect.id = `bard-magical-discovery-${slot}-class`;
    classSelect.dataset.bardMagicalDiscoverySlot = String(slot);
    classSelect.dataset.bardMagicalDiscoveryField = "class";
    classSelect.dataset.stateTransient = "true";
    classSelect.innerHTML = '<option value="">--職業--</option>' + MAGIC_INITIATE_CLASS_OPTIONS.map(option => (
      `<option value="${option.value}">${option.text}</option>`
    )).join("");
    classSelect.value = selection.classValue;

    const ringSelect = document.createElement("select");
    ringSelect.id = `bard-magical-discovery-${slot}-ring`;
    ringSelect.dataset.bardMagicalDiscoverySlot = String(slot);
    ringSelect.dataset.bardMagicalDiscoveryField = "ring";
    ringSelect.dataset.stateTransient = "true";
    ringSelect.innerHTML = '<option value="">--環階--</option><option value="cantrips">戲法</option>' +
      Array.from({ length: maxSpellLevel }, (_, ringIndex) => {
        const ring = ringIndex + 1;
        return `<option value="${ring}">${getSpellLevelLabel(ring)}</option>`;
      }).join("");
    ringSelect.value = Array.from(ringSelect.options).some(option => option.value === selection.ring)
      ? selection.ring
      : "";

    const spellSelect = document.createElement("select");
    spellSelect.id = `bard-magical-discovery-${slot}-spell`;
    spellSelect.dataset.bardMagicalDiscoverySlot = String(slot);
    spellSelect.dataset.bardMagicalDiscoveryField = "spell";
    spellSelect.dataset.stateTransient = "true";

    const spellControl = document.createElement("span");
    spellControl.className = "bard-magical-discovery-spell-control";
    const detailButton = document.createElement("button");
    detailButton.type = "button";
    detailButton.className = "bard-magical-discovery-detail";
    detailButton.textContent = "查看";
    detailButton.disabled = true;
    detailButton.setAttribute("aria-label", `查看魔法發現選擇 ${slot} 的法術詳情`);
    detailButton.addEventListener("click", () => {
      const spell = SpellCatalog.getSpell(spellSelect.value);
      if (spell) window.quickBuild?.openSpellDetail?.(spell, detailButton);
    });
    spellControl.append(spellSelect, detailButton);

    row.append(
      marker,
      createBardMagicalDiscoveryField("職業", classSelect, classSelect.id),
      createBardMagicalDiscoveryField("戲法或環位", ringSelect, ringSelect.id),
      createBardMagicalDiscoveryField("法術名稱", spellControl, spellSelect.id)
    );
    updateBardMagicalDiscoverySpellOptions(row, selection.spellId);

    classSelect.addEventListener("change", () => {
      updateBardMagicalDiscoverySpellOptions(row);
      commitBardMagicalDiscoverySelection();
    });
    ringSelect.addEventListener("change", () => {
      updateBardMagicalDiscoverySpellOptions(row);
      commitBardMagicalDiscoverySelection();
    });
    spellSelect.addEventListener("change", () => {
      syncBardMagicalDiscoveryDetailButton(row);
      commitBardMagicalDiscoverySelection();
    });
    return row;
  });
  mount.replaceChildren(...rows);
}

function getBardMagicalDiscoveryDerivedSpellSpecs() {
  const classValue = document.getElementById("class")?.value || "";
  const level = Number.parseInt(document.getElementById("level")?.value || "0", 10) || 0;
  if (classValue !== "bard" || level < 6) return [];
  const maxSpellLevel = getBardMagicalDiscoveryMaxSpellLevel();
  return bardMagicalDiscoverySelection.flatMap((selection, index) => {
    const spell = SpellCatalog.getSpell(selection.spellId);
    const ring = selection.ring === "cantrips" ? "cantrips" : Number(selection.ring);
    const spellLevel = ring === "cantrips" ? 0 : ring;
    const sourceClass = MAGIC_INITIATE_CLASS_OPTIONS.find(option => option.value === selection.classValue);
    if (!spell || !sourceClass || spell.level !== spellLevel || (spellLevel > 0 && spellLevel > maxSpellLevel)) return [];
    if (!getClassSpells(selection.classValue, ring).some(option => option.spellId === selection.spellId)) return [];
    return [{
      level: 6,
      ring,
      spellId: selection.spellId,
      key: `class-bard-magical-discovery-${index + 1}`,
      source: CLASS_SPELL_SOURCE,
      sourceName: "吟遊詩人",
      spellClass: "bard",
      sourceLabel: `來源：魔法發現（${sourceClass.text}）`,
      sourcePriority: 25,
      sourceTag: "職業",
      castMode: ring === "cantrips" ? "cantrip" : "slot",
      fixedCastLevel: spellLevel,
      ritualAllowed: spellLevel > 0,
      areaId: getAreaIdForSpellRing(ring)
    }];
  });
}

function getFeatSelectFromRow(row) {
  return row?.querySelector?.("select:not([id*='magic-initiate'])") || null;
}

function isMagicInitiateFeatSelectedInRow(row) {
  return getFeatSelectFromRow(row)?.value === MAGIC_INITIATE_FEAT_NAME;
}

function hasMagicInitiateFeatSelected() {
  return hasSelectedFeat(MAGIC_INITIATE_FEAT_NAME);
}

function getMagicInitiateClassFromBackgroundFeature(featText = "") {
  const matched = String(featText || "").match(/魔法學徒[（(]([^）)]+)[）)]/);
  const label = matched?.[1]?.trim() || "";
  return MAGIC_INITIATE_CLASS_BY_LABEL[label] || "";
}

function createMagicInitiateSelect(field, labelText) {
  const fieldWrap = document.createElement("div");
  fieldWrap.className = "magic-initiate-field";

  const select = document.createElement("select");
  select.dataset.magicInitiateField = field;
  select.innerHTML = `<option value="">--${labelText}--</option>`;

  fieldWrap.appendChild(select);
  if (field !== "class") {
    const detailButton = document.createElement("button");
    detailButton.type = "button";
    detailButton.className = "magic-initiate-spell-detail";
    detailButton.textContent = "查看";
    detailButton.disabled = true;
    detailButton.setAttribute("aria-label", `查看${labelText}法術詳情`);
    detailButton.title = "請先選擇法術";
    detailButton.addEventListener("click", () => {
      const spell = SpellCatalog.getSpell(select.value);
      if (spell) window.quickBuild?.openSpellDetail?.(spell, detailButton);
    });
    fieldWrap.appendChild(detailButton);
  }
  return { fieldWrap, select };
}

function createMagicInitiateControls(rowDiv) {
  const wrap = document.createElement("div");
  wrap.className = "magic-initiate-controls is-hidden";
  wrap.dataset.magicInitiateControls = "true";

  const classField = createMagicInitiateSelect("class", "職業");
  classField.select.innerHTML =
    `<option value="">--職業--</option>` +
    MAGIC_INITIATE_CLASS_OPTIONS.map(o => `<option value="${o.value}">${o.text}</option>`).join("");

  const cantripOneField = createMagicInitiateSelect("cantrip1", "戲法 #1");
  const cantripTwoField = createMagicInitiateSelect("cantrip2", "戲法 #2");
  const levelOneField = createMagicInitiateSelect("level1", "一環法術");

  wrap.appendChild(classField.fieldWrap);
  wrap.appendChild(cantripOneField.fieldWrap);
  wrap.appendChild(cantripTwoField.fieldWrap);
  wrap.appendChild(levelOneField.fieldWrap);

  classField.select.addEventListener("change", () => {
    syncMagicInitiateClassOptions(classField.select);
    updateMagicInitiateSpellOptions(rowDiv);
    syncMagicInitiateDerivedSpellRows();
    updateSpellCastingStatsVisibility();
    updateSpellsByClassLevel();
    scheduleSaveAllFields();
  });

  [cantripOneField.select, cantripTwoField.select, levelOneField.select].forEach((select) => {
    select.addEventListener("change", () => {
      syncMagicInitiateSpellDetailButton(select);
      syncMagicInitiateDerivedSpellRows();
      scheduleSaveAllFields();
    });
  });

  return wrap;
}

function getMagicInitiateSelect(row, field) {
  return row?.querySelector?.(`[data-magic-initiate-field="${field}"]`) || null;
}

function getIncompleteMagicInitiateControl(row) {
  if (window.SpellManagement?.isManual()) return null;
  return ["class", "cantrip1", "cantrip2", "level1"]
    .map(field => getMagicInitiateSelect(row, field))
    .find(select => !(select?.value || "").trim()) || null;
}

function syncMagicInitiateClassOptions(changedSelect) {
  if (isManualFeatManagementEnabled()) return;
  const rows = Array.from(document.querySelectorAll("#feats-area .form-row")).filter(isMagicInitiateFeatSelectedInRow);
  const selects = rows.map(row => getMagicInitiateSelect(row, "class")).filter(Boolean);
  if (!autosaveSuspended && changedSelect?.value && selects.some(select => select !== changedSelect && select.value === changedSelect.value)) {
    changedSelect.value = "";
  }
  const used = new Set();
  selects.forEach(select => {
    const row = select.closest(".form-row");
    if (!autosaveSuspended && used.has(select.value) && isDerivedFeatRow(row) && row.dataset.featSource !== "background") {
      select.value = "";
      updateMagicInitiateSpellOptions(row);
    }
    if (select.value) used.add(select.value);
    const peers = selects.filter(peer => peer !== select).map(peer => peer.value).filter(Boolean);
    Array.from(select.options).forEach(option => { option.disabled = Boolean(option.value) && peers.includes(option.value) && option.value !== select.value; });
  });
}

function syncMagicInitiateSpellDetailButton(select) {
  const detailButton = select?.parentElement?.querySelector(".magic-initiate-spell-detail");
  const spell = SpellCatalog.getSpell(select?.value);
  if (!detailButton) return;
  detailButton.disabled = !spell;
  detailButton.title = spell ? `查看${SpellCatalog.getDisplayName(select.value)}的法術詳情` : "請先選擇法術";
}

function getMagicInitiateSpellPlaceholder(field) {
  if (field === "cantrip1") return "--戲法 #1--";
  if (field === "cantrip2") return "--戲法 #2--";
  if (field === "level1") return "--一環法術--";
  return "--法術--";
}

function renderSpellOptionsForMagicInitiate(classValue, level, placeholder, previousValue = "") { const spells=classValue?getClassSpells(classValue,level):[];return {html:'<option value="">'+escapeHtml(placeholder)+'</option>'+spells.map(spell=>'<option value="'+escapeHtml(spell.spellId)+'">'+escapeHtml(SpellCatalog.getDisplayName(spell.spellId))+'</option>').join(''),value:spells.some(spell=>spell.spellId===previousValue)?previousValue:""}; }

function updateMagicInitiateSpellOptions(row) {
  const classValue = getMagicInitiateSelect(row, "class")?.value || "";
  const preparedIds = new Set((window.SpellManagement?.getEntries({ availableOnly: true }) || []).map(entry => entry.spellId));
  [
    { field: "cantrip1", level: "cantrips" },
    { field: "cantrip2", level: "cantrips" },
    { field: "level1", level: 1 }
  ].forEach(({ field, level }) => {
    const select = getMagicInitiateSelect(row, field);
    if (!select) return;
    const previousValue = select.value;
    const preserveUnknown = select.selectedOptions[0]?.dataset.restoredUnknown === "true";
    const rendered = renderSpellOptionsForMagicInitiate(
      classValue,
      level,
      getMagicInitiateSpellPlaceholder(field),
      previousValue
    );
    select.innerHTML = rendered.html;
    if (preserveUnknown) restoreFeatSelectValue(select, previousValue);
    else select.value = rendered.value;
    syncMagicInitiateSpellDetailButton(select);
    markPreparedSpellOptions(select, preparedIds);
  });
}

function clearMagicInitiateControls(row) {
  const classSelect = getMagicInitiateSelect(row, "class");
  if (classSelect) classSelect.value = "";
  updateMagicInitiateSpellOptions(row);
}

function updateMagicInitiateControlIds(row, featIndex) {
  const controls = row?.querySelector?.(".magic-initiate-controls");
  if (!controls) return;

  [
    { field: "class", suffix: "class" },
    { field: "cantrip1", suffix: "cantrip-1" },
    { field: "cantrip2", suffix: "cantrip-2" },
    { field: "level1", suffix: "level-1" }
  ].forEach(({ field, suffix }) => {
    const select = getMagicInitiateSelect(row, field);
    if (!select) return;
    const baseId = typeof featIndex === "number" ? `feat-${featIndex}` : String(featIndex || "feat-0");
    const id = `${baseId}-magic-initiate-${suffix}`;
    select.id = id;
  });
}

function updateMagicInitiateControlsForRow(row, options = {}) {
  const { sync = true } = options;
  const controls = row?.querySelector?.(".magic-initiate-controls");
  if (!controls) return;

  const isSelected = isMagicInitiateFeatSelectedInRow(row);
  controls.classList.toggle("is-hidden", !isSelected);

  if (isSelected) {
    updateMagicInitiateSpellOptions(row);
  } else if (sync) {
    clearMagicInitiateControls(row);
  }

  if (sync) {
    syncMagicInitiateDerivedSpellRows();
    updateSpellCastingStatsVisibility();
    updateSpellsByClassLevel();
  }
}

function applyMagicInitiateBackgroundDefault(featSelect, backgroundData, options = {}) {
  const row = featSelect?.closest?.(".form-row");
  if (!row) return;

  updateMagicInitiateControlsForRow(row, { sync: false });
  const defaultClass = getMagicInitiateClassFromBackgroundFeature(backgroundData?.專長);
  const classSelect = getMagicInitiateSelect(row, "class");
  if (isMagicInitiateFeatSelectedInRow(row) && classSelect && defaultClass) {
    classSelect.value = defaultClass;
    updateMagicInitiateSpellOptions(row);
    classSelect.disabled = isDerivedFeatRow(row);
  }

  if (options.sync !== false) {
    syncMagicInitiateDerivedSpellRows();
    updateSpellCastingStatsVisibility();
    updateSpellsByClassLevel();
  }
}

function getMagicInitiateConfigs() {
  const usableSelects = new Set(getFeatUsageEntries().filter(entry => entry.usable).map(entry => entry.select));
  return Array.from(document.querySelectorAll("#feats-area .form-row"))
    .map((row, rowIndex) => {
      if (!isMagicInitiateFeatSelectedInRow(row) || !usableSelects.has(getFeatSelectFromRow(row))) return null;
      const featId = getFeatSelectFromRow(row)?.id || `feat-${rowIndex}`;
      return {
        featKey: featId,
        sourcePriority: row.dataset.featSource === "background" ? 10 : 40,
        classValue: getMagicInitiateSelect(row, "class")?.value || "",
        cantrip1: getMagicInitiateSelect(row, "cantrip1")?.value || "",
        cantrip2: getMagicInitiateSelect(row, "cantrip2")?.value || "",
        level1: getMagicInitiateSelect(row, "level1")?.value || ""
      };
    })
    .filter(Boolean);
}

function getMagicInitiateDerivedSpellSpecs() {
  const specs = [];
  getMagicInitiateConfigs().forEach((config) => {
    specs.push({
      key: `${config.featKey}-cantrip-1`,
      areaId: "cantrips-area",
      level: "cantrips",
      classValue: config.classValue,
      sourcePriority: config.sourcePriority,
      spellValue: config.cantrip1
    });
    specs.push({
      key: `${config.featKey}-cantrip-2`,
      areaId: "cantrips-area",
      level: "cantrips",
      classValue: config.classValue,
      sourcePriority: config.sourcePriority,
      spellValue: config.cantrip2
    });
    specs.push({
      key: `${config.featKey}-level-1`,
      areaId: "level1spells-area",
      level: 1,
      classValue: config.classValue,
      sourcePriority: config.sourcePriority,
      spellValue: config.level1
    });
  });
  return specs;
}

function removeMagicInitiateDerivedSpellRows() {
  // The next source reconciliation replaces derived entries atomically.
}

function spellEntryFromSourceSpec(spec) {
  const spellId = spec.spellId || spec.spellValue || "";
  const level = spec.ring === "cantrips" || spec.level === "cantrips" ? 0 : Number(spec.ring ?? spec.level);
  return {
    spellId, level, spellClass: spec.spellClass || spec.classValue || "",
    spellSource: spec.source || MAGIC_INITIATE_SOURCE, sourceKey: spec.key,
    sourceLabel: spec.sourceLabel || "來源：魔法學徒", sourceTag: spec.sourceTag || "",
    sourcePriority: spec.sourcePriority, freeUses: spec.freeUses || (spec.source ? "" : level === 1 ? 1 : ""),
    castMode: spec.castMode || (level === 0 ? "cantrip" : spec.freeUses || !spec.source ? "free-or-slot" : "slot"),
    fixedCastLevel: spec.fixedCastLevel ?? level, ritualAllowed: spec.ritualAllowed ?? (level > 0 && !spec.source),
    selectableSpellClass: spec.selectableSpellClass || ""
  };
}

function getCurrentSpellSourceEntries() {
  return [...getMagicInitiateDerivedSpellSpecs(), ...getRacialDerivedSpellSpecs(),
    ...getClassAlwaysPreparedSpellSpecs(), ...getSubclassDerivedSpellSpecs(), ...getEldritchInvocationDerivedSpellSpecs()]
    .map(spellEntryFromSourceSpec).filter(entry => entry.spellId);
}

function syncCurrentSpellSources() {
  if (!window.SpellManagement || window.SpellManagement.isManual() || window.__originSpellSyncInProgress) return;
  window.__originSpellSyncInProgress = true;
  try {
    window.SpellManagement.replaceSources(getCurrentSpellSourceEntries());
    updatePickedSpellBoxes();
    syncAgonizingBlastSelections({ notify: false });
  } finally { window.__originSpellSyncInProgress = false; }
}

function syncMagicInitiateDerivedSpellRows() { syncCurrentSpellSources(); }

const RACE_DERIVED_SPELLS = Object.freeze({
  elf: Object.freeze({
    drow: Object.freeze([{ level: 1, ring: "cantrips", spellId: "dancing-lights" }, { level: 3, ring: 1, spellId: "faerie-fire", freeUses: 1 }, { level: 5, ring: 2, spellId: "darkness", freeUses: 1 }]),
    high_elf: Object.freeze([{ level: 3, ring: 1, spellId: "detect-magic", freeUses: 1 }, { level: 5, ring: 2, spellId: "misty-step", freeUses: 1 }]),
    wood_elf: Object.freeze([{ level: 1, ring: "cantrips", spellId: "druidcraft" }, { level: 3, ring: 1, spellId: "longstrider", freeUses: 1 }, { level: 5, ring: 2, spellId: "pass-without-trace", freeUses: 1 }])
  }),
  gnome: Object.freeze({
    forest_gnome: Object.freeze([{ level: 1, ring: "cantrips", spellId: "minor-illusion" }, { level: 1, ring: 1, spellId: "speak-with-animals", freeUses: "proficiency" }]),
    rock_gnome: Object.freeze([{ level: 1, ring: "cantrips", spellId: "mending" }, { level: 1, ring: "cantrips", spellId: "prestidigitation" }])
  }),
  tiefling: Object.freeze({
    abyssal: Object.freeze([{ level: 1, ring: "cantrips", spellId: "poison-spray" }, { level: 3, ring: 1, spellId: "ray-of-sickness", freeUses: 1 }, { level: 5, ring: 2, spellId: "hold-person", freeUses: 1 }]),
    chthonic: Object.freeze([{ level: 1, ring: "cantrips", spellId: "chill-touch" }, { level: 3, ring: 1, spellId: "false-life", freeUses: 1 }, { level: 5, ring: 2, spellId: "ray-of-enfeeblement", freeUses: 1 }]),
    infernal: Object.freeze([{ level: 1, ring: "cantrips", spellId: "fire-bolt" }, { level: 3, ring: 1, spellId: "hellish-rebuke", freeUses: 1 }, { level: 5, ring: 2, spellId: "darkness", freeUses: 1 }])
  })
});

const SUBCLASS_DERIVED_SPELLS = Object.freeze({
  cleric: Object.freeze({ name: "生命領域", spells: Object.freeze([
    { level: 3, ring: 1, spellId: "bless" }, { level: 3, ring: 1, spellId: "cure-wounds" },
    { level: 3, ring: 2, spellId: "aid" }, { level: 3, ring: 2, spellId: "lesser-restoration" },
    { level: 5, ring: 3, spellId: "mass-healing-word" }, { level: 5, ring: 3, spellId: "revivify" },
    { level: 7, ring: 4, spellId: "aura-of-life" }, { level: 7, ring: 4, spellId: "death-ward" }
  ]) }),
  paladin: Object.freeze({ name: "奉獻之誓", spells: Object.freeze([
    { level: 3, ring: 1, spellId: "protection-from-evil-and-good" }, { level: 3, ring: 1, spellId: "shield-of-faith" },
    { level: 5, ring: 2, spellId: "aid" }, { level: 5, ring: 2, spellId: "zone-of-truth" }
  ]) }),
  sorcerer: Object.freeze({ name: "龍族術法", spells: Object.freeze([
    { level: 3, ring: 1, spellId: "chromatic-orb" }, { level: 3, ring: 1, spellId: "command" },
    { level: 3, ring: 2, spellId: "alter-self" }, { level: 3, ring: 2, spellId: "dragons-breath" },
    { level: 5, ring: 3, spellId: "fear" }, { level: 5, ring: 3, spellId: "fly" },
    { level: 7, ring: 4, spellId: "arcane-eye" }, { level: 7, ring: 4, spellId: "charm-monster" }
  ]) }),
  warlock: Object.freeze({ name: "邪魔", label: "邪魔宗主", spells: Object.freeze([
    { level: 3, ring: 1, spellId: "burning-hands" }, { level: 3, ring: 1, spellId: "command" },
    { level: 3, ring: 2, spellId: "scorching-ray" }, { level: 3, ring: 2, spellId: "suggestion" },
    { level: 5, ring: 3, spellId: "fireball" }, { level: 5, ring: 3, spellId: "stinking-cloud" },
    { level: 7, ring: 4, spellId: "fire-shield" }, { level: 7, ring: 4, spellId: "wall-of-fire" }
  ]) })
});

const DRUID_LAND_SPELLS = Object.freeze({
  arid: Object.freeze({ name: "旱地", spells: Object.freeze([
    { level: 3, ring: "cantrips", spellId: "fire-bolt" },
    { level: 3, ring: 1, spellId: "burning-hands" },
    { level: 3, ring: 2, spellId: "blur" },
    { level: 5, ring: 3, spellId: "fireball" },
    { level: 7, ring: 4, spellId: "blight" }
  ]) }),
  polar: Object.freeze({ name: "極地", spells: Object.freeze([
    { level: 3, ring: "cantrips", spellId: "ray-of-frost" },
    { level: 3, ring: 1, spellId: "fog-cloud" },
    { level: 3, ring: 2, spellId: "hold-person" },
    { level: 5, ring: 3, spellId: "sleet-storm" },
    { level: 7, ring: 4, spellId: "ice-storm" }
  ]) }),
  temperate: Object.freeze({ name: "溫帶", spells: Object.freeze([
    { level: 3, ring: "cantrips", spellId: "shocking-grasp" },
    { level: 3, ring: 1, spellId: "sleep" },
    { level: 3, ring: 2, spellId: "misty-step" },
    { level: 5, ring: 3, spellId: "lightning-bolt" },
    { level: 7, ring: 4, spellId: "freedom-of-movement" }
  ]) }),
  tropical: Object.freeze({ name: "熱帶", spells: Object.freeze([
    { level: 3, ring: "cantrips", spellId: "acid-splash" },
    { level: 3, ring: 1, spellId: "ray-of-sickness" },
    { level: 3, ring: 2, spellId: "web" },
    { level: 5, ring: 3, spellId: "stinking-cloud" },
    { level: 7, ring: 4, spellId: "polymorph" }
  ]) })
});

function getAreaIdForSpellRing(ring) {
  return ring === "cantrips" ? "cantrips-area" : `level${ring}spells-area`;
}

function getRaceLineageSelection(race) {
  const id = { elf: "elf-lineage", gnome: "gnome-lineage", tiefling: "tiefling-legacy" }[race];
  return id ? document.getElementById(id)?.value || "" : "";
}

function getRacialDerivedSpellSpecs() {
  const level = Number.parseInt(document.getElementById("level")?.value || "0", 10) || 0;
  const race = document.getElementById("race")?.value || "";
  const lineage = getRaceLineageSelection(race);
  if (!level || !lineage) return [];
  const raceName = document.querySelector(`#race option[value="${race}"]`)?.textContent?.trim() || "種族";
  const lineageName = document.querySelector(`#${{ elf: "elf-lineage", gnome: "gnome-lineage", tiefling: "tiefling-legacy" }[race]} option[value="${lineage}"]`)?.textContent?.trim() || "";
  const spells = [...(RACE_DERIVED_SPELLS[race]?.[lineage] || [])];
  if (race === "elf" && lineage === "high_elf") {
    const cantrip = document.getElementById("high-elf-cantrip")?.value || "";
    if (cantrip) spells.unshift({ level: 1, ring: "cantrips", spellId: cantrip });
  }
  if (race === "tiefling") spells.unshift({ level: 1, ring: "cantrips", spellId: "thaumaturgy" });
  return spells.filter(spell => level >= spell.level).map((spell, index) => ({
    ...spell,
    key: `race-${race}-${lineage}-${spell.ring}-${spell.spellId}-${index}`,
    source: RACE_SPELL_SOURCE,
    sourceName: raceName,
    sourceLabel: `來源：${raceName}（${lineageName}）`,
    sourcePriority: 20,
    spellClass: "",
    castMode: spell.freeUses ? "free-or-slot" : "slot",
    fixedCastLevel: typeof spell.ring === "number" ? spell.ring : 0,
    ritualAllowed: typeof spell.ring === "number",
    areaId: getAreaIdForSpellRing(spell.ring)
  }));
}

function getClassAlwaysPreparedSpellSpecs() {
  const levelValue = document.getElementById("level")?.value || "";
  const classValue = document.getElementById("class")?.value || "";
  const level = Number.parseInt(levelValue || "0", 10) || 0;
  if (!level) return [];
  const missionCantrips = MISSION_CANTRIP_CHOICES.flatMap(({ checkboxId, className, label, sourceLabel }) => {
    const spellId = document.getElementById(`${checkboxId}-cantrip`)?.value || "";
    if (classValue !== className || level < 1 || !document.getElementById(checkboxId)?.checked || !spellId) return [];
    return [{
      level: 1, ring: "cantrips", spellId, key: `class-${checkboxId}-cantrip`,
      source: CLASS_SPELL_SOURCE, sourceName: label, sourceLabel,
      sourcePriority: 25, spellClass: className, castMode: "cantrip", areaId: "cantrips-area"
    }];
  });
  if (classValue === "cleric") return missionCantrips;
  if (classValue === "bard") return getBardMagicalDiscoveryDerivedSpellSpecs();
  if (classValue === "druid" && level >= 1) {
    const specs = [{
      level: 1,
      ring: 1,
      spellId: "speak-with-animals",
      key: "class-druid-druidic-spells-speak-with-animals",
      source: CLASS_SPELL_SOURCE,
      sourceName: "德魯伊",
      spellClass: "druid",
      sourceLabel: "來源：德魯伊語",
      sourcePriority: 25,
      ritualAllowed: true,
      areaId: "level1spells-area"
    }];
    if (level >= 2) specs.push({
      level: 2,
      ring: 1,
      spellId: "find-familiar",
      key: "class-druid-wild-companion-find-familiar",
      source: CLASS_SPELL_SOURCE,
      sourceName: "德魯伊",
      spellClass: "druid",
      sourceLabel: "來源：荒野夥伴",
      sourcePriority: 25,
      ritualAllowed: false,
      areaId: "level1spells-area"
    });
    return [...specs, ...missionCantrips];
  }
  if (classValue === "paladin") {
    const specs = [];
    if (level >= 2) specs.push({
      level: 2,
      ring: 1,
      spellId: "divine-smite",
      key: "class-paladin-divine-smite",
      source: CLASS_SPELL_SOURCE,
      sourceName: "聖騎士",
      spellClass: "paladin",
      sourceLabel: "職業",
      sourcePriority: 25,
      sourceTag: "職業",
      freeUses: 1,
      castMode: "free-or-slot",
      fixedCastLevel: 1,
      ritualAllowed: true,
      areaId: "level1spells-area"
    });
    if (level >= 5) specs.push({
      level: 5,
      ring: 2,
      spellId: "find-steed",
      key: "class-paladin-find-steed",
      source: CLASS_SPELL_SOURCE,
      sourceName: "聖騎士",
      spellClass: "paladin",
      sourceLabel: "職業",
      sourcePriority: 25,
      sourceTag: "職業",
      freeUses: 1,
      castMode: "free-or-slot",
      fixedCastLevel: 2,
      ritualAllowed: true,
      areaId: "level2spells-area"
    });
    if (level >= 2 && document.getElementById("paladin-blessed-warrior")?.checked) {
      for (let slot = 1; slot <= 2; slot += 1) {
        const key = `class-paladin-blessed-warrior-cantrip-${slot}`;
        const choice = window.SpellManagement?.collectClassFeatureCantrips()[key] || "";
        specs.push({
          level: 2,
          ring: "cantrips",
          spellId: choice,
          key,
          source: CLASS_SPELL_SOURCE,
          sourceName: "牧師",
          sourceLabel: "受祝福的勇士",
          sourcePriority: 25,
          sourceTag: "職業",
          selectableSpellClass: "cleric",
          spellClass: "cleric",
          areaId: "cantrips-area"
        });
      }
    }
    return specs;
  }
  if (classValue !== "ranger") return [];
  const freeUses = !level ? "" : level >= 5 ? 3 : 2;
  const specs = [{
    level: 1,
    ring: 1,
    spellId: "hunters-mark",
    key: "class-ranger-favored-enemy-hunters-mark",
    source: CLASS_SPELL_SOURCE,
    sourceName: "遊俠",
    spellClass: "ranger",
    sourceLabel: "來源：宿敵",
    sourcePriority: 25,
    areaId: "level1spells-area",
    freeUses,
    castMode: "free-or-slot",
    fixedCastLevel: 1,
    ritualAllowed: true
  }];
  if (level >= 2 && document.getElementById("ranger-druidic-warrior")?.checked) {
    for (let slot = 1; slot <= 2; slot += 1) {
      const key = `class-ranger-druidic-warrior-cantrip-${slot}`;
      const choice = window.SpellManagement?.collectClassFeatureCantrips()[key] || "";
      specs.push({
        level: 2,
        ring: "cantrips",
        spellId: choice,
        key,
        source: CLASS_SPELL_SOURCE,
        sourceName: "德魯伊",
        sourceLabel: "德魯伊教",
        sourcePriority: 25,
        sourceTag: "職業",
        selectableSpellClass: "druid",
        spellClass: "druid",
        areaId: "cantrips-area"
      });
    }
  }
  return specs;
}

function getSubclassDerivedSpellSpecs() {
  const level = Number.parseInt(document.getElementById("level")?.value || "0", 10) || 0;
  const classValue = document.getElementById("class")?.value || "";
  if (level < 3) return [];
  let subclass = SUBCLASS_DERIVED_SPELLS[classValue];
  if (classValue === "druid") {
    const land = document.getElementById("druid-land")?.value || "";
    const landData = DRUID_LAND_SPELLS[land];
    if (!landData) return [];
    subclass = { name: `大地結社・${landData.name}`, spells: landData.spells };
  }
  if (!subclass) return [];
  const className = document.querySelector(`#class option[value="${classValue}"]`)?.textContent?.trim() || "職業";
  return subclass.spells.filter(spell => level >= spell.level).map((spell, index) => ({
    ...spell,
    key: `subclass-${classValue}-${subclass.name}-${spell.ring}-${spell.spellId}-${index}`,
    source: SUBCLASS_SPELL_SOURCE,
    sourceName: className,
    spellClass: classValue,
    sourceLabel: `來源：${subclass.label || subclass.name}`,
    sourcePriority: 30,
    ritualAllowed: true,
    areaId: getAreaIdForSpellRing(spell.ring)
  }));
}

function getEldritchInvocationDerivedSpellSpecs() {
  if (document.getElementById("class")?.value !== "warlock") return [];
  const specs = eldritchInvocations.flatMap((invocation, index) => {
    if (!isWarlockInvocationAvailable(invocation) || !invocation.spellId || !document.getElementById(getInvocationCheckboxId(index, 1))?.checked) return [];
    const spell = SpellCatalog.getSpell(invocation.spellId);
    if (!spell) return [];
    const ring = spell.level === 0 ? "cantrips" : spell.level;
    return [{
      ring,
      spellId: invocation.spellId,
      key: `invocation-${invocation.name}-${invocation.spellId}`,
      source: ELDRITCH_INVOCATION_SPELL_SOURCE,
      sourceName: "契術師",
      spellClass: "warlock",
      sourceLabel: `來源：魔能祈喚（${invocation.name}）`,
      sourcePriority: 35,
      sourceTag: invocation.spellUse === "at-will" ? "隨意" : "職業",
      freeUses: invocation.spellUse === "once" ? 1 : "",
      castMode: invocation.spellUse === "at-will" ? "at-will" : "free-or-slot",
      fixedCastLevel: spell.level,
      ritualAllowed: false,
      areaId: getAreaIdForSpellRing(ring)
    }];
  });

  if (!hasWarlockInvocation("書之魔契") || !hasCompletePactTomeSpellSelection()) return specs;
  const tomeSpells = [
    ...pactTomeSpellSelection.cantrips.map(spellId => ({ ring: "cantrips", spellId })),
    ...pactTomeSpellSelection.rituals.map(spellId => ({ ring: 1, spellId }))
  ];
  return specs.concat(tomeSpells.map((spell, index) => ({
    ...spell,
    key: `pact-tome-${spell.ring}-${index}`,
    source: PACT_TOME_SPELL_SOURCE,
    sourceName: "契術師",
    spellClass: "warlock",
    sourceLabel: "來源：書之魔契",
    sourcePriority: 36,
    sourceTag: "書契",
    castMode: "slot",
    fixedCastLevel: typeof spell.ring === "number" ? spell.ring : 0,
    ritualAllowed: true,
    areaId: getAreaIdForSpellRing(spell.ring)
  })));
}

function findFullSpellName(_ring, spellId) { return SpellCatalog.getDisplayName(spellId) || ""; }

function syncOriginAndSubclassDerivedSpellRows() { syncCurrentSpellSources(); }

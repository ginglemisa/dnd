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
  return row?.querySelector?.("select:not([id*='magic-initiate']):not([data-feat-category])") || null;
}

function isMagicInitiateFeatSelectedInRow(row) {
  return getFeatSelectFromRow(row)?.value === MAGIC_INITIATE_FEAT_NAME;
}

function hasMagicInitiateFeatSelected() {
  return hasSelectedFeat(MAGIC_INITIATE_FEAT_NAME);
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

// defaultClass：背景魔法學徒的法術列表（職業 ID，背景內容檔的 feat.spellList）；空字串時不預設。
function applyMagicInitiateBackgroundDefault(featSelect, defaultClass, options = {}) {
  const row = featSelect?.closest?.(".form-row");
  if (!row) return;

  updateMagicInitiateControlsForRow(row, { sync: false });
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

function getCurrentSpellSourceSpecs() {
  return [...getMagicInitiateDerivedSpellSpecs(), ...getRacialDerivedSpellSpecs(),
    ...getClassAlwaysPreparedSpellSpecs(), ...getSubclassDerivedSpellSpecs(), ...getEldritchInvocationDerivedSpellSpecs()];
}

function getCurrentSpellSourceEntries() {
  return getCurrentSpellSourceSpecs().map(spellEntryFromSourceSpec).filter(entry => entry.spellId);
}

// 準備法術視窗的「戲法」篩選：來源能力（如受祝福的勇士）給予戲法即算，戲法尚未選定也算。
function hasCurrentSpellSourceCantrips() {
  return getCurrentSpellSourceSpecs().some(spec => spellEntryFromSourceSpec(spec).level === 0);
}

// 職業選項給予的自選戲法（受祝福的勇士、德魯伊教戰士）：勾選時例外開放該法表的戲法，
// 名額為選項的戲法欄；選擇只存在這些欄位（classFeatureCantrips），不加入玩家準備清單。
// 自動管理才適用；手動管理不限法表。
function getClassFeatureCantripGrant() {
  const specs = getClassAlwaysPreparedSpellSpecs().filter(spec => spec.ring === "cantrips" && spec.selectableSpellClass);
  if (!specs.length) return null;
  return { spellClass: specs[0].selectableSpellClass, label: specs[0].sourceLabel,
    slots: specs.map(spec => ({ key: spec.key, spellId: spec.spellId || "" })) };
}

function isClassFeatureCantripGrantSpell(grant, spellId) {
  return Boolean(grant) && SpellCatalog.getSpell(spellId)?.level === 0
    && SpellCatalog.getClassIds(spellId).includes(grant.spellClass);
}

function setClassFeatureCantripChoice(key, spellId) {
  const control = window.SpellManagement?.getClassFeatureCantripControl(key);
  if (!control || control.value === spellId) return false;
  control.value = spellId;
  control.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
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

function getAreaIdForSpellRing(ring) {
  return ring === "cantrips" ? "cantrips-area" : `level${ring}spells-area`;
}

// 種族法術（種族內容檔）：選了血統選項後，依序為種族特質的法術、血統選項的自選戲法、血統法術；
// 來源識別碼含順序編號，列在 race-id-baseline.json。
function getRacialDerivedSpellSpecs() {
  const level = Number.parseInt(document.getElementById("level")?.value || "0", 10) || 0;
  const race = document.getElementById("race")?.value || "";
  const rules = window.getRaceRules?.(race);
  const lineage = rules?.choice ? document.getElementById(rules.choice.id)?.value || "" : "";
  const option = window.getRaceChoiceOption?.(race, lineage);
  if (!level || !lineage || !option) return [];
  const raceName = rules.name;
  const lineageName = option.label;
  const toSpec = spell => ({ level: spell.level, ring: spell.ring, spellId: spell.spellId, ...(spell.freeUses ? { freeUses: spell.freeUses === "proficiencyBonus" ? "proficiency" : spell.freeUses } : {}) });
  const cantrip = option.cantripChoice ? document.getElementById(option.cantripChoice.field)?.value || "" : "";
  const spells = [
    ...rules.spells.map(toSpec),
    ...(cantrip ? [{ level: 1, ring: "cantrips", spellId: cantrip }] : []),
    ...option.spells.map(toSpec)
  ];
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
  return [...getClassBaseSpellSpecs(classValue, level), ...getClassFeatureCantripSpecs(classValue, level)];
}

// 職業選項給予的自選戲法欄（getClassFeatureCantripChoices，例如受祝福的勇士 2 個牧師戲法）。
function getClassFeatureCantripSpecs(classValue, level) {
  const chosen = window.SpellManagement?.collectClassFeatureCantrips() || {};
  return getClassFeatureCantripChoices(classValue).flatMap(choice => {
    if (level < choice.level || !document.getElementById(choice.checkboxId)?.checked) return [];
    return choice.keys.map(key => ({
      level: choice.level,
      ring: "cantrips",
      spellId: chosen[key] || "",
      key,
      source: CLASS_SPELL_SOURCE,
      sourceName: choice.spellClassName,
      sourceLabel: choice.label,
      sourcePriority: 25,
      sourceTag: "職業",
      selectableSpellClass: choice.spellClass,
      spellClass: choice.spellClass,
      areaId: "cantrips-area"
    }));
  });
}

function getClassBaseSpellSpecs(classValue, level) {
  const missionCantrips = getMissionCantripChoices().flatMap(({ checkboxId, className, label, sourceLabel }) => {
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
    return specs;
  }
  if (classValue !== "ranger") return [];
  // 宿敵免費施放次數：遊俠特性表「宿敵」欄（class-content.generated.js）。
  const freeUses = !level ? "" : window.getClassProgressionValue?.("ranger", "favoredEnemy", level) ?? "";
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
  return specs;
}

// 子職法術：目前子職內容檔能力的 spells（或依下拉選單的 spellsByChoice，例如大地結社地貌），達到法術的等級才給予。
// 來源識別碼「subclass-職業-名稱-環階-法術-序號」寫進角色法術清單，名稱為 spellSourceKey 或子職名稱
// （依選項時接「・選項名稱」），序號為達到等級的法術中的位置；class-id-baseline.json 把關名稱。
function getSubclassDerivedSpellSpecs() {
  const level = Number.parseInt(document.getElementById("level")?.value || "0", 10) || 0;
  const classValue = document.getElementById("class")?.value || "";
  const subclass = window.getSelectedSubclass?.(classValue);
  if (!subclass) return [];
  const className = document.querySelector(`#class option[value="${classValue}"]`)?.textContent?.trim() || "職業";
  return subclass.features.filter(feature => level >= feature.level).flatMap(feature => {
    let name = feature.spellSourceKey || subclass.name;
    let spells = feature.spells || [];
    if (feature.spellsByChoice) {
      const value = document.getElementById(feature.spellsByChoice.control)?.value || "";
      const choice = feature.spellsByChoice.choices.find(item => item.value === value);
      if (!choice) return [];
      name = `${name}・${choice.name}`;
      spells = choice.spells;
    }
    const label = feature.spellsByChoice ? name : subclass.name;
    return spells.filter(spell => level >= (spell.level ?? feature.level)).flatMap((spell, index) => {
      const spellLevel = SpellCatalog.getSpell(spell.id)?.level;
      if (!Number.isInteger(spellLevel)) return [];
      const ring = spellLevel === 0 ? "cantrips" : spellLevel;
      return [{
        level: spell.level ?? feature.level,
        ring,
        spellId: spell.id,
        key: `subclass-${classValue}-${name}-${ring}-${spell.id}-${index}`,
        source: SUBCLASS_SPELL_SOURCE,
        sourceName: className,
        spellClass: classValue,
        sourceLabel: `來源：${label}`,
        sourcePriority: 30,
        ritualAllowed: true,
        areaId: getAreaIdForSpellRing(ring)
      }];
    });
  });
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

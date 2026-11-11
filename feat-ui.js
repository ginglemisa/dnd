/**
 * 專長列 UI：選單、自動／自行管理、子選項、資格警示、收合記憶與衍生專長列
 * （傳統 script，不使用 defer）。專長資料讀 feat-content.generated.js（character-rules.js 的 getFeatRules／getFeatText）。
 *
 * - 自 index.html 原封搬出，於第一段內嵌角色卡 script 之前同步載入，
 *   維持全域函式名稱供 index.html、quick-build.js、tabletop-mode.js 等呼叫。
 * - 魔法學徒子選項與衍生法術在 spell-sources.js。
 * - 只放函式與狀態宣告，不在頂層執行任何初始化。
 */
// 專長選單的選項（專長 ID 與選單文字），依專長選單順序；filter 以專長規則篩選。
function getFeatMenuOptions(filter = () => true) {
  return Object.entries(window.getAllFeatRules?.() || {}).filter(([, rule]) => filter(rule)).map(([id]) => ({ value: id, label: window.getFeatText(id).label }));
}

function getFeatOptionsHtml() {
  return `<option value="">-- 請選擇 --</option>` +
    getFeatMenuOptions().map(opt => `<option value="${opt.value}">${opt.label}</option>`).join("");
}

function isManualFeatManagementEnabled() {
  return document.getElementById("manual-feat-management")?.checked === true;
}

function createManualFeatGuidance() {
  const guidance = document.createElement("div");
  guidance.className = "manual-feat-guidance";
  const message = document.createElement("p");
  message.textContent = "請至首頁最下方自行管理專長。";
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "前往自行管理";
  button.addEventListener("click", () => {
    button.closest(".app-dialog")?.querySelector(".app-dialog__close")?.click();
    Promise.resolve(window.onboardingTour?.jumpToTarget({
      tab: "basic", selector: "#feat-management-section",
      focusSelector: "#feats-area select:not(:disabled), #feats-area .feat-disclosure-toggle, #feat-add-empty"
    })).catch(error => console.warn("無法前往自行管理專長：", error));
  });
  guidance.append(message, button);
  return guidance;
}

// 自行管理時來源選單照常顯示（停用、保留自動那套的值），旁邊加上前往自行管理的提示。
function syncManualFeatGuidance() {
  const manual = isManualFeatManagementEnabled();
  document.querySelectorAll("[data-feat-choice]").forEach(wrap => {
    const styleClass = ["ranger", "paladin"].find(cls => wrap.dataset.featChoice === `fighting-style-${cls}`);
    wrap.hidden = Boolean(styleClass) && !document.getElementById(`${styleClass}-fighting-style`)?.checked;
    let guidance = wrap.querySelector(":scope > .manual-feat-guidance");
    if (!guidance && manual) {
      guidance = createManualFeatGuidance();
      wrap.appendChild(guidance);
    }
    if (guidance) guidance.hidden = !manual;
  });
  ["background", "race"].forEach(tab => {
    const panel = document.querySelector(`[data-feature-panel="${tab}"]`);
    if (!panel) return;
    let guidance = panel.querySelector(":scope > .manual-feat-guidance");
    if (!guidance) {
      guidance = createManualFeatGuidance();
      panel.appendChild(guidance);
    }
    guidance.hidden = !manual;
  });
}

// 自動與自行管理是兩套各自保存的專長：#feats-area 只放目前模式那一套，另一套留在這裡。
let manualFeatSetDisplayed = false;
// 自行管理那套（不在畫面上時）：collectManagedFeatRows 的格式。
let manualFeatRowEntries = [];
// 自動那套來源列的魔法學徒子選項（不在畫面上時）：控制項 ID → 值。來源列的專長本身以 feat-choice-* 為準。
let automaticFeatMagicValues = {};
const DERIVED_FEAT_MAGIC_ID_PATTERN = /^derived-feat-(.+)-magic-initiate-(?:class|cantrip-1|cantrip-2|level-1)$/u;
const MAGIC_INITIATE_FIELDS = ["class", "cantrip1", "cantrip2", "level1"];
// 自行管理列的分類：專長類別（character-rules.js 的 getFeatTypes），另有只放存檔裡不認得的舊專長名稱的「其他」。
const OTHER_FEAT_CATEGORY = "other";
// 自行管理列換分類或換專長前的選擇（{ categories：分類 → 專長, magic：專長 → 魔法學徒子選項, otherValue：舊專長名稱 }），
// 只在頁面開著時記住，不寫入 autosave、JSON 或分享；載入角色時清空，切換自動／自行管理時跟著列保留。
const manualFeatRowMemory = new WeakMap();
let manualFeatRowMemories = [];

function readMagicInitiateValues(row) {
  return Object.fromEntries(MAGIC_INITIATE_FIELDS.map(field => [field, getMagicInitiateSelect(row, field)?.value || ""]));
}

function getManualFeatCategorySelect(row) {
  return row?.querySelector?.("select[data-feat-category]") || null;
}

function getManualFeatRowMemory(row) {
  if (!manualFeatRowMemory.has(row)) manualFeatRowMemory.set(row, { categories: {}, magic: {}, otherValue: "" });
  return manualFeatRowMemory.get(row);
}

// 存檔列的分類：已選的專長以專長本身的類別為準（不認得的舊名稱為「其他」），未選專長時沿用存檔的分類。
function getManualFeatCategory(value, savedType) {
  if (value) return window.getFeatRules?.(value)?.type || OTHER_FEAT_CATEGORY;
  return window.getFeatTypes?.().includes(savedType) ? savedType : "";
}

function getManualFeatCategoryOptionsHtml(includeOther) {
  return '<option value="">-- 請選擇分類 --</option>'
    + (window.getFeatTypes?.() || []).map(type => `<option value="${escapeHtml(type)}">${escapeHtml(window.getFeatTypeLabel(type).short)}</option>`).join("")
    + (includeOther ? `<option value="${OTHER_FEAT_CATEGORY}">其他</option>` : "");
}

// 自行管理的專長選單只列該分類的專長，選項不加類別字樣；「其他」只有列上的舊專長名稱（由 restoreFeatSelectValue 加入）。
function getManualFeatOptionsHtml(category) {
  if (!category) return '<option value="">請先選擇分類</option>';
  return '<option value="">-- 請選擇 --</option>' + Object.entries(window.getAllFeatRules?.() || {}).filter(([, rule]) => rule.type === category)
    .map(([id, rule]) => `<option value="${escapeHtml(id)}">${escapeHtml(window.formatContentSourceName(id, rule.source))}</option>`).join("");
}

function collectFeatRowEntries(rows) {
  return rows.map(row => ({
    source: row.dataset.featSource || "",
    key: row.dataset.sourceKey || "",
    label: row.querySelector(".feat-row-head label")?.dataset.featSourceLabel || row.querySelector(".feat-row-head label")?.textContent || "",
    type: getManualFeatCategorySelect(row)?.value || "",
    value: getFeatSelectFromRow(row)?.value || "",
    magic: readMagicInitiateValues(row)
  }));
}

// 自行管理那套的列，不論目前是哪個模式。
function collectManagedFeatRows() {
  if (!manualFeatSetDisplayed) return manualFeatRowEntries.map(entry => ({ ...entry, magic: { ...entry.magic } }));
  return collectFeatRowEntries(Array.from(document.querySelectorAll("#feats-area > .form-row")));
}

// 存檔的列一律成為「專長N」，依原本順序保留選擇與魔法學徒子選項（舊存檔的來源列也一樣）。
function normalizeManagedFeatEntries(entries) {
  return entries.filter(entry => entry && typeof entry === "object").map(entry => {
    const value = entry.value == null ? "" : String(entry.value);
    return {
      source: "", key: "", label: "",
      type: getManualFeatCategory(value, entry.type),
      value,
      magic: Object.fromEntries(MAGIC_INITIATE_FIELDS.map(field => [field, entry.magic?.[field] == null ? "" : String(entry.magic[field])]))
    };
  });
}

// 沒有 __managedFeatRows 的舊存檔：feat-N 欄位組成的列。
function getFlatFeatRowEntries(data) {
  const indices = new Set(Object.keys(data).flatMap(key => /^feat-(\d+)(?:-|$)/u.exec(key)?.slice(1).map(Number) || []));
  const count = Number.parseInt(data["feats-area-count"], 10) || 0;
  for (let index = 0; index < count; index += 1) indices.add(index);
  return Array.from(indices).sort((a, b) => a - b).map(index => ({
    value: data[`feat-${index}`],
    magic: { class: data[`feat-${index}-magic-initiate-class`], cantrip1: data[`feat-${index}-magic-initiate-cantrip-1`],
      cantrip2: data[`feat-${index}-magic-initiate-cantrip-2`], level1: data[`feat-${index}-magic-initiate-level-1`] }
  }));
}

// 自動那套來源列的魔法學徒子選項；sources 省略時為全部來源。
function collectDerivedFeatMagicValues(sources = null) {
  if (manualFeatSetDisplayed) {
    const raceKeys = new Set(getRaceFeatChoiceTraits().map(trait => trait.feat.key));
    const sourceOf = key => key === "background" ? "background" : raceKeys.has(key) ? "race" : /^lessons-\d+$/u.test(key) ? "invocation" : "class";
    return Object.fromEntries(Object.entries(automaticFeatMagicValues)
      .filter(([id]) => !sources || sources.includes(sourceOf(DERIVED_FEAT_MAGIC_ID_PATTERN.exec(id)[1]))));
  }
  return Object.fromEntries(Array.from(document.querySelectorAll("#feats-area > [data-feat-source] [data-magic-initiate-field]"))
    .filter(select => select.id && (!sources || sources.includes(select.closest("[data-feat-source]").dataset.featSource)))
    .map(select => [select.id, select.value]));
}

// 還原自動那套來源列的魔法學徒子選項（先職業再法術）；自行管理時存回自動那套，切回自動時再套用。
function restoreDerivedFeatMagicValues(values, setValue = (control, value) => { control.value = value; return true; }) {
  const entries = Object.entries(values || {}).filter(([id, value]) => DERIVED_FEAT_MAGIC_ID_PATTERN.test(id) && typeof value === "string")
    .sort(([a], [b]) => Number(!a.endsWith("-class")) - Number(!b.endsWith("-class")));
  if (manualFeatSetDisplayed) {
    entries.forEach(([id, value]) => { automaticFeatMagicValues[id] = value; });
    return;
  }
  entries.forEach(([id, value]) => {
    const control = document.getElementById(id);
    if (control && setValue(control, value)) control.dispatchEvent(new Event("change"));
  });
}

// 存檔用：自行管理時，只留目前仍有來源列的自動那套子選項。
function getStoredAutomaticFeatMagicValues() {
  if (!manualFeatSetDisplayed) return {};
  const keys = new Set(getDerivedFeatSpecs().map(spec => spec.key));
  return Object.fromEntries(Object.entries(automaticFeatMagicValues).filter(([id]) => keys.has(DERIVED_FEAT_MAGIC_ID_PATTERN.exec(id)[1])));
}

function restoreFeatSelectValue(select, value) {
  if (!select) return;
  const savedValue = value == null ? "" : String(value);
  if (savedValue && !Array.from(select.options).some(option => option.value === savedValue)) {
    const option = new Option(`${savedValue}（舊資料）`, savedValue);
    option.dataset.restoredUnknown = "true";
    select.add(option);
  }
  select.value = savedValue;
}

function normalizeLegacyFeatState(data) {
  if (Number(data.__spellManagement?.version) >= 2) return data;
  const hasValue = value => value !== undefined && value !== null && value !== "";
  const result = { ...data };
  if (Array.isArray(data.__managedFeatRows)) {
    result.__managedFeatRows = data.__managedFeatRows.filter(entry => !entry || typeof entry !== "object"
      || hasValue(entry.source) || hasValue(entry.key) || hasValue(entry.value)
      || Object.values(entry.magic || {}).some(hasValue)
      || Object.entries(entry).some(([key, value]) => !["source", "key", "value", "label", "magic"].includes(key) && hasValue(value)));
    result["feats-area-count"] = result.__managedFeatRows.filter(entry => !entry?.source).length;
    return result;
  }
  if (!Object.hasOwn(data, "feats-area-count")) return data;
  const indices = new Set(Object.keys(data).flatMap(key => /^feat-(\d+)(?:-|$)/u.exec(key)?.slice(1).map(Number) || []));
  const count = Number.parseInt(data["feats-area-count"], 10) || 0;
  for (let index = 0; index < count; index += 1) indices.add(index);
  const rows = Array.from(indices).sort((a, b) => a - b).map(index => {
    const pattern = new RegExp(`^feat-${index}(?:-|$)`, "u");
    return Object.entries(data).filter(([key]) => pattern.test(key));
  }).filter(fields => fields.some(([, value]) => hasValue(value)));
  Object.keys(result).filter(key => /^feat-\d+(?:-|$)/u.test(key)).forEach(key => { delete result[key]; });
  rows.forEach((fields, index) => fields.forEach(([key, value]) => { result[key.replace(/^feat-\d+/u, `feat-${index}`)] = value; }));
  result["feats-area-count"] = rows.length;
  return result;
}

// memories：各列的暫時記憶（切換自動／自行管理時保留），依列順序；載入存檔時為空。
function restoreManagedFeatRows(entries, memories = []) {
  document.getElementById("feats-area").replaceChildren();
  normalizeManagedFeatEntries(entries).forEach((entry, index) => {
    const row = createSingleFeatRow();
    const memory = memories[index] || getManualFeatRowMemory(row);
    if (entry.type === OTHER_FEAT_CATEGORY && !memory.otherValue) memory.otherValue = entry.value;
    manualFeatRowMemory.set(row, memory);
    const category = getManualFeatCategorySelect(row);
    category.innerHTML = getManualFeatCategoryOptionsHtml(Boolean(memory.otherValue));
    category.value = entry.type;
    category.dataset.previousCategory = category.value;
    const select = getFeatSelectFromRow(row);
    setCharacterHtml(select, getManualFeatOptionsHtml(category.value));
    restoreFeatSelectValue(select, entry.value);
    select.dataset.previousValue = select.value;
    updateMagicInitiateControlsForRow(row, { sync: false });
    MAGIC_INITIATE_FIELDS.forEach(field => {
      const control = getMagicInitiateSelect(row, field);
      restoreFeatSelectValue(control, entry.magic[field]);
      if (field === "class") updateMagicInitiateSpellOptions(row);
    });
  });
  refreshFeatRows();
}

// 自行管理列換了專長（含換分類帶出的專長）：先記住原專長的魔法學徒子選項，再帶回新專長先前的子選項。
function applyManualFeatSelection(row, previousValue) {
  const select = getFeatSelectFromRow(row);
  const memory = getManualFeatRowMemory(row);
  if (previousValue) memory.magic[previousValue] = readMagicInitiateValues(row);
  const magic = (select.value && memory.magic[select.value]) || {};
  updateFeatDesc(select.id, row.querySelector(":scope > .output").id);
  updateMagicInitiateControlsForRow(row, { sync: false });
  MAGIC_INITIATE_FIELDS.forEach(field => {
    const control = getMagicInitiateSelect(row, field);
    if (control) control.value = Array.from(control.options).some(option => option.value === magic[field]) ? magic[field] : "";
    if (field === "class") updateMagicInitiateSpellOptions(row);
  });
  updateMagicInitiateControlsForRow(row);
  if (typeof updateACDisplay === "function") updateACDisplay();
  if (typeof populateHandAttacks === "function") populateHandAttacks();
  syncInitiativeAfterFeatSelectionChange(select, previousValue);
  refreshFeatDerivedEffects();
  scheduleSaveAllFields();
}

// 自行管理列換分類：記住原分類選的專長，帶回新分類先前選的專長（「其他」為舊專長名稱）。
function applyManualFeatCategory(row) {
  const category = getManualFeatCategorySelect(row);
  const select = getFeatSelectFromRow(row);
  const memory = getManualFeatRowMemory(row);
  const previousValue = select.dataset.previousValue || "";
  if (category.dataset.previousCategory) memory.categories[category.dataset.previousCategory] = select.value;
  category.dataset.previousCategory = category.value;
  setCharacterHtml(select, getManualFeatOptionsHtml(category.value));
  const next = category.value === OTHER_FEAT_CATEGORY ? memory.otherValue : memory.categories[category.value] || "";
  if (category.value === OTHER_FEAT_CATEGORY) restoreFeatSelectValue(select, next);
  else select.value = Array.from(select.options).some(option => option.value === next) ? next : "";
  select.disabled = !category.value;
  applyManualFeatSelection(row, previousValue);
}

// 切換模式只換掉畫面上那一套，不轉換、不合併；離開的那套留在記憶中，也照常存檔。
function updateFeatManagementMode() {
  const manual = isManualFeatManagementEnabled();
  if (manual !== manualFeatSetDisplayed) {
    const area = document.getElementById("feats-area");
    if (manual) {
      automaticFeatMagicValues = collectDerivedFeatMagicValues();
      manualFeatSetDisplayed = true;
      restoreManagedFeatRows(manualFeatRowEntries, manualFeatRowMemories);
    } else {
      manualFeatRowMemories = getManualFeatRows().map(row => manualFeatRowMemory.get(row) || null);
      manualFeatRowEntries = collectManagedFeatRows();
      manualFeatSetDisplayed = false;
      area.replaceChildren();
      syncDerivedFeatRows();
      restoreDerivedFeatMagicValues(automaticFeatMagicValues);
    }
  }
  syncDerivedFeatRows();
  scheduleStructuralSaveAllFields();
}

// 載入完整存檔前回到自動那套並清空兩套的記憶；自動那套還原後再由 restoreFeatManagementState 決定模式。
function resetFeatManagementState() {
  document.getElementById("manual-feat-management").checked = false;
  manualFeatSetDisplayed = false;
  manualFeatRowEntries = [];
  manualFeatRowMemories = [];
  automaticFeatMagicValues = {};
  document.getElementById("feats-area").replaceChildren();
}

// 自動那套已依 feat-choice-*／derived-feat-* 還原在畫面上時呼叫。
// 沒有 __managedFeatRows 的舊存檔：手動模式，或自動模式卻有選了值的「專長N」殘留列時，
// 自行管理那套為原本畫面上的來源列加上這些列（依原本順序），並切成自行管理，讓數值維持不變。
function restoreFeatManagementState(data, requestedManual) {
  let entries = Array.isArray(data.__managedFeatRows) ? data.__managedFeatRows : [];
  let manual = requestedManual;
  if (!Array.isArray(data.__managedFeatRows)) {
    const flatRows = getFlatFeatRowEntries(data).filter(entry => requestedManual || (entry.value != null && entry.value !== ""));
    if (requestedManual || flatRows.length) {
      entries = [...collectFeatRowEntries(Array.from(document.querySelectorAll("#feats-area > [data-feat-source]"))), ...flatRows];
      manual = true;
    }
  }
  manualFeatRowEntries = normalizeManagedFeatEntries(entries);
  document.getElementById("manual-feat-management").checked = manual;
  updateFeatManagementMode();
}

function getClassFeatGrantLevels(cls) {
  return (window.getClassFeatureRules?.(cls) || []).filter(feature => feature.feat === "level").map(feature => feature.level);
}

// 專長選單接在給予專長的能力段落內：屬性值提升（feat: level）、戰鬥風格（feat: style，或勾選後給予專長的選項）。
function getClassFeatChoiceSection(spec) {
  const cls = document.getElementById("class")?.value || "";
  const feature = (window.getClassFeatureRules?.(cls) || []).find(item => item.level === spec.level && (spec.type === "level"
    ? item.feat === "level"
    : item.feat === "style" || (item.options || []).some(option => option.featChoice)));
  return feature ? document.querySelector(`#classFeatures section[data-feature-id="${feature.id}"]`) : null;
}

function getFeatChoiceSpecs() {
  const cls = document.getElementById("class")?.value || "";
  const level = Number(document.getElementById("level")?.value || 0);
  const specs = [];
  // 種族特質給予的起源專長（種族內容檔的 feat，例如人類的靈活人才）。
  getRaceFeatChoiceTraits(document.getElementById("race")?.value || "").forEach(trait => {
    specs.push({ key: trait.feat.key, source: "race", label: trait.feat.label, traitName: trait.name, type: "origin", active: true });
  });
  if (cls === "fighter" && level >= 1) {
    specs.push({ key: "fighting-style-fighter", source: "class", label: "戰鬥風格", type: "style", level: 1, active: true });
    if (window.hasClassFeature?.("fighter", "fighter-additional-fighting-style", level)) specs.push({ key: "fighting-style-fighter-2", source: "class", label: "戰鬥風格2", headingLabel: "額外戰鬥風格", type: "style", level: 7, active: true });
  }
  if (["paladin", "ranger"].includes(cls) && level >= 2) {
    specs.push({ key: `fighting-style-${cls}`, source: "class", label: "戰鬥風格", type: "style", level: 2, active: Boolean(document.getElementById(`${cls}-fighting-style`)?.checked) });
  }
  // 屬性值提升等給予專長的等級：職業內容檔中標記 feat: level 的能力。
  getClassFeatGrantLevels(cls).filter(grantLevel => level >= grantLevel).forEach(grantLevel => {
    specs.push({ key: `${cls}-level-${grantLevel}`, source: "class", label: `等級 ${grantLevel} 專長`, type: "level", level: grantLevel, active: true });
  });
  if (cls === "warlock" && level >= 2) {
    document.querySelectorAll('#eldritch-invocations-output input[data-invocation-name="原初之一教習"]:checked:not(:disabled)').forEach(input => {
      specs.push({ key: `lessons-${input.dataset.invocationSlot}`, source: "invocation", label: `原初之一教習 ${input.dataset.invocationSlot}：起源專長`, type: "origin", active: true, checkboxId: input.id });
    });
  }
  return specs;
}

function getFeatChoiceId(key) { return `feat-choice-${key}`; }

function getFeatChoiceOptions(spec) {
  return getFeatMenuOptions(rule => spec.type === "level" ? rule.type !== "style" : rule.type === spec.type);
}

function appendFeatChoice(container, spec, previousValue = "") {
  if (!container) return;
  const wrap = document.createElement("div");
  wrap.className = "form-row";
  wrap.dataset.featChoice = spec.key;
  const label = document.createElement("label");
  label.htmlFor = getFeatChoiceId(spec.key);
  label.textContent = spec.label;
  const select = document.createElement("select");
  select.id = label.htmlFor;
  select.innerHTML = '<option value="">-- 請選擇專長 --</option>' + getFeatChoiceOptions(spec).map(option => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join("");
  select.value = previousValue;
  select.addEventListener("change", () => {
    const hadAlertFeat = hasSelectedFeat(ALERT_FEAT_NAME);
    syncDerivedFeatRows();
    if (!autosaveSuspended) syncInitiativeForAlertFeatPresenceChange(hadAlertFeat, hasSelectedFeat(ALERT_FEAT_NAME));
    scheduleSaveAllFields();
  });
  const field = document.createElement("div");
  field.className = "feat-choice-control";
  const view = document.createElement("button");
  view.type = "button";
  view.className = "feat-choice-view";
  view.textContent = "查看";
  view.addEventListener("click", () => showFeatChoiceDetail(select, view));
  field.append(select, view);
  if (spec.type === "level" || spec.source === "race") {
    select.setAttribute("aria-label", spec.label);
    if (spec.source === "race") select.options[0].textContent = "起源專長";
    wrap.append(field);
  } else {
    wrap.append(label, field);
  }
  const afterChoice = container.querySelector(":scope > [data-after-feat-choice]");
  if (afterChoice) afterChoice.before(wrap);
  else container.append(wrap);
}

function renderClassFeatChoices() {
  getFeatChoiceSpecs().filter(spec => spec.source === "class").forEach(spec => appendFeatChoice(getClassFeatChoiceSection(spec), spec));
}

// 給予起源專長的種族特質；省略 race 時為全部種族。
function getRaceFeatChoiceTraits(race = null) {
  const rules = race === null ? Object.values(window.getAllRaceRules?.() || {}) : [window.getRaceRules?.(race)].filter(Boolean);
  return rules.flatMap(rule => rule.traits.filter(trait => trait.feat));
}

// 種族專長選單放在種族選項列的「<專長 key>-row」（例如 human-origin-row）；previousValue 為重繪前的選擇。
function renderRaceFeatChoice(previousValue = "") {
  getRaceFeatChoiceTraits().forEach(trait => document.getElementById(`${trait.feat.key}-row`)?.replaceChildren());
  getFeatChoiceSpecs().filter(spec => spec.source === "race").forEach(spec => {
    const container = document.getElementById(`${spec.key}-row`);
    if (container) appendFeatChoice(container, spec, previousValue);
  });
}

function renderInvocationFeatChoices(previousValues = new Map()) {
  getFeatChoiceSpecs().filter(spec => spec.source === "invocation").forEach(spec => {
    const card = document.getElementById(spec.checkboxId)?.closest(".feature-choice-card");
    appendFeatChoice(card, spec, previousValues.get(getFeatChoiceId(spec.key)) || "");
  });
}

function isFeatChoiceEligible(value, spec) {
  const rule = window.getFeatRules?.(value);
  if (!rule) return false;
  if (spec.type === "level") {
    if (rule.type === "style") return false;
  } else if (rule.type !== spec.type) return false;
  // 專長門檻看屬性欄的原值（不含魔法物品的有效值）。
  if (rule.abilities && !rule.abilities.some(id => Number(document.getElementById(id)?.value || 0) >= 13)) return false;
  const cls = document.getElementById("class")?.value || "";
  if (rule.heavyArmor && !(["fighter", "paladin"].includes(cls) || (cls === "cleric" && document.getElementById("cleric-guardian")?.checked))) return false;
  if (rule.spellcasting && !hasSpellcastingCapabilityForSelections({
    className: cls,
    background: document.getElementById("background")?.value || "",
    race: document.getElementById("race")?.value || "",
    hasMagicInitiate: getDerivedBackgroundFeatSpec()?.value === MAGIC_INITIATE_FEAT_NAME
      || getFeatChoiceSpecs().some(peer => peer.active && document.getElementById(getFeatChoiceId(peer.key))?.value === MAGIC_INITIATE_FEAT_NAME)
      || getManualFeatRows().some(row => isMagicInitiateFeatSelectedInRow(row))
  })) return false;
  return true;
}

function syncFeatChoiceOptions() {
  const specs = getFeatChoiceSpecs();
  syncManualFeatGuidance();
  if (isManualFeatManagementEnabled()) {
    specs.forEach(spec => { const select = document.getElementById(getFeatChoiceId(spec.key)); if (select) select.disabled = true; });
    syncFeatChoiceViewButtons();
    return;
  }
  specs.forEach(spec => {
    const select = document.getElementById(getFeatChoiceId(spec.key));
    if (!select) return;
    select.disabled = !spec.active;
    if (!autosaveSuspended && !spec.active) select.value = "";
    // 保留選擇；資格由共用判斷控制警示及計算，不在選單上阻擋。
    Array.from(select.options).forEach(option => {
      option.disabled = false;
    });
  });
  syncFeatChoiceViewButtons();
}

function syncFeatChoiceViewButtons() {
  document.querySelectorAll("[data-feat-choice]").forEach(wrap => {
    const select = wrap.querySelector("select");
    const view = wrap.querySelector(".feat-choice-view");
    if (!view || !select) return;
    view.disabled = !select.value;
    view.setAttribute("aria-label", select.value ? `查看${select.value}` : "查看專長（請先選擇專長）");
  });
}

function showFeatChoiceDetail(select, trigger) {
  if (!select.value) return;
  const content = document.createElement("div");
  content.className = "output feat-choice-detail";
  content.innerHTML = getFeatDescriptionHtml(select.value);
  const popup = document.getElementById("skillPopup");
  const popupParent = popup.parentElement;
  window.AppDialog.showContent({
    title: "專長詳情", variant: "feat-detail", content, trigger,
    confirmLabel: "關閉", initialFocus: "primary",
    onClose() {
      hideSkillPopup();
      popupParent.appendChild(popup);
    }
  });
  content.closest(".app-dialog").appendChild(popup);
  popup.inert = false;
}

function syncFeatChoiceWarnings() {
  const entries = getFeatUsageEntries();
  document.querySelectorAll("[data-feat-choice]").forEach(wrap => {
    const select = wrap.querySelector("select");
    if (!select) return;
    const unmet = entries.find(entry => entry.row.dataset.sourceKey === wrap.dataset.featChoice && entry.value && !entry.usable);
    const warningId = `${select.id}-warning`;
    const warning = document.getElementById(warningId);
    if (unmet) {
      if (!warning) wrap.insertAdjacentHTML("beforeend", getFeatEligibilityWarningHtml(warningId, unmet));
      else warning.textContent = getFeatUnusableMessage(unmet);
      select.setAttribute("aria-describedby", warningId);
    } else {
      warning?.remove();
      select.removeAttribute("aria-describedby");
    }
  });
}

function isDerivedFeatRow(row) {
  return Boolean(row?.dataset?.featSource);
}

function getManualFeatRows() {
  return Array.from(document.querySelectorAll("#feats-area .form-row")).filter(row => !isDerivedFeatRow(row));
}

function getDerivedBackgroundFeatSpec() {
  const featRules = getBackgroundRules(document.getElementById("background")?.value || "")?.feat;
  const backgroundFeat = featRules?.id && window.getFeatRules?.(featRules.id) ? featRules.id : "";
  return backgroundFeat ? {
    key: "background",
    source: "background",
    label: "背景專長",
    value: backgroundFeat,
    fixed: true,
    // 魔法學徒的法術列表（職業 ID）；自訂背景與其他專長為空字串。
    spellList: featRules.spellList || ""
  } : null;
}

function getDerivedFeatSpecs() {
  const background = getDerivedBackgroundFeatSpec();
  const specs = background ? [background] : [];
  getFeatChoiceSpecs().filter(spec => spec.active).forEach(spec => {
    const select = document.getElementById(getFeatChoiceId(spec.key));
    specs.push({ ...spec, label: spec.type === "level" ? `${String(spec.level).replace(/\d/gu, digit => String.fromCharCode(digit.charCodeAt(0) + 0xFEE0))}級專長` : spec.label.replace(/[：:]/gu, ""), value: select?.value || "", fixed: false });
  });
  return specs;
}

function createDerivedFeatRow(spec) {
  const area = document.getElementById("feats-area");
  if (!area) return null;
  const row = document.createElement("div");
  row.className = "form-row feat-entry--derived";
  row.dataset.featSource = spec.source;
  row.dataset.sourceKey = spec.key;
  const rowHead = document.createElement("div");
  rowHead.className = "feat-row-head";
  const label = document.createElement("label");
  rowHead.appendChild(label);
  const select = document.createElement("select");
  rowHead.append(select, createFeatRowControls(row));
  const desc = document.createElement("div");
  desc.className = "output";
  const magicControls = createMagicInitiateControls(row);
  select.addEventListener("change", () => {
    const previousValue = select.dataset.previousValue || "";
    const choice = document.getElementById(getFeatChoiceId(row.dataset.sourceKey));
    if (choice && !isManualFeatManagementEnabled()) {
      const scrollPosition = autosaveSuspended ? null : { left: window.scrollX, top: window.scrollY, behavior: "instant" };
      // 兩處共用來源選項；選後由共用資格判斷控制警示及計算。
      const option = Array.from(choice.options).find(option => option.value === select.value);
      if (!choice.disabled && option && !option.disabled) choice.value = select.value;
      syncDerivedFeatRows();
      syncInitiativeAfterFeatSelectionChange(select, previousValue);
      // 同步說明時的暫時高度變化可能觸發瀏覽器捲動錨定，完成後還原位置。
      if (scrollPosition) {
        window.scrollTo(scrollPosition);
        requestAnimationFrame(() => window.scrollTo(scrollPosition));
      }
      scheduleSaveAllFields();
      return;
    }
    updateFeatDesc(select.id, desc.id);
    updateMagicInitiateControlsForRow(row);
    syncInitiativeAfterFeatSelectionChange(select, previousValue);
    refreshFeatDerivedEffects();
    scheduleSaveAllFields();
  });
  row.append(rowHead, desc, magicControls);
  area.insertBefore(row, getManualFeatRows()[0] || null);
  return row;
}

function setDerivedFeatRowValues(row, spec) {
  const select = getFeatSelectFromRow(row);
  const label = row.querySelector(".feat-row-head label");
  const desc = row.querySelector(".output");
  if (!select || !label || !desc) return;
  const choice = !spec.fixed ? document.getElementById(getFeatChoiceId(spec.key)) : null;
  select.id = `derived-feat-${spec.key}`;
  label.htmlFor = select.id;
  const sourceLabel = spec.label.replace(/[：:]/gu, "");
  label.dataset.featSourceLabel = sourceLabel;
  label.textContent = sourceLabel;
  if (spec.source === "race") label.textContent = spec.traitName;
  else if (/^lessons-\d+$/u.test(spec.key)) {
    const lessons = getFeatChoiceSpecs().filter(choice => choice.active && /^lessons-\d+$/u.test(choice.key));
    const index = lessons.findIndex(choice => choice.key === spec.key);
    label.textContent = `原初教習${lessons.length > 1 && index >= 0 ? index + 1 : ""}`;
  }
  desc.id = `${select.id}-desc`;
  setCharacterHtml(select, choice ? choice.innerHTML : getFeatOptionsHtml());
  select.value = spec.value;
  select.disabled = !choice || choice.disabled;
  select.dataset.previousValue = select.value;
  updateFeatDesc(select.id, desc.id);
  updateMagicInitiateControlIds(row, select.id);
  updateMagicInitiateControlsForRow(row, { sync: false });
  // refreshFeatRows reconciles sources once all derived rows are ready.
  if (spec.fixed && spec.key === "background" && !isManualFeatManagementEnabled()) applyMagicInitiateBackgroundDefault(select, spec.spellList, { sync: false });
}

function syncDerivedFeatRows() {
  const area = document.getElementById("feats-area");
  if (!area) return;
  syncFeatChoiceOptions();
  const specs = getDerivedFeatSpecs();
  const desiredKeys = new Set(specs.map(spec => spec.key));
  document.querySelectorAll("#eldritch-invocations-output [data-feat-choice]").forEach(control => {
    if (!desiredKeys.has(control.dataset.featChoice)) control.remove();
  });
  if (manualFeatSetDisplayed) {
    refreshFeatRows();
    refreshFeatDerivedEffects();
    return;
  }
  Array.from(area.querySelectorAll(":scope > [data-feat-source]")).forEach(row => {
    if (!desiredKeys.has(row.dataset.sourceKey)) row.remove();
  });
  specs.forEach(spec => {
    let row = Array.from(area.querySelectorAll(":scope > [data-feat-source]")).find(candidate => candidate.dataset.sourceKey === spec.key);
    if (!row) row = createDerivedFeatRow(spec);
    if (row) setDerivedFeatRowValues(row, spec);
  });
  let nextRow = getManualFeatRows()[0] || null;
  specs.slice().reverse().forEach(spec => {
    const row = Array.from(area.querySelectorAll(":scope > [data-feat-source]")).find(candidate => candidate.dataset.sourceKey === spec.key);
    if (!row) return;
    // 順序未變時保留 DOM，避免移動已聚焦的下拉選單造成捲動跳位。
    if (row.nextElementSibling !== nextRow) area.insertBefore(row, nextRow);
    nextRow = row;
  });
  refreshFeatRows();
  refreshFeatDerivedEffects();
}

const ALERT_FEAT_NAME = "警覺";

function getFeatSelects() {
  return Array.from(document.querySelectorAll("#feats-area .form-row")).map(getFeatSelectFromRow).filter(Boolean);
}

function getFeatUsageEntries(changedSelect = null, overrideValue = "") {
  const specs = getFeatChoiceSpecs();
  const entries = getFeatSelects().map(select => {
    const row = select.closest(".form-row");
    const spec = specs.find(spec => spec.key === row.dataset.sourceKey)
      || { type: window.getFeatRules?.(select.value)?.type, active: !isDerivedFeatRow(row) || row.dataset.featSource === "background" };
    return { select, row, spec, value: select === changedSelect ? overrideValue : select.value };
  });
  if (isManualFeatManagementEnabled()) return entries.map(entry => ({ ...entry, usable: Boolean(entry.value) }));

  // 固定背景與既有自訂列保留優先權，其餘依來源順序判斷重複取得。
  const priority = entry => entry.row.dataset.featSource === "background" ? -2
    : !isDerivedFeatRow(entry.row) ? -1 : specs.indexOf(entry.spec);
  const claimed = new Set();
  const lessons = new Set();
  let magicFeatCount = 0;
  entries.sort((a, b) => priority(a) - priority(b)).forEach(entry => {
    const { value, spec } = entry;
    const duplicate = (!window.getFeatRules?.(value)?.repeatable && claimed.has(value))
      || (spec.source === "invocation" && lessons.has(value))
      || (value === MAGIC_INITIATE_FEAT_NAME && magicFeatCount >= MAGIC_INITIATE_CLASS_OPTIONS.length);
    const eligible = Boolean(spec.active && isFeatChoiceEligible(value, spec));
    entry.usable = Boolean(value && eligible && !duplicate);
    if (!entry.usable) {
      if (value) entry.unusableReasons = { ineligible: !eligible, duplicate };
      return;
    }
    claimed.add(value);
    if (spec.source === "invocation") lessons.add(value);
    if (value === MAGIC_INITIATE_FEAT_NAME) magicFeatCount += 1;
  });
  return entries;
}

function hasSelectedFeat(featName) {
  return getFeatUsageEntries().some(entry => entry.value === featName && entry.usable);
}

function refreshFeatDerivedEffects() {
  if (typeof updateHPDisplay === "function") updateHPDisplay();
  if (typeof updateACDisplay === "function") updateACDisplay();
  if (typeof updateSpeedDisplay === "function") updateSpeedDisplay();
  if (typeof updateAutomaticInitiative === "function") updateAutomaticInitiative();
  if (typeof updateExpertiseVisibility === "function") updateExpertiseVisibility();
  if (typeof populateHandAttacks === "function") populateHandAttacks();
  if (typeof updateEquipmentLoadoutSummary === "function") updateEquipmentLoadoutSummary();
}

function hasAlertFeatSelectedWithOverride(changedSelect = null, overrideValue = "") {
  return getFeatUsageEntries(changedSelect, overrideValue).some(entry => entry.value === ALERT_FEAT_NAME && entry.usable);
}

function syncInitiativeForAlertFeatPresenceChange(hadAlertFeat, hasAlertFeat) {
  if (hadAlertFeat !== hasAlertFeat) updateAutomaticInitiative();
}

function syncInitiativeAfterFeatSelectionChange(changedSelect, previousValue = "") {
  if (!changedSelect) return;
  const currentValue = changedSelect.value || "";

  if (autosaveSuspended) {
    changedSelect.dataset.previousValue = currentValue;
    return;
  }

  const hadAlertFeat = hasAlertFeatSelectedWithOverride(changedSelect, previousValue);
  const hasAlertFeat = hasAlertFeatSelectedWithOverride(changedSelect, currentValue);
  syncInitiativeForAlertFeatPresenceChange(hadAlertFeat, hasAlertFeat);
  changedSelect.dataset.previousValue = currentValue;
}

// 依不可用原因組合警示；未標明原因時沿用資格警示。
function getFeatUnusableMessage(entry) {
  const reasons = entry?.unusableReasons || {};
  const messages = [];
  if (reasons.ineligible || !reasons.duplicate) messages.push("角色未達專長使用條件");
  if (reasons.duplicate) messages.push("專長不可重複選擇");
  return messages.join("；");
}

function getFeatEligibilityWarningHtml(warningId, entry) {
  return `<div id="${warningId}" class="feat-eligibility-warning" role="status">${getFeatUnusableMessage(entry)}</div>`;
}

const FEAT_DISCLOSURE_STATE_KEY = "dnd.featDisclosure.v1";
let featDisclosurePreferences = null;

function getFeatDisclosurePreferences() {
  if (featDisclosurePreferences) return featDisclosurePreferences;
  let saved = null;
  try { saved = JSON.parse(window.dndStorage.getItem(FEAT_DISCLOSURE_STATE_KEY) || "null"); }
  catch (_error) { /* Invalid or unavailable preference storage defaults to expanded. */ }
  const derived = saved?.derived && typeof saved.derived === "object" && !Array.isArray(saved.derived)
    ? Object.fromEntries(Object.entries(saved.derived).filter(([key, expanded]) =>
      /^[a-z0-9-]+$/u.test(key) && typeof expanded === "boolean").slice(0, 100))
    : {};
  const manual = Array.isArray(saved?.manual) ? saved.manual.slice(0, 100).map(value => value === false ? false : true) : [];
  featDisclosurePreferences = { derived, manual };
  return featDisclosurePreferences;
}

function saveFeatDisclosurePreferences() {
  if (SHARE_MODE || autosaveSuspended || autosaveClearing) return;
  const preferences = getFeatDisclosurePreferences();
  document.querySelectorAll("#feats-area > .form-row[data-source-key]").forEach(row => {
    if (row.dataset.featDisclosureInitialized === "true") {
      preferences.derived[row.dataset.sourceKey] = row.dataset.featExpanded !== "false";
    }
  });
  if (manualFeatSetDisplayed) preferences.manual = getManualFeatRows().map(row => row.dataset.featExpanded !== "false");
  window.dndStorage.setItem(FEAT_DISCLOSURE_STATE_KEY, JSON.stringify(preferences));
}

function syncFeatRowDisclosure(row) {
  if (!row || !row.matches("#feats-area > .form-row")) return;
  if (row.dataset.featDisclosureInitialized !== "true") {
    const preferences = getFeatDisclosurePreferences();
    const sourceKey = row.dataset.sourceKey;
    const manualIndex = sourceKey ? -1 : getManualFeatRows().indexOf(row);
    const stored = sourceKey ? preferences.derived[sourceKey] : preferences.manual[manualIndex];
    row.dataset.featExpanded = String(typeof stored === "boolean" ? stored : true);
    row.dataset.featDisclosureInitialized = "true";
  }
  const head = row.querySelector(".feat-row-head");
  const select = getFeatSelectFromRow(row);
  const label = head?.querySelector("label");
  if (!head || !select || !label) return;

  let toggle = head.querySelector(":scope > .feat-disclosure-toggle");
  if (!toggle) {
    toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "feat-disclosure-toggle";
    toggle.addEventListener("click", () => {
      row.dataset.featExpanded = String(row.dataset.featExpanded !== "true");
      syncFeatRowDisclosure(row);
      saveFeatDisclosurePreferences();
    });
    head.prepend(toggle);
  }
  let name = head.querySelector(":scope > .feat-selected-name");
  if (!name) {
    name = document.createElement("span");
    name.className = "feat-selected-name";
    label.after(name);
  }
  let warning = head.querySelector(":scope > .feat-disclosure-warning");
  if (!warning) {
    warning = document.createElement("span");
    warning.className = "feat-disclosure-warning";
    name.after(warning);
  }

  const expanded = row.dataset.featExpanded === "true";
  row.dataset.featExpanded = String(expanded);
  row.classList.toggle("feat-entry--collapsed", !expanded);
  name.textContent = select.value || "尚未選擇";
  name.hidden = expanded;
  const descWarning = row.querySelector(":scope > .output .feat-eligibility-warning");
  warning.textContent = descWarning?.textContent || "";
  warning.hidden = expanded || !descWarning;
  toggle.textContent = expanded ? "▾" : "▸";
  toggle.setAttribute("aria-expanded", String(expanded));
  toggle.setAttribute("aria-label", `${expanded ? "收合" : "展開"}${label.textContent.trim()}：${name.textContent}`);
}

function updateFeatDesc(selectId, descId) {
  const select = document.getElementById(selectId);
  const el = document.getElementById(descId);

  const unmet = getFeatUsageEntries().find(entry => entry.select === select && entry.value && !entry.usable);
  const warningId = `${descId}-warning`;
  if (unmet) select.setAttribute("aria-describedby", warningId);
  else select.removeAttribute("aria-describedby");
  setCharacterHtml(el,
    (unmet ? getFeatEligibilityWarningHtml(warningId, unmet) : "") +
    getFeatDescriptionHtml(select.value));
  syncFeatRowDisclosure(select.closest("#feats-area .form-row"));
}

// 專長說明：featText.html 是建置組好的標題、副標與效果；提示框（span）換成鍵盤可操作的說明按鈕，小標不連結。
// 沒有選擇或不認得的專長（例如舊資料）只顯示「—」。
function getFeatDescriptionHtml(featId) {
  const html = window.getFeatText?.(featId)?.html;
  if (!html) return `<div class="feat-desc-title">—</div><div class="feat-desc-body"></div>`;
  const template = document.createElement("template");
  template.innerHTML = html;
  template.content.querySelectorAll("span.skill-tip").forEach(tip => tip.replaceWith(createFeatureRuleTip(tip.dataset.skill)));
  return decorateDndConditionTips(template.innerHTML);
}

function updateFeatControlStates() {
  const rows = Array.from(document.querySelectorAll("#feats-area .form-row"));
  const enabled = isManualFeatManagementEnabled();
  const addEmpty = document.getElementById("feat-add-empty");
  if (addEmpty) addEmpty.hidden = !enabled || rows.length > 0;
  const lastRow = rows[rows.length - 1] || null;

  rows.forEach((row) => {
    const select = getFeatSelectFromRow(row);
    if (select) {
      const choice = isDerivedFeatRow(row) ? document.getElementById(getFeatChoiceId(row.dataset.sourceKey)) : null;
      select.disabled = !enabled && (!choice || choice.disabled);
      const category = getManualFeatCategorySelect(row)?.value || "";
      if (enabled) {
        const value = select.value;
        setCharacterHtml(select, getManualFeatOptionsHtml(category));
        restoreFeatSelectValue(select, value);
        select.disabled = !category;
      }
    }
    row.classList.toggle("feat-entry--derived", !enabled);
    const magicClass = getMagicInitiateSelect(row, "class");
    if (magicClass) magicClass.disabled = !enabled && row.dataset.featSource === "background"
      && Boolean(getDerivedBackgroundFeatSpec()?.spellList);
    const controls = row.querySelector(".feat-row-controls");
    if (controls) controls.hidden = !enabled;
    const delBtn = row.querySelector(".feat-icon-btn[data-feat-action='delete']");
    const addBtn = row.querySelector(".feat-icon-btn[data-feat-action='add']");
    if (delBtn) delBtn.disabled = !enabled;
    if (addBtn) {
      const isLast = enabled && row === lastRow;
      addBtn.disabled = !enabled;
      addBtn.style.display = isLast ? "inline-flex" : "none";
      addBtn.tabIndex = isLast ? 0 : -1;
      addBtn.setAttribute("aria-hidden", isLast ? "false" : "true");
    }
  });
}

function refreshFeatRows() {
  const rows = document.querySelectorAll("#feats-area .form-row");
  let manualIndex = 0;
  rows.forEach((row) => {
    const label = row.querySelector("label");
    const select = getFeatSelectFromRow(row);
    const desc = row.querySelector(".output");
    if (!label || !select || !desc) return;
    const baseId = isDerivedFeatRow(row) ? `derived-feat-${row.dataset.sourceKey}` : `feat-${manualIndex}`;
    label.htmlFor = baseId;
    if (!isDerivedFeatRow(row)) label.textContent = `專長${manualIndex + 1}`;
    select.id = baseId;
    const category = getManualFeatCategorySelect(row);
    if (category) {
      category.id = `${baseId}-category`;
      category.setAttribute("aria-label", `專長${manualIndex + 1}分類`);
    }
    desc.id = `${baseId}-desc`;
    updateFeatDesc(select.id, desc.id);
    updateMagicInitiateControlIds(row, isDerivedFeatRow(row) ? baseId : manualIndex);
    updateMagicInitiateControlsForRow(row, { sync: false });
    if (!isDerivedFeatRow(row)) manualIndex += 1;
  });
  syncFeatChoiceWarnings();
  updateFeatControlStates();
  syncMagicInitiateClassOptions();
  syncMagicInitiateDerivedSpellRows();
  updateSpellCastingStatsVisibility();
  updateSpellsByClassLevel();
}

function createFeatRowControls(rowDiv) {
  const controls = document.createElement("div");
  controls.className = "feat-row-controls";

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "feat-icon-btn feat-icon-btn--add";
  addBtn.textContent = "＋";
  addBtn.setAttribute("aria-label", "在下方新增一列專長");
  addBtn.title = "新增";
  addBtn.dataset.featAction = "add";
  addBtn.addEventListener("click", () => {
    if (!isManualFeatManagementEnabled()) return;
    createSingleFeatRow(rowDiv, { freshDisclosure: true });
    scheduleStructuralSaveAllFields();
  });

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "feat-icon-btn feat-icon-btn--delete";
  delBtn.textContent = "－";
  delBtn.setAttribute("aria-label", "刪除此列專長");
  delBtn.title = "刪除";
  delBtn.dataset.featAction = "delete";
  delBtn.addEventListener("click", () => {
    if (!isManualFeatManagementEnabled()) return;
    const hadAlertFeat = hasAlertFeatSelectedWithOverride();
    if (rowDiv.dataset.sourceKey) delete getFeatDisclosurePreferences().derived[rowDiv.dataset.sourceKey];
    rowDiv.remove();
    refreshFeatRows();
    saveFeatDisclosurePreferences();
    syncInitiativeForAlertFeatPresenceChange(hadAlertFeat, hasAlertFeatSelectedWithOverride());
    refreshFeatDerivedEffects();
    scheduleStructuralSaveAllFields();
  });

  controls.appendChild(delBtn);
  controls.appendChild(addBtn);
  return controls;
}

function createSingleFeatRow(afterRow = null, { freshDisclosure = false } = {}) {
  const area = document.getElementById("feats-area");
  if (!area) return;
  const idx = getManualFeatRows().length;
  const rowDiv = document.createElement("div");
  rowDiv.className = "form-row";
  if (freshDisclosure) {
    rowDiv.dataset.featDisclosureInitialized = "true";
    rowDiv.dataset.featExpanded = "true";
  }
  const rowHead = document.createElement("div");
  rowHead.className = "feat-row-head";
  const label = document.createElement("label");
  label.htmlFor = `feat-${idx}`;
  label.textContent = `專長${idx + 1}`;
  rowHead.append(label, createFeatRowControls(rowDiv));

  // 標題列下方是分類與專長選單；分類只存在 __managedFeatRows 的 type，不另存欄位。
  const selects = document.createElement("div");
  selects.className = "feat-row-selects";
  const categorySel = document.createElement("select");
  categorySel.id = `feat-${idx}-category`;
  categorySel.dataset.featCategory = "true";
  categorySel.dataset.stateTransient = "true";
  categorySel.setAttribute("aria-label", `專長${idx + 1}分類`);
  categorySel.innerHTML = getManualFeatCategoryOptionsHtml(false);
  categorySel.dataset.previousCategory = "";
  const featSel = document.createElement("select");
  featSel.id = `feat-${idx}`;
  featSel.innerHTML = getManualFeatOptionsHtml("");
  featSel.disabled = true;
  featSel.dataset.previousValue = featSel.value || "";
  selects.append(categorySel, featSel);

  const descDiv = document.createElement("div");
  descDiv.className = "output";
  descDiv.id = `feat-${idx}-desc`;
  descDiv.textContent = "—";

  const magicInitiateControls = createMagicInitiateControls(rowDiv);

  categorySel.addEventListener("change", () => applyManualFeatCategory(rowDiv));
  featSel.addEventListener("change", () => applyManualFeatSelection(rowDiv, featSel.dataset.previousValue || ""));

  rowDiv.appendChild(rowHead);
  rowDiv.appendChild(selects);
  rowDiv.appendChild(descDiv);
  rowDiv.appendChild(magicInitiateControls);

  if (afterRow && afterRow.parentNode === area) {
    area.insertBefore(rowDiv, afterRow.nextSibling);
  } else {
    area.appendChild(rowDiv);
  }

  refreshFeatRows();
  if (freshDisclosure) saveFeatDisclosurePreferences();
  return rowDiv;
}

/**
 * 專長列 UI：選單、自動／自行管理、子選項、資格警示、收合記憶與衍生專長列
 * （傳統 script，不使用 defer）。專長資料仍以 feats.js 為準。
 *
 * - 自 index.html 原封搬出，於第一段內嵌角色卡 script 之前同步載入，
 *   維持全域函式名稱供 index.html、quick-build.js、tabletop-mode.js 等呼叫。
 * - 魔法學徒子選項與衍生法術仍留在 index.html 的法術來源區段。
 * - 只放函式與狀態宣告，不在頂層執行任何初始化。
 */
function getFeatOptionsHtml() {
  return `<option value="">-- 請選擇 --</option>` +
    FEAT_OPTIONS.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join("");
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

function syncManualFeatGuidance() {
  const manual = isManualFeatManagementEnabled();
  document.querySelectorAll("[data-feat-choice]").forEach(wrap => {
    const raceChoice = wrap.dataset.featChoice === "human-origin";
    const styleClass = ["ranger", "paladin"].find(cls => wrap.dataset.featChoice === `fighting-style-${cls}`);
    const inactiveClassStyle = Boolean(styleClass) && !document.getElementById(`${styleClass}-fighting-style`)?.checked;
    wrap.hidden = (manual && Boolean(raceChoice)) || inactiveClassStyle;
    wrap.querySelector(".feat-choice-control").hidden = manual;
    const label = wrap.querySelector(":scope > label");
    if (label) label.hidden = manual;
    let guidance = wrap.querySelector(":scope > .manual-feat-guidance");
    if (!guidance && !raceChoice) {
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

function collectManagedFeatRows() {
  return Array.from(document.querySelectorAll("#feats-area > .form-row"), row => ({
    source: row.dataset.featSource || "",
    key: row.dataset.sourceKey || "",
    label: row.querySelector(".feat-row-head label")?.dataset.featSourceLabel || row.querySelector(".feat-row-head label")?.textContent || "",
    value: getFeatSelectFromRow(row)?.value || "",
    magic: Object.fromEntries(["class", "cantrip1", "cantrip2", "level1"].map(field => [field, getMagicInitiateSelect(row, field)?.value || ""]))
  }));
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

function restoreManagedFeatRows(entries) {
  if (!Array.isArray(entries)) return;
  document.getElementById("feats-area").replaceChildren();
  const restoredKeys = new Set();
  entries.forEach(entry => {
    if (!entry || typeof entry !== "object") return;
    let row;
    if (["background", "race", "class", "invocation"].includes(entry.source) && /^[a-z0-9-]+$/u.test(entry.key || "") && !restoredKeys.has(entry.key)) {
      const spec = { source: String(entry.source), key: String(entry.key), label: String(entry.label || "專長："), fixed: false, optionsHtml: getFeatOptionsHtml() };
      row = createDerivedFeatRow(spec);
      setDerivedFeatRowValues(row, spec);
      restoredKeys.add(entry.key);
    } else row = createSingleFeatRow();
    const select = getFeatSelectFromRow(row);
    restoreFeatSelectValue(select, entry.value);
    select.dataset.previousValue = select.value;
    updateMagicInitiateControlsForRow(row, { sync: false });
    ["class", "cantrip1", "cantrip2", "level1"].forEach(field => {
      const control = getMagicInitiateSelect(row, field);
      restoreFeatSelectValue(control, entry.magic?.[field]);
      if (field === "class") updateMagicInitiateSpellOptions(row);
    });
    document.getElementById("feats-area").appendChild(row);
  });
  refreshFeatRows();
}

function updateFeatManagementMode() {
  if (!isManualFeatManagementEnabled()) {
    // 回到自動模式時，將手動改寫的來源列保留為自訂列。
    const specs = new Map(getDerivedFeatSpecs().map(spec => [spec.key, spec]));
    document.querySelectorAll("#feats-area > [data-feat-source]").forEach(row => {
      const value = getFeatSelectFromRow(row)?.value || "";
      if (!value || specs.get(row.dataset.sourceKey)?.value === value) return;
      const entry = collectManagedFeatRows().find(entry => entry.key === row.dataset.sourceKey);
      const manual = createSingleFeatRow(null, { freshDisclosure: !autosaveSuspended });
      getFeatSelectFromRow(manual).value = value;
      updateMagicInitiateControlsForRow(manual, { sync: false });
      ["class", "cantrip1", "cantrip2", "level1"].forEach(field => {
        const control = getMagicInitiateSelect(manual, field);
        if (control) control.value = entry.magic[field];
        if (field === "class") updateMagicInitiateSpellOptions(manual);
      });
    });
  }
  syncDerivedFeatRows();
  scheduleStructuralSaveAllFields();
}

function getFeatChoiceSpecs() {
  const cls = document.getElementById("class")?.value || "";
  const level = Number(document.getElementById("level")?.value || 0);
  const specs = [];
  if (document.getElementById("race")?.value === "human") {
    specs.push({ key: "human-origin", source: "race", label: "靈活人才：起源專長", type: "origin", active: true });
  }
  if (cls === "fighter" && level >= 1) {
    specs.push({ key: "fighting-style-fighter", source: "class", label: "戰鬥風格", type: "style", level: 1, active: true });
    if (level >= 7) specs.push({ key: "fighting-style-fighter-2", source: "class", label: "戰鬥風格2", headingLabel: "額外戰鬥風格", type: "style", level: 7, active: true });
  }
  if (["paladin", "ranger"].includes(cls) && level >= 2) {
    specs.push({ key: `fighting-style-${cls}`, source: "class", label: "戰鬥風格", type: "style", level: 2, active: Boolean(document.getElementById(`${cls}-fighting-style`)?.checked) });
  }
  (CLASS_FEAT_LEVELS[cls] || []).filter(grantLevel => level >= grantLevel).forEach(grantLevel => {
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
  return FEAT_OPTIONS.filter(option => {
    const type = FEAT_RULES[option.value]?.type;
    return spec.type === "level" ? type !== "style" : type === spec.type;
  });
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
  const output = document.getElementById("classFeatures");
  getFeatChoiceSpecs().filter(spec => spec.source === "class").forEach(spec => {
    const headingLabel = spec.type === "style" ? (spec.headingLabel || spec.label) : "屬性值提升";
    const heading = Array.from(output.querySelectorAll("h3")).find(heading => heading.textContent.trim().startsWith(`等級 ${spec.level}：${headingLabel}`));
    appendFeatChoice(heading?.parentElement, spec);
  });
}

function renderRaceFeatChoice(previousValue = "") {
  const container = document.getElementById("human-origin-row");
  container.replaceChildren();
  const spec = getFeatChoiceSpecs().find(spec => spec.source === "race");
  if (!spec) return;
  appendFeatChoice(container, spec, previousValue);
}

function renderInvocationFeatChoices(previousValues = new Map()) {
  getFeatChoiceSpecs().filter(spec => spec.source === "invocation").forEach(spec => {
    const card = document.getElementById(spec.checkboxId)?.closest(".feature-choice-card");
    appendFeatChoice(card, spec, previousValues.get(getFeatChoiceId(spec.key)) || "");
  });
}

function isFeatChoiceEligible(value, spec) {
  const rule = FEAT_RULES[value];
  if (!rule) return false;
  if (spec.type === "level") {
    if (rule.type === "style") return false;
  } else if (rule.type !== spec.type) return false;
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
  content.innerHTML = formatFeatDescription(featsDesc[select.value] || "—");
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
  const background = document.getElementById("background")?.value || "";
  const backgroundData = background === "custom" ? window.CustomBackground?.getState()
    : (typeof detailedBackgroundFeatures !== "undefined" ? detailedBackgroundFeatures : globalThis.detailedBackgroundFeatures)?.[background];
  const backgroundFeat = FEAT_OPTIONS.find(option => backgroundData?.專長?.startsWith(option.value));
  return backgroundFeat ? {
    key: "background",
    source: "background",
    label: "背景專長",
    value: backgroundFeat.value,
    fixed: true,
    backgroundData
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
  if (spec.key === "human-origin") label.textContent = "靈活人才";
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
  if (spec.fixed && spec.backgroundData && !isManualFeatManagementEnabled()) applyMagicInitiateBackgroundDefault(select, spec.backgroundData, { sync: false });
}

function syncDerivedFeatRows() {
  const area = document.getElementById("feats-area");
  if (!area) return;
  syncFeatChoiceOptions();
  if (isManualFeatManagementEnabled()) {
    refreshFeatRows();
    refreshFeatDerivedEffects();
    return;
  }
  const specs = getDerivedFeatSpecs();
  const desiredKeys = new Set(specs.map(spec => spec.key));
  document.querySelectorAll("#eldritch-invocations-output [data-feat-choice]").forEach(control => {
    if (!desiredKeys.has(control.dataset.featChoice)) control.remove();
  });
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
      || { type: FEAT_RULES[select.value]?.type, active: !isDerivedFeatRow(row) || row.dataset.featSource === "background" };
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
    const duplicate = (!FEAT_RULES[value]?.repeatable && claimed.has(value))
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
  preferences.manual = getManualFeatRows().map(row => row.dataset.featExpanded !== "false");
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
  const v = select.value;
  const raw = featsDesc[v] || "—";
  const el = document.getElementById(descId);

  const unmet = getFeatUsageEntries().find(entry => entry.select === select && entry.value && !entry.usable);
  const warningId = `${descId}-warning`;
  if (unmet) select.setAttribute("aria-describedby", warningId);
  else select.removeAttribute("aria-describedby");
  setCharacterHtml(el,
    (unmet ? getFeatEligibilityWarningHtml(warningId, unmet) : "") +
    formatFeatDescription(raw));
  syncFeatRowDisclosure(select.closest("#feats-area .form-row"));
}

// 專長原文維持純文字，只在顯示時把狀態、指定技能與規則名詞換成說明按鈕；小標不連結。
function formatFeatRuleText(text, featTitle, head) {
  const tips = new Map();
  const condition = head ? FEAT_CONDITION_REFERENCES[featTitle]?.[head] : null;
  if (condition) tips.set(condition.label, () => createDndConditionTip(condition.key, condition.label));
  const skills = head ? FEAT_SKILL_REFERENCES[featTitle]?.[head] || [] : [];
  [...skills, ...FEAT_RULE_TERMS].forEach(label => {
    if (!tips.has(label)) tips.set(label, () => createFeatureRuleTip(label));
  });
  const labels = [...tips.keys()].sort((a, b) => b.length - a.length).map(escapeRegExp);
  return text.split(new RegExp(`(${labels.join("|")})`, "u"))
    .map((part, index) => index % 2 ? tips.get(part)()?.outerHTML ?? escapeHtml(part) : escapeHtml(part))
    .join("");
}

function formatFeatDescription(raw) {
  // 共用角色卡與查看視窗的規則內容與排版。
  if (typeof raw !== "string") {
    return "—";
  }

  // 依行切開（保留空行）
  const lines = raw.replace(/\r\n/g, "\n").split("\n");

  // 找到第一個非空行當標題
  let title = "";
  let startIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t) {
      title = t;
      startIdx = i + 1;
      break;
    }
  }

  // 第二個非空行（常見：起源專長 / 戰鬥風格專長…）當副標
  let subtitle = "";
  for (let i = startIdx; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t) {
      subtitle = t;
      startIdx = i + 1;
      break;
    }
  }

  // 其餘內容：把空行變段落，把「小標：內容」做成小標粗體
  const bodyHtml = lines
    .slice(startIdx)
    .map(line => {
      const t = line.trim();
      if (!t) return `<div class="feat-desc-spacer"></div>`; // 空行 = 段落距離

      if (t.startsWith("「擴充」為本站")) {
        return `<div class="feat-expansion-notice">${escapeHtml(t)}</div>`;
      }

      const idx = line.indexOf("：");
      if (idx > 0) {
        const head = line.slice(0, idx).trim();
        const tail = line.slice(idx + 1).trim();
        return `<div><strong>${escapeHtml(head)}</strong>：${formatFeatRuleText(tail, title, head)}</div>`;
      }

      return `<div>${formatFeatRuleText(t, title, "")}</div>`;
    })
    .join("");

  return `<div class="feat-desc-title">${escapeHtml(title || "—")}</div>` +
    (subtitle ? `<div class="feat-desc-subtitle">${escapeHtml(subtitle)}</div>` : ``) +
    `<div class="feat-desc-body">${bodyHtml}</div>`;
}

function updateFeatControlStates() {
  const rows = Array.from(document.querySelectorAll("#feats-area .form-row"));
  const enabled = isManualFeatManagementEnabled();
  const addEmpty = document.getElementById("feat-add-empty");
  if (addEmpty) addEmpty.hidden = !enabled || rows.length > 0;
  const lastRow = rows[rows.length - 1] || null;

  rows.forEach((row) => {
    const manual = !isDerivedFeatRow(row);
    row.hidden = manual && !enabled && !getFeatSelectFromRow(row)?.value;
    const select = getFeatSelectFromRow(row);
    if (select) {
      const choice = !manual ? document.getElementById(getFeatChoiceId(row.dataset.sourceKey)) : null;
      select.disabled = !enabled && (!choice || choice.disabled);
      if (enabled) {
        const value = select.value;
        setCharacterHtml(select, getFeatOptionsHtml());
        restoreFeatSelectValue(select, value);
      }
    }
    row.classList.toggle("feat-entry--derived", !enabled);
    const magicClass = getMagicInitiateSelect(row, "class");
    if (magicClass) magicClass.disabled = !enabled && row.dataset.featSource === "background"
      && Boolean(getMagicInitiateClassFromBackgroundFeature(getDerivedBackgroundFeatSpec()?.backgroundData?.專長));
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
  rowHead.appendChild(label);

  const featSel = document.createElement("select");
  featSel.id = `feat-${idx}`;
  featSel.innerHTML = getFeatOptionsHtml();
  featSel.dataset.previousValue = featSel.value || "";
  rowHead.append(featSel, createFeatRowControls(rowDiv));

  const descDiv = document.createElement("div");
  descDiv.className = "output";
  descDiv.id = `feat-${idx}-desc`;
  descDiv.textContent = "—";

  const magicInitiateControls = createMagicInitiateControls(rowDiv);

  featSel.addEventListener("change", () => {
    const previousFeatValue = featSel.dataset.previousValue || "";
    updateFeatDesc(featSel.id, descDiv.id);
    updateMagicInitiateControlsForRow(rowDiv);
    if (typeof updateACDisplay === "function") updateACDisplay();
    if (typeof populateHandAttacks === "function") populateHandAttacks();
    syncInitiativeAfterFeatSelectionChange(featSel, previousFeatValue);
    refreshFeatDerivedEffects();
    scheduleSaveAllFields();
  });

  rowDiv.appendChild(rowHead);
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

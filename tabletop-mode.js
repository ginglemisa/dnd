(function attachTabletopMode(globalScope) {
  const PANEL_PREFERENCE_KEY = "dnd.tabletopPanel.v1";
  const TABLETOP_PANELS = Object.freeze(["overview", "skills", "actions", "spells", "resources"]);
  const ABILITY_KEYS = Object.freeze(["str", "dex", "con", "int", "wis", "cha"]);
  const CUSTOM_RESOURCE_LIMIT = 50;
  const CUSTOM_RESOURCE_MAX = 999;
  const BUILT_IN_RESOURCE_MAX = 999;
  const ENDED_CONCENTRATION_LIMIT = 12;
  const TABLETOP_ACTION_PREFERENCES_KEY = "dnd.tabletopActionPreferences.v1";
  const TABLETOP_ACTION_PREFERENCES_VERSION = 1;
  const TABLETOP_ACTION_MODES = Object.freeze(["basic", "action", "bonus", "reaction", "movement"]);
  const CUSTOM_TABLETOP_ACTION_LIMIT = 50;
  const CUSTOM_TABLETOP_ACTION_LABEL_MAX = 40;
  const CUSTOM_TABLETOP_ACTION_DESCRIPTION_MAX = 600;
  const TABLETOP_ACTION_NOTES_MAX = 50000;
  const HIDDEN_TABLETOP_ACTION_LIMIT = 500;
  const HEROIC_SACRIFICE_LABEL = "您已英勇犧牲";
  const DEFAULT_COMBAT_STATE = Object.freeze({
    characterName: "",
    temporaryHp: 0,
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
    deathSaveStable: false,
    heroicSacrifice: false,
    activeConditions: Object.freeze([]),
    exhaustionLevel: 0,
    concentrationSpellId: "",
    endedConcentrations: Object.freeze([]),
    builtInResourceUsage: Object.freeze({}),
    customResources: Object.freeze([])
  });

  function toBoundedInteger(value, minimum, maximum, fallback = minimum) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.min(maximum, Math.max(minimum, Math.trunc(numeric)));
  }

  function toNonNegativeInteger(value, fallback = 0) {
    const numeric = Number(value);
    if (!Number.isSafeInteger(numeric) || numeric < 0) return fallback;
    return numeric;
  }

  function stableKeyHash(value) {
    let hash = 2166136261;
    for (const character of String(value)) {
      hash ^= character.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function createDefaultTabletopActionPreferences() {
    return {
      version: TABLETOP_ACTION_PREFERENCES_VERSION,
      customActions: [],
      hiddenKeys: [],
      notes: ""
    };
  }

  function normalizeCustomTabletopActions(value) {
    if (!Array.isArray(value)) return [];
    const usedIds = new Set();

    return value.slice(0, CUSTOM_TABLETOP_ACTION_LIMIT).flatMap((entry, index) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
      const label = String(entry.label ?? "").trim().slice(0, CUSTOM_TABLETOP_ACTION_LABEL_MAX);
      const mode = String(entry.mode || "");
      const description = String(entry.description ?? "").trim().slice(0, CUSTOM_TABLETOP_ACTION_DESCRIPTION_MAX);
      if (!label || !description || !TABLETOP_ACTION_MODES.includes(mode)) return [];

      const rawId = typeof entry.id === "string" ? entry.id.trim().slice(0, 100) : "";
      const validId = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,99}$/.test(rawId);
      const fingerprint = `${rawId}|${label}|${mode}|${description}|${index}`;
      const baseId = validId ? rawId : `custom-action-${stableKeyHash(fingerprint)}`;
      let id = baseId;
      let duplicateIndex = 2;
      while (usedIds.has(id)) {
        id = `${baseId.slice(0, 94)}-${duplicateIndex}`;
        duplicateIndex += 1;
      }
      usedIds.add(id);
      return [{ id, label, mode, description }];
    });
  }

  function normalizeHiddenTabletopActionKeys(value, customActions = []) {
    if (!Array.isArray(value)) return [];
    const customIds = new Set(customActions.map(action => action.id));
    const normalized = [];
    const usedKeys = new Set();

    for (const rawKey of value) {
      if (normalized.length >= HIDDEN_TABLETOP_ACTION_LIMIT) break;
      if (typeof rawKey !== "string") continue;
      const key = rawKey.trim();
      if (!key || key.length > 280 || usedKeys.has(key)) continue;
      const officialMatch = key.match(/^official:(basic|action|bonus|reaction|movement):(.+)$/u);
      const customMatch = key.match(/^custom:([A-Za-z0-9][A-Za-z0-9_.:-]{0,99})$/u);
      if (!officialMatch && (!customMatch || !customIds.has(customMatch[1]))) continue;
      usedKeys.add(key);
      normalized.push(key);
    }
    return normalized;
  }

  function normalizeTabletopActionPreferences(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return createDefaultTabletopActionPreferences();
    }
    if (value.version !== undefined && value.version !== TABLETOP_ACTION_PREFERENCES_VERSION) {
      return createDefaultTabletopActionPreferences();
    }
    const customActions = normalizeCustomTabletopActions(value.customActions);
    return {
      version: TABLETOP_ACTION_PREFERENCES_VERSION,
      customActions,
      hiddenKeys: normalizeHiddenTabletopActionKeys(value.hiddenKeys, customActions),
      notes: String(value.notes ?? "").slice(0, TABLETOP_ACTION_NOTES_MAX)
    };
  }

  function createCustomTabletopActionId() {
    const randomId = globalScope.crypto?.randomUUID?.();
    if (randomId) return `custom-action-${randomId}`;
    return `custom-action-${Date.now().toString(36)}-${stableKeyHash(Math.random())}`;
  }

  function normalizeEndedConcentrations(value) {
    if (!Array.isArray(value)) return [];
    const usedIds = new Set();

    return value.slice(-ENDED_CONCENTRATION_LIMIT).flatMap((entry, index) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
      const spellId = normalizeConcentrationSpellId(entry.spellId);
      const replacementSpellId = normalizeConcentrationSpellId(entry.replacementSpellId);
      if (!spellId || !replacementSpellId) return [];

      const rawId = typeof entry.id === "string" ? entry.id.trim().slice(0, 100) : "";
      const validId = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,99}$/.test(rawId);
      const fingerprint = `${spellId}|${replacementSpellId}|${index}`;
      const baseId = validId ? rawId : `concentration-${stableKeyHash(fingerprint)}`;
      let id = baseId;
      let duplicateIndex = 2;
      while (usedIds.has(id)) {
        id = `${baseId.slice(0, 94)}-${duplicateIndex}`;
        duplicateIndex += 1;
      }
      usedIds.add(id);

      return [{ id, spellId, replacementSpellId }];
    });
  }

  function createConcentrationNoticeId(spellId, replacementSpellId) {
    const randomId = globalScope.crypto?.randomUUID?.();
    if (randomId) return `concentration-${randomId}`;
    return `concentration-${Date.now().toString(36)}-${stableKeyHash(`${spellId}|${replacementSpellId}|${Math.random()}`)}`;
  }

  function normalizeConcentrationSpellId(value) {
    return typeof value === "string" ? value.trim().slice(0, 160) : "";
  }

  function normalizeCharacterName(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function normalizeCustomResources(value) {
    if (!Array.isArray(value)) return [];
    const usedIds = new Set();

    return value.slice(0, CUSTOM_RESOURCE_LIMIT).flatMap((entry, index) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
      const label = String(entry.label ?? "").trim().slice(0, 40);
      if (!label) return [];

      const maximum = toBoundedInteger(entry.max, 1, CUSTOM_RESOURCE_MAX, 1);
      const current = toBoundedInteger(entry.current, 0, maximum, 0);
      const recoveryNote = String(entry.recoveryNote ?? "").trim().slice(0, 100);
      const rawId = typeof entry.id === "string" ? entry.id.trim().slice(0, 80) : "";
      const validId = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$/.test(rawId);
      const fingerprint = `${rawId}|${label}|${current}|${maximum}|${recoveryNote}|${index}`;
      const baseId = validId ? rawId : `custom-${stableKeyHash(fingerprint)}`;
      let id = baseId;
      let duplicateIndex = 2;
      while (usedIds.has(id)) {
        id = `${baseId.slice(0, 74)}-${duplicateIndex}`;
        duplicateIndex += 1;
      }
      usedIds.add(id);

      return [{ id, label, current, max: maximum, recoveryNote }];
    });
  }

  function normalizeBuiltInResourceUsage(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).slice(0, 50).flatMap(([key, rawSpent]) => {
      if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(key)) return [];
      const spent = toBoundedInteger(rawSpent, 0, BUILT_IN_RESOURCE_MAX, 0);
      return spent > 0 ? [[key, spent]] : [];
    }));
  }

  function freezeCastOption(value) {
    return Object.freeze({ ...value });
  }

  function buildSpellCastOptions(spec = {}) {
    const baseLevel = Math.max(1, Number.parseInt(spec.baseLevel, 10) || 1);
    const castMode = String(spec.castMode || "slot");
    const fixedCastLevel = Math.max(baseLevel, Number.parseInt(spec.fixedCastLevel, 10) || baseLevel);
    const freeControls = Array.isArray(spec.freeControls) ? spec.freeControls : [];
    const slotGroups = Array.isArray(spec.slotGroups) ? spec.slotGroups : [];
    const methods = [];
    const atWill = castMode === "at-will";
    const freeControl = freeControls.find(control => (
      control?.id && !control.checked && !control.disabled
    ));

    if (!atWill && freeControl) methods.push(freezeCastOption({
      id: "free",
      label: "免費次數",
      effectiveLevel: fixedCastLevel,
      resourceId: String(freeControl.id),
      resourceLabel: String(freeControl.label || "免費施法次數")
    }));

    if (atWill) methods.push(freezeCastOption({
      id: "at-will",
      label: "隨意施法",
      effectiveLevel: fixedCastLevel,
      resourceId: "",
      resourceLabel: "不消耗資源"
    }));

    if (!atWill && spec.ritual && spec.ritualAllowed) methods.push(freezeCastOption({
      id: "ritual",
      label: "儀式施法",
      effectiveLevel: baseLevel,
      resourceId: "",
      resourceLabel: String(spec.ritualExtraTime || "不消耗法術位")
    }));

    const slots = atWill ? [] : slotGroups.flatMap(group => {
      const level = Number.parseInt(group?.level, 10);
      if (!Number.isSafeInteger(level) || level < baseLevel) return [];
      const available = (Array.isArray(group.controls) ? group.controls : [])
        .filter(control => control?.id && !control.checked && !control.disabled);
      if (!available.length) return [];
      return [freezeCastOption({
        level,
        resourceId: String(available[0].id),
        available: available.length,
        hasUpcastEffect: level === baseLevel || Boolean(spec.hasUpcastEffect),
        noExtraEffect: level > baseLevel && !spec.hasUpcastEffect
      })];
    }).sort((left, right) => left.level - right.level);

    if (slots.length) methods.push(freezeCastOption({
      id: "slot",
      label: "法術位",
      effectiveLevel: slots[0].level,
      resourceId: slots[0].resourceId,
      resourceLabel: `${slots[0].level} 環法術位`
    }));

    const defaultMethod = methods.find(method => method.id === "free")
      || methods.find(method => method.id === "at-will")
      || methods.find(method => method.id === "slot")
      || methods.find(method => method.id === "ritual")
      || null;
    return Object.freeze({
      baseLevel,
      methods: Object.freeze(methods),
      slots: Object.freeze(slots),
      defaultMethod: defaultMethod?.id || "",
      defaultSlotLevel: slots[0]?.level || 0
    });
  }

  function getCanonicalSpellSlotGroups() {
    if (typeof document === "undefined") return [];
    return [1, 2, 3, 4].flatMap(level => {
      const row = document.getElementById(`spellslot${level}-row`);
      if (!row || row.style.display === "none" || row.hidden) return [];
      const controls = Array.from(row.querySelectorAll('input[type="checkbox"][id]'))
        .filter(input => !input.hidden && input.style.display !== "none")
        .map(input => ({ id: input.id, checked: input.checked, disabled: input.disabled }));
      return controls.length ? [{ level, controls }] : [];
    });
  }

  function getSpellCastOptions(entry = {}) {
    const spell = entry.spell || globalScope.SpellCatalog?.getSpell?.(entry.spellId);
    const metadata = globalScope.SpellCatalog?.getCastMetadata?.(spell?.spellId);
    if (!spell || spell.level < 1 || !metadata) return buildSpellCastOptions({ baseLevel: 1 });
    const discoveredFreeControls = globalScope.getSpellFreeUseControls?.(entry.spellSelect) || [];
    const latestFreeControls = discoveredFreeControls.length
      ? discoveredFreeControls
      : Array.isArray(entry.freeUseControls) ? entry.freeUseControls : [];
    return buildSpellCastOptions({
      baseLevel: spell.level,
      castMode: entry.castMode,
      fixedCastLevel: entry.fixedCastLevel,
      ritual: metadata.ritual,
      ritualAllowed: entry.ritualAllowed,
      ritualExtraTime: metadata.ritualExtraTime,
      hasUpcastEffect: metadata.hasUpcastEffect,
      freeControls: latestFreeControls.map(control => ({
        id: control.canonical?.id || "",
        checked: Boolean(control.canonical?.checked),
        disabled: Boolean(control.canonical?.disabled),
        label: control.label || control.title || "免費施法次數"
      })),
      slotGroups: getCanonicalSpellSlotGroups()
    });
  }

  function dispatchCanonicalCastUpdate(control) {
    control.dispatchEvent(new Event("input", { bubbles: true }));
    control.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function validateSpellCastSelection(options = {}, selection = {}) {
    const methodId = String(selection.method || "");
    const methods = Array.isArray(options.methods) ? options.methods : [];
    const slots = Array.isArray(options.slots) ? options.slots : [];
    const method = methods.find(candidate => candidate.id === methodId);
    if (!method) return Object.freeze({ ok: false, reason: "method-unavailable" });

    let effectiveLevel = method.effectiveLevel;
    let resourceId = method.resourceId || "";
    let resourceLabel = method.resourceLabel || "不消耗資源";
    let slot = null;
    if (methodId === "slot") {
      const slotLevel = Number.parseInt(selection.slotLevel, 10);
      slot = slots.find(candidate => candidate.level === slotLevel);
      if (!slot) return Object.freeze({ ok: false, reason: "slot-unavailable" });
      effectiveLevel = slot.level;
      resourceId = slot.resourceId;
      resourceLabel = `${slot.level} 環法術位`;
    }

    if (resourceId && resourceId !== String(selection.resourceId || "")) {
      return Object.freeze({ ok: false, reason: "resource-changed" });
    }

    return Object.freeze({
      ok: true,
      reason: "",
      method: methodId,
      effectiveLevel,
      resourceId,
      resourceLabel,
      hasUpcastEffect: methodId !== "slot" || !slot?.noExtraEffect
    });
  }

  function commitSpellCastResource(entry = {}, selection = {}) {
    const validated = validateSpellCastSelection(getSpellCastOptions(entry), selection);
    if (!validated.ok) return validated;

    if (validated.resourceId) {
      const resourceId = validated.resourceId;
      const canonical = typeof document !== "undefined" ? document.getElementById(resourceId) : null;
      const isCheckbox = typeof HTMLInputElement !== "undefined"
        && canonical instanceof HTMLInputElement
        && canonical.type === "checkbox";
      if (!isCheckbox || canonical.disabled || canonical.checked) {
        return Object.freeze({ ok: false, reason: "resource-changed" });
      }
      canonical.checked = true;
      dispatchCanonicalCastUpdate(canonical);
    }

    return validated;
  }

  function createCustomResourceId() {
    const randomId = globalScope.crypto?.randomUUID?.();
    if (randomId) return `custom-${randomId}`;
    return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function applyDamageState(currentHp, temporaryHp, amount) {
    const safeCurrentHp = toNonNegativeInteger(currentHp);
    const safeTemporaryHp = toNonNegativeInteger(temporaryHp);
    const safeAmount = toNonNegativeInteger(amount);
    const temporaryHpLost = Math.min(safeTemporaryHp, safeAmount);
    const damageAfterTemporaryHp = safeAmount - temporaryHpLost;
    const currentHpLost = Math.min(safeCurrentHp, damageAfterTemporaryHp);
    const overflowDamage = Math.max(0, damageAfterTemporaryHp - currentHpLost);

    return Object.freeze({
      currentHp: safeCurrentHp - currentHpLost,
      temporaryHp: safeTemporaryHp - temporaryHpLost,
      temporaryHpLost,
      currentHpLost,
      damageAfterTemporaryHp,
      overflowDamage
    });
  }

  function calculateConcentrationSaveDc(amount) {
    const safeAmount = toNonNegativeInteger(amount);
    return Math.min(30, Math.max(10, Math.floor(safeAmount / 2)));
  }

  function appendConcentrationSaveReminder(message, amount) {
    if (!combatState.concentrationSpellId) return message;
    const difficultyClass = calculateConcentrationSaveDc(amount);
    return `${message}專注中受傷，請進行體質豁免，難度 ${difficultyClass}。`;
  }

  function applyHealingState(currentHp, maximumHp, amount) {
    const safeCurrentHp = toNonNegativeInteger(currentHp);
    const safeMaximumHp = toNonNegativeInteger(maximumHp);
    const safeAmount = toNonNegativeInteger(amount);
    const restoredHp = Math.max(
      0,
      Math.min(safeAmount, safeMaximumHp - safeCurrentHp)
    );

    return Object.freeze({
      currentHp: safeCurrentHp + restoredHp,
      restoredHp
    });
  }

  function getExhaustionEffects(level) {
    const safeLevel = toBoundedInteger(level, 0, 6, 0);

    return Object.freeze({
      level: safeLevel,
      d20Penalty: safeLevel * 2,
      speedPenaltyFeet: safeLevel * 5,
      heroicSacrifice: safeLevel >= 6
    });
  }

  function evaluateDeathSaveRoll(roll) {
    const numeric = Number(roll);

    if (
      !Number.isSafeInteger(numeric)
      || numeric < 1
      || numeric > 20
    ) {
      return Object.freeze({
        valid: false,
        roll: null,
        outcome: "invalid",
        successes: 0,
        failures: 0,
        restoredHp: 0
      });
    }

    if (numeric === 20) {
      return Object.freeze({
        valid: true,
        roll: numeric,
        outcome: "revive",
        successes: 0,
        failures: 0,
        restoredHp: 1
      });
    }

    if (numeric === 1) {
      return Object.freeze({
        valid: true,
        roll: numeric,
        outcome: "failure",
        successes: 0,
        failures: 2,
        restoredHp: 0
      });
    }

    if (numeric >= 10) {
      return Object.freeze({
        valid: true,
        roll: numeric,
        outcome: "success",
        successes: 1,
        failures: 0,
        restoredHp: 0
      });
    }

    return Object.freeze({
      valid: true,
      roll: numeric,
      outcome: "failure",
      successes: 0,
      failures: 1,
      restoredHp: 0
    });
  }

  let combatState = {
    characterName: DEFAULT_COMBAT_STATE.characterName,
    temporaryHp: DEFAULT_COMBAT_STATE.temporaryHp,
    deathSaveSuccesses: DEFAULT_COMBAT_STATE.deathSaveSuccesses,
    deathSaveFailures: DEFAULT_COMBAT_STATE.deathSaveFailures,
    deathSaveStable: DEFAULT_COMBAT_STATE.deathSaveStable,
    heroicSacrifice: DEFAULT_COMBAT_STATE.heroicSacrifice,
    activeConditions: [],
    exhaustionLevel: DEFAULT_COMBAT_STATE.exhaustionLevel,
    concentrationSpellId: DEFAULT_COMBAT_STATE.concentrationSpellId,
    endedConcentrations: [],
    builtInResourceUsage: {},
    customResources: []
  };
  let tabletopActionPreferences = null;

  let undoSnapshot = null;
  let initialized = false;
  let isUpdatingHp = false;
  let currentMode = "sheet";
  let currentPanel = "overview";
  let conditionModalTrigger = null;
  let conditionModalBackgroundStates = null;

  const modeScrollPositions = {
    sheet: 0,
    tabletop: 0
  };

  const panelScrollPositions = Object.fromEntries(
    TABLETOP_PANELS.map(panel => [panel, 0])
  );

  const elements = {};

  function getTabletopActionPreferencesState() {
    if (tabletopActionPreferences) return tabletopActionPreferences;
    let parsed = null;
    try {
      const stored = globalScope.dndStorage?.getItem(TABLETOP_ACTION_PREFERENCES_KEY);
      parsed = stored ? JSON.parse(stored) : null;
    } catch (_error) {
      parsed = null;
    }
    tabletopActionPreferences = normalizeTabletopActionPreferences(parsed);
    return tabletopActionPreferences;
  }

  function emitTabletopActionPreferencesChange() {
    if (typeof globalScope.CustomEvent !== "function") return;
    globalScope.dispatchEvent?.(new globalScope.CustomEvent("tabletopactionpreferenceschange", {
      detail: getTabletopActionPreferences()
    }));
  }

  function persistTabletopActionPreferences(value) {
    const normalized = normalizeTabletopActionPreferences(value);
    try {
      if (!globalScope.dndStorage?.setItem) return false;
      const stored = globalScope.dndStorage.setItem(
        TABLETOP_ACTION_PREFERENCES_KEY,
        JSON.stringify(normalized)
      );
      if (stored === false) return false;
    } catch (_error) {
      return false;
    }
    tabletopActionPreferences = normalized;
    emitTabletopActionPreferencesChange();
    return true;
  }

  function getTabletopActionPreferences() {
    const preferences = getTabletopActionPreferencesState();
    return Object.freeze({
      version: preferences.version,
      customActions: Object.freeze(
        preferences.customActions.map(action => Object.freeze({ ...action }))
      ),
      hiddenKeys: Object.freeze([...preferences.hiddenKeys]),
      notes: preferences.notes
    });
  }

  function setTabletopActionNotes(notes) {
    const current = getTabletopActionPreferencesState();
    const normalizedNotes = String(notes ?? "").slice(0, TABLETOP_ACTION_NOTES_MAX);
    if (normalizedNotes === current.notes) return true;
    return persistTabletopActionPreferences({ ...current, notes: normalizedNotes });
  }

  function addCustomTabletopAction(action = {}) {
    const current = getTabletopActionPreferencesState();
    if (current.customActions.length >= CUSTOM_TABLETOP_ACTION_LIMIT) {
      return Object.freeze({ ok: false, reason: "limit" });
    }
    const customActions = normalizeCustomTabletopActions([
      ...current.customActions,
      { ...action, id: createCustomTabletopActionId() }
    ]);
    if (customActions.length !== current.customActions.length + 1) {
      return Object.freeze({ ok: false, reason: "invalid" });
    }
    const created = customActions[customActions.length - 1];
    if (!persistTabletopActionPreferences({ ...current, customActions })) {
      return Object.freeze({ ok: false, reason: "storage" });
    }
    return Object.freeze({ ok: true, action: Object.freeze({ ...created }) });
  }

  function updateCustomTabletopAction(actionId, patch = {}) {
    const current = getTabletopActionPreferencesState();
    const index = current.customActions.findIndex(action => action.id === actionId);
    if (index === -1) return Object.freeze({ ok: false, reason: "not-found" });
    const nextActions = current.customActions.map(action => ({ ...action }));
    nextActions[index] = { ...nextActions[index], ...patch, id: actionId };
    const customActions = normalizeCustomTabletopActions(nextActions);
    const updated = customActions.find(action => action.id === actionId);
    if (!updated || customActions.length !== nextActions.length) {
      return Object.freeze({ ok: false, reason: "invalid" });
    }
    if (!persistTabletopActionPreferences({ ...current, customActions })) {
      return Object.freeze({ ok: false, reason: "storage" });
    }
    return Object.freeze({ ok: true, action: Object.freeze({ ...updated }) });
  }

  function removeCustomTabletopAction(actionId) {
    const current = getTabletopActionPreferencesState();
    const removed = current.customActions.find(action => action.id === actionId);
    if (!removed) return Object.freeze({ ok: false, reason: "not-found" });
    const customActions = current.customActions.filter(action => action.id !== actionId);
    const hiddenKey = `custom:${actionId}`;
    const hiddenKeys = current.hiddenKeys.filter(key => key !== hiddenKey);
    if (!persistTabletopActionPreferences({ ...current, customActions, hiddenKeys })) {
      return Object.freeze({ ok: false, reason: "storage" });
    }
    return Object.freeze({ ok: true, action: Object.freeze({ ...removed }) });
  }

  function setTabletopActionHidden(hiddenKey, hidden) {
    const current = getTabletopActionPreferencesState();
    const candidate = hidden
      ? [...current.hiddenKeys, hiddenKey]
      : current.hiddenKeys.filter(key => key !== hiddenKey);
    const hiddenKeys = normalizeHiddenTabletopActionKeys(candidate, current.customActions);
    if (hidden && !hiddenKeys.includes(hiddenKey)) {
      return Object.freeze({ ok: false, reason: "invalid" });
    }
    if (hiddenKeys.length === current.hiddenKeys.length
      && hiddenKeys.every((key, index) => key === current.hiddenKeys[index])) {
      return Object.freeze({ ok: true, changed: false });
    }
    if (!persistTabletopActionPreferences({ ...current, hiddenKeys })) {
      return Object.freeze({ ok: false, reason: "storage" });
    }
    return Object.freeze({ ok: true, changed: true });
  }

  function restoreTabletopActionCategory(mode) {
    if (!TABLETOP_ACTION_MODES.includes(mode)) {
      return Object.freeze({ ok: false, reason: "invalid" });
    }
    const current = getTabletopActionPreferencesState();
    const customIds = new Set(
      current.customActions.filter(action => action.mode === mode).map(action => action.id)
    );
    const officialPrefix = `official:${mode}:`;
    const hiddenKeys = current.hiddenKeys.filter(key => (
      !key.startsWith(officialPrefix)
      && !(key.startsWith("custom:") && customIds.has(key.slice("custom:".length)))
    ));
    const restored = current.hiddenKeys.length - hiddenKeys.length;
    if (!restored) return Object.freeze({ ok: true, restored: 0 });
    if (!persistTabletopActionPreferences({ ...current, hiddenKeys })) {
      return Object.freeze({ ok: false, reason: "storage" });
    }
    return Object.freeze({ ok: true, restored });
  }

  function getConditionData() {
    return Array.isArray(globalScope.DND_CONDITIONS)
      ? globalScope.DND_CONDITIONS
      : [];
  }

  function getConditionKeys() {
    return new Set(
      getConditionData().map((condition) => condition.key)
    );
  }

  function normalizeCombatState(data = {}) {
    const allowedKeys = getConditionKeys();
    const rawConditions = Array.isArray(data.activeConditions)
      ? data.activeConditions
      : [];

    const activeConditions = [
      ...new Set(rawConditions.map(String))
    ].filter(
      (key) => key !== "exhaustion" && allowedKeys.has(key)
    );

    let exhaustionLevel = toBoundedInteger(
      data.exhaustionLevel,
      0,
      6,
      0
    );

    if (
      exhaustionLevel === 0
      && rawConditions.includes("exhaustion")
    ) {
      exhaustionLevel = 1;
    }

    let deathSaveSuccesses = toBoundedInteger(
      data.deathSaveSuccesses,
      0,
      3,
      0
    );

    let deathSaveFailures = toBoundedInteger(
      data.deathSaveFailures,
      0,
      3,
      0
    );

    let deathSaveStable =
      data.deathSaveStable === true;

    const hasHeroicSacrificeFlag =
      Object.prototype.hasOwnProperty.call(
        data,
        "heroicSacrifice"
      );

    let heroicSacrifice =
      data.heroicSacrifice === true;

    if (
      !hasHeroicSacrificeFlag
      && exhaustionLevel >= 6
    ) {
      heroicSacrifice = true;
    }

    if (deathSaveFailures >= 3) {
      heroicSacrifice = true;
    }

    if (
      !heroicSacrifice
      && (
        deathSaveStable
        || deathSaveSuccesses >= 3
      )
    ) {
      deathSaveSuccesses = 0;
      deathSaveFailures = 0;
      deathSaveStable = true;
    }

    if (heroicSacrifice) {
      deathSaveStable = false;
    }

    return {
      characterName: normalizeCharacterName(data.characterName),
      temporaryHp: toNonNegativeInteger(
        data.temporaryHp
      ),
      deathSaveSuccesses,
      deathSaveFailures,
      deathSaveStable,
      heroicSacrifice,
      activeConditions,
      exhaustionLevel,
      concentrationSpellId: normalizeConcentrationSpellId(data.concentrationSpellId),
      endedConcentrations: normalizeEndedConcentrations(data.endedConcentrations),
      builtInResourceUsage: normalizeBuiltInResourceUsage(data.builtInResourceUsage),
      customResources: normalizeCustomResources(data.customResources)
    };
  }

  function collectState() {
    return {
      characterName: combatState.characterName,
      temporaryHp: combatState.temporaryHp,
      deathSaveSuccesses:
        combatState.deathSaveSuccesses,
      deathSaveFailures:
        combatState.deathSaveFailures,
      deathSaveStable:
        combatState.deathSaveStable,
      heroicSacrifice:
        combatState.heroicSacrifice,
      activeConditions: [
        ...combatState.activeConditions
      ],
      exhaustionLevel:
        combatState.exhaustionLevel,
      concentrationSpellId:
        combatState.concentrationSpellId,
      endedConcentrations:
        combatState.endedConcentrations.map(entry => ({ ...entry })),
      builtInResourceUsage: {
        ...combatState.builtInResourceUsage
      },
      customResources:
        combatState.customResources.map(resource => ({ ...resource }))
    };
  }

  function getConcentrationSpellId() {
    return combatState.concentrationSpellId;
  }

  function getEndedConcentrations() {
    return combatState.endedConcentrations.map(entry => Object.freeze({ ...entry }));
  }

  function getCharacterName() {
    return combatState.characterName;
  }

  function setCharacterName(value, message = "角色名稱已更新。") {
    const normalizedName = normalizeCharacterName(value);
    if (combatState.characterName === normalizedName) return false;
    combatState.characterName = normalizedName;
    markStateChanged(message);
    return true;
  }

  async function requestCharacterName(trigger) {
    if (typeof globalScope.AppDialog?.showContent !== "function") return;

    let input = null;
    const fieldId = `tabletop-character-name-${Date.now()}`;
    const hintId = `${fieldId}-hint`;

    const nextName = await globalScope.AppDialog.showContent({
      title: "修改角色名稱",
      message: "名稱會顯示在桌邊模式，並自動帶入 PDF 匯出。",
      trigger,
      cancelLabel: "取消",
      confirmLabel: "儲存名稱",
      initialFocus: "content",
      renderContent(body) {
        const field = document.createElement("label");
        field.className = "app-dialog__number-field";
        field.htmlFor = fieldId;
        field.appendChild(document.createTextNode("角色名稱"));

        input = document.createElement("input");
        input.id = fieldId;
        input.className = "app-dialog__number-input tabletop-character-name-input";
        input.type = "text";
        input.value = combatState.characterName;
        input.placeholder = "例如：艾尼克斯・薩卡蘭姆";
        input.autocomplete = "off";
        input.spellcheck = false;
        input.dataset.stateTransient = "true";

        const hint = document.createElement("span");
        hint.id = hintId;
        hint.className = "app-dialog__number-hint";
        hint.textContent = "留空可還原提示文字。PDF 匯出時仍可修改名稱。";

        input.setAttribute("aria-describedby", hintId);
        input.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" || event.isComposing) return;
          event.preventDefault();
          body.closest(".app-dialog__surface")
            ?.querySelector(".app-dialog__button--primary")
            ?.click();
        });

        field.append(input, hint);
        body.appendChild(field);
      },
      resolveConfirm() {
        return input?.value.trim() || "";
      }
    });

    if (typeof nextName === "string") setCharacterName(nextName);
  }

  function setConcentrationSpellId(spellId, message = "") {
    const normalizedId = normalizeConcentrationSpellId(spellId);
    if (combatState.concentrationSpellId === normalizedId) return false;
    const previousId = combatState.concentrationSpellId;
    if (previousId && normalizedId) {
      combatState.endedConcentrations = [
        ...combatState.endedConcentrations,
        {
          id: createConcentrationNoticeId(previousId, normalizedId),
          spellId: previousId,
          replacementSpellId: normalizedId
        }
      ].slice(-ENDED_CONCENTRATION_LIMIT);
    }
    combatState.concentrationSpellId = normalizedId;
    markStateChanged(message);
    return true;
  }

  function stopConcentration(message = "已停止專注。") {
    return setConcentrationSpellId("", message);
  }

  function dismissEndedConcentration(noticeId, message = "已關閉專注提醒。") {
    const normalizedId = typeof noticeId === "string" ? noticeId.trim() : "";
    const next = combatState.endedConcentrations.filter(entry => entry.id !== normalizedId);
    if (!normalizedId || next.length === combatState.endedConcentrations.length) return false;
    combatState.endedConcentrations = next;
    markStateChanged(message);
    return true;
  }

  function getBuiltInResourceSpent(resourceKey) {
    return toNonNegativeInteger(combatState.builtInResourceUsage[resourceKey]);
  }

  function setBuiltInResourceSpent(resourceKey, value, maximum) {
    const key = String(resourceKey || "").trim();
    if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(key)) return false;
    const safeMaximum = toBoundedInteger(maximum, 1, BUILT_IN_RESOURCE_MAX, 1);
    const spent = toBoundedInteger(value, 0, safeMaximum, getBuiltInResourceSpent(key));
    if (spent === getBuiltInResourceSpent(key)) return true;
    combatState.builtInResourceUsage = { ...combatState.builtInResourceUsage };
    if (spent > 0) combatState.builtInResourceUsage[key] = spent;
    else delete combatState.builtInResourceUsage[key];
    markStateChanged();
    return true;
  }

  function getCustomResources() {
    return combatState.customResources.map(resource => Object.freeze({ ...resource }));
  }

  function addCustomResource(resource) {
    if (combatState.customResources.length >= CUSTOM_RESOURCE_LIMIT) return null;
    const normalized = normalizeCustomResources([
      ...combatState.customResources,
      { ...resource, id: createCustomResourceId() }
    ]);
    const created = normalized[normalized.length - 1];
    if (!created || normalized.length === combatState.customResources.length) return null;
    combatState.customResources = normalized;
    markStateChanged(`已新增自訂資源「${created.label}」。`);
    return Object.freeze({ ...created });
  }

  function updateCustomResource(resourceId, patch = {}) {
    const index = combatState.customResources.findIndex(resource => resource.id === resourceId);
    if (index === -1) return false;
    const next = combatState.customResources.map(resource => ({ ...resource }));
    next[index] = { ...next[index], ...patch, id: resourceId };
    const normalized = normalizeCustomResources(next);
    const updated = normalized.find(resource => resource.id === resourceId);
    if (!updated || normalized.length !== next.length) return false;
    combatState.customResources = normalized;
    markStateChanged(`已更新自訂資源「${updated.label}」。`);
    return true;
  }

  function setCustomResourceCurrent(resourceId, value) {
    const resource = combatState.customResources.find(item => item.id === resourceId);
    if (!resource) return false;
    const current = toBoundedInteger(value, 0, resource.max, resource.current);
    if (current === resource.current) return true;
    return updateCustomResource(resourceId, { current });
  }

  function removeCustomResource(resourceId) {
    const resource = combatState.customResources.find(item => item.id === resourceId);
    if (!resource) return false;
    combatState.customResources = combatState.customResources.filter(item => item.id !== resourceId);
    markStateChanged(`已刪除自訂資源「${resource.label}」。`);
    return true;
  }

  function hasDeathSaveState() {
    return (
      combatState.deathSaveSuccesses > 0
      || combatState.deathSaveFailures > 0
      || combatState.deathSaveStable
    );
  }

  function clearDeathSaves() {
    const changed = hasDeathSaveState();

    combatState.deathSaveSuccesses = 0;
    combatState.deathSaveFailures = 0;
    combatState.deathSaveStable = false;

    return changed;
  }

  function clearHeroicSacrifice() {
    const changed =
      combatState.heroicSacrifice;

    combatState.heroicSacrifice = false;

    return changed;
  }

  function clearCriticalLifeState() {
    const deathSaveChanged =
      clearDeathSaves();

    const sacrificeChanged =
      clearHeroicSacrifice();

    return (
      deathSaveChanged
      || sacrificeChanged
    );
  }

  function addActiveCondition(conditionKey) {
    if (combatState.activeConditions.includes(conditionKey)) {
      return false;
    }

    combatState.activeConditions = [
      ...combatState.activeConditions,
      conditionKey
    ];

    return true;
  }

  function removeActiveCondition(conditionKey) {
    if (!combatState.activeConditions.includes(conditionKey)) {
      return false;
    }

    combatState.activeConditions = combatState.activeConditions.filter(
      key => key !== conditionKey
    );

    return true;
  }

  function enterDeathSaveCondition() {
    return addActiveCondition("unconscious");
  }

  function reviveFromZeroHpCondition() {
    const unconsciousRemoved = removeActiveCondition("unconscious");
    const proneAdded = addActiveCondition("prone");

    return unconsciousRemoved || proneAdded;
  }

  function becomeStable() {
    if (combatState.heroicSacrifice) {
      return false;
    }

    const changed =
      !combatState.deathSaveStable
      || combatState.deathSaveSuccesses > 0
      || combatState.deathSaveFailures > 0;

    combatState.deathSaveSuccesses = 0;
    combatState.deathSaveFailures = 0;
    combatState.deathSaveStable = true;
    enterDeathSaveCondition();

    return changed;
  }

  function readIntegerInput(input) {
    if (
      !input
      || String(input.value).trim() === ""
    ) {
      return null;
    }

    const numeric = Number(input.value);

    return Number.isSafeInteger(numeric)
      ? numeric
      : null;
  }

  function readCurrentHp() {
    const value =
      readIntegerInput(
        elements.currentHpSource
      );

    return value !== null && value >= 0
      ? value
      : null;
  }

  function readMaximumHp() {
    const value =
      readIntegerInput(
        elements.maximumHpSource
      );

    return value !== null && value >= 0
      ? value
      : null;
  }

  function setCurrentHp(value) {
    if (!elements.currentHpSource) {
      return;
    }

    isUpdatingHp = true;

    try {
      elements.currentHpSource.value =
        value === null
          ? ""
          : String(
              toNonNegativeInteger(value)
            );

      elements.currentHpSource.dispatchEvent(
        new Event(
          "input",
          { bubbles: true }
        )
      );

      elements.currentHpSource.dispatchEvent(
        new Event(
          "change",
          { bubbles: true }
        )
      );
    } finally {
      isUpdatingHp = false;
    }
  }

  function restoreHitPoints(
    amount,
    { sourceLabel = "治療" } = {}
  ) {
    const safeAmount =
      toNonNegativeInteger(amount);

    if (safeAmount <= 0) {
      return Object.freeze({
        ok: false,
        reason: "invalid-amount",
        requestedAmount: safeAmount,
        restoredHp: 0
      });
    }

    const currentHp = readCurrentHp();
    if (currentHp === null) {
      return Object.freeze({
        ok: false,
        reason: "current-hp-unavailable",
        requestedAmount: safeAmount,
        restoredHp: 0
      });
    }

    const maximumHp = readMaximumHp();
    if (maximumHp === null || maximumHp <= 0) {
      return Object.freeze({
        ok: false,
        reason: "maximum-hp-unavailable",
        requestedAmount: safeAmount,
        restoredHp: 0
      });
    }

    const result = applyHealingState(
      currentHp,
      maximumHp,
      safeAmount
    );
    if (result.restoredHp <= 0) {
      return Object.freeze({
        ok: true,
        reason: "at-maximum-hp",
        requestedAmount: safeAmount,
        restoredHp: 0,
        currentHp
      });
    }

    undoSnapshot = createLifeSnapshot();
    setCurrentHp(result.currentHp);

    const revived = currentHp === 0
      && result.currentHp > 0;
    if (result.currentHp > 0) {
      clearCriticalLifeState();
      if (revived) reviveFromZeroHpCondition();
    }

    const label = String(sourceLabel || "治療");
    markStateChanged(
      revived
        ? `${label}回復 ${result.restoredHp} 點 HP；已解除昏迷並改為倒地。`
        : `${label}回復 ${result.restoredHp} 點 HP。`
    );

    return Object.freeze({
      ok: true,
      reason: "",
      requestedAmount: safeAmount,
      restoredHp: result.restoredHp,
      currentHp: result.currentHp,
      revived
    });
  }

  function markHeroicSacrifice({
    forceHpZero = true
  } = {}) {
    const changed =
      !combatState.heroicSacrifice
      || combatState.deathSaveStable;

    combatState.heroicSacrifice = true;
    combatState.deathSaveStable = false;

    if (
      forceHpZero
      && readCurrentHp() !== 0
    ) {
      setCurrentHp(0);
    }

    return changed;
  }

  function addDeathSaveFailures(
    amount = 1
  ) {
    if (combatState.heroicSacrifice) {
      return Object.freeze({
        added: 0,
        total:
          combatState.deathSaveFailures,
        heroicSacrifice: true
      });
    }

    const safeAmount =
      toNonNegativeInteger(amount);

    enterDeathSaveCondition();
    combatState.deathSaveStable = false;

    const previous =
      combatState.deathSaveFailures;

    combatState.deathSaveFailures =
      Math.min(
        3,
        previous + safeAmount
      );

    if (
      combatState.deathSaveFailures >= 3
    ) {
      markHeroicSacrifice({
        forceHpZero: true
      });
    }

    return Object.freeze({
      added:
        combatState.deathSaveFailures
        - previous,
      total:
        combatState.deathSaveFailures,
      heroicSacrifice:
        combatState.heroicSacrifice
    });
  }

  function addDeathSaveSuccesses(
    amount = 1
  ) {
    if (
      combatState.heroicSacrifice
      || combatState.deathSaveStable
    ) {
      return Object.freeze({
        added: 0,
        total:
          combatState.deathSaveSuccesses,
        stable:
          combatState.deathSaveStable
      });
    }

    const safeAmount =
      toNonNegativeInteger(amount);

    enterDeathSaveCondition();
    const previous =
      combatState.deathSaveSuccesses;

    combatState.deathSaveSuccesses =
      Math.min(
        3,
        previous + safeAmount
      );

    const reachedStable =
      combatState.deathSaveSuccesses >= 3;

    if (reachedStable) {
      becomeStable();
    }

    return Object.freeze({
      added: reachedStable
        ? 3 - previous
        : combatState.deathSaveSuccesses
          - previous,
      total:
        combatState.deathSaveSuccesses,
      stable:
        combatState.deathSaveStable
    });
  }

  function createLifeSnapshot() {
    return {
      currentHp: readCurrentHp(),
      temporaryHp:
        combatState.temporaryHp,
      deathSaveSuccesses:
        combatState.deathSaveSuccesses,
      deathSaveFailures:
        combatState.deathSaveFailures,
      deathSaveStable:
        combatState.deathSaveStable,
      heroicSacrifice:
        combatState.heroicSacrifice,
      activeConditions: [
        ...combatState.activeConditions
      ]
    };
  }

  function scheduleCharacterSave() {
    if (
      typeof globalScope
        .scheduleSaveAllFields
        === "function"
    ) {
      globalScope.scheduleSaveAllFields();
    }
  }

  function emitStateChange() {
    globalScope.dispatchEvent?.(
      new CustomEvent(
        "tabletopstatechange",
        {
          detail: collectState()
        }
      )
    );
  }

  function markStateChanged(
    message = ""
  ) {
    render();
    scheduleCharacterSave();

    if (message) {
      announce(message);
    }

    emitStateChange();
  }

  function announce(message) {
    if (!elements.liveStatus) {
      return;
    }

    elements.liveStatus.textContent = "";

    globalScope.requestAnimationFrame(
      () => {
        elements.liveStatus.textContent =
          message;
      }
    );
  }

  function setFormError(
    input,
    errorElement,
    message = ""
  ) {
    if (!input || !errorElement) {
      return;
    }

    const hasError = !!message;

    input.setAttribute(
      "aria-invalid",
      String(hasError)
    );

    errorElement.textContent = message;

    if (hasError) {
      input.focus();
    }
  }

  function parseOperationAmount(
    input,
    {
      allowZero = false
    } = {}
  ) {
    const raw =
      String(
        input?.value || ""
      ).trim();

    if (!/^\d+$/.test(raw)) {
      return null;
    }

    const value = Number(raw);

    if (
      !Number.isSafeInteger(value)
      || value < (
        allowZero ? 0 : 1
      )
    ) {
      return null;
    }

    return value;
  }

  function getSelectedLabel(
    id,
    fallback
  ) {
    const select =
      document.getElementById(id);

    if (
      !(select instanceof HTMLSelectElement)
      || !select.value
    ) {
      return fallback;
    }

    return (
      select.selectedOptions[0]
        ?.textContent
        ?.trim()
      || fallback
    );
  }

  function getDisplayValue(
    id,
    suffix = ""
  ) {
    const input =
      document.getElementById(id);

    const value =
      input && "value" in input
        ? String(input.value).trim()
        : "";

    return value
      ? `${value}${suffix}`
      : "—";
  }

  function getReadOnlySourceValue(source) {
    if (!source) return "—";

    const value =
      "value" in source
        ? String(source.value).trim()
        : String(source.textContent || "").trim();

    return value || "—";
  }

  function parseRollModifier(value) {
    const normalized = String(value ?? "")
      .trim()
      .replace(/−/g, "-")
      .replace(/＋/g, "+");
    if (!/^[+-]?\d+$/.test(normalized)) return null;
    const modifier = Number(normalized);
    return Number.isSafeInteger(modifier) ? modifier : null;
  }

  function createQuickRollButton(text, label, request, className = "tabletop-inline-roll", onRoll = null) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = text;
    button.disabled = !request || !globalScope.DiceRoller?.isEnabled?.();
    button.setAttribute("aria-label", button.disabled ? `${label}；請先開啟擲骰系統` : `擲${label}`);
    button.addEventListener("click", () => {
      const result = globalScope.DiceRoller?.roll?.({ ...request, label });
      if (result && typeof onRoll === "function") onRoll(result);
    });
    return button;
  }

  function createReadOnlyValue(label, value, className, role = "", rollLabel = "") {
    const item = document.createElement("span");
    item.className = className;
    if (role) item.setAttribute("role", role);

    const name = document.createElement("span");
    name.className = `${className}__label`;
    name.textContent = label;

    const number = document.createElement("strong");
    number.className = `${className}__value`;
    number.textContent = value;

    const modifier = parseRollModifier(value);
    if (rollLabel) {
      const button = createQuickRollButton(
        "",
        rollLabel,
        modifier === null ? null : {
          count: 1,
          sides: 20,
          modifier,
          includeModifier: true
        }
      );
      button.append(name, number);
      item.appendChild(button);
    } else {
      item.append(name, number);
    }
    return item;
  }

  function getAbilityLabel(ability) {
    return document.querySelector(
      `label[for="prof-${ability}"] .save-full`
    )?.textContent?.trim() || ability.toUpperCase();
  }

  function getSelectedRace() {
    return document.getElementById("race")?.value || "";
  }

  function getDarkvisionEntry() {
    const race = getSelectedRace();
    const racialRange = {
      dragonborn: 60,
      dwarf: 120,
      elf: 60,
      gnome: 60,
      orc: 120,
      tiefling: 60
    }[race] || 0;
    const drowRange = race === "elf" && document.getElementById("elf-lineage")?.value === "drow" ? 120 : 0;
    const characterLevel = Number.parseInt(document.getElementById("level")?.value || "0", 10) || 0;
    const hasDevilsSight = document.getElementById("class")?.value === "warlock"
      && characterLevel >= 2
      && Boolean(globalScope.hasWarlockInvocation?.("魔鬼視界"));
    const range = Math.max(racialRange, drowRange, hasDevilsSight ? 120 : 0);
    if (!range) return null;

    return {
      label: "黑暗視覺",
      value: `${range} 呎`,
      detail: hasDevilsSight
        ? "魔鬼視界：可在 120 呎內的魔法黑暗、非魔法黑暗與微光中正常視物。"
        : ""
    };
  }

  function getDragonbornResistanceEntry() {
    if (getSelectedRace() !== "dragonborn") return null;
    const ancestry = document.getElementById("dragonborn-ancestry")?.value || "";
    const damageType = {
      acid: "強酸",
      lightning: "閃電",
      fire: "火焰",
      poison: "毒素",
      cold: "冷凍"
    }[ancestry.split("_").pop()] || "";
    if (!damageType) return null;
    return {
      label: "龍族血統",
      detail: `抗性：${damageType}傷害減半。`
    };
  }

  function buildSorcererElementalAffinityEntry({ className, characterLevel, damageType }) {
    const level = Number.parseInt(characterLevel, 10) || 0;
    const damageTypeLabel = {
      acid: "強酸",
      cold: "冷凍",
      fire: "火焰",
      lightning: "閃電",
      poison: "毒素"
    }[damageType] || "";
    if (className !== "sorcerer" || level < 6 || !damageTypeLabel) return null;
    return {
      label: "元素親和",
      detail: `抗性：${damageTypeLabel}傷害減半。`
    };
  }

  function getSorcererElementalAffinityEntry() {
    return buildSorcererElementalAffinityEntry({
      className: document.getElementById("class")?.value || "",
      characterLevel: document.getElementById("level")?.value || "",
      damageType: document.getElementById("sorcerer-elemental-affinity-damage-type")?.value || ""
    });
  }

  function getTieflingResistanceEntry() {
    if (getSelectedRace() !== "tiefling") return null;
    const legacy = document.getElementById("tiefling-legacy")?.value || "";
    const resistance = {
      abyssal: { label: "深淵血統抗性", damageType: "毒素" },
      chthonic: { label: "冥界血統抗性", damageType: "黯蝕" },
      infernal: { label: "煉獄血統抗性", damageType: "火焰" }
    }[legacy];
    if (!resistance) return null;
    return {
      label: resistance.label,
      detail: `抗性：${resistance.damageType}傷害減半。`
    };
  }

  function getDwarfResistanceEntry() {
    if (getSelectedRace() !== "dwarf") return null;
    return {
      label: "矮人體魄",
      detail: "抗性：毒素傷害減半。"
    };
  }

  function hasSelectedFeat(featName) {
    return Array.from(document.querySelectorAll("#feats-area select"))
      .some(select => select.value === featName);
  }

  function isWearingHeavyArmor() {
    const armorName = document.getElementById("armor")?.value || "";
    return Array.from(globalScope.armors || [])
      .some(armor => armor?.名稱 === armorName && armor?.分類 === "重甲");
  }

  function getCharacterProficiencyBonus() {
    const level = Number.parseInt(document.getElementById("level")?.value || "", 10);
    if (!Number.isInteger(level) || level < 1) return null;
    const proficiencyBonus = Number(globalScope.calculateProficiencyBonus?.(level));
    return Number.isFinite(proficiencyBonus) ? proficiencyBonus : null;
  }

  function getFighterTacticalMindEntry() {
    const isFighter = document.getElementById("class")?.value === "fighter";
    const characterLevel = Number.parseInt(document.getElementById("level")?.value || "", 10) || 0;
    if (!isFighter || characterLevel < 2) return null;
    return {
      label: "戰術思維",
      detail: "屬性檢定失敗時可嘗試消耗「回氣」+1d10 使其成功，如果檢定依舊失敗，回氣次數不消耗。"
    };
  }

  function getMonkSlowFallOverviewEntry() {
    const selectedClass = document.getElementById("class")?.value || "";
    const characterLevel = Number.parseInt(document.getElementById("level")?.value || "", 10) || 0;
    if (selectedClass !== "monk" || characterLevel < 4) return null;
    return {
      label: "輕身墜",
      detail: `當你墜落時，可用「反應」減少 ${characterLevel * 5} 傷害。`
    };
  }

  function isDevotionPaladin() {
    const selectedClass = document.getElementById("class")?.value || "";
    const characterLevel = Number.parseInt(document.getElementById("level")?.value || "", 10) || 0;
    if (selectedClass !== "paladin" || characterLevel < 3) return false;
    return Array.from(
      document.querySelectorAll('#classFeatures .paladin-feature[data-feature-level="3"] h3')
    ).some(heading => (
      String(heading.textContent || "").trim() === "等級 3：祝聖武器（奉獻子職）"
    ));
  }

  function getPaladinAuraOverviewEntry() {
    const selectedClass = document.getElementById("class")?.value || "";
    const characterLevel = Number.parseInt(document.getElementById("level")?.value || "", 10) || 0;
    if (selectedClass !== "paladin" || characterLevel < 6) return null;
    const rawCharisma = String(document.getElementById("cha")?.value || "").trim();
    const charismaModifier = rawCharisma ? globalScope.calculateAbilityModifier?.(rawCharisma) : 0;
    const bonus = Math.max(1, Number.isFinite(charismaModifier) ? charismaModifier : 0);
    return {
      label: "守護靈氣",
      detail: characterLevel >= 7 && isDevotionPaladin()
        ? `你與 10 呎內盟友的豁免 +${bonus}，並免疫魅惑（已有的魅惑會暫停）；失能時無效。`
        : `你與 10 呎內盟友的豁免 +${bonus}；失能時無效。`
    };
  }

  function getRogueUncannyDodgeOverviewEntry() {
  const selectedClass = document.getElementById("class")?.value || "";
  const characterLevel = Number.parseInt(document.getElementById("level")?.value || "", 10) || 0;
  if (selectedClass !== "rogue" || characterLevel < 5) return null;
  return {
    label: "直覺閃避",
    detail: "當你看見攻擊者命中你時，可用反應讓傷害減半（捨去小數）。"
  };
}

function getRogueReliableTalentEntry() {
  const selectedClass = document.getElementById("class")?.value || "";
  const characterLevel = Number.parseInt(document.getElementById("level")?.value || "", 10) || 0;
  if (selectedClass !== "rogue" || characterLevel < 7) return null;
  return {
    label: "可靠才能",
    detail: "當你使用有熟練的技能或工具進行屬性檢定時，可以將d20骰中9或以下的結果視為10。"
  };
}

  function getWarlockDarkOnesBlessingOverviewEntry() {
  const selectedClass = document.getElementById("class")?.value || "";
  const characterLevel = Number.parseInt(document.getElementById("level")?.value || "", 10) || 0;
  if (selectedClass !== "warlock" || characterLevel < 3) return null;
  const rawCharisma = String(document.getElementById("cha")?.value || "").trim();
  const charismaModifier = rawCharisma ? globalScope.calculateAbilityModifier?.(rawCharisma) : 0;
  const temporaryHp = Math.max(1, characterLevel + (Number.isFinite(charismaModifier) ? charismaModifier : 0));
  return {
    label: "黑暗之賜",
    detail: `在你 10 呎內的敵對生物生命值降到 0 時，你獲得 ${temporaryHp} 點臨時生命值（至少 1）。`
  };
}

function getSorcererElementalAffinitySpellEntry() {
  const selectedClass = document.getElementById("class")?.value || "";
  const characterLevel = Number.parseInt(document.getElementById("level")?.value || "", 10) || 0;
  if (selectedClass !== "sorcerer" || characterLevel < 6) return null;
  const damageTypeSelect = document.getElementById("sorcerer-elemental-affinity-damage-type");
  if (!damageTypeSelect?.value) return null;
  const damageType = String(damageTypeSelect.selectedOptions?.[0]?.textContent || "").trim();
  if (!damageType) return null;
  const rawCharisma = String(document.getElementById("cha")?.value || "").trim();
  const charismaModifier = rawCharisma ? globalScope.calculateAbilityModifier?.(rawCharisma) : 0;
  const bonus = Number.isFinite(charismaModifier) ? charismaModifier : 0;
  const signedBonus = bonus >= 0 ? `+${bonus}` : String(bonus);
  return {
    label: "元素親和",
    detail: `施展${damageType}類型法術時，可 ${signedBonus} 點傷害。`
  };
}

  function getCharacterDefenseEntries() {
    const race = getSelectedRace();
    const characterLevel = Number.parseInt(document.getElementById("level")?.value || "", 10) || 0;
    const selectedClass = document.getElementById("class")?.value || "";
    const isBarbarian = selectedClass === "barbarian";
    const isFighter = selectedClass === "fighter";
    const entries = [
      getDarkvisionEntry(),
      getDragonbornResistanceEntry(),
      getTieflingResistanceEntry(),
      getDwarfResistanceEntry(),
      getSorcererElementalAffinityEntry()
    ].filter(Boolean);
    const racialDefenses = {
      dwarf: [{ label: "矮人體魄", detail: "對中毒狀態的豁免具有優勢。" }],
      elf: [{ label: "精類血統", detail: "對魅惑狀態的豁免具有優勢。" }],
      gnome: [{ label: "侏儒狡黠", detail: "智力、感知、魅力豁免時具有優勢。" }],
      halfling: [
        { label: "勇氣", detail: "避免或終止恐慌狀態的豁免具有優勢。" },
        { label: "吉運", detail: "D20 檢定中擲出 1 時，可以重擲一次。" }
      ],
      goliath: [{ label: "身強力壯", detail: "掙脫擒抱狀態的屬性檢定具有優勢。" }],
      orc: [{ label: "堅韌不屈", detail: "若 HP 被傷害至 0 且沒有即死，可強制 HP=1。" }]
    };
    const barbarianDefenses = [];
    const fighterSummaries = [];
    if (isBarbarian && characterLevel >= 2) {
      barbarianDefenses.push({ label: "險境感知", detail: "只要你沒失能，你的敏捷豁免有優勢。" });
    }
    if (isBarbarian && characterLevel >= 3) {
      barbarianDefenses.push({ label: "先祖學識", detail: "狂暴時你可用力量做以下技能檢定：體操,威嚇,察覺,隱匿,求生。" });
    }
    if (isBarbarian && characterLevel >= 5) {
      barbarianDefenses.push({ label: "快速移動", detail: "若你若你未穿重甲，速度 +10 呎。", summaryPanel: "overview" });
    }
    if (isBarbarian && characterLevel >= 6) {
      barbarianDefenses.push({ label: "無我狂暴", detail: "狂暴期間，你免疫魅惑與恐慌狀態。", summaryPanel: "overview" });
    }
    if (isBarbarian && characterLevel >= 7) {
      barbarianDefenses.push({ label: "野性本能", detail: "你的先攻擲骰具有優勢。", summaryPanel: "overview" });
    }
    if (isFighter && characterLevel >= 3) {
      fighterSummaries.push({
        label: "運動健將",
        detail: "先攻與力量（運動）檢定具有優勢；造成重擊後，可立即移動至多等同於速度一半的距離，且不會引發藉機攻擊。",
        summaryPanel: "overview"
      });
    }
    return entries.concat(racialDefenses[race] || [], barbarianDefenses, fighterSummaries);
  }

  function isDamageRelatedEntry(entry) {
    return /(?:傷害|抗性)/u.test(`${entry?.label || ""} ${entry?.detail || ""}`);
  }

  function getDefenseEntries() {
    const entries = getCharacterDefenseEntries().filter(entry => (
      !isDamageRelatedEntry(entry) && entry.summaryPanel !== "overview"
    ));
    const tacticalMind = getFighterTacticalMindEntry();
    if (tacticalMind) entries.push(tacticalMind);
    const selectedClass = document.getElementById("class")?.value || "";
    const characterLevel = Number.parseInt(document.getElementById("level")?.value || "", 10) || 0;
    if (selectedClass === "monk" && characterLevel >= 7) {
      entries.push({
        label: "反射閃避",
        detail: "敏捷豁免原可使傷害減半時：成功則不受傷害，失敗則傷害減半；失能時無效。"
      });
    }
    const rogueReliableTalent = getRogueReliableTalentEntry();
    if (rogueReliableTalent) entries.push(rogueReliableTalent);
    if (selectedClass === "paladin" && characterLevel >= 6) {
      entries.push({ label: "守護靈氣", detail: "額外豁免加值已自動計算。" });
    }
    if (hasSelectedFeat("臨陣施法")) {
      entries.push({ label: "穩住專注", detail: "維持專注的體質豁免丟二取高。" });
    }
    return entries;
  }

  function getOverviewRuleEntries() {
    const entries = getCharacterDefenseEntries().filter(entry => (
      isDamageRelatedEntry(entry) || entry.summaryPanel === "overview"
    ));
    const tacticalMind = getFighterTacticalMindEntry();
    if (tacticalMind) entries.unshift(tacticalMind);
    if (hasSelectedFeat("警覺")) {
      entries.push({ label: "警覺", detail: "擲先攻後，可與指定隊友互換順序，失能無效。" });
    }
    if (hasSelectedFeat("重甲減傷") && isWearingHeavyArmor()) {
      const proficiencyBonus = getCharacterProficiencyBonus();
      const reduction = proficiencyBonus === null ? "「熟練加值」" : `${proficiencyBonus} 點`;
      entries.push({ label: "裝甲吸收", detail: `穿重甲被攻擊命中時，可減少揮砍、穿刺、鈍擊 ${reduction}傷害。` });
    }
    if (hasSelectedFeat("迅捷步法")) {
      entries.push({ label: "閃避反擊", detail: "針對你的藉機攻擊丟二取低。" });
    }
    if (hasSelectedFeat("醫療兵")) {
      entries.push({ label: "醫療兵", detail: "法術或照護的恢復骰出 1 可重丟一次。" });
    }
    const warlockDarkOnesBlessing = getWarlockDarkOnesBlessingOverviewEntry();
    if (warlockDarkOnesBlessing) entries.push(warlockDarkOnesBlessing);
    const rogueUncannyDodge = getRogueUncannyDodgeOverviewEntry();
    if (rogueUncannyDodge) entries.push(rogueUncannyDodge);
    const monkSlowFall = getMonkSlowFallOverviewEntry();
    if (monkSlowFall) entries.push(monkSlowFall);
    const paladinAura = getPaladinAuraOverviewEntry();
    if (paladinAura) entries.push(paladinAura);
    return entries;
  }

  function getSpellRuleEntries() {
    const entries = [];
    const sorcererElementalAffinity = getSorcererElementalAffinitySpellEntry();
    if (sorcererElementalAffinity) entries.push(sorcererElementalAffinity);
    if (hasSelectedFeat("臨陣施法")) {
      entries.push({ label: "穩住專注", detail: "維持專注的體質豁免丟二取高。" });
    }
    if (hasSelectedFeat("醫療兵")) {
      entries.push({ label: "醫療兵", detail: "法術或照護的恢復骰出 1 可重丟一次。" });
    }
    return entries;
  }

  function createDefenseSummaryItem(entry) {
    const item = document.createElement("p");
    item.className = "tabletop-defense-summary__item";
    const heading = entry.value ? `${entry.label}：${entry.value}` : entry.label;

    const title = document.createElement("strong");
    title.textContent = entry.detail ? `${heading}：` : heading;
    item.appendChild(title);

    if (entry.detail) {
      item.appendChild(document.createTextNode(entry.detail));
    }

    return item;
  }

  function renderDefenseSummary() {
    if (!elements.defenseSummary || !elements.defenseSection) return;
    const entries = getDefenseEntries();
    elements.defenseSection.hidden = entries.length === 0;
    elements.defenseSummary.replaceChildren(...entries.map(createDefenseSummaryItem));
  }

  function renderRuleSummary(section, output, entries) {
    if (!section || !output) return;
    section.hidden = entries.length === 0;
    output.replaceChildren(...entries.map(createDefenseSummaryItem));
  }

  function renderRuleSummaries() {
    renderRuleSummary(elements.overviewRuleSection, elements.overviewRuleSummary, getOverviewRuleEntries());
    renderRuleSummary(elements.spellRuleSection, elements.spellRuleSummary, getSpellRuleEntries());
  }

  function renderAbilityModifiers() {
    if (!elements.abilityModifiers) return;

    const values = ABILITY_KEYS.map(ability => {
      const label = getAbilityLabel(ability);
      return createReadOnlyValue(
        label,
        getReadOnlySourceValue(document.getElementById(`${ability}-mod`)),
        "tabletop-ability-modifier",
        "",
        `${label}檢定`
      );
    });

    elements.abilityModifiers.replaceChildren(...values);
  }

  function renderSkills() {
    if (elements.savingThrows) {
      const saves = ABILITY_KEYS.map(ability => {
        const label = getAbilityLabel(ability);
        return createReadOnlyValue(
          label,
          getReadOnlySourceValue(document.getElementById(`save-${ability}`)),
          "tabletop-saving-throw",
          "",
          `${label}豁免`
        );
      });
      elements.savingThrows.replaceChildren(...saves);
    }

    renderDefenseSummary();

    if (!elements.skillValues) return;

    const skills = Array.from(
      document.querySelectorAll("#tab-skills .skill-grid .skill-cell")
    ).flatMap(cell => {
      const input = cell.querySelector('input[id^="skill-"]');
      if (!input) return [];

      const label =
        cell.querySelector(".skill-tip")?.textContent?.trim()
        || input.id.replace("skill-", "");

      return [
        createReadOnlyValue(
          label,
          getReadOnlySourceValue(input),
          "tabletop-skill-value",
          "listitem",
          `${label}技能檢定`
        )
      ];
    });

    elements.skillValues.replaceChildren(...skills);
  }

  function renderSummary() {
    if (elements.characterName) {
      const name = combatState.characterName || "點我修改角色名稱";
      elements.characterName.textContent = name;
      elements.characterName.classList.toggle(
        "is-placeholder",
        !combatState.characterName
      );
      elements.characterName.setAttribute(
        "aria-label",
        combatState.characterName
          ? `${name}；點擊修改角色名稱`
          : "點我修改角色名稱"
      );
    }

    if (!elements.characterSummary) {
      return;
    }

    const classLabel =
      getSelectedLabel(
        "class",
        "尚未選擇職業"
      );

    const levelValue =
      document
        .getElementById("level")
        ?.value
      || "—";

    const raceLabel =
      getSelectedLabel(
        "race",
        "尚未選擇種族"
      );

    elements.characterSummary.textContent =
      `${classLabel} · 等級 ${levelValue} · ${raceLabel}`;
  }

  function renderKeyStats() {
    if (!elements.ac) {
      return;
    }

    elements.ac.textContent =
      getDisplayValue("ac-display");

    const initiative = getDisplayValue("initiative-input");
    const initiativeModifier = parseRollModifier(initiative);
    elements.initiative.replaceChildren(createQuickRollButton(
      initiative,
      "先攻",
      initiativeModifier === null ? null : {
        count: 1,
        sides: 20,
        modifier: initiativeModifier,
        includeModifier: true
      }
    ));

    elements.speed.textContent =
      getDisplayValue(
        "speed-display",
        " 呎"
      );

    elements.passivePerception.textContent =
      getDisplayValue(
        "passive-perception"
      );

    renderAbilityModifiers();
    renderSkills();
    renderRuleSummaries();
  }

  function renderHealth() {
    if (!elements.currentHp) {
      return;
    }

    const currentHp =
      readCurrentHp();

    const maximumHp =
      readMaximumHp();

    elements.currentHp.textContent =
      currentHp === null
        ? "—"
        : String(currentHp);

    elements.maximumHp.textContent =
      maximumHp === null
        ? "—"
        : String(maximumHp);

    elements.temporaryHp.textContent =
      String(
        combatState.temporaryHp
      );

    elements.undo.disabled =
      !undoSnapshot;

    elements.undo.setAttribute(
      "aria-disabled",
      String(!undoSnapshot)
    );
  }

  function renderConditions() {
    if (!elements.activeConditions) {
      return;
    }

    const conditionMap =
      new Map(
        getConditionData().map(
          (condition) => [
            condition.key,
            condition
          ]
        )
      );

    const tags =
      combatState.activeConditions
        .map(
          (key) =>
            conditionMap.get(key)
        )
        .filter(Boolean)
        .map(
          (condition) => ({
            key: condition.key,
            label: condition.zh
          })
        );

    if (
      combatState.exhaustionLevel > 0
    ) {
      const exhaustion =
        getExhaustionEffects(
          combatState.exhaustionLevel
        );

      tags.push({
        key: "exhaustion",
        label:
          `力竭 ${exhaustion.level} 級`
          + `｜D20 −${exhaustion.d20Penalty}`
          + `｜速度 −${exhaustion.speedPenaltyFeet} 呎`
      });
    }

    if (!tags.length) {
      const empty =
        document.createElement("p");

      empty.className =
        "tabletop-condition-empty";

      empty.textContent =
        "目前沒有標記狀態。";

      elements.activeConditions
        .replaceChildren(empty);

      return;
    }

    const buttons =
      tags.map(
        ({
          key,
          label
        }) => {
          const button =
            document.createElement(
              "button"
            );

          button.type = "button";

          button.className =
            "tabletop-condition-tag";

          button.dataset.conditionKey =
            key;

          button.setAttribute(
            "aria-label",
            `查看${label}說明`
          );

          button.textContent = label;

          return button;
        }
      );

    elements.activeConditions
      .replaceChildren(...buttons);
  }

  function renderDeathSaves() {
    if (!elements.deathSaves) {
      return;
    }

    const currentHp =
      readCurrentHp();

    const sacrificed =
      combatState.heroicSacrifice;

    const visible =
      currentHp === 0
      || sacrificed;

    elements.deathSaves.hidden =
      !visible;

    if (!visible) {
      return;
    }

    if (elements.deathEyebrow) {
      elements.deathEyebrow.textContent =
        sacrificed
          ? "生命狀態"
          : "目前 HP 為 0 · 昏迷";
    }

    if (elements.deathTitle) {
      const title = sacrificed
        ? HEROIC_SACRIFICE_LABEL
        : (
            combatState.deathSaveStable
              ? "已穩定，昏迷 1D4 小時。"
              : "死亡豁免"
          );
      const canRoll = !sacrificed && !combatState.deathSaveStable;
      const button = createQuickRollButton(
        title,
        "死亡豁免",
        canRoll ? { count: 1, sides: 20 } : null,
        "tabletop-inline-roll tabletop-death-roll",
        result => recordDeathSaveRoll(result.values[0])
      );
      elements.deathTitle.replaceChildren(button);
    }

    if (elements.deathHelp) {
     if (sacrificed) {
     elements.deathHelp.innerHTML =
      `<em>If he dies, he dies.</em>`;
     } else if (
    combatState.deathSaveStable
     ) {
    elements.deathHelp.textContent =
      "目前為穩定且昏迷；受到傷害會解除穩定並增加 1 次死亡豁免失敗。";
     } else {
    elements.deathHelp.textContent =
      "目前為昏迷；死亡豁免 10+ 成功，1＝2 次失敗，20＝恢復 1 HP。";
     }
    }

    elements.deathSaves
      .querySelectorAll(
        "[data-death-save-kind]"
      )
      .forEach((button) => {
        const kind =
          button.dataset
            .deathSaveKind;

        const slot =
          Number(
            button.dataset
              .deathSaveSlot
          );

        const count =
          kind === "success"
            ? combatState
                .deathSaveSuccesses
            : combatState
                .deathSaveFailures;

        const pressed =
          slot <= count;

        const kindLabel =
          kind === "success"
            ? "成功"
            : "失敗";

        button.disabled =
          sacrificed
          || combatState
            .deathSaveStable;

        button.setAttribute(
          "aria-disabled",
          String(button.disabled)
        );

        button.setAttribute(
          "aria-pressed",
          String(pressed)
        );

        button.setAttribute(
          "aria-label",
          `死亡豁免${kindLabel}第 ${slot} 格，${pressed ? "已記錄" : "未記錄"}`
        );
      });

    elements.stable.disabled =
      sacrificed;

    elements.stable.setAttribute(
      "aria-disabled",
      String(sacrificed)
    );

    elements.stable.setAttribute(
      "aria-pressed",
      String(
        combatState.deathSaveStable
      )
    );

    elements.stable.classList.toggle(
      "is-active",
      combatState.deathSaveStable
    );

    elements.deathReset.disabled =
      false;

    elements.deathReset.setAttribute(
      "aria-disabled",
      "false"
    );
  }

  function render() {
    if (!initialized) {
      return;
    }

    syncSpellPanelAvailability();
    renderSummary();
    renderKeyStats();
    renderHealth();
    renderConditions();
    renderDeathSaves();
  }

  function applyState(data) {
    combatState =
      normalizeCombatState(data);

    if (
      combatState.heroicSacrifice
    ) {
      setCurrentHp(0);
    } else if (
      (readCurrentHp() ?? 0) > 0
    ) {
      clearDeathSaves();
    } else if (readCurrentHp() === 0) {
      enterDeathSaveCondition();
    }

    undoSnapshot = null;

    render();
    emitStateChange();
  }

  function handleLifeOperation(
    event
  ) {
    event.preventDefault();

    const operation =
      event.submitter?.value === "heal"
        ? "heal"
        : "damage";

    const amount =
      parseOperationAmount(
        elements.lifeAmount
      );

    if (amount === null) {
      setFormError(
        elements.lifeAmount,
        elements.lifeError,
        "請輸入大於 0 的整數。"
      );

      return;
    }

    const currentHp =
      readCurrentHp();

    if (currentHp === null) {
      setFormError(
        elements.lifeAmount,
        elements.lifeError,
        "請先在角色卡填入目前 HP。"
      );

      Promise.resolve(
        window.onboardingTour?.jumpToTarget?.({
          tab: "basic",
          selector: ".basic-row--vitals",
          focusSelector: "#hp"
        })
      ).then((jumped) => {
        if (!jumped) return;

        const hpInput = document.getElementById("hp");
        if (hpInput && typeof showSkillPopup === "function") {
          showSkillPopup("目前HP", hpInput);
        }
      }).catch((error) => {
        console.warn("無法前往目前 HP 欄位：", error);
      });

      return;
    }

    setFormError(
      elements.lifeAmount,
      elements.lifeError
    );

    undoSnapshot =
      createLifeSnapshot();

    if (operation === "damage") {
      const maximumHp =
        readMaximumHp();

      const wasStable =
        combatState.deathSaveStable;

      const wasSacrificed =
        combatState.heroicSacrifice;

      const result =
        applyDamageState(
          currentHp,
          combatState.temporaryHp,
          amount
        );

      combatState.temporaryHp =
        result.temporaryHp;

      setCurrentHp(
        result.currentHp
      );

      elements.lifeAmount.value = "";

      if (wasSacrificed) {
        markStateChanged(
          appendConcentrationSaveReminder(
            `${HEROIC_SACRIFICE_LABEL}；本次傷害僅更新臨時 HP 記錄。`,
            amount
          )
        );

        return;
      }

      if (currentHp === 0) {
        if (
          maximumHp !== null
          && maximumHp > 0
          && amount >= maximumHp
        ) {
          markHeroicSacrifice({
            forceHpZero: true
          });

          markStateChanged(
            appendConcentrationSaveReminder(
              `HP 為 0 時受到 ${amount} 點傷害，達到最大 HP ${maximumHp}；${HEROIC_SACRIFICE_LABEL}。`,
              amount
            )
          );

          return;
        }

        const failureResult =
          addDeathSaveFailures(1);

        if (
          failureResult.heroicSacrifice
        ) {
          markStateChanged(
            appendConcentrationSaveReminder(
              `HP 為 0 時受到傷害，死亡豁免失敗 +1；累積 3 次失敗，${HEROIC_SACRIFICE_LABEL}。`,
              amount
            )
          );
        } else if (wasStable) {
          markStateChanged(
            appendConcentrationSaveReminder(
              `穩定狀態已解除；死亡豁免失敗 +1，目前 ${failureResult.total}/3。`,
              amount
            )
          );
        } else {
          markStateChanged(
            appendConcentrationSaveReminder(
              `HP 為 0 時受到傷害；死亡豁免失敗 +1，目前 ${failureResult.total}/3。`,
              amount
            )
          );
        }

        return;
      }

      if (result.currentHp === 0) {
        clearDeathSaves();
        enterDeathSaveCondition();

        if (
          maximumHp !== null
          && maximumHp > 0
          && result.overflowDamage
            >= maximumHp
        ) {
          markHeroicSacrifice({
            forceHpZero: true
          });

          markStateChanged(
            appendConcentrationSaveReminder(
              `受到 ${amount} 點傷害，降至 0 HP 後仍剩餘 ${result.overflowDamage} 點傷害，達到最大 HP ${maximumHp}；${HEROIC_SACRIFICE_LABEL}。`,
              amount
            )
          );

          return;
        }

        const maximumHpNote =
          maximumHp === null
          || maximumHp <= 0
            ? "；目前沒有有效最大 HP，因此無法判定大量傷害即死"
            : "";

        const temporaryHpNote = result.temporaryHpLost > 0
          ? `，臨時 HP 扣除 ${result.temporaryHpLost}`
          : "";

        markStateChanged(
          appendConcentrationSaveReminder(
            `受到 ${amount} 點傷害${temporaryHpNote}，目前 HP 降至 0；角色昏迷並開始死亡豁免${maximumHpNote}。`,
            amount
          )
        );

        return;
      }

      const temporaryHpNote = result.temporaryHpLost > 0
        ? `，臨時 HP 扣除 ${result.temporaryHpLost}`
        : "";

      markStateChanged(
        appendConcentrationSaveReminder(
          `受到 ${amount} 點傷害${temporaryHpNote}。`,
          amount
        )
      );

      return;
    }

    const maximumHp =
      readMaximumHp();

    if (
      maximumHp === null
      || maximumHp <= 0
    ) {
      undoSnapshot = null;

      setFormError(
        elements.lifeAmount,
        elements.lifeError,
        "請先設定有效的最大 HP。"
      );

      renderHealth();

      return;
    }

    const result =
      applyHealingState(
        currentHp,
        maximumHp,
        amount
      );

    setCurrentHp(
      result.currentHp
    );

    if (result.currentHp > 0) {
      clearCriticalLifeState();
      if (currentHp === 0) {
        reviveFromZeroHpCondition();
      }
    }

    elements.lifeAmount.value = "";

    markStateChanged(
      currentHp === 0 && result.currentHp > 0
        ? `獲得治療 ${result.restoredHp} 點；已解除昏迷並改為倒地。`
        : `獲得治療 ${result.restoredHp} 點。`
    );
  }

  function handleTemporaryHpSubmit(
    event
  ) {
    event.preventDefault();

    const amount =
      parseOperationAmount(
        elements.temporaryHpInput,
        {
          allowZero: true
        }
      );

    if (amount === null) {
      setFormError(
        elements.temporaryHpInput,
        elements.temporaryHpError,
        "請輸入 0 或正整數。"
      );

      return;
    }

    setFormError(
      elements.temporaryHpInput,
      elements.temporaryHpError
    );

    undoSnapshot =
      createLifeSnapshot();

    const previousTemporaryHp =
      combatState.temporaryHp;

    combatState.temporaryHp =
      amount;

    elements.temporaryHpInput.value =
      "";

    markStateChanged(
      `臨時 HP 已從 ${previousTemporaryHp} 設為 ${amount}。`
    );
  }

  function toggleTemporaryHpForm() {
    if (
      !elements.temporaryHpForm
      || !elements.temporaryHpToggle
    ) {
      return;
    }

    const open =
      elements.temporaryHpForm.hidden;

    elements.temporaryHpForm.hidden =
      !open;

    elements.temporaryHpToggle
      .setAttribute(
        "aria-expanded",
        String(open)
      );

    if (open) {
      elements.temporaryHpInput
        ?.focus();
    } else {
      setFormError(
        elements.temporaryHpInput,
        elements.temporaryHpError
      );
    }
  }

  function handleUndo() {
    if (!undoSnapshot) {
      return;
    }

    const snapshot =
      undoSnapshot;

    undoSnapshot = null;

    combatState.temporaryHp =
      snapshot.temporaryHp;

    combatState.deathSaveSuccesses =
      snapshot.deathSaveSuccesses;

    combatState.deathSaveFailures =
      snapshot.deathSaveFailures;

    combatState.deathSaveStable =
      snapshot.deathSaveStable;

    combatState.heroicSacrifice =
      snapshot.heroicSacrifice;

    combatState.activeConditions = [
      ...snapshot.activeConditions
    ];

    setCurrentHp(
      snapshot.currentHp
    );

    const currentHpLabel =
      snapshot.currentHp === null
        ? "未填"
        : snapshot.currentHp;

    markStateChanged(
      `已復原上一筆生命值操作：目前 HP ${currentHpLabel}，臨時 HP ${snapshot.temporaryHp}。`
    );
  }

  function handleHpSourceChange() {
    if (isUpdatingHp) {
      return;
    }

    undoSnapshot = null;

    const currentHp =
      readCurrentHp();

    const wasSacrificed =
      combatState.heroicSacrifice;

    const revived =
      currentHp !== null
      && currentHp > 0
        && (
          hasDeathSaveState()
          || combatState.activeConditions.includes("unconscious")
        );

    if (revived) {
      clearCriticalLifeState();
      reviveFromZeroHpCondition();
    } else if (currentHp === 0) {
      enterDeathSaveCondition();
    }

    render();

    if (revived) {
      scheduleCharacterSave();

      announce(
        wasSacrificed
          ? `目前 HP 已高於 0，「${HEROIC_SACRIFICE_LABEL}」與死亡豁免狀態已清除。`
          : "目前 HP 已高於 0，死亡豁免與穩定狀態已清除，已解除昏迷並改為倒地。"
      );
    }
  }

  function handleDeathSaveClick(
    event
  ) {
    const button =
      event.target.closest("button");

    if (!button) {
      return;
    }

    if (
      button === elements.deathReset
    ) {
      const hadSacrifice =
        clearHeroicSacrifice();

      clearDeathSaves();
      enterDeathSaveCondition();

      markStateChanged(
        hadSacrifice
          ? `死亡豁免、穩定與「${HEROIC_SACRIFICE_LABEL}」狀態已手動重置。`
          : "死亡豁免與穩定狀態已手動重置。"
      );

      return;
    }

    if (
      combatState.heroicSacrifice
    ) {
      return;
    }

    if (
      button === elements.stable
    ) {
      if (
        combatState.deathSaveStable
      ) {
        combatState.deathSaveStable =
          false;

        markStateChanged(
          "穩定狀態已取消，角色仍為 0 HP 並處於昏迷。"
        );
      } else {
        becomeStable();

        markStateChanged(
          "已標記為穩定；死亡豁免成功與失敗紀錄已歸零。"
        );
      }

      return;
    }

    const kind =
      button.dataset
        .deathSaveKind;

    const slot =
      Number(
        button.dataset
          .deathSaveSlot
      );

    if (
      !kind
      || !Number.isInteger(slot)
    ) {
      return;
    }

    combatState.deathSaveStable =
      false;

    const stateKey =
      kind === "success"
        ? "deathSaveSuccesses"
        : "deathSaveFailures";

    combatState[stateKey] =
      combatState[stateKey] >= slot
        ? slot - 1
        : slot;

    if (
      kind === "success"
      && combatState
        .deathSaveSuccesses >= 3
    ) {
      becomeStable();

      markStateChanged(
        "死亡豁免累積 3 次成功：角色已穩定，成功與失敗紀錄已歸零。"
      );

      return;
    }

    if (
      kind === "failure"
      && combatState
        .deathSaveFailures >= 3
    ) {
      markHeroicSacrifice({
        forceHpZero: true
      });

      markStateChanged(
        `死亡豁免累積 3 次失敗：${HEROIC_SACRIFICE_LABEL}。`
      );

      return;
    }

    const kindLabel =
      kind === "success"
        ? "成功"
        : "失敗";

    markStateChanged(
      `死亡豁免${kindLabel}已記錄 ${combatState[stateKey]} 格。`
    );
  }

  function recordDeathSaveRoll(roll) {
    const evaluation =
      evaluateDeathSaveRoll(roll);

    if (!evaluation.valid) {
      return Object.freeze({
        applied: false,
        reason: "invalid-roll",
        evaluation,
        state: collectState()
      });
    }

    const currentHp =
      readCurrentHp();

    if (currentHp !== 0) {
      return Object.freeze({
        applied: false,
        reason: "hp-not-zero",
        evaluation,
        state: collectState()
      });
    }

    if (
      combatState.heroicSacrifice
    ) {
      return Object.freeze({
        applied: false,
        reason: "heroic-sacrifice",
        evaluation,
        state: collectState()
      });
    }

    if (
      combatState.deathSaveStable
    ) {
      return Object.freeze({
        applied: false,
        reason: "stable",
        evaluation,
        state: collectState()
      });
    }

    undoSnapshot =
      createLifeSnapshot();

    if (
      evaluation.outcome
        === "revive"
    ) {
      const maximumHp =
        readMaximumHp();

      if (
        maximumHp !== null
        && maximumHp <= 0
      ) {
        undoSnapshot = null;

        return Object.freeze({
          applied: false,
          reason:
            "invalid-maximum-hp",
          evaluation,
          state: collectState()
        });
      }

      setCurrentHp(1);

      clearCriticalLifeState();
      reviveFromZeroHpCondition();

      markStateChanged(
        "死亡豁免擲出 20：恢復 1 HP，死亡豁免、穩定與英勇犧牲狀態已清除。"
      );

      return Object.freeze({
        applied: true,
        evaluation,
        state: collectState()
      });
    }

    if (
      evaluation.outcome
        === "success"
    ) {
      const result =
        addDeathSaveSuccesses(
          evaluation.successes
        );

      if (result.stable) {
        markStateChanged(
          "死亡豁免累積 3 次成功：角色已穩定，成功與失敗紀錄已歸零。"
        );
      } else {
        markStateChanged(
          `死亡豁免擲出 ${evaluation.roll}：成功，目前成功 ${combatState.deathSaveSuccesses}/3。`
        );
      }

      return Object.freeze({
        applied: true,
        evaluation,
        state: collectState()
      });
    }

    const result =
      addDeathSaveFailures(
        evaluation.failures
      );

    if (
      result.heroicSacrifice
    ) {
      const failureLabel =
        evaluation.roll === 1
          ? "擲出 1，計 2 次失敗"
          : `擲出 ${evaluation.roll}，失敗`;

      markStateChanged(
        `死亡豁免${failureLabel}；累積 3 次失敗，${HEROIC_SACRIFICE_LABEL}。`
      );
    } else {
      const failureLabel =
        evaluation.roll === 1
          ? "擲出 1：失敗 +2"
          : `擲出 ${evaluation.roll}：失敗 +1`;

      markStateChanged(
        `死亡豁免${failureLabel}，目前失敗 ${combatState.deathSaveFailures}/3。`
      );
    }

    return Object.freeze({
      applied: true,
      evaluation,
      state: collectState()
    });
  }

  function setModalBackgroundInert(
    inert
  ) {
    if (!inert) {
      conditionModalBackgroundStates
        ?.forEach(
          (
            wasInert,
            element
          ) => {
            if (element.isConnected) {
              element.inert =
                wasInert;
            }
          }
        );

      conditionModalBackgroundStates =
        null;

      return;
    }

    conditionModalBackgroundStates =
      new Map();

    document
      .querySelectorAll("body > *")
      .forEach((element) => {
        if (
          !(element instanceof HTMLElement)
          || element
            === elements.conditionModal
        ) {
          return;
        }

        conditionModalBackgroundStates
          .set(
            element,
            element.inert
          );

        element.inert = true;
      });
  }

  function renderConditionDescription(
    container,
    conditionKey,
    {
      useDraftExhaustion = false
    } = {}
  ) {
    if (!container) {
      return;
    }

    if (
      conditionKey === "exhaustion"
    ) {
      const inputLevel =
        useDraftExhaustion
          ? readIntegerInput(
              elements.exhaustionInput
            )
          : null;

      const exhaustion =
        getExhaustionEffects(
          inputLevel === null
            ? combatState
                .exhaustionLevel
            : inputLevel
        );

      const currentEffect =
        exhaustion.level > 0
          ? (
              `目前 ${exhaustion.level} 級：`
              + `D20 檢定 −${exhaustion.d20Penalty}，`
              + `速度 −${exhaustion.speedPenaltyFeet} 呎。`
            )
          : "目前 0 級：沒有力竭減值。";

      container.textContent =
          "力竭每級使 D20 檢定 −2、速度 −5 呎；"
          + `6 級時${HEROIC_SACRIFICE_LABEL}。`
          + "完成長休可降低 1 級。"
          + currentEffect;

      return;
    }

    if (
      typeof globalScope
        .renderDndConditionDescription
        === "function"
    ) {
      globalScope
        .renderDndConditionDescription(
          container,
          conditionKey
        );
    }
  }

  function renderModalDescription(
    conditionKey
  ) {
    renderConditionDescription(
      elements.conditionDescription,
      conditionKey,
      {
        useDraftExhaustion: true
      }
    );
  }

  function showConditionDescription(
    trigger,
    conditionKey
  ) {
    if (!globalScope.AppDialog) {
      return;
    }

    const condition =
      getConditionData().find(
        (item) =>
          item.key === conditionKey
      );

    const label =
      conditionKey === "exhaustion"
        ? "力竭"
        : condition?.zh || "狀態";

    const content =
      document.createElement("div");

    content.className =
      "tabletop-condition-detail";

    renderConditionDescription(
      content,
      conditionKey
    );

    void globalScope.AppDialog.showContent({
      title: `${label}說明`,
      content,
      actions: [
        {
          label: "狀態結束",
          intent: "danger",
          value: "end-condition"
        },
        {
          label: "關閉",
          intent: "primary",
          value: "close"
        }
      ],
      trigger
    }).then((result) => {
      if (result !== "end-condition") {
        return;
      }

      const ended =
        conditionKey === "exhaustion"
          ? combatState.exhaustionLevel > 0
          : removeActiveCondition(conditionKey);

      if (!ended) {
        return;
      }

      if (conditionKey === "exhaustion") {
        combatState.exhaustionLevel = 0;
        elements.exhaustionInput.value = "0";
      } else {
        const checkbox = elements.conditionOptions?.querySelector(
          `input[data-condition-option="${conditionKey}"]`
        );

        if (checkbox) {
          checkbox.checked = false;
        }
      }

      markStateChanged(`已結束「${label}」狀態。`);
    });
  }

  function populateConditionOptions() {
    if (!elements.conditionOptions) {
      return;
    }

    const rows =
      getConditionData()
        .filter(
          (condition) =>
            condition.key
              !== "exhaustion"
        )
        .map((condition) => {
          const row =
            document.createElement(
              "div"
            );

          row.className =
            "tabletop-condition-option";

          const label =
            document.createElement(
              "label"
            );

          const checkbox =
            document.createElement(
              "input"
            );

          checkbox.type =
            "checkbox";

          checkbox.value =
            condition.key;

          checkbox.dataset
            .conditionOption =
              condition.key;

          checkbox.dataset
            .stateTransient =
              "true";

          const labelText =
            document.createElement(
              "span"
            );

          labelText.textContent =
            condition.zh;

          label.append(
            checkbox,
            labelText
          );

          const infoButton =
            document.createElement(
              "button"
            );

          infoButton.type =
            "button";

          infoButton.className =
            "tabletop-condition-info";

          infoButton.dataset
            .conditionInfo =
              condition.key;

          infoButton.setAttribute(
            "aria-label",
            `查看${condition.zh}說明`
          );

          infoButton.textContent =
            "說明";

          row.append(
            label,
            infoButton
          );

          return row;
        });

    elements.conditionOptions
      .replaceChildren(...rows);
  }

  function openConditionModal(
    trigger,
    conditionKey = ""
  ) {
    if (!elements.conditionModal) {
      return;
    }

    conditionModalTrigger =
      trigger instanceof HTMLElement
        ? trigger
        : document.activeElement;

    elements.conditionOptions
      .querySelectorAll(
        "input[data-condition-option]"
      )
      .forEach((checkbox) => {
        checkbox.checked =
          combatState
            .activeConditions
            .includes(
              checkbox.value
            );
      });

    elements.exhaustionInput.value =
      String(
        combatState.exhaustionLevel
      );

    elements.conditionError
      .textContent = "";

    elements.exhaustionInput
      .setAttribute(
        "aria-invalid",
        "false"
      );

    const defaultKey =
      conditionKey
      || combatState
        .activeConditions[0]
      || (
        combatState
          .exhaustionLevel > 0
          ? "exhaustion"
          : ""
      )
      || getConditionData()[0]
        ?.key;

    renderModalDescription(
      defaultKey
    );

    elements.conditionModal.hidden =
      false;

    elements.conditionModal.inert =
      false;

    elements.conditionModal
      .setAttribute(
        "aria-hidden",
        "false"
      );

    setModalBackgroundInert(true);

    document.documentElement
      .classList.add(
        "tabletop-condition-modal-open"
      );

    const initialFocus =
      conditionKey === "exhaustion"
        ? elements.exhaustionInput
        : (
            elements.conditionOptions
              .querySelector(
                `input[data-condition-option="${conditionKey}"]`
              )
            || elements
              .conditionOptions
              .querySelector(
                "input[data-condition-option]"
              )
            || elements
              .conditionClose
          );

    initialFocus.focus();
  }

  function closeConditionModal({
    restoreFocus = true
  } = {}) {
    if (
      !elements.conditionModal
      || elements.conditionModal.hidden
    ) {
      return;
    }

    elements.conditionModal.inert =
      true;

    elements.conditionModal.hidden =
      true;

    elements.conditionModal
      .setAttribute(
        "aria-hidden",
        "true"
      );

    setModalBackgroundInert(false);

    document.documentElement
      .classList.remove(
        "tabletop-condition-modal-open"
      );

    if (
      restoreFocus
      && conditionModalTrigger
        instanceof HTMLElement
      && conditionModalTrigger
        .isConnected
      && !conditionModalTrigger
        .closest("[inert]")
    ) {
      conditionModalTrigger.focus();
    }

    conditionModalTrigger = null;
  }

  function handleConditionModalSubmit(
    event
  ) {
    event.preventDefault();

    const exhaustionLevel =
      parseOperationAmount(
        elements.exhaustionInput,
        {
          allowZero: true
        }
      );

    if (
      exhaustionLevel === null
      || exhaustionLevel > 6
    ) {
      elements.exhaustionInput
        .setAttribute(
          "aria-invalid",
          "true"
        );

      elements.conditionError
        .textContent =
          "力竭等級請輸入 0～6 的整數。";

      elements.exhaustionInput
        .focus();

      return;
    }

    const previousExhaustionLevel =
      combatState.exhaustionLevel;

    combatState.activeConditions =
      Array.from(
        elements.conditionOptions
          .querySelectorAll(
            "input[data-condition-option]:checked"
          ),
        (checkbox) =>
          checkbox.value
      );

    combatState.exhaustionLevel =
      exhaustionLevel;

    const exhaustion =
      getExhaustionEffects(
        exhaustionLevel
      );

    const newlyReachedFatalExhaustion =
      previousExhaustionLevel < 6
      && exhaustion.heroicSacrifice;

    if (
      newlyReachedFatalExhaustion
    ) {
      undoSnapshot = null;

      markHeroicSacrifice({
        forceHpZero: true
      });
    }

    closeConditionModal();

    const total =
      combatState
        .activeConditions
        .length
      + (
        combatState
          .exhaustionLevel > 0
          ? 1
          : 0
      );

    if (
      newlyReachedFatalExhaustion
    ) {
      markStateChanged(
        `目前狀態已更新，共標記 ${total} 項。力竭 6 級：${HEROIC_SACRIFICE_LABEL}。`
      );

      return;
    }

    if (exhaustion.level > 0) {
      markStateChanged(
        `目前狀態已更新，共標記 ${total} 項。力竭 ${exhaustion.level} 級：D20 −${exhaustion.d20Penalty}，速度 −${exhaustion.speedPenaltyFeet} 呎。`
      );

      return;
    }

    markStateChanged(
      `目前狀態已更新，共標記 ${total} 項。`
    );
  }

  function handleConditionModalKeydown(
    event
  ) {
    if (
      elements.conditionModal.hidden
    ) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeConditionModal();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusable =
      Array.from(
        elements.conditionModal
          .querySelectorAll(
            "button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex='-1'])"
          )
      ).filter(
        (element) =>
          !element.hidden
      );

    if (!focusable.length) {
      return;
    }

    const first =
      focusable[0];

    const last =
      focusable[
        focusable.length - 1
      ];

    if (
      event.shiftKey
      && document.activeElement
        === first
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey
      && document.activeElement
        === last
    ) {
      event.preventDefault();
      first.focus();
    }
  }

  function setActivePanel(
    panel,
    {
      persist = true,
      restoreScroll = true,
      focusTab = false
    } = {}
  ) {
    const requestedPanel = TABLETOP_PANELS.includes(panel) ? panel : "overview";
    const nextPanel = isTabletopPanelAvailable(requestedPanel) ? requestedPanel : "overview";

    if (restoreScroll && initialized && currentMode === "tabletop") {
      panelScrollPositions[currentPanel] = window.scrollY;
    }

    currentPanel = nextPanel;

    elements.tabletopTabs?.forEach(tab => {
      const selected = tab.dataset.tabletopTab === nextPanel;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      tab.classList.toggle("is-active", selected);
      if (selected && focusTab) tab.focus({ preventScroll: true });
    });

    elements.tabletopPanels?.forEach(panelElement => {
      panelElement.hidden = panelElement.dataset.tabletopPanel !== nextPanel;
    });

    if (persist) {
      globalScope.dndStorage?.setItem(PANEL_PREFERENCE_KEY, nextPanel);
    }

    globalScope.dispatchEvent?.(new CustomEvent("tabletop-panelchange", {
      detail: { panel: nextPanel }
    }));

    if (restoreScroll && currentMode === "tabletop") {
      window.requestAnimationFrame(() => {
        const maximumScroll = Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight
        );
        window.scrollTo(0, Math.min(panelScrollPositions[nextPanel] || 0, maximumScroll));
      });
    }
  }

  function handlePanelTabKeydown(event) {
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const tabs = (elements.tabletopTabs || []).filter(tab => !tab.hidden);
    const currentIndex = tabs.indexOf(event.currentTarget);
    let nextIndex = currentIndex;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % tabs.length;
    }
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    const nextTab = tabs[nextIndex];
    if (nextTab) setActivePanel(nextTab.dataset.tabletopTab, { focusTab: true });
  }

  function isTabletopPanelAvailable(panel) {
    if (panel !== "spells") return true;
    const canCast = typeof globalScope.hasSpellcastingCapability === "function"
      ? globalScope.hasSpellcastingCapability()
      : true;
    return canCast
      || Boolean(getConcentrationSpellId())
      || combatState.endedConcentrations.length > 0;
  }

  function syncSpellPanelAvailability() {
    if (!initialized) return;
    const spellTab = elements.tabletopTabs?.find(tab => tab.dataset.tabletopTab === "spells");
    const spellPanel = elements.tabletopPanels?.find(panel => panel.dataset.tabletopPanel === "spells");
    const available = isTabletopPanelAvailable("spells");

    if (spellTab) spellTab.hidden = !available;
    if (elements.tabletopPrimaryTabs) {
      elements.tabletopPrimaryTabs.dataset.visibleTabCount = available ? "5" : "4";
    }

    if (available) return;
    if (spellPanel) spellPanel.hidden = true;
    if (globalScope.dndStorage?.getItem(PANEL_PREFERENCE_KEY) === "spells") {
      globalScope.dndStorage.setItem(PANEL_PREFERENCE_KEY, "overview");
    }
    if (currentPanel === "spells") {
      setActivePanel("overview", {
        persist: true,
        restoreScroll: false,
        focusTab: currentMode === "tabletop"
      });
    }
  }

  function applyModeVisibility(
    mode,
    {
      restoreScroll = true
    } = {}
  ) {
    const nextMode =
      mode === "tabletop"
        ? "tabletop"
        : "sheet";

    if (
      restoreScroll
      && initialized
    ) {
      modeScrollPositions[
        currentMode
      ] = window.scrollY;
    }

    currentMode = nextMode;

    document.documentElement
      .dataset.viewMode =
        nextMode;

    if (elements.modeToggle) {
      const tabletopEnabled = nextMode === "tabletop";
      elements.modeToggle.setAttribute("aria-pressed", String(tabletopEnabled));
      elements.modeToggle.setAttribute("aria-label", tabletopEnabled ? "返回角色卡" : "進入桌邊模式（β）");
      const modeLabel = elements.modeToggle.querySelector("#tabletop-mode-toggle-label");
      const modeIcon = elements.modeToggle.querySelector("#tabletop-mode-toggle-icon");
      if (modeLabel) modeLabel.textContent = tabletopEnabled ? "角色卡模式" : "桌邊模式(β版)";
      if (modeIcon) modeIcon.textContent = tabletopEnabled ? "📄" : "⚔️";
    }

    if (elements.sheetTabs) {
      elements.sheetTabs.hidden =
        nextMode === "tabletop";
    }

    if (elements.tabletopMode) {
      elements.tabletopMode.hidden =
        nextMode !== "tabletop";
    }

    moveSharedNotesToCurrentMode(nextMode);

    document
      .querySelectorAll(
        ".tab-content"
      )
      .forEach((panel) => {
        panel.hidden =
          nextMode === "tabletop"
          || !panel.classList
            .contains("active");
      });

    const activeSheetTab =
      document
        .querySelector(
          ".tab-content.active"
        )
        ?.id
        ?.replace(
          "tab-",
          ""
        )
      || "basic";

    globalScope.dispatchEvent?.(
      new CustomEvent(
        "modechange",
        {
          detail: {
            mode: nextMode
          }
        }
      )
    );

    globalScope.dispatchEvent?.(
      new CustomEvent(
        "tabchange",
        {
          detail: {
            tab:
              nextMode
                === "tabletop"
                ? "tabletop"
                : activeSheetTab
          }
        }
      )
    );

    if (restoreScroll) {
      window
        .requestAnimationFrame(
          () => {
            const maximumScroll =
              Math.max(
                0,
                document
                  .documentElement
                  .scrollHeight
                - window.innerHeight
              );

            window.scrollTo(
              0,
              Math.min(
                modeScrollPositions[
                  nextMode
                ] || 0,
                maximumScroll
              )
            );
          }
        );
    }

    render();
  }

  function moveSharedNotesToCurrentMode(mode) {
    [
      [elements.gearNotes, elements.gearNotesSheetMount, elements.gearNotesTabletopMount],
      [elements.classExtra, elements.classExtraSheetMount, elements.classExtraTabletopMount],
      [elements.skillExtra, elements.skillExtraSheetMount, elements.skillExtraTabletopMount],
      [elements.spellNotes, elements.spellNotesSheetMount, elements.spellNotesTabletopMount]
    ].forEach(([field, sheetMount, tabletopMount]) => {
      const target = mode === "tabletop" ? tabletopMount : sheetMount;
      if (!field || !target || field.parentElement === target) return;
      target.append(field);
    });
  }

  function cacheElements() {
    Object.assign(
      elements,
      {
        modeToggle:
          document.getElementById(
            "tabletop-mode-toggle"
          ),

        sheetTabs:
          document.querySelector(
            "#sheet-tabs-row .tabs"
          ),

        tabletopMode:
          document.getElementById(
            "tabletop-mode"
          ),

        gearNotes:
          document.getElementById(
            "gear-notes"
          ),

        gearNotesSheetMount:
          document.getElementById(
            "gear-notes-sheet-mount"
          ),

        gearNotesTabletopMount:
          document.getElementById(
            "tabletop-gear-notes-mount"
          ),

        classExtra:
          document.getElementById(
            "class-extra"
          ),

        classExtraSheetMount:
          document.getElementById(
            "class-extra-sheet-mount"
          ),

        classExtraTabletopMount:
          document.getElementById(
            "tabletop-class-extra-mount"
          ),

        skillExtra:
          document.getElementById(
            "skill-extra"
          ),

        skillExtraSheetMount:
          document.getElementById(
            "skill-extra-sheet-mount"
          ),

        skillExtraTabletopMount:
          document.getElementById(
            "tabletop-skill-extra-mount"
          ),

        spellNotes:
          document.getElementById(
            "spell-notes"
          ),

        spellNotesSheetMount:
          document.getElementById(
            "spell-notes-sheet-mount"
          ),

        spellNotesTabletopMount:
          document.getElementById(
            "tabletop-spell-notes-mount"
          ),

        tabletopTabs:
          Array.from(document.querySelectorAll("[data-tabletop-tab]")),

        tabletopPrimaryTabs:
          document.querySelector(".tabletop-primary-tabs"),

        tabletopPanels:
          Array.from(document.querySelectorAll("[data-tabletop-panel]")),

        characterSummary:
          document.getElementById(
            "tabletop-character-summary"
          ),

        characterName:
          document.getElementById(
            "tabletop-title"
          ),

        ac:
          document.getElementById(
            "tabletop-ac"
          ),

        initiative:
          document.getElementById(
            "tabletop-initiative"
          ),

        speed:
          document.getElementById(
            "tabletop-speed"
          ),

        passivePerception:
          document.getElementById(
            "tabletop-passive-perception"
          ),

        overviewRuleSection:
          document.getElementById(
            "tabletop-overview-rule-summary-section"
          ),

        overviewRuleSummary:
          document.getElementById(
            "tabletop-overview-rule-summary"
          ),

        abilityModifiers:
          document.getElementById(
            "tabletop-ability-modifiers"
          ),

        savingThrows:
          document.getElementById(
            "tabletop-saving-throw-values"
          ),

        defenseSection:
          document.getElementById(
            "tabletop-defense-summary-section"
          ),

        defenseSummary:
          document.getElementById(
            "tabletop-defense-summary"
          ),

        spellRuleSection:
          document.getElementById(
            "tabletop-spell-rule-summary-section"
          ),

        spellRuleSummary:
          document.getElementById(
            "tabletop-spell-rule-summary"
          ),

        skillValues:
          document.getElementById(
            "tabletop-skill-values"
          ),

        currentHp:
          document.getElementById(
            "tabletop-current-hp"
          ),

        maximumHp:
          document.getElementById(
            "tabletop-maximum-hp"
          ),

        temporaryHp:
          document.getElementById(
            "tabletop-temporary-hp"
          ),

        currentHpSource:
          document.getElementById(
            "hp"
          ),

        maximumHpSource:
          document.getElementById(
            "hp-display"
          ),

        lifeForm:
          document.getElementById(
            "tabletop-life-form"
          ),

        lifeAmount:
          document.getElementById(
            "tabletop-life-amount"
          ),

        lifeError:
          document.getElementById(
            "tabletop-life-error"
          ),

        temporaryHpForm:
          document.getElementById(
            "tabletop-temporary-hp-form"
          ),

        temporaryHpToggle:
          document.getElementById(
            "tabletop-temporary-hp-toggle"
          ),

        temporaryHpInput:
          document.getElementById(
            "tabletop-temporary-hp-input"
          ),

        temporaryHpError:
          document.getElementById(
            "tabletop-temporary-hp-error"
          ),

        undo:
          document.getElementById(
            "tabletop-undo"
          ),

        liveStatus:
          document.getElementById(
            "tabletop-live-status"
          ),

        activeConditions:
          document.getElementById(
            "tabletop-active-conditions"
          ),

        conditionManage:
          document.getElementById(
            "tabletop-condition-manage"
          ),

        deathSaves:
          document.getElementById(
            "tabletop-death-saves"
          ),

        deathEyebrow:
          document.querySelector(
            "#tabletop-death-saves .tabletop-danger-eyebrow"
          ),

        deathTitle:
          document.getElementById(
            "tabletop-death-title"
          ),

        deathHelp:
          document.querySelector(
            "#tabletop-death-saves .tabletop-field-help"
          ),

        stable:
          document.getElementById(
            "tabletop-death-stable"
          ),

        deathReset:
          document.getElementById(
            "tabletop-death-reset"
          ),

        conditionModal:
          document.getElementById(
            "tabletop-condition-modal"
          ),

        conditionForm:
          document.getElementById(
            "tabletop-condition-form"
          ),

        conditionClose:
          document.getElementById(
            "tabletop-condition-close"
          ),

        conditionCancel:
          document.getElementById(
            "tabletop-condition-cancel"
          ),

        conditionOptions:
          document.getElementById(
            "tabletop-condition-options"
          ),

        exhaustionInput:
          document.getElementById(
            "tabletop-exhaustion-level"
          ),

        conditionDescription:
          document.getElementById(
            "tabletop-condition-description"
          ),

        conditionError:
          document.getElementById(
            "tabletop-condition-error"
          )
      }
    );
  }

  function bindEvents() {
    elements.tabletopTabs
      ?.forEach(tab => {
        tab.addEventListener("click", () => {
          setActivePanel(tab.dataset.tabletopTab);
        });
        tab.addEventListener("keydown", handlePanelTabKeydown);
      });

    elements.modeToggle
      ?.addEventListener(
        "click",
        () => {
          applyModeVisibility(
            currentMode === "tabletop"
              ? "sheet"
              : "tabletop"
          );
        }
      );

    elements.characterName
      ?.addEventListener(
        "click",
        (event) => {
          requestCharacterName(event.currentTarget);
        }
      );

    elements.characterName
      ?.addEventListener(
        "keydown",
        (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          requestCharacterName(event.currentTarget);
        }
      );

    elements.lifeForm
      ?.addEventListener(
        "submit",
        handleLifeOperation
      );

    elements.temporaryHpForm
      ?.addEventListener(
        "submit",
        handleTemporaryHpSubmit
      );

    elements.temporaryHpToggle
      ?.addEventListener(
        "click",
        toggleTemporaryHpForm
      );

    elements.undo
      ?.addEventListener(
        "click",
        handleUndo
      );

    elements.currentHpSource
      ?.addEventListener(
        "input",
        handleHpSourceChange
      );

    elements.currentHpSource
      ?.addEventListener(
        "change",
        handleHpSourceChange
      );

    elements.deathSaves
      ?.addEventListener(
        "click",
        handleDeathSaveClick
      );

    elements.conditionManage
      ?.addEventListener(
        "click",
        (event) =>
          openConditionModal(
            event.currentTarget
          )
      );

    elements.activeConditions
      ?.addEventListener(
        "click",
        (event) => {
          const button =
            event.target.closest(
              "button[data-condition-key]"
            );

          if (button) {
            showConditionDescription(
              button,
              button.dataset
                .conditionKey
            );
          }
        }
      );

    elements.conditionClose
      ?.addEventListener(
        "click",
        () =>
          closeConditionModal()
      );

    elements.conditionCancel
      ?.addEventListener(
        "click",
        () =>
          closeConditionModal()
      );

    elements.conditionForm
      ?.addEventListener(
        "submit",
        handleConditionModalSubmit
      );

    elements.conditionOptions
      ?.addEventListener(
        "click",
        (event) => {
          const button =
            event.target.closest(
              "button[data-condition-info]"
            );

          if (button) {
            renderModalDescription(
              button.dataset
                .conditionInfo
            );
          }
        }
      );

    elements.conditionModal
      ?.addEventListener(
        "click",
        (event) => {
          if (
            event.target
              === elements
                .conditionModal
          ) {
            closeConditionModal();
          }
        }
      );

    elements.conditionModal
      ?.addEventListener(
        "keydown",
        handleConditionModalKeydown
      );

    elements.exhaustionInput
      ?.addEventListener(
        "focus",
        () =>
          renderModalDescription(
            "exhaustion"
          )
      );

    elements.exhaustionInput
      ?.addEventListener(
        "input",
        () =>
          renderModalDescription(
            "exhaustion"
          )
      );

    document.addEventListener(
      "input",
      render
    );

    document.addEventListener(
      "change",
      render
    );

    globalScope.addEventListener(
      "dicerollmodechange",
      render
    );
  }

  function init() {
    if (initialized) {
      return;
    }

    cacheElements();

    if (!elements.tabletopMode) {
      return;
    }

    initialized = true;

    populateConditionOptions();
    bindEvents();

    syncSpellPanelAvailability();

    const savedPanel = globalScope.dndStorage?.getItem(PANEL_PREFERENCE_KEY);
    setActivePanel(savedPanel, {
      persist: false,
      restoreScroll: false
    });

    applyModeVisibility(
      "sheet",
      {
        restoreScroll: false
      }
    );

    render();
  }

  const api = {
    init,
    collectState,
    applyState,

    recordDeathSaveRoll,

    refresh: render,
    syncSpellPanelAvailability,
    setMode: applyModeVisibility,
    getMode: () => currentMode,
    setPanel: setActivePanel,
    getPanel: () => currentPanel,
    getTabletopActionPreferences,
    setTabletopActionNotes,
    addCustomTabletopAction,
    updateCustomTabletopAction,
    removeCustomTabletopAction,
    setTabletopActionHidden,
    restoreTabletopActionCategory,
    getCharacterName,
    setCharacterName,
    restoreHitPoints,
    getSpellCastOptions,
    commitSpellCastResource,
    getConcentrationSpellId,
    getEndedConcentrations,
    setConcentrationSpellId,
    stopConcentration,
    dismissEndedConcentration,
    getBuiltInResourceSpent,
    setBuiltInResourceSpent,
    getCustomResources,
    addCustomResource,
    updateCustomResource,
    setCustomResourceCurrent,
    removeCustomResource,

    logic: Object.freeze({
      applyDamageState,
      applyHealingState,
      calculateConcentrationSaveDc,
      appendConcentrationSaveReminder,
      evaluateDeathSaveRoll,
      getExhaustionEffects,
      buildSorcererElementalAffinityEntry,
      buildSpellCastOptions,
      validateSpellCastSelection,
      normalizeBuiltInResourceUsage,
      normalizeConcentrationSpellId,
      normalizeEndedConcentrations,
      normalizeTabletopActionPreferences,
      normalizeCustomResources
    })
  };

  globalScope.TabletopMode =
    Object.freeze(api);

  if (
    typeof document !== "undefined"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  }
})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
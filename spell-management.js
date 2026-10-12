(function attachSpellManagement(globalScope) {
  "use strict";
  const VERSION = 2;
  const MEMORY_KEY = "dnd.spellManagementMemories.v1";
  const NOTICE_KEY = "dnd.spellManagementClassNoticeDisabled.v1";
  const CLASS_IDS = new Set(["barbarian", "bard", "cleric", "druid", "fighter", "monk", "paladin", "ranger", "rogue", "sorcerer", "warlock", "wizard"]);
  let manual = false, players = [], sources = [], freeUses = {}, memories = null;
  let ownerClass = "", activeClass = "", activeLevel = "", activeBackground = "", activeRace = "";
  let switching = false, replaying = false, restoring = false, batchDepth = 0;
  let pendingData = null, migrationPending = false, migrationNotice = false, hooks = {};
  const clone = value => JSON.parse(JSON.stringify(value));
  const field = id => document.getElementById(id);
  const currentClass = () => field("class")?.value || "";
  const currentLevel = () => field("level")?.value || "";
  const inShareMode = () => globalScope.SHARE_MODE === true;
  const isRestoring = () => restoring || batchDepth > 0 || hooks.isRestoring?.() === true;
  const catalog = () => globalScope.SpellCatalog;
  const sourceKeyOf = entry => String(entry?.sourceKey || entry?.key || "");
  const safeKey = value => String(value).replace(/[^A-Za-z0-9_-]/g, char => `u${char.codePointAt(0).toString(16)}`);
  const freeUseId = (key, index) => `free-spell-use-${safeKey(key)}-${Number(index) + 1}`;
  const entryKey = entry => `${entry?.spellId || ""}\u0000${sourceKeyOf(entry)}\u0000${entry?.spellClass || ""}`;

  function normalizeEntry(value) {
    if (!value || typeof value !== "object") return null;
    let spellId = String(value.spellId ?? value.spellValue ?? "");
    if (!spellId) return null;
    spellId = catalog()?.getSpell(spellId) ? spellId : catalog()?.resolveSpellId?.(spellId) || spellId;
    const spell = catalog()?.getSpell(spellId);
    const rawLevel = value.ring === "cantrips" || value.level === "cantrips" ? 0 : Number(value.level ?? value.ring ?? spell?.level ?? 0);
    const retained = clone(value);
    delete retained.unavailable;
    return { ...retained, spellId, spellClass: String(value.spellClass ?? value.classValue ?? ""),
      level: spell?.level ?? (Number.isInteger(rawLevel) && rawLevel >= 0 ? rawLevel : 0),
      spellSource: String(value.spellSource ?? value.source ?? ""), sourceKey: sourceKeyOf(value),
      sourceLabel: String(value.sourceLabel ?? value.label ?? ""), spellUse: String(value.spellUse ?? value.castMode ?? "") };
  }
  const normalizeEntries = value => {
    const entries = Array.isArray(value) ? value : [];
    globalScope.validateCharacterState?.({ __spellManagement: { entries } });
    return entries.map(normalizeEntry).filter(Boolean);
  };

  function getLimits(options = {}) {
    const className = options.className ?? options.class ?? currentClass();
    const level = Number(options.level ?? currentLevel());
    const accessible = globalScope.CharacterRules?.classCanAccessSpellLevel || globalScope.classCanAccessSpellLevel;
    let maxLevel = 0;
    for (let ring = 1; ring <= 4; ring += 1) if (accessible?.(className, level, ring)) maxLevel = ring;
    const getPrepared = globalScope.CharacterRules?.getPreparedSpellLimit || globalScope.getPreparedSpellLimit;
    return { cantrips: globalScope.getClassCantripLimit?.(className, level) || 0,
      prepared: getPrepared?.(className, level) ?? 0, maxLevel };
  }
  const canManage = () => ["class", "level", "background", "race"].every(id => Boolean(field(id)?.value));
  function getAvailabilityReason(value, options = {}) {
    const entry = normalizeEntry(value);
    if (!entry) return "尚未選擇法術。";
    const state = options.state;
    const mode = state ? (state.__spellManagement ? state.__spellManagement.manual === true : state["manual-spell-management"] === true) : manual;
    const spell = catalog()?.getSpell(entry.spellId);
    if (!spell) return "找不到此法術的資料，已保留原法術編號。";
    if (mode || entry.spellSource) return "";
    const automatic = state?.__spellManagement?.entries || sources;
    if (automatic.some(item => item.spellSource && item.spellId === entry.spellId)) return "已由來源準備此法術；原玩家選擇仍保留。";
    const cls = state?.class ?? currentClass(), level = Number(state?.level ?? currentLevel());
    if (!catalog().getClassIds(entry.spellId).includes(cls)) return "目前職業法表不包含此法術。";
    const accessible = globalScope.CharacterRules?.classCanAccessSpellLevel || globalScope.classCanAccessSpellLevel;
    if (!level || !accessible?.(cls, level, spell.level)) return "目前等級尚未開放此法術環階。";
    return "";
  }
  const isEntryAvailable = (entry, options = {}) => Boolean(entry?.spellId) && !getAvailabilityReason(entry, options);
  function getEntries(options = {}) {
    const entries = manual ? players : [...sources, ...players];
    return clone(options.availableOnly ? entries.filter(entry => isEntryAvailable(entry, options)) : entries);
  }

  function readMemories() {
    if (memories) return memories;
    memories = { version: 1, classes: {}, manual: null };
    if (inShareMode()) return memories;
    try {
      const raw = globalScope.dndStorage?.getItem(MEMORY_KEY);
      const saved = raw ? globalScope.parseCharacterStateJson(raw) : null;
      if (saved?.version === 1) {
        Object.entries(saved.classes || {}).forEach(([cls, record]) => {
          if (CLASS_IDS.has(cls) && record && Array.isArray(record.entries)) memories.classes[cls] = {
            initialized: true, level: Number(record.level) || 0, entries: normalizeEntries(record.entries).filter(entry => !entry.spellSource) };
        });
        if (saved.manual && Array.isArray(saved.manual.entries)) memories.manual = {
          initialized: true, entries: normalizeEntries(saved.manual.entries), freeUses: clone(saved.manual.freeUses || {}) };
      }
    } catch (_error) { /* Retain the original data until a deliberate user change. */ }
    return memories;
  }
  function writeMemories(next) {
    if (inShareMode()) return true;
    const success = globalScope.dndStorage?.setItem(MEMORY_KEY, JSON.stringify(next)) === true;
    if (success) memories = next;
    return success;
  }
  function rememberCurrent() {
    if (inShareMode() || isRestoring() || !canManage()) return true;
    const next = clone(readMemories());
    if (manual) next.manual = { initialized: true, entries: clone(players), freeUses: currentFreeUses() };
    else if (CLASS_IDS.has(ownerClass)) next.classes[ownerClass] = {
      initialized: true, level: Number(currentLevel()) || next.classes[ownerClass]?.level || 0, entries: clone(players) };
    else return true;
    const persisted = writeMemories(next);
    if (persisted && migrationPending && manual) {
      migrationPending = false;
      if (globalScope.saveAllFields?.() === false) migrationPending = true;
      else showMigrationNotice();
    }
    return persisted;
  }

  function syncFreeUsesFromControls() {
    if (isRestoring()) return;
    (manual ? players : [...sources, ...players]).forEach(entry => {
      const key = sourceKeyOf(entry);
      if (!key) return;
      const prefix = `free-spell-use-${safeKey(key)}-`;
      document.querySelectorAll(".free-spell-use-check[id]").forEach(box => {
        if (!box.id.startsWith(prefix)) return;
        const index = Number(box.id.slice(prefix.length)) - 1;
        if (Number.isInteger(index) && index >= 0) (freeUses[key] ||= [])[index] = box.checked === true;
      });
    });
  }
  function currentFreeUses() {
    syncFreeUsesFromControls();
    const keys = new Set((manual ? players : [...sources, ...players]).map(sourceKeyOf).filter(Boolean));
    return Object.fromEntries(Object.entries(freeUses).filter(([key]) => keys.has(key)).map(([key, values]) => [key, clone(values)]));
  }
  function applyFreeUsesToControls() {
    (manual ? players : [...sources, ...players]).forEach(entry => {
      const key = sourceKeyOf(entry);
      (freeUses[key] || []).forEach((checked, index) => {
        const control = field(freeUseId(key, index));
        if (control && "checked" in control) control.checked = checked === true;
      });
    });
  }
  function getFreeUse(key, index) {
    const box = field(freeUseId(key, index));
    if (!isRestoring() && box && "checked" in box) (freeUses[key] ||= [])[index] = box.checked === true;
    return freeUses[key]?.[index] === true;
  }
  function setFreeUse(key, index, checked, options = {}) {
    if (!key || !Number.isInteger(Number(index)) || Number(index) < 0) return false;
    (freeUses[key] ||= [])[Number(index)] = checked === true;
    const box = field(freeUseId(key, index));
    if (box && "checked" in box) box.checked = checked === true;
    if (!options.silent) changed({ resources: true });
    return true;
  }
  function changed(detail = {}) {
    refreshVisibility();
    if (isRestoring()) return;
    rememberCurrent();
    hooks.onChange?.(detail);
    globalScope.dispatchEvent(new CustomEvent("spellmanagementchange", { detail }));
  }
  function setPlayerEntries(entries, options = {}) {
    players = normalizeEntries(entries).filter(entry => manual || !entry.spellSource);
    if (!manual && !ownerClass && CLASS_IDS.has(currentClass())) ownerClass = currentClass();
    if (options.sync !== false) changed({ players: true });
    return clone(players);
  }
  function replaceSources(entries, options = {}) {
    if (manual) return;
    syncFreeUsesFromControls();
    const seen = new Set();
    sources = normalizeEntries(entries).filter(entry => {
      if (!entry.spellSource) return false;
      const key = entryKey(entry);
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
    if (options.sync !== false && !isRestoring()) globalScope.dispatchEvent(new CustomEvent("spellmanagementchange", { detail: { sources: true } }));
  }
  function addPlayerSpell(spellId, options = {}) {
    if (!canManage()) return false;
    const entry = normalizeEntry({ ...options, spellId, spellClass: options.spellClass || currentClass() });
    if (!entry || !catalog()?.getSpell(entry.spellId) || getEntries().some(item => item.spellId === entry.spellId)) return false;
    if (!manual) {
      if (!isEntryAvailable(entry)) return false;
      const limits = getLimits();
      const count = players.filter(item => isEntryAvailable(item) && (entry.level === 0 ? item.level === 0 : item.level > 0)).length;
      if (count >= (entry.level === 0 ? limits.cantrips : limits.prepared)) return false;
    }
    players.push(entry); changed({ players: true }); return true;
  }
  function removePlayerSpell(value) {
    const index = typeof value === "string" ? players.findIndex(entry => entry.spellId === value)
      : players.findIndex(entry => entryKey(entry) === entryKey(normalizeEntry(value)));
    if (index < 0) return false;
    players.splice(index, 1); changed({ players: true }); return true;
  }

  function replayChange(input, userChange = false) {
    replaying = true;
    try {
      const event = new Event("change", { bubbles: true });
      event.dndCharacterSelectionCommitted = userChange;
      input.dispatchEvent(event);
    }
    finally { replaying = false; }
  }
  function changeCharacterSelection(event) {
    const input = event.target;
    if (!input || !["class", "level", "background", "race"].includes(input.id) || replaying || isRestoring()) return;
    const previous = { class: activeClass, level: activeLevel, background: activeBackground, race: activeRace };
    const oldValue = previous[input.id], nextValue = input.value;
    if (nextValue === oldValue) return;
    event.stopImmediatePropagation();
    syncFreeUsesFromControls(); rememberCurrent();
    const nextClass = input.id === "class" ? nextValue : activeClass, nextLevel = input.id === "level" ? nextValue : activeLevel;
    const memory = readMemories(), isNewClass = input.id === "class" && CLASS_IDS.has(nextClass) && !memory.classes[nextClass];
    const target = !manual && input.id === "class" && CLASS_IDS.has(nextClass) ? memory.classes[nextClass]?.entries || [] : players;
    const nextBackground = input.id === "background" ? nextValue : field("background")?.value;
    const nextRace = input.id === "race" ? nextValue : field("race")?.value;
    if (isNewClass) {
      const nextMemory = clone(memory);
      nextMemory.classes[nextClass] = { initialized: true, level: Number(nextLevel) || 0, entries: [] };
      if (!writeMemories(nextMemory) && !inShareMode()) {
        memories = nextMemory;
        globalScope.AppDialog.notify("瀏覽器無法保存職業法術記憶；目前清單仍保留在本頁。", { tone: "warning" });
      }
    }
    // Keep all saved selections when class or level changes. Availability is
    // evaluated separately, so higher-level spells can become usable again.
    if (!manual && nextClass) { players = normalizeEntries(target); ownerClass = nextClass; }
    activeClass = nextClass; activeLevel = nextLevel; activeBackground = nextBackground; activeRace = nextRace;
    replayChange(input, event.isTrusted); changed({ character: true });
  }
  async function setManual(next, options = {}) {
    next = next === true;
    if (switching || next === manual) { refreshVisibility(); return next === manual; }
    switching = true;
    try {
      if (options.confirm !== false) {
        const confirmed = await globalScope.AppDialog.requestDecision(next ? {
          title: "啟用手動法術管理", message: "手動管理會使用獨立清單，開放目前支援的法表與戲法至四環，不套用準備數量限制。首次啟用會沿用目前全部法術；各職業原有的準備清單與法術書都會保留。",
          confirmLabel: "啟用手動管理", cancelLabel: "取消", trigger: options.trigger
        } : {
          title: "恢復自動法術管理", message: "將載入目前職業自己的準備清單，並依角色選項重新計算來源法術。手動清單與法術書都會保留，之後可再切回手動管理。",
          confirmLabel: "恢復自動管理", cancelLabel: "繼續手動管理", trigger: options.trigger
        });
        if (!confirmed) return false;
      }
      syncFreeUsesFromControls();
      const initial = getEntries(); rememberCurrent(); const memory = readMemories();
      const target = next ? memory.manual?.entries || initial : currentClass() ? memory.classes[currentClass()]?.entries || [] : [];
      manual = next; players = normalizeEntries(target); ownerClass = CLASS_IDS.has(currentClass()) ? currentClass() : "";
      if (next && memory.manual?.freeUses) {
        freeUses = { ...freeUses, ...clone(memory.manual.freeUses) };
        applyFreeUsesToControls();
      }
      changed({ mode: true }); return true;
    } finally { switching = false; refreshVisibility(); }
  }

  function sourceChoiceArea() {
    let area = field("spell-source-use-state");
    if (!area) { area = document.createElement("div"); area.id = "spell-source-use-state"; area.hidden = true; field("tab-spells")?.appendChild(area); }
    return area;
  }
  function getClassFeatureCantripControl(key) {
    if (!/^class-(?:paladin-blessed|ranger-druidic)-warrior-cantrip-[12]$/.test(key)) return null;
    const area = sourceChoiceArea();
    let input = Array.from(area.querySelectorAll("[data-class-cantrip-key]")).find(candidate => candidate.dataset.classCantripKey === key);
    if (!input) {
      input = document.createElement("input"); input.type = "hidden"; input.dataset.classCantripKey = key; input.dataset.stateTransient = "true";
      input.addEventListener("change", () => { hooks.onSourceChoiceChange?.(key, input.value); changed({ sourceChoice: true }); }); area.appendChild(input);
    }
    return input;
  }
  const collectClassFeatureCantrips = () => Object.fromEntries(Array.from(sourceChoiceArea().querySelectorAll("[data-class-cantrip-key]"), input => [input.dataset.classCantripKey, input.value]));
  function applyClassFeatureChoices(choices) {
    sourceChoiceArea().querySelectorAll("[data-class-cantrip-key]").forEach(input => input.remove());
    Object.entries(choices || {}).forEach(([key, value]) => { const input = getClassFeatureCantripControl(key); if (input && typeof value === "string") input.value = value; });
  }
  function beforeApplyState(data = {}) {
    restoring = true; pendingData = data; migrationPending = !data.__spellManagement || Number(data.__spellManagement.version) < VERSION;
    document.querySelectorAll(".free-spell-use-check").forEach(control => control.remove());
    const saved = data.__spellManagement;
    manual = saved?.version >= VERSION ? saved.manual === true : false;
    players = saved?.version >= VERSION ? normalizeEntries(saved.entries).filter(entry => manual || !entry.spellSource) : normalizeEntries(hooks.parseLegacyEntries?.(data) || []);
    sources = []; freeUses = saved?.freeUses && typeof saved.freeUses === "object" ? clone(saved.freeUses) : {};
    applyClassFeatureChoices(saved?.classFeatureCantrips || data.__classFeatureCantrips || {});
    (Array.isArray(data.__retainedSpells) ? data.__retainedSpells : []).forEach(item => {
      const input = getClassFeatureCantripControl(item?.key);
      if (input && !input.value && Number.isInteger(item.index)) input.value = String(data[`${item.areaId}-spell-${item.index}`] || "");
    });
    refreshVisibility();
  }
  function restoreState(data = pendingData || {}) {
    const saved = data.__spellManagement;
    if (saved?.version >= VERSION) { manual = saved.manual === true; players = normalizeEntries(saved.entries).filter(entry => manual || !entry.spellSource); }
    else {
      const full = normalizeEntries(hooks.parseLegacyEntries?.(data) || players);
      sources.forEach(entry => {
        const index = full.findIndex(item => item.spellSource && item.sourceKey === entry.sourceKey && item.spellId === entry.spellId);
        if (index < 0) full.push(entry);
        else full[index] = { ...full[index], ...entry };
      });
      manual = true; players = full;
    }
    getEntries().forEach(entry => {
      const key = sourceKeyOf(entry); if (!key) return;
      const prefix = `free-spell-use-${safeKey(key)}-`;
      Object.entries(data).forEach(([id, checked]) => {
        if (!id.startsWith(prefix)) return;
        const index = Number(id.slice(prefix.length)) - 1;
        if (Number.isInteger(index) && index >= 0) (freeUses[key] ||= [])[index] = checked === true;
      });
    });
    if (!saved || Number(saved.version) < VERSION) players.forEach(entry => {
      if (entry.sourceKey && !entry.freeUses && freeUses[entry.sourceKey]?.length) {
        entry.freeUses = freeUses[entry.sourceKey].length;
        entry.castMode ||= "free-or-slot";
      }
    });
    applyFreeUsesToControls();
    ownerClass = CLASS_IDS.has(currentClass()) ? currentClass() : ""; syncActiveSelection();
    const next = clone(readMemories());
    if (manual) next.manual = { initialized: true, entries: clone(players), freeUses: currentFreeUses() };
    else if (ownerClass) next.classes[ownerClass] = { initialized: true, level: Number(currentLevel()) || 0, entries: clone(players) };
    const persisted = inShareMode() || writeMemories(next), legacyMigrated = migrationPending && persisted;
    migrationNotice = legacyMigrated;
    if (persisted) migrationPending = false;
    pendingData = null; refreshVisibility(); return { legacyMigrated, persisted };
  }
  function finishRestore() {
    restoring = false; syncActiveSelection(); refreshVisibility();
    globalScope.dispatchEvent(new CustomEvent("spellmanagementchange", { detail: { restored: true } }));
    if (migrationNotice) {
      migrationNotice = false;
      if (!inShareMode() && globalScope.saveAllFields?.() === false) {
        migrationPending = true;
        globalScope.AppDialog.notify("舊版法術已保留在本頁，但瀏覽器無法保存遷移結果；原本的本機存檔仍保留。", { tone: "warning" });
        return;
      }
      showMigrationNotice();
    }
  }
  function showMigrationNotice() {
    void globalScope.AppDialog.showContent({ title: "已偵測到您的角色存檔為舊版",
      message: "現在切換職業時，不同職業的法術列表會分別儲存。",
      renderContent(body) {
        ["為避免遺失舊資料，您原有的法術列表（包含自動準備）都已保留，並已啟用「手動管理法術」。",
          "手動管理啟用後法術不會自動準備，請自行確認列表是否符合規則。"].forEach(text => {
          const paragraph = document.createElement("p");
          paragraph.textContent = text;
          body.appendChild(paragraph);
        });
        const recommendation = document.createElement("p");
        const label = document.createElement("strong");
        label.textContent = "建議：";
        recommendation.append(label, " 先匯出 JSON 備份並記下目前的角色資料，再使用「清除紀錄」重建新版角色存檔。");
        body.appendChild(recommendation);
      },
      confirmLabel: "知道了", dismissOnBackdrop: false });
  }
  function getState() {
    syncFreeUsesFromControls();
    return { version: VERSION, manual, entries: getEntries().map(entry => ({ ...entry, unavailable: !isEntryAvailable(entry) })),
      freeUses: currentFreeUses(), classFeatureCantrips: collectClassFeatureCantrips() };
  }
  function refreshVisibility() { const control = field("manual-spell-management"); if (control) control.checked = manual; }
  function clearMemories() {
    if (inShareMode()) return;
    [MEMORY_KEY, NOTICE_KEY, "dnd.spellManagementBackup.v1"].forEach(key => globalScope.dndStorage?.removeItem(key));
    memories = { version: 1, classes: {}, manual: null };
  }
  function beginRestoreBatch() { batchDepth += 1; }
  function syncActiveSelection() {
    activeClass = currentClass(); activeLevel = currentLevel(); activeBackground = field("background")?.value || ""; activeRace = field("race")?.value || "";
  }
  function endRestoreBatch() {
    batchDepth = Math.max(0, batchDepth - 1);
    if (!batchDepth) { syncActiveSelection(); ownerClass = CLASS_IDS.has(activeClass) ? activeClass : ""; }
  }
  function withRestoreBatch(callback) {
    beginRestoreBatch();
    try { const result = callback(); if (result?.then) return result.finally(endRestoreBatch); endRestoreBatch(); return result; }
    catch (error) { endRestoreBatch(); throw error; }
  }
  globalScope.SpellManagement = Object.freeze({ version: VERSION, storageKeys: Object.freeze([MEMORY_KEY, NOTICE_KEY]),
    configure(options = {}) { hooks = { ...hooks, ...options }; }, isManual: () => manual, isSwitching: () => switching, canManage, getLimits,
    normalizeEntry, normalizeEntries, entryKey, getEntries, getPlayerEntries: () => clone(players), getSourceEntries: () => manual ? [] : clone(sources),
    setPlayerEntries, replaceSources, addPlayerSpell, removePlayerSpell, getAvailabilityReason, isEntryAvailable, getFreeUse, setFreeUse,
    getState, beforeApplyState, restoreState, finishRestore, clearMemories, setManual,
    canPersistCurrentState: () => !migrationPending,
    beginRestoreBatch, endRestoreBatch, withRestoreBatch, collectClassFeatureCantrips, getClassFeatureCantripControl, refreshVisibility });
  document.addEventListener("change", changeCharacterSelection, true);
  document.addEventListener("DOMContentLoaded", () => {
    syncActiveSelection(); if (!ownerClass && CLASS_IDS.has(activeClass)) ownerClass = activeClass;
    field("manual-spell-management")?.addEventListener("change", event => {
      const next = event.currentTarget.checked; event.currentTarget.checked = manual; void setManual(next, { trigger: event.currentTarget });
    });
    refreshVisibility();
  });
})(window);

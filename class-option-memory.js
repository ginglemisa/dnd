(function attachClassOptionMemory(globalScope) {
  "use strict";
  // 其他職業的職業選項只存在這份本機副本；畫面、autosave、JSON、分享與 PDF
  // 仍只含目前職業。index.html 負責擷取與還原，此模組只負責保存與驗證。
  const VERSION = 1;
  const MEMORY_KEY = "dnd.classOptionMemories.v1";
  const CLASS_IDS = new Set(["barbarian", "bard", "cleric", "druid", "fighter", "monk", "paladin", "ranger", "rogue", "sorcerer", "warlock", "wizard"]);
  const KEY_PATTERN = /^[a-z0-9-]{1,80}$/;
  const LIMITS = Object.freeze({ values: 128, lists: 8, listItems: 32, text: 200 });
  let memories = null, hooks = {}, writeWarningShown = false;
  const clone = value => JSON.parse(JSON.stringify(value));
  const inShareMode = () => globalScope.SHARE_MODE === true;
  const empty = () => ({ version: VERSION, classes: {} });

  function sanitizeRecord(record) {
    if (!record || typeof record !== "object" || Array.isArray(record)) return null;
    const values = {}, lists = {};
    const rawValues = record.values && typeof record.values === "object" && !Array.isArray(record.values) ? record.values : {};
    Object.entries(rawValues).slice(0, LIMITS.values).forEach(([key, value]) => {
      if (!KEY_PATTERN.test(key)) return;
      if (typeof value === "boolean" || (typeof value === "string" && value.length <= LIMITS.text)) values[key] = value;
    });
    const rawLists = record.lists && typeof record.lists === "object" && !Array.isArray(record.lists) ? record.lists : {};
    Object.entries(rawLists).slice(0, LIMITS.lists).forEach(([key, list]) => {
      if (!KEY_PATTERN.test(key) || !Array.isArray(list)) return;
      lists[key] = [...new Set(list.filter(item => typeof item === "string" && item && item.length <= LIMITS.text))].slice(0, LIMITS.listItems);
    });
    const level = Number.parseInt(record.level, 10);
    return { level: Number.isInteger(level) && level >= 0 && level <= 20 ? level : 0, values, lists };
  }

  function read() {
    if (memories) return memories;
    memories = empty();
    if (inShareMode()) return memories;
    try {
      const raw = globalScope.dndStorage?.getItem(MEMORY_KEY);
      // 沿用角色資料的大小與結構預檢，再套用本模組自己的上限。
      const saved = raw ? globalScope.parseCharacterStateJson(raw) : null;
      if (saved?.version === VERSION && saved.classes && typeof saved.classes === "object") {
        Object.entries(saved.classes).forEach(([className, record]) => {
          const next = CLASS_IDS.has(className) ? sanitizeRecord(record) : null;
          if (next) memories.classes[className] = next;
        });
      }
    } catch (_error) { /* 損壞的記憶視為空白；原始資料留到下一次成功寫入。 */ }
    return memories;
  }

  function write(next) {
    memories = next;
    if (inShareMode() || hooks.isPersistenceBlocked?.()) return false;
    const persisted = globalScope.dndStorage?.setItem(MEMORY_KEY, JSON.stringify(next)) === true;
    if (!persisted && !writeWarningShown) {
      writeWarningShown = true;
      globalScope.AppDialog?.notify("瀏覽器無法保存其他職業的選項；本頁仍會暫時記住，重新整理後可能需要重選。", { tone: "warning" });
    }
    return persisted;
  }

  function get(className) {
    if (inShareMode() || !CLASS_IDS.has(className)) return null;
    const record = read().classes[className];
    return record ? clone(record) : null;
  }

  // 合併式保存：只覆蓋這次擷取到的欄位，其他等級或暫時不在畫面上的選擇保留。
  function remember(className, snapshot = {}, options = {}) {
    if (inShareMode() || !CLASS_IDS.has(className)) return false;
    const incoming = sanitizeRecord(snapshot);
    if (!incoming) return false;
    const next = clone(read());
    const previous = options.replace ? null : next.classes[className];
    next.classes[className] = sanitizeRecord({
      level: incoming.level || previous?.level || 0,
      values: { ...(previous?.values || {}), ...incoming.values },
      lists: { ...(previous?.lists || {}), ...incoming.lists }
    });
    return write(next);
  }

  function clearMemories() {
    memories = empty();
    writeWarningShown = false;
    if (inShareMode()) return;
    globalScope.dndStorage?.removeItem(MEMORY_KEY);
  }

  globalScope.ClassOptionMemory = Object.freeze({
    version: VERSION, storageKey: MEMORY_KEY,
    configure(options = {}) { hooks = { ...hooks, ...options }; },
    get, remember, clearMemories
  });
})(window);

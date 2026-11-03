/**
 * 物品欄資料（傳統 defer script，無額外 runtime dependency）。
 *
 * - 角色資料頂層 `__inventory`：{ version: 1, items: [{ uid, itemId?, name?, quantity, in?, weight?, container?, source? }] }。
 *   itemId 是裝備說明的品名（與 mainHand／商店相同的中文名稱）；name 是顯示名稱，自訂物品必填，目錄品項只在寫法不同時保留
 *   （例如「書籍（禱文）」）。weight（每件磅數）與 container 只用於自訂物品；in 是所在容器的 uid；
 *   source "initial" 標記快速創角匯入的初始裝備（PDF 判斷是否另補職業／背景裝備）。
 * - 目錄：重量與分類取自 equipment-notes.js 整理的 EQUIPMENT_SHOP_ITEMS，武器／護甲取自 equipment-data.js，
 *   套組內容物、容器與可持用的法器取自 equipment-data.js 的結構化清單；這裡不另存重量。彈藥以單發計數。
 * - 只整理資料、不碰畫面；變更時在 document 發出 `inventory:change`，存檔、裝備下拉與負重由 index.html 與 inventory-ui.js 處理。
 * - 新增物品不會自動裝備；角色卡上的裝備選擇由玩家自己做。
 */
(function (globalScope) {
  "use strict";

  const VERSION = 1;
  const LIMITS = Object.freeze({ items: 300, quantity: 9999, name: 40, weight: 9999, depth: 3 });
  const SOURCES = new Set(["initial"]);
  const UID_PATTERN = /^[A-Za-z0-9_-]{1,24}$/u;
  // 品名附註較長的聖徽在物品欄顯示短名，與攜帶物品舊寫法相同。
  const SHORT_NAMES = Object.freeze({ "聖物匣（手持）": "聖物匣", "徽章（附於布料／盾牌）": "徽章", "護身符（佩戴／手持）": "護身符" });
  // 快速創角、背景裝備與舊「購買物品」文字的寫法對應到目錄品名；keepName 保留原寫法當顯示名稱。
  const ALIASES = Object.freeze({
    "奧術法器（水晶）": { itemId: "水晶" }, "奧術法器（寶珠）": { itemId: "寶珠" }, "奧術法器（長棍）": { itemId: "法杖（長棍）" },
    "德魯伊法器（長棍）": { itemId: "木製法杖（長棍）" }, "德魯伊法器（槲寄生枝條）": { itemId: "槲寄生樹枝" },
    "油瓶": { itemId: "油" }, "子彈": { itemId: "子彈，火器" }, "彈丸": { itemId: "彈丸，投石索" },
    "祭祀長袍": { itemId: "長袍", keepName: true }
  });
  const BOOK_PATTERN = /^(?:書籍|書本|書)（[^（）]+）$/u;
  // 「多種」標題可當通稱品項（例如職業裝備只寫「聖徽」）；彈藥一律選具體品項。
  const GROUP_EXCLUDED = new Set(["彈藥"]);

  let entries = [];
  let catalogCache = null;
  let uidSeed = Date.now() % 1679616;

  function getList(key) {
    const value = globalScope[key];
    return Array.isArray(value) ? value : [];
  }

  function staticKinds() {
    const weapons = new Set(["weapons_simple_melee", "weapons_simple_ranged", "weapons_martial_melee", "weapons_martial_ranged"]
      .flatMap(key => getList(key).map(item => item.名稱)));
    return {
      weapons,
      armors: new Set(getList("armors").map(item => item.名稱)),
      shields: new Set(getList("shield").map(item => item.名稱)),
      containers: new Set(globalScope.EQUIPMENT_CONTAINER_ITEMS || []),
      wieldedAs: globalScope.EQUIPMENT_WIELDED_AS || {},
      packs: globalScope.EQUIPMENT_PACK_CONTENTS || {}
    };
  }

  function kindOf(itemId, kinds = staticKinds()) {
    if (kinds.shields.has(itemId)) return "shield";
    if (kinds.armors.has(itemId)) return "armor";
    if (kinds.weapons.has(itemId)) return "weapon";
    return "";
  }

  function buildCatalog() {
    const shopItems = getList("EQUIPMENT_SHOP_ITEMS");
    if (!shopItems.length) return null;
    const kinds = staticKinds();
    const catalog = new Map();
    const add = (item) => catalog.set(item.id, Object.freeze(item));
    shopItems.forEach((item) => {
      if (item.group && !GROUP_EXCLUDED.has(item.group) && !catalog.has(item.group)) {
        add({ id: item.group, label: item.group, category: item.category, group: "", weight: null, bundle: 1, kind: "", wieldedAs: "", container: false, pack: null, generic: true });
      }
      if (catalog.has(item.name) && !catalog.get(item.name).generic) return;
      const bundle = item.bundle || 1;
      const kind = kindOf(item.name, kinds);
      add({
        id: item.name,
        label: SHORT_NAMES[item.name] || item.name,
        category: item.category,
        group: item.group || "",
        // 法術卷軸等依環階拆價的品項共用同一個品名，重量相同。
        weight: Number.isFinite(item.weight) ? item.weight / bundle : null,
        bundle,
        kind,
        wieldedAs: kind === "weapon" ? item.name : kinds.wieldedAs[item.name] || "",
        container: kinds.containers.has(item.name),
        pack: kinds.packs[item.name] || null,
        generic: false
      });
    });
    return catalog;
  }

  function catalog() {
    if (!catalogCache) catalogCache = buildCatalog();
    return catalogCache || new Map();
  }

  function getCatalogItem(itemId) {
    return itemId ? catalog().get(itemId) || null : null;
  }

  function clampQuantity(value) {
    const number = Math.floor(Number(value));
    if (!Number.isFinite(number) || number < 1) return 1;
    return Math.min(number, LIMITS.quantity);
  }

  function cleanText(value) {
    return typeof value === "string" ? value.replace(/\s+/gu, " ").trim().slice(0, LIMITS.name) : "";
  }

  function nextUid(taken) {
    let uid;
    do {
      uidSeed = (uidSeed + 1) % 1679616;
      uid = `i${uidSeed.toString(36)}`;
    } while (taken.has(uid));
    taken.add(uid);
    return uid;
  }

  function normalizeEntry(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const itemId = cleanText(raw.itemId);
    const name = cleanText(raw.name);
    if (!itemId && !name) return null;
    const entry = { uid: typeof raw.uid === "string" && UID_PATTERN.test(raw.uid) ? raw.uid : "", quantity: clampQuantity(raw.quantity) };
    if (itemId) entry.itemId = itemId;
    if (name && name !== itemId) entry.name = name;
    if (!itemId) {
      const weight = Number(raw.weight);
      if (raw.weight !== null && raw.weight !== "" && raw.weight !== undefined && Number.isFinite(weight) && weight >= 0) {
        entry.weight = Math.min(Math.round(weight * 1000) / 1000, LIMITS.weight);
      }
      if (raw.container === true) entry.container = true;
    }
    if (typeof raw.in === "string" && UID_PATTERN.test(raw.in)) entry.in = raw.in;
    if (SOURCES.has(raw.source)) entry.source = raw.source;
    return entry;
  }

  function isContainerEntry(entry, kinds = staticKinds()) {
    return Boolean(entry) && (entry.itemId ? kinds.containers.has(entry.itemId) : entry.container === true);
  }

  // 容器關係必須指向存在的容器、不能成環，且最多 LIMITS.depth 層；不符合的物品移到最外層，不刪除。
  function repairContainment(list) {
    const kinds = staticKinds();
    const byUid = new Map(list.map(entry => [entry.uid, entry]));
    list.forEach((entry) => {
      if (entry.in && (entry.in === entry.uid || !isContainerEntry(byUid.get(entry.in), kinds))) delete entry.in;
    });
    list.forEach((entry) => {
      const seen = new Set([entry.uid]);
      let parent = entry.in ? byUid.get(entry.in) : null;
      let depth = 0;
      while (parent) {
        depth += 1;
        if (seen.has(parent.uid) || depth > LIMITS.depth) {
          delete entry.in;
          return;
        }
        seen.add(parent.uid);
        parent = parent.in ? byUid.get(parent.in) : null;
      }
    });
    return list;
  }

  function normalizeState(raw) {
    const list = raw && typeof raw === "object" && Array.isArray(raw.items) ? raw.items.slice(0, LIMITS.items) : [];
    const taken = new Set();
    const normalized = [];
    list.forEach((rawEntry) => {
      const entry = normalizeEntry(rawEntry);
      if (!entry) return;
      if (!entry.uid || taken.has(entry.uid)) entry.uid = "";
      else taken.add(entry.uid);
      normalized.push(entry);
    });
    normalized.forEach((entry) => { if (!entry.uid) entry.uid = nextUid(taken); });
    return repairContainment(normalized);
  }

  function copyEntry(entry) {
    return { ...entry };
  }

  function emit(reason) {
    if (typeof document === "undefined") return;
    document.dispatchEvent(new CustomEvent("inventory:change", { detail: { reason } }));
  }

  function commit(next, reason) {
    entries = repairContainment(next);
    emit(reason);
    return true;
  }

  function getLabel(entry) {
    if (!entry) return "";
    return entry.name || getCatalogItem(entry.itemId)?.label || SHORT_NAMES[entry.itemId] || entry.itemId || "";
  }

  function getUnitWeight(entry) {
    if (!entry) return null;
    if (entry.itemId) return getCatalogItem(entry.itemId)?.weight ?? null;
    return Number.isFinite(entry.weight) ? entry.weight : null;
  }

  function parseItemText(text) {
    let name = String(text ?? "").replace(/\s+/gu, " ").trim();
    let quantity = 1;
    const times = name.match(/^(.*?)\s*×\s*(\d+)$/u);
    if (times) {
      name = times[1].trim();
      quantity = Number(times[2]);
    }
    const bundle = name.match(/^(.*?)\s*[(（](\d+)[)）]$/u);
    if (bundle) {
      name = bundle[1].trim();
      quantity *= Number(bundle[2]);
    }
    return { ...resolveName(name), quantity: clampQuantity(quantity) };
  }

  function resolveName(rawName) {
    const name = cleanText(rawName);
    if (!name) return {};
    if (catalog().has(name)) return { itemId: name };
    const shortSource = Object.keys(SHORT_NAMES).find(key => SHORT_NAMES[key] === name);
    if (shortSource) return { itemId: shortSource };
    const alias = ALIASES[name];
    if (alias) return alias.keepName ? { itemId: alias.itemId, name } : { itemId: alias.itemId };
    if (BOOK_PATTERN.test(name)) return { itemId: "書籍", name };
    return { name };
  }

  function sameStack(entry, request) {
    return (entry.itemId || "") === (request.itemId || "")
      && (entry.name || "") === (request.name || "")
      && (entry.in || "") === (request.in || "")
      && entry.weight === request.weight
      && !isContainerEntry(entry);
  }

  // 套組拆成第一項容器＋其餘內容物；容器每件各自一筆（內容物才分得清楚），其他品項同名同處就合併數量。
  function expandRequests(requests, into, source) {
    const expanded = [];
    requests.forEach((request) => {
      const resolved = request.text ? parseItemText(request.text) : { itemId: cleanText(request.itemId), name: cleanText(request.name) };
      const quantity = clampQuantity(request.quantity ?? resolved.quantity ?? 1) * (request.text && request.quantity ? resolved.quantity : 1);
      const base = { itemId: resolved.itemId || "", name: resolved.name && resolved.name !== resolved.itemId ? resolved.name : "" };
      if (!base.itemId && !base.name) return;
      const pack = getCatalogItem(base.itemId)?.pack || staticKinds().packs[base.itemId];
      if (pack && !base.name) {
        for (let index = 0; index < quantity; index += 1) {
          const [containerId] = pack[0];
          expanded.push({ itemId: containerId, quantity: 1, into, source, contents: pack.slice(1).map(([itemId, count]) => ({ itemId, quantity: count, source })) });
        }
        return;
      }
      const custom = base.itemId ? {} : {
        ...(request.weight !== undefined && request.weight !== null && request.weight !== "" && Number.isFinite(Number(request.weight)) && Number(request.weight) >= 0
          ? { weight: Math.min(Math.round(Number(request.weight) * 1000) / 1000, LIMITS.weight) } : {}),
        ...(request.container === true ? { container: true } : {})
      };
      expanded.push({ ...base, ...custom, quantity, into, source });
    });
    return expanded;
  }

  function placeRequest(next, request, taken) {
    const entry = { uid: "", quantity: clampQuantity(request.quantity) };
    if (request.itemId) entry.itemId = request.itemId;
    if (request.name) entry.name = request.name;
    if (Number.isFinite(request.weight)) entry.weight = request.weight;
    if (request.container) entry.container = true;
    if (request.into) entry.in = request.into;
    if (request.source) entry.source = request.source;
    const containerUnits = isContainerEntry(entry) ? entry.quantity : 0;
    if (!containerUnits) {
      const stack = next.find(item => sameStack(item, entry));
      if (stack) {
        stack.quantity = Math.min(stack.quantity + entry.quantity, LIMITS.quantity);
        if (entry.source && !stack.source) stack.source = entry.source;
        return [stack];
      }
      entry.uid = nextUid(taken);
      next.push(entry);
      return [entry];
    }
    const placed = [];
    for (let index = 0; index < containerUnits; index += 1) {
      const unit = { ...entry, quantity: 1, uid: nextUid(taken) };
      next.push(unit);
      placed.push(unit);
      (request.contents || []).forEach(content => placeRequest(next, { ...content, into: unit.uid }, taken));
    }
    return placed;
  }

  /**
   * 加入物品。requests：[{ itemId?, name?, text?, quantity?, weight?, container? }]；text 可用「名稱 ×n」「箭矢(20)」寫法。
   * options.into 是放入的容器 uid；options.source "initial" 標記初始裝備；options.dryRun 只檢查是否放得下。
   * 超過上限時不加入任何物品並回傳 false。
   */
  function add(requests, options = {}) {
    const list = Array.isArray(requests) ? requests : [requests];
    const into = options.into && isContainerEntry(entries.find(entry => entry.uid === options.into)) ? options.into : "";
    const source = SOURCES.has(options.source) ? options.source : "";
    const next = entries.map(copyEntry);
    const taken = new Set(next.map(entry => entry.uid));
    expandRequests(list, into, source).forEach(request => placeRequest(next, request, taken));
    if (next.length > LIMITS.items) return false;
    if (options.dryRun) return true;
    if (next.length === entries.length && next.every((entry, index) => entry.quantity === entries[index].quantity)) return true;
    return commit(next, "add");
  }

  function descendantsOf(uid, list = entries) {
    const result = new Set();
    const queue = [uid];
    while (queue.length) {
      const current = queue.shift();
      list.forEach((entry) => {
        if (entry.in === current && !result.has(entry.uid)) {
          result.add(entry.uid);
          queue.push(entry.uid);
        }
      });
    }
    return result;
  }

  function subtreeDepth(uid, list = entries) {
    const children = list.filter(entry => entry.in === uid);
    return children.length ? 1 + Math.max(...children.map(child => subtreeDepth(child.uid, list))) : 0;
  }

  function depthOf(uid, list = entries) {
    let depth = 0;
    let parent = list.find(entry => entry.uid === uid)?.in;
    while (parent && depth <= LIMITS.depth) {
      depth += 1;
      parent = list.find(entry => entry.uid === parent)?.in;
    }
    return depth;
  }

  /** 可放入 uid 的容器（排除自己、自己裡面的容器，以及放進去會超過層數上限的容器）。 */
  function getContainerTargets(uid) {
    const excluded = uid ? descendantsOf(uid) : new Set();
    const ownDepth = uid ? subtreeDepth(uid) : 0;
    return entries.filter(entry => isContainerEntry(entry) && entry.uid !== uid && !excluded.has(entry.uid)
      && depthOf(entry.uid) + 1 + ownDepth <= LIMITS.depth);
  }

  /** 更新一筆物品：{ quantity?, in?, name?, weight?, container? }；name／weight／container 只套用於自訂物品。 */
  function update(uid, changes = {}) {
    const next = entries.map(copyEntry);
    const entry = next.find(item => item.uid === uid);
    if (!entry) return false;
    if (changes.quantity !== undefined) entry.quantity = clampQuantity(changes.quantity);
    if (changes.in !== undefined) {
      const target = changes.in ? getContainerTargets(uid).find(item => item.uid === changes.in) : null;
      if (target) entry.in = target.uid;
      else if (!changes.in) delete entry.in;
    }
    if (changes.name !== undefined) {
      const name = cleanText(changes.name);
      if (!entry.itemId && name) entry.name = name;
    }
    if (!entry.itemId && changes.weight !== undefined) {
      const weight = Number(changes.weight);
      if (changes.weight === null || changes.weight === "" || !Number.isFinite(weight) || weight < 0) delete entry.weight;
      else entry.weight = Math.min(Math.round(weight * 1000) / 1000, LIMITS.weight);
    }
    if (!entry.itemId && changes.container !== undefined) {
      if (changes.container === true) entry.container = true;
      else {
        delete entry.container;
        next.forEach((item) => { if (item.in === uid) item.in = entry.in || ""; });
      }
    }
    next.forEach((item) => { if (!item.in) delete item.in; });
    // 移到已有同名物品的位置時合併成一筆。
    const stack = next.find(item => item !== entry && sameStack(item, entry));
    if (stack && !isContainerEntry(entry)) {
      stack.quantity = Math.min(stack.quantity + entry.quantity, LIMITS.quantity);
      if (entry.source && !stack.source) stack.source = entry.source;
      return commit(next.filter(item => item !== entry), "update");
    }
    return commit(next, "update");
  }

  /** 移除一筆物品；容器的內容物在 keepContents 時移到容器原本所在處，否則一併移除。 */
  function remove(uid, { keepContents = true } = {}) {
    const target = entries.find(entry => entry.uid === uid);
    if (!target) return false;
    const removed = keepContents ? new Set([uid]) : new Set([uid, ...descendantsOf(uid)]);
    const next = entries.filter(entry => !removed.has(entry.uid)).map(copyEntry);
    next.forEach((entry) => {
      if (entry.in !== uid) return;
      if (target.in) entry.in = target.in;
      else delete entry.in;
    });
    return commit(next, "remove");
  }

  function restore(state) {
    entries = normalizeState(state);
    emit("restore");
  }

  function clear() {
    if (!entries.length) return;
    commit([], "clear");
  }

  function getState() {
    return { version: VERSION, items: entries.map(copyEntry) };
  }

  /** 物品欄可供裝備的數量：weapons／armors 以武器或護甲名稱計數，shields 為盾牌數量。 */
  function getEquippableCounts() {
    const kinds = staticKinds();
    const weapons = new Map();
    const armors = new Map();
    let shields = 0;
    entries.forEach((entry) => {
      if (!entry.itemId) return;
      const kind = kindOf(entry.itemId, kinds);
      const wieldedAs = kind === "weapon" ? entry.itemId : kinds.wieldedAs[entry.itemId];
      if (wieldedAs) weapons.set(wieldedAs, (weapons.get(wieldedAs) || 0) + entry.quantity);
      if (kind === "armor") armors.set(entry.itemId, (armors.get(entry.itemId) || 0) + entry.quantity);
      if (kind === "shield") shields += entry.quantity;
    });
    return { weapons, armors, shields };
  }

  /** 舊資料沒有物品欄時，把已裝備的武器、護甲與盾牌各放進物品欄（主副手同名時放 2 件）。 */
  function seedFromEquipped({ mainHand = "", offHand = "", armor = "", shield = false } = {}) {
    const kinds = staticKinds();
    const counts = new Map();
    const bump = (name) => { if (name) counts.set(name, (counts.get(name) || 0) + 1); };
    [mainHand, offHand].forEach((name) => {
      if (kinds.weapons.has(name)) bump(name);
      else if (kinds.shields.has(name)) bump(name);
    });
    if (kinds.armors.has(armor)) bump(armor);
    if (shield && !counts.has("盾牌") && kinds.shields.has("盾牌")) bump("盾牌");
    const requests = [...counts].map(([itemId, quantity]) => ({ itemId, quantity }));
    if (!requests.length) {
      if (entries.length) commit([], "restore");
      else emit("restore");
      return;
    }
    entries = [];
    add(requests);
  }

  function getWeight(state = null) {
    const list = state ? normalizeState(state) : entries;
    let weight = 0;
    let unknown = 0;
    list.forEach((entry) => {
      const unit = getUnitWeight(entry);
      if (Number.isFinite(unit)) weight += unit * entry.quantity;
      else unknown += 1;
    });
    return { weight: Math.round(weight * 100) / 100, unknown };
  }

  function formatEntry(entry, list) {
    const label = `${getLabel(entry)}${entry.quantity > 1 ? ` ×${entry.quantity}` : ""}`;
    const children = list.filter(item => item.in === entry.uid);
    return children.length ? `${label}（${children.map(child => formatEntry(child, list)).join("、")}）` : label;
  }

  /** 物品欄的文字寫法（PDF 等），例如「匕首 ×2、背包（水袋 ×2、地圖）」。 */
  function formatText(state = null) {
    const list = state ? normalizeState(state) : entries;
    return list.filter(entry => !entry.in).map(entry => formatEntry(entry, list)).join("、");
  }

  function hasInitialEquipment(state = null) {
    const list = state ? normalizeState(state) : entries;
    return list.some(entry => entry.source === "initial");
  }

  globalScope.Inventory = Object.freeze({
    LIMITS,
    add,
    update,
    remove,
    restore,
    clear,
    getState,
    seedFromEquipped,
    getEquippableCounts,
    getContainerTargets,
    getWeight,
    getUnitWeight,
    getLabel,
    formatText,
    hasInitialEquipment,
    parseItemText,
    getCatalogItem,
    getCatalog: () => [...catalog().values()],
    isContainer: entry => isContainerEntry(entry),
    entries: () => entries.map(copyEntry),
    getEntry: uid => {
      const entry = entries.find(item => item.uid === uid);
      return entry ? copyEntry(entry) : null;
    },
    childrenOf: uid => entries.filter(entry => (entry.in || "") === (uid || "")).map(copyEntry),
    descendantsOf: uid => [...descendantsOf(uid)]
  });
})(typeof window !== "undefined" ? window : globalThis);

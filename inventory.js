/**
 * 物品欄資料（傳統 defer script，無額外 runtime dependency）。
 *
 * - 角色資料頂層 `__inventory`：{ version: 1, textOnly?, items: [{ uid, itemId?, name?, quantity, in?, weight?, container?, desc?, source?, uses? }] }。
 *   itemId 是裝備說明的品名（與 mainHand／商店相同的中文名稱）；name 是顯示名稱，自訂物品必填，目錄品項只在寫法不同時保留
 *   （例如「書籍（禱文）」）。weight（每件磅數）、container 與 desc（描述）只用於自訂物品；in 是所在容器的 uid；
 *   source "initial" 標記快速創角匯入的初始裝備，"equipped" 標記因主手／副手／護甲已裝備而補上的物品（整理成標籤時先抵掉，不重複）。
 *   uses 是有使用次數的目錄物品（EQUIPMENT_ITEM_ACTIONS 的 uses，例如醫療包）目前這件的剩餘次數；沒有這個欄位表示全新，同一筆的其餘件數都是全新的。
 * - 執行時的 slot 是這件物品正裝備在哪個位置（mainHand、offHand、armor、shield）：固定 1 件、在最外層，由 syncEquipped() 依角色卡的裝備選擇維護。
 *   裝備選擇已經存在角色欄位，slot 不寫進存檔（getState() 拿掉、restore() 不讀），載入後重新對應：裝備中那件存檔時是身上的 1 件，下拉規則會再拿回同樣的物品。
 *   同名物品可以有很多筆（拆分、商店購買、卸除都會新增一筆），各自獨立；只有玩家拖曳合併（merge()）才合成一筆，自訂物品不能合併。
 *   textOnly 為 true 時玩家選擇只以文字管理物品：物品欄是空的，裝備下拉、商店與快速創角回到攜帶物品文字的做法。
 * - 目錄：重量與分類取自 equipment-notes.js 整理的 EQUIPMENT_SHOP_ITEMS，武器／護甲取自 equipment-data.js，
 *   套組內容物、容器與可持用的法器取自 equipment-data.js 的結構化清單；這裡不另存重量。彈藥以單發計數。
 * - 只整理資料、不碰畫面；變更時在 document 發出 `inventory:change`，存檔、裝備下拉與負重由 index.html 與 inventory-ui.js 處理。
 * - 新增物品不會自動裝備；角色卡上的裝備選擇由玩家自己做。
 */
(function (globalScope) {
  "use strict";

  const VERSION = 1;
  const LIMITS = Object.freeze({ items: 300, quantity: 9999, name: 40, desc: 200, weight: 9999, depth: 3 });
  const SOURCES = new Set(["initial", "equipped"]);
  const SLOTS = Object.freeze(["mainHand", "offHand", "armor", "shield"]);
  const UID_PATTERN = /^[A-Za-z0-9_-]{1,24}$/u;
  // 品名附註較長的聖徽在物品欄顯示短名，與攜帶物品舊寫法相同。
  const SHORT_NAMES = Object.freeze({ "聖物匣（手持）": "聖物匣", "徽章（附於布料／盾牌）": "徽章", "護身符（佩戴／手持）": "護身符" });
  // 快速創角、背景裝備與舊「購買物品」文字的寫法對應到目錄品名。
  const ALIASES = Object.freeze({
    "奧術法器（水晶）": { itemId: "水晶" }, "奧術法器（寶珠）": { itemId: "寶珠" }, "奧術法器（長棍）": { itemId: "法杖（長棍）" },
    "德魯伊法器（長棍）": { itemId: "木製法杖（長棍）" }, "德魯伊法器（槲寄生枝條）": { itemId: "槲寄生枝條" },
    "油瓶": { itemId: "油" }, "子彈": { itemId: "子彈，火器" }, "彈丸": { itemId: "彈丸，投石索" },
    // 舊品名（攜帶物品文字與舊存檔）：Robe 統一為祭袍、Sprig of Mistletoe 統一為槲寄生枝條。
    "長袍": { itemId: "祭袍" }, "祭祀長袍": { itemId: "祭袍" }, "槲寄生樹枝": { itemId: "槲寄生枝條" }, "狩獵陷阱": { itemId: "捕獸夾" }
  });
  // 改過名的目錄品名：舊存檔（autosave、JSON、分享）裡的 itemId 讀進來時換成新品名。
  const RENAMED_ITEM_IDS = Object.freeze({ "長袍": "祭袍", "槲寄生樹枝": "槲寄生枝條", "狩獵陷阱": "捕獸夾" });
  const BOOK_PATTERN = /^(?:書籍|書本|書)（[^（）]+）$/u;
  // 「多種」標題可當通稱品項（例如職業裝備只寫「聖徽」）；彈藥一律選具體品項。
  const GROUP_EXCLUDED = new Set(["彈藥"]);

  let entries = [];
  let textOnly = false;
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

  /** 目錄物品每件的使用次數（醫療包 10 次）；沒有使用次數的物品回傳 0。 */
  function getMaxUses(itemId) {
    const uses = itemId ? globalScope.EQUIPMENT_ITEM_ACTIONS?.[itemId]?.uses : 0;
    return Number.isInteger(uses) && uses > 1 ? uses : 0;
  }

  // 剩餘次數只記 1～上限減 1；全新（或不合法的值）不記。
  function cleanUses(itemId, value) {
    const max = getMaxUses(itemId);
    return max && Number.isInteger(value) && value >= 1 && value < max ? value : 0;
  }

  function clampQuantity(value) {
    const number = Math.floor(Number(value));
    if (!Number.isFinite(number) || number < 1) return 1;
    return Math.min(number, LIMITS.quantity);
  }

  function cleanText(value) {
    return typeof value === "string" ? value.replace(/\s+/gu, " ").trim().slice(0, LIMITS.name) : "";
  }

  // 描述保留換行，其餘空白收斂。
  function cleanDesc(value) {
    return typeof value === "string"
      ? value.replace(/\r\n?/gu, "\n").replace(/[^\S\n]+/gu, " ").replace(/ *\n */gu, "\n").replace(/\n{3,}/gu, "\n\n").trim().slice(0, LIMITS.desc)
      : "";
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
    const rawItemId = cleanText(raw.itemId);
    const itemId = RENAMED_ITEM_IDS[rawItemId] || rawItemId;
    const name = cleanText(raw.name);
    if (!itemId && !name) return null;
    const entry = { uid: typeof raw.uid === "string" && UID_PATTERN.test(raw.uid) ? raw.uid : "", quantity: clampQuantity(raw.quantity) };
    if (itemId) entry.itemId = itemId;
    // 舊版「祭祀長袍」是保留寫法的顯示名稱，品名統一後不再保留。
    if (name && name !== itemId && !(rawItemId === "長袍" && name === "祭祀長袍")) entry.name = name;
    if (!itemId) {
      const weight = Number(raw.weight);
      if (raw.weight !== null && raw.weight !== "" && raw.weight !== undefined && Number.isFinite(weight) && weight >= 0) {
        entry.weight = Math.min(Math.round(weight * 1000) / 1000, LIMITS.weight);
      }
      if (raw.container === true) entry.container = true;
      const desc = cleanDesc(raw.desc);
      if (desc) entry.desc = desc;
    }
    if (typeof raw.in === "string" && UID_PATTERN.test(raw.in)) entry.in = raw.in;
    if (SOURCES.has(raw.source)) entry.source = raw.source;
    const uses = cleanUses(itemId, raw.uses);
    if (uses) entry.uses = uses;
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

  // 存檔的寫法：slot 只在執行時使用。
  function savedEntry(entry) {
    const { slot, ...saved } = entry;
    return saved;
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
    if (alias) return { itemId: alias.itemId };
    if (BOOK_PATTERN.test(name)) return { itemId: "書籍", name };
    return { name };
  }

  // 以「、」分開最外層的品項，括號內的「、」不分（容器內容物）。
  function splitList(text) {
    const items = [];
    let depth = 0;
    let current = "";
    for (const char of String(text ?? "")) {
      if (char === "（" || char === "(") depth += 1;
      if ((char === "）" || char === ")") && depth > 0) depth -= 1;
      if (char === "、" && depth === 0) {
        items.push(current);
        current = "";
      } else current += char;
    }
    items.push(current);
    return items.map(item => item.trim()).filter(Boolean);
  }

  /**
   * 解析物品清單文字（formatText() 的寫法）：[{ text, children? }]。「背包（睡袋、油 ×2）」這類括號，前面是目錄容器時視為容器內容物；
   * customContainers 時（formatText() 產生的「物品欄：」行），目錄外的名稱括號內有多項也視為自訂容器。
   * 「箭矢(20)」「書籍（禱文）」等照單一品項處理。
   */
  function parseListText(text, { customContainers = false } = {}, depth = 0) {
    return splitList(text).map((item) => {
      const match = depth < LIMITS.depth ? item.match(/^(.*?)[（(](.*)[）)]$/u) : null;
      if (!match || /^\d+$/u.test(match[2].trim())) return { text: item };
      const base = match[1].trim();
      const resolved = resolveName(base);
      const isContainer = getCatalogItem(resolved.itemId)?.container
        || (customContainers && !resolved.itemId && splitList(match[2]).length > 1);
      return isContainer ? { text: base, children: parseListText(match[2], { customContainers }, depth + 1) } : { text: item };
    });
  }

  // 可以合成一筆：同一個目錄品項且顯示名稱相同；自訂物品、容器與裝備中的物品不合併。
  function canStack(entry, other) {
    return Boolean(entry.itemId) && entry.itemId === other.itemId
      && (entry.name || "") === (other.name || "")
      && !entry.slot && !other.slot
      && !isContainerEntry(entry) && !isContainerEntry(other);
  }

  function sameStack(entry, request) {
    return canStack(entry, request) && (entry.in || "") === (request.in || "");
  }

  function largestOf(list) {
    return list.reduce((best, entry) => (!best || entry.quantity > best.quantity ? entry : best), null);
  }

  // 套組拆成第一項容器＋其餘內容物；容器每件各自一筆（內容物才分得清楚），其他品項同名同處就合併數量。
  function expandRequests(requests, into, source) {
    const expanded = [];
    requests.forEach((request) => {
      const resolved = request.text ? parseItemText(request.text) : { itemId: cleanText(request.itemId), name: cleanText(request.name) };
      // 文字清單的容器（parseListText 的 children）：目錄容器或標成容器的自訂物品，內容物放進去。
      if (request.text && Array.isArray(request.children) && request.children.length) {
        const base = { itemId: resolved.itemId || "", name: resolved.name && resolved.name !== resolved.itemId ? resolved.name : "" };
        if (!base.itemId && !base.name) return;
        const container = base.itemId ? (getCatalogItem(base.itemId)?.container ? {} : null) : { container: true };
        if (container) {
          expanded.push({ ...base, ...container, quantity: 1, into, source, contents: expandRequests(request.children, "", source) });
          return;
        }
      }
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
        ...(request.container === true ? { container: true } : {}),
        ...(cleanDesc(request.desc) ? { desc: cleanDesc(request.desc) } : {})
      };
      expanded.push({ ...base, ...custom, quantity, into, source });
    });
    return expanded;
  }

  function placeRequest(next, request, taken, newStack = false) {
    if (!(request.quantity > 0)) return [];
    const entry = { uid: "", quantity: clampQuantity(request.quantity) };
    if (request.itemId) entry.itemId = request.itemId;
    if (request.name) entry.name = request.name;
    if (Number.isFinite(request.weight)) entry.weight = request.weight;
    if (request.container) entry.container = true;
    if (request.desc) entry.desc = request.desc;
    if (request.into) entry.in = request.into;
    if (request.source) entry.source = request.source;
    const containerUnits = isContainerEntry(entry) ? entry.quantity : 0;
    if (!containerUnits) {
      const stack = newStack ? null : largestOf(next.filter(item => sameStack(item, entry)));
      if (stack) {
        stack.quantity = Math.min(stack.quantity + entry.quantity, LIMITS.quantity);
        // 併入玩家原有的物品時不標成「因裝備而補上」，整理成標籤才不會多抵。
        if (entry.source && !stack.source && entry.source !== "equipped") stack.source = entry.source;
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
   * options.into 是放入的容器 uid；options.source "initial" 標記初始裝備；options.dryRun 只檢查是否放得下；
   * options.absorbEquipped 時，同名的「因裝備而補上」物品先抵掉數量（整理成標籤用，避免已補上的裝備再加一次）；
   * options.newStack 時一律新增一筆、不併入同名物品（商店購買）。其他情況併入同一處數量最多的同名物品。
   * 超過上限時不加入任何物品並回傳 false。
   */
  function add(requests, options = {}) {
    const list = Array.isArray(requests) ? requests : [requests];
    const into = options.into && isContainerEntry(entries.find(entry => entry.uid === options.into)) ? options.into : "";
    const source = SOURCES.has(options.source) ? options.source : "";
    const next = entries.map(copyEntry);
    const taken = new Set(next.map(entry => entry.uid));
    const expanded = expandRequests(list, into, source);
    if (options.absorbEquipped) absorbEquipped(next, expanded);
    expanded.filter(request => request.quantity > 0).forEach(request => placeRequest(next, request, taken, options.newStack === true));
    if (next.length > LIMITS.items) return false;
    if (options.dryRun) return true;
    if (next.length === entries.length && next.every((entry, index) => entry.quantity === entries[index].quantity)) return true;
    return commit(next, "add");
  }

  function absorbEquipped(next, requests, remaining = new Map(next.filter(entry => entry.source === "equipped").map(entry => [entry, entry.quantity]))) {
    // 裝備中的物品在文字裡排在最外層，先抵最外層，容器裡的同名物品才留在容器裡。
    requests.forEach((request) => {
      if (!request.itemId || request.name || request.contents) return;
      remaining.forEach((left, entry) => {
        if (!request.quantity || !left || entry.itemId !== request.itemId) return;
        const taken = Math.min(left, request.quantity);
        request.quantity -= taken;
        remaining.set(entry, left - taken);
        if (left - taken === 0) {
          if (request.source) entry.source = request.source;
          else delete entry.source;
        }
      });
    });
    requests.forEach((request) => {
      if (request.contents) absorbEquipped(next, request.contents, remaining);
    });
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

  /** 更新一筆物品：{ quantity?, in?, name?, weight?, container? }；name／weight／container 只套用於自訂物品；裝備中的物品固定 1 件、在最外層。不會合併同名物品。 */
  function update(uid, changes = {}) {
    const next = entries.map(copyEntry);
    const entry = next.find(item => item.uid === uid);
    if (!entry) return false;
    if (changes.quantity !== undefined && !entry.slot) entry.quantity = clampQuantity(changes.quantity);
    if (changes.in !== undefined && !entry.slot) {
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
    if (!entry.itemId && changes.desc !== undefined) {
      const desc = cleanDesc(changes.desc);
      if (desc) entry.desc = desc;
      else delete entry.desc;
    }
    if (!entry.itemId && changes.container !== undefined) {
      if (changes.container === true) entry.container = true;
      else {
        delete entry.container;
        next.forEach((item) => { if (item.in === uid) item.in = entry.in || ""; });
      }
    }
    next.forEach((item) => { if (!item.in) delete item.in; });
    return commit(next, "update");
  }

  /**
   * 調整物品的排列順序與所在處（物品欄介面的整理模式）：into 是容器 uid（空字串為身上），before 是同一處要排在它前面的物品 uid（空為最後）。
   * 放不進的容器或裝備中的物品回傳 false 且不變動。不會合併同名物品，要合併用 merge()。
   */
  function move(uid, { into = "", before = "" } = {}) {
    const index = entries.findIndex(entry => entry.uid === uid);
    if (index < 0 || entries[index].slot) return false;
    if (into && !getContainerTargets(uid).some(item => item.uid === into)) return false;
    const next = entries.map(copyEntry);
    const [entry] = next.splice(index, 1);
    if (into) entry.in = into;
    else delete entry.in;
    const target = before && before !== uid ? next.findIndex(item => item.uid === before && (item.in || "") === into) : -1;
    let position = target;
    if (position < 0) {
      position = next.length;
      next.forEach((item, itemIndex) => { if ((item.in || "") === into) position = itemIndex + 1; });
    }
    next.splice(position, 0, entry);
    if (next.every((item, itemIndex) => item.uid === entries[itemIndex].uid) && (entries[index].in || "") === into) return true;
    return commit(next, "move");
  }

  /** 可以合併 uid 的物品（同名、同寫法的目錄品項，不限位置）。 */
  function getMergeTargets(uid) {
    const entry = entries.find(item => item.uid === uid);
    return entry ? entries.filter(item => item.uid !== uid && canStack(entry, item)).map(copyEntry) : [];
  }

  // 一筆的總使用次數：其餘件數全新，目前這件剩 uses 次。
  function totalCharges(entry, max) {
    return (entry.quantity - 1) * max + (entry.uses || max);
  }

  /**
   * 把 uid 合併進 targetUid（位置以 targetUid 為準）。有使用次數的物品總次數不變，重新裝成全新的與一件用過的：
   * x2 7/10（17 次）＋ x3 6/10（26 次）＝ 43 次 ＝ x5 3/10。不能合併或超過數量上限時回傳 false 且不變動。
   */
  function merge(uid, targetUid) {
    const next = entries.map(copyEntry);
    const entry = next.find(item => item.uid === uid);
    const stack = next.find(item => item.uid === targetUid);
    if (!entry || !stack || entry === stack || !canStack(entry, stack)) return false;
    const max = getMaxUses(stack.itemId);
    const charges = max ? totalCharges(stack, max) + totalCharges(entry, max) : 0;
    const quantity = max ? Math.ceil(charges / max) : stack.quantity + entry.quantity;
    if (quantity > LIMITS.quantity) return false;
    stack.quantity = quantity;
    if (max && charges % max) stack.uses = charges % max;
    else delete stack.uses;
    if (entry.source && !stack.source && entry.source !== "equipped") stack.source = entry.source;
    return commit(next.filter(item => item !== entry), "merge");
  }

  /** 可以拆分：至少 2 件，容器與裝備中的物品不拆。 */
  function canSplit(entry) {
    return Boolean(entry) && entry.quantity >= 2 && !entry.slot && !isContainerEntry(entry);
  }

  /**
   * 拆成兩筆：原本這筆留 keep 件（用過的次數留在這筆），其餘成為緊接在後的新一筆（全新）。
   * 不能拆或物品欄已滿時回傳 false 且不變動；成功時回傳新一筆的 uid。
   */
  function split(uid, keep) {
    const index = entries.findIndex(item => item.uid === uid);
    if (index < 0 || !canSplit(entries[index]) || entries.length >= LIMITS.items) return false;
    const kept = Number(keep);
    if (!Number.isInteger(kept) || kept < 1 || kept >= entries[index].quantity) return false;
    const next = entries.map(copyEntry);
    const entry = next[index];
    const part = { ...entry, quantity: entry.quantity - kept, uid: nextUid(new Set(next.map(item => item.uid))) };
    delete part.uses;
    entry.quantity = kept;
    next.splice(index + 1, 0, part);
    commit(next, "split");
    return part.uid;
  }

  /** 物品剩餘次數：{ left, max }（left 是目前這件的剩餘次數）；沒有使用次數的物品回傳 null。 */
  function getUses(entry) {
    const max = getMaxUses(entry?.itemId);
    return max ? { left: entry.uses || max, max } : null;
  }

  /**
   * 用掉一筆物品：預設數量減 amount；charge 時改用掉目前這件的 1 次使用次數，用完才數量減 1（下一件從全新開始）。
   * 數量減到 0 時移除這一筆。回傳 { removed, quantity, uses, emptied }：uses 是目前這件的剩餘次數，emptied 表示 charge 用完了一件；
   * 找不到物品或沒有使用次數卻要 charge 時回傳 null。
   */
  function consume(uid, { amount = 1, charge = false } = {}) {
    const index = entries.findIndex(entry => entry.uid === uid);
    if (index < 0) return null;
    const next = entries.map(copyEntry);
    const entry = next[index];
    let used = Math.max(1, Math.floor(Number(amount)) || 1);
    if (charge) {
      const uses = getUses(entry);
      if (!uses) return null;
      if (uses.left > 1) {
        entry.uses = uses.left - 1;
        commit(next, "consume");
        return { removed: false, quantity: entry.quantity, uses: entry.uses, emptied: false };
      }
      delete entry.uses;
      used = 1;
    }
    if (entry.quantity <= used) {
      remove(uid);
      return { removed: true, quantity: 0, uses: 0, emptied: charge };
    }
    entry.quantity -= used;
    commit(next, "consume");
    return { removed: false, quantity: entry.quantity, uses: getUses(entry)?.left || 0, emptied: charge };
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
    textOnly = state?.textOnly === true;
    entries = textOnly ? [] : normalizeState(state);
    emit("restore");
  }

  function clear() {
    if (!entries.length) return;
    commit([], "clear");
  }

  function getState() {
    return textOnly ? { version: VERSION, textOnly: true, items: [] } : { version: VERSION, items: entries.map(savedEntry) };
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

  /**
   * 已裝備的武器、護甲與盾牌不在物品欄（或件數不夠，例如主副手同名要 2 件）時，補上缺的數量並標記 "equipped"。
   * reset 時先清空（舊資料沒有物品欄）；只以文字管理物品時不動。
   */
  function ensureEquipped({ mainHand = "", offHand = "", armor = "", shield = false } = {}, { reset = false } = {}) {
    if (textOnly) return;
    if (reset) entries = [];
    const kinds = staticKinds();
    const needed = new Map();
    const bump = (name) => { if (name) needed.set(name, (needed.get(name) || 0) + 1); };
    [mainHand, offHand].forEach((name) => {
      if (kinds.weapons.has(name) || kinds.shields.has(name)) bump(name);
    });
    if (kinds.armors.has(armor)) bump(armor);
    if (shield && !needed.has("盾牌") && kinds.shields.has("盾牌")) bump("盾牌");
    const counts = getEquippableCounts();
    const owned = name => kinds.shields.has(name) ? counts.shields : kinds.armors.has(name) ? counts.armors.get(name) || 0 : counts.weapons.get(name) || 0;
    const requests = [...needed].map(([itemId, quantity]) => ({ itemId, quantity: quantity - owned(itemId) })).filter(request => request.quantity > 0);
    if (!requests.length || !add(requests, { source: "equipped" })) emit("restore");
  }

  function matchesEquipment(entry, name, kinds) {
    if (!entry.itemId || !name) return false;
    if (kinds.shields.has(name)) return kinds.shields.has(entry.itemId);
    if (kinds.armors.has(name)) return entry.itemId === name;
    return kindOf(entry.itemId, kinds) === "weapon" ? entry.itemId === name : kinds.wieldedAs[entry.itemId] === name;
  }

  // 容器依畫面順序：最外層的容器由前到後，內層緊接在它的容器後面。
  function containerOrder(list, kinds, parent = "") {
    return list.filter(entry => (entry.in || "") === parent && isContainerEntry(entry, kinds))
      .flatMap(entry => [entry.uid, ...containerOrder(list, kinds, entry.uid)]);
  }

  // 同一處拿數量最少的標籤（一樣少時拿排在前面的）；反覆換裝時會拿回剛卸下的 ×1，標籤才不會越來越多。
  function pickFrom(list) {
    return list.reduce((best, entry) => (!best || entry.quantity < best.quantity ? entry : best), null);
  }

  // 裝備時拿哪一筆：玩家點的那筆、身上的，身上沒有才找容器（第一個裝有這件物品的容器）。
  function pickEquipmentSource(list, name, kinds, prefer) {
    const candidates = list.filter(entry => !entry.slot && !isContainerEntry(entry, kinds) && matchesEquipment(entry, name, kinds));
    const preferred = candidates.find(entry => entry.uid === prefer);
    if (preferred) return preferred;
    const carried = candidates.filter(entry => !entry.in);
    if (carried.length) return pickFrom(carried);
    const container = containerOrder(list, kinds).find(uid => candidates.some(entry => entry.in === uid));
    return container ? pickFrom(candidates.filter(entry => entry.in === container)) : null;
  }

  /**
   * 讓物品的裝備位置符合角色卡的選擇（{ mainHand, offHand, armor, shield }；shield 是副手當主手時的盾牌勾選）。
   * 選擇變了的位置先放回身上（成為獨立的一筆），新的選擇再從物品欄拿 1 件（options.prefer 是玩家點的那筆 uid）。
   * 物品欄沒有這件物品時留空；物品欄已滿、又要從多件的標籤多開一筆時放不下，回傳這些位置，其餘位置照常更新。
   */
  function syncEquipped({ mainHand = "", offHand = "", armor = "", shield = false } = {}, { prefer = "" } = {}) {
    if (textOnly) return [];
    const kinds = staticKinds();
    const wanted = { mainHand, offHand, armor, shield: shield ? [...kinds.shields][0] || "" : "" };
    const next = entries.map(copyEntry);
    let changed = false;
    next.forEach((entry) => {
      if (entry.slot && !matchesEquipment(entry, wanted[entry.slot], kinds)) {
        delete entry.slot;
        changed = true;
      }
    });
    const full = [];
    const taken = new Set(next.map(entry => entry.uid));
    SLOTS.forEach((slot) => {
      const name = wanted[slot];
      if (!name || next.some(entry => entry.slot === slot)) return;
      const source = pickEquipmentSource(next, name, kinds, prefer);
      if (!source) return;
      if (source.quantity === 1) {
        source.slot = slot;
        delete source.in;
      } else if (next.length >= LIMITS.items) {
        full.push(slot);
        return;
      } else {
        source.quantity -= 1;
        const unit = { ...source, quantity: 1, slot, uid: nextUid(taken) };
        delete unit.in;
        delete unit.uses;
        next.splice(next.indexOf(source) + 1, 0, unit);
      }
      changed = true;
    });
    if (changed) commit(next, "equip");
    return full;
  }

  /** 切換「只以文字管理物品」。開啟時回傳原物品欄的文字寫法並清空物品欄；關閉時物品欄從空的開始。 */
  function setTextOnly(on) {
    const next = on === true;
    if (next === textOnly) return "";
    const text = next ? formatText() : "";
    textOnly = next;
    entries = [];
    emit("mode");
    return text;
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
    move,
    merge,
    split,
    canSplit,
    getMergeTargets,
    syncEquipped,
    remove,
    consume,
    restore,
    clear,
    getState,
    getUses,
    ensureEquipped,
    setTextOnly,
    isTextOnly: () => textOnly,
    getEquippableCounts,
    getContainerTargets,
    getWeight,
    getUnitWeight,
    getLabel,
    formatText,
    hasInitialEquipment,
    parseItemText,
    parseListText,
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

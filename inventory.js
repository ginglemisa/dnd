/**
 * 物品欄資料（傳統 defer script，無額外 runtime dependency）。
 *
 * - 角色資料頂層 `__inventory`：{ version: 1, textOnly?, items: [{ uid, itemId?, name?, quantity, in?, weight?, container?, desc?, source?, uses?, magic?, charges?, spellId?, ammo? }] }。
 *   itemId 是裝備說明的品名（與 mainHand／商店相同的中文名稱）；name 是顯示名稱，自訂物品必填，目錄品項只在寫法不同時保留
 *   （例如「書籍（禱文）」）。weight（每件磅數）、container 與 desc（描述）只用於自訂物品；in 是所在容器的 uid；
 *   source "initial" 標記快速創角匯入的初始裝備，"equipped" 標記因主手／副手／護甲已裝備而補上的物品（整理成標籤時先抵掉，不重複）。
 *   uses 是有使用次數的目錄物品（EQUIPMENT_ITEM_ACTIONS 的 uses，例如醫療包）目前這件的剩餘次數；沒有這個欄位表示全新，同一筆的其餘件數都是全新的。
 * - magic 是魔法物品：{ id, <選項 id>: 值 }（MagicItemCatalog 的 selection，基本款就是 itemId，不重複存 base）。沒有基本款的魔法物品沒有 itemId 也沒有 name；
 *   顯示名稱由目錄算、說明不進存檔，目錄找不到 id 時保留這一筆並顯示「未知魔法物品」。同 id、同選項、同 itemId 才能合併。
 *   例外：一般的治療藥水與法術卷軸沿用既有寫法（{ itemId: "治療藥水" }、{ itemId: "法術卷軸", name: "X法術卷軸" }），沒有 magic。
 *   spellId 只用於法術卷軸（{ itemId: "法術卷軸", name: "X法術卷軸", spellId }），記載的法術；舊資料沒有這個欄位，讀取時依完整名稱對回法術（getScrollSpellId()）。
 * - 執行時的 slot 是這件物品正裝備在哪個位置（mainHand、offHand、armor、shield）：固定 1 件、在最外層，由 syncEquipped() 依角色卡的裝備選擇維護。
 *   裝備選擇已經存在角色欄位，slot 不寫進存檔（getState() 拿掉、restore() 不讀），載入後重新對應：裝備中那件存檔時是身上的 1 件，下拉規則會再拿回同樣的物品。
 * - 魔法武器、護甲與盾牌裝備時，角色卡的裝備欄位存魔法款自己的名稱（MagicItemCatalog.getDisplayName()，例如「長劍+2」），載入時依名稱到物品欄拿同名的那一件，沒有就補上一筆（source "equipped"）。
 *   普通款只配普通款，魔法款只配同名魔法款；名稱彼此唯一由建置檢查。
 * - attuned 是魔法物品的同調狀態（只有 magic 的筆、固定 1 件才有），由玩家以 setAttuned() 開關：同時最多 LIMITS.attunement 件，同一種魔法物品（同 magic.id）不能同調第二件。同調中的物品不能合併或拆分，移除後同調自然消失。
 * - worn 是可以穿戴的魔法物品（MagicItemCatalog.isWearable：戒指、斗篷等）正穿在身上（只有 magic 的筆、固定 1 件、在最外層才有），由玩家以 setWorn() 開關，件數不設上限；
 *   開始同調時自動穿上，卸下時保留同調。穿戴中的物品不能合併、拆分或放進容器，也不會被拿去放進主手或副手。普通物品的存檔格式不變。
 * - ammo 是目前裝備的彈藥（普通或魔法彈藥都可以；整個物品欄最多一筆），由玩家以 setAmmo() 開關。和穿戴不同，裝備中的彈藥可以留在容器（箭袋）裡、
 *   改數量、拆分（拆出的那筆不帶）與合併（被併掉的那筆有 ammo 時，合併後那筆繼承）。彈藥是商店「彈藥」群組的品項，種類是品名「，」前的字
 *   （箭矢、弩矢、子彈、彈丸、針），對到武器屬性「彈藥 (射程…；箭矢)」的最後一詞（getWeaponAmmunition()）。
 * - 沒有基本款、內容檔寫了 container 的魔法物品（次元袋、吞噬袋等）是容器，存檔格式不變（舊存檔的這些袋子以前不是容器，一筆多件時載入拆成一件一筆）。
 *   container.extradimensional 的容器裡（含更深層）的物品不算重量，容器本身照算；兩個異次元容器互放只由 getExtradimensionalNesting() 回報給介面提示，不刪除。
 *   container.devour 的計時與吞噬在 inventory-ui.js，這裡只提供 splitCustomContents()、formatItem()、formatContents() 與 emptyContainer()。
 * - 手持類的非武器魔法物品（魔杖等，MagicItemCatalog.isHandHeld）沒有基本款，也可以放進主手或副手：裝備欄位存它的顯示名稱，同樣以 slot 標記。
 * - charges 是魔法物品次數池（MagicItemCatalog.getPools：充能、每日一次、冷卻、珠子等）目前這件的剩餘次數 { 池 id: 0～99 }，只有 magic 的筆才有；
 *   沒寫的池表示滿的（取得時都是滿的），滿了就拿掉。一筆多件時其餘件數都是滿的，拆分、穿上或裝備拆出的那件也是滿的。有次數池的物品不合併。
 *   getCharges() 讀、setCharges() 寫，recoverRestCharges() 在跑團休息完成時恢復短休／長休的池。
 * - magic.form 是可切換形態的物品（王者權杖）目前的形態（MagicItemCatalog.getForm），原本形態不寫；裝備欄位的值不隨形態改變，傷害、屬性、精通看 getMagicFormBase()。
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
  const LIMITS = Object.freeze({ items: 300, quantity: 9999, name: 40, desc: 200, weight: 9999, depth: 3, magicValue: 64, magicOptions: 12, attunement: 3, charges: 99 });
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
  const SPELL_SCROLL_ID = "法術卷軸";
  const SPELL_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/u;
  // 「多種」標題可當通稱品項（例如職業裝備只寫「聖徽」）；彈藥一律選具體品項。
  const GROUP_EXCLUDED = new Set(["彈藥"]);
  const MAGIC_OPTION_KEY = /^[a-z][a-zA-Z]*$/u;
  // 次數池 id（YAML 的 pools[].id）：物品欄存檔 charges 的鍵。
  const POOL_ID = /^[a-z][a-z0-9-]{0,31}$/u;
  const UNKNOWN_MAGIC_LABEL = "未知魔法物品";

  let entries = [];
  let textOnly = false;
  let catalogCache = null;
  let uidSeed = Date.now() % 1679616;
  // 防禦者轉到 AC 的加值（uid → 點數）：只留在記憶體，不進存檔，重新整理或載入角色回到 0。
  const bonusTransfers = new Map();

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

  // 商店「彈藥」群組的品項（equipment-notes.js 的 SHOP_GROUP_CATEGORIES）；彈藥種類是品名「，」前的字，例如「子彈，火器」是子彈。
  const AMMUNITION_GROUP = "彈藥";

  /** 彈藥的種類（箭矢、弩矢、子彈、彈丸、針）；不是彈藥時回傳空字串。魔法彈藥看基本款（itemId）。 */
  function getAmmunitionType(itemId) {
    return getCatalogItem(itemId)?.group === AMMUNITION_GROUP ? String(itemId).split("，")[0] : "";
  }

  function isAmmunition(entry) {
    return Boolean(entry) && Boolean(getAmmunitionType(entry.itemId));
  }

  /** 武器使用的彈藥種類：武器屬性「彈藥 (射程 80/320；箭矢)」的最後一詞；不用彈藥或找不到武器時回傳空字串。 */
  function getWeaponAmmunition(weaponName) {
    const weapon = ["weapons_simple_melee", "weapons_simple_ranged", "weapons_martial_melee", "weapons_martial_ranged"]
      .flatMap(getList).find(item => item.名稱 === weaponName);
    if (!weapon) return "";
    for (const index of [1, 2, 3, 4]) {
      const match = String(weapon[`屬性${index}`] ?? "").trim().match(/^彈藥\s*[（(][^）)]*[；;]\s*([^）)；;]+?)\s*[）)]$/u);
      if (match) return match[1];
    }
    return "";
  }

  /** 使用這種彈藥的武器品名（依 equipment-data.js 的順序）。 */
  function getAmmunitionWeapons(itemId) {
    const type = getAmmunitionType(itemId);
    if (!type) return [];
    return ["weapons_simple_ranged", "weapons_martial_ranged", "weapons_simple_melee", "weapons_martial_melee"]
      .flatMap(getList).map(item => item.名稱).filter(name => getWeaponAmmunition(name) === type);
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

  function cleanSpellId(itemId, value) {
    return itemId === SPELL_SCROLL_ID && typeof value === "string" && SPELL_ID_PATTERN.test(value) ? value : "";
  }

  // 數量至少 min（一般物品 1；彈藥 0，見 minQuantity）；不是數字時為 1。
  function clampQuantity(value, min = 1) {
    const number = Math.floor(Number(value));
    if (!Number.isFinite(number)) return 1;
    return Math.min(Math.max(number, min), LIMITS.quantity);
  }

  // 彈藥是物品欄唯一可以 ×0 的物品：用完後保留這一筆（裝備中的仍是裝備中，只是不能再射擊），由玩家自己刪除。
  function minQuantity(itemId) {
    return getAmmunitionType(itemId) ? 0 : 1;
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

  // 魔法物品的 id 加選項，鍵依字母排序（合併時直接比對）；基本款就是 itemId，不重複存，不合格式的選項略過。
  function cleanMagic(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const id = typeof raw.id === "string" ? raw.id.trim().slice(0, LIMITS.magicValue) : "";
    if (!id) return null;
    const magic = { id };
    Object.keys(raw).filter(key => key !== "id" && key !== "base" && MAGIC_OPTION_KEY.test(key)).sort().slice(0, LIMITS.magicOptions).forEach((key) => {
      const value = raw[key];
      if ((typeof value === "number" && Number.isFinite(value)) || (typeof value === "string" && value && value.length <= LIMITS.magicValue)) magic[key] = value;
    });
    return magic;
  }

  function normalizeEntry(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const rawItemId = cleanText(raw.itemId);
    const itemId = RENAMED_ITEM_IDS[rawItemId] || rawItemId;
    const magic = cleanMagic(raw.magic);
    const name = magic ? "" : cleanText(raw.name);
    if (!itemId && !name && !magic) return null;
    const entry = { uid: typeof raw.uid === "string" && UID_PATTERN.test(raw.uid) ? raw.uid : "", quantity: clampQuantity(raw.quantity, minQuantity(itemId)) };
    if (itemId) entry.itemId = itemId;
    // 舊版「祭祀長袍」是保留寫法的顯示名稱，品名統一後不再保留。
    if (name && name !== itemId && !(rawItemId === "長袍" && name === "祭祀長袍")) entry.name = name;
    if (magic) entry.magic = magic;
    if (!itemId && !magic) {
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
    // 同調是單一件物品的狀態，只有魔法物品才有（repairMagicState 再檢查彼此衝突）。
    if (magic && entry.quantity === 1 && raw.attuned === true) entry.attuned = true;
    // 穿戴中也是單一件物品的狀態，在身上（最外層）；不能穿戴的物品由 repairMagicState 拿掉。
    if (magic && entry.quantity === 1 && raw.worn === true) {
      entry.worn = true;
      delete entry.in;
    }
    const spellId = cleanSpellId(itemId, raw.spellId);
    if (spellId) entry.spellId = spellId;
    // 次數池的剩餘次數只有魔法物品才有；池 id 與上限由 repairMagicState 依目錄再檢查。
    const charges = magic ? cleanCharges(raw.charges) : null;
    if (charges) entry.charges = charges;
    // 裝備中的彈藥：是不是彈藥、是否只有一筆由 repairAmmo 檢查。
    if (raw.ammo === true) entry.ammo = true;
    return entry;
  }

  // 裝備中的彈藥只能是彈藥，整個物品欄只留第一筆。
  function repairAmmo(list) {
    let found = false;
    list.forEach((entry) => {
      if (!entry.ammo) return;
      if (found || !isAmmunition(entry)) delete entry.ammo;
      else found = true;
    });
    return list;
  }

  // 剩餘次數：{ 池 id: 0～99 的整數 }；格式不對的鍵略過，空的回傳 null。
  function cleanCharges(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const charges = {};
    Object.keys(raw).filter(key => POOL_ID.test(key)).sort().slice(0, LIMITS.magicOptions).forEach((key) => {
      const value = raw[key];
      if (Number.isInteger(value) && value >= 0 && value <= LIMITS.charges) charges[key] = value;
    });
    return Object.keys(charges).length ? charges : null;
  }

  // 依目錄的池整理剩餘次數：不存在的池拿掉、超過上限的夾到上限、滿的不記（沒寫表示滿的）。目錄找不到物品時原樣保留。
  function repairCharges(entry, rule) {
    if (!entry.charges || !rule) return;
    const pools = new Map(globalScope.MagicItemCatalog.getPools(rule.id).map(pool => [pool.id, pool]));
    Object.keys(entry.charges).forEach((key) => {
      const pool = pools.get(key);
      if (!pool || entry.charges[key] >= pool.max) delete entry.charges[key];
    });
    if (!Object.keys(entry.charges).length) delete entry.charges;
  }

  // 同調要是需要同調的物品、同一種只算第一件、總數不超過上限；穿戴要是可以穿戴的物品（目錄找不到時保留）。
  function repairMagicState(list) {
    const attuned = new Set();
    list.forEach((entry) => {
      const rule = magicRule(entry);
      repairCharges(entry, rule);
      if (entry.worn && rule && !globalScope.MagicItemCatalog.isWearable(rule.id)) delete entry.worn;
      if (!entry.attuned) return;
      if ((rule && !rule.attunement) || attuned.has(entry.magic.id) || attuned.size >= LIMITS.attunement) delete entry.attuned;
      else attuned.add(entry.magic.id);
    });
    return list;
  }

  // 目錄容器看品名，沒有基本款的魔法物品看內容檔的 container 詞（次元袋等），自訂物品看 container 欄位。
  function isContainerEntry(entry, kinds = staticKinds()) {
    if (!entry) return false;
    if (entry.itemId) return kinds.containers.has(entry.itemId);
    if (entry.magic) return Boolean(magicContainer(entry));
    return entry.container === true;
  }

  /** 魔法容器的內容檔設定 { extradimensional?, devour? }；不是魔法容器（含有基本款的魔法物品）時回傳 null。 */
  function magicContainer(entry) {
    if (!entry?.magic || entry.itemId) return null;
    const container = magicRule(entry)?.container;
    return container && typeof container === "object" ? container : null;
  }

  // 在異次元容器裡（直接或隔著其他容器）：這件物品不算重量。
  function insideExtradimensional(entry, byUid) {
    let parent = entry.in ? byUid.get(entry.in) : null;
    let depth = 0;
    while (parent && depth <= LIMITS.depth) {
      if (magicContainer(parent)?.extradimensional) return true;
      depth += 1;
      parent = parent.in ? byUid.get(parent.in) : null;
    }
    return false;
  }

  // 舊存檔裡的魔法容器（以前不是容器）可能是一筆多件；容器一件一筆、不能拆分，所以載入時拆開。
  // 物品欄筆數已到上限時，拆不下的件數留在原本那一筆。
  function splitMagicContainers(list, taken) {
    let room = LIMITS.items - list.length;
    return list.flatMap((entry) => {
      if (entry.quantity < 2 || room < 1 || !magicContainer(entry)) return [entry];
      const extra = Math.min(entry.quantity - 1, room);
      room -= extra;
      const copies = Array.from({ length: extra }, () => ({ ...copyEntry(entry), quantity: 1, uid: nextUid(taken) }));
      copies.forEach(copy => delete copy.ammo);
      return [{ ...entry, quantity: entry.quantity - extra }, ...copies];
    });
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
    return repairAmmo(repairMagicState(repairContainment(splitMagicContainers(normalized, taken))));
  }

  function copyEntry(entry) {
    if (!entry.magic) return { ...entry };
    const copy = { ...entry, magic: { ...entry.magic } };
    if (entry.charges) copy.charges = { ...entry.charges };
    return copy;
  }

  // 存檔的寫法：slot 只在執行時使用，載入後由裝備欄位的名稱重新對應。
  function savedEntry(entry) {
    const { slot, ...saved } = copyEntry(entry);
    return saved;
  }

  // 自訂物品：既不是目錄品項也不是魔法物品，名稱、重量與描述由玩家決定。
  function isCustomEntry(entry) {
    return Boolean(entry) && !entry.itemId && !entry.magic;
  }

  /** 魔法物品的 MagicItemCatalog selection：{ base?, <選項 id>: 值 }；不是魔法物品時回傳 null。 */
  function getMagicSelection(entry) {
    if (!entry?.magic) return null;
    const { id, ...options } = entry.magic;
    return entry.itemId ? { ...options, base: entry.itemId } : options;
  }

  function magicRule(entry) {
    return entry?.magic ? globalScope.MagicItemCatalog?.get(entry.magic.id) || null : null;
  }

  function magicKey(entry) {
    return entry.magic ? JSON.stringify(entry.magic) : "";
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
    if (entry.magic) return magicRule(entry) ? globalScope.MagicItemCatalog.getDisplayName(entry.magic.id, getMagicSelection(entry)) : UNKNOWN_MAGIC_LABEL;
    return entry.name || getCatalogItem(entry.itemId)?.label || SHORT_NAMES[entry.itemId] || entry.itemId || "";
  }

  function getUnitWeight(entry) {
    if (!entry) return null;
    // 高等以上的治療藥水譯文沒寫重量，與一般商店的同一種藥水相同。
    const rule = magicRule(entry);
    const magicWeight = rule?.weight ?? getCatalogItem(rule?.equipmentName)?.weight ?? null;
    if (entry.itemId) return getCatalogItem(entry.itemId)?.weight ?? magicWeight;
    if (entry.magic) return magicWeight;
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
    if (name.length > SPELL_SCROLL_ID.length && name.endsWith(SPELL_SCROLL_ID) && catalog().has(SPELL_SCROLL_ID)) return { itemId: SPELL_SCROLL_ID, name };
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

  // 可以合成一筆：同一個目錄品項或魔法物品（同選項）且顯示名稱相同；自訂物品、容器與裝備中的物品不合併。
  function canStack(entry, other) {
    return !isCustomEntry(entry) && !isCustomEntry(other) && (entry.itemId || "") === (other.itemId || "")
      && magicKey(entry) === magicKey(other)
      && (entry.name || "") === (other.name || "")
      && !entry.slot && !other.slot
      && !entry.attuned && !other.attuned
      && !entry.worn && !other.worn
      && !hasPools(entry) && !hasPools(other)
      && !isContainerEntry(entry) && !isContainerEntry(other);
  }

  // 有次數池的魔法物品（魔杖、每日一次的能力等）各自追蹤次數，不合併成一筆。
  function hasPools(entry) {
    const rule = magicRule(entry);
    return Boolean(rule) && globalScope.MagicItemCatalog.getPools(rule.id).length > 0;
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
      // 魔法物品不走名稱解析與套組拆分；itemId 是基本款。
      const magic = cleanMagic(request.magic);
      if (magic) {
        const itemId = cleanText(request.itemId);
        expanded.push({ ...(itemId ? { itemId } : {}), magic, quantity: clampQuantity(request.quantity ?? 1), into, source });
        return;
      }
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
      const spellId = cleanSpellId(base.itemId, request.spellId);
      if (spellId) base.spellId = spellId;
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
    if (request.magic) entry.magic = request.magic;
    if (Number.isFinite(request.weight)) entry.weight = request.weight;
    if (request.container) entry.container = true;
    if (request.desc) entry.desc = request.desc;
    if (request.into) entry.in = request.into;
    if (request.source) entry.source = request.source;
    if (request.spellId) entry.spellId = request.spellId;
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
   * 加入物品。requests：[{ itemId?, name?, text?, quantity?, weight?, container?, magic? }]；magic 見檔頭；text 可用「名稱 ×n」「箭矢(20)」寫法。
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
      if (!request.itemId || request.name || request.magic || request.contents) return;
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

  /** 更新一筆物品：{ quantity?, in?, name?, weight?, container? }；name／weight／container 只套用於自訂物品；裝備中與穿戴中的物品固定 1 件、在最外層，同調中的物品固定 1 件。不會合併同名物品。 */
  function update(uid, changes = {}) {
    const next = entries.map(copyEntry);
    const entry = next.find(item => item.uid === uid);
    if (!entry) return false;
    if (changes.quantity !== undefined && !entry.slot && !entry.attuned && !entry.worn) entry.quantity = clampQuantity(changes.quantity, minQuantity(entry.itemId));
    if (changes.in !== undefined && !entry.slot && !entry.worn) {
      const target = changes.in ? getContainerTargets(uid).find(item => item.uid === changes.in) : null;
      if (target) entry.in = target.uid;
      else if (!changes.in) delete entry.in;
    }
    if (changes.name !== undefined) {
      const name = cleanText(changes.name);
      if (isCustomEntry(entry) && name) entry.name = name;
    }
    if (isCustomEntry(entry) && changes.weight !== undefined) {
      const weight = Number(changes.weight);
      if (changes.weight === null || changes.weight === "" || !Number.isFinite(weight) || weight < 0) delete entry.weight;
      else entry.weight = Math.min(Math.round(weight * 1000) / 1000, LIMITS.weight);
    }
    if (isCustomEntry(entry) && changes.desc !== undefined) {
      const desc = cleanDesc(changes.desc);
      if (desc) entry.desc = desc;
      else delete entry.desc;
    }
    if (isCustomEntry(entry) && changes.container !== undefined) {
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
   * 放不進的容器、裝備中或穿戴中的物品回傳 false 且不變動。不會合併同名物品，要合併用 merge()。
   */
  function move(uid, { into = "", before = "" } = {}) {
    const index = entries.findIndex(entry => entry.uid === uid);
    if (index < 0 || entries[index].slot || entries[index].worn) return false;
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
    // 裝備中的彈藥被併進另一筆時，合併後那筆就是裝備中的彈藥。
    if (entry.ammo) stack.ammo = true;
    return commit(next.filter(item => item !== entry), "merge");
  }

  /** 可以拆分：至少 2 件，容器、裝備中、穿戴中與同調中的物品不拆。 */
  function canSplit(entry) {
    return Boolean(entry) && entry.quantity >= 2 && !entry.slot && !entry.attuned && !entry.worn && !isContainerEntry(entry);
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
    delete part.charges;
    delete part.ammo;
    entry.quantity = kept;
    next.splice(index + 1, 0, part);
    commit(next, "split");
    return part.uid;
  }

  /** 法術卷軸記載的法術環階（含只有 SRD 版的法術）；舊資料依完整名稱對回法術，對不到或不是卷軸時回傳 null。 */
  function getScrollSpellLevel(entry) {
    if (entry?.itemId !== SPELL_SCROLL_ID) return null;
    const catalogApi = globalScope.SpellCatalog;
    const spell = entry.spellId
      ? catalogApi?.getReferenceSpell(entry.spellId)
      : catalogApi?.getAllReferenceSpells().find(candidate => `${candidate.nameZh}${SPELL_SCROLL_ID}` === entry.name);
    return spell ? spell.level : null;
  }

  /** 法術卷軸記載的法術 ID；舊資料依完整名稱對回法術，對不到或不是卷軸時回傳空字串。 */
  function getScrollSpellId(entry) {
    if (entry?.itemId !== SPELL_SCROLL_ID) return "";
    const catalogApi = globalScope.SpellCatalog;
    if (entry.spellId) return catalogApi?.getSpell(entry.spellId) ? entry.spellId : "";
    return catalogApi?.getAllSpells().find(spell => `${spell.nameZh}${SPELL_SCROLL_ID}` === entry.name)?.spellId || "";
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
    // 彈藥用到 0 時保留這一筆（×0），已經是 0 就沒有東西可用。
    if (isAmmunition(entry)) {
      if (entry.quantity < 1) return null;
      entry.quantity = Math.max(0, entry.quantity - used);
      commit(next, "consume");
      return { removed: false, quantity: entry.quantity, uses: 0, emptied: false };
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
    bonusTransfers.clear();
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

  // 可裝備的魔法物品對應的目錄資料 { name, id, selection, base }；name 是裝備欄位的值。
  // 有基本款的武器、護甲、盾牌，以及沒有基本款、可以手持的物品（魔杖等，base 是空字串）；不能裝備（彈藥、戒指、目錄找不到）時為 null。
  function magicEquipmentOf(entry) {
    if (!entry?.magic || !magicRule(entry)) return null;
    if (!entry.itemId && !globalScope.MagicItemCatalog.isHandHeld(entry.magic.id)) return null;
    const resolved = globalScope.MagicItemCatalog.resolveEquipmentName(getLabel(entry));
    return resolved && resolved.id === entry.magic.id ? resolved : null;
  }

  /** 物品欄可供裝備的數量：weapons／armors 以裝備欄位的值計數（普通款是品名，魔法款是自己的名稱；手持的非武器魔法物品也算在 weapons），shields 為普通盾牌數量，magicShields 以名稱計數魔法盾牌。 */
  function getEquippableCounts() {
    const kinds = staticKinds();
    const weapons = new Map();
    const armors = new Map();
    const magicShields = new Map();
    let shields = 0;
    entries.forEach((entry) => {
      if (entry.magic) {
        // 穿在身上的護符不能同時拿在手上。
        const equipment = entry.worn ? null : magicEquipmentOf(entry);
        if (!equipment) return;
        const kind = kindOf(equipment.base, kinds);
        const counts = kind === "shield" ? magicShields : kind === "armor" ? armors : weapons;
        counts.set(equipment.name, (counts.get(equipment.name) || 0) + entry.quantity);
        return;
      }
      if (!entry.itemId) return;
      const kind = kindOf(entry.itemId, kinds);
      const wieldedAs = kind === "weapon" ? entry.itemId : kinds.wieldedAs[entry.itemId];
      if (wieldedAs) weapons.set(wieldedAs, (weapons.get(wieldedAs) || 0) + entry.quantity);
      if (kind === "armor") armors.set(entry.itemId, (armors.get(entry.itemId) || 0) + entry.quantity);
      if (kind === "shield") shields += entry.quantity;
    });
    return { weapons, armors, shields, magicShields };
  }

  /** 這筆物品裝備時裝備欄位要寫的值：魔法款是自己的名稱，武器、護甲、盾牌是品名，法器是對應的武器名稱；不能裝備時為空字串。 */
  function getEquipmentValue(entry) {
    if (entry?.magic) return magicEquipmentOf(entry)?.name || "";
    const kinds = staticKinds();
    return kindOf(entry?.itemId, kinds) ? entry.itemId : kinds.wieldedAs[entry?.itemId] || "";
  }

  function fitsSlot(name, slot, kinds) {
    if (slot === "armor") return kinds.armors.has(name);
    if (slot === "shield") return kinds.shields.has(name);
    return !kinds.armors.has(name);
  }

  /** 物品欄裡可以放進這個位置的魔法款：[{ name（裝備欄位的值）, base（基本款品名；手持的非武器物品是空字串，只放主手或副手）}]，同名只列一次。 */
  function getMagicEquipment(slot) {
    const kinds = staticKinds();
    const names = new Map();
    entries.forEach((entry) => {
      const equipment = entry.worn ? null : magicEquipmentOf(entry);
      if (equipment && !isContainerEntry(entry, kinds) && fitsSlot(equipment.base, slot, kinds)) names.set(equipment.name, equipment.base);
    });
    return [...names].map(([name, base]) => ({ name, base }));
  }

  // 由裝備欄位的值查魔法款；普通品名為 null。
  function magicEquipmentByName(name) {
    return name ? globalScope.MagicItemCatalog?.resolveEquipmentName(name) || null : null;
  }

  // 副手當主手時盾牌位置要拿哪一面：玩家點的那面、下拉選的那面（request 是名稱時）、已經拿著的、普通盾牌，最後才是魔法盾牌。
  function chooseShieldName(list, kinds, preferred, request) {
    const shieldValue = entry => entry.magic ? magicEquipmentOf(entry)?.name || "" : (kinds.shields.has(entry.itemId) ? entry.itemId : "");
    const named = typeof request === "string" && list.find(entry => shieldValue(entry) === request);
    const held = list.find(entry => entry.slot === "shield");
    const plain = list.find(entry => !entry.magic && kinds.shields.has(entry.itemId));
    const magic = list.find(entry => entry.magic && kinds.shields.has(entry.itemId) && magicEquipmentOf(entry));
    return [preferred, named, held, plain, magic].filter(Boolean).map(shieldValue).find(Boolean) || "";
  }

  /**
   * 已裝備的武器、護甲與盾牌不在物品欄（或件數不夠，例如主副手同名要 2 件）時，補上缺的數量並標記 "equipped"。
   * 魔法款的名稱對得上目錄時比照辦理，補上的是那件魔法物品。
   * reset 時先清空（舊資料沒有物品欄）；只以文字管理物品時不動。
   */
  function ensureEquipped({ mainHand = "", offHand = "", armor = "", shield = false } = {}, { reset = false } = {}) {
    if (textOnly) return;
    if (reset) entries = [];
    const kinds = staticKinds();
    const needed = new Map();
    const bump = (name) => { if (name) needed.set(name, (needed.get(name) || 0) + 1); };
    const baseOf = name => magicEquipmentByName(name)?.base || name;
    const handHeld = name => magicEquipmentByName(name)?.base === "";
    [mainHand, offHand].forEach((name) => {
      if (kinds.weapons.has(baseOf(name)) || kinds.shields.has(baseOf(name)) || handHeld(name)) bump(name);
    });
    if (kinds.armors.has(baseOf(armor))) bump(armor);
    // 副手當主手的盾牌：存檔指定的那面不在物品欄時補上；沒有指定時物品欄有任何一面就夠了，沒有時補普通盾牌。
    const shieldBase = typeof shield === "string" ? baseOf(shield) : "";
    if (shieldBase && kinds.shields.has(shieldBase)) bump(shield);
    else if (shield && !chooseShieldName(entries, kinds) && kinds.shields.has("盾牌")) bump("盾牌");
    const counts = getEquippableCounts();
    const owned = (name) => {
      if (kinds.shields.has(baseOf(name))) return magicEquipmentByName(name) ? counts.magicShields.get(name) || 0 : counts.shields;
      return kinds.armors.has(baseOf(name)) ? counts.armors.get(name) || 0 : counts.weapons.get(name) || 0;
    };
    const requests = [...needed].map(([name, quantity]) => {
      const magic = magicEquipmentByName(name);
      return magic
        ? { ...(magic.base ? { itemId: magic.base } : {}), magic: { ...magic.selection, id: magic.id }, quantity: quantity - owned(name) }
        : { itemId: name, quantity: quantity - owned(name) };
    }).filter(request => request.quantity > 0);
    if (!requests.length || !add(requests, { source: "equipped" })) emit("restore");
  }

  // 魔法款只配同名魔法款，普通款只配普通款。
  function matchesEquipment(entry, name, kinds) {
    if (!name) return false;
    if (entry.magic || magicEquipmentByName(name)) return Boolean(entry.magic) && magicEquipmentOf(entry)?.name === name;
    if (!entry.itemId) return false;
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

  // 從候選裡依規則拿：身上的，身上沒有才找容器（第一個裝有這件物品的容器）。
  function pickNearest(list, candidates, kinds) {
    const carried = candidates.filter(entry => !entry.in);
    if (carried.length) return pickFrom(carried);
    const container = containerOrder(list, kinds).find(uid => candidates.some(entry => entry.in === uid));
    return container ? pickFrom(candidates.filter(entry => entry.in === container)) : null;
  }

  // 裝備時拿哪一筆：玩家點的那筆優先；同名的魔法物品有多筆時先拿已同調的，重新載入後加值才不會不見。
  function pickEquipmentSource(list, name, kinds, { prefer = "" } = {}) {
    const candidates = list.filter(entry => !entry.slot && !entry.worn && !isContainerEntry(entry, kinds) && matchesEquipment(entry, name, kinds));
    const preferred = candidates.find(entry => entry.uid === prefer);
    if (preferred) return preferred;
    const attuned = candidates.filter(entry => entry.attuned);
    return pickNearest(list, attuned.length ? attuned : candidates, kinds);
  }

  /**
   * 讓物品的裝備位置符合角色卡的選擇（{ mainHand, offHand, armor, shield }；shield 是副手當主手時的盾牌：false、true 或下拉選的名稱）。
   * 選擇變了的位置先放回身上（成為獨立的一筆），新的選擇再從物品欄拿 1 件（options.prefer 是玩家點的那筆 uid）。
   * 物品欄沒有這件物品時留空；物品欄已滿、又要從多件的標籤多開一筆時放不下，回傳這些位置，其餘位置照常更新。
   */
  function syncEquipped({ mainHand = "", offHand = "", armor = "", shield = false } = {}, { prefer = "" } = {}) {
    if (textOnly) return [];
    const kinds = staticKinds();
    const next = entries.map(copyEntry);
    const preferred = next.find(entry => entry.uid === prefer && kinds.shields.has(entry.itemId));
    const wanted = { mainHand, offHand, armor, shield: shield ? chooseShieldName(next, kinds, preferred, shield) : "" };
    let changed = false;
    next.forEach((entry) => {
      if (entry.slot && !matchesEquipment(entry, wanted[entry.slot], kinds)) {
        delete entry.slot;
        bonusTransfers.delete(entry.uid);
        changed = true;
      }
    });
    const full = [];
    const taken = new Set(next.map(entry => entry.uid));
    SLOTS.forEach((slot) => {
      const name = wanted[slot];
      if (!name || next.some(entry => entry.slot === slot)) return;
      const source = pickEquipmentSource(next, name, kinds, { prefer });
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
        delete unit.charges;
        next.splice(next.indexOf(source) + 1, 0, unit);
      }
      changed = true;
    });
    if (changed) commit(next, "equip");
    return full;
  }

  function needsAttunement(entry) {
    return Boolean(magicRule(entry)?.attunement);
  }

  /** 切換可變形物品的目前形態（formId 對不上時回傳 false）；存在這一筆的 magic.form，原本形態不寫。 */
  function setMagicForm(uid, formId) {
    const next = entries.map(copyEntry);
    const entry = next.find(item => item.uid === uid);
    const forms = magicRule(entry)?.forms;
    if (!forms?.some(form => form.id === formId)) return false;
    if (formId === forms[0].id) delete entry.magic.form;
    else entry.magic.form = formId;
    commit(next, "form");
    return true;
  }

  /** 這種魔法物品目前形態對應的基本款（裝備中的那件優先）；沒有形態或形態沒有基本款時為空字串。 */
  function getMagicFormBase(id) {
    const list = entries.filter(entry => entry.magic?.id === id);
    const entry = list.find(item => item.slot) || list[0];
    return entry ? globalScope.MagicItemCatalog?.getForm(id, getMagicSelection(entry))?.base || "" : "";
  }

  /** 同調的現況：count 是同調中的件數，max 是上限，needed 表示物品欄有需要同調的物品。 */
  function getAttunement() {
    return { count: entries.filter(entry => entry.attuned).length, max: LIMITS.attunement, needed: entries.some(needsAttunement) };
  }

  /**
   * 開始或結束同調。回傳 "ok"，或不能開始的原因（狀態不變）：
   * "unavailable" 這件不需要同調或找不到、"stack" 一筆有多件（要先拆分）、"limit" 已達上限、"duplicate" 已經同調同一種物品。
   */
  function setAttuned(uid, on) {
    const next = entries.map(copyEntry);
    const entry = next.find(item => item.uid === uid);
    if (!entry?.magic || !needsAttunement(entry)) return "unavailable";
    if (Boolean(entry.attuned) === Boolean(on)) return "ok";
    if (on) {
      if (entry.quantity !== 1) return "stack";
      const others = next.filter(item => item.attuned);
      if (others.some(item => item.magic.id === entry.magic.id)) return "duplicate";
      if (others.length >= LIMITS.attunement) return "limit";
      entry.attuned = true;
      // 開始同調時，可以穿戴的物品一併穿上（正拿在手上的不動）。
      if (globalScope.MagicItemCatalog.isWearable(entry.magic.id) && !entry.slot) {
        entry.worn = true;
        delete entry.in;
      }
    } else {
      delete entry.attuned;
      bonusTransfers.delete(entry.uid);
    }
    commit(next, "attune");
    return "ok";
  }

  /**
   * 穿上或卸下可以穿戴的魔法物品（MagicItemCatalog.isWearable）。回傳 "ok"，或不能穿上的原因（狀態不變）：
   * "unavailable" 不能穿戴或找不到、"held" 正拿在手上、"full" 要拆出一件但物品欄已滿。
   * 一筆有多件時拆出 1 件穿上（緊接在原本那筆後面），穿戴件數不設上限；卸下時保留同調，只是效果停止。
   */
  function setWorn(uid, on) {
    const next = entries.map(copyEntry);
    const entry = next.find(item => item.uid === uid);
    if (!entry?.magic || !magicRule(entry) || !globalScope.MagicItemCatalog.isWearable(entry.magic.id)) return "unavailable";
    if (Boolean(entry.worn) === Boolean(on)) return "ok";
    if (!on) {
      delete entry.worn;
      commit(next, "wear");
      return "ok";
    }
    if (entry.slot) return "held";
    let target = entry;
    if (entry.quantity > 1) {
      if (next.length >= LIMITS.items) return "full";
      entry.quantity -= 1;
      target = { ...entry, quantity: 1, uid: nextUid(new Set(next.map(item => item.uid))) };
      delete target.uses;
      delete target.charges;
      next.splice(next.indexOf(entry) + 1, 0, target);
    }
    target.worn = true;
    delete target.in;
    commit(next, "wear");
    return "ok";
  }

  /**
   * 裝備或卸下彈藥（普通或魔法彈藥）。同時只能裝備一種：裝備另一筆時原本那筆自動卸下。
   * 回傳 { ok: true, previous }（previous 是被換下的那筆的名稱，沒有時為空字串），不是彈藥或找不到時回傳 { ok: false }。
   */
  function setAmmo(uid, on) {
    const next = entries.map(copyEntry);
    const entry = next.find(item => item.uid === uid);
    if (!entry || !isAmmunition(entry)) return { ok: false, previous: "" };
    if (Boolean(entry.ammo) === Boolean(on)) return { ok: true, previous: "" };
    let previous = "";
    if (on) {
      next.forEach((item) => {
        if (!item.ammo) return;
        previous = getLabel(item);
        delete item.ammo;
      });
      entry.ammo = true;
    } else delete entry.ammo;
    commit(next, "ammo");
    return { ok: true, previous };
  }

  // 完全相同的另一堆還有彈藥的（同品名、同魔法選項；普通與魔法、+1 與 +2 不互相替代）。
  function findSameAmmo(entry) {
    return entries.find(item => item.uid !== entry.uid && item.quantity > 0 && isAmmunition(item) && (item.itemId || "") === (entry.itemId || "")
      && magicKey(item) === magicKey(entry) && (item.name || "") === (entry.name || "")) || null;
  }

  // 空的那堆卸下、放到身上（最外層、×0，不刪），改裝備 next 那一堆。
  function switchAmmo(empty, next) {
    const list = entries.map(copyEntry);
    list.forEach((item) => {
      if (item.uid === empty.uid) {
        delete item.ammo;
        delete item.in;
      }
      if (item.uid === next.uid) item.ammo = true;
    });
    commit(list, "ammo");
  }

  /**
   * 用掉 1 枚裝備中的彈藥（跑團擲命中）。彈藥用到 0 時保留這一筆、仍是裝備中；物品欄還有完全相同、還有彈藥的另一堆時自動改裝備那一堆，
   * 空的那堆放到身上（不刪）。裝備中的已經是 0 時先試著換裝，換不到就不扣。
   * 回傳 { label, empty, quantity, next }：empty 表示這次沒有彈藥可用（沒扣），quantity 是剛用掉的那一堆剩下的數量，
   * next 是改裝備的那一堆 { uid, label, quantity } 或 null；沒有裝備彈藥時回傳 null。
   */
  function useAmmo() {
    let entry = entries.find(item => item.ammo);
    if (!entry) return null;
    if (entry.quantity < 1) {
      const same = findSameAmmo(entry);
      if (!same) return { label: getLabel(entry), empty: true, quantity: 0, next: null };
      switchAmmo(entry, same);
      entry = entries.find(item => item.uid === same.uid);
    }
    const label = getLabel(entry);
    const used = consume(entry.uid);
    if (!used) return null;
    const current = entries.find(item => item.uid === entry.uid);
    const same = used.quantity === 0 && current ? findSameAmmo(current) : null;
    if (same) switchAmmo(current, same);
    return { label, empty: false, quantity: used.quantity, next: same ? { uid: same.uid, label: getLabel(same), quantity: same.quantity } : null };
  }

  /** 目前裝備的彈藥（複本）；沒有時回傳 null。 */
  function getEquippedAmmo() {
    const entry = entries.find(item => item.ammo);
    return entry ? copyEntry(entry) : null;
  }

  /**
   * 這筆魔法物品的次數池（MagicItemCatalog.getPools）：[{ id, label, max, recover?, amount?, cooldown?, left }]，left 是目前這件的剩餘次數
   * （存檔 charges 沒寫表示滿的）。一筆多件時其餘件數都是滿的。不是魔法物品或沒有池時回傳空陣列。
   */
  function getCharges(entry) {
    const rule = magicRule(entry);
    if (!rule) return [];
    return globalScope.MagicItemCatalog.getPools(rule.id).map(pool => ({ ...pool, left: Math.min(pool.max, entry.charges?.[pool.id] ?? pool.max) }));
  }

  /** 設定剩餘次數（夾在 0 到最大值之間），回傳設定後的值；找不到物品或池時回傳 null。 */
  function setCharges(uid, poolId, left) {
    const next = entries.map(copyEntry);
    const entry = next.find(item => item.uid === uid);
    const pool = entry ? getCharges(entry).find(item => item.id === poolId) : null;
    const value = Math.floor(Number(left));
    if (!pool || !Number.isFinite(value)) return null;
    const clamped = Math.min(pool.max, Math.max(0, value));
    if (clamped === pool.left) return clamped;
    if (clamped >= pool.max) delete entry.charges[poolId];
    else entry.charges = { ...(entry.charges || {}), [poolId]: clamped };
    if (entry.charges && !Object.keys(entry.charges).length) delete entry.charges;
    commit(next, "charges");
    return clamped;
  }

  /**
   * 跑團休息完成時恢復次數池：短休恢復 shortRest 的池，長休恢復 shortRest 與 longRest 的池；有整數 amount 的只恢復那麼多。
   * 回傳恢復了的 [{ uid, label, pool, left }]（沒有變化時不 commit）。
   */
  function recoverRestCharges(kind) {
    const kinds = kind === "longRest" ? ["shortRest", "longRest"] : kind === "shortRest" ? ["shortRest"] : [];
    const next = entries.map(copyEntry);
    const recovered = [];
    next.forEach((entry) => {
      getCharges(entry).forEach((pool) => {
        if (!kinds.includes(pool.recover) || pool.left >= pool.max) return;
        const left = Number.isInteger(pool.amount) ? Math.min(pool.max, pool.left + pool.amount) : pool.max;
        if (left >= pool.max) delete entry.charges[pool.id];
        else entry.charges[pool.id] = left;
        if (!Object.keys(entry.charges).length) delete entry.charges;
        recovered.push({ uid: entry.uid, label: getLabel(entry), pool: pool.id, left });
      });
    });
    if (recovered.length) commit(next, "charges");
    return recovered;
  }

  // 可以轉移加值的物品要裝備在手上且已同調。回傳 { value, max } 或 null。
  function getBonusTransfer(uid) {
    const entry = entries.find(item => item.uid === uid);
    if (!magicRule(entry)?.bonusTransfer || !entry.attuned || !["mainHand", "offHand"].includes(entry.slot)) return null;
    const max = globalScope.MagicItemCatalog.getEffects(entry.magic.id, getMagicSelection(entry)).attack || 0;
    return { value: Math.min(bonusTransfers.get(uid) || 0, max), max };
  }

  /** 設定轉到 AC 的加值（夾在 0 到全部加值之間）；不能轉移時回傳 false。不存檔，只發出 inventory:change 讓角色卡重算。 */
  function setBonusTransfer(uid, value) {
    const current = getBonusTransfer(uid);
    if (!current) return false;
    const next = Math.max(0, Math.min(current.max, Math.floor(Number(value)) || 0));
    if (next === current.value) return true;
    if (next) bonusTransfers.set(uid, next);
    else bonusTransfers.delete(uid);
    emit("transfer");
    return true;
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
    const byUid = new Map(list.map(entry => [entry.uid, entry]));
    let weight = 0;
    let unknown = 0;
    list.forEach((entry) => {
      // 異次元容器裡的物品不算重量（容器本身照算）。
      if (insideExtradimensional(entry, byUid)) return;
      const unit = getUnitWeight(entry);
      if (Number.isFinite(unit)) weight += unit * entry.quantity;
      else unknown += 1;
    });
    return { weight: Math.round(weight * 100) / 100, unknown };
  }

  /**
   * 放在另一個異次元容器裡（直接或隔著其他容器）的異次元容器：[{ inner, outer }]（uid；outer 是最近的那一個）。
   * 依說明這會摧毀兩件物品，角色卡只提示、不刪除。
   */
  function getExtradimensionalNesting() {
    const byUid = new Map(entries.map(entry => [entry.uid, entry]));
    const result = [];
    entries.forEach((entry) => {
      if (!magicContainer(entry)?.extradimensional) return;
      let parent = entry.in ? byUid.get(entry.in) : null;
      let depth = 0;
      while (parent && depth <= LIMITS.depth) {
        if (magicContainer(parent)?.extradimensional) {
          result.push({ inner: entry.uid, outer: parent.uid });
          return;
        }
        depth += 1;
        parent = parent.in ? byUid.get(parent.in) : null;
      }
    });
    return result;
  }

  /**
   * 容器裡（含更深層）的物品分成兩組 uid：custom 是最上層的自訂物品（自訂物品裡面的東西跟著它，不另列），
   * other 是其餘不在自訂物品裡的物品（目錄物品、魔法物品）。吞噬袋只吃 other，custom 整包吐出來。
   */
  function splitCustomContents(uid) {
    const custom = [];
    const other = [];
    const walk = (parent, depth) => {
      if (depth > LIMITS.depth) return;
      entries.filter(entry => entry.in === parent).forEach((entry) => {
        if (isCustomEntry(entry)) custom.push(entry.uid);
        else {
          other.push(entry.uid);
          walk(entry.uid, depth + 1);
        }
      });
    };
    if (entries.some(entry => entry.uid === uid)) walk(uid, 1);
    return { custom, other };
  }

  /** 一筆物品連同裡面的東西的文字寫法（formatText 的寫法，例如「自訂背包（日記）」）；找不到時回傳空字串。 */
  function formatItem(uid) {
    const entry = entries.find(item => item.uid === uid);
    return entry ? formatEntry(entry, entries) : "";
  }

  /** 容器裡的物品（含更深層）的文字寫法（formatText 的寫法，例如「背包（繩索）、口糧 ×3」）；空的回傳空字串。 */
  function formatContents(uid) {
    return entries.filter(entry => entry.in === uid).map(entry => formatEntry(entry, entries)).join("、");
  }

  /** 移除容器裡的所有物品（含更深層）；回傳被移除物品的文字寫法（formatContents()），沒有東西時回傳空字串。 */
  function emptyContainer(uid) {
    const container = entries.find(entry => entry.uid === uid);
    const removed = container ? descendantsOf(uid) : new Set();
    if (!removed.size) return "";
    const text = formatContents(uid);
    removed.forEach(item => bonusTransfers.delete(item));
    commit(entries.filter(entry => !removed.has(entry.uid)).map(copyEntry), "remove");
    return text;
  }

  function formatEntry(entry, list) {
    const label = `${getLabel(entry)}${entry.quantity !== 1 ? ` ×${entry.quantity}` : ""}`;
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
    getMagicEquipment,
    getEquipmentValue,
    setAttuned,
    setWorn,
    setAmmo,
    useAmmo,
    getEquippedAmmo,
    isAmmunition,
    getAmmunitionType,
    getWeaponAmmunition,
    getAmmunitionWeapons,
    getAttunement,
    getBonusTransfer,
    setBonusTransfer,
    setMagicForm,
    getMagicFormBase,
    remove,
    consume,
    restore,
    clear,
    getState,
    getUses,
    getCharges,
    setCharges,
    recoverRestCharges,
    getScrollSpellId,
    getScrollSpellLevel,
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
    getMagicSelection,
    isCustom: isCustomEntry,
    isContainer: entry => isContainerEntry(entry),
    getMagicContainer: entry => {
      const container = magicContainer(entry);
      return container ? { ...container } : null;
    },
    getExtradimensionalNesting,
    formatContents,
    formatItem,
    splitCustomContents,
    emptyContainer,
    entries: () => entries.map(copyEntry),
    getEntry: uid => {
      const entry = entries.find(item => item.uid === uid);
      return entry ? copyEntry(entry) : null;
    },
    childrenOf: uid => entries.filter(entry => (entry.in || "") === (uid || "")).map(copyEntry),
    descendantsOf: uid => [...descendantsOf(uid)]
  });
})(typeof window !== "undefined" ? window : globalThis);

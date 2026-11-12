/**
 * 物品欄介面（傳統 defer script，無額外 runtime dependency）。
 *
 * - 掛在攜帶物品區的 #inventory-panel 與標題列的 #inventory-heading-tools（跑團模式時隨攜帶物品文字框一起搬移，見 tabletop-mode.js）。
 * - 標籤：[匕首 ×2]；容器標籤可展開，內容物排在下一層。點標籤開啟 `inventory-item` 視窗：目錄物品先顯示與商店相同的說明
 *   （search.js 的 renderEquipmentDetailInto()），下方「持有」區調整數量、位置或刪除。
 *   持有區標題行下方是互動列（buildItemActions()，資料取自 equipment-data.js 的 EQUIPMENT_ITEM_ACTIONS）：武器／護甲／盾牌的裝備、換手與卸除
 *   （寫回裝備頁下拉，按下後視窗立即關閉）、工具與撬棍的檢定、醫療包的使用次數、治療藥水飲用回復生命值、投擲物、毒藥與法術卷軸的施法；檢定骰只在擲骰功能開啟時顯示。
 *   魔法物品：視窗上方是與魔法商店相同的副標與說明（magic-item-shop.js 的 renderDetail()）；consumable 物品有「使用」（數量 −1），藥水有 getHeal() 時是「飲用」。
 *   目錄找不到的魔法物品保留這一筆，顯示「未知魔法物品」。
 *   需要同調的魔法物品在互動列有同調開關（Inventory.setAttuned()，分享模式只顯示狀態）：由玩家自己開，超過上限或同調同一種物品時提示原因、不改狀態；
 *   限定條件（例如「由法師」）只顯示不阻擋。同調中的標籤與視窗標示「同調」，物品欄有需同調物品時標題下方顯示「同調 N/3」。
 *   裝備頁標題列另有「同調 N/3」按鈕（#attunement-open，條件相同），開 `attunement` 視窗：三格下拉選要同調的物品，選了立刻生效並列出數字變化（openAttunementDialog()）。
 *   可以穿戴的魔法物品（戒指、斗篷等，MagicItemCatalog.isWearable）在同一列有「裝備／卸下」（Inventory.setWorn()）：穿上後標籤在「裝備中」、固定 ×1，
 *   一筆多件時拆出一件穿上並關閉視窗；開始同調時自動穿上，卸下保留同調。手持類的魔杖等照武器的選手視窗放進主手或副手；
 *   可以穿戴也可以手持的護符分成「手持」「穿戴」兩顆按鈕。分享模式只顯示穿戴與同調狀態。
 *   彈藥（普通或魔法彈藥）有「裝備／卸下」（Inventory.setAmmo()，同時只能一種）：標籤與視窗標示裝備中，但留在原處（可以在箭袋裡）、數量照常可改。
 *   互動列的按鈕在左欄、與下方數量框同寬，說明在右欄。至少 2 件的物品在數量框與位置選單之間有「拆分」，開 `inventory-split` 視窗輸入兩堆的數量；拆開後是兩個獨立標籤。
 * - 裝備：物品經 Inventory.syncEquipped() 從物品欄拿 1 件出來，成為固定 ×1、排在「裝備中」的標籤（entry.slot）；角色卡的裝備選擇是唯一依據，
 *   index.html 在選擇改變與還原存檔後呼叫 syncEquippedSlots()。從標籤的「裝備」按鈕拿那個標籤，從下拉則由 Inventory 依規則找。卸除後在身上成為獨立的 ×1 標籤。
 *   目錄物品由商店（equipment-shop.js）購買或免費取得；這裡只建立自訂物品（`inventory-custom` 視窗，名稱、磅數、數量、位置、描述）。
 *   資料一律經 window.Inventory。
 * - 標題列只有「⋯ 更多」（#inventory-more）：展開 #inventory-more-panel，內有整理成標籤（文字有可轉換的行才出現，⋯ 上同時亮一個小點）、
 *   整理排列、調整餘額、顯示各幣值、顯示負重與純文字管理。會開視窗或改變模式的項目（data-more-close）按下時先收起選單、焦點回到 ⋯，
 *   開關類項目保留選單。錢財項目（data-inventory-sheet-only）在跑團模式隱藏（錢財列只在角色卡）。點外面、Esc 或 Tab 離開時收起。
 *   「顯示各幣值」代按錢財區隱藏的 #money-count-weight（角色欄位）；「顯示負重」是這台裝置的偏好（dndStorage `dnd.inventoryWeightHidden.v1`）。
 *   「魔法物品」代按隱藏的 #magic-item-acquire（角色欄位，預設關閉），只決定商店有沒有魔法物品按鈕；已有的魔法物品照常顯示與計算，
 *   也不因為有魔法物品就自動打開。這台裝置第一次打開時先收起選單、用視窗說明，確定後才打開（dndStorage `dnd.magicItemAcquireNoticeSeen.v1`）。
 *   跑團模式與純文字管理都顯示（商店在兩處都能開）；分享模式只顯示狀態、按了不會改（aria-disabled）。
 * - 物品分組顯示（只影響畫面，不改資料順序）：依序是「裝備中」「身上」「容器」，有兩組以上才加分組標題。
 *   容器是標籤加「N ▸」展開鈕（空容器只寫「0」、不能展開）；最外層容器展開時變成滿版框，內容物排在框內，巢狀容器展開時換行縮排。
 * - 整理模式（選單「整理排列」）：標籤輕微抖動，點標籤不開視窗；拖曳（Pointer Events，滑鼠與觸控相同）調整順序，拖到容器標籤或容器框上放進去，
 *   展開容器後可在內容物之間排列或拖出。拖到同名標籤的中段會合併（Inventory.merge()，自訂物品不能合併）；裝備中的標籤不能拖曳。
 *   鍵盤用方向鍵在同一組前後移動。順序就是物品欄的資料順序（Inventory.move()）。
 *   標籤上方提示列的「完成」、Esc 或切到純文字管理時結束。
 * - 「只以文字管理物品」按下時標籤轉成攜帶物品文字的「物品欄：」行並清空物品欄，標籤、負重與整理功能都隱藏；
 *   再按一次回到標籤，物品欄從已裝備的物品開始，其餘由「整理成標籤」轉回。
 * - 「整理成標籤」只在攜帶物品文字有「物品欄：」「購買物品：」「初始裝備：」行時出現在選單裡，這時不顯示「物品欄還是空的」；
 *   預覽後由玩家確認才轉成標籤並移除那幾行；因裝備而補上的物品先抵掉同名數量，不重複加入。
 * - 負重條：物品＋硬幣重量對照 index.html 的 getCarryCapacityPounds()，超過時改警示色並寫「超過上限」，只提示不改速度；
 *   負重條關掉時，超過上限改在標籤上方顯示一行提示，按「隱藏」後到重新整理前不再顯示。
 * - 展開與隱藏狀態只留在記憶體；視窗內的輸入框不設 id，不會進角色 JSON、分享或 autosave。
 */
(function (globalScope) {
  "use strict";

  const TEXT_PREFIX = "物品欄：";
  const LEGACY_PREFIXES = Object.freeze([[TEXT_PREFIX, ""], ["購買物品：", ""], ["初始裝備：", "initial"]]);
  const WEIGHT_HIDDEN_KEY = "dnd.inventoryWeightHidden.v1";
  const MAGIC_NOTICE_KEY = "dnd.magicItemAcquireNoticeSeen.v1";
  const SLOT_ORDER = Object.freeze(["mainHand", "offHand", "armor", "shield"]);
  const expanded = new Set();
  let rendering = false;
  let overDismissed = false;
  let arranging = false;
  let drag = null;
  // 從標籤的「裝備」按鈕裝備時，下一次同步優先拿這個標籤。
  let preferUid = "";
  let lastEquipment = null;

  const api = () => globalScope.Inventory;

  function el(tagName, className = "", text = "") {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function button(className, text = "") {
    const element = el("button", className, text);
    element.type = "button";
    return element;
  }

  function formatPounds(value) {
    return String(Math.round(Number(value || 0) * 100) / 100);
  }

  function entryText(entry) {
    return `${api().getLabel(entry)}${entry.quantity !== 1 ? ` ×${entry.quantity}` : ""}`;
  }

  // 只以文字管理時「自訂物品」看不到，焦點改回「⋯ 更多」。
  function fallbackFocusTarget() {
    const add = document.getElementById("inventory-add");
    return add && !add.hidden ? add : document.getElementById("inventory-more");
  }

  function moreButton() {
    return document.getElementById("inventory-more");
  }

  function weightHidden() {
    try { return globalScope.dndStorage?.getItem(WEIGHT_HIDDEN_KEY) === "true"; } catch { return false; }
  }

  function setWeightHidden(hidden) {
    try {
      // 打開時寫 "false" 而不是刪除：第一次開啟的預設只補還沒有值的情況，玩家打開過就要記住。
      globalScope.dndStorage?.setItem(WEIGHT_HIDDEN_KEY, hidden ? "true" : "false");
    } catch { /* 存不了時只影響這次畫面。 */ }
    renderWeight();
  }

  function setMoreOpen(open, focusButton = false) {
    const more = moreButton();
    const panel = document.getElementById("inventory-more-panel");
    if (!more || !panel) return;
    more.setAttribute("aria-expanded", String(open));
    panel.hidden = !open;
    if (open) renderMagicToggle();
    if (!open && focusButton) more.focus();
  }

  function magicAcquireField() {
    return document.getElementById("magic-item-acquire");
  }

  function isMagicAcquireLocked() {
    return globalScope.SHARE_MODE === true || magicAcquireField()?.dataset.shareLocked === "true";
  }

  function renderMagicToggle() {
    const toggle = document.getElementById("inventory-magic-toggle");
    if (!toggle) return;
    toggle.setAttribute("aria-pressed", String(magicAcquireField()?.checked === true));
    if (isMagicAcquireLocked()) toggle.setAttribute("aria-disabled", "true");
    else toggle.removeAttribute("aria-disabled");
  }

  function setMagicAcquire(enabled) {
    const field = magicAcquireField();
    if (!field || field.checked === enabled) return;
    field.checked = enabled;
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // 關→開：這台裝置第一次先說明再打開，取消就維持關閉；之後直接切換。開→關不問。
  async function toggleMagicAcquire() {
    const field = magicAcquireField();
    if (!field || isMagicAcquireLocked()) return;
    if (field.checked) {
      setMagicAcquire(false);
      return;
    }
    let seen = false;
    try { seen = globalScope.dndStorage?.getItem(MAGIC_NOTICE_KEY) === "true"; } catch { /* 讀不到就當沒看過。 */ }
    if (!seen && globalScope.AppDialog) {
      setMoreOpen(false, true);
      const confirmed = await globalScope.AppDialog.requestDecision({
        title: "開啟魔法物品？",
        message: "魔法物品通常由 DM 在冒險中給予。開啟後，商店會出現魔法物品按鈕，取得不花錢。",
        cancelLabel: "取消",
        confirmLabel: "開啟",
        trigger: moreButton()
      });
      if (!confirmed) return;
      try { globalScope.dndStorage?.setItem(MAGIC_NOTICE_KEY, "true"); } catch { /* 存不了時下次再說明一次。 */ }
    }
    setMagicAcquire(true);
  }

  function fieldValue(id) {
    return document.getElementById(id)?.value || "";
  }

  // 主手／副手目前從物品欄拿的武器：副手被雙手武器佔用時是空的；契術師的契約武器是召喚的，不算物品欄的物品。
  function handFromInventory(hand) {
    const select = document.getElementById(`${hand}Hand`);
    if (!select || select.disabled || globalScope.isPactWeaponListHand?.(hand)) return "";
    return select.value;
  }

  // 魔法款的裝備欄位值是自己的名稱，這裡換回基本款品名。
  function baseName(name) {
    return globalScope.getEquipmentBaseName?.(name) ?? name;
  }

  // 目前裝備用到的物品：weapon:<武器名稱>、armor:<護甲名稱>、shield（魔法款算在基本款）。
  function equippedUsage() {
    const usage = new Map();
    const bump = key => usage.set(key, (usage.get(key) || 0) + 1);
    const mainHand = handFromInventory("main");
    const offHand = handFromInventory("off");
    if (mainHand && mainHand !== "武藝") bump(`weapon:${baseName(mainHand)}`);
    if (globalScope.isShieldItem?.(offHand)) bump("shield");
    else if (offHand && offHand !== "武藝") bump(`weapon:${baseName(offHand)}`);
    if (document.getElementById("main2Shield")?.checked && document.getElementById("offHandAsMain")?.checked) bump("shield");
    if (fieldValue("armor")) bump(`armor:${baseName(fieldValue("armor"))}`);
    return usage;
  }

  // 手持的非武器魔法物品（魔杖等）沒有基本款，照武器的方式放進主手或副手，以裝備欄位的值（自己的名稱）計算。
  function usageKey(entry) {
    if (entry?.magic && !entry.itemId) {
      const name = entry.worn ? "" : api().getEquipmentValue(entry);
      return name ? `weapon:${name}` : "";
    }
    const item = api().getCatalogItem(entry?.itemId);
    if (!item) return "";
    if (item.kind === "shield") return "shield";
    if (item.kind === "armor") return `armor:${item.id}`;
    return item.wieldedAs ? `weapon:${item.wieldedAs}` : "";
  }

  // 副手當主手時的盾牌：false 沒拿，字串是下拉選的那一面，true 交給物品欄決定。
  function main2ShieldRequest() {
    if (document.getElementById("offHandAsMain")?.checked !== true || document.getElementById("main2Shield")?.checked !== true) return false;
    return globalScope.getMain2ShieldChoice?.() ?? true;
  }

  function currentEquipment() {
    return {
      mainHand: handFromInventory("main"),
      offHand: handFromInventory("off"),
      armor: fieldValue("armor"),
      shield: main2ShieldRequest()
    };
  }

  // 讓物品的裝備位置符合角色卡的選擇。物品欄滿到放不下時改回原本的選擇並提示；還原存檔時不動欄位，只是這件先不拿出來。
  function syncEquippedSlots({ restoring = false } = {}) {
    if (!api() || api().isTextOnly()) return;
    const prefer = preferUid;
    preferUid = "";
    const equipment = currentEquipment();
    const full = api().syncEquipped(equipment, { prefer });
    if (!full.length || restoring) {
      lastEquipment = equipment;
      return;
    }
    full.forEach((slot) => {
      if (slot === "shield") unequipSlot(slot);
      else if (!setSlot(slot, lastEquipment?.[slot] || "")) setSlot(slot, "");
    });
    globalScope.AppDialog?.notify(`物品欄最多 ${api().LIMITS.items} 筆，無法裝備，請先整理物品欄。`, { tone: "warning" });
  }

  function unequipSlot(slot) {
    if (slot === "shield") {
      const shieldToggle = document.getElementById("main2Shield");
      if (!shieldToggle?.checked) return;
      shieldToggle.checked = false;
      shieldToggle.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    const select = document.getElementById(slot);
    if (!select || select.disabled || !select.value) return;
    select.value = "";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  async function confirmUnequip(entry, trigger) {
    const confirmed = await globalScope.AppDialog.requestDecision({
      title: "同時卸下裝備？",
      message: `${api().getLabel(entry)}正在裝備中，刪除後會一併卸下。`,
      cancelLabel: "取消",
      confirmLabel: "卸下並繼續",
      trigger
    });
    if (confirmed) unequipSlot(entry.slot);
    return Boolean(confirmed);
  }

  // 這筆物品對應的魔法物品規則：有 magic 的魔法物品，或沿用裝備品名的法術卷軸、治療藥水。
  function magicRuleOf(entry) {
    const catalog = globalScope.MagicItemCatalog;
    if (!catalog) return null;
    return entry?.magic ? catalog.get(entry.magic.id) : catalog.getByEquipmentName(entry?.itemId);
  }

  // ===== 物品互動（持有區的按鈕；資料取自 equipment-data.js 的 EQUIPMENT_ITEM_ACTIONS）=====
  const ABILITY_LABELS = Object.freeze({ str: "力量", dex: "敏捷", con: "體質", int: "智力", wis: "感知", cha: "魅力" });

  // 「多種」底下的具體品項（例如魯特琴）沿用通稱（樂器）的互動。
  function itemActions(entry) {
    const item = api().getCatalogItem(entry?.itemId);
    const all = globalScope.EQUIPMENT_ITEM_ACTIONS || {};
    return item ? all[item.id] || (item.group && all[item.group]) || null : null;
  }

  function diceEnabled() {
    return globalScope.DiceRoller?.isEnabled?.() === true;
  }

  function signed(value) {
    return value >= 0 ? `+${value}` : `${value}`;
  }

  // 屬性調整值與熟練加值沿用角色卡的 getModifier()／getProficiencyBonus()（index.html）。
  function abilityModifier(ability) {
    return Number(globalScope.getModifier?.(ability)) || 0;
  }

  function proficiencyBonus() {
    return Number(globalScope.getProficiencyBonus?.()) || 2;
  }

  // 工具熟練：裝備頁工具熟練欄（背景、職業與手動各列）的選擇；通稱（樂器、賭具）熟練同組任一種就算。
  function isToolProficient(entry) {
    const chosen = new Set([...document.querySelectorAll("#tool-proficiency-list .tool-proficiency-row select")]
      .map(select => select.value).filter(Boolean));
    const item = api().getCatalogItem(entry.itemId);
    if (!item?.generic) return chosen.has(entry.itemId);
    const group = (globalScope.ToolProficiencyCatalog?.groups || []).find(candidate => candidate.label === item.id);
    return Boolean(group?.options.some(name => chosen.has(name)));
  }

  function readHp(id) {
    const value = String(document.getElementById(id)?.value ?? "").trim();
    return /^\d+$/u.test(value) ? Number(value) : null;
  }

  function quantityText(entry, quantity) {
    return `${api().getLabel(entry)}剩 ${quantity} 件`;
  }

  // 裝備下拉的目前選擇；停用時（雙手佔用）顯示下拉上的說明。
  function handState(id) {
    const select = document.getElementById(id);
    if (!select) return "—";
    const text = select.selectedOptions[0]?.textContent.trim() || "";
    if (select.disabled) return text || "—";
    return select.value ? text || select.value : "空手";
  }

  // 寫回裝備頁下拉並觸發 change，雙手武器卸下盾牌等確認與重算照裝備頁的流程；選項不存在時還原並回傳 false。
  function setSlot(id, value) {
    const select = document.getElementById(id);
    if (!select || select.disabled) return false;
    const previous = select.value;
    select.value = value;
    if (select.value !== value) {
      select.value = previous;
      return false;
    }
    select.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function isTwoHanded(name) {
    return Boolean(globalScope.hasTwoHandedProperty?.(globalScope.getWeaponByName?.(name)));
  }

  // 武器只有一件且在另一手時先從另一手卸下（換手）；勾選「契約」的那一手不從物品欄拿，不算。魔法款的名稱不同，各自計算。
  function equipWeapon(entry, name, handId) {
    const otherId = handId === "mainHand" ? "offHand" : "mainHand";
    const otherHand = otherId === "mainHand" ? "main" : "off";
    const owned = api().getEquippableCounts().weapons.get(name) || 0;
    if (fieldValue(otherId) === name && !globalScope.isPactWeaponListHand?.(otherHand) && owned < 2) setSlot(otherId, "");
    preferUid = entry.uid;
    return setSlot(handId, name);
  }

  // closeItem：關閉物品視窗。玩家選定、確定要寫入時才呼叫，取消或被規則擋下時視窗留著；
  // 先關再寫入，裝備頁流程要再確認（卸下盾牌？）時，確認視窗不會疊在已關閉的視窗上。
  async function openEquipWeaponDialog(entry, trigger, closeItem) {
    const name = api().getEquipmentValue(entry);
    if (!name) return;
    const offLabel = document.getElementById("offHandLabel")?.textContent.trim() || "副手";
    const alternateMain = globalScope.isOffHandAlternateMain?.() === true;
    const twoHanded = isTwoHanded(name);
    const notes = [];
    const blocked = (id, hand, label) => {
      const select = document.getElementById(id);
      if (!select) return true;
      if (select.value === name && !select.disabled) {
        notes.push(`已裝備在${label}。`);
        return true;
      }
      if (globalScope.isPactWeaponListHand?.(hand)) {
        notes.push(`${label}是契約武器，請在裝備頁更換。`);
        return true;
      }
      return false;
    };
    const mainBlocked = blocked("mainHand", "main", "主手");
    let offBlocked = blocked("offHand", "off", offLabel);
    if (!offBlocked && twoHanded && !alternateMain) {
      notes.push(`雙手武器只能裝備在主手${fieldValue("offHand") ? `，${offLabel}的${handState("offHand")}會一併卸下` : ""}。`);
      offBlocked = true;
    } else if (!offBlocked && document.getElementById("offHand")?.disabled && fieldValue("mainHand") !== name) {
      notes.push(`主手的${handState("mainHand")}佔用雙手，裝備在${offLabel}前請先更換主手。`);
      offBlocked = true;
    }
    const result = await globalScope.AppDialog.showContent({
      title: `裝備${api().getLabel(entry)}`,
      variant: "inventory-equip",
      trigger,
      allowNested: true,
      initialFocus: mainBlocked ? undefined : "primary",
      renderContent(body) {
        const status = el("dl", "inventory-hand-status");
        [["主手", "mainHand"], [offLabel, "offHand"]].forEach(([label, id]) => {
          const row = el("div", "inventory-hand-status__row");
          row.append(el("dt", "", label), el("dd", "", handState(id)));
          status.appendChild(row);
        });
        body.appendChild(status);
        notes.forEach(text => body.appendChild(el("p", "inventory-item-note", text)));
      },
      actions: [
        { label: "取消", value: false },
        { label: offLabel, value: "offHand", disabled: offBlocked },
        { label: "主手", intent: "primary", value: "mainHand", disabled: mainBlocked }
      ]
    });
    if (result !== "mainHand" && result !== "offHand") return;
    closeItem();
    if (!equipWeapon(entry, name, result)) {
      globalScope.AppDialog.notify(`無法把${api().getLabel(entry)}裝備在${result === "mainHand" ? "主手" : offLabel}，請到裝備頁調整。`, { tone: "warning" });
    }
  }

  async function equipArmor(entry, trigger, closeItem) {
    const name = api().getEquipmentValue(entry);
    const label = api().getLabel(entry);
    const current = fieldValue("armor");
    if (current && current !== name) {
      const confirmed = await globalScope.AppDialog.requestDecision({
        title: "更換護甲？",
        message: `目前穿著${handState("armor")}，要換成${label}嗎？`,
        cancelLabel: "取消",
        confirmLabel: "更換",
        trigger
      });
      if (!confirmed) return;
    }
    closeItem();
    preferUid = entry.uid;
    if (!setSlot("armor", name)) globalScope.AppDialog.notify(`無法穿上${label}，請到裝備頁調整。`, { tone: "warning" });
  }

  async function equipShield(trigger, entry, closeItem) {
    if (globalScope.isOffHandAlternateMain?.()) {
      const toggle = document.getElementById("main2Shield");
      if (!toggle || !globalScope.isMain2ShieldEligible?.()) {
        globalScope.AppDialog.notify("副手設為另一把主手武器時，需要盾牌熟練且兩手都不是雙手武器，才能裝備盾牌。", { tone: "warning" });
        return;
      }
      closeItem();
      toggle.checked = true;
      // 玩家點的這一面也是下拉的選擇。
      const choice = document.getElementById("main2ShieldItem");
      if (choice) choice.dataset.choice = api().getEquipmentValue(entry);
      preferUid = entry.uid;
      toggle.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    const offHand = document.getElementById("offHand");
    if (!offHand || offHand.disabled) {
      globalScope.AppDialog.notify(`主手的${handState("mainHand")}佔用雙手，無法裝備盾牌。`, { tone: "warning" });
      return;
    }
    const name = api().getEquipmentValue(entry);
    if (offHand.value && offHand.value !== name && !globalScope.isShieldItem?.(offHand.value)) {
      const confirmed = await globalScope.AppDialog.requestDecision({
        title: "更換副手？",
        message: `副手目前是${handState("offHand")}，要換成盾牌嗎？`,
        cancelLabel: "取消",
        confirmLabel: "更換",
        trigger
      });
      if (!confirmed) return;
    }
    closeItem();
    preferUid = entry.uid;
    if (!setSlot("offHand", name)) globalScope.AppDialog.notify("無法裝備盾牌，請到裝備頁調整。", { tone: "warning" });
  }

  // 治療藥水：生命值未填寫或已滿時不擲骰、不減數量；否則擲骰（擲骰功能關閉時照樣擲）、回復生命值，數量減 1。
  function drinkPotion(entry, heal) {
    const label = api().getLabel(entry);
    const current = readHp("hp");
    const maximum = readHp("hp-display");
    if (current === null || !maximum || current >= maximum) {
      globalScope.AppDialog.notify("生命值全滿（或未填寫），藥水數量未減少。", { tone: "warning" });
      return null;
    }
    const roll = globalScope.DiceRoller?.rollExpression?.(heal, { label: `${label}回復生命值`, force: true, notify: false });
    const recovery = roll ? globalScope.TabletopMode?.restoreHitPoints?.(Math.max(1, roll.total), { sourceLabel: `${label}：` }) : null;
    if (!recovery?.ok || !(recovery.restoredHp > 0)) {
      globalScope.AppDialog.notify("目前無法自動回復生命值，藥水數量未減少。", { tone: "warning" });
      return null;
    }
    const used = api().consume(entry.uid);
    globalScope.AppDialog.notify(`${label}：${roll.equation}，回復 ${recovery.restoredHp} 點生命值（HP ${recovery.currentHp}/${maximum}）。`, {
      tone: "success", variant: "dice-roll", duration: 7000
    });
    return used;
  }

  // 投擲物：數量減 1；擲骰功能開啟時一併擲豁免失敗的傷害。
  function throwItem(entry, thrown, dc) {
    const label = api().getLabel(entry);
    const used = api().consume(entry.uid);
    if (!used) return null;
    const left = used.removed ? `${label}已用完` : quantityText(entry, used.quantity);
    const roll = diceEnabled()
      ? globalScope.DiceRoller.rollExpression(thrown.damage, { label: `${label}${thrown.damageType}傷害`, notify: false })
      : null;
    const damage = roll ? `豁免失敗受到 ${roll.equation} ${thrown.damageType}傷害` : `豁免失敗受到 ${thrown.damage} ${thrown.damageType}傷害`;
    globalScope.AppDialog.notify(`投擲${label}：目標 DC ${dc} 敏捷豁免，${damage}${thrown.note ? `（${thrown.note}）` : ""}。${left}。`, {
      tone: "info", variant: roll ? "dice-roll" : "default", duration: 7000
    });
    return used;
  }

  // 法術卷軸：說明列出能否閱讀的原因；不符合時按鈕反灰。確認施法後才用掉卷軸，物品視窗關閉，焦點回到標籤（用完時回到物品欄）。
  function scrollAccessText(access, spell, scroll) {
    const effect = `豁免 DC ${scroll.saveDc}・攻擊 ${signed(scroll.attackBonus)}，施法後卷軸消失。`;
    if (access.reason === "manual") return `手動管理法術，請自行確認能否使用。${effect}`;
    if (access.reason === "source") return `${spell.level === 0 ? "你已學會這個戲法" : "你始終準備這個法術"}，來自${access.label}。${effect}`;
    if (access.reason === "class") return effect;
    return `不在你的職業法術清單上，也不是你${spell.level === 0 ? "學會的戲法" : "始終準備的法術"}。`;
  }

  // 卷軸的豁免 DC 與攻擊加值依環階（內容檔的表），魔法模式的卷軸到 5 環；目錄沒載入時用裝備資料的戲法與 1 環數值。
  function getScrollNumbers(fallback, level) {
    const choice = globalScope.MagicItemCatalog?.getByEquipmentName("法術卷軸")?.options.find(option => option.id === "spellLevel")?.choices.find(item => item.value === level);
    return choice?.saveDc ? { saveDc: choice.saveDc, attackBonus: choice.attackBonus } : fallback;
  }

  function buildScrollRow(entry, fallback, ctx) {
    const spellId = api().getScrollSpellId(entry);
    const spell = spellId ? globalScope.SpellCatalog?.getSpell(spellId) : null;
    if (!spell) return null;
    const scroll = getScrollNumbers(fallback, spell.level);
    const label = api().getLabel(entry);
    const access = globalScope.getSpellScrollAccess?.(spellId) || { allowed: false, reason: "" };
    const cast = actionButton("施法", (control) => {
      globalScope.TabletopSpells?.castSpellScroll?.(spellId, {
        scroll,
        trigger: control,
        commit() {
          const used = api().consume(entry.uid);
          if (!used) return null;
          ctx.close();
          return document.querySelector(`[data-inventory-uid="${entry.uid}"]`) || fallbackFocusTarget();
        }
      });
    }, `施展${label}`);
    cast.disabled = !access.allowed;
    const row = actionRow(scrollAccessText(access, spell, scroll), cast);
    row.querySelector(".inventory-action-row__text").prepend(spellLink(spell), "｜");
    return row;
  }

  // 法術連結（法術名稱，點了開法術說明；只有 SRD 版的法術顯示 SRD 版）。
  function spellLink(spell) {
    const link = button("inventory-spell-link", spell.nameZh);
    link.setAttribute("aria-label", `查看${spell.nameZh}的法術內容`);
    link.addEventListener("click", () => globalScope.TabletopSpells?.showSpellDetail?.(spell.spellId, link));
    return link;
  }

  /**
   * 從物品施放的法術（內容檔 actions 的 spell）：每個法術一列「法術｜消耗與 DC｜施法」，和跑團法術頁的「物品」分組是同一個施法視窗
   * （TabletopSpells.castItemSpell）；確認施法後扣次數、關閉物品視窗，焦點回到標籤。物品沒有生效（未同調、沒穿戴或手持，
   * 或同一種物品已有另一件在用）、次數不夠、「用你的 DC」但沒有施法屬性時按鈕反灰並寫原因。
   */
  function buildItemSpellRows(entry, label, ctx) {
    const spells = globalScope.TabletopSpells;
    if (!spells?.getItemSpellEntries || !globalScope.SpellCatalog?.getItemSpell) return [];
    const active = spells.getItemSpellEntries().filter(item => item.itemSpell.uid === entry.uid);
    const selection = api().getMagicSelection(entry);
    return globalScope.MagicItemCatalog.getActions(entry.magic.id)
      .filter(action => action.spell && Object.entries(action.option || {}).every(([optionId, value]) => selection[optionId] === value))
      .flatMap((action) => {
        const spell = globalScope.SpellCatalog.getItemSpell(action.spell);
        if (!spell) return [];
        const itemSpell = active.find(item => item.itemSpell.action.id === action.id);
        const blocked = itemSpell ? spells.logic.getItemSpellState(itemSpell).blocked : "這件物品生效時才能施放。";
        const cast = actionButton("施法", (control) => {
          spells.castItemSpell(itemSpell, control, {
            afterCommit() {
              ctx.close();
              return document.querySelector(`[data-inventory-uid="${entry.uid}"]`) || fallbackFocusTarget();
            }
          });
        }, `從${label}施放${spell.nameZh}`);
        cast.disabled = Boolean(blocked);
        const row = actionRow(itemSpell ? `${spells.getItemSpellSummary(itemSpell, { withItem: false })}${blocked}` : blocked, cast);
        row.dataset.itemSpell = action.id;
        row.querySelector(".inventory-action-row__text").prepend(spellLink(spell), "｜");
        return [row];
      });
  }

  // 藥水與油的「獲得法術效果」（內容檔 spellLinks）：不是施法，只連到法術說明。
  function buildSpellLinkRow(magicRule) {
    const spells = (magicRule.spellLinks || []).map(id => globalScope.SpellCatalog?.getItemSpell?.(id)).filter(Boolean);
    if (!spells.length) return null;
    const row = actionRow("法術效果：");
    const text = row.querySelector(".inventory-action-row__text");
    spells.forEach((spell, index) => text.append(...(index ? ["、"] : []), spellLink(spell)));
    return row;
  }

  function actionButton(text, onClick, ariaLabel = "") {
    const control = button("inventory-action-button", text);
    if (ariaLabel) control.setAttribute("aria-label", ariaLabel);
    control.addEventListener("click", () => onClick(control));
    return control;
  }

  function actionRow(text, ...controls) {
    const row = el("div", "inventory-action-row");
    if (text) row.appendChild(el("p", "inventory-action-row__text", text));
    const buttons = controls.filter(Boolean);
    // 兩顆按鈕佔滿左右兩欄時，說明排到下一行。
    if (text && buttons.length > 1) row.classList.add("inventory-action-row--stacked");
    if (buttons.length) {
      const group = el("div", "inventory-action-row__buttons");
      group.append(...buttons);
      row.appendChild(group);
    }
    return row;
  }

  const ATTUNEMENT_REFUSALS = Object.freeze({
    stack: "一次只能同調一件，請先拆分這個標籤。",
    limit: `同時最多同調 ${globalScope.Inventory?.LIMITS.attunement ?? 3} 件魔法物品，請先結束其他物品的同調。`,
    duplicate: "不能同時同調兩件相同的魔法物品。"
  });

  const WEAR_REFUSALS = Object.freeze({
    held: "這件正拿在手上，要穿戴請先從主手或副手卸下。",
    full: `物品欄最多 ${globalScope.Inventory?.LIMITS.items ?? 300} 筆，無法拆出一件穿上，請先整理物品欄。`
  });

  /**
   * 穿戴與同調（同一列）：可以穿戴的物品（MagicItemCatalog.isWearable）有「裝備／卸下」，需要同調的有「開始同調／結束同調」。
   * 同調由玩家自己開（角色卡不代填），開始同調時穿戴類物品自動穿上；卸下保留同調、效果停止。限定條件只是提示，不阻擋。
   * 一筆有多件時按「裝備」拆出一件穿上，視窗關閉（新的那件在「裝備中」）。拿在手上的護符不顯示「裝備」。分享模式只看得到狀態。
   */
  function buildWearAttunementRow(entry, rule, label, ctx) {
    const wearable = globalScope.MagicItemCatalog.isWearable(entry.magic.id) && !entry.slot;
    const attunement = rule.attunement ? (rule.attunement === true ? "同調" : `${rule.attunement}同調`) : "";
    if (globalScope.SHARE_MODE) {
      const status = [wearable ? (entry.worn ? "穿戴中" : "未穿戴") : "", attunement ? (entry.attuned ? "同調中" : "未同調") : ""].filter(Boolean).join("、");
      return status ? actionRow(`${status}。`) : null;
    }
    const bothWays = globalScope.MagicItemCatalog.getUse(entry.magic.id) === "wornOrHeld";
    const needs = [wearable && !entry.worn ? (bothWays ? "穿戴或手持" : "穿戴") : "", attunement && !entry.attuned ? attunement : ""].filter(Boolean);
    // 都滿足時不另外寫；同調中只剩限定條件（例如「由法師」）時照樣提示。
    const text = needs.length ? `需要${needs.join("並")}才會生效。` : (entry.attuned && rule.attunement !== true ? `需要${attunement}才會生效。` : "");
    // 可以穿戴也可以手持的護符寫「穿戴」，與放到手上的「手持」分開；其他穿戴物品寫「裝備」。
    const wearText = bothWays ? "穿戴" : "裝備";
    const wear = wearable ? actionButton(entry.worn ? "卸下" : wearText, () => {
      const split = !entry.worn && entry.quantity > 1;
      const result = api().setWorn(entry.uid, !entry.worn);
      if (result !== "ok") {
        if (WEAR_REFUSALS[result]) globalScope.AppDialog.notify(WEAR_REFUSALS[result], { tone: "warning" });
        return;
      }
      if (split) ctx.close();
    }, `${entry.worn ? "卸下" : "穿上"}${label}`) : null;
    if (wear) wear.setAttribute("aria-pressed", String(Boolean(entry.worn)));
    const attune = attunement ? actionButton(entry.attuned ? "結束同調" : "開始同調", () => {
      const result = api().setAttuned(entry.uid, !entry.attuned);
      if (result !== "ok" && ATTUNEMENT_REFUSALS[result]) globalScope.AppDialog.notify(ATTUNEMENT_REFUSALS[result], { tone: "warning" });
    }, `切換${label}的同調`) : null;
    if (attune) attune.setAttribute("aria-pressed", String(Boolean(entry.attuned)));
    return wear || attune ? actionRow(text, wear, attune) : null;
  }

  /**
   * 彈藥（普通或魔法彈藥，Inventory.isAmmunition）：「裝備／卸下」。同時只能裝備一種，裝備另一種時原本的自動卸下並提示。
   * 裝備中的彈藥可以留在箭袋裡、改數量；跑團模式擲用這種彈藥的武器的命中時扣 1 枚。分享模式只顯示狀態。
   */
  function buildAmmoRow(entry, label) {
    const weapons = api().getAmmunitionWeapons(entry.itemId);
    const text = `跑團模式擲${weapons.length ? weapons.join("、") : "用這種彈藥的武器"}的命中時扣 1 枚。`;
    if (globalScope.SHARE_MODE) return entry.ammo ? actionRow(`裝備中。${text}`) : null;
    const toggle = actionButton(entry.ammo ? "卸下" : "裝備", () => {
      const result = api().setAmmo(entry.uid, !entry.ammo);
      if (result.ok && result.previous) globalScope.AppDialog.notify(`改為裝備${label}（原本是${result.previous}）。`, { tone: "info" });
    }, `${entry.ammo ? "卸下" : "裝備"}${label}`);
    toggle.setAttribute("aria-pressed", String(Boolean(entry.ammo)));
    return actionRow(text, toggle);
  }

  // 可變形的物品（王者權杖）：目前形態下拉，裝備中切換時主手的傷害、屬性與精通跟著改。分享模式只顯示目前形態。
  function buildFormRow(entry, rule) {
    const current = globalScope.MagicItemCatalog.getForm(entry.magic.id, api().getMagicSelection(entry));
    if (globalScope.SHARE_MODE) return actionRow(`目前形態：${current.label}`);
    const select = el("select", "inventory-form-select");
    select.dataset.stateTransient = "true";
    select.setAttribute("aria-label", "目前形態");
    select.append(...rule.forms.map(form => new Option(form.label, form.id)));
    select.value = current.id;
    select.addEventListener("change", () => api().setMagicForm(entry.uid, select.value));
    const row = actionRow("目前形態（只改變武器的傷害、屬性與精通，其他效果依說明處理）：", select);
    return row;
  }

  /**
   * 次數池（Inventory.getCharges）：每個池一列「充能：剩 5/7」、−／＋ 數字框（0 到最大值，改了就存），黎明、黃昏與冷卻的池另有恢復按鈕。
   * 恢復量是骰式時用 DiceRoller 擲（進擲骰歷史；擲骰功能關閉時照樣擲，比照藥水），加上去不超過最大值；已滿時停用。
   * 短休、長休的池只寫「長休時自動恢復」，由跑團的休息流程恢復。分享模式也能調整（只在頁面記憶體，和法術位、資源勾選框相同）。
   */
  function buildChargeRows(entry, label) {
    const catalog = globalScope.MagicItemCatalog;
    return api().getCharges(entry).map((pool) => {
      const manual = ["dawn", "dusk", "cooldown"].includes(pool.recover);
      const note = pool.recover ? (manual ? "" : `${catalog.getRecoverText(pool)}。`) : "用完不恢復。";
      const text = el("span", "", "");
      const describe = left => { text.textContent = `${pool.label}：剩 ${left}/${pool.max}。${note}`; };
      let recover = null;
      const sync = (left) => {
        describe(left);
        stepper.input.value = String(left);
        if (recover) recover.disabled = left >= pool.max;
      };
      const write = (value) => {
        const left = api().setCharges(entry.uid, pool.id, value);
        if (left !== null) sync(left);
        return left;
      };
      const stepper = buildStepper(pool.left, `${label}的${pool.label}剩餘次數`, { min: 0, max: pool.max, onChange: write });
      stepper.wrap.dataset.magicPool = pool.id;
      if (manual) {
        recover = actionButton(catalog.getRecoverText(pool), () => {
          const before = api().getCharges(api().getEntry(entry.uid) || entry).find(item => item.id === pool.id)?.left ?? pool.left;
          if (before >= pool.max) return;
          let amount = pool.max - before;
          let roll = null;
          if (typeof pool.amount === "string") {
            roll = globalScope.DiceRoller?.rollExpression?.(pool.amount.replace(/\s+/gu, ""), { label: `${label}${pool.label}恢復`, force: true, notify: false });
            if (!Number.isFinite(roll?.total)) {
              globalScope.AppDialog.notify("無法擲恢復量，請直接修改剩餘次數。", { tone: "warning" });
              return;
            }
            amount = Math.max(0, roll.total);
          } else if (Number.isInteger(pool.amount)) amount = pool.amount;
          const left = write(before + amount);
          if (left === null) return;
          globalScope.AppDialog.notify(`${label}：${roll ? `${roll.equation}，` : ""}${pool.label} ${before} → ${left}/${pool.max}。`, {
            tone: "success", variant: roll ? "dice-roll" : "default", duration: roll ? 7000 : undefined
          });
        }, `${label}的${pool.label}：${catalog.getRecoverText(pool)}`);
        recover.disabled = pool.left >= pool.max;
      }
      const row = actionRow(pool.label, stepper.wrap, recover);
      row.classList.remove("inventory-action-row--stacked");
      row.classList.add("inventory-charge-row");
      row.dataset.magicPool = pool.id;
      row.querySelector(".inventory-action-row__text").replaceChildren(text);
      describe(pool.left);
      return row;
    });
  }

  // 防禦者的加值分配（物品視窗與跑團武器卡）：0 到全部加值轉到 AC，攻擊與傷害減少、AC 增加相同數值；不能轉移時回傳 null。不存檔。
  function buildBonusTransferControl(entry) {
    const transfer = api().getBonusTransfer(entry.uid);
    if (!transfer) return null;
    const stepper = buildStepper(transfer.value, `${api().getLabel(entry)}轉到 AC 的加值`, {
      min: 0,
      max: transfer.max,
      onChange: value => api().setBonusTransfer(entry.uid, value)
    });
    const wrap = el("div", "inventory-bonus-transfer");
    wrap.dataset.bonusTransfer = entry.uid;
    wrap.append(el("span", "inventory-bonus-transfer__label", "加值轉到 AC"), stepper.wrap);
    return wrap;
  }

  /**
   * 持有區的互動列：裝備／換手／卸除、檢定、使用次數、飲用、投擲、塗抹與卷軸施法。ctx.afterUse(result) 在數量或次數改變後同步視窗，ctx.close() 在裝備或卸除時關閉視窗。
   * 檢定與傷害骰只在擲骰功能開啟時顯示。回傳 null 表示這件物品沒有互動。
   */
  function buildItemActions(entry, ctx) {
    const item = api().getCatalogItem(entry.itemId);
    const magicRule = magicRuleOf(entry);
    if (!item && !magicRule) return null;
    const actions = itemActions(entry) || {};
    const label = api().getLabel(entry);
    const rows = [];
    const key = usageKey(entry);
    if (key) {
      // 已裝備的武器再按一次是換手或拿第二把。可以穿戴也可以手持的護符，放到手上的按鈕叫「手持」，與穿戴的按鈕分開。
      const bothWays = Boolean(entry.magic) && globalScope.MagicItemCatalog?.getUse(entry.magic.id) === "wornOrHeld";
      const equipText = entry.slot ? "換手" : bothWays ? "手持" : "裝備";
      const equip = actionButton(equipText, (control) => {
        if (key === "shield") equipShield(control, entry, ctx.close);
        else if (key.startsWith("armor:")) equipArmor(entry, control, ctx.close);
        else openEquipWeaponDialog(entry, control, ctx.close);
      }, `${equipText}${label}`);
      // 武器已裝備時仍可換手或拿第二把；同一件護甲或盾牌已穿戴時不再裝備，普通款和魔法款互換時可以。
      const worn = api().entries().find(other => other.slot && usageKey(other) === key);
      const showEquip = key.startsWith("weapon:") || !equippedUsage().get(key) || (!entry.slot && Boolean(entry.magic || worn?.magic));
      const remove = entry.slot ? actionButton("卸除", () => {
        ctx.close();
        unequipSlot(entry.slot);
      }, `卸除${label}`) : null;
      if (showEquip || remove) rows.push(actionRow("", showEquip ? equip : null, remove));
    }
    if (actions.check && diceEnabled()) {
      const proficient = isToolProficient(entry);
      const modifier = abilityModifier(actions.check.ability) + (proficient ? proficiencyBonus() : 0);
      const abilityLabel = ABILITY_LABELS[actions.check.ability] || "";
      const roll = actionButton(`${abilityLabel}檢定 ${signed(modifier)}`, () => {
        globalScope.DiceRoller?.roll?.({ count: 1, sides: 20, modifier, includeModifier: true, label: `${label}（${abilityLabel}檢定）` });
      }, `擲${label}的${abilityLabel}檢定`);
      const tags = [proficient ? "含熟練加值" : "未熟練", actions.check.advantage ? "有優勢" : ""].filter(Boolean).join("・");
      const row = actionRow("", roll);
      row.querySelector(".inventory-action-row__buttons").appendChild(el("span", "inventory-action-tag", tags));
      rows.push(row);
    }
    const uses = api().getUses(entry);
    if (uses) {
      const spare = entry.quantity - 1;
      rows.push(actionRow(`這件剩 ${uses.left}/${uses.max} 次${spare > 0 ? `，另有 ${spare} 件全新` : ""}。`,
        actionButton("使用 1 次", () => {
          const used = api().consume(entry.uid, { charge: true });
          if (!used) return;
          globalScope.AppDialog.notify(used.removed ? `${label}用完了，已從物品欄移除。`
            : used.emptied ? `${label}這件用完了，換下一件（剩 ${used.quantity} 件）。` : `${label}這件剩 ${used.uses}/${uses.max} 次。`, { tone: "info" });
          ctx.afterUse(used);
        }, `使用 1 次${label}`)));
    }
    if (actions.heal) {
      rows.push(actionRow(`飲用後回復 ${actions.heal} 生命值。`, actionButton("飲用", () => {
        const used = drinkPotion(entry, actions.heal);
        if (used) ctx.afterUse(used);
      }, `飲用${label}`)));
    }
    if (actions.thrown) {
      const dc = 8 + abilityModifier("dex") + proficiencyBonus();
      rows.push(actionRow(`目標 DC ${dc} 敏捷豁免，失敗受到 ${actions.thrown.damage} ${actions.thrown.damageType}傷害${actions.thrown.note ? `（${actions.thrown.note}）` : ""}。`,
        actionButton("投擲", () => {
          const used = throwItem(entry, actions.thrown, dc);
          if (used) ctx.afterUse(used);
        }, `投擲${label}`)));
    }
    if (actions.coating) {
      const coat = actionButton("塗抹", () => {
        const used = api().consume(entry.uid);
        if (!used) return;
        globalScope.AppDialog.notify(`已塗抹${label}，${used.removed ? `${label}已用完` : quantityText(entry, used.quantity)}。`, { tone: "info" });
        ctx.afterUse(used);
      }, `塗抹${label}`);
      rows.push(actionRow(`命中時額外 ${actions.coating.damage} ${actions.coating.damageType}傷害。`, coat));
    }
    const scrollRow = actions.scroll ? buildScrollRow(entry, actions.scroll, ctx) : null;
    if (scrollRow) rows.push(scrollRow);
    // 魔法物品的消耗品；既有的治療藥水在上面已經有「飲用」，能施法的卷軸有「施法」（只有 SRD 版的法術不能施法，才用「使用」）。
    if (magicRule?.consumable && !actions.heal && !scrollRow) {
      const heal = entry.magic ? globalScope.MagicItemCatalog.getHeal(entry.magic.id, api().getMagicSelection(entry)) : null;
      if (heal) {
        rows.push(actionRow(`飲用後回復 ${heal} 生命值。`, actionButton("飲用", () => {
          const used = drinkPotion(entry, heal.replace(/\s+/gu, ""));
          if (used) ctx.afterUse(used);
        }, `飲用${label}`)));
      } else {
        const use = actionButton("使用", () => {
          const used = api().consume(entry.uid);
          if (!used) return;
          globalScope.AppDialog.notify(`已使用${label}，${used.removed ? `${label}已用完` : quantityText(entry, used.quantity)}。`, { tone: "info" });
          ctx.afterUse(used);
        }, `使用${label}`);
        // ×0 的彈藥沒有東西可用。
        use.disabled = entry.quantity < 1;
        rows.push(actionRow("", use));
      }
    }
    const wearRow = entry.magic && magicRule ? buildWearAttunementRow(entry, magicRule, label, ctx) : null;
    if (wearRow) rows.push(wearRow);
    const ammoRow = api().isAmmunition(entry) ? buildAmmoRow(entry, label) : null;
    if (ammoRow) rows.push(ammoRow);
    if (entry.magic && magicRule) rows.push(...buildChargeRows(entry, label), ...buildItemSpellRows(entry, label, ctx));
    const spellLinkRow = magicRule ? buildSpellLinkRow(magicRule) : null;
    if (spellLinkRow) rows.unshift(spellLinkRow);
    const transfer = entry.magic ? buildBonusTransferControl(entry) : null;
    if (entry.magic && magicRule?.forms) rows.push(buildFormRow(entry, magicRule));
    if (transfer) rows.push(actionRow("可把部分或全部加值轉到 AC，攻擊與傷害會減少相同數值；重新整理後回到 0。", transfer));
    if (!rows.length) return null;
    const section = el("div", "inventory-item-actions");
    section.append(...rows);
    return section;
  }

  async function openSplitDialog(uid, trigger, onSplit) {
    const entry = api().getEntry(uid);
    if (!api().canSplit(entry)) return;
    const total = entry.quantity;
    const uses = api().getUses(entry);
    const clamp = value => Math.min(total - 1, Math.max(1, value));
    const readValue = (input) => {
      const value = Number(input.value);
      return input.value.trim() !== "" && Number.isInteger(value) ? value : null;
    };
    let inputs = [];
    let error = null;
    const result = await globalScope.AppDialog.showContent({
      title: `拆分${api().getLabel(entry)}`,
      variant: "inventory-split",
      trigger,
      initialFocus: "content",
      renderContent(body) {
        body.appendChild(el("p", "inventory-item-note", `共 ${total} 件，拆成兩個標籤。${uses && uses.left < uses.max ? `用過的那件（剩 ${uses.left}/${uses.max} 次）留在第一堆。` : ""}`));
        const fields = el("div", "inventory-split-fields");
        inputs = [Math.ceil(total / 2), Math.floor(total / 2)].map((value, index) => {
          const input = el("input", "inventory-text-input inventory-split-input");
          input.type = "number";
          input.min = "1";
          input.max = String(total - 1);
          input.step = "1";
          input.inputMode = "numeric";
          input.value = String(value);
          input.dataset.stateTransient = "true";
          fields.appendChild(labelled(index ? "第二堆" : "第一堆", input));
          return input;
        });
        inputs.forEach((input, index) => {
          const other = inputs[1 - index];
          // 輸入時另一堆跟著變；離開欄位時把超出範圍的數字拉回來。
          input.addEventListener("input", () => {
            error.textContent = "";
            const value = readValue(input);
            if (value !== null && value >= 1 && value < total) other.value = String(total - value);
          });
          input.addEventListener("change", () => {
            const value = readValue(input);
            const fixed = clamp(value === null ? Number(total - Number(other.value)) || 1 : value);
            input.value = String(fixed);
            other.value = String(total - fixed);
          });
          input.addEventListener("focus", () => input.select());
          input.addEventListener("keydown", (event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            input.dispatchEvent(new Event("change", { bubbles: true }));
            input.closest(".app-dialog")?.querySelector(".app-dialog__button--primary")?.click();
          });
        });
        body.appendChild(fields);
        error = el("p", "starting-equipment-error");
        error.setAttribute("aria-live", "polite");
        body.appendChild(error);
      },
      actions: [
        { label: "取消", value: false },
        {
          label: "拆分",
          intent: "primary",
          resolve: () => {
            const [first, second] = inputs.map(readValue);
            if (first === null || second === null || first < 1 || second < 1 || first + second !== total) {
              error.textContent = `兩堆加起來要等於 ${total}，每堆至少 1 件。`;
              inputs[0].focus();
              return false;
            }
            if (api().split(uid, first)) return "split";
            error.textContent = `物品欄最多 ${api().LIMITS.items} 筆，請先整理物品欄再拆分。`;
            return false;
          }
        }
      ]
    });
    if (result === "split") onSplit?.();
  }

  function containerLabel(entry, all) {
    const label = api().getLabel(entry);
    const same = all.filter(item => api().isContainer(item) && api().getLabel(item) === label);
    return same.length > 1 ? `${label} #${same.findIndex(item => item.uid === entry.uid) + 1}` : label;
  }

  function fillLocationSelect(select, uid, current) {
    const all = api().entries();
    const top = el("option", "", "身上");
    top.value = "";
    select.replaceChildren(top);
    api().getContainerTargets(uid).forEach((target) => {
      const option = el("option", "", `放在${containerLabel(target, all)}`);
      option.value = target.uid;
      select.appendChild(option);
    });
    select.value = current || "";
    if (select.value !== (current || "")) select.value = "";
  }

  function buildLocationSelect(uid, current) {
    const select = el("select", "inventory-location-select");
    select.dataset.stateTransient = "true";
    fillLocationSelect(select, uid, current);
    return select;
  }

  // min 為 0 時（持有物品的視窗）數量可以減到 0，按「完成」時再確認是否刪除。
  function buildStepper(value, label, { min = 1, max = api().LIMITS.quantity, onChange = null } = {}) {
    const wrap = el("div", "inventory-stepper");
    const minus = button("inventory-stepper__button", "−");
    minus.setAttribute("aria-label", `減少${label}`);
    const input = el("input", "inventory-stepper__input");
    input.type = "number";
    input.min = String(min);
    input.max = String(max);
    input.step = "1";
    input.inputMode = "numeric";
    input.value = String(value);
    input.dataset.stateTransient = "true";
    input.setAttribute("aria-label", label);
    const plus = button("inventory-stepper__button", "＋");
    plus.setAttribute("aria-label", `增加${label}`);
    const read = () => {
      const parsed = Math.floor(Number(input.value));
      return Math.min(max, Math.max(min, Number.isFinite(parsed) && input.value.trim() !== "" ? parsed : 1));
    };
    const changed = () => onChange?.(read());
    minus.addEventListener("click", () => { input.value = String(Math.max(min, read() - 1)); changed(); });
    plus.addEventListener("click", () => { input.value = String(Math.min(max, read() + 1)); changed(); });
    input.addEventListener("change", changed);
    wrap.append(minus, input, plus);
    return { wrap, input, read };
  }

  function labelled(text, control) {
    const label = el("label", "inventory-field");
    label.append(el("span", "inventory-field__label", text), control);
    return label;
  }

  // 視窗標題下方（標題列分隔線上方）的說明，做法同商店標題下的財產；需在 showContent() 之後呼叫。
  function addDialogSubtitle(body, text) {
    const header = body.closest(".app-dialog")?.querySelector(".app-dialog__header");
    const title = header?.querySelector("h2");
    if (!title) return;
    const heading = el("div", "inventory-dialog-heading");
    title.replaceWith(heading);
    heading.append(title, el("p", "inventory-dialog-subtitle", text));
  }

  // 自訂物品的名稱與磅數（同一列 3.5：1）、描述欄位；entry 為 null 時是新增。
  function buildCustomFields(entry) {
    const nameInput = el("input", "inventory-text-input");
    nameInput.type = "text";
    nameInput.maxLength = api().LIMITS.name;
    nameInput.value = entry?.name || "";
    if (!entry) nameInput.placeholder = "例如：任務信件";
    nameInput.dataset.stateTransient = "true";
    const weightInput = el("input", "inventory-text-input");
    weightInput.type = "number";
    weightInput.min = "0";
    weightInput.step = "0.1";
    weightInput.inputMode = "decimal";
    weightInput.placeholder = "—";
    weightInput.value = Number.isFinite(entry?.weight) ? String(entry.weight) : "";
    weightInput.dataset.stateTransient = "true";
    weightInput.setAttribute("aria-label", "每件磅數（選填）");
    const nameRow = el("div", "inventory-custom-row inventory-custom-row--name");
    nameRow.append(labelled("名稱", nameInput), labelled("磅數 | 選填", weightInput));
    const descInput = el("textarea", "inventory-text-input inventory-desc-input");
    descInput.rows = 3;
    descInput.maxLength = api().LIMITS.desc;
    descInput.placeholder = "這是什麼、做什麼用（選填）";
    descInput.value = entry?.desc || "";
    descInput.dataset.stateTransient = "true";
    const toggleLabel = el("label", "inventory-check");
    const containerToggle = el("input");
    containerToggle.type = "checkbox";
    containerToggle.checked = entry?.container === true;
    containerToggle.dataset.stateTransient = "true";
    toggleLabel.append(containerToggle, el("span", "", "可以放入其他物品（容器）"));
    return { nameRow, desc: labelled("描述", descInput), toggleLabel, nameInput, weightInput, descInput, containerToggle };
  }

  function weightDescription(entry) {
    const unit = api().getUnitWeight(entry);
    if (!Number.isFinite(unit)) return "未列重量";
    return entry.quantity > 1 ? `每件 ${formatPounds(unit)} 磅・共 ${formatPounds(unit * entry.quantity)} 磅` : `${formatPounds(unit)} 磅`;
  }

  async function removeEntry(entry, trigger) {
    const contents = api().descendantsOf(entry.uid);
    let keepContents = true;
    if (contents.length) {
      const choice = await globalScope.AppDialog.requestDecision({
        title: `刪除${api().getLabel(entry)}？`,
        message: `裡面還有 ${contents.length} 項物品。`,
        trigger,
        actions: [
          { label: "取消", value: "cancel" },
          { label: "連同內容物刪除", intent: "danger", value: "all" },
          { label: "保留內容物", intent: "primary", value: "keep" }
        ]
      });
      if (choice !== "all" && choice !== "keep") return false;
      keepContents = choice === "keep";
    }
    if (entry.slot && !(await confirmUnequip(entry, trigger))) return false;
    return api().remove(entry.uid, { keepContents });
  }

  function openItemDialog(uid, trigger) {
    const entry = api().getEntry(uid);
    if (!entry || !globalScope.AppDialog) return;
    const custom = api().isCustom(entry);
    const item = api().getCatalogItem(entry.itemId);
    let controls = null;
    let stopWatching = () => {};
    globalScope.AppDialog.showContent({
      title: api().getLabel(entry),
      variant: "inventory-item",
      trigger,
      // 刪除或卸下的確認視窗、說明內的規則連結、裝備的選手視窗疊在這個視窗上。
      allowNested: true,
      renderContent(body, dialog) {
        // 魔法物品顯示與魔法商店相同的說明，目錄物品顯示與商店相同的說明（search.js），下方「持有」區調整數量與位置；自訂與通稱物品只有持有區。
        const scrollLevel = api().getScrollSpellLevel(entry);
        const srdOnlyScroll = globalScope.MagicItemShop?.isSrdOnlyScroll(scrollLevel) ? globalScope.MagicItemCatalog.getByEquipmentName(entry.itemId) : null;
        const hasDetail = entry.magic
          ? Boolean(globalScope.MagicItemShop?.renderDetail(body, entry.magic.id, { selection: entry.magic }))
          : srdOnlyScroll
            ? Boolean(globalScope.MagicItemShop.renderDetail(body, srdOnlyScroll.id, { selection: { spellLevel: scrollLevel } }))
            : Boolean(item && !item.generic && globalScope.renderEquipmentDetailInto?.(body, entry.itemId));
        if (entry.magic && !hasDetail) body.appendChild(el("p", "inventory-item-note", "網站找不到這件魔法物品的資料，可能來自較新的版本或內容已移除；這一筆會保留在物品欄。"));
        const holding = el("section", "inventory-holding");
        holding.classList.toggle("has-detail", hasDetail);
        holding.setAttribute("aria-label", "持有");
        const meta = el("p", "inventory-item-meta");
        meta.appendChild(el("span", "inventory-holding__title", "持有"));
        // 說明已列單件重量，只有一件時不重複。
        const weight = el("span", "inventory-holding__weight");
        const badge = el("span", "inventory-tag__badge", "裝備中");
        badge.hidden = !entry.slot && !entry.worn && !entry.ammo;
        const attunedBadge = el("span", "inventory-attuned-badge", "同調中");
        attunedBadge.hidden = !entry.attuned;
        meta.append(badge, attunedBadge);
        holding.appendChild(meta);
        const syncWeight = (current) => {
          weight.textContent = weightDescription(current);
          if (hasDetail && current.quantity <= 1) weight.remove();
          else if (!weight.parentNode) badge.before(weight);
        };
        syncWeight(entry);
        let shownQuantity = entry.quantity;
        // 互動列：用掉物品或刪除前卸下裝備時重建；數量同步到下方的數量欄，用完時關閉視窗。裝備與卸除直接關閉視窗（ctx.close）。
        let actionsSection = null;
        const refreshActions = () => {
          const current = api().getEntry(uid);
          if (!current) return;
          badge.hidden = !current.slot && !current.worn && !current.ammo;
          attunedBadge.hidden = !current.attuned;
          syncWeight(current);
          // 裝備中與穿戴中的物品固定 1 件，沒有數量與位置；其他時候數量真的變了才改輸入框，保留玩家還沒按「完成」的輸入。
          if (controls) controls.row.hidden = Boolean(current.slot || current.worn);
          // 同調中的物品固定 1 件，數量不能改（位置可以）。
          if (controls?.quantityField) controls.quantityField.hidden = Boolean(current.attuned);
          if (controls?.split) controls.split.hidden = !api().canSplit(current);
          if (controls && current.quantity !== shownQuantity) controls.stepper.input.value = String(current.quantity);
          shownQuantity = current.quantity;
          const next = buildItemActions(current, {
            afterUse(used) {
              if (used.removed) {
                dialog.close("removed");
                return;
              }
              refreshActions();
            },
            close: () => dialog.close("equipment")
          });
          // 重建前焦點在互動列時，改到新互動列的同一顆按鈕（不在了就是第一顆）。
          const focused = actionsSection?.contains(document.activeElement) ? document.activeElement.getAttribute("aria-label") : null;
          if (next) {
            if (actionsSection) actionsSection.replaceWith(next);
            else meta.after(next);
          } else actionsSection?.remove();
          actionsSection = next;
          if (focused !== null) {
            const buttons = [...(next?.querySelectorAll("button") || [])];
            (buttons.find(item => item.getAttribute("aria-label") === focused) || buttons[0])?.focus();
          }
        };
        refreshActions();
        const onSlotChange = (event) => {
          if (["mainHand", "offHand", "armor", "main2Shield", "main2ShieldItem", "offHandAsMain"].includes(event.target?.id)) refreshActions();
        };
        document.addEventListener("change", onSlotChange);
        // 裝備或卸除會改變這一筆的數量與裝備位置。
        document.addEventListener("inventory:change", refreshActions);
        stopWatching = () => {
          document.removeEventListener("change", onSlotChange);
          document.removeEventListener("inventory:change", refreshActions);
        };
        const contents = api().descendantsOf(uid).length;
        if (api().isContainer(entry)) {
          // 異次元容器（內容檔 container.extradimensional）裡的物品不算重量；吞噬袋沿用普通容器的說法，不透露計時。
          const weightNote = api().getMagicContainer(entry)?.extradimensional ? "異次元空間裡的物品不算重量，只算容器本身。" : "容器不會減輕內容物的重量。";
          holding.appendChild(el("p", "inventory-item-note", contents ? `內含 ${contents} 項物品；${weightNote}` : `可以放入其他物品；${weightNote}`));
        }
        // 自訂物品：名稱與磅數一列，數量與位置一列，描述自成一列。
        const fields = custom ? buildCustomFields(entry) : null;
        if (fields) holding.appendChild(fields.nameRow);
        const row = el("div", "inventory-holding__row");
        const stepper = buildStepper(entry.quantity, "數量", { min: 0 });
        let quantityField = null;
        if (api().isContainer(entry)) stepper.wrap.hidden = true;
        else {
          quantityField = labelled("數量", stepper.wrap);
          quantityField.hidden = Boolean(entry.attuned);
          row.appendChild(quantityField);
        }
        const location = buildLocationSelect(uid, entry.in);
        // 「拆分」排在數量框與位置選單之間；容器不能拆分，也沒有數量框。
        const place = el("div", "inventory-holding__place");
        let split = null;
        if (!api().isContainer(entry)) {
          split = actionButton("拆分", control => openSplitDialog(uid, control, () => dialog.close("split")), `拆分${api().getLabel(entry)}`);
          split.classList.add("inventory-action-split");
          split.hidden = !api().canSplit(entry);
          place.appendChild(split);
        }
        place.appendChild(labelled("位置", location));
        row.appendChild(place);
        holding.appendChild(row);
        row.hidden = Boolean(entry.slot || entry.worn);
        if (fields) holding.append(fields.desc, fields.toggleLabel);
        body.appendChild(holding);
        controls = { stepper, location, row, quantityField, split, ...fields };
      },
      actions: [
        { label: "刪除", intent: "danger", resolve: async () => (await removeEntry(api().getEntry(uid) || entry, trigger)) ? "removed" : false },
        { label: "取消", value: false },
        {
          label: "完成",
          intent: "primary",
          resolve: async () => {
            const current = api().getEntry(uid) || entry;
            if (current.slot || current.worn) return "saved";
            const quantity = api().isContainer(current) ? current.quantity : controls.stepper.read();
            // 彈藥可以 ×0（用完後保留，由玩家自己刪除），其他物品數量 0 是刪除。
            if (quantity === 0 && !api().isAmmunition(current)) {
              const choice = await globalScope.AppDialog.requestDecision({
                title: `刪除${api().getLabel(entry)}？`,
                message: "數量為 0，確認後會從物品欄刪除這項物品。",
                trigger,
                actions: [
                  { label: "取消", value: "cancel" },
                  { label: "刪除", intent: "danger", value: "delete" }
                ]
              });
              if (choice !== "delete") return false;
              return (await removeEntry(current, trigger)) ? "removed" : false;
            }
            const changes = { quantity, in: controls.location.value };
            if (custom) {
              if (!controls.nameInput.value.trim()) {
                controls.nameInput.focus();
                return false;
              }
              Object.assign(changes, { name: controls.nameInput.value, weight: controls.weightInput.value, desc: controls.descInput.value, container: controls.containerToggle.checked });
            }
            api().update(uid, changes);
            return "saved";
          }
        }
      ],
      // 說明在上方，焦點不落在說明內的規則連結。
      initialFocus: "primary",
      // 調整後標籤會重繪，焦點改回同一件物品；刪除後回到「自訂物品」或齒輪。
      onClose: () => {
        stopWatching();
        globalScope.setTimeout(() => {
          if (document.activeElement && document.activeElement !== document.body) return;
          (document.querySelector(`[data-inventory-uid="${uid}"]`) || fallbackFocusTarget())?.focus();
        }, 0);
      }
    });
  }

  function openCustomDialog(trigger) {
    if (!globalScope.AppDialog) return;
    let controls = null;
    let dialogBody = null;
    globalScope.AppDialog.showContent({
      title: "自訂物品",
      variant: "inventory-custom",
      trigger,
      renderContent(body) {
        dialogBody = body;
        const fields = buildCustomFields(null);
        const stepper = buildStepper(1, "數量");
        const location = buildLocationSelect("", "");
        const row = el("div", "inventory-holding__row");
        row.append(labelled("數量", stepper.wrap), labelled("位置", location));
        body.append(fields.nameRow, row, fields.desc, fields.toggleLabel);
        controls = { ...fields, stepper, location };
      },
      actions: [
        { label: "取消", value: false },
        {
          label: "加入",
          intent: "primary",
          resolve: () => {
            const name = controls.nameInput.value.trim();
            if (!name) {
              controls.nameInput.focus();
              return false;
            }
            const request = { name, weight: controls.weightInput.value, desc: controls.descInput.value, container: controls.containerToggle.checked, quantity: controls.stepper.read() };
            if (!api().add([request], { into: controls.location.value })) {
              globalScope.AppDialog.notify?.(`物品欄最多 ${api().LIMITS.items} 筆，請先整理後再加入。`);
              return false;
            }
            return "added";
          }
        }
      ]
    });
    // 標題列在 showContent() 建好視窗後才接上，說明在這之後加。
    if (dialogBody) addDialogSubtitle(dialogBody, "商店找不到的物品，可在此自訂。");
  }

  function legacyLines() {
    const notes = document.getElementById("gear-notes");
    if (!notes) return [];
    return notes.value.split("\n").map((line, index) => {
      const text = line.trimStart();
      const match = LEGACY_PREFIXES.find(([prefix]) => text.startsWith(prefix));
      // 「物品欄：」行是 formatText() 的寫法，容器內容物在括號內，交給 Inventory.parseListText() 拆。
      return match ? { index, prefix: match[0], source: match[1], items: api().parseListText(text.slice(match[0].length), { customContainers: match[0] === TEXT_PREFIX }) } : null;
    }).filter(line => line?.items.length);
  }

  function openTidyDialog(trigger) {
    const lines = legacyLines();
    if (!lines.length || !globalScope.AppDialog) return;
    globalScope.AppDialog.showContent({
      title: "整理成標籤",
      variant: "inventory-tidy",
      trigger,
      renderContent(body) {
        body.appendChild(el("p", "inventory-item-note", "以下文字會轉成物品標籤，並從攜帶物品文字移除；其他文字保留不動。目錄找不到的會建立成自訂物品（未列重量）；物品欄已有、因裝備而補上的同名物品不會重複加入。"));
        lines.forEach((line) => {
          body.appendChild(el("h3", "inventory-add-heading", line.prefix.replace("：", "")));
          const tags = el("ul", "inventory-tags inventory-tags--preview");
          line.items.forEach((node) => {
            const parsed = api().parseItemText(node.text);
            const label = parsed.name || api().getLabel({ itemId: parsed.itemId, ...(parsed.magic ? { magic: parsed.magic } : {}) });
            const pack = api().getCatalogItem(parsed.itemId)?.pack;
            const note = node.children ? `（內含 ${node.children.length} 項）` : pack ? "（拆成容器與內容物）" : "";
            const tag = el("li", "inventory-tag inventory-tag--static", `${label}${parsed.quantity !== 1 ? ` ×${parsed.quantity}` : ""}${note}`);
            if (!parsed.itemId) tag.classList.add("is-custom");
            tags.appendChild(tag);
          });
          body.appendChild(tags);
        });
      },
      actions: [
        { label: "取消", value: false },
        {
          label: "轉成標籤",
          intent: "primary",
          resolve: () => {
            const ok = lines.every(line => api().add(line.items, { absorbEquipped: true, ...(line.source ? { source: line.source } : {}) }));
            if (!ok) {
              globalScope.AppDialog.notify?.(`物品欄最多 ${api().LIMITS.items} 筆，部分物品沒有轉換。`);
              return false;
            }
            const notes = document.getElementById("gear-notes");
            const removeIndexes = new Set(lines.map(line => line.index));
            notes.value = notes.value.split("\n").filter((_, index) => !removeIndexes.has(index)).join("\n").replace(/^\n+/u, "");
            notes.dispatchEvent(new Event("input", { bubbles: true }));
            return "tidied";
          }
        }
      ],
      // 轉換後「整理成標籤」提示會隱藏，焦點改到「自訂物品」或齒輪。
      onClose: result => {
        if (result === "tidied") globalScope.setTimeout(() => fallbackFocusTarget()?.focus(), 0);
      }
    });
  }

  function renderEntry(entry, index, listEl, all, group = "") {
    const item = el("li", "inventory-tag-item");
    item.dataset.inventoryItem = entry.uid;
    if (group) item.dataset.inventoryGroup = group;
    // 抖動錯開相位，看起來不會整排同步。
    item.style.setProperty("--inventory-jiggle-delay", `${-((index * 7) % 5) * 0.05}s`);
    const tag = button("inventory-tag", entryText(entry));
    tag.dataset.inventoryUid = entry.uid;
    if (arranging) tag.title = entry.slot || entry.worn ? "裝備中的物品要先卸除才能移動" : "拖曳或用方向鍵調整順序，拖到同名標籤上可合併";
    else {
      tag.setAttribute("aria-haspopup", "dialog");
      tag.title = "調整數量、位置或刪除";
    }
    if (entry.slot || entry.worn) {
      tag.classList.add("is-equipped");
      item.classList.add("is-fixed");
    }
    // 裝備中的彈藥：外觀和裝備中的物品一樣，但留在原處（可以在箭袋裡）、可以移動。
    if (entry.ammo) tag.classList.add("is-equipped");
    if (api().isCustom(entry)) tag.classList.add("is-custom");
    // ×0 的彈藥（只有彈藥能是 0）：標籤變灰。
    if (entry.quantity === 0) tag.classList.add("is-empty");
    if (entry.attuned) {
      tag.classList.add("is-attuned");
      tag.appendChild(el("span", "inventory-tag__badge", "同調"));
    }
    tag.addEventListener("click", () => { if (!arranging) openItemDialog(entry.uid, tag); });
    item.appendChild(tag);
    if (api().isContainer(entry)) {
      const children = all.filter(child => child.in === entry.uid);
      // 空容器沒有東西可看：不展開，計數只寫「0」、沒有箭頭。
      const isOpen = children.length > 0 && expanded.has(entry.uid);
      // 最外層容器收合時是小標籤，展開時才變成滿版框，內容物排在框內。
      const isBox = group === "container" && isOpen;
      item.classList.add("is-container");
      item.classList.toggle("is-box", isBox);
      item.classList.toggle("is-expanded", isOpen);
      if (children.length) {
        const toggle = button("inventory-tag__toggle", isBox ? `${children.length} 項 ▾` : `${children.length} ${isOpen ? "▾" : "▸"}`);
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.setAttribute("aria-label", `${isOpen ? "收合" : "展開"}${api().getLabel(entry)}的內容物（${children.length} 項）`);
        toggle.dataset.inventoryToggle = entry.uid;
        toggle.addEventListener("click", () => {
          if (expanded.has(entry.uid)) expanded.delete(entry.uid);
          else expanded.add(entry.uid);
          render();
          document.querySelector(`[data-inventory-toggle="${entry.uid}"]`)?.focus();
        });
        item.appendChild(toggle);
      } else {
        const count = el("span", "inventory-tag__toggle is-empty", "0");
        count.title = "空的";
        item.appendChild(count);
      }
      if (isOpen) {
        const nested = el("ul", "inventory-tags inventory-container-contents");
        nested.setAttribute("aria-label", `${api().getLabel(entry)}的內容物`);
        renderEntries(entry.uid, nested, all);
        item.appendChild(nested);
      }
    }
    listEl.appendChild(item);
  }

  function renderEntries(parentUid, listEl, all) {
    all.filter(entry => (entry.in || "") === parentUid).forEach((entry, index) => renderEntry(entry, index, listEl, all));
  }

  // 最外層分組：裝備中、身上、容器；有兩組以上時才加分組標題。
  function renderTopLevel(listEl, all) {
    const top = all.filter(entry => !entry.in);
    const containers = top.filter(entry => api().isContainer(entry));
    // 裝備中固定依主手、副手、護甲、盾牌排列，穿戴中的物品（戒指、斗篷等）依物品欄順序排在後面。
    const equipped = [
      ...top.filter(entry => entry.slot).sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot)),
      ...top.filter(entry => entry.worn)
    ];
    const carried = top.filter(entry => !api().isContainer(entry) && !entry.slot && !entry.worn);
    const groups = [["equipped", "裝備中", equipped], ["carried", "身上", carried], ["container", "容器", containers]].filter(([, , entries]) => entries.length);
    let index = 0;
    groups.forEach(([group, title, entries]) => {
      if (groups.length > 1) listEl.appendChild(el("li", "inventory-group-label", title));
      entries.forEach(entry => renderEntry(entry, index++, listEl, all, group));
    });
  }

  function renderWeight() {
    const summary = document.getElementById("inventory-weight");
    if (!summary || !api()) return;
    const textOnly = api().isTextOnly();
    const hidden = weightHidden();
    const { weight } = api().getWeight();
    const coins = typeof globalScope.getCoinWeightPounds === "function" ? globalScope.getCoinWeightPounds() : 0;
    const capacity = typeof globalScope.getCarryCapacityPounds === "function" ? globalScope.getCarryCapacityPounds() : 0;
    const total = Math.round((weight + coins) * 100) / 100;
    const over = capacity > 0 && total > capacity && !textOnly;
    summary.hidden = textOnly || hidden;
    summary.classList.toggle("is-over", over);
    // 負重條自己會變色；關掉負重條時才另外顯示一行超重提示。
    const warning = document.getElementById("inventory-over");
    if (warning) warning.hidden = !over || overDismissed || !hidden;
    const weightToggle = document.getElementById("inventory-weight-toggle");
    weightToggle?.setAttribute("aria-pressed", String(!hidden));
    if (weightToggle) weightToggle.hidden = textOnly;
    const coinsToggle = document.getElementById("inventory-coins-toggle");
    coinsToggle?.setAttribute("aria-pressed", String(document.getElementById("money-count-weight")?.checked === true));
    renderMagicToggle();
    const row = el("span", "inventory-weight__row");
    const totalText = el("span", "inventory-weight__total");
    const rules = button("weapon-rule-link", "負重");
    rules.setAttribute("aria-haspopup", "dialog");
    rules.setAttribute("aria-label", "負重規則");
    rules.addEventListener("click", () => globalScope.openCarryCapacityRules?.(rules));
    totalText.append(rules, capacity > 0 ? ` ${formatPounds(total)}／${capacity} 磅` : ` ${formatPounds(total)} 磅`);
    if (capacity <= 0) totalText.title = "填入力量值後顯示上限";
    row.appendChild(totalText);
    if (over) row.appendChild(el("span", "inventory-weight__over", "超過上限"));
    const parts = [row];
    if (capacity > 0) {
      const bar = el("span", "inventory-weight__bar");
      bar.setAttribute("aria-hidden", "true");
      const fill = el("span", "inventory-weight__fill");
      fill.style.width = `${Math.min(100, Math.round(total / capacity * 1000) / 10)}%`;
      bar.appendChild(fill);
      parts.push(bar);
    }
    summary.replaceChildren(...parts);
  }

  function renderAttunement() {
    const { count, max, needed } = api().getAttunement();
    const hidden = !needed || api().isTextOnly();
    const summary = document.getElementById("inventory-attunement");
    if (summary) {
      summary.hidden = hidden;
      summary.textContent = `同調 ${count}/${max}`;
    }
    // 裝備頁標題列的「同調 N/3」按鈕（開同調視窗），出現條件與物品欄的同調數相同。
    const button = document.getElementById("attunement-open");
    if (button) {
      button.hidden = hidden;
      button.textContent = `同調 ${count}/${max}`;
    }
  }

  // 同調視窗比較的數字：屬性有效值與角色卡的幾個關鍵數值（讀畫面上已算好的值）。
  const ATTUNEMENT_ABILITY_LABELS = Object.freeze({ str: "力量", dex: "敏捷", con: "體質", int: "智力", wis: "感知", cha: "魅力" });
  const ATTUNEMENT_FIELDS = Object.freeze([
    ["ac-display", "AC"], ["hp-display", "最大生命"], ["speed-display", "速度"],
    ["spell-save-dc", "法術豁免 DC"], ["spell-attack-bonus", "法術攻擊"]
  ]);

  function readAttunementNumbers() {
    const abilities = Object.entries(ATTUNEMENT_ABILITY_LABELS).map(([id, label]) => [label, globalScope.getEffectiveAbilityValue?.(id) ?? ""]);
    const fields = ATTUNEMENT_FIELDS.map(([id, label]) => [label, String(document.getElementById(id)?.value ?? "").trim()]);
    return [...abilities, ...fields];
  }

  function describeAttunementChanges(before) {
    const after = new Map(readAttunementNumbers());
    const changes = before.filter(([label, value]) => after.get(label) !== value).map(([label, value]) => `${label} ${value || "—"} → ${after.get(label) || "—"}`);
    return changes.length ? `這次的變化：${changes.join("、")}` : "目前沒有數字變化。";
  }

  // 已同調的物品還需要什麼才會生效（穿戴、手持）；限定條件（例如「由法師」）只提示。
  function describeAttunementNeeds(entry) {
    const rule = globalScope.MagicItemCatalog.get(entry.magic.id);
    const use = globalScope.MagicItemCatalog.getUse(rule.id);
    const inHand = entry.slot === "mainHand" || entry.slot === "offHand";
    const needs = [];
    if (rule.base && !entry.slot) needs.push(rule.category === "armor" ? "要穿上才會生效。" : "要裝備在主手或副手才會生效。");
    else if (use === "held" && !inHand) needs.push("要拿在主手或副手才會生效。");
    else if (use === "worn" && !entry.worn) needs.push("要穿上才會生效。");
    else if (use === "wornOrHeld" && !entry.worn && !inHand) needs.push("要穿上或拿在手上才會生效。");
    if (typeof rule.attunement === "string") needs.push(`需${rule.attunement}同調，請自行確認。`);
    return needs.join("");
  }

  /**
   * 同調視窗（裝備頁的「同調 N/3」）：三格下拉只列物品欄裡需要同調的魔法物品，選了立刻生效（Inventory.setAttuned()），下方寫出數字變化
   * （和打開視窗時比）。同一種已在別格的物品不能選；一筆多件時選了先拆出一件再同調；開始同調時可以穿戴的物品照樣自動穿上。
   * 分享模式只列出目前同調的物品。格子的位置只在視窗內，不存檔。
   */
  function openAttunementDialog(trigger) {
    const max = api().LIMITS.attunement;
    const catalog = globalScope.MagicItemCatalog;
    const candidates = () => api().entries().filter(entry => entry.magic && catalog.get(entry.magic.id)?.attunement);
    const slots = candidates().filter(entry => entry.attuned).map(entry => entry.uid).slice(0, max);
    while (slots.length < max) slots.push("");
    const before = readAttunementNumbers();
    let body = null;
    let changeLine = null;
    const refreshChanges = () => {
      if (!changeLine) return;
      changeLine.textContent = describeAttunementChanges(before);
    };
    const choose = (index, uid) => {
      const previous = slots[index];
      if (previous === uid) return;
      if (previous) api().setAttuned(previous, false);
      let target = uid;
      const entry = uid ? api().getEntry(uid) : null;
      if (entry && entry.quantity > 1) {
        target = api().split(uid, entry.quantity - 1);
        if (!target) globalScope.AppDialog.notify(`物品欄最多 ${api().LIMITS.items} 筆，無法拆出一件同調，請先整理物品欄。`, { tone: "warning" });
      }
      const result = target ? api().setAttuned(target, true) : (uid ? "split" : "ok");
      if (result === "ok") slots[index] = target || "";
      else {
        if (ATTUNEMENT_REFUSALS[result]) globalScope.AppDialog.notify(ATTUNEMENT_REFUSALS[result], { tone: "warning" });
        if (previous && api().setAttuned(previous, true) !== "ok") slots[index] = "";
      }
      renderSlots();
    };
    const renderSlots = () => {
      if (!body) return;
      const list = candidates();
      const byUid = new Map(list.map(entry => [entry.uid, entry]));
      // 物品被移除或在別處結束同調時，那一格變回空的。
      slots.forEach((uid, index) => { if (uid && !byUid.get(uid)?.attuned) slots[index] = ""; });
      const rows = slots.map((uid, index) => {
        const row = el("div", "attunement-slot");
        const name = `第 ${index + 1} 格`;
        if (globalScope.SHARE_MODE) {
          row.classList.add("attunement-slot--readonly");
          row.append(el("span", "attunement-slot__label", name), el("span", "attunement-slot__value", uid ? api().getLabel(byUid.get(uid)) : "未同調"));
          return row;
        }
        const select = el("select", "attunement-slot__select");
        select.dataset.stateTransient = "true";
        select.setAttribute("aria-label", `同調${name}`);
        select.appendChild(new Option("— 不同調 —", ""));
        list.forEach((entry) => {
          const owner = slots.findIndex((other, otherIndex) => otherIndex !== index && other && byUid.get(other)?.magic.id === entry.magic.id);
          const stack = entry.quantity > 1 ? ` ×${entry.quantity}（選了拆一件）` : "";
          const option = new Option(`${api().getLabel(entry)}${stack}${owner >= 0 ? `（已在第 ${owner + 1} 格）` : ""}`, entry.uid);
          option.disabled = owner >= 0;
          select.appendChild(option);
        });
        select.value = uid;
        select.addEventListener("change", () => choose(index, select.value));
        row.append(labelled(name, select));
        const needs = uid ? describeAttunementNeeds(byUid.get(uid)) : "";
        if (needs) row.appendChild(el("p", "attunement-slot__note", needs));
        return row;
      });
      body.querySelector(".attunement-slots").replaceChildren(...rows);
      refreshChanges();
      // 角色卡的部分數字在事件之後才重算完，下一輪再比一次。
      setTimeout(refreshChanges, 0);
    };
    globalScope.AppDialog.showContent({
      title: "同調物品",
      variant: "attunement",
      trigger,
      initialFocus: "content",
      confirmLabel: "完成",
      renderContent(container) {
        body = container;
        body.appendChild(el("p", "inventory-item-note", globalScope.SHARE_MODE
          ? `最多同調 ${max} 件。分享模式只能查看同調狀態。`
          : `最多同調 ${max} 件，選了立刻生效。`));
        body.appendChild(el("div", "attunement-slots"));
        if (!globalScope.SHARE_MODE) {
          changeLine = el("p", "attunement-changes");
          changeLine.setAttribute("role", "status");
          changeLine.setAttribute("aria-live", "polite");
          body.appendChild(changeLine);
        }
        renderSlots();
      }
    });
  }

  // 「整理成標籤」只在選單裡（⋯ 上亮小點）；這時不顯示「物品欄還是空的」，避免跟下方文字矛盾。
  function syncTidy() {
    const panel = document.getElementById("inventory-panel");
    if (!panel || !api()) return;
    const textOnly = api().isTextOnly();
    const lines = textOnly ? [] : legacyLines();
    const canTidy = lines.length > 0;
    const tidy = document.getElementById("inventory-tidy");
    if (tidy) {
      tidy.hidden = !canTidy;
      tidy.textContent = canTidy ? `整理成標籤（${lines.reduce((sum, line) => sum + line.items.length, 0)} 項）` : "整理成標籤";
    }
    const dot = moreButton()?.querySelector(".inventory-more__dot");
    if (dot) dot.hidden = !canTidy;
    const empty = panel.querySelector(".inventory-empty");
    if (empty) empty.hidden = textOnly || canTidy || api().entries().length > 0;
  }

  function render() {
    const panel = document.getElementById("inventory-panel");
    // 拖曳中不重繪（拖曳的標籤就在清單裡），放開後再畫。
    if (!panel || !api() || rendering || drag?.started) return;
    rendering = true;
    try {
      const list = panel.querySelector("#inventory-tags");
      const all = api().entries();
      const uids = new Set(all.map(entry => entry.uid));
      [...expanded].forEach((uid) => { if (!uids.has(uid)) expanded.delete(uid); });
      const textOnly = api().isTextOnly();
      if (textOnly || !all.length) arranging = false;
      panel.classList.toggle("is-arranging", arranging);
      syncArrangeButton();
      const hint = document.getElementById("inventory-arrange-hint");
      if (hint) hint.hidden = !arranging;
      list.replaceChildren();
      if (!textOnly) renderTopLevel(list, all);
      list.hidden = textOnly;
      syncTidy();
      const add = document.getElementById("inventory-add");
      if (add) add.hidden = textOnly;
      const textOnlyButton = document.getElementById("inventory-text-only");
      textOnlyButton?.setAttribute("aria-pressed", String(textOnly));
      renderWeight();
      renderAttunement();
    } finally {
      rendering = false;
    }
  }

  function reducedMotion() {
    return globalScope.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
  }

  // 選單的「整理排列」在純文字管理或物品欄是空的時隱藏。
  function syncArrangeButton() {
    const arrangeButton = document.getElementById("inventory-arrange");
    if (!arrangeButton) return;
    arrangeButton.hidden = api().isTextOnly() || api().entries().length === 0;
    arrangeButton.setAttribute("aria-pressed", String(arranging));
  }

  // 開始整理時焦點到提示列的「完成」；結束時回到「⋯ 更多」。
  function setArranging(on, { focus = false } = {}) {
    const next = on === true && !api().isTextOnly() && api().entries().length > 0;
    if (next === arranging) return;
    cancelDrag();
    arranging = next;
    render();
    if (!focus) return;
    if (arranging) document.getElementById("inventory-arrange-done")?.focus();
    else moreButton()?.focus();
  }

  function itemUid(node) {
    return node?.dataset?.inventoryItem || "";
  }

  // 清單所在的容器 uid；最外層是空字串。
  function listOwner(list) {
    return itemUid(list.parentElement?.closest("[data-inventory-item]"));
  }

  function pillParts(item) {
    return [...item.children].filter(child => child.matches(".inventory-tag, .inventory-tag__toggle"));
  }

  // 標籤（容器連同展開鈕）的外框，判斷排在前後或放進容器用；展開的容器不含下一層內容物。
  function pillRect(item) {
    const rects = pillParts(item).map(part => part.getBoundingClientRect());
    const left = Math.min(...rects.map(rect => rect.left));
    const right = Math.max(...rects.map(rect => rect.right));
    return { left, right, width: right - left, top: Math.min(...rects.map(rect => rect.top)), bottom: Math.max(...rects.map(rect => rect.bottom)) };
  }

  // 拖曳中的標籤直接移到新位置，其他標籤從原位平滑移過去（FLIP）；巢狀標籤只補自己相對於上一層的位移。
  function moveSource(list, reference) {
    const items = [...document.querySelectorAll("#inventory-tags [data-inventory-item]")];
    const from = new Map(items.map(item => [item, item.getBoundingClientRect()]));
    items.forEach(item => item.getAnimations?.().forEach(animation => animation.cancel()));
    list.insertBefore(drag.item, reference);
    list.querySelector(":scope > .inventory-container-empty")?.setAttribute("hidden", "");
    if (reducedMotion()) return;
    const deltas = new Map(items.map((item) => {
      const to = item.getBoundingClientRect();
      return [item, [from.get(item).left - to.left, from.get(item).top - to.top]];
    }));
    items.forEach((item) => {
      const [dx, dy] = deltas.get(item);
      const [px, py] = deltas.get(item.parentElement.closest("[data-inventory-item]")) || [0, 0];
      if (Math.abs(dx - px) < 0.5 && Math.abs(dy - py) < 0.5) return;
      item.animate?.([{ transform: `translate(${dx - px}px, ${dy - py}px)` }, { transform: "none" }], { duration: 160, easing: "ease-out" });
    });
  }

  function placeSource(list, reference) {
    if (reference === drag.item || (drag.item.parentElement === list && drag.item.nextElementSibling === reference)) return;
    const owner = listOwner(list);
    if (owner && !drag.targets.has(owner)) return;
    moveSource(list, reference);
  }

  function setDropInto(uid) {
    if (drag.into === uid) return;
    document.querySelector(`#inventory-tags [data-inventory-item="${drag.into}"]`)?.classList.remove("is-drop-target");
    drag.into = uid;
    if (uid) document.querySelector(`#inventory-tags [data-inventory-item="${uid}"]`)?.classList.add("is-drop-target");
  }

  // 容器標籤除了最左一小段與展開鈕的右半，都算放進去；放不進去（層數上限）時照一般標籤排前後。
  function overContainerMiddle(item, x) {
    const [tag, toggle] = pillParts(item).map(part => part.getBoundingClientRect());
    if (!tag || !toggle || !drag.targets.has(itemUid(item))) return false;
    return x > tag.left + Math.max(8, tag.width / 4) && x < toggle.left + toggle.width / 2;
  }

  // 同名標籤的中段是合併，兩側才是排順序。
  function overTagMiddle(item, x) {
    const rect = pillParts(item)[0].getBoundingClientRect();
    const margin = Math.max(8, rect.width / 4);
    return x > rect.left + margin && x < rect.right - margin;
  }

  // 指到標籤：容器中間放進去，同名標籤中段合併，其他位置看在標籤前半或後半排在前或後；指到清單空白處且在最後一項之後就排到最後。
  function updateDropTarget() {
    const { x, y } = drag;
    const root = document.getElementById("inventory-tags");
    const hit = document.elementFromPoint(x, y);
    if (!hit || !root?.contains(hit) || drag.item.contains(hit)) {
      setDropInto("");
      return;
    }
    const item = hit.closest(".inventory-tag, .inventory-tag__toggle")?.parentElement;
    if (item?.dataset.inventoryItem) {
      if (item.classList.contains("is-container") && overContainerMiddle(item, x)) {
        setDropInto(itemUid(item));
        return;
      }
      if (drag.merges.has(itemUid(item)) && overTagMiddle(item, x)) {
        setDropInto(itemUid(item));
        return;
      }
      setDropInto("");
      const rect = pillRect(item);
      const after = y > rect.bottom || (y >= rect.top && x > rect.left + rect.width / 2);
      placeSource(item.parentElement, after ? item.nextElementSibling : item);
      return;
    }
    // 容器框的空白處（標籤以外）也算放進去。
    if (hit.matches(".inventory-tag-item.is-box") && drag.targets.has(itemUid(hit))) {
      setDropInto(itemUid(hit));
      return;
    }
    setDropInto("");
    const list = hit.closest(".inventory-tags");
    if (hit !== list && !hit.matches(".inventory-container-empty")) return;
    const last = [...list.children].filter(child => child.dataset.inventoryItem).pop();
    const rect = last?.getBoundingClientRect();
    if (!last || y > rect.bottom || (y >= rect.top && x > rect.right)) placeSource(list, null);
  }

  function scrollParent(node) {
    for (let current = node?.parentElement; current && current !== document.body; current = current.parentElement) {
      if (/(auto|scroll)/u.test(getComputedStyle(current).overflowY) && current.scrollHeight > current.clientHeight) return current;
    }
    return null;
  }

  // 拖到畫面（或捲動容器）上下邊緣時跟著捲動。
  function autoScroll() {
    if (!drag?.started) return;
    const box = drag.scroller?.getBoundingClientRect() || { top: 0, bottom: globalScope.innerHeight };
    const top = Math.max(box.top, 0) + 48;
    const bottom = Math.min(box.bottom, globalScope.innerHeight) - 48;
    const step = drag.y < top ? -Math.min(12, Math.ceil((top - drag.y) / 4)) : drag.y > bottom ? Math.min(12, Math.ceil((drag.y - bottom) / 4)) : 0;
    if (step) {
      (drag.scroller || globalScope).scrollBy(0, step);
      updateDropTarget();
    }
    drag.frame = globalScope.requestAnimationFrame(autoScroll);
  }

  function positionGhost() {
    drag.ghost.style.transform = `translate(${drag.x - drag.offsetX}px, ${drag.y - drag.offsetY}px) scale(1.06)`;
  }

  function startDrag() {
    const rect = pillRect(drag.item);
    const ghost = el("div", `inventory-tag-item inventory-drag-ghost${drag.item.classList.contains("is-container") ? " is-container" : ""}`);
    ghost.setAttribute("aria-hidden", "true");
    ghost.inert = true;
    ghost.style.width = `${rect.width}px`;
    pillParts(drag.item).forEach((part) => {
      const copy = part.cloneNode(true);
      copy.removeAttribute("data-inventory-uid");
      copy.removeAttribute("data-inventory-toggle");
      ghost.appendChild(copy);
    });
    Object.assign(drag, {
      started: true,
      ghost,
      offsetX: drag.startX - rect.left,
      offsetY: drag.startY - rect.top,
      targets: new Set(api().getContainerTargets(drag.uid).map(entry => entry.uid)),
      merges: new Set(api().getMergeTargets(drag.uid).map(entry => entry.uid)),
      scroller: scrollParent(drag.item)
    });
    document.body.appendChild(ghost);
    drag.item.classList.add("is-drag-source");
    document.getElementById("inventory-panel")?.classList.add("is-dragging");
    positionGhost();
    drag.frame = globalScope.requestAnimationFrame(autoScroll);
  }

  function onArrangePointerMove(event) {
    if (event.pointerId !== drag?.pointerId) return;
    drag.x = event.clientX;
    drag.y = event.clientY;
    if (!drag.started) {
      if (Math.hypot(drag.x - drag.startX, drag.y - drag.startY) < 6) return;
      startDrag();
    }
    event.preventDefault();
    positionGhost();
    updateDropTarget();
  }

  function stopDrag() {
    if (!drag) return false;
    document.removeEventListener("pointermove", onArrangePointerMove);
    document.removeEventListener("pointerup", onArrangePointerUp);
    document.removeEventListener("pointercancel", cancelDrag);
    globalScope.cancelAnimationFrame(drag.frame);
    drag.ghost?.remove();
    drag.item.classList.remove("is-drag-source");
    document.querySelectorAll("#inventory-tags .is-drop-target").forEach(item => item.classList.remove("is-drop-target"));
    document.getElementById("inventory-panel")?.classList.remove("is-dragging");
    const { started } = drag;
    drag = null;
    return started;
  }

  function cancelDrag(event) {
    if (event?.pointerId !== undefined && event.pointerId !== drag?.pointerId) return;
    if (stopDrag()) render();
  }

  function onArrangePointerUp(event) {
    if (event.pointerId !== drag?.pointerId) return;
    const { started, uid, item, into, merges } = drag;
    let next = item.nextElementSibling;
    while (next && !itemUid(next)) next = next.nextElementSibling;
    const target = into ? { into } : { into: listOwner(item.parentElement), before: itemUid(next) };
    stopDrag();
    if (!started) return;
    const merging = Boolean(into) && merges.has(into);
    if (merging && !api().merge(uid, into)) {
      globalScope.AppDialog?.notify(`一個標籤最多 ${api().LIMITS.quantity} 件，無法合併。`, { tone: "warning" });
    }
    if (!merging) api().move(uid, target);
    render();
    document.querySelector(`[data-inventory-uid="${merging && !api().getEntry(uid) ? into : uid}"]`)?.focus({ preventScroll: true });
  }

  function onArrangePointerDown(event) {
    if (!arranging || drag || event.button !== 0 || !event.isPrimary) return;
    const tag = event.target.closest?.(".inventory-tag");
    const item = tag?.parentElement;
    const fixed = api().getEntry(itemUid(item));
    if (!itemUid(item) || fixed?.slot || fixed?.worn) return;
    drag = { uid: itemUid(item), item, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, started: false, into: "", frame: 0 };
    document.addEventListener("pointermove", onArrangePointerMove);
    document.addEventListener("pointerup", onArrangePointerUp);
    document.addEventListener("pointercancel", cancelDrag);
  }

  // 鍵盤：左右（上下）方向鍵在畫面上的同一組前後移動，Esc 結束整理（拖曳中則取消這次拖曳）。
  function onArrangeKeydown(event) {
    if (!arranging) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (drag?.started) cancelDrag();
      else setArranging(false, { focus: true });
      return;
    }
    const uid = event.target.closest?.(".inventory-tag")?.dataset.inventoryUid;
    const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key];
    if (!uid || !step || drag) return;
    event.preventDefault();
    const entry = api().getEntry(uid);
    if (entry?.slot || entry?.worn) return;
    const itemEl = event.target.closest("[data-inventory-item]");
    const group = itemEl.dataset.inventoryGroup || "";
    const siblings = [...itemEl.parentElement.children].filter(child => itemUid(child) && (child.dataset.inventoryGroup || "") === group);
    const index = siblings.indexOf(itemEl) + step;
    if (index < 0 || index >= siblings.length) return;
    api().move(uid, { into: entry.in || "", before: step < 0 ? itemUid(siblings[index]) : itemUid(siblings[index + 1]) });
    document.querySelector(`[data-inventory-uid="${uid}"]`)?.focus();
  }

  // 只以文字管理物品：開啟時標籤轉成「物品欄：」行放進攜帶物品文字最上方；關閉時物品欄從已裝備的物品開始。
  async function toggleTextOnly(trigger) {
    const turningOn = !api().isTextOnly();
    if (turningOn && api().entries().length) {
      const confirmed = await globalScope.AppDialog?.requestDecision({
        title: "只以文字管理物品？",
        message: `物品標籤會轉成一行文字放進攜帶物品；自訂物品的磅數、描述與容器設定不會保留${api().entries().some(entry => entry.magic) ? "，魔法物品只留下名稱" : ""}。之後可以再按一次，用「整理成標籤」轉回。`,
        cancelLabel: "取消",
        confirmLabel: "轉成文字",
        trigger
      });
      if (!confirmed) return;
    }
    const text = api().setTextOnly(turningOn);
    const notes = document.getElementById("gear-notes");
    if (turningOn && text && notes) {
      notes.value = [`${TEXT_PREFIX}${text}`, notes.value].filter(Boolean).join("\n");
      notes.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (!turningOn) {
      api().ensureEquipped({
        mainHand: handFromInventory("main"),
        offHand: handFromInventory("off"),
        armor: fieldValue("armor"),
        shield: main2ShieldRequest()
      });
      syncEquippedSlots({ restoring: true });
    }
    trigger?.focus();
  }

  function init() {
    const panel = document.getElementById("inventory-panel");
    if (!panel || panel.dataset.inventoryReady === "true") return;
    panel.dataset.inventoryReady = "true";
    document.getElementById("inventory-add")?.addEventListener("click", event => openCustomDialog(event.currentTarget));
    document.getElementById("inventory-arrange")?.addEventListener("click", () => setArranging(!arranging, { focus: true }));
    document.getElementById("inventory-arrange-done")?.addEventListener("click", () => setArranging(false, { focus: true }));
    document.getElementById("inventory-tags")?.addEventListener("pointerdown", onArrangePointerDown);
    panel.addEventListener("keydown", onArrangeKeydown);
    // 選單收起後項目看不到，視窗關閉時焦點回到「⋯ 更多」。
    document.getElementById("inventory-tidy")?.addEventListener("click", () => openTidyDialog(moreButton()));
    document.getElementById("inventory-text-only")?.addEventListener("click", () => toggleTextOnly(moreButton()));
    document.getElementById("inventory-weight-toggle")?.addEventListener("click", () => setWeightHidden(!weightHidden()));
    const coins = document.getElementById("money-count-weight");
    document.getElementById("inventory-coins-toggle")?.addEventListener("click", () => {
      if (!coins) return;
      coins.checked = !coins.checked;
      coins.dispatchEvent(new Event("change", { bubbles: true }));
    });
    coins?.addEventListener("change", renderWeight);
    document.getElementById("inventory-magic-toggle")?.addEventListener("click", () => { void toggleMagicAcquire(); });
    magicAcquireField()?.addEventListener("change", renderMagicToggle);
    document.getElementById("inventory-over-hide")?.addEventListener("click", () => {
      overDismissed = true;
      renderWeight();
      moreButton()?.focus();
    });
    // 「⋯ 更多」：每次載入預設收起；會開視窗或改變模式的項目先收起選單、焦點回到 ⋯（capture 階段，早於項目自己的處理）。
    const more = moreButton();
    const tools = document.getElementById("inventory-heading-tools");
    const morePanel = document.getElementById("inventory-more-panel");
    more?.addEventListener("click", () => setMoreOpen(more.getAttribute("aria-expanded") !== "true"));
    morePanel?.addEventListener("click", (event) => {
      if (event.target.closest?.("[data-more-close]")) setMoreOpen(false, true);
    }, true);
    tools?.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || more?.getAttribute("aria-expanded") !== "true") return;
      event.preventDefault();
      event.stopPropagation();
      setMoreOpen(false, true);
    });
    tools?.addEventListener("focusout", (event) => {
      if (event.relatedTarget && !tools.contains(event.relatedTarget)) setMoreOpen(false);
    });
    document.addEventListener("pointerdown", (event) => {
      if (more?.getAttribute("aria-expanded") === "true" && !tools?.contains(event.target)) setMoreOpen(false);
    });
    document.addEventListener("inventory:change", render);
    document.addEventListener("inventory:change", event => watchMagicContainers(event.detail?.reason));
    ["visibilitychange", "focus", "pageshow"].forEach(name => (name === "visibilitychange" ? document : globalScope).addEventListener(name, checkDevourDue));
    watchMagicContainers("restore");
    document.getElementById("attunement-open")?.addEventListener("click", event => openAttunementDialog(event.currentTarget));
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest?.("[data-starting-equipment]");
      if (trigger) openStartingEquipmentDialog(trigger);
    });
    ["mainHand", "offHand", "armor", "main2Shield", "main2ShieldItem", "offHandAsMain", "str", "race"].forEach((id) => {
      document.getElementById(id)?.addEventListener("change", render);
    });
    ["money-balance-cp", "money-balance-sp", "money-balance-gp", "money-balance-pp", "money-balance-ep"].forEach((id) => {
      document.getElementById(id)?.addEventListener("change", renderWeight);
    });
    // 存檔還原只觸發 change，手動輸入觸發 input。
    ["input", "change"].forEach(eventName => document.getElementById("gear-notes")?.addEventListener(eventName, syncTidy));
    render();
  }

  // ===== 起始裝備（職業頁、背景頁的（A）（B）按鈕，data-starting-equipment）=====
  // 物品與金幣取自 classRules／backgroundRules 的 equipment；擇一物品在視窗當場選。物品以 source "initial" 放進物品欄、不自動裝備，
  // 只以文字管理物品時接在攜帶物品的「初始裝備：」行；金幣經 MoneyTracker.receiveGold() 記一筆收入。分享模式不能取得。
  // 聖徽的形式決定要不要手持，下拉右邊附整組說明；其他擇一物品不需要。
  const STARTING_CHOICES_WITH_DETAIL = new Set(["聖徽"]);

  function startingChoiceDetailButton(name) {
    const help = button("starting-equipment-detail", "說明");
    help.setAttribute("aria-haspopup", "dialog");
    help.setAttribute("aria-label", `查看${name}的說明`);
    help.addEventListener("click", () => {
      if (!globalScope.openEquipmentDetailDialog?.(name, help)) {
        globalScope.AppDialog.showMessage({ title: "物品詳情", message: "暫時無法讀取此物品的說明，請重新載入頁面後再試。", trigger: help });
      }
    });
    return help;
  }

  function toolGroupItem(choose, groupIds) {
    const groups = globalScope.ToolProficiencyCatalog?.groups || [];
    return { choose, from: groupIds.flatMap(id => groups.find(group => group.id === id)?.options || []) };
  }

  function startingEquipmentFor(trigger) {
    if (trigger.closest("#backgroundFeatures")) {
      const id = fieldValue("background");
      const rules = globalScope.getBackgroundRules?.(id);
      if (!rules?.equipment) return null;
      const group = typeof rules.tool === "object" ? (globalScope.ToolProficiencyCatalog?.groups || []).find(item => item.id === rules.tool.chooseFrom) : null;
      const items = rules.equipment.A.items.map(item => item.toolChoice ? toolGroupItem(`${group?.label || "工具"}擇一`, [rules.tool.chooseFrom]) : item);
      return { title: `${rules.name}背景裝備`, A: [{ id: "default", label: "", items, gold: rules.equipment.A.gold }], B: rules.equipment.B };
    }
    const id = fieldValue("class");
    const rules = globalScope.getClassRules?.(id);
    if (!rules?.equipment) return null;
    const A = rules.equipment.A.map(option => ({ ...option, items: option.items.map(item => item.tools ? toolGroupItem(item.choose, item.tools) : item) }));
    return { title: `${rules.name}初始裝備`, A, B: rules.equipment.B };
  }

  function startingItemLabel(item) {
    if (typeof item === "string") return item;
    return item.name || item.choose;
  }

  // 選好的組合 → 物品欄加入請求與文字（「初始裝備：」行）；擇一物品的選擇依序取自 choices。
  function startingEquipmentRequests(option, choices) {
    let choiceIndex = 0;
    return option.items.map((item) => {
      if (typeof item === "string") return { text: item };
      if (item.name) return { text: item.name, weight: item.weight };
      return { text: choices[choiceIndex++] };
    });
  }

  async function grantStartingEquipment(source, option, requests, label) {
    const inventory = api();
    const texts = requests.map(request => request.text);
    if (texts.length) {
      if (inventory.isTextOnly()) {
        const notes = document.getElementById("gear-notes");
        if (notes) {
          notes.value = [notes.value.replace(/\n+$/u, ""), `初始裝備：${texts.join("、")}`].filter(Boolean).join("\n");
          notes.dispatchEvent(new Event("input", { bubbles: true }));
        }
      } else if (!inventory.add(requests, { source: "initial" })) {
        globalScope.AppDialog.notify(`物品欄最多 ${inventory.LIMITS.items} 筆，請先整理物品欄再取得。`, { tone: "warning" });
        return false;
      }
    }
    if (option.gold && !(await globalScope.MoneyTracker?.receiveGold(option.gold, `${source.title}（${label}）`))) {
      globalScope.AppDialog.notify("金幣沒有記入錢袋，請到錢財區手動調整。", { tone: "warning" });
    }
    const gained = [texts.length ? (inventory.isTextOnly() ? "物品寫進攜帶物品" : "物品放進物品欄") : "", option.gold ? `金幣 +${option.gold}` : ""].filter(Boolean).join("，");
    globalScope.AppDialog.notify(`已取得${source.title}（${label}）：${gained}。`, { tone: "success" });
    return true;
  }

  function openStartingEquipmentDialog(trigger) {
    if (globalScope.SHARE_MODE || !globalScope.AppDialog || !api()) return;
    const source = startingEquipmentFor(trigger);
    const key = trigger.dataset.startingEquipment;
    if (!source || !["A", "B"].includes(key)) return;
    const label = key;
    if (key === "B") {
      globalScope.AppDialog.requestDecision({
        title: `取得${source.title}（B）`,
        message: `取得 ${source.B.gold} 金幣，在錢財區記一筆收入。`,
        cancelLabel: "取消",
        confirmLabel: "取得",
        trigger
      }).then(confirmed => confirmed && grantStartingEquipment(source, { gold: source.B.gold }, [], label));
      return;
    }
    const textOnly = api().isTextOnly();
    let selected = source.A.length === 1 ? source.A[0] : null;
    let error = null;
    let choiceBox = null;
    const renderChoices = () => {
      choiceBox.replaceChildren();
      if (!selected) return;
      const tags = el("ul", "inventory-tags inventory-tags--preview");
      selected.items.forEach((item) => {
        if (item.from) return;
        const text = startingItemLabel(item);
        const pack = api().getCatalogItem(api().parseItemText(text).itemId)?.pack;
        tags.appendChild(el("li", "inventory-tag inventory-tag--static", `${text}${pack ? "（拆成容器與內容物）" : ""}`));
      });
      if (selected.gold) tags.appendChild(el("li", "inventory-tag inventory-tag--static", `${selected.gold} 金幣`));
      choiceBox.appendChild(tags);
      selected.items.filter(item => item.from).forEach((item, index) => {
        const select = el("select", "starting-equipment-choice");
        select.dataset.startingChoice = String(index);
        select.append(new Option("請選擇", ""), ...item.from.map(name => new Option(name, name)));
        select.addEventListener("change", () => { if (error) error.textContent = ""; });
        const field = labelled(item.choose.replace(/擇一$/u, ""), select);
        if (STARTING_CHOICES_WITH_DETAIL.has(item.choose)) {
          const row = el("div", "starting-equipment-choice-row");
          row.append(field, startingChoiceDetailButton(item.choose));
          choiceBox.appendChild(row);
        } else {
          choiceBox.appendChild(field);
        }
      });
    };
    globalScope.AppDialog.showContent({
      title: `取得${source.title}（A）`,
      variant: "starting-equipment",
      trigger,
      initialFocus: "content",
      // 聖徽的說明視窗疊在這個視窗上，關閉後已選的項目還在。
      allowNested: true,
      renderContent(body) {
        body.appendChild(el("p", "inventory-item-note", textOnly
          ? "物品會寫進攜帶物品的「初始裝備：」行，金幣在錢財區記一筆收入。"
          : "物品會放進物品欄（不會自動裝備，請到裝備頁選擇），金幣在錢財區記一筆收入。"));
        if (source.A.length > 1) {
          const fieldset = el("fieldset", "starting-equipment-options");
          fieldset.appendChild(el("legend", "", "選擇一組裝備"));
          source.A.forEach((option) => {
            const radio = el("input");
            radio.type = "radio";
            radio.name = "starting-equipment-option";
            radio.value = option.id;
            radio.addEventListener("change", () => {
              selected = option;
              if (error) error.textContent = "";
              renderChoices();
            });
            const wrapper = el("label", "starting-equipment-option");
            wrapper.append(radio, document.createTextNode(option.label));
            fieldset.appendChild(wrapper);
          });
          body.appendChild(fieldset);
        }
        choiceBox = el("div", "starting-equipment-contents");
        body.appendChild(choiceBox);
        error = el("p", "starting-equipment-error");
        error.setAttribute("aria-live", "polite");
        body.appendChild(error);
        renderChoices();
      },
      actions: [
        { label: "取消", value: false },
        {
          label: "取得",
          intent: "primary",
          resolve: async () => {
            if (!selected) {
              error.textContent = "請先選擇一組裝備。";
              return false;
            }
            const selects = [...choiceBox.querySelectorAll("[data-starting-choice]")];
            const missing = selects.find(select => !select.value);
            if (missing) {
              error.textContent = "請選擇擇一的物品。";
              missing.focus();
              return false;
            }
            const requests = startingEquipmentRequests(selected, selects.map(select => select.value));
            return (await grantStartingEquipment(source, selected, requests, label)) ? "granted" : false;
          }
        }
      ]
    });
  }

  // ===== 魔法容器（內容檔的 container 詞）=====
  // 兩個異次元容器互放：依說明會摧毀兩件物品，這裡只提示、不刪除。載入存檔、匯入、開分享連結（restore）時不提示。
  let nestingSeen = new Set();

  function watchMagicContainers(reason) {
    if (!api()) return;
    const pairs = api().getExtradimensionalNesting();
    const keys = new Set(pairs.map(pair => `${pair.inner}>${pair.outer}`));
    if (reason !== "restore" && reason !== "mode") {
      pairs.filter(pair => !nestingSeen.has(`${pair.inner}>${pair.outer}`)).forEach((pair) => {
        const inner = api().getLabel(api().getEntry(pair.inner));
        const outer = api().getLabel(api().getEntry(pair.outer));
        globalScope.AppDialog?.notify(`把${inner}放進${outer}會立即摧毀兩件物品，並開啟通往星界的通道（見物品說明）。角色卡不會自動刪除，請和 DM 確認後自行處理。`, { tone: "warning" });
      });
    }
    nestingSeen = keys;
    syncDevourTimers(reason);
  }

  // 吞噬袋（container.devour）：使用者要求的隱藏彩蛋。裡面一有東西就以真實時間計時，到期才跳視窗（流程見 runDevourEvent）。
  // 計時的骰子（例如 2d6 分鐘）刻意不經 DiceRoller、不進擲骰歷史、不顯示也不提示玩家——使用者明確要求這樣做，
  // 是 AGENTS.md「DiceRoller 是擲骰與歷史的唯一入口」的例外。到期時間只在記憶體：重新整理、關閉頁面、載入另一個角色或匯入都重新計時；分享模式不計時。
  // 背景分頁或手機鎖屏時計時器會被放慢，所以回到頁面（visibilitychange／focus／pageshow）時再比對時鐘。
  const devourTimers = new Map();
  // 正在詢問要不要移除的吞噬袋：視窗開著時不重新計時。
  const devourPending = new Set();
  const DEVOUR_RETRY_MS = 1000;

  function rollHiddenMinutes(dice) {
    const match = /^(\d+)d(\d+)$/u.exec(String(dice || ""));
    if (!match) return 0;
    let total = 0;
    for (let index = 0; index < Number(match[1]); index += 1) total += 1 + Math.floor(Math.random() * Number(match[2]));
    return total;
  }

  function clearDevourTimer(uid) {
    const timer = devourTimers.get(uid);
    if (timer) globalScope.clearTimeout(timer.handle);
    devourTimers.delete(uid);
  }

  function armDevourTimer(uid, delay) {
    const timer = devourTimers.get(uid);
    if (!timer) return;
    globalScope.clearTimeout(timer.handle);
    timer.handle = globalScope.setTimeout(checkDevourDue, Math.max(0, Math.min(delay, 2147483647)));
  }

  function syncDevourTimers(reason) {
    if (["restore", "mode", "clear"].includes(reason)) [...devourTimers.keys()].forEach(clearDevourTimer);
    if (globalScope.SHARE_MODE === true || !api()) return;
    const all = api().entries();
    const filled = new Set();
    all.forEach((entry) => {
      const dice = api().getMagicContainer(entry)?.devour;
      // 只有自訂物品時沒有東西可吃，不計時（自訂物品會被吐出來）。
      if (!dice || !api().splitCustomContents(entry.uid).other.length) return;
      filled.add(entry.uid);
      if (devourTimers.has(entry.uid) || devourPending.has(entry.uid)) return;
      const minutes = rollHiddenMinutes(dice);
      if (!minutes) return;
      devourTimers.set(entry.uid, { due: Date.now() + minutes * 60000, handle: 0 });
      armDevourTimer(entry.uid, minutes * 60000);
    });
    [...devourTimers.keys()].filter(uid => !filled.has(uid)).forEach(clearDevourTimer);
  }

  function checkDevourDue() {
    const now = Date.now();
    devourTimers.forEach((timer, uid) => {
      if (timer.due > now) armDevourTimer(uid, timer.due - now);
      else devour(uid);
    });
  }

  function devour(uid) {
    // 開著其他視窗時先等它關掉（新視窗會關掉舊的）；頁面在背景時等回到頁面。
    if (!globalScope.AppDialog || document.documentElement.classList.contains("app-dialog-open") || document.visibilityState === "hidden") {
      armDevourTimer(uid, DEVOUR_RETRY_MS);
      return;
    }
    const entry = api().getEntry(uid);
    clearDevourTimer(uid);
    if (!entry) return;
    const label = api().getLabel(entry);
    if (!api().splitCustomContents(uid).other.length) return;
    devourPending.add(uid);
    // 明細列出袋子裡全部的東西（自訂物品也列，讓玩家以為全沒了）；自訂物品要到結局之後才說吐出來。
    const eaten = api().formatContents(uid);
    runDevourEvent(uid, label, eaten).catch(() => {}).then(() => {
      devourPending.delete(uid);
      syncDevourTimers("");
    });
  }

  // 吞噬袋到期的彩蛋流程（使用者設計）：
  // 「伸手搶救」或「放棄」→ 放棄就移除被吃的物品；搶救時 50%（內部亂數，不提示）搶回、物品放回身上，
  // 否則角色被吞進去，按「掙脫逃命」擲運動（力量）檢定 1d20＋運動技能欄（空白或不是數字當 0），擲骰功能關閉也播放骰子動畫。
  // 15 以上爬出來；低於 15 時亮暗反轉（經網站既有的亮暗切換按鈕，和玩家手動切換一樣記住）並跳出對應的視窗。被吞時物品一律移除，角色資料其他部分不變。
  // 只吃目錄物品與魔法物品；自訂物品（玩家的名稱、描述）不吃（使用者決定，備註才不會消失）。玩家做出選擇時才改物品欄：先把自訂物品連同裡面的東西
  // 移到身上、再移除其餘內容物，所以中途重新整理不會讓自訂物品消失。「吐出來」的視窗放在放棄或被吞的結局之後（「吐出來要在你掛了之後，不然就嚇不到人了」），搶回不跳。
  const DEVOUR_ESCAPE_DC = 15;
  const forcedChoice = { showCloseButton: false, onEscape: () => false, dismissOnBackdrop: false };

  async function runDevourEvent(uid, label, eaten) {
    const dialog = globalScope.AppDialog;
    // 吃掉：自訂物品先回到身上，再移除其餘內容物；回傳吐出來的物品文字（沒有時為空字串）。
    const devourContents = () => {
      const custom = api().splitCustomContents(uid).custom;
      const spat = custom.map(item => api().formatItem(item)).join("、");
      custom.forEach(item => api().move(item, { into: "" }));
      api().emptyContainer(uid);
      return spat;
    };
    const showSpat = spat => (spat ? dialog.showMessage({ title: label, message: `……${label}似乎不喜歡這個味道，把${spat}吐了出來。` }) : null);
    const choice = await dialog.requestDecision({
      ...forcedChoice,
      title: label,
      message: `${label}吃掉了你的道具！`,
      renderContent: body => body.appendChild(el("p", "", eaten)),
      actions: [
        { label: "放棄", value: "give-up" },
        { label: "伸手搶救", intent: "primary", value: "rescue" }
      ]
    });
    if (choice !== "rescue") {
      await showSpat(devourContents());
      return;
    }
    if (Math.random() >= 0.5) {
      api().childrenOf(uid).forEach(child => api().move(child.uid, { into: "" }));
      await dialog.showMessage({ title: label, message: "你搶回了道具！", renderContent: body => body.appendChild(el("p", "", `放回身上：${eaten}`)) });
      return;
    }
    await dialog.requestDecision({
      ...forcedChoice,
      title: label,
      message: "袋口猛然張大，一股吸力把你整個人拖了進去！黑暗中，有什麼東西正在慢慢蠕動……",
      actions: [{ label: "掙脫逃命", intent: "primary", value: "escape" }]
    });
    const total = await rollDevourEscape();
    const spat = devourContents();
    if (total >= DEVOUR_ESCAPE_DC) {
      await dialog.showMessage({ title: label, message: "你驚險地從袋口爬了出來，道具仍是被吃掉了。" });
      await showSpat(spat);
      return;
    }
    const wasDark = document.documentElement.dataset.theme === "dark";
    document.getElementById("color-mode-toggle")?.click();
    // 「你  掛  了」照使用者原文保留空格：訊息放在保留空白的段落。
    const text = wasDark ? "你不知身處何處，四周都是亮光，啊，那是靈魂之河..." : "你  掛  了";
    await dialog.showMessage({
      title: label,
      renderContent: (body) => {
        const message = el("p", "", text);
        message.style.whiteSpace = "pre-wrap";
        body.appendChild(message);
      }
    });
    await showSpat(spat);
  }

  // 運動（力量）檢定：1d20＋角色卡運動技能欄的值（空白或不是數字當 0）。擲骰與動畫經 DiceRoller（擲骰功能關閉也播放，照常進擲骰紀錄）。
  async function rollDevourEscape() {
    const raw = Number(String(document.getElementById("skill-運動")?.value ?? "").trim().replace(/^＋/u, "+"));
    const bonus = Number.isFinite(raw) ? Math.trunc(raw) : 0;
    const expression = bonus ? `1d20${bonus > 0 ? "+" : "-"}${Math.abs(bonus)}` : "1d20";
    const result = await globalScope.DiceRoller?.rollAnimated?.(expression, { label: "運動（力量）檢定", title: "掙脫逃命", force: true });
    if (result) return result.total;
    // 擲骰器不存在時（理論上不會）仍要有結果。
    const fallback = 1 + Math.floor(Math.random() * 20) + bonus;
    globalScope.AppDialog?.notify(`運動（力量）檢定：${fallback}`, { tone: "info" });
    return fallback;
  }

  globalScope.InventoryUI = Object.freeze({ render, renderWeight, openCustomDialog, openItemDialog, openAttunementDialog, syncEquippedSlots, buildStepper, buildBonusTransferControl });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(typeof window !== "undefined" ? window : globalThis);

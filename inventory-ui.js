/**
 * 物品欄介面（傳統 defer script，無額外 runtime dependency）。
 *
 * - 掛在攜帶物品區的 #inventory-panel 與標題列的 #inventory-heading-tools（跑團模式時隨攜帶物品文字框一起搬移，見 tabletop-mode.js）。
 * - 標籤：[匕首 ×2]；容器標籤可展開，內容物排在下一層。點標籤開啟 `inventory-item` 視窗：目錄物品先顯示與商店相同的說明
 *   （search.js 的 renderEquipmentDetailInto()），下方「持有」區調整數量、位置或刪除。
 *   持有區標題行下方是互動列（buildItemActions()，資料取自 equipment-data.js 的 EQUIPMENT_ITEM_ACTIONS）：武器／護甲／盾牌的裝備與卸除
 *   （寫回裝備頁下拉）、工具與撬棍的檢定、醫療包的使用次數、治療藥水飲用回復生命值、投擲物與毒藥；檢定與傷害骰只在擲骰功能開啟時顯示。
 *   目錄物品由商店（equipment-shop.js）購買或免費取得；這裡只建立自訂物品（`inventory-custom` 視窗，名稱、磅數、數量、位置、描述）。
 *   資料一律經 window.Inventory。
 * - 標題列齒輪展開 #inventory-tools（負重、「自訂物品」與「只以文字管理物品」）並在齒輪左側顯示 🤚（整理），每次載入預設收起。
 * - 🤚 整理模式：標籤輕微抖動，點標籤不開視窗；拖曳（Pointer Events，滑鼠與觸控相同）調整順序，拖到容器標籤上放進去，
 *   展開容器後可在內容物之間排列或拖出。鍵盤用左右方向鍵在同一處前後移動。順序就是物品欄的資料順序（Inventory.move()）。
 *   再按 🤚、Esc、收起齒輪或切到純文字管理時結束。
 * - 「只以文字管理物品」按下時標籤轉成攜帶物品文字的「物品欄：」行並清空物品欄，標籤、負重與整理功能都隱藏；
 *   再按一次回到標籤，物品欄從已裝備的物品開始，其餘由「整理成標籤」轉回。
 * - 「整理成標籤」只在攜帶物品文字有「物品欄：」「購買物品：」「初始裝備：」行時出現，預覽後由玩家確認才轉成標籤並移除那幾行；
 *   因裝備而補上的物品先抵掉同名數量，不重複加入。
 * - 負重：物品＋硬幣重量對照 index.html 的 getCarryCapacityPounds()，超過時只提示，不改速度；提示不受齒輪收合影響，
 *   按「隱藏」後到重新整理前不再顯示。
 * - 展開與隱藏狀態只留在記憶體；視窗內的輸入框不設 id，不會進角色 JSON、分享或 autosave。
 */
(function (globalScope) {
  "use strict";

  const TEXT_PREFIX = "物品欄：";
  const LEGACY_PREFIXES = Object.freeze([[TEXT_PREFIX, ""], ["購買物品：", ""], ["初始裝備：", "initial"]]);
  const expanded = new Set();
  let rendering = false;
  let overDismissed = false;
  let arranging = false;
  let drag = null;

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
    return `${api().getLabel(entry)}${entry.quantity > 1 ? ` ×${entry.quantity}` : ""}`;
  }

  // 齒輪收起或只以文字管理時「自訂物品」看不到，焦點改回齒輪。
  function fallbackFocusTarget() {
    const add = document.getElementById("inventory-add");
    return document.getElementById("inventory-tools")?.hidden === false && add && !add.hidden
      ? add
      : document.getElementById("inventory-gear");
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

  // 目前裝備用到的物品：weapon:<武器名稱>、armor:<護甲名稱>、shield。
  function equippedUsage() {
    const usage = new Map();
    const bump = key => usage.set(key, (usage.get(key) || 0) + 1);
    const mainHand = handFromInventory("main");
    const offHand = handFromInventory("off");
    if (mainHand && mainHand !== "武藝") bump(`weapon:${mainHand}`);
    if (offHand === "盾牌") bump("shield");
    else if (offHand && offHand !== "武藝") bump(`weapon:${offHand}`);
    if (document.getElementById("main2Shield")?.checked && document.getElementById("offHandAsMain")?.checked) bump("shield");
    if (fieldValue("armor")) bump(`armor:${fieldValue("armor")}`);
    return usage;
  }

  function usageKey(entry) {
    const item = api().getCatalogItem(entry?.itemId);
    if (!item) return "";
    if (item.kind === "shield") return "shield";
    if (item.kind === "armor") return `armor:${item.id}`;
    return item.wieldedAs ? `weapon:${item.wieldedAs}` : "";
  }

  function availableCounts() {
    const counts = new Map();
    const { weapons, armors, shields } = api().getEquippableCounts();
    weapons.forEach((count, name) => counts.set(`weapon:${name}`, count));
    armors.forEach((count, name) => counts.set(`armor:${name}`, count));
    if (shields) counts.set("shield", shields);
    return counts;
  }

  function isEntryEquipped(entry) {
    const key = usageKey(entry);
    return Boolean(key) && (equippedUsage().get(key) || 0) > 0;
  }

  // 減少或移除物品後，數量不足的裝備欄位；loss 是每個 usage key 會少掉的件數。
  function slotsLosingItems(loss) {
    const usage = equippedUsage();
    const counts = availableCounts();
    const affected = [];
    loss.forEach((amount, key) => {
      if (!amount || !usage.has(key)) return;
      if ((counts.get(key) || 0) - amount < usage.get(key)) affected.push(key);
    });
    return affected;
  }

  function unequip(keys) {
    const offHandAsMain = document.getElementById("offHandAsMain")?.checked;
    const clear = (id) => {
      const select = document.getElementById(id);
      if (!select || select.disabled || !select.value) return;
      select.value = "";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    };
    keys.forEach((key) => {
      if (key === "shield") {
        const shieldToggle = document.getElementById("main2Shield");
        if (offHandAsMain && shieldToggle?.checked) {
          shieldToggle.checked = false;
          shieldToggle.dispatchEvent(new Event("change", { bubbles: true }));
        }
        if (fieldValue("offHand") === "盾牌") clear("offHand");
        return;
      }
      const [kind, name] = [key.slice(0, key.indexOf(":")), key.slice(key.indexOf(":") + 1)];
      if (kind === "armor" && fieldValue("armor") === name) clear("armor");
      if (kind === "weapon") {
        if (fieldValue("offHand") === name) clear("offHand");
        else if (fieldValue("mainHand") === name) clear("mainHand");
      }
    });
  }

  function slotLabel(key) {
    if (key === "shield") return "盾牌";
    return key.slice(key.indexOf(":") + 1);
  }

  async function confirmUnequip(keys, trigger) {
    if (!keys.length) return true;
    const confirmed = await globalScope.AppDialog.requestDecision({
      title: "同時卸下裝備？",
      message: `${keys.map(slotLabel).join("、")}正在裝備中，數量不足後會一併卸下。`,
      cancelLabel: "取消",
      confirmLabel: "卸下並繼續",
      trigger
    });
    if (confirmed) unequip(keys);
    return Boolean(confirmed);
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

  // 武器只有一件且在另一手時先從另一手卸下（換手）；勾選「契約」的那一手不從物品欄拿，不算。
  function equipWeapon(name, handId) {
    const otherId = handId === "mainHand" ? "offHand" : "mainHand";
    const otherHand = otherId === "mainHand" ? "main" : "off";
    const owned = api().getEquippableCounts().weapons.get(name) || 0;
    if (fieldValue(otherId) === name && !globalScope.isPactWeaponListHand?.(otherHand) && owned < 2) setSlot(otherId, "");
    return setSlot(handId, name);
  }

  async function openEquipWeaponDialog(entry, trigger) {
    const name = api().getCatalogItem(entry.itemId)?.wieldedAs;
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
    if (!equipWeapon(name, result)) {
      globalScope.AppDialog.notify(`無法把${name}裝備在${result === "mainHand" ? "主手" : offLabel}，請到裝備頁調整。`, { tone: "warning" });
    }
  }

  async function equipArmor(name, trigger) {
    const current = fieldValue("armor");
    if (current && current !== name) {
      const confirmed = await globalScope.AppDialog.requestDecision({
        title: "更換護甲？",
        message: `目前穿著${current}，要換成${name}嗎？`,
        cancelLabel: "取消",
        confirmLabel: "更換",
        trigger
      });
      if (!confirmed) return;
    }
    if (!setSlot("armor", name)) globalScope.AppDialog.notify(`無法穿上${name}，請到裝備頁調整。`, { tone: "warning" });
  }

  async function equipShield(trigger) {
    if (globalScope.isOffHandAlternateMain?.()) {
      const toggle = document.getElementById("main2Shield");
      if (!toggle || !globalScope.isMain2ShieldEligible?.()) {
        globalScope.AppDialog.notify("副手設為另一把主手武器時，需要盾牌熟練且兩手都不是雙手武器，才能裝備盾牌。", { tone: "warning" });
        return;
      }
      toggle.checked = true;
      toggle.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    const offHand = document.getElementById("offHand");
    if (!offHand || offHand.disabled) {
      globalScope.AppDialog.notify(`主手的${handState("mainHand")}佔用雙手，無法裝備盾牌。`, { tone: "warning" });
      return;
    }
    if (offHand.value && offHand.value !== "盾牌") {
      const confirmed = await globalScope.AppDialog.requestDecision({
        title: "更換副手？",
        message: `副手目前是${handState("offHand")}，要換成盾牌嗎？`,
        cancelLabel: "取消",
        confirmLabel: "更換",
        trigger
      });
      if (!confirmed) return;
    }
    if (!setSlot("offHand", "盾牌")) globalScope.AppDialog.notify("無法裝備盾牌，請到裝備頁調整。", { tone: "warning" });
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
    if (buttons.length) {
      const group = el("div", "inventory-action-row__buttons");
      group.append(...buttons);
      row.appendChild(group);
    }
    return row;
  }

  /**
   * 持有區的互動列：裝備／卸除、檢定、使用次數、飲用、投擲與塗抹。ctx.afterUse(result) 在數量或次數改變後同步視窗。
   * 檢定與傷害骰只在擲骰功能開啟時顯示。回傳 null 表示這件物品沒有互動。
   */
  function buildItemActions(entry, ctx) {
    const item = api().getCatalogItem(entry.itemId);
    if (!item) return null;
    const actions = itemActions(entry) || {};
    const label = api().getLabel(entry);
    const rows = [];
    const key = usageKey(entry);
    if (key) {
      const equipped = isEntryEquipped(entry);
      const equip = actionButton("裝備", (control) => {
        if (key === "shield") equipShield(control);
        else if (key.startsWith("armor:")) equipArmor(item.id, control);
        else openEquipWeaponDialog(entry, control);
      }, `裝備${label}`);
      // 武器已裝備時仍可換手或拿第二把，盾牌與護甲裝備中只留卸除。
      const showEquip = !equipped || key.startsWith("weapon:");
      const remove = equipped ? actionButton("卸除", () => unequip([key]), `卸除${label}`) : null;
      rows.push(actionRow("", showEquip ? equip : null, remove));
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
      const damage = diceEnabled()
        ? actionButton(`${actions.coating.damageType}傷害 ${actions.coating.damage}`, () => {
          globalScope.DiceRoller?.rollExpression?.(actions.coating.damage, { label: `${label}${actions.coating.damageType}傷害` });
        }, `擲${label}的${actions.coating.damageType}傷害`)
        : null;
      rows.push(actionRow(`命中時額外 ${actions.coating.damage} ${actions.coating.damageType}傷害。`, coat, damage));
    }
    if (!rows.length) return null;
    const section = el("div", "inventory-item-actions");
    section.append(...rows);
    return section;
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
  function buildStepper(value, label, { min = 1 } = {}) {
    const wrap = el("div", "inventory-stepper");
    const minus = button("inventory-stepper__button", "−");
    minus.setAttribute("aria-label", `減少${label}`);
    const input = el("input", "inventory-stepper__input");
    input.type = "number";
    input.min = String(min);
    input.max = String(api().LIMITS.quantity);
    input.step = "1";
    input.inputMode = "numeric";
    input.value = String(value);
    input.dataset.stateTransient = "true";
    input.setAttribute("aria-label", label);
    const plus = button("inventory-stepper__button", "＋");
    plus.setAttribute("aria-label", `增加${label}`);
    const read = () => {
      const parsed = Math.floor(Number(input.value));
      return Math.min(api().LIMITS.quantity, Math.max(min, Number.isFinite(parsed) && input.value.trim() !== "" ? parsed : 1));
    };
    minus.addEventListener("click", () => { input.value = String(Math.max(min, read() - 1)); });
    plus.addEventListener("click", () => { input.value = String(Math.min(api().LIMITS.quantity, read() + 1)); });
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
    const removed = [entry, ...(keepContents ? [] : contents.map(uid => api().getEntry(uid)).filter(Boolean))];
    const loss = new Map();
    removed.forEach((item) => {
      const key = usageKey(item);
      if (key) loss.set(key, (loss.get(key) || 0) + item.quantity);
    });
    if (!(await confirmUnequip(slotsLosingItems(loss), trigger))) return false;
    return api().remove(entry.uid, { keepContents });
  }

  function openItemDialog(uid, trigger) {
    const entry = api().getEntry(uid);
    if (!entry || !globalScope.AppDialog) return;
    const custom = !entry.itemId;
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
        // 目錄物品先顯示與商店相同的說明（search.js），下方「持有」區調整數量與位置；自訂與通稱物品只有持有區。
        const hasDetail = Boolean(item && !item.generic && globalScope.renderEquipmentDetailInto?.(body, entry.itemId));
        const holding = el("section", "inventory-holding");
        holding.classList.toggle("has-detail", hasDetail);
        holding.setAttribute("aria-label", "持有");
        const meta = el("p", "inventory-item-meta");
        meta.appendChild(el("span", "inventory-holding__title", "持有"));
        // 說明已列單件重量，只有一件時不重複。
        const weight = el("span", "inventory-holding__weight", weightDescription(entry));
        if (!hasDetail || entry.quantity > 1) meta.appendChild(weight);
        const badge = el("span", "inventory-tag__badge", "裝備中");
        badge.hidden = !isEntryEquipped(entry);
        meta.append(badge);
        holding.appendChild(meta);
        // 互動列：裝備變動（含疊在上面的確認視窗之後）或用掉物品時重建；數量同步到下方的數量欄，用完時關閉視窗。
        let actionsSection = null;
        const refreshActions = () => {
          const current = api().getEntry(uid);
          if (!current) return;
          badge.hidden = !isEntryEquipped(current);
          const next = buildItemActions(current, {
            afterUse(used) {
              if (used.removed) {
                dialog.close("removed");
                return;
              }
              if (controls?.stepper) controls.stepper.input.value = String(used.quantity);
              const latest = api().getEntry(uid);
              if (latest) {
                weight.textContent = weightDescription(latest);
                if (latest.quantity > 1 && !weight.isConnected) badge.before(weight);
              }
              refreshActions();
            }
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
          if (["mainHand", "offHand", "armor", "main2Shield", "offHandAsMain"].includes(event.target?.id)) refreshActions();
        };
        document.addEventListener("change", onSlotChange);
        stopWatching = () => document.removeEventListener("change", onSlotChange);
        const contents = api().descendantsOf(uid).length;
        if (api().isContainer(entry)) holding.appendChild(el("p", "inventory-item-note", contents ? `內含 ${contents} 項物品；容器不會減輕內容物的重量。` : "可以放入其他物品；容器不會減輕內容物的重量。"));
        // 自訂物品：名稱與磅數一列，數量與位置一列，描述自成一列。
        const fields = custom ? buildCustomFields(entry) : null;
        if (fields) holding.appendChild(fields.nameRow);
        const row = el("div", "inventory-holding__row");
        const stepper = buildStepper(entry.quantity, "數量", { min: 0 });
        if (api().isContainer(entry)) stepper.wrap.hidden = true;
        else row.appendChild(labelled("數量", stepper.wrap));
        const location = buildLocationSelect(uid, entry.in);
        row.appendChild(labelled("位置", location));
        holding.appendChild(row);
        if (fields) holding.append(fields.desc, fields.toggleLabel);
        body.appendChild(holding);
        controls = { stepper, location, ...fields };
      },
      actions: [
        { label: "刪除", intent: "danger", resolve: async () => (await removeEntry(entry, trigger)) ? "removed" : false },
        { label: "取消", value: false },
        {
          label: "完成",
          intent: "primary",
          resolve: async () => {
            const quantity = api().isContainer(entry) ? entry.quantity : controls.stepper.read();
            if (quantity === 0) {
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
              return (await removeEntry(entry, trigger)) ? "removed" : false;
            }
            const key = usageKey(entry);
            if (key && quantity < entry.quantity && !(await confirmUnequip(slotsLosingItems(new Map([[key, entry.quantity - quantity]])), trigger))) return false;
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
            const label = parsed.name || api().getLabel({ itemId: parsed.itemId });
            const pack = api().getCatalogItem(parsed.itemId)?.pack;
            const note = node.children ? `（內含 ${node.children.length} 項）` : pack ? "（拆成容器與內容物）" : "";
            const tag = el("li", "inventory-tag inventory-tag--static", `${label}${parsed.quantity > 1 ? ` ×${parsed.quantity}` : ""}${note}`);
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
      // 轉換後「整理成標籤」會隱藏，焦點改到「自訂物品」或齒輪。
      onClose: result => {
        if (result === "tidied") globalScope.setTimeout(() => fallbackFocusTarget()?.focus(), 0);
      }
    });
  }

  function renderEntries(parentUid, listEl, all, usage) {
    all.filter(entry => (entry.in || "") === parentUid).forEach((entry, index) => {
      const item = el("li", "inventory-tag-item");
      item.dataset.inventoryItem = entry.uid;
      // 抖動錯開相位，看起來不會整排同步。
      item.style.setProperty("--inventory-jiggle-delay", `${-((index * 7) % 5) * 0.05}s`);
      const tag = button("inventory-tag", entryText(entry));
      tag.dataset.inventoryUid = entry.uid;
      if (arranging) tag.title = "拖曳或用方向鍵調整順序";
      else {
        tag.setAttribute("aria-haspopup", "dialog");
        tag.title = "調整數量、位置或刪除";
      }
      const key = usageKey(entry);
      if (key && usage.get(key)) {
        tag.classList.add("is-equipped");
        tag.append(el("span", "inventory-tag__badge", "裝備中"));
      }
      if (!entry.itemId) tag.classList.add("is-custom");
      tag.addEventListener("click", () => { if (!arranging) openItemDialog(entry.uid, tag); });
      item.appendChild(tag);
      if (api().isContainer(entry)) {
        const children = all.filter(child => child.in === entry.uid);
        const isOpen = expanded.has(entry.uid);
        item.classList.add("is-container");
        item.classList.toggle("is-expanded", isOpen);
        const toggle = button("inventory-tag__toggle", `${isOpen ? "▾" : "▸"} ${children.length}`);
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
        if (isOpen) {
          const nested = el("ul", "inventory-tags inventory-container-contents");
          nested.setAttribute("aria-label", `${api().getLabel(entry)}的內容物`);
          if (children.length) renderEntries(entry.uid, nested, all, usage);
          else nested.appendChild(el("li", "inventory-container-empty", "空的"));
          item.appendChild(nested);
        }
      }
      listEl.appendChild(item);
    });
  }

  function renderWeight() {
    const summary = document.getElementById("inventory-weight");
    if (!summary || !api()) return;
    const { weight } = api().getWeight();
    const coins = typeof globalScope.getCoinWeightPounds === "function" ? globalScope.getCoinWeightPounds() : 0;
    const capacity = typeof globalScope.getCarryCapacityPounds === "function" ? globalScope.getCarryCapacityPounds() : 0;
    const total = Math.round((weight + coins) * 100) / 100;
    const over = capacity > 0 && total > capacity && !api().isTextOnly();
    summary.classList.toggle("is-over", over);
    const warning = document.getElementById("inventory-over");
    if (warning) warning.hidden = !over || overDismissed;
    const totalText = el("span", "inventory-weight__total");
    const rules = button("weapon-rule-link", "負重");
    rules.setAttribute("aria-haspopup", "dialog");
    rules.setAttribute("aria-label", "負重規則");
    rules.addEventListener("click", () => globalScope.openCarryCapacityRules?.(rules));
    totalText.append(rules, capacity > 0 ? ` ${formatPounds(total)}／${capacity} 磅` : ` ${formatPounds(total)} 磅（填入力量值後顯示上限）`);
    summary.replaceChildren(totalText);
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
      if (textOnly) arranging = false;
      panel.classList.toggle("is-arranging", arranging);
      syncArrangeButton();
      const hint = document.getElementById("inventory-arrange-hint");
      if (hint) hint.hidden = !arranging;
      list.replaceChildren();
      if (!textOnly) renderEntries("", list, all, equippedUsage());
      list.hidden = textOnly;
      panel.querySelector(".inventory-empty").hidden = textOnly || all.length > 0;
      const tidy = document.getElementById("inventory-tidy");
      if (tidy) tidy.hidden = textOnly || legacyLines().length === 0;
      ["inventory-weight", "inventory-add"].forEach((id) => {
        const element = document.getElementById(id);
        if (element) element.hidden = textOnly;
      });
      const textOnlyButton = document.getElementById("inventory-text-only");
      textOnlyButton?.setAttribute("aria-pressed", String(textOnly));
      textOnlyButton?.classList.toggle("is-pressed", textOnly);
      renderWeight();
    } finally {
      rendering = false;
    }
  }

  function reducedMotion() {
    return globalScope.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
  }

  // 🤚 在標題列齒輪左側，齒輪展開且不是純文字管理時才出現。
  function syncArrangeButton() {
    const arrangeButton = document.getElementById("inventory-arrange");
    if (!arrangeButton) return;
    arrangeButton.hidden = api().isTextOnly() || document.getElementById("inventory-gear")?.getAttribute("aria-expanded") !== "true";
    arrangeButton.setAttribute("aria-pressed", String(arranging));
  }

  function setArranging(on) {
    const next = on === true && !api().isTextOnly();
    if (next === arranging) return;
    cancelDrag();
    arranging = next;
    render();
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

  // 指到標籤：容器中間放進去，其他位置看在標籤前半或後半排在前或後；指到清單空白處且在最後一項之後就排到最後。
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
      setDropInto("");
      const rect = pillRect(item);
      const after = y > rect.bottom || (y >= rect.top && x > rect.left + rect.width / 2);
      placeSource(item.parentElement, after ? item.nextElementSibling : item);
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
    const { started, uid, item, into } = drag;
    let next = item.nextElementSibling;
    while (next && !itemUid(next)) next = next.nextElementSibling;
    const target = into ? { into } : { into: listOwner(item.parentElement), before: itemUid(next) };
    stopDrag();
    if (!started) return;
    api().move(uid, target);
    render();
    document.querySelector(`[data-inventory-uid="${uid}"]`)?.focus({ preventScroll: true });
  }

  function onArrangePointerDown(event) {
    if (!arranging || drag || event.button !== 0 || !event.isPrimary) return;
    const tag = event.target.closest?.(".inventory-tag");
    const item = tag?.parentElement;
    if (!itemUid(item)) return;
    drag = { uid: itemUid(item), item, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, started: false, into: "", frame: 0 };
    document.addEventListener("pointermove", onArrangePointerMove);
    document.addEventListener("pointerup", onArrangePointerUp);
    document.addEventListener("pointercancel", cancelDrag);
  }

  // 鍵盤：左右（上下）方向鍵在同一處前後移動，Esc 結束整理（拖曳中則取消這次拖曳）。
  function onArrangeKeydown(event) {
    if (!arranging) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (drag?.started) cancelDrag();
      else {
        setArranging(false);
        document.getElementById("inventory-arrange")?.focus();
      }
      return;
    }
    const uid = event.target.closest?.(".inventory-tag")?.dataset.inventoryUid;
    const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key];
    if (!uid || !step || drag) return;
    event.preventDefault();
    const entry = api().getEntry(uid);
    const siblings = api().childrenOf(entry?.in);
    const index = siblings.findIndex(sibling => sibling.uid === uid) + step;
    if (index < 0 || index >= siblings.length) return;
    api().move(uid, { into: entry.in || "", before: step < 0 ? siblings[index].uid : siblings[index + 1]?.uid || "" });
    document.querySelector(`[data-inventory-uid="${uid}"]`)?.focus();
  }

  // 只以文字管理物品：開啟時標籤轉成「物品欄：」行放進攜帶物品文字最上方；關閉時物品欄從已裝備的物品開始。
  async function toggleTextOnly(trigger) {
    const turningOn = !api().isTextOnly();
    if (turningOn && api().entries().length) {
      const confirmed = await globalScope.AppDialog?.requestDecision({
        title: "只以文字管理物品？",
        message: "物品標籤會轉成一行文字放進攜帶物品；自訂物品的磅數、描述與容器設定不會保留。之後可以再按一次，用「整理成標籤」轉回。",
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
        shield: document.getElementById("offHandAsMain")?.checked === true && document.getElementById("main2Shield")?.checked === true
      });
    }
    trigger?.focus();
  }

  function init() {
    const panel = document.getElementById("inventory-panel");
    if (!panel || panel.dataset.inventoryReady === "true") return;
    panel.dataset.inventoryReady = "true";
    panel.querySelector("#inventory-add")?.addEventListener("click", event => openCustomDialog(event.currentTarget));
    document.getElementById("inventory-arrange")?.addEventListener("click", () => setArranging(!arranging));
    document.getElementById("inventory-tags")?.addEventListener("pointerdown", onArrangePointerDown);
    panel.addEventListener("keydown", onArrangeKeydown);
    const tidyButton = document.getElementById("inventory-tidy");
    tidyButton?.addEventListener("click", event => openTidyDialog(event.currentTarget));
    document.getElementById("inventory-text-only")?.addEventListener("click", event => toggleTextOnly(event.currentTarget));
    document.getElementById("inventory-over-hide")?.addEventListener("click", () => {
      overDismissed = true;
      renderWeight();
      document.getElementById("inventory-gear")?.focus();
    });
    // 齒輪比照跑團自創法術：只切換 #inventory-tools，每次載入預設收起。
    const gear = document.getElementById("inventory-gear");
    const tools = document.getElementById("inventory-tools");
    gear?.addEventListener("click", () => {
      const open = gear.getAttribute("aria-expanded") !== "true";
      gear.setAttribute("aria-expanded", String(open));
      gear.setAttribute("aria-label", open ? "隱藏物品欄選項" : "顯示物品欄選項");
      if (tools) tools.hidden = !open;
      if (!open) setArranging(false);
      syncArrangeButton();
    });
    document.addEventListener("inventory:change", render);
    ["mainHand", "offHand", "armor", "main2Shield", "offHandAsMain", "str", "race"].forEach((id) => {
      document.getElementById(id)?.addEventListener("change", render);
    });
    ["money-balance-cp", "money-balance-sp", "money-balance-gp", "money-balance-pp", "money-balance-ep"].forEach((id) => {
      document.getElementById(id)?.addEventListener("change", renderWeight);
    });
    const syncTidy = () => {
      if (tidyButton) tidyButton.hidden = api().isTextOnly() || legacyLines().length === 0;
    };
    // 存檔還原只觸發 change，手動輸入觸發 input。
    ["input", "change"].forEach(eventName => document.getElementById("gear-notes")?.addEventListener(eventName, syncTidy));
    render();
  }

  globalScope.InventoryUI = Object.freeze({ render, renderWeight, openCustomDialog, openItemDialog });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(typeof window !== "undefined" ? window : globalThis);

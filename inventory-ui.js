/**
 * 物品欄介面（傳統 defer script，無額外 runtime dependency）。
 *
 * - 掛在攜帶物品區的 #inventory-panel 與標題列的 #inventory-heading-tools（跑團模式時隨攜帶物品文字框一起搬移，見 tabletop-mode.js）。
 * - 標籤：[匕首 ×2]；容器標籤可展開，內容物排在下一層。點標籤開啟 `inventory-item` 視窗：目錄物品先顯示與商店相同的說明
 *   （search.js 的 renderEquipmentDetailInto()），下方「持有」區調整數量、位置或刪除。
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
    globalScope.AppDialog.showContent({
      title: api().getLabel(entry),
      variant: "inventory-item",
      trigger,
      // 刪除或卸下的確認視窗、說明內的規則連結疊在這個視窗上。
      allowNested: true,
      renderContent(body) {
        // 目錄物品先顯示與商店相同的說明（search.js），下方「持有」區調整數量與位置；自訂與通稱物品只有持有區。
        const hasDetail = Boolean(item && !item.generic && globalScope.renderEquipmentDetailInto?.(body, entry.itemId));
        const holding = el("section", "inventory-holding");
        holding.classList.toggle("has-detail", hasDetail);
        holding.setAttribute("aria-label", "持有");
        const meta = el("p", "inventory-item-meta");
        meta.appendChild(el("span", "inventory-holding__title", "持有"));
        // 說明已列單件重量，只有一件時不重複。
        if (!hasDetail || entry.quantity > 1) meta.appendChild(el("span", "inventory-holding__weight", weightDescription(entry)));
        if (isEntryEquipped(entry)) meta.append(el("span", "inventory-tag__badge", "裝備中"));
        holding.appendChild(meta);
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
      onClose: () => globalScope.setTimeout(() => {
        if (document.activeElement && document.activeElement !== document.body) return;
        (document.querySelector(`[data-inventory-uid="${uid}"]`) || fallbackFocusTarget())?.focus();
      }, 0)
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

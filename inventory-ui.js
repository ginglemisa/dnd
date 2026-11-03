/**
 * 物品欄介面（傳統 defer script，無額外 runtime dependency）。
 *
 * - 掛在攜帶物品區的 #inventory-panel 與標題列的 #inventory-heading-tools（跑團模式時隨攜帶物品文字框一起搬移，見 tabletop-mode.js）。
 * - 標籤：[匕首 ×2]；容器標籤可展開，內容物排在下一層。點標籤開啟 `inventory-item` 視窗調整數量、位置或刪除。
 *   目錄物品由商店（equipment-shop.js）購買或免費取得；這裡只建立自訂物品（`inventory-custom` 視窗）。資料一律經 window.Inventory。
 * - 標題列齒輪展開 #inventory-tools（負重與「自訂物品」），每次載入預設收起。
 * - 「整理成標籤」只在攜帶物品文字有「購買物品：」「初始裝備：」行時出現，預覽後由玩家確認才轉成標籤並移除那幾行。
 * - 負重：物品＋硬幣重量對照 index.html 的 getCarryCapacityPounds()，超過時只提示，不改速度；提示不受齒輪收合影響。
 * - 展開狀態只留在記憶體；視窗內的輸入框不設 id，不會進角色 JSON、分享或 autosave。
 */
(function (globalScope) {
  "use strict";

  const LEGACY_PREFIXES = Object.freeze([["購買物品：", ""], ["初始裝備：", "initial"]]);
  const expanded = new Set();
  let rendering = false;

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

  // 齒輪收起時「自訂物品」看不到，焦點改回齒輪。
  function fallbackFocusTarget() {
    return document.getElementById("inventory-tools")?.hidden === false
      ? document.getElementById("inventory-add")
      : document.getElementById("inventory-gear");
  }

  function fieldValue(id) {
    return document.getElementById(id)?.value || "";
  }

  // 目前裝備用到的物品：weapon:<武器名稱>、armor:<護甲名稱>、shield。
  function equippedUsage() {
    const usage = new Map();
    const bump = key => usage.set(key, (usage.get(key) || 0) + 1);
    const offHandSelect = document.getElementById("offHand");
    const mainHand = fieldValue("mainHand");
    const offHand = offHandSelect && !offHandSelect.disabled ? offHandSelect.value : "";
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

  function buildStepper(value, label) {
    const wrap = el("div", "inventory-stepper");
    const minus = button("inventory-stepper__button", "−");
    minus.setAttribute("aria-label", `減少${label}`);
    const input = el("input", "inventory-stepper__input");
    input.type = "number";
    input.min = "1";
    input.max = String(api().LIMITS.quantity);
    input.step = "1";
    input.inputMode = "numeric";
    input.value = String(value);
    input.dataset.stateTransient = "true";
    input.setAttribute("aria-label", label);
    const plus = button("inventory-stepper__button", "＋");
    plus.setAttribute("aria-label", `增加${label}`);
    const read = () => Math.min(api().LIMITS.quantity, Math.max(1, Math.floor(Number(input.value)) || 1));
    minus.addEventListener("click", () => { input.value = String(Math.max(1, read() - 1)); });
    plus.addEventListener("click", () => { input.value = String(Math.min(api().LIMITS.quantity, read() + 1)); });
    wrap.append(minus, input, plus);
    return { wrap, input, read };
  }

  function labelled(text, control) {
    const label = el("label", "inventory-field");
    label.append(el("span", "inventory-field__label", text), control);
    return label;
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
      // 刪除或卸下的確認視窗與物品說明疊在這個視窗上。
      allowNested: true,
      renderContent(body) {
        const meta = el("p", "inventory-item-meta", weightDescription(entry));
        if (isEntryEquipped(entry)) meta.append(el("span", "inventory-tag__badge", "裝備中"));
        body.appendChild(meta);
        const contents = api().descendantsOf(uid).length;
        if (api().isContainer(entry)) body.appendChild(el("p", "inventory-item-note", contents ? `內含 ${contents} 項物品；容器不會減輕內容物的重量。` : "可以放入其他物品；容器不會減輕內容物的重量。"));
        const stepper = buildStepper(entry.quantity, "數量");
        if (api().isContainer(entry)) stepper.wrap.hidden = true;
        else body.appendChild(labelled("數量", stepper.wrap));
        const location = buildLocationSelect(uid, entry.in);
        body.appendChild(labelled("位置", location));
        let nameInput = null;
        let weightInput = null;
        let containerToggle = null;
        if (custom) {
          nameInput = el("input", "inventory-text-input");
          nameInput.type = "text";
          nameInput.maxLength = api().LIMITS.name;
          nameInput.value = entry.name || "";
          nameInput.dataset.stateTransient = "true";
          body.appendChild(labelled("名稱", nameInput));
          weightInput = el("input", "inventory-text-input");
          weightInput.type = "number";
          weightInput.min = "0";
          weightInput.step = "0.1";
          weightInput.inputMode = "decimal";
          weightInput.placeholder = "未列重量";
          weightInput.value = Number.isFinite(entry.weight) ? String(entry.weight) : "";
          weightInput.dataset.stateTransient = "true";
          body.appendChild(labelled("每件重量（磅，選填）", weightInput));
          const toggleLabel = el("label", "inventory-check");
          containerToggle = el("input");
          containerToggle.type = "checkbox";
          containerToggle.checked = entry.container === true;
          containerToggle.dataset.stateTransient = "true";
          toggleLabel.append(containerToggle, el("span", "", "可以放入其他物品（容器）"));
          body.appendChild(toggleLabel);
        }
        // 說明比照商店，以可疊加的 AppDialog 疊在物品視窗上（頁面固定的裝備說明視窗會被蓋住）。
        if (item && !item.generic && typeof globalScope.openEquipmentDetailDialog === "function") {
          const detail = button("inventory-detail-link", "查看物品說明");
          detail.addEventListener("click", () => globalScope.openEquipmentDetailDialog(entry.itemId, detail));
          body.appendChild(detail);
        }
        controls = { stepper, location, nameInput, weightInput, containerToggle };
      },
      actions: [
        { label: "刪除", intent: "danger", resolve: async () => (await removeEntry(entry, trigger)) ? "removed" : false },
        { label: "取消", value: false },
        {
          label: "完成",
          intent: "primary",
          resolve: async () => {
            const quantity = api().isContainer(entry) ? entry.quantity : controls.stepper.read();
            const key = usageKey(entry);
            if (key && quantity < entry.quantity && !(await confirmUnequip(slotsLosingItems(new Map([[key, entry.quantity - quantity]])), trigger))) return false;
            const changes = { quantity, in: controls.location.value };
            if (custom) {
              if (!controls.nameInput.value.trim()) {
                controls.nameInput.focus();
                return false;
              }
              Object.assign(changes, { name: controls.nameInput.value, weight: controls.weightInput.value, container: controls.containerToggle.checked });
            }
            api().update(uid, changes);
            return "saved";
          }
        }
      ],
      initialFocus: "content",
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
    globalScope.AppDialog.showContent({
      title: "自訂物品",
      variant: "inventory-custom",
      trigger,
      renderContent(body) {
        body.appendChild(el("p", "inventory-item-note", "目錄裡的物品請從商店購買或免費取得；這裡加入商店沒有的物品。"));
        const nameInput = el("input", "inventory-text-input");
        nameInput.type = "text";
        nameInput.maxLength = api().LIMITS.name;
        nameInput.placeholder = "例如：任務信件";
        nameInput.dataset.stateTransient = "true";
        const weightInput = el("input", "inventory-text-input");
        weightInput.type = "number";
        weightInput.min = "0";
        weightInput.step = "0.1";
        weightInput.inputMode = "decimal";
        weightInput.placeholder = "未列重量";
        weightInput.dataset.stateTransient = "true";
        const stepper = buildStepper(1, "數量");
        const location = buildLocationSelect("", "");
        const toggleLabel = el("label", "inventory-check");
        const containerToggle = el("input");
        containerToggle.type = "checkbox";
        containerToggle.dataset.stateTransient = "true";
        toggleLabel.append(containerToggle, el("span", "", "可以放入其他物品（容器）"));
        body.append(labelled("名稱", nameInput), labelled("每件重量（磅，選填）", weightInput), labelled("數量", stepper.wrap), labelled("位置", location), toggleLabel);
        controls = { nameInput, weightInput, stepper, location, containerToggle };
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
            const request = { name, weight: controls.weightInput.value, container: controls.containerToggle.checked, quantity: controls.stepper.read() };
            if (!api().add([request], { into: controls.location.value })) {
              globalScope.AppDialog.notify?.(`物品欄最多 ${api().LIMITS.items} 筆，請先整理後再加入。`);
              return false;
            }
            return "added";
          }
        }
      ]
    });
  }

  function legacyLines() {
    const notes = document.getElementById("gear-notes");
    if (!notes) return [];
    return notes.value.split("\n").map((line, index) => {
      const text = line.trimStart();
      const match = LEGACY_PREFIXES.find(([prefix]) => text.startsWith(prefix));
      return match ? { index, prefix: match[0], source: match[1], items: text.slice(match[0].length).split("、").map(item => item.trim()).filter(Boolean) } : null;
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
        body.appendChild(el("p", "inventory-item-note", "以下文字會轉成物品標籤，並從攜帶物品文字移除；其他文字保留不動。目錄找不到的會建立成自訂物品（未列重量）。"));
        lines.forEach((line) => {
          body.appendChild(el("h3", "inventory-add-heading", line.prefix.replace("：", "")));
          const tags = el("ul", "inventory-tags inventory-tags--preview");
          line.items.forEach((text) => {
            const parsed = api().parseItemText(text);
            const label = parsed.name || api().getLabel({ itemId: parsed.itemId });
            const pack = api().getCatalogItem(parsed.itemId)?.pack;
            const tag = el("li", "inventory-tag inventory-tag--static", `${label}${parsed.quantity > 1 ? ` ×${parsed.quantity}` : ""}${pack ? "（拆成容器與內容物）" : ""}`);
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
            const ok = lines.every(line => api().add(line.items.map(text => ({ text })), line.source ? { source: line.source } : {}));
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
    all.filter(entry => (entry.in || "") === parentUid).forEach((entry) => {
      const item = el("li", "inventory-tag-item");
      const tag = button("inventory-tag", entryText(entry));
      tag.dataset.inventoryUid = entry.uid;
      tag.setAttribute("aria-haspopup", "dialog");
      tag.title = "調整數量、位置或刪除";
      const key = usageKey(entry);
      if (key && usage.get(key)) {
        tag.classList.add("is-equipped");
        tag.append(el("span", "inventory-tag__badge", "裝備中"));
      }
      if (!entry.itemId) tag.classList.add("is-custom");
      tag.addEventListener("click", () => openItemDialog(entry.uid, tag));
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
    const over = capacity > 0 && total > capacity;
    summary.classList.toggle("is-over", over);
    const warning = document.getElementById("inventory-over");
    if (warning) warning.hidden = !over;
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
    if (!panel || !api() || rendering) return;
    rendering = true;
    try {
      const list = panel.querySelector("#inventory-tags");
      const all = api().entries();
      const uids = new Set(all.map(entry => entry.uid));
      [...expanded].forEach((uid) => { if (!uids.has(uid)) expanded.delete(uid); });
      list.replaceChildren();
      renderEntries("", list, all, equippedUsage());
      panel.querySelector(".inventory-empty").hidden = all.length > 0;
      const tidy = document.getElementById("inventory-tidy");
      if (tidy) tidy.hidden = legacyLines().length === 0;
      renderWeight();
    } finally {
      rendering = false;
    }
  }

  function init() {
    const panel = document.getElementById("inventory-panel");
    if (!panel || panel.dataset.inventoryReady === "true") return;
    panel.dataset.inventoryReady = "true";
    panel.querySelector("#inventory-add")?.addEventListener("click", event => openCustomDialog(event.currentTarget));
    const tidyButton = document.getElementById("inventory-tidy");
    tidyButton?.addEventListener("click", event => openTidyDialog(event.currentTarget));
    // 齒輪比照跑團自創法術：只切換 #inventory-tools，每次載入預設收起。
    const gear = document.getElementById("inventory-gear");
    const tools = document.getElementById("inventory-tools");
    gear?.addEventListener("click", () => {
      const open = gear.getAttribute("aria-expanded") !== "true";
      gear.setAttribute("aria-expanded", String(open));
      gear.setAttribute("aria-label", open ? "隱藏物品欄選項" : "顯示物品欄選項");
      if (tools) tools.hidden = !open;
    });
    document.addEventListener("inventory:change", render);
    ["mainHand", "offHand", "armor", "main2Shield", "offHandAsMain", "str", "race"].forEach((id) => {
      document.getElementById(id)?.addEventListener("change", render);
    });
    ["money-balance-cp", "money-balance-sp", "money-balance-gp", "money-balance-pp", "money-balance-ep"].forEach((id) => {
      document.getElementById(id)?.addEventListener("change", renderWeight);
    });
    const syncTidy = () => {
      if (tidyButton) tidyButton.hidden = legacyLines().length === 0;
    };
    // 存檔還原只觸發 change，手動輸入觸發 input。
    ["input", "change"].forEach(eventName => document.getElementById("gear-notes")?.addEventListener(eventName, syncTidy));
    render();
  }

  globalScope.InventoryUI = Object.freeze({ render, renderWeight, openCustomDialog, openItemDialog });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(typeof window !== "undefined" ? window : globalThis);

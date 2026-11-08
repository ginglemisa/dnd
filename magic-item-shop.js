/**
 * 魔法物品商店模式與取得視窗（傳統 defer script，無額外 runtime dependency）。
 *
 * - equipment-shop.js 的標題列切換按鈕開啟 mode：標題、說明、分類與清單換成這裡提供的內容，toolbar、分類動畫與列表外觀沿用商店。
 *   只有角色卡的商店有這個按鈕：快速創角的暫存錢包與分享模式沒有。模式只留在記憶體，關閉商店後恢復一般模式。
 * - 資料一律經 MagicItemCatalog；魔法物品不放進 equipment-data.js、equipment-notes.js、equipment-shop.js 的資料。
 * - 取得視窗：說明、基本款、選項（4 項以內分段按鈕，超過用下拉）、法術卷軸的環階與法術、魔法彈藥的數量。獲得不花費金幣、不記交易。
 * - 寫入物品欄的形狀見 inventory.js 檔頭。一般的治療藥水與法術卷軸沿用既有寫法；只以文字管理物品時比照結帳寫進攜帶物品文字。
 * - renderDetail() 是副標、說明與「不會自動套用」提示的共用畫面：商店視窗、物品欄視窗與裝備詳情都用它。
 */
(function (globalScope) {
  "use strict";

  const MANUAL_NOTE = "角色卡不會自動套用這項效果，請依說明處理";
  const SHOP_NOTE = "點物品查看效果後獲得，不花費金幣";
  // 網站的法術只到 4 環，法術卷軸也只提供到這裡。
  const MAX_SCROLL_LEVEL = 4;
  const SEGMENTED_MAX = 4;
  const DEFAULT_AMMO_QUANTITY = 20;
  const ICON = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="9.4" cy="13" rx="8" ry="3.7"/><ellipse cx="9.7" cy="12.9" rx="5" ry="1.4"/><path d="M4.2 15.9V19.6C4.2 21 6.8 22 9.7 22s5.5-1 5.5-2.4v-3.9"/><path d="M16.3 2.8c.8-.3 1.8-.1 2 .7l4.3 17c.2.8-.4 1.3-1.2 1.5s-1.5 0-1.7-.8l-4.3-17c-.2-.7.2-1.2.9-1.4ZM16.3 7.6l2.9-.75"/></g><path d="M4.4 3.7L5.27 5.93 7.5 6.8 5.27 7.67 4.4 9.9 3.53 7.67 1.3 6.8 3.53 5.93ZM9.4 1.1L10.04 2.76 11.7 3.4 10.04 4.04 9.4 5.7 8.76 4.04 7.1 3.4 8.76 2.76ZM13.3 5.2L13.78 6.42 15 6.9 13.78 7.38 13.3 8.6 12.82 7.38 11.6 6.9 12.82 6.42Z" fill="currentColor" stroke="currentColor" stroke-width=".7" stroke-linejoin="round"/></svg>';

  let sortedItems = null;

  const catalog = () => globalScope.MagicItemCatalog;

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

  function getSortedItems() {
    sortedItems ??= [...catalog().getAll()].sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));
    return sortedItems;
  }

  function getCategories() {
    return [["all", "全部"], ...catalog().getCategories().map(category => [category.id, category.label])];
  }

  function matchesKeyword(item, keyword) {
    return !keyword || [item.name, item.nameEn].some(value => value.toLowerCase().includes(keyword));
  }

  function hasBaseChoice(item) {
    return catalog().getBaseChoices(item.id).length > 1;
  }

  // 武器與護甲依基本款能不能選分組，奇物依小標，其他類別不分組。
  function getGroupTests(category) {
    if (category.id === "weapon" || category.id === "armor") return [["可選基本款", hasBaseChoice], ["固定基本款", item => !hasBaseChoice(item)]];
    if (category.groups.length) return category.groups.map(group => [group.label, item => item.group === group.id]);
    return [["", () => true]];
  }

  function getSections(categoryId, keyword) {
    const items = getSortedItems().filter(item => matchesKeyword(item, keyword));
    return catalog().getCategories()
      .filter(category => categoryId === "all" || category.id === categoryId)
      .map((category) => {
        const members = items.filter(item => item.category === category.id);
        const groups = getGroupTests(category).map(([name, test]) => ({ name, items: members.filter(test) })).filter(group => group.items.length);
        return { title: category.label, groups };
      })
      .filter(section => section.groups.length);
  }

  // 清單上的稀有度：隨選項變動時寫範圍，例如「非常見～極稀有」。
  function getRarityText(item) {
    if (item.rarity !== "varies") return catalog().getRarityLabel(item.rarity);
    const labels = [...new Set(item.options.flatMap(option => option.choices.map(choice => catalog().getRarityLabel(choice.rarity))).filter(Boolean))];
    if (!labels.length) return "稀有度不定";
    return labels.length > 1 ? `${labels[0]}～${labels[labels.length - 1]}` : labels[0];
  }

  function createRow(item) {
    const row = el("li", "equipment-shop__item equipment-shop__item--magic");
    row.dataset.magicItemId = item.id;
    const trigger = button("magic-shop__row");
    trigger.setAttribute("aria-haspopup", "dialog");
    const meta = el("span", "magic-shop__meta", getRarityText(item));
    if (item.attunement) meta.appendChild(el("span", "magic-shop__attunement", "需同調"));
    trigger.append(el("span", "magic-shop__name", item.name), meta);
    trigger.addEventListener("click", () => openGrantDialog(item, trigger));
    row.appendChild(trigger);
    return row;
  }

  /** 把副標、說明（延遲載入，失敗可重試）與提示畫進 container；沒有這件物品時回傳 false。 */
  function renderDetail(container, id) {
    const item = catalog()?.get(id);
    if (!item) return false;
    const wrap = el("div", "magic-item-detail");
    wrap.appendChild(el("p", "magic-item-detail__subtitle", catalog().getSubtitle(id)));
    const text = el("div", "magic-item-detail__text spell-version__srd-body");
    wrap.appendChild(text);
    if (item.manualEffect) wrap.appendChild(el("p", "magic-item-detail__manual", MANUAL_NOTE));
    container.appendChild(wrap);
    const load = () => {
      text.replaceChildren(el("p", "magic-item-detail__status", "載入說明中…"));
      catalog().getText(id).then((result) => {
        text.innerHTML = result?.html || "";
      }, () => {
        const retry = button("magic-item-detail__retry", "重試");
        retry.addEventListener("click", () => {
          load();
          text.closest(".app-dialog")?.querySelector(".app-dialog__button--primary")?.focus();
        });
        text.replaceChildren(el("p", "magic-item-detail__status", "說明載入失敗，請確認網路連線。"), retry);
      });
    };
    load();
    return true;
  }

  function createSelect(label, options) {
    const select = el("select");
    select.dataset.stateTransient = "true";
    select.setAttribute("aria-label", label);
    select.append(...options.map(([value, text]) => new Option(text, value)));
    return select;
  }

  // 一個欄位：標題、控制項與旁邊的提示。read() 回傳值，沒選好時顯示提示並回傳 undefined。
  function createField(label, control, read, missing, wrapTag = "label") {
    const wrap = el(wrapTag, "inventory-field magic-item-field");
    const hint = el("p", "starting-equipment-error");
    hint.setAttribute("aria-live", "polite");
    wrap.append(el("span", "inventory-field__label", label), control, hint);
    const clear = () => { hint.textContent = ""; };
    control.addEventListener("change", clear);
    return {
      element: wrap,
      read() {
        const value = read();
        hint.textContent = value === undefined ? missing : "";
        return value;
      },
      focus: () => (control.matches("select, input") ? control : control.querySelector("button, input"))?.focus()
    };
  }

  function createSelectField(label, placeholder, entries, missing) {
    const options = placeholder ? [["", placeholder], ...entries] : entries;
    const select = createSelect(label, options);
    return { ...createField(label, select, () => select.value || undefined, missing), select };
  }

  // 4 項以內的選項：預設第一項。
  function createSegmentedField(option) {
    const group = el("div", "magic-item-segmented");
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", option.label);
    let selected = option.choices[0];
    const buttons = option.choices.map((choice) => {
      const control = button("magic-item-segmented__button", choice.label);
      control.setAttribute("aria-pressed", String(choice === selected));
      control.addEventListener("click", () => {
        selected = choice;
        buttons.forEach((item, index) => item.setAttribute("aria-pressed", String(option.choices[index] === selected)));
      });
      return control;
    });
    group.append(...buttons);
    return createField(option.label, group, () => selected.value, "", "div");
  }

  function createOptionField(option) {
    if (option.choices.length <= SEGMENTED_MAX) return createSegmentedField(option);
    const field = createSelectField(option.label, `選擇${option.label}…`, option.choices.map((choice, index) => [String(index), choice.label]), `請先選擇${option.label}。`);
    return { ...field, read: () => { const index = field.read(); return index === undefined ? undefined : option.choices[Number(index)].value; } };
  }

  // 法術卷軸：環階（戲法到 4 環）與該環階的法術。
  function createScrollFields(option) {
    const choices = option.choices.filter(choice => choice.value <= MAX_SCROLL_LEVEL);
    const level = createSelectField("環階", "", choices.map((choice, index) => [String(index), choice.label]), "");
    const spells = () => globalScope.EquipmentShop?.getSpellOptions?.(choices[Number(level.select.value)].value) || [];
    const spell = createSelectField("法術", "選擇法術…", [], "請先選擇法術。");
    const renderSpells = () => {
      spell.select.replaceChildren(new Option("選擇法術…", ""), ...spells().map(candidate => new Option(candidate.nameZh, candidate.spellId)));
    };
    level.select.addEventListener("change", renderSpells);
    renderSpells();
    return [
      { ...level, key: option.id, read: () => choices[Number(level.select.value)].value },
      { ...spell, key: "spell", read: () => {
        const spellId = spell.read();
        return spellId === undefined ? undefined : spells().find(candidate => candidate.spellId === spellId);
      } }
    ];
  }

  function createQuantityField() {
    const stepper = globalScope.InventoryUI.buildStepper(DEFAULT_AMMO_QUANTITY, "數量");
    return { ...createField("數量", stepper.wrap, () => stepper.read(), "", "div"), key: "quantity" };
  }

  function isAmmunition(item) {
    return Boolean(item.base?.any?.includes("ammunition"));
  }

  function isScrollOption(option) {
    return option.id === "spellLevel";
  }

  function buildFields(item) {
    const fields = [];
    const choices = catalog().getBaseChoices(item.id);
    if (choices.length > 1) fields.push({ ...createSelectField("基本款", "選擇基本款…", choices.map(name => [name, name]), "請先選擇基本款。"), key: "base" });
    item.options.forEach((option) => {
      if (isScrollOption(option)) fields.push(...createScrollFields(option));
      else fields.push({ ...createOptionField(option), key: option.id });
    });
    if (isAmmunition(item)) fields.push(createQuantityField());
    const element = fields.length ? el("div", "magic-item-fields") : null;
    fields.forEach(field => element.appendChild(field.element));
    return {
      element,
      // 全部讀過才回報，每個沒選好的欄位旁都有提示；焦點到第一個。
      read() {
        const values = { base: choices.length === 1 ? choices[0] : undefined };
        const missing = fields.filter((field) => {
          values[field.key] = field.read();
          return values[field.key] === undefined;
        });
        missing[0]?.focus();
        return missing.length ? null : values;
      }
    };
  }

  // 寫進物品欄的一筆：一般的治療藥水與法術卷軸沿用既有寫法，其餘是 magic；顯示名稱由目錄算。
  function buildGrant(item, { base, spell, quantity = 1, ...values }) {
    const selection = Object.fromEntries(item.options.filter(option => !isScrollOption(option)).map(option => [option.id, values[option.id]]));
    if (spell) {
      const name = `${spell.nameZh}法術卷軸`;
      return { label: name, quantity, request: { itemId: item.equipmentName, name, quantity } };
    }
    const label = catalog().getDisplayName(item.id, { ...selection, base });
    const isOrdinary = item.equipmentName && item.options.every(option => option.choices.find(choice => choice.value === selection[option.id])?.omitInName);
    if (isOrdinary) return { label, quantity, request: { itemId: item.equipmentName, quantity } };
    return { label, quantity, request: { ...(base ? { itemId: base } : {}), quantity, magic: { id: item.id, ...selection } } };
  }

  function grant(item, form) {
    if (globalScope.SHARE_MODE) return false;
    const values = form.read();
    if (!values) return false;
    const { label, quantity, request } = buildGrant(item, values);
    const text = quantity > 1 ? `${label} ×${quantity}` : label;
    if (globalScope.Inventory.isTextOnly()) {
      globalScope.MoneyTracker.addGearText([{ label, gearName: label, quantity }]);
      globalScope.AppDialog.notify(`已獲得${text}，已寫進攜帶物品。`, { tone: "success" });
      return "granted";
    }
    if (!globalScope.Inventory.add([request], { newStack: true })) {
      globalScope.AppDialog.notify(`物品欄最多 ${globalScope.Inventory.LIMITS.items} 筆，請先整理物品欄再獲得。`, { tone: "warning" });
      return false;
    }
    globalScope.AppDialog.notify(`已獲得${text}，已加入物品欄。`, { tone: "success" });
    return "granted";
  }

  function openGrantDialog(item, trigger) {
    let form = null;
    return globalScope.AppDialog.showContent({
      title: item.name,
      variant: "magic-item-grant",
      allowNested: true,
      trigger,
      // 手機上不要一開就跳出鍵盤或下拉，說明也才會從頭顯示。
      initialFocus: "primary",
      renderContent(body) {
        renderDetail(body, item.id);
        form = buildFields(item);
        if (form.element) body.appendChild(form.element);
      },
      actions: [
        { label: "取消", value: false },
        { label: "獲得", intent: "primary", resolve: () => grant(item, form) }
      ]
    });
  }

  globalScope.MagicItemShop = Object.freeze({
    mode: Object.freeze({ title: "魔法物品", note: SHOP_NOTE, icon: ICON, getCategories, getSections, createRow }),
    renderDetail
  });
})(window);

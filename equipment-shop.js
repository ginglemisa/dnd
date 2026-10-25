/**
 * 商店視窗（傳統 defer script，無額外 runtime dependency）。
 *
 * - 品項：equipment-notes.js 依說明原文整理的 EQUIPMENT_SHOP_ITEMS；不另存價格或分類。
 * - 結帳：index.html 的 window.MoneyTracker.purchaseItems() 記一筆交易並寫入攜帶物品。
 * - 詳情：search.js 的 openEquipmentDetailDialog()，以 AppDialog 疊在商店上。
 * - 購物清單：標題列購物車按鈕開啟的 AppDialog，與商店同尺寸疊放，結帳成功時兩者一起關閉。
 * - 法術卷軸：環階與法術取自 SpellCatalog，名稱寫成「法術名稱法術卷軸」。
 * - 購物清單、分類、展開狀態與搜尋只留在記憶體，不進角色 JSON、分享或 autosave。
 */
(function (globalScope) {
  "use strict";

  const CATEGORIES = Object.freeze([
    ["all", "全部"], ["weapon", "武器"], ["armor", "護甲"], ["tool", "工具"],
    ["gear", "冒險用品"], ["ammo", "彈藥"], ["focus", "法器"], ["pack", "套組"]
  ]);
  const QUANTITY_MAX = 999;
  const DISCLOSURE_MS = 390;
  const cart = new Map();
  let activeCategory = "all";
  let categoriesExpanded = false;
  let keyword = "";
  let keywordText = "";
  let view = null;
  let cartView = null;
  let spellOptionsByLevel = null;
  let finishCategoryMotion = null;

  function createElement(tagName, className = "", text = "") {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function createButton(className, text = "") {
    const button = createElement("button", className, text);
    button.type = "button";
    return button;
  }

  function getItems() {
    return Array.isArray(globalScope.EQUIPMENT_SHOP_ITEMS) ? globalScope.EQUIPMENT_SHOP_ITEMS : [];
  }

  function getItemCategory(item) {
    return item.category === "scroll" ? "gear" : item.category;
  }

  function getCategoryLabel(id) {
    return CATEGORIES.find(([categoryId]) => categoryId === id)?.[1] || "全部";
  }

  function formatPrice(item) {
    return `${item.amount} ${item.currency}`;
  }

  function formatCopper(copper) {
    return globalScope.MoneyTracker?.formatAmount?.(copper) || `${copper} 銅幣`;
  }

  function readBalance() {
    return globalScope.MoneyTracker?.readTotal?.() ?? 0;
  }

  function clampQuantity(value) {
    const quantity = Number.parseInt(value, 10);
    return Number.isInteger(quantity) ? Math.min(QUANTITY_MAX, Math.max(1, quantity)) : 1;
  }

  function prefersReducedMotion() {
    return Boolean(globalScope.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  }

  // 法術卷軸可記載任一職業清單上的戲法或 1 環法術。
  function getSpellOptions(level) {
    spellOptionsByLevel ??= new Map();
    if (!spellOptionsByLevel.has(level)) {
      const catalog = globalScope.SpellCatalog;
      const spells = (catalog?.getAllSpells?.() || [])
        .filter(spell => spell.level === level && catalog.getClassIds(spell.spellId).length)
        .sort((a, b) => a.nameZh.localeCompare(b.nameZh, "zh-Hant"));
      spellOptionsByLevel.set(level, spells);
    }
    return spellOptionsByLevel.get(level);
  }

  function matchesKeyword(item) {
    if (!keyword) return true;
    const english = globalScope.EQUIPMENT_ENGLISH_NAMES?.[item.name] || "";
    return [item.name, item.variant, item.section, item.group, english]
      .some(value => String(value || "").toLowerCase().includes(keyword));
  }

  function getVisibleItems() {
    return getItems().filter(item => (activeCategory === "all" || getItemCategory(item) === activeCategory) && matchesKeyword(item));
  }

  function getCartLines() {
    return [...cart.values()];
  }

  function getCartTotal() {
    return getCartLines().reduce((sum, line) => sum + line.copper * line.quantity, 0);
  }

  function getCartQuantity() {
    return getCartLines().reduce((sum, line) => sum + line.quantity, 0);
  }

  function getItemCartQuantity(itemKey) {
    return getCartLines().filter(line => line.itemKey === itemKey).reduce((sum, line) => sum + line.quantity, 0);
  }

  function announce(message) {
    const status = cartView?.status || view?.status;
    if (!status) return;
    status.textContent = "";
    globalScope.requestAnimationFrame(() => {
      if (status.isConnected) status.textContent = message;
    });
  }

  function addToCart(item, { spell = null, quantity = 1 } = {}) {
    if (!item) return null;
    const key = spell ? `${item.key}|${spell.spellId}` : item.key;
    const name = spell ? `${spell.nameZh}法術卷軸` : item.name;
    const existing = cart.get(key);
    const line = existing || { key, itemKey: item.key, name, gearName: spell ? name : "", amount: item.amount, currency: item.currency, copper: item.copper, quantity: 0 };
    line.quantity = Math.min(QUANTITY_MAX, line.quantity + quantity);
    cart.set(key, line);
    return line;
  }

  function createItemNameButton(item) {
    const button = createButton("equipment-shop__detail", item.name);
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-label", `查看${item.name}的詳情`);
    button.addEventListener("click", () => {
      if (!globalScope.openEquipmentDetailDialog?.(item.name, button)) {
        globalScope.AppDialog.showMessage({ title: "物品詳情", message: "暫時無法讀取此物品的說明，請重新載入頁面後再試。", trigger: button });
      }
    });
    return button;
  }

  function createAddButton(label) {
    const button = createButton("equipment-shop__add", "加入");
    button.setAttribute("aria-label", `加入購物清單：${label}`);
    return button;
  }

  function handleAdded(line) {
    renderCartState();
    announce(`已加入${line.name}，購物清單共 ${line.quantity} 個。`);
  }

  function createItemRow(item) {
    const row = createElement("li", "equipment-shop__item");
    row.dataset.shopItemKey = item.key;
    const name = createElement("div", "equipment-shop__item-name");
    name.append(createItemNameButton(item), createElement("span", "equipment-shop__price", formatPrice(item)));
    const count = createElement("span", "equipment-shop__in-cart");
    count.dataset.shopCount = item.key;
    const add = createAddButton(item.name);
    add.addEventListener("click", () => handleAdded(addToCart(item)));
    row.append(name, count, add);
    return row;
  }

  // 法術卷軸依環階拆成多個品項，在同一列選擇環階與法術後加入。
  function createScrollRow(items) {
    const row = createElement("li", "equipment-shop__item equipment-shop__item--scroll");
    row.dataset.shopItemKey = items[0].name;
    const name = createElement("div", "equipment-shop__item-name");
    name.appendChild(createItemNameButton(items[0]));
    const options = createElement("div", "equipment-shop__scroll-options");
    const levelSelect = createElement("select", "equipment-shop__scroll-level");
    levelSelect.dataset.stateTransient = "true";
    levelSelect.setAttribute("aria-label", "法術卷軸環階");
    items.forEach((item, index) => {
      const option = createElement("option", "", `${item.variant}（${formatPrice(item)}）`);
      option.value = String(index);
      levelSelect.appendChild(option);
    });
    const spellSelect = createElement("select", "equipment-shop__scroll-spell");
    spellSelect.dataset.stateTransient = "true";
    spellSelect.setAttribute("aria-label", "法術卷軸記載的法術");
    const add = createAddButton("法術卷軸");
    const renderSpellOptions = () => {
      const item = items[Number(levelSelect.value)];
      const placeholder = createElement("option", "", "選擇法術…");
      placeholder.value = "";
      spellSelect.replaceChildren(placeholder, ...getSpellOptions(item.spellLevel).map(spell => {
        const option = createElement("option", "", spell.nameZh);
        option.value = spell.spellId;
        return option;
      }));
      add.disabled = true;
    };
    levelSelect.addEventListener("change", renderSpellOptions);
    spellSelect.addEventListener("change", () => { add.disabled = !spellSelect.value; });
    add.addEventListener("click", () => {
      const item = items[Number(levelSelect.value)];
      const spell = getSpellOptions(item.spellLevel).find(candidate => candidate.spellId === spellSelect.value);
      if (spell) handleAdded(addToCart(item, { spell }));
    });
    renderSpellOptions();
    options.append(levelSelect, spellSelect);
    row.append(name, options, add);
    return row;
  }

  // 依說明原文的區塊（簡易武器、工匠工具…）與「多種」群組分段，順序沿用原文。
  function renderList() {
    if (!view) return;
    const items = getVisibleItems();
    const fragment = document.createDocumentFragment();
    let sectionList = null;
    let sectionName = "";
    let groupName = "";
    const renderedScrolls = new Set();
    items.forEach(item => {
      if (item.section !== sectionName) {
        sectionName = item.section;
        groupName = "";
        const section = createElement("section", "equipment-shop__section");
        section.appendChild(createElement("h3", "equipment-shop__section-title", sectionName));
        sectionList = createElement("ul", "equipment-shop__items");
        section.appendChild(sectionList);
        fragment.appendChild(section);
      }
      if (item.group !== groupName) {
        groupName = item.group;
        if (groupName) sectionList.appendChild(createElement("li", "equipment-shop__group", groupName));
      }
      if (Number.isInteger(item.spellLevel)) {
        if (renderedScrolls.has(item.name)) return;
        renderedScrolls.add(item.name);
        sectionList.appendChild(createScrollRow(items.filter(candidate => candidate.name === item.name && Number.isInteger(candidate.spellLevel))));
        return;
      }
      sectionList.appendChild(createItemRow(item));
    });
    if (!items.length) fragment.appendChild(createElement("p", "equipment-shop__empty", keyword ? `找不到包含「${keywordText.trim()}」的物品。` : "此分類沒有物品。"));
    view.list.replaceChildren(fragment);
    view.list.scrollTop = 0;
    updateItemCounts();
  }

  function updateItemCounts() {
    view?.list.querySelectorAll("[data-shop-count]").forEach(element => {
      const count = getItemCartQuantity(element.dataset.shopCount);
      element.textContent = count ? `已選 ${count}` : "";
    });
  }

  function setCheckoutDisabled(actions, root, disabled) {
    actions.forEach(action => { action.disabled = disabled; });
    root?.querySelectorAll("[data-shop-checkout]").forEach(button => { button.disabled = disabled; });
  }

  // 商店與購物清單共用同一份清單資料；任一處變更都同步兩邊的數量與金額。
  function renderCartState() {
    const lines = getCartLines();
    const quantity = getCartQuantity();
    const total = getCartTotal();
    if (view) {
      view.badge.textContent = quantity > 99 ? "99+" : String(quantity);
      view.badge.hidden = !quantity;
      view.cartButton.setAttribute("aria-label", quantity ? `購物清單，${quantity} 個物品` : "購物清單，尚未加入物品");
      view.balance.textContent = `目前財產：${formatCopper(readBalance())}`;
      view.total.textContent = lines.length ? `合計 ${formatCopper(total)}` : "";
      setCheckoutDisabled(view.checkoutActions, view.root, !lines.length);
      updateItemCounts();
    }
    if (cartView) renderCartDialog();
  }

  function setLineQuantity(line, quantity) {
    line.quantity = clampQuantity(quantity);
    renderCartState();
  }

  function createCartLine(line) {
    const item = createElement("li", "equipment-shop__cart-line");
    item.dataset.shopCartKey = line.key;
    const name = createElement("div", "equipment-shop__cart-name");
    name.append(createElement("span", "", line.name), createElement("span", "equipment-shop__subtotal", `${line.amount * line.quantity} ${line.currency}`));
    const controls = createElement("div", "equipment-shop__quantity");
    const minus = createButton("equipment-shop__step", "−");
    minus.dataset.shopControl = "minus";
    minus.setAttribute("aria-label", `減少${line.name}數量`);
    minus.disabled = line.quantity <= 1;
    minus.addEventListener("click", () => setLineQuantity(line, line.quantity - 1));
    const input = createElement("input", "equipment-shop__quantity-input");
    input.type = "number";
    input.min = "1";
    input.max = String(QUANTITY_MAX);
    input.step = "1";
    input.inputMode = "numeric";
    input.value = String(line.quantity);
    input.dataset.stateTransient = "true";
    input.dataset.shopControl = "quantity";
    input.setAttribute("aria-label", `${line.name}數量`);
    input.addEventListener("change", () => setLineQuantity(line, input.value));
    const plus = createButton("equipment-shop__step", "＋");
    plus.dataset.shopControl = "plus";
    plus.setAttribute("aria-label", `增加${line.name}數量`);
    plus.disabled = line.quantity >= QUANTITY_MAX;
    plus.addEventListener("click", () => setLineQuantity(line, line.quantity + 1));
    controls.append(minus, input, plus);
    const remove = createButton("equipment-shop__remove", "移除");
    remove.dataset.shopControl = "remove";
    remove.setAttribute("aria-label", `從購物清單移除${line.name}`);
    remove.addEventListener("click", () => {
      cart.delete(line.key);
      renderCartState();
      announce(`已移除${line.name}。`);
      (cartView?.list.querySelector(".equipment-shop__remove") || cartView?.clear)?.focus();
    });
    item.append(name, controls, remove);
    return item;
  }

  function renderCartDialog() {
    const focusedKey = document.activeElement?.closest?.("[data-shop-cart-key]")?.dataset.shopCartKey;
    const focusedControl = document.activeElement?.dataset?.shopControl;
    const lines = getCartLines();
    const quantity = getCartQuantity();
    const total = getCartTotal();
    const balance = readBalance();
    cartView.title.textContent = quantity ? `購物清單（${quantity} 個）` : "購物清單";
    cartView.list.replaceChildren(...lines.map(createCartLine));
    cartView.empty.hidden = lines.length > 0;
    cartView.clear.disabled = !lines.length;
    const shortfall = total - balance;
    cartView.summary.classList.toggle("is-shortfall", lines.length > 0 && shortfall > 0);
    cartView.summary.textContent = !lines.length ? ""
      : shortfall > 0 ? `財產不足，尚缺 ${formatCopper(shortfall)}`
        : `合計 ${formatCopper(total)}｜結帳後 ${formatCopper(balance - total)}`;
    setCheckoutDisabled(cartView.checkoutActions, cartView.root, !lines.length);
    if (focusedKey && focusedControl) {
      const selector = `[data-shop-cart-key="${CSS.escape(focusedKey)}"]`;
      const control = cartView.list.querySelector(`${selector} [data-shop-control="${focusedControl}"]`);
      (control && !control.disabled ? control : cartView.list.querySelector(`${selector} [data-shop-control="quantity"]`))?.focus();
    }
  }

  async function checkout(free) {
    const lines = getCartLines();
    if (!lines.length || typeof globalScope.MoneyTracker?.purchaseItems !== "function") return false;
    const purchased = await globalScope.MoneyTracker.purchaseItems(
      lines.map(({ name, gearName, amount, currency, quantity }) => ({ name, gearName, amount, currency, quantity })),
      { free }
    );
    if (!purchased) {
      renderCartState();
      return false;
    }
    const summary = lines.map(line => (line.quantity === 1 ? line.name : `${line.name} ×${line.quantity}`)).join("、");
    cart.clear();
    globalScope.AppDialog.notify(`${free ? "已免費取得" : "已購買"}：${summary}，已加入攜帶物品。`, { tone: "success" });
    return true;
  }

  function createCheckoutActions() {
    return [
      { label: "免費取得", value: "free", resolve: () => checkout(true) },
      { label: "結帳", intent: "primary", value: "paid", resolve: () => checkout(false) }
    ];
  }

  // AppDialog 的動作列前方加入說明文字；兩顆結帳按鈕合為一組，換行時不被拆開，並在清單變動時停用。
  function decorateActions(root, textElement) {
    const actions = root?.querySelector(".app-dialog__actions");
    if (!actions) return;
    const buttons = createElement("div", "equipment-shop__footer-buttons");
    actions.querySelectorAll("button").forEach(button => {
      button.dataset.shopCheckout = "true";
      buttons.appendChild(button);
    });
    actions.append(textElement, buttons);
  }

  function createHeaderActions(root, buttons) {
    const header = root?.querySelector(".app-dialog__header");
    const close = header?.querySelector(".app-dialog__close");
    if (!header || !close) return;
    const group = createElement("div", "equipment-shop__header-actions");
    close.replaceWith(group);
    group.append(...buttons, close);
  }

  function openCartDialog(trigger) {
    if (cartView || !view) return;
    const checkoutActions = createCheckoutActions();
    const dialog = globalScope.AppDialog.showMessage({
      title: "購物清單",
      variant: "equipment-shop-cart",
      allowNested: true,
      trigger,
      initialFocus: "content",
      actions: checkoutActions,
      renderContent(body) {
        const list = createElement("ul", "equipment-shop__cart-list");
        list.setAttribute("aria-label", "購物清單物品");
        const empty = createElement("p", "equipment-shop__cart-empty", "尚未加入物品。");
        const status = createElement("p", "equipment-shop__status sr-only");
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        const content = createElement("div", "equipment-shop equipment-shop--cart");
        content.append(empty, list, status);
        body.appendChild(content);
        cartView = { list, empty, status, checkoutActions };
      },
      onClose() {
        cartView = null;
      }
    });
    cartView.root = cartView.list.closest(".app-dialog");
    cartView.title = cartView.root.querySelector(".app-dialog__header h2");
    cartView.clear = createButton("equipment-shop__clear", "清空");
    cartView.clear.addEventListener("click", () => {
      cart.clear();
      renderCartState();
      announce("已清空購物清單。");
      cartView?.root.querySelector(".app-dialog__close")?.focus();
    });
    createHeaderActions(cartView.root, [cartView.clear]);
    cartView.summary = createElement("p", "equipment-shop__footer-text");
    cartView.summary.setAttribute("aria-live", "polite");
    decorateActions(cartView.root, cartView.summary);
    renderCartState();
    if (!cart.size) cartView.root.querySelector(".app-dialog__close")?.focus();
    // 結帳成立後購物清單先關閉，再一併關閉商店，焦點回到開啟商店的按鈕。
    dialog.then(result => {
      if (result === true) view?.root.querySelector(".app-dialog__close")?.click();
    });
  }

  function renderCategoryToggle() {
    const label = activeCategory === "all" ? "類別" : getCategoryLabel(activeCategory);
    view.categoryToggle.replaceChildren(createElement("span", "", label), createElement("span", "equipment-shop__category-arrow", categoriesExpanded ? "▴" : "▾"));
    view.categoryToggle.lastChild.setAttribute("aria-hidden", "true");
    view.categoryToggle.setAttribute("aria-expanded", String(categoriesExpanded));
    view.categoryToggle.setAttribute("aria-label", `${categoriesExpanded ? "收合" : "展開"}物品分類，目前為${getCategoryLabel(activeCategory)}`);
    view.categoryToggle.classList.toggle("is-filtered", activeCategory !== "all");
    view.categoryToggle.classList.toggle("is-expanded", categoriesExpanded);
    view.categories.hidden = !categoriesExpanded;
    view.categories.querySelectorAll("button").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.shopCategory === activeCategory));
    });
  }

  // 比照跑團「基本動作」：分類按鈕自類別按鈕位置展開，收合時飛回原位。
  function animateCategories(expanding) {
    const container = view.categories;
    if (prefersReducedMotion() || typeof container.animate !== "function") return;
    if (!expanding) {
      container.hidden = false;
      container.inert = true;
    }
    const anchor = view.categoryToggle.getBoundingClientRect();
    const easing = "cubic-bezier(.22,.8,.3,1)";
    const height = container.getBoundingClientRect().height;
    const buttons = [...container.querySelectorAll("button")];
    const animations = [container.animate(
      expanding ? [{ height: "0px" }, { height: `${height}px` }] : [{ height: `${height}px` }, { height: "0px" }],
      { duration: DISCLOSURE_MS, easing, fill: "forwards" }
    )];
    buttons.forEach((button, index) => {
      const rect = button.getBoundingClientRect();
      const hidden = { transform: `translate(${anchor.left - rect.left}px, ${anchor.top - rect.top}px) scale(.75)`, opacity: 0 };
      animations.push(button.animate(expanding
        ? [hidden, { transform: "translate(0, -2px) scale(1.02)", opacity: 1, offset: .82 }, { transform: "none", opacity: 1 }]
        : [{ transform: "none", opacity: 1 }, hidden], {
        duration: 250,
        easing,
        delay: (expanding ? index : buttons.length - index - 1) * 9,
        fill: expanding ? "backwards" : "forwards"
      }));
    });
    const cleanup = () => {
      animations.forEach(animation => animation.cancel());
      if (!expanding) {
        container.hidden = !categoriesExpanded;
        container.inert = false;
      }
      if (finishCategoryMotion === cleanup) finishCategoryMotion = null;
    };
    finishCategoryMotion = cleanup;
    Promise.allSettled(animations.map(animation => animation.finished)).then(cleanup);
  }

  function toggleCategories() {
    finishCategoryMotion?.();
    categoriesExpanded = !categoriesExpanded;
    renderCategoryToggle();
    animateCategories(categoriesExpanded);
  }

  function buildView(body) {
    const shop = createElement("div", "equipment-shop");
    const toolbar = createElement("div", "equipment-shop__toolbar");
    const search = createElement("input", "equipment-shop__search");
    search.type = "search";
    search.placeholder = "搜尋物品名稱";
    search.dataset.stateTransient = "true";
    search.setAttribute("aria-label", "搜尋商店物品");
    search.value = keywordText;
    search.addEventListener("input", () => {
      keywordText = search.value;
      keyword = keywordText.trim().toLowerCase();
      renderList();
    });
    const categoryToggle = createButton("equipment-shop__category-toggle");
    categoryToggle.setAttribute("aria-controls", "equipment-shop-categories");
    categoryToggle.addEventListener("click", toggleCategories);
    toolbar.append(search, categoryToggle);

    const categories = createElement("div", "equipment-shop__categories");
    categories.id = "equipment-shop-categories";
    categories.setAttribute("role", "group");
    categories.setAttribute("aria-label", "物品分類");
    CATEGORIES.forEach(([id, label]) => {
      const button = createButton("equipment-shop__category", label);
      button.dataset.shopCategory = id;
      button.addEventListener("click", () => {
        activeCategory = id;
        renderCategoryToggle();
        renderList();
      });
      categories.appendChild(button);
    });

    const list = createElement("div", "equipment-shop__list");
    list.setAttribute("aria-label", "商店物品");
    list.tabIndex = -1;
    const status = createElement("p", "equipment-shop__status sr-only");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    shop.append(toolbar, categories, list, status);
    body.appendChild(shop);
    return { shop, search, categoryToggle, categories, list, status };
  }

  // 標題下方顯示目前財產，標題列右側為購物車（含數量徽章）與關閉按鈕。
  function decorateShopHeader() {
    const header = view.root.querySelector(".app-dialog__header");
    const title = header.querySelector("h2");
    const heading = createElement("div", "equipment-shop__heading");
    title.replaceWith(heading);
    view.balance = createElement("p", "equipment-shop__balance");
    heading.append(title, view.balance);

    const cartButton = createButton("equipment-shop__cart-button");
    cartButton.setAttribute("aria-haspopup", "dialog");
    cartButton.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="19.5" r="1.5" fill="currentColor"/><circle cx="17" cy="19.5" r="1.5" fill="currentColor"/></svg>';
    const badge = createElement("span", "equipment-shop__badge");
    badge.setAttribute("aria-hidden", "true");
    cartButton.appendChild(badge);
    cartButton.addEventListener("click", () => openCartDialog(cartButton));
    createHeaderActions(view.root, [cartButton]);
    Object.assign(view, { cartButton, badge });
  }

  function focusItem(itemKey) {
    const row = [...(view?.list.querySelectorAll("[data-shop-item-key]") || [])].find(element => element.dataset.shopItemKey === itemKey);
    if (!row) return false;
    row.scrollIntoView({ block: "center" });
    (row.querySelector(".equipment-shop__scroll-spell") || row.querySelector(".equipment-shop__add"))?.focus();
    return true;
  }

  /**
   * 開啟商店。addKey 先把該品項加入購物清單；focusName 捲到該品項（如法術卷軸）。
   */
  function open({ trigger = null, addKey = "", focusName = "" } = {}) {
    if (view || !globalScope.AppDialog) return Promise.resolve(false);
    const items = getItems();
    const addedItem = items.find(item => item.key === addKey);
    const focusTarget = addedItem?.key || items.find(item => item.name === focusName)?.name || "";
    if (addedItem) addToCart(addedItem);
    if (focusTarget) {
      activeCategory = "all";
      keyword = "";
      keywordText = "";
    }
    const checkoutActions = createCheckoutActions();
    const dialog = globalScope.AppDialog.showMessage({
      title: "商店",
      variant: "equipment-shop",
      allowNested: true,
      trigger,
      initialFocus: "content",
      actions: checkoutActions,
      renderContent(body) {
        view = { ...buildView(body), checkoutActions };
      },
      onClose() {
        finishCategoryMotion?.();
        view = null;
      }
    });
    view.root = view.shop.closest(".app-dialog");
    decorateShopHeader();
    view.total = createElement("p", "equipment-shop__footer-text");
    decorateActions(view.root, view.total);
    renderCategoryToggle();
    renderList();
    renderCartState();
    if (focusTarget) focusItem(focusTarget);
    if (addedItem) announce(`已加入${addedItem.name}。`);
    return dialog;
  }

  document.addEventListener("click", event => {
    const trigger = event.target.closest?.("[data-equipment-shop-open]");
    if (!trigger) return;
    event.preventDefault();
    open({ trigger });
  });

  globalScope.EquipmentShop = Object.freeze({ open });
})(window);

/**
 * 商店視窗（傳統 defer script，無額外 runtime dependency）。
 *
 * - 品項：equipment-notes.js 依說明原文整理的 EQUIPMENT_SHOP_ITEMS；不另存價格或分類。
 * - 結帳：index.html 的 window.MoneyTracker.purchaseItems() 記一筆交易並寫入攜帶物品。
 * - 詳情：search.js 的 openEquipmentDetailDialog()，以 AppDialog 疊在商店上。
 * - 分類：武器、護甲、工具、法器與套組沿用說明原文的區塊；冒險用品、照明、容器、服裝、彈藥與魔法
 *   依 CURATED_CATEGORIES 排列，同一品項可列在多個類別，「全部」只在 ALL_VIEW_HOMES 指定處出現一次。
 * - 購物清單：標題列購物車按鈕開啟的 AppDialog，與商店同尺寸疊放；返回與 Escape 只關閉清單，
 *   關閉鈕與結帳成立時連同商店一起關閉。
 * - 法術卷軸：環階與法術取自 SpellCatalog，名稱寫成「法術名稱法術卷軸」。
 * - 購物清單、分類、展開狀態與搜尋只留在記憶體，不進角色 JSON、分享或 autosave。
 * - 暫存錢包：open({ wallet }) 改用呼叫端的餘額與結帳（如快速創角），不讀寫角色卡的財產或攜帶物品；
 *   只提供付款結帳，合計超過餘額時停用，不能免費取得或賒帳。購物清單只保留最近一個 wallet.id 的內容。
 */
(function (globalScope) {
  "use strict";

  const CATEGORIES = Object.freeze([
    ["all", "全部"], ["weapon", "武器"], ["armor", "護甲"], ["tool", "工具"], ["gear", "冒險用品"],
    ["light", "照明"], ["container", "容器"], ["clothing", "服裝"], ["ammo", "彈藥"],
    ["focus", "法器"], ["magic", "魔法"], ["pack", "套組"]
  ]);
  // 冒險用品依用途分組，其餘類別依此順序列出；品名對應 equipment-notes.js 的說明原文。
  const CURATED_CATEGORIES = Object.freeze({
    gear: [
      ["野營與生活", ["口糧", "睡袋", "毯子", "帳篷", "火絨盒", "油", "香水"]],
      ["醫療與藥劑", ["醫療包", "抗毒劑", "治療藥水"]],
      ["攀爬與探索", ["繩索", "弦線", "抓鉤", "攀爬工具", "爬梯", "長桿", "長鐵釘", "滑輪組", "撬棍", "鏟子", "便攜式攻城錘"]],
      ["戰鬥與陷阱", ["強酸", "煉金火焰", "聖水", "基礎毒藥", "捕網", "鐵蒺藜", "滾珠", "狩獵陷阱"]],
      ["束縛與上鎖", ["鏈條", "鐐銬", "鎖"]],
      ["觀察與信號", ["放大鏡", "望遠鏡", "鏡子", "信號笛", "鈴鐺"]],
      ["書寫與學識", ["紙", "羊皮紙", "墨水", "墨水筆", "書籍", "地圖"]]
    ],
    light: [["", ["火把", "蠟燭", "油燈", "附蓋提燈", "牛眼提燈", "油", "火絨盒"]]],
    container: [["", ["背包", "小包", "麻袋", "籃子", "箱子", "木桶", "手提桶", "鐵鍋", "壺", "水袋", "玻璃瓶", "扁瓶", "藥瓶", "地圖或捲軸盒"]]],
    clothing: [["", ["旅行者服裝", "高檔服裝", "戲服", "長袍"]]],
    ammo: [["", ["箭矢", "箭袋", "弩矢", "弩矢匣", "子彈，火器", "彈丸，投石索", "針", "小包"]]],
    magic: [["", ["法術卷軸", "治療藥水", "材料包"]]]
  });
  // 列在多個類別的品項，在「全部」只出現在這裡指定的類別。
  const ALL_VIEW_HOMES = Object.freeze({ 小包: "container", 油: "light", 火絨盒: "light", 治療藥水: "magic" });
  const BACK_ICON = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M9 14 4 9l5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const CART_ICON = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="19.5" r="1.5" fill="currentColor"/><circle cx="17" cy="19.5" r="1.5" fill="currentColor"/></svg>';
  const QUANTITY_MAX = 999;
  const DISCLOSURE_MS = 390;
  const sheetCart = new Map();
  let walletCart = { id: null, lines: new Map() };
  let cart = sheetCart;
  let wallet = null;
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

  function getCategoryLabel(id) {
    return CATEGORIES.find(([categoryId]) => categoryId === id)?.[1] || "全部";
  }

  // 彈藥在名稱後標示每份數量，例如「箭矢 (20)」。
  function getItemLabel(item) {
    return item.bundle ? `${item.name} (${item.bundle})` : item.name;
  }

  function formatPrice(item) {
    return `${item.amount} ${item.currency}`;
  }

  function formatCopper(copper) {
    return (wallet?.formatAmount || globalScope.MoneyTracker?.formatAmount)?.(copper) || `${copper} 銅幣`;
  }

  function readBalance() {
    return (wallet ? wallet.readTotal() : globalScope.MoneyTracker?.readTotal?.()) ?? 0;
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

  function matchesKeyword(item, section, group) {
    if (!keyword) return true;
    const english = globalScope.EQUIPMENT_ENGLISH_NAMES?.[item.name] || "";
    return [getItemLabel(item), item.variant, section.title, group.name, english]
      .some(value => String(value || "").toLowerCase().includes(keyword));
  }

  // 一個類別的分段：[{ title, groups: [{ name, items }] }]。
  function getCategorySections(categoryId) {
    const items = getItems();
    const curated = CURATED_CATEGORIES[categoryId];
    if (curated) {
      const groups = curated.map(([name, names]) => ({ name, items: names.flatMap(itemName => items.filter(item => item.name === itemName)) }));
      if (categoryId === "gear") {
        // 說明原文日後新增、尚未分類的冒險用品列在最後，避免商店漏掉。
        const placed = new Set(Object.values(CURATED_CATEGORIES).flatMap(layout => layout.flatMap(([, names]) => names)));
        const others = items.filter(item => ["gear", "scroll", "ammo"].includes(item.category) && !placed.has(item.name));
        if (others.length) groups.push({ name: "其他", items: others });
      }
      return [{ title: getCategoryLabel(categoryId), groups }];
    }
    // 武器、護甲、工具、法器與套組沿用說明原文的區塊、「多種」群組與順序。
    const sections = [];
    items.filter(item => item.category === categoryId).forEach(item => {
      const title = categoryId === "focus" || categoryId === "pack" ? getCategoryLabel(categoryId) : item.section;
      let section = sections.at(-1);
      if (section?.title !== title) sections.push(section = { title, groups: [] });
      let group = section.groups.at(-1);
      if (group?.name !== item.group) section.groups.push(group = { name: item.group, items: [] });
      group.items.push(item);
    });
    return sections;
  }

  // 「全部」依類別順序接續，跨類別品項只留在 ALL_VIEW_HOMES 指定的類別。
  function getVisibleSections() {
    const categoryIds = activeCategory === "all" ? CATEGORIES.slice(1).map(([id]) => id) : [activeCategory];
    return categoryIds.flatMap(categoryId => getCategorySections(categoryId).map(section => ({
      ...section,
      groups: section.groups.map(group => ({
        ...group,
        items: group.items.filter(item => (activeCategory !== "all" || (ALL_VIEW_HOMES[item.name] || categoryId) === categoryId)
          && matchesKeyword(item, section, group))
      })).filter(group => group.items.length)
    }))).filter(section => section.groups.length);
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
    const line = existing || { key, itemKey: item.key, name, label: spell ? name : getItemLabel(item), gearName: spell ? name : "", amount: item.amount, currency: item.currency, copper: item.copper, quantity: 0 };
    line.quantity = Math.min(QUANTITY_MAX, line.quantity + quantity);
    cart.set(key, line);
    return line;
  }

  function createItemNameButton(item) {
    const button = createButton("equipment-shop__detail", getItemLabel(item));
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
    announce(`已加入${line.label}，購物清單共 ${line.quantity} 個。`);
  }

  function createItemRow(item) {
    const row = createElement("li", "equipment-shop__item");
    row.dataset.shopItemKey = item.key;
    const name = createElement("div", "equipment-shop__item-name");
    name.appendChild(createItemNameButton(item));
    const price = createElement("span", "equipment-shop__price", formatPrice(item));
    const count = createElement("span", "equipment-shop__in-cart");
    count.dataset.shopCount = item.key;
    const add = createAddButton(getItemLabel(item));
    add.addEventListener("click", () => handleAdded(addToCart(item)));
    row.append(name, price, count, add);
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

  function renderList() {
    if (!view) return;
    const sections = getVisibleSections();
    const fragment = document.createDocumentFragment();
    sections.forEach(({ title, groups }) => {
      const section = createElement("section", "equipment-shop__section");
      section.appendChild(createElement("h3", "equipment-shop__section-title", title));
      const list = createElement("ul", "equipment-shop__items");
      groups.forEach(({ name, items }) => {
        if (name) list.appendChild(createElement("li", "equipment-shop__group", name));
        const renderedScrolls = new Set();
        items.forEach(item => {
          if (!Number.isInteger(item.spellLevel)) {
            list.appendChild(createItemRow(item));
          } else if (!renderedScrolls.has(item.name)) {
            renderedScrolls.add(item.name);
            list.appendChild(createScrollRow(items.filter(candidate => candidate.name === item.name && Number.isInteger(candidate.spellLevel))));
          }
        });
      });
      section.appendChild(list);
      fragment.appendChild(section);
    });
    if (!sections.length) fragment.appendChild(createElement("p", "equipment-shop__empty", keyword ? `找不到包含「${keywordText.trim()}」的物品。` : "此分類沒有物品。"));
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

  // 暫存錢包不能賒帳：合計超過餘額時與空清單一樣停用結帳。
  function isCheckoutBlocked() {
    return !cart.size || Boolean(wallet && getCartTotal() > readBalance());
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
      view.balance.textContent = `${wallet?.balanceLabel || "目前財產"}：${formatCopper(readBalance())}`;
      const walletShortfall = wallet && lines.length ? total - readBalance() : 0;
      view.total.textContent = !lines.length ? ""
        : walletShortfall > 0 ? `合計 ${formatCopper(total)}，尚缺 ${formatCopper(walletShortfall)}`
          : `合計 ${formatCopper(total)}`;
      view.total.classList.toggle("is-shortfall", walletShortfall > 0);
      setCheckoutDisabled(view.checkoutActions, view.root, isCheckoutBlocked());
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
    const name = createElement("span", "equipment-shop__cart-name", line.label);
    const subtotal = createElement("span", "equipment-shop__subtotal", `${line.amount * line.quantity} ${line.currency}`);
    const controls = createElement("div", "equipment-shop__quantity");
    const minus = createButton("equipment-shop__step", "−");
    minus.dataset.shopControl = "minus";
    minus.setAttribute("aria-label", `減少${line.label}數量`);
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
    input.setAttribute("aria-label", `${line.label}數量`);
    input.addEventListener("change", () => setLineQuantity(line, input.value));
    const plus = createButton("equipment-shop__step", "＋");
    plus.dataset.shopControl = "plus";
    plus.setAttribute("aria-label", `增加${line.label}數量`);
    plus.disabled = line.quantity >= QUANTITY_MAX;
    plus.addEventListener("click", () => setLineQuantity(line, line.quantity + 1));
    controls.append(minus, input, plus);
    const remove = createButton("equipment-shop__remove", "移除");
    remove.dataset.shopControl = "remove";
    remove.setAttribute("aria-label", `從購物清單移除${line.label}`);
    remove.addEventListener("click", () => {
      cart.delete(line.key);
      renderCartState();
      announce(`已移除${line.label}。`);
      (cartView?.list.querySelector(".equipment-shop__remove") || cartView?.back)?.focus();
    });
    item.append(name, subtotal, controls, remove);
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
    cartView.total.textContent = `合計金額：${formatCopper(total)}`;
    cartView.list.replaceChildren(...lines.map(createCartLine));
    cartView.empty.hidden = lines.length > 0;
    cartView.clear.disabled = !lines.length;
    const shortfall = total - balance;
    cartView.summary.classList.toggle("is-shortfall", lines.length > 0 && shortfall > 0);
    cartView.summary.textContent = !lines.length ? ""
      : shortfall > 0 ? `${wallet ? "金額不足，無法結帳" : "財產不足"}，尚缺 ${formatCopper(shortfall)}`
        : `結帳後 ${formatCopper(balance - total)}`;
    setCheckoutDisabled(cartView.checkoutActions, cartView.root, isCheckoutBlocked());
    if (focusedKey && focusedControl) {
      const selector = `[data-shop-cart-key="${CSS.escape(focusedKey)}"]`;
      const control = cartView.list.querySelector(`${selector} [data-shop-control="${focusedControl}"]`);
      (control && !control.disabled ? control : cartView.list.querySelector(`${selector} [data-shop-control="quantity"]`))?.focus();
    }
  }

  async function checkout(free) {
    const lines = getCartLines();
    const purchaseItems = wallet ? wallet.purchaseItems : globalScope.MoneyTracker?.purchaseItems;
    if (isCheckoutBlocked() || (wallet && free) || typeof purchaseItems !== "function") return false;
    const purchased = await purchaseItems(
      lines.map(({ name, gearName, amount, currency, quantity }) => ({ name, gearName, amount, currency, quantity })),
      { free }
    );
    if (!purchased) {
      renderCartState();
      return false;
    }
    const summary = lines.map(line => (line.quantity === 1 ? line.label : `${line.label} ×${line.quantity}`)).join("、");
    cart.clear();
    globalScope.AppDialog.notify(`${free ? "已免費取得" : "已購買"}：${summary}，${wallet?.checkoutNotice || "已加入攜帶物品。"}`, { tone: "success" });
    return true;
  }

  function createCheckoutActions() {
    const paid = { label: "結帳", intent: "primary", value: "paid", resolve: () => checkout(false) };
    return wallet ? [paid] : [{ label: "免費取得", value: "free", resolve: () => checkout(true) }, paid];
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

  async function confirmClearCart() {
    if (!cart.size || !cartView) return;
    const confirmed = await globalScope.AppDialog.requestDecision({
      title: "清空購物清單？",
      message: "購物清單中的物品會全部移除。",
      cancelLabel: "取消",
      confirmLabel: "清空",
      intent: "danger",
      trigger: cartView.clear
    });
    if (!confirmed || !cartView) return;
    cart.clear();
    renderCartState();
    announce("已清空購物清單。");
    cartView.back.focus();
  }

  // 標題列：清空緊接在標題文字右側、下方為合計金額；右側依序為返回與關閉。
  function decorateCartHeader(closeShop) {
    const header = cartView.root.querySelector(".app-dialog__header");
    const title = header.querySelector("h2");
    const heading = createElement("div", "equipment-shop__heading");
    const titleRow = createElement("div", "equipment-shop__title-row");
    title.replaceWith(heading);
    cartView.clear = createButton("equipment-shop__clear", "清空");
    cartView.clear.setAttribute("aria-haspopup", "dialog");
    cartView.clear.addEventListener("click", confirmClearCart);
    titleRow.append(title, cartView.clear);
    cartView.total = createElement("p", "equipment-shop__balance");
    heading.append(titleRow, cartView.total);
    cartView.title = title;

    const close = header.querySelector(".app-dialog__close");
    close.setAttribute("aria-label", "關閉購物清單與商店");
    const back = createButton("equipment-shop__icon-button equipment-shop__back");
    back.setAttribute("aria-label", "返回商店");
    back.innerHTML = BACK_ICON;
    let returning = false;
    back.addEventListener("click", () => {
      returning = true;
      close.click();
    });
    // 在 AppDialog 關閉購物清單前（標題列的 capture 階段）記下要一併關閉商店；
    // 使用者點擊時 Promise 回呼會在監聽器之間執行，太晚設定就趕不上。
    header.addEventListener("click", event => {
      if (event.target.closest?.(".app-dialog__close") === close && !returning) closeShop();
    }, { capture: true });
    createHeaderActions(cartView.root, [back]);
    cartView.back = back;
  }

  function openCartDialog(trigger) {
    if (cartView || !view) return;
    const checkoutActions = createCheckoutActions();
    let closeShopAfter = false;
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
    decorateCartHeader(() => { closeShopAfter = true; });
    cartView.summary = createElement("p", "equipment-shop__footer-text");
    cartView.summary.setAttribute("aria-live", "polite");
    decorateActions(cartView.root, cartView.summary);
    renderCartState();
    if (!cart.size) cartView.back.focus();
    // 購物清單關閉後，若是結帳成立或按下關閉鈕，再一併關閉商店，焦點回到開啟商店的按鈕。
    dialog.then(result => {
      if (result === true || closeShopAfter) view?.root.querySelector(".app-dialog__close")?.click();
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

    const cartButton = createButton("equipment-shop__icon-button equipment-shop__cart-button");
    cartButton.setAttribute("aria-haspopup", "dialog");
    cartButton.innerHTML = CART_ICON;
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
   * wallet：{ id, readTotal(), purchaseItems(items), formatAmount?, balanceLabel?, checkoutNotice? }，
   * 省略時使用角色卡的 MoneyTracker；id 改變時捨棄先前未結帳的暫存購物清單。
   * 呼叫端重置錢包時可用 clearWalletCart(id) 立即清空，不影響角色卡的購物清單。
   */
  function open({ trigger = null, addKey = "", focusName = "", wallet: requestedWallet = null } = {}) {
    if (view || !globalScope.AppDialog) return Promise.resolve(false);
    if (requestedWallet && (typeof requestedWallet.readTotal !== "function" || typeof requestedWallet.purchaseItems !== "function")) return Promise.resolve(false);
    wallet = requestedWallet;
    if (wallet && walletCart.id !== wallet.id) walletCart = { id: wallet.id, lines: new Map() };
    cart = wallet ? walletCart.lines : sheetCart;
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
      // 不預設聚焦搜尋欄，以免手機一開商店就跳出鍵盤；開啟後改聚焦類別按鈕或指定品項。
      initialFocus: "primary",
      actions: checkoutActions,
      renderContent(body) {
        view = { ...buildView(body), checkoutActions };
      },
      onClose() {
        finishCategoryMotion?.();
        view = null;
        wallet = null;
        cart = sheetCart;
      }
    });
    view.root = view.shop.closest(".app-dialog");
    decorateShopHeader();
    view.total = createElement("p", "equipment-shop__footer-text");
    decorateActions(view.root, view.total);
    renderCategoryToggle();
    renderList();
    renderCartState();
    if (!focusTarget || !focusItem(focusTarget)) view.categoryToggle.focus();
    if (addedItem) announce(`已加入${addedItem.name}。`);
    return dialog;
  }

  document.addEventListener("click", event => {
    const trigger = event.target.closest?.("[data-equipment-shop-open]");
    if (!trigger) return;
    event.preventDefault();
    open({ trigger });
  });

  function clearWalletCart(id) {
    if (walletCart.id !== id) return;
    walletCart.lines.clear();
    if (wallet?.id === id) renderCartState();
  }

  globalScope.EquipmentShop = Object.freeze({ open, clearWalletCart });
})(window);

(function initFloatingTopOffset() {
  const tabsShell = document.querySelector(".tabs-shell");
  if (!tabsShell) return;

  const updateFloatingTopOffset = () => {
    const shellRect = tabsShell.getBoundingClientRect();
    const safeOffset = Math.max(Math.round(shellRect.bottom - 4), 56);
    document.documentElement.style.setProperty("--floating-top-offset", `${safeOffset}px`);
  };

  const rafUpdateFloatingTopOffset = () => window.requestAnimationFrame(updateFloatingTopOffset);

  const resizeObserver = window.ResizeObserver ? new ResizeObserver(rafUpdateFloatingTopOffset) : null;
  resizeObserver?.observe(tabsShell);

  const mutationObserver = window.MutationObserver ? new MutationObserver(rafUpdateFloatingTopOffset) : null;
  mutationObserver?.observe(tabsShell, {
    attributes: true,
    attributeFilter: ["class", "style"],
    childList: true,
    subtree: true
  });

  window.addEventListener("resize", rafUpdateFloatingTopOffset, { passive: true });
  window.addEventListener("orientationchange", rafUpdateFloatingTopOffset, { passive: true });
  window.addEventListener("tabchange", rafUpdateFloatingTopOffset);
  updateFloatingTopOffset();
})();

// 捲動按鈕（工具選單的開關）：平常捲整頁；有視窗開著時改捲最上層視窗的內容區，
// 按鈕移到內容區右下角、不蓋住視窗底部的操作列；最上層視窗沒有可捲的內容時不顯示。
// 兩顆按鈕包在 #scroll-buttons 裡，各視窗鎖背景（inert）時都跳過這個 id。
(function initScrollButtons() {
  if (document.getElementById("scroll-buttons")) return;

  const wrapper = document.createElement("div");
  wrapper.id = "scroll-buttons";
  const createButton = (id, text) => {
    const button = document.createElement("button");
    button.id = id;
    button.type = "button";
    button.textContent = text;
    wrapper.appendChild(button);
    return button;
  };
  const topButton = createButton("scrollToTopBtn", "▲");
  const bottomButton = createButton("scrollToBottomBtn", "▼");
  const buttons = [topButton, bottomButton];
  document.body.appendChild(wrapper);

  // 會蓋住頁面的視窗。scroll 是內容區的候選（取第一個真的能捲的）；沒有 scroll 的視窗沒有可捲內容，開著時按鈕不顯示。
  // 新的 AppDialog 不用登記；自己做的視窗要補在這裡，並在鎖背景時跳過 #scroll-buttons。
  const MODALS = [
    { selector: ".app-dialog", scroll: [".equipment-shop__list", ".magic-item-detail", ".app-dialog__body"] },
    { selector: "#quick-build-wizard", openClass: "open", scroll: [".quick-build-body"] },
    { selector: "#quick-build-spell-detail", openClass: "open", scroll: ["#quick-build-spell-detail-content"] },
    { selector: "#quick-build-pact-tome", openClass: "open", scroll: [".quick-build-pact-tome-body"] },
    { selector: "#adventure-journal", scroll: [".journal-body"] },
    { selector: "#deity-info-modal", openClass: "open", scroll: [".deity-info-content"] },
    { selector: "#equipment-detail-modal", openClass: "open", scroll: [".equipment-detail-modal__content"] },
    { selector: "#tabletop-condition-modal", scroll: [".tabletop-condition-modal__body"] },
    { selector: ".money-modal", scroll: [".money-log-list", ".money-modal-card"] },
    { selector: "#point-buy-modal", openClass: "open", scroll: [".point-buy-modal-card"] },
    { selector: "#default-ability-class-modal", openClass: "open", scroll: [".default-ability-class-card"] },
    { selector: ".pdf-export-flow-modal", scroll: [".pdf-export-flow-modal__card"] },
    { selector: "#dice-roller-modal", openClass: "is-open", scroll: [".dice-roller-stage.is-history"] },
    { selector: "#legal-modal", scroll: [".legal-modal-card"] },
    { selector: "#ability-choice-modal", openClass: "open" },
    { selector: "#point-buy-exit-modal", openClass: "open" },
    { selector: "#spell-qr-modal", openClass: "open" },
    { selector: "#tabletop-avatar-modal" }
  ];

  const toggle = document.getElementById("scroll-buttons-toggle");
  const storageKey = "dnd.scrollButtonsVisible.v1";
  let activeRoot = null;
  let activeTarget = null;
  let updateQueued = false;

  const isOpen = (root, entry) => {
    if (root.hidden || root.classList.contains("is-hidden")) return false;
    if (entry.openClass && !root.classList.contains(entry.openClass)) return false;
    return window.getComputedStyle(root).display !== "none";
  };

  const isScrollable = (element) => {
    if (!element.getClientRects().length || element.scrollHeight - element.clientHeight < 8) return false;
    return /^(auto|scroll)$/.test(window.getComputedStyle(element).overflowY);
  };

  // 最上層的視窗：z-index 最大的；相同時取文件順序較後的（巢狀的 AppDialog）。
  const findTopModal = () => {
    let top = null;
    MODALS.forEach((entry) => {
      document.querySelectorAll(entry.selector).forEach((root) => {
        if (!isOpen(root, entry)) return;
        const zIndex = Number.parseInt(window.getComputedStyle(root).zIndex, 10) || 0;
        const isAbove = !top || zIndex > top.zIndex
          || (zIndex === top.zIndex && (top.root.compareDocumentPosition(root) & Node.DOCUMENT_POSITION_FOLLOWING));
        if (isAbove) top = { root, entry, zIndex };
      });
    });
    return top;
  };

  const findScrollTarget = (modal) => {
    for (const selector of modal.entry.scroll || []) {
      const target = Array.from(modal.root.querySelectorAll(selector)).find(isScrollable);
      if (target) return target;
    }
    return null;
  };

  const queueUpdate = () => {
    if (updateQueued) return;
    updateQueued = true;
    window.requestAnimationFrame(update);
  };
  const queueUpdateInModal = () => { if (activeRoot) queueUpdate(); };

  const rootObserver = window.MutationObserver ? new MutationObserver(queueUpdate) : null;
  const contentObserver = window.MutationObserver ? new MutationObserver(queueUpdate) : null;
  const resizeObserver = window.ResizeObserver ? new ResizeObserver(queueUpdate) : null;
  const observedRoots = new WeakSet();
  const observeRoots = () => {
    if (!rootObserver) return;
    MODALS.forEach((entry) => {
      document.querySelectorAll(entry.selector).forEach((root) => {
        if (observedRoots.has(root)) return;
        observedRoots.add(root);
        rootObserver.observe(root, { attributes: true, attributeFilter: ["class", "hidden", "style"] });
      });
    });
  };

  function update() {
    updateQueued = false;
    const modal = findTopModal();
    const target = modal ? findScrollTarget(modal) : null;
    const root = modal ? modal.root : null;

    if (root !== activeRoot) {
      contentObserver?.disconnect();
      // 視窗內容換頁、換步驟或展開後，能不能捲、內容區在哪裡都可能改變。
      if (root) contentObserver?.observe(root, { childList: true, subtree: true });
      activeRoot = root;
    }
    if (target !== activeTarget) {
      resizeObserver?.disconnect();
      if (target) resizeObserver?.observe(target);
      activeTarget = target;
    }

    const visible = (!toggle || toggle.checked) && (!modal || Boolean(target));
    wrapper.classList.toggle("is-in-modal", Boolean(modal));
    topButton.setAttribute("aria-label", modal ? "回到視窗內容頂端" : "回到頁面頂端");
    bottomButton.setAttribute("aria-label", modal ? "移至視窗內容底部" : "移至當前頁面底部");
    buttons.forEach((button) => {
      button.style.display = visible ? "" : "none";
      button.style.right = "";
      button.style.bottom = "";
      button.style.zIndex = "";
    });
    if (!visible || !target) return;

    // 貼著內容區的右下角，讓開捲軸；層級只比這個視窗高一層，更上層的提示與 toast 仍蓋得住。
    const rect = target.getBoundingClientRect();
    const scrollbarWidth = Math.max(0, target.offsetWidth - target.clientWidth);
    const right = Math.max(0, document.documentElement.clientWidth - rect.right) + scrollbarWidth + 4;
    const bottom = Math.max(0, window.innerHeight - rect.bottom) + 4;
    buttons.forEach((button) => {
      button.style.right = `${Math.round(right)}px`;
      button.style.zIndex = String(modal.zIndex + 1);
    });
    bottomButton.style.bottom = `${Math.round(bottom)}px`;
    topButton.style.bottom = `calc(${Math.round(bottom)}px + 2.5rem)`;
  }

  topButton.addEventListener("click", () => {
    update();
    (activeTarget || window).scrollTo({ top: 0, behavior: "smooth" });
  });
  bottomButton.addEventListener("click", () => {
    update();
    if (activeTarget) activeTarget.scrollTo({ top: activeTarget.scrollHeight, behavior: "smooth" });
    else window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
  });
  // 視窗開著時按鈕不拿焦點：焦點留在視窗裡，Escape 與 Tab 循環照常。
  wrapper.addEventListener("mousedown", (event) => {
    if (activeRoot) event.preventDefault();
  });

  if (toggle) {
    toggle.checked = window.dndStorage.getItem(storageKey) === "true";
    toggle.addEventListener("change", () => {
      window.dndStorage.setItem(storageKey, String(toggle.checked));
      update();
    });
  }

  // 視窗沒有共用的開關事件：看 body 新增／移除的視窗，以及各視窗自己的 class／hidden／style。
  if (window.MutationObserver) {
    new MutationObserver(() => {
      observeRoots();
      queueUpdate();
    }).observe(document.body, { childList: true });
  }
  observeRoots();
  window.addEventListener("resize", queueUpdate, { passive: true });
  window.addEventListener("orientationchange", queueUpdate, { passive: true });
  window.addEventListener("character-features-tabchange", queueUpdateInModal);
  ["click", "toggle", "animationend", "transitionend"].forEach((type) => {
    document.addEventListener(type, queueUpdateInModal, true);
  });
  update();
})();

(function initSpellSearchFloatingButton() {
  if (document.getElementById("spell-search-fab")) return;

  const spellToolbar = document.getElementById("spell-tab-toolbar");
  const spellTab = document.getElementById("tab-spells");
  if (!spellToolbar || !spellTab) return;

  const spellSearchFab = document.createElement("button");
  spellSearchFab.id = "spell-search-fab";
  spellSearchFab.type = "button";
  spellSearchFab.textContent = "🔍";
  spellSearchFab.classList.add("is-hidden");
  spellSearchFab.setAttribute("aria-label", "切換法術搜尋列");
  document.body.appendChild(spellSearchFab);

  let isSpellToolbarVisible = false;
  const spellSearchInput = document.getElementById("spell-search");

  const setSpellToolbarVisibility = (visible) => {
    isSpellToolbarVisible = !!visible;
    spellToolbar.classList.toggle("is-hidden", !isSpellToolbarVisible);
    spellSearchFab.classList.toggle("toolbar-open", isSpellToolbarVisible);
    spellTab.classList.toggle("spell-toolbar-visible", isSpellToolbarVisible);
  };

  const closeSpellToolbar = () => {
    if (spellSearchInput) spellSearchInput.value = "";
    window.clearSpellSearchResults?.();
    setSpellToolbarVisibility(false);
  };

  const syncWithActiveTab = (tab) => {
    const activeTab = tab || document.querySelector(".tab-content.active")?.id?.replace("tab-", "");
    if (activeTab === "spells") {
      spellSearchFab.classList.remove("is-hidden");
      return;
    }
    spellSearchFab.classList.add("is-hidden");
    closeSpellToolbar();
  };

  spellSearchFab.addEventListener("click", () => {
    if (isSpellToolbarVisible) {
      closeSpellToolbar();
      return;
    }
    setSpellToolbarVisibility(true);
    // 同步聚焦，保留手機瀏覽器開啟螢幕鍵盤的使用者操作時機。
    spellSearchInput?.focus();
  });

  window.addEventListener("tabchange", (event) => {
    syncWithActiveTab(event?.detail?.tab);
  });

  syncWithActiveTab();
})();

(function initEquipmentSearchFloatingButton() {
  if (document.getElementById("equipment-search-fab")) return;

  const equipmentToolbar = document.getElementById("equipment-tab-toolbar");
  const equipmentTab = document.getElementById("tab-equipment");
  if (!equipmentToolbar || !equipmentTab) return;

  const equipmentSearchFab = document.createElement("button");
  equipmentSearchFab.id = "equipment-search-fab";
  equipmentSearchFab.type = "button";
  equipmentSearchFab.textContent = "\uD83D\uDD0D";
  equipmentSearchFab.classList.add("is-hidden");
  equipmentSearchFab.setAttribute("aria-label", "開啟裝備搜尋");
  document.body.appendChild(equipmentSearchFab);

  let isEquipmentToolbarVisible = false;
  const equipmentSearchInput = document.getElementById("equipment-search");

  const setEquipmentToolbarVisibility = (visible) => {
    isEquipmentToolbarVisible = !!visible;
    equipmentToolbar.classList.toggle("is-hidden", !isEquipmentToolbarVisible);
    equipmentSearchFab.classList.toggle("toolbar-open", isEquipmentToolbarVisible);
    equipmentTab.classList.toggle("equipment-toolbar-visible", isEquipmentToolbarVisible);
  };

  const openEquipmentSearchSections = () => {
    document.querySelectorAll("#equipment-notes-section > .section > details").forEach((detail) => {
      detail.open = true;
    });
    window.prepareEquipmentSearch?.();
  };

  const closeEquipmentToolbar = () => {
    if (equipmentSearchInput) equipmentSearchInput.value = "";
    window.applyEquipmentFilter?.();
    setEquipmentToolbarVisibility(false);
  };

  const syncWithActiveTab = (tab) => {
    const activeTab = tab || document.querySelector(".tab-content.active")?.id?.replace("tab-", "");
    if (activeTab === "equipment") {
      equipmentSearchFab.classList.remove("is-hidden");
      return;
    }
    equipmentSearchFab.classList.add("is-hidden");
    closeEquipmentToolbar();
  };

  equipmentSearchFab.addEventListener("click", () => {
    if (isEquipmentToolbarVisible) {
      closeEquipmentToolbar();
      return;
    }
    openEquipmentSearchSections();
    setEquipmentToolbarVisibility(true);
    equipmentSearchInput?.focus();
  });

  window.addEventListener("tabchange", (event) => {
    syncWithActiveTab(event?.detail?.tab);
  });

  syncWithActiveTab();
})();

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

(function initScrollToTopButton() {
  if (document.getElementById("scrollToTopBtn")) return;

  const scrollToTopBtn = document.createElement("button");
  scrollToTopBtn.id = "scrollToTopBtn";
  scrollToTopBtn.type = "button";
  scrollToTopBtn.textContent = "▲";
  scrollToTopBtn.setAttribute("aria-label", "回到頁面頂端");

  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.body.appendChild(scrollToTopBtn);
})();

(function initScrollToBottomButton() {
  if (document.getElementById("scrollToBottomBtn")) return;

  const scrollToBottomBtn = document.createElement("button");
  scrollToBottomBtn.id = "scrollToBottomBtn";
  scrollToBottomBtn.type = "button";
  scrollToBottomBtn.textContent = "▼";
  scrollToBottomBtn.setAttribute("aria-label", "移至當前頁面底部");

  scrollToBottomBtn.addEventListener("click", () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
  });

  document.body.appendChild(scrollToBottomBtn);
})();

(function initScrollButtonsToggle() {
  const toggle = document.getElementById("scroll-buttons-toggle");
  if (!toggle) return;

  const storageKey = "dnd.scrollButtonsVisible.v1";
  const buttons = [document.getElementById("scrollToTopBtn"), document.getElementById("scrollToBottomBtn")];
  const updateVisibility = () => {
    buttons.forEach((button) => {
      if (button) button.style.display = toggle.checked ? "" : "none";
    });
  };

  toggle.checked = window.dndStorage.getItem(storageKey) === "true";
  updateVisibility();
  toggle.addEventListener("change", () => {
    window.dndStorage.setItem(storageKey, String(toggle.checked));
    updateVisibility();
  });
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

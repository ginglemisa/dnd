(function initScrollToTopButton() {
  if (document.getElementById("scrollToTopBtn")) return;

  const scrollToTopBtn = document.createElement("button");
  scrollToTopBtn.id = "scrollToTopBtn";
  scrollToTopBtn.type = "button";
  scrollToTopBtn.textContent = "▲";
  scrollToTopBtn.setAttribute("aria-label", "回到頁面頂端");
  scrollToTopBtn.style.display = "none";

  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const updateVisibility = () => {
    scrollToTopBtn.style.display = window.scrollY > 220 ? "block" : "none";
  };

  document.body.appendChild(scrollToTopBtn);
  window.addEventListener("scroll", updateVisibility, { passive: true });
  updateVisibility();
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
    window.applySpellFilter?.();
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

(function initSpellSlotQuickJump() {
  const spellTab = document.getElementById("tab-spells");
  if (!spellTab) return;

  const headerOffset = 92;
  const jumpConfig = [
    { rowId: "spellslot1-row", level: 1, label: "一環" },
    { rowId: "spellslot2-row", level: 2, label: "二環" },
    { rowId: "spellslot3-row", level: 3, label: "三環" }
  ];

  const smoothScrollToElement = (element) => {
    if (!element) return;
    const targetY = element.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(targetY, 0), behavior: "smooth" });
  };

  const getFirstSpellTarget = (level) => {
    const levelSection = document.querySelector(`#tab-spells details.spell-level-section:nth-of-type(${level + 1})`);
    if (levelSection) levelSection.open = true;

    const spellArea = document.getElementById(`level${level}spells-area`);
    const firstSpell = spellArea?.querySelector(".spell-entry");
    return firstSpell || spellArea || levelSection || null;
  };

  const handleJump = (level) => {
    const target = getFirstSpellTarget(level);
    if (target) smoothScrollToElement(target);
  };

  jumpConfig.forEach(({ rowId, level, label }) => {
    const row = document.getElementById(rowId);
    const slotLabel = row?.querySelector(".spell-slot-label");
    if (!slotLabel) return;

    slotLabel.classList.add("spell-slot-label--jump");
    slotLabel.setAttribute("role", "button");
    slotLabel.setAttribute("tabindex", "0");
    slotLabel.setAttribute("aria-label", `跳到${label}法術`);
    slotLabel.title = `跳到${label}法術`;

    slotLabel.addEventListener("click", () => handleJump(level));
    slotLabel.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleJump(level);
      }
    });
  });
})();

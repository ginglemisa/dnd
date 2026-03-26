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

  const setSpellToolbarVisibility = (visible) => {
    isSpellToolbarVisible = !!visible;
    spellToolbar.classList.toggle("is-hidden", !isSpellToolbarVisible);
    spellSearchFab.classList.toggle("toolbar-open", isSpellToolbarVisible);
    spellTab.classList.toggle("spell-toolbar-visible", isSpellToolbarVisible);
  };

  const syncWithActiveTab = (tab) => {
    const activeTab = tab || document.querySelector(".tab-content.active")?.id?.replace("tab-", "");
    if (activeTab === "spells") {
      spellSearchFab.classList.remove("is-hidden");
      setSpellToolbarVisibility(false);
      return;
    }
    spellSearchFab.classList.add("is-hidden");
    setSpellToolbarVisibility(false);
  };

  spellSearchFab.addEventListener("click", () => {
    setSpellToolbarVisibility(!isSpellToolbarVisible);
  });

  window.addEventListener("tabchange", (event) => {
    syncWithActiveTab(event?.detail?.tab);
  });

  syncWithActiveTab();
})();

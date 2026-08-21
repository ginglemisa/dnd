(function() {
  "use strict";

  const TAB_HEADER_OFFSET = 96;
  const SCROLL_DURATION = 480;

  function isElementVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== "none"
      && style.visibility !== "hidden"
      && style.opacity !== "0"
      && element.getClientRects().length > 0;
  }

  function waitForLayoutStability() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => window.setTimeout(resolve, 60));
      });
    });
  }

  function animateWindowScrollTo(targetY, durationMs = SCROLL_DURATION) {
    return new Promise((resolve) => {
      const startY = window.scrollY;
      const maxScroll = Math.max(0, document.body.scrollHeight - window.innerHeight);
      const finalY = Math.max(0, Math.min(targetY, maxScroll));
      const distance = finalY - startY;
      if (Math.abs(distance) < 1) {
        window.scrollTo(0, finalY);
        resolve();
        return;
      }

      const startedAt = performance.now();
      const tick = (now) => {
        const progress = Math.min(1, (now - startedAt) / durationMs);
        const eased = 1 - Math.pow(1 - progress, 3);
        window.scrollTo(0, startY + distance * eased);
        if (progress < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
  }

  function getUnionRect(elements) {
    const rects = elements
      .filter(isElementVisible)
      .map((element) => element.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0);
    if (!rects.length) return null;
    return {
      left: Math.min(...rects.map((rect) => rect.left)),
      top: Math.min(...rects.map((rect) => rect.top)),
      right: Math.max(...rects.map((rect) => rect.right)),
      bottom: Math.max(...rects.map((rect) => rect.bottom))
    };
  }

  class OnboardingTour {
    constructor() {
      this.overlay = document.getElementById("tour-overlay");
      this.maskGroups = [1, 2].map((index) => ({
        top: document.getElementById(`tour-mask-top-${index}`),
        left: document.getElementById(`tour-mask-left-${index}`),
        right: document.getElementById(`tour-mask-right-${index}`),
        bottom: document.getElementById(`tour-mask-bottom-${index}`)
      }));
      this.focusRings = [
        document.getElementById("tour-focus-ring"),
        document.getElementById("tour-focus-ring-secondary")
      ];
      this.tooltip = document.getElementById("tour-tooltip");
      this.title = document.getElementById("tour-step-title");
      this.text = document.getElementById("tour-step-text");
      this.progress = document.getElementById("tour-step-progress");
      this.prevBtn = document.getElementById("tour-prev-btn");
      this.nextBtn = document.getElementById("tour-next-btn");
      this.skipBtn = document.getElementById("tour-skip-btn");
      this.steps = [];
      this.currentIndex = -1;
      this.stepPhase = 0;
      this.active = false;
      this.isTransitioning = false;
      this.spellPreviewSnapshot = null;
      this.searchStateSnapshot = null;
      this.backgroundInertSnapshot = null;
      this.pointBuyPreviewOpened = false;
      this.pointBuyCardWasInert = false;
      this.pointBuyCardStateCaptured = false;
      this.utilityMenuPreviewOpened = false;
      this.handleResize = this.handleResize.bind(this);
      this.handleKeydown = this.handleKeydown.bind(this);
      this.handleFocusIn = this.handleFocusIn.bind(this);
      this.preventScrollEvent = this.preventScrollEvent.bind(this);
    }

    init() {
      if (!this.overlay || !this.prevBtn || !this.nextBtn || !this.skipBtn) return;
      this.prevBtn.addEventListener("click", () => this.prev());
      this.nextBtn.addEventListener("click", () => this.next());
      this.skipBtn.addEventListener("click", () => this.stop());
      window.addEventListener("resize", this.handleResize);
      document.addEventListener("keydown", this.handleKeydown);
      document.addEventListener("focusin", this.handleFocusIn);
      document.getElementById("restart-onboarding-btn")?.addEventListener("click", () => this.start());
    }

    getSteps() {
      return [
        {
          tab: "basic",
          title: "⚔️ 1. 決定你的冒險者方向",
          text: "背景代表角色過去，種族帶來天生特性，職業則決定冒險方式。選擇後，生命值、能力與相關資料會跟著更新。",
          placement: "bottom",
          getHoles: () => {
            const identity = this.getHoleFromElements([
              document.querySelector(".basic-row--class-level"),
              document.querySelector(".basic-row--origin")
            ], 8);
            const derived = this.getHoleFromElements([
              document.querySelector(".basic-row--vitals"),
              document.querySelector(".basic-row--combat")
            ], 8);
            return [identity, derived].filter(Boolean);
          },
          beforePosition: async () => {
            await animateWindowScrollTo(0);
          }
        },
        {
          tab: "basic",
          title: () => this.stepPhase === 0
            ? "🎲 2. 屬性與快速創角"
            : "🎲 2. 使用 27 購點",
          text: () => this.stepPhase === 0
            ? "六項屬性決定角色擅長什麼；上方是檢定常用的修正值。點擊「決定屬性」可以快速套用或自行配點。"
            : "27 購點可自由配置六項屬性，背景加值會另外計算。第一次創角則推薦從「決定屬性」裡開啟創角精靈，由它帶你完成一名 1 級角色。",
          placement: () => this.stepPhase === 0 ? "top" : "overlay-bottom",
          getHoles: () => {
            if (this.stepPhase === 1) {
              return [this.getHoleForSelector("#point-buy-modal .point-buy-modal-card", 6)].filter(Boolean);
            }
            return [
              this.getHoleForSelector("#set-default-abilities", 8),
              this.getHoleForSelector("#tab-basic .ability-grid", 8)
            ].filter(Boolean);
          },
          beforePosition: async () => {
            if (this.stepPhase === 1) {
              await this.openPointBuyPreview();
              return;
            }
            this.closePointBuyPreview();
            await this.scrollElementIntoView(document.querySelector("#set-default-abilities"), 150);
          },
          afterLeave: () => this.closePointBuyPreview()
        },
        {
          tab: "equipment",
          title: "🛡️ 3. 確認武器、護甲與 AC",
          text: "選擇目前使用的武器與護甲，下方會整理傷害、射程、武器精通與 AC。點擊摘要中的名稱還能查看詳細規則。",
          placement: "bottom",
          getHoles: () => [this.getHoleFromElements([
            document.querySelector("#tab-equipment .equipment-loadout-controls"),
            document.querySelector("#tab-equipment .equipment-loadout-summary")
          ], 8)].filter(Boolean),
          beforePosition: async () => {
            await this.scrollElementIntoView(document.querySelector("#tab-equipment > .section"));
          }
        },
        {
          tab: "spells",
          title: "✨ 4. 選擇與查看法術",
          text: "有施法能力時，可以在這裡管理戲法與法術。選擇法術後，可查看完整說明與施法資料。",
          placement: "top",
          getHoles: () => [this.getHoleFromElements([
            document.querySelector("#tab-spells details.spell-level-section")
          ], 8)].filter(Boolean),
          beforeTab: () => this.ensureSpellPreview(),
          beforePosition: async () => {
            const firstSpellSection = document.querySelector("#tab-spells details.spell-level-section");
            if (firstSpellSection) firstSpellSection.open = true;
            await this.scrollElementIntoView(firstSpellSection);
          }
        },
        {
          tab: "spells",
          title: () => this.stepPhase === 0
            ? "🔎 5. 搜尋角色資料"
            : "☰ 5. 保存、輸出與分享",
          text: () => this.stepPhase === 0
            ? "法術與裝備分頁都有搜尋功能，可快速查找名稱與規則資料。"
            : "右上角選單可以保存紀錄、輸出 PDF、分享角色卡，或再次開啟本導覽。",
          placement: "bottom",
          getHoles: () => [this.stepPhase === 0
            ? this.getHoleForSelector("#spell-tab-toolbar .spell-search-controls", 7)
            : this.getHoleForSelector("#utility-menu", 7)
          ].filter(Boolean),
          beforeTab: () => this.ensureSpellPreview(),
          beforePosition: async () => {
            await animateWindowScrollTo(0);
            if (this.stepPhase === 0) {
              this.closeUtilityMenuPreview();
              await this.openSpellSearchPreview();
            } else {
              await this.openUtilityMenuPreview();
            }
          },
          afterLeave: () => {
            this.closeUtilityMenuPreview();
            this.closeSpellSearchPreview();
          }
        }
      ];
    }

    async start() {
      if (this.active) this.stop({ resetView: false });
      this.steps = this.getSteps();
      if (!this.steps.length) return;
      this.currentIndex = -1;
      this.stepPhase = 0;
      this.active = true;
      this.isTransitioning = false;
      this.captureSpellPreviewState();
      this.captureSearchState();
      this.lockBackgroundInteraction();
      this.lockUserScroll();
      this.overlay.inert = false;
      this.overlay.style.display = "block";
      this.overlay.setAttribute("aria-hidden", "false");
      await this.goTo(0);
    }

    async next() {
      if (!this.active || this.isTransitioning) return;
      if (this.currentIndex === 1 && this.stepPhase === 0) {
        this.isTransitioning = true;
        this.stepPhase = 1;
        await this.steps[1].beforePosition();
        await waitForLayoutStability();
        await this.renderStep();
        this.isTransitioning = false;
        return;
      }
      if (this.currentIndex === 4 && this.stepPhase === 0) {
        this.isTransitioning = true;
        this.stepPhase = 1;
        await this.steps[4].beforePosition();
        await waitForLayoutStability();
        await this.renderStep();
        this.isTransitioning = false;
        return;
      }
      if (this.currentIndex >= this.steps.length - 1) {
        this.stop();
        return;
      }
      await this.goTo(this.currentIndex + 1);
    }

    async prev() {
      if (!this.active || this.isTransitioning) return;
      if (this.currentIndex === 1 && this.stepPhase === 1) {
        this.isTransitioning = true;
        this.closePointBuyPreview();
        this.stepPhase = 0;
        await waitForLayoutStability();
        await this.steps[1].beforePosition();
        await this.renderStep();
        this.isTransitioning = false;
        return;
      }
      if (this.currentIndex === 4 && this.stepPhase === 1) {
        this.isTransitioning = true;
        this.closeUtilityMenuPreview();
        this.stepPhase = 0;
        await this.steps[4].beforePosition();
        await waitForLayoutStability();
        await this.renderStep();
        this.isTransitioning = false;
        return;
      }
      if (this.currentIndex <= 0) return;
      await this.goTo(this.currentIndex - 1);
    }

    async goTo(index) {
      if (!this.active || this.isTransitioning) return;
      this.isTransitioning = true;
      const previousStep = this.steps[this.currentIndex];
      if (previousStep && typeof previousStep.afterLeave === "function") previousStep.afterLeave();

      this.currentIndex = index;
      this.stepPhase = 0;
      const step = this.steps[index];
      if (typeof step.beforeTab === "function") step.beforeTab();
      this.showTab(step.tab);
      await waitForLayoutStability();
      if (typeof step.beforePosition === "function") {
        await step.beforePosition();
        await waitForLayoutStability();
      }
      await this.renderStep();
      this.isTransitioning = false;
    }

    stop({ resetView = true } = {}) {
      const currentStep = this.steps[this.currentIndex];
      if (currentStep && typeof currentStep.afterLeave === "function") currentStep.afterLeave();
      this.closePointBuyPreview();
      this.closeUtilityMenuPreview();
      this.restoreSpellPreviewState();
      this.resetHighlightState();
      this.active = false;
      this.isTransitioning = false;
      this.currentIndex = -1;
      this.stepPhase = 0;
      this.unlockUserScroll();
      this.unlockBackgroundInteraction();
      if (this.overlay) {
        if (this.overlay.contains(document.activeElement)) document.activeElement.blur();
        this.overlay.inert = true;
        this.overlay.style.display = "none";
        this.overlay.setAttribute("aria-hidden", "true");
      }

      if (resetView) {
        this.showTab("basic");
        requestAnimationFrame(() => {
          window.scrollTo(0, 0);
          this.restoreSearchState();
          document.getElementById("basic-tab-button")?.focus({ preventScroll: true });
        });
      } else {
        this.restoreSearchState();
      }
    }

    showTab(tab) {
      const tabButton = document.querySelector(`.tab-button[onclick*="'${tab}'"]`);
      if (typeof window.showTab === "function") window.showTab(tab, tabButton || undefined);
    }

    async scrollElementIntoView(element, extraOffset = TAB_HEADER_OFFSET) {
      if (!element) return;
      const targetY = window.scrollY + element.getBoundingClientRect().top - extraOffset;
      await animateWindowScrollTo(targetY);
    }

    captureSpellPreviewState() {
      if (this.spellPreviewSnapshot) return;
      const spellTabButton = document.getElementById("spells-tab-button");
      const spellTab = document.getElementById("tab-spells");
      const toolbar = document.getElementById("spell-tab-toolbar");
      const management = document.getElementById("spell-slot-management-wrap");
      const noSlots = document.getElementById("no-spell-slots-message");
      this.spellPreviewSnapshot = {
        spellTabButtonDisplay: spellTabButton?.style.display || "",
        spellTabDisplay: spellTab?.style.display || "",
        toolbarClassName: toolbar?.className || "",
        managementClassName: management?.className || "",
        noSlotsClassName: noSlots?.className || "",
        sections: Array.from(document.querySelectorAll("#tab-spells details.spell-level-section")).map((section) => ({
          element: section,
          open: section.open,
          display: section.style.display
        })),
        slotRows: [1, 2, 3].map((ring) => {
          const row = document.getElementById(`spellslot${ring}-row`);
          return {
            element: row,
            display: row?.style.display || "",
            boxes: Array.from(row?.querySelectorAll("input[type='checkbox']") || []).map((box) => ({
              element: box,
              display: box.style.display,
              disabled: box.disabled
            }))
          };
        })
      };
    }

    captureSearchState() {
      if (this.searchStateSnapshot) return;
      this.searchStateSnapshot = [
        {
          type: "spell",
          inputId: "spell-search",
          resultsId: "spell-search-results",
          value: document.getElementById("spell-search")?.value || "",
          resultsVisible: !document.getElementById("spell-search-results")?.classList.contains("is-hidden")
        },
        {
          type: "equipment",
          inputId: "equipment-search",
          resultsId: "equipment-search-results",
          value: document.getElementById("equipment-search")?.value || "",
          resultsVisible: !document.getElementById("equipment-search-results")?.classList.contains("is-hidden")
        }
      ];
    }

    restoreSearchState() {
      if (!this.searchStateSnapshot) return;
      this.searchStateSnapshot.forEach(({ type, inputId, resultsId, value, resultsVisible }) => {
        const input = document.getElementById(inputId);
        const results = document.getElementById(resultsId);
        if (input) input.value = value;
        if (type === "spell") {
          if (resultsVisible && value.trim() && typeof window.searchAllSpells === "function") {
            window.searchAllSpells();
          } else {
            window.clearSpellSearchResults?.();
          }
          return;
        }
        if (resultsVisible && value.trim() && typeof window.applyEquipmentFilter === "function") {
          window.prepareEquipmentSearch?.();
          window.applyEquipmentFilter();
        } else {
          document.getElementById("equipment-search-clear")?.classList.toggle("is-hidden", !value);
          document.getElementById("equipment-search-count")?.replaceChildren();
          results?.classList.add("is-hidden");
          document.getElementById("equipment-search-summary")?.replaceChildren();
          document.getElementById("equipment-search-result-list")?.replaceChildren();
        }
      });
      this.searchStateSnapshot = null;
    }

    ensureSpellPreview() {
      this.captureSpellPreviewState();
      const spellTabButton = document.getElementById("spells-tab-button");
      const spellTab = document.getElementById("tab-spells");
      if (spellTabButton) spellTabButton.style.display = "";
      if (spellTab) spellTab.style.display = "";
      document.getElementById("spell-slot-management-wrap")?.classList.remove("is-hidden");
      document.getElementById("no-spell-slots-message")?.classList.add("is-hidden");
      document.querySelectorAll("#tab-spells details.spell-level-section").forEach((section) => {
        section.style.display = "";
        section.open = true;
      });
      [1, 2, 3].forEach((ring) => {
        const row = document.getElementById(`spellslot${ring}-row`);
        if (row) row.style.display = "";
        row?.querySelectorAll("input[type='checkbox']:not(.spell-slot-placeholder)").forEach((box) => {
          box.style.display = "";
          box.disabled = false;
        });
      });
    }

    restoreSpellPreviewState() {
      const snapshot = this.spellPreviewSnapshot;
      if (!snapshot) return;
      const spellTabButton = document.getElementById("spells-tab-button");
      const spellTab = document.getElementById("tab-spells");
      const toolbar = document.getElementById("spell-tab-toolbar");
      const management = document.getElementById("spell-slot-management-wrap");
      const noSlots = document.getElementById("no-spell-slots-message");
      if (spellTabButton) spellTabButton.style.display = snapshot.spellTabButtonDisplay;
      if (spellTab) spellTab.style.display = snapshot.spellTabDisplay;
      if (toolbar) toolbar.className = snapshot.toolbarClassName;
      if (management) management.className = snapshot.managementClassName;
      if (noSlots) noSlots.className = snapshot.noSlotsClassName;
      snapshot.sections.forEach(({ element, open, display }) => {
        element.open = open;
        element.style.display = display;
      });
      snapshot.slotRows.forEach(({ element, display, boxes }) => {
        if (element) element.style.display = display;
        boxes.forEach(({ element: box, display: boxDisplay, disabled }) => {
          box.style.display = boxDisplay;
          box.disabled = disabled;
        });
      });
      this.spellPreviewSnapshot = null;
    }

    async openPointBuyPreview() {
      if (!this.pointBuyPreviewOpened) {
        this.runWithBackgroundElementUnlocked(document.getElementById("set-default-abilities"), (button) => button.click());
        await waitForLayoutStability();
        this.runWithBackgroundElementUnlocked(document.getElementById("ability-choice-point-buy"), (button) => button.click());
        this.pointBuyPreviewOpened = true;
      }
      document.getElementById("point-buy-modal")?.classList.add("onboarding-tour-preview");
      const card = document.querySelector("#point-buy-modal .point-buy-modal-card");
      if (card && !this.pointBuyCardStateCaptured) {
        this.pointBuyCardWasInert = card.inert;
        this.pointBuyCardStateCaptured = true;
        card.inert = true;
      }
      await waitForLayoutStability();
    }

    closePointBuyPreview() {
      const modal = document.getElementById("point-buy-modal");
      const card = modal?.querySelector(".point-buy-modal-card");
      if (card && this.pointBuyCardStateCaptured) card.inert = this.pointBuyCardWasInert;
      if (this.pointBuyPreviewOpened && modal?.classList.contains("open")) {
        this.runWithBackgroundElementUnlocked(document.getElementById("point-buy-close"), (button) => button.click());
      }
      modal?.classList.remove("onboarding-tour-preview");
      const abilityChoiceModal = document.getElementById("ability-choice-modal");
      if (abilityChoiceModal?.contains(document.activeElement)) document.activeElement.blur();
      if (abilityChoiceModal) {
        abilityChoiceModal.inert = true;
        abilityChoiceModal.classList.remove("open");
        abilityChoiceModal.setAttribute("aria-hidden", "true");
      }
      this.pointBuyPreviewOpened = false;
      this.pointBuyCardWasInert = false;
      this.pointBuyCardStateCaptured = false;
    }

    async openSpellSearchPreview() {
      const toolbar = document.getElementById("spell-tab-toolbar");
      if (toolbar?.classList.contains("is-hidden")) {
        this.runWithBackgroundElementUnlocked(document.getElementById("spell-search-fab"), (button) => button.click());
      }
      await waitForLayoutStability();
    }

    closeSpellSearchPreview() {
      const toolbar = document.getElementById("spell-tab-toolbar");
      if (toolbar && !toolbar.classList.contains("is-hidden")) {
        this.runWithBackgroundElementUnlocked(document.getElementById("spell-search-fab"), (button) => button.click());
      }
    }

    async openUtilityMenuPreview() {
      const toggle = document.getElementById("utility-menu-toggle");
      if (toggle?.getAttribute("aria-expanded") !== "true") {
        this.runWithBackgroundElementUnlocked(toggle, (button) => button.click());
        this.utilityMenuPreviewOpened = true;
      }
      await waitForLayoutStability();
    }

    closeUtilityMenuPreview() {
      const toggle = document.getElementById("utility-menu-toggle");
      if (this.utilityMenuPreviewOpened && toggle?.getAttribute("aria-expanded") === "true") {
        this.runWithBackgroundElementUnlocked(toggle, (button) => button.click());
      }
      this.utilityMenuPreviewOpened = false;
    }

    getBodyChildForElement(element) {
      let current = element;
      while (current?.parentElement && current.parentElement !== document.body) current = current.parentElement;
      return current?.parentElement === document.body ? current : null;
    }

    runWithBackgroundElementUnlocked(element, action) {
      if (!element || typeof action !== "function") return;
      const bodyChild = this.getBodyChildForElement(element);
      if (!bodyChild) {
        action(element);
        return;
      }
      const wasInert = bodyChild.inert;
      bodyChild.inert = false;
      try {
        action(element);
      } finally {
        bodyChild.inert = wasInert;
      }
    }

    lockBackgroundInteraction() {
      if (this.backgroundInertSnapshot) return;
      this.backgroundInertSnapshot = Array.from(document.body.children)
        .filter((element) => element !== this.overlay)
        .map((element) => ({ element, inert: element.inert }));
      this.backgroundInertSnapshot.forEach(({ element }) => {
        element.inert = true;
      });
      if (this.tooltip) {
        this.tooltip.setAttribute("aria-modal", "true");
        this.tooltip.setAttribute("aria-labelledby", "tour-step-title");
        this.tooltip.setAttribute("aria-describedby", "tour-step-text");
      }
    }

    unlockBackgroundInteraction() {
      this.backgroundInertSnapshot?.forEach(({ element, inert }) => {
        element.inert = inert;
      });
      this.backgroundInertSnapshot = null;
    }

    getHoleForSelector(selector, padding = 8) {
      return this.getHoleFromElements(Array.from(document.querySelectorAll(selector)), padding);
    }

    getHoleFromElements(elements, padding = 8) {
      const rect = getUnionRect(elements.filter(Boolean));
      if (!rect) return null;
      return {
        left: Math.max(0, rect.left - padding),
        top: Math.max(0, rect.top - padding),
        right: Math.min(window.innerWidth, rect.right + padding),
        bottom: Math.min(window.innerHeight, rect.bottom + padding)
      };
    }

    getStepValue(step, key, fallback) {
      const value = step?.[key];
      if (typeof value === "function") return value();
      return value ?? fallback;
    }

    async renderStep() {
      if (!this.active) return;
      this.resetHighlightState();
      const step = this.steps[this.currentIndex];
      if (!step) return;
      const holes = (typeof step.getHoles === "function" ? step.getHoles() : []).filter(Boolean).slice(0, 2);
      const visibleHoles = this.applyMasksForHoles(holes);
      this.focusRings.forEach((ring, index) => this.setFocusRing(ring, visibleHoles[index]));

      this.title.textContent = this.getStepValue(step, "title", "");
      this.text.textContent = this.getStepValue(step, "text", "");
      this.progress.textContent = `${this.currentIndex + 1}/${this.steps.length}`;
      this.progress.setAttribute("aria-label", `導覽進度：第 ${this.currentIndex + 1} 步，共 ${this.steps.length} 步`);
      this.prevBtn.disabled = this.currentIndex === 0;
      this.nextBtn.textContent = this.getNextButtonText();
      this.tooltip.style.display = "";

      const placement = this.getStepValue(step, "placement", "bottom");
      if (visibleHoles[0]) this.positionTooltip(visibleHoles[0], placement);
      else this.positionTooltipWithoutHighlight();
      this.ensureTourFocus();
    }

    getNextButtonText() {
      if (this.currentIndex === 1 && this.stepPhase === 0) return "查看 27 購點";
      if (this.currentIndex === 4 && this.stepPhase === 0) return "查看工具選單";
      if (this.currentIndex === this.steps.length - 1) return "開始使用角色卡";
      return "下一步";
    }

    hideMaskGroup(group) {
      Object.values(group || {}).forEach((mask) => {
        if (!mask) return;
        mask.style.cssText = "display:none;left:0;top:0;width:0;height:0;";
      });
    }

    resetHighlightState() {
      this.maskGroups.forEach((group) => this.hideMaskGroup(group));
      this.focusRings.forEach((ring) => {
        if (!ring) return;
        ring.style.cssText = "display:none;left:0;top:0;width:0;height:0;";
      });
      if (this.tooltip) {
        this.tooltip.style.left = "0px";
        this.tooltip.style.top = "0px";
      }
    }

    setMaskRect(mask, left, top, width, height) {
      if (!mask || width <= 0 || height <= 0) {
        if (mask) mask.style.display = "none";
        return;
      }
      mask.style.cssText = `display:block;left:${left}px;top:${top}px;width:${width}px;height:${height}px;`;
    }

    placeMaskGroup(group, hole, region) {
      const leftBound = region.left;
      const rightBound = region.right;
      const topBound = region.top;
      const bottomBound = region.bottom;
      const holeLeft = Math.max(leftBound, Math.min(rightBound, hole.left));
      const holeRight = Math.max(leftBound, Math.min(rightBound, hole.right));
      const holeTop = Math.max(topBound, Math.min(bottomBound, hole.top));
      const holeBottom = Math.max(topBound, Math.min(bottomBound, hole.bottom));
      this.setMaskRect(group.top, leftBound, topBound, rightBound - leftBound, holeTop - topBound);
      this.setMaskRect(group.left, leftBound, holeTop, holeLeft - leftBound, holeBottom - holeTop);
      this.setMaskRect(group.right, holeRight, holeTop, rightBound - holeRight, holeBottom - holeTop);
      this.setMaskRect(group.bottom, leftBound, holeBottom, rightBound - leftBound, bottomBound - holeBottom);
    }

    applyMasksForHoles(holes) {
      if (!holes.length) {
        this.setMaskRect(this.maskGroups[0].top, 0, 0, window.innerWidth, window.innerHeight);
        this.hideMaskGroup(this.maskGroups[1]);
        return [];
      }
      if (holes.length === 1) {
        this.placeMaskGroup(this.maskGroups[0], holes[0], {
          left: 0, right: window.innerWidth, top: 0, bottom: window.innerHeight
        });
        this.hideMaskGroup(this.maskGroups[1]);
        return holes;
      }

      const [first, second] = holes;
      const overlapX = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left));
      const minWidth = Math.max(1, Math.min(first.right - first.left, second.right - second.left));
      if (overlapX / minWidth > 0.6) {
        const sorted = [...holes].sort((a, b) => a.top - b.top);
        const splitY = Math.max(0, Math.min(window.innerHeight, Math.floor((sorted[0].bottom + sorted[1].top) / 2)));
        this.placeMaskGroup(this.maskGroups[0], sorted[0], {
          left: 0, right: window.innerWidth, top: 0, bottom: splitY
        });
        this.placeMaskGroup(this.maskGroups[1], sorted[1], {
          left: 0, right: window.innerWidth, top: splitY, bottom: window.innerHeight
        });
        return sorted;
      }

      const sorted = [...holes].sort((a, b) => a.left - b.left);
      const splitX = Math.max(0, Math.min(window.innerWidth, Math.floor((sorted[0].right + sorted[1].left) / 2)));
      this.placeMaskGroup(this.maskGroups[0], sorted[0], {
        left: 0, right: splitX, top: 0, bottom: window.innerHeight
      });
      this.placeMaskGroup(this.maskGroups[1], sorted[1], {
        left: splitX, right: window.innerWidth, top: 0, bottom: window.innerHeight
      });
      return sorted;
    }

    setFocusRing(ring, hole) {
      if (!ring || !hole) {
        if (ring) ring.style.display = "none";
        return;
      }
      ring.style.cssText = `display:block;left:${hole.left}px;top:${hole.top}px;width:${Math.max(0, hole.right - hole.left)}px;height:${Math.max(0, hole.bottom - hole.top)}px;`;
    }

    positionTooltipWithoutHighlight() {
      const margin = 10;
      const width = Math.min(360, window.innerWidth - margin * 2);
      this.tooltip.style.width = `${width}px`;
      this.tooltip.style.left = `${Math.max(margin, Math.floor((window.innerWidth - width) / 2))}px`;
      const height = this.tooltip.offsetHeight || 170;
      this.tooltip.style.top = `${Math.max(margin, Math.floor((window.innerHeight - height) / 2))}px`;
    }

    positionTooltip(hole, placement) {
      const margin = 10;
      const width = Math.min(360, window.innerWidth - margin * 2);
      const height = this.tooltip.offsetHeight || 170;
      this.tooltip.style.width = `${width}px`;
      this.tooltip.style.left = `${Math.min(window.innerWidth - width - margin, Math.max(margin, hole.left))}px`;

      if (placement === "overlay-bottom") {
        this.tooltip.style.top = `${Math.max(margin, window.innerHeight - height - margin)}px`;
        return;
      }

      let top = placement === "top" ? hole.top - height - margin : hole.bottom + margin;
      if (top + height > window.innerHeight - margin) top = hole.top - height - margin;
      if (top < margin) top = Math.min(window.innerHeight - height - margin, hole.bottom + margin);
      this.tooltip.style.top = `${Math.max(margin, top)}px`;
    }

    handleResize() {
      if (!this.active) return;
      requestAnimationFrame(() => this.renderStep());
    }

    handleKeydown(event) {
      if (!this.active) return;
      if (event.key === "Escape") {
        event.preventDefault();
        this.stop();
        return;
      }
      if (event.key === "Tab") {
        this.trapTourTab(event);
        return;
      }
      if (this.tooltip?.contains(event.target)) return;
      const blockedKeys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Spacebar"];
      if (blockedKeys.includes(event.key)) event.preventDefault();
    }

    handleFocusIn(event) {
      if (!this.active || this.tooltip?.contains(event.target)) return;
      this.nextBtn?.focus({ preventScroll: true });
    }

    getTourFocusableButtons() {
      return [this.prevBtn, this.skipBtn, this.nextBtn].filter((button) => button && !button.disabled);
    }

    ensureTourFocus() {
      if (this.getTourFocusableButtons().includes(document.activeElement)) return;
      this.nextBtn?.focus({ preventScroll: true });
    }

    trapTourTab(event) {
      const buttons = this.getTourFocusableButtons();
      if (!buttons.length) {
        event.preventDefault();
        return;
      }
      const currentIndex = buttons.indexOf(document.activeElement);
      const direction = event.shiftKey ? -1 : 1;
      const nextIndex = currentIndex < 0
        ? (event.shiftKey ? buttons.length - 1 : 0)
        : (currentIndex + direction + buttons.length) % buttons.length;
      event.preventDefault();
      buttons[nextIndex].focus({ preventScroll: true });
    }

    preventScrollEvent(event) {
      if (this.active) event.preventDefault();
    }

    lockUserScroll() {
      document.body.style.overscrollBehavior = "none";
      window.addEventListener("wheel", this.preventScrollEvent, { passive: false, capture: true });
      window.addEventListener("touchmove", this.preventScrollEvent, { passive: false, capture: true });
    }

    unlockUserScroll() {
      document.body.style.overscrollBehavior = "";
      window.removeEventListener("wheel", this.preventScrollEvent, { capture: true });
      window.removeEventListener("touchmove", this.preventScrollEvent, { capture: true });
    }

    async jumpToTarget({ tab = "basic", selector, focusSelector = selector } = {}) {
      if (!selector) return false;
      if (this.active) this.stop({ resetView: false });
      this.showTab(tab);
      await waitForLayoutStability();
      const candidates = Array.from(document.querySelectorAll(selector));
      const target = candidates.find(isElementVisible) || candidates[0];
      if (!target) return false;
      const details = target.closest("details");
      if (details && !details.open) {
        details.open = true;
        await waitForLayoutStability();
      }
      await this.scrollElementIntoView(target, 120);
      const focusTarget = Array.from(document.querySelectorAll(focusSelector)).find((element) => {
        return isElementVisible(element) && !element.disabled;
      });
      focusTarget?.focus?.({ preventScroll: true });
      target.classList.remove("onboarding-jump-target");
      void target.offsetWidth;
      target.classList.add("onboarding-jump-target");
      window.setTimeout(() => target.classList.remove("onboarding-jump-target"), 1800);
      return true;
    }
  }

  window.OnboardingTour = OnboardingTour;
})();

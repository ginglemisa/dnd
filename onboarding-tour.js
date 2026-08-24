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
      this.utilityMenuControlSnapshot = null;
      this.identityPreviewSnapshot = null;
      this.abilityPreviewSnapshot = null;
      this.equipmentPreviewSnapshot = null;
      this.spellControlSnapshot = null;
      this.spellSearchControlSnapshot = null;
      this.spellSearchPreviewOpened = false;
      this.pointBuySelectSnapshot = null;
      this.pointBuyControlSnapshot = null;
      this.tourPointBuyState = null;
      this.tooltipDragPosition = null;
      this.tooltipDragPointerId = null;
      this.highlightDragState = null;
      this.suppressNextHighlightClick = false;
      this.tooltipDragOffset = { x: 0, y: 0 };
      this.isInternalTourAction = false;
      this.autosaveSuspendedSnapshot = null;
      this.activeTabStorageSnapshot = null;
      this.activeHoles = [];
      this.scrollRenderPending = false;
      this.lastTourScrollY = window.scrollY;
      this.bodyTouchActionSnapshot = null;
      this.handleResize = this.handleResize.bind(this);
      this.handleScroll = this.handleScroll.bind(this);
      this.handleKeydown = this.handleKeydown.bind(this);
      this.handleFocusIn = this.handleFocusIn.bind(this);
      this.preventScrollEvent = this.preventScrollEvent.bind(this);
      this.handleTourPointerDownCapture = this.handleTourPointerDownCapture.bind(this);
      this.handleTourClickCapture = this.handleTourClickCapture.bind(this);
      this.handleTourFormEventCapture = this.handleTourFormEventCapture.bind(this);
      this.handleTooltipPointerDown = this.handleTooltipPointerDown.bind(this);
      this.handleTooltipPointerMove = this.handleTooltipPointerMove.bind(this);
      this.handleTooltipPointerUp = this.handleTooltipPointerUp.bind(this);
    }

    init() {
      if (!this.overlay || !this.prevBtn || !this.nextBtn || !this.skipBtn) return;
      this.prevBtn.addEventListener("click", () => this.prev());
      this.nextBtn.addEventListener("click", () => this.next());
      this.skipBtn.addEventListener("click", () => this.stop());
      window.addEventListener("resize", this.handleResize);
      window.addEventListener("scroll", this.handleScroll, { passive: true });
      document.addEventListener("keydown", this.handleKeydown);
      document.addEventListener("focusin", this.handleFocusIn);
      document.addEventListener("pointerdown", this.handleTourPointerDownCapture, true);
      document.addEventListener("click", this.handleTourClickCapture, true);
      document.addEventListener("input", this.handleTourFormEventCapture, true);
      document.addEventListener("change", this.handleTourFormEventCapture, true);
      this.tooltip?.addEventListener("pointerdown", this.handleTooltipPointerDown);
      window.addEventListener("pointermove", this.handleTooltipPointerMove);
      window.addEventListener("pointerup", this.handleTooltipPointerUp);
      window.addEventListener("pointercancel", this.handleTooltipPointerUp);
      if (this.tooltip) {
        this.tooltip.style.touchAction = "none";
        this.tooltip.style.cursor = "grab";
      }
      this.focusRings.forEach((ring) => {
        if (ring) ring.style.pointerEvents = "none";
      });
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
            this.prepareIdentityPreview();
            await animateWindowScrollTo(0);
          },
          afterLeave: () => this.restoreIdentityPreview()
        },
        {
          tab: "basic",
          title: () => this.stepPhase === 0
            ? "🎲 2. 屬性與快速創角"
            : "🎲 2. 使用 27 購點",
          text: () => this.stepPhase === 0
            ? "六項屬性決定角色擅長什麼；上方是檢定常用的修正值。點擊「決定屬性」可以快速套用或自行配點。"
            : "27 購點可自由配置六項屬性，背景加值會另外計算。第一次創角則推薦從「決定屬性」裡開啟創角小幫手，由它帶你完成一名 1 級角色。",
          placement: () => this.stepPhase === 0 ? "top" : "overlay-bottom",
          getHoles: () => {
            if (this.stepPhase === 1) {
              return [this.getHoleForSelector("#point-buy-modal .point-buy-modal-card", 6)].filter(Boolean);
            }
            if (document.getElementById("ability-choice-modal")?.classList.contains("open")) {
              return [this.getHoleForSelector("#ability-choice-modal .ability-choice-card", 6)].filter(Boolean);
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
            this.prepareAbilityPreview();
            await this.scrollElementIntoView(document.querySelector("#set-default-abilities"), 150);
          },
          afterLeave: () => {
            this.restoreAbilityPreview();
            this.closePointBuyPreview();
          }
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
            this.prepareEquipmentPreview();
            await this.scrollElementIntoView(document.querySelector("#tab-equipment > .section"));
          },
          afterLeave: () => this.restoreEquipmentPreview()
        },
        {
          tab: "spells",
          title: "✨ 4. 選擇與查看法術",
          text: "有施法能力時，可以在這裡管理戲法與法術。選擇法術後，可查看完整說明與施法資料。",
          placement: "top",
          getHoles: () => [this.getHoleFromElements([
            document.querySelector("#tab-spells details.spell-level-section:first-of-type > summary"),
            this.spellControlSnapshot?.row
              || document.querySelector("#cantrips-area .spell-entry:not(.spell-entry--derived)"),
            this.spellControlSnapshot?.description
          ], 8)].filter(Boolean),
          beforeTab: () => this.ensureSpellPreview(),
          beforePosition: async () => {
            const firstSpellSection = document.querySelector("#tab-spells details.spell-level-section");
            if (firstSpellSection) firstSpellSection.open = true;
            this.prepareSpellControlPreview();
            await this.scrollElementIntoView(firstSpellSection);
          },
          afterLeave: () => this.restoreSpellControlPreview()
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
      this.tooltipDragPosition = null;
      this.activeHoles = [];
      this.lastTourScrollY = window.scrollY;
      this.autosaveSuspendedSnapshot = typeof autosaveSuspended === "boolean" ? autosaveSuspended : null;
      if (this.autosaveSuspendedSnapshot === false) window.flushPendingAutosave?.();
      if (this.autosaveSuspendedSnapshot !== null) autosaveSuspended = true;
      this.activeTabStorageSnapshot = {
        value: window.dndStorage?.getItem?.("activeTab") ?? null
      };
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
        this.restoreAbilityPreview();
        this.stepPhase = 1;
        this.tooltipDragPosition = null;
        await this.steps[1].beforePosition();
        await waitForLayoutStability();
        await this.renderStep();
        this.isTransitioning = false;
        return;
      }
      if (this.currentIndex === 4 && this.stepPhase === 0) {
        this.isTransitioning = true;
        this.stepPhase = 1;
        this.tooltipDragPosition = null;
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
        this.tooltipDragPosition = null;
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
        this.tooltipDragPosition = null;
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
      this.tooltipDragPosition = null;
      this.activeHoles = [];
      this.lastTourScrollY = window.scrollY;
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
      this.restoreIdentityPreview();
      this.restoreAbilityPreview();
      this.restoreEquipmentPreview();
      this.restoreSpellControlPreview();
      this.restoreSpellPreviewState();
      this.resetHighlightState();
      this.active = false;
      this.isTransitioning = false;
      this.currentIndex = -1;
      this.stepPhase = 0;
      this.tooltipDragPosition = null;
      this.activeHoles = [];
      this.lastTourScrollY = window.scrollY;
      if (this.tooltipDragPointerId !== null && this.tooltip?.hasPointerCapture?.(this.tooltipDragPointerId)) {
        this.tooltip.releasePointerCapture(this.tooltipDragPointerId);
      }
      this.tooltipDragPointerId = null;
      this.highlightDragState = null;
      this.suppressNextHighlightClick = false;
      if (this.tooltip) this.tooltip.style.cursor = "grab";
      if (this.autosaveSuspendedSnapshot !== null) autosaveSuspended = this.autosaveSuspendedSnapshot;
      this.autosaveSuspendedSnapshot = null;
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
      if (this.activeTabStorageSnapshot) {
        if (this.activeTabStorageSnapshot.value === null) window.dndStorage?.removeItem?.("activeTab");
        else window.dndStorage?.setItem?.("activeTab", this.activeTabStorageSnapshot.value);
      }
      this.activeTabStorageSnapshot = null;
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

    captureRestrictedSelect(select, allowedValues) {
      if (!select) return null;
      const allowed = new Set(["", ...allowedValues]);
      const snapshot = {
        element: select,
        value: select.value,
        disabled: select.disabled,
        options: Array.from(select.options).map((option) => ({
          option,
          hidden: option.hidden,
          disabled: option.disabled
        }))
      };
      snapshot.options.forEach(({ option }) => {
        const permitted = allowed.has(option.value);
        option.hidden = !permitted;
        option.disabled = !permitted;
      });
      select.disabled = false;
      if (!allowed.has(select.value)) select.value = "";
      return snapshot;
    }

    restoreRestrictedSelect(snapshot) {
      if (!snapshot?.element) return;
      snapshot.options.forEach(({ option, hidden, disabled }) => {
        option.hidden = hidden;
        option.disabled = disabled;
      });
      snapshot.element.disabled = snapshot.disabled;
      snapshot.element.value = snapshot.value;
    }

    prepareIdentityPreview() {
      if (this.identityPreviewSnapshot) return;
      this.identityPreviewSnapshot = [
        this.captureRestrictedSelect(document.getElementById("class"), ["barbarian", "bard", "cleric"]),
        this.captureRestrictedSelect(document.getElementById("level"), ["1", "2", "3"]),
        this.captureRestrictedSelect(document.getElementById("background"), ["acolyte", "criminal", "sage", "soldier"]),
        this.captureRestrictedSelect(document.getElementById("race"), ["dwarf", "human", "halfling"])
      ].filter(Boolean);
    }

    restoreIdentityPreview() {
      this.identityPreviewSnapshot?.forEach((snapshot) => this.restoreRestrictedSelect(snapshot));
      this.identityPreviewSnapshot = null;
    }

    prepareAbilityPreview() {
      if (this.abilityPreviewSnapshot) return;
      this.abilityPreviewSnapshot = ["str", "dex", "con", "int", "wis", "cha"]
        .map((id) => document.getElementById(id))
        .filter(Boolean)
        .map((element) => ({
          element,
          value: element.value,
          disabled: element.disabled,
          readOnly: element.readOnly
        }));
      this.abilityPreviewSnapshot.forEach(({ element }) => {
        element.disabled = false;
        element.readOnly = false;
      });
    }

    restoreAbilityPreview() {
      const snapshot = this.abilityPreviewSnapshot;
      if (!snapshot) return;
      snapshot.forEach(({ element, value, disabled, readOnly }) => {
        const changed = element.value !== value;
        element.value = value;
        element.disabled = disabled;
        element.readOnly = readOnly;
        if (changed) element.dispatchEvent(new Event("input", { bubbles: true }));
      });
      this.abilityPreviewSnapshot = null;
    }

    setTourSelectGroups(select, groups) {
      if (!select) return;
      select.replaceChildren();
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "-- 請選擇 --";
      select.appendChild(placeholder);
      groups.forEach(({ label, values }) => {
        const parent = label ? document.createElement("optgroup") : select;
        if (label) parent.label = label;
        values.forEach((value) => {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = value;
          parent.appendChild(option);
        });
        if (label) select.appendChild(parent);
      });
      select.value = "";
      select.disabled = false;
    }

    prepareEquipmentPreview() {
      if (this.equipmentPreviewSnapshot) return;
      const selects = ["mainHand", "offHand", "armor"]
        .map((id) => document.getElementById(id))
        .filter(Boolean);
      this.equipmentPreviewSnapshot = {
        selects: selects.map((element) => ({
          element,
          html: element.innerHTML,
          value: element.value,
          disabled: element.disabled
        })),
        summary: document.querySelector("#tab-equipment .equipment-loadout-summary"),
        summaryHtml: document.querySelector("#tab-equipment .equipment-loadout-summary")?.innerHTML || ""
      };
      this.setTourSelectGroups(document.getElementById("mainHand"), [
        { label: "單手軍用近戰武器", values: ["戰斧", "連枷", "長劍"] }
      ]);
      this.setTourSelectGroups(document.getElementById("offHand"), [
        { label: "單手簡易近戰武器", values: ["短棒", "匕首", "手斧"] }
      ]);
      this.setTourSelectGroups(document.getElementById("armor"), [
        { label: "輕甲", values: ["布甲"] },
        { label: "中甲", values: ["獸皮甲"] },
        { label: "重甲", values: ["環甲"] }
      ]);
      this.refreshEquipmentPreviewOutputs();
    }

    refreshEquipmentPreviewOutputs() {
      window.updateEquipmentLoadoutSummary?.();
      window.updateACDisplay?.();
      window.updateSpeedDisplay?.();
      window.populateHandAttacks?.();
    }

    restoreEquipmentPreview() {
      const snapshot = this.equipmentPreviewSnapshot;
      if (!snapshot) return;
      snapshot.selects.forEach(({ element, html, value, disabled }) => {
        element.innerHTML = html;
        element.value = value;
        element.disabled = disabled;
      });
      this.refreshEquipmentPreviewOutputs();
      if (snapshot.summary && typeof window.updateEquipmentLoadoutSummary !== "function") {
        snapshot.summary.innerHTML = snapshot.summaryHtml;
      }
      this.equipmentPreviewSnapshot = null;
    }

    prepareSpellControlPreview() {
      if (this.spellControlSnapshot) return;
      const area = document.getElementById("cantrips-area");
      const row = area?.querySelector(".spell-entry:not(.spell-entry--derived)");
      const classSelect = row?.querySelector("select[id*='-class-']");
      const spellSelect = row?.querySelector("select[id*='-spell-']");
      if (!row || !classSelect || !spellSelect) return;
      const description = row.querySelector(".output.small-text");
      const marker = row.querySelector(".spell-row-index");
      this.spellControlSnapshot = {
        row,
        classSelect,
        spellSelect,
        classHtml: classSelect.innerHTML,
        classValue: classSelect.value,
        classDisabled: classSelect.disabled,
        classAriaDisabled: classSelect.getAttribute("aria-disabled"),
        spellHtml: spellSelect.innerHTML,
        spellValue: spellSelect.value,
        spellDisabled: spellSelect.disabled,
        spellAriaDisabled: spellSelect.getAttribute("aria-disabled"),
        description,
        descriptionHtml: description?.innerHTML || "",
        marker,
        markerText: marker?.textContent || "",
        rowDisplays: Array.from(area.children).map((element) => ({
          element,
          display: element.style.display
        }))
      };
      classSelect.innerHTML = [
        '<option value="">--職業--</option>',
        '<option value="cleric">牧師</option>',
        '<option value="wizard">法師</option>'
      ].join("");
      classSelect.disabled = false;
      classSelect.removeAttribute("aria-disabled");
      spellSelect.disabled = false;
      spellSelect.removeAttribute("aria-disabled");
      if (marker) marker.textContent = "#1";
      classSelect.value = "";
      this.populateTourSpellOptions("");
      this.spellControlSnapshot.rowDisplays.forEach(({ element }) => {
        element.style.display = element === row ? "" : "none";
      });
    }

    populateTourSpellOptions(classValue) {
      const snapshot = this.spellControlSnapshot;
      if (!snapshot?.spellSelect) return;
      const spellIdsByClass = {
        cleric: ["spare-the-dying", "guidance"],
        wizard: ["fire-bolt", "mending"]
      };
      const spellIds = spellIdsByClass[classValue] || [];
      snapshot.spellSelect.replaceChildren();
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "--法術--";
      snapshot.spellSelect.appendChild(placeholder);
      spellIds.forEach((spellId) => {
        const option = document.createElement("option");
        option.value = spellId;
        option.textContent = window.SpellCatalog?.getDisplayName?.(spellId)
          || ({ guidance: "神導術", "spare-the-dying": "維生術", "fire-bolt": "火焰箭", mending: "修復術" })[spellId];
        snapshot.spellSelect.appendChild(option);
      });
      snapshot.spellSelect.value = "";
      if (snapshot.description) snapshot.description.textContent = "—";
    }

    updateTourSpellDescription() {
      const snapshot = this.spellControlSnapshot;
      if (!snapshot?.description || !snapshot.spellSelect) return;
      const spell = window.SpellCatalog?.getSpell?.(snapshot.spellSelect.value);
      snapshot.description.textContent = spell?.desc || "—";
    }

    restoreSpellControlPreview() {
      const snapshot = this.spellControlSnapshot;
      if (!snapshot) return;
      snapshot.classSelect.innerHTML = snapshot.classHtml;
      snapshot.classSelect.value = snapshot.classValue;
      snapshot.classSelect.disabled = snapshot.classDisabled;
      if (snapshot.classAriaDisabled === null) snapshot.classSelect.removeAttribute("aria-disabled");
      else snapshot.classSelect.setAttribute("aria-disabled", snapshot.classAriaDisabled);
      snapshot.spellSelect.innerHTML = snapshot.spellHtml;
      snapshot.spellSelect.value = snapshot.spellValue;
      snapshot.spellSelect.disabled = snapshot.spellDisabled;
      if (snapshot.spellAriaDisabled === null) snapshot.spellSelect.removeAttribute("aria-disabled");
      else snapshot.spellSelect.setAttribute("aria-disabled", snapshot.spellAriaDisabled);
      if (snapshot.description) snapshot.description.innerHTML = snapshot.descriptionHtml;
      if (snapshot.marker) snapshot.marker.textContent = snapshot.markerText;
      snapshot.rowDisplays.forEach(({ element, display }) => {
        element.style.display = display;
      });
      this.spellControlSnapshot = null;
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
        this.isInternalTourAction = true;
        try {
          const choiceModal = document.getElementById("ability-choice-modal");
          if (!choiceModal?.classList.contains("open")) {
            this.runWithBackgroundElementUnlocked(document.getElementById("set-default-abilities"), (button) => button.click());
            await waitForLayoutStability();
          }
          this.runWithBackgroundElementUnlocked(document.getElementById("ability-choice-point-buy"), (button) => button.click());
        } finally {
          this.isInternalTourAction = false;
        }
        this.pointBuyPreviewOpened = true;
      }
      const modal = document.getElementById("point-buy-modal");
      modal?.classList.add("onboarding-tour-preview");
      const card = document.querySelector("#point-buy-modal .point-buy-modal-card");
      if (card && !this.pointBuyCardStateCaptured) {
        this.pointBuyCardWasInert = card.inert;
        this.pointBuyCardStateCaptured = true;
        card.inert = false;
        card.style.pointerEvents = "auto";
      }
      this.prepareTourPointBuyState();
      this.refreshTourInteractionRoots();
      await waitForLayoutStability();
    }

    prepareTourPointBuyState() {
      const backgroundSelect = document.getElementById("point-buy-background");
      if (backgroundSelect && !this.pointBuySelectSnapshot) {
        this.pointBuySelectSnapshot = {
          element: backgroundSelect,
          value: backgroundSelect.value,
          disabled: backgroundSelect.disabled
        };
      }
      if (backgroundSelect) {
        backgroundSelect.value = "soldier";
        backgroundSelect.disabled = true;
      }
      if (!this.pointBuyControlSnapshot) {
        this.pointBuyControlSnapshot = [
          "point-buy-close",
          "ability-choice-default",
          "point-buy-reset",
          "point-buy-apply"
        ].map((id) => document.getElementById(id)).filter(Boolean).map((element) => ({
          element,
          disabled: element.disabled
        }));
      }
      this.pointBuyControlSnapshot.forEach(({ element }) => {
        element.disabled = true;
      });
      if (!this.tourPointBuyState) {
        this.tourPointBuyState = {
          base: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
          bonus: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }
        };
      }
      this.renderTourPointBuyRows();
    }

    getTourPointBuySpent() {
      const costs = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
      return Object.values(this.tourPointBuyState?.base || {}).reduce((sum, value) => sum + costs[value], 0);
    }

    renderTourPointBuyRows() {
      if (!this.tourPointBuyState) return;
      const rows = document.getElementById("point-buy-rows");
      if (!rows) return;
      const labels = { str: "力量", dex: "敏捷", con: "體質", int: "智力", wis: "感知", cha: "魅力" };
      const costs = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
      const soldierAbilities = new Set(["str", "dex", "con"]);
      const spent = this.getTourPointBuySpent();
      const bonusTotal = Object.values(this.tourPointBuyState.bonus).reduce((sum, value) => sum + value, 0);
      rows.innerHTML = Object.keys(labels).map((key) => {
        const baseValue = this.tourPointBuyState.base[key];
        const bonusValue = this.tourPointBuyState.bonus[key];
        const nextCost = baseValue < 15 ? costs[baseValue + 1] - costs[baseValue] : Infinity;
        const canIncreaseBase = baseValue < 15 && spent + nextCost <= 27;
        const bonusEnabled = soldierAbilities.has(key);
        const canIncreaseBonus = bonusEnabled && bonusValue < 2 && bonusTotal < 3;
        return `
          <div class="point-buy-row ${bonusEnabled ? "" : "point-buy-row--bonus-locked"}" data-ability="${key}">
            <div class="point-buy-ability">${labels[key]}</div>
            <div class="point-buy-control-group">
              <button type="button" class="point-buy-step" data-action="base-dec" data-ability="${key}" ${baseValue > 8 ? "" : "disabled"}>▼</button>
              <span class="point-buy-value">${baseValue}</span>
              <button type="button" class="point-buy-step" data-action="base-inc" data-ability="${key}" ${canIncreaseBase ? "" : "disabled"}>▲</button>
            </div>
            <div class="point-buy-control-group point-buy-control-group--bonus">
              <button type="button" class="point-buy-step" data-action="bonus-dec" data-ability="${key}" ${bonusEnabled && bonusValue > 0 ? "" : "disabled"}>▼</button>
              <span class="point-buy-value point-buy-value--bonus">${bonusEnabled ? `+${bonusValue}` : "—"}</span>
              <button type="button" class="point-buy-step" data-action="bonus-inc" data-ability="${key}" ${canIncreaseBonus ? "" : "disabled"}>▲</button>
            </div>
            <div class="point-buy-total">${baseValue + bonusValue}</div>
          </div>`;
      }).join("");
      const used = document.getElementById("point-buy-used");
      const remain = document.getElementById("point-buy-remain");
      const hint = document.getElementById("point-buy-hint");
      if (used) used.textContent = String(spent);
      if (remain) remain.textContent = String(27 - spent);
      if (hint) hint.textContent = "士兵背景加值可分配在：力量、敏捷、體質（共 3 點，單項上限 +2）";
    }

    adjustTourPointBuy(action, key) {
      const state = this.tourPointBuyState;
      if (!state || !Object.prototype.hasOwnProperty.call(state.base, key)) return;
      const costs = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
      if (action === "base-dec" && state.base[key] > 8) state.base[key] -= 1;
      if (action === "base-inc" && state.base[key] < 15) {
        const increase = costs[state.base[key] + 1] - costs[state.base[key]];
        if (this.getTourPointBuySpent() + increase <= 27) state.base[key] += 1;
      }
      const soldierAbilities = new Set(["str", "dex", "con"]);
      const bonusTotal = Object.values(state.bonus).reduce((sum, value) => sum + value, 0);
      if (action === "bonus-dec" && soldierAbilities.has(key) && state.bonus[key] > 0) state.bonus[key] -= 1;
      if (action === "bonus-inc" && soldierAbilities.has(key) && state.bonus[key] < 2 && bonusTotal < 3) state.bonus[key] += 1;
      this.renderTourPointBuyRows();
    }

    closePointBuyPreview() {
      const modal = document.getElementById("point-buy-modal");
      const card = modal?.querySelector(".point-buy-modal-card");
      if (this.pointBuySelectSnapshot?.element) {
        this.pointBuySelectSnapshot.element.value = this.pointBuySelectSnapshot.value;
        this.pointBuySelectSnapshot.element.disabled = this.pointBuySelectSnapshot.disabled;
      }
      this.pointBuySelectSnapshot = null;
      this.tourPointBuyState = null;
      this.pointBuyControlSnapshot?.forEach(({ element, disabled }) => {
        element.disabled = disabled;
      });
      this.pointBuyControlSnapshot = null;
      if (card && this.pointBuyCardStateCaptured) {
        card.inert = this.pointBuyCardWasInert;
        card.style.pointerEvents = "";
      }
      if (this.pointBuyPreviewOpened && modal?.classList.contains("open")) {
        this.isInternalTourAction = true;
        try {
          this.runWithBackgroundElementUnlocked(document.getElementById("point-buy-close"), (button) => button.click());
        } finally {
          this.isInternalTourAction = false;
        }
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
        this.isInternalTourAction = true;
        try {
          this.runWithBackgroundElementUnlocked(document.getElementById("spell-search-fab"), (button) => button.click());
          this.spellSearchPreviewOpened = true;
        } finally {
          this.isInternalTourAction = false;
        }
      }
      this.prepareSpellSearchControls();
      await waitForLayoutStability();
    }

    prepareSpellSearchControls() {
      if (this.spellSearchControlSnapshot) return;
      const controls = Array.from(document.querySelectorAll(
        "#spell-tab-toolbar input, #spell-tab-toolbar button"
      ));
      this.spellSearchControlSnapshot = controls.map((element) => ({
        element,
        disabled: element.disabled,
        readOnly: "readOnly" in element ? element.readOnly : undefined
      }));
      this.spellSearchControlSnapshot.forEach(({ element }) => {
        if (element instanceof HTMLInputElement) element.readOnly = true;
        if (element instanceof HTMLButtonElement) element.disabled = true;
      });
    }

    restoreSpellSearchControls() {
      this.spellSearchControlSnapshot?.forEach(({ element, disabled, readOnly }) => {
        element.disabled = disabled;
        if (readOnly !== undefined) element.readOnly = readOnly;
      });
      this.spellSearchControlSnapshot = null;
    }

    closeSpellSearchPreview() {
      const toolbar = document.getElementById("spell-tab-toolbar");
      this.restoreSpellSearchControls();
      if (this.spellSearchPreviewOpened && toolbar && !toolbar.classList.contains("is-hidden")) {
        this.isInternalTourAction = true;
        try {
          this.runWithBackgroundElementUnlocked(document.getElementById("spell-search-fab"), (button) => button.click());
        } finally {
          this.isInternalTourAction = false;
        }
      }
      this.spellSearchPreviewOpened = false;
    }

    async openUtilityMenuPreview() {
      const toggle = document.getElementById("utility-menu-toggle");
      if (toggle?.getAttribute("aria-expanded") !== "true") {
        this.isInternalTourAction = true;
        try {
          this.runWithBackgroundElementUnlocked(toggle, (button) => button.click());
          this.utilityMenuPreviewOpened = true;
        } finally {
          this.isInternalTourAction = false;
        }
      }
      this.prepareUtilityMenuControls();
      await waitForLayoutStability();
    }

    prepareUtilityMenuControls() {
      if (this.utilityMenuControlSnapshot) return;
      const controls = Array.from(document.querySelectorAll("#utility-menu button, #utility-menu input, #utility-menu select"));
      this.utilityMenuControlSnapshot = controls.map((element) => ({
        element,
        disabled: element.disabled
      }));
      this.utilityMenuControlSnapshot.forEach(({ element }) => {
        if (!element.matches('input[name="site-theme"]')) element.disabled = true;
      });
    }

    restoreUtilityMenuControls() {
      this.utilityMenuControlSnapshot?.forEach(({ element, disabled }) => {
        element.disabled = disabled;
      });
      this.utilityMenuControlSnapshot = null;
    }

    isUtilityMenuPreviewLocked() {
      return this.active
        && this.currentIndex === 4
        && this.stepPhase === 1
        && this.utilityMenuPreviewOpened
        && !this.isInternalTourAction;
    }

    closeUtilityMenuPreview() {
      const toggle = document.getElementById("utility-menu-toggle");
      this.restoreUtilityMenuControls();
      if (this.utilityMenuPreviewOpened && toggle?.getAttribute("aria-expanded") === "true") {
        this.isInternalTourAction = true;
        try {
          this.runWithBackgroundElementUnlocked(toggle, (button) => button.click());
        } finally {
          this.isInternalTourAction = false;
        }
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

    getAllowedTourElements() {
      if (!this.active) return [];
      if (this.currentIndex === 0) {
        return ["class", "level", "background", "race"]
          .map((id) => document.getElementById(id))
          .filter(Boolean);
      }
      if (this.currentIndex === 1 && this.stepPhase === 0) {
        const choiceModalOpen = document.getElementById("ability-choice-modal")?.classList.contains("open");
        if (!choiceModalOpen) {
          return [
            document.getElementById("set-default-abilities"),
            ...["str", "dex", "con", "int", "wis", "cha"].map((id) => document.getElementById(id))
          ].filter((element) => element && isElementVisible(element));
        }
        return [
          document.getElementById("ability-choice-point-buy"),
          document.getElementById("quick-card-builder")
        ].filter((element) => element && isElementVisible(element));
      }
      if (this.currentIndex === 1 && this.stepPhase === 1) {
        return Array.from(document.querySelectorAll("#point-buy-modal .point-buy-step:not(:disabled)"));
      }
      if (this.currentIndex === 2 && this.equipmentPreviewSnapshot) {
        return ["mainHand", "offHand", "armor"]
          .map((id) => document.getElementById(id))
          .filter(Boolean);
      }
      if (this.currentIndex === 3 && this.spellControlSnapshot) {
        return [this.spellControlSnapshot.classSelect, this.spellControlSnapshot.spellSelect];
      }
      if (this.currentIndex === 4 && this.stepPhase === 1 && this.utilityMenuPreviewOpened) {
        return Array.from(document.querySelectorAll('#utility-menu input[name="site-theme"]:not(:disabled)'));
      }
      return [];
    }

    isAllowedTourInteraction(target) {
      if (!(target instanceof Element)) return false;
      if (this.tooltip?.contains(target)) return true;
      if (this.currentIndex === 4 && this.stepPhase === 1 && target.closest(".theme-picker__option")) return true;
      return this.getAllowedTourElements().some((element) => element === target || element.contains(target));
    }

    getEventViewportPoint(event) {
      const touch = event.touches?.[0] || event.changedTouches?.[0];
      const clientX = touch?.clientX ?? event.clientX;
      const clientY = touch?.clientY ?? event.clientY;
      if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;
      return { x: clientX, y: clientY };
    }

    isEventInsideActiveHole(event) {
      if (this.tooltip?.contains(event.target)) return false;
      const point = this.getEventViewportPoint(event);
      if (!point) return false;
      return this.activeHoles.some((hole) => (
        point.x >= hole.left
        && point.x <= hole.right
        && point.y >= hole.top
        && point.y <= hole.bottom
      ));
    }

    getHighlightScrollTarget(eventTarget, clientX, clientY) {
      const candidates = [];
      if (eventTarget instanceof Element) candidates.push(eventTarget);
      document.elementsFromPoint(clientX, clientY).forEach((element) => {
        if (!candidates.includes(element)) candidates.push(element);
      });
      for (const candidate of candidates) {
        if (this.overlay?.contains(candidate)) continue;
        let current = candidate;
        while (current && current !== document.body && current !== document.documentElement) {
          const style = getComputedStyle(current);
          if (/(auto|scroll)/.test(style.overflowY) && current.scrollHeight > current.clientHeight + 1) {
            return current;
          }
          current = current.parentElement;
        }
      }
      return window;
    }

    moveHighlightDrag(clientY) {
      const state = this.highlightDragState;
      if (!state || !Number.isFinite(clientY)) return false;
      const totalDistance = Math.abs(clientY - state.startY);
      if (!state.moved && totalDistance < 6) return false;
      state.moved = true;
      const scrollDelta = state.lastY - clientY;
      state.lastY = clientY;
      if (!scrollDelta) return true;
      if (state.scrollTarget === window) {
        window.scrollBy(0, scrollDelta);
      } else {
        state.scrollTarget.scrollTop += scrollDelta;
      }
      return true;
    }

    getHighlightInteractionRoots() {
      const roots = new Set();
      this.backgroundInertSnapshot?.forEach(({ element }) => {
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        const intersectsHighlight = this.activeHoles.some((hole) => (
          rect.right > hole.left
          && rect.left < hole.right
          && rect.bottom > hole.top
          && rect.top < hole.bottom
        ));
        if (intersectsHighlight) roots.add(element);
      });
      this.activeHoles.forEach((hole) => {
        const insetX = Math.min(4, Math.max(0, (hole.right - hole.left) / 2));
        const insetY = Math.min(4, Math.max(0, (hole.bottom - hole.top) / 2));
        const points = [
          [(hole.left + hole.right) / 2, (hole.top + hole.bottom) / 2],
          [hole.left + insetX, hole.top + insetY],
          [hole.right - insetX, hole.bottom - insetY]
        ];
        points.forEach(([x, y]) => {
          document.elementsFromPoint(x, y).forEach((element) => {
            if (this.overlay?.contains(element)) return;
            const root = this.getBodyChildForElement(element);
            if (root) roots.add(root);
          });
        });
      });
      return roots;
    }

    refreshTourInteractionRoots() {
      if (!this.backgroundInertSnapshot) return;
      this.backgroundInertSnapshot.forEach(({ element }) => {
        element.inert = true;
      });
      const roots = new Set(this.getAllowedTourElements()
        .map((element) => this.getBodyChildForElement(element))
        .filter(Boolean));
      this.getHighlightInteractionRoots().forEach((element) => roots.add(element));
      roots.forEach((element) => {
        element.inert = false;
      });
    }

    handleTourPointerDownCapture(event) {
      if (!this.active || this.isInternalTourAction) return;
      if (event.pointerType !== "mouse" && this.isEventInsideActiveHole(event)) {
        this.highlightDragState = {
          pointerId: event.pointerId,
          startY: event.clientY,
          lastY: event.clientY,
          moved: false,
          scrollTarget: this.getHighlightScrollTarget(event.target, event.clientX, event.clientY)
        };
        return;
      }
      if (this.isAllowedTourInteraction(event.target)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    handleTourClickCapture(event) {
      if (!this.active || this.isInternalTourAction) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      if (this.suppressNextHighlightClick) {
        this.suppressNextHighlightClick = false;
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      if (this.tooltip?.contains(target)) return;

      if (this.currentIndex === 1 && this.stepPhase === 0) {
        if (target.closest("#quick-card-builder")) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }
        if (target.closest("#ability-choice-point-buy")) {
          event.preventDefault();
          event.stopImmediatePropagation();
          this.advanceToPointBuyPreview();
          return;
        }
        if (target.closest("#set-default-abilities")) {
          window.setTimeout(async () => {
            if (!this.active || this.currentIndex !== 1 || this.stepPhase !== 0) return;
            this.tooltipDragPosition = null;
            await waitForLayoutStability();
            this.refreshTourInteractionRoots();
            await this.renderStep();
          }, 0);
          return;
        }
      }

      if (this.currentIndex === 1 && this.stepPhase === 1) {
        const button = target.closest(".point-buy-step[data-action][data-ability]");
        if (button && !button.disabled) {
          event.preventDefault();
          event.stopImmediatePropagation();
          const { action, ability } = button.dataset;
          this.adjustTourPointBuy(action, ability);
          this.refreshTourInteractionRoots();
          document.querySelector(`#point-buy-modal .point-buy-step[data-action="${action}"][data-ability="${ability}"]:not(:disabled)`)
            ?.focus({ preventScroll: true });
          return;
        }
      }

      if (!this.isAllowedTourInteraction(target)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }

    async advanceToPointBuyPreview() {
      if (!this.active || this.isTransitioning || this.currentIndex !== 1 || this.stepPhase !== 0) return;
      this.isTransitioning = true;
      this.restoreAbilityPreview();
      this.stepPhase = 1;
      this.tooltipDragPosition = null;
      await this.openPointBuyPreview();
      await waitForLayoutStability();
      await this.renderStep();
      this.isTransitioning = false;
    }

    handleTourFormEventCapture(event) {
      if (!this.active || this.isInternalTourAction) return;
      const target = event.target;
      if (!(target instanceof HTMLSelectElement) || !this.isAllowedTourInteraction(target)) return;
      event.stopImmediatePropagation();
      if (event.type !== "change") return;
      if (this.currentIndex === 2 && this.equipmentPreviewSnapshot) {
        this.refreshEquipmentPreviewOutputs();
        this.renderStep();
        return;
      }
      if (this.currentIndex === 3 && this.spellControlSnapshot) {
        if (target === this.spellControlSnapshot.classSelect) {
          this.populateTourSpellOptions(target.value);
          this.renderStep();
        }
        if (target === this.spellControlSnapshot.spellSelect) {
          this.updateTourSpellDescription();
          this.renderStep();
        }
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
      this.refreshTourInteractionRoots();
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
        left: rect.left - padding,
        top: rect.top - padding,
        right: rect.right + padding,
        bottom: rect.bottom + padding
      };
    }

    getVisibleHole(hole) {
      if (!hole) return null;
      const visibleHole = {
        left: Math.max(0, hole.left),
        top: Math.max(0, hole.top),
        right: Math.min(window.innerWidth, hole.right),
        bottom: Math.min(window.innerHeight, hole.bottom)
      };
      if (visibleHole.right <= visibleHole.left || visibleHole.bottom <= visibleHole.top) return null;
      return visibleHole;
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
      const holes = (typeof step.getHoles === "function" ? step.getHoles() : [])
        .map((hole) => this.getVisibleHole(hole))
        .filter(Boolean)
        .slice(0, 2);
      const visibleHoles = this.applyMasksForHoles(holes);
      this.activeHoles = visibleHoles;
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
      this.applyTooltipDragPosition();
      this.refreshTourInteractionRoots();
      this.ensureTourFocus();
      this.lastTourScrollY = window.scrollY;
    }

    getNextButtonText() {
      if (this.currentIndex === 1 && this.stepPhase === 0) return "27購點";
      if (this.currentIndex === 4 && this.stepPhase === 0) return "查看選單";
      if (this.currentIndex === this.steps.length - 1) return "導覽完成";
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
        ring.style.cssText = "display:none;left:0;top:0;width:0;height:0;pointer-events:none;";
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
      ring.style.cssText = `display:block;left:${hole.left}px;top:${hole.top}px;width:${Math.max(0, hole.right - hole.left)}px;height:${Math.max(0, hole.bottom - hole.top)}px;pointer-events:none;`;
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

    clampTooltipPosition(left, top) {
      const margin = 10;
      const width = this.tooltip?.offsetWidth || 0;
      const height = this.tooltip?.offsetHeight || 0;
      return {
        left: Math.min(Math.max(margin, left), Math.max(margin, window.innerWidth - width - margin)),
        top: Math.min(Math.max(margin, top), Math.max(margin, window.innerHeight - height - margin))
      };
    }

    applyTooltipDragPosition() {
      if (!this.tooltipDragPosition || !this.tooltip) return;
      const position = this.clampTooltipPosition(this.tooltipDragPosition.left, this.tooltipDragPosition.top);
      this.tooltipDragPosition = position;
      this.tooltip.style.left = `${position.left}px`;
      this.tooltip.style.top = `${position.top}px`;
    }

    handleTooltipPointerDown(event) {
      if (!this.active || !this.tooltip || event.button !== 0) return;
      if (event.target instanceof Element && event.target.closest(".tour-btn-row button")) return;
      const rect = this.tooltip.getBoundingClientRect();
      this.tooltipDragPointerId = event.pointerId;
      this.tooltipDragOffset = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      this.tooltip.setPointerCapture?.(event.pointerId);
      this.tooltip.style.cursor = "grabbing";
      event.preventDefault();
    }

    handleTooltipPointerMove(event) {
      if (!this.active || this.tooltipDragPointerId !== event.pointerId || !this.tooltip) return;
      const position = this.clampTooltipPosition(
        event.clientX - this.tooltipDragOffset.x,
        event.clientY - this.tooltipDragOffset.y
      );
      this.tooltipDragPosition = position;
      this.tooltip.style.left = `${position.left}px`;
      this.tooltip.style.top = `${position.top}px`;
      event.preventDefault();
    }

    handleTooltipPointerUp(event) {
      if (this.highlightDragState?.pointerId === event.pointerId) {
        if (this.highlightDragState.moved) {
          this.suppressNextHighlightClick = true;
          window.setTimeout(() => {
            this.suppressNextHighlightClick = false;
          }, 120);
        }
        this.highlightDragState = null;
      }
      if (this.tooltipDragPointerId !== event.pointerId) return;
      if (this.tooltip?.hasPointerCapture?.(event.pointerId)) this.tooltip.releasePointerCapture(event.pointerId);
      this.tooltipDragPointerId = null;
      if (this.tooltip) this.tooltip.style.cursor = "grab";
    }

    handleResize() {
      if (!this.active) return;
      requestAnimationFrame(() => this.renderStep());
    }

    handleScroll() {
      if (!this.active || this.isTransitioning || this.scrollRenderPending) return;
      this.scrollRenderPending = true;
      requestAnimationFrame(() => {
        this.scrollRenderPending = false;
        if (!this.active || this.isTransitioning) return;
        const scrollDelta = window.scrollY - this.lastTourScrollY;
        this.lastTourScrollY = window.scrollY;
        this.keepHighlightedTargetsReachable(scrollDelta);
        this.lastTourScrollY = window.scrollY;
        this.renderStep();
      });
    }

    keepHighlightedTargetsReachable(scrollDelta) {
      if (!scrollDelta) return;
      const step = this.steps[this.currentIndex];
      const holes = (typeof step?.getHoles === "function" ? step.getHoles() : []).filter(Boolean).slice(0, 2);
      if (!holes.length) return;
      const targetTop = Math.min(...holes.map((hole) => hole.top));
      const targetBottom = Math.max(...holes.map((hole) => hole.bottom));
      const minimumVisible = Math.min(120, Math.max(72, window.innerHeight * 0.25));
      let correction = 0;
      if (scrollDelta > 0 && targetBottom < minimumVisible) {
        correction = targetBottom - minimumVisible;
      } else if (scrollDelta < 0 && targetTop > window.innerHeight - minimumVisible) {
        correction = targetTop - (window.innerHeight - minimumVisible);
      }
      if (correction) window.scrollTo(window.scrollX, window.scrollY + correction);
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
      if (this.tooltip?.contains(event.target) || this.isAllowedTourInteraction(event.target)) return;
      const blockedKeys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Spacebar"];
      if (blockedKeys.includes(event.key)) event.preventDefault();
    }

    handleFocusIn(event) {
      if (!this.active || this.isAllowedTourInteraction(event.target)) return;
      this.nextBtn?.focus({ preventScroll: true });
    }

    getTourFocusableButtons() {
      return [
        ...this.getAllowedTourElements(),
        this.prevBtn,
        this.skipBtn,
        this.nextBtn
      ].filter((element, index, elements) => {
        return element && !element.disabled && isElementVisible(element) && elements.indexOf(element) === index;
      });
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
      if (!this.active) return;
      if (event.type === "touchmove" && this.highlightDragState) {
        const point = this.getEventViewportPoint(event);
        if (point && this.moveHighlightDrag(point.y)) event.preventDefault();
        return;
      }
      if (event.type === "touchmove") {
        event.preventDefault();
        return;
      }
      if (this.isEventInsideActiveHole(event)) return;
      event.preventDefault();
    }

    lockUserScroll() {
      document.body.style.overscrollBehavior = "none";
      if (this.bodyTouchActionSnapshot === null) this.bodyTouchActionSnapshot = document.body.style.touchAction;
      document.body.style.touchAction = "none";
      window.addEventListener("wheel", this.preventScrollEvent, { passive: false, capture: true });
      window.addEventListener("touchmove", this.preventScrollEvent, { passive: false, capture: true });
    }

    unlockUserScroll() {
      document.body.style.overscrollBehavior = "";
      if (this.bodyTouchActionSnapshot !== null) document.body.style.touchAction = this.bodyTouchActionSnapshot;
      this.bodyTouchActionSnapshot = null;
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

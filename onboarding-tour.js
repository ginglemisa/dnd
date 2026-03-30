(function() {
  "use strict";

  function isElementVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
  }

  function waitForLayoutStability() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 60);
        });
      });
    });
  }

  function animateWindowScrollTo(targetY, durationMs = 520) {
    return new Promise((resolve) => {
      const startY = window.scrollY;
      const maxScroll = Math.max(0, document.body.scrollHeight - window.innerHeight);
      const finalY = Math.max(0, Math.min(targetY, maxScroll));
      const diff = finalY - startY;
      if (Math.abs(diff) < 1) {
        window.scrollTo(0, finalY);
        resolve();
        return;
      }

      const start = performance.now();
      const step = (now) => {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / durationMs);
        const eased = 1 - Math.pow(1 - t, 3);
        window.scrollTo(0, startY + diff * eased);
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(step);
    });
  }

  function simulateButtonPress(button, onPress) {
    return new Promise((resolve) => {
      if (!button) {
        if (typeof onPress === "function") onPress();
        resolve();
        return;
      }

      const prevTransition = button.style.transition;
      const prevTransform = button.style.transform;
      const prevFilter = button.style.filter;
      button.style.transition = "transform 180ms ease, filter 180ms ease";
      button.style.transform = "translateY(1px) scale(0.97)";
      button.style.filter = "brightness(0.96)";

      window.setTimeout(() => {
        if (typeof onPress === "function") onPress();
        button.style.transform = prevTransform;
        button.style.filter = prevFilter;
        window.setTimeout(() => {
          button.style.transition = prevTransition;
          resolve();
        }, 180);
      }, 180);
    });
  }

  function getUnionRect(elements) {
    const rects = elements
      .filter(Boolean)
      .map((el) => el.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0);
    if (!rects.length) return null;
    return {
      left: Math.min(...rects.map((rect) => rect.left)),
      top: Math.min(...rects.map((rect) => rect.top)),
      right: Math.max(...rects.map((rect) => rect.right)),
      bottom: Math.max(...rects.map((rect) => rect.bottom))
    };
  }

  function findTextLine(container, labelText) {
    if (!container) return null;
    return Array.from(container.querySelectorAll("div")).find((el) => el.textContent?.includes(labelText)) || null;
  }

  function findTextLines(container, labelTexts) {
    if (!container) return [];
    return labelTexts
      .map((labelText) => findTextLine(container, labelText))
      .filter(Boolean);
  }

  class OnboardingTour {
    constructor() {
      this.overlay = document.getElementById("tour-overlay");
      this.maskGroups = [
        {
          top: document.getElementById("tour-mask-top-1"),
          left: document.getElementById("tour-mask-left-1"),
          right: document.getElementById("tour-mask-right-1"),
          bottom: document.getElementById("tour-mask-bottom-1")
        },
        {
          top: document.getElementById("tour-mask-top-2"),
          left: document.getElementById("tour-mask-left-2"),
          right: document.getElementById("tour-mask-right-2"),
          bottom: document.getElementById("tour-mask-bottom-2")
        }
      ];
      this.focusRings = [
        document.getElementById("tour-focus-ring"),
        document.getElementById("tour-focus-ring-secondary")
      ];
      this.tooltip = document.getElementById("tour-tooltip");
      this.title = document.getElementById("tour-step-title");
      this.text = document.getElementById("tour-step-text");
      this.prevBtn = document.getElementById("tour-prev-btn");
      this.nextBtn = document.getElementById("tour-next-btn");
      this.skipBtn = document.getElementById("tour-skip-btn");
      this.steps = [];
      this.currentIndex = -1;
      this.active = false;
      this.isTransitioning = false;
      this.stepRuntime = {};
      this.handleResize = this.handleResize.bind(this);
      this.handleKeydown = this.handleKeydown.bind(this);
      this.preventScrollEvent = this.preventScrollEvent.bind(this);
    }

    setSelectValue(id, value) {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = value;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }

    setSpellRowCount(areaId, level, targetCount) {
      const area = document.getElementById(areaId);
      if (!area) return;
      const safeCount = Math.max(1, Number(targetCount) || 1);
      while (area.childElementCount > safeCount) {
        area.lastElementChild?.remove();
      }
      while (area.childElementCount < safeCount) {
        createSingleSpellRow(areaId, level);
      }
      refreshSpellRows(areaId);
    }

    setExpertiseVisibilityOverride(show) {
      const skillLegend = document.querySelector(".skill-legend");
      if (skillLegend) {
        skillLegend.style.display = show ? "" : "none";
      }
      document.querySelectorAll(".circle-checkbox").forEach((checkbox) => {
        checkbox.disabled = !show;
        checkbox.style.display = show ? "" : "none";
      });
    }

    setWeaponMasteryVisibilityOverride(show) {
      const masteryDetails = document.getElementById("weapon-mastery-details");
      const summaryWrap = document.getElementById("weapon-mastery-summary-wrap");
      if (masteryDetails) masteryDetails.style.display = show ? "block" : "none";
      if (summaryWrap) summaryWrap.style.display = show ? "block" : "none";
    }

    ensureStep14ExpertiseOverride() {
      const classValue = document.getElementById("class")?.value || "";
      const shouldShowExpertise = typeof EXPERTISE_VISIBLE_CLASSES !== "undefined"
        ? EXPERTISE_VISIBLE_CLASSES.has(classValue)
        : true;
      this.stepRuntime.step14ForceExpertise = !shouldShowExpertise;
      if (this.stepRuntime.step14ForceExpertise) {
        this.setExpertiseVisibilityOverride(true);
      }
    }

    ensureStep16WeaponMasteryOverride() {
      this.stepRuntime.step16WeaponMasteryForced = true;
      this.setWeaponMasteryVisibilityOverride(true);
    }

    restoreStep7State() {
      const backgroundSelect = document.getElementById("background");
      const raceSelect = document.getElementById("race");
      if (this.stepRuntime.step7AutoBackground && backgroundSelect) {
        this.setSelectValue("background", "");
      } else if (typeof this.stepRuntime.step7PrevBackground === "string" && backgroundSelect) {
        this.setSelectValue("background", this.stepRuntime.step7PrevBackground);
      }
      if (this.stepRuntime.step7AutoRace && raceSelect) {
        this.setSelectValue("race", "");
      } else if (typeof this.stepRuntime.step7PrevRace === "string" && raceSelect) {
        this.setSelectValue("race", this.stepRuntime.step7PrevRace);
      }

      const bgDetails = document.querySelector("#backgroundFeatures")?.closest("details");
      if (bgDetails && this.stepRuntime.step7AutoOpenedBackground) {
        bgDetails.open = false;
      }

      const raceDetails = document.querySelector("#raceFeatures")?.closest("details");
      if (raceDetails && this.stepRuntime.step9AutoOpenedRace) {
        raceDetails.open = false;
      }

      delete this.stepRuntime.step7PrevBackground;
      delete this.stepRuntime.step7PrevRace;
      delete this.stepRuntime.step7AutoBackground;
      delete this.stepRuntime.step7AutoRace;
      delete this.stepRuntime.step7AutoOpenedBackground;
      delete this.stepRuntime.step9AutoOpenedRace;
    }

    restoreExpertiseOverride() {
      if (!this.stepRuntime.step14ForceExpertise) return;
      if (typeof updateExpertiseVisibility === "function") {
        updateExpertiseVisibility();
      } else {
        this.setExpertiseVisibilityOverride(false);
      }
      delete this.stepRuntime.step14ForceExpertise;
    }

    restoreWeaponMasteryOverride() {
      if (!this.stepRuntime.step16WeaponMasteryForced) return;
      if (typeof updateWeaponMasteryVisibility === "function") {
        updateWeaponMasteryVisibility();
      } else {
        this.setWeaponMasteryVisibilityOverride(false);
      }
      delete this.stepRuntime.step16WeaponMasteryForced;
    }

    cleanupTransientState() {
      this.restoreStep7State();
      this.restoreExpertiseOverride();
      this.restoreWeaponMasteryOverride();
    }

    init() {
      if (!this.overlay || !this.prevBtn || !this.nextBtn || !this.skipBtn) return;
      this.prevBtn.addEventListener("click", () => this.prev());
      this.nextBtn.addEventListener("click", () => this.next());
      this.skipBtn.addEventListener("click", () => this.stop());
      window.addEventListener("resize", this.handleResize);
      document.addEventListener("keydown", this.handleKeydown);
      document.getElementById("restart-onboarding-btn")?.addEventListener("click", () => this.start());
    }

    getSteps() {
      return [
        {
          tab: "basic",
          title: "歡迎進入D&D的世界",
          text: "本網站工具專為新手設計，簡單易懂，推薦在城主教學下使用。",
          placement: "center",
          beforePosition: async () => {
            await waitForLayoutStability();
          }
        },
        {
          tab: "basic",
          selectors: ["#scrollToTopBtn"],
          title: "頁頂按鈕",
          text: "點擊這個箭頭可以快速把畫面拉到最上方。",
          placement: "top",
          beforePosition: async () => {
            const scrollBtn = document.getElementById("scrollToTopBtn");
            this.stepRuntime.step2PrevScrollBtnDisplay = scrollBtn?.style.display || "";
            if (scrollBtn && !isElementVisible(scrollBtn)) {
              scrollBtn.style.display = "block";
            }
            if (scrollBtn) {
              this.stepRuntime.step2Advancing = false;
              this.stepRuntime.step2ClickHandler = async () => {
                if (this.stepRuntime.step2Advancing) return;
                this.stepRuntime.step2Advancing = true;
                await waitForLayoutStability();
                await this.next();
              };
              scrollBtn.addEventListener("click", this.stepRuntime.step2ClickHandler);
            }
            await waitForLayoutStability();
          },
          afterLeave: () => {
            const scrollBtn = document.getElementById("scrollToTopBtn");
            if (scrollBtn && this.stepRuntime.step2ClickHandler) {
              scrollBtn.removeEventListener("click", this.stepRuntime.step2ClickHandler);
            }
            if (scrollBtn && typeof this.stepRuntime.step2PrevScrollBtnDisplay === "string") {
              scrollBtn.style.display = this.stepRuntime.step2PrevScrollBtnDisplay;
            }
            delete this.stepRuntime.step2Advancing;
            delete this.stepRuntime.step2ClickHandler;
            delete this.stepRuntime.step2PrevScrollBtnDisplay;
          }
        },
        {
          tab: "basic",
          selectors: [".tabs-shell"],
          title: "這是切換分頁列",
          text: "你可以依照需求點選要使用的分頁。",
          placement: "bottom",
          hideTooltipDuringTransition: true,
          animatePrimaryHole: true,
          beforePosition: async () => {
            if (window.scrollY > 0) {
              await animateWindowScrollTo(0, 620);
            }
            await waitForLayoutStability();
          }
        },
        {
          tab: "basic",
          selectors: [".mini-stat-card.basic-pair-card.basic-pair-card--class-level"],
          title: "選擇你的職業",
          text: "這會決定角色解決問題的方式與擅長的戰鬥風格。",
          placement: "bottom",
          hideTooltipDuringTransition: true,
          animatePrimaryHole: true,
          beforePosition: async () => {
            const activeTab = document.querySelector(".tab-content.active")?.id?.replace("tab-", "");
            if (activeTab !== "basic") {
              const basicTabButton = document.getElementById("basic-tab-button");
              await simulateButtonPress(basicTabButton, () => {
                basicTabButton?.click();
              });
            }
            window.scrollTo({ top: 0, behavior: "auto" });
            await waitForLayoutStability();
          }
        },
        {
          tab: "basic",
          selectors: [".mini-stat-card.basic-pair-card.basic-pair-card--equal"],
          title: "確定出身",
          text: "出身由背景、種族和兩種語言決定。背景是角色過去的人生；種族除了外觀以外，也帶有特性。",
          placement: "bottom",
          hideTooltipDuringTransition: true,
          animatePrimaryHole: true,
          beforePosition: async () => {
            window.scrollTo({ top: 0, behavior: "auto" });
            await waitForLayoutStability();
          }
        },
        {
          tab: "skills",
          selectors: [".section.language-card"],
          getHoles: () => {
            const card = document.querySelector(".section.language-card");
            const language2 = document.getElementById("language2");
            if (!card || !language2 || !isElementVisible(card) || !isElementVisible(language2)) return [];
            const cardRect = card.getBoundingClientRect();
            const language2Rect = language2.getBoundingClientRect();
            const padX = 8;
            const padTop = 8;
            const padBottom = 8;
            return [
              {
                left: Math.max(0, cardRect.left - padX),
                top: Math.max(0, cardRect.top - padTop),
                right: Math.min(window.innerWidth, cardRect.right + padX),
                bottom: Math.min(window.innerHeight, language2Rect.bottom + padBottom)
              }
            ];
          },
          title: "選兩種語言",
          text: "語言承載著文化與記憶，冒險中和不同對象溝通時會用到。",
          placement: "top",
          hideTooltipDuringTransition: true,
          skipAutoTabSwitch: true,
          beforePosition: async () => {
            if (this.tooltip) this.tooltip.style.display = "none";

            const tabsHole = this.getHoleForSelector(".tabs-shell", 6);
            if (tabsHole && this.lastRenderedHoles?.length === 1) {
              await this.animatePrimaryHoleTransition(this.lastRenderedHoles[0], tabsHole, 420);
              this.lastRenderedHoles = [{ ...tabsHole }];
            }

            const skillsTabButton = document.querySelector(".tab-button[onclick*=\"'skills'\"]");
            await simulateButtonPress(skillsTabButton, () => {
              skillsTabButton?.click();
            });
            await waitForLayoutStability();

            const languageCard = document.querySelector(".section.language-card");
            if (languageCard) {
              const rect = languageCard.getBoundingClientRect();
              const targetY = window.scrollY + rect.top - 160;
              await animateWindowScrollTo(targetY, 720);
              await waitForLayoutStability();
            }
            const languageHole = this.getStepHoles(this.steps[this.currentIndex]);
            if (tabsHole) {
              this.applyMasksForHoles([tabsHole]);
              this.setFocusRing(this.focusRings[0], tabsHole);
              this.setFocusRing(this.focusRings[1], null);
            }
            if (tabsHole && languageHole.length) {
              await this.animatePrimaryHoleTransition(tabsHole, languageHole[0], 420);
            }
          }
        },
        {
          tab: "basic",
          selectors: [],
          getHoles: () => {
            const target = document.getElementById("background-ability-guide-target");
            const lines = Array.from(target?.children || []).filter((el) => {
              const text = el.textContent?.trim() || "";
              return (
                text.startsWith("屬性") ||
                text.startsWith("專長") ||
                text.startsWith("技能熟練") ||
                text.startsWith("工具熟練")
              );
            });
            const hole = this.getHoleFromElements(lines, 8);
            return hole ? [hole] : [];
          },
          title: "背景能力",
          text: "提供屬性加值、專長、技能與工具熟練，代表你成為冒險者前累積的能力。",
          placement: "top",
          hideTooltipDuringTransition: true,
          skipAutoTabSwitch: true,
          beforePosition: async () => {
            if (this.tooltip) this.tooltip.style.display = "none";

            const tabsHole = this.getHoleForSelector(".tabs-shell", 6);
            if (tabsHole && this.lastRenderedHoles?.length === 1) {
              await this.animatePrimaryHoleTransition(this.lastRenderedHoles[0], tabsHole, 420);
              this.lastRenderedHoles = [{ ...tabsHole }];
            }

            const basicTabButton = document.getElementById("basic-tab-button");
            await simulateButtonPress(basicTabButton, () => {
              basicTabButton?.click();
            });
            await waitForLayoutStability();

            const backgroundSelect = document.getElementById("background");
            const raceSelect = document.getElementById("race");
            this.stepRuntime.step7PrevBackground = backgroundSelect?.value || "";
            this.stepRuntime.step7PrevRace = raceSelect?.value || "";
            this.stepRuntime.step7AutoBackground = Boolean(backgroundSelect && !backgroundSelect.value);
            this.stepRuntime.step7AutoRace = Boolean(raceSelect && !raceSelect.value);

            if (this.stepRuntime.step7AutoBackground && backgroundSelect) {
              this.setSelectValue("background", "acolyte");
              await waitForLayoutStability();
            }
            if (this.stepRuntime.step7AutoRace && raceSelect) {
              this.setSelectValue("race", "human");
              await waitForLayoutStability();
            }

            const bgDetails = document.querySelector("#backgroundFeatures")?.closest("details");
            this.stepRuntime.step7AutoOpenedBackground = Boolean(bgDetails && !bgDetails.open);
            if (this.stepRuntime.step7AutoOpenedBackground && bgDetails) {
              bgDetails.open = true;
              await waitForLayoutStability();
            }

            const output = document.getElementById("backgroundFeatures");
            if (output) {
              const rect = output.getBoundingClientRect();
              const targetY = window.scrollY + rect.top - 120;
              await animateWindowScrollTo(targetY, 720);
              await waitForLayoutStability();
            }

            const backgroundHole = this.getStepHoles(this.steps[this.currentIndex]);
            if (tabsHole) {
              this.applyMasksForHoles([tabsHole]);
              this.setFocusRing(this.focusRings[0], tabsHole);
              this.setFocusRing(this.focusRings[1], null);
            }
            if (tabsHole && backgroundHole.length) {
              await this.animatePrimaryHoleTransition(tabsHole, backgroundHole[0], 420);
            }
          }
        },
        {
          tab: "basic",
          selectors: [],
          getHoles: () => {
            const target = document.getElementById("background-ability-guide-target");
            const abilityLine = Array.from(target?.children || []).find((el) =>
              (el.textContent?.trim() || "").startsWith("屬性")
            );
            const hole = this.getHoleFromElements(abilityLine ? [abilityLine] : [], 8);
            return hole ? [hole] : [];
          },
          title: "屬性加值",
          text: "選擇加值方式：三項各 +1，或一項 +2、另一項 +1，打造你的強項。",
          placement: "top",
          hideTooltipDuringTransition: true,
          animatePrimaryHole: true,
          beforePosition: async () => {
            await waitForLayoutStability();
          }
        },
        {
          tab: "basic",
          selectors: [],
          getHoles: () => {
            const raceSummary = Array.from(document.querySelectorAll("#tab-basic summary h3")).find(
              (el) => el.textContent?.trim() === "種族能力"
            );
            const raceOutput = document.getElementById("raceFeatures");
            const raceLines = Array.from(raceOutput?.querySelectorAll(".race-feature-line") || []).filter((el) => {
              const label = el.textContent?.trim() || "";
              return label.startsWith("生物類型") || label.startsWith("體型") || label.startsWith("速度");
            });
            const hole = this.getHoleFromElements([raceSummary, ...raceLines], 8);
            return hole ? [hole] : [];
          },
          title: "種族能力",
          text: "種族會影響體型、長相、移動速度，還有專屬能力。",
          placement: "top",
          hideTooltipDuringTransition: true,
          skipAutoTabSwitch: true,
          beforePosition: async () => {
            if (this.tooltip) this.tooltip.style.display = "none";

            const bgSummary = Array.from(document.querySelectorAll("#tab-basic summary h3")).find(
              (el) => el.textContent?.trim() === "背景能力"
            );
            const bgHole = bgSummary
              ? {
                  left: Math.max(0, bgSummary.getBoundingClientRect().left - 8),
                  top: Math.max(0, bgSummary.getBoundingClientRect().top - 8),
                  right: Math.min(window.innerWidth, bgSummary.getBoundingClientRect().right + 8),
                  bottom: Math.min(window.innerHeight, bgSummary.getBoundingClientRect().bottom + 8)
                }
              : null;
            if (bgHole && this.lastRenderedHoles?.length === 1) {
              await this.animatePrimaryHoleTransition(this.lastRenderedHoles[0], bgHole, 420);
              this.lastRenderedHoles = [{ ...bgHole }];
            }

            const bgDetails = document.querySelector("#backgroundFeatures")?.closest("details");
            if (bgDetails?.open) {
              const bgSummaryEl = bgDetails.querySelector("summary");
              await simulateButtonPress(bgSummaryEl, () => {
                bgSummaryEl?.click();
              });
              await waitForLayoutStability();
            }

            if (this.stepRuntime.step7AutoBackground) {
              this.setSelectValue("background", "");
              await waitForLayoutStability();
            } else if (typeof this.stepRuntime.step7PrevBackground === "string") {
              this.setSelectValue("background", this.stepRuntime.step7PrevBackground);
              await waitForLayoutStability();
            }

            const raceSelect = document.getElementById("race");
            if (this.stepRuntime.step7AutoRace && raceSelect && !raceSelect.value) {
              this.setSelectValue("race", "human");
              await waitForLayoutStability();
            } else if (!this.stepRuntime.step7AutoRace && typeof this.stepRuntime.step7PrevRace === "string" && raceSelect) {
              this.setSelectValue("race", this.stepRuntime.step7PrevRace);
              await waitForLayoutStability();
            }

            const raceDetails = document.querySelector("#raceFeatures")?.closest("details");
            this.stepRuntime.step9AutoOpenedRace = Boolean(raceDetails && !raceDetails.open);
            if (this.stepRuntime.step9AutoOpenedRace && raceDetails) {
              raceDetails.open = true;
              await waitForLayoutStability();
            }

            const raceHole = this.getStepHoles(this.steps[this.currentIndex]);
            if (bgHole) {
              this.applyMasksForHoles([bgHole]);
              this.setFocusRing(this.focusRings[0], bgHole);
              this.setFocusRing(this.focusRings[1], null);
            }
            if (bgHole && raceHole.length) {
              await this.animatePrimaryHoleTransition(bgHole, raceHole[0], 420);
            }
          }
        },
        {
          tab: "basic",
          selectors: [],
          getHoles: () => {
            const strCard = document.getElementById("str")?.closest(".ability");
            const hole = this.getHoleFromElements(strCard ? [strCard] : [], 8);
            return hole ? [hole] : [];
          },
          title: "屬性數值與調整值",
          text: "屬性數值代表能力強弱，調整值會影響擲骰判定。力量、敏捷、體質屬於肉體能力；智力、感知、魅力則分別代表知識、感受與社交氣場。",
          placement: "bottom",
          hideTooltipDuringTransition: true,
          skipAutoTabSwitch: true,
          beforePosition: async () => {
            if (this.tooltip) this.tooltip.style.display = "none";

            const raceSummary = Array.from(document.querySelectorAll("#tab-basic summary h3")).find(
              (el) => el.textContent?.trim() === "種族能力"
            );
            const raceHole = raceSummary
              ? {
                  left: Math.max(0, raceSummary.getBoundingClientRect().left - 8),
                  top: Math.max(0, raceSummary.getBoundingClientRect().top - 8),
                  right: Math.min(window.innerWidth, raceSummary.getBoundingClientRect().right + 8),
                  bottom: Math.min(window.innerHeight, raceSummary.getBoundingClientRect().bottom + 8)
                }
              : null;
            if (raceHole && this.lastRenderedHoles?.length === 1) {
              await this.animatePrimaryHoleTransition(this.lastRenderedHoles[0], raceHole, 420);
            }

            const raceDetails = document.querySelector("#raceFeatures")?.closest("details");
            if (raceDetails?.open) {
              const raceSummaryEl = raceDetails.querySelector("summary");
              await simulateButtonPress(raceSummaryEl, () => {
                raceSummaryEl?.click();
              });
              await waitForLayoutStability();
            }

            if (this.stepRuntime.step7AutoRace) {
              this.setSelectValue("race", "");
              await waitForLayoutStability();
            } else if (typeof this.stepRuntime.step7PrevRace === "string") {
              this.setSelectValue("race", this.stepRuntime.step7PrevRace);
              await waitForLayoutStability();
            }

            const strCard = document.getElementById("str")?.closest(".ability");
            if (strCard) {
              const rect = strCard.getBoundingClientRect();
              const targetY = window.scrollY + rect.top - 120;
              await animateWindowScrollTo(targetY, 720);
              await waitForLayoutStability();
            }

            const strHole = this.getStepHoles(this.steps[this.currentIndex]);
            if (raceHole) {
              this.applyMasksForHoles([raceHole]);
              this.setFocusRing(this.focusRings[0], raceHole);
              this.setFocusRing(this.focusRings[1], null);
            }
            if (raceHole && strHole.length) {
              await this.animatePrimaryHoleTransition(raceHole, strHole[0], 420);
            }
          }
        },
        {
          tab: "basic",
          selectors: [],
          getHoles: () => {
            const strInput = document.getElementById("str");
            const hole = this.getHoleFromElements(strInput ? [strInput] : [], 8);
            return hole ? [hole] : [];
          },
          title: "輸入屬性值",
          text: "輸入六項能力數值，可使用固定數值（15、14、13、12、10、8）或自行分配，也可採用隨機擲骰或點數購買的方式。",
          placement: "bottom",
          hideTooltipDuringTransition: true,
          animatePrimaryHole: true,
          beforePosition: async () => {
            await waitForLayoutStability();
          }
        },
        {
          tab: "basic",
          selectors: [],
          getHoles: () => {
            const quickCard = document.getElementById("set-default-abilities")?.closest(".mini-stat-card");
            const hole = this.getHoleFromElements(quickCard ? [quickCard] : [], 8);
            return hole ? [hole] : [];
          },
          title: "快速創角",
          text: "使用預設配置快速完成角色，適合新手或想節省時間時使用。",
          placement: "bottom",
          hideTooltipDuringTransition: true,
          skipAutoTabSwitch: true,
          beforePosition: async () => {
            if (this.tooltip) this.tooltip.style.display = "none";

            const strInput = document.getElementById("str");
            const strHole = this.getHoleFromElements(strInput ? [strInput] : [], 8);
            if (strHole && this.lastRenderedHoles?.length === 1) {
              await this.animatePrimaryHoleTransition(this.lastRenderedHoles[0], strHole, 420);
              this.lastRenderedHoles = [{ ...strHole }];
            }

            const quickCard = document.getElementById("set-default-abilities")?.closest(".mini-stat-card");
            if (quickCard) {
              const rect = quickCard.getBoundingClientRect();
              const targetY = window.scrollY + rect.top - 140;
              await animateWindowScrollTo(targetY, 720);
              await waitForLayoutStability();
            }

            const quickHole = this.getStepHoles(this.steps[this.currentIndex]);
            if (strHole) {
              this.applyMasksForHoles([strHole]);
              this.setFocusRing(this.focusRings[0], strHole);
              this.setFocusRing(this.focusRings[1], null);
            }
            if (strHole && quickHole.length) {
              await this.animatePrimaryHoleTransition(strHole, quickHole[0], 420);
            }
          }
        },
        {
          tab: "skills",
          selectors: [],
          getHoles: () => {
            const button = document.querySelector("button[onclick='fillSaves()']");
            const hole = this.getHoleFromElements(button ? [button] : [], 8);
            return hole ? [hole] : [];
          },
          title: "計算屬性豁免",
          text: "選好職業後，按下這個按鈕可自動整理六項屬性豁免，幫你快速完成常用戰鬥數值。",
          placement: "bottom",
          hideTooltipDuringTransition: true,
          skipAutoTabSwitch: true,
          beforePosition: async () => {
            if (this.tooltip) this.tooltip.style.display = "none";

            const tabsHole = this.getHoleForSelector(".tabs-shell", 6);
            if (tabsHole && this.lastRenderedHoles?.length === 1) {
              await this.animatePrimaryHoleTransition(this.lastRenderedHoles[0], tabsHole, 420);
              this.lastRenderedHoles = [{ ...tabsHole }];
            }

            const skillsTabButton = document.querySelector(".tab-button[onclick*=\"'skills'\"]");
            await simulateButtonPress(skillsTabButton, () => {
              skillsTabButton?.click();
            });
            await waitForLayoutStability();

            const fillSavesButton = document.querySelector("button[onclick='fillSaves()']");
            if (fillSavesButton) {
              const rect = fillSavesButton.getBoundingClientRect();
              const targetY = window.scrollY + rect.top - 140;
              await animateWindowScrollTo(targetY, 720);
              await waitForLayoutStability();
            }

            const buttonHole = this.getStepHoles(this.steps[this.currentIndex]);
            if (tabsHole) {
              this.applyMasksForHoles([tabsHole]);
              this.setFocusRing(this.focusRings[0], tabsHole);
              this.setFocusRing(this.focusRings[1], null);
            }
            if (tabsHole && buttonHole.length) {
              await this.animatePrimaryHoleTransition(tabsHole, buttonHole[0], 420);
            }
          }
        },
        {
          tab: "skills",
          selectors: [],
          getHoles: () => {
            const skillCard = document.getElementById("prof-運動")?.closest(".skill-cell");
            const hole = this.getHoleFromElements(skillCard ? [skillCard] : [], 8);
            return hole ? [hole] : [];
          },
          title: "技能",
          text: "技能代表角色在特定行動上的能力。",
          placement: "bottom",
          hideTooltipDuringTransition: true,
          skipAutoTabSwitch: true,
          beforePosition: async () => {
            this.ensureStep14ExpertiseOverride();

            await waitForLayoutStability();

            const skillCard = document.getElementById("prof-運動")?.closest(".skill-cell");
            const fillSkillsButton = document.querySelector("button[onclick='fillSkills()']");
            const anchorRect = skillCard?.getBoundingClientRect() || fillSkillsButton?.getBoundingClientRect();
            if (anchorRect) {
              const targetY = window.scrollY + anchorRect.top - 180;
              await animateWindowScrollTo(targetY, 720);
              await waitForLayoutStability();
            }
          }
        },
        {
          tab: "skills",
          selectors: [],
          getHoles: () => {
            const button = document.querySelector("button[onclick='fillSkills()']");
            const hole = this.getHoleFromElements(button ? [button] : [], 8);
            return hole ? [hole] : [];
          },
          title: "計算技能加值",
          text: "勾選技能熟練或專精後，再按下按鈕，系統會依照屬性與熟練自動填入技能數值。",
          placement: "bottom",
          hideTooltipDuringTransition: true,
          animatePrimaryHole: true,
          beforePosition: async () => {
            this.ensureStep14ExpertiseOverride();

            const fillSkillsButton = document.querySelector("button[onclick='fillSkills()']");
            if (fillSkillsButton) {
              const rect = fillSkillsButton.getBoundingClientRect();
              const targetY = window.scrollY + rect.top - 140;
              await animateWindowScrollTo(targetY, 720);
              await waitForLayoutStability();
            }
          }
        },
        {
          tab: "equipment",
          selectors: [],
          getHoles: () => {
            const section = document.querySelector("#tab-equipment > .section");
            const heading = section?.querySelector("h3");
            const intro = section?.querySelector("p");
            const mainHandRow = document.getElementById("mainHand")?.closest(".form-row");
            const hole = this.getHoleFromElements([heading, intro, mainHandRow].filter(Boolean), 8);
            return hole ? [hole] : [];
          },
          title: "裝備",
          text: "選擇角色的武器與盔甲，這會影響攻擊力與防護能力。",
          placement: "bottom",
          hideTooltipDuringTransition: true,
          skipAutoTabSwitch: true,
          beforePosition: async () => {
            this.restoreExpertiseOverride();
            this.ensureStep16WeaponMasteryOverride();

            if (this.tooltip) this.tooltip.style.display = "none";
            const tabsHole = this.getHoleForSelector(".tabs-shell", 6);
            if (tabsHole && this.lastRenderedHoles?.length === 1) {
              await this.animatePrimaryHoleTransition(this.lastRenderedHoles[0], tabsHole, 420);
              this.lastRenderedHoles = [{ ...tabsHole }];
            }

            const equipmentTabButton = document.querySelector(".tab-button[onclick*=\"'equipment'\"]");
            await simulateButtonPress(equipmentTabButton, () => {
              equipmentTabButton?.click();
            });
            await waitForLayoutStability();

            const equipmentSection = document.querySelector("#tab-equipment > .section");
            if (equipmentSection) {
              const rect = equipmentSection.getBoundingClientRect();
              const targetY = window.scrollY + rect.top - 100;
              await animateWindowScrollTo(targetY, 720);
              await waitForLayoutStability();
            }

            const sectionHole = this.getStepHoles(this.steps[this.currentIndex]);
            if (tabsHole) {
              this.applyMasksForHoles([tabsHole]);
              this.setFocusRing(this.focusRings[0], tabsHole);
              this.setFocusRing(this.focusRings[1], null);
            }
            if (tabsHole && sectionHole.length) {
              await this.animatePrimaryHoleTransition(tabsHole, sectionHole[0], 420);
            }
          }
        },
        {
          tab: "equipment",
          selectors: [],
          getHoles: () => {
            const cleaveWrap = document.getElementById("weapon-mastery-cleave")?.closest("div");
            const hole = this.getHoleFromElements(cleaveWrap ? [cleaveWrap] : [], 8);
            return hole ? [hole] : [];
          },
          title: "精通屬性",
          text: "如果職業精通某種武器，勾選項目（如順劈），攻擊時會獲得額外效果。",
          placement: "top",
          hideTooltipDuringTransition: true,
          skipAutoTabSwitch: true,
          beforePosition: async () => {
            this.ensureStep16WeaponMasteryOverride();

            if (this.tooltip) this.tooltip.style.display = "none";

            const masterySummary = document.querySelector("#weapon-mastery-details > summary");
            const masteryHole = this.getHoleFromElements(masterySummary ? [masterySummary] : [], 8);
            if (masteryHole && this.lastRenderedHoles?.length === 1) {
              await this.animatePrimaryHoleTransition(this.lastRenderedHoles[0], masteryHole, 420);
              this.lastRenderedHoles = [{ ...masteryHole }];
            }

            const masteryDetails = document.getElementById("weapon-mastery-details");
            if (masteryDetails && !masteryDetails.open) {
              await simulateButtonPress(masterySummary, () => {
                masterySummary?.click();
              });
              await waitForLayoutStability();
            }

            if (masteryDetails) {
              const cleaveWrap = document.getElementById("weapon-mastery-cleave")?.closest("div");
              const targetRect = cleaveWrap?.getBoundingClientRect() || masteryDetails.getBoundingClientRect();
              const targetY = window.scrollY + targetRect.top - 120;
              await animateWindowScrollTo(targetY, 820);
              await waitForLayoutStability();
            }

            const cleaveHole = this.getStepHoles(this.steps[this.currentIndex]);
            if (masteryHole) {
              this.applyMasksForHoles([masteryHole]);
              this.setFocusRing(this.focusRings[0], masteryHole);
              this.setFocusRing(this.focusRings[1], null);
            }
            if (masteryHole && cleaveHole.length) {
              await this.animatePrimaryHoleTransition(masteryHole, cleaveHole[0], 420);
            }
          }
        },
        {
          tab: "equipment",
          selectors: [],
          getHoles: () => {
            const container = document.getElementById("equipment-notes-section");
            const heading = Array.from(container?.querySelectorAll("h3") || []).find((el) =>
              el.textContent?.trim() === "工具、道具、用品"
            );
            const summaries = Array.from(container?.querySelectorAll(".equipment-note-summary") || []).filter((el) => {
              const label = el.textContent?.trim() || "";
              return label === "工匠工具" || label === "其他工具" || label === "冒險用品";
            });
            const hole = this.getHoleFromElements([heading, ...summaries].filter(Boolean), 8);
            return hole ? [hole] : [];
          },
          title: "工具、物品",
          text: "這裡整理了工具與冒險用品。需要時可以展開查看用途、對應屬性、重量和特殊效果，方便你在遊戲中查找與記錄。",
          placement: "top",
          hideTooltipDuringTransition: true,
          skipAutoTabSwitch: true,
          beforePosition: async () => {
            if (this.tooltip) this.tooltip.style.display = "none";

            const masterySummary = document.querySelector("#weapon-mastery-details > summary");
            const cleaveWrap = document.getElementById("weapon-mastery-cleave")?.closest("div");
            const cleaveHole = this.getHoleFromElements(cleaveWrap ? [cleaveWrap] : [], 8);
            if (cleaveHole && this.lastRenderedHoles?.length === 1) {
              await this.animatePrimaryHoleTransition(this.lastRenderedHoles[0], cleaveHole, 420);
              this.lastRenderedHoles = [{ ...cleaveHole }];
            }

            const masteryDetails = document.getElementById("weapon-mastery-details");
            if (masteryDetails?.open) {
              await simulateButtonPress(masterySummary, () => {
                masterySummary?.click();
              });
              await waitForLayoutStability();
            }

            if (this.stepRuntime.step16WeaponMasteryForced) {
              if (typeof updateWeaponMasteryVisibility === "function") {
                updateWeaponMasteryVisibility();
              } else {
                this.setWeaponMasteryVisibilityOverride(false);
              }
              delete this.stepRuntime.step16WeaponMasteryForced;
            }

            const container = document.getElementById("equipment-notes-section");
            Array.from(container?.querySelectorAll(":scope > .section > details") || []).forEach((detail) => {
              detail.open = false;
            });
            await waitForLayoutStability();

            const toolsHeading = Array.from(container?.querySelectorAll("h3") || []).find((el) =>
              el.textContent?.trim() === "工具、道具、用品"
            );
            if (toolsHeading) {
              const rect = toolsHeading.getBoundingClientRect();
              const targetY = window.scrollY + rect.top - 100;
              await animateWindowScrollTo(targetY, 820);
              await waitForLayoutStability();
            }

            const toolsHole = this.getStepHoles(this.steps[this.currentIndex]);
            if (cleaveHole) {
              this.applyMasksForHoles([cleaveHole]);
              this.setFocusRing(this.focusRings[0], cleaveHole);
              this.setFocusRing(this.focusRings[1], null);
            }
            if (cleaveHole && toolsHole.length) {
              await this.animatePrimaryHoleTransition(cleaveHole, toolsHole[0], 420);
            }
          }
        },
        {
          tab: "actions",
          selectors: [],
          getHoles: () => {
            const detail = Array.from(document.querySelectorAll("#tab-actions details.action-collapsible-wrap")).find(
              (item) => item.querySelector("summary h3")?.textContent?.trim() === "戰鬥中的四種行動"
            );
            const hole = this.getHoleFromElements(detail ? [detail] : [], 8);
            return hole ? [hole] : [];
          },
          title: "戰鬥中的四種行動",
          text: "戰鬥中常用的有動作、附贈、移動和反應。先知道在回合中能做什麼，戰鬥會更順。",
          placement: "top",
          hideTooltipDuringTransition: true,
          skipAutoTabSwitch: true,
          beforePosition: async () => {
            if (this.tooltip) this.tooltip.style.display = "none";

            const actionHelpDetails = Array.from(
              document.querySelectorAll("#tab-actions details.action-collapsible-wrap")
            ).find((item) => item.querySelector("summary h3")?.textContent?.trim() === "戰鬥中的四種行動");
            if (actionHelpDetails) actionHelpDetails.open = true;

            const tabsHole = this.getHoleForSelector(".tabs-shell", 6);
            if (tabsHole && this.lastRenderedHoles?.length === 1) {
              await this.animatePrimaryHoleTransition(this.lastRenderedHoles[0], tabsHole, 420);
              this.lastRenderedHoles = [{ ...tabsHole }];
            }

            const actionsTabButton = document.querySelector(".tab-button[onclick*=\"'actions'\"]");
            await simulateButtonPress(actionsTabButton, () => {
              actionsTabButton?.click();
            });
            await waitForLayoutStability();

            if (actionHelpDetails) {
              const rect = actionHelpDetails.getBoundingClientRect();
              const targetY = window.scrollY + rect.top - 100;
              await animateWindowScrollTo(targetY, 720);
              await waitForLayoutStability();
            }

            const actionHole = this.getStepHoles(this.steps[this.currentIndex]);
            if (tabsHole) {
              this.applyMasksForHoles([tabsHole]);
              this.setFocusRing(this.focusRings[0], tabsHole);
              this.setFocusRing(this.focusRings[1], null);
            }
            if (tabsHole && actionHole.length) {
              await this.animatePrimaryHoleTransition(tabsHole, actionHole[0], 420);
            }
          }
        },
        {
          tab: "actions",
          selectors: [],
          getHoles: () => {
            const detail = Array.from(document.querySelectorAll("#tab-actions details.action-collapsible-wrap")).find(
              (item) => item.querySelector("summary h3")?.textContent?.trim() === "動作"
            );
            const hole = this.getHoleFromElements(detail ? [detail] : [], 8);
            return hole ? [hole] : [];
          },
          title: "動作",
          text: "這裡整理常見的主要動作。不確定要做什麼時，可以參考這裡。",
          placement: "top",
          hideTooltipDuringTransition: true,
          skipAutoTabSwitch: true,
          beforePosition: async () => {
            if (this.tooltip) this.tooltip.style.display = "none";

            const actionSummary = Array.from(document.querySelectorAll("#tab-actions summary h3")).find(
              (el) => el.textContent?.trim() === "動作"
            );
            const actionSummaryHole = this.getHoleFromElements(actionSummary ? [actionSummary] : [], 8);
            if (actionSummaryHole && this.lastRenderedHoles?.length === 1) {
              await this.animatePrimaryHoleTransition(this.lastRenderedHoles[0], actionSummaryHole, 420);
              this.lastRenderedHoles = [{ ...actionSummaryHole }];
            }

            const actionDetails = Array.from(document.querySelectorAll("#tab-actions details.action-collapsible-wrap")).find(
              (item) => item.querySelector("summary h3")?.textContent?.trim() === "動作"
            );
            if (actionDetails && !actionDetails.open) {
              const actionSummaryEl = actionDetails.querySelector("summary");
              await simulateButtonPress(actionSummaryEl, () => {
                actionSummaryEl?.click();
              });
              await waitForLayoutStability();
            }

            if (actionDetails) {
              const rect = actionDetails.getBoundingClientRect();
              const targetY = window.scrollY + rect.top - 100;
              await animateWindowScrollTo(targetY, 720);
              await waitForLayoutStability();
            }

            const actionDetailHole = this.getStepHoles(this.steps[this.currentIndex]);
            if (actionSummaryHole) {
              this.applyMasksForHoles([actionSummaryHole]);
              this.setFocusRing(this.focusRings[0], actionSummaryHole);
              this.setFocusRing(this.focusRings[1], null);
            }
            if (actionSummaryHole && actionDetailHole.length) {
              await this.animatePrimaryHoleTransition(actionSummaryHole, actionDetailHole[0], 420);
            }
          }
        },
        {
          tab: "actions",
          selectors: [],
          getHoles: () => {
            const attackBlock = document.querySelector(".action-attack-block");
            const attackTitle = Array.from(document.querySelectorAll("#tab-actions h3")).find(
              (el) => el.textContent?.trim() === "攻擊動作"
            );
            const populateButton = document.querySelector("button[onclick='populateHandAttacks()']");
            const mainName = document.getElementById("atk-main-name");
            const mainHit = document.getElementById("atk-main-hit");
            const mainDmg = document.getElementById("atk-main-dmg");
            const mainNote = document.getElementById("atk-main-note");
            const hole = this.getHoleFromElements(
              [attackBlock, attackTitle, populateButton, mainName, mainHit, mainDmg, mainNote].filter(Boolean),
              8
            );
            return hole ? [hole] : [];
          },
          title: "攻擊動作",
          text: "按下 獲取主副手 武器資料 按鈕，可顯示名稱、命中、傷害。",
          placement: "top",
          hideTooltipDuringTransition: true,
          skipAutoTabSwitch: true,
          beforePosition: async () => {
            const attackBlock = document.querySelector(".action-attack-block");
            if (attackBlock) {
              const rect = attackBlock.getBoundingClientRect();
              const targetY = window.scrollY + rect.top - 100;
              await animateWindowScrollTo(targetY, 720);
              await waitForLayoutStability();
            }
          }
        },
        {
          id: "step22-spells",
          tab: "spells",
          title: "最後是法術",
          text: "法術比較複雜一點，但操作上仍不困難，請自行探索，或詢問你的城主。",
          placement: "center",
          allowWithoutSpellcasting: true,
          beforePosition: async () => {
            await waitForLayoutStability();
          }
        },
        {
          id: "step23-finish",
          tab: "spells",
          title: "新手導覽結束",
          text: "祝福遊戲愉快！",
          placement: "center",
          noMask: true,
          allowWithoutSpellcasting: true,
          revealOnEnter: true,
          beforePosition: async () => {
            await waitForLayoutStability();
          }
        }
      ];
    }

    async start() {
      this.resetHighlightState();
      this.steps = this.getSteps();
      if (!this.steps.length) return;
      this.active = true;
      this.lockUserScroll();
      this.overlay.style.display = "block";
      await this.goTo(0);
    }

    isStepAvailable(step) {
      if (!step) return false;
      if (step.allowWithoutSpellcasting) return true;
      if (step.tab !== "spells") return true;
      const spellTabButton = document.getElementById("spells-tab-button");
      const spellTabVisible = isElementVisible(spellTabButton);
      const canCast = typeof hasSpellcastingCapability === "function" ? hasSpellcastingCapability() : true;
      return spellTabVisible && canCast;
    }

    async next() {
      if (!this.active) return;
      let nextIndex = this.currentIndex + 1;
      while (nextIndex < this.steps.length && !this.isStepAvailable(this.steps[nextIndex])) {
        nextIndex += 1;
      }
      if (nextIndex >= this.steps.length) return this.stop();
      await this.goTo(nextIndex);
    }

    async prev() {
      if (!this.active) return;
      let prevIndex = this.currentIndex - 1;
      while (prevIndex >= 0 && !this.isStepAvailable(this.steps[prevIndex])) {
        prevIndex -= 1;
      }
      if (prevIndex < 0) return;
      await this.goTo(prevIndex);
    }

    stop() {
      const currentStep = this.steps[this.currentIndex];
      if (currentStep && typeof currentStep.afterLeave === "function") currentStep.afterLeave();
      this.cleanupTransientState();
      this.resetHighlightState();
      this.active = false;
      this.isTransitioning = false;
      this.currentIndex = -1;
      this.overlay.style.display = "none";
      this.unlockUserScroll();
    }

    async goTo(index) {
      if (this.isTransitioning) return;
      this.isTransitioning = true;
      const prevStep = this.steps[this.currentIndex];
      if (prevStep && typeof prevStep.afterLeave === "function") prevStep.afterLeave();
      const nextStep = this.steps[index];
      const movingBackward = index < this.currentIndex;
      if (movingBackward) {
        const nextTitle = nextStep?.title || "";
        if (!["背景能力", "屬性加值", "種族能力", "屬性數值與調整值"].includes(nextTitle)) {
          this.restoreStep7State();
        }
        if (nextStep?.tab !== "skills") {
          this.restoreExpertiseOverride();
        }
        if (nextStep?.tab !== "equipment") {
          this.restoreWeaponMasteryOverride();
        }
      }
      this.currentIndex = index;
      const step = nextStep;
      const tabButton = document.querySelector(`.tab-button[onclick*="'${step.tab}'"]`);
      if (!step.skipAutoTabSwitch) {
        showTab(step.tab, tabButton || undefined);
        await waitForLayoutStability();
      }
      if (typeof step.beforePosition === "function") {
        await step.beforePosition();
        await waitForLayoutStability();
      }
      await this.renderStep();
      this.isTransitioning = false;
    }

    getStepElements(step) {
      if (typeof step.getElements === "function") return step.getElements().filter(Boolean);
      const elements = (step.selectors || [])
        .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
        .filter((el) => isElementVisible(el));
      if (!elements.length && step.fallbackSelector) {
        return Array.from(document.querySelectorAll(step.fallbackSelector)).filter((el) => isElementVisible(el));
      }
      return elements;
    }

    getStepHoles(step) {
      if (typeof step.getHoles === "function") {
        const holes = step.getHoles().filter(Boolean);
        if (holes.length) return holes.slice(0, 2);
      }
      const rect = getUnionRect(this.getStepElements(step));
      return rect ? [rect] : [];
    }

    getHoleForSelector(selector, padding = 8) {
      const elements = Array.from(document.querySelectorAll(selector)).filter((el) => isElementVisible(el));
      const rect = getUnionRect(elements);
      if (!rect) return null;
      return {
        left: Math.max(0, rect.left - padding),
        top: Math.max(0, rect.top - padding),
        right: Math.min(window.innerWidth, rect.right + padding),
        bottom: Math.min(window.innerHeight, rect.bottom + padding)
      };
    }

    getHoleFromElements(elements, padding = 8) {
      const rect = getUnionRect(elements.filter((el) => isElementVisible(el)));
      if (!rect) return null;
      return {
        left: Math.max(0, rect.left - padding),
        top: Math.max(0, rect.top - padding),
        right: Math.min(window.innerWidth, rect.right + padding),
        bottom: Math.min(window.innerHeight, rect.bottom + padding)
      };
    }

    hideMaskGroup(group) {
      Object.values(group).forEach((mask) => {
        if (!mask) return;
        mask.style.display = "none";
        mask.style.opacity = "";
        mask.style.left = "0px";
        mask.style.top = "0px";
        mask.style.width = "0px";
        mask.style.height = "0px";
      });
    }

    showFullOverlayMask() {
      const primaryGroup = this.maskGroups[0];
      if (!primaryGroup) return;
      this.hideMaskGroup(this.maskGroups[1]);
      if (primaryGroup.top) {
        primaryGroup.top.style.display = "block";
        primaryGroup.top.style.opacity = "1";
        primaryGroup.top.style.left = "0px";
        primaryGroup.top.style.top = "0px";
        primaryGroup.top.style.width = `${window.innerWidth}px`;
        primaryGroup.top.style.height = `${window.innerHeight}px`;
      }
      ["left", "right", "bottom"].forEach((key) => {
        const mask = primaryGroup[key];
        if (!mask) return;
        mask.style.left = "0px";
        mask.style.top = "0px";
        mask.style.width = "0px";
        mask.style.height = "0px";
      });
    }

    resetHighlightState() {
      this.maskGroups.forEach((group) => this.hideMaskGroup(group));
      this.focusRings.forEach((ring) => {
        if (!ring) return;
        ring.style.display = "none";
        ring.style.left = "0px";
        ring.style.top = "0px";
        ring.style.width = "0px";
        ring.style.height = "0px";
      });
      if (this.tooltip) {
        this.tooltip.style.display = "";
        this.tooltip.style.left = "0px";
        this.tooltip.style.top = "0px";
      }
    }

    animateOverlayFadeOut(durationMs = 700) {
      return new Promise((resolve) => {
        const masks = this.maskGroups.flatMap((group) => Object.values(group)).filter(Boolean);
        if (!masks.length) {
          resolve();
          return;
        }

        const start = performance.now();
        const step = (now) => {
          const elapsed = now - start;
          const t = Math.min(1, elapsed / durationMs);
          const eased = 1 - Math.pow(1 - t, 3);
          const opacity = `${1 - eased}`;

          masks.forEach((mask) => {
            if (mask.style.display !== "none") {
              mask.style.opacity = opacity;
            }
          });

          if (t < 1) {
            requestAnimationFrame(step);
            return;
          }

          this.maskGroups.forEach((group) => this.hideMaskGroup(group));
          resolve();
        };

        requestAnimationFrame(step);
      });
    }

    setFocusRing(ring, hole) {
      if (!ring) return;
      if (!hole) {
        ring.style.display = "none";
        ring.style.left = "0px";
        ring.style.top = "0px";
        ring.style.width = "0px";
        ring.style.height = "0px";
        return;
      }
      ring.style.display = "block";
      ring.style.left = `${hole.left}px`;
      ring.style.top = `${hole.top}px`;
      ring.style.width = `${Math.max(0, hole.right - hole.left)}px`;
      ring.style.height = `${Math.max(0, hole.bottom - hole.top)}px`;
    }

    animatePrimaryHoleTransition(fromHole, toHole, durationMs = 360) {
      return new Promise((resolve) => {
        if (!fromHole || !toHole) {
          resolve();
          return;
        }

        const start = performance.now();
        const step = (now) => {
          const elapsed = now - start;
          const t = Math.min(1, elapsed / durationMs);
          const eased = 1 - Math.pow(1 - t, 3);
          const currentHole = {
            left: fromHole.left + (toHole.left - fromHole.left) * eased,
            top: fromHole.top + (toHole.top - fromHole.top) * eased,
            right: fromHole.right + (toHole.right - fromHole.right) * eased,
            bottom: fromHole.bottom + (toHole.bottom - fromHole.bottom) * eased
          };

          this.applyMasksForHoles([currentHole]);
          this.setFocusRing(this.focusRings[0], currentHole);
          this.setFocusRing(this.focusRings[1], null);

          if (t < 1) {
            requestAnimationFrame(step);
            return;
          }
          resolve();
        };

        requestAnimationFrame(step);
      });
    }

    placeMaskGroup(group, hole, region = {}) {
      if (!group || !hole) return;
      const leftBound = Math.max(0, region.left ?? 0);
      const rightBound = Math.min(window.innerWidth, region.right ?? window.innerWidth);
      const topBound = Math.max(0, region.top ?? 0);
      const bottomBound = Math.min(window.innerHeight, region.bottom ?? window.innerHeight);
      const width = Math.max(0, rightBound - leftBound);
      const holeLeft = Math.max(leftBound, Math.min(rightBound, hole.left));
      const holeRight = Math.max(leftBound, Math.min(rightBound, hole.right));
      const holeTop = Math.max(topBound, Math.min(bottomBound, hole.top));
      const holeBottom = Math.max(topBound, Math.min(bottomBound, hole.bottom));

      this.setMaskRect(group.top, leftBound, topBound, width, Math.max(0, holeTop - topBound));
      this.setMaskRect(group.left, leftBound, holeTop, Math.max(0, holeLeft - leftBound), Math.max(0, holeBottom - holeTop));
      this.setMaskRect(group.right, holeRight, holeTop, Math.max(0, rightBound - holeRight), Math.max(0, holeBottom - holeTop));
      this.setMaskRect(group.bottom, leftBound, holeBottom, width, Math.max(0, bottomBound - holeBottom));
    }

    setMaskRect(mask, left, top, width, height) {
      if (!mask) return;
      if (width <= 0 || height <= 0) {
        mask.style.display = "none";
        mask.style.opacity = "";
        mask.style.left = "0px";
        mask.style.top = "0px";
        mask.style.width = "0px";
        mask.style.height = "0px";
        return;
      }
      mask.style.cssText = `display:block;left:${left}px;top:${top}px;width:${width}px;height:${height}px;`;
      mask.style.opacity = "1";
    }

    applyMasksForHoles(holes) {
      if (holes.length >= 2) {
        const pair = holes.slice(0, 2);
        const [first, second] = pair;
        const overlapX = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left));
        const minHoleWidth = Math.max(1, Math.min(first.right - first.left, second.right - second.left));
        const mostlyVerticalStack = overlapX / minHoleWidth > 0.6;

        if (mostlyVerticalStack) {
          const sorted = pair.sort((a, b) => a.top - b.top);
          const splitY = Math.max(
            0,
            Math.min(window.innerHeight, Math.floor((sorted[0].bottom + sorted[1].top) / 2))
          );
          this.placeMaskGroup(this.maskGroups[0], sorted[0], {
            left: 0,
            right: window.innerWidth,
            top: 0,
            bottom: splitY
          });
          this.placeMaskGroup(this.maskGroups[1], sorted[1], {
            left: 0,
            right: window.innerWidth,
            top: splitY,
            bottom: window.innerHeight
          });
          return sorted;
        }

        const sorted = pair.sort((a, b) => a.left - b.left);
        const splitX = Math.max(
          0,
          Math.min(window.innerWidth, Math.floor((sorted[0].right + sorted[1].left) / 2))
        );
        this.placeMaskGroup(this.maskGroups[0], sorted[0], {
          left: 0,
          right: splitX,
          top: 0,
          bottom: window.innerHeight
        });
        this.placeMaskGroup(this.maskGroups[1], sorted[1], {
          left: splitX,
          right: window.innerWidth,
          top: 0,
          bottom: window.innerHeight
        });
        return sorted;
      }

      if (holes.length === 1) {
        this.placeMaskGroup(this.maskGroups[0], holes[0], {
          left: 0,
          right: window.innerWidth,
          top: 0,
          bottom: window.innerHeight
        });
        this.hideMaskGroup(this.maskGroups[1]);
        return holes;
      }

      this.hideMaskGroup(this.maskGroups[0]);
      this.hideMaskGroup(this.maskGroups[1]);
      return [];
    }

    async renderStep() {
      if (!this.active) return;
      this.resetHighlightState();
      const step = this.steps[this.currentIndex];
      if (!step) return;
      if (step.noMask) {
        if (step.revealOnEnter) {
          this.showFullOverlayMask();
        }
        this.title.textContent = step.title;
        this.text.textContent = step.text;
        this.prevBtn.disabled = this.currentIndex <= 0;
        this.nextBtn.textContent = this.currentIndex === this.steps.length - 1 ? "完成" : "下一步";
        this.positionTooltipWithoutHighlight(step.placement || "center");
        if (step.revealOnEnter) {
          await this.animateOverlayFadeOut();
        }
        this.lastRenderedHoles = [];
        return;
      }
      const holes = this.getStepHoles(step);
      if (!holes.length) {
        this.showFullOverlayMask();
      this.title.textContent = step.title;
      this.text.textContent = step.text;
      this.prevBtn.disabled = this.currentIndex <= 0;
      this.nextBtn.textContent = this.currentIndex === this.steps.length - 1 ? "完成" : "下一步";
      this.positionTooltipWithoutHighlight(step.placement || "center");
      this.lastRenderedHoles = [];
      return;
      }
      if (step.hideTooltipDuringTransition && this.tooltip) {
        this.tooltip.style.display = "none";
      }
      if (step.animatePrimaryHole && holes.length === 1 && this.lastRenderedHoles?.length === 1) {
        await this.animatePrimaryHoleTransition(this.lastRenderedHoles[0], holes[0]);
      }
      const visibleHoles = this.applyMasksForHoles(holes);
      const primaryHole = visibleHoles[0];
      if (!primaryHole) return;

      this.focusRings.forEach((ring, idx) => this.setFocusRing(ring, visibleHoles[idx]));

      this.title.textContent = step.title;
      this.text.textContent = step.text;
      this.prevBtn.disabled = this.currentIndex <= 0;
      this.nextBtn.textContent = this.currentIndex === this.steps.length - 1 ? "完成" : "下一步";
      if (this.tooltip) this.tooltip.style.display = "";
      this.positionTooltip(primaryHole, step.placement || "bottom");
      this.lastRenderedHoles = visibleHoles.map((hole) => ({ ...hole }));
    }

    positionTooltipWithoutHighlight(placement = "center") {
      const margin = 10;
      const tooltipWidth = Math.min(252, window.innerWidth - margin * 2);
      const tooltipHeight = this.tooltip.offsetHeight || 160;
      this.tooltip.style.width = `${tooltipWidth}px`;
      this.tooltip.style.left = `${Math.max(margin, Math.floor((window.innerWidth - tooltipWidth) / 2))}px`;

      if (placement === "center") {
        const centeredTop = Math.max(margin, Math.floor((window.innerHeight - tooltipHeight) / 2));
        this.tooltip.style.top = `${centeredTop}px`;
        return;
      }

      this.tooltip.style.top = `${margin}px`;
    }

    positionTooltip(hole, placement) {
      const margin = 10;
      const tooltipWidth = Math.min(360, window.innerWidth - margin * 2);
      this.tooltip.style.width = `${tooltipWidth}px`;
      this.tooltip.style.left = `${Math.min(
        window.innerWidth - tooltipWidth - margin,
        Math.max(margin, hole.left)
      )}px`;

      const tooltipHeight = this.tooltip.offsetHeight || 160;
      let top = placement === "top" ? hole.top - tooltipHeight - margin : hole.bottom + margin;
      if (top + tooltipHeight > window.innerHeight - margin) top = hole.top - tooltipHeight - margin;
      if (top < margin) top = Math.min(window.innerHeight - tooltipHeight - margin, hole.bottom + margin);
      this.tooltip.style.top = `${Math.max(margin, top)}px`;
    }

    handleResize() {
      if (!this.active) return;
      requestAnimationFrame(() => this.renderStep());
    }

    handleKeydown(event) {
      if (!this.active) return;
      if (event.key === "Escape") {
        this.stop();
        return;
      }
      const blockedKeys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Spacebar"];
      if (blockedKeys.includes(event.key)) {
        event.preventDefault();
      }
    }

    preventScrollEvent(event) {
      if (!this.active) return;
      event.preventDefault();
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
  }

  window.OnboardingTour = OnboardingTour;
})();

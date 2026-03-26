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

  function setActionHelpOpen(open) {
    document.querySelectorAll("#tab-actions details.action-collapsible-wrap").forEach((detail) => {
      const title = detail.querySelector("summary h3")?.textContent?.trim();
      if (title === "戰鬥中的四種行動" || title === "動作") detail.open = open;
    });
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

    init() {
      if (!this.overlay || !this.nextBtn || !this.skipBtn) return;
      this.nextBtn.addEventListener("click", () => this.next());
      this.skipBtn.addEventListener("click", () => this.stop());
      window.addEventListener("resize", this.handleResize);
      document.addEventListener("keydown", this.handleKeydown);
      document.getElementById("restart-onboarding-btn")?.addEventListener("click", () => this.start());
    }

    getSteps() {
      const spellTabButton = document.getElementById("spells-tab-button");
      const showSpells =
        isElementVisible(spellTabButton) &&
        (typeof hasSpellcastingCapability === "function" ? hasSpellcastingCapability() : true);
      const cantripSection = Array.from(document.querySelectorAll("#tab-spells .spell-level-section")).find(
        (sec) => sec.querySelector("summary h3")?.textContent?.trim() === "戲法"
      );

      const steps = [
        {
          tab: "basic",
          selectors: [],
          getElements: () => {
            const ids = ["class", "level", "background", "race"];
            return ids
              .map((id) => document.getElementById(id))
              .filter(Boolean)
              .map((el) => el.closest(".mini-stat-card, .form-grid-2col, .form-row") || el);
          },
          getHoles: () => {
            const ids = ["class", "level", "background", "race"];
            const controls = ids.map((id) => document.getElementById(id)).filter(Boolean);
            const rows = Array.from(
              new Set(controls.map((el) => el.closest(".form-grid-2col, .form-row")).filter(Boolean))
            );
            const baseRect = getUnionRect(rows.length ? rows : controls);
            if (!baseRect) return [];
            const narrow = window.innerWidth < 338;
            const padX = narrow ? 8 : 12;
            const padY = narrow ? 10 : 12;
            return [
              {
                left: Math.max(0, baseRect.left - padX),
                top: Math.max(0, baseRect.top - padY),
                right: Math.min(window.innerWidth, baseRect.right + padX),
                bottom: Math.min(window.innerHeight, baseRect.bottom + padY)
              }
            ];
          },
          title: "先選基本資料",
          text: "先選職業、等級、背景、種族。這些選項會影響後面的角色能力與內容。",
          placement: "bottom",
          beforePosition: async () => window.scrollTo({ top: 0, behavior: "auto" })
        },
        {
          tab: "basic",
          selectors: [],
          getElements: () => {
            const strAbility = document.getElementById("str")?.closest(".ability");
            const quickCard = document.getElementById("set-default-abilities")?.closest(".mini-stat-card");
            return [strAbility, quickCard].filter(Boolean);
          },
          getHoles: () => {
            const strAbility = document.getElementById("str")?.closest(".ability");
            const quickCard = document.getElementById("set-default-abilities")?.closest(".mini-stat-card");
            const pad = 8;
            return [strAbility, quickCard].filter(Boolean).map((el) => {
              const rect = el.getBoundingClientRect();
              return {
                left: Math.max(0, rect.left - pad),
                top: Math.max(0, rect.top - pad),
                right: Math.min(window.innerWidth, rect.right + pad),
                bottom: Math.min(window.innerHeight, rect.bottom + pad)
              };
            });
          },
          title: "接著填六大屬性",
          text: "你可以手動輸入六大屬性；如果是第一次使用，也可以先按「預設屬性」快速開始。",
          placement: "bottom",
          beforePosition: async () => {
            window.scrollTo({ top: 0, behavior: "auto" });
            await waitForLayoutStability();
            const quickCard = document.getElementById("set-default-abilities")?.closest(".mini-stat-card");
            if (!quickCard) return;
            const rect = quickCard.getBoundingClientRect();
            const targetY = window.scrollY + rect.top - 120;
            await animateWindowScrollTo(targetY, 620);
          }
        },
        {
          id: "step3-background",
          tab: "basic",
          selectors: [],
          getElements: () => {
            const target = document.querySelector("#background-ability-guide-target");
            const line = Array.from(document.querySelectorAll("#backgroundFeatures div")).find((el) =>
              el.textContent?.includes("★ 屬性可選擇：三項各 +1，或一項屬性 +2 另一項 +1。")
            );
            const nodes = [target, line].filter(Boolean);
            if (nodes.length) return nodes;
            const fallback = document.getElementById("backgroundFeatures");
            return fallback ? [fallback] : [];
          },
          title: "背景能力",
          text: "背景提供屬性加值和技能熟練，記得手動把屬性加上去，等下至技能頁勾選熟練。",
          placement: "top",
          beforePosition: async () => {
            const bgSelect = document.getElementById("background");
            if (bgSelect && !bgSelect.value) {
              this.stepRuntime.step3AutoBackground = true;
              this.setSelectValue("background", "acolyte");
              await waitForLayoutStability();
            } else {
              this.stepRuntime.step3AutoBackground = false;
            }
            const bgDetails = document.querySelector("#backgroundFeatures")?.closest("details");
            this.stepRuntime.step3AutoExpandedDetails = Boolean(bgDetails && !bgDetails.open);
            if (this.stepRuntime.step3AutoExpandedDetails && bgDetails) {
              bgDetails.open = true;
              await waitForLayoutStability();
            }
            const title = Array.from(document.querySelectorAll("#tab-basic summary h3")).find(
              (el) => el.textContent?.trim() === "背景能力"
            );
            const target = title || document.querySelector("#background-ability-guide-target");
            if (target) {
              const rect = target.getBoundingClientRect();
              const targetY = window.scrollY + rect.top - 120;
              await animateWindowScrollTo(targetY, 620);
            }
          },
          afterLeave: () => {
            if (this.stepRuntime.step3AutoExpandedDetails) {
              const bgDetails = document.querySelector("#backgroundFeatures")?.closest("details");
              if (bgDetails) bgDetails.open = false;
            }
            if (this.stepRuntime.step3AutoBackground) {
              this.setSelectValue("background", "");
            }
            delete this.stepRuntime.step3AutoExpandedDetails;
            delete this.stepRuntime.step3AutoBackground;
          }
        },
        {
          id: "step4-skills",
          tab: "skills",
          selectors: [],
          getHoles: () => {
            const saveBtn = document.querySelector("button[onclick='fillSaves()']");
            const skillBtn = document.querySelector("button[onclick='fillSkills()']");
            const pad = 8;
            return [saveBtn, skillBtn].filter(Boolean).map((el) => {
              const rect = el.getBoundingClientRect();
              return {
                left: Math.max(0, rect.left - pad),
                top: Math.max(0, rect.top - pad),
                right: Math.min(window.innerWidth, rect.right + pad),
                bottom: Math.min(window.innerHeight, rect.bottom + pad)
              };
            });
          },
          title: "屬性豁免 與 技能",
          text: "先打勾選技能，再按下自動計算按鈕。",
          placement: "bottom",
          beforePosition: async () => window.scrollTo({ top: 0, behavior: "auto" })
        },
        {
          id: "step5-equipment",
          tab: "equipment",
          selectors: [],
          getElements: () => {
            const main = document.getElementById("mainHand");
            const off = document.getElementById("offHand");
            const armor = document.getElementById("armor");
            return [main, off, armor].map((el) => el?.closest(".form-row") || el).filter(Boolean);
          },
          title: "選擇武器與護甲",
          text: "先選主手、副手與護甲，系統才知道你的防禦與攻擊資料。",
          placement: "bottom",
          beforePosition: async () => window.scrollTo({ top: 0, behavior: "auto" })
        },
        {
          id: "step6-actions-overview",
          tab: "actions",
          selectors: [],
          getElements: () => {
            const details = Array.from(document.querySelectorAll("#tab-actions details.action-collapsible-wrap"));
            return details.map((detail) => detail.querySelector("summary")).filter(Boolean);
          },
          title: "進入戰鬥看這邊",
          text: "點開可查看，再次點擊可以收起。",
          placement: "bottom",
          beforePosition: async () => {
            setActionHelpOpen(false);
            await waitForLayoutStability();
            window.scrollTo({ top: 0, behavior: "auto" });
          }
        },
        {
          id: "step7-populate-attacks",
          tab: "actions",
          selectors: [],
          getElements: () => {
            const btn = document.querySelector("button[onclick='populateHandAttacks()']");
            const mainRow = document.querySelector("#atk-main-name")?.closest(".form-row.small-text");
            return [btn, mainRow].filter(Boolean);
          },
          title: "產生攻擊資料",
          text: "按下這個按鈕，會把你在裝備頁選的主副手資料自動帶進來，方便你在戰鬥中查看。",
          placement: "bottom",
          beforePosition: async () => {
            const classEl = document.getElementById("class");
            this.stepRuntime.step7PrevClass = classEl?.value || "";
            if (classEl) this.setSelectValue("class", "cleric");
            await waitForLayoutStability();
            const btn = document.querySelector("button[onclick='populateHandAttacks()']");
            if (btn) {
              const rect = btn.getBoundingClientRect();
              await animateWindowScrollTo(window.scrollY + rect.top - 120, 620);
            }
          },
          afterLeave: () => {
            if (typeof this.stepRuntime.step7PrevClass === "string") {
              this.setSelectValue("class", this.stepRuntime.step7PrevClass);
            }
            delete this.stepRuntime.step7PrevClass;
          }
        }
      ];

      if (showSpells) {
        steps.push(
          {
            tab: "spells",
            selectors: ["#spell-toolbar-actions", "#spell-casting-stats-wrap"],
            title: "法術頁",
            text: "如果你的角色會魔法，這裡可以設定施法屬性。法術設定太多的話，可使用上方的搜索工具列。",
            placement: "bottom",
            beforePosition: async () => window.scrollTo({ top: 0, behavior: "auto" })
          },
          {
            id: "step9-cantrips",
            tab: "spells",
            selectors: [],
            getElements: () => {
              const area = document.getElementById("cantrips-area");
              return area ? [area] : [];
            },
            title: "選擇法術",
            text: "先選擇職業，再選擇法術，戲法可以無限使用，環位法術使用次數有限制。",
            placement: "bottom",
            beforePosition: async () => {
              const cantripArea = document.getElementById("cantrips-area");
              if (!cantripArea) return;
              const rows = Array.from(cantripArea.querySelectorAll(".spell-entry"));
              this.stepRuntime.step9PrevClass = document.getElementById("class")?.value || "";
              this.stepRuntime.step9CantripRows = rows.map((row) => ({
                classValue: row.querySelector("select[id*='-class-']")?.value || "",
                spellValue: row.querySelector("select[id*='-spell-']")?.value || ""
              }));
              this.setSpellRowCount("cantrips-area", "cantrips", 1);
              this.setSelectValue("class", "");
              const firstClassSel = document.querySelector("#cantrips-area select[id*='-class-']");
              if (firstClassSel) {
                firstClassSel.value = "";
                firstClassSel.dispatchEvent(new Event("change", { bubbles: true }));
              }
              const firstSpellSel = document.querySelector("#cantrips-area select[id*='-spell-']");
              if (firstSpellSel) firstSpellSel.value = "";
              updatePickedSpellBoxes();
              window.scrollTo({ top: 0, behavior: "auto" });
              await waitForLayoutStability();
              const summary = cantripSection?.querySelector("summary h3");
              if (summary) {
                const rect = summary.getBoundingClientRect();
                await animateWindowScrollTo(window.scrollY + rect.top - 280, 620);
              }
            },
            afterLeave: () => {
              if (typeof this.stepRuntime.step9PrevClass === "string") {
                this.setSelectValue("class", this.stepRuntime.step9PrevClass);
              }
              const prevRows = Array.isArray(this.stepRuntime.step9CantripRows)
                ? this.stepRuntime.step9CantripRows
                : [];
              if (prevRows.length) {
                this.setSpellRowCount("cantrips-area", "cantrips", prevRows.length);
                const rows = Array.from(document.querySelectorAll("#cantrips-area .spell-entry"));
                rows.forEach((row, idx) => {
                  const snap = prevRows[idx];
                  if (!snap) return;
                  const classSel = row.querySelector("select[id*='-class-']");
                  const spellSel = row.querySelector("select[id*='-spell-']");
                  if (classSel) {
                    classSel.value = snap.classValue || "";
                    classSel.dispatchEvent(new Event("change", { bubbles: true }));
                  }
                  if (spellSel) {
                    spellSel.value = snap.spellValue || "";
                    spellSel.dispatchEvent(new Event("change", { bubbles: true }));
                  }
                });
                updatePickedSpellBoxes();
              }
              delete this.stepRuntime.step9PrevClass;
              delete this.stepRuntime.step9CantripRows;
            }
          }
        );
      }

      return steps;
    }

    async start() {
      this.steps = this.getSteps();
      if (!this.steps.length) return;
      this.active = true;
      this.lockUserScroll();
      this.overlay.style.display = "block";
      await this.goTo(0);
    }

    isStepAvailable(step) {
      if (!step) return false;
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

    stop() {
      const currentStep = this.steps[this.currentIndex];
      if (currentStep && typeof currentStep.afterLeave === "function") currentStep.afterLeave();
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
      this.currentIndex = index;
      const step = this.steps[index];
      const tabButton = document.querySelector(`.tab-button[onclick*="'${step.tab}'"]`);
      showTab(step.tab, tabButton || undefined);
      await waitForLayoutStability();
      if (typeof step.beforePosition === "function") {
        await step.beforePosition();
        await waitForLayoutStability();
      }
      this.renderStep();
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

    hideMaskGroup(group) {
      Object.values(group).forEach((mask) => {
        if (!mask) return;
        mask.style.width = "0px";
        mask.style.height = "0px";
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

      group.top.style.cssText = `left:${leftBound}px;top:${topBound}px;width:${width}px;height:${Math.max(0, holeTop - topBound)}px;`;
      group.left.style.cssText = `left:${leftBound}px;top:${holeTop}px;width:${Math.max(0, holeLeft - leftBound)}px;height:${Math.max(0, holeBottom - holeTop)}px;`;
      group.right.style.cssText = `left:${holeRight}px;top:${holeTop}px;width:${Math.max(0, rightBound - holeRight)}px;height:${Math.max(0, holeBottom - holeTop)}px;`;
      group.bottom.style.cssText = `left:${leftBound}px;top:${holeBottom}px;width:${width}px;height:${Math.max(0, bottomBound - holeBottom)}px;`;
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

    renderStep() {
      if (!this.active) return;
      const step = this.steps[this.currentIndex];
      const holes = this.getStepHoles(step);
      if (!holes.length) return;
      const visibleHoles = this.applyMasksForHoles(holes);
      const primaryHole = visibleHoles[0];
      if (!primaryHole) return;

      this.focusRings.forEach((ring, idx) => {
        const hole = visibleHoles[idx];
        if (!ring) return;
        if (!hole) {
          ring.style.display = "none";
          ring.style.width = "0px";
          ring.style.height = "0px";
          return;
        }
        ring.style.display = "block";
        ring.style.left = `${hole.left}px`;
        ring.style.top = `${hole.top}px`;
        ring.style.width = `${Math.max(0, hole.right - hole.left)}px`;
        ring.style.height = `${Math.max(0, hole.bottom - hole.top)}px`;
      });

      this.title.textContent = step.title;
      this.text.textContent = step.text;
      this.nextBtn.textContent = this.currentIndex === this.steps.length - 1 ? "完成" : "下一步";
      this.positionTooltip(primaryHole, step.placement || "bottom");
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

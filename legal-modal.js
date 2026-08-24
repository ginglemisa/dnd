(function() {
  "use strict";

  function initLegalModal() {
    const isShareMode = !!window.SHARE_MODE;
    const LEGACY_LEGAL_DISMISS_KEY = "dndchar_legal_dismiss_v2";
    const AUTO_SAVE_KEY = "dndchar_autosave_v1";
    const modal = document.getElementById("legal-modal");
    const checkbox = document.getElementById("legal-dismiss");
    const closeBtn = document.getElementById("legal-close-btn");
    const ackBtn = document.getElementById("legal-ack-btn");
    const onboardingBtn = document.getElementById("legal-onboarding-btn");
    const aboutModal = document.getElementById("legal-about-modal");
    const aboutCloseBtn = aboutModal?.querySelector(".legal-about-close");
    const aboutFrame = aboutModal?.querySelector(".legal-about-frame");
    const storage = window.dndStorage || {
      getItem(key) { try { return localStorage.getItem(key); } catch (_error) { return null; } },
      removeItem(key) { try { localStorage.removeItem(key); return true; } catch (_error) { return false; } }
    };
    if (!modal || !checkbox) return;

    let aboutTrigger = null;
    const closeAboutModal = () => {
      if (!aboutModal) return;
      aboutModal.setAttribute("aria-hidden", "true");
      aboutModal.setAttribute("inert", "");
      aboutTrigger?.focus();
    };
    const openAboutModal = (trigger) => {
      if (!aboutModal) return;
      aboutTrigger = trigger;
      modal.style.display = "none";
      aboutModal.removeAttribute("inert");
      aboutModal.setAttribute("aria-hidden", "false");
      const fragment = trigger.getAttribute("href") === "#character-sheet-download"
        ? "#character-sheet-download"
        : "";
      if (aboutFrame) aboutFrame.src = `about.html?embed=1${fragment}`;
      aboutCloseBtn?.focus();
    };

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest?.(".legal-about-trigger");
      if (trigger) {
        event.preventDefault();
        openAboutModal(trigger);
      } else if (event.target === aboutModal || event.target === aboutCloseBtn) {
        closeAboutModal();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && aboutModal?.getAttribute("aria-hidden") === "false") {
        closeAboutModal();
      }
    });

    let shouldDismiss = checkbox.checked === true;
    try {
      if (!shouldDismiss) {
        const raw = storage.getItem(AUTO_SAVE_KEY);
        if (!raw) throw new Error("no autosave data");
        const data = JSON.parse(raw);
        shouldDismiss =
          data["legal-dismiss"] === true ||
          data["legal-dismiss"] === "true" ||
          data["legal-dismiss"] === 1;
      }
    } catch (error) {
      void error;
    }

    if (!shouldDismiss && storage.getItem(LEGACY_LEGAL_DISMISS_KEY) === "1") {
      shouldDismiss = true;
      checkbox.checked = true;
      if (typeof scheduleSaveAllFields === "function") scheduleSaveAllFields();
    }

    storage.removeItem(LEGACY_LEGAL_DISMISS_KEY);
    checkbox.checked = shouldDismiss;
    checkbox.addEventListener("change", () => {
      if (typeof scheduleSaveAllFields === "function") scheduleSaveAllFields();
    });

    if (!isShareMode && shouldDismiss) return;

    modal.style.display = "block";
    const closeModal = () => {
      modal.style.display = "none";
    };

    closeBtn?.addEventListener("click", closeModal);
    ackBtn?.addEventListener("click", closeModal);
    onboardingBtn?.addEventListener("click", () => {
      closeModal();
      Promise.resolve(window.onboardingTour?.start?.()).catch((error) => {
        console.error("無法啟動新手導覽：", error);
      });
    });
  }

  window.initLegalModal = initLegalModal;
})();

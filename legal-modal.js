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
    const startTourBtn = document.getElementById("legal-start-tour-btn");
    if (!modal || !checkbox) return;

    let shouldDismiss = checkbox.checked === true;
    try {
      if (!shouldDismiss) {
        const raw = localStorage.getItem(AUTO_SAVE_KEY);
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

    if (!shouldDismiss && localStorage.getItem(LEGACY_LEGAL_DISMISS_KEY) === "1") {
      shouldDismiss = true;
      checkbox.checked = true;
      if (typeof scheduleSaveAllFields === "function") scheduleSaveAllFields();
    }

    localStorage.removeItem(LEGACY_LEGAL_DISMISS_KEY);
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
    startTourBtn?.addEventListener("click", () => {
      closeModal();
      window.onboardingTour?.start();
    });
  }

  window.initLegalModal = initLegalModal;
})();

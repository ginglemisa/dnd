(function() {
  "use strict";

  function initLegalModal() {
    const isShareMode = !!window.SHARE_MODE;
    const LEGAL_DISMISS_KEY = "dndchar_legal_dismiss_v1";
    const modal = document.getElementById("legal-modal");
    const checkbox = document.getElementById("legal-dismiss");
    const closeBtn = document.getElementById("legal-close-btn");
    const ackBtn = document.getElementById("legal-ack-btn");
    const startTourBtn = document.getElementById("legal-start-tour-btn");
    if (!modal || !checkbox) return;

    let shouldDismiss = localStorage.getItem(LEGAL_DISMISS_KEY) === "1";
    try {
      if (!shouldDismiss) {
        const raw = localStorage.getItem("dndchar_autosave_v1");
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

    checkbox.checked = shouldDismiss;
    checkbox.addEventListener("change", () => {
      localStorage.setItem(LEGAL_DISMISS_KEY, checkbox.checked ? "1" : "0");
      if (typeof saveAllFields === "function") saveAllFields();
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

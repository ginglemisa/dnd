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
    const quickBuildBtn = document.getElementById("legal-onboarding-btn");
    const storage = window.dndStorage || {
      getItem(key) { try { return localStorage.getItem(key); } catch (_error) { return null; } },
      removeItem(key) { try { localStorage.removeItem(key); return true; } catch (_error) { return false; } }
    };
    if (!modal || !checkbox) return;

    if (isShareMode) {
      modal.classList.add("is-share-mode");
      modal.querySelector(".legal-modal-title").textContent = "你正在查看分享的角色卡";
      modal.querySelector(".legal-share-copy").hidden = false;
      ackBtn.textContent = "開始查看";
      ackBtn.setAttribute("aria-label", "開始查看");
    }

    let aboutLoader = null;
    let aboutBody = null;
    const isAboutHash = () => ["#legal-about-modal", "#character-sheet-download"].includes(location.hash);
    const ensureAboutReady = () => {
      if (window.LegalAbout) return Promise.resolve();
      if (aboutLoader) return aboutLoader;
      aboutLoader = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        let timer;
        const finish = (error) => {
          clearTimeout(timer);
          script.onload = script.onerror = null;
          if (error) { script.remove(); reject(error); }
          else resolve();
        };
        script.src = "legal-about.js?v=20260923-legal-about";
        script.onload = () => finish(window.LegalAbout ? null : new Error("About module unavailable"));
        script.onerror = () => finish(new Error("About module failed to load"));
        timer = setTimeout(() => finish(new Error("About module timed out")), 15000);
        document.head.appendChild(script);
      }).catch((error) => { aboutLoader = null; throw error; });
      return aboutLoader;
    };
    const loadAbout = async (body, fragment) => {
      body.setAttribute("aria-busy", "true");
      body.innerHTML = '<p role="status">正在載入說明…</p>';
      try {
        await ensureAboutReady();
        if (body.isConnected) window.LegalAbout.render(body, fragment);
      } catch (_error) {
        if (!body.isConnected) return;
        body.innerHTML = '<p role="alert">無法載入說明，請檢查連線後重試。</p>';
        const retry = document.createElement("button");
        retry.type = "button";
        retry.textContent = "重新載入";
        retry.addEventListener("click", () => {
          body.closest(".app-dialog").querySelector(".app-dialog__close").focus();
          void loadAbout(body, fragment);
        });
        body.appendChild(retry);
      } finally {
        body.removeAttribute("aria-busy");
      }
    };
    const openAboutModal = (trigger, fragment = "") => {
      if (aboutBody?.isConnected) return;
      modal.style.display = "none";
      const returnTarget = trigger?.offsetParent ? trigger : document.getElementById("utility-menu-toggle");
      const openedHash = isAboutHash() ? location.hash : "";
      const closed = window.AppDialog.showContent({
        title: "關於與授權",
        variant: "legal-about",
        confirmLabel: "回到角卡",
        trigger: returnTarget,
        renderContent(body) { aboutBody = body; }
      });
      const root = aboutBody.closest(".app-dialog");
      root.id = "legal-about-modal";
      root.querySelector(".app-dialog__close").focus();
      void loadAbout(aboutBody, fragment);
      closed.then(() => {
        aboutBody = null;
        if (openedHash && location.hash === openedHash) {
          history.replaceState(history.state, "", location.pathname + location.search);
        }
      });
    };
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest?.(".legal-about-trigger");
      if (!trigger) return;
      event.preventDefault();
      openAboutModal(trigger, trigger.getAttribute("href"));
    });
    window.addEventListener("hashchange", () => {
      if (isAboutHash()) openAboutModal(null, location.hash);
      else aboutBody?.closest(".app-dialog")?.querySelector(".app-dialog__close").click();
    });

    let shouldDismiss = checkbox.checked === true;
    if (!isShareMode) {
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
    }

    if (isAboutHash()) {
      openAboutModal(null, location.hash);
      return;
    }
    if (!isShareMode && shouldDismiss) return;

    modal.style.display = "block";
    const closeModal = () => {
      modal.style.display = "none";
      // Give the wizard a visible return target after the welcome dialog closes.
      document.getElementById("utility-menu-toggle")?.focus();
    };

    closeBtn?.addEventListener("click", closeModal);
    ackBtn?.addEventListener("click", closeModal);
    quickBuildBtn?.addEventListener("click", () => {
      closeModal();
      Promise.resolve(window.quickBuild?.open?.()).catch((error) => {
        console.error("無法啟動創角小幫手：", error);
      });
    });
  }

  window.initLegalModal = initLegalModal;
})();

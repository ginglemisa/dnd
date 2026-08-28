(function attachAppDialog(globalScope) {
  let activeDialog = null;
  let toastTimer = null;

  function getFocusableElements(root) {
    return Array.from(root.querySelectorAll(
      "button:not(:disabled), textarea:not(:disabled), input:not(:disabled), select:not(:disabled), [href], [tabindex]:not([tabindex='-1'])"
    )).filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true");
  }

  function setBackgroundInert(dialogRoot, inert) {
    if (inert) {
      const states = new Map();
      document.querySelectorAll("body > *").forEach((element) => {
        if (!(element instanceof HTMLElement) || element === dialogRoot) return;
        states.set(element, element.inert);
        element.inert = true;
      });
      return states;
    }
    return new Map();
  }

  function restoreBackground(states) {
    states?.forEach((wasInert, element) => {
      if (element.isConnected) element.inert = wasInert;
    });
  }

  function ensureToast() {
    let toast = document.getElementById("app-toast");
    if (toast) return toast;
    toast = document.createElement("div");
    toast.id = "app-toast";
    toast.className = "app-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.setAttribute("aria-atomic", "true");
    toast.hidden = true;
    document.body.appendChild(toast);
    return toast;
  }

  function notify(message, options = {}) {
    if (typeof document === "undefined") return;
    const toast = ensureToast();
    const normalizedMessage = String(message || "").trim();
    if (!normalizedMessage) return;
    window.clearTimeout(toastTimer);
    toast.dataset.tone = options.tone || "info";
    toast.dataset.variant = options.variant || "default";
    toast.textContent = "";
    window.requestAnimationFrame(() => {
      toast.textContent = normalizedMessage;
    });
    toast.hidden = false;
    toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, Number(options.duration) > 0 ? Number(options.duration) : 5200);
  }

  function open(options = {}) {
    if (typeof document === "undefined") return Promise.resolve(false);
    if (activeDialog) activeDialog.close(false, false);

    const opener = options.trigger instanceof HTMLElement ? options.trigger : document.activeElement;
    const root = document.createElement("div");
    root.className = "app-dialog";
    root.setAttribute("aria-hidden", "false");

    const surface = document.createElement("section");
    surface.className = "app-dialog__surface";
    surface.setAttribute("role", options.role === "alertdialog" ? "alertdialog" : "dialog");
    surface.setAttribute("aria-modal", "true");

    const titleId = `app-dialog-title-${Date.now()}`;
    const descriptionId = `app-dialog-description-${Date.now()}`;
    surface.setAttribute("aria-labelledby", titleId);

    const header = document.createElement("header");
    header.className = "app-dialog__header";
    const title = document.createElement("h2");
    title.id = titleId;
    title.textContent = String(options.title || "訊息");
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "app-dialog__close";
    closeButton.setAttribute("aria-label", "關閉訊息");
    closeButton.textContent = "×";
    header.append(title, closeButton);

    const body = document.createElement("div");
    body.className = "app-dialog__body";
    const description = document.createElement("p");
    description.id = descriptionId;
    const message = String(options.message || "").trim();
    if (message) {
      description.textContent = message;
      body.appendChild(description);
      surface.setAttribute("aria-describedby", descriptionId);
    }

    if (options.content instanceof Node) {
      body.appendChild(options.content);
    } else if (typeof options.renderContent === "function") {
      options.renderContent(body);
    }

    let copyArea = null;
    if (typeof options.copyValue === "string") {
      const copyLabel = document.createElement("label");
      copyLabel.className = "app-dialog__copy-label";
      copyLabel.textContent = "分享網址";
      copyArea = document.createElement("textarea");
      copyArea.className = "app-dialog__copy-value";
      copyArea.readOnly = true;
      copyArea.rows = 5;
      copyArea.value = options.copyValue;
      copyArea.dataset.stateTransient = "true";
      copyLabel.appendChild(copyArea);
      body.appendChild(copyLabel);
    }

    const actions = document.createElement("div");
    actions.className = "app-dialog__actions";
    const cancelButton = options.cancelLabel ? document.createElement("button") : null;
    if (cancelButton) {
      cancelButton.type = "button";
      cancelButton.className = "app-dialog__button app-dialog__button--secondary";
      cancelButton.textContent = String(options.cancelLabel);
      actions.appendChild(cancelButton);
    }

    if (copyArea) {
      const selectButton = document.createElement("button");
      selectButton.type = "button";
      selectButton.className = "app-dialog__button app-dialog__button--secondary";
      selectButton.textContent = "選取網址";
      selectButton.addEventListener("click", () => {
        copyArea.focus();
        copyArea.select();
      });
      actions.appendChild(selectButton);
    }

    const customActions = Array.isArray(options.actions) ? options.actions : null;
    const actionButtons = [];
    let confirmButton = null;

    if (customActions?.length) {
      customActions.forEach((action, index) => {
        const button = document.createElement("button");
        button.type = "button";
        const intent = action?.intent === "danger"
          ? "danger"
          : action?.intent === "primary"
            ? "primary"
            : "secondary";
        button.className = `app-dialog__button app-dialog__button--${intent}`;
        button.textContent = String(action?.label || "關閉");
        button.dataset.dialogActionIndex = String(index);
        actions.appendChild(button);
        actionButtons.push(button);
      });
    } else {
      confirmButton = document.createElement("button");
      confirmButton.type = "button";
      confirmButton.className = `app-dialog__button app-dialog__button--${options.intent === "danger" ? "danger" : "primary"}`;
      confirmButton.textContent = String(options.confirmLabel || "知道了");
      actions.appendChild(confirmButton);
    }

    surface.append(header, body, actions);
    root.appendChild(surface);
    document.body.appendChild(root);
    const backgroundStates = setBackgroundInert(root, true);
    document.documentElement.classList.add("app-dialog-open");

    return new Promise((resolve) => {
      const close = (result, restoreFocus = true) => {
        if (!root.isConnected) return;
        document.removeEventListener("keydown", onKeyDown, true);
        restoreBackground(backgroundStates);
        root.remove();
        document.documentElement.classList.remove("app-dialog-open");
        activeDialog = null;
        if (restoreFocus && opener instanceof HTMLElement && opener.isConnected && !opener.closest("[inert]")) {
          opener.focus();
        }
        resolve(result);
      };

      const onKeyDown = (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          close(false);
          return;
        }
        if (event.key !== "Tab") return;
        const focusable = getFocusableElements(surface);
        if (!focusable.length) {
          event.preventDefault();
          surface.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      };

      activeDialog = { close };
      closeButton.addEventListener("click", () => close(false));
      cancelButton?.addEventListener("click", () => close(false));
      confirmButton?.addEventListener("click", () => close(true));
      actionButtons.forEach((button, index) => {
        button.addEventListener("click", () => close(customActions[index]?.value ?? index));
      });
      root.addEventListener("click", (event) => {
        if (event.target === root && options.dismissOnBackdrop !== false) close(false);
      });
      document.addEventListener("keydown", onKeyDown, true);
      const initialTarget = options.initialFocus === "primary"
        ? (actionButtons.find(button => button.classList.contains("app-dialog__button--primary")) || confirmButton)
        : (cancelButton || actionButtons[0] || copyArea || confirmButton);
      (initialTarget || surface).focus();
    });
  }

  Object.assign(globalScope, {
    AppDialog: Object.freeze({
      notify,
      showMessage(options) {
        return open(options);
      },
      requestDecision(options) {
        return open({ ...options, role: "alertdialog" });
      },
      showCopy(options) {
        return open(options);
      },
      showContent(options) {
        return open(options);
      }
    })
  });
})(typeof window !== "undefined" ? window : globalThis);

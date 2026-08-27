(function initDiceRoller() {
  const DICE_SIDES = Object.freeze([100, 20, 12, 10, 8, 6, 4]);
  const STORAGE_KEY = "dnd.diceSystemEnabled.v1";
  const ROLL_ANIMATION_MS = 1800;
  const REDUCED_MOTION_ROLL_MS = 100;
  const LONG_PRESS_MS = 1200;
  const HISTORY_LIMIT = 20;

  const setup = () => {
    const toggle = document.getElementById("dice-system-toggle");
    const fab = document.getElementById("dice-roller-fab");
    const modal = document.getElementById("dice-roller-modal");
    const card = modal?.querySelector(".dice-roller-card");
    const closeButton = document.getElementById("dice-roller-close");
    const stage = document.getElementById("dice-roller-stage");
    const totalOutput = document.getElementById("dice-roller-total-value");
    const historyButton = document.getElementById("dice-roller-history-toggle");
    const rollButton = document.getElementById("dice-roller-roll");
    const clearButton = document.getElementById("dice-roller-clear");
    const dieButtons = Array.from(document.querySelectorAll(".dice-roller-die[data-die]"));

    if (!toggle || !fab || !modal || !card || !closeButton || !stage || !totalOutput || !historyButton || !rollButton || !clearButton || dieButtons.length !== DICE_SIDES.length) return;

    const counts = new Map(DICE_SIDES.map(sides => [sides, 0]));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let opener = null;
    let isOpen = false;
    let isRolling = false;
    let rollTimer = 0;
    let closeTimer = 0;
    let rollSequence = 0;
    let currentResults = [];
    let currentView = "results";
    const historyEntries = [];
    let backgroundInertStates = new Map();
    let previousBodyOverflow = "";
    let previousBodyPaddingRight = "";

    const formatNumber = value => new Intl.NumberFormat("zh-Hant").format(value);
    const getTotalDice = () => DICE_SIDES.reduce((sum, sides) => sum + counts.get(sides), 0);

    const updateHistoryButton = () => {
      const showingHistory = currentView === "history";
      const recordCount = historyEntries.length;
      const label = showingHistory
        ? "返回目前擲骰結果"
        : `顯示擲骰紀錄${recordCount ? `，共 ${recordCount} 筆` : ""}`;
      historyButton.textContent = showingHistory ? "紀錄" : "總和";
      historyButton.setAttribute("aria-pressed", String(showingHistory));
      historyButton.setAttribute("aria-label", label);
      historyButton.title = label;
      historyButton.disabled = isRolling;
    };

    const getFocusable = () => Array.from(card.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(element => !element.hidden && element.getClientRects().length > 0);

    const updateControls = () => {
      dieButtons.forEach(button => {
        const sides = Number.parseInt(button.dataset.die || "0", 10);
        const count = counts.get(sides) || 0;
        const countLabel = button.querySelector(".dice-roller-count");
        button.classList.toggle("has-count", count > 0);
        button.setAttribute("aria-pressed", String(count > 0));
        button.setAttribute("aria-label", `${sides} 面骰，已選 ${count} 顆。點擊增加，長按清空。`);
        button.disabled = isRolling;
        if (countLabel) countLabel.textContent = count > 0 ? `×${count}` : "";
      });
      rollButton.disabled = isRolling || getTotalDice() === 0;
      rollButton.setAttribute("aria-busy", String(isRolling));
      updateHistoryButton();
    };

    const renderEmptyStage = (message = "選取骰子後按 ROLL") => {
      currentResults = [];
      currentView = "results";
      stage.classList.remove("is-history");
      stage.tabIndex = -1;
      stage.removeAttribute("aria-busy");
      stage.removeAttribute("aria-label");
      stage.replaceChildren(Object.assign(document.createElement("span"), {
        className: "dice-roller-empty",
        textContent: message
      }));
      totalOutput.textContent = "—";
      updateHistoryButton();
    };

    const layoutResults = () => {
      const resultsGrid = stage.querySelector(".dice-roller-results");
      const resultNodes = Array.from(stage.querySelectorAll(".dice-roller-result"));
      const count = resultNodes.length;
      if (!resultsGrid || !count) return;

      const width = Math.max(stage.clientWidth, 1);
      const height = Math.max(stage.clientHeight, 1);
      let columns = 1;
      if (count === 2) columns = 2;
      else if (count > 2) columns = Math.min(count, Math.max(2, Math.ceil(Math.sqrt(count * (width / height)))));
      const rows = Math.ceil(count / columns);
      const maxDigits = Math.max(...currentResults.map(result => String(result.value).length), 1);
      const numberWidth = Math.max(1.18, maxDigits * 0.62);
      const fontSize = Math.max(22, Math.min(112, width / (columns * numberWidth), height / (rows * 1.28)));

      resultsGrid.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
      resultNodes.forEach(node => { node.style.fontSize = `${fontSize}px`; });
    };

    const renderResults = results => {
      currentResults = results;
      currentView = "results";
      stage.classList.remove("is-history");
      stage.tabIndex = -1;
      const total = results.reduce((sum, result) => sum + result.value, 0);
      const resultsGrid = document.createElement("div");
      resultsGrid.className = "dice-roller-results";
      resultsGrid.setAttribute("aria-hidden", "true");

      results.forEach((result, index) => {
        const number = document.createElement("span");
        number.className = "dice-roller-result";
        number.textContent = formatNumber(result.value);
        number.style.animationDelay = reduceMotion.matches ? "0ms" : `${Math.min(index * 35, 280)}ms`;
        resultsGrid.appendChild(number);
      });

      stage.removeAttribute("aria-busy");
      stage.setAttribute("aria-label", `擲骰結果：${results.map(result => result.value).join("、")}。總和 ${total}。`);
      stage.replaceChildren(resultsGrid);
      totalOutput.textContent = formatNumber(total);
      updateHistoryButton();
      window.requestAnimationFrame(layoutResults);
    };

    const renderHistory = () => {
      currentView = "history";
      stage.classList.add("is-history");
      stage.tabIndex = 0;
      stage.removeAttribute("aria-busy");

      if (!historyEntries.length) {
        stage.setAttribute("aria-label", "尚無擲骰紀錄");
        stage.replaceChildren(Object.assign(document.createElement("span"), {
          className: "dice-roller-empty",
          textContent: "尚無擲骰紀錄"
        }));
        updateHistoryButton();
        return;
      }

      const list = document.createElement("ol");
      list.className = "dice-roller-history";
      historyEntries.forEach(entry => {
        const item = document.createElement("li");
        item.className = "dice-roller-history-entry";
        item.textContent = entry;
        list.appendChild(item);
      });
      stage.setAttribute("aria-label", `擲骰紀錄，共 ${historyEntries.length} 筆，由新到舊排列。`);
      stage.replaceChildren(list);
      stage.scrollTop = 0;
      updateHistoryButton();
    };

    const showCurrentResult = () => {
      if (currentResults.length) renderResults(currentResults);
      else renderEmptyStage();
    };

    const recordRoll = (rollCounts, results) => {
      const diceExpression = DICE_SIDES
        .filter(sides => (rollCounts.get(sides) || 0) > 0)
        .map(sides => `${rollCounts.get(sides)}d${sides}`)
        .join("+");
      const total = results.reduce((sum, result) => sum + result.value, 0);
      historyEntries.unshift(`${diceExpression}=${total}`);
      if (historyEntries.length > HISTORY_LIMIT) historyEntries.length = HISTORY_LIMIT;
      updateHistoryButton();
    };

    const rollDie = sides => {
      if (window.crypto?.getRandomValues) {
        const values = new Uint32Array(1);
        const range = 0x100000000;
        const ceiling = range - (range % sides);
        do window.crypto.getRandomValues(values); while (values[0] >= ceiling);
        return (values[0] % sides) + 1;
      }
      return Math.floor(Math.random() * sides) + 1;
    };

    const cancelRoll = () => {
      window.clearTimeout(rollTimer);
      rollTimer = 0;
      isRolling = false;
      updateControls();
    };

    const clearAll = () => {
      cancelRoll();
      DICE_SIDES.forEach(sides => counts.set(sides, 0));
      updateControls();
      renderEmptyStage();
    };

    const clearDie = sides => {
      counts.set(sides, 0);
      updateControls();
    };

    const roll = () => {
      if (isRolling || getTotalDice() === 0) return;

      const rollCounts = new Map(DICE_SIDES.map(sides => [sides, counts.get(sides) || 0]));
      const results = DICE_SIDES.flatMap(sides => Array.from(
        { length: rollCounts.get(sides) || 0 },
        () => ({ sides, value: rollDie(sides) })
      ));

      isRolling = true;
      currentView = "results";
      stage.classList.remove("is-history");
      stage.tabIndex = -1;
      updateControls();
      stage.setAttribute("aria-busy", "true");
      stage.setAttribute("aria-label", "擲骰中");
      totalOutput.textContent = "—";

      if (reduceMotion.matches) {
        const message = document.createElement("span");
        message.className = "dice-roller-empty";
        message.textContent = "擲骰中…";
        stage.replaceChildren(message);
      } else {
        const animation = document.createElement("img");
        animation.className = "dice-roller-animation";
        animation.src = `dice.webp?roll=${++rollSequence}`;
        animation.alt = "";
        animation.setAttribute("aria-hidden", "true");
        stage.replaceChildren(animation);
      }

      rollTimer = window.setTimeout(() => {
        rollTimer = 0;
        isRolling = false;
        updateControls();
        recordRoll(rollCounts, results);
        renderResults(results);
      }, reduceMotion.matches ? REDUCED_MOTION_ROLL_MS : ROLL_ANIMATION_MS);
    };

    const restoreBackground = () => {
      backgroundInertStates.forEach((wasInert, element) => { element.inert = wasInert; });
      backgroundInertStates = new Map();
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.paddingRight = previousBodyPaddingRight;
      document.body.classList.remove("dice-roller-open");
    };

    const setBackgroundInert = () => {
      backgroundInertStates = new Map();
      Array.from(document.body.children).forEach(element => {
        if (element === modal || ["SCRIPT", "STYLE"].includes(element.tagName)) return;
        backgroundInertStates.set(element, element.inert);
        element.inert = true;
      });

      previousBodyOverflow = document.body.style.overflow;
      previousBodyPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
      if (scrollbarWidth) document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = "hidden";
      document.body.classList.add("dice-roller-open");
    };

    const openModal = () => {
      if (isOpen) return;
      window.clearTimeout(closeTimer);
      isOpen = true;
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : fab;
      modal.hidden = false;
      modal.inert = false;
      modal.setAttribute("aria-hidden", "false");
      fab.setAttribute("aria-expanded", "true");
      setBackgroundInert();
      window.requestAnimationFrame(() => {
        modal.classList.add("is-open");
        closeButton.focus({ preventScroll: true });
        layoutResults();
      });
    };

    const closeModal = () => {
      if (!isOpen) return;
      isOpen = false;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      fab.setAttribute("aria-expanded", "false");
      restoreBackground();

      if (opener?.isConnected && !opener.closest("[inert]")) opener.focus({ preventScroll: true });
      opener = null;

      closeTimer = window.setTimeout(() => {
        modal.inert = true;
        modal.hidden = true;
      }, reduceMotion.matches ? 100 : 180);
    };

    const setEnabled = (enabled, { persist = true } = {}) => {
      const nextEnabled = Boolean(enabled);
      toggle.checked = nextEnabled;
      fab.classList.toggle("is-hidden", !nextEnabled);
      if (!nextEnabled) closeModal();
      if (persist) window.dndStorage?.setItem(STORAGE_KEY, String(nextEnabled));
    };

    dieButtons.forEach(button => {
      const sides = Number.parseInt(button.dataset.die || "0", 10);
      let holdTimer = 0;
      let suppressClick = false;

      const cancelHold = () => {
        window.clearTimeout(holdTimer);
        holdTimer = 0;
        button.classList.remove("is-holding");
      };

      button.addEventListener("click", () => {
        if (suppressClick) {
          suppressClick = false;
          return;
        }
        counts.set(sides, (counts.get(sides) || 0) + 1);
        updateControls();
      });

      button.addEventListener("pointerdown", event => {
        if (event.button !== 0 || button.disabled) return;
        suppressClick = false;
        button.classList.add("is-holding");
        holdTimer = window.setTimeout(() => {
          holdTimer = 0;
          suppressClick = true;
          button.classList.remove("is-holding");
          clearDie(sides);
          window.navigator.vibrate?.(30);
        }, LONG_PRESS_MS);
      });
      ["pointerup", "pointerleave", "pointercancel"].forEach(eventName => button.addEventListener(eventName, cancelHold));
      button.addEventListener("contextmenu", event => event.preventDefault());
      button.addEventListener("keydown", event => {
        if (event.key !== "Delete" && event.key !== "Backspace") return;
        event.preventDefault();
        clearDie(sides);
      });
    });

    toggle.addEventListener("change", () => setEnabled(toggle.checked));
    fab.addEventListener("click", openModal);
    closeButton.addEventListener("click", closeModal);
    historyButton.addEventListener("click", () => {
      if (currentView === "history") showCurrentResult();
      else renderHistory();
    });
    rollButton.addEventListener("click", roll);
    clearButton.addEventListener("click", clearAll);
    modal.addEventListener("click", event => {
      if (event.target === modal) closeModal();
    });
    modal.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) {
        event.preventDefault();
        card.focus();
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
    });

    if (window.ResizeObserver) new ResizeObserver(layoutResults).observe(stage);
    else window.addEventListener("resize", layoutResults, { passive: true });
    setEnabled(window.dndStorage?.getItem(STORAGE_KEY) === "true", { persist: false });
    updateControls();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();
})();

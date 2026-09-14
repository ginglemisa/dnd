(function initDiceRoller() {
  const DICE_SIDES = Object.freeze([100, 20, 12, 10, 8, 6, 4]);
  const STORAGE_KEY = "dnd.diceSystemEnabled.v1";
  const HISTORY_STORAGE_KEY = "dnd.diceRollHistory.v1";
  const ROLL_ANIMATION_MS = 1800;
  const ABILITY_ROLL_ANIMATION_MS = 1200;
  const REDUCED_MOTION_ROLL_MS = 100;
  const LONG_PRESS_MS = 1200;
  const ROLL_NOTE_LONG_PRESS_MS = 1300;
  const HISTORY_CLEAR_LONG_PRESS_MS = 3000;
  const HISTORY_LIMIT = 66;
  const DIE_EXPRESSION_SOURCE = String.raw`\d+\s*d\s*(?:100|20|12|10|8|6|4)`;
  const EXPRESSION_PATTERN = new RegExp(
    `${DIE_EXPRESSION_SOURCE}(?:\\s*[+-]\\s*(?:${DIE_EXPRESSION_SOURCE}|\\d+))*`,
    "i"
  );

  const setup = () => {
    const toggle = document.getElementById("dice-system-toggle");
    const fab = document.getElementById("dice-roller-fab");
    const modal = document.getElementById("dice-roller-modal");
    const card = modal?.querySelector(".dice-roller-card");
    const closeButton = document.getElementById("dice-roller-close");
    const stage = document.getElementById("dice-roller-stage");
    const title = document.getElementById("dice-roller-title");
    const totalOutput = document.getElementById("dice-roller-total-value");
    const historyButton = document.getElementById("dice-roller-history-view");
    const totalButton = document.getElementById("dice-roller-total-view");
    const rollButton = document.getElementById("dice-roller-roll");
    const clearButton = document.getElementById("dice-roller-clear");
    const dieButtons = Array.from(document.querySelectorAll(".dice-roller-die[data-die]"));

    if (!toggle || !fab || !modal || !card || !closeButton || !stage || !title || !totalOutput || !historyButton || !totalButton || !rollButton || !clearButton || dieButtons.length !== DICE_SIDES.length) return;

    const viewTabs = historyButton.parentElement;
    const totalBar = totalOutput.parentElement;

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
    let abilitySession = null;
    const loadHistory = () => {
      try {
        const stored = JSON.parse(window.dndStorage?.getItem(HISTORY_STORAGE_KEY) || "[]");
        if (!Array.isArray(stored)) return [];
        return stored.map(entry => {
          if (typeof entry === "string") return Object.freeze({ legacyText: entry });
          if (entry && typeof entry.legacyText === "string") return Object.freeze({ legacyText: entry.legacyText });
          if (!entry || typeof entry !== "object" || typeof entry.expression !== "string") return null;
          const values = Array.isArray(entry.values)
            ? entry.values.filter(value => Number.isSafeInteger(value?.value) && DICE_SIDES.includes(value?.sides))
            : [];
          return Object.freeze({
            label: String(entry.label || "").trim(),
            note: String(entry.note || "").trim(),
            expression: entry.expression,
            total: Number.isFinite(entry.total) ? entry.total : null,
            values: Object.freeze(values.map(value => Object.freeze({ value: value.value, sides: value.sides, ...(value.dropped === true ? { dropped: true } : {}) })))
          });
        }).filter(Boolean).slice(0, HISTORY_LIMIT);
      } catch (_error) {
        return [];
      }
    };
    const historyEntries = loadHistory();
    let backgroundInertStates = new Map();
    let previousBodyOverflow = "";
    let previousBodyPaddingRight = "";

    const formatNumber = value => new Intl.NumberFormat("zh-Hant").format(value);
    const getTotalDice = () => DICE_SIDES.reduce((sum, sides) => sum + counts.get(sides), 0);

    const saveHistory = () => {
      window.dndStorage?.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyEntries));
    };

    const formatHistoryEntry = entry => entry.legacyText || `${entry.label ? `${entry.label}：` : ""}${entry.expression}=${entry.total}${entry.note ? `｜${entry.note}` : ""}`;

    const removeDetailNavigation = () => {
      totalBar?.querySelectorAll(".dice-roller-detail-back").forEach(button => button.remove());
    };

    const restoreHistoryHeader = () => {
      title.textContent = "擲骰";
      stage.setAttribute("role", "status");
      stage.setAttribute("aria-live", "polite");
      totalOutput.hidden = Boolean(abilitySession);
      if (abilitySession) card.removeAttribute("aria-describedby");
      removeDetailNavigation();
      if (viewTabs && !viewTabs.isConnected) totalBar?.prepend(viewTabs);
    };

    const updateHistoryButton = () => {
      const showingHistory = currentView === "history";
      const recordCount = historyEntries.length;
      historyButton.classList.toggle("is-active", showingHistory);
      historyButton.setAttribute("aria-pressed", String(showingHistory));
      historyButton.setAttribute("aria-label", `顯示擲骰紀錄${recordCount ? `，共 ${recordCount} 筆` : ""}`);
      totalButton.classList.toggle("is-active", !showingHistory);
      totalButton.setAttribute("aria-pressed", String(!showingHistory));
      totalButton.textContent = abilitySession ? "屬性" : "總和";
      totalButton.setAttribute("aria-label", abilitySession ? "返回屬性分配" : "顯示目前擲骰總和");
      historyButton.disabled = isRolling;
      totalButton.disabled = isRolling;
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
      restoreHistoryHeader();
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
      restoreHistoryHeader();
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

    const renderHistory = (focusEntry = null) => {
      restoreHistoryHeader();
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
      let focusTarget = null;
      historyEntries.forEach(entry => {
        const item = document.createElement("li");
        item.className = "dice-roller-history-entry";
        if (entry.values?.length) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "dice-roller-history-open";
          button.setAttribute("aria-label", `查看 ${formatHistoryEntry(entry)} 的個別骰面`);
          button.append(
            Object.assign(document.createElement("span"), { textContent: formatHistoryEntry(entry) }),
            Object.assign(document.createElement("span"), { className: "dice-roller-history-chevron", textContent: "›", ariaHidden: "true" })
          );
          if (entry.values.some(value => value.dropped)) {
            const dice = document.createElement("span");
            dice.className = "dice-ability-history-dice";
            entry.values.forEach(({ value, dropped }) => {
              const die = document.createElement("span");
              die.className = dropped ? "is-dropped" : "";
              die.textContent = String(value);
              die.setAttribute("aria-label", `D6：${value}${dropped ? "，捨棄" : ""}`);
              dice.append(die);
            });
            button.firstElementChild.append(dice);
          }
          button.addEventListener("click", () => renderHistoryDetail(entry));
          if (entry === focusEntry) focusTarget = button;
          item.append(button);
        } else {
          item.classList.add("is-legacy");
          item.textContent = formatHistoryEntry(entry);
        }
        list.appendChild(item);
      });
      stage.setAttribute("aria-label", `擲骰紀錄，共 ${historyEntries.length} 筆，由新到舊排列。`);
      stage.replaceChildren(list);
      stage.scrollTop = 0;
      updateHistoryButton();
      focusTarget?.focus({ preventScroll: true });
    };

    const showCurrentResult = () => {
      if (abilitySession) renderAbilitySession();
      else if (currentResults.length) renderResults(currentResults);
      else renderEmptyStage();
    };

    const renderHistoryDetail = entry => {
      currentView = "detail";
      title.textContent = "擲骰詳情";
      stage.classList.add("is-history");
      stage.tabIndex = 0;
      const backButton = document.createElement("button");
      backButton.type = "button";
      backButton.className = "dice-roller-detail-back";
      backButton.textContent = "‹ 返回紀錄";
      backButton.addEventListener("click", () => renderHistory(entry));
      removeDetailNavigation();
      viewTabs?.remove();
      totalBar?.prepend(backButton);

      const detail = document.createElement("section");
      detail.className = "dice-roller-history-detail";
      detail.setAttribute("aria-label", `${entry.label || "擲骰"}詳情`);
      const heading = document.createElement("p");
      heading.className = "dice-roller-detail-expression";
      heading.textContent = `${entry.label ? `${entry.label}｜` : ""}${entry.expression}${entry.note ? `｜${entry.note}` : ""}`;
      const results = document.createElement("div");
      results.className = "dice-roller-detail-results";
      entry.values.forEach(({ value, sides, dropped }, index) => {
        const result = document.createElement("span");
        result.className = "dice-roller-detail-result";
        if (value === 1) result.classList.add("is-low");
        if (value === sides) result.classList.add("is-high");
        if (dropped) result.classList.add("is-dropped");
        result.textContent = formatNumber(value);
        result.setAttribute("aria-label", `第 ${index + 1} 顆 D${sides}：${value}${dropped ? "，捨棄最低骰" : ""}`);
        results.appendChild(result);
      });
      detail.append(heading, results);
      stage.setAttribute("aria-label", `${formatHistoryEntry(entry)}，共 ${entry.values.length} 顆骰子。`);
      stage.replaceChildren(detail);
      totalOutput.textContent = Number.isFinite(entry.total) ? formatNumber(entry.total) : "—";
      totalOutput.hidden = false;
      updateHistoryButton();
      backButton.focus({ preventScroll: true });
    };

    const addHistoryEntry = ({ expression, total, label = "", note = "", values = [] }) => {
      historyEntries.unshift(Object.freeze({
        label: String(label || "").trim(),
        note: String(note || "").trim(),
        expression,
        total,
        values: Object.freeze(values.map(({ value, sides, dropped }) => Object.freeze({ value, sides, ...(dropped ? { dropped: true } : {}) })))
      }));
      if (historyEntries.length > HISTORY_LIMIT) historyEntries.length = HISTORY_LIMIT;
      saveHistory();
      updateHistoryButton();
    };

    const recordRoll = (rollCounts, results, note = "") => {
      const diceExpression = DICE_SIDES
        .filter(sides => (rollCounts.get(sides) || 0) > 0)
        .map(sides => `${rollCounts.get(sides)}d${sides}`)
        .join("+");
      const total = results.reduce((sum, result) => sum + result.value, 0);
      addHistoryEntry({ expression: diceExpression, total, note, values: results });
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

    const resetAbilitySession = () => {
      if (abilitySession && isRolling) cancelRoll();
      abilitySession = null;
      card.classList.remove("is-ability-roll");
      card.querySelector(".dice-roller-controls").hidden = false;
      card.setAttribute("aria-describedby", "dice-roller-instructions");
      totalOutput.hidden = false;
    };

    const renderAbilitySession = () => {
      restoreHistoryHeader();
      currentView = "abilities";
      title.textContent = "屬性擲骰";
      stage.classList.add("is-history");
      stage.setAttribute("role", "region");
      stage.setAttribute("aria-live", "off");
      stage.setAttribute("aria-label", "六組屬性結果與分配");
      stage.replaceChildren(abilitySession.form);
      card.setAttribute("aria-describedby", "dice-ability-instructions");
      stage.scrollTop = 0;
      updateHistoryButton();
    };

    // This dedicated entry uses the shared RNG and history, even when automatic dice are off.
    const rollAbilities = (options = {}) => {
      const abilities = options.abilities;
      if (!Array.isArray(abilities) || abilities.length !== 6 || new Set(abilities.map(ability => ability.key)).size !== 6 || typeof options.onApply !== "function") return false;
      cancelRoll();
      let rolls = [];
      let sortedRolls = [];
      const form = document.createElement("form");
      form.className = "dice-ability-form";
      form.innerHTML = `
        <p id="dice-ability-instructions" class="dice-ability-hint">六次 4d6 取 3 高，分配給六項屬性。</p>
        <div class="dice-ability-results" aria-label="可用數值"></div>
        <div class="dice-ability-assignments" role="group" aria-label="分配基礎屬性"></div>
        <fieldset class="dice-ability-background">
          <legend>背景加值</legend>
          <div class="dice-ability-pattern" role="group" aria-label="背景加值方式">
            <label><input type="radio" name="ability-bonus-pattern" value="1,1,1" checked> +1／+1／+1</label>
            <label><input type="radio" name="ability-bonus-pattern" value="2,1,0"> +2／+1</label>
          </div>
          <div class="dice-ability-bonuses"></div>
        </fieldset>
        <p class="dice-ability-status" aria-live="polite"></p>
        <button type="submit" class="dice-ability-apply" disabled>套用至角色卡</button>`;
      const results = form.querySelector(".dice-ability-results");
      const startButton = document.createElement("button");
      startButton.type = "button";
      startButton.className = "dice-ability-start";
      startButton.innerHTML = '<span class="dice-ability-art" aria-hidden="true"><canvas width="360" height="360"></canvas></span><span class="dice-ability-start-label">點擊開啟命運</span>';
      results.append(startButton);
      // Snapshot the existing animated asset once, keeping the invitation still until clicked.
      const staticDice = new Image();
      const canvas = startButton.querySelector("canvas");
      staticDice.onload = () => canvas.getContext("2d")?.drawImage(staticDice, 0, 0, canvas.width, canvas.height);
      staticDice.onerror = () => { startButton.querySelector(".dice-ability-art").textContent = "🎲"; };
      staticDice.src = "dice.webp";
      const makeSelect = (parent, labelText, ariaLabel) => {
        const label = document.createElement("label");
        const caption = document.createElement("span");
        caption.textContent = labelText;
        const select = document.createElement("select");
        select.setAttribute("aria-label", ariaLabel);
        label.append(caption, select);
        parent.append(label);
        return select;
      };
      const assignments = abilities.map(({ label }) => makeSelect(form.querySelector(".dice-ability-assignments"), label, `${label}基礎值`));
      const bonuses = Array.from({ length: 3 }, (_, i) => makeSelect(form.querySelector(".dice-ability-bonuses"), "+1", `背景屬性 ${i + 1}`));
      const populateRemaining = (selects, choices, placeholder) => {
        const selected = selects.map(select => select.value);
        selects.forEach((select, index) => {
          const available = choices.filter(choice => choice.value === selected[index] || !selected.includes(choice.value));
          select.replaceChildren(new Option(placeholder, ""), ...available.map(choice => new Option(choice.label, choice.value)));
          select.value = selected[index];
        });
      };
      const getBonuses = () => form.querySelector('input[name="ability-bonus-pattern"]:checked').value.split(",").map(Number);
      const getScores = () => {
        const increments = getBonuses();
        return Object.fromEntries(abilities.map(({ key }, index) => [key,
          rolls[Number(assignments[index].value)].total + bonuses.reduce((sum, select, i) => sum + (select.value === key ? increments[i] : 0), 0)
        ]));
      };
      const updateForm = () => {
        populateRemaining(assignments, sortedRolls.map(roll => ({ value: roll.id, label: String(roll.total) })), "選數值");
        assignments.forEach(select => { select.disabled = !rolls.length; });
        populateRemaining(bonuses, abilities.map(ability => ({ value: ability.key, label: ability.label })), "選屬性");
        const increments = getBonuses();
        bonuses.forEach((select, index) => { select.previousElementSibling.textContent = increments[index] ? `+${increments[index]}` : "不加值"; });
        const complete = rolls.length === 6 && [...assignments, ...bonuses].every(select => select.value !== "");
        form.querySelector(".dice-ability-apply").disabled = !complete;
        const scores = complete ? getScores() : null;
        form.querySelector(".dice-ability-status").textContent = complete
          ? abilities.map(({ key, label }) => `${label} ${scores[key]}`).join(" · ")
          : "分配六個數值，並選擇三個不同的背景屬性。";
      };
      startButton.addEventListener("click", () => {
        if (isRolling || rolls.length) return;
        const session = abilitySession;
        isRolling = true;
        startButton.disabled = true;
        closeButton.focus({ preventScroll: true });
        startButton.setAttribute("aria-busy", "true");
        startButton.querySelector(".dice-ability-start-label").textContent = "命運轉動中…";
        if (!reduceMotion.matches) {
          const animation = new Image();
          animation.alt = "";
          animation.src = `dice.webp?roll=${++rollSequence}`;
          startButton.querySelector(".dice-ability-art").replaceChildren(animation);
        }
        updateControls();
        rollTimer = window.setTimeout(() => {
          rollTimer = 0;
          if (abilitySession !== session || !isOpen) return;
          isRolling = false;
          rolls = Array.from({ length: 6 }, (_, index) => {
            const values = Array.from({ length: 4 }, () => ({ sides: 6, value: rollDie(6) }));
            const minimum = Math.min(...values.map(die => die.value));
            values[values.findIndex(die => die.value === minimum)].dropped = true;
            return { id: String(index), total: values.reduce((sum, die) => sum + (die.dropped ? 0 : die.value), 0), values };
          });
          // Keep the six history rows in their original order, newest batch first.
          [...rolls].reverse().forEach(({ id, total, values }) => addHistoryEntry({
            label: `屬性 ${Number(id) + 1}`, expression: "4d6 取 3 高", total, values
          }));
          sortedRolls = [...rolls].sort((a, b) => b.total - a.total);
          results.replaceChildren(...sortedRolls.map(roll => Object.assign(document.createElement("strong"), { textContent: String(roll.total) })));
          updateForm();
          updateControls();
          assignments[0].focus({ preventScroll: true });
        }, ABILITY_ROLL_ANIMATION_MS);
      });
      form.addEventListener("change", updateForm);
      form.addEventListener("submit", event => {
        event.preventDefault();
        if (rolls.length !== 6 || [...assignments, ...bonuses].some(select => select.value === "")) return;
        options.onApply(getScores());
        closeModal();
        window.AppDialog?.notify("已套用六項屬性，含背景加值。", { tone: "success" });
      });
      abilitySession = { form };
      currentResults = [];
      card.classList.add("is-ability-roll");
      card.querySelector(".dice-roller-controls").hidden = true;
      card.setAttribute("aria-describedby", "dice-ability-instructions");
      updateForm();
      openModal(options.trigger);
      renderAbilitySession();
      return true;
    };

    const normalizeRollRequest = request => {
      const count = Number(request?.count);
      const sides = Number(request?.sides);
      const modifier = Number(request?.modifier ?? 0);
      if (!Number.isSafeInteger(count) || count < 1 || count > 100) return null;
      if (!DICE_SIDES.includes(sides)) return null;
      if (!Number.isSafeInteger(modifier) || Math.abs(modifier) > 999) return null;
      return {
        count,
        sides,
        modifier,
        includeModifier: Boolean(request?.includeModifier) || modifier !== 0,
        label: String(request?.label || "擲骰").trim() || "擲骰"
      };
    };

    const parseExpression = expression => {
      const sourceExpression = String(expression || "").trim().replace(/−/g, "-");
      const matchedExpression = sourceExpression.match(EXPRESSION_PATTERN)?.[0] || "";
      if (!matchedExpression) return null;
      const compactSource = sourceExpression.replace(/\s+/g, "").toLowerCase();
      const compactMatch = matchedExpression.replace(/\s+/g, "").toLowerCase();
      if (compactSource !== compactMatch) return null;

      const termPattern = /([+-]?)\s*(?:(\d+)\s*d\s*(100|20|12|10|8|6|4)|(\d+))/gi;
      const terms = [];
      let totalDice = 0;
      for (const match of matchedExpression.matchAll(termPattern)) {
        const sign = match[1] === "-" ? -1 : 1;
        if (match[2] && match[3]) {
          const count = Number(match[2]);
          const sides = Number(match[3]);
          if (!Number.isSafeInteger(count) || count < 1 || !DICE_SIDES.includes(sides)) return null;
          totalDice += count;
          if (totalDice > 100) return null;
          terms.push(Object.freeze({ type: "dice", sign, count, sides }));
          continue;
        }

        const value = Number(match[4]);
        if (!Number.isSafeInteger(value) || value > 999) return null;
        terms.push(Object.freeze({ type: "modifier", value: sign * value }));
      }

      if (!terms.length || terms[0].type !== "dice") return null;
      return Object.freeze({ terms: Object.freeze(terms) });
    };

    const formatSignedTerm = modifier => modifier < 0
      ? `− ${Math.abs(modifier)}`
      : `+ ${modifier}`;

    const notifyQuickRoll = equation => {
      window.AppDialog?.notify(equation, {
        tone: "info",
        variant: "dice-roll",
        duration: 3600
      });
    };

    const performQuickRoll = request => {
      if (!toggle.checked) return null;
      const normalized = normalizeRollRequest(request);
      if (!normalized) return null;

      const values = Array.from(
        { length: normalized.count },
        () => rollDie(normalized.sides)
      );
      const diceTotal = values.reduce((sum, value) => sum + value, 0);
      const total = diceTotal + normalized.modifier;
      const modifierExpression = normalized.includeModifier
        ? `${normalized.modifier < 0 ? "-" : "+"}${Math.abs(normalized.modifier)}`
        : "";
      const expression = `${normalized.count}d${normalized.sides}${modifierExpression}`;
      const diceEquation = values.join(" + ");
      const calculation = normalized.includeModifier
        ? `${diceEquation} ${formatSignedTerm(normalized.modifier)}`
        : diceEquation;
      const equation = values.length > 1 || normalized.includeModifier
        ? `${calculation} = ${total}`
        : String(total);

      addHistoryEntry({
        expression,
        total,
        label: normalized.label,
        values: values.map(value => ({ value, sides: normalized.sides }))
      });
      notifyQuickRoll(`${normalized.label}：${equation}`);

      const detail = Object.freeze({
        label: normalized.label,
        expression,
        values: Object.freeze([...values]),
        modifier: normalized.modifier,
        equation,
        total
      });
      window.dispatchEvent?.(new CustomEvent("diceroll", { detail }));
      return detail;
    };

    const performExpressionRoll = (parsed, options = {}) => {
      if (!toggle.checked || !parsed?.terms?.length) return null;

      const rolledTerms = parsed.terms.map(term => {
        if (term.type === "modifier") return term;
        return Object.freeze({
          ...term,
          values: Object.freeze(Array.from({ length: term.count }, () => rollDie(term.sides)))
        });
      });
      const total = rolledTerms.reduce((sum, term) => {
        if (term.type === "modifier") return sum + term.value;
        return sum + term.sign * term.values.reduce((termSum, value) => termSum + value, 0);
      }, 0);
      const expressionText = rolledTerms.map((term, index) => {
        const sign = index === 0 ? (term.sign < 0 ? "-" : "") : (term.sign < 0 || term.value < 0 ? "-" : "+");
        const value = term.type === "dice"
          ? `${term.count}d${term.sides}`
          : String(Math.abs(term.value));
        return `${sign}${value}`;
      }).join("");
      const equationParts = [];
      rolledTerms.forEach(term => {
        if (term.type === "modifier") {
          equationParts.push(formatSignedTerm(term.value));
          return;
        }
        term.values.forEach(value => {
          const signedValue = term.sign < 0 ? -value : value;
          equationParts.push(equationParts.length && signedValue >= 0 ? `+ ${signedValue}` : signedValue < 0 ? `− ${Math.abs(signedValue)}` : String(signedValue));
        });
      });
      const calculation = equationParts.join(" ");
      const equation = equationParts.length > 1 ? `${calculation} = ${total}` : String(total);
      const label = String(options.label || "擲骰").trim() || "擲骰";

      addHistoryEntry({
        expression: expressionText,
        total,
        label,
        values: rolledTerms.flatMap(term => term.type === "dice"
          ? term.values.map(value => ({ value, sides: term.sides }))
          : [])
      });
      if (options.notify !== false) notifyQuickRoll(`${label}：${equation}`);

      const values = rolledTerms.flatMap(term => term.type === "dice" ? term.values : []);
      const detail = Object.freeze({
        label,
        expression: expressionText,
        values: Object.freeze(values),
        terms: Object.freeze(rolledTerms),
        equation,
        total
      });
      window.dispatchEvent?.(new CustomEvent("diceroll", { detail }));
      return detail;
    };

    const rollExpression = (expression, options = {}) => {
      const parsed = parseExpression(expression);
      return parsed
        ? performExpressionRoll(parsed, options)
        : null;
    };

    const rollExpressions = (entries, options = {}) => {
      if (!toggle.checked || !Array.isArray(entries)) return Object.freeze([]);
      const rolls = entries.flatMap(entry => {
        const result = rollExpression(entry?.expression, {
          label: entry?.label,
          notify: false
        });
        if (!result) return [];
        const toastLabel = String(entry?.toastLabel || result.label).trim() || result.label;
        return [{ result, toastLabel }];
      });
      if (rolls.length) {
        const message = rolls
          .map(({ result, toastLabel }) => `${toastLabel}：${result.equation}`)
          .join(options.separator || " ／ ");
        notifyQuickRoll(message);
      }
      return Object.freeze(rolls.map(({ result }) => result));
    };

    const renderAutomatedRolls = (rolls, options = {}) => {
      restoreHistoryHeader();
      currentResults = [];
      currentView = "automated";
      title.textContent = String(options.title || "自動擲骰結果");
      stage.classList.add("is-history");
      stage.tabIndex = 0;
      stage.removeAttribute("aria-busy");

      const list = document.createElement("div");
      list.className = "dice-roller-automated-results";
      rolls.forEach(({ entry, result }) => {
        const item = document.createElement("article");
        item.className = "dice-roller-automated-result";
        const heading = document.createElement("strong");
        heading.textContent = entry.label;
        const equation = document.createElement("span");
        equation.className = "dice-roller-automated-result__equation";
        equation.textContent = result.fixed
          ? `${result.total}（固定值）`
          : `${result.expression} = ${result.total}`;
        item.append(heading, equation);
        if (entry.detail) {
          const detail = document.createElement("span");
          detail.className = "dice-roller-automated-result__detail";
          detail.textContent = entry.detail;
          item.appendChild(detail);
        }
        list.appendChild(item);
      });

      const ariaText = rolls.map(({ entry, result }) => (
        `${entry.label}：${result.fixed ? `${result.total}，固定值` : result.equation}`
      )).join("；");
      stage.setAttribute("aria-label", `自動擲骰結果：${ariaText}`);
      stage.replaceChildren(list);
      totalOutput.textContent = rolls.length === 1 ? formatNumber(rolls[0].result.total) : "—";
      updateHistoryButton();
      stage.scrollTop = 0;
    };

    const rollExpressionsInModal = (entries, options = {}) => {
      if (!toggle.checked) return Object.freeze({ ok: false, reason: "disabled", results: Object.freeze([]) });
      if (!Array.isArray(entries) || !entries.length) {
        return Object.freeze({ ok: false, reason: "empty", results: Object.freeze([]) });
      }

      const normalizedEntries = entries.map((entry, index) => {
        const expression = String(entry?.expression || "").trim();
        const fixed = Number(entry?.fixed);
        const hasFixed = entry?.fixed !== null && entry?.fixed !== undefined && Number.isFinite(fixed);
        if (!expression && !hasFixed) return null;
        if (expression && !parseExpression(expression)) return null;
        return Object.freeze({
          expression,
          fixed: hasFixed ? fixed : null,
          label: String(entry?.label || `結果 ${index + 1}`).trim() || `結果 ${index + 1}`,
          detail: String(entry?.detail || "").trim()
        });
      });
      const invalidIndex = normalizedEntries.findIndex(entry => !entry);
      if (invalidIndex >= 0) {
        return Object.freeze({
          ok: false,
          reason: "invalid-expression",
          invalidIndex,
          results: Object.freeze([])
        });
      }

      const rolls = normalizedEntries.map(entry => {
        if (entry.expression) {
          const result = performExpressionRoll(parseExpression(entry.expression), {
            label: entry.label,
            notify: false
          });
          return result ? { entry, result } : null;
        }
        const result = Object.freeze({
          label: entry.label,
          expression: String(entry.fixed),
          values: Object.freeze([]),
          terms: Object.freeze([]),
          equation: String(entry.fixed),
          total: entry.fixed,
          fixed: true
        });
        addHistoryEntry({ expression: String(entry.fixed), total: entry.fixed, label: entry.label });
        return { entry, result };
      });
      if (rolls.some(rollEntry => !rollEntry)) {
        return Object.freeze({ ok: false, reason: "roll-failed", results: Object.freeze([]) });
      }

      resetAbilitySession();
      openModal(options.trigger);
      renderAutomatedRolls(rolls, options);
      const results = Object.freeze(rolls.map(({ result }) => result));
      window.dispatchEvent?.(new CustomEvent("diceautomatedroll", {
        detail: Object.freeze({ title: String(options.title || ""), results })
      }));
      return Object.freeze({ ok: true, reason: "", results });
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

    const clearHistory = () => {
      if (!historyEntries.length) return;
      historyEntries.length = 0;
      saveHistory();
      if (currentView === "history" || currentView === "detail") renderHistory();
      else updateHistoryButton();
    };

    const clearDie = sides => {
      counts.set(sides, 0);
      updateControls();
    };

    const roll = (note = "") => {
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
        recordRoll(rollCounts, results, note);
        renderResults(results);
      }, reduceMotion.matches ? REDUCED_MOTION_ROLL_MS : ROLL_ANIMATION_MS);
    };

    const requestRollNote = async () => {
      if (isRolling || getTotalDice() === 0 || typeof window.AppDialog?.showContent !== "function") return;
      let noteInput = null;
      const note = await window.AppDialog.showContent({
        title: "擲骰備註",
        message: "輸入這次擲骰的文字備註，儲存後會顯示在擲骰紀錄中。",
        trigger: rollButton,
        cancelLabel: "取消",
        confirmLabel: "擲骰",
        initialFocus: "content",
        dismissOnBackdrop: false,
        renderContent(body) {
          const label = document.createElement("label");
          label.className = "app-dialog__roll-note-field";
          label.textContent = "文字備註（選填）";
          noteInput = document.createElement("textarea");
          noteInput.className = "app-dialog__roll-note-input";
          noteInput.rows = 3;
          noteInput.maxLength = 120;
          noteInput.placeholder = "例如：調查密門";
          noteInput.dataset.stateTransient = "true";
          label.appendChild(noteInput);
          body.appendChild(label);
        },
        resolveConfirm() {
          return noteInput?.value.trim() || "";
        }
      });
      suppressRollClick = false;
      if (typeof note === "string") roll(note);
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

    const openModal = trigger => {
      if (isOpen) return;
      window.clearTimeout(closeTimer);
      isOpen = true;
      opener = trigger instanceof HTMLElement
        ? trigger
        : document.activeElement instanceof HTMLElement ? document.activeElement : fab;
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
      if (abilitySession && isRolling) cancelRoll();
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
      window.dispatchEvent?.(new CustomEvent("dicerollmodechange", {
        detail: Object.freeze({ enabled: nextEnabled })
      }));
    };

    window.DiceRoller = Object.freeze({
      isEnabled: () => toggle.checked,
      canRollExpression: expression => Boolean(parseExpression(expression)),
      roll: performQuickRoll,
      rollExpression,
      rollExpressions,
      rollExpressionsInModal,
      rollAbilities
    });

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
    fab.addEventListener("click", () => {
      if (abilitySession) {
        resetAbilitySession();
        renderEmptyStage();
      }
      openModal(fab);
    });
    closeButton.addEventListener("click", closeModal);
    historyButton.addEventListener("click", () => renderHistory());
    totalButton.addEventListener("click", showCurrentResult);
    let rollNoteTimer = 0;
    let suppressRollClick = false;
    const cancelRollNoteHold = () => {
      window.clearTimeout(rollNoteTimer);
      rollNoteTimer = 0;
      rollButton.classList.remove("is-holding");
    };
    rollButton.addEventListener("click", () => {
      if (suppressRollClick) {
        suppressRollClick = false;
        return;
      }
      roll();
    });
    rollButton.addEventListener("pointerdown", event => {
      if (event.button !== 0 || rollButton.disabled) return;
      suppressRollClick = false;
      rollButton.classList.add("is-holding");
      rollNoteTimer = window.setTimeout(() => {
        rollNoteTimer = 0;
        suppressRollClick = true;
        rollButton.classList.remove("is-holding");
        window.navigator.vibrate?.(30);
        void requestRollNote();
      }, ROLL_NOTE_LONG_PRESS_MS);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach(eventName => rollButton.addEventListener(eventName, cancelRollNoteHold));
    rollButton.addEventListener("contextmenu", event => event.preventDefault());
    let clearHistoryTimer = 0;
    let suppressClearClick = false;
    const cancelClearHistoryHold = () => {
      window.clearTimeout(clearHistoryTimer);
      clearHistoryTimer = 0;
      clearButton.classList.remove("is-holding");
    };
    clearButton.addEventListener("click", () => {
      if (suppressClearClick) {
        suppressClearClick = false;
        return;
      }
      clearAll();
    });
    clearButton.addEventListener("pointerdown", event => {
      if (event.button !== 0 || clearButton.disabled) return;
      suppressClearClick = false;
      clearButton.classList.add("is-holding");
      clearHistoryTimer = window.setTimeout(() => {
        clearHistoryTimer = 0;
        suppressClearClick = true;
        clearButton.classList.remove("is-holding");
        clearHistory();
        window.navigator.vibrate?.(30);
      }, HISTORY_CLEAR_LONG_PRESS_MS);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach(eventName => clearButton.addEventListener(eventName, cancelClearHistoryHold));
    clearButton.addEventListener("contextmenu", event => event.preventDefault());
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

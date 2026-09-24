(function attachTabletopResources(globalScope) {
  "use strict";

  const CUSTOM_RESOURCE_MAX = 999;
  const elements = {};
  let initialized = false;
  let scheduledRender = 0;
  let restDialogOpen = false;

  function createElement(tagName, className = "", text = "") {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function createResourceMeter(current, maximum) {
    const safeMaximum = Math.max(1, Number(maximum) || 1);
    const safeCurrent = Math.min(safeMaximum, Math.max(0, Number(current) || 0));
    const meter = createElement("div", "tabletop-resource-meter");
    const fill = createElement("span", "tabletop-resource-meter__fill");
    meter.style.setProperty("--tabletop-resource-fill", `${(safeCurrent / safeMaximum) * 100}%`);
    meter.classList.toggle("is-empty", safeCurrent === 0);
    meter.classList.toggle("is-full", safeCurrent === safeMaximum);
    meter.setAttribute("aria-hidden", "true");
    meter.appendChild(fill);
    return meter;
  }

  function formatResourceAmount(current, maximum) {
    return `${current}／${maximum}`;
  }

  async function requestResourceValue({ label, current, maximum, trigger }) {
    if (typeof globalScope.AppDialog?.requestNumber !== "function") return false;
    return globalScope.AppDialog.requestNumber({
      title: `設定${label}`,
      message: "直接輸入目前剩餘的數值。",
      inputLabel: "目前值",
      value: current,
      min: 0,
      max: maximum,
      step: 1,
      integer: true,
      hint: `可輸入 0～${maximum}；最大值維持 ${maximum}。`,
      invalidMessage: `請輸入 0～${maximum} 的整數。`,
      cancelLabel: "取消",
      confirmLabel: "套用數值",
      trigger
    });
  }

  function dispatchCanonicalUpdate(control) {
    control.dispatchEvent(new Event("input", { bubbles: true }));
    control.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function setCanonicalCheckbox(canonical, checked) {
    if (!(canonical instanceof HTMLInputElement) || canonical.disabled) return;
    canonical.checked = Boolean(checked);
    dispatchCanonicalUpdate(canonical);
  }

  function createResourceRow(label, note = "") {
    const row = createElement("section", "tabletop-resource-row");
    const copy = createElement("div", "tabletop-resource-row__copy");
    copy.appendChild(createElement("h4", "", label));
    if (note) copy.appendChild(createElement("p", "", note));
    const controls = createElement("div", "tabletop-resource-row__controls");
    row.append(copy, controls);
    return { row, controls };
  }

  function createCheckboxMirrors(label, note, canonicalInputs) {
    const row = createElement(
      "div",
      "proficiency-use-checks tabletop-resource-inline-checks"
    );
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", note ? `${label}；${note}` : label);
    row.appendChild(createElement(
      "span",
      "proficiency-use-checks__label",
      label
    ));

    canonicalInputs.forEach((canonical, index) => {
      const mirror = document.createElement("input");
      mirror.type = "checkbox";
      mirror.checked = canonical.checked;
      mirror.setAttribute(
        "aria-label",
        canonicalInputs.length === 1
          ? label
          : `${label} ${index + 1}/${canonicalInputs.length}`
      );
      mirror.addEventListener("change", () => setCanonicalCheckbox(canonical, mirror.checked));
      row.appendChild(mirror);
    });
    return row;
  }

  function createCanonicalUseRow(label, note, canonicalInputs) {
    const { row, controls } = createResourceRow(label, note);
    controls.classList.add("tabletop-resource-checks");
    canonicalInputs.forEach((canonical, index) => {
      const slot = createElement("label", "tabletop-resource-check");
      const mirror = document.createElement("input");
      mirror.type = "checkbox";
      mirror.checked = canonical.checked;
      mirror.setAttribute("aria-label", `${label} ${index + 1}/${canonicalInputs.length}，勾選表示已消耗`);
      mirror.addEventListener("change", () => setCanonicalCheckbox(canonical, mirror.checked));
      slot.appendChild(mirror);
      controls.appendChild(slot);
    });
    return row;
  }

  function createStoredUseRow({ key, label, note, maximum }) {
    if (!key || maximum < 1) return null;
    const readSpent = () => Math.min(
      maximum,
      Math.max(0, globalScope.TabletopMode?.getBuiltInResourceSpent(key) || 0)
    );
    const spent = readSpent();
    const { row, controls } = createResourceRow(label, note);
    controls.classList.add("tabletop-resource-checks");

    for (let index = 1; index <= maximum; index += 1) {
      const slot = createElement("label", "tabletop-resource-check");
      const mirror = document.createElement("input");
      mirror.type = "checkbox";
      mirror.checked = index <= spent;
      mirror.setAttribute("aria-label", `${label} ${index}/${maximum}，勾選表示已消耗`);
      mirror.addEventListener("change", () => {
        const current = readSpent();
        const next = mirror.checked ? Math.max(current, index) : Math.min(current, index - 1);
        globalScope.TabletopMode?.setBuiltInResourceSpent(key, next, maximum);
        announce(`${label}目前已消耗 ${next}/${maximum} 次。`);
      });
      slot.appendChild(mirror);
      controls.appendChild(slot);
    }
    return row;
  }

  function createPointPoolRow({ key, label, note, maximum }) {
    if (!key || maximum < 1) return null;
    const spent = Math.min(
      maximum,
      Math.max(0, globalScope.TabletopMode?.getBuiltInResourceSpent(key) || 0)
    );
    const remaining = maximum - spent;
    const { row, controls } = createResourceRow(label, note);
    row.classList.add("tabletop-resource-row--counter");
    controls.classList.add("tabletop-resource-stepper");
    const stepper = createElement("div", "tabletop-number-stepper");

    const readRemaining = () => {
      const currentSpent = globalScope.TabletopMode?.getBuiltInResourceSpent(key) || 0;
      const safeSpent = Math.min(maximum, Math.max(0, currentSpent));
      return maximum - safeSpent;
    };

    const setRemaining = rawValue => {
      const parsed = Number.parseInt(String(rawValue), 10);
      const next = Math.min(maximum, Math.max(0, Number.isSafeInteger(parsed) ? parsed : readRemaining()));
      globalScope.TabletopMode?.setBuiltInResourceSpent(key, maximum - next, maximum);
      announce(`${label}剩餘 ${next}/${maximum} 點。`);
    };

    const decrease = createElement("button", "tabletop-number-stepper__adjust", "−");
    decrease.type = "button";
    decrease.disabled = remaining <= 0;
    decrease.setAttribute("aria-label", `${label}減少 1 點`);
    decrease.addEventListener("click", () => setRemaining(readRemaining() - 1));

    const current = createElement(
      "button",
      "tabletop-number-stepper__value",
      formatResourceAmount(remaining, maximum)
    );
    current.type = "button";
    current.setAttribute("aria-haspopup", "dialog");
    current.setAttribute("aria-label", `${label}剩餘 ${remaining}/${maximum}；點擊直接設定`);
    current.addEventListener("click", async () => {
      const next = await requestResourceValue({
        label,
        current: readRemaining(),
        maximum,
        trigger: current
      });
      if (next === false) return;
      setRemaining(next);
    });

    const increase = createElement("button", "tabletop-number-stepper__adjust", "+");
    increase.type = "button";
    increase.disabled = remaining >= maximum;
    increase.setAttribute("aria-label", `${label}增加 1 點`);
    increase.addEventListener("click", () => setRemaining(readRemaining() + 1));

    const refill = createElement("button", "tabletop-compact-button", "回滿");
    refill.type = "button";
    refill.disabled = remaining >= maximum;
    refill.setAttribute("aria-label", `將${label}回滿`);
    refill.addEventListener("click", () => setRemaining(maximum));
    stepper.append(decrease, current, increase);
    controls.append(stepper, refill);
    row.appendChild(createResourceMeter(remaining, maximum));
    return row;
  }

  function createSpellSlotMirrors(label, canonicalInputs) {
    const column = createElement(
      "div",
      "spell-slot-column tabletop-spell-slot-column"
    );
    column.setAttribute("role", "group");
    column.setAttribute("aria-label", `${label}法術位，勾選表示已消耗`);
    column.appendChild(createElement("span", "spell-slot-label", label));

    canonicalInputs.forEach((canonical, index) => {
      const mirror = document.createElement("input");
      mirror.type = "checkbox";
      mirror.checked = canonical.checked;
      mirror.setAttribute(
        "aria-label",
        `${label}法術位 ${index + 1}/${canonicalInputs.length}，勾選表示已消耗`
      );
      mirror.addEventListener("change", () => {
        setCanonicalCheckbox(canonical, mirror.checked);
      });
      column.appendChild(mirror);
    });

    return column;
  }

  function createHeroicInspirationRow() {
    const canonical = document.getElementById("heroic-inspiration");
    if (!(canonical instanceof HTMLInputElement)) return null;
    const recoveryNote = document.getElementById("race")?.value === "human"
      ? "足智多謀：完成長休後，獲得 1 顆英雄激勵。"
      : "";
    const row = createCheckboxMirrors(
      "英雄激勵",
      recoveryNote || "與角色卡數值頁同步。",
      [canonical]
    );
    const wrapper = createElement("div", "tabletop-resource-row tabletop-rest-row");
    const copy = createElement("div", "tabletop-resource-row__copy");
    const heading = createElement("div", "tabletop-rest-heading");
    const actions = createElement("div", "tabletop-rest-actions");
    for (const [kind, label] of [["shortRest", "短休"], ["longRest", "長休"]]) {
      const button = createElement("button", "tabletop-compact-button", label);
      button.type = "button";
      button.dataset.rest = kind;
      button.setAttribute("aria-haspopup", "dialog");
      button.addEventListener("click", () => openRest(kind, button));
      actions.appendChild(button);
    }
    heading.append(row, actions);
    copy.appendChild(heading);
    if (recoveryNote) copy.appendChild(createElement("p", "", recoveryNote));
    wrapper.appendChild(copy);
    return wrapper;
  }

  function restCheck(target, text) {
    const label = createElement("label", "tabletop-rest-check");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.stateTransient = "true";
    label.append(input, document.createTextNode(text));
    target.appendChild(label);
    return input;
  }

  function restNumber(target, labelText, minimum) {
    const label = createElement("label", "app-dialog__number-field", labelText);
    const input = document.createElement("input");
    input.type = "number";
    input.min = String(minimum);
    input.max = "999";
    input.step = "1";
    input.inputMode = "numeric";
    input.dataset.stateTransient = "true";
    label.appendChild(input);
    target.appendChild(label);
    return input;
  }

  async function openRest(kind, trigger) {
    if (restDialogOpen) return;
    const context = globalScope.TabletopMode.getRestContext();
    if (!context.ready) {
      globalScope.AppDialog.notify("請先選擇職業與等級。", { tone: "warning" });
      return;
    }
    restDialogOpen = true;
    const isLong = kind === "longRest";
    const name = isLong ? "長休" : "短休";
    try {
      const content = createElement("div", "tabletop-rest-dialog");
      content.appendChild(createElement("p", "", isLong
        ? `${context.race === "elf" ? "傳思 4 小時" : "休息至少 8 小時"}。完成後至少等 16 小時再開始長休。`
        : "休息 1 小時。完成後可逐顆使用生命骰。"));
      const summary = createElement("ul", "tabletop-rest-summary");
      if (isLong) {
        summary.appendChild(createElement("li", "", "HP、生命骰與長休資源回滿；力竭減 1。"));
        summary.appendChild(createElement("li", "", "清空臨時 HP。"));
        if (context.specs.some(spec => spec.key === "druid-wild-shape")) {
          summary.appendChild(createElement("li", "", "結束荒野形態與荒野夥伴。"));
        }
      } else {
        const recovered = context.specs.filter(spec => spec.recovery?.shortRest);
        for (const spec of recovered) summary.appendChild(createElement("li", "",
          `${spec.label}：${spec.recovery.shortRest === "all" ? "全回" : `恢復 ${spec.recovery.shortRest} 次`}。`));
        if (!recovered.length) summary.appendChild(createElement("li", "", "沒有自動恢復的短休資源。"));
      }
      if (isLong && context.race === "human") summary.appendChild(createElement("li", "", "獲得英雄激勵。"));
      content.appendChild(summary);
      const recoveryFields = [];
      for (const spec of context.specs.filter(item => item.restChoice?.when === kind)) {
        const section = createElement("fieldset", "tabletop-rest-choice");
        section.appendChild(createElement("legend", "", spec.label));
        content.appendChild(section);
        if (globalScope.TabletopMode.getBuiltInResourceSpent(spec.key) >= spec.maximum) {
          section.appendChild(createElement("p", "", "已使用，長休後恢復。"));
          continue;
        }
        const choice = spec.restChoice;
        if (choice.effect === "spellSlots") {
          section.appendChild(createElement("p", "", `可選用：總和最多 ${choice.budget} 環；每個最高 ${choice.maximumSlotLevel} 環。`));
          const boxes = context.slots.flatMap(group => group.level > choice.maximumSlotLevel ? []
            : group.controls.filter(control => control.checked).map(control => ({
              id: control.id, input: restCheck(section, `${group.level} 環法術位 ${control.id.split("-").pop()}`)
            })));
          if (!boxes.length) section.appendChild(createElement("p", "", "沒有可恢復的法術位。"));
          recoveryFields.push({ key: spec.key, read: () => { const ids = boxes.filter(box => box.input.checked).map(box => box.id); return ids.length ? ids : false; } });
        } else if (choice.effect === "points") {
          const spent = globalScope.TabletopMode.getBuiltInResourceSpent(choice.targetKey);
          const input = restCheck(section, `恢復 ${Math.min(spent, choice.budget)} 點術法點`);
          input.disabled = spent === 0;
          recoveryFields.push({ key: spec.key, read: () => input.checked });
        }
      }
      let companion = null;
      const companionChoice = context.specs.find(spec => spec.key === "travel-companion")?.restChoice;
      if (companionChoice) {
        const section = createElement("fieldset", "tabletop-rest-choice");
        section.appendChild(createElement("legend", "", "最佳旅伴"));
        section.appendChild(createElement("p", "", "與你一起休息的至多 5 名隊友也可獲得相同臨時 HP。"));
        const use = restCheck(section, "套用最佳旅伴");
        const label = createElement("label", "app-dialog__number-field", "此專長提升的屬性");
        const ability = document.createElement("select");
        ability.dataset.stateTransient = "true";
        for (const [value, text] of [["", "請選擇"], ...companionChoice.abilities.map(key => [key, { wis: "感知", cha: "魅力" }[key]])]) {
          const option = createElement("option", "", text); option.value = value; ability.appendChild(option);
        }
        label.appendChild(ability);
        section.appendChild(label);
        const amount = restNumber(section, "臨時 HP（等級＋屬性調整值，可修改）", 0);
        amount.value = "0";
        ability.disabled = amount.disabled = true;
        use.addEventListener("change", () => { ability.disabled = amount.disabled = !use.checked; });
        ability.addEventListener("change", () => {
          amount.value = String(Math.max(0, companionChoice.level + globalScope.calculateAbilityModifier(document.getElementById(ability.value)?.value || 10)));
        });
        section.appendChild(createElement("p", "", isLong ? "長休先清空臨時 HP，再套用此數值。"
          : `目前臨時 HP：${globalScope.TabletopMode.collectState().temporaryHp}。套用會替換，不相加。`));
        content.appendChild(section);
        companion = { use, ability, amount };
      }
      const error = createElement("p", "app-dialog__number-error");
      error.id = "tabletop-rest-error";
      error.setAttribute("role", "status");
      content.appendChild(error);
      for (const input of content.querySelectorAll("input, select")) {
        input.setAttribute("aria-describedby", error.id);
        input.addEventListener("input", () => { input.removeAttribute("aria-invalid"); error.textContent = ""; });
      }
      const completed = await globalScope.AppDialog.showContent({
        title: `完成${name}`, content, cancelLabel: "取消", confirmLabel: `完成${name}`,
        trigger, dismissOnBackdrop: false,
        resolveConfirm() {
          if (companion?.use.checked && (!companion.ability.value || !companion.amount.value.trim()
            || !Number.isSafeInteger(Number(companion.amount.value)) || Number(companion.amount.value) < 0 || Number(companion.amount.value) > 999)) {
            const field = !companion.ability.value ? companion.ability : companion.amount;
            error.textContent = "請選擇屬性並填寫臨時 HP（0～999）。";
            field.setAttribute("aria-invalid", "true"); field.focus();
            return false;
          }
          const selection = { recovery: Object.fromEntries(recoveryFields.map(field => [field.key, field.read()])),
            companion: companion?.use.checked ? { ability: companion.ability.value, amount: Number(companion.amount.value) } : null };
          const result = globalScope.TabletopMode.commitRest(kind, selection, context.token);
          if (!result.ok) { error.textContent = result.reason; return false; }
          return true;
        }
      });
      if (!completed) return;
      globalScope.AppDialog.notify(`${name}完成。`, { tone: "success" });
      if (!isLong) {
        const dice = globalScope.TabletopMode.getHitDiceContext();
        if (dice.remaining > 0 && dice.hp !== null && dice.maximumHp > dice.hp) await openRestHitDice(trigger);
      }
    } finally {
      restDialogOpen = false;
      if (!document.querySelector(".app-dialog")) document.querySelector(`[data-rest="${kind}"]`)?.focus();
    }
  }

  async function openRestHitDice(trigger) {
    const content = createElement("div", "tabletop-rest-dialog");
    const status = createElement("p");
    status.setAttribute("role", "status");
    const resultText = createElement("p");
    resultText.setAttribute("aria-live", "polite");
    content.append(status, createElement("p", "", "每次使用 1 顆，可隨時結束。已使用的生命骰會立即扣除。"));
    const automatic = Boolean(globalScope.DiceRoller?.isEnabled());
    const manual = automatic ? null : restNumber(content, "本顆回血（骰值＋體質調整值，至少 1）", 1);
    const use = createElement("button", "tabletop-compact-button", automatic ? "擲 1 顆並回血" : "使用 1 顆並回血");
    use.type = "button";
    const update = () => {
      const dice = globalScope.TabletopMode.getHitDiceContext();
      status.textContent = `HP ${dice.hp}/${dice.maximumHp}；生命骰 ${dice.remaining} 顆（${dice.expression}）。`;
      use.disabled = dice.remaining < 1 || dice.hp >= dice.maximumHp;
    };
    use.addEventListener("click", () => {
      const result = globalScope.TabletopMode.spendHitDice({ manualHealing: manual ? Number(manual.value) : null, preserveConditions: true });
      resultText.textContent = result.ok ? result.records.join("\n") : result.reason;
      if (!result.ok && manual) { manual.setAttribute("aria-invalid", "true"); manual.focus(); }
      else if (manual) { manual.removeAttribute("aria-invalid"); manual.value = ""; }
      update();
      if (use.disabled) content.closest(".app-dialog__surface")?.querySelector(".app-dialog__button--primary")?.focus();
    });
    resultText.id = "tabletop-rest-hit-dice-result";
    manual?.setAttribute("aria-describedby", resultText.id);
    content.append(use, resultText);
    update();
    await globalScope.AppDialog.showContent({ title: "短休：生命骰", content, confirmLabel: "結束", trigger, dismissOnBackdrop: false });
  }

  function createHitDiceRow() {
    const canonical = document.getElementById("lifedicen");
    const hasClass = Boolean(document.getElementById("class")?.value);
    const level = Number.parseInt(document.getElementById("level")?.value || "0", 10);
    if (!(canonical instanceof HTMLSelectElement) || !hasClass || level < 1) return null;
    const availableValues = Array.from(canonical.options)
      .filter(option => !option.disabled)
      .map(option => Number.parseInt(option.value, 10))
      .filter(Number.isFinite);
    const maximum = availableValues.length ? Math.max(...availableValues) : level;
    const current = Number.parseInt(canonical.value || "0", 10) || 0;
    const hitDieSize = Number(globalScope.getHitDiceValues?.(
      document.getElementById("class")?.value || ""
    )?.Y) || 0;
    if (!hitDieSize) return null;
    const { row, controls } = createResourceRow("", "手動追蹤目前剩餘顆數。") ;
    row.classList.add("tabletop-resource-row--counter");
    const heading = row.querySelector(".tabletop-resource-row__copy h4");
    const rollHitDie = createElement("button", "tabletop-inline-roll");
    rollHitDie.type = "button";
    rollHitDie.disabled = !globalScope.DiceRoller?.isEnabled?.();
    rollHitDie.setAttribute("aria-label", `擲生命骰 D${hitDieSize}`);
    const hitDieSizeLabel = createElement("span", "hit-die-size", `D${hitDieSize}`);
    hitDieSizeLabel.setAttribute("aria-hidden", "true");
    rollHitDie.append(hitDieSizeLabel);
    rollHitDie.addEventListener("click", () => {
      const context = globalScope.TabletopMode.getHitDiceContext();
      if (context.hp !== null && context.maximumHp > 0 && context.hp >= context.maximumHp) {
        globalScope.AppDialog.notify("HP已滿，不擲骰不扣生命骰資源。", { tone: "info" });
        return;
      }
      const result = globalScope.TabletopMode.spendHitDice({ count: 1 });
      globalScope.AppDialog.notify(
        result.ok ? `${result.records.join("\n")}；已消耗 1 顆生命骰。` : result.reason,
        { tone: result.ok ? "success" : "warning" }
      );
    });
    const heal = createElement(
      "button",
      "tabletop-inline-roll tabletop-inline-roll--plain",
      "💗"
    );
    heal.type = "button";
    heal.disabled = !globalScope.DiceRoller?.isEnabled?.();
    heal.setAttribute("aria-label", "消耗生命骰恢復生命值");
    heal.setAttribute("aria-haspopup", "dialog");
    heading?.replaceChildren(
      createElement("span", "", "生命骰"),
      document.createTextNode(" "),
      rollHitDie,
      document.createTextNode(" "),
      heal
    );
    controls.classList.add("tabletop-resource-stepper");
    const stepper = createElement("div", "tabletop-number-stepper");

    const decrease = createElement("button", "tabletop-number-stepper__adjust", "−");
    decrease.type = "button";
    decrease.disabled = current <= 0;
    decrease.setAttribute("aria-label", "生命骰減少 1");
    const output = createElement(
      "output",
      "tabletop-number-stepper__value",
      formatResourceAmount(current, maximum)
    );
    output.setAttribute("aria-label", `生命骰 ${current}/${maximum}`);
    const increase = createElement("button", "tabletop-number-stepper__adjust", "+");
    increase.type = "button";
    increase.disabled = current >= maximum;
    increase.setAttribute("aria-label", "生命骰增加 1");

    const setValue = value => {
      const next = Math.min(maximum, Math.max(0, value));
      const option = Array.from(canonical.options).find(candidate => Number(candidate.value) === next && !candidate.disabled);
      if (!option) return;
      canonical.value = option.value;
      dispatchCanonicalUpdate(canonical);
    };
    heal.addEventListener("click", async () => {
      const hpInput = document.getElementById("hp");
      const maximumHpInput = document.getElementById("hp-display");
      const startingHp = Number.parseInt(hpInput?.value || "", 10);
      const maximumHp = Number.parseInt(maximumHpInput?.value || "", 10);
      if (!(hpInput instanceof HTMLInputElement) || !Number.isFinite(startingHp)
        || !Number.isFinite(maximumHp) || maximumHp < 1) {
        globalScope.AppDialog?.notify?.("請先設定有效的目前 HP 與最大 HP。", { tone: "warning" });
        return;
      }
      if (startingHp >= maximumHp) {
        globalScope.AppDialog?.notify?.("生命值已全滿，不需要消耗生命骰。", { tone: "info" });
        return;
      }
      if (current < 1) {
        globalScope.AppDialog?.notify?.("生命骰已用盡。", { tone: "warning" });
        return;
      }
      const confirmed = await globalScope.AppDialog?.requestDecision?.({
        title: "使用生命骰恢復",
        message: "是否消耗所有生命骰直至 HP 全滿？",
        cancelLabel: "取消",
        confirmLabel: "開始恢復",
        initialFocus: "primary",
        dismissOnBackdrop: false,
        trigger: heal
      });
      if (!confirmed) return;

      const result = globalScope.TabletopMode.spendHitDice({ count: current });
      if (!result.ok) {
        globalScope.AppDialog?.notify?.(result.reason, { tone: "warning" });
        return;
      }
      const content = createElement("p", "", [
        ...result.records,
        "",
        result.hp >= maximumHp ? "生命值已完全恢復！" : "生命骰用盡，祝好運！"
      ].join("\n"));
      await globalScope.AppDialog?.showContent?.({
        title: "生命骰恢復結果",
        content,
        confirmLabel: "完成",
        trigger: heal
      });
      announce(`已消耗 ${result.spent} 顆生命骰，目前 HP ${result.hp}/${maximumHp}。`);
    });
    decrease.addEventListener("click", () => setValue(current - 1));
    increase.addEventListener("click", () => setValue(current + 1));
    stepper.append(decrease, output, increase);
    controls.append(stepper);
    row.appendChild(createResourceMeter(current, maximum));
    return row;
  }

  function getRaceUseGroups() {
    const race = document.getElementById("race")?.value || "";
    const level = Number.parseInt(document.getElementById("level")?.value || "0", 10) || 0;
    const goliathAncestry = document.getElementById("goliath-ancestry")?.value || "";
    const configs = [
      { visible: level >= 1 && race === "dragonborn", id: "dragonborn-breath-uses", label: "吐息元素", note: "使用次數等同熟練加值；長休後全回復。" },
      { visible: level >= 1 && race === "goliath" && Boolean(goliathAncestry), id: "goliath-giant-ancestry-uses", label: "巨人血統異能", note: "使用次數等同熟練加值；長休後全回復。" }
    ];

    return configs.flatMap(config => {
      if (!config.visible) return [];
      const canonicalInputs = Array.from(document.querySelectorAll(`#${config.id} input[type="checkbox"]`))
        .filter(input => !input.disabled && !input.hidden);
      return canonicalInputs.length ? [{ ...config, canonicalInputs }] : [];
    });
  }

  function getAutomaticResourceSpecs() {
    if (typeof globalScope.getCharacterResourceSpecs !== "function") return [];
    return globalScope.getCharacterResourceSpecs({
      className: document.getElementById("class")?.value || "",
      race: document.getElementById("race")?.value || "",
      level: document.getElementById("level")?.value || "",
      wisdomScore: document.getElementById("wis")?.value || "10",
      charismaScore: document.getElementById("cha")?.value || "10"
    }).filter(spec => spec.target.type === "builtIn").map(spec => ({
      ...spec,
      note: spec.kind === "points"
        ? `顯示目前剩餘點數。${spec.recoveryNote}`
        : `${spec.recoveryNote}`
    }));
  }

  function renderSpellSlots(target) {
    if (!(target instanceof HTMLElement)) return 0;
    const management = document.getElementById("spell-slot-management-wrap");
    if (!management || management.classList.contains("is-hidden")) {
      target.replaceChildren();
      return 0;
    }

    const groups = [1, 2, 3, 4].flatMap(ring => {
      const row = document.getElementById(`spellslot${ring}-row`);
      if (!row || row.style.display === "none") return [];
      const canonicalInputs = Array.from(row.querySelectorAll('input[type="checkbox"][id]'))
        .filter(input => !input.disabled && !input.hidden && input.style.display !== "none");
      return canonicalInputs.length ? [{
        label: `${["一", "二", "三", "四"][ring - 1]}環`,
        note: "勾選表示已消耗。",
        canonicalInputs
      }] : [];
    });
    target.replaceChildren(...groups.map(group => createSpellSlotMirrors(
      group.label,
      group.canonicalInputs
    )));
    return groups.length;
  }

  function renderBuiltInResources() {
    if (!elements.builtInResources) return;
    const focusedRest = document.activeElement?.dataset?.rest;
    const rows = [];
    const inspiration = createHeroicInspirationRow();
    const hitDice = createHitDiceRow();
    if (inspiration) rows.push(inspiration);
    if (hitDice) rows.push(hitDice);
    else {
      const note = createElement("div", "tabletop-inline-empty", "請先選擇職業與等級，之後即可追蹤生命骰。");
      rows.push(note);
    }

    const raceGroups = getRaceUseGroups();
    raceGroups.forEach(group => rows.push(createCanonicalUseRow(
      group.label,
      group.note,
      group.canonicalInputs
    )));

    getAutomaticResourceSpecs().forEach(spec => {
      const resource = spec.key === "druid-natural-recovery-spell-slots" && globalScope.TabletopDruid
        ? globalScope.TabletopDruid.createNaturalRecoveryRow()
        : spec.kind === "points"
        ? createPointPoolRow(spec)
        : createStoredUseRow(spec);
      if (resource) rows.push(resource);
    });

    elements.builtInResources.replaceChildren(...rows);
    if (focusedRest) elements.builtInResources.querySelector(`[data-rest="${focusedRest}"]`)?.focus({ preventScroll: true });
  }

  function createOnboardingResourcePreview(key) {
    if (key === "hit-dice") {
      const current = Array.from(elements.builtInResources?.querySelectorAll(".tabletop-resource-row") || [])
        .find(row => row.querySelector("h4")?.textContent.startsWith("生命骰"));
      if (current) {
        const preview = current.cloneNode(true);
        preview.querySelectorAll("input, button").forEach(control => { control.disabled = true; });
        return preview;
      }
      const { row, controls } = createResourceRow("生命骰", "手動追蹤目前剩餘顆數。");
      row.classList.add("tabletop-resource-row--counter");
      const value = createElement("output", "tabletop-number-stepper__value", "1／1");
      value.setAttribute("aria-label", "生命骰 1/1（教學示例）");
      controls.classList.add("tabletop-resource-stepper");
      controls.appendChild(value);
      return row;
    }
    if (key !== "bard-inspiration") return null;
    const spec = globalScope.getCharacterResourceSpecs?.({
      className: "bard",
      level: Math.max(1, Number.parseInt(document.getElementById("level")?.value || "1", 10) || 1),
      charismaScore: document.getElementById("cha")?.value || "10"
    }).find(item => item.key === key);
    if (!spec) return null;
    const row = createStoredUseRow({ ...spec, note: spec.recoveryNote })?.cloneNode(true);
    row?.querySelectorAll("input, button").forEach(control => { control.disabled = true; });
    return row;
  }

  function announce(message) {
    if (!elements.status) return;
    elements.status.textContent = "";
    requestAnimationFrame(() => { elements.status.textContent = message; });
  }

  function closeCustomResourceForm({ restoreFocus = true } = {}) {
    elements.customForm.hidden = true;
    elements.customAdd.setAttribute("aria-expanded", "false");
    elements.customAdd.textContent = "新增資源";
    elements.customError.textContent = "";
    [elements.customLabel, elements.customCurrent, elements.customMax].forEach(input => {
      input.removeAttribute("aria-invalid");
    });
    elements.customForm.reset();
    elements.customId.value = "";
    if (restoreFocus) elements.customAdd.focus();
  }

  function openCustomResourceForm(resource = null) {
    elements.customForm.hidden = false;
    elements.customAdd.setAttribute("aria-expanded", "true");
    elements.customAdd.textContent = resource ? "取消編輯" : "收起表單";
    elements.customId.value = resource?.id || "";
    elements.customLabel.value = resource?.label || "";
    elements.customCurrent.value = String(resource?.current ?? 0);
    elements.customMax.value = String(resource?.max ?? 1);
    elements.customRecovery.value = resource?.recoveryNote || "";
    elements.customError.textContent = "";
    elements.customLabel.focus();
  }

  function validateCustomResourceForm() {
    const label = elements.customLabel.value.trim();
    const current = Number(elements.customCurrent.value);
    const maximum = Number(elements.customMax.value);
    [elements.customLabel, elements.customCurrent, elements.customMax].forEach(input => input.removeAttribute("aria-invalid"));

    if (!label) {
      elements.customLabel.setAttribute("aria-invalid", "true");
      elements.customError.textContent = "請輸入資源名稱。";
      elements.customLabel.focus();
      return null;
    }
    if (!Number.isSafeInteger(maximum) || maximum < 1 || maximum > CUSTOM_RESOURCE_MAX) {
      elements.customMax.setAttribute("aria-invalid", "true");
      elements.customError.textContent = `最大值必須是 1～${CUSTOM_RESOURCE_MAX} 的整數。`;
      elements.customMax.focus();
      return null;
    }
    if (!Number.isSafeInteger(current) || current < 0 || current > maximum) {
      elements.customCurrent.setAttribute("aria-invalid", "true");
      elements.customError.textContent = `目前值必須是 0～${maximum} 的整數。`;
      elements.customCurrent.focus();
      return null;
    }
    return {
      label,
      current,
      max: maximum,
      recoveryNote: elements.customRecovery.value.trim()
    };
  }

  function handleCustomResourceSubmit(event) {
    event.preventDefault();
    const values = validateCustomResourceForm();
    if (!values) return;
    const resourceId = elements.customId.value;
    const succeeded = resourceId
      ? globalScope.TabletopMode?.updateCustomResource(resourceId, values)
      : globalScope.TabletopMode?.addCustomResource(values);
    if (!succeeded) {
      elements.customError.textContent = resourceId
        ? "無法更新這筆資源，請重新整理後再試。"
        : "自訂資源已達 50 筆上限，請先刪除不再使用的項目。";
      return;
    }
    closeCustomResourceForm({ restoreFocus: false });
    elements.customAdd.focus();
  }

  function createCustomResourceItem(resource) {
    const item = createElement("article", "tabletop-custom-resource");
    item.dataset.customResourceId = resource.id;
    const heading = createElement("div", "tabletop-custom-resource__heading");
    const copy = createElement("div");
    copy.appendChild(createElement("h4", "", resource.label));
    if (resource.recoveryNote) copy.appendChild(createElement("p", "", resource.recoveryNote));
    heading.append(copy);

    const stepper = createElement("div", "tabletop-custom-resource__stepper");
    const counter = createElement("div", "tabletop-number-stepper");
    const decrease = createElement("button", "tabletop-number-stepper__adjust", "−");
    decrease.type = "button";
    decrease.disabled = resource.current <= 0;
    decrease.setAttribute("aria-label", `${resource.label}減少 1`);
    decrease.addEventListener("click", () => {
      globalScope.TabletopMode?.setCustomResourceCurrent(resource.id, resource.current - 1);
      announce(`${resource.label}已減少為 ${Math.max(0, resource.current - 1)}。`);
    });
    const current = createElement(
      "button",
      "tabletop-number-stepper__value",
      formatResourceAmount(resource.current, resource.max)
    );
    current.type = "button";
    current.setAttribute("aria-haspopup", "dialog");
    current.setAttribute(
      "aria-label",
      `${resource.label}剩餘 ${resource.current}/${resource.max}；點擊直接設定`
    );
    current.addEventListener("click", async () => {
      const latest = globalScope.TabletopMode?.getCustomResources?.()
        .find(item => item.id === resource.id);
      if (!latest) return;
      const next = await requestResourceValue({
        label: latest.label,
        current: latest.current,
        maximum: latest.max,
        trigger: current
      });
      if (next === false) return;
      globalScope.TabletopMode?.setCustomResourceCurrent(resource.id, next);
      announce(`${latest.label}已設定為 ${next}。`);
    });

    const increase = createElement("button", "tabletop-number-stepper__adjust", "+");
    increase.type = "button";
    increase.disabled = resource.current >= resource.max;
    increase.setAttribute("aria-label", `${resource.label}增加 1`);
    increase.addEventListener("click", () => {
      globalScope.TabletopMode?.setCustomResourceCurrent(resource.id, resource.current + 1);
      announce(`${resource.label}已增加為 ${Math.min(resource.max, resource.current + 1)}。`);
    });
    const refill = createElement("button", "tabletop-compact-button", "回滿");
    refill.type = "button";
    refill.disabled = resource.current >= resource.max;
    refill.setAttribute("aria-label", `只將${resource.label}回滿`);
    refill.addEventListener("click", () => {
      globalScope.TabletopMode?.setCustomResourceCurrent(resource.id, resource.max);
      announce(`${resource.label}已回滿。`);
    });
    counter.append(decrease, current, increase);
    stepper.append(counter, refill);
    const meter = createResourceMeter(resource.current, resource.max);

    const actions = createElement("div", "tabletop-custom-resource__actions");
    const edit = createElement("button", "tabletop-compact-button", "編輯");
    edit.type = "button";
    edit.addEventListener("click", () => openCustomResourceForm(resource));
    const remove = createElement("button", "tabletop-compact-button tabletop-danger-button", "刪除");
    remove.type = "button";
    remove.addEventListener("click", async () => {
      const confirmed = await globalScope.AppDialog?.requestDecision({
        title: `刪除「${resource.label}」`,
        message: "這會從角色資料移除這筆手動資源，且無法復原。其他角色欄位不受影響。",
        cancelLabel: "取消",
        confirmLabel: "刪除資源",
        intent: "danger",
        dismissOnBackdrop: false,
        trigger: remove
      });
      if (!confirmed) return;
      globalScope.TabletopMode?.removeCustomResource(resource.id);
      announce(`已刪除${resource.label}。`);
      globalScope.requestAnimationFrame(() => {
        elements.customAdd?.focus({ preventScroll: true });
      });
    });
    actions.append(edit, remove);
    item.append(heading, stepper, meter, actions);
    return item;
  }

  function renderCustomResources() {
    if (!elements.customList) return;
    const resources = globalScope.TabletopMode?.getCustomResources?.() || [];
    if (!resources.length) {
      const empty = createElement("div", "tabletop-empty-state");
      empty.append(
        createElement("strong", "", "還沒有自訂資源"),
        createElement("p", "", "新增可手動追蹤的次數或點數。")
      );
      elements.customList.replaceChildren(empty);
      return;
    }
    elements.customList.replaceChildren(...resources.map(createCustomResourceItem));
  }

  function render() {
    if (!initialized) return;
    renderBuiltInResources();
    renderCustomResources();
  }

  function scheduleRender() {
    if (scheduledRender) cancelAnimationFrame(scheduledRender);
    scheduledRender = requestAnimationFrame(() => {
      scheduledRender = 0;
      render();
    });
  }

  function init() {
    Object.assign(elements, {
      builtInResources: document.getElementById("tabletop-built-in-resources"),
      customList: document.getElementById("tabletop-custom-resources"),
      customAdd: document.getElementById("tabletop-custom-resource-add"),
      customForm: document.getElementById("tabletop-custom-resource-form"),
      customId: document.getElementById("tabletop-custom-resource-id"),
      customLabel: document.getElementById("tabletop-custom-resource-label"),
      customCurrent: document.getElementById("tabletop-custom-resource-current"),
      customMax: document.getElementById("tabletop-custom-resource-max"),
      customRecovery: document.getElementById("tabletop-custom-resource-recovery"),
      customError: document.getElementById("tabletop-custom-resource-error"),
      customCancel: document.getElementById("tabletop-custom-resource-cancel"),
      status: document.getElementById("tabletop-resource-status")
    });
    if (!elements.builtInResources || !elements.customForm || !globalScope.TabletopMode) return;
    initialized = true;

    elements.customAdd.addEventListener("click", () => {
      if (elements.customForm.hidden) openCustomResourceForm();
      else closeCustomResourceForm();
    });
    elements.customCancel.addEventListener("click", () => closeCustomResourceForm());
    elements.customForm.addEventListener("submit", handleCustomResourceSubmit);
    document.addEventListener("change", scheduleRender);
    globalScope.addEventListener("tabletopstatechange", scheduleRender);
    globalScope.addEventListener("tabletop-panelchange", event => {
      if (event.detail?.panel === "resources" || event.detail?.panel === "spells") scheduleRender();
    });

    [document.getElementById("tab-basic"), document.getElementById("tab-spells")]
      .filter(Boolean)
      .forEach(root => {
        if (!globalScope.MutationObserver) return;
        new MutationObserver(scheduleRender).observe(root, {
          childList: true,
          subtree: true,
          attributes: true
        });
      });
    render();
  }

  globalScope.TabletopResources = Object.freeze({
    renderSpellSlots,
    setCanonicalCheckbox,
    createOnboardingResourcePreview,
    refresh: scheduleRender
  });

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", init);
  }
})(typeof window !== "undefined" ? window : globalThis);

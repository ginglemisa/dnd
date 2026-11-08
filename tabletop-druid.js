(function attachTabletopDruid(globalScope) {
  "use strict";

  // 跑團模式的德魯伊荒野形態介面。規則判斷與狀態都在 TabletopMode（getDruidContext、getDruidForm、commitDruidOperation），
  // 野獸數值經 BeastCatalog 讀取；這裡只負責畫面：總覽的形態狀態卡、其他分頁的細狀態列、變形與已知形態視窗、
  // 行動頁的野獸攻擊卡與資源頁的德魯伊資源列。
  const api = () => globalScope.TabletopMode;
  const context = () => api().getDruidContext();
  const form = () => api().getDruidForm();
  const labels = { shape: "荒野形態", end: "解除荒野形態", companion: "荒野夥伴", "end-companion": "移除荒野夥伴",
    aid: "大地之援", "resurge-shape": "野性復甦：恢復荒野形態", "resurge-slot": "野性復甦：恢復一環法術位",
    recover: "自然恢復", known: "管理已知形態" };
  // 職業頁「已知形態」的推薦（老鼠、騎乘馬、蜘蛛、狼）。
  const RECOMMENDED_FORMS = Object.freeze(["rat", "riding_horse", "spider", "wolf"]);
  const MOVEMENT_FILTERS = Object.freeze([["all", "全部"], ["fly", "飛行"], ["swim", "游泳"], ["climb", "攀爬"]]);
  const RECOVERY_LABELS = Object.freeze({ "recharge-5": "充能 5–6", "recharge-6": "充能 6", "long-rest": "長休恢復" });
  const STRIP_MOUNTS = Object.freeze({ skills: "tabletop-druid-skills", actions: "tabletop-druid-actions", spells: "tabletop-druid-spells" });
  let fieldSequence = 0;
  let scheduled = 0;

  function el(tag, text = "", className = "") {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function button(label, handler, disabled = false, className = "tabletop-compact-button") {
    const control = el("button", label, className);
    control.type = "button";
    control.disabled = disabled;
    control.addEventListener("click", () => handler(control));
    return control;
  }

  function primaryButton(label, handler, disabled = false) {
    return button(label, handler, disabled, "tabletop-compact-button tabletop-primary-button");
  }

  function tag(text, className = "") {
    return el("span", text, `druid-tag${className ? ` ${className}` : ""}`);
  }

  function selectField(target, label, options, value = "") {
    const row = el("label", label, "druid-field");
    const select = el("select");
    select.id = `druid-dialog-${++fieldSequence}`;
    select.dataset.stateTransient = "true";
    row.htmlFor = select.id;
    for (const item of options) {
      const option = el("option", item.label);
      option.value = item.value;
      option.disabled = Boolean(item.disabled);
      select.appendChild(option);
    }
    if (Array.from(select.options).some(option => option.value === value)) select.value = value;
    row.appendChild(select);
    target.appendChild(row);
    return select;
  }

  function checkField(target, label, checked = false) {
    const row = el("label", "", "druid-check");
    const input = el("input");
    input.type = "checkbox";
    input.checked = checked;
    input.dataset.stateTransient = "true";
    row.append(input, document.createTextNode(label));
    target.appendChild(row);
    return input;
  }

  const diceEnabled = () => Boolean(globalScope.DiceRoller?.isEnabled?.());
  const signed = value => globalScope.formatSignedValue(value);
  const crValue = cr => {
    const [numerator, denominator] = String(cr).split("/").map(Number);
    return denominator ? numerator / denominator : numerator;
  };

  // 已知形態中在荒野形態清單裡的（清單外的形態保留在存檔，但不顯示、不計入數量）。
  function visibleKnownForms(c = context()) {
    return c.druid.knownForms.filter(key => (globalScope.DruidBeastForms || []).some(item => item.key === key));
  }

  function availableForms(c = context()) {
    return (globalScope.DruidBeastForms || []).filter(item => globalScope.isDruidBeastAllowed(item, c.level));
  }

  function nameOf(key) {
    return globalScope.DruidBeastForms.find(item => item.key === key)?.label || key;
  }

  // 第一個能變成這種野獸的德魯伊等級（規則由 isDruidBeastAllowed 判斷）；沒有則為 0。
  function unlockLevel(item) {
    for (let level = 2; level <= 20; level += 1) if (globalScope.isDruidBeastAllowed(item, level)) return level;
    return 0;
  }

  function speedText(beast) {
    return Object.entries(beast.speeds).map(([label, feet]) => label === "步行" ? `${feet} 呎` : `${label} ${feet} 呎`).join("、");
  }

  function senseTexts(beast) {
    return (beast.senseList || []).map(sense => `${sense.label} ${sense.feet} 呎`);
  }

  function damageText(damage) {
    return damage.expression ? `${damage.expression} ${damage.type}` : `${damage.fixed} ${damage.type}`;
  }

  // 形態卡片的主要攻擊一行：「咬擊 +4・1d6+2 穿刺傷害」；沒有攻擊檢定的野獸列第一個動作名稱。
  function mainAttackLine(beast) {
    const attack = beast.actions.find(action => Number.isFinite(action.hit));
    if (!attack) return beast.actions[0]?.name || "";
    return `${attack.name} ${signed(attack.hit)}・${(attack.damage || []).map(damageText).join(" + ")}`;
  }

  function attackReachText(action) {
    const attack = action.attack || {};
    const distance = [attack.reach ? `觸及 ${attack.reach} 呎` : "", attack.range ? `射程 ${attack.range.join("／")} 呎` : ""].filter(Boolean).join("或");
    return [attack.kind, distance].filter(Boolean).join("・");
  }

  // 剩餘次數圓點：●●○ 2／3。
  function usagePips(c) {
    const pips = el("span", "", "druid-pips");
    const dots = el("span", "●".repeat(c.remaining) + "○".repeat(Math.max(0, c.rules.maximum - c.remaining)), "druid-pips__dots");
    dots.setAttribute("aria-hidden", "true");
    pips.append(dots, el("span", "荒野形態剩餘", "sr-only"), el("span", `${c.remaining}／${c.rules.maximum}`, "druid-pips__count"));
    return pips;
  }

  // 對話框標頭固定區的小字（已選數量、剩餘次數），清單捲動時仍看得到。
  function attachHeaderNote(content, note) {
    const title = content.closest(".app-dialog")?.querySelector(".app-dialog__header h2");
    if (!title) return;
    const group = el("div", "", "druid-dialog-title-group");
    title.before(group);
    group.append(title, note);
  }

  function rollButton(target, label, expression, text = label) {
    const control = button(text, () => globalScope.DiceRoller?.rollExpression(expression, { label }), !diceEnabled());
    control.setAttribute("aria-label", control.disabled ? `${label}；請先開啟擲骰系統` : `擲${label}`);
    target.append(control);
    return control;
  }

  function diceOffNote() {
    return el("p", "擲骰功能未開啟，按鈕無法點擊；可在右上選單開啟「開啟擲骰功能」。", "druid-dice-note");
  }

  // ---- 資源頁 ----

  // 自然恢復：短休恢復法術位（按鈕開視窗）與免費施法共用一列；兩個額度各自一個「已使用」勾選。
  function createNaturalRecoveryRow() {
    const key = "druid-natural-recovery-spell-slots";
    const used = Boolean(api().getBuiltInResourceSpent(key));
    const row = el("section", "", "tabletop-resource-row druid-resource-row druid-natural-recovery");
    row.dataset.resourceKey = key;
    const copy = el("div", "", "tabletop-resource-row__copy");
    const actions = el("div", "", "druid-resource-row__actions");
    actions.append(button("恢復法術位", trigger => openOperation("recover", trigger), used));
    copy.append(el("h4", "自然恢復"), el("p", "完成短休時恢復法術位（每次長休 1 次）；結社法術的免費施法另計，所有結社法術共用 1 次。"), actions);
    const controls = el("div", "", "tabletop-resource-row__controls druid-resource-row__checks");
    const checkbox = checkField(controls, "恢復法術位：已使用", used);
    checkbox.setAttribute("aria-label", "自然恢復：恢復法術位已使用");
    checkbox.addEventListener("change", () => api().setBuiltInResourceSpent(key, checkbox.checked ? 1 : 0, 1));
    const canonical = document.getElementById("druid-natural-recovery-used");
    if (canonical) {
      const free = checkField(controls, "免費施法：已使用", canonical.checked);
      free.setAttribute("aria-label", "自然恢復：免費施法已使用");
      free.addEventListener("change", () => globalScope.TabletopResources.setCanonicalCheckbox(canonical, free.checked));
    }
    row.append(copy, controls);
    return row;
  }

  // 野性復甦：兩種轉換都在同一列；勾選格只記錄「恢復一環法術位」的每次長休 1 次。
  function createWildResurgenceRow() {
    const key = "druid-wild-resurgence-spell-slot";
    const c = context();
    const used = Boolean(api().getBuiltInResourceSpent(key));
    const spentFirstLevel = c.slots.find(group => group.level === 1)?.controls.some(control => control.checked && !control.disabled);
    const row = el("section", "", "tabletop-resource-row druid-resource-row druid-wild-resurgence");
    row.dataset.resourceKey = key;
    const copy = el("div", "", "tabletop-resource-row__copy");
    const actions = el("div", "", "druid-resource-row__actions");
    actions.append(
      button("法術位 → 荒野形態", trigger => openOperation("resurge-shape", trigger), c.remaining !== 0 || c.incapacitated),
      button("荒野形態 → 1 環法術位", trigger => openOperation("resurge-slot", trigger), !c.remaining || used || !spentFirstLevel || c.incapacitated)
    );
    copy.append(el("h4", "野性復甦"), el("p", "無需動作。荒野形態用完時，可消耗 1 個法術位恢復 1 次（每回合 1 次）；也可消耗 1 次荒野形態恢復 1 個 1 環法術位（每次長休 1 次）。"), actions);
    const controls = el("div", "", "tabletop-resource-row__controls druid-resource-row__checks");
    const checkbox = checkField(controls, "荒野形態 → 1 環法術位：已使用", used);
    checkbox.setAttribute("aria-label", "野性復甦：荒野形態 → 1 環法術位已使用");
    checkbox.addEventListener("change", () => api().setBuiltInResourceSpent(key, checkbox.checked ? 1 : 0, 1));
    row.append(copy, controls);
    return row;
  }

  // 資源頁的德魯伊資源列（tabletop-resources.js 依資源 key 呼叫）；其他資源回傳 null，由資源頁的一般列處理。
  function createResourceRow(key) {
    if (key === "druid-natural-recovery-spell-slots") return createNaturalRecoveryRow();
    if (key === "druid-wild-resurgence-spell-slot") return createWildResurgenceRow();
    return null;
  }

  function spellSlotChoices(c) {
    return c.slots.flatMap(group => {
      const available = group.controls.filter(control => !control.checked && !control.disabled);
      return [{ value: available[0]?.id || `empty-${group.level}`, label: `${group.level} 環法術位（剩餘 ${available.length}）`, disabled: !available.length }];
    });
  }

  function recoveryChoices(content, c) {
    const controls = [];
    const total = el("p", "", "druid-resource-note");
    const spent = api().getBuiltInResourceSpent("druid-natural-recovery-spell-slots");
    content.append(el("p", `完成短休時可使用；環階總和上限 ${Math.ceil(c.level / 2)}，每個法術位低於 6 環。此額度與免費施法分開。`));
    if (c.level < 6 || spent) {
      content.append(el("p", c.level < 6 ? "6 級起可使用自然恢復。" : "自然恢復法術位額度已使用；長休恢復。"));
    } else for (const group of c.slots) {
      if (group.level >= 6) continue;
      group.controls.forEach((slot, index) => {
        if (!slot.checked || slot.disabled) return;
        const input = checkField(content, `${group.level} 環，第 ${index + 1} 格`);
        controls.push({ input, id: slot.id, level: group.level });
      });
    }
    const renderTotal = () => { total.textContent = `選擇環階總和：${controls.reduce((sum, item) => sum + (item.input.checked ? item.level : 0), 0)}／${Math.ceil(c.level / 2)}`; };
    controls.forEach(item => item.input.addEventListener("change", renderTotal));
    content.appendChild(total);
    renderTotal();
    return () => controls.filter(item => item.input.checked).map(item => item.id);
  }

  // ---- 視窗 ----

  function validateAndCommit(operation, selection, c, error) {
    const values = selection();
    if (values.acOverride !== undefined && values.acOverride !== null && (!Number.isInteger(values.acOverride) || values.acOverride < 0 || values.acOverride > 99)) {
      error.textContent = "AC 請輸入 0～99 的整數，或留空。"; return false;
    }
    const committed = api().commitDruidOperation(operation, values, c.token);
    if (!committed.ok) { error.textContent = committed.message; return false; }
    return committed;
  }

  function errorLine() {
    const error = el("p", "", "druid-error");
    error.setAttribute("role", "alert");
    return error;
  }

  async function openOperation(operation, trigger) {
    if (!api() || context().level < 2) return false;
    if (operation === "shape") return openShape(trigger);
    if (operation === "known") return openKnown(trigger);
    const c = context();
    const content = el("div", "", "druid-operation");
    const error = errorLine();
    let selection = () => ({});
    let confirmLabel = "確認使用";
    if (operation === "companion") {
      confirmLabel = "召喚荒野夥伴";
      content.append(el("p", "魔法動作：施放獲得魔寵，不需材料成分。魔寵為精類，完成長休後消失。高環位不提供額外效果。"));
      const slots = spellSlotChoices(c);
      const method = selectField(content, "消耗方式", [
        { value: "wild", label: `荒野形態 1 次（剩餘 ${c.remaining}／${c.rules.maximum}）`, disabled: !c.remaining },
        { value: "slot", label: "法術位 1 個", disabled: !slots.some(item => !item.disabled) }
      ], c.remaining ? "wild" : "slot");
      const slot = selectField(content, "法術位環階", slots);
      const update = () => { slot.closest("label").hidden = method.value !== "slot"; };
      method.addEventListener("change", update); update();
      selection = () => ({ method: method.value, slotId: slot.value });
      if (form()) content.append(el("p", "目前為荒野形態，請先解除後再施法。", "druid-error"));
    } else if (operation === "resurge-shape") {
      content.append(el("p", "無需動作；每回合一次，僅在荒野形態剩餘 0 次時可用。請確認本回合尚未使用。"));
      const slot = selectField(content, "消耗一個法術位，恢復一次荒野形態", spellSlotChoices(c));
      selection = () => ({ slotId: slot.value });
    } else if (operation === "resurge-slot") {
      content.append(el("p", "無需動作；消耗 1 次荒野形態，恢復 1 個已消耗的一環法術位。每次長休前只能使用 1 次。"));
    } else if (operation === "recover") {
      confirmLabel = "恢復所選法術位";
      const selectedSlots = recoveryChoices(content, c);
      selection = () => ({ slotIds: selectedSlots() });
    } else if (operation === "aid") {
      content.append(el("p", `魔法動作 · 消耗 1 次荒野形態（剩餘 ${c.remaining}）。60 呎內選一點，10 呎球形；指定生物對抗法術 DC ${document.getElementById("spell-save-dc")?.value || document.getElementById("spell-dc")?.value || "見法術頁"} 進行體質豁免，失敗受 ${c.rules.aidDice} 黯蝕傷害，成功減半；另指定其中一名生物回復 ${c.rules.aidDice} HP。`));
    } else if (operation === "end") {
      confirmLabel = "解除形態";
      content.append(el("p", "以附贈主動解除；也可用此入口記錄遊戲時間到期。恢復原形數據，不退還使用次數，不清除臨時 HP。掉落的裝備仍需自行拾回。"));
    } else if (operation === "end-companion") {
      content.append(el("p", "記錄荒野夥伴已消失；不退還已消耗的資源。"));
    }
    content.appendChild(error);
    const result = await globalScope.AppDialog.showContent({ title: labels[operation], content, trigger, confirmLabel, cancelLabel: "取消", dismissOnBackdrop: false,
      resolveConfirm: () => validateAndCommit(operation, selection, c, error) });
    if (!result?.ok) return false;
    globalScope.AppDialog.notify(`${labels[operation]}已完成。`, { tone: "success" });
    if (operation === "aid") await showAidRolls(result.aidDice, trigger);
    return true;
  }

  // 變形：沒有可用的已知形態時，視窗內說明並提供「選擇已知形態」；選完回到變形視窗。
  async function openShape(trigger) {
    if (!api() || context().level < 2) return false;
    for (;;) {
      const result = await shapeDialog(trigger);
      if (result !== "known") return Boolean(result?.ok);
      const saved = await openKnown(trigger);
      if (!saved && !availableForms().some(item => context().druid.knownForms.includes(item.key))) return false;
    }
  }

  function createFormCard(item, c, name) {
    const beast = globalScope.BeastCatalog.get(item.key);
    const card = el("label", "", "druid-form-card");
    card.dataset.beast = item.key;
    const input = el("input", "", "druid-form-card__input");
    input.type = "radio";
    input.name = name;
    input.value = item.key;
    input.dataset.stateTransient = "true";
    const head = el("span", "", "druid-form-card__head");
    head.append(el("strong", item.label, "druid-form-card__name"), el("span", `CR ${item.cr}・${beast.size_type}`, "druid-form-card__meta"));
    if (form()?.key === item.key) head.append(tag("目前形態", "druid-tag--current"));
    const tags = el("span", "", "druid-tags");
    tags.append(tag(`AC ${beast.ac}`), tag(`速度 ${speedText(beast)}`), ...senseTexts(beast).map(text => tag(text)));
    card.append(input, head, tags, el("span", mainAttackLine(beast), "druid-form-card__attack"));
    if (beast.summary) card.append(el("span", beast.summary, "druid-form-card__summary"));
    return { key: item.key, label: item.label, card, input };
  }

  function equipmentSummary(equipment, override) {
    const names = { armor: "護甲", main: "主手", off: "副手", other: "其他裝備" };
    const verbs = { drop: "掉落", wear: "穿戴" };
    const changed = Object.entries(equipment).filter(([, select]) => select.value !== "merge").map(([key, select]) => `${names[key]}${verbs[select.value]}`);
    if (override.value !== "") changed.push(`AC ${override.value}`);
    return changed.length ? changed.join("、") : "目前全部融入";
  }

  // 變形視窗：已知形態卡片（可比較），下方一行變形後效果；裝備與 AC 裁定收在預設收合的「進階」。
  async function shapeDialog(trigger) {
    const c = context();
    const visible = visibleKnownForms(c);
    const known = availableForms(c).filter(item => c.druid.knownForms.includes(item.key));
    const title = "變成哪一種？";
    const headerNote = el("p", `附贈・剩 ${c.remaining}／${c.rules.maximum}`, "druid-known-count druid-shape-remaining");
    if (!known.length || visible.length > c.rules.known) {
      const content = el("div", "", "druid-operation druid-shape-empty");
      content.append(el("p", visible.length > c.rules.known
        ? `已知形態有 ${visible.length} 種，超過目前上限 ${c.rules.known} 種。請先調整已知形態，再變形。`
        : "還沒有可用的已知形態。先選好已知的野獸，就能在這裡變形。"));
      const decision = globalScope.AppDialog.showContent({ title, content, trigger,
        actions: [{ label: "取消", value: false }, { label: "選擇已知形態", value: "known", intent: "primary" }] });
      attachHeaderNote(content, headerNote);
      return decision;
    }
    const content = el("div", "", "druid-operation druid-shape");
    const error = errorLine();
    const manage = el("div", "", "druid-shape__known");
    manage.append(el("span", `已知形態 ${visible.length}／${c.rules.known}`));
    const manageButton = el("button", "管理已知形態", "druid-text-button");
    manageButton.type = "button";
    manage.append(manageButton);
    const list = el("div", "", "druid-form-cards");
    list.setAttribute("role", "radiogroup");
    list.setAttribute("aria-label", "已知形態");
    const groupName = `druid-shape-${++fieldSequence}`;
    const cards = known.map(item => createFormCard(item, c, groupName));
    let selected = cards.some(card => card.key === c.druid.formKey) ? c.druid.formKey : cards[0].key;
    list.append(...cards.map(card => card.card));
    const effects = el("p", `變形後：臨時 HP ${c.level}・最長 ${c.rules.hours} 小時・不能施法（專注保留）`, "druid-shape__effects");
    content.append(manage, list, effects);
    const temporaryHp = api().collectState().temporaryHp;
    const keep = temporaryHp > 0 ? checkField(content, `保留目前的 ${temporaryHp} 點臨時 HP（不勾選則換成 ${c.level} 點，不相加）`, temporaryHp >= c.level) : null;

    const advanced = el("details", "", "druid-advanced");
    const summary = el("summary");
    const advancedBody = el("div", "", "druid-advanced__body");
    advanced.append(summary, advancedBody);
    advancedBody.append(el("p", "裝備是否能穿戴由 DM 依體型與構造判定。融入／掉落的護甲與武器不套用；其他裝備特殊效果請依實際裁定。"));
    const main2Shield = globalScope.isEffectiveEquippedShield?.() && document.getElementById("offHandAsMain")?.checked;
    const equipment = {};
    for (const [key, label, field] of [["armor", "護甲", "armor"], ["main", "主手", "mainHand"], ["off", "副手", "offHand"], ["other", "其他裝備", ""]]) {
      const equipped = key === "off" && main2Shield ? "盾牌" : (field ? document.getElementById(field)?.value || "" : "");
      // 沒裝備的欄位不列出，送出「融入」（沒有東西可穿戴或掉落）。
      if (field && !equipped) { equipment[key] = { value: "merge" }; continue; }
      equipment[key] = selectField(advancedBody, `${label}${equipped ? `：${equipped}` : ""}`, [
        { value: "merge", label: "融入（不生效）" }, { value: "drop", label: "掉落（不生效）" }, { value: "wear", label: "穿戴／持用（DM 同意）" }
      ], c.druid.equipment[key]);
    }
    const overrideLabel = el("label", "AC 裁定值（選填；留空自動計算野獸／穿戴護甲與盾牌）", "druid-field");
    const override = el("input");
    override.type = "number"; override.min = "0"; override.max = "99"; override.step = "1";
    override.dataset.stateTransient = "true";
    overrideLabel.appendChild(override); advancedBody.appendChild(overrideLabel);
    const updateSummary = () => { summary.textContent = `進階：裝備與 AC 裁定（${equipmentSummary(equipment, override)}）`; };
    advancedBody.addEventListener("change", updateSummary);
    advancedBody.addEventListener("input", updateSummary);
    updateSummary();
    content.append(advanced, error);

    const decision = globalScope.AppDialog.showContent({ title, trigger, cancelLabel: "取消", confirmLabel: "變形", dismissOnBackdrop: false,
      renderContent(body, controls) {
        body.appendChild(content);
        manageButton.addEventListener("click", () => controls.close("known"));
      },
      resolveConfirm: () => validateAndCommit("shape", () => ({ key: selected,
        equipment: Object.fromEntries(Object.entries(equipment).map(([key, input]) => [key, input.value])),
        acOverride: override.value === "" ? null : Number(override.value), keepTemporaryHp: Boolean(keep?.checked) }), c, error)
    });
    attachHeaderNote(content, headerNote);
    const confirm = content.closest(".app-dialog")?.querySelector(".app-dialog__actions .app-dialog__button--primary");
    const select = key => {
      selected = key;
      cards.forEach(card => { card.input.checked = card.key === key; card.card.classList.toggle("is-selected", card.key === key); });
      const label = cards.find(card => card.key === key)?.label || "";
      if (confirm) confirm.textContent = `變成${label}`;
    };
    cards.forEach(card => card.input.addEventListener("change", () => { if (card.input.checked) select(card.key); }));
    select(selected);
    const result = await decision;
    if (result?.ok) globalScope.AppDialog.notify(`已變成${nameOf(selected)}。`, { tone: "success" });
    return result;
  }

  // 管理已知形態：依 CR 分組、依移動方式篩選；點名字在原地展開野獸資料卡；等級不夠的形態上鎖並標出解鎖等級。
  async function openKnown(trigger) {
    if (!api() || context().level < 2) return false;
    const c = context();
    const content = el("div", "", "druid-operation druid-known");
    const error = errorLine();
    content.append(el("p", `目前可知 ${c.rules.known} 種形態；升級可增加，長休可替換 1 種。此處也可修正誤選。`, "druid-known__intro"));
    const count = el("p", "", "druid-known-count");
    count.setAttribute("role", "status");
    const toolbar = el("div", "", "druid-known-toolbar");
    const filters = el("div", "", "druid-filters");
    filters.setAttribute("role", "group");
    filters.setAttribute("aria-label", "依移動方式篩選");
    const recommend = el("button", "套用推薦組合", "druid-chip druid-chip--recommend");
    recommend.type = "button";
    toolbar.append(filters, recommend);
    content.append(toolbar);

    const forms = [...(globalScope.DruidBeastForms || [])].sort((a, b) => crValue(a.cr) - crValue(b.cr));
    const groups = new Map();
    for (const item of forms) {
      if (!groups.has(item.cr)) groups.set(item.cr, []);
      groups.get(item.cr).push(item);
    }
    const rows = [];
    const sections = [];
    for (const [cr, items] of groups) {
      const section = el("section", "", "druid-known-group");
      const heading = el("h3", `CR ${cr}`, "druid-known-group__title");
      const list = el("div", "", "druid-known-list");
      for (const item of items) {
        const allowed = globalScope.isDruidBeastAllowed(item, c.level);
        const rules = globalScope.BeastCatalog.getRules(item.key) || {};
        const speed = rules.speed || {};
        const row = el("div", "", `druid-known-form${allowed ? "" : " is-locked"}`);
        row.dataset.beast = item.key;
        const input = checkField(row, "", allowed && c.druid.knownForms.includes(item.key));
        input.setAttribute("aria-label", `已知形態：${item.label}`);
        input.disabled = !allowed;
        const name = button(item.label, () => toggleDetail(), false, "druid-beast-name");
        name.setAttribute("aria-expanded", "false");
        const detail = el("div", "", "druid-known-detail");
        detail.id = `druid-known-detail-${++fieldSequence}`;
        detail.hidden = true;
        name.setAttribute("aria-controls", detail.id);
        const tags = el("span", "", "druid-tags");
        for (const [type, label] of MOVEMENT_FILTERS.slice(1)) if (speed[type]) tags.append(tag(label));
        if (!allowed) {
          const lock = tag("", "druid-tag--locked");
          const level = unlockLevel(item);
          lock.append(el("span", "🔒", "druid-tag__icon"), document.createTextNode(level ? ` ${level} 級解鎖` : " 無法變形"));
          lock.firstChild.setAttribute("aria-hidden", "true");
          tags.append(lock);
        }
        function toggleDetail() {
          const open = detail.hidden;
          if (open && !detail.firstChild) detail.append(globalScope.createBeastCard(item.key) || el("p", "找不到野獸資料。"));
          detail.hidden = !open;
          name.setAttribute("aria-expanded", String(open));
        }
        row.append(name, tags, detail);
        list.appendChild(row);
        rows.push({ key: item.key, input, row, speed, section });
      }
      section.append(heading, list);
      sections.push(section);
      content.appendChild(section);
    }
    content.appendChild(error);

    const update = () => {
      const selected = rows.filter(item => item.input.checked).length;
      count.textContent = `已選 ${selected}／${c.rules.known}`;
      count.classList.toggle("is-over-limit", selected > c.rules.known);
    };
    rows.forEach(item => item.input.addEventListener("change", update));
    let filter = "all";
    const filterButtons = MOVEMENT_FILTERS.map(([value, label]) => {
      const chip = el("button", label, "druid-chip");
      chip.type = "button";
      chip.addEventListener("click", () => applyFilter(value));
      filters.appendChild(chip);
      return { value, chip };
    });
    function applyFilter(value) {
      filter = value;
      filterButtons.forEach(item => item.chip.setAttribute("aria-pressed", String(item.value === value)));
      rows.forEach(item => { item.row.hidden = value !== "all" && !item.speed[value]; });
      sections.forEach(section => { section.hidden = rows.every(item => item.section !== section || item.row.hidden); });
    }
    recommend.addEventListener("click", () => {
      rows.forEach(item => { if (!item.input.disabled) item.input.checked = RECOMMENDED_FORMS.includes(item.key); });
      update();
    });
    applyFilter(filter);
    update();

    const decision = globalScope.AppDialog.showContent({ title: labels.known, content, trigger, confirmLabel: "儲存已知形態", cancelLabel: "取消", dismissOnBackdrop: false,
      resolveConfirm: () => validateAndCommit("known", () => ({ keys: rows.filter(item => item.input.checked).map(item => item.key) }), c, error) });
    attachHeaderNote(content, count);
    const result = await decision;
    if (!result?.ok) return false;
    globalScope.AppDialog.notify(`${labels.known}已完成。`, { tone: "success" });
    return true;
  }

  async function showBeastCard(trigger) {
    const beast = form();
    if (!beast) return;
    const content = el("div", "", "druid-beast-card");
    content.append(globalScope.createBeastCard(beast.key) || el("p", "找不到野獸資料。"));
    await globalScope.AppDialog.showContent({ title: `${nameOf(beast.key)}的資料`, content, trigger, actions: [{ label: "關閉", value: "close" }] });
  }

  async function showAidRolls(dice, trigger) {
    const content = el("div", "", "druid-operation");
    content.append(el("p", "已消耗一次荒野形態。以下只擲結果，不再次扣次數；治療不會自動套用到自己。豁免成功時傷害減半。"));
    const row = el("div", "", "druid-button-row");
    rollButton(row, `大地之援：${dice} 黯蝕傷害`, dice);
    rollButton(row, `大地之援：${dice} 治療`, dice);
    content.append(row);
    if (!diceEnabled()) content.append(diceOffNote());
    await globalScope.AppDialog.showContent({ title: "大地之援結果", content, trigger, actions: [{ label: "完成", value: "close" }] });
  }

  async function primalStrike(trigger) {
    const content = el("div", "", "druid-operation");
    content.append(el("p", "每個自己的回合一次，武器或野獸形態攻擊命中後，額外造成 1d8 傷害。請自行確認本回合尚未使用。"));
    const type = selectField(content, "傷害類型", ["冷凍", "火焰", "閃電", "雷鳴"].map(value => ({ value, label: value })));
    await globalScope.AppDialog.showContent({ title: "原初打擊", content, trigger, confirmLabel: "擲額外傷害", cancelLabel: "取消",
      resolveConfirm() {
        if (context().level < 7 || !document.getElementById("druid-elemental-fury-primal-strike")?.checked || !diceEnabled()) return false;
        globalScope.DiceRoller.rollExpression("1d8", { label: `原初打擊：${type.value}` });
        return true;
      }
    });
  }

  // ---- 行動頁 ----

  // 「可用選項」只列沒有攻擊檢定的野獸動作（多重攻擊、蛛網、墨雲等）；攻擊只在上方的攻擊卡出現一次。
  // 動作 key（druid-beast-<key>-<id>）與偏好 key（official:<mode>:…）不變，隱藏偏好照常生效。
  function getActionOptions(mode) {
    const beast = form(), options = [];
    if (beast && mode === "bonus") options.push({ key: "druid-end-wild-shape", label: "解除荒野形態", description: "以附贈恢復原形，不退還使用次數。", druidOperation: "end", source: "職業" });
    for (const action of beast?.actions || []) {
      if (action.mode !== mode || Number.isFinite(action.hit)) continue;
      options.push({ key: `druid-beast-${beast.key}-${action.id}`, label: `${nameOf(beast.key)}：${action.name}`, description: action.text || "",
        beastActionId: action.id, source: "野獸形態" });
    }
    return options.map(option => ({ ...option, preferenceKey: `official:${mode}:${option.key}` }));
  }

  function appendActionControl(target, option) {
    if (option.beastActionId) {
      const beast = form();
      const action = beast?.actions.find(item => item.id === option.beastActionId);
      if (action) appendBeastAction(target, beast, action);
      return;
    }
    const c = context();
    const row = el("div", "", "druid-button-row");
    if (option.druidOperation === "end") {
      row.append(primaryButton("解除形態", trigger => openOperation("end", trigger), !form()));
      target.append(row);
      return;
    }
    const requiresWild = ["shape", "aid"].includes(option.druidOperation);
    const blocked = requiresWild && (!c.remaining || c.incapacitated)
      || option.druidOperation === "companion" && (Boolean(form()) || c.incapacitated);
    target.append(el("p", `荒野形態剩餘 ${c.remaining}／${c.rules.maximum}`, "druid-resource-note"));
    const label = option.druidOperation === "shape" ? (form() ? "更換形態" : "變形") : labels[option.druidOperation];
    row.append(primaryButton(label, trigger => openOperation(option.druidOperation, trigger), blocked));
    if (requiresWild && c.remaining === 0 && c.level >= 5) row.append(button("野性復甦：恢復次數", trigger => openOperation("resurge-shape", trigger), c.incapacitated));
    target.append(row);
    if (option.druidOperation === "companion") {
      if (form()) target.append(el("p", "荒野形態期間不能施法。"));
      appendCompanionSpell(target);
    }
  }

  // 荒野夥伴施放的是獲得魔寵：按鈕下方附法術說明，不必另外開視窗查。
  function appendCompanionSpell(target) {
    const spell = globalScope.SpellCatalog?.getSpell("find-familiar");
    const view = spell && globalScope.TabletopSpells?.createSpellDescriptionView?.(spell, { wildCompanion: true });
    if (!view) return;
    const section = el("section", "", "druid-companion-spell");
    const title = el("p", "", "druid-companion-spell__title");
    title.append(el("strong", spell.nameZh), el("span", spell.nameEn, "tabletop-spell-detail__english"));
    section.append(title, view);
    target.append(section);
  }

  const isUsed = (beast, action) => context().druid.beastUsed.includes(`${beast.key}:${action.id}`);

  // 充能／每日能力：「已使用」勾選（勾＝使用、取消＝恢復），充能另有「擲充能」；比照資源頁的勾選做法。
  function createRecoveryControls(beast, action) {
    const used = isUsed(beast, action);
    const wrap = el("div", "", "druid-beast-recovery");
    const limit = RECOVERY_LABELS[action.recovery] || `每天 ${action.uses || 1} 次`;
    wrap.append(tag(limit, "druid-tag--recovery"));
    const checkbox = checkField(wrap, "已使用", used);
    checkbox.setAttribute("aria-label", `${action.name}已使用`);
    checkbox.addEventListener("change", () => {
      const result = api().commitDruidOperation(checkbox.checked ? "beast-use" : "beast-recharge", { actionId: action.id }, context().token);
      if (!result.ok) {
        checkbox.checked = !checkbox.checked;
        globalScope.AppDialog.notify(result.message, { tone: "error" });
      }
    });
    if (action.recovery.startsWith("recharge")) rollButton(wrap, `${action.name}充能（${action.recovery === "recharge-5" ? "5–6" : "6"} 成功）`, "1d6", "擲充能");
    if (used) wrap.append(el("p", action.recovery.startsWith("recharge") ? "回合開始擲出充能後，取消勾選即可再用。" : "符合恢復條件後取消勾選。", "druid-beast-recovery__hint"));
    return wrap;
  }

  // 「可用選項」裡的野獸動作（沒有攻擊檢定）：豁免、傷害擲骰與使用限制。
  function appendBeastAction(target, beast, action) {
    const used = action.recovery && isUsed(beast, action);
    const controls = el("div", "", "druid-beast-action-controls");
    if (action.recovery) controls.append(createRecoveryControls(beast, action));
    const rolls = el("div", "", "druid-button-row");
    for (const damage of action.damage || []) {
      if (damage.expression) rollButton(rolls, `${action.name}：${damage.expression} ${damage.type}`, damage.expression).disabled ||= Boolean(used);
      else rolls.append(el("span", `${damage.type} ${damage.fixed}（固定）`));
    }
    for (const item of action.conditional || []) rollButton(rolls, `${item.name} ${item.expression}（條件成立時）`, item.expression).disabled ||= Boolean(used);
    if (rolls.childElementCount) controls.append(rolls);
    if (!diceEnabled() && (rolls.querySelector("button") || action.recovery?.startsWith("recharge"))) controls.append(diceOffNote());
    if (!action.damage && !action.recovery) controls.append(el("p", "依上方說明操作；不自動判定目標或移動。", "druid-resource-note"));
    target.appendChild(controls);
  }

  function weaponField(list, term, ...children) {
    const item = el("div", "", "tabletop-weapon-field");
    const description = el("dd");
    description.append(...children);
    item.append(el("dt", term, "sr-only"), description);
    list.appendChild(item);
    return item;
  }

  function inlineRoll(text, label, roll, disabled) {
    const control = el("button", text, "tabletop-inline-roll");
    control.type = "button";
    control.disabled = disabled || !diceEnabled();
    control.setAttribute("aria-label", !diceEnabled() ? `${label}；請先開啟擲骰系統` : `擲${label}`);
    control.addEventListener("click", roll);
    return control;
  }

  // 野獸攻擊卡：和武器卡同一個骨架（名稱、命中、傷害、備註），備註是攻擊方式與動作自己的短效果句。
  function createBeastAttackCard(beast, action) {
    const used = Boolean(action.recovery && isUsed(beast, action));
    const card = el("section", "", "weapon-attack-card tabletop-weapon-attack-card druid-beast-attack-card");
    card.dataset.beastAction = action.id;
    card.setAttribute("aria-label", `${action.name}野獸攻擊`);
    const list = el("dl", "", "weapon-attack-fields tabletop-weapon-fields");
    const rollLabel = `${nameOf(beast.key)}${action.name}`;
    weaponField(list, "名稱", el("span", action.name, "druid-beast-attack-card__name"));
    weaponField(list, "命中", inlineRoll(signed(action.hit), `${rollLabel}命中`, () => globalScope.DiceRoller?.roll?.({
      count: 1, sides: 20, modifier: action.hit, includeModifier: true, label: `${rollLabel}命中` }), used));
    weaponField(list, "傷害", ...(action.damage || []).map(damage => damage.expression
      ? inlineRoll(damageText(damage), `${rollLabel}傷害 ${damageText(damage)}`, () => globalScope.DiceRoller?.rollExpression?.(damage.expression, { label: `${rollLabel}：${damageText(damage)}` }), used)
      : el("span", damageText(damage), "druid-beast-attack-card__fixed")));
    const note = el("div", "", "druid-beast-attack-card__note");
    note.append(el("span", attackReachText(action), "druid-beast-attack-card__reach"));
    if (action.text) note.append(el("span", action.text, "druid-beast-attack-card__effect"));
    const extras = [];
    for (const item of action.conditional || []) {
      const row = el("div", "", "druid-button-row");
      rollButton(row, `${item.name} ${item.expression}（條件成立時）`, item.expression).disabled ||= used;
      extras.push(row);
    }
    if (action.recovery) extras.push(createRecoveryControls(beast, action));
    const noteField = weaponField(list, "備註", note, ...extras);
    noteField.classList.add("druid-beast-attack-card__note-field");
    card.append(list);
    return card;
  }

  function renderBeastWeapons(target, getWeaponData, createWeaponSummary) {
    const beast = form();
    if (!beast) return false;
    const c = context();
    const wrap = el("div", "", "druid-beast-attacks");
    wrap.append(el("h3", `${nameOf(beast.key)}的攻擊`, "druid-beast-attacks__title"));
    if (!diceEnabled()) wrap.append(diceOffNote());
    wrap.append(...beast.actions.filter(item => Number.isFinite(item.hit)).map(action => createBeastAttackCard(beast, action)));
    if (beast.traitList?.length) {
      const traits = el("div", "", "druid-beast-traits");
      traits.setAttribute("aria-label", `${nameOf(beast.key)}的特性`);
      traits.append(...beast.traitList.map(trait => {
        const item = el("section", "", "druid-beast-trait");
        item.append(el("strong", trait.name), el("p", trait.text));
        return item;
      }));
      wrap.append(traits);
    }
    const main2Shield = document.getElementById("offHandAsMain")?.checked === true
      && globalScope.isEffectiveEquippedShield?.();
    const hands = main2Shield ? ["main"] : ["main", "off"];
    const weapons = hands.filter(hand => c.druid.equipment[hand] === "wear").map(getWeaponData).filter(item => item.name && !globalScope.isShieldItem?.(item.name));
    target.replaceChildren(wrap, ...weapons.map(createWeaponSummary));
    if (weapons.length && !globalScope.isWeaponAttackAutomationEnabled?.()) target.append(el("p", "目前武器為手填模式，請依變形後屬性自行裁定武器加值；野獸攻擊可直接擲骰。"));
    return true;
  }

  // ---- 狀態卡與細狀態列 ----

  // 總覽的荒野形態狀態卡：原形時主按鈕「變形」，變形中主按鈕「解除形態」。
  function renderOverview(mount, c, beast) {
    mount.classList.toggle("is-shaped", Boolean(beast));
    const head = el("div", "", "druid-card__head");
    const heading = el("div", "", "druid-card__title");
    if (beast) {
      const title = el("h3");
      title.append(document.createTextNode(nameOf(beast.key)), el("span", beast.size_type, "druid-card__type"));
      heading.append(el("span", "荒野形態中", "tabletop-eyebrow"), title);
    } else {
      heading.append(el("span", "德魯伊・原形", "tabletop-eyebrow"), el("h3", "荒野形態"));
    }
    head.append(heading, usagePips(c));
    mount.append(head);
    if (beast) {
      const tags = el("div", "", "druid-tags");
      tags.append(...senseTexts(beast).map(text => tag(text)), ...(beast.traitList || []).map(trait => tag(trait.name)));
      const temporaryHp = api().collectState().temporaryHp;
      if (temporaryHp > 0) tags.append(tag(`臨時 HP ${temporaryHp}`, "druid-tag--hp"));
      if (tags.childElementCount) mount.append(tags);
      mount.append(el("p", `最長 ${c.rules.hours} 小時・不能施法・專注保留`, "druid-card__note"));
    } else {
      mount.append(el("p", `以附贈變成已知的野獸，最長 ${c.rules.hours} 小時，變形時獲得 ${c.level} 點臨時 HP。`, "druid-card__note"));
    }
    if (c.incapacitated) mount.append(el("p", "失能時無法使用荒野形態。", "druid-card__warning"));
    else if (!c.remaining) mount.append(el("p", "荒野形態已用完：短休恢復 1 次，長休全部恢復。", "druid-card__warning"));
    const actions = el("div", "", "druid-card__actions");
    if (beast) {
      const change = button("更換", trigger => openShape(trigger), !c.remaining || c.incapacitated);
      change.setAttribute("aria-label", "更換形態");
      actions.append(primaryButton("解除形態", trigger => openOperation("end", trigger)), change, button("野獸資料", showBeastCard));
    } else {
      actions.append(primaryButton("變形", trigger => openShape(trigger), !c.remaining || c.incapacitated),
        button(`已知形態 ${visibleKnownForms(c).length}／${c.rules.known}`, trigger => openKnown(trigger)));
    }
    if (!c.remaining && c.level >= 5) actions.append(button("野性復甦", trigger => openOperation("resurge-shape", trigger), c.incapacitated));
    mount.append(actions);
    if (c.druid.companion) {
      const companion = el("div", "", "druid-card__companion");
      companion.append(el("span", "荒野夥伴已召喚・精類・長休後消失"), button("移除夥伴", trigger => openOperation("end-companion", trigger)));
      mount.append(companion);
    }
  }

  // 其他分頁的細狀態列：變形中只有一行形態與次數＋「解除」；法術頁改成不能施法的警示列。
  // 行動頁另放元素狂怒的原初打擊（原形也顯示）。回傳是否有內容。
  function renderStrip(mount, panel, c, beast) {
    const primal = panel === "actions" && c.level >= 7 && document.getElementById("druid-elemental-fury-primal-strike")?.checked;
    mount.classList.toggle("druid-strip--warning", Boolean(beast) && panel === "spells");
    if (!beast && !primal) return false;
    const copy = el("p", "", "druid-strip__copy");
    if (beast) {
      copy.append(el("strong", `${nameOf(beast.key)}形態`),
        el("span", panel === "spells" ? "荒野形態中不能施法，專注照常維持" : `荒野形態 ${c.remaining}／${c.rules.maximum}`));
    } else copy.append(el("strong", "元素狂怒"));
    const actions = el("div", "", "druid-strip__actions");
    if (primal) actions.append(button("原初打擊 +1d8", primalStrike, !diceEnabled()));
    if (beast) {
      const end = button("解除", trigger => openOperation("end", trigger));
      end.setAttribute("aria-label", "解除荒野形態");
      actions.append(end);
    }
    mount.append(copy, actions);
    return true;
  }

  function render() {
    if (!api() || api().getMode() !== "tabletop") return;
    const panel = api().getPanel();
    const mount = document.getElementById(panel === "overview" ? "tabletop-druid-overview" : STRIP_MOUNTS[panel] || "");
    if (!mount) return;
    const c = context(), beast = form();
    mount.replaceChildren();
    if (c.level < 2) { mount.hidden = true; return; }
    if (panel === "overview") {
      renderOverview(mount, c, beast);
      mount.hidden = false;
    } else mount.hidden = !renderStrip(mount, panel, c, beast);
  }

  function scheduleRender(event) {
    if ((event?.type === "input" || event?.type === "change")
      && !api()?.isCharacterFieldEvent(event)) return;
    if (api()?.getMode() !== "tabletop" || scheduled) return;
    scheduled = requestAnimationFrame(() => { scheduled = 0; render(); });
  }

  // 行動頁「荒野形態」選項的規則說明（職業內容檔的跑團段落）：條列轉成清單，「變形規則」加粗。
  function renderShapeDescription(target, description) {
    target.classList.add("druid-shape-description");
    for (const block of String(description).split(/\n\n+/)) {
      if (block.startsWith("- ")) {
        const list = el("ul");
        block.split("\n").forEach(line => list.appendChild(el("li", line.replace(/^- /, ""))));
        target.appendChild(list);
      } else {
        const paragraph = el("p");
        paragraph.appendChild(el(block === "變形規則" ? "strong" : "span", block));
        target.appendChild(paragraph);
      }
    }
  }

  globalScope.TabletopDruid = Object.freeze({ openOperation, getActionOptions, appendActionControl, renderBeastWeapons, renderShapeDescription, createResourceRow, render, primalStrike });
  document.addEventListener("DOMContentLoaded", render);
  document.addEventListener("input", scheduleRender);
  document.addEventListener("change", scheduleRender);
  for (const event of ["tabletopstatechange", "tabletopmodechange", "modechange", "tabletop-panelchange", "dicerollmodechange"]) globalScope.addEventListener(event, scheduleRender);
})(window);

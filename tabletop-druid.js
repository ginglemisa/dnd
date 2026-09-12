(function attachTabletopDruid(globalScope) {
  "use strict";

  const api = () => globalScope.TabletopMode;
  const context = () => api().getDruidContext();
  const form = () => api().getDruidForm();
  const labels = { shape: "荒野形態", end: "解除荒野形態", companion: "荒野夥伴", "end-companion": "移除荒野夥伴",
    aid: "大地之援", "resurge-shape": "野性復甦：恢復荒野形態", "resurge-slot": "野性復甦：恢復一環法術位",
    recover: "自然恢復", known: "管理已知形態" };
  let fieldSequence = 0;
  let scheduled = 0;

  function el(tag, text = "", className = "") {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function button(label, handler, disabled = false) {
    const control = el("button", label, "tabletop-compact-button");
    control.type = "button";
    control.disabled = disabled;
    control.addEventListener("click", () => handler(control));
    return control;
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

  function availableForms(c = context()) {
    return (globalScope.DruidBeastForms || []).filter(item => globalScope.isDruidBeastAllowed(item, c.level));
  }

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

  // Reuse the shared beast tooltip markup inside the dialog so it remains interactive
  // while AppDialog makes the page behind it inert. No selection changes on inspection.
  function createKnownFormTooltip(content) {
    const popup = el("div", "", "druid-beast-tooltip");
    popup.hidden = true;
    popup.id = `druid-beast-tooltip-${++fieldSequence}`;
    popup.setAttribute("role", "region");
    popup.setAttribute("aria-label", "野獸資料");
    const close = button("關閉野獸資料", () => hide(true));
    const copy = el("div");
    popup.append(close, copy);
    content.appendChild(popup);
    let anchor = null;
    function hide(restoreFocus = false) {
      popup.hidden = true;
      globalScope.removeEventListener("keydown", onEscape, true);
      anchor?.setAttribute("aria-expanded", "false");
      if (restoreFocus) anchor?.focus();
    }
    function onEscape(event) {
      if (event.key === "Escape" && !popup.hidden) {
        event.preventDefault(); event.stopImmediatePropagation(); hide(true);
      }
    }
    content.addEventListener("click", event => {
      if (!popup.contains(event.target) && event.target !== anchor) hide();
    });
    const show = (key, trigger) => {
      if (anchor === trigger && !popup.hidden) { hide(); return; }
      hide();
      anchor = trigger;
      anchor.setAttribute("aria-expanded", "true");
      anchor.setAttribute("aria-controls", popup.id);
      copy.innerHTML = globalScope.renderBeastPopupHtml(globalScope.BeastCatalog.getStatBlock(key));
      popup.hidden = false;
      globalScope.addEventListener("keydown", onEscape, true);
      const rect = trigger.getBoundingClientRect();
      popup.style.left = `${Math.max(10, Math.min(rect.left, innerWidth - popup.offsetWidth - 10))}px`;
      popup.style.top = `${Math.max(10, Math.min(rect.bottom + 8, innerHeight - popup.offsetHeight - 10))}px`;
    };
    return { show, close: hide };
  }

  function createNaturalRecoveryRow() {
    const key = "druid-natural-recovery-spell-slots";
    const used = Boolean(api().getBuiltInResourceSpent(key));
    const row = el("section", "", "tabletop-resource-row druid-natural-recovery");
    row.dataset.resourceKey = key;
    const copy = el("div", "", "tabletop-resource-row__copy");
    copy.append(button("自然恢復", trigger => openOperation("recover", trigger), used), el("p", "短休啟動"));
    const controls = el("div", "", "tabletop-resource-row__controls");
    const checkbox = checkField(controls, "已使用", used);
    checkbox.setAttribute("aria-label", "自然恢復：恢復法術位已使用");
    checkbox.addEventListener("change", () => api().setBuiltInResourceSpent(key, checkbox.checked ? 1 : 0, 1));
    row.append(copy, controls);
    return row;
  }

  function nameOf(key) {
    return globalScope.DruidBeastForms.find(item => item.key === key)?.label || key;
  }

  function spellSlotChoices(c) {
    return c.slots.flatMap(group => {
      const available = group.controls.filter(control => !control.checked && !control.disabled);
      return [{ value: available[0]?.id || `empty-${group.level}`, label: `${group.level} 環法術位（剩餘 ${available.length}）`, disabled: !available.length }];
    });
  }

  function beastDetail(beast) {
    const content = el("div", "", "druid-beast-detail");
    if (!beast) return content;
    const c = context();
    const mental = ["int", "wis", "cha"].map((key, i) => `${["智", "感", "魅"][i]} ${document.getElementById(key)?.value || "10"}`);
    content.append(el("p", `${nameOf(beast.key)} · ${beast.size_type}（生物類型保留角色原值）`),
      el("p", `野獸 AC ${beast.ac} · ${beast.speed}`),
      el("p", `力 ${beast.abilities.str} · 敏 ${beast.abilities.dex} · 體 ${beast.abilities.con} · ${mental.join(" · ")}`),
      el("p", `保留角色 HP、生命骰、熟練、職業特性、語言與專長。最長 ${c.rules.hours} 小時，變形獲得 ${c.level} 點臨時 HP。`),
      el("p", `感官：${beast.senses}；被動察覺以桌邊總覽重算值為準。`),
      el("p", `特性：${beast.traits}`), el("p", `動作：${beast.attacks}`));
    return content;
  }

  async function showFormDetail(trigger) {
    const beast = form();
    if (!beast) return;
    await globalScope.AppDialog.showContent({ title: `荒野形態：${nameOf(beast.key)}`, content: beastDetail(beast), trigger,
      actions: [{ label: "關閉", value: "close" }] });
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

  async function openOperation(operation, trigger) {
    if (!api() || context().level < 2) return;
    if (operation === "shape" && (!context().druid.knownForms.length || context().druid.knownForms.length > context().rules.known)) {
      if (!await openOperation("known", trigger)) return;
    }
    const c = context();
    const content = el("div", "", "druid-operation");
    const error = el("p", "", "druid-error");
    error.setAttribute("role", "alert");
    let selection = () => ({});
    let closeTooltip = null;
    let confirmLabel = "確認使用";
    if (operation === "known") {
      confirmLabel = "儲存已知形態";
      content.append(el("p", `目前可知 ${c.rules.known} 種形態；升級可增加，長休可替換 1 種。此處也可修正誤選。`));
      const count = el("p");
      const grid = el("div", "", "druid-form-grid");
      const showBeastTip = createKnownFormTooltip(content);
      closeTooltip = showBeastTip.close;
      const checks = availableForms(c).map(item => {
        const row = el("div", "", "druid-known-form");
        const input = checkField(row, "", c.druid.knownForms.includes(item.key));
        input.setAttribute("aria-label", `已知形態：${item.label}`);
        const name = button(item.label, trigger => showBeastTip.show(item.key, trigger));
        name.className = "druid-beast-name";
        name.setAttribute("aria-expanded", "false");
        row.append(name, el("small", `CR ${item.cr}${item.hasFlight ? " · 飛行" : ""}`));
        grid.appendChild(row);
        return { key: item.key, input };
      });
      const update = () => { count.textContent = `已選 ${checks.filter(item => item.input.checked).length}／${c.rules.known}`; };
      checks.forEach(item => item.input.addEventListener("change", update));
      content.append(button("帶入推薦四種", () => { checks.forEach(item => { item.input.checked = ["rat", "riding_horse", "spider", "wolf"].includes(item.key); }); update(); }), count, grid);
      update();
      selection = () => ({ keys: checks.filter(item => item.input.checked).map(item => item.key) });
    } else if (operation === "shape") {
      confirmLabel = "消耗 1 次並變形";
      content.append(el("p", `附贈動作 · 荒野形態剩餘 ${c.remaining}／${c.rules.maximum}。更換形態同樣消耗 1 次。`));
      const known = availableForms(c).filter(item => c.druid.knownForms.includes(item.key));
      const choice = selectField(content, "選擇已知形態", known.map(item => ({ value: item.key, label: item.label })), c.druid.formKey);
      const preview = el("div");
      const update = () => preview.replaceChildren(beastDetail(globalScope.BeastCatalog.get(choice.value)));
      choice.addEventListener("change", update);
      content.appendChild(preview);
      update();
      const equipment = {};
      content.append(el("p", "裝備是否能穿戴由 DM 依體型與構造判定。融入／掉落的護甲與武器不套用；其他裝備特殊效果請依實際裁定。"));
      for (const [key, label, field] of [["armor", "護甲", "armor"], ["main", "主手", "mainHand"], ["off", "副手", "offHand"], ["other", "其他裝備", ""]]) {
        const equipped = field ? document.getElementById(field)?.value || "未裝備" : "";
        equipment[key] = selectField(content, `${label}${equipped ? `：${equipped}` : ""}`, [
          { value: "merge", label: "融入（不生效）" }, { value: "drop", label: "掉落（不生效）" }, { value: "wear", label: "穿戴／持用（DM 同意）" }
        ], c.druid.equipment[key]);
      }
      const overrideLabel = el("label", "AC 裁定值（選填；留空自動計算野獸／穿戴護甲與盾牌）", "druid-field");
      const override = el("input");
      override.type = "number"; override.min = "0"; override.max = "99"; override.step = "1";
      override.dataset.stateTransient = "true";
      overrideLabel.appendChild(override); content.appendChild(overrideLabel);
      const temporaryHp = api().collectState().temporaryHp;
      const keep = temporaryHp > 0 ? checkField(content, `保留既有 ${temporaryHp} 點臨時 HP（不勾選則替換為 ${c.level}，不相加）`, temporaryHp >= c.level) : null;
      content.append(el("p", "變形期間不能施法；既有專注與法術效果保留。生命值及生命骰不改成野獸值。"));
      selection = () => ({ key: choice.value, equipment: Object.fromEntries(Object.entries(equipment).map(([key, input]) => [key, input.value])),
        acOverride: override.value === "" ? null : Number(override.value), keepTemporaryHp: Boolean(keep?.checked) });
    } else if (operation === "companion") {
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
      content.append(el("p", "以附贈動作主動解除；也可用此入口記錄遊戲時間到期。恢復原形數據，不退還使用次數，不清除臨時 HP。掉落的裝備仍需自行拾回。"));
    } else if (operation === "end-companion") {
      content.append(el("p", "記錄荒野夥伴已消失；不退還已消耗的資源。"));
    }
    content.appendChild(error);
    const result = await globalScope.AppDialog.showContent({ title: labels[operation], content, trigger, confirmLabel, cancelLabel: "取消", dismissOnBackdrop: false,
      resolveConfirm() {
        const values = selection();
        if (values.acOverride !== undefined && values.acOverride !== null && (!Number.isInteger(values.acOverride) || values.acOverride < 0 || values.acOverride > 99)) {
          error.textContent = "AC 請輸入 0～99 的整數，或留空。"; return false;
        }
        const committed = api().commitDruidOperation(operation, values, c.token);
        if (!committed.ok) { error.textContent = committed.message; return false; }
        return committed;
      }
    });
    closeTooltip?.();
    if (!result?.ok) return false;
    globalScope.AppDialog.notify(`${labels[operation]}已完成。`, { tone: "success" });
    if (operation === "aid") await showAidRolls(result.aidDice, trigger);
    return true;
  }

  function rollButton(target, label, expression) {
    target.append(button(label, () => globalScope.DiceRoller?.rollExpression(expression, { label }), !globalScope.DiceRoller?.isEnabled?.()));
  }

  async function showAidRolls(dice, trigger) {
    const content = el("div", "", "druid-operation");
    content.append(el("p", "已消耗一次荒野形態。以下只擲結果，不再次扣次數；治療不會自動套用到自己。豁免成功時傷害減半。"));
    rollButton(content, `大地之援：${dice} 黯蝕傷害`, dice);
    rollButton(content, `大地之援：${dice} 治療`, dice);
    await globalScope.AppDialog.showContent({ title: "大地之援結果", content, trigger, actions: [{ label: "完成", value: "close" }] });
  }

  async function primalStrike(trigger) {
    const content = el("div", "", "druid-operation");
    content.append(el("p", "每個自己的回合一次，武器或野獸形態攻擊命中後，額外造成 1d8 傷害。請自行確認本回合尚未使用。"));
    const type = selectField(content, "傷害類型", ["冷凍", "火焰", "閃電", "雷鳴"].map(value => ({ value, label: value })));
    await globalScope.AppDialog.showContent({ title: "原初打擊", content, trigger, confirmLabel: "擲額外傷害", cancelLabel: "取消",
      resolveConfirm() {
        if (context().level < 7 || !document.getElementById("druid-elemental-fury-primal-strike")?.checked || !globalScope.DiceRoller?.isEnabled?.()) return false;
        globalScope.DiceRoller.rollExpression("1d8", { label: `原初打擊：${type.value}` });
        return true;
      }
    });
  }

  function getActionOptions(mode) {
    const c = context(), beast = form(), options = [];
    if (beast && mode === "bonus") options.push({ key: "druid-end-wild-shape", label: "解除荒野形態", description: "以附贈動作恢復原形，不退還使用次數。", druidOperation: "end", source: "職業" });
    for (const action of beast?.actions || []) {
      if (action.mode !== mode) continue;
      options.push({ key: `druid-beast-${beast.key}-${action.id}`, label: `${nameOf(beast.key)}：${action.name}`, description: beast.attacks,
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
    const requiresWild = ["shape", "aid"].includes(option.druidOperation);
    const blocked = requiresWild && (!c.remaining || c.incapacitated)
      || option.druidOperation === "companion" && (Boolean(form()) || c.incapacitated);
    target.append(el("p", `荒野形態剩餘 ${c.remaining}／${c.rules.maximum}`, "druid-resource-note"),
      button(option.druidOperation === "shape" ? "變形所選形態" : labels[option.druidOperation], trigger => openOperation(option.druidOperation, trigger), blocked));
    if (option.druidOperation === "shape") target.append(button("管理已知形態", trigger => openOperation("known", trigger)));
    if (requiresWild && c.remaining === 0 && c.level >= 5) target.append(button("野性復甦：恢復次數", trigger => openOperation("resurge-shape", trigger)));
    if (option.druidOperation === "companion" && form()) target.append(el("p", "荒野形態期間不能施法。"));
  }

  function appendBeastAction(target, beast, action) {
    const controls = el("div", "", "druid-button-row");
    const used = context().druid.beastUsed.includes(`${beast.key}:${action.id}`);
    if (action.recovery) {
      controls.append(button(used ? "已使用" : "使用能力", trigger => {
        const result = api().commitDruidOperation("beast-use", { actionId: action.id }, context().token);
        if (result.ok) globalScope.AppDialog.notify(`已使用${action.name}；擲骰不會再次扣次數。`);
        else globalScope.AppDialog.notify(result.message, { tone: "error" });
      }, used), button(action.recovery.startsWith("recharge") ? "充能成功：恢復" : "新的一日：恢復", trigger => {
        const token = context().token;
        globalScope.AppDialog.requestDecision({ title: `恢復${action.name}`, message: action.recovery.startsWith("recharge") ? "請確認已在回合開始擲出所需充能結果。" : "請確認已符合每天使用次數的恢復條件。", trigger, confirmLabel: "恢復", cancelLabel: "取消" }).then(confirmed => {
          if (confirmed) {
            const result = api().commitDruidOperation("beast-recharge", { actionId: action.id }, token);
            if (!result.ok) globalScope.AppDialog.notify(result.message, { tone: "error" });
          }
        });
      }, !used));
      if (action.recovery.startsWith("recharge")) rollButton(controls, `擲充能（${action.recovery === "recharge-5" ? "5–6" : "6"} 成功）`, "1d6");
    }
    if (Number.isFinite(action.hit)) rollButton(controls, `${action.name}命中 ${globalScope.formatSignedValue(action.hit)}`, `1d20${action.hit >= 0 ? "+" : ""}${action.hit}`);
    if (action.save) controls.append(el("p", `${action.save.ability}豁免 DC ${action.save.dc}`));
    for (const damage of action.damage || []) {
      if (damage.expression) rollButton(controls, `${action.name}：${damage.expression} ${damage.type}`, damage.expression);
      else controls.append(el("span", `${damage.type} ${damage.fixed}（固定）`));
    }
    if (!action.damage && !Number.isFinite(action.hit)) controls.append(el("p", "依上方條件與效果操作；不自動判定目標或移動。"));
    target.appendChild(controls);
    if (action.recovery && !used) {
      controls.querySelectorAll("button").forEach(control => {
        if (control.textContent.startsWith(action.name)) control.disabled = true;
      });
    }
  }

  function renderBeastWeapons(target, getWeaponData, createWeaponSummary) {
    const beast = form();
    if (!beast) return false;
    const c = context();
    const card = el("section", "", "tabletop-section druid-beast-attacks");
    card.append(el("h3", `${nameOf(beast.key)}的攻擊`), el("p", beast.attacks));
    for (const action of beast.actions.filter(item => Number.isFinite(item.hit))) {
      const section = el("div");
      section.append(el("strong", action.name));
      appendBeastAction(section, beast, action);
      card.appendChild(section);
    }
    for (const item of beast.conditionalDamage || []) rollButton(card, `${item.name} ${item.expression}（條件成立時）`, item.expression);
    const weapons = ["main", "off"].filter(hand => c.druid.equipment[hand] === "wear").map(getWeaponData).filter(item => item.name && item.name !== "盾牌");
    target.replaceChildren(card, ...weapons.map(createWeaponSummary));
    if (weapons.length && !globalScope.isWeaponAttackAutomationEnabled?.()) target.append(el("p", "目前武器為手填模式，請依變形後屬性自行裁定武器加值；野獸攻擊可直接擲骰。"));
    return true;
  }

  function render() {
    if (!api()) return;
    const c = context(), beast = form();
    for (const id of ["tabletop-druid-overview", "tabletop-druid-actions", "tabletop-druid-resources"]) {
      const mount = document.getElementById(id);
      if (!mount) continue;
      mount.hidden = c.level < 2;
      mount.replaceChildren();
      if (c.level < 2) continue;
      if (id !== "tabletop-druid-resources") {
        mount.append(el("strong", beast ? `荒野形態：${nameOf(beast.key)}` : "德魯伊 · 原形"), el("p", `荒野形態 ${c.remaining}／${c.rules.maximum}${beast ? ` · 最長 ${c.rules.hours} 小時 · 不能施法，既有專注保留` : ""}`));
        const row = el("div", "", "druid-button-row");
        row.append(button(beast ? "更換形態" : "荒野形態", trigger => openOperation("shape", trigger), !c.remaining || c.incapacitated), button("已知形態", trigger => openOperation("known", trigger)));
        if (beast) row.append(button("查看形態", showFormDetail), button("解除形態", trigger => openOperation("end", trigger)));
        if (!c.remaining && c.level >= 5) row.append(button("野性復甦", trigger => openOperation("resurge-shape", trigger), c.incapacitated));
        mount.appendChild(row);
        if (c.druid.companion) mount.append(el("p", "荒野夥伴已召喚 · 精類 · 長休後消失"), button("移除夥伴", trigger => openOperation("end-companion", trigger)));
        if (id === "tabletop-druid-actions" && c.level >= 7 && document.getElementById("druid-elemental-fury-primal-strike")?.checked) {
          mount.append(button("原初打擊：命中後 +1d8", primalStrike, !globalScope.DiceRoller?.isEnabled?.()));
        }
      } else {
        mount.append(el("h3", "德魯伊資源操作"));
        if (c.level >= 5) mount.append(button("野性復甦：法術位 → 荒野形態", trigger => openOperation("resurge-shape", trigger), c.remaining !== 0 || c.incapacitated), button("野性復甦：荒野形態 → 一環法術位", trigger => openOperation("resurge-slot", trigger), !c.remaining || Boolean(api().getBuiltInResourceSpent("druid-wild-resurgence-spell-slot")) || c.incapacitated));
        if (c.level >= 6) {
          const used = document.getElementById("druid-natural-recovery-used");
          const mirror = checkField(mount, "自然恢復：免費施法已使用（所有結社法術共用，與恢復法術位分開）", Boolean(used?.checked));
          mirror.addEventListener("change", () => globalScope.TabletopResources.setCanonicalCheckbox(used, mirror.checked));
        }
      }
    }
  }

  function scheduleRender() {
    if (scheduled) cancelAnimationFrame(scheduled);
    scheduled = requestAnimationFrame(() => { scheduled = 0; render(); });
  }

  globalScope.TabletopDruid = Object.freeze({ openOperation, getActionOptions, appendActionControl, renderBeastWeapons, renderShapeDescription, createNaturalRecoveryRow, render, primalStrike });
  document.addEventListener("DOMContentLoaded", render);
  document.addEventListener("input", scheduleRender);
  document.addEventListener("change", scheduleRender);
  for (const event of ["tabletopstatechange", "tabletopmodechange", "dicerollmodechange"]) globalScope.addEventListener(event, scheduleRender);
})(window);

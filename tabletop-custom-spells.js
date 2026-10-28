(function attachTabletopCustomSpells(globalScope) {
  "use strict";

  const LEVELS = ["戲法", "一環", "二環", "三環", "四環"];
  const getSpells = () => globalScope.SHARE_MODE ? [] : globalScope.TabletopMode.getTabletopActionPreferences().customSpells || [];
  const element = (tag, className = "", text = "") => {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  };
  const button = (text, onClick) => {
    const node = element("button", "tabletop-compact-button", text);
    node.type = "button";
    node.addEventListener("click", onClick);
    return node;
  };
  const notifyFailure = () => globalScope.AppDialog.notify("無法儲存自創法術，原設定已保留，請重試。", { tone: "error" });

  function getTimingLabels(spell) {
    const time = spell.castingTime === "custom" ? spell.castingTimeText
      : globalScope.TabletopMode.customSpellOptions.castingTimes[spell.castingTime];
    return [time, ...(spell.ritual ? ["儀式"] : [])];
  }

  function getEntries() {
    return getSpells().filter(spell => !spell.hidden).map(spell => ({
      spellId: spell.spellId,
      sourceKey: spell.spellId,
      source: "自創",
      customSpell: spell,
      spell: { spellId: spell.spellId, nameZh: spell.nameZh, nameEn: "", level: spell.level }
    }));
  }

  function getSpell(spellId) {
    const record = getSpells().find(spell => spell.spellId === spellId);
    if (!record) return null;
    const options = globalScope.TabletopMode.customSpellOptions;
    const range = record.rangeType === "custom" ? record.rangeText : record.rangeType === "emanation"
      ? `自身（半徑 ${record.rangeFeet} 呎發散）` : options.ranges[record.rangeType];
    const duration = record.duration === "custom" ? record.durationText : options.durations[record.duration];
    const components = [["verbal", "V"], ["somatic", "S"], ["material", "M"]]
      .filter(([key]) => record[key]).map(([, label]) => label).join("、") || "無";
    return { spellId, nameZh: record.nameZh, nameEn: "", level: record.level, customSpell: true,
      desc: [`學派: ${record.school}`, `施法時間: ${getTimingLabels(record).join("／")}`, `射程: ${range}`,
        `成分: ${components}`, ...(record.material ? [`材料: ${record.materials}`] : []),
        `持續時間: ${record.concentration ? "專注，" : ""}${duration}`, "",
        ...record.description.split(/\r?\n/).filter(line => line.trim()).map(line => `- ${line}`)].join("\n") };
  }

  function getSheetEntries() {
    return getSpells().filter(spell => spell.showOnSheet).map(spell => ({
      spellId: spell.spellId, level: spell.level, customSpell: true, countsAsPrepared: spell.countsAsPrepared,
      spellSource: spell.countsAsPrepared ? "" : "custom-permanent", sourceKey: spell.spellId,
      sourceLabel: "自創法術", sourceTag: "自創", spellClass: ""
    }));
  }

  const getPdfSpells = () => getSheetEntries().map(entry => getSpell(entry.spellId));

  async function showDetail(record, trigger, dialogOptions = {}) {
    const spell = getSpells().find(item => item.spellId === record.spellId);
    if (!spell) return;
    const options = globalScope.TabletopMode.customSpellOptions;
    const content = element("div", "tabletop-spell-detail");
    const range = spell.rangeType === "custom" ? spell.rangeText
      : spell.rangeType === "emanation" ? `自身（半徑 ${spell.rangeFeet} 呎發散）` : options.ranges[spell.rangeType];
    const duration = spell.duration === "custom" ? spell.durationText : options.durations[spell.duration];
    const components = [["verbal", "V"], ["somatic", "S"], ["material", "M"]]
      .filter(([key]) => spell[key]).map(([, label]) => label).join("、") || "無";
    const meta = element("dl", "tabletop-custom-spell-meta");
    const rows = [["環階", LEVELS[spell.level]], ["學派", spell.school], ["施法時間", getTimingLabels(spell).join("／")],
      ["射程", range], ["成分", components], ...(spell.material ? [["材料", spell.materials || "未填寫"]] : []),
      ["持續時間", `${spell.concentration ? "專注，" : ""}${duration}`]];
    rows.forEach(([label, value]) => meta.append(element("dt", "", label), element("dd", "", value)));
    const list = element("ul", "tabletop-custom-spell-description");
    spell.description.split(/\r?\n/).filter(line => line.trim()).forEach(line => {
      const item = element("li");
      globalScope.TabletopMode.appendCustomDiceText(item, line, spell.nameZh);
      list.appendChild(item);
    });
    content.append(meta, list, element("p", "tabletop-spell-detail__source", "自創法術：點擊骰式可擲骰；施法只處理法術位與專注，效果請手動處理。"));
    // Casting is offered only from tabletop mode; sheet readers stay read-only.
    const mode = globalScope.TabletopMode;
    const actions = [{ label: "關閉", value: "close" }];
    if (dialogOptions.castable === true) {
      if (mode.getConcentrationSpellId?.() === spell.spellId) actions.push({ label: "停止專注", value: "stop-concentration", intent: "secondary" });
      if (!mode.getDruidForm?.()) actions.push({ label: "施法", value: "cast", intent: "primary" });
    }
    const result = await globalScope.AppDialog.showContent({ title: spell.nameZh, content, actions, trigger, allowNested: dialogOptions.allowNested === true });
    if (result === "stop-concentration") {
      mode.stopConcentration(`已停止專注於${spell.nameZh}。`);
      globalScope.AppDialog.notify(`已停止專注：${spell.nameZh}。`, { tone: "info" });
    } else if (result === "cast") {
      await cast(spell, trigger);
    }
    // Preference changes can replace the list while this dialog is open.
    if (!trigger?.isConnected) {
      Array.from(document.querySelectorAll("#tabletop-selected-spells button[data-spell-id]"))
        .find(node => node.dataset.spellId === spell.spellId)?.focus({ preventScroll: true });
    }
  }

  // Slots and ritual use the shared cast-option validation; effects stay manual.
  function requestCast(spell, trigger) {
    const mode = globalScope.TabletopMode;
    const entry = { spellId: spell.spellId, customSpell: spell };
    const cantrip = spell.level === 0;
    let options = cantrip ? null : mode.getSpellCastOptions(entry);
    let methodId = cantrip ? "cantrip" : options.defaultMethod;
    let slotLevel = options?.defaultSlotLevel || spell.level;
    let errorMessage = "";
    const content = element("div", "tabletop-cast-form");
    const summaryRow = (term, detail) => {
      const row = element("div", "tabletop-cast-summary__row");
      row.append(element("dt", "", term), element("dd", "", detail));
      return row;
    };
    const render = () => {
      content.replaceChildren();
      if (!cantrip && !options.methods.length) {
        content.appendChild(element("p", "tabletop-cast-form__error", "目前沒有可用的儀式或合法法術位。"));
      } else if (!cantrip && options.methods.length > 1) {
        const methods = element("fieldset", "tabletop-cast-form__methods");
        methods.appendChild(element("legend", "", "施法方式"));
        options.methods.forEach(method => {
          const label = element("label", "tabletop-cast-form__choice");
          const input = document.createElement("input");
          input.type = "radio";
          input.name = "tabletop-custom-cast-method";
          input.value = method.id;
          input.checked = method.id === methodId;
          input.addEventListener("change", () => { methodId = input.value; errorMessage = ""; render(); });
          label.append(input, document.createTextNode(method.label));
          if (method.id === "ritual") label.appendChild(element("small", "", "（額外 10 分鐘）"));
          methods.appendChild(label);
        });
        content.appendChild(methods);
      } else if (!cantrip) {
        content.appendChild(element("p", "tabletop-cast-form__single", `施法方式：${options.methods[0].label}`));
      }
      const slot = options?.slots.find(item => item.level === Number(slotLevel));
      if (methodId === "slot" && options.slots.length) {
        const field = element("label", "tabletop-cast-form__field");
        field.appendChild(element("span", "", "使用環位"));
        if (options.slots.length > 1) {
          const select = document.createElement("select");
          select.setAttribute("aria-label", "使用環位");
          options.slots.forEach(item => {
            const option = element("option", "", `${item.level} 環（剩餘 ${item.available}）`);
            option.value = String(item.level);
            option.selected = item.level === Number(slotLevel);
            select.appendChild(option);
          });
          select.addEventListener("change", () => { slotLevel = Number(select.value); errorMessage = ""; render(); select.focus(); });
          field.appendChild(select);
        } else {
          field.appendChild(element("strong", "", `${slot?.level || slotLevel} 環（唯一可用環位）`));
        }
        content.appendChild(field);
      }
      const currentId = mode.getConcentrationSpellId?.() || "";
      const effectiveLevel = methodId === "slot" ? slot?.level || spell.level : spell.level;
      const summary = element("dl", "tabletop-cast-summary");
      summary.append(
        summaryRow("法術", spell.nameZh),
        summaryRow("有效環位", cantrip ? "戲法" : `${effectiveLevel} 環`),
        summaryRow("消耗", cantrip ? "不消耗資源" : methodId === "slot" ? slot ? `${slot.level} 環法術位（剩餘 ${slot.available}）` : "沒有可用法術位"
          : methodId === "ritual" ? "不消耗法術位；額外 10 分鐘" : "無可用方式"),
        summaryRow("專注", !spell.concentration ? "不需專注"
          : currentId && currentId !== spell.spellId ? `會取代目前專注：${getConcentrationLabel(currentId)}`
            : currentId === spell.spellId ? "繼續專注於同一法術" : "施法成功後開始專注")
      );
      const error = element("p", "tabletop-cast-form__error", errorMessage);
      error.setAttribute("role", "status");
      error.setAttribute("aria-live", "polite");
      content.append(summary, error);
    };
    render();
    return globalScope.AppDialog.showContent({
      title: `施放${spell.nameZh}`, content, cancelLabel: "取消", confirmLabel: "施法", dismissOnBackdrop: false, trigger,
      initialFocus: !cantrip && (options.methods.length > 1 || options.slots.length > 1) ? "content" : "primary",
      resolveConfirm() {
        if (mode.getDruidForm?.()) {
          errorMessage = "荒野形態期間不能施法；未消耗資源。";
          render();
          return false;
        }
        if (cantrip) return { ok: true, effectiveLevel: 0, resourceLabel: "不消耗資源" };
        const slot = options.slots.find(item => item.level === Number(slotLevel));
        const method = options.methods.find(item => item.id === methodId);
        const committed = method ? mode.commitSpellCastResource(entry, {
          method: methodId,
          slotLevel: methodId === "slot" ? Number(slotLevel) : 0,
          resourceId: methodId === "slot" ? slot?.resourceId || "" : method.resourceId || ""
        }) : null;
        if (!committed?.ok) {
          options = mode.getSpellCastOptions(entry);
          methodId = options.defaultMethod;
          slotLevel = options.defaultSlotLevel || spell.level;
          errorMessage = method ? "施法資源已變更，未消耗其他格。請重新確認目前選項後再按施法。" : "目前沒有可用施法方式。";
          render();
          return false;
        }
        return committed;
      }
    });
  }

  function getConcentrationLabel(spellId) {
    return globalScope.SpellCatalog?.getSpell(spellId)?.nameZh || getSpell(spellId)?.nameZh || `未知法術（${spellId}）`;
  }

  async function cast(spell, trigger) {
    const mode = globalScope.TabletopMode;
    if (mode.getDruidForm?.()) {
      globalScope.AppDialog.notify("荒野形態期間不能施法；既有專注仍保留。");
      return;
    }
    const currentId = mode.getConcentrationSpellId?.() || "";
    // A cantrip asks only when it would replace another concentration.
    const result = spell.level === 0 && !(spell.concentration && currentId && currentId !== spell.spellId)
      ? { ok: true, effectiveLevel: 0, resourceLabel: "不消耗資源" }
      : await requestCast(spell, trigger);
    if (!result?.ok) return;
    if (spell.concentration && currentId !== spell.spellId) {
      mode.setConcentrationSpellId(spell.spellId, currentId ? `已將專注替換為${spell.nameZh}。` : `開始專注於${spell.nameZh}。`);
    }
    globalScope.AppDialog.notify(`已施放${spell.nameZh}（${result.effectiveLevel ? `${result.effectiveLevel} 環` : "戲法"}；${result.resourceLabel}）。骰式請在法術說明中點擊擲骰。`, { tone: "success" });
  }

  async function openEditor(record = null, trigger) {
    if (globalScope.SHARE_MODE) return false;
    const options = globalScope.TabletopMode.customSpellOptions;
    const fields = {};
    const values = record || { nameZh: "", level: 0, school: "防護", castingTime: "action", castingTimeText: "", ritual: false,
      rangeType: "self", rangeFeet: 10, rangeText: "", verbal: true, somatic: true, material: false, materials: "",
      duration: "instant", durationText: "", concentration: false, description: "", hidden: false,
      showOnSheet: false, countsAsPrepared: false };
    let error;
    const field = (parent, key, label, choices = null, limit = 120) => {
      const wrap = element("label", "tabletop-action-editor__field");
      const input = document.createElement(choices ? "select" : key === "description" ? "textarea" : "input");
      input.id = `tabletop-custom-spell-${key}`;
      input.dataset.stateTransient = "true";
      input.setAttribute("aria-describedby", "tabletop-custom-spell-error");
      wrap.htmlFor = input.id;
      if (choices) {
        Object.entries(choices).forEach(([value, text]) => {
          const option = element("option", "", text);
          option.value = value;
          input.appendChild(option);
        });
      } else {
        input.maxLength = limit;
        if (key === "description") input.rows = 6;
        else { input.type = "text"; input.autocomplete = "off"; }
      }
      input.value = String(values[key]);
      fields[key] = input;
      wrap.append(element("span", "", label), input);
      parent.appendChild(wrap);
      return wrap;
    };
    const check = (parent, key, label) => {
      const wrap = element("label", "tabletop-custom-spell-check");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = values[key] === true;
      input.id = `tabletop-custom-spell-${key}`;
      input.dataset.stateTransient = "true";
      fields[key] = input;
      wrap.append(input, document.createTextNode(label));
      parent.appendChild(wrap);
      return wrap;
    };
    return globalScope.AppDialog.showContent({
      title: record ? "編輯自創法術" : "新增自創法術",
      message: "每行敘述會顯示為一個條列；骰式如 2d6、1D8+3 可點擊擲骰。",
      variant: "action-editor", cancelLabel: "取消", confirmLabel: record ? "儲存變更" : "新增法術",
      initialFocus: "content", dismissOnBackdrop: false, trigger,
      renderContent(body) {
        const form = element("div", "tabletop-action-editor tabletop-custom-spell-editor");
        const name = field(form, "nameZh", "法術名稱", null, 80);
        name.classList.add("tabletop-custom-spell-wide");
        field(form, "level", "環階", Object.fromEntries(LEVELS.map((label, index) => [index, label])));
        field(form, "school", "學派", Object.fromEntries(options.schools.map(label => [label, label])));
        const timing = element("div", "tabletop-custom-spell-group");
        field(timing, "castingTime", "施法時間", options.castingTimes);
        const timingText = field(timing, "castingTimeText", "自訂施法時間");
        check(timing, "ritual", "儀式");
        const range = element("div", "tabletop-custom-spell-group");
        field(range, "rangeType", "射程", options.ranges);
        const feet = field(range, "rangeFeet", "發散半徑（呎）");
        fields.rangeFeet.type = "number";
        fields.rangeFeet.min = "1";
        fields.rangeFeet.max = "9999";
        fields.rangeFeet.step = "1";
        const rangeText = field(range, "rangeText", "自訂射程");
        form.append(timing, range);
        const duration = element("div", "tabletop-custom-spell-group");
        field(duration, "duration", "持續時間", options.durations);
        const durationText = field(duration, "durationText", "自訂持續時間");
        check(duration, "concentration", "需要專注");
        const components = element("fieldset", "tabletop-custom-spell-components");
        components.appendChild(element("legend", "", "成分"));
        const componentOptions = element("div", "tabletop-custom-spell-component-options");
        check(componentOptions, "verbal", "V 言語");
        check(componentOptions, "somatic", "S 姿勢");
        check(componentOptions, "material", "M 材料");
        components.appendChild(componentOptions);
        const materials = field(components, "materials", "材料說明（選填）", null, 600);
        form.append(duration, components);
        const description = field(form, "description", "敘述（Enter 換行）", null, 6000);
        description.classList.add("tabletop-custom-spell-wide");
        const integration = element("fieldset", "tabletop-custom-spell-integration tabletop-custom-spell-wide");
        integration.appendChild(element("legend", "", "角色卡與準備名額"));
        check(integration, "showOnSheet", "自創法術是否出現在法術清單？");
        const prepared = check(integration, "countsAsPrepared", "自創法術是否列為「準備」法術？");
        const hint = element("p", "tabletop-custom-spell-integration__hint");
        integration.appendChild(hint);
        form.appendChild(integration);
        fields.showOnSheet.addEventListener("change", () => {
          if (!fields.showOnSheet.checked) fields.countsAsPrepared.checked = false;
        });
        error = element("p", "tabletop-action-editor__error tabletop-custom-spell-wide");
        error.id = "tabletop-custom-spell-error";
        error.setAttribute("aria-live", "polite");
        form.appendChild(error);
        const update = () => {
          prepared.hidden = !fields.showOnSheet.checked;
          fields.countsAsPrepared.disabled = !fields.showOnSheet.checked;
          hint.textContent = !fields.showOnSheet.checked ? "目前只在跑團模式顯示。"
            : fields.countsAsPrepared.checked ? "占 1 個準備名額；戲法占戲法名額。請在此編輯區更改，準備法術視窗中的勾選會鎖定。"
              : "目前視為永久準備，不占準備名額。";
          [[timingText, fields.castingTime.value === "custom"], [feet, fields.rangeType.value === "emanation"],
            [rangeText, fields.rangeType.value === "custom"], [durationText, fields.duration.value === "custom"],
            [materials, fields.material.checked]].forEach(([wrap, visible]) => {
            wrap.hidden = !visible;
            wrap.querySelector("input, select, textarea").disabled = !visible;
          });
        };
        form.addEventListener("input", event => { event.target.removeAttribute("aria-invalid"); error.textContent = ""; });
        form.addEventListener("change", update);
        update();
        body.appendChild(form);
      },
      resolveConfirm() {
        const next = { hidden: values.hidden };
        for (const [key, input] of Object.entries(fields)) {
          input.removeAttribute("aria-invalid");
          next[key] = input.type === "checkbox" ? input.checked : input.value.trim();
        }
        const fail = (key, message) => {
          error.textContent = message;
          fields[key].setAttribute("aria-invalid", "true");
          fields[key].focus();
          return false;
        };
        for (const [key, label] of [["nameZh", "法術名稱"], ["description", "敘述"],
          ...(next.castingTime === "custom" ? [["castingTimeText", "自訂施法時間"]] : []),
          ...(next.rangeType === "custom" ? [["rangeText", "自訂射程"]] : []),
          ...(next.duration === "custom" ? [["durationText", "自訂持續時間"]] : [])]) {
          if (!next[key]) return fail(key, `請輸入${label}。`);
        }
        next.level = Number(next.level);
        next.rangeFeet = Number(next.rangeFeet);
        if (!Number.isInteger(next.rangeFeet) || next.rangeFeet < 1 || next.rangeFeet > 9999) {
          if (next.rangeType === "emanation") return fail("rangeFeet", "發散半徑請輸入 1～9999 的整數。");
          next.rangeFeet = 10;
        }
        const saved = globalScope.TabletopMode.saveCustomTabletopSpell(record?.spellId || "", next);
        if (!saved.ok) {
          error.textContent = saved.reason === "limit" ? "自創法術已達 50 筆上限，請先刪除不再使用的項目。"
            : saved.reason === "storage" ? "無法寫入本機儲存，編輯內容已保留，請重試。" : "無法儲存，請檢查欄位或重新開啟編輯。";
          return false;
        }
        globalScope.AppDialog.notify(`已${record ? "更新" : "新增"}「${saved.spell.nameZh}」。`, { tone: "success" });
        return saved.spell;
      }
    });
  }

  async function openManager(trigger = document.getElementById("tabletop-custom-spells-manage")) {
    if (globalScope.SHARE_MODE) return false;
    const content = element("div", "tabletop-action-manager");
    const render = () => {
      const spells = getSpells();
      const header = element("div", "tabletop-action-manager__toolbar");
      header.appendChild(element("p", "tabletop-action-manager__summary", `共 ${spells.length} 個自創法術。取消勾選即可隱藏。`));
      const add = button("新增法術", async () => { await openEditor(null, add); openManager(trigger); });
      header.appendChild(add);
      const list = element("div", "tabletop-action-manager__list");
      list.setAttribute("role", "list");
      if (!spells.length) list.appendChild(element("p", "tabletop-inline-empty", "還沒有自創法術，點「新增法術」建立。"));
      spells.forEach(spell => {
        const row = element("div", "tabletop-action-manager__row");
        row.setAttribute("role", "listitem");
        const visibility = element("label", "tabletop-action-manager__visibility");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.dataset.stateTransient = "true";
        checkbox.checked = !spell.hidden;
        checkbox.setAttribute("aria-label", `顯示${spell.nameZh}`);
        checkbox.addEventListener("change", () => {
          const latest = getSpells().find(item => item.spellId === spell.spellId);
          if (!latest || !globalScope.TabletopMode.saveCustomTabletopSpell(spell.spellId, { ...latest, hidden: !checkbox.checked }).ok) {
            checkbox.checked = !checkbox.checked;
            notifyFailure();
          }
        });
        const copy = element("span", "tabletop-action-manager__copy");
        copy.append(element("strong", "", spell.nameZh), element("span", "tabletop-source-tag", `${LEVELS[spell.level]}・${spell.school}・自創`));
        visibility.append(checkbox, copy);
        const actions = element("div", "tabletop-action-manager__row-actions");
        const edit = button("編輯", async () => {
          const latest = getSpells().find(item => item.spellId === spell.spellId);
          if (latest) await openEditor(latest, edit);
          openManager(trigger);
        });
        const remove = button("刪除", async () => {
          const confirmed = await globalScope.AppDialog.requestDecision({ title: `刪除「${spell.nameZh}」`,
            message: "這會移除這台裝置的自創法術，且無法復原。", cancelLabel: "取消", confirmLabel: "刪除法術",
            intent: "danger", dismissOnBackdrop: false, trigger: remove });
          if (confirmed) {
            if (!globalScope.TabletopMode.removeCustomTabletopSpell(spell.spellId).ok) notifyFailure();
            else globalScope.AppDialog.notify(`已刪除「${spell.nameZh}」。`, { tone: "success" });
          }
          openManager(trigger);
        });
        remove.classList.add("tabletop-danger-button");
        actions.append(edit, remove);
        row.append(visibility, actions);
        list.appendChild(row);
      });
      content.replaceChildren(header, list);
    };
    render();
    await globalScope.AppDialog.showContent({ title: "管理自創法術", content, variant: "action-manager",
      message: "自創法術只存在這台裝置上，分享網址不包含自訂內容。",
      confirmLabel: "完成", initialFocus: "content", trigger });
  }

  globalScope.TabletopCustomSpells = Object.freeze({ getEntries, getSheetEntries, getSpell, getPdfSpells, getTimingLabels, showDetail, openEditor, openManager });
  document.addEventListener("DOMContentLoaded", () => {
    // The entry buttons start collapsed on every load; the gear only reveals them.
    const toggle = document.getElementById("tabletop-custom-spells-toggle");
    const actions = document.getElementById("tabletop-custom-spells-actions");
    toggle?.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(expanded));
      toggle.setAttribute("aria-label", expanded ? "隱藏自創法術選項" : "顯示自創法術選項");
      if (actions) actions.hidden = !expanded;
    });
    const add = document.getElementById("tabletop-custom-spells-add");
    add?.addEventListener("click", () => openEditor(null, add));
    document.getElementById("tabletop-custom-spells-manage")?.addEventListener("click", event => openManager(event.currentTarget));
  });
})(window);

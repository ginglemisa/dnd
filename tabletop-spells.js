(function attachTabletopSpells(globalScope) {
  "use strict";

  const LEVEL_LABELS = Object.freeze(["戲法", "一環", "二環", "三環", "四環"]);
  const DICE_TOKEN_PATTERN = /\d+\s*d\s*(?:100|20|12|10|8|6|4)(?:\s*[+-]\s*(?:\d+\s*d\s*(?:100|20|12|10|8|6|4)|\d+))*/gi;
  const elements = {};
  let initialized = false;
  let scheduledRender = 0;

  function createElement(tagName, className = "", text = "") {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function getSelectedSpellEntries() {
    if (!globalScope.SpellCatalog) return [];
    return Array.from(document.querySelectorAll('#tab-spells .spell-entry select[id*="-spell-"]'))
      .flatMap(select => {
        const spellId = select.value || "";
        const spell = globalScope.SpellCatalog.getSpell(spellId);
        if (!spell) return [];
        const row = select.closest(".spell-entry");
        const classSelect = row?.querySelector('select[id*="-class-"]');
        const source = typeof globalScope.getPickedSpellSourceTag === "function"
          ? globalScope.getPickedSpellSourceTag(row)
          : "";
        const spellSource = row?.dataset.spellSource || "manual";
        const sourceClassLabel = classSelect?.selectedOptions?.[0]?.textContent?.trim() || "";
        const freeUseControls = globalScope.getSpellFreeUseControls?.(select) || [];
        return [{
          spellId,
          spell,
          spellSelect: select,
          spellSource,
          spellClass: row?.dataset.spellClass || classSelect?.value || "",
          source: source || (row?.dataset.spellSource ? "能力" : "職業"),
          sourceLabel: row?.dataset.sourceLabel || (sourceClassLabel ? `來源：${sourceClassLabel}法表` : "來源：職業法表"),
          sourceKey: row?.dataset.sourceKey || select.id,
          castMode: row?.dataset.castMode || (spell.level === 0 ? "cantrip" : "slot"),
          spellUse: row?.dataset.castMode || (spell.level === 0 ? "cantrip" : "slot"),
          fixedCastLevel: Number.parseInt(row?.dataset.fixedCastLevel || "", 10) || spell.level,
          ritualAllowed: row?.dataset.ritualAllowed === "true" || spellSource === "manual",
          freeUseControls
        }];
      });
  }

  function isSpellCurrentlySelected(spellId) {
    return getSelectedSpellEntries().some(entry => entry.spellId === spellId);
  }

  function createSpellUseMirrors(entry) {
    const useControls = globalScope.getSpellFreeUseControls?.(entry.spellSelect) || [];
    if (!useControls.length) return null;

    const controls = createElement("span", "tabletop-spell-card__uses");
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-label", `${entry.spell.nameZh}免費施法次數；勾選表示已使用`);
    useControls.forEach(({ canonical, label, title }) => {
      const mirror = document.createElement("input");
      mirror.type = "checkbox";
      mirror.checked = canonical.checked;
      mirror.setAttribute("aria-label", label || `${entry.spell.nameZh}免費施法已使用`);
      mirror.title = title || "免費施法";
      mirror.addEventListener("change", () => {
        globalScope.TabletopResources?.setCanonicalCheckbox?.(canonical, mirror.checked);
      });
      controls.appendChild(mirror);
    });
    return controls;
  }

  function getFieldValue(id) {
    const field = document.getElementById(id);
    return field && "value" in field ? String(field.value || "").trim() : "";
  }

  function getSelectedLabel(id) {
    const select = document.getElementById(id);
    return select instanceof HTMLSelectElement && select.value
      ? select.selectedOptions[0]?.textContent?.trim() || "—"
      : "—";
  }

  function renderCastingSummary() {
    if (!elements.castingSummary) return;
    const rows = [
      ["施法屬性", getSelectedLabel("spellcasting-ability")],
      ["法術豁免 DC", getFieldValue("spell-save-dc") || "—"],
      ["法術命中加值", getFieldValue("spell-attack-bonus") || "—"]
    ].map(([term, value]) => {
      const row = createElement("div", "tabletop-casting-summary__item");
      const name = createElement("dt");
      const number = createElement("dd");
      if (term === "法術命中加值") {
  const modifier = parseModifier(value);

  name.textContent = term;

  const button = createElement("button", "tabletop-inline-roll", value);
  button.type = "button";
  button.disabled = modifier === null || !globalScope.DiceRoller?.isEnabled?.();
  button.setAttribute(
    "aria-label",
    button.disabled ? `${term}；請先開啟擲骰系統` : `擲${term}`
  );
  button.addEventListener("click", () => {
    globalScope.DiceRoller?.roll?.({
      count: 1,
      sides: 20,
      modifier,
      includeModifier: true,
      label: term
    });
  });

  number.appendChild(button);
} else {
        name.textContent = term;
        number.textContent = value;
      }
      row.append(name, number);
      return row;
    });
    elements.castingSummary.replaceChildren(...rows);
  }

  function renderSpellSlots() {
    const slotCount = globalScope.TabletopResources?.renderSpellSlots(elements.spellSlots) || 0;
    if (elements.spellSlotsSection) elements.spellSlotsSection.hidden = slotCount === 0;
  }

  function renderSelectedSpells(entries) {
    if (!elements.selectedSpells) return;
    const groups = LEVEL_LABELS.flatMap((label, level) => {
      const spells = entries.filter(entry => entry.spell.level === level);
      if (!spells.length) return [];
      const section = createElement("section", "tabletop-spell-level");
      section.appendChild(createElement("h4", "", label));
      const list = createElement("div", "tabletop-spell-list");
      spells.forEach(entry => {
        const card = createElement("div", "tabletop-spell-card");
        const button = createElement("button", "tabletop-spell-button");
        button.type = "button";
        button.dataset.spellId = entry.spellId;
        button.dataset.spellSourceKey = entry.sourceKey;
        button.setAttribute("aria-haspopup", "dialog");
        const names = createElement("span", "tabletop-spell-button__names");
        names.append(
          createElement("strong", "", entry.spell.nameZh),
          createElement("span", "", entry.spell.nameEn)
        );
        button.append(names, createElement("span", "tabletop-source-tag", entry.source));
        button.addEventListener("click", () => showSpellDetail(entry, button));
        card.appendChild(button);
        const useMirrors = createSpellUseMirrors(entry);
        if (useMirrors) card.appendChild(useMirrors);
        list.appendChild(card);
      });
      section.appendChild(list);
      return [section];
    });
    elements.selectedSpells.replaceChildren(...groups);
  }

  function createSpellDetailContent(spell, entry = null) {
    const content = createElement("div", "tabletop-spell-detail");
    content.appendChild(createElement("p", "tabletop-spell-detail__english", spell.nameEn));
    if (entry?.sourceLabel) {
      content.appendChild(createElement("p", "tabletop-spell-detail__source", entry.sourceLabel));
    }
    const copy = createElement("div", "tabletop-spell-detail__copy");
    const description = String(spell.desc || "");
    let cursor = 0;
    for (const match of description.matchAll(DICE_TOKEN_PATTERN)) {
      const expression = match[0].replace(/\s+/g, "").toLowerCase();
      copy.appendChild(document.createTextNode(description.slice(cursor, match.index)));
      const button = createElement("button", "tabletop-dice-expression", expression);
      button.type = "button";
      button.disabled = !globalScope.DiceRoller?.isEnabled?.();
      button.setAttribute(
        "aria-label",
        button.disabled ? `${expression}；請先開啟擲骰系統` : `擲 ${expression}`
      );
      button.addEventListener("click", () => {
        globalScope.DiceRoller?.rollExpression?.(expression, {
          label: `${spell.nameZh} ${expression}`
        });
      });
      copy.appendChild(button);
      cursor = match.index + match[0].length;
    }
    copy.appendChild(document.createTextNode(description.slice(cursor)));
    content.appendChild(copy);
    return content;
  }

  function parseModifier(value) {
    const normalized = String(value || "").trim().replace(/−/g, "-");
    if (!/^[+-]?\d+$/.test(normalized)) return null;
    const modifier = Number(normalized);
    return Number.isSafeInteger(modifier) ? modifier : null;
  }

  function rollConcentrationSave(spellName) {
    const modifier = parseModifier(getFieldValue("save-con"));
    if (modifier === null) return null;
    return globalScope.DiceRoller?.roll?.({
      count: 1,
      sides: 20,
      modifier,
      includeModifier: true,
      label: `${spellName}專注體質豁免`
    });
  }

  function getConcentrationName(spellId) {
    const spell = globalScope.SpellCatalog?.getSpell(spellId);
    return spell?.nameZh || `未知法術（${spellId}）`;
  }

  function restoreStableFocus(spellId = "", preferredTarget = null, sourceKey = "") {
    globalScope.requestAnimationFrame(() => {
      if (
        preferredTarget instanceof HTMLElement
        && preferredTarget.isConnected
        && !preferredTarget.closest("[inert]")
      ) {
        preferredTarget.focus({ preventScroll: true });
        return;
      }
      const currentPanel = globalScope.TabletopMode?.getPanel?.() || "overview";
      const selector = currentPanel === "spells"
        ? ".tabletop-spell-button[data-spell-id]"
        : currentPanel === "actions"
          ? ".tabletop-action-option[data-spell-id]"
          : "";
      const spellButton = selector
        ? Array.from(document.querySelectorAll(selector))
          .find(button => (
            button.dataset.spellId === spellId
            && (!sourceKey || button.dataset.spellSourceKey === sourceKey)
          ))
        : null;
      const target = spellButton || document.getElementById(
        currentPanel === "spells"
          ? "tabletop-tab-spells"
          : currentPanel === "actions" ? "tabletop-tab-actions" : "tabletop-tab-overview"
      );
      target?.focus({ preventScroll: true });
    });
  }

  function getCharacterLevel() {
    return Math.max(1, Number.parseInt(document.getElementById("level")?.value || "1", 10) || 1);
  }

  function getAbilityModifier(abilityId) {
    const score = Number.parseInt(document.getElementById(abilityId)?.value || "10", 10);
    return Number.isFinite(score) ? Math.floor((score - 10) / 2) : 0;
  }

  function buildLifeDiscipleModifier(spec = {}) {
    const className = String(spec.className || "");
    const characterLevel = Number.parseInt(spec.characterLevel, 10) || 0;
    const castMethod = String(spec.castMethod || "");
    const effectiveLevel = Number.parseInt(spec.effectiveLevel, 10) || 0;
    if (className !== "cleric" || characterLevel < 3 || castMethod !== "slot" || effectiveLevel < 1) {
      return null;
    }
    return Object.freeze({
      id: "cleric-life-disciple",
      label: "生命門徒",
      value: 2 + effectiveLevel,
      frequency: "once",
      kind: "healing",
      requiredTag: "restores-hit-points"
    });
  }

  function buildBlessedHealerRecovery(spec = {}) {
    const className = String(spec.className || "");
    const characterLevel = Number.parseInt(spec.characterLevel, 10) || 0;
    const castMethod = String(spec.castMethod || "");
    const effectiveLevel = Number.parseInt(spec.effectiveLevel, 10) || 0;
    if (
      className !== "cleric"
      || characterLevel < 6
      || castMethod !== "slot"
      || effectiveLevel < 1
      || spec.restoresOtherCreatureHitPoints !== true
    ) return null;
    return Object.freeze({
      id: "cleric-blessed-healer",
      label: "神佑醫者",
      amount: 2 + effectiveLevel
    });
  }

  function getSpellOutcomeModifiers(entry, castResult) {
    const modifiers = [];
    const className = document.getElementById("class")?.value || "";
    const level = getCharacterLevel();
    const damageType = castResult.damageType;
    const selectableDamageTypes = globalScope.SpellCatalog.getSelectableCastDamageTypes(entry.spellId);
    const castDamageTypes = selectableDamageTypes.length > 1
      ? (damageType ? [damageType] : [])
      : globalScope.SpellCatalog.getCastDamageTypes(entry.spellId);
    const isDamageCantrip = entry.spell.level === 0
      && entry.spellClass
      && globalScope.SpellCatalog.getCastMetadata(entry.spellId)?.outcomes
        ?.some(outcome => outcome.kind === "damage");

    if (
      isDamageCantrip
      && entry.spellClass === "cleric"
      && className === "cleric"
      && level >= 7
      && document.getElementById("cleric-blessed-strikes-potent-spellcasting")?.checked
    ) modifiers.push({
      id: "cleric-potent-spellcasting",
      label: "牧師強力施法",
      value: getAbilityModifier("wis"),
      frequency: "each-roll"
    });

    if (
      isDamageCantrip
      && entry.spellClass === "druid"
      && className === "druid"
      && level >= 7
      && document.getElementById("druid-elemental-fury-potent-spellcasting")?.checked
    ) modifiers.push({
      id: "druid-potent-spellcasting",
      label: "德魯伊強力施法",
      value: getAbilityModifier("wis"),
      frequency: "each-roll"
    });

    const elementalType = document.getElementById("sorcerer-elemental-affinity-damage-type")?.value || "";
    if (className === "sorcerer" && level >= 6 && elementalType && castDamageTypes.includes(elementalType)) {
      modifiers.push({
        id: "sorcerer-elemental-affinity",
        label: "元素親和",
        value: getAbilityModifier("cha"),
        frequency: "once",
        damageType: elementalType
      });
    }

    const agonizingCantrips = globalScope.getAgonizingBlastSelections?.() || [];
    if (
      isDamageCantrip
      && entry.spellClass === "warlock"
      && agonizingCantrips.includes(entry.spellId)
    ) modifiers.push({
      id: `agonizing-blast-${entry.spellId}`,
      label: "苦痛魔爆",
      value: getAbilityModifier("cha"),
      frequency: "each-roll"
    });

    const lifeDisciple = buildLifeDiscipleModifier({
      className,
      characterLevel: level,
      castMethod: castResult.method,
      effectiveLevel: castResult.effectiveLevel
    });
    if (lifeDisciple) modifiers.push(lifeDisciple);

    return modifiers;
  }

  function formatCastLevel(level) {
    return Number(level) === 0 ? "戲法" : `${Number(level)} 環`;
  }

  function createSummaryRow(term, detail) {
    const row = createElement("div", "tabletop-cast-summary__row");
    row.append(createElement("dt", "", term), createElement("dd", "", detail));
    return row;
  }

  async function requestCastConfiguration(entry, trigger, cantrip = false) {
    const metadata = globalScope.SpellCatalog.getCastMetadata(entry.spellId);
    const selectableTypes = globalScope.SpellCatalog.getSelectableCastDamageTypes(entry.spellId);
    const canRestoreOtherCreatureHitPoints = globalScope.SpellCatalog.hasCastOutcomeTag(
      entry.spellId,
      "can-restore-other-creature-hit-points"
    );
    const blessedHealerEligible = canRestoreOtherCreatureHitPoints && Boolean(buildBlessedHealerRecovery({
      className: document.getElementById("class")?.value || "",
      characterLevel: getCharacterLevel(),
      castMethod: "slot",
      effectiveLevel: entry.spell.level,
      restoresOtherCreatureHitPoints: true
    }));
    const affinityType = document.getElementById("sorcerer-elemental-affinity-damage-type")?.value || "";
    let damageType = selectableTypes.includes(affinityType) ? affinityType : selectableTypes[0] || "";
    let restoresOtherCreatureHitPoints = blessedHealerEligible;
    let castOptions = cantrip
      ? null
      : globalScope.TabletopMode?.getSpellCastOptions?.(entry);
    let methodId = cantrip ? "cantrip" : castOptions?.defaultMethod || "";
    let slotLevel = castOptions?.defaultSlotLevel || entry.spell.level;
    let errorMessage = "";
    const content = createElement("div", "tabletop-cast-form");
    const clearError = () => {
      errorMessage = "";
      const error = content.querySelector(".tabletop-cast-form__error");
      if (error) error.textContent = "";
    };

    const getMethod = () => castOptions?.methods.find(method => method.id === methodId) || null;
    const getSlot = () => castOptions?.slots.find(slot => slot.level === Number(slotLevel)) || null;
    const getEffectiveLevel = () => {
      if (cantrip) return 0;
      if (methodId === "slot") return getSlot()?.level || entry.spell.level;
      return getMethod()?.effectiveLevel || entry.spell.level;
    };
    const getResourceId = () => methodId === "slot"
      ? getSlot()?.resourceId || ""
      : getMethod()?.resourceId || "";

    const render = () => {
      content.replaceChildren();
      if (!cantrip) {
        if (!castOptions?.methods.length) {
          content.appendChild(createElement(
            "p",
            "tabletop-cast-form__error",
            "目前沒有可用的免費次數、隨意施法、儀式或合法法術位。"
          ));
        } else if (castOptions.methods.length > 1) {
          const methods = createElement("fieldset", "tabletop-cast-form__methods");
          methods.appendChild(createElement("legend", "", "施法方式"));
          castOptions.methods.forEach(method => {
            const label = createElement("label", "tabletop-cast-form__choice");
            const input = document.createElement("input");
            input.type = "radio";
            input.name = "tabletop-cast-method";
            input.value = method.id;
            input.checked = method.id === methodId;
            input.addEventListener("change", () => {
              clearError();
              methodId = input.value;
              if (methodId === "slot" && !getSlot()) slotLevel = castOptions.defaultSlotLevel;
              updateDynamicFields();
            });
            label.append(input, document.createTextNode(method.label));
            if (method.id === "ritual") label.appendChild(createElement("small", "", `（${metadata.ritualExtraTime}）`));
            methods.appendChild(label);
          });
          content.appendChild(methods);
        } else {
          content.appendChild(createElement("p", "tabletop-cast-form__single", `施法方式：${castOptions.methods[0].label}`));
        }
      }

      const slotField = createElement("label", "tabletop-cast-form__field");
      slotField.dataset.castSlotField = "true";
      slotField.appendChild(createElement("span", "", "使用環位"));
      if ((castOptions?.slots.length || 0) > 1) {
        const select = document.createElement("select");
        select.setAttribute("aria-label", "使用環位");
        castOptions.slots.forEach(slot => {
          const option = document.createElement("option");
          option.value = String(slot.level);
          option.textContent = `${slot.level} 環（剩餘 ${slot.available}）${slot.noExtraEffect ? "－無額外升環效果" : ""}`;
          option.selected = slot.level === Number(slotLevel);
          select.appendChild(option);
        });
        select.addEventListener("change", () => {
          clearError();
          slotLevel = Number(select.value);
          updateSummary();
        });
        slotField.appendChild(select);
      } else if (castOptions?.slots.length === 1) {
        slotLevel = castOptions.slots[0].level;
        slotField.appendChild(createElement("strong", "", `${slotLevel} 環（唯一可用環位）`));
      }
      if (!cantrip && castOptions?.slots.length) content.appendChild(slotField);

      if (selectableTypes.length > 1) {
        const damageField = createElement("label", "tabletop-cast-form__field");
        damageField.appendChild(createElement("span", "", "本次傷害類型"));
        const select = document.createElement("select");
        select.setAttribute("aria-label", "本次傷害類型");
        selectableTypes.forEach(type => {
          const option = document.createElement("option");
          option.value = type;
          option.textContent = globalScope.SpellCatalog.damageTypeLabels[type] || type;
          option.selected = type === damageType;
          select.appendChild(option);
        });
        select.addEventListener("change", () => {
          clearError();
          damageType = select.value;
          updateSummary();
        });
        damageField.appendChild(select);
        content.appendChild(damageField);
      }

      if (blessedHealerEligible) {
        const targetField = createElement("fieldset", "tabletop-cast-form__methods");
        targetField.dataset.blessedHealerTargetField = "true";
        targetField.appendChild(createElement("legend", "", "神佑醫者：本次治療目標"));
        [
          { value: true, label: "至少一名其他生物會恢復生命值" },
          { value: false, label: "沒有其他生物恢復生命值" }
        ].forEach(option => {
          const label = createElement("label", "tabletop-cast-form__choice");
          const input = document.createElement("input");
          input.type = "radio";
          input.name = "tabletop-cast-blessed-healer-target";
          input.value = String(option.value);
          input.checked = option.value === restoresOtherCreatureHitPoints;
          input.addEventListener("change", () => {
            clearError();
            restoresOtherCreatureHitPoints = input.value === "true";
            updateSummary();
          });
          label.append(input, document.createTextNode(option.label));
          targetField.appendChild(label);
        });
        content.appendChild(targetField);
      }

      const summary = document.createElement("dl");
      summary.className = "tabletop-cast-summary";
      summary.dataset.castSummary = "true";
      content.appendChild(summary);
      const error = createElement("p", "tabletop-cast-form__error", errorMessage);
      error.setAttribute("role", "status");
      error.setAttribute("aria-live", "polite");
      content.appendChild(error);
      updateDynamicFields();
    };

    const updateDynamicFields = () => {
      const slotField = content.querySelector("[data-cast-slot-field]");
      if (slotField) slotField.hidden = methodId !== "slot";
      const blessedHealerField = content.querySelector("[data-blessed-healer-target-field]");
      if (blessedHealerField) blessedHealerField.hidden = methodId !== "slot";
      updateSummary();
    };

    const updateSummary = () => {
      const summary = content.querySelector("[data-cast-summary]");
      if (!summary) return;
      const method = getMethod();
      const slot = getSlot();
      const effectiveLevel = getEffectiveLevel();
      const currentId = globalScope.TabletopMode?.getConcentrationSpellId?.() || "";
      let resource = "不消耗資源";
      if (methodId === "free") resource = method?.resourceLabel || "免費施法次數";
      else if (methodId === "slot") resource = slot ? `${slot.level} 環法術位（剩餘 ${slot.available}）` : "沒有可用法術位";
      else if (methodId === "ritual") resource = `不消耗法術位；${metadata.ritualExtraTime}`;
      const upcast = effectiveLevel > entry.spell.level
        ? metadata.hasUpcastEffect ? "有升環效果" : "無額外升環效果"
        : "基礎環位";
      const concentration = globalScope.SpellCatalog.isConcentration(entry.spell)
        ? currentId && currentId !== entry.spellId
          ? `會取代目前專注：${getConcentrationName(currentId)}`
          : currentId === entry.spellId ? "繼續專注於同一法術" : "施法成功後開始專注"
        : "不需專注";
      const blessedHealer = blessedHealerEligible
        ? buildBlessedHealerRecovery({
            className: document.getElementById("class")?.value || "",
            characterLevel: getCharacterLevel(),
            castMethod: methodId,
            effectiveLevel,
            restoresOtherCreatureHitPoints
          })
        : null;
      summary.replaceChildren(
        createSummaryRow("法術", entry.spell.nameZh),
        createSummaryRow("來源", entry.sourceLabel || entry.source),
        createSummaryRow("方式", cantrip ? "戲法" : method?.label || "無可用方式"),
        createSummaryRow("有效環位", formatCastLevel(effectiveLevel)),
        createSummaryRow("消耗", resource),
        createSummaryRow("升環", cantrip ? "依角色總等級成長" : upcast),
        ...(selectableTypes.length > 1 ? [createSummaryRow(
          "傷害類型",
          globalScope.SpellCatalog.damageTypeLabels[damageType] || damageType || "尚未選擇"
        )] : []),
        ...(blessedHealerEligible ? [createSummaryRow(
          "神佑醫者",
          blessedHealer
            ? `施法後回復 ${blessedHealer.amount} 點 HP`
            : methodId !== "slot"
              ? "不套用（本次不是使用法術位施法）"
              : "不套用（本次沒有其他生物恢復生命值）"
        )] : []),
        createSummaryRow("專注", concentration)
      );
    };

    render();
    return globalScope.AppDialog.showContent({
      title: `施放${entry.spell.nameZh}`,
      content,
      cancelLabel: "取消",
      confirmLabel: "施法",
      initialFocus: selectableTypes.length > 1
        || (blessedHealerEligible && castOptions?.methods.some(method => method.id === "slot"))
        || (!cantrip && ((castOptions?.methods.length || 0) > 1 || (castOptions?.slots.length || 0) > 1))
        ? "content"
        : "primary",
      dismissOnBackdrop: false,
      trigger,
      resolveConfirm() {
        if (cantrip) return Object.freeze({
          ok: true,
          method: "cantrip",
          effectiveLevel: 0,
          resourceLabel: "不消耗資源",
          damageType,
          restoresOtherCreatureHitPoints: false
        });
        if (!methodId) {
          errorMessage = "目前沒有可用施法方式。";
          render();
          return false;
        }
        const selection = {
          method: methodId,
          slotLevel: methodId === "slot" ? Number(slotLevel) : 0,
          resourceId: getResourceId()
        };
        const committed = globalScope.TabletopMode?.commitSpellCastResource?.(entry, selection);
        if (!committed?.ok) {
          castOptions = globalScope.TabletopMode?.getSpellCastOptions?.(entry);
          methodId = castOptions?.defaultMethod || "";
          slotLevel = castOptions?.defaultSlotLevel || entry.spell.level;
          errorMessage = "施法資源已變更，未消耗其他格。請重新確認目前選項後再按施法。";
          render();
          return false;
        }
        return Object.freeze({
          ...committed,
          damageType,
          restoresOtherCreatureHitPoints: blessedHealerEligible
            && methodId === "slot"
            && restoresOtherCreatureHitPoints
        });
      }
    });
  }

  function getStableSpellTrigger(entry, preferredTarget = null) {
    if (
      preferredTarget instanceof HTMLElement
      && preferredTarget.isConnected
      && !preferredTarget.closest("[inert]")
    ) return preferredTarget;
    return Array.from(document.querySelectorAll(
      ".tabletop-spell-button[data-spell-id], .tabletop-action-option[data-spell-id]"
    ))
      .find(button => (
        button.dataset.spellId === entry.spellId
        && button.dataset.spellSourceKey === entry.sourceKey
      )) || null;
  }

  function buildRollEntries(entry, castResult) {
    const modifiers = getSpellOutcomeModifiers(entry, castResult);
    const spellcastingModifier = parseModifier(getFieldValue("spell-adjustment")) ?? 0;
    return globalScope.SpellCatalog.resolveCastOutcomes(entry.spellId, {
      effectiveLevel: castResult.effectiveLevel,
      characterLevel: getCharacterLevel(),
      damageType: castResult.damageType,
      spellcastingModifier,
      modifiers
    }).filter(outcome => outcome.autoOnCast).map(outcome => {
      const kindLabel = outcome.kind === "healing"
        ? "治療"
        : outcome.kind === "temporary-hp" ? "臨時生命值" : "傷害";
      const repeatLabel = outcome.repeat > 1
        ? `${outcome.repeatLabel || "第"} ${outcome.repeatIndex + 1}/${outcome.repeat}`
        : "";
      const typeLabel = outcome.damageTypeLabel ? `｜${outcome.damageTypeLabel}` : "";
      const modifierText = outcome.modifierLabels.length
        ? `；已套用：${outcome.modifierLabels.join("、")}`
        : "";
      return Object.freeze({
        expression: outcome.expression,
        fixed: outcome.fixed,
        label: `${entry.spell.nameZh}｜${formatCastLevel(castResult.effectiveLevel)}｜${kindLabel}${typeLabel}${repeatLabel ? `｜${repeatLabel}` : ""}`,
        detail: `${outcome.context || "依術文處理"}${modifierText}`
      });
    });
  }

  async function completeCast(entry, castResult, trigger = null) {
    const currentId = globalScope.TabletopMode?.getConcentrationSpellId?.() || "";
    if (globalScope.SpellCatalog.isConcentration(entry.spell) && currentId !== entry.spellId) {
      const message = currentId
        ? `已將專注替換為${entry.spell.nameZh}。`
        : `開始專注於${entry.spell.nameZh}。`;
      globalScope.TabletopMode?.setConcentrationSpellId(entry.spellId, message);
    }

    const blessedHealer = buildBlessedHealerRecovery({
      className: document.getElementById("class")?.value || "",
      characterLevel: getCharacterLevel(),
      castMethod: castResult.method,
      effectiveLevel: castResult.effectiveLevel,
      restoresOtherCreatureHitPoints: Boolean(
        castResult.restoresOtherCreatureHitPoints
        && globalScope.SpellCatalog.hasCastOutcomeTag(
          entry.spellId,
          "can-restore-other-creature-hit-points"
        )
      )
    });
    let blessedHealerSummary = "";
    if (blessedHealer) {
      let recovery = null;
      try {
        recovery = globalScope.TabletopMode?.restoreHitPoints?.(
          blessedHealer.amount,
          { sourceLabel: "神佑醫者：" }
        );
      } catch (error) {
        console.error("Blessed Healer recovery failed after cast commit.", error);
      }
      if (recovery?.ok) {
        blessedHealerSummary = recovery.restoredHp > 0
          ? `；神佑醫者使施法者回復 ${recovery.restoredHp} 點 HP`
          : "；神佑醫者未回復 HP（目前已達上限）";
      } else {
        blessedHealerSummary = `；神佑醫者應回復 ${blessedHealer.amount} 點 HP，但目前生命值資料無法自動更新`;
        globalScope.AppDialog?.notify(
          `已消耗施法資源；神佑醫者應回復 ${blessedHealer.amount} 點 HP，但目前生命值資料無法自動更新，請手動處理。`,
          { tone: "warning", duration: 7200 }
        );
      }
    }

    await new Promise(resolve => globalScope.requestAnimationFrame(resolve));
    const stableTrigger = getStableSpellTrigger(entry, trigger);

    const successPrefix = `已施放${entry.spell.nameZh}（${formatCastLevel(castResult.effectiveLevel)}；${castResult.resourceLabel}）${blessedHealerSummary}`;
    let rolls = [];
    try {
      rolls = buildRollEntries(entry, castResult);
    } catch (error) {
      console.error("Spell outcome resolution failed after cast commit.", error);
      globalScope.AppDialog?.notify(`${successPrefix}；施法結果資料無效，資源不會回滾，請依術文手動處理。`, { tone: "warning", duration: 7200 });
      restoreStableFocus(entry.spellId, stableTrigger, entry.sourceKey);
      return;
    }
    if (!rolls.length) {
      globalScope.AppDialog?.notify(`${successPrefix}。`, { tone: "success" });
      restoreStableFocus(entry.spellId, stableTrigger, entry.sourceKey);
      return;
    }
    if (!globalScope.DiceRoller?.isEnabled?.()) {
      globalScope.AppDialog?.notify(`${successPrefix}；擲骰系統已停用，請依上方術文手動擲骰。`, { tone: "warning", duration: 7200 });
      restoreStableFocus(entry.spellId, stableTrigger, entry.sourceKey);
      return;
    }
    const invalid = rolls.find(roll => roll.expression && !globalScope.DiceRoller.canRollExpression?.(roll.expression));
    if (invalid || typeof globalScope.DiceRoller.rollExpressionsInModal !== "function") {
      globalScope.AppDialog?.notify(`${successPrefix}；自動擲骰資料無效，資源不會回滾，請手動擲骰。`, { tone: "warning", duration: 7200 });
      restoreStableFocus(entry.spellId, stableTrigger, entry.sourceKey);
      return;
    }
    try {
      const rolled = globalScope.DiceRoller.rollExpressionsInModal(rolls, {
        title: `${entry.spell.nameZh}施法結果`,
        trigger: stableTrigger
      });
      if (!rolled?.ok) throw new Error(rolled?.reason || "roll failed");
    } catch (error) {
      console.error("Spell auto-roll failed after cast commit.", error);
      globalScope.AppDialog?.notify(`${successPrefix}；擲骰視窗發生錯誤，資源不會回滾，請手動擲骰。`, { tone: "warning", duration: 7200 });
      restoreStableFocus(entry.spellId, stableTrigger, entry.sourceKey);
    }
  }

  async function castSpell(entry, trigger) {
    if (!entry?.spell || !globalScope.SpellCatalog.canCastFromTabletop(entry.spellId)) return;
    const selectableTypes = globalScope.SpellCatalog.getSelectableCastDamageTypes(entry.spellId);
    const needsCantripChoice = entry.spell.level === 0 && selectableTypes.length > 1;
    const castResult = entry.spell.level === 0 && !needsCantripChoice
      ? Object.freeze({ ok: true, method: "cantrip", effectiveLevel: 0, resourceLabel: "不消耗資源", damageType: "" })
      : await requestCastConfiguration(entry, trigger, entry.spell.level === 0);
    if (!castResult?.ok) {
      restoreStableFocus(entry.spellId, trigger, entry.sourceKey);
      return;
    }
    await completeCast(entry, castResult, trigger);
  }

  async function showSpellDetail(entryOrSpellId, trigger) {
    const entry = entryOrSpellId && typeof entryOrSpellId === "object" && entryOrSpellId.spell
      ? entryOrSpellId
      : null;
    const spellId = entry?.spellId || String(entryOrSpellId || "");
    const spell = entry?.spell || globalScope.SpellCatalog?.getSpell(spellId);
    if (!spell || !globalScope.AppDialog) return;
    const currentId = globalScope.TabletopMode?.getConcentrationSpellId?.() || "";
    const actions = [{ label: "關閉", value: "close" }];
    if (currentId === spellId) actions.push({
      label: "停止專注",
      value: "stop-concentration",
      intent: "secondary"
    });
    if (entry && globalScope.SpellCatalog.canCastFromTabletop(spellId)) actions.push({
      label: "施法",
      value: "cast",
      intent: "primary"
    });

    const result = await globalScope.AppDialog.showContent({
      title: spell.nameZh,
      content: createSpellDetailContent(spell, entry),
      actions,
      trigger
    });
    if (result === "stop-concentration") {
      globalScope.TabletopMode?.stopConcentration(`已停止專注於${spell.nameZh}。`);
      globalScope.AppDialog.notify(`已停止專注：${spell.nameZh}。`, { tone: "info" });
      restoreStableFocus(spellId, trigger, entry?.sourceKey || "");
      return;
    }
    if (result === "cast") await castSpell(entry, trigger);
  }

  function getActiveConcentrationNote(spellId, spell) {
    if (!spell) {
      return `匯入的 spellId「${spellId}」不在目前法術目錄中；記錄未被清除，可手動停止專注。`;
    }
    if (!globalScope.SpellCatalog.isConcentration(spell)) {
      return "這筆匯入記錄的來源法術不是專注法術；記錄未被清除，可手動停止專注。";
    }
    if (!isSpellCurrentlySelected(spellId)) {
      return "來源法術已移除；專注記錄會保留，直到你手動停止。";
    }
    return "";
  }

  function createConcentrationCard(record, viewName, index) {
    const ended = record.status === "ended";
    const spell = globalScope.SpellCatalog?.getSpell(record.spellId);
    const replacementSpell = ended
      ? globalScope.SpellCatalog?.getSpell(record.replacementSpellId)
      : null;
    const card = createElement(
      "section",
      `tabletop-concentration${ended ? " tabletop-concentration--ended" : ""}`
    );
    const titleKey = String(record.noticeId || record.spellId || index)
      .replace(/[^A-Za-z0-9_-]/g, "-")
      .slice(0, 80);
    const titleId = `tabletop-concentration-${viewName}-${titleKey}-${index}`;
    card.setAttribute("aria-labelledby", titleId);

    const copy = createElement("div");
    copy.appendChild(createElement("span", "tabletop-eyebrow", ended ? "專注已結束" : "目前專注"));

    const detail = createElement("button", "tabletop-concentration__detail");
    detail.type = "button";
    detail.disabled = !spell;
    detail.dataset.concentrationAction = ended ? "ended-detail" : "active-detail";
    detail.dataset.spellId = record.spellId;
    const title = createElement(
      "span",
      "",
      spell
        ? `${ended ? "已結束" : "專注"}：${spell.nameZh}`
        : `${ended ? "已結束" : "專注"}：來源法術不存在`
    );
    title.id = titleId;
    detail.appendChild(title);

    const diceEnabled = !ended && Boolean(globalScope.DiceRoller?.isEnabled?.());
    if (!diceEnabled) detail.setAttribute("aria-haspopup", "dialog");
    detail.setAttribute(
      "aria-label",
      diceEnabled && spell
        ? `擲${spell.nameZh}專注體質豁免`
        : `查看${spell?.nameZh || "專注法術"}說明`
    );
    copy.appendChild(detail);

    const note = ended
      ? replacementSpell
        ? `因開始專注於「${replacementSpell.nameZh}」而結束。`
        : "因開始另一個專注法術而結束。"
      : getActiveConcentrationNote(record.spellId, spell);
    if (note) copy.appendChild(createElement("p", "", note));

    const action = createElement(
      "button",
      "tabletop-concentration__stop",
      ended ? "關閉" : "停止專注"
    );
    action.type = "button";
    action.dataset.concentrationAction = ended ? "dismiss" : "stop";
    if (record.noticeId) action.dataset.noticeId = record.noticeId;
    action.setAttribute(
      "aria-label",
      ended
        ? `關閉${spell?.nameZh || "這筆"}專注結束提醒`
        : `停止專注於${spell?.nameZh || "目前法術"}`
    );

    card.append(copy, action);
    return card;
  }

  function renderConcentrationSummaries() {
    const views = [elements.concentrationOverview, elements.concentrationSpells].filter(Boolean);
    if (!views.length) return;

    const spellId = globalScope.TabletopMode?.getConcentrationSpellId?.() || "";
    const ended = globalScope.TabletopMode?.getEndedConcentrations?.() || [];
    const records = [
      ...(spellId ? [{ status: "active", spellId }] : []),
      ...ended.slice().reverse().map(entry => ({
        status: "ended",
        noticeId: entry.id,
        spellId: entry.spellId,
        replacementSpellId: entry.replacementSpellId
      }))
    ];

    views.forEach(view => {
      view.hidden = records.length === 0;
      view.replaceChildren(...records.map((record, index) => (
        createConcentrationCard(record, view.dataset.concentrationView || "view", index)
      )));
    });
  }

  function renderEmptyState(message) {
    const empty = createElement("div");
    empty.appendChild(createElement("strong", "", message.title));
    empty.appendChild(createElement("p", "", message.body));
    elements.empty.replaceChildren(empty);
  }

  function getEmptyMessage(entries) {
    const hasClass = Boolean(document.getElementById("class")?.value);
    const hasLevel = Boolean(document.getElementById("level")?.value);
    if (!hasClass || !hasLevel) return {
      title: "尚未完成角色基礎選擇",
      body: "請先在角色卡的數值頁選擇職業與等級，再到法術頁完成法術選擇。"
    };
    const canCast = typeof globalScope.hasSpellcastingCapability === "function"
      ? globalScope.hasSpellcastingCapability()
      : true;
    if (!canCast) return {
      title: "目前角色沒有施法來源",
      body: "可在角色卡調整職業、種族、背景或專長；桌邊模式不會自行建立法術能力。"
    };
    if (!entries.length) return {
      title: "尚未選擇法術",
      body: "請到角色卡的法術頁新增或完成法術選擇；只有實際選取與能力衍生的法術會顯示在這裡。"
    };
    return null;
  }

  function render() {
    if (!initialized) return;
    const entries = getSelectedSpellEntries();
    const emptyMessage = getEmptyMessage(entries);
    elements.empty.hidden = !emptyMessage;
    elements.content.hidden = false;
    if (emptyMessage) renderEmptyState(emptyMessage);
    renderCastingSummary();
    renderSpellSlots();
    renderSelectedSpells(entries);
    renderConcentrationSummaries();
  }

  function scheduleRender() {
    if (scheduledRender) cancelAnimationFrame(scheduledRender);
    scheduledRender = requestAnimationFrame(() => {
      scheduledRender = 0;
      render();
    });
  }

  function handleConcentrationAction(event) {
    const button = event.target.closest("button[data-concentration-action]");
    if (!button || !event.currentTarget.contains(button)) return;
    const action = button.dataset.concentrationAction;
    const spellId = button.dataset.spellId || "";

    if (action === "active-detail") {
      if (globalScope.DiceRoller?.isEnabled?.()) {
        const spellName = getConcentrationName(spellId);
        if (rollConcentrationSave(spellName)) return;
      }
      if (spellId) showSpellDetail(spellId, button);
      return;
    }

    if (action === "ended-detail") {
      if (spellId) showSpellDetail(spellId, button);
      return;
    }

    if (action === "stop") {
      const currentId = globalScope.TabletopMode?.getConcentrationSpellId?.() || "";
      if (!currentId) return;
      const name = getConcentrationName(currentId);
      globalScope.TabletopMode.stopConcentration(`已停止專注於${name}。`);
      globalScope.AppDialog?.notify(`已停止專注：${name}。`, { tone: "info" });
      restoreStableFocus();
      return;
    }

    if (action !== "dismiss") return;
    const noticeId = button.dataset.noticeId || "";
    const notice = globalScope.TabletopMode?.getEndedConcentrations?.()
      .find(entry => entry.id === noticeId);
    if (!notice) return;
    const name = getConcentrationName(notice.spellId);
    if (!globalScope.TabletopMode.dismissEndedConcentration(
      noticeId,
      `已關閉${name}的專注結束提醒。`
    )) return;
    globalScope.AppDialog?.notify(`已關閉專注提醒：${name}。`, { tone: "info" });
    restoreStableFocus();
  }

  function init() {
    Object.assign(elements, {
      empty: document.getElementById("tabletop-spells-empty"),
      content: document.getElementById("tabletop-spells-content"),
      castingSummary: document.getElementById("tabletop-casting-summary"),
      spellSlotsSection: document.getElementById("tabletop-spell-slots-section"),
      spellSlots: document.getElementById("tabletop-spell-slots"),
      selectedSpells: document.getElementById("tabletop-selected-spells"),
      concentrationOverview: document.getElementById("tabletop-concentration-overview"),
      concentrationSpells: document.getElementById("tabletop-concentration-spells")
    });
    if (
      !elements.empty
      || (!elements.concentrationOverview && !elements.concentrationSpells)
      || !globalScope.TabletopMode
      || !globalScope.SpellCatalog
    ) return;
    initialized = true;

    [
      [elements.concentrationOverview, "overview"],
      [elements.concentrationSpells, "spells"]
    ].forEach(([view, name]) => {
      if (!view) return;
      view.dataset.concentrationView = name;
      view.addEventListener("click", handleConcentrationAction);
    });
    document.addEventListener("input", scheduleRender);
    document.addEventListener("change", scheduleRender);
    globalScope.addEventListener("tabletopstatechange", scheduleRender);
    globalScope.addEventListener("dicerollmodechange", scheduleRender);
    globalScope.addEventListener("tabletop-panelchange", event => {
      if (event.detail?.panel === "overview" || event.detail?.panel === "spells") scheduleRender();
    });

    const spellPanel = document.getElementById("tab-spells");
    if (spellPanel && globalScope.MutationObserver) {
      new MutationObserver(scheduleRender).observe(spellPanel, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      });
    }
    render();
  }

  globalScope.TabletopSpells = Object.freeze({
    getSelectedSpellEntries,
    isSpellCurrentlySelected,
    showSpellDetail,
    refresh: scheduleRender,
    logic: Object.freeze({
      buildLifeDiscipleModifier,
      buildBlessedHealerRecovery
    })
  });

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", init);
  }
})(typeof window !== "undefined" ? window : globalThis);

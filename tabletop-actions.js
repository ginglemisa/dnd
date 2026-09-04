(function attachTabletopActions(globalScope) {
  "use strict";

  const MODE_PREFERENCE_KEY = "dnd.tabletopActionMode.v1";
  const MODES = Object.freeze(["basic", "action", "bonus", "reaction", "movement"]);
  const MODE_LABELS = Object.freeze({
    basic: "動作",
    action: "特殊",
    bonus: "附贈",
    reaction: "反應",
    movement: "移動"
  });
  const CUSTOM_ACTION_LABEL_MAX = 40;
  const CUSTOM_ACTION_DESCRIPTION_MAX = 600;
  const selectedOptionKeys = new Map(MODES.map(mode => [mode, ""]));
  const spellGroupExpanded = new Map(["action", "bonus", "reaction"].map(mode => [mode, false]));
  const elements = {};
  let currentMode = "basic";
  let scheduledRender = 0;
  let initialized = false;

  function createElement(tagName, className = "", text = "") {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function getActionPreferences() {
    return globalScope.TabletopMode?.getTabletopActionPreferences?.() || {
      customActions: [],
      hiddenKeys: []
    };
  }

  function getOfficialHiddenKey(mode, optionKey) {
    return `official:${mode}:${String(optionKey || "")}`;
  }

  function getCustomHiddenKey(actionId) {
    return `custom:${actionId}`;
  }

  function getModeOptionSet(mode) {
    const api = globalScope.ActionPanel;
    const preferences = getActionPreferences();
    const hiddenKeys = new Set(preferences.hiddenKeys || []);
    const officialOptions = api
      ? (api.getTabletopOptions || api.getOptions)(mode).map(option => ({
          ...option,
          preferenceKey: getOfficialHiddenKey(mode, option.key),
          customActionId: ""
        }))
      : [];
    const customOptions = (preferences.customActions || [])
      .filter(action => action.mode === mode)
      .map(action => ({
        key: `custom:${action.id}`,
        label: action.label,
        description: action.description,
        source: "自訂",
        buttonTag: "自訂",
        preferenceKey: getCustomHiddenKey(action.id),
        customActionId: action.id
      }));
    const all = [...officialOptions, ...customOptions];
    return {
      all,
      visible: all.filter(option => !hiddenKeys.has(option.preferenceKey))
    };
  }

  function getHiddenCountForMode(mode, preferences = getActionPreferences()) {
    const customIds = new Set(
      (preferences.customActions || []).filter(action => action.mode === mode).map(action => action.id)
    );
    const officialPrefix = `official:${mode}:`;
    return (preferences.hiddenKeys || []).filter(key => (
      key.startsWith(officialPrefix)
      || (key.startsWith("custom:") && customIds.has(key.slice("custom:".length)))
    )).length;
  }

  function readField(id) {
    const field = document.getElementById(id);
    return field && "value" in field ? String(field.value || "").trim() : "";
  }

  function hasSelectedFeat(featName) {
    return Array.from(document.querySelectorAll("#feats-area select"))
      .some(select => select.value === featName);
  }

  function getAllWeaponDefinitions() {
    return [
      ...(globalScope.weapons_simple_melee || []),
      ...(globalScope.weapons_simple_ranged || []),
      ...(globalScope.weapons_martial_melee || []),
      ...(globalScope.weapons_martial_ranged || [])
    ];
  }

  function getEquippedWeapon(hand) {
    const selectId = hand === "main" ? "mainHand" : "offHand";
    const weaponName = document.getElementById(selectId)?.value || "";
    return getAllWeaponDefinitions().find(weapon => weapon?.名稱 === weaponName) || null;
  }

  function weaponHasProperty(weapon, keyword) {
    return [weapon?.屬性1, weapon?.屬性2, weapon?.屬性3, weapon?.屬性4]
      .some(property => String(property || "").includes(keyword));
  }

  function getWeaponData(hand) {
    const prefix = hand === "main" ? "atk-main" : "atk-off";
    const mastery = document.getElementById(`${prefix}-mastery`);
    const isAlternateMain = hand === "off" && document.getElementById("offHandAsMain")?.checked === true;
    return {
      hand,
      label: hand === "main" ? "主手" : (isAlternateMain ? "另一把主手" : "副手"),
      name: readField(`${prefix}-name`),
      hit: readField(`${prefix}-hit`),
      damage: readField(`${prefix}-dmg`),
      note: readField(`${prefix}-note`),
      mastery: mastery && !mastery.hidden ? String(mastery.textContent || "").trim() : "",
      masteryRule: mastery && !mastery.hidden ? String(mastery.dataset.weaponRule || "").trim() : ""
    };
  }

  function hasWeaponData(weapon) {
    return Boolean(weapon.name);
  }

  function parseModifier(value) {
    const normalized = String(value || "").trim().replace(/−/g, "-");
    if (!/^[+-]?\d+$/.test(normalized)) return null;
    const modifier = Number(normalized);
    return Number.isSafeInteger(modifier) ? modifier : null;
  }

  function getDamageRollExpression(value) {
    const normalized = String(value || "").trim().replace(/−/g, "-");
    return normalized.match(/^\d+\s*d\s*\d+(?:\s*[+-]\s*(?:\d+\s*d\s*\d+|\d+))*/iu)?.[0] || "";
  }

  function appendDefinition(list, term, value, rollType = "", label = "", weapon = null) {
    const item = createElement("div", "tabletop-weapon-field");
    const description = createElement("dd");
    const displayValue = value || "—";
    if (rollType) {
      const button = createElement("button", "tabletop-inline-roll", displayValue);
      button.type = "button";
      const modifier = rollType === "hit"
        ? parseModifier(value)
        : rollType === "attack"
          ? parseModifier(weapon?.hit)
          : null;
      const damageExpression = getDamageRollExpression(
        rollType === "attack" ? weapon?.damage : value
      );
      const canRoll = rollType === "hit"
        ? modifier !== null
        : rollType === "attack"
          ? Boolean(
              weapon?.name
              && modifier !== null
              && globalScope.DiceRoller?.canRollExpression?.(damageExpression)
            )
          : Boolean(globalScope.DiceRoller?.canRollExpression?.(damageExpression));
      button.disabled = !canRoll || !globalScope.DiceRoller?.isEnabled?.();
      button.setAttribute(
        "aria-label",
        button.disabled ? `${label}${term}；請先開啟擲骰系統` : `擲${label}${term}`
      );
      button.addEventListener("click", () => {
        if (rollType === "attack") {
          const hitExpression = `1d20${modifier < 0 ? "" : "+"}${modifier}`;
          const weaponLabel = `${weapon.label}${weapon.name || ""}`;
          globalScope.DiceRoller?.rollExpressions?.([
            { expression: hitExpression, label: `${weaponLabel} 命中` },
            { expression: damageExpression, label: `${weaponLabel} 傷害`, toastLabel: "傷害" }
          ]);
          return;
        }
        if (rollType === "hit") {
          globalScope.DiceRoller?.roll?.({
            count: 1,
            sides: 20,
            modifier,
            includeModifier: true,
            label: `${label}${term}`
          });
          return;
        }
        globalScope.DiceRoller?.rollExpression?.(damageExpression, { label: `${label}${term}` });
      });
      description.appendChild(button);
    } else {
      description.textContent = displayValue;
    }
    item.append(createElement("dt", "", term), description);
    list.appendChild(item);
    return item;
  }

  function createWeaponSummary(weapon) {
    const section = createElement("section", "weapon-attack-card tabletop-weapon-attack-card");
    section.setAttribute("aria-label", `${weapon.label}武器攻擊`);

    const list = createElement("dl", "weapon-attack-fields tabletop-weapon-fields");
    appendDefinition(
      list,
      "名稱",
      weapon.name || "未裝備",
      "attack",
      `${weapon.label}${weapon.name ? ` ${weapon.name}` : ""}命中與傷害`,
      weapon
    );
    appendDefinition(list, "命中", weapon.hit, "hit", `${weapon.label}${weapon.name ? ` ${weapon.name}` : ""}`);
    appendDefinition(list, "傷害", weapon.damage, "damage", `${weapon.label}${weapon.name ? ` ${weapon.name}` : ""}`);
    const noteField = appendDefinition(list, "備註", weapon.note);
    if (weapon.mastery && weapon.masteryRule) {
      const note = noteField.querySelector("dd");
      const noteText = createElement("span", "tabletop-weapon-note-text", weapon.note || "—");
      noteText.title = weapon.note || "—";
      const masteryButton = createElement("button", "tabletop-source-tag tabletop-weapon-mastery", `精通：${weapon.mastery}`);
      masteryButton.type = "button";
      masteryButton.dataset.weaponRuleKind = "mastery";
      masteryButton.dataset.weaponRule = weapon.masteryRule;
      masteryButton.setAttribute("aria-label", `精通：${weapon.mastery}，點擊查看說明`);
      noteField.classList.add("tabletop-weapon-field--note-with-mastery");
      note?.replaceChildren(noteText, masteryButton);
    }
    list.querySelectorAll("dt").forEach(term => term.classList.add("sr-only"));
    section.appendChild(list);
    return section;
  }

  function renderWeapons() {
    if (!elements.weaponSummary) return;
    const weapons = [getWeaponData("main"), getWeaponData("off")];
    if (!weapons.some(hasWeaponData)) {
      const empty = createElement("div", "tabletop-empty-state");
      empty.textContent = "尚未裝備武器，若下拉選單不符需求，可關閉武器攻擊自動化自行填寫。";
      elements.weaponSummary.replaceChildren(empty);
      return;
    }
    elements.weaponSummary.replaceChildren(...weapons.filter(hasWeaponData).map(createWeaponSummary));
  }

  function getWeaponRuleEntries() {
    const entries = [];
    const equippedWeapons = [getEquippedWeapon("main"), getEquippedWeapon("off")].filter(Boolean);
    const selectedClass = document.getElementById("class")?.value || "";
    const characterLevel = Number.parseInt(document.getElementById("level")?.value || "0", 10) || 0;
    if (selectedClass === "fighter" && characterLevel >= 3) {
      entries.push(["精通重擊", "武器與徒手打擊的攻擊檢定擲出 19 或 20 時即可造成重擊。"]);
    }
    if (hasSelectedFeat("兇蠻打手")) {
      entries.push(["受訓善戰", "每回合 1 次，武器命中時傷害骰擲 2 次，取其一。"]);
    }
    if (hasSelectedFeat("擒抱者")) {
      entries.push(["攻擊優勢", "對被你擒抱的目標攻擊具有優勢。"]);
    }
    if (
      hasSelectedFeat("巨武器戰鬥")
      && equippedWeapons.some(weapon => weaponHasProperty(weapon, "雙手") || weaponHasProperty(weapon, "兩用"))
    ) {
      entries.push(["寸長寸強", "將「雙手」或「兩用」武器的傷害骰 1 或 2 視為 3。"]);
    }
    if (
      hasSelectedFeat("雙武器戰鬥")
      && equippedWeapons.some(weapon => weaponHasProperty(weapon, "輕型"))
    ) {
      entries.push(["幫撐十秒", "使用「輕型」武器進行副手攻擊時，可用屬性加值提升傷害。"]);
    }
    return entries;
  }

  function renderWeaponRules() {
    if (!elements.weaponRuleSection || !elements.weaponRuleSummary) return;
    const entries = getWeaponRuleEntries();
    elements.weaponRuleSection.hidden = entries.length === 0;
    elements.weaponRuleSummary.replaceChildren(...entries.map(([label, detail]) => {
      const item = createElement("p", "tabletop-defense-summary__item");
      item.append(createElement("strong", "", `${label}：`), document.createTextNode(detail));
      return item;
    }));
  }

  function createActionDescription(option, prompt) {
    const description = createElement("div", "tabletop-action-description");
    description.setAttribute("role", "status");
    description.setAttribute("aria-live", "polite");
    if (!option) {
      description.appendChild(createElement("p", "tabletop-action-description__prompt", prompt));
      return description;
    }

    const heading = createElement("div", "tabletop-action-description__heading");
    heading.appendChild(createElement("strong", "", option.label));
    if (option.source) heading.appendChild(createElement("span", "tabletop-source-tag", option.source));
    const copy = createElement("div", "tabletop-action-description__copy");
    if (option.key === "drink-potion") {
      const description = String(option.description || "");
      const match = description.match(/\d+\s*d\s*(?:100|20|12|10|8|6|4)(?:\s*[+-]\s*\d+)?/i);
      if (match && Number.isInteger(match.index)) {
        copy.appendChild(document.createTextNode(description.slice(0, match.index)));
        const rollButton = createElement("button", "tabletop-dice-expression", match[0]);
        rollButton.type = "button";
        rollButton.disabled = !globalScope.DiceRoller?.isEnabled?.();
        rollButton.setAttribute(
          "aria-label",
          rollButton.disabled ? `${match[0]}；請先開啟擲骰系統` : `擲喝藥水恢復量 ${match[0]}`
        );
        rollButton.addEventListener("click", () => {
          globalScope.DiceRoller?.rollExpression?.(match[0], { label: "喝藥水恢復生命值" });
        });
        copy.append(
          rollButton,
          document.createTextNode(description.slice(match.index + match[0].length))
        );
      } else {
        copy.textContent = description;
      }
    } else {
      copy.textContent = option.description;
    }
    description.append(heading, copy);
    return description;
  }

  async function openCustomActionEditor(action = null, trigger = elements.manage) {
    if (typeof globalScope.AppDialog?.showContent !== "function") return false;
    const token = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nameId = `tabletop-custom-action-name-${token}`;
    const modeId = `tabletop-custom-action-mode-${token}`;
    const descriptionId = `tabletop-custom-action-description-${token}`;
    const errorId = `tabletop-custom-action-error-${token}`;
    let nameInput = null;
    let modeSelect = null;
    let descriptionInput = null;
    let error = null;

    const result = await globalScope.AppDialog.showContent({
      title: action ? "編輯自訂按鈕" : "新增自訂按鈕",
      message: "自訂按鈕只顯示文字說明，不會執行擲骰、消耗資源或其他自動化。",
      variant: "action-editor",
      cancelLabel: "取消",
      confirmLabel: action ? "儲存變更" : "新增按鈕",
      initialFocus: "content",
      dismissOnBackdrop: false,
      trigger,
      renderContent(body) {
        const form = createElement("form", "tabletop-action-editor");
        form.noValidate = true;

        const source = createElement("div", "tabletop-action-editor__source");
        source.append(
          createElement("span", "", "來源"),
          createElement("span", "tabletop-source-tag", "自訂")
        );

        const nameField = createElement("label", "tabletop-action-editor__field");
        nameField.htmlFor = nameId;
        nameField.appendChild(createElement("span", "", "名稱"));
        nameInput = document.createElement("input");
        nameInput.id = nameId;
        nameInput.type = "text";
        nameInput.maxLength = CUSTOM_ACTION_LABEL_MAX;
        nameInput.value = action?.label || "";
        nameInput.autocomplete = "off";
        nameInput.dataset.stateTransient = "true";
        nameInput.setAttribute("aria-describedby", errorId);
        nameField.appendChild(nameInput);

        const modeField = createElement("label", "tabletop-action-editor__field");
        modeField.htmlFor = modeId;
        modeField.appendChild(createElement("span", "", "分類"));
        modeSelect = document.createElement("select");
        modeSelect.id = modeId;
        modeSelect.dataset.stateTransient = "true";
        MODES.forEach(mode => {
          const option = document.createElement("option");
          option.value = mode;
          option.textContent = MODE_LABELS[mode];
          modeSelect.appendChild(option);
        });
        modeSelect.value = MODES.includes(action?.mode) ? action.mode : currentMode;
        modeSelect.setAttribute("aria-describedby", errorId);
        modeField.appendChild(modeSelect);

        const descriptionField = createElement("label", "tabletop-action-editor__field");
        descriptionField.htmlFor = descriptionId;
        descriptionField.appendChild(createElement("span", "", "說明"));
        descriptionInput = document.createElement("textarea");
        descriptionInput.id = descriptionId;
        descriptionInput.maxLength = CUSTOM_ACTION_DESCRIPTION_MAX;
        descriptionInput.rows = 5;
        descriptionInput.value = action?.description || "";
        descriptionInput.dataset.stateTransient = "true";
        descriptionInput.setAttribute("aria-describedby", errorId);
        descriptionField.appendChild(descriptionInput);

        error = createElement("p", "tabletop-action-editor__error");
        error.id = errorId;
        error.setAttribute("aria-live", "polite");

        [nameInput, modeSelect, descriptionInput].forEach(field => {
          field.addEventListener("input", () => {
            field.removeAttribute("aria-invalid");
            error.textContent = "";
          });
        });
        form.addEventListener("submit", event => {
          event.preventDefault();
          body.closest(".app-dialog__surface")
            ?.querySelector(".app-dialog__button--primary")
            ?.click();
        });
        form.append(source, nameField, modeField, descriptionField, error);
        body.appendChild(form);
      },
      resolveConfirm() {
        const label = nameInput?.value.trim() || "";
        const mode = modeSelect?.value || "";
        const description = descriptionInput?.value.trim() || "";
        [nameInput, modeSelect, descriptionInput].forEach(field => field?.removeAttribute("aria-invalid"));

        if (!label) {
          nameInput?.setAttribute("aria-invalid", "true");
          error.textContent = "請輸入按鈕名稱。";
          nameInput?.focus();
          return false;
        }
        if (label.length > CUSTOM_ACTION_LABEL_MAX) {
          nameInput?.setAttribute("aria-invalid", "true");
          error.textContent = `名稱最多 ${CUSTOM_ACTION_LABEL_MAX} 個字元。`;
          nameInput?.focus();
          return false;
        }
        if (!MODES.includes(mode)) {
          modeSelect?.setAttribute("aria-invalid", "true");
          error.textContent = "請選擇有效的分類。";
          modeSelect?.focus();
          return false;
        }
        if (!description) {
          descriptionInput?.setAttribute("aria-invalid", "true");
          error.textContent = "請輸入按鈕說明。";
          descriptionInput?.focus();
          return false;
        }
        if (description.length > CUSTOM_ACTION_DESCRIPTION_MAX) {
          descriptionInput?.setAttribute("aria-invalid", "true");
          error.textContent = `說明最多 ${CUSTOM_ACTION_DESCRIPTION_MAX} 個字元。`;
          descriptionInput?.focus();
          return false;
        }

        const values = { label, mode, description };
        const saved = action
          ? globalScope.TabletopMode?.updateCustomTabletopAction?.(action.id, values)
          : globalScope.TabletopMode?.addCustomTabletopAction?.(values);
        if (!saved?.ok) {
          error.textContent = saved?.reason === "limit"
            ? "自訂按鈕已達 50 筆上限，請先刪除不再使用的項目。"
            : saved?.reason === "storage"
              ? "無法寫入本機儲存，請確認瀏覽器允許儲存後再試。"
              : "無法儲存這顆按鈕，請檢查欄位後再試。";
          return false;
        }
        return saved.action;
      }
    });

    if (!result || typeof result !== "object") return false;
    render();
    globalScope.AppDialog.notify(
      action ? `已更新「${result.label}」。` : `已新增「${result.label}」至${MODE_LABELS[result.mode]}。`,
      { tone: "success" }
    );
    return true;
  }

  function renderActionManagerContent(container) {
    const api = globalScope.ActionPanel;
    if (!api) return;
    const preferences = getActionPreferences();
    const optionSet = getModeOptionSet(currentMode);
    const hiddenKeys = new Set(preferences.hiddenKeys || []);
    const header = createElement("div", "tabletop-action-manager__toolbar");
    const summary = createElement(
      "p",
      "tabletop-action-manager__summary",
      `${MODE_LABELS[currentMode]}共有 ${optionSet.all.length} 顆目前可用按鈕。取消勾選即可隱藏。`
    );
    const toolbarActions = createElement("div", "tabletop-action-manager__toolbar-actions");
    const restore = createElement("button", "tabletop-compact-button", "全部恢復");
    restore.type = "button";
    restore.disabled = getHiddenCountForMode(currentMode, preferences) === 0;
    const add = createElement("button", "tabletop-compact-button tabletop-action-manager__add", "新增按鈕");
    add.type = "button";
    toolbarActions.append(restore, add);
    header.append(summary, toolbarActions);

    const list = createElement("div", "tabletop-action-manager__list");
    list.setAttribute("role", "list");
    if (!optionSet.all.length) {
      list.appendChild(createElement("p", "tabletop-inline-empty", "目前分類沒有按鈕；仍可新增自訂按鈕。"));
    } else {
      optionSet.all.forEach(option => {
        const row = createElement("div", "tabletop-action-manager__row");
        row.setAttribute("role", "listitem");
        const visibility = createElement("label", "tabletop-action-manager__visibility");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !hiddenKeys.has(option.preferenceKey);
        checkbox.setAttribute("aria-label", `顯示${option.label}`);
        const copy = createElement("span", "tabletop-action-manager__copy");
        copy.append(
          createElement("strong", "", api.getButtonLabel(option)),
          createElement("span", "tabletop-source-tag", option.customActionId ? "自訂" : (option.buttonTag || option.source || "內建"))
        );
        visibility.append(checkbox, copy);
        row.appendChild(visibility);

        if (option.customActionId) {
          const actions = createElement("div", "tabletop-action-manager__row-actions");
          const edit = createElement("button", "tabletop-compact-button", "編輯");
          edit.type = "button";
          const remove = createElement("button", "tabletop-compact-button tabletop-danger-button", "刪除");
          remove.type = "button";
          edit.addEventListener("click", async () => {
            const latest = getActionPreferences().customActions
              .find(action => action.id === option.customActionId);
            if (latest) await openCustomActionEditor(latest, edit);
            openActionManager(elements.manage);
          });
          remove.addEventListener("click", async () => {
            const confirmed = await globalScope.AppDialog?.requestDecision({
              title: `刪除「${option.label}」`,
              message: "這會從這台裝置的桌邊動作移除這顆自訂按鈕，且無法復原。角色資料不受影響。",
              cancelLabel: "取消",
              confirmLabel: "刪除按鈕",
              intent: "danger",
              dismissOnBackdrop: false,
              trigger: remove
            });
            if (confirmed) {
              const removed = globalScope.TabletopMode?.removeCustomTabletopAction?.(option.customActionId);
              if (!removed?.ok) {
                globalScope.AppDialog?.notify(
                  removed?.reason === "storage"
                    ? "無法寫入本機儲存，按鈕沒有刪除。"
                    : "找不到這顆自訂按鈕。",
                  { tone: "error" }
                );
              } else {
                render();
                globalScope.AppDialog?.notify(`已刪除「${removed.action.label}」。`, { tone: "success" });
              }
            }
            openActionManager(elements.manage);
          });
          actions.append(edit, remove);
          row.appendChild(actions);
        }

        checkbox.addEventListener("change", () => {
          const result = globalScope.TabletopMode?.setTabletopActionHidden?.(
            option.preferenceKey,
            !checkbox.checked
          );
          if (!result?.ok) {
            checkbox.checked = !checkbox.checked;
            globalScope.AppDialog?.notify(
              result?.reason === "storage"
                ? "無法寫入本機儲存，顯示設定沒有變更。"
                : "無法變更這顆按鈕的顯示設定。",
              { tone: "error" }
            );
            return;
          }
          restore.disabled = getHiddenCountForMode(currentMode) === 0;
          render();
        });
        list.appendChild(row);
      });
    }

    restore.addEventListener("click", () => {
      const result = globalScope.TabletopMode?.restoreTabletopActionCategory?.(currentMode);
      if (!result?.ok) {
        globalScope.AppDialog?.notify("無法寫入本機儲存，按鈕沒有恢復。", { tone: "error" });
        return;
      }
      render();
      renderActionManagerContent(container);
      container.querySelector(".tabletop-action-manager__add")?.focus();
      if (result.restored) {
        globalScope.AppDialog?.notify(`已恢復${MODE_LABELS[currentMode]}分類的按鈕。`, { tone: "success" });
      }
    });
    add.addEventListener("click", async () => {
      await openCustomActionEditor(null, add);
      openActionManager(elements.manage);
    });
    container.replaceChildren(header, list);
  }

  async function openActionManager(trigger = elements.manage) {
    if (typeof globalScope.AppDialog?.showContent !== "function") return;
    const content = createElement("div", "tabletop-action-manager");
    renderActionManagerContent(content);
    await globalScope.AppDialog.showContent({
      title: `管理${MODE_LABELS[currentMode]}按鈕`,
      message: "這些設定只保留在目前裝置，不會寫入角色或分享資料。",
      content,
      variant: "action-manager",
      confirmLabel: "完成",
      initialFocus: "content",
      trigger
    });
  }

  function renderActionPanel(mode) {
    const panel = elements.panels?.find(candidate => candidate.dataset.tabletopActionPanel === mode);
    const api = globalScope.ActionPanel;
    if (!panel || !api) return;
    const meta = api.getModeMeta(mode);
    const optionSet = getModeOptionSet(mode);
    const options = optionSet.visible;
    if (!meta) return;

    let selectedKey = selectedOptionKeys.get(mode) || "";
    let selected = options.find(option => option.key === selectedKey) || null;
    if (!selected) {
      selectedKey = "";
      selectedOptionKeys.set(mode, "");
    }

    const context = createElement("div", "tabletop-action-context");
    const contextCopy = createElement("div");
    contextCopy.append(
      createElement("strong", "", meta.timing),
      createElement("span", "", meta.summary)
    );
    context.append(contextCopy);

    const layout = createElement("div", "tabletop-action-layout");
    const optionList = createElement("div", "tabletop-action-options");
    optionList.setAttribute("aria-label", "可用選項");
    optionList.dataset.actionMode = mode;
    const spellSourceLabel = api.getSourceLabels?.().spell || "法術";
    const spellOptions = options.filter(option => option.source === spellSourceLabel);
    const regularOptions = options.filter(option => option.source !== spellSourceLabel);

    function createOptionButton(option) {
      const opensSpellDialog = option.source === spellSourceLabel && Boolean(option.spellId);
      const button = createElement("button", "tabletop-action-option");
      button.type = "button";
      button.dataset.actionOptionKey = option.key;
      if (opensSpellDialog) {
        button.dataset.spellId = option.spellId;
        button.dataset.spellSourceKey = option.spellSourceKey || "";
        button.setAttribute("aria-haspopup", "dialog");
      } else {
        button.setAttribute("aria-pressed", String(option.key === selectedKey));
        if (option.key === selectedKey) button.classList.add("is-selected");
      }
      button.appendChild(createElement("span", "", api.getButtonLabel(option)));
      const buttonTag = option.buttonTag || option.source;
      if (buttonTag) button.appendChild(createElement("span", "tabletop-source-tag", buttonTag));
      button.addEventListener("click", () => {
        if (opensSpellDialog) {
          selectedOptionKeys.set(mode, "");
          optionList.querySelectorAll(".tabletop-action-option.is-selected").forEach(selectedButton => {
            selectedButton.classList.remove("is-selected");
            selectedButton.setAttribute("aria-pressed", "false");
          });
          layout.querySelector(".tabletop-action-description")
            ?.replaceWith(createActionDescription(null, meta.prompt));
          const matchingEntries = globalScope.TabletopSpells?.getSelectedSpellEntries?.()
            .filter(entry => entry.spellId === option.spellId) || [];
          const spellEntry = matchingEntries.find(entry => entry.sourceKey === option.spellSourceKey)
            || (matchingEntries.length === 1 ? matchingEntries[0] : null);
          globalScope.TabletopSpells?.showSpellDetail(spellEntry || option.spellId, button);
          return;
        }
        selectedOptionKeys.set(mode, option.key);
        renderActionPanel(mode);
      });
      return button;
    }

    regularOptions.forEach(option => optionList.appendChild(createOptionButton(option)));

    if (!options.length) {
      const empty = createElement(
        "p",
        "tabletop-action-options__empty",
        "目前分類的按鈕都已隱藏，可從「管理」恢復。"
      );
      optionList.appendChild(empty);
    }

    if (spellOptions.length && spellGroupExpanded.has(mode)) {
      const expanded = spellGroupExpanded.get(mode) === true;
      const groupId = `tabletop-action-spells-${mode}`;
      const toggle = createElement("button", "tabletop-action-spell-toggle");
      toggle.type = "button";
      toggle.setAttribute("aria-expanded", String(expanded));
      toggle.setAttribute("aria-controls", groupId);
      toggle.setAttribute(
        "aria-label",
        `法術，共 ${spellOptions.length} 個，目前${expanded ? "展開" : "收合"}，點擊${expanded ? "收合" : "展開"}`
      );
      toggle.append(
        createElement("strong", "", "法術"),
        createElement("span", "tabletop-action-spell-toggle__hint", `${expanded ? "點擊收合" : "點擊展開"} · ${spellOptions.length} 個`),
        createElement("span", "tabletop-action-spell-toggle__icon", "⌄")
      );
      toggle.addEventListener("click", () => {
        spellGroupExpanded.set(mode, !expanded);
        renderActionPanel(mode);
      });

      const spellGroup = createElement("div", "tabletop-action-spell-options");
      spellGroup.id = groupId;
      spellGroup.hidden = !expanded;
      spellOptions.forEach(option => spellGroup.appendChild(createOptionButton(option)));
      optionList.append(toggle, spellGroup);
    }
    layout.append(optionList, createActionDescription(selected, meta.prompt));
    panel.replaceChildren(context, layout);
  }

function updateTabVisibility() {
  const api = globalScope.ActionPanel;
  if (!api || !elements.tabs?.length) return;

  elements.tabs.forEach(tab => {
    const mode = tab.dataset.tabletopActionTab;
    const hasOptions = getModeOptionSet(mode).all.length > 0;
    tab.hidden = !hasOptions;
  });
}

  function renderMetamagic() {
    const section = document.getElementById("tabletop-metamagic-section");
  const output = document.getElementById("tabletop-metamagic-options");
  if (!section || !output) return;

  const isSorcerer = document.getElementById("class")?.value === "sorcerer";
  section.hidden = !isSorcerer;

  if (!isSorcerer) {
    output.replaceChildren();
    return;
  }

  const inputs = Array.from(
    document.querySelectorAll("#metamagicOptions input[data-metamagic-name]:checked")
  );

  if (!inputs.length) {
    output.textContent = "尚未選擇超魔法";
    return;
  }

  const items = inputs.flatMap(input => {
    const name = input.dataset.metamagicName || "";
    const card = input.closest(".feature-choice-card--metamagic");
    if (!name || !card) return [];

const body = card.querySelector(".feature-choice-card__body");
if (!body) return [];

return [{
  name,
  body: body.cloneNode(true)
}];
  });

  output.replaceChildren(
    ...items.map(item => {
  const article = createElement("article", "tabletop-metamagic-option");
  article.appendChild(
    createElement("strong", "", item.name)
  );
  article.appendChild(item.body);
  return article;
    })
  );
}

  function renderNotice() {
    if (!elements.notice) return;
    const hasClass = Boolean(document.getElementById("class")?.value);
    const hasLevel = Boolean(document.getElementById("level")?.value);
    elements.notice.hidden = hasClass && hasLevel;
    elements.notice.textContent = "請先在角色卡的數值頁選擇職業與等級；基本動作仍可查閱，角色能力會在完成選擇後加入。";
  }

function render() {
  if (!initialized) return;
  renderNotice();
  renderWeapons();
  renderWeaponRules();
  updateTabVisibility();
  renderActionPanel(currentMode);
  renderMetamagic();
}

  function scheduleRender() {
    if (scheduledRender) cancelAnimationFrame(scheduledRender);
    scheduledRender = requestAnimationFrame(() => {
      scheduledRender = 0;
      render();
    });
  }

  function setMode(mode, { persist = true, focusTab = false } = {}) {
  const api = globalScope.ActionPanel;

  let nextMode = MODES.includes(mode) ? mode : "basic";

  if (api && getModeOptionSet(nextMode).all.length === 0) {
    const fallbackTab = elements.tabs?.find(tab => {
      const tabMode = tab.dataset.tabletopActionTab;
      return getModeOptionSet(tabMode).all.length > 0;
    });

    if (fallbackTab) {
      nextMode = fallbackTab.dataset.tabletopActionTab;
    }
  }

  currentMode = nextMode;

  elements.tabs?.forEach(tab => {
    const selected = tab.dataset.tabletopActionTab === currentMode;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    tab.classList.toggle("is-active", selected);

    if (selected && focusTab) {
      tab.focus({ preventScroll: true });
    }
  });

  elements.panels?.forEach(panel => {
    panel.hidden = panel.dataset.tabletopActionPanel !== currentMode;
  });

  if (persist) {
    globalScope.dndStorage?.setItem(MODE_PREFERENCE_KEY, currentMode);
  }

  renderActionPanel(currentMode);
}

  function handleTabKeydown(event) {
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const tabs = elements.tabs || [];
    const index = tabs.indexOf(event.currentTarget);
    let nextIndex = index;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    const nextTab = tabs[nextIndex];
    if (nextTab) setMode(nextTab.dataset.tabletopActionTab, { focusTab: true });
  }

  function init() {
    Object.assign(elements, {
      notice: document.getElementById("tabletop-actions-notice"),
      weaponSummary: document.getElementById("tabletop-weapon-summary"),
      weaponRuleSection: document.getElementById("tabletop-weapon-rule-summary-section"),
      weaponRuleSummary: document.getElementById("tabletop-weapon-rule-summary"),
      manage: document.getElementById("tabletop-action-manage"),
      notes: document.getElementById("tabletop-action-notes"),
      tabs: Array.from(document.querySelectorAll("[data-tabletop-action-tab]")),
      panels: Array.from(document.querySelectorAll("[data-tabletop-action-panel]"))
    });
    if (!elements.weaponSummary || !elements.panels.length || !globalScope.ActionPanel) return;
    initialized = true;

    elements.tabs.forEach(tab => {
      tab.addEventListener("click", () => setMode(tab.dataset.tabletopActionTab));
      tab.addEventListener("keydown", handleTabKeydown);
    });
    elements.manage?.addEventListener("click", () => openActionManager(elements.manage));
    if (elements.notes) {
      elements.notes.value = getActionPreferences().notes || "";
      elements.notes.addEventListener("input", () => {
        globalScope.TabletopMode?.setTabletopActionNotes?.(elements.notes.value);
      });
    }
    document.addEventListener("input", scheduleRender);
    document.addEventListener("change", scheduleRender);
    globalScope.addEventListener("actionpanelchange", scheduleRender);
    globalScope.addEventListener("tabletopactionpreferenceschange", scheduleRender);
    globalScope.addEventListener("dicerollmodechange", scheduleRender);
    globalScope.addEventListener("tabletop-panelchange", event => {
      if (event.detail?.panel === "actions") scheduleRender();
    });

    const sourcePanel = document.getElementById("tab-actions");
    if (sourcePanel && globalScope.MutationObserver) {
      new MutationObserver(scheduleRender).observe(sourcePanel, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      });
    }

    setMode(globalScope.dndStorage?.getItem(MODE_PREFERENCE_KEY), {
      persist: false
    });
    render();
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", init);
  }
})(typeof window !== "undefined" ? window : globalThis);

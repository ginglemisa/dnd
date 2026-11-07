// 分享模式的唯讀規則：角色能力預設全鎖，只開放白名單；換法術規則與換裝備的 AC 提示也在這裡。
// 這是防誤改，不是防作弊：匯出 JSON 再匯入仍可完整編輯。
(function attachShareReadonly(globalScope) {
  "use strict";

  // 分享模式可更換法術的職業。規則通常以內容檔為準，這份表只有分享模式用得到，刻意不增加 YAML 欄位（見 AGENTS.md）。
  // 沒列到的職業（含私人職業）一律鎖定；不綁長休，也不強制「只換 1 個」。
  const SPELL_CHANGE = Object.freeze({
    cleric: Object.freeze({ prepared: true, hint: "牧師規則：每次長休後，可全部更換已準備法術。" }),
    druid: Object.freeze({ prepared: true, hint: "德魯伊規則：每次長休後，可全部更換已準備法術。" }),
    paladin: Object.freeze({ prepared: true, hint: "聖騎士規則：每次長休後，可替換 1 個已準備法術。" }),
    ranger: Object.freeze({ prepared: true, hint: "遊俠規則：每次長休後，可替換 1 個已準備法術。" }),
    wizard: Object.freeze({ prepared: true, cantrips: true, hint: "法師規則：每次長休後，可全部更換法術書內的已準備法術，並替換 1 個戲法。" })
  });
  const LEVEL_UP_ONLY = Object.freeze({ bard: "吟遊詩人", sorcerer: "術士", warlock: "契術師" });

  const LOCK_SCOPE = ".tab-content, #character-features";
  const CONTROLS = "input:not([type=\"hidden\"]), select, textarea";
  // 舊的身分下拉維持 disabled（class-features-ui.js、index.html）；其他項目不能用 disabled，程式把它當「未生效」。
  const IDENTITY_SELECTS = new Set(["class", "subclass", "level", "race", "background"]);
  const EDITABLE = [
    "textarea",
    "#hp", "#ac-display", "#lifedicen", "#heroic-inspiration", "#druid-natural-recovery-used",
    "#alignment",
    ".spell-overview-slot-checks input", ".free-spell-use-check", ".dragonborn-breath-uses input", ".proficiency-use-checks input",
    ".equipment-loadout-controls input", ".equipment-loadout-controls select", ".weapon-damage-type-select",
    "#weapon-attack-automation", ".weapon-attack-fields input",
    ".money-section input", ".money-section select",
    "select[data-rest-change]"
  ].join(", ");

  const AC_WARNING_TEXT = "更換護甲後 AC 不會自動重算，請自行修改數值";
  let active = false;
  let applyQueued = false;
  let acWarningHidden = false;
  let equipmentSnapshot = null;

  const inShareMode = () => globalScope.SHARE_MODE === true;
  const field = id => document.getElementById(id);
  const currentClass = () => field("class")?.value || "";

  function getSpellChangeRule(className = currentClass()) {
    return Object.hasOwn(SPELL_CHANGE, className) ? SPELL_CHANGE[className] : null;
  }

  // level：0 為戲法，其他為環階法術。
  function canChangeSpell(level) {
    if (!inShareMode()) return true;
    const rule = getSpellChangeRule();
    return Boolean(rule && (Number(level) === 0 ? rule.cantrips : rule.prepared));
  }

  // 法師只能準備法術書內的法術；已準備但不在書內的舊資料仍可取消。
  function canPrepareSpell(spellId) {
    if (!inShareMode()) return true;
    const spell = globalScope.SpellCatalog?.getSpell(spellId);
    if (!spell || !canChangeSpell(spell.level)) return false;
    if (currentClass() !== "wizard" || spell.level === 0) return true;
    return globalScope.Spellbook?.getState().spellIds.includes(spellId) === true
      || globalScope.SpellManagement?.getPlayerEntries().some(entry => entry.spellId === spellId) === true;
  }

  // 法術頁「準備法術」按鈕隱藏時的一行說明。
  function getPreparedNote() {
    const className = currentClass();
    if (!inShareMode() || getSpellChangeRule(className) || !className) return "";
    if (Object.hasOwn(LEVEL_UP_ONLY, className)) return `${LEVEL_UP_ONLY[className]}只有升級時能換法術，分享模式不可更改。`;
    return globalScope.hasSpellcastingCapability?.() ? "分享模式不可更改這個職業的法術。" : "";
  }

  // 短休或長休可改選的職業選項（勾選框）與長休可改選的武器精通（下拉）。
  function getRestChangeOptionIds() {
    const features = globalScope.getClassFeatureRules?.(currentClass()) || [];
    return new Set(features.filter(feature => feature.changeOn === "rest")
      .flatMap(feature => feature.options.map(option => option.id)));
  }

  function isLongRestPick(featureId) {
    const feature = (globalScope.getClassFeatureRules?.(currentClass()) || []).find(item => item.id === featureId);
    return (feature?.picks || []).some(pick => pick.changeOn === "longRest");
  }

  function isEditable(control, restOptionIds) {
    if (control.matches(EDITABLE)) return true;
    if (control.dataset.classPick) return isLongRestPick(control.dataset.classPick);
    return restOptionIds.has(control.id);
  }

  function usesReadOnly(control) {
    return control.tagName === "INPUT" && !["checkbox", "radio", "file", "range", "color"].includes(control.type);
  }

  function lockControl(control) {
    control.dataset.shareLocked = "true";
    if (usesReadOnly(control)) {
      control.readOnly = true;
      control.setAttribute("aria-readonly", "true");
    } else {
      control.inert = true;
    }
  }

  function apply() {
    if (!active) return;
    const restOptionIds = getRestChangeOptionIds();
    document.querySelectorAll(LOCK_SCOPE).forEach(scope => {
      scope.querySelectorAll(CONTROLS).forEach(control => {
        if (IDENTITY_SELECTS.has(control.id) || isEditable(control, restOptionIds)) return;
        lockControl(control);
      });
    });
    const toggle = field("auto-calculate-key-stats-toggle");
    if (toggle) lockControl(toggle);
  }

  function queueApply() {
    if (applyQueued) return;
    applyQueued = true;
    queueMicrotask(() => {
      applyQueued = false;
      apply();
    });
  }

  // inert 的勾選框仍可能經由 label 被點到（包在 label 內或 for 指向它）；按鈕、連結本身不受影響。
  function blockLockedClick(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const control = target.matches("input, select, textarea") ? target
      : target.closest("button, a") ? null : target.closest("label")?.control;
    if (control?.dataset.shareLocked !== "true") return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function readEquipment() {
    return { armor: field("armor")?.value || "", shield: globalScope.isEffectiveEquippedShield?.() === true };
  }

  function renderAcWarning() {
    const row = document.querySelector(".equipment-current-ac");
    if (!row || field("share-ac-warning")) return;
    const warning = document.createElement("div");
    warning.id = "share-ac-warning";
    warning.className = "share-ac-warning";
    warning.setAttribute("role", "status");
    warning.hidden = true;
    const jump = document.createElement("button");
    jump.type = "button";
    jump.className = "class-feature-choice-link share-ac-warning__jump";
    jump.setAttribute("aria-label", `${AC_WARNING_TEXT}，前往修改`);
    const copy = document.createElement("span");
    copy.textContent = `⚠︎ ${AC_WARNING_TEXT}`;
    const action = document.createElement("span");
    action.textContent = "前往";
    jump.append(copy, action);
    jump.addEventListener("click", () => {
      Promise.resolve(globalScope.onboardingTour?.jumpToTarget({ tab: "basic", selector: "#ac-display" }))
        .catch(error => console.warn("無法前往 AC 欄位：", error));
    });
    const hide = document.createElement("button");
    hide.type = "button";
    hide.className = "share-ac-warning__hide";
    hide.textContent = "隱藏";
    hide.setAttribute("aria-label", "隱藏 AC 提醒");
    hide.addEventListener("click", () => {
      acWarningHidden = true;
      warning.hidden = true;
      field("armor")?.focus({ preventScroll: true });
    });
    warning.append(jump, hide);
    row.prepend(warning);
  }

  // 由 updateEquipmentLoadoutSummary 呼叫，所以各種換裝入口（含跑團模式）都會經過這裡。
  // 自動計算開著時 AC 會自動重算，提示不成立；換上盾牌只有熟練時才影響 AC。
  function onEquipmentChanged() {
    if (!active || !equipmentSnapshot) return;
    const next = readEquipment();
    const previous = equipmentSnapshot;
    equipmentSnapshot = next;
    if (acWarningHidden || globalScope.isAutomaticKeyStatsEnabled?.() !== false) return;
    const shieldOn = next.shield && !previous.shield;
    const shieldOff = previous.shield && !next.shield;
    if (next.armor === previous.armor && !shieldOff && !(shieldOn && globalScope.isShieldProficient?.() === true)) return;
    const warning = field("share-ac-warning");
    if (warning) warning.hidden = false;
  }

  function bindTipToggle() {
    const toggle = field("share-mode-tip-toggle");
    const details = field("share-mode-tip-details");
    if (!toggle || !details) return;
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(expanded));
      toggle.setAttribute("aria-label", expanded ? "收合分享模式說明" : "展開分享模式說明");
      details.hidden = !expanded;
    });
  }

  // 只有成功讀到分享角色時才啟用；讀取失敗的連結是空白頁，沒有東西要鎖。
  function activate() {
    if (active || !inShareMode()) return;
    active = true;
    document.addEventListener("click", blockLockedClick, true);
    new MutationObserver(queueApply).observe(document.body, { childList: true, subtree: true });
    bindTipToggle();
    renderAcWarning();
    equipmentSnapshot = readEquipment();
    apply();
  }

  globalScope.ShareReadonly = Object.freeze({ activate, apply, getSpellChangeRule, canChangeSpell, canPrepareSpell, getPreparedNote, onEquipmentChanged });
})(window);

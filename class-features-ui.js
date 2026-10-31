/**
 * 職業能力 UI：職業選項（祈喚、超魔、苦痛魔爆、互斥與進階選項、職業攻擊備註）、
 * 角色能力視窗、補齊職業選項提示與缺項檢查、使命／升級戲法與職業選項記憶接線
 * （傳統 script，不使用 defer）。職業資料以 class-content.generated.js 為準（由 content/ 職業內容檔建置）。
 *
 * - 自 index.html 原封搬出，於第一段內嵌角色卡 script 之前同步載入，
 *   維持全域名稱供 index.html、pdf-launcher.js、spell-sources.js、spellbook.js、
 *   onboarding-tour.js、action-panel.js、tabletop-*.js 等呼叫。
 * - 只放函式與狀態宣告；頂層只登記 window.getAgonizingBlastSelections
 *   與 spellmanagementchange 監聽。種族／背景能力、AC 與核心事件綁定、初始化仍在 index.html。
 */
function updateClassFeatureOptionVisibility() {
  const classValue = document.getElementById("class")?.value || "";
  const level = Number.parseInt(document.getElementById("level")?.value || "0", 10) || 0;
  document.getElementById("druid-land-control")?.classList.toggle("is-hidden", classValue !== "druid" || level < 3);
}

const CLERIC_MISSION_CHOICE_IDS = Object.freeze(["cleric-guardian", "cleric-trickster"]);
const DRUID_MISSION_CHOICE_IDS = Object.freeze(["druid-shaman", "druid-sentinel"]);
const MISSION_CANTRIP_CHOICES = Object.freeze([
  { checkboxId: "cleric-trickster", className: "cleric", label: "魔術使：額外牧師戲法", sourceLabel: "來源：魔術使" },
  { checkboxId: "druid-shaman", className: "druid", label: "巫祝：額外德魯伊戲法", sourceLabel: "來源：巫祝" }
]);
const FIGHTING_STYLE_TYPE_CHOICE_GROUPS = Object.freeze([
  Object.freeze(["paladin-fighting-style", "paladin-blessed-warrior"]),
  Object.freeze(["ranger-fighting-style", "ranger-druidic-warrior"])
]);

function enforceExclusiveCheckboxChoice(ids, changedId) {
  const changed = document.getElementById(changedId);
  if (!ids.includes(changedId) || !changed?.checked) return;
  ids.filter(id => id !== changedId).forEach(id => {
    const input = document.getElementById(id);
    if (input) input.checked = false;
  });
}

// 牧師神聖使命選項（守護者/奇術使）互斥
function enforceClericMissionExclusivity(changedId) {
  enforceExclusiveCheckboxChoice(CLERIC_MISSION_CHOICE_IDS, changedId);
}

function enforceDruidMissionExclusivity(changedId) {
  enforceExclusiveCheckboxChoice(DRUID_MISSION_CHOICE_IDS, changedId);
}


const ADVANCED_CLASS_FEATURE_CHOICE_GROUPS = Object.freeze([
  Object.freeze(["ranger-hunters-prey-colossus-slayer", "ranger-hunters-prey-horde-breaker"]),
  Object.freeze(["cleric-blessed-strikes-divine-strike", "cleric-blessed-strikes-potent-spellcasting"]),
  Object.freeze(["druid-elemental-fury-primal-strike", "druid-elemental-fury-potent-spellcasting"]),
  Object.freeze(["ranger-defensive-tactics-escape-the-horde", "ranger-defensive-tactics-multiattack-defense"])
]);
const ADVANCED_CLASS_FEATURE_AVAILABILITY = Object.freeze({
  "ranger-hunters-prey-colossus-slayer": Object.freeze({ className: "ranger", minimumLevel: 3 }),
  "ranger-hunters-prey-horde-breaker": Object.freeze({ className: "ranger", minimumLevel: 3 }),
  "cleric-guardian": Object.freeze({ className: "cleric", minimumLevel: 1 }),
  "cleric-trickster": Object.freeze({ className: "cleric", minimumLevel: 1 }),
  "cleric-blessed-strikes-divine-strike": Object.freeze({ className: "cleric", minimumLevel: 7 }),
  "cleric-blessed-strikes-potent-spellcasting": Object.freeze({ className: "cleric", minimumLevel: 7 }),
  "druid-shaman": Object.freeze({ className: "druid", minimumLevel: 1 }),
  "druid-sentinel": Object.freeze({ className: "druid", minimumLevel: 1 }),
  "druid-elemental-fury-primal-strike": Object.freeze({ className: "druid", minimumLevel: 7 }),
  "druid-elemental-fury-potent-spellcasting": Object.freeze({ className: "druid", minimumLevel: 7 }),
  "paladin-fighting-style": Object.freeze({ className: "paladin", minimumLevel: 2 }),
  "paladin-blessed-warrior": Object.freeze({ className: "paladin", minimumLevel: 2 }),
  "ranger-fighting-style": Object.freeze({ className: "ranger", minimumLevel: 2 }),
  "ranger-druidic-warrior": Object.freeze({ className: "ranger", minimumLevel: 2 }),
  "ranger-defensive-tactics-escape-the-horde": Object.freeze({ className: "ranger", minimumLevel: 7 }),
  "ranger-defensive-tactics-multiattack-defense": Object.freeze({ className: "ranger", minimumLevel: 7 }),
  "sorcerer-elemental-affinity-damage-type": Object.freeze({ className: "sorcerer", minimumLevel: 6 })
});
let characterChoiceWarningsHidden = false;

function isCharacterCoreSelectionComplete() {
  return ["class", "level", "background", "race"].every(id => Boolean(document.getElementById(id)?.value));
}

function updateClassFeatureChoiceReminder() {
  syncManualSpellSourceControls();
  syncMissionCantripChoices();
  syncLevelUpCantripChoice();
  const reminder = document.getElementById("class-feature-choice-reminder");
  if (!reminder) return;

  // 職業缺項提醒等職業、等級、背景與種族都選好才顯示。
  const issues = isCharacterCoreSelectionComplete() ? getClassFeatureChoiceIssues() : [];
  const warningToggle = document.getElementById("character-choice-warning-toggle");
  if (warningToggle) warningToggle.hidden = characterChoiceWarningsHidden || issues.length === 0;
  reminder.replaceChildren();
  issues.forEach(issue => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "class-feature-choice-link";
    button.setAttribute("aria-label", `${issue.message}前往補填`);
    const copy = document.createElement("span");
    copy.textContent = issue.message;
    const action = document.createElement("span");
    action.textContent = "前往";
    button.append(copy, action);
    button.addEventListener("click", () => {
      if (issue.expandFeatSelector) {
        const row = document.querySelector(issue.expandFeatSelector)?.closest("#feats-area .form-row");
        if (row) {
          row.dataset.featDisclosureInitialized = "true";
          row.dataset.featExpanded = "true";
          syncFeatRowDisclosure(row);
          saveFeatDisclosurePreferences();
        }
      }
      Promise.resolve(window.onboardingTour?.jumpToTarget(issue)).catch(error => console.warn("無法前往職業選項：", error));
    });
    reminder.appendChild(button);
  });
  reminder.hidden = characterChoiceWarningsHidden || issues.length === 0;
}

const CLERIC_DIVINE_STRIKE_ATTACK_NOTE = "+1d8光/黯傷害";
// 寫入攻擊備註並隨角色保存；移除時以完全相同的字串比對，修改會使舊存檔殘留舊備註。
const DRUID_PRIMAL_STRIKE_ATTACK_NOTE = "+1d8冷凍/火焰/閃電/雷鳴傷害";

function isAdvancedClassFeatureControlAvailable(id) {
  const requirement = ADVANCED_CLASS_FEATURE_AVAILABILITY[id];
  if (!requirement) return true;
  const classValue = document.getElementById("class")?.value || "";
  const level = Number.parseInt(document.getElementById("level")?.value || "0", 10) || 0;
  return classValue === requirement.className && level >= requirement.minimumLevel;
}

function enforceAdvancedClassFeatureChoiceExclusivity(changedId) {
  const group = ADVANCED_CLASS_FEATURE_CHOICE_GROUPS.find(ids => ids.includes(changedId));
  const changed = document.getElementById(changedId);
  if (!group || !changed?.checked) return;
  group.filter(id => id !== changedId).forEach(id => {
    const input = document.getElementById(id);
    if (input) input.checked = false;
  });
}

function removeManagedAttackNoteFragment(value, fragment) {
  const escaped = escapeRegExp(fragment);
  const pattern = new RegExp(`(^|[；;]\\s*)${escaped}(?=\\s*(?:[；;]|$))`, "gu");
  return String(value || "")
    .replace(pattern, "")
    .replace(/^\s*[；;]\s*/u, "")
    .trimEnd();
}

function setManagedAttackNoteFragment(input, fragment, enabled) {
  if (!input || !fragment) return;
  const withoutFragment = removeManagedAttackNoteFragment(input.value, fragment);
  const nextValue = enabled
    ? `${withoutFragment}${withoutFragment ? "；" : ""}${fragment}`
    : withoutFragment;
  if (input.value === nextValue) return;
  input.value = nextValue;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function isApplicableWeaponAttack(hand) {
  if (!isWeaponAttackAutomationEnabled()) {
    return Boolean(document.getElementById(`atk-${hand}-name`)?.value.trim());
  }
  const selectionId = hand === "main" ? "mainHand" : "offHand";
  const weaponName = document.getElementById(selectionId)?.value || "";
  return Boolean(weaponName) && weaponName !== "盾牌";
}

function syncClassFeatureAttackNotes() {
  const divineStrikeId = "cleric-blessed-strikes-divine-strike";
  const primalStrikeId = "druid-elemental-fury-primal-strike";
  const divineStrike = isAdvancedClassFeatureControlAvailable(divineStrikeId)
    && Boolean(document.getElementById(divineStrikeId)?.checked);
  const primalStrike = isAdvancedClassFeatureControlAvailable(primalStrikeId)
    && Boolean(document.getElementById(primalStrikeId)?.checked);
  ["main", "off"].forEach(hand => {
    const noteInput = document.getElementById(`atk-${hand}-note`);
    const applicable = isApplicableWeaponAttack(hand);
    setManagedAttackNoteFragment(noteInput, CLERIC_DIVINE_STRIKE_ATTACK_NOTE, divineStrike && applicable);
    setManagedAttackNoteFragment(noteInput, DRUID_PRIMAL_STRIKE_ATTACK_NOTE, primalStrike && applicable);
  });
}

function syncAdvancedClassFeatureControls() {
  Object.entries(ADVANCED_CLASS_FEATURE_AVAILABILITY).forEach(([id]) => {
    const control = document.getElementById(id);
    if (!control) return;
    const available = isAdvancedClassFeatureControlAvailable(id);
    control.disabled = !available;
    control.setAttribute("aria-disabled", String(!available));
    control.closest(".feature-choice-card, .class-feature-option")?.classList.toggle("is-unavailable", !available);
    if (!available && control.type === "checkbox") control.checked = false;
    if (!available && control instanceof HTMLSelectElement) control.value = "";
  });
  ADVANCED_CLASS_FEATURE_CHOICE_GROUPS.forEach(group => {
    const checked = group.map(id => document.getElementById(id)).filter(input => input?.checked);
    checked.slice(1).forEach(input => { input.checked = false; });
  });
  const output = document.getElementById("classFeatures");
  if (output) setupAutoSave(output);
  syncClassFeatureAttackNotes();
}

const eldritchInvocations = [
  { name: "刃之魔契" },
  { name: "鏈之魔契", spellId: "find-familiar", spellUse: "at-will" },
  { name: "書之魔契" },
  { name: "幽影護甲", spellId: "mage-armor", spellUse: "at-will" },
  { name: "魔能意志" },
  { name: "邪魔活力", spellId: "false-life", spellUse: "at-will", minWarlockLevel: 2 },
  { name: "千面之臉", spellId: "disguise-self", spellUse: "at-will", minWarlockLevel: 2 },
  { name: "幻象迷蹤", spellId: "silent-image", spellUse: "at-will", minWarlockLevel: 2 },
  { name: "超凡跳躍", spellId: "jump", spellUse: "at-will", minWarlockLevel: 2 },
  { name: "魔鬼視界", minWarlockLevel: 2 },
  { name: "原初之一教習", repeatable: true, minWarlockLevel: 2 },
  { name: "苦痛魔爆", repeatable: true, minWarlockLevel: 2 },
  { name: "魔能長槍", repeatable: true, minWarlockLevel: 2 },
  { name: "斥力魔爆", repeatable: true, minWarlockLevel: 2 },
  { name: "星移步法", spellId: "levitate", spellUse: "at-will", minWarlockLevel: 5 },
  { name: "萬形之主", spellId: "alter-self", spellUse: "at-will", minWarlockLevel: 5 },
  { name: "融身入影", spellId: "invisibility", spellUse: "at-will", minWarlockLevel: 5 },
  { name: "深海饋贈", spellId: "water-breathing", spellUse: "once", minWarlockLevel: 5 },
  { name: "共視感官", minWarlockLevel: 5 },
  { name: "魔能斬擊", minWarlockLevel: 5 },
  { name: "饑渴魔刃", minWarlockLevel: 5 },
  { name: "鏈主賦能", minWarlockLevel: 5 },
  { name: "墳墓低語", spellId: "speak-with-dead", spellUse: "at-will", minWarlockLevel: 7 }
];

function fillEldritchInvocationTextsFromClassFeatures() {
  const warlockRaw = classFeatures?.warlock || "";
  const optionIndex = findNthIndex(warlockRaw, "魔能祈喚選項", 2);
  if (optionIndex === -1) return;

  const invocationBlock = warlockRaw.slice(optionIndex);

  eldritchInvocations.forEach((invocation, index) => {
    const start = invocationBlock.indexOf(invocation.name);
    if (start === -1) {
      invocation.text = invocation.text || "";
      return;
    }

    const endCandidates = [];
    for (let i = index + 1; i < eldritchInvocations.length; i++) {
      const nextName = eldritchInvocations[i].name;
      const nextPos = invocationBlock.indexOf(nextName, start + invocation.name.length);
      if (nextPos !== -1) endCandidates.push(nextPos);
    }

    const end = endCandidates.length ? Math.min(...endCandidates) : invocationBlock.length;
    invocation.text = getNormalizedInvocationText(
      invocationBlock.slice(start + invocation.name.length, end)
    );
  });
}

function getInvocationCheckboxId(index, slot = 1) {
  return `eldritch-invocation-${index}-${slot}`;
}

const AGONIZING_BLAST_INVOCATION_NAME = "苦痛魔爆";

function getAgonizingBlastSelectId(index, slot = 1) {
  return `eldritch-invocation-${index}-${slot}-cantrip`;
}

function isAgonizingBlastSelectId(id) {
  return /^eldritch-invocation-\d+-\d+-cantrip$/.test(String(id || ""));
}

function isEldritchInvocationCheckboxId(id) {
  return /^eldritch-invocation-\d+-\d+$/.test(String(id || ""));
}

function getKnownWarlockDamageCantrips() {
  const spells = (window.SpellManagement?.getEntries({ availableOnly: true }) || []).flatMap(entry => {
    const spell = SpellCatalog.getSpell(entry.spellId);
    const hasDamage = SpellCatalog.getCastMetadata(entry.spellId)?.outcomes?.some(outcome => outcome.kind === "damage");
    return spell?.level === 0 && (entry.spellClass === "warlock" || entry.spellSource === PACT_TOME_SPELL_SOURCE) && hasDamage ? [spell] : [];
  });
  return [...new Map(spells.map(spell => [spell.spellId, spell])).values()]
    .sort((left, right) => left.nameZh.localeCompare(right.nameZh, "zh-Hant"));
}

function getAgonizingBlastSelects() {
  return Array.from(document.querySelectorAll("select[data-agonizing-blast-slot]"));
}

function getAgonizingBlastSelections() {
  return getAgonizingBlastSelects().flatMap(select => {
    const checkbox = document.getElementById(select.dataset.checkboxId || "");
    return checkbox?.checked && select.value ? [select.value] : [];
  });
}

function syncAgonizingBlastSelections(options = {}) {
  const selects = getAgonizingBlastSelects();
  if (!selects.length) return;
  if (window.SpellManagement?.isManual()) {
    // Hidden automatic choices must not be cleared by edits to the manual list.
    const spells = SpellCatalog.getAllSpells().filter(spell => spell.level === 0
      && SpellCatalog.getCastMetadata(spell.spellId)?.outcomes?.some(outcome => outcome.kind === "damage"));
    selects.forEach(select => {
      const previous = select.value;
      select.innerHTML = '<option value="">--選擇契術師傷害戲法--</option>' + spells.map(spell =>
        `<option value="${escapeHtml(spell.spellId)}">${escapeHtml(SpellCatalog.getDisplayName(spell.spellId))}</option>`).join("");
      select.value = previous;
    });
    return;
  }
  const eligible = getKnownWarlockDamageCantrips();
  const eligibleIds = new Set(eligible.map(spell => spell.spellId));
  const accepted = new Set();
  let clearedInvalid = false;

  selects.forEach(select => {
    const checkbox = document.getElementById(select.dataset.checkboxId || "");
    const active = Boolean(checkbox?.checked && !checkbox.disabled);
    const previous = select.value || "";
    const valid = active && eligibleIds.has(previous) && !accepted.has(previous);
    const nextValue = valid ? previous : "";
    if (previous && !valid) clearedInvalid = true;
    if (nextValue) accepted.add(nextValue);
    select.disabled = !active;
    select.setAttribute("aria-disabled", String(!active));
    select.innerHTML = `<option value="">--選擇契術師傷害戲法--</option>${eligible.map(spell => (
      `<option value="${escapeHtml(spell.spellId)}">${escapeHtml(SpellCatalog.getDisplayName(spell.spellId))}</option>`
    )).join("")}`;
    select.value = nextValue;
  });

  const selectedValues = new Set(getAgonizingBlastSelections());
  selects.forEach(select => {
    Array.from(select.options).forEach(option => {
      if (!option.value) return;
      option.disabled = option.value !== select.value && selectedValues.has(option.value);
    });
  });
  if (clearedInvalid && options.notify !== false) {
    window.AppDialog?.notify("苦痛魔爆的戲法選擇已失效或重複，已清除；請重新選擇。", { tone: "warning" });
  }
}

function applyAgonizingBlastState(data = {}) {
  syncAgonizingBlastSelections({ notify: false });
  getAgonizingBlastSelects().forEach(select => {
    const requested = String(data[select.id] || "");
    if (requested && Array.from(select.options).some(option => option.value === requested && !option.disabled)) {
      select.value = requested;
    }
    syncAgonizingBlastSelections({ notify: false });
  });
  updateWarlockInvocationSummary();
}

window.getAgonizingBlastSelections = getAgonizingBlastSelections;

async function openAgonizingBlastModal(invocationIndex, trigger) {
  if (window.SpellManagement?.isManual()) return;
  const activeSlots = getInvocationCheckboxInputs(invocationIndex)
    .filter(input => input.checked && !input.disabled)
    .map(input => ({
      slot: Number.parseInt(input.dataset.invocationSlot || "0", 10),
      select: document.getElementById(getAgonizingBlastSelectId(invocationIndex, input.dataset.invocationSlot))
    }))
    .filter(entry => Number.isFinite(entry.slot) && entry.slot > 0 && entry.select);
  if (!activeSlots.length) return;

  syncAgonizingBlastSelections({ notify: false });
  const modalSlots = [];
  await window.AppDialog?.showContent({
    title: "苦痛魔爆：戲法設定",
    message: "為每個已選的苦痛魔爆指定不同的契術師傷害戲法。",
    cancelLabel: "取消",
    confirmLabel: "套用設定",
    initialFocus: "content",
    trigger,
    renderContent(body) {
      const refreshModalSlots = () => {
        const chosen = new Set(modalSlots.map(entry => entry.control.value).filter(Boolean));
        modalSlots.forEach(entry => {
          Array.from(entry.control.options).forEach(option => {
            option.disabled = Boolean(option.value && option.value !== entry.control.value && chosen.has(option.value));
          });
          const spell = SpellCatalog.getSpell(entry.control.value);
          entry.description.innerHTML = spell
            ? renderSpellDescHtml(spell.desc || "—")
            : "選擇戲法後，可在此查看法術說明。";
        });
      };

      activeSlots.forEach(({ slot, select: sourceSelect }) => {
        const field = document.createElement("section");
        field.className = "agonizing-blast-setting";
        const label = document.createElement("label");
        label.textContent = `第 ${slot} 次套用戲法`;
        const control = document.createElement("select");
        control.className = "agonizing-blast-setting__select";
        control.innerHTML = sourceSelect.innerHTML;
        control.value = sourceSelect.value;
        label.appendChild(control);
        const description = document.createElement("div");
        description.className = "agonizing-blast-setting__description";
        field.append(label, description);
        body.appendChild(field);
        modalSlots.push({ control, description, sourceSelect });
        control.addEventListener("change", refreshModalSlots);
      });
      refreshModalSlots();
    },
    resolveConfirm() {
      modalSlots.forEach(({ control, sourceSelect }) => { sourceSelect.value = control.value; });
      syncAgonizingBlastSelections();
      updateWarlockInvocationSummary();
      if (typeof scheduleSaveAllFields === "function") scheduleSaveAllFields();
      return true;
    }
  });
}

function getNormalizedInvocationText(text) {
  return (text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n(?:[ \t]*\n)+/g, "\n\n")
    .trim();
}

function splitFeatureChoiceText(text) {
  let normalized = getNormalizedInvocationText(text)
    // 每個選項是從前一個 <h4> 的名稱之後切出，且在下一個 <h4> 前截斷；
    // 移除切片兩端遺留的容器，避免卡片內出現不完整的 HTML 結構。
    .replace(/<\/div>\s*<div\b[^>]*>\s*<h4\b[^>]*>\s*$/, "")
    .replace(/<\/div>\s*$/, "");

  const headingDetail = normalized.match(/^([^<\n]+)<\/h4>\s*/);
  if (headingDetail) {
    return {
      detail: headingDetail[1].trim(),
      body: normalized.slice(headingDetail[0].length).trim()
    };
  }

  normalized = normalized.replace(/^<\/h4>\s*/, "");
  return { detail: "", body: normalized.trim() };
}

function formatFeatureChoiceText(text, formatDetail = detail => detail) {
  const { detail, body } = splitFeatureChoiceText(text);
  const detailHtml = detail ? `<div class="feature-choice-card__meta">${formatDetail(detail)}</div>` : "";
  return `${detailHtml}${body ? highlightSpellNamesInClassFeature(body) : ""}`;
}

function hasWarlockInvocation(invocationName) {
  const picks = document.querySelectorAll("#eldritch-invocations-output input[data-invocation-name]");
  return Array.from(picks).some(input => input.dataset.invocationName === invocationName && input.checked);
}

function formatInvocationText(text) {
  return formatFeatureChoiceText(text, detail => detail.replace(
    /^（先決條件：([^）]+)）$/,
    '<span class="invocation-prereq">先決條件：$1</span>'
  ));
}

function renderSelectedFeatureSummary(summaryEl, items, emptyText, formatText = text => text) {
  if (!summaryEl) return;
  if (!items.length) {
    summaryEl.innerHTML = `<div class="selection-summary-empty">${escapeHtml(emptyText)}</div>`;
    return;
  }

  const merged = [];
  items.forEach(item => {
    const existing = merged.find(entry => entry.name === item.name);
    if (existing) {
      existing.count += 1;
      return;
    }
    merged.push({ ...item, count: 1 });
  });

  summaryEl.innerHTML = `<div class="selection-summary-list">${merged.map(item => {
    const body = item.text ? formatText(item.text) : "";
    return `<article class="selection-summary-card">
      <div class="selection-summary-head">
        <strong class="selection-summary-title">${escapeHtml(item.name)}</strong>
        ${item.count > 1 ? `<span class="selection-summary-badge">x${item.count}</span>` : ""}
      </div>
      ${body ? `<div class="selection-summary-body">${body}</div>` : ""}
    </article>`;
  }).join("")}</div>`;
}

function getWarlockInvocationSelectionLimit() {
  const cls = document.getElementById("class")?.value || "";
  const level = document.getElementById("level")?.value || "1";
  return calculateWarlockInvocationSelectionLimit(cls, level);
}

function isWarlockInvocationAvailable(invocation) {
  if (!invocation) return false;
  const classValue = document.getElementById("class")?.value || "";
  const level = Number.parseInt(document.getElementById("level")?.value || "0", 10) || 0;
  return classValue === "warlock"
    && level >= 1
    && (!invocation.minWarlockLevel || level >= invocation.minWarlockLevel);
}

function syncWarlockInvocationAvailability() {
  eldritchInvocations.forEach((invocation, index) => {
    const available = isWarlockInvocationAvailable(invocation);
    getInvocationCheckboxInputs(index).forEach(input => {
      input.disabled = !available;
      if (!available && input.checked) {
        input.checked = false;
      }
    });

    const card = document.getElementById(getInvocationCheckboxId(index, 1))?.closest(".feature-choice-card");
    card?.classList.toggle("is-unavailable", !available);
    if (card) card.setAttribute("aria-disabled", String(!available));
  });
  syncAgonizingBlastSelections({ notify: false });
  updateWarlockInvocationSummary();
}

function enforceCheckboxSelectionLimit(inputs, limit, changedInput, alertMessage, shouldAlert = true) {
  const checkedInputs = inputs.filter(input => input.checked);
  if (checkedInputs.length <= limit) return true;

  if (changedInput?.checked) {
    changedInput.checked = false;
    if (shouldAlert) window.AppDialog?.notify(alertMessage, { tone: "info" });
    return false;
  }

  checkedInputs.slice(limit).forEach(input => {
    input.checked = false;
  });
  return false;
}

function syncMetamagicSelectionLimit() {
  const inputs = Array.from(document.querySelectorAll("#metamagicOptions input[data-metamagic-name]"));
  if (!inputs.length) return true;
  const classValue = document.getElementById("class")?.value || "";
  const level = Number.parseInt(document.getElementById("level")?.value || "0", 10) || 0;
  const available = classValue === "sorcerer" && level >= 2;
  inputs.forEach(input => {
    input.disabled = !available;
    input.setAttribute("aria-disabled", String(!available));
    input.closest(".feature-choice-card")?.classList.toggle("is-unavailable", !available);
    if (!available) input.checked = false;
  });
  if (!available) return true;
  return enforceCheckboxSelectionLimit(inputs, getMetamagicSelectionLimit(), null, "超魔法只能勾選兩個喔！", false);
}

function syncWarlockInvocationSelectionLimit() {
  const inputs = Array.from(document.querySelectorAll("#eldritch-invocations-output input[data-invocation-name]"));
  if (!inputs.length) return true;
  return enforceCheckboxSelectionLimit(inputs, getWarlockInvocationSelectionLimit(), null, "魔能祈喚勾選數量超過目前等級上限。", false);
}

const metamagicOptions = [
  { name: "謹慎法術" },
  { name: "遠程法術" },
  { name: "強效法術" },
  { name: "延效法術" },
  { name: "升階法術" },
  { name: "瞬發法術" },
  { name: "追蹤法術" },
  { name: "精妙法術" },
  { name: "轉化法術" },
  { name: "孿生法術" }
];

function getMetamagicCheckboxId(index) {
  return `metamagic-option-${index + 1}`;
}

function fillMetamagicTextsFromClassFeatures() {
  const sorcererRaw = classFeatures?.sorcerer || "";
  const blockStart = sorcererRaw.lastIndexOf("超魔法選項");
  if (blockStart === -1) return;

  const metamagicBlock = sorcererRaw.slice(blockStart);

  metamagicOptions.forEach((option, index) => {
    const start = metamagicBlock.indexOf(option.name);
    if (start === -1) {
      option.text = option.text || "";
      return;
    }

    const endCandidates = [];
    for (let i = index + 1; i < metamagicOptions.length; i++) {
      const nextName = metamagicOptions[i].name;
      const nextPos = metamagicBlock.indexOf(nextName, start + option.name.length);
      if (nextPos !== -1) endCandidates.push(nextPos);
    }

    const end = endCandidates.length ? Math.min(...endCandidates) : metamagicBlock.length;
    option.text = getNormalizedInvocationText(
      metamagicBlock.slice(start + option.name.length, end)
    );
  });
}

function getCheckedMetamagicNames() {
  return Array.from(document.querySelectorAll("#metamagicOptions input[data-metamagic-name]:checked"))
    .map(input => input.dataset.metamagicName)
    .filter(Boolean);
}

function renderMetamagicOptions() {
  const output = document.getElementById("metamagicOptions");
  if (!output) return;

  const previouslyChecked = new Set(getCheckedMetamagicNames());
  const availableOptions = metamagicOptions.filter(option => option.text && option.text.trim());

  if (!availableOptions.length) {
    output.innerHTML = "無資料";
    return;
  }

  output.innerHTML = availableOptions.map((option, index) => {
    const checkboxId = getMetamagicCheckboxId(index);
    const checked = previouslyChecked.has(option.name) ? " checked" : "";
    const { detail, body } = splitFeatureChoiceText(option.text);

    return `<article class="feature-choice-card feature-choice-card--metamagic">
      <label class="feature-choice-card__heading" for="${checkboxId}">
        <input type="checkbox" id="${checkboxId}" data-metamagic-name="${escapeHtml(option.name)}"${checked}>
        <strong>${escapeHtml(option.name)}</strong>
        ${detail ? `<span class="feature-choice-card__meta">${escapeHtml(detail)}</span>` : ""}
      </label>
      ${body ? `<div class="feature-choice-card__body">${highlightSpellNamesInClassFeature(body)}</div>` : ""}
    </article>`;
  }).join("");

  output.querySelectorAll("input[type='checkbox']").forEach(el => {
    el.addEventListener("change", event => {
      if (el.checked) {
        const allowed = enforceCheckboxSelectionLimit(
          Array.from(output.querySelectorAll("input[data-metamagic-name]")),
          getMetamagicSelectionLimit(),
          el,
          "超魔法只能勾選兩個喔！",
          event.isTrusted
        );
        if (!allowed) {
          updateMetamagicSummary();
          if (typeof scheduleSaveAllFields === "function") scheduleSaveAllFields();
          return;
        }
      }
      updateMetamagicSummary();
      if (typeof scheduleSaveAllFields === "function") scheduleSaveAllFields();
    });
  });
}

function updateMetamagicSummary() {
  const summaryEl = document.getElementById("metamagic-summary");
  if (!summaryEl) return;

  const availableOptions = metamagicOptions.filter(option => option.text && option.text.trim());
  const picks = [];
  availableOptions.forEach((option, index) => {
    const input = document.getElementById(getMetamagicCheckboxId(index));
    if (input?.checked) {
      picks.push({
        name: option.name,
        text: option.text
      });
    }
  });

  renderSelectedFeatureSummary(
    summaryEl,
    picks,
    "尚未勾選超魔法",
    text => formatFeatureChoiceText(text)
  );
}

async function handleEldritchInvocationChange(el, event, output) {
  const invocation = eldritchInvocations.find(option => option.name === el.dataset.invocationName);
  if (!isWarlockInvocationAvailable(invocation)) {
    el.checked = false;
    syncAgonizingBlastSelections();
    updateWarlockInvocationSummary();
    syncOriginAndSubclassDerivedSpellRows();
    if (typeof scheduleSaveAllFields === "function") scheduleSaveAllFields();
    return;
  }

  if (el.checked) {
    const allowed = enforceCheckboxSelectionLimit(
      Array.from(output.querySelectorAll("input[data-invocation-name]")),
      getWarlockInvocationSelectionLimit(),
      el,
      "目前等級的魔能祈喚數量已達上限。",
      event.isTrusted
    );
    if (!allowed) {
      syncAgonizingBlastSelections();
      updateWarlockInvocationSummary();
      updateACDisplay();
      populateHandAttacks();
      if (typeof scheduleSaveAllFields === "function") scheduleSaveAllFields();
      return;
    }
  }

  if (el.checked && el.dataset.invocationName === "書之魔契" && event.isTrusted && !window.SpellManagement?.isManual()) {
    const selection = await window.Spellbook?.openTomeSelection?.({
      initial: getPactTomeSpellSelection(),
      knownSpellIds: getNonPactTomeSelectedSpellIds()
    });
    if (!selection) el.checked = false;
    else setPactTomeSpellSelection(selection, { sync: false });
  }
  if (el.dataset.invocationName === "書之魔契") pactTomeInvocationRemembered = el.checked;

  if (invocation?.repeatable) renderEldritchInvocations();

  updateWarlockInvocationSummary();
  updateACDisplay();
  populateHandAttacks();
  syncOriginAndSubclassDerivedSpellRows();
  syncAgonizingBlastSelections();
  if (typeof scheduleSaveAllFields === "function") scheduleSaveAllFields();
  updateClassFeatureChoiceReminder();
}

function getInvocationCheckboxInputs(index) {
  return Array.from(document.querySelectorAll(`#eldritch-invocations-output input[data-invocation-index="${index}"]`));
}

function getRepeatableInvocationSlotCount(index, checkedIds) {
  const slotPattern = new RegExp(`^${getInvocationCheckboxId(index, "").replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}(\\d+)$`);
  const largestCheckedSlot = Array.from(checkedIds).reduce((largest, id) => {
    const match = slotPattern.exec(id);
    return match ? Math.max(largest, Number.parseInt(match[1], 10) || 0) : largest;
  }, 0);
  return largestCheckedSlot + 1;
}

function insertRepeatableInvocationChecks(bodyHtml, checksHtml) {
  if (!checksHtml) return bodyHtml;
  const checks = `<span class="feature-choice-card__repeatable-checks">${checksHtml}</span>`;
  return /<p[^>]*>\s*可重複：/.test(bodyHtml)
    ? bodyHtml.replace(/(<p[^>]*>\s*)可重複：/, `$1${checks}可重複：`)
    : `${bodyHtml}${checks}`;
}

function renderEldritchInvocations(options = {}) {
  const output = document.getElementById("eldritch-invocations-output");
  if (!output) return;
  const previousChecked = new Set([
    ...Array.from(output.querySelectorAll("input[data-invocation-name]:checked"), input => input.id),
    ...Object.entries(options.state || {})
      .filter(([id, value]) => isEldritchInvocationCheckboxId(id) && value === true)
      .map(([id]) => id)
  ]);
  const previousTargets = new Map(Array.from(output.querySelectorAll("select[data-agonizing-blast-slot]"), select => [select.id, select.value]));
  const tomeIndex = eldritchInvocations.findIndex(option => option.name === "書之魔契");
  if (options.state) restorePactTomeInvocationSelection(options.state);
  else if (previousChecked.has(getInvocationCheckboxId(tomeIndex, 1))) pactTomeInvocationRemembered = true;
  const previousFeats = new Map(Array.from(output.querySelectorAll("[data-feat-choice] select"), select => [select.id, select.value]));

  output.innerHTML = eldritchInvocations.map((invocation, index) => {
    const available = isWarlockInvocationAvailable(invocation);
    const checkCount = invocation.repeatable ? getRepeatableInvocationSlotCount(index, previousChecked) : 1;
    const checks = Array.from({ length: checkCount }, (_, slotIndex) => {
      const checkboxId = getInvocationCheckboxId(index, slotIndex + 1);
      const slotLabel = checkCount > 1 ? `選擇 ${invocation.name}（第 ${slotIndex + 1} 次）` : `選擇 ${invocation.name}`;
      const checked = available && (invocation.name === "書之魔契"
        ? pactTomeInvocationRemembered : previousChecked.has(checkboxId)) ? " checked" : "";
      return `<span class="feature-choice-card__invocation-pick"><label class="inline-check-label"><input type="checkbox" id="${checkboxId}" data-invocation-index="${index}" data-invocation-slot="${slotIndex + 1}" data-invocation-name="${escapeHtml(invocation.name)}" aria-label="${escapeHtml(slotLabel)}"${checked}${available ? "" : " disabled"}></label></span>`;
    }).join("");
    const repeatableChecks = invocation.repeatable ? checks.split(/(?=<span class="feature-choice-card__invocation-pick">)/u) : [];
    const primaryCheck = invocation.repeatable ? repeatableChecks.shift() : checks;
    const bodyHtml = insertRepeatableInvocationChecks(formatInvocationText(invocation.text), repeatableChecks.join(""));
    const agonizingTargets = invocation.name === AGONIZING_BLAST_INVOCATION_NAME
      ? Array.from({ length: checkCount }, (_, slotIndex) => {
        const checkboxId = getInvocationCheckboxId(index, slotIndex + 1);
        return `<select id="${getAgonizingBlastSelectId(index, slotIndex + 1)}" data-agonizing-blast-slot="${slotIndex + 1}" data-checkbox-id="${checkboxId}" hidden><option value="">--選擇契術師傷害戲法--</option></select>`;
      }).join("")
      : "";
    const hasAgonizingSelection = invocation.name === AGONIZING_BLAST_INVOCATION_NAME
      && Array.from({ length: checkCount }, (_, slotIndex) => previousChecked.has(getInvocationCheckboxId(index, slotIndex + 1))).some(Boolean);
    const settingsButton = invocation.name === AGONIZING_BLAST_INVOCATION_NAME
      ? `<button type="button" class="feature-choice-card__settings-button" data-agonizing-blast-settings="${index}"${hasAgonizingSelection ? "" : " disabled"}>戲法設定</button>`
      : "";

    return `<article class="feature-choice-card feature-choice-card--invocation${available ? "" : " is-unavailable"}" aria-disabled="${String(!available)}">
      <div class="feature-choice-card__heading">
        <span class="feature-choice-card__checks">${primaryCheck}</span>
        <strong>${escapeHtml(invocation.name)}</strong>
        ${settingsButton}
      </div>
      ${invocation.text ? `<div class="feature-choice-card__body">${bodyHtml}</div>` : ""}
      ${agonizingTargets}
    </article>`;
  }).join("");

  output.querySelectorAll("input[type='checkbox']").forEach(el => {
    el.addEventListener("change", event => { void handleEldritchInvocationChange(el, event, output); });
  });
  renderInvocationFeatChoices(previousFeats);
  syncDerivedFeatRows();
  syncAgonizingBlastSelections({ notify: false });
  output.querySelectorAll("select[data-agonizing-blast-slot]").forEach(select => {
    const previous = previousTargets.get(select.id) || "";
    if (previous && Array.from(select.options).some(option => option.value === previous && !option.disabled)) {
      select.value = previous;
    }
  });
  output.querySelectorAll("[data-agonizing-blast-settings]").forEach(button => {
    button.addEventListener("click", () => { void openAgonizingBlastModal(Number.parseInt(button.dataset.agonizingBlastSettings || "", 10), button); });
  });
  syncAgonizingBlastSelections({ notify: false });
}

function updateWarlockInvocationSummary() {
  const summaryEl = document.getElementById("warlock-invocation-summary");
  if (!summaryEl) return;

  const picks = [];
  eldritchInvocations.forEach((invocation, index) => {
    getInvocationCheckboxInputs(index).forEach(input => {
      if (input?.checked) {
        const slot = Number.parseInt(input.dataset.invocationSlot || "0", 10);
        const targetId = getAgonizingBlastSelectId(index, slot);
        const targetSpellId = document.getElementById(targetId)?.value || "";
        const targetSpell = SpellCatalog.getSpell(targetSpellId);
        picks.push({
          name: targetSpell ? `${invocation.name}（${targetSpell.nameZh}）` : invocation.name,
          text: invocation.text || ""
        });
      }
    });
  });

  renderSelectedFeatureSummary(
    summaryEl,
    picks,
    "尚未勾選魔能祈喚",
    text => formatInvocationText(text)
  );
}

function updateEldritchInvocationSectionVisibility() {
  const cls = document.getElementById("class")?.value || "";
  const section = document.getElementById("eldritch-invocations-section");
  if (!section) return;

  const isWarlock = cls === "warlock";
  section.style.display = isWarlock ? "block" : "none";
  syncCharacterFeatureTabs();

  if (isWarlock) {
    syncWarlockInvocationAvailability();
    syncWarlockInvocationSelectionLimit();
    updateWarlockInvocationSummary();
    updateACDisplay();
    populateHandAttacks();
  }
  syncDerivedFeatRows();
  updateClassFeatureChoiceReminder();
}

// 角色能力視窗頁籤下的快速選擇列：按鈕只代替主頁下拉選單，沿用同一個 change 流程。
const CHARACTER_FEATURE_PICKER_FIELDS = Object.freeze({ creation: "class", class: "class", background: "background", race: "race" });
const CHARACTER_FEATURE_PICKER_CLASS_LABELS = Object.freeze({
  barbarian: "蠻", bard: "詩", cleric: "牧", druid: "德", fighter: "戰", monk: "武",
  paladin: "聖", ranger: "遊", rogue: "盜", sorcerer: "術", warlock: "契", wizard: "法"
});
// 圖示為 512×512 單一填色路徑，顏色跟隨按鈕文字色以配合主題。
const CHARACTER_FEATURE_PICKER_ICONS = Object.freeze({
  barbarian: 'M240.094 19.594c-56.69.364-110.882 29.054-151.594 72.344-53.428 56.81-81.948 137.907-61.03 210.093 16.33-8.797 32.757-15.987 48.936-21.374-6.327-123.16 89.247-210.922 200.03-210.344 4.255-13.365 10.268-27.308 18.127-41.874-16.323-5.43-32.736-8.36-48.97-8.782-1.833-.047-3.67-.074-5.5-.062zM271.28 88.97c-97.556 1.745-179.913 77.1-176.373 186.31 10.986-2.73 21.788-4.582 32.28-5.436 14.59-1.187 28.69-.463 41.783 2.437L278.312 162.94a114.81 114.81 0 0 1-9.344-38.75c-.716-11.256.14-22.983 2.592-35.22-.093.002-.187 0-.28 0zm60.845 60.718-16.875 16.875L345.75 197l16.813-16.813-30.438-30.5zm-37.125 23L175.625 292.063l44.625 44.562 119.313-119.313L295 172.688zm189.875 46.093c-14.466 7.808-28.318 13.807-41.594 18.064.75 111.013-87.243 206.8-210.686 200.28-5.39 16.104-12.552 32.462-21.313 48.72 72.19 20.922 153.313-7.6 210.126-61.03 57.045-53.65 88.516-130.72 63.47-206.033zm-136 15.657L240.687 342.625c3.23 13.563 4.086 28.245 2.844 43.47-.862 10.58-2.752 21.476-5.53 32.56 109.585 3.718 185.128-79.008 186.594-176.905-12.342 2.506-24.16 3.403-35.5 2.688-14.287-.9-27.698-4.347-40.22-10zM169.5 312.313 20.094 461.72V494H48.75l151.188-151.188-30.438-30.5z',
  bard: 'M227.346 21.72C166.6 21.42 106.33 48.002 65.633 99.272c-70.398 88.68-55.576 217.634 33.103 288.032 6.407 5.09 13.482 9.924 20.276 14.13C46.694 328.73 38.35 211.73 103.664 129.462c65.31-82.275 181.147-100.695 268.36-46.756-5.63-5.66-11.952-11.454-18.358-16.54-37.412-29.7-81.993-44.23-126.32-44.448zm40.79 68.012c-17.173-.17-34.464 4.025-50.984 13.588l.13.237-3.91 1.95c32.484 65.062 44.2 140.54 37.956 217.565-16.43-21.657-45.042-39.13-74.498-43.38-40.71-5.87-67.6 15.738-60.06 48.265 7.542 32.527 46.656 63.654 87.365 69.525 33.316 4.805 57.36-8.8 60.87-31.726h.005c8.48-53.158 9.01-106.548.57-157.475 59.49-1.135 110.173 84.413 71.965 171.062 80.733-78.593 6.76-226.6-81.28-213.508a395.884 395.884 0 0 0-6.144-20.176c76.357-22.337 165.25 73.996 134.405 190.856C461.34 235.536 366.66 90.718 268.137 89.732zm119.83 14.264c74.538 70.422 86.508 187.106 23.778 271.363-62.724 84.26-177.937 106.267-266.78 55.062 5.804 5.48 12.3 11.076 18.862 15.96 90.823 67.61 219.258 48.798 286.867-42.028 67.612-90.823 48.798-219.256-42.025-286.868-6.56-4.887-13.783-9.498-20.703-13.49z',
  cleric: 'M257.47 23.406c-66.354 0-120.158 53.415-120.158 119.313 0 18.87 4.427 36.7 12.282 52.56h-.094l1.938 3.564c.212.395.408.795.625 1.187l45.343 84.19-89.53-47.595v214.5l61.343-32.625 77.405-162.125c-17.123-32.793-48.563-96.2-48.563-119.938 0-32.592 26.59-59 59.407-59 32.816 0 59.436 26.41 59.436 59 0 30.663-51.987 126.665-58.22 138.063L196.97 403.78l.436-.25-2.906 5.376-39.875 83.563h210.813l-47.907-88.94 89.564 47.595v-214.5l-61.688 32.78-96.594 166.658h41.907v18.687h-74.346l8.126-14.03 122.72-211.626 15.874-29.5 2.344-4.313h-.094c7.85-15.86 12.25-33.694 12.25-52.56 0-65.896-53.772-119.314-120.125-119.314zm0 72.78c-22.19 0-39.908 17.658-39.908 39.595 0 21.94 17.717 39.564 39.907 39.564 22.19 0 39.936-17.625 39.936-39.563 0-21.936-17.747-39.593-39.937-39.593z',
  druid: 'M255.688 19.438c-131.508 0-238.313 106.808-238.313 238.312 0 131.504 106.808 238.313 238.313 238.313C387.19 496.063 494 389.257 494 257.75c0-131.504-106.805-238.313-238.313-238.313zm0 18.687c121.407 0 219.625 98.22 219.625 219.625 0 121.407-98.22 219.625-219.625 219.625-121.404 0-219.625-98.22-219.625-219.625 0-121.404 98.217-219.625 219.625-219.625zm.562 20.438c-110.988 0-200.72 89.73-200.72 200.718 0 95.257 66.098 174.875 155 195.533l-3.593-1.188s2.312.576 3.5.563c7.687-.085 14.32-4.367 18.094-10.5 15.59-43.605 18.01-85.436-6.405-103.375-22.6-16.605-66.756-17.003-92.28-40.875C86.304 258.717 86.03 182.03 86.03 182.03c50.518 0 92.432 20.467 123.814 59.595-.12-1.665-.544-3.61-.563-5.28-.703-51.122 45.532-104.533 45.532-104.532 0 0 47.202 48.756 47.907 99.875.055 3.507.36 6.99 0 10.5 28.538-36.8 67.034-60.157 123.217-60.157 0 0-.273 76.687-43.812 117.407-25.32 23.683-69.467 23.692-92.25 40.282-24.086 17.536-22.317 58.325-7.594 101.03.057.16-.073.426 0 .594 3.268 7.82 10.848 13.437 19.845 13.437 88.826-20.713 154.844-100.298 154.844-195.5 0-110.986-89.732-200.717-200.72-200.717zm-.22 191.218c-15.42 7.026-25.842 22.305-25.842 40.345s10.423 33.82 25.843 40.844c15.23-7.1 25.845-22.943 25.845-40.845 0-17.902-10.613-33.244-25.844-40.344z',
  fighter: 'm146.326 6.15 87.813 128.725-60.87-39.916 34.925 62.864L38.56 48.06h-.003c40.207 71.33 82.046 134.913 129.23 191.764L303.94 103.67c-45.164-37.052-96.674-69.324-157.614-97.52zm347.145 9.496L372.983 61.713l-214.59 214.09 13.213 13.215L383.367 77.75l78.078-29.85-29.402 78.56-211.746 211.25 13.213 13.214 214.61-214.106 45.35-121.172zM407.177 89.13l-259.95 259.95c-11.956-17.32-11.687-40.444.25-57.764l-31.26-31.255c-28.637 34.832-28.588 85.102.167 119.864L52.336 443.97a22.29 22.29 0 0 0-7.842-1.43c-5.74 0-11.476 2.216-15.908 6.647-8.864 8.865-8.866 22.953 0 31.82 8.864 8.863 22.954 8.863 31.818 0 6.512-6.513 8.234-15.844 5.178-23.853l64.057-64.056c34.788 28.437 85.12 28.65 119.817.203l-31.262-31.26c-17.28 11.84-40.352 11.907-57.68.18L420.39 102.347l-13.214-13.215zm-2.196 117.01L268.186 342.937c55.29 48.057 118.235 90.138 192.464 127.216L398.783 351.41l102.78 68.85-117.75-164.645 86.816 42.908c-20.895-33.04-42.523-63.772-65.65-92.382z',
  monk: 'M91.773 25.994C189.313 167.854 104.52 157.17 65.64 169.2c38.8 52.918 16.554 102.644-44.503 133.788 52.5 21.085 122.25 30.452 42.027 141.707 79.578-45.024 134.707-48.82 127.13 53.15 57.795-58.495 133.043-87.973 208.054-38.53-8.558-73.916 12.66-106.284 86.88-74.4-79.58-73.01-46.696-116.363.458-158.83-81.492-3.232-92.92-65.497-89.922-139.92-49.183 53.518-86.497 47.756-104.002-56.962-33.806 76.857-79.335 125.91-199.99-3.21zM202.15 135.336c16.1.356 25.565 12.198 34.666 24.678L177.312 263.08c-20.422 1.985-35.31-4.577-41.787-24.123l59.51-103.074a38.747 38.747 0 0 1 5.537-.545 33.23 33.23 0 0 1 1.578-.002zm69.037 11.197c16.1.352 25.567 12.2 34.668 24.676L238.947 290.24c-20.423 1.985-35.31-4.586-41.785-24.127l66.91-119.03a38.778 38.778 0 0 1 5.537-.55 34.57 34.57 0 0 1 1.577-.002zm58.704 32.05c16.102.357 25.567 12.198 34.67 24.673l-65.945 117.547c-20.423 1.98-35.31-4.58-41.783-24.123l65.94-117.55a38.897 38.897 0 0 1 5.54-.544c.532-.013 1.06-.013 1.58-.002zm46.342 55.233c16.773.098 26.746 11.977 36.354 24.485l-55.557 96.227c-20.026 1.297-34.856-5.367-41.786-24.125l55.56-96.224a38.819 38.819 0 0 1 5.428-.362zM127.55 271.713l105.83 47.52c3.015 21.69-2.782 38.788-21.958 48.91L105.588 320.62c-4.508-21.618 8.273-35.485 21.96-48.907z',
  paladin: 'M246.78 18.656v101.22c7.988.266 16.003.267 24 0V18.655h-24zm-72.155 110.406v30.813h168.313v-30.813c-55.755 12.73-113.104 12.604-168.313 0zm-150.28 35.063 9.343 37.594 132.187 8.093 9.406.562-.655 9.406c-2.594 38.077 5.257 78.673 25.563 112.44l7.625-146.47-183.47-21.625zm463.186 0-177.842 20.97 7.187 137.843c16.457-31.775 22.736-68.503 20.375-103.157l-.625-9.405 9.375-.563 132.188-8.093 9.343-37.595zm-260.624 14.438L216.25 383.188v44.187l44.375 66.53 43.03-65.342-13-250h-22.53V429.5h-18.688V178.562h-22.53zM38.186 220.72c3.52 11.234 8.043 23.026 13.345 34.936l104.5-8.562a232.159 232.159 0 0 1-.28-19.188L38.187 220.72zm435.502 0-117.563 7.186c.172 6.353.077 12.768-.28 19.188l104.5 8.562c5.3-11.91 9.825-23.702 13.342-34.937zm-315.844 45-97.72 8a439.139 439.139 0 0 0 17.782 31.81l84.063-18.28a218.645 218.645 0 0 1-4.126-21.53zm196.187 0a218.497 218.497 0 0 1-4.092 21.53l84.03 18.28a438.002 438.002 0 0 0 17.782-31.81l-97.72-8zM167.19 305.25l-78.44 17.063c6.694 9.8 13.67 19.05 20.75 27.468l64.938-26.342a196.167 196.167 0 0 1-7.25-18.188zm177.5 0a196.727 196.727 0 0 1-7.25 18.188l64.937 26.343c7.08-8.415 14.056-17.666 20.75-27.467l-78.438-17.063z',
  ranger: 'M27.48 25.695C37 62.802 51.945 100.233 69.07 137.86c17.496-31.598 41.214-52.96 71.563-70.473C102.823 50.575 65.097 36.27 27.48 25.695zm456.24 0c-37.62 10.575-75.347 24.88-113.156 41.692 30.35 17.514 54.067 38.875 71.563 70.472 17.125-37.627 32.07-75.058 41.592-112.165zm-367.1 81.315a146.074 146.074 0 0 0-10.224 10.117L232.12 242.85l10.257-10.243L116.62 107.01zm277.956 0L28.018 473.11l10.54 10.26L404.8 117.126a145.208 145.208 0 0 0-10.224-10.117zm-138.963 26.81c-24.338 0-47.014 7.245-65.998 19.682l13.494 13.477c15.33-9.19 33.285-14.472 52.503-14.472 19.214 0 37.16 5.28 52.483 14.465l13.492-13.477c-18.975-12.433-41.64-19.676-65.975-19.676zm-.004 45.08a75.11 75.11 0 0 0-32.967 7.588l14.246 14.23a57.163 57.163 0 0 1 18.72-3.138c6.56 0 12.848 1.11 18.702 3.13l14.25-14.228a75.09 75.09 0 0 0-32.953-7.582zm102.27 11.58-13.556 13.55c8.464 14.877 13.297 32.102 13.297 50.488 0 19.172-5.255 37.087-14.403 52.392l13.496 13.48c12.386-18.958 19.598-41.59 19.598-65.872 0-23.51-6.76-45.467-18.43-64.04zm-204.56 0c-11.677 18.573-18.443 40.527-18.443 64.038 0 24.282 7.217 46.912 19.61 65.87l13.493-13.478c-9.154-15.305-14.416-33.22-14.416-52.392 0-18.386 4.838-35.61 13.307-50.487l-13.55-13.55zm171.315 33.24-14.457 14.458a57.324 57.324 0 0 1 2.373 16.343 57.204 57.204 0 0 1-3.113 18.654l14.25 14.23a75.117 75.117 0 0 0 7.543-32.883c0-10.962-2.37-21.38-6.595-30.8zm-138.072.003a75.016 75.016 0 0 0-6.598 30.798 75.087 75.087 0 0 0 7.547 32.882l14.25-14.23a57.191 57.191 0 0 1-3.117-18.65c0-5.69.837-11.17 2.375-16.344l-14.458-14.455zm92.523 45.547-10.274 10.273 203.83 203.826 10.54-10.26-204.096-203.84zm-39.84 39.84-14.453 14.452a75.063 75.063 0 0 0 30.816 6.604 75.02 75.02 0 0 0 30.798-6.6l-14.453-14.453a57.27 57.27 0 0 1-16.346 2.375 57.26 57.26 0 0 1-16.364-2.38zM81.87 341.3l-68.024 68.026h51.588l68.11-68.025H81.872zm295.78 0 68.112 68.026h51.59L429.326 341.3H377.65zm-172.546 1.95-13.55 13.553c18.58 11.68 40.544 18.45 64.06 18.45 23.51 0 45.464-6.768 64.036-18.444l-13.55-13.552c-14.875 8.47-32.102 13.306-50.487 13.306-18.39 0-35.625-4.84-50.51-13.314zm-34.88 34.883-68.03 68.025.003 51.52 68.026-68.024v-51.52zm170.75 0v51.52L409 497.68l.002-51.52-68.027-68.025z',
  rogue: 'M254.07 19.707c-56.303 28.998-106.297 107.317-122.64 168.707 32.445 2.11 58.63 12.963 78.638 30.848l9.334-10.198c-13.336-13.056-30.596-23.9-52.994-34.707 12.68-31.542 32.01-79.29 56.598-82.07 9.62-1.088 19.92 4.722 31.13 21.068 35.08-58.334 68.394 18.705 87.727 61.002-21.94 11.897-39.132 22.82-52.63 36.024l8.68 9.76c19.68-17.732 45.72-29.358 78.55-31.673C358.24 127.335 311.515 50.14 254.07 19.707zM219.617 144.57c-8.894 0-16.103 3.952-16.103 8.826 0 4.875 7.21 8.827 16.103 8.827 8.894 0 16.106-3.95 16.106-8.827 0-4.874-7.212-8.826-16.106-8.826zm68.965 0c-8.894 0-16.105 3.952-16.105 8.826 0 4.875 7.21 8.827 16.105 8.827 8.894 0 16.106-3.95 16.106-8.827 0-4.874-7.212-8.826-16.106-8.826zm-118.894 70.88a233.216 233.216 0 0 0-6.444 11.52c-25.587 48.98-43.26 123.643-43.896 223.48 32.776 18.89 64.322 31.324 95.707 36.988-35.5-24.36-60.375-80.893-60.375-146.754 0-45.97 12.12-87.39 31.51-116.506a96.185 96.185 0 0 0-16.502-8.727zm168.933.35a98.526 98.526 0 0 0-16.298 8.764c19.24 29.095 31.254 70.354 31.254 116.12 0 65.82-24.844 122.322-60.306 146.707 30.88-5.598 62.44-17.812 95.656-36.947-.638-99.57-18.31-174.163-43.9-223.177a233.816 233.816 0 0 0-6.405-11.467zm-97.665 23.61c7.026 22.543 9.128 45.086.98 67.63h-41.552v18.513c10.057-3.24 20.25-5.39 30.502-6.594.066 50.215 1.313 96.574 19.82 145.435l4.193 11.074 4.485-10.962c19.48-47.615 18.045-95.297 17.933-145.024 10.257 1.333 20.463 3.4 30.545 6.07v-18.515h-41.374c-6.888-22.544-5.932-45.087.803-67.63h-26.335z',
  sorcerer: 'M108.28 18.78c-1.2 6.05 1.1 13.32 9.095 19.876 15.883 13.01 36.716-3.12 27.875-19.875h-36.97zm174.564 0c13.572 15.575 25.36 48.026 21.687 77.22-3.915 31.118-22.083 59.048-73.624 67.094v.094a37.068 37.068 0 0 0-5.812 1.343c4.17.89 8.657 2.86 13.344 6.22 24.482 17.577 3.918 55.804-26.125 36.47-8.196-5.266-12.213-12.31-13.032-19.19-4.615 11.776-2.376 25.68 12.47 37.126 42.122 32.48 76.872-19.863 48.844-50.437 35.076-12.994 54.042-38.53 60.594-65.97 17.85 2.145 40.616 8.678 58.156 22.22 19.867 15.337 34.025 38.73 29.844 79.25l-.032.405v.406c-.43 27.1 3.257 52.267 13.906 77.314-.175-.088-.355-.164-.53-.25 10.834 28.695-4.215 77.915-32.094 76.375a47.369 47.369 0 0 1-4.625-.47c10.87-3.895 19.736-14.11 20.187-31.47.57-21.935-30.486-31.816-48.688-21.28 1.853-10.077 5.738-19.852 11.125-27.53a60.126 60.126 0 0 0 6.188-7.095c.204.627.43 1.27.72 1.906 9.98 22.058 34.89 7.416 25.186-11.405-4.35-8.457-11.074-10.648-16.686-9.03 3.504-11.767 3.415-24.225.406-35.72-3.952-15.098-13.013-28.82-26.625-37.03-7.976-4.812-17.48-7.51-27.844-7.44a61.5 61.5 0 0 0-2.092.064c-5.57.233-11.385 1.277-17.313 3.186-5.246.927-10.17 3.588-14.03 8.438-23.005 28.896 14.76 74.018 41.967 39.687 8.61-10.862 8.926-21.705 4.813-30.374a35.115 35.115 0 0 1 4.844 2.438c8.787 5.3 15.35 14.822 18.217 25.78 2.87 10.96 1.946 23.044-3.312 33.126-4.384 8.406-11.626 15.654-23.28 20.28-1.272.41-2.53.853-3.783 1.314 18.878 44.79-9.97 58.624-46.03 37.156-6.794 10.808-11.198 22.857-13.25 35.47 9.883-4.887 23.666-6.502 41.687-2.595 28.884 6.263 33.747 41 18.75 61.906.643-2.984 1.033-6.202 1.124-9.686.48-18.44-18.605-29.432-37-29.156-17.28.258-33.966 10.457-33.28 33.75.14 4.844 1.124 9.19 2.748 13.03-4.827-1.217-9.4-2.263-13.593-3.312-20.567-5.145-33.424-9.23-50.25-42.22-11.65-22.837-13.746-44.61-9.657-62.717.35-1.55.75-3.07 1.187-4.564.887-2.386 2.22-4.867 4.063-7.437 14.096-19.637 44.76-3.16 29.25 20.936-1.586 2.468-3.375 4.467-5.282 6.03 10.913-.16 22-6.1 29.69-20.56 13.784-25.93-8.35-51.58-31.5-51.688-1.84-.01-3.696.173-5.532.5-3.696-10.15-11.607-14.724-19.125-14.657-11.395.103-21.84 10.833-15.063 28.814 1.5 3.97 3.765 6.996 6.438 9.187-15.838 24.13-20.18 58.28-6.22 93.376-28.655 4.51-48 1-62.25-6.375-16.074-8.32-26.524-22.114-35.718-38.124-9.194-16.01-16.705-33.956-27.813-48.97-9.438-12.754-22.502-23.363-40.28-26.686v19c10.905 2.694 18.18 9.218 25.28 18.813 9.153 12.37 16.656 29.85 26.594 47.156 9.94 17.305 22.74 34.724 43.376 45.405 19.365 10.023 44.896 13.558 79.28 7.28 17.85 31.407 38.335 40.456 59 45.626 20.14 5.04 40.485 7.83 68.376 28.97 1.97 1.66 3.995 3.258 6.032 4.78.594.49 1.18.965 1.78 1.47l.095-.094c44.505 32.063 102.997 31.564 138.467-3.906 38.87-38.87 35.765-105.384-6.187-150.844-26.624-35.576-33.77-66.875-33.156-105.562h-.03c4.428-45.38-13.045-76.668-37.033-95.188-21.172-16.346-46.585-23.457-67-25.875 1.496-26.37-5.78-52.345-17.717-71.5h-23.22zM88.438 52.688c-3.178 0-6.483.374-9.907 1.188-5.71 1.356-10.715 4.073-15 7.75-.027.024-.064.038-.093.063-2.25 1.463-4.222 3.494-5.75 6.093-.033.058-.092.1-.124.157-2.415 4.2-3.617 9.88-2.907 17.063 2.628 26.407 40.834 27.546 39.313-3.875-.388-8.14-3.673-14.105-8.19-17.813 15.426 4.92 26.523 22.082 16.72 48.063-10.34 27.408-41.76 29.372-55.47 12.313 5.018 20.444 20.162 35.828 46.44 29.656 14.73-3.46 24.825-11.138 31-20.78.233 17.556-5.215 34.5-14.782 47.967-18.347 25.828-50.26 39.48-90.782 19.126v20.375c40.907 16.38 78.436 3.814 100.875-22.155 19.068 10 28.71 30.633 27.782 48.344-.462 8.83-3.42 16.56-8.75 22.25 1.273-11.394-3.145-22.947-14.906-28.064-35.92-15.636-71.766 35.453-29.125 53.906 2.805 1.213 5.5 2.042 8.095 2.563v.03c.085.01.165.024.25.033 3.398.657 6.63.743 9.625.375 14.957-.285 27.384-4.945 36.375-12.844 10.904-9.582 16.36-23.27 17.094-37.283 1.275-24.38-11.26-50.987-35.69-64.78 6.762-12.177 10.956-25.986 12.157-40.313a45.402 45.402 0 0 0 15.97 5.656c12.77 1.955 25.603-1.35 36.312-7.844 10.708-6.493 19.516-16.308 23.75-28.437 3.2-9.173 3.47-19.695-.032-30.064-3.167-14.78-14.114-27.622-29.438-27.625-2.21 0-4.495.248-6.875.814-30.3 7.19-32.07 68.89 1.625 70.062-7.1 3.967-15.24 5.71-22.53 4.594-7.578-1.16-14.436-4.948-20.095-13.906-2.58-13.888-8.185-27.66-17.25-40.344-7.554-12.997-20.047-22.31-35.688-22.313zm157.156 57.75c-4.71.03-9.694 2.802-13.156 9.532-9.705 18.82 15.205 33.46 25.187 11.405 5.02-11.105-3.04-20.995-12.03-20.938zm48.437 145.5c-19.927.602-18.62 25.754-.717 27.532 24.093 2.383 23.874-26.494 2.718-27.5a24.556 24.556 0 0 0-2-.032z',
  warlock: 'M403.313 41.625c-1.107 0-2.24.017-3.344.063-30.174 1.248-56.498 23.386-71.72 55.906-29.436-20.315-63.812-25.884-91.313-12.125-22.492 11.25-38.903 33.383-42.687 60.843 10.962-4.476 21.618-7.177 31.75-8.438 4.333-11.497 12.952-19.848 24-25.375 20.797-10.404 49.765-8.923 72.656 13.97l18.625 18.624 6.533-25.156c8.723-32.558 30.745-47.522 53.093-48.438 22.346-.927 45.982 11.665 54.97 43.78 12.795 45.728-29.2 82.442-57.907 123.126h-95.19c-23.612-9.383-45.98-18.687-60.967-34.25-7.368-2.142-14.748-2.2-22.594.22-3.735 1.15-7.638 2.92-11.69 5.436 16.42 28.053 44.66 45.767 74.845 61.063.43.218.85.44 1.28.656a742.992 742.992 0 0 0 10.126 5c.89.434 1.763.882 2.658 1.314 2.396 1.155 4.79 2.293 7.187 3.437 14.53 6.938 28.997 13.736 42.313 21.25 17.27 9.75 36.245 28.402 50 48.814 4.14-23.795 6.27-45.762 19.875-66.5 35.98-54.857 86.962-108.22 68.03-178.875-11.262-42.03-46.238-64.318-80.53-64.345zm-298.75 77.656c-34.293.028-69.27 22.317-80.532 64.345C5.1 254.28 56.053 307.643 92.03 362.5c13.605 20.74 15.737 42.706 19.876 66.5 13.755-20.412 32.728-39.065 50-48.813 44.413-25.066 101.483-42.217 131.875-82.875-17.71-8.498-33.892-16.466-55.405-30.156H72.625c-16.633-23.38-28.21-47.227-20.656-74.22 8.705-31.11 31.163-43.916 52.874-43.842.7.002 1.395.033 2.094.062 22.347.916 44.4 15.88 53.124 48.438l6.5 25.156 18.657-18.625c22.89-22.892 51.858-24.404 72.655-14 8.082 4.043 14.844 9.614 19.594 16.813 12.327 6.815 23.973 11.22 35.967 15.687-4.12-26.854-20.396-48.43-42.53-59.5-27.5-13.76-61.846-8.22-91.282 12.094-15.222-32.52-41.577-54.628-71.75-55.876a77.8 77.8 0 0 0-3.313-.063zm292.843 264.626c-6.496 53.84-30.488 46.8-30.97 80.72-.208 15.372 14.203 28.062 32.064 28.062 17.86 0 32.594-12.684 32.594-28.063 0-34.092-26.52-27.088-33.688-80.72z',
  wizard: 'M319.61 20.654c13.145 33.114 13.144 33.115-5.46 63.5 33.114-13.145 33.116-13.146 63.5 5.457-13.145-33.114-13.146-33.113 5.457-63.498-33.114 13.146-33.113 13.145-63.498-5.459zM113.024 38.021c-11.808 21.04-11.808 21.04-35.724 24.217 21.04 11.809 21.04 11.808 24.217 35.725 11.808-21.04 11.808-21.04 35.724-24.217-21.04-11.808-21.04-11.808-24.217-35.725zm76.55 56.184c-.952 50.588-.95 50.588-41.991 80.18 50.587.95 50.588.95 80.18 41.99.95-50.588.95-50.588 41.99-80.18-50.588-.95-50.588-.95-80.18-41.99zm191.177 55.885c-.046 24.127-.048 24.125-19.377 38.564 24.127.047 24.127.046 38.566 19.375.047-24.126.046-24.125 19.375-38.564-24.126-.047-24.125-.046-38.564-19.375zm-184.086 83.88a96.38 96.38 0 0 0-3.492.134c-18.591 1.064-41.868 8.416-77.445 22.556L76.012 433.582c78.487-20.734 132.97-21.909 170.99-4.615V247.71c-18.076-8.813-31.79-13.399-46.707-13.737a91.166 91.166 0 0 0-3.629-.002zm122.686 11.42a209.3 209.3 0 0 0-8.514.098c-12.81.417-27.638 2.215-45.84 4.522v177.135c43.565-7.825 106.85-4.2 171.244 7.566l-39.78-177.197c-35.904-8.37-56.589-11.91-77.11-12.123zm2.289 16.95c18.889.204 36.852 2.768 53.707 5.02l4.437 16.523c-23.78-3.75-65.966-4.906-92.467-.98l-.636-17.805c11.959-2.154 23.625-2.88 34.959-2.758zm-250.483 4.658L60.54 313.002h24.094l10.326-46.004H71.158zm345.881 0 39.742 177.031 2.239 9.973 22.591-.152-40.855-186.852h-23.717zm-78.857 57.82c16.993.026 33.67.791 49.146 2.223l3.524 17.174c-32.645-3.08-72.58-2.889-102.995 0l-.709-17.174c16.733-1.533 34.04-2.248 51.034-2.223zm-281.793 6.18-6.924 30.004h24.394l6.735-30.004H56.389zm274.418 27.244c4.656.021 9.487.085 14.716.203l2.555 17.498c-19.97-.471-47.115.56-59.728 1.05l-.7-17.985c16.803-.493 29.189-.828 43.157-.766zm41.476.447c8.268.042 16.697.334 24.121.069l2.58 17.74c-8.653-.312-24.87-.83-32.064-.502l-2.807-17.234a257.25 257.25 0 0 1 8.17-.073zm-326.97 20.309-17.985 77.928 25.035-.17 17.455-77.758H45.313zm303.164 11.848c19.608-.01 38.66.774 56.449 2.572l2.996 20.787c-34.305-4.244-85.755-7.697-119.1-3.244l-.14-17.922c20.02-1.379 40.186-2.183 59.795-2.193zm-166.606 44.05c-30.112.09-67.916 6.25-115.408 19.76l-7.22 2.053 187.759-1.27v-6.347c-16.236-9.206-37.42-14.278-65.13-14.196zm134.41 6.174c-19.63.067-37.112 1.439-51.283 4.182v10.064l177.594-1.203c-44.322-8.634-89.137-13.17-126.31-13.043zM26 475v18h460v-18H26z'
});

const CHARACTER_FEATURE_PICKER_RACE_LABELS = Object.freeze({ gnome: "儒", goliath: "巨", tiefling: "魔" });
function getCharacterFeaturePickerLabel(field, option) {
  if (field === "class") return CHARACTER_FEATURE_PICKER_CLASS_LABELS[option.value] || Array.from(option.text)[0] || "";
  if (field === "race") return CHARACTER_FEATURE_PICKER_RACE_LABELS[option.value] || Array.from(option.text)[0] || "";
  return option.text.replace(/\s*[（(][^）)]*[）)]\s*$/u, "");
}

function buildCharacterFeatureIcon(classValue, className) {
  const path = CHARACTER_FEATURE_PICKER_ICONS[classValue];
  return path ? `<svg class="${className}" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="${path}"/></svg>` : "";
}

function syncCharacterFeatureTitles() {
  document.querySelectorAll("[data-feature-title]").forEach(title => {
    const field = title.dataset.featureTitle;
    const option = document.getElementById(field)?.selectedOptions[0];
    const value = option?.value || "";
    // Custom backgrounds have no English name, so their user-given name leads with a fixed subtitle.
    const custom = field === "background" && value === "custom";
    const name = !value ? ""
      : custom ? window.CustomBackground?.getState()?.名稱 || ""
      : field === "background" ? getCharacterFeaturePickerLabel(field, option) : option.text;
    title.hidden = !name;
    const titleKey = name && `${value}\n${name}`;
    if (title.dataset.titleValue === titleKey) return;
    title.dataset.titleValue = titleKey;
    const subtitle = custom
      ? `<span class="character-feature-title__en">自訂背景</span>`
      : `<span class="character-feature-title__en" lang="en">${escapeHtml(value.charAt(0).toUpperCase() + value.slice(1))}</span>`;
    title.innerHTML = name
      ? `${field === "class" ? buildCharacterFeatureIcon(value, "character-feature-title__icon") : ""}<span class="character-feature-title__name">${escapeHtml(name)}</span>${subtitle}`
      : "";
  });
}

function renderCharacterFeaturePicker() {
  document.querySelectorAll("#character-features-picker [data-feature-picker]").forEach(group => {
    const field = group.dataset.featurePicker;
    const select = document.getElementById(field);
    if (!select) return;
    group.innerHTML = Array.from(select.options).filter(option => option.value).map(option => {
      const value = escapeHtml(option.value);
      const icon = field === "class" ? buildCharacterFeatureIcon(option.value, "character-features-picker__icon") : "";
      return `<button type="button" class="character-features-picker__option" data-picker-value="${value}" aria-pressed="false" aria-label="${escapeHtml(option.text)}" tabindex="-1">${icon}<span class="character-features-picker__label">${escapeHtml(getCharacterFeaturePickerLabel(field, option))}</span></button>`;
    }).join("");
  });
}

function syncCharacterFeaturePicker(tab = document.querySelector('.character-features-tabs [aria-selected="true"]')?.dataset.featureTab) {
  const picker = document.getElementById("character-features-picker");
  if (!picker) return;
  const activeField = CHARACTER_FEATURE_PICKER_FIELDS[tab] || "";
  picker.hidden = !activeField;
  picker.querySelectorAll("[data-feature-picker]").forEach(group => {
    const select = document.getElementById(group.dataset.featurePicker);
    const buttons = Array.from(group.querySelectorAll("[data-picker-value]"));
    const current = buttons.find(button => button.dataset.pickerValue === select?.value);
    const focusTarget = buttons.includes(document.activeElement) ? document.activeElement : current || buttons[0];
    group.hidden = group.dataset.featurePicker !== activeField;
    group.title = select?.disabled ? select.title : "";
    buttons.forEach(button => {
      button.setAttribute("aria-pressed", String(button === current));
      // 分享模式鎖定下拉選單時，快速選擇列一併停用。
      button.disabled = !select || select.disabled;
      button.tabIndex = button === focusTarget ? 0 : -1;
    });
  });
}

function chooseCharacterFeaturePickerOption(button) {
  const select = document.getElementById(button.closest("[data-feature-picker]")?.dataset.featurePicker || "");
  const value = button.dataset.pickerValue || "";
  if (!select || select.disabled || button.disabled || select.value === value) return;
  if (!Array.from(select.options).some(option => option.value === value)) return;
  select.value = value;
  const change = new Event("change", { bubbles: true });
  // 與玩家直接操作下拉選單相同，讓職業選項記憶與缺項提示照常運作。
  change.dndCharacterSelectionCommitted = true;
  select.dispatchEvent(change);
  syncCharacterFeaturePicker();
}

function bindCharacterFeaturePicker() {
  const picker = document.getElementById("character-features-picker");
  if (!picker) return;
  renderCharacterFeaturePicker();
  picker.addEventListener("click", event => {
    const button = event.target.closest("[data-picker-value]");
    if (button) chooseCharacterFeaturePickerOption(button);
  });
  picker.addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const buttons = Array.from(event.target.closest("[data-feature-picker]")?.querySelectorAll("[data-picker-value]:not(:disabled)") || []);
    const current = buttons.indexOf(document.activeElement);
    if (current < 0) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
      : (current + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
    buttons.forEach((button, index) => { button.tabIndex = index === next ? 0 : -1; });
    buttons[next].focus({ preventScroll: true });
  });
  ["class", "background", "race"].forEach(id => bindEventById(id, "change", () => { syncCharacterFeaturePicker(); syncCharacterFeatureTitles(); }));
  syncCharacterFeaturePicker();
  syncCharacterFeatureTitles();
}

// The ability controls stay in the document; only their container moves.
function selectCharacterFeatureTab(tab) {
  const container = document.getElementById("character-features");
  if (!container) return;
  const tabs = document.querySelector(".character-features-tabs");
  const buttons = Array.from(tabs.querySelectorAll("[data-feature-tab]"));
  const selected = buttons.find(button => button.dataset.featureTab === tab && !button.hidden)
    || buttons.find(button => button.dataset.featureTab === "class");
  buttons.forEach(button => {
    const active = button === selected;
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });
  container.querySelectorAll("[data-feature-panel]").forEach(panel => {
    const active = panel.dataset.featurePanel === selected.dataset.featureTab;
    panel.hidden = !active;
    panel.inert = !active;
  });
  syncCharacterFeaturePicker(selected.dataset.featureTab);
  syncCharacterFeatureTitles();
  // Hidden mounted controls have no usable tab-strip geometry. Opening the
  // dialog selects again after mounting, preserving visible tab scrolling.
  if (tabs.closest("#character-features-modal")) {
    const tabRect = selected.getBoundingClientRect();
    const stripRect = tabs.getBoundingClientRect();
    if (tabRect.left < stripRect.left) tabs.scrollLeft += tabRect.left - stripRect.left;
    else if (tabRect.right > stripRect.right) tabs.scrollLeft += tabRect.right - stripRect.right;
  }
}

function syncCharacterFeatureTabs() {
  const tabs = document.querySelector(".character-features-tabs");
  if (!tabs) return;
  const cls = document.getElementById("class")?.value;
  // 未達可選等級時仍顯示頁籤供查閱，勾選框由各自的可用性同步停用。
  tabs.querySelector('[data-feature-tab="metamagic"]').hidden = cls !== "sorcerer";
  tabs.querySelector('[data-feature-tab="invocations"]').hidden = cls !== "warlock";
  selectCharacterFeatureTab(tabs.querySelector('[aria-selected="true"]')?.dataset.featureTab || "class");
}

function openCharacterFeatures(tab = "class", trigger, options = {}) {
  const content = document.getElementById("character-features");
  const mount = document.getElementById("character-features-mount");
  const tabs = document.querySelector(".character-features-tabs");
  const nav = tabs?.closest(".character-features-nav");
  if (!content || !mount || !nav || !window.AppDialog) return false;
  syncManualFeatGuidance();
  syncCharacterFeatureTabs();
  selectCharacterFeatureTab(tab);
  if (!content.closest("#character-features-modal")) {
    const contextPopups = ["skillPopup", "beastPopup"].map(id => document.getElementById(id)).filter(Boolean);
    let removeAdditionalChoices = () => {};
    window.AppDialog.showContent({
      title: "角色能力",
      variant: "character-features",
      content,
      trigger,
      initialFocus: "content",
      allowNested: true,
      onEscape() {
        const visible = contextPopups.filter(popup => popup.style.display === "block");
        visible.forEach(popup => { popup.style.display = "none"; });
        return visible.length === 0;
      },
      onClose() {
        removeAdditionalChoices();
        content.prepend(nav);
        mount.appendChild(content);
        contextPopups.forEach(popup => {
          popup.style.display = "none";
          document.body.appendChild(popup);
        });
        options.onClose?.();
      }
    });
    const modal = content.closest(".app-dialog");
    removeAdditionalChoices = createClassFeatureAdditionalChoices(content);
    modal.id = "character-features-modal";
    modal.querySelector(".app-dialog__actions").remove();
    const header = modal.querySelector(".app-dialog__header");
    header.querySelector("h2").classList.add("sr-only");
    header.insertBefore(nav, header.querySelector(".app-dialog__close"));
    header.querySelector(".app-dialog__close").setAttribute("aria-label", "關閉角色能力");
    // Keep reference popups interactive inside the modal's background lock.
    contextPopups.forEach(popup => {
      modal.appendChild(popup);
      popup.inert = false;
    });
  }
  selectCharacterFeatureTab(tab);
  tabs.querySelector('[role="tab"][aria-selected="true"]')?.focus({ preventScroll: true });
  return true;
}

function bindCharacterFeatureDialog() {
  const warningToggle = document.getElementById("character-choice-warning-toggle");
  warningToggle.addEventListener("click", () => {
    characterChoiceWarningsHidden = true;
    warningToggle.setAttribute("aria-expanded", "false");
    updateClassFeatureChoiceReminder();
    document.getElementById("race")?.focus({ preventScroll: true });
  });
  document.querySelectorAll("[data-character-features-tab]").forEach(button => {
    button.addEventListener("click", () => openCharacterFeatures(button.dataset.characterFeaturesTab, button));
  });
  const tabs = document.querySelector(".character-features-tabs");
  tabs.addEventListener("click", event => {
    const button = event.target.closest("[data-feature-tab]");
    if (!button) return;
    selectCharacterFeatureTab(button.dataset.featureTab);
    const body = tabs.closest(".app-dialog")?.querySelector(".app-dialog__body");
    if (body) body.scrollTop = 0;
  });
  tabs.addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const buttons = Array.from(tabs.querySelectorAll("[data-feature-tab]")).filter(button => !button.hidden);
    const current = buttons.indexOf(document.activeElement);
    if (current < 0) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
      : (current + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].click();
    buttons[next].focus({ preventScroll: true });
  });
  bindCharacterFeaturePicker();
  syncCharacterFeatureTabs();
}

// 選項收合只包裝顯示層；原始職業文字與選項控制項保持原位。
const FEATURE_CHOICE_DISCLOSURE_STATE_KEY = "dnd.featureChoiceDisclosure.v1";
function initFeatureChoiceDisclosures() {
  let saved = {};
  try { saved = JSON.parse(window.dndStorage.getItem(FEATURE_CHOICE_DISCLOSURE_STATE_KEY) || "{}"); } catch (_error) {}
  const disclosures = Array.from(document.querySelectorAll("[data-feature-choice-disclosure]"));
  disclosures.forEach(details => {
    details.open = saved?.[details.dataset.featureChoiceDisclosure] !== false;
    details.addEventListener("toggle", () => {
      if (autosaveClearing) return;
      const state = Object.fromEntries(disclosures.map(item => [item.dataset.featureChoiceDisclosure, item.open]));
      window.dndStorage.setItem(FEATURE_CHOICE_DISCLOSURE_STATE_KEY, JSON.stringify(state));
    });
  });
}

const CLASS_FEATURE_TABLE_STATE_KEY = "dndchar_class_feature_table_state_v1";
const CLASS_CORE_CREATION_INFO_STATE_KEY = "dndchar_class_core_creation_info_state_v1";

const CLASS_FEATURE_PROMPT_DISABLED_KEY = "dnd.classFeaturePromptDisabled.v1";
let classFeaturePromptDisabled = window.dndStorage.getItem(CLASS_FEATURE_PROMPT_DISABLED_KEY) === "true";
let classFeaturePromptTimer = null;

function getMissingClassFeatureChoiceSections() {
  const missingSections = new Set();
  getClassFeatureChoiceIssues().forEach(issue => {
    let control = document.querySelector(issue.choiceSelector || issue.focusSelector || issue.selector);
    const featRow = control?.closest("#feats-area [data-feat-source]");
    if (featRow) control = document.getElementById(getFeatChoiceId(featRow.dataset.sourceKey));
    let section = control?.closest("#classFeatures section[data-feature-level], #metamagic-options-section, #eldritch-invocations-section, #druid-land-control");
    // 地貌選單留在數值頁，提示改列出等級 3 大地結社法術區段並在其中連動選擇。
    if (section?.id === "druid-land-control") section = document.querySelector("#classFeatures section[data-druid-land-choice]") || section;
    if (section) missingSections.add(section);
  });
  return missingSections;
}

// These fields edit the existing canonical controls. They carry no character
// state of their own, and resolve the source again after spell rows are rebuilt.
function appendClassFeatureLinkedSelect(container, labelText, getSource, links, getOptions, showView = true) {
  const field = document.createElement("div");
  field.className = "class-feature-linked-field";
  const label = document.createElement("label");
  const select = document.createElement("select");
  select.id = `class-feature-linked-${container.dataset.classFeatureAdditional}-${links.length}`;
  select.dataset.stateTransient = "true";
  label.htmlFor = select.id;
  label.textContent = labelText;
  const controls = document.createElement("div");
  controls.className = "feat-choice-control";
  const view = document.createElement("button");
  view.type = "button";
  view.className = "feat-choice-view";
  view.textContent = "查看";
  view.setAttribute("aria-label", `查看${labelText}詳情`);
  view.addEventListener("click", () => {
    const spell = SpellCatalog.getSpell(getSource()?.value);
    if (spell) window.quickBuild?.openSpellDetail?.(spell, view);
  });
  select.addEventListener("change", () => {
    const source = getSource();
    if (!source || source.disabled) return;
    source.value = select.value;
    source.dispatchEvent(new Event("change", { bubbles: true }));
    scheduleSaveAllFields();
  });
  controls.append(select, view);
  field.append(label, controls);
  container.appendChild(field);
  links.push(() => {
    const source = getSource();
    const html = getOptions ? getOptions() : source?.innerHTML;
    if (typeof html === "string" && select.innerHTML !== html) select.innerHTML = html;
    select.value = source?.value || "";
    select.disabled = !source || source.disabled;
    view.hidden = !showView || labelText === "魔法學徒法表";
    view.disabled = !SpellCatalog.getSpell(select.value);
    markPreparedSpellOptions(select);
  });
}

function createClassFeatureAdditionalChoices(content) {
  const mounts = new Map();
  const refresh = () => {
    const desired = new Set();
    const add = (key, parent, fields, spellChoice = true) => {
      if (!parent || (spellChoice && window.SpellManagement?.isManual())) return;
      desired.add(key);
      let entry = mounts.get(key);
      if (entry && entry.mount.parentNode !== parent) {
        entry.mount.remove();
        mounts.delete(key);
        entry = null;
      }
      if (!entry) {
        const mount = document.createElement("div");
        mount.className = "class-feature-additional-choices";
        mount.dataset.classFeatureAdditional = key;
        parent.appendChild(mount);
        const links = [];
        fields.forEach(({ label, getSource, getOptions, showView }) => appendClassFeatureLinkedSelect(mount, label, getSource, links, getOptions, showView));
        entry = { mount, links };
        mounts.set(key, entry);
      }
      entry.links.forEach(sync => sync());
    };
    content.querySelectorAll("[data-feat-choice]").forEach(wrap => {
      const key = wrap.dataset.featChoice;
      const row = () => document.querySelector(`#feats-area [data-source-key="${key}"]`);
      if (isManualFeatManagementEnabled() || !isMagicInitiateFeatSelectedInRow(row())) return;
      add(key, wrap, [
        ["class", "魔法學徒法表"], ["cantrip1", "戲法 #1"], ["cantrip2", "戲法 #2"], ["level1", "一環法術"]
      ].map(([field, label]) => ({ label, getSource: () => getMagicInitiateSelect(row(), field) })));
    });
    getAgonizingBlastSelects().forEach(source => {
      const checkbox = document.getElementById(source.dataset.checkboxId);
      if (!checkbox?.checked || checkbox.disabled || !content.contains(source)) return;
      add(source.id, source.closest(".feature-choice-card"), [{
        label: `苦痛魔爆：戲法 #${source.dataset.agonizingBlastSlot}`,
        getSource: () => document.getElementById(source.id)
      }]);
    });
    [
        ["paladin-blessed-warrior", "class-paladin-blessed-warrior", "cleric"],
        ["ranger-druidic-warrior", "class-ranger-druidic-warrior", "druid"]
      ].forEach(([id, key, spellClass]) => {
        const checkbox = document.getElementById(id);
        if (!checkbox?.checked || !content.contains(checkbox)) return;
        add(key, checkbox.closest("section[data-feature-level]"), [1, 2].map(slot => {
          const sourceKey = `${key}-cantrip-${slot}`;
          const getSource = () => window.SpellManagement?.getClassFeatureCantripControl(sourceKey);
          return {
            label: `戲法 #${slot}`, getSource,
            getOptions: () => {
              const otherKey = `${key}-cantrip-${slot === 1 ? 2 : 1}`;
              const other = window.SpellManagement.collectClassFeatureCantrips()[otherKey];
              return '<option value="">-- 請選擇戲法 --</option>' + getClassSpells(spellClass, "cantrips").map(spell =>
                `<option value="${escapeHtml(spell.spellId)}"${spell.spellId === other ? " disabled" : ""}>${escapeHtml(SpellCatalog.getDisplayName(spell.spellId))}</option>`
              ).join("");
            }
          };
        }));
      });
    // 地貌不是法術選擇，手動管理法術時仍需選擇；選單本體留在數值頁職業欄。
    if (!document.getElementById("druid-land-control")?.classList.contains("is-hidden")) {
      add("druid-land", content.querySelector("#classFeatures section[data-druid-land-choice]"), [{
        label: "大地結社地貌", getSource: () => document.getElementById("druid-land"), showView: false
      }], false);
    }
    mounts.forEach((entry, key) => {
      if (!desired.has(key)) { entry.mount.remove(); mounts.delete(key); }
    });
    markPreparedSpellOptions(content);
  };
  // Document delegation runs after the canonical change handlers, including
  // exclusivity and derived spell updates. Keep completed fields in place.
  document.addEventListener("change", refresh);
  window.addEventListener("spellmanagementchange", refresh);
  refresh();
  return () => {
    document.removeEventListener("change", refresh);
    window.removeEventListener("spellmanagementchange", refresh);
    mounts.forEach(entry => entry.mount.remove());
  };
}

function scheduleClassFeatureChoicePrompt(event) {
  // Restores and quick-build imports dispatch synthetic changes. Only a player
  // changing the class/level selector should interrupt with this dialog.
  if ((!event.isTrusted && !event.dndCharacterSelectionCommitted) || autosaveSuspended || autosaveClearing) return;
  clearTimeout(classFeaturePromptTimer);
  const trigger = event.currentTarget;
  classFeaturePromptTimer = setTimeout(() => {
    classFeaturePromptTimer = null;
    // 與職業缺項提醒相同：職業、等級、背景與種族都選好才自動跳出。
    if (classFeaturePromptDisabled || window.dndStorage.getItem(CLASS_FEATURE_PROMPT_DISABLED_KEY) === "true"
        || autosaveSuspended || autosaveClearing || document.querySelector(".app-dialog") || !isCharacterCoreSelectionComplete()) return;
    const missingSections = getMissingClassFeatureChoiceSections();
    if (missingSections.size) openClassFeatureChoicePrompt(missingSections, trigger);
  }, 120);
}

function openClassFeatureChoicePrompt(missingSections, trigger) {
  const output = document.getElementById("classFeatures");
  const parent = output?.parentNode;
  if (!parent || !missingSections.size) return;
  const nextSibling = output.nextSibling;
  const sections = Array.from(output.querySelectorAll("section[data-feature-level]"));
  const visibility = sections.map(section => ({ section, hidden: section.hidden, inert: section.inert }));
  sections.forEach(section => {
    section.hidden = !missingSections.has(section);
    section.inert = section.hidden;
  });
  const content = document.createElement("div");
  content.className = "class-feature-choices-content";
  content.appendChild(output);
  const moved = [];
  missingSections.forEach(section => {
    if (output.contains(section)) return;
    const marker = document.createComment("class feature choice location");
    section.before(marker);
    moved.push({ section, marker, hidden: section.hidden, inert: section.inert, role: section.getAttribute("role") });
    section.hidden = false;
    section.inert = false;
    section.removeAttribute("role");
    content.appendChild(section);
  });
  let removeAdditionalChoices = () => {};
  const contextPopups = ["skillPopup", "beastPopup"].map(id => document.getElementById(id)).filter(Boolean);
  window.AppDialog.showContent({
    title: "補齊職業選項",
    variant: "class-feature-choices",
    content,
    trigger,
    initialFocus: "content",
    confirmLabel: "關閉",
    showCloseButton: false,
    dismissOnBackdrop: false,
    allowNested: true,
    onEscape() {
      const visible = contextPopups.filter(popup => popup.style.display === "block");
      visible.forEach(popup => { popup.style.display = "none"; });
      return visible.length === 0;
    },
    onClose() {
      removeAdditionalChoices();
      visibility.forEach(({ section, hidden, inert }) => {
        section.hidden = hidden;
        section.inert = inert;
      });
      parent.insertBefore(output, nextSibling?.parentNode === parent ? nextSibling : null);
      moved.forEach(({ section, marker, hidden, inert, role }) => {
        marker.replaceWith(section);
        section.hidden = hidden;
        section.inert = inert;
        if (role) section.setAttribute("role", role);
      });
      contextPopups.forEach(popup => {
        popup.style.display = "none";
        document.body.appendChild(popup);
      });
    }
  });
  const modal = content.closest(".app-dialog");
  modal.id = "class-feature-choices-modal";
  removeAdditionalChoices = createClassFeatureAdditionalChoices(content);
  const preference = document.createElement("label");
  preference.className = "class-feature-choices-preference";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = "class-feature-prompt-disabled";
  checkbox.dataset.stateTransient = "true";
  checkbox.checked = classFeaturePromptDisabled;
  checkbox.addEventListener("change", () => {
    classFeaturePromptDisabled = checkbox.checked;
    if (checkbox.checked) window.dndStorage.setItem(CLASS_FEATURE_PROMPT_DISABLED_KEY, "true");
    else window.dndStorage.removeItem(CLASS_FEATURE_PROMPT_DISABLED_KEY);
  });
  preference.append(checkbox, "不要再自動跳出職業選項");
  modal.querySelector(".app-dialog__actions").prepend(preference);
  contextPopups.forEach(popup => {
    modal.appendChild(popup);
    popup.inert = false;
  });
}

function renderClassFeaturePanels(html, output, creationOutput) {
  const template = document.createElement("template");
  template.innerHTML = html;
  // 頁籤歸屬由職業 HTML（class-content.generated.js）的明確標記決定，不解析標題或改寫排版結構。
  const abilities = template.content.querySelector('[data-class-feature-panel="class"]');
  const creation = template.content.querySelector('[data-class-feature-panel="creation"]');
  output.replaceChildren(abilities || document.createTextNode("無資料"));
  creationOutput.replaceChildren(creation || document.createTextNode("無資料"));
}

function getClassFeatureHtmlBeforeLevel(raw, nextLevel) {
  const template = document.createElement("template");
  template.innerHTML = raw;
  template.content.querySelectorAll("section[data-feature-level]").forEach(section => {
    if (Number(section.dataset.featureLevel) >= nextLevel) section.remove();
  });
  return template.innerHTML;
}

function updateClassFeature() {
  const selectedClass = document.getElementById("class").value;
  const level = document.getElementById("level").value;
  const output = document.getElementById("classFeatures");
  const creationOutput = document.getElementById("classCreationInfo");
  const metamagicSection = document.getElementById("metamagic-options-section");
  const metamagicOutput = document.getElementById("metamagicOptions");
  const metamagicSummary = document.getElementById("metamagic-summary");
  captureBardMagicalDiscoverySelectionFromControls();
  const preservedControlStates = new Map([output, creationOutput].flatMap(container => Array.from(container.querySelectorAll("input[id], select[id]"))).map(control => [
    control.id,
    control.type === "checkbox" ? control.checked : control.value
  ]));

  if (!selectedClass || !classFeatures[selectedClass]) {
    output.innerHTML = "請先選擇職業";
    creationOutput.textContent = "請先選擇職業";
    metamagicSection.style.display = "none";
    metamagicOutput.innerHTML = "無資料";
    if (metamagicSummary) metamagicSummary.innerHTML = "尚未勾選超魔法";
    syncAdvancedClassFeatureControls();
    syncCharacterFeatureTabs();
    updateClassFeatureChoiceReminder();
    syncClassOptionOwner();
    return;
  }

  let raw = classFeatures[selectedClass];
  let metamagicRaw = "";
  if (selectedClass === "warlock") {
    const optionIndex = findNthIndex(raw, "魔能祈喚選項", 2);
    if (optionIndex !== -1) raw = raw.slice(0, optionIndex).trim();
  }
  if (selectedClass === "sorcerer") {
    const metamagicTitle = "超魔法選項";
    const metamagicStartIndex = raw.lastIndexOf(metamagicTitle);
    if (metamagicStartIndex !== -1) {
      metamagicRaw = raw.slice(metamagicStartIndex).trim();
      raw = raw.slice(0, metamagicStartIndex).trim();
    }
  }

  const visibleHtml = level && !isNaN(level)
    ? getClassFeatureHtmlBeforeLevel(raw, parseInt(level) + 1)
    : raw;
  renderClassFeaturePanels(highlightSpellNamesInClassFeature(visibleHtml), output, creationOutput);

  renderBardMagicalDiscoveryControls();
  renderClassFeatChoices();
  renderMissionCantripChoices();
  renderLevelUpCantripChoice();
  preservedControlStates.forEach((value, id) => {
    const control = document.getElementById(id);
    if (!control) return;
    if (control.type === "checkbox") control.checked = Boolean(value);
    else if (Array.from(control.options || []).some(option => option.value === value)) control.value = value;
  });
  syncMissionCantripChoices();
  syncLevelUpCantripChoice();

  // 等級 2 前仍列出超魔法供查閱，syncMetamagicSelectionLimit 會停用勾選。
  if (selectedClass === "sorcerer" && metamagicRaw) {
    metamagicSection.style.display = "block";
    renderMetamagicOptions();
    syncMetamagicSelectionLimit();
    updateMetamagicSummary();
  } else {
    metamagicSection.style.display = "none";
    metamagicOutput.innerHTML = "無資料";
    if (metamagicSummary) metamagicSummary.innerHTML = "尚未勾選超魔法";
  }
  syncAdvancedClassFeatureControls();
  syncCharacterFeatureTabs();
  updateClassFeatureChoiceReminder();
  // 職業詳情現在屬於這組職業與等級；下一次切換由此擷取記憶。
  syncClassOptionOwner();
}

function enforceFightingStyleChoiceExclusivity(changedId) {
  const pair = FIGHTING_STYLE_TYPE_CHOICE_GROUPS.find(ids => ids.includes(changedId));
  if (pair) enforceExclusiveCheckboxChoice(pair, changedId);
}


function syncClassFeatureDerivedChoices() {
  syncDerivedFeatRows();
  syncOriginAndSubclassDerivedSpellRows();
  updateSpellsByClassLevel();
}

function renderMissionCantripChoices() {
  MISSION_CANTRIP_CHOICES.forEach(({ checkboxId, className, label: labelText }) => {
    const checkbox = document.getElementById(checkboxId);
    if (!checkbox) return;
    const field = document.createElement("div");
    field.className = "class-feature-mission-cantrip";
    const label = document.createElement("label");
    label.textContent = labelText;
    label.htmlFor = `${checkboxId}-cantrip`;
    const controls = document.createElement("div");
    controls.className = "feat-choice-control";
    const select = document.createElement("select");
    select.id = label.htmlFor;
    select.innerHTML = renderSpellOptionsForMagicInitiate(className, "cantrips", "-- 請選擇額外戲法 --").html;
    const view = document.createElement("button");
    view.type = "button";
    view.className = "feat-choice-view";
    view.textContent = "查看";
    view.setAttribute("aria-label", `查看${labelText}詳情`);
    const syncView = () => { view.disabled = !SpellCatalog.getSpell(select.value); };
    view.addEventListener("click", () => {
      const spell = SpellCatalog.getSpell(select.value);
      if (spell) window.quickBuild?.openSpellDetail?.(spell, view);
    });
    select.addEventListener("change", () => {
      syncView();
      syncOriginAndSubclassDerivedSpellRows();
      scheduleSaveAllFields();
    });
    controls.append(select, view);
    field.append(label, controls);
    checkbox.closest(".druid-mission-option").appendChild(field);
    syncView();
  });
  syncMissionCantripChoices();
}

function syncMissionCantripChoices() {
  MISSION_CANTRIP_CHOICES.forEach(({ checkboxId }) => {
    const select = document.getElementById(`${checkboxId}-cantrip`);
    const field = select?.closest(".class-feature-mission-cantrip");
    if (!field) return;
    field.hidden = !document.getElementById(checkboxId)?.checked;
    field.querySelector("button").disabled = !SpellCatalog.getSpell(select.value);
  });
}

// 4 級透過施法／契約魔法額外學會的職業戲法屬於職業戲法共用上限。
// 選單只編輯自動管理的準備清單，並以標記辨識；舊資料戲法已選滿時視為已選。
// 例外：只需職業與等級即可預選與查看，不等背景／種族開放「準備法術」；未選提示仍需四項都選好。
const LEVEL_UP_CANTRIP_LEVEL = 4;
const LEVEL_UP_CANTRIP_TAG = "class-level-4";
const LEVEL_UP_CANTRIP_SELECT_ID = "class-level-up-cantrip";

function getLevelUpCantripClass() {
  const cantripLimit = window.getClassCantripLimit;
  const className = document.getElementById("class")?.value || "";
  const level = Number.parseInt(document.getElementById("level")?.value || "0", 10) || 0;
  const classLabel = classOptions.find(option => option.value === className)?.text || "";
  if (typeof cantripLimit !== "function" || !classLabel || level < LEVEL_UP_CANTRIP_LEVEL
      || cantripLimit(className, LEVEL_UP_CANTRIP_LEVEL) <= cantripLimit(className, LEVEL_UP_CANTRIP_LEVEL - 1)) return null;
  return { className, classLabel, limit: cantripLimit(className, level) };
}

function getLevelUpCantripState() {
  const api = window.SpellManagement;
  const cantripClass = getLevelUpCantripClass();
  if (!api || api.isManual() || !cantripClass) return null;
  const { className, classLabel, limit } = cantripClass;
  const cantrips = api.getPlayerEntries().filter(entry => entry.level === 0 && api.isEntryAvailable(entry));
  const entry = cantrips.find(item => item.classFeatureCantrip === LEVEL_UP_CANTRIP_TAG)
    || (cantrips.length >= limit ? cantrips[cantrips.length - 1] : null);
  return { className, classLabel, entry };
}

function setLevelUpCantrip(spellId) {
  const api = window.SpellManagement;
  const state = getLevelUpCantripState();
  if (!state) return false;
  if (spellId && (!SpellCatalog.getSpell(spellId) || api.getEntries().some(entry => entry.spellId === spellId && entry.spellId !== state.entry?.spellId))) return false;
  const players = api.getPlayerEntries();
  const index = state.entry ? players.findIndex(entry => api.entryKey(entry) === api.entryKey(state.entry)) : -1;
  players.forEach(entry => { delete entry.classFeatureCantrip; });
  const next = spellId ? { spellId, spellClass: state.className, classFeatureCantrip: LEVEL_UP_CANTRIP_TAG } : null;
  if (next && index < 0 && api.getPreparationCounts().cantrips >= getLevelUpCantripClass().limit) return false;
  if (index >= 0) players.splice(index, 1, ...(next ? [next] : []));
  else if (next) players.push(next);
  api.setPlayerEntries(players);
  return true;
}

function renderLevelUpCantripChoice() {
  const paragraph = document.querySelector(`#classFeatures section[data-feature-level="${LEVEL_UP_CANTRIP_LEVEL}"] > [data-after-feat-choice]`);
  const cantripClass = getLevelUpCantripClass();
  if (!paragraph || !cantripClass) return;
  const labelText = `${paragraph.querySelector("strong")?.textContent.replace(/[：:]\s*$/, "") || "施法補充"}：額外${cantripClass.classLabel}戲法`;
  const field = document.createElement("div");
  field.className = "class-feature-mission-cantrip class-feature-level-up-cantrip";
  const label = document.createElement("label");
  label.textContent = labelText;
  label.htmlFor = LEVEL_UP_CANTRIP_SELECT_ID;
  const controls = document.createElement("div");
  controls.className = "feat-choice-control";
  const select = document.createElement("select");
  select.id = LEVEL_UP_CANTRIP_SELECT_ID;
  select.dataset.stateTransient = "true";
  const view = document.createElement("button");
  view.type = "button";
  view.className = "feat-choice-view";
  view.textContent = "查看";
  view.setAttribute("aria-label", `查看${labelText}詳情`);
  view.addEventListener("click", () => {
    const spell = SpellCatalog.getSpell(select.value);
    if (spell) window.quickBuild?.openSpellDetail?.(spell, view);
  });
  select.addEventListener("change", () => {
    if (!setLevelUpCantrip(select.value)) syncLevelUpCantripChoice();
  });
  controls.append(select, view);
  field.append(label, controls);
  paragraph.after(field);
  syncLevelUpCantripChoice();
}

function syncLevelUpCantripChoice() {
  const select = document.getElementById(LEVEL_UP_CANTRIP_SELECT_ID);
  const field = select?.closest(".class-feature-level-up-cantrip");
  if (!field) return;
  const state = getLevelUpCantripState();
  field.hidden = !state;
  if (!state) return;
  const current = state.entry?.spellId || "";
  const taken = new Set((window.SpellManagement.getEntries() || []).map(entry => entry.spellId));
  taken.delete(current);
  const spells = getClassSpells(state.className, "cantrips");
  const full = !state.entry && window.SpellManagement.getPreparationCounts().cantrips >= getLevelUpCantripClass().limit;
  const optionsKey = `${state.className}\u0000${full}\u0000${spells.map(spell => `${spell.spellId}${taken.has(spell.spellId) ? "!" : ""}`).join(",")}`;
  if (select.dataset.optionsKey !== optionsKey) {
    select.innerHTML = '<option value="">-- 請選擇額外戲法 --</option>' + spells.map(spell =>
      `<option value="${escapeHtml(spell.spellId)}"${full || taken.has(spell.spellId) ? " disabled" : ""}>${escapeHtml(spell.nameZh)}</option>`
    ).join("");
    select.dataset.optionsKey = optionsKey;
  }
  select.value = current;
  markPreparedSpellOptions(select);
  field.querySelector("button").disabled = !SpellCatalog.getSpell(select.value);
}
window.addEventListener("spellmanagementchange", syncLevelUpCantripChoice);

// 職業選項記憶：玩家親自切換職業或等級時，把離開前的職業選項存入 ClassOptionMemory，
// 換回時靜默還原。畫面與角色資料仍只含目前職業；還原、匯入、快速創角與分享模式不讀寫記憶。
let classOptionOwner = { className: "", level: 0 };
let classOptionTransition = null;
const CLASS_OPTION_FEAT_ID_PATTERN = /^(?:feat-choice-|derived-feat-)/u;
const CLASS_OPTION_FEATURE_CONTROLS = "#classFeatures input[id], #classFeatures select[id], #classCreationInfo input[id], #classCreationInfo select[id]";
const CLASS_FEATURE_CANTRIP_CLASSES = Object.freeze({ paladin: "class-paladin-blessed-warrior-cantrip-", ranger: "class-ranger-druidic-warrior-cantrip-" });

function getCurrentClassOptionOwner() {
  return {
    className: document.getElementById("class")?.value || "",
    level: Number.parseInt(document.getElementById("level")?.value || "0", 10) || 0
  };
}

function syncClassOptionOwner() { classOptionOwner = getCurrentClassOptionOwner(); }

function isClassOptionFeatIdAllowed(id) {
  return !(isManualFeatManagementEnabled() && CLASS_OPTION_FEAT_ID_PATTERN.test(id));
}

function getClassOptionFeatureControls() {
  return Array.from(document.querySelectorAll(CLASS_OPTION_FEATURE_CONTROLS)).filter(control =>
    control.dataset.stateTransient !== "true" && (control.type === "checkbox" || control.tagName === "SELECT"));
}

function getClassOptionToolSelects() {
  return getToolProficiencyRows().filter(row => isDerivedToolProficiencyRow(row) && !row.dataset.fixedClassTool)
    .map(row => row.querySelector("select")).filter(select => select?.id);
}

function getBardMagicalDiscoveryMemoryValues(selection) {
  const values = {};
  selection.forEach((item, index) => {
    values[`bard-magical-discovery-${index + 1}-class`] = item.classValue;
    values[`bard-magical-discovery-${index + 1}-ring`] = item.ring;
    values[`bard-magical-discovery-${index + 1}-spell`] = item.spellId;
  });
  return values;
}

// 合併式擷取：只記錄目前畫面上存在的控制項，等級不足而暫時移除的選擇留在記憶中。
function collectClassOptionSnapshot(className, level) {
  const values = {};
  const lists = {};
  const put = (id, value) => { if (id && isClassOptionFeatIdAllowed(id)) values[id] = value; };
  getClassOptionFeatureControls().forEach(control => put(control.id, control.type === "checkbox" ? control.checked : control.value));
  if (!isManualFeatManagementEnabled()) {
    document.querySelectorAll('#feats-area > [data-feat-source="class"] [data-magic-initiate-field], #feats-area > [data-feat-source="invocation"] [data-magic-initiate-field]')
      .forEach(select => put(select.id, select.value));
  }
  if (className === "druid") put("druid-land", document.getElementById("druid-land")?.value || "");
  const cantripPrefix = CLASS_FEATURE_CANTRIP_CLASSES[className];
  if (cantripPrefix) {
    Object.entries(window.SpellManagement?.collectClassFeatureCantrips?.() || {})
      .filter(([key]) => key.startsWith(cantripPrefix)).forEach(([key, value]) => put(key, value));
  }
  if (className === "bard") {
    captureBardMagicalDiscoverySelectionFromControls();
    Object.entries(getBardMagicalDiscoveryMemoryValues(getBardMagicalDiscoverySelection())).forEach(([id, value]) => put(id, value));
  }
  if (className === "warlock") {
    document.querySelectorAll("#eldritch-invocations-output input[data-invocation-name]:not(:disabled)").forEach(input => put(input.id, input.checked));
    document.querySelectorAll("#eldritch-invocations-output select[id]").forEach(select => put(select.id, select.value));
    put("pact-tome-invocation", pactTomeInvocationRemembered);
    const tome = getPactTomeSpellSelection();
    lists["pact-tome-cantrips"] = tome.cantrips;
    lists["pact-tome-rituals"] = tome.rituals;
  }
  const metamagicInputs = Array.from(document.querySelectorAll("#metamagicOptions input[data-metamagic-name]"));
  if (className === "sorcerer" && metamagicInputs.some(input => !input.disabled)) lists.metamagic = getCheckedMetamagicNames();
  document.querySelectorAll("#extra-language-container select:not(:disabled)").forEach(select => put(select.id, select.value));
  getClassOptionToolSelects().forEach(select => put(select.id, select.value));
  lists.expertise = Array.from(document.querySelectorAll(".circle-checkbox:checked"), checkbox => checkbox.dataset.skillRank).filter(Boolean);
  return { level, values, lists };
}

// 離開職業時先存入記憶，再靜默清掉不在職業詳情內的殘留值，避免其他職業的選擇留在存檔、PDF 或跑團。
function clearLeftClassOptionResidue(className) {
  if (className === "druid") {
    const land = document.getElementById("druid-land");
    if (land) land.value = "";
  }
  const cantripPrefix = CLASS_FEATURE_CANTRIP_CLASSES[className];
  if (cantripPrefix) {
    Object.keys(window.SpellManagement?.collectClassFeatureCantrips?.() || {}).filter(key => key.startsWith(cantripPrefix)).forEach(key => {
      const control = window.SpellManagement.getClassFeatureCantripControl(key);
      if (control) control.value = "";
    });
  }
  if (className === "bard") {
    // updateClassFeature 重繪前會再讀一次控制項，所以控制項也要一起清空。
    document.querySelectorAll("#bard-magical-discoveries select").forEach(select => { select.value = ""; });
    setBardMagicalDiscoverySelection([], { sync: false });
  }
  if (className === "warlock") {
    setPactTomeSpellSelection({}, { sync: false });
    pactTomeInvocationRemembered = false;
    document.querySelectorAll("#eldritch-invocations-output input[data-invocation-name]").forEach(input => { input.checked = false; });
    document.querySelectorAll("#eldritch-invocations-output select[data-agonizing-blast-slot]").forEach(select => { select.value = ""; });
    renderEldritchInvocations();
  }
}

function isCommittedCharacterSelectionChange(event) {
  return Boolean(event && (event.isTrusted || event.dndCharacterSelectionCommitted));
}

function canUseClassOptionMemory() {
  return Boolean(window.ClassOptionMemory) && !SHARE_MODE && !autosaveSuspended && !autosaveClearing && !jsonImportInProgress;
}

// 在職業／等級 handler 重繪職業詳情之前呼叫；此時畫面仍屬於前一個職業與等級。
function beginClassOptionTransition(event) {
  classOptionTransition = null;
  if (!isCommittedCharacterSelectionChange(event) || !canUseClassOptionMemory()) return;
  const from = { ...classOptionOwner };
  const to = getCurrentClassOptionOwner();
  if (from.className === to.className && from.level === to.level) return;
  if (from.className) {
    window.ClassOptionMemory.remember(from.className, collectClassOptionSnapshot(from.className, from.level));
    if (from.className !== to.className) clearLeftClassOptionResidue(from.className);
  }
  classOptionTransition = { from, to };
}

function setClassOptionControlValue(control, value) {
  if (!control) return false;
  if (control.type === "checkbox") {
    control.checked = value === true;
    return true;
  }
  if (typeof value !== "string" || !Array.from(control.options || []).some(option => option.value === value)) return false;
  control.value = value;
  return true;
}

function restoreClassOptionMemory(className, record) {
  const values = record.values || {};
  const lists = record.lists || {};
  const has = id => Object.hasOwn(values, id) && isClassOptionFeatIdAllowed(id);
  const dispatchRestoreChange = control => control.dispatchEvent(new Event("change"));

  // 與載入存檔相同：先還原勾選，再還原會依勾選顯示的選單，最後建立衍生專長列。
  const featureControls = getClassOptionFeatureControls();
  featureControls.filter(control => control.type === "checkbox" && has(control.id)).forEach(control => {
    if (setClassOptionControlValue(control, values[control.id])) dispatchRestoreChange(control);
  });
  getClassOptionFeatureControls().filter(control => control.tagName === "SELECT" && has(control.id) && !control.id.startsWith("feat-choice-")).forEach(control => {
    if (setClassOptionControlValue(control, values[control.id])) dispatchRestoreChange(control);
  });
  if (className === "druid" && has("druid-land")) {
    const land = document.getElementById("druid-land");
    if (setClassOptionControlValue(land, values["druid-land"])) dispatchRestoreChange(land);
  }
  if (className === "warlock") {
    const state = { __pactTomeInvocationSelected: values["pact-tome-invocation"] === true };
    Object.entries(values).forEach(([id, value]) => {
      if (isEldritchInvocationCheckboxId(id) || isAgonizingBlastSelectId(id)) state[id] = value;
    });
    setPactTomeSpellSelection({ cantrips: lists["pact-tome-cantrips"] || [], rituals: lists["pact-tome-rituals"] || [] }, { sync: false });
    renderEldritchInvocations({ state });
    syncWarlockInvocationSelectionLimit();
    renderEldritchInvocations();
    applyAgonizingBlastState(state);
    document.querySelectorAll("#eldritch-invocations-output [data-feat-choice] select[id]").forEach(select => {
      if (has(select.id)) setClassOptionControlValue(select, values[select.id]);
    });
  }
  getClassOptionFeatureControls().filter(control => control.id.startsWith("feat-choice-") && has(control.id)).forEach(control => {
    setClassOptionControlValue(control, values[control.id]);
  });
  syncDerivedFeatRows();
  Object.entries(values).filter(([id]) => /^derived-feat-.*-magic-initiate-/u.test(id) && has(id))
    .sort(([a], [b]) => Number(!a.endsWith("-class")) - Number(!b.endsWith("-class")))
    .forEach(([id, value]) => {
      const control = document.getElementById(id);
      if (setClassOptionControlValue(control, value)) dispatchRestoreChange(control);
    });
  const cantripPrefix = CLASS_FEATURE_CANTRIP_CLASSES[className];
  if (cantripPrefix) {
    applyClassFeatureCantrips(Object.fromEntries(Object.entries(values)
      .filter(([key, value]) => key.startsWith(cantripPrefix) && typeof value === "string")));
  }
  if (className === "bard") {
    setBardMagicalDiscoverySelection(Array.from({ length: BARD_MAGICAL_DISCOVERY_SLOT_COUNT }, (_, index) => ({
      classValue: values[`bard-magical-discovery-${index + 1}-class`] || "",
      ring: values[`bard-magical-discovery-${index + 1}-ring`] || "",
      spellId: values[`bard-magical-discovery-${index + 1}-spell`] || ""
    })), { sync: false });
    renderBardMagicalDiscoveryControls();
  }
  if (className === "sorcerer" && Array.isArray(lists.metamagic)) {
    const names = new Set(lists.metamagic);
    document.querySelectorAll("#metamagicOptions input[data-metamagic-name]:not(:disabled)").forEach(input => {
      input.checked = names.has(input.dataset.metamagicName);
    });
    syncMetamagicSelectionLimit();
    updateMetamagicSummary();
  }
  // 職業工具：略過已在其他列出現的工具，不覆蓋玩家目前的選擇。
  syncClassToolRows();
  getClassOptionToolSelects().forEach(select => {
    const value = values[select.id];
    if (!has(select.id) || !value || select.value) return;
    if (getToolProficiencyRows().some(row => row.querySelector("select") !== select && row.querySelector("select")?.value === value)) return;
    setClassOptionControlValue(select, value);
  });
  removeDuplicateToolProficiencies();
  syncToolProficiencyOptions();
  updateExtraLanguageFields();
  document.querySelectorAll("#extra-language-container select:not(:disabled)").forEach(select => {
    const value = values[select.id];
    if (has(select.id) && value && Array.from(select.options).some(option => option.value === value && !option.disabled)) select.value = value;
  });
  // 專精只補回、不取消：無法區分專精來源，玩家目前已勾的專精一律保留。
  updateExpertiseVisibility();
  let expertiseChanged = false;
  (lists.expertise || []).forEach(skill => {
    const expertise = Array.from(document.querySelectorAll(".circle-checkbox")).find(checkbox => checkbox.dataset.skillRank === skill);
    if (!expertise || expertise.disabled || expertise.checked) return;
    expertise.checked = true;
    const proficiency = document.getElementById(`prof-${skill}`);
    if (proficiency) proficiency.checked = false;
    expertiseChanged = true;
  });
  if (expertiseChanged) fillSkills();
}

// 在職業／等級 handler 的最後呼叫：所有依職業重建的控制項都已就緒。
function finishClassOptionTransition() {
  const transition = classOptionTransition;
  classOptionTransition = null;
  syncClassOptionOwner();
  if (!transition || !canUseClassOptionMemory()) return;
  const { className } = transition.to;
  const record = className ? window.ClassOptionMemory.get(className) : null;
  if (!record) return;
  const previousAutosaveSuspended = autosaveSuspended;
  autosaveSuspended = true;
  try {
    withCharacterUpdateBatch(() => {
      restoreClassOptionMemory(className, record);
      syncMissionCantripChoices();
      syncDerivedFeatRows();
      syncOriginAndSubclassDerivedSpellRows();
      updateSpellsByClassLevel();
      updateClassFeatureOptionVisibility();
      updateEldritchInvocationSectionVisibility();
      syncAdvancedClassFeatureControls();
      syncLevelUpCantripChoice();
      refreshWeaponSelections();
      updateACDisplay();
      updateSpeedDisplay();
      populateHandAttacks();
    });
  } finally {
    autosaveSuspended = previousAutosaveSuspended;
  }
  updateClassFeatureChoiceReminder();
  scheduleStructuralSaveAllFields();
}

// 舊存檔可能留有非目前職業的殘留值；載入後靜默搬進該職業的記憶（不覆蓋既有記憶）並清空。
function migrateLegacyClassOptionResidue() {
  if (!window.ClassOptionMemory || SHARE_MODE) return false;
  const currentClass = document.getElementById("class")?.value || "";
  const moves = [];
  const land = document.getElementById("druid-land");
  if (currentClass !== "druid" && land?.value) moves.push(["druid", { values: { "druid-land": land.value } }]);
  Object.entries(CLASS_FEATURE_CANTRIP_CLASSES).forEach(([className, prefix]) => {
    if (className === currentClass) return;
    const cantrips = Object.fromEntries(Object.entries(window.SpellManagement?.collectClassFeatureCantrips?.() || {})
      .filter(([key, value]) => key.startsWith(prefix) && value));
    if (Object.keys(cantrips).length) moves.push([className, { values: cantrips }]);
  });
  const discovery = getBardMagicalDiscoverySelection();
  if (currentClass !== "bard" && discovery.some(item => item.classValue || item.ring || item.spellId)) {
    moves.push(["bard", { values: getBardMagicalDiscoveryMemoryValues(discovery) }]);
  }
  const tome = getPactTomeSpellSelection();
  const invocations = Array.from(document.querySelectorAll("#eldritch-invocations-output input[data-invocation-name]:checked"));
  if (currentClass !== "warlock" && (tome.cantrips.length || tome.rituals.length || pactTomeInvocationRemembered || invocations.length)) {
    moves.push(["warlock", {
      values: { "pact-tome-invocation": pactTomeInvocationRemembered, ...Object.fromEntries(invocations.map(input => [input.id, true])) },
      lists: { "pact-tome-cantrips": tome.cantrips, "pact-tome-rituals": tome.rituals }
    }]);
  }
  if (!moves.length) return false;
  moves.forEach(([className, snapshot]) => {
    const existing = window.ClassOptionMemory.get(className);
    const values = Object.fromEntries(Object.entries(snapshot.values || {}).filter(([key]) => !Object.hasOwn(existing?.values || {}, key)));
    const lists = Object.fromEntries(Object.entries(snapshot.lists || {}).filter(([key]) => !Object.hasOwn(existing?.lists || {}, key)));
    window.ClassOptionMemory.remember(className, { level: existing?.level || 0, values, lists });
    clearLeftClassOptionResidue(className);
  });
  return true;
}

function getClassFeatureChoiceIssues() {
  const issues = [];
  const manualSpells = window.SpellManagement?.isManual() === true;
  const selectedClass = (document.getElementById("class")?.value || "").trim();
  const selectedLevel = Number.parseInt(document.getElementById("level")?.value || "", 10);
  const pushGeneral = issue => issues.push({ reminderType: "general", ...issue });
  const incompleteMagicRow = Array.from(document.querySelectorAll("#feats-area > .form-row"))
    .find(row => getFeatSelectFromRow(row)?.value === MAGIC_INITIATE_FEAT_NAME
      && getIncompleteMagicInitiateControl(row));
  if (incompleteMagicRow) {
    const missing = getIncompleteMagicInitiateControl(incompleteMagicRow);
    const featSelect = getFeatSelectFromRow(incompleteMagicRow);
    pushGeneral({
      message: "魔法學徒法術尚未選完",
      tab: "basic",
      selector: "#feats-area",
      focusSelector: `#${missing.id}`,
      expandFeatSelector: `#${featSelect.id}`
    });
  }
  if (!selectedClass || !Number.isInteger(selectedLevel)) return issues;

  const checkboxGroupLabels = {
    "cleric-guardian": "牧師神聖使命",
    "druid-shaman": "德魯伊原初使命",
    "paladin-fighting-style": "聖騎士戰鬥風格類型",
    "ranger-fighting-style": "遊俠戰鬥風格類型",
    "ranger-hunters-prey-colossus-slayer": "遊俠狩獵目標",
    "cleric-blessed-strikes-divine-strike": "牧師神佑打擊",
    "druid-elemental-fury-primal-strike": "德魯伊元素狂怒",
    "ranger-defensive-tactics-escape-the-horde": "遊俠防守戰術"
  };
  const checkboxGroups = [
    CLERIC_MISSION_CHOICE_IDS,
    DRUID_MISSION_CHOICE_IDS,
    ...FIGHTING_STYLE_TYPE_CHOICE_GROUPS,
    ...ADVANCED_CLASS_FEATURE_CHOICE_GROUPS
  ];
  checkboxGroups.forEach(ids => {
    const availability = ADVANCED_CLASS_FEATURE_AVAILABILITY[ids[0]];
    if (!availability || availability.className !== selectedClass || selectedLevel < availability.minimumLevel) return;
    if (isManualFeatManagementEnabled() && FIGHTING_STYLE_TYPE_CHOICE_GROUPS.includes(ids)) return;
    if (ids.some(id => document.getElementById(id)?.checked)) return;
    pushGeneral({
      message: `${checkboxGroupLabels[ids[0]] || "職業選項"}尚未選擇。`,
      tab: "basic",
      selector: ids.map(id => `#${id}`).join(", "),
      focusSelector: `#${ids[0]}`
    });
  });

  if (selectedClass === "druid" && selectedLevel >= 3 && !(document.getElementById("druid-land")?.value || "").trim()) {
    pushGeneral({
      message: "大地結社地貌尚未選擇。",
      tab: "basic",
      selector: "#druid-land",
      focusSelector: "#druid-land"
    });
  }

  const affinityId = "sorcerer-elemental-affinity-damage-type";
  if (isAdvancedClassFeatureControlAvailable(affinityId) && !(document.getElementById(affinityId)?.value || "").trim()) {
    pushGeneral({
      message: "術士元素親和傷害類型尚未選擇。",
      tab: "basic",
      selector: `#${affinityId}`,
      focusSelector: `#${affinityId}`
    });
  }

  if (!isManualFeatManagementEnabled()) {
    getFeatChoiceSpecs()
      .filter(spec => spec.active && (spec.source === "class" || spec.source === "invocation"))
      .forEach(spec => {
        const id = getFeatChoiceId(spec.key);
        if (!(document.getElementById(id)?.value || "").trim()) {
          pushGeneral({ message: `${spec.label}尚未選擇。`, tab: "basic", selector: `#${id}` });
        }
      });

  }

  if (!manualSpells && selectedClass === "bard" && selectedLevel >= 6) {
    const magicalDiscoveryIncomplete = getBardMagicalDiscoverySelection().some(selection =>
      !selection.classValue || !selection.ring || !selection.spellId
    );
    if (magicalDiscoveryIncomplete) {
      pushGeneral({
        message: "吟遊詩人魔法發現法術尚未選完。",
        tab: "basic",
        selector: "#bard-magical-discoveries",
        focusSelector: "#bard-magical-discoveries select"
      });
    }
  }

  MISSION_CANTRIP_CHOICES.forEach(({ checkboxId, className, label }) => {
    const id = `${checkboxId}-cantrip`;
    if (manualSpells || selectedClass !== className || !document.getElementById(checkboxId)?.checked || document.getElementById(id)?.value) return;
    pushGeneral({ message: `${label}尚未選擇。`, tab: "basic", selector: `#${id}`, focusSelector: `#${id}` });
  });

  // 下拉選單只需職業與等級即可預選；未選提示仍等四項角色選擇都完成才出現。
  const levelUpCantrip = manualSpells ? null : getLevelUpCantripState();
  if (levelUpCantrip && !levelUpCantrip.entry && isCharacterCoreSelectionComplete()) pushGeneral({
    message: `${levelUpCantrip.classLabel} ${LEVEL_UP_CANTRIP_LEVEL} 級額外戲法尚未選擇。`,
    tab: "basic",
    selector: `#${LEVEL_UP_CANTRIP_SELECT_ID}`,
    focusSelector: `#${LEVEL_UP_CANTRIP_SELECT_ID}`
  });

  if (!manualSpells && ["paladin", "ranger"].includes(selectedClass) && selectedLevel >= 2) {
    const magicId = selectedClass === "paladin" ? "paladin-blessed-warrior" : "ranger-druidic-warrior";
    if (document.getElementById(magicId)?.checked) {
      const sourceFragment = selectedClass === "paladin" ? "blessed-warrior" : "druidic-warrior";
      const choices = window.SpellManagement?.collectClassFeatureCantrips() || {};
      const incomplete = [1, 2].some(slot => !choices[`class-${selectedClass}-${sourceFragment}-cantrip-${slot}`]);

      if (incomplete) {
        pushGeneral({
          message: `${selectedClass === "paladin" ? "受祝福的勇士" : "德魯伊教戰士"}戲法尚未選完。`,
          tab: "basic",
          choiceSelector: `#${magicId}`,
          selector: `#${magicId}`,
          focusSelector: `#${magicId}`
        });
      }
    }
  }

  if (!manualSpells && selectedClass === "warlock") {
    const missingAgonizingTarget = getAgonizingBlastSelects().find(select => {
      const checkbox = document.getElementById(select.dataset.checkboxId || "");
      return checkbox?.checked && !checkbox.disabled && !select.value;
    });
    if (missingAgonizingTarget) {
      pushGeneral({
        message: "苦痛魔爆套用的戲法尚未選擇。",
        tab: "basic",
        selector: `#${missingAgonizingTarget.id}`,
        focusSelector: `#${missingAgonizingTarget.id}`
      });
    }
  }

  if (selectedClass === "sorcerer" && selectedLevel >= 2) {
    const metamagicCount = getCheckedMetamagicNames().length;
    const metamagicLimit = getMetamagicSelectionLimit();
    if (metamagicCount < metamagicLimit) issues.push({
      reminderType: "metamagic",
      message: `術士超魔法尚未選完（${metamagicCount}/${metamagicLimit}）。`,
      tab: "basic",
      selector: "#metamagicOptions input[data-metamagic-name]:not(:checked)",
      focusSelector: "#metamagicOptions input[data-metamagic-name]:not(:checked)"
    });
  }

  if (selectedClass === "warlock" && selectedLevel >= 1) {
    const invocationInputs = Array.from(document.querySelectorAll("#eldritch-invocations-output input[data-invocation-name]"));
    const invocationCount = invocationInputs.filter(input => input.checked).length;
    const invocationLimit = getWarlockInvocationSelectionLimit();
    if (invocationInputs.length && invocationCount < invocationLimit) issues.push({
      reminderType: "invocations",
      message: `契術師魔能祈喚尚未選完（${invocationCount}/${invocationLimit}）。`,
      tab: "basic",
      selector: "#eldritch-invocations-output input[data-invocation-name]:not(:checked)",
      focusSelector: "#eldritch-invocations-output input[data-invocation-name]:not(:checked)"
    });
  }

  return issues;
}

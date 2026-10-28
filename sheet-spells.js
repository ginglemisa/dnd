/**
 * 法術頁：法表與準備、已選法術清單、法術位、免費次數與法術描述（傳統 script，不使用 defer）。
 *
 * - 自 index.html 原封搬出，留在最後一段角色卡 script 的原位置同步載入：
 *   前段（裝備）在本檔之前、後段（浮窗、存檔、分享、初始化）在本檔之後執行。
 * - 頂層保留原有的版面觀察器、法術總覽收合初始化與按鈕事件綁定，
 *   只呼叫本檔內的函式；新增頂層程式時不可依賴後段 script 的宣告。
 * - 維持全域名稱供 index.html、spellbook.js、tabletop-*.js、search.js 等呼叫。
 */
// ====== 法術下拉產生用 ======

function getClassSpells(classVal, level) { return classVal ? SpellCatalog.getSpells(classVal, level) : []; }

const SPELLCASTING_CLASS_GROUPS = {
  int: ["wizard"],
  wis: ["cleric", "druid", "ranger"],
  cha: ["bard", "paladin", "sorcerer", "warlock"]
};

const SPELL_PREPARE_FALLBACK_ORDER = [
  "cleric",
  "wizard",
  "bard",
  "druid",
  "ranger",
  "paladin",
  "sorcerer",
  "warlock"
];

function isSpellAutoPrepareInProgress() {
  return Boolean(window.__spellAutoPrepareInProgress || window.__magicInitiateSyncInProgress);
}



function getSpellClassSearchOrder(selectedAbility) {
  const sameAbilityClasses = Array.isArray(SPELLCASTING_CLASS_GROUPS[selectedAbility])
    ? SPELLCASTING_CLASS_GROUPS[selectedAbility]
    : [];

  if (!sameAbilityClasses.length) {
    return [...SPELL_PREPARE_FALLBACK_ORDER];
  }

  const remaining = SPELL_PREPARE_FALLBACK_ORDER.filter((classId) => !sameAbilityClasses.includes(classId));
  return [...sameAbilityClasses, ...remaining];
}

function getSpellClassSearchOrderWithPrimary(primaryClassId, selectedAbility) {
  const ordered = [];
  if (primaryClassId) {
    ordered.push(primaryClassId);
  }

  const remainingOrdered = getSpellClassSearchOrder(selectedAbility)
    .filter((classId) => classId !== primaryClassId);

  ordered.push(...remainingOrdered);
  return [...new Set(ordered)];
}



async function autoPrepareSpellFromFeature(spellId, triggerEl) {
  const spell = SpellCatalog.getSpell(spellId);
  if (!spell) return;
  const canWriteSpellbook = document.getElementById("class")?.value === "wizard"
    && triggerEl?.closest?.("#classFeatures [data-wizard-spellbook-recommendations]")
    && spell.level === 1 && SpellCatalog.getClassIds(spellId).includes("wizard");
  const alreadyRecorded = canWriteSpellbook && window.Spellbook?.getState().spellIds.includes(spellId);
  const detailOptions = canWriteSpellbook ? {
    spellbookAlreadyRecorded: alreadyRecorded, stateNote: alreadyRecorded ? "此法術已在法術書中。" : "",
    onWriteSpellbook: () => {
      if (!window.Spellbook?.addWizardSpell(spellId)) return false;
      window.AppDialog.notify(`已將「${spell.nameZh}」寫入法術書。`);
      return true;
    }
  } : {};
  if (!(await window.quickBuild?.openSpellPrepareDetail?.(spellId, triggerEl, detailOptions))) return;
  if (!window.SpellManagement?.canManage()) {
    await window.AppDialog.showMessage({ title: "請先完成角色選擇", message: "請先選好職業、等級、背景與種族，才能使用『準備法術』。", confirmLabel: "關閉", trigger: triggerEl });
    return;
  }
  if (hasPreparedSpell(spellId)) return;
  const result = window.SpellManagement.addPlayerSpell(spellId);
  if (!result) {
    const limits = window.SpellManagement.getLimits();
    const eligible = window.SpellManagement.isEntryAvailable({ spellId, level: spell.level, spellClass: document.getElementById("class").value });
    const rings = window.Spellbook?.getPreparedRingLabel?.(document.getElementById("class").value, document.getElementById("level").value) || "一至四環";
    const warning = eligible ? { title: "已達準備上限", message: spell.level === 0 ? `最多可選 ${limits.cantrips} 個職業戲法，請先取消其他戲法。` : `${rings}${rings === "一環" ? "" : "合計"}最多可準備 ${limits.prepared} 個法術，請先取消其他法術。` }
      : getSpellPrepareWarning(spellId, document.getElementById("class").value);
    await window.AppDialog.showMessage({ ...warning, confirmLabel: "關閉", trigger: triggerEl });
  }
}
function getSpellPrepareWarning(spellId, primaryClassId) {
  const spell = SpellCatalog.getSpell(spellId);
  const spellName = SpellCatalog.getDisplayName(spellId);
  const levelSelect = document.getElementById("level");
  const characterLevel = Number.parseInt(levelSelect?.value || "8", 10) || 8;
  const primaryLabel = document.getElementById("class")?.selectedOptions[0]?.textContent?.trim() || "";
  const sourceClasses = classOptions.filter(option => SpellCatalog.getClassIds(spellId).includes(option.value));
  if (!sourceClasses.length) {
    return { title: "職業來源不可用", message: `「${spellName}」沒有可供目前法術選單使用的職業來源。` };
  }
  // 門檻由共用規則與現有角色等級選項取得，不另存一份法術進度表。
  const levels = [...levelSelect.options].map(option => Number(option.value)).filter(level => level > 0).sort((a, b) => a - b);
  const requirements = sourceClasses.map(option => {
    const requiredLevel = levels.find(level => classCanAccessSpellLevel(option.value, level, spell.level));
    return requiredLevel ? `${option.text}：${requiredLevel} 級起` : `${option.text}：目前支援的等級尚未開放`;
  });
  const classMismatch = Boolean(primaryClassId && !sourceClasses.some(option => option.value === primaryClassId));
  return {
    title: classMismatch ? "職業不符" : "等級不足",
    message: [
      classMismatch ? `「${spellName}」不在${primaryLabel}的職業法術清單中。` : `「${spellName}」是${getSpellLevelLabel(spell.level === 0 ? "cantrips" : spell.level)}。`,
      classMismatch ? "自動管理僅使用角色職業的法表；其他來源法術請在對應角色能力中選擇，或啟用手動法術管理。" : `目前角色等級為 ${characterLevel}，尚未達到此環階的要求。`,
      `可用來源與等級要求：\n${requirements.join("\n")}`
    ].join("\n\n")
  };
}
function bindFeatureSpellHighlightEvents() { if(window.__featureSpellHighlightEventsBound)return;window.__featureSpellHighlightEventsBound=true;const handler=target=>{const trigger=target?.closest?.(".spell-highlight-action[data-spell-id]");if(!trigger)return false;autoPrepareSpellFromFeature(trigger.dataset.spellId||"",trigger);return true;};document.addEventListener("click",event=>{if(handler(event.target))event.preventDefault();});document.addEventListener("keydown",event=>{if((event.key==="Enter"||event.key===" ")&&handler(event.target))event.preventDefault();}); }

const classOptions = [
  {value: "bard", text: "吟遊詩人"},
  {value: "cleric", text: "牧師"},
  {value: "druid", text: "德魯伊"},
  {value: "paladin", text: "聖騎士"},
  {value: "ranger", text: "遊俠"},
  {value: "sorcerer", text: "術士"},
  {value: "warlock", text: "契術師"},
  {value: "wizard", text: "法師"},
  // ... 其他職業 ...
];
const SPELL_RING_CONFIGS = Object.freeze([
  Object.freeze({ ring: 1, areaId: "level1spells-area", pickedId: "picked-level1", slotRowId: "spellslot1-row" }),
  Object.freeze({ ring: 2, areaId: "level2spells-area", pickedId: "picked-level2", slotRowId: "spellslot2-row" }),
  Object.freeze({ ring: 3, areaId: "level3spells-area", pickedId: "picked-level3", slotRowId: "spellslot3-row" }),
  Object.freeze({ ring: 4, areaId: "level4spells-area", pickedId: "picked-level4", slotRowId: "spellslot4-row" })
]);
const SPELL_AREA_CONFIGS = Object.freeze([
  Object.freeze({ level: "cantrips", areaId: "cantrips-area", pickedId: "picked-cantrips" }),
  ...SPELL_RING_CONFIGS.map(config => Object.freeze({
    level: config.ring,
    areaId: config.areaId,
    pickedId: config.pickedId
  }))
]);

function getAvailableSpellSourceClasses(level) {
  if (window.SpellManagement?.isManual()) return classOptions.filter(option => getClassSpells(option.value, level).length);
  const characterClass = document.getElementById("class")?.value || "";
  const characterLevel = Number.parseInt(document.getElementById("level")?.value || "0", 10) || 0;
  const spellLevel = level === "cantrips" ? 0 : Number(level);
  return classOptions.filter(option => option.value === characterClass && classCanAccessSpellLevel(option.value, characterLevel, spellLevel));
}

function getSpellLevelLabel(level) {
  if (level === "cantrips") return "戲法";
  const ringMap = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  return `${ringMap[level] || level}環法術`;
}



function getFreeSpellUseSpec(entry) {
  if (window.SpellManagement?.isManual()) return null;
  if (!entry?.sourceKey) return null;
  const freeUses = entry.freeUses || (entry.spellSource === MAGIC_INITIATE_SOURCE && entry.sourceKey.endsWith("-level-1") ? 1 : 0);
  const count = freeUses === "proficiency" ? getProficiencyBonus() : Number(freeUses) || 0;
  assertCharacterDataCount(count, CHARACTER_DATA_LIMITS.freeUses);
  return count ? { key: entry.sourceKey, count, label: `${entry.sourceLabel || "來源能力"}；長休恢復` } : null;
}

function getFreeSpellUseInputId(spec, index) {
  const safeKey = spec.key.replace(/[^A-Za-z0-9_-]/g, char => `u${char.codePointAt(0).toString(16)}`);
  return `free-spell-use-${safeKey}-${index + 1}`;
}

function renderFreeSpellUseChecks(spec, checkedState) {
  const boxes = Array.from({ length: spec.count }, (_, index) => {
    const id = getFreeSpellUseInputId(spec, index);
    const checked = checkedState.get(id) ? " checked" : "";
    return `<input type="checkbox" id="${id}" class="free-spell-use-check" aria-label="${escapeHtml(spec.label)} ${index + 1}/${spec.count}" title="${escapeHtml(spec.label)}"${checked}>`;
  }).join("");
  return `<span class="free-spell-use-checks" aria-label="免費施法次數" hidden>${boxes}</span>`;
}

function getPickedSpellSourceTag(entry) {
  if (entry?.sourceTag) return entry.sourceTag;
  if (entry?.spellSource === RACE_SPELL_SOURCE) return "種族";
  if (entry?.spellSource === SUBCLASS_SPELL_SOURCE) return "子職";
  if (entry?.spellSource === CLASS_SPELL_SOURCE) return "職業";
  if (entry?.spellSource === MAGIC_INITIATE_SOURCE) return Number(entry.sourcePriority) === 10 ? "背景" : "專長";
  return "";
}

function hasDruidNaturalRecoverySpells() {
  const classValue = document.getElementById("class")?.value || "";
  const level = Number.parseInt(document.getElementById("level")?.value || "0", 10) || 0;
  if (classValue !== "druid" || level < 6 || !document.getElementById("druid-land")?.value) return false;
  return getSubclassDerivedSpellSpecs().some(spec => typeof spec.ring === "number" && spec.ring >= 1);
}

function isDruidLandSpellEntry(entry) {
  return hasDruidNaturalRecoverySpells() && entry?.spellSource === SUBCLASS_SPELL_SOURCE
    && entry.sourceKey?.startsWith("subclass-druid-") && entry.level > 0;
}

function getSpellFreeUseControls(entry) {
  if (!entry || window.SpellManagement?.isManual()) return [];
  const controls = [];
  const spec = getFreeSpellUseSpec(entry);
  if (spec) for (let index = 0; index < spec.count; index += 1) {
    const canonical = document.getElementById(getFreeSpellUseInputId(spec, index));
    if (canonical && !canonical.disabled) controls.push({ canonical, label: `${spec.label} ${index + 1}/${spec.count}`, title: spec.label });
  }
  if (isDruidLandSpellEntry(entry)) {
    const canonical = document.getElementById("druid-natural-recovery-used");
    if (canonical && !canonical.disabled) controls.push({ canonical,
      label: `自然恢復：${SpellCatalog.getSpell(entry.spellId)?.nameZh || "大地結社法術"}的免費施法次數已使用`, title: "自然恢復；長休恢復" });
  }
  return controls;
}

window.getSpellFreeUseControls = getSpellFreeUseControls;

const DEFAULT_SPELL_LIST_NOTE = "本頁僅提供 SRD 法術；部分 PHB 專屬內容未列入。";
const DUPLICATE_SPELL_LIST_NOTE = "法術列表存在重複，請冒險者留意！";

function hasDuplicateSelectedSpells() {
  const seen = new Set();
  return (window.SpellManagement?.getEntries({ availableOnly: true }) || []).some(entry => {
    if (seen.has(entry.spellId)) return true;
    seen.add(entry.spellId);
    return false;
  });
}

function updateSpellListStatusNote() {
  const note = document.getElementById("spell-list-status-note");
  if (!note) return;
  const hasDuplicates = hasDuplicateSelectedSpells();
  const nextText = hasDuplicates ? DUPLICATE_SPELL_LIST_NOTE : DEFAULT_SPELL_LIST_NOTE;
  if (note.textContent !== nextText) note.textContent = nextText;
  note.classList.toggle("spell-note-muted--warning", hasDuplicates);
}

document.getElementById("spell-prepare")?.addEventListener("click", event => window.Spellbook?.openPreparedManager(event.currentTarget));

function updatePreparedSpellCounts() {
  const summary = document.getElementById("spell-prepared-summary");
  const button = document.getElementById("spell-prepare");
  const complete = hasCompletePrimaryCharacterSelections();
  if (summary) summary.hidden = false;
  if (button) button.disabled = !complete;
  const requirements = document.getElementById("spell-prepared-requirements");
  if (requirements) requirements.hidden = complete;
  const status = document.getElementById("spell-prepared-status");
  if (status) { status.hidden = true; status.textContent = ""; }
  const manual = window.SpellManagement?.isManual() === true;
  const classValue = document.getElementById("class")?.value || "";
  const label = document.getElementById("class").selectedOptions[0]?.textContent.trim() || classValue;
  const currentList = document.getElementById("spell-current-list");
  if (currentList) currentList.textContent = manual ? "法術清單：手動管理" : classValue ? `法術清單：${label}` : "法術清單：請先選擇職業";
  const empty = document.getElementById("spell-prepared-empty");
  if (empty) {
    const entries = window.SpellManagement?.getSheetEntries() || [];
    const limits = window.SpellManagement?.getLimits();
    empty.hidden = !complete || entries.length > 0 || (!manual && !limits?.cantrips && !limits?.prepared);
    empty.textContent = manual ? "手動管理清單尚無法術，請使用『準備法術』加入。" : "尚未準備此職業的法術，請使用『準備法術』加入。";
  }
  if (manual) return;
  const level = Number(document.getElementById("level")?.value) || 0;
  const limit = window.getPreparedSpellLimit(classValue, level);
  const players = window.SpellManagement?.getPlayerEntries() || [];
  const entries = players.filter(entry => window.SpellManagement.isEntryAvailable(entry));
  const { prepared = 0, cantrips = 0 } = window.SpellManagement?.getPreparationCounts() || {};
  const cantripLimit = window.SpellManagement?.getLimits().cantrips;
  const sourceIds = new Set((window.SpellManagement?.getSourceEntries() || []).map(entry => entry.spellId));
  const unavailable = players.filter(entry => !sourceIds.has(entry.spellId) && !window.SpellManagement.isEntryAvailable(entry)).length;
  const warnings = [];
  if (limit !== null && prepared > limit) warnings.push(`已準備 ${prepared}／${limit}，超出 ${prepared - limit} 個。`);
  if (Number.isFinite(cantripLimit) && cantrips > cantripLimit) warnings.push(`戲法 ${cantrips}／${cantripLimit}，超出 ${cantrips - cantripLimit} 個。`);
  if (warnings.length) warnings.push("請在『準備法術』取消選取；回到上限內才能新增。");
  if (unavailable) warnings.push(`另保留 ${unavailable} 個目前不可用的選擇，恢復資格後即可使用；可在『準備法術』查看或取消。`);
  if (status && classValue && level && warnings.length) { status.textContent = warnings.join(" "); status.hidden = false; }
}


let pickedSpellLayoutFrame = 0;
function schedulePickedSpellLayout() {
  if (pickedSpellLayoutFrame) return;
  pickedSpellLayoutFrame = requestAnimationFrame(() => {
    pickedSpellLayoutFrame = 0;
    document.querySelectorAll("#spell-overview-management-wrap .spell-picked-content, .spell-prepared-source-options").forEach(list => {
      const width = list.getBoundingClientRect().width;
      const items = Array.from(list.querySelectorAll(".spell-picked-item"));
      if (!width || !items.length) return;
      const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
      // Measure complete names and source tags without wrapping, then fit every row.
      list.classList.add("is-measuring-spells");
      const widths = items.map(item => Math.ceil(item.getBoundingClientRect().width));
      list.classList.remove("is-measuring-spells");
      const unrestricted = list.id === "picked-cantrips" || list.classList.contains("spell-prepared-source-options");
      const limit = unrestricted ? items.length : window.matchMedia("(min-width: 720px)").matches ? 1 : 2;
      const maximum = Math.min(limit, items.length, Math.floor((width + gap) / (Math.min(...widths) + gap)));
      let columns = 1, tracks = "minmax(0, 1fr)";
      for (let count = maximum; count > 1; count -= 1) {
        const columnWidths = Array(count).fill(0);
        widths.forEach((itemWidth, index) => {
          columnWidths[index % count] = Math.max(columnWidths[index % count], itemWidth);
        });
        if (columnWidths.reduce((sum, itemWidth) => sum + itemWidth, 0) + gap * (count - 1) > width) continue;
        columns = count;
        tracks = columnWidths.map(itemWidth => `${itemWidth}px`).join(" ");
        break;
      }
      list.style.setProperty("--picked-spell-tracks", tracks);
      list.dataset.spellColumns = String(columns);
    });
  });
}
if (typeof ResizeObserver === "function") {
  const previousWidths = new WeakMap();
  const observer = new ResizeObserver(entries => {
    let changed = false;
    entries.forEach(entry => {
      const width = entry.contentRect.width;
      if (previousWidths.get(entry.target) !== width) {
        previousWidths.set(entry.target, width);
        changed = true;
      }
    });
    if (changed) schedulePickedSpellLayout();
  });
  document.querySelectorAll("#spell-overview-management-wrap .spell-picked-box").forEach(card => observer.observe(card));
}
new MutationObserver(schedulePickedSpellLayout).observe(document.documentElement, {
  attributes: true, attributeFilter: ["data-theme", "data-ui-theme"]
});
window.addEventListener("resize", schedulePickedSpellLayout);
document.fonts?.ready.then(schedulePickedSpellLayout);

const SPELL_OVERVIEW_DISCLOSURE_STATE_KEY = "dnd.spellOverviewDisclosure.v1";
function initSpellOverviewDisclosures() {
  let saved = {};
  try { saved = JSON.parse(window.dndStorage.getItem(SPELL_OVERVIEW_DISCLOSURE_STATE_KEY) || "{}"); } catch (_error) {}
  const cards = Array.from(document.querySelectorAll("[data-spell-disclosure]"));
  cards.forEach(card => {
    const toggle = card.querySelector(".spell-overview-toggle");
    const content = document.getElementById(toggle.getAttribute("aria-controls"));
    const setExpanded = expanded => {
      toggle.setAttribute("aria-expanded", String(expanded));
      content.hidden = !expanded;
      if (expanded) schedulePickedSpellLayout();
    };
    setExpanded(saved?.[card.dataset.spellDisclosure] !== false);
    toggle.addEventListener("click", () => {
      setExpanded(toggle.getAttribute("aria-expanded") !== "true");
      const state = Object.fromEntries(cards.map(item => [item.dataset.spellDisclosure,
        item.querySelector(".spell-overview-toggle").getAttribute("aria-expanded") === "true"]));
      window.dndStorage.setItem(SPELL_OVERVIEW_DISCLOSURE_STATE_KEY, JSON.stringify(state));
    });
  });
}
initSpellOverviewDisclosures();

function updatePickedSpellBoxes() {
  if (characterUpdateDepth) {
    pickedSpellsPending = true;
    return;
  }
  renderPickedSpellBoxes();
}

function renderPickedSpellBoxes() {
  const entries = window.SpellManagement?.getSheetEntries({ availableOnly: true }) || [];
  const checkedState = new Map(Array.from(document.querySelectorAll(".free-spell-use-check"), box => [box.id, box.checked]));
  SPELL_AREA_CONFIGS.forEach(({ level, pickedId }) => {
    const target = document.getElementById(pickedId);
    if (!target) return;
    const ring = level === "cantrips" ? 0 : Number(level);
    const spells = entries.filter(entry => entry.level === ring)
      .sort((a, b) => Number(Boolean(b.spellSource)) - Number(Boolean(a.spellSource)));
    const box = target.closest(".spell-picked-box");
    if (box && ring === 0) box.hidden = !spells.length;
    target.classList.toggle("spell-picked-content--empty", !spells.length);
    if (!spells.length) {
      target.textContent = ring === 0 ? "—" : "未準備此環法術";
      target.style.removeProperty("--picked-spell-tracks");
      target.dataset.spellColumns = "1";
      return;
    }
    target.innerHTML = spells.map(entry => {
      const spell = entry.customSpell ? window.TabletopCustomSpells.getSpell(entry.spellId) : SpellCatalog.getSpell(entry.spellId);
      const spec = getFreeSpellUseSpec(entry);
      if (spec) for (let index = 0; index < spec.count; index += 1) {
        const id = getFreeSpellUseInputId(spec, index);
        if (!checkedState.has(id)) checkedState.set(id, window.SpellManagement.getFreeUse(entry.sourceKey, index));
      }
      const sourceTag = getPickedSpellSourceTag(entry);
      return `<span class="spell-picked-item"><button type="button" class="spell-picked-jump" data-spell-read="${escapeHtml(entry.spellId)}">${escapeHtml(spell?.nameZh || `未知法術（${entry.spellId}）`)}</button>${sourceTag ? `<span class="spell-picked-source-tag">[${escapeHtml(sourceTag)}]</span>` : ""}${spec ? renderFreeSpellUseChecks(spec, checkedState) : ""}</span>`;
    }).join("\n");
    target.querySelectorAll(".free-spell-use-check").forEach(input => input.addEventListener("change", () => {
      const entry = spells.find(item => getFreeSpellUseSpec(item) && Array.from({ length: getFreeSpellUseSpec(item).count }, (_, i) => getFreeSpellUseInputId(getFreeSpellUseSpec(item), i)).includes(input.id));
      if (entry) {
        const spec = getFreeSpellUseSpec(entry);
        const index = Array.from({ length: spec.count }, (_, i) => getFreeSpellUseInputId(spec, i)).indexOf(input.id);
        window.SpellManagement.setFreeUse(entry.sourceKey, index, input.checked);
      }
    }));
    setupAutoSave(target);
  });
  updatePreparedSpellCounts();
  updateSpellOverviewManagementVisibility();
  updateSpellListStatusNote();
  const preparedIds = new Set(entries.map(entry => entry.spellId));
  ["classFeatures", "eldritch-invocations-output", "feats-area", "character-features", "class-feature-choices-modal"]
    .forEach(id => { const root = document.getElementById(id); if (root) markPreparedSpellOptions(root, preparedIds); });
  schedulePickedSpellLayout();
  window.Spellbook?.render();
  if (typeof populateHandAttacks === "function") populateHandAttacks();
}

function getFixedTabOffsetPadding() {
  const mobile = window.matchMedia("(max-width: 768px)").matches;
  return mobile ? 12 : 8;
}

document.getElementById("spell-overview-management-wrap")?.addEventListener("click", event => {
  const trigger = event.target.closest?.("[data-spell-read]");
  if (trigger) window.Spellbook?.openReadOnly(trigger.dataset.spellRead, trigger);
});

// 法術列表供所有來源使用；只有法術位列依職業與等級調整。
function hasCompletePrimaryCharacterSelections() {
  return ["class", "level", "background", "race"].every(id => Boolean(document.getElementById(id)?.value));
}

function updateSpellOverviewManagementVisibility() {
  const overview = document.getElementById("spell-overview-management-wrap");
  const slotManagement = document.getElementById("spell-slot-management-wrap");
  const grid = document.getElementById("spell-picked-grid-wrap");
  if (!overview) return;
  const entries = window.SpellManagement?.getSheetEntries({ availableOnly: true }) || [];
  const slots = hasCompletePrimaryCharacterSelections()
    ? getSpellSlotCounts(document.getElementById("class")?.value || "", Number(document.getElementById("level")?.value) || 0) : [];
  SPELL_RING_CONFIGS.forEach(({ ring, pickedId }) => {
    const card = document.getElementById(pickedId)?.closest(".spell-picked-box");
    if (card) card.hidden = !slots[ring - 1] && !entries.some(entry => entry.level === ring);
  });
  const hasVisibleRings = Boolean(grid?.querySelector(".spell-picked-box:not([hidden])"));
  if (grid) grid.hidden = !hasVisibleRings;
  const hasNoSlotsMessage = document.getElementById("no-spell-slots-message")?.classList.contains("is-hidden") === false;
  slotManagement?.classList.toggle("is-hidden", !hasVisibleRings && !hasNoSlotsMessage);
  overview.classList.remove("is-hidden");
}

let previousSpellSlotClass = null;
let previousSpellSlotLevel = null;

function resetSpellSlotsAfterCharacterChange() {
  const classValue = document.getElementById("class")?.value || "";
  const level = document.getElementById("level")?.value || "";
  const changed = previousSpellSlotClass !== null && (classValue !== previousSpellSlotClass || level !== previousSpellSlotLevel);
  previousSpellSlotClass = classValue;
  previousSpellSlotLevel = level;
  if (!changed || autosaveSuspended) return;
  document.querySelectorAll("#spell-slot-management-wrap input[type='checkbox']:not(.spell-slot-placeholder)").forEach(box => { box.checked = false; });
}

function updateSpellSlotRows(slotCounts) {
  SPELL_RING_CONFIGS.forEach(({ ring, slotRowId }) => {
    const row = document.getElementById(slotRowId);
    if (!row) return;
    const count = slotCounts[ring - 1] || 0;
    row.style.display = count > 0 ? "" : "none";
    row.classList.toggle("is-hidden", !hasCompletePrimaryCharacterSelections());
    const boxes = Array.from(row.querySelectorAll("input[type='checkbox']:not(.spell-slot-placeholder)"));
    boxes.forEach((box, index) => {
      const visible = index < count;
      box.style.display = visible ? "" : "none";
      box.disabled = !visible;
      box.setAttribute("aria-label", `${["一", "二", "三", "四"][ring - 1]}環法術位 ${index + 1} 已消耗`);
      if (!visible) box.checked = false;
    });
    row.querySelectorAll(".spell-slot-placeholder").forEach(box => { box.style.display = "none"; });
  });
}

function updateSpellsByClassLevel() {
  if (characterUpdateDepth) {
    spellDisplayPending = true;
    return;
  }
  const cls = document.getElementById("class")?.value || "";
  const lvl = document.getElementById("level")?.value || "";
  const complete = hasCompletePrimaryCharacterSelections();
  const canCast = hasSpellcastingCapability();
  const level = Number.parseInt(lvl || "0", 10) || 0;
  const slotCounts = getSpellSlotCounts(cls, level);
  const hasSlots = slotCounts.some(Boolean);

  const noSlotsMessage = document.getElementById("no-spell-slots-message");
  if (noSlotsMessage) noSlotsMessage.classList.toggle("is-hidden", !complete || hasSlots || !canCast);
  updateSpellOverviewManagementVisibility();
  updateSpellSlotRows(slotCounts);
  updatePreparedSpellCounts();
  window.SpellManagement?.refreshVisibility();
}


// 法術描述的「- 」行（前置空白代表巢狀層級）轉為項目清單，其餘文字原樣交給 appendText。
function appendSpellDescContent(container, raw, appendText = (target, text) => target.append(text)) {
  const lists = [];
  let textLines = [];
  const flushText = () => {
    while (textLines.length && !textLines[0].trim()) textLines.shift();
    while (textLines.length && !textLines[textLines.length - 1].trim()) textLines.pop();
    if (textLines.length) appendText(container, textLines.join("\n"));
    textLines = [];
  };

  String(raw ?? "").split(/\r?\n/).forEach(line => {
    const item = line.match(/^([ \t]*)-[ \t]+(.*)$/);
    if (!item) {
      lists.length = 0;
      textLines.push(line);
      return;
    }
    flushText();
    const indent = item[1].replace(/\t/g, "  ").length;
    while (lists.length && lists[lists.length - 1].indent > indent) lists.pop();
    if (!lists.length || lists[lists.length - 1].indent < indent) {
      const list = document.createElement("ul");
      list.className = "spell-desc-list";
      (lists[lists.length - 1]?.list.lastElementChild || container).appendChild(list);
      lists.push({ indent, list });
    }
    const li = document.createElement("li");
    appendText(li, item[2]);
    lists[lists.length - 1].list.appendChild(li);
  });
  flushText();
  return container;
}

function renderSpellDescHtml(raw) {
  const text = String(raw ?? "—");
  const withBeastTips = text.includes("召喚一隻魔寵");
  const container = document.createElement("div");
  appendSpellDescContent(container, text, (target, segment) => {
    target.insertAdjacentHTML("beforeend", renderSpellDescInlineHtml(segment, withBeastTips));
  });
  return container.innerHTML;
}

function renderSpellDescInlineHtml(segment, withBeastTips) {
  const desc = withBeastTips ? addFamiliarBeastTips(segment) : segment;
  const tipRe = /<span class="beast-tip" data-beast="([a-z0-9_]+)">([^<]+)<\/span>/g;
  let last = 0;
  const parts = [];
  let m;

  while ((m = tipRe.exec(desc)) !== null) {
    const [full, key, label] = m;
    parts.push(escapeHtml(desc.slice(last, m.index)));

    if (Object.prototype.hasOwnProperty.call(BEAST_STATS, key)) {
      parts.push(`<span class="beast-tip" data-beast="${escapeHtml(key)}">${escapeHtml(label)}</span>`);
    } else {
      parts.push(escapeHtml(full));
    }

    last = m.index + full.length;
  }

  parts.push(escapeHtml(desc.slice(last)));
  return parts.join("").replaceAll("\n", "<br>");
}

function addFamiliarBeastTips(desc) {
  const familiarBeasts = [
    ["蝙蝠", "bat"],
    ["貓", "cat"],
    ["青蛙", "frog"],
    ["獵鷹", "hawk"],
    ["蜥蜴", "lizard"],
    ["章魚", "octopus"],
    ["貓頭鷹", "owl"],
    ["老鼠", "rat"],
    ["渡鴉", "raven"],
    ["蜘蛛", "spider"],
    ["鼬", "weasel"]
  ];

  const beastMap = new Map(familiarBeasts);
  const pattern = new RegExp(
    familiarBeasts
      .map(([label]) => escapeRegExp(label))
      .sort((a, b) => b.length - a.length)
      .join("|"),
    "g"
  );

  return desc.replace(pattern, (label) => {
    const key = beastMap.get(label);
    return key
      ? `<span class="beast-tip" data-beast="${key}">${label}</span>`
      : label;
  });
}

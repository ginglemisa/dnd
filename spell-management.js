(function attachSpellManagement(globalScope) {
  "use strict";

  let manual = false;
  let switching = false;
  let rebuilding = false;
  let reconciling = false;
  const configs = () => globalScope.getSpellAreaConfigs();
  const spellSelect = row => row.querySelector("select[id*='-spell-']");
  const classSelect = row => row.querySelector("select[id*='-class-']");
  const areaRows = id => Array.from(document.querySelectorAll(`#${id} .spell-entry`));
  const ringOf = row => configs().find(area => area.id === row.parentElement?.id)?.level;
  const classLabel = value => Array.from(document.getElementById("class")?.options || []).find(option => option.value === value)?.textContent || value;

  function captureRows() {
    return configs().map(({ id }) => ({ id, rows: areaRows(id).map(row => {
      const item = globalScope.captureSpellRowState(row);
      if (row.dataset.spellSource) {
        const classes = globalScope.SpellCatalog.getClassIds(item.spellValue);
        if (!classes.includes(item.classValue)) item.classValue = row.dataset.spellClass || classes[0] || "";
      }
      return { classValue: item.classValue, spellValue: item.spellValue };
    }) }));
  }

  // Current resource controls stay canonical while the manual list is editable.
  function sourceUses() {
    let area = document.getElementById("spell-source-use-state");
    if (!area) {
      area = document.createElement("div");
      area.id = "spell-source-use-state";
      area.hidden = true;
      document.getElementById("tab-spells").appendChild(area);
    }
    return area;
  }

  function collectClassFeatureCantrips() {
    const choices = Array.from(sourceUses().querySelectorAll("[data-class-cantrip-key]"))
      .map(input => [input.dataset.classCantripKey, input.value]);
    document.querySelectorAll('.spell-entry[data-spell-source="class"]').forEach(row => {
      if (row.dataset.sourceKey?.includes("-warrior-cantrip-")) choices.push([row.dataset.sourceKey, spellSelect(row)?.value || ""]);
    });
    return Object.fromEntries(choices);
  }

  function keepClassFeatureCantrips(choices) {
    const area = sourceUses();
    area.querySelectorAll("[data-class-cantrip-key]").forEach(input => input.remove());
    Object.entries(choices || {}).forEach(([key, value]) => {
      if (!/^class-(?:paladin-blessed|ranger-druidic)-warrior-cantrip-[12]$/.test(key) || typeof value !== "string") return;
      const input = document.createElement("input");
      input.type = "hidden";
      input.dataset.classCantripKey = key;
      input.dataset.stateTransient = "true";
      input.value = value;
      area.appendChild(input);
    });
  }

  function option(value, label) {
    const element = document.createElement("option");
    element.value = value;
    element.textContent = label;
    return element;
  }

  function setOptions(select, entries, selected) {
    const signature = JSON.stringify(entries);
    if (select.dataset.spellOptions !== signature) {
      select.replaceChildren(...entries.map(([value, label]) => option(value, label)));
      select.dataset.spellOptions = signature;
    }
    select.value = selected;
  }

  function reasonFor(row, spellId = spellSelect(row)?.value || "") {
    if (!spellId) return "";
    const spell = globalScope.SpellCatalog.getSpell(spellId);
    if (!spell) return "找不到此法術的資料，保留原法術編號供查看與刪除。";
    const ring = ringOf(row);
    if (spell.level !== (ring === "cantrips" ? 0 : Number(ring))) return "法術環階與此列不符。";
    if (manual || row.dataset.spellSource) return "";
    if (row.dataset.retainedSourceKey) return `${row.dataset.retainedSourceLabel || "原取得來源"}目前不適用。`;
    const cls = document.getElementById("class")?.value || "";
    if (!globalScope.SpellCatalog.getClassIds(spellId).includes(cls)) return "目前職業法表不包含此法術。";
    if (!globalScope.classCanAccessSpellLevel(cls, Number(document.getElementById("level")?.value), spell.level)) return `目前等級尚未開放${globalScope.getSpellLevelLabel(ring)}。`;
    return "";
  }

  function setRowState(row, state = globalScope.captureSpellRowState(row)) {
    if (row.dataset.spellSource) return;
    const ring = ringOf(row);
    const spellId = state.spellValue || "";
    const reason = reasonFor(row, spellId);
    let selectedClass = state.classValue || "";
    if (!manual && !reason) selectedClass = globalScope.getAvailableSpellSourceClasses(ring)[0]?.value || "";
    const classEntries = [["", "--職業--"], ...globalScope.getAvailableSpellSourceClasses(ring).map(item => [item.value, item.text])];
    if (selectedClass && !classEntries.some(([value]) => value === selectedClass)) classEntries.push([selectedClass, classLabel(selectedClass)]);
    setOptions(classSelect(row), classEntries, selectedClass);
    const spells = globalScope.getClassSpells(selectedClass, ring);
    const spellEntries = [["", "--法術--"], ...spells.map(spell => [spell.spellId, globalScope.SpellCatalog.getDisplayName(spell.spellId)])];
    if (spellId && !spellEntries.some(([value]) => value === spellId)) spellEntries.push([spellId, globalScope.SpellCatalog.getDisplayName(spellId) || `未知法術（${spellId}）`]);
    setOptions(spellSelect(row), spellEntries, spellId);
    classSelect(row).disabled = !manual;
    spellSelect(row).disabled = !manual && Boolean(reason);
    row.classList.toggle("spell-entry--unavailable", Boolean(reason));
    row.dataset.spellUnavailable = String(Boolean(reason));
    const desc = row.querySelector(":scope > .output");
    const description = globalScope.SpellCatalog.getSpell(spellId)?.desc || (spellId ? `找不到法術資料：${spellId}` : "—");
    if (desc && desc.dataset.spellDescription !== description) {
      desc.innerHTML = globalScope.renderSpellDescHtml(description);
      desc.dataset.spellDescription = description;
    }
    let notice = row.querySelector(".spell-row-availability");
    if (reason && !notice) {
      notice = document.createElement("p");
      notice.className = "spell-row-availability spell-note-muted";
      row.appendChild(notice);
    }
    if (notice) {
      notice.hidden = !reason;
      notice.textContent = `已保存但目前不可用：${reason}不列入準備或跑團施法。`;
    }
  }

  function rebuildRows(areas) {
    rebuilding = true;
    try {
      configs().forEach(({ id, level }) => {
        document.getElementById(id).replaceChildren();
        const rows = areas.find(area => area.id === id)?.rows || [];
        rows.forEach(item => globalScope.createSingleSpellRow(id, level, null, item));
        if (!rows.length) globalScope.createSingleSpellRow(id, level);
        globalScope.refreshSpellRows(id);
      });
    } finally { rebuilding = false; }
  }

  // Migrate previously saved automatic-source remnants without removing player selections.
  function reconcileSourceRows() {
    if (manual || rebuilding || reconciling) return;
    reconciling = true;
    try {
      configs().forEach(({ id, level }) => {
        const oldSources = areaRows(id).filter(row => row.dataset.retainedSourceKey);
        if (!oldSources.length) return;
        oldSources.forEach(row => row.remove());
        if (!globalScope.getSpellRowsForState(id).length) globalScope.createSingleSpellRow(id, level);
        globalScope.refreshSpellRows(id);
      });
    } finally { reconciling = false; }
  }

  function restoreRetainedRows(value) {
    if (manual || !Array.isArray(value)) return;
    value.forEach(item => {
      if (!configs().some(area => area.id === item?.areaId) || !Number.isInteger(item.index) || typeof item.key !== "string") return;
      const row = globalScope.getSpellRowsForState(item.areaId)[item.index];
      if (!row) return;
      row.dataset.retainedSourceKey = item.key;
      row.dataset.retainedSourceLabel = typeof item.label === "string" ? item.label : "";
    });
  }

  function isRowAvailable(row) {
    return Boolean(row) && !reasonFor(row);
  }

  function refreshVisibility() {
    const cls = document.getElementById("class")?.value || "";
    const level = Number(document.getElementById("level")?.value);
    configs().forEach(({ id, level: ring }) => {
      const area = document.getElementById(id);
      const rows = areaRows(id);
      rows.forEach(row => setRowState(row));
      const classAccess = globalScope.classCanAccessSpellLevel(cls, level, ring === "cantrips" ? 0 : ring);
      const sourceAccess = rows.some(row => row.dataset.spellSource);
      const hasSaved = rows.some(row => Boolean(spellSelect(row)?.value));
      const section = area?.closest("details.spell-level-section");
      if (section) section.hidden = !manual && !classAccess && !sourceAccess && !hasSaved;
      rows.forEach(row => { row.hidden = !manual && !classAccess && !row.dataset.spellSource && !spellSelect(row)?.value; });
      globalScope.updateSpellControlStates(id);
    });
    globalScope.updateGlobalSpellSequenceNumbers();
  }

  function beforeApplyState(data) {
    manual = data["manual-spell-management"] === true;
    document.getElementById("manual-spell-management").checked = manual;
    const uses = sourceUses();
    uses.replaceChildren();
    if (manual) {
      const choices = { ...data.__classFeatureCantrips };
      // Earlier manual saves recorded these ability choices as source-marked rows.
      if (Array.isArray(data.__retainedSpells)) data.__retainedSpells.forEach(item => {
        if (item?.areaId !== "cantrips-area" || !Number.isInteger(item.index) || Object.hasOwn(choices, item.key)) return;
        if (!/^class-(?:paladin-blessed|ranger-druidic)-warrior-cantrip-[12]$/.test(item.key)) return;
        choices[item.key] = data[`cantrips-area-spell-${item.index}`] || "";
      });
      keepClassFeatureCantrips(choices);
    }
    if (manual) Object.entries(data).forEach(([id, checked]) => {
      if (!/^free-spell-use-[a-z0-9_-]+-\d+$/i.test(id)) return;
      const input = document.createElement("input");
      input.type = "checkbox";
      input.id = id;
      input.className = "free-spell-use-check";
      input.checked = checked === true;
      uses.appendChild(input);
    });
    rebuildRows([]);
    if (!globalScope.SHARE_MODE) globalScope.dndStorage.removeItem("dnd.spellManagementBackup.v1");
  }

  async function toggle(event) {
    const input = event.currentTarget;
    if (switching) { input.checked = manual; return; }
    const next = input.checked;
    input.checked = manual;
    switching = true;
    try {
      const confirmed = await globalScope.AppDialog.requestDecision(next ? {
        title: "啟用手動法術管理",
        message: "沿用目前的法術選項，將所有來源列改為可編輯清單，停止來源自動同步，並開放所有法表與法術書。切回自動管理時，全部戲法、一至四環準備清單與法術書將清除，且無法還原。",
        confirmLabel: "啟用手動管理", cancelLabel: "取消", trigger: input
      } : {
        title: "清除手動法術並恢復自動管理？",
        message: "目前的全部戲法、一至四環準備清單與法術書將清除，且無法還原。系統會依目前角色選項重新帶入來源法術，其餘準備法術與法師法術書需重新選擇。角色能力中的來源選項、法術位消耗、施法屬性及筆記會保留。",
        confirmLabel: "清除全部法術並恢復自動管理", cancelLabel: "繼續手動管理", intent: "danger", trigger: input
      });
      if (!confirmed) return;
      const areas = next ? captureRows() : [];
      const classCantrips = collectClassFeatureCantrips();
      const uses = sourceUses();
      document.querySelectorAll(".free-spell-use-check").forEach(box => uses.appendChild(box));
      manual = next;
      input.checked = next;
      globalScope.restoreDeletedSpellRowCache({});
      if (next) keepClassFeatureCantrips(classCantrips);
      else globalScope.Spellbook.setState({ spellIds: [] }, { sync: false });
      rebuildRows(areas);
      if (!next) {
        globalScope.syncMagicInitiateDerivedSpellRows();
        globalScope.syncOriginAndSubclassDerivedSpellRows();
        globalScope.applyClassFeatureCantrips(classCantrips);
      }
      globalScope.updateSpellCastingStatsVisibility();
      globalScope.updateSpellsByClassLevel();
      globalScope.updatePickedSpellBoxes();
      if (!next) uses.replaceChildren();
      globalScope.Spellbook.render();
      globalScope.TabletopSpells?.refresh();
      globalScope.saveAllFields();
    } finally { switching = false; input.checked = manual; }
  }

  globalScope.SpellManagement = Object.freeze({ isManual: () => manual, refreshVisibility, isRowAvailable, beforeApplyState,
    setRowState, reconcileSourceRows, restoreRetainedRows, collectClassFeatureCantrips });
  document.addEventListener("DOMContentLoaded", () => {
    if (!globalScope.SHARE_MODE) globalScope.dndStorage.removeItem("dnd.spellManagementBackup.v1");
    document.getElementById("manual-spell-management")?.addEventListener("change", toggle);
    refreshVisibility();
  });
})(window);

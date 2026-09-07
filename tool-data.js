(() => {
  "use strict";

  const artisanTools = Object.freeze([
    "煉金師工具", "釀酒師工具", "書法工具", "木匠工具", "制圖師工具", "鞋匠工具",
    "廚師工具", "玻璃匠工具", "珠寶匠工具", "皮匠工具", "石匠工具", "畫家工具",
    "陶匠工具", "鐵匠工具", "修補匠工具", "裁縫工具", "木雕師工具"
  ]);
  const otherTools = Object.freeze([
    "易容工具", "文書偽造工具", "草藥工具", "領航員工具", "制毒師工具", "盜賊工具"
  ]);
  const instruments = Object.freeze([
    "風笛", "鼓", "揚琴", "長笛", "角號", "魯特琴", "里拉琴", "排簫", "蘆笛", "提琴"
  ]);
  const gamingSets = Object.freeze(["骰子", "龍棋", "紙牌", "三龍牌"]);
  const groups = Object.freeze([
    Object.freeze({ id: "artisan", label: "工匠工具", options: artisanTools }),
    Object.freeze({ id: "other", label: "其他工具", options: otherTools }),
    Object.freeze({ id: "instrument", label: "樂器", options: instruments }),
    Object.freeze({ id: "gaming", label: "賭具", options: gamingSets })
  ]);
  const allTools = Object.freeze(groups.flatMap(group => group.options));
  const allToolSet = new Set(allTools);

  globalThis.ToolProficiencyCatalog = Object.freeze({
    artisanTools,
    otherTools,
    instruments,
    gamingSets,
    groups,
    allTools,
    isTool(value) {
      return allToolSet.has(value);
    }
  });

  if (typeof document === "undefined") return;

  const ROGUE_TOOL = "盜賊工具";
  let syncScheduled = false;

  function syncRogueToolProficiency() {
    const list = document.getElementById("tool-proficiency-list");
    if (!list) return;

    let fixedRow = list.querySelector(':scope > .tool-proficiency-row[data-fixed-class-tool="rogue"]');
    const isRogue = document.getElementById("class")?.value === "rogue";
    const alreadyPresent = Array.from(list.querySelectorAll(":scope > .tool-proficiency-row"))
      .some(row => row !== fixedRow && row.querySelector("select")?.value === ROGUE_TOOL);

    if (!isRogue || alreadyPresent) {
      fixedRow?.remove();
      globalThis.syncToolProficiencyOptions?.();
      return;
    }

    if (!fixedRow) {
      fixedRow = document.createElement("div");
      fixedRow.className = "tool-proficiency-row tool-proficiency-row--derived";
      fixedRow.dataset.toolSource = "class";
      fixedRow.dataset.toolSlot = "固定";
      fixedRow.dataset.fixedClassTool = "rogue";
      fixedRow.innerHTML = `<label></label><div class="tool-proficiency-control"><select class="tool-proficiency-select" disabled><option value="${ROGUE_TOOL}">${ROGUE_TOOL}</option></select></div>`;
      const firstManualExtra = Array.from(list.children).find(row =>
        !row.dataset.toolSource && row.querySelector("select")?.id !== "tool-proficiency-0"
      ) || null;
      list.insertBefore(fixedRow, firstManualExtra);
    }

    const select = fixedRow.querySelector("select");
    const label = fixedRow.querySelector("label");
    select.id = "rogue-fixed-tool-proficiency";
    select.disabled = true;
    label.htmlFor = select.id;
    label.textContent = "職業工具熟練：";
    globalThis.syncToolProficiencyOptions?.();
  }

  function scheduleRogueToolSync() {
    if (syncScheduled) return;
    syncScheduled = true;
    queueMicrotask(() => {
      syncScheduled = false;
      syncRogueToolProficiency();
    });
  }

  const replaceToolProficiencies = globalThis.replaceToolProficiencies;
  if (typeof replaceToolProficiencies === "function") {
    globalThis.replaceToolProficiencies = function (values, options = {}) {
      const nextValues = document.getElementById("class")?.value === "rogue" && Array.isArray(values)
        ? values.filter(value => value !== ROGUE_TOOL)
        : values;
      const result = replaceToolProficiencies.call(this, nextValues, options);
      syncRogueToolProficiency();
      return result;
    };
  }

  document.addEventListener("change", event => {
    if (
      event.target?.id === "class"
      || event.target?.id === "background"
      || event.target?.classList?.contains("tool-proficiency-select")
    ) scheduleRogueToolSync();
  });

  const list = document.getElementById("tool-proficiency-list");
  if (list && typeof MutationObserver === "function") {
    new MutationObserver(scheduleRogueToolSync).observe(list, { childList: true });
  }
  document.addEventListener("DOMContentLoaded", scheduleRogueToolSync, { once: true });
})();

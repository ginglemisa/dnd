(() => {
  "use strict";

  const artisanTools = Object.freeze([
    "煉金師工具", "釀酒師工具", "書法工具", "木匠工具", "製圖師工具", "鞋匠工具",
    "廚師工具", "玻璃匠工具", "珠寶匠工具", "皮匠工具", "石匠工具", "畫家工具",
    "陶匠工具", "鐵匠工具", "修補匠工具", "裁縫工具", "木雕師工具"
  ]);
  const otherTools = Object.freeze([
    "易容工具", "文書偽造工具", "草藥工具", "領航員工具", "製毒師工具", "盜賊工具"
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

  // 職業創角規則見 class-features.js；選項沿用同一份工具目錄。
  const classProficiencies = Object.freeze({
    bard: Object.freeze({ count: 3, options: instruments, idPrefix: "bard-instrument-" }),
    monk: Object.freeze({ count: 1, options: Object.freeze([...artisanTools, ...instruments]), idPrefix: "monk-tool-proficiency-" }),
    druid: Object.freeze({ count: 1, fixedTool: "草藥工具", idPrefix: "druid-fixed-tool-proficiency" }),
    rogue: Object.freeze({ count: 1, fixedTool: "盜賊工具", idPrefix: "rogue-fixed-tool-proficiency" })
  });

  globalThis.ToolProficiencyCatalog = Object.freeze({
    classProficiencies,
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

})();

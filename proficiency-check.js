/**
 * 技能／工具熟練與專精的缺項檢查（defer 載入；只在被呼叫時讀取其他模組與頁面）。
 *
 * - 只做提醒：讀技能頁的熟練／專精勾選框與工具列，不寫存檔、不改任何欄位，也沒有自己的狀態。
 *   呼叫端一律寫成 window.ProficiencyCheck?.getIssues()，拿掉這個檔案（index.html 的 script 標籤）時
 *   職業缺項提醒與 PDF 匯出前檢查會退回原本的「技能熟練未滿 4 項」「專精總數」「吟遊詩人樂器」三條。
 * - 來源一律讀內容檔的規則：背景 skills／tool、職業 skills 與 proficiencies.tools、職業與子職能力 picks 的
 *   skill／expertise、種族特質的 skillChoice、專長的 skillChoice。不從顯示文字反推。
 * - 技能分不出是哪個來源給的，所以用配對：每個來源拆成名額，已勾的技能分配進名額，配不到技能的名額就是缺項。
 *   先填限制嚴的名額（背景固定項 → 清單短的 → 任選 → 技能或工具都可以），缺口因此落在範圍最寬的來源上；
 *   再怎麼勾都填不了的名額（清單內的技能全被別的名額用掉）不算缺。
 * - 算法是二分圖最大匹配（技能對名額，增廣路徑法）。名額全部由內容檔的規則依等級產生，這裡沒有寫死等級或職業：
 *   提高等級上限、加職業或專長時不用改這個檔案，只要內容檔的 picks／skillChoice 寫對。
 *   要改這個檔案的情況：出現新的「來源種類」（在 analyze() 加一段 addSlots，並在 GROUP_ORDER、sourceLabel 補上），
 *   或名額之間有互相限制的規則（選了甲就不能選乙，配對解不了，要換做法）。
 *   「熟練或專精擇一」的專長每個要試兩種算法，最多試 4 個（16 種），超過的當成熟練名額。
 * - 多勾（getExtraIssues）：配不到名額的技能或專精。只算技能、不算工具；只列在角色卡的提醒，不進匯出前檢查。
 */
(function attachProficiencyCheck(globalScope) {
  "use strict";

  const TOOL_PREFIX = "tool:";
  const SKILL_TARGET = Object.freeze({ tab: "skills", selector: "#skill-bonus-section" });
  const GROUP_ORDER = Object.freeze(["background", "classSkills", "feature", "race", "feat", "eitherFeat", "expertise"]);
  const MAX_LISTED_OPTIONS = 4;
  const TOOL_TARGET = Object.freeze({ tab: "skills", selector: "#tool-proficiency-list" });

  const isToolItem = item => item.startsWith(TOOL_PREFIX);
  // 名額收不收這個項目：skills 為 null 表示任何技能；工具只有 orTool 的名額收。
  const accepts = (slot, item) => isToolItem(item) ? slot.orTool === true : slot.skills === null || slot.skills.has(item);
  // 填名額的先後：可選範圍小的先填，技能或工具都收的最後。
  const slotBreadth = slot => slot.orTool ? Infinity : slot.skills === null ? 1000 : slot.skills.size;

  // 增廣路徑：替名額找一個項目，必要時把已配對的項目讓給別的名額。
  function assign(index, slots, items, owner, seen) {
    for (const item of items) {
      if (seen.has(item) || !accepts(slots[index], item)) continue;
      seen.add(item);
      if (!owner.has(item) || assign(owner.get(item), slots, items, owner, seen)) {
        owner.set(item, index);
        return true;
      }
    }
    return false;
  }

  /**
   * current 是角色目前有的項目，universe 是全部可以有的項目（包含 current）。
   * 回傳 filled（目前已填的名額）與 missing（還沒填、補勾就能填的名額），都是 slots 的索引。
   */
  function solve(slots, current, universe) {
    const order = slots.map((slot, index) => index).sort((a, b) => slotBreadth(slots[a]) - slotBreadth(slots[b]) || a - b);
    const owner = new Map();
    const filled = order.filter(index => assign(index, slots, current, owner, new Set()));
    const done = new Set(filled);
    const missing = order.filter(index => !done.has(index)).reverse().filter(index => assign(index, slots, universe, owner, new Set()));
    return { filled, missing };
  }

  /**
   * 多勾：配不到名額的項目。count 是多的數量；candidates 是「拿掉後配對數不變」的項目，
   * 剛好等於 count 時就是多的那幾項，比 count 多時表示分不出是哪幾項。
   * certain 是沒有任何名額收的項目，一定是多勾的。
   */
  function findExtras(slots, items) {
    const matched = list => solve(slots, list, list).filled.length;
    const size = matched(items);
    const count = items.length - size;
    return {
      count,
      candidates: count ? items.filter(item => matched(items.filter(other => other !== item)) === size) : [],
      certain: items.filter(item => !slots.some(slot => accepts(slot, item)))
    };
  }

  const toSkillSet = from => Array.isArray(from) ? new Set(from) : null;

  function readSkills(doc) {
    const all = [];
    const proficient = [];
    const expertise = [];
    doc.querySelectorAll('#tab-skills .skill-grid input[id^="prof-"][data-skill-rank]').forEach(input => {
      const skill = input.dataset.skillRank;
      const expert = doc.getElementById(`exp-${skill}`)?.checked === true;
      all.push(skill);
      if (input.checked || expert) proficient.push(skill);
      if (expert) expertise.push(skill);
    });
    return { all, proficient, expertise };
  }

  // 工具列：第一列是背景，data-tool-source 的是職業，其餘是玩家自己新增的。
  function readToolRows(doc) {
    const rows = Array.from(doc.querySelectorAll("#tool-proficiency-list > .tool-proficiency-row"));
    const selectOf = row => row.querySelector("select");
    const manual = rows.filter(row => !row.dataset.toolSource);
    return {
      classSelects: rows.filter(row => row.dataset.toolSource === "class" && !row.dataset.fixedClassTool).map(selectOf).filter(Boolean),
      extraTools: manual.slice(1).map(row => selectOf(row)?.value || "").filter(Boolean)
    };
  }

  function getUsableFeatIds() {
    if (typeof globalScope.getFeatUsageEntries !== "function") return [];
    return globalScope.getFeatUsageEntries().filter(entry => entry.value && entry.usable).map(entry => entry.value);
  }

  /** 缺項（issues）與多勾（extras）；背景、職業、等級還沒選好（或規則資料沒載入）時回傳 null，表示這項檢查不適用。 */
  function analyze() {
    const doc = globalScope.document;
    const value = id => (doc.getElementById(id)?.value || "").trim();
    const className = value("class");
    const level = Number.parseInt(value("level"), 10);
    const classRules = globalScope.getClassRules?.(className);
    const backgroundRules = globalScope.getBackgroundRules?.(value("background"));
    if (!classRules || !backgroundRules || !Number.isInteger(level) || level < 1 || typeof globalScope.getClassPicks !== "function") return null;

    const skills = readSkills(doc);
    if (!skills.all.length) return null;
    const tools = readToolRows(doc);
    const skillSlots = [];
    const expertiseSlots = [];
    // 「已熟練就改成專精」的專長（尋物好手）：熟練名額與專精名額擇一，兩種都算，取缺得少的。
    const eitherFeats = [];
    const addSlots = (list, group, count, slot) => {
      for (let i = 0; i < count; i += 1) list.push({ ...slot, group });
    };

    (backgroundRules.skills || []).forEach(skill => addSlots(skillSlots, { kind: "background", skill }, 1, { skills: new Set([skill]) }));

    const classSkills = classRules.skills;
    if (classSkills?.choose) addSlots(skillSlots, { kind: "classSkills" }, classSkills.choose, { skills: toSkillSet(classSkills.from) });
    globalScope.getClassPicks(className, level, { kind: "skill" }).forEach(({ feature, pick, count }) => {
      addSlots(skillSlots, { kind: "feature", name: feature.name }, count, { skills: toSkillSet(pick.from === "class" ? classSkills?.from : pick.from) });
    });
    const expertiseGroup = { kind: "expertise" };
    globalScope.getClassPicks(className, level, { kind: "expertise" }).forEach(({ pick, count }) => {
      addSlots(expertiseSlots, expertiseGroup, count, { skills: toSkillSet(pick.from) });
    });

    const raceRules = globalScope.getRaceRules?.(value("race"));
    (raceRules?.traits || []).filter(trait => trait.skillChoice && (trait.level || 1) <= level).forEach(trait => {
      addSlots(skillSlots, { kind: "race", name: `${raceRules.name}${trait.name}` }, 1, { skills: toSkillSet(trait.skillChoice) });
    });

    const featGroups = new Map();
    getUsableFeatIds().forEach(featId => {
      const choice = globalScope.getFeatRules?.(featId)?.skillChoice;
      if (!choice) return;
      if (choice.expertiseIfProficient) {
        eitherFeats.push({ group: { kind: "eitherFeat", name: featId }, skills: new Set(choice.from) });
        return;
      }
      // 同一個專長拿了好幾次（熟習）合成一條提醒。
      if (!featGroups.has(featId)) featGroups.set(featId, { kind: "feat", name: featId, orTool: choice.orTool === true });
      addSlots(skillSlots, featGroups.get(featId), choice.count, { skills: toSkillSet(choice.from), orTool: choice.orTool === true });
    });

    const flexibleCount = skillSlots.filter(slot => slot.orTool).length;
    const currentItems = [...skills.proficient, ...tools.extraTools.map((tool, index) => `${TOOL_PREFIX}${index}:${tool}`)];
    const allItems = [...skills.all, ...currentItems.filter(isToolItem), ...Array.from({ length: flexibleCount }, (unused, index) => `${TOOL_PREFIX}new:${index}`)];

    // 每個「擇一」的專長試兩種算法（熟練名額／專精名額），取總缺項最少的；一樣少時取多勾少的，再一樣優先當成熟練名額。
    // 多勾只看技能、不看工具：工具也能填「技能或工具」的名額，分不出多的是哪一種，寧可少報。
    let best = null;
    for (let mask = 0; mask < 1 << Math.min(eitherFeats.length, 4); mask += 1) {
      const proficiencySide = [...skillSlots];
      const expertiseSide = [...expertiseSlots];
      eitherFeats.forEach((feat, index) => ((mask >> index) & 1 ? expertiseSide : proficiencySide).push({ skills: feat.skills, group: feat.group }));
      const proficiency = solve(proficiencySide, currentItems, allItems);
      const expertise = solve(expertiseSide, skills.expertise, skills.all);
      const missingCount = proficiency.missing.length + expertise.missing.length;
      const extra = { proficiency: findExtras(proficiencySide, skills.proficient), expertise: findExtras(expertiseSide, skills.expertise) };
      const extraCount = extra.proficiency.count + extra.expertise.count;
      if (!best || missingCount < best.missingCount || (missingCount === best.missingCount && extraCount < best.extraCount)) {
        best = { missingCount, extraCount, extra, results: [[proficiencySide, proficiency], [expertiseSide, expertise]] };
      }
    }

    const filled = new Map();
    const missing = new Map();
    const missingSlots = new Map();
    const count = (map, group) => map.set(group, (map.get(group) || 0) + 1);
    best.results.forEach(([slots, result]) => {
      result.filled.forEach(index => count(filled, slots[index].group));
      result.missing.forEach(index => {
        count(missing, slots[index].group);
        missingSlots.set(slots[index].group, [...(missingSlots.get(slots[index].group) || []), slots[index]]);
      });
    });
    // 這個來源還能選的技能（依內容檔清單的順序）：只有清單限制的來源才有，任選的回傳空陣列。
    // 熟練名額扣掉已熟練的；專精名額只算已熟練、還沒專精的；「已熟練就改成專精」的專長只扣掉已專精的。
    const proficientSet = new Set(skills.proficient);
    const expertiseSet = new Set(skills.expertise);
    const getOptions = group => {
      const lists = (missingSlots.get(group) || []).map(slot => slot.skills);
      if (!lists.length || lists.some(list => list === null)) return [];
      return [...new Set(lists.flatMap(list => [...list]))].filter(skill => group.kind === "expertise" ? proficientSet.has(skill) && !expertiseSet.has(skill)
        : group.kind === "eitherFeat" ? !expertiseSet.has(skill) : !proficientSet.has(skill));
    };
    // 可選的技能在 MAX_LISTED_OPTIONS 個以內才寫進提醒文字；不論幾個，「前往」時都在技能頁標出來。
    const listed = (group, lead = "") => {
      const options = getOptions(group);
      return options.length && options.length <= MAX_LISTED_OPTIONS ? `${lead}可選：${options.join("、")}` : "";
    };
    // 提醒與技能頁提示列共用的來源名稱。
    const sourceLabel = group => group.kind === "classSkills" ? `${classRules.name}技能`
      : group.kind === "feature" ? `${classRules.name}${group.name}的技能`
      : group.kind === "expertise" ? `${classRules.name}專精`
      : `${group.name}的技能`;
    const highlight = group => {
      // 技能或工具都可以的專長不標技能（什麼都能選）。
      const options = group.orTool ? [] : getOptions(group);
      if (!options.length) return {};
      // keepHighlight：標示一直留著，直到換分頁、再按一次「前往」、按提示列的關閉，或這個來源補滿。
      // held：技能頁提示列的文字（來源：再選 N 項）；勾選改變時 refresh() 重新檢查，回傳同一個來源目前的缺項。
      const key = `${group.kind}:${group.name || ""}`;
      return {
        keepHighlight: true,
        highlightSelector: options.map(skill => `#tab-skills .skill-tip[data-skill="${skill}"]`).join(", "),
        held: { key, label: sourceLabel(group), count: missing.get(group), refresh: () => getIssues()?.find(issue => issue.held?.key === key) }
      };
    };
    // 提醒的順序：背景、職業技能、職業能力、種族、專長、專精；同類依來源順序。
    const groups = [...missing.keys()].sort((a, b) => GROUP_ORDER.indexOf(a.kind) - GROUP_ORDER.indexOf(b.kind));

    const issues = [];
    const progress = group => `${filled.get(group) || 0}/${(filled.get(group) || 0) + missing.get(group)}`;
    // 只有一個名額寫「尚未選擇」，多個名額寫「尚未選完（已選／應選）」；可選的技能夠少時接在括號裡。
    const pending = group => (filled.get(group) || 0) + missing.get(group) === 1
      ? `尚未選擇${listed(group) ? `（${listed(group)}）` : ""}`
      : `尚未選完（${progress(group)}${listed(group, "，")}）`;
    const skillIssue = (group, message, extra = {}) => issues.push({ ...SKILL_TARGET, message, ...extra, ...highlight(group) });
    const missingBackground = new Set(groups.filter(group => group.kind === "background").map(group => group.skill));
    const missingBackgroundSkills = (backgroundRules.skills || []).filter(skill => missingBackground.has(skill));
    if (missingBackgroundSkills.length) issues.push({
      ...SKILL_TARGET,
      message: `背景技能尚未勾選：${missingBackgroundSkills.join("、")}。`,
      focusSelector: `[id="prof-${missingBackgroundSkills[0]}"]`
    });
    groups.filter(group => group.kind !== "background").forEach(group => {
      if (group.kind === "feat" && group.orTool) skillIssue(group, `${group.name}尚未選完（${progress(group)}，技能或工具都可以）。`);
      else if (group.kind === "expertise") skillIssue(group, `${sourceLabel(group)}尚未選完（${progress(group)}${listed(group, "，")}）。`,
        { focusSelector: ".circle-checkbox:not(:checked):not(:disabled)" });
      else skillIssue(group, `${sourceLabel(group)}${pending(group)}。`);
    });

    // 工具：背景與職業的工具各有自己的一列，空白就是沒選。
    if (backgroundRules.tool?.chooseFrom && !value("tool-proficiency-0")) issues.push({
      ...TOOL_TARGET,
      message: "背景工具尚未選擇。",
      focusSelector: "#tool-proficiency-0"
    });
    const emptyClassTools = tools.classSelects.filter(select => !select.value);
    if (emptyClassTools.length) {
      const total = tools.classSelects.length;
      const chooseFrom = classRules.proficiencies?.tools?.chooseFrom || [];
      const groupLabel = chooseFrom.length === 1 ? globalScope.ToolProficiencyCatalog?.groups.find(group => group.id === chooseFrom[0])?.label : "";
      issues.push({
        ...TOOL_TARGET,
        message: `${classRules.name}${groupLabel || "工具"}${total === 1 ? "尚未選擇" : `尚未選完（${total - emptyClassTools.length}/${total}）`}。`,
        ...(emptyClassTools[0].id ? { focusSelector: `#${emptyClassTools[0].id}` } : {})
      });
    }

    // 多勾：指得出是哪幾項就寫名稱，只確定其中幾項寫「包含」，都分不出來只寫數量；
    // 「前往」標出可能多勾的技能，勾選改變時重新檢查。
    const extras = [];
    [["proficiency", "技能熟練"], ["expertise", "專精"]].forEach(([kind, label]) => {
      const { count, candidates, certain } = best.extra[kind];
      if (!count) return;
      const names = candidates.length === count ? `：${candidates.join("、")}` : certain.length ? `（包含${certain.join("、")}）` : "";
      const key = `extra:${kind}`;
      extras.push({
        ...SKILL_TARGET,
        message: `${label}多勾 ${count} 項${names}。`,
        keepHighlight: true,
        highlightSelector: candidates.map(skill => `#tab-skills .skill-tip[data-skill="${skill}"]`).join(", "),
        held: { key, label, suffix: `：多勾 ${count} 項`, refresh: () => getExtraIssues().find(issue => issue.held.key === key) }
      });
    });
    return { issues, extras };
  }

  /** 目前角色的缺項；不適用時回傳 null。 */
  const getIssues = () => analyze()?.issues ?? null;
  /** 多勾的提醒（技能熟練、專精各一條）；不適用或沒有多勾時是空陣列。 */
  const getExtraIssues = () => analyze()?.extras ?? [];

  globalScope.ProficiencyCheck = Object.freeze({ getIssues, getExtraIssues });
})(window);

// 一次性遷移工具：把舊版 class-features.js 的職業 HTML 機械轉成 content/srd 的 YAML，不改規則文字。
// 用法：node tools/class-content/convert-legacy.js barbarian ranger
// 遇到不認得的標記一律停止，避免靜默遺漏；轉換後以 compare.js 核對渲染結果。
"use strict";
const fs = require("fs");
const path = require("path");
const parse5 = require("parse5");
const YAML = require("yaml");
const { ROOT, loadLegacyClassFeatures, loadTipTables, loadLegacyClassActionRules, loadLegacyConstant } = require("./legacy");

// 能力 ID 的英文名（舊 HTML 沒有 data-action-id 的能力才需要；已有的照抄）。
const FEATURE_SLUGS = Object.freeze({
  無甲防禦: "unarmored-defense", 武器精通: "weapon-mastery", 險境感知: "danger-sense", 先祖學識: "primal-knowledge",
  屬性值提升: "ability-score-improvement", 無我狂暴: "mindless-rage", 野性直覺: "feral-instinct",
  施法: "spellcasting", 宿敵: "favored-enemy", 熟練探險家: "deft-explorer", 戰鬥風格: "fighting-style",
  戰術思維: "tactical-mind", 精通重擊: "improved-critical", 額外戰鬥風格: "additional-fighting-style",
  專精: "expertise", 盜賊黑話: "thieves-cant", 反射閃避: "evasion", 可靠才能: "reliable-talent",
  聖騎士斬技: "paladins-smite", 奉獻之誓法術: "oath-of-devotion-spells", 忠誠坐騎: "faithful-steed",
  守護靈氣: "aura-of-protection", 奉獻靈氣: "aura-of-devotion",
  萬事通: "jack-of-all-trades", 額外熟練項: "bonus-proficiencies", 魔法發現: "magical-discoveries",
  無甲移動: "unarmored-movement", 神聖使命: "divine-order", 引導神力: "channel-divinity", 生命領域法術: "life-domain-spells",
  神佑醫者: "blessed-healer", 神佑打擊: "blessed-strikes"
});
const SUBCLASS_IDS = Object.freeze({ 狂戰士道途: "berserker", 獵人: "hunter", 勇士: "champion", 妙手: "thief", 奉獻之誓: "devotion", 逸聞學院: "lore", 散打鬥士: "open-hand", 生命領域: "life" });
// 整個 section 帶 data-action-id、但按鈕說明其實是其中唯一一個小節：外層能力改用新 ID，舊 ID 留給子能力。
const SPLIT_SECTIONS = Object.freeze({ "paladin-divine-sense": "paladin-channel-divinity" });
// 選項的攻擊備註：照抄 class-features-ui.js 的常數（存進角色資料，取消時以相同字串移除）。
const OPTION_ATTACK_NOTES = Object.freeze({ "cleric-blessed-strikes-divine-strike": "CLERIC_DIVINE_STRIKE_ATTACK_NOTE" });
// 舊 HTML 中由網站程式插入控制項的空白容器（以 id 辨識）→ behaviors/<名稱>.js；轉換時核對輸出與舊標記相同。
const BEHAVIOR_MOUNTS = Object.freeze({ "bard-magical-discoveries": "magical-discoveries" });
// 特性表欄位名稱（文字中以 {名稱|…} 引用）。
const COLUMN_KEYS = Object.freeze({
  狂暴次數: "rageUses", 狂暴傷害: "rageDamage", 武器精通: "weaponMastery",
  宿敵: "favoredEnemy", 準備法術: "preparedSpells", "１環": "spellSlots1", "２環": "spellSlots2",
  回氣: "secondWindUses", 偷襲: "sneakAttackDice", 引導神力: "channelDivinityUses",
  激勵骰: "inspirationDie", 戲法: "cantrips", "３環": "spellSlots3", "４環": "spellSlots4",
  武藝: "martialArtsDie", 專注點: "focusPoints", 無甲移動: "unarmoredMovement"
});
// 舊版寫在 character-rules.js／action-panel.js 程式裡、HTML 沒有的機制；轉換時一併寫進內容檔。
const FEATURE_EXTRAS = Object.freeze({
  "barbarian-rage": { resource: { key: "barbarian-rage", uses: "rageUses", recover: { short: 1, long: "all" } } },
  // spell-sources.js：宿敵始終準備獵人印記，免費施放次數同特性表「宿敵」欄。
  "ranger-favored-enemy": { spells: [{ id: "hunters-mark", freeUses: "favoredEnemy" }] },
  // character-rules.js getCharacterResourceSpecs：回氣短休回 1 次；動作如潮短休或長休全回。
  "fighter-second-wind": { resource: { key: "fighter-second-wind", uses: "secondWindUses", recover: { short: 1, long: "all" } } },
  "fighter-action-surge": { resource: { key: "fighter-action-surge", uses: 1, recover: { short: "all", long: "all" } } },
  // character-rules.js：聖療為點數池（addPoints），總量聖騎士等級 × 5，長休全回；引導神力短休回 1 次。
  "paladin-lay-on-hands": { resource: { key: "paladin-lay-on-hands", kind: "points", uses: "layOnHandsPool", recover: { long: "all" } } },
  "paladin-channel-divinity": { resource: { key: "paladin-channel-divinity", uses: "channelDivinityUses", recover: { short: 1, long: "all" } } },
  // spell-sources.js：至聖斬、召喚坐騎始終準備，各可免費施放 1 次。
  "paladin-paladins-smite": { spells: [{ id: "divine-smite", freeUses: 1 }] },
  "paladin-faithful-steed": { spells: [{ id: "find-steed", freeUses: 1 }] },
  // character-rules.js：吟遊詩人激勵次數為魅力調整值（至少 1），長休全回；5 級起短休或長休全回。
  "bard-inspiration": { resource: { key: "bard-inspiration", uses: "inspirationUses", recover: { long: "all" }, recoverByLevel: { 5: { short: "all", long: "all" } } } },
  // character-rules.js：專注點為點數池（總量同特性表「專注點」欄），短休或長休全回；吐故納新 1 次、混元體感知調整值（至少 1）次，長休全回。
  "monk-focus": { resource: { key: "monk-focus-points", kind: "points", uses: "focusPoints", recover: { short: "all", long: "all" } } },
  "monk-uncanny-metabolism": { resource: { key: "monk-uncanny-metabolism", uses: 1, recover: { long: "all" } } },
  "monk-wholeness-of-body": { resource: { key: "monk-wholeness", uses: "wholenessUses", recover: { long: "all" } } },
  // character-rules.js：牧師引導神力次數同特性表「引導神力」欄，短休回 1 次、長休全回。
  "cleric-channel-divinity": { resource: { key: "cleric-channel-divinity", uses: "channelDivinityUses", recover: { short: 1, long: "all" } } }
});
// action-panel.js TABLETOP_VALUE_RESOLVERS 的公式（「職業-名稱」key）；文字結果寫成 byLevel（未列的等級保留頁面文字）。
const CLASS_VALUES = Object.freeze({
  barbarian: { frenzyDice: "{rageDamage}d6" }, fighter: { secondWindHealing: "1d10 + {level}" },
  rogue: { cunningStrikeDc: "8 + {proficiencyBonus} + {dexModifier}" }, paladin: { layOnHandsPool: "{level} * 5" },
  // 激勵次數取自 character-rules.js；恢復文字跟隨資源設定（5 級起短休也全回）。
  bard: { inspirationUses: "max(1, {chaModifier})", inspirationRecovery: { byLevel: { 5: "短休或長休後全部恢復" } } },
  // 武藝骰「1d{}」的數值是骰面；兩枚武藝骰為 2d{}。混元體次數取自 character-rules.js。
  monk: {
    saveDc: "8 + {proficiencyBonus} + {wisModifier}", stunningStrikeDc: { formula: "{saveDc}", format: "（DC {}）" },
    uncannyMetabolismHealing: "1d{martialArtsDie} + {level}",
    deflectAttacksReduction: "1d10 + {dexModifier} + {level}", deflectAttacksDamage: "2d{martialArtsDie} + {dexModifier}",
    slowFallReduction: "{level} * 5", wholenessHealing: "1d{martialArtsDie} + {wisModifier}", wholenessUses: "max(1, {wisModifier})"
  },
  // 焚燒不死生物的骰數為感知調整值（至少 1）。
  cleric: {
    divineSparkRoll: "1d8 + {wisModifier}", spellSaveDc: { formula: "8 + {proficiencyBonus} + {wisModifier}", format: "（DC {}）" },
    searUndeadDice: "max(1, {wisModifier})d8", preserveLifeTotal: "{level} * 5"
  }
});
// 施法進度（舊版分散在 character-rules.js 的施法者集合與半施法者準備表）。
const SPELLCASTING = Object.freeze({
  barbarian: "none", fighter: "none", monk: "none", rogue: "none", paladin: "half", ranger: "half", warlock: "pact",
  bard: "full", cleric: "full", druid: "full", sorcerer: "full", wizard: "full"
});
const NUMBER_WORDS = Object.freeze({ 一: 1, 二: 2, 兩: 2, 三: 3, 四: 4 });

class ConvertError extends Error {}
const fail = (where, message) => { throw new ConvertError(`${where}：${message}`); };

const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
const has = (node, name) => Boolean(node.attrs?.some(item => item.name === name));
const classes = node => (attr(node, "class") || "").split(/\s+/).filter(Boolean);
const elements = node => (node.childNodes || []).filter(child => child.nodeName !== "#comment" && (child.nodeName !== "#text" || child.value.trim()));
const textOf = node => node.nodeName === "#text" ? node.value : (node.childNodes || []).map(textOf).join("");
const findAll = (node, test, out = []) => { if (test(node)) out.push(node); (node.childNodes || []).forEach(child => findAll(child, test, out)); return out; };
const camel = key => key.replace(/-([a-z0-9])/g, (all, letter) => letter.toUpperCase());

function allowAttributes(node, allowed, where) {
  (node.attrs || []).forEach(({ name }) => { if (!allowed.includes(name)) fail(where, `<${node.nodeName}> 有未處理的屬性 ${name}`); });
}

// 行內 HTML → 內容檔標記。options.valueToken(key) 把 data-tabletop-value 轉成 {名稱|…}。
function inlineToText(nodes, context, where) {
  const { conditions } = loadTipTables();
  return nodes.map(node => {
    if (node.nodeName === "#text") {
      const text = node.value.replace(/[ \t]*\r?\n[ \t]*/g, "");
      if (/\*\*|\[\[|\]\]|[{}<]/.test(text)) fail(where, `文字含有保留符號：${text}`);
      return text;
    }
    if (node.nodeName === "br") return "\\\n";
    // 粗體的數值標記：寫成「**{名稱|文字}**」，渲染器合併回 <strong data-tabletop-value>。
    if (node.nodeName === "strong" && has(node, "data-tabletop-value")) {
      allowAttributes(node, ["data-tabletop-value"], where);
      if (node.childNodes.some(child => child.nodeName !== "#text")) fail(where, "數值標記內只能有文字");
      return `**{${context.valueToken(attr(node, "data-tabletop-value"), where)}|${textOf(node)}}**`;
    }
    if (node.nodeName === "strong") {
      allowAttributes(node, [], where);
      return `**${inlineToText(node.childNodes, context, where)}**`;
    }
    if (node.nodeName === "span" && classes(node).includes("skill-tip")) {
      if (attr(node, "data-skill") !== textOf(node)) fail(where, `技能提示文字與 data-skill 不同：${textOf(node)}`);
      return `[[${textOf(node)}]]`;
    }
    if (node.nodeName === "span" && classes(node).includes("condition-tip")) {
      if (conditions.get(textOf(node)) !== attr(node, "data-condition")) fail(where, `狀態提示文字與 data-condition 不符：${textOf(node)}`);
      return `[[${textOf(node)}]]`;
    }
    // 只在跑團說明出現的文字。數值（或「外框＋數值」）寫成空白頁面文字的 {名稱|}，兩種版本相同；
    // 舊版的跑團後備文字（計算函式無值時才顯示）不保留，轉換時列出。其他文字只進跑團版本（寫成 tabletop）。
    if (node.nodeName === "span" && has(node, "data-tabletop-only")) {
      allowAttributes(node, ["data-tabletop-only", "hidden", "data-tabletop-value"], where);
      if (!has(node, "hidden")) fail(where, "data-tabletop-only 須同時有 hidden");
      if (!context.view) fail(where, "此處不支援跑團專用文字");
      const tabletopOnlyValue = tabletopOnlyValueMark(node, context, where);
      if (tabletopOnlyValue) return tabletopOnlyValue;
      return context.view === "tabletop" ? inlineToText(node.childNodes, context, where) : "";
    }
    // 選項自己的按鈕說明段落（例如神聖打擊）：只包住選項文字，由 convertOption 取出。
    if (node.nodeName === "span" && has(node, "data-action-id") && context.optionBlock) {
      allowAttributes(node, ["data-action-id"], where);
      if (context.optionBlock.id) fail(where, "一個選項只支援一個說明段落");
      context.optionBlock.id = attr(node, "data-action-id");
      return inlineToText(node.childNodes, context, where);
    }
    if (node.nodeName === "span" && has(node, "data-tabletop-value")) {
      allowAttributes(node, ["data-tabletop-value"], where);
      return valueMark(node, context, where);
    }
    return fail(where, `未處理的行內標記 <${node.nodeName} ${(node.attrs || []).map(item => item.name).join(" ")}>`);
  }).join("");
}

// <span data-tabletop-value> → {名稱|頁面文字}；頁面文字只能有文字與粗體（例如「**等同感知調整值數量的 d8**（至少 1d8）」）。
function valueMark(node, context, where) {
  if (findAll(node, child => child !== node && (!["#text", "strong"].includes(child.nodeName) || has(child, "data-tabletop-value"))).length) fail(where, "數值標記內只能有文字或粗體");
  return `{${context.valueToken(attr(node, "data-tabletop-value"), where)}|${inlineToText(node.childNodes, context, where)}}`;
}

// 跑團限定的數值 → {名稱|}：span 本身是數值（例如牧師法術豁免 DC），或只包住「外框文字＋數值」
// （例如震懾擊「（DC <數值>）」，對應 values 中 { formula: "{saveDc}", format: （DC {}） } 的值）。不是這兩種時回傳 null。
function tabletopOnlyValueMark(node, context, where) {
  const report = fallback => { if (fallback && context.view === "page") droppedFallbacks.add(`${where}：${fallback}`); };
  if (has(node, "data-tabletop-value")) {
    report(textOf(node));
    return `{${context.valueToken(attr(node, "data-tabletop-value"), where)}|}`;
  }
  const values = node.childNodes.filter(child => child.nodeName !== "#text");
  if (values.length !== 1 || !has(values[0], "data-tabletop-value")) return null;
  allowAttributes(values[0], ["data-tabletop-value"], where);
  const index = node.childNodes.indexOf(values[0]);
  const format = `${textOf({ childNodes: node.childNodes.slice(0, index) })}{}${textOf({ childNodes: node.childNodes.slice(index + 1) })}`;
  const target = context.valueToken(attr(values[0], "data-tabletop-value"), where);
  const alias = Object.entries(CLASS_VALUES[context.classId] || {}).find(([, value]) => value.formula === `{${target}}` && value.format === format)?.[0];
  if (!alias) fail(where, `跑團限定的「${format.replace("{}", `{${target}}`)}」須在 CLASS_VALUES 加入 { formula: "{${target}}", format: "${format}" }`);
  report(textOf(values[0]));
  return `{${alias}|}`;
}
// 轉換時捨棄的跑團後備文字（轉換結束時列出）。
const droppedFallbacks = new Set();

const indentContinuation = text => text.replace(/\\\n/g, "\\\n  ");

function isOptionItem(node) {
  return findAll(node, child => child.nodeName === "input").length > 0;
}

// 選項（清單項目或卡片）→ { id, name, text }。
function convertOption(node, feature, context, where) {
  const nodes = [...elements(node)];
  const label = nodes.shift();
  if (label?.nodeName !== "label") fail(where, "選項須以 <label> 開頭");
  const [input, ...labelRest] = label.childNodes;
  if (input.nodeName !== "input" || attr(input, "type") !== "checkbox") fail(where, "選項的 <label> 須以勾選框開頭");
  allowAttributes(input, ["type", "id", "data-feature-choice-group"], where);
  const group = attr(input, "data-feature-choice-group");
  if (group && group !== feature.id) fail(where, `data-feature-choice-group「${group}」與能力 ID 不同`);
  if (feature.changeOn && !group) fail(where, "data-rest-change 的選項須有 data-feature-choice-group");
  // 沒有 data-rest-change 的選擇組（例如神佑打擊）寫成 choiceGroup；同一能力的選項須一致。
  if (!feature.changeOn) {
    if (feature.choiceGroup !== undefined && feature.choiceGroup !== Boolean(group)) fail(where, "同一能力的選項 data-feature-choice-group 不一致");
    feature.choiceGroup = Boolean(group);
  }
  const option = { id: attr(input, "id"), name: textOf({ childNodes: labelRest }).trim() };
  // 「：」分隔：舊版跑團名稱以 data-tabletop-value="…-name" 的 span 顯示。
  const first = nodes[0];
  if (first?.nodeName === "span" && /-name$/.test(attr(first, "data-tabletop-value") || "")) {
    if (textOf(first) !== "：") fail(where, "名稱分隔 span 須只有「：」");
    allowAttributes(first, ["data-tabletop-value", "data-overview-hide"], where);
    nodes.shift();
    option.tabletopName = attr(first, "data-tabletop-value");
  } else if (first?.nodeName === "#text" && first.value.startsWith("：")) {
    nodes[0] = { ...first, value: first.value.slice(1) };
  } else if (nodes.length) fail(where, `選項「${option.name}」的說明須以「：」開頭`);
  const optionBlock = {};
  const text = inlineToText(nodes, { ...context, optionBlock }, where);
  if (text) option.text = text;
  // 選項自己的說明段落須包住整段選項文字；按鈕由 convertActions 掛到選項上。
  if (optionBlock.id) {
    if (elements({ childNodes: nodes }).length !== 1 || option.tabletopName) fail(where, `選項「${option.name}」的說明段落須包住整段文字`);
    option.blockId = optionBlock.id;
  }
  return option;
}

// 能力內文區塊 → Markdown；選項另外收集。
function convertBody(nodes, feature, context, where) {
  const blocks = [];
  // 跑團動作說明的區塊（排除 data-tabletop-hide）；有排除時寫成 tabletop。
  const tabletopBlocks = [];
  let tabletopUsed = false;
  const summaryParts = [];
  let summaryUsed = false;
  const pushSummary = (node, text) => {
    if (has(node, "data-overview-hide")) summaryUsed = true;
    else summaryParts.push(text);
  };
  // 職業頁與跑團版本不同（含 data-tabletop-only 文字）時寫成 tabletop。
  const pushBlock = (text, tabletop = text) => {
    blocks.push(text);
    tabletopBlocks.push(tabletop);
    if (tabletop !== text) tabletopUsed = true;
  };
  // 同一段行內內容的職業頁版本與跑團版本；總覽取跑團版本。
  const views = children => [inlineToText(children, { ...context, view: "page" }, where), inlineToText(children, { ...context, view: "tabletop" }, where)];
  // 接在專長選單後的段落、網站程式插入控制項的容器：都須是能力的最後一個區塊。
  let afterFeatChoice;
  let behavior;
  // 子能力（帶 data-action-id 的小節）接在內文之後，之後只能再有子能力。
  const parts = [];
  for (const node of nodes) {
    if (afterFeatChoice !== undefined || behavior) fail(where, "data-after-feat-choice 段落或控制項容器之後不可再有區塊");
    const isSubsection = node.nodeName === "div" && classes(node).includes("class-rule-subsection");
    const partId = isSubsection ? attr(node, "data-action-id") || context.splitPartId : undefined;
    if (parts.length && !partId) fail(where, "子能力之後只能再有子能力");
    if (partId) {
      allowAttributes(node, ["class", "data-action-id"], where);
      if (!attr(node, "data-action-id")) context.splitPartId = undefined;
      parts.push(convertPart(node, partId, feature, context, where));
      continue;
    }
    if (node.nodeName === "p" && has(node, "data-after-feat-choice")) {
      allowAttributes(node, ["data-after-feat-choice"], where);
      const [text, tabletop] = views(node.childNodes);
      if (text !== tabletop) fail(where, "data-after-feat-choice 段落不支援跑團專用文字");
      afterFeatChoice = text;
      // 跑團說明與總覽照舊讀取此段落（tabletop／summary 須為完整版本）。
      tabletopBlocks.push(text);
      summaryParts.push(text);
    } else if (node.nodeName === "div" && BEHAVIOR_MOUNTS[attr(node, "id")]) {
      if (elements(node).length) fail(where, "控制項容器須為空白");
      behavior = BEHAVIOR_MOUNTS[attr(node, "id")];
      const expected = require(`./behaviors/${behavior}`).afterText();
      const normalize = html => parse5.serialize(parse5.parseFragment(html));
      if (normalize(expected) !== normalize(parse5.serialize({ nodeName: "#document-fragment", childNodes: [node] }))) fail(where, `控制項容器與 behaviors/${behavior}.js 的輸出不同`);
    } else if (node.nodeName === "p" && has(node, "data-tabletop-hide")) {
      // 只在職業頁顯示的段落：不進跑團說明，也不進總覽。
      allowAttributes(node, ["data-tabletop-hide"], where);
      blocks.push(views(node.childNodes)[0]);
      tabletopUsed = true;
    } else if (node.nodeName === "p") {
      allowAttributes(node, ["data-overview-hide"], where);
      const children = [...node.childNodes];
      const lead = children[0];
      if (lead?.nodeName === "strong" && has(lead, "data-tabletop-only")) {
        allowAttributes(lead, ["data-tabletop-only", "hidden"], where);
        if (textOf(lead) !== `${feature.name}：`) fail(where, `跑團前綴「${textOf(lead)}」須等於能力名稱加「：」`);
        children.shift();
        feature.appendedPrefix = true;
      }
      const [text, tabletop] = views(children);
      pushBlock(text, tabletop);
      pushSummary(node, tabletop);
    } else if (node.nodeName === "ul" && classes(node).includes("class-rule-list")) {
      allowAttributes(node, ["class"], where);
      const items = elements(node);
      if (items.every(isOptionItem)) {
        feature.optionStyle = "list";
        feature.options = items.map(item => {
          allowAttributes(item, ["data-action-id"], where);
          const option = convertOption(item, feature, context, where);
          if (attr(item, "data-action-id")) option.legacyActionId = attr(item, "data-action-id");
          return option;
        });
        continue;
      }
      if (items.some(isOptionItem)) fail(where, "清單混合了選項與一般項目");
      const lines = [];
      const tabletopLines = [];
      for (const item of items) {
        allowAttributes(item, ["data-tabletop-hide"], where);
        const children = [...item.childNodes];
        // 只在職業頁顯示的項目：不進跑團說明，也不進總覽。
        if (has(item, "data-tabletop-hide")) {
          lines.push(`- ${indentContinuation(views(children)[0])}`);
          continue;
        }
        const lead = children.find(child => child.nodeName !== "#text" || child.value.trim());
        // 總覽隱藏的粗體標籤只影響 summary。
        const summaryChildren = lead?.nodeName === "strong" && has(lead, "data-overview-hide") ? children.filter(child => child !== lead) : children;
        if (summaryChildren !== children) {
          summaryUsed = true;
          lead.attrs = lead.attrs.filter(item => item.name !== "data-overview-hide");
        }
        summaryParts.push(views(summaryChildren)[1]);
        const [text, tabletop] = views(children);
        lines.push(`- ${indentContinuation(text)}`);
        tabletopLines.push(`- ${indentContinuation(tabletop)}`);
      }
      if (tabletopLines.length) pushBlock(lines.join("\n"), tabletopLines.join("\n"));
      else { blocks.push(lines.join("\n")); tabletopUsed = true; }
    } else if (node.nodeName === "div" && classes(node).includes("class-rule-subsection")) {
      allowAttributes(node, ["class"], where);
      const [heading, ...rest] = elements(node);
      if (heading?.nodeName !== "h4") fail(where, "小節須以 <h4> 開頭");
      const [title, tabletopTitle] = views(heading.childNodes);
      pushBlock(`#### ${title}`, `#### ${tabletopTitle}`);
      const inner = convertBody(rest, feature, context, where);
      if (inner.afterFeatChoice !== undefined || inner.behavior) fail(where, "小節內不支援 data-after-feat-choice 段落或控制項容器");
      blocks.push(...inner.blocks);
      tabletopBlocks.push(...inner.tabletopBlocks);
      tabletopUsed ||= inner.tabletopUsed;
      summaryParts.push(...inner.summaryParts);
      summaryUsed ||= inner.summaryUsed;
    } else if (node.nodeName === "div" && classes(node).includes("druid-mission-options")) {
      feature.optionStyle = "cards";
      feature.options = elements(node).map(card => {
        if (!classes(card).includes("druid-mission-option")) fail(where, "卡片選項結構不符");
        allowAttributes(card, ["class", "data-action-id"], where);
        const [heading, ...extra] = elements(card);
        if (extra.length || !classes(heading).includes("druid-mission-option__heading")) fail(where, "卡片選項只支援單一標題列");
        const option = convertOption(heading, feature, context, where);
        if (attr(card, "data-action-id")) option.legacyActionId = attr(card, "data-action-id");
        return option;
      });
    } else {
      fail(where, `未處理的區塊 <${node.nodeName} class="${attr(node, "class") || ""}">`);
    }
  }
  return { blocks, tabletopBlocks, tabletopUsed, summaryParts, summaryUsed, afterFeatChoice, behavior, parts };
}

// 帶 data-action-id 的小節 → 子能力 { id, name, activation, text, tabletop, summary }。
// 標題「名稱（使用方式）」；跑團版標題多出的文字暫存在 headingExtra，掛上按鈕後再核對是否等於自動產生的消耗字樣。
function convertPart(node, id, feature, context, where) {
  const at = `${where} 子能力 ${id}`;
  const [heading, ...rest] = elements(node);
  if (heading?.nodeName !== "h4") fail(at, "小節須以 <h4> 開頭");
  const title = inlineToText(heading.childNodes, { ...context, view: "page" }, at);
  const tabletopTitle = inlineToText(heading.childNodes, { ...context, view: "tabletop" }, at);
  const match = title.match(/^([^（）]+)(?:（([^（）]+)）)?$/) || fail(at, `標題格式不符：${title}`);
  const part = { id, name: match[1], level: feature.level, subclass: feature.subclass };
  if (match[2]) part.activation = match[2];
  const open = part.activation ? `${part.name}（${part.activation}` : part.name;
  const close = part.activation ? "）" : "";
  if (!tabletopTitle.startsWith(open) || !tabletopTitle.endsWith(close)) fail(at, `跑團版標題「${tabletopTitle}」與職業頁標題結構不同`);
  part.headingExtra = tabletopTitle.slice(open.length, tabletopTitle.length - close.length);
  const inner = convertBody(rest, part, { ...context, splitPartId: undefined }, at);
  if (inner.afterFeatChoice !== undefined || inner.behavior || inner.parts.length || part.options) fail(at, "子能力內不支援選項、控制項容器或子能力");
  if (inner.blocks.some(block => block.startsWith("#### "))) fail(at, "子能力內不支援小節");
  part.text = inner.blocks.join("\n\n");
  if (inner.tabletopUsed) part.tabletop = inner.tabletopBlocks.join("\n\n");
  if (inner.summaryUsed) part.summary = inner.summaryParts.join("");
  return part;
}

function convertCreation(root, classId, where) {
  const creation = findAll(root, node => attr(node, "data-class-feature-panel") === "creation")[0];
  const context = { valueToken: () => fail(where, "創角資訊不應有數值標記") };
  const out = {};
  out.tagline = textOf(findAll(creation, node => classes(node).includes("class-feature-tagline"))[0]).trim();
  out.quote = textOf(findAll(creation, node => classes(node).includes("class-flavor-quote"))[0]).trim();
  const info = findAll(creation, node => classes(node).includes("class-core-creation-info"))[0];
  const table = findAll(info, node => node.nodeName === "table")[0];
  const rows = new Map(findAll(table, node => node.nodeName === "tr").map(tr => {
    const [label, value] = findAll(tr, node => node.nodeName === "td");
    return [textOf(label).trim(), value];
  }));
  const cellText = label => inlineToText(rows.get(label).childNodes, context, `${where} ${label}`).trim();
  const primary = cellText("關鍵屬性");
  out.primaryAbility = primary.includes("或") ? { any: primary.split("或") } : { all: primary.split("與") };
  const hitDie = cellText("生命骰").match(/^D(\d+)，每級多一顆$/);
  if (!hitDie) fail(where, "生命骰格式不符");
  out.hitDie = Number(hitDie[1]);
  out.saves = cellText("豁免熟練項").split("、");
  const skillCell = rows.get("技能熟練項");
  const skillNames = findAll(skillCell, node => classes(node).includes("skill-tip")).map(textOf);
  const count = textOf(skillCell).match(/擇([一二兩三四])|選擇?([一二兩三四])項|任選([一二兩三四])項/);
  if (!count) fail(where, "技能熟練項的數量無法判讀");
  out.skills = { choose: NUMBER_WORDS[count[1] || count[2] || count[3]], from: skillNames.length ? skillNames : "any" };
  out.legacySkillText = cellText("技能熟練項");
  out.weapons = cellText("武器熟練項");
  out.tools = cellText("工具熟練項");
  out.armor = cellText("護甲訓練");
  if (cellText("初始裝備") !== "(A)、(B) 二選一") fail(where, "初始裝備格式不符");
  out.equipment = { A: cellText("（A）"), B: cellText("（B）") };
  const tableIndex = info.childNodes.indexOf(table);
  const note = inlineToText(elements({ childNodes: info.childNodes.slice(tableIndex + 1) }).flatMap(node =>
    node.nodeName === "p" && classes(node).includes("class-core-equipment-note") ? node.childNodes : [node]), context, `${where} 裝備說明`).trim();
  if (note) out.equipment.note = note;

  const featureTable = findAll(creation, node => attr(node, "data-class-feature-table") === classId)[0];
  if (findAll(findAll(featureTable, node => node.nodeName === "thead")[0], node => node.nodeName === "tr").length !== 1) fail(where, "特性表表頭須為單一列");
  const headers = findAll(featureTable, node => node.nodeName === "th").map(node => textOf(node).trim());
  if (headers.slice(0, 3).join() !== "等級,熟練加值,職業特性") fail(where, "特性表前三欄不符");
  const bodyRows = findAll(findAll(featureTable, node => node.nodeName === "tbody")[0], node => node.nodeName === "tr")
    .map(tr => findAll(tr, node => node.nodeName === "td").map(td => textOf(td).trim()));
  out.maxLevel = bodyRows.length;
  out.legacyFeatureColumn = bodyRows.map(row => row[2]);
  out.progression = {};
  headers.slice(3).forEach((label, offset) => {
    const key = COLUMN_KEYS[label] || fail(where, `特性表欄位「${label}」沒有對應名稱，請加入 COLUMN_KEYS`);
    const column = { label, byLevel: {} };
    // 格子拆成文字與數字（「1d6」→ ["", "1", "d", "6", ""]），同欄文字須一致。隨等級變化的那個數字是數值，
    // 其餘為顯示格式（例如「+2」→ +{}、「2d6」→ {}d6、「1d8」→ 1d{}）；都不變時取第一個數字。
    const cells = bodyRows.map(row => (row[offset + 3] === "-" ? null : row[offset + 3].split(/(\d+)/)));
    const filled = cells.filter(Boolean);
    filled.forEach(parts => {
      if (parts.length < 3) fail(where, `特性表數值「${parts.join("")}」無法轉成數字`);
      if (parts.length !== filled[0].length || parts.some((part, at) => at % 2 === 0 && part !== filled[0][at])) fail(where, `特性表「${label}」欄的格式不一致：${parts.join("")}`);
    });
    const varying = (filled[0] || []).map((part, at) => at).filter(at => at % 2 === 1 && filled.some(parts => parts[at] !== filled[0][at]));
    if (varying.length > 1) fail(where, `特性表「${label}」欄有多個數字隨等級變化`);
    const valueAt = varying[0] ?? 1;
    const format = filled.length ? filled[0].map((part, at) => (at === valueAt ? "{}" : part)).join("") : "{}";
    if (format !== "{}") column.format = format;
    let previous;
    cells.forEach((parts, index) => {
      const value = parts ? Number(parts[valueAt]) : null;
      if (index === 0 || value !== previous) column.byLevel[index + 1] = value;
      previous = value;
    });
    out.progression[key] = column;
  });
  bodyRows.forEach((row, index) => {
    if (row[0] !== String(index + 1) || row[1] !== `+${Math.ceil((index + 1) / 4) + 1}`) fail(where, `特性表第 ${index + 1} 列的等級或熟練加值不符`);
  });
  return out;
}

// blocks：說明段落 ID → { target（按鈕掛在哪裡）, level, name, subclass, checkedId }，含能力、子能力與選項自己的說明段落。
function convertActions(rules, labelAt, blocks, featureById, classId, subclassShortName, maxLevel) {
  const appendedIds = new Set();
  for (const rule of rules) {
    const known = ["id", "mode", "level", "label", "key", "legacyKeys", "resourceKey", "descriptionId", "descriptionIds", "checkedId"];
    Object.keys(rule).forEach(name => { if (!known.includes(name)) fail(`${classId} 動作 ${rule.key}`, `未處理的欄位 ${name}`); });
    const [hostId, ...appended] = [].concat(rule.descriptionIds || rule.descriptionId);
    const host = blocks.get(hostId) || fail(classId, `動作 ${rule.key} 的說明段落 ${hostId} 不存在`);
    // checkedId（勾選才出現）由「按鈕寫在選項底下」表達，須等於說明段落所屬的選項。
    if (rule.checkedId !== host.checkedId) fail(classId, `動作 ${rule.key} 的 checkedId「${rule.checkedId || ""}」與說明段落所屬選項「${host.checkedId || ""}」不同`);
    const action = { mode: rule.mode, key: rule.key };
    if (rule.legacyKeys) action.legacyKeys = [...rule.legacyKeys];
    const defaultLabel = `等級 ${host.level}：${host.name}${host.subclass ? `（${subclassShortName}子職）` : ""}`;
    if (typeof rule.label === "function") {
      // 依等級換名的 label 寫成 { byLevel }：只列出文字改變的等級，低於最低等級時使用預設文字。
      const byLevel = {};
      let previous = defaultLabel;
      for (let level = rule.level; level <= maxLevel; level += 1) {
        const label = labelAt(rule, level);
        if (label !== previous) byLevel[level] = label;
        previous = label;
      }
      if (Object.keys(byLevel).length) action.label = { byLevel };
    } else if (rule.label !== defaultLabel) action.label = rule.label;
    if (rule.level !== host.level) action.level = rule.level;
    if (rule.resourceKey) action.resource = rule.resourceKey;
    if (appended.length) {
      action.append = appended.map(item => {
        const target = featureById.get(item.id) || fail(classId, `append 的段落 ${item.id} 不存在`);
        if (item.level !== target.level) fail(classId, `append ${item.id} 的等級 ${item.level} 與能力等級 ${target.level} 不同`);
        if (!target.appendedPrefix) fail(classId, `${item.id} 沒有跑團「名稱：」前綴`);
        appendedIds.add(item.id);
        return item.id;
      });
    }
    (host.target.actions ||= []).push(action);
  }
  for (const feature of featureById.values()) {
    if (feature.appendedPrefix && !appendedIds.has(feature.id)) {
      fail(classId, `${feature.id} 有跑團前綴，但沒有動作 append 它`);
    }
  }
}

function convertClass(classId, html) {
  const where = `class-features.js ${classId}`;
  const root = parse5.parseFragment(html);
  const creation = convertCreation(root, classId, where);
  const panel = findAll(root, node => attr(node, "data-class-feature-panel") === "class")[0];
  const sections = elements(panel);
  const valueToken = (key, at) => {
    if (key === "character-level") return "level";
    if (key === "proficiency-bonus") return "proficiencyBonus";
    if (!key.startsWith(`${classId}-`)) fail(at, `數值 key「${key}」不是本職業`);
    return camel(key.slice(classId.length + 1));
  };
  let subclass = null;
  const features = sections.map((section, index) => {
    const at = `${where} 第 ${index + 1} 段`;
    if (section.nodeName !== "section") fail(at, `能力須是 <section>`);
    allowAttributes(section, ["class", "data-feature-level", "data-action-id", "data-rest-change"], at);
    if (attr(section, "class") !== `${classId}-feature class-feature-section`) fail(at, "section class 不符");
    const feature = { level: Number(attr(section, "data-feature-level")) };
    const [first, ...rest] = elements(section);
    let body = [first, ...rest];
    if (first?.nodeName === "h3") {
      const match = textOf(first).match(/^等級 (\d+)：(.+?)(?:（(.+)子職）)?$/);
      if (!match || Number(match[1]) !== feature.level) fail(at, `標題格式或等級不符：${textOf(first)}`);
      feature.name = match[2];
      if (match[3]) {
        feature.subclass = match[3];
        if (subclass && subclass.shortName !== match[3]) fail(at, "同一職業出現多個子職");
        subclass ||= { shortName: match[3] };
      }
      const slug = FEATURE_SLUGS[feature.name];
      // 同名能力（例如屬性值提升）以等級區分。
      const headingName = node => textOf(node || {}).replace(/^等級 \d+：/, "");
      const repeated = sections.filter(other => elements(other)[0]?.nodeName === "h3" && headingName(elements(other)[0]) === headingName(first)).length > 1;
      feature.id = SPLIT_SECTIONS[attr(section, "data-action-id")] || attr(section, "data-action-id") || (slug ? `${classId}-${slug}${repeated ? `-${feature.level}` : ""}` : null);
      if (!feature.subclass && /子職$/.test(feature.name)) feature.type = "subclass";
      if (!feature.id && feature.type === "subclass") feature.id = `${classId}-subclass`;
      if (!feature.id) fail(at, `能力「${feature.name}」沒有 data-action-id，請加入 FEATURE_SLUGS`);
      body = rest;
    } else if (has(section, "data-action-id")) fail(at, "沒有標題的補充段落不應有 data-action-id");
    if (attr(section, "data-rest-change")) {
      if (attr(section, "data-rest-change") !== "either") fail(at, "只支援 data-rest-change=\"either\"");
      feature.changeOn = "rest";
    }
    // 拆成外層能力與子能力的段落：舊 data-action-id 移到唯一的無 ID 小節。
    const splitPartId = SPLIT_SECTIONS[attr(section, "data-action-id")] ? attr(section, "data-action-id") : undefined;
    const context = { valueToken, classId, splitPartId };
    const converted = convertBody(body, feature, context, at);
    if (context.splitPartId) fail(at, `找不到要拆成子能力 ${splitPartId} 的小節`);
    feature.text = converted.blocks.join("\n\n");
    if (converted.parts.length) feature.parts = converted.parts;
    if (converted.afterFeatChoice !== undefined) feature.afterFeatChoice = converted.afterFeatChoice;
    if (converted.behavior) feature.behavior = converted.behavior;
    // 拆分後外層能力沒有按鈕，舊版只在跑團顯示的文字（例如「引導神力使用次數」）不再使用。
    if (converted.tabletopUsed && !splitPartId) feature.tabletop = converted.tabletopBlocks.join("\n\n");
    if (converted.summaryUsed && !splitPartId) feature.summary = converted.summaryParts.join("");
    if (feature.options) {
      const choose = feature.text.match(/選擇(?:下列)? (\d+) 項/);
      feature.choose = choose ? Number(choose[1]) : fail(at, "有選項但內文沒有「選擇 N 項」");
      for (const option of feature.options) {
        const suffix = option.id.startsWith(`${feature.id}-`) ? option.id.slice(feature.id.length + 1) : null;
        const expectedAction = suffix ? `${classId}-${suffix}` : null;
        if (option.legacyActionId && option.legacyActionId !== expectedAction) fail(at, `選項段落 ID ${option.legacyActionId} 不符命名規則`);
        if (option.tabletopName && option.tabletopName !== `${expectedAction}-name`) fail(at, `選項名稱 key ${option.tabletopName} 不符命名規則`);
        option.compat = Boolean(option.legacyActionId || option.tabletopName);
        if (option.blockId && option.blockId !== expectedAction) fail(at, `選項說明段落 ID ${option.blockId} 不符命名規則`);
        const attackNote = OPTION_ATTACK_NOTES[option.id];
        if (attackNote) option.attackNote = loadLegacyConstant("class-features-ui.js", attackNote);
      }
    }
    return feature;
  });
  // 子職名稱取自「選擇子職」段落的「基本規則僅提供「…」」。
  const entry = features.find(feature => feature.type === "subclass") || fail(where, "找不到選擇子職的能力");
  const subclassName = entry.text.match(/僅提供「(.+?)」/)?.[1] || fail(where, "選擇子職的段落沒有子職名稱");
  subclass = { id: SUBCLASS_IDS[subclassName] || fail(where, `子職「${subclassName}」沒有 ID，請加入 SUBCLASS_IDS`), name: subclassName, shortName: subclass.shortName };

  const featureById = new Map(features.filter(feature => feature.id).map(feature => [feature.id, feature]));
  const blocks = new Map();
  for (const feature of featureById.values()) {
    const base = { level: feature.level, subclass: feature.subclass };
    blocks.set(feature.id, { ...base, target: feature, name: feature.name });
    (feature.parts || []).forEach(part => blocks.set(part.id, { ...base, target: part, name: part.name }));
    (feature.options || []).filter(option => option.blockId).forEach(option => blocks.set(option.blockId, { ...base, target: option, name: option.name, checkedId: option.id }));
  }
  const { rules, labelAt } = loadLegacyClassActionRules();
  convertActions(rules[classId] || [], labelAt, blocks, featureById, classId, subclass.shortName, creation.maxLevel);
  for (const feature of features) {
    Object.assign(feature, FEATURE_EXTRAS[feature.id] || {});
    for (const option of feature.options || []) {
      if (option.blockId && !option.actions) fail(where, `選項說明段落 ${option.blockId} 沒有對應的跑團動作`);
    }
    for (const option of feature.options || []) {
      // 轉換期 ID 規則只適用於有跑團動作的能力：選項的舊段落與名稱 key 由渲染器依規則產生。
      if (option.compat !== Boolean(feature.actions)) fail(where, `${option.id} 的舊段落 ID 與該能力是否有跑團動作不一致`);
    }
  }
  // 子能力跑團版標題多出的文字，須等於渲染器自動產生的消耗字樣（資源名稱為定義該資源的能力名稱）。
  const resourceNames = new Map(features.filter(feature => feature.resource).map(feature => [feature.resource.key, feature.name]));
  for (const part of features.flatMap(feature => feature.parts || [])) {
    const resource = (part.actions || []).find(action => action.resource)?.resource;
    const cost = resource ? `消耗 1 次${resourceNames.get(resource) || fail(where, `找不到定義資源 ${resource} 的能力`)}` : "";
    const expected = cost ? (part.activation ? `，${cost}` : `（${cost}）`) : "";
    if (part.headingExtra !== expected) fail(where, `子能力 ${part.id} 的跑團標題字樣「${part.headingExtra}」與自動產生的「${expected}」不同`);
  }
  applyTableNames(features, creation.legacyFeatureColumn, where);
  return { creation, features, subclass };
}

// 特性表「職業特性」欄與能力名稱不同（例如「動作如潮（一次使用）」）時寫成 tableName；順序不同或對不上則停止。
// 有子職能力、但沒有選擇子職入口的等級，職業能力之後須是「子職特性」（render.js 自動產生）。
function applyTableNames(features, legacyColumn, where) {
  legacyColumn.forEach((cell, index) => {
    const level = index + 1;
    const own = features.filter(feature => feature.level === level && feature.name && !feature.subclass);
    const names = own.map(feature => feature.name);
    const hasSubclassFeature = features.some(feature => feature.level === level && feature.subclass);
    if (!own.length) {
      const expected = hasSubclassFeature ? "子職特性" : "-";
      if (cell !== expected) fail(where, `特性表第 ${level} 級「${cell}」應為「${expected}」`);
      return;
    }
    const entries = cell.split("，");
    if (hasSubclassFeature && !own.some(feature => feature.type === "subclass")) {
      if (entries.pop() !== "子職特性") fail(where, `特性表第 ${level} 級「${cell}」須以「子職特性」結尾`);
    }
    if (entries.length !== own.length) fail(where, `特性表第 ${level} 級「${cell}」與能力名稱「${names.join("，")}」數量不同`);
    own.forEach((feature, offset) => {
      if (entries[offset] === feature.name) return;
      if (names.includes(entries[offset])) fail(where, `特性表第 ${level} 級「${cell}」與能力順序不同`);
      feature.tableName = entries[offset];
    });
  });
}

const FEATURE_KEY_ORDER = ["id", "level", "name", "tableName", "type", "choose", "changeOn", "choiceGroup", "optionStyle", "behavior", "resource", "spells", "actions", "summary", "tabletop", "text", "parts", "afterFeatChoice", "options"];
const PART_KEY_ORDER = ["id", "name", "activation", "actions", "summary", "tabletop", "text"];
const OPTION_KEY_ORDER = ["id", "name", "attackNote", "actions", "text"];
const pick = (item, keys) => Object.fromEntries(keys.filter(key => item[key] !== undefined).map(key => [key, item[key]]));
function cleanFeature(feature) {
  const out = {};
  for (const key of FEATURE_KEY_ORDER) {
    if (feature[key] === undefined) continue;
    if ((key === "optionStyle" && feature[key] === "list") || (key === "choiceGroup" && !feature[key])) continue;
    out[key] = key === "options" ? feature.options.map(option => pick(option, OPTION_KEY_ORDER))
      : key === "parts" ? feature.parts.map(part => pick(part, PART_KEY_ORDER)) : feature[key];
  }
  return out;
}

function toYaml(data, schemaFile) {
  const document = new YAML.Document(data);
  YAML.visit(document, {
    Pair(key, pair) {
      const name = pair.key?.value;
      if (["saves", "from", "all", "any", "byLevel", "recover", "recoverByLevel", "append", "legacyKeys"].includes(name) && YAML.isCollection(pair.value)) pair.value.flow = true;
      if (["byLevel", "recoverByLevel"].includes(name)) pair.value.items.forEach(item => { item.key.value = Number(item.key.value); });
      // 內文一律用「|」區塊，行首的 **粗體** 不必加引號。
      if (["text", "tabletop", "afterFeatChoice"].includes(name) && YAML.isScalar(pair.value) && typeof pair.value.value === "string") {
        if (!pair.value.value.endsWith("\n")) pair.value.value += "\n";
        pair.value.type = "BLOCK_LITERAL";
      }
    },
    Scalar(key, node) {
      if (typeof node.value === "string" && node.value.includes("\n")) node.type = "BLOCK_LITERAL";
    }
  });
  return `# yaml-language-server: $schema=${schemaFile}\n${document.toString({ lineWidth: 0, indentSeq: true, flowCollectionPadding: false })}`;
}

function writeClass(classId, html) {
  const { creation, features, subclass } = convertClass(classId, html);
  const classFeatures = features.filter(feature => !feature.subclass);
  const subclassFeatures = features.filter(feature => feature.subclass);
  const classData = {
    id: classId,
    name: null,
    maxLevel: creation.maxLevel,
    subclassLevel: features.find(feature => feature.type === "subclass").level,
    defaultSubclass: subclass.id,
    tagline: creation.tagline,
    quote: creation.quote,
    primaryAbility: creation.primaryAbility,
    spellcasting: { progression: SPELLCASTING[classId] },
    hitDie: creation.hitDie,
    saves: creation.saves,
    skills: creation.skills,
    weapons: creation.weapons,
    tools: creation.tools,
    armor: creation.armor,
    equipment: creation.equipment,
    progression: creation.progression,
    ...(CLASS_VALUES[classId] ? { values: CLASS_VALUES[classId] } : {}),
    features: classFeatures.map(cleanFeature)
  };
  const legacyName = parse5.parseFragment(html);
  classData.name = textOf(findAll(legacyName, node => node.nodeName === "h3" && /特性表格$/.test(textOf(node)))[0]).replace(/特性表格$/, "");
  const subclassData = { id: subclass.id, class: classId, name: subclass.name, shortName: subclass.shortName, features: subclassFeatures.map(cleanFeature) };
  const dir = path.join(ROOT, "content", "srd");
  fs.mkdirSync(path.join(dir, "classes"), { recursive: true });
  fs.mkdirSync(path.join(dir, "subclasses"), { recursive: true });
  fs.writeFileSync(path.join(dir, "classes", `${classId}.yaml`), toYaml(classData, "../../schema/class.schema.json"));
  fs.writeFileSync(path.join(dir, "subclasses", `${classId}-${subclass.id}.yaml`), toYaml(subclassData, "../../schema/subclass.schema.json"));
  return { classId, subclassId: subclass.id, legacySkillText: creation.legacySkillText, legacyFeatureColumn: creation.legacyFeatureColumn };
}

if (require.main === module) {
  const legacy = loadLegacyClassFeatures();
  const ids = process.argv.slice(2);
  if (!ids.length) { console.error("用法：node tools/class-content/convert-legacy.js <職業 ID>…"); process.exit(1); }
  try {
    ids.forEach(id => {
      if (!legacy[id]) fail(id, "class-features.js 沒有這個職業");
      const result = writeClass(id, legacy[id]);
      console.log(`已轉換 ${result.classId}（子職 ${result.subclassId}）`);
    });
    droppedFallbacks.forEach(item => console.log(`ℹ 捨棄跑團後備文字（${item}）`));
  } catch (error) {
    if (!(error instanceof ConvertError)) throw error;
    console.error(`轉換失敗：${error.message}`);
    process.exit(1);
  }
}

module.exports = { convertClass };

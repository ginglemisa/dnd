// 一次性遷移工具：把舊版 class-features.js 的職業 HTML 機械轉成 content/srd 的 YAML，不改規則文字。
// 用法：node tools/class-content/convert-legacy.js barbarian ranger
// 遇到不認得的標記一律停止，避免靜默遺漏；轉換後以 compare.js 核對渲染結果。
"use strict";
const fs = require("fs");
const path = require("path");
const parse5 = require("parse5");
const YAML = require("yaml");
const { ROOT, loadLegacyClassFeatures, loadTipTables, loadLegacyClassActionRules } = require("./legacy");

// 能力 ID 的英文名（舊 HTML 沒有 data-action-id 的能力才需要；已有的照抄）。
const FEATURE_SLUGS = Object.freeze({
  無甲防禦: "unarmored-defense", 武器精通: "weapon-mastery", 險境感知: "danger-sense", 先祖學識: "primal-knowledge",
  屬性值提升: "ability-score-improvement", 無我狂暴: "mindless-rage", 野性直覺: "feral-instinct",
  施法: "spellcasting", 宿敵: "favored-enemy", 熟練探險家: "deft-explorer", 戰鬥風格: "fighting-style",
  戰術思維: "tactical-mind", 精通重擊: "improved-critical", 額外戰鬥風格: "additional-fighting-style",
  專精: "expertise", 盜賊黑話: "thieves-cant", 反射閃避: "evasion", 可靠才能: "reliable-talent"
});
const SUBCLASS_IDS = Object.freeze({ 狂戰士道途: "berserker", 獵人: "hunter", 勇士: "champion", 妙手: "thief" });
// 特性表欄位名稱（文字中以 {名稱|…} 引用）。
const COLUMN_KEYS = Object.freeze({
  狂暴次數: "rageUses", 狂暴傷害: "rageDamage", 武器精通: "weaponMastery",
  宿敵: "favoredEnemy", 準備法術: "preparedSpells", "１環": "spellSlots1", "２環": "spellSlots2",
  回氣: "secondWindUses", 偷襲: "sneakAttackDice"
});
// 舊版寫在 character-rules.js／action-panel.js 程式裡、HTML 沒有的機制；轉換時一併寫進內容檔。
const FEATURE_EXTRAS = Object.freeze({
  "barbarian-rage": { resource: { key: "barbarian-rage", uses: "rageUses", recover: { short: 1, long: "all" } } },
  // spell-sources.js：宿敵始終準備獵人印記，免費施放次數同特性表「宿敵」欄。
  "ranger-favored-enemy": { spells: [{ id: "hunters-mark", freeUses: "favoredEnemy" }] },
  // character-rules.js getCharacterResourceSpecs：回氣短休回 1 次；動作如潮短休或長休全回。
  "fighter-second-wind": { resource: { key: "fighter-second-wind", uses: "secondWindUses", recover: { short: 1, long: "all" } } },
  "fighter-action-surge": { resource: { key: "fighter-action-surge", uses: 1, recover: { short: "all", long: "all" } } }
});
// action-panel.js TABLETOP_VALUE_RESOLVERS 的公式（「職業-名稱」key）。
const CLASS_VALUES = Object.freeze({
  barbarian: { frenzyDice: "{rageDamage}d6" }, fighter: { secondWindHealing: "1d10 + {level}" },
  rogue: { cunningStrikeDc: "8 + {proficiencyBonus} + {dexModifier}" }
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
    if (node.nodeName === "span" && has(node, "data-tabletop-value")) {
      allowAttributes(node, ["data-tabletop-value"], where);
      if (node.childNodes.some(child => child.nodeName !== "#text")) fail(where, "數值標記內只能有文字");
      return `{${context.valueToken(attr(node, "data-tabletop-value"), where)}|${textOf(node)}}`;
    }
    return fail(where, `未處理的行內標記 <${node.nodeName} ${(node.attrs || []).map(item => item.name).join(" ")}>`);
  }).join("");
}

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
  if (Boolean(group) !== Boolean(feature.changeOn)) fail(where, "data-feature-choice-group 與 data-rest-change 須同時出現");
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
  const text = inlineToText(nodes, context, where);
  if (text) option.text = text;
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
  const pushBlock = text => { blocks.push(text); tabletopBlocks.push(text); };
  for (const node of nodes) {
    if (node.nodeName === "p" && has(node, "data-tabletop-hide")) {
      // 只在職業頁顯示的段落：不進跑團說明，也不進總覽。
      allowAttributes(node, ["data-tabletop-hide"], where);
      blocks.push(inlineToText(node.childNodes, context, where));
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
      const text = inlineToText(children, context, where);
      pushBlock(text);
      pushSummary(node, text);
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
      const lines = items.map(item => {
        allowAttributes(item, [], where);
        const children = [...item.childNodes];
        const lead = children.find(child => child.nodeName !== "#text" || child.value.trim());
        // 總覽隱藏的粗體標籤只影響 summary。
        const summaryChildren = lead?.nodeName === "strong" && has(lead, "data-overview-hide") ? children.filter(child => child !== lead) : children;
        if (summaryChildren !== children) {
          summaryUsed = true;
          lead.attrs = lead.attrs.filter(item => item.name !== "data-overview-hide");
        }
        summaryParts.push(inlineToText(summaryChildren, context, where));
        return `- ${indentContinuation(inlineToText(children, context, where))}`;
      });
      pushBlock(lines.join("\n"));
    } else if (node.nodeName === "div" && classes(node).includes("class-rule-subsection")) {
      const [heading, ...rest] = elements(node);
      if (heading?.nodeName !== "h4") fail(where, "小節須以 <h4> 開頭");
      pushBlock(`#### ${inlineToText(heading.childNodes, context, where)}`);
      const inner = convertBody(rest, feature, context, where);
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
  return { blocks, tabletopBlocks, tabletopUsed, summaryParts, summaryUsed };
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
    let previous;
    bodyRows.forEach((row, index) => {
      const raw = row[offset + 3];
      // 第一個數字是數值，前後文字為顯示格式（例如「+2」→ +{}、「1d6」→ {}d6）；同欄格式須一致。
      const parts = raw === "-" ? null : raw.match(/^(\D*)(\d+)(.*)$/);
      if (raw !== "-" && !parts) fail(where, `特性表數值「${raw}」無法轉成數字`);
      const value = parts ? Number(parts[2]) : null;
      if (parts) {
        const format = `${parts[1]}{}${parts[3]}`;
        if (format !== (column.format || "{}") && bodyRows.slice(0, index).some(other => other[offset + 3] !== "-")) fail(where, `特性表「${label}」欄的格式不一致：${raw}`);
        if (format !== "{}") column.format = format;
      }
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

function convertActions(rules, featureById, classId, subclassShortName) {
  for (const rule of rules) {
    const known = ["id", "mode", "level", "label", "key", "legacyKeys", "resourceKey", "descriptionId", "descriptionIds"];
    Object.keys(rule).forEach(name => { if (!known.includes(name)) fail(`${classId} 動作 ${rule.key}`, `未處理的欄位 ${name}`); });
    const [hostId, ...appended] = [].concat(rule.descriptionIds || rule.descriptionId);
    const host = featureById.get(hostId) || fail(classId, `動作 ${rule.key} 的說明段落 ${hostId} 不存在`);
    const action = { mode: rule.mode, key: rule.key };
    if (rule.legacyKeys) action.legacyKeys = [...rule.legacyKeys];
    const defaultLabel = `等級 ${host.level}：${host.name}${host.subclass ? `（${subclassShortName}子職）` : ""}`;
    if (rule.label !== defaultLabel) action.label = rule.label;
    if (rule.level !== host.level) action.level = rule.level;
    if (rule.resourceKey) action.resource = rule.resourceKey;
    if (appended.length) {
      action.append = appended.map(item => {
        const target = featureById.get(item.id) || fail(classId, `append 的段落 ${item.id} 不存在`);
        if (item.level !== target.level) fail(classId, `append ${item.id} 的等級 ${item.level} 與能力等級 ${target.level} 不同`);
        if (!target.appendedPrefix) fail(classId, `${item.id} 沒有跑團「名稱：」前綴`);
        return item.id;
      });
    }
    (host.actions ||= []).push(action);
  }
  for (const feature of featureById.values()) {
    if (feature.appendedPrefix && ![...featureById.values()].some(item => (item.actions || []).some(action => action.append?.includes(feature.id)))) {
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
      feature.id = attr(section, "data-action-id") || (slug ? `${classId}-${slug}${repeated ? `-${feature.level}` : ""}` : null);
      if (!feature.subclass && /子職$/.test(feature.name)) feature.type = "subclass";
      if (!feature.id && feature.type === "subclass") feature.id = `${classId}-subclass`;
      if (!feature.id) fail(at, `能力「${feature.name}」沒有 data-action-id，請加入 FEATURE_SLUGS`);
      body = rest;
    } else if (has(section, "data-action-id")) fail(at, "沒有標題的補充段落不應有 data-action-id");
    if (attr(section, "data-rest-change")) {
      if (attr(section, "data-rest-change") !== "either") fail(at, "只支援 data-rest-change=\"either\"");
      feature.changeOn = "rest";
    }
    const converted = convertBody(body, feature, { valueToken }, at);
    feature.text = converted.blocks.join("\n\n");
    if (converted.tabletopUsed) feature.tabletop = converted.tabletopBlocks.join("\n\n");
    if (converted.summaryUsed) feature.summary = converted.summaryParts.join("");
    if (feature.options) {
      const choose = feature.text.match(/選擇 (\d+) 項/);
      feature.choose = choose ? Number(choose[1]) : fail(at, "有選項但內文沒有「選擇 N 項」");
      for (const option of feature.options) {
        const suffix = option.id.startsWith(`${feature.id}-`) ? option.id.slice(feature.id.length + 1) : null;
        const expectedAction = suffix ? `${classId}-${suffix}` : null;
        if (option.legacyActionId && option.legacyActionId !== expectedAction) fail(at, `選項段落 ID ${option.legacyActionId} 不符命名規則`);
        if (option.tabletopName && option.tabletopName !== `${expectedAction}-name`) fail(at, `選項名稱 key ${option.tabletopName} 不符命名規則`);
        option.compat = Boolean(option.legacyActionId || option.tabletopName);
      }
    }
    return feature;
  });
  // 子職名稱取自「選擇子職」段落的「基本規則僅提供「…」」。
  const entry = features.find(feature => feature.type === "subclass") || fail(where, "找不到選擇子職的能力");
  const subclassName = entry.text.match(/僅提供「(.+?)」/)?.[1] || fail(where, "選擇子職的段落沒有子職名稱");
  subclass = { id: SUBCLASS_IDS[subclassName] || fail(where, `子職「${subclassName}」沒有 ID，請加入 SUBCLASS_IDS`), name: subclassName, shortName: subclass.shortName };

  const featureById = new Map(features.filter(feature => feature.id).map(feature => [feature.id, feature]));
  convertActions(loadLegacyClassActionRules()[classId] || [], featureById, classId, subclass.shortName);
  for (const feature of features) {
    Object.assign(feature, FEATURE_EXTRAS[feature.id] || {});
    for (const option of feature.options || []) {
      // 轉換期 ID 規則只適用於有跑團動作的能力：選項的舊段落與名稱 key 由渲染器依規則產生。
      if (option.compat !== Boolean(feature.actions)) fail(where, `${option.id} 的舊段落 ID 與該能力是否有跑團動作不一致`);
    }
  }
  applyTableNames(features, creation.legacyFeatureColumn, where);
  return { creation, features, subclass };
}

// 特性表「職業特性」欄與能力名稱不同（例如「動作如潮（一次使用）」）時寫成 tableName；順序不同或對不上則停止。
function applyTableNames(features, legacyColumn, where) {
  legacyColumn.forEach((cell, index) => {
    const level = index + 1;
    const own = features.filter(feature => feature.level === level && feature.name && !feature.subclass);
    const names = own.map(feature => feature.name);
    if (!own.length) {
      const expected = features.some(feature => feature.level === level && feature.subclass) ? "子職特性" : "-";
      if (cell !== expected) fail(where, `特性表第 ${level} 級「${cell}」應為「${expected}」`);
      return;
    }
    const entries = cell.split("，");
    if (entries.length !== own.length) fail(where, `特性表第 ${level} 級「${cell}」與能力名稱「${names.join("，")}」數量不同`);
    own.forEach((feature, offset) => {
      if (entries[offset] === feature.name) return;
      if (names.includes(entries[offset])) fail(where, `特性表第 ${level} 級「${cell}」與能力順序不同`);
      feature.tableName = entries[offset];
    });
  });
}

const FEATURE_KEY_ORDER = ["id", "level", "name", "tableName", "type", "choose", "changeOn", "optionStyle", "resource", "spells", "actions", "summary", "tabletop", "text", "options"];
function cleanFeature(feature) {
  const out = {};
  for (const key of FEATURE_KEY_ORDER) {
    if (feature[key] === undefined) continue;
    if (key === "optionStyle" && feature[key] === "list") continue;
    out[key] = key === "options" ? feature.options.map(({ id, name, text }) => (text ? { id, name, text } : { id, name })) : feature[key];
  }
  return out;
}

function toYaml(data, schemaFile) {
  const document = new YAML.Document(data);
  YAML.visit(document, {
    Pair(key, pair) {
      const name = pair.key?.value;
      if (["saves", "from", "all", "any", "byLevel", "recover", "append", "legacyKeys"].includes(name) && YAML.isCollection(pair.value)) pair.value.flow = true;
      if (name === "byLevel") pair.value.items.forEach(item => { item.key.value = Number(item.key.value); });
      // 內文一律用「|」區塊，行首的 **粗體** 不必加引號。
      if (["text", "tabletop"].includes(name) && YAML.isScalar(pair.value) && typeof pair.value.value === "string") {
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
  } catch (error) {
    if (!(error instanceof ConvertError)) throw error;
    console.error(`轉換失敗：${error.message}`);
    process.exit(1);
  }
}

module.exports = { convertClass };

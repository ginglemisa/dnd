// 由職業與子職內容產生職業頁 HTML（只供顯示）。輸出 data-* 標記供網站定位與過濾顯示（等級、子職、能力 ID 等），
// 規則一律讀 classRules，不從 HTML 反推；不輸出行內 style。
// 同樣的內容另以跑團版（context.view 為 "tabletop"／"overview"）產生各段落的跑團說明，依段落 ID 輸出給 action-panel.js。
"use strict";
const { ContentError } = require("../content/errors");
const { escapeHtml, renderInline, renderMarkdown } = require("../content/markdown");
const { BUILT_IN_VALUES, getActions } = require("./load");

const NUMBER_WORDS = Object.freeze({ 1: "一", 2: "兩", 3: "三", 4: "四" });

function getProficiencyBonus(level) {
  return Math.ceil(level / 4) + 1;
}

function getProgressionValue(column, level) {
  let value;
  for (const [from, entry] of Object.entries(column.byLevel)) if (Number(from) <= level) value = entry;
  return value ?? null;
}

function formatProgressionValue(column, level) {
  const value = getProgressionValue(column, level);
  if (value === null) return "-";
  return column.format ? column.format.replace("{}", String(value)) : String(value);
}

// 合併職業與子職能力：選子職的入口後接子職當級能力；其他等級的子職能力排在當級具名能力之後、補充說明之前。
// subclasses 可有多個（網站依目前選擇的子職只顯示其中一個），同一位置依子職順序排列。
function mergeFeatures(classDef, subclasses) {
  const merged = [];
  const subFeatures = subclasses.flatMap(subclass => subclass.features.map(feature => ({ feature, owner: subclass })));
  const levels = [...new Set([...classDef.features, ...subFeatures.map(item => item.feature)].map(feature => feature.level))].sort((a, b) => a - b);
  for (const level of levels) {
    const own = classDef.features.filter(feature => feature.level === level).map(feature => ({ feature, owner: classDef }));
    const sub = subFeatures.filter(item => item.feature.level === level);
    const entryIndex = own.findIndex(item => item.feature.type === "subclass");
    const insertAt = entryIndex >= 0 ? entryIndex + 1 : own.filter(item => item.feature.name).length;
    merged.push(...own.slice(0, insertAt), ...sub, ...own.slice(insertAt));
  }
  return merged;
}

// 子職順序：預設子職在前，其餘依載入順序（內容包、檔名）。
function orderedSubclasses(classDef) {
  return [...classDef.subclasses].sort((a, b) => (b.id === classDef.defaultSubclass) - (a.id === classDef.defaultSubclass));
}

function createRenderContext(classDef, subclasses) {
  const valueNames = new Set([...Object.keys(classDef.progression || {}), ...Object.keys(classDef.values || {}), ...Object.keys(BUILT_IN_VALUES)]);
  const merged = mergeFeatures(classDef, subclasses);
  const appended = new Set(merged.flatMap(({ feature }) => getActions(feature).flatMap(action => action.append || [])));
  // 子能力標題的消耗字樣：資源名稱是定義該資源的能力名稱。
  const resourceNames = new Map(merged.filter(({ feature }) => feature.resource).map(({ feature }) => [feature.resource.key, feature.name]));
  // 跑團版的 data-tabletop-value 是數值名稱（特性表欄位、values 或內建的 level／proficiencyBonus）；
  // 跑團模式由 character-rules.js 的 getClassValueText() 依 classRules 計算並套用 format。
  const resolveValue = (token, where) => {
    if (!valueNames.has(token)) throw new ContentError(`${where}：{${token}|…} 不是特性表欄位或 values`);
    return token;
  };
  return {
    classDef,
    subclasses,
    merged,
    appended,
    resourceNames,
    resolveValue
  };
}

function renderCreation(context) {
  const { classDef } = context;
  const where = `${classDef.file} 創角資訊`;
  // 行尾「\」換行輸出為 <br>（例如裝備的兩種組合）。
  const inline = text => text.split("\\\n").map(line => renderInline(line, context, where)).join("<br>");
  const { skills } = classDef;
  const skillTips = skills.from === "any" ? null : skills.from.map(name => `[[${name}]]`);
  const skillText = skillTips
    ? `從${skillTips.slice(0, -1).join("、")}${skillTips.length > 1 ? "和" : ""}${skillTips[skillTips.length - 1]}中選擇${NUMBER_WORDS[skills.choose]}項`
    : `任選${NUMBER_WORDS[skills.choose]}項技能`;
  const rows = [
    ["關鍵屬性", classDef.primaryAbility.all ? classDef.primaryAbility.all.join("與") : classDef.primaryAbility.any.join("或")],
    ["生命骰", `D${classDef.hitDie}，每級多一顆`],
    ["豁免熟練項", classDef.saves.join("、")],
    ["技能熟練項", inline(skillText)],
    ["武器熟練項", inline(classDef.weapons)],
    ["工具熟練項", inline(classDef.tools)],
    ["護甲訓練", inline(classDef.armor)],
    ["初始裝備", "(A)、(B) 二選一"],
    ["（A）", inline(classDef.equipment.A)],
    ["（B）", inline(classDef.equipment.B)]
  ];
  const progression = Object.values(classDef.progression || {});
  // 有子職能力的等級：只有子職能力時顯示「子職特性」；另有職業能力、但不是選擇子職的等級，接在職業能力之後。
  // 只有部分子職在該等級有能力時，「子職特性」包在 data-subclass（子職 ID 以空白分隔）裡，網站只留目前子職的文字。
  const featureNames = level => {
    const own = classDef.features.filter(feature => feature.level === level && feature.name);
    const withFeature = context.subclasses.filter(subclass => subclass.features.some(feature => feature.level === level));
    const names = own.map(feature => escapeHtml(feature.tableName || feature.name));
    if (!withFeature.length || own.some(feature => feature.type === "subclass")) return names.length ? names.join("，") : "-";
    if (withFeature.length === context.subclasses.length) return [...names, "子職特性"].join("，");
    const ids = withFeature.map(subclass => subclass.id).join(" ");
    return names.length
      ? `${names.join("，")}<span data-subclass="${ids}">，子職特性</span>`
      : `<span data-subclass="${ids}">子職特性</span><span data-subclass-except="${ids}">-</span>`;
  };
  const tableRows = Array.from({ length: classDef.maxLevel }, (unused, index) => {
    const level = index + 1;
    const cells = [String(level), `+${getProficiencyBonus(level)}`, ...progression.map(column => formatProgressionValue(column, level))].map(escapeHtml);
    cells.splice(2, 0, featureNames(level));
    return `<tr>${cells.map(cell => `<td>${cell}</td>`).join("")}</tr>`;
  });
  const headers = ["等級", "熟練加值", "職業特性", ...progression.map(column => column.label)];
  return `<section class="class-creation-content" data-class-feature-panel="creation">
<div class="class-feature-tagline">${inline(classDef.tagline)}</div>
<blockquote class="class-flavor-quote">${inline(classDef.quote)}</blockquote>
<section class="class-core-creation-info">
<h3>核心創角資訊</h3>
<table class="class-core-profile-table class-core-profile-table--${classDef.id}" aria-label="${escapeHtml(classDef.name)}核心創角資訊">
<tbody>
${rows.map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`).join("\n")}
</tbody>
</table>${classDef.equipment.note ? `<p class="class-core-equipment-note">${inline(classDef.equipment.note)}</p>` : ""}
</section>
<section class="class-feature-table-details" data-class-feature-table="${classDef.id}">
<h3>${escapeHtml(classDef.name)}特性表格</h3>
<div class="class-feature-table-wrap">
<table class="class-feature-table">
<thead><tr>${headers.map(header => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
<tbody>
${tableRows.join("\n")}
</tbody>
</table>
</div>
</section>
</section>`;
}

// 跑團版（context.view）的段落：依段落 ID 記進 context.blocks，內容為職業頁該段落元素的內部 HTML。
function addBlock(context, id, html) {
  if (!context.view) return;
  if (context.blocks.has(id)) throw new ContentError(`${context.classDef.file}：跑團說明段落 ID「${id}」重複`);
  context.blocks.set(id, html);
}

function renderOptions(feature, context, where) {
  const { classDef, view } = context;
  const inTabletop = Boolean(feature.actions);
  const cards = feature.optionStyle === "cards";
  const items = feature.options.map(option => {
    const at = `${where} 選項 ${option.name}`;
    // 卡片選項的第二段起（空一行分隔）接在標題列之後，寫法同 text（例如巫祝的檢定加值段落）。
    const [lead, ...more] = option.text ? option.text.replace(/\n+$/, "").split(/\n[ \t]*\n/) : [];
    if (more.length && (!cards || option.actions)) throw new ContentError(`${at}：只有卡片選項（且沒有 actions）的說明可分成多段`);
    const details = more.length ? renderMarkdown(more.join("\n\n"), context, at) : "";
    const lines = lead ? lead.split("\n") : [];
    const text = lines.map((line, index) => renderInline(index < lines.length - 1 ? line.replace(/\\$/, "") : line, context, at)).join("<br>");
    // 跑團版略過勾選框，改在「：」前顯示選項名稱（總覽的卡片選項連同「：」省略）；段落 ID 為「職業-選項名」。
    const label = view ? "" : `<label><input type="checkbox" id="${option.id}"> ${escapeHtml(option.name)}</label>`;
    const suffix = option.id.startsWith(`${feature.id}-`) ? option.id.slice(feature.id.length + 1) : null;
    if (inTabletop && !suffix) throw new ContentError(`${at}：跑團動作的選項 ID 須以「${feature.id}-」開頭`);
    const blockId = `${classDef.id}-${suffix}`;
    const separator = !inTabletop ? (text ? "：" : "")
      : !view ? "："
      : view === "overview" && cards ? "" : `${escapeHtml(option.name)}：`;
    // 選項自己的按鈕：說明段落為選項文字（不含勾選框與「：」），段落 ID 同為「職業-選項名」，取代整個選項的段落。
    if (option.actions && !suffix) throw new ContentError(`${at}：有 actions 的選項 ID 須以「${feature.id}-」開頭`);
    if (option.actions) addBlock(context, blockId, text);
    const body = `${label}${separator}${text}`;
    const inner = cards ? `<div class="druid-mission-option__heading">${body}</div>${details}` : body;
    if (inTabletop && !option.actions) addBlock(context, blockId, inner);
    return cards ? `<div class="druid-mission-option">${inner}</div>` : `<li>${inner}</li>`;
  }).join("");
  return cards ? `<div class="druid-mission-options">${items}</div>` : `<ul class="class-rule-list">${items}</ul>`;
}

// 下拉選擇卡片：選單（值存進角色資料）與卡片說明。第一個選項是空值的提示文字。
function renderSelectCard(select, markdownOptions, where) {
  const choices = [{ value: "", name: select.placeholder }, ...select.choices]
    .map(choice => `<option value="${escapeHtml(choice.value)}">${escapeHtml(choice.name)}</option>`).join("");
  const body = select.text ? `<div class="feature-choice-card__body">${renderMarkdown(select.text, markdownOptions, where)}</div>` : "";
  return `<article class="feature-choice-card"><select id="${select.id}">${choices}</select>${body}</article>`;
}

// 附錄：沒有等級的 section（例如術士的「超魔法選項」、契術師的「魔能祈喚選項」），接在所有能力之後；小節沿用舊版的通用 class。
// 有 kind 的附錄由網站做成選擇卡片（class-features-ui.js 讀 classRules 各小節的 html），職業頁的 section 加上
// data-class-appendix，職業能力頁籤據此略過。小節輸出成通用小節，標題為「名稱（先決條件：…）」或「名稱＋detail」。
// 超魔法（kind: metamagic）的小節照舊版換行排列（跑團的瞬發法術說明依換行分段），其他附錄的小節之間與小節內不換行（同舊版魔能祈喚的寫法）。
function appendixLines(item) {
  return item.kind === "metamagic";
}

function appendixPartHeadingSuffix(part) {
  return part.prerequisite ? `（先決條件：${escapeHtml(part.prerequisite)}）` : escapeHtml(part.detail || "");
}

function renderAppendixPartBody(item, part, context) {
  const where = `${context.classDef.file} 附錄 ${item.name} 附錄小節 ${part.name}`;
  return renderMarkdown(part.text, { ...context, plainHeadings: true, blockNewlines: appendixLines(item) }, where);
}

function renderAppendix(item, context) {
  const { classDef } = context;
  const where = `${classDef.file} 附錄 ${item.name}`;
  const lines = appendixLines(item);
  const parts = (item.parts || []).map(part => {
    const heading = `<h4>${escapeHtml(part.name)}${appendixPartHeadingSuffix(part)}</h4>`;
    const body = renderAppendixPartBody(item, part, context);
    return lines ? `<div class="class-rule-subsection">\n${heading}\n${body}\n</div>` : `<div class="class-rule-subsection">${heading}${body}</div>`;
  }).join(lines ? "\n" : "");
  const text = item.text ? `${renderMarkdown(item.text, { ...context, blockNewlines: true }, where)}${parts ? "\n" : ""}` : "";
  const kind = item.kind ? ` data-class-appendix="${item.kind}"` : "";
  return `<section class="${classDef.id}-feature class-feature-section"${kind}>\n<h3>${escapeHtml(item.name)}</h3>\n${text}${parts}\n</section>`;
}

// 跑團版的附錄小節段落：標題與內文。
function addAppendixBlocks(item, context) {
  (item.parts || []).filter(part => part.id).forEach(part => {
    addBlock(context, part.id, `<h4>${escapeHtml(part.name)}${appendixPartHeadingSuffix(part)}</h4>${renderAppendixPartBody(item, part, context)}`);
  });
}

// 併入其他動作說明的能力：跑團版說明前加「名稱：」。
function addAppendedPrefix(html, feature, where) {
  if (!/^<p[ >]/.test(html)) throw new ContentError(`${where}：被 append 的能力須以段落開頭`);
  return html.replace(/^<p([^>]*)>/, `<p$1><strong>${escapeHtml(feature.name)}：</strong>`);
}

// 子能力：外層能力內的小節。標題為「名稱（使用方式）」，按鈕消耗資源時跑團版加「，消耗 1 次［資源名稱］」。
function renderPart(part, feature, owner, context, where) {
  const { classDef } = context;
  const at = `${where} 子能力 ${part.name}`;
  const markdownOptions = { ...context, subsectionClass: `class-rule-subsection ${classDef.id}-rule-subsection` };
  const resource = (part.actions || []).find(action => action.resource)?.resource;
  const cost = resource && context.view ? `消耗 1 次${escapeHtml(context.resourceNames.get(resource) || "")}` : "";
  if (resource && !context.resourceNames.has(resource)) throw new ContentError(`${at}：找不到定義資源 ${resource} 的能力`);
  const activation = part.activation ? `（${escapeHtml(part.activation)}${cost ? `，${cost}` : ""}）` : (cost ? `（${cost}）` : "");
  const heading = `<h4>${escapeHtml(part.name)}${activation}</h4>`;
  const body = renderMarkdown(part.text, markdownOptions, at);
  addBlock(context, part.id, heading + (part.tabletop ? renderMarkdown(part.tabletop, markdownOptions, `${at} tabletop`) : body));
  if (part.summary && context.summaries) context.summaries[part.id] = renderInline(part.summary, context, `${at} summary`);
  return `<div class="class-rule-subsection ${classDef.id}-rule-subsection">${heading}${body}</div>`;
}

// 職業頁輸出能力的 <section>；跑團版（context.view）只記錄段落、回傳空字串。
// tabletop（跑團動作說明）取代跑團版的該段落，summary（跑團總覽一句話）記進 context.summaries（只在 tabletop 版）。
function renderFeature({ feature, owner }, context) {
  const { classDef } = context;
  const where = `${owner.file}（${feature.name || `等級 ${feature.level} 補充`}）`;
  const markdownOptions = { ...context, subsectionClass: `class-rule-subsection ${classDef.id}-rule-subsection` };
  const appended = context.appended.has(feature.id);
  // behavior：特殊排版模組（behaviors/<名稱>.js，load.js 已確認存在，且 text 有一個「#### 標題 {#名稱}」小節），
  // 由 renderMarkdown 把該小節交給它的 renderSubsection()。
  const behavior = feature.behavior ? { name: feature.behavior, ...require(`./behaviors/${feature.behavior}`) } : null;
  // 表格只出現在 text 與 tabletop，外框依出現順序取自 tables。
  const tableOptions = { ...markdownOptions, tables: feature.tables || [], behavior };
  let body = renderMarkdown(feature.text, tableOptions, where);
  if (context.view && appended && !feature.tabletop) body = addAppendedPrefix(body, feature, where);
  if (feature.summary && context.summaries) context.summaries[feature.id] = renderInline(feature.summary, context, `${where} summary`);
  // 可收合小節：預設收合，標題為粗體。
  if (feature.collapsible) body += feature.collapsible.map(item => `<details class="class-rule-subsection"><summary><strong>${escapeHtml(item.name)}</strong></summary>${renderMarkdown(item.text, markdownOptions, `${where} 可收合小節 ${item.name}`)}</details>`).join("");
  if (feature.parts) body += feature.parts.map(part => renderPart(part, feature, owner, context, where)).join("");
  if (feature.options) body += renderOptions(feature, context, where);
  if (feature.select) body += renderSelectCard(feature.select, markdownOptions, `${where} 下拉選擇卡片`);
  // 專長選單插在此段落之前（feat-ui.js）；4 級額外戲法選單讀取它的粗體標籤（class-features-ui.js）。
  if (feature.afterFeatChoice) body += renderMarkdown(feature.afterFeatChoice, { ...markdownOptions, blockAttributes: context.view ? "" : "data-after-feat-choice" }, `${where} afterFeatChoice`);
  // 插入點：網站程式插入控制項的空容器（例如 spell-sources.js 的魔法發現法術選單）。
  if (feature.mount) body += `<div id="${feature.mount.id}" class="${feature.mount.id}" aria-label="${escapeHtml(feature.mount.label)}"></div>`;
  if (context.view) {
    if (!feature.id) return "";
    // tabletop 可省略只在職業頁顯示的表格（例如荒野形態的野獸形態進程表）。
    const tabletop = feature.tabletop ? renderMarkdown(feature.tabletop, { ...tableOptions, tablesOptional: true }, `${where} tabletop`) : null;
    addBlock(context, feature.id, tabletop === null ? body : appended ? addAppendedPrefix(tabletop, feature, `${where} tabletop`) : tabletop);
    return "";
  }
  // 子職能力加上 data-subclass（子職 ID），網站只顯示目前選擇的子職。data-feature-id（能力 ID）是網站在職業頁找能力段落的錨點。
  const attributes = [
    `class="${classDef.id}-feature class-feature-section"`,
    `data-feature-level="${feature.level}"`,
    owner === classDef ? "" : `data-subclass="${owner.id}"`,
    feature.id ? `data-feature-id="${feature.id}"` : ""
  ].filter(Boolean).join(" ");
  const suffix = owner === classDef ? "" : `（${escapeHtml(owner.shortName)}子職）`;
  const heading = feature.name ? `<h3>等級 ${feature.level}：${escapeHtml(feature.name)}${suffix}</h3>` : "";
  return `<section ${attributes}>${heading}${body}</section>`;
}

// 網站跑團說明讀取的段落（action-panel.js）：每個能力與子能力、動作的說明段落（含 append 併入的能力）、
// 有按鈕的選項與只顯示勾選選項的選項段落、附錄小節的按鈕。缺少任一段落時建置失敗。
function checkTabletopBlocks(context, tabletop) {
  const { classDef } = context;
  const ids = context.merged.flatMap(({ feature }) => [
    feature.id,
    ...(feature.parts || []).map(part => part.id),
    ...getActions(feature).flatMap(action => action.append || []),
    ...(feature.options || [])
      .filter(option => option.actions || (feature.actions || []).some(action => action.selectedOptionOnly))
      .map(option => `${classDef.id}-${option.id.slice(feature.id.length + 1)}`)
  ]).concat((classDef.appendix || []).flatMap(item => (item.parts || []).filter(part => part.actions).map(part => part.id)));
  const missing = [...new Set(ids.filter(Boolean))].filter(id => !Object.hasOwn(tabletop, id));
  if (missing.length) throw new ContentError(`${classDef.file}：找不到跑團說明段落 ${missing.join("、")}`);
}

// 回傳 html（與舊版 classFeatures[classId] 對應，含全部子職的能力）、tabletop 與 summaries（段落 ID → 跑團版 HTML），
// 以及附錄小節的內文 HTML。tabletop 是每個段落的跑團動作說明（內容檔的 tabletop 優先）；summaries 是跑團總覽與 tabletop
// 不同時的版本（內容檔的 summary 優先，其次是省略卡片選項名稱的總覽版）。
function renderClass(classDef) {
  const context = createRenderContext(classDef, orderedSubclasses(classDef));
  const features = [...context.merged.map(item => renderFeature(item, context)), ...(classDef.appendix || []).map(item => renderAppendix(item, context))].join("\n");
  const html = `${renderCreation(context)}
<div class="class-feature-content" data-class-feature-panel="class">
${features}
</div>
`;
  const summaries = {};
  const [tabletop, overview] = ["tabletop", "overview"].map(view => {
    const viewContext = { ...context, view, blocks: new Map(), summaries: view === "tabletop" ? summaries : null };
    context.merged.forEach(item => renderFeature(item, viewContext));
    (classDef.appendix || []).forEach(item => addAppendixBlocks(item, viewContext));
    return Object.fromEntries(viewContext.blocks);
  });
  for (const [id, text] of Object.entries(overview)) if (text !== tabletop[id] && !Object.hasOwn(summaries, id)) summaries[id] = text;
  checkTabletopBlocks(context, tabletop);
  // 附錄小節的內文 HTML（依附錄、小節順序），由 rules-data.js 放進 classRules 供選擇卡片使用。
  const appendix = (classDef.appendix || []).map(item => (item.parts || []).map(part => renderAppendixPartBody(item, part, context)));
  return { html, tabletop, summaries, appendix };
}

module.exports = { renderClass, mergeFeatures, orderedSubclasses, getProgressionValue };

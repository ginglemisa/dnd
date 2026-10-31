// 由職業與子職內容產生職業頁 HTML。轉換期輸出與舊版 classFeatures 相同的結構與 data-* 標記，
// 讓 class-features-ui.js、action-panel.js、pdf-field-map.js 等暫時照舊讀取；不輸出行內 style。
"use strict";
const { ContentError, escapeHtml, renderInline, renderMarkdown } = require("./markdown");
const { BUILT_IN_VALUES, getActions } = require("./load");

const NUMBER_WORDS = Object.freeze({ 1: "一", 2: "兩", 3: "三", 4: "四" });
const kebab = name => name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

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
function mergeFeatures(classDef, subclass) {
  const merged = [];
  const levels = [...new Set([...classDef.features, ...(subclass?.features || [])].map(feature => feature.level))].sort((a, b) => a - b);
  for (const level of levels) {
    const own = classDef.features.filter(feature => feature.level === level).map(feature => ({ feature, owner: classDef }));
    const sub = (subclass?.features || []).filter(feature => feature.level === level).map(feature => ({ feature, owner: subclass }));
    const entryIndex = own.findIndex(item => item.feature.type === "subclass");
    const insertAt = entryIndex >= 0 ? entryIndex + 1 : own.filter(item => item.feature.name).length;
    merged.push(...own.slice(0, insertAt), ...sub, ...own.slice(insertAt));
  }
  return merged;
}

function createRenderContext(classDef, subclass) {
  const valueNames = new Set([...Object.keys(classDef.progression || {}), ...Object.keys(classDef.values || {})]);
  const merged = mergeFeatures(classDef, subclass);
  const appended = new Set(merged.flatMap(({ feature }) => getActions(feature).flatMap(action => action.append || [])));
  // 子能力標題的消耗字樣：資源名稱是定義該資源的能力名稱。
  const resourceNames = new Map(merged.filter(({ feature }) => feature.resource).map(({ feature }) => [feature.resource.key, feature.name]));
  // 只引用另一個數值並帶 format 的值（例如 stunningStrikeDc: { formula: "{saveDc}", format: （DC {}） }）。
  const aliasOf = token => {
    const value = classDef.values?.[token];
    return value?.format ? value.formula.match(/^\{([A-Za-z][A-Za-z0-9]*)\}$/)?.[1] : undefined;
  };
  // 轉換期沿用 action-panel.js 的 TABLETOP_VALUE_RESOLVERS key：內建數值另有固定 key，其餘為「職業-欄位名」。
  // 帶 format 的值：舊版計算函式已含外框時用自己的 key；只引用另一個數值時用被引用值的 key，外框由 valueFrame 輸出。
  const resolveValue = (token, where) => {
    if (Object.hasOwn(BUILT_IN_VALUES, token)) return BUILT_IN_VALUES[token];
    if (!valueNames.has(token)) throw new ContentError(`${where}：{${token}|…} 不是特性表欄位或 values`);
    if (aliasOf(token)) return resolveValue(aliasOf(token), where);
    return `${classDef.id}-${kebab(token)}`;
  };
  return {
    classDef,
    subclass,
    merged,
    appended,
    resourceNames,
    resolveValue,
    valueFrame(token) {
      return aliasOf(token) ? classDef.values[token].format.split("{}") : null;
    }
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
  const featureNames = level => {
    const own = classDef.features.filter(feature => feature.level === level && feature.name);
    const hasSubclassFeature = (context.subclass?.features || []).some(feature => feature.level === level);
    const names = own.map(feature => feature.tableName || feature.name);
    if (hasSubclassFeature && !own.some(feature => feature.type === "subclass")) names.push("子職特性");
    return names.length ? names.join("，") : "-";
  };
  const tableRows = Array.from({ length: classDef.maxLevel }, (unused, index) => {
    const level = index + 1;
    const cells = [String(level), `+${getProficiencyBonus(level)}`, featureNames(level), ...progression.map(column => formatProgressionValue(column, level))];
    return `<tr>${cells.map(cell => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`;
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

function renderOptions(feature, context, where) {
  const { classDef } = context;
  const inTabletop = Boolean(feature.actions);
  const cards = feature.optionStyle === "cards";
  const items = feature.options.map(option => {
    const at = `${where} 選項 ${option.name}`;
    const lines = option.text ? option.text.replace(/\n+$/, "").split("\n") : [];
    const text = lines.map((line, index) => renderInline(index < lines.length - 1 ? line.replace(/\\$/, "") : line, context, at)).join("<br>");
    const group = feature.changeOn || feature.choiceGroup ? ` data-feature-choice-group="${feature.id}"` : "";
    const label = `<label><input type="checkbox" id="${option.id}"${group}> ${escapeHtml(option.name)}</label>`;
    // 轉換期：跑團說明的「名稱：」沿用 TABLETOP_VALUE_RESOLVERS 的 -name key，段落 ID 為「職業-選項名」。
    const suffix = option.id.startsWith(`${feature.id}-`) ? option.id.slice(feature.id.length + 1) : null;
    if (inTabletop && !suffix) throw new ContentError(`${at}：跑團動作的選項 ID 須以「${feature.id}-」開頭`);
    const actionId = inTabletop ? ` data-action-id="${classDef.id}-${suffix}"` : "";
    const separator = inTabletop
      ? `<span data-tabletop-value="${classDef.id}-${suffix}-name"${cards ? " data-overview-hide" : ""}>：</span>`
      : (text ? "：" : "");
    // 選項自己的按鈕：說明段落為選項文字（不含勾選框與「：」），段落 ID 同為「職業-選項名」。
    if (option.actions && !suffix) throw new ContentError(`${at}：有 actions 的選項 ID 須以「${feature.id}-」開頭`);
    const optionText = option.actions ? `<span data-action-id="${classDef.id}-${suffix}">${text}</span>` : text;
    const body = `${label}${separator}${optionText}`;
    return cards
      ? `<div class="druid-mission-option"${actionId}><div class="druid-mission-option__heading">${body}</div></div>`
      : `<li${actionId}>${body}</li>`;
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

// 附錄：沒有等級的 section（例如術士的「超魔法選項」），接在所有能力之後；小節沿用舊版的通用 class。
// class-features-ui.js 以字串切出各選項（fillMetamagicTextsFromClassFeatures），action-panel.js 再依換行分段，
// 故標籤之間照舊版換行，讓切出的文字與舊版相同。
// 附錄小節（parts）輸出成通用小節，帶 id 時加 data-action-id（跑團按鈕的說明段落）；標題為「名稱（先決條件：…）」。
// class-features-ui.js／quick-build.js 以名稱切出各魔能祈喚的 HTML 字串，故小節之間與小節內不換行（同舊版同一行的寫法）。
function renderAppendix(item, context) {
  const { classDef } = context;
  const where = `${classDef.file} 附錄 ${item.name}`;
  const parts = (item.parts || []).map(part => {
    const id = part.id ? ` data-action-id="${part.id}"` : "";
    const prerequisite = part.prerequisite ? `（先決條件：${escapeHtml(part.prerequisite)}）` : "";
    const body = renderMarkdown(part.text, { ...context, plainHeadings: true }, `${where} 附錄小節 ${part.name}`);
    return `<div class="class-rule-subsection"${id}><h4>${escapeHtml(part.name)}${prerequisite}</h4>${body}</div>`;
  }).join("");
  return `<section class="${classDef.id}-feature class-feature-section">\n<h3>${escapeHtml(item.name)}</h3>\n${renderMarkdown(item.text, { ...context, blockNewlines: true }, where)}${parts ? `\n${parts}` : ""}\n</section>`;
}

// 併入其他動作說明的能力：跑團說明前加「名稱：」，職業頁由 styles.css 隱藏。
function addAppendedPrefix(html, feature, where) {
  if (!/^<p[ >]/.test(html)) throw new ContentError(`${where}：被 append 的能力須以段落開頭`);
  return html.replace(/^<p([^>]*)>/, `<p$1><strong data-tabletop-only hidden>${escapeHtml(feature.name)}：</strong>`);
}

// 子能力：外層能力內帶 data-action-id 的小節。標題為「名稱（使用方式）」，按鈕消耗資源時跑團版加「，消耗 1 次［資源名稱］」。
function renderPart(part, feature, owner, context, where) {
  const { classDef } = context;
  const at = `${where} 子能力 ${part.name}`;
  const markdownOptions = { ...context, subsectionClass: `class-rule-subsection ${classDef.id}-rule-subsection` };
  const resource = (part.actions || []).find(action => action.resource)?.resource;
  const cost = resource ? `消耗 1 次${escapeHtml(context.resourceNames.get(resource) || "")}` : "";
  if (resource && !context.resourceNames.has(resource)) throw new ContentError(`${at}：找不到定義資源 ${resource} 的能力`);
  const activation = part.activation
    ? `（${escapeHtml(part.activation)}${cost ? `<span data-tabletop-only hidden>，${cost}</span>` : ""}）`
    : (cost ? `<span data-tabletop-only hidden>（${cost}）</span>` : "");
  const heading = `<h4>${escapeHtml(part.name)}${activation}</h4>`;
  if (part.tabletop) context.tabletop[part.id] = heading + renderMarkdown(part.tabletop, markdownOptions, `${at} tabletop`);
  if (part.summary) context.summaries[part.id] = renderInline(part.summary, context, `${at} summary`);
  return `<div class="class-rule-subsection ${classDef.id}-rule-subsection" data-action-id="${part.id}">${heading}${renderMarkdown(part.text, markdownOptions, at)}</div>`;
}

// tabletop（跑團動作說明）與 summary（跑團總覽一句話）不放進職業頁 HTML，另以資料輸出給 action-panel.js。
function renderFeature({ feature, owner }, context) {
  const { classDef } = context;
  const where = `${owner.file}（${feature.name || `等級 ${feature.level} 補充`}）`;
  const markdownOptions = { ...context, subsectionClass: `class-rule-subsection ${classDef.id}-rule-subsection` };
  const appended = context.appended.has(feature.id);
  // behavior：特殊機制模組（behaviors/<名稱>.js，load.js 已確認存在）。decorateText() 在 text 的 HTML 加上網站程式辨識的標記，
  // afterText() 回傳接在內文後的 HTML；兩者皆可省略。
  const behavior = feature.behavior ? require(`./behaviors/${feature.behavior}`) : null;
  // 表格只出現在 text 與 tabletop，外框依出現順序取自 tables。
  const tableOptions = { ...markdownOptions, tables: feature.tables || [] };
  let body = renderMarkdown(feature.text, tableOptions, where);
  if (behavior?.decorateText) body = behavior.decorateText(body, where);
  if (appended && !feature.tabletop) body = addAppendedPrefix(body, feature, where);
  if (feature.tabletop) {
    const tabletop = renderMarkdown(feature.tabletop, tableOptions, `${where} tabletop`);
    context.tabletop[feature.id] = appended ? addAppendedPrefix(tabletop, feature, `${where} tabletop`) : tabletop;
  }
  if (feature.summary) context.summaries[feature.id] = renderInline(feature.summary, context, `${where} summary`);
  // 可收合小節：預設收合，標題為粗體。
  if (feature.collapsible) body += feature.collapsible.map(item => `<details class="class-rule-subsection"><summary><strong>${escapeHtml(item.name)}</strong></summary>${renderMarkdown(item.text, markdownOptions, `${where} 可收合小節 ${item.name}`)}</details>`).join("");
  if (feature.parts) body += feature.parts.map(part => renderPart(part, feature, owner, context, where)).join("");
  if (feature.options) body += renderOptions(feature, context, where);
  if (feature.select) body += renderSelectCard(feature.select, markdownOptions, `${where} 下拉選擇卡片`);
  // 專長選單插在此段落之前（feat-ui.js）；4 級額外戲法選單讀取它的粗體標籤（class-features-ui.js）。
  if (feature.afterFeatChoice) body += renderMarkdown(feature.afterFeatChoice, { ...markdownOptions, blockAttributes: "data-after-feat-choice" }, `${where} afterFeatChoice`);
  if (behavior?.afterText) body += behavior.afterText(feature, context);
  const attributes = [
    `class="${classDef.id}-feature class-feature-section"`,
    `data-feature-level="${feature.level}"`,
    feature.changeOn ? `data-rest-change="either"` : "",
    feature.id ? `data-action-id="${feature.id}"` : ""
  ].filter(Boolean).join(" ");
  const suffix = owner === classDef ? "" : `（${escapeHtml(owner.shortName)}子職）`;
  const heading = feature.name ? `<h3>等級 ${feature.level}：${escapeHtml(feature.name)}${suffix}</h3>` : "";
  return `<section ${attributes}>${heading}${body}</section>`;
}

// 回傳 html（與舊版 classFeatures[classId] 對應）、tabletop 與 summaries（能力 ID → 行內 HTML）。
function renderClass(classDef, subclass = classDef.subclasses.find(item => item.id === classDef.defaultSubclass)) {
  const context = { ...createRenderContext(classDef, subclass), tabletop: {}, summaries: {} };
  const features = [...context.merged.map(item => renderFeature(item, context)), ...(classDef.appendix || []).map(item => renderAppendix(item, context))].join("\n");
  const html = `${renderCreation(context)}
<div class="class-feature-content" data-class-feature-panel="class">
${features}
</div>
`;
  return { html, tabletop: context.tabletop, summaries: context.summaries };
}

module.exports = { renderClass, mergeFeatures, getProgressionValue };

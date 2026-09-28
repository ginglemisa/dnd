/**
 * 法術與裝備搜尋 UI（傳統 defer script，無額外 runtime dependency）。
 *
 * 其他專案整合契約：
 * - 沿用 index.html 的 spell-search-*、equipment-search-* 表單／結果 DOM，
 *   以及 styles.css 對應的搜尋與 equipment-detail-* 樣式。
 * - 法術來源：SpellCatalog.getAllSpells/getClassIds/getDisplayName；
 *   結果點擊交給 window.autoPrepareSpellFromFeature(spellId, trigger)，
 *   由宿主負責詳情、準備法術與角色資料保存。
 * - 裝備來源：equipment-data.js 的 globalThis 陣列，及 equipment-notes.js
 *   產生的 #equipment-notes-section（summary、小文字區、購買連結結構需相容）。
 *   索引於首次搜尋建立；務必等資料與說明 DOM 就緒再開放操作。
 * - 此檔放在 equipment-data.js 之後，以帶版本的 <script defer src> 載入。
 *   HTML 與 CSS 不由此檔產生；搜尋開關／切頁由 scroll-to-top.js 負責。
 * - 保留 window.searchAllSpells、clearSpellSearchResults、applyEquipmentFilter，
 *   供浮動工具列與 onboarding-tour.js 還原狀態使用。
 * - 搜尋輸入為暫存狀態；宿主的分享與 autosave 仍須排除這兩個輸入欄位。
 */
(function (globalScope) {
  "use strict";

  function escapeRegExp(text) {
    return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // 法術搜尋
  const SPELL_SEARCH_CLASS_LABELS = {
    // 跨專案支援；實際法術歸屬由 SpellCatalog.getClassIds() 的 artificer 決定。
    artificer: "奇械師",
    bard: "吟遊詩人",
    cleric: "牧師",
    druid: "德魯伊",
    paladin: "聖騎士",
    ranger: "遊俠",
    sorcerer: "術士",
    warlock: "契術師",
    wizard: "法師"
  };
  const SPELL_SEARCH_CLASS_SHORT_LABELS = {
    artificer: "奇",
    bard: "吟",
    cleric: "牧",
    druid: "德",
    paladin: "聖",
    ranger: "遊",
    sorcerer: "術",
    warlock: "契",
    wizard: "法"
  };
  const SPELL_SEARCH_LEVEL_LABELS = {
    cantrips: "戲法",
    "1": "一環",
    "2": "二環",
    "3": "三環",
    "4": "四環",
    "5": "五環",
    "6": "六環",
    "7": "七環",
    "8": "八環",
    "9": "九環"
  };
  const SPELL_SEARCH_LEVEL_ORDER = ["cantrips", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const SPELL_SEARCH_CLASS_ALIASES = {
    ...Object.fromEntries(Object.entries(SPELL_SEARCH_CLASS_LABELS).map(([classId, label]) => [label, classId])),
    "詩人": "bard",
    "小D": "druid",
    "小德": "druid",
    "聖騎": "paladin",
    "契術": "warlock",
    "邪術": "warlock",
    "邪術師": "warlock",
    "魔導": "warlock",
    "魔導師": "warlock",
    "魔導士": "warlock",
    "奇械": "artificer"
  };
  let spellSearchIndex = null;

  function initializeSpellSearchIndex() {
    if (spellSearchIndex) return;
    spellSearchIndex = SpellCatalog.getAllSpells().map(spell => ({
      spellId: spell.spellId,
      spell,
      levelKey: spell.level === 0 ? "cantrips" : String(spell.level),
      classKeys: SpellCatalog.getClassIds(spell.spellId),
      searchText: `${spell.nameZh}\n${spell.nameEn}\n${SpellCatalog.getDisplayName(spell.spellId)}\n${spell.desc}`.toLowerCase()
    }));
  }

  function parseSpellClassSearch(keyword) {
    const query = keyword.replace(/\s+/g, "");
    for (const [alias, classId] of Object.entries(SPELL_SEARCH_CLASS_ALIASES)) {
      if (!query.startsWith(alias)) continue;
      const suffix = query.slice(alias.length);
      if (suffix === "法術") return { classId, levelKey: null };
      const levelText = suffix.replace(/法術$/, "");
      const levelKey = SPELL_SEARCH_LEVEL_ORDER.find(key =>
        levelText === SPELL_SEARCH_LEVEL_LABELS[key] || (key !== "cantrips" && levelText === `${key}環`)
      );
      if (levelKey) return { classId, levelKey };
    }
    return null;
  }

  function clearSpellSearchResults() {
    const results = document.getElementById("spell-search-results");
    const summary = document.getElementById("spell-search-summary");
    const list = document.getElementById("spell-search-result-list");
    if (summary) summary.textContent = "";
    if (list) list.replaceChildren();
    results?.classList.add("is-hidden");
  }

  function searchAllSpells() {
    const searchInput = document.getElementById("spell-search");
    const results = document.getElementById("spell-search-results");
    const summary = document.getElementById("spell-search-summary");
    const list = document.getElementById("spell-search-result-list");
    const keyword = (searchInput?.value || "").trim();
    if (!keyword || !results || !summary || !list) {
      clearSpellSearchResults();
      return;
    }
    initializeSpellSearchIndex();
    const classSearch = parseSpellClassSearch(keyword);
    const matches = (spellSearchIndex || []).filter(match => classSearch
      ? match.classKeys.includes(classSearch.classId) && (!classSearch.levelKey || match.levelKey === classSearch.levelKey)
      : match.searchText.includes(keyword.toLowerCase()));
    if (classSearch) matches.sort((a, b) => a.spell.level - b.spell.level || a.spell.nameEn.localeCompare(b.spell.nameEn, "en"));
    const groupedMatches = new Map();
    matches.forEach(match => {
      const groupKey = `${match.levelKey}\u0000${match.spellId}`;
      const group = groupedMatches.get(groupKey);
      if (group) group.classKeys.push(...match.classKeys);
      else groupedMatches.set(groupKey, { spellId: match.spellId, spell: match.spell, levelKey: match.levelKey, classKeys: [...match.classKeys] });
    });
    const fragment = document.createDocumentFragment();
    groupedMatches.forEach(({ spellId, levelKey, classKeys }) => {
      const row = document.createElement("div");
      row.className = "spell-search-result-item";
      row.setAttribute("role", "listitem");
      const labels = [...new Set(classKeys)].map(classId => SPELL_SEARCH_CLASS_SHORT_LABELS[classId] || SPELL_SEARCH_CLASS_LABELS[classId] || classId).join("");
      row.append(`(${labels})${SPELL_SEARCH_LEVEL_LABELS[levelKey] || levelKey}-`);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "spell-search-result-name";
      button.textContent = SpellCatalog.getDisplayName(spellId) || "";
      button.setAttribute("aria-label", `查看${button.textContent}的法術詳情`);
      button.addEventListener("click", () => globalScope.autoPrepareSpellFromFeature(spellId, button));
      row.appendChild(button);
      fragment.appendChild(row);
    });
    list.replaceChildren(fragment);
    summary.textContent = groupedMatches.size ? `找到 ${groupedMatches.size} 筆結果`
      : classSearch ? `找不到符合「${keyword}」的法術` : `找不到包含「${keyword}」的法術`;
    results.classList.remove("is-hidden");
  }

  document.getElementById("spell-search-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    searchAllSpells();
  });

  // 裝備搜尋與結果詳情
  function splitEquipmentSearchText(text) {
    return String(text || "")
      .split(/\n\s*\n+/)
      .map(chunk => chunk.trim())
      .filter(Boolean);
  }

  function buildTextSegment(text) {
    const normalized = String(text || "").trim();
    return normalized ? { type: "text", text: normalized, matchText: normalized.toLowerCase() } : null;
  }

  function buildTableSegment(preamble, tableNode) {
    const preambleText = String(preamble || "").trim();
    const tableText = (tableNode?.innerText || tableNode?.textContent || "").trim();
    const matchText = [preambleText, tableText].filter(Boolean).join("\n").toLowerCase();
    if (!matchText) return null;
    return {
      type: "table-bundle",
      text: preambleText,
      tableHtml: tableNode?.outerHTML || "",
      matchText
    };
  }

  function createHighlightedFragment(text, keyword) {
    const fragment = document.createDocumentFragment();
    const source = String(text || "");
    const needle = String(keyword || "").trim();
    if (!needle) {
      fragment.appendChild(document.createTextNode(source));
      return fragment;
    }

    const pattern = new RegExp(`(${escapeRegExp(needle)})`, "gi");
    let lastIndex = 0;

    source.replace(pattern, (match, _group, offset) => {
      if (offset > lastIndex) {
        fragment.appendChild(document.createTextNode(source.slice(lastIndex, offset)));
      }
      const mark = document.createElement("mark");
      mark.className = "equipment-search-highlight";
      mark.textContent = match;
      fragment.appendChild(mark);
      lastIndex = offset + match.length;
      return match;
    });

    if (lastIndex < source.length) {
      fragment.appendChild(document.createTextNode(source.slice(lastIndex)));
    }

    return fragment;
  }

  function createEquipmentSearchBlock(segment, keyword = "") {
    const block = document.createElement("div");
    block.className = "equipment-search-block";
    block.style.whiteSpace = "pre-line";

    if (segment?.type === "table-bundle") {
      if (segment.text) {
        const textBlock = document.createElement("div");
        textBlock.style.whiteSpace = "pre-line";
        textBlock.appendChild(createHighlightedFragment(segment.text, keyword));
        block.appendChild(textBlock);
      }

      if (segment.tableHtml) {
        const tableWrap = document.createElement("div");
        tableWrap.className = "equipment-search-table-wrap";
        tableWrap.innerHTML = segment.tableHtml;
        const table = tableWrap.querySelector("table");
        if (table && keyword) {
          Array.from(table.querySelectorAll("th, td")).forEach((cell) => {
            const cellText = cell.textContent || "";
            cell.textContent = "";
            cell.appendChild(createHighlightedFragment(cellText, keyword));
          });
        }
        block.appendChild(tableWrap);
      }
      return block;
    }

    block.appendChild(createHighlightedFragment(segment?.text || "", keyword));
    return block;
  }

  function getEquipmentTableSegments(body) {
    const segments = [];
    let textBuffer = "";

    const pushTextSegments = () => {
      splitEquipmentSearchText(textBuffer).forEach((segment) => {
        const textSegment = buildTextSegment(segment);
        if (textSegment) segments.push(textSegment);
      });
      textBuffer = "";
    };

    Array.from(body?.childNodes || []).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        textBuffer += node.textContent || "";
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const tagName = node.tagName.toUpperCase();
      if (tagName === "BR") {
        textBuffer += "\n";
        return;
      }

      if (tagName === "TABLE") {
        const preambleSegments = splitEquipmentSearchText(textBuffer);
        const standaloneSegments = preambleSegments.slice(0, -1);
        standaloneSegments.forEach((segment) => {
          const textSegment = buildTextSegment(segment);
          if (textSegment) segments.push(textSegment);
        });
        const preamble = preambleSegments[preambleSegments.length - 1] || textBuffer.trim();
        const tableSegment = buildTableSegment(preamble, node);
        if (tableSegment) segments.push(tableSegment);
        textBuffer = "";
        return;
      }

      // 購買連結會把「強酸（25 金幣）」等品名中的名稱包成 <a>。
      // 此處若在行內元素後補換行，名稱與價格會被拆成兩行，進而無法建立搜尋索引。
      textBuffer += node.textContent || "";
    });

    pushTextSegments();
    return segments.filter(Boolean);
  }

  const equipmentSegmentBuilders = [
    {
      key: "table-bundle",
      match: (_detail, body) => Boolean(body?.querySelector("table")),
      build: (_detail, body) => getEquipmentTableSegments(body)
    },
    {
      key: "blank-line",
      match: () => true,
      build: (_detail, _body, sourceText) => splitEquipmentSearchText(sourceText)
        .map((segment) => buildTextSegment(segment))
        .filter(Boolean)
    }
  ];

  function getEquipmentSegments(detail, body, sourceText) {
    const builder = equipmentSegmentBuilders.find((candidate) => candidate.match(detail, body));
    return builder ? builder.build(detail, body, sourceText) : [];
  }

  const EQUIPMENT_SEARCH_CATALOGS = [
    { source: "weapons_simple_melee", category: "武器", subtype: "簡易近戰武器", kind: "weapon" },
    { source: "weapons_simple_ranged", category: "武器", subtype: "簡易遠程武器", kind: "weapon" },
    { source: "weapons_martial_melee", category: "武器", subtype: "軍用近戰武器", kind: "weapon" },
    { source: "weapons_martial_ranged", category: "武器", subtype: "軍用遠程武器", kind: "weapon" },
    { source: "armors", category: "護甲", subtype: "護甲", kind: "armor" },
    { source: "shield", category: "盾牌", subtype: "盾牌", kind: "armor" }
  ];
  let equipmentSearchIndex = null;
  let equipmentDetailTrigger = null;

  function equipmentTextEntry(segment, category, kind) {
    const text = String(segment?.text || "").trim();
    const firstLine = text.split("\n", 1)[0].trim();
    const pricedName = firstLine.match(/^(.+?)（[^）]+）$/u)?.[1]?.trim();
    const name = pricedName || (kind === "property" || kind === "mastery" ? firstLine : "");
    if (!name) return null;
    return {
      name,
      category,
      subtype: category,
      kind,
      text,
      tableHtml: segment?.tableHtml || "",
      searchText: `${name}\n${text}`.toLowerCase()
    };
  }

  function getEquipmentNoteEntries(summaryLabel, category, kind) {
    const detail = Array.from(document.querySelectorAll("#equipment-notes-section details")).find(candidate =>
      candidate.querySelector(":scope > summary")?.textContent?.trim() === summaryLabel
    );
    const body = detail?.querySelector(":scope > .small-text");
    if (!detail || !body) return [];
    // 已收合的 details 在部分瀏覽器中不會回傳 innerText；一律以 textContent
    // 建立索引，避免冒險用品等收合清單遺漏搜尋結果。
    const sourceText = (body.textContent || "").trim();
    return getEquipmentSegments(detail, body, sourceText).reduce((entries, segment) => {
      const entry = equipmentTextEntry(segment, category, kind);
      if (entry) {
        entries.push(entry);
      } else if (segment?.tableHtml && entries.length) {
        entries[entries.length - 1].tableHtml = segment.tableHtml;
        entries[entries.length - 1].searchText += `\n${segment.matchText || ""}`;
      }
      return entries;
    }, []);
  }

  function initializeEquipmentSearchIndex() {
    if (equipmentSearchIndex) return;
    equipmentSearchIndex = [];

    EQUIPMENT_SEARCH_CATALOGS.forEach(({ source, category, subtype, kind }) => {
      const items = Array.isArray(globalThis[source]) ? globalThis[source] : [];
      items.forEach((data) => {
        const name = String(data?.名稱 || "").trim();
        if (!name) return;
        equipmentSearchIndex.push({
          name, category, subtype, kind, data,
          searchText: Object.values(data).filter(Boolean).join("\n").toLowerCase()
        });
      });
    });

    equipmentSearchIndex.push(
      ...getEquipmentNoteEntries("工匠工具", "工具", "tool"),
      ...getEquipmentNoteEntries("其他工具", "工具", "tool"),
      ...getEquipmentNoteEntries("冒險用品", "冒險用品", "adventuring-gear")
    );
  }

  function ensureEquipmentDetailModal() {
    let modal = document.getElementById("equipment-detail-modal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "equipment-detail-modal";
    modal.inert = true;
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <section class="equipment-detail-modal__card" role="dialog" aria-modal="true" aria-labelledby="equipment-detail-title">
        <header class="equipment-detail-modal__header">
          <div><span id="equipment-detail-category" class="equipment-detail-modal__category"></span><h2 id="equipment-detail-title"></h2></div>
          <button type="button" class="equipment-detail-modal__close" aria-label="關閉裝備詳情">×</button>
        </header>
        <div id="equipment-detail-content" class="equipment-detail-modal__content" tabindex="0"></div>
        <footer class="equipment-detail-modal__actions"></footer>
      </section>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", (event) => {
      const trigger = event.target.closest?.("[data-equipment-rule-kind][data-equipment-rule]");
      if (!trigger) return;
      const kind = trigger.dataset.equipmentRuleKind;
      const name = trigger.dataset.equipmentRule;
      const description = globalThis.WEAPON_RULE_DESCRIPTIONS?.[kind]?.[name];
      if (!description) return;
      const category = kind === "mastery" ? "精通" : kind === "armor" ? "防具規則" : "武器屬性";
      window.AppDialog.showMessage({ title: `${category}：${name}`, message: description, trigger });
    });
    modal.querySelector(".equipment-detail-modal__close")?.addEventListener("click", closeEquipmentDetail);
    modal.addEventListener("click", event => { if (event.target === modal) closeEquipmentDetail(); });
    modal.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeEquipmentDetail();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...modal.querySelectorAll("button:not(:disabled), select:not(:disabled), [tabindex='0']")].filter(element => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    return modal;
  }

  function renderEquipmentRuleLink(value, kind, specifiedName) {
    const label = String(value);
    const name = specifiedName || label.trim().replace(/\s*[（(].*$/u, "");
    if (!globalThis.WEAPON_RULE_DESCRIPTIONS?.[kind]?.[name]) return escapeHtml(label);
    return `<button type="button" class="weapon-rule-link" data-equipment-rule-kind="${kind}" data-equipment-rule="${escapeHtml(name)}" aria-haspopup="dialog">${escapeHtml(label)}</button>`;
  }

  function renderEquipmentProperty(value) {
    const label = String(value);
    const bracket = label.search(/[（(]/u);
    if (bracket < 0) return renderEquipmentRuleLink(label, "property");
    const suffix = label.slice(bracket).split(/(射程)/u).map(part =>
      part === "射程" ? renderEquipmentRuleLink(part, "property") : escapeHtml(part)
    ).join("");
    return renderEquipmentRuleLink(label.slice(0, bracket), "property") + suffix;
  }

  function renderEquipmentField(key, value) {
    if (key === "精通") return renderEquipmentRuleLink(value, "mastery");
    if (key === "力量需求" && value !== "-") return renderEquipmentRuleLink(value, "armor", "力量需求");
    if (key === "隱匿懲罰" && value === "劣勢") return renderEquipmentRuleLink(value, "armor", "隱匿劣勢");
    return escapeHtml(String(value));
  }

  function renderEquipmentDataDetail(entry) {
    const excludedKeys = new Set(["名稱", "分類"]);
    const fields = Object.entries(entry.data || {}).filter(([key, value]) =>
      !excludedKeys.has(key) && value && value !== "--" && !key.startsWith("屬性")
    );
    const properties = Object.entries(entry.data || {})
      .filter(([key, value]) => key.startsWith("屬性") && value && value !== "--")
      .map(([, value]) => value);
    const classification = entry.data?.分類 || entry.subtype;
    return `
      <div class="equipment-detail-tags"><span>${escapeHtml(classification)}</span>${properties.map(value => `<span>${renderEquipmentProperty(value)}</span>`).join("")}</div>
      <dl class="equipment-detail-stats">${fields.map(([key, value]) => `<div><dt>${escapeHtml(key)}</dt><dd>${renderEquipmentField(key, value)}</dd></div>`).join("")}</dl>`;
  }

  function renderEquipmentTextDetail(entry) {
    const lines = String(entry.text || "").split("\n");
    const firstLine = lines.shift()?.trim() || "";
    const meta = firstLine.slice(entry.name.length).trim();
    const description = lines.join("\n").trim();
    return `${meta ? `<div class="equipment-detail-tags"><span>${escapeHtml(meta.replace(/^（|）$/gu, ""))}</span></div>` : ""}
      ${description ? `<div class="equipment-detail-description">${escapeHtml(description)}</div>` : ""}
      ${entry.tableHtml ? `<div class="equipment-detail-table">${entry.tableHtml}</div>` : ""}`;
  }

  function renderEquipmentPurchaseActions(entry, modal) {
    const actions = modal.querySelector(".equipment-detail-modal__actions");
    actions.replaceChildren();
    const sourceLinks = [...document.querySelectorAll("#equipment-notes-section .equipment-purchase-link")];
    const directLink = sourceLinks.find(link => link.textContent.trim() === entry.name);
    // 多種品項沿用原卡片已建立的購買連結，不另行解析價格或維護交易資料。
    const tableNames = new Set([...modal.querySelectorAll(".equipment-detail-table .equipment-purchase-link")]
      .map(link => link.textContent.trim()));
    const links = directLink ? [directLink] : sourceLinks.filter(link => {
      const name = link.textContent.trim();
      return tableNames.has(name) || new RegExp(`(?:^|[\\n：，；])\\s*${escapeRegExp(name)}（`, "u").test(entry.text || "");
    });
    actions.hidden = !links.length;
    if (!links.length) return;

    const purchase = (link) => {
      closeEquipmentDetail();
      link.click();
    };
    let select;
    if (links.length > 1) {
      select = document.createElement("select");
      select.setAttribute("aria-label", "選擇購買品項");
      links.forEach((link, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = link.getAttribute("aria-label")?.replace(/^購買/u, "") || link.textContent;
        select.appendChild(option);
      });
      actions.appendChild(select);
    }
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "購買";
    button.addEventListener("click", () => purchase(links[select ? Number(select.value) : 0]));
    actions.appendChild(button);
    modal.querySelectorAll(".equipment-detail-table .equipment-purchase-link").forEach(link => {
      const sourceLink = links.find(source => source.textContent.trim() === link.textContent.trim());
      if (sourceLink) link.addEventListener("click", () => purchase(sourceLink));
    });
  }

  function openEquipmentDetail(entry, trigger) {
    const modal = ensureEquipmentDetailModal();
    equipmentDetailTrigger = trigger || document.activeElement;
    modal.querySelector("#equipment-detail-category").textContent = entry.subtype || entry.category;
    modal.querySelector("#equipment-detail-title").textContent = entry.name;
    const content = modal.querySelector("#equipment-detail-content");
    content.innerHTML = entry.data ? renderEquipmentDataDetail(entry) : renderEquipmentTextDetail(entry);
    renderEquipmentPurchaseActions(entry, modal);
    content.scrollTop = 0;
    modal.inert = false;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("equipment-detail-open");
    modal.querySelector(".equipment-detail-modal__close")?.focus();
  }

  function closeEquipmentDetail() {
    const modal = document.getElementById("equipment-detail-modal");
    if (!modal?.classList.contains("open")) return;
    if (modal.contains(document.activeElement)) equipmentDetailTrigger?.focus?.();
    modal.inert = true;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("equipment-detail-open");
    equipmentDetailTrigger = null;
  }

  function clearEquipmentSearchResults() {
    document.getElementById("equipment-search-results")?.classList.add("is-hidden");
    document.getElementById("equipment-search-summary")?.replaceChildren();
    document.getElementById("equipment-search-result-list")?.replaceChildren();
  }

  function applyEquipmentFilter() {
    const searchEl = document.getElementById("equipment-search");
    const countEl = document.getElementById("equipment-search-count");
    const clearBtn = document.getElementById("equipment-search-clear");
    const results = document.getElementById("equipment-search-results");
    const summary = document.getElementById("equipment-search-summary");
    const list = document.getElementById("equipment-search-result-list");
    if (!searchEl || !results || !summary || !list) return;

    const keyword = searchEl.value.trim();
    if (clearBtn) {
      clearBtn.classList.toggle("is-hidden", !searchEl.value);
    }
    if (!keyword) {
      if (countEl) countEl.textContent = "";
      clearEquipmentSearchResults();
      return;
    }

    initializeEquipmentSearchIndex();
    const normalizedKeyword = keyword.toLowerCase();
    const matches = (equipmentSearchIndex || []).filter(entry => entry.searchText.includes(normalizedKeyword));
    const fragment = document.createDocumentFragment();
    matches.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "equipment-search-result-item";
      row.setAttribute("role", "listitem");
      const category = document.createElement("span");
      category.className = "equipment-search-result-category";
      category.textContent = entry.category;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "equipment-search-result-name";
      button.textContent = entry.name;
      button.setAttribute("aria-label", `查看${entry.name}的${entry.category}詳情`);
      button.addEventListener("click", () => openEquipmentDetail(entry, button));
      row.append(category, button);
      fragment.appendChild(row);
    });
    list.replaceChildren(fragment);
    summary.textContent = matches.length ? `找到 ${matches.length} 筆結果` : `找不到包含「${keyword}」的裝備資料`;
    if (countEl) countEl.textContent = `結果 ${matches.length}`;
    results.classList.remove("is-hidden");
  }

  document.getElementById("equipment-search")?.addEventListener("input", () => {
    document.getElementById("equipment-search-clear")?.classList.toggle(
      "is-hidden",
      !document.getElementById("equipment-search")?.value
    );
  });

  document.getElementById("equipment-search-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    applyEquipmentFilter();
  });

  document.getElementById("equipment-search-clear")?.addEventListener("click", () => {
    const searchEl = document.getElementById("equipment-search");
    if (!searchEl) return;
    searchEl.value = "";
    applyEquipmentFilter();
    searchEl.focus();
  });

  // 公開相容入口；索引與其餘輔助函式保留於模組內。
  Object.assign(globalScope, { searchAllSpells, clearSpellSearchResults, applyEquipmentFilter });

  // 保留法術索引的載入時預建；裝備說明在 DOMContentLoaded 產生，仍延後到搜尋時建立。
  if (document.readyState === "complete") {
    initializeSpellSearchIndex();
  } else {
    document.addEventListener("DOMContentLoaded", initializeSpellSearchIndex, { once: true });
  }
})(window);

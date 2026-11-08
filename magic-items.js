// magic-items.js：魔法物品的讀取入口（window.MagicItemCatalog）。
// 資料來自 magic-item-content.generated.js；說明本文 magic-item-text.generated.js 第一次需要時才載入（離線版內嵌）。
// 物品的選擇（selection）是 { base: 基本款中文品名, <選項 id>: 選項值 }，與物品欄存檔 magic 物件的選項同名；對不上的值視為沒選。
"use strict";

(function () {
  const CATEGORY_ORDER = Object.keys(magicItemLabels.category);
  const views = new Map();

  function rule(id) {
    return Object.hasOwn(magicItemRules, id) ? magicItemRules[id] : null;
  }

  // 目錄的一筆：規則加上 id，options 一定是陣列。回傳同一個物件，呼叫端不要修改。
  function viewOf(id) {
    if (!views.has(id)) views.set(id, Object.freeze({ id, ...magicItemRules[id], options: magicItemRules[id].options || [] }));
    return views.get(id);
  }

  function get(id) {
    return rule(id) ? viewOf(id) : null;
  }

  // 一般商店也賣的物品（治療藥水、法術卷軸）：由裝備品名找到對應的魔法物品；沒有時為 null。
  function getByEquipmentName(name) {
    return getAll().find(item => item.equipmentName === name) || null;
  }

  function getAll() {
    return Object.keys(magicItemRules).map(viewOf);
  }

  // 類別依固定順序，只列有物品的類別；奇物另有小標（groups）。
  function getCategories() {
    const items = getAll();
    return CATEGORY_ORDER.map(id => {
      const members = items.filter(item => item.category === id);
      const groupIds = [...new Set(members.map(item => item.group).filter(Boolean))];
      return {
        id,
        label: magicItemLabels.category[id],
        count: members.length,
        groups: Object.keys(magicItemLabels.group).filter(group => groupIds.includes(group)).map(group => ({
          id: group,
          label: magicItemLabels.group[group],
          count: members.filter(item => item.group === group).length
        }))
      };
    }).filter(category => category.count);
  }

  // 可選的基本款（中文品名，與 equipment-data.js 相同）；沒有基本款時為空陣列，固定一種時只有一項。
  function getBaseChoices(id) {
    const base = rule(id)?.base;
    if (!base) return [];
    if (base.fixed) return [base.fixed];
    if (base.from) return [...base.from];
    const except = new Set(base.except || []);
    return [...new Set(base.any.flatMap(group => magicItemBaseLists[group]))].filter(name => !except.has(name));
  }

  function selectedChoice(option, selection) {
    return option.choices.find(choice => choice.value === selection?.[option.id]) || null;
  }

  function selectedBase(id, selection) {
    return getBaseChoices(id).includes(selection?.base) ? selection.base : null;
  }

  // 顯示名稱，例如「長劍+1」「治療藥水（高等）」「焰舌（長劍）」。有 displayName 樣板但選擇不完整時回傳物品名稱。
  function getDisplayName(id, selection) {
    const item = rule(id);
    if (!item) return "";
    const options = item.options || [];
    const base = selectedBase(id, selection);
    if (item.displayName) {
      const values = { base, ...Object.fromEntries(options.map(option => [option.id, selectedChoice(option, selection)?.label ?? null])) };
      const tokens = item.displayName.match(/\{[^}]*\}/g) || [];
      if (tokens.some(token => values[token.slice(1, -1)] === null)) return item.name;
      return item.displayName.replace(/\{([^}]*)\}/g, (_, key) => values[key]);
    }
    const parts = [
      ...(base && !item.base?.fixed ? [base] : []),
      ...options.map(option => selectedChoice(option, selection)).filter(choice => choice && !choice.omitInName).map(choice => choice.label)
    ];
    return parts.length ? `${item.name}（${parts.join("、")}）` : item.name;
  }

  // 第一批自動計算的固定數值：{ attack?, damage?, ac?, saves?, condition? }，數值已代入 bonus 選項；沒有時為空物件。
  function getEffects(id, selection) {
    const item = rule(id);
    const result = {};
    if (!item) return result;
    const options = item.options || [];
    const bonus = selectedChoice(options.find(option => option.id === "bonus") || { choices: [] }, selection)?.value;
    for (const [key, value] of Object.entries(item.effects || {})) {
      if (key === "condition") result.condition = value;
      else if (value !== "bonus") result[key] = value;
      else if (bonus !== undefined) result[key] = bonus;
    }
    for (const option of options) {
      for (const [key, value] of Object.entries(selectedChoice(option, selection)?.effects || {})) result[key] = (result[key] || 0) + value;
    }
    return result;
  }

  // 稀有度 key；隨選項變動且還沒選時為 null。
  function getRarity(id, selection) {
    const item = rule(id);
    if (!item) return null;
    if (item.rarity !== "varies") return item.rarity;
    const option = (item.options || []).find(entry => entry.choices.some(choice => choice.rarity));
    return (option && selectedChoice(option, selection)?.rarity) || null;
  }

  function getRarityLabel(rarity) {
    return magicItemLabels.rarity[rarity] || "";
  }

  // 說明上方的副標，例如「武器（任意近戰武器），傳說（需同調）」。
  function getSubtitle(id) {
    const item = rule(id);
    if (!item) return "";
    const { base } = item;
    const named = item.category === "weapon" || item.category === "armor";
    const baseText = !base || !named ? "" : base.label || base.fixed || `${base.from.slice(0, -1).join("、")}或${base.from[base.from.length - 1]}`;
    const rarity = item.rarity === "varies" ? item.rarityText || "稀有度不定" : magicItemLabels.rarity[item.rarity];
    const attunement = item.attunement === true ? "（需同調）" : item.attunement ? `（需${item.attunement}同調）` : "";
    return `${magicItemLabels.category[item.category]}${baseText ? `（${baseText}）` : ""}，${rarity}${attunement}`;
  }

  // 治療藥水恢復的生命值骰式；不是治療藥水或還沒選等級時為 null。
  function getHeal(id, selection) {
    const options = rule(id)?.options || [];
    for (const option of options) {
      const heal = selectedChoice(option, selection)?.heal;
      if (heal) return heal;
    }
    return null;
  }

  let textPromise = null;
  function loadText() {
    if (globalThis.magicItemText) return Promise.resolve(globalThis.magicItemText);
    textPromise ||= new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = magicItemTextFile;
      script.onload = () => globalThis.magicItemText ? resolve(globalThis.magicItemText) : reject(new Error("魔法物品說明資料格式不符"));
      script.onerror = () => {
        script.remove();
        reject(new Error("魔法物品說明載入失敗"));
      };
      document.head.appendChild(script);
    }).catch(error => {
      textPromise = null;
      throw error;
    });
    return textPromise;
  }

  // 回傳 { html }（建置產生的 HTML）；沒有這件物品時為 null，載入失敗時 reject（之後可再試）。
  async function getText(id) {
    if (!rule(id)) return null;
    const text = await loadText();
    return Object.hasOwn(text, id) ? text[id] : null;
  }

  window.MagicItemCatalog = Object.freeze({
    getAll,
    get,
    getByEquipmentName,
    getCategories,
    getBaseChoices,
    getDisplayName,
    getEffects,
    getRarity,
    getRarityLabel,
    getSubtitle,
    getHeal,
    loadText,
    getText
  });
})();

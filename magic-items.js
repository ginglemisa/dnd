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

  // 使用方式（YAML 的 use）：worn 穿戴、held 手持、wornOrHeld 穿戴或手持、carried 帶在身上；有基本款或沒寫的物品為空字串。
  function getUse(id) {
    return rule(id)?.use || "";
  }

  // 可以放進主手或副手的非武器物品（手持、穿戴或手持）。
  function isHandHeld(id) {
    return ["held", "wornOrHeld"].includes(getUse(id));
  }

  // 可以穿戴的物品（物品詳情的「裝備／卸下」）。
  function isWearable(id) {
    return ["worn", "wornOrHeld"].includes(getUse(id));
  }

  // 可裝備在裝備欄位的魔法物品的全部可能：[{ name, id, selection, base }]，name 就是裝備欄位的值。
  // 武器、護甲與盾牌（彈藥不算）的 base 是基本款品名；手持類的非武器物品（魔杖等，isHandHeld）沒有基本款，base 是空字串，只放主手或副手。
  // 由目錄枚舉，不解析名稱字串、不依賴物品欄；建置檢查 name 彼此唯一、也不與普通品名相撞（tools/magic-item-content/load.js）。
  function getEquipmentVariants() {
    return getAll().flatMap((item) => {
      const bases = item.base ? getBaseChoices(item.id).filter(base => !magicItemBaseLists.ammunition.includes(base)) : isHandHeld(item.id) ? [""] : [];
      const choices = item.options.reduce((selections, option) => selections.flatMap(selection => option.choices.map(choice => ({ ...selection, [option.id]: choice.value }))), [{}]);
      return bases.flatMap(base => choices.map((choice) => {
        const selection = base ? { ...choice, base } : choice;
        return { name: getDisplayName(item.id, selection), id: item.id, selection, base };
      }));
    });
  }

  let equipmentIndex = null;
  // 由裝備欄位的值查回魔法款 { name, id, selection, base }（手持類的 base 是空字串）；普通品名與對不上的名稱為 null。
  function resolveEquipmentName(name) {
    equipmentIndex ||= new Map(getEquipmentVariants().map(variant => [variant.name, Object.freeze(variant)]));
    return equipmentIndex.get(name) || null;
  }

  let ammunitionIndex = null;
  // 由顯示名稱查回魔法彈藥 { name, id, selection, base }（例如「箭矢+1」「屠殺彈藥（箭矢、龍類）」）；物品欄文字轉回標籤用。
  // 和 resolveEquipmentName 一樣由目錄枚舉（基本款只取彈藥），不解析字串；對不上或名稱重複時為 null。
  function resolveAmmunitionName(name) {
    if (!ammunitionIndex) {
      const counts = new Map();
      const variants = getAll().flatMap((item) => {
        const bases = item.base ? getBaseChoices(item.id).filter(base => magicItemBaseLists.ammunition.includes(base)) : [];
        const choices = item.options.reduce((selections, option) => selections.flatMap(selection => option.choices.map(choice => ({ ...selection, [option.id]: choice.value }))), [{}]);
        return bases.flatMap(base => choices.map((choice) => {
          const selection = { ...choice, base };
          const variant = Object.freeze({ name: getDisplayName(item.id, selection), id: item.id, selection, base });
          counts.set(variant.name, (counts.get(variant.name) || 0) + 1);
          return variant;
        }));
      });
      ammunitionIndex = new Map(variants.filter(variant => counts.get(variant.name) === 1).map(variant => [variant.name, variant]));
    }
    return ammunitionIndex.get(name) || null;
  }

  // 目前的形態：selection.form 對得上就是那個形態，否則是原本形態（第一個）；沒有形態的物品為 null。
  function getForm(id, selection) {
    const forms = rule(id)?.forms;
    return forms ? forms.find(form => form.id === selection?.form) || forms[0] : null;
  }

  // 合併多個來源的 effects：數字相加，清單（extraDamage、proficiencyAs、proficiencies）接在後面，abilities、movement 依欄位合併，
  // skills 依技能相加，其餘以後面的為準。
  const LIST_EFFECT_KEYS = new Set(["extraDamage", "proficiencyAs", "proficiencies"]);
  function mergeEffect(result, key, value) {
    if (typeof value === "number") result[key] = (Number(result[key]) || 0) + value;
    else if (LIST_EFFECT_KEYS.has(key)) result[key] = [...(result[key] || []), ...value];
    else if (key === "abilities" || key === "movement") result[key] = { ...result[key], ...value };
    else if (key === "skills") {
      result[key] = { ...result[key] };
      Object.entries(value).forEach(([skill, bonus]) => { result[key][skill] = (result[key][skill] || 0) + bonus; });
    } else result[key] = value;
  }

  // 自動計算的 effects（詞彙見 content/README.md 的「魔法物品」）：物品本身（形態 noEffects 時略過）、目前形態、所選選項依序合併，
  // bonus 已代入 bonus 選項的值；沒有時為空物件。回傳新的物件，呼叫端可以修改。
  function getEffects(id, selection) {
    const item = rule(id);
    const result = {};
    if (!item) return result;
    const options = item.options || [];
    const bonus = selectedChoice(options.find(option => option.id === "bonus") || { choices: [] }, selection)?.value;
    const form = getForm(id, selection);
    const itemEffects = form?.noEffects ? {} : item.effects || {};
    for (const [key, value] of Object.entries(itemEffects)) {
      if (value !== "bonus") result[key] = Array.isArray(value) ? [...value] : value && typeof value === "object" ? { ...value } : value;
      else if (bonus !== undefined) result[key] = bonus;
    }
    const extra = [form?.effects, ...options.map(option => selectedChoice(option, selection)?.effects)].filter(Boolean);
    extra.forEach(effects => Object.entries(effects).forEach(([key, value]) => mergeEffect(result, key, value)));
    return result;
  }

  // 提示（YAML 的 hints）：物品本身、目前形態、所選選項的提示依序列出，每筆是內容檔的原樣物件（呼叫端不要修改）。
  function getHints(id, selection) {
    const item = rule(id);
    if (!item) return [];
    const form = getForm(id, selection);
    return [
      ...(item.hints || []),
      ...(form?.hints || []),
      ...(item.options || []).flatMap(option => selectedChoice(option, selection)?.hints || [])
    ];
  }

  // 次數池（YAML 的 pools）：[{ id, label, max, recover?, amount?, cooldown? }]，內容檔的原樣物件（呼叫端不要修改）。
  function getPools(id) {
    return rule(id)?.pools || [];
  }

  // 能力（YAML 的 actions）：[{ id, name, type, text, pool?, cost?, when? }]，內容檔的原樣物件。
  function getActions(id) {
    return rule(id)?.actions || [];
  }

  // 恢復按鈕與說明的文字：「黎明恢復 1d6 + 1」「冷卻結束（7 天）」「長休時自動恢復」；不恢復時為空字串。
  const RECOVER_LABELS = Object.freeze({ dawn: "黎明", dusk: "黃昏", shortRest: "短休或長休", longRest: "長休" });
  function getRecoverText(pool) {
    if (!pool?.recover) return "";
    if (pool.recover === "cooldown") return `冷卻結束（${pool.cooldown}）`;
    if (pool.recover === "shortRest" || pool.recover === "longRest") return `${RECOVER_LABELS[pool.recover]}時自動恢復${pool.amount ? ` ${pool.amount}` : ""}`;
    return `${RECOVER_LABELS[pool.recover]}恢復${pool.amount ? ` ${pool.amount}` : ""}`;
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
    getUse,
    isHandHeld,
    isWearable,
    getEquipmentVariants,
    resolveEquipmentName,
    resolveAmmunitionName,
    getEffects,
    getHints,
    getForm,
    getRarity,
    getRarityLabel,
    getSubtitle,
    getHeal,
    getPools,
    getActions,
    getRecoverText,
    loadText,
    getText
  });
})();

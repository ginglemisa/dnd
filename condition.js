(function attachConditionData(globalScope) {
  const freezeCondition = (condition) => Object.freeze({
    ...condition,
    effects: Object.freeze([...condition.effects])
  });

  const CONDITIONS = Object.freeze([
    {
      key: "blinded",
      zh: "失明",
      en: "Blinded",
      effects: [
        "無法視物：你看不見，任何需要視覺的屬性檢定都自動失敗。",
        "攻擊受影響：他人攻擊你具有優勢；你攻擊他人具有劣勢。"
      ]
    },
    {
      key: "charmed",
      zh: "魅惑",
      en: "Charmed",
      effects: [
        "不能傷害魅惑者：你不能攻擊魅惑者，也不能以造成傷害的能力或魔法效果將其作為目標。",
        "交際優越：魅惑者在與你進行社交互動的任何屬性檢定上具有優勢。"
      ]
    },
    {
      key: "deafened",
      zh: "耳聾",
      en: "Deafened",
      effects: ["失聰：你聽不見，且任何需要聽覺的屬性檢定自動失敗。"]
    },
    {
      key: "exhaustion",
      zh: "力竭",
      en: "Exhaustion",
      effects: [
        "力竭等級：此狀態可累積。每次你獲得此狀態時，你獲得 1 級力竭。若你的力竭等級為 6，你會死亡。",
        "D20 檢定受影響：當你進行 D20 檢定時，擲骰結果會減去 2 × 你的力竭等級。",
        "速度降低：你的速度降低 5 × 你的力竭等級 呎。",
        "移除力竭等級：完成一次長休可移除 1 級力竭。當你的力竭等級降為 0，該狀態結束。"
      ]
    },
    {
      key: "frightened",
      zh: "恐慌",
      en: "Frightened",
      effects: [
        "屬性檢定與攻擊受影響：只要恐懼來源在你的視線範圍內，你的屬性檢定與攻擊檢定具有劣勢。",
        "無法接近：你不能自願移動到更靠近恐懼來源的位置。"
      ]
    },
    {
      key: "grappled",
      zh: "擒抱",
      en: "Grappled",
      effects: [
        "速度 0：你的速度為 0，且不能提高。",
        "結束條件：若擒抱者失能，或你脫離觸及範圍，該狀態結束。"
      ]
    },
    {
      key: "incapacitated",
      zh: "失能",
      en: "Incapacitated",
      effects: [
        "無法行動：你不能採取任何動作,附贈動作或反應。",
        "無法維持專注：你的專注會被打斷。",
        "無法說話：你不能說話。",
        "措手不及：若你在擲先攻時處於失能狀態，你該次擲骰具有劣勢。"
      ]
    },
    {
      key: "invisible",
      zh: "隱形",
      en: "Invisible",
      effects: [
        "突襲：若你在擲先攻時處於隱形狀態，你該次擲骰具有優勢。",
        "隱蔽：除非效果施術者能看見你，否則需要看見目標的效果或法術無法對你產生影響。",
        "攻擊受影響：他人攻擊你具有劣勢；你的攻擊檢定具有優勢。"
      ]
    },
    {
      key: "paralyzed",
      zh: "麻痺",
      en: "Paralyzed",
      effects: [
        "失能：你同時處於失能狀態。",
        "速度 0：你的速度為 0，且不能提高。",
        "豁免受影響：你會自動失敗力量與敏捷豁免。",
        "攻擊受影響：他人攻擊你具有優勢。",
        "自動重擊：若攻擊者在你 5 呎內，任何命中你的攻擊都視為重擊。"
      ]
    },
    {
      key: "petrified",
      zh: "石化",
      en: "Petrified",
      effects: [
        "失能：你同時處於失能狀態。",
        "速度 0：你的速度為 0，且不能提高。",
        "攻擊受影響：他人攻擊你具有優勢。",
        "豁免受影響：你會自動失敗力量與敏捷豁免。",
        "抗性：你獲得對所有傷害的抗性。",
        "毒素免疫：你免疫中毒狀態。"
      ]
    },
    {
      key: "poisoned",
      zh: "中毒",
      en: "Poisoned",
      effects: ["屬性檢定與攻擊受影響：你的攻擊檢定與屬性檢定具有劣勢。"]
    },
    {
      key: "prone",
      zh: "倒地",
      en: "Prone",
      effects: [
        "受限移動：你只能爬行，或花費等同於速度一半的移動力站起來。",
        "攻擊受影響：你的攻擊檢定具有劣勢。5 呎內的生物攻擊你有優勢；5 呎之外的生物攻擊你則劣勢。"
      ]
    },
    {
      key: "restrained",
      zh: "束縛",
      en: "Restrained",
      effects: [
        "速度 0：你的速度為 0，且不能提高。",
        "攻擊受影響：他人攻擊你具有優勢；你的攻擊檢定具有劣勢。",
        "豁免受影響：你的敏捷豁免具有劣勢。"
      ]
    },
    {
      key: "stunned",
      zh: "震懾",
      en: "Stunned",
      effects: [
        "失能：你同時處於失能狀態。",
        "速度 0：你的速度為 0，且不能提高。",
        "豁免受影響：你的力量與敏捷豁免會自動失敗。",
        "攻擊受影響：他人攻擊你具有優勢。"
      ]
    },
    {
      key: "unconscious",
      zh: "昏迷",
      en: "Unconscious",
      effects: [
        "無力：你同時處於失能與倒地狀態，並掉落手中持有物。",
        "速度 0：你的速度為 0，且不能提高。",
        "攻擊受影響：他人攻擊你具有優勢。",
        "豁免受影響：你會自動失敗力量與敏捷豁免。",
        "自動重擊：若攻擊者在你 5 呎內，任何命中你的攻擊都視為重擊。",
        "失去意識：你對周遭環境毫無察覺。"
      ]
    }
  ].map(freezeCondition));

  // 危害僅供規則參考，不加入可套用至角色的 DND_CONDITIONS。
  const HAZARDS = Object.freeze([
    {
      key: "burning",
      zh: "燃燒",
      en: "Burning",
      effects: [
        "持續傷害：燃燒中的生物或物件，在自己的每回合開始時受到 1d4 點火焰傷害。",
        "撲滅火焰：你可以使用一個動作，倒地並翻滾，撲滅自己身上的火焰。",
        "其他滅火方式：潑水、浸入水中或隔絕空氣，也能使火焰熄滅。"
      ]
    },
    {
      key: "dehydration",
      zh: "脫水",
      en: "Dehydration",
      effects: [
        "每日飲水：生物每天需要的飲水量取決於體型，詳見「每日飲水需求」表。",
        "飲水不足：如果一天的飲水量少於需求的一半，當天結束時獲得 1 級力竭。",
        "恢復條件：因脫水造成的力竭，必須先在一天內喝足所需水量，才能移除。",
        "另見「力竭」。"
      ],
      requirements: {
        zh: "每日飲水需求",
        en: "Water Needs per Day",
        rows: [
          { sizeZh: "微型", sizeEn: "Tiny", amount: "1/4 加侖" },
          { sizeZh: "小型", sizeEn: "Small", amount: "1 加侖" },
          { sizeZh: "中型", sizeEn: "Medium", amount: "1 加侖" },
          { sizeZh: "大型", sizeEn: "Large", amount: "4 加侖" },
          { sizeZh: "巨型", sizeEn: "Huge", amount: "16 加侖" },
          { sizeZh: "超巨型", sizeEn: "Gargantuan", amount: "64 加侖" }
        ]
      }
    },
    {
      key: "falling",
      zh: "墜落",
      en: "Falling",
      effects: [
        "墜落傷害：每墜落 10 呎，落地時受到 1d6 點鈍擊傷害，最多 20d6。",
        "落地倒地：落地時陷入倒地狀態，除非完全避免此次墜落傷害。",
        "落水減傷：墜入水中或其他液體時，你可以使用反應，進行一次 DC 15 的力量（運動）或敏捷（體操）檢定，嘗試以頭部或雙腳先入水。成功時，墜落傷害減半。"
      ]
    },
    {
      key: "malnutrition",
      zh: "失調",
      en: "Malnutrition",
      effects: [
        "每日食物：生物每天需要的食物量取決於體型，詳見「每日食物需求」表。",
        "進食不足：如果當天有進食，但食物攝取量少於需求的一半，必須通過 DC 10 體質豁免，否則當天結束時獲得 1 級力竭。",
        "完全挨餓：如果連續 5 天完全沒有進食，第 5 天結束時自動獲得 1 級力竭。之後每多挨餓一天，當天結束時再獲得 1 級力竭。",
        "恢復條件：因失調造成的力竭，必須先在一天內吃足所需食物量，才能移除。",
        "另見「力竭」。"
      ],
      requirements: {
        zh: "每日食物需求",
        en: "Food Needs per Day",
        rows: [
          { sizeZh: "微型", sizeEn: "Tiny", amount: "1/4 磅" },
          { sizeZh: "小型", sizeEn: "Small", amount: "1 磅" },
          { sizeZh: "中型", sizeEn: "Medium", amount: "1 磅" },
          { sizeZh: "大型", sizeEn: "Large", amount: "4 磅" },
          { sizeZh: "巨型", sizeEn: "Huge", amount: "16 磅" },
          { sizeZh: "超巨型", sizeEn: "Gargantuan", amount: "64 磅" }
        ]
      }
    },
    {
      key: "suffocation",
      zh: "窒息",
      en: "Suffocation",
      effects: [
        "憋氣時間：你可以憋氣「1＋體質調整值」分鐘，最少 30 秒。",
        "窒息力竭：當你無法繼續憋氣或正在哽塞時，在自己的每回合結束時獲得 1 級力竭。",
        "恢復呼吸：恢復呼吸後，立即移除所有因窒息造成的力竭等級。"
      ]
    }
  ].map((hazard) => Object.freeze({
    ...hazard,
    effects: Object.freeze([...hazard.effects]),
    ...(hazard.requirements ? {
      requirements: Object.freeze({
        ...hazard.requirements,
        rows: Object.freeze(hazard.requirements.rows.map((row) => Object.freeze({ ...row })))
      })
    } : {})
  })));

  const CONDITIONS_BY_KEY = new Map(CONDITIONS.map((condition) => [condition.key, condition]));
  const HAZARDS_BY_KEY = new Map(HAZARDS.map((hazard) => [hazard.key, hazard]));

  function getCondition(conditionOrKey) {
    if (conditionOrKey && typeof conditionOrKey === "object") return conditionOrKey;
    return CONDITIONS_BY_KEY.get(String(conditionOrKey || "")) || null;
  }

  function getHazard(hazardOrKey) {
    if (hazardOrKey && typeof hazardOrKey === "object") return hazardOrKey;
    return HAZARDS_BY_KEY.get(String(hazardOrKey || "")) || null;
  }

  function createConditionDescription(conditionOrKey) {
    const condition = getCondition(conditionOrKey);
    if (!condition || typeof document === "undefined") return null;

    const card = document.createElement("div");
    card.className = "condition-display-card";

    const titleRow = document.createElement("div");
    titleRow.className = "condition-title-row";
    const title = document.createElement("strong");
    title.textContent = condition.zh;
    const englishName = document.createElement("span");
    englishName.textContent = condition.en;
    titleRow.append(title, englishName);

    const effects = document.createElement("ul");
    condition.effects.forEach((effect) => {
      const item = document.createElement("li");
      item.textContent = effect;
      effects.appendChild(item);
    });

    card.append(titleRow, effects);
    return card;
  }

  function renderConditionDescription(container, conditionOrKey) {
    if (!container) return;
    const description = createConditionDescription(conditionOrKey);
    container.replaceChildren(...(description ? [description] : []));
  }

  function createHazardDescription(hazardOrKey) {
    const hazard = getHazard(hazardOrKey);
    if (!hazard) return null;

    // 共用既有卡片結構，不改變其他模組呼叫的狀態說明 API。
    const card = createConditionDescription(hazard);
    if (!card) return null;

    // 僅在危害說明中突出規則重點，保留提供的完整原文。
    const items = card.querySelectorAll("li");
    hazard.effects.forEach((effect, index) => {
      const colon = effect.indexOf("：");
      if (colon < 0) return;
      const label = document.createElement("strong");
      label.textContent = effect.slice(0, colon + 1);
      items[index].replaceChildren(label, document.createTextNode(effect.slice(colon + 1)));
    });

    if (!hazard.requirements) return card;
    const table = document.createElement("table");
    table.className = "condition-requirements-table";
    const caption = document.createElement("caption");
    caption.textContent = hazard.requirements.zh;
    const captionEn = document.createElement("span");
    captionEn.className = "condition-requirements-english";
    captionEn.textContent = hazard.requirements.en;
    caption.appendChild(captionEn);

    const thead = document.createElement("thead");
    const headingRow = document.createElement("tr");
    ["體型", "每日需求"].forEach((text) => {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = text;
      headingRow.appendChild(th);
    });
    thead.appendChild(headingRow);

    const tbody = document.createElement("tbody");
    hazard.requirements.rows.forEach((row) => {
      const tr = document.createElement("tr");
      const size = document.createElement("th");
      size.scope = "row";
      size.textContent = row.sizeZh;
      const sizeEn = document.createElement("span");
      sizeEn.className = "condition-size-english";
      sizeEn.textContent = row.sizeEn;
      size.appendChild(sizeEn);
      const amount = document.createElement("td");
      amount.textContent = row.amount;
      tr.append(size, amount);
      tbody.appendChild(tr);
    });
    table.append(caption, thead, tbody);
    card.appendChild(table);
    return card;
  }

  function renderHazardDescription(container, hazardOrKey) {
    if (!container) return;
    const description = createHazardDescription(hazardOrKey);
    container.replaceChildren(...(description ? [description] : []));
  }

  Object.assign(globalScope, {
    DND_CONDITIONS: CONDITIONS,
    DND_HAZARDS: HAZARDS,
    getDndCondition: getCondition,
    getDndHazard: getHazard,
    createDndConditionDescription: createConditionDescription,
    createDndHazardDescription: createHazardDescription,
    renderDndConditionDescription: renderConditionDescription,
    renderDndHazardDescription: renderHazardDescription
  });

  if (typeof document === "undefined") return;
  document.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector("#condition-section");
    if (!container) return;

    const section = document.createElement("div");
    section.className = "section condition-reference-section";

    // 兩種參考資料各建置一次；隱藏另一個面板可保留其選擇與卡片。
    function createReferencePanel(id, entries, introText, renderDescription) {
      const panel = document.createElement("div");
      panel.id = id + "-reference-panel";
      panel.className = "condition-reference-panel";
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", id + "-reference-tab");

      const intro = document.createElement("p");
      intro.className = "small-text condition-reference-intro";
      intro.textContent = introText;

      const buttonGrid = document.createElement("div");
      buttonGrid.id = id + "-button-grid";
      buttonGrid.className = "condition-button-grid";
      const displayGrid = document.createElement("div");
      displayGrid.id = id + "-display-grid";
      displayGrid.className = "condition-display-grid";
      displayGrid.setAttribute("aria-live", "polite");
      displayGrid.setAttribute("aria-atomic", "true");
      panel.append(intro, buttonGrid, displayGrid);

      const buttons = entries.map((entry) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = entry.zh;
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", () => selectEntry(button, entry));
        buttonGrid.appendChild(button);
        return button;
      });

      function selectEntry(selected, entry) {
        buttons.forEach((button) => {
          const active = button === selected;
          button.classList.toggle("active-condition", active);
          button.setAttribute("aria-pressed", String(active));
        });
        renderDescription(displayGrid, entry);
      }
      selectEntry(buttons[0], entries[0]);
      return panel;
    }

    const conditionPanel = createReferencePanel(
      "condition", CONDITIONS, "點擊下方按鈕切換狀態說明。",
      renderConditionDescription
    );
    const hazardPanel = createReferencePanel(
      "hazard", HAZARDS, "點擊下方按鈕切換危害說明。",
      renderHazardDescription
    );

    const tabList = document.createElement("div");
    tabList.className = "condition-reference-tabs";
    tabList.setAttribute("role", "tablist");
    tabList.setAttribute("aria-label", "規則參考");
    const panels = [conditionPanel, hazardPanel];
    const tabs = ["狀態", "危害"].map((label, index) => {
      const tab = document.createElement("button");
      tab.id = (index === 0 ? "condition" : "hazard") + "-reference-tab";
      tab.className = "condition-reference-tab";
      tab.type = "button";
      tab.textContent = label;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", panels[index].id);
      tab.addEventListener("click", () => activateTab(index));
      tabList.appendChild(tab);
      return tab;
    });

    function activateTab(index) {
      tabs.forEach((tab, current) => {
        const active = current === index;
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
        panels[current].hidden = !active;
      });
    }

    // ARIA tabs：左右方向鍵循環切換，Home/End 移動至首尾並管理焦點。
    tabList.addEventListener("keydown", (event) => {
      const current = tabs.indexOf(event.target);
      if (current < 0) return;
      let next;
      switch (event.key) {
        case "ArrowRight": next = (current + 1) % tabs.length; break;
        case "ArrowLeft": next = (current - 1 + tabs.length) % tabs.length; break;
        case "Home": next = 0; break;
        case "End": next = tabs.length - 1; break;
        default: return;
      }
      event.preventDefault();
      activateTab(next);
      tabs[next].focus();
    });

    section.append(tabList, ...panels);
    container.replaceChildren(section);
    activateTab(0);
  });
})(typeof window !== "undefined" ? window : globalThis);

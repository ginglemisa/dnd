// condition.js
document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector("#condition-section");
  if (!container) return;

  const conditions = [
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
        "社交優勢：魅惑者在與你進行社交互動的任何屬性檢定上具有優勢。"
      ]
    },
    {
      key: "deafened",
      zh: "耳聾",
      en: "Deafened",
      effects: ["無法聽見：你聽不見，且任何需要聽覺的屬性檢定自動失敗。"]
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
        "無法行動：你不能採取任何動作、附贈動作或反應。",
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
        "隱蔽：除非效果施術者能看見你，否則需要看見目標的效果通常不會影響你。",
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
        "攻擊受影響：你的攻擊檢定具有劣勢。5 呎內攻擊者攻擊你有優勢；否則有劣勢。"
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
        "豁免受影響：你會自動失敗力量與敏捷豁免。",
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
        "毫無察覺：你對周遭環境毫無察覺。"
      ]
    }
  ];

  container.innerHTML = `
    <div class="section" style="margin-top:36px;">
      <h3>狀態</h3>
      <div class="small-text" style="margin-top: 8px;">點擊下方按鈕切換狀態說明。</div>

      <div id="condition-display-grid" class="condition-display-grid" style="margin-top: 10px;"></div>

      <div id="condition-button-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 10px;"></div>
    </div>
  `;

  const displayGrid = container.querySelector("#condition-display-grid");
  const buttonGrid = container.querySelector("#condition-button-grid");

  function renderCondition(condition) {
    displayGrid.innerHTML = `
      <div class="condition-display-card">
        <div class="condition-title-row">
          <strong>${condition.zh}</strong>
          <span>${condition.en}</span>
        </div>
        <ul>
          ${condition.effects.map((effect) => `<li>${effect}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  conditions.forEach((condition, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = condition.zh;
    btn.addEventListener("click", () => {
      renderCondition(condition);
      buttonGrid.querySelectorAll("button").forEach((item) => item.classList.remove("active-condition"));
      btn.classList.add("active-condition");
    });

    if (index === 0) {
      btn.classList.add("active-condition");
      renderCondition(condition);
    }

    buttonGrid.appendChild(btn);
  });
});

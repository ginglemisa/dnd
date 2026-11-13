// rule-tips.js
// 規則說明提示框：技能／規則說明詞表（skills_example_uses，含 SRD 傳奇恩惠專長的譯文）、提示標記（skillTip、createFeatureRuleTip、highlightFeatureRuleTerms），
// 以及技能／狀態說明浮層（#skillPopup；標記帶 data-tip-text 時顯示這段即時文字）與野獸資料卡浮層（#beastPopup，內容由 monster.js 的 createBeastCard 產生，含網站版／SRD 版切換）。
// 同步載入，位置緊接 sheet-spells.js（原本 index.html 行內浮層程式所在處）：浮層在解析到這裡時建立，事件監聽的註冊順序與原本相同。
// 浮層與事件只在有 document 時建立；建置工具（tools/content/site-sources.js）在沒有 document 的 vm 沙箱讀取詞表時略過。

const skills_example_uses = {
  "為什麼初始裝備要選兩次？ ℹ️": "職業和背景各自附一套初始裝備，所以要分開選。\n\n每一套都可以改拿金幣、自己去商店買；新手建議兩套都直接拿。",
  "什麼是武器精通？ ℹ️": "每種武器都有一種精通效果，例如「推離」把敵人推開、「失衡」讓敵人倒地、「緩速」讓敵人走得更慢。\n\n只有你選定的武器才有這個效果，而且不用另外花動作。",
  "卡片上的項目是什麼？ ℹ️": "**技能熟練**：你特別拿手的事。做這類事情擲骰時，會額外加分（1 級為 +2）。\n\n**起源專長**：角色一開始就擁有的特殊能力。\n\n**工具熟練**：你受過訓練的工具或樂器。使用它們擲骰時，同樣會額外加分。\n\n**可調整屬性**：步驟 3 可以把背景給的 3 點加在這幾項屬性上，單項最多 +2。\n\n**擴充**：本站以 SRD 為基礎另外編寫的內容，一樣可以選。如果你們的團只用官方內容，開團前先問 DM（帶團的主持人）。",
  "什麼是施法屬性？ ℹ️": "施法屬性決定你的法術有多準、多難抵擋：這項屬性越高，法術攻擊越容易命中，敵人也越難躲開你的法術。\n\n**法術攻擊加值** = 調整值 + 熟練加值\n\n**法術豁免難度** = 8 + 熟練加值 + 調整值（敵人擲骰要達到這個數字，才能抵抗你的法術）",
  "屬性怎麼調整？ ℹ️": "每項屬性從 8 開始，按 ▲ 升級會花掉點數，按 ▼ 降級會把點數還給你。\n\n**升到 9～13**：每 +1 花 1 點\n\n**升到 14、15**：每 +1 花 2 點\n\n**▲ 按不了？**代表已達上限 15，或剩餘點數不夠。點數不夠時，可把其他屬性按 ▼ 調低來換回點數。",
  力量: "影響近戰武器的命中與傷害，以及運動技能。",
  敏捷: "影響遠程與靈巧武器的命中與傷害、AC（防禦）和先攻，以及體操、巧手、隱匿技能。",
  體質: "影響最大 HP，也影響受傷時能否維持專注。",
  智力: "影響奧秘、歷史、調查、自然、宗教技能。\n\n法師用它施法。",
  感知: "影響馴獸、洞悉、醫藥、察覺、求生技能。\n\n牧師、德魯伊、遊俠用它施法。",
  魅力: "影響欺瞞、威嚇、表演、遊說技能。\n\n吟遊詩人、聖騎士、術士、契術師用它施法。",
  調整值: "調整值是擲骰時實際加減的數字：（總值 − 10）÷ 2，無條件捨去。\n\n例如 15 是 +2、16 是 +3，所以加到偶數才會變強。",
  關鍵屬性: "這個職業最依賴的屬性，建議優先調高。",
  生命骰: "面數越大，血量越多：1 級最大 HP 以生命骰最大面數為基礎，再加體質調整值。\n\n休息時可消耗生命骰回復 HP。",
  豁免熟練: "遇到危險或法術效果時，常要擲「豁免」來抵抗。\n\n這些屬性的豁免可多加熟練加值。",
  技能額外加值: "除了熟練之外，這些技能的檢定還會多加這個數字。括號是來源。",
  武器熟練: "用熟練的武器攻擊，命中檢定可加熟練加值。\n\n未熟練的武器也能用，但命中不加熟練加值，傷害照常。",
  護甲訓練: "未受訓的護甲 AC 仍生效，但力量與敏捷相關的 D20 檢定有劣勢，且無法施放法術。\n\n未熟練的盾牌沒有 AC 加值。",
  黑暗視覺: "即使沒有光，也能看見這個距離內的東西。魔法黑暗除外。",
  豁免: "遇到法術、毒素等危險時，擲 D20 看能不能撐住或躲開。",
  英雄激勵: "消耗**英雄激勵**可以重新擲出自己剛擲過的一顆骰子，並採用新結果。\n\n如果你在遊戲中表現精采，也許主持人會獎勵你一次英雄激勵。",
  優勢: "當一次 D20 檢定具有優勢時，擲兩次 D20，取較高的結果，再加上原本的數字加值。\n\n例如擲出 7 和 16，就採用 16，再加上該次檢定的加值。",
  劣勢: "當一次 D20 檢定具有劣勢時，擲兩次 D20，取較低的結果，再加上原本的數字加值。\n\n例如擲出 7 和 16，就採用 7，再加上該次檢定的加值。",
  抗性: "對某種傷害具有抗性時，你受到的該類型傷害減半。\n\n例如你具有火焰傷害抗性，原本會受到 10 點火焰傷害，就只受到 5 點。抗性只適用於說明指定的傷害類型或該次傷害。",
  藉機攻擊: "當你能看見的生物自行離開你的觸及範圍時，你可以使用反應，對該生物進行一次近戰攻擊。\n\n生物執行「撤離」後，本回合的移動不會引發藉機攻擊。",
  武器未熟練: "使用此武器攻擊時，命中檢定不加入熟練加值，傷害正常計算。",
  盾牌未熟練: "裝備此盾牌時，無法獲得盾牌提供的 AC 加值。",
  護甲未熟練: "護甲 AC 正常生效，但力量與敏捷相關的 D20 檢定具有劣勢，且無法施放法術。",
  目前HP: "在此填寫目前HP，再進入跑團模式。",
  體操: "站穩不跌倒，或做出各種特技動作。",
  馴獸: "安撫、訓練動物，或讓牠照你的意思行動。",
  奧秘: "回憶法術、魔法物品和各種位面的知識。",
  運動: "跳得比平常更遠、在急流中保持漂浮，或弄壞東西。",
  欺瞞: "把謊話說得像真的，或讓自己的偽裝不露破綻。",
  歷史: "回憶歷史事件、人物、國家和文化的知識。",
  洞悉: "看出一個人的情緒和意圖。",
  威嚇: "用氣勢或威脅逼對方照你的意思做。",
  調查: "從書中找出冷門資訊，或推理某樣東西怎麼運作。",
  醫藥: "判斷得了什麼病，或查明剛斷氣的人是怎麼死的。",
  自然: "回憶地形、植物、動物和天氣的知識。",
  察覺: "運用各種感官，注意到容易忽略的事物。",
  表演: "演戲、說故事、演奏音樂，或跳舞。",
  遊說: "以真誠、有禮的方式說服別人。",
  宗教: "回憶神祇、宗教儀式和聖徽的知識。",
  巧手: "扒竊、藏起手中的小東西，或表演手上把戲。",
  隱匿: "安靜移動並躲藏，避免被人發現。",
  生存: "追蹤足跡、尋找食物、找路，或避開自然危險。",
  // 傳奇恩惠專長（SRD 5.2.1 譯文，CC BY 4.0）：職業頁 SRD 版 19 級「傳奇恩惠」的建議選擇以 [[名稱]] 連到這裡。
  // 名稱與職業內容檔 srd 區塊的寫法相同；用語、空格與小標附英文原名比照職業 SRD 版。
  戰鬥造詣恩惠: "Boon of Combat Prowess\n\n傳奇恩惠專長（先決條件：19 級以上）\n\n你獲得下列好處。\n\n**屬性提升 Ability Score Increase。** 把你自選的一項屬性值提高 1，最高為 30。\n\n**無雙瞄準 Peerless Aim。** 你進行攻擊檢定卻未命中時，可以改為命中。使用這項好處後，要等到你的下個回合開始，才能再次使用。",
  次元旅行恩惠: "Boon of Dimensional Travel\n\n傳奇恩惠專長（先決條件：19 級以上）\n\n你獲得下列好處。\n\n**屬性提升 Ability Score Increase。** 把你自選的一項屬性值提高 1，最高為 30。\n\n**閃現步 Blink Steps。** 你執行攻擊動作或魔法動作之後，可以立即傳送最遠 30 呎，到達一處你看得見的未被佔據空間。",
  命運恩惠: "Boon of Fate\n\n傳奇恩惠專長（先決條件：19 級以上）\n\n你獲得下列好處。\n\n**屬性提升 Ability Score Increase。** 把你自選的一項屬性值提高 1，最高為 30。\n\n**改善命運 Improve Fate。** 你或你 60 呎內另一個生物的 D20 檢定成功或失敗時，你可以擲 2d4，把擲出的總和當作加值或減值，套用到這次 d20 擲骰上。使用這項好處後，要等到你擲先攻，或完成短休或長休，才能再次使用。",
  勢不可擋恩惠: "Boon of Irresistible Offense\n\n傳奇恩惠專長（先決條件：19 級以上）\n\n你獲得下列好處。\n\n**屬性提升 Ability Score Increase。** 把你的力量值或敏捷值提高 1，最高為 30。\n\n**突破防禦 Overcome Defenses。** 你造成的鈍擊、穿刺與揮砍傷害一律無視抗性。\n\n**壓倒性打擊 Overwhelming Strike。** 你進行攻擊檢定時，如果 d20 擲出 20，可以對目標造成額外傷害，數值等於這個專長提高的那項屬性值。額外傷害的類型與這次攻擊的類型相同。",
  法術回憶恩惠: "Boon of Spell Recall\n\n傳奇恩惠專長（先決條件：19 級以上、施法特性）\n\n你獲得下列好處。\n\n**屬性提升 Ability Score Increase。** 把你的智力值、感知值或魅力值提高 1，最高為 30。\n\n**免費施法 Free Casting。** 每當你用 1 到 4 環的法術位施放法術時，擲 1d4。如果擲出的數字和這個法術位的環階相同，就不消耗這個法術位。",
  暗夜精魂恩惠: "Boon of the Night Spirit\n\n傳奇恩惠專長（先決條件：19 級以上）\n\n你獲得下列好處。\n\n**屬性提升 Ability Score Increase。** 把你自選的一項屬性值提高 1，最高為 30。\n\n**融入陰影 Merge with Shadows。** 你位於微光光照或黑暗中時，可以用附贈動作讓自己陷入隱形狀態。你執行一個動作、附贈動作或反應動作之後，你身上的這個隱形狀態立即結束。\n\n**陰影形體 Shadowy Form。** 你位於微光光照或黑暗中時，對心靈與光耀傷害以外的所有傷害具有抗性。",
  真實視覺恩惠: "Boon of Truesight\n\n傳奇恩惠專長（先決條件：19 級以上）\n\n你獲得下列好處。\n\n**屬性提升 Ability Score Increase。** 把你自選的一項屬性值提高 1，最高為 30。\n\n**真實視覺 Truesight。** 你擁有範圍 60 呎的真實視覺。"
};

const SKILL_NAME_ALIASES = {
  求生: "生存",
  醫學: "醫藥",
  說服: "遊說"
};

function normalizeSkillKey(skillName) {
  return SKILL_NAME_ALIASES[skillName] || skillName;
}

// 套組提示框的內容物文字（職業起始裝備的套組名稱）：取自 equipment-data.js 的 EQUIPMENT_PACK_CONTENTS，與物品欄拆開的品項相同。
function packTipText(packName) {
  const contents = globalThis.EQUIPMENT_PACK_CONTENTS?.[packName];
  return contents ? contents.map(([name, count]) => count > 1 ? `${name} ×${count}` : name).join("、") : "";
}

function skillTip(skillName) {
  const safeLabel = String(skillName ?? "");
  return `<span class="skill-tip" data-skill="${safeLabel}">${safeLabel}</span>`;
}

// 規則說明的鍵盤可操作入口；label 須對應 skills_example_uses 的鍵，text 可另訂顯示文字。
function createFeatureRuleTip(label, text = label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "skill-tip feature-rule-tip";
  button.dataset.skill = label;
  button.textContent = text;
  button.setAttribute("aria-controls", "skillPopup");
  return button;
}

// 僅處理職業／種族的顯示 HTML，不改寫供規則、摘要與 PDF 使用的原始資料。
function highlightFeatureRuleTerms(html) {
  // 技能、抗性與藉機攻擊只接受來源中的 skillTip() 標記，避免把一般敘述或標題當成引用。
  const pattern = /優勢|劣勢/g;
  const template = document.createElement("template");
  template.innerHTML = html;
  const makeTip = createFeatureRuleTip;
  // 已有的技能連結也使用相同的鍵盤可操作入口，避免重複包裝。
  template.content.querySelectorAll("span.skill-tip").forEach(tip => {
    if (!tip.closest('a, button, select, [role="button"]')) tip.replaceWith(makeTip(tip.dataset.skill));
  });
  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const boldLabel = node.parentElement?.closest("strong, b");
    if (boldLabel && /[：:]\s*$/.test(boldLabel.textContent)) continue;
    if (!node.parentElement?.closest('h1, h2, h3, h4, h5, h6, a, button, select, option, textarea, script, style, .skill-tip, .beast-tip, [role="button"], [contenteditable]')) nodes.push(node);
  }
  nodes.forEach(node => {
    const text = node.textContent;
    const matches = [...text.matchAll(pattern)];
    if (!matches.length) return;
    const fragment = document.createDocumentFragment();
    let offset = 0;
    matches.forEach(match => {
      fragment.append(text.slice(offset, match.index), makeTip(match[0]));
      offset = match.index + match[0].length;
    });
    fragment.append(text.slice(offset));
    node.replaceWith(fragment);
  });
  return decorateDndConditionTips(template.innerHTML);
}

// ====== 說明浮層 =====
// 建立一次 popup（不算改 UI 結構；只是浮層）
if (typeof document !== "undefined") (function setupBeastPopup() {
  if (document.getElementById("beastPopup")) return;

  const popup = document.createElement("div");
  popup.id = "beastPopup";
  popup.innerHTML = `<span class="close" title="關閉">✕</span><div class="content"></div>`;
  document.body.appendChild(popup);

  popup.querySelector(".close").addEventListener("click", () => hideBeastPopup());
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideBeastPopup(); });

  // 點空白處關閉（但點到 tooltip 自己不會立刻關掉）
  document.addEventListener("click", (e) => {
    const clickedTip = e.target.closest(".beast-tip");
    const clickedPopup = e.target.closest("#beastPopup");
    if (!clickedTip && !clickedPopup) hideBeastPopup();
  }, true);
})();

function showBeastPopup(beastKey, anchorEl) {
  const popup = document.getElementById("beastPopup");
  // 切換到較長的 SRD 版時，浮層超出畫面底部就往上移。
  const keepInView = () => {
    const rect = popup.getBoundingClientRect();
    if (rect.bottom > window.innerHeight - 10) popup.style.top = `${Math.max(10, window.innerHeight - rect.height - 10)}px`;
  };
  const card = createBeastCard(beastKey, { onChange: keepInView });
  if (!card) return;

  const content = popup.querySelector(".content");
  content.replaceChildren(card);

  // 定位：貼近點擊文字右下角
  const r = anchorEl.getBoundingClientRect();
  popup.style.display = "block";

  // 先放在預設位置，再修正避免超出螢幕
  let left = Math.min(r.left, window.innerWidth - popup.offsetWidth - 10);
  let top  = Math.min(r.bottom + 8, window.innerHeight - popup.offsetHeight - 10);

  left = Math.max(10, left);
  top  = Math.max(10, top);

  popup.style.left = `${left}px`;
  popup.style.top  = `${top}px`;
}

function hideBeastPopup() {
  const popup = document.getElementById("beastPopup");
  if (popup) popup.style.display = "none";
}

let conditionPopupTrigger = null;
if (typeof document !== "undefined") (function setupSkillPopup() {
  if (document.getElementById("skillPopup")) return;

  const popup = document.createElement("div");
  popup.id = "skillPopup";
  popup.innerHTML = `<button type="button" class="close" aria-label="關閉說明">✕</button><div class="content"></div>`;
  document.body.appendChild(popup);

  popup.querySelector(".close").addEventListener("click", () => hideSkillPopup({ restoreFocus: true }));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideSkillPopup(); });
  // 狀態說明可從角色能力、專長子視窗或創角開啟；Escape 先關閉此浮層。
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !conditionPopupTrigger || popup.style.display !== "block") return;
    e.preventDefault();
    e.stopImmediatePropagation();
    hideSkillPopup({ restoreFocus: true });
  }, true);

  document.addEventListener("click", (e) => {
    const clickedTip = e.target.closest(".skill-tip, .condition-tip");
    const clickedPopup = e.target.closest("#skillPopup");

    if (clickedTip) {
      e.preventDefault();
      e.stopPropagation();
      showSkillPopup(clickedTip.dataset.skill, clickedTip);
      return;
    }

    if (!clickedPopup) hideSkillPopup();
  }, true);
})();

function renderSkillPopupHtml(skillLabel, conditionKey) {
  if (conditionKey) {
    const condition = getDndCondition(conditionKey);
    if (!condition) return "";
    return `<div class="title">${escapeHtml(condition.zh)} ${escapeHtml(condition.en)}</div>` +
      `<div class="condition-popup-effects">${condition.effects.map(effect =>
        `<p class="skill-popup-paragraph">${escapeHtml(effect)}</p>`).join("")}</div>`;
  }
  const normalizedKey = normalizeSkillKey(skillLabel);
  const text = skills_example_uses[normalizedKey] || packTipText(normalizedKey);
  if (!text) return "";

  const description = text.includes("\n\n")
    ? text.split(/\n\s*\n/).map(paragraph =>
        `<p class="skill-popup-paragraph">${escapeHtml(paragraph).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")}</p>`
      ).join("")
    : escapeHtml(text);
  return `
    <div class="title">${escapeHtml(skillLabel)}</div>
    <div class="monster-detail-line monster-detail-line--first">${description}</div>
  `;
}

// 依畫面當下數值產生的說明（例如魔法物品給的屬性有效值）：標記帶 data-tip-text，標題是 data-skill。
function renderDynamicTipHtml(title, text) {
  return `<div class="title">${escapeHtml(title)}</div><div class="monster-detail-line monster-detail-line--first">${escapeHtml(text)}</div>`;
}

function showSkillPopup(skillLabel, anchorEl) {
  const conditionKey = anchorEl.dataset.condition;
  const html = anchorEl.dataset.tipText !== undefined
    ? renderDynamicTipHtml(skillLabel, anchorEl.dataset.tipText)
    : renderSkillPopupHtml(skillLabel, conditionKey);
  if (!html) return;

  const popup = document.getElementById("skillPopup");
  const content = popup.querySelector(".content");
  hideSkillPopup();
  conditionPopupTrigger = conditionKey ? anchorEl : null;
  popup.classList.toggle("condition-reference-popup", !!conditionKey);
  if (conditionKey) {
    popup.setAttribute("role", "dialog");
    popup.setAttribute("aria-label", `${getDndCondition(conditionKey).zh}狀態說明`);
  } else {
    popup.removeAttribute("role");
    popup.removeAttribute("aria-label");
  }
  content.innerHTML = html;

  const r = anchorEl.getBoundingClientRect();
  popup.style.display = "block";

  let left = Math.min(r.left, window.innerWidth - popup.offsetWidth - 10);
  let top = Math.min(r.bottom + 8, window.innerHeight - popup.offsetHeight - 10);

  left = Math.max(10, left);
  top = Math.max(10, top);

  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;
  if (conditionKey) popup.querySelector(".close").focus({ preventScroll: true });
}

function hideSkillPopup({ restoreFocus = false } = {}) {
  const popup = document.getElementById("skillPopup");
  if (popup) popup.style.display = "none";
  const trigger = conditionPopupTrigger;
  conditionPopupTrigger = null;
  if (restoreFocus && trigger?.isConnected && !trigger.closest("[inert]")) trigger.focus({ preventScroll: true });
}

// 讓共用說明浮層可用滑鼠或觸控拖移；事件委派也能涵蓋稍後建立的浮層。
if (typeof document !== "undefined") (function setupDraggableContextPopups() {
  const popupSelector = "#beastPopup, #skillPopup, #weaponRulePopup";
  let dragState = null;

  document.addEventListener("pointerdown", (event) => {
    // 已有指標正在拖曳時，不允許第二根手指覆蓋目前的拖曳狀態。
    if (dragState) return;

    const popup = event.target.closest?.(popupSelector);
    if (
      !popup ||
      event.button !== 0 ||
      event.target.closest("button, a, input, select, textarea, .close, .spell-version__srd")
      || (popup.classList.contains("condition-reference-popup") && !event.target.closest(".title"))
    ) {
      return;
    }

    const rect = popup.getBoundingClientRect();

    dragState = {
      popup,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height
    };

    popup.setPointerCapture?.(event.pointerId);
    popup.classList.add("is-dragging");
    event.preventDefault();
  });

  document.addEventListener("pointermove", (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const {
      popup,
      offsetX,
      offsetY,
      width,
      height
    } = dragState;

    // 水平及垂直方向各保留至少 25%，其餘最多 75% 可移出畫面。
    const visibleRatio = 0.25;

    const minLeft = -width * (1 - visibleRatio);
    const maxLeft = window.innerWidth - width * visibleRatio;
    const minTop = -height * (1 - visibleRatio);
    const maxTop = window.innerHeight - height * visibleRatio;

    const desiredLeft = event.clientX - offsetX;
    const desiredTop = event.clientY - offsetY;

    const left = Math.min(
      maxLeft,
      Math.max(minLeft, desiredLeft)
    );

    const top = Math.min(
      maxTop,
      Math.max(minTop, desiredTop)
    );

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;

    event.preventDefault();
  }, { passive: false });

  const finishDrag = (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const { popup, pointerId } = dragState;

    if (popup.hasPointerCapture?.(pointerId)) {
      popup.releasePointerCapture(pointerId);
    }

    popup.classList.remove("is-dragging");
    dragState = null;
  };

  document.addEventListener("pointerup", finishDrag);
  document.addEventListener("pointercancel", finishDrag);
})();

// 事件委派：不用管 class-features 何時重繪
if (typeof document !== "undefined") document.addEventListener("click", (e) => {
  const el = e.target.closest(".beast-tip");
  if (!el) return;
  const key = el.dataset.beast;
  showBeastPopup(key, el);
});

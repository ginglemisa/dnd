(function attachActionPanel(globalScope) {
  "use strict";

  const STATIC_OPTIONS = Object.freeze({
    basic: Object.freeze([
      { key: "attack", label: "攻擊", description: "拾取或拔出一把武器進行攻擊。" },
      { key: "unarmed", label: "徒手", description: "對 5 呎內的目標拳打、踢擊或以其他方式徒手攻擊。命中加值為力量調整值加熟練加值；命中時造成 1 加力量調整值的鈍擊傷害。" },
      { key: "grapple", label: "擒抱", description: "以一次擒抱替代一次攻擊，以空手抓住 5 呎內、且體型不超過你一級的目標。目標進行力量或敏捷豁免（DC = 8 + 力量調整值 + 熟練加值）；失敗時陷入擒抱狀態。" },
      { key: "shove", label: "推撞", description: "以一次推撞替代一次攻擊，選擇 5 呎內、且體型不超過你一級的目標。目標進行力量或敏捷豁免（DC = 8 + 力量調整值 + 熟練加值）；失敗時由你將其推開 5 呎或擊倒。" },
      { key: "dash", label: "衝刺", description: "在本回合剩餘時間內，獲得等同於你速度的額外移動力。" },
      { key: "disengage", label: "撤離", description: "在本回合剩餘時間內，你的移動不會引發藉機攻擊。" },
      { key: "dodge", label: "閃避", description: "直到你下一回合開始前，對你的攻擊擲骰具有劣勢，且你的敏捷豁免具有優勢。若你陷入失能狀態或速度為 0，便失去此效果。" },
      { key: "help", label: "協助", description: "協助另一個生物進行屬性檢定或攻擊擲骰，也可以對其施予急救。" },
      { key: "hide", label: "躲藏", description: "進行一次敏捷（隱匿）檢定，嘗試避開其他生物的注意。" },
      { key: "influence", label: "影響", description: "進行魅力（欺瞞、威嚇、表演或遊說）或感知（馴獸）檢定，嘗試改變生物的態度。" },
      { key: "magic", label: "魔法", description: "施放施法時間為動作的法術、使用魔法物品，或啟動需要魔法動作的特性。" },
      { key: "ready", label: "準備", description: "設定一個可感知的觸發條件，並指定條件發生時要執行的動作。觸發後，你使用反應執行該動作。" },
      { key: "search", label: "搜索", description: "進行感知（洞悉、醫藥、察覺或生存）檢定，尋找隱藏的生物、物品或線索。" },
      { key: "study", label: "研究", description: "進行智力（奧秘、歷史、調查、自然或宗教）檢定，回想或分析相關資訊。" },
      { key: "utilize", label: "使用", description: "操作或使用需要動作的非魔法物品。" }
    ]),
    action: Object.freeze([

    ]),
    bonus: Object.freeze([
      { key: "drink-potion", label: "喝藥水", description: "以附贈動作喝下一瓶治療藥水，恢復 2d4 + 2 點生命值。" },
      { key: "offhand-attack", label: "二次攻擊", description: "在自己的回合以輕型武器執行攻擊動作後，可用附贈動作持另一把輕型武器再攻擊一次。除非具備特定專長，這次攻擊的傷害不加正值屬性調整值。" }
    ]),
    reaction: Object.freeze([
      { key: "opportunity-attack", label: "藉機攻擊", description: "當你能看見的生物離開你的觸及範圍時，你可以使用反應，對該生物進行一次近戰攻擊。" },
      { key: "execute-ready", label: "執行準備", description: "先前使用「準備」且指定觸發條件成立時發生" }
    ]),
    movement: Object.freeze([
      {
        key: "special-speeds",
        label: "特殊速度",
        description: "有些生物具有特殊速度，例如掘穴速度、攀爬速度、飛行速度或游泳速度；各詞條定義見本詞彙。\n\n如果你有不只一種速度，移動時要先選擇這次使用哪一種；你也可以在同一次移動中途切換。\n\n每次切換時，從新速度中扣除你已移動的距離；結果就是你還能以該速度再移動多遠。若結果為 0 或更低，你在這次移動期間就不能使用新的速度。\n\n例如，如果你的速度為 30 呎，飛行速度為 40 呎，你可以先飛 10 呎、走 10 呎，再跳到空中多飛 20 呎。"
      },
      {
        key: "speed-changes",
        label: "速度變化",
        description: "若某效果在一段時間內提高或降低你的速度，你擁有的每一種特殊速度也會在相同持續時間內等量提高或降低。\n\n例如，如果你的速度被降為 0，而你具有攀爬速度，則你的攀爬速度也會降為 0。\n\n同樣地，如果你的速度減半，而你具有飛行速度，你的飛行速度也會減半。"
      },
      {
        key: "climbing",
        label: "攀爬",
        description: "攀爬一格地圖花費 10 呎移動力；若為困難地形，則花費 15 呎。有攀爬速度的生物不受此限制。攀爬濕滑表面時，可能需要依主持人判斷通過運動檢定。"
      },
      {
        key: "crawling",
        label: "匍匐",
        description: "匍匐一格地圖花費 10 呎移動力；若為困難地形，則花費 15 呎。"
      },
      {
        key: "flying",
        label: "飛行",
        description: "生物可以透過各種效果獲得飛行能力。飛行中的生物若陷入失能或倒地狀態，或飛行速度降至 0，就會墜落；有滯空能力的生物不受此限制。"
      },
      {
        key: "long-jump",
        label: "跳遠",
        description: "助跑至少 10 呎後，可以跳躍等同力量值的呎數；立定跳遠減半。每跳 1 呎花費 1 呎移動力。落在困難地形時，必須通過 DC 10 體操檢定，否則倒地。越過高度不超過跳躍距離四分之一的障礙物時，主持人可要求通過 DC 10 運動檢定，否則撞上障礙物。"
      },
      {
        key: "high-jump",
        label: "跳高",
        description: "助跑至少 10 呎後，可以向上跳躍 3 + 力量調整值 呎，最低為 0 呎；立定跳高減半。每跳 1 呎花費 1 呎移動力。向上伸手時，最高可觸及 跳躍高度 + 1.5 倍身高。"
      },
      {
        key: "swimming",
        label: "游泳",
        description: "游泳一格地圖花費 10 呎移動力；若為困難地形，則花費 15 呎。有游泳速度的生物不受此限制。在湍急水域移動時，主持人可要求通過 DC 15 運動檢定。"
      }
    ])
  });

  const MODE_META = Object.freeze({
    basic: { timing: "每回合一次", summary: "執行主要行動，例如攻擊或閃避。", prompt: "請選擇一個動作查看說明。" },
    action: { timing: "每回合一次", summary: "執行專屬行動，例如魯莽攻擊。", prompt: "請選擇一個專屬動作查看說明。" },
    bonus: { timing: "每回合最多一次", summary: "執行有條件的額外動作，只有規則或能力允許時才能使用。", prompt: "請選擇一個附贈動作查看說明。" },
    reaction: { timing: "每輪最多一次", summary: "在自己或別人的回合符合觸發條件時使用。", prompt: "請選擇一個反應查看說明。" },
    movement: { timing: "自己的回合中", summary: "改變你的位置，移動可分段穿插在動作前後。", prompt: "請選擇一項移動規則查看說明。" }
  });

  const FEATURE_SOURCE_LABELS = Object.freeze({
    class: "職業",
    race: "種族",
    feat: "專長",
    spell: "法術",
    invocation: "魔能祈喚",
    metamagic: "超魔法"
  });

  const TABLETOP_FEAT_ACTION_RULES = Object.freeze([
    { feat: "臨陣施法", level: 4, modes: ["reaction"], label: "迎擊法術", ruleNames: ["迎擊法術"], legacyKeys: { reaction: "dynamic-reaction-feat-dkui7n" } },
    { feat: "尋物好手", level: 4, modes: ["bonus"], label: "信手拈來", ruleNames: ["信手拈來"], legacyKeys: { bonus: "dynamic-bonus-feat-a4ncv1" } },
    { feat: "醫療兵", modes: ["action"], label: "急救處置", ruleNames: ["急救處置"], proficiencyValue: true },
    { feat: "醫療兵", modes: ["action"], label: "穩定療效", ruleNames: ["穩定療效"] },
    { feat: "擒抱者", level: 4, modes: ["action"], label: "重拳擒抱", ruleNames: ["重拳擒抱"] },
    { feat: "擒抱者", level: 4, modes: ["movement"], label: "迅捷摔技", ruleNames: ["迅捷摔技"] },
    { feat: "衝鋒猛擊", level: 4, modes: ["movement"], label: "加速疾走", ruleNames: ["加速疾走"] },
    { feat: "衝鋒猛擊", level: 4, modes: ["action", "movement"], label: "直線衝擊", ruleNames: ["直線衝擊"], numberedChoices: true },
    { feat: "雙持追擊", level: 4, modes: ["action", "bonus"], legacyKeys: { bonus: "dynamic-bonus-feat-rklusa" }, label: "雙持追擊", ruleNames: ["雙持追擊", "傷害調整"], quickMasteryLabel: true },
    { feat: "雙持追擊", level: 4, modes: ["action"], label: "快速換手", ruleNames: ["快速換手"] },
    { feat: "最佳旅伴", level: 4, modes: ["action"], label: "妙語如珠", ruleNames: ["妙語如珠"] },
    { feat: "封鎖者", level: 4, modes: ["reaction"], label: "封鎖者", ruleNames: ["封鎖者"], numberedTriggers: true },
    { feat: "迅捷步法", level: 4, modes: ["action", "movement"], label: "跨越險地", ruleNames: ["跨越險地"] }
  ]);

  const INVOCATION_ACTION_RULES = Object.freeze([
    { name: "刃之魔契", modes: ["bonus"], level: 1 },
    { name: "鏈之魔契", modes: ["action"], level: 1 },
    { name: "共視感官", modes: ["bonus"], level: 5 },
    { name: "鏈主賦能", modes: ["bonus", "reaction"], level: 5, requires: "鏈之魔契" }
  ]);

  // Timing and requirements are explicit. Description IDs only select display copy
  // from canonical class data; headings and prose never decide availability.
  // Each class currently has one fixed SRD subclass, acquired at level 3.
  // Existing keys are persisted player hide preferences: keep them when editing labels.
  const CLASS_ACTION_RULES = Object.freeze({
    barbarian: Object.freeze([
      { id: "reckless-attack", mode: "action", level: 2, label: "魯莽", key: "dynamic-action-class-8jjnkp", descriptionId: "barbarian-reckless-attack" },
      { id: "rage", mode: "bonus", level: 1, label: "等級 1：狂暴", key: "dynamic-bonus-barbarian-3te1cj", description: () => {
        const resource = globalScope.getCharacterResourceSpecs({ className: "barbarian", level: getCharacterLevel() })
          .find(spec => spec.key === "barbarian-rage");
        return `你可以用附贈動作進入狂暴（未穿重甲時）。

狂暴期間：

- 你對鈍擊,穿刺,揮砍傷害有抗性。
- 你用力量造成的傷害 +${getBarbarianRageDamageBonus()}
- 你的力量檢定與力量豁免有優勢。
- 你不能施法，也不能維持專注。

持續時間：到你下個回合結束。若要延長，每回合至少做一項：

- 對敵人做攻擊檢定，或
- 讓敵人做豁免檢定，或
- 再用一次附贈動作延長狂暴。

若你穿上重甲、陷入失能，或超過 10 分鐘，狂暴會結束。

使用次數：${resource.maximum} 次；${resource.recoveryNote}`;
      } },
      { id: "frenzy", mode: "action", level: 3, label: "等級 3：狂怒（狂戰子職）", key: "dynamic-action-barbarian-ekb4kt", description: () => `在狂暴中使用魯莽攻擊，且用力量攻擊命中本回合第一個目標時，可額外造成 ${getBarbarianRageDamageBonus()}d6 傷害（骰數＝狂暴傷害加值），類型同該次攻擊。` },
      { id: "extra-attack", mode: "action", level: 5, label: "等級 5：額外攻擊", key: "dynamic-action-barbarian-113ebtz", description: "你在自己回合使用攻擊動作時，可以攻擊 2 次。" },
      { id: "fast-movement", mode: "movement", level: 5, label: "等級 5：快速移動", key: "dynamic-movement-barbarian-18h2p2v", description: "若你未穿重甲，速度 +10 呎。" },
      { id: "instinctive-pounce", mode: "movement", level: 7, label: "等級 7：直覺猛撲", key: "dynamic-movement-barbarian-1iw4zkg", description: "當你以附贈動作進入狂暴時，可以在該附贈動作中移動至多等同於你速度一半的距離。" },
      { id: "instinctive-pounce", mode: "bonus", level: 7, label: "等級 7：直覺猛撲", key: "dynamic-bonus-barbarian-1iw4zkg", description: "當你以附贈動作進入狂暴時，可以在該附贈動作中移動至多等同於你速度一半的距離。" },
    ]),
    monk: Object.freeze([
      { id: "martial-arts-action", mode: "action", level: 1, label: "等級 1：武藝", description: getMonkMartialArtsDescription, key: "dynamic-action-monk-curated-martial-arts-action" },
      { id: "martial-arts-bonus", mode: "bonus", level: 1, label: "等級 1：武藝", description: getMonkMartialArtsDescription, key: "dynamic-bonus-monk-curated-martial-arts-bonus", legacyKeys: ["dynamic-bonus-class-muonvc"] },
      { id: "focused-aim", mode: "bonus", level: 2, label: "等級 2：聚氣凝神", description: getMonkFocusDescription, key: "dynamic-bonus-monk-curated-focused-aim", legacyKeys: ["dynamic-bonus-class-ricpmu"] },
      { id: "uncanny-metabolism", mode: "action", level: 2, label: "等級 2：吐故納新", description: "擲先攻時，你可回滿已消耗的專注點，並回復「武藝骰 + 武僧等級」生命值。\n\n此能力每次長休只能用 1 次。", key: "dynamic-action-monk-curated-uncanny-metabolism" },
      { id: "deflect-attacks", mode: "reaction", level: 3, label: "等級 3：撥擋化勁", description: getMonkDeflectAttacksDescription, key: "dynamic-reaction-monk-curated-deflect-attacks", legacyKeys: ["dynamic-reaction-class-5l2yua"] },
      { id: "slow-fall", mode: "reaction", level: 4, label: "等級 4：輕身墜", description: getMonkSlowFallDescription, key: "dynamic-reaction-monk-curated-slow-fall", legacyKeys: ["dynamic-reaction-class-1l1lc9s"] },
      { id: "stunning-strike", mode: "action", level: 5, label: "等級 5：震懾擊", description: "每回合 1 次，當你用武僧武器或徒手命中時，可花 1 點專注點發動震懾打擊。目標需做體質豁免：\n\n- 失敗：震懾到你下回合開始。\n- 成功：速度減半，且到你下回合開始前，下一次對它的攻擊有優勢。", key: "dynamic-action-monk-curated-stunning-strike", legacyKeys: ["dynamic-action-class-1g9j8ui"] },
      { id: "extra-attack", mode: "action", level: 5, label: "等級 5：額外攻擊", description: "你在自己回合使用攻擊動作時，可以攻擊 2 次。", key: "dynamic-action-monk-curated-extra-attack" },
      { id: "wholeness-of-body", mode: "bonus", level: 6, label: "等級 6：混元體", description: getMonkWholenessDescription, key: "dynamic-bonus-monk-curated-wholeness-of-body", legacyKeys: ["dynamic-bonus-class-3mzm48"] }
    ]),
    bard: Object.freeze([
      { id: "inspiration", mode: "bonus", level: 1, label: "等級 1：吟遊詩人激勵", key: "dynamic-bonus-class-r7asqs", description: () => `選擇 1 名 60 呎內看得到你或聽得到你的生物，使其獲得 1 顆激勵骰（d${getCharacterLevel() >= 5 ? 8 : 6}）。

- 目標在 d20 檢定失敗後，可擲激勵骰並加到結果上。
- 激勵骰使用後消耗，未使用則持續 1 小時。
- 同一生物同時只能持有 1 顆你的激勵骰。
- 可用次數＝魅力調整值（至少 1 次），${getCharacterLevel() >= 5 ? "短休或長休後全部恢復。\n- 激勵之源：你可無需動作消耗 1 個法術位，恢復 1 次激勵使用次數。" : "長休後全部恢復。"}` },
      { id: "cutting-words", mode: "reaction", level: 3, label: "等級 3：語出驚人", key: "dynamic-reaction-class-1y0uv3b", descriptionId: "bard-cutting-words" },
      { id: "countercharm", mode: "reaction", level: 7, label: "等級 7：反迷惑", key: "dynamic-reaction-class-ul9dq", descriptionId: "bard-countercharm" }
    ]),
    cleric: Object.freeze([
      { id: "divine-spark", mode: "action", level: 2, label: "等級 2：神聖火花", key: "dynamic-action-cleric-1c18bru", description: () => getClericChannelDescription("cleric-divine-spark") },
      {
        id: "turn-undead", mode: "action", level: 2, key: "dynamic-action-cleric-xonbxu",
        label: () => getCharacterLevel() >= 5 ? "等級 5：焚燒不死生物" : "等級 2：驅散不死生物",
        description: getClericTurnUndeadDescription
      },
      { mode: "action", level: 3, label: "等級 3：生命門徒（生命）", description: "你用法術位施放回復法術時，目標在本回合額外回復「2 + 法術環級」生命值。", key: "dynamic-action-cleric-1ocjvx6", id: "disciple-of-life" },
      { mode: "action", level: 3, label: "等級 3：維持生命（生命）", description: () => {
        const rawLevel = String(document.getElementById("level")?.value || "").trim();
        const healingTotal = rawLevel ? String(getCharacterLevel() * 5) : "牧師等級 × 5";
        return `這會消耗引導神力，視為魔法動作。\n\n你展示聖徽，分配總共「${healingTotal}」點治療量給 30 呎內任意數量重傷生物。\n\n此特性不能把目標回到超過其生命值上限一半。`;
      }, key: "dynamic-action-cleric-aoatsu", id: "preserve-life", legacyKeys: ["dynamic-action-class-preserve-life"] },
      { id: "divine-strike", mode: "action", level: 7, label: "等級 7：神聖打擊", description: "在你的每個回合中一次，當你使用武器發動攻擊檢定並命中一個生物時，可以使目標額外受到1d8黯蝕或光耀傷害（由你選擇）。", key: "dynamic-action-cleric-sxx32", checkedId: "cleric-blessed-strikes-divine-strike" }
    ]),
    druid: Object.freeze([
      { id: "wild-shape", mode: "bonus", level: 2, label: "等級 2：荒野形態", key: "dynamic-bonus-class-3u4zp1", descriptionId: "druid-wild-shape" },
      { id: "wild-companion", mode: "action", level: 2, label: "等級 2：荒野夥伴", descriptionId: "druid-wild-companion" },
      { id: "lands-aid", mode: "action", level: 3, label: "等級 3：大地之援（大地子職）", descriptionId: "druid-lands-aid" }
    ]),
    fighter: Object.freeze([
      { mode: "bonus", level: 1, label: "等級 1：回氣", description: () => {
        const level = getCharacterLevel();
        const uses = level >= 4 ? 3 : 2;
        const tacticalShift = level >= 5
          ? "\n- 戰術轉移：使用回氣時，可移動至多等同於速度一半的距離，且不會引發藉機攻擊。"
          : "";
        return `使用附贈動作，恢復 1d10 + ${level} 生命值。\n\n- 使用次數：${uses} 次；短休回復 1 次，長休全部回復。${tacticalShift}`;
      }, key: "dynamic-bonus-fighter-qmmfue", id: "second-wind", legacyKeys: ["dynamic-bonus-class-fj2om2"] },
      { mode: "action", level: 2, label: "等級 2：動作如潮", description: "你的回合中，可以獲得 1 個額外動作。\n\n- 此額外動作不能用於魔法動作。\n- 使用後，短休或長休才能再次使用。", key: "dynamic-action-fighter-1870147", id: "action-surge", legacyKeys: ["dynamic-action-class-action-surge"] },
      { mode: "movement", level: 3, label: "等級 3：運動健將", description: "造成重擊後，可立即移動至多等同於速度一半的距離，且不會引發藉機攻擊。", key: "dynamic-movement-fighter-1s26hvz", id: "remarkable-athlete" },
      { mode: "action", level: 5, label: "等級 5：額外攻擊", description: "你在自己回合使用攻擊動作時，可以攻擊 2 次。", key: "dynamic-action-fighter-113ebtz", id: "extra-attack" },
      { mode: "movement", level: 5, label: "等級 5：戰術轉移", description: "當你以附贈動作使用回氣時，可以移動至多等同於你速度一半的距離，且不會引發藉機攻擊。", key: "dynamic-movement-fighter-1liysqo", id: "tactical-shift" }
    ]),
    paladin: Object.freeze([
      { id: "lay-on-hands", mode: "bonus", level: 1, label: "等級 1：聖療", description: "以附贈動作觸碰自己或一個生物，從「聖療」池分配任意點數，使其恢復等量 HP。\n\n也可消耗 5 點聖療，移除目標的中毒狀態；此時不恢復 HP。", key: "dynamic-bonus-paladin-curated-lay-on-hands", legacyKeys: ["dynamic-bonus-class-1ol2xxh"] },
      { id: "divine-sense", mode: "bonus", level: 3, label: "等級 3：神聖感知", description: "消耗 1 次引導神力，以附贈動作啟動，持續 10 分鐘或直到你失能。\n\n期間你能感知 60 呎內天界生物、邪魔與不死生物的位置與類型，也能察覺範圍內受「聖居」祝福或褻瀆的地點與物件。", key: "dynamic-bonus-paladin-curated-divine-sense", legacyKeys: ["dynamic-bonus-class-1axs7np"] },
      { id: "sacred-weapon", mode: "action", level: 3, label: "等級 3：祝聖武器", descriptionId: "paladin-sacred-weapon", key: "dynamic-action-paladin-curated-sacred-weapon", legacyKeys: ["dynamic-action-class-sacred-weapon"] },
      { id: "extra-attack", mode: "action", level: 5, label: "等級 5：額外攻擊", description: "你在自己回合使用攻擊動作時，可以攻擊 2 次。", key: "dynamic-action-paladin-curated-extra-attack" }
    ]),
    rogue: Object.freeze([
      { id: "sneak-attack", mode: "action", level: 1, label: "等級 1：偷襲", description: getRogueSneakAttackDescription, key: "dynamic-action-rogue-curated-sneak-attack" },
      { id: "fast-hands", mode: "bonus", level: 3, label: "等級 3：快手", description: "你可用附贈動作進行以下其中一項：\n\n- 巧手：做敏捷（巧手）檢定來開鎖、解除陷阱或扒竊。\n- 使用物品：執行使用動作，或用魔法動作啟動需要該動作的魔法物品。", key: "dynamic-bonus-rogue-curated-fast-hands", legacyKeys: ["dynamic-bonus-class-84ttm1"] },
      { id: "steady-aim", mode: "bonus", level: 3, label: "等級 3：手穩就準", description: "附贈動作啟動後，你本回合下一次攻擊檢定有優勢。\n\n但你必須在本回合尚未移動，且啟動後速度變為 0（直到回合結束）。", key: "dynamic-bonus-rogue-curated-steady-aim", legacyKeys: ["dynamic-bonus-class-kwgie8"] },
      { id: "cunning-action", mode: "bonus", level: 2, label: "等級 2：靈巧動作", key: "dynamic-bonus-class-1vms7ce", descriptionId: "rogue-cunning-action" },
      { id: "uncanny-dodge", mode: "reaction", level: 5, label: "等級 5：直覺閃避", key: "dynamic-reaction-class-5f9k5x", descriptionId: "rogue-uncanny-dodge" }
    ]),
    sorcerer: Object.freeze([
      { id: "innate-sorcery", mode: "bonus", level: 1, label: "等級 1：天生術法", key: "dynamic-bonus-class-1lqwnvp", description: "你體內的魔力可被短暫解放。作為附贈動作啟動後，持續 1 分鐘並獲得：\n\n- 你的術士法術豁免 DC +1。\n- 你的術士法術攻擊檢定具有優勢。\n\n使用次數：2 次；長休後全回復。" },
      { id: "font-of-magic", mode: "bonus", level: 2, label: "魔力泉湧", key: "dynamic-bonus-class-i5lemn", description: "你可運用術法點來啟動魔法效果。\n起始術法點為 2 點；高等級時依「術士特性」表提升。\n你持有的術法點不可超過目前等級上限；長休後全回復。\n\n你可使用以下轉換：\n- 將法術位轉為術法點：消耗 1 個法術位，獲得等同該環階的術法點，無需動作。\n- 創造法術位：以附贈動作消耗術法點換成法術位，且不能創造 6 環以上法術位。\n\n消耗與最低術士等級如下：\n1 環法術位消耗 2 點術法點，最低術士等級 2\n2 環法術位消耗 3 點，最低術士等級 3\n3 環法術位消耗 5 點，最低術士等級 5\n4 環法術位消耗 6 點，最低術士等級 7\n\n以此特性創造的法術位會在長休後消散。" },
      { id: "sorcery-incarnate", mode: "bonus", level: 7, label: "等級 7：術法化身", key: "dynamic-bonus-class-1lfxnv8", descriptionId: "sorcerer-sorcery-incarnate" }
    ]),
    ranger: Object.freeze([
      { mode: "bonus", level: 3, label: "等級 3：獵人學識", description: "目標被你的「獵人印記」標記時，你會知道它的傷害免疫、抗性與易傷。", key: "dynamic-bonus-ranger-we5ttw", id: "hunters-lore" },
      { mode: "action", level: 3, label: "等級 3：狩獵目標", description: "從下列擇一；每次短休或長休後可改選：\n\n- 斬殺者：每回合 1 次，你用武器命中且目標先前已失去生命值時，額外造成 1d8 傷害。\n- 破陣者：每回合 1 次，當你用武器攻擊時，可用同一把武器再攻擊 5 呎內另一個你本回合尚未攻擊過的目標。", key: "dynamic-action-ranger-vdr4tc", id: "hunters-prey" },
      { mode: "action", level: 5, label: "等級 5：額外攻擊", description: "你在自己回合使用攻擊動作時，可以攻擊 2 次。", key: "dynamic-action-ranger-113ebtz", id: "extra-attack" },
      { mode: "movement", level: 6, label: "等級 6：越野", description: "你獲得等同於你速度的攀爬速度與游泳速度。\n\n未穿重甲時，你的速度增加 10 呎。", key: "dynamic-movement-ranger-bulhou", id: "roving" },
      { mode: "action", level: 7, label: "等級 7：防守戰術", description: "選擇並獲得下列一項。每當你完成短休或長休時，可以用另一項替換目前的選擇。\n\n- 衝出重圍：以你為目標的藉機攻擊具有劣勢。\n- 多重防禦：當一個生物的攻擊檢定命中你時，該生物在本回合內對你發動的所有後續攻擊檢定均具有劣勢。", key: "dynamic-action-ranger-p55ifk", id: "defensive-tactics" }
    ]),
    warlock: Object.freeze([
      { id: "arcane-recovery", mode: "action", level: 2, label: "等級 2：秘法回流", key: "dynamic-action-warlock-curated-arcane-recovery", descriptionId: "warlock-magical-cunning" },
      { id: "thirsting-blade", mode: "action", level: 5, invocation: "饑渴魔刃", label: "饑渴魔刃", description: "先決條件：契術師等級 5+,刃之魔契祈喚\n你在使用契約武器時獲得額外攻擊：在你回合以該武器執行攻擊動作時，可攻擊 2 次而非 1 次。", key: "dynamic-action-warlock-curated-thirsting-blade", requiresInvocation: "刃之魔契" },
      { id: "eldritch-smite", mode: "action", level: 5, invocation: "魔能斬擊", label: "魔能斬擊", description: "先決條件：契術師等級 5+,刃之魔契祈喚\n每回合一次，當你用契約武器命中生物時，可消耗 1 個契術師法術位，造成額外力場傷害：1d8＋該法術位每環階再加 1d8，並可使大型或更小目標倒地。", key: "dynamic-action-warlock-curated-eldritch-smite", requiresInvocation: "刃之魔契" },
      { id: "dark-ones-own-luck", mode: "action", level: 6, label: "等級 6：黑暗強運（邪魔子職）", description: "當你進行屬性檢定或豁免檢定時，可以使用該特性將1d10加到擲骰結果中。你可以在看到擲骰結果後、結果生效前使用該特性。\n\n你可以使用該特性的次數等同於你的魅力調整值（至少一次），但每次擲骰只能使用一次。完成長休時，你恢復所有已消耗的使用次數。", key: "dynamic-action-warlock-curated-dark-ones-own-luck" }
    ]),
    wizard: Object.freeze([
      { id: "potent-cantrip", mode: "action", level: 3, label: "等級 3：強力戲法（塑能子職）", description: "當你對生物施放會造成傷害的戲法時：\n\n- 若攻擊檢定失手，或\n- 目標在該戲法豁免成功，\n- 目標仍會受到一半傷害（若該戲法有傷害），但不受其他效果影響。", key: "dynamic-action-wizard-curated-potent-cantrip" },
      { id: "memorize-spell", mode: "action", level: 5, label: "等級 5：記憶法術", description: "每次短休後，你可研讀法術書。\n\n你可把 1 個由「施法」特性準備中的 1+環法師法術，替換成法術書中的另一個 1+環法師法術。", key: "dynamic-action-wizard-curated-memorize-spell" },
      { id: "sculpt-spells", mode: "action", level: 6, label: "等級 6：法術塑形（塑能子職）", description: "當你施展會影響你所能看見之其他生物的塑能系法術時，可以從中選擇1＋該法術環階名生物。所選生物對抗該法術的豁免檢定自動成功，且不會受到通常在豁免成功時仍會承受的一半傷害。", key: "dynamic-action-wizard-curated-sculpt-spells" }
    ])
  });

  const RACE_ACTION_RULES = Object.freeze([
    { id: "breath", race: "dragonborn", level: 1, mode: "action", label: "吐息元素", key: "dynamic-action-race-1loctyz", description: getDragonbornBreathDescription },
    { id: "fire-burn", race: "goliath", level: 1, mode: "action", label: "星火燎原", key: "dynamic-action-race-1vjg9hw", choiceId: "goliath-ancestry", choiceValue: "fire", description: "攻擊命中目標時增加 1d10 火焰傷害。" },
    { id: "frost-chill", race: "goliath", level: 1, mode: "action", label: "凜若冰霜", key: "dynamic-action-race-cc167a", choiceId: "goliath-ancestry", choiceValue: "frost", ruleName: "凜若冰霜（霜巨人）" },
    { id: "hill-tumble", race: "goliath", level: 1, mode: "action", label: "地動山搖", key: "dynamic-action-race-11249i9", choiceId: "goliath-ancestry", choiceValue: "hill", description: "攻擊命中大型以下的生物可令其陷入「倒地」狀態。" },
    { id: "stone-endurance", race: "goliath", level: 1, mode: "reaction", label: "堅若磐石", key: "dynamic-reaction-race-16nfphm", choiceId: "goliath-ancestry", choiceValue: "stone", description: () => {
      const modifier = getAbilityModifier("con");
      const dice = modifier === null ? "1d12 + 體質調整值" : formatDiceWithModifier("1d12", modifier);
      return getGoliathAncestryDescription("堅若磐石（石巨人）", `受傷時可用反應扣除 ${dice} 傷害。`);
    } },
    { id: "nimbleness", race: "halfling", level: 1, mode: "movement", label: "半身人靈巧", key: "dynamic-movement-race-hkw7d1", description: "可穿過體型比你大的生物\n不能停在同一格", tabletopOnly: true },
    { id: "lucky", race: "halfling", level: 1, mode: "action", label: "吉運", key: "dynamic-action-race-1migdkt", description: "任何 D20 檢定中擲出 1 都可以重擲一次。", tabletopOnly: true },
    { id: "naturally-stealthy", race: "halfling", level: 1, mode: "action", label: "天生善匿", key: "dynamic-action-race-150qsdc", description: "你可以在體型比你大的生物後方使用躲藏動作。", tabletopOnly: true },
    { id: "naturally-stealthy", race: "halfling", level: 2, mode: "bonus", label: "天生善匿", className: "rogue", description: "你可以在體型比你大的生物後方使用躲藏動作。", tabletopOnly: true, key: "dynamic-bonus-race-150qsdc" },
    { id: "draconic-flight", race: "dragonborn", level: 5, mode: "bonus", label: "等級 5：龍翔天際", key: "dynamic-bonus-race-1h4jffx", ruleName: "龍翔天際" },
    { id: "stonecunning", race: "dwarf", level: 1, mode: "bonus", label: "石中精妙", key: "dynamic-bonus-race-m9n3bt", ruleName: "石中精妙" },
    { id: "clockwork-device", race: "gnome", level: 1, mode: "bonus", label: "岩石侏儒", key: "dynamic-bonus-race-1ljlrzt", ruleName: "岩石侏儒", choiceId: "gnome-lineage", choiceValue: "rock_gnome" },
    { id: "dismantle-device", race: "gnome", level: 1, mode: "action", label: "拆除發條裝置", ruleName: "岩石侏儒", choiceId: "gnome-lineage", choiceValue: "rock_gnome" },
    { id: "cloud-jaunt", race: "goliath", level: 1, mode: "bonus", label: "雲遊四方", key: "dynamic-bonus-race-r7ggqg", description: () => getGoliathAncestryDescription("雲遊四方（雲巨人）"), choiceId: "goliath-ancestry", choiceValue: "cloud" },
    { id: "storm-thunder", race: "goliath", level: 1, mode: "reaction", label: "轟雷掣電", key: "dynamic-reaction-race-4cc8u8", description: () => getGoliathAncestryDescription("轟雷掣電（風暴巨人）"), choiceId: "goliath-ancestry", choiceValue: "storm" },
    { id: "large-form", race: "goliath", level: 5, mode: "bonus", label: "等級 5：巨化形體", key: "dynamic-bonus-race-1svsj4g", ruleName: "巨化形體" },
    { id: "adrenaline-rush", race: "orc", level: 1, mode: "bonus", label: "熱血湧動", key: "dynamic-bonus-race-ydqmx5", ruleName: "熱血湧動", proficiencyValue: true }
  ]);

  let currentMode = "action";
  let selectedOptionKey = "";
  let scheduledRefresh = 0;
  let panelElements = null;

  function sourceToPlainText(raw) {
    const holder = document.createElement("div");
    holder.innerHTML = String(raw ?? "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<hr\b[^>]*>/gi, "\n")
      .replace(/<\/(?:div|p|li|tr|h[1-6]|details)>/gi, "$&\n");
    holder.querySelectorAll("table, input, button, select, label, [hidden], .is-hidden").forEach(element => element.remove());
    return (holder.textContent || "")
      .replace(/\u00a0/g, " ")
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function stableKeyHash(value) {
    let hash = 2166136261;
    for (const character of String(value)) {
      hash ^= character.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function getCharacterLevel() {
    return Number(document.getElementById("level")?.value) || 1;
  }

  function getProficiencyBonus() {
    return globalScope.calculateProficiencyBonus?.(getCharacterLevel()) || 2;
  }

  function getBarbarianRageDamageBonus() {
    const level = getCharacterLevel();
    if (level >= 16) return 4;
    if (level >= 9) return 3;
    return 2;
  }

  function getSelectedFeatNames() {
    return new Set(Array.from(document.querySelectorAll("#feats-area select"), select => select.value).filter(Boolean));
  }

  function getFeatRuleText(featName, ruleName) {
    return getNamedRuleDescription(typeof featsDesc === "undefined" ? "" : featsDesc[featName], ruleName);
  }

  function formatTabletopFeatRule(rule) {
    let description = rule.ruleNames
      .map(ruleName => getFeatRuleText(rule.feat, ruleName))
      .filter(Boolean)
      .join(" ");
    if (!description) return "";
    if (rule.proficiencyValue && document.getElementById("level")?.value) {
      description = description.replace(/熟練加值/gu, String(getProficiencyBonus()));
    }
    if (rule.quickMasteryLabel) {
      description = description
        .replace(/；?\s*可與「迅切」並用。?/u, "；可與「迅切」武器精通並用。")
        .replace(/。\s*若無/u, "；若無");
    }
    if (rule.numberedChoices) {
      description = description.replace(/：\s*\+1d8 傷害；或將/u, "：\n\n1️⃣+1d8 傷害\n2️⃣將");
    }
    if (rule.numberedTriggers) {
      description = description.replace(/：進行「撤離」行動；攻擊命中他人。?$/u, "：\n\n1️⃣進行「撤離」行動的目標\n2️⃣攻擊命中他人的目標。");
    }
    return description;
  }

  function getTabletopFeatRuleEntries(mode) {
    const selectedFeats = getSelectedFeatNames();
    return TABLETOP_FEAT_ACTION_RULES.flatMap(rule => {
      if (!rule.modes.includes(mode) || !selectedFeats.has(rule.feat) || getCharacterLevel() < (rule.level || 1)) return [];
      const description = formatTabletopFeatRule(rule);
      if (!description) return [];
      return [{
        key: rule.legacyKeys?.[mode] || `dynamic-${mode}-feat-curated-${stableKeyHash(`${rule.feat}|${rule.label}`)}`,
        label: rule.label,
        source: rule.source || FEATURE_SOURCE_LABELS.feat,
        description,
        dynamic: true
      }];
    });
  }

  function getAbilityModifier(abilityId) {
    const rawScore = String(document.getElementById(abilityId)?.value || "").trim();
    if (!/^[+-]?\d+$/u.test(rawScore)) return null;
    const score = Number(rawScore);
    return Number.isSafeInteger(score) ? Math.floor((score - 10) / 2) : null;
  }

  function getGoliathAncestryDescription(ruleName, override = "") {
    const description = override || getNamedRuleDescription(typeof raceFeatures === "undefined" ? "" : raceFeatures.goliath, ruleName);
    return description ? `${description}\n\n使用次數＝熟練加值，長休後恢復。` : "";
  }

  function getDragonbornBreathDamageDice(level) {
    if (level >= 17) return "4d10";
    if (level >= 11) return "3d10";
    if (level >= 5) return "2d10";
    return "1d10";
  }

  function getDragonbornBreathDamageType() {
    const ancestry = document.getElementById("dragonborn-ancestry")?.value || "";
    const damageTypes = {
      acid: "酸",
      lightning: "電",
      fire: "火",
      poison: "毒",
      cold: "冰"
    };
    return damageTypes[ancestry.split("_").at(-1)] || "";
  }

  function getDragonbornBreathDescription() {
    const constitutionModifier = getAbilityModifier("con");
    const saveDc = constitutionModifier === null
      ? "8+熟練+體質加值"
      : String(8 + getProficiencyBonus() + constitutionModifier);
    return `將１次攻擊換為吐息\n15呎錐形 或 5呎寬、30呎長直線\n範圍內生物敏捷豁免 DC ${saveDc}\n失敗造成 ${getDragonbornBreathDamageDice(getCharacterLevel())} 點${getDragonbornBreathDamageType()}傷害，成功傷害減半。\n使用次數＝熟練加值，長休後恢復。`;
  }

  function getSelectedSpellEntries(mode) {
    if (typeof SpellCatalog === "undefined") return [];
    const timingPattern = mode === "action"
      ? /(?:施法時間\s*[：:]\s*動作(?:或儀式)?(?=[ \t]*(?:\r?\n|$))|施法時間\s*[：:][ \t]*(?:\r?\n)+[ \t]*-[ \t]*動作(?:（[^）]+）)?)/u
      : mode === "bonus"
        ? /施法時間\s*[：:]\s*附贈動作/u
        : /施法時間\s*[：:]\s*反應動作/u;
    return Array.from(document.querySelectorAll('#tab-spells .spell-entry select[id*="-spell-"]')).flatMap(select => {
      const spellId = select.value || "";
      const spell = SpellCatalog.getSpell(spellId);
      if (!spell || !timingPattern.test(spell.desc || "")) return [];
      const row = select.closest(".spell-entry");
      const classSelect = row?.querySelector('select[id*="-class-"]');
      const sourceTag = typeof globalScope.getPickedSpellSourceTag === "function"
        ? globalScope.getPickedSpellSourceTag(row)
        : "";
      const sourceClassLabel = classSelect?.selectedOptions?.[0]?.textContent?.trim() || "";
      const sourceKey = row?.dataset.sourceKey || select.id;
      const sourceLabel = row?.dataset.sourceLabel
        || (sourceClassLabel ? `來源：${sourceClassLabel}法表` : "來源：職業法表");
      const levelTag = spell.level === 0
        ? "戲法"
        : `${["", "一", "二", "三", "四", "五", "六", "七", "八", "九"][spell.level] || spell.level}環`;
      const shortSourceLabel = sourceTag || sourceLabel.replace(/^來源[：:]\s*/u, "");
      return [{
        key: `dynamic-${mode}-spell-${spellId}-${stableKeyHash(sourceKey)}`,
        spellId,
        spellSourceKey: sourceKey,
        label: spell.nameZh,
        source: FEATURE_SOURCE_LABELS.spell,
        buttonTag: shortSourceLabel ? `${levelTag} · ${shortSourceLabel}` : levelTag,
        description: spell.desc,
        dynamic: true
      }];
    });
  }

  function getSelectedInvocationEntries(mode) {
    if (typeof eldritchInvocations === "undefined" || document.getElementById("class")?.value !== "warlock") return [];
    const selectedNames = new Set(Array.from(
      document.querySelectorAll("#eldritch-invocations-output input[data-invocation-name]:checked"),
      input => input.dataset.invocationName
    ).filter(Boolean));

    return INVOCATION_ACTION_RULES.flatMap(rule => {
      if (!selectedNames.has(rule.name) || !rule.modes.includes(mode) || getCharacterLevel() < rule.level) return [];
      if (rule.requires && !selectedNames.has(rule.requires)) return [];
      const invocation = eldritchInvocations.find(entry => entry.name === rule.name);
      if (!invocation) return [];
      const invocationText = sourceToPlainText(invocation.text || "");

      return [{
        key: `dynamic-${mode}-invocation-${stableKeyHash(invocation.name)}`,
        label: invocation.name,
        source: FEATURE_SOURCE_LABELS.invocation,
        description: invocationText,
        dynamic: true
      }];
    });
  }

  function getSelectedMetamagicEntries(mode) {
    if (mode !== "bonus" || document.getElementById("class")?.value !== "sorcerer" || getCharacterLevel() < 2) return [];

    return Array.from(
      document.querySelectorAll("#metamagicOptions input[data-metamagic-name]:checked")
    ).flatMap(input => {
      if (input.dataset.metamagicName !== "瞬發法術") return [];
      const option = typeof metamagicOptions === "undefined" ? null : metamagicOptions.find(entry => entry.name === "瞬發法術");
      const description = sourceToPlainText(option?.text || "");
      if (!description) return [];

      const label = input.dataset.metamagicName || "超魔法";
      return [{
        key: `dynamic-${mode}-metamagic-${stableKeyHash(label)}`,
        label,
        source: FEATURE_SOURCE_LABELS.metamagic,
        description,
        dynamic: true
      }];
    });
  }

  function getMonkAbilityModifier(abilityId) {
    const field = document.getElementById(abilityId);
    const rawScore = field && "value" in field ? String(field.value || "").trim() : "";
    if (!rawScore) return 0;
    const modifier = globalScope.calculateAbilityModifier?.(rawScore);
    return Number.isFinite(modifier) ? modifier : 0;
  }

  function getMonkMartialArtsDie() {
    return globalScope.getMonkMartialArtsDieByLevel(getCharacterLevel());
  }

  function getDoubleMonkMartialArtsDice() {
    const martialArtsDie = getMonkMartialArtsDie();
    if (String(martialArtsDie || "").startsWith("1d")) {
      return `2d${String(martialArtsDie).slice(2)}`;
    }
    return `2 × ${martialArtsDie}`;
  }

  function formatSignedModifier(value) {
    const modifier = Number(value);
    if (!Number.isFinite(modifier) || modifier === 0) return "+ 0";
    return modifier > 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`;
  }

  function formatDiceWithModifier(dice, modifier) {
    return `${dice} ${formatSignedModifier(modifier)}`;
  }

  function getMonkMartialArtsDescription() {
    return `你在未穿護甲、未持盾，且只使用徒手攻擊或武僧武器時，獲得以下效果：

武僧武器：簡易近戰武器，以及具有輕型屬性的軍用近戰武器。

- 附贈動作可再進行 1 次徒手攻擊。
- 徒手攻擊與武僧武器可使用武藝骰作為傷害骰，目前為 ${getMonkMartialArtsDie()}。
- 徒手攻擊與武僧武器的攻擊與傷害可用敏捷取代力量。
- 徒手推撞／擒抱的豁免 DC 也可用敏捷計算。`;
  }

  function getMonkFocusDescription() {
    const saveDc = 8 + getProficiencyBonus() + getMonkAbilityModifier("wis");
    const base = `你可消耗「專注點」施展武僧技巧。

你一開始有 3 種用法：

- 疾風連擊（1 點）：附贈動作打 2 次徒手。
- 閃轉騰挪：附贈動作可撤離；再花 1 點可同時撤離 + 回避。
- 疾步如風：附贈動作可疾走；再花 1 點可同時撤離 + 疾走，且本回合跳躍距離加倍。

若特性要求豁免，DC = ${saveDc}。`;
    if (getCharacterLevel() < 3) return base;
    return `${base}

等級 3：散打技巧

當「疾風連擊」命中時，可讓目標承受 1 種效果：

- 截擊：到你下回合結束前，目標不能發動借機攻擊。
- 擊退：目標力量豁免失敗則被推離你最多 15 呎。
- 擊倒：目標敏捷豁免失敗則倒地。`;
  }

  function getMonkDeflectAttacksDescription() {
    const level = getCharacterLevel();
    const dexterityModifier = getMonkAbilityModifier("dex");
    return `當攻擊命中你，且傷害含鈍擊／穿刺／揮砍時，你可用反應減傷：

${formatDiceWithModifier("1d10", dexterityModifier + level)}

若減到 0，你可再花 1 點專注點反擊：

- 擋近戰：選 5 呎內生物。
- 擋遠程：選 60 呎內你看得到，且不在全身掩護後的生物。

目標需過敏捷豁免；失敗則受到 ${formatDiceWithModifier(getDoubleMonkMartialArtsDice(), dexterityModifier)} 傷害（同原攻擊類型）。`;
  }

  function getMonkSlowFallDescription() {
    return `當你墜落時，可用「反應」減少 ${getCharacterLevel() * 5} 傷害。`;
  }

  function getMonkWholenessDescription() {
    return `以附贈動作恢復 ${formatDiceWithModifier(getMonkMartialArtsDie(), getMonkAbilityModifier("wis"))} HP，最少恢復 1 點。\n\n使用次數＝感知調整值（至少 1 次），長休後全部恢復。`;
  }

  function getRogueSneakAttackDescription() {
  const level = getCharacterLevel();
  const sneakAttackDice = Math.max(1, Math.ceil(level / 2));
  const base = `你每回合可在用靈巧或遠程武器命中時觸發 1 次偷襲，造成額外 ${sneakAttackDice}d6 傷害（同武器傷害類型）。

偷襲必須滿足以下條件其中之一：

- 這次攻擊有優勢，或
- 目標 5 呎內有至少 1 名未失能的友方，且你的攻擊沒有劣勢。`;
  if (level < 5) return base;
  const dexterityModifier = getAbilityModifier("dex") ?? 0;
  const saveDc = 8 + getProficiencyBonus() + dexterityModifier;
  return `${base}

等級 5：靈巧打擊

當你造成偷襲傷害時，可套用 1 種靈巧打擊效果。

每種效果都要先放棄部分偷襲傷害骰；若需要豁免，DC = ${saveDc}。

淬毒（消耗 1d6）：目標體質豁免失敗則中毒 1 分鐘；其每回合結束可再豁免，成功即結束。使用此效果時你需攜帶制毒師工具。
摔絆（消耗 1d6）：大型或更小目標敏捷豁免失敗則倒地。
撤步（消耗 1d6）：攻擊後你可立刻移動至多一半速度，且不引發藉機攻擊。`;
}

  function hasSelectedEldritchInvocation(invocationName) {
    if (!invocationName) return true;
    return Array.from(
      document.querySelectorAll("#eldritch-invocations-output input[data-invocation-name]:checked")
    ).some(input => input.dataset.invocationName === invocationName);
  }


  const classDescriptionCache = new Map();

  function getClericChannelDescription(descriptionId) {
    return `消耗 1 次引導神力，視為魔法動作。\n\n${getClassActionDescription("cleric", descriptionId)}`;
  }

  function getClericTurnUndeadDescription() {
    const base = getClericChannelDescription("cleric-turn-undead");
    if (getCharacterLevel() < 5) return base;
    const wisdomModifier = getAbilityModifier("wis");
    const damageDice = wisdomModifier === null
      ? "Xd8（X＝感知調整值，最少 1d8）"
      : `${Math.max(1, wisdomModifier)}d8`;
    return `${base}\n\n${getClassActionDescription("cleric", "cleric-sear-undead")}\n\n額外光耀傷害骰：${damageDice}。`;
  }

  function getClassActionDescription(className, descriptionId) {
    if (typeof classFeatures === "undefined") return "";
    const raw = classFeatures[className] || "";
    let cached = classDescriptionCache.get(className);
    if (!cached || cached.raw !== raw) {
      const holder = document.createElement("div");
      holder.innerHTML = raw;
      const descriptions = new Map(Array.from(holder.querySelectorAll("[data-action-id]"), block => {
        const copy = block.cloneNode(true);
        copy.querySelectorAll("h3").forEach(heading => heading.remove());
        return [block.dataset.actionId, sourceToPlainText(copy.innerHTML)];
      }));
      cached = { raw, descriptions };
      classDescriptionCache.set(className, cached);
    }
    return cached.descriptions.get(descriptionId) || "";
  }

  // Exact named-rule lookup is display-only; metadata supplies every mode and gate.
  // Preserve continuation lines (including lists), unlike the old one-line feat copy.
  function getNamedRuleDescription(raw, ruleName) {
    const text = sourceToPlainText(raw);
    const escaped = ruleName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = new RegExp('(?:^|\\n)' + escaped + '[：:]\\s*([\\s\\S]*?)(?=\\n[^\\n：:]+[：:]|\\n「擴充」|$)', 'u').exec(text);
    return match ? match[1].trim() : "";
  }

  function resolveFeatureRules(rules, mode, source, describe) {
    const level = getCharacterLevel();
    return rules.flatMap(rule => {
      if (rule.mode !== mode || level < rule.level) return [];
      if (rule.className && document.getElementById("class")?.value !== rule.className) return [];
      if (rule.choiceId && document.getElementById(rule.choiceId)?.value !== rule.choiceValue) return [];
      if (rule.checkedId && !document.getElementById(rule.checkedId)?.checked) return [];
      if (rule.invocation && !hasSelectedEldritchInvocation(rule.invocation)) return [];
      if (rule.requiresInvocation && !hasSelectedEldritchInvocation(rule.requiresInvocation)) return [];
      let description = typeof rule.description === "function" ? rule.description() : rule.description || describe(rule);
      if (!description) return [];
      if (rule.proficiencyValue) description = description.replace(/熟練加值/gu, String(getProficiencyBonus()));
      return [{
        key: rule.key || `dynamic-${mode}-${source}-${rule.id}`,
        label: typeof rule.label === "function" ? rule.label() : rule.label,
        source: FEATURE_SOURCE_LABELS[source],
        description,
        requiredLevel: rule.level,
        ...(rule.legacyKeys ? { legacyKeys: rule.legacyKeys } : {}),
        ...(rule.tabletopOnly ? { tabletopOnly: true } : {}),
        dynamic: true
      }];
    });
  }

  function getExplicitClassEntries(mode) {
    const className = document.getElementById("class")?.value || "";
    return resolveFeatureRules(CLASS_ACTION_RULES[className] || [], mode, "class",
      rule => getClassActionDescription(className, rule.descriptionId));
  }

  function getExplicitRaceEntries(mode) {
    const raceName = document.getElementById("race")?.value || "";
    return resolveFeatureRules(RACE_ACTION_RULES.filter(rule => rule.race === raceName), mode, "race",
      rule => getNamedRuleDescription(typeof raceFeatures === "undefined" ? "" : raceFeatures[raceName], rule.ruleName));
  }

  function getDynamicOptions(mode) {
    if (mode !== "action" && mode !== "bonus" && mode !== "reaction" && mode !== "movement") return [];
    const entries = [
      ...getExplicitClassEntries(mode),
      ...getExplicitRaceEntries(mode),
      ...getTabletopFeatRuleEntries(mode),
      ...getSelectedInvocationEntries(mode),
      ...getSelectedMetamagicEntries(mode),
      ...((mode === "action" || mode === "bonus" || mode === "reaction") ? getSelectedSpellEntries(mode) : [])
    ];
    const seen = new Set();
    return entries.filter(entry => {
      const fingerprint = `${entry.source}|${entry.label}|${entry.description}|${entry.spellSourceKey || ""}`.replace(/\s+/g, " ");
      if (seen.has(fingerprint)) return false;
      seen.add(fingerprint);
      return true;
    });
  }

  function renderDescription(option) {
    const description = panelElements.description;
    description.replaceChildren();
    if (!option) {
      description.textContent = MODE_META[currentMode].prompt;
      return;
    }

    const heading = document.createElement("div");
    heading.className = "action-description-heading";
    const title = document.createElement("strong");
    title.textContent = option.label;
    heading.appendChild(title);
    if (option.source) {
      const source = document.createElement("span");
      source.textContent = option.source;
      heading.appendChild(source);
    }

    const copy = document.createElement("div");
    copy.className = "action-description-copy";
    copy.textContent = option.description;
    description.append(heading, copy);
  }

function getButtonLabel(option) {
  return String(option.label).replace(/^等級\s*\d+\s*[：:]\s*/u, "");
}

  function createOptionButton(option) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "action-option-button";
    button.dataset.actionOptionKey = option.key;
    if (option.dynamic) button.classList.add("is-character-option");

    const label = document.createElement("span");
    label.className = "action-option-label";
    label.textContent = getButtonLabel(option);
    button.appendChild(label);
    if (option.source) {
      const source = document.createElement("span");
      source.className = "action-option-source";
      source.textContent = option.source;
      button.appendChild(source);
    }

    button.addEventListener("click", () => {
      selectedOptionKey = option.key;
      panelElements.grid.querySelectorAll(".action-option-button").forEach(item => {
        item.classList.toggle("is-selected", item === button);
        item.setAttribute("aria-pressed", item === button ? "true" : "false");
      });
      renderDescription(option);
    });
    button.setAttribute("aria-pressed", option.key === selectedOptionKey ? "true" : "false");
    if (option.key === selectedOptionKey) button.classList.add("is-selected");
    return button;
  }

  function getAvailableStaticOptions(mode) {
    return STATIC_OPTIONS[mode] || [];
  }

function getModeOptions(mode) {
  if (!STATIC_OPTIONS[mode]) return [];
  return [...getAvailableStaticOptions(mode), ...getDynamicOptions(mode)];
}

  function getPublicModeOptions(mode) {
    return Object.freeze(
      getAvailableStaticOptions(mode).map(option => Object.freeze({ ...option }))
    );
  }

  function getPublicTabletopModeOptions(mode) {
    return Object.freeze(
      getModeOptions(mode)
        .filter(option => {
          if (mode !== "movement") return true;
          if (option.key === "special-speeds" || option.key === "speed-changes") return false;
          return option.key !== "flying"
            || (document.getElementById("race")?.value === "dragonborn" && getCharacterLevel() >= 5);
        })
        .map(option => Object.freeze({ ...option }))
    );
  }

  function getPublicModeMeta(mode) {
    return MODE_META[mode]
      ? Object.freeze({ ...MODE_META[mode] })
      : null;
  }

function renderMode(mode, preserveSelection = false) {
  if (!MODE_META[mode]) return;

  const modeOptions = Object.fromEntries(
    Object.keys(MODE_META).map(tabMode => [
      tabMode,
      getAvailableStaticOptions(tabMode)
    ])
  );

  panelElements.tabs.forEach(tab => {
    const tabMode = tab.dataset.actionMode;
    tab.hidden = modeOptions[tabMode].length === 0;
  });

  if (modeOptions[mode].length === 0) {
    const fallbackTab = panelElements.tabs.find(
      tab => !tab.hidden
    );

    if (fallbackTab) {
      mode = fallbackTab.dataset.actionMode;
    }
  }

  currentMode = mode;
  if (!preserveSelection) selectedOptionKey = "";

  const meta = MODE_META[mode];
  const options = modeOptions[mode];

    panelElements.tabs.forEach(tab => {
  const tabMode = tab.dataset.actionMode;
  const hasOptions = getAvailableStaticOptions(tabMode).length > 0;

  tab.hidden = !hasOptions;
});

    panelElements.tabs.forEach(tab => {
      const active = tab.dataset.actionMode === mode;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
      tab.tabIndex = active ? 0 : -1;
    });
    const activeTab = panelElements.tabs.find(tab => tab.dataset.actionMode === mode);
    panelElements.panel.setAttribute("aria-labelledby", activeTab.id);
    panelElements.timing.textContent = meta.timing;
    panelElements.summary.textContent = meta.summary;
    panelElements.grid.setAttribute("aria-label", `${activeTab.textContent.trim()}選項`);
    panelElements.grid.dataset.actionMode = mode;

    panelElements.grid.replaceChildren(...options.map(createOptionButton));
    const selected = options.find(option => option.key === selectedOptionKey);
    if (!selected) selectedOptionKey = "";
    renderDescription(selected || null);

    globalScope.dispatchEvent?.(new CustomEvent("actionpanelchange", {
      detail: { mode }
    }));
  }

  function scheduleDynamicRefresh() {
    if (scheduledRefresh) cancelAnimationFrame(scheduledRefresh);
    scheduledRefresh = requestAnimationFrame(() => {
      scheduledRefresh = 0;
      if (currentMode === "action" || currentMode === "bonus" || currentMode === "reaction" || currentMode === "movement") renderMode(currentMode, true);
    });
  }

  function bindTabKeyboardNavigation(event) {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const tabs = panelElements.tabs;
    const currentIndex = tabs.indexOf(event.currentTarget);
    let nextIndex = currentIndex;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    tabs[nextIndex].focus();
    renderMode(tabs[nextIndex].dataset.actionMode);
  }

  function observeDynamicSources() {
    const observer = new MutationObserver(scheduleDynamicRefresh);
    ["classFeatures", "raceFeatures", "feats-area", "tab-spells"].forEach(id => {
      const target = document.getElementById(id);
      if (target) observer.observe(target, { childList: true, subtree: true, characterData: true });
    });
    document.addEventListener("change", scheduleDynamicRefresh);
    document.addEventListener("input", scheduleDynamicRefresh);
  }

  function initializeActionPanel() {
    const panel = document.getElementById("action-mode-panel");
    const grid = document.getElementById("action-option-grid");
    const description = document.getElementById("action-description");
    if (!panel || !grid || !description) return;

    panelElements = {
      panel,
      grid,
      description,
      timing: document.getElementById("action-mode-timing"),
      summary: document.getElementById("action-mode-summary"),
      tabs: Array.from(document.querySelectorAll(".action-mode-tab"))
    };
    panelElements.tabs.forEach(tab => {
      tab.addEventListener("click", () => renderMode(tab.dataset.actionMode));
      tab.addEventListener("keydown", bindTabKeyboardNavigation);
    });
    observeDynamicSources();
    renderMode("basic");
  }

  globalScope.ActionPanel = Object.freeze({
    getModes() {
      return Object.freeze(Object.keys(MODE_META));
    },
    getModeMeta: getPublicModeMeta,
    getOptions: getPublicModeOptions,
    getTabletopOptions: getPublicTabletopModeOptions,
    getSourceLabels() {
      return Object.freeze({ ...FEATURE_SOURCE_LABELS });
    },
    getButtonLabel,
    requestRefresh: scheduleDynamicRefresh
  });

  document.addEventListener("DOMContentLoaded", initializeActionPanel);
})(typeof window !== "undefined" ? window : globalThis);

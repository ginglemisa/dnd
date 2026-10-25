"use strict";

// Uses the same installed Playwright/browser as the other UI validators.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require("playwright");

const TABLETOP_COPY = [
  ["從這裡進入跑團模式", "角色準備好了，就可以開始冒險！\n\n打開右上角選單，找到「跑團模式」。這裡會集中顯示遊玩時常用的數值、動作與資源。\n\n按「下一步」，一起看看遊戲如何進行。", ["右上角選單", "跑團模式", "下一步"]],
  ["描述你的行動", "DM 會描述目前的情況，你只需要告訴 DM，你的角色打算採取什麼行動。\n\n例如：「我靠近木門，聽聽裡面有沒有聲音。」", []],
  ["需要判定時，再進行擲骰", "當 DM 要求進行檢定時，找到對應的數字加值，擲出 D20，再將兩者相加。\n\n如果手邊沒有骰子，可以從右上角選單開啟擲骰功能。", ["開啟擲骰功能"]],
  ["戰鬥開始時，決定行動順序", "當 DM 說請擲先攻時，擲出 D20 + 先攻加值，決定角色在戰鬥中的行動順序。\n\n你也可以開啟擲骰功能，點擊角色卡上的先攻數值進行擲骰。\n\n角色的速度代表一個回合中可以移動的距離。\n\n使用格線地圖時，通常 5 呎 = 1 格。", ["請擲先攻", "開啟擲骰功能", "速度", "5 呎 = 1 格"]],
  ["在你的回合中採取行動", "你的回合通常包含移動與一次動作；若能力或規則允許，也可以使用一次附贈。\n\n移動不一定要一次完成，也不需要固定在動作之前。\n例如，你可以先移動 2 格、進行攻擊，再移動剩下的 3 格。\n\n反應則需要符合特定的觸發條件才能使用，通常在其他角色的回合中發生。", ["移動", "動作", "附贈", "移動", "動作", "移動", "移動", "反應"]],
  ["如果你想施放魔法", "先告訴 DM 你要用什麼法術，閱讀文字確認條件滿足後，就可以選擇目標。\n\n部分法術需要維持專注。\n一般情況下，玩家無法同時維持兩個需要專注的法術。", []],
  ["記錄角色狀態", "使用具有次數限制的能力或施放法術後，記得更新資源的數字，確認還剩下多少可用次數。\n\n受到傷害、恢復生命值，或罹患狀態時，也應立即記錄。", ["法術"]],
  ["基本遊戲流程", "了解情況 → 描述行動 → 進行判定 → 記錄結果 → 開心遊戲！", []]
];

const SHEET_COPY = [
  ["⚔️ 建立你的角色", "背景描述過往經歷，種族提供不同特性，\n職業則決定擅長的能力，以及在冒險中解決問題的方式。\n\n完成選擇後，速度、專長與其他角色資料會自動更新。", 1, ["背景", "種族", "職業"]],
  ["🎲 決定角色屬性", "六項屬性代表角色的基本能力，並會影響攻擊、技能與各種檢定。\n\n你可以直接輸入屬性數值，也可以從右上角選單開啟決定屬性功能。", 2, ["六項屬性", "決定屬性"]],
  ["🎲 選擇屬性產生方式", "接下來，選擇角色的屬性產生方式。\n\n點擊決定屬性開始設定。", 2, ["決定屬性"]],
  ["🎲 選擇購點或擲骰", "27 點購點讓你自行分配屬性，角色能力較為穩定。\n\n屬性擲骰則具有較高的隨機性，通常在 DM 同意使用時採用。\n\n選擇適合目前遊戲的方式後，即可開始配置屬性。", 3, ["27 點購點", "屬性擲骰", "DM 同意"]],
  ["🎲 配置基礎屬性", "使用 27 點購點時，每項屬性可以設定在 8～15 之間。\n\n屬性越高，需要消耗的點數越多。調整數值時，可以從下方確認剩餘點數。\n\n完成配置前，總花費不得超過 27 點。", 4, ["27 點購點", "剩餘點數"]],
  ["🎲 套用背景加值", "選擇背景後，將提供的屬性加值分配至角色屬性。\n\n確認所有數值後，點擊套用完成屬性設定。", 5, ["背景", "套用"]],
  ["🛡️ 選擇武器與護甲", "選擇武器或護甲時，下方會顯示傷害、防禦與相關特性。\n\n遇到不熟悉的規則名詞，可以直接點擊摘要中的名稱查看詳細說明。", 6, []],
  ["✨ 選擇與管理法術", "選好職業、等級、背景與種族後，可按「準備法術」管理法術清單。", 7, []],
  ["🔎 搜尋規則資料", "法術與裝備頁面都提供搜尋功能。\n\n輸入名稱或關鍵字即可快速找到相關規則內容。", 8, []]
];

async function assertSheetCopy(page, stage) {
  const [title, body, progress, highlights] = SHEET_COPY[stage];
  await page.waitForFunction(([expectedTitle, expectedProgress]) =>
    document.getElementById("tour-step-title").textContent === expectedTitle
      && document.getElementById("tour-step-progress").textContent === `${expectedProgress}/8`,
  [title, progress]);
  assert.equal(await page.locator("#tour-step-title").textContent(), title);
  assert.equal(await page.locator("#tour-step-text").textContent(), body);
  assert.equal(await page.locator("#tour-step-progress").textContent(), `${progress}/8`);
  assert.equal(await page.locator("#tour-step-progress").getAttribute("aria-label"), `導覽進度：第 ${progress} 步，共 8 步`);
  assert.deepEqual(await page.locator("#tour-step-text .tour-step-emphasis").allTextContents(), highlights);
}

async function assertTourCopy(page, index) {
  const [title, text, highlights] = TABLETOP_COPY[index];
  assert.equal(await page.locator("#tour-step-title").textContent(), title);
  assert.equal(await page.locator("#tour-step-text").evaluate(el =>
    [...el.childNodes].filter(node => node.nodeName !== "DETAILS").map(node => node.textContent).join("")), text);
  assert.deepEqual(await page.locator("#tour-step-text .tour-step-emphasis").allTextContents(), highlights);
}

async function snapshot(page) {
  return page.evaluate(() => ({
    data: collectStateObject(),
    storage: Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])),
    hash: location.hash,
    dice: document.getElementById("dice-roller-stage")?.innerHTML,
    mode: TabletopMode.getMode(), panel: TabletopMode.getPanel(),
    sheet: document.querySelector(".tab-content.active")?.id,
    scroll: window.scrollY,
    focus: document.activeElement.id
  }));
}

async function assertSkillPreview(page) {
  const state = await page.evaluate(() => {
    const items = [...document.querySelectorAll("#tabletop-skill-values > .tabletop-skill-value")];
    const tops = [...new Set(items.map(item => Math.round(item.getBoundingClientRect().top)))].sort((a, b) => a - b);
    const hole = onboardingTour.activeHoles[0];
    const inside = item => {
      const rect = item.getBoundingClientRect();
      return hole.left <= rect.left && hole.right >= rect.right && hole.top <= rect.top && hole.bottom >= rect.bottom;
    };
    const heading = document.querySelector(".tabletop-skills .tabletop-section-heading").getBoundingClientRect();
    const values = Object.fromEntries(items.map(item => [
      item.querySelector(".tabletop-skill-value__label").textContent,
      [item.querySelector(".tabletop-skill-value__value").textContent, item.dataset.skillRank]
    ]));
    return {
      holes: onboardingTour.activeHoles.length,
      headingCovered: hole.top <= heading.top && hole.bottom >= heading.bottom,
      firstRowsCovered: items.filter(item => Math.round(item.getBoundingClientRect().top) <= tops[1]).every(inside),
      laterRowsCovered: items.some(item => Math.round(item.getBoundingClientRect().top) > tops[1] && inside(item)),
      values: ["運動", "體操", "奧秘", "自然", "洞悉", "威嚇", "欺瞞"].map(name => values[name])
    };
  });
  assert.deepEqual(state, {
    holes: 1, headingCovered: true, firstRowsCovered: true, laterRowsCovered: false,
    values: [["+6", "proficient"], ["+3", "untrained"], ["+3", "proficient"], ["+3", "proficient"],
      ["+2", "untrained"], ["+1", "proficient"], ["-1", "untrained"]]
  }, "skills step highlights the first two rows and shows the example scores and proficiencies");
}

async function ready(page, index) {
  await page.waitForFunction(index => onboardingTour.active && !onboardingTour.isTransitioning && onboardingTour.currentIndex === index, index);
}

async function pointBuyReady(page, phase) {
  await page.waitForFunction(phase => onboardingTour.active && !onboardingTour.isTransitioning
    && onboardingTour.currentIndex === 2 && onboardingTour.stepPhase === phase && onboardingTour.presentationFrame === null, phase);
}

async function identityDetailsReady(page) {
  await page.waitForFunction(() => onboardingTour.active && !onboardingTour.isTransitioning
    && onboardingTour.currentIndex === 0 && onboardingTour.stepPhase === 1);
  assert.equal(await page.locator("#tour-step-title").textContent(), "⚔️ 建立你的角色");
  assert.equal(await page.locator("#tour-step-text").textContent(), "點此查看職業、種族等詳情。");
  assert.equal(await page.locator("#tour-step-progress").textContent(), "1/8");
  assert.equal(await page.locator("#tour-prev-btn").isEnabled(), true);
  assert.equal(await page.evaluate(() => {
    const holes = onboardingTour.activeHoles;
    const button = document.querySelector('.basic-row--class-level [data-character-features-tab="class"]').getBoundingClientRect();
    const tip = document.getElementById("tour-tooltip").getBoundingClientRect();
    return holes.length === 1 && Math.abs(holes[0].left - (button.left - 8)) < 1
      && Math.abs(holes[0].right - (button.right + 8)) < 1
      && Math.abs(holes[0].top - (button.top - 8)) < 1
      && Math.abs(holes[0].bottom - (button.bottom + 8)) < 1
      && tip.left >= 0 && tip.top >= 0 && tip.right <= innerWidth && tip.bottom <= innerHeight;
  }), true, "1/8 details highlights only the class info label, with the tooltip inside the viewport");
}

async function closed(page) {
  await page.waitForFunction(() => !onboardingTour.active);
  // Include outstanding layout/animation callbacks and the autosave debounce.
  await page.waitForTimeout(650);
  assert.equal(await page.locator("#tour-overlay").isVisible(), false);
  assert.equal(await page.locator('.app-dialog[data-tour-spell-preview]').count(), 0);
  assert.equal(await page.locator('#tabletop-tour-resource-preview').count(), 0);
  assert.equal(await page.locator("#main-content").evaluate(el => el.inert), false);
  assert.equal(await page.evaluate(() => document.body.style.touchAction), "");
  assert.equal(await page.locator(".tabs-shell").evaluate(el => getComputedStyle(el).visibility), "visible");
}

// 2/8, 6/8 and the first-table action step hide the fixed tab bar and put the highlight at the top.
async function assertBarHiddenWithTargetAtTop(page, selector, message) {
  await page.waitForFunction(() => !onboardingTour.isTransitioning);
  const state = await page.evaluate(selector => ({
    bar: getComputedStyle(document.querySelector(".tabs-shell")).visibility,
    top: document.querySelector(selector).getBoundingClientRect().top,
    canScroll: document.body.scrollHeight - innerHeight > scrollY + 1
  }), selector);
  assert.equal(state.bar, "hidden", message);
  assert(Math.abs(state.top - 8) <= 1 || (state.top > 8 && !state.canScroll), `${message}: ${JSON.stringify(state)}`);
}

async function enter(page) {
  await page.locator("#utility-menu-toggle").click();
  await page.locator("#first-table-tour-btn").click();
  await ready(page, 0);
}

async function assertLayout(page) {
  const layout = await page.evaluate(() => {
    const tip = document.getElementById("tour-tooltip").getBoundingClientRect();
    const ring = document.getElementById("tour-focus-ring").getBoundingClientRect();
    const next = document.getElementById("tour-next-btn").getBoundingClientRect();
    return { tip: { left: tip.left, top: tip.top, right: tip.right, bottom: tip.bottom },
      highlightVisible: ring.width > 0 && ring.height > 0 && ring.bottom > 0 && ring.top < innerHeight,
      nextVisible: next.top >= 0 && next.bottom <= innerHeight,
      width: innerWidth, height: innerHeight, index: onboardingTour.currentIndex, ring: { left: ring.left, top: ring.top, bottom: ring.bottom, width: ring.width },
      dragged: Boolean(onboardingTour.tooltipDragPosition), scroll: scrollY, holes: onboardingTour.steps[onboardingTour.currentIndex].getHoles(), panel: TabletopMode.getPanel(), overflow: document.documentElement.scrollWidth > innerWidth };
  });
  assert(layout.tip.left >= 0 && layout.tip.top >= 0 && layout.tip.right <= layout.width && layout.tip.bottom <= layout.height, JSON.stringify(layout));
  if (layout.index === 0) {
    assert.equal(layout.holes.length, 1, "mode introduction highlights the menu button");
    assert(layout.highlightVisible, JSON.stringify(layout));
  } else if (layout.index === 1 || layout.index === 7) {
    assert.equal(layout.holes.length, 0, "centered steps do not highlight any page content");
    assert.equal(await page.locator("#tour-focus-ring").isVisible(), false);
    assert.equal(await page.locator("#tour-focus-ring-secondary").isVisible(), false);
    if (!await page.evaluate(() => onboardingTour.tooltipDragPosition)) {
      assert(Math.abs((layout.tip.left + layout.tip.right) / 2 - layout.width / 2) <= 1, "introduction is horizontally centered");
      assert(Math.abs((layout.tip.top + layout.tip.bottom) / 2 - layout.height / 2) <= 1, "introduction is vertically centered");
    }
  } else {
    assert(layout.highlightVisible, JSON.stringify(layout));
    if (!layout.dragged) {
      const expectedLeft = Math.min(layout.width - (layout.tip.right - layout.tip.left) - 10, Math.max(10, layout.ring.left));
      assert(Math.abs(layout.tip.left - expectedLeft) <= 1, `tooltip aligns with the highlight's left edge: ${JSON.stringify(layout)}`);
    }
  }
  assert(layout.nextVisible && !layout.overflow, JSON.stringify(layout));
}

async function verifyTooltipDrag(page) {
  // Mobile emulation can report the previous fixed-position rect briefly after a tour step.
  // Wait for the rendered position before choosing pointer coordinates.
  await page.waitForFunction(() => {
    const tip = document.getElementById("tour-tooltip");
    return Math.abs(tip.getBoundingClientRect().top - parseFloat(tip.style.top)) <= 1;
  });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const heading = await page.locator(".tour-heading-row").boundingBox();
  const before = await page.locator("#tour-tooltip").boundingBox();
  const deltaY = before.y >= 50 ? -40 : 40;
  await page.mouse.move(heading.x + heading.width / 2, heading.y + heading.height / 2);
  await page.mouse.down();
  await page.mouse.move(heading.x + heading.width / 2, heading.y + heading.height / 2 + deltaY, { steps: 5 });
  await page.mouse.move(heading.x + heading.width / 2, heading.y + heading.height / 2 + deltaY);
  await page.mouse.up();
  const after = await page.locator("#tour-tooltip").boundingBox();
  assert(Math.abs(after.y - (before.y + deltaY)) <= 1,
    `heading drags the tooltip: ${JSON.stringify({ before, after, deltaY })}`);
  await page.evaluate(() => onboardingTour.renderStep({ ensureFocus: false }));
  assert.deepEqual(await page.locator("#tour-tooltip").boundingBox(), after, "render preserves dragged position");
}

// Any non-control part drags the window; up to 75% may leave the left, right
// or bottom edge, while the heading stays below the top edge.
async function verifyTooltipDragLimits(page) {
  const tip = () => page.locator("#tour-tooltip").boundingBox();
  const drag = async (from, dx, dy) => {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + dx, from.y + dy, { steps: 4 });
    await page.mouse.up();
  };
  const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  const text = await page.locator("#tour-step-text").boundingBox();
  const start = await tip();
  await drag({ x: text.x + 6, y: text.y + 6 }, 2, 1);
  assert.deepEqual(await tip(), start, "a slightly unsteady tap does not move the window");
  await drag({ x: text.x + 6, y: text.y + 6 }, 0, 20);
  assert(Math.abs((await tip()).y - (start.y + 20)) <= 1, "dragging the guidance text moves the window");
  // Each drag grabs a visible, non-button point and stays inside the viewport.
  let box = await tip();
  await drag({ x: box.x + box.width / 2, y: box.y + 12 }, 0, viewport.height - 1 - (box.y + 12));
  box = await tip();
  assert(Math.abs(box.y - (viewport.height - box.height * 0.25)) <= 1, `bottom keeps 25% visible: ${JSON.stringify(box)}`);
  await drag({ x: box.x + box.width / 2, y: box.y + 12 }, 0, 1 - (box.y + 12));
  box = await tip();
  assert(Math.abs(box.y - 10) <= 1, `the heading never leaves the top: ${JSON.stringify(box)}`);
  await drag({ x: box.x + box.width - 4, y: box.y + 12 }, 1 - (box.x + box.width - 4), 0);
  box = await tip();
  assert(Math.abs(box.x + box.width * 0.75) <= 1, `left keeps 25% visible: ${JSON.stringify(box)}`);
  const grab = box.x + box.width * 0.875;
  await drag({ x: grab, y: box.y + 12 }, 10 - box.x, 0);
  box = await tip();
  assert(box.x >= 0 && box.x + box.width <= viewport.width, `the visible part drags the window back: ${JSON.stringify(box)}`);
  await drag({ x: box.x + 4, y: box.y + 12 }, viewport.width - 1 - (box.x + 4), 0);
  box = await tip();
  assert(Math.abs(box.x - (viewport.width - box.width * 0.25)) <= 1, `right keeps 25% visible: ${JSON.stringify(box)}`);
  await page.evaluate(() => {
    onboardingTour.tooltipDragPosition = null;
    return onboardingTour.renderStep({ ensureFocus: false, animate: false });
  });
}

async function assertAbilityMenuGuide(page) {
  const state = await page.evaluate(() => {
    const holes = onboardingTour.activeHoles;
    const targets = ["utility-menu-toggle", "set-default-abilities"]
      .map(id => document.getElementById(id).getBoundingClientRect());
    const tip = document.getElementById("tour-tooltip").getBoundingClientRect();
    const menu = document.getElementById("utility-menu").getBoundingClientRect();
    return {
      active: onboardingTour.abilityMenuGuideActive,
      menuOpen: document.getElementById("utility-menu-toggle").getAttribute("aria-expanded") === "true",
      holesCoverTargets: holes.length === 2 && holes.every((hole, index) => (
        hole.left <= targets[index].left && hole.right >= targets[index].right
        && hole.top <= targets[index].top && hole.bottom >= targets[index].bottom
      )),
      buttonVisibleInMenu: targets[1].top >= menu.top && targets[1].bottom <= menu.bottom,
      buttonReceivesPointer: Boolean(document.elementFromPoint(
        (targets[1].left + targets[1].right) / 2,
        (targets[1].top + targets[1].bottom) / 2
      )?.closest("#set-default-abilities")),
      tooltipBelowButton: tip.top >= holes[1]?.bottom,
      tooltipInViewport: tip.left >= 0 && tip.right <= innerWidth && tip.top >= 0 && tip.bottom <= innerHeight,
      text: document.getElementById("tour-step-text").textContent,
      emphasis: [...document.querySelectorAll("#tour-step-text .tour-step-emphasis")].map(node => node.textContent)
    };
  });
  assert.deepEqual(state, {
    active: true,
    menuOpen: true,
    holesCoverTargets: true,
    buttonVisibleInMenu: true,
    buttonReceivesPointer: true,
    tooltipBelowButton: true,
    tooltipInViewport: true,
    text: SHEET_COPY[2][1],
    emphasis: ["決定屬性"]
  }, "step 3 opens the menu with two highlights and places its instruction below 決定屬性");
}

async function verifyTour(page, { width, height, caster, mode, complete }) {
  await page.setViewportSize({ width, height });
  await page.evaluate(({ caster, mode }) => {
    for (const [id, value] of [["race", "dwarf"], ["background", "soldier"]]) {
      document.getElementById(id).value = value;
      document.getElementById(id).dispatchEvent(new Event("change", { bubbles: true }));
    }
    const control = document.getElementById("class");
    control.value = caster ? "wizard" : "fighter";
    control.dispatchEvent(new Event("change", { bubbles: true }));
    document.getElementById("level").value = "1";
    document.getElementById("level").dispatchEvent(new Event("change", { bubbles: true }));
    showTab("equipment");
    TabletopMode.setPanel("resources", { restoreScroll: false });
    TabletopMode.setMode(mode, { restoreScroll: false });
    document.getElementById("utility-menu-toggle").focus();
  }, { caster, mode });
  await page.waitForTimeout(750);
  await page.evaluate(() => { window.scrollTo(0, 130); window.flushPendingAutosave?.(); });
  const before = await snapshot(page);
  await enter(page);
  assert.equal(await page.evaluate(() => onboardingTour.steps.length), 8);
  await assertTourCopy(page, 0);
  await assertLayout(page);
  assert.equal(await page.evaluate(() => onboardingTour.tabletopMenuGuidePhase), "button");
  assert.equal(await page.locator("#utility-menu-toggle").getAttribute("aria-expanded"), "true");
  assert.equal(await page.evaluate(() => {
    const hole = onboardingTour.activeHoles[0];
    const button = document.getElementById("tabletop-mode-toggle").getBoundingClientRect();
    return hole && hole.left <= button.left && hole.right >= button.right
      && hole.top <= button.top && hole.bottom >= button.bottom;
  }), true, "introduction highlights the mode button after opening the menu");
  await page.locator("#tour-next-btn").click();
  await ready(page, 1);
  const examples = page.locator("#tour-step-text details");
  assert.equal(await examples.evaluate(el => el.open), false);
  await assertTourCopy(page, 1, caster);
  assert.equal(await examples.locator("summary").textContent(), "查看更多範例");
  assert.deepEqual(await examples.locator("p").allTextContents(), [
    "探索：「我檢查雕像後方，看看是否藏有機關。」",
    "社交：「我拿出貨單，試著讓守衛相信我們是商人。」",
    "戰鬥：「我靠近哥布林，拔出長劍攻擊。」"
  ]);
  await assertLayout(page);
  await verifyTooltipDrag(page);
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement.tagName), "SUMMARY");
  await page.keyboard.press("Enter");
  assert.equal(await examples.evaluate(el => el.open), true);
  await assertLayout(page);
  if (process.env.DND_ONBOARDING_SCREENSHOT_DIR && width === 390 && !caster && mode === "sheet" && !complete) {
    fs.mkdirSync(process.env.DND_ONBOARDING_SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({ path: path.join(process.env.DND_ONBOARDING_SCREENSHOT_DIR, "examples-mobile.png") });
  }
  await page.keyboard.press("Enter");
  for (let index = 2; index < 8; index++) {
    await page.locator("#tour-next-btn").click();
    await ready(page, index);
    await assertLayout(page);
    await assertTourCopy(page, index, caster);
    if (index === 2) {
      await verifyTooltipDrag(page);
      await verifyTooltipDragLimits(page);
      await assertSkillPreview(page);
    }
    if (index === 3) {
      await page.locator("#tour-prev-btn").click();
      await ready(page, 2);
      await assertSkillPreview(page);
      await page.locator("#tour-next-btn").click();
      await ready(page, 3);
      assert.equal(await page.evaluate(() => document.querySelector(".tabletop-skill-value__value").textContent
        === (document.getElementById("skill-運動").value.trim() || "—")), true,
        "leaving the skills step restores the character's own values");
    }
    if (index === 4) {
      assert.equal(await page.evaluate(() => {
        const holes = onboardingTour.activeHoles;
        const bar = [".tabletop-action-browser .tabletop-section-heading", ".tabletop-action-browser .tabletop-action-tabs"]
          .map(selector => document.querySelector(selector).getBoundingClientRect());
        const preview = document.getElementById("tabletop-tour-action-preview");
        const [attack, potion] = [...preview.querySelectorAll(".tabletop-action-option")];
        const copies = [...preview.querySelectorAll(".tabletop-action-description__copy")];
        const tip = document.getElementById("tour-tooltip").getBoundingClientRect();
        const expectedTop = Math.min(Math.max(10, holes[1].bottom + 10), Math.max(10, innerHeight - tip.height - 10));
        const covered = element => {
          const rect = element.getBoundingClientRect();
          return holes[1].left <= rect.left && holes[1].right >= rect.right && holes[1].top <= rect.top && holes[1].bottom >= rect.bottom;
        };
        return holes.length === 2 && preview.inert
          && attack.textContent === "攻擊" && potion.textContent === "喝藥水"
          && copies.map(copy => copy.textContent).join("|") === "拾取或拔出一把武器進行攻擊。|使用附贈，喝下一瓶治療藥水，恢復生命。"
          && getComputedStyle(document.getElementById("tabletop-action-panel-action")).display === "none"
          && Math.abs(holes[0].top) <= 1
          && bar.every(rect => holes[0].left <= rect.left && holes[0].right >= rect.right && holes[0].top <= rect.top && holes[0].bottom >= rect.bottom)
          && [attack, potion, ...copies].every(covered)
          && Math.abs(tip.top - expectedTop) <= 1;
      }), true, "action step puts 可用選項 at the top and highlights the tabs and the attack/potion example, with the tooltip below");
      assert.equal(await page.locator(".tabs-shell").evaluate(el => getComputedStyle(el).visibility), "hidden",
        "action step hides the menu button");
      if (process.env.DND_ONBOARDING_SCREENSHOT_DIR && width === 390 && !caster && mode === "sheet" && !complete) {
        await page.screenshot({ path: path.join(process.env.DND_ONBOARDING_SCREENSHOT_DIR, "actions-mobile.png") });
      }
      await page.locator("#tour-prev-btn").click();
      await ready(page, index - 1);
      assert.equal(await page.locator("#tabletop-tour-action-preview").count(), 0);
      assert.equal(await page.locator(".tabs-shell").evaluate(el => getComputedStyle(el).visibility), "visible");
      await page.locator("#tour-next-btn").click();
      await ready(page, index);
    }
    if (index === 5) {
      assert.equal(await page.locator("#tabletop-tour-action-preview").count(), 0, "leaving the action step removes the example");
      const spellPreview = await page.evaluate(() => {
        const dialog = document.querySelector('.app-dialog[data-tour-spell-preview]');
        const copy = dialog?.querySelector('.tabletop-spell-detail__copy');
        const hole = onboardingTour.activeHoles[0];
        const titleHole = onboardingTour.activeHoles[1];
        const title = dialog?.querySelector('.app-dialog__header h2');
        const titleRange = document.createRange();
        if (title) titleRange.selectNodeContents(title);
        const titleText = titleRange.getBoundingClientRect();
        const tip = document.getElementById('tour-tooltip').getBoundingClientRect();
        const expected = [
          '學派: 惑控', '施法時間: 動作', '射程: 30呎', '成分: V、S、M',
          '材料: 一個水果小餡餅和一片羽毛', '持續時間: 專注，最長1分鐘'
        ];
        return {
          dialog: Boolean(dialog), copy: Boolean(copy), lines: expected.map(line => copy?.textContent.includes(line)),
          hole, copyRect: copy?.getBoundingClientRect().toJSON(), tipTop: tip.top,
          title: title?.textContent, titleHole, titleText: titleText.toJSON(),
          titleCovered: Boolean(titleHole) && titleHole.left <= titleText.left && titleHole.right >= titleText.right
            && titleHole.top <= titleText.top && titleHole.bottom >= titleText.bottom
            && titleHole.right - titleHole.left <= titleText.width + 13,
          overlayInert: document.getElementById('tour-overlay').inert
        };
      });
      assert(spellPreview.dialog && spellPreview.copy && spellPreview.lines.every(Boolean)
        && spellPreview.hole?.top >= spellPreview.copyRect.top - 6
        && spellPreview.hole.bottom < spellPreview.copyRect.bottom
        && spellPreview.tipTop >= spellPreview.hole.bottom - 1
        && spellPreview.title === "狂笑術" && spellPreview.titleCovered
        && !spellPreview.overlayInert,
      `spell step previews Hideous Laughter and highlights its metadata and name: ${JSON.stringify(spellPreview)}`);
      if (width === 1280 && !caster && mode === "sheet" && !complete) {
        await page.keyboard.press("Tab");
        assert.equal(await page.evaluate(() => document.getElementById("tour-tooltip").contains(document.activeElement)), true);
        await page.locator("#tour-prev-btn").click();
        await ready(page, 4);
        assert.equal(await page.locator('.app-dialog[data-tour-spell-preview]').count(), 0);
        await page.locator("#tour-next-btn").click();
        await ready(page, 5);
      }
    }
    if (index === 6) {
      const resourcePreview = await page.evaluate(() => {
        const preview = document.getElementById('tabletop-tour-resource-preview');
        const rows = [...(preview?.querySelectorAll(':scope > .tabletop-resource-row') || [])];
        const holes = onboardingTour.activeHoles;
        const tip = document.getElementById('tour-tooltip').getBoundingClientRect();
        const contains = (hole, rect) => Boolean(hole) && hole.left <= rect.left && hole.right >= rect.right
          && hole.top <= rect.top && hole.bottom >= rect.bottom;
        const textRects = [...(rows[1]?.querySelectorAll('.tabletop-resource-row__copy > *') || [])].map(element => {
          const range = document.createRange();
          range.selectNodeContents(element);
          return range.getBoundingClientRect();
        });
        const checks = [...(rows[1]?.querySelectorAll('.tabletop-resource-check') || [])].map(check => check.getBoundingClientRect());
        return {
          rows: rows.map(row => ({ title: row.querySelector('h4')?.textContent, rect: row.getBoundingClientRect().toJSON() })),
          holes,
          covers: textRects.length === 2 && textRects.every(rect => contains(holes[0], rect))
            && checks.length > 0 && checks.every(rect => contains(holes[1], rect))
            && !contains(holes[0], rows[1].getBoundingClientRect())
            && !contains(holes[0], rows[0].getBoundingClientRect()),
          tipTop: tip.top,
          tipHeight: tip.height,
          viewportHeight: innerHeight,
          dialog: Boolean(document.querySelector('.app-dialog[data-tour-spell-preview]'))
        };
      });
      assert(resourcePreview.rows.length === 2 && resourcePreview.holes.length === 2
        && resourcePreview.rows[0].title.includes('生命骰')
        && resourcePreview.rows[1].title.includes('吟遊詩人激勵')
        && resourcePreview.covers && !resourcePreview.dialog
        && (resourcePreview.tipTop >= Math.max(resourcePreview.holes[0].bottom, resourcePreview.holes[1].bottom) - 1
          || Math.max(resourcePreview.holes[0].bottom, resourcePreview.holes[1].bottom) + 10 + resourcePreview.tipHeight > resourcePreview.viewportHeight - 10),
      `resource step previews both cards and highlights the Bardic Inspiration text and checkbox: ${JSON.stringify(resourcePreview)}`);
      if (width <= 600) assert(resourcePreview.holes[0].top <= 40,
        `phones scroll the Bardic Inspiration card to the top: ${JSON.stringify(resourcePreview.holes)}`);
      if (width === 1280 && !caster && mode === "sheet" && !complete) {
        await page.locator("#tour-prev-btn").click();
        await ready(page, 5);
        assert.equal(await page.locator('#tabletop-tour-resource-preview').count(), 0);
        assert.equal(await page.locator('.app-dialog[data-tour-spell-preview]').count(), 1);
        await page.locator("#tour-next-btn").click();
        await ready(page, 6);
      }
      assert.equal(await page.locator("#tour-next-btn").textContent(), "下一步");
    }
    if (index === 7) {
      assert.equal(await page.locator("#tabletop-tour-resource-preview").count(), 0, "the closing step removes the resource preview");
      assert.equal(await page.locator("#tour-step-progress").textContent(), "8/8");
      assert.equal(await page.locator("#tour-next-btn").textContent(), "開始使用跑團模式");
      if (width === 1280 && !caster && mode === "sheet" && !complete) {
        await page.locator("#tour-prev-btn").click();
        await ready(page, 6);
        assert.equal(await page.locator("#tabletop-tour-resource-preview").count(), 1);
        await page.locator("#tour-next-btn").click();
        await ready(page, 7);
      }
    }
  }
  if (complete) await page.locator("#tour-next-btn").click();
  else await page.keyboard.press("Escape");
  await closed(page);
  const after = await snapshot(page);
  for (const key of ["data", "storage", "hash", "dice", "sheet"]) assert.deepEqual(after[key], before[key], `${key}: ${JSON.stringify({ width, caster, mode, complete })}`);
  assert.equal(after.mode, complete ? "tabletop" : before.mode);
  assert.equal(after.panel, complete ? "overview" : before.panel);
  assert.equal(after.scroll, complete ? 0 : before.scroll);
  assert.equal(after.focus, complete ? "tabletop-tab-overview" : before.focus);
}

async function main() {
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const file = path.resolve(__dirname, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!file.startsWith(__dirname + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
      if (error) return res.writeHead(404).end();
      res.setHeader("Content-Type", { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" }[path.extname(file)] || "application/octet-stream");
      res.end(data);
    });
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.DND_BROWSER_CHANNEL ? { channel: process.env.DND_BROWSER_CHANNEL } : {}) });
    const page = await browser.newPage();
    await page.addInitScript(() => { try { localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"); } catch {} });
    const errors = [];
    page.on("pageerror", error => errors.push(String(error)));
    const url = `http://127.0.0.1:${server.address().port}/index.html?analytics=owner`;
    await page.goto(url);
    await page.waitForFunction(() => window.onboardingTour && window.quickBuild && window.TabletopMode);
    await page.locator("#legal-ack-btn").click();
    if (process.argv.includes("--imports-only")) {
      await verifyShareModeEntries(browser, url);
      await verifyImports(browser, url);
      await verifyImports(browser, url, { width: 390, height: 844 });
      await verifyPdfLifecycle(browser, url);
      return;
    }
    if (process.argv.includes("--touch-only")) {
      await verifyIdentityGuidance(browser, url);
      await verifyAbilityGuidance(browser, url);
      await verifyPointBuyGuidance(browser, url);
      await verifyTouch(browser, url);
      return;
    }
    await verifyIdentityGuidance(browser, url);
    await verifySheetExitSafety(browser, url);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.evaluate(() => onboardingTour.start());
    await ready(page, 0);
    assert.equal(await page.evaluate(() => {
      const origin = onboardingTour.activeHoles[1];
      const tip = document.getElementById("tour-tooltip").getBoundingClientRect();
      return origin && Math.abs(tip.left - origin.left) <= 1 && tip.top >= origin.bottom;
    }), true, "sheet introduction aligns below the origin row on desktop");
    await page.locator("#tour-skip-btn").click();
    await closed(page);
    for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
      for (const caster of [false, true]) {
        for (const mode of ["sheet", "tabletop"]) {
          for (const complete of [false, true]) await verifyTour(page, { ...viewport, caster, mode, complete });
        }
      }
    }
    console.log("First-table tour: desktop/mobile, both modes, spell and resource previews for all classes, examples, back/next, completion/Escape and data/storage/focus/scroll preservation passed.");
    await verifyTabletopDiceAndKeyStats(browser, url);

    const beforeSpellCancel = await snapshot(page);
    await page.evaluate(() => onboardingTour.start(5, "tabletop"));
    await ready(page, 5);
    await page.keyboard.press("Escape");
    await closed(page);
    assert.deepEqual(await snapshot(page), beforeSpellCancel, "Escape from the spell preview restores the previous view and data");

    // Exit during each asynchronous positioning boundary, then restart rapidly.
    for (const delay of [0, 70, 110]) {
      const before = await snapshot(page);
      await page.evaluate(delay => {
        onboardingTour.startTabletop();
        setTimeout(() => onboardingTour.stop(), delay);
      }, delay);
      await closed(page);
      assert.deepEqual(await snapshot(page), before);
    }
    await page.evaluate(async () => {
      onboardingTour.startTabletop();
      onboardingTour.stop();
      await onboardingTour.startTabletop();
    });
    await ready(page, 0);
    await page.locator("#tour-skip-btn").click();
    await closed(page);
    await page.evaluate(async () => {
      const original = onboardingTour.getTabletopSteps;
      onboardingTour.getTabletopSteps = () => [{ tab: "skills", selector: "#missing-tour-target" }];
      await onboardingTour.startTabletop();
      onboardingTour.getTabletopSteps = original;
    });
    await closed(page);

    await page.evaluate(() => { TabletopMode.setMode("tabletop", { restoreScroll: false }); TabletopMode.setPanel("actions"); });
    await page.locator("#tabletop-turn-help").click();
    const turnHelp = await page.locator(".app-dialog__body").innerText();
    assert.equal(turnHelp.includes("常見動作："), false);
    assert.match(turnHelp, /可以在別人的回合宣告觸發。\n\n也可以直接告訴 DM，你想嘗試什麼。/);
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.activeElement.id), "tabletop-turn-help");

    await page.locator("#utility-menu-toggle").click();
    await page.locator("#restart-onboarding-btn").click();
    await ready(page, 0);
    await assertSheetCopy(page, 0);
    assert.equal(await page.evaluate(() => {
      const holes = onboardingTour.steps[0].getHoles();
      const rows = [".basic-row--class-level", ".basic-row--origin"].map(selector => document.querySelector(selector).getBoundingClientRect());
      return holes.length === 2 && holes.every((hole, index) => (
        hole.left < rows[index].left && hole.right > rows[index].right
        && hole.top < rows[index].top && hole.bottom > rows[index].bottom
      ));
    }), true, "step 1 highlights class/level and background/race as two separate regions");
    assert.equal(await page.evaluate(() => {
      const holes = onboardingTour.activeHoles;
      const tip = document.getElementById("tour-tooltip").getBoundingClientRect();
      return holes.length === 2 && Math.abs(tip.left - Math.min(innerWidth - tip.width - 10, Math.max(10, holes[1].left))) <= 1
        && (tip.top >= holes[1].bottom || holes[1].bottom + 10 + tip.height > innerHeight - 10);
    }), true, "step 1 places its instruction below the origin row when it fits");
    await page.locator("#tour-next-btn").click();
    await identityDetailsReady(page);
    await page.locator("#tour-next-btn").click();
    await ready(page, 1);
    await assertSheetCopy(page, 1);
    assert.equal(await page.evaluate(() => {
      const holes = onboardingTour.steps[1].getHoles();
      const hole = holes[0];
      const rect = document.querySelector("#tab-basic .ability-grid").getBoundingClientRect();
      return holes.length === 1
        && hole.left < rect.left && hole.right > rect.right
        && hole.top < rect.top && hole.bottom > rect.bottom;
    }), true, "step 2 initially highlights only the ability grid");
    await assertBarHiddenWithTargetAtTop(page, "#tab-basic .ability-grid", "step 2 hides the tab bar and puts the ability grid at the top");
    await page.locator("#tour-next-btn").click();
    await ready(page, 2);
    assert.equal(await page.locator(".tabs-shell").evaluate(el => getComputedStyle(el).visibility), "visible", "step 3 shows the tab bar again");
    await assertSheetCopy(page, 2);
    await assertAbilityMenuGuide(page);
    await page.mouse.click(15, 200);
    await assertAbilityMenuGuide(page);
    assert.equal(await page.locator("#ability-choice-modal").isVisible(), false, "backdrop clicks do not advance step 3");
    await page.locator("#set-default-abilities").click();
    await page.waitForFunction(() => !onboardingTour.isTransitioning && !onboardingTour.abilityMenuGuideActive);
    assert.equal(await page.locator("#ability-choice-modal").isVisible(), true, "pressing 決定屬性 opens the choice modal");
    await assertSheetCopy(page, 3);
    await page.locator("#ability-choice-point-buy").click();
    await pointBuyReady(page, 1);
    await assertSheetCopy(page, 4);
    assert.equal(await page.locator("#tour-next-btn").textContent(), "下一步", "4/8 advances to 5/8");
    await page.locator("#tour-next-btn").click();
    await pointBuyReady(page, 2);
    await assertSheetCopy(page, 5);
    assert.equal(await page.evaluate(() => {
      const [background, bonus] = onboardingTour.activeHoles;
      const contains = (hole, element) => {
        const rect = element.getBoundingClientRect();
        return hole.left <= rect.left && hole.right >= rect.right && hole.top <= rect.top && hole.bottom >= rect.bottom;
      };
      return onboardingTour.activeHoles.length === 2
        && contains(background, document.querySelector("#point-buy-modal .point-buy-background"))
        && contains(background, document.getElementById("point-buy-hint"))
        && !contains(background, document.querySelector("#point-buy-modal .point-buy-preset"))
        && contains(bonus, document.querySelector('#point-buy-rows .point-buy-row[data-ability="dex"] .point-buy-control-group--bonus'))
        && !contains(bonus, document.querySelector('#point-buy-rows .point-buy-row[data-ability="str"] .point-buy-control-group--bonus'));
    }), true, "5/8 highlights the background choice and DEX's background bonus control");
    await page.keyboard.press("Escape");
    await closed(page);
    // Complete all original steps, including equipment, spells and search.
    // 「下一步」advances the progress number; staying on the same number uses 「繼續」.
    const nextLabel = () => page.locator("#tour-next-btn").textContent();
    await page.evaluate(() => onboardingTour.start());
    await ready(page, 0);
    await assertSheetCopy(page, 0);
    assert.equal(await nextLabel(), "繼續");
    await page.locator("#tour-next-btn").click();
    await identityDetailsReady(page);
    assert.equal(await nextLabel(), "下一步");
    await page.locator("#tour-next-btn").click();
    await ready(page, 1);
    await assertSheetCopy(page, 1);
    assert.equal(await nextLabel(), "繼續");
    await page.locator("#tour-next-btn").click();
    await ready(page, 2);
    await assertSheetCopy(page, 2);
    assert.equal(await nextLabel(), "開啟決定屬性");
    await page.locator("#tour-next-btn").click();
    await ready(page, 2);
    await assertSheetCopy(page, 3);
    assert.equal(await nextLabel(), "下一步");
    for (let index = 3; index < 6; index++) {
      await page.locator("#tour-next-btn").click();
      await ready(page, index);
      await assertSheetCopy(page, index + 3);
      assert.equal(await nextLabel(), index === 5 ? "導覽完成" : "下一步");
      if (index === 3) {
        await assertBarHiddenWithTargetAtTop(page, "#tab-equipment .equipment-loadout-controls", "step 6 hides the tab bar and puts the loadout at the top");
        await verifyTooltipDragLimits(page);
      }
      if (index === 4) {
        assert.equal(await page.locator(".tabs-shell").evaluate(el => getComputedStyle(el).visibility), "visible", "step 7 shows the tab bar again");
        assert.equal(await page.evaluate(() => {
          const holes = onboardingTour.activeHoles;
          return holes.length === 2 && scrollY === 0 && ["spells-tab-button", "spell-prepare"].every((id, index) => {
            const rect = document.getElementById(id).getBoundingClientRect();
            return holes[index].left <= rect.left && holes[index].right >= rect.right
              && holes[index].top <= rect.top && holes[index].bottom >= rect.bottom;
          });
        }), true, "spells step scrolls to top and highlights the Spells tab and Prepare Spells buttons");
      }
    }
    await page.locator("#tour-next-btn").click();
    await closed(page);
    await page.evaluate(() => onboardingTour.jumpToTarget({ tab: "equipment", selector: "#mainHand" }));
    assert.equal(await page.evaluate(() => document.activeElement.id), "mainHand");
    await page.locator("#utility-menu-toggle").click();
    await page.locator("#help-quick-build-btn").click();
    assert.equal(await page.locator("#quick-build-wizard").getAttribute("aria-hidden"), "false");
    await page.evaluate(() => quickBuild.close());
    const draft = await page.evaluate(() => quickBuild.getDraft());
    await page.evaluate(() => quickBuild.open());
    assert.deepEqual(await page.evaluate(() => quickBuild.getDraft()), draft);
    await page.evaluate(() => quickBuild.close());
    await verifyShareModeEntries(browser, url);
    await verifyImports(browser, url);
    await verifyImports(browser, url, { width: 390, height: 844 });
    await verifyPdfLifecycle(browser, url);
    await verifyAbilityGuidance(browser, url);
    await verifyPointBuyGuidance(browser, url);
    await verifyTouch(browser, url);
    assert.deepEqual(errors, []);
    console.log("Cancellation races, failed positioning, turn dialog, legacy ability/point-buy branches, target jump and quick-build draft reopen passed.");
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}

async function verifyIdentityGuidance(browser, url) {
  for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
    for (const reducedMotion of ["no-preference", "reduce"]) {
      const touch = viewport.width < 500;
      const page = await browser.newPage({ viewport, isMobile: touch, hasTouch: touch, reducedMotion });
      const activate = selector => page.locator(selector)[touch ? "tap" : "click"]();
      await page.goto(url);
      await page.waitForFunction(() => window.onboardingTour);
      await activate("#legal-ack-btn");
      await page.waitForTimeout(650);
      await page.evaluate(() => window.flushPendingAutosave?.());
      const before = await snapshot(page);
      await page.evaluate(() => onboardingTour.start());
      await ready(page, 0);
      await assertSheetCopy(page, 0);
      assert.equal(await page.locator("#tour-prev-btn").isDisabled(), true);
      if (reducedMotion === "no-preference") {
        const animation = await page.evaluate(async () => {
          const width = () => onboardingTour.presentedHoles[0].right - onboardingTour.presentedHoles[0].left;
          const from = width();
          const transition = onboardingTour.next();
          // Repeated activation while moving must not skip the new explanation.
          onboardingTour.next();
          onboardingTour.prev();
          await new Promise(resolve => setTimeout(resolve, 120));
          const middle = width();
          const moving = onboardingTour.isTransitioning;
          await transition;
          return { from, middle, to: width(), moving, index: onboardingTour.currentIndex, phase: onboardingTour.stepPhase };
        });
        assert(animation.from > animation.middle && animation.middle > animation.to && animation.moving,
          `spotlight shrinks smoothly: ${JSON.stringify(animation)}`);
        assert.equal(animation.index, 0);
        assert.equal(animation.phase, 1);
      } else await activate("#tour-next-btn");
      await identityDetailsReady(page);
      const infoSelector = '.basic-row--class-level [data-character-features-tab="class"]';
      for (const close of ["button", "Escape", "backdrop"]) {
        await activate(infoSelector);
        assert.equal(await page.locator("#character-features-modal").isVisible(), true);
        assert.equal(await page.locator("#tour-overlay").isVisible(), false);
        assert.equal(await page.evaluate(() => autosaveSuspended), false, "normal detail controls retain autosave while the tour is paused");
        await activate('#character-features-modal [data-feature-tab="race"]');
        assert.equal(await page.locator('#character-features-modal [data-feature-tab="race"]').getAttribute("aria-selected"), "true");
        await page.keyboard.press("Tab");
        assert.equal(await page.evaluate(() => Boolean(document.activeElement.closest("#character-features-modal"))), true);
        if (close === "Escape") await page.keyboard.press("Escape");
        else if (close === "backdrop") await page.locator("#character-features-modal").click({ position: { x: 2, y: 2 } });
        else await activate("#character-features-modal .app-dialog__close");
        await page.waitForFunction(() => !document.getElementById("character-features-modal")
          && !onboardingTour.identityDetailsOpen && onboardingTour.presentationFrame === null);
        await identityDetailsReady(page);
        assert.equal(await page.locator("#tour-overlay").isVisible(), true);
        assert.equal(await page.evaluate(() => autosaveSuspended), true, "tour previews suspend autosave again on resume");
        assert.equal(await page.evaluate(() => document.activeElement.matches('.basic-row--class-level [data-character-features-tab="class"]')), true);
      }
      if (process.env.DND_ONBOARDING_SCREENSHOT_DIR && reducedMotion === "no-preference") {
        await page.screenshot({ path: path.join(process.env.DND_ONBOARDING_SCREENSHOT_DIR, `identity-details-${viewport.width}.png`) });
      }
      await verifyTooltipDrag(page);
      await activate("#tour-prev-btn");
      await ready(page, 0);
      await assertSheetCopy(page, 0);
      await activate("#tour-next-btn");
      await identityDetailsReady(page);
      await activate("#tour-next-btn");
      await ready(page, 1);
      await assertSheetCopy(page, 1);
      await activate("#tour-prev-btn");
      await identityDetailsReady(page);
      await page.keyboard.press("Tab");
      assert.equal(await page.evaluate(() => onboardingTour.isAllowedTourInteraction(document.activeElement)), true);
      await activate("#tour-skip-btn");
      await closed(page);
      const after = await snapshot(page);
      for (const key of ["data", "storage", "hash"]) assert.deepEqual(after[key], before[key], `identity guidance preserves ${key}`);
      await assertPageInteractive(page);
      await page.evaluate(async () => { await onboardingTour.start(); await onboardingTour.next(); });
      await activate(infoSelector);
      await page.evaluate(() => { AppDialog.showMessage({ title: "巢狀詳情", message: "關閉導覽時一起釋放鎖定" }); });
      await page.evaluate(() => onboardingTour.stop());
      await closed(page);
      await assertPageInteractive(page);
      // Cancellation while the spotlight is shrinking must also release all locks.
      await page.evaluate(async () => {
        await onboardingTour.start();
        onboardingTour.next();
        onboardingTour.stop();
      });
      await closed(page);
      await assertPageInteractive(page);
      await page.close();
    }
  }
  console.log("Identity guidance: both 1/8 phases, animation, repeated activation, back/next, skip, dragging, keyboard, narrow touch layouts and reduced motion passed.");
}

async function verifyTabletopDiceAndKeyStats(browser, url) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.addInitScript(() => { try { localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"); } catch {} });
  await page.goto(url);
  await page.waitForFunction(() => window.onboardingTour && window.TabletopMode && window.DiceRoller);
  await page.locator("#legal-ack-btn").click();
  const keyStats = () => page.evaluate(() => [
    document.getElementById("tabletop-initiative").textContent,
    document.getElementById("tabletop-speed").textContent
  ]);
  const persisted = () => page.evaluate(() => {
    window.flushPendingAutosave?.();
    return JSON.stringify([collectStateObject(), Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])]);
  });
  const toast = () => page.evaluate(() => document.getElementById("app-toast")?.innerText || "");

  // Empty sheet values receive example 先攻／速度 only while step 4 is shown.
  await page.evaluate(() => {
    document.getElementById("initiative-input").value = "";
    document.getElementById("speed-display").value = "";
    TabletopMode.setMode("tabletop", { restoreScroll: false });
    TabletopMode.refresh();
  });
  assert.deepEqual(await keyStats(), ["—", "—"]);
  assert.equal(await page.evaluate(() => DiceRoller.isEnabled()), false);
  const beforeTour = await persisted();
  await page.evaluate(() => onboardingTour.start(3, "tabletop"));
  await ready(page, 3);
  assert.deepEqual(await keyStats(), ["+2", "30 呎"], "step 4 fills missing initiative and speed with examples");
  assert.equal(await persisted(), beforeTour, "example values never reach character data or storage");
  await page.locator("#tour-prev-btn").click();
  await ready(page, 2);
  assert.deepEqual(await keyStats(), ["—", "—"], "leaving step 4 restores the original values");
  await page.locator("#tour-next-btn").click();
  await ready(page, 3);
  await page.keyboard.press("Escape");
  await closed(page);
  assert.deepEqual(await keyStats(), ["—", "—"], "closing the tour restores the original values");
  await page.evaluate(() => onboardingTour.start(3, "tabletop"));
  await ready(page, 3);
  await page.reload();
  await page.waitForFunction(() => window.onboardingTour && window.TabletopMode);
  await page.locator("#legal-ack-btn").click();
  await page.evaluate(() => TabletopMode.setMode("tabletop", { restoreScroll: false }));
  assert.notEqual((await keyStats())[0], "+2", "reloading mid-tour shows no example initiative");
  assert.equal(await page.evaluate(() => onboardingTour.active), false);

  // Existing numbers are kept, and the clickable link enables real dice rolls inside the tour.
  await page.evaluate(() => {
    document.getElementById("initiative-input").value = "+5";
    document.getElementById("speed-display").value = "25";
    document.querySelector('#tab-skills .skill-grid input[id^="skill-"]').value = "+3";
    TabletopMode.setMode("tabletop", { restoreScroll: false });
    TabletopMode.refresh();
  });
  await page.evaluate(() => onboardingTour.start(2, "tabletop"));
  await ready(page, 2);
  const skillRoll = page.locator(".tabletop-skills .tabletop-inline-roll").first();
  assert.equal(await skillRoll.isDisabled(), true);
  await page.locator("#tour-step-text .tour-step-action").click();
  await page.waitForFunction(() => DiceRoller.isEnabled() && !document.querySelector(".tabletop-skills .tabletop-inline-roll").disabled);
  // The dice button glows undimmed instead of a toast.
  assert.equal(await page.locator("#dice-roller-fab").evaluate(el => el.classList.contains("dice-roller-fab--announce")), true);
  assert.doesNotMatch(await toast(), /擲骰功能開啟/);
  // The glowing dice button is not dimmed.
  await page.waitForFunction(() => {
    const fab = document.getElementById("dice-roller-fab").getBoundingClientRect();
    const x = (fab.left + fab.right) / 2;
    const y = (fab.top + fab.bottom) / 2;
    return onboardingTour.activeHoles.length === 1
      && document.elementsFromPoint(x, y).every(element => !element.classList.contains("tour-mask"));
  }, null, { timeout: 2000 });
  assert.equal(await page.evaluate(() => localStorage.getItem("dnd.diceSystemEnabled.v1")), "true",
    "the link uses the real dice switch");
  await skillRoll.click();
  await page.waitForFunction(() => /技能檢定：.*\+ 6 =/.test(document.getElementById("app-toast").innerText));
  assert.deepEqual(await page.evaluate(() => [onboardingTour.active, onboardingTour.currentIndex]), [true, 2]);
  await page.locator("#tour-next-btn").click();
  await ready(page, 3);
  assert.deepEqual(await keyStats(), ["+5", "25 呎"], "real values are not replaced by examples");
  assert.equal(await page.locator("#tabletop-initiative").evaluate(el => el.classList.contains("tour-roll-pulse")), true,
    "with dice already on, step 4 pulses the initiative on entry");
  await page.locator("#tabletop-initiative .tabletop-inline-roll").click({ force: true });
  await page.waitForFunction(() => /先攻：.*\+ 5 =/.test(document.getElementById("app-toast").innerText));
  // Other page controls stay blocked while rolling is available.
  await page.locator("#tabletop-ac").click({ force: true });
  assert.deepEqual(await page.evaluate(() => [onboardingTour.active, onboardingTour.currentIndex]), [true, 3]);

  // Steps 3 and 4 let the dice button open the roller above the tour; closing it returns to the tour.
  const fabIsMasked = () => page.evaluate(() => {
    const rect = document.getElementById("dice-roller-fab").getBoundingClientRect();
    return document.elementsFromPoint((rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2)
      .some(element => element.classList.contains("tour-mask"));
  });
  const rollerState = () => page.evaluate(() => ({
    open: document.getElementById("dice-roller-fab").getAttribute("aria-expanded") === "true",
    active: onboardingTour.active,
    index: onboardingTour.currentIndex,
    aboveTour: Number(getComputedStyle(document.getElementById("dice-roller-modal")).zIndex)
      > Number(getComputedStyle(document.getElementById("tour-overlay")).zIndex),
    tourInert: document.getElementById("tour-overlay").inert
  }));
  for (const [index, close] of [[3, "escape"], [2, "button"]]) {
    if (index === 2) {
      await page.locator("#tour-prev-btn").click();
      await ready(page, 2);
    }
    assert.equal(await fabIsMasked(), false, `step ${index + 1} keeps the dice button usable`);
    // Earlier roll results can briefly cover the dice button.
    await page.waitForFunction(() => {
      const rect = document.getElementById("dice-roller-fab").getBoundingClientRect();
      return !document.elementsFromPoint((rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2)
        .some(element => element.closest("#app-toast"));
    }, null, { timeout: 10000 });
    await page.locator("#dice-roller-fab").click({ force: true });
    await page.waitForFunction(() => document.getElementById("dice-roller-modal").classList.contains("is-open"));
    assert.deepEqual(await rollerState(), { open: true, active: true, index, aboveTour: true, tourInert: true });
    await page.locator('#dice-roller-modal [data-die="20"]').click();
    await page.locator("#dice-roller-roll").click();
    await page.waitForFunction(() => /\d/.test(document.getElementById("dice-roller-total-value")?.textContent || ""));
    // Rolling disables the focused ROLL button; focus must stay in the roller so Escape still works.
    assert.equal(await page.evaluate(() => document.getElementById("dice-roller-modal").contains(document.activeElement)), true);
    // Closing the roller in the tour clears roll results at once, but keeps other messages.
    await page.evaluate(() => {
      DiceRoller.roll({ count: 1, sides: 20, modifier: 0, label: "測試" });
      AppDialog.notify("一般訊息");
    });
    if (close === "escape") await page.keyboard.press("Escape");
    else await page.locator("#dice-roller-close").click();
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll("#app-toast > .app-toast")].map(toast => toast.dataset.variant)),
      ["default"], `closing by ${close} removes roll results immediately`);
    await page.evaluate(() => AppDialog.dismissToasts());
    await page.waitForFunction(() => document.getElementById("dice-roller-modal").hidden);
    assert.deepEqual(await rollerState(), { open: false, active: true, index, aboveTour: true, tourInert: false },
      `${close} closes only the roller on step ${index + 1}`);
    assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById("tour-tooltip")).visibility), "visible");
  }
  await page.locator("#dice-roller-fab").click({ force: true });
  await page.waitForFunction(() => document.getElementById("dice-roller-modal").classList.contains("is-open"));
  await page.evaluate(() => onboardingTour.stop());
  await closed(page);
  assert.equal(await page.evaluate(() => document.getElementById("dice-roller-fab").getAttribute("aria-expanded")), "false",
    "stopping the tour also closes the roller");

  // Without dice, step 4 waits for the link, then pulses the initiative together with the dice button.
  await page.evaluate(() => DiceRoller.setEnabled(false));
  await page.evaluate(() => onboardingTour.start(3, "tabletop"));
  await ready(page, 3);
  assert.equal(await page.locator("#tabletop-initiative").evaluate(el => el.classList.contains("tour-roll-pulse")), false);
  await page.locator("#tour-step-text .tour-step-action").click();
  const pulses = await page.evaluate(() => Promise.all(["tabletop-initiative", "dice-roller-fab"].map(async id => {
    const animation = document.getElementById(id).getAnimations().find(item => /announce|pulse/.test(item.animationName));
    await animation?.ready;
    return animation?.startTime ?? null;
  })));
  assert(pulses.every(time => time !== null) && Math.abs(pulses[0] - pulses[1]) <= 20,
    `the initiative and dice button pulse together: ${JSON.stringify(pulses)}`);
  // Later steps keep the dice button dimmed and closed once its glow ends.
  await page.locator("#tour-next-btn").click();
  await ready(page, 4);
  await page.waitForFunction(() => !document.getElementById("dice-roller-fab").classList.contains("dice-roller-fab--announce"), null, { timeout: 8000 });
  await page.waitForFunction(() => {
    const rect = document.getElementById("dice-roller-fab").getBoundingClientRect();
    return document.elementsFromPoint((rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2)
      .some(element => element.classList.contains("tour-mask"));
  });
  await page.locator("#dice-roller-fab").click({ force: true });
  assert.equal(await page.locator("#dice-roller-modal").isHidden(), true, "step 5 does not open the roller");
  await page.keyboard.press("Escape");
  await closed(page);
  assert.equal(await page.evaluate(() => DiceRoller.isEnabled()), true);
  // The menu switch uses the same glow; restoring a saved setting on load does not.
  await page.evaluate(() => {
    const toggle = document.getElementById("dice-system-toggle");
    toggle.click();
    toggle.click();
  });
  assert.equal(await page.locator("#dice-roller-fab").evaluate(el => el.classList.contains("dice-roller-fab--announce")), true);
  await page.reload();
  await page.waitForFunction(() => window.DiceRoller?.isEnabled());
  assert.equal(await page.locator("#dice-roller-fab").evaluate(el => el.classList.contains("dice-roller-fab--announce")), false);
  await page.close();
  console.log("First-table tour dice link, synced initiative/dice pulse, in-tour skill/initiative rolls, roller trial above the tour and temporary initiative/speed examples passed.");
}

async function verifySheetExitSafety(browser, url) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(String(error)));
  await page.goto(url);
  await page.waitForFunction(() => window.onboardingTour);
  await page.locator("#legal-ack-btn").click();
  const stages = ["identity", "details", "abilities", "menu", "choice", "points", "background", "equipment", "spells", "search"];
  for (const stage of stages) {
    for (const exit of ["button", "Escape"]) {
      const index = { identity: 0, details: 0, abilities: 1, menu: 2, choice: 2, points: 2, background: 2, equipment: 3, spells: 4, search: 5 }[stage];
      await page.evaluate(index => onboardingTour.start(index), index);
      await ready(page, index);
      if (stage === "details") { await page.locator("#tour-next-btn").click(); await identityDetailsReady(page); }
      if (["choice", "points", "background"].includes(stage)) {
        await page.locator("#tour-next-btn").click();
        await ready(page, 2);
      }
      if (["points", "background"].includes(stage)) {
        await page.locator("#ability-choice-point-buy").click();
        await pointBuyReady(page, 1);
      }
      if (stage === "background") {
        await page.locator("#tour-next-btn").click();
        await pointBuyReady(page, 2);
        await page.locator("#tour-prev-btn").click();
        await pointBuyReady(page, 1);
        await page.locator("#tour-prev-btn").click();
        await page.waitForFunction(() => onboardingTour.stepPhase === 0 && onboardingTour.presentationFrame === null);
      }
      if (exit === "Escape") await page.keyboard.press("Escape");
      else await page.locator(stage === "search" ? "#tour-next-btn" : "#tour-skip-btn").click();
      await closed(page);
      assert.equal(await page.locator("#ability-choice-modal").isVisible(), false, stage);
      assert.equal(await page.locator("#point-buy-modal").isVisible(), false, stage);
      await assertPageInteractive(page);
    }
  }
  // Stop and restart across each awaited layout/scroll boundary.
  for (let index = 0; index < 6; index++) {
    for (const delay of [0, 90, 200]) {
      await page.evaluate(({ index, delay }) => {
        onboardingTour.start(index);
        setTimeout(() => onboardingTour.stop(), delay);
      }, { index, delay });
      await closed(page);
      await assertPageInteractive(page);
    }
  }
  await page.evaluate(async () => {
    const original = onboardingTour.getSteps;
    onboardingTour.getSteps = function() {
      const steps = original.call(this);
      steps[0].beforePosition = async () => { throw new Error("test sheet positioning failure"); };
      return steps;
    };
    try { await onboardingTour.start(); }
    finally { onboardingTour.getSteps = original; }
  });
  await closed(page);
  await assertPageInteractive(page);
  assert.deepEqual(errors, []);
  await page.close();
  console.log("Sheet exit safety: every phase via skip/completion/Escape, point-buy backtracking, async cancellation and usable page after exit passed.");
}

async function verifyAbilityGuidance(browser, url) {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    const page = await browser.newPage({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true, reducedMotion });
    await page.addInitScript(() => { try { localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"); } catch {} });
    await page.goto(url);
    await page.waitForFunction(() => window.onboardingTour);
    await page.locator("#legal-ack-btn").tap();
    await page.waitForTimeout(650);
    await page.evaluate(() => window.flushPendingAutosave?.());
    const before = await snapshot(page);
    await page.evaluate(() => onboardingTour.start(1));
    await page.locator("#tour-next-btn").tap();
    await ready(page, 2);
    await assertAbilityMenuGuide(page);
    await verifyTooltipDrag(page);
    assert.equal(await page.evaluate(() => onboardingTour.abilityMenuGuideActive), true, "dragging does not advance the guide");
    const draggedTip = await page.locator("#tour-tooltip").boundingBox();
    const assertDraggedPosition = async () => {
      const rect = await page.locator("#tour-tooltip").boundingBox();
      assert(Math.abs(rect.x - draggedTip.x) <= 1 && Math.abs(rect.y - draggedTip.y) <= 1, "guide changes preserve the dragged tooltip position");
    };
    const backdropPoint = await page.evaluate(() => ({ x: 5, y: innerHeight - 5 }));
    await page.touchscreen.tap(backdropPoint.x, backdropPoint.y);
    await page.touchscreen.tap(backdropPoint.x, backdropPoint.y);
    assert.deepEqual(await page.evaluate(() => ({
      active: onboardingTour.active,
      index: onboardingTour.currentIndex,
      transitioning: onboardingTour.isTransitioning,
      guide: onboardingTour.abilityMenuGuideActive,
      menuOpen: document.getElementById("utility-menu-toggle").getAttribute("aria-expanded") === "true"
    })), { active: true, index: 2, transitioning: false, guide: true, menuOpen: true },
    "backdrop taps cannot advance or close the guide");
    await assertDraggedPosition();
    await page.locator("#tour-next-btn").tap();
    await ready(page, 2);
    await page.waitForFunction(() => !onboardingTour.abilityMenuGuideActive);
    assert.equal(await page.locator("#ability-choice-modal").isVisible(), true);
    await assertDraggedPosition();
    if (process.env.DND_ONBOARDING_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.DND_ONBOARDING_SCREENSHOT_DIR, `ability-guidance-${reducedMotion}.png`) });
    await page.locator("#tour-prev-btn").tap();
    await ready(page, 1);
    await page.locator("#tour-next-btn").tap();
    await ready(page, 2);
    await assertAbilityMenuGuide(page);
    await page.locator("#set-default-abilities").tap();
    await ready(page, 2);
    await page.waitForFunction(() => !onboardingTour.abilityMenuGuideActive);
    assert.equal(await page.locator("#ability-choice-modal").isVisible(), true, "touching 決定屬性 opens the choice modal");
    await page.locator("#tour-prev-btn").tap();
    await ready(page, 1);
    await page.locator("#tour-next-btn").tap();
    await ready(page, 2);
    await assertAbilityMenuGuide(page);
    await page.locator("#tour-skip-btn").tap();
    await closed(page);
    assert.equal(await page.locator("#utility-menu-toggle").getAttribute("aria-expanded"), "false");
    assert.equal(await page.locator("#ability-choice-modal").isVisible(), false);
    const after = await snapshot(page);
    for (const key of ["data", "storage", "dice", "hash"]) assert.deepEqual(after[key], before[key], `ability guidance preserves ${key}`);
    await page.close();
  }
  console.log("Ability guidance: open-menu dual highlights, button tap, tooltip placement and dragging, reduced motion, back, cancellation and state preservation passed.");
}

// 4/8 and 5/8 put their first target at the top and lock the card only when
// both targets and the guidance fit; the demo background never persists.
async function verifyPointBuyGuidance(browser, url) {
  for (const viewport of [{ width: 375, height: 667, pointsLocked: false }, { width: 390, height: 844, pointsLocked: true }]) {
    const page = await browser.newPage({ viewport, isMobile: true, hasTouch: true });
    await page.addInitScript(() => { try { localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"); } catch {} });
    await page.goto(url);
    await page.waitForFunction(() => window.onboardingTour);
    await page.locator("#legal-ack-btn").tap();
    await page.waitForTimeout(650);
    await page.evaluate(() => window.flushPendingAutosave?.());
    const before = await snapshot(page);
    const cdp = await page.context().newCDPSession(page);
    const swipe = async (x, y, distance) => {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
      for (let offset = 15; offset <= distance; offset += 15) {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y - offset }] });
        await page.waitForTimeout(35);
      }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await page.waitForTimeout(350);
    };
    const layout = () => page.evaluate(() => {
      const element = document.querySelector("#point-buy-modal .point-buy-modal-card");
      const card = element.getBoundingClientRect();
      const tip = document.getElementById("tour-tooltip").getBoundingClientRect();
      const holes = onboardingTour.activeHoles;
      const select = document.getElementById("point-buy-background");
      return {
        locked: onboardingTour.pointBuyScrollLocked,
        // Tall screens run out of card to scroll before the target reaches the top.
        firstAtTop: holes[0].top - card.top <= 12 || element.scrollTop >= element.scrollHeight - element.clientHeight - 1,
        holes: holes.length,
        between: holes.length === 2 && tip.top >= holes[0].bottom && tip.bottom <= holes[1].top,
        covers: holes.some(hole => tip.top < hole.bottom && tip.bottom > hole.top),
        scrollTop: document.querySelector("#point-buy-modal .point-buy-modal-card").scrollTop,
        background: select.value,
        choices: [...select.options].filter(option => !option.hidden && !option.disabled).map(option => option.value)
      };
    });
    const cardPoint = () => page.evaluate(() => {
      const card = document.querySelector("#point-buy-modal .point-buy-modal-card").getBoundingClientRect();
      return { x: card.left + 12, y: card.top + card.height * 0.75 };
    });
    await page.evaluate(() => onboardingTour.start(2));
    await ready(page, 2);
    await page.locator("#tour-next-btn").tap();
    await page.waitForFunction(() => !onboardingTour.isTransitioning && !onboardingTour.abilityMenuGuideActive);
    await page.locator("#ability-choice-point-buy").tap();
    await pointBuyReady(page, 1);
    const points = await layout();
    assert.deepEqual({ ...points, scrollTop: undefined }, {
      locked: viewport.pointsLocked, firstAtTop: true, holes: viewport.pointsLocked ? 2 : 1,
      between: viewport.pointsLocked, covers: false, scrollTop: undefined,
      background: "soldier", choices: ["criminal", "soldier"]
    }, `4/8 layout at ${viewport.width}x${viewport.height}`);
    const pointsPoint = await cardPoint();
    await swipe(pointsPoint.x, pointsPoint.y, 120);
    const swiped = await layout();
    if (viewport.pointsLocked) assert.equal(swiped.scrollTop, points.scrollTop, "4/8 does not scroll once both targets fit");
    else {
      assert(swiped.scrollTop > points.scrollTop, "4/8 scrolls when both targets cannot fit");
      assert.equal(swiped.covers, false, "4/8 guidance moves away from the scrolled targets");
    }

    await page.locator("#tour-next-btn").tap();
    await pointBuyReady(page, 2);
    const bonus = await layout();
    assert.deepEqual({ ...bonus, scrollTop: undefined }, {
      locked: true, firstAtTop: true, holes: 2, between: true, covers: false, scrollTop: undefined,
      background: "soldier", choices: ["criminal", "soldier"]
    }, `5/8 layout at ${viewport.width}x${viewport.height}`);
    const bonusPoint = await cardPoint();
    await swipe(bonusPoint.x, bonusPoint.y, 120);
    assert.equal((await layout()).scrollTop, bonus.scrollTop, "5/8 does not scroll once both targets fit");
    const bonusValue = ability => page.locator(`#point-buy-rows .point-buy-row[data-ability="${ability}"] .point-buy-value--bonus`).textContent();
    await page.locator('#point-buy-rows .point-buy-row[data-ability="dex"] [data-action="bonus-inc"]').tap();
    assert.equal(await bonusValue("dex"), "+1", "5/8 allows DEX's bonus buttons");
    await page.evaluate(() => {
      document.querySelector('#point-buy-rows .point-buy-row[data-ability="str"] [data-action="bonus-inc"]').click();
      document.querySelector('#point-buy-rows .point-buy-row[data-ability="dex"] [data-action="base-inc"]').click();
      document.getElementById("point-buy-reset").click();
    });
    assert.equal(await bonusValue("str"), "+0", "5/8 blocks other bonus buttons");
    assert.equal(await bonusValue("dex"), "+1", "5/8 blocks base values and reset");
    await page.locator("#point-buy-background").selectOption("criminal");
    assert.equal(await bonusValue("dex"), "+1", "switching to the other demo background keeps DEX's bonus");

    await page.locator("#tour-skip-btn").tap();
    await closed(page);
    assert.deepEqual(await page.evaluate(() => {
      const select = document.getElementById("point-buy-background");
      return {
        modal: document.getElementById("point-buy-modal").className,
        hidden: [...select.options].filter(option => option.hidden || option.disabled).length,
        empty: [...select.options].some(option => option.value === "")
      };
    }), { modal: "", hidden: 0, empty: true }, "leaving restores the point-buy background choices");
    const after = await snapshot(page);
    for (const key of ["data", "storage", "hash"]) assert.deepEqual(after[key], before[key], `point-buy guidance preserves ${key}`);
    await page.locator("#utility-menu-toggle").tap();
    await page.locator("#set-default-abilities").tap();
    await page.locator("#ability-choice-point-buy").tap();
    assert.deepEqual(await page.evaluate(() => ({
      background: document.getElementById("point-buy-background").value,
      scrollTop: document.querySelector("#point-buy-modal .point-buy-modal-card").scrollTop
    })), { background: "", scrollTop: 0 }, "the next point buy opens without the demo choice");
    await page.close();
  }
  console.log("Point-buy guidance: targets at the top, fit-based scroll lock, guidance between highlights, demo backgrounds, DEX-only bonus and restore passed.");
}

async function verifyTouch(browser, url) {
  const page = await browser.newPage({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
  await page.addInitScript(() => { try { localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"); } catch {} });
  await page.goto(url);
  await page.waitForFunction(() => window.onboardingTour && window.DiceRoller);
  await page.locator("#legal-ack-btn").tap();
  await page.evaluate(() => {
    for (const [id, value] of Object.entries({ class: "fighter", race: "dwarf", background: "soldier", level: "1", hp: "12" })) {
      const field = document.getElementById(id);
      field.value = value;
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }
    TabletopMode.applyState({ temporaryHp: 7, builtInResourceUsage: { "fighter-second-wind": 1 } });
    const diceToggle = document.getElementById("dice-system-toggle");
    diceToggle.checked = true;
    diceToggle.dispatchEvent(new Event("change", { bubbles: true }));
    DiceRoller.rollExpression("1d20+2", { label: "導覽前的測試紀錄" });
  });
  await page.waitForTimeout(700);
  await page.evaluate(() => { window.flushPendingAutosave?.(); document.getElementById("utility-menu-toggle").focus(); });
  const before = await snapshot(page);
  await page.locator("#utility-menu-toggle").tap();
  await page.locator("#first-table-tour-btn").tap();
  await ready(page, 0);
  await assertLayout(page);
  assert.equal(await page.evaluate(() => onboardingTour.tabletopMenuGuidePhase), "button");
  await page.locator("#tour-next-btn").tap();
  await ready(page, 1);
  await assertLayout(page);
  const cdp = await page.context().newCDPSession(page);
  const heading = await page.locator(".tour-heading-row").boundingBox();
  const initialTip = await page.locator("#tour-tooltip").boundingBox();
  const dragX = heading.x + heading.width / 2;
  const dragY = heading.y + heading.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: dragX, y: dragY }] });
  for (let offset = 10; offset <= 40; offset += 10) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: dragX, y: dragY - offset }] });
    // Give Chromium time to recognize each move, as in the swipe below.
    await page.waitForTimeout(35);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  assert(Math.abs((await page.locator("#tour-tooltip").boundingBox()).y - (initialTip.y - 40)) <= 1, "touch dragging moves the heading");
  // Separate the drag gesture from the subsequent tap in Chromium's touch recognizer.
  await page.waitForTimeout(350);
  assert.equal(await page.locator("#tour-step-text").evaluate(el => el.classList.contains("is-scrollable")), false);
  const shortText = await page.locator("#tour-step-text").boundingBox();
  const beforeTextDrag = await page.locator("#tour-tooltip").boundingBox();
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: shortText.x + 8, y: shortText.y + 8 }] });
  for (let offset = 10; offset <= 30; offset += 10) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: shortText.x + 8, y: shortText.y + 8 + offset }] });
    await page.waitForTimeout(35);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  assert(Math.abs((await page.locator("#tour-tooltip").boundingBox()).y - (beforeTextDrag.y + 30)) <= 1, "touch dragging short guidance moves the window");
  await page.waitForTimeout(350);
  await page.locator("#tour-step-text summary").tap();
  await page.waitForFunction(() => document.querySelector("#tour-step-text details").open);
  assert.equal(await page.locator("#tour-step-text details").evaluate(el => el.open), true);
  const content = page.locator("#tour-step-text");
  const box = await content.boundingBox();
  const windowScroll = await page.evaluate(() => scrollY);
  const tipBeforeSwipe = await page.locator("#tour-tooltip").boundingBox();
  assert.equal(await content.evaluate(el => el.classList.contains("is-scrollable")), true);
  const x = box.x + box.width / 2;
  const startY = box.y + box.height - 12;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: startY }] });
  for (let offset = 15; offset <= 90; offset += 15) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: startY - offset }] });
    await page.waitForTimeout(35);
  }
  await page.waitForTimeout(120);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(200);
  assert(await content.evaluate(el => el.scrollTop > 0), "touch scroll reaches the remaining examples");
  assert.deepEqual(await page.locator("#tour-tooltip").boundingBox(), tipBeforeSwipe, "scrolling long guidance does not drag the window");
  assert.equal(await page.evaluate(() => scrollY), windowScroll, "touching the tooltip does not scroll its background");
  await assertLayout(page);
  // Background operations are blocked even if dispatched directly at a control.
  await page.evaluate(() => document.getElementById("tabletop-condition-manage").click());
  assert.equal(await page.locator("#tabletop-condition-modal").isVisible(), false);
  await page.locator("#tour-skip-btn").tap();
  await closed(page);
  const after = await snapshot(page);
  for (const key of ["data", "storage", "dice", "mode", "panel", "scroll", "focus"]) assert.deepEqual(after[key], before[key], `touch ${key}`);
  await page.close();
  console.log("Touch: collapsed examples, internal swipe, visible controls, blocked background operation and existing HP/resource/dice state preservation passed.");
}

// Quick build and both tours rewrite the identity selects, so share mode closes
// their entries rather than relying on the locked controls.
async function verifyShareModeEntries(browser, url) {
  const entries = ["#help-quick-build-btn", "#restart-onboarding-btn", "#first-table-tour-btn"];
  const identity = page => page.evaluate(() => ["class", "level", "race", "background"].map(id => {
    const select = document.getElementById(id);
    return [select.value, select.disabled];
  }));
  const errors = [];
  const openPage = async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.addInitScript(() => { try { localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"); } catch {} });
    page.on("pageerror", error => errors.push(String(error)));
    return page;
  };
  const source = await openPage();
  let hash;
  try {
    await source.goto(url);
    await source.waitForFunction(() => window.onboardingTour && window.quickBuild);
    hash = await source.evaluate(() => {
      applyStateObject({ class: "fighter", level: "3", race: "dwarf", background: "soldier" });
      return encodeStateToHash(collectShareState());
    });
  } finally { await source.close(); }

  const shared = await openPage();
  try {
    const shareUrl = new URL(url); shareUrl.searchParams.set("analytics", "owner"); shareUrl.hash = hash;
    await shared.goto(shareUrl.href);
    await shared.waitForFunction(() => window.SHARE_MODE === true && window.onboardingTour && window.quickBuild);
    const locked = [["fighter", true], ["3", true], ["dwarf", true], ["soldier", true]];
    assert.deepEqual(await identity(shared), locked, "share locks the identity selects");
    assert.equal(await shared.locator("#legal-onboarding-btn").isVisible(), false, "share welcome has no quick-build entry");
    assert.equal(await shared.locator("#legal-onboarding-btn").isDisabled(), true);
    await shared.locator("#legal-ack-btn").click();
    await shared.locator("#utility-menu-toggle").click();
    for (const selector of entries) {
      assert.equal(await shared.locator(selector).isDisabled(), true, `${selector} is closed in share mode`);
      assert.equal(await shared.locator(selector).getAttribute("title"), "分享模式不提供此功能");
    }
    await shared.locator("#utility-menu-toggle").click();
    // Programmatic entries are refused as well, so nothing can re-enable the selects.
    await shared.evaluate(async () => {
      quickBuild.open();
      await onboardingTour.start();
      await onboardingTour.startTabletop();
    });
    assert.equal(await shared.locator("#quick-build-wizard.open").count(), 0, "quick build never opens in share mode");
    assert.equal(await shared.evaluate(() => onboardingTour.active), false, "tours never start in share mode");
    assert.equal(await shared.locator("#tour-overlay").getAttribute("aria-hidden"), "true");
    assert.equal(await shared.evaluate(() => window.SHARE_MODE), true, "share mode is never dropped");
    assert.deepEqual(await identity(shared), locked, "identity stays locked after refused entries");
  } finally { await shared.close(); }

  const failed = await openPage();
  try {
    const failedUrl = new URL(url); failedUrl.searchParams.set("analytics", "owner"); failedUrl.hash = "#s2=not-a-valid-share";
    await failed.goto(failedUrl.href);
    await failed.getByRole("dialog", { name: "分享連結讀取失敗", exact: true }).getByRole("button", { name: "知道了", exact: true }).click();
    assert.equal((await identity(failed)).some(([, disabled]) => disabled), false, "a failed share leaves the blank card unlocked");
    for (const selector of entries) assert.equal(await failed.locator(selector).isDisabled(), true, `${selector} stays closed after a failed share`);
    await failed.evaluate(() => quickBuild.open());
    assert.equal(await failed.locator("#quick-build-wizard.open").count(), 0);
  } finally { await failed.close(); }
  assert.deepEqual(errors, [], "share mode entry browser errors");
  console.log("Share mode: identity selects locked, quick-build and both tour entries closed (buttons and APIs), failed share left unlocked.");
}

async function verifyImports(browser, url, viewport = { width: 1280, height: 800 }) {
  const page = await browser.newPage({ viewport });
  await page.addInitScript(() => { try { localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"); } catch {} });
  // Exercise the real private importer using a deterministic draft, retaining its
  // confirmation and result dialogs; no extra production API is needed.
  await page.route("**/quick-build.js?*", async route => {
    const response = await route.fetch();
    const source = (await response.text()).replace("  window.quickBuild = {", `
      window.prepareOnboardingImport = () => {
        draft = createDraft();
        Object.assign(draft.choices, {
          background: 'soldier', race: 'dwarf', class: 'barbarian', alignment: 'TN',
          backgroundWealth: 'gold', classEquipmentMethod: 'gold',
          classOptions: { skills: ['察覺', '求生'] },
          levelOne: { languages: ['矮人語', '精靈語'], weaponMastery: ['巨斧', '手斧'] }
        });
        reconcileDraft(draft);
        draft.choices.shop = { funding: shopFundingSignature(draft), items: [
          { name: '繩索', gearName: '', amount: 1, currency: '金幣', quantity: 2 },
          { name: '火把', gearName: '', amount: 1, currency: '銅幣', quantity: 1 }
        ] };
        reconcileDraft(draft);
        draft.ui.currentStepId = 'level-one-review';
        draft.ui.view = 'review';
        saveDraft();
      };
      window.quickBuild = {`);
    await route.fulfill({ response, body: source });
  });
  for (const scenario of ["cancel", "complete", "warning", "failure", "pdf", "share", "close"]) {
    await page.goto(url);
    await page.waitForFunction(() => window.prepareOnboardingImport && window.onboardingTour);
    if (scenario === "complete") {
      // Seed other-class memories before load so the card reset is observable.
      await page.evaluate(() => {
        localStorage.setItem("dnd.classOptionMemories.v1", JSON.stringify({ version: 1, classes: { druid: { level: 3, values: { "druid-land": "arid" }, lists: {} } } }));
        localStorage.setItem("dnd.spellManagementMemories.v1", JSON.stringify({ version: 1, classes: { wizard: { level: 3, entries: [{ spellId: "light", spellClass: "wizard" }] } }, manual: null }));
        localStorage.setItem("dnd.spellManagementBackup.v1", "{\"kept\":true}");
      });
      await page.goto(url);
      await page.waitForFunction(() => window.prepareOnboardingImport && window.onboardingTour);
    }
    await page.evaluate(scenario => {
      prepareOnboardingImport();
      if (scenario === "warning") document.getElementById("calculate-skills-button").remove();
      if (scenario === "failure") window.fillSaves = () => { throw new Error("test import failure"); };
      if (scenario === "pdf") window.downloadQuickBuildCompactPdf = async () => { window.pdfRequested = true; };
      if (scenario === "share") window.copyShareUrl = async () => { window.shareRequested = true; };
    }, scenario);
    if (scenario === "complete") await page.evaluate(() => SpellManagement.setManual(true, { confirm: false }));
    if (scenario === "complete") {
      await page.locator("#legal-onboarding-btn").click();
    } else {
      await page.locator("#legal-ack-btn").click();
      await page.locator("#utility-menu-toggle").click();
      await page.locator("#help-quick-build-btn").click();
    }
    await page.locator('[data-import-mobile-card]').click();
    if (scenario === "cancel") {
      const before = await page.evaluate(() => collectStateObject());
      await page.locator(".app-dialog__actions .app-dialog__button--secondary").click();
      assert.deepEqual(await page.evaluate(() => collectStateObject()), before);
      await page.locator(".quick-build-close").click();
      await assertPageInteractive(page);
      continue;
    }
    await page.locator(".app-dialog__actions .app-dialog__button--danger").click();
    await page.waitForFunction(() => document.querySelector(".app-dialog__header h2")?.textContent.includes("角色卡"));
    if (scenario === "complete") {
      const storage = await page.evaluate(() => ({ options: localStorage.getItem("dnd.classOptionMemories.v1"),
        spells: JSON.parse(localStorage.getItem("dnd.spellManagementMemories.v1") || "{}").classes || {},
        backup: localStorage.getItem("dnd.spellManagementBackup.v1"), notice: localStorage.getItem("dnd.spellManagementClassNoticeDisabled.v1") }));
      assert.equal(storage.options, null, "quick build clears class option memory");
      assert.equal(Object.hasOwn(storage.spells, "wizard"), false, "quick build clears other-class spell memory");
      assert.deepEqual([storage.backup, storage.notice], ['{"kept":true}', "true"], "legacy backup and notice preference are kept");
      // Temporary quick-build purchases are paid from the starting gold only during the import.
      assert.deepEqual(await page.evaluate(() => ({
        money: ["pp", "gp", "sp", "cp"].map(id => document.getElementById(`money-balance-${id}`).value),
        log: JSON.parse(document.getElementById("money-log-data").value).map(entry => entry.note),
        gear: document.getElementById("gear-notes").value.split(/\r?\n/u)[0]
      })), { money: ["0", "122", "9", "9"], log: ["購買繩索 ×2、火把"], gear: "購買物品：繩索 ×2、火把" }, "quick-build shop purchases are applied on import");
    }
    const firstTable = page.getByRole("button", { name: "初次遊玩", exact: true });
    assert.equal(await firstTable.count(), scenario === "failure" ? 0 : 1, await page.locator(".app-dialog__body").innerText());
    if (scenario !== "failure") {
      const dialog = page.locator('.app-dialog[data-variant="quick-build-complete"]');
      assert.equal(await dialog.locator("strong").textContent(), "角色完成，可以開始冒險了！");
      assert.deepEqual(await dialog.locator("li").allTextContents(), [
        "下載PDF：下載可列印的角色卡，方便面團使用。",
        "分享角卡：取得網址連結，將角色卡分享給 DM 查看。",
        "初次遊玩：透過導覽，認識手機跑團模式的基本操作。"
      ]);
      assert.deepEqual(await dialog.locator(".app-dialog__actions button").allTextContents(), ["下載PDF", "分享角卡", "初次遊玩"]);
      assert.equal(await dialog.locator(".app-dialog__button--primary").textContent(), "初次遊玩");
      assert.equal(await firstTable.isDisabled(), scenario === "warning", "incomplete imports keep the tour unavailable");
      const boxes = await dialog.locator(".app-dialog__actions button").evaluateAll(buttons => buttons.map(button => {
        const { x, y, width } = button.getBoundingClientRect();
        return { x, y, width, clipped: button.scrollWidth > button.clientWidth };
      }));
      assert(boxes.every(box => box.y === boxes[0].y && box.width > 0 && !box.clipped), "all three actions fit on one row");
      assert(boxes[0].x < boxes[1].x && boxes[1].x < boxes[2].x, "action order matches the descriptions");
    }
    assert.equal(await page.evaluate(() => onboardingTour.active), false);
    if (scenario !== "failure") {
      assert.equal(await page.evaluate(() => SpellManagement.isManual()), false, "quick build imports always activate automatic spell management");
      const hp = await page.evaluate(() => ({
        current: document.getElementById("hp").value,
        maximum: document.getElementById("hp-display").value
      }));
      assert(Number(hp.maximum) > 0);
      assert.equal(hp.current, hp.maximum, "quick-build import fills current HP with maximum HP");
    }
    if (scenario === "complete") {
      await firstTable.click();
      await ready(page, 0);
      await page.locator("#tour-skip-btn").click();
      await closed(page);
    } else if (scenario === "pdf") {
      await page.getByRole("button", { name: "下載PDF", exact: true }).click();
      assert.equal(await page.evaluate(() => window.pdfRequested), true);
    } else if (scenario === "share") {
      await page.getByRole("button", { name: "分享角卡", exact: true }).click();
      assert.equal(await page.evaluate(() => window.shareRequested), true);
    } else if (scenario === "failure") {
      await page.getByRole("button", { name: "知道了", exact: true }).click();
    } else {
      await page.keyboard.press("Escape");
      assert.equal(await page.evaluate(() => onboardingTour.active), false);
    }
    await assertPageInteractive(page);
  }
  await page.close();
  console.log(`Quick-build import (${viewport.width}px): confirmation cancellation, memory reset, completion copy/action order/layout, tour emphasis, warning/exception guards, PDF/share dispatch and close passed.`);
}

async function assertPageInteractive(page) {
  assert.equal(await page.locator("#main-content").evaluate(el => el.inert), false);
  assert.equal(await page.locator(".app-dialog").count(), 0);
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains("app-dialog-open")), false);
  assert.equal(await page.evaluate(() => document.body.style.position), "");
  await page.locator("#utility-menu-toggle").click();
  assert.equal(await page.locator("#utility-menu-toggle").getAttribute("aria-expanded"), "true");
  await page.locator("#help-quick-build-btn").click();
  await page.locator(".quick-build-close").click();
  assert.equal(await page.locator("#main-content").evaluate(el => el.inert), false);
}

async function verifyPdfLifecycle(browser, url) {
  const page = await browser.newPage();
  await page.addInitScript(() => { try { localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"); } catch {} });
  await page.goto(url);
  await page.waitForFunction(() => window.quickBuild && window.onboardingTour);
  await page.locator("#legal-ack-btn").click();
  let attempts = 0;
  await page.route("**/pdf-retry-test.js", route => {
    attempts++;
    return attempts === 1 ? route.abort("failed")
      : route.fulfill({ contentType: "text/javascript", body: "window.pdfRetryLoaded = true;" });
  });
  assert.equal(await page.evaluate(() => loadScriptOnce("pdf-retry-test.js").then(() => false, () => true)), true);
  const retried = await page.evaluate(() => Promise.race([
    loadScriptOnce("pdf-retry-test.js").then(() => window.pdfRetryLoaded),
    new Promise(resolve => setTimeout(() => resolve("timed out"), 2000))
  ]));
  assert.equal(retried, true, "a failed PDF script must be fetched again on retry");
  assert.equal(attempts, 2);

  // Keep the real name dialog and export control flow; isolate font/PDF work.
  for (const scenario of ["cancel", "pending-cancel", "success", "failure"]) {
    await page.evaluate(scenario => {
      window.pdfExportCalls = 0;
      window.validatePdfCharacterName = () => scenario === "pending-cancel"
        ? new Promise(resolve => { window.finishPdfNameCheck = () => resolve({ fits: true }); })
        : Promise.resolve({ fits: true });
      window.preloadPdfExportAssets = async () => {};
      window.exportCharacterPdfFromState = async () => {
        window.pdfExportCalls++;
        if (scenario === "failure") throw new Error("test PDF export failure");
      };
      window.pdfFlow = downloadQuickBuildCompactPdf();
    }, scenario);
    await page.locator("#quick-build-pdf-character-name").fill("測試角色");
    if (scenario !== "cancel") await page.getByRole("button", { name: "下載 PDF", exact: true }).click();
    if (scenario === "pending-cancel") await page.waitForFunction(() => typeof window.finishPdfNameCheck === "function");
    if (scenario.endsWith("cancel")) {
      await page.getByRole("button", { name: "取消", exact: true }).click();
      if (scenario === "pending-cancel") await page.evaluate(() => finishPdfNameCheck());
    }
    if (scenario === "failure") {
      await page.getByRole("heading", { name: "PDF 匯出失敗", exact: true }).waitFor();
      await page.getByRole("button", { name: "關閉", exact: true }).click();
    }
    await page.evaluate(() => window.pdfFlow);
    assert.equal(await page.evaluate(() => window.pdfExportCalls), scenario.endsWith("cancel") ? 0 : 1);
    await assertPageInteractive(page);
  }
  await page.close();
  console.log("PDF lifecycle: failed-script retry, cancellation (including pending name validation), success/error cleanup and page interaction passed; PDF rendering was stubbed.");
}

main().catch(error => { console.error(error); process.exitCode = 1; });

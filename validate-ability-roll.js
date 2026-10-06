"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const vm = require("node:vm");
const { chromium } = require("playwright");

async function validatePointBuy(page) {
  const sheetValues = () => page.evaluate(() => ["str", "dex", "con", "int", "wis", "cha"].map(key => document.getElementById(key).value));
  const originalValues = await sheetValues();
  await page.locator("#utility-menu-toggle").click();
  await page.locator("#set-default-abilities").click();
  await page.locator("#ability-choice-point-buy").click();
  assert.equal(await page.locator("#point-buy-apply").isEnabled(), true, "unused points do not disable apply");
  await page.locator("#point-buy-apply").click();
  assert.match(await page.locator("#point-buy-exit-message").textContent(), /還有 27 點未使用/);
  await page.locator("#point-buy-exit-continue").click();
  assert.deepEqual(await sheetValues(), originalValues, "cancelling under-budget apply preserves scores");
  await page.locator('[data-action="base-inc"][data-ability="str"]').click();
  await page.locator('[data-action="base-inc"][data-ability="str"]').click();
  assert.equal(await page.locator("#point-buy-remain").textContent(), "25");
  await page.locator("#point-buy-apply").click();
  assert.match(await page.locator("#point-buy-exit-message").textContent(), /還有 25 點未使用/);
  assert.deepEqual(await sheetValues(), originalValues, "scores stay unchanged before confirmation");
  await page.locator("#point-buy-exit-confirm").click();
  assert.deepEqual(await sheetValues(), ["10", "8", "8", "8", "8", "8"]);
  assert.equal(await page.evaluate(() => JSON.parse(dndStorage.getItem("dnd.pointBuyLastApplied.v1")).base.str), 10);
  await page.reload();
  await page.locator("#legal-ack-btn").click();
  assert.deepEqual(await sheetValues(), ["10", "8", "8", "8", "8", "8"], "under-budget scores survive reload");
  await page.locator("#utility-menu-toggle").click();
  await page.locator("#set-default-abilities").click();
  await page.locator("#ability-choice-point-buy").click();
  assert.equal(await page.locator("#point-buy-used").textContent(), "2", "last under-budget allocation reopens");
  await page.locator("#ability-choice-default").click();
  await page.locator('[data-default-ability-class="fighter"]').click();
  assert.equal(await page.locator("#point-buy-used").textContent(), "27");
  await page.locator("#point-buy-apply").click();
  assert.doesNotMatch(await page.locator("#point-buy-exit-message").textContent(), /未使用/, "full-budget apply has no unused-points reminder");
  await page.locator("#point-buy-exit-continue").click();
  await page.locator("#point-buy-close").click();
  await page.locator("#point-buy-exit-confirm").click();
}

async function validateDiceHistory(browser, url) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: "reduce" });
  try {
    const errors = [];
    page.on("pageerror", error => errors.push(String(error)));
    await page.goto(url);
    await page.locator("#legal-ack-btn").click();
    // Include both historical formats before reloading the history reader.
    await page.evaluate(() => dndStorage.setItem("dnd.diceRollHistory.v1", JSON.stringify([
      "1d6=3",
      { label: "舊紀錄", expression: "1d20", total: 12, values: [{ value: 12, sides: 20 }] }
    ])));
    await page.reload();
    await page.locator("#legal-ack-btn").click();
    await page.locator("#utility-menu-toggle").click();
    await page.locator("#dice-system-toggle").check();
    await page.locator("#utility-menu-toggle").click();
    await page.locator("#dice-roller-fab").click();
    await page.locator('.dice-roller-die[data-die="20"]').click();

    const roll = page.locator("#dice-roller-roll");
    const dialog = page.locator(".app-dialog");
    const input = page.locator(".app-dialog__roll-note-input");
    const history = () => page.evaluate(() => JSON.parse(dndStorage.getItem("dnd.diceRollHistory.v1") || "[]"));
    const settledCount = async expected => {
      await page.waitForTimeout(250);
      assert.equal((await history()).length, expected);
    };
    const hold = async () => {
      await roll.hover();
      await page.mouse.down();
      await dialog.waitFor({ state: "visible" });
    };
    const shortcut = async () => {
      await roll.focus();
      await page.keyboard.press("Shift+Enter");
      await input.waitFor({ state: "visible" });
      assert.equal(await input.evaluate(element => document.activeElement === element), true);
    };

    // Cancelling before releasing the original pointer must never roll.
    await hold();
    await page.keyboard.press("Escape");
    await page.mouse.up();
    await settledCount(2);
    assert.equal(await dialog.count(), 0);
    assert.equal(await roll.evaluate(element => document.activeElement === element), true);
    await roll.click();
    await settledCount(3);

    // After release over the dialog there may be no click to consume the flag.
    // Both normal keyboard activation methods must still work immediately.
    for (const key of ["Enter", "Space"]) {
      const before = (await history()).length;
      await hold();
      await page.mouse.up();
      await page.locator(".app-dialog__button--secondary").click();
      await settledCount(before);
      await page.keyboard.press(key);
      await settledCount(before + 1);
    }

    const note = "調查密門 <b>文字</b>\n第二行";
    await shortcut();
    await settledCount(5);
    await input.fill(`  ${note}  `);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    assert.equal(await page.locator(".app-dialog__button--primary").evaluate(element => document.activeElement === element), true);
    await page.keyboard.press("Enter");
    await settledCount(6);
    assert.equal((await history())[0].note, note);
    await page.locator("#dice-roller-history-view").click();
    assert((await page.locator(".dice-roller-history-open").first().textContent()).includes(note));
    assert.equal(await page.locator(".dice-roller-history-open b").count(), 0);
    await page.locator(".dice-roller-history-open").first().click();
    assert((await page.locator(".dice-roller-detail-expression").textContent()).includes(note));

    await shortcut();
    await page.keyboard.press("Escape");
    await settledCount(6);
    await shortcut();
    await page.locator(".app-dialog__button--primary").click();
    await settledCount(7);
    assert.equal((await history())[0].note, "");

    // Exercise a real touch pointer sequence, including implicit capture.
    const cdp = await page.context().newCDPSession(page);
    const rect = await roll.boundingBox();
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }] });
    await dialog.waitFor({ state: "visible" });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await input.fill("觸控備註");
    await page.locator(".app-dialog__button--primary").tap();
    await settledCount(8);
    assert.equal((await history())[0].note, "觸控備註");

    await page.reload();
    await page.locator("#legal-ack-btn").click();
    await page.locator("#dice-roller-fab").click();
    await page.locator("#dice-roller-history-view").click();
    assert((await page.locator(".dice-roller-history-open").first().textContent()).includes("觸控備註"));
    assert((await page.locator(".dice-roller-history").textContent()).includes(note));
    assert.equal(await page.locator(".dice-roller-history-entry.is-legacy").textContent(), "1d6=3");
    assert((await page.locator(".dice-roller-history-open").last().textContent()).includes("舊紀錄：1d20=12"));
    assert.deepEqual(errors, []);
    await cdp.detach();
    console.log("Dice history: pointer/keyboard/touch notes, cancellation, focus and legacy reload passed.");
  } finally {
    await page.close();
  }
}

async function main() {
  for (const match of fs.readFileSync(path.join(__dirname, "index.html"), "utf8").matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (match[1].trim()) new vm.Script(match[1]);
  }
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
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", error => errors.push(String(error)));
    const url = `http://127.0.0.1:${server.address().port}/?analytics=owner`;
    await page.goto(url);
    await page.locator("#legal-ack-btn").click();
    if (process.argv.includes("--point-buy-only")) {
      await validatePointBuy(page);
      assert.deepEqual(errors, []);
      console.log("Point buy: under-budget reminder, cancellation, confirmed apply, autosave and last allocation restore passed.");
      return;
    }
    await validateDiceHistory(browser, url);
    if (process.argv.includes("--dice-only")) {
      assert.deepEqual(errors, []);
      return;
    }
    // A fresh context prevents point-buy autosave from changing ability-roll fixtures.
    const pointBuy = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    pointBuy.on("pageerror", error => errors.push(String(error)));
    try {
      await pointBuy.goto(url);
      await pointBuy.locator("#legal-ack-btn").click();
      await validatePointBuy(pointBuy);
      console.log("Point buy: reminder, cancellation, apply, autosave and restore passed.");
    } finally { await pointBuy.close(); }
    await page.locator("#utility-menu-toggle").click();
    await page.locator("#set-default-abilities").click();
    const choices = await page.locator(".ability-choice-actions button").evaluateAll(buttons => buttons.map(button => button.getBoundingClientRect().toJSON()));
    assert.equal(choices[0].top, choices[1].top);
    assert(choices[0].right < choices[1].left);
    await page.evaluate(() => {
      const original = crypto.getRandomValues.bind(crypto);
      const dice = [6,6,6,1, 5,5,5,1, 5,5,5,2, 4,4,4,1, 3,3,3,1, 1,1,1,1];
      crypto.getRandomValues = values => {
        values[0] = dice.shift() - 1;
        if (!dice.length) crypto.getRandomValues = original;
        return values;
      };
    });
    await page.locator("#ability-choice-roll").click();
    await page.locator("#dice-roller-close").focus();
    await page.keyboard.press("Shift+Tab");
    assert.equal(await page.evaluate(() => document.activeElement.id), "dice-roller-total-view", "focus stays in the modal");
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.id), "dice-roller-close");
    assert.equal(await page.evaluate(() => DiceRoller.isEnabled()), false, "explicit ability roll does not change the global dice preference");
    assert.equal(await page.locator(".dice-ability-results strong").count(), 0, "opening the modal does not reveal results");
    assert.equal(await page.evaluate(() => JSON.parse(dndStorage.getItem("dnd.diceRollHistory.v1") || "[]").length), 0);
    await page.waitForFunction(() => {
      const canvas = document.querySelector(".dice-ability-art canvas");
      return canvas && canvas.getContext("2d").getImageData(180, 180, 1, 1).data[3] > 0;
    });
    const still = await page.locator(".dice-ability-art canvas").evaluate(canvas => canvas.toDataURL());
    await page.waitForTimeout(250);
    assert.equal(await page.locator(".dice-ability-art canvas").evaluate(canvas => canvas.toDataURL()), still, "invitation image stays still");
    if (process.env.DND_ABILITY_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.DND_ABILITY_SCREENSHOT_DIR, "ability-invitation.png") });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.locator(".dice-ability-start").click();
    assert.equal(await page.locator(".dice-ability-art img").count(), 1);
    await page.waitForTimeout(900);
    assert.equal(await page.locator(".dice-ability-results strong").count(), 0, "animation does not reveal results early");
    assert.equal(await page.evaluate(() => JSON.parse(dndStorage.getItem("dnd.diceRollHistory.v1") || "[]").length), 0);
    await page.waitForFunction(() => document.querySelectorAll(".dice-ability-results strong").length === 6);
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.deepEqual(await page.locator(".dice-ability-results strong").allTextContents(), ["18", "15", "15", "12", "9", "3"]);
    const selects = page.locator(".dice-ability-assignments select");
    await selects.nth(0).selectOption("1");
    assert.deepEqual(await selects.nth(1).locator("option").allTextContents(), ["選數值", "18", "15", "12", "9", "3"]);
    await selects.nth(1).selectOption("2");
    assert.equal(await selects.nth(2).locator("option").filter({ hasText: /^15$/ }).count(), 0, "both copies of 15 are consumed");
    await selects.nth(0).selectOption("");
    assert.equal(await selects.nth(2).locator("option").filter({ hasText: /^15$/ }).count(), 1, "clearing releases one copy");
    await selects.nth(1).selectOption("");
    for (let i = 0; i < 6; i++) await selects.nth(i).selectOption(String(i));
    const bonuses = page.locator(".dice-ability-bonuses select");
    for (const [i, key] of ["str", "dex"].entries()) await bonuses.nth(i).selectOption(key);
    assert.equal(await bonuses.nth(1).locator('option[value="str"]').count(), 0, "background attributes must differ");
    await page.locator('input[name="ability-bonus-pattern"][value="2,1,0"]').check();
    assert.equal(await bonuses.nth(2).isHidden(), true, "+2/+1 hides the unused third background attribute");
    assert.equal(await bonuses.nth(2).isDisabled(), true, "the unused background attribute is not interactive");
    assert.equal(await page.locator(".dice-ability-apply").isEnabled(), true, "+2/+1 only requires two background attributes");
    assert.equal(await page.locator(".dice-ability-status").textContent(), "力量 20 · 敏捷 16 · 體質 15 · 智力 12 · 感知 9 · 魅力 3");
    await page.locator('input[name="ability-bonus-pattern"][value="1,1,1"]').check();
    assert.equal(await bonuses.nth(2).isVisible(), true, "+1/+1/+1 restores the third background attribute");
    assert.equal(await page.locator(".dice-ability-apply").isDisabled(), true, "+1/+1/+1 requires all three background attributes");
    await bonuses.nth(2).selectOption("con");
    assert.equal(await page.locator(".dice-ability-status").textContent(), "力量 19 · 敏捷 16 · 體質 16 · 智力 12 · 感知 9 · 魅力 3");
    await page.locator('input[name="ability-bonus-pattern"][value="2,1,0"]').check();
    assert.equal(await page.locator(".dice-ability-status").textContent(), "力量 20 · 敏捷 16 · 體質 15 · 智力 12 · 感知 9 · 魅力 3");
    for (const theme of ["light", "dark"]) {
      await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
      for (const [width, height] of [[390, 844], [320, 568], [1280, 800], [844, 390]]) {
        await page.setViewportSize({ width, height });
        const layout = await page.evaluate(() => {
          const stage = document.getElementById("dice-roller-stage");
          const resultRects = [...document.querySelectorAll(".dice-ability-results strong")].map(el => el.getBoundingClientRect().toJSON());
          return { overflow: stage.scrollWidth > stage.clientWidth, stageHeight: stage.clientHeight, contentHeight: stage.scrollHeight, resultRects };
        });
        assert.equal(layout.overflow, false, `${theme} ${width}: no horizontal scroll`);
        assert.equal(layout.resultRects[0].top, layout.resultRects[1].top);
        assert.equal(layout.resultRects[0].top, layout.resultRects[2].top);
        assert.equal(layout.resultRects[3].top, layout.resultRects[5].top);
        assert(layout.resultRects[3].top > layout.resultRects[0].top);
        if (process.env.DND_ABILITY_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.DND_ABILITY_SCREENSHOT_DIR, `ability-${theme}-${width}.png`) });
        if (height >= 800) assert(layout.contentHeight <= layout.stageHeight, `${theme} ${width}: form fits at normal height ${JSON.stringify(layout)}`);
        await page.locator(".dice-ability-apply").scrollIntoViewIfNeeded();
        const button = await page.locator(".dice-ability-apply").boundingBox();
        assert(button.y >= 0 && button.y + button.height <= height, "apply remains reachable on short screens");
        await page.locator("#dice-roller-stage").evaluate(el => { el.scrollTop = 0; });
      }
    }
    await page.locator("#dice-roller-history-view").click();
    assert.equal(await page.locator(".dice-roller-history-entry").count(), 6);
    assert.equal(await page.locator(".dice-ability-history-dice > span").count(), 24);
    assert.equal(await page.locator(".dice-ability-history-dice .is-dropped").count(), 6);
    const history = await page.evaluate(() => JSON.parse(dndStorage.getItem("dnd.diceRollHistory.v1")));
    for (const entry of history) {
      assert.equal(entry.values.length, 4);
      assert.equal(entry.values.filter(die => die.dropped).length, 1, "ties discard exactly one die");
      assert.equal(entry.total, entry.values.reduce((sum, die) => sum + die.value, 0) - Math.min(...entry.values.map(die => die.value)));
    }
    await page.locator(".dice-roller-history-open").first().click();
    assert.equal(await page.locator(".dice-roller-detail-result").count(), 4);
    assert.equal(await page.locator(".dice-roller-detail-result.is-dropped").count(), 1);
    assert.equal(await page.locator("#dice-roller-total-value").textContent(), "18");
    await page.locator(".dice-roller-detail-back").click();
    await page.locator("#dice-roller-total-view").click();
    assert.equal(await selects.nth(0).inputValue(), "0");
    assert.equal(await bonuses.nth(0).inputValue(), "str");
    await page.locator(".dice-ability-apply").click();
    await page.waitForTimeout(750);
    const expected = ["20", "16", "15", "12", "9", "3"];
    const sheetValues = () => page.evaluate(() => ["str", "dex", "con", "int", "wis", "cha"].map(key => document.getElementById(key).value));
    assert.deepEqual(await sheetValues(), expected);
    assert.notEqual(await page.evaluate(() => document.activeElement.id), "set-default-abilities", "focus does not return to the hidden utility-menu button");
    await page.reload();
    await page.waitForFunction(() => window.DiceRoller);
    await page.locator("#legal-ack-btn").click();
    assert.deepEqual(await sheetValues(), expected, "applied values survive autosave and reload");
    await page.evaluate(() => {
      const toggle = document.getElementById("dice-system-toggle");
      toggle.checked = true;
      toggle.dispatchEvent(new Event("change"));
    });
    await page.locator("#dice-roller-fab").click();
    await page.locator("#dice-roller-history-view").click();
    assert.equal(await page.locator(".dice-ability-history-dice .is-dropped").count(), 6, "discard markers survive reload");
    await page.locator("#dice-roller-close").click();
    await page.locator("#utility-menu-toggle").click();
    await page.locator("#set-default-abilities").click();
    await page.locator("#ability-choice-roll").click();
    const historyBeforeCancel = await page.evaluate(() => dndStorage.getItem("dnd.diceRollHistory.v1"));
    await page.locator(".dice-ability-start").click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1300);
    assert.equal(await page.evaluate(() => dndStorage.getItem("dnd.diceRollHistory.v1")), historyBeforeCancel, "closing during animation cancels the pending roll");
    assert.deepEqual(await sheetValues(), expected, "closing without applying preserves scores");
    await page.locator("#dice-roller-fab").click();
    assert.equal(await page.locator(".dice-ability-form").count(), 0);
    await page.locator('.dice-roller-die[data-die="6"]').click();
    await page.locator("#dice-roller-roll").click();
    await page.waitForTimeout(250);
    assert.equal(await page.locator(".dice-roller-result").count(), 1);
    await page.locator("#dice-roller-close").click();
    await page.locator("#utility-menu-toggle").click();
    await page.locator("#set-default-abilities").click();
    await page.locator("#ability-choice-roll").click();
    await page.evaluate(() => DiceRoller.rollExpressionsInModal([{ label: "測試", expression: "1d6+2" }]));
    assert.equal(await page.locator(".dice-ability-form").count(), 0);
    assert.equal(await page.locator(".dice-roller-controls").isVisible(), true);
    assert.equal(await page.locator(".dice-roller-automated-result").count(), 1);
    await page.locator("#dice-roller-close").click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => onboardingTour.start(2));
    await page.waitForFunction(() => onboardingTour.active && !onboardingTour.isTransitioning && onboardingTour.currentIndex === 2);
    assert.equal(await page.evaluate(() => onboardingTour.abilityMenuGuideActive), true, "tour starts with the ability menu guide");
    await page.locator("#set-default-abilities").click();
    await page.waitForFunction(() => !onboardingTour.isTransitioning && !onboardingTour.abilityMenuGuideActive);
    assert.equal(await page.locator("#ability-choice-modal").isVisible(), true, "ability choices open before selecting the roll option");
    await page.locator("#ability-choice-roll").click();
    await page.getByRole("button", { name: "留在導覽", exact: true }).click();
    assert.equal(await page.evaluate(() => onboardingTour.active), true);
    await page.locator("#ability-choice-roll").click();
    await page.getByRole("button", { name: "開始擲骰", exact: true }).click();
    await page.waitForFunction(() => !onboardingTour.active && document.querySelector(".dice-ability-form"));
    await page.locator("#dice-roller-close").click();
    await page.locator("#utility-menu-toggle").click();
    await page.locator("#help-quick-build-btn").click();
    assert.equal(await page.locator("#quick-build-title").isVisible(), true, "wizard remains available from help");
    assert.deepEqual(errors, []);
    console.log("Ability rolls: six drop-lowest results, duplicate allocation, both background patterns, history persistence, autosave, focus, normal/automated dice and responsive light/dark layouts passed.");
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });

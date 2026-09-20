"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const vm = require("node:vm");
const { chromium } = require("playwright");

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
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.locator("#legal-ack-btn").click();
    await page.locator("#utility-menu-toggle").click();
    for (const [width, height] of [[390, 844], [320, 568], [1280, 800]]) {
      await page.setViewportSize({ width, height });
      const layout = await page.evaluate(() => {
        const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
        return {
          row: rect(".utility-menu__settings-row"),
          settings: [...document.querySelectorAll(".utility-menu__setting")].map(el => el.getBoundingClientRect().toJSON()),
          switches: [...document.querySelectorAll(".utility-menu__switch")].map(el => el.getBoundingClientRect().toJSON()),
          help: [...document.querySelectorAll(".utility-menu__help button")].map(el => el.getBoundingClientRect().toJSON())
        };
      });
      assert.equal(layout.settings.length, 3);
      assert.equal(layout.switches.length, 3);
      assert(layout.settings[0].top < layout.settings[1].top);
      assert(layout.settings[1].top < layout.settings[2].top);
      layout.settings.forEach((setting, index) => {
        assert.equal(setting.left, layout.settings[0].left);
        assert.equal(layout.switches[index].right, setting.right);
      });
      assert.equal(layout.row.right, layout.settings[2].right);
      assert.equal(layout.help[0].top, layout.help[1].top);
      assert.equal(layout.help[2].top, layout.help[3].top);
      assert.equal(layout.help[0].left, layout.help[2].left);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    if (process.env.DND_ABILITY_SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.DND_ABILITY_SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(process.env.DND_ABILITY_SCREENSHOT_DIR, "menu.png") });
    }
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

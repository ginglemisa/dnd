"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require("playwright");

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
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", error => errors.push(String(error)));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
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
    console.log("Dice notes: cancellation before/after pointer release, subsequent mouse/keyboard rolls, Shift+Enter, focus, blank/text notes, touch, history details and reload compatibility passed.");
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });

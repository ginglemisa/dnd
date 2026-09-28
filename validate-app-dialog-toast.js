"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { chromium } = require("playwright");

const root = __dirname;

async function prepare(page) {
  await page.setContent("<!doctype html><html><body></body></html>");
  await page.addStyleTag({ path: path.join(root, "styles.css") });
  await page.addScriptTag({ path: path.join(root, "app-dialog.js") });
}

async function messages(page) {
  return page.locator("#app-toast .app-toast__message").allTextContents();
}

async function assertStackOrder(page) {
  const tops = await page.locator("#app-toast .app-toast").evaluateAll(toasts =>
    toasts.map(toast => toast.getBoundingClientRect().top)
  );
  assert(tops.every((top, index) => index === 0 || top < tops[index - 1]), `Newest toast must be above older toasts: ${tops}`);
}

async function swipe(page, index, direction, distance) {
  const box = await page.locator("#app-toast .app-toast__message").nth(index).boundingBox();
  assert(box, "Toast must be visible before swiping");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + direction * distance, y }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.DND_BROWSER_CHANNEL ? { channel: process.env.DND_BROWSER_CHANNEL } : {})
  });
  try {
    const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    desktop.on("pageerror", error => errors.push(String(error)));
    await prepare(desktop);
    await desktop.evaluate(() => {
      AppDialog.notify("第一則", { duration: 10000 });
      AppDialog.notify("第二則", { duration: 10000, variant: "dice-roll" });
      AppDialog.notify("第三則", { duration: 10000 });
    });
    await desktop.waitForTimeout(250);
    assert.deepEqual(await messages(desktop), ["第一則", "第二則", "第三則"]);
    await assertStackOrder(desktop);
    assert.equal(await desktop.locator('.app-toast[data-variant="dice-roll"]').count(), 1);
    assert.equal(await desktop.locator(".app-toast").evaluateAll(toasts =>
      toasts[1].getBoundingClientRect().left < toasts[2].getBoundingClientRect().left
    ), true, "Dice roll toast should keep its left alignment");
    await desktop.evaluate(() => AppDialog.notify("第四則", { duration: 10000 }));
    await desktop.waitForTimeout(250);
    assert.deepEqual(await messages(desktop), ["第二則", "第三則", "第四則"]);
    await assertStackOrder(desktop);
    await desktop.locator(".app-toast__close").nth(1).focus();
    await desktop.keyboard.press("Enter");
    assert.equal(await desktop.locator(".app-toast").last().evaluate(toast =>
      toast.getAnimations().some(animation => animation.effect.getKeyframes().some(frame => frame.translate))
    ), true, "Remaining toast should animate into the empty space");
    await desktop.waitForTimeout(250);
    assert.deepEqual(await messages(desktop), ["第二則", "第四則"]);
    assert.equal(await desktop.locator(".app-toast__close").last().evaluate(element => document.activeElement === element), true);
    await assertStackOrder(desktop);
    assert.deepEqual(errors, []);
    await desktop.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
    mobile.on("pageerror", error => errors.push(String(error)));
    await prepare(mobile);
    await mobile.evaluate(() => {
      AppDialog.notify("甲", { duration: 10000 });
      AppDialog.notify("乙", { duration: 10000 });
      AppDialog.notify("丙", { duration: 10000 });
    });
    await mobile.waitForTimeout(250);
    await swipe(mobile, 1, 1, 160);
    await mobile.waitForFunction(() => document.querySelectorAll("#app-toast .app-toast").length === 2);
    assert.equal(await mobile.locator(".app-toast").last().evaluate(toast =>
      toast.getAnimations().some(animation => animation.effect.getKeyframes().some(frame => frame.translate))
    ), true, "Toast above a swiped item should slide down");
    await mobile.waitForTimeout(250);
    assert.deepEqual(await messages(mobile), ["甲", "丙"]);
    await assertStackOrder(mobile);
    await swipe(mobile, 0, -1, 160);
    await mobile.waitForFunction(() => document.querySelectorAll("#app-toast .app-toast").length === 1);
    assert.deepEqual(await messages(mobile), ["丙"]);
    await swipe(mobile, 0, 1, 30);
    assert.deepEqual(await messages(mobile), ["丙"], "Short swipe must keep the toast");
    await mobile.evaluate(() => AppDialog.notify("短暫", { duration: 80 }));
    await mobile.getByText("短暫").waitFor({ state: "visible" });
    await mobile.waitForFunction(() => !Array.from(document.querySelectorAll(".app-toast__message")).some(el => el.textContent === "短暫"));
    assert.deepEqual(await messages(mobile), ["丙"], "Each toast keeps its own timeout");
    assert.deepEqual(errors, []);
    await mobile.close();

    const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: "reduce" });
    await prepare(reduced);
    await reduced.evaluate(() => {
      AppDialog.notify("低動態一", { duration: 10000 });
      AppDialog.notify("低動態二", { duration: 10000 });
    });
    await swipe(reduced, 0, 1, 160);
    assert.deepEqual(await messages(reduced), ["低動態二"]);
    await reduced.close();

    console.log("AppDialog toast stack, timeout, keyboard dismiss, and touch swipes passed.");
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

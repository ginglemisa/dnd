"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require("playwright");

async function main() {
  const root = __dirname;
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const file = path.resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
      if (error) return res.writeHead(404).end();
      res.end(data);
    });
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
    await page.check("#legal-dismiss");
    await page.click("#legal-close-btn");
    await page.selectOption("#class", "fighter");
    await page.selectOption("#mainHand", "長劍");
    await page.check("#offHandAsMain");
    await page.selectOption("#offHand", "標槍");

    assert.equal(await page.textContent("#offHandLabel"), "主手2");
    assert.equal(await page.locator("#offHand option[value='盾牌']").count(), 0);
    assert.equal(await page.locator("#main2ShieldOption").isVisible(), true);
    await page.check("#main2Shield");
    assert.equal(await page.inputValue("#ac-display"), "12");
    assert.equal(await page.locator("#equipment-loadout-summary-content").innerText().then(text => text.includes("主手2") && text.includes("盾牌")), true);

    await page.selectOption("#offHand", "巨劍");
    await page.getByRole("button", { name: "取消" }).click();
    assert.equal(await page.inputValue("#offHand"), "標槍");
    assert.equal(await page.isChecked("#main2Shield"), true);
    await page.selectOption("#offHand", "巨劍");
    await page.getByRole("button", { name: "繼續" }).click();
    assert.equal(await page.inputValue("#offHand"), "巨劍");
    assert.equal(await page.isChecked("#main2Shield"), false);
    assert.equal(await page.locator("#main2ShieldOption").isVisible(), false);

    await page.evaluate(() => applyStateObject({ class: "fighter", mainHand: "長劍", offHand: "標槍", offHandAsMain: true, main2Shield: true }));
    assert.equal(await page.isChecked("#main2Shield"), true);
    await page.addScriptTag({ path: path.join(root, "pdf-field-map.js") });
    assert.equal(await page.evaluate(() => buildPdfFieldPayload(collectStateObject()).AC1), "12");
    await page.evaluate(() => applyStateObject({ class: "fighter", mainHand: "巨劍", offHand: "標槍", offHandAsMain: true, main2Shield: true }));
    assert.equal(await page.isChecked("#main2Shield"), false);

    await page.uncheck("#offHandAsMain");
    await page.selectOption("#mainHand", "長劍");
    await page.selectOption("#offHand", "盾牌");
    assert.equal(await page.inputValue("#ac-display"), "12");
  } finally {
    await browser.close();
    server.close();
  }
  console.log("Main2 shield validation passed.");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

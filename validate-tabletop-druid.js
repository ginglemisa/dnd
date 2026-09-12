"use strict";

// Uses the host's existing Playwright installation, like validate-action-metadata.js.
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
      res.setHeader("Content-Type", { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" }[path.extname(file)] || "application/octet-stream");
      res.end(data);
    });
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.DND_BROWSER_CHANNEL ? { channel: process.env.DND_BROWSER_CHANNEL } : {}) });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on("pageerror", error => errors.push(String(error)));
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
    await page.waitForFunction(() => Boolean(window.TabletopDruid));
    await page.check("#legal-dismiss");
    await page.click("#legal-close-btn");
    await page.selectOption("#class", "druid");
    await page.selectOption("#level", "8");
    await page.selectOption("#race", "human");
    await page.selectOption("#druid-land", "arid");
    await page.evaluate(() => {
      for (const [id, value] of Object.entries({ str: "8", dex: "14", con: "14", int: "12", wis: "18", cha: "10", hp: "40" })) {
        const input = document.getElementById(id); input.value = value; input.dispatchEvent(new Event("input", { bubbles: true }));
      }
      fillSkills();
      TabletopMode.applyState({});
      TabletopMode.setMode("tabletop");
      TabletopMode.setPanel("overview");
    });
    const checks = await page.evaluate(() => {
      let checks = 0;
      const check = (value, message) => { if (!value) throw new Error(message); checks++; };
      const state = () => TabletopMode.collectState();
      const c = () => TabletopMode.getDruidContext();
      const run = (op, data) => TabletopMode.commitDruidOperation(op, data, c().token);
      const slot = level => c().slots.find(group => group.level === level)?.controls.find(control => !control.checked && !control.disabled)?.id;
      for (const item of DruidBeastForms) {
        const beast = BeastCatalog.get(item.key);
        check(Boolean(beast), `${item.key}: missing metadata`);
        check(Object.keys(beast.abilities).length === 6, `${item.key}: abilities`);
        check(Object.keys(beast.speeds).length > 0, `${item.key}: speeds`);
        for (const action of beast.actions) for (const damage of action.damage || []) {
          check(damage.expression ? DiceRoller.canRollExpression(damage.expression) : Number.isFinite(damage.fixed), `${item.key}: invalid damage`);
        }
      }
      check(!isDruidBeastAllowed(DruidBeastForms.find(f => f.key === "owl"), 7), "flight below 8");
      check(isDruidBeastAllowed(DruidBeastForms.find(f => f.key === "owl"), 8), "flight at 8");
      check(!isDruidBeastAllowed(DruidBeastForms.find(f => f.key === "brown_bear"), 4), "CR limit");
      check(run("known", { keys: ["wolf", "rat", "spider", "riding_horse", "giant_spider", "owl"] }).ok, "save known forms");
      const originalStr = document.getElementById("str").value;
      TabletopMode.setConcentrationSpellId("entangle");
      check(run("shape", { key: "wolf" }).ok, "shape");
      check(c().remaining === 2 && state().temporaryHp === 8, "wild shape cost and temp HP");
      check(state().concentrationSpellId === "entangle", "shape preserves concentration");
      check(document.getElementById("str").value === originalStr && document.getElementById("hp").value === "40", "canonical HP and scores unchanged");
      check(TabletopMode.getDruidEffectiveValue("str-mod") === "+2", "wolf strength");
      check(TabletopMode.getDruidEffectiveValue("skill-察覺", "4") === "+5", "higher beast perception");
      check(TabletopMode.getDruidEffectiveValue("skill-隱匿", "8") === "+8", "retained expertise");
      check(TabletopMode.getDruidEffectiveValue("save-con", "5") === "+4", "constitution save uses beast constitution and character proficiency");
      check(TabletopMode.getDruidEffectiveValue("save-wis", "7") === "+7", "mental save retained");
      check(TabletopMode.getDruidEffectiveValue("ac-display") === "12", "wolf AC");
      check(!run("companion", { method: "wild" }).ok && c().remaining === 2, "companion blocked while shaped");
      check(TabletopMode.getSpellCastOptions({ spellId: "cure-wounds" }).methods.length === 0, "spell slots blocked while shaped");
      check(run("aid").ok && c().remaining === 1 && state().druid.formKey === "wolf", "aid shares pool without changing shape");
      check(run("shape", { key: "rat", keepTemporaryHp: true }).ok && c().remaining === 0, "reshaping costs a use");
      check(state().temporaryHp === 8, "temp HP does not stack");
      check(!run("shape", { key: "wolf" }).ok && state().druid.formKey === "rat", "exhausted pool does not end form");
      const beforeInvalid = JSON.stringify(state());
      check(!run("resurge-shape", { slotId: "invalid" }).ok && JSON.stringify(state()) === beforeInvalid, "failed conversion is atomic");
      check(run("resurge-shape", { slotId: slot(2) }).ok && c().remaining === 1, "slot to wild shape");
      check(!run("resurge-shape", { slotId: slot(1) }).ok, "conversion requires exactly zero uses");
      check(run("end").ok && c().remaining === 1, "end without refund");
      check(run("companion", { method: "slot", slotId: slot(3) }).ok && c().remaining === 1 && state().druid.companion, "companion slot payment");
      const levelOne = slot(1);
      document.getElementById(levelOne).checked = true;
      check(run("resurge-slot").ok && !document.getElementById(levelOne).checked && c().remaining === 0, "wild to first level slot");
      TabletopMode.setBuiltInResourceSpent("druid-wild-shape", 2, 3);
      document.getElementById(levelOne).checked = true;
      check(!run("resurge-slot").ok && c().remaining === 1, "daily conversion limit");
      const spent = c().slots.flatMap(group => group.controls.filter(control => control.checked).map(control => control.id));
      const recoveryBefore = JSON.stringify(state());
      check(!run("recover", { slotIds: spent }).ok && JSON.stringify(state()) === recoveryBefore, "over-budget recovery rejected atomically");
      check(run("recover", { slotIds: [levelOne] }).ok && !document.getElementById(levelOne).checked, "recovery restores selected slot");
      check(c().remaining === 1, "natural recovery must not alter wild shape uses");
      check(!document.getElementById("druid-natural-recovery-used").checked, "recovery independent of free casting");
      const landSelect = Array.from(document.querySelectorAll('.spell-entry[data-source-key^="subclass-druid-"] select[id*="-spell-"]')).find(select => SpellCatalog.getSpell(select.value)?.level > 0);
      const landRow = landSelect.closest(".spell-entry");
      const entry = { spellId: landSelect.value, spellSelect: landSelect, sourceKey: landRow.dataset.sourceKey };
      const free = TabletopMode.getSpellCastOptions(entry).methods.find(method => method.id === "free");
      check(Boolean(free), "natural recovery free method available");
      check(TabletopMode.commitSpellCastResource(entry, { method: "free", resourceId: free.resourceId }).ok, "free cast");
      check(document.getElementById("druid-natural-recovery-used").checked, "free cast updates shared canonical control");
      check(!TabletopMode.getSpellCastOptions(entry).methods.some(method => method.id === "free"), "shared free use exhausted");
      const token = c().token;
      TabletopMode.setBuiltInResourceSpent("druid-wild-shape", 0, 3);
      check(!TabletopMode.commitDruidOperation("companion", { method: "wild" }, token).ok && c().remaining === 3, "stale confirmation rejected");
      const beforeRest = JSON.stringify(state());
      check(!run("short-rest").ok && !run("long-rest").ok && JSON.stringify(state()) === beforeRest, "no class-specific rest mechanism");
      TabletopMode.setBuiltInResourceSpent("druid-natural-recovery-spell-slots", 0, 1);
      check(document.getElementById("druid-natural-recovery-used").checked && c().remaining === 3, "manual recovery reset does not alter other resources");
      check(run("shape", { key: "giant_spider" }).ok, "giant spider shape");
      check(run("beast-use", { actionId: "web" }).ok, "web use");
      check(!run("beast-use", { actionId: "web" }).ok, "web recharge gate");
      check(run("end").ok && run("shape", { key: "giant_spider" }).ok, "reenter same beast");
      check(!run("beast-use", { actionId: "web" }).ok, "reshaping cannot reset beast resource");
      check(run("beast-recharge", { actionId: "web" }).ok, "manual recharge");
      const saved = state();
      TabletopMode.applyState({ ...saved, activeConditions: ["paralyzed"] });
      check(!TabletopMode.getDruidForm() && !state().druid.formKey, "indirect incapacitation ends shape");
      TabletopMode.applyState(saved);
      check(TabletopMode.getDruidForm()?.key === "giant_spider", "JSON state restore");
      const share = collectShareState();
      check(share.druid.knownForms.length === 6 && !share.druid.formKey && !share.druid.beastUsed, "share choices only, consistent with other combat state");
      return checks;
    });
    console.log(`Druid: ${checks} metadata, mechanics and state assertions passed.`);

    // Exercise dialogs through actual UI: cancel, known forms, transform, alternative payment.
    await page.evaluate(() => {
      TabletopMode.applyState({});
      TabletopMode.setPanel("overview");
    });
    await page.locator("#tabletop-druid-overview").getByRole("button", { name: "荒野形態", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "帶入推薦四種" }).click();
    const wolfCheckbox = dialog.getByRole("checkbox", { name: "已知形態：狼", exact: true });
    assert.equal(await wolfCheckbox.isChecked(), true);
    await dialog.getByRole("button", { name: "狼", exact: true }).click();
    await dialog.locator(".druid-beast-tooltip").getByText(/Wolf/).waitFor();
    assert.doesNotMatch(await dialog.locator(".druid-beast-tooltip").innerText(), /\[object Object\]/);
    assert.match(await dialog.locator(".druid-beast-tooltip").innerText(), /感知\+5, 隱匿\+4/);
    assert.equal(await wolfCheckbox.isChecked(), true, "tooltip must not toggle known form");
    await page.keyboard.press("Escape");
    assert.equal(await dialog.isVisible(), true, "Escape closes tooltip before dialog");
    assert.equal(await dialog.locator(".druid-beast-tooltip").isVisible(), false);
    await dialog.getByRole("button", { name: "儲存已知形態" }).click();
    await dialog.getByLabel("選擇已知形態").selectOption("wolf");
    await dialog.getByRole("button", { name: "取消", exact: true }).click();
    assert.equal(await page.evaluate(() => TabletopMode.getDruidContext().remaining), 3, "cancel does not spend");
    await page.evaluate(() => { TabletopMode.setPanel("actions"); });
    await page.click("#tabletop-action-tab-action");
    await page.locator("#tabletop-druid-actions").getByRole("button", { name: "荒野形態", exact: true }).click();
    await dialog.getByLabel("選擇已知形態").selectOption("wolf");
    await dialog.getByRole("button", { name: "消耗 1 次並變形" }).click();
    await page.waitForFunction(() => TabletopMode.getDruidForm()?.key === "wolf");
    assert.equal(await page.locator("#tabletop-ac").innerText(), "12");
    await page.locator("#tabletop-weapon-summary").getByText("狼的攻擊", { exact: true }).waitFor({ timeout: 3000 });
    await page.locator('#tabletop-action-panel-action [data-action-option-key^="druid-beast-wolf-"]').first().waitFor();
    await page.locator("#tabletop-druid-actions").getByRole("button", { name: "更換形態", exact: true }).click();
    await dialog.getByLabel("選擇已知形態").selectOption("rat");
    await dialog.getByRole("button", { name: "消耗 1 次並變形" }).click();
    await page.locator("#tabletop-weapon-summary").getByText("老鼠的攻擊", { exact: true }).waitFor({ timeout: 3000 });
    await page.locator('#tabletop-action-panel-action [data-action-option-key^="druid-beast-rat-"]').first().waitFor();
    assert.equal(await page.locator('#tabletop-action-panel-action [data-action-option-key^="druid-beast-wolf-"]').count(), 0, "changing shape removes previous beast actions without switching tabs");
    await page.click("#tabletop-action-tab-bonus");
    await page.locator('[data-action-option-key="dynamic-bonus-class-3u4zp1"]').click();
    const shapeDescription = page.locator("#tabletop-action-panel-bonus .tabletop-action-description");
    assert.equal(await shapeDescription.locator("ul").count(), 2, "shape rules have two real bullet lists");
    assert.equal(await shapeDescription.locator("li").count(), 7);
    assert.equal(await shapeDescription.getByRole("button", { name: "變形所選形態", exact: true }).count(), 1);
    assert.doesNotMatch(await shapeDescription.innerText(), /最大挑戰等級|推薦：|查看其他動物/);
    if (process.env.DND_SCREENSHOT_DIR) {
      await shapeDescription.scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(process.env.DND_SCREENSHOT_DIR, "druid-shape-description.png") });
    }
    await page.locator("#tabletop-druid-actions").getByRole("button", { name: "解除形態", exact: true }).click();
    await dialog.getByRole("button", { name: "確認使用", exact: true }).click();
    await page.locator("#tabletop-weapon-summary .druid-beast-attacks").waitFor({ state: "detached", timeout: 3000 });
    await page.locator('#tabletop-action-panel-bonus [data-action-option-key="druid-end-wild-shape"]').waitFor({ state: "detached", timeout: 3000 });
    assert.equal(await shapeDescription.getByRole("button", { name: "變形所選形態", exact: true }).count(), 1, "state refresh preserves the selected action");
    await page.click("#tabletop-action-tab-action");
    await page.getByRole("button", { name: "荒野夥伴", exact: false }).first().click();
    await page.locator(".tabletop-action-description:visible").getByRole("button", { name: "荒野夥伴", exact: true }).click();
    await dialog.getByLabel("消耗方式").selectOption("slot");
    await dialog.getByRole("button", { name: "召喚荒野夥伴" }).click();
    assert.equal(await page.evaluate(() => TabletopMode.collectState().druid.companion), true);
    await page.evaluate(() => { TabletopMode.setPanel("resources"); });
    const recoveryRow = page.locator('[data-resource-key="druid-natural-recovery-spell-slots"]');
    const recoveryButton = recoveryRow.getByRole("button", { name: "自然恢復", exact: true });
    const recoveryCheckbox = recoveryRow.getByRole("checkbox");
    const wildBeforeRecovery = await page.evaluate(() => TabletopMode.getDruidContext().remaining);
    assert.equal(await recoveryButton.isEnabled(), true);
    assert.equal(await page.getByRole("button", { name: /德魯伊.*休.*結算/ }).count(), 0);
    await recoveryCheckbox.check();
    assert.equal(await recoveryButton.isDisabled(), true);
    await recoveryCheckbox.uncheck();
    await recoveryButton.click();
    await dialog.getByRole("checkbox").first().check();
    await dialog.getByRole("button", { name: "恢復所選法術位" }).click();
    assert.equal(await recoveryCheckbox.isChecked(), true, "using recovery checks resource");
    assert.equal(await recoveryButton.isDisabled(), true);
    assert.equal(await page.evaluate(() => TabletopMode.getDruidContext().remaining), wildBeforeRecovery, "recovery does not affect wild shape");
    await recoveryCheckbox.uncheck();
    assert.equal(await recoveryButton.isEnabled(), true, "manual reset enables recovery");
    await page.evaluate(() => TabletopMode.setBuiltInResourceSpent("druid-natural-recovery-spell-slots", 1, 1));
    await page.waitForFunction(() => document.querySelector('.druid-natural-recovery button')?.disabled === true);
    assert.equal(await recoveryButton.isDisabled(), true);
    await page.evaluate(() => TabletopMode.setBuiltInResourceSpent("druid-natural-recovery-spell-slots", 0, 1));
    await page.waitForFunction(() => document.querySelector('.druid-natural-recovery button')?.disabled === false);
    assert.equal(await recoveryButton.isEnabled(), true, "shared resource API can reset recovery without a class rest system");
    if (process.env.DND_SCREENSHOT_DIR) {
      await recoveryRow.scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(process.env.DND_SCREENSHOT_DIR, "druid-recovery.png") });
    }

    const flameModes = await page.evaluate(() => {
      const select = document.querySelector('#cantrips-area .spell-entry:not([data-spell-source]) select[id*="-spell-"]');
      const row = select.closest(".spell-entry");
      const classSelect = row.querySelector('select[id*="-class-"]');
      classSelect.value = "druid"; classSelect.dispatchEvent(new Event("change", { bubbles: true }));
      select.value = "produce-flame"; select.dispatchEvent(new Event("change", { bubbles: true }));
      return ["action", "bonus", "reaction"].map(mode => ActionPanel.getTabletopOptions(mode).filter(option => option.spellId === "produce-flame").length);
    });
    assert.deepEqual(flameModes, [1, 1, 0], "produce flame appears in special and bonus, once per source");
    await page.evaluate(() => {
      TabletopMode.commitDruidOperation("shape", { key: "wolf" });
      saveAllFields();
    });
    await page.reload();
    await page.waitForFunction(() => TabletopMode.getDruidForm()?.key === "wolf");
    assert.equal(await page.evaluate(() => TabletopMode.collectState().druid.companion), true, "autosave restores companion");
    await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("actions"); window.scrollTo(0, 0); });
    if (process.env.DND_SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.DND_SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(process.env.DND_SCREENSHOT_DIR, "druid-desktop.png") });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "mobile overflow");
    if (process.env.DND_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.DND_SCREENSHOT_DIR, "druid-mobile.png") });
    await page.locator("#tabletop-druid-actions").getByRole("button", { name: "已知形態", exact: true }).click();
    await dialog.getByRole("button", { name: "狼", exact: true }).click();
    const tooltip = dialog.locator(".druid-beast-tooltip");
    await tooltip.waitFor({ state: "visible" });
    const bounds = await tooltip.boundingBox();
    assert(bounds.x >= 0 && bounds.x + bounds.width <= 390 && bounds.y >= 0 && bounds.y + bounds.height <= 844, "mobile tooltip stays within viewport");
    if (process.env.DND_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.DND_SCREENSHOT_DIR, "druid-tooltip-mobile.png") });
    await tooltip.getByRole("button", { name: "關閉野獸資料" }).click();
    await dialog.getByRole("button", { name: "取消", exact: true }).click();
    assert.deepEqual(errors, [], "browser runtime errors");
    console.log("Druid dialogs, cancellation, alternate payment, autosave and responsive layout passed.");
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });

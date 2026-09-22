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
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on("pageerror", error => errors.push(String(error)));
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
    await page.waitForFunction(() => Boolean(window.TabletopResources));
    await page.check("#legal-dismiss");
    await page.click("#legal-close-btn");
    const count = await page.evaluate(() => {
      let checks = 0;
      const check = (value, label) => { if (!value) throw new Error(label); checks++; };
      const field = (id, value) => {
        const input = document.getElementById(id);
        input.value = String(value);
        input.dispatchEvent(new Event(input.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
      };
      const state = () => TabletopMode.collectState();
      const context = () => TabletopMode.getRestContext();
      const rest = (kind, choices = {}) => TabletopMode.commitRest(kind, choices, context().token);
      const prepare = (className, level = 8, race = "human") => {
        field("class", className); field("level", level); field("race", race);
        for (const [id, value] of Object.entries({ con: 14, wis: 16, cha: 18, hp: 0 })) field(id, value);
        TabletopMode.applyState({});
      };
      const spendSlots = () => TabletopMode.getCanonicalSpellSlotGroups().forEach(group => group.controls.forEach(control => { document.getElementById(control.id).checked = true; }));
      const shortCases = [
        ["barbarian", 1, "barbarian-rage", 2, 1], ["barbarian", 8, "barbarian-rage", 4, 3],
        ["bard", 4, "bard-inspiration", 4, 4], ["bard", 5, "bard-inspiration", 4, 0],
        ["cleric", 8, "cleric-channel-divinity", 3, 2], ["druid", 8, "druid-wild-shape", 3, 2],
        ["fighter", 8, "fighter-second-wind", 3, 2], ["fighter", 2, "fighter-action-surge", 1, 0],
        ["monk", 8, "monk-focus-points", 8, 0], ["paladin", 8, "paladin-channel-divinity", 2, 1],
        ["sorcerer", 8, "sorcerer-sorcery-points", 8, 8], ["warlock", 8, "warlock-magical-cunning", 1, 1],
        ["wizard", 8, "wizard-arcane-recovery", 1, 1]
      ];
      for (const [className, level, key, maximum, expected] of shortCases) {
        prepare(className, level);
        TabletopMode.setBuiltInResourceSpent(key, maximum, maximum);
        check(rest("shortRest").ok, `${key}: short rest at 0 HP`);
        check(TabletopMode.getBuiltInResourceSpent(key) === expected, `${key}: short recovery`);
        check(document.getElementById("hp").value === "0", "short rest does not heal automatically");
      }
      for (const className of ["barbarian", "bard", "cleric", "druid", "fighter", "monk", "paladin", "ranger", "rogue", "sorcerer", "warlock", "wizard"]) {
        prepare(className);
        const specs = context().specs.filter(spec => spec.target.type === "builtIn");
        specs.forEach(spec => TabletopMode.setBuiltInResourceSpent(spec.key, spec.maximum, spec.maximum));
        spendSlots(); field("lifedicen", 0);
        check(rest("longRest").ok, `${className}: long rest`);
        check(specs.every(spec => TabletopMode.getBuiltInResourceSpent(spec.key) === 0), `${className}: all built-in pools refilled`);
        check(context().slots.every(group => group.controls.every(control => !control.checked)), `${className}: slots refilled`);
        check(context().hitDice === 8 && context().hp === context().maximumHp, `${className}: HP and all dice restored`);
        check(document.getElementById("heroic-inspiration").checked, "human inspiration granted");
      }
      for (const className of ["wizard", "warlock"]) {
        prepare(className); spendSlots();
        const slots = context().slots.flatMap(group => group.controls);
        check(rest("shortRest").ok, `${className}: short slots`);
        check(slots.every(slot => document.getElementById(slot.id).checked === (className === "wizard")), "only pact slots recover automatically");
      }
      prepare("ranger");
      document.getElementById("ranger-hunters-prey-horde-breaker").checked = true;
      document.getElementById("ranger-defensive-tactics-multiattack-defense").checked = true;
      const prepared = Array.from(document.querySelectorAll('.spell-entry select[id*="-spell-"]'), control => control.value);
      check(rest("shortRest").ok && rest("longRest").ok, "ranger rests complete");
      check(document.getElementById("ranger-hunters-prey-horde-breaker").checked
        && document.getElementById("ranger-defensive-tactics-multiattack-defense").checked, "rest preserves hunter choices");
      check(JSON.stringify(Array.from(document.querySelectorAll('.spell-entry select[id*="-spell-"]'), control => control.value)) === JSON.stringify(prepared), "rest preserves prepared spell selections");
      prepare("fighter");
      TabletopMode.applyState({ activeConditions: ["unconscious", "poisoned"], exhaustionLevel: 1 });
      const conditions = JSON.stringify(state().activeConditions);
      check(TabletopMode.spendHitDice({ manualHealing: 1, preserveConditions: true }).ok
        && JSON.stringify(state().activeConditions) === conditions, "rest hit dice leave conditions to player at zero HP");
      field("hp", 0);
      const conditionsAtZero = JSON.stringify(state().activeConditions);
      check(rest("longRest").ok && context().hp === context().maximumHp, "long rest has no initial HP restriction");
      check(JSON.stringify(state().activeConditions) === conditionsAtZero && state().exhaustionLevel === 0, "long rest only changes exhaustion among conditions");
      for (const [race, lineageId, lineage] of [
        ["dragonborn"], ["dwarf"], ["goliath", "goliath-ancestry", "cloud"], ["orc"], ["halfling"],
        ["elf", "elf-lineage", "drow"], ["elf", "elf-lineage", "high_elf"], ["elf", "elf-lineage", "wood_elf"],
        ["gnome", "gnome-lineage", "forest_gnome"], ["gnome", "gnome-lineage", "rock_gnome"],
        ["tiefling", "tiefling-legacy", "abyssal"], ["tiefling", "tiefling-legacy", "chthonic"], ["tiefling", "tiefling-legacy", "infernal"]
      ]) {
        prepare("fighter", 8, race);
        if (lineageId) field(lineageId, lineage);
        const specs = context().specs;
        specs.filter(spec => spec.target.type === "builtIn").forEach(spec => TabletopMode.setBuiltInResourceSpent(spec.key, spec.maximum, spec.maximum));
        const ids = specs.flatMap(spec => spec.target.ids || []);
        if (["elf", "tiefling"].includes(race)) check(ids.length === 2, `${race}/${lineage}: both free spell controls found`);
        if (race === "gnome" && lineage === "forest_gnome") check(ids.length === 3, "forest gnome proficiency free uses found");
        if (["dragonborn", "goliath"].includes(race)) check(ids.length === 3, `${race}: canonical proficiency checks found`);
        ids.forEach(id => { document.getElementById(id).checked = true; });
        document.getElementById("heroic-inspiration").checked = true;
        check(rest("shortRest").ok, `${race}/${lineage}: short`);
        check(ids.every(id => document.getElementById(id).checked), `${race}: daily checkboxes not reset on short`);
        if (race === "orc") check(TabletopMode.getBuiltInResourceSpent("orc-adrenaline-rush") === 0 && TabletopMode.getBuiltInResourceSpent("orc-relentless-endurance") === 1, "orc separate recovery");
        check(rest("longRest").ok && ids.every(id => !document.getElementById(id).checked), `${race}/${lineage}: long canonical recovery`);
        check(document.getElementById("heroic-inspiration").checked, "non-human keeps existing inspiration");
      }
      for (const [className, expected] of [["paladin", 2], ["ranger", 3], ["warlock", 1], ["fighter", 1]]) {
        prepare(className, 8, "halfling");
        if (className === "warlock") {
          const index = eldritchInvocations.findIndex(item => item.name === "深海饋贈");
          const control = document.getElementById(getInvocationCheckboxId(index));
          control.checked = true; control.dispatchEvent(new Event("change", { bubbles: true }));
        }
        if (className === "fighter") {
          field("feat-0", "魔法學徒");
          field("feat-0-magic-initiate-class", "wizard");
          field("feat-0-magic-initiate-level-1", "magic-missile");
        }
        const ids = context().specs.filter(spec => spec.key.startsWith("free-")).flatMap(spec => spec.target.ids);
        check(ids.length === expected, `${className}: free cast source controls found`);
        ids.forEach(id => { document.getElementById(id).checked = true; });
        check(rest("shortRest").ok && ids.every(id => document.getElementById(id).checked), `${className}: free casts retained after short rest`);
        check(rest("longRest").ok && ids.every(id => !document.getElementById(id).checked), `${className}: free casts restored after long rest`);
        if (className === "fighter") field("feat-0", "警覺");
      }
      for (const [className, key] of [["wizard", "wizard-arcane-recovery"], ["druid", "druid-natural-recovery-spell-slots"]]) {
        prepare(className); if (className === "druid") field("druid-land", "arid");
        spendSlots();
        const all = context().slots.flatMap(group => group.controls.map(control => control.id));
        const before = JSON.stringify(collectStateObject());
        check(!rest("shortRest", { recovery: { [key]: all } }).ok, "reject over-budget recovery");
        check(JSON.stringify(collectStateObject()) === before, "failed recovery is atomic");
        const chosen = context().slots.find(group => group.level === 2).controls[0].id;
        check(rest("shortRest", { recovery: { [key]: [chosen] } }).ok, "selected recovery succeeds");
        check(!document.getElementById(chosen).checked && TabletopMode.getBuiltInResourceSpent(key) === 1, "recovery consumes daily use");
        check(!rest("shortRest", { recovery: { [key]: [all[0]] } }).ok, "cannot reuse recovery before long rest");
        if (className === "druid") check(!document.getElementById("druid-natural-recovery-used").checked, "druid free cast independent");
      }
      prepare("sorcerer");
      TabletopMode.setBuiltInResourceSpent("sorcerer-sorcery-points", 7, 8);
      check(rest("shortRest", { recovery: { "sorcerer-sorcerous-restoration": true } }).ok, "sorcerous restoration selected");
      check(TabletopMode.getBuiltInResourceSpent("sorcerer-sorcery-points") === 3, "restoration restores four points");
      check(TabletopMode.getBuiltInResourceSpent("sorcerer-sorcerous-restoration") === 1, "restoration daily use spent");
      const stale = context().token;
      field("hp", 2);
      const unchanged = JSON.stringify(collectStateObject());
      check(!TabletopMode.commitRest("longRest", {}, stale).ok && JSON.stringify(collectStateObject()) === unchanged, "stale rest rejected without mutations");

      prepare("druid"); field("druid-land", "arid"); field("hp", 20);
      TabletopMode.applyState({ temporaryHp: 12, exhaustionLevel: 3, activeConditions: ["poisoned"], concentrationSpellId: "entangle",
        druid: { knownForms: ["wolf"], formKey: "wolf", companion: true, beastUsed: ["octopus:ink"] },
        customResources: [{ id: "custom-test", label: "手動", current: 1, max: 5, recoveryNote: "長休全回" }] });
      document.getElementById("druid-natural-recovery-used").checked = true;
      const stateBefore = state();
      check(stateBefore.druid.formKey === "wolf" && stateBefore.concentrationSpellId === "entangle", "druid rest starts in active form with concentration");
      check(rest("longRest").ok, "druid long rest");
      check(!state().druid.formKey && !state().druid.companion, "long rest ends form and companion");
      check(state().druid.knownForms[0] === "wolf" && state().druid.beastUsed[0] === "octopus:ink", "known forms and daily beast tracking retained");
      check(state().temporaryHp === 0 && state().exhaustionLevel === 2, "temporary HP cleared and exhaustion reduced once");
      check(state().concentrationSpellId === "entangle" && JSON.stringify(state().activeConditions) === JSON.stringify(stateBefore.activeConditions), "concentration and conditions retained");
      check(state().customResources[0].current === 1 && !document.getElementById("druid-natural-recovery-used").checked, "custom note not parsed; canonical free use restored");
      check(document.getElementById("druid-land").value === "arid", "land selection retained");
      const savedRest = JSON.parse(JSON.stringify(collectStateObject()));
      const share = collectShareState();
      check(!share.builtInResourceUsage && !share.temporaryHp && !share.druid.formKey, "share retains existing combat-state omission policy");
      TabletopMode.applyState({ temporaryHp: 90, exhaustionLevel: 5 });
      applyStateObject(savedRest);
      check(state().temporaryHp === 0 && state().exhaustionLevel === 2 && !state().druid.companion, "JSON restores rested state");

      prepare("fighter", 8, "orc"); field("feat-0", "最佳旅伴");
      TabletopMode.applyState({ temporaryHp: 20 });
      check(rest("shortRest").ok && state().temporaryHp === 20, "unselected companion keeps short-rest temporary HP");
      check(rest("shortRest", { companion: { ability: "wis", amount: 11 } }).ok && state().temporaryHp === 11, "companion replaces instead of stacking");
      check(rest("longRest", { companion: { ability: "cha", amount: 12 } }).ok && state().temporaryHp === 12, "companion applies after long-rest clear");
      const captured = JSON.stringify(collectStateObject());
      check(!rest("longRest", { companion: { ability: "str", amount: 9 } }).ok && JSON.stringify(collectStateObject()) === captured, "invalid companion is atomic");
      field("feat-0", "警覺");
      check(!rest("shortRest", { companion: { ability: "wis", amount: 11 } }).ok, "companion requires selected feat");
      field("hp", 0); field("lifedicen", 2);
      const first = TabletopMode.spendHitDice({ manualHealing: 1 });
      check(first.ok && context().hp === 1 && context().hitDice === 1, "one die at a time, no starting HP restriction");
      check(TabletopMode.spendHitDice({ manualHealing: 999 }).ok && context().hp === context().maximumHp && context().hitDice === 0, "healing capped at maximum");
      check(!TabletopMode.spendHitDice({ manualHealing: 3 }).ok, "full HP or no dice does not consume more");
      const originalRoller = window.DiceRoller;
      let rolls = 0;
      window.DiceRoller = { isEnabled: () => true, rollExpression: () => { rolls++; return { total: -3, expression: "1d10-4" }; } };
      field("hp", 1); field("lifedicen", 3);
      check(TabletopMode.spendHitDice().ok && context().hp === 2 && context().hitDice === 2 && rolls === 1, "minimum one HP and exactly one roll");
      window.DiceRoller = originalRoller;
      window.restTestField = field;
      return checks;
    });
    console.log(`Rest mechanics: ${count} assertions passed.`);

    await page.evaluate(() => {
      restTestField("class", "wizard"); restTestField("race", "elf"); restTestField("elf-lineage", "high_elf");
      restTestField("feat-0", "最佳旅伴"); restTestField("hp", 2); restTestField("lifedicen", 3);
      TabletopMode.applyState({ exhaustionLevel: 2, temporaryHp: 9 });
      TabletopMode.setMode("tabletop"); TabletopMode.setPanel("resources");
      TabletopMode.getCanonicalSpellSlotGroups().forEach(group => group.controls.forEach(control => { document.getElementById(control.id).checked = true; }));
    });
    const dialog = page.getByRole("dialog");
    const beforeCancel = await page.evaluate(() => JSON.stringify(collectStateObject()));
    await page.locator('[data-rest="longRest"]').click();
    assert.match(await dialog.innerText(), /傳思 4 小時/);
    assert.match(await dialog.innerText(), /16 小時/);
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => JSON.stringify(collectStateObject())), beforeCancel, "cancel leaves state untouched");
    assert.equal(await page.locator('[data-rest="longRest"]').evaluate(el => el === document.activeElement), true, "focus returns after cancel");
    await page.locator('[data-rest="shortRest"]').click();
    await dialog.getByLabel("套用最佳旅伴").check();
    await dialog.getByRole("button", { name: "完成短休", exact: true }).click();
    assert.match(await dialog.locator("#tabletop-rest-error").innerText(), /請選擇屬性/);
    await dialog.getByLabel("此專長提升的屬性").selectOption("wis");
    await dialog.getByLabel("2 環法術位 1", { exact: true }).check();
    await dialog.getByRole("button", { name: "完成短休", exact: true }).click();
    await page.getByRole("heading", { name: "短休：生命骰", exact: true }).waitFor();
    await dialog.getByLabel("本顆回血（骰值＋體質調整值，至少 1）").fill("3");
    await dialog.getByRole("button", { name: "使用 1 顆並回血", exact: true }).click();
    assert.equal(await page.locator("#hp").inputValue(), "5");
    assert.equal(await page.locator("#lifedicen").inputValue(), "2");
    await dialog.getByRole("button", { name: "結束", exact: true }).click();
    assert.equal(await page.evaluate(() => TabletopMode.getBuiltInResourceSpent("wizard-arcane-recovery")), 1);
    assert.equal(await page.evaluate(() => TabletopMode.collectState().temporaryHp), 11);
    // Wait for the existing autosave rather than forcing a save in the test.
    await page.waitForFunction(() => JSON.parse(dndStorage.getItem(AUTO_SAVE_KEY) || "{}").hp === "5");
    await page.reload();
    await page.waitForFunction(() => window.TabletopMode?.getBuiltInResourceSpent("wizard-arcane-recovery") === 1);
    assert.equal(await page.locator("#lifedicen").inputValue(), "2", "rest dice survive autosave");
    assert.equal(await page.evaluate(() => TabletopMode.collectState().temporaryHp), 11, "companion survives autosave");
    await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("resources"); });
    await page.setViewportSize({ width: 360, height: 800 });
    await page.locator('[data-rest="longRest"]').click();
    await dialog.getByLabel("套用最佳旅伴").check();
    await dialog.getByLabel("此專長提升的屬性").selectOption("cha");
    await dialog.getByLabel("臨時 HP（等級＋屬性調整值，可修改）").fill("14");
    const bounds = await dialog.boundingBox();
    assert(bounds.x >= 0 && bounds.x + bounds.width <= 360 && bounds.y >= 0 && bounds.y + bounds.height <= 800, "mobile dialog fits");
    await dialog.getByRole("button", { name: "完成長休", exact: true }).click();
    assert.equal(await page.evaluate(() => TabletopMode.collectState().temporaryHp), 14);
    assert.equal(await page.evaluate(() => TabletopMode.collectState().exhaustionLevel), 1);
    assert.equal(await page.evaluate(() => TabletopMode.getBuiltInResourceSpent("wizard-arcane-recovery")), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "mobile resources do not overflow");
    assert.equal(await page.locator('[data-rest="longRest"]').evaluate(el => el === document.activeElement), true, "focus survives resource redraw");
    await page.evaluate(() => {
      const toggle = document.getElementById("dice-system-toggle"); toggle.checked = true;
      toggle.dispatchEvent(new Event("change", { bubbles: true }));
      for (const [id, value] of [["hp", "1"], ["lifedicen", "2"]]) {
        const control = document.getElementById(id); control.value = value;
        control.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    await page.locator('[data-rest="shortRest"]').click();
    await dialog.getByRole("button", { name: "完成短休", exact: true }).click();
    await page.getByRole("heading", { name: "短休：生命骰", exact: true }).waitFor();
    await dialog.getByRole("button", { name: "擲 1 顆並回血", exact: true }).click();
    assert.equal(await page.locator("#lifedicen").inputValue(), "1", "real DiceRoller consumes exactly one die");
    assert(Number(await page.locator("#hp").inputValue()) > 1, "real DiceRoller heals");
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#lifedicen").inputValue(), "1", "closing after a roll retains committed die");
    assert.deepEqual(errors, [], "browser runtime errors");
    console.log("Rest dialogs, optional recovery, cancellation, manual dice, autosave and narrow layout passed.");
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });

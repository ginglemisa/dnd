"use strict";

// Uses the host's existing Playwright installation, like validate-action-metadata.js.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require("playwright");

// The same browser harness covers persistent effects on normal and beast stats.
async function checkPersistentSpells(page) {
  await page.evaluate(() => {
    TabletopMode.applyState({});
    TabletopMode.setPanel("overview");
    document.getElementById("armor").value = "";
    document.getElementById("dex").value = "14";
    document.getElementById("ac-display").value = "12";
    document.getElementById("speed-display").value = "30";
    document.querySelectorAll('[id^="spellslot"] input[type="checkbox"]').forEach(input => { input.checked = false; });
    TabletopMode.setConcentrationSpellId("entangle");
  });
  const openCast = async spellId => {
    await page.evaluate(spellId => {
      void TabletopSpells.showSpellDetail({ spellId, spell: SpellCatalog.getSpell(spellId), source: "職業", sourceLabel: "職業" });
    }, spellId);
    await page.getByRole("dialog").getByRole("button", { name: "施法", exact: true }).click();
    await page.getByRole("dialog").getByText(/目標$/, { exact: false }).first().waitFor();
  };
  const spent = () => page.evaluate(() => document.querySelectorAll('[id^="spellslot"] input:checked').length);
  for (const id of ["barkskin", "longstrider"]) {
    await openCast(id);
    const before = await spent();
    await page.getByRole("dialog").getByRole("button", { name: "取消", exact: true }).click();
    assert.equal(await spent(), before, "cancel does not spend slots");
    assert.equal(await page.evaluate(id => TabletopMode.getPersistentSpellEffects().find(e => e.spellId === id).active, id), false);
    await openCast(id);
    await page.getByRole("dialog").getByLabel("其他生物（不包含自己）").check();
    await page.getByRole("dialog").getByRole("button", { name: "施法", exact: true }).click();
    assert.equal(await spent(), before + 1, "casting on others spends one slot");
    assert.equal(await page.evaluate(id => TabletopMode.getPersistentSpellEffects().find(e => e.spellId === id).active, id), false);
    await openCast(id);
    await page.getByRole("dialog").getByRole("button", { name: "施法", exact: true }).click();
    await page.waitForFunction(id => TabletopMode.getPersistentSpellEffects().find(e => e.spellId === id).active, id);
  }
  assert.equal(await page.locator("#tabletop-ac").innerText(), "17 (樹膚)");
  assert.equal(await page.locator("#tabletop-speed").innerText(), "40 呎 (大步)");
  await page.evaluate(() => TabletopMode.setMageArmorActive(true));
  assert.equal(await page.locator("#tabletop-ac").innerText(), "17 (法護) (樹膚)");
  await page.evaluate(() => TabletopMode.setPersistentSpellEffect("longstrider", true));
  assert.equal(await page.locator("#tabletop-speed").innerText(), "40 呎 (大步)", "no repeated stacking");
  assert.equal(await page.evaluate(() => TabletopMode.getConcentrationSpellId()), "entangle");
  assert.equal(await page.locator("#ac-display").inputValue(), "12");
  assert.equal(await page.locator("#speed-display").inputValue(), "30");
  for (const ui of ["classic", "warm"]) for (const theme of ["light", "dark"]) {
    const colors = await page.evaluate(({ ui, theme }) => {
      document.documentElement.dataset.uiTheme = ui;
      document.documentElement.dataset.theme = theme;
      return ["#tabletop-ac", "#tabletop-speed"].map(selector => {
        const stat = document.querySelector(selector);
        const value = stat.querySelector(".tabletop-stat--spell-effect");
        const label = stat.querySelector(".tabletop-ac-effect-label");
        const probe = document.createElement("span"); probe.style.color = "var(--warning)"; stat.append(probe);
        const result = [getComputedStyle(value).color, getComputedStyle(probe).color, getComputedStyle(label).color, getComputedStyle(stat).color, getComputedStyle(label).fontSize, getComputedStyle(stat).fontSize];
        probe.remove(); return result;
      });
    }, { ui, theme });
    for (const c of colors) { assert.equal(c[0], c[1]); assert.equal(c[2], c[3]); assert.equal(c[4], c[5]); }
  }
  await page.evaluate(() => { saveAllFields(); });
  await page.reload();
  await page.waitForFunction(() => TabletopMode.collectState().longstriderActive);
  assert.equal(await page.evaluate(() => TabletopMode.collectState().barkskinActive), true);
  assert.equal(await page.evaluate(() => TabletopMode.collectState().mageArmorActive), true);
  const stateChecks = await page.evaluate(() => {
    const state = collectStateObject();
    TabletopMode.applyState(JSON.parse(JSON.stringify(state)));
    const share = collectShareState();
    const restored = TabletopMode.collectState();
    return [restored.barkskinActive, restored.longstriderActive, "barkskinActive" in share, "longstriderActive" in share];
  });
  assert.deepEqual(stateChecks, [true, true, false, false]);
  await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("overview"); });
  await page.locator("#tabletop-concentration-overview").getByRole("button", { name: "解除樹膚術", exact: true }).click();
  assert.match(await page.locator("#tabletop-ac").innerText(), /15 \(法護\)/);
  assert.equal(await page.evaluate(() => TabletopMode.collectState().longstriderActive), true);
  await page.evaluate(() => {
    TabletopMode.setMageArmorActive(false);
    document.getElementById("ac-display").value = "20";
    TabletopMode.setPersistentSpellEffect("barkskin", true);
  });
  assert.equal(await page.locator("#tabletop-ac").innerText(), "20 (樹膚)", "barkskin never lowers AC");
  await page.evaluate(() => {
    TabletopMode.commitDruidOperation("known", { keys: ["owl"] });
    const result = TabletopMode.commitDruidOperation("shape", { key: "owl" });
    if (!result.ok) throw new Error(result.message);
  });
  assert.equal(await page.locator("#tabletop-ac").innerText(), "17 (貓頭鷹) (樹膚)", "the form mark comes before spell marks");
  const beastSpeeds = await page.evaluate(() => Object.entries(TabletopMode.getDruidForm().speeds).map(([key, speed]) => `${key} ${speed + 10} 呎`).join("、"));
  assert.equal(await page.locator("#tabletop-speed").innerText(), `${beastSpeeds} (貓頭鷹) (大步)`);
  await page.locator("#tabletop-concentration-overview").getByRole("button", { name: "解除大步奔行", exact: true }).click();
  assert.doesNotMatch(await page.locator("#tabletop-speed").innerText(), /大步/);
  assert.equal(await page.evaluate(() => TabletopMode.collectState().barkskinActive), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.evaluate(() => TabletopMode.applyState({}));
  assert.equal(await page.evaluate(() => TabletopMode.getPersistentSpellEffects().some(e => e.active)), false, "legacy state defaults inactive");
  console.log("Persistent spells: casting, targets, cancellation, stacking, themes, persistence, dismissal and beast stats passed.");
}

// 護甲的力量需求：力量低於需求時自動計算的速度 -10 呎；盾牌與無甲不扣，跑團與 PDF 用同一個速度，關閉自動計算時不動手填速度。
async function checkArmorStrengthSpeed(page) {
  await page.evaluate(() => {
    TabletopMode.applyState({});
    TabletopMode.setMode("sheet");
    Inventory.add([{ itemId: "鎖子甲" }, { itemId: "條板甲" }, { itemId: "盾牌" }]);
  });
  await page.addScriptTag({ path: path.join(__dirname, "pdf-field-map.js") });
  const speedFor = (armor, str, offHand = "") => page.evaluate(({ armor, str, offHand }) => {
    for (const [id, value] of [["armor", armor], ["offHand", offHand]]) {
      const select = document.getElementById(id);
      select.value = value;
      if (select.value !== value) throw new Error(`${id} option missing: ${value}`);
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    const strInput = document.getElementById("str");
    strInput.value = str;
    strInput.dispatchEvent(new Event("input", { bubbles: true }));
    const sheet = document.getElementById("speed-display").value;
    return { sheet, pdf: buildPdfFieldPayload(collectStateObject()).speed1 };
  }, { armor, str, offHand });
  for (const [armor, str, expected, message, offHand] of [
    ["鎖子甲", "12", "20", "chain mail below STR 13 slows by 10"],
    ["鎖子甲", "13", "30", "chain mail at STR 13 keeps speed"],
    ["條板甲", "14", "20", "splint below STR 15 slows by 10"],
    ["條板甲", "15", "30", "splint at STR 15 keeps speed"],
    ["", "8", "30", "a shield is not armor", "盾牌"],
    ["", "8", "30", "no armor keeps speed"]
  ]) {
    assert.deepEqual(await speedFor(armor, str, offHand), { sheet: expected, pdf: expected }, message);
  }
  // 只改力量也要重算：同一件鎖子甲從 13 降到 12。
  await speedFor("鎖子甲", "13");
  assert.equal((await speedFor("鎖子甲", "12")).sheet, "20", "STR input alone recalculates speed");
  await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("overview"); });
  assert.equal(await page.locator("#tabletop-speed").innerText(), "20 呎", "tabletop speed follows the sheet");
  await page.evaluate(() => TabletopMode.setMode("sheet"));
  // 關閉自動計算：保留玩家手填的速度，PDF 也照填。
  await page.evaluate(() => {
    const toggle = document.getElementById("auto-calculate-key-stats-toggle");
    toggle.checked = false;
    toggle.dispatchEvent(new Event("change", { bubbles: true }));
    document.getElementById("speed-display").value = "35";
  });
  assert.deepEqual(await speedFor("條板甲", "8"), { sheet: "35", pdf: "35" }, "manual speed is left alone");
  await page.evaluate(() => {
    document.getElementById("auto-calculate-key-stats-toggle").checked = true;
    syncAutomaticKeyStatsMode();
  });
  assert.deepEqual(await speedFor("", "8"), { sheet: "30", pdf: "30" }, "automatic speed restored");
  console.log("Armor strength requirement: speed penalty, shield/no armor, STR recalculation, tabletop, PDF and manual speed passed.");
}

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
    await page.addInitScript(() => { try { localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"); } catch {} });
    await page.addInitScript(() => { try { if (localStorage.getItem("dnd.diceSystemEnabled.v1") === null) localStorage.setItem("dnd.diceSystemEnabled.v1", "false"); } catch {} });
    const errors = [];
    page.on("pageerror", error => errors.push(String(error)));
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html?analytics=owner`);
    await page.waitForFunction(() => Boolean(window.TabletopDruid));
    await page.check("#legal-dismiss");
    await page.click("#legal-close-btn");
    await page.selectOption("#class", "druid");
    await page.selectOption("#level", "8");
    await page.selectOption("#race", "human");
    await page.selectOption("#background", "soldier");
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
      for (const key of ["frog", "giant_fire_beetle", "giant_venomous_snake", "giant_seahorse"]) check(DruidBeastForms.some(f => f.key === key), `${key} is a wild shape form`);
      check(!isDruidBeastAllowed(DruidBeastForms.find(f => f.key === "giant_seahorse"), 2) && isDruidBeastAllowed(DruidBeastForms.find(f => f.key === "giant_seahorse"), 4), "giant seahorse CR 1/2");
      const seahorse = BeastCatalog.get("giant_seahorse");
      check(seahorse.actions.find(a => a.id === "dash")?.mode === "bonus" && seahorse.conditionalDamage[0]?.expression === "2d8+2", "giant seahorse bonus dash and charge damage");
      check(BeastCatalog.get("goat").saves?.str === 2 && JSON.stringify(BeastCatalog.get("badger").speeds) === JSON.stringify({ 步行: 20, 挖掘: 5 }), "beast saves and burrow speed");
      check(!DruidBeastForms.some(f => f.key === "tyrannosaurus_rex") && BeastCatalog.get("tyrannosaurus_rex")?.actions.length === 3, "CR 2+ beasts are reference-only");
      check(BeastCatalog.get("otherworldly_steed") === null && BeastCatalog.getStatBlock("otherworldly_steed"), "variable steed has no tabletop stats");
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
      const entry = SpellManagement.getEntries({ availableOnly: true })
        .find(entry => entry.sourceKey.startsWith("subclass-druid-") && SpellCatalog.getSpell(entry.spellId)?.level > 0);
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

    // Exercise dialogs through actual UI: status card, known forms, shape cards, attack cards, strips and ending.
    await page.evaluate(() => {
      TabletopMode.applyState({});
      TabletopMode.setPanel("overview");
      window.__druidRolls = [];
      addEventListener("diceroll", event => window.__druidRolls.push(event.detail.label));
    });
    const overview = page.locator("#tabletop-druid-overview");
    await overview.getByText("德魯伊・原形", { exact: true }).waitFor();
    assert.match(await overview.innerText(), /原形[\s\S]*荒野形態[\s\S]*3／3/u, "status card shows the original form and remaining uses");
    assert.equal(await overview.locator(".druid-pips__dots").innerText(), "●●●");
    assert.equal(await overview.locator(".tabletop-primary-button").count(), 1, "one primary button per area");
    await overview.getByRole("button", { name: "變形", exact: true }).click();
    const dialog = page.getByRole("dialog");
    assert.match(await dialog.innerText(), /還沒有可用的已知形態/u, "no known forms is explained inside the shape dialog");
    assert.equal(await dialog.locator(".druid-known-list").count(), 0, "shape no longer jumps to the known-form manager");
    await dialog.getByRole("button", { name: "選擇已知形態" }).click();
    await dialog.getByRole("button", { name: "套用推薦組合" }).click();
    const knownCount = dialog.locator(".app-dialog__header .druid-known-count");
    assert.match(await knownCount.innerText(), /^已選 4／\d+$/u, "known-form count sits in the fixed dialog header");
    assert.equal(await dialog.locator(".app-dialog__body .druid-known-count").count(), 0);
    assert.deepEqual(await dialog.locator(".druid-known-group__title").allInnerTexts(), ["CR 0", "CR 1/8", "CR 1/4", "CR 1/2", "CR 1"], "known forms are grouped by CR");
    const wolfCheckbox = dialog.getByRole("checkbox", { name: "已知形態：狼", exact: true });
    assert.equal(await wolfCheckbox.isChecked(), true);
    const swimmers = await page.evaluate(() => DruidBeastForms.filter(item => BeastCatalog.getRules(item.key).speed.swim).length);
    await dialog.getByRole("button", { name: "游泳", exact: true }).click();
    assert.equal(await dialog.getByRole("button", { name: "游泳", exact: true }).getAttribute("aria-pressed"), "true");
    assert.equal(await dialog.locator(".druid-known-form:visible").count(), swimmers, "swim filter uses structured speeds");
    assert.equal(await dialog.locator('.druid-known-form[data-beast="wolf"]').isVisible(), false);
    await dialog.getByRole("button", { name: "全部", exact: true }).click();
    assert.equal(await wolfCheckbox.isChecked(), true, "filters do not change selections");
    const wolfName = dialog.getByRole("button", { name: "狼", exact: true });
    await wolfName.click();
    const wolfDetail = dialog.locator('.druid-known-form[data-beast="wolf"] .druid-known-detail');
    await wolfDetail.getByText(/Wolf/).waitFor();
    assert.equal(await wolfName.getAttribute("aria-expanded"), "true");
    assert.doesNotMatch(await wolfDetail.innerText(), /\[object Object\]/);
    assert.match(await wolfDetail.innerText(), /察覺\+5、隱匿\+4/);
    assert.equal(await wolfCheckbox.isChecked(), true, "opening the beast card must not toggle the known form");
    await wolfDetail.locator('.spell-version__tab[data-spell-version="srd"]').click();
    await wolfDetail.locator(".spell-version__attribution").waitFor();
    await wolfName.click();
    assert.equal(await wolfDetail.isVisible(), false, "the name toggles the inline beast card");
    await dialog.getByRole("button", { name: "儲存已知形態" }).click();
    // Back in the shape dialog: comparable form cards.
    const wolfCard = dialog.locator('.druid-form-card[data-beast="wolf"]');
    await wolfCard.waitFor();
    assert.match(await dialog.locator(".app-dialog__header").innerText(), /變成哪一種？[\s\S]*附贈・剩 3／3/u);
    assert.equal(await dialog.locator(".druid-form-card").count(), 4);
    assert.match(await wolfCard.innerText(), /狼[\s\S]*CR 1\/4・中型野獸[\s\S]*AC 12[\s\S]*速度 40 呎[\s\S]*黑暗視覺 60 呎[\s\S]*咬擊 \+4・1d6\+2 穿刺傷害[\s\S]*群體戰鬥、追蹤/u);
    await wolfCard.click();
    assert.equal(await wolfCard.evaluate(card => card.classList.contains("is-selected")), true);
    assert.equal(await dialog.getByRole("button", { name: "變成狼", exact: true }).count(), 1, "confirm button names the selected beast");
    assert.match(await dialog.locator(".druid-shape__effects").innerText(), /變形後：臨時 HP 8・最長 4 小時・不能施法（專注保留）/u);
    assert.equal(await dialog.getByText(/保留目前的/u).count(), 0, "temporary HP choice only appears with existing temporary HP");
    const advanced = dialog.locator(".druid-advanced");
    assert.equal(await advanced.evaluate(details => details.open), false, "equipment rulings start collapsed");
    assert.match(await advanced.locator("summary").innerText(), /進階：裝備與 AC 裁定（目前全部融入）/u);
    await dialog.getByRole("button", { name: "取消", exact: true }).click();
    assert.equal(await page.evaluate(() => TabletopMode.getDruidContext().remaining), 3, "cancel does not spend");
    await page.evaluate(() => { TabletopMode.setPanel("actions"); });
    assert.equal(await page.locator("#tabletop-druid-actions").isHidden(), true, "no repeated status card on other tabs in the original form");
    // 兇蠻打手的「受訓善戰」：原形時顯示，荒野形態中隱藏，解除後恢復。
    const weaponRules = page.locator("#tabletop-weapon-rule-summary");
    assert.equal(await page.evaluate(() => hasSelectedFeat("兇蠻打手")), true, "fixture has Savage Attacker");
    await weaponRules.getByText("受訓善戰").waitFor();
    await page.click("#tabletop-action-tab-bonus");
    await page.locator('[data-action-option-key="dynamic-bonus-class-3u4zp1"]').click();
    const shapeDescription = page.locator("#tabletop-action-panel-bonus .tabletop-action-description");
    assert.equal(await shapeDescription.locator("ul").count(), 2, "shape rules have two real bullet lists");
    assert.equal(await shapeDescription.locator("li").count(), 9, "four Wild Shape usage rules and five transformation rules");
    assert.doesNotMatch(await shapeDescription.innerText(), /最大挑戰等級|推薦：|查看其他動物/);
    if (process.env.DND_SCREENSHOT_DIR) {
      await shapeDescription.scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(process.env.DND_SCREENSHOT_DIR, "druid-shape-description.png") });
    }
    await shapeDescription.getByRole("button", { name: "變形", exact: true }).click();
    await dialog.locator('.druid-form-card[data-beast="wolf"]').click();
    await dialog.getByRole("button", { name: "變成狼", exact: true }).click();
    await page.waitForFunction(() => TabletopMode.getDruidForm()?.key === "wolf");
    const actionStrip = page.locator("#tabletop-druid-actions");
    await actionStrip.waitFor();
    assert.match(await actionStrip.innerText(), /狼形態[\s\S]*荒野形態 2／3/u, "other tabs show a one-line status strip");
    assert.deepEqual(await actionStrip.getByRole("button").allInnerTexts(), ["解除"]);
    await weaponRules.getByText("受訓善戰").waitFor({ state: "detached" });
    const beastAttacks = page.locator("#tabletop-weapon-summary .druid-beast-attacks");
    await beastAttacks.getByText("狼的攻擊", { exact: true }).waitFor({ timeout: 3000 });
    const bite = beastAttacks.locator('.druid-beast-attack-card[data-beast-action="attack-0"]');
    assert.match(await bite.innerText(), /咬擊[\s\S]*\+4[\s\S]*1d6\+2 穿刺傷害[\s\S]*近戰・觸及 5 呎[\s\S]*命中中型或更小的目標：目標倒地。/u, "beast attack uses the weapon card layout");
    assert.match(await beastAttacks.locator(".druid-beast-trait").innerText(), /群攻[\s\S]*盟友/u, "traits get their own small card");
    assert.equal(await page.locator('[data-action-option-key^="druid-beast-wolf-"]').count(), 0, "the attack is listed once, not again in the options");
    assert.equal(await bite.getByRole("button", { name: /命中/u }).isDisabled(), true);
    assert.match(await beastAttacks.locator(".druid-dice-note").innerText(), /擲骰功能未開啟/u, "disabled dice buttons explain why");
    await page.evaluate(() => DiceRoller.setEnabled(true));
    await beastAttacks.locator(".druid-dice-note").waitFor({ state: "detached" });
    await bite.getByRole("button", { name: /命中/u }).click();
    await bite.getByRole("button", { name: /1d6\+2 穿刺傷害/u }).click();
    assert.deepEqual(await page.evaluate(() => window.__druidRolls), ["狼咬擊命中", "狼咬擊：1d6+2 穿刺傷害"]);
    // 原初打擊：勾選時野獸攻擊卡的備註和武器卡同一段字，取消就消失。
    const primalNote = "+1d8冷凍/火焰/閃電/雷鳴傷害";
    const setPrimalStrike = checked => page.evaluate(value => {
      const box = document.getElementById("druid-elemental-fury-primal-strike");
      box.checked = value;
      box.dispatchEvent(new Event("change", { bubbles: true }));
    }, checked);
    assert.equal(await bite.getByText(primalNote, { exact: true }).count(), 0, "no primal strike note unless the option is chosen");
    await setPrimalStrike(true);
    await bite.getByText(primalNote, { exact: true }).waitFor({ timeout: 3000 });
    await actionStrip.getByRole("button", { name: "原初打擊 +1d8", exact: true }).waitFor({ timeout: 3000 });
    await setPrimalStrike(false);
    await bite.getByText(primalNote, { exact: true }).waitFor({ state: "detached", timeout: 3000 });
    await page.evaluate(() => TabletopMode.setPanel("overview"));
    assert.equal(await page.locator("#tabletop-ac").innerText(), "12 (狼)", "AC is marked like barkskin");
    assert.match(await page.locator("#tabletop-speed").innerText(), /^步行 40 呎 \(狼\)$/u);
    const abilityMarks = await page.evaluate(() => Array.from(document.querySelectorAll("#tabletop-ability-modifiers .tabletop-ability-modifier"), item => item.querySelector(".tabletop-ac-effect-label")?.textContent || ""));
    assert.deepEqual(abilityMarks, ["(狼)", "(狼)", "(狼)", "", "", ""], "only strength, dexterity and constitution are marked");
    // 狀態卡在下一個動畫影格才重畫，切回總覽後要等它更新。
    await page.locator("#tabletop-druid-overview.is-shaped").waitFor({ timeout: 3000 });
    assert.match(await overview.innerText(), /狼\s*中型野獸[\s\S]*黑暗視覺 60 呎[\s\S]*群攻[\s\S]*臨時 HP 8[\s\S]*最長 4 小時・不能施法・專注保留/u);
    await overview.getByRole("button", { name: "野獸資料", exact: true }).click();
    await dialog.locator(".beast-card").getByText(/Wolf/).waitFor();
    assert.equal(await dialog.locator(".beast-card .spell-version__tab").count(), 2, "beast data offers the site and SRD versions");
    await dialog.getByRole("button", { name: "關閉", exact: true }).click();
    await overview.getByRole("button", { name: "更換形態", exact: true }).click();
    assert.equal(await dialog.locator('.druid-form-card[data-beast="wolf"] .druid-tag--current').count(), 1);
    assert.equal(await dialog.getByRole("button", { name: "變成狼", exact: true }).count(), 1, "the current form is preselected");
    assert.equal(await dialog.getByRole("checkbox", { name: /保留目前的 8 點臨時 HP/u }).isChecked(), true);
    await dialog.locator('.druid-form-card[data-beast="rat"]').click();
    await dialog.getByRole("button", { name: "變成老鼠", exact: true }).click();
    await page.waitForFunction(() => TabletopMode.getDruidForm()?.key === "rat");
    await page.evaluate(() => { TabletopMode.setPanel("actions"); });
    await page.locator("#tabletop-weapon-summary").getByText("老鼠的攻擊", { exact: true }).waitFor({ timeout: 3000 });
    assert.equal(await page.locator("#tabletop-weapon-summary").getByText("狼的攻擊", { exact: true }).count(), 0, "changing shape replaces the attack cards");
    await page.evaluate(() => { TabletopMode.setPanel("skills"); });
    await page.locator("#tabletop-druid-skills").getByText("老鼠形態", { exact: true }).waitFor();
    await page.evaluate(() => { TabletopMode.setPanel("spells"); });
    const spellStrip = page.locator("#tabletop-druid-spells");
    await spellStrip.getByText("老鼠形態", { exact: true }).waitFor();
    assert.match(await spellStrip.innerText(), /老鼠形態[\s\S]*荒野形態中不能施法，專注照常維持/u, "spell tab warns while shaped");
    assert.equal(await spellStrip.evaluate(strip => strip.classList.contains("druid-strip--warning")), true);
    await spellStrip.getByRole("button", { name: "解除荒野形態" }).click();
    await dialog.getByRole("button", { name: "解除形態", exact: true }).click();
    await spellStrip.waitFor({ state: "hidden" });
    await page.evaluate(() => { TabletopMode.setPanel("actions"); });
    await page.locator("#tabletop-weapon-summary .druid-beast-attacks").waitFor({ state: "detached", timeout: 3000 });
    await page.locator('#tabletop-action-panel-bonus [data-action-option-key="druid-end-wild-shape"]').waitFor({ state: "detached", timeout: 3000 });
    assert.equal(await shapeDescription.getByRole("button", { name: "變形", exact: true }).count(), 1, "state refresh preserves the selected action");
    await weaponRules.getByText("受訓善戰").waitFor();
    // 充能能力（巨蜘蛛的蛛網）：可用選項裡只有一個「已使用」勾選與「擲充能」。
    await page.evaluate(() => {
      const run = (op, data) => TabletopMode.commitDruidOperation(op, data, TabletopMode.getDruidContext().token);
      if (!run("known", { keys: ["wolf", "rat", "spider", "riding_horse", "giant_spider"] }).ok || !run("shape", { key: "giant_spider" }).ok) throw new Error("giant spider");
      if (TabletopMode.collectState().druid.beastUsed.includes("giant_spider:web")) run("beast-recharge", { actionId: "web" });
    });
    await page.click("#tabletop-action-tab-action");
    await page.locator('[data-action-option-key="druid-beast-giant_spider-web"]').click();
    const web = page.locator("#tabletop-action-panel-action .tabletop-action-description");
    assert.match(await web.innerText(), /DC13敏捷豁免[\s\S]*充能 5–6/u);
    await web.getByRole("checkbox", { name: "蛛網已使用" }).check();
    await page.waitForFunction(() => TabletopMode.collectState().druid.beastUsed.includes("giant_spider:web"));
    await web.getByRole("button", { name: /擲蛛網充能/u }).click();
    assert.equal(await page.evaluate(() => window.__druidRolls.at(-1)), "蛛網充能（5–6 成功）");
    await web.getByRole("checkbox", { name: "蛛網已使用" }).uncheck();
    await page.waitForFunction(() => !TabletopMode.collectState().druid.beastUsed.includes("giant_spider:web"));
    assert.equal(await page.locator('[data-action-option-key^="druid-beast-giant_spider-attack"]').count(), 0);
    await page.evaluate(() => {
      const run = (op, data) => TabletopMode.commitDruidOperation(op, data, TabletopMode.getDruidContext().token);
      run("end");
      DiceRoller.setEnabled(false);
    });
    await page.click("#tabletop-action-tab-action");
    await page.getByRole("button", { name: "荒野夥伴", exact: false }).first().click();
    const companionSpell = page.locator(".tabletop-action-description:visible .druid-companion-spell");
    assert.match(await companionSpell.locator(".druid-companion-spell__title").innerText(), /獲得魔寵\s*Find Familiar/, "wild companion action names the spell");
    assert.match(await companionSpell.innerText(), /心靈連結/, "wild companion action shows the spell text");
    assert.equal(await companionSpell.locator(".spell-version__tab").count(), 2, "wild companion action offers both spell versions");
    assert.equal(await companionSpell.locator("button.spell-readonly-reference[data-beast]").count(), 11, "wild companion action links the familiar forms");
    const assertWildCompanionText = (text, label) => {
      assert.match(text, /施法時間: 魔法動作，消耗 1 個法術位或 1 次荒野形態/, `${label}: casting time follows Wild Companion`);
      assert.match(text, /成分: V、S\n/, `${label}: no material component`);
      assert.match(text, /持續時間: 在你完成長休後消失/, `${label}: lasts until a long rest`);
      assert.match(text, /生物類型改為精類/, `${label}: familiar is always Fey`);
      assert.doesNotMatch(text, /1小時|儀式|焚香|天界生物|邪魔/, `${label}: general casting rules are replaced`);
    };
    assertWildCompanionText(await companionSpell.locator(".spell-version__site").innerText(), "action tab");
    await companionSpell.locator('.spell-version__tab[data-spell-version="srd"]').click();
    await companionSpell.locator(".spell-version__attribution").waitFor();
    assert.match(await companionSpell.locator(".spell-version__srd").innerText(), /1小時或儀式[\s\S]*天界生物、精類或邪魔/, "SRD version stays the original spell text");
    await companionSpell.locator('.spell-version__tab[data-spell-version="site"]').click();
    await page.locator(".tabletop-action-description:visible").getByRole("button", { name: "荒野夥伴", exact: true }).click();
    await dialog.getByLabel("消耗方式").selectOption("slot");
    await dialog.getByRole("button", { name: "召喚荒野夥伴" }).click();
    assert.equal(await page.evaluate(() => TabletopMode.collectState().druid.companion), true);
    // 法術頁的獲得魔寵和其他法術一樣先看說明，按施法才進荒野夥伴的消耗視窗。
    await page.evaluate(() => { TabletopMode.setPanel("spells"); });
    const familiarButton = page.locator('.tabletop-spell-button[data-spell-source-key="class-druid-wild-companion-find-familiar"]');
    assert.equal(await familiarButton.locator(".tabletop-spell-button__timing").innerText(), "動作", "spell tab timing follows Wild Companion (Magic action, no ritual)");
    await familiarButton.click();
    const familiarDetail = dialog.locator(".tabletop-spell-detail");
    assert.match(await familiarDetail.innerText(), /Find Familiar[\s\S]*來源：荒野夥伴[\s\S]*心靈連結/, "spell tab shows the spell text");
    assertWildCompanionText(await familiarDetail.locator(".spell-version__site").innerText(), "spell tab");
    await dialog.getByRole("button", { name: "施法", exact: true }).click();
    await dialog.getByRole("button", { name: "召喚荒野夥伴" }).waitFor();
    await dialog.getByRole("button", { name: "取消", exact: true }).click();
    await dialog.waitFor({ state: "detached" });
    // 特例只限荒野夥伴：不是從荒野夥伴來源開啟的法術詳情仍是一般版本。
    await page.evaluate(() => { void TabletopSpells.showSpellDetail("find-familiar"); });
    assert.match(await familiarDetail.locator(".spell-version__site").innerText(), /施法時間: 1小時或儀式[\s\S]*焚香[\s\S]*天界生物、精類或邪魔/, "other entries keep the general spell text");
    await dialog.locator(".app-dialog__close").click();
    await dialog.waitFor({ state: "detached" });
    await page.evaluate(() => { TabletopMode.setPanel("resources"); });
    const recoveryRow = page.locator('[data-resource-key="druid-natural-recovery-spell-slots"]');
    const recoveryButton = recoveryRow.getByRole("button", { name: "恢復法術位", exact: true });
    const recoveryCheckbox = recoveryRow.getByRole("checkbox", { name: "自然恢復：恢復法術位已使用" });
    // 德魯伊資源只在資源列裡操作：野性復甦一列（兩種轉換＋已使用勾選），自然恢復一列（恢復法術位＋免費施法）。
    assert.equal(await page.getByText("德魯伊資源操作").count(), 0, "no separate druid resource section");
    const resurgenceRow = page.locator('[data-resource-key="druid-wild-resurgence-spell-slot"]');
    assert.equal(await page.locator("#tabletop-panel-resources").getByRole("button", { name: /野性復甦/u }).count(), 0, "wild resurgence has one entry");
    assert.equal(await resurgenceRow.getByRole("checkbox").count(), 1);
    assert.equal(await resurgenceRow.getByRole("checkbox", { name: "野性復甦：荒野形態 → 1 環法術位已使用", exact: true }).count(), 1, "the resurgence checkbox names the conversion it records");
    assert.match(await resurgenceRow.locator(".druid-check").innerText(), /^荒野形態 → 1 環法術位：已使用$/u);
    const resourceCheckLabels = await page.locator("#tabletop-panel-resources .druid-resource-row .druid-check").allInnerTexts();
    assert.equal(new Set(resourceCheckLabels).size, resourceCheckLabels.length, "druid resource checkboxes have distinct labels");
    const freeCast = recoveryRow.getByRole("checkbox", { name: "自然恢復：免費施法已使用" });
    const freeBefore = await page.evaluate(() => document.getElementById("druid-natural-recovery-used").checked);
    await freeCast.setChecked(!freeBefore);
    assert.equal(await page.evaluate(() => document.getElementById("druid-natural-recovery-used").checked), !freeBefore, "free cast checkbox writes the canonical control");
    await page.locator('[data-resource-key="druid-natural-recovery-spell-slots"]').getByRole("checkbox", { name: "自然恢復：免費施法已使用" }).setChecked(freeBefore);
    await page.evaluate(() => TabletopMode.setBuiltInResourceSpent("druid-wild-shape", 3, 3));
    const toShape = resurgenceRow.getByRole("button", { name: "法術位 → 荒野形態" });
    await page.waitForFunction(() => document.querySelector('[data-resource-key="druid-wild-resurgence-spell-slot"] button')?.disabled === false);
    assert.equal(await resurgenceRow.getByRole("button", { name: "荒野形態 → 1 環法術位" }).isDisabled(), true, "converting to a slot needs a wild shape use");
    await toShape.click();
    await dialog.getByRole("button", { name: "確認使用", exact: true }).click();
    await page.waitForFunction(() => TabletopMode.getDruidContext().remaining === 1);
    await page.evaluate(() => TabletopMode.setBuiltInResourceSpent("druid-wild-shape", 0, 3));
    const wildBeforeRecovery = await page.evaluate(() => TabletopMode.getDruidContext().remaining);
    assert.equal(await recoveryButton.isEnabled(), true);
    assert.equal(await page.getByRole("button", { name: /德魯伊.*休.*結算/ }).count(), 0);
    await recoveryCheckbox.check();
    assert.equal(await page.evaluate(() => TabletopMode.getBuiltInResourceSpent("druid-natural-recovery-spell-slots")), 1);
    await page.waitForFunction(() => document.querySelector('.druid-natural-recovery button')?.disabled === true);
    assert.equal(await recoveryButton.isDisabled(), true);
    await recoveryCheckbox.uncheck();
    await recoveryButton.click();
    await dialog.getByRole("checkbox").first().check();
    await dialog.getByRole("button", { name: "恢復所選法術位" }).click();
    await page.waitForFunction(() => document.querySelector('.druid-natural-recovery input[type="checkbox"]')?.checked === true);
    assert.equal(await recoveryCheckbox.isChecked(), true, "using recovery checks resource");
    await page.waitForFunction(() => document.querySelector('.druid-natural-recovery button')?.disabled === true);
    assert.equal(await recoveryButton.isDisabled(), true);
    assert.equal(await page.evaluate(() => TabletopMode.getDruidContext().remaining), wildBeforeRecovery, "recovery does not affect wild shape");
    await recoveryCheckbox.uncheck();
    assert.equal(await page.evaluate(() => TabletopMode.getBuiltInResourceSpent("druid-natural-recovery-spell-slots")), 0);
    await page.waitForFunction(() => document.querySelector('.druid-natural-recovery button')?.disabled === false);
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
      if (!SpellManagement.addPlayerSpell("produce-flame", { spellClass: "druid" })) throw new Error("Produce Flame must prepare through the shared spell API");
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

    // 不在荒野形態清單的野獸（私人內容的形態，例如北極熊）：存檔保留 key，跑團不顯示、不能變形、不計入已知數量。
    const beforeHidden = await page.evaluate(() => TabletopMode.collectState());
    await page.evaluate(() => {
      TabletopMode.applyState({ druid: { knownForms: ["wolf", "polar_bear"], formKey: "polar_bear" } });
      TabletopMode.setMode("tabletop");
      TabletopMode.setPanel("overview");
      document.getElementById("str").dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.waitForTimeout(100);
    const hiddenState = await page.evaluate(() => ({
      druid: TabletopMode.collectState().druid, form: TabletopMode.getDruidForm(),
      overview: document.getElementById("tabletop-druid-overview").innerText,
      options: ["action", "bonus", "reaction"].flatMap(mode => TabletopDruid.getActionOptions(mode).map(option => option.key))
    }));
    assert.deepEqual(hiddenState.druid.knownForms, ["wolf", "polar_bear"], "hidden known form survives load");
    assert.equal(hiddenState.druid.formKey, "polar_bear", "hidden current form is kept, not cleared by character sync");
    assert.equal(hiddenState.form, null, "hidden current form counts as the original form");
    assert.match(hiddenState.overview, /原形/u);
    assert.equal(hiddenState.options.some(key => key.includes("polar_bear")), false, "hidden form has no tabletop actions");
    await page.locator("#tabletop-druid-overview").getByRole("button", { name: /^已知形態 1／\d+$/u }).click();
    const hiddenDialog = page.getByRole("dialog");
    assert.match(await hiddenDialog.locator(".druid-known-count").innerText(), /^已選 1／\d+$/u, "hidden forms do not count toward known forms");
    assert.equal(await hiddenDialog.getByText("北極熊").count(), 0, "hidden forms are not listed");
    await hiddenDialog.getByRole("checkbox", { name: "已知形態：老鼠", exact: true }).check();
    await hiddenDialog.getByRole("button", { name: "儲存已知形態" }).click();
    await hiddenDialog.waitFor({ state: "hidden" });
    const roundTrips = await page.evaluate(() => {
      const saved = TabletopMode.collectState().druid;
      const json = JSON.parse(JSON.stringify(collectStateObject()));
      TabletopMode.applyState({});
      TabletopMode.applyState(json);
      const restored = TabletopMode.collectState().druid;
      const share = collectShareState();
      return { saved, restored, shareKnown: share.druid?.knownForms };
    });
    assert.deepEqual([...roundTrips.saved.knownForms].sort(), ["polar_bear", "rat", "wolf"], "saving known forms keeps hidden keys");
    assert.equal(roundTrips.saved.formKey, "polar_bear");
    assert.deepEqual(roundTrips.restored, roundTrips.saved, "JSON round trip keeps hidden forms");
    assert.ok(roundTrips.shareKnown.includes("polar_bear"), "share link keeps hidden known form");
    await page.evaluate(() => saveAllFields());
    await page.reload();
    await page.waitForFunction(() => TabletopMode.collectState().druid.formKey === "polar_bear");
    const reloaded = await page.evaluate(() => {
      const druid = TabletopMode.collectState().druid;
      const json = JSON.parse(JSON.stringify(collectStateObject()));
      TabletopMode.applyState({ druid: collectShareState().druid });
      const fromShare = TabletopMode.collectState().druid.knownForms;
      return { druid, json: JSON.stringify(json), fromShare };
    });
    assert.ok(reloaded.druid.knownForms.includes("polar_bear") && reloaded.druid.formKey === "polar_bear", "autosave keeps hidden forms");
    assert.match(reloaded.json, /polar_bear/u, "JSON export keeps hidden forms");
    assert.ok(reloaded.fromShare.includes("polar_bear"), "share restore keeps hidden known form");
    await page.evaluate(state => { TabletopMode.applyState(state); saveAllFields(); }, beforeHidden);
    await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("actions"); window.scrollTo(0, 0); });
    if (process.env.DND_SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.DND_SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(process.env.DND_SCREENSHOT_DIR, "druid-desktop.png") });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "mobile overflow");
    if (process.env.DND_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.DND_SCREENSHOT_DIR, "druid-mobile.png") });
    // 變形中從「更換形態」視窗的「管理已知形態」進入。
    await page.evaluate(() => { TabletopMode.setPanel("overview"); window.scrollTo(0, 0); });
    await page.locator("#tabletop-druid-overview").getByRole("button", { name: "更換形態", exact: true }).click();
    await dialog.getByRole("button", { name: "管理已知形態", exact: true }).click();
    // The count stays visible while the list scrolls and turns red above the limit.
    const mobileCount = dialog.locator(".app-dialog__header .druid-known-count");
    const knownLimit = Number((await mobileCount.innerText()).match(/／(\d+)$/u)[1]);
    while (await dialog.locator(".druid-known-form input:checked").count() <= knownLimit) {
      await dialog.locator(".druid-known-form input:not(:checked)").first().check();
    }
    assert.equal(await mobileCount.evaluate(el => el.classList.contains("is-over-limit")), true);
    assert.equal(await mobileCount.evaluate(el => {
      const probe = document.createElement("span"); probe.style.color = "var(--danger)"; el.after(probe);
      const danger = getComputedStyle(probe).color; probe.remove(); return getComputedStyle(el).color === danger;
    }), true, "over-limit count uses the danger color");
    assert.equal(await dialog.locator(".app-dialog__body").evaluate(body => { body.scrollTop = body.scrollHeight; return body.scrollTop > 0; }), true, "mobile list scrolls");
    const countBounds = await mobileCount.boundingBox();
    assert(countBounds.y >= 0 && countBounds.y + countBounds.height <= 844 && countBounds.x + countBounds.width <= 390, "count stays visible after scrolling");
    await dialog.locator(".druid-known-form input:checked").first().uncheck();
    assert.equal(await mobileCount.evaluate(el => el.classList.contains("is-over-limit")), false, "returning to the limit clears the warning");
    await dialog.getByRole("button", { name: "狼", exact: true }).click();
    const inlineCard = dialog.locator('.druid-known-form[data-beast="wolf"] .druid-known-detail');
    await inlineCard.waitFor({ state: "visible" });
    await inlineCard.scrollIntoViewIfNeeded();
    const bounds = await inlineCard.boundingBox();
    assert(bounds.x >= 0 && bounds.x + bounds.width <= 390, "inline beast card fits the mobile width");
    assert.equal(await dialog.evaluate(surface => surface.scrollWidth <= surface.clientWidth), true, "known-form dialog has no horizontal scroll");
    if (process.env.DND_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.DND_SCREENSHOT_DIR, "druid-known-mobile.png") });
    await dialog.getByRole("button", { name: "取消", exact: true }).click();
    // 取消管理已知形態後回到原本的變形視窗。
    await dialog.locator(".druid-form-card").first().waitFor();
    await dialog.getByRole("button", { name: "取消", exact: true }).click();
    await dialog.waitFor({ state: "detached" });
    // 等級不夠的形態上鎖並標出解鎖等級；取消不改存檔。
    const setLevel = level => page.evaluate(level => {
      const select = document.getElementById("level"); select.value = level; select.dispatchEvent(new Event("change", { bubbles: true }));
    }, level);
    await setLevel("4");
    await page.evaluate(() => { TabletopMode.applyState({ druid: { knownForms: ["wolf"] } }); TabletopMode.setPanel("overview"); });
    await page.locator("#tabletop-druid-overview").getByRole("button", { name: /^已知形態/u }).click();
    const owlRow = dialog.locator('.druid-known-form[data-beast="owl"]');
    assert.equal(await owlRow.evaluate(row => row.classList.contains("is-locked")), true);
    assert.equal(await owlRow.getByRole("checkbox").isDisabled(), true);
    assert.match(await owlRow.innerText(), /8 級解鎖/u, "locked forms show the unlock level");
    assert.match(await dialog.locator('.druid-known-form[data-beast="brown_bear"]').innerText(), /8 級解鎖/u);
    assert.equal(await dialog.locator('.druid-known-form[data-beast="ape"]').getByRole("checkbox").isDisabled(), false, "CR 1/2 is open at level 4");
    await dialog.getByRole("button", { name: "取消", exact: true }).click();
    await setLevel("8");
    await checkPersistentSpells(page);
    await checkArmorStrengthSpeed(page);
    assert.deepEqual(errors, [], "browser runtime errors");
    console.log("Druid status card, strips, known forms, shape cards, attack cards, recharge, resources, cancellation, alternate payment, autosave and responsive layout passed.");
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });

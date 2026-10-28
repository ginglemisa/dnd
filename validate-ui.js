"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const vm = require("node:vm");
const { chromium } = require("playwright");

// Code moved out of index.html loads in place as local scripts without defer/async.
function getExtractedPageScriptFiles(html) {
  return [...html.matchAll(/<script\b(?![^>]*\b(?:defer|async)\b)[^>]*\bsrc="(?!https?:|\/\/|data:)([^"?#]+)[^"]*"[^>]*>\s*<\/script>/gi)].map(match => match[1]);
}

// Shared presentation, dialogs and PDF output. Domain rules stay in their suites.
const browserErrors = [];
function verifyAnalyticsIsolation(html) {
  const inlineScripts = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
  const bootstrap = inlineScripts.find(source => source.includes('const analyticsRoleKey ='));
  assert(bootstrap, "analytics bootstrap exists");
  assert(!/<script\b[^>]*\bsrc=["']https:\/\/www\.googletagmanager\.com/i.test(html), "Google script must not load unconditionally");
  const analytics = fs.readFileSync(path.join(__dirname, "analytics.js"), "utf8");
  // These are virtual locations: scripts and events are captured in memory, never sent to Google.
  const run = (href, { owner = false, blockedStorage = false, blockedHistory = false, storage = new Map(), referrer = "" } = {}) => {
    if (owner) storage.set("twd20.analyticsRole.v1", "owner");
    const scripts = [];
    const context = vm.createContext({
      URL, URLSearchParams, location: new URL(href), performance: { now: () => 0 },
      localStorage: {
        getItem(key) { return blockedStorage ? null : storage.get(key) ?? null; },
        setItem(key, value) { if (blockedStorage) throw new Error("storage blocked"); storage.set(key, value); },
        removeItem(key) { if (blockedStorage) throw new Error("storage blocked"); storage.delete(key); }
      },
      history: { replaceState(_state, _title, url) { if (blockedHistory) throw new Error("history blocked"); context.location = new URL(url, context.location); } },
      document: {
        visibilityState: "visible", referrer, documentElement: { dataset: {} },
        createElement: () => ({}), head: { appendChild: script => scripts.push(script) }, addEventListener() {}
      },
      setTimeout: () => 1, clearTimeout() {}, addEventListener() {}
    });
    context.window = context;
    vm.runInContext(inlineScripts[0], context);
    vm.runInContext(bootstrap, context);
    vm.runInContext(analytics, context);
    const tracked = context.twAnalytics.track("isolation_probe");
    context.gtag("event", "direct_probe");
    return { context, scripts, tracked, storage };
  };
  for (const host of ["twd20.com", "www.twd20.com"]) {
    const allowed = run(`https://${host}/`);
    assert.equal(allowed.tracked, true, host);
    assert.equal(allowed.scripts.length, 1);
    assert.equal(allowed.context.dataLayer.length, 4, "config and both event paths allowed");
    const config = allowed.context.dataLayer.find(args => args[0] === "config")[2];
    assert.equal(config.page_location, `https://${host}/`);
    assert.equal(config.page_referrer, "");
    assert.equal(allowed.scripts[0].referrerPolicy, "no-referrer");
  }
  const disabledCases = [
    ["http://localhost:8000/?analytics=user"], ["http://127.0.0.1:8000/"],
    ["file:///C:/Git/dnd/index.html?analytics=owner"], ["file://twd20.com/index.html"],
    ["https://twd20.com.example.org/"], ["https://www.twd20.com.example.org/"],
    ["https://preview.twd20.com/"], ["https://twd20.com@example.org/"],
    ["https://example.org/?site=twd20.com"],
    ["https://twd20.com/?analytics=owner"], ["https://www.twd20.com/", { owner: true }],
    ["https://twd20.com/?analytics=owner", { blockedStorage: true }],
    ["file:///C:/Git/dnd/index.html?analytics=owner", { blockedHistory: true }],
    ["https://twd20.com/?api_key=synthetic"],
    ["https://twd20.com/?analytics=user&token=synthetic"],
    ["https://twd20.com/?q=synthetic"],
    ["https://twd20.com/?analytics=synthetic"],
    ["https://twd20.com/#s=synthetic"], ["https://twd20.com/#s2=synthetic"],
    ["https://twd20.com/?analytics=user#access_token=synthetic"]
  ];
  for (const [href, options] of disabledCases) {
    const result = run(href, options);
    assert.equal(result.context.twAnalyticsDisabled, true, href);
    assert.equal(result.tracked, false, href);
    assert.equal(result.scripts.length, 0, href);
    assert.equal(result.context.dataLayer.length, 0, href);
  }
  const saved = run("https://twd20.com/?embed=1&analytics=owner#s2=fixture");
  assert.equal(saved.context.location.href, "https://twd20.com/?embed=1#s2=fixture", "query and share hash preserved");
  assert.equal(run(saved.context.location.href, { storage: saved.storage }).tracked, false, "owner survives reload");
  assert.equal(run("https://twd20.com/?analytics=user", { owner: true }).tracked, true, "explicit opt-in clears owner");
  assert.equal(run("http://localhost:8000/?analytics=user", { owner: true }).tracked, false, "opt-in cannot bypass host gate");
  const blocked = run("https://twd20.com/?analytics=owner#s2=fixture", { blockedStorage: true });
  assert.equal(blocked.context.location.search, "?analytics=owner", "failed persistence retains owner for reload");
  const uninitialized = run("https://twd20.com/?analytics=owner");
  delete uninitialized.context.twAnalyticsDisabled;
  assert.equal(uninitialized.context.twAnalytics.track("uninitialized_probe"), false, "custom events fail closed before initialization");
  const referral = run("https://twd20.com/", { referrer: "https://example.org/private/synthetic?token=synthetic#secret" });
  assert.equal(referral.context.dataLayer.find(args => args[0] === "config")[2].page_referrer, "https://example.org/");
  assert(!JSON.stringify(referral.context.dataLayer).includes("synthetic"), "referrer credentials must not enter the event queue");
  console.log("Analytics isolation: hosts, owner persistence, query/share URL exclusion, sanitized location/referrer and both event paths passed (no network).");
}

async function newUiPage(browser, options = {}) {
  const page = await browser.newPage(options);
  await page.addInitScript(() => { try { localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"); } catch {} });
  page.setDefaultTimeout(10000);
  page.on("pageerror", error => browserErrors.push(String(error)));
  return page;
}

async function verifyUtilityMenuLayout(page) {
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
    assert.equal(layout.settings.length, 4);
    assert.equal(layout.switches.length, 4);
    for (let index = 1; index < layout.settings.length; index++) {
      assert(layout.settings[index - 1].top < layout.settings[index].top);
    }
    layout.settings.forEach((setting, index) => {
      assert.equal(setting.left, layout.settings[0].left);
      assert.equal(layout.switches[index].right, setting.right);
    });
    assert.equal(layout.row.right, layout.settings.at(-1).right);
    assert.equal(layout.help[0].top, layout.help[1].top);
    assert.equal(layout.help[2].top, layout.help[3].top);
    assert.equal(layout.help[0].left, layout.help[2].left);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  if (process.env.DND_UI_SCREENSHOT_DIR) {
    fs.mkdirSync(process.env.DND_UI_SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({ path: path.join(process.env.DND_UI_SCREENSHOT_DIR, "menu.png") });
  }
  await page.locator("#utility-menu-toggle").click();
}

async function verifyAppearanceAndLayout(browser, page, url) {
  const screenshot = async name => {
    if (!process.env.DND_UI_SCREENSHOT_DIR) return;
    fs.mkdirSync(process.env.DND_UI_SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({ path: path.join(process.env.DND_UI_SCREENSHOT_DIR, `${name}.png`) });
  };
  await page.goto(url);
  assert.equal(await page.evaluate(() => document.documentElement.dataset.uiTheme), "warm");
  await page.locator("#legal-close-btn").click();
  await verifyUtilityMenuLayout(page);
  await page.locator("#class").selectOption("rogue");
  await page.locator("#level").selectOption("3");
  await page.locator("#race").selectOption("human");
  await page.locator("#utility-menu-toggle").click();
  for (const family of ["classic", "warm"]) for (const mode of ["light", "dark"]) {
    const stateBefore = await page.evaluate(() => JSON.stringify(collectStateObject()));
    if (await page.locator("#theme-toggle").isChecked() !== (family === "warm")) await page.locator(".utility-menu__theme-switch").click();
    if (await page.evaluate(() => document.documentElement.dataset.theme) !== mode) await page.locator("#color-mode-toggle").click();
    assert.deepEqual(await page.evaluate(() => [document.documentElement.dataset.uiTheme, document.documentElement.dataset.theme]), [family, mode]);
    assert.equal(await page.evaluate(() => JSON.stringify(collectStateObject())), stateBefore, "appearance controls must not change character JSON");
    await page.reload();
    assert.deepEqual(await page.evaluate(() => [document.documentElement.dataset.uiTheme, document.documentElement.dataset.theme]), [family, mode], "both settings survive reload");
    const expectedLogo = family === "classic" ? ".legal-modal-logo-classic" : `.legal-modal-logo-${mode}`;
    const legalModal = page.locator("#legal-modal");
    assert.equal(await legalModal.locator(expectedLogo).isVisible(), true);
    assert.equal(await legalModal.locator(".legal-modal-logo-classic:visible, .legal-modal-logo-warm img:visible").count(), 1);
    assert.equal(await legalModal.locator(expectedLogo).evaluate(el => el.complete && el.naturalWidth > 0), true);
    await screenshot(`${family}-${mode}-logo`);
    assert.equal(await page.locator('script[src*="legal-about.js"]').count(), 0, "About must load on demand");
    await legalModal.locator(".legal-about-trigger:visible").first().click();
    const about = page.locator("#legal-about-modal");
    await about.getByRole("heading", { name: "SRD Attribution", exact: true }).waitFor();
    assert.equal(await page.locator("iframe").count(), 0);
    assert.equal(await about.getByText("twD20｜Legal & About", { exact: true }).count(), 0);
    const aboutColors = await about.evaluate(root => {
      const surface = getComputedStyle(root.querySelector(".app-dialog__surface"));
      const body = getComputedStyle(root.querySelector(".legal-about-content p"));
      return { background: surface.backgroundColor, text: body.color };
    });
    assert.deepEqual(aboutColors, {
      background: { "classic-light": "rgba(255, 255, 255, 0.96)", "classic-dark": "rgb(32, 40, 51)", "warm-light": "rgb(255, 249, 239)", "warm-dark": "rgb(38, 33, 29)" }[`${family}-${mode}`],
      text: { "classic-light": "rgb(51, 65, 93)", "classic-dark": "rgb(205, 208, 213)", "warm-light": "rgb(61, 48, 39)", "warm-dark": "rgb(204, 189, 165)" }[`${family}-${mode}`]
    });
    assert.equal(await about.locator(".app-dialog__body").evaluate(el => el.scrollWidth <= el.clientWidth), true);
    await page.keyboard.press("Shift+Tab");
    assert.equal(await about.getByRole("button", { name: "回到角卡" }).evaluate(el => el === document.activeElement), true);
    await page.keyboard.press("Escape");
    assert.equal(await about.count(), 0);
    assert.equal(await page.locator("#utility-menu-toggle").evaluate(el => el === document.activeElement), true);

    // Share mode locks identity selects; every appearance must show them gray yet readable.
    const lockedSelect = await page.evaluate(() => {
      const select = document.getElementById("class");
      const channels = color => color.match(/[\d.]+/g).slice(0, 3).map(Number);
      const luminance = color => {
        const [r, g, b] = channels(color).map(value => { value /= 255; return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      select.style.transition = "none";
      const enabledBackground = getComputedStyle(select).backgroundColor;
      select.disabled = true;
      const style = getComputedStyle(select);
      const [light, dark] = [luminance(style.color), luminance(style.backgroundColor)].sort((a, b) => b - a);
      const result = { gray: style.backgroundColor !== enabledBackground, opacity: style.opacity, contrast: (light + 0.05) / (dark + 0.05) };
      select.disabled = false;
      select.style.removeProperty("transition");
      return result;
    });
    assert.equal(lockedSelect.gray, true, `${family}-${mode} disabled select uses a gray background`);
    assert.equal(lockedSelect.opacity, "1", `${family}-${mode} disabled select is not faded`);
    assert(lockedSelect.contrast >= 4.5, `${family}-${mode} disabled select contrast ${lockedSelect.contrast.toFixed(2)}`);

    const bg = await page.locator("html").evaluate(el => getComputedStyle(el).backgroundImage);
    assert.equal(bg.includes("url("), false, "page backgrounds must not load image assets");
    if (family === "warm" && mode === "light") assert.equal(bg, "none", "warm light uses a solid page background");
    if (family === "classic" && mode === "dark") {
      assert.equal(bg, "none", "classic dark uses a solid navy canvas without blue light effects");
      const colors = await page.evaluate(() => {
        const paint = selector => {
          const style = getComputedStyle(document.querySelector(selector));
          return [style.backgroundColor, style.color];
        };
        return { canvas: getComputedStyle(document.documentElement).backgroundColor,
          primary: paint("#legal-onboarding-btn"), navigation: paint(".tab-button.active"),
          identity: getComputedStyle(document.querySelector('[data-character-features-tab="class"]')).color };
      });
      assert.deepEqual(colors, { canvas: "rgb(12, 23, 41)", primary: ["rgb(197, 164, 108)", "rgb(12, 23, 41)"],
        navigation: ["rgb(197, 164, 108)", "rgb(12, 23, 41)"], identity: "rgb(226, 201, 149)" },
      "classic dark uses brass actions with dark ink and pale gold identity labels");
    }
    await page.locator("#utility-menu-toggle").click();
    await screenshot(`${family}-${mode}-menu`);
    await page.locator("#color-mode-toggle").waitFor({ state: "visible" });
    await page.locator("#color-mode-toggle").focus();
    assert.equal(await page.locator("#color-mode-toggle").evaluate(el => document.activeElement === el), true, "brightness button receives keyboard focus");
    await page.keyboard.press("Space");
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), mode === "dark" ? "light" : "dark");
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), mode, "Enter restores brightness");
    await page.locator("#theme-toggle").focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("Space");
    assert.deepEqual(await page.evaluate(() => [document.documentElement.dataset.uiTheme, document.documentElement.dataset.theme]), [family, mode], "keyboard switches are independent");
    await page.locator("#utility-menu-toggle").click();

    for (const width of [320, 360, 390, 430, 720, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      for (const cls of ["fighter", "rogue"]) {
        await page.evaluate(() => showTab("basic"));
        await page.locator("#class").selectOption(cls);
        await page.evaluate(() => showTab("skills"));
        const layout = await page.evaluate(() => {
          const rect = el => el.getBoundingClientRect();
          const cells = [...document.querySelectorAll(".skill-cell")];
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            columns: getComputedStyle(document.querySelector(".skill-grid")).gridTemplateColumns.split(" ").length,
            bad: cells.some(cell => [...cell.querySelectorAll("input,label")].filter(el => rect(el).width > 0).some(el => rect(el).right > rect(cell).right + 1 || rect(el).left < rect(cell).left - 1)),
            checkboxes: [...document.querySelectorAll('.skill-rank-controls input')].filter(el => rect(el).width > 0).every(el => rect(el).width === 20 && rect(el).height === 20),
            legend: getComputedStyle(document.querySelector(".skill-legend")).display,
            expertise: !document.querySelector('#exp-運動').closest('label').hidden
          };
        });
        assert.equal(layout.overflow || layout.bad, false, JSON.stringify({ family, mode, width, cls, layout }));
        assert.equal(layout.checkboxes, true);
        assert.notEqual(layout.legend, "none");
        assert.equal(layout.expertise, cls === "rogue");
        assert.equal(layout.columns, width < 362 ? 1 : width < 518 ? 2 : width < 674 ? 3 : 4);
      }
      if (width === 720) await screenshot(`${family}-${mode}-skills-wide`);
      await page.evaluate(() => { TabletopMode.setMode("tabletop"); });
      await page.locator("#tabletop-tab-skills").click();
      assert.equal(await page.locator(".tabletop-skill-legend").isVisible(), true);
      assert.equal(await page.locator(".tabletop-skill-value").count(), 18);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await page.locator(".tabletop-skill-value > .tabletop-inline-roll").evaluateAll(els => els.every(el => el.getBoundingClientRect().height >= 44 && el.firstElementChild.classList.contains("tabletop-skill-value__rank"))), true);
      const tabletopSkillColumns = await page.locator(".tabletop-skill-values").evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length);
      assert.equal(tabletopSkillColumns, width < 340 ? 1 : width < 405 ? 2 : 3, JSON.stringify({ family, mode, width, tabletopSkillColumns }));
      if (width === 390) await screenshot(`${family}-${mode}-tabletop`);
      await page.evaluate(() => TabletopMode.setMode("sheet"));
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await screenshot(`${family}-${mode}-skills`);
    const prof = page.locator("#prof-運動");
    const checked = await prof.isChecked();
    await prof.locator("..").click();
    assert.equal(await prof.isChecked(), !checked);
    await prof.locator("..").click();
    await page.evaluate(() => quickBuild.open());
    await screenshot(`${family}-${mode}-quick-build`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.keyboard.press("Escape");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.evaluate(() => {
      const toggle = document.getElementById("dice-system-toggle");
      toggle.checked = true;
      toggle.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.locator("#dice-roller-fab").click();
    await page.locator('[data-die="20"]').click();
    await page.locator("#dice-roller-roll").click();
    const art = page.locator(".dice-roller-animation");
    await art.waitFor();
    assert((await art.getAttribute("src")).startsWith(family === "warm" ? "dice-warm-animated.webp?" : "dice.webp?"));
    await page.locator("#dice-roller-close").click();
    await page.emulateMedia({ reducedMotion: "reduce" });
    // Start each family/mode check with the same character data.
    await page.evaluate(() => showTab("basic"));
    await page.locator("#class").selectOption("rogue");
    await page.locator("#utility-menu-toggle").click();
  }

  // Existing users retain their brightness, including when no family is saved.
  await page.evaluate(() => { dndStorage.removeItem("dnd.uiTheme.v1"); dndStorage.setItem("dnd.theme.v1", "dark"); });
  await page.reload();
  assert.deepEqual(await page.evaluate(() => [document.documentElement.dataset.uiTheme, document.documentElement.dataset.theme]), ["warm", "dark"]);
  const blocked = await newUiPage(browser);
  await blocked.addInitScript(() => Object.defineProperty(window, "localStorage", { get() { throw new Error("Unavailable storage"); } }));
  await blocked.goto(url);
  await blocked.locator("#legal-close-btn").click();
  await blocked.locator("#utility-menu-toggle").click();
  await blocked.locator("#color-mode-toggle").click();
  await blocked.locator(".utility-menu__theme-switch").click();
  assert.deepEqual(await blocked.evaluate(() => [document.documentElement.dataset.uiTheme, document.documentElement.dataset.theme]), ["classic", "dark"]);
  await blocked.close();
  console.log("Appearance: four themes, persistence, keyboard, blocked storage, menu, skill layouts, tabletop and Quick Build passed.");
}

async function verifyAboutRoutes(browser, url) {
  const aboutPage = await newUiPage(browser, { viewport: { width: 320, height: 640 } });
  await aboutPage.route("**/legal-about.js?*", route => route.abort());
  await aboutPage.goto(`${url}#legal-about-modal`);
  await aboutPage.getByRole("button", { name: "重新載入" }).waitFor();
  await aboutPage.unroute("**/legal-about.js?*");
  await aboutPage.getByRole("button", { name: "重新載入" }).click();
  await aboutPage.getByRole("heading", { name: "SRD Attribution", exact: true }).waitFor();
  await aboutPage.keyboard.press("Escape");
  assert.equal(new URL(aboutPage.url()).hash, "");
  await aboutPage.goto(`${url}#character-sheet-download`);
  await aboutPage.locator("#character-sheet-download").waitFor();
  assert.equal(await aboutPage.locator(".app-dialog__body").evaluate(el => el.scrollTop > 0), true);
  await aboutPage.getByRole("button", { name: "回到角卡" }).click();
  await aboutPage.evaluate(() => { location.hash = "legal-about-modal"; });
  await aboutPage.getByRole("heading", { name: "SRD Attribution", exact: true }).waitFor();
  await aboutPage.evaluate(() => { location.hash = ""; });
  await aboutPage.locator("#legal-about-modal").waitFor({ state: "detached" });
  await aboutPage.close();
  console.log("About: lazy loading retry, routes, close and hash lifecycle passed.");
}

async function verifyPdf(page, fieldsOnly) {
  await page.addScriptTag({ url: "/pdf-field-map.js" });
  await page.evaluate(() => {
    for (const key of ["derived-feat-human-origin", "derived-feat-lessons-1", "derived-feat-lessons-2", "derived-feat-fighter-level-4", "derived-feat-warlock-level-8", "feat-0"]) {
      if (!buildPdfFieldPayload({ [key]: "強韌體魄" }).feats1.includes("HP上限+等級×2")) throw new Error(`PDF feat source: ${key}`);
    }
    if (!buildPdfFieldPayload({ "derived-feat-fighting-style-fighter-2": "防禦" }).feats1.includes("穿護甲時AC+1")) throw new Error("PDF second fighting style");
    const mirrored = buildPdfFieldPayload({
      "derived-feat-human-origin": "魔法學徒", "feat-choice-human-origin": "魔法學徒",
      "derived-feat-human-origin-magic-initiate-class": "wizard",
      "derived-feat-human-origin-magic-initiate-cantrip-1": "light",
      "derived-feat-human-origin-magic-initiate-cantrip-2": "mage-hand",
      "derived-feat-human-origin-magic-initiate-level-1": "shield"
    }).feats1;
    if ((mirrored.match(/魔法學徒/gu) || []).length !== 1 || !mirrored.includes("法師魔法學徒") || !mirrored.includes("光亮術") || !mirrored.includes("護盾術")) throw new Error("PDF derived Magic Initiate choices and mirror exclusion");
    for (const manualFeats of [true, false]) {
      const text = buildPdfFieldPayload({
        "manual-feat-management": manualFeats,
        __spellManagement: { version: 2, manual: true, entries: [] },
        "derived-feat-background": "魔法學徒",
        "derived-feat-background-magic-initiate-class": "wizard",
        "derived-feat-background-magic-initiate-cantrip-1": "light",
        "derived-feat-background-magic-initiate-cantrip-2": "mage-hand",
        "derived-feat-background-magic-initiate-level-1": "shield"
      }).feats1;
      if (!/魔法學徒/.test(text) || /光亮術|魔法伎倆|護盾術|◇|選1職業法表|2戲法/.test(text)) {
        throw new Error("manual spell PDFs retain the feat name without hidden automatic choices or free-use marks");
      }
    }
    const crowdedFeats = {
      "feat-0": "魔法學徒",
      "feat-0-magic-initiate-class": "wizard",
      "feat-0-magic-initiate-cantrip-1": "light",
      "feat-0-magic-initiate-cantrip-2": "mage-hand",
      "feat-0-magic-initiate-level-1": "shield",
      "feat-1": "警覺",
      "feat-2": "強韌體魄",
      "feat-3": "防禦"
    };
    for (const outputMode of ["editable", "compact"]) {
      const shortened = buildPdfFieldPayload(crowdedFeats, { outputMode });
      const featTitles = ["魔法學徒(起源)", "警覺(起源)", "強韌體魄(起源)", "防禦(戰鬥風格)"];
      if (shortened.feats1 !== featTitles.join("\n") || /光亮術|護盾術|先攻可加熟練|另有專長未列出/u.test(shortened.feats1)) {
        throw new Error(`PDF title-only feat fallback: ${outputMode}`);
      }
      if (shortened.classFeatures2.includes("其餘專長:")) throw new Error("PDF titles all fit without overflow");

      const manyFeats = { class: "sorcerer", level: "5", "class-extra": "原有職業內容", "skill-extra": "原有技能內容" };
      for (let i = 0; i < 13; i++) manyFeats[`feat-${i}`] = "強韌體魄";
      const overflow = buildPdfFieldPayload(manyFeats, { outputMode });
      const displayedTitles = (overflow.feats1.match(/強韌體魄\(起源\)/gu) || []).length;
      const trailingTitles = `其餘專長:${Array(4).fill("強韌體魄(起源)").join(", ")}`;
      const unwrappedExtra = overflow.classFeatures2.replace(/\n/g, "");
      if (displayedTitles !== 9 || !overflow.feats1.endsWith("另有專長未列出")) {
        throw new Error(`PDF feat overflow notice and nine intact titles: ${outputMode}`);
      }
      if (!unwrappedExtra.endsWith(trailingTitles) ||
          !unwrappedExtra.includes("原有職業內容") ||
          !unwrappedExtra.includes("原有技能內容") ||
          unwrappedExtra.indexOf("原有技能內容") > unwrappedExtra.indexOf("其餘專長:")) {
        throw new Error(`PDF feat spill preserves existing class features and appends all remaining titles: ${outputMode}`);
      }
    }
    const combined = buildPdfFieldPayload({ "derived-feat-background": "強韌體魄", "derived-feat-human-origin": "熟習", "derived-feat-fighting-style-fighter": "防禦", "feat-choice-human-origin": "熟習" }).feats1;
    if (!combined.includes("強韌體魄") || !combined.includes("熟習") || !combined.includes("防禦") || (combined.match(/熟習\(/gu) || []).length !== 1) throw new Error("PDF combined automatic feat sources");
    for (const [cls, id, name] of [
      ["druid", "druid-fixed-tool-proficiency", "草藥工具"],
      ["monk", "monk-tool-proficiency-1", "長笛"],
      ["rogue", "rogue-fixed-tool-proficiency", "盜賊工具"],
      ["bard", "bard-instrument-1", "里拉琴"]
    ]) {
      const state = { class: cls, level: "1", "tool-proficiency-0": "書法工具", [id]: name };
      if (buildPdfFieldPayload(state).toolsProficiency1 !== `書法工具、${name}`) throw new Error(`Class tool PDF: ${cls}`);
      state["tool-proficiency-0"] = name;
      if (buildPdfFieldPayload(state).toolsProficiency1 !== name) throw new Error(`Class tool PDF deduplication: ${cls}`);
    }
    for (const cls of Object.keys(ARMOR_TRAINING_BY_CLASS)) {
      const payload = buildPdfFieldPayload({ class: cls, level: "20" });
      const features = `${payload.classFeatures1}\n${payload.classFeatures2}`.replace(/\n(?!等級|選擇|語言)/gu, "");
      if (/^等級 \d+：[^（(\n]*子職$/mu.test(features) || !/^等級 3：.+[（(].*[）)]$/mu.test(features)) throw new Error(`PDF omits bare subclass heading only: ${cls}`);
    }
    const classFeatureLines = state => {
      const payload = buildPdfFieldPayload({ level: "8", ...state });
      return `${payload.classFeatures1}\n${payload.classFeatures2}`.split("\n");
    };
    for (const [state, expected, absent = []] of [
      [{ class: "barbarian" }, ["等級 1：狂暴、無甲防禦", "等級 1：武器精通", "等級 5：額外攻擊、快速移動", "等級 7：野性本能、直覺猛撲"]],
      [{ class: "cleric", "cleric-trickster": true }, ["等級 1：神聖使命／魔術使", "等級 7：神佑打擊"], ["選擇：魔術使"]],
      [{ class: "druid", "druid-elemental-fury-primal-strike": true }, ["等級 1：德魯伊語、施法", "等級 1：原初使命", "等級 7：元素狂怒／原初打擊"]],
      [{ class: "fighter", "derived-feat-fighting-style-fighter": "雙武器戰鬥", "derived-feat-fighting-style-fighter-2": "防禦" },
        ["等級 1：戰鬥風格／雙武器戰鬥", "等級 1：回氣、武器精通", "等級 7：額外戰鬥風格（勇士）", "選擇：防禦"]],
      [{ class: "paladin", "paladin-fighting-style": true, "derived-feat-fighting-style-paladin": "防禦" }, ["等級 1：聖療、施法、武器精通", "等級 2：戰鬥風格／防禦", "等級 5：額外攻擊、忠誠坐騎"]],
      [{ class: "paladin", "paladin-blessed-warrior": true, __spellManagement: { version: 2, manual: false, entries: [],
        classFeatureCantrips: { "class-paladin-blessed-warrior-cantrip-1": "guidance", "class-paladin-blessed-warrior-cantrip-2": "sacred-flame" } } },
        ["等級 2：受祝福的勇士", `選擇：${SpellCatalog.getSpell("guidance").nameZh}、${SpellCatalog.getSpell("sacred-flame").nameZh}`], ["等級 2：戰鬥風格"]],
      [{ class: "ranger", "derived-feat-fighting-style-ranger": "防禦" }, ["等級 1：施法、宿敵、武器精通", "等級 2：戰鬥風格"]],
      [{ class: "ranger", "ranger-druidic-warrior": true }, ["等級 2：德魯伊教戰士"], ["等級 2：戰鬥風格"]],
      [{ class: "rogue", "language-extra-2": "common-sign" }, ["等級 1：專精、偷襲、武器精通", "盜賊黑話、通用手語", "等級 7：反射閃避、可靠才能"]],
      [{ class: "rogue" }, ["盜賊黑話"]],
      [{ class: "sorcerer", "sorcerer-elemental-affinity-damage-type": "acid" }, ["等級 2：魔力泉湧、超魔法", "等級 6：元素親和（龍族）／強酸"]],
      [{ class: "warlock", "eldritch-invocation-10-1": true, "eldritch-invocation-10-2": true, "eldritch-invocation-10-3": true, "eldritch-invocation-0-1": true },
        ["等級 1：魔能祈喚、契約魔法", "魔能祈喚：刃之魔契,原初之一教習×3"]],
      [{ class: "wizard" }, ["等級 1：施法、儀式精通"]]
    ]) {
      const lines = classFeatureLines(state);
      const joined = lines.join("");
      for (const line of expected) {
        if (!lines.includes(line) && !joined.includes(line)) throw new Error(`PDF class feature line: ${state.class}/${line}`);
      }
      for (const line of absent) if (lines.includes(line)) throw new Error(`PDF class feature extra line: ${state.class}/${line}`);
    }
    const materialFlag = (spell, legacy = false) => {
      const state = legacy ? {
        [spell.level === 0 ? "cantrips-area-class-0" : `level${spell.level}spells-area-class-0`]: "wizard",
        [spell.level === 0 ? "cantrips-area-spell-0" : `level${spell.level}spells-area-spell-0`]: spell.spellId
      } : { __spellManagement: { version: 2, manual: true, entries: [{ spellId: spell.spellId }] } };
      return buildPdfFieldPayload(state)["sp-m-1"];
    };
    for (const spell of SpellCatalog.getAllSpells()) {
      const componentLine = spell.desc.split("\n").find(line => line.startsWith("成分:"));
      if (!componentLine || /^材料: (?:null|無)\s*$/mu.test(spell.desc)) throw new Error(`Spell components/empty materials: ${spell.spellId}`);
      const needsMaterial = componentLine.slice(3).trim().split(/[、,\s]+/u).includes("M");
      for (const legacy of [false, true]) {
        if (materialFlag(spell, legacy) !== needsMaterial) throw new Error(`PDF material component: ${spell.spellId}/legacy=${legacy}`);
      }
    }
    const originalCatalog = window.SpellCatalog;
    const guidance = originalCatalog.getSpell("guidance");
    try {
      for (const [desc, expectedMaterial] of [
        ["成分: V、S\n材料: null\n效果: 使用材料和 M 字樣。", false],
        ["成分: V、S\n材料: 無", false],
        ["成分: V、S、M\n材料: 一點磷", true],
        ["成分：S, M", true],
        ["成分: S\n效果: M", false],
        ["成分: \nM", false],
        ["效果: 材料成分: M", false],
        ["成分: SOMATIC", false]
      ]) {
        window.SpellCatalog = { ...originalCatalog, getSpell: id => id === guidance.spellId ? { ...guidance, desc } : originalCatalog.getSpell(id) };
        for (const legacy of [false, true]) {
          if (materialFlag(guidance, legacy) !== expectedMaterial) throw new Error(`PDF component field isolation: ${desc}/legacy=${legacy}`);
        }
      }
    } finally { window.SpellCatalog = originalCatalog; }
    const expected = new Set(["barbarian", "cleric", "druid", "fighter", "paladin", "ranger"]);
    for (const cls of Object.keys(ARMOR_TRAINING_BY_CLASS)) {
      if (buildPdfFieldPayload({ class: cls, level: "1" }).chk_shld1 !== expected.has(cls)) throw new Error(`Shield proficiency: ${cls}`);
    }
    for (const race of ["elf", "tiefling"]) for (const level of [1, 2, 3, 5]) {
      const payload = buildPdfFieldPayload({ race, level: String(level) }, { elfLineage: "high_elf", tieflingLegacy: "infernal" });
      if (payload.specie_features1.includes("長休後環法恢復") !== (level >= 3)) throw new Error(`Lineage recovery: ${race}/${level}`);
    }
    for (const outputMode of ["editable", "compact"]) {
      const notes = buildPdfFieldPayload({ "gear-notes": " 購買物品：箭矢(20)、 、法杖（長棍）\n\n\t長劍 ", "spell-notes": "第一段\n\n\n第二段" }, { outputMode });
      if (notes.equipment1 !== "購買物品：箭矢(20)、法杖（長棍）\n長劍" || !notes.extra1.endsWith("第一段\n\n第二段")) {
        throw new Error(`PDF equipment and notes keep only source line breaks: ${outputMode}`);
      }
    }
    // The official sheet reuses the shared payload under its own field names,
    // with 30 spell rows, 6 attack rows, every tool and notes after equipment.
    const officialState = window.__officialPdfState = {
      class: "wizard", level: "5", race: "elf", str: "8", int: "18", "save-int": "+7", "prof-int": true,
      "prof-奧秘": true, "skill-奧秘": "+7", "character-size": "中型", "hp-display": "32",
      "atk-main-name": "長棍", "atk-main-hit": "+2", "atk-main-dmg": "1d6-1 鈍擊",
      "tool-proficiency-0": "書法工具", "tool-proficiency-1": "煉金工具", "tool-proficiency-2": "製圖工具",
      "gear-notes": "長劍", "spell-notes": "筆記", "money-balance-gp": "15",
      __spellManagement: { version: 2, manual: true, entries: SpellCatalog.getAllSpells().filter(spell => spell.level <= 1).slice(0, 34).map(({ spellId }) => ({ spellId })) }
    };
    for (const outputMode of ["editable", "compact"]) {
      const shared = buildPdfFieldPayload(officialState, { outputMode });
      const official = buildPdfFieldPayload(officialState, { outputMode, sheetTemplate: "official", characterName: "艾尼克斯", englishName: "Enix" });
      const rowSuffixes = Array.from("123456789abcdefghijklmnopqrstu");
      if (["Name1", "Name2", "equipment1", "extra1", "strMod1", "sp-name-1"].some(name => name in official)) throw new Error(`Official PDF keeps only official field names: ${outputMode}`);
      if (official.name !== "艾尼克斯" || official.class !== "法師" || official.str !== "8" || official["str-m"] !== "-1" || official["int-st"] !== "+7" || official["int-st-c"] !== true) throw new Error(`Official PDF identity and abilities: ${outputMode}`);
      if (official["int-arc"] !== "+7" || official["int-arc-c"] !== true || official.size !== "中型" || official.max !== "32" || official["max-hd"] !== "5d6") throw new Error(`Official PDF skills and stats: ${outputMode}`);
      if (rowSuffixes.some(suffix => !official[`spn-${suffix}`]) || official["spn-1"] !== shared["sp-name-1"].replace(/\n/g, "")) throw new Error(`Official PDF fills 30 spell rows: ${outputMode}`);
      if (!official.spr1 || !official["spr-u"] || typeof official["chk-cu"] !== "boolean") throw new Error(`Official PDF irregular spell field names: ${outputMode}`);
      if (official.tool_pro !== "書法工具、煉金工具、製圖工具" || /其他工具熟練/u.test(official.Equip)) throw new Error(`Official PDF lists every tool: ${outputMode}`);
      if (!official.Equip.startsWith("長劍\n") || !official.Equip.includes("其他準備法術") || !official.Equip.endsWith("筆記")) throw new Error(`Official PDF appends notes to equipment: ${outputMode}`);
      if (Object.keys(official).some(name => /^(?:attack-wp-name|tohit|dmg-type|note)7$/.test(name))) throw new Error(`Official PDF has six attack rows: ${outputMode}`);
      if (official["attack-wp-name1"] !== shared["attack-weap-name-1"] || official.GP !== "15") throw new Error(`Official PDF attacks and coins: ${outputMode}`);
    }
    // Official languages start with Common and take the rogue and ranger
    // class languages out of class features; third-party output is unchanged.
    for (const [state, languages, classLine] of [
      [{ class: "rogue", level: "1", language1: "elvish", "language-extra-2": "common-sign" }, "通用語、精靈語、盜賊黑話、通用手語", "盜賊黑話、通用手語"],
      [{ class: "ranger", level: "2", "language-extra-1": "elvish", "language-extra-2": "giant" }, "通用語、精靈語、巨人語", "精靈語、巨人語"],
      [{ class: "ranger", level: "1", "language-extra-1": "elvish" }, "通用語", null]
    ]) {
      const official = buildPdfFieldPayload(state, { sheetTemplate: "official" });
      const shared = buildPdfFieldPayload(state);
      const officialFeatures = `${official["class-a-1"]}\n${official["class-a-2"]}`.split("\n");
      if (official.Lang !== languages || (classLine && officialFeatures.includes(classLine))) throw new Error(`Official PDF languages: ${state.class}/${state.level}`);
      if (classLine && !`${shared.classFeatures1}\n${shared.classFeatures2}`.split("\n").includes(classLine)) throw new Error(`Third-party class languages unchanged: ${state.class}`);
    }
    // A bare shield attack row is dropped on the official sheet only, and
    // attack cantrips (or a following weapon) move up into it.
    const shieldState = {
      class: "cleric", level: "1", "spell-save-dc": "13",
      "atk-main-name": "硬頭錘", "atk-main-hit": "+4", "atk-main-dmg": "1d6+2 鈍擊", "atk-off-name": "盾牌", "atk-off-note": "盾面繪有聖徽",
      __spellManagement: { version: 2, manual: true, entries: [{ spellId: "sacred-flame" }] }
    };
    for (const note of ["盾面繪有聖徽", ""]) {
      const official = buildPdfFieldPayload({ ...shieldState, "atk-off-note": note }, { sheetTemplate: "official" });
      if (official["attack-wp-name1"] !== "硬頭錘" || official["attack-wp-name2"] !== "聖火術" || official.note2 === "盾面繪有聖徽") throw new Error(`Official PDF drops the shield row: ${note || "bare"}`);
    }
    if (buildPdfFieldPayload(shieldState)["attack-weap-name-2"] !== "盾牌") throw new Error("Third-party PDF keeps the shield row");
    if (buildPdfFieldPayload({ ...shieldState, "atk-off-note": "盾擊" }, { sheetTemplate: "official" })["attack-wp-name2"] !== "盾牌") throw new Error("Official PDF keeps a shield row with other notes");
    const shieldFirst = buildPdfFieldPayload({ "atk-main-name": "盾牌", "atk-off-name": "短劍", "atk-off-hit": "+4" }, { sheetTemplate: "official" });
    if (shieldFirst["attack-wp-name1"] !== "短劍" || shieldFirst.tohit1 !== "+4" || shieldFirst["attack-wp-name2"]) throw new Error("Official PDF moves the weapon after a dropped shield row up");
  });
  console.log("PDF fields: 217 spell material flags (current/legacy), component field isolation, class tools/shields, lineage levels and official sheet field names passed.");
  if (fieldsOnly) return;
  await page.addScriptTag({ url: "/pdf-lib.custom.min.js" });
  await page.addScriptTag({ url: "/fontkit.custom.min.js" });
  await page.addScriptTag({ url: "/pdf-export.js" });
  await page.evaluate(async () => {
    const expected = new Set(["barbarian", "cleric", "druid", "fighter", "paladin", "ranger"]);
    const template = await PDFLib.PDFDocument.load(await (await fetch('/5e_char_sheet.pdf')).arrayBuffer());
    const originalName2 = template.getForm().getTextField('Name2').acroField.getWidgets()[0].getRectangle();
    const checkNames = (form, mode) => {
      const name1 = form.getTextField('Name1');
      const name2 = form.getTextField('Name2');
      const first = name1.acroField.getWidgets()[0].getRectangle();
      const second = name2.acroField.getWidgets()[0].getRectangle();
      if (name1.getAlignment() !== PDFLib.TextAlignment.Center || name2.getAlignment() !== PDFLib.TextAlignment.Center) throw new Error(`Name alignment: ${mode}`);
      if (Math.abs(first.x - second.x) > 0.001 || Math.abs(first.width - second.width) > 0.001) throw new Error(`Name horizontal bounds: ${mode}`);
      if (second.y !== originalName2.y || second.height !== originalName2.height) throw new Error(`Name2 vertical bounds: ${mode}`);
    };
    // Exercise the actual exporter and reopen its serialized editable PDF.
    const create = URL.createObjectURL.bind(URL);
    let blob;
    URL.createObjectURL = value => { blob = value; return create(value); };
    try {
      for (const [cls, level, feats] of [
        ["fighter", "7", { "derived-feat-human-origin": "熟習", "derived-feat-fighting-style-fighter-2": "防禦" }],
        ["wizard", "4", { "derived-feat-wizard-level-4": "強韌體魄" }],
        ["warlock", "2", { "derived-feat-lessons-1": "強韌體魄", "derived-feat-lessons-2": "熟習" }]
      ]) {
        const state = { class: cls, level, ...feats };
        await exportCharacterPdfFromState(state, { outputMode: "editable", characterName: "UI regression", englishName: "Enix Zakarum" });
        const document = await PDFLib.PDFDocument.load(await blob.arrayBuffer());
        if (document.getForm().getTextField('feats1').getText() !== buildPdfFieldPayload(state).feats1) throw new Error(`Serialized automatic feats: ${cls}`);
        if (document.getForm().getCheckBox("chk_shld1").isChecked() !== expected.has(cls)) throw new Error(`Serialized shield checkbox: ${cls}`);
        checkNames(document.getForm(), 'editable');
        if (document.getForm().getTextField('Name1').getText() !== 'UI regression') throw new Error('Serialized character name');
        if (document.getForm().getTextField('Name2').getText() !== 'Enix Zakarum') throw new Error('Serialized editable English name');
      }
      // Compact removes the form, so inspect the generated appearances just
      // before flattening, then verify the saved document has no AcroForm.
      const flatten = PDFLib.PDFForm.prototype.flatten;
      let checkedCompact = false;
      PDFLib.PDFForm.prototype.flatten = function (options) {
        checkNames(this, 'compact');
        if (this.getTextField('Name2').getText() !== 'Enix Zakarum') throw new Error('Compact English name');
        for (const field of ['Name1', 'Name2']) {
          if (!this.getTextField(field).acroField.getWidgets()[0].getAppearances()?.normal) throw new Error(`Name appearance: ${field}`);
        }
        checkedCompact = true;
        return flatten.call(this, options);
      };
      try {
        await exportCharacterPdfFromState({ class: 'fighter', level: '1' }, { outputMode: 'compact', characterName: '艾尼克斯', englishName: 'Enix Zakarum' });
        const compact = await PDFLib.PDFDocument.load(await blob.arrayBuffer());
        if (!checkedCompact || compact.catalog.has(PDFLib.PDFName.of('AcroForm'))) throw new Error('Compact flattening');
        const measurement = await validateCompactEnglishName('Enix Zakarum');
        if (Math.abs(measurement.maxWidth - (140.47 - 3)) > 0.001) throw new Error('English name validation width');
        const editableMeasurement = await validatePdfEnglishName('Enix Zakarum', 'editable');
        if (!editableMeasurement.fits || Math.abs(editableMeasurement.maxWidth - (245.080856 - 112.61348 - 4)) > 0.001) throw new Error('Editable English name validation width');
      } finally { PDFLib.PDFForm.prototype.flatten = flatten; }

      // A field's DA font must never resolve to an embedded font in DR: a
      // reader redrawing or editing with pdf-lib's Identity-H font shows
      // nothing, both for the filled value and for typed input. Third-party
      // leaves the alias unresolved so the reader picks its own font.
      const checkEditingFont = (form, label, expectedAlias) => {
        const { PDFDict, PDFName, PDFTextField } = PDFLib;
        const fonts = form.acroForm.dict.lookupMaybe(PDFName.of("DR"), PDFDict)?.lookupMaybe(PDFName.of("Font"), PDFDict);
        const aliases = new Set(form.getFields().filter(field => field instanceof PDFTextField)
          .map(field => /\/([^\s/]+)\s+[\d.]+\s+Tf/.exec(field.acroField.getDefaultAppearance() || "")?.[1]));
        if (aliases.size !== 1 || (expectedAlias && !aliases.has(expectedAlias))) throw new Error(`Editable field font alias: ${label} ${[...aliases].join(",")}`);
        const font = fonts?.lookupMaybe(PDFName.of([...aliases][0]), PDFDict);
        const descriptor = font?.lookup(PDFName.of("DescendantFonts"))?.lookup(0, PDFDict)?.lookup(PDFName.of("FontDescriptor"), PDFDict);
        if (descriptor && ["FontFile", "FontFile2", "FontFile3"].some(key => descriptor.has(PDFName.of(key)))) throw new Error(`Editable field font is not embedded: ${label}`);
      };

      // equipment1/extra1 appearances use measured lines that pdf-lib keeps
      // as drawn; the editable value keeps only the player's line breaks.
      const gear = "書法工具、書籍（禱文）、聖徽、羊皮紙 ×10、祭祀長袍、8 金幣、探索套組、繩索、火把 ×10、口糧 ×5\n長劍";
      const spellNotes = `${"法術書：火球術(3環)、魔法飛彈(1環)、".repeat(4)}Thieves' Cant`;
      const provider = PDFLib.defaultTextFieldAppearanceProvider;
      try {
        for (const outputMode of ["editable", "compact"]) {
          const drawn = {};
          PDFLib.defaultTextFieldAppearanceProvider = (field, widget, font) => {
            const name = field.getName();
            if (name === "equipment1" || name === "extra1") {
              const lines = field.getText().split("\n");
              const fontSize = Number(/([\d.]+)\s+Tf/.exec(field.acroField.getDefaultAppearance())[1]);
              const rectangle = widget.getRectangle();
              const width = rectangle.width - 2 * ((widget.getBorderStyle()?.getWidth() ?? 0) + 1);
              const layout = PDFLib.layoutMultilineText(lines.join("\n"), { alignment: PDFLib.TextAlignment.Left, fontSize, font, bounds: { x: 0, y: 0, width, height: rectangle.height } });
              if (lines.some(line => font.widthOfTextAtSize(line, fontSize) >= width) || layout.lines.length !== lines.length) throw new Error(`Measured wrap fits without pdf-lib re-split: ${outputMode}/${name}`);
              drawn[name] = { lines, fontSize, value: Object.getPrototypeOf(field).getText() };
            }
            return provider(field, widget, font);
          };
          const state = { class: "wizard", level: "1", "gear-notes": gear, "spell-notes": spellNotes };
          await exportCharacterPdfFromState(state, { outputMode, characterName: "UI regression" });
          const { equipment1, extra1 } = drawn;
          if (!equipment1 || !extra1) throw new Error(`Measured wrap appearances drawn: ${outputMode}`);
          const compactText = text => text.replace(/\s/g, "");
          if (compactText(equipment1.lines.join("")) !== compactText(gear) || equipment1.lines.at(-1) !== "長劍") throw new Error(`Measured wrap keeps equipment content and source breaks: ${outputMode}`);
          if (equipment1.lines.some(line => /羊皮紙$|、8$|（[^）]*$|^[×、）]|^金幣/u.test(line))) throw new Error(`Measured wrap keeps quantities and brackets intact: ${outputMode}`);
          if (!compactText(extra1.lines.join("")).endsWith(compactText(spellNotes))) throw new Error(`Measured wrap keeps notes content: ${outputMode}`);
          const sizes = outputMode === "editable" ? [9, 9, 9, 10] : [9, 11, 9, 11];
          if (equipment1.fontSize < sizes[0] || equipment1.fontSize > sizes[1] || extra1.fontSize < sizes[2] || extra1.fontSize > sizes[3]) throw new Error(`Measured wrap font sizes: ${outputMode}`);
          if (outputMode === "editable") {
            // pdf-lib's old re-split broke this line at the space before "×10".
            if (!equipment1.lines[0].includes("羊皮紙 ×10")) throw new Error("Measured wrap fills the editable line");
            const form = (await PDFLib.PDFDocument.load(await blob.arrayBuffer())).getForm();
            checkEditingFont(form, "third-party");
            const payload = buildPdfFieldPayload(state, { outputMode });
            for (const name of ["equipment1", "extra1"]) {
              const field = form.getTextField(name);
              if (field.getText() !== payload[name] || drawn[name].value !== payload[name]) throw new Error(`Editable value keeps source breaks only: ${name}`);
              if (!/\s9\s+Tf/.test(field.acroField.getDefaultAppearance())) throw new Error(`Editable editing font size restored: ${name}`);
            }
          }
        }
      } finally { PDFLib.defaultTextFieldAppearanceProvider = provider; }

      // Official sheet: every payload value matches a template field of the
      // same kind, template checkbox drawings survive, and compact flattens.
      const officialTemplate = (await PDFLib.PDFDocument.load(await (await fetch('/5e_char_sheet_of.pdf')).arrayBuffer())).getForm();
      const officialState = { ...window.__officialPdfState, "heroic-inspiration": true };
      for (const outputMode of ["editable", "compact"]) {
        for (const [name, value] of Object.entries(buildPdfFieldPayload(officialState, { outputMode, sheetTemplate: "official", characterName: "x" }))) {
          if ((typeof value === "boolean") !== (officialTemplate.getField(name) instanceof PDFLib.PDFCheckBox)) throw new Error(`Official field kind: ${name}`);
        }
      }
      const checkedAppearance = (form, name) => {
        const normal = form.getCheckBox(name).acroField.getWidgets()[0].getAppearances().normal;
        return Array.from(form.doc.context.lookup(normal.get(PDFLib.PDFName.of("0"))).getContents()).join(",");
      };
      await exportCharacterPdfFromState(officialState, { outputMode: "editable", sheetTemplate: "official", characterName: "艾尼克斯・薩卡蘭姆", englishName: "Enix" });
      const officialForm = (await PDFLib.PDFDocument.load(await blob.arrayBuffer())).getForm();
      checkEditingFont(officialForm, "official", "AdobeFanHeitiStd-Bold");
      if (officialForm.getTextField("name").getText() !== "艾尼克斯‧薩卡蘭姆") throw new Error("Official name uses a glyph the font has");
      if (!officialForm.getCheckBox("hero insp").isChecked() || officialForm.getCheckBox("light").isChecked()) throw new Error("Official checkbox values");
      for (const name of ["hero insp", "light", "ds1s", "chk-c1"]) {
        if (checkedAppearance(officialForm, name) !== checkedAppearance(officialTemplate, name)) throw new Error(`Official checkbox keeps template drawing: ${name}`);
      }
      const avatarImageDrawn = form => {
        const normal = form.getFields().find(field => field.getName().endsWith("_af_image")).acroField.getWidgets()[0].getAppearances()?.normal;
        return Boolean(normal?.dict?.lookup(PDFLib.PDFName.of("Resources"))?.lookup(PDFLib.PDFName.of("XObject")));
      };
      if (avatarImageDrawn(officialForm)) throw new Error("Official avatar box stays empty without an avatar");
      // A WebP avatar (the format the cropper saves) fills the appearance box.
      const avatarCanvas = document.createElement("canvas");
      avatarCanvas.width = avatarCanvas.height = 64;
      avatarCanvas.getContext("2d").fillRect(0, 0, 32, 32);
      const avatarDataUrl = avatarCanvas.toDataURL("image/webp", 0.82);
      const avatarResult = await exportCharacterPdfFromState(officialState, { outputMode: "editable", sheetTemplate: "official", characterName: "艾尼克斯", avatarDataUrl });
      const avatarForm = (await PDFLib.PDFDocument.load(await blob.arrayBuffer())).getForm();
      if (!avatarResult.avatarPlaced || !avatarImageDrawn(avatarForm)) throw new Error("Official editable avatar");
      const compactAvatar = await exportCharacterPdfFromState(officialState, { outputMode: "compact", sheetTemplate: "official", characterName: "艾尼克斯", avatarDataUrl });
      const officialCompact = await PDFLib.PDFDocument.load(await blob.arrayBuffer());
      if (!compactAvatar.avatarPlaced || officialCompact.catalog.has(PDFLib.PDFName.of("AcroForm")) || officialCompact.getPageCount() !== 2) throw new Error("Official compact flattening with avatar");
      const thirdPartyAvatar = await exportCharacterPdfFromState({ class: "fighter", level: "1" }, { outputMode: "compact", characterName: "x", avatarDataUrl });
      if (thirdPartyAvatar.avatarPlaced) throw new Error("Third-party sheet has no avatar box");
      if (!(await validatePdfEnglishName("Enix".repeat(40), "editable", "official")).fits) throw new Error("Official sheet ignores the English name");
      const officialName = await validatePdfCharacterName("艾尼克斯", "compact", "official");
      if (!officialName.fits || Math.abs(officialName.maxWidth - (253.7608 - 26.9363 - 4)) > 0.001) throw new Error("Official name validation width");
    } finally { URL.createObjectURL = create; }
  });
  console.log("PDF export: 8 actual PDFs checked, including automatic feat sources, shared name centering, measured equipment/notes wrapping in both modes and both official sheet versions.");
}

async function prepareToastFixture(page) {
  await page.setContent("<!doctype html><html><body></body></html>");
  await page.addStyleTag({ path: path.join(__dirname, "styles.css") });
  await page.addScriptTag({ path: path.join(__dirname, "app-dialog.js") });
}

async function toastMessages(page) {
  return page.locator("#app-toast .app-toast__message").allTextContents();
}

async function assertStackOrder(page) {
  const tops = await page.locator("#app-toast .app-toast").evaluateAll(toasts =>
    toasts.map(toast => toast.getBoundingClientRect().top)
  );
  assert(tops.every((top, index) => index === 0 || top < tops[index - 1]), `Newest toast must be above older toasts: ${tops}`);
}

async function swipeToast(page, index, direction, distance) {
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

async function dragToast(page, index, distance) {
  const box = await page.locator(".app-toast__message").nth(index).boundingBox();
  assert(box);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + distance, y, { steps: 8 });
  await page.mouse.up();
}

// Share methods are whole choice cards; short URLs fail visibly and never retry.
async function verifyShareDialog(browser, url) {
  const page = await newUiPage(browser, { viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  try {
    await page.goto(url);
    await page.locator("#legal-ack-btn").click();
    await page.evaluate(() => { window.copiedShareUrls = []; navigator.clipboard.writeText = async value => { copiedShareUrls.push(value); }; });
    const dialog = page.getByRole("dialog", { name: "分享角色卡", exact: true });
    const cards = dialog.locator("button.share-dialog__option");
    const open = async () => { await page.evaluate(() => { copyShareUrl(); }); await dialog.waitFor(); };
    await open();
    await dialog.getByText("分享角色卡無法分享跑團模式的自訂按鈕和自創法術，請注意。", { exact: true }).waitFor();
    assert.deepEqual(await dialog.locator(".app-dialog__actions button").allInnerTexts(), ["取消"]);
    assert.equal(await cards.count(), 2);
    assert.equal(await cards.first().isDisabled(), true, "local origin disables short URL");
    assert.match(await cards.first().innerText(), /短網址僅能在正式網站使用/);
    assert.equal(await cards.last().evaluate(node => document.activeElement === node), true);
    assert.equal(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth + 1), true, "share cards fit 390px");
    await dialog.getByRole("button", { name: "取消", exact: true }).click();
    await dialog.waitFor({ state: "detached" });
    await page.evaluate(() => {
      window.getShortShareUnavailableReason = () => "";
      window.shortShareCalls = 0;
      window.createShortShareUrl = async () => { shortShareCalls += 1; throw new Error("offline"); };
    });
    await open();
    await cards.first().focus();
    await page.keyboard.press("ArrowDown");
    assert.equal(await cards.last().evaluate(node => document.activeElement === node), true);
    await cards.first().click();
    await dialog.getByText("短網址建立失敗，請稍後再試，或改用完整資料網址。", { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => shortShareCalls), 1, "failed short URL is not retried");
    assert.equal(await cards.last().isDisabled(), false);
    assert.equal(await page.evaluate(() => copiedShareUrls.length), 0, "failure never copies the long URL");
    await cards.last().click();
    await dialog.waitFor({ state: "detached" });
    assert.match(await page.evaluate(() => copiedShareUrls[0]), /#s2?=/);
    await page.evaluate(() => {
      window.createShortShareUrl = (hash, signal) => new Promise((resolve, reject) => {
        signal.addEventListener("abort", () => { window.shortShareAborted = true; reject(new Error("aborted")); });
      });
    });
    await open();
    await cards.first().click();
    assert.equal(await cards.first().getAttribute("aria-busy"), "true");
    assert.equal(await cards.last().isDisabled(), true);
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    assert.equal(await page.evaluate(() => window.shortShareAborted), true, "closing cancels the pending request");
    await page.evaluate(() => { window.createShortShareUrl = async () => "https://twd20.com/s/Abc1234"; });
    await open();
    await cards.first().click();
    await dialog.waitFor({ state: "detached" });
    assert.deepEqual(await page.evaluate(() => copiedShareUrls.slice(1)), ["https://twd20.com/s/Abc1234"]);
    console.log("Share dialog: choice cards, unavailable reason, failure without retry, cancel and copy passed.");
  } finally { await page.close(); }
}

async function verifyToasts(browser) {
  const desktop = await newUiPage(browser, { viewport: { width: 1280, height: 800 } });
  const errors = [];
  desktop.on("pageerror", error => errors.push(String(error)));
  await prepareToastFixture(desktop);
  await verifyToastPointerIsolation(desktop, false);
  await verifyDialogBackgroundOwnership(desktop);
  await desktop.evaluate(() => {
    AppDialog.notify("第一則", { duration: 10000 });
    AppDialog.notify("第二則", { duration: 10000, variant: "dice-roll" });
    AppDialog.notify("第三則", { duration: 10000 });
  });
  await desktop.waitForTimeout(250);
  assert.deepEqual(await toastMessages(desktop), ["第一則", "第二則", "第三則"]);
  await assertStackOrder(desktop);
  assert.equal(await desktop.locator("#app-toast").evaluate(stack => {
    const rect = stack.getBoundingClientRect();
    return rect.top > window.innerHeight / 2 && rect.bottom > window.innerHeight - 20;
  }), true, "Toast stack should open at the bottom of the viewport");
  assert.equal(await desktop.locator(".app-toast button").count(), 0, "Toasts have no close button");
  assert.equal(await desktop.locator('.app-toast[data-variant="dice-roll"]').count(), 1);
  assert.equal(await desktop.locator(".app-toast").evaluateAll(toasts =>
    toasts[1].getBoundingClientRect().left < toasts[2].getBoundingClientRect().left
  ), true, "Dice roll toast should keep its left alignment");
  await desktop.evaluate(() => AppDialog.notify("第四則", { duration: 10000 }));
  await desktop.waitForTimeout(250);
  assert.deepEqual(await toastMessages(desktop), ["第二則", "第三則", "第四則"]);
  await assertStackOrder(desktop);
  await dragToast(desktop, 1, -160);
  await desktop.waitForFunction(() => document.querySelectorAll("#app-toast .app-toast").length === 2);
  assert.equal(await desktop.locator(".app-toast").last().evaluate(toast =>
    toast.getAnimations().some(animation => animation.effect.getKeyframes().some(frame => frame.translate))
  ), true, "Remaining toast should animate into the empty space");
  await desktop.waitForTimeout(250);
  assert.deepEqual(await toastMessages(desktop), ["第二則", "第四則"]);
  await assertStackOrder(desktop);
  assert.deepEqual(errors, []);
  await desktop.close();

  const mobile = await newUiPage(browser, { viewport: { width: 390, height: 844 }, hasTouch: true });
  mobile.on("pageerror", error => errors.push(String(error)));
  await prepareToastFixture(mobile);
  await verifyToastPointerIsolation(mobile, true);
  await verifyToastHold(mobile);
  await mobile.evaluate(() => {
    AppDialog.notify("甲", { duration: 10000 });
    AppDialog.notify("乙", { duration: 10000 });
    AppDialog.notify("丙", { duration: 10000 });
  });
  await mobile.waitForTimeout(250);
  await swipeToast(mobile, 1, 1, 160);
  await mobile.waitForFunction(() => document.querySelectorAll("#app-toast .app-toast").length === 2);
  assert.equal(await mobile.locator(".app-toast").last().evaluate(toast =>
    toast.getAnimations().some(animation => animation.effect.getKeyframes().some(frame => frame.translate))
  ), true, "Toast above a swiped item should slide down");
  await mobile.waitForTimeout(250);
  assert.deepEqual(await toastMessages(mobile), ["甲", "丙"]);
  await assertStackOrder(mobile);
  await swipeToast(mobile, 0, -1, 160);
  await mobile.waitForFunction(() => document.querySelectorAll("#app-toast .app-toast").length === 1);
  assert.deepEqual(await toastMessages(mobile), ["丙"]);
  await swipeToast(mobile, 0, 1, 30);
  assert.deepEqual(await toastMessages(mobile), ["丙"], "Short swipe must keep the toast");
  await mobile.evaluate(() => AppDialog.notify("短暫", { duration: 80 }));
  await mobile.getByText("短暫").waitFor({ state: "visible" });
  await mobile.waitForFunction(() => !Array.from(document.querySelectorAll(".app-toast__message")).some(el => el.textContent === "短暫"));
  assert.deepEqual(await toastMessages(mobile), ["丙"], "Each toast keeps its own timeout");
  assert.deepEqual(errors, []);
  await mobile.close();

  const reduced = await newUiPage(browser, { viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: "reduce" });
  await prepareToastFixture(reduced);
  await reduced.evaluate(() => {
    AppDialog.notify("低動態一", { duration: 10000 });
    AppDialog.notify("低動態二", { duration: 10000 });
  });
  await swipeToast(reduced, 0, 1, 160);
  assert.deepEqual(await toastMessages(reduced), ["低動態二"]);
  await reduced.close();

  console.log("AppDialog toast stack, timeout, mouse drag, hold timeout, and touch swipes passed.");
}

async function verifyToastPointerIsolation(page, touch) {
  // Exercise the important order: existing toast, then background-inert dialog.
  await page.evaluate(() => {
    AppDialog.notify("隔離測試", { duration: 10000 });
    window.toastPageEvents = 0;
    window.toastUnderlyingClicks = 0;
    window.toastPageListener = () => { window.toastPageEvents++; };
    for (const type of ["pointerdown", "pointerup", "click"]) {
      document.addEventListener(type, window.toastPageListener);
    }
    AppDialog.showContent({ title: "Toast 隔離測試", allowNested: true });
    const button = document.createElement("button");
    button.id = "toast-underlying-button";
    button.textContent = "下方操作";
    button.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:12800";
    button.addEventListener("click", () => { window.toastUnderlyingClicks++; });
    document.body.append(button);
  });
  const message = page.locator(".app-toast__message").last();
  assert.equal(await message.evaluate(el => {
    const rect = el.getBoundingClientRect();
    return !el.closest("[inert]") && el.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
  }), true, "Toast must remain above the overlay and accept pointer input");
  if (touch) await message.tap();
  else await message.click();
  assert.deepEqual(await page.evaluate(() => [window.toastPageEvents, window.toastUnderlyingClicks]), [0, 0]);
  await page.evaluate(() => { void AppDialog.showContent({ title: "巢狀測試" }); });
  assert.equal(await page.locator("#app-toast").evaluate(el => el.inert), false, "Nested dialogs must not disable existing toasts");
  await page.evaluate(() => AppDialog.notify("視窗內提示", { duration: 10000 }));
  if (touch) await swipeToast(page, 1, 1, 160);
  else await dragToast(page, 1, 160);
  await page.waitForFunction(() => document.querySelectorAll(".app-toast").length === 1);
  assert.equal((await toastMessages(page)).includes("視窗內提示"), false);
  assert.deepEqual(await page.evaluate(() => [window.toastPageEvents, window.toastUnderlyingClicks]), [0, 0], "Closing a toast must not activate page actions");
  await page.evaluate(() => {
    for (const type of ["pointerdown", "pointerup", "click"]) {
      document.removeEventListener(type, window.toastPageListener);
    }
    document.getElementById("toast-underlying-button").remove();
  });
  await page.locator(".app-dialog__close").last().click();
  await page.locator(".app-dialog__close").last().click();
  assert.equal(await page.locator("#app-toast").evaluate(el => el.inert), false);
  if (touch) await swipeToast(page, 0, -1, 160);
  else await dragToast(page, 0, -160);
  await page.waitForFunction(() => !document.querySelector(".app-toast"));
}

async function verifyDialogBackgroundOwnership(page) {
  const inertState = () => page.evaluate(() => ["page", "locked"].map(id => document.getElementById(id).inert));
  await page.evaluate(() => {
    document.body.insertAdjacentHTML("beforeend", '<main id="page"></main><section id="locked"></section>');
    document.getElementById("locked").inert = true;
  });
  // Another lock released while the dialog is open must stay released.
  await page.evaluate(() => {
    void AppDialog.showContent({ title: "外部鎖定" });
    document.getElementById("locked").inert = false;
  });
  assert.deepEqual(await inertState(), [true, false]);
  await page.locator(".app-dialog__close").click();
  assert.deepEqual(await inertState(), [false, false], "closing a dialog must not restore a lock released by its owner");

  // A dialog opened under another lock, then replaced, must not lock the page again.
  await page.evaluate(() => {
    document.getElementById("page").inert = true;
    void AppDialog.showContent({ title: "被取代" });
    document.getElementById("page").inert = false;
    void AppDialog.showContent({ title: "取代者" });
  });
  assert.deepEqual(await inertState(), [true, true]);
  await page.locator(".app-dialog__close").click();
  assert.deepEqual(await inertState(), [false, false], "a replaced dialog must not restore an outdated lock");

  // Nested dialogs release the page only when the parent closes.
  await page.evaluate(() => {
    void AppDialog.showContent({ title: "父視窗", allowNested: true });
    void AppDialog.showContent({ title: "子視窗" });
  });
  assert.equal(await page.locator(".app-dialog").first().evaluate(el => el.inert), true);
  await page.locator(".app-dialog__close").last().click();
  assert.deepEqual([await page.locator(".app-dialog").evaluate(el => el.inert), ...await inertState()], [false, true, true]);
  await page.locator(".app-dialog__close").click();
  assert.deepEqual(await inertState(), [false, false]);
  await page.evaluate(() => document.querySelectorAll("#page, #locked").forEach(el => el.remove()));
}

async function verifyToastHold(page) {
  const selector = ".app-toast__message";
  await page.evaluate(() => AppDialog.notify("按住保留", { duration: 800 }));
  const box = await page.locator(selector).boundingBox();
  assert(box);
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] });
    await page.waitForTimeout(1000);
    assert.deepEqual(await toastMessages(page), ["按住保留"], "Holding any part of the toast must pause its timeout");
    // Cancellation must resume the remaining timer.
    await cdp.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
    await page.waitForTimeout(100);
    assert.deepEqual(await toastMessages(page), ["按住保留"], "Release must resume the remaining time, not expire immediately");
    await page.waitForFunction(() => !document.querySelector(".app-toast"));
  } finally { await cdp.detach(); }
}

async function verifyFeatureChoiceDisclosures(browser, url) {
  for (const width of [1280, 390]) {
    const page = await newUiPage(browser, { viewport: { width, height: 900 }, reducedMotion: "reduce" });
    try {
      await page.goto(url);
      await page.locator("#legal-close-btn").click();
      for (const [cls, level, tab, disclosureId, outputId, summaryId, inputSelector] of [
        ["sorcerer", "2", "超魔", "metamagic-options-disclosure", "metamagicOptions", "metamagic-summary", "input[data-metamagic-name]"],
        ["warlock", "1", "魔祈", "invocation-options-disclosure", "eldritch-invocations-output", "warlock-invocation-summary", 'input[data-invocation-name="魔能意志"]']
      ]) {
        await page.locator("#class").selectOption(cls);
        await page.locator("#level").selectOption(level);
        await page.locator('[data-character-features-tab="class"]').click();
        await page.getByRole("tab", { name: tab, exact: true }).click();
        const source = await page.evaluate(() => JSON.stringify(classFeatures));
        const details = page.locator("#" + disclosureId);
        const summary = details.locator(":scope > summary");
        const input = page.locator("#" + outputId).locator(inputSelector).first();
        assert.equal(await details.evaluate(el => el.open), true, "options start expanded");
        await input.check();
        const inputId = await input.getAttribute("id");
        const selectedText = await page.locator("#" + summaryId).innerText();
        const state = await page.evaluate(() => collectStateObject());
        const share = await page.evaluate(() => collectShareState());
        await summary.focus();
        await page.keyboard.press("Space");
        await page.waitForFunction(id => !document.getElementById(id).open, disclosureId);
        assert.equal(await input.isVisible(), false, "closed disclosure hides checkbox list");
        assert.equal(await page.locator("#" + summaryId).isVisible(), true, "chosen content remains visible");
        assert.equal(await page.locator("#" + summaryId).innerText(), selectedText);
        assert.deepEqual(await page.evaluate(() => collectStateObject()), state, "collapse preserves character state");
        assert.deepEqual(await page.evaluate(() => collectShareState()), share, "collapse stays outside share data");
        assert.equal(await page.evaluate(() => JSON.stringify(classFeatures)), source, "disclosures never mutate rule text");
        await page.keyboard.press("Escape");
        await page.locator("#level").selectOption("3");
        assert.equal(await details.evaluate(el => el.open), false, "option rerender preserves collapse");
        await page.waitForFunction(id => JSON.parse(dndStorage.getItem("dndchar_autosave_v1") || "{}")[id] === true, inputId, { timeout: 15000 });
        await page.reload();
        await page.locator("#legal-close-btn").click();
        assert.equal(await details.evaluate(el => el.open), false, "collapse survives reload");
        assert.equal(await page.locator("#" + inputId).isChecked(), true, "selected options survive reload");
        await page.locator('[data-character-features-tab="class"]').click();
        await page.getByRole("tab", { name: tab, exact: true }).click();
        await summary.click();
        assert.equal(await details.evaluate(el => el.open), true);
        await page.locator("#" + inputId).uncheck();
        assert.equal((await page.locator("#" + summaryId).innerText()).includes("尚未勾選"), true);
        await summary.click();
        await page.keyboard.press("Escape");
      }
      await Promise.all([page.waitForNavigation(), page.evaluate(() => clearAppStateAndReload())]);
      for (const id of ["metamagic-options-disclosure", "invocation-options-disclosure"]) {
        assert.equal(await page.locator("#" + id).evaluate(el => el.open), true, "clear restores expanded defaults");
      }
    } finally { await page.close(); }
  }
  console.log("Feature choice disclosures: keyboard, chosen summaries, rerender, reload, clear and desktop/mobile passed.");
}

async function verifyCustomBackground(browser, url) {
  const page = await newUiPage(browser, { viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  try {
    await page.goto(url);
    await page.locator("#legal-close-btn").click();
    await page.locator("#class").selectOption("fighter");
    await page.locator("#level").selectOption("1");
    await page.locator("#con").fill("10");
    await page.locator("#background").selectOption("soldier");
    await page.locator('[data-character-features-tab="background"]').click();
    assert.equal(await page.locator("#background-features-section").isVisible(), true, "background heading has a working delegated event binding");
    await page.keyboard.press("Escape");
    const original = await page.evaluate(() => collectStateObject());
    const dialog = page.locator('.app-dialog[data-variant="custom-background"]');
    const editButton = page.locator("#custom-background-edit");
    assert.equal(await editButton.isVisible(), false);
    assert.equal(await page.locator('#background option[value="custom"]').textContent(), "自訂");
    await page.locator("#background").selectOption("custom");
    await dialog.waitFor();
    assert.equal(await page.inputValue("#background"), "soldier", "background switch is atomic");
    assert.deepEqual(await page.evaluate(() => collectStateObject()), original, "draft fields stay outside character state");
    await page.keyboard.press("Escape");
    assert.deepEqual(await page.evaluate(() => collectStateObject()), original, "cancelled creation preserves the original choices");
    await page.locator("#background").selectOption("custom");
    await dialog.getByRole("button", { name: "儲存背景" }).click();
    assert.match(await dialog.locator("#custom-background-error").textContent(), /請填寫/);
    assert.equal(await page.evaluate(() => document.activeElement.id), "custom-background-name");
    await page.locator("#custom-background-name").fill("自訂冒險");
    assert.equal(await page.locator("#custom-background-name").getAttribute("maxlength"), "4");
    assert.equal(await page.locator("#custom-background-equipment-a").getAttribute("maxlength"), "100");
    assert.equal(await page.locator("#custom-background-description").getAttribute("maxlength"), "500");
    assert.match(await dialog.textContent(), /填妥名稱、選項、裝備\(A\)的內容之後才能存檔/);
    const equipmentA = '<img src=x onerror="window.customEquipmentInjected=true">\n長棍、旅行者服裝、剩餘金幣';
    await page.locator("#custom-background-equipment-a").fill(equipmentA);
    for (const [id, value] of Object.entries({
      "ability-0": "力量", "ability-1": "力量", "ability-2": "體質",
      feat: "強韌體魄", "skill-0": "運動", "skill-1": "隱匿", tool: "里拉琴"
    })) await page.locator(`#custom-background-${id}`).selectOption(value);
    assert.equal(await page.locator("#custom-background-tool option").count(), await page.evaluate(() => ToolProficiencyCatalog.allTools.length + 1));
    assert.equal(await page.locator("#custom-background-feat option").count(), await page.evaluate(() => FEAT_OPTIONS.filter(option => FEAT_RULES[option.value]?.type === "origin").length + 1));
    assert.equal(await page.locator(".custom-background-field-group").evaluateAll(groups => groups.every(group => {
      const boxes = Array.from(group.querySelectorAll("select"), el => el.getBoundingClientRect());
      return boxes.every(box => Math.abs(box.top - boxes[0].top) < 1);
    })), true, "desktop abilities and skills each share a row");
    await dialog.getByRole("button", { name: "儲存背景" }).click();
    assert.equal(await page.evaluate(() => document.activeElement.id), "custom-background-ability-1", "duplicate ability focuses the correction");
    await page.locator("#custom-background-ability-1").selectOption("敏捷");
    await page.locator("#custom-background-skill-1").selectOption("運動");
    await dialog.getByRole("button", { name: "儲存背景" }).click();
    assert.equal(await page.evaluate(() => document.activeElement.id), "custom-background-skill-1");
    await page.locator("#custom-background-skill-1").selectOption("隱匿");
    await page.locator("#custom-background-equipment-a").fill("   ");
    await dialog.getByRole("button", { name: "儲存背景" }).click();
    assert.equal(await page.evaluate(() => document.activeElement.id), "custom-background-equipment-a", "equipment A is required");
    for (const [id, length] of [["equipment-a", 101], ["description", 501], ["name", 5]]) {
      await page.locator("#custom-background-equipment-a").fill(equipmentA);
      await page.locator(`#custom-background-${id}`).evaluate((input, length) => { input.value = "字".repeat(length); }, length);
      await dialog.getByRole("button", { name: "儲存背景" }).click();
      assert.equal(await page.evaluate(() => document.activeElement.id), `custom-background-${id}`, "overlong fields are rejected even if maxlength is bypassed");
      assert.equal(await page.locator(`#custom-background-${id}`).getAttribute("aria-invalid"), "true");
      assert.deepEqual(await page.evaluate(() => collectStateObject()), original, "invalid drafts do not change the character");
      await page.locator(`#custom-background-${id}`).fill(id === "name" ? "自訂冒險" : "");
    }
    await page.locator("#custom-background-equipment-a").fill(equipmentA);
    const description = '<img src=x onerror="window.customBackgroundInjected=true">\n我的背景描述';
    await page.locator("#custom-background-description").fill(description);
    await dialog.getByRole("button", { name: "儲存背景" }).click();
    await dialog.waitFor({ state: "detached" });
    const state = await page.evaluate(() => collectStateObject());
    assert.deepEqual(state.__customBackground, {
      名稱: "自訂冒險", 擴充: true, 屬性: "力量,敏捷,體質", 專長: "強韌體魄",
      技能熟練: "運動,隱匿", 工具熟練: "里拉琴", 裝備: "A、B 二擇一", 裝備A: equipmentA, 裝備B: "50 金幣", 描述: description
    });
    assert.equal(state.background, "custom");
    assert.equal(await page.locator('#background option[value="custom"]').count(), 1);
    assert.equal(await page.locator('#point-buy-background option[value="custom"]').count(), 0);
    assert.equal(await editButton.isVisible(), true);
    assert.equal(await page.locator('#background option[value="custom"]').textContent(), "自訂冒險");
    assert.match(await page.locator("#backgroundFeatures").textContent(), /背景：自訂冒險/);
    assert.equal(await page.locator('[data-feature-title="background"]').textContent(), "自訂冒險自訂背景", "custom background title uses its name and a fixed subtitle");
    assert.equal(await page.locator(".custom-background-equipment").textContent(), `裝備：A、B 二擇一(A) ${equipmentA}(B) 50 金幣`);
    assert.equal(await page.locator("#background").evaluate(select => {
      const edit = document.getElementById("custom-background-edit").getBoundingClientRect();
      const bg = select.getBoundingClientRect(), race = document.getElementById("race").getBoundingClientRect();
      return bg.right <= edit.left && edit.right <= race.left;
    }), true, "desktop edit button sits between background and race");
    assert.equal(await page.inputValue("#derived-feat-background"), "強韌體魄", "custom feat follows the existing fixed background source");
    assert.equal(await page.locator("#derived-feat-background").isDisabled(), true);
    assert.equal(await page.evaluate(() => hasSelectedFeat("強韌體魄")), true, "custom feat is active in the existing calculations");
    assert.equal(await page.inputValue("#hp-display"), "12", "background Tough adds the existing level-based HP bonus");
    assert.equal(await page.inputValue("#tool-proficiency-0"), "里拉琴", "custom tool follows the existing fixed background row");
    assert.equal(await page.locator("#tool-proficiency-0").isDisabled(), true);
    assert.equal(await page.locator("#backgroundFeatures img").count(), 0, "description is escaped text");
    assert.equal(await page.evaluate(() => window.customBackgroundInjected), undefined);
    assert.equal(await page.evaluate(() => window.customEquipmentInjected), undefined);
    assert.equal(await page.locator(".custom-background-description").textContent(), description);
    const reopen = async () => { await editButton.click(); await dialog.waitFor(); };
    await reopen();
    assert.equal(await page.inputValue("#custom-background-feat"), "強韌體魄");
    assert.equal(await page.inputValue("#custom-background-equipment-a"), equipmentA);
    await page.locator("#custom-background-name").fill("取消修改");
    await page.keyboard.press("Escape");
    assert.deepEqual(await page.evaluate(() => CustomBackground.getState()), state.__customBackground);
    assert.equal(await page.evaluate(() => document.activeElement.id), "custom-background-edit");
    assert.equal(await page.inputValue("#background"), "custom");
    await page.locator("#background").selectOption("sage");
    assert.equal(await editButton.isVisible(), false);
    assert.equal(await page.inputValue("#tool-proficiency-0"), "書法工具");
    await page.locator("#background").selectOption("custom");
    assert.equal(await dialog.count(), 0, "selecting a saved custom background does not open the editor");
    await reopen();
    assert.equal(await page.inputValue("#custom-background-name"), "自訂冒險", "one saved definition survives switching backgrounds");
    await dialog.getByRole("button", { name: "取消", exact: true }).click();
    assert.equal(await page.inputValue("#background"), "custom");
    assert.equal(await page.inputValue("#tool-proficiency-0"), "里拉琴", "cancel preserves existing background rules");
    await page.addScriptTag({ url: "/pdf-field-map.js" });
    const pdf = await page.evaluate(() => {
      const current = collectStateObject();
      return { actual: buildPdfFieldPayload(current), withoutCustom: buildPdfFieldPayload({ ...current, __customBackground: undefined }) };
    });
    assert.equal(pdf.actual.Background2, "自訂冒險");
    delete pdf.actual.Background2;
    delete pdf.withoutCustom.Background2;
    assert.deepEqual(pdf.actual, pdf.withoutCustom, "PDF adds only the custom name");
    await page.evaluate(() => saveAllFields());
    await page.goto(url);
    await page.locator("#legal-close-btn").click();
    assert.equal(await dialog.count(), 0, "restoration never opens the editor");
    assert.equal(await page.inputValue("#background"), "custom");
    assert.equal(await editButton.isVisible(), true);
    assert.equal(await page.locator('#background option[value="custom"]').textContent(), "自訂冒險");
    assert.deepEqual(await page.evaluate(() => CustomBackground.getState()), state.__customBackground, "autosave restoration");
    assert.equal(await page.inputValue("#derived-feat-background"), "強韌體魄");
    assert.equal(await page.inputValue("#tool-proficiency-0"), "里拉琴");
    await page.evaluate(() => applyStateObject(JSON.parse(JSON.stringify(collectStateObject()))));
    assert.deepEqual(await page.evaluate(() => CustomBackground.getState()), state.__customBackground, "JSON restoration");
    await page.evaluate(() => applyStateObject(Object.fromEntries(Object.entries(collectStateObject()).reverse())));
    assert.deepEqual(await page.evaluate(() => CustomBackground.getState()), state.__customBackground, "JSON field order is irrelevant");
    await page.evaluate(() => applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] }, hp: "10" }));
    assert.deepEqual(await page.evaluate(() => CustomBackground.getState()), state.__customBackground, "unrelated partial state preserves the definition");
    const hash = await page.evaluate(async () => encodeStateToHash(collectShareState()));
    const shared = await newUiPage(browser);
    try {
      await shared.goto(url);
      await shared.evaluate(state => {
        applyStateObject({ ...state, __customBackground: { ...state.__customBackground, 名稱: "本機背景", 裝備A: "本機裝備" } });
        saveAllFields();
      }, state);
      const localSave = await shared.evaluate(() => dndStorage.getItem("dndchar_autosave_v1"));
      await shared.goto(url + hash);
      await shared.locator("#legal-close-btn").click();
      assert.equal(await shared.inputValue("#background"), "custom");
      assert.deepEqual(await shared.evaluate(() => CustomBackground.getState()), state.__customBackground, "share restoration");
      assert.equal(await shared.inputValue("#derived-feat-background"), "強韌體魄");
      assert.equal(await shared.inputValue("#tool-proficiency-0"), "里拉琴");
      assert.equal(await shared.locator('[data-variant="custom-background"]').count(), 0);
      assert.equal(await shared.locator('#background option[value="custom"]').textContent(), "自訂冒險");
      assert.equal(await shared.locator(".custom-background-equipment").textContent(), `裝備：A、B 二擇一(A) ${equipmentA}(B) 50 金幣`);
      // Share mode opens the definition read-only: inspect, but never change it.
      assert.equal(await shared.locator("#custom-background-edit").textContent(), "查看背景");
      await shared.locator("#custom-background-edit").click();
      const sharedDialog = shared.locator('.app-dialog[data-variant="custom-background"]');
      await sharedDialog.waitFor();
      assert.equal(await shared.inputValue("#custom-background-name"), "自訂冒險", "read-only view shows the shared definition");
      assert.equal(await shared.inputValue("#custom-background-equipment-a"), equipmentA);
      assert.deepEqual(await sharedDialog.locator("input, textarea").evaluateAll(fields => fields.map(field => field.readOnly)), [true, true, true]);
      assert.equal(await sharedDialog.locator("select").evaluateAll(selects => selects.every(select => select.disabled)), true, "share view selects are locked");
      assert.match(await sharedDialog.textContent(), /分享模式：自訂背景僅供查看/);
      assert.equal(await sharedDialog.getByRole("button", { name: "儲存背景", exact: true }).count(), 0, "share view has no save action");
      await shared.locator("#custom-background-name").focus();
      await shared.keyboard.type("改");
      await shared.locator("#custom-background-description").focus();
      await shared.keyboard.press("Backspace");
      assert.equal(await shared.inputValue("#custom-background-name"), "自訂冒險", "typing cannot change the shared name");
      assert.equal(await shared.inputValue("#custom-background-description"), description);
      await sharedDialog.getByRole("button", { name: "關閉", exact: true }).click();
      await sharedDialog.waitFor({ state: "detached" });
      assert.equal(await shared.evaluate(() => document.activeElement.id), "custom-background-edit");
      assert.deepEqual(await shared.evaluate(() => CustomBackground.getState()), state.__customBackground, "closing the view keeps the definition");
      assert.equal(await shared.inputValue("#background"), "custom");
      await shared.evaluate(() => saveAllFields());
      assert.equal(await shared.evaluate(() => dndStorage.getItem("dndchar_autosave_v1")), localSave, "share viewing never overwrites the local custom background");
    } finally { await shared.close(); }
    await page.setViewportSize({ width: 320, height: 568 });
    await reopen();
    const geometry = await dialog.evaluate(root => {
      const surface = root.querySelector(".app-dialog__surface").getBoundingClientRect();
      const body = root.querySelector(".app-dialog__body");
      const actions = root.querySelector(".app-dialog__actions").getBoundingClientRect();
      return { fits: surface.left >= 0 && surface.right <= innerWidth && actions.bottom <= innerHeight, scrolls: body.scrollHeight > body.clientHeight, overflows: body.scrollWidth > body.clientWidth };
    });
    assert.deepEqual(geometry, { fits: true, scrolls: true, overflows: false });
    await page.locator("#custom-background-name").focus();
    await page.keyboard.press("Shift+Tab");
    assert.equal(await page.evaluate(() => Boolean(document.activeElement.closest('.app-dialog[data-variant="custom-background"]'))), true);
    await page.keyboard.press("Escape");
    await reopen();
    await page.locator("#custom-background-name").fill("新背景");
    await page.locator("#custom-background-feat").selectOption("魔法學徒");
    await page.locator("#custom-background-tool").selectOption("盜賊工具");
    await page.locator("#custom-background-description").fill("");
    await page.locator("#custom-background-equipment-a").fill("裝".repeat(100));
    await dialog.getByRole("button", { name: "儲存背景" }).click();
    assert.equal(await page.evaluate(() => CustomBackground.getState().名稱), "新背景", "editing replaces the single definition");
    assert.equal(await page.evaluate(() => CustomBackground.getState().描述), "", "description remains optional");
    assert.equal(await page.locator('#background option[value="custom"]').textContent(), "新背景");
    await reopen();
    await page.locator("#custom-background-description").fill("述".repeat(500));
    await dialog.getByRole("button", { name: "儲存背景" }).click();
    assert.equal(await page.evaluate(() => CustomBackground.getState().描述.length), 500, "both text limits accept their boundary");
    assert.equal(await page.locator('#background option[value="custom"]').count(), 1);
    assert.equal(await page.inputValue("#derived-feat-background"), "魔法學徒", "editing updates the existing background feat row");
    assert.equal(await page.inputValue("#tool-proficiency-0"), "盜賊工具");
    assert.equal(await page.evaluate(() => hasSelectedFeat("強韌體魄")), false, "previous custom feat effects are removed");
    const magicClass = page.locator("#derived-feat-background-magic-initiate-class");
    assert.equal(await magicClass.isDisabled(), false, "custom Magic Initiate can choose its spell class");
    await magicClass.selectOption("druid");
    await page.evaluate(() => applyStateObject(Object.fromEntries(Object.entries(collectStateObject()).reverse())));
    assert.equal(await magicClass.inputValue(), "druid", "custom Magic Initiate class survives JSON restoration");
    await page.evaluate(() => {
      const current = collectStateObject();
      delete current.__customBackground.裝備A;
      delete current.__customBackground.裝備;
      current.__customBackground.描述 = "舊".repeat(501);
      applyStateObject(current);
    });
    assert.equal(await page.evaluate(() => CustomBackground.getState().裝備A), "", "legacy custom backgrounds remain readable without equipment A");
    assert.equal(await page.evaluate(() => CustomBackground.getState().描述.length), 501, "legacy descriptions are preserved until explicitly edited");
    await reopen();
    assert.equal(await page.inputValue("#custom-background-equipment-a"), "");
    await dialog.getByRole("button", { name: "儲存背景" }).click();
    assert.equal(await page.evaluate(() => document.activeElement.id), "custom-background-equipment-a");
    await page.keyboard.press("Escape");
    await page.evaluate(() => applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] }, background: "soldier" }));
    assert.equal(await page.evaluate(() => CustomBackground.getState()), null, "legacy JSON needs no custom field");
    assert.equal(await page.inputValue("#background"), "soldier");
    assert.equal(await page.locator('#background option[value="custom"]').textContent(), "自訂");
    assert.equal(await editButton.isVisible(), false);
    await page.evaluate(() => applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] }, background: "custom", __customBackground: { 名稱: "無效" } }));
    assert.equal(await page.inputValue("#background"), "", "invalid imported custom data is ignored");
    await page.evaluate(state => { applyStateObject(state); saveAllFields(); }, state);
    await page.evaluate(() => { const entry = new URL(location.href); entry.searchParams.set("analytics", "owner"); history.replaceState(null, "", entry); });
    await Promise.all([page.waitForNavigation(), page.evaluate(() => clearAppStateAndReload())]);
    assert.equal(await page.evaluate(() => CustomBackground.getState()), null, "clear records removes the saved definition");
    assert.equal(await page.locator('#background option[value="custom"]').textContent(), "自訂");
    assert.equal(await editButton.isVisible(), false);
    assert.equal(await page.evaluate(() => collectStateObject().__customBackground), undefined);
    console.log("Custom background: named selection/edit button, required equipment, text limits, responsive groups, cancellation, feat/tool sync, PDF, autosave/JSON/share, legacy restoration and clear passed.");
  } finally { await page.close(); }
}

async function verifyCharacterFeatures(browser, url) {
  const page = await newUiPage(browser, { viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  try {
    await page.goto(url);
    await page.locator("#legal-close-btn").click();
    assert.equal(await page.locator("#character-choice-warning-toggle").isVisible(), false, "no missing choices keeps the warning toggle hidden");
    await page.locator("#class").selectOption("druid");
    await page.locator("#level").selectOption("8");
    await page.locator("#background").selectOption("seeker");
    await page.locator("#race").selectOption("dwarf");
    const warningToggle = page.locator("#character-choice-warning-toggle");
    const reminders = page.locator("#class-feature-choice-reminder");
    assert.equal(await warningToggle.isVisible(), true, "missing choices reveal the warning toggle");
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const fieldRects = () => page.locator(".basic-row--origin .basic-pair-field").evaluateAll(fields =>
        fields.map(field => {
          const rect = field.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        }));
      await warningToggle.evaluate(el => { el.hidden = true; });
      const originalRects = await fieldRects();
      await warningToggle.evaluate(el => { el.hidden = false; });
      assert.deepEqual(await fieldRects(), originalRects, `toggle preserves origin field geometry at ${width}px`);
      assert.equal(await warningToggle.evaluate(el => {
        const toggle = el.getBoundingClientRect();
        const label = el.previousElementSibling.getBoundingClientRect();
        const field = el.parentElement.getBoundingClientRect();
        return toggle.left >= label.right && Math.abs(toggle.right - field.right) < 1
          && toggle.top >= label.top && toggle.bottom <= label.bottom + 1;
      }), true, `toggle sits to the far right of the race label at ${width}px`);
      assert.equal(await reminders.isVisible(), true);
      const state = await page.evaluate(() => collectStateObject());
      await warningToggle.focus();
      await page.keyboard.press("Enter");
      assert.equal(await warningToggle.isVisible(), false, "dismissal also hides its control");
      assert.equal(await warningToggle.getAttribute("aria-expanded"), "false");
      assert.equal(await reminders.isVisible(), false);
      assert.deepEqual(await fieldRects(), originalRects, "hiding reminders preserves field heights");
      assert.deepEqual(await page.evaluate(() => collectStateObject()), state, "hiding warnings preserves character data");
      await page.locator("#level").selectOption("7");
      assert.equal(await reminders.isVisible(), false, "choice updates keep warnings hidden");
      assert.equal(await warningToggle.isVisible(), false, "choice updates keep the dismiss control hidden");
      await page.evaluate(() => saveAllFields());
      await page.goto(url);
      if (await page.locator("#legal-close-btn").isVisible()) await page.locator("#legal-close-btn").click();
      assert.equal(await warningToggle.textContent(), "隱藏警告");
      assert.equal(await warningToggle.isVisible(), true, "reload restores the dismiss control");
      assert.equal(await warningToggle.getAttribute("aria-expanded"), "true");
      assert.equal(await reminders.isVisible(), true);
      assert.equal((await reminders.textContent()).includes("等級 8"), false, "restored warnings reflect current choices");
      await page.locator("#level").selectOption("8");
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.locator("#class").selectOption("rogue");
    await page.locator("#level").selectOption("1");
    await page.locator("#background").selectOption("soldier");
    await page.locator("#race").selectOption("elf");
    const source = await page.evaluate(() => JSON.stringify(classFeatures));
    await page.evaluate(() => {
      dndStorage.setItem(CLASS_FEATURE_TABLE_STATE_KEY, JSON.stringify({ rogue: false }));
      dndStorage.setItem(CLASS_CORE_CREATION_INFO_STATE_KEY, JSON.stringify({ rogue: false }));
    });
    for (const cls of Object.keys(JSON.parse(source))) {
      await page.locator("#class").selectOption(cls);
      assert.equal(await page.evaluate(className => {
        const template = document.createElement("template");
        template.innerHTML = classFeatures[className];
        const creation = document.getElementById("classCreationInfo");
        const abilities = document.getElementById("classFeatures");
        const introduction = creation.querySelector(".class-creation-content");
        const normalize = node => node.textContent.replace(/\s+/g, " ").trim();
        const expectedOrder = ["class-feature-tagline", "class-flavor-quote", "class-core-creation-info", "class-feature-table-details"];
        const correctIntroduction = introduction && expectedOrder.every((name, index) => {
          const original = template.content.querySelector(`.${name}`);
          const displayed = introduction.children[index];
          return original && displayed?.classList.contains(name) && normalize(original) === normalize(displayed)
            && !abilities.querySelector(`.${name}`);
        });
        const sections = Array.from(abilities.querySelectorAll(".class-feature-section"));
        const correctAbilities = sections.length > 0 && sections[0].querySelector("h3").textContent.startsWith("等級 1：")
          && getComputedStyle(sections[0]).borderTopWidth === "0px"
          && sections.every(section => !section.dataset.featureLevel || Number(section.dataset.featureLevel) <= 1)
          && (sections.length < 2 || parseFloat(getComputedStyle(sections[1]).borderTopWidth) > 0);
        return ["class-core-creation-info", "class-feature-table-details"].every(className => {
          const original = template.content.querySelector(`.${className}`);
          const displayed = creation.querySelector(`section.${className}`);
          return original && displayed && normalize(original) === normalize(displayed)
            && !abilities.querySelector(`.${className}`) && !displayed.querySelector("summary");
        }) && correctIntroduction && correctAbilities && !creation.querySelector("details");
      }, cls), true, `${cls} introduction/core/table order, source content and level 1 abilities without an opening divider`);
    }
    assert.equal(await page.evaluate(() => /使用樂器：魅力檢定|如何扮演吟遊詩人/.test(classFeatures.bard)), false, "removed bard guidance stays out of the source");
    assert.equal(await page.evaluate(() => JSON.stringify(classFeatures)), source, "panel rendering must leave classFeatures data intact");
    const raceOptionCases = [
      { race: "dragonborn", control: "#dragonborn-ancestry", value: "red_fire", all: ".dragon-ancestry-table td", chosen: "紅龍", rejected: "黑龍" },
      { race: "elf", control: "#elf-lineage", value: "high_elf", all: ".race-lineage-table thead th:not(:first-child)", chosen: "高等精靈血統", rejected: "卓爾血統" },
      { race: "gnome", control: "#gnome-lineage", value: "rock_gnome", all: ".class-feature-section h3", chosen: "岩石侏儒", rejected: "森林侏儒" },
      { race: "goliath", control: "#goliath-ancestry", value: "stone", all: ".class-feature-section h3", chosen: "堅若磐石（石巨人）", rejected: "雲遊四方（雲巨人）" },
      { race: "tiefling", control: "#tiefling-legacy", value: "chthonic", all: ".race-lineage-table thead th:not(:first-child)", chosen: "冥界血統", rejected: "深淵血統" }
    ];
    for (const testCase of raceOptionCases) {
      await page.locator("#race").selectOption(testCase.race);
      const output = page.locator("#raceFeatures");
      assert((await output.locator(testCase.all).allTextContents()).some(text => text.includes(testCase.rejected)), `${testCase.race} shows every option before a choice`);
      await page.locator(testCase.control).selectOption(testCase.value);
      await page.locator('[data-character-features-tab="race"]').click();
      assert((await output.locator(testCase.all).filter({ visible: true }).allTextContents()).some(text => text.includes(testCase.chosen)), `${testCase.race} keeps the selected option visible`);
      assert.equal((await output.locator(testCase.all).filter({ visible: true }).allTextContents()).some(text => text.includes(testCase.rejected)), false, `${testCase.race} hides unselected option details`);
      await page.keyboard.press("Escape");
      await page.locator(testCase.control).selectOption("");
      await page.locator('[data-character-features-tab="race"]').click();
      assert((await output.locator(testCase.all).filter({ visible: true }).allTextContents()).some(text => text.includes(testCase.rejected)), `${testCase.race} restores every option when cleared`);
      await page.keyboard.press("Escape");
    }
    await page.locator("#race").selectOption("elf");
    await page.locator("#class").selectOption("");
    assert.equal(await page.locator("#classCreationInfo").textContent(), "請先選擇職業", "clearing class removes stale creation data");
    await page.locator("#class").selectOption("rogue");
    assert.equal(await page.locator("[data-feature-panel] > details:not(.feature-choice-disclosure)").count(), 0, "tabs replace outer headings while retaining ability option disclosures");
    assert.equal(await page.locator("#tab-basic #classFeatures, #tab-basic #backgroundFeatures, #tab-basic #raceFeatures, #tab-basic #metamagicOptions, #tab-basic #eldritch-invocations-output").count(), 0);
    assert.equal(await page.evaluate(() => Boolean(document.getElementById("feats-area").closest(".section").nextElementSibling?.querySelector("#class-extra"))), true);
    for (const tab of ["class", "race", "background"]) {
      const entry = page.locator(`[data-character-features-tab="${tab}"]`);
      assert.equal(await entry.isVisible(), true, `${tab} details retain a visible entry`);
      assert.equal(await entry.getAttribute("aria-haspopup"), "dialog");
      assert.equal(await entry.getAttribute("aria-controls"), "character-features-modal");
      assert(await entry.getAttribute("aria-label"), `${tab} details entry has an accessible label`);
    }
    const state = await page.evaluate(() => {
      window.featureControlNodes = ["classFeatures", "backgroundFeatures", "raceFeatures"].map(id => document.getElementById(id));
      return collectStateObject();
    });
    const opener = page.locator('[data-character-features-tab="class"]');
    await opener.focus();
    const scroll = await page.evaluate(() => scrollY);
    await page.keyboard.press("Enter");
    const modal = page.locator("#character-features-modal");
    const tabs = modal.locator('[role="tab"]:visible');
    assert.deepEqual(await tabs.allTextContents(), ["表格", "職業", "背景", "種族"]);
    assert.equal(await page.evaluate(() => scrollY), scroll, "opening details must not jump down the sheet");
    assert.equal(await modal.evaluate(el => {
      const body = el.querySelector(".app-dialog__body");
      body.scrollTop = 200;
      const header = el.querySelector(".app-dialog__header");
      const rect = header.querySelector('[role="tablist"]').getBoundingClientRect();
      const close = header.querySelector(".app-dialog__close").getBoundingClientRect();
      const viewport = header.getBoundingClientRect();
      body.scrollTop = 0;
      return rect.top >= viewport.top && rect.bottom <= viewport.bottom && rect.right <= close.left
        && header.querySelector("h2").classList.contains("sr-only");
    }), true, "tabs replace the visible title and stay beside the close button above scrolling content");
    assert.equal((await modal.locator("#classFeatures").textContent()).includes("等級 2：靈巧動作"), false);
    await page.keyboard.press("Home");
    assert.equal(await modal.locator("#classCreationInfo").isVisible(), true);
    assert.equal(await modal.locator("#classFeatures").isVisible(), false);
    assert.equal(await modal.locator("#classCreationInfo .class-feature-table").isVisible(), true, "saved collapsed state no longer hides tables");
    await page.keyboard.press("ArrowRight");
    assert.equal(await modal.locator("#classFeatures").isVisible(), true);
    await page.keyboard.press("ArrowRight");
    assert.equal(await modal.locator('[role="tab"][aria-selected="true"]').textContent(), "背景");
    assert.equal(await modal.locator("#backgroundFeatures").isVisible(), true);
    await page.keyboard.press("End");
    assert.equal(await modal.locator("#raceFeatures").isVisible(), true);
    const lastControl = modal.locator('button:visible:not([tabindex="-1"]), a[href]:visible, input:visible:not([disabled]), select:visible:not([disabled]), textarea:visible:not([disabled]), [tabindex="0"]:visible').last();
    await lastControl.focus();
    await page.keyboard.press("Tab");
    assert.equal(await modal.locator('[role="tab"][aria-selected="true"]').evaluate(el => el === document.activeElement), true);
    await page.keyboard.press("Shift+Tab");
    assert.equal(await lastControl.evaluate(el => el === document.activeElement), true);
    await page.keyboard.press("Escape");
    assert.equal(await opener.evaluate(el => el === document.activeElement), true);
    assert.equal(await page.locator("#classFeatures").isVisible(), false);
    assert.deepEqual(await page.evaluate(() => collectStateObject()), state, "opening and switching tabs must preserve character data");
    assert.equal(await page.evaluate(() => featureControlNodes.every(node => document.getElementById(node.id) === node)), true);
    await opener.click();
    const picker = modal.locator("#character-features-picker");
    const pickerOptions = field => picker.locator(`[data-feature-picker="${field}"] [data-picker-value]`);
    assert.equal(await picker.evaluate(el => {
      const header = el.closest(".app-dialog__header");
      const tablist = header?.querySelector('[role="tablist"]').getBoundingClientRect();
      const rect = el.getBoundingClientRect(), close = header.querySelector(".app-dialog__close").getBoundingClientRect();
      return Boolean(header) && rect.top >= Math.max(tablist.bottom, close.bottom) && Math.abs(rect.left - tablist.left) < 1 && Math.abs(rect.right - close.right) < 1;
    }), true, "picker sits below the tabs and stretches under the close button");
    assert.deepEqual(await pickerOptions("class").allTextContents(), ["蠻", "詩", "牧", "德", "戰", "武", "聖", "遊", "盜", "術", "契", "法"]);
    assert.equal(await pickerOptions("class").locator("svg").count(), 12, "class picker shows icons");
    assert.equal(await picker.locator('[data-feature-picker="class"] [aria-pressed="true"]').getAttribute("aria-label"), "盜賊");
    await page.keyboard.press("Home");
    assert.equal(await pickerOptions("class").first().isVisible(), true, "table tab shares the class picker");
    await picker.locator('[data-feature-picker="class"] [aria-pressed="true"]').focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await picker.locator(":focus").getAttribute("aria-label"), "術士", "arrow keys move focus without choosing");
    assert.equal(await page.locator("#class").inputValue(), "rogue");
    await pickerOptions("class").filter({ hasText: "法" }).click();
    assert.equal(await page.locator("#class").inputValue(), "wizard", "picker changes the class selector");
    assert.equal(await modal.locator('#class-creation-panel [data-feature-title="class"]').textContent(), "法師Wizard", "table panel title follows the picked class");
    assert.equal(await picker.locator('[data-feature-picker="class"] [aria-pressed="true"]').getAttribute("aria-label"), "法師");
    assert.equal((await modal.locator("#classCreationInfo").textContent()).includes("法師"), true, "open table follows the picked class");
    await pickerOptions("class").filter({ hasText: "盜" }).click();
    assert.equal(await page.locator("#class").inputValue(), "rogue");
    await modal.getByRole("tab", { name: "背景", exact: true }).click();
    assert.deepEqual(await pickerOptions("background").allTextContents(), ["侍僧", "罪犯", "賢者", "士兵", "耕者", "孤芳", "自訂"]);
    const previousBackground = await page.locator("#background").inputValue();
    await picker.locator('[data-feature-picker="background"] [data-picker-value="seeker"]').click();
    assert.equal(await modal.locator('[data-feature-title="background"]').textContent(), "孤芳Seeker", "background panel title follows the picked background");
    assert.equal(await modal.locator("#backgroundFeatures strong", { hasText: "背景：" }).isHidden(), true, "title replaces the background name row");
    if (previousBackground) await picker.locator(`[data-feature-picker="background"] [data-picker-value="${previousBackground}"]`).click();
    else await page.locator("#background").selectOption("");
    assert.equal(await pickerOptions("class").first().isVisible(), false);
    await modal.getByRole("tab", { name: "種族", exact: true }).click();
    assert.deepEqual(await pickerOptions("race").allTextContents(), ["龍", "矮", "精", "儒", "巨", "半", "人", "獸", "魔"]);
    const previousRace = await page.locator("#race").inputValue();
    const nextRace = previousRace === "elf" ? "dwarf" : "elf";
    await pickerOptions("race").and(picker.locator(`[data-picker-value="${nextRace}"]`)).click();
    assert.equal(await page.locator("#race").inputValue(), nextRace, "picker changes the race selector");
    assert.equal((await modal.locator('[data-feature-title="race"]').textContent()).startsWith(nextRace === "elf" ? "精靈" : "矮人"), true, "race panel title follows the picked race");
    assert.equal(await picker.locator('[data-feature-picker="race"] [aria-pressed="true"]').getAttribute("data-picker-value"), nextRace);
    if (previousRace) await picker.locator(`[data-feature-picker="race"] [data-picker-value="${previousRace}"]`).click();
    else await page.locator("#race").selectOption("");
    await modal.locator(".app-dialog__close").click();
    assert.deepEqual(await page.evaluate(() => collectStateObject()), state, "picking and restoring keeps character data");
    await page.locator("#level").selectOption("2");
    await opener.click();
    assert.equal((await modal.locator("#classFeatures").textContent()).includes("等級 2：靈巧動作"), true);
    await modal.locator(".app-dialog__close").click();
    for (const tab of ["background", "race"]) {
      await page.locator(`[data-character-features-tab="${tab}"]`).click();
      assert.equal(await modal.locator('[role="tab"][aria-selected="true"]').getAttribute("data-feature-tab"), tab);
      await modal.locator(".app-dialog__close").click();
    }
    await page.locator("#class").selectOption("sorcerer");
    await page.locator("#level").selectOption("1");
    await opener.click();
    assert.deepEqual(await tabs.allTextContents(), ["表格", "職業", "超魔", "背景", "種族"], "sorcerer metamagic tab is readable before level 2");
    await modal.getByRole("tab", { name: "超魔", exact: true }).click();
    assert.equal(await modal.locator("#character-features-picker").isVisible(), false, "picker only accompanies class, table, background and race tabs");
    const earlyMetamagic = modal.locator("#metamagicOptions input[data-metamagic-name]");
    assert(await earlyMetamagic.count() > 0, "metamagic options render at level 1");
    assert.equal(await earlyMetamagic.evaluateAll(inputs => inputs.every(input => input.disabled && !input.checked)), true, "metamagic stays disabled before level 2");
    await page.keyboard.press("Escape");
    await page.locator("#level").selectOption("");
    await opener.click();
    assert.deepEqual(await tabs.allTextContents(), ["表格", "職業", "超魔", "背景", "種族"], "sorcerer metamagic tab is readable without a level");
    assert.equal(await earlyMetamagic.evaluateAll(inputs => inputs.length > 0 && inputs.every(input => input.disabled)), true);
    await page.keyboard.press("Escape");
    await page.locator("#class").selectOption("warlock");
    await opener.click();
    assert.deepEqual(await tabs.allTextContents(), ["表格", "職業", "魔祈", "背景", "種族"], "warlock invocation tab is readable without a level");
    const earlyInvocations = modal.locator("#eldritch-invocations-output input[data-invocation-name]");
    assert.equal(await earlyInvocations.evaluateAll(inputs => inputs.length > 0 && inputs.every(input => input.disabled && !input.checked)), true, "invocations stay disabled before level 1");
    await page.keyboard.press("Escape");
    await page.locator("#class").selectOption("sorcerer");
    await page.locator("#level").selectOption("2");
    await opener.click();
    assert.deepEqual(await tabs.allTextContents(), ["表格", "職業", "超魔", "背景", "種族"]);
    await modal.getByRole("tab", { name: "超魔", exact: true }).click();
    const metamagic = modal.locator("#metamagicOptions input[data-metamagic-name]").first();
    await metamagic.check();
    const choiceId = await metamagic.getAttribute("id");
    const chosen = await page.evaluate(() => collectStateObject());
    assert.equal(chosen[choiceId], true);
    assert.equal(await page.evaluate(id => collectShareState()[id], choiceId), true);
    await page.keyboard.press("Escape");
    assert.deepEqual(await page.evaluate(() => collectStateObject()), chosen);
    await page.waitForFunction(id => JSON.parse(dndStorage.getItem("dndchar_autosave_v1") || "{}")[id] === true, choiceId, { timeout: 15000 });
    await page.reload();
    await page.locator("#legal-close-btn").click();
    await opener.click();
    await modal.getByRole("tab", { name: "超魔", exact: true }).click();
    assert.equal(await page.locator(`#${choiceId}`).isChecked(), true, "metamagic survives autosave and reload while its panel is closed");
    await page.keyboard.press("Escape");
    await page.locator("#class").selectOption("warlock");
    await page.locator("#level").selectOption("1");
    await opener.click();
    await modal.getByRole("tab", { name: "魔祈", exact: true }).click();
    const invocation = name => modal.locator(`input[data-invocation-name="${name}"]`).first();
    assert.equal(await invocation("魔能意志").isEnabled(), true, "level 1 invocation remains selectable");
    for (const name of ["邪魔活力", "千面之臉", "幻象迷蹤", "超凡跳躍", "魔鬼視界", "原初之一教習", "苦痛魔爆", "魔能長槍", "斥力魔爆"]) {
      assert.equal(await invocation(name).isDisabled(), true, `${name} is unavailable before level 2`);
    }
    for (const name of ["星移步法", "萬形之主", "融身入影", "深海饋贈", "共視感官", "魔能斬擊", "饑渴魔刃", "鏈主賦能"]) {
      assert.equal(await invocation(name).isDisabled(), true, `${name} is unavailable before level 5`);
    }
    assert.equal(await invocation("墳墓低語").isDisabled(), true, "level 7 invocation is unavailable at level 1");
    assert.equal(await invocation("星移步法").locator("xpath=ancestor::article[1]").getAttribute("aria-disabled"), "true");
    await page.keyboard.press("Escape");
    await page.locator("#level").selectOption("2");
    await page.evaluate(() => showTab("spells"));
    assert.equal(await page.evaluate(() => SpellManagement.addPlayerSpell("eldritch-blast", { spellClass: "warlock" })), true);
    assert.equal(await page.evaluate(() => SpellManagement.getEntries({ availableOnly: true })
      .find(entry => entry.spellId === "eldritch-blast")?.spellClass), "warlock", "automatic preparation uses the character class");
    await page.evaluate(() => showTab("basic"));
    await opener.click();
    assert.deepEqual(await tabs.allTextContents(), ["表格", "職業", "魔祈", "背景", "種族"]);
    await modal.getByRole("tab", { name: "魔祈", exact: true }).click();
    assert.equal(await invocation("邪魔活力").isEnabled(), true, "level 2 invocation unlocks at level 2");
    assert.equal(await invocation("星移步法").isDisabled(), true, "level 5 invocation remains unavailable at level 2");
    for (const name of ["幽影護甲", "魔能意志", "邪魔活力"]) await invocation(name).check();
    await invocation("千面之臉").click();
    assert.equal(await modal.locator("#eldritch-invocations-output input[data-invocation-name]:checked").count(), 3, "level 2 invocation limit is enforced");
    assert.equal(await invocation("千面之臉").isChecked(), false, "the invocation exceeding the level limit is reverted");
    for (const name of ["幽影護甲", "魔能意志", "邪魔活力"]) await invocation(name).uncheck();
    await modal.locator('input[data-invocation-name="苦痛魔爆"]').first().check();
    const settings = modal.locator("[data-agonizing-blast-settings]");
    await settings.click();
    const nested = page.locator('.app-dialog:not(#character-features-modal)');
    await nested.locator("select").waitFor();
    assert.equal(await modal.evaluate(el => el.inert), true);
    const spellId = await nested.locator("select").evaluate(el => Array.from(el.options).find(option => option.value)?.value);
    assert(spellId, "damage cantrip options remain available in the nested dialog");
    await nested.locator("select").selectOption(spellId);
    await nested.getByRole("button", { name: "套用設定" }).click();
    assert.equal(await modal.evaluate(el => el.inert), false);
    assert.equal(await settings.evaluate(el => el === document.activeElement), true);
    assert.equal(await page.locator("[data-agonizing-blast-slot]").first().inputValue(), spellId);
    await settings.click();
    await page.keyboard.press("Escape");
    assert.equal(await modal.isVisible(), true, "Escape closes only the nested dialog");
    await modal.locator('input[data-invocation-name="書之魔契"]').first().check();
    await nested.getByRole("button", { name: "取消", exact: true }).click();
    assert.equal(await modal.locator('input[data-invocation-name="書之魔契"]').first().isChecked(), false);
    assert.equal(await modal.isVisible(), true, "canceling Tome selection keeps ability details open");
    for (const width of [1280, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const tab of ["表格", "職業", "魔祈", "背景", "種族"]) {
        await modal.getByRole("tab", { name: tab, exact: true }).click();
        assert.equal(await modal.evaluate(el => {
          const surface = el.querySelector(".app-dialog__surface").getBoundingClientRect();
          const body = el.querySelector(".app-dialog__body");
          const tabs = el.querySelector('[role="tablist"]').getBoundingClientRect();
          const close = el.querySelector(".app-dialog__close").getBoundingClientRect();
          const selected = el.querySelector('[role="tab"][aria-selected="true"]').getBoundingClientRect();
          return surface.left >= 0 && surface.right <= innerWidth && body.scrollWidth <= body.clientWidth
            && tabs.right <= close.left && selected.left >= tabs.left - 1 && selected.right <= tabs.right + 1;
        }), true, `${tab} details fit ${width}px viewport`);
      }
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await modal.click({ position: { x: 3, y: 3 } });
    assert.equal(await modal.count(), 0, "backdrop closes details");
    assert.equal(await page.locator("#main-content").evaluate(el => el.closest("[inert]") === null), true);
    await page.evaluate(async () => {
      await onboardingTour.jumpToTarget({ selector: '#eldritch-invocations-output input[data-invocation-name="苦痛魔爆"]' });
    });
    assert.equal(await modal.locator('[role="tab"][aria-selected="true"]').textContent(), "魔祈");
    assert.equal(await modal.locator('input[data-invocation-name="苦痛魔爆"]').first().evaluate(el => el === document.activeElement), true);
    await page.keyboard.press("Escape");
    const choiceAlertCases = [
      ["sorcerer", "5", "超魔法", "metamagic", 1280, "Enter"],
      ["warlock", "5", "魔能祈喚", "invocations", 320, " "],
      ["cleric", "8", "神聖使命", "class", 1280],
      ["druid", "7", "原初使命", "class", 320],
      ["paladin", "5", "戰鬥風格", "class", 1280],
      ["ranger", "7", "防守戰術", "class", 320]
    ];
    for (const [cls, level, label, panel, width, key] of choiceAlertCases) {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: cls === "sorcerer" ? "no-preference" : "reduce" });
      await page.locator("#class").selectOption(cls);
      await page.locator("#level").selectOption(level);
      const beforeJump = await page.evaluate(() => collectStateObject());
      const sheetReminder = page.locator("#class-feature-choice-reminder button").filter({ hasText: label }).first();
      await sheetReminder.focus();
      await page.keyboard.press(key || "Enter");
      await page.waitForFunction(panel => document.activeElement?.closest("[data-feature-panel]")?.dataset.featurePanel === panel
        && document.querySelector(`[data-feature-panel="${panel}"] .onboarding-jump-target`), panel);
      assert.equal(await modal.locator('[role="tab"][aria-selected="true"]').getAttribute("data-feature-tab"), panel);
      assert.deepEqual(await page.evaluate(() => collectStateObject()), beforeJump, "sheet reminder navigation preserves character choices");
      await page.keyboard.press("Escape");
      await page.evaluate(() => {
        document.querySelectorAll(".feature-choice-disclosure").forEach(details => { details.open = false; });
        TabletopMode.setMode("tabletop");
        TabletopMode.setPanel("overview");
      });
      await page.evaluate(dark => {
        document.documentElement.dataset.uiTheme = dark ? "classic" : "warm";
        document.documentElement.dataset.theme = dark ? "dark" : "light";
      }, cls === "warlock");
      const alert = page.locator("button.tabletop-class-choice-alert").filter({ hasText: label }).first();
      await alert.waitFor({ state: "visible" });
      assert.match(await alert.getAttribute("aria-label"), /前往補填/);
      assert.equal(await alert.evaluate(el => el.scrollWidth <= el.clientWidth), true, `${label} prompt wraps at ${width}px`);
      if (key) {
        await alert.focus();
        await page.keyboard.press(key);
      } else await alert.click();
      await page.waitForFunction(panel => document.documentElement.dataset.viewMode === "sheet"
        && document.activeElement?.closest("[data-feature-panel]")?.dataset.featurePanel === panel
        && document.querySelector(`[data-feature-panel="${panel}"] .onboarding-jump-target`), panel);
      assert.equal(await modal.locator('[role="tab"][aria-selected="true"]').getAttribute("data-feature-tab"), panel);
      assert.equal(await modal.locator(`[data-feature-panel="${panel}"] .onboarding-jump-target`).evaluate(el => {
        const body = el.closest(".app-dialog__body").getBoundingClientRect();
        const rect = el.getBoundingClientRect();
        return rect.top >= body.top && rect.bottom <= body.bottom;
      }), true, `${label} target is scrolled into view`);
      assert.deepEqual(await page.evaluate(() => collectStateObject()), beforeJump, "navigation preserves character choices");
      await page.waitForFunction(() => !document.querySelector(".onboarding-jump-target"));
      await page.keyboard.press("Escape");
      assert.equal(await modal.count(), 0);
      await page.evaluate(() => TabletopMode.setMode("tabletop"));
      await alert.waitFor({ state: "visible" });
      await page.evaluate(() => TabletopMode.setMode("sheet"));
    }
    console.log("Character abilities: creation/table relocation for all classes, tab conditions, controls, nested settings, saved state, focus, reminders and responsive layout passed.");
  } finally { await page.close(); }
}

async function verifyClassFeatureChoicePrompt(browser, url) {
  const page = await newUiPage(browser, { viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const modal = page.locator("#class-feature-choices-modal");
  const chooseAsPlayer = async (id, value) => {
    const key = await page.evaluate(({ id, value }) => {
      const select = document.getElementById(id);
      const index = Array.from(select.options).findIndex(option => option.value === value);
      if (index < 0) throw new Error(`Missing option ${id}: ${value}`);
      select.selectedIndex = index === 0 ? 1 : index - 1;
      return index === 0 ? "ArrowUp" : "ArrowDown";
    }, { id, value });
    await page.locator(`#${id}`).focus();
    await page.keyboard.press(key);
    assert.equal(await page.locator(`#${id}`).inputValue(), value, "native keyboard commits the player choice");
  };
  const closePrompt = async () => {
    await modal.getByRole("button", { name: "關閉", exact: true }).click();
    await modal.waitFor({ state: "detached" });
  };
  try {
    await page.goto(url);
    await page.locator("#legal-close-btn").click();
    const classes = await page.locator('#class option[value]:not([value=""])').evaluateAll(options => options.map(option => option.value));
    assert.equal(classes.length, 12, "completion covers every supported class");
    // Class reminders and the prompt wait until class, level, background and race are all chosen.
    await page.evaluate(() => applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] }, class: "fighter", level: "3", background: "", race: "" }));
    await chooseAsPlayer("level", "4");
    await page.waitForTimeout(200);
    assert.equal(await modal.count(), 0, "incomplete core selections do not prompt");
    assert.equal(await page.locator("#class-feature-choice-reminder").isHidden(), true, "incomplete core selections hide class reminders");
    const levelChoices = modal.locator('[data-feat-choice] select[id*="-level-"]:visible');
    const missingLevelChoices = () => page.evaluate(() => Array.from(getMissingClassFeatureChoiceSections())
      .flatMap(section => Array.from(section.querySelectorAll('[data-feat-choice] select[id*="-level-"]'), select => select.id)));
    for (const cls of classes) {
      // The level 4 class cantrip is pre-filled so only feature and feat groups are prompted.
      await page.evaluate(cls => applyStateObject({ __spellManagement: { version: 2, manual: false,
        entries: getClassCantripLimit(cls, 4) > getClassCantripLimit(cls, 3)
          ? [{ spellId: getClassSpells(cls, "cantrips")[0].spellId, spellClass: cls, classFeatureCantrip: "class-level-4" }] : [] },
        background: "soldier", race: "human", class: cls, level: "3",
        [`feat-choice-${cls}-level-4`]: "",
        [`feat-choice-${cls}-level-6`]: "",
        [`feat-choice-${cls}-level-8`]: ""
      }), cls);
      assert.deepEqual(await missingLevelChoices(), [], `${cls}: no improvement before level 4`);
      for (const level of cls === "fighter" ? [4, 6, 8] : [4, 8]) {
        await chooseAsPlayer("level", String(level));
        await modal.waitFor();
        const id = `feat-choice-${cls}-level-${level}`;
        assert.deepEqual(await levelChoices.evaluateAll(selects => selects.map(select => select.id)), [id], `${cls} ${level}: only the new improvement is missing`);
        assert.equal(await modal.locator(`#${id}`).evaluate(select => select.closest("section").querySelector("h3").textContent), `等級 ${level}：屬性值提升`);
        await modal.locator(`#${id}`).selectOption("屬性值提升");
        assert.deepEqual(await missingLevelChoices(), [], `${cls} ${level}: live selection completes the improvement`);
        assert.equal(await modal.locator(`#${id}`).isVisible(), true, "completed improvement stays visible until dismissal");
        assert.equal(await page.evaluate(id => collectStateObject()[id], id), "屬性值提升", "completion uses the existing character field");
        await closePrompt();
      }
      assert.deepEqual(await missingLevelChoices(), [], `${cls}: completed earlier improvements stay complete at level 8`);
      await page.evaluate(cls => { document.getElementById(`feat-choice-${cls}-level-4`).value = ""; syncDerivedFeatRows(); }, cls);
      await chooseAsPlayer("level", "7");
      await modal.waitFor();
      assert.deepEqual(await levelChoices.evaluateAll(selects => selects.map(select => select.id)), [`feat-choice-${cls}-level-4`], `${cls}: earlier missing improvement is included without completed levels`);
      await page.keyboard.press("Escape");
      await modal.waitFor({ state: "detached" });
      assert.equal(await page.inputValue(`#feat-choice-${cls}-level-4`), "", "Escape leaves the earlier improvement available for later completion");
      if (cls === "fighter") assert.equal(await page.inputValue("#feat-choice-fighter-level-6"), "屬性值提升", "Escape preserves the completed fighter improvement");
    }
    // A fresh character: earlier player level changes left cleric choices in the class option memory.
    // A fresh character: earlier player level changes left cleric choices in the class option memory.
    await page.evaluate(() => { ClassOptionMemory.clearMemories(); applyStateObject({ __spellManagement: { version: 2, manual: false,
      entries: [{ spellId: getClassSpells("cleric", "cantrips").at(-1).spellId, spellClass: "cleric", classFeatureCantrip: "class-level-4" }] },
    background: "soldier", race: "human", class: "cleric", level: "7" }); });
    await page.waitForTimeout(200);
    assert.equal(await modal.count(), 0, "JSON/restoration changes do not auto-open the prompt");
    await chooseAsPlayer("level", "8");
    await modal.waitFor();
    assert.deepEqual(await modal.locator("section[data-feature-level]:visible h3").allTextContents(), ["等級 1：神聖使命", "等級 4：屬性值提升", "等級 7：神佑打擊", "等級 8：屬性值提升"], "all earlier missing groups and improvements appear together");
    assert.equal(await modal.locator(".app-dialog__close").count(), 0, "the completion dialog has only its footer close button");
    await modal.locator("#cleric-guardian").check();
    await modal.locator("#cleric-trickster").check();
    await modal.locator("#cleric-trickster-cantrip").selectOption("guidance");
    assert.equal(await page.locator("#cleric-guardian").isChecked(), false, "mission exclusivity still uses the live controls");
    await modal.locator("#cleric-blessed-strikes-divine-strike").check();
    await modal.locator("#feat-choice-cleric-level-4").selectOption("屬性值提升");
    await modal.locator("#feat-choice-cleric-level-8").selectOption("警覺");
    assert.equal(await page.evaluate(() => collectStateObject()["cleric-trickster"]), true, "selection applies immediately while open");
    assert.equal(await modal.locator("section[data-feature-level]:visible").count(), 4, "completed sections stay in place until closed");
    await closePrompt();
    assert.equal(await page.locator("#level").evaluate(el => el === document.activeElement), true, "close returns focus to the level selector");
    assert.equal(await page.locator("#class-abilities-panel #classFeatures").count(), 1, "original controls return to their original parent");
    await chooseAsPlayer("level", "7");
    await page.waitForTimeout(200);
    assert.equal(await modal.count(), 0, "complete choices do not prompt at later levels");

    await chooseAsPlayer("class", "druid");
    await modal.waitFor();
    assert.deepEqual(await modal.locator("section[data-feature-level]:visible h3").allTextContents(), ["等級 1：原初使命", "等級 3：大地結社法術（大地子職）", "等級 4：屬性值提升", "等級 7：元素狂怒"], "land terrain is chosen in its level 3 section between levels 1 and 4");
    assert.equal(await modal.locator('section[data-druid-land-choice] [data-class-feature-additional="druid-land"]').getByLabel("大地結社地貌", { exact: true }).isVisible(), true);
    assert.notEqual(await modal.locator(".rule-table-shell--druid-terrain-spells").evaluate(el => getComputedStyle(el).borderTopStyle), "none", "rule tables keep their frame in the completion dialog");
    await modal.locator("#druid-sentinel").check();
    await modal.locator("#druid-elemental-fury-primal-strike").check();
    await modal.locator("#feat-choice-druid-level-4").selectOption("屬性值提升");
    await page.keyboard.press("Escape");
    await modal.waitFor({ state: "detached" });
    assert.equal(await page.evaluate(() => collectShareState()["druid-elemental-fury-primal-strike"]), true, "Escape preserves choices in share state");

    await chooseAsPlayer("class", "ranger");
    await modal.waitFor();
    assert.deepEqual(await modal.locator("section[data-feature-level]:visible h3").allTextContents(), ["等級 2：戰鬥風格", "等級 3：狩獵目標（獵人子職）", "等級 4：屬性值提升", "等級 7：防守戰術（獵人子職）"]);
    await modal.locator("#feat-choice-ranger-level-4").selectOption("屬性值提升");
    const styleRow = modal.locator('[data-feat-choice="fighting-style-ranger"]');
    assert.equal(await styleRow.isVisible(), false, "unchecked ranger style hides its label, selector and view button");
    await modal.locator("#ranger-fighting-style").check();
    assert.equal(await styleRow.isVisible(), true, "checking ranger style reveals the complete field");
    await modal.locator("#ranger-fighting-style").uncheck();
    assert.equal(await styleRow.isVisible(), false, "unchecking ranger style hides the complete field again");
    await modal.locator("#ranger-fighting-style").check();
    const style = modal.locator("#feat-choice-fighting-style-ranger");
    const view = style.locator("..").locator(".feat-choice-view");
    assert.equal(await view.isDisabled(), true, "empty choice cannot open details");
    await closePrompt();
    await page.waitForTimeout(200);
    assert.equal(await modal.count(), 0, "closing an incomplete prompt does not re-open it");
    await chooseAsPlayer("level", "8");
    await modal.waitFor();
    assert.equal(await style.isEnabled(), true, "checked style with no feat still prompts");
    await style.selectOption("防禦");
    await view.click();
    const detail = page.locator('.app-dialog[data-variant="feat-detail"]');
    assert.equal(await detail.locator(".feat-desc-title").textContent(), "防禦");
    assert.equal(await modal.evaluate(el => el.inert), true, "feat details lock the parent prompt");
    await page.keyboard.press("Escape");
    await detail.waitFor({ state: "detached" });
    assert.equal(await view.evaluate(el => el === document.activeElement), true, "feat detail returns to its view button");
    await modal.locator("#ranger-druidic-warrior").check();
    assert.equal(await styleRow.isVisible(), false, "the caster alternative hides the fighting style field");
    await modal.getByLabel("戲法 #1", { exact: true }).selectOption("guidance");
    await modal.getByLabel("戲法 #2", { exact: true }).selectOption("starry-wisp");
    await closePrompt();
    await chooseAsPlayer("level", "2");
    await page.waitForTimeout(200);
    assert.equal(await modal.count(), 0, "caster alternative completes the choice after selecting both cantrips");

    await chooseAsPlayer("class", "paladin");
    await modal.waitFor();
    const paladinStyleRow = modal.locator('[data-feat-choice="fighting-style-paladin"]');
    assert.equal(await paladinStyleRow.isVisible(), false, "unchecked paladin style hides its label, selector and view button");
    await modal.locator("#paladin-fighting-style").check();
    assert.equal(await paladinStyleRow.isVisible(), true, "checking paladin style reveals the complete field");
    await modal.locator("#feat-choice-fighting-style-paladin").selectOption("防禦");
    await modal.locator("#class-feature-prompt-disabled").check();
    const selected = await page.evaluate(() => ({ state: collectStateObject(), share: collectShareState() }));
    assert.equal(Object.hasOwn(selected.state, "class-feature-prompt-disabled"), false, "preference stays out of character JSON");
    assert.equal(Object.hasOwn(selected.share, "class-feature-prompt-disabled"), false, "preference stays out of shares");
    await closePrompt();
    await page.waitForFunction(() => JSON.parse(dndStorage.getItem(AUTO_SAVE_KEY) || "{}")["paladin-fighting-style"] === true);
    assert.equal(await page.evaluate(() => Object.hasOwn(JSON.parse(dndStorage.getItem(AUTO_SAVE_KEY)), "class-feature-prompt-disabled")), false, "preference stays out of autosave");
    await page.goto(url);
    await page.locator("#legal-close-btn").click();
    assert.equal(await modal.count(), 0, "loading incomplete autosave does not prompt");
    await chooseAsPlayer("class", "cleric");
    await page.waitForTimeout(200);
    assert.equal(await modal.count(), 0, "disabled preference survives page reload");
    await page.evaluate(() => {
      dndStorage.removeItem(CLASS_FEATURE_PROMPT_DISABLED_KEY);
      classFeaturePromptDisabled = false;
      document.getElementById("manual-feat-management").checked = true;
      updateFeatManagementMode();
    });
    await chooseAsPlayer("class", "paladin");
    await page.waitForTimeout(200);
    assert.equal(await modal.count(), 0, "manual feat management retains its existing behavior");
    await chooseAsPlayer("level", "8");
    await page.waitForTimeout(200);
    assert.equal(await modal.count(), 0, "manual feat management also skips missing improvements");
    const details = page.locator("#character-features-modal");
    for (const [tab, width] of [["class", 1280], ["background", 390], ["race", 390]]) {
      await page.setViewportSize({ width, height: 900 });
      const before = await page.evaluate(() => collectStateObject());
      await page.locator(`[data-character-features-tab="${tab}"]`).click();
      const panel = details.locator(`[data-feature-panel="${tab}"]`);
      assert.equal(await panel.locator("[data-feat-choice] select:visible").count(), 0, "manual mode hides source feat/style/improvement selectors");
      const guidance = panel.locator(".manual-feat-guidance:visible").first();
      assert.match(await guidance.innerText(), /請至首頁最下方自行管理專長。/);
      if (tab !== "class") assert.equal(await panel.evaluate(el => el.lastElementChild.classList.contains("manual-feat-guidance")), true);
      for (const theme of ["classic", "warm"]) {
        for (const mode of ["light", "dark"]) {
          await page.evaluate(({ theme, mode }) => { document.documentElement.dataset.uiTheme = theme; document.documentElement.dataset.theme = mode; }, { theme, mode });
          assert.equal(await guidance.evaluate(el => getComputedStyle(el).color !== getComputedStyle(document.body).color), true, "guidance uses theme accent text");
          assert.equal(await guidance.locator("p").evaluate(el => getComputedStyle(el).color === getComputedStyle(el.parentElement).color), true, "dialog paragraph styles preserve the guidance accent");
          assert.equal(await details.locator(".app-dialog__surface").evaluate(el => el.scrollWidth <= el.clientWidth), true);
        }
      }
      const forward = guidance.getByRole("button", { name: "前往自行管理", exact: true });
      await forward.focus();
      await page.keyboard.press("Enter");
      await page.waitForFunction(() => !document.getElementById("character-features-modal")
        && document.getElementById("feat-management-section").classList.contains("onboarding-jump-target")
        && (document.activeElement?.closest("#feats-area") || document.activeElement?.id === "feat-add-empty"));
      assert.deepEqual(await page.evaluate(() => collectStateObject()), before, "manual guidance navigation preserves all selections");
    }
    await page.evaluate(() => { document.getElementById("manual-feat-management").checked = false; updateFeatManagementMode(); });
    await page.locator('[data-character-features-tab="class"]').click();
    assert.equal(await details.locator("[data-feature-panel='class'] .manual-feat-guidance:visible").count(), 0, "automatic mode removes manual guidance");
    assert(await details.locator("[data-feature-panel='class'] [data-feat-choice] select:visible").count() > 0, "automatic mode restores source selectors");
    await page.keyboard.press("Escape");
    await page.locator("#level").selectOption("2");
    await page.setViewportSize({ width: 390, height: 844 });
    await chooseAsPlayer("level", "3");
    await modal.waitFor();
    await modal.locator("#paladin-blessed-warrior").check();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "narrow prompt has no page overflow");
    await closePrompt();
    await chooseAsPlayer("level", "4");
    await modal.waitFor();
    assert.deepEqual(await levelChoices.evaluateAll(selects => selects.map(select => select.id)), ["feat-choice-paladin-level-4"]);
    await closePrompt();
    await page.locator('[data-character-features-tab="class"]').click();
    const original = page.locator("#character-features-modal");
    await original.locator("#paladin-fighting-style").check();
    await original.locator("#feat-choice-fighting-style-paladin").selectOption("防禦");
    await original.locator('[data-feat-choice="fighting-style-paladin"] .feat-choice-view').click();
    await detail.waitFor();
    await detail.getByRole("button", { name: "關閉", exact: true }).click();
    assert.equal(await original.isVisible(), true, "original class dialog also supports nested feat lookup");
    await original.locator("#feat-choice-paladin-level-4").selectOption("警覺");
    await original.locator('[data-feat-choice="paladin-level-4"] .feat-choice-view').click();
    assert.equal(await detail.locator(".feat-desc-title").textContent(), "警覺", "ordinary class feats also have lookup");
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    const hash = await page.evaluate(() => encodeStateToHash(collectShareState()));
    await page.goto(`${url}${hash}`);
    assert.equal(await modal.count(), 0, "opening a share does not prompt or receive the preference");
    await page.goto(url);
    await page.locator("#legal-close-btn").click();
    await page.evaluate(() => dndStorage.setItem(CLASS_FEATURE_PROMPT_DISABLED_KEY, "true"));
    await page.locator("#utility-menu-toggle").click();
    await page.locator("#clear-storage-btn").click();
    await page.getByRole("button", { name: "清除紀錄", exact: true }).click();
    await page.waitForFunction(() => dndStorage.getItem(CLASS_FEATURE_PROMPT_DISABLED_KEY) === null);
    await page.locator("#legal-close-btn").click();
    await chooseAsPlayer("background", "soldier");
    await chooseAsPlayer("race", "human");
    await chooseAsPlayer("level", "1");
    await chooseAsPlayer("class", "cleric");
    await modal.waitFor();
    await closePrompt();
  } finally { await page.close(); }
  console.log("Class option completion: all 12 classes' improvements (including fighter level 6), earlier missing levels, live choices, nested feat lookup, dismissal, manual management, local preference, clear, share and narrow layout passed.");
}

async function verifyClassFeatureSupplementalChoices(browser, url) {
  const page = await newUiPage(browser, { viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const modal = page.locator("#class-feature-choices-modal");
  const open = async state => {
    await page.evaluate(state => {
      applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] }, __spellManagement: { version: 2, manual: state["manual-spell-management"] === true, entries: [] }, ...state });
      openClassFeatureChoicePrompt(getMissingClassFeatureChoiceSections(), document.getElementById("level"));
    }, state);
    await modal.waitFor();
  };
  const close = async () => {
    await modal.getByRole("button", { name: "關閉", exact: true }).click();
    await modal.waitFor({ state: "detached" });
  };
  const roundTrip = async check => {
    const data = await page.evaluate(() => { saveAllFields(); return collectStateObject(); });
    assert.equal(Object.keys(data).some(key => key.startsWith("class-feature-linked-")), false, "linked fields never enter character JSON");
    await page.evaluate(data => applyStateObject(Object.fromEntries(Object.entries(JSON.parse(JSON.stringify(data))).reverse())), data);
    await check();
    const hash = await page.evaluate(() => encodeStateToHash(collectShareState()));
    await page.goto(`${url}${hash}`);
    await check();
    assert.equal(await modal.count(), 0, "share restoration never auto-opens completion");
    await page.goto(url);
    await page.locator("#legal-close-btn").click();
    await check();
  };
  try {
    await page.goto(url);
    await page.locator("#legal-close-btn").click();
    await open({ class: "fighter", level: "4", "feat-choice-fighter-level-4": "" });
    await modal.locator("#feat-choice-fighter-level-4").selectOption("魔法學徒");
    const magic = modal.locator('[data-class-feature-additional="fighter-level-4"]');
    await magic.getByLabel("魔法學徒法表", { exact: true }).selectOption("wizard");
    await magic.getByLabel("戲法 #1", { exact: true }).selectOption("light");
    await magic.getByLabel("戲法 #2", { exact: true }).selectOption("mage-hand");
    await magic.getByLabel("一環法術", { exact: true }).selectOption("shield");
    for (const label of ["戲法 #1", "戲法 #2", "一環法術"]) {
      const select = magic.getByLabel(label, { exact: true });
      const selected = await select.inputValue();
      assert.equal(await select.locator(`option[value="${selected}"]`).textContent(), await page.evaluate(id => SpellCatalog.getSpell(id).nameZh, selected), `${label}: the current choice shows only Chinese without its own prepared marker`);
    }
    assert.equal(await magic.getByLabel("戲法 #2", { exact: true }).locator('option[value="light"]').textContent(), "光亮術（已準備）", "other prepared choices retain the marker without English");
    assert.equal(await page.inputValue("#derived-feat-fighter-level-4-magic-initiate-level-1"), "shield", "linked selection updates the canonical feat immediately");
    await magic.getByRole("button", { name: "查看一環法術詳情" }).click();
    const detail = page.locator("#quick-build-spell-detail");
    await detail.waitFor();
    await page.keyboard.press("Escape");
    assert.equal(await magic.getByRole("button", { name: "查看一環法術詳情" }).evaluate(el => el === document.activeElement), true);
    assert.equal(await modal.evaluate(el => el.scrollWidth <= el.clientWidth), true, "supplemental fields fit the narrow dialog");
    assert.equal(await modal.locator(".app-dialog__body").evaluate(el => el.scrollWidth <= el.clientWidth), true, "supplemental fields do not add horizontal body scrolling");
    await close();
    await roundTrip(async () => assert.equal(await page.inputValue("#derived-feat-fighter-level-4-magic-initiate-level-1"), "shield"));

    // An already chosen feat with an unfinished form is still a missing section.
    await open({ class: "fighter", level: "4", "feat-choice-fighter-level-4": "魔法學徒", "derived-feat-fighter-level-4-magic-initiate-level-1": "" });
    assert.equal(await magic.isVisible(), true);
    await modal.locator("#feat-choice-fighter-level-4").selectOption("警覺");
    assert.equal(await magic.count(), 0, "changing feat removes the supplemental form");
    await close();

    for (const [cls, id, spellId, other] of [
      ["cleric", "cleric-trickster", "guidance", "cleric-guardian"],
      ["druid", "druid-shaman", "starry-wisp", "druid-sentinel"]
    ]) {
      await open({ class: cls, level: "1", [id]: false, [other]: false, [`${id}-cantrip`]: "",
        __spellManagement: { version: 2, manual: false, entries: [{ spellId: "mending", spellClass: cls, level: 0 }] } });
      assert.match(await modal.locator(`#${id}-cantrip option[value="mending"]`).textContent(), /（已準備）$/u, "existing prepared spells are marked before choosing an extra cantrip");
      assert.equal(await modal.locator(`#${id}-cantrip`).isVisible(), false);
      await modal.locator(`#${id}`).check();
      await modal.locator(`#${id}-cantrip`).selectOption(spellId);
      assert.equal(await modal.locator(`#${id}-cantrip option[value="${spellId}"]`).textContent(), await page.evaluate(id => SpellCatalog.getSpell(id).nameZh, spellId));
      const sourceSpell = () => page.evaluate(key => SpellManagement.getEntries()
        .find(entry => entry.sourceKey === key)?.spellId || "", `class-${id}-cantrip`);
      assert.equal(await sourceSpell(), spellId);
      await modal.locator(`#${other}`).check();
      assert.doesNotMatch(await modal.locator(`#${id}-cantrip option[value="${spellId}"]`).textContent(), /（已準備）$/u, "removing the mission source updates the marker");
      assert.equal(await modal.locator(`#${id}-cantrip`).isVisible(), false);
      assert.equal(await sourceSpell(), "", "switching mission removes its automatic spell");
      await modal.locator(`#${id}`).check();
      assert.equal(await modal.locator(`#${id}-cantrip`).inputValue(), spellId, "switching back preserves the ability choice");
      await close();
      await page.evaluate(() => { showTab("basic"); });
      await page.locator('[data-character-features-tab="class"]').click();
      const classModal = page.locator("#character-features-modal");
      await classModal.waitFor();
      assert.equal(await classModal.locator(`#${id}-cantrip option[value="${spellId}"]`).textContent(), await page.evaluate(id => SpellCatalog.getSpell(id).nameZh, spellId), "the class dialog also hides English and the current choice marker");
      assert.equal(await classModal.locator(`#${id}-cantrip option[value="mending"]`).textContent(), "修復術（已準備）");
      await page.keyboard.press("Escape");
      await roundTrip(async () => {
        assert.equal(await page.inputValue(`#${id}-cantrip`), spellId);
        assert.equal(await sourceSpell(), spellId);
      });
    }

    for (const [cls, id, prefix, spells] of [
      ["paladin", "paladin-blessed-warrior", "class-paladin-blessed-warrior", ["guidance", "sacred-flame"]],
      ["ranger", "ranger-druidic-warrior", "class-ranger-druidic-warrior", ["guidance", "starry-wisp"]]
    ]) {
      await open({ class: cls, level: "2", [id]: false, [`${cls}-fighting-style`]: false });
      await modal.locator(`#${id}`).check();
      await modal.getByLabel("戲法 #1", { exact: true }).selectOption(spells[0]);
      assert.match(await modal.getByLabel("戲法 #2", { exact: true }).locator(`option[value="${spells[0]}"]`).textContent(), /（已準備）$/u, "other fields also mark the prepared spell");
      assert.equal(await modal.getByLabel("戲法 #2", { exact: true }).locator(`option[value="${spells[0]}"]`).isDisabled(), true, "sibling cantrips remain distinct");
      await modal.getByLabel("戲法 #2", { exact: true }).selectOption(spells[1]);
      await close();
      await roundTrip(async () => {
        for (const [index, spellId] of spells.entries()) assert.equal(await page.evaluate(key => SpellManagement.getEntries()
          .find(entry => entry.sourceKey === key)?.spellId, `${prefix}-cantrip-${index + 1}`), spellId);
      });
      await open({ class: cls, level: "2", [id]: true, __classFeatureCantrips: { [`${prefix}-cantrip-1`]: "" } });
      assert.equal(await modal.getByLabel("戲法 #1", { exact: true }).isVisible(), true, "unfinished alternative reappears without an unchecked ability");
      await close();
    }

    await open({ class: "bard", level: "6", "feat-choice-bard-level-4": "屬性值提升", __bardMagicalDiscoverySelection: [] });
    for (const [slot, cls, ring, spellId] of [[1, "wizard", "1", "shield"], [2, "cleric", "cantrips", "guidance"]]) {
      await modal.locator(`#bard-magical-discovery-${slot}-class`).selectOption(cls);
      await modal.locator(`#bard-magical-discovery-${slot}-ring`).selectOption(ring);
      await modal.locator(`#bard-magical-discovery-${slot}-spell`).selectOption(spellId);
      assert.equal(await modal.locator(`#bard-magical-discovery-${slot}-spell option[value="${spellId}"]`).textContent(), await page.evaluate(id => SpellCatalog.getSpell(id).nameZh, spellId));
    }
    await close();
    await roundTrip(async () => assert.equal(await page.inputValue("#bard-magical-discovery-1-spell"), "shield"));
    await open({ class: "druid", level: "3", "druid-land": "" });
    await modal.getByLabel("大地結社地貌", { exact: true }).selectOption("polar");
    assert.equal(await page.inputValue("#druid-land-control #druid-land"), "polar", "the linked terrain field edits the basic tab control immediately");
    await close();
    await page.evaluate(() => openCharacterFeatures("class"));
    const classModal = page.locator("#character-features-modal");
    const classLand = classModal.locator('section[data-druid-land-choice] [data-class-feature-additional="druid-land"]').getByLabel("大地結社地貌", { exact: true });
    assert.equal(await classLand.inputValue(), "polar", "the class dialog shows the current terrain");
    await classLand.selectOption("arid");
    assert.equal(await page.inputValue("#druid-land"), "arid");
    await classModal.locator('#character-features-picker [data-picker-value="cleric"]').click();
    assert.equal(await classModal.locator('[data-class-feature-additional="druid-land"]').count(), 0, "other classes have no terrain field");
    await classModal.locator('#character-features-picker [data-picker-value="druid"]').click();
    assert.equal(await classLand.inputValue(), "arid", "the terrain field remounts after the class dialog rerenders");
    await page.keyboard.press("Escape");
    await classModal.waitFor({ state: "detached" });
    assert.equal(await page.locator("#druid-land-control #druid-land").inputValue(), "arid", "the canonical control stays on the basic tab");
    await open({ class: "sorcerer", level: "6", "sorcerer-elemental-affinity-damage-type": "" });
    await modal.locator("#sorcerer-elemental-affinity-damage-type").selectOption("fire");
    assert.equal(await modal.locator("#metamagic-options-section").isVisible(), true);
    await modal.locator('input[data-metamagic-name]:enabled').nth(0).check();
    await modal.locator('input[data-metamagic-name]:enabled').nth(1).check();
    assert.equal(await page.evaluate(() => getClassFeatureChoiceIssues().some(issue => issue.reminderType === "metamagic")), false);
    await close();
    assert.equal(await page.locator("#character-features #metamagic-options-section").count(), 1);
    await open({ class: "warlock", level: "2" });
    assert.equal(await modal.locator("#eldritch-invocations-section").isVisible(), true);
    await modal.locator('input[data-invocation-name="原初之一教習"]').first().check();
    await modal.locator('#feat-choice-lessons-1').selectOption("魔法學徒");
    await modal.locator('[data-class-feature-additional="lessons-1"]').getByLabel("魔法學徒法表", { exact: true }).selectOption("wizard");
    assert.equal(await modal.locator('[data-class-feature-additional="lessons-1"]').getByLabel("一環法術", { exact: true }).isEnabled(), true, "invocation origin feats use the same live supplemental form");
    await close();
    assert.equal(await page.locator("#character-features #eldritch-invocations-section").count(), 1);

    await open({ class: "warlock", level: "2", __spellManagement: { version: 2, manual: false,
      entries: [{ spellId: "eldritch-blast", spellClass: "warlock", level: 0 }] } });
    await modal.locator('input[data-invocation-name="苦痛魔爆"]').first().check();
    await modal.getByLabel("苦痛魔爆：戲法 #1", { exact: true }).selectOption("eldritch-blast");
    assert.equal(await page.evaluate(() => getAgonizingBlastSelects()[0].value), "eldritch-blast", "invocation target can be completed inline");
    await close();

    const retainedChoices = { "class-paladin-blessed-warrior-cantrip-1": "guidance", "class-paladin-blessed-warrior-cantrip-2": "sacred-flame" };
    await page.evaluate(choices => {
      applyStateObject({ class: "paladin", level: "2", __spellManagement: { version: 2, manual: true, entries: [] },
        "paladin-blessed-warrior": true, __classFeatureCantrips: choices });
      openClassFeatureChoicePrompt(getMissingClassFeatureChoiceSections(), document.getElementById("level"));
    }, retainedChoices);
    assert.equal(await modal.count(), 0, "manual spell management does not prompt for hidden cantrip choices");
    await page.evaluate(() => openCharacterFeatures("class"));
    assert.equal(await page.locator("#character-features-modal .class-feature-additional-choices:visible").count(), 0);
    assert.equal(await page.locator("#character-features-modal .manual-spell-source-hint").count(), 0);
    await page.keyboard.press("Escape");
    assert.deepEqual(await page.evaluate(() => SpellManagement.collectClassFeatureCantrips()), retainedChoices, "manual mode retains hidden automatic choices");
    assert.equal(await page.evaluate(() => SpellManagement.getEntries().filter(entry => entry.sourceKey.includes("blessed-warrior")).length), 0);
    await roundTrip(async () => assert.equal(await page.evaluate(() => SpellManagement.collectClassFeatureCantrips()["class-paladin-blessed-warrior-cantrip-2"]), "sacred-flame"));
  } finally { await page.close(); }
  console.log("Class supplemental choices: live feat forms, all four class cantrip grants, discoveries, other class options, JSON/share/autosave, nested lookup and narrow layout passed.");
}

async function verifyFeatureReferences(browser, url) {
  const page = await newUiPage(browser, { viewport: { width: 1280, height: 900 }, reducedMotion: "reduce", hasTouch: true });
  try {
    await page.goto(url);
    await page.locator("#legal-close-btn").click();
    const ruleCoverage = await page.evaluate(() => {
      const skills = ["體操", "馴獸", "奧秘", "運動", "欺瞞", "歷史", "洞悉", "威嚇", "調查",
        "醫藥", "自然", "察覺", "表演", "遊說", "宗教", "巧手", "隱匿", "生存", "求生", "醫學", "說服", "優勢", "劣勢", "抗性", "藉機攻擊"];
      const failures = [];
      const sources = [...Object.entries(classFeatures), ...Object.entries(raceFeatureDisplay),
        ["all skill references", `<p>${skills.map(skillTip).join("、")}</p>`],
        ["plain prose", `<p>${skills.filter(term => !["優勢", "劣勢"].includes(term)).join("、")}</p>`]];
      for (const [name, html] of sources) {
        const before = document.createElement("template");
        const after = document.createElement("template");
        before.innerHTML = html;
        after.innerHTML = highlightFeatureRuleTerms(html);
        if (before.content.textContent !== after.content.textContent) failures.push(`${name}: text changed`);
        const controls = root => Array.from(root.querySelectorAll("input, select, textarea"), el => el.outerHTML);
        if (JSON.stringify(controls(before.content)) !== JSON.stringify(controls(after.content))) failures.push(`${name}: controls changed`);
        if (after.content.querySelector("button button, select .skill-tip, .skill-tip .skill-tip")) failures.push(`${name}: nested control`);
        const skillLabels = root => Array.from(root.querySelectorAll(".skill-tip"), tip => tip.dataset.skill)
          .filter(term => !["優勢", "劣勢"].includes(term));
        if (JSON.stringify(skillLabels(before.content)) !== JSON.stringify(skillLabels(after.content))) failures.push(`${name}: skill references changed`);
        const walker = document.createTreeWalker(after.content, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          const boldLabel = node.parentElement?.closest("strong, b");
          if (boldLabel && /[：:]\s*$/.test(boldLabel.textContent)) continue;
          if (!node.parentElement?.closest('h1, h2, h3, h4, h5, h6, a, button, select, textarea, .skill-tip, .beast-tip, [role="button"]')
            && /優勢|劣勢/.test(node.textContent)) failures.push(`${name}: unlinked advantage/disadvantage`);
        }
        for (const heading of after.content.querySelectorAll("h1, h2, h3, h4, h5, h6, strong, b")) {
          if ((/^H[1-6]$/.test(heading.tagName) || /[：:]\s*$/.test(heading.textContent))
            && heading.querySelector(".skill-tip")) failures.push(`${name}: linked heading ${heading.textContent}`);
        }
        for (const tip of after.content.querySelectorAll(".feature-rule-tip")) {
          if (!renderSkillPopupHtml(tip.dataset.skill, tip.dataset.condition)) failures.push(`${name}: missing explanation`);
        }
      }
      const conditionCounts = {
        barbarian: 4, bard: 2, cleric: 3, druid: 1, fighter: 0, monk: 4,
        paladin: 5, ranger: 0, rogue: 4, sorcerer: 0, warlock: 1, wizard: 0,
        dragonborn: 1, dwarf: 1, elf: 1, gnome: 0, goliath: 2, halfling: 1, human: 0, orc: 0, tiefling: 0
      };
      for (const [name, expected] of Object.entries(conditionCounts)) {
        const html = highlightSpellNamesInClassFeature(classFeatures[name] || raceFeatureDisplay[name]);
        const template = document.createElement("template");
        template.innerHTML = html;
        const tips = template.content.querySelectorAll("button.condition-tip");
        if (tips.length !== expected) failures.push(`${name}: condition coverage ${tips.length}/${expected}`);
        if (template.content.querySelector("h3 .condition-tip, h4 .condition-tip, button button")) failures.push(`${name}: condition in heading/nested control`);
        if (highlightFeatureRuleTerms(html) !== html) failures.push(`${name}: repeated condition decoration`);
        for (const tip of tips) {
          const condition = getDndCondition(tip.dataset.condition);
          if (!condition || tip.textContent !== condition.zh) failures.push(`${name}: wrong condition key`);
        }
      }
      for (const [name, raw] of Object.entries(featsDesc)) {
        const template = document.createElement("template");
        template.innerHTML = formatFeatDescription(raw);
        const expected = name === "警覺" ? 1 : name === "擒抱者" ? 3 : 0;
        if (template.content.querySelectorAll("button.condition-tip").length !== expected) failures.push(`${name}: feat condition coverage`);
        if (template.content.querySelector("strong .feature-rule-tip, .feat-desc-title .feature-rule-tip, .feat-desc-subtitle .feature-rule-tip")) failures.push(`${name}: linked feat heading`);
        if (/<[^>]+>/.test(raw)) failures.push(`${name}: feat source must remain plain text`);
        if (template.content.textContent.replace(/\s/g, "") !== raw.replace(/\s/g, "")) failures.push(`${name}: feat text changed`);
        for (const tip of template.content.querySelectorAll(".feature-rule-tip")) {
          if (!renderSkillPopupHtml(tip.dataset.skill, tip.dataset.condition)) failures.push(`${name}: missing explanation for ${tip.textContent}`);
        }
        const walker = document.createTreeWalker(template.content.querySelector(".feat-desc-body"), NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (!node.parentElement.closest("strong, button") && /優勢|劣勢|藉機攻擊/.test(node.textContent)) failures.push(`${name}: unlinked rule term`);
        }
      }
      const finder = document.createElement("template");
      finder.innerHTML = formatFeatDescription(featsDesc["尋物好手"]);
      const finderSkills = Array.from(finder.content.querySelectorAll("button.skill-tip"), tip => tip.dataset.skill);
      if (JSON.stringify(finderSkills) !== JSON.stringify(["洞悉", "調查", "察覺"])) failures.push(`尋物好手: skill links ${finderSkills}`);
      for (const [name, count] of [["fighter", 2], ["monk", 1], ["ranger", 1], ["rogue", 1]]) {
        const template = document.createElement("template");
        template.innerHTML = highlightSpellNamesInClassFeature(classFeatures[name]);
        if (template.content.querySelectorAll('button[data-skill="藉機攻擊"]').length !== count) failures.push(`${name}: opportunity attack links`);
      }
      for (const condition of DND_CONDITIONS) {
        const tip = createDndConditionTip(condition.key);
        const template = document.createElement("template");
        template.innerHTML = renderSkillPopupHtml(null, condition.key);
        const effects = Array.from(template.content.querySelectorAll(".skill-popup-paragraph"), p => p.textContent);
        if (!tip || JSON.stringify(effects) !== JSON.stringify(condition.effects)) failures.push(`${condition.key}: canonical rules unavailable`);
      }
      if (createDndConditionTip("unknown") !== null || renderSkillPopupHtml(null, "unknown") !== "") failures.push("unknown condition key");
      if (createDndConditionTip("frightened", "恐懼").textContent !== "恐懼") failures.push("condition alias label");
      for (const [name, html, count] of [
        ["barbarian", classFeatures.barbarian, 1], ["ranger", classFeatures.ranger, 1],
        ["sorcerer", classFeatures.sorcerer, 1], ["warlock", classFeatures.warlock, 1],
        ["dragonborn", raceFeatureDisplay.dragonborn, 1], ["tiefling", raceFeatureDisplay.tiefling, 3]
      ]) {
        const template = document.createElement("template");
        template.innerHTML = highlightSpellNamesInClassFeature(html);
        if (template.content.querySelectorAll('button[data-skill="抗性"]').length !== count) failures.push(`${name}: resistance body links`);
      }
      if (!classFeatures.barbarian.includes("<strong>好處：</strong>")) failures.push("reckless attack label");
      const bard = document.createElement("template");
      bard.innerHTML = classFeatures.bard;
      if (!bard.content.querySelector('[data-action-id="bard-countercharm"]').textContent.includes("使用：反應")) failures.push("countercharm label");
      const cleric = document.createElement("template");
      cleric.innerHTML = highlightSpellNamesInClassFeature(classFeatures.cleric);
      const mission = cleric.content.querySelector("#cleric-trickster").closest(".druid-mission-option");
      for (const skill of ["奧秘", "宗教"]) {
        if (!mission.querySelector(`button[data-skill="${skill}"]`)) failures.push(`cleric: missing ${skill} reference`);
      }
      const proseExamples = {
        bard: ["話語、音樂或表演"],
        druid: ["德魯伊操使自然魔法", "將心交給自然", "察覺與解讀", "檢定察覺訊息", "自然精魂", "自然恢復"],
        fighter: ["運動健將"],
        ranger: ["自然魔法", "察覺危險"],
        warlock: ["超自然契約", "超自然能力"],
        elf: ["自然與生命", "超自然的能力"],
        orc: ["其歷史"],
        tiefling: ["歷史印象"]
      };
      for (const [name, examples] of Object.entries(proseExamples)) {
        const template = document.createElement("template");
        template.innerHTML = highlightSpellNamesInClassFeature(classFeatures[name] || raceFeatureDisplay[name]);
        for (const phrase of examples) {
          const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
          let found = false;
          while (walker.nextNode()) {
            if (walker.currentNode.textContent.includes(phrase)
              && !walker.currentNode.parentElement?.closest(".skill-tip")) found = true;
          }
          if (!found) failures.push(`${name}: prose must remain unlinked: ${phrase}`);
        }
      }
      const once = highlightFeatureRuleTerms('<p>優勢與隱匿</p><button>劣勢</button><select><option>自然</option></select>');
      if (highlightFeatureRuleTerms(once) !== once) failures.push("duplicate decoration");
      return failures;
    });
    assert.deepEqual(ruleCoverage, [], "all class/race descriptions link explicit skills and preserve non-skill prose, text and controls");
    await page.locator("#class").selectOption("druid");
    await page.locator("#level").selectOption("3");
    const opener = page.locator('[data-character-features-tab="class"]');
    const modal = page.locator("#character-features-modal");
    const assertOnTop = async locator => {
      await locator.waitFor({ state: "visible" });
      assert.equal(await locator.evaluate(el => {
        const rect = el.getBoundingClientRect();
        const x = Math.min(innerWidth - 1, rect.left + rect.width / 2);
        const y = Math.min(innerHeight - 1, rect.top + rect.height / 2);
        return !el.closest("[inert]") && el.contains(document.elementFromPoint(x, y));
      }), true, "reference must receive input above the ability dialog");
    };
    for (const width of [1280, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await opener.click();
      await modal.getByRole("tab", { name: "表格", exact: true }).click();
      await modal.locator("#classCreationInfo .skill-tip").first().click();
      await assertOnTop(page.locator("#skillPopup"));
      await page.locator("#skillPopup .close").click();
      await modal.getByRole("tab", { name: "職業", exact: true }).click();
      for (const [trigger, popup] of [[".skill-tip", "#skillPopup"], ['.beast-tip[data-beast="wolf"]', "#beastPopup"]]) {
        await modal.locator(`#classFeatures ${trigger}`).first().click();
        const reference = page.locator(popup);
        await assertOnTop(reference);
        assert.notEqual(await reference.locator(".content").textContent(), "");
        await reference.locator(".close").click();
        assert.equal(await reference.isVisible(), false);
        assert.equal(await modal.isVisible(), true);
        await modal.locator(`#classFeatures ${trigger}`).first().click();
        await assertOnTop(reference);
        await page.keyboard.press("Escape");
        assert.equal(await reference.isVisible(), false);
        assert.equal(await modal.isVisible(), true, "Escape dismisses a reference without closing abilities");
      }
      const spellTrigger = modal.locator("#classFeatures .spell-highlight-action").first();
      await spellTrigger.click();
      const spell = page.locator("#quick-build-spell-detail");
      await assertOnTop(spell.locator(".quick-build-spell-detail-shell"));
      assert.equal(await spell.locator(".quick-build-spell-detail-close").evaluate(el => el === document.activeElement), true);
      await spell.locator(".quick-build-spell-prepare-cancel").click();
      assert.equal(await modal.isVisible(), true);
      assert.equal(await spellTrigger.evaluate(el => el === document.activeElement), true);
      await spellTrigger.click();
      await page.keyboard.press("Escape");
      assert.equal(await spell.isVisible(), false);
      assert.equal(await modal.isVisible(), true, "Escape closes only the spell reference");
      await modal.locator('#classFeatures .beast-tip[data-beast="wolf"]').first().click();
      await modal.locator(".app-dialog__close").click();
      assert.equal(await page.locator("#beastPopup").isVisible(), false);
      assert.equal(await page.locator("#skillPopup, #beastPopup").evaluateAll(popups => popups.every(el => el.parentElement === document.body && !el.inert)), true);
      await page.evaluate(() => showTab("skills"));
      await page.locator('#tab-skills .skill-tip[data-skill="運動"]').click();
      await assertOnTop(page.locator("#skillPopup"));
      await page.locator("#skillPopup .close").click();
      await page.evaluate(() => showTab("basic"));
    }
    for (const width of [1280, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => applyStateObject({ class: "rogue", level: "3", race: "elf" }));
      await opener.click();
      await modal.getByRole("tab", { name: "職業", exact: true }).click();
      for (const [term, expected] of [["優勢", "取較高的結果"], ["劣勢", "取較低的結果"], ["巧手", "扒竊"]]) {
        const trigger = modal.locator(`#classFeatures button[data-skill="${term}"]`).first();
        await trigger.focus();
        assert.equal(await trigger.evaluate(el => getComputedStyle(el).textDecorationLine), "underline");
        await trigger.press("Enter");
        await assertOnTop(page.locator("#skillPopup"));
        assert.match(await page.locator("#skillPopup .content").textContent(), new RegExp(expected));
        const bounds = await page.locator("#skillPopup").boundingBox();
        assert(bounds.x >= 0 && bounds.x + bounds.width <= width, "rule popup fits viewport");
        await page.keyboard.press("Escape");
        assert.equal(await page.locator("#skillPopup").isVisible(), false);
        assert.equal(await modal.isVisible(), true);
        assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
      }
      await modal.getByRole("tab", { name: "種族", exact: true }).click();
      await modal.locator('#raceFeatures button[data-skill="優勢"]').first().click();
      await assertOnTop(page.locator("#skillPopup"));
      await page.locator("#skillPopup .close").click();
      await modal.locator('#raceFeatures button[data-skill="求生"]').click();
      assert.match(await page.locator("#skillPopup .content").textContent(), /追蹤足跡/);
      await modal.locator(".app-dialog__close").click();
      assert.equal(await page.locator("#skillPopup").isVisible(), false);
      await page.evaluate(() => applyStateObject({ class: "barbarian", level: "2", race: "dragonborn" }));
      await opener.click();
      for (const [tab, container] of [["職業", "#classFeatures"], ["種族", "#raceFeatures"]]) {
        await modal.getByRole("tab", { name: tab, exact: true }).click();
        const trigger = modal.locator(`${container} button[data-skill="抗性"]`).first();
        await trigger.focus();
        await trigger.press("Enter");
        await assertOnTop(page.locator("#skillPopup"));
        assert.match(await page.locator("#skillPopup .content").textContent(), /傷害減半/);
        await page.keyboard.press("Escape");
        assert.equal(await page.locator("#skillPopup").isVisible(), false);
        assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
      }
      await modal.locator(".app-dialog__close").click();
    }
    for (const width of [1280, 320]) {
      await page.setViewportSize({ width, height: 600 });
      await page.evaluate(() => applyStateObject({ class: "barbarian", level: "6", race: "halfling" }));
      await opener.click();
      for (const [tab, key] of [["職業", "incapacitated"], ["職業", "charmed"], ["職業", "frightened"], ["種族", "frightened"]]) {
        await modal.getByRole("tab", { name: tab, exact: true }).click();
        const trigger = modal.locator(`button.condition-tip[data-condition="${key}"]:visible`).first();
        await trigger.focus();
        await trigger.press("Enter");
        const popup = page.locator("#skillPopup");
        await assertOnTop(popup);
        assert.deepEqual(await popup.locator(".skill-popup-paragraph").allTextContents(),
          await page.evaluate(key => getDndCondition(key).effects, key));
        const bounds = await popup.boundingBox();
        assert(bounds.x >= 0 && bounds.x + bounds.width <= width && bounds.y >= 0 && bounds.y + bounds.height <= 600);
        await page.keyboard.press("Escape");
        assert.equal(await popup.isVisible(), false);
        assert.equal(await modal.isVisible(), true);
        assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
        await trigger.press("Space");
        await popup.getByRole("button", { name: "關閉說明" }).click();
        assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
      }
      await modal.getByRole("tab", { name: "職業", exact: true }).click();
      await modal.locator("#feat-choice-barbarian-level-4").selectOption("擒抱者");
      const featView = modal.locator('[data-feat-choice="barbarian-level-4"] .feat-choice-view');
      await featView.click();
      const feat = page.locator('.app-dialog[data-variant="feat-detail"]');
      const trigger = feat.locator("button.condition-tip").first();
      if (width === 320) await trigger.tap();
      else await trigger.click();
      await assertOnTop(page.locator("#skillPopup"));
      await page.keyboard.press("Escape");
      assert.equal(await feat.isVisible(), true);
      assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
      await trigger.click();
      await feat.locator(".app-dialog__close").click();
      assert.equal(await page.locator("#skillPopup").isVisible(), false);
      assert.equal(await featView.evaluate(el => el === document.activeElement), true);
      assert.equal(await page.locator("#skillPopup").evaluate(el => el.parentElement.id === "character-features-modal" && !el.closest("[inert]")), true);
      await modal.locator(".app-dialog__close").click();
      assert.equal(await page.locator("#skillPopup").evaluate(el => el.parentElement === document.body && !el.inert), true);
      const mainTrigger = page.locator('#feats-area button.condition-tip[data-condition="grappled"]').first();
      await mainTrigger.click();
      await assertOnTop(page.locator("#skillPopup"));
      await page.locator("#skillPopup .close").click();
      assert.equal(await mainTrigger.evaluate(el => el === document.activeElement), true);
    }
    await page.evaluate(() => {
      const draft = quickBuild.createDraft();
      draft.choices.background = "soldier";
      draft.choices.race = "human";
      draft.choices.raceOptions = { feat: "警覺" };
      draft.ui.currentStepId = "race";
      dndStorage.setItem(quickBuild.storageKey, JSON.stringify(draft));
      quickBuild.open();
    });
    await page.locator("[data-race-feat-view]").click();
    const quickDetail = page.locator("#quick-build-spell-detail");
    const quickTip = quickDetail.locator("button.condition-tip");
    await quickTip.tap();
    await assertOnTop(page.locator("#skillPopup"));
    await page.keyboard.press("Escape");
    assert.equal(await quickDetail.isVisible(), true);
    assert.equal(await quickTip.evaluate(el => el === document.activeElement), true);
    await quickDetail.locator(".quick-build-spell-detail-close").click();
    await page.locator("#quick-build-wizard .quick-build-close").click();
    console.log("Ability references: canonical condition coverage, spells, skills and druid beasts; close, Escape, keyboard, focus and reused popups passed on desktop/mobile.");
  } finally { await page.close(); }
}

async function verifyAdventureJournal(browser, url) {
  const legacyKey = "dnd.adventureJournal.v1";
  const fixture = { kind: "twd20-adventure-journal", version: 1, entries: [
    { id: "internal-only-id", characterName: "角色甲", classLevel: "遊俠 3 級", race: "精靈", adventureDate: "2026-10-01", adventureName: "森林調查", dmName: "DM Alpha", notes: "遇見銀龍與商人", gold: 123, downtime: 2, magicItems: "月光之劍" },
    { id: "second", characterName: "角色乙", classLevel: "法師 5 級", race: "人類", adventureDate: "", adventureName: "", dmName: "DM Beta", notes: "沒有龍", gold: null, downtime: null, magicItems: "", alFormat: true, totalGold: 567, totalDowntime: 8, totalMagicItems: 1, storyRewards: [{ title: "銀龍盟友", content: "獲得港口通行權" }] }
  ] };
  const open = async page => {
    if (await page.locator("#legal-close-btn").isVisible()) await page.locator("#legal-close-btn").click();
    if (!await page.locator("#adventure-journal-btn").isVisible()) await page.locator("#utility-menu-toggle").click();
    await page.locator("#adventure-journal-btn").click();
    await page.waitForFunction(() => document.querySelector("#adventure-journal")?.getAttribute("aria-busy") === "false");
  };
  const action = (page, name) => page.locator(`#adventure-journal [data-journal-action="${name}"]`);
  const readBook = page => page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open("twd20-adventure-journal", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("books", "readonly");
      const read = tx.objectStore("books").get("main");
      tx.oncomplete = () => { db.close(); resolve(read.result); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    };
  }));
  const seed = async page => {
    await page.goto(url);
    await page.evaluate(({ key, data }) => dndStorage.setItem(key, JSON.stringify(data)), { key: legacyKey, data: fixture });
  };
  const search = async (page, value, enter = false) => {
    await page.locator("#journal-search").fill(value);
    if (enter) await page.locator("#journal-search").press("Enter");
    else await page.locator(".journal-search-controls button[type=submit]").click();
  };
  const download = async page => {
    const pending = page.waitForEvent("download");
    await action(page, "export").click();
    const file = await pending;
    const text = fs.readFileSync(await file.path(), "utf8");
    await file.delete();
    return text;
  };
  const page = await newUiPage(browser, { viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  try {
    await seed(page);
    const character = await page.evaluate(() => ({ state: collectStateObject(), share: collectShareState() }));
    await open(page);
    assert.equal(await page.evaluate(key => dndStorage.getItem(key), legacyKey), null, "migration removes legacy only after commit");
    const migrated = await readBook(page);
    assert.equal(migrated.book.version, 1);
    assert.equal(migrated.book.entries[0].notes, fixture.entries[0].notes);
    assert.deepEqual(migrated.book.entries[0].storyRewards, [], "old JSON without AL fields remains compatible");
    await action(page, "toggle-search").click();
    assert.equal(await page.locator("#journal-search").evaluate(el => el === document.activeElement), true);
    await search(page, "銀龍", true);
    assert.equal(await page.locator(".journal-search-summary").textContent(), "找到 2 頁");
    assert.deepEqual(await page.locator(".journal-search-result").allTextContents(), ["1 | 2026-10-01 | 森林調查", "2 | 未填日期 | 未命名冒險"]);
    await page.locator(".journal-search-result").nth(1).click();
    assert.match(await page.locator(".journal-page-count").textContent(), /第 2 頁/);
    assert.equal(await page.locator("#journal-search-panel").isVisible(), false);
    await action(page, "toggle-search").click();
    assert.equal(await page.locator("#journal-search").inputValue(), "銀龍");
    assert.equal(await page.locator(".journal-search-result").count(), 2);
    for (const [query, count] of [[" ALPHA ", 1], ["港口", 1], ["123", 1], ["567", 1], ["遊俠", 1], ["月光", 1], ["2026-10", 1], ["internal-only-id", 0], ["adventureName", 0]]) {
      await search(page, query);
      assert.equal(await page.locator(".journal-search-result").count(), count, `full-text search: ${query}`);
    }
    await search(page, "銀龍");
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
      for (const theme of ["light", "dark"]) {
        await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
        assert.equal(await page.locator(".journal-shell").evaluate(el => el.scrollWidth <= el.clientWidth), true, `journal fits ${width} ${theme}`);
        assert.equal(await page.locator(".journal-body").evaluate(el => el.scrollWidth <= el.clientWidth), true);
        assert.equal(await page.locator(".journal-header").evaluate(el => {
          const header = el.getBoundingClientRect();
          const toolbar = el.querySelector(".journal-toolbar").getBoundingClientRect();
          const close = el.querySelector('[data-journal-action="close"]').getBoundingClientRect();
          const size = parseFloat(getComputedStyle(el).getPropertyValue("--journal-tool-size"));
          return toolbar.left >= header.left && toolbar.right <= close.left
            && close.right <= header.right && size >= 40 && close.width >= size && close.height >= size;
        }), true, "scrollable toolbar fits beside the fixed close button");
        for (const tool of ["add", "delete", "toggle-search", "import", "export"]) {
          await action(page, tool).focus();
          await action(page, tool).evaluate(button => button.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" }));
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          assert.equal(await action(page, tool).evaluate(button => {
            const rect = button.getBoundingClientRect();
            const toolbar = button.closest(".journal-toolbar").getBoundingClientRect();
            const size = parseFloat(getComputedStyle(button.closest(".journal-header")).getPropertyValue("--journal-tool-size"));
            return document.activeElement === button && size >= 40 && rect.width >= size && rect.height >= size
              && rect.left >= toolbar.left && rect.right <= toolbar.right;
          }), true, `${tool} retains focus and fits after scrolling the toolbar`);
        }
        assert.equal(await page.locator("#journal-search").evaluate(el => el.getBoundingClientRect().width >= 160), true, "search button must leave usable input width");
        if (process.env.DND_UI_SCREENSHOT_DIR && theme === "light") {
          fs.mkdirSync(process.env.DND_UI_SCREENSHOT_DIR, { recursive: true });
          await page.locator(".journal-shell").screenshot({ path: path.join(process.env.DND_UI_SCREENSHOT_DIR, `journal-${width}.png`) });
        }
      }
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.locator(".journal-search-result").first().click();
    await action(page, "edit").click();
    await page.locator("#journal-notes").fill("編輯中新增的關鍵字");
    await action(page, "toggle-search").click();
    await page.locator(".journal-search-clear").click();
    assert.equal(await page.locator("#journal-search").inputValue(), "");
    assert.equal(await page.locator("#journal-search").evaluate(el => el === document.activeElement), true);
    assert.equal(await page.locator(".journal-form").count(), 1, "clear preserves editing");
    await search(page, "   ", true);
    assert.equal(await page.locator(".journal-form").count(), 1, "empty search does not save");
    await page.locator("#journal-search").fill("關鍵字");
    await page.locator("#journal-search").dispatchEvent("compositionstart");
    await page.locator("#journal-search").press("Enter");
    assert.equal(await page.locator(".journal-form").count(), 1, "IME Enter does not save");
    await page.locator("#journal-search").dispatchEvent("compositionend");
    await page.waitForTimeout(70);
    await page.locator("#journal-search").press("Enter");
    await page.locator(".journal-form").waitFor({ state: "detached" });
    assert.equal((await readBook(page)).book.entries[0].notes, "編輯中新增的關鍵字");
    assert.equal(await page.locator(".journal-search-result").count(), 1);
    await action(page, "add").click();
    await page.locator("#journal-adventureName").fill("新頁關鍵字");
    await search(page, "關鍵字", true);
    await page.locator(".journal-form").waitFor({ state: "detached" });
    assert.equal((await readBook(page)).book.entries.length, 3, "search commits a new page");
    assert.equal(await page.locator(".journal-search-result").count(), 2);
    const saved = (await readBook(page)).book;
    assert.deepEqual(JSON.parse(await download(page)), saved, "export has only compatible v1 JSON, no storage metadata");
    assert.deepEqual(await page.evaluate(() => ({ state: collectStateObject(), share: collectShareState() })), character, "journal/search excluded from character JSON and sharing");
    assert.equal(await page.evaluate(() => Object.keys(JSON.parse(dndStorage.getItem("dndchar_autosave_v1") || "{}")).some(key => key.startsWith("journal-"))), false, "journal inputs excluded from autosave");
    await action(page, "close").click();
    await open(page);
    await action(page, "toggle-search").click();
    assert.equal(await page.locator("#journal-search").inputValue(), "", "close clears search state");
    await page.reload();
    await open(page);
    assert.equal((await readBook(page)).book.entries.length, 3, "IndexedDB survives reload");
    await page.locator("#journal-import-file").setInputFiles({ name: "old.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(fixture)) });
    await page.getByRole("button", { name: "取代整本日誌", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".journal-page-count").textContent.includes("共 2 頁"));
    await action(page, "toggle-search").click();
    await search(page, "銀龍");
    await action(page, "delete").click();
    await page.getByRole("button", { name: "刪除此頁", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".journal-page-count").textContent.includes("共 1 頁"));
    assert.equal(await page.locator(".journal-search-result").textContent(), "1 | 未填日期 | 未命名冒險", "deletion refreshes result page numbers");
    await action(page, "edit").click();
    await page.locator("#journal-notes").fill("失敗時必須保留");
    await page.evaluate(() => {
      window.journalOriginalPut = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (...args) {
        const request = window.journalOriginalPut.apply(this, args);
        if (this.name === "books") this.transaction.abort();
        return request;
      };
    });
    await search(page, "失敗", true);
    await page.waitForFunction(() => document.querySelector("#adventure-journal").getAttribute("aria-busy") === "false");
    assert.equal(await page.locator("#journal-notes").inputValue(), "失敗時必須保留");
    assert.equal((await readBook(page)).book.entries[0].notes, "沒有龍", "aborted write does not change persisted book");
    await page.evaluate(() => { IDBObjectStore.prototype.put = window.journalOriginalPut; });
    await search(page, "失敗", true);
    await page.locator(".journal-form").waitFor({ state: "detached" });
    assert.equal((await readBook(page)).book.entries[0].notes, "失敗時必須保留", "save can retry after failure");
    await action(page, "edit").click();
    await page.locator("#journal-adventureDate").fill("10000-01-01");
    await search(page, "失敗", true);
    assert.equal(await page.locator(".journal-form").count(), 1, "invalid date prevents search/save");
    assert.equal((await readBook(page)).book.entries[0].adventureDate, "");
    await page.locator("#journal-adventureDate").fill("2026-10-06");
    await search(page, "失敗", true);
    await page.locator(".journal-form").waitFor({ state: "detached" });
    console.log("Journal: migration, JSON roundtrip, full-text/IME search, save-before-search, navigation, deletion, isolation, responsive layout and write failure/retry passed.");
  } finally { await page.close(); }

  for (const failure of ["unavailable", "migration", "invalid"]) {
    const page = await newUiPage(browser);
    try {
      await seed(page);
      if (failure === "unavailable") await page.evaluate(() => {
        window.journalOriginalOpen = IDBFactory.prototype.open;
        IDBFactory.prototype.open = () => { throw new DOMException("denied", "SecurityError"); };
      });
      if (failure === "migration") await page.evaluate(() => {
        window.journalOriginalPut = IDBObjectStore.prototype.put;
        IDBObjectStore.prototype.put = function (...args) {
          const request = window.journalOriginalPut.apply(this, args);
          if (this.name === "books") this.transaction.abort();
          return request;
        };
      });
      if (failure === "invalid") await page.evaluate(key => dndStorage.setItem(key, "{broken JSON"), legacyKey);
      await open(page);
      assert.equal(await page.evaluate(key => dndStorage.getItem(key), legacyKey), failure === "invalid" ? "{broken JSON" : JSON.stringify(fixture), `${failure}: original preserved`);
      assert.equal(await action(page, "add").isDisabled(), true);
      const backup = await download(page);
      if (failure === "invalid") assert.equal(backup, "{broken JSON", "invalid data can be exported verbatim");
      else assert.equal(JSON.parse(backup).entries[0].notes, fixture.entries[0].notes);
      if (failure === "invalid") {
        await page.locator("#journal-import-file").setInputFiles({ name: "recovery.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(fixture)) });
        await page.getByRole("button", { name: "取代整本日誌", exact: true }).click();
      } else {
        await page.evaluate(() => {
          if (window.journalOriginalOpen) IDBFactory.prototype.open = window.journalOriginalOpen;
          if (window.journalOriginalPut) IDBObjectStore.prototype.put = window.journalOriginalPut;
        });
        await action(page, "retry-load").click();
      }
      await page.waitForFunction(() => !document.querySelector('[data-journal-action="add"]').disabled);
      assert.equal((await readBook(page)).book.entries.length, 2);
      assert.equal(await page.evaluate(key => dndStorage.getItem(key), legacyKey), null);
    } finally { await page.close(); }
  }
  console.log("Journal: unavailable IndexedDB, aborted migration and malformed legacy backup/recovery passed.");

  const concurrentContext = await browser.newContext();
  const concurrent = await concurrentContext.newPage();
  concurrent.setDefaultTimeout(10000);
  concurrent.on("pageerror", error => browserErrors.push(String(error)));
  try {
    await seed(concurrent);
    const other = await concurrent.context().newPage();
    other.setDefaultTimeout(10000);
    other.on("pageerror", error => browserErrors.push(String(error)));
    try {
      await other.goto(url);
      await Promise.all([open(concurrent), open(other)]);
      assert.equal((await readBook(concurrent)).revision, 1, "concurrent migration writes once");
      await action(concurrent, "edit").click();
      await concurrent.locator("#journal-notes").fill("先完成儲存");
      await action(concurrent, "save").click();
      await concurrent.locator(".journal-form").waitFor({ state: "detached" });
      await action(other, "edit").click();
      await other.locator("#journal-notes").fill("另一分頁尚未儲存");
      await action(other, "save").click();
      await other.waitForFunction(() => document.querySelector("#adventure-journal").getAttribute("aria-busy") === "false");
      assert.equal(await other.locator("#journal-notes").inputValue(), "另一分頁尚未儲存");
      assert.equal((await readBook(other)).book.entries[0].notes, "先完成儲存", "stale tab cannot overwrite a newer book");
    } finally { await other.close(); }
  } finally { await concurrentContext.close(); }

  const large = await newUiPage(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await large.goto(url);
    const bulk = { ...fixture, entries: Array.from({ length: 1000 }, (_, index) => ({ ...fixture.entries[0], id: `bulk-${index}`, adventureName: `第${index + 1}場冒險：${"長名稱".repeat(12)}`, notes: `${"旅途紀錄".repeat(250)}共同關鍵字` })) };
    await large.evaluate(({ key, data }) => dndStorage.setItem(key, JSON.stringify(data)), { key: legacyKey, data: bulk });
    await open(large);
    await action(large, "toggle-search").tap();
    assert.equal(await large.locator("#journal-search").getAttribute("enterkeyhint"), "search");
    await large.locator("#journal-search").fill("共同關鍵字");
    const duration = await large.evaluate(() => {
      const start = performance.now();
      document.querySelector(".journal-search-controls").requestSubmit();
      return performance.now() - start;
    });
    assert.equal(await large.locator(".journal-search-summary").textContent(), "找到 1000 頁");
    assert.equal(await large.locator(".journal-search-result").count(), 50, "large results render in batches");
    assert.equal(await large.locator(".journal-body").evaluate(el => el.scrollWidth <= el.clientWidth), true, "long result names wrap on mobile");
    await action(large, "search-more").tap();
    assert.equal(await large.locator(".journal-search-result").count(), 100);
    await large.locator(".journal-search-result").nth(70).tap();
    assert.match(await large.locator(".journal-page-count").textContent(), /第 71 頁/);
    console.log(`Journal: concurrent migration/conflict protection and mobile 1,000-page search passed (${duration.toFixed(1)} ms for initial scan/render in this desktop browser).`);
  } finally { await large.close(); }
}

// Other classes' choices live only in dnd.classOptionMemories.v1; the sheet, autosave, JSON and share keep the current class.
async function verifyClassOptionMemory(browser, url) {
  const page = await newUiPage(browser, { viewport: { width: 1280, height: 900 } });
  const MEMORY = "dnd.classOptionMemories.v1";
  const blank = { __spellManagement: { version: 2, manual: false, entries: [] }, background: "soldier", race: "human", dex: "14" };
  const apply = state => page.evaluate(state => applyStateObject(state), { ...blank, ...state });
  const memory = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) || "null"), MEMORY);
  const saved = () => page.evaluate(() => collectStateObject());
  const set = (id, value) => page.evaluate(({ id, value }) => {
    const control = document.getElementById(id);
    if (control.type === "checkbox") control.checked = value;
    else control.value = value;
    control.dispatchEvent(new Event("change", { bubbles: true }));
  }, { id, value });
  const value = id => page.evaluate(id => {
    const control = document.getElementById(id);
    return control ? (control.type === "checkbox" ? control.checked : control.value) : null;
  }, id);
  // Native keyboard selection is a trusted player change, unlike selectOption.
  const chooseAsPlayer = async (id, next) => {
    await page.evaluate(() => showTab("basic"));
    const key = await page.evaluate(({ id, next }) => {
      const select = document.getElementById(id);
      const index = Array.from(select.options).findIndex(option => option.value === next);
      if (index < 0) throw new Error(`Missing option ${id}: ${next}`);
      select.selectedIndex = index === 0 ? 1 : index - 1;
      return index === 0 ? "ArrowUp" : "ArrowDown";
    }, { id, next });
    await page.locator(`#${id}`).focus();
    await page.keyboard.press(key);
    assert.equal(await page.locator(`#${id}`).inputValue(), next, "native keyboard commits the player choice");
  };
  try {
    await page.addInitScript(() => { try { localStorage.setItem("dnd.classFeaturePromptDisabled.v1", "true"); } catch {} });
    await page.goto(url);
    await page.locator("#legal-close-btn").click();
    await page.evaluate(() => window.onboardingTour?.finish?.());

    // Feature checkboxes, mission cantrips, level feats and their Magic Initiate sub-options.
    // Distinct cantrips: a source granting the same spell would make the level 4 choice unavailable.
    const levelCantrip = "sacred-flame";
    await apply({ class: "cleric", level: "4", "cleric-trickster": true, "cleric-trickster-cantrip": "thaumaturgy", "feat-choice-cleric-level-4": "魔法學徒",
      __spellManagement: { version: 2, manual: false, entries: [{ spellId: levelCantrip, spellClass: "cleric", classFeatureCantrip: "class-level-4" }] } });
    const magic = await page.evaluate(() => {
      const prefix = "derived-feat-cleric-level-4-magic-initiate-";
      const pick = (field, skip = []) => {
        const select = document.getElementById(`${prefix}${field}`);
        const option = Array.from(select.options).find(option => option.value && !option.disabled && !skip.includes(option.value));
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return option.value;
      };
      const result = { class: pick("class") };
      result.cantrip1 = pick("cantrip-1", ["sacred-flame", "thaumaturgy"]);
      result.cantrip2 = pick("cantrip-2", ["sacred-flame", "thaumaturgy", result.cantrip1]);
      result.level1 = pick("level-1");
      return result;
    });
    await chooseAsPlayer("class", "wizard");
    const wizardState = await saved();
    assert.deepEqual(Object.keys(wizardState).filter(id => /^(?:cleric-|feat-choice-cleric|derived-feat-cleric)/u.test(id)), [], "other classes stay out of autosave/JSON");
    assert.equal(JSON.stringify(await page.evaluate(() => collectShareState())).includes("cleric-trickster"), false, "share data keeps only the current class");
    const clericMemory = (await memory()).classes.cleric;
    assert.equal(clericMemory.level, 4);
    assert.deepEqual([clericMemory.values["cleric-trickster"], clericMemory.values["cleric-trickster-cantrip"], clericMemory.values["feat-choice-cleric-level-4"]],
      [true, "thaumaturgy", "魔法學徒"]);
    await chooseAsPlayer("class", "cleric");
    assert.deepEqual(await Promise.all(["cleric-trickster", "cleric-trickster-cantrip", "feat-choice-cleric-level-4", "derived-feat-cleric-level-4"].map(value)),
      [true, "thaumaturgy", "魔法學徒", "魔法學徒"], "returning restores feature choices and derived feat rows");
    assert.deepEqual(await Promise.all(["class", "cantrip-1", "cantrip-2", "level-1"].map(field => value(`derived-feat-cleric-level-4-magic-initiate-${field}`))),
      [magic.class, magic.cantrip1, magic.cantrip2, magic.level1], "Magic Initiate sub-options restore after their feat");
    assert.deepEqual(await page.evaluate(() => Array.from(getMissingClassFeatureChoiceSections())
      .filter(section => section.querySelector("#cleric-trickster, #feat-choice-cleric-level-4")).map(section => section.querySelector("h3")?.textContent)),
    [], "restored choices are not listed as missing");

    // Lower levels keep higher-level choices in memory and raising the level restores them.
    await chooseAsPlayer("level", "3");
    assert.equal(await value("feat-choice-cleric-level-4"), null);
    await chooseAsPlayer("level", "4");
    assert.equal(await value("feat-choice-cleric-level-4"), "魔法學徒", "raising the level restores the retained feat");

    // Leaving a class clears its residue outside the class detail; returning restores it.
    await apply({ class: "druid", level: "3", "druid-land": "arid" });
    await chooseAsPlayer("class", "wizard");
    assert.equal((await saved())["druid-land"], "");
    await chooseAsPlayer("class", "druid");
    assert.equal(await value("druid-land"), "arid");

    const tomeIndex = await page.evaluate(() => eldritchInvocations.findIndex(option => option.name === "書之魔契"));
    const tome = { cantrips: ["light", "mage-hand", "guidance"], rituals: ["detect-magic", "identify"] };
    await apply({ class: "warlock", level: "3", [`eldritch-invocation-${tomeIndex}-1`]: true, __pactTomeInvocationSelected: true, __pactTomeSpellSelection: tome });
    await chooseAsPlayer("class", "wizard");
    const afterWarlock = await saved();
    assert.equal(Object.entries(afterWarlock).some(([id, checked]) => id.startsWith("eldritch-invocation-") && checked === true), false);
    assert.deepEqual([afterWarlock.__pactTomeSpellSelection, afterWarlock.__pactTomeInvocationSelected], [{ cantrips: [], rituals: [] }, false]);
    await chooseAsPlayer("class", "warlock");
    assert.equal(await value(`eldritch-invocation-${tomeIndex}-1`), true);
    assert.deepEqual(await page.evaluate(() => getPactTomeSpellSelection()), tome);

    await apply({ class: "sorcerer", level: "3" });
    const metamagic = await page.evaluate(() => Array.from(document.querySelectorAll("#metamagicOptions input[data-metamagic-name]")).slice(1, 3).map(input => {
      input.checked = true; input.dispatchEvent(new Event("change", { bubbles: true })); return input.dataset.metamagicName;
    }));
    await chooseAsPlayer("class", "wizard");
    await chooseAsPlayer("class", "sorcerer");
    assert.deepEqual(await page.evaluate(() => getCheckedMetamagicNames()), metamagic, "metamagic restores by name");

    await apply({ class: "paladin", level: "2", "paladin-blessed-warrior": true,
      __classFeatureCantrips: { "class-paladin-blessed-warrior-cantrip-1": "guidance", "class-paladin-blessed-warrior-cantrip-2": "sacred-flame" } });
    await chooseAsPlayer("class", "wizard");
    assert.deepEqual(Object.values((await saved()).__classFeatureCantrips).filter(Boolean), []);
    await chooseAsPlayer("class", "paladin");
    assert.deepEqual(await page.evaluate(() => SpellManagement.collectClassFeatureCantrips()),
      { "class-paladin-blessed-warrior-cantrip-1": "guidance", "class-paladin-blessed-warrior-cantrip-2": "sacred-flame" });

    await apply({ class: "bard", level: "6", __bardMagicalDiscoverySelection: [{ classValue: "wizard", ring: "cantrips", spellId: "mage-hand" }, { classValue: "cleric", ring: "cantrips", spellId: "guidance" }] });
    const instruments = await page.evaluate(() => [1, 2, 3].map(slot => {
      const select = document.getElementById(`bard-instrument-${slot}`);
      select.value = Array.from(select.options).filter(option => option.value && !option.disabled)[slot - 1].value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return select.value;
    }));
    await set("prof-隱匿", false);
    await set("exp-隱匿", true);
    await chooseAsPlayer("class", "fighter");
    const afterBard = await saved();
    assert.equal(afterBard.__bardMagicalDiscoverySelection.some(item => item.spellId), false, "magical discovery leaves non-bard data");
    assert.equal(afterBard["exp-隱匿"], false);
    // A tool chosen elsewhere meanwhile is never overwritten or duplicated.
    const manualTool = await page.evaluate(tool => createToolProficiencyRow(tool).querySelector("select").id, instruments[0]);
    await chooseAsPlayer("class", "bard");
    assert.deepEqual(await Promise.all(["bard-instrument-1", "bard-instrument-2", "bard-instrument-3", manualTool].map(value)),
      ["", instruments[1], instruments[2], instruments[0]], "class tools restore without duplicating other rows");
    assert.deepEqual([await value("exp-隱匿"), await value("prof-隱匿")], [true, false], "expertise is added back");
    assert.deepEqual(await page.evaluate(() => getBardMagicalDiscoverySelection().map(item => item.spellId)), ["mage-hand", "guidance"]);

    // Extra languages are scoped per class instead of following a shared control ID.
    await apply({ class: "rogue", level: "2" });
    await set("language-extra-2", "elvish");
    await chooseAsPlayer("class", "ranger");
    assert.equal(await value("language-extra-2"), "", "ranger does not inherit the rogue language");
    await chooseAsPlayer("class", "rogue");
    assert.equal(await value("language-extra-2"), "elvish");

    // Manual feat management neither remembers nor restores feat choices.
    await page.evaluate(() => ClassOptionMemory.clearMemories());
    await apply({ class: "fighter", level: "4", "manual-feat-management": true, __managedFeatRows: [], "feat-choice-fighter-level-4": "警覺" });
    await chooseAsPlayer("class", "wizard");
    assert.equal(Object.keys((await memory()).classes.fighter.values).some(id => /^(?:feat-choice-|derived-feat-)/u.test(id)), false);

    // Loading never applies memory; legacy residue from another class moves into memory instead.
    await page.evaluate(key => localStorage.removeItem(key), MEMORY);
    await page.evaluate(() => { ClassOptionMemory.clearMemories(); });
    await apply({ class: "wizard", level: "3", "druid-land": "polar" });
    assert.equal(await value("druid-land"), "");
    assert.equal((await memory()).classes.druid.values["druid-land"], "polar", "legacy residue is kept for its class");
    await apply({ class: "druid", level: "3" });
    assert.equal(await value("druid-land"), "", "loading data takes precedence over memory");

    // Share mode neither reads nor writes memory.
    const beforeShare = await memory();
    await page.evaluate(() => { SHARE_MODE = true; window.SHARE_MODE = true; });
    await chooseAsPlayer("class", "wizard");
    await chooseAsPlayer("class", "druid");
    assert.equal(await value("druid-land"), "");
    await page.evaluate(() => { SHARE_MODE = false; window.SHARE_MODE = false; });
    assert.deepEqual(await memory(), beforeShare, "share mode leaves memory untouched");

    // Corrupt or hostile memory is ignored or sanitized without breaking class changes.
    await page.evaluate(key => localStorage.setItem(key, JSON.stringify({ version: 1, classes: {
      evil: { values: { x: true } }, druid: { level: 3, values: { "druid-land": "arid", "<img>": true, long: "x".repeat(201) }, lists: { expertise: [1, "隱匿"] } } } })), MEMORY);
    await page.goto(url);
    await page.waitForFunction(() => window.ClassOptionMemory);
    assert.deepEqual(await page.evaluate(() => ClassOptionMemory.get("druid")), { level: 3, values: { "druid-land": "arid" }, lists: { expertise: ["隱匿"] } });
    assert.equal(await page.evaluate(() => ClassOptionMemory.get("evil")), null);
    await page.evaluate(key => localStorage.setItem(key, "{broken"), MEMORY);
    await page.goto(url);
    await page.waitForFunction(() => window.ClassOptionMemory);
    assert.equal(await page.evaluate(() => ClassOptionMemory.get("druid")), null);
    await chooseAsPlayer("class", "wizard");

    // Clearing records removes the memory with the other character storage.
    assert.equal(await page.evaluate(() => APP_STORAGE_KEYS.includes("dnd.classOptionMemories.v1")), true);
    await page.evaluate(() => clearAppStateAndReload());
    await page.waitForFunction(() => window.ClassOptionMemory);
    assert.equal(await memory(), null);
    console.log("Class option memory: class/level round trips, feats and Magic Initiate, residue cleanup, invocations/tome, metamagic, class cantrips, discovery, tools, expertise, languages, manual feats, legacy residue, share mode, sanitizing and clear passed.");
  } finally { await page.close(); }
}

async function verifyCharacterDataSafety(browser, url) {
  const page = await newUiPage(browser);
  const sourceTag = '<img src="data:image/png,invalid" onerror="window.__unsafeCharacterScript=true">';
  const state = { class: "wizard", level: "1", race: "human", background: "soldier", characterName: "安全測試",
    __spellManagement: { version: 2, manual: true, entries: [{ spellId: "light", level: 0, sourceTag }] } };
  const assertSafeTag = async target => {
    await target.locator(".spell-picked-source-tag").waitFor({ state: "attached" });
    assert.equal(await target.locator(".spell-picked-source-tag").textContent(), `[${sourceTag}]`);
    assert.equal(await target.locator(".spell-picked-source-tag img").count(), 0);
    assert.equal(await target.evaluate(() => Boolean(window.__unsafeCharacterScript)), false);
  };
  try {
    await page.goto(url);
    await page.waitForFunction(() => window.SpellManagement && window.TabletopMode);
    await page.evaluate(state => { applyStateObject(state); saveAllFields(); }, state);
    await assertSafeTag(page);
    await page.goto(url);
    await assertSafeTag(page);

    const hashes = await page.evaluate(async state => [
      await encodeStateToHash(state),
      "#s=" + btoa(unescape(encodeURIComponent(JSON.stringify(state))))
    ], state);
    for (const hash of hashes) {
      const shared = await newUiPage(browser);
      try {
        const sharedUrl = new URL(url); sharedUrl.searchParams.set("analytics", "owner"); sharedUrl.hash = hash;
        await shared.goto(sharedUrl.href);
        await assertSafeTag(shared);
        assert.equal(await shared.evaluate(() => window.SHARE_MODE), true);
        // A decoded share locks the identity selects; values still flow through state collection.
        const identity = await shared.evaluate(() => ["class", "level", "race", "background"].map(id => {
          const select = document.getElementById(id);
          return [select.value, select.disabled];
        }));
        assert.deepEqual(identity, [["wizard", true], ["1", true], ["human", true], ["soldier", true]], "share locks identity selects");
        assert.deepEqual(await shared.evaluate(() => {
          openCharacterFeatures("class");
          const picks = ["class", "background", "race"].map(field => {
            const buttons = Array.from(document.querySelectorAll(`#character-features-picker [data-feature-picker="${field}"] [data-picker-value]`));
            return [buttons.length > 0 && buttons.every(button => button.disabled), buttons.find(button => button.getAttribute("aria-pressed") === "true")?.dataset.pickerValue];
          });
          document.querySelector("#character-features-modal .app-dialog__close").click();
          return picks;
        }), [[true, "wizard"], [true, "soldier"], [true, "human"]], "share locks the ability dialog picker too");
        const collected = await shared.evaluate(() => collectStateObject());
        assert.deepEqual([collected.class, collected.level, collected.race, collected.background], ["wizard", "1", "human", "soldier"], "disabled selects stay in state collection");
        assert.match(await shared.locator("#share-mode-tip").innerText(), /分享模式：職業、等級、種族、背景不可更改/);
        assert.equal(await shared.locator("#share-mode-tip").isVisible(), true);
        assert.equal(await shared.evaluate(() => saveAllFields()), false);
        assert.equal(await shared.evaluate(() => dndStorage.getItem("dndchar_autosave_v1")), null, "share restoration never autosaves");
      } finally { await shared.close(); }
    }

    const safety = await page.evaluate(async () => {
      const before = JSON.stringify(collectStateObject());
      const rejects = data => { try { applyStateObject(data); return false; } catch (_) { return JSON.stringify(collectStateObject()) === before; } };
      const bad = [
        { class: "fighter", "tool-proficiency-list-count": 1000000 },
        { class: "fighter", "feats-area-count": 1000000 },
        { "feats-area-count": "101" }, { "tool-proficiency-list-count": "100junk" },
        { __managedFeatRows: Array.from({ length: 101 }, () => ({})) },
        { __spellManagement: { version: 2, manual: true, entries: Array.from({ length: 513 }, () => ({ spellId: "light" })) } },
        { __spellManagement: { entries: [{ spellId: "light", freeUses: 1000000, sourceKey: "probe" }] } },
        { __spellManagement: { entries: Array.from({ length: 17 }, () => ({ spellId: "light", freeUses: 64 })) } },
        Object.fromEntries(Array.from({ length: 513 }, (_, i) => [`cantrips-area-spell-${i}`, "light"])),
        { "free-spell-use-probe-100000000": true }, { "free-spell-use-probe-1e8": true },
        Object.fromEntries(Array.from({ length: 17 }, (_, i) => [`free-spell-use-probe${i}-64`, true])),
        { __spellManagement: { entries: [{ spellId: "light", sourceKey: "__proto__" }] } },
        { __spellManagement: { freeUses: { probe: Array(65).fill(false) } } },
        { __spellManagement: { entries: [{ spellId: "light", sourceTag: {} }] } },
        { note: "x".repeat(256 * 1024 + 1) }, [],
        JSON.parse('{"__proto__":{"polluted":true}}')
      ];
      let nested = {}; for (let i = 0; i < 22; i++) nested = { child: nested }; bad.push(nested);
      const rejected = bad.map(rejects);
      validateCharacterState({ "feats-area-count": 100, "tool-proficiency-list-count": "100",
        __spellManagement: { entries: [{ spellId: "light", freeUses: 64 }, { spellId: "guidance", freeUses: "proficiency" }] } });
      let directCountRejected = 0;
      for (const setter of [setFeatRowCount, setToolProficiencyRowCount]) {
        try { setter(1000000); } catch (_) { directCountRejected++; }
      }
      let utf8Rejected = false;
      try { parseCharacterStateJson(JSON.stringify(Object.fromEntries(Array.from({ length: 8 }, (_, i) => [i, "字".repeat(100000)])))); }
      catch (_) { utf8Rejected = true; }
      const bomb = await compressJson(JSON.stringify({ note: "x".repeat(2 * 1024 * 1024) }));
      let decompressionRejected = false;
      try { await decompressJson(bomb); } catch (_) { decompressionRejected = true; }
      const originalUrl = new URL(location.href);
      const bombUrl = new URL(originalUrl); bombUrl.searchParams.set("analytics", "owner"); bombUrl.hash = "#s2=" + bytesToBase64Url(bomb);
      history.replaceState(null, "", bombUrl);
      const bombResult = await decodeStateFromHash();
      history.replaceState(null, "", originalUrl);
      return { rejected, directCountRejected, utf8Rejected, decompressionRejected, compressedBytes: bomb.length,
        bombShareRejected: bombResult.data === null && Boolean(bombResult.error), bombHash: bombUrl.hash };
    });
    assert(safety.rejected.every(Boolean), "invalid data is rejected before changing any character fields");
    assert.equal(safety.directCountRejected, 2);
    assert.equal(safety.utf8Rejected, true);
    assert.equal(safety.decompressionRejected, true);
    assert.equal(safety.bombShareRejected, true);
    assert(safety.compressedBytes < 10000, "small compressed input exercises the decompressed size limit");

    const saved = await page.evaluate(() => { saveAllFields(); return dndStorage.getItem("dndchar_autosave_v1"); });
    for (const buffer of [Buffer.from(JSON.stringify({ class: "fighter", "tool-proficiency-list-count": 1000000 })), Buffer.alloc(2 * 1024 * 1024 + 1, 32)]) {
      await page.locator("#import-json-file").setInputFiles({ name: "invalid.json", mimeType: "application/json", buffer });
      const dialog = page.getByRole("dialog", { name: "JSON 匯入失敗", exact: true });
      await dialog.getByRole("button", { name: "關閉", exact: true }).click();
      await page.waitForFunction(() => document.getElementById("import-json-file").value === "");
      assert.equal(await page.locator("#class").inputValue(), "wizard");
      assert.equal(await page.evaluate(() => autosaveDirty), false, "failed file selection must not schedule a replacement autosave");
      assert.equal(await page.evaluate(() => dndStorage.getItem("dndchar_autosave_v1")), saved);
    }
    await page.evaluate(() => { const entry = new URL(location.href); entry.searchParams.set("analytics", "owner"); history.replaceState(null, "", entry); });
    await Promise.all([page.waitForEvent("load"), page.locator("#import-json-file").setInputFiles({ name: "safe-text.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(state)) })]);
    await assertSafeTag(page);
    await page.goto(url);
    await assertSafeTag(page);

    const invalidRaw = JSON.stringify({ class: "fighter", "feats-area-count": 1000000 });
    assert.equal(await page.locator("#class").inputValue(), "wizard", "actual file import restores the complete character after reload");
    assert.equal(await page.evaluate(() => saveAllFields()), true);
    await page.evaluate(raw => dndStorage.setItem("dndchar_autosave_v1", raw), invalidRaw);
    await page.goto(url);
    await page.waitForFunction(() => document.querySelector(".app-toast")?.textContent?.includes("原始存檔仍保留"));
    assert.equal(await page.evaluate(() => saveAllFields()), false);
    assert.equal(await page.evaluate(() => dndStorage.getItem("dndchar_autosave_v1")), invalidRaw);
    await page.evaluate(() => { const entry = new URL(location.href); entry.searchParams.set("analytics", "owner"); history.replaceState(null, "", entry); });
    await Promise.all([page.waitForEvent("load"), page.locator("#import-json-file").setInputFiles({ name: "recovery.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(state)) })]);
    await page.waitForFunction(() => document.getElementById("class").value === "wizard" && !autosaveRestoreBlocked);
    await assertSafeTag(page);
    assert.equal(await page.evaluate(() => saveAllFields()), true);

    const shareUrl = new URL(url); shareUrl.searchParams.set("analytics", "owner"); shareUrl.hash = safety.bombHash;
    const beforeBadShare = await page.evaluate(() => dndStorage.getItem("dndchar_autosave_v1"));
    await page.goto(shareUrl.href);
    await page.getByRole("dialog", { name: "分享連結讀取失敗", exact: true }).getByRole("button", { name: "知道了", exact: true }).click();
    assert.equal(await page.locator("#class, #level, #race, #background").evaluateAll(selects => selects.some(select => select.disabled)), false, "failed share leaves the blank card unlocked");
    assert.equal(await page.locator("#share-mode-tip").isVisible(), false);
    assert.equal(await page.evaluate(() => saveAllFields()), false);
    assert.equal(await page.evaluate(() => dndStorage.getItem("dndchar_autosave_v1")), beforeBadShare);
    console.log("Character input safety: XSS text rendering, JSON/share/autosave, preflight limits, gzip bomb cancellation and rejected-data preservation passed.");
  } finally { await page.close(); }
}

async function verifyJsonImportTransaction(browser, url) {
  const page = await newUiPage(browser);
  await page.addInitScript(() => {
    const get = Storage.prototype.getItem, set = Storage.prototype.setItem, remove = Storage.prototype.removeItem;
    Storage.prototype.getItem = function(key) {
      if (this === sessionStorage && key === "dnd.pendingJsonImport.v1" && get.call(sessionStorage, "test-import-failure") === "read") throw new Error("session read blocked");
      return get.call(this, key);
    };
    Storage.prototype.setItem = function(key, value) {
      const fail = get.call(sessionStorage, "test-import-failure");
      if ((this === sessionStorage && key === "dnd.pendingJsonImport.v1" && fail === "stage")
        || (this === localStorage && key === "dndchar_autosave_v1" && fail === "save")) throw new Error("import storage blocked");
      return set.call(this, key, value);
    };
    Storage.prototype.removeItem = function(key) {
      if (this === sessionStorage && key === "dnd.pendingJsonImport.v1" && get.call(sessionStorage, "test-import-failure") === "cleanup") throw new Error("session cleanup blocked");
      return remove.call(this, key);
    };
    window.addEventListener("DOMContentLoaded", () => {
      if (get.call(sessionStorage, "test-import-failure") === "apply") {
        const apply = window.applyStateObject;
        window.applyStateObject = data => { if (data["gear-extra"] === "Imported") throw new Error("import apply blocked"); return apply(data); };
      }
    });
  });
  const pendingKey = "dnd.pendingJsonImport.v1", autoKey = "dndchar_autosave_v1", memoryKey = "dnd.spellManagementMemories.v1";
  const incoming = { class: "wizard", level: "5", race: "human", background: "custom", "gear-extra": "Imported",
    __customBackground: { 名稱: "匯入背景", 擴充: true, 屬性: "力量,敏捷,體質", 專長: "強韌體魄",
      技能熟練: "運動,隱匿", 工具熟練: "里拉琴", 裝備: "A、B 二擇一", 裝備A: "長棍、旅行者服裝、49金幣", 裝備B: "50 金幣", 描述: "匯入的背景描述" },
    __spellManagement: { version: 2, manual: false, entries: [{ spellId: "detect-magic", spellClass: "wizard" }] },
    __wizardSpellbook: { version: 2, wizardSpellIds: ["detect-magic"], manualSpellIds: [] } };
  const seed = async () => {
    await page.goto(url); await page.waitForFunction(() => window.SpellManagement?.getEntries);
    return page.evaluate(({ incoming, autoKey, memoryKey }) => {
      applyStateObject({ ...incoming, "gear-extra": "Original", __customBackground: { ...incoming.__customBackground, 名稱: "舊背景", 裝備A: "舊裝備", 描述: "舊描述" },
        __spellManagement: { version: 2, manual: false, entries: [{ spellId: "mage-armor", spellClass: "wizard" }] } });
      saveAllFields();
      const memories = JSON.parse(dndStorage.getItem(memoryKey));
      memories.classes.cleric = { initialized: true, entries: [{ spellId: "cure-wounds", spellClass: "cleric" }] };
      dndStorage.setItem(memoryKey, JSON.stringify(memories));
      for (const key of ["dnd.tabletopAvatar.v1", "dnd.quickBuildDraft.v1", "dnd.tabletopActionPreferences.v1"]) dndStorage.setItem(key, "old-import-fixture");
      dndStorage.setItem("dnd.tabletopActionPreferences.v1", JSON.stringify({ version: 1, notes: "OLD ACTION NOTES", hiddenKeys: [], customActions: [] }));
      return { autosave: dndStorage.getItem(autoKey), memories: dndStorage.getItem(memoryKey) };
    }, { incoming, autoKey, memoryKey });
  };
  const upload = async () => {
    await page.evaluate(() => { const entry = new URL(location.href); entry.searchParams.set("analytics", "owner"); history.replaceState(null, "", entry); });
    await page.locator("#import-json-file").setInputFiles({ name: "import.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(incoming)) });
  };
  const assertImported = async () => {
    await page.waitForFunction(() => document.getElementById("gear-extra").value === "Imported" && !autosaveRestoreBlocked && !autosaveClearing);
    assert.deepEqual(await page.evaluate(() => SpellManagement.getPlayerEntries().map(e => e.spellId)), ["detect-magic"]);
    assert.equal(await page.evaluate(key => JSON.parse(dndStorage.getItem(key)).classes.cleric, memoryKey), undefined);
    assert.deepEqual(await page.evaluate(() => ["dnd.tabletopAvatar.v1", "dnd.quickBuildDraft.v1", "dnd.tabletopActionPreferences.v1"].map(key => dndStorage.getItem(key))), [null, null, null]);
    assert.equal(await page.evaluate(() => TabletopMode.getTabletopActionPreferences().notes), "", "old in-memory action preferences are cleared too");
    assert.deepEqual(await page.evaluate(() => CustomBackground.getState()), incoming.__customBackground, "file import replaces the old custom definition after both reloads");
    assert.equal(await page.locator('#background option[value="custom"]').textContent(), "匯入背景");
    assert.equal(await page.locator("#custom-background-edit").getAttribute("hidden"), null);
    assert.equal(await page.locator(".custom-background-equipment").textContent(), `裝備：A、B 二擇一(A) ${incoming.__customBackground.裝備A}(B) 50 金幣`);
  };
  try {
    const before = await seed();
    await page.evaluate(() => {
      document.getElementById("legal-modal").style.display = "none";
      window.onboardingTour?.finish?.();
    });
    let chooserCount = 0;
    const recordChooser = () => { chooserCount += 1; };
    page.on("filechooser", recordChooser);
    const warning = page.getByRole("alertdialog", { name: "匯入 JSON 將取代目前角色", exact: true });
    const openWarning = async () => {
      if (await page.locator("#utility-menu-toggle").getAttribute("aria-expanded") !== "true") await page.locator("#utility-menu-toggle").click();
      await page.locator("#import-json-btn").click();
      assert.equal(await warning.isVisible(), true);
      assert.match(await warning.innerText(), /請先匯出 JSON 備份目前角色/);
      assert.equal(await warning.getByRole("button", { name: "取消", exact: true }).evaluate(el => el === document.activeElement), true);
    };
    for (const cancel of ["button", "escape"]) {
      await openWarning();
      if (cancel === "button") await warning.getByRole("button", { name: "取消", exact: true }).click();
      else await page.keyboard.press("Escape");
      assert.equal(await warning.count(), 0);
      assert.equal(chooserCount, 0, "cancel does not open the file chooser");
      assert.equal(await page.evaluate(key => dndStorage.getItem(key), autoKey), before.autosave);
      assert.equal(await page.locator("#utility-menu-toggle").evaluate(el => el === document.activeElement), true, "cancel returns focus to the visible menu trigger");
    }
    await openWarning();
    await Promise.all([page.waitForEvent("filechooser"), warning.getByRole("button", { name: "選擇 JSON 檔案", exact: true }).click()]);
    assert.equal(chooserCount, 1, "confirmation opens the file chooser once");
    assert.equal(await page.evaluate(key => dndStorage.getItem(key), autoKey), before.autosave, "choosing a file has not replaced the character yet");
    page.off("filechooser", recordChooser);
    await page.evaluate(() => sessionStorage.setItem("test-import-failure", "stage")); await upload();
    await page.getByRole("dialog", { name: "JSON 匯入失敗", exact: true }).getByRole("button", { name: "關閉", exact: true }).click();
    assert.equal(await page.locator("#gear-extra").inputValue(), "Original");
    assert.equal(await page.evaluate(key => dndStorage.getItem(key), autoKey), before.autosave);
    await page.evaluate(() => sessionStorage.removeItem("test-import-failure"));
    await Promise.all([page.waitForEvent("load"), upload()]); await assertImported();
    assert.equal(await page.evaluate(key => sessionStorage.getItem(key), pendingKey), null);
    for (const failure of ["apply", "save"]) {
      const old = await seed();
      await page.evaluate(failure => sessionStorage.setItem("test-import-failure", failure), failure);
      await Promise.all([page.waitForEvent("load"), upload()]);
      await page.waitForFunction(() => autosaveRestoreBlocked === true);
      const kept = await page.evaluate(({ pendingKey, autoKey, memoryKey }) => ({ staged: JSON.parse(sessionStorage.getItem(pendingKey)), autosave: dndStorage.getItem(autoKey), memories: dndStorage.getItem(memoryKey) }), { pendingKey, autoKey, memoryKey });
      assert.equal(kept.staged.data["gear-extra"], "Imported");
      assert.equal(kept.staged.previous[autoKey], old.autosave);
      assert.equal(kept.memories, old.memories);
      if (failure === "apply") assert.equal(kept.autosave, old.autosave);
      await page.evaluate(() => sessionStorage.removeItem("test-import-failure"));
      await page.goto(url); await assertImported();
      assert.equal(await page.evaluate(key => sessionStorage.getItem(key), pendingKey), null);
    }
    await seed(); await page.evaluate(() => sessionStorage.setItem("test-import-failure", "cleanup"));
    await Promise.all([page.waitForEvent("load"), upload()]); await assertImported();
    assert(await page.evaluate(key => sessionStorage.getItem(key), pendingKey));
    await page.evaluate(() => { document.getElementById("gear-extra").value = "After import edit"; saveAllFields(); });
    await page.goto(url);
    await page.waitForFunction(() => document.getElementById("gear-extra").value === "After import edit");
    await page.evaluate(() => { sessionStorage.removeItem("test-import-failure"); sessionStorage.removeItem("dnd.pendingJsonImport.v1"); sessionStorage.setItem("test-import-failure", "read"); });
    await page.goto(url);
    await page.waitForFunction(() => document.getElementById("gear-extra").value === "After import edit");
    assert.equal(await page.evaluate(() => saveAllFields()), true, "session read failure does not block ordinary autosave");
    await page.evaluate(() => sessionStorage.removeItem("test-import-failure"));
    await seed(); await page.evaluate(() => sessionStorage.setItem("test-import-failure", "cleanup"));
    await Promise.all([page.waitForEvent("load"), upload()]); await assertImported();
    await page.evaluate(() => { const entry = new URL(location.href); entry.searchParams.set("analytics", "owner"); history.replaceState(null, "", entry); });
    await Promise.all([page.waitForEvent("load"), page.evaluate(() => clearAppStateAndReload())]);
    await page.waitForFunction(() => !autosaveClearing && document.readyState === "complete");
    assert.equal(await page.locator("#gear-extra").inputValue(), "", "explicit clear cannot resurrect a completed import when session cleanup is blocked");
    assert.equal(await page.locator("#class").inputValue(), "");
    assert.equal(await page.evaluate(() => CustomBackground.getState()), null);
    assert.equal(await page.locator('#background option[value="custom"]').textContent(), "自訂");

    const avatar = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const preferences = { version: 1, notes: "EXPORTED NOTES", hiddenKeys: ["custom:custom-action-export"],
      customActions: [{ id: "custom-action-export", label: "匯出按鈕", mode: "bonus", description: "隨 JSON 還原" }] };
    const uploadText = async (name, text) => {
      await page.evaluate(() => { const entry = new URL(location.href); entry.searchParams.set("analytics", "owner"); history.replaceState(null, "", entry); });
      await page.locator("#import-json-file").setInputFiles({ name, mimeType: "application/json", buffer: Buffer.from(text) });
    };
    await seed();
    await page.evaluate(({ avatar, preferences }) => {
      dndStorage.setItem("dnd.tabletopAvatar.v1", avatar);
      dndStorage.setItem("dnd.tabletopActionPreferences.v1", JSON.stringify(preferences));
    }, { avatar, preferences });
    await page.goto(url);
    await page.waitForFunction(() => document.getElementById("gear-extra").value === "Original");
    const exported = await page.evaluate(() => {
      document.getElementById("gear-extra").value = "Exported";
      TabletopMode.setCharacterName("匯出角色");
      saveAllFields();
      return { ...collectJsonExportText(), autosave: dndStorage.getItem("dndchar_autosave_v1"), share: collectShareState() };
    });
    const exportedData = JSON.parse(exported.text);
    assert.equal(exported.avatarOmitted, false);
    assert.equal(exportedData.__tabletopAvatar, avatar);
    assert.deepEqual(exportedData.__tabletopActionPreferences, preferences);
    assert.equal(exportedData.characterName, "匯出角色");
    for (const key of ["__tabletopAvatar", "__tabletopActionPreferences"]) {
      assert.equal(Object.hasOwn(JSON.parse(exported.autosave), key), false, `${key} stays out of autosave`);
      assert.equal(Object.hasOwn(exported.share, key), false, `${key} stays out of share data`);
    }
    const shareHash = await page.evaluate(() => encodeStateToHash(collectShareState()));
    await page.goto(`${url}${shareHash}`);
    await page.waitForFunction(() => window.SHARE_MODE === true && TabletopMode.getCharacterName() === "匯出角色");
    const sharedExport = await page.evaluate(() => { const result = collectJsonExportText(); downloadStateAsJson(); return JSON.parse(result.text); });
    for (const key of ["__tabletopAvatar", "__tabletopActionPreferences"]) {
      assert.equal(Object.hasOwn(sharedExport, key), false, `share-mode JSON export omits the viewer's local ${key}`);
    }
    assert.equal(sharedExport.characterName, "匯出角色", "share-mode JSON export keeps the shared character");
    await page.getByText("分享模式匯出的檔案不含角色圖片、跑團按鈕與自創法術設定。").waitFor();
    await seed();
    await Promise.all([page.waitForEvent("load"), uploadText("tabletop-settings.json", exported.text)]);
    await page.waitForFunction(() => document.getElementById("gear-extra").value === "Exported" && !autosaveRestoreBlocked && !autosaveClearing);
    const restored = await page.evaluate(() => ({
      avatar: dndStorage.getItem("dnd.tabletopAvatar.v1"),
      preferences: JSON.parse(dndStorage.getItem("dnd.tabletopActionPreferences.v1")),
      label: TabletopMode.getTabletopActionPreferences().customActions[0]?.label,
      name: TabletopMode.getCharacterName(),
      image: document.getElementById("tabletop-avatar-image").getAttribute("src")
    }));
    assert.deepEqual(restored, { avatar, preferences, label: "匯出按鈕", name: "匯出角色", image: avatar },
      "exported JSON restores tabletop buttons, avatar and character name after the clean import");

    await uploadText("bad-avatar.json", JSON.stringify({ ...incoming, __tabletopAvatar: "data:text/html;base64,PHNjcmlwdD4=" }));
    await page.getByRole("dialog", { name: "JSON 匯入失敗", exact: true }).getByRole("button", { name: "關閉", exact: true }).click();
    assert.equal(await page.locator("#gear-extra").inputValue(), "Exported");
    assert.equal(await page.evaluate(() => dndStorage.getItem("dnd.tabletopAvatar.v1")), avatar, "a non-image avatar is rejected before any cleanup");
    console.log("JSON clean import: incoming precedence, cleanup, stage/apply/save failures, retained backups, retry, completion marker, denied session access and tabletop button/avatar round trip passed.");
  } finally { await page.close(); }
}

async function main() {
  const sections = new Set(process.argv.slice(2));
  for (const flag of sections) assert(["--appearance-only", "--dialogs-only", "--journal-only", "--pdf-only", "--pdf-fields-only", "--data-only"].includes(flag), `Unknown option: ${flag}`);
  assert(sections.size <= 1, "Choose at most one UI section");
  const all = sections.size === 0;
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  verifyAnalyticsIsolation(html);
  for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (match[1].trim()) new vm.Script(match[1]);
  }
  for (const file of getExtractedPageScriptFiles(html)) {
    new vm.Script(fs.readFileSync(path.join(__dirname, file), "utf8"), { filename: file });
  }
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const file = path.resolve(__dirname, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!file.startsWith(__dirname + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
      if (error) return res.writeHead(404).end();
      res.setHeader("Content-Type", { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png" }[path.extname(file)] || "application/octet-stream");
      res.end(data);
    });
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.DND_BROWSER_CHANNEL ? { channel: process.env.DND_BROWSER_CHANNEL } : {}) });
    const url = `http://127.0.0.1:${server.address().port}/index.html?analytics=owner`;
    if (all || sections.has("--data-only")) { await verifyJsonImportTransaction(browser, url); await verifyCharacterDataSafety(browser, url); await verifyClassOptionMemory(browser, url); }
    if (all || sections.has("--appearance-only")) {
      const page = await newUiPage(browser, { viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
      try { await verifyAppearanceAndLayout(browser, page, url); }
      finally { await page.close(); }
    }
    if (all || sections.has("--dialogs-only")) {
      await verifyToasts(browser);
      await verifyShareDialog(browser, url);
      await verifyAboutRoutes(browser, url);
      await verifyFeatureChoiceDisclosures(browser, url);
      await verifyCustomBackground(browser, url);
      await verifyCharacterFeatures(browser, url);
      await verifyClassFeatureChoicePrompt(browser, url);
      await verifyClassFeatureSupplementalChoices(browser, url);
      await verifyFeatureReferences(browser, url);
    }
    if (all || sections.has("--journal-only")) await verifyAdventureJournal(browser, url);
    if (all || sections.has("--pdf-only") || sections.has("--pdf-fields-only")) {
      const page = await newUiPage(browser);
      try {
        await page.goto(url);
        await verifyPdf(page, sections.has("--pdf-fields-only"));
      } finally { await page.close(); }
    }
    assert.deepEqual(browserErrors, [], "UI browser errors");
    console.log("Shared UI regression passed.");
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });

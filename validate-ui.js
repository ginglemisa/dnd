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

// iOS 15 的 Safari 不認得這些寫法：JS 遇到 lookbehind 整個檔案載入失敗，CSS 的範圍語法斷點整段被忽略。
function verifyOldSafariSyntax(html) {
  const siteScripts = fs.readdirSync(__dirname).filter(name => name.endsWith(".js") && !name.startsWith("validate-"));
  for (const [file, source] of [["index.html", html], ...siteScripts.map(name => [name, fs.readFileSync(path.join(__dirname, name), "utf8")])]) {
    assert(!/\(\?<[=!]/.test(source), `${file}: a regular-expression lookbehind stops the whole file from loading on iOS 15`);
  }
  const cssDir = path.join(__dirname, "css");
  for (const file of fs.readdirSync(cssDir).filter(name => name.endsWith(".css"))) {
    const css = fs.readFileSync(path.join(cssDir, file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    assert(!/@media[^{]*[<>]/.test(css), `${file}: iOS 15 ignores @media range syntax; write min-width/max-width instead`);
  }
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
    const expectedLogo = `.legal-modal-logo-${family} .legal-modal-logo-${mode}`;
    const legalModal = page.locator("#legal-modal");
    assert.equal(await legalModal.locator(expectedLogo).isVisible(), true);
    assert.equal(await legalModal.locator(".legal-modal-logo-classic img:visible, .legal-modal-logo-warm img:visible").count(), 1);
    // 技能頁不放 logo，分組清單不被裝飾隔開。
    assert.equal(await page.locator("#tab-skills img").count(), 0);
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
      text: { "classic-light": "rgb(51, 65, 93)", "classic-dark": "rgb(223, 226, 231)", "warm-light": "rgb(61, 48, 39)", "warm-dark": "rgb(226, 214, 194)" }[`${family}-${mode}`]
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

    // Buttons with their own fill must keep a readable label at rest and on hover; the generic button hover must not replace that fill.
    await page.evaluate(() => {
      const host = document.createElement("div");
      host.id = "contrast-fill-fixture";
      host.style.cssText = "position:fixed;top:0;left:0;z-index:2147483647;display:grid;gap:4px;width:200px;background:var(--surface-soft)";
      host.innerHTML = '<button class="app-dialog__button app-dialog__button--danger">a</button><button class="app-dialog__button app-dialog__button--primary">b</button><button class="spell-picker-selected-toggle" aria-pressed="true">c</button><div class="adventure-journal" style="position:static;display:block;width:auto;height:auto;min-height:0;padding:0;background:none"><button class="journal-primary">d</button></div><button class="dice-roller-roll">e</button><button class="money-submit-btn">f</button><button class="tabletop-condition-modal__apply">g</button><button class="tabletop-primary-button">h</button><button id="tour-next-btn">i</button><button class="weapon-mastery-badge" style="position:static;transform:none">j</button>';
      document.body.append(host);
      host.querySelectorAll("button").forEach(button => { button.style.transition = "none"; });
    });
    const fillButtons = page.locator("#contrast-fill-fixture button");
    for (let index = 0; index < await fillButtons.count(); index += 1) {
      for (const hovered of [false, true]) {
        await (hovered ? fillButtons.nth(index).hover() : page.mouse.move(380, 800));
        const fill = await fillButtons.nth(index).evaluate(button => {
          const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
          const rgba = color => { context.clearRect(0, 0, 1, 1); context.fillStyle = "rgba(0,0,0,0)"; context.fillStyle = color; context.fillRect(0, 0, 1, 1); const data = context.getImageData(0, 0, 1, 1).data; return [data[0], data[1], data[2], data[3] / 255]; };
          const over = (front, back) => [0, 1, 2].map(i => front[i] * front[3] + back[i] * (1 - front[3]));
          const luminance = rgb => { const [r, g, b] = rgb.map(value => { value /= 255; return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
          const ratio = (a, b) => { const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (light + 0.05) / (dark + 0.05); };
          const style = getComputedStyle(button);
          const surface = over(rgba(getComputedStyle(document.getElementById("contrast-fill-fixture")).backgroundColor), [255, 255, 255]);
          const stops = style.backgroundImage === "none" ? [] : style.backgroundImage.match(/rgba?\([^)]*\)|color\([^)]*\)/g) || [];
          const fills = (stops.length ? stops : [style.backgroundColor]).map(color => over(rgba(color), surface));
          const text = rgba(style.color);
          return { label: button.className || button.id, contrast: Math.min(...fills.map(back => ratio(over(text, back), back))) };
        });
        assert(fill.contrast >= 4.5, `${family}-${mode} ${fill.label} ${hovered ? "hover" : "rest"} contrast ${fill.contrast.toFixed(2)}`);
      }
    }
    await page.evaluate(() => document.getElementById("contrast-fill-fixture").remove());
    await page.mouse.move(0, 0);

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
          identity: getComputedStyle(document.querySelector('.basic-pair-field--class .mini-stat-label--features')).color };
      });
      assert.deepEqual(colors, { canvas: "rgb(12, 23, 41)", primary: ["rgb(197, 164, 108)", "rgb(12, 23, 41)"],
        navigation: ["rgb(197, 164, 108)", "rgb(12, 23, 41)"], identity: "rgb(234, 211, 164)" },
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
            targets: [...document.querySelectorAll('.skill-rank-target')].filter(el => rect(el).width > 0).every(el => rect(el).width >= 28 && rect(el).height >= 44),
            separated: cells.every(cell => rect(cell.querySelector(".skill-rank-controls")).right <= rect(cell.querySelector(".skill-tip")).left && rect(cell.querySelector(".skill-tip")).right <= rect(cell.querySelector('input[type="text"]')).left),
            legend: getComputedStyle(document.querySelector(".skill-legend")).display,
            expertiseLegend: getComputedStyle(document.querySelector("[data-expertise-legend]")).display,
            expertise: !document.querySelector('#exp-運動').closest('label').hidden,
            saveColumns: getComputedStyle(document.querySelector(".save-grid")).gridTemplateColumns.split(" ").length,
            saveOrder: [...document.querySelectorAll(".save-pair input[type=text]")].map(el => el.id.replace("save-", "")),
            saveNames: [...document.querySelectorAll(".save-name")].map(el => el.textContent),
            saveTargets: [...document.querySelectorAll(".save-name")].every(el => rect(el).height >= 44 && el.scrollWidth <= el.clientWidth && rect(el.querySelector("input")).width === rect(el).width && rect(el.querySelector("input")).height === rect(el).height),
            saveRows: new Set([...document.querySelectorAll(".save-pair")].map(el => Math.round(rect(el).top))).size,
            groupColumns: [...document.querySelectorAll(".skill-group-heading")].map(el => Math.round(rect(el).left)),
            skillOrder: [...document.querySelectorAll(".skill-grid .skill-tip")].map(el => el.dataset.skill).join(""),
            sectionOrder: [...document.querySelectorAll("#tab-skills .skill-section-heading h3")].map(el => el.textContent),
            notes: rect(document.getElementById("skill-extra")).height > 40,
            detail: (() => {
              const language = rect(document.querySelector(".language-card")), tool = rect(document.querySelector(".tool-card")), add = rect(document.getElementById("add-tool-proficiency")), list = rect(document.getElementById("tool-proficiency-list"));
              return { sideBySide: Math.abs(language.top - tool.top) < 1 && tool.left >= language.right, sameHeight: Math.abs(language.height - tool.height) < 1, sameWidth: Math.abs(language.width - tool.width) < 1, stacked: tool.top >= language.bottom, addBelow: add.top >= list.bottom };
            })()
          };
        });
        assert.equal(layout.overflow || layout.bad, false, JSON.stringify({ family, mode, width, cls, layout }));
        assert.equal(layout.checkboxes, true);
        assert.notEqual(layout.legend, "none");
        assert.equal(layout.expertise, cls === "rogue");
        assert.equal(layout.targets, true, "rank targets keep their touch area");
        assert.equal(layout.separated, true, "rank target, name and value do not overlap");
        assert.equal(layout.expertiseLegend !== "none", cls === "rogue", "expertise legend follows availability");
        const wide = width >= 720;
        assert.equal(layout.columns, wide ? 4 : 2);
        assert.equal(new Set(layout.groupColumns).size, wide ? 4 : 2, "ability groups stay in their columns");
        assert.deepEqual([layout.saveColumns, layout.saveRows], wide ? [6, 1] : [3, 2]);
        assert.deepEqual(layout.saveOrder, ["str", "dex", "con", "int", "wis", "cha"]);
        assert.deepEqual(layout.saveNames, ["力量", "敏捷", "體質", "智力", "感知", "魅力"], "saves show Chinese names only");
        assert.equal(layout.saveTargets, true, "the whole save name area is the toggle and nothing overflows");
        assert.equal(layout.skillOrder, "運動體操巧手隱匿奧秘歷史調查自然宗教馴獸洞悉醫藥察覺求生欺瞞威嚇表演遊說", "source order feeds the tabletop list");
        assert.deepEqual(layout.sectionOrder, ["屬性豁免", "技能", "語言", "工具", "技能/工具筆記區"]);
        assert.equal(layout.notes, true, "notes stay open");
        assert.equal(layout.detail.addBelow, true, "add tool button stays below the list");
        if (wide) assert.deepEqual([layout.detail.sideBySide, layout.detail.sameHeight, layout.detail.sameWidth], [true, true, true], "language and tools share a row");
        else assert.equal(layout.detail.stacked, true, "language stacks above tools");
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
    // 單一切換區走真實勾選框：可專精 ○→●→◆→○，不能專精 ○→●→○；圖示跟著勾選狀態。
    const rankControl = page.locator(".skill-rank-controls").filter({ has: page.locator("#prof-運動") });
    const rankState = () => page.evaluate(() => {
      const prof = document.getElementById("prof-運動"), exp = document.getElementById("exp-運動");
      return [prof.checked, exp.checked, getComputedStyle(prof.closest(".skill-rank-controls").querySelector(".skill-rank-mark"), "::before").content.replaceAll('"', "")];
    });
    await page.evaluate(() => { document.getElementById("prof-運動").checked = false; document.getElementById("exp-運動").checked = false; });
    assert.equal(await page.locator("#exp-運動").isDisabled(), false);
    assert.deepEqual(await rankState(), [false, false, "○"]);
    await rankControl.click();
    assert.deepEqual(await rankState(), [true, false, "●"]);
    await rankControl.click();
    assert.deepEqual(await rankState(), [false, true, "◆"]);
    await rankControl.click();
    assert.deepEqual(await rankState(), [false, false, "○"]);
    await page.locator("#prof-運動").focus();
    await page.keyboard.press("Space");
    assert.deepEqual(await rankState(), [true, false, "●"], "keyboard reaches the real checkbox");
    assert.deepEqual(await page.evaluate(() => {
      const box = document.getElementById("prof-運動");
      return [getComputedStyle(box.closest(".skill-rank-controls")).outlineStyle, getComputedStyle(box).outlineStyle];
    }), ["solid", "none"], "the focus ring is drawn once, on the toggle area");
    await page.keyboard.press("Space");
    await page.evaluate(() => showTab("basic"));
    await page.locator("#class").selectOption("fighter");
    await page.evaluate(() => showTab("skills"));
    await rankControl.click();
    assert.deepEqual(await rankState(), [true, false, "●"]);
    await rankControl.click();
    assert.deepEqual(await rankState(), [false, false, "○"]);
    // 豁免用同一組符號，點名稱區在 ○ 與 ● 之間切換；勾選框仍是唯一狀態，鍵盤和缺項提示都要聚焦得到。
    const saveState = () => page.evaluate(() => {
      const box = document.getElementById("prof-wis");
      return [box.checked, getComputedStyle(box.parentElement.querySelector(".skill-rank-mark"), "::before").content.replaceAll('"', "")];
    });
    assert.deepEqual(await saveState(), [false, "○"]);
    await page.locator('.save-name[for="prof-wis"]').click();
    assert.deepEqual(await saveState(), [true, "●"]);
    await page.locator('.save-name[for="prof-wis"]').click();
    assert.deepEqual(await saveState(), [false, "○"]);
    await page.locator("#prof-wis").focus();
    await page.keyboard.press("Space");
    assert.deepEqual(await saveState(), [true, "●"], "keyboard reaches the real save checkbox");
    await page.keyboard.press("Space");
    assert.notEqual(await page.locator("#prof-wis").evaluate(el => getComputedStyle(el).opacity), "0", "reminder jumps skip controls with zero opacity");
    // 分組標題的調整值隨屬性更新，屬性空白時不顯示。
    await page.evaluate(() => showTab("basic"));
    await page.locator("#dex").fill("16");
    assert.equal(await page.locator('.skill-group-mod[data-ability="dex"]').textContent(), "+3");
    await page.locator("#dex").fill("");
    assert.equal(await page.locator('.skill-group-mod[data-ability="dex"]').textContent(), "");
    await page.evaluate(() => showTab("skills"));
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
    assert((await art.getAttribute("src")).startsWith(family === "warm" ? "images/dice-warm-animated.webp?" : "images/dice.webp?"));
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
  // 屬性格寫匯出選項帶來的有效值（魔法物品），力量需求降速也用它；沒有帶時寫存檔的原值。
  assert.deepEqual(await page.evaluate(() => {
    const state = { class: "fighter", level: "1", str: "10", con: "12", armor: "鎖子甲", "speed-input": "30" };
    const pick = payload => [payload.strMod1, payload.str1, payload.conMod1, payload.con1, payload.speed1];
    return [pick(buildPdfFieldPayload(state)), pick(buildPdfFieldPayload(state, { abilityScores: { str: "19", con: "19" } }))];
  }), [["10", "0", "12", "+1", "20"], ["19", "+4", "19", "+4", "30"]], "PDF ability boxes use the effective scores passed by the page");
  // 魔法物品的熟練加值（艾恩石精進）與速度選項（跑跳之靴：速度至少 30、不因力量需求降速）由匯出選項帶入，和角色卡一致。
  assert.deepEqual(await page.evaluate(() => {
    const state = { class: "fighter", level: "5", str: "10", armor: "鎖子甲", "speed-input": "25" };
    const pick = payload => [payload.proficiencyBonus1, payload.speed1];
    return [
      pick(buildPdfFieldPayload(state)),
      pick(buildPdfFieldPayload(state, { magicProficiencyBonus: 1, magicSpeedOptions: { minimumSpeed: 30, ignoreArmorStrength: true } })),
      pick(buildPdfFieldPayload(state))
    ];
  }), [["+3", "15"], ["+4", "30"], ["+3", "15"]], "PDF proficiency bonus and speed use the magic item options and reset afterwards");
  await page.evaluate(() => {
    for (const key of ["derived-feat-human-origin", "derived-feat-lessons-1", "derived-feat-lessons-2", "derived-feat-fighter-level-4", "derived-feat-warlock-level-8", "feat-0"]) {
      if (!buildPdfFieldPayload({ [key]: "強韌體魄" }).feats1.includes("HP上限+等級×2")) throw new Error(`PDF feat source: ${key}`);
    }
    if (!buildPdfFieldPayload({ "derived-feat-fighting-style-fighter-2": "防禦" }).feats1.includes("穿甲AC+1")) throw new Error("PDF second fighting style");
    const mirrored = buildPdfFieldPayload({
      "derived-feat-human-origin": "魔法學徒", "feat-choice-human-origin": "魔法學徒",
      "derived-feat-human-origin-magic-initiate-class": "wizard",
      "derived-feat-human-origin-magic-initiate-cantrip-1": "light",
      "derived-feat-human-origin-magic-initiate-cantrip-2": "mage-hand",
      "derived-feat-human-origin-magic-initiate-level-1": "shield"
    }).feats1;
    if (mirrored !== "魔法學徒(起源)\n法師表2戲1環") throw new Error("PDF derived Magic Initiate class line and mirror exclusion");
    for (const [classValue, line] of [["cleric", "牧師表2戲1環"], ["druid", "德魯伊表2戲1環"], ["wizard", "法師表2戲1環"]]) {
      if (buildPdfFieldPayload({ "feat-0": "魔法學徒", "feat-0-magic-initiate-class": classValue }).feats1 !== `魔法學徒(起源)\n${line}`) throw new Error(`PDF Magic Initiate class line before spells are chosen: ${classValue}`);
    }
    if (buildPdfFieldPayload({ "feat-0": "魔法學徒" }).feats1 !== "魔法學徒(起源)\n選1法表2戲1環") throw new Error("PDF Magic Initiate prompt before a class is chosen");
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
      if (text !== "魔法學徒(起源)" || /光亮術|魔法伎倆|護盾術|◇|法師表|選1法表|2戲1環/.test(text)) {
        throw new Error("manual spell PDFs retain the feat name without hidden automatic choices or free-use marks");
      }
    }
    const crowdedFeats = {
      "feat-0": "魔法學徒",
      "feat-0-magic-initiate-class": "wizard",
      "feat-0-magic-initiate-cantrip-1": "light",
      "feat-0-magic-initiate-cantrip-2": "mage-hand",
      "feat-0-magic-initiate-level-1": "shield",
      "feat-1": "醫療兵",
      "feat-2": "封鎖者",
      "feat-3": "擒抱者"
    };
    const tenLineFeats = { ...crowdedFeats, "feat-3": "警覺" };
    for (const outputMode of ["editable", "compact"]) {
      const shortened = buildPdfFieldPayload(crowdedFeats, { outputMode });
      const featTitles = ["魔法學徒(起源)", "醫療兵(起源)", "封鎖者(通用)", "擒抱者(通用)"];
      if (shortened.feats1 !== featTitles.join("\n") || /光亮術|護盾術|法師表|醫療包耗生命骰|撤離傷人可藉機|拳打抱|另有專長未列出/u.test(shortened.feats1)) {
        throw new Error(`PDF title-only feat fallback: ${outputMode}`);
      }
      if (buildPdfFieldPayload(tenLineFeats, { outputMode }).feats1.split("\n").length !== 10) {
        throw new Error(`PDF feats at exactly ten lines keep their details: ${outputMode}`);
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
    const officialFeatNames = [["封鎖者", "哨兵"], ["尋物好手", "觀察力"], ["最佳旅伴", "領袖之證"], ["臨陣施法", "戰地施法者"], ["衝鋒猛擊", "衝鋒手"], ["迅捷步法", "快速移動"], ["重甲減傷", "重甲大師"], ["雙持追擊", "雙持客"]];
    for (const [feat, officialName] of officialFeatNames) {
      const official = buildPdfFieldPayload({ "feat-0": feat }, { sheetTemplate: "official" })["feat-trat"];
      const thirdParty = buildPdfFieldPayload({ "feat-0": feat }).feats1;
      if (!official.startsWith(`${officialName}(通用)`) || official.includes(feat)) throw new Error(`Official sheet feat name: ${feat}`);
      if (!thirdParty.startsWith(`${feat}(通用)`) || thirdParty.includes(officialName)) throw new Error(`Other sheets keep the feat name: ${feat}`);
    }
    const officialTitles = buildPdfFieldPayload({ "feat-0": "醫療兵", "feat-1": "封鎖者", "feat-2": "擒抱者", "feat-3": "最佳旅伴", "feat-4": "迅捷步法", "feat-5": "衝鋒猛擊" }, { sheetTemplate: "official" })["feat-trat"];
    if (officialTitles !== "醫療兵(起源)\n哨兵(通用)\n擒抱者(通用)\n領袖之證(通用)\n快速移動(通用)\n衝鋒手(通用)") throw new Error("Official sheet title-only feat names");
    for (const [background, siteName, officialName] of [["fieldhand", "耕者", "農夫"], ["seeker", "孤芳", "隱士"]]) {
      if (buildPdfFieldPayload({ background }, { sheetTemplate: "official" }).bg !== officialName) throw new Error(`Official sheet background name: ${background}`);
      if (buildPdfFieldPayload({ background }).Background2 !== siteName) throw new Error(`Other sheets keep the background name: ${background}`);
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
    // 守護者／哨衛的選項 grants 要進 PDF 的護甲勾選與武器熟練；等級未填時同網站視為 1 級。
    for (const [cls, option, other, armor] of [
      ["cleric", "cleric-guardian", "cleric-trickster", { light: true, medium: true, heavy: true }],
      ["druid", "druid-sentinel", "druid-shaman", { light: true, medium: true, heavy: false }]
    ]) {
      const training = payload => JSON.stringify({ light: payload.chk_light1, medium: payload.chk_medium1, heavy: payload.chk_heavy1 });
      for (const level of ["1", ""]) {
        const granted = buildPdfFieldPayload({ class: cls, level, [option]: true, [other]: false });
        const plain = buildPdfFieldPayload({ class: cls, level, [option]: false, [other]: true });
        if (training(granted) !== JSON.stringify(armor) || granted.weaponsProficiency1 !== "簡易武器和軍用武器") throw new Error(`PDF class option training: ${option} level ${level || "blank"}`);
        if (training(plain) !== JSON.stringify({ ...armor, [cls === "cleric" ? "heavy" : "medium"]: false }) || plain.weaponsProficiency1 !== "簡易武器") throw new Error(`PDF class option training: ${other} level ${level || "blank"}`);
      }
    }
    for (const cls of Object.keys(classRules)) {
      const payload = buildPdfFieldPayload({ class: cls, level: "20" });
      const features = `${payload.classFeatures1}\n${payload.classFeatures2}`.replace(/\n(?!等級|選擇|語言)/gu, "");
      if (/^等級 \d+：[^（(\n]*子職$/mu.test(features) || !/^等級 3：.+[（(].*[）)]$/mu.test(features)) throw new Error(`PDF omits bare subclass heading only: ${cls}`);
    }
    const classFeatureLines = state => {
      const payload = buildPdfFieldPayload({ level: "8", ...state });
      return `${payload.classFeatures1}\n${payload.classFeatures2}`.split("\n");
    };
    for (const [state, expected, absent = []] of [
      [{ class: "barbarian" }, ["等級 1：狂暴、無甲防禦", "等級 1：武器精通", "等級 5：額外攻擊、快速移動", "等級 7：野性直覺、本能飛撲"]],
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
    // PDF 的 M 欄讀結構化成分，說明文字怎麼寫都不影響。
    const originalCatalog = window.SpellCatalog;
    const guidance = originalCatalog.getSpell("guidance");
    try {
      for (const desc of ["成分: V、S、M\n材料: 一點磷", "成分：S, M", "效果: 材料成分: M"]) {
        window.SpellCatalog = { ...originalCatalog, getSpell: id => id === guidance.spellId ? { ...guidance, desc } : originalCatalog.getSpell(id) };
        for (const legacy of [false, true]) {
          if (materialFlag(guidance, legacy) !== false) throw new Error(`PDF material flag must ignore description text: ${desc}/legacy=${legacy}`);
        }
      }
    } finally { window.SpellCatalog = originalCatalog; }
    const customPayload = buildPdfFieldPayload({ class: "wizard", level: "1" }, { customSpells: [{ spellId: "custom-spell-pdf", level: 1, nameZh: "自創測試",
      header: { school: "塑能", castingTime: "反應動作，當你被攻擊時／儀式", range: "30 呎", components: "V、M", material: "羽毛", duration: "專注，1 分鐘", concentration: true, ritual: true, hasMaterial: true } }] });
    const customRow = Object.keys(customPayload).find(key => /^sp-name-\d+$/.test(key) && customPayload[key] === "自創測試")?.slice("sp-name-".length);
    if (!customRow || customPayload[`sp-cast-time-${customRow}`] !== "反應" || customPayload[`sp-range-${customRow}`] !== "30 呎"
      || !customPayload[`sp-c-${customRow}`] || !customPayload[`sp-r-${customRow}`] || !customPayload[`sp-m-${customRow}`]
      || customPayload[`note${customRow}`] !== "學派:塑能 | 持續:1分鐘") throw new Error("PDF custom spell reads its structured header");
    const expected = new Set(["barbarian", "cleric", "druid", "fighter", "paladin", "ranger"]);
    for (const cls of Object.keys(classRules)) {
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
    // Damage keeps half-width dice and one space between dice and type.
    const damageState = { "atk-main-name": "長劍", "atk-main-dmg": " 1d12  冷凍 " };
    if (buildPdfFieldPayload(damageState).dmg_type_1 !== "1d12 冷凍" || buildPdfFieldPayload(damageState, { sheetTemplate: "official" })["dmg-type1"] !== "1d12 冷凍") throw new Error("PDF damage keeps half-width text");
    // Agonizing Blast adds Charisma to the chosen warlock cantrip's damage row only.
    const agonizingState = {
      class: "warlock", level: "5", cha: "16", "spell-attack-bonus": "+6",
      "eldritch-invocation-3-1": true, "eldritch-invocation-3-1-cantrip": "eldritch-blast",
      "eldritch-invocation-3-2": false, "eldritch-invocation-3-2-cantrip": "poison-spray",
      __spellManagement: { version: 2, manual: true, entries: [{ spellId: "eldritch-blast", spellClass: "warlock" }, { spellId: "poison-spray", spellClass: "warlock" }] }
    };
    const agonizingRow = (state, options) => { const payload = buildPdfFieldPayload(state, options); return [payload.dmg_type_1 ?? payload["dmg-type1"], payload.dmg_type_2 ?? payload["dmg-type2"]]; };
    if (agonizingRow(agonizingState).join() !== "1d10+3 力場,2d12 毒素") throw new Error(`PDF adds Charisma to the Agonizing Blast cantrip: ${agonizingRow(agonizingState)}`);
    if (agonizingRow(agonizingState, { sheetTemplate: "official" }).join() !== "1d10+3 力場,2d12 毒素") throw new Error("Official PDF adds Charisma to the Agonizing Blast cantrip");
    if (agonizingRow({ ...agonizingState, "eldritch-invocation-3-1": false })[0] !== "1d10 力場") throw new Error("Unchecked Agonizing Blast adds nothing");
    if (agonizingRow({ ...agonizingState, cha: "8" })[0] !== "1d10-1 力場") throw new Error("Agonizing Blast writes a negative Charisma modifier");
    if (agonizingRow({ ...agonizingState, cha: "10" })[0] !== "1d10 力場") throw new Error("Agonizing Blast omits a zero modifier");
    if (agonizingRow({ ...agonizingState, __spellManagement: { version: 2, manual: true, entries: [{ spellId: "eldritch-blast", spellClass: "wizard" }] } })[0] !== "1d10 力場") throw new Error("Agonizing Blast only applies to warlock cantrip rows");
    // A long custom spell name stays one unbroken line in the single-line field.
    const longSpellName = "超長自創法術名稱測試用的完整名字";
    const longSpellPayload = buildPdfFieldPayload({ class: "wizard", level: "1" }, { customSpells: [{ spellId: "custom-spell-long", level: 1, nameZh: longSpellName, desc: "學派：塑能" }] });
    if (!Object.entries(longSpellPayload).some(([key, value]) => /^sp-name-\d+$/.test(key) && value === longSpellName)) throw new Error("PDF keeps a long spell name on one line");
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
              if (Number(/([\d.]+)\s+Tf/.exec(field.acroField.getDefaultAppearance())[1]) !== drawn[name].fontSize) throw new Error(`Editable editing font size matches its appearance: ${name}`);
            }
            // A reader redraws an edited field from DA, so every text field's
            // DA size must equal the size its appearance was drawn at.
            for (const field of form.getFields()) {
              if (!(field instanceof PDFLib.PDFTextField)) continue;
              const normal = field.acroField.getWidgets()[0].getAppearances()?.normal;
              if (!normal?.getContents) continue;
              const drawnSize = /\/\S+\s+([\d.]+)\s+Tf/.exec(new TextDecoder("latin1").decode(PDFLib.decodePDFRawStream(normal).decode()))?.[1];
              const editingSize = /([\d.]+)\s+Tf/.exec(field.acroField.getDefaultAppearance() || "")?.[1];
              if (drawnSize !== undefined && Number(drawnSize) !== Number(editingSize)) throw new Error(`Editable DA size matches appearance: ${field.getName()} ${editingSize} vs ${drawnSize}`);
            }
          }
        }
      } finally { PDFLib.defaultTextFieldAppearanceProvider = provider; }

      // Long free text stops at the readable minimum instead of shrinking
      // further; the blank experience field is centered for the player.
      const longNote = "多用途 (1d10)、精通：削弱，命中後目標下次攻擊檢定劣勢直到你的下回合開始";
      await exportCharacterPdfFromState({ class: "fighter", level: "3", "atk-main-name": "長劍", "atk-main-note": longNote }, { outputMode: "editable", characterName: "UI regression" });
      const floorForm = (await PDFLib.PDFDocument.load(await blob.arrayBuffer())).getForm();
      const noteField = floorForm.getTextField("wp-note-1");
      if (noteField.getText() !== longNote || !/\s7\s+Tf/.test(noteField.acroField.getDefaultAppearance())) throw new Error("Editable long note keeps full text at the 7 pt minimum");
      const experienceField = floorForm.getTextField("Exp1");
      if (experienceField.getAlignment() !== PDFLib.TextAlignment.Center || !/\s9\s+Tf/.test(experienceField.acroField.getDefaultAppearance())) throw new Error("Editable experience field centered at 9 pt");

      // Compact widens a long damage field to fit it exactly at 10 pt; the
      // fitted size must not round below 10 pt and truncate the text.
      const longDamage = "1d4+3 穿刺 1d6 冷凍";
      let compactDamage;
      PDFLib.PDFForm.prototype.flatten = function (options) {
        compactDamage = this.getTextField("dmg_type_2").getText();
        return flatten.call(this, options);
      };
      try {
        await exportCharacterPdfFromState({ class: "fighter", level: "1", "atk-main-name": "巨斧", "atk-off-name": "冰霜匕首", "atk-off-dmg": longDamage }, { outputMode: "compact", characterName: "UI regression" });
      } finally { PDFLib.PDFForm.prototype.flatten = flatten; }
      if (compactDamage !== longDamage) throw new Error(`Compact long damage keeps full text: ${compactDamage}`);

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
      // A reader redraws an edited field from DA, so a shrunken field must
      // record the reduced size it was drawn at, not its preferred size.
      const numberedLines = count => Array.from({ length: count }, (_, index) => `第${index + 1}行`).join("\n");
      for (const [sheetTemplate, name, notes, expected] of [
        ["official", "Equip", { "gear-notes": "長劍" }, 9],
        ["official", "Equip", { "gear-notes": numberedLines(18) }, 8.4],
        ["official", "Equip", { "gear-notes": numberedLines(30) }, 7],
        ["official", "class-a-2", { "class-extra": numberedLines(22) }, 8.3],
        ["official", "class-a-2", { "class-extra": numberedLines(30) }, 7],
        ["third-party", "extra1", { "gear-extra": "長".repeat(160) }, 9.9],
        ["third-party", "extra1", { "gear-extra": numberedLines(9) }, 9]
      ]) {
        await exportCharacterPdfFromState({ class: "fighter", level: "1", ...notes }, { outputMode: "editable", sheetTemplate, characterName: "UI regression" });
        const field = (await PDFLib.PDFDocument.load(await blob.arrayBuffer())).getForm().getTextField(name);
        const appearance = new TextDecoder("latin1").decode(PDFLib.decodePDFRawStream(field.acroField.getWidgets()[0].getAppearances().normal).decode());
        const drawnSize = Number(/\/\S+\s+([\d.]+)\s+Tf/.exec(appearance)?.[1]);
        const editingSize = Number(/([\d.]+)\s+Tf/.exec(field.acroField.getDefaultAppearance() || "")?.[1]);
        if (drawnSize !== expected || editingSize !== expected) throw new Error(`Shrunken field keeps its editing size: ${sheetTemplate}/${name} expected ${expected}, drawn ${drawnSize}, editing ${editingSize}`);
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
  // Same stylesheets, in the same order, as index.html.
  const indexHtml = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  for (const [, href] of indexHtml.matchAll(/<link rel="stylesheet" href="([^"?]+)/g)) {
    await page.addStyleTag({ path: path.join(__dirname, href) });
  }
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

// Real touch input over CDP, so touch-action, browser panning and pointercancel behave as on a phone.
async function openTouch(page) {
  const cdp = await page.context().newCDPSession(page);
  const send = (type, points) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: points.map(([x, y], id) => ({ x, y, id })) });
  return {
    send,
    // stepMs 0 is a flick; a hold before release drops the velocity to zero.
    async drag([x0, y0], [x1, y1], { steps = 8, stepMs = 16, hold = 0, release = true } = {}) {
      await send("touchStart", [[x0, y0]]);
      for (let step = 1; step <= steps; step++) {
        if (stepMs) await page.waitForTimeout(stepMs);
        await send("touchMove", [[x0 + (x1 - x0) * step / steps, y0 + (y1 - y0) * step / steps]]);
      }
      if (hold) await page.waitForTimeout(hold);
      if (release) await send("touchEnd", []);
    },
    end: () => send("touchEnd", []),
    close: () => cdp.detach()
  };
}

// Swiping the content changes the top-level tab in both modes; tab taps share the slide.
async function verifyPageSwipe(browser, url) {
  const mobile = { viewport: { width: 390, height: 844 }, hasTouch: true };
  const open = async (options, target = url) => {
    const page = await newUiPage(browser, { ...mobile, ...options });
    await page.goto(target);
    await page.locator(target === url ? "#legal-close-btn" : "#legal-ack-btn").click();
    await page.evaluate(() => {
      // Every page that was ever drawn beside the current one, as "side>current".
      window.pageSwipeLog = [];
      new MutationObserver(() => {
        const current = document.querySelector(".page-swipe-current")?.id;
        document.querySelectorAll(".page-swipe-side").forEach(side => {
          const entry = `${side.id}>${current}`;
          if (!window.pageSwipeLog.includes(entry)) window.pageSwipeLog.push(entry);
        });
      }).observe(document.getElementById("main-content"), { subtree: true, attributes: true, attributeFilter: ["class"] });
    });
    return page;
  };
  const read = page => page.evaluate(() => {
    const box = el => { const rect = el.getBoundingClientRect(); return { id: el.id, left: rect.left, top: rect.top, hidden: el.hidden, clip: el.style.clipPath }; };
    const current = document.querySelector(".page-swipe-current");
    return {
      tab: document.querySelector(".tab-content.active").id.replace("tab-", ""),
      panel: TabletopMode.getPanel(),
      scrollY: Math.round(window.scrollY),
      current: current ? box(current) : null,
      sides: [...document.querySelectorAll(".page-swipe-side")].map(box),
      bodyScrollTop: document.body.scrollTop
    };
  });
  const settle = async page => {
    await page.waitForFunction(() => !document.querySelector(".page-swipe-host, .page-swipe-current, .page-swipe-side"));
    assert.equal(await page.evaluate(() => [...document.querySelectorAll(".tab-content, .tabletop-panel")]
      .filter(panel => ["display", "position", "left", "top", "width", "height", "transform", "clipPath", "overflow"].some(key => panel.style[key])).length), 0,
    "a finished swipe leaves no inline layout styles on any page");
  };
  const log = page => page.evaluate(() => window.pageSwipeLog.splice(0));

  let page = await open();
  try {
    const exported = await page.evaluate(() => collectJsonExportText().text);
    // 觸控點分頁：新頁從按鈕順序的方向滑入；滑鼠點擊維持原本的切換。先測，之後的甩動會讓模擬器吞掉下一次點擊。
    await page.locator('.tab-button[aria-controls="tab-equipment"]').tap();
    assert.equal((await read(page)).tab, "equipment", "a tab tap switches at once");
    await settle(page);
    assert.deepEqual(await log(page), ["tab-basic>tab-equipment"], "a tab tap slides the old page out");
    await page.locator('.tab-button[aria-controls="tab-basic"]').tap();
    await settle(page);
    await page.locator('.tab-button[aria-controls="tab-skills"]').click();
    assert.equal((await read(page)).tab, "skills");
    await page.locator("#basic-tab-button").click();
    assert.deepEqual(await log(page), ["tab-equipment>tab-basic"], "mouse clicks keep the plain switch");

    const touch = await openTouch(page);
    const y = 500;
    // 跟手：鄰頁貼在旁邊，資料與作用中的分頁在放手前都不變；拖回去放手就反悔。
    await touch.drag([300, y], [150, y], { release: false });
    await page.waitForFunction(() => document.querySelector(".page-swipe-current")?.getBoundingClientRect().left < -100, null, { timeout: 2000 })
      .catch(() => assert.fail("the current page follows the finger"));
    let state = await read(page);
    assert.equal(state.tab, "basic", "dragging does not switch yet");
    assert.equal(state.current.id, "tab-basic");
    assert.deepEqual(state.sides.map(side => [side.id, side.hidden]), [["tab-skills", true]], "the next page by button order peeks in, still hidden to the app");
    assert(Math.abs(state.sides[0].left - state.current.left - 390) < 1, "pages sit one screen apart");
    await touch.send("touchMove", [[290, y]]);
    await page.waitForTimeout(150);
    await touch.end();
    await settle(page);
    assert.equal((await read(page)).tab, "basic", "dragging back cancels the switch");

    // 慢慢拖過半頁放手會換頁；換頁順序照按鈕（技能之後是裝備，面板 DOM 順序則是動作）。
    await touch.drag([320, y], [80, y], { stepMs: 30, hold: 150 });
    await settle(page);
    assert.equal((await read(page)).tab, "skills");
    await touch.drag([320, y], [80, y], { stepMs: 30, hold: 150 });
    await settle(page);
    assert.equal((await read(page)).tab, "equipment", "swipes follow the tab button order");
    assert.equal(await page.evaluate(() => window.dndStorage.getItem("activeTab")), "equipment", "the switch goes through showTab");
    // 甩動：距離短但夠快就換頁；同樣距離慢慢拖則留在原頁。
    await touch.drag([120, y], [240, y], { steps: 4, stepMs: 0 });
    await settle(page);
    assert.equal((await read(page)).tab, "skills", "a short flick switches");
    await touch.drag([120, y], [200, y], { stepMs: 40, hold: 150 });
    await settle(page);
    assert.equal((await read(page)).tab, "skills", "a short slow drag stays");

    // 垂直捲動照常；各頁的捲動位置照舊還原，滑進來的頁面一開始就畫在還原後的位置。
    await touch.drag([200, 650], [200, 350], { hold: 150 });
    await page.waitForTimeout(300);
    const skillsScroll = (await read(page)).scrollY;
    assert(skillsScroll > 100, `vertical drags still scroll the page: ${skillsScroll}`);
    assert.equal((await read(page)).tab, "skills");
    await touch.drag([80, y], [330, y], { stepMs: 30, hold: 150 });
    await settle(page);
    assert.deepEqual([(await read(page)).tab, (await read(page)).scrollY], ["basic", 0]);
    await touch.drag([330, y], [80, y], { stepMs: 30, hold: 150, release: false });
    const peekTop = (await read(page)).sides[0].top;
    await touch.end();
    await settle(page);
    state = await read(page);
    assert.deepEqual([state.tab, state.scrollY], ["skills", skillsScroll], "each tab keeps its own scroll position");
    assert(Math.abs(await page.evaluate(() => document.getElementById("tab-skills").getBoundingClientRect().top) - peekTop) < 1.5,
      "the incoming page is drawn where it lands");
    assert.equal(state.bodyScrollTop, 0);

    // 第一頁往右沒有上一頁：帶阻力、放手彈回。
    await page.evaluate(() => showTab("basic"));
    await touch.drag([80, y], [340, y], { release: false });
    await page.waitForFunction(() => document.querySelector(".page-swipe-current"));
    await page.waitForTimeout(60);
    state = await read(page);
    assert(state.current.left > 20 && state.current.left < 140 && state.sides.length === 0, `edge drag resists: ${state.current.left}`);
    await touch.end();
    await settle(page);
    assert.equal((await read(page)).tab, "basic");

    // 還在滑的頁面可以接住再拖回去。
    await touch.drag([330, y], [80, y], { stepMs: 30, hold: 150 });
    await touch.send("touchStart", [[120, y]]);
    await page.waitForTimeout(50);
    state = await read(page);
    assert.deepEqual([state.tab, state.current?.id], ["skills", "tab-skills"], "the switch happens on release and the page is still gliding");
    await page.waitForTimeout(120);
    const held = await read(page);
    assert(held.current && Math.abs(held.current.left - state.current.left) < 0.5 && held.current.left > 20,
      `a touch stops the gliding page: ${state.current.left} -> ${held.current?.left}`);
    for (const x of [180, 240, 300, 360]) { await page.waitForTimeout(30); await touch.send("touchMove", [[x, y]]); }
    await page.waitForTimeout(150);
    await touch.end();
    await settle(page);
    assert.equal((await read(page)).tab, "basic", "a caught page can be dragged back");

    // 不搶其他手勢：系統邊緣、對話框、橫向捲動區、內層分頁列、自己處理觸控的元件、第二根手指。
    const stays = async (label, gesture, { started = false } = {}) => {
      await log(page);
      await gesture();
      await page.waitForTimeout(250);
      await settle(page);
      assert.equal((await read(page)).tab, "basic", `${label} must not change the tab`);
      assert.equal((await log(page)).length > 0, started, `${label} ${started ? "starts" : "never starts"} a page drag`);
    };
    await stays("an edge swipe", () => touch.drag([10, y], [300, y], { steps: 4, stepMs: 0 }));
    await page.evaluate(() => { AppDialog.showMessage({ title: "滑動測試", message: "對話框開啟時不換頁" }); });
    await stays("a swipe under a dialog", () => touch.drag([320, 760], [80, 760], { steps: 4, stepMs: 0 }));
    await page.keyboard.press("Escape");
    await page.evaluate(() => {
      const host = document.createElement("div");
      host.id = "swipe-fixtures";
      host.innerHTML = '<div id="swipe-scroller" style="overflow-x:auto;height:70px"><div style="width:1200px;height:50px"></div></div>'
        + '<div id="swipe-tabs" role="tablist" style="height:70px"></div><div id="swipe-own" style="touch-action:none;height:70px"></div>';
      document.getElementById("tab-basic").prepend(host);
      window.scrollTo(0, 0);
    });
    const middle = async id => { const box = await page.locator(`#${id}`).boundingBox(); return box.y + box.height / 2; };
    const scrollerY = await middle("swipe-scroller");
    await stays("a horizontal scroller", () => touch.drag([320, scrollerY], [80, scrollerY], { hold: 150 }));
    assert(await page.evaluate(() => document.getElementById("swipe-scroller").scrollLeft) > 100, "the scroller itself scrolls");
    for (const id of ["swipe-tabs", "swipe-own"]) {
      const fixtureY = await middle(id);
      await stays(`#${id}`, () => touch.drag([320, fixtureY], [80, fixtureY], { steps: 4, stepMs: 0 }));
    }
    await page.evaluate(() => document.getElementById("swipe-fixtures").remove());
    await stays("a second finger", async () => {
      await touch.drag([320, y], [200, y], { release: false });
      await touch.send("touchStart", [[200, y], [300, 300]]);
      await touch.send("touchMove", [[40, y], [140, 300]]);
      await touch.end();
    }, { started: true });

    // 隱藏或停用的分頁會跳過。
    await page.evaluate(() => { document.querySelector('.tab-button[aria-controls="tab-skills"]').hidden = true; });
    await touch.drag([320, y], [80, y], { stepMs: 30, hold: 150 });
    await settle(page);
    assert.equal((await read(page)).tab, "equipment", "hidden tabs are skipped");
    await page.evaluate(() => { document.querySelector('.tab-button[aria-controls="tab-skills"]').hidden = false; });

    // 雙指放大檢視時停用，水平平移還給瀏覽器。
    const touchActions = () => page.evaluate(() => [document.body, document.getElementById("gear-notes")].map(el => getComputedStyle(el).touchAction));
    assert.deepEqual(await touchActions(), ["pan-y pinch-zoom", "pan-y pinch-zoom"]);
    const zoom = await page.context().newCDPSession(page);
    await zoom.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
    await page.waitForFunction(() => document.documentElement.classList.contains("page-swipe-zoomed"));
    assert.deepEqual(await touchActions(), ["auto", "auto"], "a zoomed page pans freely");
    await touch.drag([160, 300], [40, 300], { steps: 4, stepMs: 0 });
    await page.waitForTimeout(200);
    assert.equal((await read(page)).tab, "equipment", "a zoomed page does not swipe");
    await zoom.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 });
    await page.waitForFunction(() => !document.documentElement.classList.contains("page-swipe-zoomed"));
    await zoom.detach();

    // 跑團模式：照看得到的分頁順序換頁，切換走 TabletopMode.setPanel；各頁捲動位置不同時，滑進來的頁面不蓋住分頁列。
    await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("skills"); });
    await page.waitForTimeout(100);
    await page.evaluate(() => window.scrollTo(0, 150));
    await page.waitForTimeout(100);
    await touch.drag([80, y], [330, y], { stepMs: 30, hold: 150 });
    await settle(page);
    assert.deepEqual([(await read(page)).panel, (await read(page)).scrollY], ["overview", 0]);
    await touch.drag([330, y], [150, y], { release: false });
    await page.waitForFunction(() => document.querySelector(".page-swipe-side"));
    await page.waitForTimeout(60);
    state = await read(page);
    assert.deepEqual([state.panel, state.current.id, state.sides.map(side => side.id)], ["overview", "tabletop-panel-overview", ["tabletop-panel-skills"]]);
    assert(Math.abs(parseFloat(state.sides[0].clip.replace("inset(", "")) - 150) < 2, `the incoming panel is cut off below the tab bar: ${state.sides[0].clip}`);
    await touch.send("touchMove", [[60, y]]);
    await page.waitForTimeout(150);
    await touch.end();
    await settle(page);
    assert.deepEqual([(await read(page)).panel, (await read(page)).scrollY], ["skills", 150]);
    await page.evaluate(() => { TabletopMode.setPanel("overview"); window.scrollTo(0, 0); });
    const visiblePanels = await page.evaluate(() => [...document.querySelectorAll(".tabletop-primary-tabs [data-tabletop-tab]")].filter(tab => !tab.hidden).map(tab => tab.dataset.tabletopTab));
    const visited = ["overview"];
    for (let index = 1; index < visiblePanels.length; index++) {
      await touch.drag([330, 760], [80, 760], { stepMs: 30, hold: 150 });
      await settle(page);
      visited.push((await read(page)).panel);
    }
    assert.deepEqual(visited, visiblePanels, "tabletop swipes walk the visible tabs in order, from the blank area below a short panel too");
    await touch.drag([330, 760], [80, 760], { stepMs: 30, hold: 150 });
    await settle(page);
    assert.equal((await read(page)).panel, visiblePanels.at(-1), "the last panel has no next page");

    await page.evaluate(() => { TabletopMode.setMode("sheet"); showTab("basic"); });
    assert.equal(await page.evaluate(() => collectJsonExportText().text), exported, "swiping never changes character data");
    await touch.close();
  } finally { await page.close(); }

  // 減少動態效果：一樣能滑動換頁，但不跟手、不滑動。
  page = await open({ reducedMotion: "reduce" });
  try {
    const touch = await openTouch(page);
    await touch.drag([320, 500], [150, 500]);
    await page.waitForFunction(() => document.querySelector(".tab-content.active").id === "tab-skills");
    await touch.drag([320, 500], [280, 500], { stepMs: 30, hold: 150 });
    await page.waitForTimeout(100);
    assert.equal((await read(page)).tab, "skills", "a short drag stays under reduced motion too");
    assert.deepEqual(await log(page), [], "reduced motion never draws a sliding page");
    assert.equal(await page.evaluate(() => document.querySelectorAll("[class*='page-swipe']").length), 0);
    await touch.close();
  } finally { await page.close(); }

  // 分享模式也能換頁（鎖定的欄位上也能起手）。
  page = await newUiPage(browser, mobile);
  let shareHash;
  try {
    await page.goto(url);
    await page.waitForFunction(() => window.TabletopMode && window.Spellbook);
    shareHash = await page.evaluate(() => encodeStateToHash({ class: "fighter", level: "3", race: "human", str: "15", __shareStateVersion: 1 }));
  } finally { await page.close(); }
  page = await open({}, url + shareHash);
  try {
    await page.waitForFunction(() => document.getElementById("auto-calculate-key-stats-toggle")?.dataset.shareLocked === "true");
    const touch = await openTouch(page);
    await page.evaluate(() => document.getElementById("str").scrollIntoView({ block: "center" }));
    await page.waitForTimeout(200);
    const box = await page.locator("#str").boundingBox();
    assert.equal(await page.evaluate(() => document.getElementById("str").closest("[inert]") !== null || document.getElementById("str").readOnly), true, "the swipe starts on a locked field");
    await touch.drag([box.x + box.width / 2, box.y + box.height / 2], [box.x + box.width / 2 - 66, box.y + box.height / 2], { steps: 3, stepMs: 0 });
    await settle(page);
    assert.equal((await read(page)).tab, "skills", "share mode pages can be swiped");
    await touch.close();
  } finally { await page.close(); }

  // 桌機滑鼠拖曳不換頁。
  page = await newUiPage(browser, { viewport: { width: 1280, height: 800 } });
  try {
    await page.goto(url);
    await page.locator("#legal-close-btn").click();
    await page.mouse.move(700, 500);
    await page.mouse.down();
    await page.mouse.move(300, 500, { steps: 6 });
    const dragging = await page.evaluate(() => document.querySelectorAll("[class*='page-swipe']").length);
    await page.mouse.up();
    assert.deepEqual([dragging, await page.evaluate(() => document.querySelector(".tab-content.active").id)], [0, "tab-basic"], "mouse drags never swipe pages");
  } finally { await page.close(); }

  console.log("Page swipe: finger tracking, cancel, flick, tab order, scroll memory, edge resistance, catch, exclusions, zoom, tabletop, reduced motion, share mode, mouse and tab taps passed.");
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
    assert.equal(await dialog.getByText("無法分享跑團模式").count(), 0, "tabletop data is shared now, so the old warning is gone");
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
    assert.match(await cards.last().innerText(), /網址可能長達數千字元/);

    // The second step copies only on request, so choosing a link leaves the clipboard alone.
    const link = page.getByRole("dialog", { name: "分享連結", exact: true });
    const linkInput = link.getByRole("textbox", { name: "分享連結", exact: true });
    const copyLink = link.getByRole("button", { name: "複製連結", exact: true });
    const toasts = page.locator(".app-toast");
    await cards.last().click();
    await dialog.waitFor({ state: "detached" });
    await link.waitFor();
    const fullUrl = await linkInput.inputValue();
    assert.match(fullUrl, /#s2?=/);
    assert.equal(await page.evaluate(() => copiedShareUrls.length), 0, "opening the link dialog copies nothing");
    assert.equal(await link.locator(".share-link__qr").count(), 0, "full data URLs have no QR code");
    assert.equal(await link.getByText("網址可能長達數千字元", { exact: true }).count(), 1);
    assert.equal(await link.locator(".app-dialog__actions").count(), 0, "copy sits under the input, with no footer");
    assert.ok((await link.locator(".app-dialog__header h2").boundingBox()).width <= 1, "the title only names the dialog");
    assert.equal(await copyLink.evaluate(node => document.activeElement === node), true);
    assert.ok((await linkInput.boundingBox()).height <= 60, "the input stays one line tall");
    assert.equal(await link.evaluate(node => node.scrollWidth <= node.clientWidth + 1), true, "link dialog fits 390px");
    assert.equal(Math.round((await link.boundingBox()).width), 390, "phones get the full-width bottom sheet");
    await copyLink.click();
    assert.deepEqual(await page.evaluate(() => copiedShareUrls), [fullUrl]);
    await toasts.getByText("連結已複製。", { exact: true }).first().waitFor();
    assert.equal(await copyLink.innerText(), "複製連結", "the button text does not change after copying");
    assert.equal(await link.isVisible(), true, "copying keeps the dialog open");

    await page.evaluate(() => {
      window.grantedClipboardWrite = navigator.clipboard.writeText;
      navigator.clipboard.writeText = async () => { throw new Error("denied"); };
    });
    await copyLink.click();
    await toasts.getByText("瀏覽器未允許自動複製，已選取連結，請手動複製。", { exact: true }).first().waitFor();
    assert.deepEqual(await linkInput.evaluate(node => [document.activeElement === node, node.selectionStart, node.selectionEnd]), [true, 0, fullUrl.length], "a denied copy selects the link");
    await page.evaluate(() => { navigator.clipboard.writeText = window.grantedClipboardWrite; });
    await link.getByRole("button", { name: "關閉訊息", exact: true }).click();
    await link.waitFor({ state: "detached" });

    await page.evaluate(() => { showShareLinkDialog(`https://twd20.com/#s2=${"A".repeat(4100)}`); });
    await link.getByText("網址長度為 4122，部分瀏覽器可能無法完整讀取。建議改用「匯入 JSON／匯出 JSON」保存與還原。", { exact: true }).waitFor();
    assert.equal(await link.getByText("網址可能長達數千字元", { exact: true }).count(), 0, "the measured warning replaces the general note");
    assert.equal(await linkInput.evaluate(node => node.scrollWidth > node.clientWidth), true, "the rest of a long URL stays out of view");
    assert.equal(await link.evaluate(node => node.scrollWidth <= node.clientWidth + 1), true, "a long URL never widens the dialog");
    await page.keyboard.press("Escape");
    await link.waitFor({ state: "detached" });

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
    const shortUrl = "https://twd20.com/s/Abc1234";
    await page.evaluate(value => { window.createShortShareUrl = async () => value; }, shortUrl);
    const qrArea = link.locator(".share-link__qr");

    // A QR library that fails to load only costs the QR code.
    await page.route("**/qrcode-generator.js*", route => route.abort());
    await open();
    await cards.first().click();
    await link.waitFor();
    await qrArea.getByText("QR Code 無法產生，請複製連結傳送。", { exact: true }).waitFor();
    await copyLink.click();
    assert.equal(await page.evaluate(() => copiedShareUrls.at(-1)), shortUrl, "copy works without the QR code");
    await page.keyboard.press("Escape");
    await link.waitFor({ state: "detached" });
    await page.unroute("**/qrcode-generator.js*");

    const copiesBefore = await page.evaluate(() => copiedShareUrls.length);
    await open();
    await cards.first().click();
    await link.waitFor();
    await qrArea.locator("svg").waitFor();
    assert.equal(await qrArea.locator("svg").getAttribute("viewBox"), "0 0 37 37", "a short URL is 29 modules plus the quiet zone");
    assert.deepEqual(await qrArea.evaluate(node => [getComputedStyle(node).backgroundColor, getComputedStyle(node.querySelector("path")).fill]), ["rgb(255, 255, 255)", "rgb(0, 0, 0)"]);
    assert.equal(Math.round((await qrArea.boundingBox()).width), 222);
    assert.equal(await link.getByText("有效期限 90 天", { exact: true }).count(), 1);
    assert.equal(await linkInput.inputValue(), shortUrl);
    assert.equal(await page.evaluate(() => copiedShareUrls.length), copiesBefore, "opening the link dialog copies nothing");
    assert.equal(await link.evaluate(node => node.scrollWidth <= node.clientWidth + 1), true, "short link dialog fits 390px");
    await copyLink.click();
    assert.equal(await page.evaluate(() => copiedShareUrls.at(-1)), shortUrl);
    await page.keyboard.press("Escape");
    await link.waitFor({ state: "detached" });
    console.log("Share dialog: choice cards, unavailable reason, failure without retry, cancel, link step, QR code and copy passed.");
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
  await dragToast(desktop, 0, 56);
  await desktop.waitForTimeout(250);
  assert.deepEqual(await toastMessages(desktop), ["第二則", "第四則"], "A quick short mouse drag still keeps the toast");
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
  // 甩動：距離短但夠快就滑除；同樣距離慢慢拖、或拖遠後甩回來則保留。
  await mobile.evaluate(() => AppDialog.notify("甩動", { duration: 10000 }));
  await mobile.waitForTimeout(250);
  const touch = await openTouch(mobile);
  const flickBox = await mobile.locator("#app-toast .app-toast").nth(1).boundingBox();
  const [flickX, flickY] = [flickBox.x + 40, flickBox.y + flickBox.height / 2];
  await touch.drag([flickX, flickY], [flickX + 56, flickY], { steps: 7, stepMs: 50 });
  await mobile.waitForTimeout(250);
  assert.deepEqual(await toastMessages(mobile), ["丙", "甩動"], "A slow short drag keeps the toast");
  await touch.drag([flickX, flickY], [flickX + 220, flickY], { steps: 4, stepMs: 30, release: false });
  for (const back of [190, 160, 130, 100]) { await mobile.waitForTimeout(25); await touch.send("touchMove", [[flickX + back, flickY]]); }
  await touch.end();
  await mobile.waitForTimeout(250);
  assert.deepEqual(await toastMessages(mobile), ["丙", "甩動"], "Flicking back keeps the toast");
  await touch.drag([flickX, flickY], [flickX + 56, flickY], { steps: 2, stepMs: 0 });
  await mobile.waitForFunction(() => document.querySelectorAll("#app-toast .app-toast").length === 1);
  assert.deepEqual(await toastMessages(mobile), ["丙"], "A quick short flick dismisses the toast");
  await touch.close();
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
    assert.equal(await page.locator("#custom-background-feat option").count(), await page.evaluate(() => Object.values(getAllFeatRules()).filter(rule => rule.type === "origin").length + 1));
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
    assert.match(await page.locator("#backgroundFeatures").textContent(), /屬性：力量、敏捷、體質.*技能熟練：運動、隱匿/, "custom background lists use 、 while the saved format keeps commas");
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
      assert.equal(await shared.evaluate(() => localStorage.getItem("dndchar_autosave_v1")), localSave, "share viewing never overwrites the local custom background");
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
    assert.deepEqual(await tabs.allTextContents(), ["職業", "特性", "背景", "種族"]);
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
    assert.match(await modal.locator("#backgroundFeatures").textContent(), /屬性：體質、感知、魅力[\s\S]*技能熟練：醫藥、宗教/, "background detail lists use 、");
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
    assert.deepEqual(await tabs.allTextContents(), ["職業", "特性", "超魔", "背景", "種族"], "sorcerer metamagic tab is readable before level 2");
    await modal.getByRole("tab", { name: "超魔", exact: true }).click();
    assert.equal(await modal.locator("#character-features-picker").isVisible(), false, "picker only accompanies class, table, background and race tabs");
    const earlyMetamagic = modal.locator("#metamagicOptions input[data-metamagic-name]");
    assert(await earlyMetamagic.count() > 0, "metamagic options render at level 1");
    assert.equal(await earlyMetamagic.evaluateAll(inputs => inputs.every(input => input.disabled && !input.checked)), true, "metamagic stays disabled before level 2");
    await page.keyboard.press("Escape");
    await page.locator("#level").selectOption("");
    await opener.click();
    assert.deepEqual(await tabs.allTextContents(), ["職業", "特性", "超魔", "背景", "種族"], "sorcerer metamagic tab is readable without a level");
    assert.equal(await earlyMetamagic.evaluateAll(inputs => inputs.length > 0 && inputs.every(input => input.disabled)), true);
    await page.keyboard.press("Escape");
    await page.locator("#class").selectOption("warlock");
    await opener.click();
    assert.deepEqual(await tabs.allTextContents(), ["職業", "特性", "魔祈", "背景", "種族"], "warlock invocation tab is readable without a level");
    const earlyInvocations = modal.locator("#eldritch-invocations-output input[data-invocation-name]");
    assert.equal(await earlyInvocations.evaluateAll(inputs => inputs.length > 0 && inputs.every(input => input.disabled && !input.checked)), true, "invocations stay disabled before level 1");
    await page.keyboard.press("Escape");
    await page.locator("#class").selectOption("sorcerer");
    await page.locator("#level").selectOption("2");
    await opener.click();
    assert.deepEqual(await tabs.allTextContents(), ["職業", "特性", "超魔", "背景", "種族"]);
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
    assert.deepEqual(await tabs.allTextContents(), ["職業", "特性", "魔祈", "背景", "種族"]);
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
      for (const tab of ["職業", "特性", "魔祈", "背景", "種族"]) {
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
    await page.waitForFunction(() => !document.querySelector(".onboarding-jump-target"));
    // Lists light up their heading; a single choice lights up every option. Focus stays on the first open option.
    const choiceAlertCases = [
      ["sorcerer", "5", "超魔法", "metamagic", 1280, "Enter", ["summary@metamagic-options-disclosure"]],
      ["warlock", "5", "魔能祈喚", "invocations", 320, " ", ["summary@invocation-options-disclosure"]],
      ["cleric", "8", "神聖使命", "class", 1280, undefined, ["cleric-guardian", "cleric-trickster"]],
      ["druid", "7", "原初使命", "class", 320, undefined, ["druid-shaman", "druid-sentinel"]],
      ["paladin", "5", "戰鬥風格", "class", 1280, undefined, ["paladin-fighting-style", "paladin-blessed-warrior"]],
      ["ranger", "7", "防守戰術", "class", 320, undefined, ["ranger-defensive-tactics-escape-the-horde", "ranger-defensive-tactics-multiattack-defense"]]
    ];
    const jumpHighlights = () => page.evaluate(() => Array.from(document.querySelectorAll(".onboarding-jump-target"),
      el => el.id || `${el.localName}@${el.parentElement.id}`));
    for (const [cls, level, label, panel, width, key, highlighted] of choiceAlertCases) {
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
      assert.deepEqual(await jumpHighlights(), highlighted, `${label} reminder highlights the whole choice`);
      assert.equal(await page.evaluate(() => document.activeElement.matches('input[type="checkbox"]:not(:checked)')), true,
        `${label} reminder focuses an open option`);
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
      assert.deepEqual(await jumpHighlights(), highlighted, `${label} alert highlights the whole choice`);
      assert.equal(await modal.locator(`[data-feature-panel="${panel}"] .onboarding-jump-target`).evaluateAll(elements => elements.every(el => {
        const body = el.closest(".app-dialog__body").getBoundingClientRect();
        const rect = el.getBoundingClientRect();
        return rect.top >= body.top && rect.bottom <= body.bottom;
      })), true, `${label} targets are scrolled into view`);
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

// Reminders whose fields are rebuilt in the abilities dialog, span several selects, or are a single select.
async function verifyChoiceReminderHighlights(browser, url) {
  const page = await newUiPage(browser, { viewport: { width: 375, height: 812 }, reducedMotion: "reduce" });
  await page.addInitScript(() => { try { localStorage.setItem("dnd.classFeaturePromptDisabled.v1", "true"); } catch {} });
  try {
    await page.goto(url);
    await page.locator("#legal-close-btn").click();
    await page.locator("#background").selectOption("acolyte");
    await page.locator("#race").selectOption("dwarf");
    const check = selector => page.evaluate(selector => {
      const input = document.querySelector(selector);
      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, selector);
    const jump = async label => {
      await page.locator("#class-feature-choice-reminder button").filter({ hasText: label }).click();
      await page.waitForFunction(() => document.querySelector(".onboarding-jump-target"));
      const result = await page.evaluate(() => ({
        highlighted: Array.from(document.querySelectorAll(".onboarding-jump-target"), el => el.id),
        focused: document.activeElement.id,
        inView: Array.from(document.querySelectorAll(".onboarding-jump-target")).every(el => {
          const rect = el.getBoundingClientRect();
          const body = el.closest(".app-dialog__body")?.getBoundingClientRect() || { top: 0, bottom: innerHeight };
          return rect.top >= body.top && rect.bottom <= body.bottom;
        })
      }));
      assert.equal(result.inView, true, `${label} highlights are in view`);
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.querySelector(".app-dialog"));
      await page.evaluate(() => document.querySelectorAll(".onboarding-jump-target").forEach(el => el.classList.remove("onboarding-jump-target")));
      return result;
    };

    await page.locator("#class").selectOption("paladin");
    await page.locator("#level").selectOption("2");
    assert.deepEqual(await jump("魔法學徒"), {
      highlighted: ["derived-feat-background-magic-initiate-cantrip-1", "derived-feat-background-magic-initiate-cantrip-2", "derived-feat-background-magic-initiate-level-1"],
      focused: "derived-feat-background-magic-initiate-cantrip-1", inView: true
    }, "Magic Initiate highlights its open spell selects, not the background's fixed list");
    await check("#paladin-blessed-warrior");
    assert.deepEqual(await jump("受祝福的勇士"), {
      highlighted: ["class-feature-linked-class-paladin-blessed-warrior-0", "class-feature-linked-class-paladin-blessed-warrior-1"],
      focused: "class-feature-linked-class-paladin-blessed-warrior-0", inView: true
    }, "Blessed Warrior highlights both cantrip selects");

    await page.locator("#class").selectOption("warlock");
    await check('#eldritch-invocations-output input[data-invocation-name="苦痛魔爆"]');
    const agonizing = await jump("苦痛魔爆");
    assert.match(agonizing.highlighted.join(), /^class-feature-linked-eldritch-invocation-\d+-1-cantrip-0$/, "Agonizing Blast highlights the visible cantrip select");
    assert.equal(agonizing.focused, agonizing.highlighted[0]);

    await page.locator("#class").selectOption("druid");
    await page.locator("#level").selectOption("3");
    await check("#druid-sentinel");
    assert.deepEqual(await jump("大地結社地貌"), { highlighted: ["druid-land"], focused: "druid-land", inView: true },
      "a single select stays the only highlight");
    console.log("Choice reminders: multi-select, rebuilt dialog selects and single-select highlights passed.");
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
    assert.equal(await modal.locator('section[data-feature-id="druid-circle-of-the-land-spells"] [data-class-feature-additional="druid-land"]').getByLabel("大地結社地貌", { exact: true }).isVisible(), true);
    assert.notEqual(await modal.locator(".rule-table-shell--druid-terrain-spells").evaluate(el => getComputedStyle(el).borderTopStyle), "none", "rule tables keep their frame in the completion dialog");
    await modal.locator("#druid-sentinel").check();
    await modal.locator("#druid-elemental-fury-primal-strike").check();
    await modal.locator("#feat-choice-druid-level-4").selectOption("屬性值提升");
    await page.keyboard.press("Escape");
    await modal.waitFor({ state: "detached" });
    assert.equal(await page.evaluate(() => collectShareState()["druid-elemental-fury-primal-strike"]), true, "Escape preserves choices in share state");

    await chooseAsPlayer("class", "ranger");
    await modal.waitFor();
    assert.deepEqual(await modal.locator("section[data-feature-level]:visible h3").allTextContents(), ["等級 1：武器精通", "等級 2：戰鬥風格", "等級 3：狩獵目標（獵人子職）", "等級 4：屬性值提升", "等級 7：防守戰術（獵人子職）"]);
    await modal.locator("#ranger-weapon-mastery-pick-1").selectOption("長弓");
    await modal.locator("#ranger-weapon-mastery-pick-2").selectOption("短劍");
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
    await modal.locator("#paladin-weapon-mastery-pick-1").selectOption("長劍");
    await modal.locator("#paladin-weapon-mastery-pick-2").selectOption("標槍");
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
    assert.deepEqual(await page.evaluate(() => [document.getElementById("feat-choice-fighting-style-paladin").value, document.getElementById("feat-choice-fighting-style-paladin").disabled]),
      ["防禦", true], "manual mode still restores the remembered automatic fighting style, disabled");
    await chooseAsPlayer("level", "8");
    await page.waitForTimeout(200);
    assert.equal(await modal.count(), 0, "manual feat management also skips missing improvements");
    const details = page.locator("#character-features-modal");
    for (const [tab, width] of [["class", 1280], ["background", 390], ["race", 390]]) {
      await page.setViewportSize({ width, height: 900 });
      const before = await page.evaluate(() => collectStateObject());
      await page.locator(`[data-character-features-tab="${tab}"]`).click();
      const panel = details.locator(`[data-feature-panel="${tab}"]`);
      assert.equal(await panel.locator("[data-feat-choice] select:visible:enabled").count(), 0, "manual mode disables source feat/style/improvement selectors");
      if (tab === "class") assert(await panel.locator("[data-feat-choice] select:visible:disabled").count() > 0, "manual mode keeps the disabled source selectors visible");
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
    assert(await details.locator("[data-feature-panel='class'] [data-feat-choice] select:visible:enabled").count() > 0, "automatic mode re-enables source selectors");
    await page.keyboard.press("Escape");
    // 清掉記憶還原的戰鬥風格，讓後續等級變更照常提示。
    await page.evaluate(() => { document.getElementById("feat-choice-fighting-style-paladin").value = ""; syncDerivedFeatRows(); });
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
    // 清除紀錄會重新載入頁面：載入中的頁面還沒有這個常數時繼續等待。
    await page.waitForFunction(() => typeof CLASS_FEATURE_PROMPT_DISABLED_KEY !== "undefined" && dndStorage.getItem(CLASS_FEATURE_PROMPT_DISABLED_KEY) === null);
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
    const classLand = classModal.locator('section[data-feature-id="druid-circle-of-the-land-spells"] [data-class-feature-additional="druid-land"]').getByLabel("大地結社地貌", { exact: true });
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
    await page.addScriptTag({ url: "/pdf-field-map.js" });
    assert.equal(await page.evaluate(() => {
      document.getElementById("cha").value = "16";
      return buildPdfFieldPayload(collectStateObject({ includeDerivedSpellRows: true })).dmg_type_1;
    }), "1d10+3 力場", "the sheet's Agonizing Blast choice reaches the PDF damage row");

    const retainedChoices = { "class-paladin-blessed-warrior-cantrip-1": "guidance", "class-paladin-blessed-warrior-cantrip-2": "sacred-flame" };
    await page.evaluate(choices => {
      applyStateObject({ class: "paladin", level: "2", __spellManagement: { version: 2, manual: true, entries: [] },
        "paladin-blessed-warrior": true, "paladin-weapon-mastery-pick-1": "長劍", "paladin-weapon-mastery-pick-2": "標槍", __classFeatureCantrips: choices });
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
      const sources = [...Object.entries(classFeatures), ...Object.entries(raceText).map(([race, text]) => [race, text.html]),
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
        const html = highlightSpellNamesInClassFeature(classFeatures[name] || raceText[name]?.html);
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
      for (const name of Object.keys(getAllFeatRules())) {
        const raw = getFeatText(name).plain;
        const template = document.createElement("template");
        template.innerHTML = getFeatDescriptionHtml(name);
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
      finder.innerHTML = getFeatDescriptionHtml("尋物好手");
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
        ["dragonborn", raceText.dragonborn.html, 1], ["tiefling", raceText.tiefling.html, 3]
      ]) {
        const template = document.createElement("template");
        template.innerHTML = highlightSpellNamesInClassFeature(html);
        if (template.content.querySelectorAll('button[data-skill="抗性"]').length !== count) failures.push(`${name}: resistance body links`);
      }
      if (!classFeatures.barbarian.includes("<strong>好處：</strong>")) failures.push("reckless attack label");
      const bard = document.createElement("template");
      bard.innerHTML = classFeatures.bard;
      if (!bard.content.querySelector('[data-feature-id="bard-countercharm"]').textContent.includes("使用：反應")) failures.push("countercharm label");
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
        template.innerHTML = highlightSpellNamesInClassFeature(classFeatures[name] || raceText[name]?.html);
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
      await modal.getByRole("tab", { name: "職業", exact: true }).click();
      await modal.locator("#classCreationInfo .skill-tip").first().click();
      await assertOnTop(page.locator("#skillPopup"));
      await page.locator("#skillPopup .close").click();
      await modal.getByRole("tab", { name: "特性", exact: true }).click();
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
      await modal.getByRole("tab", { name: "特性", exact: true }).click();
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
      for (const [tab, container] of [["特性", "#classFeatures"], ["種族", "#raceFeatures"]]) {
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
      for (const [tab, key] of [["特性", "incapacitated"], ["特性", "charmed"], ["特性", "frightened"], ["種族", "frightened"]]) {
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
      await modal.getByRole("tab", { name: "特性", exact: true }).click();
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
    // 快速創角的種族完整能力與 1 級能力「查看」直接顯示內容檔 HTML：狀態標記須換成按鈕，關閉說明後焦點回到觸發的狀態連結。
    for (const [stepId, viewSelector, key] of [
      ["race", "[data-race-detail-view]", "poisoned"],
      ["level-one", '[data-level-one-feature-view="barbarian-rage"]', "incapacitated"]
    ]) {
      await page.evaluate(stepId => {
        const draft = quickBuild.createDraft();
        Object.assign(draft.choices, { background: "soldier", race: "dwarf", class: "barbarian" });
        draft.ui.currentStepId = stepId;
        dndStorage.setItem(quickBuild.storageKey, JSON.stringify(draft));
        quickBuild.open();
      }, stepId);
      await page.locator(viewSelector).click();
      assert.equal(await quickDetail.locator("span.condition-tip").count(), 0, `${stepId}: undecorated condition`);
      const tip = quickDetail.locator(`button.condition-tip[data-condition="${key}"]`).first();
      await tip.focus();
      await tip.press("Enter");
      await assertOnTop(page.locator("#skillPopup"));
      await page.keyboard.press("Escape");
      assert.equal(await quickDetail.isVisible(), true, `${stepId}: Escape keeps detail open`);
      assert.equal(await tip.evaluate(el => el === document.activeElement), true, `${stepId}: Escape restores focus`);
      await tip.click();
      await page.locator("#skillPopup .close").click();
      assert.equal(await tip.evaluate(el => el === document.activeElement), true, `${stepId}: close restores focus`);
      await quickDetail.locator(".quick-build-spell-detail-close").click();
      await page.locator("#quick-build-wizard .quick-build-close").click();
    }
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
async function verifyAutoCalculatedChecks(browser, url) {
  const page = await newUiPage(browser, { viewport: { width: 1280, height: 900 } });
  const MARK = "__autoCalculatedChecks";
  const MEMORY = "dnd.classOptionMemories.v1";
  const TOGGLE = "auto-calculate-key-stats-toggle";
  const value = id => page.evaluate(id => {
    const control = document.getElementById(id);
    return control.type === "checkbox" ? control.checked : control.value;
  }, id);
  const values = ids => Promise.all(ids.map(value));
  const set = (id, next, type = "change") => page.evaluate(({ id, next, type }) => {
    const control = document.getElementById(id);
    control.value = next;
    control.dispatchEvent(new Event(type, { bubbles: true }));
  }, { id, next, type });
  const tick = id => page.evaluate(id => document.getElementById(id).click(), id);
  // Native keyboard selection is a trusted player change, which is what class memory listens to.
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
    assert.equal(await page.locator(`#${id}`).inputValue(), next);
  };
  const ready = () => page.waitForFunction(() => window.TabletopMode && window.ClassOptionMemory && derivedChecksReady);
  const reminders = () => page.evaluate(() => buildPdfPrecheckMessages().map(entry => entry.message));
  try {
    await page.addInitScript(() => { try { localStorage.setItem("dnd.classFeaturePromptDisabled.v1", "true"); } catch {} });
    await page.goto(url);
    await ready();
    await page.locator("#legal-close-btn").click();
    await page.evaluate(() => window.onboardingTour?.finish?.());

    // A new blank character starts automatic, read-only and without calculate buttons or hints.
    assert.deepEqual(await page.evaluate(toggle => ({
      auto: document.getElementById(toggle).checked,
      readOnly: [document.getElementById("skill-隱匿").readOnly, document.getElementById("save-dex").readOnly],
      aria: document.getElementById("skill-隱匿").getAttribute("aria-readonly"),
      tabIndex: document.getElementById("save-dex").tabIndex,
      buttons: Array.from(document.querySelectorAll("#tab-skills .skill-calc-button"), button => button.hidden),
      hints: document.querySelectorAll("#tab-skills .skill-action-hint").length,
      label: document.getElementById(toggle).closest("label").textContent.trim()
    }), TOGGLE), { auto: true, readOnly: [true, true], aria: "true", tabIndex: -1, buttons: [true, true], hints: 0, label: "自動計算數值" });

    // Blank abilities stay blank instead of showing +0.
    assert.deepEqual(await values(["skill-運動", "save-str", "passive-perception"]), ["", "", ""], "blank abilities leave blank values");
    await set("str", "14", "input");
    assert.deepEqual(await values(["skill-運動", "save-str", "skill-隱匿", "save-dex"]), ["+2", "+2", "", ""], "only the filled ability is calculated");
    assert.ok((await reminders()).includes("技能加值有空白"), "the blank value reminder stays");

    // Every keystroke of an ability updates the numbers.
    await page.evaluate(() => showTab("basic"));
    await page.locator("#dex").focus();
    await page.keyboard.press("1");
    assert.deepEqual(await values(["skill-隱匿", "save-dex"]), ["-5", "-5"], "first keystroke updates");
    await page.keyboard.press("6");
    assert.deepEqual(await values(["skill-隱匿", "save-dex"]), ["+3", "+3"], "second keystroke updates");
    for (const [id, score] of [["con", "14"], ["int", "12"], ["wis", "13"], ["cha", "8"]]) await set(id, score, "input");
    assert.equal(await value("passive-perception"), "11", "passive perception follows the skill");

    // Class picks its saves; level moves the proficiency bonus.
    await set("class", "rogue");
    await set("level", "4");
    assert.deepEqual(await values(["prof-dex", "prof-int", "save-dex", "save-int", "save-str"]), [true, true, "+5", "+3", "+2"], "class sets saves");
    await set("level", "5");
    assert.deepEqual(await values(["save-dex", "save-int"]), ["+6", "+4"], "level updates saves immediately");
    await set("level", "4");

    // Skill ranks and save ticks apply as soon as they change.
    await tick("prof-隱匿");
    assert.equal(await value("skill-隱匿"), "+5", "proficiency applies immediately");
    await tick("exp-隱匿");
    assert.deepEqual(await values(["prof-隱匿", "exp-隱匿", "skill-隱匿"]), [false, true, "+7"], "expertise applies immediately");
    await tick("prof-察覺");
    assert.deepEqual(await values(["skill-察覺", "passive-perception"]), ["+3", "13"], "perception rank updates the passive value");
    await tick("prof-wis");
    assert.deepEqual(await values(["prof-wis", "save-wis"]), [true, "+3"], "manual save ticks count");
    await page.evaluate(() => fillSaves());
    assert.deepEqual(await values(["prof-wis", "prof-dex", "save-wis"]), [true, true, "+3"], "calculating no longer clears save ticks");

    // Changing class swaps only the class saves; picking no class changes nothing.
    await set("class", "fighter");
    assert.deepEqual(await values(["prof-str", "prof-con", "prof-dex", "prof-int", "prof-wis"]), [true, true, false, false, true], "class swap keeps the manual tick");
    assert.deepEqual(await values(["save-str", "save-dex", "save-wis"]), ["+4", "+3", "+3"]);
    await set("class", "");
    assert.deepEqual(await values(["prof-str", "prof-con", "prof-wis"]), [true, true, true], "no class leaves save ticks alone");
    await set("class", "cleric");
    assert.deepEqual(await values(["prof-str", "prof-con", "prof-wis", "prof-cha"]), [false, false, true, true], "the previous class is still removed after a blank pick");

    // Class options with a check bonus apply immediately, and saved data holds the new numbers.
    assert.equal(await value("skill-宗教"), "+1");
    await page.evaluate(() => document.getElementById("cleric-trickster").click());
    assert.equal(await value("skill-宗教"), "+2", "grants.checkBonus applies immediately");
    assert.equal((await page.evaluate(() => collectStateObject()))["skill-宗教"], "+2", "collected state holds the new number");
    await page.waitForFunction(() => JSON.parse(dndStorage.getItem(AUTO_SAVE_KEY) || "{}")["skill-宗教"] === "+2");
    const savedState = await page.evaluate(() => JSON.parse(dndStorage.getItem(AUTO_SAVE_KEY)));
    assert.equal(savedState[MARK], true, "autosave carries the marker");
    assert.equal((await page.evaluate(() => collectShareState()))[MARK], true, "share data carries the marker");

    // Tabletop mode shows new numbers on the next frame.
    await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("skills"); });
    await set("dex", "20", "input");
    await page.waitForFunction(() => Array.from(document.querySelectorAll("#tabletop-skill-values .tabletop-skill-value"))
      .some(item => item.textContent.includes("體操") && item.querySelector(".tabletop-skill-value__value").textContent === "+5"));
    await page.evaluate(() => TabletopMode.setMode("sheet"));

    // Parsing accepts full-width digits and signs without reading text as zero.
    assert.deepEqual(await page.evaluate(() => [
      parseSignedValue("＋３"), parseSignedValue("－３"), parseSignedValue("−３"), parseSignedValue("１２"), parseSignedValue("abc"),
      parseExactSignedValue("＋３"), parseExactSignedValue("abc"), parseExactSignedValue(""), normalizeSignedValueText("＋１２"), normalizeSignedValueText("－　３"), normalizeSignedValueText("abc")
    ]), [3, -3, -3, 12, 0, 3, null, null, "+12", "-3", "abc"]);

    // Every load path judges old data the same way, and only after everything is restored.
    const base = { class: "rogue", level: "4", race: "human", background: "soldier", str: "10", dex: "16", con: "14", int: "12", wis: "13", cha: "8",
      [TOGGLE]: true, "prof-dex": true, "prof-int": true, "prof-隱匿": true, "prof-察覺": true };
    const stats = () => page.evaluate(toggle => ({
      auto: document.getElementById(toggle).checked,
      readOnly: document.getElementById("skill-隱匿").readOnly,
      buttons: Array.from(document.querySelectorAll("#tab-skills .skill-calc-button"), button => button.hidden),
      keyStats: ["hp-display", "ac-display", "initiative-input", "speed-display"].map(id => document.getElementById(id).value)
    }), TOGGLE);
    const cases = [
      ["blank", base, { auto: true, values: { "skill-隱匿": "+5", "save-dex": "+5", "skill-運動": "0", "passive-perception": "13" } }],
      ["never calculated", { ...base, "prof-dex": false, "prof-int": false }, { auto: true, values: { "prof-dex": true, "prof-int": true, "save-dex": "+5" } }],
      ["matches the new calculation", { ...base, "skill-隱匿": "+5", "save-dex": "+5", "skill-運動": "0" }, { auto: true, values: { "skill-隱匿": "+5", "save-dex": "+5", "skill-歷史": "+1" } }],
      ["matches the old calculation", { ...base, cha: "", "skill-欺瞞": "0", "save-cha": "0", "prof-wis": true, "save-wis": "+1" }, { auto: true, values: { "skill-欺瞞": "", "save-cha": "", "save-wis": "+3" } }],
      ["differs", { ...base, "skill-隱匿": "+9", "save-dex": "+5", "skill-歷史": "+1" }, { auto: false, values: { "skill-隱匿": "+9", "save-dex": "+5", "skill-歷史": "+1", "skill-運動": "", "save-int": "" } }],
      ["text is not zero", { ...base, "skill-運動": "abc" }, { auto: false, values: { "skill-運動": "abc" } }],
      ["full-width matches", { ...base, "skill-隱匿": "＋５", "save-str": "０", "skill-察覺": "＋３" }, { auto: true, values: { "skill-隱匿": "+5", "save-str": "0", "passive-perception": "13" } }],
      ["marked data recalculates", { ...base, [MARK]: true, "skill-隱匿": "+9" }, { auto: true, values: { "skill-隱匿": "+5" } }],
      ["manual stays manual", { ...base, [TOGGLE]: false, "skill-隱匿": "+9", "skill-運動": "＋７" }, { auto: false, values: { "skill-隱匿": "+9", "skill-運動": "+7" } }]
    ];
    const loaders = {
      autosave: async state => {
        await page.evaluate(state => { cancelPendingAutosaveForClear(); dndStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(state)); }, state);
        await page.goto(url);
        await ready();
      },
      json: async state => {
        await page.evaluate(() => { const entry = new URL(location.href); entry.searchParams.set("analytics", "owner"); history.replaceState(null, "", entry); });
        await Promise.all([page.waitForEvent("load"), page.locator("#import-json-file").setInputFiles({ name: "old.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(state)) })]);
        await page.waitForFunction(() => window.derivedChecksReady !== false && typeof autosaveRestoreBlocked !== "undefined" && !autosaveRestoreBlocked && !sessionStorage.getItem("dnd.pendingJsonImport.v1") && document.readyState === "complete");
        await page.goto(url);
        await ready();
      },
      share: async state => {
        const hash = await page.evaluate(state => encodeStateToHash(state), { ...state, __shareStateVersion: 1 });
        await page.goto("about:blank");
        await page.goto(url + hash);
        await ready();
      }
    };
    for (const [path, load] of Object.entries(loaders)) {
      await page.goto(url);
      await ready();
      for (const [name, state, expected] of cases) {
        await load(state);
        const stat = await stats();
        const label = `${path}: ${name}`;
        assert.equal(stat.auto, expected.auto, `${label} switch`);
        // 分享模式不論自動計算開關，技能與豁免的數字都鎖定。
        assert.equal(stat.readOnly, path === "share" ? true : expected.auto, `${label} read-only`);
        assert.deepEqual(stat.buttons, [expected.auto, expected.auto], `${label} fill buttons`);
        assert.equal(stat.keyStats.every(Boolean), true, `${label} key stats are not left blank`);
        for (const [id, text] of Object.entries(expected.values)) assert.equal(await value(id), text, `${label} ${id}`);
        assert.equal((await page.evaluate(() => collectStateObject()))[MARK], true, `${label} marks the next save`);
        if (path === "share") await page.goto(url);
      }
    }

    // Turned-off data stays exactly as it was across another save and load.
    await loaders.autosave({ ...base, "skill-隱匿": "+9" });
    assert.equal(await page.evaluate(() => saveAllFields()), true);
    await page.goto(url);
    await ready();
    assert.deepEqual([await value(TOGGLE), await value("skill-隱匿"), await value("skill-歷史")], [false, "+9", ""], "manual data survives saving and reloading");

    // Manual numbers are never overwritten, and full-width input becomes half-width.
    await set("dex", "20", "input");
    assert.equal(await value("skill-隱匿"), "+9", "manual numbers ignore source changes");
    await page.evaluate(() => showTab("skills"));
    await page.locator("#skill-歷史").fill("＋１２");
    await page.locator("#skill-歷史").press("Tab");
    assert.equal(await value("skill-歷史"), "+12", "manual input normalizes to half-width");
    await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("skills"); });
    await page.waitForFunction(() => Array.from(document.querySelectorAll("#tabletop-skill-values .tabletop-skill-value"))
      .some(item => item.textContent.includes("歷史") && item.querySelector(".tabletop-skill-value__value").textContent === "+12"));
    await page.evaluate(() => TabletopMode.setMode("sheet"));

    // Turning automatic back on asks only when a number would change; cancelling stays manual.
    await page.evaluate(toggle => document.getElementById(toggle).click(), TOGGLE);
    await page.getByRole("button", { name: "繼續手動" }).click();
    assert.deepEqual([await value(TOGGLE), await value("skill-隱匿"), await page.locator("#calculate-skills-button").isVisible()], [false, "+9", true], "cancel keeps manual mode");
    await page.evaluate(() => document.getElementById("calculate-saves-button").click());
    assert.equal(await value("save-dex"), "+7", "the manual fill button calculates saves");
    assert.equal(await value("skill-隱匿"), "+9", "filling saves leaves skills alone");
    await page.evaluate(toggle => document.getElementById(toggle).click(), TOGGLE);
    await page.getByRole("button", { name: "開啟並更新" }).click();
    await page.waitForFunction(toggle => document.getElementById(toggle).checked, TOGGLE);
    await page.waitForFunction(() => document.getElementById("skill-隱匿").readOnly && document.getElementById("skill-隱匿").value === "+7");
    assert.equal(await page.locator("#calculate-skills-button").isVisible(), false);
    await page.evaluate(toggle => document.getElementById(toggle).click(), TOGGLE);
    assert.deepEqual([await value(TOGGLE), await value("skill-隱匿")], [false, "+7"], "turning off keeps the numbers");
    await page.evaluate(toggle => document.getElementById(toggle).click(), TOGGLE);
    assert.equal(await page.locator(".app-dialog__actions").isVisible().catch(() => false), false, "identical numbers do not ask");
    assert.equal(await value(TOGGLE), true);

    // The minimum skill count reminder only runs once background, class and level are chosen.
    const COUNT = "技能熟練未滿 4 項。";
    await loaders.autosave({ str: "10", dex: "10", con: "10", int: "10", wis: "10", cha: "10", [TOGGLE]: true, class: "fighter", level: "1" });
    assert.equal((await reminders()).includes(COUNT), false, "no background: no count reminder");
    await set("background", "soldier");
    assert.equal((await reminders()).includes(COUNT), true, "chosen background with no skills reminds");
    assert.equal(await page.evaluate(() => buildPdfPrecheckMessages().find(entry => entry.message === "技能熟練未滿 4 項。").selector), "#skill-bonus-section");
    await set("level", "");
    assert.equal((await reminders()).includes(COUNT), false, "no level: no count reminder");
    await set("level", "1");
    for (const skill of ["運動", "察覺", "威嚇"]) await tick(`prof-${skill}`);
    assert.equal((await reminders()).includes(COUNT), true, "three skills remind");
    await tick("prof-求生");
    assert.equal((await reminders()).includes(COUNT), false, "four skills pass");
    await tick("prof-求生");
    await set("class", "rogue");
    await tick("exp-隱匿");
    assert.equal((await reminders()).includes(COUNT), false, "expertise counts as a skill");

    // Lost expertise falls back to proficiency; returning to the class restores it.
    await loaders.autosave({ ...base, [MARK]: true, class: "wizard", "prof-隱匿": false, "prof-察覺": false, "prof-dex": false, "prof-int": false });
    await chooseAsPlayer("class", "rogue");
    await tick("exp-隱匿");
    assert.equal(await value("skill-隱匿"), "+7");
    await chooseAsPlayer("class", "fighter");
    assert.deepEqual(await values(["exp-隱匿", "prof-隱匿", "skill-隱匿"]), [false, true, "+5"], "lost expertise keeps proficiency");
    await chooseAsPlayer("class", "bard");
    await tick("exp-歷史");
    await chooseAsPlayer("class", "fighter");
    assert.deepEqual(await values(["exp-歷史", "prof-歷史"]), [false, true]);
    await chooseAsPlayer("class", "rogue");
    assert.deepEqual(await values(["exp-隱匿", "prof-隱匿", "exp-歷史", "prof-歷史", "skill-隱匿"]), [true, false, false, true, "+7"], "each class restores its own expertise");
    await chooseAsPlayer("class", "fighter");
    await chooseAsPlayer("class", "bard");
    assert.deepEqual(await values(["exp-歷史", "prof-歷史"]), [true, false], "the other class keeps its own expertise");
    assert.equal(await page.evaluate(key => (localStorage.getItem(key) || "").includes("expertise"), MEMORY), false, "expertise stays out of LocalStorage");

    // Short-term memory disappears on reload and when another character loads.
    await chooseAsPlayer("class", "rogue");
    await tick("exp-巧手");
    await chooseAsPlayer("class", "fighter");
    assert.equal(await page.evaluate(() => saveAllFields()), true);
    await page.goto(url);
    await ready();
    await chooseAsPlayer("class", "rogue");
    assert.deepEqual(await values(["exp-巧手", "prof-巧手"]), [false, true], "reloading forgets expertise");
    await tick("exp-巧手");
    await chooseAsPlayer("class", "fighter");
    await page.evaluate(() => applyStateObject({ class: "fighter", level: "1", "prof-巧手": false, "exp-巧手": false }));
    await chooseAsPlayer("class", "rogue");
    assert.deepEqual(await values(["exp-巧手", "prof-巧手"]), [false, false], "loading another character forgets expertise");
    await tick("exp-巧手");
    await chooseAsPlayer("class", "fighter");
    await page.evaluate(() => ClassOptionMemory.clearMemories());
    await chooseAsPlayer("class", "rogue");
    assert.equal(await value("exp-巧手"), false, "clearing memories forgets expertise");

    // Old persisted expertise lists are ignored.
    await page.evaluate(key => { cancelPendingAutosaveForClear(); localStorage.setItem(key, JSON.stringify({ version: 1, classes: { rogue: { level: 4, values: {}, lists: { expertise: ["運動"] } } } })); }, MEMORY);
    await page.goto(url);
    await ready();
    await chooseAsPlayer("class", "fighter");
    await chooseAsPlayer("class", "rogue");
    assert.equal(await value("exp-運動"), false, "persisted expertise is ignored");

    // A feat's expertise also falls back when the feat goes away.
    await page.evaluate(() => applyStateObject({ class: "fighter", level: "4", "manual-feat-management": true, __managedFeatRows: [{ value: "尋物好手" }], "prof-察覺": false, "exp-察覺": true }));
    assert.deepEqual(await values(["exp-察覺", "prof-察覺"]), [true, false], "loading keeps feat expertise");
    await page.evaluate(() => {
      const select = Array.from(document.querySelectorAll("#feats-area select")).find(control => control.value === "尋物好手");
      select.value = "";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    assert.deepEqual(await values(["exp-察覺", "prof-察覺"]), [false, true], "removing the feat falls back to proficiency");

    console.log("Auto-calculated checks: triggers, blank abilities, save ticks, marker, legacy autosave/JSON/share, manual switch, full-width input, minimum skill reminder and expertise fallback and memory passed.");
  } finally { await page.close(); }
}

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

    // Manual feat management keeps remembering the automatic set: feat choices and source Magic Initiate sub-options.
    await page.evaluate(() => ClassOptionMemory.clearMemories());
    const magicState = Object.fromEntries([["class", magic.class], ["cantrip-1", magic.cantrip1], ["cantrip-2", magic.cantrip2], ["level-1", magic.level1]]
      .map(([field, choice]) => [`derived-feat-cleric-level-4-magic-initiate-${field}`, choice]));
    await apply({ class: "cleric", level: "4", "manual-feat-management": true, __managedFeatRows: [{ value: "醫療兵" }],
      "feat-choice-cleric-level-4": "魔法學徒", ...magicState });
    await chooseAsPlayer("class", "wizard");
    const manualClericMemory = (await memory()).classes.cleric.values;
    assert.deepEqual([manualClericMemory["feat-choice-cleric-level-4"], ...Object.keys(magicState).map(id => manualClericMemory[id])],
      ["魔法學徒", ...Object.values(magicState)], "manual mode remembers the automatic feat choice and its Magic Initiate sub-options");
    await chooseAsPlayer("class", "cleric");
    await chooseAsPlayer("level", "3");
    await chooseAsPlayer("level", "4");
    assert.equal(await value("feat-choice-cleric-level-4"), "魔法學徒", "manual mode restores the automatic feat choice");
    assert.deepEqual(await page.evaluate(() => collectManagedFeatRows().map(row => row.value)), ["醫療兵"], "class memory leaves the manual set alone");
    await set("manual-feat-management", false);
    assert.deepEqual(await Promise.all(Object.keys(magicState).map(value)), Object.values(magicState), "automatic Magic Initiate sub-options survive class and level changes");

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

// Native keyboard selection is a trusted player change, which is what the background and class memories listen to.
async function chooseSelectAsPlayer(page, id, next) {
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
  return key;
}

// Each background remembers its own tool, Magic Initiate spells and free-use checks, in page memory only.
async function verifyBackgroundChoiceMemory(browser, url) {
  const page = await newUiPage(browser, { viewport: { width: 1280, height: 900 } });
  const MAGIC = "derived-feat-background-magic-initiate-";
  const FREE = "free-spell-use-derived-feat-background-level-1-1";
  const blank = { __spellManagement: { version: 2, manual: false, entries: [] }, class: "fighter", level: "3", race: "human", dex: "14", con: "14" };
  const apply = state => page.evaluate(state => applyStateObject(state), { ...blank, ...state });
  const value = id => page.evaluate(id => document.getElementById(id)?.value ?? null, id);
  const record = id => page.evaluate(id => ClassOptionMemory.getBackgroundChoices(id), id);
  const chooseAsPlayer = next => chooseSelectAsPlayer(page, "background", next);
  const synthetic = next => page.evaluate(next => {
    const select = document.getElementById("background");
    select.value = next;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }, next);
  const pick = spells => page.evaluate(({ spells, MAGIC }) => Object.entries(spells).forEach(([field, spell]) => {
    const select = document.getElementById(`${MAGIC}${field}`);
    select.value = spell;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }), { spells, MAGIC });
  const magic = () => page.evaluate(MAGIC => Object.fromEntries(["class", "cantrip-1", "cantrip-2", "level-1"]
    .map(field => [field, document.getElementById(`${MAGIC}${field}`)?.value ?? null])), MAGIC);
  const sourced = () => page.evaluate(() => SpellManagement.getEntries().filter(entry => entry.sourceKey?.startsWith("derived-feat-background-")).map(entry => entry.spellId));
  const free = () => page.evaluate(FREE => document.getElementById(FREE)?.checked ?? null, FREE);
  const setFree = checked => page.evaluate(({ FREE, checked }) => {
    const box = document.getElementById(FREE);
    box.checked = checked;
    box.dispatchEvent(new Event("change"));
  }, { FREE, checked });
  // Everything derived from the sheet stays put across a round trip: proficiency marks, save and skill numbers, initiative, HP.
  const numbers = () => page.evaluate(() => ({
    checks: Array.from(document.querySelectorAll("#tab-skills input"), input => input.type === "checkbox" ? input.checked : input.value),
    initiative: document.getElementById("initiative-input").value, hp: document.getElementById("hp-display").value
  }));
  const storedKeys = () => page.evaluate(() => { showTab("basic"); saveAllFields(); return Object.keys(localStorage).sort(); });
  const acolyteSpells = { "cantrip-1": "light", "cantrip-2": "guidance", "level-1": "bless" };
  const sageSpells = { "cantrip-1": "acid-splash", "cantrip-2": "chill-touch", "level-1": "alarm" };
  try {
    await page.addInitScript(() => { try { localStorage.setItem("dnd.classFeaturePromptDisabled.v1", "true"); } catch {} });
    await page.goto(url);
    await page.locator("#legal-close-btn").click();
    await page.evaluate(() => window.onboardingTour?.finish?.());

    // Soldier's own tool comes back after visiting other backgrounds, and nothing else moves.
    await apply({ background: "soldier", "prof-運動": true });
    await page.evaluate(() => { const select = document.getElementById("tool-proficiency-0"); select.value = "紙牌"; select.dispatchEvent(new Event("change", { bubbles: true })); });
    const soldierNumbers = await numbers();
    const soldierState = await page.evaluate(() => collectStateObject());
    const soldierShare = await page.evaluate(() => collectShareState());
    const keysBefore = await storedKeys();
    await chooseAsPlayer("criminal");
    assert.equal(await value("tool-proficiency-0"), "盜賊工具");
    await chooseAsPlayer("soldier");
    assert.equal(await value("tool-proficiency-0"), "紙牌", "soldier's tool is restored");
    assert.deepEqual(await numbers(), soldierNumbers, "proficiency, saves, skills, initiative and HP stay the same");

    // Nothing is persisted: autosave/JSON state and share payload are unchanged, and no new storage key appears.
    assert.deepEqual(await page.evaluate(() => collectStateObject()), soldierState, "autosave and JSON content are unchanged after a round trip");
    assert.deepEqual(await page.evaluate(() => collectShareState()), soldierShare, "share content is unchanged after a round trip");
    assert.deepEqual(await storedKeys(), keysBefore, "background memory stays out of LocalStorage");
    assert.ok(!JSON.stringify(soldierState).includes("backgroundChoice"));

    // A tool already taken by another row is not restored and that row keeps it.
    await chooseAsPlayer("criminal");
    await page.evaluate(() => {
      document.getElementById("add-tool-proficiency").click();
      const select = getManualToolProficiencyRows().at(-1).querySelector("select");
      select.value = "紙牌";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await chooseAsPlayer("soldier");
    assert.deepEqual(await page.evaluate(() => [document.getElementById("tool-proficiency-0").value, getManualToolProficiencyRows().at(-1).querySelector("select").value]),
      ["", "紙牌"], "a conflicting tool keeps the player's current row");

    // Acolyte and sage share control IDs but keep separate spells and free-use checks.
    await apply({ background: "acolyte" });
    await pick(acolyteSpells);
    await setFree(true);
    assert.deepEqual(await sourced(), ["light", "guidance", "bless"]);
    const acolyteNumbers = await numbers();
    await chooseAsPlayer("sage");
    assert.deepEqual(await magic(), { class: "wizard", "cantrip-1": "", "cantrip-2": "", "level-1": "" }, "a first visit does not inherit acolyte's shared spells");
    assert.deepEqual(await sourced(), []);
    await pick(sageSpells);
    assert.equal(await free(), false, "sage's free use starts unused");
    await chooseAsPlayer("acolyte");
    assert.deepEqual(await magic(), { class: "cleric", ...acolyteSpells }, "acolyte's spells are restored");
    assert.deepEqual(await sourced(), ["light", "guidance", "bless"], "spell management has acolyte's three spells");
    assert.equal(await free(), true, "acolyte's free use is restored");
    assert.deepEqual(await numbers(), acolyteNumbers);
    await chooseAsPlayer("sage");
    assert.deepEqual(await magic(), { class: "wizard", ...sageSpells }, "sage's spells are restored");
    assert.deepEqual(await sourced(), ["acid-splash", "chill-touch", "alarm"]);
    assert.equal(await free(), false, "acolyte's free use does not leak into sage");
    await setFree(true);
    await chooseAsPlayer("soldier");
    assert.deepEqual(await sourced(), [], "a background without Magic Initiate grants no spells");
    assert.ok(!Object.keys(await page.evaluate(() => collectStateObject())).some(key => key.startsWith("free-spell-use-")), "no free-use field remains");
    await chooseAsPlayer("");
    assert.deepEqual(await record("soldier"), { magic: {}, tool: "", freeUses: {} }, "a record is written on leaving, without another background's hidden spells");
    assert.equal(await value(`${MAGIC}class`), null, "no background has no feat row");
    await chooseAsPlayer("sage");
    assert.deepEqual(await magic(), { class: "wizard", ...sageSpells }, "the row rebuilt after no background is restored too");
    assert.equal(await free(), true);

    // Synthetic changes neither write nor read the memory.
    await setFree(false);
    await synthetic("criminal");
    assert.equal((await record("sage")).freeUses["derived-feat-background-level-1"][0], true, "a synthetic change does not write");
    await synthetic("acolyte");
    assert.deepEqual(await magic(), { class: "cleric", "cantrip-1": "", "cantrip-2": "", "level-1": "" }, "a synthetic change does not read");

    // Import, quick-build batches and share mode neither read nor write.
    await apply({ background: "acolyte" });
    await pick(acolyteSpells);
    await chooseAsPlayer("sage");
    const beforeGates = await record("acolyte");
    for (const [gate, open, close] of [
      ["share mode", () => { SHARE_MODE = true; window.SHARE_MODE = true; }, () => { SHARE_MODE = false; window.SHARE_MODE = false; }],
      ["JSON import", () => { jsonImportInProgress = true; }, () => { jsonImportInProgress = false; }],
      ["autosave pause", () => { autosaveSuspended = true; }, () => { autosaveSuspended = false; }],
      ["clearing", () => { autosaveClearing = true; }, () => { autosaveClearing = false; }],
      ["quick-build batch", () => SpellManagement.beginRestoreBatch(), () => SpellManagement.endRestoreBatch()]
    ]) {
      await pick(sageSpells);
      await page.evaluate(open);
      if (gate === "quick-build batch") await synthetic("acolyte");
      else await chooseAsPlayer("acolyte");
      assert.deepEqual((await magic())["cantrip-2"], "", `${gate} does not read the memory`);
      await page.evaluate(close);
      assert.deepEqual(await record("acolyte"), beforeGates, `${gate} does not write the memory`);
      await apply({ background: "acolyte" });
      await pick(acolyteSpells);
      await chooseAsPlayer("sage");
    }

    // Loading another character or reloading empties the memory; memory never overrides loaded data.
    assert.ok(await record("acolyte"));
    await apply({ background: "soldier", "tool-proficiency-0": "骰子" });
    assert.equal(await record("acolyte"), null, "loading a character clears the memory");
    assert.equal(await record("sage"), null);
    await chooseAsPlayer("acolyte");
    assert.deepEqual(await magic(), { class: "cleric", "cantrip-1": "", "cantrip-2": "", "level-1": "" }, "the previous character's spells do not come back");
    await chooseAsPlayer("soldier");
    assert.equal(await value("tool-proficiency-0"), "骰子", "the loaded character's own tool is remembered");
    assert.ok(await record("acolyte"));
    await page.evaluate(() => ClassOptionMemory.clearMemories());
    assert.equal(await record("acolyte"), null, "clearing records clears the memory");
    await chooseAsPlayer("acolyte");
    assert.ok(await record("soldier"));
    await page.reload();
    await page.waitForFunction(() => window.ClassOptionMemory);
    assert.equal(await record("soldier"), null, "reloading clears the memory");
    await page.evaluate(() => { document.getElementById("legal-close-btn")?.click(); window.onboardingTour?.finish?.(); });

    // Manual spell management: the controls round trip and the player's spell list is untouched.
    await apply({ background: "acolyte", __spellManagement: { version: 2, manual: true, entries: [{ spellId: "fire-bolt", spellClass: "wizard" }] } });
    await pick(acolyteSpells);
    await chooseAsPlayer("sage");
    await chooseAsPlayer("acolyte");
    assert.deepEqual(await magic(), { class: "cleric", ...acolyteSpells }, "manual spell mode restores the controls");
    assert.deepEqual(await page.evaluate(() => SpellManagement.getEntries().map(entry => entry.spellId)), ["fire-bolt"], "manual spell mode keeps the player's list");
    assert.equal(await free(), null);
    assert.equal(Object.hasOwn(await record("acolyte"), "freeUses"), false, "manual spell mode has no free-use record");

    // Manual feat management: the automatic set is kept off screen, per background, and comes back on leaving the mode.
    await apply({ background: "acolyte", "manual-feat-management": true, __managedFeatRows: [{ value: "醫療兵" }],
      ...Object.fromEntries(Object.entries({ class: "cleric", ...acolyteSpells }).map(([field, spell]) => [`${MAGIC}${field}`, spell])) });
    const automatic = () => page.evaluate(() => collectDerivedFeatMagicValues(["background"]));
    assert.equal((await automatic())[`${MAGIC}level-1`], "bless");
    await chooseAsPlayer("sage");
    assert.equal((await automatic())[`${MAGIC}level-1`], "", "the off-screen set does not carry acolyte's spells into sage");
    assert.deepEqual(await page.evaluate(() => collectManagedFeatRows().map(row => row.value)), ["醫療兵"], "the manual set is left alone");
    await chooseAsPlayer("acolyte");
    assert.equal((await automatic())[`${MAGIC}level-1`], "bless", "the off-screen set is restored");
    await page.evaluate(() => { const box = document.getElementById("manual-feat-management"); box.checked = false; box.dispatchEvent(new Event("change", { bubbles: true })); });
    assert.deepEqual(await magic(), { class: "cleric", ...acolyteSpells }, "leaving manual feats shows the restored spells");
    assert.deepEqual(await sourced(), ["light", "guidance", "bless"]);

    // Custom background: cancelling changes nothing; saving is a player change; editing keeps the choices.
    await apply({ background: "soldier", "tool-proficiency-0": "紙牌" });
    const dialog = page.locator('.app-dialog[data-variant="custom-background"]');
    const fillCustomForm = async () => {
      await page.locator("#custom-background-name").fill("學徒");
      await page.locator("#custom-background-equipment-a").fill("長棍");
      for (const [id, option] of Object.entries({ "ability-0": "力量", "ability-1": "敏捷", "ability-2": "體質", feat: "魔法學徒", "skill-0": "運動", "skill-1": "隱匿", tool: "里拉琴" })) {
        await page.locator(`#custom-background-${id}`).selectOption(option);
      }
    };
    await chooseAsPlayer("custom");
    await dialog.waitFor();
    assert.equal(await value("background"), "soldier", "the select waits for the dialog");
    assert.equal(await record("soldier"), null, "opening the dialog does not count as leaving");
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    assert.equal(await value("background"), "soldier", "cancelling returns to soldier");
    assert.equal(await value("tool-proficiency-0"), "紙牌", "cancelling keeps the tool");
    assert.equal(await record("soldier"), null, "cancelling does not write the memory");
    await chooseAsPlayer("custom");
    await dialog.waitFor();
    await fillCustomForm();
    await dialog.getByRole("button", { name: "儲存背景" }).click();
    await dialog.waitFor({ state: "detached" });
    assert.equal(await value("background"), "custom");
    assert.equal((await record("soldier")).tool, "紙牌", "saving the dialog leaves soldier as a player change");
    assert.equal(await value("tool-proficiency-0"), "里拉琴");
    await pick({ class: "wizard" });
    await pick(sageSpells);
    await setFree(true);
    await page.locator("#custom-background-edit").click();
    await dialog.waitFor();
    await dialog.getByRole("button", { name: "儲存背景" }).click();
    await dialog.waitFor({ state: "detached" });
    assert.deepEqual(await magic(), { class: "wizard", ...sageSpells }, "editing in place keeps the custom background's spells");
    assert.equal(await free(), true);
    await chooseAsPlayer("soldier");
    assert.equal(await value("tool-proficiency-0"), "紙牌", "soldier's tool comes back after the custom background");
    assert.deepEqual((await record("custom")).magic[`${MAGIC}class`], "wizard");
    await chooseAsPlayer("custom");
    assert.equal(await page.locator('.app-dialog[data-variant="custom-background"]').count(), 0, "a saved custom background opens no dialog");
    assert.deepEqual(await magic(), { class: "wizard", ...sageSpells }, "the custom background's class and spells are restored");
    assert.equal(await free(), true);
    await page.locator("#custom-background-edit").click();
    await dialog.waitFor();
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    assert.equal(await value("background"), "custom", "cancelling an edit stays on the custom background");
    assert.deepEqual(await magic(), { class: "wizard", ...sageSpells }, "cancelling an edit keeps the spells");
    console.log("Background choice memory: tools and conflicts, Magic Initiate spells, free uses, unchanged numbers and saved data, gates, clearing, manual spell and feat modes and custom background flows passed.");
  } finally { await page.close(); }
}

// A player's background change ticks that background's skills, and only ever takes back what it ticked itself.
async function verifyBackgroundSkillAutoTick(browser, url) {
  const page = await newUiPage(browser, { viewport: { width: 1280, height: 900 } });
  const TOGGLE = "auto-calculate-key-stats-toggle";
  const base = { __spellManagement: { version: 2, manual: false, entries: [] }, __autoCalculatedChecks: true, [TOGGLE]: true,
    class: "fighter", level: "3", race: "human", background: "", str: "16", dex: "14", con: "14", int: "10", wis: "12", cha: "10" };
  const load = async (state = {}) => page.evaluate(({ base, state }) => {
    const cleared = Object.fromEntries(Object.keys(CharacterSkillAbilities).flatMap(skill => [[`prof-${skill}`, false], [`exp-${skill}`, false]]));
    applyStateObject({ ...base, ...cleared, ...state });
  }, { base, state });
  const choose = next => chooseSelectAsPlayer(page, "background", next);
  const synthetic = next => page.evaluate(next => {
    const select = document.getElementById("background");
    select.value = next;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }, next);
  // Only the marked skills: { 運動: "●", 隱匿: "◆" }; a skill with both boxes ticked would show as "both".
  const ranks = () => page.evaluate(() => Object.fromEntries(Object.keys(CharacterSkillAbilities).map(skill => {
    const proficient = document.getElementById(`prof-${skill}`).checked, expert = document.getElementById(`exp-${skill}`).checked;
    return [skill, proficient && expert ? "both" : expert ? "◆" : proficient ? "●" : ""];
  }).filter(([, rank]) => rank)));
  // Every tick and number on the skills tab, plus what is derived from them elsewhere.
  const sheet = () => page.evaluate(() => ({
    fields: Array.from(document.querySelectorAll("#tab-skills input"), input => input.type === "checkbox" ? input.checked : input.value),
    passive: document.getElementById("passive-perception").value, initiative: document.getElementById("initiative-input").value
  }));
  const number = skill => page.evaluate(skill => document.getElementById(`skill-${skill}`).value, skill);
  // The toggle area cycles ○ → ● → ◆ → ○ with real clicks, as a player would.
  const cycle = async skill => {
    await page.evaluate(() => showTab("skills"));
    await page.locator(`.skill-rank-controls:has(#prof-${skill})`).click();
  };
  const record = id => page.evaluate(id => ClassOptionMemory.getBackgroundChoices(id), id);
  const dialog = page.locator('.app-dialog[data-variant="custom-background"]');
  const setCustomSkills = async skills => {
    for (const [index, skill] of skills.entries()) await page.locator(`#custom-background-skill-${index}`).selectOption(skill);
  };
  const saveCustomDialog = async () => {
    await dialog.getByRole("button", { name: "儲存背景" }).click();
    await dialog.waitFor({ state: "detached" });
  };
  const createCustom = async skills => {
    await choose("custom");
    await dialog.waitFor();
    await page.locator("#custom-background-name").fill("學徒");
    await page.locator("#custom-background-equipment-a").fill("長棍");
    for (const [id, option] of Object.entries({ "ability-0": "力量", "ability-1": "敏捷", "ability-2": "體質", feat: "警覺", tool: "里拉琴" })) {
      await page.locator(`#custom-background-${id}`).selectOption(option);
    }
    await setCustomSkills(skills);
    await saveCustomDialog();
  };
  const editCustom = async skills => {
    await page.evaluate(() => showTab("basic"));
    await page.locator("#custom-background-edit").click();
    await dialog.waitFor();
    await setCustomSkills(skills);
    await saveCustomDialog();
  };
  const dismissStartup = () => page.evaluate(() => { document.getElementById("legal-close-btn")?.click(); window.onboardingTour?.finish?.(); });
  try {
    await page.addInitScript(() => { try { localStorage.setItem("dnd.classFeaturePromptDisabled.v1", "true"); } catch {} });
    await page.goto(url);
    await page.waitForFunction(() => window.ClassOptionMemory && window.TabletopMode);
    await dismissStartup();

    // No background to soldier: ticks, numbers, bold names, autosave and tabletop all follow.
    await load();
    assert.deepEqual(await ranks(), {});
    assert.equal(await number("運動"), "+3");
    await choose("soldier");
    assert.deepEqual(await ranks(), { 運動: "●", 威嚇: "●" }, "soldier's skills are ticked");
    assert.equal(await number("運動"), "+5", "the skill number includes the proficiency bonus");
    assert.equal(await number("威嚇"), "+2");
    assert.notEqual(...await page.evaluate(() => ["運動", "察覺"].map(skill => getComputedStyle(document.querySelector(`.skill-cell:has(#prof-${skill}) .skill-name`)).fontWeight)), "a ticked skill's name turns bold");
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("dndchar_autosave_v1") || "{}")["prof-威嚇"] === true);
    await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("skills"); });
    await page.waitForFunction(() => document.querySelectorAll('#tabletop-skill-values [data-skill-rank="proficient"]').length === 2);
    assert.deepEqual(await page.evaluate(() => Array.from(document.querySelectorAll('#tabletop-skill-values [data-skill-rank="proficient"] .tabletop-skill-value__label'), label => label.textContent.trim()).sort()), ["威嚇", "運動"].sort(), "tabletop mode shows the new ranks");
    await page.evaluate(() => TabletopMode.setMode("sheet"));
    await choose("");
    assert.deepEqual(await ranks(), { 運動: "●", 威嚇: "●" }, "choosing no background does not touch anything");

    // Soldier to criminal and back ends exactly where it started.
    await load();
    await choose("soldier");
    const soldierSheet = await sheet();
    await choose("criminal");
    assert.deepEqual(await ranks(), { 巧手: "●", 隱匿: "●" }, "leaving takes soldier's ticks back and criminal's are added");
    assert.equal(await number("運動"), "+3");
    await choose("soldier");
    assert.deepEqual(await sheet(), soldierSheet, "a round trip restores every tick and number");

    // Shared skills: acolyte and seeker both grant religion.
    await load();
    await choose("acolyte");
    assert.deepEqual(await ranks(), { 洞悉: "●", 宗教: "●" });
    const acolyteSheet = await sheet();
    await choose("seeker");
    assert.deepEqual(await ranks(), { 宗教: "●", 醫藥: "●" }, "the shared skill stays ticked by the new background");
    await choose("criminal");
    assert.deepEqual(await ranks(), { 巧手: "●", 隱匿: "●" }, "and is taken back when seeker is left too");
    await choose("acolyte");
    assert.deepEqual(await sheet(), acolyteSheet);
    await load({ "prof-宗教": true });
    await choose("acolyte");
    await choose("seeker");
    await choose("criminal");
    assert.deepEqual(await ranks(), { 巧手: "●", 隱匿: "●", 宗教: "●" }, "a shared skill the player ticked first is never taken back");

    // A skill ticked beforehand (say, for the class) belongs to the player.
    await load({ "prof-運動": true });
    await choose("soldier");
    assert.deepEqual(await ranks(), { 運動: "●", 威嚇: "●" });
    await choose("criminal");
    assert.deepEqual(await ranks(), { 運動: "●", 巧手: "●", 隱匿: "●" }, "athletics stays, intimidation goes");

    // Unticking a background skill sticks across round trips.
    await load();
    await choose("soldier");
    await cycle("威嚇");
    assert.deepEqual(await ranks(), { 運動: "●" }, "a fighter's skill only toggles ○ and ●");
    const untickedSheet = await sheet();
    await choose("criminal");
    assert.deepEqual(await record("soldier").then(item => item.skillsDeclined), ["威嚇"], "leaving records what the player does not want");
    await choose("soldier");
    assert.deepEqual(await sheet(), untickedSheet, "the unticked skill is not ticked again");
    // Ticking it again makes it the player's own, and the refusal is forgotten on leaving.
    await cycle("威嚇");
    await choose("criminal");
    assert.deepEqual(await ranks(), { 威嚇: "●", 巧手: "●", 隱匿: "●" }, "a skill the player ticks by hand is not taken back");
    assert.deepEqual(await record("soldier").then(item => item.skillsDeclined), []);
    await load();
    await choose("soldier");
    await cycle("運動");
    await cycle("運動");
    await choose("criminal");
    assert.deepEqual(await ranks(), { 運動: "●", 巧手: "●", 隱匿: "●" }, "unticking and re-ticking a granted skill hands it over to the player");

    // Old saves: loading changes nothing and leaving removes nothing.
    await load({ background: "soldier" });
    assert.deepEqual(await ranks(), {}, "loading an old save does not tick");
    const legacySheet = await sheet();
    await choose("criminal");
    assert.deepEqual(await ranks(), { 巧手: "●", 隱匿: "●" });
    await choose("soldier");
    assert.deepEqual(await sheet(), legacySheet, "an old save without the ticks is unchanged after a round trip");
    await load({ background: "soldier", "prof-運動": true, "prof-威嚇": true, "prof-察覺": true });
    await choose("criminal");
    assert.deepEqual(await ranks(), { 運動: "●", 威嚇: "●", 察覺: "●", 巧手: "●", 隱匿: "●" }, "leaving a loaded background removes nothing");

    // Expertise is never touched and never sits next to proficiency.
    await load({ class: "rogue", "exp-隱匿": true });
    await choose("criminal");
    assert.deepEqual(await ranks(), { 隱匿: "◆", 巧手: "●" }, "an expert skill is skipped");
    await cycle("巧手");
    assert.deepEqual(await ranks(), { 隱匿: "◆", 巧手: "◆" }, "a granted skill can be raised to expertise");
    const expertSheet = await sheet();
    await choose("soldier");
    assert.deepEqual(await ranks(), { 隱匿: "◆", 巧手: "◆", 運動: "●", 威嚇: "●" }, "leaving does not touch expertise");
    await choose("criminal");
    assert.deepEqual(await sheet(), expertSheet, "and returning does not add a second mark");

    // Accepted limitation, measured: four steps can leave an expertise with no proficiency source.
    await load({ class: "rogue" });
    await choose("criminal");
    await cycle("巧手");
    await chooseSelectAsPlayer(page, "class", "fighter");
    assert.equal((await ranks()).巧手, "●", "losing the class's expertise falls back to proficiency");
    await choose("soldier");
    assert.equal((await ranks()).巧手, undefined, "the fallen-back skill is still the background's, so it is taken back");
    await chooseSelectAsPlayer(page, "class", "rogue");
    assert.equal((await ranks()).巧手, "◆", "known limitation: the class's expertise memory brings it back");

    // No background in between: not a departure until a real background is chosen.
    await load();
    await choose("soldier");
    const beforeBlank = await sheet();
    await choose("");
    assert.deepEqual(await sheet(), beforeBlank);
    await choose("soldier");
    assert.deepEqual(await sheet(), beforeBlank, "soldier, none, soldier changes nothing");
    await choose("");
    await choose("criminal");
    assert.deepEqual(await ranks(), { 巧手: "●", 隱匿: "●" }, "soldier, none, criminal takes soldier's ticks back");

    // Reloading forgets the list, so leaving removes nothing; the ticks came from the save.
    await load();
    await choose("soldier");
    await page.evaluate(() => saveAllFields());
    await page.reload();
    await page.waitForFunction(() => window.ClassOptionMemory && window.TabletopMode);
    await dismissStartup();
    assert.deepEqual(await ranks(), { 運動: "●", 威嚇: "●" }, "autosave restores the ticks");
    await choose("criminal");
    assert.deepEqual(await ranks(), { 運動: "●", 威嚇: "●", 巧手: "●", 隱匿: "●" }, "after a reload the old background's skills stay");

    // Loading another character clears the list and the refusals.
    await load();
    await choose("soldier");
    await cycle("威嚇");
    await choose("criminal");
    assert.deepEqual(await record("soldier").then(item => item.skillsDeclined), ["威嚇"]);
    await load({ background: "criminal", "prof-巧手": true });
    assert.equal(await record("soldier"), null, "loading a character clears the memory");
    await choose("soldier");
    assert.deepEqual(await ranks(), { 巧手: "●", 運動: "●", 威嚇: "●" }, "the previous character's refusal and list are gone");

    // Custom background: creating, editing in place, cancelling and a round trip.
    await load({ background: "soldier", "prof-歷史": true });
    await choose("custom");
    await dialog.waitFor();
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    assert.deepEqual(await ranks(), { 歷史: "●" }, "cancelling the dialog changes nothing");
    assert.equal(await record("soldier"), null);
    await createCustom(["運動", "歷史"]);
    assert.deepEqual(await ranks(), { 運動: "●", 歷史: "●" }, "saving the dialog is a player change");
    await editCustom(["運動", "察覺"]);
    assert.deepEqual(await ranks(), { 運動: "●", 歷史: "●", 察覺: "●" }, "an in-place edit keeps the player's skill and adds the new one");
    assert.equal(await page.evaluate(() => document.getElementById("passive-perception").value), "13", "passive perception follows");
    await editCustom(["隱匿", "察覺"]);
    assert.deepEqual(await ranks(), { 歷史: "●", 察覺: "●", 隱匿: "●" }, "an in-place edit takes back the skill it no longer grants");
    assert.equal(await number("運動"), "+3");
    await page.evaluate(() => showTab("basic"));
    const customSheet = await sheet();
    await page.locator("#custom-background-edit").click();
    await dialog.waitFor();
    await setCustomSkills(["運動", "威嚇"]);
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    assert.deepEqual(await sheet(), customSheet, "cancelling an edit changes nothing");
    await editCustom(["隱匿", "察覺"]);
    assert.deepEqual(await sheet(), customSheet, "saving an edit with the same skills changes nothing");
    await choose("soldier");
    assert.deepEqual(await ranks(), { 歷史: "●" }, "the save never had soldier's skills, so returning to it does not add them");
    await choose("custom");
    assert.deepEqual(await sheet(), customSheet, "a round trip through soldier restores the custom background's ticks");
    await cycle("察覺");
    await editCustom(["察覺", "威嚇"]);
    assert.deepEqual(await ranks(), { 歷史: "●", 威嚇: "●" }, "a skill unticked by the player stays unticked through an edit");

    // Automatic calculation off: the ticks move, the typed numbers do not.
    await load();
    await page.evaluate(TOGGLE => document.getElementById(TOGGLE).click(), TOGGLE);
    assert.equal(await page.evaluate(TOGGLE => document.getElementById(TOGGLE).checked, TOGGLE), false);
    await page.evaluate(() => { const input = document.getElementById("skill-運動"); input.value = "+9"; input.dispatchEvent(new Event("change", { bubbles: true })); });
    await choose("soldier");
    assert.deepEqual(await ranks(), { 運動: "●", 威嚇: "●" }, "ticks update with automatic calculation off");
    assert.equal(await number("運動"), "+9", "typed numbers stay");
    await choose("criminal");
    assert.deepEqual(await ranks(), { 巧手: "●", 隱匿: "●" });
    assert.equal(await number("運動"), "+9");
    await page.evaluate(TOGGLE => document.getElementById(TOGGLE).click(), TOGGLE);
    await page.locator(".app-dialog").getByRole("button", { name: "開啟並更新" }).click();

    // Nothing but a player's change moves a tick.
    await load();
    await synthetic("soldier");
    assert.deepEqual(await ranks(), {}, "a synthetic change does not tick");
    await load();
    await choose("acolyte");
    await synthetic("soldier");
    assert.deepEqual(await ranks(), { 洞悉: "●", 宗教: "●" }, "a synthetic change does not take back");
    await choose("criminal");
    assert.deepEqual(await ranks(), { 洞悉: "●", 宗教: "●", 巧手: "●", 隱匿: "●" }, "a synthetic change counts like a load: nothing is taken back afterwards");
    await page.evaluate(() => { window.playerBackgroundChanges = 0; document.getElementById("background").addEventListener("change", event => { if (isCommittedCharacterSelectionChange(event)) window.playerBackgroundChanges += 1; }); });
    for (const [gate, open, close] of [
      ["share mode", () => { SHARE_MODE = true; window.SHARE_MODE = true; }, () => { SHARE_MODE = false; window.SHARE_MODE = false; }],
      ["JSON import", () => { jsonImportInProgress = true; }, () => { jsonImportInProgress = false; }],
      ["tour preview", () => { autosaveSuspended = true; }, () => { autosaveSuspended = false; }],
      ["clearing", () => { autosaveClearing = true; }, () => { autosaveClearing = false; }]
    ]) {
      // The browser only fires a keyboard change when the choice differs from its last keyboard choice.
      await choose("fieldhand");
      await load({ "prof-歷史": true });
      const changes = await page.evaluate(() => window.playerBackgroundChanges);
      await page.evaluate(open);
      await choose("soldier");
      await page.evaluate(close);
      assert.equal(await page.evaluate(() => window.playerBackgroundChanges), changes + 1, `${gate}: the player's change did fire`);
      assert.deepEqual(await ranks(), { 歷史: "●" }, `${gate} does not tick`);
    }

    // The character features dialog's picker is a player change too.
    await load();
    await page.evaluate(() => openCharacterFeatures("background"));
    await page.locator('#character-features-picker [data-feature-picker="background"] [data-picker-value="soldier"]').click();
    assert.deepEqual(await ranks(), { 運動: "●", 威嚇: "●" }, "the picker ticks");
    assert.equal(await number("運動"), "+5");
    await page.locator('#character-features-picker [data-feature-picker="background"] [data-picker-value="criminal"]').click();
    assert.deepEqual(await ranks(), { 巧手: "●", 隱匿: "●" }, "and takes back");
    await page.keyboard.press("Escape");

    // No new saved fields: only prof-* values change, and the lists stay in page memory.
    await load({ background: "soldier", "prof-歷史": true });
    const stateKeys = await page.evaluate(() => Object.keys(collectStateObject()).sort());
    const shareKeys = await page.evaluate(() => Object.keys(collectShareState()).filter(key => !key.startsWith("prof-")).sort());
    const storageKeys = await page.evaluate(() => { showTab("basic"); saveAllFields(); return Object.keys(localStorage).sort(); });
    await choose("criminal");
    await cycle("巧手");
    await choose("soldier");
    await cycle("威嚇");
    assert.deepEqual(await ranks(), { 歷史: "●", 威嚇: "●" });
    assert.deepEqual(await page.evaluate(() => Object.keys(collectStateObject()).sort()), stateKeys, "autosave and JSON have no new fields");
    assert.deepEqual(await page.evaluate(() => Object.keys(collectShareState()).filter(key => !key.startsWith("prof-")).sort()), shareKeys, "share has no new fields");
    assert.deepEqual(await page.evaluate(() => { showTab("basic"); saveAllFields(); return Object.keys(localStorage).sort(); }), storageKeys, "no new storage key");
    const saved = await page.evaluate(() => ({ state: JSON.stringify(collectStateObject()), share: JSON.stringify(collectShareState()), storage: JSON.stringify(localStorage) }));
    assert.ok(!Object.values(saved).some(text => text.includes("skillsDeclined") || text.includes("granted")), "the lists are not saved anywhere");
    for (const [name, restored] of Object.entries({ JSON: JSON.parse(saved.state), share: JSON.parse(saved.share), autosave: JSON.parse(JSON.parse(saved.storage).dndchar_autosave_v1) })) {
      const before = await ranks();
      await load();
      await page.evaluate(state => applyStateObject(state), restored);
      assert.deepEqual(await ranks(), before, `${name} restores the ranks`);
    }
    // A real share link restores the ranks, locks the select and adds nothing.
    await load({ background: "soldier", "prof-歷史": true });
    const shareHash = await page.evaluate(() => encodeStateToHash(collectShareState()));
    const shared = await newUiPage(browser, { viewport: { width: 1280, height: 900 } });
    try {
      await shared.goto(url + shareHash);
      await shared.locator("#legal-close-btn").click();
      assert.equal(await shared.locator("#background").isDisabled(), true, "share mode locks the background");
      assert.equal(await shared.evaluate(() => document.getElementById("prof-歷史").checked && !document.getElementById("prof-運動").checked && !document.getElementById("prof-威嚇").checked), true, "share mode keeps the shared ranks");
    } finally { await shared.close(); }
    console.log("Background skill auto-tick: player changes, round trips, shared skills, player ticks, refusals, old saves, expertise and its known limit, no background, reload, loading, custom background, automatic calculation off, gates, picker and saved fields passed.");
  } finally { await page.close(); }
}

// Public content has one subclass per class; this fixture serves the private data file with a second cleric subclass.
function createSubclassFixture() {
  const { loadContent } = require("./tools/class-content/load");
  const { renderPrivateData } = require("./tools/class-content/site-data");
  const { classes } = loadContent({ packs: ["srd"] });
  classes.get("cleric").subclasses.push({ id: "test", class: "cleric", name: "測試領域", shortName: "測試", pack: "test", file: "test", features: [
    { id: "cleric-test-domain-spells", level: 3, name: "測試領域法術", spells: [{ id: "shield" }, { id: "misty-step", level: 5 }], text: "測試領域：始終準備護盾術。\n" },
    { id: "cleric-test-choice", level: 3, name: "測試選擇", choose: 1, text: "選擇 1 項。\n",
      options: [{ id: "cleric-test-choice-a", name: "甲", text: "甲。" }, { id: "cleric-test-choice-b", name: "乙", text: "乙。" }] }
  ] });
  return renderPrivateData(classes);
}

async function verifySubclassSelection(browser, url) {
  const fixture = createSubclassFixture();
  const withFixture = async page => page.route("**/class-content.private.generated.js*", route => route.fulfill({ contentType: "text/javascript; charset=utf-8", body: fixture }));
  const blank = { __spellManagement: { version: 2, manual: false, entries: [] }, background: "soldier", race: "human" };
  const open = async (page, target = url) => {
    await page.addInitScript(() => { try { localStorage.setItem("dnd.classFeaturePromptDisabled.v1", "true"); } catch {} });
    await page.goto(target);
    await page.waitForFunction(() => window.SpellManagement && window.TabletopMode);
    await page.evaluate(() => { document.getElementById("legal-close-btn")?.click(); window.onboardingTour?.finish?.(); });
  };
  const state = page => page.evaluate(() => ({
    value: document.getElementById("subclass").value,
    options: Array.from(document.getElementById("subclass").options, option => option.value),
    visible: !document.getElementById("subclass-control").classList.contains("is-hidden"),
    sections: Array.from(document.querySelectorAll("#classFeatures section[data-subclass]"), section => section.dataset.featureId),
    spells: SpellManagement.getEntries().filter(entry => entry.spellSource === "subclass").map(entry => entry.sourceKey)
  }));
  const single = await newUiPage(browser);
  try {
    // One subclass: the select stays hidden and saves the class's default subclass.
    await open(single);
    await single.evaluate(blank => applyStateObject({ ...blank, class: "cleric", level: "3" }), blank);
    const current = await state(single);
    assert.deepEqual([current.value, current.options, current.visible], ["life", ["life"], false], "a single subclass is selected and hidden");
    assert.equal((await single.evaluate(() => collectStateObject())).subclass, "life");
    assert.ok(current.spells.includes("subclass-cleric-生命領域-1-bless-0"), "subclass spells keep their saved source keys");
  } finally { await single.close(); }

  const page = await newUiPage(browser, { viewport: { width: 1280, height: 900 } });
  try {
    await withFixture(page);
    await open(page);
    await page.evaluate(blank => applyStateObject({ ...blank, class: "cleric", level: "2" }), blank);
    assert.equal((await state(page)).visible, false, "the select waits for the subclass level");
    await page.evaluate(blank => applyStateObject({ ...blank, class: "cleric", level: "6" }), blank);
    let current = await state(page);
    assert.deepEqual([current.value, current.options, current.visible], ["life", ["life", "test"], true], "two subclasses show the select with the default first");
    assert.ok(current.sections.includes("cleric-blessed-healer") && !current.sections.includes("cleric-test-choice"));
    await page.locator("#subclass").selectOption("test");
    current = await state(page);
    assert.deepEqual(current.sections, ["cleric-test-domain-spells", "cleric-test-choice"], "the class page shows only the selected subclass");
    assert.deepEqual(current.spells, ["subclass-cleric-測試領域-1-shield-0", "subclass-cleric-測試領域-2-misty-step-1"], "subclass spells follow the selected subclass");
    assert.equal(await page.locator("#classCreationInfo .class-feature-table tbody tr:nth-child(6) td:nth-child(3)").textContent(), "-", "the table drops subclass features the subclass lacks");
    assert.ok(await page.evaluate(() => getClassFeatureChoiceIssues().some(issue => issue.message === "牧師測試選擇尚未選擇。")), "the selected subclass's options are reminded");
    assert.deepEqual(await page.evaluate(() => getClassFeatureRules("cleric").filter(feature => feature.subclass).map(feature => feature.id)),
      ["cleric-test-domain-spells", "cleric-test-choice"], "tabletop and PDF features follow the selected subclass");
    assert.equal(await page.evaluate(() => getSelectedSubclass("cleric").name), "測試領域");

    // Autosave restores the subclass; old data without the field uses the default; an unknown subclass falls back with a warning.
    await page.evaluate(() => saveAllFields());
    await page.reload();
    await page.waitForFunction(() => window.SpellManagement && window.TabletopMode);
    assert.equal((await state(page)).value, "test", "autosave restores the subclass");
    await page.evaluate(() => { const data = collectStateObject(); delete data.subclass; applyStateObject(data); });
    assert.equal((await state(page)).value, "life", "data without a subclass uses the default subclass");
    await page.evaluate(() => applyStateObject({ ...collectStateObject(), subclass: "missing" }));
    assert.equal((await state(page)).value, "life");
    await page.getByText("無法辨識存檔中的子職，已改為「生命領域」。").waitFor();
    await page.evaluate(() => applyStateObject({ ...collectStateObject(), subclass: "test" }));
    assert.equal((await state(page)).value, "test", "JSON data restores the subclass");

    // Share data carries the subclass and locks it like the class.
    const hash = await page.evaluate(async () => encodeStateToHash(collectShareState()));
    const shared = await newUiPage(browser);
    try {
      await withFixture(shared);
      const sharedUrl = new URL(url); sharedUrl.searchParams.set("analytics", "owner"); sharedUrl.hash = hash;
      await open(shared, sharedUrl.href);
      assert.deepEqual(await shared.evaluate(() => [window.SHARE_MODE, document.getElementById("subclass").value, document.getElementById("subclass").disabled]), [true, "test", true], "share restores and locks the subclass");
    } finally { await shared.close(); }
    console.log("Subclass selection: single-subclass default, select visibility, class page/spells/reminders/features, autosave, missing and unknown fields and share lock passed.");
  } finally { await page.close(); }
}

// 第一次開啟（沒有角色存檔）：擲骰開、負重收起，之後記住玩家的選擇；已有存檔的裝置維持原本的狀態。
async function verifyFirstLoadDefaults(browser, url) {
  const state = page => page.evaluate(() => [document.getElementById("dice-system-toggle").checked, document.getElementById("inventory-weight-toggle").getAttribute("aria-pressed")]);
  const context = await browser.newContext();
  const returning = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(url);
    assert.deepEqual(await state(page), [true, "false"], "a new device starts with dice on and the weight bar hidden");
    await page.evaluate(() => {
      document.getElementById("dice-system-toggle").click();
      document.getElementById("inventory-weight-toggle").click();
    });
    await page.reload();
    assert.deepEqual(await state(page), [false, "true"], "the player's own choices survive a reload without an autosave");
    await Promise.all([page.waitForNavigation(), page.evaluate(() => { setTimeout(clearAppStateAndReload, 0); })]);
    assert.deepEqual(await state(page), [false, "true"], "clearing character records keeps both device switches");
    await returning.addInitScript(() => localStorage.setItem("dndchar_autosave_v1", JSON.stringify({ class: "fighter", level: "2" })));
    const existing = await returning.newPage();
    await existing.goto(url);
    assert.deepEqual(await state(existing), [false, "true"], "a device that already has a character keeps its previous defaults");
    assert.deepEqual(await existing.evaluate(() => [localStorage.getItem("dnd.diceSystemEnabled.v1"), localStorage.getItem("dnd.inventoryWeightHidden.v1")]), [null, null], "first-load defaults are not written for existing players");

    // 歡迎視窗的備份提醒只在 Safari 本身出現：其他瀏覽器、iOS 上的 Edge、加到主畫面的 App 與分享模式都不顯示。
    const shareHash = await existing.evaluate(() => encodeStateToHash(collectShareState()));
    const safariAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
    const noteShown = async ({ userAgent, vendor, standalone = false, target = url }) => {
      const visitor = await browser.newContext(userAgent ? { userAgent } : {});
      try {
        if (vendor) await visitor.addInitScript(({ vendor, standalone }) => {
          Object.defineProperty(Navigator.prototype, "vendor", { get: () => vendor });
          Object.defineProperty(Navigator.prototype, "standalone", { get: () => standalone });
        }, { vendor, standalone });
        const visit = await visitor.newPage();
        await visit.goto(target);
        await visit.locator("#legal-ack-btn").waitFor();
        return await visit.locator("#legal-safari-note").isVisible();
      } finally { await visitor.close(); }
    };
    const apple = "Apple Computer, Inc.";
    assert.equal(await page.locator("#legal-safari-note").isHidden(), true, "other browsers never see the Safari backup note");
    assert.equal(await noteShown({ userAgent: safariAgent, vendor: apple }), true, "Safari shows the backup note in the welcome dialog");
    assert.equal(await noteShown({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15", vendor: apple }), true, "desktop Safari shows it too");
    assert.equal(await noteShown({ userAgent: safariAgent.replace("Version/17.5", "Version/17.0 EdgiOS/126.0.2592.56"), vendor: apple }), false, "other iOS browsers are not called Safari");
    assert.equal(await noteShown({ userAgent: safariAgent.replace("Version/17.5", "CriOS/126.0.6478.153"), vendor: apple }), false, "Chrome on iOS does not show it");
    assert.equal(await noteShown({ userAgent: safariAgent, vendor: apple, standalone: true }), false, "a Home Screen web app does not show it");
    assert.equal(await noteShown({ userAgent: safariAgent, vendor: apple, target: `${url}${shareHash}` }), false, "share mode saves nothing, so it has no backup note");
    console.log("First-load defaults: new device, remembered choices, existing players and the Safari-only backup note passed.");
  } finally {
    await context.close();
    await returning.close();
  }
}

// 物品欄（__inventory）經 autosave、JSON 與分享都能完整還原；舊資料把已裝備的物品補進物品欄，不清掉選擇。
async function verifyInventoryPersistence(browser, url) {
  const page = await newUiPage(browser);
  const unsafeName = "<img src=x onerror=__inv=1>";
  const state = { class: "fighter", level: "3", str: "15", mainHand: "長劍", offHand: "盾牌", armor: "鎖子甲", "gear-notes": "自由文字",
    __inventory: { version: 1, items: [
      { uid: "sword", itemId: "長劍", quantity: 1 }, { uid: "shield", itemId: "盾牌", quantity: 1 }, { uid: "mail", itemId: "鎖子甲", quantity: 1 },
      { uid: "pack", itemId: "背包", quantity: 1 }, { uid: "pouch", itemId: "小包", quantity: 1, in: "pack" },
      { uid: "gem", name: unsafeName, quantity: 3, weight: 0.5, desc: "<b>藍寶石</b>\n很亮", in: "pouch" }, { uid: "rope", itemId: "繩索", quantity: 2, in: "pack" },
      { uid: "kit", itemId: "醫療包", quantity: 1, source: "initial" },
      { uid: "scroll", itemId: "法術卷軸", name: "命令術法術卷軸", quantity: 2, spellId: "command" }
    ] } };
  const snapshot = target => target.evaluate(() => ({
    inventory: Inventory.formatText(), entries: Inventory.getState().items.length, weight: Inventory.getWeight().weight,
    desc: Inventory.entries().find(entry => entry.uid === "gem")?.desc,
    scrollSpell: Inventory.entries().find(entry => entry.uid === "scroll")?.spellId,
    slots: ["mainHand", "offHand", "armor"].map(id => document.getElementById(id).value), notes: document.getElementById("gear-notes").value,
    unsafe: Boolean(window.__inv) || Boolean(document.querySelector("#inventory-panel img"))
  }));
  try {
    await page.goto(url);
    await page.waitForFunction(() => window.Inventory && window.InventoryUI);
    await page.evaluate(state => { applyStateObject(state); saveAllFields(); }, state);
    const expected = await snapshot(page);
    assert.equal(expected.inventory, `長劍、盾牌、鎖子甲、背包（小包（${unsafeName} ×3）、繩索 ×2）、醫療包、命令術法術卷軸 ×2`);
    assert.deepEqual(expected.slots, ["長劍", "盾牌", "鎖子甲"]);
    assert.equal(expected.desc, "<b>藍寶石</b>\n很亮", "custom item descriptions are kept as text");
    assert.equal(expected.scrollSpell, "command", "scrolls keep their spell id");
    assert.equal(expected.unsafe, false, "custom item names render as text");
    await page.goto(url);
    assert.deepEqual(await snapshot(page), expected, "autosave restores the inventory and its equipped items");

    const exported = await page.evaluate(() => collectStateObject());
    assert.equal(exported.__inventory.items.length, 9, "JSON export carries the inventory");
    const hash = await page.evaluate(async () => encodeStateToHash(collectShareState()));
    const shared = await newUiPage(browser);
    try {
      const sharedUrl = new URL(url); sharedUrl.searchParams.set("analytics", "owner"); sharedUrl.hash = hash;
      await shared.goto(sharedUrl.href);
      await shared.waitForFunction(() => window.SHARE_MODE === true);
      assert.deepEqual(await snapshot(shared), expected, "share restores the inventory");
    } finally { await shared.close(); }

    // An empty inventory is still shared, so it is not mistaken for legacy data.
    const emptyShare = await page.evaluate(() => { applyStateObject({ class: "monk", level: "1", __inventory: { version: 1, items: [] } }); return collectShareState().__inventory; });
    assert.deepEqual(emptyShare, { version: 1, items: [] });

    // Legacy saves (no __inventory) put the equipped weapons, armor and shield into the inventory and keep the text.
    await page.evaluate(() => dndStorage.setItem("dndchar_autosave_v1", JSON.stringify({ class: "fighter", level: "1", mainHand: "短劍", offHand: "短劍", armor: "皮甲", "gear-notes": "購買物品：繩索" })));
    await page.goto(url);
    assert.deepEqual(await snapshot(page).then(({ inventory, slots, notes }) => ({ inventory, slots, notes })),
      { inventory: "短劍、短劍、皮甲", slots: ["短劍", "短劍", "皮甲"], notes: "購買物品：繩索" }, "legacy autosave seeds the equipped items");
    await page.evaluate(() => applyStateObject({ class: "fighter", level: "1", offHandAsMain: true, main2Shield: true, mainHand: "長劍", offHand: "短劍", "shield-proficiency": true }));
    assert.equal(await page.evaluate(() => Inventory.formatText()), "長劍、短劍、盾牌", "legacy alternate-main shield seeds when equipped");

    // Saves that have an inventory but lack an equipped item get only the missing count; the player's own stack keeps its source.
    await page.evaluate(() => applyStateObject({ class: "fighter", level: "1", mainHand: "短劍", offHand: "短劍", armor: "皮甲", __inventory: { version: 1, items: [{ uid: "own", itemId: "短劍", quantity: 1 }] } }));
    assert.deepEqual(await page.evaluate(() => [Inventory.entries().map(entry => [entry.itemId, entry.quantity, entry.source || ""]),
      ["mainHand", "offHand", "armor"].map(id => document.getElementById(id).selectedOptions[0].textContent)]),
    [[["短劍", 1, ""], ["短劍", 1, ""], ["皮甲", 1, "equipped"]], ["短劍", "短劍", "皮甲"]], "missing equipped items are added on load");

    // Text mode is saved with the character: autosave, JSON and share keep it, and nothing is added to the inventory.
    const textState = { class: "fighter", level: "1", mainHand: "巨劍", "gear-notes": "物品欄：巨劍", __inventory: { version: 1, textOnly: true, items: [] } };
    await page.evaluate(textState => { applyStateObject(textState); saveAllFields(); }, textState);
    await page.goto(url);
    const textSnapshot = target => target.evaluate(() => [Inventory.isTextOnly(), Inventory.entries().length, document.getElementById("mainHand").value,
      document.getElementById("inventory-text-only").getAttribute("aria-pressed"), document.getElementById("inventory-tags").hidden]);
    assert.deepEqual(await textSnapshot(page), [true, 0, "巨劍", "true", true], "autosave keeps text mode without adding the equipped weapon");
    assert.deepEqual(await page.evaluate(() => [collectStateObject().__inventory, collectShareState().__inventory]),
      [{ version: 1, textOnly: true, items: [] }, { version: 1, textOnly: true, items: [] }], "JSON export and share carry text mode");
    const textHash = await page.evaluate(async () => encodeStateToHash(collectShareState()));
    const textShared = await newUiPage(browser);
    try {
      const sharedUrl = new URL(url); sharedUrl.searchParams.set("analytics", "owner"); sharedUrl.hash = textHash;
      await textShared.goto(sharedUrl.href);
      await textShared.waitForFunction(() => window.SHARE_MODE === true);
      assert.deepEqual(await textSnapshot(textShared), [true, 0, "巨劍", "true", true], "share restores text mode");
    } finally { await textShared.close(); }
    // Magic items keep their id and options through autosave, JSON and share; old saves without magic are unaffected.
    const magicState = { class: "fighter", level: "1", mainHand: "", offHand: "", armor: "", __inventory: { version: 1, items: [
      { uid: "plus", itemId: "長劍", quantity: 1, magic: { id: "weapon-plus", bonus: 2 } },
      { uid: "bag", quantity: 1, magic: { id: "bag-of-holding" } },
      { uid: "lost", quantity: 2, magic: { id: "no-such-item", foo: "bar" } },
      { uid: "potion", itemId: "治療藥水", quantity: 1 },
      { uid: "scroll", itemId: "法術卷軸", name: "命令術法術卷軸", quantity: 1 }
    ] } };
    const magicSnapshot = target => target.evaluate(() => ({ state: Inventory.getState().items, text: Inventory.formatText() }));
    const magicExpected = { state: magicState.__inventory.items, text: "長劍+2、次元袋、未知魔法物品 ×2、治療藥水、命令術法術卷軸" };
    await page.evaluate(magicState => { applyStateObject(magicState); saveAllFields(); }, magicState);
    assert.deepEqual(await magicSnapshot(page), magicExpected, "magic items load with the agreed shape");
    await page.goto(url);
    assert.deepEqual(await magicSnapshot(page), magicExpected, "autosave restores magic items");
    assert.deepEqual(await page.evaluate(() => collectStateObject().__inventory.items), magicState.__inventory.items, "JSON export carries magic items");
    await page.evaluate(() => { const data = collectStateObject(); validateCharacterState(data); applyStateObject({ class: "monk", level: "1", __inventory: { version: 1, items: [] } }); applyStateObject(data); });
    assert.deepEqual(await magicSnapshot(page), magicExpected, "JSON import restores magic items");
    const magicHash = await page.evaluate(async () => encodeStateToHash(collectShareState()));
    const magicShared = await newUiPage(browser);
    try {
      const sharedUrl = new URL(url); sharedUrl.searchParams.set("analytics", "owner"); sharedUrl.hash = magicHash;
      await magicShared.goto(sharedUrl.href);
      await magicShared.waitForFunction(() => window.SHARE_MODE === true);
      assert.deepEqual(await magicSnapshot(magicShared), magicExpected, "share restores magic items");
      assert.equal(await magicShared.evaluate(() => { EquipmentShop.open(); return Boolean(document.querySelector(".equipment-shop__magic-toggle")); }), false, "share mode cannot switch to the magic shop");
    } finally { await magicShared.close(); }
    // 魔法物品取得開關：角色欄位，跟著 autosave、JSON、分享走；舊資料沒有這個欄位就是關閉；匯入預檢只收布林值；分享模式只顯示狀態。
    const acquireSnapshot = target => target.evaluate(() => [document.getElementById("magic-item-acquire").checked,
      document.getElementById("inventory-magic-toggle").getAttribute("aria-pressed")]);
    await page.evaluate(() => dndStorage.setItem("dndchar_autosave_v1", JSON.stringify({ class: "fighter", level: "1" })));
    await page.goto(url);
    assert.deepEqual(await acquireSnapshot(page), [false, "false"], "old saves without the field keep the magic item switch off");
    await page.evaluate(() => { applyStateObject({ class: "fighter", level: "1", "magic-item-acquire": true }); saveAllFields(); });
    await page.goto(url);
    assert.deepEqual(await acquireSnapshot(page), [true, "true"], "autosave keeps the magic item switch");
    assert.equal(await page.evaluate(() => collectStateObject()["magic-item-acquire"]), true, "JSON export carries the magic item switch");
    await page.evaluate(() => { const data = collectStateObject(); validateCharacterState(data); applyStateObject({ class: "monk", level: "1", "magic-item-acquire": false }); applyStateObject(data); });
    assert.deepEqual(await acquireSnapshot(page), [true, "true"], "JSON import restores the magic item switch");
    assert.deepEqual(await page.evaluate(() => ["yes", 1, null, {}].map((value) => {
      try { validateCharacterState({ class: "fighter", "magic-item-acquire": value }); return "accepted"; } catch (error) { return error.message; }
    })), Array(4).fill("魔法物品開關格式不正確"), "the import precheck only accepts a boolean switch");
    const acquireHash = await page.evaluate(async () => encodeStateToHash(collectShareState()));
    const offHash = await page.evaluate(async () => {
      const data = collectShareState();
      const off = { ...data };
      delete off["magic-item-acquire"];
      return [Object.hasOwn(data, "magic-item-acquire"), await encodeStateToHash(off)];
    });
    assert.equal(offHash[0], true, "share carries the switch when it is on");
    const acquireShared = await newUiPage(browser);
    try {
      const sharedUrl = new URL(url); sharedUrl.searchParams.set("analytics", "owner"); sharedUrl.hash = acquireHash;
      await acquireShared.goto(sharedUrl.href);
      await acquireShared.waitForFunction(() => window.SHARE_MODE === true);
      assert.deepEqual(await acquireSnapshot(acquireShared), [true, "true"], "share restores the magic item switch");
      await acquireShared.evaluate(() => { showTab("equipment"); document.getElementById("inventory-more").click(); document.getElementById("inventory-magic-toggle").click(); });
      assert.deepEqual([...await acquireSnapshot(acquireShared), await acquireShared.evaluate(() => [document.getElementById("inventory-magic-toggle").getAttribute("aria-disabled"),
        document.getElementById("magic-item-acquire").dataset.shareLocked, Array.from(document.querySelectorAll('[role="alertdialog"]')).some(dialog => dialog.textContent.includes("開啟魔法物品"))])],
      [true, "true", ["true", "true", false]], "share mode shows the switch read-only");
      sharedUrl.hash = offHash[1];
      await acquireShared.goto(sharedUrl.href);
      await acquireShared.reload();
      await acquireShared.waitForFunction(() => window.SHARE_MODE === true);
      assert.deepEqual(await acquireSnapshot(acquireShared), [false, "false"], "a share link with the switch off stays off");
    } finally { await acquireShared.close(); }
    // 昏迷掉落紀錄（跑團狀態 droppedHands）：autosave、JSON、分享都帶；舊資料沒有就是空的；匯入預檢只收四個欄位的物件。
    const dropped = { mainHand: "長劍", offHand: "盾牌", main2Shield: false, main2ShieldItem: "" };
    const droppedState = { class: "fighter", level: "1", hp: "10", mainHand: "", offHand: "", droppedHands: dropped,
      __inventory: { version: 1, items: [{ uid: "sword", itemId: "長劍", quantity: 1 }, { uid: "shield", itemId: "盾牌", quantity: 1 }] } };
    const droppedSnapshot = target => target.evaluate(() => [TabletopMode.collectState().droppedHands || null,
      document.getElementById("tabletop-dropped-hands").hidden, document.getElementById("tabletop-dropped-hands").textContent]);
    const droppedExpected = [dropped, false, "昏迷時掉落：長劍、盾牌撿回不用了"];
    await page.evaluate(() => dndStorage.setItem("dndchar_autosave_v1", JSON.stringify({ class: "fighter", level: "1" })));
    await page.goto(url);
    assert.equal(await page.evaluate(() => Object.hasOwn(TabletopMode.collectState(), "droppedHands")), false, "old saves have no drop record");
    await page.evaluate((state) => { applyStateObject(state); saveAllFields(); }, droppedState);
    await page.goto(url);
    assert.deepEqual(await droppedSnapshot(page), droppedExpected, "autosave keeps the drop record");
    await page.evaluate(() => { const data = collectStateObject(); validateCharacterState(data); applyStateObject({ class: "monk", level: "1", droppedHands: null }); applyStateObject(data); });
    assert.deepEqual(await droppedSnapshot(page), droppedExpected, "JSON import restores the drop record");
    assert.deepEqual(await page.evaluate(() => ["x", [], { mainHand: 1 }, { mainHand: "長".repeat(101) }, { main2Shield: "yes" }, { extra: "" }].map((value) => {
      try { validateCharacterState({ class: "fighter", droppedHands: value }); return "accepted"; } catch (error) { return error.message; }
    })), Array(6).fill("昏迷掉落紀錄格式不正確"), "the import precheck rejects malformed drop records");
    assert.equal(await page.evaluate(() => { validateCharacterState({ class: "fighter", droppedHands: null }); return true; }), true);
    const droppedHash = await page.evaluate(async () => encodeStateToHash(collectShareState()));
    const droppedShared = await newUiPage(browser);
    try {
      const sharedUrl = new URL(url); sharedUrl.searchParams.set("analytics", "owner"); sharedUrl.hash = droppedHash;
      await droppedShared.goto(sharedUrl.href);
      await droppedShared.waitForFunction(() => window.SHARE_MODE === true);
      assert.deepEqual(await droppedSnapshot(droppedShared), droppedExpected, "share restores the drop record");
    } finally { await droppedShared.close(); }
    // 裝備欄位寫魔法款的名稱，經 autosave、JSON、分享都還原，普通與魔法同名時不互換；同調（attuned）與穿戴（worn）一起還原，普通物品的存檔不多欄位。
    // 手持的魔杖放在副手，同樣以名稱還原。
    const equippedState = { class: "fighter", level: "5", str: "16", dex: "14", mainHand: "長劍+2", offHand: "戰法魔杖+1", armor: "", __inventory: { version: 1, items: [
      { uid: "plain", itemId: "長劍", quantity: 1 },
      { uid: "plus", itemId: "長劍", quantity: 1, magic: { id: "weapon-plus", bonus: 2 } },
      { uid: "ring", quantity: 1, magic: { id: "ring-of-protection" }, attuned: true, worn: true },
      { uid: "spare", quantity: 1, magic: { id: "ring-of-protection" } },
      { uid: "wand", quantity: 1, magic: { id: "wand-of-the-war-mage-plus", bonus: 1 } }
    ] } };
    const equippedSnapshot = target => target.evaluate(() => {
      const select = document.getElementById("mainHand");
      return {
        option: select.selectedOptions[0].textContent, off: document.getElementById("offHand").value, state: Inventory.getState().items,
        slots: Inventory.entries().filter(entry => entry.slot).map(entry => entry.uid), hit: document.getElementById("atk-main-hit").value,
        ac: document.getElementById("ac-display").value, equipped: [...document.querySelectorAll('[data-inventory-group="equipped"] .inventory-tag')].map(tag => tag.dataset.inventoryUid)
      };
    });
    const equippedExpected = { option: "長劍+2", off: "戰法魔杖+1", state: equippedState.__inventory.items, slots: ["plus", "wand"], hit: "+8", ac: "13", equipped: ["plus", "wand", "ring"] };
    await page.evaluate(state => { applyStateObject(state); saveAllFields(); }, equippedState);
    assert.deepEqual(await equippedSnapshot(page), equippedExpected, "a magic item equipped next to its plain twin loads as itself");
    await page.goto(url);
    assert.deepEqual(await equippedSnapshot(page), equippedExpected, "autosave restores the equipped magic item and attunement");
    await page.evaluate(() => { const data = collectStateObject(); validateCharacterState(data); applyStateObject({ class: "monk", level: "1", __inventory: { version: 1, items: [] } }); applyStateObject(data); });
    assert.deepEqual(await equippedSnapshot(page), equippedExpected, "JSON restores the equipped magic item and attunement");
    const equippedHash = await page.evaluate(async () => encodeStateToHash(collectShareState()));
    const equippedShared = await newUiPage(browser);
    try {
      const sharedUrl = new URL(url); sharedUrl.searchParams.set("analytics", "owner"); sharedUrl.hash = equippedHash;
      await equippedShared.goto(sharedUrl.href);
      await equippedShared.waitForFunction(() => window.SHARE_MODE === true);
      assert.deepEqual(await equippedSnapshot(equippedShared), equippedExpected, "share restores the equipped magic item and attunement");
      await equippedShared.evaluate(() => InventoryUI.openItemDialog("ring"));
      const sharedRing = equippedShared.locator('.app-dialog[data-variant="inventory-item"]');
      await sharedRing.waitFor();
      assert.equal(await sharedRing.getByRole("button", { name: /同調/u }).count(), 0, "share mode cannot toggle attunement");
      assert.equal(await sharedRing.getByRole("button", { name: /穿上|卸下/u }).count(), 0, "share mode cannot wear or take off rings");
      assert.match(await sharedRing.locator(".inventory-item-actions").innerText(), /穿戴中、同調中/u, "share mode shows the worn state");
    } finally { await equippedShared.close(); }
    // 次數池的剩餘次數（charges）存在那一筆物品上，autosave、JSON、分享都還原；舊資料沒有這個欄位就是滿的。
    // 分享模式可以調整次數（和法術位一樣只在頁面記憶體），看的人的本機存檔不變。
    const chargesState = { class: "fighter", level: "5", mainHand: "", offHand: "", armor: "", __inventory: { version: 1, items: [
      { uid: "wand", quantity: 1, magic: { id: "wand-of-fireballs" }, charges: { charges: 2 } },
      { uid: "rod", itemId: "硬頭錘", quantity: 1, attuned: true, magic: { id: "rod-of-lordly-might" }, charges: { "drain-life": 0, terrify: 0 } },
      { uid: "old", quantity: 1, magic: { id: "wand-of-web" } }
    ] } };
    const chargesSnapshot = target => target.evaluate(() => ["wand", "rod", "old"].map(uid => Inventory.getCharges(Inventory.getEntry(uid)).map(pool => `${pool.id}:${pool.left}/${pool.max}`).join()));
    const chargesExpected = ["charges:2/7", "drain-life:0/1,paralyze:1/1,terrify:0/1", "charges:7/7"];
    await page.evaluate(state => { applyStateObject(state); saveAllFields(); }, chargesState);
    assert.deepEqual(await chargesSnapshot(page), chargesExpected, "charges load on their entries; an entry without charges is full");
    await page.goto(url);
    assert.deepEqual(await chargesSnapshot(page), chargesExpected, "autosave restores remaining charges");
    assert.deepEqual(await page.evaluate(() => collectStateObject().__inventory.items.map(item => item.charges)), chargesState.__inventory.items.map(item => item.charges), "JSON export carries remaining charges");
    await page.evaluate(() => { const data = collectStateObject(); validateCharacterState(data); applyStateObject({ class: "monk", level: "1", __inventory: { version: 1, items: [] } }); applyStateObject(data); });
    assert.deepEqual(await chargesSnapshot(page), chargesExpected, "JSON import restores remaining charges");
    await page.evaluate(() => saveAllFields());
    assert.equal(await page.evaluate(() => { try { validateCharacterState({ class: "fighter", __inventory: { version: 1, items: [{ quantity: 1, magic: { id: "wand-of-web" }, charges: { charges: -1 } }] } }); return "accepted"; } catch (error) { return "rejected"; } }), "rejected", "the import precheck rejects invalid charges");
    const chargesHash = await page.evaluate(async () => encodeStateToHash(collectShareState()));
    const chargesShared = await newUiPage(browser);
    try {
      const sharedUrl = new URL(url); sharedUrl.searchParams.set("analytics", "owner"); sharedUrl.hash = chargesHash;
      await chargesShared.goto(sharedUrl.href);
      await chargesShared.waitForFunction(() => window.SHARE_MODE === true);
      assert.deepEqual(await chargesSnapshot(chargesShared), chargesExpected, "share restores remaining charges");
      await chargesShared.evaluate(() => InventoryUI.openItemDialog("wand"));
      const sharedWand = chargesShared.locator('.app-dialog[data-variant="inventory-item"]');
      await sharedWand.waitFor();
      await sharedWand.getByRole("button", { name: "減少火球魔杖的充能剩餘次數" }).click();
      assert.equal(await chargesShared.evaluate(() => Inventory.getEntry("wand").charges.charges), 1, "share mode can spend charges in page memory");
    } finally { await chargesShared.close(); }
    await page.goto(url);
    assert.deepEqual(await chargesSnapshot(page), chargesExpected, "spending charges on a shared page does not touch the viewer's save");
    // 屬性有效值不存檔：屬性欄存原值，autosave、JSON、分享還原後由物品重新算出。
    const abilityState = { class: "fighter", level: "5", str: "16", dex: "14", con: "12", mainHand: "雷神之錘（戰錘）", offHand: "", armor: "", __inventory: { version: 1, items: [
      { uid: "hammer", itemId: "戰錘", quantity: 1, attuned: true, magic: { id: "hammer-of-thunderbolts" } },
      { uid: "belt", quantity: 1, attuned: true, worn: true, magic: { id: "belt-of-giant-strength", giant: "hill" } },
      { uid: "amulet", quantity: 1, attuned: true, worn: true, magic: { id: "amulet-of-health" } }
    ] } };
    const abilitySnapshot = target => target.evaluate(() => ({
      raw: [document.getElementById("str").value, document.getElementById("con").value, collectStateObject().str, collectStateObject().con],
      shown: [document.querySelector("#str-mod .modifier-main").textContent, document.querySelector("#str-mod .ability-effect-tip").getAttribute("aria-label"), document.querySelector("#con-mod .modifier-main").textContent],
      numbers: [document.getElementById("atk-main-hit").value, getCarryCapacityPounds()]
    }));
    const abilityExpected = {
      raw: ["16", "12", "16", "12"],
      shown: ["+7", "力量有效 25・巨人之力腰帶（山丘）、雷神之錘（戰錘）", "+4"],
      numbers: ["+11", 375]
    };
    await page.evaluate(state => { applyStateObject(state); saveAllFields(); }, abilityState);
    assert.deepEqual(await abilitySnapshot(page), abilityExpected, "magic items raise the effective scores while the fields keep the raw values");
    await page.goto(url);
    assert.deepEqual(await abilitySnapshot(page), abilityExpected, "autosave keeps raw scores and recomputes the effective ones");
    await page.evaluate(() => { const data = collectStateObject(); validateCharacterState(data); applyStateObject({ class: "monk", level: "1", __inventory: { version: 1, items: [] } }); applyStateObject(data); });
    assert.deepEqual(await abilitySnapshot(page), abilityExpected, "JSON keeps raw scores and recomputes the effective ones");
    const abilityHash = await page.evaluate(async () => encodeStateToHash(collectShareState()));
    const abilityShared = await newUiPage(browser);
    try {
      const sharedUrl = new URL(url); sharedUrl.searchParams.set("analytics", "owner"); sharedUrl.hash = abilityHash;
      await abilityShared.goto(sharedUrl.href);
      await abilityShared.waitForFunction(() => window.SHARE_MODE === true);
      assert.deepEqual(await abilitySnapshot(abilityShared), abilityExpected, "share keeps raw scores and recomputes the effective ones");
      // 分享模式的同調視窗只列出目前同調的物品，不能更改。
      await abilityShared.evaluate(() => { showTab("equipment"); document.getElementById("attunement-open").click(); });
      const sharedAttune = abilityShared.locator('.app-dialog[data-variant="attunement"]');
      await sharedAttune.waitFor();
      assert.deepEqual([await sharedAttune.locator("select").count(), await sharedAttune.locator(".attunement-slot").allInnerTexts().then(rows => rows.map(row => row.replace(/\s+/gu, " ")))],
        [0, ["第 1 格 雷神之錘（戰錘）", "第 2 格 巨人之力腰帶（山丘）", "第 3 格 健康護符"]], "share mode lists attuned items read-only");
    } finally { await abilityShared.close(); }
    // 舊資料的裝備欄位是普通品名：普通物品照舊，魔法款不被當成已裝備。
    assert.deepEqual(await page.evaluate(() => {
      applyStateObject({ class: "fighter", level: "1", mainHand: "長劍", __inventory: { version: 1, items: [{ uid: "own", itemId: "長劍", quantity: 1 }, { uid: "plus", itemId: "長劍", quantity: 1, magic: { id: "weapon-plus", bonus: 2 } }] } });
      return { option: document.getElementById("mainHand").selectedOptions[0].textContent, state: Inventory.getState().items };
    }), { option: "長劍", state: [{ uid: "own", itemId: "長劍", quantity: 1 }, { uid: "plus", itemId: "長劍", quantity: 1, magic: { id: "weapon-plus", bonus: 2 } }] }, "saves naming the plain item always wield the plain item");
    assert.deepEqual(await page.evaluate(() => [
      { uid: "a", quantity: 1, magic: { id: "x" }, attuned: true },
      { uid: "a", quantity: 1, magic: { id: "x" }, equippedAs: "mainHand" },
      { uid: "a", quantity: 1, magic: { id: "x" }, attuned: "yes" },
      { uid: "a", quantity: 1, magic: { id: "x" }, worn: true },
      { uid: "a", quantity: 1, magic: { id: "x" }, worn: 1 }
    ].map(entry => isValidInventoryState({ version: 1, items: [entry] }))), [true, false, false, true, false], "the import preflight checks the new fields");
    assert.deepEqual(await page.evaluate(() => {
      Inventory.restore({ version: 1, items: [
        { uid: "a", itemId: "長劍", quantity: 1, equippedAs: "mainHand", attuned: true },
        { uid: "b", quantity: 2, attuned: true, magic: { id: "ring-of-protection" } },
        { uid: "c", itemId: "長劍", quantity: 1, attuned: true, magic: { id: "weapon-plus", bonus: 1 } },
        { uid: "d", itemId: "長劍", quantity: 1, worn: true },
        { uid: "e", quantity: 2, worn: true, magic: { id: "ring-of-protection" } },
        { uid: "f", quantity: 1, worn: true, magic: { id: "stone-of-good-luck" } },
        { uid: "g", quantity: 1, worn: true, magic: { id: "unknown-item" } }
      ] });
      return Inventory.getState().items;
    }), [{ uid: "a", itemId: "長劍", quantity: 1 }, { uid: "b", quantity: 2, magic: { id: "ring-of-protection" } }, { uid: "c", itemId: "長劍", quantity: 1, magic: { id: "weapon-plus", bonus: 1 } },
      { uid: "d", itemId: "長劍", quantity: 1 }, { uid: "e", quantity: 2, magic: { id: "ring-of-protection" } }, { uid: "f", quantity: 1, magic: { id: "stone-of-good-luck" } }, { uid: "g", quantity: 1, worn: true, magic: { id: "unknown-item" } }],
    "plain items, stacks and items that cannot be attuned or worn drop the new fields; unknown magic items keep them");
    console.log("Inventory persistence: autosave, JSON export, share (including empty inventories and text mode), legacy seeding, missing equipped items, descriptions, safe custom names and magic items passed.");
  } finally { await page.close(); }
}

// 職業選擇（內容檔 picks）：武器精通選單的數量、選項與不重複，精通標籤只顯示已選的武器，
// 專精、職業額外語言與武器精通的缺項提醒，以及 autosave、JSON（欄位順序不同）、分享與職業選項記憶的還原。
async function verifyClassPicks(browser, url) {
  // 主手下拉只列物品欄有的武器，精通標籤用到的武器先放進物品欄。
  const blank = { __spellManagement: { version: 2, manual: false, entries: [] }, background: "soldier", race: "human", alignment: "TN",
    __inventory: { version: 1, items: [{ uid: "longsword", itemId: "長劍", quantity: 1 }, { uid: "shortsword", itemId: "短劍", quantity: 1 }] } };
  const open = async (page, target = url) => {
    await page.addInitScript(() => { try { localStorage.setItem("dnd.classFeaturePromptDisabled.v1", "true"); } catch {} });
    await page.goto(target);
    await page.waitForFunction(() => window.SpellManagement && window.TabletopMode);
    await page.evaluate(() => { document.getElementById("legal-close-btn")?.click(); window.onboardingTour?.finish?.(); });
  };
  const slots = page => page.evaluate(() => Array.from(document.querySelectorAll("#classFeatures select[data-class-pick]"), select => ({
    id: select.id, value: select.value, hidden: Boolean(select.closest("[data-class-pick-slot]")?.hidden),
    options: Array.from(select.options, option => option.value).filter(Boolean),
    disabled: Array.from(select.options, option => option.disabled ? option.value : "").filter(Boolean)
  })));
  const issues = page => page.evaluate(() => getClassFeatureChoiceIssues().map(issue => issue.message));
  // 職業頁在角色能力視窗內（未開啟時隱藏），以 change 事件選取，同玩家操作選單。
  const choose = (page, id, value) => page.evaluate(([id, value]) => {
    const select = document.getElementById(id);
    if (!Array.from(select.options).some(option => option.value === value && !option.disabled)) throw new Error(`${id} cannot select ${value}`);
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }, [id, value]);
  const badge = (page, weapon) => page.evaluate(weapon => {
    const select = document.getElementById("mainHand");
    select.value = weapon;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    updateWeaponMasteryBadges();
    const element = document.getElementById("atk-main-mastery");
    return element.hidden ? "" : element.textContent;
  }, weapon);
  const page = await newUiPage(browser, { viewport: { width: 1280, height: 900 } });
  try {
    await open(page);
    await page.evaluate(blank => applyStateObject({ ...blank, class: "fighter", level: "1" }), blank);
    let current = await slots(page);
    assert.deepEqual(current.map(slot => [slot.id, slot.hidden]), [
      ["fighter-weapon-mastery-pick-1", false], ["fighter-weapon-mastery-pick-2", false], ["fighter-weapon-mastery-pick-3", false], ["fighter-weapon-mastery-pick-4", true]
    ], "fighter shows three mastery selects at level 1");
    assert.ok(["長劍", "巨劍", "短弓", "鞭"].every(name => current[0].options.includes(name)) && !current[0].options.includes("武藝"), "fighter can choose proficient weapons with masteries");
    assert.ok((await issues(page)).includes("戰士武器精通尚未選完（0/3）。"), "missing masteries are reminded");
    assert.equal(await badge(page, "長劍"), "削弱", "without any chosen mastery every proficient weapon keeps its badge");
    await choose(page, "fighter-weapon-mastery-pick-1", "長劍");
    await choose(page, "fighter-weapon-mastery-pick-2", "巨劍");
    current = await slots(page);
    assert.ok(current[1].disabled.includes("長劍") && current[0].disabled.includes("巨劍"), "a weapon chosen in one select is disabled in the others");
    assert.ok((await issues(page)).includes("戰士武器精通尚未選完（2/3）。"));
    assert.equal(await badge(page, "長劍"), "削弱", "a chosen weapon shows its mastery badge");
    assert.equal(await badge(page, "短劍"), "", "an unchosen weapon hides the badge once masteries are chosen");
    await choose(page, "fighter-weapon-mastery-pick-3", "長弓");
    assert.ok(!(await issues(page)).some(message => message.includes("武器精通")), "the reminder clears when every mastery is chosen");

    // 關閉武器攻擊自動化時，精通標籤仍看裝備下拉，條件相同；下拉空白才退回手打的攻擊名稱。
    const manualBadge = (weapon, typed) => page.evaluate(([weapon, typed]) => {
      const select = document.getElementById("mainHand");
      select.value = weapon;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      document.getElementById("atk-main-name").value = typed;
      updateWeaponMasteryBadges();
      const element = document.getElementById("atk-main-mastery");
      return element.hidden ? "" : element.textContent;
    }, [weapon, typed]);
    await page.evaluate(() => { const toggle = document.getElementById("weapon-attack-automation"); toggle.checked = false; toggle.dispatchEvent(new Event("change", { bubbles: true })); });
    assert.deepEqual([await manualBadge("長劍", "短劍"), await manualBadge("短劍", "長劍"), await manualBadge("", "長劍"), await manualBadge("", "短劍")], ["削弱", "", "削弱", ""],
      "with automation off the mastery badge follows the equipped weapon and falls back to the typed name only when nothing is equipped");
    await page.evaluate(() => { const toggle = document.getElementById("weapon-attack-automation"); toggle.checked = true; toggle.dispatchEvent(new Event("change", { bubbles: true })); });

    // Level 4 opens the fourth select; going back hides it but keeps its value.
    await page.locator("#level").selectOption("4");
    await choose(page, "fighter-weapon-mastery-pick-4", "戰錘");
    await page.locator("#level").selectOption("1");
    current = await slots(page);
    assert.deepEqual(current.map(slot => [slot.value, slot.hidden]), [["長劍", false], ["巨劍", false], ["長弓", false], ["戰錘", true]], "a higher-level mastery stays saved while hidden");

    // Autosave, JSON with the class after the selects, and share restore the choices.
    await page.evaluate(() => saveAllFields());
    await page.reload();
    await page.waitForFunction(() => window.SpellManagement && window.TabletopMode);
    assert.deepEqual((await slots(page)).map(slot => slot.value), ["長劍", "巨劍", "長弓", "戰錘"], "autosave restores masteries");
    await page.evaluate(blank => {
      const data = collectStateObject();
      const picks = Object.fromEntries(Object.entries(data).filter(([id]) => id.startsWith("fighter-weapon-mastery-pick-")));
      applyStateObject({ ...blank, class: "wizard", level: "1" });
      applyStateObject({ ...picks, ...blank, level: "4", class: "fighter" });
    }, blank);
    assert.deepEqual((await slots(page)).map(slot => [slot.value, slot.hidden]), [["長劍", false], ["巨劍", false], ["長弓", false], ["戰錘", false]], "JSON restores masteries regardless of field order");
    const hash = await page.evaluate(async () => encodeStateToHash(collectShareState()));
    const shared = await newUiPage(browser);
    try {
      const sharedUrl = new URL(url); sharedUrl.searchParams.set("analytics", "owner"); sharedUrl.hash = hash;
      await open(shared, sharedUrl.href);
      assert.deepEqual(await shared.evaluate(() => [window.SHARE_MODE, ...Array.from(document.querySelectorAll("#classFeatures select[data-class-pick]"), select => select.value)]),
        [true, "長劍", "巨劍", "長弓", "戰錘"], "share restores masteries");
    } finally { await shared.close(); }

    // Rogue: finesse or light martial weapons, expertise and extra language reminders.
    await page.evaluate(blank => applyStateObject({ ...blank, class: "rogue", level: "1" }), blank);
    current = await slots(page);
    assert.deepEqual(current.map(slot => slot.id), ["rogue-weapon-mastery-pick-1", "rogue-weapon-mastery-pick-2"]);
    assert.ok(["匕首", "刺劍", "鞭", "手弩"].every(name => current[0].options.includes(name)) && !current[0].options.includes("長劍"), "rogue chooses among its proficient weapons");
    let messages = await issues(page);
    assert.ok(messages.includes("盜賊專精尚未選完（0/2）。") && messages.includes("盜賊額外語言尚未選擇。"), "rogue expertise and language are reminded");
    // 「前往」切到技能頁並高亮整個框：專精是技能加值區，額外語言是語言區。
    for (const [label, box, focus] of [["盜賊專精", "#skill-bonus-section", ".circle-checkbox:not(:checked)"], ["盜賊額外語言", "#tab-skills .language-card", "#language-extra-2"]]) {
      await page.evaluate(label => Array.from(document.querySelectorAll("#class-feature-choice-reminder button"))
        .find(button => button.textContent.includes(label)).click(), label);
      await page.waitForFunction(() => document.querySelector(".onboarding-jump-target"));
      const jumped = await page.evaluate(([box, focus]) => {
        const target = document.querySelector(".onboarding-jump-target");
        const rect = target.getBoundingClientRect();
        return { skillsTab: !document.getElementById("tab-skills").hidden, box: target === document.querySelector(box), inView: rect.top < innerHeight && rect.bottom > 0, focused: document.activeElement.matches(focus) };
      }, [box, focus]);
      assert.deepEqual(jumped, { skillsTab: true, box: true, inView: true, focused: true }, `${label} jumps to its box on the skills tab and focuses the open choice`);
      await page.evaluate(() => {
        document.querySelectorAll(".onboarding-jump-target").forEach(element => element.classList.remove("onboarding-jump-target"));
        showTab("basic");
      });
    }
    await page.evaluate(() => ["隱匿", "巧手"].forEach(skill => {
      const checkbox = document.getElementById(`exp-${skill}`);
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    }));
    await choose(page, "language-extra-2", "elvish");
    messages = await issues(page);
    assert.ok(!messages.some(message => message.startsWith("盜賊專精") || message.startsWith("盜賊額外語言")), "the reminders clear once chosen");
    await page.evaluate(blank => applyStateObject({ ...blank, "exp-隱匿": false, "exp-巧手": false, class: "ranger", level: "1" }), blank);
    assert.ok(!(await issues(page)).some(message => message.startsWith("遊俠專精") || message.startsWith("遊俠額外語言")), "ranger expertise and languages wait for level 2");
    await page.evaluate(blank => applyStateObject({ ...blank, "exp-隱匿": false, "exp-巧手": false, class: "ranger", level: "2" }), blank);
    messages = await issues(page);
    assert.ok(messages.includes("遊俠專精尚未選完（0/1）。") && messages.includes("遊俠額外語言尚未選擇。"), "ranger reminders start at level 2");
    console.log("Class picks: weapon mastery selects/options/badges, level visibility, autosave/JSON/share, expertise and language reminders passed.");
  } finally { await page.close(); }
}

async function verifyFieldInfoHint(browser, url) {
  const KEY = "dnd.fieldInfoHintDismissed.v1";
  const page = await newUiPage(browser, { viewport: { width: 1280, height: 900 } });
  try {
    await page.goto(url);
    const hint = page.locator("#field-info-hint");
    const dismiss = hint.getByRole("button", { name: "我知道了" });
    await hint.waitFor();
    assert.match(await hint.innerText(), /想了解特性內容？點選各欄位旁的\s*i\s*即可查看。/);
    assert.equal(await page.evaluate(key => APP_STORAGE_KEYS.includes(key), KEY), true, "clear records includes the hint dismissal");

    const measure = () => page.evaluate(() => {
      const button = document.querySelector(".field-info-hint__dismiss").getBoundingClientRect();
      const text = document.querySelector("#field-info-hint > span").getBoundingClientRect();
      const box = document.querySelector("#field-info-hint").getBoundingClientRect();
      return { sameLine: button.top < text.bottom && button.bottom > text.top, rightAligned: Math.abs(button.right - (box.right - parseFloat(getComputedStyle(document.querySelector("#field-info-hint")).paddingRight))) < 1,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth };
    });
    let layout = await measure();
    assert.deepEqual(layout, { sameLine: true, rightAligned: true, overflow: false }, "desktop keeps the dismiss link on the same line at the right");
    for (const [width, height] of [[375, 812], [320, 568]]) {
      await page.setViewportSize({ width, height });
      layout = await measure();
      assert.deepEqual([layout.rightAligned, layout.overflow], [true, false], `${width}px keeps the dismiss link right aligned without page overflow`);
    }
    await page.setViewportSize({ width: 1280, height: 900 });

    await dismiss.focus();
    await page.keyboard.press("Enter");
    assert.equal(await hint.isHidden(), true, "dismissing hides the hint");
    assert.equal(await page.evaluate(key => localStorage.getItem(key), KEY), "1");
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.characterFeaturesTab), "creation", "focus moves to the class info button");
    assert.equal(JSON.stringify(await page.evaluate(() => collectStateObject())).includes("fieldInfoHint"), false, "dismissal stays out of character data");

    await page.evaluate(() => { document.getElementById("class").value = "wizard"; saveAllFields(); });
    await page.goto(url);
    await page.waitForFunction(() => document.getElementById("class").value === "wizard");
    await page.waitForLoadState("networkidle");
    assert.equal(await hint.isHidden(), true, "dismissal survives a reload");

    await Promise.all([page.waitForEvent("load"), page.evaluate(() => clearAppStateAndReload())]);
    await hint.waitFor();
    assert.equal(await page.evaluate(key => localStorage.getItem(key), KEY), null, "clear records resets the dismissal");

    const hash = await page.evaluate(() => encodeStateToHash({ class: "wizard", level: "1", race: "human", background: "soldier" }));
    const shared = await newUiPage(browser);
    try {
      const sharedUrl = new URL(url); sharedUrl.hash = hash;
      await shared.goto(sharedUrl.href);
      await shared.locator("#share-mode-tip").waitFor();
      await shared.waitForLoadState("networkidle");
      assert.equal(await shared.locator("#field-info-hint").isHidden(), true, "share viewers never see the hint");
    } finally { await shared.close(); }
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
        assert.match(await shared.locator("#share-mode-tip").innerText(), /分享模式：這是別人分享給你的角色/);
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
        { __inventory: { version: 2, items: [] } }, { __inventory: { version: 1, items: {} } },
        { __inventory: { version: 1, items: Array.from({ length: 301 }, () => ({ itemId: "匕首", quantity: 1 })) } },
        { __inventory: { version: 1, items: [{ itemId: "匕首", quantity: 0 }] } },
        { __inventory: { version: 1, items: [{ itemId: "匕首", quantity: 1.5 }] } },
        { __inventory: { version: 1, items: [{ itemId: "匕首", quantity: 1, onclick: "x" }] } },
        { __inventory: { version: 1, items: [{ itemId: "法術卷軸", quantity: 1, spellId: 7 }] } },
        { __inventory: { version: 1, items: [{ quantity: 1 }] } },
        { __inventory: { version: 1, items: [{ name: "x".repeat(65), quantity: 1 }] } },
        { __inventory: { version: 1, textOnly: "yes", items: [] } }, { __inventory: { version: 1, extra: true, items: [] } },
        { __inventory: { version: 1, items: [{ name: "信", desc: "x".repeat(401), quantity: 1 }] } },
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
    // 分享頁的 dndStorage 只有頁面記憶體，直接核對本機存檔沒被覆蓋。
    assert.equal(await page.evaluate(() => localStorage.getItem("dndchar_autosave_v1")), beforeBadShare);
    console.log("Character input safety: XSS text rendering, JSON/share/autosave, preflight limits, gzip bomb cancellation and rejected-data preservation passed.");
  } finally { await page.close(); }
}

// 分享模式是唯讀角色卡：鎖定與白名單、選單、自動計算與 AC 提示、跑團資料、裝置偏好、換法術與提醒框。
async function verifyShareReadonlyMode(browser, url) {
  const page = await newUiPage(browser, { viewport: { width: 1100, height: 900 }, reducedMotion: "reduce" });
  const abilities = { str: "14", dex: "14", con: "14", int: "14", wis: "14", cha: "14" };
  const items = names => ({ version: 1, items: names.map(itemId => ({ itemId, quantity: 1 })) });
  const character = (cls, level, extra = {}) => ({ class: cls, level: String(level), race: "human", background: "sage", alignment: "LG",
    ...abilities, "spellcasting-ability": "int", __inventory: items(["皮甲", "鎖子甲", "盾牌", "長劍", "短劍"]), __shareStateVersion: 1, ...extra });
  const hashOf = async state => {
    await page.goto(url);
    await page.waitForFunction(() => window.TabletopMode && window.Spellbook);
    return page.evaluate(state => encodeStateToHash(state), state);
  };
  const openHash = async hash => {
    await page.goto("about:blank");
    await page.goto(url + hash);
    await page.waitForFunction(() => document.getElementById("auto-calculate-key-stats-toggle")?.dataset.shareLocked === "true");
    await page.locator("#legal-ack-btn").click();
  };
  const openShare = async state => openHash(await hashOf(state));
  const localSnapshot = () => page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])));
  const props = (id, read) => page.evaluate(([id, read]) => { const el = document.getElementById(id); return read.map(key => el[key]); }, [id, read]);
  const isLocked = id => page.evaluate(id => { const el = document.getElementById(id); return el.inert === true || el.readOnly === true || el.disabled === true; }, id);
  const manual = extra => ({ "auto-calculate-key-stats-toggle": false, [await_mark]: true, ...extra });
  const await_mark = await (async () => { await page.goto(url); return page.evaluate(() => DERIVED_CHECKS_STATE_KEY); })();
  try {
    // 鎖定與白名單。
    await openShare(character("ranger", 8, { race: "elf", "elf-lineage": "wood_elf", language1: "elvish", "ranger-weapon-mastery-pick-1": "輕錘" }));
    await page.evaluate(() => { const box = document.getElementById("spell-prepare"); box?.scrollIntoView(); });
    for (const id of ["str", "cha", "hp-display", "speed-input", "speed-display", "initiative-input", "passive-perception", "save-str", "skill-運動",
      "spell-save-dc", "spell-attack-bonus", "spellcasting-ability", "spell-adjustment", "prof-str", "prof-運動", "exp-運動", "language1", "elf-lineage", "character-size-select",
      "manual-feat-management", "ranger-fighting-style", "derived-feat-background", "class", "level", "race", "background"]) {
      assert.equal(await isLocked(id), true, `${id} is locked in share mode`);
    }
    for (const id of ["hp", "lifedicen", "alignment", "spellslot1-1", "mainHand", "armor", "offHandAsMain",
      "weapon-attack-automation", "atk-main-note", "class-extra", "skill-extra", "gear-notes", "gear-extra", "spell-notes",
      "ranger-hunters-prey-colossus-slayer", "ranger-defensive-tactics-escape-the-horde", "ranger-weapon-mastery-pick-1"]) {
      assert.equal(await isLocked(id), false, `${id} stays editable in share mode`);
    }
    // 鎖定不用 disabled（程式把它當未生效），值仍隨匯出保留；label 與直接點擊都改不動，也無法取得焦點。
    assert.deepEqual(await props("prof-int", ["inert", "disabled", "checked"]), [true, false, false]);
    assert.deepEqual(await page.evaluate(() => {
      document.querySelector(`label[for="prof-int"]`).click();
      document.getElementById("prof-int").click();
      document.querySelector('label.skill-rank-target input[id="prof-運動"]').closest("label").click();
      document.getElementById("character-size-select").focus();
      return [document.getElementById("prof-int").checked, document.getElementById("prof-運動").checked, document.activeElement?.id === "character-size-select"];
    }), [false, false, false], "locked controls ignore label clicks and focus");
    assert.equal((await page.evaluate(() => JSON.parse(collectJsonExportText().text)))["spellcasting-ability"], "int", "locked values stay in the export");
    // 陣營開放：實際從畫面改得動，也會進匯出。
    await page.locator("#alignment").selectOption("CG");
    assert.equal((await page.evaluate(() => JSON.parse(collectJsonExportText().text))).alignment, "CG", "the viewer's alignment reaches the export");
    // 動態新增的列也會鎖；白名單勾選仍可操作。
    assert.equal(await page.evaluate(async () => {
      const row = createToolProficiencyRow();
      await Promise.resolve(); await Promise.resolve();
      const locked = row.querySelector("select").inert;
      row.remove();
      return locked;
    }), true, "rows added later are locked too");
    await page.evaluate(() => showTab("spells", document.getElementById("spells-tab-button")));
    assert.equal(await page.evaluate(() => { const box = document.getElementById("spellslot1-1"); box.click(); return box.checked; }), true, "spell slots can be ticked");
    await page.evaluate(() => showTab("skills", document.querySelector('[aria-controls="tab-skills"]')));
    for (const selector of ["#add-tool-proficiency", "#calculate-saves-button", "#calculate-skills-button"]) {
      assert.equal(await page.locator(selector).isVisible(), false, `${selector} is hidden`);
    }

    // 跑團模式內的休息改選不受鎖定影響。
    await page.evaluate(() => { TabletopMode.setMode("tabletop"); });
    assert.equal(await page.locator("#share-mode-tip").isVisible(), true, "the tip stays visible in tabletop mode");
    assert.deepEqual(await page.evaluate(() => {
      const context = TabletopMode.getRestContext();
      const result = TabletopMode.commitRest("shortRest", { options: { "ranger-hunters-prey": ["ranger-hunters-prey-colossus-slayer"] } }, context.token);
      return [context.optionGroups.length, result.ok, document.getElementById("ranger-hunters-prey-colossus-slayer").checked];
    }), [2, true, true], "rest choices still work");
    await page.evaluate(() => { TabletopMode.setMode("sheet"); });

    // 選單：隱藏的項目、保留現狀的項目與沒有空洞的版面。
    for (const [width, height] of [[1100, 900], [390, 844]]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(100);
      await page.locator("#utility-menu-toggle").click();
      await page.locator("#tabletop-mode-toggle").waitFor();
      for (const selector of ["#help-quick-build-btn", "#set-default-abilities", "#restart-onboarding-btn", "#clear-storage-btn", ".utility-menu__setting--auto-calc", "#import-json-btn", ".share-url-btn", "#open-qr-btn", ".utility-menu__row--icon"]) {
        assert.equal(await page.locator(selector).isVisible(), false, `${selector} is hidden at ${width}`);
      }
      for (const selector of ["#tabletop-mode-toggle", "#adventure-journal-btn", "#export-json-btn", "#export-pdf-btn", "#open-sheet-download-btn", "#first-table-tour-btn"]) {
        assert.equal(await page.locator(selector).isVisible(), true, `${selector} stays at ${width}`);
      }
      assert.equal(await page.locator("#first-table-tour-btn").isDisabled(), false, "the tabletop tour stays available");
      assert.equal(await page.evaluate(() => {
        const help = document.querySelector(".utility-menu__help").getBoundingClientRect();
        const buttons = ["first-table-tour-btn", "reference-deities-btn"].map(id => document.getElementById(id).getBoundingClientRect());
        return Math.abs(buttons[0].left - help.left) < 1 && Math.abs(buttons[1].right - help.right) < 1 && buttons.every(button => Math.abs(button.top - buttons[0].top) < 1);
      }), true, `help row leaves no holes at ${width}`);
      // 匯出 JSON 在角色紙圖示右邊，同一列填滿，鍵盤焦點也照這個順序。
      assert.equal(await page.evaluate(() => {
        const pdf = document.getElementById("export-pdf-btn").getBoundingClientRect();
        const sheet = document.getElementById("open-sheet-download-btn").getBoundingClientRect();
        const json = document.getElementById("export-json-btn").getBoundingClientRect();
        const footer = document.querySelector(".utility-menu__row--footer").getBoundingClientRect();
        return Math.abs(pdf.left - footer.left) < 1 && sheet.left > pdf.right && json.left > sheet.right && Math.abs(json.right - footer.right) < 1
          && Math.abs((json.top + json.bottom) - (sheet.top + sheet.bottom)) < 2 && Math.abs(pdf.width - json.width) < 1
          && document.querySelector(".utility-menu__row--footer").lastElementChild?.id === "export-json-btn";
      }), true, `menu rows leave no holes at ${width}`);
      await page.locator("#utility-menu-toggle").click();
    }
    await page.setViewportSize({ width: 1100, height: 900 });

    // 提醒框：定稿文案、收合只留第一行、狀態只留當次畫面。
    const tip = page.locator("#share-mode-tip");
    const tipToggle = page.locator("#share-mode-tip-toggle");
    assert.equal((await tip.innerText()).replace(/\s+/g, ""), "分享模式：這是別人分享給你的角色▾✓你裝置上的角色卡完全不會被覆蓋✓可以操作HP、法術位、物品裝備、跑團模式⚠︎重新整理或離開頁面後，這裡的變更就會消失。要保留請「匯出JSON」");
    assert.equal(await tipToggle.getAttribute("aria-expanded"), "true");
    assert.equal(await tipToggle.getAttribute("aria-label"), "收合分享模式說明");
    await tipToggle.focus();
    await page.keyboard.press("Enter");
    assert.equal(await tipToggle.getAttribute("aria-expanded"), "false");
    assert.equal(await tipToggle.getAttribute("aria-label"), "展開分享模式說明");
    assert.equal(await page.locator("#share-mode-tip-details").isVisible(), false);
    assert.equal(await tip.getByText("分享模式：這是別人分享給你的角色").isVisible(), true);
    await page.evaluate(() => TabletopMode.setMode("tabletop"));
    assert.equal(await tipToggle.getAttribute("aria-expanded"), "false", "collapse carries into tabletop mode");
    // 跑團模式的選單按鈕固定在右上角：用真的點擊確認箭頭沒有被蓋住。
    for (const [width, height] of [[1100, 900], [390, 844], [320, 700]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => window.scrollTo(0, 0));
      await tipToggle.click({ timeout: 3000 });
      assert.equal(await tipToggle.getAttribute("aria-expanded"), "true", `tabletop tip expands by click at ${width}`);
      await tipToggle.click({ timeout: 3000 });
      assert.equal(await tipToggle.getAttribute("aria-expanded"), "false", `tabletop tip collapses by click at ${width}`);
    }
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.evaluate(() => TabletopMode.setMode("sheet"));
    await page.reload();
    await page.waitForFunction(() => document.getElementById("auto-calculate-key-stats-toggle")?.dataset.shareLocked === "true");
    assert.equal(await page.locator("#share-mode-tip-details").isVisible(), true, "each page load starts expanded");
    await page.locator("#legal-ack-btn").click();

    // 自動計算開著：跟著分享者，開關鎖死，AC 自動重算不能手改，也不需要提示。
    await page.evaluate(() => showTab("equipment", document.querySelector('[aria-controls="tab-equipment"]')));
    await openShare(character("paladin", 5));
    await page.evaluate(() => showTab("equipment", document.querySelector('[aria-controls="tab-equipment"]')));
    assert.deepEqual(await props("auto-calculate-key-stats-toggle", ["checked", "inert"]), [true, true]);
    assert.deepEqual(await props("ac-display", ["value", "readOnly"]), ["12", true]);
    await page.locator("#armor").selectOption("鎖子甲");
    assert.equal(await page.locator("#ac-display").inputValue(), "16", "automatic AC follows the armor");
    assert.equal(await page.locator("#share-ac-warning").isVisible(), false, "no AC warning while calculation is automatic");

    // 自動計算關著：保留分享者的數字，只開放 AC；換護甲、換下盾牌與有熟練時換上盾牌才提示。
    const stats = { "hp-display": "99", "ac-display": "21", "speed-display": "45", "initiative-input": "+7", "passive-perception": "19" };
    const warning = page.locator("#share-ac-warning");
    const manualPaladin = character("paladin", 5, manual({ ...stats, armor: "皮甲", mainHand: "短劍", offHand: "盾牌" }));
    await openShare(manualPaladin);
    await page.evaluate(() => showTab("equipment", document.querySelector('[aria-controls="tab-equipment"]')));
    for (const [id, value] of Object.entries(stats)) assert.equal(await page.locator(`#${id}`).inputValue(), value, `${id} keeps the sharer's number`);
    assert.deepEqual(await props("auto-calculate-key-stats-toggle", ["checked", "inert"]), [false, true]);
    assert.deepEqual([await isLocked("ac-display"), await isLocked("hp-display"), await isLocked("speed-display"), await isLocked("initiative-input"), await isLocked("passive-perception"), await isLocked("skill-運動")],
      [false, true, true, true, true, true], "only AC stays editable");
    assert.equal(await warning.isVisible(), false, "loading never shows the AC warning");
    await page.locator("#armor").selectOption("鎖子甲");
    assert.equal(await page.locator("#ac-display").inputValue(), "21", "manual AC does not recalculate");
    await warning.waitFor();
    assert.equal((await warning.innerText()).replace(/\s+/g, " ").trim().startsWith("⚠︎ 更換護甲後 AC 不會自動重算，請自行修改數值"), true);
    await warning.getByRole("button", { name: "更換護甲後 AC 不會自動重算，請自行修改數值，前往修改" }).click();
    await page.waitForFunction(() => document.getElementById("tab-basic").classList.contains("active") && document.activeElement?.id === "ac-display");
    await page.locator("#ac-display").fill("18");
    await page.evaluate(() => showTab("equipment", document.querySelector('[aria-controls="tab-equipment"]')));
    assert.equal(await page.locator("#equipment-current-ac-value").textContent(), "18", "the equipment tab shows the edited AC");
    await warning.getByRole("button", { name: "隱藏 AC 提醒" }).click();
    assert.equal(await warning.isVisible(), false);
    await page.locator("#armor").selectOption("皮甲");
    assert.equal(await warning.isVisible(), false, "hiding lasts for this page load");

    await openShare(manualPaladin);
    await page.evaluate(() => showTab("equipment", document.querySelector('[aria-controls="tab-equipment"]')));
    await page.locator("#mainHand").selectOption("長劍");
    assert.equal(await warning.isVisible(), false, "changing only a weapon does not warn");
    await page.locator("#offHand").selectOption("短劍");
    await warning.waitFor();

    await openShare(character("paladin", 5, manual({ ...stats, mainHand: "短劍" })));
    await page.evaluate(() => showTab("equipment", document.querySelector('[aria-controls="tab-equipment"]')));
    await page.locator("#offHand").selectOption("盾牌");
    await warning.waitFor();

    // 另一把主手的「裝備盾牌」勾選也算。
    await openShare(character("paladin", 5, manual({ ...stats, mainHand: "短劍", offHand: "長劍", offHandAsMain: true })));
    await page.evaluate(() => showTab("equipment", document.querySelector('[aria-controls="tab-equipment"]')));
    assert.equal(await warning.isVisible(), false);
    await page.locator("#main2Shield").check();
    await warning.waitFor();

    // 沒有盾牌熟練：換上不提示，換下仍提示。
    await openShare(character("wizard", 5, manual({ ...stats, mainHand: "短劍" })));
    await page.evaluate(() => showTab("equipment", document.querySelector('[aria-controls="tab-equipment"]')));
    assert.equal(await page.evaluate(() => isShieldProficient()), false);
    await page.locator("#offHand").selectOption("盾牌");
    assert.equal(await warning.isVisible(), false, "equipping a shield without proficiency does not warn");
    await page.locator("#offHand").selectOption("長劍");
    await warning.waitFor();

    // 裝置偏好：看的人的本機設定不讀不寫，切換只留當頁；跑團資料隨連結帶入。
    await page.goto(url);
    await page.waitForFunction(() => window.TabletopMode && window.Spellbook);
    const sharerSpell = { nameZh: "分享自創", level: 1, school: "塑能", castingTime: "action", castingTimeText: "", ritual: false, rangeType: "60", rangeFeet: 10, rangeText: "",
      verbal: true, somatic: true, material: false, materials: "", duration: "minute", durationText: "", concentration: false, description: "造成 2d6 傷害", hidden: false, showOnSheet: true };
    const shared = await page.evaluate(async ({ state, sharerSpell }) => {
      localStorage.clear();
      applyStateObject(state);
      const emptyState = collectShareState();
      const action = TabletopMode.addCustomTabletopAction({ label: "分享者動作", mode: "action", description: "分享者說明" });
      TabletopMode.setTabletopActionNotes("分享者筆記");
      const spell = TabletopMode.saveCustomTabletopSpell("", sharerSpell).spell;
      const shareState = collectShareState();
      return { hasEmpty: Object.hasOwn(emptyState, "__tabletopActionPreferences"), action: action.ok, spellId: spell.spellId, hash: await encodeStateToHash(shareState) };
    }, { state: character("wizard", 5), sharerSpell });
    assert.equal(shared.hasEmpty, false, "empty tabletop data is omitted from the link");
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem("dnd.tabletopActionPreferences.v1", JSON.stringify({ version: 1, customActions: [{ id: "viewer", label: "看的人動作", mode: "action", description: "本機" }], hiddenKeys: [], notes: "看的人筆記" }));
      localStorage.setItem("dnd.diceSystemEnabled.v1", "false");
      localStorage.setItem("dnd.scrollButtonsVisible.v1", "true");
      localStorage.setItem("dnd.theme.v1", "dark");
      localStorage.setItem("dndchar_autosave_v1", JSON.stringify({ class: "fighter", level: "2", characterName: "看的人角色" }));
      localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true");
    });
    await openHash(shared.hash);
    const before = await localSnapshot();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "dark", "the viewer's theme still applies");
    assert.equal(await page.evaluate(() => document.getElementById("dice-system-toggle").checked), true, "dice start on");
    assert.equal(await page.evaluate(() => document.getElementById("scroll-buttons-toggle").checked), false, "scroll buttons start off");
    assert.equal(await page.locator("#inventory-weight-toggle").getAttribute("aria-pressed"), "false", "weight starts hidden");
    assert.deepEqual(await page.evaluate(() => { const prefs = TabletopMode.getTabletopActionPreferences();
      return [prefs.customActions.map(action => action.label), prefs.notes, prefs.customSpells.map(spell => spell.nameZh)]; }), [["分享者動作"], "分享者筆記", ["分享自創"]], "the link's tabletop data replaces local data on this page");
    assert.equal(await page.locator(`[data-spell-read="${shared.spellId}"]`).count() > 0, true, "shared custom spells show on the sheet");
    // 自創法術能用不能改；自訂動作與筆記可改，但只留當頁。
    assert.deepEqual(await page.evaluate(id => [TabletopMode.saveCustomTabletopSpell("", {}).reason, TabletopMode.removeCustomTabletopSpell(id).reason], shared.spellId), ["share", "share"]);
    assert.equal(await page.evaluate(() => TabletopCustomSpells.openEditor()), false);
    await page.evaluate(() => {
      TabletopMode.setTabletopActionNotes("看的人改的筆記");
      TabletopMode.addCustomTabletopAction({ label: "看的人新增", mode: "action", description: "當頁" });
      TabletopMode.setCharacterName("看的人改的名字");
      document.getElementById("dice-system-toggle").click();
      document.getElementById("scroll-buttons-toggle").click();
      document.getElementById("hp").value = "3";
      document.getElementById("hp").dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.locator("#inventory-more").evaluate(button => button.click());
    await page.locator("#inventory-weight-toggle").evaluate(button => button.click());
    assert.equal(await page.evaluate(() => saveAllFields()), false, "share mode never autosaves");
    assert.equal(await localSnapshot(), before, "nothing reaches the viewer's localStorage");
    assert.deepEqual(await page.evaluate(() => [dndStorage.getItem("dnd.diceSystemEnabled.v1"), dndStorage.getItem("dnd.scrollButtonsVisible.v1"), dndStorage.getItem("dnd.inventoryWeightHidden.v1")]), ["false", "true", "false"], "toggles stay on this page");
    // 匯出帶當頁的跑團資料，不帶頭像。
    const sharedExport = await page.evaluate(() => JSON.parse(collectJsonExportText().text));
    assert.deepEqual([sharedExport.__tabletopActionPreferences.notes, sharedExport.__tabletopActionPreferences.customActions.map(action => action.label), sharedExport.__tabletopActionPreferences.customSpells.length, Object.hasOwn(sharedExport, "__tabletopAvatar")],
      ["看的人改的筆記", ["分享者動作", "看的人新增"], 1, false], "export keeps this page's tabletop data");
    await page.goto(url);
    await page.waitForFunction(() => window.TabletopMode && !autosaveRestoreBlocked);
    assert.deepEqual(await page.evaluate(() => { const prefs = TabletopMode.getTabletopActionPreferences();
      return [prefs.notes, prefs.customActions[0].label, document.getElementById("dice-system-toggle").checked, document.getElementById("scroll-buttons-toggle").checked]; }),
      ["看的人筆記", "看的人動作", false, true], "leaving the share restores the viewer's own settings");

    // 舊連結沒帶跑團資料：從空白開始，也不顯示本機的自訂動作。
    await openShare(character("fighter", 3));
    assert.deepEqual(await page.evaluate(() => { const prefs = TabletopMode.getTabletopActionPreferences(); return [prefs.customActions.length, prefs.notes, prefs.hiddenKeys.length]; }), [0, "", 0]);

    // 換法術：不能換的職業沒有按鈕，只留一行說明；寫入 API 也擋住。
    await openShare(character("bard", 3, { "spellcasting-ability": "cha", __spellManagement: { version: 2, manual: false, entries: [{ spellId: "cure-wounds", spellClass: "bard", level: 1 }] } }));
    await page.evaluate(() => showTab("spells", document.getElementById("spells-tab-button")));
    assert.equal(await page.locator("#spell-prepare").isVisible(), false);
    assert.equal(await page.locator("#spell-prepared-status").innerText(), "吟遊詩人只有升級時能換法術，分享模式不可更改。");
    assert.deepEqual(await page.evaluate(async () => {
      const opened = await Spellbook.openPreparedManager(document.body);
      const added = SpellManagement.addPlayerSpell("healing-word");
      const removed = SpellManagement.removePlayerSpell("cure-wounds");
      SpellManagement.setPlayerEntries([]);
      return [opened, added, removed, SpellManagement.getPlayerEntries().map(entry => entry.spellId)];
    }), [false, false, false, ["cure-wounds"]], "locked classes reject every spell write");
    await openShare(character("fighter", 3, { background: "soldier", "spellcasting-ability": "" }));
    await page.evaluate(() => showTab("spells", document.getElementById("spells-tab-button")));
    assert.deepEqual([await page.locator("#spell-prepare").isVisible(), await page.locator("#spell-prepared-status").isVisible()], [false, false], "non-casters get no note");

    // 可換的職業：有規則提示、沒有手動管理開關；只有法師能換戲法。
    await openShare(character("cleric", 3, { "spellcasting-ability": "wis", __spellManagement: { version: 2, manual: false, entries: [{ spellId: "guidance", spellClass: "cleric", level: 0 }, { spellId: "command", spellClass: "cleric", level: 1 }] } }));
    await page.evaluate(() => { showTab("spells", document.getElementById("spells-tab-button")); document.getElementById("spell-prepare").click(); });
    const dialog = page.getByRole("dialog", { name: "管理已準備法術", exact: true });
    await dialog.waitFor();
    assert.equal(await dialog.locator(".spell-prepared-share-rule").innerText(), "牧師規則：每次長休後，可全部更換已準備法術。");
    assert.equal(await dialog.locator("#manual-spell-management").count(), 0, "the manual toggle is not offered");
    assert.equal(await dialog.locator('input[value="guidance"]').isDisabled(), true, "the cleric's cantrip is locked");
    assert.equal(await dialog.locator('input[value="light"]').count(), 0, "other cantrips are not candidates");
    await dialog.locator(`input[value="command"]`).uncheck();
    await dialog.locator(`input[value="guiding-bolt"]`).check();
    await dialog.getByRole("button", { name: "儲存", exact: true }).click();
    await dialog.waitFor({ state: "detached" });
    assert.deepEqual((await page.evaluate(() => SpellManagement.getPlayerEntries().map(entry => entry.spellId))).sort(), ["guidance", "guiding-bolt"]);

    await openShare(character("wizard", 3, { __wizardSpellbook: { version: 2, spellIds: ["magic-missile", "shield"], wizardSpellIds: ["magic-missile", "shield"], manualSpellIds: [] },
      __spellManagement: { version: 2, manual: false, entries: [{ spellId: "light", spellClass: "wizard", level: 0 }, { spellId: "magic-missile", spellClass: "wizard", level: 1 }] } }));
    await page.evaluate(() => { showTab("spells", document.getElementById("spells-tab-button")); });
    assert.equal(await page.locator("#spellbook-manage").isVisible(), false, "the spellbook cannot be managed");
    assert.deepEqual(await page.evaluate(() => [Spellbook.canWriteSpell("shield"), Spellbook.addWizardSpell("burning-hands"), Spellbook.getState().spellIds]), [false, false, ["magic-missile", "shield"]]);
    await page.evaluate(() => document.getElementById("spell-prepare").click());
    await dialog.waitFor();
    assert.equal(await dialog.locator(".spell-prepared-share-rule").innerText(), "法師規則：每次長休後，可全部更換法術書內的已準備法術，並替換 1 個戲法。");
    assert.equal(await dialog.locator('input[value="burning-hands"]').count(), 0, "wizards only prepare from the book");
    assert.equal(await dialog.locator('input[value="shield"]').count(), 1);
    assert.equal(await dialog.locator('input[value="light"]').isDisabled(), false, "wizards can swap a cantrip");
    await dialog.getByRole("button", { name: "取消", exact: true }).click();
    await dialog.waitFor({ state: "detached" });
    // 搜尋結果與法術詳情的入口：書外法術只能閱讀。
    assert.deepEqual(await page.evaluate(() => [SpellManagement.addPlayerSpell("burning-hands"), ShareReadonly.canPrepareSpell("shield"), ShareReadonly.canPrepareSpell("burning-hands")]), [false, true, false]);
    await page.evaluate(() => { autoPrepareSpellFromFeature("burning-hands", document.body); });
    await page.getByText("分享模式不可將此法術加入準備清單。").waitFor();
    await page.getByRole("dialog", { name: "法術詳情", exact: true }).getByRole("button", { name: "關閉", exact: true }).first().click();

    // 一般模式不受影響：沒有規則提示、手動管理開關與按鈕都在。
    await page.goto(url);
    await page.waitForFunction(() => window.TabletopMode && !autosaveRestoreBlocked);
    await page.evaluate(state => applyStateObject(state), character("cleric", 3, { "spellcasting-ability": "wis" }));
    await page.evaluate(() => { showTab("spells", document.getElementById("spells-tab-button")); document.getElementById("spell-prepare").click(); });
    await dialog.waitFor();
    assert.deepEqual([await dialog.locator(".spell-prepared-share-rule").count(), await dialog.locator("#manual-spell-management").count()], [0, 1]);
    await dialog.getByRole("button", { name: "取消", exact: true }).click();
    assert.equal(await page.locator("#share-ac-warning").count(), 0, "the AC warning only exists in share mode");
    console.log("Share read-only mode: locks and whitelist, menu, tip, automatic and manual AC warning, device preferences, tabletop data, legacy links and spell changes passed.");
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
    }
    assert.equal(Object.hasOwn(exported.share, "__tabletopAvatar"), false, "the avatar stays out of share data");
    assert.deepEqual(JSON.parse(JSON.stringify(exported.share.__tabletopActionPreferences)), preferences, "tabletop preferences travel with the share link");
    const shareHash = await page.evaluate(() => encodeStateToHash(collectShareState()));
    await page.goto(`${url}${shareHash}`);
    await page.waitForFunction(() => window.SHARE_MODE === true && TabletopMode.getCharacterName() === "匯出角色");
    const sharedExport = await page.evaluate(() => { const result = collectJsonExportText(); downloadStateAsJson(); return JSON.parse(result.text); });
    assert.equal(Object.hasOwn(sharedExport, "__tabletopAvatar"), false, "share-mode JSON export omits the viewer's local avatar");
    assert.deepEqual(sharedExport.__tabletopActionPreferences, preferences, "share-mode JSON export keeps the shared tabletop preferences");
    assert.equal(sharedExport.characterName, "匯出角色", "share-mode JSON export keeps the shared character");
    await page.getByText("分享模式匯出的檔案不含角色圖片。").waitFor();
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

    // The cropper saves WebP; a canvas that cannot encode WebP (Safari hands back a PNG instead) falls back to JPEG.
    const cropAvatar = async withoutWebp => {
      await page.evaluate(withoutWebp => {
        TabletopMode.setMode("tabletop");
        if (!withoutWebp) return;
        const encode = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function toDataURL(type, quality) { return encode.call(this, type === "image/webp" ? "image/png" : type, quality); };
      }, withoutWebp);
      await page.locator("#tabletop-avatar-file").setInputFiles({ name: "avatar.png", mimeType: "image/png", buffer: Buffer.from(avatar.split(",")[1], "base64") });
      await page.waitForFunction(() => !document.getElementById("tabletop-avatar-modal").hidden && document.getElementById("tabletop-avatar-crop-image").naturalWidth > 0);
      await page.locator("#tabletop-avatar-confirm").click();
      return page.evaluate(() => {
        const saved = dndStorage.getItem("dnd.tabletopAvatar.v1");
        return { type: /^data:(image\/[a-z]+);base64,/.exec(saved)?.[1], valid: isValidTabletopAvatar(saved), exported: JSON.parse(collectJsonExportText().text).__tabletopAvatar === saved };
      });
    };
    assert.deepEqual(await cropAvatar(false), { type: "image/webp", valid: true, exported: true }, "the cropper saves a WebP avatar");
    assert.deepEqual(await cropAvatar(true), { type: "image/jpeg", valid: true, exported: true }, "without WebP encoding the cropper saves JPEG, not the PNG the browser falls back to");
    console.log("JSON clean import: incoming precedence, cleanup, stage/apply/save failures, retained backups, retry, completion marker, denied session access, tabletop button/avatar round trip and avatar encoding fallback passed.");
  } finally { await page.close(); }
}

async function main() {
  const sections = new Set(process.argv.slice(2));
  for (const flag of sections) assert(["--appearance-only", "--dialogs-only", "--gestures-only", "--journal-only", "--pdf-only", "--pdf-fields-only", "--data-only", "--share-only"].includes(flag), `Unknown option: ${flag}`);
  assert(sections.size <= 1, "Choose at most one UI section");
  const all = sections.size === 0;
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  verifyAnalyticsIsolation(html);
  verifyOldSafariSyntax(html);
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
    if (all || sections.has("--data-only")) { await verifyJsonImportTransaction(browser, url); await verifyCharacterDataSafety(browser, url); await verifyFieldInfoHint(browser, url); await verifyFirstLoadDefaults(browser, url); await verifySubclassSelection(browser, url); await verifyClassPicks(browser, url); await verifyClassOptionMemory(browser, url); await verifyBackgroundChoiceMemory(browser, url); await verifyAutoCalculatedChecks(browser, url); await verifyInventoryPersistence(browser, url); }
    if (all || sections.has("--data-only") || sections.has("--share-only")) await verifyShareReadonlyMode(browser, url);
    if (all || sections.has("--appearance-only")) {
      const page = await newUiPage(browser, { viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
      try { await verifyAppearanceAndLayout(browser, page, url); }
      finally { await page.close(); }
    }
    if (sections.has("--gestures-only")) await verifyToasts(browser);
    if (all || sections.has("--gestures-only")) await verifyPageSwipe(browser, url);
    if (all || sections.has("--dialogs-only")) {
      await verifyToasts(browser);
      await verifyShareDialog(browser, url);
      await verifyAboutRoutes(browser, url);
      await verifyFeatureChoiceDisclosures(browser, url);
      await verifyCustomBackground(browser, url);
      await verifyCharacterFeatures(browser, url);
      await verifyChoiceReminderHighlights(browser, url);
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

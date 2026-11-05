// 主題文字對比量測（開發用，不在 npm test，也不改任何檔案）。先 npm run build。
// 用法：
//   node tools/contrast-audit.js                         四種外觀的 token 表與實際閱讀區塊
//   node tools/contrast-audit.js --mode dark --theme warm  只量指定外觀
//   node tools/contrast-audit.js --tokens-only           只算 token 表
//   node tools/contrast-audit.js --candidates c.json     另外量候選色（只注入頁面，不改原始碼）
//       c.json：{ "dark": { "warm": "--text-body:#E2D6C2;" } }
//   node tools/contrast-audit.js --shots <資料夾> --viewport 390x844   存截圖（資料夾自訂，勿放進 repo）
//   node tools/contrast-audit.js --external              量外部網站的本文與次要文字（會連到第三方網站）
// 判斷線：WCAG 2 的 4.5:1 為硬門檻；本文 Lc 75 為下限、約 90 為理想；要閱讀的次要文字 Lc 60 以上。
// WCAG 2 會高估深色對比，暗色不能只看它。Lc 為 APCA-W3 0.0.98G 公式，取絕對值。
"use strict";
const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const MODES = ["light", "dark"];
const THEMES = ["classic", "warm"];
const TEXT_TOKENS = ["--text", "--text-body", "--text-muted", "--accent", "--accent-strong", "--class-tagline", "--danger", "--warning", "--success", "--disabled-text"];
const SURFACE_TOKENS = ["--bg", "--surface", "--surface-strong", "--surface-soft", "--surface-muted", "--input-bg", "--accent-soft", "--disabled-bg"];
const SECONDARY_SELECTOR = 'figcaption, small, time, cite, [class*="muted" i], [class*="secondary" i], [class*="subtle" i], [class*="caption" i], [class*="meta" i]';
const EXTERNAL_SITES = [
  ["GitHub", "https://github.com/microsoft/vscode", "article p, .markdown-body p"],
  ["維基百科中文版", "https://zh.wikipedia.org/wiki/%E9%BE%8D%E8%88%87%E5%9C%B0%E4%B8%8B%E5%9F%8E", "#mw-content-text p", { name: "zhwikimwclientpreferences", value: "skin-theme-clientpref-night", domain: ".zh.wikipedia.org", path: "/", darkOnly: true }],
  ["MDN", "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/color-scheme", "main p"],
  ["Microsoft Learn", "https://learn.microsoft.com/en-us/windows/apps/design/signature-experiences/color", "main p, .content p"],
  ["VS Code 文件", "https://code.visualstudio.com/docs/editing/getting-started/userinterface", "main p"],
  ["Apple 設計指南", "https://developer.apple.com/design/human-interface-guidelines/dark-mode", "main p"],
  ["Google Developers", "https://developers.google.com/search/docs/fundamentals/seo-starter-guide", "main p, article p, .devsite-article p"],
  ["Anthropic 文件", "https://platform.claude.com/docs/en/intro", "main p, article p"]
];

function parseArgs(argv) {
  const args = { modes: MODES, themes: THEMES, tokensOnly: false, external: false, candidates: null, shots: null, viewport: { width: 1280, height: 900 } };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === "--mode") args.modes = [argv[++i]];
    else if (flag === "--theme") args.themes = [argv[++i]];
    else if (flag === "--tokens-only") args.tokensOnly = true;
    else if (flag === "--external") args.external = true;
    else if (flag === "--candidates") args.candidates = JSON.parse(fs.readFileSync(argv[++i], "utf8"));
    else if (flag === "--shots") args.shots = path.resolve(argv[++i]);
    else if (flag === "--viewport") { const [width, height] = argv[++i].split("x").map(Number); args.viewport = { width, height }; }
    else throw new Error(`不認得的參數：${flag}`);
  }
  if (args.modes.some(mode => !MODES.includes(mode))) throw new Error("--mode 只能是 light 或 dark");
  if (args.themes.some(theme => !THEMES.includes(theme))) throw new Error("--theme 只能是 classic 或 warm");
  return args;
}

function wcag(a, b) {
  const channel = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function lc(text, background) {
  const luminance = ([r, g, b]) => {
    const y = (r / 255) ** 2.4 * 0.2126729 + (g / 255) ** 2.4 * 0.7151522 + (b / 255) ** 2.4 * 0.072175;
    return y < 0.022 ? y + (0.022 - y) ** 1.414 : y;
  };
  const [t, b] = [luminance(text), luminance(background)];
  if (Math.abs(b - t) < 0.0005) return 0;
  if (b > t) { const s = (b ** 0.56 - t ** 0.57) * 1.14; return s < 0.1 ? 0 : (s - 0.027) * 100; }
  const s = (b ** 0.65 - t ** 0.62) * 1.14;
  return s > -0.1 ? 0 : Math.abs(s + 0.027) * 100;
}

const hex = rgb => `#${rgb.map(v => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
const pair = (text, background) => `${wcag(text, background).toFixed(1).padStart(4)}/${lc(text, background).toFixed(0).padStart(3)}`;

// 以下函式在頁面內執行。顏色一律交給 canvas 解析，才能處理 oklch、color-mix 等格式。
function installColorHelpers() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const cache = new Map();
  const parse = color => {
    if (cache.has(color)) return cache.get(color);
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = "rgba(0,0,0,0)";
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    const data = context.getImageData(0, 0, 1, 1).data;
    const value = [data[0], data[1], data[2], data[3] / 255];
    cache.set(color, value);
    return value;
  };
  const over = (front, back) => [0, 1, 2].map(i => front[i] * front[3] + back[i] * (1 - front[3]));
  const brightness = c => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  // 半透明逐層合成；漸層取最接近文字亮度的色標（最差情況）；根元素的頁面漸層以 --bg 代表。
  const background = (element, text) => {
    const layers = [];
    let gradient = false;
    for (let e = element; e; e = e.parentElement) {
      const style = getComputedStyle(e);
      const color = parse(style.backgroundColor);
      const isRoot = e === document.documentElement;
      if (style.backgroundImage !== "none" && !isRoot) {
        const stops = (style.backgroundImage.match(/rgba?\([^)]*\)|oklch\([^)]*\)|lab\([^)]*\)|color\([^)]*\)/g) || []).map(parse).filter(stop => stop[3] > 0);
        if (stops.length) {
          gradient = true;
          const worst = stops.slice().sort((a, b) => Math.abs(brightness(a) - brightness(text)) - Math.abs(brightness(b) - brightness(text)))[0];
          layers.push(worst);
          if (worst[3] === 1) break;
          continue;
        }
      }
      if (isRoot && color[3] === 0 && style.backgroundImage !== "none") {
        const base = style.getPropertyValue("--bg").trim();
        if (base) { layers.push(parse(base)); gradient = true; break; }
      }
      if (color[3] > 0) { layers.push(color); if (color[3] === 1) break; }
    }
    return { rgb: layers.reverse().reduce((back, layer) => over(layer, back), [255, 255, 255]).map(Math.round), gradient };
  };
  window.__contrast = { parse, over, background };
}

function readTokens({ textTokens, surfaceTokens }) {
  const { parse, over } = window.__contrast;
  const style = getComputedStyle(document.documentElement);
  const read = name => { const value = style.getPropertyValue(name).trim(); return value && !value.includes("gradient") ? parse(value) : null; };
  const page = read("--bg");
  const solid = color => color && over(color, page).map(Math.round);
  const collect = names => Object.fromEntries(names.map(name => [name, solid(read(name))]).filter(([, value]) => value));
  return { text: collect(textTokens), surfaces: collect(surfaceTokens), onAccent: solid(read("--on-accent")), fills: collect(["--action-fill", "--action-hover", "--accent-strong"]) };
}

function auditText(rootSelector) {
  const { parse, over, background } = window.__contrast;
  const root = rootSelector ? document.querySelector(rootSelector) : document.body;
  if (!root) return { total: 0, rows: [] };
  const rows = new Map();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let total = 0;
  for (let node; (node = walker.nextNode());) {
    const text = node.nodeValue.replace(/\s+/g, "");
    const element = node.parentElement;
    if (!text || !element || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|OPTION)$/.test(element.tagName)) continue;
    const rect = element.getClientRects()[0];
    if (!rect || rect.width < 1 || rect.height < 1 || rect.right < 0 || rect.left > innerWidth) continue;
    const style = getComputedStyle(element);
    if (style.visibility !== "visible") continue;
    let opacity = 1;
    let hidden = false;
    for (let e = element; e; e = e.parentElement) { const s = getComputedStyle(e); opacity *= Number(s.opacity); if (s.display === "none") hidden = true; }
    if (hidden || opacity === 0) continue;
    const color = parse(style.color);
    const back = background(element, color);
    const rgb = over([color[0], color[1], color[2], color[3] * opacity], back.rgb).map(Math.round);
    const key = `${rgb}|${back.rgb}|${style.fontSize}|${style.fontWeight}`;
    const row = rows.get(key) || { text: rgb, back: back.rgb, gradient: back.gradient, size: parseFloat(style.fontSize), weight: Number(style.fontWeight), chars: 0, sample: "", selector: "" };
    row.chars += text.length;
    if (row.sample.length < 24) row.sample += text.slice(0, 24 - row.sample.length);
    if (!row.selector) row.selector = element.tagName.toLowerCase() + (typeof element.className === "string" && element.className ? `.${element.className.split(/\s+/)[0]}` : "");
    rows.set(key, row);
    total += text.length;
  }
  return { total, rows: [...rows.values()].sort((a, b) => b.chars - a.chars) };
}

function probeParagraphs({ selector, minimum }) {
  const { parse, over, background } = window.__contrast;
  const rows = new Map();
  for (const element of document.querySelectorAll(selector)) {
    const length = (element.innerText || "").replace(/\s+/g, "").length;
    const rect = element.getClientRects()[0];
    const style = getComputedStyle(element);
    if (length < minimum || !rect || rect.width < 1 || style.visibility !== "visible") continue;
    const color = parse(style.color);
    const back = background(element, color).rgb;
    const text = over(color, back).map(Math.round);
    const key = `${text}|${back}|${style.fontSize}|${style.fontWeight}`;
    const row = rows.get(key) || { text, back, size: style.fontSize, weight: style.fontWeight, chars: 0 };
    row.chars += length;
    rows.set(key, row);
  }
  return [...rows.values()].sort((a, b) => b.chars - a.chars).slice(0, 2);
}

function printRows(label, result) {
  if (!result.total) { console.log(`  ${label}：沒有量到文字`); return; }
  const share = predicate => Math.round(result.rows.filter(predicate).reduce((sum, row) => sum + row.chars, 0) / result.total * 100);
  const sorted = result.rows.slice().sort((a, b) => lc(a.text, a.back) - lc(b.text, b.back));
  let seen = 0;
  const median = sorted.find(row => (seen += row.chars) >= result.total / 2);
  const top = result.rows.slice(0, 3).map(row => `${Math.round(row.chars / result.total * 100)}% ${hex(row.text)}/${hex(row.back)} ${Math.round(row.size * 10) / 10}px/${row.weight} Lc${lc(row.text, row.back).toFixed(0)}`).join("；");
  console.log(`  ${label.padEnd(5, "　")} ${String(result.total).padStart(5)} 字 中位 Lc ${lc(median.text, median.back).toFixed(0).padStart(3)}　<4.5:1 ${String(share(row => wcag(row.text, row.back) < 4.5)).padStart(2)}%　Lc<60 ${String(share(row => lc(row.text, row.back) < 60)).padStart(3)}%　｜${top}`);
  for (const row of sorted.filter(item => wcag(item.text, item.back) < 4.5 || (item.chars >= 8 && lc(item.text, item.back) < 60)).slice(0, 4)) {
    console.log(`      低：${row.chars} 字 ${hex(row.text)}/${hex(row.back)} ${Math.round(row.size * 10) / 10}px/${row.weight} ${wcag(row.text, row.back).toFixed(1)}:1 Lc ${lc(row.text, row.back).toFixed(0)} ${row.selector}${row.gradient ? "（漸層）" : ""}「${row.sample}」`);
  }
}

function printTokens(tokens) {
  const surfaces = Object.entries(tokens.surfaces);
  console.log(`  token 表（WCAG/Lc）\n  ${"".padEnd(16)}${surfaces.map(([name]) => name.replace(/^--/, "").padEnd(16)).join("")}`);
  console.log(`  ${"".padEnd(16)}${surfaces.map(([, rgb]) => hex(rgb).padEnd(16)).join("")}`);
  for (const [name, rgb] of Object.entries(tokens.text)) console.log(`  ${name.replace(/^--/, "").padEnd(16)}${surfaces.map(([, back]) => pair(rgb, back).padEnd(16)).join("")}${hex(rgb)}`);
  if (tokens.onAccent) console.log(`  on-accent：${Object.entries(tokens.fills).map(([name, back]) => `${name.replace(/^--/, "")} ${hex(back)} ${pair(tokens.onAccent, back)}`).join("；")}`);
}

async function auditTheme(browser, url, args, theme, mode, variant) {
  const page = await browser.newPage({ viewport: args.viewport });
  page.setDefaultTimeout(8000);
  try {
    await page.addInitScript(([themeValue, modeValue]) => {
      try {
        localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true");
        localStorage.setItem("dnd.theme.v1", modeValue);
        localStorage.setItem("dnd.uiTheme.v1", themeValue);
      } catch {}
    }, [theme, mode]);
    await page.goto(url);
    await page.locator("#legal-close-btn").click().catch(() => {});
    const overrides = variant === "候選" ? args.candidates[mode]?.[theme] : "";
    if (overrides) await page.addStyleTag({ content: `html[data-theme="${mode}"]{${overrides}}` });
    await page.evaluate(installColorHelpers);
    console.log(`\n== ${theme} ${mode}（${variant}）`);
    printTokens(await page.evaluate(readTokens, { textTokens: TEXT_TOKENS, surfaceTokens: SURFACE_TOKENS }));
    if (args.tokensOnly) return;
    const shot = async name => {
      if (!args.shots) return;
      fs.mkdirSync(args.shots, { recursive: true });
      await page.screenshot({ path: path.join(args.shots, `${mode}-${theme}-${variant === "候選" ? "next" : "now"}-${args.viewport.width}-${name}.png`) });
    };
    const report = async (label, selector) => printRows(label, await page.evaluate(auditText, selector));
    await page.locator("#class").selectOption("cleric");
    await page.locator("#level").selectOption("5");
    await page.waitForTimeout(400);
    await page.evaluate(() => { showTab("basic"); openCharacterFeatures("class"); });
    await page.waitForTimeout(600);
    await report("職業能力", "#character-features-modal");
    await shot("features");
    await page.locator("#character-features-modal .app-dialog__close").click();
    await page.waitForTimeout(200);
    await page.evaluate(() => { void autoPrepareSpellFromFeature("cure-wounds", document.body); });
    await page.waitForTimeout(800);
    const dialog = await page.evaluate(() => {
      const open = [...document.querySelectorAll("dialog[open], .app-dialog")].filter(element => element.getClientRects().length).pop();
      if (!open) return null;
      open.setAttribute("data-contrast-root", "");
      return "[data-contrast-root]";
    });
    await report("法術詳情", dialog);
    await shot("spell");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await page.evaluate(() => document.querySelector("[data-contrast-root]")?.removeAttribute("data-contrast-root"));
    for (const [tab, label] of [["actions", "動作頁"], ["equipment", "裝備頁"], ["skills", "技能頁"], ["basic", "數值頁"]]) {
      await page.evaluate(name => showTab(name), tab);
      await page.waitForTimeout(300);
      await report(label, `#tab-${tab}`);
      await shot(tab);
    }
    await page.evaluate(() => TabletopMode.setMode("tabletop"));
    await page.waitForTimeout(500);
    await report("跑團", null);
    await shot("tabletop");
  } finally {
    await page.close();
  }
}

async function auditExternal(browser, modes) {
  for (const mode of modes) {
    console.log(`\n== 外部網站 ${mode}`);
    for (const [name, url, selector, cookie] of EXTERNAL_SITES) {
      const context = await browser.newContext({ colorScheme: mode, viewport: { width: 1280, height: 900 }, locale: "en-US" });
      try {
        if (cookie && (mode === "dark" || !cookie.darkOnly)) {
          const { darkOnly, ...value } = cookie;
          await context.addCookies([value]);
        }
        const page = await context.newPage();
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(4000);
        await page.evaluate(installColorHelpers);
        const format = row => `${hex(row.text)}/${hex(row.back)} ${row.size}/${row.weight} ${wcag(row.text, row.back).toFixed(1)}:1 Lc ${lc(row.text, row.back).toFixed(0)}`;
        const body = await page.evaluate(probeParagraphs, { selector, minimum: 40 });
        const secondary = await page.evaluate(probeParagraphs, { selector: SECONDARY_SELECTOR, minimum: 8 });
        console.log(`  ${name}\n    本文 ${body.slice(0, 1).map(format).join("") || "沒有量到"}\n    次要 ${secondary.map(format).join("｜") || "沒有量到"}`);
      } catch (error) {
        console.log(`  ${name}：無法量測（${String(error.message).slice(0, 80)}）`);
      } finally {
        await context.close();
      }
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const browser = await chromium.launch({ headless: true, ...(process.env.DND_BROWSER_CHANNEL ? { channel: process.env.DND_BROWSER_CHANNEL } : {}) });
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const file = path.resolve(ROOT, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!file.startsWith(ROOT + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
      if (error) return res.writeHead(404).end();
      res.setHeader("Content-Type", { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png" }[path.extname(file)] || "application/octet-stream");
      res.end(data);
    });
  });
  try {
    if (args.external) {
      await auditExternal(browser, args.modes);
      return;
    }
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    const url = `http://127.0.0.1:${server.address().port}/index.html?analytics=owner`;
    for (const theme of args.themes) {
      for (const mode of args.modes) {
        await auditTheme(browser, url, args, theme, mode, "目前");
        if (args.candidates?.[mode]?.[theme]) await auditTheme(browser, url, args, theme, mode, "候選");
      }
    }
  } finally {
    await browser.close();
    if (server.listening) server.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

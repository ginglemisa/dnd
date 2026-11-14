// 外觀快照比對（開發用，不在 npm test，也不改任何網站檔案）。CSS 純重構時用來證明畫面沒有任何變化。先 npm ci。
// 每個畫面記下所有畫出來的元素與偽元素（::before、::after、::marker、::placeholder、::backdrop）的 computed style 與位置大小，另存一張 PNG。
// computed style、位置大小或元素清單有任何不同 → 結束碼 1，並產生「改前／改後／差異標紅」的 HTML 報告。
// 只有 PNG 不同、樣式與位置完全相同且明顯不同的像素 ≤500 時，視為點陣化雜訊：列在報告裡，不算失敗（導覽畫面的 PNG 只供參考）。
// 用法（在專案根目錄執行；快照預設放在系統暫存資料夾，勿放進 repo）：
//   node tools/visual-snapshot.js check                       以 main 為基準比對目前的工作目錄（最常用；兩邊各自建置，本機 8 核心約 25 分鐘）
//   node tools/visual-snapshot.js check --quick               只拍 1280 與 375 兩種寬度（約 7 分鐘），改到一半時先用這個
//   node tools/visual-snapshot.js check --base <ref>          指定基準（預設 main）；基準 commit、工具與選項都沒變時沿用上次的基準快照
//   node tools/visual-snapshot.js snap <資料夾>                對目前的工作目錄拍快照（先 npm run build）
//   node tools/visual-snapshot.js snap <資料夾> --ref main     對某個 git ref 拍快照（git archive 到暫存資料夾建置，用完刪除）
//   node tools/visual-snapshot.js snap <資料夾> --root <目錄>  對另一個已建置的目錄拍快照（例如改過 CSS 的暫存副本）
//   node tools/visual-snapshot.js compare <基準> <新版>        比對兩份快照，報告寫到 <新版>/../report（可用 --report 指定）
//   node tools/visual-snapshot.js list                         列出畫面、外觀、寬度，以及目前選項會拍幾張
// 選項（snap／check）：
//   --quick                    只拍 QUICK_WIDTHS，四種外觀都拍
//   --widths all|1280,390      all＝每個斷點區間各一個寬度（FULL_WIDTHS）；預設角色卡各頁 PAGE_WIDTHS、視窗 DIALOG_WIDTHS
//   --every                    每個寬度都拍四種外觀（預設 1280、375 以外的寬度輪流拍兩種外觀）
//   --appearance warm-dark,…   只拍指定外觀（classic-light、classic-dark、warm-light、warm-dark）
//   --only 名稱,…              只拍指定畫面（名稱見 list；結尾加 - 表示前綴，例如 --only tt-,qb-）
//   --fresh                    每張都重新載入頁面（預設一個畫面載入一次，再縮放寬度、用主題開關切外觀）
//   --workers N                同時開幾個分頁（預設 CPU 數減 2，最多 6）
//   --out <資料夾>             check 的輸出資料夾（預設 <暫存>/twd20-visual-snapshot），裡面有 base、current、report
//   --no-build                 check 時不在目前的工作目錄執行 npm run build
//   --rebuild-base             check 時不沿用上次的基準快照
// 基準 ref 用 git archive 解到暫存資料夾、沿用目前的 node_modules 建置；不動 checkout、branch 或 stash。
// 兩邊都載入各自完整的 index.html、CSS 與 JS（拆檔、quick-build.js 內嵌 CSS 搬家都照常比對）；
// class-content.private.generated.js 一律回空檔，私人內容不影響結果。
// 穩定性：動畫與 transition 直接跑完（不覆寫 CSS）、固定測試角色、亂數、時間、時區與語系、無 GPU 單執行緒點陣化；
// 網址一律在 # 之前帶 analytics=owner。沒涵蓋的畫面與狀態見 PR 說明。
"use strict";
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const REPO = path.resolve(__dirname, "..");
// 工具本身改了，舊的基準快照就不能沿用。
const TOOL_HASH = require("crypto").createHash("sha1").update(fs.readFileSync(__filename)).digest("hex").slice(0, 12);
const optionKey = options => ({ quick: !!options.quick, widths: options.widths || null, only: options.only || null, appearance: options.appearance || null, every: !!options.every, fresh: !!options.fresh });
const APPEARANCES = [
  { id: "classic-light", theme: "classic", mode: "light" },
  { id: "classic-dark", theme: "classic", mode: "dark" },
  { id: "warm-light", theme: "warm", mode: "light" },
  { id: "warm-dark", theme: "warm", mode: "dark" }
];
// 寬度清單固定寫在這裡（2026-11-08 依 styles.css、quick-build.js 內嵌 CSS 與 JS 的 matchMedia 整理），之後重構改寫斷點語法也不要重算。
// 轉換點是「新狀態的第一個整數寬度」：max-width:N → N+1；min-width:N、width<N → N。
//   width<：245、280、320、360、385、540
//   max-width 299/319/339/340/359/374/379/380/388/400/420/480/499/520/540/600/619/620/640/719/760/768
//     → 300、320、340、341、360、375、380、381、389、401、421、481、500、521、541、601、620、621、641、720、761、769
//   min-width：320、360、389、400、480、500、520、521、560、600、620、720
// 合起來 31 個轉換點；FULL_WIDTHS 取每個轉換點本身，加上最左邊的 240 與代表 769 以上的 1280（761 代表 761～768）。
const FULL_WIDTHS = [240, 245, 280, 300, 320, 340, 341, 360, 375, 380, 381, 385, 389, 400, 401, 421, 480, 481, 500, 520, 521, 540, 541, 560, 600, 601, 620, 621, 641, 720, 761, 1280];
// 角色卡與跑團各分頁：常見手機寬度與主要斷點兩側。
const PAGE_WIDTHS = [1280, 761, 720, 641, 620, 600, 541, 521, 520, 481, 421, 400, 389, 381, 375, 360, 341, 320, 300, 280];
// 對話框與視窗：主要斷點兩側。
const DIALOG_WIDTHS = [1280, 761, 720, 621, 620, 601, 600, 521, 520, 400, 381, 375, 340, 320];
// hover／focus 抽查。
const STATE_WIDTHS = [1280, 600, 375];
const QUICK_WIDTHS = [1280, 375];
// 四種外觀都拍的寬度；其他寬度輪流交給 ROTATION 的兩組外觀。
const CORE_WIDTHS = [1280, 375];
const ROTATION = [["warm-light", "classic-dark"], ["classic-light", "warm-dark"]];
const VIEWPORT_HEIGHT = 900;
// max-height:560px 只用在擲骰視窗：擲骰畫面另外拍這些矮視窗。
const SHORT_VIEWPORTS = [{ width: 1280, height: 540 }, { width: 375, height: 540 }];
const JOB_TIMEOUT = 60000;
const FIRST_CAPTURE_WAIT = 800;
const VIEWPORT_TIMEOUT = 20000;
const FIXED_TIME = new Date("2026-01-15T10:30:00+08:00");
// 讓點陣化結果固定：單執行緒、無 GPU、固定色彩設定，避免同一份程式連拍兩次的 PNG 有抗鋸齒差異。
const RENDER_ARGS = ["--disable-gpu", "--disable-gpu-rasterization", "--num-raster-threads=1", "--disable-partial-raster", "--force-color-profile=srgb", "--disable-lcd-text", "--disable-checker-imaging"];
// 只有截圖不同、樣式與位置完全相同時，不同像素在這個數量以內視為點陣化雜訊。
// 實測：粗體中文經 Chrome 字型替代畫出時（例如 Arial Black 的「裝備」標題、900 字重的「削弱」標籤、虛線底線），
// 不同次啟動瀏覽器的抗鋸齒偶爾不同（同一次啟動內穩定），一處約 30～350 像素。
// 只算「明顯不同」的像素：任一色版差超過 PNG_NOISE_DELTA（0–255）。半透明或模糊圖層偶爾整片差 1～2 個色階，肉眼看不出來。
const PNG_NOISE_PIXELS = 500;
const PNG_NOISE_DELTA = 16;
const SKIP_TAGS = ["SCRIPT", "STYLE", "LINK", "META", "TEMPLATE", "NOSCRIPT", "TITLE", "BASE"];

// ---------- 測試角色 ----------
// 每份程式各自用同一套步驟建立角色，存下 localStorage 後，每個畫面都從這份資料重新載入頁面。
// 設定失敗的步驟會略過並記在 meta.json 的 setupWarnings（兩邊一起比對），不讓整份快照中斷。
const CHARACTERS = {
  blank: null,
  cleric: {
    class: "cleric", level: "5", race: "human", background: "acolyte", abilities: [10, 12, 14, 10, 16, 8], casting: "wis", hp: "30",
    prepare: ["guidance", "light", "sacred-flame", "thaumaturgy", "guiding-bolt", "healing-word", "shield-of-faith", "command", "spiritual-weapon", "prayer-of-healing", "lesser-restoration", "spirit-guardians"],
    items: ["繩索", "火把", "火把", "鱗甲", "釘頭錘", "盾牌"], equip: { mainHand: "釘頭錘", armor: "鱗甲" }, share: true
  },
  wizard: {
    class: "wizard", level: "5", race: "elf", background: "sage", abilities: [8, 14, 14, 16, 12, 10], casting: "int", hp: "22",
    prepare: ["fire-bolt", "mage-hand", "light", "shield", "magic-missile", "mage-armor", "misty-step", "fireball"]
  },
  fighter: { class: "fighter", level: "5", race: "dwarf", background: "soldier", abilities: [16, 14, 14, 10, 12, 8], hp: "40", items: ["長劍", "鎖子甲", "盾牌", "長弓"], equip: { mainHand: "長劍", armor: "鎖子甲" } },
  druid: { class: "druid", level: "5", race: "halfling", background: "fieldhand", abilities: [10, 14, 14, 12, 16, 8], casting: "wis", hp: "28", knownForms: true }
};

async function setupCharacter(page, name, warnings) {
  const spec = CHARACTERS[name];
  const step = async (label, action) => {
    try { await action(); } catch (error) { warnings.push(`${name} ${label}：${String(error.message || error).split("\n")[0]}`); }
  };
  await page.evaluate(() => document.getElementById("legal-close-btn")?.click());
  await step("legal", () => page.evaluate(() => { const box = document.getElementById("legal-dismiss"); if (box && !box.checked) box.click(); }));
  await page.locator("#class").selectOption(spec.class);
  await page.locator("#level").selectOption(spec.level);
  await page.locator("#race").selectOption(spec.race);
  await page.locator("#background").selectOption(spec.background);
  for (const [index, id] of ["str", "dex", "con", "int", "wis", "cha"].entries()) {
    await page.locator(`#${id}`).fill(String(spec.abilities[index]));
    await page.locator(`#${id}`).dispatchEvent("change");
  }
  if (spec.hp) await step("hp", async () => { await page.locator("#hp").fill(spec.hp); await page.locator("#hp").dispatchEvent("change"); });
  if (spec.casting) {
    await step("施法屬性", async () => {
      await showSheetTab(page, "spells");
      await page.locator("#spellcasting-ability").selectOption(spec.casting);
    });
  }
  if (spec.prepare) {
    await step("準備法術", async () => {
      await page.locator("#spell-prepare").click();
      const dialog = page.getByRole("dialog", { name: "管理已準備法術", exact: true });
      await dialog.waitFor();
      for (const id of spec.prepare) {
        await page.evaluate(spellId => {
          const input = [...document.querySelectorAll(".spell-picker-option input")].find(item => item.value === spellId);
          if (input && !input.checked && !input.disabled) input.click();
        }, id);
      }
      await dialog.getByRole("button", { name: "儲存", exact: true }).click();
      await dialog.waitFor({ state: "detached" });
    });
  }
  if (spec.items) {
    await step("物品", async () => {
      const missing = await page.evaluate(async names => {
        const found = names.map(itemName => [itemName, window.EQUIPMENT_SHOP_ITEMS.find(candidate => candidate.name === itemName)]);
        await window.MoneyTracker.purchaseItems(found.filter(([, item]) => item).map(([itemName, item]) => ({ name: itemName, amount: item.amount, currency: item.currency, quantity: 1 })), { free: true });
        return found.filter(([, item]) => !item).map(([itemName]) => itemName);
      }, spec.items);
      if (missing.length) throw new Error(`商店沒有 ${missing.join("、")}`);
    });
  }
  if (spec.equip) {
    await step("裝備", async () => {
      await showSheetTab(page, "equipment");
      for (const [id, itemName] of Object.entries(spec.equip)) {
        const value = await page.evaluate(([selectId, name]) => [...document.getElementById(selectId).options].find(option => option.textContent.includes(name))?.value, [id, itemName]);
        if (!value) throw new Error(`${id} 沒有 ${itemName}`);
        await page.locator(`#${id}`).selectOption(value);
      }
    });
  }
  if (spec.knownForms) {
    await step("已知形態", async () => {
      await page.evaluate(() => { window.TabletopMode.setMode("tabletop"); window.TabletopMode.setPanel("overview"); });
      await page.locator("#tabletop-druid-overview").getByRole("button", { name: "變形", exact: true }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("button", { name: "選擇已知形態" }).click();
      await dialog.getByRole("button", { name: "套用推薦組合" }).click();
      await dialog.getByRole("button", { name: "儲存已知形態" }).click();
      await page.keyboard.press("Escape");
      await page.evaluate(() => window.TabletopMode.setMode("sheet"));
    });
  }
  await page.evaluate(() => { window.showTab?.("basic"); window.AppDialog?.dismissToasts?.(); });
  await page.waitForTimeout(300);
  await page.evaluate(() => { window.saveAllFields?.(); });
  if (spec.share) return page.evaluate(async () => window.encodeStateToHash(window.collectShareState()));
  return null;
}

// ---------- 畫面 ----------
// group：page 用 PAGE_WIDTHS，dialog 用 DIALOG_WIDTHS。char：載入哪個測試角色。
// run(page, h)：從剛載入完成的頁面進到要拍的狀態。h 是共用小工具。
const SCREENS = [];
const screen = (id, group, char, run, extra = {}) => SCREENS.push({ id, group, char, run, ...extra });

// 切換分頁後先等版面穩定再點按鈕：Playwright 點擊會把按鈕捲進畫面，版面還在變時捲動位置就不固定。
const showSheetTab = async (page, tab) => { await page.evaluate(name => window.showTab(name), tab); await page.evaluate(settlePage); };
const sheetTab = tab => page => showSheetTab(page, tab);
const tabletop = async (page, h, tab) => {
  await page.evaluate(() => window.TabletopMode.setMode("tabletop"));
  await h.settle();
  await h.click(`#tabletop-tab-${tab}`);
  await h.settle();
};
const lastDialog = page => page.locator(".app-dialog").last();
const wildShape = async (page, h) => {
  await tabletop(page, h, "overview");
  await page.locator("#tabletop-druid-overview").getByRole("button", { name: "變形", exact: true }).click();
  await lastDialog(page).locator('.druid-form-card[data-beast="wolf"]').click();
  await lastDialog(page).getByRole("button", { name: "變成狼", exact: true }).click();
  await page.waitForFunction(() => window.TabletopMode.getDruidForm()?.key === "wolf");
};
const quickBuildStep = (stepId, choices) => async (page, h) => {
  await page.evaluate(([id, picked]) => {
    const draft = window.quickBuild.createDraft();
    Object.assign(draft.choices, picked);
    draft.ui.currentStepId = id;
    window.dndStorage.setItem(window.quickBuild.storageKey, JSON.stringify(draft));
    window.quickBuild.open();
  }, [stepId, choices]);
  await page.locator("#quick-build-wizard.open").waitFor();
};
const QB_CHOICES = { background: "soldier", race: "dwarf", class: "fighter", classEquipmentMethod: "gold", classOptions: { skills: ["察覺", "求生"] } };
// 會回傳「關閉時才完成」的 Promise 的 API，一律包在大括號裡不回傳，否則 page.evaluate 會一直等。
const openShop = async page => {
  await page.evaluate(() => { void window.EquipmentShop.open(); });
  await page.locator('.app-dialog[data-variant="equipment-shop"]').waitFor();
};

// 角色卡各頁（一般模式）
for (const tab of ["basic", "skills", "equipment", "actions", "spells"]) screen(`sheet-${tab}`, "page", "cleric", sheetTab(tab));
screen("sheet-basic-fighter", "page", "fighter", sheetTab("basic"));
screen("sheet-equipment-fighter", "page", "fighter", sheetTab("equipment"));
screen("sheet-actions-fighter", "page", "fighter", sheetTab("actions"));
screen("sheet-spells-wizard", "page", "wizard", sheetTab("spells"));
screen("sheet-basic-blank", "page", "blank", async page => { await page.evaluate(() => document.getElementById("legal-close-btn")?.click()); });
// 跑團模式各分頁
for (const tab of ["overview", "skills", "actions", "spells", "resources"]) screen(`tt-${tab}`, "page", "cleric", (page, h) => tabletop(page, h, tab));
screen("tt-actions-fighter", "page", "fighter", (page, h) => tabletop(page, h, "actions"));
screen("tt-resources-fighter", "page", "fighter", (page, h) => tabletop(page, h, "resources"));
screen("tt-overview-druid", "page", "druid", (page, h) => tabletop(page, h, "overview"));
screen("tt-overview-druid-wolf", "page", "druid", wildShape);
screen("tt-actions-druid-wolf", "page", "druid", async (page, h) => { await wildShape(page, h); await h.click("#tabletop-tab-actions"); });
screen("tt-spells-druid-wolf", "page", "druid", async (page, h) => { await wildShape(page, h); await h.click("#tabletop-tab-spells"); });
// 分享模式（唯讀角色卡）
screen("share-welcome", "dialog", "share:cleric", async () => {}, { keepLegal: true });
screen("share-basic", "page", "share:cleric", sheetTab("basic"));
screen("share-spells", "page", "share:cleric", sheetTab("spells"));
screen("share-tabletop", "page", "share:cleric", (page, h) => tabletop(page, h, "overview"));

// 歡迎／Legal、工具選單、導覽
screen("legal", "dialog", "blank", async () => {}, { keepLegal: true });
screen("legal-about", "dialog", "cleric", async page => { await page.evaluate(() => { location.hash = "legal-about-modal"; }); await page.locator(".legal-about-body, .app-dialog").last().waitFor(); await page.waitForTimeout(300); });
screen("utility-menu", "dialog", "cleric", async page => { await page.locator("#utility-menu-toggle").click(); });
// 導覽會攔截點擊（無法用主題開關切換外觀），位置也是 JS 量出來的：每種外觀各自載入，拍攝前觸發 resize 讓它重新定位。
// 導覽說明框的文字點陣化偶爾不同（樣式與位置相同），所以導覽畫面的 PNG 只供參考（pngAdvisory），樣式與位置照常比對。
// 導覽用 JS 動畫捲動、計時器定位：反覆觸發 resize，直到聚焦框、說明框與捲動位置連續三次相同（最多約 6 秒）。
const relayout = async page => {
  let previous = "";
  let same = 0;
  await page.waitForTimeout(500);
  for (let round = 0; round < 24; round += 1) {
    await page.evaluate(() => window.dispatchEvent(new Event("resize")));
    await page.waitForTimeout(250);
    const current = await page.evaluate(() => JSON.stringify([scrollX, scrollY, ...["#tour-focus-ring", ".tour-tooltip, #tour-tooltip", "#tour-overlay"].map(selector => {
      const rect = document.querySelector(selector)?.getBoundingClientRect();
      return rect ? [rect.x, rect.y, rect.width, rect.height] : null;
    })]));
    same = current === previous ? same + 1 : 0;
    if (same >= 2) return;
    previous = current;
  }
};
const tourStep = step => page => page.waitForFunction(text => document.getElementById("tour-step-progress")?.textContent.startsWith(text), `${step}/`);
const TOUR = { perAppearance: true, beforeCapture: relayout, pngAdvisory: true };
screen("onboarding", "dialog", "cleric", async page => { await page.locator("#utility-menu-toggle").click(); await page.locator("#restart-onboarding-btn").click(); await tourStep(1)(page); }, TOUR);
// 第一步分兩段（同樣顯示 1/8），所以「下一步」之後等說明文字換掉，而不是等 2/8。
screen("onboarding-step2", "dialog", "cleric", async page => {
  await page.locator("#utility-menu-toggle").click();
  await page.locator("#restart-onboarding-btn").click();
  await tourStep(1)(page);
  await relayout(page);
  const before = await page.locator("#tour-step-text").textContent();
  await page.locator("#tour-next-btn").click();
  await page.waitForFunction(text => document.getElementById("tour-step-text")?.textContent !== text, before);
}, TOUR);
// 「初次遊玩」按鈕和自己點開的工具選單會互相搶時間（第一步的文字會不同）：直接呼叫導覽的 API，選單保持關閉。
screen("tabletop-tour", "dialog", "cleric", async page => { await page.evaluate(() => { void onboardingTour.startTabletop(); }); await tourStep(1)(page); }, TOUR);
// 快速創角各步驟
screen("qb-background", "dialog", "blank", async page => { await page.evaluate(() => document.getElementById("legal-close-btn")?.click()); await page.locator("#utility-menu-toggle").click(); await page.locator("#help-quick-build-btn").click(); await page.locator("#quick-build-wizard.open").waitFor(); });
screen("qb-race", "dialog", "blank", quickBuildStep("race", { background: "soldier" }));
screen("qb-class", "dialog", "blank", quickBuildStep("class", { background: "soldier", race: "dwarf" }));
screen("qb-class-cleric", "dialog", "blank", quickBuildStep("class", { background: "acolyte", race: "human", class: "cleric" }));
screen("qb-equipment", "dialog", "blank", quickBuildStep("equipment", QB_CHOICES));
screen("qb-shop", "dialog", "blank", async (page, h) => {
  await quickBuildStep("equipment", QB_CHOICES)(page, h);
  await h.settle();
  await page.locator('#quick-build-wizard [data-wealth="gold"]').click();
  // 選了金幣後精靈會平滑捲動：等捲動停下再開商店，否則背後精靈的捲動位置不固定。
  await page.locator("#quick-build-shop-open").waitFor();
  await h.settle();
  await page.locator("#quick-build-shop-open").click();
  await page.locator('.app-dialog[data-variant="equipment-shop"]').waitFor();
});
// 商店、購物清單、物品欄
screen("shop", "dialog", "cleric", openShop);
screen("shop-cart", "dialog", "cleric", async page => {
  await openShop(page);
  const shop = page.locator('.app-dialog[data-variant="equipment-shop"]');
  for (const name of ["繩索", "火把", "火把"]) {
    await shop.locator(".equipment-shop__search").fill(name);
    await shop.getByRole("button", { name: `加入購物清單：${name}`, exact: true }).click();
  }
  await shop.locator(".equipment-shop__cart-button").click();
  await page.locator('.app-dialog[data-variant="equipment-shop-cart"]').waitFor();
});
screen("inventory-item", "dialog", "cleric", async page => { await showSheetTab(page, "equipment"); await page.locator("#tab-equipment button.inventory-tag").first().click(); await lastDialog(page).waitFor(); });
screen("inventory-add", "dialog", "cleric", async page => { await showSheetTab(page, "equipment"); await page.locator("#inventory-add").click(); await lastDialog(page).waitFor(); });
screen("inventory-more", "dialog", "cleric", async page => { await showSheetTab(page, "equipment"); await page.locator("#inventory-more").click(); });
screen("money-adjust", "dialog", "cleric", async page => { await showSheetTab(page, "equipment"); await page.locator("#inventory-more").click(); await page.locator("#money-adjust-toggle").click(); });
// 法術：準備、法術書、查閱、詳情
screen("spell-prepare", "dialog", "cleric", async page => { await showSheetTab(page, "spells"); await page.locator("#spell-prepare").click(); await page.getByRole("dialog", { name: "管理已準備法術", exact: true }).waitFor(); });
screen("spell-prepare-wizard", "dialog", "wizard", async page => { await showSheetTab(page, "spells"); await page.locator("#spell-prepare").click(); await lastDialog(page).waitFor(); });
screen("spellbook", "dialog", "wizard", async page => { await showSheetTab(page, "spells"); await page.locator("#spellbook-manage").click(); await lastDialog(page).waitFor(); });
screen("spell-browse", "dialog", "cleric", async page => { await showSheetTab(page, "spells"); await page.locator("#spell-search-fab").click(); await page.locator("#spell-browse-button").click(); await lastDialog(page).waitFor(); });
screen("spell-detail", "dialog", "cleric", async page => { await page.evaluate(() => { window.showTab("spells"); void window.TabletopSpells.showSpellDetail("guiding-bolt"); }); await lastDialog(page).waitFor(); });
screen("spell-detail-srd", "dialog", "cleric", async page => {
  await page.evaluate(() => { window.showTab("spells"); void window.TabletopSpells.showSpellDetail("guiding-bolt"); });
  await lastDialog(page).locator('.spell-version__tab[data-spell-version="srd"]').click();
  await lastDialog(page).locator(".spell-version__attribution").waitFor();
});
screen("spell-search", "dialog", "cleric", async page => { await showSheetTab(page, "spells"); await page.locator("#spell-search-fab").click(); await page.locator("#spell-search").fill("火"); await page.locator("#spell-search-button").click(); await page.waitForTimeout(400); });
screen("equipment-search", "dialog", "cleric", async page => { await showSheetTab(page, "equipment"); await page.locator("#equipment-search-fab").click(); await page.locator("#equipment-search").fill("劍"); await page.locator("#equipment-search-button").click(); await page.waitForTimeout(400); });
// 角色能力視窗
screen("features-cleric", "dialog", "cleric", async page => { await page.evaluate(() => window.openCharacterFeatures("class")); await page.locator("#character-features-modal").waitFor({ state: "visible" }); });
screen("features-creation", "dialog", "cleric", async page => { await page.evaluate(() => window.openCharacterFeatures("creation")); await page.locator("#character-features-modal").waitFor({ state: "visible" }); });
screen("features-background", "dialog", "cleric", async page => { await page.evaluate(() => window.openCharacterFeatures("background")); await page.locator("#character-features-modal").waitFor({ state: "visible" }); });
screen("features-race", "dialog", "cleric", async page => { await page.evaluate(() => window.openCharacterFeatures("race")); await page.locator("#character-features-modal").waitFor({ state: "visible" }); });
screen("features-fighter", "dialog", "fighter", async page => { await page.evaluate(() => window.openCharacterFeatures("class")); await page.locator("#character-features-modal").waitFor({ state: "visible" }); });
screen("features-druid", "dialog", "druid", async page => { await page.evaluate(() => window.openCharacterFeatures("class")); await page.locator("#character-features-modal").waitFor({ state: "visible" }); });
screen("druid-shape", "dialog", "druid", async (page, h) => { await tabletop(page, h, "overview"); await page.locator("#tabletop-druid-overview").getByRole("button", { name: "變形", exact: true }).click(); await lastDialog(page).locator(".druid-form-card").first().waitFor(); });
screen("druid-known", "dialog", "druid", async (page, h) => {
  await tabletop(page, h, "overview");
  await page.locator("#tabletop-druid-overview").getByRole("button", { name: "變形", exact: true }).click();
  await lastDialog(page).getByRole("button", { name: /已知形態/u }).first().click();
  await lastDialog(page).locator(".druid-known-list, .druid-known-form").first().waitFor();
});
screen("druid-beast-card", "dialog", "druid", async (page, h) => { await wildShape(page, h); await page.locator("#tabletop-druid-overview").getByRole("button", { name: "野獸資料", exact: true }).click(); await lastDialog(page).locator(".beast-card").waitFor(); });
// 其他視窗
screen("journal", "dialog", "cleric", async page => { await page.locator("#utility-menu-toggle").click(); await page.locator("#adventure-journal-btn").click(); await page.waitForTimeout(500); });
screen("dice", "dialog", "cleric", async page => {
  await page.locator("#utility-menu-toggle").click();
  await page.locator("#dice-system-toggle").check();
  await page.locator("#utility-menu-toggle").click();
  await page.locator("#dice-roller-fab").click();
  await page.locator('.dice-roller-die[data-die="20"]').click();
  await page.locator("#dice-roller-roll").click();
  // 擲骰結果與歷史紀錄是計時器補上的：等紀錄寫入、結果出現再拍。
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("dnd.diceRollHistory.v1") || "[]").length > 0 && document.querySelector(".dice-roller-result"));
  await page.waitForTimeout(300);
}, { short: true, perAppearance: true });
// toast 會依計時器自動消失：每次拍攝前都清掉重發一次。
const showToasts = async page => {
  await page.evaluate(() => {
    window.AppDialog.dismissToasts();
    window.AppDialog.notify("已儲存角色資料。");
    window.AppDialog.notify("請先選擇職業。", { tone: "warning" });
    window.AppDialog.notify("無法讀取檔案。", { tone: "error" });
  });
};
screen("toast", "dialog", "cleric", showToasts, { keepToasts: true, beforeCapture: showToasts });
screen("message-dialog", "dialog", "cleric", async page => { await page.evaluate(() => { window.AppDialog.requestDecision({ title: "確認清除", message: "要清除這筆紀錄嗎？", confirmLabel: "清除", cancelLabel: "取消", tone: "danger" }); }); await lastDialog(page).waitFor(); });
screen("short-rest", "dialog", "cleric", async (page, h) => { await tabletop(page, h, "resources"); await page.locator('[data-rest="shortRest"]').first().click(); await lastDialog(page).waitFor(); });
screen("long-rest", "dialog", "cleric", async (page, h) => { await tabletop(page, h, "resources"); await page.locator('[data-rest="longRest"]').first().click(); await lastDialog(page).waitFor(); });
screen("share-dialog", "dialog", "cleric", async page => { await page.evaluate(() => { void window.copyShareUrl(); }); await page.locator('.app-dialog[data-variant="share-character"]').waitFor(); });
screen("money-log", "dialog", "cleric", async page => { await showSheetTab(page, "equipment"); await page.locator("#money-log-toggle").click(); await page.waitForTimeout(300); });
screen("custom-background", "dialog", "cleric", async page => { await page.evaluate(() => { void window.CustomBackground.open(); }); await lastDialog(page).waitFor(); });
screen("ability-choice", "dialog", "cleric", async page => { await page.locator("#utility-menu-toggle").click(); await page.locator("#set-default-abilities").click(); await page.locator("#ability-choice-modal").waitFor({ state: "visible" }); });
screen("point-buy", "dialog", "cleric", async page => { await page.locator("#utility-menu-toggle").click(); await page.locator("#set-default-abilities").click(); await page.locator("#ability-choice-point-buy").click(); await page.locator("#point-buy-modal").waitFor({ state: "visible" }); });
screen("deity", "dialog", "cleric", async page => { await page.locator("#utility-menu-toggle").click(); await page.locator("#reference-deities-btn").click(); await page.waitForTimeout(400); });
screen("qr", "dialog", "cleric", async page => { await page.locator("#utility-menu-toggle").click(); await page.locator("#open-qr-btn").click(); await page.waitForTimeout(400); });
screen("condition", "dialog", "cleric", async (page, h) => { await tabletop(page, h, "overview"); await page.locator("#tabletop-condition-manage").click(); await page.locator("#tabletop-condition-modal").waitFor({ state: "visible" }); });
screen("tt-avatar", "dialog", "cleric", async (page, h) => { await tabletop(page, h, "overview"); await page.locator("#tabletop-avatar-file").setInputFiles(path.join(REPO, "og-image.jpg")); await page.locator("#tabletop-avatar-modal").waitFor({ state: "visible" }); });
screen("tt-custom-spell", "dialog", "cleric", async (page, h) => { await tabletop(page, h, "spells"); await page.locator("#tabletop-custom-spells-toggle").click(); await page.locator("#tabletop-custom-spells-add").click(); await lastDialog(page).waitFor(); });
screen("tt-action-manage", "dialog", "cleric", async (page, h) => { await tabletop(page, h, "actions"); await page.locator("#tabletop-action-manage").click(); await lastDialog(page).waitFor(); });

// 主要按鈕的 hover／focus：用 CDP CSS.forcePseudoState 同時強制每個選擇器的第一個元素。找不到的選擇器記在快照裡，兩邊一起比對。
// 注意：:hover 只強制在元素本身，不會像真的滑鼠一樣套到祖先元素。
const forceStates = async (page, states, selectors) => {
  const client = await page.context().newCDPSession(page);
  await client.send("DOM.enable");
  await client.send("CSS.enable");
  const { root } = await client.send("DOM.getDocument", { depth: 0 });
  const forced = [];
  for (const selector of selectors) {
    const { nodeId } = await client.send("DOM.querySelector", { nodeId: root.nodeId, selector });
    if (!nodeId) { forced.push(`${selector}（找不到）`); continue; }
    await client.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: states });
    forced.push(selector);
  }
  return { forced };
};
const STATE_TARGETS = {
  sheet: ["#sheet-tabs-row .tab-button:not(.active)", "#basic-tab-button", "#utility-menu-toggle", ".mini-stat-label--features", "#class", "#str", "#hp", "#manual-feat-management", "#character-choice-warning-toggle", "#tab-basic .feat-row button, #tab-basic button.feat-toggle", "footer a, .site-footer a"],
  equipment: ["#equipment-shop-open", "#inventory-add", "#tab-equipment button.inventory-tag", "#inventory-more", "#money-adjust-toggle", "#money-submit-btn", "#atk-main-mastery"],
  spells: ["#spell-prepare", "#spell-primer-trigger", "#spell-browse-button", "#spellcasting-ability", "#tab-spells [data-spell-id]", "#tab-spells input[type=checkbox]"],
  tabletop: ["#tabletop-tab-skills", "#tabletop-return-to-sheet", "#tabletop-condition-manage", "#tabletop-temporary-hp-toggle", ".tabletop-primary-button", "#tabletop-action-notes", "#tabletop-life-amount"],
  dialog: [".app-dialog .app-dialog__close", ".equipment-shop__search", ".equipment-shop__category-toggle", ".equipment-shop__cart-button", '.app-dialog button[aria-label^="加入購物清單"]', ".app-dialog [data-shop-checkout]"]
};
for (const [states, suffix] of [[["hover"], "hover"], [["focus", "focus-visible", "focus-within"], "focus"]]) {
  screen(`state-sheet-${suffix}`, "state", "cleric", page => forceStates(page, states, STATE_TARGETS.sheet));
  screen(`state-equipment-${suffix}`, "state", "cleric", async page => { await showSheetTab(page, "equipment"); return forceStates(page, states, STATE_TARGETS.equipment); });
  screen(`state-spells-${suffix}`, "state", "cleric", async page => { await showSheetTab(page, "spells"); return forceStates(page, states, STATE_TARGETS.spells); });
  screen(`state-tabletop-${suffix}`, "state", "cleric", async (page, h) => { await tabletop(page, h, "overview"); return forceStates(page, states, STATE_TARGETS.tabletop); });
  screen(`state-shop-${suffix}`, "state", "cleric", async page => { await openShop(page); return forceStates(page, states, STATE_TARGETS.dialog); });
}

// ---------- 頁面內執行的函式 ----------
function installStability() {
  let seed = 0x2545f491;
  const random = () => {
    seed ^= seed << 13; seed >>>= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5; seed >>>= 0;
    return seed / 4294967296;
  };
  Math.random = random;
  if (window.crypto) {
    const fill = array => {
      if (array instanceof BigInt64Array || array instanceof BigUint64Array) { for (let i = 0; i < array.length; i += 1) array[i] = BigInt(Math.floor(random() * 2 ** 32)); return array; }
      const max = 2 ** (array.BYTES_PER_ELEMENT * 8);
      for (let i = 0; i < array.length; i += 1) array[i] = Math.floor(random() * max);
      return array;
    };
    try { Object.defineProperty(window.crypto, "getRandomValues", { value: fill, configurable: true }); } catch {}
    try {
      Object.defineProperty(window.crypto, "randomUUID", { configurable: true, value: () => {
        const b = fill(new Uint8Array(16)); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
        const x = [...b].map(v => v.toString(16).padStart(2, "0")).join("");
        return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
      } });
    } catch {}
  }
}

function installStorage({ entries, theme, mode }) {
  try {
    localStorage.clear();
    sessionStorage.clear();
    for (const [key, value] of Object.entries(entries || {})) localStorage.setItem(key, value);
    localStorage.setItem("dnd.theme.v1", mode);
    localStorage.setItem("dnd.uiTheme.v1", theme);
  } catch {}
}

// 跑完所有進行中與無限的動畫、transition，讓 computed style 停在最終值；不覆寫任何 CSS 宣告。
async function settlePage() {
  const frame = () => new Promise(resolve => requestAnimationFrame(() => resolve()));
  const fingerprint = () => {
    const scrollers = [...document.querySelectorAll("*")].filter(el => el.scrollTop || el.scrollLeft).map(el => `${el.scrollTop},${el.scrollLeft}`).join("|");
    return `${scrollX},${scrollY}|${scrollers}|${document.querySelectorAll("*").length}`;
  };
  await document.fonts?.ready;
  let previous = "";
  for (let round = 0; round < 20; round += 1) {
    for (const animation of document.getAnimations()) {
      try {
        const timing = animation.effect?.getComputedTiming?.();
        if (timing && Number.isFinite(timing.endTime)) animation.finish();
        else animation.cancel();
      } catch { try { animation.cancel(); } catch {} }
    }
    await frame();
    await frame();
    await new Promise(resolve => setTimeout(resolve, round < 2 ? 60 : 120));
    // 中文字型依 unicode-range 分段、用到才下載：每一輪都等字型載完，否則同一張圖偶爾會先畫出替代字型。
    await document.fonts?.ready;
    const current = fingerprint();
    if (current === previous && document.fonts?.status !== "loading" && !document.getAnimations().some(animation => animation.playState === "running")) return round;
    previous = current;
  }
  return -1;
}

// 頁面內：元素路徑（只數 SKIP_TAGS 以外的元素）、::placeholder 與 ::backdrop 的 computed style（DOMSnapshot 不含這兩種）、頁面資訊。
function pageExtras({ skipTags, props }) {
  const skip = new Set(skipTags);
  const extras = [];
  const walk = (el, nodePath) => {
    const style = getComputedStyle(el);
    if (style.display === "none") return;
    const pick = name => { const pseudo = getComputedStyle(el, name); return props.map(prop => pseudo.getPropertyValue(prop)); };
    if ((el.tagName === "INPUT" || el.tagName === "TEXTAREA") && el.hasAttribute("placeholder")) extras.push([nodePath, "::placeholder", pick("::placeholder")]);
    if (el.matches(":modal, :popover-open")) extras.push([nodePath, "::backdrop", pick("::backdrop")]);
    let index = 0;
    for (const child of el.children) {
      if (skip.has(child.tagName)) continue;
      walk(child, `${nodePath}/${child.tagName.toLowerCase()}${index}`);
      index += 1;
    }
  };
  walk(document.documentElement, "html");
  const root = document.documentElement;
  return { extras, page: { width: root.scrollWidth, height: root.scrollHeight, scrollX, scrollY, viewMode: root.dataset.viewMode || "", theme: root.dataset.theme || "", uiTheme: root.dataset.uiTheme || "" } };
}

// 用 CDP DOMSnapshot 一次取得所有「有畫出來」的元素與偽元素（::before、::after、::marker 等）的 computed style 與位置大小。
// display:none 的元素不在清單裡，因此元素被藏起來或多出來都會被比出來。路徑規則與 pageExtras 相同。
async function captureDom(client, page) {
  const props = await page.evaluate(() => [...getComputedStyle(document.documentElement)].filter(name => !name.startsWith("--")).sort());
  const [snapshot, extra] = await Promise.all([
    client.send("DOMSnapshot.captureSnapshot", { computedStyles: props }),
    page.evaluate(pageExtras, { skipTags: SKIP_TAGS, props })
  ]);
  const strings = snapshot.strings;
  const doc = snapshot.documents[0];
  const { parentIndex, nodeType, nodeName, attributes } = doc.nodes;
  const pseudoType = new Map((doc.nodes.pseudoType?.index || []).map((nodeIndex, i) => [nodeIndex, strings[doc.nodes.pseudoType.value[i]]]));
  const skip = new Set(SKIP_TAGS);
  const paths = new Array(parentIndex.length);
  const counters = new Map();
  const labels = new Array(parentIndex.length);
  for (let i = 0; i < parentIndex.length; i += 1) {
    if (nodeType[i] !== 1) continue;
    const parent = parentIndex[i];
    const name = strings[nodeName[i]] ?? "";
    if (pseudoType.has(i)) { if (paths[parent]) paths[i] = `${paths[parent]}::${pseudoType.get(i)}`; continue; }
    const tag = name.toUpperCase();
    if (skip.has(tag)) continue;
    if (parent < 0 || nodeType[parent] === 9) { paths[i] = tag.toLowerCase(); }
    else {
      if (!paths[parent]) continue;
      const index = counters.get(parent) || 0;
      counters.set(parent, index + 1);
      paths[i] = `${paths[parent]}/${tag.toLowerCase()}${index}`;
    }
    const attrs = attributes[i] || [];
    let id = "";
    let className = "";
    for (let a = 0; a < attrs.length; a += 2) {
      const key = strings[attrs[a]];
      if (key === "id") id = strings[attrs[a + 1]] ?? "";
      else if (key === "class") className = strings[attrs[a + 1]] ?? "";
    }
    const classes = className.trim().split(/\s+/).filter(Boolean).slice(0, 3);
    labels[i] = `${tag.toLowerCase()}${id ? `#${id}` : ""}${classes.length ? `.${classes.join(".")}` : ""}`;
  }
  const valueIds = new Map();
  const values = [];
  const styleIds = new Map();
  const styles = [];
  const internValues = list => {
    const ids = list.map(value => { let id = valueIds.get(value); if (id === undefined) { id = values.length; values.push(value); valueIds.set(value, id); } return id; });
    const key = ids.join(",");
    let id = styleIds.get(key);
    if (id === undefined) { id = styles.length; styles.push(ids); styleIds.set(key, id); }
    return id;
  };
  const round = value => Math.round(value * 64) / 64;
  const byPath = new Map();
  const nodes = [];
  const seen = new Set();
  const layout = doc.layout;
  for (let l = 0; l < layout.nodeIndex.length; l += 1) {
    const i = layout.nodeIndex[l];
    if (seen.has(i) || !paths[i]) continue;
    seen.add(i);
    const styleId = internValues(layout.styles[l].map(index => strings[index] ?? ""));
    const box = layout.bounds[l].map(round);
    if (pseudoType.has(i)) {
      const owner = byPath.get(paths[parentIndex[i]]);
      if (owner) { owner[7] = owner[7] || {}; owner[7][`::${pseudoType.get(i)}`] = [styleId, ...box]; }
      continue;
    }
    const node = [paths[i], labels[i], styleId, ...box];
    byPath.set(paths[i], node);
    nodes.push(node);
  }
  for (const [nodePath, pseudo, list] of extra.extras) {
    const owner = byPath.get(nodePath);
    if (owner) { owner[7] = owner[7] || {}; owner[7][pseudo] = [internValues(list)]; }
  }
  return { props, values, styles, nodes, page: extra.page };
}

// ---------- 伺服器 ----------
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".otf": "font/otf", ".ico": "image/x-icon", ".pdf": "application/pdf", ".webmanifest": "application/manifest+json" };
function startServer(root) {
  const server = http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname); } catch { return res.writeHead(400).end(); }
    if (pathname === "/class-content.private.generated.js") {
      res.setHeader("Content-Type", MIME[".js"]);
      return res.end("// visual-snapshot: private content excluded\n");
    }
    const file = path.resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
      if (error) return res.writeHead(404).end();
      res.setHeader("Content-Type", MIME[path.extname(file).toLowerCase()] || "application/octet-stream");
      res.setHeader("Cache-Control", "no-store");
      res.end(data);
    });
  });
  // Node 預設 5 秒關掉閒置連線，剛好碰上 Chromium 重用時，樣式表會載入失敗、整頁沒有樣式：關掉這個逾時。
  server.keepAliveTimeout = 0;
  return new Promise(resolve => server.listen(0, "127.0.0.1", () => resolve(server)));
}

// ---------- git ref 暫存副本 ----------
function git(args, options = {}) {
  return execFileSync("git", args, { cwd: REPO, maxBuffer: 1 << 30, ...options });
}

function extractRef(ref) {
  const commit = git(["rev-parse", "--verify", `${ref}^{commit}`]).toString().trim();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "twd20-visual-ref-"));
  try {
    const archive = git(["archive", "--format=tar", commit]);
    // 用 cwd 而不是 -C：Git Bash 的 GNU tar 會把「C:\…」當成遠端主機。
    execFileSync("tar", ["-xf", "-"], { cwd: dir, input: archive, maxBuffer: 1 << 30 });
  } catch (error) {
    removeDir(dir);
    throw error;
  }
  return { dir, commit };
}

function buildIn(dir) {
  const env = { ...process.env, NODE_PATH: [path.join(REPO, "node_modules"), process.env.NODE_PATH].filter(Boolean).join(path.delimiter) };
  execFileSync(process.execPath, [path.join(dir, "tools", "build.js")], { cwd: dir, env, stdio: ["ignore", "ignore", "inherit"] });
}

function removeDir(dir) {
  if (!dir || !dir.startsWith(os.tmpdir())) return;
  fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
}

// ---------- 拍快照 ----------
function parseList(value) { return String(value).split(",").map(item => item.trim()).filter(Boolean); }

// 一個「工作」＝一個畫面：載入一次、進到要拍的狀態，再依序縮放寬度（由寬到窄），每個寬度用網站自己的主題開關切換外觀後拍攝。
// CORE_WIDTHS 四種外觀都拍；其他寬度輪流交給 ROTATION 的兩組外觀，每個寬度都有經典與暖紙、亮與暗。
// --quick、--appearance、--every 與 hover／focus 畫面，每種外觀都拍每個寬度。
// perAppearance 的畫面（JS 依主題選圖的擲骰）每種外觀各自重新載入；--fresh 則每張都重新載入。
function planFor(screenDef, options, appearances) {
  let widths;
  if (options.widths === "all") widths = FULL_WIDTHS;
  else if (Array.isArray(options.widths)) widths = options.widths;
  else if (options.quick) widths = QUICK_WIDTHS;
  else widths = { page: PAGE_WIDTHS, dialog: DIALOG_WIDTHS, state: STATE_WIDTHS }[screenDef.group];
  const everyone = options.quick || options.every || options.appearance || screenDef.group === "state";
  const steps = [];
  let rotation = 0;
  for (const width of [...new Set(widths)].sort((a, b) => b - a)) {
    const owners = everyone || CORE_WIDTHS.includes(width) ? null : ROTATION[rotation++ % ROTATION.length];
    const list = appearances.filter(appearance => !owners || owners.includes(appearance.id));
    if (list.length) steps.push({ viewport: { width, height: VIEWPORT_HEIGHT }, appearances: list });
  }
  if (screenDef.short && !options.quick && !Array.isArray(options.widths)) for (const viewport of SHORT_VIEWPORTS) steps.push({ viewport, appearances });
  if (options.fresh) return steps.flatMap(step => step.appearances.map(appearance => ({ screenDef, steps: [{ viewport: step.viewport, appearances: [appearance] }] })));
  if (screenDef.perAppearance) return appearances.map(appearance => ({ screenDef, steps: steps.filter(step => step.appearances.includes(appearance)).map(step => ({ viewport: step.viewport, appearances: [appearance] })) })).filter(job => job.steps.length);
  return steps.length ? [{ screenDef, steps }] : [];
}

function selectScreens(options) {
  if (!options.only) return SCREENS;
  const patterns = parseList(options.only);
  const picked = SCREENS.filter(item => patterns.some(pattern => item.id === pattern || (pattern.endsWith("-") && item.id.startsWith(pattern))));
  if (!picked.length) throw new Error(`--only 沒有對到任何畫面：${options.only}`);
  return picked;
}

function selectAppearances(options) {
  if (!options.appearance) return APPEARANCES;
  const ids = parseList(options.appearance);
  const picked = APPEARANCES.filter(item => ids.includes(item.id));
  if (picked.length !== ids.length) throw new Error(`--appearance 只能是 ${APPEARANCES.map(item => item.id).join("、")}`);
  return picked;
}

async function newContext(browser, viewport) {
  const context = await browser.newContext({
    viewport, deviceScaleFactor: 1, locale: "zh-TW", timezoneId: "Asia/Taipei", colorScheme: "light", reducedMotion: "no-preference", serviceWorkers: "block"
  });
  await context.clock.setFixedTime(FIXED_TIME);
  await context.addInitScript(installStability);
  return context;
}

async function prepareCharacters(browser, baseUrl, names) {
  const fixtures = { blank: {}, warnings: [], share: {} };
  for (const name of names) {
    if (name === "blank" || fixtures[name]) continue;
    const context = await newContext(browser, { width: 1280, height: VIEWPORT_HEIGHT });
    try {
      const page = await context.newPage();
      await page.addInitScript(installStorage, { entries: {}, theme: "classic", mode: "light" });
      await page.goto(baseUrl);
      await page.evaluate(settlePage);
      const hash = await setupCharacter(page, name, fixtures.warnings);
      if (hash) fixtures.share[name] = hash;
      // 只取這一刻的 localStorage；之後每個畫面都以它為起點，不再執行初始化 script 以外的寫入。
      fixtures[name] = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(key => key !== "dnd.theme.v1" && key !== "dnd.uiTheme.v1").map(key => [key, localStorage.getItem(key)])));
    } finally {
      await context.close();
    }
  }
  return fixtures;
}

function helpers(page, baseUrl) {
  return {
    baseUrl,
    settle: () => page.evaluate(settlePage),
    click: async selector => {
      const ok = await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return false; el.click(); return true; }, selector);
      if (!ok) throw new Error(`找不到 ${selector}`);
    },
    wait: ms => page.waitForTimeout(ms)
  };
}

// 剛打開視窗時，背後的圖層偶爾還沒畫完：連拍到兩張完全相同為止（最多 5 張）。
async function stableScreenshot(page, fullPage) {
  const shoot = () => page.screenshot({ fullPage, animations: "disabled", caret: "hide", timeout: 30000 });
  let png = await shoot();
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await page.waitForTimeout(100);
    const next = await shoot();
    if (next.equals(png)) return { png, stable: true };
    png = next;
  }
  return { png, stable: false };
}

const captureName = (appearance, viewport) => `${appearance.id}-${viewport.width}x${viewport.height}`;

// 用網站自己的主題開關（change／click 事件）切換外觀，不直接改屬性。
function switchAppearance({ theme, mode }) {
  const root = document.documentElement;
  const toggle = document.getElementById("theme-toggle");
  if ((root.dataset.uiTheme === "warm") !== (theme === "warm") && toggle) {
    toggle.checked = theme === "warm";
    toggle.dispatchEvent(new Event("change", { bubbles: true }));
  }
  if ((root.dataset.theme === "dark") !== (mode === "dark")) document.getElementById("color-mode-toggle")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  return `${root.dataset.uiTheme === "warm" ? "warm" : "classic"}-${root.dataset.theme === "dark" ? "dark" : "light"}`;
}

async function captureJob(browser, baseUrl, fixtures, job, outDir, onCapture) {
  const { screenDef, steps } = job;
  job.counted = job.counted || new Set();
  const count = name => { if (!job.counted.has(name)) { job.counted.add(name); onCapture(); } };
  const origin = new URL(baseUrl).origin;
  const broken = [];
  const first = steps[0].appearances[0];
  const context = await newContext(browser, steps[0].viewport);
  const dir = path.join(outDir, screenDef.id);
  fs.mkdirSync(dir, { recursive: true });
  const errors = [];
  const written = new Set();
  let timer;
  const work = (async () => {
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on("pageerror", error => errors.push(String(error.message || error).slice(0, 300)));
    page.on("requestfailed", request => { if (request.url().startsWith(origin)) broken.push(`${request.url().slice(origin.length)} ${request.failure()?.errorText || ""}`); });
    page.on("response", response => { if (response.url().startsWith(origin) && response.status() >= 400) broken.push(`${response.url().slice(origin.length)} ${response.status()}`); });
    const assertResources = () => { if (broken.length) throw Object.assign(new Error(`資源載入失敗：${broken.join("、")}`), { retryable: true }); };
    const client = await context.newCDPSession(page);
    const shared = screenDef.char.startsWith("share:") ? screenDef.char.slice(6) : null;
    await page.addInitScript(installStorage, { entries: shared ? {} : fixtures[screenDef.char] || {}, theme: first.theme, mode: first.mode });
    if (shared && !fixtures.share[shared]) throw new Error(`沒有 ${shared} 的分享網址`);
    await page.goto(shared ? `${baseUrl}${fixtures.share[shared]}` : baseUrl);
    await page.waitForLoadState("load");
    await page.evaluate(settlePage);
    assertResources();
    if (!screenDef.keepLegal) await page.evaluate(() => { const close = document.getElementById("legal-close-btn"); if (close?.getClientRects().length) close.click(); });
    const h = helpers(page, baseUrl);
    const extra = await screenDef.run(page, h, fixtures);
    if (!screenDef.keepToasts) await page.evaluate(() => window.AppDialog?.dismissToasts?.());
    // 剛打開視窗時，背後頁面的模糊圖層有時要一陣子才會畫上（樣式已經相同）：第一張拍之前多等一下。
    await page.waitForTimeout(FIRST_CAPTURE_WAIT);
    let current = steps[0].viewport;
    for (const step of steps) {
      if (step.viewport.width !== current.width || step.viewport.height !== current.height) {
        await page.setViewportSize(step.viewport);
        current = step.viewport;
        await page.waitForTimeout(150);
      }
      await page.mouse.move(step.viewport.width - 1, step.viewport.height - 1).catch(() => {});
      for (const appearance of step.appearances) {
        const now = await page.evaluate(switchAppearance, appearance);
        if (now !== appearance.id) throw new Error(`無法切換到 ${appearance.id}（目前 ${now}）`);
        if (screenDef.beforeCapture) await screenDef.beforeCapture(page);
        const rounds = await page.evaluate(settlePage);
        assertResources();
        const dom = await captureDom(client, page);
        if (extra?.forced) dom.forced = extra.forced;
        // 角色卡各頁存整頁；視窗類只存可視範圍（背後的頁面由角色卡各頁負責，computed style 仍涵蓋整頁）。
        const { png, stable } = await stableScreenshot(page, screenDef.group === "page");
        const name = captureName(appearance, step.viewport);
        fs.writeFileSync(path.join(dir, `${name}.png`), png);
        fs.writeFileSync(path.join(dir, `${name}.json.gz`), zlib.gzipSync(JSON.stringify({ ...dom, errors: errors.slice(), settleRounds: rounds, pngStable: stable })));
        written.add(name);
        count(name);
      }
    }
  })();
  work.catch(() => {});
  const failures = [];
  let retry = false;
  const total = steps.reduce((sum, step) => sum + step.appearances.length, 0);
  try {
    const limit = JOB_TIMEOUT + total * VIEWPORT_TIMEOUT;
    await Promise.race([work, new Promise((resolve, reject) => { timer = setTimeout(() => reject(new Error(`超過 ${limit / 1000} 秒`)), limit); })]);
  } catch (error) {
    const message = String(error.message || error).split("\n")[0];
    // 資源載入失敗（例如連線被中斷）不是程式本身的問題：整個工作重拍一次。
    if (error.retryable && !job.retried) { job.retried = true; retry = true; }
    else for (const step of steps) for (const appearance of step.appearances) {
      const name = captureName(appearance, step.viewport);
      if (written.has(name)) continue;
      fs.writeFileSync(path.join(dir, `${name}.json.gz`), zlib.gzipSync(JSON.stringify({ failed: message, errors })));
      failures.push(`${screenDef.id}/${name}：${message}`);
      count(name);
    }
  } finally {
    clearTimeout(timer);
    await context.close().catch(() => {});
  }
  if (retry) return captureJob(browser, baseUrl, fixtures, job, outDir, onCapture);
  return failures;
}

async function snapshot(root, outDir, options, info = {}) {
  const relative = path.relative(REPO, outDir);
  if (!relative.startsWith("..") && !path.isAbsolute(relative) && relative.split(path.sep)[0] !== ".visual-snapshots") throw new Error("快照不要放進 repo：請用 repo 外的資料夾，或 repo 內的 .visual-snapshots/（已加進 .gitignore）");
  const screens = selectScreens(options);
  const appearances = selectAppearances(options);
  if (fs.existsSync(outDir)) {
    if (!fs.existsSync(path.join(outDir, "meta.json")) && fs.readdirSync(outDir).length) throw new Error(`${outDir} 已有其他檔案，請換一個資料夾`);
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outDir, { recursive: true });
  const started = Date.now();
  const server = await startServer(root);
  const browser = await chromium.launch({ headless: true, args: RENDER_ARGS, ...(process.env.DND_BROWSER_CHANNEL ? { channel: process.env.DND_BROWSER_CHANNEL } : {}) });
  const jobs = screens.flatMap(screenDef => planFor(screenDef, options, appearances));
  const units = jobs.flatMap(job => job.steps.flatMap(step => step.appearances.map(appearance => `${job.screenDef.id}/${captureName(appearance, step.viewport)}`)));
  const failures = [];
  const browserVersion = browser.version();
  let fixtures = { warnings: [] };
  try {
    const baseUrl = `http://127.0.0.1:${server.address().port}/index.html?analytics=owner`;
    fixtures = await prepareCharacters(browser, baseUrl, [...new Set(screens.map(item => item.char.replace(/^share:/, "")))]);
    const workers = Math.max(1, Math.min(Number(options.workers) || Math.min(6, Math.max(1, os.cpus().length - 2)), jobs.length));
    let next = 0;
    let done = 0;
    const label = info.label || path.basename(outDir);
    process.stdout.write(`[${label}] ${screens.length} 個畫面，共 ${units.length} 張，${workers} 個分頁同時拍\n`);
    const onCapture = () => {
      done += 1;
      if (done % 100 === 0 || done === units.length) process.stdout.write(`[${label}] ${done}/${units.length}（${Math.round((Date.now() - started) / 1000)} 秒）\n`);
    };
    await Promise.all(Array.from({ length: workers }, async () => {
      while (next < jobs.length) failures.push(...await captureJob(browser, baseUrl, fixtures, jobs[next++], outDir, onCapture));
    }));
  } finally {
    await browser.close();
    server.closeAllConnections?.();
    server.close();
  }
  const meta = {
    tool: "visual-snapshot", version: 1, created: new Date().toISOString(), seconds: Math.round((Date.now() - started) / 1000),
    ref: info.ref || null, commit: info.commit || null, root: info.ref ? null : root,
    browser: `${chromium.name()} ${browserVersion}`, toolHash: TOOL_HASH, options: optionKey(options),
    units, failures, setupWarnings: fixtures.warnings
  };
  fs.writeFileSync(path.join(outDir, "meta.json"), JSON.stringify(meta, null, 1));
  for (const warning of fixtures.warnings) console.log(`  測試角色設定略過：${warning}`);
  for (const failure of failures) console.log(`  無法拍攝：${failure}`);
  console.log(`[${info.label || path.basename(outDir)}] 完成：${units.length} 張，${meta.seconds} 秒，${formatSize(dirSize(outDir))}`);
  return meta;
}

function dirSize(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    total += entry.isDirectory() ? dirSize(full) : fs.statSync(full).size;
  }
  return total;
}
const formatSize = bytes => bytes > 1 << 20 ? `${(bytes / (1 << 20)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

async function snapshotRef(ref, outDir, options, label = ref) {
  const { dir, commit } = extractRef(ref);
  // 按 Ctrl+C 中斷時也刪掉暫存副本。
  const interrupt = () => { removeDir(dir); process.exit(130); };
  process.once("SIGINT", interrupt);
  try {
    console.log(`[${label}] git archive ${commit.slice(0, 7)} → 暫存資料夾建置`);
    buildIn(dir);
    return await snapshot(dir, outDir, options, { ref: label, commit, label });
  } finally {
    process.removeListener("SIGINT", interrupt);
    removeDir(dir);
  }
}

// ---------- 比對 ----------
function readCapture(file) {
  return JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString());
}

function expandStyle(capture, id) {
  return capture.styles[id].map(valueId => capture.values[valueId]);
}

function diffCaptures(a, b) {
  const lines = [];
  let count = 0;
  const add = text => { count += 1; if (lines.length < 40) lines.push(text); };
  if (a.failed || b.failed) { add(`無法拍攝：基準＝${a.failed || "OK"}；新版＝${b.failed || "OK"}`); return { count, lines, props: {} }; }
  const props = {};
  const sameProps = a.props.join(",") === b.props.join(",");
  if (!sameProps) add("兩邊瀏覽器的屬性清單不同（請用同一版 Playwright 拍攝）");
  for (const key of ["width", "height", "viewMode", "theme", "uiTheme"]) if (a.page[key] !== b.page[key]) add(`頁面 ${key}：${a.page[key]} → ${b.page[key]}`);
  const mapB = new Map(b.nodes.map(node => [node[0], node]));
  const seen = new Set();
  const styleCache = new Map();
  const compareStyle = (where, idA, idB) => {
    const key = `${idA}|${idB}`;
    let diffs = styleCache.get(key);
    if (!diffs) {
      diffs = [];
      const va = expandStyle(a, idA);
      const vb = expandStyle(b, idB);
      for (let i = 0; i < a.props.length; i += 1) if (va[i] !== vb[i]) diffs.push([a.props[i], va[i], vb[i]]);
      styleCache.set(key, diffs);
    }
    for (const [prop, from, to] of diffs) { props[prop] = (props[prop] || 0) + 1; add(`${where} ${prop}：${from} → ${to}`); }
  };
  for (const node of a.nodes) {
    const other = mapB.get(node[0]);
    if (!other) { add(`新版少了元素 ${node[1]}（${node[0]}）`); continue; }
    seen.add(node[0]);
    const where = node[1] === other[1] ? node[1] : `${node[1]}→${other[1]}`;
    if (node[1] !== other[1]) add(`元素不同：${node[1]} → ${other[1]}（${node[0]}）`);
    if (sameProps) compareStyle(where, node[2], other[2]);
    const box = [3, 4, 5, 6].filter(i => node[i] !== other[i]);
    if (box.length) { props["(位置大小)"] = (props["(位置大小)"] || 0) + 1; add(`${where} 位置大小：${node.slice(3, 7).join(",")} → ${other.slice(3, 7).join(",")}`); }
    const pa = node[7] || {};
    const pb = other[7] || {};
    for (const pseudo of new Set([...Object.keys(pa), ...Object.keys(pb)])) {
      const x = pa[pseudo];
      const y = pb[pseudo];
      if (x === undefined || y === undefined) { add(`${where}${pseudo} ${x === undefined ? "新版多出" : "新版少了"}`); continue; }
      if (sameProps) compareStyle(`${where}${pseudo}`, x[0], y[0]);
      if (x.slice(1).join(",") !== y.slice(1).join(",")) { props["(位置大小)"] = (props["(位置大小)"] || 0) + 1; add(`${where}${pseudo} 位置大小：${x.slice(1).join(",")} → ${y.slice(1).join(",")}`); }
    }
  }
  for (const node of b.nodes) if (!seen.has(node[0])) add(`新版多出元素 ${node[1]}（${node[0]}）`);
  if (JSON.stringify(a.forced || null) !== JSON.stringify(b.forced || null)) add(`強制 hover／focus 的元素不同：${JSON.stringify(a.forced)} → ${JSON.stringify(b.forced)}`);
  return { count, lines, props };
}

function pixelDiffPage(strongDelta) {
  window.__diff = async (beforeUrl, afterUrl) => {
    const load = url => new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = url; });
    const [before, after] = await Promise.all([load(beforeUrl), load(afterUrl)]);
    const width = Math.max(before.width, after.width);
    const height = Math.max(before.height, after.height);
    const read = image => {
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      return context.getImageData(0, 0, width, height);
    };
    const a = read(before);
    const b = read(after);
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d");
    const out = context.createImageData(width, height);
    let changed = 0;
    let strong = 0;
    let box = null;
    for (let i = 0; i < a.data.length; i += 4) {
      const same = a.data[i] === b.data[i] && a.data[i + 1] === b.data[i + 1] && a.data[i + 2] === b.data[i + 2] && a.data[i + 3] === b.data[i + 3];
      if (same) {
        const gray = (a.data[i] * 0.299 + a.data[i + 1] * 0.587 + a.data[i + 2] * 0.114) * 0.25 + 191;
        out.data[i] = out.data[i + 1] = out.data[i + 2] = gray; out.data[i + 3] = 255;
      } else {
        changed += 1;
        if (Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]), Math.abs(a.data[i + 3] - b.data[i + 3])) > strongDelta) strong += 1;
        out.data[i] = 230; out.data[i + 1] = 0; out.data[i + 2] = 0; out.data[i + 3] = 255;
        const p = i / 4; const x = p % width; const y = Math.floor(p / width);
        box = box ? [Math.min(box[0], x), Math.min(box[1], y), Math.max(box[2], x), Math.max(box[3], y)] : [x, y, x, y];
      }
    }
    context.putImageData(out, 0, 0);
    return { changed, strong, box, size: [before.width, before.height, after.width, after.height], url: canvas.toDataURL("image/png") };
  };
}

const escapeHtml = text => String(text).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// 判定：computed style、位置大小、元素清單有任何不同就算失敗（結束碼 1）。
// 只有 PNG 不同、而且樣式與位置完全相同時，若明顯不同的像素 ≤ PNG_NOISE_PIXELS（或是 pngAdvisory 的導覽畫面），
// 視為點陣化雜訊（見 PNG_NOISE_PIXELS 的說明），列在報告裡但不算失敗；超過就算失敗。除了捲軸、::selection 這類不在比對範圍的偽元素，改到 CSS 一定會反映在 computed style 或位置。
async function compare(dirA, dirB, reportDir) {
  const metaA = JSON.parse(fs.readFileSync(path.join(dirA, "meta.json"), "utf8"));
  const metaB = JSON.parse(fs.readFileSync(path.join(dirB, "meta.json"), "utf8"));
  const unitsA = new Set(metaA.units);
  const unitsB = new Set(metaB.units);
  const results = [];
  const warningsA = JSON.stringify(metaA.setupWarnings || []);
  const warningsB = JSON.stringify(metaB.setupWarnings || []);
  if (warningsA !== warningsB) results.push({ unit: "測試角色/設定", style: { count: 1, lines: [`測試角色設定略過的步驟不同：${warningsA} → ${warningsB}`], props: {} }, png: "same" });
  if (metaA.browser !== metaB.browser) console.log(`注意：兩份快照的瀏覽器版本不同（${metaA.browser} → ${metaB.browser}），差異可能來自瀏覽器。`);
  for (const unit of new Set([...metaA.units, ...metaB.units])) {
    if (!unitsA.has(unit) || !unitsB.has(unit)) { results.push({ unit, style: { count: 1, lines: [unitsA.has(unit) ? "新版沒有拍這張" : "基準沒有拍這張"], props: {} }, png: "missing" }); continue; }
    const [screenId, name] = unit.split("/");
    if (!fs.existsSync(path.join(dirA, screenId, `${name}.json.gz`)) || !fs.existsSync(path.join(dirB, screenId, `${name}.json.gz`))) { results.push({ unit, style: { count: 1, lines: ["快照檔不完整"], props: {} }, png: "missing" }); continue; }
    const a = readCapture(path.join(dirA, screenId, `${name}.json.gz`));
    const b = readCapture(path.join(dirB, screenId, `${name}.json.gz`));
    const style = diffCaptures(a, b);
    const pngA = path.join(dirA, screenId, `${name}.png`);
    const pngB = path.join(dirB, screenId, `${name}.png`);
    const png = !fs.existsSync(pngA) || !fs.existsSync(pngB) ? (fs.existsSync(pngA) === fs.existsSync(pngB) ? "same" : "missing") : (fs.readFileSync(pngA).equals(fs.readFileSync(pngB)) ? "same" : "different");
    if (style.count || png !== "same") results.push({ unit, style, png, pngA, pngB, advisory: !!SCREENS.find(item => item.id === screenId)?.pngAdvisory });
  }
  const total = new Set([...metaA.units, ...metaB.units]).size;
  console.log(`\n比對 ${total} 張：基準 ${metaA.ref || metaA.root}${metaA.commit ? ` @ ${metaA.commit.slice(0, 7)}` : ""}；新版 ${metaB.ref || metaB.root}${metaB.commit ? ` @ ${metaB.commit.slice(0, 7)}` : ""}`);
  if (!results.length) {
    console.log("零差異：computed style、位置大小與 PNG 完全相同。");
    return 0;
  }
  fs.mkdirSync(path.join(reportDir, "img"), { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.DND_BROWSER_CHANNEL ? { channel: process.env.DND_BROWSER_CHANNEL } : {}) });
  try {
    const page = await browser.newPage();
    await page.setContent("<!doctype html><title>diff</title>");
    await page.evaluate(pixelDiffPage, PNG_NOISE_DELTA);
    let imageCount = 0;
    for (const result of results) {
      if (result.png !== "different") continue;
      const dataUrl = file => `data:image/png;base64,${fs.readFileSync(file).toString("base64")}`;
      const diff = await page.evaluate(([x, y]) => window.__diff(x, y), [dataUrl(result.pngA), dataUrl(result.pngB)]);
      result.diff = { changed: diff.changed, strong: diff.strong, box: diff.box, size: diff.size };
      const sameSize = diff.size[0] === diff.size[2] && diff.size[1] === diff.size[3];
      result.noise = !result.style.count && sameSize && (diff.strong <= PNG_NOISE_PIXELS || result.advisory);
      if (imageCount >= 300) continue;
      imageCount += 1;
      result.safe = result.unit.replace(/[^\w.-]+/g, "_");
      fs.copyFileSync(result.pngA, path.join(reportDir, "img", `${result.safe}.before.png`));
      fs.copyFileSync(result.pngB, path.join(reportDir, "img", `${result.safe}.after.png`));
      fs.writeFileSync(path.join(reportDir, "img", `${result.safe}.diff.png`), Buffer.from(diff.url.split(",")[1], "base64"));
    }
  } finally {
    await browser.close();
  }
  const failures = results.filter(result => !result.noise);
  const noise = results.filter(result => result.noise);
  const byScreen = new Map();
  for (const result of failures) {
    const screenId = result.unit.split("/")[0];
    if (!byScreen.has(screenId)) byScreen.set(screenId, []);
    byScreen.get(screenId).push(result);
  }
  if (failures.length) console.log(`有差異：${failures.length} 張（樣式或位置不同 ${failures.filter(r => r.style.count).length}，PNG 不同 ${failures.filter(r => r.png !== "same").length}）`);
  else console.log("零差異：computed style 與位置大小完全相同。");
  for (const [screenId, list] of byScreen) {
    const names = list.map(r => r.unit.split("/")[1]);
    const props = {};
    for (const r of list) for (const [prop, n] of Object.entries(r.style.props)) props[prop] = (props[prop] || 0) + n;
    const topProps = Object.entries(props).sort((x, y) => y[1] - x[1]).slice(0, 6).map(([prop, n]) => `${prop}×${n}`).join("、");
    console.log(`  ${screenId}：${list.length} 張 ${summarizeUnits(names)}${topProps ? `｜${topProps}` : ""}`);
    const first = list.find(r => r.style.count);
    if (first) for (const line of first.style.lines.slice(0, 5)) console.log(`      ${first.unit.split("/")[1]} ${line}`);
    else console.log(`      只有 PNG 不同：${list.map(r => `${r.unit.split("/")[1]} ${r.diff ? `${r.diff.strong} 像素明顯不同` : r.png}`).join("、")}`);
  }
  if (failures.length && failures.every(result => !result.style.count && result.png === "different")) console.log("失敗的都是「樣式與位置完全相同、只有截圖不同」：多半是點陣化不穩定，請看報告；不確定時重跑一次（check 會沿用基準快照）。");
  if (noise.length) console.log(`另有 ${noise.length} 張樣式與位置完全相同、只有截圖不同（明顯不同 ≤${PNG_NOISE_PIXELS} 像素或導覽畫面），視為點陣化雜訊、不算失敗，請看報告確認（明顯不同／全部不同的像素）：${noise.map(r => `${r.unit}（${r.diff.strong}／${r.diff.changed} 像素）`).join("、")}`);
  const section = result => {
    const lines = result.style.lines.length ? `<pre>${escapeHtml(result.style.lines.join("\n"))}${result.style.count > result.style.lines.length ? `\n…另有 ${result.style.count - result.style.lines.length} 項` : ""}</pre>` : "<p>computed style 與位置大小相同，只有 PNG 不同。</p>";
    let images = "";
    if (result.diff) images = `<p>不同的像素：${result.diff.changed}（明顯不同 ${result.diff.strong}）${result.diff.box ? `，範圍 x ${result.diff.box[0]}–${result.diff.box[2]}、y ${result.diff.box[1]}–${result.diff.box[3]}` : ""}${result.diff.size[0] !== result.diff.size[2] || result.diff.size[1] !== result.diff.size[3] ? `；圖片大小 ${result.diff.size[0]}×${result.diff.size[1]} → ${result.diff.size[2]}×${result.diff.size[3]}` : ""}</p>`;
    if (result.safe) images += `<div class="trio">${["before", "after", "diff"].map(kind => `<figure><figcaption>${{ before: "改前", after: "改後", diff: "差異（紅色）" }[kind]}</figcaption><a href="img/${result.safe}.${kind}.png"><img loading="lazy" src="img/${result.safe}.${kind}.png"></a></figure>`).join("")}</div>`;
    else if (result.png === "different") images += "<p>（超過 300 張，未產生差異圖）</p>";
    else if (result.png === "missing") images += "<p>其中一邊沒有 PNG</p>";
    const id = result.unit.replace(/[^\w.-]+/g, "_");
    return `<section id="${id}"><h2>${escapeHtml(result.unit)}${result.noise ? "（雜訊，不算失敗）" : ""}</h2><p>樣式／位置差異 ${result.style.count} 項；PNG ${{ same: "相同", different: "不同", missing: "缺少" }[result.png]}</p>${lines}${images}</section>`;
  };
  const link = result => `<a href="#${result.unit.replace(/[^\w.-]+/g, "_")}">${escapeHtml(result.unit)}</a>`;
  const html = `<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>外觀快照差異</title>
<style>:root{color-scheme:light dark;--bg:#fff;--fg:#1d1d1f;--muted:#5f6368;--line:#d0d0d0}@media (prefers-color-scheme:dark){:root{--bg:#1b1b1d;--fg:#ececec;--muted:#a0a0a0;--line:#444}}
body{margin:0;padding:16px;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif}h1{font-size:1.3rem}h2{font-size:1.05rem;margin:0 0 4px}section{border-top:1px solid var(--line);padding:16px 0}
pre{white-space:pre-wrap;word-break:break-all;font-size:12px;color:var(--muted);max-height:320px;overflow:auto}.trio{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}@media (max-width:700px){.trio{grid-template-columns:1fr}}
figure{margin:0}figcaption{font-size:13px;color:var(--muted)}img{display:block;max-width:100%;height:auto;border:1px solid var(--line)}nav a{margin-right:8px}</style>
<h1>外觀快照差異：失敗 ${failures.length} 張${noise.length ? `，雜訊 ${noise.length} 張` : ""}</h1><p>基準：${escapeHtml(metaA.ref || metaA.root)} ${metaA.commit ? escapeHtml(metaA.commit.slice(0, 7)) : ""}；新版：${escapeHtml(metaB.ref || metaB.root)} ${metaB.commit ? escapeHtml(metaB.commit.slice(0, 7)) : ""}</p>
<nav>${failures.map(link).join(" ")}${noise.length ? ` ｜ 雜訊：${noise.map(link).join(" ")}` : ""}</nav>${failures.map(section).join("\n")}${noise.map(section).join("\n")}</html>`;
  fs.writeFileSync(path.join(reportDir, "index.html"), html);
  console.log(`報告：${path.join(reportDir, "index.html")}`);
  return failures.length ? 1 : 0;
}

function summarizeUnits(names) {
  const appearances = new Set(names.map(name => APPEARANCES.find(item => name.startsWith(`${item.id}-`))?.id));
  const widths = [...new Set(names.map(name => name.split("-").pop()))].sort((x, y) => parseInt(y, 10) - parseInt(x, 10));
  return `（外觀 ${[...appearances].join("、")}；寬度 ${widths.join("、")}）`;
}

// ---------- 指令 ----------
function parseArgs(argv) {
  const options = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (!flag.startsWith("--")) { options._.push(flag); continue; }
    const key = flag.slice(2);
    if (["quick", "no-build", "every", "fresh", "rebuild-base"].includes(key)) options[key] = true;
    else if (["ref", "root", "base", "out", "only", "appearance", "workers", "report"].includes(key)) options[key] = argv[++i];
    else if (key === "widths") { const value = argv[++i]; options.widths = value === "all" ? "all" : parseList(value).map(Number); if (options.widths !== "all" && options.widths.some(Number.isNaN)) throw new Error("--widths 要是 all 或數字清單"); }
    else throw new Error(`不認得的參數：${flag}`);
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const [command, ...rest] = options._;
  if (command === "list") {
    console.log(`外觀：${APPEARANCES.map(item => item.id).join("、")}`);
    console.log(`寬度：page ${PAGE_WIDTHS.join(",")}\n      dialog ${DIALOG_WIDTHS.join(",")}\n      quick ${QUICK_WIDTHS.join(",")}\n      all ${FULL_WIDTHS.join(",")}`);
    for (const item of SCREENS) console.log(`  ${item.id.padEnd(28)} ${item.group.padEnd(7)} ${item.char}${item.short ? "（另拍矮視窗）" : ""}`);
    const count = selectScreens(options).flatMap(item => planFor(item, options, selectAppearances(options))).reduce((sum, job) => sum + job.steps.reduce((n, step) => n + step.appearances.length, 0), 0);
    console.log(`共 ${SCREENS.length} 個畫面；目前選項會拍 ${count} 張`);
    return;
  }
  if (command === "snap") {
    if (!rest[0]) throw new Error("用法：snap <資料夾> [--ref <git ref>]");
    const outDir = path.resolve(rest[0]);
    if (options.ref) await snapshotRef(options.ref, outDir, options);
    else if (options.root) await snapshot(path.resolve(options.root), outDir, options, { label: path.basename(options.root), root: path.resolve(options.root) });
    else await snapshot(REPO, outDir, options, { label: "工作目錄" });
    return;
  }
  if (command === "compare") {
    if (rest.length < 2) throw new Error("用法：compare <基準資料夾> <新版資料夾>");
    const [a, b] = rest.map(item => path.resolve(item));
    process.exitCode = await compare(a, b, path.resolve(options.report || path.join(path.dirname(b), "report")));
    return;
  }
  if (command === "check") {
    const out = path.resolve(options.out || path.join(os.tmpdir(), "twd20-visual-snapshot"));
    const base = options.base || "main";
    const started = Date.now();
    if (!options["no-build"]) { console.log("[工作目錄] npm run build"); buildIn(REPO); }
    for (const name of ["current", "report"]) fs.rmSync(path.join(out, name), { recursive: true, force: true });
    // 基準的 commit、工具版本與選項都沒變，且上次沒有拍攝失敗時，沿用上次的基準快照（--rebuild-base 強制重拍）。
    const baseDir = path.join(out, "base");
    const commit = git(["rev-parse", "--verify", `${base}^{commit}`]).toString().trim();
    let reuse = false;
    try {
      const previous = JSON.parse(fs.readFileSync(path.join(baseDir, "meta.json"), "utf8"));
      reuse = !options["rebuild-base"] && previous.commit === commit && previous.toolHash === TOOL_HASH && JSON.stringify(previous.options) === JSON.stringify(optionKey(options)) && !previous.failures.length;
    } catch {}
    if (reuse) console.log(`[${base}] 沿用上次的基準快照（${commit.slice(0, 7)}）`);
    else { fs.rmSync(baseDir, { recursive: true, force: true }); await snapshotRef(commit, baseDir, options, base); }
    await snapshot(REPO, path.join(out, "current"), options, { label: "工作目錄" });
    process.exitCode = await compare(path.join(out, "base"), path.join(out, "current"), path.join(out, "report"));
    console.log(`總時間 ${Math.round((Date.now() - started) / 1000)} 秒；快照在 ${out}`);
    return;
  }
  throw new Error("用法見檔頭註解：check、snap、compare、list");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 2;
});

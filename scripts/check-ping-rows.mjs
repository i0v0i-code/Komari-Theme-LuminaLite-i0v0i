import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

const url = process.env.CHECK_URL ?? "http://127.0.0.1:5199/?mock=1";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? chromium.executablePath(), headless: true, args: ["--no-sandbox"] });
const out = ".pi/ping-rows";
mkdirSync(out, { recursive: true });
const results = [];
try {
  for (const width of [1440, 390, 320]) {
    for (const mode of (width > 720 ? ["large", "compact", "mini", "list"] : ["large", "compact", "mini"])) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: "light" });
      await context.addInitScript((mode) => {
        sessionStorage.setItem("komaritheme:node-view-mode-session:desktop", mode);
        sessionStorage.setItem("komaritheme:node-view-mode-session:mobile", mode);
      }, mode);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", e => errors.push(e.message));
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".ping-task-row", { timeout: 30000 });
      await page.waitForFunction((minimum) => document.querySelectorAll('.ping-task-row').length >= minimum, url.includes('mock=1') ? 9 : 3);
      await page.locator('.ping-task-row').first().scrollIntoViewIfNeeded();
      await page.evaluate(() => document.fonts.ready);
      const state = await page.evaluate(() => {
        const rows = [...document.querySelectorAll(".ping-task-row")];
        return {
          rows: rows.length,
          groups: document.querySelectorAll(".ping-task-rows").length,
          tabs: document.querySelectorAll(".ping-task-tabs").length,
          overflow: rows.filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.textContent),
          pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
          names: [...document.querySelectorAll(".ping-task-rows")][0].innerText,
          metricsClipped: [...document.querySelectorAll(".ping-task-row-metric strong")].some(el => el.scrollWidth > el.clientWidth + 1),
        };
      });
      assert(state.rows > 0 && state.groups > 0);
      assert.equal(state.tabs, 0);
      assert.deepEqual(state.overflow, [], `${width}/${mode} row overflow`);
      assert.equal(state.pageOverflow, false, `${width}/${mode} page overflow`);
      assert.equal(state.metricsClipped, false, `${width}/${mode} metric clipping`);
      assert.deepEqual(errors, []);
      const chart = page.locator('.ping-task-row .compact-node-health-bars').first();
      if (await chart.locator("button").count()) {
        await chart.locator('button[tabindex="0"]').focus();
        await page.keyboard.press("Home");
        assert.equal(await chart.locator("button").first().evaluate(el => el === document.activeElement), true);
        await page.keyboard.press("End");
        assert.equal(await chart.locator("button").last().evaluate(el => el === document.activeElement), true);
        await chart.locator("button").last().click();
        assert.equal(page.url(), url, "history clicks must not navigate list rows");
        await page.locator("body").click({ position: { x: 1, y: 1 } });
      }
      const card = page.locator(mode === "large" ? ".server-card" : mode === "compact" ? ".compact-node-card" : mode === "mini" ? ".mini-node-card" : ".node-list-row:not(.node-list-head)").first();
      await card.screenshot({ path: `${out}/${width}-${mode}.png` });
      // Layout-only stress case; no server data is changed.
      await page.locator('.ping-task-row-name > span:last-child').first().evaluate(el => { el.textContent = "福建福州联通超长名称监测节点IPv6"; });
      assert.equal(await page.locator('.ping-task-row').first().evaluate(el => el.scrollWidth > el.clientWidth + 1), false);
      results.push({ width, mode, ...state, errors });
      await context.close();
    }
  }
  writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally { await browser.close(); }

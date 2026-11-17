import assert from 'node:assert/strict';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright';

const dist = path.resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const key = 'edustack.profiles.v1';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp' };
let server, browser, origin;
const child = (months = 36, overrides = {}) => {
  const now = new Date();
  const birth = new Date(now.getFullYear(), now.getMonth() - months, 1);
  return { id: 'review-child', name: 'Synthetic nickname', y: birth.getFullYear(), m: birth.getMonth() + 1, sex: '', ...overrides };
};
const store = (children = [child()]) => ({ v: 1, children, sel: children[0]?.id });
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64');

before(async () => {
  assert.ok(existsSync(path.join(dist, 'me/index.html')), 'Run npm run build before browser tests.');
  server = createServer((req, res) => {
    try {
      let target = path.resolve(dist, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
      if (target !== dist && !target.startsWith(dist + path.sep)) { res.writeHead(403).end(); return; }
      if (statSync(target).isDirectory()) target = path.join(target, 'index.html');
      res.setHeader('Content-Type', mime[path.extname(target)] ?? 'application/octet-stream');
      res.setHeader('Cache-Control', 'no-store');
      createReadStream(target).pipe(res);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
});
after(async () => {
  await browser?.close();
  server?.closeAllConnections();
  if (server?.listening) await new Promise((resolve) => server.close(resolve));
});
const settledHome = (page) => page.waitForFunction(() => !!document.documentElement.dataset.homeView && !document.documentElement.hasAttribute('data-home-pending'));
const settledLibrary = (page) => page.waitForFunction(() => document.getElementById('toggle-filters')?.hidden === false);
async function fixture(t, prefix = '', value = store()) {
  const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
  t.after(() => context.close());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(origin + prefix + '/');
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key, value });
  const visit = async (route) => {
    const response = await page.goto(origin + prefix + route, { waitUntil: 'domcontentloaded' });
    if (new URL(page.url()).pathname === prefix + '/') await settledHome(page);
    if (new URL(page.url()).pathname === prefix + '/library/') await settledLibrary(page);
    return response;
  };
  return { page, context, errors, visit };
}

for (const prefix of ['', '/zh']) {
  const lang = prefix ? 'zh' : 'en';
  test(`${lang}: the same homepage shows general content without a profile or JavaScript`, async (t) => {
    const { page, visit, errors } = await fixture(t, prefix, store([]));
    await visit('/');
    assert.equal(await page.locator('.lead-grid').isVisible(), true);
    assert.equal(await page.locator('[data-home-personal]').isVisible(), false);
    assert.equal(await page.locator('h1:visible').count(), 1);
    await page.evaluate(() => { Storage.prototype.getItem = () => { throw new DOMException('Denied', 'SecurityError'); }; window.dispatchEvent(new CustomEvent('edustack:profilechange')); });
    assert.equal(await page.locator('.lead-grid').isVisible(), true);
    assert.match(await page.locator('#home-view-note').innerText(), prefix ? /无法读取/ : /cannot currently read/);
    const noScript = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: 'block' });
    t.after(() => noScript.close());
    const staticPage = await noScript.newPage();
    await staticPage.goto(origin + prefix + '/');
    assert.equal(await staticPage.locator('.lead-grid').isVisible(), true);
    assert.equal(await staticPage.locator('[data-home-personal]').isVisible(), false);
    assert.deepEqual(errors, []);
  });

  test(`${lang}: homepage recommendations follow all stages and exact tool ages`, async (t) => {
    const { page, visit, errors } = await fixture(t, prefix);
    for (const [months, stage] of [[0, 'babies'], [12, 'toddlers'], [24, 'toddlers'], [36, 'preschoolers'], [60, 'preschoolers'], [72, 'school-age'], [96, 'school-age'], [144, 'teens']]) {
      await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key, value: store([child(months)]) });
      await visit('/');
      await page.waitForSelector(`[data-home-stage="${stage}"]:visible`);
      assert.equal(await page.locator('[data-home-stage]:visible').count(), 1);
      assert.equal(await page.locator('.lead-grid').isVisible(), false);
      assert.equal(await page.locator('#ages').isVisible(), false);
      assert.equal(await page.locator('#reading').isVisible(), false);
      assert.equal(await page.locator('h1:visible').count(), 1);
      const invalid = await page.locator('[data-home-age-item]:visible').evaluateAll((items, months) => items.filter((item) => months < Number(item.dataset.minMonths) || months > Number(item.dataset.maxMonths)).length, months);
      assert.equal(invalid, 0);
      assert.equal(await page.locator('[data-home-recent-empty]:visible').count(), 1);
      if (months === 36) assert.equal(await page.locator('[data-tool="scratchjr"]:visible').count(), 0);
      if (months === 60) assert.equal(await page.locator('[data-tool="scratchjr"]:visible').count(), 1);
      if (months === 72) assert.equal(await page.locator(`#home-${stage}-tools [data-home-age-empty]`).isVisible(), true);
      assert.equal(new URL(page.url()).search, '');
    }
    await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key, value: store([child(216)]) });
    await visit('/');
    assert.equal(await page.locator('.lead-grid').isVisible(), true);
    assert.match(await page.locator('#home-view-note').innerText(), prefix ? /超出/ : /outside/);
    assert.deepEqual(errors, []);
  });

  test(`${lang}: children switch quickly with keyboard focus and retain selection across pages`, async (t) => {
    const value = store([child(36), child(156, { id: 'second-child', name: '<b>Second</b>' })]);
    const { page, visit } = await fixture(t, prefix, value);
    await visit('/');
    const second = page.locator('[data-child-choice="second-child"]');
    await second.focus(); await second.press('Enter');
    assert.equal(await second.getAttribute('aria-pressed'), 'true');
    assert.equal(await second.evaluate((node) => document.activeElement === node), true);
    assert.equal(await page.locator('[data-home-stage="teens"]').isVisible(), true);
    assert.equal(await page.locator('[data-child-buttons] b').count(), 0);
    await page.reload(); await settledHome(page);
    assert.equal(await page.locator('[data-home-stage="teens"]').isVisible(), true);
    await page.locator('.language-switcher a').click(); await settledHome(page);
    assert.equal(await page.locator('[data-home-stage="teens"]').isVisible(), true);
    assert.equal(new URL(page.url()).search, '');
    await visit('/library/?age=babies');
    await page.locator('[data-child-choice="review-child"]').click();
    assert.equal(await page.locator('#age').inputValue(), 'babies');
    await visit('/library/');
    assert.equal(await page.locator('#age').inputValue(), '36');
    await page.locator('[data-child-choice="second-child"]').click();
    assert.equal(await page.locator('#age').inputValue(), '156');
    assert.equal(new URL(page.url()).searchParams.has('age'), false);
  });

  test(`${lang}: general homepage mode persists independently and the selected child can restore it`, async (t) => {
    const { page, visit } = await fixture(t, prefix);
    await visit('/');
    await page.locator('[data-home-general-choice]').click();
    assert.equal(await page.locator('.lead-grid').isVisible(), true);
    const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
    assert.equal(saved.sel, 'review-child');
    assert.equal(saved.children.length, 1);
    await page.reload(); await settledHome(page);
    assert.equal(await page.locator('.lead-grid').isVisible(), true);
    await page.locator('.language-switcher a').click(); await settledHome(page);
    assert.equal(await page.locator('.lead-grid').isVisible(), true);
    await page.locator('[data-child-choice="review-child"]').click();
    assert.equal(await page.locator('[data-home-stage="preschoolers"]').isVisible(), true);
    await page.reload(); await settledHome(page);
    assert.equal(await page.locator('[data-home-stage="preschoolers"]').isVisible(), true);
    await visit('/#ages');
    assert.equal(await page.locator('#ages').isVisible(), true);
    await page.locator('[data-child-choice="review-child"]').click();
    assert.equal(await page.locator('[data-home-stage="preschoolers"]').isVisible(), true);
    assert.equal(new URL(page.url()).hash, '');
    await page.locator('.language-switcher a').click(); await settledHome(page);
    assert.equal(new URL(page.url()).hash, '');
    assert.equal(await page.locator('[data-home-stage="preschoolers"]').isVisible(), true);
  });

  test(`${lang}: four or more children use a labelled selector that restores the current child from general mode`, async (t) => {
    const value = store(Array.from({ length: 4 }, (_, i) => child(36 + i * 36, { id: `child-${i}`, name: '' })));
    const { page, visit } = await fixture(t, prefix, value);
    await page.setViewportSize({ width: 320, height: 800 });
    await visit('/');
    const select = page.locator('[data-child-select]');
    assert.equal(await select.isVisible(), true);
    await select.selectOption('child-3');
    assert.equal(await page.locator('[data-home-stage="teens"]').isVisible(), true);
    await page.locator('[data-home-general-choice]').click();
    assert.equal(await select.inputValue(), '');
    await select.selectOption('child-3');
    assert.equal(await page.locator('[data-home-stage="teens"]').isVisible(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  });

  test(`${lang}: failed child switches preserve selection and failed homepage preferences are explained`, async (t) => {
    const value = store([child(36), child(156, { id: 'second-child', name: 'Second' })]);
    const { page, visit } = await fixture(t, prefix, value);
    await visit('/');
    await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); }; });
    await page.locator('[data-child-choice="second-child"]').click();
    assert.equal(await page.locator('[data-home-stage="preschoolers"]').isVisible(), true);
    assert.equal(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).sel, key), 'review-child');
    assert.match(await page.locator('[data-profile-message]').innerText(), prefix ? /无法保存切换/ : /switch could not be saved/);
    await page.locator('[data-home-general-choice]').click();
    assert.equal(await page.locator('.lead-grid').isVisible(), true);
    assert.match(await page.locator('[data-profile-message]').innerText(), prefix ? /无法记住/ : /could not be saved/);
  });

  test(`${lang}: another tab switching or clearing profiles refreshes the homepage without private remnants`, async (t) => {
    const value = store([child(36), child(156, { id: 'second-child', name: 'Second' })]);
    const { page, context, visit } = await fixture(t, prefix, value);
    await visit('/');
    const other = await context.newPage();
    await other.goto(origin + prefix + '/');
    await other.locator('[data-child-choice="second-child"]').click();
    await page.waitForSelector('[data-home-stage="teens"]:visible');
    await other.goto(origin + prefix + '/me/');
    await other.locator('#clear-btn').click(); await other.locator('#clear-btn').click();
    await page.waitForSelector('.lead-grid:visible');
    assert.equal((await page.locator('body').textContent()).includes('Synthetic nickname'), false);
    assert.equal(await page.locator('[data-child-buttons] button').count(), 0);
  });

  test(`${lang}: profile management refreshes external selections and cannot restore profiles deleted in another tab`, async (t) => {
    const value = store([child(36), child(156, { id: 'second-child', name: 'Second' })]);
    const { page, context, visit } = await fixture(t, prefix, value);
    await visit('/me/');
    assert.equal(await page.locator('.profile-child-controls').isVisible(), false);
    await page.locator('#kids [data-id="second-child"]').click();
    assert.match(await page.locator('#v-title').innerText(), /Second/);
    assert.match(await page.locator('[data-profile-context] [data-title]').innerText(), /Second/);
    const other = await context.newPage();
    await other.goto(origin + prefix + '/');
    await other.locator('[data-child-choice="review-child"]').click();
    await page.waitForFunction(() => document.querySelector('#v-title').textContent.includes('Synthetic nickname'));
    await page.locator('#export-btn').click();
    await page.locator('#edit-btn').click();
    await page.locator('#nick').fill('Unsaved stale edit');
    await other.goto(origin + prefix + '/me/');
    await other.locator('#clear-btn').click(); await other.locator('#clear-btn').click();
    await page.waitForSelector('#empty:visible');
    assert.equal(await page.locator('#form').isVisible(), false);
    assert.equal(await page.locator('#nick').inputValue(), '');
    assert.equal(await page.locator('#code').inputValue(), '');
    assert.equal(await page.locator('#kids button').count(), 0);
    assert.equal((await page.locator('body').textContent()).includes('Synthetic nickname'), false);
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), key), null);
  });

  test(`${lang}: import rejects injected IDs, invalid dates and duplicates without changing existing records`, async (t) => {
    const { page, visit, errors } = await fixture(t, prefix);
    await visit('/me/');
    const original = await page.evaluate((k) => localStorage.getItem(k), key);
    const payload = '"><img src="data:," onerror="document.body.dataset.reviewMarker=1"><span data-x="';
    const invalid = [store([child(36, { id: payload })]), store([child(36, { y: 2099 })]), store([null]), store([child(), child()])];
    await page.locator('#import-btn').click();
    for (const record of invalid) {
      await page.locator('#code').fill(encode(record));
      await page.locator('#apply-code').click();
      assert.equal(await page.evaluate((k) => localStorage.getItem(k), key), original);
      assert.match(await page.locator('#code-msg').innerText(), prefix ? /无效/ : /Invalid/);
    }
    assert.equal(await page.locator('body').getAttribute('data-review-marker'), null);
    assert.equal(await page.locator('#kids img').count(), 0);
    assert.deepEqual(errors, []);
  });

  test(`${lang}: Unicode profile names and markup stay text and v1 codes round-trip`, async (t) => {
    const value = store([child(36, { name: '<b>测试🌱</b>' }), child(130, { id: 'second-child', name: 'Second' })]);
    const { page, visit } = await fixture(t, prefix, value);
    await visit('/me/');
    assert.equal(await page.locator('#kids b').count(), 0);
    assert.ok((await page.locator('#kids').textContent()).includes('<b>测试🌱</b>'));
    await page.locator('#export-btn').click();
    const exported = await page.locator('#code').inputValue();
    assert.deepEqual(JSON.parse(Buffer.from(exported, 'base64').toString('utf8')), value);
    await page.locator('#apply-code').click();
    assert.match(await page.locator('#profile-msg').innerText(), prefix ? /已导入/ : /Imported/);
    assert.equal(await page.locator('#kids button').count(), 2);
  });

  test(`${lang}: keyword, type, subject, language, cost, sort and submit never publish automatic age`, async (t) => {
    const { page, visit } = await fixture(t, prefix);
    await visit('/library/');
    assert.equal(await page.locator('#age').inputValue(), '36');
    await page.locator('#q').fill('sleep');
    await page.waitForFunction(() => new URL(location.href).searchParams.get('q') === 'sleep');
    for (const [selector, value] of [['#type', 'guide'], ['#topic', 'sleep'], ['#language', 'en'], ['#sort', 'newest']]) {
      await page.locator(selector).selectOption(value);
      assert.equal(new URL(page.url()).searchParams.has('age'), false);
      assert.equal(await page.locator('#age').inputValue(), '36');
    }
    await page.locator('#free').check();
    await page.locator('#q').press('Enter');
    assert.equal(new URL(page.url()).searchParams.has('age'), false);
    assert.match(await page.locator('#active-filters').innerText(), prefix ? /按当前孩子年龄/ : /Current child's age/);
    const switchUrl = await page.locator('.language-switcher a').getAttribute('href');
    assert.equal(new URL(switchUrl, origin).searchParams.has('age'), false);
    await page.locator('#age').selectOption('72');
    assert.equal(new URL(page.url()).searchParams.get('age'), '72');
    await page.locator('#age').selectOption('');
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('edustack:profilechange')));
    assert.equal(await page.locator('#age').inputValue(), '');
    assert.equal(new URL(page.url()).searchParams.get('age'), 'any');
    await page.reload(); await settledLibrary(page);
    assert.equal(await page.locator('#age').inputValue(), '');
  });

  test(`${lang}: reset, child changes, language switching and explicit age respect the selected mode`, async (t) => {
    const { page, visit } = await fixture(t, prefix);
    await visit('/library/?age=teens');
    assert.equal(await page.locator('#age').inputValue(), 'teens');
    await page.locator('#q').fill('sleep');
    await page.waitForFunction(() => new URL(location.href).searchParams.has('q'));
    assert.equal(new URL(page.url()).searchParams.get('age'), 'teens');
    await page.locator('#reset-all').click();
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('edustack:profilechange')));
    assert.equal(await page.locator('#age').inputValue(), '');
    assert.equal(await page.locator('#active-filters').isVisible(), false);
    await visit('/library/');
    await page.locator('.language-switcher a').click();
    await settledLibrary(page);
    assert.equal(new URL(page.url()).searchParams.has('age'), false);
    assert.equal(await page.locator('#age').inputValue(), '36');
  });

  test(`${lang}: 216 months shows an honest general-library state and keeps profile editing`, async (t) => {
    const { page, visit } = await fixture(t, prefix, store([child(216)]));
    await visit('/library/');
    assert.equal(await page.locator('#age').inputValue(), '');
    const active = await page.locator('#active-filters').innerText();
    assert.match(active, prefix ? /未按档案年龄筛选/ : /without a profile age filter/);
    assert.equal(new URL(page.url()).searchParams.has('age'), false);
    const total = await page.locator('[data-search-key]').count();
    assert.equal(await page.locator('[data-search-key]:visible').count(), total);
    await visit('/me/');
    assert.equal(await page.locator('#v-outside').isVisible(), true);
    assert.equal(await page.locator('#edit-btn').isVisible(), true);
    assert.equal(await page.locator('#v-develop-section').isVisible(), false);
  });

  test(`${lang}: clear removes export, form and rendered personal copies`, async (t) => {
    const { page, visit } = await fixture(t, prefix);
    await visit('/me/');
    await page.locator('#export-btn').click();
    assert.ok((await page.locator('#code').inputValue()).length);
    await page.locator('#edit-btn').click();
    await page.locator('#clear-btn').click(); await page.locator('#clear-btn').click();
    assert.equal(await page.evaluate((k) => localStorage.getItem(k), key), null);
    assert.equal(await page.locator('#code').inputValue(), '');
    assert.equal(await page.locator('#nick').inputValue(), '');
    assert.equal(await page.locator('#form').isVisible(), false);
    assert.equal(await page.locator('#code-box').isVisible(), false);
    assert.equal(await page.locator('#empty').isVisible(), true);
    assert.equal((await page.locator('body').textContent()).includes('Synthetic nickname'), false);
  });

  test(`${lang}: older valid profiles remain editable without changing the birth year`, async (t) => {
    const value = store([child(36, { y: 1991, m: 1 })]);
    const { page, visit } = await fixture(t, prefix, value);
    await visit('/me/');
    await page.locator('#edit-btn').click();
    assert.equal(await page.locator('#by').inputValue(), '1991');
    await page.locator('#nick').fill('Edited nickname');
    await page.locator('#form button[type=submit]').click();
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
    assert.equal(saved.children[0].y, 1991);
    assert.equal(saved.children[0].m, 1);
    assert.equal(saved.children[0].name, 'Edited nickname');
    assert.equal(await page.locator('#form').isVisible(), false);
    assert.equal(await page.locator('#v-outside').isVisible(), true);
  });

  test(`${lang}: rejected writes keep the form and old profile; rejected deletion keeps stored records`, async (t) => {
    const { page, visit } = await fixture(t, prefix);
    await page.setViewportSize({ width: 320, height: 800 });
    await visit('/me/');
    const original = await page.evaluate((k) => localStorage.getItem(k), key);
    await page.evaluate(() => {
      Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); };
      Storage.prototype.removeItem = () => { throw new DOMException('Denied', 'SecurityError'); };
      window.reviewEvents = 0;
      window.addEventListener('edustack:profilechange', () => window.reviewEvents++);
    });
    await page.locator('#edit-btn').click();
    await page.locator('#nick').fill('Unsaved nickname');
    await page.locator('#form button[type=submit]').click();
    assert.equal(await page.locator('#form').isVisible(), true);
    assert.match(await page.locator('#profile-msg').innerText(), prefix ? /尚未保存/ : /not been saved/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    assert.equal(await page.evaluate((k) => localStorage.getItem(k), key), original);
    await page.locator('#cancel').click();
    await page.locator('#clear-btn').click(); await page.locator('#clear-btn').click();
    assert.match(await page.locator('#profile-msg').innerText(), prefix ? /无法清除/ : /could not be deleted/);
    assert.equal(await page.locator('#view').isVisible(), true);
    assert.equal(await page.evaluate(() => window.reviewEvents), 0);
    assert.equal(await page.evaluate((k) => localStorage.getItem(k), key), original);
  });

  test(`${lang}: corrupt profiles recover to public pages without JavaScript errors`, async (t) => {
    const { page, visit, errors } = await fixture(t, prefix, { v: 1, children: [null] });
    await visit('/me/');
    assert.equal(await page.locator('#empty').isVisible(), true);
    assert.match(await page.locator('#profile-msg').innerText(), prefix ? /格式无效/ : /invalid/);
    await visit('/tools/');
    assert.equal(await page.locator('#tool-profile-filter').isVisible(), false);
    assert.equal(await page.locator('[data-tool-min]:visible').count(), 7);
    await visit('/library/');
    assert.equal(await page.locator('#age').inputValue(), '');
    assert.equal(await page.locator('[data-profile-context]').isVisible(), false);
    assert.deepEqual(errors, []);
  });
}

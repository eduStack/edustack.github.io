import assert from 'node:assert/strict';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.json': 'application/json' };
let server, browser, origin;
before(async () => {
  assert.ok(existsSync(path.join(dist, 'tools/daily-routine/index.html')), 'Build the site before browser tests.');
  server = createServer((req, res) => {
    try {
      let target = path.resolve(dist, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
      if (!target.startsWith(dist)) { res.writeHead(403).end(); return; }
      if (statSync(target).isDirectory()) target = path.join(target, 'index.html');
      res.setHeader('Content-Type', mime[path.extname(target)] ?? 'application/octet-stream');
      createReadStream(target).pipe(res);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
});
after(async () => {
  await browser?.close(); server?.closeAllConnections();
  if (server?.listening) await new Promise((resolve) => server.close(resolve));
});
async function fixture(t, prefix) {
  const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
  t.after(() => context.close());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  const visit = async (route) => assert.equal((await page.goto(origin + prefix + route)).status(), 200);
  return { page, visit };
}
for (const prefix of ['', '/zh']) {
  const lang = prefix ? 'zh' : 'en';
  test(`${lang}: routine uses exact infant and birthday boundaries and rejects missing or invalid entries`, async (t) => {
    const { page, visit } = await fixture(t, prefix);
    await visit('/tools/daily-routine/');
    const fill = (key, value) => page.locator(`[data-${key}]`).fill(String(value));
    const check = () => page.locator('[data-check]').click();
    const result = page.locator('[data-result]');
    const invalid = prefix ? /请先检查输入/ : /Check the entries first/;
    await check(); assert.match(await result.innerText(), invalid);
    await fill('sleep', 10); await fill('activity', 60); await fill('screen', 1);
    for (const [years, range] of [[5, '10–13'], [6, '9–12'], [12, '9–12'], [13, '8–10']]) {
      await fill('age', years); await check();
      assert.ok((await result.innerText()).includes(range));
      if (prefix) assert.doesNotMatch(await result.innerText(), /Movement|including|WHO gives|Physical activity/);
    }
    await fill('age', 0);
    assert.equal(await page.locator('[data-age-months]').isVisible(), true);
    await check(); assert.match(await result.innerText(), invalid);
    for (const [months, range] of [[0, '14–17'], [3, '14–17'], [4, '12–16'], [11, '12–16']]) {
      await fill('age-months', months); await check(); assert.ok((await result.innerText()).includes(range));
    }
    await fill('age-months', 12); await check(); assert.match(await result.innerText(), invalid);
    for (const years of [-1, 18, 1.5]) {
      await fill('age', years); await check(); assert.match(await result.innerText(), invalid);
    }
    await fill('age', 5);
    assert.equal(await page.locator('[data-age-months]').isDisabled(), true);
    for (const [key, value] of [['sleep', ''], ['sleep', -1], ['sleep', 25], ['sleep', 1.2], ['activity', -1], ['screen', 25]]) {
      await fill('sleep', 10); await fill('activity', 60); await fill('screen', 1);
      await fill(key, value); await check(); assert.match(await result.innerText(), invalid);
    }
    assert.ok(await page.locator('[data-tool-context] a[href$="/resources/who-under5-activity-sleep-2019/"]').count());
    await page.setViewportSize({ width: 320, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('[data-age]').focus(); await page.keyboard.press('Tab');
    assert.equal(await page.locator('[data-sleep]').evaluate((node) => document.activeElement === node), true);
  });

  test(`${lang}: BMI rejects negative height and preserves zero as an optional age record; all tools expose canonical context`, async (t) => {
    const { page, visit } = await fixture(t, prefix);
    await visit('/tools/growth-chart/');
    await page.locator('[data-height]').fill('-170'); await page.locator('[data-weight]').fill('70');
    await page.locator('[data-calculate]').click();
    assert.doesNotMatch(await page.locator('[data-result]').innerText(), /BMI: 24\.2/);
    await page.locator('[data-height]').fill('170'); await page.locator('[data-age]').fill('0');
    await page.locator('[data-calculate]').click();
    assert.match(await page.locator('[data-result]').innerText(), /BMI: 24\.2/);
    assert.match(await page.locator('[data-result]').innerText(), prefix ? /年龄（岁）: 0/ : /Age \(years\): 0/);
    for (const id of ['growth-chart', 'daily-routine', 'milestones', 'screen-agreement', 'task-breakdown']) {
      await visit(`/tools/${id}/`);
      assert.equal(await page.locator(`[data-tool-context="${id}"]`).count(), 1);
      assert.ok(await page.locator('[data-tool-context] a[href*="/ages/"]').count());
      assert.doesNotMatch(await page.locator('h1').innerText(), /\[object Object\]/);
    }
    assert.ok(await page.locator('[data-tool-context] a[href*="/activities/"]').count());
  });

  test(`${lang}: stage sources and local profile facts show only applicable age guidance`, async (t) => {
    const { page, visit } = await fixture(t, prefix);
    await visit('/ages/preschoolers/guide/');
    for (const id of ['activity-3-4y', 'activity-5-17y', 'screen-2-4y', 'screen-5-17y']) {
      assert.ok(await page.locator(`[data-guidance-rule="${id}"] a`).count());
    }
    for (const [months, sleep, activity] of [[3, '14–17', 'who-under5-activity-sleep-2019'], [4, '12–16', 'who-under5-activity-sleep-2019'], [59, '10–13', 'who-under5-activity-sleep-2019'], [60, '10–13', 'who-activity-2020'], [72, '9–12', 'who-activity-2020'], [156, '8–10', 'who-activity-2020']]) {
      const birth = new Date(); birth.setDate(1); birth.setMonth(birth.getMonth() - months);
      await page.evaluate(({ y, m }) => localStorage.setItem('edustack.profiles.v1', JSON.stringify({ v: 1, children: [{ id: 'synthetic', name: 'Synthetic', y, m, sex: '' }], sel: 'synthetic' })), { y: birth.getFullYear(), m: birth.getMonth() + 1 });
      await visit('/me/');
      assert.equal(await page.locator('#v-facts > .card').count(), 3);
      assert.ok((await page.locator('#v-facts').innerText()).includes(sleep));
      assert.ok(await page.locator(`#v-facts a[href$="/resources/${activity}/"]`).count());
      assert.equal(new URL(page.url()).search, '');
    }
    await visit('/tools/');
    for (const id of ['scratch', 'khan-academy', 'khan-academy-kids', 'storyweaver']) {
      assert.match(await page.locator(`[data-tool-verification="${id}"]`).textContent(), prefix ? /待核验/ : /unverified/);
    }
  });
}

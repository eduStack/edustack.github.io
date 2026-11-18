import assert from 'node:assert/strict';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright';

const dist = path.resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const key = 'edustack.profiles.v1';
const toolIds = ['task-breakdown', 'growth-chart', 'daily-routine', 'milestones', 'screen-agreement'];
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.json': 'application/json' };
let server, browser, origin;
const child = (months, id, name) => {
  const birth = new Date(); birth.setDate(1); birth.setMonth(birth.getMonth() - months);
  return { id, name, y: birth.getFullYear(), m: birth.getMonth() + 1, sex: '' };
};
const profiles = { v: 1, children: [child(36, 'first', 'SYNTHETIC_A'), child(156, 'second', 'SYNTHETIC_B')], sel: 'first' };

before(async () => {
  assert.ok(existsSync(path.join(dist, 'tools/task-breakdown/index.html')), 'Build before browser tests.');
  server = createServer((req, res) => {
    try {
      let target = path.resolve(dist, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
      if (target !== dist && !target.startsWith(dist + path.sep)) { res.writeHead(403).end(); return; }
      if (statSync(target).isDirectory()) target = path.join(target, 'index.html');
      res.setHeader('Content-Type', mime[path.extname(target)] ?? 'application/octet-stream');
      res.setHeader('Cache-Control', 'no-store'); createReadStream(target).pipe(res);
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
async function fixture(t, prefix, options = {}) {
  const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, ...options });
  t.after(() => context.close());
  const page = await context.newPage(); page.setDefaultTimeout(10000);
  const errors = []; page.on('pageerror', (error) => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  const visit = async (route) => assert.equal((await page.goto(origin + prefix + route)).status(), 200);
  return { context, page, visit };
}
const noOverflow = async (page) => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Page must fit the viewport.');
const lum = (rgb) => rgb.match(/[\d.]+/g).slice(0, 3).map(Number).map((v) => v / 255).map((v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
const contrast = (a, b) => (Math.max(lum(a), lum(b)) + .05) / (Math.min(lum(a), lum(b)) + .05);

for (const prefix of ['', '/zh']) {
  const lang = prefix ? 'zh' : 'en';
  test(`${lang}: input boundaries, focus, initialisation and 200% text fit narrow screens`, async (t) => {
    const { page, visit } = await fixture(t, prefix, { viewport: { width: 320, height: 900 } });
    for (const id of toolIds) {
      await visit(`/tools/${id}/`);
      assert.equal(await page.locator('[data-tool-controls]').evaluate((node) => node.disabled), false);
      assert.equal(await page.locator('[data-tool-unavailable]').isVisible(), false);
      const input = page.locator('main input:not([type="checkbox"]), main textarea, main select').first();
      const style = await input.evaluate((node) => {
        const s = getComputedStyle(node); return { width: s.borderTopWidth, line: s.borderTopStyle, border: s.borderTopColor, background: s.backgroundColor };
      });
      assert.ok(parseFloat(style.width) >= 1); assert.equal(style.line, 'solid');
      assert.ok(contrast(style.border, style.background) >= 3, 'Input border needs non-text contrast.');
      await input.focus();
      assert.ok(parseFloat(await input.evaluate((node) => getComputedStyle(node).outlineWidth)) >= 3);
      await noOverflow(page);
      await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
      await noOverflow(page);
    }
  });

  for (const id of ['milestones', 'screen-agreement']) {
    test(`${lang}: ${id} protects unsaved navigation, refresh, language and failed saves`, async (t) => {
      const { page, visit } = await fixture(t, prefix);
      await visit(`/tools/${id}/`);
      const field = page.locator(id === 'milestones' ? '[data-question]' : '[data-name]');
      await field.fill('SAVED SYNTHETIC'); await page.locator('[data-save]').click();
      assert.match(await page.locator('[data-result]').innerText(), prefix ? /已保存/ : /Saved/);
      await field.fill('UNSAVED SYNTHETIC');
      assert.match(await page.locator('[data-result]').innerText(), prefix ? /未保存/ : /unsaved/);
      const dialogs = [];
      const handler = async (dialog) => { dialogs.push(dialog.type()); await dialog.dismiss(); };
      page.on('dialog', handler);
      await page.locator('main > nav a').click();
      assert.equal(new URL(page.url()).pathname, `${prefix}/tools/${id}/`);
      assert.equal(await field.inputValue(), 'UNSAVED SYNTHETIC');
      const reloadDialog = page.waitForEvent('dialog');
      await page.evaluate(() => { setTimeout(() => location.reload(), 0); });
      await reloadDialog;
      await page.locator('.language-switcher a').click();
      assert.equal(await field.inputValue(), 'UNSAVED SYNTHETIC');
      assert.deepEqual(dialogs, ['beforeunload', 'beforeunload', 'beforeunload']);
      await page.evaluate(() => { window.originalSetItem = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); }; });
      await page.locator('[data-save]').click();
      assert.match(await page.locator('[data-result]').innerText(), prefix ? /保存失败/ : /Saving failed/);
      await page.locator('main > nav a').click();
      assert.equal(dialogs.at(-1), 'beforeunload');
      assert.equal(await field.inputValue(), 'UNSAVED SYNTHETIC');
      await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
      await page.locator('[data-save]').click();
      const count = dialogs.length; await page.reload();
      assert.equal(dialogs.length, count); assert.equal(await field.inputValue(), 'UNSAVED SYNTHETIC');
      await page.locator('main > nav a').click();
      assert.equal(new URL(page.url()).pathname, `${prefix}/tools/`);
    });
  }

  test(`${lang}: task restore requires confirmation and add/move/delete retain useful keyboard focus`, async (t) => {
    const { page, visit } = await fixture(t, prefix);
    await visit('/tools/task-breakdown/');
    const title = page.locator('[data-title]');
    await title.fill('Saved title'); await page.locator('[data-save]').click();
    await title.fill('Current draft');
    page.once('dialog', (dialog) => dialog.dismiss()); await page.locator('[data-restore]').click();
    assert.equal(await title.inputValue(), 'Current draft');
    page.once('dialog', (dialog) => dialog.accept()); await page.locator('[data-restore]').click();
    assert.equal(await title.inputValue(), 'Saved title');
    await page.locator('[data-add]').click();
    assert.equal(await page.locator('.step-row').last().locator('input[type="text"]').evaluate((node) => node === document.activeElement), true);
    await page.locator('[data-add]').click();
    const firstId = await page.locator('.step-row').first().getAttribute('data-step-id');
    await page.locator('.step-row').first().locator('[data-step-action="down"]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.closest('[data-step-id]')?.dataset.stepId), firstId);
    assert.equal(await page.evaluate(() => document.activeElement.dataset.stepAction), 'down');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.closest('[data-step-id]')?.dataset.stepId), firstId);
    assert.equal(await page.evaluate(() => document.activeElement.matches('input[type="text"]')), true);
    const nextId = await page.locator('.step-row').nth(1).getAttribute('data-step-id');
    await page.locator('.step-row').last().locator('[data-step-action="remove"]').focus(); await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.closest('[data-step-id]')?.dataset.stepId), nextId);
    await page.locator('[data-save]').click();
  });

  test(`${lang}: real cross-tab changes sync all consumers, preserve explicit ages and clear private remnants`, async (t) => {
    const { page, context, visit } = await fixture(t, prefix);
    await visit('/'); const other = await context.newPage(); await other.goto(origin + prefix + '/me/');
    const write = async (value) => other.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key, value });
    for (const [route, selector] of [['library', '#age'], ['activities', '#activity-age'], ['tools', null]]) {
      await write(profiles); await visit(`/${route}/`);
      await write({ ...profiles, sel: 'second' });
      await page.waitForFunction(() => document.querySelector('[data-header-child]').textContent.includes('SYNTHETIC_B'));
      if (selector) { await page.waitForFunction((selector) => document.querySelector(selector).value === 'year:13', selector); }
      else { await page.waitForFunction(() => document.querySelector('#tool-profile-message').textContent.includes('SYNTHETIC_B')); }
      assert.equal(new URL(page.url()).search, '');
      await other.evaluate(() => localStorage.removeItem('edustack.profiles.v1'));
      await page.waitForFunction(() => document.querySelector('[data-header-child]').textContent === '');
      assert.doesNotMatch(await page.locator('body').textContent(), /SYNTHETIC_[AB]/);
      if (selector) assert.equal(await page.locator(selector).inputValue(), route === 'activities' ? 'any' : '');
      else assert.equal(await page.locator('[data-tool-min]:visible').count(), await page.locator('[data-tool-min]').count());
      await write(profiles);
      if (selector) {
        await visit(`/${route}/?age=year%3A6`);
        await write({ ...profiles, sel: 'second' });
        await page.waitForFunction(() => document.querySelector('[data-header-child]').textContent.includes('SYNTHETIC_B'));
        assert.equal(await page.locator(selector).inputValue(), 'year:6');
        assert.equal(new URL(page.url()).searchParams.get('age'), 'year:6');
        await other.evaluate(() => localStorage.clear());
        await page.waitForFunction(() => document.querySelector('[data-header-child]').textContent === '');
        assert.equal(await page.locator(selector).inputValue(), 'year:6');
        await visit(`/${route}/`); await write(profiles);
        await page.waitForFunction((selector) => document.querySelector(selector).value === 'year:3', selector);
        await other.evaluate(() => localStorage.clear());
        await page.waitForFunction((selector) => ['any', ''].includes(document.querySelector(selector).value), selector);
      }
    }
    await write(profiles); await visit('/library/');
    await page.locator('[data-header-trigger]').click();
    await other.evaluate(() => localStorage.setItem('edustack.screen-agreement.v1', '{}'));
    assert.equal(await page.locator('[data-header-menu]').isVisible(), true, 'Unrelated saves must not rerender the header.');
    await page.evaluate(() => window.dispatchEvent(new StorageEvent('storage', { key: 'edustack.profiles.v1', storageArea: sessionStorage })));
    assert.equal(await page.locator('[data-header-menu]').isVisible(), true);
  });

  test(`${lang}: allowed long names and open child menus fit mobile and desktop viewports`, async (t) => {
    const { page, visit } = await fixture(t, prefix);
    await visit('/');
    for (const name of ['孩子的名字'.repeat(6), 'W'.repeat(30)]) {
      await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key, value: { ...profiles, children: [child(36, 'first', name), profiles.children[1]] } });
      for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 900 }); await page.reload();
        await noOverflow(page); await page.locator('[data-header-trigger]').click(); await noOverflow(page);
        const bounds = await page.locator('[data-header-menu]').boundingBox();
        assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1);
        await page.locator('[data-child-id="second"]').click();
        assert.match(await page.locator('[data-header-child]').textContent(), /SYNTHETIC_B/);
        await page.locator('[data-header-trigger]').click(); await page.locator('[data-child-id="first"]').click();
      }
    }
  });

  test(`${lang}: comparison table can scroll by keyboard and tool sections can be reached directly`, async (t) => {
    const { page, visit } = await fixture(t, prefix);
    await visit('/topics/screen-time/');
    const table = page.locator('.tablebox');
    assert.equal(await table.getAttribute('role'), 'region');
    assert.ok(await table.getAttribute('aria-labelledby')); assert.ok(await table.getAttribute('aria-describedby'));
    await table.focus(); await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.querySelector('.tablebox').scrollLeft > 0);
    for (let i = 0; i < 20; i++) await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => { const node = document.querySelector('.tablebox'); return node.scrollWidth - node.clientWidth - node.scrollLeft <= 1; });
    await visit('/tools/');
    assert.equal(await page.locator('#criteria').getAttribute('open'), null);
    await page.locator('a[href="#edustack-tools-heading"]').click();
    assert.equal(new URL(page.url()).hash, '#edustack-tools-heading');
    assert.equal(await page.locator('#edustack-tools-heading').evaluate((node) => node === document.activeElement), true);
    await page.locator('#criteria summary').click();
    assert.equal(await page.locator('#criteria').getAttribute('open'), '');
  });

  test(`${lang}: print hides site chrome and retains age, checks, long text and tool limits`, async (t) => {
    const { page, visit } = await fixture(t, prefix);
    await visit('/tools/milestones/');
    await page.locator('[data-band]').selectOption('preschool');
    const band = await page.locator('[data-band] option:checked').textContent();
    await page.locator('[data-checks] input').first().check();
    await page.locator('[data-question]').fill('SYNTHETIC PRINT QUESTION'); await page.locator('[data-save]').click();
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('.site-header').isVisible(), false);
    assert.equal(await page.locator('.utility-bar').isVisible(), false);
    assert.equal(await page.locator('.site-footer').isVisible(), false);
    assert.equal(await page.locator('[data-print-band]').innerText(), band);
    assert.equal(await page.locator('[data-checks] input').first().isChecked(), true);
    assert.equal(await page.locator('[data-checks] input').first().isVisible(), true);
    assert.equal(await page.locator('[data-print="question"]').innerText(), 'SYNTHETIC PRINT QUESTION');
    assert.equal(await page.locator('.print-only').isVisible(), true);
    await page.emulateMedia({ media: 'screen' });
    await visit('/tools/task-breakdown/');
    await page.locator('[data-title]').fill('Title '.repeat(13));
    await page.locator('.step-row input[type="text"]').fill('Long text '.repeat(16)); await page.locator('[data-save]').click();
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('.print-title').isVisible(), true);
    assert.equal(await page.locator('.print-step').innerText(), 'Long text '.repeat(16));
    assert.equal(await page.locator('.step-controls').isVisible(), false);
    assert.equal(await page.locator('.print-only').isVisible(), true);
  });

  test(`${lang}: numeric printouts retain original values and editing invalidates stale calculations`, async (t) => {
    const { page, visit } = await fixture(t, prefix);
    for (const [id, values, action] of [
      ['growth-chart', { age: '9', height: '132', weight: '27' }, 'calculate'],
      ['daily-routine', { age: '0', 'age-months': '4', sleep: '10', activity: '60', screen: '1' }, 'check'],
    ]) {
      await visit(`/tools/${id}/`);
      for (const [field, value] of Object.entries(values)) await page.locator(`[data-${field}]`).fill(value);
      await page.locator(`[data-${action}]`).click();
      assert.ok(await page.locator('[data-result]').innerText());
      await page.emulateMedia({ media: 'print' });
      for (const [field, value] of Object.entries(values)) {
        assert.equal(await page.locator(`[data-print-field="${field}"]`).isVisible(), true);
        assert.equal(await page.locator(`[data-print-field="${field}"]`).innerText(), value);
      }
      await page.emulateMedia({ media: 'screen' });
      await page.locator('[data-age]').fill('7');
      assert.equal(await page.locator('[data-result]').innerText(), '');
      await page.locator(`[data-${action}]`).click();
      await page.emulateMedia({ media: 'print' });
      assert.equal(await page.locator('[data-print-field="age"]').innerText(), '7');
      if (id === 'daily-routine') assert.equal(await page.locator('[data-print-field="age-months"]').isVisible(), false);
      await page.emulateMedia({ media: 'screen' });
    }
  });

  test(`${lang}: tools explain unavailable scripting and never expose enabled dead controls`, async (t) => {
    const { page, visit } = await fixture(t, prefix, { javaScriptEnabled: false });
    for (const id of toolIds) {
      await visit(`/tools/${id}/`);
      assert.equal(await page.locator('[data-tool-unavailable]').isVisible(), true);
      assert.match(await page.locator('[data-tool-unavailable]').innerText(), /JavaScript/);
      assert.equal(await page.locator('[data-tool-controls]').evaluate((node) => node.disabled), true);
      assert.equal(await page.locator('[data-tool-context]').isVisible(), true);
      for (const button of await page.locator('[data-tool-controls] button').all()) assert.equal(await button.isDisabled(), true);
    }
  });
}

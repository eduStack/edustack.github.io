import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { buildPwa } from './pwa-build.mjs';

async function fixture(t) {
  const dir = await mkdtemp(path.join(tmpdir(), 'edustack-pwa-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const files = {
    'index.html': '<html><head></head><body>Home</body></html>',
    'zh/index.html': '<html><head></head><body>首页</body></html>',
    'offline/index.html': '<html><head></head><body>Offline</body></html>',
    'zh/offline/index.html': '<html><head></head><body>离线</body></html>',
    'resources/example/index.html': '<html><head></head><body>Reading</body></html>',
    '_astro/app.123.js': 'console.log("app");',
    'reference/index.html': '<html><head></head><body>Original</body></html>',
    'editorial/home/family-640.webp': 'image fixture',
  };
  for (const [file, data] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(dir, file)), { recursive: true });
    await writeFile(path.join(dir, file), data);
  }
  return dir;
}

test('PWA build separates the small offline core from visited pages and the reference snapshot', async (t) => {
  const dir = await fixture(t);
  const config = await buildPwa(dir);
  assert.ok(config.precache.includes('/'));
  assert.ok(config.precache.includes('/zh/offline/'));
  assert.ok(config.precache.includes('/_astro/app.123.js'));
  assert.ok(config.precache.includes('/editorial/home/family-640.webp'));
  assert.ok(config.navigationPaths.includes('/resources/example/'));
  assert.ok(!config.precache.includes('/resources/example/'));
  assert.ok(!JSON.stringify(config).includes('reference'));
  assert.ok((await readFile(path.join(dir, 'index.html'), 'utf8')).includes(`content="${config.version}"`));
  assert.ok(!(await readFile(path.join(dir, 'reference/index.html'), 'utf8')).includes('edustack-version'));
  const second = await buildPwa(dir);
  assert.equal(second.version, config.version);
  await writeFile(path.join(dir, 'reference/index.html'), 'Reference changes do not version the current app');
  assert.equal((await buildPwa(dir)).version, config.version);
  await writeFile(path.join(dir, 'resources/example/index.html'), '<html><head></head><body>New reading</body></html>');
  assert.notEqual((await buildPwa(dir)).version, config.version);
});

test('PWA build respects a project-site base path', async (t) => {
  const config = await buildPwa(await fixture(t), '/example');
  assert.equal(config.base, '/example/');
  assert.ok(config.precache.every((url) => url.startsWith('/example/')));
  assert.ok(config.navigationPaths.every((url) => url.startsWith('/example/')));
});

async function workerFixture() {
  const handlers = new Map();
  const storage = new Map();
  const context = vm.createContext({
    self: { location: { origin: 'https://www.edustack.org' }, clients: { claim: async () => {} }, addEventListener: (type, fn) => handlers.set(type, fn) },
    caches: {
      keys: async () => [...storage.keys()],
      delete: async (name) => storage.delete(name),
      open: async (name) => {
        if (!storage.has(name)) storage.set(name, new Map());
        const cache = storage.get(name);
        return {
          delete: async (key) => cache.delete(key),
          put: async (key, value) => cache.set(key, value),
          match: async (key) => cache.get(key)?.clone(),
          keys: async () => [...cache.keys()],
        };
      },
    },
    URL, Request, Response, Set, AbortController, setTimeout, clearTimeout,
  });
  const source = (await readFile(new URL('./pwa/service-worker.js', import.meta.url), 'utf8')).replace('const CONFIG = null;', 'const CONFIG = {base:"/",version:"test",cachePrefix:"edustack-fixture-",navigationPaths:["/","/resources/example/"],precache:["/"]};');
  vm.runInContext(source, context);
  return { context, handlers, storage };
}

test('service worker bypasses external requests, reference pages, update checks and writes', async () => {
  const { handlers } = await workerFixture();
  for (const [url, method] of [
    ['https://external.example/paper', 'GET'],
    ['https://www.edustack.org/reference/', 'GET'],
    ['https://www.edustack.org/version.json', 'GET'],
    ['https://www.edustack.org/sw.js', 'GET'],
    ['https://www.edustack.org/', 'POST'],
  ]) {
    let intercepted = false;
    handlers.get('fetch')({ request: { url, method, mode: 'navigate' }, respondWith: () => { intercepted = true; } });
    assert.equal(intercepted, false, url);
  }
});

test('runtime page cache is bounded and refuses failed or cross-origin responses', async () => {
  const { context, storage } = await workerFixture();
  for (let n = 0; n < 35; n++) await vm.runInContext(`store(pageCache, '/page-${n}/', new Response('Page ${n}'), 30)`, context);
  const pages = storage.get('edustack-fixture-test-pages');
  assert.equal(pages.size, 30);
  assert.ok(!pages.has('/page-0/'));
  assert.ok(pages.has('/page-34/'));
  await vm.runInContext("store(pageCache, '/failed/', new Response('Missing', {status:404}), 30)", context);
  assert.ok(!pages.has('/failed/'));
  context.externalResponse = new Response('External');
  Object.defineProperty(context.externalResponse, 'url', { value: 'https://external.example/paper' });
  await vm.runInContext("store(pageCache, '/external/', externalResponse, 30)", context);
  assert.ok(!pages.has('/external/'));
});

test('offline fallback marks saved pages and tolerates reclaimed browser storage', async () => {
  const { context } = await workerFixture();
  const saved = await vm.runInContext("markSaved(new Response('<html lang=\"en\"><body>Saved</body></html>'))", context);
  assert.ok((await saved.text()).includes('data-pwa-cached="true"'));
  const missing = await vm.runInContext('markSaved(null)', context);
  assert.equal(missing.status, 503);
  assert.ok((await missing.text()).includes('reconnect'));
});

test('activation keeps one previous release and leaves other applications caches alone', async () => {
  const { handlers, storage } = await workerFixture();
  for (const name of ['edustack-fixture-old-core', 'edustack-fixture-old-pages', 'edustack-fixture-previous-core', 'edustack-fixture-previous-images', 'edustack-fixture-test-core', 'another-app-cache']) storage.set(name, new Map());
  let activation = Promise.resolve();
  handlers.get('activate')({ waitUntil: (promise) => { activation = promise; } });
  await activation;
  assert.deepEqual([...storage.keys()], ['edustack-fixture-previous-core', 'edustack-fixture-previous-images', 'edustack-fixture-test-core', 'another-app-cache']);
});

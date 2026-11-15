/* Replaced with build-specific paths and version by the Astro integration. */
const CONFIG = null;
const prefix = CONFIG.cachePrefix;
const coreCache = `${prefix}${CONFIG.version}-core`;
const pageCache = `${prefix}${CONFIG.version}-pages`;
const imageCache = `${prefix}${CONFIG.version}-images`;
const navigationPaths = new Set(CONFIG.navigationPaths);
const precachePaths = new Set(CONFIG.precache);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(coreCache);
    try {
      await cache.addAll(CONFIG.precache.map((url) => new Request(url, { cache: 'reload' })));
    } catch (error) {
      await caches.delete(coreCache);
      throw error;
    }
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = (await caches.keys()).filter((name) => name.startsWith(prefix));
    const versions = names.filter((name) => name.endsWith('-core')).map((name) => name.slice(prefix.length, -5));
    // Keep the previous release for open tabs still requesting its hashed files.
    const keep = new Set([CONFIG.version, ...versions.filter((version) => version !== CONFIG.version).slice(-1)]);
    await Promise.all(names.filter((name) => ![...keep].some((version) => name.startsWith(`${prefix}${version}-`))).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'GET_VERSION') event.ports[0]?.postMessage({ version: CONFIG.version });
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
});

async function savedResponse(path, suffixes) {
  for (const name of suffixes.map((suffix) => `${prefix}${CONFIG.version}${suffix}`)) {
    const cache = await caches.open(name);
    const response = await cache.match(path);
    if (response) return response;
  }
  const names = (await caches.keys()).filter((name) => name.startsWith(prefix) && suffixes.some((suffix) => name.endsWith(suffix)) && ![coreCache, pageCache, imageCache].includes(name));
  for (const name of names.reverse()) {
    const response = await (await caches.open(name)).match(path);
    if (response) return response;
  }
  return null;
}

async function store(name, path, response, limit) {
  if (!response.ok || (response.url && new URL(response.url).origin !== self.location.origin)) return;
  try {
    const cache = await caches.open(name);
    await cache.delete(path);
    await cache.put(path, response.clone());
    const keys = await cache.keys();
    await Promise.all(keys.slice(0, Math.max(0, keys.length - limit)).map((key) => cache.delete(key)));
  } catch { /* Storage limits must not prevent online reading. */ }
}

async function markSaved(response) {
  if (!response) return new Response('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>eduStack</title><h1>eduStack</h1><p>Please reconnect to open this page. / 请联网后重新打开此页面。</p></html>', { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  const html = (await response.text()).replace(/<html\b/i, '<html data-pwa-cached="true"');
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

async function navigate(request, path) {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 6000);
  try {
    const response = await fetch(request, { cache: 'no-store', signal: abort.signal });
    if (response.status >= 500) throw new Error('Server unavailable');
    if (response.ok && response.headers.get('Content-Type')?.includes('text/html')) await store(pageCache, path, response, 30);
    return response;
  } catch {
    const saved = await savedResponse(path, ['-pages', '-core']);
    if (saved) return markSaved(saved);
    const offline = path.startsWith(`${CONFIG.base}zh/`) ? `${CONFIG.base}zh/offline/` : `${CONFIG.base}offline/`;
    return markSaved(await (await caches.open(coreCache)).match(offline));
  } finally { clearTimeout(timer); }
}

async function asset(request, path, cacheFirst) {
  if (cacheFirst) {
    const saved = await savedResponse(path, ['-core', '-images']);
    if (saved) return saved;
  }
  try {
    const response = await fetch(request, { cache: 'no-cache' });
    if (response.status >= 500) throw new Error('Server unavailable');
    await store(imageCache, path, response, 40);
    return response;
  } catch {
    return (await savedResponse(path, ['-core', '-images'])) || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(CONFIG.base)) return;
  const path = url.pathname;
  // Never cache the reference snapshot, update checks, external files or profile data.
  if (path.startsWith(`${CONFIG.base}reference/`) || [CONFIG.base + 'sw.js', CONFIG.base + 'version.json'].includes(path)) return;
  if (event.request.mode === 'navigate') {
    if (navigationPaths.has(path)) event.respondWith(navigate(event.request, path));
    return;
  }
  if (precachePaths.has(path)) {
    event.respondWith(asset(event.request, path, true));
  } else if (path.startsWith(`${CONFIG.base}_astro/`)) {
    event.respondWith(asset(event.request, path, true));
  } else if (path.startsWith(`${CONFIG.base}editorial/home/`) && /\.(webp|png|svg)$/.test(path)) {
    event.respondWith(asset(event.request, event.request.url, false));
  }
});

import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

async function filesIn(dir, prefix = '') {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'reference') continue;
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(path.join(dir, entry.name), relative));
    else files.push(relative);
  }
  return files.sort();
}

export async function buildPwa(dir, base = '/') {
  const segments = base.split('/').filter(Boolean).join('/');
  base = segments ? `/${segments}/` : '/';
  const files = (await filesIn(dir)).filter((file) => !['sw.js', 'version.json'].includes(file));
  const worker = await readFile(new URL('./pwa/service-worker.js', import.meta.url), 'utf8');
  const hash = createHash('sha256').update(base).update(worker);
  const pages = new Map();
  for (const file of files) {
    const data = await readFile(path.join(dir, file));
    if (file.endsWith('.html')) {
      const html = data.toString().replace(/<meta name="edustack-version" content="[^"]*"\s*\/?>/g, '');
      pages.set(file, html);
      hash.update(file).update(html);
    } else hash.update(file).update(data);
  }
  const version = hash.digest('hex').slice(0, 12);
  await Promise.all([...pages].map(([file, html]) => writeFile(path.join(dir, file), html.replace('<head>', `<head><meta name="edustack-version" content="${version}">`))));
  const route = (file) => base + file.replace(/index\.html$/, '');
  const navigationPaths = files.filter((file) => file.endsWith('/index.html') || file === 'index.html').map(route);
  const precache = [
    base, `${base}zh/`, `${base}offline/`, `${base}zh/offline/`,
    ...files.filter((file) =>
      (file.startsWith('_astro/') && /\.(js|css)$/.test(file)) ||
      (file.startsWith('editorial/') && file.endsWith('.woff2')) ||
      /^editorial\/home\/(family|dinner)-\d+\.webp$/.test(file) ||
      file.startsWith('icons/') || file.endsWith('.webmanifest') || file === 'edustack-icon.svg',
    ).map((file) => base + file),
  ];
  const config = { version, base, navigationPaths, precache, cachePrefix: `edustack-${createHash('sha256').update(base).digest('hex').slice(0, 8)}-` };
  await writeFile(path.join(dir, 'sw.js'), worker.replace('const CONFIG = null;', `const CONFIG = ${JSON.stringify(config)};`));
  await writeFile(path.join(dir, 'version.json'), JSON.stringify({ version }));
  return config;
}

export function pwaIntegration() {
  let base = '/';
  return {
    name: 'edustack-lightweight-pwa',
    hooks: {
      'astro:config:done': ({ config }) => { base = config.base; },
      'astro:build:done': async ({ dir, logger }) => {
        const config = await buildPwa(fileURLToPath(dir), base);
        logger.info(`PWA ${config.version}: ${config.precache.length} core files; visited-page cache limited to 30 per release.`);
      },
    },
  };
}

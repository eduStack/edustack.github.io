import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import yaml from 'js-yaml';
import { publishedItems } from '../src/lib/publication.mjs';

const project = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(project, 'dist');
const collections = ['resources', 'tools', 'educators', 'topics', 'activities'];
const load = (name) => publishedItems(yaml.load(readFileSync(path.join(project, `src/data/${name}.yaml`), 'utf8')));
const publicKey = (name, item) => `${name === 'resources' ? item.type : { tools: 'tool', educators: 'educator', topics: 'topic', activities: 'activity' }[name]}:${item.id}`;
const readIndex = (root, language = '') => {
  const html = readFileSync(path.join(root, language, 'library/index.html'), 'utf8');
  const match = html.match(/<script\b[^>]*id="library-index"[^>]*>([\s\S]*?)<\/script>/);
  assert.ok(match, 'library contains a public search index');
  return JSON.parse(match[1]);
};
const filesIn = (dir, prefix = '') => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  if (entry.name === 'reference') return [];
  const relative = path.posix.join(prefix, entry.name);
  return entry.isDirectory() ? filesIn(path.join(dir, entry.name), relative) : [relative];
});

test('built bilingual library contains exactly the published collections and every result has a route', () => {
  assert.ok(existsSync(path.join(output, 'library/index.html')), 'run npm run build before test:built');
  const expected = collections.flatMap((name) => load(name).map((item) => publicKey(name, item))).sort();
  for (const language of ['', 'zh']) {
    const entries = readIndex(output, language);
    assert.deepEqual(entries.map((item) => item.key).sort(), expected);
    for (const entry of entries) assert.ok(existsSync(path.join(output, language, entry.path, 'index.html')), `${language}/${entry.path}`);
    assert.ok(entries.every((entry) => entry.title.en && entry.title.zh && entry.summary.en && entry.summary.zh));
  }
});

test('generated current-site links, anchors and local assets resolve; external links use a separate context', () => {
  const pages = filesIn(output).filter((file) => file.endsWith('.html'));
  const problems = [];
  const decode = (value) => value.replace(/&amp;/g, '&').replace(/&#(?:x([0-9a-f]+)|(\d+));/gi, (_, hex, decimal) => String.fromCodePoint(parseInt(hex ?? decimal, hex ? 16 : 10)));
  for (const file of pages) {
    const html = readFileSync(path.join(output, file), 'utf8');
    const pageUrl = new URL(file.replace(/index\.html$/, ''), 'https://www.edustack.org/');
    for (const match of html.matchAll(/<(a|link|script|img)\b([^>]+)>/g)) {
      const attributes = match[2];
      const attribute = attributes.match(match[1] === 'script' || match[1] === 'img' ? /\bsrc="([^"]+)"/ : /\bhref="([^"]+)"/);
      if (!attribute || /^(?:mailto:|tel:|data:|javascript:)/i.test(attribute[1])) continue;
      const url = new URL(decode(attribute[1]), pageUrl);
      if (url.origin !== pageUrl.origin) {
        if (match[1] === 'a' && /^https?:$/.test(url.protocol) && (!/\btarget="_blank"/.test(attributes) || !/\brel="[^"]*noopener/.test(attributes))) problems.push(`${file}: external link attributes ${url.href}`);
        continue;
      }
      if (url.pathname.startsWith('/reference/')) continue;
      let target = path.join(output, decodeURIComponent(url.pathname));
      if (url.pathname.endsWith('/')) target = path.join(target, 'index.html');
      else if (!existsSync(target)) target = path.join(target, 'index.html');
      if (!existsSync(target)) { problems.push(`${file}: missing ${url.pathname}`); continue; }
      if (match[1] === 'a' && url.hash && target.endsWith('.html')) {
        const fragment = decodeURIComponent(url.hash.slice(1));
        const targetHtml = readFileSync(target, 'utf8');
        if (!targetHtml.includes(`id="${fragment}"`) && !targetHtml.includes(`name="${fragment}"`)) problems.push(`${file}: missing fragment ${url.pathname}${url.hash}`);
      }
    }
  }
  assert.deepEqual(problems, []);
});

test('built PWA includes the new tool routes with a consistent version and excludes the reference snapshot', () => {
  const worker = readFileSync(path.join(output, 'sw.js'), 'utf8');
  const config = JSON.parse(worker.match(/const CONFIG = (\{[^\n]+\});/)[1]);
  const { version } = JSON.parse(readFileSync(path.join(output, 'version.json'), 'utf8'));
  assert.equal(config.version, version);
  assert.ok(!JSON.stringify(config).includes('/reference/'));
  for (const tool of load('tools')) {
    for (const prefix of ['', 'zh/']) {
      const route = `/${prefix}tools/${tool.id}/`;
      assert.ok(config.navigationPaths.includes(route), route);
      assert.ok(readFileSync(path.join(output, prefix, `tools/${tool.id}/index.html`), 'utf8').includes(`content="${version}"`));
    }
  }
  for (const stage of load('stages')) for (const prefix of ['', 'zh/']) {
    assert.ok(config.navigationPaths.includes(`/${prefix}ages/${stage.id}/`));
    assert.ok(config.navigationPaths.includes(`/${prefix}ages/${stage.id}/guide/`));
  }
});

test('stage homepages expose their reviewed selections and preserve access to all three guide sections', () => {
  for (const language of ['', 'zh']) for (const home of load('stage-home')) {
    const html = readFileSync(path.join(output, language, 'ages', home.id, 'index.html'), 'utf8');
    const guide = readFileSync(path.join(output, language, 'ages', home.id, 'guide/index.html'), 'utf8');
    assert.ok(html.includes(`data-stage-home="${home.id}"`));
    for (const selection of [...home.startingPoints, home.reflection, ...home.context, ...(home.updates ?? [])]) assert.ok(html.includes(`data-resource="${selection.resource}"`));
    for (const selection of home.tools) assert.ok(html.includes(`data-tool="${selection.tool}"`));
    for (const id of ['develop', 'together', 'health']) {
      assert.ok(html.includes(`/ages/${home.id}/guide/#${id}`));
      assert.ok(guide.includes(`id="${id}"`));
    }
    if (!home.tools.length) assert.ok(html.includes('data-tools-empty'));
    if (!home.updates?.length) assert.ok(html.includes('data-recent-empty'));
    assert.match(html, /id="legacy-stage-anchor-bridge"/);
    assert.match(html, /location\.replace/);
  }
  const library = readFileSync(path.join(output, 'library/index.html'), 'utf8');
  assert.match(library, /<form\b[^>]*id="library-filters"[^>]*role="search"/);
});

test('built profile context is optional and contains no child record', () => {
  for (const language of ['', 'zh']) for (const page of ['index.html', 'ages/toddlers/index.html', 'ages/toddlers/guide/index.html', 'library/index.html', 'tools/index.html', 'me/index.html']) {
    const html = readFileSync(path.join(output, language, page), 'utf8');
    // Child context is now kept in the compact header control; the older
    // full-width context block remains optional on pages that use it.
    assert.match(html, /data-header-profile/);
    if (html.includes('data-profile-context')) assert.match(html, /data-profile-context[^>]*\bhidden(?:\s|>)/);
    assert.doesNotMatch(html, /Test child|PRIVATE_PROFILE|profileName|birthYear|birthMonth/);
  }
});

test('an isolated real build excludes draft, in-review and withdrawn records from routes, HTML and browser assets', { timeout: 120000 }, (t) => {
  const fixture = mkdtempSync(path.join(tmpdir(), 'edustack-publication-build-'));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  for (const name of ['src', 'scripts', 'public', 'package.json', 'tsconfig.json', 'astro.config.mjs']) {
    cpSync(path.join(project, name), path.join(fixture, name), { recursive: true, filter: (source) => source !== path.join(project, 'public/reference') });
  }
  symlinkSync(path.join(project, 'node_modules'), path.join(fixture, 'node_modules'), 'dir');
  const sentinels = [];
  for (const name of [...collections, 'stages', 'stage-home', 'tips']) {
    const file = path.join(fixture, `src/data/${name}.yaml`);
    const records = yaml.load(readFileSync(file, 'utf8'));
    for (const publicationStatus of ['draft', 'in-review', 'needs-review']) {
      const id = `private-fixture-${name}-${publicationStatus}`;
      records.push({ id, publicationStatus, privateNote: `PRIVATE_SENTINEL_${id}` });
      sentinels.push(id);
    }
    writeFileSync(file, yaml.dump(records));
  }
  const homeFile = path.join(fixture, 'src/data/stage-home.yaml');
  const homes = yaml.load(readFileSync(homeFile, 'utf8'));
  homes.find((home) => home.id === 'babies').updates = [{ resource: 'aap-safe-sleep', selectedOn: '2026-11-15', reason: { en: 'Fixture editorial selection; original source date retained.', zh: '测试编辑选材，保留原始资料日期。' } }];
  homes.find((home) => home.id === 'school-age').tools = [];
  writeFileSync(homeFile, yaml.dump(homes));
  const result = spawnSync(process.execPath, [path.join(project, 'node_modules/astro/astro.js'), 'build'], {
    cwd: fixture, encoding: 'utf8', timeout: 100000, maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, SITE_URL: 'https://www.edustack.org', BASE_PATH: '/', ASTRO_TELEMETRY_DISABLED: '1' },
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const fixtureOutput = path.join(fixture, 'dist');
  for (const file of filesIn(fixtureOutput)) {
    assert.ok(!sentinels.some((id) => file.includes(id)), `unpublished route ${file}`);
    if (!/\.(html|js|json)$/.test(file)) continue;
    const text = readFileSync(path.join(fixtureOutput, file), 'utf8');
    assert.ok(!text.includes('PRIVATE_SENTINEL_') && !sentinels.some((id) => text.includes(id)), `unpublished content in ${file}`);
  }
  assert.equal(readIndex(fixtureOutput).length, readIndex(output).length);
  const babyHome = readFileSync(path.join(fixtureOutput, 'ages/babies/index.html'), 'utf8');
  assert.ok(babyHome.includes('data-stage-updates') && !babyHome.includes('data-recent-empty'));
  assert.ok(babyHome.includes('datetime="2026-11-15"') && babyHome.includes('2022'));
  const schoolHome = readFileSync(path.join(fixtureOutput, 'ages/school-age/index.html'), 'utf8');
  assert.ok(schoolHome.includes('data-tools-empty') && schoolHome.includes('No tool has been selected for this stage yet.'));
  assert.ok(!schoolHome.includes('no tool listed for babies'));
});

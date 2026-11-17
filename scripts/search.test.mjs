import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';
import yaml from 'js-yaml';
import { defaultSearchState, parseSearchState, serializeSearchState, searchEntries } from '../src/lib/search/engine.mjs';
import { publishedItems } from '../src/lib/publication.mjs';

function entry(id, overrides = {}) {
  const type = overrides.type ?? 'book';
  return {
    key: `${type}:${id}`, id, type, title: { en: id, zh: id }, summary: { en: '', zh: '' },
    path: `resources/${id}`, by: '', year: null, minMonths: null, maxMonths: null,
    topics: [], free: null, languages: [], sourceLanguage: null, keywords: [], core: false,
    preparing: false, ...overrides,
  };
}
const search = (entries, overrides = {}) => searchEntries(entries, { ...defaultSearchState(), ...overrides });
const ids = (entries) => entries.map((item) => item.id);

test('mixed types browse together, deduplicate by type:id and boost editorial core selections', () => {
  const entries = [entry('one'), entry('two', { type: 'tool' }), entry('core', { core: true }), entry('one'), entry('one', { type: 'educator' })];
  assert.deepEqual(ids(search(entries)), ['core', 'one', 'two', 'one']);
  assert.deepEqual(ids(search(entries, { type: 'tool' })), ['two']);
});

test('bilingual titles, original titles, authors, summaries, topic labels and everyday aliases are searchable', () => {
  const entries = [entry('feelings', { title: { en: 'Understanding Feelings', zh: '理解情绪' }, by: 'Jane Smith',
    keywords: ['Original Work'], summary: { en: 'A family guide', zh: '家庭阅读' }, topics: ['emotions'] })];
  for (const q of ['理解情绪', 'ORIGINAL work', 'Jane Smith', '家庭阅读', 'big feelings', '发脾气', '情绪']) {
    assert.equal(search(entries, { q }).length, 1, q);
  }
  assert.equal(search(entries, { q: 'feelings missing' }).length, 0);
  assert.equal(search(entries, { q: 'ADHD' }).length, 0);
});

test('title precision beats summary and core boosts; accent and punctuation differences are tolerated', () => {
  const entries = [entry('summary', { summary: { en: 'How to Play', zh: '' }, core: true }),
    entry('partial', { title: { en: 'How to Play Together', zh: '' } }),
    entry('exact', { title: { en: 'How to Play', zh: '' } }),
    entry('accent', { title: { en: 'Émile: learning', zh: '' } })];
  assert.deepEqual(ids(search(entries, { q: 'how to play' })), ['exact', 'partial', 'summary']);
  assert.deepEqual(ids(search(entries, { q: 'emile learning' })), ['accent']);
});

test('all filter dimensions intersect and unknown access/language metadata never implies a match', () => {
  const good = entry('good', { type: 'tool', topics: ['learning'], minMonths: 36, maxMonths: 71, free: true, languages: ['en'] });
  const entries = [good, entry('unknown'), entry('paid', { ...good, key: 'tool:paid', id: 'paid', free: false }),
    entry('multi', { ...good, key: 'tool:multi', id: 'multi', languages: ['multi'] })];
  const filters = { type: 'tool', age: '36', topic: 'learning', language: 'en', free: true };
  assert.deepEqual(ids(search(entries, filters)), ['good']);
  assert.deepEqual(ids(search(entries, { ...filters, q: 'missing' })), []);
  assert.deepEqual(ids(search(entries, { ...filters, language: 'multi' })), ['multi']);
  assert.deepEqual(ids(search([entry('unknown')], { free: true })), []);
  assert.deepEqual(ids(search([entry('unknown')], { language: 'en' })), []);
});

test('exact month bounds are inclusive and stage filtering overlaps rather than requiring containment', () => {
  const entries = [entry('boundary', { minMonths: 11, maxMonths: 12 }), entry('unknown'), entry('end', { minMonths: 215, maxMonths: 215 })];
  for (const age of ['11', '12', 'babies', 'toddlers']) assert.deepEqual(ids(search(entries, { age })), ['boundary'], age);
  for (const age of ['0', '13', 'preschoolers', 'school-age']) assert.deepEqual(ids(search(entries, { age })), [], age);
  for (const age of ['215', 'teens']) assert.deepEqual(ids(search(entries, { age })), ['end'], age);
});

test('newest uses publication year, puts null last and retains deterministic ties', () => {
  const entries = [entry('unknown-core', { core: true }), entry('old', { year: 1920 }),
    entry('new-a', { year: 2025 }), entry('new-core', { year: 2025, core: true }),
    entry('new-b', { year: 2025 }), entry('unknown')];
  assert.deepEqual(ids(search(entries, { sort: 'newest' })), ['new-core', 'new-a', 'new-b', 'old', 'unknown-core', 'unknown']);
});

test('URLs round-trip only validated public state in stable order and omit defaults', () => {
  const state = { q: '亲子 play', type: 'guide', age: 'toddlers', topic: 'play', language: 'zh', free: true, sort: 'newest' };
  const params = serializeSearchState(state);
  assert.deepEqual([...params.keys()], ['q', 'type', 'age', 'topic', 'language', 'free', 'sort']);
  assert.deepEqual(parseSearchState(params), state);
  assert.equal(serializeSearchState(defaultSearchState()).toString(), '');
  const invalid = new URLSearchParams('type=private&age=216&topic=__proto__&language=xx&free=true&sort=checked&childId=secret&sex=female');
  assert.deepEqual(parseSearchState(invalid), defaultSearchState());
  for (const age of ['-1', '1.5', '01', '1e2', '216', 'unknown']) assert.equal(parseSearchState(new URLSearchParams({ age })).age, '');
  assert.equal(parseSearchState(new URLSearchParams({ q: 'x'.repeat(1000) })).q.length, 200);
  assert.equal(serializeSearchState({ ...state, childId: 'secret', sex: 'female' }).toString().includes('secret'), false);
});

test('server adapter indexes published real collections, preserves unknowns and tool inclusive year labels', async () => {
  const collections = Object.fromEntries(['resources', 'tools', 'educators', 'topics', 'activities'].map((name) => [name,
    publishedItems(yaml.load(readFileSync(new URL(`../src/data/${name}.yaml`, import.meta.url), 'utf8')))]));
  // Exercise the adapter's own defensive publication guard after the filtered loader boundary.
  collections.resources.push({ ...collections.resources[0], id: 'unpublished-fixture', publicationStatus: 'draft' });
  const source = readFileSync(new URL('../src/lib/search/index.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const executable = compiled.replace(/import \{ activityAgeLabel \} from ['"]\.\.\/activity-filter\.mjs['"];?/, `import { activityAgeLabel } from '${new URL('../src/lib/activity-filter.mjs', import.meta.url).href}';`).replace(/import \{ activities, educators, resources, tools, topics \} from ['"]\.\.\/data['"];?/, `const { activities, educators, resources, tools, topics } = ${JSON.stringify(collections)};`);
  const { buildSearchIndex } = await import(`data:text/javascript;base64,${Buffer.from(executable).toString('base64')}`);
  const index = buildSearchIndex();
  assert.equal(index.some((item) => item.id === 'unpublished-fixture'), false);
  assert.equal(new Set(index.map((item) => item.key)).size, index.length);
  assert.equal(index.length, Object.values(collections).reduce((sum, items) => sum + items.length, 0) - 1);
  for (const tool of collections.tools) {
    const item = index.find((candidate) => candidate.key === `tool:${tool.id}`);
    assert.equal(item.minMonths, tool.minAge * 12);
    assert.equal(item.maxMonths, Math.min((tool.maxAge + 1) * 12 - 1, 215));
    assert.equal(item.path, `tools/${tool.id}`);
    assert.equal(item.ageLabel.en, `Ages ${tool.minAge}–${tool.maxAge}`);
    assert.equal(item.ageLabel.zh, `${tool.minAge}–${tool.maxAge} 岁`);
  }
  for (const item of index.filter((item) => ['educator', 'topic'].includes(item.type))) {
    assert.equal(item.minMonths, null);
    assert.equal(item.maxMonths, null);
    assert.equal(item.year, null);
    assert.equal(item.free, null);
    assert.deepEqual(item.languages, []);
  }
  assert.ok(index.every((item) => item.languages.every((language) => ['en', 'zh', 'es', 'multi'].includes(language))));
  assert.ok(search(index, { q: 'programming', type: 'tool' }).some((item) => item.id === 'scratch'));
  for (const educator of collections.educators) {
    for (const lang of ['en', 'zh']) {
      for (const q of [educator.question[lang], ...educator.works.map((work) => work.title[lang])]) {
        assert.ok(search(index, { q, type: 'educator' }).some((item) => item.id === educator.id), `${educator.id}: ${q}`);
      }
    }
  }
  const browserSource = readFileSync(new URL('../src/lib/search/engine.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(browserSource, /from\s+['"][^'"]*(?:data|index)(?:\.ts)?['"]/);
});

import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import yaml from 'js-yaml';
import { publicationStatuses, publishedItems } from '../src/lib/publication.mjs';

const project = fileURLToPath(new URL('../', import.meta.url));
const collections = ['resources', 'stages', 'topics', 'tips', 'tools', 'educators'];

function validateFixture(t, edit) {
  const root = mkdtempSync(join(tmpdir(), 'edustack-content-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const path of ['scripts/validate-data.mjs', 'src/lib/publication.mjs', 'src/lib/taxonomy.mjs']) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    cpSync(join(project, path), join(root, path));
  }
  // Resolve the existing parser without installing dependencies in each fixture.
  const validatorPath = join(root, 'scripts/validate-data.mjs');
  writeFileSync(validatorPath, readFileSync(validatorPath, 'utf8').replace("from 'js-yaml'", `from ${JSON.stringify(new URL('../node_modules/js-yaml/dist/js-yaml.mjs', import.meta.url).href)}`));
  const data = Object.fromEntries([...collections, 'sources'].map((name) => [name, yaml.load(readFileSync(join(project, `src/data/${name}.yaml`), 'utf8'))]));
  edit(data);
  mkdirSync(join(root, 'src/data'), { recursive: true });
  for (const [name, items] of Object.entries(data)) writeFileSync(join(root, `src/data/${name}.yaml`), yaml.dump(items));
  return spawnSync(process.execPath, [validatorPath], { encoding: 'utf8' });
}

test('publication filtering defaults to exclusion and allows only published items', () => {
  const items = [...publicationStatuses.map((publicationStatus) => ({ publicationStatus })), {}, { publicationStatus: 'publish' }];
  assert.deepEqual(publishedItems(items), [{ publicationStatus: 'published' }]);
});

test('all six collections can hold incomplete unpublished records without exposing them', (t) => {
  const result = validateFixture(t, (data) => {
    for (const name of collections) {
      for (const publicationStatus of ['draft', 'in-review', 'needs-review']) data[name].push({ id: `fixture-${publicationStatus}`, publicationStatus });
    }
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /49 resources, 5 stages, 4 topics, 10 educators/);
});

test('missing or unknown publication states fail validation', (t) => {
  const result = validateFixture(t, (data) => {
    data.resources.push({ id: 'missing-state' }, { id: 'unknown-state', publicationStatus: 'publish' });
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing-state: needs a valid publicationStatus/);
  assert.match(result.stderr, /unknown-state: needs a valid publicationStatus/);
});

test('public references to a withdrawn resource block publication', (t) => {
  const result = validateFixture(t, (data) => {
    data.resources.find((r) => r.id === 'who-under5-activity-sleep-2019').publicationStatus = 'needs-review';
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unknown or unpublished resource who-under5-activity-sleep-2019|unknown source who-under5-activity-sleep-2019/);
});

test('age boundaries cannot overlap, leave gaps or change primary stage order', (t) => {
  const result = validateFixture(t, (data) => { data.stages[1].minMonths = 11; });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /five ordered, non-overlapping primary age ranges/);
});

test('unrecognised topic tags cannot silently disappear from resource filters', (t) => {
  const result = validateFixture(t, (data) => { data.resources[0].topics.push('self-regualtion'); });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /needs recognised resource topics/);
});

test('source-check dates must represent real calendar dates', (t) => {
  const result = validateFixture(t, (data) => { data.resources[0].checked = '2026-02-30'; });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /checked: needs a valid YYYY-MM-DD date/);
});

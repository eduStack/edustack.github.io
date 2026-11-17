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
const collections = ['resources', 'stages', 'stage-home', 'topics', 'tips', 'tools', 'educators', 'activities'];

function validateFixture(t, edit) {
  const root = mkdtempSync(join(tmpdir(), 'edustack-content-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const path of ['scripts/validate-data.mjs', 'src/lib/publication.mjs', 'src/lib/taxonomy.mjs', 'src/lib/educator-browse.mjs']) {
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

test('all content collections can hold incomplete unpublished records without exposing them', (t) => {
  const counts = Object.fromEntries(['resources', 'stages', 'topics', 'educators'].map((name) => [name,
    publishedItems(yaml.load(readFileSync(join(project, `src/data/${name}.yaml`), 'utf8'))).length]));
  const result = validateFixture(t, (data) => {
    for (const name of collections) {
      for (const publicationStatus of ['draft', 'in-review', 'needs-review']) data[name].push({ id: `fixture-${publicationStatus}`, publicationStatus });
    }
  });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes(`${counts.resources} resources, ${counts.stages} stages, ${counts.topics} topics, ${counts.educators} educators`), result.stdout);
});

test('educator readings require bilingual context, an editorial date and a traceable work source', (t) => {
  const result = validateFixture(t, (data) => {
    const educator = data.educators[0];
    educator.question = { en: 'A family question' };
    educator.reviewed = '2026-02-30';
    educator.works = [{ title: { en: 'A work', zh: '著作' }, note: { en: 'A version', zh: '版本' }, src: 'unverified-work' }];
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /question: needs both en and zh/);
  assert.match(result.stderr, /reviewed: needs a valid YYYY-MM-DD date/);
  assert.match(result.stderr, /unknown source unverified-work/);
});

test('educator browsing metadata rejects invented years and unknown grouping keys', (t) => {
  const result = validateFixture(t, (data) => {
    Object.assign(data.educators[0], { birthYear: 0, origin: 'unknown', directions: ['unknown'] });
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /birthYear must be a historical integer year or null/);
  assert.match(result.stderr, /unknown origin unknown/);
  assert.match(result.stderr, /directions must contain distinct known keys/);
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

test('public tool reading links cannot expose unpublished resources', (t) => {
  const result = validateFixture(t, (data) => {
    data.resources.push({ id: 'hidden-tool-reading', publicationStatus: 'draft' });
    data.tools[0].relatedResources = ['hidden-tool-reading'];
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /relatedResources: unknown or unpublished resource hidden-tool-reading/);
});

test('stage selections reject unpublished references, wrong types and ages outside the stage', (t) => {
  const result = validateFixture(t, (data) => {
    data.resources.push({ id: 'private-stage-reading', publicationStatus: 'draft' });
    const home = data['stage-home'][0];
    home.startingPoints[0].resource = 'private-stage-reading';
    home.reflection.resource = 'pandey-2018-self-regulation';
    // Keep the fixture within the public three-tool limit before adding the bad age match.
    home.tools = [];
    home.tools.push({ tool: 'scratch', reason: { en: 'Fixture', zh: '测试' } });
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unknown or unpublished resource private-stage-reading/);
  assert.match(result.stderr, /reflection: resource must have an allowed type and overlap/);
  assert.match(result.stderr, /tools: tool must overlap this stage/);
});

test('stage update dates and bilingual reasons are checked and every stage needs a homepage', (t) => {
  const result = validateFixture(t, (data) => {
    data['stage-home'][0].updates = [{ resource: 'aap-safe-sleep', selectedOn: '2026-02-30', reason: { en: 'Fixture' } }];
    data['stage-home'][1].publicationStatus = 'draft';
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /updates.reason: needs both en and zh/);
  assert.match(result.stderr, /updates.selectedOn: needs a valid YYYY-MM-DD date/);
  assert.match(result.stderr, /stage toddlers: needs a published stage homepage/);
});

test('additional comparison sources must refer to published resources', (t) => {
  const result = validateFixture(t, (data) => {
    data.topics[0].sources[0].additionalResources = ['missing-comparison-source'];
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /additionalResources: unknown or unpublished resource missing-comparison-source/);
});

test('activity selections reject withdrawn entries and ambiguous source references', (t) => {
  const result = validateFixture(t, (data) => {
    data.activities.find((a) => a.id === 'story-new-ending').publicationStatus = 'needs-review';
    const id = data.resources[0].id;
    data.sources[id] = { by: 'Fixture', label: { en: 'Source', zh: '来源' }, url: 'https://example.org/' };
    data.activities.find((a) => a.id === 'one-small-event').citations = [{ src: id, note: { en: 'Fixture', zh: '测试' } }];
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unknown or unpublished activity story-new-ending/);
  assert.match(result.stderr, /ambiguous source/);
});

test('activity fields and comparison-free topic sections are validated', (t) => {
  const result = validateFixture(t, (data) => {
    const activity = data.activities[0];
    activity.setting = ['constructor']; activity.duration = 'unknown'; activity.created = '2026-02-30';
    activity.readings = ['missing-reading']; activity.tools = ['missing-tool'];
    const topic = data.topics.find((t) => t.id === 'planning-together');
    topic.sections[0].citations = [{ src: 'missing-source', note: { en: 'Incomplete' } }];
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /bad setting/); assert.match(result.stderr, /bad duration/);
  assert.match(result.stderr, /unknown or unpublished resource missing-reading/);
  assert.match(result.stderr, /unknown or unpublished tool missing-tool/);
  assert.match(result.stderr, /unknown source missing-source/);
});

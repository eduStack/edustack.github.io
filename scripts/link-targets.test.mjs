import assert from 'node:assert/strict';
import { test } from 'node:test';
import { collectLinkTargets } from './link-targets.mjs';
import { checkLinkTargets, loadLinkTargets } from './check-links.mjs';

const published = (id, values = {}) => ({ id, publicationStatus: 'published', ...values });

test('collect every public URL category, deduplicate requests and preserve all owners', () => {
  const targets = collectLinkTargets({
    resources: [published('reading', { url: 'https://example.org', sourceLinks: [{ url: 'https://example.org/source' }] }),
      { id: 'draft', publicationStatus: 'draft', url: 'https://hidden.example/resource' }],
    tools: [published('local', { kind: 'internal', route: '/tools/local/', backingUrl: 'https://example.org/backing' }),
      published('external', { url: 'https://example.org/', privacy: 'https://example.org/privacy', backingUrl: 'https://example.org/backing' }),
      { id: 'draft', publicationStatus: 'draft', url: 'https://hidden.example/tool' }],
    sources: { citation: { url: 'https://example.org/' } },
    educators: [published('thinker', { texts: [{ url: 'https://example.org/text' }] }),
      { id: 'draft', publicationStatus: 'in-review', texts: [{ url: 'https://hidden.example/text' }] }],
    topics: [published('topic', { sources: [{ resource: 'reading' }, { url: 'https://example.org/topic' }] }),
      { id: 'draft', publicationStatus: 'needs-review', sources: [{ url: 'https://hidden.example/topic' }] }],
  });
  assert.deepEqual(targets.invalid, []);
  assert.deepEqual(targets.internal, [{ route: '/tools/local/', owners: ['tool:local'] }]);
  assert.deepEqual(targets.external.map((item) => item.url).sort(), ['https://example.org/', 'https://example.org/source',
    'https://example.org/backing', 'https://example.org/privacy', 'https://example.org/text', 'https://example.org/topic'].sort());
  assert.deepEqual(targets.external.find((item) => item.url === 'https://example.org/').owners,
    ['resource:reading', 'tool:external', 'source:citation']);
  assert.deepEqual(targets.external.find((item) => item.url.endsWith('/backing')).owners,
    ['tool:local backingUrl', 'tool:external backingUrl']);
});

test('invalid and missing URLs are distinct from internal routes and never fetched', async () => {
  const targets = collectLinkTargets({
    resources: [published('missing'), published('malformed', { url: 'not a URL' })],
    tools: [published('unsafe', { url: 'javascript:alert(1)' }), published('local', { kind: 'internal', route: '/tools/local/' }),
      published('bad-route', { kind: 'internal', route: '//other.example/tools/' })],
  });
  const messages = [];
  const counts = await checkLinkTargets(targets, { request: () => assert.fail('Must not fetch invalid or local targets'), log: (message) => messages.push(message) });
  assert.equal(counts.invalid, 4);
  assert.equal(counts.internalDeferred, 1);
  assert.equal(counts.broken, 0);
  assert.ok(messages.some((message) => message.includes('LOCAL DEFERRED') && message.includes('npm run test:built')));
});

test('responses distinguish broken links, request failures and 403/429 human review', async () => {
  const targets = collectLinkTargets({ resources: [200, 404, 403, 429, 500, 'timeout'].map((status) => published(String(status), { url: `https://example.org/${status}` })) });
  let active = 0;
  let peak = 0;
  const calls = [];
  const messages = [];
  const counts = await checkLinkTargets(targets, {
    concurrency: 2, log: (message) => messages.push(message),
    request: async (url, options) => {
      calls.push(url);
      active++;
      peak = Math.max(peak, active);
      assert.ok(options.signal instanceof AbortSignal);
      await new Promise((resolve) => setImmediate(resolve));
      active--;
      if (url.endsWith('/timeout')) throw new DOMException('Timed out', 'TimeoutError');
      return new Response('', { status: Number(url.split('/').at(-1)) });
    },
  });
  assert.deepEqual(counts, { ok: 1, broken: 3, manual: 2, invalid: 0, internalDeferred: 0 });
  assert.equal(calls.length, 6);
  assert.equal(peak, 2);
  assert.ok(messages.some((message) => message.startsWith('CHECK BY HAND 403')));
  assert.ok(messages.some((message) => message.startsWith('BROKEN TimeoutError')));
});

test('real maintenance data includes local tools and topic-only external sources without invalid targets', () => {
  const targets = loadLinkTargets();
  assert.deepEqual(targets.invalid, []);
  assert.ok(targets.internal.some((target) => target.route === '/tools/task-breakdown/'));
  assert.ok(targets.external.some((target) => target.owners.some((owner) => owner.startsWith('topic:screen-time source:'))));
  assert.equal(new Set(targets.external.map((target) => target.url)).size, targets.external.length);
  assert.ok(targets.external.every((target) => /^https?:\/\//.test(target.url) && target.owners.length > 0));
});

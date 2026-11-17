import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

// Execute the actual browser helper after stripping TypeScript, as search tests do.
const source = readFileSync(new URL('../src/lib/client.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const profile = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const key = 'edustack.profiles.v1';
const child = (overrides = {}) => ({ id: 'child-1', name: 'Test nickname', y: 2020, m: 1, sex: '', ...overrides });
const store = (children = [child()], sel = children[0]?.id) => ({ v: 1, children, ...(sel ? { sel } : {}) });
const code = (value) => Buffer.from(JSON.stringify(value)).toString('base64');
function storage(t) {
  const values = new Map();
  const target = new EventTarget();
  const local = { getItem: (k) => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), removeItem: (k) => values.delete(k) };
  for (const [name, value] of [['localStorage', local], ['window', target]]) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() => previous ? Object.defineProperty(globalThis, name, previous) : delete globalThis[name]);
  }
  return { values, local, target };
}

test('normalisation preserves v1 profiles and repairs a stale selected pointer', () => {
  const expected = store([child(), child({ id: 'second', name: '', sex: 'female' })]);
  assert.deepEqual(profile.normalizeStore({ ...expected, privateExtra: 'discarded' }), expected);
  assert.equal(profile.normalizeStore({ ...expected, sel: 'missing' }).sel, 'child-1');
  assert.equal(profile.selected({ ...expected, sel: 'second' }).id, 'second');
  assert.deepEqual(profile.normalizeStore(store([])), store([]));
});

test('load and import share validation and never overwrite data while rejecting malformed records', (t) => {
  const { values } = storage(t);
  const invalid = [null, {}, { v: 2, children: [] }, { v: 1, children: [null] },
    store([child({ y: 2099 })]), store([child({ y: Infinity })]), store([child({ y: '2020' })]),
    store([child({ m: 1.5 })]), store([child({ m: 0 })]), store([child({ m: 13 })]),
    store([child({ name: {} })]), store([child({ sex: 'unknown' })]),
    store([child(), child()]), store([child({ id: '' })]), store([child({ id: 'x'.repeat(65) })]),
    store(Array.from({ length: 7 }, (_, i) => child({ id: `child-${i}` })))];
  for (const value of invalid) {
    const raw = JSON.stringify(value);
    values.set(key, raw);
    assert.equal(profile.readProfiles().status, 'invalid');
    assert.deepEqual(profile.load(), store([]));
    assert.equal(profile.decodeCode(code(value)), null);
    assert.equal(values.get(key), raw);
  }
  values.set(key, '{broken');
  assert.equal(profile.readProfiles().status, 'invalid');
});

test('unsafe imported identifiers are rejected and names remain plain data', (t) => {
  storage(t);
  const malicious = '"><img src="data:," onerror="document.body.dataset.reviewMarker=1"><span data-x="';
  assert.equal(profile.decodeCode(code(store([child({ id: malicious })]))), null);
  const withName = store([child({ name: '<b>昵称</b> 🌱' })]);
  assert.deepEqual(profile.decodeCode(profile.encodeCode(withName)), withName);
  assert.equal(profile.decodeCode('not base64'), null);
  assert.equal(profile.decodeCode('A'.repeat(32769)), null);
});

test('real age calculation crosses every stage boundary and rejects future and fractional dates', () => {
  const now = new Date(2026, 10, 16);
  for (const months of [0, 11, 12, 35, 36, 71, 72, 143, 144, 215, 216]) {
    const date = new Date(2026, 10 - months, 1);
    const c = child({ y: date.getFullYear(), m: date.getMonth() + 1 });
    assert.equal(profile.ageMonths(c, now), months);
  }
  assert.ok(Number.isNaN(profile.ageMonths(child({ y: 2099 }), now)));
  assert.ok(Number.isNaN(profile.ageMonths(child({ m: 1.2 }), now)));
});

test('only successful writes and deletions emit profilechange events', (t) => {
  const { values, local, target } = storage(t);
  let changes = 0;
  target.addEventListener('edustack:profilechange', () => changes++);
  const original = store();
  assert.equal(profile.save(original), true);
  assert.equal(changes, 1);
  assert.deepEqual(profile.load(), original);
  local.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); };
  assert.equal(profile.save(store([child({ name: 'Unsaved' })])), false);
  assert.equal(changes, 1);
  assert.deepEqual(profile.load(), original);
  local.removeItem = () => { throw new DOMException('Denied', 'SecurityError'); };
  assert.equal(profile.clearAll(), false);
  assert.equal(changes, 1);
  assert.ok(values.has(key));
  local.removeItem = (k) => values.delete(k);
  assert.equal(profile.clearAll(), true);
  assert.equal(changes, 2);
  assert.deepEqual(profile.load(), store([]));
});

test('storage read denial returns a public fallback and distinguishes it from invalid data', (t) => {
  const { local } = storage(t);
  local.getItem = () => { throw new DOMException('Denied', 'SecurityError'); };
  assert.equal(profile.readProfiles().status, 'unavailable');
  assert.deepEqual(profile.load(), store([]));
});

test('homepage mode is separate from child selection and resets after deleting the last profile', (t) => {
  const { values } = storage(t);
  assert.equal(profile.readHomeMode(), 'child');
  assert.equal(profile.save(store()), true);
  assert.equal(profile.saveHomeMode('general'), true);
  assert.equal(profile.readHomeMode(), 'general');
  assert.equal(profile.selected(profile.load()).id, 'child-1');
  assert.equal(values.get('edustack.home-view.v1'), 'general');
  assert.equal(profile.save(store([])), true);
  assert.equal(profile.readHomeMode(), 'child');
  profile.saveHomeMode('general');
  assert.equal(profile.clearAll(), true);
  assert.equal(profile.readHomeMode(), 'child');
});

test('homepage preferences fail safely without overwriting an existing mode', (t) => {
  const { local, values } = storage(t);
  values.set('edustack.home-view.v1', 'unknown');
  assert.equal(profile.readHomeMode(), 'child');
  assert.equal(profile.saveHomeMode('invalid'), false);
  profile.saveHomeMode('general');
  local.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); };
  assert.equal(profile.saveHomeMode('child'), false);
  assert.equal(profile.readHomeMode(), 'general');
  local.getItem = () => { throw new DOMException('Denied', 'SecurityError'); };
  assert.equal(profile.readHomeMode(), 'child');
});

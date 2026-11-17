import assert from 'node:assert/strict';
import { test } from 'node:test';
import { searchEntries } from '../src/lib/search/engine.mjs';
import { createProfileSearch, effectiveProfileSearch, updateProfileSearch, resetProfileSearch, restoreProfileSearch, changeProfileSearchChild, serializeProfileSearch } from '../src/lib/search/profile.mjs';

const params = (query = '') => new URLSearchParams(query);
const entry = (key, minMonths, maxMonths) => ({
  key, type: 'guide', minMonths, maxMonths, title: { en: 'Sleep', zh: '睡眠' },
  summary: { en: '', zh: '' }, keywords: [], by: '', topics: ['sleep'],
  languages: ['en'], free: true, core: false, year: 2020,
});
const entries = [entry('younger', 0, 35), entry('matching', 36, 71), entry('older', 72, 215)];

test('non-age controls and submit keep profile filtering without publishing the displayed age', () => {
  const changes = ['q=sleep', 'type=guide', 'topic=sleep', 'language=en', 'free=1', 'sort=newest', ''];
  for (const change of changes) {
    const initial = createProfileSearch(params(), 36);
    const form = params(change);
    form.set('age', '36');
    const model = updateProfileSearch(initial, form);
    const effective = effectiveProfileSearch(model);
    assert.equal(effective.state.age, '36', change || 'submit');
    assert.equal(effective.profileAge, true);
    assert.deepEqual(searchEntries(entries, effective.state).map(({ key }) => key), ['matching']);
    assert.equal(serializeProfileSearch(model).toString(), change);
    const languageLink = new URL('https://example.test/zh/library/');
    languageLink.search = serializeProfileSearch(model).toString();
    assert.equal(languageLink.searchParams.has('age'), false);
  }
});

test('valid URL age is authoritative across other control changes and child switches', () => {
  for (const age of ['0', '72', 'teens']) {
    let model = createProfileSearch(params(`age=${age}`), 36);
    model = updateProfileSearch(model, params(`age=${age}&q=sleep`));
    model = changeProfileSearchChild(model, 12);
    assert.equal(effectiveProfileSearch(model).state.age, age);
    assert.equal(effectiveProfileSearch(model).profileAge, false);
    assert.equal(serializeProfileSearch(model).get('age'), age);
  }
});

test('only a direct age choice promotes age to the public state', () => {
  let model = createProfileSearch(params(), 36);
  model = updateProfileSearch(model, params('q=sleep&age=72'), true);
  assert.equal(effectiveProfileSearch(model).state.age, '72');
  assert.equal(effectiveProfileSearch(model).profileAge, false);
  assert.equal(serializeProfileSearch(model).toString(), 'q=sleep&age=72');
  model = changeProfileSearchChild(model, 12);
  assert.equal(effectiveProfileSearch(model).state.age, '72');
});

test('choosing any age keeps automatic age off for later changes on this page', () => {
  let model = createProfileSearch(params(), 36);
  model = updateProfileSearch(model, params(), true);
  model = changeProfileSearchChild(model, 72);
  model = updateProfileSearch(model, params('q=sleep'));
  model = restoreProfileSearch(model, params('topic=sleep'));
  assert.equal(effectiveProfileSearch(model).state.age, '');
  assert.equal(effectiveProfileSearch(model).profileAge, false);
  assert.equal(serializeProfileSearch(model).toString(), 'topic=sleep&age=any');
});

test('reset and clear-filters keep general browsing after child and URL updates', () => {
  for (const query of ['', 'sleep']) {
    let model = createProfileSearch(params('type=guide&free=1'), 36);
    model = resetProfileSearch(model, query);
    model = changeProfileSearchChild(model, 72);
    model = restoreProfileSearch(model, serializeProfileSearch(model));
    const effective = effectiveProfileSearch(model);
    assert.equal(effective.state.age, '');
    assert.equal(effective.profileAge, false);
    assert.equal(effective.state.q, query);
    assert.deepEqual(searchEntries(entries, effective.state).map(({ key }) => key), ['younger', 'matching', 'older']);
    assert.equal(serializeProfileSearch(model).toString(), query ? 'q=sleep&age=any' : 'age=any');
  }
});

test('automatic age follows the child while enabled, with inclusive range boundaries', () => {
  let model = createProfileSearch(params(), null);
  for (const age of [0, 35, 36, 215]) {
    model = changeProfileSearchChild(model, age);
    const effective = effectiveProfileSearch(model);
    assert.equal(effective.state.age, String(age));
    assert.equal(effective.profileAge, true);
    assert.equal(effective.outOfRange, false);
    assert.equal(serializeProfileSearch(model).has('age'), false);
  }
});

test('216+ profiles report out of range and browse without claiming an applied age', () => {
  for (const age of [216, 240, 1000]) {
    const model = createProfileSearch(params(), age);
    const effective = effectiveProfileSearch(model);
    assert.equal(effective.state.age, '');
    assert.equal(effective.profileAge, false);
    assert.equal(effective.outOfRange, true);
    assert.deepEqual(searchEntries(entries, effective.state).map(({ key }) => key), ['younger', 'matching', 'older']);
    assert.equal(serializeProfileSearch(model).toString(), '');
    const explicit = updateProfileSearch(model, params('age=teens'), true);
    assert.equal(effectiveProfileSearch(explicit).state.age, 'teens');
    assert.equal(effectiveProfileSearch(explicit).outOfRange, false);
  }
});

test('missing or invalid local ages never become active filters', () => {
  for (const age of [null, undefined, -1, 35.5, NaN, Infinity, '36']) {
    const effective = effectiveProfileSearch(createProfileSearch(params(), age));
    assert.equal(effective.state.age, '');
    assert.equal(effective.profileAge, false);
    assert.equal(effective.outOfRange, false);
  }
});


test('explicit any survives a new page and language-switch URL without exposing profile age', () => {
  const reset = resetProfileSearch(createProfileSearch(params('type=activity'), 48));
  const query = serializeProfileSearch(reset);
  assert.equal(query.get('age'), 'any');
  const reloaded = createProfileSearch(query, 96);
  assert.equal(effectiveProfileSearch(reloaded).profileAge, false);
  assert.equal(effectiveProfileSearch(reloaded).state.age, '');
});

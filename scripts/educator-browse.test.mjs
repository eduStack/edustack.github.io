import assert from 'node:assert/strict';
import { test } from 'node:test';
import { browseEducators, educatorBrowseState } from '../src/lib/educator-browse.mjs';

const person = (id, birthYear, directions = ['classical'], origin = 'europe') => ({ id, birthYear, directions, origin, name: { en: id, zh: id } });
const ids = (entries) => entries.map(e => e.id);
const state = (query = '') => educatorBrowseState(new URLSearchParams(query));

test('birth order handles BCE, equal years and unknown dates without mutating input', () => {
  const entries = [person('unknown', null), person('later', 1900), person('socrates', -469), person('confucius', -551), person('b', 1900)];
  const original = ids(entries);
  assert.deepEqual(ids(browseEducators(entries, state())), ['confucius', 'socrates', 'b', 'later', 'unknown']);
  assert.deepEqual(ids(browseEducators(entries, state('sort=newest'))), ['b', 'later', 'socrates', 'confucius', 'unknown']);
  assert.deepEqual(ids(entries), original);
});

test('overlapping direction and region filters intersect, including secondary directions and empty states', () => {
  const entries = [person('a', 1700, ['experience', 'care']), person('b', 1800, ['care'], 'north-america')];
  assert.deepEqual(ids(browseEducators(entries, state('direction=care&region=europe'))), ['a']);
  assert.deepEqual(browseEducators(entries, state('direction=classical')), []);
  assert.equal(browseEducators(entries, state()).length, 2);
});

test('direction and region sorts group consistently, with birth order within a group', () => {
  const entries = [person('b', 1800, ['care'], 'north-america'), person('a', 1700, ['care']), person('c', -400)];
  for (const lang of ['en', 'zh']) {
    const direction = ids(browseEducators(entries, state('sort=direction'), lang));
    assert.equal(direction.indexOf('b'), direction.indexOf('a') + 1);
    const region = ids(browseEducators(entries, state('sort=region'), lang));
    assert.equal(region.indexOf('a'), region.indexOf('c') + 1);
  }
  assert.deepEqual(ids(browseEducators(entries, state('sort=name'))), ['a', 'b', 'c']);
});

test('invalid URL options and prototype keys fall back to public browsing defaults', () => {
  for (const query of ['sort=__proto__&direction=__proto__&region=constructor', 'sort=random&direction=unknown&region=unknown']) {
    assert.deepEqual(state(query), { sort: 'oldest', direction: '', region: '' });
  }
});

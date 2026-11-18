import assert from 'node:assert/strict';
import { test } from 'node:test';
import { activityAgeLabel, effectiveActivityFilters, filterActivities, parseActivityFilters, serializeActivityFilters } from '../src/lib/activity-filter.mjs';
const items = [
  { id: 'a', minMonths: 48, maxMonths: 71, duration: 'short', setting: ['home', 'travel'] },
  { id: 'b', minMonths: 72, maxMonths: 143, duration: 'medium', setting: ['outdoors'] },
];
const state = (query = '') => parseActivityFilters(new URLSearchParams(query));
test('activity labels describe the inclusive last birthday without adding a year', () => {
  assert.equal(activityAgeLabel(48, 71, 'en'), 'Ages 4–5');
  assert.equal(activityAgeLabel(72, 143, 'zh'), '6–11 岁');
  assert.equal(activityAgeLabel(48, 59, 'en'), 'Ages 4');
  assert.equal(activityAgeLabel(48, 72, 'en'), '4 years–6 years');
});
test('activities respect exact inclusive month boundaries and intersect all conditions', () => {
  for (const [month, ids] of [[47, []], [48, ['a']], [71, ['a']], [72, ['b']], [143, ['b']], [144, []]])
    assert.deepEqual(filterActivities(items, state(`age=${month}`)).map((x) => x.id), ids);
  assert.deepEqual(filterActivities(items, state('age=preschoolers&setting=travel&duration=short')).map((x) => x.id), ['a']);
  assert.deepEqual(filterActivities(items, state('age=preschoolers&setting=outdoors')), []);
});
test('profile age is temporary while explicit age or any persists across reload', () => {
  const input = state('setting=home');
  assert.equal(effectiveActivityFilters(input, 60).state.age, '60');
  assert.equal(serializeActivityFilters(input).has('age'), false);
  for (const age of ['any', 'school-age', '90']) {
    const restored = parseActivityFilters(serializeActivityFilters(state(`age=${age}`)));
    assert.equal(effectiveActivityFilters(restored, 60).state.age, age);
    assert.equal(effectiveActivityFilters(restored, 60).profileAge, false);
  }
});
test('invalid/prototype conditions are excluded and unknown profile data stays general', () => {
  assert.deepEqual(state('age=999&duration=constructor&setting=__proto__'), { age: '', duration: '', setting: '' });
  for (const age of [null, NaN, -1]) assert.equal(effectiveActivityFilters(state(), age).profileAge, false);
  assert.equal(effectiveActivityFilters(state(), 216).outOfRange, true);
  assert.equal(filterActivities(items, effectiveActivityFilters(state(), 216).state).length, 2);
});

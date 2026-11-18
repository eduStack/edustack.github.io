import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import yaml from 'js-yaml';
import { dailyGuidance, guidanceForAge, guidanceForRange, guidanceLabels } from '../src/lib/daily-guidance.mjs';
import { inclusiveAgeLabel } from '../src/lib/age-label.mjs';
import { relatedReadings } from '../src/lib/related-resources.mjs';
import { publishedItems } from '../src/lib/publication.mjs';

const load = (name) => publishedItems(yaml.load(readFileSync(new URL(`../src/data/${name}.yaml`, import.meta.url), 'utf8')));

test('every covered month has one sourced rule per kind, with correct infant, five/six and twelve/thirteen sleep boundaries', () => {
  for (let age = 0; age <= 215; age++) {
    for (const kind of Object.keys(guidanceLabels)) {
      assert.equal(guidanceForRange(kind, age, age).length, 1, `${kind}, ${age}`);
      assert.ok(guidanceForAge(age)[kind].sources.length);
    }
  }
  for (const [age, min, max] of [[0, 14, 17], [3, 14, 17], [4, 12, 16], [11, 12, 16], [12, 11, 14], [60, 10, 13], [71, 10, 13], [72, 9, 12], [144, 9, 12], [155, 9, 12], [156, 8, 10]]) {
    const rule = guidanceForAge(age).sleep;
    assert.deepEqual([rule.minimum, rule.maximum], [min, max], String(age));
  }
  for (const invalid of [-1, 216, 0.5, NaN, null]) assert.equal(guidanceForAge(invalid), null);
  assert.deepEqual(guidanceForAge(59).activity.sources, ['who-under5-activity-sleep-2019']);
  assert.deepEqual(guidanceForAge(60).activity.sources, ['who-activity-2020']);
});

test('stage facts use shared rules and explicitly expose differing guidance within a stage', () => {
  const stages = load('stages');
  const resources = new Map(load('resources').map((resource) => [resource.id, resource]));
  const preschool = stages.find((stage) => stage.id === 'preschoolers');
  assert.deepEqual(preschool.facts.find((fact) => fact.kind === 'activity').rules, ['activity-3-4y', 'activity-5-17y']);
  assert.deepEqual(stages.find((stage) => stage.id === 'teens').facts.find((fact) => fact.kind === 'sleep').rules, ['sleep-6-12y', 'sleep-13-17y']);
  for (const rule of dailyGuidance) for (const id of rule.sources) {
    const resource = resources.get(id);
    assert.ok(resource, id);
    assert.ok(resource.minMonths <= rule.minMonths && resource.maxMonths >= rule.maxMonths, rule.id);
  }
});

test('age labels include the last birthday without adding a year or losing a partial month endpoint', () => {
  assert.equal(inclusiveAgeLabel(36, 71, 'zh'), '3–5 岁');
  assert.equal(inclusiveAgeLabel(12, 107, 'en'), 'Ages 1–8');
  assert.equal(inclusiveAgeLabel(2, 71, 'zh'), '2 个月–5 岁');
  assert.equal(inclusiveAgeLabel(0, 215, 'zh'), '0–17 岁');
  assert.equal(inclusiveAgeLabel(36, 73, 'en'), '3 years–6 years 1 month');
});

test('real related readings remain published, topical and age-overlapping, and survive data reordering', () => {
  const resources = load('resources');
  for (const resource of resources) {
    const result = relatedReadings(resource, resources);
    assert.deepEqual(result.map((item) => item.id), relatedReadings(resource, [...resources].reverse()).map((item) => item.id));
    for (const item of result) {
      assert.notEqual(item.id, resource.id);
      assert.ok(item.minMonths <= resource.maxMonths && item.maxMonths >= resource.minMonths);
      assert.ok(item.topics.some((topic) => resource.topics.includes(topic)));
    }
  }
  const early = resources.find((resource) => resource.id === 'harvard-serve-and-return');
  assert.ok(!relatedReadings(early, resources).some((resource) => resource.id === 'faber-mazlish-teens'));
  const draft = { ...early, id: 'unpublished', publicationStatus: 'draft' };
  assert.ok(!relatedReadings(early, [draft]).length);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';

const templates = yaml.load(readFileSync(new URL('../src/data/task-breakdown.yaml', import.meta.url), 'utf8'));

test('task breakdown has the three bilingual starter templates', () => {
  assert.deepEqual(templates.map((template) => template.id), ['pack-bag', 'get-ready', 'small-project']);
  for (const template of templates) {
    assert.equal(typeof template.title.en, 'string');
    assert.equal(typeof template.title.zh, 'string');
    assert.equal(typeof template.summary.en, 'string');
    assert.equal(typeof template.summary.zh, 'string');
    assert.ok(template.steps.en.length >= 3 && template.steps.en.length <= 5);
    assert.equal(template.steps.en.length, template.steps.zh.length);
    assert.ok(template.steps.en.every((step) => step.length <= 160));
  }
});

test('starter steps do not assign essential safety decisions to children', () => {
  const text = templates.flatMap((template) => [...template.steps.en, ...template.steps.zh]).join(' ');
  assert.match(text, /adult|成人/);
  assert.doesNotMatch(text, /take medicine|cross the road|过马路|药品/);
});

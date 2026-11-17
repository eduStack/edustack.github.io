// Checks the data files follow the rules in src/data/resources.yaml. Run: npm run check:data
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { publicationStatuses, publishedItems } from '../src/lib/publication.mjs';
import { developmentAreas, primaryStages, resourceTopics } from '../src/lib/taxonomy.mjs';
import { educatorDirections, educatorRegions } from '../src/lib/educator-browse.mjs';
const load = (f) => yaml.load(readFileSync(new URL(`../src/data/${f}`, import.meta.url), 'utf8'));
const errors = [];
const collections = {};
for (const name of ['resources', 'stages', 'stage-home', 'topics', 'tips', 'tools', 'educators', 'activities']) {
  const items = load(`${name}.yaml`);
  const seen = new Set();
  for (const item of items) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id ?? '')) errors.push(`${name}: invalid id`);
    if (seen.has(item.id)) errors.push(`${name}: duplicate id ${item.id}`);
    seen.add(item.id);
    if (!publicationStatuses.includes(item.publicationStatus)) errors.push(`${name} ${item.id}: needs a valid publicationStatus`);
  }
  collections[name] = publishedItems(items);
}
const { resources, stages, topics, tips, tools, educators, activities } = collections;
const sources = load('sources.yaml');
const ids = new Set();
const L = (o, path) => { if (!o || typeof o.en !== 'string' || typeof o.zh !== 'string' || !o.en || !o.zh) errors.push(`${path}: needs both en and zh text`); };
const validDate = (v, path) => {
  const date = v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) errors.push(`${path}: needs a valid YYYY-MM-DD date`);
};
const ageRange = (item, path) => {
  if (!Number.isInteger(item.minMonths) || !Number.isInteger(item.maxMonths) || item.minMonths < 0 || item.maxMonths > 215 || item.minMonths > item.maxMonths) errors.push(`${path}: bad age range`);
};
for (const r of resources) {
  const p = `resource ${r.id}`;
  if (ids.has(r.id)) errors.push(`${p}: duplicate id`); ids.add(r.id);
  if (!/^https:\/\//.test(r.url || '')) errors.push(`${p}: url must be https`);
  if (!['book', 'classic', 'guide', 'guideline', 'research'].includes(r.type)) errors.push(`${p}: bad type`);
  if (!['guideline', 'large', 'small', 'expert'].includes(r.evidence)) errors.push(`${p}: bad evidence`);
  if (!['all', 'male', 'female'].includes(r.sex)) errors.push(`${p}: bad sex`);
  ageRange(r, p);
  validDate(r.checked, `${p}.checked`);
  if (r.year == null && !r.yearNote) errors.push(`${p}: needs year or yearNote`);
  L(r.title, `${p}.title`); L(r.summary, `${p}.summary`);
  if (!Array.isArray(r.topics) || !r.topics.length || r.topics.some((key) => !Object.hasOwn(resourceTopics, key))) errors.push(`${p}: needs recognised resource topics`);
  if (r.originalTitle !== undefined && (typeof r.originalTitle !== 'string' || !r.originalTitle.trim())) errors.push(`${p}: originalTitle must be non-empty text`);
  for (const key of ['purpose', 'audience', 'limits', 'access', 'checkedNote', 'whyAge', 'evidenceNote', 'yearNote', 'region', 'sourceVersion']) if (r[key] !== undefined) L(r[key], `${p}.${key}`);
  if (r.languageCodes !== undefined && (!Array.isArray(r.languageCodes) || !r.languageCodes.length || r.languageCodes.some((code) => !['en', 'zh', 'es', 'multi'].includes(code)))) errors.push(`${p}: invalid languageCodes`);
  for (const key of ['keyPoints', 'actions']) if (r[key]) {
    for (const lang of ['en', 'zh']) if (!Array.isArray(r[key][lang]) || !r[key][lang].length || r[key][lang].some((x) => typeof x !== 'string' || !x.trim())) errors.push(`${p}.${key}.${lang}: needs a non-empty text list`);
  }
  for (const source of r.sourceLinks ?? []) {
    L(source.label, `${p}.sourceLinks.label`);
    if (!/^https:\/\//.test(source.url || '')) errors.push(`${p}: source link must be https`);
  }
  if (r.type === 'guide' || r.type === 'classic') for (const key of ['purpose', 'audience', 'limits', 'access', 'checkedNote']) if (!r[key]) errors.push(`${p}: ${r.type} needs ${key}`);
  if (r.type === 'research' && !['meta-analysis', 'review', 'trial', 'cohort', 'experiment', 'observational', 'cross-sectional', 'large-dataset'].includes(r.design)) errors.push(`${p}: research needs a design`);
  if (r.type !== 'research' && r.design) errors.push(`${p}: only research has a design`);
  if (r.type === 'book' && (!r.isbn || !r.publisher)) errors.push(`${p}: books need isbn and publisher`);
}
const types = new Map(resources.map((r) => [r.id, r.type]));
const study = (id, where) => { if (types.get(id) !== 'research') errors.push(`${where}: ${id} is not a published research item`); };
const notStudy = (id, where) => { if (types.get(id) === 'research') errors.push(`${where}: ${id} is research; list it under research, not picks`); };
for (const r of resources) (r.backedBy || []).forEach((id) => study(id, `resource ${r.id} backedBy`));
const need = (id, where) => { if (!ids.has(id)) errors.push(`${where}: unknown or unpublished resource ${id}`); };
const srcOk = (src, where) => { if (ids.has(src) && Object.hasOwn(sources, src)) errors.push(`${where}: ambiguous source ${src}`); if (!ids.has(src) && !sources[src]) errors.push(`${where}: unknown source ${src}`); };
const claim = (c, where) => { L(c, where); srcOk(c.src, where); };
for (const [k, v] of Object.entries(sources)) { L(v.label, `source ${k}.label`); if (!/^https:\/\//.test(v.url)) errors.push(`source ${k}: url must be https`); }
const eduIds = new Set(educators.map((e) => e.id));
for (const s of stages) {
  const p = `stage ${s.id}`;
  ageRange(s, p);
  validDate(s.updated, `${p}.updated`);
  for (const key of ['name', 'range', 'focus', 'intro']) L(s[key], `${p}.${key}`);
  srcOk(s.introSrc, `${p}.intro`);
  s.develop.areas.forEach((a) => {
    if (!developmentAreas.includes(a.area)) errors.push(`${p}: unknown development area ${a.area}`);
    a.points.forEach((c, i) => claim(c, `${p}.develop.${a.area}[${i}]`));
  });
  claim(s.develop.concern, `${p}.concern`);
  s.activities.forEach((c, i) => claim(c, `${p}.activities[${i}]`));
  s.health.links.forEach((id) => { need(id, p); notStudy(id, p); });
  s.health.extra.forEach((k) => { if (!sources[k]) errors.push(`${p}: unknown source ${k}`); });
  (s.research || []).forEach((id) => study(id, p));
  (s.picks || []).forEach((id) => {
    need(id, p); notStudy(id, p);
    const r = resources.find((x) => x.id === id);
    if (r && (r.maxMonths < s.minMonths || r.minMonths > s.maxMonths)) errors.push(`${p}: pick ${id} does not overlap this stage`);
  });
  s.roots.forEach((r) => { if (!eduIds.has(r.educator)) errors.push(`${p}: unknown educator ${r.educator}`); L(r, `${p}.roots.${r.educator}`); });
  if (s.reading.length > 2) errors.push(`${p}: at most 2 further-reading books`);
  s.reading.forEach((id) => { need(id, p); if (types.get(id) !== 'book') errors.push(`${p}: reading ${id} is not a book`); });
}
// The five primary navigation ranges partition birth up to the 18th birthday.
if (stages.length !== primaryStages.length || stages.some((s, i) => s.id !== primaryStages[i]?.id || s.minMonths !== primaryStages[i]?.minMonths || s.maxMonths !== primaryStages[i]?.maxMonths)) errors.push('stages: keep the five ordered, non-overlapping primary age ranges');
for (const e of educators) {
  const p = `educator ${e.id}`;
  if (e.birthYear !== null && (!Number.isInteger(e.birthYear) || e.birthYear === 0 || e.birthYear > new Date().getUTCFullYear())) errors.push(`${p}: birthYear must be a historical integer year or null`);
  if (!Object.hasOwn(educatorRegions, e.origin)) errors.push(`${p}: unknown origin ${e.origin}`);
  if (!Array.isArray(e.directions) || !e.directions.length || new Set(e.directions).size !== e.directions.length || e.directions.some((key) => !Object.hasOwn(educatorDirections, key))) errors.push(`${p}: directions must contain distinct known keys`);
  L(e.name, `${p}.name`);
  for (const key of ['region', 'role', 'question', 'basis']) L(e[key], `${p}.${key}`);
  validDate(e.reviewed, `${p}.reviewed`);
  if (!Array.isArray(e.works)) errors.push(`${p}: works must be a list`);
  else e.works.forEach((work, i) => {
    L(work.title, `${p}.works[${i}].title`);
    L(work.note, `${p}.works[${i}].note`);
    srcOk(work.src, `${p}.works[${i}]`);
  });
  [['bio', [e.bio]], ['ideas', e.ideas], ['today', [e.today]], ['supported', e.supported], ['outdated', e.outdated]].forEach(([k, list]) => list.forEach((c, i) => claim(c, `${p}.${k}[${i}]`)));
  e.texts.forEach((x) => { L(x.label, `${p}.texts`); if (!/^https:\/\//.test(x.url)) errors.push(`${p}: text url must be https`); });
}
const distinct = (value, where) => {
  if (!Array.isArray(value)) { errors.push(`${where}: needs a list`); return []; }
  if (new Set(value).size !== value.length) errors.push(`${where}: duplicate reference`);
  return value;
};
const knownTags = (value, where) => distinct(value, where).forEach((key) => {
  if (!Object.hasOwn(resourceTopics, key)) errors.push(`${where}: unknown topic tag ${key}`);
});
const toolIds = new Set(tools.map((item) => item.id));
const activitySelections = (entries, where, stage) => {
  const seen = new Set();
  for (const entry of entries ?? []) {
    const item = activities.find((item) => item.id === entry.activity);
    if (!item) errors.push(`${where}: unknown or unpublished activity ${entry.activity}`);
    if (seen.has(entry.activity)) errors.push(`${where}: duplicate activity`);
    seen.add(entry.activity); L(entry.reason, `${where}.reason`);
    if (item && stage && (item.minMonths > stage.maxMonths || item.maxMonths < stage.minMonths)) errors.push(`${where}: activity must overlap stage`);
  }
};
for (const a of activities) {
  const p = `activity ${a.id}`;
  ageRange(a, p); knownTags(a.topics, `${p}.topics`);
  for (const key of ['title', 'summary', 'time', 'materials', 'participants', 'adaptations', 'cautions', 'basis']) L(a[key], `${p}.${key}`);
  for (const key of ['created', 'updated', 'checked']) validDate(a[key], `${p}.${key}`);
  const dateText = (v) => v instanceof Date ? v.toISOString().slice(0,10) : String(v);
  if (dateText(a.created) > dateText(a.updated) || dateText(a.updated) > dateText(a.checked)) errors.push(`${p}: dates must follow created <= updated <= checked`);
  if (a.authorship !== 'original') errors.push(`${p}: authorship requires a reviewed supported kind`);
  if (!['short', 'medium', 'flexible'].includes(a.duration)) errors.push(`${p}: bad duration`);
  const settings = distinct(a.setting, `${p}.setting`);
  if (!settings.length || settings.some((x) => !['home', 'travel', 'outdoors'].includes(x))) errors.push(`${p}: bad setting`);
  for (const lang of ['en', 'zh']) if (!Array.isArray(a.steps?.[lang]) || !a.steps[lang].length || a.steps[lang].some((x) => typeof x !== 'string' || !x.trim())) errors.push(`${p}: needs ${lang} steps`);
  if (a.steps?.en?.length !== a.steps?.zh?.length) errors.push(`${p}: bilingual steps must correspond`);
  distinct(a.readings, `${p}.readings`).forEach((id) => need(id, p));
  distinct(a.tools, `${p}.tools`).forEach((id) => { if (!toolIds.has(id)) errors.push(`${p}: unknown or unpublished tool ${id}`); });
  if (!Array.isArray(a.citations) || !a.citations.length) errors.push(`${p}: needs citations`);
  else { distinct(a.citations.map((c) => c.src), `${p}.citations`); a.citations.forEach((c) => { srcOk(c.src, p); L(c.note, `${p}.citation.note`); }); }
}
for (const t of topics) {
  if (!['ready', 'preparing'].includes(t.status)) errors.push(`topic ${t.id}: bad readiness status`);
  validDate(t.updated, `topic ${t.id}.updated`);
  L(t.name, `topic ${t.id}.name`); L(t.teaser, `topic ${t.id}.teaser`);
  if (t.tags !== undefined) knownTags(t.tags, `topic ${t.id}.tags`);
  activitySelections(t.activities, `topic ${t.id}.activities`);
  for (const entry of t.tools ?? []) { if (!toolIds.has(entry.tool)) errors.push(`topic ${t.id}: unknown or unpublished tool ${entry.tool}`); L(entry.reason, `topic ${t.id}.tool.reason`); }
  distinct((t.tools ?? []).map((x) => x.tool), `topic ${t.id}.tools`);
  distinct((t.sections ?? []).map((x) => x.id), `topic ${t.id}.sections`);
  for (const section of t.sections ?? []) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(section.id)) errors.push(`topic ${t.id}: bad section id`);
    L(section.title, `topic ${t.id}.section.title`); L(section.text, `topic ${t.id}.section.text`);
    if (!section.citations?.length) errors.push(`topic ${t.id}: section needs citations`);
    for (const c of section.citations ?? []) { srcOk(c.src, `topic ${t.id}`); L(c.note, `topic ${t.id}.citation.note`); }
  }
  if (t.status === 'ready') {
    L(t.bottomLine, `topic ${t.id}.bottomLine`);
    if (!(t.rows?.length || t.sections?.length || t.picks?.length || t.activities?.length || t.tools?.length)) errors.push(`topic ${t.id}: ready topic needs substantive content`);
  }
  t.picks.forEach((id) => { need(id, `topic ${t.id}`); notStudy(id, `topic ${t.id}`); }); (t.research || []).forEach((id) => study(id, `topic ${t.id}`));
  (t.sources || []).forEach((source) => {
    L(source.name, `topic ${t.id}.sources.name`); L(source.note, `topic ${t.id}.sources.note`);
    if (source.resource) need(source.resource, `topic ${t.id}.sources`);
    else if (!/^https:\/\//.test(source.url || '')) errors.push(`topic ${t.id}: source needs a published resource or https URL`);
    if (source.additionalResources !== undefined && !Array.isArray(source.additionalResources)) errors.push(`topic ${t.id}: additionalResources must be a list`);
    else (source.additionalResources ?? []).forEach((id) => need(id, `topic ${t.id}.sources.additionalResources`));
  });
  (t.rows || []).forEach((row, i) => {
    const p = `topic ${t.id} row ${i}`;
    if (row.cells.length !== (t.sources ?? []).length) errors.push(`${p}: cell count`);
    L(row.age, `${p}.age`); row.cells.forEach((cell) => L(cell, `${p}.cell`));
    if (!['agree', 'differ', 'single'].includes(row.verdict)) errors.push(`${p}: invalid verdict`);
    if (row.verdictNote) L(row.verdictNote, `${p}.verdictNote`);
  });
}
for (const t of tips) { need(t.resource, `tip ${t.id}`); ageRange(t, `tip ${t.id}`); L(t.text, `tip ${t.id}.text`); L(t.why, `tip ${t.id}.why`); }
for (const t of tools) {
  const p = `tool ${t.id}`;
  const kind = t.kind ?? 'external';
  if (!['external', 'internal'].includes(kind)) errors.push(`${p}: unknown kind`);
  if (kind === 'external') for (const k of ['url', 'privacy', 'backingUrl']) if (!/^https:\/\//.test(t[k] || '')) errors.push(`${p}: ${k} must be https`);
  if (kind === 'internal') {
    if (!/^\/[a-z0-9-]+(?:\/[a-z0-9-]+)*\/?$/.test(t.route || '')) errors.push(`${p}: internal tool needs a route`);
    if (!/^edustack\.[a-z0-9.-]+\.v\d+$/.test(t.storageKey || '')) errors.push(`${p}: internal tool needs a versioned storageKey`);
    if (!['task-breakdown', 'practical-tool'].includes(t.templateSource)) errors.push(`${p}: internal tool needs a templateSource`);
  }
  for (const key of ['what', 'languages', 'backing']) L(t[key], `${p}.${key}`);
  for (const key of ['purpose', 'audience', 'limits', 'access', 'device', 'registration']) if (t[key] !== undefined) L(t[key], `${p}.${key}`);
  if (!Number.isInteger(t.minAge) || !Number.isInteger(t.maxAge) || t.minAge < 0 || t.maxAge < t.minAge || t.maxAge > 18) errors.push(`${p}: bad age range`);
  if (!['early', 'general', 'coding', 'science', 'reading'].includes(t.subject)) errors.push(`${p}: unknown subject`);
  if (t.topics !== undefined && (!Array.isArray(t.topics) || t.topics.some((key) => !Object.hasOwn(resourceTopics, key)))) errors.push(`${p}: needs recognised topics`);
  if (t.relatedResources !== undefined) {
    if (!Array.isArray(t.relatedResources)) errors.push(`${p}: relatedResources must be a list`);
    else t.relatedResources.forEach((id) => need(id, `${p}.relatedResources`));
  }
  if (t.languageCodes !== undefined && (!Array.isArray(t.languageCodes) || !t.languageCodes.length || t.languageCodes.some((code) => !['en', 'zh', 'es', 'multi'].includes(code)))) errors.push(`${p}: invalid languageCodes`);
  if (t.checked !== undefined) validDate(t.checked, `${p}.checked`);
}
const homeEntries = collections['stage-home'];
for (const stage of stages) if (!homeEntries.some((home) => home.id === stage.id)) errors.push(`stage ${stage.id}: needs a published stage homepage`);
for (const home of homeEntries) {
  const p = `stage-home ${home.id}`;
  const stage = stages.find((item) => item.id === home.id);
  if (!stage) { errors.push(`${p}: needs a published stage`); continue; }
  L(home.headline, `${p}.headline`); L(home.intro, `${p}.intro`);
  activitySelections(home.activities, `${p}.activities`, stage);
  const topicSelections = home.topics ?? [];
  distinct(topicSelections.map((x) => x.topic), `${p}.topics`);
  for (const entry of topicSelections) {
    if (!topics.some((item) => item.id === entry.topic && item.status === 'ready')) errors.push(`${p}: needs published ready topic ${entry.topic}`);
    L(entry.reason, `${p}.topics.reason`);
  }
  const selected = new Set();
  const selection = (entry, where, allowed) => {
    if (!entry || typeof entry.resource !== 'string') { errors.push(`${where}: needs a resource`); return; }
    need(entry.resource, where); L(entry.reason, `${where}.reason`);
    if (selected.has(entry.resource)) errors.push(`${where}: duplicate selection ${entry.resource}`);
    selected.add(entry.resource);
    const resource = resources.find((item) => item.id === entry.resource);
    if (resource && (!allowed.includes(resource.type) || resource.maxMonths < stage.minMonths || resource.minMonths > stage.maxMonths)) errors.push(`${where}: resource must have an allowed type and overlap this stage`);
  };
  const list = (value, where, max, min = 0) => {
    if (!Array.isArray(value) || value.length > max || value.length < min) { errors.push(`${where}: needs ${min}–${max} selections`); return []; }
    return value;
  };
  list(home.startingPoints, `${p}.startingPoints`, 3, 1).forEach((entry) => selection(entry, `${p}.startingPoints`, ['guide', 'guideline']));
  selection(home.reflection, `${p}.reflection`, ['book', 'classic']);
  list(home.context, `${p}.context`, 3).forEach((entry) => selection(entry, `${p}.context`, ['research', 'guideline']));
  list(home.updates ?? [], `${p}.updates`, 3).forEach((entry) => {
    selection(entry, `${p}.updates`, ['research', 'guideline', 'guide']);
    validDate(entry.selectedOn, `${p}.updates.selectedOn`);
  });
  const selectedTools = new Set();
  list(home.tools, `${p}.tools`, 3).forEach((entry) => {
    const tool = tools.find((item) => item.id === entry.tool);
    if (!tool) errors.push(`${p}.tools: unknown or unpublished tool ${entry.tool}`);
    else if (tool.minAge * 12 > stage.maxMonths || (tool.maxAge + 1) * 12 - 1 < stage.minMonths) errors.push(`${p}.tools: tool must overlap this stage`);
    if (selectedTools.has(entry.tool)) errors.push(`${p}.tools: duplicate tool ${entry.tool}`);
    selectedTools.add(entry.tool); L(entry.reason, `${p}.tools.reason`);
  });
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`OK: ${resources.length} resources, ${stages.length} stages, ${topics.length} topics, ${educators.length} educators, ${Object.keys(sources).length} sources, ${tips.length} tips, ${tools.length} tools, ${activities.length} activities`);

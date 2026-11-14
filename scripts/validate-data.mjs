// Checks the data files follow the rules in src/data/resources.yaml. Run: npm run check:data
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
const load = (f) => yaml.load(readFileSync(new URL(`../src/data/${f}`, import.meta.url), 'utf8'));
const resources = load('resources.yaml'), stages = load('stages.yaml'), topics = load('topics.yaml'), tips = load('tips.yaml'), tools = load('tools.yaml');
const educators = load('educators.yaml'), sources = load('sources.yaml');
const errors = [];
const ids = new Set();
const L = (o, path) => { if (!o || typeof o.en !== 'string' || typeof o.zh !== 'string' || !o.en || !o.zh) errors.push(`${path}: needs both en and zh text`); };
for (const r of resources) {
  const p = `resource ${r.id}`;
  if (ids.has(r.id)) errors.push(`${p}: duplicate id`); ids.add(r.id);
  if (!/^https:\/\//.test(r.url || '')) errors.push(`${p}: url must be https`);
  if (!['book', 'classic', 'guide', 'guideline', 'research'].includes(r.type)) errors.push(`${p}: bad type`);
  if (!['guideline', 'large', 'small', 'expert'].includes(r.evidence)) errors.push(`${p}: bad evidence`);
  if (!['all', 'male', 'female'].includes(r.sex)) errors.push(`${p}: bad sex`);
  if (!(r.minMonths >= 0 && r.maxMonths <= 215 && r.minMonths <= r.maxMonths)) errors.push(`${p}: bad age range`);
  if (!r.checked) errors.push(`${p}: missing checked date`);
  if (r.year == null && !r.yearNote) errors.push(`${p}: needs year or yearNote`);
  L(r.title, `${p}.title`); L(r.summary, `${p}.summary`);
  if (r.originalTitle !== undefined && (typeof r.originalTitle !== 'string' || !r.originalTitle.trim())) errors.push(`${p}: originalTitle must be non-empty text`);
  for (const key of ['purpose', 'audience', 'limits', 'access', 'checkedNote', 'whyAge', 'evidenceNote', 'yearNote']) if (r[key]) L(r[key], `${p}.${key}`);
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
const study = (id, where) => { if (types.get(id) !== 'research') errors.push(`${where}: ${id} is not a research item`); };
const notStudy = (id, where) => { if (types.get(id) === 'research') errors.push(`${where}: ${id} is research; list it under research, not picks`); };
for (const r of resources) (r.backedBy || []).forEach((id) => study(id, `resource ${r.id} backedBy`));
const need = (id, where) => { if (!ids.has(id)) errors.push(`${where}: unknown resource ${id}`); };
const srcOk = (src, where) => { if (!ids.has(src) && !sources[src]) errors.push(`${where}: unknown source ${src}`); };
const claim = (c, where) => { L(c, where); srcOk(c.src, where); };
for (const [k, v] of Object.entries(sources)) { L(v.label, `source ${k}.label`); if (!/^https:\/\//.test(v.url)) errors.push(`source ${k}: url must be https`); }
const eduIds = new Set(educators.map((e) => e.id));
for (const s of stages) {
  const p = `stage ${s.id}`;
  srcOk(s.introSrc, `${p}.intro`);
  s.develop.areas.forEach((a) => a.points.forEach((c, i) => claim(c, `${p}.develop.${a.area}[${i}]`)));
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
for (const e of educators) {
  const p = `educator ${e.id}`;
  L(e.name, `${p}.name`);
  [['bio', [e.bio]], ['ideas', e.ideas], ['today', [e.today]], ['supported', e.supported], ['outdated', e.outdated]].forEach(([k, list]) => list.forEach((c, i) => claim(c, `${p}.${k}[${i}]`)));
  e.texts.forEach((x) => { L(x.label, `${p}.texts`); if (!/^https:\/\//.test(x.url)) errors.push(`${p}: text url must be https`); });
}
for (const t of topics) { t.picks.forEach((id) => { need(id, `topic ${t.id}`); notStudy(id, `topic ${t.id}`); }); (t.research || []).forEach((id) => study(id, `topic ${t.id}`)); (t.sources || []).forEach((s) => s.resource && need(s.resource, `topic ${t.id}`)); (t.rows || []).forEach((r, i) => { if (r.cells.length !== t.sources.length) errors.push(`topic ${t.id} row ${i}: cell count`); }); }
for (const t of tips) need(t.resource, `tip ${t.id}`);
for (const t of tools) { for (const k of ['url', 'privacy', 'backingUrl']) if (!/^https:\/\//.test(t[k] || '')) errors.push(`tool ${t.id}: ${k} must be https`); L(t.backing, `tool ${t.id}.backing`); }
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`OK: ${resources.length} resources, ${stages.length} stages, ${topics.length} topics, ${educators.length} educators, ${Object.keys(sources).length} sources, ${tips.length} tips, ${tools.length} tools`);

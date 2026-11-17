import yaml from 'js-yaml';
import resourcesRaw from '../data/resources.yaml?raw';
import stagesRaw from '../data/stages.yaml?raw';
import topicsRaw from '../data/topics.yaml?raw';
import toolsRaw from '../data/tools.yaml?raw';
import tipsRaw from '../data/tips.yaml?raw';
import educatorsRaw from '../data/educators.yaml?raw';
import sourcesRaw from '../data/sources.yaml?raw';
import stageHomeRaw from '../data/stage-home.yaml?raw';
import activitiesRaw from '../data/activities.yaml?raw';
import type { Lang } from '../i18n/languages';
import { publishedItems, publicationStatuses } from './publication.mjs';

export type { Lang } from '../i18n/languages';
export type L10n = { en: string; zh: string };
export type L10nList = { en: string[]; zh: string[] };
export type PublicationStatus = typeof publicationStatuses[number];
export interface Publishable { publicationStatus: PublicationStatus }

export type Design = 'meta-analysis' | 'review' | 'trial' | 'cohort' | 'experiment' | 'observational' | 'cross-sectional' | 'large-dataset';
/** A short sentence we wrote, with the key of its source (sources.yaml key or resource id). */
export type Claim = { en: string; zh: string; src: string };
export interface Resource extends Publishable {
  id: string;
  type: 'book' | 'classic' | 'guide' | 'guideline' | 'research';
  evidence: 'guideline' | 'large' | 'small' | 'expert';
  design?: Design;
  backedBy?: string[];
  title: L10n;
  originalTitle?: string;
  by: string;
  year: number | null;
  yearNote?: L10n;
  url: string;
  doi?: string;
  isbn?: string;
  publisher?: string;
  evidenceNote?: L10n;
  language: string;
  languageCodes?: string[];
  region?: L10n;
  sourceVersion?: L10n;
  free: boolean;
  minMonths: number;
  maxMonths: number;
  sex: 'all' | 'male' | 'female';
  topics: string[];
  core?: boolean;
  summary: L10n;
  whyAge?: L10n;
  keyPoints?: L10nList;
  actions?: L10nList;
  purpose?: L10n;
  audience?: L10n;
  limits?: L10n;
  access?: L10n;
  checkedNote?: L10n;
  sourceLinks?: { label: L10n; url: string }[];
  checked: string;
}
export interface Stage extends Publishable {
  id: string; minMonths: number; maxMonths: number;
  name: L10n; range: L10n; focus: L10n; intro: L10n; introSrc: string;
  develop: { areas: { area: string; points: Claim[] }[]; concern: Claim };
  activities: Claim[];
  health: { links: string[]; extra: string[] };
  facts: { label: L10n; value: L10n; source: string }[];
  research?: string[];
  picks?: string[];
  roots: { educator: string; en: string; zh: string }[];
  reading: string[];
  learning?: boolean; updated: string;
}
export interface StageSelection { resource: string; reason: L10n }
export interface StageHome extends Publishable {
  id: string;
  headline: L10n;
  intro: L10n;
  startingPoints: StageSelection[];
  reflection: StageSelection;
  context: StageSelection[];
  updates?: (StageSelection & { selectedOn: string })[];
  tools: { tool: string; reason: L10n }[];
  activities?: { activity: string; reason: L10n }[];
  topics?: { topic: string; reason: L10n }[];
}
export interface Activity extends Publishable {
  id: string; title: L10n; summary: L10n;
  minMonths: number; maxMonths: number; topics: string[];
  duration: 'short' | 'medium' | 'flexible'; setting: ('home' | 'travel' | 'outdoors')[];
  time: L10n; materials: L10n; participants: L10n; adaptations: L10n;
  cautions: L10n; basis: L10n; steps: L10nList;
  readings: string[]; tools: string[]; citations: { src: string; note: L10n }[];
  authorship: 'original'; created: string; updated: string; checked: string;
}
export interface Educator extends Publishable {
  id: string; name: L10n; years: string; region: L10n;
  birthYear: number | null;
  origin: keyof typeof import('./educator-browse.mjs').educatorRegions;
  directions: (keyof typeof import('./educator-browse.mjs').educatorDirections)[];
  role: L10n; question: L10n; basis: L10n; reviewed: string;
  works: { title: L10n; note: L10n; src: string }[];
  bio: Claim; ideas: Claim[]; today: Claim; supported: Claim[]; outdated: Claim[];
  texts: { label: L10n; url: string }[];
}
export interface Source { by: string; label: L10n; url: string }
export interface Topic extends Publishable {
  id: string; name: L10n; teaser: L10n; status: 'ready' | 'preparing'; updated: string;
  bottomLine?: L10n;
  sources?: { name: L10n; note: L10n; resource?: string; url?: string; additionalResources?: string[] }[];
  rows?: { age: L10n; cells: L10n[]; verdict: 'agree' | 'differ' | 'single'; verdictNote?: L10n }[];
  picks: string[];
  research?: string[];
  tags?: string[];
  sections?: { id: string; title: L10n; text: L10n; citations: { src: string; note: L10n }[] }[];
  activities?: { activity: string; reason: L10n }[];
  tools?: { tool: string; reason: L10n }[];
}
export interface Tool extends Publishable {
  id: string; name: L10n; kind?: 'external' | 'internal'; toolType?: 'browser-tool' | 'learning-platform' | 'picture-books' | 'creative-platform' | 'simulation'; url?: string; route?: string; storageKey?: string; templateSource?: string; minAge: number; maxAge: number;
  subject: string; by: string; what: L10n; languages: L10n;
  privacy?: string; backing: L10n; backingUrl?: string;
  topics?: string[];
  relatedResources?: string[];
  languageCodes?: string[];
  purpose?: L10n;
  audience?: L10n;
  limits?: L10n;
  access?: L10n;
  device?: L10n;
  registration?: L10n;
  checked?: string;
}
export interface Tip extends Publishable { id: string; minMonths: number; maxMonths: number; resource: string; text: L10n; why: L10n }

const asDate = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v));

export const resources = publishedItems(yaml.load(resourcesRaw) as Resource[]).map((r) => ({ ...r, checked: asDate(r.checked) }));
export const stages = publishedItems(yaml.load(stagesRaw) as Stage[]).map((s) => ({ ...s, updated: asDate(s.updated) }));
export const stageHomes = publishedItems(yaml.load(stageHomeRaw) as StageHome[]).map((home) => ({
  ...home, updates: (home.updates ?? []).map((update) => ({ ...update, selectedOn: asDate(update.selectedOn) })),
}));
export const getStageHome = (id: string) => {
  const home = stageHomes.find((entry) => entry.id === id);
  if (!home) throw new Error(`Missing published stage homepage: ${id}`);
  return home;
};
export const topics = publishedItems(yaml.load(topicsRaw) as Topic[]).map((t) => ({ ...t, updated: asDate(t.updated) }));
// Older external entries used one shared name; normalize them to the bilingual shape
// used by the internal tools so every renderer can select the current language.
export const tools = publishedItems(yaml.load(toolsRaw) as Array<Omit<Tool, 'name'> & { name: string | L10n }>).map((tool) => ({
  ...tool,
  name: typeof tool.name === 'string' ? { en: tool.name, zh: tool.name } : tool.name,
  checked: tool.checked ? asDate(tool.checked) : undefined,
}));
export const toolTypeLabel = (tool: Tool, lang: Lang) => ({
  'browser-tool': { en: 'eduStack tool', zh: '本站工具' },
  'learning-platform': { en: 'Learning platform', zh: '学习平台' },
  'picture-books': { en: 'Picture books', zh: '绘本资源' },
  'creative-platform': { en: 'Creative platform', zh: '创作平台' },
  simulation: { en: 'Interactive simulation', zh: '互动仿真' },
}[tool.toolType ?? (tool.kind === 'internal' ? 'browser-tool' : 'learning-platform')][lang]);
export const tips = publishedItems(yaml.load(tipsRaw) as Tip[]);
export const educators = publishedItems(yaml.load(educatorsRaw) as Educator[]).map((e) => ({ ...e, reviewed: asDate(e.reviewed) }));
export const sources = yaml.load(sourcesRaw) as Record<string, Source>;
export const activities = publishedItems(yaml.load(activitiesRaw) as Activity[]).map((activity) => ({
  ...activity, created: asDate(activity.created), updated: asDate(activity.updated), checked: asDate(activity.checked),
}));
export const getActivity = (id: string) => {
  const activity = activities.find((entry) => entry.id === id);
  if (!activity) throw new Error(`Unknown activity: ${id}`);
  return activity;
};
export const activitiesForResource = (id: string) => activities.filter((activity) => activity.readings.includes(id) || activity.citations.some((citation) => citation.src === id));
export const activitiesForTool = (id: string) => activities.filter((activity) => activity.tools.includes(id));
export const topicsForActivity = (id: string) => topics.filter((topic) => topic.activities?.some((selection) => selection.activity === id));
export const getEducator = (id: string) => { const e = educators.find((x) => x.id === id); if (!e) throw new Error(`Unknown educator: ${id}`); return e; };
export const getTool = (id: string) => { const tool = tools.find((x) => x.id === id); if (!tool) throw new Error(`Unknown tool: ${id}`); return tool; };

export const byId = new Map(resources.map((r) => [r.id, r]));
export const getResource = (id: string) => {
  const r = byId.get(id);
  if (!r) throw new Error(`Unknown resource id: ${id}`);
  return r;
};

/** Research shown as "the research behind it" for a set of recommendations, without duplicates. */
export function researchFor(ids: string[], extra: string[] = []) {
  const out: string[] = [];
  for (const id of [...extra, ...ids.flatMap((x) => getResource(x).backedBy ?? [])]) if (!out.includes(id)) out.push(id);
  return out.map(getResource);
}
/** Books and guidelines (and topics/stages) that a study is shown under. */
export function supportedBy(id: string) {
  return {
    resources: resources.filter((r) => r.backedBy?.includes(id)),
    topics: topics.filter((t) => t.research?.includes(id)),
    stages: stages.filter((s) => s.research?.includes(id)),
    educators: educators.filter((e) => [...[e.bio, e.today, ...e.ideas, ...e.supported, ...e.outdated].map((c) => c.src), ...e.works.map((work) => work.src)].includes(id)),
  };
}
export const recommendations = resources.filter((r) => r.type !== 'research');

/** Resolve a claim's source key to a link: an internal resource page or an external source. */
export function cite(src: string, lang: Lang): { text: string; url: string; internal: boolean } {
  const r = byId.get(src);
  if (r) return { text: `${r.by.split(',')[0]}${r.year ? ', ' + r.year : ''}`, url: r.id, internal: true };
  const s = sources[src];
  if (!s) throw new Error(`Unknown source: ${src}`);
  return { text: `${s.by} · ${s.label[lang]}`, url: s.url, internal: false };
}
/** Stages whose "idea roots" mention an educator. */
export const stagesFor = (educatorId: string) => stages.filter((s) => s.roots.some((r) => r.educator === educatorId));
export const stagesForResource = (id: string) => stages.filter((stage) => {
  const home = stageHomes.find((entry) => entry.id === stage.id);
  return [...stage.reading, ...stage.health.links, ...(stage.picks ?? []), ...(stage.research ?? []),
    ...(home ? [...home.startingPoints, home.reflection, ...home.context, ...(home.updates ?? [])].map((entry) => entry.resource) : [])].includes(id);
});
export const topicsForResource = (id: string) => topics.filter((topic) =>
  [...topic.picks, ...(topic.research ?? []), ...(topic.sections ?? []).flatMap((section) => section.citations.map((citation) => citation.src)), ...(topic.sources ?? []).flatMap((source) => [...(source.resource ? [source.resource] : []), ...(source.additionalResources ?? [])])].includes(id));
export const toolsForResource = (id: string) => tools.filter((tool) => tool.relatedResources?.includes(id));
export const worldcat = (isbn: string) => `https://search.worldcat.org/search?q=bn:${isbn}`;

export function ageLabel(min: number, max: number, lang: Lang) {
  const fmt = (m: number) => (m < 24 ? (lang === 'zh' ? `${m} 个月` : `${m} months`) : lang === 'zh' ? `${Math.round(m / 12)} 岁` : `${Math.round(m / 12)} years`);
  if (min === 0 && max >= 215) return lang === 'zh' ? '0–18 岁' : 'Ages 0–18';
  const hi = max + 1;
  if (min < 24 && hi <= 24) return lang === 'zh' ? `${min}–${hi} 个月` : `${min}–${hi} months`;
  if (min >= 24 || min % 12 === 0) {
    const a = Math.floor(min / 12), b = Math.round(hi / 12);
    return lang === 'zh' ? `${a}–${b} 岁` : `Ages ${a}–${b}`;
  }
  return `${fmt(min)}–${fmt(hi)}`;
}
export function yearLabel(r: Resource, lang: Lang) {
  if (r.yearNote) return r.yearNote[lang];
  if (r.year) return String(r.year);
  return r.yearNote ? r.yearNote[lang] : '';
}

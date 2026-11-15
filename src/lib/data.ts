import yaml from 'js-yaml';
import resourcesRaw from '../data/resources.yaml?raw';
import stagesRaw from '../data/stages.yaml?raw';
import topicsRaw from '../data/topics.yaml?raw';
import toolsRaw from '../data/tools.yaml?raw';
import tipsRaw from '../data/tips.yaml?raw';
import educatorsRaw from '../data/educators.yaml?raw';
import sourcesRaw from '../data/sources.yaml?raw';
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
export interface Educator extends Publishable {
  id: string; name: L10n; years: string; region: L10n;
  bio: Claim; ideas: Claim[]; today: Claim; supported: Claim[]; outdated: Claim[];
  texts: { label: L10n; url: string }[];
}
export interface Source { by: string; label: L10n; url: string }
export interface Topic extends Publishable {
  id: string; name: L10n; teaser: L10n; status: 'ready' | 'preparing'; updated: string;
  bottomLine?: L10n;
  sources?: { name: L10n; note: L10n; resource?: string; url?: string }[];
  rows?: { age: L10n; cells: L10n[]; verdict: 'agree' | 'differ' | 'single'; verdictNote?: L10n }[];
  picks: string[];
  research?: string[];
}
export interface Tool extends Publishable { id: string; name: string; url: string; minAge: number; maxAge: number; subject: string; by: string; what: L10n; languages: L10n; privacy: string; backing: L10n; backingUrl: string }
export interface Tip extends Publishable { id: string; minMonths: number; maxMonths: number; resource: string; text: L10n; why: L10n }

const asDate = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v));

export const resources = publishedItems(yaml.load(resourcesRaw) as Resource[]).map((r) => ({ ...r, checked: asDate(r.checked) }));
export const stages = publishedItems(yaml.load(stagesRaw) as Stage[]).map((s) => ({ ...s, updated: asDate(s.updated) }));
export const topics = publishedItems(yaml.load(topicsRaw) as Topic[]).map((t) => ({ ...t, updated: asDate(t.updated) }));
export const tools = publishedItems(yaml.load(toolsRaw) as Tool[]);
export const tips = publishedItems(yaml.load(tipsRaw) as Tip[]);
export const educators = publishedItems(yaml.load(educatorsRaw) as Educator[]);
export const sources = yaml.load(sourcesRaw) as Record<string, Source>;
export const getEducator = (id: string) => { const e = educators.find((x) => x.id === id); if (!e) throw new Error(`Unknown educator: ${id}`); return e; };

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
    educators: educators.filter((e) => [e.bio, e.today, ...e.ideas, ...e.supported, ...e.outdated].some((c) => c.src === id)),
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

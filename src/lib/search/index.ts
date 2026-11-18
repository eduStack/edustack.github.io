// Build-time adapter only. Browser code imports engine.mjs, never data.ts.
import { activityAgeLabel } from '../activity-filter.mjs';
import { activities, educators, resources, tools, topics } from '../data';
import type { SearchEntry } from './types';
export type { SearchEntry, SearchState, SearchType } from './types';

const supportedLanguages = new Set(['en', 'zh', 'es', 'multi']);

function languageCodes(codes: string[] | undefined, label: string): string[] {
  if (codes) return [...new Set(codes.filter((code) => supportedLanguages.has(code)))];
  const out: string[] = [];
  if (/\benglish\b/i.test(label)) out.push('en');
  if (/\bchinese\b/i.test(label)) out.push('zh');
  if (/\bspanish\b/i.test(label)) out.push('es');
  if (/many languages|many other translations|other (?:WHO )?language editions|other translations|with translations/i.test(label)) out.push('multi');
  return out;
}

const empty = (id: string, type: SearchEntry['type']): SearchEntry => ({
  key: `${type}:${id}`, id, type, title: { en: '', zh: '' }, summary: { en: '', zh: '' },
  path: '', by: '', year: null, minMonths: null, maxMonths: null, topics: [],
  free: null, languages: [], sourceLanguage: null, keywords: [], core: false, preparing: false,
});

export function buildSearchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];
  const resourceById = new Map(resources.map((resource) => [resource.id, resource]));
  const relatedTopics = (ids: string[]) => [...new Set(ids.flatMap((id) => resourceById.get(id)?.topics ?? []))];
  for (const resource of resources) {
    if (resource.publicationStatus !== 'published') continue;
    entries.push({
      ...empty(resource.id, resource.type), title: resource.title, summary: resource.summary,
      path: `resources/${resource.id}`, by: resource.by, year: resource.year,
      dateKind: 'source-publication',
      minMonths: resource.minMonths, maxMonths: resource.maxMonths, topics: [...resource.topics],
      free: resource.free, languages: languageCodes(resource.languageCodes, resource.language),
      sourceLanguage: { en: resource.language, zh: resource.language },
      keywords: resource.originalTitle ? [resource.originalTitle] : [], core: resource.core === true,
    });
  }
  for (const tool of tools) {
    if (tool.publicationStatus !== 'published') continue;
    entries.push({
      ...empty(tool.id, 'tool'), title: tool.name, summary: tool.what,
      path: `tools/${tool.id}`, by: tool.by, minMonths: tool.minAge * 12,
      maxMonths: Math.min((tool.maxAge + 1) * 12 - 1, 215), topics: [...(tool.topics ?? [])],
      ageLabel: { en: `Ages ${tool.minAge}–${tool.maxAge}`, zh: `${tool.minAge}–${tool.maxAge} 岁` },
      free: tool.free, languages: languageCodes(tool.languageCodes, tool.languages.en), sourceLanguage: tool.languages,
      keywords: [tool.subject, ...(tool.subject === 'coding' ? ['programming', '编程', '写代码'] : [])],
    });
  }
  for (const educator of educators) {
    if (educator.publicationStatus !== 'published') continue;
    entries.push({
      ...empty(educator.id, 'educator'), title: educator.name,
      summary: { en: educator.bio.en, zh: educator.bio.zh }, path: `educators/${educator.id}`,
      topics: [...educator.topics],
      keywords: [educator.role.en, educator.role.zh, educator.question.en, educator.question.zh,
        ...educator.ideas.flatMap((idea) => [idea.en, idea.zh]),
        ...educator.works.flatMap((work) => [work.title.en, work.title.zh])],
    });
  }
  for (const topic of topics) {
    if (topic.publicationStatus !== 'published') continue;
    entries.push({
      ...empty(topic.id, 'topic'), title: topic.name, summary: topic.teaser,
      path: `topics/${topic.id}`, topics: topic.tags ?? relatedTopics([...topic.picks, ...(topic.research ?? [])]),
      preparing: topic.status === 'preparing',
    });
  }
  for (const activity of activities) {
    if (activity.publicationStatus !== 'published') continue;
    entries.push({
    ...empty(activity.id, 'activity'), title: activity.title, summary: activity.summary,
    path: `activities/${activity.id}`, by: 'eduStack', year: Number(activity.created.slice(0, 4)),
    ageLabel: { en: activityAgeLabel(activity.minMonths, activity.maxMonths, 'en'), zh: activityAgeLabel(activity.minMonths, activity.maxMonths, 'zh') },
    dateKind: 'site-publication', minMonths: activity.minMonths, maxMonths: activity.maxMonths,
    topics: activity.topics, free: true, languages: ['en', 'zh'],
    sourceLanguage: { en: 'English and Chinese', zh: '英文、中文' },
  });
  }
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.key)) return false;
    seen.add(entry.key);
    return true;
  });
}

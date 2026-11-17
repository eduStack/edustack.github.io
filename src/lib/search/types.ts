export type SearchType = 'book' | 'classic' | 'guide' | 'guideline' | 'research' | 'tool' | 'educator' | 'topic' | 'activity';
export interface SearchEntry {
  key: string;
  id: string;
  type: SearchType;
  title: { en: string; zh: string };
  summary: { en: string; zh: string };
  path: string;
  by: string;
  year: number | null;
  dateKind?: 'source-publication' | 'site-publication';
  minMonths: number | null;
  maxMonths: number | null;
  ageLabel?: { en: string; zh: string };
  topics: string[];
  free: boolean | null;
  languages: string[];
  sourceLanguage: { en: string; zh: string } | null;
  keywords: string[];
  core: boolean;
  preparing: boolean;
}
export interface SearchState {
  q: string;
  type: string;
  age: string;
  topic: string;
  language: string;
  free: boolean;
  sort: 'relevance' | 'newest';
}

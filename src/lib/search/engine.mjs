import { primaryStages, resourceTopics } from '../taxonomy.mjs';

const types = new Set(['book', 'classic', 'guide', 'guideline', 'research', 'tool', 'educator', 'topic', 'activity']);
const languages = new Set(['en', 'zh', 'es', 'multi']);
// Small editorial vocabulary for ordinary family questions, not diagnostic synonyms.
const aliases = {
  emotions: 'big feelings angry anger tantrum tantrums 情绪 发脾气 生气',
  communication: 'talk talking listening 说话 倾听 沟通',
  sleep: 'bedtime sleeping 睡觉 入睡',
  play: 'games playing 玩耍 游戏',
  'screen-time': 'screens phones television 屏幕 手机 电视',
  'self-regulation': 'calm calming self control 冷静 自控',
  learning: 'study studying homework 学习 作业',
};

export function defaultSearchState() {
  return { q: '', type: '', age: '', topic: '', language: '', free: false, sort: 'relevance' };
}

function validAge(value) {
  return primaryStages.some((stage) => stage.id === value)
    || (/^year:(0|[1-9]\d?)$/.test(value) && Number(value.slice(5)) <= 17)
    || (/^(0|[1-9]\d{0,2})$/.test(value) && Number(value) <= 215);
}

export function parseSearchState(params) {
  const state = defaultSearchState();
  state.q = (params.get('q') ?? '').trim().slice(0, 200);
  const type = params.get('type') ?? '';
  const age = params.get('age') ?? '';
  const topic = params.get('topic') ?? '';
  const language = params.get('language') ?? '';
  if (types.has(type)) state.type = type;
  if (validAge(age)) state.age = age;
  if (Object.hasOwn(resourceTopics, topic)) state.topic = topic;
  if (languages.has(language)) state.language = language;
  state.free = params.get('free') === '1';
  if (params.get('sort') === 'newest') state.sort = 'newest';
  return state;
}

export function serializeSearchState(state) {
  const raw = new URLSearchParams();
  for (const key of ['q', 'type', 'age', 'topic', 'language']) raw.set(key, String(state[key] ?? ''));
  if (state.free === true) raw.set('free', '1');
  raw.set('sort', state.sort);
  const clean = parseSearchState(raw);
  const out = new URLSearchParams();
  for (const key of ['q', 'type', 'age', 'topic', 'language']) if (clean[key]) out.set(key, clean[key]);
  if (clean.free) out.set('free', '1');
  if (clean.sort !== 'relevance') out.set('sort', clean.sort);
  return out;
}

function normalize(value) {
  return String(value ?? '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function matchAge(entry, age) {
  if (!age) return true;
  if (entry.minMonths === null || entry.maxMonths === null) return false;
  const stage = primaryStages.find((candidate) => candidate.id === age);
  if (stage) return entry.minMonths <= stage.maxMonths && entry.maxMonths >= stage.minMonths;
  if (age.startsWith('year:')) {
    const years = Number(age.slice(5));
    return entry.minMonths <= years * 12 + 11 && entry.maxMonths >= years * 12;
  }
  return entry.minMonths <= Number(age) && entry.maxMonths >= Number(age);
}

export function searchEntries(entries, state) {
  const clean = parseSearchState(serializeSearchState(state));
  const query = normalize(clean.q);
  const words = query.split(/\s+/).filter(Boolean);
  const seen = new Set();
  const matches = [];
  entries.forEach((entry, order) => {
    if (seen.has(entry.key)) return;
    seen.add(entry.key);
    if (clean.type && entry.type !== clean.type) return;
    if (!matchAge(entry, clean.age)) return;
    if (clean.topic && !entry.topics.includes(clean.topic)) return;
    if (clean.language && !entry.languages.includes(clean.language)) return;
    if (clean.free && entry.free !== true) return;
    const titles = [entry.title.en, entry.title.zh].map(normalize);
    const keywords = entry.keywords.map(normalize);
    const author = normalize(entry.by);
    const topicText = entry.topics.map((topic) => `${topic} ${resourceTopics[topic]?.en ?? ''} ${resourceTopics[topic]?.zh ?? ''} ${aliases[topic] ?? ''}`).join(' ');
    const text = normalize([...titles, ...keywords, author, entry.summary.en, entry.summary.zh, topicText].join(' '));
    if (!words.every((word) => text.includes(word))) return;
    let score = entry.core ? 1 : 0;
    if (query) {
      if (titles.includes(query)) score += 100;
      else if (titles.some((title) => title.includes(query))) score += 60;
      else if (keywords.some((keyword) => keyword === query)) score += 80;
      else if (author.includes(query)) score += 30;
      score += words.filter((word) => titles.some((title) => title.includes(word))).length * 5;
    }
    matches.push({ entry, order, score });
  });
  matches.sort((a, b) => {
    if (clean.sort === 'newest') {
      const year = (b.entry.year ?? -Infinity) - (a.entry.year ?? -Infinity);
      if (year && !Number.isNaN(year)) return year;
      return Number(b.entry.core) - Number(a.entry.core) || a.order - b.order;
    }
    return b.score - a.score || a.order - b.order;
  });
  return matches.map(({ entry }) => entry);
}

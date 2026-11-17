// These are overlapping editorial reading directions, not exclusive school memberships.
export const educatorDirections = {
  confucian: { en: 'Confucian learning and cultivation', zh: '儒家学习与修养' },
  classical: { en: 'Classical philosophy and virtue', zh: '古典哲学与德性' },
  religious: { en: 'Religious ethics and character', zh: '宗教伦理与品格' },
  humanist: { en: 'Humanistic education and judgment', zh: '人文教育与自主判断' },
  child: { en: 'Nature and child-centred education', zh: '自然教育与儿童中心' },
  experience: { en: 'Experience and practical learning', zh: '经验与实践学习' },
  development: { en: 'Cognition and development', zh: '认知与发展' },
  care: { en: 'Relationships, care and dialogue', zh: '关系、关怀与对话' },
  justice: { en: 'Educational access and social change', zh: '教育机会与社会改变' },
  culture: { en: 'Culture and community', zh: '文化与共同体' },
  freedom: { en: 'Freedom and self-understanding', zh: '自由与自我认识' },
};
export const educatorRegions = {
  'east-asia': { en: 'East Asia', zh: '东亚' },
  'south-asia': { en: 'South Asia', zh: '南亚' },
  europe: { en: 'Europe', zh: '欧洲' },
  'north-america': { en: 'North America', zh: '北美' },
  'south-america': { en: 'South America', zh: '南美' },
  africa: { en: 'Africa', zh: '非洲' },
  'west-central-asia': { en: 'West and Central Asia', zh: '西亚与中亚' },
  oceania: { en: 'Oceania', zh: '大洋洲' },
};
export const educatorSorts = ['oldest', 'newest', 'direction', 'region', 'name'];
export function educatorBrowseState(params = new URLSearchParams()) {
  const sort = params.get('sort') || '';
  const direction = params.get('direction') || '';
  const region = params.get('region') || '';
  return {
    sort: educatorSorts.includes(sort) ? sort : 'oldest',
    direction: Object.hasOwn(educatorDirections, direction) ? direction : '',
    region: Object.hasOwn(educatorRegions, region) ? region : '',
  };
}
/**
 * @template {{ id: string, birthYear: number | null, directions: string[], origin: string, name: { en: string, zh: string } }} T
 * @param {T[]} entries
 * @param {{ sort: string, direction: string, region: string }} state
 * @param {'en' | 'zh'} lang
 * @returns {T[]}
 */
export function browseEducators(entries, state, lang = 'en') {
  const compare = new Intl.Collator(lang === 'zh' ? 'zh-Hans' : 'en', { sensitivity: 'base' }).compare;
  const chronological = (a, b) => {
    // Unknown years remain last in either direction; never invent a date for sorting.
    if (a.birthYear === null || b.birthYear === null) return a.birthYear === b.birthYear ? 0 : a.birthYear === null ? 1 : -1;
    return state.sort === 'newest' ? b.birthYear - a.birthYear : a.birthYear - b.birthYear;
  };
  return entries.filter(e => (!state.direction || e.directions.includes(state.direction)) && (!state.region || e.origin === state.region)).sort((a, b) => {
    let group = 0;
    if (state.sort === 'direction') group = compare(educatorDirections[a.directions[0]][lang], educatorDirections[b.directions[0]][lang]);
    if (state.sort === 'region') group = compare(educatorRegions[a.origin][lang], educatorRegions[b.origin][lang]);
    if (state.sort === 'name') group = compare(a.name[lang], b.name[lang]);
    return group || chronological(a, b) || compare(a.name[lang], b.name[lang]) || compare(a.id, b.id);
  });
}

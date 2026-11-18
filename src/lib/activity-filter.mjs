import { primaryStages } from './taxonomy.mjs';
import { inclusiveAgeLabel } from './age-label.mjs';

export const durationLabels = {
  short: { en: 'About 5 minutes', zh: '约5分钟' },
  medium: { en: 'About 15 minutes', zh: '约15分钟' },
  flexible: { en: 'Longer or at your own pace', zh: '更长或自行安排' },
};
export const settingLabels = {
  home: { en: 'At home', zh: '家里' },
  travel: { en: 'On the go', zh: '外出途中' },
  outdoors: { en: 'Outdoors', zh: '户外' },
};

export function parseActivityFilters(params) {
  const age = params.get('age') ?? '';
  const validAge = age === 'any' || primaryStages.some((stage) => stage.id === age)
    || (/^year:(0|[1-9]\d?)$/.test(age) && Number(age.slice(5)) <= 17)
    // Keep old month-valued URLs and the private profile filter working.
    || (/^(0|[1-9]\d{0,2})$/.test(age) && Number(age) <= 215);
  const duration = params.get('duration') ?? '';
  const setting = params.get('setting') ?? '';
  return {
    age: validAge ? age : '',
    duration: Object.hasOwn(durationLabels, duration) ? duration : '',
    setting: Object.hasOwn(settingLabels, setting) ? setting : '',
  };
}

export function serializeActivityFilters(state) {
  const clean = parseActivityFilters(new URLSearchParams(state));
  return new URLSearchParams(Object.entries(clean).filter(([, value]) => value));
}

/** @param {number | null} profileMonths */
export function effectiveActivityFilters(state, profileMonths = null) {
  const automatic = !state.age;
  const valid = Number.isInteger(profileMonths) && profileMonths >= 0;
  const profileAge = automatic && valid && profileMonths <= 215;
  return {
    state: { ...state, age: profileAge ? String(profileMonths) : state.age },
    profileAge,
    outOfRange: automatic && valid && profileMonths >= 216,
  };
}

export function filterActivities(activities, state) {
  const clean = parseActivityFilters(serializeActivityFilters(state));
  const stage = primaryStages.find((candidate) => candidate.id === clean.age);
  return activities.filter((activity) => {
    if (clean.duration && activity.duration !== clean.duration) return false;
    if (clean.setting && !activity.setting.includes(clean.setting)) return false;
    if (!clean.age || clean.age === 'any') return true;
    const years = clean.age.startsWith('year:') ? Number(clean.age.slice(5)) : null;
    const min = stage ? stage.minMonths : years === null ? Number(clean.age) : years * 12;
    const max = stage ? stage.maxMonths : years === null ? Number(clean.age) : years * 12 + 11;
    return activity.minMonths <= max && activity.maxMonths >= min;
  });
}

/** Exact inclusive ages for activities; the last birthday is included. */
export function activityAgeLabel(min, max, lang) {
  return inclusiveAgeLabel(min, max, lang);
}

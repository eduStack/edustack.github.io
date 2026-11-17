import { defaultSearchState, parseSearchState, serializeSearchState } from './engine.mjs';

// Public conditions are separate from the temporary age shown in the form.
/** @param {URLSearchParams} params @param {number | null} [profileMonths] */
export function createProfileSearch(params, profileMonths = null) {
  return { publicState: parseSearchState(params), profileMonths, automaticAge: params.get('age') !== 'any' };
}

export function effectiveProfileSearch(model) {
  const automatic = model.automaticAge && !model.publicState.age;
  const validMonths = Number.isInteger(model.profileMonths) && model.profileMonths >= 0;
  const profileAge = automatic && validMonths && model.profileMonths <= 215;
  return {
    state: { ...model.publicState, age: profileAge ? String(model.profileMonths) : model.publicState.age },
    profileAge,
    outOfRange: automatic && validMonths && model.profileMonths >= 216,
  };
}

export function updateProfileSearch(model, params, ageChanged = false) {
  const publicState = parseSearchState(params);
  // Other controls and submit must not promote the displayed profile age to a URL condition.
  if (!ageChanged) publicState.age = model.publicState.age;
  return { ...model, publicState, automaticAge: ageChanged ? false : model.automaticAge };
}

export function resetProfileSearch(model, query = '') {
  const params = new URLSearchParams({ q: query });
  return { ...model, publicState: { ...defaultSearchState(), q: parseSearchState(params).q }, automaticAge: false };
}

export function restoreProfileSearch(model, params) {
  return { ...model, publicState: parseSearchState(params), automaticAge: params.get('age') === 'any' ? false : model.automaticAge };
}

export function changeProfileSearchChild(model, profileMonths) {
  return { ...model, profileMonths };
}

export function serializeProfileSearch(model) {
  const params = serializeSearchState(model.publicState);
  if (!model.automaticAge && !model.publicState.age) params.set('age', 'any');
  return params;
}

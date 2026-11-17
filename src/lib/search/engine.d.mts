import type { SearchEntry, SearchState } from './types';
export function defaultSearchState(): SearchState;
export function parseSearchState(params: URLSearchParams): SearchState;
export function serializeSearchState(state: SearchState): URLSearchParams;
export function searchEntries(entries: readonly SearchEntry[], state: SearchState): SearchEntry[];

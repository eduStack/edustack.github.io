// Shared browser-side helpers: profiles live only in localStorage.
export type Child = { id: string; name: string; y: number; m: number; sex: 'male' | 'female' | '' };
export type Store = { v: 1; children: Child[]; sel?: string };
const KEY = 'edustack.profiles.v1';
const HOME_KEY = 'edustack.home-view.v1';
export type HomeMode = 'child' | 'general';
export function readHomeMode(): HomeMode {
  try { return localStorage.getItem(HOME_KEY) === 'general' ? 'general' : 'child'; } catch { return 'child'; }
}
export function saveHomeMode(mode: HomeMode): boolean {
  if (mode !== 'child' && mode !== 'general') return false;
  try { localStorage.setItem(HOME_KEY, mode); return true; } catch { return false; }
}
function resetHomeMode() {
  try { localStorage.removeItem(HOME_KEY); } catch { /* The preference contains no profile data. */ }
}
const emptyStore = (): Store => ({ v: 1, children: [] });
export type ProfileRead = { store: Store; status: 'ok' | 'invalid' | 'unavailable' };

function validBirth(y: unknown, m: unknown, now: Date): y is number {
  return typeof y === 'number' && typeof m === 'number'
    && Number.isInteger(y) && Number.isInteger(m) && y > 1990 && m >= 1 && m <= 12
    && y * 12 + m <= now.getFullYear() * 12 + now.getMonth() + 1;
}

/** Use the same validation for saved profiles, imports and writes. */
export function normalizeStore(value: unknown, now = new Date()): Store | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  if (raw.v !== 1 || !Array.isArray(raw.children) || raw.children.length > 6) return null;
  const children: Child[] = [];
  const ids = new Set<string>();
  for (const item of raw.children) {
    if (!item || typeof item !== 'object') return null;
    const c = item as Record<string, unknown>;
    if (typeof c.id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(c.id) || ids.has(c.id)
      || !validBirth(c.y, c.m, now)
      || (c.name !== undefined && typeof c.name !== 'string')
      || (c.sex !== undefined && c.sex !== '' && c.sex !== 'male' && c.sex !== 'female')) return null;
    ids.add(c.id);
    children.push({ id: c.id, name: (c.name as string | undefined ?? '').trim().slice(0, 30), y: c.y as number, m: c.m as number, sex: c.sex as Child['sex'] | undefined ?? '' });
  }
  if (raw.sel !== undefined && typeof raw.sel !== 'string') return null;
  const sel = children.find((c) => c.id === raw.sel)?.id ?? children[0]?.id;
  return { v: 1, children, ...(sel ? { sel } : {}) };
}

export function readProfiles(): ProfileRead {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return { store: emptyStore(), status: 'ok' };
    const store = normalizeStore(JSON.parse(raw));
    return { store: store ?? emptyStore(), status: store ? 'ok' : 'invalid' };
  } catch (error) {
    return { store: emptyStore(), status: error instanceof SyntaxError ? 'invalid' : 'unavailable' };
  }
}

export function load(): Store {
  return readProfiles().store;
}
export function save(s: Store): boolean {
  const store = normalizeStore(s);
  if (!store) return false;
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { return false; }
  if (!store.children.length) resetHomeMode();
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('edustack:profilechange'));
  return true;
}
export function clearAll(): boolean {
  try { localStorage.removeItem(KEY); } catch { return false; }
  resetHomeMode();
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('edustack:profilechange'));
  return true;
}
/** Whole months between birth month and now (birth day unknown, so counted from the 1st). */
export function ageMonths(c: Child, now = new Date()) {
  return validBirth(c.y, c.m, now) ? (now.getFullYear() - c.y) * 12 + (now.getMonth() + 1 - c.m) : NaN;
}
export function selected(s: Store) {
  return s.children.find((c) => c.id === s.sel) || s.children[0];
}
export function ageText(months: number, lang: string) {
  const y = Math.floor(months / 12), m = months % 12;
  if (lang === 'zh') return y ? `${y} 岁${m ? ` ${m} 个月` : ''}` : `${m} 个月`;
  const ys = y ? `${y} year${y > 1 ? 's' : ''}` : '';
  const ms = m ? `${m} month${m > 1 ? 's' : ''}` : '';
  return [ys, ms].filter(Boolean).join(' ') || '0 months';
}
/** Same tip all day, a different one tomorrow. */
export function dailyIndex(n: number, now = new Date()) {
  const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  return n ? day % n : 0;
}
export function encodeCode(s: Store) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(s))));
}
export function decodeCode(code: string): Store | null {
  try {
    if (code.length > 32768) return null;
    const bytes = Uint8Array.from(atob(code.trim()), (c) => c.charCodeAt(0));
    return normalizeStore(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
  } catch {}
  return null;
}

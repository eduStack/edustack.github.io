// Shared browser-side helpers: profiles live only in localStorage.
export type Child = { id: string; name: string; y: number; m: number; sex: 'male' | 'female' | '' };
export type Store = { v: 1; children: Child[]; sel?: string };
const KEY = 'edustack.profiles.v1';

export function load(): Store {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && s.v === 1 && Array.isArray(s.children)) return s;
  } catch {}
  return { v: 1, children: [] };
}
export function save(s: Store) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}
export function clearAll() {
  try { localStorage.removeItem(KEY); } catch {}
}
/** Whole months between birth month and now (birth day unknown, so counted from the 1st). */
export function ageMonths(c: Child, now = new Date()) {
  return Math.max(0, (now.getFullYear() - c.y) * 12 + (now.getMonth() + 1 - c.m));
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
  return btoa(unescape(encodeURIComponent(JSON.stringify(s))));
}
export function decodeCode(code: string): Store | null {
  try {
    const s = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    if (s && s.v === 1 && Array.isArray(s.children)) {
      s.children = s.children.slice(0, 6).map((c: any) => ({
        id: String(c.id || Math.random().toString(36).slice(2, 8)), name: String(c.name || '').slice(0, 30),
        y: Number(c.y), m: Number(c.m), sex: c.sex === 'male' || c.sex === 'female' ? c.sex : '',
      })).filter((c: Child) => c.y > 1990 && c.m >= 1 && c.m <= 12);
      return s;
    }
  } catch {}
  return null;
}

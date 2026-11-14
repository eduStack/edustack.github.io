// Checks every link in the data files still answers: resources, tools (and their privacy and
// research pages), sources and educators' free texts. Run: npm run check:links
// Some sites block automated requests (403); those are reported as warnings to check by hand.
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
const load = (f) => yaml.load(readFileSync(new URL(`../src/data/${f}`, import.meta.url), 'utf8'));
const urls = [
  ...load('resources.yaml').flatMap((r) => [[r.id, r.url], ...(r.sourceLinks ?? []).map((s) => [`${r.id} source`, s.url])]),
  ...load('tools.yaml').flatMap((t) => [[t.id, t.url], [`${t.id} privacy`, t.privacy], [`${t.id} backing`, t.backingUrl]]),
  ...Object.entries(load('sources.yaml')).map(([k, v]) => [k, v.url]),
  ...load('educators.yaml').flatMap((e) => e.texts.map((x) => [`${e.id} text`, x.url])),
];
let broken = 0;
for (const [id, url] of urls) {
  try {
    const res = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; edustack-link-check)' }, signal: AbortSignal.timeout(20000) });
    if (res.status >= 400 && res.status !== 403 && res.status !== 429) { broken++; console.log(`BROKEN ${res.status} ${id} ${url}`); }
    else if (res.status >= 400) console.log(`CHECK BY HAND ${res.status} ${id} ${url}`);
    else console.log(`ok ${res.status} ${id}`);
  } catch (e) { broken++; console.log(`BROKEN ${e.name} ${id} ${url}`); }
}
process.exit(broken ? 1 : 0);

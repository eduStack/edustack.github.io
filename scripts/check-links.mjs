// External-link maintenance only; verify local routes with npm run test:built after a build.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import yaml from 'js-yaml';
import { collectLinkTargets } from './link-targets.mjs';

export function loadLinkTargets() {
  const collections = Object.fromEntries(['resources', 'tools', 'sources', 'educators', 'topics'].map((name) => [name,
    yaml.load(readFileSync(new URL(`../src/data/${name}.yaml`, import.meta.url), 'utf8'))]));
  return collectLinkTargets(collections);
}

export async function checkLinkTargets(targets, { request = fetch, log = console.log, timeout = 20000, concurrency = 4 } = {}) {
  const counts = { ok: 0, broken: 0, manual: 0, invalid: targets.invalid.length, internalDeferred: targets.internal.length };
  for (const item of targets.invalid) log(`INVALID ${item.owner} ${String(item.value)} (${item.reason})`);
  for (const item of targets.internal) log(`LOCAL DEFERRED ${item.route} [${item.owners.join('; ')}] - verify English and Chinese routes with npm run build && npm run test:built`);
  let next = 0;
  const worker = async () => {
    while (next < targets.external.length) {
      const item = targets.external[next++];
      const owner = item.owners.join('; ');
      try {
        const response = await request(item.url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; edustack-link-check)' }, signal: AbortSignal.timeout(timeout) });
        // Reachability checks do not require downloading full source works.
        await response.body?.cancel();
        const status = response.status;
        if (status === 403 || status === 429) {
          counts.manual++;
          log(`CHECK BY HAND ${status} [${owner}] ${item.url}`);
        } else if (status >= 400) {
          counts.broken++;
          log(`BROKEN ${status} [${owner}] ${item.url}`);
        } else {
          counts.ok++;
          log(`ok ${status} [${owner}] ${item.url}`);
        }
      } catch (error) {
        counts.broken++;
        log(`BROKEN ${error.name} [${owner}] ${item.url}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, targets.external.length)) }, worker));
  log(`Links: ${counts.ok} OK, ${counts.broken} broken/request failures, ${counts.manual} need human review, ${counts.invalid} invalid; ${counts.internalDeferred} local routes deferred to built-site checks.`);
  return counts;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const counts = await checkLinkTargets(loadLinkTargets());
  process.exitCode = counts.broken || counts.invalid ? 1 : 0;
}

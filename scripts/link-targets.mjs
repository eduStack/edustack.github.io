import { publishedItems } from '../src/lib/publication.mjs';

// Keep data collection independent of network requests and generated build files.
export function collectLinkTargets({ resources = [], tools = [], sources = {}, educators = [], topics = [] }) {
  const external = new Map();
  const internal = new Map();
  const invalid = [];
  const add = (value, owner, { optional = false, local = false } = {}) => {
    if (optional && value === undefined) return;
    if (typeof value !== 'string' || !value.trim()) {
      invalid.push({ value, owner, reason: 'Missing or empty link' });
      return;
    }
    const target = value.trim();
    if (local) {
      if (!/^\/(?!\/)[^?#\\]*\/$/.test(target) || target.split('/').some((part) => part === '.' || part === '..')) {
        invalid.push({ value, owner, reason: 'Expected a local route with a trailing slash' });
        return;
      }
      if (!internal.has(target)) internal.set(target, { route: target, owners: [] });
      internal.get(target).owners.push(owner);
      return;
    }
    let url;
    try {
      url = new URL(target);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error();
    } catch {
      invalid.push({ value, owner, reason: 'Expected an absolute HTTP(S) URL without credentials' });
      return;
    }
    const canonical = url.href;
    if (!external.has(canonical)) external.set(canonical, { url: canonical, owners: [] });
    external.get(canonical).owners.push(owner);
  };
  for (const item of publishedItems(resources)) {
    add(item.url, `resource:${item.id}`);
    for (const [i, source] of (item.sourceLinks ?? []).entries()) add(source.url, `resource:${item.id} source:${i + 1}`);
  }
  for (const item of publishedItems(tools)) {
    if (item.kind === 'internal') add(item.route, `tool:${item.id}`, { local: true });
    else add(item.url, `tool:${item.id}`);
    // Internal tools can still cite external policies or supporting sources.
    for (const field of ['url', 'privacy', 'backingUrl']) {
      if (field === 'url' && item.kind !== 'internal') continue;
      add(item[field], `tool:${item.id} ${field}`, { optional: true });
    }
  }
  for (const [id, source] of Object.entries(sources)) add(source.url, `source:${id}`);
  for (const item of publishedItems(educators)) {
    for (const [i, text] of (item.texts ?? []).entries()) add(text.url, `educator:${item.id} text:${i + 1}`);
  }
  for (const item of publishedItems(topics)) {
    for (const [i, source] of (item.sources ?? []).entries()) add(source.url, `topic:${item.id} source:${i + 1}`, { optional: true });
  }
  for (const target of [...external.values(), ...internal.values()]) target.owners = [...new Set(target.owners)];
  return { external: [...external.values()], internal: [...internal.values()], invalid };
}

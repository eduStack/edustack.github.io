/** Stable contextual recommendations require both a shared topic and age overlap. */
export function relatedReadings(resource, candidates, limit = 3) {
  return candidates.filter((item) => item.publicationStatus === 'published' && item.type !== 'research'
    && item.id !== resource.id && item.minMonths <= resource.maxMonths && item.maxMonths >= resource.minMonths
    && item.topics.some((topic) => resource.topics.includes(topic)))
    .map((item) => ({ item, score: item.topics.filter((topic) => resource.topics.includes(topic)).length }))
    .sort((a, b) => b.score - a.score || Number(b.item.core === true) - Number(a.item.core === true) || a.item.id.localeCompare(b.item.id))
    .slice(0, limit).map(({ item }) => item);
}

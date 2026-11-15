/** @type {readonly ['draft', 'in-review', 'published', 'needs-review']} */
export const publicationStatuses = Object.freeze(['draft', 'in-review', 'published', 'needs-review']);

/**
 * Only explicitly published items may reach pages or browser data.
 * @template {{ publicationStatus?: string }} T
 * @param {T[]} items
 * @returns {T[]}
 */
export function publishedItems(items) {
  return items.filter((item) => item.publicationStatus === 'published');
}

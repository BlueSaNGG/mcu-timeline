// Lightweight checks used before rendering. Full JSON Schema checks run in tooling.
export function assertLegacyCatalog(catalog) {
  if (!catalog || typeof catalog !== 'object' || !Array.isArray(catalog.works) || !catalog.works.length || !Array.isArray(catalog.chrono_order)) throw new Error('Invalid catalog structure');
  const ids = new Set();
  for (const work of catalog.works) {
    if (!work || typeof work.id !== 'string' || !work.id || ids.has(work.id)) throw new Error('Missing or duplicate work id');
    if (typeof work.title !== 'string' || typeof work.title_cn !== 'string' || !Array.isArray(work.key_characters) || !['film','series'].includes(work.type)) throw new Error('Invalid work fields: ' + work.id);
    ids.add(work.id);
  }
  const ordered = new Set(catalog.chrono_order);
  if (ordered.size !== catalog.chrono_order.length || ordered.size !== ids.size || [...ordered].some(id => !ids.has(id))) throw new Error('Chronology must include every work exactly once');
  return catalog;
}

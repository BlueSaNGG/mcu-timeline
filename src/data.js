import {assertLegacyCatalog} from './catalog-contract.js';

export async function loadCatalog({fetchImpl = fetch, url = new URL('../data/catalog.json', import.meta.url)} = {}) {
  const response = await fetchImpl(url, {cache: 'no-cache'});
  if (!response.ok) throw new Error('Catalog request failed: HTTP ' + response.status);
  return assertLegacyCatalog(await response.json());
}

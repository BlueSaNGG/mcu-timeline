import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {assertLegacyCatalog} from '../src/catalog-contract.js';

const ajv = new Ajv({strict: true, allErrors: true});
addFormats(ajv);
const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
const legacyValidator = ajv.compile(await readJson(new URL('./catalog.legacy.schema.json', import.meta.url)));
const targetValidator = ajv.compile(await readJson(new URL('../docs/specs/catalog.schema.json', import.meta.url)));

export function validateCatalog(data, {legacy = false, synthetic = false, baselineIds = null} = {}) {
  const validator = legacy ? legacyValidator : targetValidator;
  if (!validator(data)) throw new Error(ajv.errorsText(validator.errors, {separator: '\n'}));
  if (legacy) {
    assertLegacyCatalog(data);
    if (baselineIds && (baselineIds.length !== data.works.length || baselineIds.some(id => !data.works.some(w => w.id === id)))) throw new Error('Legacy ids were removed or replaced');
    if (data.works.some(w => w.id.startsWith('fixture-'))) throw new Error('Synthetic id in production');
    return data;
  }
  const sets = {};
  for (const name of ['works','characters','universes','sources','routes','relations']) {
    sets[name] = new Set();
    for (const entity of data[name]) {
      if (sets[name].has(entity.id)) throw new Error('Duplicate id: ' + entity.id);
      if (!synthetic && entity.id.startsWith('fixture-')) throw new Error('Synthetic id in production');
      sets[name].add(entity.id);
    }
  }
  const need = (set, id) => {if (!sets[set].has(id)) throw new Error('Unknown ' + set + ' reference: ' + id);};
  function walk(value) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {value.forEach(walk); return;}
    for (const id of value.sourceIds || []) need('sources', id);
    for (const id of value.spoilerWorkIds || []) need('works', id);
    Object.values(value).forEach(walk);
  }
  walk(data);
  for (const source of data.sources) if (!synthetic && new URL(source.url).hostname.endsWith('.invalid')) throw new Error('Synthetic source in production');
  for (const work of data.works) {
    if (work.spoilerFreeSynopsis.visibility !== 'safe') throw new Error('Unsafe synopsis: ' + work.id);
    if ((work.runtimeMinutes === null) !== (work.runtimeCertainty === 'unknown')) throw new Error('Runtime certainty mismatch: ' + work.id);
    const eventIds = new Set();
    for (const event of work.releaseEvents) {
      if (eventIds.has(event.id)) throw new Error('Duplicate release event: ' + event.id);
      eventIds.add(event.id);
      if ((event.date === null) !== (event.certainty === 'unknown')) throw new Error('Release certainty mismatch: ' + work.id);
      if (event.certainty === 'confirmed' && !event.sourceIds.length) throw new Error('Confirmed release lacks source');
    }
    if (work.displayReleaseEventId !== null && !eventIds.has(work.displayReleaseEventId)) throw new Error('Unknown display release event');
    if (work.universeLinks.filter(x => x.role === 'primary').length > 1) throw new Error('Multiple primary universes');
    const characterIds = new Set();
    for (const link of work.characterLinks) {
      need('characters', link.id);
      if (characterIds.has(link.id)) throw new Error('Duplicate character link');
      characterIds.add(link.id);
    }
    for (const link of work.universeLinks) need('universes', link.entityId);
    function checkOwnSpoilers(value) {
      if (!value || typeof value !== 'object') return;
      if (value.visibility === 'spoiler' && !value.spoilerWorkIds.includes(work.id)) throw new Error('Spoiler must include own work: ' + work.id);
      Object.values(value).forEach(checkOwnSpoilers);
    }
    checkOwnSpoilers(work);
    if (['unknown','outsideTime','anthology'].includes(work.timeline.kind) && (work.timeline.safeRank !== null || work.timeline.fullRank !== null)) throw new Error('Nonlinear timeline has rank');
  }
  for (const route of data.routes) {
    if (!route.workIds.length) throw new Error('Empty route');
    const reasons = new Set();
    for (const id of route.workIds) {
      need('works', id);
      if (route.verification === 'verified' && data.works.find(w => w.id === id).verification !== 'verified') throw new Error('Verified route contains unaudited work');
    }
    for (const reason of route.reasons) {
      if (!route.workIds.includes(reason.workId) || reasons.has(reason.workId)) throw new Error('Invalid route reason');
      reasons.add(reason.workId);
      if (reason.safe.visibility !== 'safe' || (reason.full && (reason.full.visibility !== 'spoiler' || !reason.full.spoilerWorkIds.includes(reason.workId)))) throw new Error('Route reason visibility mismatch');
    }
    if (reasons.size !== route.workIds.length) throw new Error('Missing route reason');
    if (!synthetic && route.verification === 'draft') throw new Error('Draft route in production');
  }
  for (const relation of data.relations) {need('works', relation.fromWorkId); need('works', relation.toWorkId);}
  for (const kind of ['prerequisite','sequel','storyBefore']) {
    const edges = new Map();
    for (const relation of data.relations.filter(r => r.kind === kind)) edges.set(relation.fromWorkId, [...(edges.get(relation.fromWorkId) || []), relation.toWorkId]);
    const active = new Set(), done = new Set();
    function visit(id) {
      if (active.has(id)) throw new Error('Cyclic ' + kind + ' relation');
      if (done.has(id)) return;
      active.add(id); (edges.get(id) || []).forEach(visit); active.delete(id); done.add(id);
    }
    [...edges.keys()].forEach(visit);
  }
  return data;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const legacy = process.argv.includes('--legacy'), synthetic = process.argv.includes('--synthetic');
    const path = process.argv.slice(2).find(arg => !arg.startsWith('--')) || 'data/catalog.json';
    const baselineIds = legacy ? await readJson(new URL('../docs/legacy-ids.json', import.meta.url)) : null;
    const data = validateCatalog(await readJson(path), {legacy, synthetic, baselineIds});
    console.log(`PASS: ${data.works.length} works; ${legacy ? 'legacy compatibility' : 'normalized v1'} schema, date formats and references`);
    if (legacy) console.log('FACT CHECK PENDING: legacy display claims have not been audited.');
  } catch (error) {console.error(error.message); process.exitCode = 1;}
}

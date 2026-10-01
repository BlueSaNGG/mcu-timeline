import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateCatalog} from '../scripts/validate-data.mjs';
import {loadCatalog} from '../src/data.js';

const read = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const legacy = await read('../data/catalog.json');
const ids = await read('../docs/legacy-ids.json');
const fixture = await read('../docs/specs/fixtures/catalog.synthetic.json');

test('all 73 ids (68 original + 5 One-Shot shorts) and chronology entries survive extraction', () => {
  assert.equal(legacy.works.length, 73);
  assert.equal(validateCatalog(legacy, {legacy:true, baselineIds:ids}), legacy);
  assert.deepEqual(legacy.works.map(w => w.id), ids);
});
test('legacy rejects duplicate ids, missing order entries, invalid dates and replaced ids', () => {
  const cases = [
    x => {x.works[1].id=x.works[0].id;},
    x => {x.chrono_order.pop();},
    x => {x.works[0].release_date='2026-02-30';},
    x => {const old=x.works[0].id; x.works[0].id='replacement'; x.chrono_order[x.chrono_order.indexOf(old)]='replacement';},
  ];
  for (const change of cases) {const x=structuredClone(legacy); change(x); assert.throws(() => validateCatalog(x,{legacy:true,baselineIds:ids}));}
});
test('full Draft 2020-12 validator accepts only explicitly synthetic fixtures', () => {
  validateCatalog(fixture,{synthetic:true});
  assert.throws(() => validateCatalog(fixture), /Synthetic/);
});
test('normalized model rejects invalid references, spoiler tags, route coverage and date formats', () => {
  const cases = [
    x => {x.works[0].characterLinks[0].id='missing';},
    x => {x.works[0].spoilerSections[0].spoilerWorkIds=[];},
    x => {x.works[0].releaseEvents[0].date='2026-02-30';},
    x => {x.routes[0].reasons.pop();},
    x => {x.works[0].spoilerFreeSynopsis.visibility='spoiler'; x.works[0].spoilerFreeSynopsis.spoilerWorkIds=['fixture-alpha'];},
    x => {x.works[0].displayReleaseEventId='missing';},
    x => {x.works[1].spoilerSections[0].spoilerWorkIds=['fixture-alpha'];},
    x => {x.sources[0].url='not-a-url';},
  ];
  for (const change of cases) {const x=structuredClone(fixture); change(x); assert.throws(() => validateCatalog(x,{synthetic:true}));}
});
test('normalized ordering rejects cyclic prerequisite relations', () => {
  const x=structuredClone(fixture);
  for (const [id,from,to] of [['edge-one','fixture-alpha','fixture-beta'],['edge-two','fixture-beta','fixture-alpha']]) x.relations.push({id,fromWorkId:from,toWorkId:to,kind:'prerequisite',label:{text:'测试关系',visibility:'safe',spoilerWorkIds:[],sourceIds:['fixture-source']},certainty:'confirmed',sourceIds:['fixture-source']});
  assert.throws(() => validateCatalog(x,{synthetic:true}), /Cyclic/);
});
test('loader validates HTTP, JSON and catalog structure before rendering', async () => {
  let requested;
  const loaded=await loadCatalog({fetchImpl:async (url, options) => {requested={url,options}; return {ok:true,json:async()=>legacy};}});
  assert.equal(loaded,legacy);
  assert.ok(requested.url.pathname.endsWith('/data/catalog.json'));
  assert.equal(requested.options.cache,'no-cache');
  await assert.rejects(loadCatalog({fetchImpl:async()=>({ok:false,status:404})}), /HTTP 404/);
  await assert.rejects(loadCatalog({fetchImpl:async()=>({ok:true,json:async()=>{throw new Error('Invalid JSON');}})}), /Invalid JSON/);
  await assert.rejects(loadCatalog({fetchImpl:async()=>({ok:true,json:async()=>({works:[]})})}), /Invalid catalog/);
});

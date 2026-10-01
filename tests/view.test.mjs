import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {mountCatalog} from '../src/journey-view.js';
import {startApplication} from '../src/journey-app.js';

const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const catalog=JSON.parse(await readFile(new URL('../data/catalog.json',import.meta.url),'utf8'));
const fixed=Date.parse('2026-10-01T00:00:00Z');
function setup(data=catalog, now=fixed, saved={}) {
  const dom=new JSDOM(html,{url:'https://example.test/mcu-timeline/'});
  Object.entries(saved).forEach(([key,value])=>dom.window.localStorage.setItem(key,value));
  let scheduled=0,cancelled=0;
  const dispose=mountCatalog(data,{document:dom.window.document,now:()=>now,schedule:()=>{scheduled++;return 42;},cancel:id=>{assert.equal(id,42);cancelled++;}});
  return {dom,document:dom.window.document,dispose,scheduled:()=>scheduled,cancelled:()=>cancelled};
}
const cards=document=>[...document.querySelectorAll('.card h3')].map(el=>el.textContent);
test('renders 68 cards in release order and chronology toggle works', () => {
  const x=setup();
  assert.equal(cards(x.document).length,68);
  assert.equal(cards(x.document)[0],'钢铁侠');
  x.document.querySelector('[data-sort="chrono"]').click();
  assert.equal(cards(x.document)[0],'瓦坎达之眼');
  x.dispose(); assert.equal(x.cancelled(),1); x.dom.window.close();
});
test('search, combined filters, reset and empty state remain functional', () => {
  const x=setup(),d=x.document;
  d.querySelector('[data-spoiler="full"]').click(); d.getElementById('confirm-spoiler').click();
  const search=d.getElementById('search'); search.value='Tony Stark'; search.dispatchEvent(new x.dom.window.Event('input'));
  assert.equal(cards(d).length,9);
  d.querySelector('[data-filter="phase"] [data-value="1"]').click(); assert.equal(cards(d).length,3);
  d.querySelector('[data-sort="release"]').click(); d.getElementById('clear').click();
  assert.equal(cards(d).length,68); assert.equal(d.getElementById('view-title').textContent,'上映顺序');
  d.querySelector('[data-filter="type"] [data-value="剧集"]').click(); assert.equal(cards(d).length,28);
  search.value='no-such-work';search.dispatchEvent(new x.dom.window.Event('input'));assert.equal(cards(d).length,0);assert.match(d.getElementById('timeline').textContent,/没有匹配作品/);
  x.dispose();x.dom.window.close();
});
test('countdown uses an injected clock and hides when no future movie remains', () => {
  const x=setup(); assert.equal(x.document.getElementById('countdown').hidden,false);assert.equal(x.document.getElementById('countdown-date').textContent,'2026 · 12 · 18');assert.equal(x.scheduled(),1);x.dispose();x.dom.window.close();
  const y=setup(catalog,Date.parse('2030-01-01T00:00:00Z'));assert.equal(y.document.getElementById('countdown').hidden,true);y.dispose();y.dom.window.close();
});
test('external catalog text is escaped when rendering', () => {
  const data=structuredClone(catalog);data.works[0].title_cn='<img src=x onerror=alert(1)>';data.works[0].synopsis_cn='<script>alert(1)</script>';
  const x=setup(data);assert.equal(x.document.querySelector('.card img'),null);assert.equal(x.document.querySelector('.card script'),null);assert.ok(cards(x.document).includes(data.works[0].title_cn));x.dispose();x.dom.window.close();
});
test('failed load has retry; success re-enables controls and mounts only once', async () => {
  const dom=new JSDOM(html),d=dom.window.document;let loads=0,mounts=0;
  const app=startApplication({document:d,load:async()=>{loads++;if(loads===1)throw new Error('offline');return catalog;},mount:(data,options)=>{mounts++;return mountCatalog(data,{...options,now:()=>fixed,schedule:()=>1,cancel:()=>{}});}});
  await app.ready;assert.match(d.getElementById('timeline').textContent,/作品资料加载失败/);assert.equal(d.getElementById('search').disabled,true);
  d.querySelector('#timeline button').click();await new Promise(resolve=>setImmediate(resolve));assert.equal(cards(d).length,68);assert.equal(d.getElementById('search').disabled,false);
  await app.retry();assert.equal(mounts,1);assert.equal(loads,2);app.dispose();dom.window.close();
});

test('safe mode omits plot from DOM and search; spoiler activation requires confirmation',()=>{
 const x=setup(),d=x.document;
 assert.equal(d.querySelector('.desc'),null);assert.equal(d.querySelector('.cast'),null);assert.equal(d.querySelector('.note'),null);
 const search=d.getElementById('search');search.value='Tony Stark';search.dispatchEvent(new x.dom.window.Event('input'));assert.equal(cards(d).length,0);
 d.querySelector('[data-spoiler="full"]').click();assert.equal(d.querySelector('.desc'),null);d.getElementById('cancel-spoiler').click();assert.equal(d.querySelector('.desc'),null);
 d.querySelector('[data-spoiler="full"]').click();d.getElementById('confirm-spoiler').click();assert.equal(cards(d).length,9);assert.ok(d.querySelector('.desc'));
 d.querySelector('[data-spoiler="safe"]').click();assert.equal(cards(d).length,0);assert.equal(d.querySelector('.desc'),null);x.dispose();x.dom.window.close();
});
test('watched state persists and progress navigation shows watched works',()=>{
 const x=setup(),d=x.document;const b=d.querySelector('[data-watch]'),id=b.dataset.watch;b.click();
 assert.deepEqual(JSON.parse(x.dom.window.localStorage.getItem('mcu-watched-v1')),[id]);
 d.getElementById('progress-link').click();assert.equal(cards(d).length,1);assert.equal(d.getElementById('view-title').textContent,'我的进度');
 d.querySelector('[data-watch]').click();assert.match(d.getElementById('timeline').textContent,/还没有观看记录/);
 d.getElementById('clear').click();assert.equal(cards(d).length,68);x.dispose();x.dom.window.close();
});

test('loose watched records do not activate a route; preview and activation are separate',()=>{
 const x=setup(),d=x.document;d.querySelector('#timeline [data-watch="iron-man-2008"]').click();
 assert.equal(x.dom.window.localStorage.getItem('mcu-route-v1'),null);assert.equal(d.getElementById('feature-title').textContent,'钢铁侠');
 d.querySelector('[data-route="chrono"]').click();assert.equal(x.dom.window.localStorage.getItem('mcu-route-v1'),null);
 d.getElementById('activate-route').click();assert.equal(x.dom.window.localStorage.getItem('mcu-route-v1'),'chrono');
 assert.equal(d.getElementById('feature-title').textContent,'美国队长：复仇者先锋');assert.equal(d.getElementById('route-list').children.length,23);
 d.querySelector('#route-list [data-watch="captain-america-the-first-avenger-2011"]').click();
 assert.notEqual(d.getElementById('feature-title').textContent,'美国队长：复仇者先锋');assert.match(d.getElementById('journey-status').textContent,/2 \/ 23/);
 const index=d.querySelector('#route-list li:last-child .route-index').textContent;d.getElementById('route-remaining').click();assert.equal(d.getElementById('route-list').children.length,21);assert.equal(d.querySelector('#route-list li:last-child .route-index').textContent,index);x.dispose();x.dom.window.close();
});
test('active route and next movie restore on reload, switching routes preserves progress',()=>{
 const saved={'mcu-watched-v1':JSON.stringify(['iron-man-2008']),'mcu-route-v1':'release'};
 const x=setup(catalog,fixed,saved),d=x.document;assert.equal(d.getElementById('feature-title').textContent,'无敌浩克');assert.match(d.getElementById('start-route').textContent,/无敌浩克/);assert.match(d.getElementById('feature-image').getAttribute('src'),/^https:/);
 d.querySelector('[data-route="chrono"]').click();d.getElementById('activate-route').click();assert.deepEqual(JSON.parse(x.dom.window.localStorage.getItem('mcu-watched-v1')),['iron-man-2008']);
 d.getElementById('feature-image').dispatchEvent(new x.dom.window.Event('error'));assert.equal(d.getElementById('feature-image').hidden,true);assert.ok(d.getElementById('feature-title').textContent);x.dispose();x.dom.window.close();
});
test('completed route shows complete state and does not reset or recommend outside route',()=>{
 const ids=catalog.works.filter(x=>x.type==='film'&&x.phase<=3).map(x=>x.id);const x=setup(catalog,fixed,{'mcu-watched-v1':JSON.stringify(ids),'mcu-route-v1':'release'}),d=x.document;
 assert.equal(d.getElementById('feature-title').textContent,'路线已完成');assert.match(d.getElementById('start-route').textContent,/完成/);assert.equal(d.getElementById('route-progress').value,23);assert.equal(d.getElementById('feature-image').hidden,true);assert.equal(JSON.parse(x.dom.window.localStorage.getItem('mcu-watched-v1')).length,23);x.dispose();x.dom.window.close();
});
test('route preview tab and sort persist across reload; hero phase is not zero-padded',()=>{
 const x=setup(),d=x.document;
 assert.equal(d.getElementById('feature-phase').textContent,'PHASE 1');
 d.querySelector('[data-route="chrono"]').click();d.querySelector('[data-sort="chrono"]').click();
 assert.equal(x.dom.window.localStorage.getItem('mcu-route-tab-v1'),'chrono');
 assert.equal(x.dom.window.localStorage.getItem('mcu-sort-v1'),'chrono');
 x.dispose();x.dom.window.close();
 const y=setup(catalog,fixed,{'mcu-route-tab-v1':'chrono','mcu-sort-v1':'chrono'}),dy=y.document;
 assert.equal(dy.querySelector('[data-route="chrono"]').getAttribute('aria-pressed'),'true');
 assert.equal(dy.querySelector('[data-sort="chrono"]').getAttribute('aria-pressed'),'true');
 assert.equal(cards(dy)[0],'瓦坎达之眼');
 y.dispose();y.dom.window.close();
});

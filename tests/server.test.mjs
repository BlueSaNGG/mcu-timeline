import test from 'node:test';
import assert from 'node:assert/strict';
import {createPreviewServer} from '../scripts/serve.mjs';

test('serves ES modules, CSS and JSON correctly under GitHub Pages subpath', async () => {
  const server=createPreviewServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  try {
    const page=await fetch(base+'/mcu-timeline/');assert.equal(page.status,200);const html=await page.text();assert.match(html,/type="module" src="\.\/src\/journey-app.js"/);
    for (const [path,mime] of [['src/journey-app.js','text/javascript'],['styles/journey.css','text/css'],['data/catalog.json','application/json']]) {const r=await fetch(base+'/mcu-timeline/'+path);assert.equal(r.status,200);assert.ok(r.headers.get('content-type').startsWith(mime));}
    assert.equal((await fetch(base+'/mcu-timeline/missing.json')).status,404);
  } finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});

import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {resolve, extname, sep} from 'node:path';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
export function createPreviewServer() {
  return http.createServer(async (request, response) => {
    try {
      if (!['GET','HEAD'].includes(request.method)) {response.writeHead(405); response.end(); return;}
      let path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (path === '/mcu-timeline') {response.writeHead(302, {Location:'/mcu-timeline/'}); response.end(); return;}
      if (path.startsWith('/mcu-timeline/')) path = path.slice('/mcu-timeline'.length);
      if (path.endsWith('/')) path += 'index.html';
      const file = resolve(root, '.' + path);
      if (!file.startsWith(root + sep) && file !== root) {response.writeHead(403); response.end(); return;}
      const content = await readFile(file);
      response.writeHead(200, {'Content-Type':types[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store'});
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch {response.writeHead(404); response.end('Not found');}
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 8000);
  createPreviewServer().listen(port, '127.0.0.1', () => console.log('Preview server listening on port ' + port));
}

#!/usr/bin/env node
/** Serves dist/ at the configured base path, like GitHub Pages would. `node scripts/serve.js [port]` */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { ROOT, loadConfig } from './lib/config.js';

const config = loadConfig();
const port = Number(process.argv[2] || 8080);
const dist = path.join(ROOT, 'dist');
const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8' };

createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');
  if (!url.pathname.startsWith(config.basePath)) {
    response.writeHead(302, { location: config.basePath });
    return response.end();
  }
  let file = path.join(dist, decodeURIComponent(url.pathname.slice(config.basePath.length)));
  if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!existsSync(file)) {
    response.writeHead(404, { 'content-type': 'text/plain' });
    return response.end('not found');
  }
  response.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'access-control-allow-origin': '*' });
  createReadStream(file).pipe(response);
}).listen(port, () => console.log(`Serving dist at http://localhost:${port}${config.basePath}`));

// Local equivalent of the edge's route split: ARC serves pages; workerd serves /arc/api/*.
import { createServer, request as upstreamRequest } from 'node:http';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { arcHome } from './runtime.mjs';

const port = Number(process.env.FOMO_WORKER_PORT || 4932);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Invalid local port');
const origin = `http://localhost:${port}`;
const arcPort = Number(process.env.ARC_PORT || 4930);
const mediaRoot = resolve('blocklets/fomo4good/content/media');
const mediaTypes = { '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.ttf':'font/ttf' };
for (const script of ['scripts/build-worker.mjs', 'scripts/dev.mjs']) {
 const result = spawnSync(process.execPath, [script], { stdio: 'inherit', env: process.env });
 if (result.status !== 0) process.exit(result.status || 1);
}
const require = createRequire(resolve(arcHome, 'runtimes/cloudflare/package.json'));
const { Miniflare } = require('miniflare');
const { applyMigrations, collectMigrations } = await import(resolve(arcHome, 'runtimes/cloudflare/scripts/apply-d1-migrations.mjs'));
const common = { compatibilityDate: '2026-09-15', compatibilityFlags: ['nodejs_compat'] };
const mf = new Miniflare({
 host: '127.0.0.1', port: 0,
 durableObjectsPersist: resolve('var/workers/do'),
 d1Persist: resolve('var/workers/d1'), r2Persist: resolve('var/workers/r2'),
 workers: [
  { ...common, name: 'gateway', modules: [{ type: 'ESModule', path: resolve('dist/worker/gateway.mjs') }],
   bindings: { FOMO_ORIGIN: origin }, serviceBindings: { FOMO_PROVIDER: 'fomo-provider' },
   ratelimits: { FOMO_RATE_LIMITER: { simple: { limit: 30, period: 60 } } } },
  { ...common, name: 'fomo-provider', modules: [{ type: 'ESModule', path: resolve('dist/worker/index.mjs') }],
   durableObjects: { FOMO_CAMPAIGN: 'FomoCampaign' }, d1Databases: { FOMO_INDEX: 'fomo-local' }, r2Buckets: { FOMO_OBJECTS: 'fomo-local' },
   bindings: { FOMO_MODE: 'practice', FOMO_ORIGIN: origin, FOMO_OWNER_DID: 'did:abt:fomo-local-worker-owner', FOMO_INSTANCE_DID: 'did:abt:fomo-local-worker-v1' } },
 ],
});
await mf.ready;
await applyMigrations(await mf.getD1Database('FOMO_INDEX', 'fomo-provider'), await collectMigrations({ owner: 'did-space' }));
const server = createServer(async (req, res) => {
 try {
  const url = new URL(req.url, origin);
  // Preserve the local identity when moving its HttpOnly cookie to /arc.
  if (url.pathname === '/api/practice/session' && req.method === 'POST') {
   if (req.headers.origin !== origin) { res.writeHead(403); res.end(); return; }
   const token = /(?:^|;\s*)fomo_practice=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
   res.writeHead(204, token ? { 'Set-Cookie': [
    `fomo_practice=${token}; HttpOnly; SameSite=Strict; Path=/arc/api/practice; Max-Age=31536000`,
    'fomo_practice=; HttpOnly; SameSite=Strict; Path=/api/practice; Max-Age=0',
   ] } : {}); res.end(); return;
  }
  if (url.pathname.startsWith('/arc/api/')) {
   const chunks=[]; let size=0;
   for await (const chunk of req) { size+=chunk.length; if(size>8192){res.writeHead(413);res.end('Request too large');return} chunks.push(chunk); }
   const headers = new Headers();
   for (const [name,value] of Object.entries(req.headers)) if (value && !['host','connection','content-length','transfer-encoding'].includes(name)) headers.set(name,Array.isArray(value)?value.join(', '):value);
   headers.set('CF-Connecting-IP', req.socket.remoteAddress || '127.0.0.1');
   const response = await mf.dispatchFetch(url.href, { method:req.method, headers, ...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)}) });
   res.writeHead(response.status,Object.fromEntries(response.headers));
   res.end(Buffer.from(await response.arrayBuffer()));
  } else if (/^\/media\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(url.pathname) && ['GET','HEAD'].includes(req.method)) {
   const name=decodeURIComponent(url.pathname.slice('/media/'.length));
   try {
    const body=await readFile(resolve(mediaRoot,name));
    res.writeHead(200,{'Content-Type':mediaTypes[extname(name).toLowerCase()] || 'application/octet-stream','Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:body);
   } catch { res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found'); }
  } else {
   const upstream = upstreamRequest({ hostname:'127.0.0.1',port:arcPort,path:req.url,method:req.method,headers:{...req.headers,host:`fomo4good.localhost:${arcPort}`,'accept-encoding':'identity'} }, response=>{
   const headers={...response.headers};
   if(headers.location){const target=new URL(headers.location,`http://fomo4good.localhost:${arcPort}`);if(target.hostname==='fomo4good.localhost')headers.location=target.pathname+target.search+target.hash;}
    if(headers['content-type']?.includes('text/html')) {
     const chunks=[];
     response.on('data',chunk=>chunks.push(chunk));
     response.on('end',()=>{
      const body=Buffer.concat(chunks).toString()
       .replace(/https?:\/\/fomo4good\.(?:com|localhost)(?::[0-9]+)?\/en\//g,origin+'/')
       .replace(/https?:\/\/fomo4good\.(?:com|localhost)(?::[0-9]+)?\/media\//g,origin+'/media/');
      delete headers['content-length'];
      delete headers['content-encoding'];
      delete headers.etag;
      res.writeHead(response.statusCode,headers);res.end(req.method==='HEAD'?undefined:body);
     });
    } else { res.writeHead(response.statusCode,headers);response.pipe(res); }
   });
   upstream.on('error',()=>{if(!res.headersSent)res.writeHead(502);res.end('ARC page runtime unavailable');});
   req.pipe(upstream);
  }
 } catch(error) { console.error(error); if(!res.headersSent)res.writeHead(502);res.end('Local worker unavailable'); }
});
server.on('error',async error=>{console.error(error);await mf.dispose();process.exit(1)});
server.listen(port,'127.0.0.1',()=>console.log(`\nWorker + Provider ready: ${origin}/arc/practice/?lang=zh-Hant\nShared round: 10 minutes; separate browser profiles have separate FUSD balances.\nDID Space persists in var/workers. Ctrl-C stops Workers; ARC pages remain running.\n`));
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{server.close();await mf.dispose();process.exit(0)});

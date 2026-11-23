const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync(require('node:path').join(__dirname,'../service-worker.js'),'utf8');
const handlers={};
const store=new Map();
const operations={deleted:[],put:[]};
const cache={addAll:async paths=>{installedPaths=paths;assert(paths.includes('./index.html'))},match:async request=>store.get(typeof request==='string'?request:request.url),put:async(request,response)=>{operations.put.push(request.url||request);store.set(request.url||request,response)}};
const caches={open:async()=>cache,keys:async()=>['unrelated-cache','ai-wallet-shell-v19','ai-wallet-shell-v20'],delete:async key=>{operations.deleted.push(key)}};
let fetchCount=0;
let installedPaths;
const context={URL,Set,caches,self:{registration:{scope:'https://wallet.example/app/'},location:{origin:'https://wallet.example'},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},clients:{}};
context.fetch=async()=>{fetchCount++;return {ok:true,type:'basic',clone(){return this}}};
vm.runInNewContext(src,context);
function request(url,mode='same-origin',headers={has:()=>false}){return {url,method:'GET',mode,headers}}
async function runFetch(r){let result;handlers.fetch({request:r,respondWith:p=>result=p});return result&&await result}
(async()=>{
 let activate;handlers.activate({waitUntil:p=>activate=p});await activate;
 assert.deepEqual(operations.deleted,['ai-wallet-shell-v19','ai-wallet-shell-v20'],'never delete unrelated caches');
 await runFetch(request('https://wallet.example/app/src/app.js'));
 assert.equal(fetchCount,1);
 await runFetch(request('https://wallet.example/app/src/app.js'));
 assert.equal(fetchCount,1,'static assets should reuse cache');
 await runFetch(request('https://wallet.example/app/index.html','navigate'));
 assert.equal(fetchCount,2,'navigation must check for updates');
 assert.equal(await runFetch(request('https://wallet.example/app/private.json')),undefined);
 assert.equal(await runFetch(request('https://wallet.example/app/index.html?token=secret')),undefined);
 assert.equal(await runFetch(request('https://outside.example/app/index.html')),undefined);
 assert.equal(fetchCount,2,'sensitive and out-of-scope requests must bypass service worker');
 const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
 let install;handlers.install({waitUntil:p=>install=p});await install;
 context.fetch=async()=>{throw Error('Offline')};
 for(const rel of [...html.matchAll(/href="([^"]+\?v=\d+)"/g)].map(match=>match[1])){
  assert(installedPaths.includes('./'+rel),'HTML asset version must be precached');
  const url='https://wallet.example/app/'+rel;
  const cached={asset:rel};store.set(url,cached);
  assert.equal(await runFetch(request(url)),cached);
  assert.equal(await runFetch(request(url+'&token=private')),undefined);
 }
 assert.equal(await runFetch(request('https://wallet.example/app/src/app.js','same-origin',{has:name=>name==='authorization'})),undefined);
 console.log('Offline cache tests passed');
})().catch(e=>{console.error(e);process.exitCode=1});

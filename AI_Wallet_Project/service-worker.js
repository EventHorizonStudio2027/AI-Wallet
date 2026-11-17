/* AI Wallet offline shell. Wallet records are never written to Cache Storage. */
const CACHE_PREFIX='ai-wallet-shell-';
const CACHE=CACHE_PREFIX+'domain-v48';
const SHELL=['./','./index.html','./styles/app.css','./src/app.js','./src/modules/creator.js','./src/modules/revenue-planning.js','./src/modules/reconciliation-review.js','./src/modules/payout-import.js','./src/modules/data-health.js','./src/modules/collections.js','./src/modules/intelligence.js','./src/modules/billing.js','./src/modules/reminders.js','./src/modules/payment-forecast.js','./src/modules/trial-timeline.js','./src/modules/attention.js','./src/modules/calendar-export.js','./src/modules/subscription-audit.js','./src/modules/analytics.js','./src/modules/memory.js','./src/modules/accounts.js','./src/modules/files.js','./src/modules/storage.js','./src/modules/backup.js','./src/modules/file-safety.js','./src/modules/events.js','./manifest.webmanifest','./assets/ai-wallet-icon.svg'];
const SHELL_PATHS=new Set(SHELL.map(path=>new URL(path,self.registration.scope).pathname));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||request.headers.has('authorization'))return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||!SHELL_PATHS.has(url.pathname)||url.search)return;
 const isNavigation=request.mode==='navigate';
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(isNavigation){
   try{const response=await fetch(request);if(response.ok&&response.type==='basic')await cache.put(request,response.clone());return response}
   catch(error){const fallback=await cache.match(request)||await cache.match('./index.html');if(fallback)return fallback;throw error}
  }
  try{
   const response=await fetch(request,{cache:'no-cache'});
   if(response.ok&&response.type==='basic')await cache.put(request,response.clone());
   return response;
  }catch(error){const cached=await cache.match(request);if(cached)return cached;throw error}
 })());
});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(async windows=>{for(const client of windows){if(client.url.startsWith(self.registration.scope)){await client.focus();return}}return clients.openWindow('./')}));});

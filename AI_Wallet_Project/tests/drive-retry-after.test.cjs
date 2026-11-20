'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../src/modules/drive-sync.js'),'utf8');
async function verify(header,expected){
 const waits=[];let calls=0;
 const context={window:{},Headers,Blob,URLSearchParams,encodeURIComponent,setTimeout:(fn,ms)=>{waits.push(ms);fn()},fetch:async()=>{calls++;return calls===1?{ok:false,status:503,headers:new Headers(header===null?{}:{'Retry-After':header})}:{ok:true,json:async()=>({files:[]})}}};
 vm.runInNewContext(source,context);
 await context.window.AIWalletModules.driveSync.listBackups('token');
 assert.equal(calls,2);
 assert.equal(waits[0],expected);
}
(async()=>{await verify(null,250);await verify('1',1000);await verify('not-a-number',250);await verify('100',2000);console.log('Drive retry pacing checks passed')})().catch(error=>{console.error(error);process.exitCode=1});

'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../src/modules/drive-sync.js'),'utf8');
(async()=>{
 let canceled=false;
 const context={window:{},Headers,Blob,URLSearchParams,encodeURIComponent,setTimeout,fetch:async()=>({ok:true,headers:new Headers({'Content-Length':String(1024*1024*1024+1)}),body:{cancel:async()=>{canceled=true}},blob:async()=>{throw Error('Oversized content must never be buffered')}})};
 vm.runInNewContext(source,context);
 const download=context.window.AIWalletModules.driveSync.download;
 await assert.rejects(download('token','abcde'),/exceeds the allowed size/);
 assert.equal(canceled,true);
 await assert.rejects(download('token','abcde',Infinity),/Invalid download size limit/);
 console.log('Drive default download limit regression checks passed');
})().catch(error=>{console.error(error);process.exitCode=1});

'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../src/modules/drive-sync.js'),'utf8');
async function run(){
 let canceled=false;
 const context={window:{},Headers,Blob,URLSearchParams,encodeURIComponent,setTimeout,fetch:async()=>({ok:true,headers:new Headers({'Content-Type':'text/plain'}),body:{getReader:()=>{let n=0;return {read:async()=>n++===0?{done:false,value:new Uint8Array(7)}:{done:false,value:new Uint8Array(7)},cancel:async()=>{canceled=true}}}},blob:async()=>{throw Error('Should stream')}})};
 vm.runInNewContext(source,context);
 await assert.rejects(context.window.AIWalletModules.driveSync.download('token','abcdef',10),/exceeds the allowed size/);
 assert.equal(canceled,true,'reader should be canceled after limit exceeded');
 let count=0;
 context.fetch=async()=>({ok:true,headers:new Headers({'Content-Type':'text/plain'}),body:{getReader:()=>({read:async()=>++count===1?{done:false,value:new Uint8Array([1,2,3])}:{done:true},cancel:async()=>{}})}});
 const blob=await context.window.AIWalletModules.driveSync.download('token','abcdef',10);
 assert.equal(blob.size,3);
 console.log('Drive streaming size limit checks passed');
}
run().catch(error=>{console.error(error);process.exitCode=1});

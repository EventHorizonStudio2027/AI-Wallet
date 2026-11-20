'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../src/modules/drive-sync.js'),'utf8');
async function run(){
 let canceled=false,read=false;
 const context={window:{},Headers,Blob,URLSearchParams,encodeURIComponent,setTimeout,fetch:async()=>({ok:true,headers:new Headers({'Content-Length':'5000'}),body:{cancel:async()=>{canceled=true},getReader:()=>{read=true;throw Error('Must not read oversized response')}},blob:async()=>{throw Error('Must not buffer oversized response')}})};
 vm.runInNewContext(source,context);
 await assert.rejects(context.window.AIWalletModules.driveSync.download('token','abcde',10),/exceeds the allowed size/);
 assert.equal(canceled,true,'oversized stream should be canceled');
 assert.equal(read,false,'oversized stream should not be read');
 console.log('Drive Content-Length early rejection checks passed');
}
run().catch(error=>{console.error(error);process.exitCode=1});

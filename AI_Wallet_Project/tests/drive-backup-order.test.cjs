'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../src/modules/drive-sync.js'),'utf8');
async function run(){
 const older={id:'backupold',name:'domain-backup-2026-11-01T00-00-00Z.json',createdTime:'2026-11-01T00:00:00Z'};
 const newer={id:'backupnew',name:'domain-backup-2026-11-20T00-00-00Z.json',createdTime:'2026-11-20T00:00:00Z'};
 const context={window:{},Headers,Blob,URLSearchParams,encodeURIComponent,setTimeout,fetch:async()=>({ok:true,json:async()=>({files:[older,newer,older]})})};
 vm.runInNewContext(source,context);
 const result=await context.window.AIWalletModules.driveSync.listBackups('token');
 assert.equal(result.files.length,2,'duplicate backups must not be shown');
 assert.equal(result.files[0].id,'backupnew','newest recovery copy should appear first');
 assert.equal(result.files[1].id,'backupold');
 console.log('Drive backup ordering and deduplication checks passed');
}
run().catch(error=>{console.error(error);process.exitCode=1});

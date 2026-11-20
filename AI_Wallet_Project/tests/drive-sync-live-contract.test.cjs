'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../src/modules/drive-sync.js'),'utf8');
let replies=[];
const context={
 window:{},Headers,URLSearchParams,Blob,URL,Math,Number,Set,Map,Promise,
 fetch:async(url)=>{assert.ok(replies.length,'unexpected network request');return replies.shift()(String(url))},
 setTimeout:(fn)=>fn()
};
vm.runInNewContext(source,context,{filename:'drive-sync.js'});
const api=context.window.AIWalletModules.driveSync;
const json=(value)=>({ok:true,json:async()=>value,headers:new Headers()});
const item=(id,checksum='a')=>({id,name:'file',mimeType:'image/png',modifiedTime:'2026-11-19T00:00:00Z',md5Checksum:checksum});
(async()=>{
 const previous=[{sourceKey:'google-drive:file001',modifiedTime:'2026-11-19T00:00:00Z',checksum:'a'}];
 const plan=api.planIncrementalSync([item('file001','b'),item('file002')],previous);
 assert.equal(plan.changed.length,1,'checksum-only change must import');
 assert.equal(plan.added.length,1);
 const duplicatePlan=api.planIncrementalSync([item('file002'),item('file002')],[]);
 assert.equal(duplicatePlan.added.length,1,'duplicate remote IDs must be imported once');
 const unchangedPlan=api.planIncrementalSync([item('file001','a')],previous);
 assert.equal(unchangedPlan.unchanged.length,1,'unchanged file must not be downloaded');
 replies=[()=>json({files:[item('file001')],nextPageToken:'same'}),()=>json({files:[],nextPageToken:'same'})];
 await assert.rejects(api.listAllFolderFiles('token','folder123'),/pagination did not advance/);
 replies=[()=>json({files:[item('file001')],nextPageToken:'page2'}),()=>json({files:[item('file001'),item('file002')]})];
 const unique=await api.listAllFolderFiles('token','folder123');
 assert.equal(unique.length,2,'duplicate file IDs across pages must be collapsed');
 replies=[()=>json({files:[{id:'bad id'}]})];
 await assert.rejects(api.listAllFolderFiles('token','folder123'),/Malformed Google Drive file entry/);
 replies=[()=>({ok:true,headers:new Headers({'Content-Length':'200'}),blob:async()=>new Blob(['x'])})];
 await assert.rejects(api.download('token','file001',100),/exceeds the allowed size/);
 replies=[()=>({ok:true,headers:new Headers(),blob:async()=>new Blob(['oversized'])})];
 await assert.rejects(api.download('token','file001',3),/exceeds the allowed size/);
 replies=[()=>({ok:false,status:401,headers:new Headers()})];
 await assert.rejects(api.listFolder('token','folder123'),/session expired or was revoked/);
 replies=[()=>({ok:false,status:403,headers:new Headers()})];
 await assert.rejects(api.listFolder('token','folder123'),/access denied/);
 replies=[()=>({ok:false,status:404,headers:new Headers()})];
 await assert.rejects(api.listFolder('token','folder123'),/file or folder not found/);
 assert.equal(replies.length,0);
 console.log('Drive connector contract tests passed');
})().catch(error=>{console.error(error);process.exitCode=1});

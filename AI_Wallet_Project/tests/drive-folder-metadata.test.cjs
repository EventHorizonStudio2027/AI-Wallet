'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../src/modules/drive-sync.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const app=fs.readFileSync(path.join(__dirname,'../src/app.js'),'utf8');
assert.match(source,/Malformed Google Drive file name/);
assert.match(source,/Malformed Google Drive file type/);
assert.match(html,/Export Google Docs, Sheets and Slides to standard files first/);
assert.match(app,/Google Docs\/Sheets\/Slides require export before import/);
const vm=require('node:vm');
const folderId='folder123';
(async()=>{
 let metadata={id:folderId,mimeType:'application/vnd.google-apps.folder',trashed:false};
 const context={window:{},Headers,fetch:async url=>{
  assert.equal(url,'https://www.googleapis.com/drive/v3/files/folder123?fields=id,mimeType,trashed');
  return {ok:true,json:async()=>metadata};
 }};
 vm.runInNewContext(source,context);
 const {checkFolder}=context.window.AIWalletModules.driveSync;
 await checkFolder('token',folderId);
 for(const unexpected of [{mimeType:'application/pdf'},{trashed:true},{id:'other123'}]){
  metadata={id:folderId,mimeType:'application/vnd.google-apps.folder',trashed:false,...unexpected};
  await assert.rejects(checkFolder('token',folderId),/Select an accessible Google Drive folder/);
 }
 console.log('Drive folder metadata and import guidance checks passed');
})().catch(error=>{console.error(error);process.exitCode=1});

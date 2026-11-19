const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const calls=[];
class HeadersMock{constructor(values={}){this.values={...values}}set(key,value){this.values[key]=value}}
class BlobMock{constructor(parts=[],options={}){this.parts=parts;this.size=parts.reduce((n,p)=>n+(typeof p==='string'?Buffer.byteLength(p):p.size||0),0);this.type=options.type||''}}
const responses=[
 {files:[{id:'abc123',name:'image.png',mimeType:'image/png',size:'8'},{id:'folder1',name:'nested',mimeType:'application/vnd.google-apps.folder'}],nextPageToken:'next'},
 {files:[{id:'xyz789',name:'video.mp4',mimeType:'video/mp4',size:'5'}]},
 {id:'backup123',name:'domain-backup-2026-11-18T10-00-00-000Z.json'}
];
const context={window:{},Headers:HeadersMock,Blob:BlobMock,URLSearchParams,Math,fetch:async(url,options)=>{calls.push({url:String(url),options});return {ok:true,json:async()=>responses.shift(),blob:async()=>new BlobMock(['video'])}}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/modules/drive-sync.js'),'utf8'),context);
(async()=>{
 const drive=context.window.AIWalletModules.driveSync;
 assert.match(drive.SCOPES,/drive\.readonly/);
 assert.match(drive.SCOPES,/drive\.appdata/);
 const files=await drive.listAllFolderFiles('test-token','folder123');
 assert.equal(files.length,2);
 assert.match(calls[1].url,/pageToken=next/);
 assert.equal(calls[0].options.headers.values.Authorization,'Bearer test-token');
 await assert.rejects(()=>drive.listFolder('test-token','bad!'),/Invalid/);
 const backup=await drive.uploadBackup('test-token',new BlobMock(['{}']),'domain-backup-2026-11-18T10-00-00-000Z.json');
 assert.equal(backup.id,'backup123');
 assert.match(calls[2].url,/uploadType=multipart/);
 assert.equal(calls[2].options.method,'POST');
 assert.equal(calls[2].options.headers.values.Authorization,'Bearer test-token');
 console.log('DomAIn Google Drive sync API tests passed');
})().catch(e=>{console.error(e);process.exitCode=1});

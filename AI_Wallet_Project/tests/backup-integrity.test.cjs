const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../src/modules/backup.js'),'utf8'),context);
const b=context.window.AIWalletModules.backup;
const sample={schemaVersion:7,services:[],accounts:[],files:[{id:'a',name:'report.txt',data:'data:text/plain;base64,SGVsbG8='}]};
assert.equal(b.validateBackup(sample).fileCount,1);
assert.equal(b.decodedLength(sample.files[0].data),5);
assert.throws(()=>b.validateBackup({...sample,files:[sample.files[0],sample.files[0]]}),/duplicate/);
assert.throws(()=>b.validateBackup({...sample,files:[{id:'a',name:'x',data:'data:text/plain;base64,SGVsbG8'}]}),/Malformed|Invalid file data/);
assert.throws(()=>b.validateBackup({...sample,files:[{id:'a',name:' ',data:null}]}),/name/);
assert.throws(()=>b.validateBackup({...sample,accounts:null}),/accounts/);
assert.throws(()=>b.assertBackupSize(100*1024*1024+1),/limit/);
assert.equal(b.assertBackupSize(100),100);
console.log('Backup integrity tests passed');

assert.throws(()=>b.validateBackup({...sample,services:Array(501).fill({})}),/services/);
assert.throws(()=>b.validateBackup({...sample,accounts:Array(5001).fill({})}),/accounts/);
assert.throws(()=>b.validateBackup({...sample,files:[{id:'a',name:'x',data:'data:text/plain;base64,SGVsbG8==='}]}),/data/);
assert.throws(()=>b.validateBackup({...sample,files:[{id:'a',name:'x',size:-1,data:null}]}),/size/);
assert.equal(b.isBase64DataUrl('data:text/plain;base64,SGVsbG8='),true);
assert.equal(b.isBase64DataUrl('data:text/plain;base64,SGVsbG8==='),false);

// Reject ambiguous base64 and metadata that would silently corrupt restored files.
assert.throws(()=>b.validateBackup({...sample,files:[{id:'a',name:'x',size:6,data:'data:text/plain;base64,SGVsbG8='}]}),/does not match/);
assert.throws(()=>b.validateBackup({...sample,files:[{id:'a',name:'x',data:'data:text/plain;base64,SGVsbG9='}]}),/Non-canonical/);
assert.throws(()=>b.validateBackup({...sample,accounts:[{id:'same'},{id:'same'}]}),/duplicate accounts/);
assert.throws(()=>b.validateBackup({...sample,services:[{id:'s'},{id:'s'}]}),/duplicate services/);
assert.throws(()=>b.validateBackup({...sample,folders:[{id:'f'},{id:'f'}]}),/duplicate folders/);
assert.throws(()=>b.validateBackup({...sample,accounts:[null]}),/accounts identifier/);
assert.equal(b.validateBackup({...sample,files:[{id:'a',name:'x',size:5,data:'data:text/plain;base64,SGVsbG8='}]}).fileCount,1);

// v25: prevent unsafe IDs, inconsistent sizes and cumulative decompressed payload abuse.
assert.throws(()=>b.validateBackup({...sample,files:[{id:'../bad',name:'x',data:null}]}),/file entry/);
assert.throws(()=>b.validateBackup({...sample,files:[{id:'a',name:'x',size:'5',data:'data:text/plain;base64,SGVsbG8='}]}),/file size/);
assert.throws(()=>b.validateBackup({...sample,files:[{id:'a',name:'x',size:1.5,data:null}]}),/file size/);
assert.equal(b.validateBackup(sample).totalDecodedBytes,5);
assert.throws(()=>b.validateBackup({...sample,files:[{id:'a',name:'x',size:0,data:'data:text/plain;base64,SGVsbG8='}]}),/does not match/);

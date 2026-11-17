'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const context={window:{},Date,Set,Map,Number};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/modules/backup.js'),'utf8'),context,{filename:'backup.js'});
const backup=context.window.AIWalletModules.backup;
const valid=()=>({
 schemaVersion:7,
 services:[{id:'service1',name:'Service'}],
 accounts:[{id:'account1',serviceId:'service1'}],
 folders:[{id:'folder1',name:'Folder'}],
 files:[{id:'file1',name:'note.txt',size:3,serviceId:'service1',accountId:'account1',folderId:'folder1',data:'data:text/plain;base64,YWJj'}]
});
assert.equal(backup.validateBackup(valid()).totalDecodedBytes,3);
assert.equal(backup.validateBackup(valid()).fileCount,1);
assert.throws(()=>backup.validateBackup({...valid(),files:[null]}),/Invalid file record/);
assert.throws(()=>backup.validateBackup({...valid(),files:[42]}),/Invalid file record/);
assert.throws(()=>backup.validateBackup({...valid(),files:[[]]}),/Invalid file record/);
assert.throws(()=>backup.validateBackup({...valid(),files:[{...valid().files[0],data:'data:text/plain;base64,YWJk',size:2}]}),/File size does not match/);
assert.throws(()=>backup.validateBackup({...valid(),files:[{...valid().files[0],folderId:'lost'}]}),/missing folder/);
assert.throws(()=>backup.validateBackup({...valid(),files:[{...valid().files[0],accountId:'lost'}]}),/missing account/);
assert.throws(()=>backup.validateBackup({...valid(),files:[{...valid().files[0],serviceId:'lost'}]}),/missing service/);
assert.throws(()=>backup.validateBackup({...valid(),files:[valid().files[0],valid().files[0]]}),/duplicate file/);
assert.equal(backup.createEnvelope(valid()).files.length,0);
console.log('DomAIn backup validation behavior tests passed.');

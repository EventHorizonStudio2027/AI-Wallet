const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const window={AIWalletModules:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/modules/files.js'),'utf8'),{window});
const files=window.AIWalletModules.files;
const sample=[
 {id:'a',name:'image.png',category:'Images',source:'manual-import',storageMode:'local',checksum:'abc123',added:1},
 {id:'b',name:'clip.mp4',category:'Videos',source:'cloud-link',storageMode:'remote',checksum:'def456',added:2}
];
assert.equal(files.filterAndSort(sample,{query:'manual-import'}).length,1,'Provenance search must find manual imports');
assert.equal(files.filterAndSort(sample,{query:'remote'}).length,1,'Storage-mode search must find remote files');
assert.equal(files.filterAndSort(sample,{query:'abc123'})[0].id,'a','Checksum search must find a matching file');
assert.equal(files.filterAndSort(sample,{query:'clip'})[0].id,'b','Filename search must continue to work');
assert.equal(files.filterAndSort(sample,{provider:'missing'}).length,0,'Provider filter must remain effective');
assert.equal(files.storageStatus(sample[0]),'local','Manual import is local');
assert.equal(files.storageStatus(sample[1]),'linked','Remote file status must be explicit');
assert.equal(files.storageStatus({storageMode:'backup'}),'backup','Backed-up files must be distinguishable');
assert.equal(files.storageStatus({}),'local','Legacy file records remain local');
assert.equal(files.filterAndSort(sample,{storage:'local'}).length,1,'Storage filter selects local files');
assert.equal(files.filterAndSort(sample,{storage:'linked'}).length,1,'Storage filter selects linked files');
assert.equal(files.filterAndSort(sample,{storage:'backup'}).length,0,'Storage filter shows no nonexistent backups');
console.log('DomAIn media provenance search checks passed');

'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../src/app.js'),'utf8');
assert.match(source,/if\(migrated&&!save\(\)\)throw Error\('Could not persist migrated file metadata'\)/,'Legacy file migration must not ignore metadata save errors');
assert.match(source,/document\.body\.appendChild\(a\);a\.click\(\);a\.remove\(\)/,'File download must attach and clean up its anchor');
assert.match(source,/if\(w\)w\.opener=null/,'Preview tabs must not access the opener');
for(const action of ['editfile','preview','download','removefile']){
 assert.ok(source.includes('data-'+action+'="${esc(f.id)}"'),'File action must escape '+action+' identifier');
}
assert.match(source,/if\(fileUploadBusy\|\|window\._walletImportBusy\)/,'Overlapping upload and restore must be blocked');
assert.match(source,/state\.files\.length\+files\.length>10000/,'File count must be limited');
assert.match(source,/files\.some\(f=>!f\|\|!Number\.isFinite\(f\.size\)/,'File size validation must run before storage');
assert.match(source,/for\(let key of stored\)try\{await deleteFileBlob\(key\)\}/,'Partial uploads must be rolled back');
assert.match(source,/finally\{\s*fileUploadBusy=false/,'Busy flag must always be cleared');
assert.match(source,/for\(const \[file,data\] of legacyPayloads\)file\.data=data/,'Failed legacy migration must retain in-memory payloads');
assert.match(source,/if\(window\._walletImportBusy\|\|fileUploadBusy\)\{toast\('Wait for file operations to finish before resetting'\)/,'Reset must wait for file operations');
console.log('DomAIn file workflow regression checks passed.');

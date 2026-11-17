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
console.log('DomAIn file workflow regression checks passed.');

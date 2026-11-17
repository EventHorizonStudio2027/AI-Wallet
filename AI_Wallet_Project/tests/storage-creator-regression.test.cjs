'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const context={window:{},Date,Number,Set,Map,console};
vm.createContext(context);
for(const file of ['creator.js','files.js','storage.js']){
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/modules',file),'utf8'),context,{filename:file});
}
const {creator,files}=context.window.AIWalletModules;
assert.equal(creator.normalize({goal:true}).goal,0,'Boolean must not count as revenue');
assert.equal(creator.normalize({goal:'not-a-number'}).goal,0);
assert.equal(creator.normalize({goal:1e12}).goal,0,'Unreasonable values must not overflow totals');
assert.equal(creator.normalize({goal:1.005}).goal,1.01,'Currency must round to cents');
assert.equal(creator.monthlyRecurring([{status:'active',cadence:'monthly',amount:'invalid'}]),0);
assert.equal(creator.monthlyRecurring([{status:'active',cadence:'yearly',amount:120},{status:'paused',cadence:'monthly',amount:500}]),10);
assert.equal(creator.report({goal:1000,agreements:[],payouts:[{id:'p1',amount:99.99,dueDate:'2026-11-01',status:'received'},{id:'p2',amount:20,dueDate:'2026-11-22',status:'pending'}]},'2026-11-17').expected,119.99);
assert.equal(files.category('photo.HEIC'),'Images');
assert.equal(files.category('script.tsx'),'Code');
assert.equal(files.category('document.pdf'),'Documents');
assert.equal(files.filterAndSort([{name:'b',added:1},{name:'a',added:2}],{sort:'name'})[0].name,'a');
const storageSource=fs.readFileSync(path.join(__dirname,'../src/modules/storage.js'),'utf8');
assert.match(storageSource,/tx\.oncomplete=\(\)=>resolve\(rows\)/,'Usage reads must await transaction completion');
assert.match(storageSource,/tx\.onabort=\(\)=>reject\(tx\.error\|\|new Error\('Usage history read aborted'\)\)/);
console.log('DomAIn creator-income, file-library and storage regression tests passed.');

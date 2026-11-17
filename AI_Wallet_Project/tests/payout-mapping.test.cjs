const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const window={};vm.runInNewContext(fs.readFileSync('src/modules/payout-import.js','utf8'),{window});const m=window.AIWalletModules.payoutImport;
const csv='Brand,USD,Pay Day,State,Txn\nAcme,12.50,2026-11-25,received,abc\nAcme,12.50,2026-11-25,received,\nAcme,12.50,2026-11-25,received,\n';
const mapping={client:'Brand',amount:'USD',dueDate:'Pay Day',status:'State',reference:'Txn'};
const r=m.preview(csv,[],{mapping,rejectUnreferencedDuplicates:true});assert.equal(r.accepted.length,2);assert.equal(r.duplicates.length,1);
assert.throws(()=>m.preview(csv,[],{mapping:{...mapping,amount:'Brand'}}),/multiple fields/);
assert.throws(()=>m.preview(csv,[],{mapping:{...mapping,amount:'Unknown'}}),/Invalid column mapping/);
assert.equal(m.preview(csv,[],{mapping}).accepted.length,3);
console.log('Payout mapping and cautious deduplication tests passed');

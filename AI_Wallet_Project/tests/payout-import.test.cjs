const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const window={};vm.runInNewContext(fs.readFileSync('src/modules/payout-import.js','utf8'),{window});
const m=window.AIWalletModules.payoutImport;
const csv='client,amount,dueDate,status,reference\r\n"Acme, Inc.",125.50,2026-11-30,received,TX1\r\nB,20,2026-11-28,pending,TX2\r\nC,12.345,2026-11-28,pending,TX3\r\nD,20,2026-02-30,received,TX4\r\nE,20,2026-11-28,received,tx1\r\n';
let r=m.preview(csv,[{reference:'tx2'}]);
assert.equal(r.total,5);assert.equal(r.accepted.length,1);assert.equal(r.accepted[0].client,'Acme, Inc.');assert.equal(r.accepted[0].amount,125.5);
assert.equal(r.duplicates.length,2);assert.equal(r.rejected.length,2);
assert.throws(()=>m.preview('client,amount\nA,2',[]),/Required CSV/);
assert.throws(()=>m.parseCSV('a,"bad'),/Unterminated/);
assert.throws(()=>m.parseCSV('x'.repeat(1048577)),/1 MB/);
assert.equal(m.preview('client,amount,dueDate,status\nA,2,2026-12-01,pending',[]).accepted.length,1);
assert.equal(m.preview('client,amount,dueDate,status\nA,=2+2,2026-12-01,pending',[]).rejected.length,1);
console.log('Payout CSV import tests passed');

const currency=m.preview('client,amount,dueDate,status,reference,currency\nA,10,2026-12-01,pending,FX1,EUR\nB,10,2026-12-01,pending,,USD',[]);
assert.equal(currency.rejected.length,1);assert.equal(currency.accepted.length,1);assert.equal(currency.unreferenced,1);

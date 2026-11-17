const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const window={};vm.runInNewContext(fs.readFileSync('src/modules/data-health.js','utf8'),{window});
const inspect=window.AIWalletModules.dataHealth.inspect;
let s={services:[{id:'s'}],accounts:[{id:'a',serviceId:'s'}],files:[{id:'f',accountId:'a',folderId:'x'}],folders:[],creator:{payouts:[{id:'p1',amount:25,status:'received',reference:'TX'},{id:'p2',amount:0,status:'received',reference:'tx'}]}};
let r=inspect(s);assert.equal(r.counts.error,1);assert.equal(r.counts.warning,2);assert.equal(r.counts.info,0);
assert.equal(inspect({services:[],accounts:[],files:[],folders:[],creator:{payouts:[]}}).issues.length,0);
assert.equal(inspect(null).counts.error,1);
console.log('Data health tests passed');

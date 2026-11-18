'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const window={AIWalletModules:{}};
const context=vm.createContext({window,Date,Number,Math,Set});
for(const name of ['billing','trial-timeline','payment-forecast','attention']){
 const code=fs.readFileSync(path.join(__dirname,'../src/modules',name+'.js'),'utf8');
 vm.runInContext(code,context,{filename:name+'.js'});
}
const accounts=[
 {id:'trial',label:'Trial',trialEnabled:true,trialStatus:'active',trialStart:'2026-11-01',trialEnd:'2026-11-20',cancelBy:'2026-11-22',trialDays:7,billingCycle:'never'},
 {id:'renew',label:'Renewal',billingCycle:'monthly',renewalDate:'2026-11-25',cost:19,trialEnabled:false}
];
const report=window.AIWalletModules.attention.overview(accounts,'2026-11-18');
assert.ok(report.rows.some(r=>r.accountId==='trial'&&r.kind==='review'&&r.message.includes('Trial dates need review')),'Inconsistent trial dates must appear in attention feed');
assert.ok(report.rows.some(r=>r.accountId==='renew'&&r.kind==='payment'&&r.amount===19),'Upcoming renewal must appear');
assert.ok(report.projected30>=19,'30-day forecast should include renewal');
assert.ok(!report.rows.some(r=>r.kind==='payment'&&r.days<0),'Past payments must not appear');
console.log('DomAIn attention regressions passed');

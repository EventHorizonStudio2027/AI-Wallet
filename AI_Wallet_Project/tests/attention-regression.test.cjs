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
assert.ok(report.rows.some(r=>r.accountId==='trial'&&r.kind==='review'&&r.message.includes('Trial details need review')),'Inconsistent trial dates must appear in attention feed');
assert.ok(report.rows.some(r=>r.accountId==='renew'&&r.kind==='payment'&&r.amount===19),'Upcoming renewal must appear');
assert.ok(report.projected30>=19,'30-day forecast should include renewal');
assert.ok(!report.rows.some(r=>r.kind==='payment'&&r.days<0),'Past payments must not appear');
const missing={id:'missing',label:'Missing deadline',trialEnabled:true,trialStatus:'active',trialEnd:'2026-11-25',cancelBy:'',billingCycle:'never'};
const missingReport=window.AIWalletModules.attention.overview([missing],'2026-11-18');
assert.equal(missingReport.rows.filter(r=>r.accountId==='missing'&&r.kind==='review').length,1,'Missing cancel-by date should create exactly one review item');
assert.ok(missingReport.rows[0].message.includes('Cancellation deadline missing'),'Missing deadline must be explained');
const far={id:'far',label:'Far trial',trialEnabled:true,trialStatus:'active',trialStart:'2026-11-01',trialEnd:'2027-01-15',cancelBy:'2027-01-10',trialDays:75,billingCycle:'never'};
const farReport=window.AIWalletModules.attention.overview([far],'2026-11-18');
assert.equal(farReport.rows.length,0,'Valid distant trials should not clutter the urgent dashboard');
const overdue={id:'overdue',label:'Overdue',trialEnabled:true,trialStatus:'active',trialEnd:'2026-11-17',cancelBy:'2026-11-16',billingCycle:'never'};
const overdueReport=window.AIWalletModules.attention.overview([overdue],'2026-11-18');
assert.ok(overdueReport.rows.some(r=>r.kind==='trial'&&r.days<0),'Past cancellation deadlines must remain visible until status is reviewed');
const early={id:'early',label:'Early warning',trialEnabled:true,trialStatus:'active',trialEnd:'2026-12-10',cancelBy:'2026-12-08',alertDays:30,billingCycle:'never'};
const earlyReport=window.AIWalletModules.attention.overview([early],'2026-11-18');
assert.ok(earlyReport.rows.some(r=>r.kind==='trial'&&r.days===20),'Custom 30-day cancellation lead time must surface early alerts');
const defaultReport=window.AIWalletModules.attention.overview([{...early,alertDays:7}],'2026-11-18');
assert.ok(!defaultReport.rows.some(r=>r.kind==='trial'),'Default warning window should not show distant deadlines');
const missingEndingSoon={id:'soonend',label:'Ends soon',trialEnabled:true,trialStatus:'active',trialEnd:'2026-11-19',cancelBy:'',billingCycle:'never'};
const soonReport=window.AIWalletModules.attention.overview([missingEndingSoon],'2026-11-18');
assert.ok(soonReport.rows.some(r=>r.kind==='trial_end'&&r.days===1),'Missing cancel-by date must not hide imminent trial end');
assert.ok(soonReport.rows.some(r=>r.kind==='review'),'Unknown cancellation deadline must still trigger review');
console.log('DomAIn attention regressions passed');

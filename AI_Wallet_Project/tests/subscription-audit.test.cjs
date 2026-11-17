const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const window={};vm.runInNewContext(fs.readFileSync('src/modules/subscription-audit.js','utf8'),{window,Date});const audit=window.AIWalletModules.subscriptionAudit.audit;
let result=audit([{id:'a',label:'Trial',trialEnabled:true,trialStatus:'active',trialStart:'2026-11-01',trialDays:14,trialEnd:'2026-11-15',cancelBy:'2026-11-16'},{id:'b',label:'Paid',cost:20,billingCycle:'monthly',renewalDate:''}], '2026-11-17');
assert.equal(result.critical,2);assert.equal(result.warning,1);assert(result.issues.some(x=>x.code==='cancel_after_end'));assert(result.issues.some(x=>x.code==='trial_expired_unconfirmed'));
assert.equal(audit([{id:'c',trialEnabled:true,trialStatus:'cancelled',billingCycle:'free'}],'2026-11-17').issues.length,0);
assert.throws(()=>audit([],'2026-02-30'),/Invalid audit date/);
console.log('Subscription audit tests passed');

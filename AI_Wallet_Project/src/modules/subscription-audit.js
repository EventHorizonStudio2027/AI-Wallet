(function(global){
'use strict';
function date(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return null;const d=new Date(v+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v?d:null}
function audit(accounts,today){const now=date(today);if(!now)throw Error('Invalid audit date');const issues=[];
 for(const a of Array.isArray(accounts)?accounts:[]){if(!a||!a.id)continue;const name=String(a.label||'Unnamed account');const push=(code,severity,message)=>issues.push({accountId:String(a.id),name,code,severity,message});
  if(a.trialEnabled&&a.trialStatus==='active'){
   const start=date(a.trialStart),end=date(a.trialEnd),cancel=date(a.cancelBy);
   if(!end)push('trial_end_missing','critical','Active trial has no valid end date');
   if(!cancel)push('cancel_deadline_missing','critical','Active trial has no valid cancellation deadline');
   if(start&&end&&start>end)push('trial_dates_reversed','critical','Trial starts after its end date');
   if(end&&cancel&&cancel>end)push('cancel_after_end','critical','Cancellation deadline is after trial expiration; verify provider terms');
   if(start&&end&&Number.isInteger(Number(a.trialDays))&&Number(a.trialDays)>0&&Math.abs(Math.round((end-start)/86400000)-Number(a.trialDays))>1)push('trial_length_mismatch','warning','Trial duration does not match entered dates');
   if(end&&end<now)push('trial_expired_unconfirmed','critical','Trial end date passed; confirm whether billing started');
  }
  if(a.billingCycle!=='free'&&a.billingCycle!=='one-time'&&Number(a.cost)>0&&!(a.trialEnabled&&a.trialStatus==='active')){
   const renewal=date(a.renewalDate);
   if(!renewal)push('renewal_missing','warning','Paid subscription has no valid next renewal date');
   else if(renewal<now)push('renewal_past','warning','Renewal date is in the past; confirm payment and update schedule');
  }
 }
 return {issues,critical:issues.filter(x=>x.severity==='critical').length,warning:issues.filter(x=>x.severity==='warning').length};}
 global.AIWalletModules=global.AIWalletModules||{};global.AIWalletModules.subscriptionAudit=Object.freeze({audit});
})(window);

(function(global){
'use strict';
const billing=global.AIWalletModules.billing;
const validDate=value=>billing.daysUntil(value,value)!==null;
function trialTimeline(accounts,today){
 if(!validDate(today))throw Error('Invalid reference date');
 const entries=[];
 for(const account of Array.isArray(accounts)?accounts:[]){
  if(!account||!account.id||!account.trialEnabled||account.trialStatus!=='active')continue;
  const end=validDate(account.trialEnd)?account.trialEnd:null;
  const cancel=validDate(account.cancelBy)?account.cancelBy:null;
  const start=validDate(account.trialStart)?account.trialStart:null;
  const days=Number(account.trialDays);
  let issues=[];
  if(!end)issues.push('Trial end date missing or invalid');
  if(!cancel)issues.push('Cancellation deadline missing or invalid');
  if(start&&end&&start>end)issues.push('Trial starts after it ends');
  if(cancel&&end&&cancel>end)issues.push('Cancellation deadline is after trial end');
  if(Number.isFinite(days)&&days>0&&start&&end&&billing.daysUntil(end,start)!==Math.round(days))issues.push('Trial duration differs from saved dates');
  const daysToCancel=cancel?billing.daysUntil(cancel,today):null;
  const daysToEnd=end?billing.daysUntil(end,today):null;
  const urgency=daysToCancel===null?'unknown':daysToCancel<0?'overdue':daysToCancel<=2?'critical':daysToCancel<=7?'soon':'upcoming';
  entries.push({accountId:account.id,label:String(account.label||'AI account').slice(0,100),cancelBy:cancel,trialEnd:end,trialStart:start,trialDays:Number.isFinite(days)&&days>0?days:null,daysToCancel,daysToEnd,urgency,issues});
 }
 const priority={overdue:0,critical:1,soon:2,unknown:3,upcoming:4};
 entries.sort((a,b)=>priority[a.urgency]-priority[b.urgency]||(a.cancelBy||'9999').localeCompare(b.cancelBy||'9999')||a.label.localeCompare(b.label));
 return {entries,active:entries.length,urgent:entries.filter(e=>['overdue','critical','soon'].includes(e.urgency)).length,missing:entries.filter(e=>e.issues.length).length};
}
global.AIWalletModules.trialTimeline=Object.freeze({trialTimeline});
})(window);

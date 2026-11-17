(function(global){
'use strict';
const billing=global.AIWalletModules.billing;
function dateUTC(value){if(billing.daysUntil(value,value)===null)return null;return Date.parse(value+'T00:00:00Z')}
function dateAdd(value,days){return new Date(dateUTC(value)+days*86400000).toISOString().slice(0,10)}
function projectedPayments(accounts,today,horizonDays=90){
 if(dateUTC(today)===null||!Number.isInteger(horizonDays)||horizonDays<1||horizonDays>730)throw Error('Invalid forecast horizon');
 const end=dateAdd(today,horizonDays-1),out=[];
 for(const a of Array.isArray(accounts)?accounts:[]){
  if(!a||!a.id||!['weekly','monthly','yearly'].includes(a.billingCycle)||a.trialEnabled&&a.trialStatus==='active')continue;
  const amount=Number(a.cost);if(!Number.isFinite(amount)||amount<=0||amount>1e9)continue;
  let date=billing.nextRenewalDate(a.renewalDate,a.billingCycle,today);
  if(!date)continue;
  // Iterate using the original anchor to preserve month-end billing days.
  let count=0;
  while(date<=end&&count<110){
   out.push({accountId:a.id,label:String(a.label||'AI account').slice(0,100),date,amount,cycle:a.billingCycle});
   const next=billing.nextRenewalDate(a.renewalDate,a.billingCycle,dateAdd(date,1));
   if(!next||next<=date)break;
   date=next;count++;
  }
 }
 return out.sort((a,b)=>a.date.localeCompare(b.date)||a.label.localeCompare(b.label));
}
function summary(accounts,today,horizonDays=90){
 const events=projectedPayments(accounts,today,horizonDays);
 const cents=events.reduce((total,e)=>total+Math.round(e.amount*100),0);
 const unique=new Set(events.map(e=>e.accountId));
 return {events,total:cents/100,count:events.length,accounts:unique.size,first:events[0]?.date||null};
}
global.AIWalletModules=global.AIWalletModules||{};
global.AIWalletModules.paymentForecast=Object.freeze({projectedPayments,summary});
})(window);

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
  const amount=Number(a.cost);if(a.cost==null||a.cost===''||typeof a.cost==='boolean'||!Number.isFinite(amount)||amount<=0||amount>1e9)continue;
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
 const byDate=Object.entries(events.reduce((acc,e)=>{const row=acc[e.date]||(acc[e.date]={cents:0,count:0});row.cents+=Math.round(e.amount*100);row.count++;return acc},Object.create(null))).map(([date,row])=>({date,total:row.cents/100,count:row.count}));
 const unique=new Set(events.map(e=>e.accountId));
 const missingDateAccounts=(Array.isArray(accounts)?accounts:[]).filter(a=>a&&a.id&&['weekly','monthly','yearly'].includes(a.billingCycle)&&!(a.trialEnabled&&a.trialStatus==='active')&&a.cost!=null&&a.cost!==''&&typeof a.cost!=='boolean'&&Number.isFinite(Number(a.cost))&&Number(a.cost)>0&&!billing.nextRenewalDate(a.renewalDate,a.billingCycle,today)).map(a=>({accountId:a.id,label:String(a.label||'AI account').slice(0,100)}));
 const dueSoon=byDate.filter(d=>billing.daysUntil(d.date,today)<7);
 const nextPayment=events.length?{date:events[0].date,days:billing.daysUntil(events[0].date,today),amount:byDate[0].total,count:byDate[0].count}:null;
 const dueSoonCents=dueSoon.reduce((sum,d)=>sum+Math.round(d.total*100),0);
 const missingDates=missingDateAccounts.length;
 return {events,byDate,nextPayment,dueSoonTotal:dueSoonCents/100,dueSoonDays:dueSoon.length,total:cents/100,count:events.length,accounts:unique.size,missingDates,missingDateAccounts,first:events[0]?.date||null};
}
global.AIWalletModules=global.AIWalletModules||{};
global.AIWalletModules.paymentForecast=Object.freeze({projectedPayments,summary});
})(window);

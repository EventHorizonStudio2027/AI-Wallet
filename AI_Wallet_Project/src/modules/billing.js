(function (global) {
'use strict';
function monthlyEquivalent(amount, cycle) {
 const value=Number(amount); if(!Number.isFinite(value)||value<=0)return 0;
 if(cycle==='monthly')return value; if(cycle==='yearly')return value/12;
 if(cycle==='weekly')return value*52/12; return 0;
}
function summarize(accounts) {
 const rows=(Array.isArray(accounts)?accounts:[]).filter(account=>account&&typeof account==='object').map(account=>({account,monthly:monthlyEquivalent(account.cost,account.billingCycle)}));
 const monthly=rows.reduce((sum,row)=>sum+row.monthly,0);
 return {monthly,annual:monthly*12,recurringCount:rows.filter(row=>row.monthly>0).length,rows};
}
function daysUntil(date,today){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||!/^\d{4}-\d{2}-\d{2}$/.test(today||''))return null;
 const parse=v=>{const d=new Date(v+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v?d.getTime():null};
 const a=parse(date),b=parse(today);return a===null||b===null?null:Math.round((a-b)/86400000);
}
// Advance from the original billing anchor, not the previous occurrence: Jan 31 -> Feb 28 -> Mar 31.
function nextRenewalDate(anchor,cycle,today){
 if(!['weekly','monthly','yearly'].includes(cycle)||daysUntil(anchor,anchor)===null||daysUntil(today,today)===null)return null;
 if(anchor>=today)return anchor;
 const [y,m,d]=anchor.split('-').map(Number);
 const format=dt=>dt.toISOString().slice(0,10);
 const makeMonth=n=>{const yy=y+Math.floor((m-1+n)/12),mm=((m-1+n)%12+12)%12;const last=new Date(Date.UTC(yy,mm+1,0)).getUTCDate();return format(new Date(Date.UTC(yy,mm,Math.min(d,last))))};
 if(cycle==='weekly'){
  const elapsed=-daysUntil(anchor,today),weeks=Math.ceil(elapsed/7);
  return format(new Date(Date.parse(anchor+'T00:00:00Z')+weeks*7*86400000));
 }
 if(cycle==='monthly'){
  const [ty,tm]=today.split('-').map(Number);let n=(ty-y)*12+(tm-m);
  let candidate=makeMonth(n);return candidate<today?makeMonth(n+1):candidate;
 }
 const ty=Number(today.slice(0,4));let n=ty-y;
 let candidate=makeMonth(n*12);return candidate<today?makeMonth((n+1)*12):candidate;
}
function alerts(accounts,today){
 const out=[];
 for(const a of Array.isArray(accounts)?accounts:[]){
  if(!a||!a.id)continue;
  const windowDays=Number.isInteger(Number(a.alertDays))?Math.min(90,Math.max(0,Number(a.alertDays))):7;
  const push=(date,type,message,days)=>out.push({accountId:a.id,date,type,message,days});
  if(a.trialEnabled&&a.trialStatus==='active'){
   const cancel=daysUntil(a.cancelBy,today),end=daysUntil(a.trialEnd,today);
   if(cancel!==null&&cancel>=-30&&cancel<=windowDays)push(a.cancelBy,'trial_cancel',cancel<0?'Trial cancellation deadline passed — verify provider status':'Cancel free trial by this date to avoid a possible charge',cancel);
   if(end!==null&&end>=-30&&end<=windowDays)push(a.trialEnd,'trial_end',end<0?'Trial end date passed — check whether billing began':'Free trial ends; paid billing may begin',end);
  }
  const next=nextRenewalDate(a.renewalDate,a.billingCycle,today);
  const payment=daysUntil(next,today);
  if(['weekly','monthly','yearly'].includes(a.billingCycle)&&Number.isFinite(Number(a.cost))&&Number(a.cost)>0&&payment!==null&&payment>=0&&payment<=windowDays&&!(a.trialEnabled&&a.trialStatus==='active'))push(next,'renewal','Upcoming '+a.billingCycle+' payment: $'+Number(a.cost).toFixed(2),payment);
 }
 return out;
}
global.AIWalletModules=global.AIWalletModules||{};
global.AIWalletModules.billing=Object.freeze({monthlyEquivalent,summarize,daysUntil,nextRenewalDate,alerts});
})(window);

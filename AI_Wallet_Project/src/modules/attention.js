(function(global){
'use strict';
function overview(accounts,today){
 const trials=global.AIWalletModules.trialTimeline.trialTimeline(accounts,today);
 const payments=global.AIWalletModules.paymentForecast.summary(accounts,today,30);
 const rows=[];
 for(const t of trials.entries){
  if(t.daysToCancel===null){rows.push({kind:'review',accountId:t.accountId,label:t.label,date:null,days:null,message:'Cancellation deadline missing — review trial',priority:1});continue}
  if(t.issues.length){rows.push({kind:'review',accountId:t.accountId,label:t.label,date:t.cancelBy,days:t.daysToCancel,message:'Trial dates need review: '+t.issues.join('; '),priority:1})}
  if(t.daysToCancel>14)continue;
  rows.push({kind:'trial',accountId:t.accountId,label:t.label,date:t.cancelBy,days:t.daysToCancel,message:t.daysToCancel<0?'Cancellation deadline passed — verify status':t.daysToCancel===0?'Cancel-by deadline today':`Cancel within ${t.daysToCancel} day(s)`,priority:t.daysToCancel<0?0:t.daysToCancel<=2?1:2});
 }
 for(const p of payments.events){
  const days=global.AIWalletModules.billing.daysUntil(p.date,today);
  if(days===null||days<0||days>14)continue;
  rows.push({kind:'payment',accountId:p.accountId,label:p.label,date:p.date,days,amount:p.amount,message:'Estimated subscription renewal',priority:3});
 }
 rows.sort((a,b)=>a.priority-b.priority||(a.days??999)-(b.days??999)||a.label.localeCompare(b.label));
 return {trials:trials.active,urgentTrials:trials.urgent,missingTrials:trials.missing,projected30:payments.total,paymentCount30:payments.count,rows,hidden:Math.max(0,rows.length-6)};
}
global.AIWalletModules.attention=Object.freeze({overview});
})(window);

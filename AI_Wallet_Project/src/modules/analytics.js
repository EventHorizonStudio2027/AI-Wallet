(function(global){
'use strict';
const iso=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const cents=n=>Math.round(Number(n)*100);
const money=n=>Math.round(n)/100;
const diff=(a,b)=>Math.round((Date.parse(a+'T00:00:00Z')-Date.parse(b+'T00:00:00Z'))/86400000);
function analyze(value,today){
 if(!iso(today))throw new Error('Valid ISO date required');
 const data=global.AIWalletModules.creator.normalize(value);
 const pending=data.payouts.filter(p=>p.status==='pending');
 const received=data.payouts.filter(p=>p.status==='received');
 const aging={notDue:0,days1to30:0,days31to60:0,days61plus:0,unknownDate:0};
 let overdueCents=0;
 for(const p of pending){let bucket='unknownDate';if(iso(p.dueDate)){const days=-diff(p.dueDate,today);bucket=days<=0?'notDue':days<=30?'days1to30':days<=60?'days31to60':'days61plus';if(days>0)overdueCents+=cents(p.amount);}aging[bucket]+=cents(p.amount);}
 const totals={pending:money(pending.reduce((s,p)=>s+cents(p.amount),0)),received:money(received.reduce((s,p)=>s+cents(p.amount),0)),overdue:money(overdueCents)};
 const byClient=new Map();
 for(const a of data.agreements.filter(a=>a.status==='active'&&a.cadence!=='one-time')){
  const monthly=a.cadence==='monthly'?cents(a.amount):a.cadence==='quarterly'?cents(a.amount)/3:cents(a.amount)/12;
  const client=a.client||'Unassigned';byClient.set(client,(byClient.get(client)||0)+monthly);
 }
 const recurring=[...byClient].map(([client,monthly])=>({client,monthly:money(monthly)})).sort((a,b)=>b.monthly-a.monthly||a.client.localeCompare(b.client));
 const totalRecurringCents=[...byClient.values()].reduce((s,v)=>s+v,0);
 const concentration=totalRecurringCents>0?Math.round((recurring[0].monthly*100/ money(totalRecurringCents))*10)/10:0;
 const month=today.slice(0,7);const receivedThisMonth=received.filter(p=>p.dueDate.startsWith(month)).reduce((s,p)=>s+cents(p.amount),0);
 const gap=Math.max(0,cents(data.goal)-receivedThisMonth);
 return {totals,aging:Object.fromEntries(Object.entries(aging).map(([k,v])=>[k,money(v)])),recurring,monthlyRecurring:money(totalRecurringCents),largestClientSharePercent:concentration,goal:{target:data.goal,received:money(receivedThisMonth),remaining:money(gap),progressPercent:data.goal>0?Math.round(receivedThisMonth/cents(data.goal)*100):null},assumptions:'Manually recorded payouts and agreements; not verified bank transactions or guaranteed future receipts.'};
}
global.AIWalletModules=global.AIWalletModules||{};
global.AIWalletModules.analytics=Object.freeze({analyze});
})(window);

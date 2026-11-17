(function(global){
'use strict';
const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const cents=n=>Math.round(Number(n)*100);
const dollars=n=>Math.round(n)/100;
const weights=Object.freeze({conservative:0.55,base:0.8,optimistic:1});
function scenarios(value,today,months=3){
 if(!validDate(today))throw Error('Invalid forecast date');
 const c=global.AIWalletModules.creator.normalize(value);
 const schedule=global.AIWalletModules.intelligence.cashForecast(c,today,months);
 // Contract schedules and manually recorded payouts are separate views; they may represent the same income.
 const projections=schedule.months.map(row=>{
  const contracted=cents(row.scheduled),received=cents(row.received),pending=cents(row.pending);
  return {month:row.month,contracted:dollars(contracted),recordedReceived:dollars(received),recordedPending:dollars(pending),
   scenarios:Object.fromEntries(Object.entries(weights).map(([name,weight])=>[name,dollars(Math.round(contracted*weight))]))};
 });
 const total=key=>dollars(projections.reduce((sum,row)=>sum+cents(row.scenarios[key]),0));
 return {months:projections,totals:{conservative:total('conservative'),base:total('base'),optimistic:total('optimistic')},assumptions:'Illustrative 55% / 80% / 100% collection of scheduled contracts. Not a statistical forecast. Recorded payouts are displayed separately and not added to contract projections.'};
}
function csvCell(value){let str=String(value??'');if(/^[\s]*[=+@\-\t\r]/.test(str))str="'"+str;return '"'+str.replace(/"/g,'""')+'"';}
function csv(rows){return '\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';}
function exportLedger(value){const c=global.AIWalletModules.creator.normalize(value);return csv([['Record type','Client','Project','Amount USD','Frequency','Status','Due date','Reference','ID'],...c.agreements.map(a=>['agreement',a.client,a.title,a.amount,a.cadence,a.status,a.nextDue,'',a.id]),...c.payouts.map(p=>['payout',p.client,'',p.amount,'',p.status,p.dueDate,p.reference,p.id])]);}
function exportForecast(value,today){const r=scenarios(value,today);return csv([['Month','Scheduled contracts USD','Recorded received USD','Recorded pending USD','Conservative USD (55%)','Base USD (80%)','Optimistic USD (100%)'],...r.months.map(m=>[m.month,m.contracted,m.recordedReceived,m.recordedPending,m.scenarios.conservative,m.scenarios.base,m.scenarios.optimistic])]);}
global.AIWalletModules=global.AIWalletModules||{};
global.AIWalletModules.revenuePlanning=Object.freeze({scenarios,exportLedger,exportForecast});
})(window);

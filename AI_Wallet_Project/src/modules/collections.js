(function(global){
'use strict';
const valid=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const day=s=>Date.parse(s+'T00:00:00Z')/86400000;
const cents=n=>Math.round(Number(n)*100);
function worklist(creator,today){
 if(!valid(today))throw Error('Invalid report date');
 const c=global.AIWalletModules.creator.normalize(creator);
 const rows=c.payouts.filter(p=>p.status==='pending').map(p=>{
  const days=valid(p.dueDate)?Math.round(day(today)-day(p.dueDate)):null;
  const priority=days===null?'unknown':days>30?'critical':days>0?'overdue':days>=-7?'upcoming':'scheduled';
  return {id:p.id,client:p.client,amount:p.amount,dueDate:p.dueDate,reference:p.reference,days,priority};
 });
 const order={critical:0,overdue:1,upcoming:2,unknown:3,scheduled:4};
 rows.sort((a,b)=>order[a.priority]-order[b.priority]||(b.days??-99999)-(a.days??-99999)||b.amount-a.amount||a.id.localeCompare(b.id));
 const summary={pendingCents:0,overdueCents:0,dueSoonCents:0,criticalCents:0,missingReferences:0,counts:{critical:0,overdue:0,upcoming:0,unknown:0,scheduled:0}};
 for(const r of rows){const n=cents(r.amount);summary.pendingCents+=n;summary.counts[r.priority]++;if(r.days>0)summary.overdueCents+=n;if(r.days!==null&&r.days>=-7&&r.days<=0)summary.dueSoonCents+=n;if(r.priority==='critical')summary.criticalCents+=n;if(!r.reference)summary.missingReferences++}
 return {rows,summary:{...summary,pending:summary.pendingCents/100,overdue:summary.overdueCents/100,dueSoon:summary.dueSoonCents/100,critical:summary.criticalCents/100}};
}
function csvCell(v){const s=String(v??'');const safe=/^[\s]*[=+@\-\t\r]/.test(s)?"'"+s:s;return '"'+safe.replace(/"/g,'""')+'"'}
function exportCsv(report){const header=['Client','Amount USD','Due date','Days overdue','Priority','Reference'];return [header,...report.rows.map(r=>[r.client,r.amount.toFixed(2),r.dueDate,r.days??'',r.priority,r.reference])].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n'}
global.AIWalletModules=global.AIWalletModules||{};
global.AIWalletModules.collections=Object.freeze({worklist,exportCsv});
})(window);

(function(global){
'use strict';
const iso=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const cents=n=>Math.round(Number(n)*100);
const dollars=n=>Math.round(n)/100;
const day=s=>new Date(s+'T00:00:00Z');
const fmt=d=>d.toISOString().slice(0,10);
function shiftMonth(s,months){if(!iso(s))return '';const d=day(s),target=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+months,1));const last=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();target.setUTCDate(Math.min(d.getUTCDate(),last));return fmt(target);}
function dueDates(agreement,from,to){if(!iso(from)||!iso(to)||from>to||!iso(agreement.nextDue)||agreement.status!=='active')return [];
 const cadence=agreement.cadence,step={monthly:1,quarterly:3,yearly:12}[cadence];
 if(!step)return cadence==='one-time'&&agreement.nextDue>=from&&agreement.nextDue<=to?[agreement.nextDue]:[];
 // Anchor to the original due date so month-end dates do not drift after February.
 const start=agreement.nextDue;let i=0;const results=[];
 while(i<1200){const candidate=shiftMonth(start,i*step);if(candidate>to)break;if(candidate>=from)results.push(candidate);i++;}
 return results;
}
function cashForecast(value,today,months=3){if(!iso(today))throw new Error('Valid ISO date required');if(!Number.isInteger(months)||months<1||months>12)throw new Error('Invalid forecast horizon');
 const c=global.AIWalletModules.creator.normalize(value);const first=today.slice(0,7)+'-01',end=shiftMonth(first,months);const last=fmt(new Date(day(end).getTime()-86400000));
 const rows=Array.from({length:months},(_,i)=>({month:shiftMonth(first,i).slice(0,7),scheduledCents:0,pendingCents:0,receivedCents:0}));
 const events=[];
 for(const a of c.agreements)for(const date of dueDates(a,first,last)){const idx=Number(date.slice(0,4))*12+Number(date.slice(5,7))-(Number(first.slice(0,4))*12+Number(first.slice(5,7)));if(idx>=0&&idx<months){rows[idx].scheduledCents+=cents(a.amount);events.push({date,source:'agreement',client:a.client,amount:a.amount,id:a.id});}}
 for(const p of c.payouts){const idx=Number(p.dueDate.slice(0,4))*12+Number(p.dueDate.slice(5,7))-(Number(first.slice(0,4))*12+Number(first.slice(5,7)));if(idx>=0&&idx<months){rows[idx][p.status==='received'?'receivedCents':'pendingCents']+=cents(p.amount);}}
 return {months:rows.map(r=>({month:r.month,scheduled:dollars(r.scheduledCents),pending:dollars(r.pendingCents),received:dollars(r.receivedCents)})),events:events.sort((a,b)=>a.date.localeCompare(b.date))};
}
function actionQueue(value,accounts,today){if(!iso(today))throw new Error('Valid ISO date required');const c=global.AIWalletModules.creator.normalize(value);const actions=[];
 for(const p of c.payouts){if(p.status!=='pending'||!iso(p.dueDate))continue;const days=Math.round((day(p.dueDate)-day(today))/86400000);if(days<=14)actions.push({kind:days<0?'payout_overdue':'payout_due',date:p.dueDate,days,subject:p.client||'Unnamed payout',detail:days<0?'Follow up on unpaid creator income':'Confirm incoming creator payout',amount:p.amount,id:p.id});}
 for(const a of c.agreements){if(a.status!=='active'||!iso(a.nextDue))continue;const dates=dueDates(a,today,fmt(new Date(day(today).getTime()+14*86400000)));if(dates.length)actions.push({kind:'agreement_due',date:dates[0],days:Math.round((day(dates[0])-day(today))/86400000),subject:a.client||'Agreement',detail:'Expected contractual milestone; confirm invoice and payment',amount:a.amount,id:a.id});}
 const notices=global.AIWalletModules.billing.alerts(accounts,today);for(const n of notices)actions.push({kind:n.type,date:n.date,days:n.days,subject:(accounts||[]).find(a=>a.id===n.accountId)?.label||'AI subscription',detail:n.message,amount:0,id:n.accountId});
 const priority={trial_cancel:0,payout_overdue:1,trial_end:2,renewal:3,payout_due:4,agreement_due:5};return actions.sort((a,b)=>(priority[a.kind]??9)-(priority[b.kind]??9)||a.days-b.days).slice(0,100);
}
function reconciliation(value){const c=global.AIWalletModules.creator.normalize(value);const refs=new Map(),duplicates=[];for(const p of c.payouts){const ref=p.reference.trim().toLowerCase();if(!ref)continue;if(refs.has(ref))duplicates.push({reference:p.reference,ids:[refs.get(ref),p.id]});else refs.set(ref,p.id);}return {duplicateReferences:duplicates,unreferencedReceived:c.payouts.filter(p=>p.status==='received'&&!p.reference).length,overdueWithoutReference:c.payouts.filter(p=>p.status==='pending'&&!p.reference).length};}
global.AIWalletModules=global.AIWalletModules||{};global.AIWalletModules.intelligence=Object.freeze({shiftMonth,dueDates,cashForecast,actionQueue,reconciliation});
})(window);

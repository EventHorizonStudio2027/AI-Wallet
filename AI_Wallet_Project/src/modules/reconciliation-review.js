(function(global){
'use strict';
const creator=()=>global.AIWalletModules.creator;
const money=n=>Math.round(n*100);
const clean=s=>String(s||'').trim().toLocaleLowerCase('en-US').replace(/\s+/g,' ');
function review(value){
 const c=creator().normalize(value), issues=[], matches=[];
 const byRef=new Map();
 for(const p of c.payouts){
  const ref=clean(p.reference);
  if(p.status==='received'&&!ref)issues.push({kind:'missing-reference',severity:'info',payoutIds:[p.id],detail:'Received payout has no transaction reference'});
  if(ref){const k=ref;const others=byRef.get(k)||[];others.push(p);byRef.set(k,others)}
 }
 for(const [ref,group] of byRef){if(group.length>1)issues.push({kind:'duplicate-reference',severity:'warning',payoutIds:group.map(p=>p.id),detail:`Reference used by ${group.length} payouts`,reference:ref})}
 const active=c.agreements.filter(a=>a.status==='active');
 for(const p of c.payouts){
  const options=active.filter(a=>clean(a.client)===clean(p.client)&&money(a.amount)===money(p.amount));
  if(options.length===1)matches.push({payoutId:p.id,agreementId:options[0].id,confidence:'candidate',reason:'Exact client and amount; date and invoice not independently verified'});
  if(options.length>1)issues.push({kind:'ambiguous-agreement',severity:'info',payoutIds:[p.id],detail:`${options.length} possible agreements match this payout`});
 }
 const pending=c.payouts.filter(p=>p.status==='pending');
 const received=c.payouts.filter(p=>p.status==='received');
 return {summary:{pendingCount:pending.length,pendingAmount:pending.reduce((n,p)=>n+money(p.amount),0)/100,receivedCount:received.length,receivedAmount:received.reduce((n,p)=>n+money(p.amount),0)/100,issueCount:issues.length},issues,matches,disclaimer:'Suggestions are not verified bank transactions. No payout status is changed automatically.'};
}
function exportReview(value){
 const r=review(value),safe=global.AIWalletModules.revenuePlanning.exportLedger;
 if(typeof safe!=='function')throw Error('Revenue planning module required');
 // Reuse the CSV escaping behavior, including spreadsheet-formula protection.
 const cell=x=>{let s=String(x??'');if(/^[\s]*[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
 const rows=[['Type','Severity','Payout IDs','Agreement ID','Detail'],...r.issues.map(i=>[i.kind,i.severity,i.payoutIds.join('; '),'',i.detail]),...r.matches.map(m=>['candidate-match','review',m.payoutId,m.agreementId,m.reason])];
 return '\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n';
}
global.AIWalletModules=global.AIWalletModules||{};
global.AIWalletModules.reconciliationReview=Object.freeze({review,exportReview});
})(window);

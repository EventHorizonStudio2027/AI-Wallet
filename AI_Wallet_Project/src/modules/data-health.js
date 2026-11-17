(function(global){
'use strict';
function inspect(state){
 const issues=[];
 if(!state||typeof state!=='object')return {issues:[{kind:'invalid-state',severity:'error',detail:'Wallet data unavailable'}],counts:{error:1,warning:0,info:0}};
 const accounts=Array.isArray(state.accounts)?state.accounts:[];
 const services=new Set((Array.isArray(state.services)?state.services:[]).map(s=>s.id));
 const accountIds=new Set(accounts.map(a=>a.id));
 const files=Array.isArray(state.files)?state.files:[];
 const folders=new Set((Array.isArray(state.folders)?state.folders:[]).map(f=>f.id));
 const add=(kind,severity,detail,recordId)=>issues.push({kind,severity,detail,recordId:String(recordId||'')});
 const seen=new Set();
 for(const a of accounts){
  if(!services.has(a.serviceId))add('orphan-account','warning','Account references a missing AI service',a.id);
  if(seen.has(a.id))add('duplicate-account-id','error','Duplicate account identifier',a.id);
  seen.add(a.id);
 }
 seen.clear();
 for(const f of files){
  if(seen.has(f.id))add('duplicate-file-id','error','Duplicate file identifier',f.id);
  seen.add(f.id);
  if(f.accountId&&!accountIds.has(f.accountId))add('orphan-file-account','warning','File references a missing account',f.id);
  if(f.folderId&&!folders.has(f.folderId))add('orphan-file-folder','warning','File references a missing folder',f.id);
 }
 const creator=state.creator||{},payouts=Array.isArray(creator.payouts)?creator.payouts:[];
 const refs=new Map();
 for(const p of payouts){
  const ref=String(p.reference||'').trim().toLowerCase();
  if(p.status==='received'&&!ref)add('unreferenced-received','info','Received payout lacks a transaction reference',p.id);
  if(ref){if(refs.has(ref))add('duplicate-payout-reference','warning','Transaction reference is repeated',p.id);else refs.set(ref,p.id)}
  if(!Number.isFinite(Number(p.amount))||Number(p.amount)<=0)add('invalid-payout-amount','error','Payout has invalid amount',p.id);
 }
 return {issues,counts:{error:issues.filter(i=>i.severity==='error').length,warning:issues.filter(i=>i.severity==='warning').length,info:issues.filter(i=>i.severity==='info').length}};
}
global.AIWalletModules=global.AIWalletModules||{};
global.AIWalletModules.dataHealth=Object.freeze({inspect});
})(window);

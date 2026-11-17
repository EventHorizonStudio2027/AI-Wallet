(function(global){
'use strict';
const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const MAX_AMOUNT=1e9;
const amount=v=>{
 if(v==null||typeof v==='boolean'||typeof v==='object'||String(v).trim()==='')return 0;
 const value=Number(v);
 if(!Number.isFinite(value)||value<0||value>MAX_AMOUNT)return 0;
 return Math.round((value+Number.EPSILON)*100)/100;
};
const text=(v,n=120)=>typeof v==='string'?v.trim().slice(0,n):'';
function normalize(value){const c=value&&typeof value==='object'&&!Array.isArray(value)?value:{};const ids=new Set();const rows=(source,kind)=>Array.isArray(source)?source.slice(0,5000).filter(x=>x&&typeof x==='object').map(x=>{
 const id=text(x.id,80);if(!id||ids.has(kind+id))return null;ids.add(kind+id);
 if(kind==='a')return {id,client:text(x.client),title:text(x.title),amount:amount(x.amount),cadence:['monthly','quarterly','yearly','one-time'].includes(x.cadence)?x.cadence:'monthly',status:['active','paused','ended'].includes(x.status)?x.status:'paused',nextDue:validDate(x.nextDue)?x.nextDue:''};
 return {id,client:text(x.client),amount:amount(x.amount),dueDate:validDate(x.dueDate)?x.dueDate:'',status:x.status==='received'?'received':'pending',reference:text(x.reference)};
 }).filter(Boolean):[];
 return {goal:amount(c.goal),agreements:rows(c.agreements,'a'),payouts:rows(c.payouts,'p')};}
function monthlyRecurring(agreements){
 const total=(Array.isArray(agreements)?agreements:[]).filter(a=>a&&a.status==='active').reduce((sum,a)=>{
  const value=amount(a.amount);
  return sum+(a.cadence==='monthly'?value:a.cadence==='quarterly'?value/3:a.cadence==='yearly'?value/12:0);
 },0);
 return Math.round((total+Number.EPSILON)*100)/100;
}
function addMonth(ym,offset){const [y,m]=ym.split('-').map(Number);const date=new Date(Date.UTC(y,m-1+offset,1));return date.toISOString().slice(0,7);}
function report(value,today){const c=normalize(value);if(!validDate(today))throw new Error('Valid ISO date required');const month=today.slice(0,7);const payouts=c.payouts.filter(p=>p.dueDate.slice(0,7)===month);const received=amount(payouts.filter(p=>p.status==='received').reduce((s,p)=>s+p.amount,0));const pending=amount(payouts.filter(p=>p.status==='pending').reduce((s,p)=>s+p.amount,0));const contracted=monthlyRecurring(c.agreements);return {expected:amount(received+pending),received,outstanding:pending,contractedMonthly:contracted,goal:c.goal,forecast:[0,1,2].map(i=>({month:addMonth(month,i),amount:contracted}))};}
global.AIWalletModules=global.AIWalletModules||{};
global.AIWalletModules.creator=Object.freeze({normalize,monthlyRecurring,report,validDate});
})(window);

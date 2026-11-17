(function(global){
'use strict';
const KEY='aiwallet-reminder-preferences-v1';
const DEFAULTS=Object.freeze({enabled:true,leadDays:7,muted:{},delivered:{}});
function dateDays(date,today){const parse=v=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(v||''))return null;const d=new Date(v+'T00:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===v?d.getTime():null};const a=parse(date),b=parse(today);return a===null||b===null?null:Math.round((a-b)/86400000)}
function nextDay(today){if(dateDays(today,today)===null)throw Error('Invalid reminder date');return new Date(Date.parse(today+'T00:00:00Z')+86400000).toISOString().slice(0,10)}
function prefs(input){const v=input&&typeof input==='object'?input:{};const cleanMap=m=>Object.fromEntries(Object.entries(m&&typeof m==='object'&&!Array.isArray(m)?m:{}).filter(([k,n])=>/^[\w:.-]{1,220}$/.test(k)&&typeof n==='string'&&dateDays(n,n)!==null).slice(-500));return {enabled:v.enabled!==false,leadDays:Number.isInteger(v.leadDays)?Math.max(0,Math.min(60,v.leadDays)):7,muted:cleanMap(v.muted),delivered:cleanMap(v.delivered)}}
function load(){try{return prefs(JSON.parse(global.localStorage.getItem(KEY)))}catch{return prefs()}}
function save(value){const next=prefs(value);global.localStorage.setItem(KEY,JSON.stringify(next));return next}
function entries(accounts,today,settings){const p=prefs(settings),out=[];if(!p.enabled)return out;
 for(const a of Array.isArray(accounts)?accounts:[]){if(!a||!a.id)continue;const lead=Math.max(p.leadDays,Number.isInteger(a.alertDays)?Math.max(0,Math.min(90,a.alertDays)):0);
 const add=(type,date,title,body)=>{const days=dateDays(date,today);if(days===null||days>lead||days< -30)return;const key=`${a.id}:${type}:${date}`;if(p.muted[key]&&dateDays(p.muted[key],today)>=0)return;out.push({key,accountId:a.id,type,date,days,title,body,urgent:days<=1})};
 const label=String(a.label||'AI account');
 if(a.trialEnabled&&a.trialStatus==='active'){
 add('trial_cancel',a.cancelBy,'Trial cancellation deadline · '+label,'Confirm cancellation with the provider before this deadline.');
 add('trial_end',a.trialEnd,'Free trial ending · '+label,'The trial may convert to paid billing; verify provider terms.');
 }
 if(['weekly','monthly','yearly'].includes(a.billingCycle)&&Number.isFinite(Number(a.cost))&&Number(a.cost)>0&&!(a.trialEnabled&&a.trialStatus==='active')){
 add('renewal',global.AIWalletModules.billing?.nextRenewalDate(a.renewalDate,a.billingCycle,today)??a.renewalDate,'Upcoming subscription · '+label,'Scheduled '+a.billingCycle+' payment of $'+Number(a.cost).toFixed(2)+'.');
 }
 }
 return out.sort((a,b)=>a.days-b.days||a.title.localeCompare(b.title));}
function snooze(settings,key,until){const p=prefs(settings);if(dateDays(until,until)===null)throw Error('Invalid snooze date');p.muted[key]=until;return p}
function markDelivered(settings,key,today){const p=prefs(settings);if(dateDays(today,today)===null)throw Error('Invalid delivery date');p.delivered[key]=today;return p}
global.AIWalletModules=global.AIWalletModules||{};global.AIWalletModules.reminders=Object.freeze({prefs,load,save,entries,snooze,markDelivered,dateDays,nextDay});
})(window);

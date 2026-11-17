(function(global){
'use strict';
// Calendar export is a portable handoff to the user's calendar app, not a push service.
function parseDate(value){if(typeof value!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value))return null;const d=new Date(value+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value?d:null}
function addDays(value,days){const d=parseDate(value);if(!d)return null;d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
function escapeText(value){return String(value??'').replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,')}
function fold(line){const chunks=[];let current='';for(const c of line){if(BufferSafeBytes(current+c)>73&&current){chunks.push(current);current=' '+c}else current+=c}chunks.push(current);return chunks.join('\r\n')}
function BufferSafeBytes(s){return unescape(encodeURIComponent(s)).length}
function shiftMonth(value,months,anchorDay){const d=parseDate(value);if(!d)return null;const year=d.getUTCFullYear(),month=d.getUTCMonth();const first=new Date(Date.UTC(year,month+months,1));const last=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();first.setUTCDate(Math.min(anchorDay||d.getUTCDate(),last));return first.toISOString().slice(0,10)}
function nextCycle(date,cycle,anchorDay){if(cycle==='weekly')return addDays(date,7);if(cycle==='monthly')return shiftMonth(date,1,anchorDay);if(cycle==='yearly')return shiftMonth(date,12,anchorDay);return null}
function calendarEvents(accounts,options={}){
 const result=[],today=options.today||null,horizonDays=options.horizonDays===undefined?365:options.horizonDays;
 if(today!==null&&!parseDate(today))throw Error('Invalid calendar start date');
 if(!Number.isInteger(horizonDays)||horizonDays<1||horizonDays>730)throw Error('Invalid calendar horizon');
 const until=today?addDays(today,horizonDays):null;
 for(const a of Array.isArray(accounts)?accounts:[]){if(!a||!a.id)continue;
 const label=String(a.label||'AI account').slice(0,120),events=[];
 const add=(type,date,title,description)=>{if(parseDate(date)&&(!today||(date>=today&&date<=until)))events.push({type,date,title,description})};
 if(a.trialEnabled&&a.trialStatus==='active'){
 add('trial-cancel',a.cancelBy,'Cancel free trial by deadline — '+label,'Check provider cancellation policy and confirm cancellation. This date was entered in AI Wallet.');
 add('trial-end',a.trialEnd,'Free trial ends — '+label,'Verify whether billing begins and whether cancellation is required. This date was entered in AI Wallet.');
 }else if(['weekly','monthly','yearly'].includes(a.billingCycle)&&Number.isFinite(Number(a.cost))&&Number(a.cost)>0&&parseDate(a.renewalDate)){
 let date=a.renewalDate,steps=0;const anchor=parseDate(date).getUTCDate();
 while(steps<110){
  add('renewal',date,'Subscription renewal — '+label,'Expected '+a.billingCycle+' renewal: $'+Number(a.cost).toFixed(2)+'. Verify the actual charge and date with the provider.');
  if(!today)break;
  if(date>until)break;
  const next=nextCycle(date,a.billingCycle,anchor);if(!next||next<=date)break;date=next;steps++;
 }
 }
 for(const event of events)result.push({...event,uid:encodeURIComponent(String(a.id)).replace(/%/g,'_')+'-'+event.type+'-'+event.date+'@aiwallet.local'});
 }return result.sort((a,b)=>a.date.localeCompare(b.date)||a.uid.localeCompare(b.uid))
}
function generate(accounts,stamp='2026-01-01T00:00:00Z',options={}){const dt=new Date(stamp);if(!Number.isFinite(dt.getTime()))throw Error('Invalid export timestamp');const dtstamp=dt.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//AI Wallet//Subscription Deadlines//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:AI Wallet deadlines'];for(const e of calendarEvents(accounts,options)){lines.push('BEGIN:VEVENT','UID:'+e.uid,'DTSTAMP:'+dtstamp,'DTSTART;VALUE=DATE:'+e.date.replace(/-/g,''),'DTEND;VALUE=DATE:'+addDays(e.date,1).replace(/-/g,''),'SUMMARY:'+escapeText(e.title),'DESCRIPTION:'+escapeText(e.description),'TRANSP:TRANSPARENT','BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+escapeText(e.title),'TRIGGER:-P1D','END:VALARM','END:VEVENT')}lines.push('END:VCALENDAR');return lines.map(fold).join('\r\n')+'\r\n'}
global.AIWalletModules=global.AIWalletModules||{};global.AIWalletModules.calendarExport=Object.freeze({parseDate,addDays,escapeText,calendarEvents,generate,shiftMonth,nextCycle});
})(window);

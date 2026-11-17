(function(global){
'use strict';
const MAX_BYTES=1024*1024,MAX_ROWS=2000;
function parseCSV(source){
 if(typeof source!=='string'||source.length>MAX_BYTES)throw Error('CSV must be 1 MB or smaller');
 const rows=[];let row=[],field='',quoted=false,closed=false;
 const s=source.replace(/^\uFEFF/,'');
 for(let i=0;i<s.length;i++){
  const ch=s[i];
  if(quoted){if(ch==='"'&&s[i+1]==='"'){field+='"';i++}else if(ch==='"'){quoted=false;closed=true}else field+=ch;continue}
  if(ch==='"'){if(field!==''||closed)throw Error('Malformed CSV quoting');quoted=true;continue}
  if(ch===','){row.push(field);field='';closed=false;continue}
  if(ch==='\r'||ch==='\n'){
   if(ch==='\r'&&s[i+1]==='\n')i++;
   row.push(field);if(row.some(v=>v!==''))rows.push(row);
   if(rows.length>MAX_ROWS+1)throw Error('CSV exceeds 2000 data rows');row=[];field='';closed=false;continue;
  }
  if(closed&&ch!==' '&&ch!=='\t')throw Error('Unexpected characters after quoted field');
  field+=ch;
 }
 if(quoted)throw Error('Unterminated CSV quote');
 row.push(field);if(row.some(v=>v!==''))rows.push(row);
 if(!rows.length)throw Error('CSV is empty');
 return rows;
}
function normalizeHeader(h){return String(h).trim().toLowerCase().replace(/[\s_-]+/g,'');}
function cents(value){const v=String(value).trim();if(!/^(?:\d{1,12})(?:\.\d{1,2})?$/.test(v))return null;const [whole,decimal='']=v.split('.');const n=Number(whole)*100+Number((decimal+'00').slice(0,2));return Number.isSafeInteger(n)&&n>0?n:null;}
function validDate(s){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;}
function preview(csv,existing,options={}){
 const rows=parseCSV(csv),headers=rows.shift().map(normalizeHeader);
 const aliases={client:['client','payer','brand'],amount:['amount','grossamount'],dueDate:['duedate','date','paymentdate'],status:['status','paymentstatus'],reference:['reference','transactionreference','transactionid','invoice'],currency:['currency','currencycode']};
 const mapping=options&&options.mapping&&typeof options.mapping==='object'?options.mapping:{};
 const indexes=Object.fromEntries(Object.entries(aliases).map(([key,names])=>{
  const requested=mapping[key];
  if(requested!==undefined){const index=typeof requested==='number'?requested:headers.indexOf(normalizeHeader(requested));if(!Number.isInteger(index)||index<0||index>=headers.length)throw Error('Invalid column mapping for '+key);return [key,index]}
  return [key,headers.findIndex(h=>names.includes(h))];
 }));
 const mapped=Object.values(indexes).filter(i=>i>=0);
 if(new Set(mapped).size!==mapped.length)throw Error('A CSV column cannot map to multiple fields');
 if(['client','amount','dueDate','status'].some(k=>indexes[k]<0))throw Error('Required CSV columns: client, amount, dueDate, status');
 const current=Array.isArray(existing)?existing:[],seen=new Set(current.filter(p=>p.reference).map(p=>String(p.reference).trim().toLowerCase()));
 const fingerprint=p=>[String(p.client).trim().toLowerCase().replace(/\s+/g,' '),Math.round(Number(p.amount)*100),p.dueDate,p.status].join('|');
 const seenFingerprints=new Set(current.filter(p=>!p.reference).map(fingerprint));
 const rejectUnreferencedDuplicates=options.rejectUnreferencedDuplicates===true;
 const accepted=[],rejected=[],duplicates=[];
 for(let i=0;i<rows.length;i++){
  const row=rows[i],get=k=>indexes[k]<0?'':String(row[indexes[k]]??'').trim();
  const client=get('client'),money=cents(get('amount')),dueDate=get('dueDate'),status=get('status').toLowerCase(),reference=get('reference').slice(0,120),currency=get('currency').toUpperCase();
  const error=row.length!==headers.length?'Column count mismatch':!client?'Missing client':client.length>120?'Client too long':money===null?'Invalid positive amount':currency&&currency!=='USD'?'Only USD payouts are supported; convert externally before importing':!validDate(dueDate)?'Invalid date':!['received','pending'].includes(status)?'Status must be received or pending':'';
  if(error){rejected.push({row:i+2,reason:error});continue}
  const refKey=reference.toLowerCase();
  const payout={client,amount:money/100,dueDate,status,reference};
  const fp=fingerprint(payout);
  if((refKey&&seen.has(refKey))||(!refKey&&rejectUnreferencedDuplicates&&seenFingerprints.has(fp))){duplicates.push({row:i+2,reference,reason:refKey?'Duplicate transaction reference':'Possible duplicate without reference'});continue}
  if(refKey)seen.add(refKey);
  if(!refKey)seenFingerprints.add(fp);
  accepted.push(payout);
 }
 return {accepted,rejected,duplicates,total:rows.length,unreferenced:accepted.filter(p=>!p.reference).length,headers,indexes};
}
global.AIWalletModules=global.AIWalletModules||{};
global.AIWalletModules.payoutImport=Object.freeze({parseCSV,preview,normalizeHeader});
})(window);

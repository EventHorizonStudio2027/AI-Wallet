(function(global){
'use strict';
const SUPPORTED_SCHEMAS=[1,2,3,4,5,6,7];
const MAX_FILES=10000;
const MAX_FILE_BYTES=1024*1024*1024;
const MAX_BACKUP_BYTES=100*1024*1024;
const MAX_SERVICES=500,MAX_ACCOUNTS=5000,MAX_USAGE=5000,MAX_FOLDERS=500;
const MAX_TEXT_LENGTH=1024;
const MAX_TOTAL_DECODED_BYTES=MAX_BACKUP_BYTES;
const VALID_ID=/^[A-Za-z0-9_-]{1,80}$/;
function createEnvelope(state,exportedAt=new Date().toISOString()){
 if(!state||typeof state!=='object'||Array.isArray(state))throw new Error('Invalid wallet state');
 // Never export live file payloads from localStorage state. Binary contents are
 // added separately from IndexedDB by the export workflow.
 return {...state,schemaVersion:7,exportedAt,files:[]};
}
function validateBackup(parsed){
 if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('Backup must be a JSON object');
 if(!SUPPORTED_SCHEMAS.includes(Number(parsed.schemaVersion||1)))throw new Error('Unsupported backup version');
 if(!Array.isArray(parsed.files)||parsed.files.length>MAX_FILES)throw new Error('Invalid backup file list');
 if(parsed.files.some(file=>!file||typeof file!=='object'||Array.isArray(file)))throw new Error('Invalid file record');
 for(const [key,max] of [['services',MAX_SERVICES],['accounts',MAX_ACCOUNTS],['folders',MAX_FOLDERS],['usageHistory',MAX_USAGE]]){if((key==='services'||key==='accounts')&&!Array.isArray(parsed[key]))throw new Error('Missing backup '+key);if(parsed[key]!=null&&(!Array.isArray(parsed[key])||parsed[key].length>max))throw new Error('Invalid or oversized backup '+key)}
 for(const key of ['services','accounts','folders']){
  if(!Array.isArray(parsed[key]))continue;
  const seen=new Set();
  for(const record of parsed[key]){
   if(!record||typeof record!=='object'||Array.isArray(record)||typeof record.id!=='string'||!record.id.trim()||record.id.length>MAX_TEXT_LENGTH||seen.has(record.id))throw new Error('Invalid or duplicate '+key+' identifier');
   seen.add(record.id);
  }
 }
 if(parsed.creator!=null&&(typeof parsed.creator!=='object'||Array.isArray(parsed.creator)))throw new Error('Invalid creator records');
 // Validate foreign keys before importing, rather than silently dropping
 // account associations or folder assignments during normalization.
 const serviceIds=new Set((parsed.services||[]).map(item=>item.id));
 const accountServices=new Map((parsed.accounts||[]).map(item=>[item.id,item.serviceId]));
 const accountIds=new Set(accountServices.keys());
 const folderIds=new Set((parsed.folders||[]).map(item=>item.id));
 for(const account of parsed.accounts||[]){
  if(account.serviceId&&!serviceIds.has(account.serviceId))throw new Error('Backup account refers to a missing service');
 }
 for(const file of parsed.files){
  if(!file||typeof file!=='object'||Array.isArray(file))throw new Error('Invalid file record');
  if(file.serviceId&&!serviceIds.has(file.serviceId))throw new Error('Backup file refers to a missing service');
  if(file.accountId&&!accountIds.has(file.accountId))throw new Error('Backup file refers to a missing account');
  if(file.accountId&&file.serviceId&&accountServices.get(file.accountId)!==file.serviceId)throw new Error('Backup file account and service do not match');
  if(file.folderId&&!folderIds.has(file.folderId))throw new Error('Backup file refers to a missing folder');
 }
 const ids=new Set();
 let totalDecodedBytes=0;
 for(const file of parsed.files){
  if(!file||typeof file.id!=='string'||!VALID_ID.test(file.id)||ids.has(file.id))throw new Error('Invalid or duplicate file entry');
  ids.add(file.id);
  if(file.data!=null&&typeof file.data!=='string')throw new Error('Invalid file payload');
  if(typeof file.name!=='string'||!file.name.trim()||file.name.length>1024)throw new Error('Invalid file name');
  if(file.size!=null&&(!Number.isSafeInteger(file.size)||file.size<0||file.size>MAX_FILE_BYTES))throw new Error('Invalid file size');
  if(typeof file.data==='string'&&!isBase64DataUrl(file.data))throw new Error('Invalid file data');
  if(typeof file.data==='string'){
   const bytes=decodedLength(file.data);
   if(bytes>MAX_FILE_BYTES)throw new Error('File payload exceeds limit');
   totalDecodedBytes+=bytes;
   if(totalDecodedBytes>MAX_TOTAL_DECODED_BYTES)throw new Error('Total restored files exceed 100 MB limit');
   if(file.size!=null&&Number(file.size)!==bytes)throw new Error('File size does not match payload');
  }
 }
 return {fileCount:parsed.files.length,totalDecodedBytes,schemaVersion:Number(parsed.schemaVersion||1)};
}
function isBase64DataUrl(value){
 return typeof value==='string'&&/^data:[a-zA-Z0-9!#$&^_.+\-]*(?:\/[a-zA-Z0-9!#$&^_.+\-]*)?(?:;[a-zA-Z0-9!#$&^_.+\-]+=[a-zA-Z0-9!#$&^_.+\-]+)*;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value);
}
function decodedLength(dataUrl){
 const payload=dataUrl.slice(dataUrl.indexOf(',')+1);
 if(payload.length%4!==0)throw new Error('Malformed base64 payload');
 const padding=payload.endsWith('==')?2:payload.endsWith('=')?1:0;
 if(payload.length>=4){
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const finalChar=alphabet.indexOf(payload[ payload.length-padding-1 ]);
  if(finalChar<0||(padding===2&&(finalChar&15)!==0)||(padding===1&&(finalChar&3)!==0))throw new Error('Non-canonical base64 payload');
 }
 const bytes=payload.length/4*3-padding;
 if(!Number.isSafeInteger(bytes)||bytes<0)throw new Error('Invalid file size');
 return bytes;
}
function assertBackupSize(bytes){if(!Number.isFinite(bytes)||bytes<0||bytes>MAX_BACKUP_BYTES)throw new Error('Backup exceeds 100 MB limit');return bytes}
function assertBlobSize(blob){
 if(!blob||!Number.isFinite(blob.size)||blob.size<0||blob.size>MAX_FILE_BYTES)throw new Error('File too large or invalid');
 return blob.size;
}
global.AIWalletModules=global.AIWalletModules||{};
global.AIWalletModules.backup=Object.freeze({createEnvelope,validateBackup,isBase64DataUrl,assertBlobSize,assertBackupSize,decodedLength,MAX_FILES,MAX_FILE_BYTES,MAX_BACKUP_BYTES});
})(window);

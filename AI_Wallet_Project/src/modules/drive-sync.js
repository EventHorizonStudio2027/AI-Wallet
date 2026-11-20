(function(global){
'use strict';
const API='https://www.googleapis.com/drive/v3/files';
const UPLOAD='https://www.googleapis.com/upload/drive/v3/files';
const MAX_PAGES=100;
const MAX_BACKUP_PAGES=100;
const SCOPES='https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.appdata';
function assertToken(token){if(typeof token!=='string'||!token.trim())throw Error('Google Drive authorization required');return token}
async function request(token,url,options={}){
 const headers=new Headers(options.headers||{});
 headers.set('Authorization','Bearer '+assertToken(token));
 let response;
 for(let attempt=0;attempt<3;attempt++){
  try{response=await fetch(url,{...options,headers,cache:'no-store'})}
  catch(error){if(attempt===2||options.method&&options.method!=='GET')throw error;await new Promise(resolve=>setTimeout(resolve,250*(attempt+1)));continue}
  if(response.ok||![429,502,503,504].includes(response.status)||options.method&&options.method!=='GET'||attempt===2)break;
  const retryHeader=response.headers?.get?.('Retry-After');
  const retryAfter=retryHeader!==null&&retryHeader!==undefined&&/^\d+(?:\.\d+)?$/.test(retryHeader.trim())?Number(retryHeader):NaN;
  const wait=Number.isFinite(retryAfter)&&retryAfter>=0?Math.min(2000,retryAfter*1000):250*(attempt+1);
  await new Promise(resolve=>setTimeout(resolve,wait));
 }
 if(!response.ok){if(response.status===401)throw Error('Google Drive session expired or was revoked. Reconnect your Google account.');if(response.status===403)throw Error('Google Drive access denied. Check the selected account, folder sharing, and granted permissions.');if(response.status===404)throw Error('Google Drive file or folder not found. Check the folder link and that your account has access.');let message='Google Drive request failed ('+response.status+')';try{const body=await response.json();message=body.error?.message||message}catch{}throw Error(message)}
 return response;
}
function encodeQuery(value){return encodeURIComponent(value)}
async function listFolder(token,folderId,pageToken=''){
 if(!/^[A-Za-z0-9_-]{5,200}$/.test(folderId))throw Error('Invalid Google Drive folder ID');
 const params=new URLSearchParams({q:"'"+folderId+"' in parents and trashed = false",fields:'nextPageToken,files(id,name,mimeType,size,modifiedTime,md5Checksum,webViewLink)',pageSize:'1000'});
 if(pageToken){if(typeof pageToken!=='string'||pageToken.length>2048)throw Error('Invalid Google Drive page token');params.set('pageToken',pageToken)}
 const response=await request(token,API+'?'+params);
 return response.json();
}
async function listAllFolderFiles(token,folderId,max=5000){
 if(!Number.isSafeInteger(max)||max<1||max>5000)throw Error('Invalid sync file limit');
 const files=[];let next='';const visited=new Set(),seenFiles=new Set();let pages=0;
 do{
  if(visited.has(next)||++pages>MAX_PAGES)throw Error('Google Drive pagination loop or page limit reached');
  visited.add(next);
  const result=await listFolder(token,folderId,next);
  if(!result||!Array.isArray(result.files))throw Error('Malformed Google Drive file listing');
  for(const file of result.files||[]){
   if(!file||typeof file!=='object'||typeof file.id!=='string'||!/^[A-Za-z0-9_-]{5,200}$/.test(file.id))throw Error('Malformed Google Drive file entry');
   if(file.mimeType!=='application/vnd.google-apps.folder'&&!seenFiles.has(file.id)){files.push(file);seenFiles.add(file.id)}
   if(files.length>max)throw Error('Folder exceeds the 5,000 file sync limit');
  }
  if(result.nextPageToken!=null&&(typeof result.nextPageToken!=='string'||result.nextPageToken.length>2048))throw Error('Invalid Google Drive page token');
  if(result.nextPageToken&&result.nextPageToken===next)throw Error('Google Drive folder pagination did not advance');
  next=result.nextPageToken||'';
 }while(next);
 return files;
}
function fingerprint(file){
 if(!file||typeof file!=='object')throw Error('Invalid Drive file');
 const id=String(file.id||'');if(!/^[A-Za-z0-9_-]{5,200}$/.test(id))throw Error('Invalid Drive file ID');
 return 'google-drive:'+id;
}
function planIncrementalSync(remoteFiles,existingFiles=[]){
 if(!Array.isArray(remoteFiles)||!Array.isArray(existingFiles))throw Error('Invalid sync inventory');
 const existing=new Map(existingFiles.filter(Boolean).map(f=>[String(f.sourceKey||''),f]));
 const seen=new Set(),added=[],changed=[],unchanged=[];
 for(const file of remoteFiles){
  const key=fingerprint(file);if(seen.has(key))continue;seen.add(key);
  const previous=existing.get(key);
  if(!previous)added.push(file);
  else if(String(previous.modifiedTime||'')!==String(file.modifiedTime||'')||String(previous.checksum||'')!==String(file.md5Checksum||''))changed.push(file);
  else unchanged.push(file);
 }
 return {added,changed,unchanged};
}
async function download(token,fileId,maxBytes=1024*1024*1024){
 if(!/^[A-Za-z0-9_-]{5,200}$/.test(fileId))throw Error('Invalid Google Drive file ID');
 if(!Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>1024*1024*1024)throw Error('Invalid download size limit');
 const response=await request(token,API+'/'+encodeQuery(fileId)+'?alt=media');
 const length=response.headers.get('Content-Length');
 if(length!==null&&/^\d+$/.test(length.trim())&&Number(length)>maxBytes){try{await response.body?.cancel?.()}catch{}throw Error('Google Drive download exceeds the allowed size')}
 // Enforce the limit while reading, not only after allocating the full Blob.
 if(Number.isFinite(maxBytes)&&response.body&&typeof response.body.getReader==='function'){
  const reader=response.body.getReader();const chunks=[];let bytes=0;
  try{
   while(true){
    const {done,value}=await reader.read();if(done)break;
    bytes+=value.byteLength;
    if(bytes>maxBytes)throw Error('Google Drive download exceeds the allowed size');
    chunks.push(value);
   }
  }catch(error){try{await reader.cancel()}catch{}throw error}
  return new Blob(chunks,{type:response.headers.get('Content-Type')||'application/octet-stream'});
 }
 const blob=await response.blob();
 if(blob.size>maxBytes)throw Error('Google Drive download exceeds the allowed size');
 return blob;
}
async function listBackups(token){
 const files=[];let next='';const visited=new Set();let pages=0;
 do{
  if(visited.has(next)||++pages>MAX_BACKUP_PAGES)throw Error('Google Drive backup pagination loop or page limit reached');
  visited.add(next);
  const params=new URLSearchParams({spaces:'appDataFolder',q:"name contains 'domain-backup-' and trashed = false",fields:'nextPageToken,files(id,name,size,createdTime)',pageSize:'100'});
  if(next){if(next.length>2048)throw Error('Invalid Google Drive backup page token');params.set('pageToken',next)}
  const response=await request(token,API+'?'+params);
  const result=await response.json();
  if(!result||!Array.isArray(result.files))throw Error('Malformed Google Drive backup listing');
  files.push(...result.files.filter(file=>file&&typeof file.id==='string'&&/^[A-Za-z0-9_-]{5,200}$/.test(file.id)&&typeof file.name==='string'&&/^domain-backup-[0-9T-Z-]+\.json$/.test(file.name)&&(!file.size||/^\d+$/.test(String(file.size)))));
  if(files.length>10000)throw Error('Google Drive backup listing exceeds safe limit');
  if(result.nextPageToken!=null&&(typeof result.nextPageToken!=='string'||result.nextPageToken.length>2048))throw Error('Invalid Google Drive backup page token');
  if(result.nextPageToken&&result.nextPageToken===next)throw Error('Google Drive backup pagination did not advance');
  next=result.nextPageToken||'';
 }while(next);
 // Keep recovery choices stable and avoid duplicate entries across Drive pages.
 const unique=[...new Map(files.map(file=>[file.id,file])).values()];
 unique.sort((a,b)=>String(b.createdTime||'').localeCompare(String(a.createdTime||''))||String(a.id).localeCompare(String(b.id)));
 return {files:unique};
}
async function uploadBackup(token,blob,name){
 if(!(blob instanceof Blob)||blob.size===0||blob.size>100*1024*1024)throw Error('Backup must be a nonempty Blob no larger than 100 MB');
 if(!/^domain-backup-[0-9T-Z-]+\.json$/.test(name))throw Error('Invalid backup filename');
 const metadata={name,parents:['appDataFolder'],mimeType:'application/json'};
 const boundary='domain'+Math.random().toString(36).slice(2);
 const body=new Blob(['--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n',JSON.stringify(metadata),'\r\n--'+boundary+'\r\nContent-Type: application/json\r\n\r\n',blob,'\r\n--'+boundary+'--'],{type:'multipart/related; boundary='+boundary});
 const response=await request(token,UPLOAD+'?uploadType=multipart&fields=id,name,size',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body});
 const result=await response.json();
 if(!result||typeof result.id!=='string'||!result.id||result.name!==name)throw Error('Google Drive did not confirm the uploaded backup');
 return result;
}
global.AIWalletModules=global.AIWalletModules||{};
global.AIWalletModules.driveSync=Object.freeze({SCOPES,listFolder,listAllFolderFiles,fingerprint,planIncrementalSync,download,listBackups,uploadBackup});
})(window);

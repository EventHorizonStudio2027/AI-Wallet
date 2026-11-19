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
 const response=await fetch(url,{...options,headers,cache:'no-store'});
 if(!response.ok){let message='Google Drive request failed ('+response.status+')';try{const body=await response.json();message=body.error?.message||message}catch{}throw Error(message)}
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
 const files=[];let next='';const visited=new Set();let pages=0;
 do{
  if(visited.has(next)||++pages>MAX_PAGES)throw Error('Google Drive pagination loop or page limit reached');
  visited.add(next);
  const result=await listFolder(token,folderId,next);
  if(!result||!Array.isArray(result.files))throw Error('Malformed Google Drive file listing');
  for(const file of result.files||[]){if(file.mimeType!=='application/vnd.google-apps.folder')files.push(file);if(files.length>max)throw Error('Folder exceeds the 5,000 file sync limit')}
  if(result.nextPageToken!=null&&(typeof result.nextPageToken!=='string'||result.nextPageToken.length>2048))throw Error('Invalid Google Drive page token');
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
async function download(token,fileId){
 if(!/^[A-Za-z0-9_-]{5,200}$/.test(fileId))throw Error('Invalid Google Drive file ID');
 const response=await request(token,API+'/'+encodeQuery(fileId)+'?alt=media');
 return response.blob();
}
async function listBackups(token){
 const files=[];let next='';const visited=new Set();let pages=0;
 do{
  if(visited.has(next)||++pages>MAX_BACKUP_PAGES)throw Error('Google Drive backup pagination loop or page limit reached');
  visited.add(next);
  const params=new URLSearchParams({spaces:'appDataFolder',q:"name contains 'domain-backup-' and trashed = false",fields:'nextPageToken,files(id,name,size,createdTime)',pageSize:'100'});
  if(next)params.set('pageToken',next);
  const response=await request(token,API+'?'+params);
  const result=await response.json();
  if(!result||!Array.isArray(result.files))throw Error('Malformed Google Drive backup listing');
  files.push(...result.files);
  if(result.nextPageToken!=null&&(typeof result.nextPageToken!=='string'||result.nextPageToken.length>2048))throw Error('Invalid Google Drive backup page token');
  next=result.nextPageToken||'';
 }while(next);
 return {files};
}
async function uploadBackup(token,blob,name){
 if(!(blob instanceof Blob)||blob.size>100*1024*1024)throw Error('Backup must be a Blob no larger than 100 MB');
 if(!/^domain-backup-[0-9T-Z-]+\.json$/.test(name))throw Error('Invalid backup filename');
 const metadata={name,parents:['appDataFolder'],mimeType:'application/json'};
 const boundary='domain'+Math.random().toString(36).slice(2);
 const body=new Blob(['--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n',JSON.stringify(metadata),'\r\n--'+boundary+'\r\nContent-Type: application/json\r\n\r\n',blob,'\r\n--'+boundary+'--'],{type:'multipart/related; boundary='+boundary});
 const response=await request(token,UPLOAD+'?uploadType=multipart&fields=id,name,size',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body});
 return response.json();
}
global.AIWalletModules=global.AIWalletModules||{};
global.AIWalletModules.driveSync=Object.freeze({SCOPES,listFolder,listAllFolderFiles,fingerprint,planIncrementalSync,download,listBackups,uploadBackup});
})(window);

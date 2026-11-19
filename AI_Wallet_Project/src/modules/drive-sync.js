(function(global){
'use strict';
const API='https://www.googleapis.com/drive/v3/files';
const UPLOAD='https://www.googleapis.com/upload/drive/v3/files';
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
 if(pageToken)params.set('pageToken',pageToken);
 const response=await request(token,API+'?'+params);
 return response.json();
}
async function listAllFolderFiles(token,folderId,max=5000){
 const files=[];let next='';
 do{
  const result=await listFolder(token,folderId,next);
  for(const file of result.files||[]){if(file.mimeType!=='application/vnd.google-apps.folder')files.push(file);if(files.length>max)throw Error('Folder exceeds the 5,000 file sync limit')}
  next=result.nextPageToken||'';
 }while(next);
 return files;
}
async function download(token,fileId){
 if(!/^[A-Za-z0-9_-]{5,200}$/.test(fileId))throw Error('Invalid Google Drive file ID');
 const response=await request(token,API+'/'+encodeQuery(fileId)+'?alt=media');
 return response.blob();
}
async function listBackups(token){
 const params=new URLSearchParams({spaces:'appDataFolder',q:"name contains 'domain-backup-' and trashed = false",fields:'nextPageToken,files(id,name,size,createdTime)',pageSize:'100'});
 const response=await request(token,API+'?'+params);
 return response.json();
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
global.AIWalletModules.driveSync=Object.freeze({SCOPES,listFolder,listAllFolderFiles,download,listBackups,uploadBackup});
})(window);

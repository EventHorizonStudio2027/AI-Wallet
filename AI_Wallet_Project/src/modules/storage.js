(function (global) {
'use strict';
const DB_NAME='AIWalletFiles',DB_VERSION=2;
const STORES={files:'blobs',usage:'usageEvents',meta:'appMeta'};
let databasePromise=null;
function open(){
 if(!global.indexedDB)return Promise.reject(new Error('IndexedDB unavailable'));
 if(!databasePromise){
  databasePromise=new Promise((resolve,reject)=>{
   const request=global.indexedDB.open(DB_NAME,DB_VERSION);
   request.onupgradeneeded=()=>{
    const db=request.result;
    if(!db.objectStoreNames.contains(STORES.files))db.createObjectStore(STORES.files);
    if(!db.objectStoreNames.contains(STORES.usage)){
     const store=db.createObjectStore(STORES.usage,{keyPath:'id'});
     store.createIndex('accountId','accountId',{unique:false});
     store.createIndex('at','at',{unique:false});
    }
    if(!db.objectStoreNames.contains(STORES.meta))db.createObjectStore(STORES.meta);
   };
   request.onsuccess=()=>{
    const db=request.result;
    db.onversionchange=()=>{db.close();databasePromise=null};
    resolve(db);
   };
   request.onerror=()=>reject(request.error||new Error('Could not open AI Wallet database'));
   request.onblocked=()=>reject(new Error('Wallet database upgrade is blocked by another open tab'));
  }).catch(error=>{databasePromise=null;throw error});
 }
 return databasePromise;
}
function transaction(storeName,mode,operation,errorMessage){
 return open().then(db=>new Promise((resolve,reject)=>{
  let result;
  let tx;
  try{
   tx=db.transaction(storeName,mode);
   result=operation(tx.objectStore(storeName),tx);
  }catch(error){reject(error);return}
  tx.oncomplete=()=>resolve(result&&typeof result.then==='function'?result:result);
  tx.onerror=()=>reject(tx.error||new Error(errorMessage));
  tx.onabort=()=>reject(tx.error||new Error(errorMessage+' (aborted)'));
 }));
}
function requestValue(request,tx){
 return new Promise((resolve,reject)=>{
  let value;
  request.onsuccess=()=>{value=request.result};
  request.onerror=()=>reject(request.error||new Error('IndexedDB request failed'));
  tx.oncomplete=()=>resolve(value);
  tx.onerror=()=>reject(tx.error||new Error('IndexedDB transaction failed'));
  tx.onabort=()=>reject(tx.error||new Error('IndexedDB transaction aborted'));
 });
}
function fileOperation(mode,key,value){
 return open().then(db=>new Promise((resolve,reject)=>{
  const tx=db.transaction(STORES.files,mode),store=tx.objectStore(STORES.files);
  const request=mode==='readwrite'?(value===undefined?store.delete(key):store.put(value,key)):store.get(key);
  let result;
  request.onsuccess=()=>{result=request.result};
  request.onerror=()=>reject(request.error||new Error('File storage request failed'));
  tx.oncomplete=()=>resolve(result);
  tx.onerror=()=>reject(tx.error||new Error('File storage transaction failed'));
  tx.onabort=()=>reject(tx.error||new Error('File storage transaction aborted'));
 }));
}
function putFile(key,blob){if(!key||!blob) return Promise.reject(new Error('A file key and payload are required'));return fileOperation('readwrite',key,blob)}
function getFile(key){return fileOperation('readonly',key)}
function deleteFile(key){return fileOperation('readwrite',key)}
function listFileKeys(){
 return open().then(db=>new Promise((resolve,reject)=>{
  const tx=db.transaction(STORES.files,'readonly'),request=tx.objectStore(STORES.files).getAllKeys();
  let keys=[];
  request.onsuccess=()=>{keys=request.result||[]};
  request.onerror=()=>reject(request.error||new Error('File storage audit failed'));
  tx.oncomplete=()=>resolve(keys);
  tx.onerror=()=>reject(tx.error||new Error('File storage audit failed'));
  tx.onabort=()=>reject(tx.error||new Error('File storage audit aborted'));
 }));
}
function clearFiles(){
 return open().then(db=>new Promise((resolve,reject)=>{
  const tx=db.transaction(STORES.files,'readwrite');tx.objectStore(STORES.files).clear();
  tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error('Could not clear file storage'));tx.onabort=()=>reject(tx.error||new Error('File storage clear aborted'));
 }));
}
function writeUsage(events){
 const valid=(Array.isArray(events)?events:[]).filter(e=>e&&typeof e.id==='string'&&e.id);
 if(!valid.length)return Promise.resolve();
 return open().then(db=>new Promise((resolve,reject)=>{
  const tx=db.transaction(STORES.usage,'readwrite'),store=tx.objectStore(STORES.usage);
  for(const event of valid)store.put(event);
  tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error('Usage history transaction failed'));tx.onabort=()=>reject(tx.error||new Error('Usage history transaction aborted'));
 }));
}
function replaceUsage(events){
 const valid=(Array.isArray(events)?events:[]).filter(e=>e&&typeof e.id==='string'&&e.id).slice(-5000);
 return open().then(db=>new Promise((resolve,reject)=>{
  const tx=db.transaction(STORES.usage,'readwrite'),store=tx.objectStore(STORES.usage);
  store.clear();for(const event of valid)store.put(event);
  tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error('Usage history replacement failed'));tx.onabort=()=>reject(tx.error||new Error('Usage history replacement aborted'));
 }));
}
function readUsage(accountId){
 return open().then(db=>new Promise((resolve,reject)=>{
  const tx=db.transaction(STORES.usage,'readonly'),store=tx.objectStore(STORES.usage);
  const request=accountId?store.index('accountId').getAll(accountId):store.getAll();
  request.onsuccess=()=>resolve(request.result||[]);
  request.onerror=()=>reject(request.error||new Error('Could not read usage history'));
  tx.onerror=()=>reject(tx.error||new Error('Usage history read failed'));
 }));
}
function clearWalletStores(){
 return open().then(db=>new Promise((resolve,reject)=>{
  const tx=db.transaction([STORES.files,STORES.usage],'readwrite');
  tx.objectStore(STORES.files).clear();
  tx.objectStore(STORES.usage).clear();
  tx.oncomplete=()=>resolve();
  tx.onerror=()=>reject(tx.error||new Error('Wallet storage reset failed'));
  tx.onabort=()=>reject(tx.error||new Error('Wallet storage reset aborted'));
 }));
}
function diagnostics(){
 return open().then(db=>({
  database:DB_NAME,version:db.version,
  stores:Array.from(db.objectStoreNames),
  fileStoreAvailable:db.objectStoreNames.contains(STORES.files),
  usageStoreAvailable:db.objectStoreNames.contains(STORES.usage)
 }));
}
global.AIWalletModules=global.AIWalletModules||{};
global.AIWalletModules.storage=Object.freeze({open,putFile,getFile,deleteFile,listFileKeys,clearFiles,clearWalletStores,writeUsage,replaceUsage,readUsage,diagnostics});
})(window);

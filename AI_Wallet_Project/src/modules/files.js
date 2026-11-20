(function (global) {
'use strict';
const categories=['Images','Videos','Documents','Audio','Code','Other'];
const extensions={Images:['png','jpg','jpeg','gif','webp','svg','bmp','heic','avif'],Videos:['mp4','mov','mkv','webm','avi'],Audio:['mp3','wav','m4a','ogg','flac','aac'],Code:['js','ts','tsx','jsx','html','css','py','java','cpp','c','cs','json','xml','sh','sql','php','go','rs'],Documents:['pdf','doc','docx','txt','rtf','odt','xls','xlsx','csv','ppt','pptx','md']};
const icons={Images:'▧',Videos:'▶',Documents:'▤',Audio:'♫',Code:'‹›',Other:'•••'};
function category(name,type=''){const ext=String(name||'').split('.').pop().toLowerCase(),mime=String(type||'').toLowerCase();if(mime.startsWith('image/')||extensions.Images.includes(ext))return'Images';if(mime.startsWith('video/')||extensions.Videos.includes(ext))return'Videos';if(mime.startsWith('audio/')||extensions.Audio.includes(ext))return'Audio';if(extensions.Code.includes(ext)||mime.includes('javascript')||mime.includes('text/x-'))return'Code';if(extensions.Documents.includes(ext)||mime.startsWith('text/')||mime.includes('pdf'))return'Documents';return'Other'}
function icon(value){return icons[categories.includes(value)?value:'Other']}
function storageStatus(file){return file?.storageMode==='remote'?'linked':file?.storageMode==='backup'?'backup':'local'}
function filterAndSort(files,{query='',provider='',category:folder='',storage='',sort='new'}={}){const q=String(query).trim().toLowerCase(),result=(Array.isArray(files)?files:[]).filter(f=>f&&(!q||[f.name,f.source,f.sourcePath,f.storageMode,f.checksum].some(value=>String(value||'').toLowerCase().includes(q)))&&(!provider||f.serviceId===provider)&&(!folder||f.category===folder)&&(!storage||storageStatus(f)===storage));result.sort(sort==='name'?(a,b)=>String(a.name).localeCompare(String(b.name)):sort==='old'?(a,b)=>(Number(a.added)||0)-(Number(b.added)||0):(a,b)=>(Number(b.added)||0)-(Number(a.added)||0));return result}
function duplicateIds(files){const seen=new Map(),duplicates=new Set();for(const file of Array.isArray(files)?files:[]){if(!file||typeof file.checksum!=='string'||!file.checksum.trim())continue;const key=String(file.checksumAlgorithm||'sha256').toLowerCase()+':'+file.checksum.trim().toLowerCase()+':'+String(file.size??'');const previous=seen.get(key);if(previous){duplicates.add(previous);duplicates.add(file.id)}else if(file.id)seen.set(key,file.id)}return duplicates}
function exportInventoryCsv(files){
 const columns=['name','category','source','sourcePath','size','storageMode','added','checksum'];
 const safeCell=value=>{let text=String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,2000);if(/^[\s]*[=+@-]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';};
 return [columns.join(','),...(Array.isArray(files)?files:[]).map(file=>columns.map(column=>safeCell(file?.[column])).join(','))].join('\r\n');
}
function counts(files){const out=Object.fromEntries(categories.map(c=>[c,0]));for(const f of Array.isArray(files)?files:[])if(f&&categories.includes(f.category))out[f.category]++;return out}
global.AIWalletModules=global.AIWalletModules||{};function filesInFolder(files,folderId){return (Array.isArray(files)?files:[]).filter(file=>(file.folderId||'')===(folderId||''))}
function folderCounts(files,folders){const result=Object.fromEntries((Array.isArray(folders)?folders:[]).map(folder=>[folder.id,0]));for(const file of Array.isArray(files)?files:[])if(file&&file.folderId&&Object.prototype.hasOwnProperty.call(result,file.folderId))result[file.folderId]++;return result}
global.AIWalletModules.files=Object.freeze({categories,category,icon,storageStatus,filterAndSort,counts,duplicateIds,exportInventoryCsv,filesInFolder,folderCounts});
})(window);

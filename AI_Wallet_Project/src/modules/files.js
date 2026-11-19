(function (global) {
'use strict';
const categories=['Images','Videos','Documents','Audio','Code','Other'];
const extensions={Images:['png','jpg','jpeg','gif','webp','svg','bmp','heic','avif'],Videos:['mp4','mov','mkv','webm','avi'],Audio:['mp3','wav','m4a','ogg','flac','aac'],Code:['js','ts','tsx','jsx','html','css','py','java','cpp','c','cs','json','xml','sh','sql','php','go','rs'],Documents:['pdf','doc','docx','txt','rtf','odt','xls','xlsx','csv','ppt','pptx','md']};
const icons={Images:'▧',Videos:'▶',Documents:'▤',Audio:'♫',Code:'‹›',Other:'•••'};
function category(name,type=''){const ext=String(name||'').split('.').pop().toLowerCase(),mime=String(type||'').toLowerCase();if(mime.startsWith('image/')||extensions.Images.includes(ext))return'Images';if(mime.startsWith('video/')||extensions.Videos.includes(ext))return'Videos';if(mime.startsWith('audio/')||extensions.Audio.includes(ext))return'Audio';if(extensions.Code.includes(ext)||mime.includes('javascript')||mime.includes('text/x-'))return'Code';if(extensions.Documents.includes(ext)||mime.startsWith('text/')||mime.includes('pdf'))return'Documents';return'Other'}
function icon(value){return icons[categories.includes(value)?value:'Other']}
function storageStatus(file){return file?.storageMode==='remote'?'linked':file?.storageMode==='backup'?'backup':'local'}
function filterAndSort(files,{query='',provider='',category:folder='',storage='',sort='new'}={}){const q=String(query).trim().toLowerCase(),result=(Array.isArray(files)?files:[]).filter(f=>f&&(!q||[f.name,f.source,f.storageMode,f.checksum].some(value=>String(value||'').toLowerCase().includes(q)))&&(!provider||f.serviceId===provider)&&(!folder||f.category===folder)&&(!storage||storageStatus(f)===storage));result.sort(sort==='name'?(a,b)=>String(a.name).localeCompare(String(b.name)):sort==='old'?(a,b)=>(Number(a.added)||0)-(Number(b.added)||0):(a,b)=>(Number(b.added)||0)-(Number(a.added)||0));return result}
function counts(files){const out=Object.fromEntries(categories.map(c=>[c,0]));for(const f of Array.isArray(files)?files:[])if(f&&categories.includes(f.category))out[f.category]++;return out}
global.AIWalletModules=global.AIWalletModules||{};function filesInFolder(files,folderId){return (Array.isArray(files)?files:[]).filter(file=>(file.folderId||'')===(folderId||''))}
function folderCounts(files,folders){const result=Object.fromEntries((Array.isArray(folders)?folders:[]).map(folder=>[folder.id,0]));for(const file of Array.isArray(files)?files:[])if(file&&file.folderId&&Object.prototype.hasOwnProperty.call(result,file.folderId))result[file.folderId]++;return result}
global.AIWalletModules.files=Object.freeze({categories,category,icon,storageStatus,filterAndSort,counts,filesInFolder,folderCounts});
})(window);

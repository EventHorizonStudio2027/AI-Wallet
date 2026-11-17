(function(global){
'use strict';
const UNSAFE_EXTENSIONS=/\.(?:html?|xhtml|svg|xml|js|mjs|wasm)$/i;
const UNSAFE_TYPES=new Set(['text/html','application/xhtml+xml','image/svg+xml','text/xml','application/xml','application/javascript','text/javascript','application/wasm']);
function canInlinePreview(file){
 if(!file||typeof file.name!=='string')return false;
 if(UNSAFE_EXTENSIONS.test(file.name.trim()))return false;
 const type=String(file.type||'').split(';')[0].trim().toLowerCase();
 return type==='application/pdf'||type.startsWith('image/')&&!UNSAFE_TYPES.has(type)||type.startsWith('audio/')||type.startsWith('video/')||type==='text/plain';
}
function safeFilename(name){
 const result=String(name||'download').replace(/[\x00-\x1f\x7f/\\]/g,'_').trim().slice(0,180);
 return result||'download';
}
global.AIWalletModules=global.AIWalletModules||{};
global.AIWalletModules.fileSafety=Object.freeze({canInlinePreview,safeFilename});
})(window);

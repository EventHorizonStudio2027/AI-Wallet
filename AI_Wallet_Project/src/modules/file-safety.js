(function(global){
'use strict';
// Only formats known to be safe to embed are allowed in the inline viewer.
// Unknown or active formats remain downloadable, never inline-rendered.
const UNSAFE_EXTENSIONS=/\.(?:html?|xhtml|svgz?|xml|js|mjs|cjs|wasm)$/i;
const PREVIEW_TYPES=new Set([
 'application/pdf','text/plain',
 'image/png','image/jpeg','image/gif','image/webp','image/avif','image/bmp',
 'audio/mpeg','audio/mp4','audio/ogg','audio/wav','audio/webm','audio/flac','audio/aac',
 'video/mp4','video/webm','video/ogg','video/quicktime'
]);
function canInlinePreview(file){
 if(!file||typeof file.name!=='string')return false;
 if(UNSAFE_EXTENSIONS.test(file.name.trim()))return false;
 const type=String(file.type||'').split(';')[0].trim().toLowerCase();
 return PREVIEW_TYPES.has(type);
}
function safeFilename(name){
 const result=String(name||'download').replace(/[\x00-\x1f\x7f/\\]/g,'_').trim().slice(0,180);
 return result||'download';
}
global.AIWalletModules=global.AIWalletModules||{};
global.AIWalletModules.fileSafety=Object.freeze({canInlinePreview,safeFilename});
})(window);

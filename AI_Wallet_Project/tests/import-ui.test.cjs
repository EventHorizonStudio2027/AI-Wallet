const assert=require('node:assert/strict');const fs=require('node:fs');
const app=fs.readFileSync('src/app.js','utf8'),html=fs.readFileSync('index.html','utf8');
for(const id of ['creatorCsvMapping','creatorCsvMappingFields','creatorCsvPreviewBtn','creatorImportConfirm'])assert.match(html,new RegExp(`id="${id}"`));
assert.match(app,/function showCreatorMapping\(/);assert.match(app,/function previewCreatorCsv\(/);assert.match(app,/preview\(pendingCreatorImport\.csv,state\.creator\.payouts,pendingCreatorImport\.options\)/);assert.match(app,/token!==creatorCsvToken/);
console.log('CSV mapping UI wiring and revalidation checks passed');

// v25 import lock is acquired before asynchronous FileReader work starts.

const sourceV25=require('node:fs').readFileSync(require('node:path').join(__dirname,'../src/app.js'),'utf8');
const handlerV25=sourceV25.slice(sourceV25.indexOf("$('#backupInput').onchange="),sourceV25.indexOf("$('#clearBtn').onclick="));
assert.ok(handlerV25.indexOf('window._walletImportBusy=true') < handlerV25.indexOf('r.readAsText(f)'), 'import lock must precede asynchronous read');
assert.match(handlerV25,/r\.onerror=\(\)=>\{window\._walletImportBusy=false/);
assert.match(handlerV25,/r\.onabort=\(\)=>\{window\._walletImportBusy=false/);

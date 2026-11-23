const assert=require('node:assert/strict');const fs=require('node:fs');
const app=fs.readFileSync('src/app.js','utf8'),html=fs.readFileSync('index.html','utf8');
for(const id of ['creatorCsvMapping','creatorCsvMappingFields','creatorCsvPreviewBtn','creatorImportConfirm'])assert.match(html,new RegExp(`id="${id}"`));
assert.match(app,/function showCreatorMapping\(/);assert.match(app,/function previewCreatorCsv\(/);assert.match(app,/preview\(pendingCreatorImport\.csv,state\.creator\.payouts,pendingCreatorImport\.options\)/);assert.match(app,/token!==creatorCsvToken/);
console.log('CSV mapping UI wiring and revalidation checks passed');

const backupHandler=app.slice(app.indexOf("$('#backupInput').onchange="),app.indexOf("$('#clearBtn').onclick="));
const lock=backupHandler.indexOf('window._walletImportBusy=true');
assert.ok(lock>=0&&lock<backupHandler.indexOf('await file.text()'),'Import lock must precede asynchronous reading');
assert.match(backupHandler,/finally\{\s*window\._walletImportBusy=false;\s*input.disabled=false/);

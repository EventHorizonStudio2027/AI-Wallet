'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'../src/app.js'),'utf8');
for(const selector of ['service','launch-service','addfor','switch']){
 assert.doesNotMatch(app,new RegExp('(?<!\\$)\\$\\(\\x27\\[data-'+selector+'\\]\\x27\\)\\.forEach'),'Single-node selector incorrectly used for '+selector);
}
console.log('Account UI selector checks passed');

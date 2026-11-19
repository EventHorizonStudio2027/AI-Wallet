'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'../src/app.js'),'utf8');
for(const selector of ['service','launch-service','addfor','switch','edit','open-account-service','account-add-selected','account-open-selected','account-toggle-filter','manage-service','forecast-review']){
 assert.doesNotMatch(app,new RegExp('(?<!\\$)\\$\\(\\x27\\[data-'+selector+'\\]\\x27\\)\\.(?:forEach|find)'),'Single-node selector incorrectly used for '+selector);
 assert.match(app,new RegExp('\\$\\$\\(\\x27\\[data-'+selector+'\\]\\x27\\)\\.(?:forEach|find)'),'Missing multi-node selector for '+selector);
}
assert.match(app,/data-account-add-selected=/,'Account hub must allow adding a selected provider profile');
assert.match(app,/data-account-open-selected=/,'Account hub must offer provider navigation');
assert.match(app,/Provider sign-in is separate from saving a profile/,'Manual account profiles must not imply authorization');
assert.match(app,/a\.id===selectedAccount&&a\.serviceId===selectedService/,'Active state must match both profile and provider');
assert.match(app,/accountProviderOnly\?state\.accounts\.filter\(a=>a\.serviceId===selectedService\):state\.accounts/,'Provider filter must restrict displayed accounts');
assert.match(app,/accountProviderOnly=!accountProviderOnly;renderAccounts\(\)/,'Provider filter must update account list');
assert.match(app,/No profiles for this provider/,'Provider-specific empty state must be visible');
assert.match(app,/data-manage-service=/,'AI directory must expose profile management');
assert.match(app,/accountProviderOnly=true;go\('accounts',\{preserveAccountFilter:true\}\);render\(\)/,'Directory must preserve selected provider filter');
assert.match(app,/if\(p==='accounts'&&!options\.preserveAccountFilter\)accountProviderOnly=false/,'Normal Accounts navigation must reset the provider filter');
assert.match(app,/data-forecast-review=/,'Payment forecast must expose subscription review');
assert.match(app,/homeAttentionExpanded\?report\.rows\.length:6/,'Dashboard must render all alerts when expanded');
assert.match(app,/data-attention-expand/,'Dashboard must provide an expand or collapse control');
assert.match(app,/homeAttentionExpanded=!homeAttentionExpanded;renderHomeAttention\(\)/,'Alert expansion must rerender the dashboard');
assert.match(app,/\$\$\('\[data-home-attention\]'\)\.forEach/,'Dashboard review buttons must use multi-element selection');
assert.match(app,/\$\$\('\[data-attention-expand\]'\)\.forEach/,'Dashboard expand buttons must use multi-element selection');
assert.doesNotMatch(app,/(?<!\$)\$\('\[data-(?:home-attention|attention-expand)\]'\)\.forEach/,'Dashboard controls must not regress to single-element selectors');
assert.match(app,/attention-type-\$\{esc\(row\.kind\)\}/,'Attention feed must visually distinguish alert types');
console.log('DomAIn account UI smoke checks passed');

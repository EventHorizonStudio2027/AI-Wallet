'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'../src/app.js'),'utf8');
assert.match(app,/name:'Flow',domain:'labs\.google'.*url:'https:\/\/labs\.google\/fx\/tools\/flow'/,'Google Flow must use its official landing page');
assert.match(app,/name:'Flow Music',domain:'www\.flowmusic\.app'.*url:'https:\/\/www\.flowmusic\.app\/'/,'Google Flow Music must have a separate website and favicon');
assert.match(app,/function serviceLaunchUrl\(s\)/,'Service links must be normalized');
assert.match(app,/url\.protocol!=='https:'/,'Only HTTPS service destinations are allowed');
assert.match(app,/window\.location\.assign\(url\)/,'Provider navigation must use same-tab navigation, not popups');


assert.match(app,/accountProviderOnly=true;page='accounts';render\(\)/,'Top icons must open provider-filtered account hub');
assert.match(app,/existing\?\.id\|\|first\?\.id\|\|''/,'Top icons must preserve the selected provider account');
assert.match(app,/go\('home'\);render\(\)/,'Switching account must refresh displayed account information');
assert.match(app,/const chosen=state\.accounts\.find\(a=>a\.id===b\.dataset\.switch\)/,'Account switching must resolve a valid profile');
assert.match(app,/data-open-account-service/,'Account profiles must provide direct provider navigation');
assert.match(app,/data-switch="\$\{esc\(a\.id\)\}"/,'Account action IDs must be escaped');
assert.match(app,/aria-current="true"/,'Active account must be indicated accessibly');
assert.match(app,/\$\$\('\[data-open-account-service\]'\)\.forEach/,'Every provider action must be wired');

assert.match(app,/data-launch-service/,'AI directory must offer Open / Sign in');
assert.match(app,/entry\.id==='flow'\|\|entry\.id==='flowmusic'/,'Existing saved Flow destinations must migrate');
assert.match(app,/\$\$\('\[data-launch-service\]'\)\.forEach/,'Every service launch button must receive a handler');
assert.match(app,/\$\$\('\[data-addfor\]'\)\.forEach/,'Every Add Account button must receive a handler');
assert.match(app,/data-delservice="\$\{esc\(s\.id\)\}"/,'Custom service action identifiers must be escaped');
assert.match(app,/x\.files\.length>10000/,'Restored library must respect the same file limit as imports');
assert.match(app,/\$\$\('\[data-service\]'\)\.forEach/,'Every home service card must receive a click handler');
assert.match(app,/url\.hostname\.endsWith\('\.internal'\)/,'Internal hosts must not be accepted as sign-in destinations');
assert.match(app,/\$\$\('\[data-service\]'\)\.forEach/,'All service cards must be wired');
assert.match(app,/\$\$\('\[data-switch\]'\)\.forEach/,'All account Switch buttons must receive handlers');
assert.match(app,/\.sort\(\(a,b\)=>Number\(b\.serviceId===selectedService\)-Number\(a\.serviceId===selectedService\)\)/,'Selected service profiles must appear first');
assert.match(app,/Manually tracked profile/,'Account profiles must not be misrepresented as OAuth connections');
assert.match(app,/No automatic sync/,'Service directory must disclose the absence of automatic sync');
assert.doesNotMatch(app,/(?<!\$)\$\('\[data-(?:service|launch-service|addfor|switch)\]'\)\.forEach/,'A single-element selector cannot attach multiple action handlers');
console.log('DomAIn service launch and Google Flow destination checks passed.');

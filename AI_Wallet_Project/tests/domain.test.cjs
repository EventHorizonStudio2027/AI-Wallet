const fs=require('fs'),vm=require('vm'),assert=require('assert');
const context={window:{}};vm.createContext(context);
for(const f of ['src/modules/creator.js','src/modules/billing.js','src/modules/intelligence.js','src/modules/memory.js', 'src/modules/accounts.js','src/modules/files.js','src/modules/storage.js','src/modules/backup.js','src/modules/events.js'])vm.runInContext(fs.readFileSync(f,'utf8'),context,{filename:f});
const {billing,memory}=context.window.AIWalletModules;
assert.strictEqual(billing.monthlyEquivalent(20,'monthly'),20);
assert.strictEqual(billing.monthlyEquivalent(120,'yearly'),10);
assert(Math.abs(billing.monthlyEquivalent(10,'weekly')-10*52/12)<1e-9);
assert.strictEqual(billing.monthlyEquivalent(100,'one-time'),0);
const summary=billing.summarize([{cost:20,billingCycle:'monthly'},{cost:120,billingCycle:'yearly'},{cost:10,billingCycle:'weekly'},{cost:99,billingCycle:'one-time'}]);
assert.strictEqual(summary.recurringCount,3);assert(Math.abs(summary.monthly-(20+10+10*52/12))<1e-9);
assert.strictEqual(memory.metrics(80,100,80).status,'warning');
assert.strictEqual(memory.metrics(96,100,80).status,'critical');
assert.strictEqual(memory.metrics(25,100,80).remaining,75);
assert.strictEqual(memory.metrics(1,0,80).configured,false);
assert.deepStrictEqual(memory.snapshotsInRange([{at:30},{at:10},{at:20}],15,30).map(x=>x.at),[20,30]);
console.log('Domain tests passed: billing conversions, cost summaries, context thresholds, remaining capacity, and history ranges.');

const {accounts}=context.window.AIWalletModules;
const profiles=[{id:'a1',serviceId:'chatgpt',used:10,capacity:100,cost:20,billingCycle:'monthly'},{id:'a2',serviceId:'claude',used:null,capacity:null,cost:0,billingCycle:'free'}];
assert.strictEqual(accounts.findById(profiles,'a2').serviceId,'claude');
assert.strictEqual(accounts.forService(profiles,'chatgpt').length,1);
assert.strictEqual(accounts.resolveActive(profiles,'missing','claude').id,'a2');
assert.deepStrictEqual(JSON.parse(JSON.stringify(accounts.totals(profiles))),{count:2,withUsage:1,withSubscription:1});
console.log('Account domain tests passed: lookup, provider filtering, active selection, and account totals.');

const {files}=context.window.AIWalletModules;
assert.strictEqual(files.category('photo.PNG',''),'Images');
assert.strictEqual(files.category('clip.mp4',''),'Videos');
assert.strictEqual(files.category('snippet.ts',''),'Code');
assert.strictEqual(files.category('unknown.bin','application/octet-stream'),'Other');
assert.strictEqual(files.icon('Audio'),'♫');
const fileRows=[{name:'z.png',category:'Images',serviceId:'p1',added:3},{name:'a.pdf',category:'Documents',serviceId:'p2',added:1},{name:'b.png',category:'Images',serviceId:'p1',added:2}];
assert.deepStrictEqual(files.filterAndSort(fileRows,{provider:'p1',category:'Images',sort:'old'}).map(f=>f.name),['b.png','z.png']);
assert.strictEqual(files.counts(fileRows).Images,2);
console.log('File domain tests passed: categorization, icons, filters, sorting, and category counts.');

const {storage}=context.window.AIWalletModules;
for (const method of ['open','putFile','getFile','deleteFile','listFileKeys','clearFiles','writeUsage','replaceUsage','readUsage','diagnostics']) assert.strictEqual(typeof storage[method],'function');
storage.open().then(()=>{throw new Error('Expected IndexedDB-unavailable test to reject')}).catch(error=>{
 assert.match(error.message,/IndexedDB unavailable/);
 console.log('Storage module tests passed: API surface and unavailable-storage failure handling.');
});

const {backup}=context.window.AIWalletModules;
assert.strictEqual(backup.createEnvelope({accounts:[],files:[1]}).files.length,0);
assert.strictEqual(backup.isBase64DataUrl('data:image/png;base64,aGVsbG8='),true);
assert.strictEqual(backup.isBase64DataUrl('data:image/png;base64,not valid!'),false);
assert.throws(()=>backup.validateBackup({schemaVersion:99,files:[]}),/Unsupported backup/);
assert.throws(()=>backup.validateBackup({schemaVersion:5,services:[],accounts:[],files:[{id:'x',name:'x'},{id:'x',name:'x'}]}),/duplicate/);
assert.throws(()=>backup.validateBackup({schemaVersion:5,services:[],accounts:[],files:[{id:'x',name:'x',data:'bad'}]}),/Invalid file data/);
assert.strictEqual(backup.validateBackup({schemaVersion:5,services:[],accounts:[],files:[{id:'x',name:'x',data:'data:text/plain;base64,aGk='}]}).fileCount,1);
console.log('Backup module tests passed: envelope creation, schema validation, duplicate detection, and payload validation.');

const folderFiles=[{id:'f1',folderId:'work'},{id:'f2',folderId:'personal'},{id:'f3',folderId:'work'},{id:'f4'}];
assert.deepStrictEqual(files.filesInFolder(folderFiles,'work').map(f=>f.id),['f1','f3']);
assert.deepStrictEqual(JSON.parse(JSON.stringify(files.folderCounts(folderFiles,[{id:'work'},{id:'personal'},{id:'empty'}]))),{work:2,personal:1,empty:0});
const {events}=context.window.AIWalletModules;let seen=[];
const unsubscribe=events.on('wallet:test',detail=>seen.push(detail.value));
assert.strictEqual(events.emit('wallet:test',{value:7}),1);
assert.strictEqual(events.off('wallet:test',()=>{}),false);
unsubscribe();assert.strictEqual(events.emit('wallet:test',{value:8}),0);
assert.deepStrictEqual(seen,[7]);
console.log('Folder and event tests passed: folder membership/counts and event subscription lifecycle.');

assert.strictEqual(billing.daysUntil('2026-11-20','2026-11-16'),4);
assert.strictEqual(billing.daysUntil('2026-02-30','2026-02-01'),null);
const trialAccount={id:'trial',trialEnabled:true,trialStatus:'active',trialStart:'2026-11-01',trialDays:14,trialEnd:'2026-11-15',cancelBy:'2026-11-14',alertDays:7,billingCycle:'monthly',cost:20,renewalDate:'2026-11-15'};
const notices=billing.alerts([trialAccount],'2026-11-12');
assert.deepStrictEqual(Array.from(notices,n=>n.type),['trial_cancel','trial_end']);
assert.strictEqual(billing.alerts([{...trialAccount,trialStatus:'cancelled',renewalDate:''}],'2026-11-12').length,0);
assert.strictEqual(billing.alerts([{id:'paid',cost:30,billingCycle:'monthly',renewalDate:'2026-11-19',alertDays:7}],'2026-11-16')[0].type,'renewal');
console.log('Trial and renewal tests passed: deadlines, invalid dates, cancellation, duplicate suppression, payment windows.');

const creator=context.window.AIWalletModules.creator;
const c=creator.normalize({goal:5000,agreements:[{id:'a',client:'Brand',amount:1200,cadence:'monthly',status:'active'},{id:'b',amount:1200,cadence:'yearly',status:'active'},{id:'c',amount:999,cadence:'one-time',status:'active'}],payouts:[{id:'p',client:'Brand',amount:400,dueDate:'2026-11-12',status:'received'},{id:'q',amount:300,dueDate:'2026-11-30',status:'pending'}]});
const r=creator.report(c,'2026-11-16');
assert.strictEqual(r.received,400);assert.strictEqual(r.outstanding,300);assert.strictEqual(r.expected,700);assert.strictEqual(r.contractedMonthly,1300);assert.strictEqual(r.forecast[2].month,'2027-01');
assert.strictEqual(creator.normalize({agreements:[{id:'dup'},{id:'dup'}]}).agreements.length,1);
assert.throws(()=>creator.report(c,'2026-02-30'));
console.log('Creator tests passed: payout reconciliation, recurring normalization, goal, rollover, malformed dates, duplicate records.');

const intel=context.window.AIWalletModules.intelligence;
assert.strictEqual(intel.shiftMonth('2026-01-31',1),'2026-02-28');
assert.strictEqual(intel.shiftMonth('2028-01-31',1),'2028-02-29');
assert.deepStrictEqual(Array.from(intel.dueDates({status:'active',cadence:'monthly',nextDue:'2026-01-31'},'2026-02-01','2026-04-30')),['2026-02-28','2026-03-31','2026-04-30']);
assert.strictEqual(intel.dueDates({status:'paused',cadence:'monthly',nextDue:'2026-11-20'},'2026-11-01','2026-12-31').length,0);
const forecast=intel.cashForecast({agreements:[{id:'x',client:'Sponsor',amount:1000,cadence:'monthly',status:'active',nextDue:'2026-11-30'}],payouts:[{id:'p',amount:1000,dueDate:'2026-11-30',status:'pending'}]},'2026-11-16');
assert.strictEqual(forecast.months[0].scheduled,1000);assert.strictEqual(forecast.months[0].pending,1000);
assert.strictEqual(forecast.months[1].scheduled,1000);assert.strictEqual(forecast.months[2].scheduled,1000);
assert.strictEqual(intel.actionQueue({payouts:[{id:'p',client:'Late',amount:20,dueDate:'2026-11-10',status:'pending'}]},[],'2026-11-16')[0].kind,'payout_overdue');
assert.strictEqual(intel.reconciliation({payouts:[{id:'p',status:'received',reference:'INV1'},{id:'q',status:'received',reference:'inv1'}]}).duplicateReferences.length,1);
assert.throws(()=>intel.cashForecast({},'2026-02-30'));
console.log('Intelligence tests passed: anchored recurrence, leap years, separated cash outlook, overdue queue and duplicate-reference detection.');

const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');const window={};vm.runInNewContext(fs.readFileSync('src/modules/calendar-export.js','utf8'),{window,unescape,encodeURIComponent});const c=window.AIWalletModules.calendarExport;
assert.equal(c.parseDate('2026-02-30'),null);assert.equal(c.addDays('2028-02-28',1),'2028-02-29');assert.equal(c.addDays('2026-12-31',1),'2027-01-01');
const trial={id:'abc',label:'Example,\nStudio',trialEnabled:true,trialStatus:'active',cancelBy:'2026-11-18',trialEnd:'2026-11-20',renewalDate:'2026-11-20',cost:20,billingCycle:'monthly'};
const events=c.calendarEvents([trial]);assert.equal(events.length,2);assert.equal(c.calendarEvents([{...trial,trialStatus:'cancelled'}]).length,1);
const out=c.generate([trial],'2026-11-16T12:00:00Z');assert.equal((out.match(/BEGIN:VEVENT/g)||[]).length,2);assert.ok(out.includes('DTEND;VALUE=DATE:20261119'));assert.ok(out.includes('TRIGGER:-P1D'));assert.ok(out.includes('Example\\,\\nStudio'));assert.ok(!out.includes('Subscription renewal'));
assert.equal(c.calendarEvents([{...trial,trialEnabled:false,renewalDate:'2026-02-30'}]).length,0);
assert.ok(c.generate([{...trial,trialEnabled:false,renewalDate:'2026-12-31'}]).includes('DTEND;VALUE=DATE:20270101'));
console.log('Calendar export tests passed');

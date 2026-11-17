(function (global) {
'use strict';
function findById(accounts,id) {
 return (Array.isArray(accounts)?accounts:[]).find(account=>account&&account.id===id)||null;
}
function forService(accounts,serviceId) {
 return (Array.isArray(accounts)?accounts:[]).filter(account=>account&&account.serviceId===serviceId);
}
function resolveActive(accounts,selectedAccount,selectedService) {
 const list=Array.isArray(accounts)?accounts:[];
 return findById(list,selectedAccount)||list.find(account=>account&&account.serviceId===selectedService)||null;
}
function totals(accounts) {
 const list=Array.isArray(accounts)?accounts:[];
 return {
  count:list.length,
  withUsage:list.filter(a=>a&&a.used!=null&&a.capacity>0).length,
  withSubscription:list.filter(a=>a&&Number(a.cost)>0&&['monthly','yearly','weekly'].includes(a.billingCycle)).length
 };
}
global.AIWalletModules=global.AIWalletModules||{};
global.AIWalletModules.accounts=Object.freeze({findById,forService,resolveActive,totals});
})(window);

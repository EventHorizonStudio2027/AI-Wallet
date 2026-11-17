(function (global) {
'use strict';
function metrics(used,capacity,warningAt) {
 const u=Number(used),c=Number(capacity);
 if(!Number.isFinite(u)||!Number.isFinite(c)||c<=0||u<0)return {configured:false,percent:null,remaining:null,status:'unconfigured'};
 const percent=Math.min(100,Math.max(0,u/c*100)),threshold=Number.isFinite(Number(warningAt))?Number(warningAt):80;
 return {configured:true,percent,remaining:Math.max(0,c-u),status:percent>=95?'critical':percent>=threshold?'warning':'healthy'};
}
function snapshotsInRange(history,from,to) {
 const start=Number(from)||0,end=Number(to)||Number.MAX_SAFE_INTEGER;
 return (Array.isArray(history)?history:[]).filter(x=>x&&Number.isFinite(Number(x.at))&&Number(x.at)>=start&&Number(x.at)<=end).slice().sort((a,b)=>Number(a.at)-Number(b.at));
}
global.AIWalletModules=global.AIWalletModules||{};
global.AIWalletModules.memory=Object.freeze({metrics,snapshotsInRange});
})(window);

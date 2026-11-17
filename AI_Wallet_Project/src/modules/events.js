(function(global){
'use strict';
const listeners=new Map();
function on(name,handler){if(typeof name!=='string'||!name||typeof handler!=='function')throw new TypeError('Event name and handler are required');if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(handler);return ()=>off(name,handler)}
function off(name,handler){const set=listeners.get(name);if(!set)return false;const removed=set.delete(handler);if(!set.size)listeners.delete(name);return removed}
function emit(name,detail){const set=listeners.get(name);if(!set)return 0;let delivered=0;for(const handler of [...set]){try{handler(detail);delivered++}catch(error){setTimeout(()=>{throw error},0)}}return delivered}
function clear(name){if(name)listeners.delete(name);else listeners.clear()}
global.AIWalletModules=global.AIWalletModules||{};global.AIWalletModules.events=Object.freeze({on,off,emit,clear});
})(window);

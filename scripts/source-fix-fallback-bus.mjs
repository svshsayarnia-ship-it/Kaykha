import fs from 'node:fs';
const file='api/kaykha-shared-engine-client.js';
const before=fs.readFileSync(file,'utf8');
const needle="function startFallbackPolling(){if(fallbackTimer)return;fallbackTimer=setInterval(()=>{if(document.hidden)return;syncState('Fallback Sync','bad');window.dispatchEvent(new Event('focus'));refreshMeta().catch(()=>{});},15000);}";
const replacement="function startFallbackPolling(){if(fallbackTimer)return;fallbackTimer=setInterval(()=>{if(document.hidden)return;syncState('Fallback Sync','bad');window.dispatchEvent(new CustomEvent('kaykha:server-sync-request'));refreshMeta().catch(()=>{});},15000);}";
if(!before.includes(needle))throw new Error('fallback focus pattern missing');
if(before.indexOf(needle)!==before.lastIndexOf(needle))throw new Error('fallback focus pattern ambiguous');
fs.writeFileSync(file,before.replace(needle,replacement));
console.log('fallback sync now uses kaykha:server-sync-request');

import fs from 'node:fs';
const file='api/kaykha-mobile-linear-v4.js';
const before=fs.readFileSync(file,'utf8');
const needle="function isPractice() { return new URLSearchParams(location.search).get('mode') !== 'online'; }";
const replacement="function isPractice() { return new URLSearchParams(location.search).get('mode') === 'practice'; }";
if(!before.includes(needle))throw new Error('mobile implicit Practice detector missing');
if(before.indexOf(needle)!==before.lastIndexOf(needle))throw new Error('mobile Practice detector ambiguous');
fs.writeFileSync(file,before.replace(needle,replacement));
console.log('mobile runtime mode canonicalized');

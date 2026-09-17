import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function edit(file, transform) {
  const full = path.join(root, file);
  const before = fs.readFileSync(full, 'utf8');
  const after = transform(before);
  if (after === before) throw new Error(`No source change produced for ${file}`);
  fs.writeFileSync(full, after);
  console.log(`normalized ${file}`);
}

function once(source, needle, replacement, label) {
  const first = source.indexOf(needle);
  if (first < 0) throw new Error(`missing ${label}`);
  if (source.indexOf(needle, first + needle.length) >= 0) throw new Error(`ambiguous ${label}`);
  return source.slice(0, first) + replacement + source.slice(first + needle.length);
}

function allRequired(source, needle, replacement, label, min = 1) {
  const count = source.split(needle).length - 1;
  if (count < min) throw new Error(`missing ${label}`);
  return source.replaceAll(needle, replacement);
}

edit('api/kaykha-shared-engine-client.js', source => {
  source = once(
    source,
    "function isPracticeUrl(){return new URLSearchParams(location.search).get('mode')!=='online'}",
    "function isPracticeUrl(){return new URLSearchParams(location.search).get('mode')==='practice'}",
    'shared engine runtime mode'
  );
  source = once(source, 'const url=new URL(location.href);', 'const url=new globalThis.URL(location.href);', 'shared engine URL constructor');
  return source;
});

edit('api/kaykha-phase5-interaction-fix.js', source => {
  source = once(
    source,
    "const isPractice = () => new URLSearchParams(location.search).get('mode') !== 'online';",
    "const isPractice = () => new URLSearchParams(location.search).get('mode') === 'practice';",
    'interaction runtime mode'
  );
  const seedPairs = [
    ["isfahan:{label:'اصفهان',strength:4,economy:4}", "isfahan:{label:'اصفهان',strength:5,economy:4}"],
    ["nishapur:{label:'نیشابور',strength:3,economy:5}", "nishapur:{label:'نیشابور',strength:3,economy:3}"],
    ["ctesiphon:{label:'تیسفون',strength:5,economy:5}", "ctesiphon:{label:'تیسفون',strength:4,economy:5}"],
    ["alamut:{label:'الموت',strength:4,economy:2}", "alamut:{label:'الموت',strength:4,economy:3}"],
    ["shiraz:{label:'شیراز',strength:4,economy:5}", "shiraz:{label:'شیراز',strength:4,economy:4}"],
    ["zaranj:{label:'زرنج',strength:3,economy:3}", "zaranj:{label:'زرنج',strength:3,economy:4}"],
    ["yazd:{label:'یزد',strength:2,economy:3}", "yazd:{label:'یزد',strength:3,economy:4}"],
    ["bam:{label:'بم',strength:2,economy:3}", "bam:{label:'بم',strength:3,economy:3}"]
  ];
  for (const [needle,replacement] of seedPairs) source = once(source,needle,replacement,`Practice seed ${needle}`);
  source = allRequired(
    source,
    'renderResources({ coins:50, influence:10, authoritative:false, fallback:true })',
    'renderResources({ coins:44, influence:7, authoritative:false, fallback:true })',
    'Practice fallback resources',
    2
  );
  return source;
});

edit('index.js', source => {
  const block = "    // Practice is local-first in presentation: never leave the mobile resource bar on a dash while sync warms up.\n    bodies.interaction = bodies.interaction.replaceAll('renderResources({ coins:50, influence:10, authoritative:false, fallback:true })', 'renderResources({ coins:50, influence:15, authoritative:false, fallback:true })');\n\n";
  return once(source, block, '', 'legacy Practice resource bundle rewrite');
});

edit('api/kaykha-online.js', source => {
  source = once(
    source,
    "    const member = state.members.find(item => identity.includes(String(item.user_id || '')));",
    "    const memberId = identity.startsWith('member-') ? identity.slice('member-'.length) : '';\n    const member = state.members.find(item => String(item.id || '') === memberId || identity.includes(String(item.user_id || '')));",
    'voice participant membership mapping'
  );
  source = once(
    source,
    "    window.dispatchEvent(new CustomEvent('kaykha:lobby-success', { detail: { kind: 'create', gameId: rows[0].game_id, code: rows[0].game_code } }));\n  }",
    "    window.dispatchEvent(new CustomEvent('kaykha:lobby-success', { detail: { kind: 'create', gameId: rows[0].game_id, code: rows[0].game_code } }));\n    await connectVoice();\n  }",
    'host automatic voice connection'
  );
  return source;
});

console.log('QA source normalization complete');

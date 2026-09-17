const indexHandler = require('../index.js');

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Kaykha hardened bundle contract changed: ${label}`);
  return source.replace(needle, replacement);
}

function replaceAllRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Kaykha hardened bundle contract changed: ${label}`);
  return source.replaceAll(needle, replacement);
}

module.exports = async function hardenedOnline(request, response) {
  let body = '';
  const headers = {};
  const capture = {
    statusCode: 200,
    setHeader(name, value) { headers[String(name).toLowerCase()] = value; },
    getHeader(name) { return headers[String(name).toLowerCase()]; },
    write(chunk) { if (chunk != null) body += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk); },
    end(chunk) { if (chunk != null) body += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk); },
    status(code) { this.statusCode = code; return this; },
    send(chunk) { this.end(chunk); return this; }
  };

  await indexHandler(request, capture);

  if (capture.statusCode !== 200) {
    response.statusCode = capture.statusCode;
    for (const [name, value] of Object.entries(headers)) response.setHeader(name, value);
    response.end(body);
    return;
  }

  body = replaceRequired(
    body,
    "    const member = state.members.find(item => identity.includes(String(item.user_id || '')));",
    "    const memberId = identity.startsWith('member-') ? identity.slice('member-'.length) : '';\n    const member = state.members.find(item => String(item.id || '') === memberId || identity.includes(String(item.user_id || '')));",
    'voice participant membership mapping'
  );

  body = replaceRequired(
    body,
    "    window.dispatchEvent(new CustomEvent('kaykha:lobby-success', { detail: { kind: 'create', gameId: rows[0].game_id, code: rows[0].game_code } }));\n  }",
    "    window.dispatchEvent(new CustomEvent('kaykha:lobby-success', { detail: { kind: 'create', gameId: rows[0].game_id, code: rows[0].game_code } }));\n    await connectVoice();\n  }",
    'host automatic voice connection'
  );

  // Runtime mode is explicit everywhere: only ?mode=practice enables Practice.
  // A bare URL is Online, so no presentation layer may infer Practice from the
  // absence of ?mode=online.
  body = replaceRequired(
    body,
    "    function isPracticeUrl(){return new URLSearchParams(location.search).get('mode')!=='online'}",
    "    function isPracticeUrl(){return new URLSearchParams(location.search).get('mode')==='practice'}",
    'shared engine explicit practice mode only'
  );
  body = replaceRequired(
    body,
    "    const isPractice = () => new URLSearchParams(location.search).get('mode') !== 'online';",
    "    const isPractice = () => new URLSearchParams(location.search).get('mode') === 'practice';",
    'interaction layer explicit practice mode only'
  );

  // Practice presentation must mirror create_kaykha_practice_game exactly.
  // Never advertise resources or city stats that the authoritative resolver does
  // not actually own.
  body = replaceAllRequired(
    body,
    'renderResources({ coins:50, influence:15, authoritative:false, fallback:true })',
    'renderResources({ coins:44, influence:7, authoritative:false, fallback:true })',
    'practice resource fallback parity'
  );
  const practiceSeedPatches = [
    ["isfahan:{label:'اصفهان',strength:4,economy:4}", "isfahan:{label:'اصفهان',strength:5,economy:4}"],
    ["nishapur:{label:'نیشابور',strength:3,economy:5}", "nishapur:{label:'نیشابور',strength:3,economy:3}"],
    ["ctesiphon:{label:'تیسفون',strength:5,economy:5}", "ctesiphon:{label:'تیسفون',strength:4,economy:5}"],
    ["alamut:{label:'الموت',strength:4,economy:2}", "alamut:{label:'الموت',strength:4,economy:3}"],
    ["shiraz:{label:'شیراز',strength:4,economy:5}", "shiraz:{label:'شیراز',strength:4,economy:4}"],
    ["zaranj:{label:'زرنج',strength:3,economy:3}", "zaranj:{label:'زرنج',strength:3,economy:4}"],
    ["yazd:{label:'یزد',strength:2,economy:3}", "yazd:{label:'یزد',strength:3,economy:4}"],
    ["bam:{label:'بم',strength:2,economy:3}", "bam:{label:'بم',strength:3,economy:3}"]
  ];
  for (const [needle, replacement] of practiceSeedPatches) {
    body = replaceRequired(body, needle, replacement, `practice city seed parity: ${needle}`);
  }

  // sharedEngineClient defines a local string named URL, so using `new URL(...)`
  // in that same scope calls the string instead of the browser URL constructor.
  body = replaceRequired(
    body,
    "const url=new URL(location.href);",
    "const url=new globalThis.URL(location.href);",
    'shared engine URL constructor shadowing'
  );

  response.statusCode = 200;
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.setHeader('x-robots-tag', 'noindex');
  response.end(body);
};
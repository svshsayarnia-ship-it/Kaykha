const indexHandler = require('../index.js');

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Kaykha hardened bundle contract changed: ${label}`);
  return source.replace(needle, replacement);
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

  response.statusCode = 200;
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.setHeader('x-robots-tag', 'noindex');
  response.end(body);
};

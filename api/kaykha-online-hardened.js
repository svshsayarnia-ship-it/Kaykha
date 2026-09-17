const indexHandler = require('../index.js');

function invariant(condition, label) {
  if (!condition) throw new Error(`Kaykha hardened bundle invariant failed: ${label}`);
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

  // Hardening is intentionally validation-only. Canonical source modules own
  // behavior; this endpoint must never mutate the assembled runtime with string
  // replacement patches again.
  invariant(!/get\(['"]mode['"]\)\s*!==\s*['"]online['"]/.test(body), 'legacy implicit Practice detection returned');
  const practiceChecks = body.match(/get\(['"]mode['"]\)\s*===\s*['"]practice['"]/g) || [];
  invariant(practiceChecks.length >= 2, 'shared engine and interaction runtime mode diverged');
  invariant(body.includes('const url=new globalThis.URL(location.href);'), 'shared-engine URL constructor safety missing');
  invariant(body.includes("const memberId = identity.startsWith('member-') ? identity.slice('member-'.length) : '';"), 'voice participant member-id mapping missing');
  invariant(body.includes("await connectVoice();\n  }"), 'host automatic voice connection missing');
  invariant(body.includes('renderResources({ coins:44, influence:7, authoritative:false, fallback:true })'), 'Practice resource parity missing');
  invariant(!body.includes('renderResources({ coins:50, influence:15, authoritative:false, fallback:true })'), 'legacy Practice resource fallback returned');

  response.statusCode = 200;
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.setHeader('x-robots-tag', 'noindex');
  response.end(body);
};
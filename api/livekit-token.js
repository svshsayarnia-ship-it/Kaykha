const crypto = require('crypto');

function base64url(value) {
  return Buffer.from(value).toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(payload, secret) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const unsigned = header + '.' + body;
  const signature = crypto.createHmac('sha256', secret).update(unsigned).digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return unsigned + '.' + signature;
}

function cleanEnv(value) {
  const trimmed = String(value || '').trim();
  if (trimmed.length >= 2 && ((trimmed[0] === '"' && trimmed.at(-1) === '"') || (trimmed[0] === "'" && trimmed.at(-1) === "'"))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

async function readJson(request) {
  let raw = '';
  for await (const chunk of request) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

module.exports = async function livekitToken(request, response) {
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.setHeader('cache-control', 'no-store');
  response.setHeader('access-control-allow-origin', request.headers?.origin || '*');
  response.setHeader('access-control-allow-headers', 'content-type');
  response.setHeader('access-control-allow-methods', 'POST, OPTIONS');

  if (request.method === 'OPTIONS') {
    response.statusCode = 204;
    response.end();
    return;
  }
  if (request.method !== 'POST') {
    response.statusCode = 405;
    response.end(JSON.stringify({ error: 'POST required' }));
    return;
  }

  try {
    const apiKey = cleanEnv(process.env.LIVEKIT_API_KEY);
    const apiSecret = cleanEnv(process.env.LIVEKIT_API_SECRET);
    const livekitUrl = cleanEnv(process.env.LIVEKIT_URL).replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
    if (!apiKey || !apiSecret || !livekitUrl) {
      throw new Error('LiveKit environment is not configured');
    }
    const input = await readJson(request);
    const room = String(input.room || '').trim();
    const identity = String(input.identity || '').trim();
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(room) || !/^[A-Za-z0-9_-]{1,80}$/.test(identity)) {
      response.statusCode = 400;
      response.end(JSON.stringify({ error: 'Invalid room or identity' }));
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const token = signJwt({
      iss: apiKey,
      sub: identity,
      nbf: now - 10,
      exp: now + 3600,
      video: {
        room,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true
      }
    }, apiSecret);

    response.statusCode = 200;
    response.end(JSON.stringify({ token, url: livekitUrl }));
  } catch (error) {
    console.error('livekit token failed', error);
    response.statusCode = 500;
    response.end(JSON.stringify({ error: 'LiveKit is not configured' }));
  }
};

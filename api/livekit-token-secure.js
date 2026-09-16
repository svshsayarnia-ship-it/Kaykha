const crypto = require('crypto');

const SUPABASE_URL = 'https://uwhfxmiguugujcomwmds.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';

function base64url(value) {
  return Buffer.from(value).toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(payload, secret) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const unsigned = `${header}.${body}`;
  const signature = crypto.createHmac('sha256', secret).update(unsigned).digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${unsigned}.${signature}`;
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

function bearer(request) {
  const value = String(request.headers?.authorization || '');
  return value.startsWith('Bearer ') ? value.slice(7).trim() : '';
}

function jwtSub(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return String(JSON.parse(Buffer.from(payload, 'base64').toString('utf8')).sub || '');
  } catch (_) {
    return '';
  }
}

async function verifyMembership(gameId, token, userId) {
  const params = new URLSearchParams({
    game_id: `eq.${gameId}`,
    user_id: `eq.${userId}`,
    select: 'id,user_id,display_name,seat_no',
    limit: '1'
  });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/kaykha_members?${params.toString()}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` }
  });
  const rows = await response.json().catch(() => []);
  if (!response.ok) return null;
  return Array.isArray(rows) ? rows[0] || null : null;
}

module.exports = async function livekitTokenSecure(request, response) {
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.setHeader('cache-control', 'no-store');
  response.setHeader('access-control-allow-origin', request.headers?.origin || '*');
  response.setHeader('access-control-allow-headers', 'content-type, authorization');
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
    if (!apiKey || !apiSecret || !livekitUrl) throw new Error('LiveKit environment is not configured');

    const input = await readJson(request);
    const gameId = String(input.gameId || '').trim();
    const token = bearer(request);
    const userId = jwtSub(token);
    if (!/^[0-9a-fA-F-]{36}$/.test(gameId) || !token || !userId) {
      response.statusCode = 401;
      response.end(JSON.stringify({ error: 'Hall identity is required' }));
      return;
    }

    const member = await verifyMembership(gameId, token, userId);
    if (!member) {
      response.statusCode = 403;
      response.end(JSON.stringify({ error: 'Not a member of this hall' }));
      return;
    }

    const room = `kaykha-${gameId.replace(/[^A-Za-z0-9_-]/g, '')}`.slice(0, 80);
    const identity = `player-${userId.replace(/[^A-Za-z0-9_-]/g, '')}`.slice(0, 80);
    const now = Math.floor(Date.now() / 1000);
    const livekitToken = signJwt({
      iss: apiKey,
      sub: identity,
      nbf: now - 10,
      exp: now + 3600,
      name: String(member.display_name || 'فرمانده').slice(0, 80),
      video: { room, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true }
    }, apiSecret);

    response.statusCode = 200;
    response.end(JSON.stringify({ token: livekitToken, url: livekitUrl, room, identity }));
  } catch (error) {
    console.error('secure livekit token failed', error);
    response.statusCode = 500;
    response.end(JSON.stringify({ error: 'Voice hall is temporarily unavailable' }));
  }
};
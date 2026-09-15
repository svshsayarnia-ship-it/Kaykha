const crypto = require('crypto');

const SUPABASE_URL = 'https://uwhfxmiguugujcomwmds.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';
const GAME_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function sameOrigin(request) {
  const origin = String(request.headers?.origin || '').trim();
  if (!origin) return null;
  const host = String(request.headers?.['x-forwarded-host'] || request.headers?.host || '').trim();
  if (!host) return false;
  try {
    const parsed = new URL(origin);
    return parsed.host === host && (parsed.protocol === 'https:' || parsed.hostname === 'localhost');
  } catch (_) {
    return false;
  }
}

function setCors(request, response) {
  const origin = String(request.headers?.origin || '').trim();
  if (origin && sameOrigin(request)) response.setHeader('access-control-allow-origin', origin);
  response.setHeader('vary', 'Origin');
  response.setHeader('access-control-allow-headers', 'content-type, authorization');
  response.setHeader('access-control-allow-methods', 'POST, OPTIONS');
}

function send(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.end(JSON.stringify(body));
}

async function verifySupabaseUser(accessToken) {
  const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${accessToken}`
    }
  });
  if (!authResponse.ok) return null;
  const user = await authResponse.json().catch(() => null);
  return user?.id ? user : null;
}

async function findMembership(accessToken, gameId, userId) {
  const params = new URLSearchParams({
    game_id: `eq.${gameId}`,
    user_id: `eq.${userId}`,
    select: 'id,display_name',
    limit: '1'
  });
  const membershipResponse = await fetch(`${SUPABASE_URL}/rest/v1/kaykha_members?${params.toString()}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${accessToken}`
    }
  });
  if (!membershipResponse.ok) return null;
  const rows = await membershipResponse.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

module.exports = async function livekitToken(request, response) {
  setCors(request, response);

  if (request.method === 'OPTIONS') {
    if (request.headers?.origin && !sameOrigin(request)) return send(response, 403, { error: 'Origin not allowed' });
    response.statusCode = 204;
    response.end();
    return;
  }
  if (request.method !== 'POST') return send(response, 405, { error: 'POST required' });
  if (request.headers?.origin && !sameOrigin(request)) return send(response, 403, { error: 'Origin not allowed' });

  try {
    const apiKey = cleanEnv(process.env.LIVEKIT_API_KEY);
    const apiSecret = cleanEnv(process.env.LIVEKIT_API_SECRET);
    const livekitUrl = cleanEnv(process.env.LIVEKIT_URL).replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
    if (!apiKey || !apiSecret || !livekitUrl) return send(response, 503, { error: 'LiveKit environment is not configured' });

    const authHeader = String(request.headers?.authorization || '');
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    const accessToken = match?.[1]?.trim();
    if (!accessToken) return send(response, 401, { error: 'Guest session required' });

    const input = await readJson(request);
    const gameId = String(input.gameId || '').trim();
    if (!GAME_ID_RE.test(gameId)) return send(response, 400, { error: 'Invalid game id' });

    const user = await verifySupabaseUser(accessToken);
    if (!user) return send(response, 401, { error: 'Guest session expired' });

    const member = await findMembership(accessToken, gameId, user.id);
    if (!member?.id) return send(response, 403, { error: 'You are not a member of this hall' });

    const room = `kaykha-${gameId}`;
    const identity = `member-${member.id}`;
    const now = Math.floor(Date.now() / 1000);
    const token = signJwt({
      iss: apiKey,
      sub: identity,
      nbf: now - 10,
      exp: now + 900,
      name: String(member.display_name || 'فرمانده').slice(0, 64),
      video: {
        room,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: false
      }
    }, apiSecret);

    return send(response, 200, { token, url: livekitUrl, room, identity, expiresIn: 900 });
  } catch (error) {
    console.error('secure livekit token failed', error);
    return send(response, 500, { error: 'Voice authentication failed' });
  }
};

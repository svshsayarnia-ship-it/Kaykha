const crypto = require('crypto');

const stableOrigin = 'https://kaykha-phase4-2vyue2uug-svshsayarnia-ship-its-projects.vercel.app';
const commandOrigin = 'https://kaykha-phase4-67719fv7k-svshsayarnia-ship-its-projects.vercel.app';
const fallbackUiOrigin = 'https://kaykha-phase4-33kmfd9tn-svshsayarnia-ship-its-projects.vercel.app';
const rawRepo = 'https://raw.githubusercontent.com/svshsayarnia-ship-it/Kaykha/main';

function copyUpstreamHeaders(response, upstream, transformed = false) {
  const blocked = new Set(['connection', 'content-encoding', 'transfer-encoding', 'set-cookie']);
  if (transformed) {
    blocked.add('content-length');
    blocked.add('etag');
  }
  const setCookies = typeof upstream.headers.getSetCookie === 'function' ? upstream.headers.getSetCookie() : [];
  if (setCookies.length) response.setHeader('set-cookie', setCookies);
  upstream.headers.forEach((value, name) => {
    if (!blocked.has(name.toLowerCase())) response.setHeader(name, value);
  });
}

async function fetchOrigin(origin, request, requestUrl) {
  return fetch(`${origin}${requestUrl.pathname}${requestUrl.search}`, {
    method: request.method,
    headers: {
      accept: request.headers.accept || '*/*',
      ...(request.headers['content-type'] ? { 'content-type': request.headers['content-type'] } : {}),
      ...(request.headers.authorization ? { authorization: request.headers.authorization } : {}),
      ...(request.headers.cookie ? { cookie: request.headers.cookie } : {})
    },
    ...(['GET', 'HEAD'].includes(request.method) ? {} : { body: request, duplex: 'half' })
  });
}

async function pipeUpstream(upstream, response) {
  response.statusCode = upstream.status;
  copyUpstreamHeaders(response, upstream, false);
  if (!upstream.body) {
    response.end();
    return;
  }
  for await (const chunk of upstream.body) response.write(chunk);
  response.end();
}

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

async function readJson(request) {
  let raw = '';
  for await (const chunk of request) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

async function livekitToken(request, response) {
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
    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.LIVEKIT_URL) {
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
      iss: process.env.LIVEKIT_API_KEY,
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
    }, process.env.LIVEKIT_API_SECRET);

    response.statusCode = 200;
    response.end(JSON.stringify({ token, url: process.env.LIVEKIT_URL }));
  } catch (error) {
    console.error('livekit token failed', error);
    response.statusCode = 500;
    response.end(JSON.stringify({ error: 'LiveKit is not configured' }));
  }
}

function extractStringRawModule(source) {
  const marker = 'String.raw`';
  const start = source.indexOf(marker);
  const end = source.lastIndexOf('`);');
  if (start === -1 || end === -1 || end <= start) throw new Error('Invalid embedded asset module');
  return source.slice(start + marker.length, end);
}

async function serveRepoModuleAsset(response, repoPath, contentType, fallbackPath) {
  try {
    const upstream = await fetch(`${rawRepo}/${repoPath}`, {
      headers: { accept: 'text/plain,*/*' },
      cache: 'no-store'
    });
    if (!upstream.ok) throw new Error(`GitHub raw ${upstream.status}`);
    const source = await upstream.text();
    const payload = extractStringRawModule(source);
    response.statusCode = 200;
    response.setHeader('content-type', contentType);
    response.setHeader('cache-control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
    response.end(payload);
  } catch (error) {
    console.error(`repo asset fallback for ${repoPath}`, error);
    const fallback = await fetch(`${fallbackUiOrigin}${fallbackPath}`);
    response.statusCode = fallback.status;
    response.setHeader('content-type', contentType);
    response.setHeader('cache-control', 'public, max-age=60, s-maxage=300');
    if (!fallback.body) {
      response.end();
      return;
    }
    for await (const chunk of fallback.body) response.write(chunk);
    response.end();
  }
}

async function serveCityAsset(request, response, requestUrl) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.statusCode = 405;
    response.setHeader('allow', 'GET, HEAD');
    response.end();
    return;
  }

  const fileName = requestUrl.pathname.split('/').pop() || '';
  if (!/^[A-Za-z0-9_-]+\.webp$/.test(fileName)) {
    response.statusCode = 404;
    response.end('Not found');
    return;
  }

  const upstream = await fetch(`${rawRepo}/public/assets/cities/${encodeURIComponent(fileName)}`);
  response.statusCode = upstream.status;
  response.setHeader('content-type', 'image/webp');
  response.setHeader('cache-control', 'public, max-age=31536000, immutable');
  if (!upstream.ok || request.method === 'HEAD' || !upstream.body) {
    response.end();
    return;
  }
  for await (const chunk of upstream.body) response.write(chunk);
  response.end();
}

async function serveRoot(request, response, requestUrl) {
  const originUrl = requestUrl.pathname === '/game'
    ? new URL('/' + requestUrl.search, 'https://kaykha-phase4.vercel.app')
    : requestUrl;
  const upstream = await fetchOrigin(stableOrigin, request, originUrl);
  response.statusCode = upstream.status;
  copyUpstreamHeaders(response, upstream, true);
  response.setHeader('cache-control', 'no-store, max-age=0');
  if (request.method === 'HEAD' || !upstream.body) {
    response.end();
    return;
  }
  const html = await upstream.text();
  const themed = html
    .replace('</head>', '<link rel="stylesheet" href="/world-shell.css?v=one-world-6"></head>')
    .replace('</body>', '<script defer src="/world-shell.js?v=one-world-6"></script></body>');
  response.end(themed);
}

async function proxy(request, response) {
  const requestUrl = new URL(request.url || '/', 'https://kaykha-phase4.vercel.app');

  if (requestUrl.pathname === '/api/livekit-token') {
    await livekitToken(request, response);
    return;
  }

  if (requestUrl.pathname === '/game-guide.html') {
    const localGameGuide = require('./api/game-guide-html.js');
    await localGameGuide(request, response);
    return;
  }

  if (requestUrl.pathname === '/guide.js' || requestUrl.pathname === '/api/guide.js') {
    await serveRepoModuleAsset(response, 'api/guide.js', 'application/javascript; charset=utf-8', '/guide.js');
    return;
  }

  if (requestUrl.pathname === '/game-guide.html' || requestUrl.pathname === '/api/game-guide-html.js') {
    await serveRepoModuleAsset(response, 'api/game-guide-html.js', 'text/html; charset=utf-8', '/game-guide.html');
    return;
  }

  if (requestUrl.pathname.startsWith('/assets/cities/')) {
    await serveCityAsset(request, response, requestUrl);
    return;
  }

  if (requestUrl.pathname === '/world-shell.css') {
    await serveRepoModuleAsset(response, 'api/world-shell-css.js', 'text/css; charset=utf-8', '/world-shell.css?v=one-world-2');
    return;
  }

  if (requestUrl.pathname === '/world-shell.js') {
    await serveRepoModuleAsset(response, 'api/world-shell-js.js', 'application/javascript; charset=utf-8', '/world-shell.js?v=one-world-2');
    return;
  }

  if (requestUrl.pathname === '/game' || requestUrl.pathname === '/war-room.html') {
    await serveRepoModuleAsset(response, 'api/war-room-html.js', 'text/html; charset=utf-8', '/war-room.html');
    return;
  }

  if (requestUrl.pathname === '/kaykha-online.js') {
    await serveRepoModuleAsset(response, 'api/kaykha-online.js', 'application/javascript; charset=utf-8', '/kaykha-online.js');
    return;
  }

  if ((requestUrl.pathname === '/' || requestUrl.pathname === '/index.html') && ['GET', 'HEAD'].includes(request.method)) {
    await serveRoot(request, response, requestUrl);
    return;
  }

  const upstream = await fetchOrigin(stableOrigin, request, requestUrl);
  await pipeUpstream(upstream, response);
}

module.exports = async function handler(request, response) {
  try {
    await proxy(request, response);
  } catch (error) {
    console.error('kaykha bridge failed', error);
    response.statusCode = 502;
    response.end('بارگذاری بازی موقتاً ممکن نیست. دوباره تلاش کن.');
  }
};

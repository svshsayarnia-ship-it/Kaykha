const fs = require('fs');
const path = require('path');
const livekitToken = require('./api/livekit-token');

const stableOrigin = 'https://kaykha-phase4-2vyue2uug-svshsayarnia-ship-its-projects.vercel.app';
const commandOrigin = 'https://kaykha-phase4-67719fv7k-svshsayarnia-ship-its-projects.vercel.app';
const worldShellCss = require('./api/world-shell-css');
const worldShellJs = require('./api/world-shell-js');

function assetPayload(handler) {
  let body = '';
  handler({}, {
    setHeader() {},
    status() { return this; },
    send(value) { body = value; }
  });
  return body;
}

function serveEmbedded(response, type, handler, cache = 'public, max-age=120, s-maxage=120') {
  response.setHeader('content-type', type);
  response.setHeader('cache-control', cache);
  response.statusCode = 200;
  response.end(assetPayload(handler));
}

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

async function serveRoot(request, response, requestUrl) {
  const upstream = await fetchOrigin(stableOrigin, request, requestUrl);
  response.statusCode = upstream.status;
  copyUpstreamHeaders(response, upstream, true);
  response.setHeader('cache-control', 'no-store, max-age=0');
  if (request.method === 'HEAD' || !upstream.body) {
    response.end();
    return;
  }
  const html = await upstream.text();
  const themed = html
    .replace('</head>', '<link rel="stylesheet" href="/world-shell.css?v=one-world-5"></head>')
    .replace('</body>', '<script defer src="/world-shell.js?v=one-world-5"></script></body>');
  response.end(themed);
}

async function serveCityAsset(request, response, requestUrl) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.statusCode = 405;
    response.setHeader('allow', 'GET, HEAD');
    response.end();
    return;
  }
  const fileName = path.basename(requestUrl.pathname);
  if (!/^[A-Za-z0-9_-]+\.webp$/.test(fileName)) {
    response.statusCode = 404;
    response.end('Not found');
    return;
  }
  try {
    const filePath = path.join(process.cwd(), 'public', 'assets', 'cities', fileName);
    const body = fs.readFileSync(filePath);
    response.statusCode = 200;
    response.setHeader('content-type', 'image/webp');
    response.setHeader('cache-control', 'public, max-age=31536000, immutable');
    response.end(body);
  } catch (_) {
    response.statusCode = 404;
    response.end('Not found');
  }
}

async function proxy(request, response) {
  const requestUrl = new URL(request.url || '/', 'https://kaykha-phase4.vercel.app');

  if (requestUrl.pathname === '/api/livekit-token') {
    await livekitToken(request, response);
    return;
  }

  if (requestUrl.pathname.startsWith('/assets/cities/')) {
    await serveCityAsset(request, response, requestUrl);
    return;
  }

  if (requestUrl.pathname === '/world-shell.css') {
    serveEmbedded(response, 'text/css; charset=utf-8', worldShellCss);
    return;
  }

  if (requestUrl.pathname === '/world-shell.js') {
    serveEmbedded(response, 'application/javascript; charset=utf-8', worldShellJs);
    return;
  }

  if (requestUrl.pathname === '/war-room.html' || requestUrl.pathname === '/game') {
    const upstream = await fetchOrigin(commandOrigin, request, requestUrl);
    await pipeUpstream(upstream, response);
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

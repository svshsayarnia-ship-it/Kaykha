const stableOrigin = 'https://kaykha-phase4-2vyue2uug-svshsayarnia-ship-its-projects.vercel.app';
const warRoomHtml = require('./api/war-room-html');

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

async function proxy(request, response) {
  const requestUrl = new URL(request.url || '/', 'https://kaykha-phase4.vercel.app');

  if (requestUrl.pathname === '/war-room.html' || requestUrl.pathname === '/game') {
    serveEmbedded(response, 'text/html; charset=utf-8', warRoomHtml, 'private, no-store');
    return;
  }

  const upstream = await fetch(`${stableOrigin}${requestUrl.pathname}${requestUrl.search}`, {
    method: request.method,
    headers: {
      accept: request.headers.accept || '*/*',
      ...(request.headers['content-type'] ? { 'content-type': request.headers['content-type'] } : {}),
      ...(request.headers.authorization ? { authorization: request.headers.authorization } : {}),
      ...(request.headers.cookie ? { cookie: request.headers.cookie } : {})
    },
    ...(['GET', 'HEAD'].includes(request.method) ? {} : { body: request, duplex: 'half' })
  });

  response.statusCode = upstream.status;
  const setCookies = typeof upstream.headers.getSetCookie === 'function' ? upstream.headers.getSetCookie() : [];
  if (setCookies.length) response.setHeader('set-cookie', setCookies);

  upstream.headers.forEach((value, name) => {
    if (!['connection', 'content-encoding', 'transfer-encoding', 'set-cookie'].includes(name.toLowerCase())) {
      response.setHeader(name, value);
    }
  });

  if (!upstream.body) {
    response.end();
    return;
  }
  for await (const chunk of upstream.body) response.write(chunk);
  response.end();
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

const legacyOrigin = 'https://kaykha-phase4-ihkf34ufk-svshsayarnia-ship-its-projects.vercel.app';
const guide = require('./api/guide');
const gameShell = require('./api/game-shell');

function scriptPayload(script) {
  let body = '';
  script({}, {
    setHeader() {},
    status() { return this; },
    send(value) { body = value; }
  });
  return body;
}

async function proxy(request, response) {
  const requestUrl = new URL(request.url || '/', 'https://kaykha-phase4.vercel.app');

  if (requestUrl.pathname === '/guide.js' || requestUrl.pathname === '/game-shell.js') {
    response.setHeader('content-type', 'application/javascript; charset=utf-8');
    response.setHeader('cache-control', 'public, max-age=300, s-maxage=300');
    response.statusCode = 200;
    response.end(scriptPayload(requestUrl.pathname === '/guide.js' ? guide : gameShell));
    return;
  }

  const upstream = await fetch(`${legacyOrigin}${requestUrl.pathname}${requestUrl.search}`, {
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

  if (requestUrl.pathname === '/' && upstream.headers.get('content-type')?.includes('text/html')) {
    const html = await upstream.text();
    response.setHeader('content-type', 'text/html; charset=utf-8');
    response.setHeader('cache-control', 'no-store, max-age=0');
    response.end(html.replace('</head>', '  <script defer src="/guide.js?v=arta-fix-7"></script>\n</head>'));
    return;
  }

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
  } catch {
    response.statusCode = 502;
    response.end('بارگذاری بازی موقتاً ممکن نیست. دوباره تلاش کن.');
  }
};

module.exports = async function authHealth(request, response) {
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.setHeader('cache-control', 'no-store');

  if (!['GET', 'HEAD'].includes(request.method || 'GET')) {
    response.statusCode = 405;
    response.setHeader('allow', 'GET, HEAD');
    response.end(JSON.stringify({ ok: false, error: 'GET required' }));
    return;
  }

  const url = 'https://uwhfxmiguugujcomwmds.supabase.co';
  const key = 'sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';

  try {
    const result = await fetch(url + '/auth/v1/signup', {
      method: 'POST',
      headers: {
        apikey: key,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ data: { client: 'kaykha', purpose: 'auth_health_probe' } })
    });
    const body = await result.json().catch(() => ({}));
    const message = body?.msg || body?.message || body?.error_description || body?.error || null;
    const out = {
      ok: result.ok && Boolean(body?.access_token),
      http_status: result.status,
      has_access_token: Boolean(body?.access_token),
      has_refresh_token: Boolean(body?.refresh_token),
      anonymous_user: Boolean(body?.user?.is_anonymous),
      error: result.ok ? null : message
    };
    response.statusCode = 200;
    if ((request.method || 'GET') === 'HEAD') response.end();
    else response.end(JSON.stringify(out));
  } catch (error) {
    response.statusCode = 200;
    response.end(JSON.stringify({ ok: false, http_status: 0, error: error?.message || 'auth probe failed' }));
  }
};

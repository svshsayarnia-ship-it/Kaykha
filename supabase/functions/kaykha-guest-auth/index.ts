const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

function allowedOrigin(origin: string) {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();
    if ((host === 'localhost' || host === '127.0.0.1') && (url.protocol === 'http:' || url.protocol === 'https:')) return true;
    if (url.protocol !== 'https:') return false;
    return host === 'kaykha-phase5.vercel.app' || (host.startsWith('kaykha-phase5-') && host.endsWith('.vercel.app'));
  } catch (_) {
    return false;
  }
}

function cors(origin: string) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'content-type, apikey, authorization, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Cache-Control': 'no-store, max-age=0',
    'Content-Type': 'application/json; charset=utf-8',
    'Vary': 'Origin',
  };
  if (allowedOrigin(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function out(origin: string, body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(origin), ...extra } });
}

function randomSecret(bytes = 24) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacFingerprint(input: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_ROLE), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(input));
  return Array.from(new Uint8Array(signature), value => value.toString(16).padStart(2, '0')).join('');
}

function clientAddress(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return req.headers.get('cf-connecting-ip')?.trim() || forwarded || req.headers.get('x-real-ip')?.trim() || 'unknown';
}

async function consumeQuota(fingerprint: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/consume_kaykha_guest_quota`, {
    method: 'POST',
    headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_fingerprint: fingerprint }),
  });
  const body = await response.json().catch(() => []);
  if (!response.ok) throw new Error('Guest quota check failed');
  const row = Array.isArray(body) ? body[0] : body;
  return { allowed: Boolean(row?.allowed), retryAfter: Number(row?.retry_after_seconds || 0), remaining: Number(row?.remaining || 0) };
}

async function cleanupStaleGuests() {
  try {
    const listResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/list_kaykha_stale_guest_user_ids`, {
      method: 'POST',
      headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_limit: 3 }),
    });
    const rows = await listResponse.json().catch(() => []);
    if (!listResponse.ok || !Array.isArray(rows)) return;
    await Promise.allSettled(rows.slice(0, 3).map((row: { user_id?: string }) => {
      const id = String(row?.user_id || '').trim();
      if (!id) return Promise.resolve();
      return fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` },
      });
    }));
  } catch (_) {}
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  if (req.method === 'OPTIONS') {
    if (!allowedOrigin(origin)) return new Response(null, { status: 403, headers: cors(origin) });
    return new Response(null, { status: 204, headers: cors(origin) });
  }
  if (!allowedOrigin(origin)) return out(origin, { ok: false, error: 'Origin not allowed' }, 403);
  if (req.method === 'GET') return out(origin, { ok: true, mode: 'guest-auto-rate-limited' });
  if (req.method !== 'POST') return out(origin, { ok: false, error: 'POST required' }, 405);

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE || !ANON_KEY) return out(origin, { ok: false, error: 'Guest auth service is not configured' }, 500);

    const fingerprint = await hmacFingerprint(`${clientAddress(req)}|${(req.headers.get('user-agent') || 'unknown').slice(0, 180)}`);
    const quota = await consumeQuota(fingerprint);
    if (!quota.allowed) {
      const retry = Math.max(1, quota.retryAfter || 3600);
      return out(origin, { ok: false, error: 'تعداد اتصال‌های تازه زیاد شده؛ کمی بعد دوباره تلاش کن.', retry_after_seconds: retry }, 429, { 'Retry-After': String(retry) });
    }

    const guestId = crypto.randomUUID();
    const email = `guest-${guestId}@guest.kaykha.local`;
    const password = `Kk-${randomSecret(28)}!`;
    const createResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { client: 'kaykha', purpose: 'multiplayer_guest', guest: true, guest_version: 2 } }),
    });
    const created = await createResponse.json().catch(() => ({}));
    if (!createResponse.ok || !created?.id) {
      const message = created?.msg || created?.message || created?.error_description || created?.error || 'Guest identity could not be created';
      return out(origin, { ok: false, error: String(message) }, 500);
    }

    const sessionResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const session = await sessionResponse.json().catch(() => ({}));
    if (!sessionResponse.ok || !session?.access_token || !session?.refresh_token) {
      await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(created.id)}`, { method: 'DELETE', headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` } }).catch(() => null);
      const message = session?.msg || session?.message || session?.error_description || session?.error || 'Guest session could not be started';
      return out(origin, { ok: false, error: String(message) }, 500);
    }

    const cleanup = cleanupStaleGuests();
    const runtime = (globalThis as unknown as { EdgeRuntime?: { waitUntil?: (promise: Promise<unknown>) => void } }).EdgeRuntime;
    if (runtime?.waitUntil) runtime.waitUntil(cleanup); else cleanup.catch(() => {});

    return out(origin, { ok: true, rate_limit_remaining: quota.remaining, session: { access_token: session.access_token, refresh_token: session.refresh_token, expires_in: session.expires_in, token_type: session.token_type, user: { id: session.user?.id || created.id, is_anonymous: true } } });
  } catch (error) {
    return out(origin, { ok: false, error: error instanceof Error ? error.message : 'Guest auth failed' }, 500);
  }
});

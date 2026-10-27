import { random, cookieHeader } from '../../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  if (!env.GOOGLE_CLIENT_ID) {
    return Response.json(
      { error: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Pages settings.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const origin = new URL(request.url).origin;
  const state = random(24);
  const nonce = random(24);
  const target = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  target.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    nonce,
    prompt: 'select_account'
  }).toString();

  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff'
  });
  headers.append('Set-Cookie', cookieHeader('ichess_oauth_state', state, 600));
  headers.append('Set-Cookie', cookieHeader('ichess_oauth_nonce', nonce, 600));
  return new Response(JSON.stringify({ url: target.toString() }), { status: 200, headers });
}

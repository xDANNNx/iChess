import { random, cookieHeader } from '../../_lib/auth.js';
export async function onRequestGet({ request, env }) {
  if (!env.GOOGLE_CLIENT_ID) return new Response('Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Pages settings.', { status: 503 });
  const origin = new URL(request.url).origin, state = random(24), nonce = random(24);
  const target = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  target.search = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: `${origin}/api/auth/google/callback`, response_type: 'code', scope: 'openid email profile', state, nonce, prompt: 'select_account' }).toString();
  const headers = new Headers({ Location: target.toString(), 'Cache-Control': 'no-store' });
  headers.append('Set-Cookie', cookieHeader('ichess_oauth_state', state, 600));
  headers.append('Set-Cookie', cookieHeader('ichess_oauth_nonce', nonce, 600));
  return new Response(null, { status: 302, headers });
}

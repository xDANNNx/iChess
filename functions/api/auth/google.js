import { random, cookieHeader } from '../../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  if (!env.GOOGLE_CLIENT_ID) {
    return new Response(
      JSON.stringify({ error: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Pages settings.' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
      }
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
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff'
  });
  headers.append('Set-Cookie', cookieHeader('ichess_oauth_state', state, 600));
  headers.append('Set-Cookie', cookieHeader('ichess_oauth_nonce', nonce, 600));

  // The installed iOS web app can mis-handle navigation to this endpoint as a file.
  // Return the OAuth URL to the app so it can navigate directly to Google's domain.
  if (request.headers.get('Accept')?.includes('application/json')) {
    headers.set('Content-Type', 'application/json; charset=utf-8');
    return new Response(JSON.stringify({ url: target.toString() }), { status: 200, headers });
  }

  headers.set('Content-Type', 'text/html; charset=utf-8');
  const destination = JSON.stringify(target.toString());
  const escapedUrl = target.toString().replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="referrer" content="no-referrer">
  <meta http-equiv="refresh" content="0;url=${escapedUrl}">
  <title>Connecting to Google…</title>
</head>
<body>
  <p>Connecting to Google…</p>
  <script>window.location.replace(${destination});</script>
  <noscript><p><a href="${escapedUrl}">Continue to Google</a></p></noscript>
</body>
</html>`;
  return new Response(html, { status: 200, headers });
}
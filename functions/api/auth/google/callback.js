import { cookie, random, createSession, cookieHeader } from '../../../_lib/auth.js';
function redirect(origin, status, cookieLines = []) { const h = new Headers({ Location: origin, 'Cache-Control': 'no-store' }); for (const c of cookieLines) h.append('Set-Cookie', c); return new Response(null, { status, headers: h }); }
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url), origin = url.origin, code = url.searchParams.get('code'), state = url.searchParams.get('state');
  const stateCookie = cookie(request, 'ichess_oauth_state');
  const clear = ['ichess_oauth_state=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax','ichess_oauth_nonce=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax'];
  if (!code || !state || !stateCookie || state !== stateCookie || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return redirect(`${origin}/?auth=google_error`, 302, clear);
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: `${origin}/api/auth/google/callback`, grant_type: 'authorization_code' }) });
    if (!tokenRes.ok) throw new Error('token'); const token = await tokenRes.json();
    const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${token.access_token}` } });
    if (!infoRes.ok) throw new Error('userinfo'); const info = await infoRes.json();
    if (!info.sub || !info.email || info.email_verified !== true) throw new Error('identity');
    const linked = await env.DB.prepare('SELECT user_id FROM oauth_accounts WHERE provider=? AND provider_user_id=?').bind('google', info.sub).first();
    let userId = linked?.user_id;
    if (!userId) {
      const email = String(info.email).toLowerCase();
      const existing = await env.DB.prepare('SELECT id FROM users WHERE email=?').bind(email).first();
      if (existing) return redirect(`${origin}/?auth=google_link_required`, 302, clear);
      userId = random(16); const now = Date.now();
      await env.DB.prepare('INSERT INTO users(id,email,display_name,email_verified_at,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(userId, email, String(info.name || email.split('@')[0]).slice(0,80), now, now, now).run();
      await env.DB.prepare('INSERT INTO player_profiles(user_id,settings_json,progress_json,updated_at) VALUES(?,?,?,?)').bind(userId, '{}', '{}', now).run();
      await env.DB.prepare('INSERT INTO oauth_accounts(provider,provider_user_id,user_id,created_at) VALUES(?,?,?,?)').bind('google', info.sub, userId, now).run();
    }
    const session = await createSession(userId, env);
    return redirect(`${origin}/?auth=google_success`, 302, [cookieHeader('ichess_session', session.token, 60*60*24*30), ...clear]);
  } catch { return redirect(`${origin}/?auth=google_error`, 302, clear); }
}

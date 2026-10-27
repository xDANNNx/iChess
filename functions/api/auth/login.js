import { json, bodyJson, emailValid, verifyPassword, createSession, cookieHeader, sameOrigin } from '../../_lib/auth.js';
export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: 'طلب غير مسموح.' }, 403);
  try {
    const b = await bodyJson(request, 12000), email = String(b.email || '').trim().toLowerCase(), password = String(b.password || '');
    if (!emailValid(email) || !password || password.length > 128) return json({ error: 'البريد أو كلمة المرور غير صحيحة.' }, 401);
    const user = await env.DB.prepare('SELECT id,email,display_name,password_hash FROM users WHERE email=?').bind(email).first();
    if (!user || !user.password_hash || !(await verifyPassword(password, user.password_hash))) return json({ error: 'البريد أو كلمة المرور غير صحيحة.' }, 401);
    const session = await createSession(user.id, env);
    return json({ user: { id: user.id, email: user.email, display_name: user.display_name } }, 200, { 'Set-Cookie': cookieHeader('ichess_session', session.token, 60 * 60 * 24 * 30) });
  } catch { return json({ error: 'تعذّر تسجيل الدخول حالياً.' }, 500); }
}

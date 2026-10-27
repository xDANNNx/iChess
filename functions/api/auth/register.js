import { json, bodyJson, emailValid, passwordHash, random, createSession, cookieHeader, sameOrigin } from '../../_lib/auth.js';
export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: 'طلب غير مسموح.' }, 403);
  try {
    const b = await bodyJson(request, 12000), email = String(b.email || '').trim().toLowerCase(), password = String(b.password || ''), name = String(b.name || '').trim().slice(0, 80);
    if (!emailValid(email)) return json({ error: 'أدخل بريداً إلكترونياً صالحاً.' }, 400);
    if (password.length < 10 || password.length > 128) return json({ error: 'كلمة المرور يجب أن تكون بين 10 و128 حرفاً.' }, 400);
    const exists = await env.DB.prepare('SELECT id FROM users WHERE email=?').bind(email).first();
    if (exists) return json({ error: 'تعذّر إنشاء الحساب بهذا البريد. جرّب تسجيل الدخول.' }, 409);
    const id = random(16), now = Date.now(), hash = await passwordHash(password);
    await env.DB.prepare('INSERT INTO users(id,email,display_name,password_hash,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(id, email, name || email.split('@')[0], hash, now, now).run();
    await env.DB.prepare("INSERT INTO player_profiles(user_id,settings_json,progress_json,updated_at) VALUES(?,'{}','{}',?)").bind(id, now).run();
    const session = await createSession(id, env);
    return json({ user: { id, email, display_name: name || email.split('@')[0] } }, 201, { 'Set-Cookie': cookieHeader('ichess_session', session.token, 60 * 60 * 24 * 30) });
  } catch (e) { return json({ error: e.message === 'too_large' ? 'الطلب كبير جداً.' : 'تعذّر إنشاء الحساب.' }, e.message === 'too_large' ? 413 : 500); }
}

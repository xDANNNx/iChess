import { json, currentUser } from '../../_lib/auth.js';
export async function onRequestGet({ request, env }) { const user = await currentUser(request, env); return user ? json({ user }) : json({ user: null }, 200, { 'Set-Cookie': 'ichess_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax' }); }

const enc = new TextEncoder();
export const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } });
export const random = (n = 32) => { const b = crypto.getRandomValues(new Uint8Array(n)); return [...b].map(x => x.toString(16).padStart(2, '0')).join(''); };
export const sha256 = async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(value)))].map(b => b.toString(16).padStart(2, '0')).join('');
export function cookie(request, name) { const raw = request.headers.get('Cookie') || ''; for (const part of raw.split(';')) { const i = part.indexOf('='); if (i > -1 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim(); } return ''; }
export const cookieHeader = (name, value, maxAge, extra = '') => `${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax${extra}`;
export async function passwordHash(password, salt = random(16)) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: Uint8Array.from(salt.match(/.{2}/g).map(x => parseInt(x, 16))), iterations: 210000, hash: 'SHA-256' }, key, 256);
  return `pbkdf2-sha256$210000$${salt}$${[...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('')}`;
}
export async function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  const p = stored.split('$'); if (p.length !== 4 || p[0] !== 'pbkdf2-sha256' || p[1] !== '210000') return false;
  const fresh = await passwordHash(password, p[2]); return constantTime(fresh.split('$')[3], p[3]);
}
function constantTime(a, b) { if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }
export async function currentUser(request, env) {
  const token = cookie(request, 'ichess_session'); if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const id = await sha256(token), row = await env.DB.prepare('SELECT u.id,u.email,u.display_name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id_hash=? AND s.expires_at>?').bind(id, Date.now()).first();
  return row || null;
}
export async function createSession(userId, env) {
  const token = random(32), now = Date.now(), expires = now + 1000 * 60 * 60 * 24 * 30;
  await env.DB.prepare('INSERT INTO sessions(id_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)').bind(await sha256(token), userId, expires, now).run();
  return { token, expires };
}
export async function bodyJson(request, max = 1000000) {
  const len = Number(request.headers.get('content-length') || 0); if (len > max) throw new Error('too_large');
  const value = await request.json(); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('bad_json'); if (JSON.stringify(value).length > max) throw new Error('too_large'); return value;
}
export const emailValid = value => typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function sameOrigin(request) { const origin = request.headers.get('Origin'); return !origin || origin === new URL(request.url).origin; }

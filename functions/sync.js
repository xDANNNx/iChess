// Cloudflare Pages Function: anonymous cloud sync (no accounts). D1 binding name: DB
const sha = async t => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)))].map(b => b.toString(16).padStart(2, '0')).join('');
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const num = v => typeof v === 'number' && isFinite(v);
function clean(k, v) {
  if (typeof k !== 'string' || k.length > 90 || k[1] === ':' || !v || typeof v.bestMoveUci !== 'string' || v.bestMoveUci.length > 5 || !num(v.evalScore)) return null;
  const o = { bestMoveUci: v.bestMoveUci, evalScore: v.evalScore, mateIn: num(v.mateIn) ? v.mateIn : null, t: num(v.t) ? v.t : Date.now() };
  if (Array.isArray(v.lines)) o.lines = v.lines.slice(0, 5).filter(l => l && typeof l.moves === 'string' && l.moves.length < 60).map(l => ({ moves: l.moves, cp: num(l.cp) ? l.cp : undefined, mate: num(l.mate) ? l.mate : undefined }));
  return o;
}
export async function onRequestPost({ request, env }) {
  try {
    if (+request.headers.get('content-length') > 2e6) return J({ error: 'too large' }, 413);
    const b = await request.json(), key = String(b.key || '');
    if (!/^[A-Za-z0-9_-]{32,64}$/.test(key)) return J({ error: 'bad key' }, 400);
    const id = await sha(key), row = await env.DB.prepare('SELECT json FROM sync WHERE id=?').bind(id).first();
    const old = row ? JSON.parse(row.json) : { db: {}, games: [] };
    const db = old.db;
    for (const k in (b.db && typeof b.db === 'object' ? b.db : {})) { const v = clean(k, b.db[k]); if (v) db[k] = v; }
    const ks = Object.keys(db); if (ks.length > 4000) ks.sort((a, c) => (db[a].t || 0) - (db[c].t || 0)).slice(0, ks.length - 4000).forEach(k => delete db[k]);
    const seen = new Set(), games = [...(Array.isArray(b.games) ? b.games : []), ...old.games].filter(g => g && typeof g.id === 'string' && typeof g.pgn === 'string' && g.pgn.length < 8000 && !seen.has(g.id) && seen.add(g.id)).slice(0, 200);
    const out = JSON.stringify({ db, games });
    if (out.length > 1.9e6) return J({ error: 'quota' }, 413);
    await env.DB.prepare('INSERT INTO sync(id,json,updated) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json,updated=excluded.updated').bind(id, out, Date.now()).run();
    const since = +b.since || 0, send = {};
    for (const k in db) if ((db[k].t || 0) > since) send[k] = db[k];
    return J({ db: send, games });
  } catch (e) { return J({ error: 'server' }, 500); }
}

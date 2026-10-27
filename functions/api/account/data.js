import { json, bodyJson, currentUser, sameOrigin } from '../../_lib/auth.js';
export async function onRequestGet({ request, env }) {
  const user = await currentUser(request, env); if (!user) return json({ error: 'يلزم تسجيل الدخول.' }, 401);
  const profile = await env.DB.prepare('SELECT settings_json,progress_json,updated_at FROM player_profiles WHERE user_id=?').bind(user.id).first();
  const games = await env.DB.prepare('SELECT id,pgn,result,opponent_type,played_at,metadata_json FROM games WHERE user_id=? ORDER BY played_at DESC LIMIT 200').bind(user.id).all();
  const entries = await env.DB.prepare('SELECT fen_key,json FROM learning_entries WHERE user_id=? ORDER BY updated_at DESC LIMIT 4000').bind(user.id).all();
  const stats = await env.DB.prepare('SELECT wins,losses,draws,completed_games FROM player_stats WHERE user_id=?').bind(user.id).first();
  let settings = {}, progress = {}; try { settings = JSON.parse(profile?.settings_json || '{}'); progress = JSON.parse(profile?.progress_json || '{}'); } catch {}
  const learnedDB = {}; for (const row of entries.results || []) { try { learnedDB[row.fen_key] = JSON.parse(row.json); } catch {} }
  return json({ settings, games: (games.results || []).map(g => ({ id:g.id, pgn:g.pgn, r:g.result || '', date:g.played_at, n:Number(JSON.parse(g.metadata_json || '{}').n || 0) })), progress, learnedDB, stats: stats || { wins:0, losses:0, draws:0, completed_games:0 } });
}
export async function onRequestPut({ request, env }) {
  if (!sameOrigin(request)) return json({ error: 'طلب غير مسموح.' }, 403);
  const user = await currentUser(request, env); if (!user) return json({ error: 'يلزم تسجيل الدخول.' }, 401);
  let b; try { b = await bodyJson(request, 900000); } catch { return json({ error: 'بيانات غير صالحة أو أكبر من المسموح.' }, 400); }
  const settings = b.settings && typeof b.settings === 'object' && !Array.isArray(b.settings) ? b.settings : {};
  const progress = b.progress && typeof b.progress === 'object' && !Array.isArray(b.progress) ? b.progress : {};
  const games = Array.isArray(b.games) ? b.games.slice(0,200) : [];
  const learned = b.learnedDB && typeof b.learnedDB === 'object' && !Array.isArray(b.learnedDB) ? Object.entries(b.learnedDB).slice(0,4000) : [];
  const now = Date.now();
  try {
    await env.DB.prepare('INSERT INTO player_profiles(user_id,settings_json,progress_json,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET settings_json=excluded.settings_json,progress_json=excluded.progress_json,updated_at=excluded.updated_at').bind(user.id, JSON.stringify(settings).slice(0,100000), JSON.stringify(progress).slice(0,100000), now).run();
    const gameStatements = [];
    for (const g of games) {
      if (!g || typeof g.id !== 'string' || g.id.length > 100 || typeof g.pgn !== 'string' || g.pgn.length > 12000) continue;
      const played = Number(g.date); if (!Number.isFinite(played)) continue;
      const result = ['1-0','0-1','1/2-1/2'].includes(g.r) ? g.r : '';
      gameStatements.push(env.DB.prepare('INSERT INTO games(id,user_id,pgn,result,opponent_type,played_at,metadata_json) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET pgn=excluded.pgn,result=excluded.result,opponent_type=excluded.opponent_type,played_at=excluded.played_at,metadata_json=excluded.metadata_json WHERE games.user_id=excluded.user_id').bind(g.id,user.id,g.pgn,result,'ai',played,JSON.stringify({n:Number(g.n)||0})));
    }
    for (let i = 0; i < gameStatements.length; i += 100) await env.DB.batch(gameStatements.slice(i, i + 100));
    const learningStatements = [];
    for (const [fen, value] of learned) {
      if (typeof fen !== 'string' || fen.length > 90 || fen[1] === ':' || !value || typeof value !== 'object' || typeof value.bestMoveUci !== 'string' || value.bestMoveUci.length > 5 || typeof value.evalScore !== 'number') continue;
      learningStatements.push(env.DB.prepare('INSERT INTO learning_entries(user_id,fen_key,json,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id,fen_key) DO UPDATE SET json=excluded.json,updated_at=excluded.updated_at').bind(user.id,fen,JSON.stringify(value).slice(0,4000),Number(value.t)||now));
    }
    for (let i = 0; i < learningStatements.length; i += 100) await env.DB.batch(learningStatements.slice(i, i + 100));
    const counts = await env.DB.prepare("SELECT SUM(CASE WHEN result='1-0' THEN 1 ELSE 0 END) wins, SUM(CASE WHEN result='0-1' THEN 1 ELSE 0 END) losses, SUM(CASE WHEN result='1/2-1/2' THEN 1 ELSE 0 END) draws, SUM(CASE WHEN result IN ('1-0','0-1','1/2-1/2') THEN 1 ELSE 0 END) completed_games FROM games WHERE user_id=?").bind(user.id).first();
    await env.DB.prepare('INSERT INTO player_stats(user_id,wins,losses,draws,completed_games,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET wins=excluded.wins,losses=excluded.losses,draws=excluded.draws,completed_games=excluded.completed_games,updated_at=excluded.updated_at').bind(user.id,counts?.wins||0,counts?.losses||0,counts?.draws||0,counts?.completed_games||0,now).run();
    await env.DB.prepare('DELETE FROM games WHERE user_id=? AND id NOT IN (SELECT id FROM games WHERE user_id=? ORDER BY played_at DESC LIMIT 200)').bind(user.id,user.id).run();
    await env.DB.prepare('DELETE FROM learning_entries WHERE user_id=? AND fen_key NOT IN (SELECT fen_key FROM learning_entries WHERE user_id=? ORDER BY updated_at DESC LIMIT 4000)').bind(user.id,user.id).run();
    return json({ ok:true, stats:counts });
  } catch { return json({ error:'تعذّر حفظ بيانات الحساب.' },500); }
}

/* Ultra Pip: owner-only powers over the whole site, unlocked by a passcode that lives only in the ULTRA_CODE Worker secret.
   A correct passcode earns a 30-minute signed token. No code or repo access; anything that mentions "reset" is refused. */
const enc = new TextEncoder();
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function hmac(key, msg) { const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(msg))); }
const same = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; };
const clip = (s, n) => String(s == null ? '' : s).slice(0, n);
const SET = { prompt_extra: 1500, greeting: 200, notice: 300, accent: 9, model: 80 };

export async function settings(env) {
  try {
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS pip_settings (k TEXT PRIMARY KEY, v TEXT NOT NULL, t INTEGER)').run();
    const r = await env.DB.prepare('SELECT k, v FROM pip_settings').all(); const o = {}; for (const x of r.results || []) if (SET[x.k]) o[x.k] = x.v; return o;
  } catch (e) { return {} }
}

/* wrong attempts are counted per address and overall; the hits table already prunes anything older than a minute */
export async function unlock(env, ip, code) {
  if (!env.ULTRA_CODE) return { s: 503, j: { error: 'off' } };
  const now = Date.now(), n = async k => ((await env.DB.prepare('SELECT COUNT(*) AS n FROM hits WHERE ip = ?').bind(k).first()) || {}).n || 0;
  await env.DB.prepare('DELETE FROM hits WHERE t < ?').bind(now - 60000).run();
  if (await n('u:' + ip) >= 5 || await n('u:*') >= 20) return { s: 429, j: { error: 'slow down' } };
  const ok = same(await hmac('cmp', clip(code, 200)), await hmac('cmp', env.ULTRA_CODE));
  if (!ok) { for (const k of ['u:' + ip, 'u:*']) await env.DB.prepare('INSERT INTO hits (ip, t) VALUES (?, ?)').bind(k, now).run(); return { s: 401, j: { error: 'no' } }; }
  const p = b64u(enc.encode(JSON.stringify({ e: now + 30 * 60000 })));
  return { s: 200, j: { token: p + '.' + b64u(await hmac('tok:' + env.ULTRA_CODE, p)), exp: now + 30 * 60000 } };
}
export async function valid(env, token) {
  if (!env.ULTRA_CODE || typeof token !== 'string') return false;
  const [p, sig] = token.split('.'); if (!p || !sig) return false;
  if (!same(enc.encode(sig), enc.encode(b64u(await hmac('tok:' + env.ULTRA_CODE, p))))) return false;
  try { return JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/'))).e > Date.now() } catch (e) { return false }
}

export async function run(env, tool, a) {
  a = a && typeof a === 'object' ? a : {};
  switch (tool) {
    case 'settings_get': return { settings: await settings(env) };
    case 'settings_set': {
      const k = String(a.key); if (!SET[k]) throw new Error('keys: ' + Object.keys(SET).join(', '));
      let v = clip(a.value, SET[k]).trim(); await settings(env); const was = (await settings(env))[k] || '';
      if (k === 'accent' && v && !/^#[0-9a-f]{6}$/i.test(v)) throw new Error('accent must look like #c8412b');
      if (k === 'model' && v && !/^@cf\/[\w./-]+$/.test(v)) throw new Error('model must be a Workers AI id like @cf/meta/...');
      if (/reset/i.test(v)) throw new Error('Nothing about reset can be set.');
      if (v) await env.DB.prepare('INSERT INTO pip_settings (k, v, t) VALUES (?, ?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v, t = excluded.t').bind(k, v, Date.now()).run();
      else await env.DB.prepare('DELETE FROM pip_settings WHERE k = ?').bind(k).run();
      return { ok: true, key: k, was };
    }
    case 'db_tables': return { tables: ((await env.DB.prepare("SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name <> 'd1_migrations'").all()).results || []).map(t => t.name + ': ' + clip(t.sql, 400)) };
    case 'db_select': {
      const q = String(a.sql || '').trim().replace(/;\s*$/, '');
      if (!/^select\b/i.test(q) || /;|\b(insert|update|delete|drop|alter|create|attach|pragma|replace)\b/i.test(q)) throw new Error('Only a single SELECT is allowed here.');
      return { rows: ((await env.DB.prepare('SELECT * FROM (' + q + ') LIMIT 50').all()).results || []).map(r => { const o = {}; for (const k in r) o[k] = typeof r[k] === 'string' ? clip(r[k], 200) : r[k]; return o; }) };
    }
    case 'score_delete': {
      const id = +a.id; if (!(id > 0)) throw new Error('bad id'); const row = await env.DB.prepare('SELECT * FROM scores WHERE id = ?').bind(id).first(); if (!row) throw new Error('no such score');
      await env.DB.prepare('DELETE FROM scores WHERE id = ?').bind(id).run(); return { ok: true, row };
    }
    case 'score_restore': {
      const r = a.row; if (!r || !(r.id > 0)) throw new Error('bad row');
      await env.DB.prepare('INSERT OR REPLACE INTO scores (id, game, board, kind, name, pid, bot, score, low, ghost, created) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(r.id, r.game, r.board, r.kind, r.name, r.pid, r.bot ?? null, r.score, r.low, r.ghost ?? null, r.created).run(); return { ok: true };
    }
    case 'score_update': {
      const id = +a.id; if (!(id > 0)) throw new Error('bad id'); const row = await env.DB.prepare('SELECT * FROM scores WHERE id = ?').bind(id).first(); if (!row) throw new Error('no such score');
      const name = a.name == null ? row.name : clip(a.name, 14).replace(/[^\p{L}\p{N} ._-]/gu, '').trim() || row.name, score = a.score == null ? row.score : +a.score; if (!isFinite(score)) throw new Error('bad score');
      await env.DB.prepare('UPDATE scores SET name = ?, score = ? WHERE id = ?').bind(name, score, id).run(); return { ok: true, row };
    }
  }
  throw new Error('unknown tool');
}

// Student Tools - Cloudflare Worker backend (PIN accounts + protected /dashboard)
// Bindings: DB (D1), ASSETS (static files)
// Secret:   SESSION_SECRET  (long random text; signs sessions and is mixed into PIN hashes)

const enc = new TextEncoder();
const SESSION_SECONDS = 2 * 60 * 60; // a session lasts at most 2 hours (the app also locks itself on every open)
const MAX_FAILS = 5;                 // wrong PINs before the account locks
const LOCK_MS = 15 * 60 * 1000;      // lock time
const IP_WINDOW_MS = 15 * 60 * 1000;
const IP_LIMIT = 40;                 // failed logins / signups per IP in the window
const PBKDF2_ITERATIONS = 100000;    // the Workers runtime maximum

const ID_RE = /^[A-Z0-9]{5,20}$/;
const PIN_RE = /^[0-9]{4}$/;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS students (student_id TEXT PRIMARY KEY, nickname TEXT NOT NULL, pin_hash TEXT NOT NULL, salt TEXT NOT NULL, fails INTEGER NOT NULL DEFAULT 0, locked_until INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS roster (student_id TEXT PRIMARY KEY)`,
  `CREATE TABLE IF NOT EXISTS ip_attempts (ip TEXT NOT NULL, ts INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_ip ON ip_attempts (ip, ts)`,
  `CREATE TABLE IF NOT EXISTS courses (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0, name TEXT NOT NULL DEFAULT '', credit REAL, parts TEXT NOT NULL DEFAULT '[]', updated_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE INDEX IF NOT EXISTS idx_courses_student ON courses (student_id, position)`,
];
let schemaReady = null;
function ensureSchema(env) {
  if (!schemaReady) schemaReady = env.DB.batch(SCHEMA.map((s) => env.DB.prepare(s))).catch((e) => { schemaReady = null; throw e; });
  return schemaReady;
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}

async function getSecret(env) {
  const v = env.SESSION_SECRET;
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v.get === "function") return String((await v.get()) ?? "");
  return "";
}

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const fromHex = (hex) => new Uint8Array(hex.match(/../g).map((h) => parseInt(h, 16)));

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}

// PIN hash = PBKDF2(pin + secret, per-student random salt). The secret is not stored in the database.
async function hashPin(secret, pin, saltHex) {
  const mat = await crypto.subtle.importKey("raw", enc.encode(pin + "|" + secret), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: fromHex(saltHex), iterations: PBKDF2_ITERATIONS }, mat, 256);
  return toHex(bits);
}

function getCookie(request, name) {
  for (const part of (request.headers.get("Cookie") || "").split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return "";
}
function sessionCookie(value, maxAge) {
  return `sd_session=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

async function makeToken(secret, studentId) {
  const exp = Date.now() + SESSION_SECONDS * 1000;
  return `${studentId}.${exp}.${await hmacHex(secret, `s:${studentId}:${exp}`)}`;
}

// The session token comes from the Authorization header (used inside the portal iframe,
// where browsers block cookies) or, as a fallback, from the cookie (used when the site is opened on its own).
function readToken(request) {
  const h = request.headers.get("Authorization") || "";
  if (h.startsWith("Bearer ")) return h.slice(7).trim();
  return getCookie(request, "sd_session");
}

// Returns { id, nick } for a valid session, otherwise null.
async function getSession(request, env) {
  const secret = await getSecret(env);
  if (!secret) return null;
  const token = readToken(request);
  const [id, expStr, sig] = token.split(".");
  const exp = Number(expStr);
  if (!id || !sig || !exp || exp < Date.now() || !ID_RE.test(id)) return null;
  if (!safeEqual(sig, await hmacHex(secret, `s:${id}:${exp}`))) return null;
  const row = await env.DB.prepare(`SELECT nickname FROM students WHERE student_id = ?`).bind(id).first();
  return row ? { id, nick: row.nickname } : null;
}

async function readBody(request) {
  try { const d = await request.json(); return d && typeof d === "object" ? d : {}; } catch { return {}; }
}
const cleanId = (v) => String(v ?? "").trim().toUpperCase().replace(/\s+/g, "");
const cleanNick = (v) => String(v ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").trim().replace(/\s+/g, " ");

async function ipBlocked(env, ip) {
  const now = Date.now();
  await env.DB.prepare(`DELETE FROM ip_attempts WHERE ts < ?`).bind(now - 60 * 60 * 1000).run();
  const r = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ip_attempts WHERE ip = ? AND ts > ?`).bind(ip, now - IP_WINDOW_MS).first();
  return (r?.n || 0) >= IP_LIMIT;
}
const noteAttempt = (env, ip) => env.DB.prepare(`INSERT INTO ip_attempts (ip, ts) VALUES (?, ?)`).bind(ip, Date.now()).run();

async function signup(request, env, secret, ip) {
  if (await ipBlocked(env, ip)) return json({ error: "Too many attempts. Please try again later." }, 429);
  await noteAttempt(env, ip);
  const b = await readBody(request);
  const id = cleanId(b.studentId), id2 = cleanId(b.studentId2);
  const nick = cleanNick(b.nickname), pin = String(b.pin ?? ""), pin2 = String(b.pin2 ?? "");
  if (!ID_RE.test(id)) return json({ error: "Enter a valid Student ID (letters and numbers, 5 to 20 characters)." }, 400);
  if (id !== id2) return json({ error: "The two Student IDs do not match." }, 400);
  if (nick.length < 2 || nick.length > 24) return json({ error: "Nickname must be 2 to 24 characters." }, 400);
  if (!PIN_RE.test(pin)) return json({ error: "PIN must be exactly 4 digits." }, 400);
  if (pin !== pin2) return json({ error: "The two PINs do not match." }, 400);

  const rosterCount = (await env.DB.prepare(`SELECT COUNT(*) AS n FROM roster`).first())?.n || 0;
  if (rosterCount > 0) {
    const ok = await env.DB.prepare(`SELECT 1 AS x FROM roster WHERE student_id = ?`).bind(id).first();
    if (!ok) return json({ error: "This Student ID is not on the class list. Ask your CR." }, 403);
  }
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const pinHash = await hashPin(secret, pin, salt);
  const res = await env.DB.prepare(`INSERT OR IGNORE INTO students (student_id, nickname, pin_hash, salt) VALUES (?, ?, ?, ?)`).bind(id, nick, pinHash, salt).run();
  if (!res.meta?.changes) return json({ error: "An account with this Student ID already exists. Please sign in." }, 409);
  const token = await makeToken(secret, id);
  return json({ ok: true, studentId: id, nickname: nick, token }, 200, { "Set-Cookie": sessionCookie(token, SESSION_SECONDS) });
}

async function login(request, env, secret, ip) {
  if (await ipBlocked(env, ip)) return json({ error: "Too many attempts. Please try again later." }, 429);
  const b = await readBody(request);
  const id = cleanId(b.studentId), pin = String(b.pin ?? "");
  const generic = () => json({ error: "Wrong Student ID or PIN." }, 401);
  if (!ID_RE.test(id) || !PIN_RE.test(pin)) return generic();

  const row = await env.DB.prepare(`SELECT nickname, pin_hash, salt, fails, locked_until FROM students WHERE student_id = ?`).bind(id).first();
  if (!row) {
    await hashPin(secret, pin, "00".repeat(16)); // same work as a real check, so timing does not reveal accounts
    await noteAttempt(env, ip);
    return generic();
  }
  const now = Date.now();
  if (row.locked_until > now) {
    const mins = Math.ceil((row.locked_until - now) / 60000);
    return json({ error: `Too many wrong PINs. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`, locked: true }, 429);
  }
  if (safeEqual(await hashPin(secret, pin, row.salt), row.pin_hash)) {
    await env.DB.prepare(`UPDATE students SET fails = 0, locked_until = 0 WHERE student_id = ?`).bind(id).run();
    const token = await makeToken(secret, id);
    return json({ ok: true, studentId: id, nickname: row.nickname, token }, 200, { "Set-Cookie": sessionCookie(token, SESSION_SECONDS) });
  }
  await noteAttempt(env, ip);
  const fails = row.fails + 1;
  if (fails >= MAX_FAILS) {
    await env.DB.prepare(`UPDATE students SET fails = 0, locked_until = ? WHERE student_id = ?`).bind(now + LOCK_MS, id).run();
    return json({ error: "Too many wrong PINs. This account is locked for 15 minutes.", locked: true }, 429);
  }
  await env.DB.prepare(`UPDATE students SET fails = ? WHERE student_id = ?`).bind(fails, id).run();
  const left = MAX_FAILS - fails;
  return json({ error: `Wrong PIN. ${left} attempt${left === 1 ? "" : "s"} left.` }, 401);
}

// ---- Courses (marksheet data). Every query is scoped to the student_id of the verified session. ----
const MAX_COURSES = 20, MAX_PARTS = 12, MAX_BODY = 100000;
const cleanText = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").trim().replace(/\s+/g, " ").slice(0, max);
// "" / null / undefined -> null, a valid number -> number, anything else -> NaN (rejected by the caller)
function numOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 10000 ? n : NaN;
}

async function listCourses(env, id) {
  const { results } = await env.DB.prepare(`SELECT name, credit, parts FROM courses WHERE student_id = ? ORDER BY position, id`).bind(id).all();
  return (results || []).map((r) => {
    let parts = [];
    try { parts = JSON.parse(r.parts); } catch {}
    return { name: r.name, credit: r.credit, parts: Array.isArray(parts) ? parts : [] };
  });
}

async function saveCourses(request, env, id) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: "Too much data." }, 413);
  let b; try { b = JSON.parse(raw); } catch { b = null; }
  if (!b || !Array.isArray(b.courses)) return json({ error: "Invalid data." }, 400);
  if (b.courses.length > MAX_COURSES) return json({ error: `At most ${MAX_COURSES} courses.` }, 400);
  const clean = [];
  for (const c of b.courses) {
    if (!c || typeof c !== "object" || !Array.isArray(c.parts) || c.parts.length > MAX_PARTS) return json({ error: "Invalid course." }, 400);
    const credit = numOrNull(c.credit);
    if (Number.isNaN(credit) || (credit !== null && credit > 30)) return json({ error: "Invalid credit." }, 400);
    const parts = [];
    for (const p of c.parts) {
      if (!p || typeof p !== "object") return json({ error: "Invalid part." }, 400);
      const g = numOrNull(p.g), o = numOrNull(p.o);
      if (Number.isNaN(g) || Number.isNaN(o)) return json({ error: "Marks must be numbers from 0 to 10000." }, 400);
      parts.push({ n: cleanText(p.n, 40), g, o });
    }
    clean.push({ name: cleanText(c.name, 60), credit, parts });
  }
  const stmts = [env.DB.prepare(`DELETE FROM courses WHERE student_id = ?`).bind(id)];
  clean.forEach((c, i) => stmts.push(
    env.DB.prepare(`INSERT INTO courses (student_id, position, name, credit, parts) VALUES (?, ?, ?, ?, ?)`).bind(id, i, c.name, c.credit, JSON.stringify(c.parts))
  ));
  await env.DB.batch(stmts); // one transaction: all or nothing
  return json({ ok: true, courses: clean });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const isApi = path.startsWith("/api/");
    const isDash = path === "/dashboard" || path.startsWith("/dashboard/");
    if (!isApi && !isDash) return env.ASSETS.fetch(request);

    try {
      await ensureSchema(env);
      const secret = await getSecret(env);
      if (!secret) return json({ error: "Server is not set up yet (SESSION_SECRET is missing)." }, 500);

      // Protected dashboard files: only with a valid PIN session.
      if (isDash) {
        const sess = await getSession(request, env);
        if (!sess) {
          const mode = request.headers.get("Sec-Fetch-Mode");
          const isPageOpen = mode === "navigate" || (!mode && !request.headers.get("Authorization") && (request.headers.get("Accept") || "").includes("text/html"));
          if (isPageOpen) return new Response(null, { status: 302, headers: { Location: "/?unlock=1", "Cache-Control": "no-store" } });
          return json({ error: "Locked." }, 401);
        }
        const res = await env.ASSETS.fetch(request);
        const out = new Response(res.body, res);
        out.headers.set("Cache-Control", "private, no-store");
        return out;
      }

      if (request.method === "GET" && path === "/api/me") {
        const sess = await getSession(request, env);
        return sess ? json({ ok: true, studentId: sess.id, nickname: sess.nick }) : json({ ok: false }, 401);
      }

      if (path === "/api/courses") {
        const sess = await getSession(request, env);
        if (!sess) return json({ error: "Locked." }, 401);
        if (request.method === "GET") return json({ ok: true, courses: await listCourses(env, sess.id) });
        if (request.method === "PUT") {
          const origin = request.headers.get("Origin");
          if (origin) { try { if (new URL(origin).host !== url.host) return json({ error: "Forbidden." }, 403); } catch { return json({ error: "Forbidden." }, 403); } }
          return await saveCourses(request, env, sess.id);
        }
        return json({ error: "Method not allowed." }, 405, { Allow: "GET, PUT" });
      }

      if (request.method !== "POST") return json({ error: "Not found." }, 404);
      // Block cross-site form posts
      const origin = request.headers.get("Origin");
      if (origin) { try { if (new URL(origin).host !== url.host) return json({ error: "Forbidden." }, 403); } catch { return json({ error: "Forbidden." }, 403); } }

      const ip = request.headers.get("CF-Connecting-IP") || "local";
      if (path === "/api/signup") return await signup(request, env, secret, ip);
      if (path === "/api/login") return await login(request, env, secret, ip);
      if (path === "/api/logout") return json({ ok: true }, 200, { "Set-Cookie": sessionCookie("", 0) });
      return json({ error: "Not found." }, 404);
    } catch (e) {
      return json({ error: "Something went wrong on the server." }, 500);
    }
  },
};

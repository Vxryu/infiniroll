// InfiniRoll server — accounts (username + password), server-side rolls, shared leaderboard.
const express = require("express");
const crypto = require("crypto");
const path = require("path");
const store = require("./store");
const game = require("./shared/game");

const PORT = process.env.PORT || 3000;
const PROD = process.env.NODE_ENV === "production";
const SESSION_DAYS = 30;
const COOKIE = "ir_sess";
const COLORS = ["#111111", "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#a855f7", "#ec4899"];

const app = express();
app.set("trust proxy", 1); // behind Render / Railway / etc.
app.disable("x-powered-by");
app.use(express.json({ limit: "10kb" }));
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "same-origin");
  res.set("X-Frame-Options", "DENY");
  next();
});

// ---------- helpers ----------
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const userKey = (name) => "user:" + String(name).toLowerCase();
const dayKey = () => new Date().toISOString().slice(0, 10);
function weekKey() {
  const d = new Date();
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return t.getUTCFullYear() + "-W" + Math.ceil(((t - y) / 864e5 + 1) / 7);
}
const scoreOf = (n) => game.evaluate(n).reduce((a, x) => a + x.b.ep, 0);

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return new Promise((resolve, reject) =>
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, key) => (err ? reject(err) : resolve({ salt, hash: key.toString("hex") })))
  );
}
async function checkPassword(password, user) {
  const { hash } = await hashPassword(password, user.salt);
  const a = Buffer.from(hash, "hex"), b = Buffer.from(user.hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function parseCookies(req) {
  const out = {};
  (req.headers.cookie || "").split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function setSessionCookie(req, res, token, maxAgeSec) {
  const parts = [`${COOKIE}=${token}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAgeSec}`];
  if (req.secure || PROD) parts.push("Secure");
  res.set("Set-Cookie", parts.join("; "));
}
function createSession(req, res, username) {
  const token = crypto.randomBytes(32).toString("hex");
  store.set("sess:" + sha256(token), { u: username.toLowerCase(), exp: Date.now() + SESSION_DAYS * 864e5 });
  setSessionCookie(req, res, token, SESSION_DAYS * 86400);
}
function currentUser(req) {
  const token = parseCookies(req)[COOKIE];
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const s = store.get("sess:" + sha256(token));
  if (!s) return null;
  if (s.exp < Date.now()) { store.del("sess:" + sha256(token)); return null; }
  return store.get(userKey(s.u)) || null;
}

// Simple in-memory rate limiter
const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  return arr.length > max;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some((t) => now - t < 3600e3)) hits.delete(k); }, 600e3).unref();

// Block cross-site POSTs (CSRF): browsers send Origin on POST
app.use("/api", (req, res, next) => {
  if (req.method !== "GET") {
    const origin = req.headers.origin;
    if (origin && new URL(origin).host !== req.headers.host) return res.status(403).json({ error: "Bad origin" });
  }
  next();
});

const publicProfile = (u) => ({ username: u.username, motto: u.motto || "", emoji: u.emoji || "", color: u.color || COLORS[0] });
const progress = (u) => ({ life: u.life || 0, rolls: u.rolls || 0, seen: u.seen || {}, top: u.top || [], last: u.last || null });

// ---------- account ----------
const USERNAME_RE = /^[A-Za-z0-9_]{3,16}$/;

app.post("/api/register", async (req, res) => {
  const { username, password } = req.body || {};
  if (limited("reg:" + req.ip, 5, 3600e3)) return res.status(429).json({ error: "Too many accounts created. Try again later." });
  if (typeof username !== "string" || !USERNAME_RE.test(username)) return res.status(400).json({ error: "Username: 3–16 letters, numbers or _" });
  if (typeof password !== "string" || password.length < 6 || password.length > 100) return res.status(400).json({ error: "Password: at least 6 characters" });
  if (store.get(userKey(username))) return res.status(409).json({ error: "That username is taken" });
  const { salt, hash } = await hashPassword(password);
  if (store.get(userKey(username))) return res.status(409).json({ error: "That username is taken" });
  const user = { username, salt, hash, created: Date.now(), motto: "", emoji: "", color: COLORS[0], life: 0, rolls: 0, seen: {}, top: [], likes: {} };
  store.set(userKey(username), user);
  createSession(req, res, username);
  res.json({ user: publicProfile(user), progress: progress(user) });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== "string" || typeof password !== "string") return res.status(400).json({ error: "Missing username or password" });
  if (limited("login:" + req.ip, 20, 900e3) || limited("loginu:" + username.toLowerCase(), 10, 900e3))
    return res.status(429).json({ error: "Too many attempts. Wait 15 minutes." });
  const user = store.get(userKey(username));
  // Always run a hash so response time doesn't reveal whether the username exists
  const ok = user ? await checkPassword(password, user) : (await hashPassword(password), false);
  if (!ok) return res.status(401).json({ error: "Wrong username or password" });
  createSession(req, res, user.username);
  res.json({ user: publicProfile(user), progress: progress(user) });
});

app.post("/api/logout", (req, res) => {
  const token = parseCookies(req)[COOKIE];
  if (token && /^[a-f0-9]{64}$/.test(token)) store.del("sess:" + sha256(token));
  setSessionCookie(req, res, "", 0);
  res.json({ ok: true });
});

app.get("/api/me", (req, res) => {
  const u = currentUser(req);
  res.json(u ? { user: publicProfile(u), progress: progress(u) } : { user: null });
});

app.post("/api/profile", (req, res) => {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: "Log in first" });
  const { motto, emoji, color } = req.body || {};
  if (typeof motto === "string") u.motto = motto.trim().replace(/\s+/g, " ").slice(0, 48);
  if (typeof emoji === "string") u.emoji = [...emoji.trim()].slice(0, 4).join("");
  if (COLORS.includes(color)) u.color = color;
  store.set(userKey(u.username), u);
  res.json({ user: publicProfile(u) });
});

app.post("/api/password", async (req, res) => {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: "Log in first" });
  const { current, next } = req.body || {};
  if (limited("pw:" + u.username.toLowerCase(), 10, 900e3)) return res.status(429).json({ error: "Too many attempts. Wait 15 minutes." });
  if (typeof current !== "string" || !(await checkPassword(current, u))) return res.status(401).json({ error: "Current password is wrong" });
  if (typeof next !== "string" || next.length < 6 || next.length > 100) return res.status(400).json({ error: "New password: at least 6 characters" });
  Object.assign(u, await hashPassword(next));
  store.set(userKey(u.username), u);
  // log out every other session
  for (const k of store.keys("sess:")) if (store.get(k).u === u.username.toLowerCase()) store.del(k);
  createSession(req, res, u.username);
  res.json({ ok: true });
});

// ---------- rolling (done on the server: no cheating) ----------
function secureNumber() {
  const r = crypto.randomInt(0, 100000000); // 1 in 100,000,000 steps
  if (r < 1) return 1000000;                // 1 in 100,000,000
  if (r < 5) return 0;                      // 1 in 25,000,000
  return 1 + crypto.randomInt(0, 999999);   // 1 .. 999,999
}

app.post("/api/roll", (req, res) => {
  const u = currentUser(req);
  const who = u ? "u:" + u.username.toLowerCase() : "ip:" + req.ip;
  if (limited("roll:" + who, 4, 1000)) return res.status(429).json({ error: "Slow down!" });
  const n = secureNumber();
  const ev = game.evaluate(n);
  const total = ev.reduce((a, x) => a + x.b.ep, 0);
  const result = { n, total, pct: game.topPct(total), badges: ev.map((x) => x.b.id) };
  if (!u) return res.json({ result, saved: false });

  const prevBest = u.top && u.top[0] ? u.top[0].total : 0;
  const fresh = [];
  u.seen = u.seen || {};
  for (const id of result.badges) { if (!u.seen[id]) fresh.push(id); u.seen[id] = (u.seen[id] || 0) + 1; }
  u.rolls = (u.rolls || 0) + 1;
  u.life = (u.life || 0) + total;
  u.top = [...(u.top || []), { n, total, pct: result.pct, badges: result.badges }].sort((a, b) => b.total - a.total).slice(0, 25);
  u.last = result;
  const dk = dayKey(), wk = weekKey();
  if (!u.day || u.day.key !== dk || total > u.day.total) u.day = { key: dk, n, total };
  if (!u.week || u.week.key !== wk || total > u.week.total) u.week = { key: wk, n, total };
  store.set(userKey(u.username), u);
  res.json({ result, saved: true, fresh, record: total > prevBest && u.rolls > 1, progress: progress(u) });
});

// ---------- leaderboard ----------
app.get("/api/leaderboard", (req, res) => {
  const view = ["day", "week", "all", "badges"].includes(req.query.view) ? req.query.view : "day";
  const me = currentUser(req);
  const users = store.values("user:");
  const likeCount = {};
  for (const u of users) for (const t in u.likes || {}) likeCount[t] = (likeCount[t] || 0) + 1;
  const dk = dayKey(), wk = weekKey();
  let rows = users.map((u) => {
    let pick = null;
    if (view === "day") pick = u.day && u.day.key === dk ? u.day : null;
    else if (view === "week") pick = u.week && u.week.key === wk ? u.week : null;
    else pick = u.top && u.top[0] ? u.top[0] : null;
    const badges = Object.keys(u.seen || {}).length;
    return { ...publicProfile(u), n: pick ? pick.n : null, total: pick ? pick.total : -1, badges,
      likes: likeCount[u.username.toLowerCase()] || 0, liked: !!(me && me.likes && me.likes[u.username.toLowerCase()]), me: !!(me && me.username === u.username) };
  });
  if (view === "badges") rows = rows.filter((r) => r.badges > 0).sort((a, b) => b.badges - a.badges || b.total - a.total);
  else rows = rows.filter((r) => r.n !== null).sort((a, b) => b.total - a.total);
  res.json({ view, total: game.BADGES.length, rows: rows.slice(0, 100) });
});

app.post("/api/like/:username", (req, res) => {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: "Log in to like" });
  const target = String(req.params.username).toLowerCase();
  if (!store.get(userKey(target))) return res.status(404).json({ error: "No such player" });
  if (target === u.username.toLowerCase()) return res.status(400).json({ error: "You can't like yourself" });
  if (limited("like:" + u.username.toLowerCase(), 30, 60e3)) return res.status(429).json({ error: "Slow down!" });
  u.likes = u.likes || {};
  if (u.likes[target]) delete u.likes[target]; else u.likes[target] = true;
  store.set(userKey(u.username), u);
  res.json({ liked: !!u.likes[target] });
});

// ---------- static files ----------
app.get("/game.js", (req, res) => res.sendFile(path.join(__dirname, "shared", "game.js")));
app.use(express.static(path.join(__dirname, "public")));

store.init().then(() => {
  app.listen(PORT, () => console.log(`InfiniRoll running on http://localhost:${PORT}`));
  const shutdown = () => store.flush().finally(() => process.exit(0));
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
});

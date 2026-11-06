// Tiny key/value store kept in memory and persisted to:
//   - PostgreSQL when DATABASE_URL is set (recommended online, e.g. Render Postgres / Neon / Supabase)
//   - a local JSON file otherwise (data/db.json) — fine for testing on your PC
const fs = require("fs");
const path = require("path");

class Store {
  constructor() {
    this.map = new Map();
    this.pg = null;
    this.file = path.join(__dirname, "data", "db.json");
    this.dirty = new Set();
    this.timer = null;
  }

  async init() {
    if (process.env.DATABASE_URL) {
      const { Pool } = require("pg");
      const ssl = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL) ? false : { rejectUnauthorized: false };
      this.pg = new Pool({ connectionString: process.env.DATABASE_URL, ssl });
      await this.pg.query("CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v JSONB NOT NULL)");
      const { rows } = await this.pg.query("SELECT k, v FROM kv");
      for (const r of rows) this.map.set(r.k, r.v);
      console.log(`[store] PostgreSQL: ${rows.length} records loaded`);
    } else {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      if (fs.existsSync(this.file)) {
        const obj = JSON.parse(fs.readFileSync(this.file, "utf8"));
        for (const k in obj) this.map.set(k, obj[k]);
      }
      console.log(`[store] JSON file ${this.file}: ${this.map.size} records loaded`);
      console.log("[store] Tip: set DATABASE_URL to use PostgreSQL (files are wiped on most free hosts).");
    }
  }

  get(k) { return this.map.get(k); }
  keys(prefix) { return [...this.map.keys()].filter((k) => k.startsWith(prefix)); }
  values(prefix) { return this.keys(prefix).map((k) => this.map.get(k)); }

  set(k, v) { this.map.set(k, v); this.dirty.add(k); this.schedule(); }
  del(k) { this.map.delete(k); this.dirty.add(k); this.schedule(); }

  schedule() {
    if (this.timer) return;
    this.timer = setTimeout(() => { this.timer = null; this.flush().catch((e) => console.error("[store] flush failed", e)); }, 300);
  }

  async flush() {
    const keys = [...this.dirty];
    this.dirty.clear();
    if (!keys.length) return;
    if (this.pg) {
      for (const k of keys) {
        if (this.map.has(k)) await this.pg.query("INSERT INTO kv (k, v) VALUES ($1, $2) ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v", [k, JSON.stringify(this.map.get(k))]);
        else await this.pg.query("DELETE FROM kv WHERE k = $1", [k]);
      }
    } else {
      const tmp = this.file + ".tmp";
      fs.writeFileSync(tmp, JSON.stringify(Object.fromEntries(this.map)));
      fs.renameSync(tmp, this.file);
    }
  }
}

module.exports = new Store();

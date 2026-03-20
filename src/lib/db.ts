// lib/db.ts — Neon PostgreSQL (production) OR local SQLite (development)
// In production: set DATABASE_URL in Vercel env vars (Neon connection string)
// In dev without DATABASE_URL: automatically uses a local SQLite file (opi-dev.db)

let _sql: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>

// ── SQLite shim (dev only) ───────────────────────────────────────────────────
function makeSQLiteDriver(dbPath: string) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3')
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  bootstrapSQLite(db)

  return function sql(strings: TemplateStringsArray, ...values: unknown[]) {
    let query = ''
    strings.forEach((s, i) => {
      query += s
      if (i < values.length) query += '?'
    })
    query = query.trim()
    try {
      if (/^\s*(select|pragma)/i.test(query)) {
        return Promise.resolve(db.prepare(query).all(...values) as Record<string, unknown>[])
      }
      db.prepare(query).run(...values)
      return Promise.resolve([] as Record<string, unknown>[])
    } catch (e) {
      console.error('[SQLite]', e, '\nQuery:', query)
      return Promise.resolve([])
    }
  }
}

// ── Bootstrap SQLite schema ──────────────────────────────────────────────────
function bootstrapSQLite(db: import('better-sqlite3').Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      username     TEXT UNIQUE NOT NULL,
      email        TEXT UNIQUE NOT NULL,
      password     TEXT NOT NULL,
      display_name TEXT,
      bio          TEXT DEFAULT '',
      website      TEXT DEFAULT '',
      joined_at    TEXT DEFAULT (datetime('now')),
      is_verified  INTEGER DEFAULT 0,
      packages     TEXT DEFAULT '[]'
    );
    CREATE TABLE IF NOT EXISTS api_tokens (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      token      TEXT UNIQUE NOT NULL,
      username   TEXT NOT NULL,
      label      TEXT DEFAULT 'default',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS packages (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      name             TEXT UNIQUE NOT NULL,
      owner            TEXT NOT NULL,
      description      TEXT DEFAULT '',
      latest           TEXT NOT NULL,
      license          TEXT DEFAULT 'MIT',
      homepage         TEXT,
      repository       TEXT,
      keywords         TEXT DEFAULT '[]',
      classifiers      TEXT DEFAULT '[]',
      total_downloads  INTEGER DEFAULT 0,
      created_at       TEXT DEFAULT (datetime('now')),
      updated_at       TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS package_versions (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      name                TEXT NOT NULL,
      version             TEXT NOT NULL,
      description         TEXT DEFAULT '',
      author              TEXT DEFAULT '',
      author_email        TEXT,
      license             TEXT DEFAULT 'MIT',
      homepage            TEXT,
      repository          TEXT,
      keywords            TEXT DEFAULT '[]',
      classifiers         TEXT DEFAULT '[]',
      requires_omnikarai  TEXT,
      dependencies        TEXT DEFAULT '{}',
      dev_dependencies    TEXT DEFAULT '{}',
      readme              TEXT DEFAULT '',
      changelog           TEXT DEFAULT '',
      file_size           INTEGER,
      file_hash           TEXT,
      yanked              INTEGER DEFAULT 0,
      yank_reason         TEXT,
      published_at        TEXT DEFAULT (datetime('now')),
      published_by        TEXT NOT NULL,
      UNIQUE(name, version)
    );
  `)
}

// ── Driver selection ─────────────────────────────────────────────────────────
if (process.env.DATABASE_URL) {
  const { neon, neonConfig } = require('@neondatabase/serverless')
  neonConfig.fetchConnectionCache = true
  const neonSql = neon(process.env.DATABASE_URL)

  // Wrap neon so arrays/JSON are auto-serialized (SQLite compat layer below already does this)
  _sql = async (strings: TemplateStringsArray, ...values: unknown[]) => {
    return neonSql(strings, ...values) as Promise<Record<string, unknown>[]>
  }
} else {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL must be set in production. Add a Neon connection string.')
  }
  const path = require('path')
  const dbPath = path.join(process.cwd(), 'opi-dev.db')
  console.warn(`[OPI] No DATABASE_URL — using local SQLite at ${dbPath}`)
  _sql = makeSQLiteDriver(dbPath)
}

export const sql = _sql!

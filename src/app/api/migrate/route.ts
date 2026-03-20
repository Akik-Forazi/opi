// GET /api/migrate  — run once after deploy to create tables + seed data
// Protected by MIGRATE_SECRET env var
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  username     TEXT UNIQUE NOT NULL,
  email        TEXT UNIQUE NOT NULL,
  password     TEXT NOT NULL,
  display_name TEXT,
  bio          TEXT    DEFAULT '',
  website      TEXT    DEFAULT '',
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  is_verified  BOOLEAN DEFAULT FALSE,
  packages     TEXT[]  DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS api_tokens (
  id         SERIAL PRIMARY KEY,
  token      TEXT UNIQUE NOT NULL,
  username   TEXT NOT NULL,
  label      TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS packages (
  id               SERIAL PRIMARY KEY,
  name             TEXT UNIQUE NOT NULL,
  owner            TEXT NOT NULL,
  description      TEXT    DEFAULT '',
  latest           TEXT    NOT NULL,
  license          TEXT    DEFAULT 'MIT',
  homepage         TEXT,
  repository       TEXT,
  keywords         TEXT[]  DEFAULT '{}',
  classifiers      TEXT[]  DEFAULT '{}',
  total_downloads  BIGINT  DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS package_versions (
  id                  SERIAL PRIMARY KEY,
  name                TEXT NOT NULL,
  version             TEXT NOT NULL,
  description         TEXT    DEFAULT '',
  author              TEXT    DEFAULT '',
  author_email        TEXT,
  license             TEXT    DEFAULT 'MIT',
  homepage            TEXT,
  repository          TEXT,
  keywords            TEXT[]  DEFAULT '{}',
  classifiers         TEXT[]  DEFAULT '{}',
  requires_omnikarai  TEXT,
  dependencies        JSONB   DEFAULT '{}',
  dev_dependencies    JSONB   DEFAULT '{}',
  readme              TEXT    DEFAULT '',
  changelog           TEXT    DEFAULT '',
  file_size           BIGINT,
  file_hash           TEXT,
  yanked              BOOLEAN DEFAULT FALSE,
  yank_reason         TEXT,
  published_at        TIMESTAMPTZ DEFAULT NOW(),
  published_by        TEXT NOT NULL,
  UNIQUE(name, version)
);

CREATE INDEX IF NOT EXISTS idx_packages_updated    ON packages(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_packages_owner      ON packages(owner);
CREATE INDEX IF NOT EXISTS idx_pkg_versions_name   ON package_versions(name);
CREATE INDEX IF NOT EXISTS idx_api_tokens_username ON api_tokens(username);
`

const SEEDS = [
  { name: 'math_extra',   owner: 'fraziym', desc: 'Extended math: factorial, combinations, primes, statistics', latest: '1.0.0', license: 'MIT', kw: ['math','statistics','factorial','primes'], dl: 142, date: '2026-03-01T00:00:00Z', author: 'Fraziym Tech', deps: {}, readme: '# math_extra\n\nExtended math for Omnikarai.\n\n```\nuse math_extra\nprint(math_extra.factorial(10))\nprint(math_extra.is_prime(97))\n```\n' },
  { name: 'stringx',      owner: 'fraziym', desc: 'Extended string manipulation: reverse, pad, split, join, title_case', latest: '1.2.0', license: 'MIT', kw: ['string','text','format','transform'], dl: 287, date: '2026-03-05T00:00:00Z', author: 'Fraziym Tech', deps: {}, readme: '# stringx\n\nExtended string operations.\n\n```\nuse stringx\nprint(stringx.reverse("hello"))  # olleh\n```\n' },
  { name: 'vectors',      owner: 'fraziym', desc: '2D/3D vector math: dot, cross, normalize, lerp, length', latest: '0.9.0', license: 'MIT', kw: ['vector','math','3d','linear-algebra'], dl: 63, date: '2026-03-10T00:00:00Z', author: 'Fraziym Tech', deps: { math: '>=1.0' }, readme: '# vectors\n\nFast vector math.\n\n```\nuse vectors\nset v = vectors.vec2(3.0, 4.0)\nprint(vectors.length(v))  # 5.0\n```\n' },
  { name: 'collections',  owner: 'fraziym', desc: 'Data structures: Stack, Queue, LinkedList, HashMap, PriorityQueue', latest: '1.0.0', license: 'MIT', kw: ['data-structures','stack','queue','hashmap'], dl: 198, date: '2026-03-12T00:00:00Z', author: 'Fraziym Tech', deps: {}, readme: '# collections\n\nData structures for Omnikarai.\n\n```\nuse collections\nset s = collections.stack_new()\ncollections.push(s, 42)\n```\n' },
  { name: 'json_parse',   owner: 'fraziym', desc: 'JSON parser and serializer — parse JSON strings, serialize values', latest: '0.8.0', license: 'MIT', kw: ['json','parse','serialize','data'], dl: 321, date: '2026-03-14T00:00:00Z', author: 'Fraziym Tech', deps: {}, readme: '# json_parse\n\nJSON for Omnikarai.\n\n```\nuse json_parse\nset obj = json_parse.parse("{\\\"name\\\": \\\"Akik\\\"}")\n```\n' },
]

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-migrate-secret') || new URL(req.url).searchParams.get('secret')
  const expected = process.env.MIGRATE_SECRET
  if (expected && secret !== expected)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    // Create tables
    await sql(SCHEMA)

    // Seed if empty
    const [{ c }] = await sql`SELECT COUNT(*) as c FROM packages`
    let seeded = 0
    if (Number(c) === 0) {
      for (const s of SEEDS) {
        await sql`
          INSERT INTO packages (name, owner, description, latest, license, keywords, total_downloads, created_at, updated_at)
          VALUES (${s.name}, ${s.owner}, ${s.desc}, ${s.latest}, ${s.license},
                  ${s.kw}, ${s.dl}, ${s.date}, ${s.date})
          ON CONFLICT (name) DO NOTHING`
        await sql`
          INSERT INTO package_versions (name, version, description, author, license, keywords, dependencies, readme, published_at, published_by)
          VALUES (${s.name}, ${s.latest}, ${s.desc}, ${s.author}, ${s.license},
                  ${s.kw}, ${JSON.stringify(s.deps)}, ${s.readme}, ${s.date}, ${s.owner})
          ON CONFLICT (name, version) DO NOTHING`
        seeded++
      }
    }

    return NextResponse.json({ ok: true, message: `Tables created. Seeded ${seeded} packages.` })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

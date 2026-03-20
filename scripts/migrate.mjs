// scripts/migrate.mjs
// Run once to create all tables in Neon.
// Usage: node scripts/migrate.mjs
// Or hit GET /api/migrate once after deploy (requires MIGRATE_SECRET header).

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

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

CREATE INDEX IF NOT EXISTS idx_packages_name        ON packages(name);
CREATE INDEX IF NOT EXISTS idx_packages_owner       ON packages(owner);
CREATE INDEX IF NOT EXISTS idx_packages_updated     ON packages(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_pkg_versions_name    ON package_versions(name);
CREATE INDEX IF NOT EXISTS idx_api_tokens_username  ON api_tokens(username);
CREATE INDEX IF NOT EXISTS idx_users_email          ON users(email);
`

async function migrate() {
  console.log('Running migrations...')
  await sql(SCHEMA)
  console.log('✓ Tables created')
  await seedData()
  console.log('✓ Done')
}

async function seedData() {
  // Only seed if packages table is empty
  const rows = await sql`SELECT COUNT(*) as c FROM packages`
  if (Number(rows[0].c) > 0) { console.log('  (already seeded)'); return }

  const seeds = [
    {
      name: 'math_extra', owner: 'fraziym', description: 'Extended math: factorial, combinations, primes, statistics',
      latest: '1.0.0', license: 'MIT', keywords: ['math','statistics','factorial','primes'],
      downloads: 142, created: '2026-03-01',
      ver: { author: 'Fraziym Tech', deps: {}, readme: '# math_extra\n\nExtended math for Omnikarai.\n\n```\nuse math_extra\nprint(math_extra.factorial(10))\n```\n' }
    },
    {
      name: 'stringx', owner: 'fraziym', description: 'Extended string manipulation: reverse, pad, split, join, title_case',
      latest: '1.2.0', license: 'MIT', keywords: ['string','text','format','transform'],
      downloads: 287, created: '2026-03-05',
      ver: { author: 'Fraziym Tech', deps: {}, readme: '# stringx\n\nExtended string operations.\n\n```\nuse stringx\nprint(stringx.reverse("hello"))  # olleh\n```\n' }
    },
    {
      name: 'vectors', owner: 'fraziym', description: '2D/3D vector math: dot, cross, normalize, lerp, length',
      latest: '0.9.0', license: 'MIT', keywords: ['vector','math','3d','linear-algebra'],
      downloads: 63, created: '2026-03-10',
      ver: { author: 'Fraziym Tech', deps: { math: '>=1.0' }, readme: '# vectors\n\nFast vector math.\n\n```\nuse vectors\nset v = vectors.vec2(3.0, 4.0)\nprint(vectors.length(v))  # 5.0\n```\n' }
    },
    {
      name: 'collections', owner: 'fraziym', description: 'Data structures: Stack, Queue, LinkedList, HashMap, PriorityQueue',
      latest: '1.0.0', license: 'MIT', keywords: ['data-structures','stack','queue','hashmap'],
      downloads: 198, created: '2026-03-12',
      ver: { author: 'Fraziym Tech', deps: {}, readme: '# collections\n\nData structures for Omnikarai.\n\n```\nuse collections\nset s = collections.stack_new()\ncollections.push(s, 42)\n```\n' }
    },
    {
      name: 'json_parse', owner: 'fraziym', description: 'JSON parser and serializer — parse JSON strings, serialize values',
      latest: '0.8.0', license: 'MIT', keywords: ['json','parse','serialize','data'],
      downloads: 321, created: '2026-03-14',
      ver: { author: 'Fraziym Tech', deps: {}, readme: '# json_parse\n\nJSON for Omnikarai.\n\n```\nuse json_parse\nset obj = json_parse.parse("{\"name\": \"Akik\"}")\n```\n' }
    },
  ]

  for (const s of seeds) {
    await sql`
      INSERT INTO packages (name, owner, description, latest, license, keywords, total_downloads, created_at, updated_at)
      VALUES (${s.name}, ${s.owner}, ${s.description}, ${s.latest}, ${s.license},
              ${s.keywords}, ${s.downloads}, ${s.created}, ${s.created})
      ON CONFLICT (name) DO NOTHING`

    await sql`
      INSERT INTO package_versions (name, version, description, author, license, keywords, dependencies, readme, published_at, published_by)
      VALUES (${s.name}, ${s.latest}, ${s.description}, ${s.ver.author}, ${s.license},
              ${s.keywords}, ${JSON.stringify(s.ver.deps)}, ${s.ver.readme}, ${s.created}, ${s.owner})
      ON CONFLICT (name, version) DO NOTHING`
  }
  console.log(`  Seeded ${seeds.length} packages`)
}

migrate().catch(e => { console.error(e); process.exit(1) })

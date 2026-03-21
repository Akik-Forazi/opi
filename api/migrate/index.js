// api/migrate/index.js — GET /api/migrate?secret=xxx
// Runs schema + seeds data. Call once after first deploy.
const { sql } = require('../_db');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, display_name TEXT,
  bio TEXT DEFAULT '', website TEXT DEFAULT '',
  joined_at TIMESTAMPTZ DEFAULT NOW(), is_verified BOOLEAN DEFAULT FALSE,
  packages TEXT[] DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS api_tokens (
  id SERIAL PRIMARY KEY, token TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL, label TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL,
  owner TEXT NOT NULL, description TEXT DEFAULT '', latest TEXT NOT NULL,
  license TEXT DEFAULT 'MIT', homepage TEXT, repository TEXT,
  keywords TEXT[] DEFAULT '{}', classifiers TEXT[] DEFAULT '{}',
  total_downloads BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS package_versions (
  id SERIAL PRIMARY KEY, name TEXT NOT NULL, version TEXT NOT NULL,
  description TEXT DEFAULT '', author TEXT DEFAULT '', author_email TEXT,
  license TEXT DEFAULT 'MIT', homepage TEXT, repository TEXT,
  keywords TEXT[] DEFAULT '{}', classifiers TEXT[] DEFAULT '{}',
  requires_omnikarai TEXT, dependencies JSONB DEFAULT '{}',
  dev_dependencies JSONB DEFAULT '{}', readme TEXT DEFAULT '',
  changelog TEXT DEFAULT '', file_size BIGINT, file_hash TEXT,
  yanked BOOLEAN DEFAULT FALSE, yank_reason TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(), published_by TEXT NOT NULL,
  UNIQUE(name, version)
);
CREATE INDEX IF NOT EXISTS idx_pkg_updated  ON packages(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_pkg_owner    ON packages(owner);
CREATE INDEX IF NOT EXISTS idx_pkgver_name  ON package_versions(name);
CREATE INDEX IF NOT EXISTS idx_tok_username ON api_tokens(username);
`;

const SEEDS = [
  { n:'math_extra',  v:'1.0.0', dl:142, d:'Extended math: factorial, combinations, primes, statistics',
    kw:['math','statistics','factorial','primes'], dt:'2026-03-01T00:00:00Z',
    readme:'# math_extra\n\nExtended math for Omnikarai.\n\n```\nuse math_extra\nprint(math_extra.factorial(10))\nprint(math_extra.is_prime(97))\n```', deps:{} },
  { n:'stringx',     v:'1.2.0', dl:287, d:'Extended string: reverse, pad, title_case, snake_case, slugify',
    kw:['string','text','format','transform'], dt:'2026-03-05T00:00:00Z',
    readme:'# stringx\n\nString operations for Omnikarai.\n\n```\nuse stringx\nprint(stringx.reverse("hello"))  # olleh\nprint(stringx.title_case("hello world"))  # Hello World\n```', deps:{} },
  { n:'vectors',     v:'0.9.0', dl:63,  d:'2D/3D vector math: dot, cross, normalize, lerp, length',
    kw:['vector','math','3d','linear-algebra'], dt:'2026-03-10T00:00:00Z',
    readme:'# vectors\n\nFast vector math.\n\n```\nuse vectors\nset v = vectors.vec3(1.0,2.0,3.0)\nprint(vectors.length(v))\n```', deps:{ math:'>=1.0' } },
  { n:'collections', v:'1.0.0', dl:198, d:'Data structures: Stack, Queue, LinkedList, HashMap, PriorityQueue',
    kw:['data-structures','stack','queue','hashmap'], dt:'2026-03-12T00:00:00Z',
    readme:'# collections\n\nData structures.\n\n```\nuse collections\nset s = collections.stack_new()\ncollections.push(s, 42)\nprint(collections.pop(s))\n```', deps:{} },
  { n:'json_parse',  v:'0.8.0', dl:321, d:'JSON parser and serializer for Omnikarai',
    kw:['json','parse','serialize','data'], dt:'2026-03-14T00:00:00Z',
    readme:'# json_parse\n\nJSON for Omnikarai.\n\n```\nuse json_parse\nset obj = json_parse.parse("{\"name\":\"Akik\"}")\n```', deps:{} },
  { n:'http_client', v:'1.1.0', dl:28,  d:'HTTP/HTTPS client — GET, POST, headers, timeouts',
    kw:['http','network','web','request'], dt:'2026-03-15T00:00:00Z',
    readme:'# http_client\n\nHTTP client for Omnikarai.\n\n```\nuse http_client\nset r = http_client.get("https://api.example.com")\nprint(r.body)\n```', deps:{} },
  { n:'crypto_core', v:'2.0.0', dl:63,  d:'SHA-256, MD5, base64 encode/decode, AES-128',
    kw:['crypto','hash','sha256','base64','aes'], dt:'2026-03-16T00:00:00Z',
    readme:'# crypto_core\n\nCrypto for Omnikarai.\n\n```\nuse crypto_core\nprint(crypto_core.sha256("hello"))\nprint(crypto_core.base64_encode("hello"))\n```', deps:{} },
  { n:'regex_lite',  v:'0.5.0', dl:15,  d:'Lightweight regex engine for pattern matching',
    kw:['regex','pattern','match','text'], dt:'2026-03-17T00:00:00Z',
    readme:'# regex_lite\n\nRegex for Omnikarai.\n\n```\nuse regex_lite\nset m = regex_lite.match("hello world","\\\\w+")\nprint(m.text)\n```', deps:{} },
];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const secret = req.headers['x-migrate-secret'] || req.query.secret;
  if (process.env.MIGRATE_SECRET && secret !== process.env.MIGRATE_SECRET)
    return res.status(403).json({ error: 'Forbidden — provide ?secret=<MIGRATE_SECRET>' });

  try {
    // Run schema (split by semicolon, skip blanks)
    const stmts = SCHEMA.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of stmts) await sql.unsafe(stmt);

    const [row] = await sql`SELECT COUNT(*) as c FROM packages`;
    let seeded = 0;
    if (Number(row.c) === 0) {
      for (const s of SEEDS) {
        await sql`INSERT INTO packages (name,owner,description,latest,license,keywords,total_downloads,created_at,updated_at)
                  VALUES (${s.n},'fraziym',${s.d},${s.v},'MIT',${s.kw},${s.dl},${s.dt},${s.dt})
                  ON CONFLICT(name) DO NOTHING`;
        await sql`INSERT INTO package_versions (name,version,description,author,license,keywords,dependencies,readme,published_at,published_by)
                  VALUES (${s.n},${s.v},${s.d},'Fraziym Tech','MIT',${s.kw},${JSON.stringify(s.deps)},${s.readme},${s.dt},'fraziym')
                  ON CONFLICT(name,version) DO NOTHING`;
        seeded++;
      }
    }
    return res.status(200).json({ ok: true, message: `Tables ready. Seeded ${seeded} packages.` });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

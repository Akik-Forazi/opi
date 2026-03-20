#!/usr/bin/env node
// scripts/seed.mjs — seed the local dev SQLite DB with sample packages
// Run: node scripts/seed.mjs  (or: npm run db:seed)

import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '..', 'opi-dev.db')
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

const now = new Date().toISOString()

const packages = [
  { name:'math_extra',   version:'1.0.0', description:'Extended math: factorial, combinations, statistics, primes',    author:'Fraziym Tech', keywords:'["math","statistics","factorial","primes"]',          downloads:42 },
  { name:'stringx',      version:'1.2.0', description:'Extended string manipulation: reverse, pad, repeat, title_case', author:'Fraziym Tech', keywords:'["string","text","format","transform"]',              downloads:87 },
  { name:'vectors',      version:'0.9.0', description:'2D/3D vector math: dot, cross, normalize, lerp, length',         author:'Fraziym Tech', keywords:'["vector","math","3d","linear-algebra","game"]',      downloads:19 },
  { name:'collections',  version:'1.0.0', description:'Stack, Queue, LinkedList, HashMap for Omnikarai',                author:'Fraziym Tech', keywords:'["data-structures","stack","queue","hashmap"]',        downloads:31 },
  { name:'json_parse',   version:'0.8.0', description:'Lightweight JSON parser and serializer',                          author:'Fraziym Tech', keywords:'["json","parse","serialize","data"]',                  downloads:54 },
  { name:'http_client',  version:'1.1.0', description:'Simple HTTP/HTTPS client — GET, POST, headers, timeouts',         author:'Fraziym Tech', keywords:'["http","network","web","request"]',                  downloads:28 },
  { name:'regex_lite',   version:'0.5.0', description:'Lightweight regex engine for Omnikarai programs',                 author:'Fraziym Tech', keywords:'["regex","pattern","match","text"]',                  downloads:15 },
  { name:'crypto_core',  version:'2.0.0', description:'SHA-256, MD5, base64 encode/decode, AES-128',                     author:'Fraziym Tech', keywords:'["crypto","hash","sha256","base64","aes"]',            downloads:63 },
]

const upsertPkg = db.prepare(`
  INSERT INTO packages (name, owner, description, latest, license, keywords, classifiers, total_downloads, created_at, updated_at)
  VALUES (@name, 'fraziym', @description, @version, 'MIT', @keywords, '[]', @downloads, @now, @now)
  ON CONFLICT(name) DO UPDATE SET
    latest=excluded.latest, description=excluded.description,
    keywords=excluded.keywords, total_downloads=excluded.total_downloads, updated_at=excluded.updated_at
`)
const upsertVer = db.prepare(`
  INSERT INTO package_versions (name, version, description, author, license, keywords, classifiers,
    dependencies, dev_dependencies, readme, changelog, published_at, published_by)
  VALUES (@name, @version, @description, @author, 'MIT', @keywords, '[]',
    '{}', '{}', @readme, '', @now, 'fraziym')
  ON CONFLICT(name, version) DO NOTHING
`)

const seedAll = db.transaction(() => {
  for (const p of packages) {
    upsertPkg.run({ ...p, now })
    upsertVer.run({
      ...p, now,
      readme: `# ${p.name}\n\n${p.description}\n\n## Install\n\n\`\`\`\nomnip install ${p.name}\n\`\`\`\n\n## Usage\n\n\`\`\`omnikarai\nuse ${p.name}\n\`\`\`\n`
    })
  }
})
seedAll()

console.log(`✓ Seeded ${packages.length} packages into ${dbPath}`)
db.close()

// lib/db.ts — Neon PostgreSQL connection
// Set DATABASE_URL in Vercel env vars (from Neon dashboard → Connection string)

import { neon, neonConfig } from '@neondatabase/serverless'

neonConfig.fetchConnectionCache = true

// sql tagged template — use this everywhere instead of a raw pool
export const sql = neon(process.env.DATABASE_URL!)

// ─── Schema (auto-run on first deploy via /api/migrate) ──────
//
// users
//   id            SERIAL PRIMARY KEY
//   username      TEXT UNIQUE NOT NULL
//   email         TEXT UNIQUE NOT NULL
//   password      TEXT NOT NULL          -- bcrypt hash
//   display_name  TEXT
//   bio           TEXT DEFAULT ''
//   website       TEXT DEFAULT ''
//   joined_at     TIMESTAMPTZ DEFAULT NOW()
//   is_verified   BOOLEAN DEFAULT FALSE
//
// api_tokens
//   id            SERIAL PRIMARY KEY
//   token         TEXT UNIQUE NOT NULL   -- full opi_xxx token (hashed in future)
//   username      TEXT NOT NULL
//   created_at    TIMESTAMPTZ DEFAULT NOW()
//
// packages
//   id            SERIAL PRIMARY KEY
//   name          TEXT UNIQUE NOT NULL
//   owner         TEXT NOT NULL
//   description   TEXT DEFAULT ''
//   latest        TEXT NOT NULL
//   license       TEXT DEFAULT 'MIT'
//   homepage      TEXT
//   repository    TEXT
//   keywords      TEXT[]  DEFAULT '{}'
//   classifiers   TEXT[]  DEFAULT '{}'
//   total_downloads BIGINT DEFAULT 0
//   created_at    TIMESTAMPTZ DEFAULT NOW()
//   updated_at    TIMESTAMPTZ DEFAULT NOW()
//
// package_versions
//   id            SERIAL PRIMARY KEY
//   name          TEXT NOT NULL
//   version       TEXT NOT NULL
//   description   TEXT DEFAULT ''
//   author        TEXT DEFAULT ''
//   author_email  TEXT
//   license       TEXT DEFAULT 'MIT'
//   homepage      TEXT
//   repository    TEXT
//   keywords      TEXT[]  DEFAULT '{}'
//   classifiers   TEXT[]  DEFAULT '{}'
//   requires_omnikarai TEXT
//   dependencies  JSONB   DEFAULT '{}'
//   dev_dependencies JSONB DEFAULT '{}'
//   readme        TEXT    DEFAULT ''
//   changelog     TEXT    DEFAULT ''
//   file_size     BIGINT
//   file_hash     TEXT
//   yanked        BOOLEAN DEFAULT FALSE
//   yank_reason   TEXT
//   published_at  TIMESTAMPTZ DEFAULT NOW()
//   published_by  TEXT NOT NULL
//   UNIQUE(name, version)

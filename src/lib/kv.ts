// lib/kv.ts — Vercel KV wrapper with fallback in-memory store for dev
// In production: set KV_URL + KV_REST_API_TOKEN env vars in Vercel dashboard

import { kv } from '@vercel/kv'

// Re-export kv directly — Vercel KV is Redis-compatible
export { kv }

// ─── Key schema ───────────────────────────────────────────────
// user:<username>           → UserRecord
// user_by_email:<email>     → username (index)
// token:<api_token>         → username (index)
// pkg:<name>                → PackageMeta
// pkg_versions:<name>       → string[] (sorted version list)
// pkg_version:<name>:<ver>  → PackageVersion
// pkg_list                  → string[] (all package names, sorted)
// pkg_downloads:<name>      → number
// pkg_recent                → string[] (recent 20 package names)
// ──────────────────────────────────────────────────────────────

export const KEYS = {
  user:         (u: string) => `user:${u}`,
  userByEmail:  (e: string) => `user_by_email:${e.toLowerCase()}`,
  apiToken:     (t: string) => `token:${t}`,
  pkg:          (n: string) => `pkg:${n}`,
  pkgVersions:  (n: string) => `pkg_versions:${n}`,
  pkgVersion:   (n: string, v: string) => `pkg_version:${n}:${v}`,
  pkgDownloads: (n: string) => `pkg_downloads:${n}`,
  pkgList:      () => 'pkg_list',
  pkgRecent:    () => 'pkg_recent',
}

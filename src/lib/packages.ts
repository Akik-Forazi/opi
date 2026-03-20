// lib/packages.ts — package CRUD (Neon PostgreSQL in prod, SQLite in dev)
import { sql } from './db'
import type { PackageMeta, PackageVersion } from './types'

// ── helpers ──────────────────────────────────────────────────────────────────
function parseArr(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[]
  if (typeof v === 'string') { try { return JSON.parse(v) } catch { return [] } }
  return []
}
function parseObj(v: unknown): Record<string, string> {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, string>
  if (typeof v === 'string') { try { return JSON.parse(v) } catch { return {} } }
  return {}
}

export function validatePackageName(name: string): string | null {
  if (!name) return 'Name is required'
  if (!/^[a-z][a-z0-9_-]{0,63}$/.test(name))
    return 'Name must start with a letter; only lowercase letters, numbers, - or _ (max 64 chars)'
  return null
}
export function validateVersion(v: string): string | null {
  if (!v) return 'Version is required'
  if (!/^\d+\.\d+(\.\d+)?([.-][a-zA-Z0-9]+)*$/.test(v))
    return 'Version must follow semver format: 1.0.0'
  return null
}

function rowToMeta(r: Record<string, unknown>): PackageMeta {
  return {
    name:            r.name as string,
    owner:           r.owner as string,
    description:     (r.description as string) || '',
    latest:          r.latest as string,
    license:         (r.license as string) || 'MIT',
    homepage:        r.homepage as string | undefined,
    repository:      r.repository as string | undefined,
    keywords:        parseArr(r.keywords),
    classifiers:     parseArr(r.classifiers),
    total_downloads: Number(r.total_downloads) || 0,
    created_at:      r.created_at as string,
    updated_at:      r.updated_at as string,
  }
}

function rowToVersion(r: Record<string, unknown>): PackageVersion {
  return {
    name:               r.name as string,
    version:            r.version as string,
    description:        (r.description as string) || '',
    author:             (r.author as string) || '',
    author_email:       r.author_email as string | undefined,
    license:            (r.license as string) || 'MIT',
    homepage:           r.homepage as string | undefined,
    repository:         r.repository as string | undefined,
    keywords:           parseArr(r.keywords),
    classifiers:        parseArr(r.classifiers),
    requires_omnikarai: r.requires_omnikarai as string | undefined,
    dependencies:       parseObj(r.dependencies),
    dev_dependencies:   parseObj(r.dev_dependencies),
    readme:             (r.readme as string) || '',
    changelog:          (r.changelog as string) || '',
    file_size:          r.file_size as number | undefined,
    file_hash:          r.file_hash as string | undefined,
    yanked:             Boolean(r.yanked),
    yank_reason:        r.yank_reason as string | undefined,
    published_at:       r.published_at as string,
    published_by:       r.published_by as string,
  }
}

export async function getPackage(name: string): Promise<PackageMeta | null> {
  const rows = await sql`SELECT * FROM packages WHERE name = ${name} LIMIT 1`
  return rows.length ? rowToMeta(rows[0]) : null
}

export async function getPackageVersion(name: string, version: string): Promise<PackageVersion | null> {
  const rows = await sql`SELECT * FROM package_versions WHERE name = ${name} AND version = ${version} LIMIT 1`
  return rows.length ? rowToVersion(rows[0]) : null
}

export async function getPackageVersions(name: string): Promise<string[]> {
  const rows = await sql`SELECT version FROM package_versions WHERE name = ${name} ORDER BY published_at ASC`
  return rows.map(r => r.version as string)
}

export async function getAllPackageNames(): Promise<string[]> {
  const rows = await sql`SELECT name FROM packages ORDER BY name ASC`
  return rows.map(r => r.name as string)
}

export async function getRecentPackages(): Promise<PackageMeta[]> {
  const rows = await sql`SELECT * FROM packages ORDER BY updated_at DESC LIMIT 20`
  return rows.map(rowToMeta)
}

export async function incrementDownloads(name: string): Promise<void> {
  await sql`UPDATE packages SET total_downloads = total_downloads + 1 WHERE name = ${name}`
}

export async function searchPackages(query: string): Promise<PackageMeta[]> {
  const q = query.trim()
  if (!q) {
    const rows = await sql`SELECT * FROM packages ORDER BY total_downloads DESC`
    return rows.map(rowToMeta)
  }
  const like = `%${q}%`
  // SQLite-compatible search (no ILIKE, no = ANY())
  const rows = await sql`
    SELECT * FROM packages
    WHERE LOWER(name) LIKE LOWER(${like})
       OR LOWER(description) LIKE LOWER(${like})
       OR LOWER(keywords) LIKE LOWER(${like})
    ORDER BY
      CASE WHEN LOWER(name) = LOWER(${q}) THEN 0
           WHEN LOWER(name) LIKE LOWER(${q + '%'}) THEN 1
           ELSE 2 END,
      total_downloads DESC
  `
  return rows.map(rowToMeta)
}

export async function upsertPackage(meta: PackageMeta): Promise<void> {
  const kw  = JSON.stringify(meta.keywords)
  const cls = JSON.stringify(meta.classifiers ?? [])
  await sql`
    INSERT INTO packages (name, owner, description, latest, license, homepage, repository,
                          keywords, classifiers, total_downloads, created_at, updated_at)
    VALUES (${meta.name}, ${meta.owner}, ${meta.description}, ${meta.latest}, ${meta.license},
            ${meta.homepage ?? null}, ${meta.repository ?? null},
            ${kw}, ${cls},
            ${meta.total_downloads}, ${meta.created_at}, ${meta.updated_at})
    ON CONFLICT (name) DO UPDATE SET
      owner        = excluded.owner,
      description  = excluded.description,
      latest       = excluded.latest,
      license      = excluded.license,
      homepage     = excluded.homepage,
      repository   = excluded.repository,
      keywords     = excluded.keywords,
      classifiers  = excluded.classifiers,
      updated_at   = excluded.updated_at
  `
}

export async function insertPackageVersion(ver: PackageVersion): Promise<void> {
  const kw  = JSON.stringify(ver.keywords)
  const cls = JSON.stringify(ver.classifiers ?? [])
  const dep = JSON.stringify(ver.dependencies)
  const dev = JSON.stringify(ver.dev_dependencies ?? {})
  await sql`
    INSERT INTO package_versions
      (name, version, description, author, author_email, license, homepage, repository,
       keywords, classifiers, requires_omnikarai, dependencies, dev_dependencies,
       readme, changelog, file_size, file_hash, yanked, yank_reason, published_at, published_by)
    VALUES
      (${ver.name}, ${ver.version}, ${ver.description}, ${ver.author}, ${ver.author_email ?? null},
       ${ver.license}, ${ver.homepage ?? null}, ${ver.repository ?? null},
       ${kw}, ${cls}, ${ver.requires_omnikarai ?? null},
       ${dep}, ${dev},
       ${ver.readme ?? ''}, ${ver.changelog ?? ''}, ${ver.file_size ?? null}, ${ver.file_hash ?? null},
       ${ver.yanked ? 1 : 0}, ${ver.yank_reason ?? null}, ${ver.published_at}, ${ver.published_by})
    ON CONFLICT (name, version) DO NOTHING
  `
}

export async function updateVersionYank(name: string, version: string, yanked: boolean, reason?: string): Promise<void> {
  await sql`UPDATE package_versions SET yanked = ${yanked ? 1 : 0}, yank_reason = ${reason ?? null}
            WHERE name = ${name} AND version = ${version}`
}

export async function deletePackage(name: string): Promise<void> {
  await sql`DELETE FROM package_versions WHERE name = ${name}`
  await sql`DELETE FROM packages WHERE name = ${name}`
}

export async function seedIfEmpty(): Promise<void> {} // handled by /api/migrate

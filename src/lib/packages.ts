// lib/packages.ts — package CRUD using Neon PostgreSQL
import { sql } from './db'
import type { PackageMeta, PackageVersion } from './types'

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
    description:     r.description as string,
    latest:          r.latest as string,
    license:         r.license as string,
    homepage:        r.homepage as string | undefined,
    repository:      r.repository as string | undefined,
    keywords:        (r.keywords as string[]) || [],
    classifiers:     (r.classifiers as string[]) || [],
    total_downloads: Number(r.total_downloads) || 0,
    created_at:      r.created_at as string,
    updated_at:      r.updated_at as string,
  }
}

function rowToVersion(r: Record<string, unknown>): PackageVersion {
  return {
    name:               r.name as string,
    version:            r.version as string,
    description:        r.description as string,
    author:             r.author as string,
    author_email:       r.author_email as string | undefined,
    license:            r.license as string,
    homepage:           r.homepage as string | undefined,
    repository:         r.repository as string | undefined,
    keywords:           (r.keywords as string[]) || [],
    classifiers:        (r.classifiers as string[]) || [],
    requires_omnikarai: r.requires_omnikarai as string | undefined,
    dependencies:       (r.dependencies as Record<string, string>) || {},
    dev_dependencies:   (r.dev_dependencies as Record<string, string>) || {},
    readme:             r.readme as string,
    changelog:          r.changelog as string,
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
  const rows = await sql`
    SELECT *,
      (CASE WHEN LOWER(name) = LOWER(${q})      THEN 30 ELSE 0 END +
       CASE WHEN LOWER(name) LIKE LOWER(${q+'%'}) THEN 15 ELSE 0 END +
       CASE WHEN LOWER(name) LIKE LOWER(${like}) THEN 10 ELSE 0 END +
       CASE WHEN LOWER(description) LIKE LOWER(${like}) THEN 3 ELSE 0 END +
       CASE WHEN ${q} = ANY(keywords)             THEN 5 ELSE 0 END) AS score
    FROM packages
    WHERE LOWER(name) LIKE LOWER(${like})
       OR LOWER(description) LIKE LOWER(${like})
       OR ${q} ILIKE ANY(keywords)
    ORDER BY score DESC, total_downloads DESC
  `
  return rows.map(rowToMeta)
}

export async function upsertPackage(meta: PackageMeta): Promise<void> {
  await sql`
    INSERT INTO packages (name, owner, description, latest, license, homepage, repository,
                          keywords, classifiers, total_downloads, created_at, updated_at)
    VALUES (${meta.name}, ${meta.owner}, ${meta.description}, ${meta.latest}, ${meta.license},
            ${meta.homepage ?? null}, ${meta.repository ?? null},
            ${meta.keywords}, ${meta.classifiers ?? []},
            ${meta.total_downloads}, ${meta.created_at}, ${meta.updated_at})
    ON CONFLICT (name) DO UPDATE SET
      owner        = EXCLUDED.owner,
      description  = EXCLUDED.description,
      latest       = EXCLUDED.latest,
      license      = EXCLUDED.license,
      homepage     = EXCLUDED.homepage,
      repository   = EXCLUDED.repository,
      keywords     = EXCLUDED.keywords,
      classifiers  = EXCLUDED.classifiers,
      updated_at   = EXCLUDED.updated_at
  `
}

export async function insertPackageVersion(ver: PackageVersion): Promise<void> {
  await sql`
    INSERT INTO package_versions
      (name, version, description, author, author_email, license, homepage, repository,
       keywords, classifiers, requires_omnikarai, dependencies, dev_dependencies,
       readme, changelog, file_size, file_hash, yanked, yank_reason, published_at, published_by)
    VALUES
      (${ver.name}, ${ver.version}, ${ver.description}, ${ver.author}, ${ver.author_email ?? null},
       ${ver.license}, ${ver.homepage ?? null}, ${ver.repository ?? null},
       ${ver.keywords}, ${ver.classifiers ?? []}, ${ver.requires_omnikarai ?? null},
       ${JSON.stringify(ver.dependencies)}, ${JSON.stringify(ver.dev_dependencies ?? {})},
       ${ver.readme ?? ''}, ${ver.changelog ?? ''}, ${ver.file_size ?? null}, ${ver.file_hash ?? null},
       ${ver.yanked}, ${ver.yank_reason ?? null}, ${ver.published_at}, ${ver.published_by})
    ON CONFLICT (name, version) DO NOTHING
  `
}

export async function updateVersionYank(name: string, version: string, yanked: boolean, reason?: string): Promise<void> {
  await sql`
    UPDATE package_versions SET yanked = ${yanked}, yank_reason = ${reason ?? null}
    WHERE name = ${name} AND version = ${version}
  `
}

export async function deletePackage(name: string): Promise<void> {
  await sql`DELETE FROM package_versions WHERE name = ${name}`
  await sql`DELETE FROM packages WHERE name = ${name}`
}

// seedIfEmpty is now handled by /api/migrate — no-op here
export async function seedIfEmpty(): Promise<void> {}

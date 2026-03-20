// lib/packages.ts — package CRUD operations
import { kv, KEYS } from './kv'
import type { PackageMeta, PackageVersion } from './types'

// Validate package name
export function validatePackageName(name: string): string | null {
  if (!name) return 'Name is required'
  if (!/^[a-z][a-z0-9_-]{0,63}$/.test(name))
    return 'Name must start with a letter, only lowercase letters, numbers, - or _ allowed (max 64 chars)'
  return null
}

// Validate semver-ish version
export function validateVersion(v: string): string | null {
  if (!v) return 'Version is required'
  if (!/^\d+\.\d+(\.\d+)?([.-][a-zA-Z0-9]+)*$/.test(v))
    return 'Version must follow semver format: 1.0.0'
  return null
}

// Compare versions (simple semver)
export function compareVersions(a: string, b: string): number {
  const pa = a.replace(/[^0-9.]/g, '').split('.').map(Number)
  const pb = b.replace(/[^0-9.]/g, '').split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0)
    if (diff !== 0) return diff
  }
  return 0
}

export async function getPackage(name: string): Promise<PackageMeta | null> {
  return kv.get<PackageMeta>(KEYS.pkg(name))
}

export async function getPackageVersion(name: string, version: string): Promise<PackageVersion | null> {
  return kv.get<PackageVersion>(KEYS.pkgVersion(name, version))
}

export async function getPackageVersions(name: string): Promise<string[]> {
  return (await kv.get<string[]>(KEYS.pkgVersions(name))) || []
}

export async function getAllPackageNames(): Promise<string[]> {
  return (await kv.get<string[]>(KEYS.pkgList())) || []
}

export async function getRecentPackages(): Promise<string[]> {
  return (await kv.get<string[]>(KEYS.pkgRecent())) || []
}

export async function incrementDownloads(name: string): Promise<void> {
  await kv.incr(KEYS.pkgDownloads(name))
  // Sync to meta
  const dl = await kv.get<number>(KEYS.pkgDownloads(name))
  const meta = await getPackage(name)
  if (meta && dl !== null) {
    meta.total_downloads = dl
    await kv.set(KEYS.pkg(name), meta)
  }
}

export async function searchPackages(query: string): Promise<PackageMeta[]> {
  const allNames = await getAllPackageNames()
  const q = query.toLowerCase().trim()
  const results: PackageMeta[] = []

  for (const name of allNames) {
    const meta = await getPackage(name)
    if (!meta) continue

    if (!q) { results.push(meta); continue; }

    const score =
      (meta.name.toLowerCase().includes(q) ? 10 : 0) +
      (meta.name.toLowerCase() === q ? 20 : 0) +
      (meta.name.toLowerCase().startsWith(q) ? 5 : 0) +
      ((meta.description || '').toLowerCase().includes(q) ? 3 : 0) +
      ((meta.keywords || []).some(k => k.toLowerCase().includes(q)) ? 4 : 0)

    if (score > 0) results.push(meta)
  }

  // Sort by relevance then downloads
  if (q) {
    results.sort((a, b) => (b.total_downloads || 0) - (a.total_downloads || 0))
  }
  return results
}

// Seed default packages on first deploy
export async function seedIfEmpty(): Promise<void> {
  const existing = await getAllPackageNames()
  if (existing.length > 0) return

  const seeds: Array<{ meta: PackageMeta; version: PackageVersion }> = [
    {
      meta: {
        name: 'math_extra', owner: 'fraziym', description: 'Extended math functions: factorial, combinations, primes, statistics, number theory',
        latest: '1.0.0', license: 'MIT', homepage: 'https://opi.vercel.app',
        keywords: ['math', 'statistics', 'factorial', 'primes', 'number-theory'],
        created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z', total_downloads: 142,
      },
      version: {
        name: 'math_extra', version: '1.0.0', description: 'Extended math functions for Omnikarai',
        author: 'Fraziym Tech', license: 'MIT', keywords: ['math'],
        dependencies: {}, published_at: '2026-03-01T00:00:00Z', published_by: 'fraziym',
        yanked: false,
        readme: `# math_extra\n\nExtended math for Omnikarai.\n\n\`\`\`\nuse math_extra\nprint(math_extra.factorial(10))\nprint(math_extra.is_prime(97))\n\`\`\`\n`,
      },
    },
    {
      meta: {
        name: 'stringx', owner: 'fraziym', description: 'Extended string manipulation: reverse, pad, split, join, title_case, snake_case, slugify',
        latest: '1.2.0', license: 'MIT', keywords: ['string', 'text', 'format', 'transform'],
        created_at: '2026-03-05T00:00:00Z', updated_at: '2026-03-15T00:00:00Z', total_downloads: 287,
      },
      version: {
        name: 'stringx', version: '1.2.0', description: 'Extended string manipulation for Omnikarai',
        author: 'Fraziym Tech', license: 'MIT', keywords: ['string'],
        dependencies: {}, published_at: '2026-03-15T00:00:00Z', published_by: 'fraziym',
        yanked: false,
        readme: `# stringx\n\nExtended string operations.\n\n\`\`\`\nuse stringx\nprint(stringx.reverse("hello"))     # olleh\nprint(stringx.title_case("hello world"))  # Hello World\n\`\`\`\n`,
      },
    },
    {
      meta: {
        name: 'vectors', owner: 'fraziym', description: '2D/3D vector math: dot, cross, normalize, lerp, length, angle',
        latest: '0.9.0', license: 'MIT', keywords: ['vector', 'math', '3d', 'linear-algebra', 'game'],
        created_at: '2026-03-10T00:00:00Z', updated_at: '2026-03-10T00:00:00Z', total_downloads: 63,
      },
      version: {
        name: 'vectors', version: '0.9.0', description: '2D/3D vector math for Omnikarai',
        author: 'Fraziym Tech', license: 'MIT', keywords: ['vector', 'math'],
        dependencies: { 'math': '>=1.0' }, published_at: '2026-03-10T00:00:00Z', published_by: 'fraziym',
        yanked: false,
        readme: `# vectors\n\nFast vector math for Omnikarai.\n\n\`\`\`\nuse vectors\nset v = vectors.vec2(3.0, 4.0)\nprint(vectors.length(v))  # 5.0\n\`\`\`\n`,
      },
    },
    {
      meta: {
        name: 'collections', owner: 'fraziym', description: 'Data structures: Stack, Queue, LinkedList, HashMap, Set, PriorityQueue',
        latest: '1.0.0', license: 'MIT', keywords: ['data-structures', 'stack', 'queue', 'hashmap', 'linked-list'],
        created_at: '2026-03-12T00:00:00Z', updated_at: '2026-03-12T00:00:00Z', total_downloads: 198,
      },
      version: {
        name: 'collections', version: '1.0.0', description: 'Data structures for Omnikarai',
        author: 'Fraziym Tech', license: 'MIT', keywords: ['data-structures'],
        dependencies: {}, published_at: '2026-03-12T00:00:00Z', published_by: 'fraziym',
        yanked: false,
        readme: `# collections\n\nData structures for Omnikarai.\n\n\`\`\`\nuse collections\nset s = collections.stack_new()\ncollections.push(s, 42)\nprint(collections.pop(s))\n\`\`\`\n`,
      },
    },
    {
      meta: {
        name: 'json_parse', owner: 'fraziym', description: 'JSON parser and serializer — parse JSON strings, serialize Omnikarai values',
        latest: '0.8.0', license: 'MIT', keywords: ['json', 'parse', 'serialize', 'data', 'format'],
        created_at: '2026-03-14T00:00:00Z', updated_at: '2026-03-14T00:00:00Z', total_downloads: 321,
      },
      version: {
        name: 'json_parse', version: '0.8.0', description: 'JSON for Omnikarai',
        author: 'Fraziym Tech', license: 'MIT', keywords: ['json'],
        dependencies: {}, published_at: '2026-03-14T00:00:00Z', published_by: 'fraziym',
        yanked: false,
        readme: `# json_parse\n\nJSON parsing for Omnikarai.\n\n\`\`\`\nuse json_parse\nset obj = json_parse.parse("{\"name\": \"Akik\"}")\nprint(json_parse.get(obj, "name"))\n\`\`\`\n`,
      },
    },
  ]

  const names: string[] = []
  for (const { meta, version } of seeds) {
    await kv.set(KEYS.pkg(meta.name), meta)
    await kv.set(KEYS.pkgVersions(meta.name), [version.version])
    await kv.set(KEYS.pkgVersion(meta.name, version.version), version)
    await kv.set(KEYS.pkgDownloads(meta.name), meta.total_downloads)
    names.push(meta.name)
  }
  await kv.set(KEYS.pkgList(), names)
  await kv.set(KEYS.pkgRecent(), names.slice(0, 5))
}

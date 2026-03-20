// GET  /api/packages          — list / search packages
// POST /api/packages          — publish new package/version
import { NextRequest, NextResponse } from 'next/server'
import { kv, KEYS } from '@/lib/kv'
import { getCurrentUser } from '@/lib/auth'
import { validatePackageName, validateVersion, searchPackages, seedIfEmpty, getPackageVersions } from '@/lib/packages'
import type { PackageMeta, PackageVersion, UserRecord } from '@/lib/types'

export async function GET(req: NextRequest) {
  await seedIfEmpty()
  const { searchParams } = new URL(req.url)
  const q     = searchParams.get('q') || ''
  const page  = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'))

  const results = await searchPackages(q)
  const total   = results.length
  const start   = (page - 1) * limit
  const paged   = results.slice(start, start + limit)

  return NextResponse.json({ total, page, limit, packages: paged })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized — use: omnip publish .' }, { status: 401 })

  const body = await req.json()
  const { name, version, description, license, homepage, repository,
          keywords, classifiers, dependencies, dev_dependencies,
          requires_omnikarai, readme, changelog } = body

  const nameErr = validatePackageName(name)
  if (nameErr) return NextResponse.json({ error: nameErr }, { status: 400 })
  const verErr = validateVersion(version)
  if (verErr) return NextResponse.json({ error: verErr }, { status: 400 })
  if (!description) return NextResponse.json({ error: 'description is required' }, { status: 400 })

  // Check ownership — if package exists, only owner can publish
  const existing = await kv.get<PackageMeta>(KEYS.pkg(name))
  if (existing && existing.owner !== user.username)
    return NextResponse.json({ error: `Package '${name}' is owned by @${existing.owner}` }, { status: 403 })

  // Check version conflict
  const versions = await getPackageVersions(name)
  if (versions.includes(version))
    return NextResponse.json({ error: `${name}@${version} already exists. Bump your version.` }, { status: 409 })

  const now = new Date().toISOString()

  const pkgVersion: PackageVersion = {
    name, version, description: description || '',
    author: user.display_name || user.username,
    author_email: user.email,
    license: license || 'MIT',
    homepage: homepage || undefined,
    repository: repository || undefined,
    keywords: keywords || [],
    classifiers: classifiers || [],
    requires_omnikarai: requires_omnikarai || undefined,
    dependencies: dependencies || {},
    dev_dependencies: dev_dependencies || {},
    published_at: now,
    published_by: user.username,
    yanked: false,
    readme: readme || '',
    changelog: changelog || '',
  }

  // Update or create meta
  const newVersions = [...versions, version].sort()
  const meta: PackageMeta = {
    name,
    owner: user.username,
    description: description || (existing?.description || ''),
    latest: version,
    license: license || existing?.license || 'MIT',
    homepage: homepage || existing?.homepage,
    repository: repository || existing?.repository,
    keywords: keywords || existing?.keywords || [],
    classifiers: classifiers || existing?.classifiers || [],
    created_at: existing?.created_at || now,
    updated_at: now,
    total_downloads: existing?.total_downloads || 0,
  }

  await kv.set(KEYS.pkgVersion(name, version), pkgVersion)
  await kv.set(KEYS.pkgVersions(name), newVersions)
  await kv.set(KEYS.pkg(name), meta)

  // Update package list
  const allNames = (await kv.get<string[]>(KEYS.pkgList())) || []
  if (!allNames.includes(name)) {
    allNames.push(name)
    await kv.set(KEYS.pkgList(), allNames.sort())
  }

  // Update recent
  const recent = (await kv.get<string[]>(KEYS.pkgRecent())) || []
  const newRecent = [name, ...recent.filter(n => n !== name)].slice(0, 20)
  await kv.set(KEYS.pkgRecent(), newRecent)

  // Update user's package list
  const updatedUser: UserRecord = {
    ...user,
    packages: [...new Set([...(user.packages || []), name])],
  }
  await kv.set(KEYS.user(user.username), updatedUser)

  return NextResponse.json({ success: true, message: `Published ${name}@${version}` }, { status: 201 })
}

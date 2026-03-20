// GET /api/packages   — list + search
// POST /api/packages  — publish
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, updateUser, getUserByUsername } from '@/lib/auth'
import {
  validatePackageName, validateVersion, searchPackages,
  getPackage, getPackageVersions, upsertPackage, insertPackageVersion,
} from '@/lib/packages'
import type { PackageMeta, PackageVersion } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q     = searchParams.get('q') || ''
  const page  = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'))

  const results = await searchPackages(q)
  const total   = results.length
  const paged   = results.slice((page - 1) * limit, page * limit)
  return NextResponse.json({ total, page, limit, packages: paged })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized — set OPI_TOKEN and retry' }, { status: 401 })

  const body = await req.json()
  const { name, version, description, license, homepage, repository,
          keywords, classifiers, dependencies, dev_dependencies,
          requires_omnikarai, readme, changelog } = body

  const nameErr = validatePackageName(name)
  if (nameErr) return NextResponse.json({ error: nameErr }, { status: 400 })
  const verErr = validateVersion(version)
  if (verErr) return NextResponse.json({ error: verErr }, { status: 400 })
  if (!description) return NextResponse.json({ error: 'description is required' }, { status: 400 })

  const existing = await getPackage(name)
  if (existing && existing.owner !== user.username)
    return NextResponse.json({ error: `Package '${name}' is owned by @${existing.owner}` }, { status: 403 })

  const versions = await getPackageVersions(name)
  if (versions.includes(version))
    return NextResponse.json({ error: `${name}@${version} already exists. Bump your version.` }, { status: 409 })

  const now = new Date().toISOString()
  const meta: PackageMeta = {
    name, owner: user.username,
    description: description || '',
    latest: version,
    license: license || 'MIT',
    homepage: homepage || undefined,
    repository: repository || undefined,
    keywords: keywords || [],
    classifiers: classifiers || [],
    created_at: existing?.created_at || now,
    updated_at: now,
    total_downloads: existing?.total_downloads || 0,
  }
  const ver: PackageVersion = {
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

  await upsertPackage(meta)
  await insertPackageVersion(ver)

  // Add to user's package list
  const freshUser = await getUserByUsername(user.username)
  if (freshUser) {
    const pkgs = [...new Set([...(freshUser.packages || []), name])]
    await updateUser(user.username, { packages: pkgs })
  }

  return NextResponse.json({ success: true, message: `Published ${name}@${version}` }, { status: 201 })
}

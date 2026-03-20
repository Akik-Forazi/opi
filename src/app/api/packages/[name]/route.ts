// GET    /api/packages/[name]           — package meta + latest version
// DELETE /api/packages/[name]           — delete package (owner only)
// PATCH  /api/packages/[name]?yank=ver  — yank a version
import { NextRequest, NextResponse } from 'next/server'
import { kv, KEYS } from '@/lib/kv'
import { getCurrentUser } from '@/lib/auth'
import { getPackage, getPackageVersion, getPackageVersions, incrementDownloads } from '@/lib/packages'
import type { PackageVersion } from '@/lib/types'

type Ctx = { params: { name: string } }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { name } = params
  const meta = await getPackage(name)
  if (!meta) return NextResponse.json({ error: `Package '${name}' not found` }, { status: 404 })

  const versions = await getPackageVersions(name)
  const latest   = await getPackageVersion(name, meta.latest)

  await incrementDownloads(name)

  return NextResponse.json({ ...meta, versions, latest_release: latest })
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { name } = params
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const meta = await getPackage(name)
  if (!meta) return NextResponse.json({ error: 'Package not found' }, { status: 404 })
  if (meta.owner !== user.username)
    return NextResponse.json({ error: 'Only the package owner can delete it' }, { status: 403 })

  // Delete all versions
  const versions = await getPackageVersions(name)
  for (const v of versions) await kv.del(KEYS.pkgVersion(name, v))
  await kv.del(KEYS.pkgVersions(name))
  await kv.del(KEYS.pkg(name))
  await kv.del(KEYS.pkgDownloads(name))

  // Remove from list
  const allNames = ((await kv.get<string[]>(KEYS.pkgList())) || []).filter(n => n !== name)
  await kv.set(KEYS.pkgList(), allNames)

  return NextResponse.json({ ok: true, message: `Deleted '${name}'` })
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { name } = params
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const meta = await getPackage(name)
  if (!meta) return NextResponse.json({ error: 'Package not found' }, { status: 404 })
  if (meta.owner !== user.username)
    return NextResponse.json({ error: 'Only the owner can yank versions' }, { status: 403 })

  const { yank_version, yank_reason, unyank } = await req.json()
  if (!yank_version) return NextResponse.json({ error: 'yank_version required' }, { status: 400 })

  const ver = await getPackageVersion(name, yank_version)
  if (!ver) return NextResponse.json({ error: 'Version not found' }, { status: 404 })

  const updated: PackageVersion = { ...ver, yanked: !unyank, yank_reason: unyank ? undefined : (yank_reason || 'Yanked by owner') }
  await kv.set(KEYS.pkgVersion(name, yank_version), updated)

  return NextResponse.json({ ok: true, yanked: updated.yanked })
}

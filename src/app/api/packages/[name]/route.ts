// GET/DELETE/PATCH /api/packages/[name]
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import {
  getPackage, getPackageVersion, getPackageVersions,
  incrementDownloads, deletePackage, updateVersionYank,
} from '@/lib/packages'

type Ctx = { params: { name: string } }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const meta = await getPackage(params.name)
  if (!meta) return NextResponse.json({ error: `Package '${params.name}' not found` }, { status: 404 })
  const versions = await getPackageVersions(params.name)
  const latest   = await getPackageVersion(params.name, meta.latest)
  await incrementDownloads(params.name)
  return NextResponse.json({ ...meta, versions, latest_release: latest })
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const meta = await getPackage(params.name)
  if (!meta) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (meta.owner !== user.username)
    return NextResponse.json({ error: 'Only the owner can delete this package' }, { status: 403 })
  await deletePackage(params.name)
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const meta = await getPackage(params.name)
  if (!meta) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (meta.owner !== user.username)
    return NextResponse.json({ error: 'Only the owner can yank versions' }, { status: 403 })
  const { yank_version, yank_reason, unyank } = await req.json()
  if (!yank_version) return NextResponse.json({ error: 'yank_version required' }, { status: 400 })
  await updateVersionYank(params.name, yank_version, !unyank, yank_reason)
  return NextResponse.json({ ok: true, yanked: !unyank })
}

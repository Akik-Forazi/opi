// PATCH /api/user/profile
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, updateUser } from '@/lib/auth'

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { display_name, bio, website } = await req.json()
  await updateUser(user.username, {
    display_name: display_name?.trim() || user.display_name,
    bio:     bio?.trim()     ?? user.bio,
    website: website?.trim() ?? user.website,
  })
  return NextResponse.json({ ok: true })
}

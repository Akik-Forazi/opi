// GET /api/auth/me
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({
    username: user.username, email: user.email, display_name: user.display_name,
    bio: user.bio, website: user.website, joined_at: user.joined_at,
    packages: user.packages, is_verified: user.is_verified,
  })
}

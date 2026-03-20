// GET/POST/DELETE /api/user/tokens
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, generateApiToken, getUserTokens, createApiToken, revokeApiToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tokens = await getUserTokens(user.username)
  const masked = tokens.map(t => ({
    display: t.token.slice(0, 10) + '...' + t.token.slice(-4),
    label: t.label,
    created_at: t.created_at,
  }))
  return NextResponse.json({ tokens: masked })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tokens = await getUserTokens(user.username)
  if (tokens.length >= 10)
    return NextResponse.json({ error: 'Maximum 10 API tokens per account' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const label = body?.label || 'default'
  const token = generateApiToken()
  await createApiToken(user.username, token, label)
  return NextResponse.json({ token, message: 'Save this token — it will not be shown again' }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const prefix = searchParams.get('token')
  if (!prefix) return NextResponse.json({ error: 'token param required' }, { status: 400 })

  const tokens = await getUserTokens(user.username)
  const match = tokens.find(t => t.token.startsWith(prefix.replace(/\.\.\..+$/, '')))
  if (!match) return NextResponse.json({ error: 'Token not found' }, { status: 404 })
  await revokeApiToken(user.username, match.token)
  return NextResponse.json({ ok: true })
}

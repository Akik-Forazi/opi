// GET  /api/user/tokens  — list tokens (masked)
// POST /api/user/tokens  — create new API token
// DELETE /api/user/tokens?token=xxx — revoke token
import { NextRequest, NextResponse } from 'next/server'
import { kv, KEYS } from '@/lib/kv'
import { getCurrentUser, generateApiToken } from '@/lib/auth'
import type { UserRecord } from '@/lib/types'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Return masked tokens
  const masked = (user.api_tokens || []).map(t => t.slice(0, 10) + '...' + t.slice(-4))
  return NextResponse.json({ tokens: masked })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((user.api_tokens || []).length >= 10)
    return NextResponse.json({ error: 'Maximum 10 API tokens per account' }, { status: 400 })

  const token = generateApiToken()
  await kv.set(KEYS.apiToken(token), user.username)

  const updated: UserRecord = { ...user, api_tokens: [...(user.api_tokens || []), token] }
  await kv.set(KEYS.user(user.username), updated)

  // Only return the full token once — never again
  return NextResponse.json({ token, message: 'Save this token — it will not be shown again' }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const prefix = searchParams.get('token')
  if (!prefix) return NextResponse.json({ error: 'token param required' }, { status: 400 })

  const match = (user.api_tokens || []).find(t => t.startsWith(prefix.replace('...', '')))
  if (!match) return NextResponse.json({ error: 'Token not found' }, { status: 404 })

  await kv.del(KEYS.apiToken(match))
  const updated: UserRecord = { ...user, api_tokens: user.api_tokens.filter(t => t !== match) }
  await kv.set(KEYS.user(user.username), updated)
  return NextResponse.json({ ok: true })
}

// POST /api/auth/register
import { NextRequest, NextResponse } from 'next/server'
import { kv, KEYS } from '@/lib/kv'
import { hashPassword, signJWT } from '@/lib/auth'
import type { UserRecord } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { username, email, password, display_name } = await req.json()
    if (!username || !email || !password)
      return NextResponse.json({ error: 'username, email and password required' }, { status: 400 })
    if (!/^[a-zA-Z][a-zA-Z0-9_-]{2,31}$/.test(username))
      return NextResponse.json({ error: 'Username: 3-32 chars, start with letter, only letters/numbers/-/_' }, { status: 400 })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    if (password.length < 8)
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    const uname = username.toLowerCase()
    if (await kv.get(KEYS.user(uname)))
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    if (await kv.get(KEYS.userByEmail(email)))
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })

    const user: UserRecord = {
      username: uname, email: email.toLowerCase(),
      password: await hashPassword(password),
      display_name: display_name || uname,
      bio: '', joined_at: new Date().toISOString(),
      api_tokens: [], packages: [], is_verified: false,
    }
    await kv.set(KEYS.user(uname), user)
    await kv.set(KEYS.userByEmail(user.email), uname)

    const token = await signJWT({ username: uname })
    const res = NextResponse.json(
      { user: { username: uname, email: user.email, display_name: user.display_name }, token },
      { status: 201 }
    )
    res.cookies.set('opi_token', token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 2592000 })
    return res
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

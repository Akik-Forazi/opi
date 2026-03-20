// POST /api/auth/login
import { NextRequest, NextResponse } from 'next/server'
import { kv, KEYS } from '@/lib/kv'
import { verifyPassword, signJWT } from '@/lib/auth'
import type { UserRecord } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (!username || !password)
      return NextResponse.json({ error: 'username and password required' }, { status: 400 })

    const uname = username.toLowerCase()
    const user = await kv.get<UserRecord>(KEYS.user(uname))

    // also try login by email
    let resolved = user
    if (!resolved && username.includes('@')) {
      const byEmail = await kv.get<string>(KEYS.userByEmail(username.toLowerCase()))
      if (byEmail) resolved = await kv.get<UserRecord>(KEYS.user(byEmail))
    }

    if (!resolved || !(await verifyPassword(password, resolved.password)))
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })

    const token = await signJWT({ username: resolved.username })
    const res = NextResponse.json({
      user: { username: resolved.username, email: resolved.email, display_name: resolved.display_name },
      token,
    })
    res.cookies.set('opi_token', token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 2592000 })
    return res
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

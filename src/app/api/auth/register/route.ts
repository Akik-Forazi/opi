// POST /api/auth/register
import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, signJWT, getUserByUsername, getUserByEmail, createUser } from '@/lib/auth'

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
    if (await getUserByUsername(uname))
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    if (await getUserByEmail(email))
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })

    await createUser({
      username:     uname,
      email:        email.toLowerCase(),
      password:     await hashPassword(password),
      display_name: display_name || uname,
      bio:          '',
      website:      '',
      joined_at:    new Date().toISOString(),
      is_verified:  false,
      packages:     [],
    })

    const token = await signJWT({ username: uname })
    const res = NextResponse.json(
      { user: { username: uname, email: email.toLowerCase(), display_name: display_name || uname }, token },
      { status: 201 }
    )
    res.cookies.set('opi_token', token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 2592000 })
    return res
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

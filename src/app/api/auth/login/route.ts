// POST /api/auth/login
import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, signJWT, getUserByUsername, getUserByEmail } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (!username || !password)
      return NextResponse.json({ error: 'username and password required' }, { status: 400 })

    let user = await getUserByUsername(username.toLowerCase())
    if (!user && username.includes('@')) user = await getUserByEmail(username.toLowerCase())
    if (!user || !(await verifyPassword(password, user.password)))
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })

    const token = await signJWT({ username: user.username })
    const res = NextResponse.json({
      user: { username: user.username, email: user.email, display_name: user.display_name },
      token,
    })
    res.cookies.set('opi_token', token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 2592000 })
    return res
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

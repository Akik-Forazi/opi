// lib/auth.ts — JWT + bcrypt + DB (Neon prod / SQLite dev)
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { sql } from './db'
import type { UserRecord } from './types'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'opi-dev-secret-change-in-production'
)

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
export async function signJWT(payload: { username: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET)
}
export async function verifyJWT(token: string): Promise<{ username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { username: string }
  } catch { return null }
}
export function generateApiToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const arr = new Uint8Array(40)
  crypto.getRandomValues(arr)
  return 'opi_' + Array.from(arr).map(b => chars[b % chars.length]).join('')
}
export function extractBearerToken(req: Request): string | null {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(/opi_token=([^;]+)/)
  return match ? match[1] : null
}

// ── DB helpers ────────────────────────────────────────────────────────────────
function parsePackages(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[]
  if (typeof v === 'string') { try { return JSON.parse(v) } catch { return [] } }
  return []
}
function rowToUser(r: Record<string, unknown>): UserRecord {
  return {
    username:     r.username as string,
    email:        r.email as string,
    password:     r.password as string,
    display_name: r.display_name as string | undefined,
    bio:          (r.bio as string) || '',
    website:      (r.website as string) || '',
    joined_at:    r.joined_at as string,
    is_verified:  Boolean(r.is_verified),
    api_tokens:   [],
    packages:     parsePackages(r.packages),
  }
}

export async function getUserByUsername(username: string): Promise<UserRecord | null> {
  const rows = await sql`SELECT * FROM users WHERE username = ${username.toLowerCase()} LIMIT 1`
  return rows.length ? rowToUser(rows[0]) : null
}
export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const rows = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()} LIMIT 1`
  return rows.length ? rowToUser(rows[0]) : null
}
export async function createUser(user: Omit<UserRecord, 'api_tokens'>): Promise<void> {
  const pkgs = JSON.stringify(user.packages ?? [])
  await sql`
    INSERT INTO users (username, email, password, display_name, bio, website, joined_at, is_verified, packages)
    VALUES (${user.username}, ${user.email}, ${user.password}, ${user.display_name ?? null},
            ${user.bio ?? ''}, ${user.website ?? ''}, ${user.joined_at}, ${user.is_verified ? 1 : 0}, ${pkgs})
  `
}
export async function updateUser(username: string, fields: Partial<UserRecord>): Promise<void> {
  if (fields.display_name !== undefined || fields.bio !== undefined || fields.website !== undefined) {
    await sql`
      UPDATE users SET
        display_name = COALESCE(${fields.display_name ?? null}, display_name),
        bio          = COALESCE(${fields.bio ?? null}, bio),
        website      = COALESCE(${fields.website ?? null}, website)
      WHERE username = ${username}
    `
  }
  if (fields.packages !== undefined) {
    const pkgs = JSON.stringify(fields.packages)
    await sql`UPDATE users SET packages = ${pkgs} WHERE username = ${username}`
  }
}
export async function getUserTokens(username: string): Promise<Array<{ token: string; label: string; created_at: string }>> {
  const rows = await sql`SELECT token, label, created_at FROM api_tokens WHERE username = ${username} ORDER BY created_at DESC`
  return rows as Array<{ token: string; label: string; created_at: string }>
}
export async function createApiToken(username: string, token: string, label = 'default'): Promise<void> {
  await sql`INSERT INTO api_tokens (token, username, label) VALUES (${token}, ${username}, ${label})`
}
export async function revokeApiToken(username: string, token: string): Promise<void> {
  await sql`DELETE FROM api_tokens WHERE username = ${username} AND token = ${token}`
}
export async function getUserByApiToken(token: string): Promise<UserRecord | null> {
  const rows = await sql`SELECT username FROM api_tokens WHERE token = ${token} LIMIT 1`
  if (!rows.length) return null
  return getUserByUsername(rows[0].username as string)
}
export async function validateApiToken(token: string): Promise<UserRecord | null> {
  if (!token.startsWith('opi_')) return null
  return getUserByApiToken(token)
}
export async function getCurrentUser(req: Request): Promise<UserRecord | null> {
  const token = extractBearerToken(req)
  if (!token) return null
  const jwtPayload = await verifyJWT(token)
  if (jwtPayload) return getUserByUsername(jwtPayload.username)
  return validateApiToken(token)
}

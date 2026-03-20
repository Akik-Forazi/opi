// lib/auth.ts — JWT + bcrypt auth helpers
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { kv, KEYS } from './kv'
import type { UserRecord } from './types'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'opi-dev-secret-change-in-production-please'
)
const JWT_EXPIRY = '30d'

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
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET)
}

export async function verifyJWT(token: string): Promise<{ username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { username: string }
  } catch {
    return null
  }
}

export function generateApiToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const arr = new Uint8Array(40)
  crypto.getRandomValues(arr)
  return 'opi_' + Array.from(arr).map(b => chars[b % chars.length]).join('')
}

// Extract JWT from Authorization header or cookie
export function extractBearerToken(req: Request): string | null {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(/opi_token=([^;]+)/)
  return match ? match[1] : null
}

// Validate API token (for omnip publish)
export async function validateApiToken(token: string): Promise<UserRecord | null> {
  if (!token.startsWith('opi_')) return null
  const username = await kv.get<string>(KEYS.apiToken(token))
  if (!username) return null
  return kv.get<UserRecord>(KEYS.user(username))
}

// Get current user from request
export async function getCurrentUser(req: Request): Promise<UserRecord | null> {
  const token = extractBearerToken(req)
  if (!token) return null

  // Try JWT first
  const jwtPayload = await verifyJWT(token)
  if (jwtPayload) {
    return kv.get<UserRecord>(KEYS.user(jwtPayload.username))
  }

  // Try API token
  return validateApiToken(token)
}

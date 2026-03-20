// GET /api/search?q=...
import { NextRequest, NextResponse } from 'next/server'
import { searchPackages, seedIfEmpty } from '@/lib/packages'

export async function GET(req: NextRequest) {
  await seedIfEmpty()
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const results = await searchPackages(q)
  return NextResponse.json({ query: q, total: results.length, packages: results })
}

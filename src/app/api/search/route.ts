import { NextRequest, NextResponse } from 'next/server'
import { searchPackages } from '@/lib/packages'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const results = await searchPackages(q)
  return NextResponse.json({ query: q, total: results.length, packages: results })
}

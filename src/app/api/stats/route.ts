import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const [pkgRow] = await sql`SELECT COUNT(*) as total, COALESCE(SUM(total_downloads),0) as dl FROM packages`
    return NextResponse.json({
      registry: 'OPI — Omnikarai Package Index',
      version: '2.0.0', status: 'live',
      total_packages:   Number(pkgRow.total),
      total_downloads:  Number(pkgRow.dl),
      url: 'https://opi-nine.vercel.app',
      endpoints: {
        list:    'GET  /api/packages',
        search:  'GET  /api/packages?q=<query>',
        info:    'GET  /api/packages/:name',
        publish: 'POST /api/packages',
        stats:   'GET  /api/stats',
      },
    })
  } catch {
    return NextResponse.json({ status: 'error', message: 'Database unreachable' }, { status: 503 })
  }
}

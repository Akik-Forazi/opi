// GET /api/stats
import { NextResponse } from 'next/server'
import { getAllPackageNames, getPackage, seedIfEmpty } from '@/lib/packages'

export async function GET() {
  await seedIfEmpty()
  const names = await getAllPackageNames()
  let total_downloads = 0
  for (const n of names) {
    const meta = await getPackage(n)
    total_downloads += meta?.total_downloads || 0
  }
  return NextResponse.json({
    registry: 'OPI — Omnikarai Package Index',
    version: '2.0.0', status: 'live',
    total_packages: names.length,
    total_downloads,
    url: 'https://opi-nine.vercel.app',
    api_docs: 'https://opi-nine.vercel.app/help',
    endpoints: {
      list:    'GET  /api/packages',
      search:  'GET  /api/packages?q=<query>',
      info:    'GET  /api/packages/:name',
      publish: 'POST /api/packages',
      stats:   'GET  /api/stats',
    },
  })
}

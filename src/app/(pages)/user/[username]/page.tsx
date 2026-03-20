import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { sql } from '@/lib/db'
import { getPackage, getPackageVersions } from '@/lib/packages'
import type { UserRecord } from '@/lib/types'
import { Package, Calendar, Download, Globe } from 'lucide-react'

type Props = { params: { username: string } }

function fmt(n: number) { return n >= 1000 ? (n/1000).toFixed(1)+'k' : String(n) }
function elapsed(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (d < 1) return 'today'
  if (d < 30) return `${d} days ago`
  if (d < 365) return `${Math.floor(d/30)} months ago`
  return `${Math.floor(d/365)} years ago`
}

export async function generateMetadata({ params }: Props) {
  const rows = await sql`SELECT username, display_name FROM users WHERE username = ${params.username.toLowerCase()} LIMIT 1`
  if (!rows.length) return { title: 'User not found' }
  const u = rows[0] as { username: string; display_name: string }
  return { title: `@${u.username} · OPI` }
}

export default async function UserProfilePage({ params }: Props) {
  const rows = await sql`SELECT * FROM users WHERE username = ${params.username.toLowerCase()} LIMIT 1`
  if (!rows.length) notFound()
  const user = rows[0] as UserRecord & { packages: string[] }

  const pkgs = []
  for (const name of (user.packages || [])) {
    const m = await getPackage(name)
    if (m) pkgs.push(m)
  }
  const totalDownloads = pkgs.reduce((s, p) => s + (p.total_downloads || 0), 0)

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-[240px_1fr] gap-8">
          <aside>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7c6af7] to-[#56d3a0] flex items-center justify-center text-3xl font-bold text-white mb-4">
              {((user.display_name || user.username) as string)[0].toUpperCase()}
            </div>
            <h1 className="text-xl font-bold">{(user.display_name || user.username) as string}</h1>
            <p className="text-[#6b7280] text-sm mb-4">@{user.username as string}</p>
            {(user.bio as string) && <p className="text-sm text-[#6b7280] mb-4 leading-relaxed">{user.bio as string}</p>}
            <div className="space-y-2 text-sm text-[#6b7280]">
              <div className="flex items-center gap-2"><Calendar size={13} /> Joined {elapsed(user.joined_at as string)}</div>
              <div className="flex items-center gap-2"><Package size={13} /> {pkgs.length} package{pkgs.length !== 1 ? 's' : ''}</div>
              <div className="flex items-center gap-2"><Download size={13} /> {fmt(totalDownloads)} downloads</div>
              {(user.website as string) && (
                <a href={user.website as string} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#7c6af7] hover:text-[#a89cf9]">
                  <Globe size={13} /> {(user.website as string).replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </aside>
          <div>
            <h2 className="font-semibold text-lg mb-4">Packages ({pkgs.length})</h2>
            {pkgs.length === 0 ? (
              <div className="bg-[#13161e] border border-[#252936] rounded-xl p-10 text-center text-[#6b7280]">
                <Package size={32} className="mx-auto mb-3 opacity-30" />
                <p>No packages published yet.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {pkgs.map(p => (
                  <Link key={p.name} href={`/package/${p.name}`}
                    className="bg-[#13161e] border border-[#252936] rounded-xl p-4 hover:border-[#7c6af7]/50 transition-all group block">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[#7c6af7] group-hover:text-[#a89cf9]">{p.name}</span>
                      <span className="text-xs text-[#6b7280]">v{p.latest}</span>
                    </div>
                    <p className="text-sm text-[#6b7280] line-clamp-2 mb-3">{p.description}</p>
                    <div className="flex items-center gap-1 text-xs text-[#6b7280]">
                      <Download size={11} /> {fmt(p.total_downloads)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getAllPackageNames, getPackage, getRecentPackages } from '@/lib/packages'
import type { PackageMeta } from '@/lib/types'
import { Package, Download, Terminal, ArrowRight, Zap, Shield, Globe } from 'lucide-react'

async function getData() {
  const allNames = await getAllPackageNames()
  const recentPkgs: PackageMeta[] = await getRecentPackages()
  let totalDownloads = 0
  for (const n of allNames) {
    const m = await getPackage(n); if (m) totalDownloads += m.total_downloads || 0
  }
  return { total: allNames.length, totalDownloads, recentPkgs: recentPkgs.slice(0, 8) }
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n/1_000).toFixed(1) + 'k'
  return String(n)
}

function PkgCard({ pkg }: { pkg: PackageMeta }) {
  return (
    <Link href={`/package/${pkg.name}`}
      className="group flex flex-col bg-[#13161e] border border-[#252936] rounded-xl p-4
                 hover:border-[#7c6af7]/50 hover:bg-[#14172000] transition-all hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Package size={13} className="text-[#7c6af7] shrink-0" />
          <span className="font-semibold text-[#7c6af7] group-hover:text-[#a89cf9] truncate">{pkg.name}</span>
        </div>
        <span className="text-xs text-[#6b7280] font-mono ml-2 shrink-0">v{pkg.latest}</span>
      </div>
      <p className="text-sm text-[#6b7280] line-clamp-2 leading-relaxed flex-1 mb-3">{pkg.description}</p>
      <div className="flex items-center justify-between text-xs text-[#6b7280]">
        <span className="flex items-center gap-1"><Download size={10}/>{fmt(pkg.total_downloads)}</span>
        <span className="bg-[#1a1e28] border border-[#252936] px-2 py-0.5 rounded font-mono">{pkg.license}</span>
      </div>
    </Link>
  )
}

export default async function Home() {
  const { total, totalDownloads, recentPkgs } = await getData()
  return (
    <>
      <Navbar />
      <main>

        {/* ── Hero ── */}
        <section className="relative bg-[#0d0f14] pt-20 pb-16 text-center px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,#7c6af722_0%,transparent_65%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzI1MjkzNiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30 pointer-events-none" />
          <div className="relative max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#7c6af7]/10 border border-[#7c6af7]/25 rounded-full px-4 py-1.5 text-sm text-[#a89cf9] mb-6">
              <Zap size={12}/> The Official Omnikarai Package Registry
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-4 leading-[1.1]">
              Find, install &amp;<br/>
              <span className="bg-gradient-to-r from-[#7c6af7] to-[#56d3a0] bg-clip-text text-transparent">share</span> packages
            </h1>
            <p className="text-[#6b7280] text-lg mb-10 max-w-lg mx-auto leading-relaxed">
              OPI is the official package index for Omnikarai — native x86-64 speed, Python-level readability, zero runtime overhead.
            </p>

            {/* search */}
            <form action="/search" method="get" className="flex max-w-lg mx-auto mb-10 shadow-lg shadow-[#7c6af7]/10">
              <input name="q" type="text" placeholder="Search packages…"
                className="flex-1 bg-[#13161e] border border-[#252936] border-r-0 rounded-l-xl px-5 py-3.5 text-base outline-none focus:border-[#7c6af7] transition-colors placeholder:text-[#6b7280]" />
              <button type="submit"
                className="bg-[#7c6af7] hover:bg-[#6a59e0] text-white px-6 py-3.5 rounded-r-xl font-semibold transition-colors shrink-0">
                Search
              </button>
            </form>

            {/* stats */}
            <div className="flex justify-center gap-12">
              {[
                { val: fmt(total),         label: 'Packages' },
                { val: fmt(totalDownloads), label: 'Downloads' },
                { val: 'Open',              label: 'Source' },
              ].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <div className="text-2xl font-extrabold text-[#7c6af7]">{val}</div>
                  <div className="text-xs text-[#6b7280] mt-0.5 tracking-wide uppercase">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── quick install banner ── */}
        <div className="border-y border-[#252936] bg-[#0a0c10] py-3">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center gap-3 text-sm">
            <span className="text-[#6b7280] shrink-0 font-semibold">Get omnip:</span>
            <code className="flex-1 font-mono text-[#56d3a0] bg-[#13161e] border border-[#252936] rounded-lg px-4 py-2 overflow-x-auto whitespace-nowrap">
              gcc -O2 -o omnip.exe omnip.c -lwinhttp
            </code>
            <code className="flex-1 font-mono text-[#a89cf9] bg-[#13161e] border border-[#252936] rounded-lg px-4 py-2 overflow-x-auto whitespace-nowrap">
              omnip install &lt;package&gt;
            </code>
          </div>
        </div>

        {/* ── main grid ── */}
        <div className="max-w-7xl mx-auto px-4 py-12 grid lg:grid-cols-3 gap-10">

          {/* Recently updated */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Download size={16} className="text-[#7c6af7]"/> Recently updated
              </h2>
              <Link href="/search" className="text-sm text-[#7c6af7] hover:text-[#a89cf9] flex items-center gap-1 transition-colors">
                Browse all <ArrowRight size={13}/>
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {recentPkgs.map(p => <PkgCard key={p.name} pkg={p}/>)}
              {recentPkgs.length === 0 && (
                <div className="col-span-2 text-center py-12 text-[#6b7280] border border-dashed border-[#252936] rounded-xl">
                  <Package size={32} className="mx-auto mb-3 opacity-30"/>
                  No packages yet — be the first to publish!
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Install box */}
            <div className="bg-[#13161e] border border-[#252936] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#252936]">
                <Terminal size={13} className="text-[#7c6af7]"/>
                <span className="text-sm font-semibold">Install a package</span>
              </div>
              <div className="p-4 space-y-2">
                {['math_extra', 'stringx', 'collections'].map(pkg => (
                  <Link key={pkg} href={`/package/${pkg}`}
                    className="flex items-center gap-2 bg-[#0a0c10] hover:bg-[#0d1018] border border-[#252936] hover:border-[#7c6af7]/40 rounded-lg px-3 py-2 transition-all group">
                    <span className="text-[#56d3a0] font-mono text-xs shrink-0">$</span>
                    <span className="text-[#e2e4ed] font-mono text-xs flex-1">omnip install {pkg}</span>
                    <ArrowRight size={10} className="text-[#6b7280] group-hover:text-[#7c6af7] transition-colors"/>
                  </Link>
                ))}
              </div>
              <div className="px-4 pb-4">
                <Link href="/help#install" className="block text-center text-xs text-[#7c6af7] hover:text-[#a89cf9] transition-colors">
                  View full docs →
                </Link>
              </div>
            </div>

            {/* Publish */}
            <div className="bg-[#13161e] border border-[#252936] rounded-xl p-5">
              <h3 className="font-semibold mb-1.5 flex items-center gap-2">
                <Package size={14} className="text-[#7c6af7]"/> Publish a package
              </h3>
              <p className="text-sm text-[#6b7280] mb-4 leading-relaxed">Share your module with the Omnikarai community in minutes.</p>
              <div className="space-y-1.5 text-xs font-mono mb-4">
                {[
                  ['1.', 'omnip init'],
                  ['2.', 'edit omnikarai.toml'],
                  ['3.', 'omnip publish .'],
                ].map(([n, cmd]) => (
                  <div key={cmd} className="flex items-center gap-2 text-[#6b7280]">
                    <span className="text-[#7c6af7] w-4 shrink-0">{n}</span>
                    <code className="bg-[#0a0c10] border border-[#252936] rounded px-2 py-0.5 flex-1">{cmd}</code>
                  </div>
                ))}
              </div>
              <Link href="/register"
                className="flex items-center justify-center gap-2 w-full py-2 bg-[#7c6af7] hover:bg-[#6a59e0] text-white rounded-lg text-sm font-semibold transition-colors">
                Create account
              </Link>
            </div>

            {/* Why OPI */}
            <div className="bg-[#13161e] border border-[#252936] rounded-xl p-5">
              <h3 className="font-semibold mb-3">Why OPI?</h3>
              {[
                [Zap,    '#56d3a0', 'Native x86-64 speed'],
                [Shield, '#7c6af7', 'Signed packages'],
                [Package,'#f5c842', 'Zero-overhead install'],
                [Globe,  '#a89cf9', 'Open & free forever'],
              ].map(([Icon, color, text]) => (
                <div key={text as string} className="flex items-center gap-3 py-1.5 text-sm text-[#6b7280]">
                  {/* @ts-expect-error dynamic */}
                  <Icon size={14} style={{ color }}/>
                  <span>{text as string}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#252936] bg-[#0a0c10] py-8 mt-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-[#6b7280]">
          <p className="mb-2">
            <Link href="/" className="text-[#7c6af7] font-bold">OPI</Link>
            {' · '}
            <Link href="/search" className="hover:text-[#e2e4ed] transition-colors">Packages</Link>
            {' · '}
            <Link href="/help" className="hover:text-[#e2e4ed] transition-colors">Docs</Link>
            {' · '}
            <Link href="/api/stats" className="hover:text-[#e2e4ed] transition-colors">API</Link>
          </p>
          <p className="text-xs text-[#6b7280]/60">Fraziym Tech & AI · Omnikarai Package Index · opi-nine.vercel.app</p>
        </div>
      </footer>
    </>
  )
}

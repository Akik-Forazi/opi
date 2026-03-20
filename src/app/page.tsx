import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { seedIfEmpty, getAllPackageNames, getPackage, getRecentPackages } from '@/lib/packages'
import type { PackageMeta } from '@/lib/types'
import { Package, Download, Users, Zap, ArrowRight, Terminal } from 'lucide-react'

async function getData() {
  await seedIfEmpty()
  const allNames = await getAllPackageNames()
  const recentNames = await getRecentPackages()
  let totalDownloads = 0
  const recentPkgs: PackageMeta[] = []
  for (const n of allNames) {
    const m = await getPackage(n); if (m) totalDownloads += m.total_downloads || 0
  }
  for (const n of recentNames.slice(0, 8)) {
    const m = await getPackage(n); if (m) recentPkgs.push(m)
  }
  return { total: allNames.length, totalDownloads, recentPkgs }
}

function fmt(n: number) {
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n/1000).toFixed(1) + 'k'
  return String(n)
}

function PkgCard({ pkg }: { pkg: PackageMeta }) {
  return (
    <Link href={`/package/${pkg.name}`}
      className="block bg-[#13161e] border border-[#252936] rounded-xl p-4 hover:border-[#7c6af7]/50 hover:-translate-y-0.5 transition-all group">
      <div className="flex items-start justify-between mb-2">
        <span className="font-semibold text-[#7c6af7] group-hover:text-[#a89cf9]">{pkg.name}</span>
        <span className="text-xs text-[#6b7280] ml-2 mt-0.5">v{pkg.latest}</span>
      </div>
      <p className="text-sm text-[#6b7280] line-clamp-2 leading-relaxed mb-3">{pkg.description}</p>
      <div className="flex items-center justify-between text-xs text-[#6b7280]">
        <span className="flex items-center gap-1"><Download size={11} />{fmt(pkg.total_downloads)}</span>
        <span className="bg-[#1a1e28] px-2 py-0.5 rounded">{pkg.license}</span>
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
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#0f111a] to-[#0d0f14] pt-20 pb-16 text-center px-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#7c6af720_0%,transparent_70%)] pointer-events-none" />
          <div className="relative max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#7c6af7]/10 border border-[#7c6af7]/30 rounded-full px-4 py-1.5 text-sm text-[#a89cf9] mb-6">
              <Zap size={13} /> The official Omnikarai Package Registry
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-5 leading-tight">
              Find, install and<br/>
              <span className="text-[#7c6af7]">share</span> Omnikarai packages
            </h1>
            <p className="text-[#6b7280] text-lg mb-8 max-w-xl mx-auto">
              OPI is the package index for the Omnikarai language — native x86-64, zero runtime, Python-level readability.
            </p>

            {/* Search */}
            <form action="/search" method="get" className="flex max-w-lg mx-auto mb-10">
              <input name="q" type="text" placeholder="Search 1,000+ packages…"
                className="flex-1 bg-[#13161e] border border-[#252936] rounded-l-xl px-5 py-3 text-base outline-none focus:border-[#7c6af7] transition-colors placeholder:text-[#6b7280]" />
              <button type="submit"
                className="bg-[#7c6af7] hover:bg-[#6a59e0] text-white px-6 py-3 rounded-r-xl font-semibold transition-colors">
                Search
              </button>
            </form>

            {/* Stats */}
            <div className="flex justify-center gap-10 text-center">
              {[
                { icon: Package, val: fmt(total), label: 'Packages' },
                { icon: Download, val: fmt(totalDownloads), label: 'Downloads' },
                { icon: Users, val: 'Open', label: 'Registry' },
              ].map(({ icon: Icon, val, label }) => (
                <div key={label}>
                  <div className="text-2xl font-bold text-[#7c6af7]">{val}</div>
                  <div className="text-xs text-[#6b7280] mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick install */}
        <section className="border-y border-[#252936] bg-[#13161e] py-4">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center gap-4 text-sm">
            <span className="text-[#6b7280] shrink-0">Get omnip:</span>
            <div className="flex-1 font-mono text-[#56d3a0] bg-[#0a0c10] border border-[#252936] rounded-lg px-4 py-2 overflow-x-auto whitespace-nowrap">
              gcc -O2 -o omnip.exe omnip/src/omnip.c -lkernel32 -lwinhttp
            </div>
            <div className="flex-1 font-mono text-[#a89cf9] bg-[#0a0c10] border border-[#252936] rounded-lg px-4 py-2 overflow-x-auto whitespace-nowrap">
              omnip install &lt;package&gt;
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 py-12 grid lg:grid-cols-3 gap-10">

          {/* Recent packages */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">Recently updated</h2>
              <Link href="/search" className="text-sm text-[#7c6af7] hover:text-[#a89cf9] flex items-center gap-1">
                Browse all <ArrowRight size={13} />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {recentPkgs.map(p => <PkgCard key={p.name} pkg={p} />)}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* omnip install box */}
            <div className="bg-[#13161e] border border-[#252936] rounded-xl p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Terminal size={15} className="text-[#7c6af7]" />Install a package</h3>
              <div className="space-y-2 text-sm font-mono">
                {['omnip install math_extra', 'omnip install stringx', 'omnip install collections'].map(cmd => (
                  <div key={cmd} className="flex items-center gap-2 bg-[#0a0c10] border border-[#252936] rounded-lg px-3 py-2">
                    <span className="text-[#56d3a0]">$</span>
                    <span className="text-[#e2e4ed] flex-1 truncate">{cmd.replace('omnip ', '')}</span>
                  </div>
                ))}
              </div>
              <Link href="/help#install" className="block text-center mt-4 text-sm text-[#7c6af7] hover:text-[#a89cf9]">
                View full docs →
              </Link>
            </div>

            {/* Publish */}
            <div className="bg-[#13161e] border border-[#252936] rounded-xl p-5">
              <h3 className="font-semibold mb-2">Publish your package</h3>
              <p className="text-sm text-[#6b7280] mb-4">Share your Omnikarai module with the community in minutes.</p>
              <div className="space-y-1.5 text-xs font-mono text-[#6b7280] mb-4">
                <div><span className="text-[#7c6af7]">1.</span> omnip init</div>
                <div><span className="text-[#7c6af7]">2.</span> Edit omnikarai.toml</div>
                <div><span className="text-[#7c6af7]">3.</span> omnip publish .</div>
              </div>
              <Link href="/register" className="block w-full text-center py-2 bg-[#7c6af7] hover:bg-[#6a59e0] text-white rounded-lg text-sm font-semibold transition-colors">
                Create account
              </Link>
            </div>

            {/* Features */}
            <div className="bg-[#13161e] border border-[#252936] rounded-xl p-5">
              <h3 className="font-semibold mb-3">Why OPI?</h3>
              {[
                ['🚀', 'Native x86-64 speed'],
                ['🔒', 'Signed packages'],
                ['📦', 'Zero-overhead install'],
                ['🌍', 'Open & free forever'],
              ].map(([icon, text]) => (
                <div key={text} className="flex items-center gap-3 py-1.5 text-sm text-[#6b7280]">
                  <span>{icon}</span><span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#252936] bg-[#13161e] py-8 mt-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-[#6b7280]">
          <p className="mb-2">
            <Link href="/" className="text-[#7c6af7] font-semibold">OPI</Link>
            {' · '}
            <Link href="/search" className="hover:text-[#e2e4ed]">Packages</Link>
            {' · '}
            <Link href="/help" className="hover:text-[#e2e4ed]">Docs</Link>
            {' · '}
            <Link href="/api/stats" className="hover:text-[#e2e4ed]">API</Link>
          </p>
          <p className="text-xs">Fraziym Tech & AI · Omnikarai Package Index · <a href="https://opi-nine.vercel.app" className="hover:text-[#e2e4ed]">opi-nine.vercel.app</a></p>
        </div>
      </footer>
    </>
  )
}

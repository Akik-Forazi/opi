'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Search, Download, Filter } from 'lucide-react'
import type { PackageMeta } from '@/lib/types'

function fmt(n: number) {
  if (n >= 1000) return (n/1000).toFixed(1)+'k'
  return String(n)
}

function SearchPage() {
  const sp = useSearchParams()
  const router = useRouter()
  const [q, setQ] = useState(sp.get('q') || '')
  const [results, setResults] = useState<PackageMeta[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const query = sp.get('q') || ''
    setQ(query)
    fetch(`/api/packages?q=${encodeURIComponent(query)}&limit=50`)
      .then(r => r.json())
      .then(d => { setResults(d.packages || []); setTotal(d.total || 0) })
      .finally(() => setLoading(false))
  }, [sp])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <form onSubmit={submit} className="flex gap-2 mb-8">
          <div className="flex-1 flex items-center bg-[#13161e] border border-[#252936] rounded-xl focus-within:border-[#7c6af7] overflow-hidden transition-colors">
            <Search size={16} className="ml-4 text-[#6b7280] shrink-0" />
            <input value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search packages, keywords, authors…"
              className="flex-1 bg-transparent px-4 py-3 text-base outline-none placeholder:text-[#6b7280]" />
          </div>
          <button type="submit" className="px-6 py-3 bg-[#7c6af7] hover:bg-[#6a59e0] text-white rounded-xl font-semibold transition-colors">
            Search
          </button>
        </form>

        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-[#6b7280]">
            {loading ? 'Searching…' : `${total} package${total !== 1 ? 's' : ''}${q ? ` matching "${q}"` : ''}`}
          </p>
          <div className="flex items-center gap-1 text-xs text-[#6b7280]">
            <Filter size={12} /> Sort: relevance
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#13161e] border border-[#252936] rounded-xl p-4 h-28 animate-pulse" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 text-[#6b7280]">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-[#e2e4ed] mb-2">No packages found</h3>
            <p className="mb-6">No results for "{q}". Try a different term or publish your own!</p>
            <Link href="/register" className="px-6 py-2.5 bg-[#7c6af7] text-white rounded-lg text-sm font-semibold">
              Publish a package
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {results.map(p => (
              <Link key={p.name} href={`/package/${p.name}`}
                className="bg-[#13161e] border border-[#252936] rounded-xl p-4 hover:border-[#7c6af7]/50 hover:-translate-y-0.5 transition-all group block">
                <div className="flex items-start justify-between mb-1.5">
                  <span className="font-semibold text-[#7c6af7] group-hover:text-[#a89cf9] truncate">{p.name}</span>
                  <span className="text-xs text-[#6b7280] ml-2 shrink-0">v{p.latest}</span>
                </div>
                <p className="text-sm text-[#6b7280] line-clamp-2 mb-3 leading-relaxed">{p.description}</p>
                <div className="flex items-center justify-between text-xs text-[#6b7280]">
                  <span className="flex items-center gap-1"><Download size={11} />{fmt(p.total_downloads)}</span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {(p.keywords || []).slice(0, 3).map(k => (
                      <span key={k} className="bg-[#1a1e28] px-2 py-0.5 rounded">{k}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default function SearchRoute() {
  return <Suspense fallback={<Navbar />}><SearchPage /></Suspense>
}

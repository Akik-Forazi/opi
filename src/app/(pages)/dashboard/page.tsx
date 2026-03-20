'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Package, Key, Plus, Trash2, Copy, Check, ExternalLink, Loader2, AlertTriangle } from 'lucide-react'

type User = { username: string; email: string; display_name?: string; packages: string[]; joined_at: string }
type Pkg  = { name: string; latest: string; total_downloads: number; description: string; updated_at: string }

function fmt(n: number) { return n >= 1000 ? (n/1000).toFixed(1)+'k' : String(n) }
function elapsed(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  return d === 0 ? 'today' : d === 1 ? 'yesterday' : d < 30 ? `${d}d ago` : `${Math.floor(d/30)}mo ago`
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser]     = useState<User | null>(null)
  const [pkgs, setPkgs]     = useState<Pkg[]>([])
  type TokenInfo = { display: string; label: string; created_at: string }
  const [tokens, setTokens] = useState<TokenInfo[]>([])
  const [newToken, setNewToken] = useState('')
  const [copied, setCopied] = useState(false)
  const [tab, setTab]       = useState<'packages' | 'tokens'>('packages')
  const [loading, setLoading] = useState(true)
  const [tokenLoading, setTokenLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => { if (!r.ok) { router.push('/login'); return null } return r.json() })
      .then(async u => {
        if (!u) return
        setUser(u)
        // Load user's packages
        const pkgData: Pkg[] = []
        for (const n of (u.packages || [])) {
          const r = await fetch(`/api/packages/${n}`)
          if (r.ok) pkgData.push(await r.json())
        }
        setPkgs(pkgData)
        // Load tokens
        const tr = await fetch('/api/user/tokens')
        if (tr.ok) { const td = await tr.json(); setTokens(td.tokens || []) }
      })
      .finally(() => setLoading(false))
  }, [router])

  const createToken = async () => {
    setTokenLoading(true)
    const r = await fetch('/api/user/tokens', { method: 'POST' })
    const d = await r.json()
    if (r.ok) {
      setNewToken(d.token)
      // Refresh token list
      const tr = await fetch('/api/user/tokens')
      if (tr.ok) { const td = await tr.json(); setTokens(td.tokens || []) }
    }
    setTokenLoading(false)
  }

  const revokeToken = async (display: string) => {
    const prefix = display.replace(/\.\.\..+$/, '')
    await fetch(`/api/user/tokens?token=${encodeURIComponent(prefix)}`, { method: 'DELETE' })
    setTokens(prev => prev.filter(t => t.display !== display))
  }

  const copyToken = () => {
    navigator.clipboard.writeText(newToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={24} className="animate-spin text-[#7c6af7]" />
      </div>
    </>
  )

  if (!user) return null

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold">Dashboard</h1>
            <p className="text-[#6b7280] text-sm mt-0.5">
              Signed in as <span className="text-[#e2e4ed]">@{user.username}</span>
            </p>
          </div>
          <Link href="/settings"
            className="px-4 py-2 text-sm bg-[#1a1e28] border border-[#252936] rounded-lg hover:border-[#7c6af7] transition-colors">
            Settings
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Packages', val: pkgs.length, icon: Package },
            { label: 'Total Downloads', val: fmt(pkgs.reduce((s, p) => s + (p.total_downloads || 0), 0)), icon: Package },
            { label: 'API Tokens', val: tokens.length, icon: Key },
          ].map(({ label, val, icon: Icon }) => (
            <div key={label} className="bg-[#13161e] border border-[#252936] rounded-xl p-4">
              <div className="text-2xl font-bold text-[#7c6af7] mb-0.5">{val}</div>
              <div className="text-xs text-[#6b7280]">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#13161e] border border-[#252936] rounded-xl p-1 w-fit">
          {(['packages', 'tokens'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-[#7c6af7] text-white' : 'text-[#6b7280] hover:text-[#e2e4ed]'}`}>
              {t === 'packages' ? <><Package size={13} className="inline mr-1.5" />Packages</> : <><Key size={13} className="inline mr-1.5" />API Tokens</>}
            </button>
          ))}
        </div>

        {/* Packages tab */}
        {tab === 'packages' && (
          <div>
            {pkgs.length === 0 ? (
              <div className="bg-[#13161e] border border-[#252936] rounded-xl p-12 text-center">
                <Package size={40} className="mx-auto mb-4 text-[#252936]" />
                <h3 className="font-semibold text-lg mb-2">No packages yet</h3>
                <p className="text-[#6b7280] text-sm mb-6">Publish your first Omnikarai package to share with the community.</p>
                <div className="bg-[#0a0c10] border border-[#252936] rounded-lg px-4 py-3 font-mono text-sm text-[#56d3a0] text-left max-w-xs mx-auto">
                  omnip publish .
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {pkgs.map(p => (
                  <div key={p.name} className="bg-[#13161e] border border-[#252936] rounded-xl p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Link href={`/package/${p.name}`} className="font-semibold text-[#7c6af7] hover:text-[#a89cf9]">
                          {p.name}
                        </Link>
                        <span className="text-xs text-[#6b7280]">v{p.latest}</span>
                      </div>
                      <p className="text-sm text-[#6b7280] truncate">{p.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-[#e2e4ed]">{fmt(p.total_downloads)}</div>
                      <div className="text-xs text-[#6b7280]">downloads</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-[#6b7280]">{elapsed(p.updated_at)}</div>
                    </div>
                    <Link href={`/package/${p.name}`}
                      className="p-1.5 text-[#6b7280] hover:text-[#e2e4ed] transition-colors">
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tokens tab */}
        {tab === 'tokens' && (
          <div>
            {/* New token alert */}
            {newToken && (
              <div className="bg-[#56d3a0]/10 border border-[#56d3a0]/30 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-2 mb-3">
                  <AlertTriangle size={15} className="text-[#56d3a0] mt-0.5 shrink-0" />
                  <p className="text-sm text-[#56d3a0] font-semibold">
                    Copy your token now — it will never be shown again.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-[#0a0c10] border border-[#252936] rounded-lg px-4 py-2.5">
                  <code className="flex-1 font-mono text-sm text-[#e2e4ed] break-all">{newToken}</code>
                  <button onClick={copyToken}
                    className="p-1.5 text-[#6b7280] hover:text-[#56d3a0] transition-colors shrink-0">
                    {copied ? <Check size={15} className="text-[#56d3a0]" /> : <Copy size={15} />}
                  </button>
                </div>
                <p className="text-xs text-[#6b7280] mt-2">
                  Use it in omnip: set the <code className="text-[#a89cf9]">OPI_TOKEN</code> env variable, or pass via{' '}
                  <code className="text-[#a89cf9]">Authorization: Bearer &lt;token&gt;</code>
                </p>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-[#6b7280]">{tokens.length}/10 tokens used</p>
              <button onClick={createToken} disabled={tokenLoading || tokens.length >= 10}
                className="flex items-center gap-2 px-4 py-2 bg-[#7c6af7] hover:bg-[#6a59e0] disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors">
                {tokenLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                New token
              </button>
            </div>

            {tokens.length === 0 ? (
              <div className="bg-[#13161e] border border-[#252936] rounded-xl p-8 text-center text-[#6b7280]">
                <Key size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No API tokens yet. Create one to use with omnip publish.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tokens.map(t => (
                  <div key={t.display} className="bg-[#13161e] border border-[#252936] rounded-xl px-4 py-3 flex items-center gap-3">
                    <Key size={14} className="text-[#6b7280] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <code className="font-mono text-sm text-[#6b7280]">{t.display}</code>
                      <span className="ml-3 text-xs text-[#6b7280] opacity-60">{t.label}</span>
                    </div>
                    <span className="text-xs text-[#6b7280] shrink-0">{new Date(t.created_at).toLocaleDateString()}</span>
                    <button onClick={() => revokeToken(t.display)}
                      className="p-1.5 text-[#6b7280] hover:text-[#f06060] transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 bg-[#13161e] border border-[#252936] rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-2">Using API tokens with omnip</h3>
              <div className="space-y-2 font-mono text-xs text-[#56d3a0]">
                <div className="bg-[#0a0c10] rounded-lg px-3 py-2">set OPI_TOKEN=opi_your_token_here</div>
                <div className="bg-[#0a0c10] rounded-lg px-3 py-2">omnip publish .</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

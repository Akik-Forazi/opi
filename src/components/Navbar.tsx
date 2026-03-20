'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Package, User, LogOut, Settings, ChevronDown, Menu, X, Terminal } from 'lucide-react'

export default function Navbar() {
  const router   = useRouter()
  const pathname = usePathname()
  const [query, setQuery]       = useState('')
  const [user, setUser]         = useState<{ username: string; display_name?: string } | null>(null)
  const [dropOpen, setDropOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => d && setUser(d)).catch(() => {})
  }, [pathname])

  const search = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null); setDropOpen(false)
    router.push('/')
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-[#252936] bg-[#0d0f14]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 font-extrabold text-lg tracking-tight">
          <div className="w-7 h-7 rounded-lg bg-[#7c6af7] flex items-center justify-center">
            <Terminal size={13} className="text-white"/>
          </div>
          <span className="text-[#7c6af7]">OPI</span>
          <span className="hidden sm:inline text-[#6b7280] text-xs font-normal border border-[#252936] px-2 py-0.5 rounded-full">
            Omnikarai
          </span>
        </Link>

        {/* Nav links (desktop) */}
        <div className="hidden md:flex items-center gap-1 ml-1">
          <Link href="/search"
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${pathname === '/search' ? 'text-[#e2e4ed] bg-[#1a1e28]' : 'text-[#6b7280] hover:text-[#e2e4ed] hover:bg-[#1a1e28]'}`}>
            Packages
          </Link>
          <Link href="/help"
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${pathname === '/help' ? 'text-[#e2e4ed] bg-[#1a1e28]' : 'text-[#6b7280] hover:text-[#e2e4ed] hover:bg-[#1a1e28]'}`}>
            Docs
          </Link>
        </div>

        {/* Search (desktop) */}
        <form onSubmit={search} className="flex-1 max-w-sm ml-auto hidden sm:block">
          <div className="flex items-center bg-[#13161e] border border-[#252936] rounded-lg focus-within:border-[#7c6af7] transition-colors overflow-hidden">
            <Search size={13} className="ml-3 text-[#6b7280] shrink-0"/>
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search packages…"
              className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[#6b7280]" />
          </div>
        </form>

        {/* Auth */}
        <div className="hidden md:flex items-center gap-2 ml-2 shrink-0">
          {user ? (
            <div className="relative">
              <button onClick={() => setDropOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#13161e] border border-[#252936] rounded-lg text-sm hover:border-[#7c6af7]/50 transition-colors">
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#7c6af7] to-[#56d3a0] flex items-center justify-center text-[10px] font-bold text-white">
                  {(user.display_name || user.username)[0].toUpperCase()}
                </span>
                <span className="text-[#e2e4ed]">{user.display_name || user.username}</span>
                <ChevronDown size={12} className="text-[#6b7280]"/>
              </button>
              {dropOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#13161e] border border-[#252936] rounded-xl shadow-2xl py-1 z-50">
                  <Link href="/dashboard" onClick={() => setDropOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#1a1e28] text-[#e2e4ed] transition-colors">
                    <Package size={13}/> Dashboard
                  </Link>
                  <Link href={`/user/${user.username}`} onClick={() => setDropOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#1a1e28] text-[#e2e4ed] transition-colors">
                    <User size={13}/> Profile
                  </Link>
                  <Link href="/settings" onClick={() => setDropOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#1a1e28] text-[#e2e4ed] transition-colors">
                    <Settings size={13}/> Settings
                  </Link>
                  <div className="border-t border-[#252936] my-1"/>
                  <button onClick={logout}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#1a1e28] text-[#f06060] w-full text-left transition-colors">
                    <LogOut size={13}/> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="px-3 py-1.5 text-sm text-[#6b7280] hover:text-[#e2e4ed] transition-colors">
                Sign in
              </Link>
              <Link href="/register"
                className="px-4 py-1.5 text-sm bg-[#7c6af7] hover:bg-[#6a59e0] text-white rounded-lg font-semibold transition-colors">
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setMobileOpen(v => !v)} className="md:hidden ml-auto p-1.5 text-[#6b7280]">
          {mobileOpen ? <X size={20}/> : <Menu size={20}/>}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#252936] bg-[#0d0f14] px-4 py-3 flex flex-col gap-2">
          <form onSubmit={search} className="flex gap-2 mb-2">
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search packages…"
              className="flex-1 bg-[#13161e] border border-[#252936] rounded-lg px-3 py-2 text-sm outline-none"/>
            <button type="submit" className="px-3 py-2 bg-[#7c6af7] text-white rounded-lg text-sm">Go</button>
          </form>
          <Link href="/search"  onClick={() => setMobileOpen(false)} className="py-2 text-sm text-[#6b7280]">Packages</Link>
          <Link href="/help"    onClick={() => setMobileOpen(false)} className="py-2 text-sm text-[#6b7280]">Docs</Link>
          {user ? (
            <>
              <Link href="/dashboard"          onClick={() => setMobileOpen(false)} className="py-2 text-sm text-[#e2e4ed]">Dashboard</Link>
              <Link href={`/user/${user.username}`} onClick={() => setMobileOpen(false)} className="py-2 text-sm text-[#e2e4ed]">Profile</Link>
              <button onClick={logout} className="py-2 text-sm text-[#f06060] text-left">Sign out</button>
            </>
          ) : (
            <div className="flex gap-2 pt-1">
              <Link href="/login"    onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 border border-[#252936] rounded-lg text-sm">Sign in</Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 bg-[#7c6af7] rounded-lg text-sm text-white font-semibold">Register</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}

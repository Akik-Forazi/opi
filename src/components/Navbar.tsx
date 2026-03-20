'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Package, User, LogOut, Settings, ChevronDown, Menu, X } from 'lucide-react'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState('')
  const [user, setUser] = useState<{ username: string; display_name?: string } | null>(null)
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
    <nav className="sticky top-0 z-50 border-b border-[#252936] bg-[#13161e]/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 font-bold text-lg">
          <span className="text-[#7c6af7]">OPI</span>
          <span className="hidden sm:inline text-[#6b7280] text-sm font-normal">Omnikarai</span>
        </Link>

        {/* Search */}
        <form onSubmit={search} className="flex-1 max-w-xl">
          <div className="flex items-center bg-[#1a1e28] border border-[#252936] rounded-lg overflow-hidden focus-within:border-[#7c6af7] transition-colors">
            <Search size={15} className="ml-3 text-[#6b7280] shrink-0" />
            <input
              type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search packages…"
              className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[#6b7280]"
            />
          </div>
        </form>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1 shrink-0">
          <Link href="/search" className="px-3 py-1.5 text-sm text-[#6b7280] hover:text-[#e2e4ed] rounded transition-colors">Packages</Link>
          <Link href="/help" className="px-3 py-1.5 text-sm text-[#6b7280] hover:text-[#e2e4ed] rounded transition-colors">Docs</Link>

          {user ? (
            <div className="relative">
              <button onClick={() => setDropOpen(v => !v)}
                className="flex items-center gap-2 ml-2 px-3 py-1.5 bg-[#1a1e28] border border-[#252936] rounded-lg text-sm hover:border-[#7c6af7] transition-colors">
                <span className="w-6 h-6 rounded-full bg-[#7c6af7] flex items-center justify-center text-xs font-bold text-white">
                  {(user.display_name || user.username)[0].toUpperCase()}
                </span>
                <span>{user.display_name || user.username}</span>
                <ChevronDown size={13} className="text-[#6b7280]" />
              </button>
              {dropOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1e28] border border-[#252936] rounded-xl shadow-2xl py-1 z-50">
                  <Link href="/dashboard" onClick={() => setDropOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#252936] text-[#e2e4ed]">
                    <Package size={14} /> Dashboard
                  </Link>
                  <Link href={`/user/${user.username}`} onClick={() => setDropOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#252936] text-[#e2e4ed]">
                    <User size={14} /> Profile
                  </Link>
                  <Link href="/settings" onClick={() => setDropOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#252936] text-[#e2e4ed]">
                    <Settings size={14} /> Settings
                  </Link>
                  <div className="border-t border-[#252936] my-1" />
                  <button onClick={logout}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#252936] text-[#f06060] w-full text-left">
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link href="/login" className="px-4 py-1.5 text-sm text-[#6b7280] hover:text-[#e2e4ed] transition-colors">Sign in</Link>
              <Link href="/register" className="px-4 py-1.5 text-sm bg-[#7c6af7] hover:bg-[#6a59e0] text-white rounded-lg font-medium transition-colors">Register</Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button onClick={() => setMobileOpen(v => !v)} className="md:hidden ml-auto p-1.5 text-[#6b7280]">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#252936] bg-[#13161e] px-4 py-3 flex flex-col gap-2">
          <Link href="/search" onClick={() => setMobileOpen(false)} className="py-2 text-sm text-[#6b7280]">Packages</Link>
          <Link href="/help" onClick={() => setMobileOpen(false)} className="py-2 text-sm text-[#6b7280]">Docs</Link>
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="py-2 text-sm text-[#e2e4ed]">Dashboard</Link>
              <Link href={`/user/${user.username}`} onClick={() => setMobileOpen(false)} className="py-2 text-sm text-[#e2e4ed]">Profile</Link>
              <button onClick={logout} className="py-2 text-sm text-[#f06060] text-left">Sign out</button>
            </>
          ) : (
            <div className="flex gap-3 pt-1">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 border border-[#252936] rounded-lg text-sm">Sign in</Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 bg-[#7c6af7] rounded-lg text-sm text-white font-medium">Register</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}

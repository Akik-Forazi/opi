'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Login failed'); return }
      router.push('/dashboard')
    } finally { setLoading(false) }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-3xl font-bold mb-1"><span className="text-[#7c6af7]">OPI</span></div>
            <h1 className="text-xl font-semibold">Sign in to your account</h1>
            <p className="text-[#6b7280] text-sm mt-1">Welcome back</p>
          </div>

          <form onSubmit={submit} className="bg-[#13161e] border border-[#252936] rounded-2xl p-6 space-y-4">
            {error && (
              <div className="bg-[#f06060]/10 border border-[#f06060]/30 text-[#f06060] text-sm px-4 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">Username or Email</label>
              <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required autoFocus autoComplete="username"
                className="w-full bg-[#1a1e28] border border-[#252936] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#7c6af7] transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required autoComplete="current-password"
                  className="w-full bg-[#1a1e28] border border-[#252936] rounded-lg px-4 py-2.5 pr-10 text-sm outline-none focus:border-[#7c6af7] transition-colors" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#e2e4ed]">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-[#7c6af7] hover:bg-[#6a59e0] disabled:opacity-60 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 size={15} className="animate-spin" />}
              Sign in
            </button>
          </form>

          <p className="text-center text-sm text-[#6b7280] mt-5">
            Don't have an account?{' '}
            <Link href="/register" className="text-[#7c6af7] hover:text-[#a89cf9] font-medium">Register</Link>
          </p>
        </div>
      </div>
    </>
  )
}

'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react'

function Rule({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${ok ? 'text-[#56d3a0]' : 'text-[#6b7280]'}`}>
      {ok ? <Check size={11} /> : <X size={11} />} {text}
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', email: '', password: '', display_name: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const pw = form.password
  const pwRules = { len: pw.length >= 8, upper: /[A-Z]/.test(pw), num: /[0-9]/.test(pw) }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Registration failed'); return }
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
            <h1 className="text-xl font-semibold">Create your account</h1>
            <p className="text-[#6b7280] text-sm mt-1">Join the Omnikarai community</p>
          </div>

          <form onSubmit={submit} className="bg-[#13161e] border border-[#252936] rounded-2xl p-6 space-y-4">
            {error && (
              <div className="bg-[#f06060]/10 border border-[#f06060]/30 text-[#f06060] text-sm px-4 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Username <span className="text-[#f06060]">*</span>
              </label>
              <input
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required autoFocus placeholder="akikfaraji" autoComplete="username"
                className="w-full bg-[#1a1e28] border border-[#252936] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#7c6af7] transition-colors"
              />
              <p className="text-xs text-[#6b7280] mt-1">3–32 chars, letters/numbers/-/_</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Display Name</label>
              <input
                value={form.display_name}
                onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                placeholder="Akik Faraji" autoComplete="name"
                className="w-full bg-[#1a1e28] border border-[#252936] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#7c6af7] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Email <span className="text-[#f06060]">*</span>
              </label>
              <input
                type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required placeholder="akik@fraziym.dev" autoComplete="email"
                className="w-full bg-[#1a1e28] border border-[#252936] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#7c6af7] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Password <span className="text-[#f06060]">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={pw}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required autoComplete="new-password"
                  className="w-full bg-[#1a1e28] border border-[#252936] rounded-lg px-4 py-2.5 pr-10 text-sm outline-none focus:border-[#7c6af7] transition-colors"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#e2e4ed]">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {pw && (
                <div className="mt-2 space-y-1">
                  <Rule ok={pwRules.len} text="At least 8 characters" />
                  <Rule ok={pwRules.upper} text="One uppercase letter" />
                  <Rule ok={pwRules.num} text="One number" />
                </div>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-[#7c6af7] hover:bg-[#6a59e0] disabled:opacity-60 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 size={15} className="animate-spin" />}
              Create account
            </button>

            <p className="text-xs text-[#6b7280] text-center">
              By registering you agree to our{' '}
              <a href="/help#terms" className="text-[#7c6af7]">Terms of Service</a>.
            </p>
          </form>

          <p className="text-center text-sm text-[#6b7280] mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-[#7c6af7] hover:text-[#a89cf9] font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </>
  )
}

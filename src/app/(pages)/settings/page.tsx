'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Loader2, Save, Check } from 'lucide-react'

type User = { username: string; email: string; display_name?: string; bio?: string; website?: string }

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser]   = useState<User | null>(null)
  const [form, setForm]   = useState({ display_name: '', bio: '', website: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => { if (!r.ok) { router.push('/login'); return null } return r.json() })
      .then(u => {
        if (!u) return
        setUser(u)
        setForm({ display_name: u.display_name || '', bio: u.bio || '', website: u.website || '' })
      })
      .finally(() => setLoading(false))
  }, [router])

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const r = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!r.ok) { const d = await r.json(); setError(d.error || 'Save failed'); return }
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
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
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-extrabold mb-8">Account Settings</h1>

        <div className="space-y-6">
          {/* Profile */}
          <form onSubmit={save} className="bg-[#13161e] border border-[#252936] rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-lg mb-2">Public Profile</h2>
            {error && (
              <div className="bg-[#f06060]/10 border border-[#f06060]/30 text-[#f06060] text-sm px-4 py-2.5 rounded-lg">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5">Username</label>
              <input value={user.username} disabled
                className="w-full bg-[#0a0c10] border border-[#252936] rounded-lg px-4 py-2.5 text-sm text-[#6b7280] cursor-not-allowed" />
              <p className="text-xs text-[#6b7280] mt-1">Username cannot be changed.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input value={user.email} disabled
                className="w-full bg-[#0a0c10] border border-[#252936] rounded-lg px-4 py-2.5 text-sm text-[#6b7280] cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Display Name</label>
              <input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                placeholder="Your full name"
                className="w-full bg-[#1a1e28] border border-[#252936] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#7c6af7] transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Bio</label>
              <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                rows={3} placeholder="A short bio about yourself…"
                className="w-full bg-[#1a1e28] border border-[#252936] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#7c6af7] transition-colors resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Website</label>
              <input type="url" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://yoursite.dev"
                className="w-full bg-[#1a1e28] border border-[#252936] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#7c6af7] transition-colors" />
            </div>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#7c6af7] hover:bg-[#6a59e0] disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors">
              {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : <Save size={13} />}
              {saved ? 'Saved!' : 'Save changes'}
            </button>
          </form>

          {/* Danger zone */}
          <div className="bg-[#13161e] border border-[#f06060]/30 rounded-2xl p-6">
            <h2 className="font-semibold text-lg mb-1 text-[#f06060]">Danger Zone</h2>
            <p className="text-sm text-[#6b7280] mb-4">These actions are irreversible.</p>
            <button
              onClick={() => { if (confirm('Delete your account? This cannot be undone.')) router.push('/') }}
              className="px-4 py-2 border border-[#f06060]/50 text-[#f06060] rounded-lg text-sm hover:bg-[#f06060]/10 transition-colors">
              Delete account
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

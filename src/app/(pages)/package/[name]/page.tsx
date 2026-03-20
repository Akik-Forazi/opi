// app/(pages)/package/[name]/page.tsx — GitHub-style package page
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getPackage, getPackageVersion, getPackageVersions } from '@/lib/packages'
import {
  Download, ExternalLink, Github, Tag, User, Calendar,
  AlertTriangle, Terminal, GitBranch, BookOpen, Package, Clock
} from 'lucide-react'

type Props = { params: { name: string } }

function fmt(n: number) {
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1)+'M'
  if (n >= 1_000) return (n/1_000).toFixed(1)+'k'
  return String(n)
}
function elapsed(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const d = Math.floor(ms/86400000)
  if (d === 0) return 'today'; if (d === 1) return 'yesterday'
  if (d < 30)  return `${d} days ago`
  if (d < 365) return `${Math.floor(d/30)} months ago`
  return `${Math.floor(d/365)} years ago`
}

function renderReadme(md: string) {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
}

export async function generateMetadata({ params }: Props) {
  const meta = await getPackage(params.name)
  if (!meta) return { title: 'Package not found' }
  return { title: `${meta.name} · OPI`, description: meta.description }
}

export default async function PackagePage({ params }: Props) {
  const meta = await getPackage(params.name)
  if (!meta) notFound()

  const versions = await getPackageVersions(params.name)
  const latest   = await getPackageVersion(params.name, meta.latest)
  const hasDeps  = Object.keys(latest?.dependencies || {}).length > 0

  return (
    <>
      <Navbar />

      {/* ── breadcrumb / title bar ── */}
      <div className="border-b border-[#252936] bg-[#0d0f14]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-[#6b7280] mb-3">
            <Link href="/" className="hover:text-[#7c6af7] transition-colors">OPI</Link>
            <span>/</span>
            <Link href={`/user/${meta.owner}`} className="hover:text-[#7c6af7] transition-colors">
              {meta.owner}
            </Link>
            <span>/</span>
            <span className="text-[#e2e4ed] font-semibold">{meta.name}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-[#7c6af7]" />
              <h1 className="text-xl font-extrabold">{meta.name}</h1>
            </div>
            <span className="px-2 py-0.5 text-xs bg-[#7c6af7]/10 border border-[#7c6af7]/30 text-[#a89cf9] rounded-full font-mono">
              v{meta.latest}
            </span>
            {latest?.yanked && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-[#f06060]/10 border border-[#f06060]/30 rounded-full text-xs text-[#f06060]">
                <AlertTriangle size={10}/> Yanked
              </span>
            )}
            <span className="px-2 py-0.5 text-xs bg-[#1a1e28] border border-[#252936] text-[#6b7280] rounded-full">
              {meta.license}
            </span>
          </div>

          <p className="text-[#6b7280] mt-2 text-sm max-w-2xl">{meta.description}</p>

          {/* keywords */}
          {meta.keywords?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {meta.keywords.map(k => (
                <Link key={k} href={`/search?q=${encodeURIComponent(k)}`}
                  className="text-xs bg-[#7c6af7]/10 hover:bg-[#7c6af7]/20 border border-[#7c6af7]/20 px-2.5 py-0.5 rounded-full text-[#a89cf9] transition-colors">
                  {k}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── tab bar ── */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-0 -mb-px">
            {[
              { id:'readme',   icon: BookOpen,   label:'README' },
              { id:'versions', icon: GitBranch,  label:`Versions (${versions.length})` },
              { id:'deps',     icon: Package,    label:`Dependencies${hasDeps ? ` (${Object.keys(latest!.dependencies).length})` : ''}` },
            ].map(t => (
              <a key={t.id} href={`#${t.id}`}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-[#6b7280] hover:text-[#e2e4ed] border-b-2 border-transparent hover:border-[#7c6af7]/50 transition-colors">
                <t.icon size={13}/>{t.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── main content ── */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_280px] gap-8">

        {/* Left */}
        <div className="space-y-6">

          {/* install box */}
          <div className="bg-[#13161e] border border-[#252936] rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#252936]">
              <Terminal size={13} className="text-[#7c6af7]"/>
              <span className="text-sm font-semibold">Install</span>
            </div>
            <div className="px-4 py-3 font-mono text-sm text-[#56d3a0] select-all bg-[#0a0c10]">
              omnip install {meta.name}
            </div>
          </div>

          {/* README */}
          <div id="readme" className="bg-[#13161e] border border-[#252936] rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-[#252936]">
              <BookOpen size={13} className="text-[#6b7280]"/>
              <span className="text-sm font-semibold text-[#6b7280] uppercase tracking-wide">README</span>
            </div>
            <div className="p-6">
              {latest?.readme ? (
                <div className="prose-opi" dangerouslySetInnerHTML={{ __html: renderReadme(latest.readme) }} />
              ) : (
                <p className="text-[#6b7280] text-sm italic">No README provided.</p>
              )}
            </div>
          </div>

          {/* Versions */}
          <div id="versions" className="bg-[#13161e] border border-[#252936] rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-[#252936]">
              <GitBranch size={13} className="text-[#6b7280]"/>
              <span className="text-sm font-semibold text-[#6b7280] uppercase tracking-wide">
                Version History ({versions.length})
              </span>
            </div>
            <div className="divide-y divide-[#252936]">
              {[...versions].reverse().map(v => (
                <div key={v} className={`flex items-center justify-between px-5 py-3 ${v === meta.latest ? 'bg-[#7c6af7]/5' : 'hover:bg-[#1a1e28]'} transition-colors`}>
                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-sm ${v === meta.latest ? 'text-[#a89cf9]' : 'text-[#6b7280]'}`}>{v}</span>
                    {v === meta.latest && (
                      <span className="text-xs px-2 py-0.5 bg-[#7c6af7]/20 text-[#a89cf9] rounded-full">latest</span>
                    )}
                  </div>
                  <span className="text-xs text-[#6b7280]">
                    <code className="bg-[#0a0c10] px-2 py-0.5 rounded">omnip install {meta.name}@{v}</code>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dependencies */}
          <div id="deps" className="bg-[#13161e] border border-[#252936] rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-[#252936]">
              <Package size={13} className="text-[#6b7280]"/>
              <span className="text-sm font-semibold text-[#6b7280] uppercase tracking-wide">Dependencies</span>
            </div>
            {hasDeps ? (
              <div className="divide-y divide-[#252936]">
                {Object.entries(latest!.dependencies).map(([dep, ver]) => (
                  <div key={dep} className="flex items-center justify-between px-5 py-3 hover:bg-[#1a1e28] transition-colors">
                    <Link href={`/package/${dep}`} className="text-sm text-[#7c6af7] hover:text-[#a89cf9] font-mono">{dep}</Link>
                    <span className="text-xs text-[#6b7280] font-mono">{ver}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-8 text-center text-sm text-[#6b7280]">No dependencies</div>
            )}
          </div>

          {/* Changelog */}
          {latest?.changelog && (
            <div className="bg-[#13161e] border border-[#252936] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-[#252936]">
                <Clock size={13} className="text-[#6b7280]"/>
                <span className="text-sm font-semibold text-[#6b7280] uppercase tracking-wide">Changelog</span>
              </div>
              <div className="p-6">
                <div className="prose-opi" dangerouslySetInnerHTML={{ __html: renderReadme(latest.changelog) }} />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Meta card */}
          <div className="bg-[#13161e] border border-[#252936] rounded-xl p-4 space-y-3">
            <SideRow icon={<User size={12}/>} label="Owner">
              <Link href={`/user/${meta.owner}`} className="text-[#7c6af7] hover:text-[#a89cf9] text-sm">@{meta.owner}</Link>
            </SideRow>
            <SideRow icon={<Download size={12}/>} label="Downloads">
              <span className="text-sm">{fmt(meta.total_downloads)}</span>
            </SideRow>
            <SideRow icon={<Calendar size={12}/>} label="Updated">
              <span className="text-sm">{elapsed(meta.updated_at)}</span>
            </SideRow>
            <SideRow icon={<Tag size={12}/>} label="License">
              <span className="text-sm">{meta.license}</span>
            </SideRow>
            {meta.homepage && (
              <SideRow icon={<ExternalLink size={12}/>} label="Homepage">
                <a href={meta.homepage} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-[#7c6af7] hover:text-[#a89cf9] truncate max-w-[160px] block">
                  {meta.homepage.replace(/^https?:\/\//, '')}
                </a>
              </SideRow>
            )}
            {meta.repository && (
              <SideRow icon={<Github size={12}/>} label="Repo">
                <a href={meta.repository} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-[#7c6af7] hover:text-[#a89cf9] truncate max-w-[160px] block">
                  {meta.repository.replace(/^https?:\/\/(www\.|github\.com\/)?/, '')}
                </a>
              </SideRow>
            )}
          </div>

          {/* API box */}
          <div className="bg-[#13161e] border border-[#252936] rounded-xl p-4">
            <h3 className="text-xs text-[#6b7280] uppercase tracking-wide font-semibold mb-3">API</h3>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-start gap-2">
                <span className="text-[#56d3a0] shrink-0">GET</span>
                <code className="text-[#6b7280] break-all">/api/packages/{meta.name}</code>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#56d3a0] shrink-0">GET</span>
                <code className="text-[#6b7280] break-all">/api/packages/{meta.name}?v={meta.latest}</code>
              </div>
            </div>
          </div>

          {/* Install versions box */}
          <div className="bg-[#13161e] border border-[#252936] rounded-xl p-4">
            <h3 className="text-xs text-[#6b7280] uppercase tracking-wide font-semibold mb-3">
              Quick install
            </h3>
            <div className="space-y-1.5">
              {[...versions].reverse().slice(0, 4).map(v => (
                <div key={v} className="font-mono text-xs bg-[#0a0c10] border border-[#252936] rounded px-3 py-1.5 flex justify-between">
                  <span className="text-[#56d3a0]">omnip install {meta.name}@{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function SideRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#6b7280] shrink-0">{icon}</span>
      <span className="text-[#6b7280] shrink-0 w-16 text-xs">{label}</span>
      <span className="text-[#e2e4ed] min-w-0 flex-1">{children}</span>
    </div>
  )
}

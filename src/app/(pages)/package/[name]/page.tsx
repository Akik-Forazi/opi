import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getPackage, getPackageVersion, getPackageVersions, seedIfEmpty } from '@/lib/packages'
import { Download, ExternalLink, Github, Tag, User, Calendar, AlertTriangle, Terminal } from 'lucide-react'

type Props = { params: { name: string } }

function fmt(n: number) {
  if (n >= 1000000) return (n/1000000).toFixed(1)+'M'
  if (n >= 1000) return (n/1000).toFixed(1)+'k'
  return String(n)
}

function elapsed(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const d = Math.floor(ms/86400000)
  if (d === 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 30) return `${d} days ago`
  if (d < 365) return `${Math.floor(d/30)} months ago`
  return `${Math.floor(d/365)} years ago`
}

function renderReadme(md: string) {
  // Very minimal markdown → HTML (no deps)
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
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hupla])/gm, '<p>')
}

export async function generateMetadata({ params }: Props) {
  const meta = await getPackage(params.name)
  if (!meta) return { title: 'Package not found' }
  return { title: `${meta.name} · OPI`, description: meta.description }
}

export default async function PackagePage({ params }: Props) {
  await seedIfEmpty()
  const meta = await getPackage(params.name)
  if (!meta) notFound()

  const versions = await getPackageVersions(params.name)
  const latest   = await getPackageVersion(params.name, meta.latest)

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_300px] gap-8">

        {/* Main */}
        <div>
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-extrabold">{meta.name}</h1>
              <span className="text-lg text-[#6b7280]">v{meta.latest}</span>
              {latest?.yanked && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-[#f06060]/10 border border-[#f06060]/30 rounded text-xs text-[#f06060]">
                  <AlertTriangle size={11} /> Yanked
                </span>
              )}
            </div>
            <p className="text-[#6b7280] text-lg">{meta.description}</p>
          </div>

          {/* Install box */}
          <div className="bg-[#13161e] border border-[#252936] rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Terminal size={14} className="text-[#7c6af7]" />
              <span className="text-sm font-semibold">Install</span>
            </div>
            <div className="font-mono text-sm bg-[#0a0c10] rounded-lg px-4 py-2.5 text-[#56d3a0] select-all">
              omnip install {meta.name}
            </div>
            {latest && Object.keys(latest.dependencies || {}).length > 0 && (
              <p className="text-xs text-[#6b7280] mt-2">
                Requires: {Object.entries(latest.dependencies).map(([k,v]) => `${k} ${v}`).join(', ')}
              </p>
            )}
          </div>

          {/* README */}
          <div className="bg-[#13161e] border border-[#252936] rounded-xl p-6">
            <h2 className="font-semibold mb-4 text-sm text-[#6b7280] uppercase tracking-wide">README</h2>
            {latest?.readme ? (
              <div className="prose-opi" dangerouslySetInnerHTML={{ __html: renderReadme(latest.readme) }} />
            ) : (
              <p className="text-[#6b7280] text-sm italic">No README provided.</p>
            )}
          </div>

          {/* Changelog */}
          {latest?.changelog && (
            <div className="bg-[#13161e] border border-[#252936] rounded-xl p-6 mt-4">
              <h2 className="font-semibold mb-4 text-sm text-[#6b7280] uppercase tracking-wide">Changelog</h2>
              <div className="prose-opi" dangerouslySetInnerHTML={{ __html: renderReadme(latest.changelog) }} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Meta */}
          <div className="bg-[#13161e] border border-[#252936] rounded-xl p-4 space-y-3 text-sm">
            <Row icon={<User size={13}/>} label="Owner">
              <Link href={`/user/${meta.owner}`} className="text-[#7c6af7] hover:text-[#a89cf9]">@{meta.owner}</Link>
            </Row>
            <Row icon={<Download size={13}/>} label="Downloads">
              <span>{fmt(meta.total_downloads)}</span>
            </Row>
            <Row icon={<Calendar size={13}/>} label="Updated">
              <span>{elapsed(meta.updated_at)}</span>
            </Row>
            <Row icon={<Tag size={13}/>} label="License">
              <span>{meta.license}</span>
            </Row>
            {meta.homepage && (
              <Row icon={<ExternalLink size={13}/>} label="Homepage">
                <a href={meta.homepage} target="_blank" rel="noopener noreferrer" className="text-[#7c6af7] hover:text-[#a89cf9] truncate max-w-[160px] block">
                  {meta.homepage.replace(/^https?:\/\//, '')}
                </a>
              </Row>
            )}
            {meta.repository && (
              <Row icon={<Github size={13}/>} label="Repository">
                <a href={meta.repository} target="_blank" rel="noopener noreferrer" className="text-[#7c6af7] hover:text-[#a89cf9] truncate max-w-[160px] block">
                  {meta.repository.replace(/^https?:\/\/(www\.|github\.com\/)?/, '')}
                </a>
              </Row>
            )}
          </div>

          {/* Keywords */}
          {meta.keywords?.length > 0 && (
            <div className="bg-[#13161e] border border-[#252936] rounded-xl p-4">
              <h3 className="text-xs text-[#6b7280] uppercase tracking-wide mb-3 font-semibold">Keywords</h3>
              <div className="flex flex-wrap gap-1.5">
                {meta.keywords.map(k => (
                  <Link key={k} href={`/search?q=${encodeURIComponent(k)}`}
                    className="text-xs bg-[#1a1e28] hover:bg-[#252936] border border-[#252936] px-2.5 py-1 rounded-full text-[#a89cf9] transition-colors">
                    {k}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Versions */}
          <div className="bg-[#13161e] border border-[#252936] rounded-xl p-4">
            <h3 className="text-xs text-[#6b7280] uppercase tracking-wide mb-3 font-semibold">
              Versions ({versions.length})
            </h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {[...versions].reverse().map(v => (
                <div key={v} className={`flex items-center justify-between text-sm px-2 py-1 rounded ${v === meta.latest ? 'bg-[#7c6af7]/10 text-[#a89cf9]' : 'text-[#6b7280] hover:bg-[#1a1e28]'}`}>
                  <span className="font-mono">{v}</span>
                  {v === meta.latest && <span className="text-xs">latest</span>}
                </div>
              ))}
            </div>
          </div>

          {/* API link */}
          <div className="bg-[#13161e] border border-[#252936] rounded-xl p-4">
            <h3 className="text-xs text-[#6b7280] uppercase tracking-wide mb-3 font-semibold">API</h3>
            <code className="text-xs text-[#56d3a0] break-all">
              GET /api/packages/{meta.name}
            </code>
          </div>
        </div>
      </div>
    </>
  )
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#6b7280] shrink-0">{icon}</span>
      <span className="text-[#6b7280] shrink-0 w-20">{label}</span>
      <span className="text-[#e2e4ed] min-w-0">{children}</span>
    </div>
  )
}

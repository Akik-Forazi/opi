import Navbar from '@/components/Navbar'
import Link from 'next/link'

const sections = [
  { id: 'install',   label: 'Install omnip' },
  { id: 'using',     label: 'Using packages' },
  { id: 'publish',   label: 'Publishing' },
  { id: 'toml',      label: 'omnikarai.toml' },
  { id: 'tokens',    label: 'API tokens' },
  { id: 'api',       label: 'REST API' },
  { id: 'terms',     label: 'Terms' },
]

function Cmd({ children }: { children: string }) {
  return (
    <div className="bg-[#0a0c10] border border-[#252936] rounded-lg px-4 py-2.5 font-mono text-sm text-[#56d3a0] my-2 overflow-x-auto whitespace-pre">
      {children}
    </div>
  )
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-xl font-bold mt-12 mb-4 pt-4 border-t border-[#252936] scroll-mt-20">
      {children}
    </h2>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold mt-6 mb-2 text-[#a89cf9]">{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[#6b7280] leading-relaxed mb-3">{children}</p>
}

export const metadata = { title: 'Help & Docs · OPI' }

export default function HelpPage() {
  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10 flex gap-10">

        {/* Sidebar TOC */}
        <nav className="hidden lg:block w-48 shrink-0 sticky top-20 self-start">
          <p className="text-xs text-[#6b7280] uppercase tracking-wider font-semibold mb-3">On this page</p>
          <ul className="space-y-1">
            {sections.map(s => (
              <li key={s.id}>
                <a href={`#${s.id}`}
                  className="block text-sm text-[#6b7280] hover:text-[#e2e4ed] py-0.5 transition-colors">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-extrabold mb-2">OPI Docs</h1>
          <p className="text-[#6b7280] text-lg mb-8">
            Complete reference for the Omnikarai Package Index and the <code className="text-[#a89cf9] bg-[#1a1e28] px-1.5 py-0.5 rounded text-sm">omnip</code> CLI.
          </p>

          {/* Install omnip */}
          <H2 id="install">Install omnip</H2>
          <P>omnip is a zero-dependency C binary. Build it from source with gcc:</P>
          <Cmd>gcc -O2 -o omnip.exe omnip/src/omnip.c -lkernel32 -lwinhttp</Cmd>
          <P>Or download a pre-built binary from the Omnikarai releases page.</P>
          <P>After building, add <code className="text-[#a89cf9]">omnip.exe</code> to your PATH.</P>

          {/* Using packages */}
          <H2 id="using">Using packages</H2>
          <H3>Install from OPI</H3>
          <Cmd>omnip install math_extra</Cmd>
          <P>Packages are installed to <code className="text-[#a89cf9]">%USERPROFILE%\.omnikarai\modules\&lt;name&gt;\</code></P>

          <H3>Use in .ok files</H3>
          <Cmd>{`use math_extra\nprint(math_extra.factorial(10))`}</Cmd>

          <H3>Install local package</H3>
          <Cmd>omnip install .</Cmd>
          <P>Reads <code className="text-[#a89cf9]">omnikarai.toml</code> from the current directory and installs locally.</P>

          <H3>Other commands</H3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse mb-4">
              <thead>
                <tr className="border-b border-[#252936]">
                  <th className="text-left py-2 pr-6 text-[#6b7280] font-semibold w-48">Command</th>
                  <th className="text-left py-2 text-[#6b7280] font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['omnip list',                   'List installed packages'],
                  ['omnip info <package>',          'Show package details'],
                  ['omnip search <query>',          'Search OPI registry'],
                  ['omnip update',                  'Update all remote packages'],
                  ['omnip update <package>',        'Update a specific package'],
                  ['omnip uninstall <package>',     'Remove a package'],
                  ['omnip init',                    'Create omnikarai.toml in cwd'],
                  ['omnip publish .',               'Publish current dir to OPI'],
                  ['omnip version',                 'Show omnip version'],
                ].map(([cmd, desc]) => (
                  <tr key={cmd} className="border-b border-[#1a1e28]">
                    <td className="py-2 pr-6 font-mono text-[#56d3a0] text-xs">{cmd}</td>
                    <td className="py-2 text-[#6b7280]">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Publishing */}
          <H2 id="publish">Publishing a package</H2>
          <P>Publishing to OPI takes 3 steps:</P>
          <Cmd>{`# 1. Create omnikarai.toml\nomnip init\n\n# 2. Edit the toml with your package details\n\n# 3. Authenticate and publish\nset OPI_TOKEN=opi_your_api_token\nomnip publish .`}</Cmd>
          <P>On success your package appears live on OPI immediately at:</P>
          <Cmd>https://opi-nine.vercel.app/package/your-package-name</Cmd>

          {/* TOML */}
          <H2 id="toml">omnikarai.toml</H2>
          <P>Every package needs an <code className="text-[#a89cf9]">omnikarai.toml</code> at its root directory.</P>
          <Cmd>{`[metadata]
name        = "my_package"
version     = "1.0.0"
description = "A useful Omnikarai package"
author      = "Your Name"
license     = "MIT"
homepage    = "https://github.com/you/my_package"
repository  = "https://github.com/you/my_package"

[dependencies]
math        = ">=1.0"
stringx     = "^1.0"

[dev_dependencies]
test_runner = ">=0.1"`}</Cmd>

          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#252936]">
                  <th className="text-left py-2 pr-6 text-[#6b7280] font-semibold w-36">Field</th>
                  <th className="text-left py-2 pr-6 text-[#6b7280] font-semibold w-20">Required</th>
                  <th className="text-left py-2 text-[#6b7280] font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['name',        '✓', 'Unique package name (lowercase, letters/numbers/-/_)'],
                  ['version',     '✓', 'Semantic version: 1.0.0'],
                  ['description', '✓', 'One-line description shown in search'],
                  ['author',      '',  'Author name'],
                  ['license',     '',  'SPDX license identifier (default: MIT)'],
                  ['homepage',    '',  'Project website URL'],
                  ['repository',  '',  'Source repository URL'],
                ].map(([f, req, desc]) => (
                  <tr key={f} className="border-b border-[#1a1e28]">
                    <td className="py-2 pr-6 font-mono text-[#a89cf9] text-xs">{f}</td>
                    <td className="py-2 pr-6 text-center text-[#56d3a0] text-xs">{req}</td>
                    <td className="py-2 text-[#6b7280] text-xs">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* API tokens */}
          <H2 id="tokens">API tokens</H2>
          <P>To publish packages you need an API token. Create one in your <Link href="/dashboard" className="text-[#7c6af7]">Dashboard → API Tokens</Link>.</P>
          <P>Pass the token to omnip via environment variable:</P>
          <Cmd>set OPI_TOKEN=opi_your_token_here</Cmd>
          <P>Or pass it via Authorization header when calling the API directly:</P>
          <Cmd>Authorization: Bearer opi_your_token_here</Cmd>

          {/* REST API */}
          <H2 id="api">REST API</H2>
          <P>Base URL: <code className="text-[#a89cf9]">https://opi-nine.vercel.app</code></P>

          {[
            { method: 'GET',    path: '/api/packages',         desc: 'List all packages (paginated, ?q= for search, ?page=, ?limit=)' },
            { method: 'GET',    path: '/api/packages/:name',   desc: 'Get package metadata + latest version details' },
            { method: 'POST',   path: '/api/packages',         desc: 'Publish a new package version (requires Bearer token)' },
            { method: 'DELETE', path: '/api/packages/:name',   desc: 'Delete a package (owner only, requires Bearer token)' },
            { method: 'PATCH',  path: '/api/packages/:name',   desc: 'Yank/unyank a version (owner only, requires Bearer token)' },
            { method: 'GET',    path: '/api/search?q=query',   desc: 'Search packages by name, description, keywords' },
            { method: 'GET',    path: '/api/stats',            desc: 'Registry stats: total packages, total downloads' },
            { method: 'POST',   path: '/api/auth/register',    desc: 'Register a new user account' },
            { method: 'POST',   path: '/api/auth/login',       desc: 'Login and get JWT token' },
            { method: 'GET',    path: '/api/auth/me',          desc: 'Get current user info (requires Bearer token)' },
          ].map(({ method, path, desc }) => (
            <div key={path} className="flex gap-3 py-2 border-b border-[#1a1e28] text-sm">
              <span className={`shrink-0 font-mono font-bold w-16 ${
                method === 'GET' ? 'text-[#56d3a0]' :
                method === 'POST' ? 'text-[#7c6af7]' :
                method === 'DELETE' ? 'text-[#f06060]' : 'text-[#f5c842]'
              }`}>{method}</span>
              <code className="shrink-0 text-[#e2e4ed] w-56">{path}</code>
              <span className="text-[#6b7280]">{desc}</span>
            </div>
          ))}

          <H3>Example: Publish a package</H3>
          <Cmd>{`curl -X POST https://opi-nine.vercel.app/api/packages \\
  -H "Authorization: Bearer opi_your_token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "my_package",
    "version": "1.0.0",
    "description": "Does something useful",
    "license": "MIT",
    "keywords": ["util"],
    "dependencies": {}
  }'`}</Cmd>

          {/* Terms */}
          <H2 id="terms">Terms of Service</H2>
          <P>By using OPI you agree to the following:</P>
          <ul className="text-[#6b7280] text-sm space-y-2 list-disc pl-5 mb-4">
            <li>Don't publish malicious, illegal, or harmful packages.</li>
            <li>Don't impersonate other users or projects.</li>
            <li>Package names are first-come first-served.</li>
            <li>Yanked versions remain in the index but are flagged — they are not deleted.</li>
            <li>We reserve the right to remove packages that violate these terms.</li>
            <li>OPI is provided free of charge, as-is, without warranty.</li>
          </ul>
          <P>Questions? Open an issue on <a href="https://github.com/fraziym/omnikarai" className="text-[#7c6af7]">GitHub</a>.</P>
        </div>
      </div>
    </>
  )
}

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'OPI — Omnikarai Package Index', template: '%s · OPI' },
  description: 'The official package registry for the Omnikarai language. Find, install and publish packages.',
  metadataBase: new URL('https://opi-nine.vercel.app'),
  openGraph: {
    siteName: 'OPI — Omnikarai Package Index',
    url: 'https://opi-nine.vercel.app',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0d0f14] text-[#e2e4ed] antialiased">
        {children}
      </body>
    </html>
  )
}

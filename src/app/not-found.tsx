import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-8xl font-extrabold text-[#252936] mb-4">404</div>
          <h1 className="text-2xl font-bold mb-2">Page not found</h1>
          <p className="text-[#6b7280] mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/" className="px-5 py-2.5 bg-[#7c6af7] hover:bg-[#6a59e0] text-white rounded-xl text-sm font-semibold transition-colors">
              Go home
            </Link>
            <Link href="/search" className="px-5 py-2.5 bg-[#1a1e28] border border-[#252936] hover:border-[#7c6af7] rounded-xl text-sm transition-colors">
              Browse packages
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

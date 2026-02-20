import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="font-mono text-cyan-400 font-bold text-lg hover:text-cyan-300 transition-colors"
        >
          {'> joe_grady'}
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/rails"
            className="font-mono text-sm text-gray-400 hover:text-cyan-400 transition-colors"
          >
            How I Rails
          </Link>
          <Link
            to="/claude"
            className="font-mono text-sm text-gray-400 hover:text-cyan-400 transition-colors"
          >
            How I Claude
          </Link>
          <Link
            to="/aws"
            className="font-mono text-sm text-gray-400 hover:text-cyan-400 transition-colors"
          >
            AWS in Prod
          </Link>
          <Link
            to="/sidekiq"
            className="font-mono text-sm text-gray-400 hover:text-cyan-400 transition-colors"
          >
            Sidekiq at Scale
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-gray-400 hover:text-cyan-400 transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0a0a0f]/95 backdrop-blur-md border-b border-white/5 px-6 pb-4">
          <Link
            to="/rails"
            onClick={() => setMobileOpen(false)}
            className="block py-2 font-mono text-sm text-gray-400 hover:text-cyan-400 transition-colors"
          >
            How I Rails
          </Link>
          <Link
            to="/claude"
            onClick={() => setMobileOpen(false)}
            className="block py-2 font-mono text-sm text-gray-400 hover:text-cyan-400 transition-colors"
          >
            How I Claude
          </Link>
          <Link
            to="/aws"
            onClick={() => setMobileOpen(false)}
            className="block py-2 font-mono text-sm text-gray-400 hover:text-cyan-400 transition-colors"
          >
            AWS in Prod
          </Link>
          <Link
            to="/sidekiq"
            onClick={() => setMobileOpen(false)}
            className="block py-2 font-mono text-sm text-gray-400 hover:text-cyan-400 transition-colors"
          >
            Sidekiq at Scale
          </Link>
        </div>
      )}
    </nav>
  )
}

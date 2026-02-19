import { Link } from 'react-router-dom'
import { useEffect } from 'react'

export default function ContentPage({ title, subtitle, children }) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <main className="pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-mono text-sm text-cyan-400 hover:text-cyan-300 transition-colors mb-8"
        >
          <span>&larr;</span> back home
        </Link>

        <h1 className="font-mono text-3xl md:text-4xl font-bold text-white mb-3">
          {title}
        </h1>
        {subtitle && (
          <p className="text-gray-400 text-lg mb-12">{subtitle}</p>
        )}

        <article className="prose-custom">{children}</article>
      </div>
    </main>
  )
}

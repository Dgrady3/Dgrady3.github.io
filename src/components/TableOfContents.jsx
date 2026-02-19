import { useState, useEffect } from 'react'

export default function TableOfContents({ sections }) {
  const [activeId, setActiveId] = useState(sections[0]?.id || '')

  useEffect(() => {
    const observers = []
    const sectionEls = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean)

    const callback = (entries) => {
      // Find the topmost visible section
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

      if (visible.length > 0) {
        setActiveId(visible[0].target.id)
      }
    }

    const observer = new IntersectionObserver(callback, {
      rootMargin: '-80px 0px -60% 0px',
      threshold: 0,
    })

    sectionEls.forEach((el) => observer.observe(el))
    observers.push(observer)

    return () => observers.forEach((o) => o.disconnect())
  }, [sections])

  const handleClick = (e, id) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
      setActiveId(id)
    }
  }

  return (
    <nav className="hidden xl:block fixed top-32 right-8 w-56 2xl:w-64">
      <div className="border-l border-white/5 pl-4">
        <p className="font-mono text-xs text-gray-600 mb-4 uppercase tracking-wider">
          On this page
        </p>
        <ul className="space-y-2">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={(e) => handleClick(e, section.id)}
                className={`block font-mono text-xs leading-snug transition-all duration-200 ${
                  activeId === section.id
                    ? 'text-cyan-400 translate-x-1'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

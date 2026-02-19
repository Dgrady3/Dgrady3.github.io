import { useState } from 'react'
import AnimatedSection from './AnimatedSection'

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: Wire up to a form service (Formspree, Netlify Forms, etc.)
    console.log('Form submitted:', formData)
    setSubmitted(true)
  }

  return (
    <section id="contact" className="py-8 md:py-24 px-6">
      <div className="max-w-2xl mx-auto">
        <AnimatedSection>
          <h2 className="font-mono text-cyan-400 text-sm mb-2">{'> contact'}</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Let&apos;s Work Together
          </h3>
          <p className="text-gray-400 mb-10">
            Available for Rails contract work and interesting projects. Drop me a line.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          {submitted ? (
            <div className="bg-dark-800 border border-cyan-500/20 rounded-lg p-8 text-center">
              <p className="font-mono text-cyan-400 text-lg mb-2">Message sent!</p>
              <p className="text-gray-400 text-sm">I&apos;ll get back to you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block font-mono text-sm text-gray-400 mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-dark-800 border border-white/10 rounded px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block font-mono text-sm text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-dark-800 border border-white/10 rounded px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block font-mono text-sm text-gray-400 mb-2">Message</label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-dark-800 border border-white/10 rounded px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                  placeholder="Tell me about your project..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-sm rounded hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all"
              >
                Send Message
              </button>
            </form>
          )}
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <div className="mt-12 flex items-center justify-center gap-8">
            <a
              href="https://linkedin.com/in/joegrady3"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-gray-500 hover:text-cyan-400 transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="https://github.com/Dgrady3"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-gray-500 hover:text-cyan-400 transition-colors"
            >
              GitHub
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

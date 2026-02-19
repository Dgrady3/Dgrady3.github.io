import Nav from './components/Nav'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Projects from './components/Projects'
import Experience from './components/Experience'
import Contact from './components/Contact'

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Nav />
      <Hero />
      <About />
      <Skills />
      <Projects />
      <Experience />
      <Contact />

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-mono text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Joe Grady. Built with React + Tailwind.
          </p>
        </div>
      </footer>
    </div>
  )
}

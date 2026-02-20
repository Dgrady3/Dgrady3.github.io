import { Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Projects from './components/Projects'
import Experience from './components/Experience'
import Contact from './components/Contact'
import TableOfContents from './components/TableOfContents'
import Rails from './pages/Rails'
import Claude from './pages/Claude'
import SidekiqPage from './pages/Sidekiq'

const homeSections = [
  { id: 'about', title: 'About' },
  { id: 'skills', title: 'Skills' },
  { id: 'projects', title: 'Projects' },
  { id: 'experience', title: 'Experience' },
  { id: 'contact', title: 'Contact' },
]

function Home() {
  return (
    <>
      <Hero />
      <TableOfContents sections={homeSections} />
      <About />
      <Skills />
      <Projects />
      <Experience />
      <Contact />
    </>
  )
}

function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-white/5">
      <div className="max-w-4xl mx-auto text-center">
        <p className="font-mono text-xs text-gray-600">
          &copy; {new Date().getFullYear()} Joe Grady. Built with React + Tailwind.
        </p>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rails" element={<Rails />} />
        <Route path="/claude" element={<Claude />} />
        <Route path="/sidekiq" element={<SidekiqPage />} />
      </Routes>
      <Footer />
    </div>
  )
}

import { motion } from 'framer-motion'

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export default function Hero() {
  if (isMobile) {
    return (
      <section className="min-h-screen flex items-center justify-center relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="font-mono text-cyan-400 text-sm mb-4">{'> hello_world'}</p>
          <h1 className="font-mono text-4xl font-bold text-white mb-6">Joe Grady</h1>
          <p className="text-xl text-gray-300 mb-2 font-light">
            Full-stack engineer.{' '}
            <span className="text-cyan-400">Founder&apos;s mindset.</span>
          </p>
          <p className="font-mono text-sm text-cyan-400/70 mb-10">
            Open to Side Projects
          </p>
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => scrollTo('projects')}
              className="px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-sm rounded"
            >
              View Projects
            </button>
            <button
              onClick={() => scrollTo('contact')}
              className="px-6 py-3 border border-white/10 text-gray-400 font-mono text-sm rounded"
            >
              Get in Touch
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(34,211,238,0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(34,211,238,0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-mono text-cyan-400 text-sm md:text-base mb-4"
        >
          {'> hello_world'}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-mono text-6xl lg:text-7xl font-bold text-white mb-6"
        >
          Joe Grady
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-2xl text-gray-300 mb-3 font-light"
        >
          Full-stack engineer.{' '}
          <span className="text-cyan-400">Founder&apos;s mindset.</span>
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="font-mono text-base text-cyan-400/70 mb-10"
        >
          Open to Side Projects
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex items-center justify-center gap-6"
        >
          <button
            onClick={() => scrollTo('projects')}
            className="px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-sm rounded hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all"
          >
            View Projects
          </button>
          <button
            onClick={() => scrollTo('contact')}
            className="px-6 py-3 border border-white/10 text-gray-400 font-mono text-sm rounded hover:border-white/25 hover:text-gray-200 transition-all"
          >
            Get in Touch
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-5 h-8 border border-white/20 rounded-full flex items-start justify-center p-1"
          >
            <div className="w-1 h-2 bg-cyan-400/50 rounded-full" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(34,211,238,0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(34,211,238,0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-mono text-cyan-400 text-sm md:text-base mb-4"
        >
          {'> hello_world'}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="font-mono text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6"
        >
          Joe Grady
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-xl md:text-2xl text-gray-300 mb-3 font-light"
        >
          Full-stack engineer with a founder&apos;s mindset.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="font-mono text-sm md:text-base text-cyan-400/70 mb-10"
        >
          Senior Backend Engineer | Available for Contract Work
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="flex items-center justify-center gap-6"
        >
          <a
            href="#projects"
            className="px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-sm rounded hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all"
          >
            View Projects
          </a>
          <a
            href="#contact"
            className="px-6 py-3 border border-white/10 text-gray-400 font-mono text-sm rounded hover:border-white/25 hover:text-gray-200 transition-all"
          >
            Get in Touch
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
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

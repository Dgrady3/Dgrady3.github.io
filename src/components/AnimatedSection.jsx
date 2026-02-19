import { motion } from 'framer-motion'

export default function AnimatedSection({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: delay * 0.15 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

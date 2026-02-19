import { motion } from 'framer-motion'

export default function AnimatedSection({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px' }}
      transition={{ duration: 0.2, delay: delay * 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

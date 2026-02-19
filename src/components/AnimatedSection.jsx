import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])
  return isMobile
}

export default function AnimatedSection({ children, className = '', delay = 0 }) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: delay * 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

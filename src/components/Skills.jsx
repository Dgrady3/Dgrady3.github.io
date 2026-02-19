import AnimatedSection from './AnimatedSection'

const skillCategories = [
  {
    title: 'Backend',
    icon: '{}',
    skills: ['Ruby', 'Ruby on Rails', 'SQL / PostgreSQL', 'REST APIs', 'Sidekiq'],
  },
  {
    title: 'Frontend',
    icon: '</>',
    skills: ['React', 'JavaScript / ES6+', 'HTML / CSS', 'Tailwind CSS'],
  },
  {
    title: 'AI-Augmented Development',
    icon: '▲',
    skills: [
      'Claude Code — custom skills, workflow automation',
      'Cursor — AI-assisted editing & refactoring',
      'Prompt engineering for dev productivity',
      'Shipping faster with AI-powered code reviews & generation',
      'Enabling teams to adopt AI tooling effectively',
    ],
  },
  {
    title: 'Cloud & DevOps',
    icon: '>>',
    skills: ['AWS (EC2, S3, RDS, Lambda)', 'Docker', 'CI/CD', 'GitHub Actions'],
  },
  {
    title: 'Entrepreneur',
    icon: '⚡',
    skills: ['Ecommerce / Shopify', 'Facebook Ads', 'Video Editing', 'Growth Strategy'],
  },
]

export default function Skills() {
  return (
    <section id="skills" className="py-8 md:py-24 px-6 bg-dark-800/50">
      <div className="max-w-4xl mx-auto">
        <AnimatedSection>
          <h2 className="font-mono text-cyan-400 text-sm mb-2">{'> skills'}</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-12">
            What I Work With
          </h3>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 gap-6">
          {skillCategories.map((cat, i) => (
            <AnimatedSection key={cat.title} delay={i * 0.1}>
              <div className="bg-dark-900 border border-white/5 rounded-lg p-6 hover:border-cyan-500/20 transition-colors group">
                <div className="font-mono text-cyan-400 text-2xl mb-3 group-hover:scale-110 transition-transform inline-block">
                  {cat.icon}
                </div>
                <h4 className="font-mono text-white text-lg mb-4">{cat.title}</h4>
                <ul className="space-y-2">
                  {cat.skills.map((skill) => (
                    <li key={skill} className="text-gray-400 text-sm flex items-center gap-2">
                      <span className="text-cyan-500/50">▸</span>
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

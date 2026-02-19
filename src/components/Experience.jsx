import AnimatedSection from './AnimatedSection'

const experiences = [
  {
    role: 'Senior Software Engineer',
    company: 'Brightside Health',
    period: 'Current',
    description:
      'Building and maintaining Rails applications powering mental health services at scale.',
    tech: ['Ruby on Rails', 'React', 'AWS', 'PostgreSQL'],
  },
  {
    role: 'Senior Engineer / Manager',
    company: 'Previous Roles',
    period: '10+ years',
    description:
      'Full-stack development across multiple companies in the Charlotte and Asheville areas. Shipping production Rails apps, mentoring junior engineers, and driving technical decisions.',
    tech: ['Ruby on Rails', 'React', 'JavaScript', 'SQL'],
  },
  {
    role: 'U.S. Patent Holder',
    company: 'Inventor',
    period: '2017',
    description:
      'Invented and patented a product that can be used on a baseball bat to increase swing velocity, hand speed, and time to impact (US9550100B2). Demonstrated a 9% bat speed increase and 12% hand speed improvement with collegiate players. Pitched to the NFHS for approval — rules committee didn\'t pass it, but the journey from concept to patent to pitch was the real win.',
    tech: ['Product Development', 'Patent Law', 'Sports Science', 'Sales'],
    link: 'https://patents.google.com/patent/US9550100B2',
    linkLabel: 'View Patent',
  },
  {
    role: 'Entrepreneur',
    company: 'Ecommerce Ventures',
    period: 'Ongoing',
    description:
      'Built and scaled multiple dropshipping ecommerce stores end-to-end — product sourcing, store development, ad creative production, Facebook/social media ad campaigns, and fulfillment operations.',
    tech: ['Shopify', 'Facebook Ads', 'Video Editing', 'Growth Strategy'],
  },
  {
    role: 'Bootcamp Graduate',
    company: 'Launch Academy',
    period: 'Boston',
    description:
      'Attended an intensive 18-week software engineering bootcamp in Boston focused on Ruby on Rails, JavaScript, TDD, and agile development. This is where the foundation was laid.',
    tech: ['Ruby', 'Rails', 'JavaScript', 'TDD', 'Agile'],
    link: 'https://launchacademy.com',
    linkLabel: 'Launch Academy',
  },
  {
    role: 'Operator',
    company: 'Student Painters',
    period: 'College',
    description:
      'Ran a residential painting business through Student Painters — hired and managed 10 employees across painting and door-to-door sales, completed estimates, scheduled jobs, and generated $42K in revenue in a single 3-month summer season. Got tired of cold calling, tried to build a website to get leads — and that\'s how the code addiction started.',
    tech: ['Sales', 'Operations', 'Team Management', 'Hustle'],
  },
]

export default function Experience() {
  return (
    <section id="experience" className="py-8 md:py-24 px-6 bg-dark-800/50">
      <div className="max-w-4xl mx-auto">
        <AnimatedSection>
          <h2 className="font-mono text-cyan-400 text-sm mb-2">{'> experience'}</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-12">
            Where I&apos;ve Been
          </h3>
        </AnimatedSection>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-0 md:left-4 top-0 bottom-0 w-px bg-white/5" />

          <div className="space-y-12">
            {experiences.map((exp, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className="relative pl-8 md:pl-12">
                  {/* Timeline dot */}
                  <div className="absolute left-0 md:left-4 top-1 w-2 h-2 -translate-x-1/2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]" />

                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 mb-2">
                    <h4 className="font-mono text-white text-lg">{exp.role}</h4>
                    <span className="text-cyan-400/60 font-mono text-sm">@ {exp.company}</span>
                    <span className="text-gray-600 font-mono text-xs">{exp.period}</span>
                  </div>

                  <p className="text-gray-400 text-sm mb-3">
                    {exp.description}
                    {exp.link && (
                      <>
                        {' '}
                        <a
                          href={exp.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 transition-colors underline underline-offset-2"
                        >
                          {exp.linkLabel} &rarr;
                        </a>
                      </>
                    )}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {exp.tech.map((t) => (
                      <span
                        key={t}
                        className="font-mono text-xs px-2 py-1 bg-cyan-500/5 text-cyan-400/60 rounded border border-cyan-500/10"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

import { Link } from 'react-router-dom'
import AnimatedSection from './AnimatedSection'

const writing = [
  {
    title: 'How I Rails',
    description:
      'Patterns and principles I\'ve refined over a decade of building production Rails apps — service objects, job architecture, query objects, and more.',
    tags: ['Ruby on Rails', 'Design Patterns', 'Architecture'],
    link: '/rails',
  },
  {
    title: 'How I Claude',
    description:
      'How I use AI as a force multiplier in production engineering — prompt design, agentic patterns, and Claude Code workflows.',
    tags: ['Claude', 'AI Engineering', 'Prompt Design', 'Agentic Patterns'],
    link: '/claude',
  },
  {
    title: 'Sidekiq at Scale',
    description:
      'Sidekiq is simple until it isn\'t. Queue design, fan-out patterns, idempotency, rate limiting, and memory tuning for production workloads.',
    tags: ['Sidekiq', 'Redis', 'Background Jobs', 'Ruby'],
    link: '/sidekiq',
  },
]

const projects = [
  {
    title: 'Coming Soon',
    description: 'Rails side project — details dropping soon.',
    tags: ['Ruby on Rails', 'PostgreSQL', 'AWS'],
    status: 'In Progress',
  },
  {
    title: 'Coming Soon',
    description: 'Another build in the pipeline.',
    tags: ['React', 'API Integration'],
    status: 'Planned',
  },
  {
    title: 'Ecommerce Ventures',
    description:
      'Built and scaled multiple dropshipping stores end-to-end — product sourcing, store builds, ad creative, Facebook/social media ad campaigns, and fulfillment.',
    tags: ['Shopify', 'Facebook Ads', 'Video Editing', 'Growth'],
    status: 'Shipped',
  },
]

export default function Projects() {
  return (
    <section id="projects" className="py-8 md:py-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Writing */}
        <AnimatedSection>
          <h2 className="font-mono text-cyan-400 text-sm mb-2">{'> writing'}</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-12">
            Deep Dives
          </h3>
        </AnimatedSection>

        <div className="grid gap-6 mb-20">
          {writing.map((item, i) => (
            <AnimatedSection key={i} delay={i * 0.1}>
              <Link to={item.link} className="block">
                <div className="bg-dark-800 border border-white/5 rounded-lg p-6 hover:border-cyan-500/20 transition-all group">
                  <h4 className="font-mono text-white text-lg mb-3 group-hover:text-cyan-400 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-gray-400 text-sm mb-4">{item.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-xs px-2 py-1 bg-cyan-500/5 text-cyan-400/60 rounded border border-cyan-500/10"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </AnimatedSection>
          ))}
        </div>

        {/* Projects */}
        <AnimatedSection>
          <h2 className="font-mono text-cyan-400 text-sm mb-2">{'> projects'}</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-12">
            What I&apos;ve Built
          </h3>
        </AnimatedSection>

        <div className="grid gap-6">
          {projects.map((project, i) => (
            <AnimatedSection key={i} delay={i * 0.1}>
              <ProjectCard project={project} />
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProjectCard({ project }) {
  return (
    <div className="bg-dark-800 border border-white/5 rounded-lg p-6 hover:border-cyan-500/20 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-mono text-white text-lg group-hover:text-cyan-400 transition-colors">
          {project.title}
        </h4>
        <span
          className={`font-mono text-xs px-2 py-1 rounded ${
            project.status === 'Shipped'
              ? 'bg-green-500/10 text-green-400'
              : project.status === 'In Progress'
              ? 'bg-yellow-500/10 text-yellow-400'
              : 'bg-gray-500/10 text-gray-500'
          }`}
        >
          {project.status}
        </span>
      </div>
      <p className="text-gray-400 text-sm mb-4">{project.description}</p>
      <div className="flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="font-mono text-xs px-2 py-1 bg-cyan-500/5 text-cyan-400/60 rounded border border-cyan-500/10"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

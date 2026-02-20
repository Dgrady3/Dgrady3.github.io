import AnimatedSection from './AnimatedSection'
import CodeBlock from './CodeBlock'

export default function About() {
  return (
    <section id="about" className="py-8 md:py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <AnimatedSection>
          <h2 className="font-mono text-cyan-400 text-sm mb-2">{'> about'}</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Who I Am
          </h3>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 gap-12">
          <AnimatedSection delay={0.1}>
            <p className="text-gray-400 leading-relaxed mb-4">
              Senior Software Engineer with 10+ years of experience shipping and
              scaling production applications. I specialize in Ruby on Rails
              backends and bring deep full-stack experience across React and AWS.
              I care about building systems that are reliable, maintainable, and
              aligned with real business outcomes.
            </p>

            <p className="text-gray-400 leading-relaxed mb-4">
              <span className="text-white font-medium">My path into engineering started with hustle.</span>
            </p>

            <p className="text-gray-400 leading-relaxed mb-4">
              In college, I ran a branch of{' '}
              <a
                href="https://www.studentpainters.biz/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 transition-colors underline underline-offset-2"
              >
                Student Painters
              </a>
              {' '}as a Branch Manager — responsible for the entire operation from
              the ground up. I built a crew of 10, drove all sales door-to-door,
              ran estimates, scheduled projects, and generated $42K in revenue
              during a single three-month summer season. The experience was intense
              and rewarding — but cold calling wasn&apos;t scalable. I wanted a better
              way to reach customers, so I set out to build a website.
            </p>

            <p className="text-gray-400 leading-relaxed mb-4">
              That curiosity quickly became an obsession, leading me to{' '}
              <a
                href="https://launchacademy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 transition-colors underline underline-offset-2"
              >
                Launch Academy
              </a>
              , an immersive Ruby on Rails bootcamp in Boston. I&apos;ve been
              building software ever since.
            </p>

            <p className="text-gray-400 leading-relaxed mb-4">
              The entrepreneurial drive never left. Outside of engineering roles,
              I&apos;ve built and scaled multiple ecommerce businesses from the
              ground up — product sourcing, store development, creative production,
              paid acquisition (including Facebook media buying), and fulfillment.
              I understand the business side of software because I&apos;ve lived it.
            </p>

            <p className="text-gray-400 leading-relaxed mb-4">
              I&apos;m also a{' '}
              <a
                href="https://patents.google.com/patent/US9550100B2"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 transition-colors underline underline-offset-2"
              >
                U.S. patent holder
              </a>
              . I invented a baseball training device designed to increase swing
              velocity, hand speed, and time to impact. Testing with collegiate
              athletes showed a 9% increase in bat speed and a 12% improvement in
              hand speed. I pitched the product to the{' '}
              <a
                href="https://www.nfhs.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 transition-colors underline underline-offset-2"
              >
                National Federation of State High School Associations
              </a>
              {' '}for approval in high school competition. While it ultimately
              wasn&apos;t approved for play, taking a product from concept to patent
              to national-level pitch was a defining experience.
            </p>

            <p className="text-white leading-relaxed font-medium">
              I build with an owner&apos;s mindset — technical depth, business
              context, and a bias toward action.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <CodeBlock title="joe_grady.rb">
{`class JoeGrady < Engineer
  def initialize
    @location  = "Charlotte, NC"
    @experience = "10+ years"
    @education = "UNC Asheville"
    @patent    = "US9550100B2"
  end

  def stack
    {
      backend:  [:ruby, :rails, :sql],
      frontend: [:react, :javascript],
      cloud:    [:aws, :docker],
      mindset:  :entrepreneurial
    }
  end

  def available?
    true # evenings & weekends
  end
end`}
            </CodeBlock>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

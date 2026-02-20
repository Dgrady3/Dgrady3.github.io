import ContentPage from '../components/ContentPage'
import CodeBlock from '../components/CodeBlock'
import AnimatedSection from '../components/AnimatedSection'
import TableOfContents from '../components/TableOfContents'

const sections = [
  { id: 'queue-design', title: 'Queue Design Philosophy' },
  { id: 'fan-out', title: 'The Fan-Out Pattern' },
  { id: 'idempotency', title: 'Idempotency or Regret' },
  { id: 'retry-strategy', title: 'Retry Strategy' },
  { id: 'dead-letter-queues', title: 'Dead Letter Queues & Recovery' },
  { id: 'batches', title: 'Batches & Callbacks' },
  { id: 'monitoring', title: 'Monitoring & Alerting' },
  { id: 'memory-tuning', title: 'Memory & Concurrency Tuning' },
  { id: 'rate-limiting', title: 'Rate Limiting External APIs' },
  { id: 'testing', title: 'Testing Async Code' },
]

function Section({ id, number, title, children }) {
  return (
    <AnimatedSection>
      <section id={id} className="mb-16 scroll-mt-28">
        <h2 className="font-mono text-cyan-400 text-sm mb-1">
          {`// ${String(number).padStart(2, '0')}`}
        </h2>
        <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
          {title}
        </h3>
        <div className="text-gray-400 leading-relaxed space-y-4">
          {children}
        </div>
      </section>
    </AnimatedSection>
  )
}

export default function SidekiqPage() {
  return (
    <ContentPage
      title="Sidekiq at Scale"
      subtitle="Sidekiq is simple until it isn't. Here's what breaks at scale and how to fix it."
    >
      <TableOfContents sections={sections} />

      {/* 1 — Queue Design Philosophy */}
      <Section id="queue-design" number={1} title="Queue Design Philosophy">
        <p>
          The default Sidekiq setup puts everything in one queue called{' '}
          <code className="text-cyan-400">default</code>. This works fine until your
          10-minute report generation job blocks the password reset email that needs to
          go out in 5 seconds. Queue design is about isolation — ensuring that slow,
          heavy work can&apos;t starve fast, critical work.
        </p>

        <CodeBlock title="config/sidekiq.yml — queue design">
{`# Priority-based queue configuration
:concurrency: 15
:queues:
  - [critical, 6]    # password resets, payment confirmations, alerts
  - [default, 3]     # standard business logic
  - [low, 1]         # reports, analytics, cleanup tasks

# The weights mean: for every 10 jobs pulled,
# 6 come from critical, 3 from default, 1 from low.
# Critical work is NEVER starved by bulk operations.`}
        </CodeBlock>

        <CodeBlock title="app/jobs/send_password_reset_job.rb">
{`class SendPasswordResetJob
  include Sidekiq::Job
  sidekiq_options queue: :critical, retry: 3

  def perform(user_id)
    user = User.find(user_id)
    UserMailer.password_reset(user).deliver_now
  end
end`}
        </CodeBlock>

        <CodeBlock title="app/jobs/generate_monthly_report_job.rb">
{`class GenerateMonthlyReportJob
  include Sidekiq::Job
  sidekiq_options queue: :low, retry: 1

  def perform(account_id, month)
    account = Account.find(account_id)
    ReportGenerator.new(account, month).execute!
  end
end`}
        </CodeBlock>

        <p>
          I&apos;ve also seen teams run separate Sidekiq processes per queue for true
          isolation — one process only pulls from <code className="text-cyan-400">critical</code>,
          another handles <code className="text-cyan-400">default</code> and{' '}
          <code className="text-cyan-400">low</code>. This is heavier operationally but
          guarantees that a runaway bulk job can&apos;t affect critical path work at all.
        </p>
      </Section>

      {/* 2 — The Fan-Out Pattern */}
      <Section id="fan-out" number={2} title="The Fan-Out Pattern">
        <p>
          When you need to process thousands of records — charge all subscriptions, send
          a campaign email, recalculate inventory — the pattern is always the same. A
          coordinator job fans out individual jobs, each calling a service object. Three
          layers, each with its own safety checks.
        </p>

        <CodeBlock title="layer 1 — coordinator job">
{`# app/jobs/charge_all_subscriptions_job.rb
class ChargeAllSubscriptionsJob
  include Sidekiq::Job
  sidekiq_options queue: :default

  def perform
    Subscription.active.due_for_charge.find_each do |subscription|
      # Idempotency: skip if already processed today
      next if subscription.charged_today?

      ChargeSubscriptionJob.perform_async(subscription.id)
    end
  end
end`}
        </CodeBlock>

        <CodeBlock title="layer 2 — individual job">
{`# app/jobs/charge_subscription_job.rb
class ChargeSubscriptionJob
  include Sidekiq::Job
  sidekiq_options queue: :critical, retry: 3

  def perform(subscription_id)
    subscription = Subscription.find(subscription_id)

    # Own idempotency check — safe to retry
    return if subscription.charged_today?

    ChargeSubscription.new(subscription).execute!
  end
end`}
        </CodeBlock>

        <CodeBlock title="layer 3 — service object">
{`# app/services/charge_subscription.rb
class ChargeSubscription
  def initialize(subscription)
    @subscription = subscription
  end

  def execute!
    validate!

    charge = Stripe::Charge.create(
      amount: @subscription.amount_cents,
      currency: "usd",
      customer: @subscription.stripe_customer_id,
      idempotency_key: "charge-#{@subscription.id}-#{Date.current}"
    )

    @subscription.update!(
      last_charged_at: Time.current,
      stripe_charge_id: charge.id
    )

    StatsD.increment("billing.charge.success")
    charge
  end

  private

  def validate!
    raise ArgumentError, "Not active" unless @subscription.active?
    raise ArgumentError, "No Stripe customer" if @subscription.stripe_customer_id.blank?
  end
end`}
        </CodeBlock>

        <p>
          Notice the Stripe{' '}
          <code className="text-cyan-400">idempotency_key</code> — even if the job runs
          twice, Stripe won&apos;t double-charge. Every layer has its own guard:
          the coordinator checks before enqueueing, the job checks before executing,
          the service validates before charging, and the payment provider has its own
          idempotency. Belt, suspenders, and a parachute.
        </p>
      </Section>

      {/* 3 — Idempotency or Regret */}
      <Section id="idempotency" number={3} title="Idempotency or Regret">
        <p>
          Jobs <em>will</em> run more than once. Redis restarts, process crashes, network
          hiccups — Sidekiq guarantees at-least-once delivery, not exactly-once. If
          running your job twice causes double charges, duplicate emails, or corrupted data,
          you have a bug that&apos;s waiting for the worst possible moment to surface.
        </p>

        <CodeBlock title="database-level idempotency">
{`class ProcessPaymentJob
  include Sidekiq::Job
  sidekiq_options retry: 3

  def perform(payment_id)
    payment = Payment.find(payment_id)

    # Guard: only process if still in pending state
    # Uses optimistic locking — safe under concurrency
    return unless payment.pending?

    payment.with_lock do
      # Double-check inside the lock
      return unless payment.pending?

      charge = Stripe::Charge.create(
        amount: payment.amount_cents,
        currency: "usd",
        customer: payment.stripe_customer_id,
        idempotency_key: "payment-#{payment.id}"
      )

      payment.update!(
        status: :completed,
        stripe_charge_id: charge.id,
        processed_at: Time.current
      )
    end
  end
end`}
        </CodeBlock>

        <CodeBlock title="unique jobs with sidekiq-unique-jobs">
{`# Gemfile
gem "sidekiq-unique-jobs"

# app/jobs/sync_inventory_job.rb
class SyncInventoryJob
  include Sidekiq::Job
  sidekiq_options(
    lock: :until_executed,       # prevent duplicate enqueuing
    lock_ttl: 30.minutes.to_i,  # auto-expire if job hangs
    on_conflict: :log            # log duplicates instead of raising
  )

  def perform(product_id)
    product = Product.find(product_id)
    InventorySync.new(product).execute!
  end
end

# Even if something enqueues this job 5 times for the same
# product_id, it only runs once. The duplicates are logged
# and discarded.`}
        </CodeBlock>

        <p>
          The three levels of idempotency protection: (1) prevent duplicate enqueuing with
          unique jobs, (2) check state before processing with database guards, (3) use
          external idempotency keys (Stripe, payment providers) for operations that can&apos;t
          be rolled back. Use all three when the operation involves money or user-facing side
          effects.
        </p>
      </Section>

      {/* 4 — Retry Strategy */}
      <Section id="retry-strategy" number={4} title="Retry Strategy">
        <p>
          Sidekiq&apos;s default retry behavior is 25 attempts over ~21 days with exponential
          backoff. That&apos;s almost never what you want. A failed payment should retry 3
          times over an hour. A failed webhook delivery might retry 5 times over a day. A
          failed report generation probably shouldn&apos;t retry at all — just alert someone.
        </p>

        <CodeBlock title="per-job retry configuration">
{`# Critical, time-sensitive — retry fast, fail fast
class SendTransactionalEmailJob
  include Sidekiq::Job
  sidekiq_options retry: 3  # 3 retries, ~30 seconds total

  def perform(user_id, template)
    user = User.find(user_id)
    TransactionalMailer.send(user, template).deliver_now
  end
end

# External API — retry with patience
class SyncToSalesforceJob
  include Sidekiq::Job
  sidekiq_options retry: 5  # 5 retries over ~30 minutes

  def perform(contact_id)
    contact = Contact.find(contact_id)
    SalesforceSync.new(contact).execute!
  end
end

# Expensive computation — don't retry, just alert
class GenerateAnnualReportJob
  include Sidekiq::Job
  sidekiq_options retry: 0, queue: :low  # no retries

  def perform(account_id, year)
    report = AnnualReportGenerator.new(account_id, year).execute!
    ReportMailer.ready(account_id, report.url).deliver_later
  rescue => e
    StatsD.increment("reports.generation.failed")
    Sentry.capture_exception(e)
    # Don't retry — a human needs to investigate
  end
end`}
        </CodeBlock>

        <CodeBlock title="custom error handling with retries exhausted">
{`class ChargeSubscriptionJob
  include Sidekiq::Job
  sidekiq_options retry: 3

  sidekiq_retries_exhausted do |job, exception|
    subscription_id = job["args"].first
    subscription = Subscription.find(subscription_id)

    # Mark the subscription as failed — don't leave it in limbo
    subscription.update!(
      charge_status: :failed,
      charge_failure_reason: exception.message
    )

    # Alert the team
    StatsD.increment("billing.charge.exhausted")
    SlackNotifier.alert(
      channel: "#billing-alerts",
      text: "Charge failed permanently for subscription #{subscription_id}: #{exception.message}"
    )
  end

  def perform(subscription_id)
    ChargeSubscription.new(
      Subscription.find(subscription_id)
    ).execute!
  end
end`}
        </CodeBlock>

        <p>
          The <code className="text-cyan-400">sidekiq_retries_exhausted</code> callback is
          essential for any job where failure has business consequences. Without it, the job
          silently moves to the dead set and no one knows until a customer complains. With it,
          you can update state, send alerts, and trigger recovery flows automatically.
        </p>
      </Section>

      {/* 5 — Dead Letter Queues & Recovery */}
      <Section id="dead-letter-queues" number={5} title="Dead Letter Queues & Recovery">
        <p>
          When all retries are exhausted, Sidekiq moves the job to the &quot;dead set&quot; —
          its equivalent of a dead letter queue. Most teams ignore this completely, which means
          failed jobs silently accumulate and eventually get pruned. You need visibility into
          what&apos;s dying and a strategy for recovery.
        </p>

        <CodeBlock title="monitoring the dead set">
{`# lib/tasks/sidekiq.rake
namespace :sidekiq do
  desc "Report on dead jobs"
  task dead_report: :environment do
    dead = Sidekiq::DeadSet.new

    puts "Dead jobs: #{dead.size}"
    puts ""

    # Group by job class to see patterns
    by_class = dead.each_with_object(Hash.new(0)) do |job, counts|
      counts[job.display_class] += 1
    end

    by_class.sort_by { |_, count| -count }.each do |klass, count|
      puts "  #{klass}: #{count}"
    end
  end

  desc "Retry all dead jobs of a specific class"
  task :retry_dead, [:job_class] => :environment do |_, args|
    dead = Sidekiq::DeadSet.new
    retried = 0

    dead.each do |job|
      if job.display_class == args[:job_class]
        job.retry
        retried += 1
      end
    end

    puts "Retried #{retried} #{args[:job_class]} jobs"
  end

  desc "Clear dead jobs older than N days"
  task :clear_old_dead, [:days] => :environment do |_, args|
    days = (args[:days] || 7).to_i
    cutoff = Time.current - days.days
    dead = Sidekiq::DeadSet.new
    cleared = 0

    dead.each do |job|
      if Time.at(job["failed_at"]) < cutoff
        job.delete
        cleared += 1
      end
    end

    puts "Cleared #{cleared} dead jobs older than #{days} days"
  end
end`}
        </CodeBlock>

        <CodeBlock title="automated dead set monitoring">
{`# app/jobs/monitor_dead_set_job.rb
class MonitorDeadSetJob
  include Sidekiq::Job
  sidekiq_options queue: :critical

  THRESHOLD = 50  # alert if more than 50 dead jobs

  def perform
    dead = Sidekiq::DeadSet.new
    count = dead.size

    StatsD.gauge("sidekiq.dead_set.size", count)

    if count > THRESHOLD
      SlackNotifier.alert(
        channel: "#eng-alerts",
        text: "Sidekiq dead set has #{count} jobs (threshold: #{THRESHOLD}). " \\
              "Run \`rake sidekiq:dead_report\` to investigate."
      )
    end
  end
end

# Schedule this to run every 15 minutes via sidekiq-cron or whenever`}
        </CodeBlock>

        <p>
          The key insight: the dead set is a diagnostic tool, not a trash can. When jobs
          start dying, it&apos;s usually a systemic issue — a downstream service is down,
          a database migration broke something, or a bug was deployed. Fix the root cause
          first, then bulk-retry the dead jobs. Retrying without fixing is just moving jobs
          from dead back to dead.
        </p>
      </Section>

      {/* 6 — Batches & Callbacks */}
      <Section id="batches" number={6} title="Batches & Callbacks">
        <p>
          Sometimes you need to know when a group of jobs has finished. &quot;Send 500
          individual emails, then send a summary report.&quot; &quot;Process all line items,
          then mark the order as fulfilled.&quot; Sidekiq Pro&apos;s Batch API handles this
          natively — and if you&apos;re running Sidekiq at scale, Pro is worth every penny.
        </p>

        <CodeBlock title="batch setup with callbacks">
{`# app/services/send_campaign.rb
class SendCampaign
  def initialize(campaign)
    @campaign = campaign
  end

  def execute!
    batch = Sidekiq::Batch.new
    batch.description = "Campaign #{@campaign.id}: #{@campaign.name}"
    batch.on(:complete, CampaignCallbacks, campaign_id: @campaign.id)
    batch.on(:success, CampaignCallbacks, campaign_id: @campaign.id)

    batch.jobs do
      @campaign.recipients.find_each do |recipient|
        SendCampaignEmailJob.perform_async(
          @campaign.id,
          recipient.id
        )
      end
    end

    @campaign.update!(
      status: :sending,
      batch_id: batch.bid
    )
  end
end`}
        </CodeBlock>

        <CodeBlock title="batch callbacks">
{`# app/callbacks/campaign_callbacks.rb
class CampaignCallbacks
  # Called when ALL jobs have run (success or failure)
  def on_complete(status, options)
    campaign = Campaign.find(options["campaign_id"])
    total = status.total
    failures = status.failures

    campaign.update!(
      status: failures > 0 ? :completed_with_errors : :completed,
      sent_count: total - failures,
      failed_count: failures,
      completed_at: Time.current
    )

    StatsD.gauge("campaigns.sent", total - failures)
    StatsD.gauge("campaigns.failed", failures)

    if failures > 0
      SlackNotifier.alert(
        channel: "#marketing",
        text: "Campaign '#{campaign.name}' completed: " \\
              "#{total - failures}/#{total} sent, #{failures} failed."
      )
    end
  end

  # Called only when ALL jobs succeed
  def on_success(status, options)
    campaign = Campaign.find(options["campaign_id"])

    # Send the summary report only on full success
    CampaignReportMailer.summary(campaign).deliver_later
  end
end`}
        </CodeBlock>

        <p>
          The distinction between <code className="text-cyan-400">on(:complete)</code> and{' '}
          <code className="text-cyan-400">on(:success)</code> is important.{' '}
          <code className="text-cyan-400">complete</code> fires when every job has finished,
          regardless of outcome — use it for cleanup and status updates.{' '}
          <code className="text-cyan-400">success</code> only fires when every job succeeded —
          use it for actions that only make sense if nothing failed.
        </p>
      </Section>

      {/* 7 — Monitoring & Alerting */}
      <Section id="monitoring" number={7} title="Monitoring & Alerting">
        <p>
          Three metrics tell you everything about Sidekiq health: <strong>queue depth</strong>{' '}
          (are jobs backing up?), <strong>latency</strong> (how long are jobs waiting before
          they start?), and <strong>error rate</strong> (are jobs failing?). If any of these
          spike, something is wrong — and you want to know before your users do.
        </p>

        <CodeBlock title="config/initializers/sidekiq_metrics.rb">
{`# Report Sidekiq metrics to Datadog every 30 seconds
Sidekiq.configure_server do |config|
  config.on(:startup) do
    Thread.new do
      loop do
        stats = Sidekiq::Stats.new

        # Global metrics
        StatsD.gauge("sidekiq.processed", stats.processed)
        StatsD.gauge("sidekiq.failed", stats.failed)
        StatsD.gauge("sidekiq.enqueued", stats.enqueued)
        StatsD.gauge("sidekiq.dead", stats.dead_size)
        StatsD.gauge("sidekiq.retry_size", stats.retry_size)

        # Per-queue metrics
        Sidekiq::Queue.all.each do |queue|
          StatsD.gauge("sidekiq.queue.size", queue.size,
            tags: ["queue:#{queue.name}"])
          StatsD.gauge("sidekiq.queue.latency", queue.latency,
            tags: ["queue:#{queue.name}"])
        end

        # Process metrics
        StatsD.gauge("sidekiq.processes", Sidekiq::ProcessSet.new.size)
        StatsD.gauge("sidekiq.workers.busy",
          Sidekiq::Workers.new.size)

        sleep 30
      end
    end
  end
end`}
        </CodeBlock>

        <CodeBlock title="datadog monitors — what to alert on">
{`# Queue latency > 30s on critical queue — jobs are waiting too long
Monitor: "Sidekiq Critical Queue Latency"
  Query: avg:sidekiq.queue.latency{queue:critical} > 30
  Threshold: Warning > 15s, Critical > 30s
  Notify: #eng-alerts, PagerDuty

# Queue depth growing — jobs are backing up
Monitor: "Sidekiq Queue Backlog"
  Query: avg:sidekiq.queue.size{queue:default} > 1000
  Threshold: Warning > 500, Critical > 1000
  Notify: #eng-alerts

# Error rate spike — more than 1% of processed jobs failing
Monitor: "Sidekiq Error Rate"
  Query: rate(sidekiq.failed) / rate(sidekiq.processed) > 0.01
  Threshold: Warning > 0.5%, Critical > 1%
  Notify: #eng-alerts

# Dead set growing — retries are being exhausted
Monitor: "Sidekiq Dead Set Growing"
  Query: avg:sidekiq.dead > 50
  Threshold: Warning > 25, Critical > 50
  Notify: #eng-alerts

# No workers busy but queue has jobs — processes might be down
Monitor: "Sidekiq Workers Idle With Backlog"
  Query: sidekiq.workers.busy == 0 AND sidekiq.enqueued > 0
  Threshold: Critical (sustained 5 minutes)
  Notify: #eng-alerts, PagerDuty`}
        </CodeBlock>

        <p>
          The last monitor — workers idle with a backlog — catches a failure mode that&apos;s
          easy to miss. If your Sidekiq processes crash or lose their Redis connection, jobs
          pile up but nothing is processing them. Without this monitor, you won&apos;t know
          until the queue is thousands deep.
        </p>
      </Section>

      {/* 8 — Memory & Concurrency Tuning */}
      <Section id="memory-tuning" number={8} title="Memory & Concurrency Tuning">
        <p>
          Ruby&apos;s memory behavior with Sidekiq is... interesting. Each Sidekiq thread
          shares the same process memory, but Ruby&apos;s garbage collector doesn&apos;t
          always return memory to the OS after large allocations. Over time, your Sidekiq
          workers slowly grow in RSS (resident set size) until they hit container limits
          and get OOM-killed.
        </p>

        <CodeBlock title="sidekiq.yml — concurrency tuning">
{`# Rule of thumb: concurrency = number of threads
# More threads = more concurrent jobs, but more memory and DB connections
#
# For I/O bound jobs (API calls, emails): higher concurrency (15-25)
# For CPU bound jobs (reports, parsing): lower concurrency (5-10)
# For memory-heavy jobs: lower concurrency to avoid OOM
:concurrency: 15`}
        </CodeBlock>

        <CodeBlock title="jemalloc — the single biggest memory improvement">
{`# Dockerfile — use jemalloc for dramatically better memory behavior
FROM ruby:3.3

RUN apt-get update && apt-get install -y libjemalloc2
ENV LD_PRELOAD=/usr/lib/x86_64-linux-gnu/libjemalloc.so.2
ENV MALLOC_CONF="dirty_decay_ms:1000,narenas:2"

# jemalloc reduces memory fragmentation significantly.
# In practice, I've seen 30-40% reduction in RSS for
# long-running Sidekiq processes. It's a free win.`}
        </CodeBlock>

        <CodeBlock title="worker killer — graceful memory limits">
{`# Gemfile
gem "sidekiq-worker-killer"

# config/initializers/sidekiq.rb
Sidekiq.configure_server do |config|
  # Kill worker if it exceeds 512MB RSS
  # Sidekiq will finish the current job, then restart the process
  config.server_middleware do |chain|
    chain.add Sidekiq::WorkerKiller,
      max_rss: 512,              # MB — kill above this threshold
      grace_time: 15 * 60,      # 15 min — don't kill immediately on boot
      shutdown_wait: 30          # seconds to finish current job
  end
end

# This prevents slow memory leaks from turning into OOM kills.
# The worker finishes its current job gracefully, exits, and
# your process manager (systemd, ECS) restarts it with fresh memory.`}
        </CodeBlock>

        <p>
          The formula for container memory limits: take your base Ruby process (~150MB), add
          per-thread overhead (~15MB x concurrency), add headroom for spikes, and set the
          container limit above that. For 15 threads: 150 + (15 * 15) + 100 = ~475MB. I
          typically set the container limit at 512MB-1GB depending on job types, with the
          worker killer threshold at 80% of the container limit.
        </p>
      </Section>

      {/* 9 — Rate Limiting External APIs */}
      <Section id="rate-limiting" number={9} title="Rate Limiting External APIs">
        <p>
          When your fan-out job enqueues 5,000 jobs that each call the Stripe API, and all
          5,000 start executing simultaneously, you&apos;re going to have a bad time. External
          APIs have rate limits, and hitting them means failed jobs, wasted retries, and
          potentially getting your API key throttled or banned.
        </p>

        <CodeBlock title="redis-based rate limiter">
{`# app/lib/rate_limiter.rb
class RateLimiter
  def initialize(name:, limit:, period:)
    @name = name
    @limit = limit
    @period = period
  end

  def throttle!
    key = "rate_limit:#{@name}:#{current_window}"

    count = Sidekiq.redis do |conn|
      conn.multi do |m|
        m.incr(key)
        m.expire(key, @period)
      end.first
    end

    if count > @limit
      sleep_time = time_until_next_window
      Rails.logger.info(
        "[RateLimiter] #{@name} limit reached (#{count}/#{@limit}), " \\
        "sleeping #{sleep_time}s"
      )
      sleep(sleep_time)
    end
  end

  private

  def current_window
    (Time.current.to_i / @period) * @period
  end

  def time_until_next_window
    @period - (Time.current.to_i % @period)
  end
end

# Usage in a job:
# limiter = RateLimiter.new(name: "stripe", limit: 90, period: 1)
# limiter.throttle!
# Stripe::Charge.create(...)`}
        </CodeBlock>

        <CodeBlock title="using Sidekiq Enterprise rate limiting">
{`# If you have Sidekiq Enterprise, rate limiting is built in
class SyncToHubspotJob
  include Sidekiq::Job
  sidekiq_options queue: :default

  LIMITER = Sidekiq::Limiter.concurrent(
    :hubspot_api,
    10,                          # max 10 concurrent jobs hitting HubSpot
    wait_timeout: 30,            # wait up to 30s for a slot
    lock_timeout: 5.minutes      # release slot if job takes > 5 min
  )

  def perform(contact_id)
    LIMITER.within_limit do
      contact = Contact.find(contact_id)
      HubspotSync.new(contact).execute!
    end
  end
end

# Or use a window limiter for APIs with per-second/minute limits:
STRIPE_LIMITER = Sidekiq::Limiter.window(
  :stripe_api,
  90,           # 90 requests
  :second       # per second (Stripe's rate limit)
)`}
        </CodeBlock>

        <p>
          For most teams, the Redis-based rate limiter is sufficient. Sidekiq Enterprise&apos;s
          limiters are more robust (they handle multi-process coordination better), but the
          principle is the same: know your external API&apos;s rate limits, enforce them in
          your job layer, and sleep or queue instead of hammering the endpoint and dealing
          with 429 errors.
        </p>
      </Section>

      {/* 10 — Testing Async Code */}
      <Section id="testing" number={10} title="Testing Async Code">
        <p>
          Sidekiq&apos;s test modes are powerful but misunderstood. There are two modes:{' '}
          <code className="text-cyan-400">fake!</code> (jobs are pushed to an in-memory array)
          and <code className="text-cyan-400">inline!</code> (jobs execute immediately in the
          same process). Each serves a different purpose, and using the wrong one leads to
          either flaky tests or tests that don&apos;t catch real bugs.
        </p>

        <CodeBlock title="testing that jobs are enqueued (fake mode)">
{`# spec/services/place_order_spec.rb
RSpec.describe PlaceOrder do
  describe "#execute!" do
    it "enqueues the confirmation email job" do
      Sidekiq::Testing.fake! do
        order = create(:order)

        expect {
          described_class.new(order).execute!
        }.to change(SendOrderConfirmationJob.jobs, :size).by(1)

        # Verify the job was enqueued with correct args
        job = SendOrderConfirmationJob.jobs.last
        expect(job["args"]).to eq([order.id])
      end
    end

    it "enqueues inventory reservation on the critical queue" do
      Sidekiq::Testing.fake! do
        order = create(:order)
        described_class.new(order).execute!

        job = ReserveInventoryJob.jobs.last
        expect(job["queue"]).to eq("critical")
      end
    end
  end
end`}
        </CodeBlock>

        <CodeBlock title="testing job behavior (inline mode)">
{`# spec/jobs/charge_subscription_job_spec.rb
RSpec.describe ChargeSubscriptionJob do
  around do |example|
    # Inline mode: jobs execute immediately when enqueued
    Sidekiq::Testing.inline! { example.run }
  end

  it "charges the subscription and updates the record" do
    subscription = create(:subscription, :active,
      stripe_customer_id: "cus_test123")

    # Stub external API
    allow(Stripe::Charge).to receive(:create).and_return(
      OpenStruct.new(id: "ch_test456")
    )

    described_class.perform_async(subscription.id)

    subscription.reload
    expect(subscription.stripe_charge_id).to eq("ch_test456")
    expect(subscription.last_charged_at).to be_within(1.second).of(Time.current)
  end

  it "does not double-charge an already-charged subscription" do
    subscription = create(:subscription, :active,
      last_charged_at: Time.current)

    expect(Stripe::Charge).not_to receive(:create)

    described_class.perform_async(subscription.id)
  end
end`}
        </CodeBlock>

        <CodeBlock title="testing the full async chain">
{`# spec/integration/subscription_billing_spec.rb
RSpec.describe "Subscription billing", type: :integration do
  it "charges all due subscriptions end-to-end" do
    Sidekiq::Testing.inline! do
      due = create_list(:subscription, 3, :active, :due_for_charge)
      not_due = create(:subscription, :active, last_charged_at: 1.hour.ago)

      allow(Stripe::Charge).to receive(:create).and_return(
        OpenStruct.new(id: "ch_#{SecureRandom.hex(4)}")
      )

      ChargeAllSubscriptionsJob.perform_async

      # All due subscriptions were charged
      due.each do |sub|
        expect(sub.reload.last_charged_at).to be_present
        expect(sub.stripe_charge_id).to be_present
      end

      # Not-due subscription was skipped
      expect(not_due.reload.stripe_charge_id).to be_nil
    end
  end
end`}
        </CodeBlock>

        <p>
          My rule: use <code className="text-cyan-400">fake!</code> to test <em>that</em> jobs
          are enqueued with the right arguments and options. Use{' '}
          <code className="text-cyan-400">inline!</code> to test <em>what</em> jobs actually
          do when they run. And use inline mode for integration tests that exercise the full
          fan-out chain. The combination gives you confidence that the right jobs fire, they
          do the right thing, and the whole pipeline works end-to-end.
        </p>
      </Section>
    </ContentPage>
  )
}

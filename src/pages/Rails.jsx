import ContentPage from '../components/ContentPage'
import CodeBlock from '../components/CodeBlock'
import AnimatedSection from '../components/AnimatedSection'
import TableOfContents from '../components/TableOfContents'

const sections = [
  { id: 'events-over-callbacks', title: 'Events Over Callbacks' },
  { id: 'observability', title: 'Observability & Monitoring' },
  { id: 'skinny-controllers', title: 'Skinny Controllers, Fat Models' },
  { id: 'service-objects', title: 'Service Objects' },
  { id: 'sidekiq-jobs', title: 'Sidekiq Job Architecture' },
  { id: 'query-objects', title: 'Query Objects' },
  { id: 'concerns', title: 'Concerns & Modules' },
  { id: 'indexes', title: 'Index Searched Columns' },
  { id: 'namespacing', title: 'Namespacing Matters' },
  { id: 'inline-one-liners', title: 'Inline One-Liners' },
  { id: 'testing', title: 'Testing Philosophy' },
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

export default function Rails() {
  return (
    <ContentPage
      title="How I Rails"
      subtitle="Battle-tested patterns and principles from 10+ years of production Rails."
    >
      <TableOfContents sections={sections} />

      {/* 1 — Events Over Callbacks */}
      <Section id="events-over-callbacks" number={1} title="Events Over Callbacks">
        <p>
          Rails callbacks (<code className="text-cyan-400">after_create</code>,{' '}
          <code className="text-cyan-400">after_save</code>, etc.) are one of the most abused
          features in the framework. They create invisible side effects that fire whether you
          want them to or not — leading to callback hell where saving a record triggers a
          chain of operations you can't easily trace, test, or disable.
        </p>
        <p>
          Events flip this around. Instead of a model silently doing things when it's saved,
          you explicitly publish an event and let subscribers react independently. Each
          subscriber has a single responsibility, runs in its own context, and — critically —
          creates a paper trail so you can trace exactly how data got to a certain state.
        </p>

        <CodeBlock title="callback hell — app/models/order.rb">
{`# Bad — invisible chain of side effects
class Order < ApplicationRecord
  after_create :send_confirmation_email
  after_create :reserve_inventory
  after_create :notify_warehouse
  after_create :update_analytics
  after_create :sync_to_crm
  after_update :recalculate_totals, if: :line_items_changed?
  after_update :notify_customer_of_changes

  # Good luck figuring out what happens when you save an order.
  # Good luck testing any of this in isolation.
  # Good luck disabling one of these in a migration or rake task.
end`}
        </CodeBlock>

        <CodeBlock title="event-driven — app/services/place_order.rb">
{`# Good — explicit, traceable, testable
class PlaceOrder
  def execute!(order)
    order.save!

    # Publish a domain event — subscribers handle the rest
    EventBus.publish("order.placed", order: order)
  end
end

# Each subscriber is independent and single-purpose
# app/subscribers/order/send_confirmation.rb
class Order::SendConfirmation
  def self.call(event)
    order = event[:order]
    OrderMailer.confirmation(order).deliver_later
    EventLog.record("order.placed", "confirmation_email_sent", order_id: order.id)
  end
end

# app/subscribers/order/reserve_inventory.rb
class Order::ReserveInventory
  def self.call(event)
    order = event[:order]
    InventoryService.reserve(order.line_items)
    EventLog.record("order.placed", "inventory_reserved", order_id: order.id)
  end
end`}
        </CodeBlock>

        <CodeBlock title="config/initializers/event_subscriptions.rb">
{`# Wire up subscribers — all in one place, easy to audit
EventBus.subscribe("order.placed", Order::SendConfirmation)
EventBus.subscribe("order.placed", Order::ReserveInventory)
EventBus.subscribe("order.placed", Order::NotifyWarehouse)
EventBus.subscribe("order.placed", Analytics::TrackConversion)
EventBus.subscribe("order.placed", Crm::SyncOrder)`}
        </CodeBlock>

        <p>
          With events, you get a complete paper trail. Every subscriber logs what it did
          and why. When someone asks "why did this order get flagged?" you can trace the
          exact sequence: event published → subscriber fired → action taken → logged. With
          callbacks, that same investigation is archaeology.
        </p>
        <p>
          Events also decouple your domains. Your Order model doesn't need to know about
          emails, inventory, warehouses, or CRMs. Subscribers can be added, removed, or
          modified without touching the model. Need to temporarily disable warehouse
          notifications during a migration? Comment out one line in the initializer — not
          a callback buried in a model.
        </p>
      </Section>

      {/* 2 — Observability & Monitoring */}
      <Section id="observability" number={2} title="Observability & Monitoring">
        <p>
          If you don't have monitoring, your app is flying blind. You'll find out about
          errors when your users tell you — or worse, when they leave. Datadog (or similar)
          isn't optional on a production Rails app. You need dashboards, error tracking,
          custom metrics, and alerting with thresholds.
        </p>

        <CodeBlock title="config/initializers/datadog.rb">
{`Datadog.configure do |c|
  c.service = "my-rails-app"
  c.env = Rails.env
  c.tracing.enabled = true
  c.tracing.instrument :rails
  c.tracing.instrument :redis
  c.tracing.instrument :sidekiq
  c.tracing.instrument :pg  # PostgreSQL query tracing
end`}
        </CodeBlock>

        <p>
          Instrument everything that matters: HTTP requests, database queries, Redis calls,
          background jobs. Datadog's APM will surface slow endpoints, N+1 queries, and
          bottlenecks you'd never catch in development.
        </p>

        <CodeBlock title="app/services/charge_subscription.rb — with metrics">
{`class ChargeSubscription
  def execute!
    validate!

    charge = StatsD.measure("billing.charge.duration") do
      Stripe::Charge.create(
        amount: @subscription.amount_cents,
        currency: "usd",
        customer: @subscription.stripe_customer_id
      )
    end

    @subscription.update!(
      last_charged_at: Time.current,
      stripe_charge_id: charge.id
    )

    # Track success for dashboards
    StatsD.increment("billing.charge.success")
    StatsD.gauge("billing.charge.amount", @subscription.amount_cents)

    charge
  rescue Stripe::CardError => e
    StatsD.increment("billing.charge.card_error")
    Rails.logger.error("[ChargeSubscription] Card declined: #{e.message}")
    raise
  rescue => e
    StatsD.increment("billing.charge.unexpected_error")
    Rails.logger.error("[ChargeSubscription] Unexpected: #{e.class} - #{e.message}")
    raise
  end
end`}
        </CodeBlock>

        <CodeBlock title="structured logging — app/lib/structured_logger.rb">
{`# JSON-structured logs that Datadog can parse and index
class StructuredLogger
  def self.info(event, **context)
    Rails.logger.info({
      event: event,
      timestamp: Time.current.iso8601,
      **context
    }.to_json)
  end

  def self.error(event, error:, **context)
    Rails.logger.error({
      event: event,
      error_class: error.class.name,
      error_message: error.message,
      timestamp: Time.current.iso8601,
      **context
    }.to_json)
  end
end

# Usage:
# StructuredLogger.info("order.placed", order_id: order.id, total: order.total)
# StructuredLogger.error("charge.failed", error: e, subscription_id: sub.id)`}
        </CodeBlock>

        <CodeBlock title="monitoring thresholds — datadog monitors (pseudo-config)">
{`# Alert if error rate spikes above 1% of requests
Monitor: "High Error Rate"
  Query: sum:billing.charge.unexpected_error / sum:billing.charge.* > 0.01
  Threshold: Critical > 1%, Warning > 0.5%
  Notify: #eng-alerts, PagerDuty

# Alert if p95 response time exceeds 500ms
Monitor: "Slow API Response"
  Query: p95:trace.rack.request.duration > 0.5
  Threshold: Critical > 500ms, Warning > 300ms
  Notify: #eng-alerts

# Alert if Sidekiq queue depth grows (jobs backing up)
Monitor: "Sidekiq Queue Backlog"
  Query: avg:sidekiq.queue.size{queue:critical} > 100
  Threshold: Critical > 500, Warning > 100
  Notify: #eng-alerts, PagerDuty

# Alert if zero successful charges in 30 min (business logic monitor)
Monitor: "No Successful Charges"
  Query: sum:billing.charge.success{*}.rollup(sum, 1800) == 0
  Threshold: Critical == 0 (during business hours)
  Notify: #billing-team`}
        </CodeBlock>

        <p>
          The key layers of observability: <strong>APM traces</strong> to see where time is
          spent, <strong>custom metrics</strong> to track business-critical operations,{' '}
          <strong>structured logs</strong> that are parseable and searchable, and{' '}
          <strong>monitors with thresholds</strong> that page you before users complain. Build
          dashboards for your critical paths — billing, auth, onboarding — and check them
          weekly even when things seem fine. The patterns you catch early save you from 2 AM
          incidents.
        </p>
      </Section>

      {/* 3 — Skinny Controllers, Fat Models */}
      <Section id="skinny-controllers" number={3} title="Skinny Controllers, Fat Models">
        <p>
          Controllers should delegate, not contain logic. Their job is to receive a request,
          hand it off, and return a response. Business logic belongs in models, service objects,
          or modules — not in your controller actions.
        </p>

        <CodeBlock title="app/controllers/orders_controller.rb — before">
{`# Bad — controller doing too much
class OrdersController < ApplicationController
  def create
    @order = Order.new(order_params)
    @order.total = @order.line_items.sum(&:price)
    @order.tax = @order.total * 0.08
    @order.status = 'pending'

    if @order.save
      OrderMailer.confirmation(@order).deliver_later
      InventoryService.reserve(@order.line_items)
      redirect_to @order
    else
      render :new
    end
  end
end`}
        </CodeBlock>

        <CodeBlock title="app/controllers/orders_controller.rb — after">
{`# Good — controller delegates everything
class OrdersController < ApplicationController
  def create
    @order = Order.build_from_params(order_params)

    if @order.save
      @order.process_new_order
      redirect_to @order
    else
      render :new
    end
  end
end`}
        </CodeBlock>
      </Section>

      {/* 4 — Service Objects */}
      <Section id="service-objects" number={4} title="Service Objects">
        <p>
          Service objects encapsulate a single business operation. I follow a consistent pattern:
          validate inputs first, then <code className="text-cyan-400">execute!</code> the operation.
          The bang method signals that failures should raise — you expect errors on non-successful
          executions, so handle them explicitly.
        </p>

        <CodeBlock title="app/services/charge_subscription.rb">
{`class ChargeSubscription
  def initialize(subscription)
    @subscription = subscription
  end

  def execute!
    validate!

    charge = Stripe::Charge.create(
      amount: @subscription.amount_cents,
      currency: 'usd',
      customer: @subscription.stripe_customer_id
    )

    @subscription.update!(
      last_charged_at: Time.current,
      stripe_charge_id: charge.id
    )

    charge
  end

  private

  def validate!
    raise ArgumentError, "Subscription is not active" unless @subscription.active?
    raise ArgumentError, "Missing Stripe customer" if @subscription.stripe_customer_id.blank?
  end
end

# Usage:
# ChargeSubscription.new(subscription).execute!`}
        </CodeBlock>
      </Section>

      {/* 5 — Sidekiq Job Architecture */}
      <Section id="sidekiq-jobs" number={5} title="Sidekiq Job Architecture">
        <p>
          For large-scale async work, I use a three-layer pattern: a batch job fans out to
          individual jobs, each calling a service object. Every layer has its own idempotency
          check — so retries are safe at any level.
        </p>

        <CodeBlock title="app/jobs/charge_all_subscriptions_job.rb">
{`# Layer 1: Batch job — fans out work
class ChargeAllSubscriptionsJob
  include Sidekiq::Job

  def perform
    Subscription.active.due_for_charge.find_each do |subscription|
      # Skip if already charged today (idempotency)
      next if subscription.charged_today?

      ChargeSubscriptionJob.perform_async(subscription.id)
    end
  end
end`}
        </CodeBlock>

        <CodeBlock title="app/jobs/charge_subscription_job.rb">
{`# Layer 2: Single job — processes one record
class ChargeSubscriptionJob
  include Sidekiq::Job
  sidekiq_options retry: 3

  def perform(subscription_id)
    subscription = Subscription.find(subscription_id)

    # Own idempotency check
    return if subscription.charged_today?

    ChargeSubscription.new(subscription).execute!
  end
end`}
        </CodeBlock>

        <p>
          Three layers, each with its own safety net. The batch job is safe to re-run.
          The single job is safe to retry. The service object validates before executing.
        </p>
      </Section>

      {/* 6 — Query Objects */}
      <Section id="query-objects" number={6} title="Query Objects">
        <p>
          When scopes start chaining five deep or raw SQL creeps into your models, extract
          a query object. It keeps your models clean and makes complex queries testable
          in isolation.
        </p>

        <CodeBlock title="app/queries/overdue_invoices_query.rb">
{`class OverdueInvoicesQuery
  def initialize(relation = Invoice.all)
    @relation = relation
  end

  def call
    @relation
      .where(status: :sent)
      .where("due_date < ?", Date.current)
      .where(paid_at: nil)
      .includes(:customer)
      .order(due_date: :asc)
  end
end

# Usage:
# OverdueInvoicesQuery.new.call
# OverdueInvoicesQuery.new(current_company.invoices).call`}
        </CodeBlock>
      </Section>

      {/* 7 — Concerns / Modules */}
      <Section id="concerns" number={7} title="Concerns & Modules">
        <p>
          Concerns are Rails' mechanism for sharing behavior across models. Use them when
          multiple models genuinely share the same behavior — not as a dumping ground
          to make a model file shorter.
        </p>

        <CodeBlock title="app/models/concerns/archivable.rb">
{`module Archivable
  extend ActiveSupport::Concern

  included do
    scope :archived, -> { where.not(archived_at: nil) }
    scope :active, -> { where(archived_at: nil) }
  end

  def archive!
    update!(archived_at: Time.current)
  end

  def restore!
    update!(archived_at: nil)
  end

  def archived?
    archived_at.present?
  end
end

# app/models/project.rb
# class Project < ApplicationRecord
#   include Archivable
# end`}
        </CodeBlock>

        <p>
          Good concern: shared behavior that multiple models use identically.
          Bad concern: dumping 200 lines from a model into a concern just to make the model
          file shorter. That's just hiding complexity.
        </p>
      </Section>

      {/* 8 — Index Searched Columns */}
      <Section id="indexes" number={8} title="Database: Index Searched Columns">
        <p>
          This one's simple but I see it missed constantly. If you query a column, index it.
          If you don't, you're doing a full table scan on every request — and it'll be
          invisible until you have enough data for it to hurt.
        </p>

        <CodeBlock title="db/migrate/20250101_add_indexes.rb">
{`class AddIndexes < ActiveRecord::Migration[7.1]
  def change
    # Every column in a WHERE clause needs an index
    add_index :orders, :status
    add_index :orders, :customer_id
    add_index :orders, :created_at

    # Composite index for queries that filter on both
    add_index :orders, [:status, :created_at]

    # Unique index doubles as a constraint
    add_index :users, :email, unique: true
  end
end`}
        </CodeBlock>
      </Section>

      {/* 9 — Namespacing */}
      <Section id="namespacing" number={9} title="Namespacing Matters">
        <p>
          Organize by domain, not by pattern. When your app grows, <code className="text-cyan-400">app/services/</code> with
          40 flat files tells you nothing. Namespace by the domain concept they belong to.
        </p>

        <CodeBlock title="directory structure">
{`# Bad — flat structure, no context
app/services/
  charge_subscription.rb
  cancel_subscription.rb
  send_invoice.rb
  generate_report.rb
  create_user.rb

# Good — namespaced by domain
app/services/
  billing/
    charge_subscription.rb
    cancel_subscription.rb
  invoicing/
    send_invoice.rb
    generate_report.rb
  registration/
    create_user.rb`}
        </CodeBlock>
      </Section>

      {/* 10 — Inline One-Liners */}
      <Section id="inline-one-liners" number={10} title="Inline One-Liners">
        <p>
          Don't extract a method for every single line of code. If it's used once and the
          intent is already clear, inline it. Only extract when it genuinely improves
          readability or removes duplication.
        </p>

        <CodeBlock title="unnecessary extraction">
{`# Over-engineered — method adds nothing
class Order < ApplicationRecord
  def display_total
    formatted_currency(total)
  end

  private

  def formatted_currency(amount)
    "$#{'%.2f' % amount}"
  end
end`}
        </CodeBlock>

        <CodeBlock title="just inline it">
{`# Better — it's one line, used once
class Order < ApplicationRecord
  def display_total
    "$#{'%.2f' % total}"
  end
end`}
        </CodeBlock>
      </Section>

      {/* 11 — Testing Philosophy */}
      <Section id="testing" number={11} title="Testing Philosophy">
        <p>
          Test behavior, not implementation. I write heavy integration specs that exercise
          the full stack, lighter unit tests for isolated logic. TDD when the problem is
          clear, tests-after when exploring. RSpec over Minitest — always.
        </p>

        <CodeBlock title="spec/services/charge_subscription_spec.rb">
{`# Good — tests behavior and outcomes
RSpec.describe ChargeSubscription do
  describe "#execute!" do
    let(:subscription) { create(:subscription, :active) }

    it "charges the subscription and records the charge" do
      charge = described_class.new(subscription).execute!

      expect(charge.id).to be_present
      expect(subscription.reload.last_charged_at).to be_within(1.second).of(Time.current)
    end

    it "raises when the subscription is inactive" do
      subscription.update!(status: :cancelled)

      expect {
        described_class.new(subscription).execute!
      }.to raise_error(ArgumentError, /not active/)
    end
  end
end`}
        </CodeBlock>

        <CodeBlock title="what not to do">
{`# Bad — testing implementation details
it "calls Stripe::Charge.create with the correct params" do
  expect(Stripe::Charge).to receive(:create).with(
    amount: 999,
    currency: 'usd',
    customer: 'cus_123'
  )

  # This test breaks if you refactor internals
  # even though behavior hasn't changed
  described_class.new(subscription).execute!
end`}
        </CodeBlock>

        <p>
          The first test tells you <em>what the system does</em>. The second test tells you
          <em>how it's currently implemented</em> — and it'll break the moment you refactor,
          even if nothing about the behavior changed.
        </p>
      </Section>
    </ContentPage>
  )
}

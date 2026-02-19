import ContentPage from '../components/ContentPage'
import CodeBlock from '../components/CodeBlock'
import AnimatedSection from '../components/AnimatedSection'
import TableOfContents from '../components/TableOfContents'

const sections = [
  { id: 'prompt-engineering', title: 'Prompt Engineering That Actually Works' },
  { id: 'pair-programmer', title: 'Claude as a Pair Programmer' },
  { id: 'tool-use', title: 'Tool Use & Agentic Patterns' },
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

export default function Claude() {
  return (
    <ContentPage
      title="Building with Claude"
      subtitle="How I use AI as a force multiplier — not a replacement — in production engineering."
    >
      <TableOfContents sections={sections} />

      {/* 1 — Prompt Engineering That Actually Works */}
      <Section id="prompt-engineering" number={1} title="Prompt Engineering That Actually Works">
        <p>
          Most people throw vague instructions at a model and blame the model when
          the output is garbage. The real skill is treating system prompts like
          contracts — be specific about role, constraints, and output format. Vague
          prompts = vague results. Every time.
        </p>
        <p>
          A good system prompt tells the model <em>who it is</em>, <em>what it
          should and shouldn't do</em>, and <em>exactly how to format its output</em>.
          Few-shot examples are even better — show the model what you want instead
          of just telling it.
        </p>

        <CodeBlock title="bad vs good system prompt" language="plain">
{`# Bad — vague, no constraints, no format
System: "You are a helpful assistant. Help the user with their code."

# Good — specific role, constraints, output format
System: """
You are a senior Rails code reviewer. Your job is to review pull
requests for a production Rails 7 app using PostgreSQL and Sidekiq.

Rules:
- Focus on correctness, performance, and security
- Flag N+1 queries, missing indexes, and unscoped queries
- Suggest specific fixes, not vague advice
- If the code looks good, say so — don't invent problems

Output format:
- 🔴 Critical: Must fix before merge
- 🟡 Suggestion: Would improve but not blocking
- 🟢 Looks good: No issues found

Always reference the specific line numbers in your review.
"""`}
        </CodeBlock>

        <p>
          Structured output is where it gets powerful. Instead of parsing free text,
          use JSON mode or tool_use to get reliable, machine-readable responses.
          This is the difference between a toy demo and a production integration.
        </p>

        <CodeBlock title="structured output with tool_use" language="json">
{`{
  "model": "claude-sonnet-4-6-20250514",
  "max_tokens": 1024,
  "tools": [
    {
      "name": "code_review",
      "description": "Submit a structured code review with findings",
      "input_schema": {
        "type": "object",
        "properties": {
          "summary": {
            "type": "string",
            "description": "One-line summary of the review"
          },
          "findings": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "severity": {
                  "type": "string",
                  "enum": ["critical", "suggestion", "looks_good"]
                },
                "line": { "type": "integer" },
                "message": { "type": "string" },
                "fix": { "type": "string" }
              },
              "required": ["severity", "line", "message"]
            }
          }
        },
        "required": ["summary", "findings"]
      }
    }
  ],
  "tool_choice": { "type": "tool", "name": "code_review" },
  "messages": [
    {
      "role": "user",
      "content": "Review this pull request: ..."
    }
  ]
}`}
        </CodeBlock>

        <p>
          By forcing the model to respond through a tool with a defined schema, you
          get guaranteed structure. No regex parsing, no "sometimes it returns markdown
          and sometimes it doesn't." Every response has a severity, a line number,
          and a message. Your downstream code can rely on it.
        </p>
      </Section>

      {/* 2 — Claude as a Pair Programmer */}
      <Section id="pair-programmer" number={2} title="Claude as a Pair Programmer">
        <p>
          I use Claude Code daily as a force multiplier. Not as a replacement for
          thinking — as a tool that handles the grunt work while I focus on
          architecture and decisions. The key is having a tight feedback loop:
          Claude writes, I review, we iterate. Never blind acceptance.
        </p>
        <p>
          <code className="text-cyan-400">CLAUDE.md</code> files are the foundation.
          They're project-level instructions that persist across sessions — like a
          .env for AI context. Instead of re-explaining your stack, conventions, and
          preferences every conversation, you write them once and Claude picks them
          up automatically.
        </p>

        <CodeBlock title="CLAUDE.md — project-level instructions" language="plain">
{`# Project: BillingService

## Stack
- Ruby 3.2, Rails 7.1, PostgreSQL 15, Sidekiq 7
- RSpec for testing, FactoryBot for fixtures
- Deployed on AWS ECS with Terraform

## Conventions
- Service objects in app/services/ with execute! pattern
- All money in cents (integer), never floats
- Background jobs are idempotent — always check before acting
- Use strong_migrations gem — no unsafe migrations

## Testing
- Run: bundle exec rspec
- Integration specs > unit specs for service objects
- Use VCR for external API calls, never hit real endpoints

## Don't
- Never use callbacks for business logic
- Never commit .env files or credentials
- Never use raw SQL in controllers`}
        </CodeBlock>

        <p>
          Plan mode is another game-changer. Instead of jumping straight into
          code, you tell Claude to explore the codebase first, understand the
          architecture, then propose a plan before writing anything. It's
          the difference between a junior dev who starts coding immediately and a
          senior who reads the code first.
        </p>

        <CodeBlock title="workflow: task → plan → implement → review" language="plain">
{`# 1. Task: "Add rate limiting to the API"

# 2. Plan mode — Claude explores first
> Reading app/controllers/application_controller.rb...
> Reading config/routes.rb...
> Found existing middleware in config/application.rb...

Plan:
- Add rack-attack gem for rate limiting
- Configure in config/initializers/rack_attack.rb
- Throttle: 60 req/min per IP for API endpoints
- Safelist internal health checks
- Add custom response with Retry-After header
- Add specs for throttle behavior

# 3. You review the plan, adjust, approve
"Looks good, but use 100 req/min and add Redis-backed
 store instead of memory cache."

# 4. Claude implements with your constraints
# 5. You review the code, iterate if needed`}
        </CodeBlock>

        <p>
          <strong>Skills</strong> let you define reusable slash commands that
          expand into full prompts. Instead of typing the same instructions
          over and over, you define a skill once and invoke it with a shortcut.
          Keep them focused — one skill, one job.
        </p>

        <CodeBlock title="skills — reusable slash commands" language="plain">
{`# .claude/skills/review-pr.md
---
name: review-pr
description: Review a pull request for correctness and style
---

Review the current branch's changes against main. Focus on:
- Correctness: does the logic actually work?
- Performance: any N+1 queries, missing indexes, expensive loops?
- Security: SQL injection, XSS, mass assignment?
- Style: does it follow project conventions in CLAUDE.md?

Output a structured review with severity levels.
Do NOT nitpick formatting or suggest cosmetic changes.

# Usage: just type /review-pr in Claude Code`}
        </CodeBlock>

        <p>
          <strong>Memory management</strong> is critical for keeping Claude effective
          across sessions. The auto-memory system stores notes in{' '}
          <code className="text-cyan-400">~/.claude/projects/</code> — but if you don't
          curate it, it fills up with redundant context that wastes tokens and confuses
          the model. Treat it like code: review, prune, organize.
        </p>

        <CodeBlock title="memory best practices" language="plain">
{`# MEMORY.md — keep it under 200 lines, concise
# Think of it as a cheat sheet, not a journal

# Good — stable facts, organized by topic
## Project Stack
- Rails 7.1, Ruby 3.2, PostgreSQL 15
- Deployed on AWS ECS via Terraform

## Conventions
- Service objects use execute! pattern
- Money stored as integer cents

## User Preferences
- Always use RSpec, never Minitest
- Prefer explicit over magic

# Bad — session-specific noise, redundant info
## Session 2024-01-15
- User asked about fixing the login bug
- Looked at users_controller.rb
- Found the issue was in line 42
# ^^^ This is garbage — it'll never be useful again

# Separate topic files for detailed notes:
# memory/debugging.md — recurring debugging patterns
# memory/architecture.md — key architectural decisions
# Link from MEMORY.md: "See [debugging.md](debugging.md)"`}
        </CodeBlock>

        <p>
          <strong>Sub-agents</strong> are how you scale Claude's context window.
          Instead of cramming everything into one conversation, you spin up
          specialized agents that research specific questions and report back.
          The main conversation stays focused while sub-agents go deep.
        </p>

        <CodeBlock title="sub-agents for deeper context" language="plain">
{`# In Claude Code, sub-agents run as Task tools with specialized types:

# Explore agent — fast codebase search
"Find all API endpoints that handle authentication"
→ Searches files, reads code, returns a summary
→ Main context stays clean

# General-purpose agent — deep research
"Investigate why the billing job fails on the 31st of the month"
→ Reads logs, traces code paths, checks edge cases
→ Returns findings without polluting main context

# Plan agent — architecture design
"Design the database schema for a multi-tenant billing system"
→ Explores existing models, considers trade-offs
→ Returns a structured proposal

# Key insight: sub-agents get their OWN context window.
# Use them when you need to:
# - Search across many files without cluttering your conversation
# - Investigate a rabbit hole without losing your main thread
# - Run multiple research tasks in parallel`}
        </CodeBlock>

        <p>
          The pattern I follow: start with a clear <code className="text-cyan-400">CLAUDE.md</code>,
          use plan mode for anything non-trivial, define skills for repeated workflows,
          keep memory lean, and spin up sub-agents when you need to go deep without
          losing context. Claude writes the code — I make the decisions.
        </p>
      </Section>

      {/* 3 — Tool Use & Agentic Patterns */}
      <Section id="tool-use" number={3} title="Tool Use & Agentic Patterns">
        <p>
          The real power of Claude isn't chat — it's giving the model tools. APIs,
          database lookups, file operations, shell commands. You define what tools
          are available, and the model decides when to call them. This is the
          orchestration pattern, and it's how you build AI that actually <em>does</em> things.
        </p>

        <CodeBlock title="tool definition" language="json">
{`{
  "name": "lookup_customer",
  "description": "Look up a customer by email or ID. Returns customer details including subscription status, plan, and recent invoices.",
  "input_schema": {
    "type": "object",
    "properties": {
      "email": {
        "type": "string",
        "description": "Customer email address"
      },
      "customer_id": {
        "type": "string",
        "description": "Internal customer ID (cus_xxx)"
      }
    }
  }
}`}
        </CodeBlock>

        <p>
          The orchestration loop is simple: send a message, check if the model wants
          to use a tool, execute the tool, feed the result back. The model keeps
          going until it has enough information to give a final answer. You're not
          writing if/else chains — the model figures out what it needs.
        </p>

        <CodeBlock title="orchestration loop" language="python">
{`import anthropic

client = anthropic.Anthropic()
tools = [lookup_customer_tool, check_invoice_tool, issue_refund_tool]

def run_agent(user_message):
    messages = [{"role": "user", "content": user_message}]

    while True:
        response = client.messages.create(
            model="claude-sonnet-4-6-20250514",
            max_tokens=4096,
            tools=tools,
            messages=messages,
        )

        # If the model is done, return the text
        if response.stop_reason == "end_turn":
            return extract_text(response)

        # If the model wants to use a tool, execute it
        if response.stop_reason == "tool_use":
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = execute_tool(block.name, block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(result),
                    })

            # Feed results back — model decides next step
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})`}
        </CodeBlock>

        <p>
          For more complex workflows, you build agentic loops — the model iterates
          until a problem is solved, with human-in-the-loop checkpoints for safety.
          This is where permission boundaries matter. You don't give an agent
          unrestricted access to production — you define what it can do, what
          requires approval, and what's off-limits entirely.
        </p>

        <CodeBlock title="multi-step agent with safety boundaries" language="python">
{`class SupportAgent:
    """Agent that handles customer support with safety boundaries."""

    # Tools the agent can use freely
    safe_tools = ["lookup_customer", "check_invoice", "search_docs"]

    # Tools that require human approval
    restricted_tools = ["issue_refund", "cancel_subscription"]

    # Tools that are never available
    blocked_tools = ["delete_account", "modify_billing"]

    def handle_ticket(self, ticket):
        messages = self.build_context(ticket)

        for step in range(self.max_steps):
            response = self.client.messages.create(
                model="claude-sonnet-4-6-20250514",
                system=self.system_prompt,
                tools=self.available_tools,
                messages=messages,
            )

            if response.stop_reason == "end_turn":
                return self.format_response(response)

            for block in response.content:
                if block.type != "tool_use":
                    continue

                # Safety check: is this tool restricted?
                if block.name in self.restricted_tools:
                    approved = self.request_human_approval(
                        tool=block.name,
                        params=block.input,
                        context=ticket,
                    )
                    if not approved:
                        messages = self.add_denial(messages, block)
                        continue

                result = self.execute_tool(block.name, block.input)
                messages = self.add_result(messages, response, block, result)

        return "Max steps reached — escalating to human agent."`}
        </CodeBlock>

        <p>
          The key principles: define clear tool boundaries, always have a human
          checkpoint for destructive actions, set a max iteration limit so agents
          can't loop forever, and log everything. An agent that can issue refunds
          without approval isn't a feature — it's a liability.
        </p>
        <p>
          This is where AI in production gets real. Not chatbots — agents that
          look up data, make decisions, take actions, and know when to ask a human.
          The orchestration is simple. The safety boundaries are what make it
          production-ready.
        </p>
      </Section>
    </ContentPage>
  )
}

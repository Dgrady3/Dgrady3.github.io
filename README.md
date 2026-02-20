# joegrady.dev

Personal portfolio and engineering blog. Dark theme, IDE aesthetic, scroll-triggered animations.

**Live:** [dgrady3.github.io](https://dgrady3.github.io)

## Stack

- React 19 + Vite
- Tailwind CSS 4
- Framer Motion
- Prism (syntax-highlighted code blocks)
- GitHub Pages

## Content Pages

| Page | Route | Description |
|------|-------|-------------|
| How I Rails | `/rails` | Battle-tested Rails patterns from 10+ years of production |
| How I Claude | `/claude` | AI as a force multiplier — prompt design, agentic workflows |
| Sidekiq at Scale | `/sidekiq` | Queue design, idempotency, fan-out, monitoring, memory tuning |

## Local Development

```bash
nvm use 20
npm install
npm run dev
```

## Build & Deploy

Pushes to `main` deploy automatically via GitHub Pages.

```bash
npm run build   # outputs to dist/
```

## Project Structure

```
src/
  components/   # Nav, Hero, About, Skills, Projects, Experience, Contact
  pages/        # Rails, Claude, Sidekiq (content pages)
  lib/          # Prism language extensions
```

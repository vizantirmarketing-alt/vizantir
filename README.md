# Vizantir Design Studio — Web Property

Source code for [vizantir.com](https://www.vizantir.com), a premium web design studio based in Las Vegas. Built with Next.js, TypeScript, Tailwind CSS, and Sanity CMS.

This repository is published for portfolio and reference purposes. See [LICENSE](./LICENSE) for usage terms.

---

## Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| CMS | Sanity v4 (Studio at `/studio`) |
| Hosting | Vercel |
| Database | Supabase (Postgres) |
| Transactional email | Resend |
| Bot protection | Cloudflare Turnstile |
| Analytics | Vercel Analytics |
| AI concierge | Anthropic Claude (via SDK) |
| Animation | Framer Motion |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (pinned via `corepack`)

### Install

```bash
git clone https://github.com/vizantirmarketing-alt/vizantir.git
cd vizantir
pnpm install
```

### Environment

Copy `.env.example` to `.env.local` and fill in all required values. The dev server reads env vars only on boot — restart after any change.

```bash
cp .env.example .env.local
```

### Run

```bash
pnpm dev
```

The site runs at [http://localhost:3000](http://localhost:3000). Sanity Studio runs at [http://localhost:3000/studio](http://localhost:3000/studio) and requires authentication.

---

## Project Structure

```
app/                  # Next.js App Router pages and API routes
components/           # Reusable UI components
data/                 # Typed data exports (pricing, navigation, page content)
docs/                 # Standards and reference implementations
lib/                  # Utilities, schema, Sanity queries, chat knowledge
public/               # Static assets
sanity/               # Sanity schema types and structure
scripts/              # Operational scripts
supabase/             # SQL migrations
```

---

## Architecture

### Content management

The site is fully ISR-driven. Sanity changes appear on the live site within seconds via on-demand revalidation:

1. Editor publishes a change in Sanity Studio
2. Sanity fires a webhook to `POST /api/revalidate`
3. The route validates the signature and calls `revalidateTag` for the affected document type
4. Next.js invalidates cached `sanityFetch` queries tagged with that type
5. Next request fetches fresh content

Cache tags match Sanity document types (e.g., `tags: ['faq']`, `tags: ['post', 'author']`). Webhook receiver: `app/api/revalidate/route.ts`.

### AI Concierge

A Claude-powered chat widget answers visitor questions about the studio — services, pricing, process, and fit. Implementation:

| Piece | Path | Role |
|---|---|---|
| Widget | `components/chat/VizantirChat.tsx` | Client component, mounted globally |
| API route | `app/api/chat/route.ts` | Streaming POST endpoint, rate-limited |
| Knowledge | `lib/chat/knowledge.ts` | Assembles knowledge base, cached 30 min |
| Queries | `lib/sanity/queries.ts` | GROQ queries for chat content |

**Knowledge sources:**
- **Sanity-driven** (services, case studies, FAQs, founder bio, studio overview) — edit in Studio, no deploy
- **Code-driven** (pricing, about, fit criteria, how-we-work) — edit `data/*.ts`, commit, deploy

The 30-minute knowledge cache means Sanity edits reach the bot within half an hour; code edits require a redeploy.

### Pricing

Single source of truth: `data/pricing.ts`. All consumers (services page, industry pages, contact form, AI concierge, sitemap) read from this file. Sanity FAQ pricing references are synced separately via `pnpm update:faq-pricing -- --execute` after pricing changes.

### Form protection

All public forms follow the protection standard documented at `docs/standards/form-protection.md`. The standard includes honeypot, Cloudflare Turnstile, IP-hashed rate limiting, email validation, Supabase storage, and Resend notifications. Reference implementations live in `docs/standards/form-protection-reference/`.

### Database

Schema lives in `supabase/migrations/`. Apply to a new Supabase project by pasting SQL into the SQL Editor in order.

---

## Scripts

Write-capable scripts require `SANITY_API_WRITE_TOKEN` in `.env.local`.

| Command | Description |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run production build locally |
| `pnpm lint` | Lint check |
| `pnpm analyze` | Build with bundle analyzer |
| `pnpm update:posts` | Dry run: blog post updates from `content-updates/` |
| `pnpm update:posts:live` | Apply blog post updates to Sanity |
| `pnpm update:faq-pricing` | Dry run: sync Sanity FAQ pricing from `data/pricing.ts` |
| `pnpm update:faq-pricing -- --execute` | Apply pricing sync to Sanity |
| `pnpm update-faq-industries` | Dry run: update Sanity FAQ industry copy |
| `pnpm update-faq-industries -- --execute` | Apply industry copy update |
| `pnpm migrate:faqs` | Dry run: one-time FAQ document seed migration |
| `pnpm migrate:faqs:live` | Apply FAQ seed migration |
| `pnpm create:gei` | Create Golden Era Integra case study (idempotent) |
| `pnpm create:post` | Create a new blog post in Sanity |

Inspect the AI chat knowledge blob:

```bash
node --env-file=.env.local --import tsx scripts/dump-knowledge.ts
```

---

## Content Updates

### Blog posts

Drop files in `content-updates/` named by post slug:
- `<slug>.html` — replaces the `body` field (Portable Text) with HTML converted to block format
- `<slug>.json` — updates simple fields (`excerpt`, `title`, `readTime`, `metaTitle`, `metaDescription`)

Run `pnpm update:posts` for a dry run, then `pnpm update:posts:live` to apply. The `content-updates/` folder is gitignored. Clean up after a successful run.

### Other Sanity content

Edit directly in Studio at `/studio`. Changes propagate via the revalidation webhook within seconds.

---

## Deployment

Deployed automatically to Vercel on push to `main`. Environment variables must be configured in the Vercel project settings — `.env.local` is not deployed. Code changes require a redeploy; Sanity content changes use the revalidation path.

---

## Conventions

- Commit per file: `git add <file>` then commit. Never `git add .` for shared work.
- Never chain git commands with `&&`.
- Client-facing copy must read as human-written — see internal style guidance in `docs/`.
- Form protection standard at `docs/standards/form-protection.md` applies to every public-facing form added to the codebase.

---

## License

This source code is provided for portfolio review and reference only. See [LICENSE](./LICENSE) for full terms.

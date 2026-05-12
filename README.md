# Vizantir Design Studio

Premium website design studio based in Las Vegas. Built with Next.js, TypeScript, Tailwind CSS, and Sanity CMS.

**Live site:** https://www.vizantir.com

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **CMS:** Sanity v3 (Studio at `/studio`)
- **Animations:** Framer Motion
- **Hosting:** Vercel
- **Database:** Supabase (Postgres) — form submissions, rate limiting
- **Bot protection:** Cloudflare Turnstile
- **Transactional email:** Resend
- **Analytics:** Google Analytics 4, Vercel Analytics

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/vizantirmarketing-alt/vizantir.git
cd vizantir
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the project root:

```env
# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
SANITY_API_WRITE_TOKEN=your_write_token
SANITY_REVALIDATE_SECRET=your_revalidate_secret

# Site
NEXT_PUBLIC_SITE_URL=https://www.vizantir.com

# Analytics
NEXT_PUBLIC_GA_ID=your_ga4_measurement_id

# Supabase (form submissions, rate limiting)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cloudflare Turnstile (bot protection on public forms)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# Rate limiting (generate with: openssl rand -hex 32)
RATE_LIMIT_SALT=

# Resend (contact form notifications)
RESEND_API_KEY=
RESEND_FROM_EMAIL=info@vizantir.com
CONTACT_NOTIFICATION_EMAIL=info@vizantir.com
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### 5. Access Sanity Studio

Studio runs at [http://localhost:3000/studio](http://localhost:3000/studio). You will need to be logged into the correct Sanity account with access to the project.

---

## Project Structure

```
app/                  # Next.js App Router pages
components/           # Reusable UI components
content-updates/      # Drafts for batch content updates (gitignored)
docs/                 # Standards and reference implementations
lib/                  # Utilities, schema types, Sanity queries
sanity/               # Sanity schema types and structure
scripts/              # One-off and reusable operational scripts
supabase/             # SQL migrations
public/               # Static assets
```

---

## Deployment

Deployed automatically to Vercel on push to `main`. Environment variables must be configured in the Vercel project settings — `.env.local` is not committed to the repo.

---

## Key Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage |
| `/about` | About page |
| `/services` | Services and pricing |
| `/case-studies` | Portfolio / case studies |
| `/blog` | Blog listing and posts |
| `/contact` | Contact form (protected) |
| `/las-vegas-web-design` | Local SEO landing page |
| `/hospitality-web-design` | Vertical landing page |
| `/law-firm-web-design` | Vertical landing page |
| `/commercial-real-estate-web-design` | Vertical landing page |
| `/studio` | Sanity Studio (authenticated) |

---

## Content Updates (Blog Posts)

Blog content lives entirely in Sanity. Most edits should be done directly in Studio at `/studio`.

For batch updates (rewriting multiple posts at once, or updating the same field across many documents), use the `update-blog-posts` script.

### How it works

Drop files into `content-updates/` named after the post slug:

- `content-updates/<slug>.html` — replaces the `body` field (Portable Text) with HTML converted to Sanity's block format. Preserves `<pre><code>` blocks with language detection.
- `content-updates/<slug>.json` — updates one or more simple fields without touching the body. Supported fields: `excerpt`, `title`, `readTime`, `metaTitle`, `metaDescription`.

Example `content-updates/my-post.json`:

```json
{
  "excerpt": "Updated excerpt text that will overwrite the current one."
}
```

### Running the script

```bash
# Dry run — shows what would change without writing
npm run update:posts

# Live — writes changes to Sanity
npm run update:posts:live
```

Requires `SANITY_API_WRITE_TOKEN` in `.env.local`.

The `content-updates/` folder is gitignored. Clean up drafts after a successful live run:

```bash
rm content-updates/*.html
rm content-updates/*.json
```

---

## Content Revalidation

This site uses on-demand ISR (Incremental Static Regeneration) so that content updates in Sanity Studio appear on the live site within seconds — no redeploy required.

### How it works

1. Editor publishes a change in Sanity Studio (`/studio`)
2. Sanity fires a webhook to `POST /api/revalidate`
3. The route validates the request signature using `SANITY_REVALIDATE_SECRET` and calls `revalidateTag(_type, 'max')` for the affected document type
4. Next.js invalidates the cache for any `sanityFetch` queries tagged with that document type
5. The next request to the live site fetches fresh content from Sanity

### Cache tagging

All `sanityFetch` calls in the codebase pass cache tags matching the Sanity `_type` they query (e.g. `tags: ['faq']`, `tags: ['post', 'author']`). This is what enables targeted invalidation on publish.

### Configuration

- **Webhook receiver:** `app/api/revalidate/route.ts`
- **Secret:** `SANITY_REVALIDATE_SECRET` (must match the `Secret` field in the Sanity webhook config at sanity.io/manage)
- **Webhook URL:** `https://www.vizantir.com/api/revalidate`
- **Sanity webhook projection:** `{ _type, "slug": slug.current }`

### When to redeploy

Code changes still require a redeploy. Only Sanity content changes use the revalidation path. Adding new env vars, schema changes, or component updates → push to `main` and let Vercel rebuild.

---

## Form Protection

All public forms on this site follow the Vizantir form protection standard. The contact form at `/contact` implements honeypot, Cloudflare Turnstile, IP-hashed rate limiting, and email validation, with submissions stored in Supabase and notifications sent via Resend.

For the full standard and reference implementations of other form types, see:

- `docs/standards/form-protection.md` — the standard
- `docs/standards/form-protection-reference/` — working reference implementations

When applying form protection to a new project (Vizantir client work, etc.), copy from the reference and adapt — do not write protection from scratch.

---

## Database (Supabase)

Database schema lives in `supabase/migrations/`. To apply migrations to a new Supabase project, paste the SQL into the Supabase SQL Editor and run.

Required setup for any new Supabase project hosting Vizantir forms:
- Run all files in `supabase/migrations/` in order
- Verify tables exist via Table Editor
- Confirm `service_role` has explicit GRANTs on form tables (some Supabase projects require this if "Automatically expose new tables" was disabled at project creation — see `docs/standards/form-protection.md` for details)

---

## Notes

- Blog content lives in Sanity CMS; edit posts in Studio at `/studio`
- Services display order on `/services` is controlled by the `order` field on each `service` document in Sanity Studio
- Schema markup lives in `lib/schema/index.ts` and `app/layout.tsx`
- Blog posts render Portable Text via the shared component at `components/portable-text.tsx`
- Blog categories are defined in `lib/blog-categories.ts`
- Commit workflow: `git add .` → `git commit -m "..."` → `git push`
- Never chain git commands with `&&`
- Form protection standard documented at `docs/standards/form-protection.md`. Apply when adding any public-facing form.

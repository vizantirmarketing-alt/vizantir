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
- **Analytics:** Google Analytics 4, Microsoft Clarity

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
SANITY_WEBHOOK_SECRET=your_webhook_secret

# Site
NEXT_PUBLIC_SITE_URL=https://www.vizantir.com

# Analytics
NEXT_PUBLIC_GA_ID=your_ga4_measurement_id
NEXT_PUBLIC_CLARITY_ID=your_clarity_id
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
lib/                  # Utilities, schema types, Sanity queries
sanity/               # Sanity schema types and structure
scripts/              # One-off and reusable operational scripts
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

## Notes

- Blog content lives in Sanity CMS; edit posts in Studio at `/studio`
- Services display order on `/services` is controlled by the `order` field on each `service` document in Sanity Studio
- Schema markup lives in `lib/schema/index.ts` and `app/layout.tsx`
- Blog posts render Portable Text via the shared component at `components/portable-text.tsx`
- Blog categories are defined in `lib/blog-categories.ts`
- Commit workflow: `git add .` → `git commit -m "..."` → `git push`
- Never chain git commands with `&&`

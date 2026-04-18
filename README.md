# Vizantir Design Studio

Premium website design studio based in Las Vegas. Built with Next.js, TypeScript, Tailwind CSS, and Sanity CMS.

**Live site:** https://www.vizantir.com

---

## Tech Stack

- **Framework:** Next.js (App Router)
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
app/                  # Next.js App Router pages
components/           # Reusable UI components
lib/                  # Utilities, schema, Sanity queries
sanity/               # Sanity schema types and structure
public/               # Static assets

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

## Notes

- Blog content lives in Sanity CMS; edit posts in Studio at `/studio`
- Services display order on `/services` is controlled by the `order` field on each `service` document in Sanity Studio
- Schema markup lives in `lib/schema/index.ts` and `app/layout.tsx`
- Commit workflow: `git add .` → `git commit -m "..."` → `git push`
- Never chain git commands with `&&`

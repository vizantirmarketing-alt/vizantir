export type Technology = {
  slug: string
  name: string
  keyword: string
  tagline: string
  description: string
  intro: string
  whyWeUseIt: string[]
  businessOutcome: string
}

export const SITE_URL = 'https://www.vizantir.com'
export const BUSINESS_ID = `${SITE_URL}/#business`

export const AREA_SERVED = [
  { '@type': 'City', name: 'Las Vegas' },
  { '@type': 'City', name: 'Henderson' },
  { '@type': 'City', name: 'Summerlin' },
  { '@type': 'City', name: 'Paradise' },
  { '@type': 'State', name: 'Nevada' },
  { '@type': 'Country', name: 'United States' },
] as const

export const TECHNOLOGIES: Technology[] = [
  {
    slug: 'nextjs',
    name: 'Next.js',
    keyword: 'Next.js development',
    tagline: 'The framework we build every Vizantir site on.',
    description:
      'Vizantir builds custom Next.js websites for established businesses in Las Vegas and nationwide. React-based, server-rendered, fast on every device.',
    intro:
      "Next.js is the React framework we standardize every Vizantir build on. Every site we ship — from a small studio brand to a multi-location operation — runs on the same modern foundation. We chose it because it solves the problems that hold most websites back: slow page loads, fragile plugin dependencies, and a CMS that gets in the editor's way.",
    whyWeUseIt: [
      'Server-side rendering and edge caching mean pages load fast on every device, including older phones on weak connections.',
      'No plugin ecosystem to maintain. Every line of code in your site is intentional and updateable without breaking other features.',
      'Modern React patterns let us build interactions that feel premium without bloating page weight.',
      'Deploys instantly via Vercel — content updates and code changes go live in under a minute.',
    ],
    businessOutcome:
      "A Next.js site loads in under a second on most connections. Search engines reward that with better rankings. Visitors reward it by sticking around. Your team rewards it by having a site that doesn't require an emergency phone call every time WordPress pushes a security update. Next.js isn't a feature — it's the foundation that lets every other decision in the project compound.",
  },
  {
    slug: 'sanity',
    name: 'Sanity',
    keyword: 'Sanity CMS development',
    tagline: 'The content system your team will actually use.',
    description:
      'Vizantir integrates Sanity CMS into custom Next.js builds, giving operators a clean editor without WordPress overhead.',
    intro:
      'Sanity is the content management system we pair with every Next.js build. It separates editorial from engineering: your team edits text, images, and structured content in a clean interface, while the frontend stays fast, custom, and free of plugin risk.',
    whyWeUseIt: [
      'Editors get a focused workspace built around your content model — not a 90-extension WordPress dashboard.',
      'Structured content fields prevent inconsistent formatting across pages.',
      "Content updates publish in seconds via Sanity's real-time API, no rebuild required for most changes.",
      'Schema lives in code, so we version-control content structure the same way we version code.',
    ],
    businessOutcome:
      'Most CMSs fight the people using them. Sanity respects them. Your editor opens a clean interface, makes a change, hits publish, and the site updates. No plugin conflicts, no theme update breaking the layout, no calling the developer for a typo fix. That difference compounds over years of running a business.',
  },
  {
    slug: 'vercel',
    name: 'Vercel',
    keyword: 'Vercel hosting and deployment',
    tagline: 'The hosting that makes a fast site possible.',
    description:
      'Vizantir deploys every site to Vercel — global edge network, zero-config Next.js hosting, instant rollbacks.',
    intro:
      'Vercel is where every Vizantir site lives. Built by the team behind Next.js, it handles deployment, hosting, edge caching, and image optimization automatically. We chose it because it removes an entire category of operational complexity from your business.',
    whyWeUseIt: [
      'Every deploy gets a preview URL — clients review changes before anything goes live.',
      'Global edge network serves your site from the nearest data center to each visitor.',
      'Automatic image optimization, font loading, and asset compression with no configuration.',
      'Rollback to any previous version in a single click if something breaks.',
    ],
    businessOutcome:
      'Hosting decisions used to be a quarterly headache. With Vercel, they stop being a topic. The site is fast in Tokyo and Toronto, fonts load instantly, images compress automatically, and if a deploy ever goes sideways the rollback is one click. You stop thinking about hosting and start thinking about your business.',
  },
  {
    slug: 'supabase',
    name: 'Supabase',
    keyword: 'Supabase development',
    tagline: 'The database for sites that do more than show information.',
    description:
      'Vizantir uses Supabase for projects that need auth, real-time data, or structured user features on top of a marketing site.',
    intro:
      "Supabase is the database layer we use when a Vizantir build needs to do more than display content. Authentication, customer portals, gated resources, internal dashboards — anything that involves storing or retrieving structured data over time. It's an open-source Postgres platform with the kind of developer ergonomics that make a custom feature take days instead of weeks.",
    whyWeUseIt: [
      'Postgres under the hood — proven, well-understood, no vendor lock-in.',
      'Row-level security policies let us enforce who sees what at the database layer.',
      'Real-time subscriptions enable live-updating UIs for things like dashboards and notifications.',
      'Auth handles login, email verification, OAuth, and password resets out of the box.',
    ],
    businessOutcome:
      "Most websites stop at \"here's information.\" Supabase is what lets a Vizantir site become something more — a client portal, a member directory, a booking system, an internal tool. We bring it in when the project calls for it, not by default. When it's needed, it cuts custom backend work by 80%.",
  },
  {
    slug: 'stripe',
    name: 'Stripe',
    keyword: 'Stripe integration for websites',
    tagline: 'Payments without the platform tax.',
    description:
      'Vizantir integrates Stripe for websites that need to accept payments — subscriptions, one-time charges, customer portals.',
    intro:
      'Stripe is how we handle payments on Vizantir builds. Whether the project needs a single one-time charge, a recurring subscription, a checkout flow, or a customer self-service portal, Stripe handles it cleanly. Direct integration means no platform fees on top of card processing, no third-party checkout redirecting your customer away from your brand.',
    whyWeUseIt: [
      'Direct API integration — no SaaS storefront sitting between you and your customer.',
      'Customer Portal handles billing, invoices, and subscription management without us building custom UI.',
      'Webhooks reliably notify your systems when payments succeed, fail, or refund.',
      'Test and live environments separate cleanly so we never risk real charges in development.',
    ],
    businessOutcome:
      "Most websites that accept payments use Shopify or a similar platform — which means a monthly fee, transaction percentages, design constraints, and a checkout that doesn't feel like your brand. Stripe lets us build payments directly into the site we already designed for you. Your checkout stays on your domain. Your branding stays consistent. Your margins stay yours.",
  },
  {
    slug: 'tailwind',
    name: 'Tailwind CSS',
    keyword: 'Tailwind CSS custom design',
    tagline: 'The styling system behind every pixel of a Vizantir site.',
    description:
      'Vizantir uses Tailwind CSS to build custom-designed sites with no theme dependencies and maximum performance.',
    intro:
      "Tailwind CSS is the styling foundation under every Vizantir build. It's a utility-first CSS framework that lets us implement custom designs without writing brittle stylesheets or fighting a theme. Every visual decision on your site is intentional and lives in code, not in a theme settings panel.",
    whyWeUseIt: [
      'No pre-built theme components — your site looks like your brand, not like a Tailwind template.',
      'Production builds ship only the CSS your site actually uses, often under 20KB total.',
      'Design tokens (colors, spacing, typography) defined once and reused everywhere — consistent across pages without effort.',
      'Easier to maintain than handwritten CSS — every style is co-located with the component it styles.',
    ],
    businessOutcome:
      "You've seen websites built on the same theme, in the same template, with the same hero section, the same three-column layout. Tailwind is what lets us avoid that completely. Your site's visual language is built specifically for your brand and your business — and the technical foundation supporting it is faster than almost every theme-based site on the internet.",
  },
]

export function getTechnologyBySlug(slug: string): Technology | undefined {
  return TECHNOLOGIES.find((tech) => tech.slug === slug)
}

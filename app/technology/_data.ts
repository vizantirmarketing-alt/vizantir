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

export const CORE_STACK: Technology[] = [
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
  {
    slug: 'typescript',
    name: 'TypeScript',
    keyword: 'TypeScript development',
    tagline: 'The language layer that keeps every Vizantir build maintainable.',
    description:
      'Vizantir builds every site in TypeScript — typed JavaScript that catches bugs before they ship and keeps the codebase readable as it grows.',
    intro:
      'TypeScript is JavaScript with a type system layered on top. Every Vizantir build uses it from day one. The reason is simple: types catch the bugs you would have shipped, document the code as you write it, and make every future change safer than the last.',
    whyWeUseIt: [
      'Catches type errors at build time instead of in production when a real visitor hits them.',
      'Self-documents the code — every function signature and component prop shows exactly what data it expects.',
      'IDE autocomplete becomes accurate, speeding up every change we make to your site.',
      'When we hand the codebase off to your team or a future developer, the types make onboarding dramatically faster.',
    ],
    businessOutcome:
      "A site written in plain JavaScript ages poorly. A site written in TypeScript ages well — every refactor is safer, every new feature integrates more cleanly, every developer who touches the code afterward moves faster. You don't see TypeScript directly, but you see the result: a site that doesn't break when we add to it.",
  },
  {
    slug: 'react',
    name: 'React',
    keyword: 'React development',
    tagline: 'The component library every modern web experience is built on.',
    description:
      'Vizantir builds custom React applications and component-driven websites that scale cleanly from marketing pages to interactive platforms.',
    intro:
      "React is the JavaScript library that powers the interactive layer of every Vizantir build. It's the foundation underneath Next.js — components, state, and the way modern web interfaces are structured. We chose React because it's the most production-tested UI framework in the industry, with the deepest ecosystem of available patterns and the broadest pool of developers if you ever need to bring more in.",
    whyWeUseIt: [
      'Component architecture means every piece of the site is reusable, testable, and isolated.',
      'Massive ecosystem — almost any third-party functionality (calendars, charts, forms) has a battle-tested React integration available.',
      "Long-term stability — React has been the industry default for over a decade and isn't going anywhere.",
      'Developer pool — if you ever need to hire your own team to maintain or extend the site, React developers are easy to find.',
    ],
    businessOutcome:
      'When you build on React, you build on the same foundation as most of the web — including companies like Netflix, Airbnb, and Shopify. That matters because it means your site never becomes orphaned technology. The patterns we use today will still make sense to a developer you hire three years from now.',
  },
]

export const SPECIALIZED_TOOLS: Technology[] = [
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
    slug: 'resend',
    name: 'Resend',
    keyword: 'Resend email integration',
    tagline: 'Transactional email that arrives, looks right, and stays out of spam.',
    description:
      'Vizantir integrates Resend for transactional email — contact forms, password resets, order confirmations, and anything else your site needs to send.',
    intro:
      "Resend is the email infrastructure we use when a Vizantir build needs to send transactional email — contact form submissions, welcome emails, password resets, order confirmations. It's a modern email platform built by developers who got tired of the legacy options. The reason we use it: emails actually arrive, deliverability is genuinely good, and the developer experience cuts integration time from days to hours.",
    whyWeUseIt: [
      'Industry-leading deliverability — DKIM, SPF, and DMARC are configured by default, so your emails land in inboxes instead of spam folders.',
      'React-based email templates — we design email content with the same component patterns as your website, ensuring brand consistency.',
      'Built-in analytics show which emails open, click, or bounce.',
      'Pricing scales reasonably with volume, unlike legacy ESPs that charge premium rates for low-volume transactional needs.',
    ],
    businessOutcome:
      "Most websites that send email are doing it wrong — using Gmail SMTP, getting flagged as spam, losing leads that never knew the contact form went through. Resend means every email your site sends actually arrives. That's the difference between a contact form that generates inquiries and a contact form that quietly drops 30% of them into spam folders.",
  },
  {
    slug: 'cloudflare',
    name: 'Cloudflare',
    keyword: 'Cloudflare CDN and security',
    tagline: 'The network layer protecting and accelerating your site.',
    description:
      'Vizantir uses Cloudflare for DNS, DDoS protection, bot mitigation, and edge caching — paired with Vercel hosting for the strongest possible network setup.',
    intro:
      'Cloudflare sits in front of every Vizantir build that needs serious DNS, security, and edge network capabilities. We pair it with Vercel hosting — Cloudflare handles DNS, DDoS protection, bot filtering, and global CDN caching, while Vercel handles application hosting. The combination is the strongest network setup available to a modern website.',
    whyWeUseIt: [
      'Best-in-class DDoS protection — your site stays online during attack volumes that would take down typical hosting.',
      'Bot management filters out scrapers and credential-stuffing attempts before they reach your site.',
      'Global edge network with hundreds of locations means low-latency responses worldwide.',
      'DNS management with sub-second propagation and detailed analytics on every query.',
    ],
    businessOutcome:
      "Most sites don't think about network-layer security until something goes wrong — a DDoS, a credential-stuffing attack, a sudden traffic spike. By then it's too late. Cloudflare in front of your site means these problems are handled before they ever reach your application. You don't notice it working, which is exactly the point.",
  },
  {
    slug: 'gsap',
    name: 'GSAP',
    keyword: 'GSAP animation development',
    tagline: 'The animation engine behind premium web experiences.',
    description:
      'Vizantir uses GSAP (GreenSock Animation Platform) for premium scroll-triggered animations, complex sequencing, and SVG choreography.',
    intro:
      "GSAP is the animation library we reach for when a Vizantir build needs animation that competes with native app experiences. Scroll-triggered sequences, complex timeline choreography, SVG path morphing — GSAP handles the cases where CSS animations or simpler libraries fall short. It's used by every brand you associate with premium web design.",
    whyWeUseIt: [
      'Performance-first architecture — animations stay 60fps even with complex sequences and many simultaneous elements.',
      'ScrollTrigger plugin enables sophisticated scroll-driven animations that feel native rather than scripted.',
      'Browser compatibility is unmatched — GSAP works the same on every browser without the fragility of CSS-only solutions.',
      'Timeline-based sequencing makes complex multi-step animations readable and maintainable.',
    ],
    businessOutcome:
      'Animation is one of the fastest signals visitors use to judge whether a site is premium or template-grade. Smooth, intentional motion reads as premium. Janky or overdone motion reads as amateur. GSAP gives us the control to do animation right — adding it only where it strengthens the brand, never as decoration for its own sake.',
  },
  {
    slug: 'framer-motion',
    name: 'Framer Motion',
    keyword: 'Framer Motion React animation',
    tagline: 'Declarative animations for React components.',
    description:
      'Vizantir uses Framer Motion for component-level React animations — entrances, hover states, page transitions, and gesture-driven interactions.',
    intro:
      "Framer Motion is the animation library we use within React components — page transitions, scroll-in fades, hover micro-interactions, gesture-driven UI. It's declarative and component-aware, which means animations live alongside the components they animate rather than in separate animation scripts. This makes the codebase cleaner and changes safer.",
    whyWeUseIt: [
      'Declarative API — animations are described as props on components, not orchestrated separately.',
      'Built specifically for React — works naturally with component state, mounting, and unmounting.',
      'Powerful gesture support for tap, drag, and hover interactions without extra libraries.',
      'AnimatePresence enables smooth enter/exit animations when components mount and unmount.',
    ],
    businessOutcome:
      "A site without thoughtful micro-interactions feels static. A site with too much animation feels exhausting. Framer Motion is the tool that lets us place animation precisely where it serves the visitor — a card fading in as it scrolls into view, a button responding to hover, a page transition that feels considered rather than abrupt. The animations you don't consciously notice are the ones doing the most work.",
  },
  {
    slug: 'analytics',
    name: 'Analytics',
    keyword: 'website analytics implementation',
    tagline: 'Privacy-respecting visitor analytics on every build.',
    description:
      'Vizantir integrates Google Analytics or Vercel Analytics on every site — accurate visitor data without compromising performance or privacy.',
    intro:
      'Every Vizantir build includes analytics — either Google Analytics 4, Vercel Analytics, or both depending on the project. The goal is the same regardless of which platform: give you visibility into how visitors find and use your site without slowing the site down or compromising visitor privacy.',
    whyWeUseIt: [
      'Vercel Analytics — first-party analytics with no cookie banner required, automatically integrated with the Vercel platform, perfect for marketing-focused sites.',
      'Google Analytics 4 — industry-standard visitor analytics with deep integration into other Google marketing tools (Search Console, Ads, Looker Studio).',
      'Privacy-conscious implementation — we configure analytics to anonymize IPs, respect Do Not Track signals, and comply with GDPR/CCPA where applicable.',
      'Custom event tracking lets us measure what matters to your business — form submissions, CTA clicks, scroll depth, file downloads.',
    ],
    businessOutcome:
      "Most websites either ship without analytics at all (no visibility into what's working) or ship with poorly configured analytics that pollute the data with internal traffic, bot visits, and irrelevant pageviews. We set up analytics carefully on day one — accurate, filtered, and producing data your team can actually use to make decisions.",
  },
  {
    slug: 'microsoft-clarity',
    name: 'Microsoft Clarity',
    keyword: 'Microsoft Clarity heatmap analytics',
    tagline: 'See exactly how visitors use your site — for free.',
    description:
      'Vizantir integrates Microsoft Clarity for visual behavior analytics — heatmaps, session recordings, and rage-click detection on every page.',
    intro:
      "Microsoft Clarity is the qualitative analytics tool we install on every Vizantir build that wants to understand visitor behavior visually. Heatmaps show where visitors click and scroll. Session recordings let you watch how real users navigate your site. It's free, privacy-conscious, and adds nearly zero performance overhead. We pair it with Google Analytics or Vercel Analytics — quantitative data on one side, qualitative on the other.",
    whyWeUseIt: [
      "Heatmaps reveal where visitors actually click — often very different from where you'd expect.",
      'Session recordings show how real users navigate your site, exposing UX issues that no analytics dashboard would catch.',
      'Rage-click and dead-click detection automatically surface frustrating moments in the user experience.',
      'Free at any scale — Microsoft offers Clarity at no cost, including session recordings and unlimited heatmaps.',
    ],
    businessOutcome:
      "Google Analytics tells you what visitors did. Microsoft Clarity shows you how they did it. The difference matters when you're trying to understand why a page isn't converting, why visitors leave a specific section, or why a CTA underperforms. We've seen Clarity recordings completely change how a client thought about their navigation — based on what they watched real visitors do.",
  },
]

export const ALL_TECHNOLOGIES: Technology[] = [...CORE_STACK, ...SPECIALIZED_TOOLS]

export function getTechnologyBySlug(slug: string): Technology | undefined {
  return ALL_TECHNOLOGIES.find((tech) => tech.slug === slug)
}

import { CORE_STACK, SPECIALIZED_TOOLS, type Technology } from '@/app/technology/_data'

export type SitemapLink = { name: string; href: string }

const TECHNOLOGY_LABEL_OVERRIDES: Record<string, string> = {
  nextjs: 'Next.js Development',
  sanity: 'Sanity CMS Development',
  vercel: 'Vercel Hosting and Deployment',
  tailwind: 'Tailwind CSS Custom Design',
  typescript: 'TypeScript Development',
  react: 'React Development',
  supabase: 'Supabase Development',
  stripe: 'Stripe Integration',
  resend: 'Resend Email Integration',
  cloudflare: 'Cloudflare CDN and Security',
  gsap: 'GSAP Animation Development',
  'framer-motion': 'Framer Motion React Animation',
  analytics: 'Website Analytics Implementation',
  'microsoft-clarity': 'Microsoft Clarity Heatmap Analytics',
}

function technologySitemapLabel(tech: Technology): string {
  return TECHNOLOGY_LABEL_OVERRIDES[tech.slug] ?? tech.name
}

export const sitemapTechnologyPages: SitemapLink[] = [
  { name: 'Our Technology Stack', href: '/technology' },
  ...CORE_STACK.map((tech) => ({
    name: technologySitemapLabel(tech),
    href: `/technology/${tech.slug}`,
  })),
  ...SPECIALIZED_TOOLS.map((tech) => ({
    name: technologySitemapLabel(tech),
    href: `/technology/${tech.slug}`,
  })),
]

export const sitemapMainPages: SitemapLink[] = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
  { name: 'Services', href: '/services' },
  { name: 'Blog', href: '/blog' },
  { name: 'FAQ', href: '/faq' },
  { name: 'Our Work', href: '/case-studies' },
  { name: 'Analytir', href: '/analytir' },
  { name: 'How We Work', href: '/how-we-work' },
  { name: 'Are We a Fit?', href: '/are-we-a-fit' },
  { name: 'Get Started', href: '/get-started' },
  { name: 'Sitemap', href: '/sitemap-page' },
]

export const sitemapIndustryPages: SitemapLink[] = [
  { name: 'Industries We Build For', href: '/industries' },
  { name: 'Las Vegas Web Design', href: '/las-vegas-web-design' },
  { name: 'Website Redesign Las Vegas', href: '/website-redesign-las-vegas' },
  { name: 'Law Firm Web Design', href: '/law-firm-web-design' },
  { name: 'Hospitality Web Design', href: '/hospitality-web-design' },
  { name: 'Commercial Real Estate Web Design', href: '/commercial-real-estate-web-design' },
]

export const sitemapLandingPages: SitemapLink[] = [
  { name: 'Landing Pages', href: '/landing-pages' },
  { name: 'Landing Pages for Google Ads', href: '/landing-pages/for-google-ads' },
  { name: 'Landing Pages for Product Launches', href: '/landing-pages/for-product-launches' },
]

export const sitemapLegalPages: SitemapLink[] = [
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Terms and Conditions', href: '/terms' },
  { name: 'Cookie Policy', href: '/cookies' },
  { name: 'Copyright Notice', href: '/copyright' },
]

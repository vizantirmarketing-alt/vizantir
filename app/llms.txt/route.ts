import { NextResponse } from 'next/server'

export async function GET() {
  const content = `# Vizantir
> Premium digital marketing agency specializing in SEO, AEO, and Next.js development based in Las Vegas, Nevada.

## About
Vizantir is a premium digital marketing agency founded in 2024. We help growth-focused businesses achieve measurable results through SEO, web development, and digital marketing. Unlike traditional agencies weighed down by overhead and long contracts, we're fully online and lean — meaning faster execution, lower costs, and more value for every client.

## Services
- SEO & Content Marketing: Keyword strategy, technical optimization, content that ranks
- Answer Engine Optimization (AEO): Optimizing for AI-powered search engines and chatbots
- Next.js Web Development: Fast, conversion-focused websites built on modern technology
- PPC Advertising: Google Ads and Meta campaigns with measurable ROI
- Web Design: Modern, responsive websites optimized for speed and conversions

## Expertise
- Search Engine Optimization (SEO)
- Answer Engine Optimization (AEO)
- Next.js Development
- Web Design
- Digital Marketing
- PPC Advertising

## Who We Work With
We partner with B2B companies, professional services firms, and established local businesses generating $1M+ in revenue. Our clients are growth-focused leaders who want measurable results, not vanity metrics.

## Industries Served
- Professional Services
- SaaS & Technology
- Healthcare & Medical
- Home Services
- E-commerce

## Why Vizantir
- 10+ Years Experience in SEO, paid media, and conversion optimization
- Results Before Retainers: We prove our value before asking for long-term commitment
- Built for Growth: We work with businesses doing $1M+ who are ready to scale
- No Fluff, No Vanity Metrics: We report on leads, revenue, and ROI

## Contact
- Website: https://vizantir.com
- Email: info@vizantir.com
- Phone: +1 (702) 604-6177
- Location: Las Vegas, Nevada, United States

## Social
- Instagram: https://www.instagram.com/vizantirmarketing/

## Key Pages
- Homepage: https://vizantir.com
- Services: https://vizantir.com/services
- About: https://vizantir.com/about
- Blog: https://vizantir.com/blog
- Contact: https://vizantir.com/contact

## Recent Blog Posts
- WordPress vs Next.js: Which Should You Choose in 2025?
- Is WordPress Still Relevant in 2025?
- How Much Does a Website Cost in 2025?
`

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}


import { NextResponse } from 'next/server'

export async function GET() {
  const content = `# Vizantir
> Premium web design and development agency based in Las Vegas, Nevada. We create stunning, high-performance websites built on Next.js.

## About
Vizantir is a premium web design and development agency founded in 2024. We create stunning, high-performance websites that convert visitors into customers. Built on modern technology like Next.js, our sites are fast, responsive, and optimized for search engines. Based in Las Vegas and serving clients nationwide, we help growth-focused businesses stand out online.

## Services
- Custom Website Design: Stunning, conversion-focused designs tailored to your brand
- Web Development: Fast, modern websites built on Next.js and React
- E-commerce Development: Online stores that drive sales
- Landing Page Design: High-converting pages for campaigns
- SEO & Content Marketing: Search optimization to drive organic traffic
- Digital Marketing: PPC, social media, and growth strategies

## Expertise
- Web Design
- Website Development
- Next.js Development
- UI/UX Design
- E-commerce
- SEO
- Digital Marketing

## Who We Work With
We partner with B2B companies, professional services firms, and established businesses who want a premium website that stands out and converts. Our clients are growth-focused leaders who value quality design and measurable results.

## Industries Served
- Professional Services
- SaaS & Technology
- Healthcare & Medical
- Home Services
- E-commerce
- Real Estate

## Why Vizantir
- Premium Design Quality: Stunning websites that stand out from templates
- Modern Technology: Built on Next.js for speed and performance
- Results-Focused: Every design decision drives conversions
- No Long Contracts: Flexible engagement, results before retainers

## Contact
- Website: https://www.vizantir.com
- Email: info@vizantir.com
- Phone: +1 (702) 604-6177
- Location: Las Vegas, Nevada, United States

## Social
- Instagram: https://www.instagram.com/vizantirmarketing/

## Key Pages
- Homepage: https://www.vizantir.com
- Services: https://www.vizantir.com/services
- About: https://www.vizantir.com/about
- Blog: https://www.vizantir.com/blog
- Contact: https://www.vizantir.com/contact
`

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}


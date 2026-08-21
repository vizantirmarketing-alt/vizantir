import { NextResponse } from "next/server";
import { landingPagePricing, projectPricing } from "@/data/pricing";

const essentialsProjectTier = projectPricing[0];
const enterpriseProjectTier = projectPricing[2];
const campaignLandingPageTier = landingPagePricing.find(
  (tier) => tier.slug === "campaign-landing-page",
);
if (!essentialsProjectTier || !enterpriseProjectTier) {
  throw new Error("projectPricing is missing expected tiers");
}
if (!campaignLandingPageTier) {
  throw new Error("landingPagePricing is missing campaign-landing-page");
}

const customWebsiteFloor = essentialsProjectTier.price;
const enterpriseCeiling = enterpriseProjectTier.price;
const campaignLandingPageFloor = `$${campaignLandingPageTier.priceMin.toLocaleString("en-US")}`;

const content = `# Vizantir

> Premium custom website design and development studio based in Las Vegas, Nevada, serving clients nationwide. Vizantir builds bespoke, high-performance Next.js websites for established businesses that have outgrown their current site.

Vizantir is a design and development studio founded by an operator with 25 years of business ownership and more than ten years building websites. Every project is custom — no templates, no plugin-heavy WordPress builds, no page builders. Sites are built on Next.js for speed, search visibility, and long-term maintainability, with Sanity CMS so a client's team can update content without a developer. Clients work directly with the person shaping the project. Fixed scope, fixed pricing, milestone check-ins. Remote-first, serving Las Vegas — including Henderson, Summerlin, and Paradise — and businesses across the U.S.

## Services
- [Website Strategy](https://www.vizantir.com/services): Mapping what the site needs to do before design begins — who it's for, what they care about, what makes them reach out.
- [Web Design](https://www.vizantir.com/services): Custom design built around the brand and the buyer. No templates, no shortcuts.
- [Web Development](https://www.vizantir.com/services): Fast, clean Next.js code a client's team can update without calling a developer.
- [Website Refreshes](https://www.vizantir.com/services): Fixing what's holding an existing site back without rebuilding what already works.
- [CMS Integrations](https://www.vizantir.com/services): Sanity setup so teams can update content, add pages, and make changes without touching code.
- [Next.js Development](https://www.vizantir.com/services): Scalable websites and web applications on Next.js, optimized for performance, search visibility, and maintainability.
- [Sanity CMS Development](https://www.vizantir.com/services): Sanity CMS implemented so teams can manage and publish content without code.
- [Website Care](https://www.vizantir.com/services): Ongoing improvement after launch — content, conversion, search, and related work on a monthly retainer.

## Who we work with
Established businesses where trust and presentation affect revenue — beauty and wellness, creative studios, professional services, retail, luxury brands, and financial services. Dedicated SEO entry pages exist for several verticals, though active client work spans broader sectors. Best fit for companies whose current website is holding the brand back, who want a custom site over a template, and who are ready to invest ${customWebsiteFloor} or more in a custom website build, or ${campaignLandingPageFloor} or more for a campaign landing page. Not a fit for pre-launch ideas, lowest-bid shoppers, hourly or unlimited-revision arrangements, full-service marketing needs (Vizantir does not run Google Ads or manage social media), or two-week timelines.

## Pricing
Custom website projects start at ${customWebsiteFloor} and scale to ${enterpriseCeiling} depending on scope and complexity. Not the cheapest option in the Las Vegas market, by design.

## How we work
A five-step process with defined scope and fixed pricing: Discovery (goals, timeline, fit), Proposal (clear scope document — what's included, price, timeline), 50% deposit to begin, Build (design and development with milestone check-ins), and Launch (final review, remaining balance, go live). No hourly billing — finished products, not hours.

## Selected work
- Essence of Watches: Headless e-commerce on Next.js and Sanity for a pre-owned luxury watch dealer — fast, searchable, manageable without a developer on call.
- Golden Era Integra: Editorial platform for a 1995 Acura Integra GS-R restoration — build journal, parts archive, and garage sale system on Sanity.
- Eloraé Nails: Clean single-page site for a private Las Vegas nail studio, moved off Wix.
- Pink Salt Salon & Spa: Migrated a luxury Las Vegas nail salon off a malware-prone WordPress site to a stable custom build.
- Meridian Row: Fast, clean site for a premium Las Vegas retail and dining development, built to attract serious tenants.
- High Roller Legal (concept): Conversion-focused site for a personal injury law firm.
- Fuji Omakase (concept): Minimal, immersive site for a high-end omakase restaurant.
- Éclat Lounge (concept): Dark, immersive site for a premium Las Vegas cocktail lounge.
- Pétale & Fête (concept): Elegant site for a Las Vegas event planner.

## Key pages
- [Home](https://www.vizantir.com/)
- [About](https://www.vizantir.com/about): A studio for brands that have outgrown their website.
- [Services](https://www.vizantir.com/services): What we build.
- [Our Work](https://www.vizantir.com/case-studies): Websites we have launched.
- [How We Work](https://www.vizantir.com/how-we-work): From first call to launch, no surprises.
- [Are We a Fit?](https://www.vizantir.com/are-we-a-fit): Honest criteria before booking a Strategy Call.
- [Las Vegas Web Design](https://www.vizantir.com/las-vegas-web-design): Local service page for Las Vegas and Southern Nevada.
- [Blog](https://www.vizantir.com/blog): Articles on web design, performance, and running a business online.
- [Contact](https://www.vizantir.com/contact): Start the conversation.

## How to engage
Book a 30-minute Strategy Call — no pitch deck, no pressure. Vizantir will say honestly whether it's the right fit or recommend someone better suited. If aligned, the client gets a clear scope and timeline before work begins.
Contact: https://vizantir.com/contact | +1 (702) 289-0758 | Las Vegas, NV 89139
Hours: Mon–Fri 9:00 AM–6:00 PM PST; Saturday by appointment; Sunday closed. Typical response under 24 hours.

## Social
- LinkedIn: https://www.linkedin.com/company/vizantir/
- Instagram: https://www.instagram.com/vizantirdesignstudio
`;

export function GET() {
  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}

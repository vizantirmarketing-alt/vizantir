import { NextResponse } from "next/server";
import { carePricing, landingPagePricing, projectPricing } from "@/data/pricing";
import { sanityFetch } from "@/lib/sanity/client";
import { chatAllCaseStudiesQuery } from "@/lib/sanity/queries";

const essentialsProjectTier = projectPricing[0];
const growthProjectTier = projectPricing[1];
const enterpriseProjectTier = projectPricing[2];
const essentialCareTier = carePricing[0];
const websiteCareTier = carePricing[1];
const growthPartnerTier = carePricing[2];
const campaignLandingPageTier = landingPagePricing.find(
  (tier) => tier.slug === "campaign-landing-page",
);
const conversionSystemTier = landingPagePricing.find(
  (tier) => tier.slug === "conversion-system",
);

if (!essentialsProjectTier || !growthProjectTier || !enterpriseProjectTier) {
  throw new Error("projectPricing is missing expected tiers");
}
if (!essentialCareTier || !websiteCareTier || !growthPartnerTier) {
  throw new Error("carePricing is missing expected tiers");
}
if (!campaignLandingPageTier || !conversionSystemTier) {
  throw new Error("landingPagePricing is missing expected tiers");
}

const campaignLandingPage = campaignLandingPageTier;
const conversionSystem = conversionSystemTier;

type PublishedCaseStudy = {
  title?: string;
  slug?: string;
  summary?: string;
  projectType?: "client" | "studio";
};

// Unset projectType is treated as 'client' to match the schema default.
// A future case study added without the field set will be published here,
// not silently omitted. Studio projects must be set to 'studio' explicitly.
function isClientProject(projectType: PublishedCaseStudy["projectType"]): boolean {
  return projectType !== "studio";
}

const LAUNCHED_SITE_BLURBS: Record<string, string> = {
  "elorae-nails":
    "Clean single-page site for a private Las Vegas nail studio, moved off Wix.",
  "beacon-of-light-music":
    "Catalog site for a worship songwriter — every track with its story, plus pages to find and follow the artist. New songs are added in Sanity without a developer.",
  "evolve-dance-center":
    "Las Vegas dance studio rebuilt from Wix onto Next.js and Sanity. Domain moved; email never went down.",
  "golden-era-integra":
    "Editorial platform for a 1995 Acura Integra GS-R restoration — build journal, parts archive, and garage sale system on Sanity.",
  "pink-salt-salon":
    "Migrated a luxury Las Vegas nail salon off a malware-prone WordPress site to a stable custom build.",
};

function formatLaunchedSites(items: PublishedCaseStudy[]): string {
  return items
    .filter((item) => isClientProject(item.projectType))
    .flatMap((item) => {
      if (typeof item.slug !== "string" || typeof item.title !== "string") {
        return [];
      }
      const blurb = LAUNCHED_SITE_BLURBS[item.slug] ?? item.summary;
      if (!blurb) {
        return [];
      }
      return [`- [${item.title}](https://www.vizantir.com/case-studies/${item.slug}): ${blurb}`];
    })
    .join("\n");
}

const customWebsiteFloor = essentialsProjectTier.price;
const campaignLandingPageFloor = `$${campaignLandingPageTier.priceMin.toLocaleString("en-US")}`;

function buildContent(launchedSites: string): string {
  return `# Vizantir

> Premium custom website design and development studio based in Las Vegas, Nevada, serving clients nationwide. Vizantir builds bespoke, high-performance Next.js websites for established businesses that have outgrown their current site.

Vizantir is a design and development studio founded by an operator with 25 years of business ownership and more than ten years building websites. Every project is custom — no templates, no plugin-heavy WordPress builds, no page builders. Sites are built on Next.js for speed, search visibility, and long-term maintainability, with Sanity CMS so a client's team can update content without a developer. Clients work directly with the person shaping the project. Fixed scope, fixed pricing, milestone check-ins. Remote-first, serving Las Vegas — including Henderson, Summerlin, and Paradise — and businesses across the U.S.

Complete site knowledge: [llms-full.txt](https://www.vizantir.com/llms-full.txt)

## Services
- [Website Strategy](https://www.vizantir.com/services/website-strategy): Mapping what the site needs to do before design begins — who it's for, what they care about, what makes them reach out.
- [Web Design](https://www.vizantir.com/services/web-design): Custom design built around the brand and the buyer. No templates, no shortcuts.
- [Web Development](https://www.vizantir.com/services/web-development): Fast, clean Next.js code a client's team can update without calling a developer.
- [Landing Pages](https://www.vizantir.com/services/landing-pages): Conversion-focused pages built to turn traffic into leads.
- [Website Refreshes](https://www.vizantir.com/services/website-refreshes): Fixing what's holding an existing site back without rebuilding what already works.
- [CMS Integrations](https://www.vizantir.com/services/cms-integrations): Sanity setup so teams can update content, add pages, and make changes without touching code.
- [Website Care](https://www.vizantir.com/services/website-care): Ongoing improvement after launch — content, conversion, search, and related work on a monthly retainer.

## Who we work with
Established businesses where trust and presentation affect revenue — beauty and wellness, creative studios, professional services, retail, luxury brands, and financial services. Dedicated SEO entry pages exist for several verticals, though active client work spans broader sectors. Best fit for companies whose current website is holding the brand back, who want a custom site over a template, and who are ready to invest ${customWebsiteFloor} or more in a custom website build, or ${campaignLandingPageFloor} or more for a campaign landing page. Not a fit for pre-launch ideas, lowest-bid shoppers, hourly or unlimited-revision arrangements, full-service marketing needs (Vizantir does not run Google Ads or manage social media), or two-week timelines.

## Pricing
Custom website projects. Not the cheapest option in the Las Vegas market, by design.

### Website projects
- ${essentialsProjectTier.name}: ${essentialsProjectTier.price} — ${essentialsProjectTier.timeline}. ${essentialsProjectTier.description}
- ${growthProjectTier.name}: ${growthProjectTier.price} — ${growthProjectTier.timeline}. ${growthProjectTier.description}
- ${enterpriseProjectTier.name}: ${enterpriseProjectTier.price} — ${enterpriseProjectTier.timeline}. ${enterpriseProjectTier.description}

### Website Care (monthly)
- ${essentialCareTier.name}: ${essentialCareTier.price}. ${essentialCareTier.description}
- ${websiteCareTier.name}: ${websiteCareTier.price}. ${websiteCareTier.description}
- ${growthPartnerTier.name}: ${growthPartnerTier.price}. ${growthPartnerTier.description}

### Landing pages
- ${campaignLandingPage.name}: ${campaignLandingPage.price}. ${campaignLandingPage.description}
- ${conversionSystem.name}: ${conversionSystem.price}. ${conversionSystem.description}

## How we work
A five-step process with defined scope and fixed pricing: Discovery (goals, timeline, fit), Proposal (clear scope document — what's included, price, timeline), 50% deposit to begin, Build (design and development with milestone check-ins), and Launch (final review, remaining balance, go live). No hourly billing — finished products, not hours.

## Launched sites
Live sites built by the studio.
${launchedSites}

The full portfolio is at https://www.vizantir.com/case-studies.

## Key pages
- [Home](https://www.vizantir.com/)
- [About](https://www.vizantir.com/about): A studio for brands that have outgrown their website.
- [Services](https://www.vizantir.com/services): What we build.
- [Our Work](https://www.vizantir.com/case-studies): Websites we have launched.
- [How We Work](https://www.vizantir.com/how-we-work): From first call to launch, no surprises.
- [Are We a Fit?](https://www.vizantir.com/are-we-a-fit): Honest criteria before booking a Strategy Call.
- [FAQ](https://www.vizantir.com/faq): Common questions about working with Vizantir.
- [Industries](https://www.vizantir.com/industries): Sectors Vizantir builds for.
- [Landing Pages](https://www.vizantir.com/landing-pages): Campaign and conversion pages.
- [Law Firm Web Design](https://www.vizantir.com/law-firm-web-design): Vertical page for law firms.
- [Hospitality Web Design](https://www.vizantir.com/hospitality-web-design): Vertical page for restaurants, hotels, and venues.
- [Commercial Real Estate Web Design](https://www.vizantir.com/commercial-real-estate-web-design): Vertical page for CRE firms and developments.
- [Las Vegas Web Design](https://www.vizantir.com/las-vegas-web-design): Local service page for Las Vegas and Southern Nevada.
- [Website Redesign Las Vegas](https://www.vizantir.com/website-redesign-las-vegas): Redesign work for existing Las Vegas sites.
- [Blog](https://www.vizantir.com/blog): Articles on web design, performance, and running a business online.
- [Contact](https://www.vizantir.com/contact): Start the conversation.

## How to engage
Book a 30-minute Strategy Call — no pitch deck, no pressure. Vizantir will say honestly whether it's the right fit or recommend someone better suited. If aligned, the client gets a clear scope and timeline before work begins.
Contact: https://www.vizantir.com/contact | +1 (702) 289-0758 | Las Vegas, NV 89139
Hours: Mon–Fri 9:00 AM–6:00 PM PST; Saturday by appointment; Sunday closed. Typical response under 24 hours.

## Social
- LinkedIn: https://www.linkedin.com/company/vizantir/
- Instagram: https://www.instagram.com/vizantirdesignstudio
`;
}

export async function GET() {
  const caseStudies = await sanityFetch<PublishedCaseStudy[]>(
    chatAllCaseStudiesQuery,
    {},
    { tags: ["caseStudy"] },
  );
  const content = buildContent(formatLaunchedSites(caseStudies ?? []));
  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}

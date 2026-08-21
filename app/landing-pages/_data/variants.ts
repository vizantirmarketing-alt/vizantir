import { EXISTING_SITE_PAGE_RATE_DISPLAY } from '@/data/pricing'

export const sharedQualifierFit = [
  "You're running paid traffic or planning to",
  'You have a specific offer, promotion, or launch to sell',
  'You want the page to actually convert, not just exist',
  'You care that the code is yours to keep',
] as const

export const sharedQualifierNotFit = [
  {
    before: 'You need a full multi-page website (',
    link: { href: '/services/web-design', label: 'see Web Design instead' },
    after: ')',
  },
  {
    before: "Your offer isn't defined yet (",
    link: { href: '/services/website-strategy', label: 'start with Website Strategy' },
    after: ')',
  },
  {
    before: 'You want a template you can edit yourself (Webflow serves that market well)',
    link: null,
    after: '',
  },
  {
    before: 'You need a $500 one-pager (we can recommend other options)',
    link: null,
    after: '',
  },
] as const

export type VariantSlug = 'primary' | 'googleAds' | 'productLaunches'

export type ProcessEmphasisStep = 'strategy' | 'design' | 'build' | 'launch'

export type LandingPageVariant = {
  slug: VariantSlug
  route: string
  metaTitle: string
  metaDescription: string
  hero: {
    eyebrow: string
    headline: string
    subheadline: string
    ctaLabel: string
    trackingLocation: string
  }
  homepageProblem: {
    heading: string
    body: string
    bullets: string[]
  }
  faqs: { question: string; answer: string }[]
  closingCta: {
    heading: string
    subheading: string
    ctaLabel: string
    trackingLocation: string
  }
  proofPointsCallout: string
  qualifierOverrides: {
    fit: string[]
    notFit: string[]
  }
  processEmphasis: {
    step: ProcessEmphasisStep
    label: string
  }
  optimizedFor: string
  comparisonHighlights: {
    hero: string
    problem: string
    proof: string
    qualifier: string
    faq: string
  }
}

export const variants: Record<VariantSlug, LandingPageVariant> = {
  primary: {
    slug: 'primary',
    route: '/landing-pages',
    metaTitle: 'Landing Page Design & Development | Vizantir',
    metaDescription:
      'Custom landing pages built on Next.js. Strategy, design, and conversion-focused development. Campaign Landing Page ($3.5K) and Conversion System ($8K) tiers.',
    hero: {
      eyebrow: 'Landing pages by Vizantir',
      headline: 'Your homepage is doing too much.',
      subheadline:
        "When a campaign, offer, or ad spend needs one focused page instead of a homepage trying to serve everyone, that's when a landing page earns its keep. Vizantir builds them from scratch on Next.js, matched to your brand, wired to your analytics, and structured so every section pulls toward a single conversion. You get a page you own, not a template you rent, and a tracking setup your media buyer can actually optimize against.",
      ctaLabel: 'Book a strategy call',
      trackingLocation: 'landing_pages_primary_hero',
    },
    homepageProblem: {
      heading: 'The homepage is not a landing page.',
      body: "A homepage is a lobby. It routes visitors to services, portfolios, about, contact, careers. That's the right job for a homepage. It's the wrong job for a $5,000 Google Ads campaign or a product launch that needs one specific action. Sending paid traffic to a homepage costs money on every click that bounces to a page not built for the offer. The visitor who clicked an ad about a specific promotion should not land on a page that asks them to choose between five services and a blog. That mismatch is where conversion rate dies, and where Quality Score and launch windows quietly punish you for using the wrong surface.",
      bullets: [
        'Homepages average 8+ links in the header. A landing page has one.',
        'Homepages describe the business. A landing page sells one thing.',
        'Homepages carry decade-old copy. A landing page ships in weeks around a current offer.',
        'Homepages track pageviews. A landing page tracks conversions.',
      ],
    },
    faqs: [
      {
        question: 'How is this different from a website?',
        answer:
          "A website answers 'what does this business do?' A landing page answers 'why should I take this specific action right now?' Different job, different scope, different price. Landing pages start at $3,500 and ship in 2-3 weeks. Full custom websites start at $15,000 and ship in 6-8 weeks. If you need both, we often scope a Campaign Landing Page or Conversion System first so paid traffic has a conversion surface while the broader site is still in progress.",
      },
      {
        question: 'Which tier should I pick?',
        answer:
          "If you have a specific offer and clear copy, Campaign Landing Page at $3,500 is likely right. If you're spending on paid traffic, need messaging refinement and behavior tracking, or want variant testing across audiences, Conversion System at $8,000 is built for that. A common pattern: one Conversion System covering a primary offer page plus two audience variants beats three separate Campaign builds in both cost and consistency. If you're not sure, book a strategy call. 30 minutes is usually enough to scope which tier fits.",
      },
      {
        question: 'Do you write the copy?',
        answer:
          'Copy collaboration is included at every tier. Campaign Landing Page uses your copy with light editing for clarity and CTA strength. Conversion System includes substantial copy refinement and a messaging workshop where we pressure-test offer framing, objections, and proof order before design starts, then applies that workshop across all variants so each audience gets right-sized messaging without three separate copy projects.',
      },
      {
        question: 'Can I add a landing page to an existing Vizantir website?',
        answer:
          `Yes. Existing Vizantir website clients get an existing-site page rate starting at ${EXISTING_SITE_PAGE_RATE_DISPLAY} because the design system, components, and brand infrastructure are already built. That rate covers a single Campaign Landing Page-scope page on the existing stack. Conversion System scope on an existing site is quoted from the standard tier price with credit for shared infrastructure where it applies. The existing-site rate applies in place of care plan preferred rates rather than on top of them.`,
      },
      {
        question: 'Can you run the ad campaigns too?',
        answer:
          'Vizantir builds the landing page and the tracking behind it. For paid campaign management, we can recommend trusted ad partners who run traffic to pages we build. We stay in the loop on event naming and conversion definitions so your media buyer is not reverse-engineering a black box after handoff.',
      },
      {
        question: 'What analytics do you set up?',
        answer:
          'Vercel Analytics for pageviews and event tracking on every tier. Microsoft Clarity for behavior tracking on Conversion System. Conversion events are configured per your specific goals during the strategy session: form submits, CTA clicks, phone taps, scroll depth, and any custom events your optimization loop needs. Before handoff, we verify events fire cleanly so you are not debugging tracking in week one of spend.',
      },
    ],
    closingCta: {
      heading: 'One page. One goal. Book a call.',
      subheading:
        '30 minutes to map your offer, pick the right tier, and leave with a clear build plan instead of another vague estimate.',
      ctaLabel: 'Book a strategy call',
      trackingLocation: 'landing_pages_primary_closing',
    },
    proofPointsCallout:
      'Custom Next.js builds, real client work, real Vizantir landing pages you can inspect live',
    qualifierOverrides: {
      fit: [
        'You need one focused conversion page, not another homepage rewrite',
        'You want variant testing infrastructure for more than one audience or offer',
      ],
      notFit: [
        'You only need a temporary page for a weekend event and will delete it afterward',
      ],
    },
    processEmphasis: {
      step: 'strategy',
      label: 'Most critical when the offer and audience are still being sharpened',
    },
    optimizedFor: 'General campaign and offer pages that need one clear conversion action',
    comparisonHighlights: {
      hero: 'Homepage overload framing for any paid or launch traffic',
      problem: 'Homepage vs landing page job definition with spend waste spelled out',
      proof: 'Live Vizantir builds you can inspect, not stock case-study theater',
      qualifier: 'Fit for focused conversion pages and multi-audience systems',
      faq: 'Tier selection, copy depth, analytics, and existing-site rates',
    },
  },
  googleAds: {
    slug: 'googleAds',
    route: '/landing-pages/for-google-ads',
    metaTitle: 'Google Ads Landing Pages | Custom Built on Next.js | Vizantir',
    metaDescription:
      'Custom landing pages for Google Ads campaigns. Built for conversion, not templates. Campaign Landing Page and Conversion System tiers from $3,500.',
    hero: {
      eyebrow: 'Landing pages for Google Ads',
      headline: "You're paying for clicks. Your homepage isn't paying you back.",
      subheadline:
        "Sending Google Ads traffic to your homepage is spending money to load a page that isn't built for the offer. Vizantir builds custom landing pages that match your ad copy, load fast on mobile, and track every conversion event your account needs to optimize. Message match, relevance signals, and clean event data are designed in before the first dollar of new spend hits the page.",
      ctaLabel: 'Book a strategy call',
      trackingLocation: 'landing_pages_google_ads_hero',
    },
    homepageProblem: {
      heading: 'The math of a homepage for paid traffic.',
      body: "Google Ads at $5 CPC, 100 clicks per day, means $500 daily spend. If your homepage converts at 2% because it's a lobby routing traffic to services and blog posts, that's 2 conversions for $500. That's the math of paid traffic to a page that isn't built for the offer.",
      bullets: [
        'Every unmatched ad-to-page transition costs Quality Score.',
        'Homepages carry navigation that gives visitors 8 ways to leave without converting.',
        'Ad copy promises specifics. Homepages describe the business.',
        'Landing pages are the standard in every paid traffic playbook for a reason.',
      ],
    },
    faqs: [
      {
        question: 'Do you work with Google Ads specialists?',
        answer:
          "Yes. Vizantir builds the landing page and conversion tracking. Ad campaign management, keyword strategy, and bid management belong to your Google Ads specialist. If you don't have one, we can recommend trusted partners who work well with our page builds. We align on event names and conversion definitions during strategy so your specialist is not renaming goals after launch week.",
      },
      {
        question: 'Which tier fits Google Ads best?',
        answer:
          "For most paid traffic, Conversion System at $8,000 is the right tier because it includes offer and messaging workshop, substantial copy refinement, behavior tracking, detailed conversion event tracking, and 2 audience variants. If you're running multiple ad groups targeting different audiences, that variant structure lets you match landing pages to ad group intent. Example: one primary page for brand search, plus variants for a high-intent service keyword and a competitor-conquest group, sharing one component system instead of three disconnected builds. If the offer is locked and you only need one focused page, Campaign Landing Page at $3,500 fits.",
      },
      {
        question: 'How do you handle Quality Score?',
        answer:
          "Landing page relevance is one of three Quality Score factors. Vizantir builds pages that match your ad copy language, load under 2.5 seconds on mobile, and use clear conversion-focused messaging, all of which support relevance scoring. We don't manage the ad account itself, but our page builds are optimized for the signals Google measures. During strategy we pull the exact headline and description language from your active ads so the page does not invent a different promise.",
      },
      {
        question: 'What conversion events do you track?',
        answer:
          'Form submissions, button clicks, phone taps, scroll depth, video plays, and any custom events your Google Ads campaign optimization needs. Events are configured during the strategy session and verified in Google Ads before handoff. If you need enhanced conversions or offline conversion import later, we document the event schema so your specialist can extend it without rebuilding the page.',
      },
      {
        question: 'Can you build multiple landing pages for different ad groups?',
        answer:
          "That's Conversion System tier. One primary landing page plus 2 variants (audience, offer, headline, or location-based) built on a shared component system. Additional variants beyond the included 2 are quoted as smaller add-ons because the infrastructure is already built. Most Google Ads clients use the included variants to mirror their top two non-brand ad groups while the primary catches brand and high-intent search.",
      },
    ],
    closingCta: {
      heading: 'Stop sending paid traffic to a homepage.',
      subheading:
        '30 minutes to scope a page that matches your ads, tracks the events your account needs, and stops leaking spend into a lobby.',
      ctaLabel: 'Book a strategy call',
      trackingLocation: 'landing_pages_google_ads_closing',
    },
    proofPointsCallout:
      'Every landing page we ship is built to convert paid traffic, not just render',
    qualifierOverrides: {
      fit: [
        'You are already spending on Google Ads or launching a campaign in the next 60 days',
        'You care about Quality Score, message match, and conversion events your media buyer can use',
      ],
      notFit: [
        'You want us to manage bids, keywords, and the Google Ads account itself',
      ],
    },
    processEmphasis: {
      step: 'build',
      label: 'Most critical when paid traffic needs verified conversion tracking',
    },
    optimizedFor: 'Google Ads traffic that needs message match, speed, and conversion events',
    comparisonHighlights: {
      hero: 'Paid-click waste framing aimed at Google Ads spend',
      problem: 'CPC math, conversion lift ranges, and Quality Score cost of mismatch',
      proof: 'Built to convert paid traffic, not just ship a pretty render',
      qualifier: 'Fit for active or imminent Google Ads spend with real event needs',
      faq: 'Quality Score, event tracking, ad specialists, and ad-group variants',
    },
  },
  productLaunches: {
    slug: 'productLaunches',
    route: '/landing-pages/for-product-launches',
    metaTitle: 'Product Launch Landing Pages | Custom Next.js Builds | Vizantir',
    metaDescription:
      'Custom landing pages for product launches. Built to convert launch traffic on day one. Campaign Landing Page and Conversion System tiers from $3,500.',
    hero: {
      eyebrow: 'Landing pages for product launches',
      headline: 'Your launch deserves a page built for launch day.',
      subheadline:
        'Adding a new product to your existing site menu is a rounding error. A launch needs a page built around the offer, the launch mechanics, and the traffic sources driving people to it. Vizantir builds launch landing pages on Next.js, wired for the campaign, ready for launch day, and structured so waitlist, cold, and existing-customer audiences can each get a variant without three separate builds.',
      ctaLabel: 'Book a strategy call',
      trackingLocation: 'landing_pages_product_launches_hero',
    },
    homepageProblem: {
      heading: "A launch buried in the nav isn't a launch.",
      body: "You spent months on the product. Weeks on the launch plan. Days on the email sequence. Then the traffic arrives at your homepage and has to find the launch from a nav dropdown. Every extra click before the offer costs conversions. Launch traffic behaves differently from evergreen traffic. It's intent-loaded, time-boxed, and audience-specific. It needs a page built for that behavior. A cohort that opens for 14 days, a waitlist that converts in 72 hours after announce, an existing customer upsell that should never share a hero with cold traffic: those are different pages wearing the same brand, not one homepage section trying to do all three jobs.",
      bullets: [
        'Launch traffic is time-boxed. The page has to convert during the window.',
        'Launch audiences come from specific channels. The page has to match the channel promise.',
        "Launches carry urgency. Homepages can't.",
        'Post-launch, the page becomes the evergreen sales asset for the offer.',
      ],
    },
    faqs: [
      {
        question: 'How fast can you build a launch page?',
        answer:
          'Campaign Landing Page ships in 2-3 weeks. Conversion System in 4-5 weeks. If you have a launch date, we scope backward from it during the strategy session. Rush timelines are possible on Campaign Landing Page for a fee when the offer and copy are already locked. Example: a June 15 cohort open with copy approved by May 20 can still fit Conversion System scope if strategy happens the first week of May. Book a call to check availability against your date.',
      },
      {
        question: 'What if the product changes before launch?',
        answer:
          "Launch products change. We build with editable content structure so late-stage messaging, pricing, or feature changes don't require a rebuild. Changes inside the 2 revision rounds are included. Structural changes (new sections, new conversion paths, new variant audiences) are scoped separately so a last-minute pricing tweak does not reopen the whole build.",
      },
      {
        question: 'Do you handle the launch email sequence too?',
        answer:
          'Vizantir builds the landing page and the tracking. Email sequences, lifecycle automation, and campaign management belong to your marketing team or partner. We integrate cleanly with the major email platforms (Klaviyo, ConvertKit, Mailchimp, HubSpot, Customer.io) so the launch machinery hooks up on day one. Form submits and CTA events are named to match the tags your sequence already expects whenever you give us that map in strategy.',
      },
      {
        question: 'What happens to the page after the launch is over?',
        answer:
          'That depends on the product. Time-boxed launches (a course cohort, an event, a limited edition) get archived or redirected after the window closes. Evergreen products (a new SaaS, a permanent service line) keep the page as the ongoing sales asset, often the highest-converting page on the site because it was built around one specific action. We document both paths in the handoff so your team is not guessing on day 15.',
      },
      {
        question: 'Should I get Campaign Landing Page or Conversion System for a launch?',
        answer:
          "If it's one product launched to one audience with clear copy, Campaign Landing Page at $3,500 fits. If you're launching to multiple audiences (waitlist vs. cold, existing customers vs. new, region-specific), or need messaging workshop and deeper tracking, Conversion System at $8,000 gives you variant landing pages built on a shared system. Right-sized messaging per audience without three separate builds. A typical Conversion System launch uses the primary for cold traffic, one variant for waitlist warm-up, and one for existing customers with different proof and CTA language.",
      },
    ],
    closingCta: {
      heading: 'Launch day deserves a page built for it.',
      subheading:
        '30 minutes to reverse-plan from your launch date, pick the right tier, and lock the audience variants before traffic hits.',
      ctaLabel: 'Book a strategy call',
      trackingLocation: 'landing_pages_product_launches_closing',
    },
    proofPointsCallout:
      'Launch-day pages built to convert in the window that matters',
    qualifierOverrides: {
      fit: [
        'You have a launch date and need the page ready before traffic and email sequences fire',
        'You are launching to more than one audience and need messaging that fits each group',
      ],
      notFit: [
        'The product, offer, and pricing are still undefined and you want us to invent them',
      ],
    },
    processEmphasis: {
      step: 'launch',
      label: 'Most critical when the calendar is fixed and the window is short',
    },
    optimizedFor: 'Time-boxed product launches with channel-specific traffic and urgency',
    comparisonHighlights: {
      hero: 'Launch-day framing for offer mechanics and campaign traffic',
      problem: 'Nav-buried launches, time-boxed windows, and audience-specific pages',
      proof: 'Built to convert inside the launch window that actually matters',
      qualifier: 'Fit for dated launches and multi-audience go-to-market',
      faq: 'Timelines, late product changes, email handoff, and post-launch life',
    },
  },
}

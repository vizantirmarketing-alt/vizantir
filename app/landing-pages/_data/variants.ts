export type VariantSlug = 'primary' | 'googleAds' | 'productLaunches'

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
}

export const variants: Record<VariantSlug, LandingPageVariant> = {
  primary: {
    slug: 'primary',
    route: '/landing-pages',
    metaTitle: 'Landing Page Design & Development | Vizantir',
    metaDescription:
      'Custom landing pages built on Next.js. Strategy, design, and conversion-focused development. Campaign ($3K), Conversion ($4.5K), and Campaign System ($7.5K) tiers.',
    hero: {
      eyebrow: 'Landing pages by Vizantir',
      headline: 'Your homepage is doing too much.',
      subheadline:
        "When a campaign, offer, or ad spend needs one focused page instead of a homepage trying to serve everyone, that's when a landing page earns its keep. Vizantir builds them from scratch on Next.js, matched to your brand, wired to your analytics.",
      ctaLabel: 'Book a strategy call',
      trackingLocation: 'landing_pages_primary_hero',
    },
    homepageProblem: {
      heading: 'The homepage is not a landing page.',
      body: "A homepage is a lobby. It routes visitors to services, portfolios, about, contact, careers. That's the right job for a homepage. It's the wrong job for a $5,000 Google Ads campaign or a product launch that needs one specific action. Sending paid traffic to a homepage costs money on every click that bounces to a page not built for the offer.",
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
          "A website answers 'what does this business do?' — a landing page answers 'why should I take this specific action right now?' Different job, different scope, different price. Landing pages start at $3,000 and ship in 2-3 weeks. Full custom websites start at $15,000 and ship in 6-8 weeks.",
      },
      {
        question: 'Which tier should I pick?',
        answer:
          "If you have a specific offer and clear copy, Campaign at $3,000 is likely right. If you're running paid traffic and need messaging refinement plus behavior tracking, Conversion at $4,500 earns the premium. If you're running multiple audiences or campaigns and want variant testing, Campaign System at $7,500 is built for that. If you're not sure, book a strategy call — 20 minutes is usually enough to scope which tier fits.",
      },
      {
        question: 'Do you write the copy?',
        answer:
          'Copy collaboration is included at every tier. Campaign tier uses your copy with light editing. Conversion tier includes substantial copy refinement and a messaging workshop. Campaign System applies that workshop across all variants.',
      },
      {
        question: 'Can I add a landing page to an existing Vizantir website?',
        answer:
          'Yes. Existing Vizantir website clients get an existing-site page rate starting at $1,500 because the design system, components, and brand infrastructure are already built.',
      },
      {
        question: 'Can you run the ad campaigns too?',
        answer:
          'Vizantir builds the landing page and the tracking behind it. For paid campaign management, we can recommend trusted ad partners who run traffic to pages we build.',
      },
      {
        question: 'What analytics do you set up?',
        answer:
          'Vercel Analytics for pageviews and event tracking on every tier. Microsoft Clarity for behavior tracking on Conversion and above. Conversion events are configured per your specific goals during the strategy session.',
      },
    ],
    closingCta: {
      heading: 'One page. One goal. Book a call.',
      subheading:
        '20 minutes to scope which tier fits your campaign and what the timeline looks like.',
      ctaLabel: 'Book a strategy call',
      trackingLocation: 'landing_pages_primary_closing',
    },
  },
  googleAds: {
    slug: 'googleAds',
    route: '/landing-pages/for-google-ads',
    metaTitle: 'Google Ads Landing Pages | Custom Built on Next.js | Vizantir',
    metaDescription:
      'Custom landing pages for Google Ads campaigns. Built for conversion, not templates. Campaign, Conversion, and Campaign System tiers from $3,000.',
    hero: {
      eyebrow: 'Landing pages for Google Ads',
      headline: "You're paying for clicks. Your homepage isn't paying you back.",
      subheadline:
        "Sending Google Ads traffic to your homepage is spending money to load a page that isn't built for the offer. Vizantir builds custom landing pages that match your ad copy, load fast on mobile, and track every conversion event you need.",
      ctaLabel: 'Book a strategy call',
      trackingLocation: 'landing_pages_google_ads_hero',
    },
    homepageProblem: {
      heading: 'The math of a homepage for paid traffic.',
      body: "Google Ads at $5 CPC, 100 clicks per day, means $500 daily spend. If your homepage converts at 2% because it's a lobby routing traffic to services and blog posts, that's 2 conversions for $500. A landing page built for one specific offer routinely converts at 5-15% for the same audience. Same spend, 2.5x to 7.5x more leads. The landing page pays for itself inside the first month of ad spend.",
      bullets: [
        'Every unmatched ad-to-page transition costs Quality Score.',
        'Homepages carry navigation that gives visitors 8 ways to leave without converting.',
        'Ad copy promises specifics — homepages describe the business.',
        'Landing pages are the standard in every paid traffic playbook for a reason.',
      ],
    },
    faqs: [
      {
        question: 'Do you work with Google Ads specialists?',
        answer:
          "Yes. Vizantir builds the landing page and conversion tracking. Ad campaign management, keyword strategy, and bid management belong to your Google Ads specialist. If you don't have one, we can recommend trusted partners who work well with our page builds.",
      },
      {
        question: 'Which tier fits Google Ads best?',
        answer:
          "For most paid traffic, Conversion at $4,500 is the right tier because it includes offer and messaging workshop, substantial copy refinement, Microsoft Clarity behavior tracking, and detailed conversion event tracking. If you're running multiple ad groups targeting different audiences, Campaign System at $7,500 lets you match landing page variants to ad group intent.",
      },
      {
        question: 'How do you handle Quality Score?',
        answer:
          "Landing page relevance is one of three Quality Score factors. Vizantir builds pages that match your ad copy language, load under 2.5 seconds on mobile, and use clear conversion-focused messaging — all of which support relevance scoring. We don't manage the ad account itself, but our page builds are optimized for the signals Google measures.",
      },
      {
        question: 'What conversion events do you track?',
        answer:
          'Form submissions, button clicks, phone taps, scroll depth, video plays, and any custom events your Google Ads campaign optimization needs. Events are configured during the strategy session and verified in Google Ads before handoff.',
      },
      {
        question: 'Can you build multiple landing pages for different ad groups?',
        answer:
          "That's Campaign System tier. One primary landing page plus 2 variants (audience, offer, headline, or location-based) built on a shared component system. Additional variants beyond the included 2 are quoted as smaller add-ons because the infrastructure is already built.",
      },
    ],
    closingCta: {
      heading: 'Stop sending paid traffic to a homepage.',
      subheading: 'Book a call to scope a landing page built for your ad spend.',
      ctaLabel: 'Book a strategy call',
      trackingLocation: 'landing_pages_google_ads_closing',
    },
  },
  productLaunches: {
    slug: 'productLaunches',
    route: '/landing-pages/for-product-launches',
    metaTitle: 'Product Launch Landing Pages | Custom Next.js Builds | Vizantir',
    metaDescription:
      'Custom landing pages for product launches. Built to convert launch traffic. Campaign, Conversion, and Campaign System tiers from $3,000.',
    hero: {
      eyebrow: 'Landing pages for product launches',
      headline: 'Your launch deserves a page built for launch day.',
      subheadline:
        'Adding a new product to your existing site menu is a rounding error. A launch needs a page built around the offer, the launch mechanics, and the traffic sources driving people to it. Vizantir builds launch landing pages on Next.js, wired for the campaign, ready for launch day.',
      ctaLabel: 'Book a strategy call',
      trackingLocation: 'landing_pages_product_launches_hero',
    },
    homepageProblem: {
      heading: "A launch buried in the nav isn't a launch.",
      body: 'You spent months on the product. Weeks on the launch plan. Days on the email sequence. Then the traffic arrives at your homepage and has to find the launch from a nav dropdown. Every extra click before the offer costs conversions. Launch traffic behaves differently from evergreen traffic — it\'s intent-loaded, time-boxed, and audience-specific. It needs a page built for that behavior.',
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
          'Campaign tier ships in 2-3 weeks. Conversion tier in 3-4 weeks. Campaign System in 4-5 weeks. If you have a launch date, we scope backward from it during the strategy session. Rush timelines are possible on Campaign tier for a fee — book a call to check availability.',
      },
      {
        question: 'What if the product changes before launch?',
        answer:
          "Launch products change. We build with editable content structure so late-stage messaging, pricing, or feature changes don't require a rebuild. Changes inside the 2 revision rounds are included. Structural changes are scoped separately.",
      },
      {
        question: 'Do you handle the launch email sequence too?',
        answer:
          'Vizantir builds the landing page and the tracking. Email sequences, lifecycle automation, and campaign management belong to your marketing team or partner. We integrate cleanly with the major email platforms (Klaviyo, ConvertKit, Mailchimp, HubSpot, Customer.io) so the launch machinery hooks up on day one.',
      },
      {
        question: 'What happens to the page after the launch is over?',
        answer:
          'That depends on the product. Time-boxed launches (a course cohort, an event, a limited edition) get archived or redirected after the window closes. Evergreen products (a new SaaS, a permanent service line) keep the page as the ongoing sales asset — often the highest-converting page on the site because it was built around one specific action.',
      },
      {
        question: 'Should I get Campaign or Campaign System for a launch?',
        answer:
          "If it's one product launched to one audience, Campaign at $3,000 or Conversion at $4,500 fits. If you're launching to multiple audiences (waitlist vs. cold, existing customers vs. new, region-specific), Campaign System at $7,500 gives you variant landing pages built on a shared system — right-sized messaging per audience without three separate builds.",
      },
    ],
    closingCta: {
      heading: 'Launch day deserves a page built for it.',
      subheading: 'Book a call to scope your launch landing page.',
      ctaLabel: 'Book a strategy call',
      trackingLocation: 'landing_pages_product_launches_closing',
    },
  },
}

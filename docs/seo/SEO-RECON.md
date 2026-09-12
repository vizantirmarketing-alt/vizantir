# Vizantir Design Studio — SEO / AEO / GEO reconnaissance

Investigation only. No implementation. Written 2026-09-11 from the live site at `https://www.vizantir.com` (curl with a browser User-Agent; a sandbox curl without that UA received HTTP 403) and from this repository. Every row cites evidence. Claims that were not observed are marked **cannot verify**.

Do not treat this document as an implementation plan. Section 15 is an unprioritized, unsequenced list.

---

## 1. Executive summary

The live site is a Next.js 16 marketing surface on Vercel with Sanity-backed blog, services, and case studies. Raw HTML for every inspected public route already contains titles, meta descriptions, one H1, body copy, and JSON-LD; no inspected page hides critical SEO content behind client-only hydration. Crawl basics work: HTTPS and apex-to-www redirects, trailing-slash 308s, a real HTTP 404, legal `noindex`, and a 97-URL sitemap that omits legal and `/technology/{slug}` by design. Intel already ingests Search Console query-page rows and, in a stored 2026-08-11–2026-09-07 detector window, had already surfaced `website-design`, `next-seo`, `squarespace-vs-custom-website`, `wordpress-security`, `law-firm`, and a Reno geo-signal — that data outranks any keyword hypothesis in this file. The commercial architecture is built: service pages, three verticals, two Las Vegas pages, a priced landing-page family, and a Next.js vs WordPress pillar. The blog is a 49-post cluster that is heavy on WordPress comparison and cost, with titles on the index that speculate about other firms’ motives, almost no post-to-post links in the ten posts fetched in full, and two cost URLs that target the same intent. Homepage H1 is a craft line (“who did this?”) while the title targets “Custom Web Design in Las Vegas”; Intel’s only stored within-reach commercial slug is `website-design`, not Next.js. FAQPage is widespread and HowTo exists on `/how-we-work` and `/get-started`; both are flagged here at Info and are not recommended for addition or removal. `llms.txt` and `llms-full.txt` are present and are not citation levers. Intel can evaluate future impressions, clicks, position, scan-derived thin/metadata/schema-drift, and robots.txt crawler hits; it cannot evaluate indexation APIs, AI Overview or AI Mode appearances, backlinks, or GSC crawl errors.

---

## 2. Current SEO implementation

| Item | Status bucket | Evidence | Notes |
|---|---|---|---|
| `robots.txt` live | ALREADY IMPLEMENTED | `GET https://www.vizantir.com/robots.txt` → 200. Body matches `app/robots.txt/route.ts:58-72`: `Allow: /`; `Disallow: /api/`, `/admin/`, `/studio/`, `/intel/`, `/r/`; explicit `Allow: /` for GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, Claude-Web, Google-Extended, CCBot; `Sitemap: https://www.vizantir.com/sitemap.xml`. | Applebot-Extended and Bytespider have no dedicated group. They fall under `User-Agent: *`. Intel’s crawler map lists them under `other` (`lib/intel/crawlers.ts:58-66`). |
| XML sitemap generation | ALREADY IMPLEMENTED | Live `GET /sitemap.xml` → 200, 97 `<url>` entries, each with `<lastmod>`. Source: `app/sitemap.ts` (`revalidate = 3600`), Sanity `sitemapQuery` (`lib/sanity/queries.ts:242-246`). | WebFetch without a browser UA earlier returned 500; curl with Chrome UA returned 200. Treat the 500 as a fetch-tool artifact, not a confirmed site failure. |
| Sitemap inclusions | ALREADY IMPLEMENTED | 29 static paths from `STATIC_ROUTES` (`app/sitemap.ts:75-114`) + 49 `/blog/*` + 7 `/services/*` + 11 `/case-studies/*` = 97. | Includes `/llms.txt` and six `/play*` URLs. |
| Sitemap exclusions | ALREADY IMPLEMENTED | Comment at `app/sitemap.ts:62-73`: `/privacy`, `/terms`, `/cookies`, `/copyright` (noindex); all `/technology/{slug}` (14 URLs) omitted on purpose. Live legal pages return `robots: noindex, follow`. | Omission of technology slugs is not a deindex request; they remain linked from `/technology` and `/sitemap-page`. |
| Sitemap lastmod | PARTIALLY IMPLEMENTED | Static dates hardcoded in `STATIC_PAGE_DATES` (`app/sitemap.ts:22-53`), e.g. home `2026-09-05`, about `2026-08-15`. Sanity URLs use `_updatedAt` (blog lastmods cluster on 2026-09-02 and 2026-09-06; Beacon case study `2026-09-10T04:28:13.000Z`). | File comment warns stale dates train Google to ignore lastmod. Whether each static date matches the last visible content change **cannot verify** without a content changelog. |
| Canonicals, www, HTTPS | ALREADY IMPLEMENTED | `trailingSlash: false` (`next.config.ts:9`). Live: `https://vizantir.com/` → 307 → `https://www.vizantir.com/` 200; `http://www.vizantir.com/` → 308 → https www 200; `/about/` → 308 → `/about` 200. Inspected marketing pages emit self-canonical `https://www.vizantir.com{path}`. | `/play` and `/play/offline` have no canonical tag (live HTML). 404 has none. UTM query `/?utm_source=test` → 200 on the query URL; homepage canonical remains `https://www.vizantir.com`. |
| `page_id` query | ALREADY IMPLEMENTED | Live `/?page_id=12` → 308 → `/`. `proxy.ts:6-14` strips `page_id` on `/` only. | Config redirects re-append unmatched params; the proxy exists to avoid a loop. |
| Legacy redirects | ALREADY IMPLEMENTED | `next.config.ts:43-76`. Live: `/portfolio` → 308 `/case-studies` 200; `/blog/wordpress-vs-nextjs-2026` and `/blog/wordpress-vs-nextjs-honest-comparison` → 301 `/nextjs-vs-wordpress` 200. | No `vercel.json` redirects. Other renamed routes **cannot verify** (git history was not read; workspace rule forbids git commands). |
| 404 status | ALREADY IMPLEMENTED | `GET /this-page-does-not-exist-xyz` → **404**. HTML title is the default brand title; `robots: noindex`; H1 `404`. `app/not-found.tsx`. | Soft-404 not observed. 404 title does not say “not found”; noise for a non-indexed URL. |
| Metadata generation | ALREADY IMPLEMENTED | Root `generateMetadata` in `app/layout.tsx:185-242` (Sanity `siteSettings` + fallbacks, title template `%s \| {siteName}`). Pages that need a full title use `title.absolute`. Blog/service/case-study pages use Sanity `generateMetadata`. | Default OG image is `/og-image.png`. No `opengraph-image.tsx` routes. |
| GSC / Bing verification | ALREADY IMPLEMENTED | Live homepage `<head>` includes `google-site-verification` `9fHYiqVv9NBxjFJVchlxgtrDMuObpUK8eKuUEsGTkFo` and `msvalidate.01` `2CBE6E049F1819DD41157125787904CB` (`app/layout.tsx:260-261`). Optional Sanity `googleVerification` also wired (`app/layout.tsx:237-241`). | Property string used by Intel is env `GSC_SITE_URL`, not hardcoded. `docs/intel/PLAN.md` notes coverage seed `https://www.vizantir.com/`. Live env value **cannot verify**. |
| Title / description coverage (inspected routes) | PARTIALLY IMPLEMENTED | All inspected 200 pages have a unique `<title>` and meta description. Length outliers: `/sitemap-page` title 18 chars; `/play` 22; `/technology` description 183; `/website-redesign-las-vegas` description 195; `/case-studies/evolve-dance-center` description 234; `/privacy` description 77. | AgriciDaniel title 30–60 / description 120–160 is a gate, not a ranking law. Short utility titles are noise. Long descriptions truncate in SERP; they still exist. |
| One H1 per page | ALREADY IMPLEMENTED | Every inspected HTML document has exactly one `<h1>`. | Homepage H1 text concatenates spans: “We build websitesthat make people stop and say—who did this?” (missing space between `websites` and `that` in the text node). Title is “Custom Web Design in Las Vegas \| Vizantir”. |
| Public route architecture | ALREADY IMPLEMENTED | See route list below. Sources: `app/**/page.tsx`, `app/sitemap.ts`, live sitemap, `data/sitemap-page.ts`. | `/schema-debug` 404s in production (`app/schema-debug/[...path]/page.tsx`). `/intel`, `/studio`, `/r/` are disallowed in robots and noindexed. |
| Internal linking | PARTIALLY IMPLEMENTED | Main nav: Home, About, Services, Our Work, How We Work, Are We a Fit?, Contact (`data/navigation.ts:8-19`). Footer adds Industries, Technology, Blog, FAQ, Next.js vs WordPress, Landing Pages, Analytir, Play, Get Started, five verticals (`components/footer/Footer.tsx:87-150`). Ten fetched blog posts contain **zero** other `/blog/{slug}` hrefs. `BlogPostContent.tsx` has no related-posts or commercial CTA block. | Footer commercial links appear on almost every page, so posts are not orphans. Contextual spoke-to-spoke and body-to-service links were not observed on those ten posts. |
| JSON-LD emission | ALREADY IMPLEMENTED | Server `JsonLd` (`components/seo/JsonLd.tsx`) plus layout `BusinessJsonLd` / `WebSiteJsonLd` (`app/layout.tsx:63-164`). Live homepage types: Organization, LocalBusiness, ProfessionalService, WebSite, WebPage, FAQPage. Builders in `lib/schema/index.ts`. | HowTo on `/how-we-work` and `/get-started` (live). FAQPage on home, FAQ, services, verticals, landing pages, fit, comparison. No `SearchAction` on WebSite (live homepage `SearchAction` false). |
| Images / fonts / CWV readiness | PARTIALLY IMPLEMENTED | Satoshi via `next/font/local`, `display: 'swap'` (`app/layout.tsx:23-48`). Next Image AVIF/WebP (`next.config.ts:15-27`). LiquidMetalTorus lazy + `requestIdleCallback` 500ms (`components/homepage/Hero.tsx:9-50`). Homepage `next/dynamic` sections default SSR. Play canvases `ssr: false` (`components/arcade/GameStage.tsx`). Framer Motion `initial={{ opacity: 0 }}` on several blocks; the text is still in the HTML. HSTS `max-age=63072000` on live HTML. Cache-Control `public, max-age=0, must-revalidate` with `age` on HTML. | No Lighthouse/PSI **site** results stored for vizantir.com. Client PSI/CrUX exist for **other** clients (`lib/psi/sync.ts`, `lib/reports/crux.ts`). Field CWV for this hostname **cannot verify**. |
| Rendering / caching | ALREADY IMPLEMENTED | `sanityFetch` ISR 3600s (`lib/sanity/client.ts`). Sitemap and `/sitemap-page` `revalidate = 3600`. HTML `must-revalidate`; `/llms.txt` `max-age=3600`. | Not a fully static export. |
| Blog taxonomy | PARTIALLY IMPLEMENTED | Categories exist as a client filter on `/blog` (`lib/blog-categories.ts`, `app/blog/BlogPageClient.tsx:48-61`). All 49 cards are in the index HTML (50 H2s). No `/blog/category/{slug}` routes. No pagination. No author routes (`app/about/[slug]` does not exist). | Schema may emit `/about/{authorSlug}` for non-founder authors (`lib/schema/index.ts:461-467`). Ten fetched posts are by James Tram (founder → `/about`). |
| Location / NAP | PARTIALLY IMPLEMENTED | Visible and schema: phone `+1 (702) 289-0758` / `+17022890758`; email `info@vizantir.com`; locality Las Vegas, NV 89139; geo 36.0395, -115.2511; areaServed Las Vegas / Henderson / Summerlin / Paradise / Nevada / United States (`app/layout.tsx:69-106`, `data/contact.ts`). `sameAs`: LinkedIn company, Instagram, GBP `cid=7927126809305841776`. Hours in `data/contact.ts:18-21` (Mon–Fri 9–6 PST). Layout fallback sets `hasPhysicalLocation: false` (`app/layout.tsx:181`). | No `streetAddress` in Organization schema. No Clutch/GitHub in homepage HTML (0 “clutch” matches). Person `sameAs` on `/about` includes LinkedIn, Clutch, GBP, GitHub (`app/about/page.tsx:28-33`). |
| Conversion path | ALREADY IMPLEMENTED | Strategy Call = `/contact` form (`ContactPageClient` → `/api/contact`). Chatbot `VizantirChat` on non-bare chrome (`components/SiteChrome.tsx`). No Calendly/cal.com embed found in app code. Homepage primary hero CTA is “View Our Work” → `/case-studies` (`Hero.tsx:214`); footer CTA → `/contact`. | Commercial pages inspected include `/contact` in the footer and usually a page-level CTA. |

### Public routes (source)

**Home.** `/` — `app/page.tsx`, Sanity FAQs + featured case studies.

**Services.** `/services` static. `/services/{website-strategy,web-design,web-development,landing-pages,website-refreshes,cms-integrations,website-care}` — Sanity `generateStaticParams`. `/services/landing-pages` canonicals to `/landing-pages` (live canonical observed; `app/services/[slug]/page.tsx:45-47`).

**Industry / vertical / geo.** `/industries`; `/hospitality-web-design`; `/law-firm-web-design`; `/commercial-real-estate-web-design`; `/las-vegas-web-design`; `/website-redesign-las-vegas`. All static `app/*/page.tsx`.

**Landing pages.** `/landing-pages`, `/landing-pages/for-google-ads`, `/landing-pages/for-product-launches`.

**Case studies.** `/case-studies` + 11 Sanity slugs in the live sitemap: `essence-of-watches`, `high-roller-legal`, `pink-salt-salon`, `elorae-nails`, `fuji-omakase`, `eclat-lounge`, `petale-fete`, `beacon-of-light-music`, `evolve-dance-center`, `golden-era-integra`, `meridian-row`.

**Blog.** `/blog` + 49 Sanity slugs (full list in §5).

**About / fit / process.** `/about`, `/are-we-a-fit`, `/how-we-work`, `/get-started`, `/faq`, `/nextjs-vs-wordpress`, `/contact`.

**Technology.** `/technology` (in sitemap) + 14 slugs in `app/technology/_data.ts` (not in XML sitemap): `nextjs`, `sanity`, `vercel`, `tailwind`, `typescript`, `react`, `supabase`, `stripe`, `resend`, `cloudflare`, `gsap`, `framer-motion`, `analytics`, `microsoft-clarity`.

**Legal (noindex, not in XML sitemap).** `/privacy`, `/terms`, `/cookies`, `/copyright`.

**Hidden / utility.** `/play` and five games (in sitemap); `/play/offline` (noindex, not in sitemap); `/sitemap-page`; `/analytir`; `/llms.txt`, `/llms-full.txt`, `/pricing.md`.

**Not public marketing.** `/intel/*`, `/studio`, `/r/[token]`, `/api/*`, `/schema-debug` (production 404).

---

## 3. Current AEO implementation

AEO here means extractable answers on indexable pages. It is not a separate ranking system.

| Item | Status bucket | Evidence | Notes |
|---|---|---|---|
| Direct-answer / passage blocks (130–170 words, self-contained) | PARTIALLY IMPLEMENTED | `/nextjs-vs-wordpress` ships an explicit 67-word “direct answer” (`data/nextjs-vs-wordpress.ts:15-17`) and a comparison table; live page 2448 words, H1 is a question. Homepage hero paragraph is one sentence of positioning plus price/timeline (`Hero.tsx:203-207`), well under 130 words. Service pages use a repeated H2 template (“How we approach this”, “What you get”, …) observed live on all seven slugs. | 67 words is a lead, not a 130–170 block. Homepage and service bodies are short paragraphs (one idea), which helps extractability, but few blocks answer one question without surrounding UI chrome. |
| Question-form headings | PARTIALLY IMPLEMENTED | Present: `/nextjs-vs-wordpress` H1 “Should I Use Next.js or WordPress?”; several blog H1s are questions (cost, Squarespace, custom website, law firm). Homepage FAQ H2 is “Questions? Answered.”; individual questions are `<button>`s, not headings (`components/homepage/FAQSection.tsx:80+`). `/faq` H1 is “Frequently Asked Questions”; questions are accordion triggers, not H2s (live H2 count = 1). | Answers **are** in the server HTML (`/faq` ~707 words). Hierarchy does not mark them as headings. |
| Entity clarity (what / where / who / cost) | ALREADY IMPLEMENTED | Layout JSON-LD name “Vizantir Design Studio”, alternateName “Vizantir”, Las Vegas, founder James Tram, priceRange `$$$`, parent JT Holdings Corp (`app/layout.tsx:69-120`). `llms.txt` states $15,000 / $30,000 / $60,000+ and care $295–$1,500 (live 200). Homepage hero states projects start at $15,000, six to twelve weeks. About names James Tram and 25 years operating businesses (`data/about.ts:113-115`). | Street address absent. `hasPhysicalLocation: false` in the settings fallback. Cost is stated on services, llms.txt, and several posts. |
| Factual attribution | PARTIALLY IMPLEMENTED | Fetched posts cite named sources in body (e.g. Patchstack 2026, Codeable, Naturaily, Kinsta/WP Engine on the cost and security posts). Homepage and service templates do not attribute external stats. | Claims on the site are recorded as claims, not validated. |
| Comparison content | ALREADY IMPLEMENTED | Live `/nextjs-vs-wordpress` (2448 words, ItemList + FAQPage). Blog cluster of platform comparisons (see §5). Intel `within-reach:squarespace-vs-custom-website` in `docs/intel/baselines/2026-09-09-detector-window-pre-correction.json:51-58`. | Pillar exists. Cluster overlap is a cannibalization question (§10), not an AEO absence. |
| Structured data reinforcing answers | PARTIALLY IMPLEMENTED | FAQPage wraps visible FAQs on home, `/faq`, services, verticals, landing pages, `/how-we-work`, `/are-we-a-fit`, `/nextjs-vs-wordpress` (live types). Service + Offer nodes carry prices on `/services` catalog and verticals. HowTo on process/get-started. | FAQPage has had no Google rich result since 2026-05-07 (AgriciDaniel schema-types.md). Flag at Info. Do not claim AI citation benefit. Do not recommend adding or removing it. HowTo rich results removed 2023-09; flag, never recommend. |
| Semantic hierarchy | PARTIALLY IMPLEMENTED | Inspected pages: H1 → H2, no H1→H3 skips on commercial templates. `/faq` skips from H1 to a single H2. `/sitemap-page` H1 only. | FAQ accordion is the main hierarchy gap. |
| Answer readiness / snippet eligibility | ALREADY IMPLEMENTED | Inspected indexable pages return 200, `robots: index, follow`, self-canonical, content in initial HTML. Legal and `/play/offline` are noindex. | Eligibility floor is indexation + snippet-capable HTML. That floor is met on the commercial set. |

---

## 4. Current GEO implementation

GEO is evaluated as SEO eligibility plus crawler access and entity consistency. Not as AI-keyword rewriting or chunking.

| Item | Status bucket | Evidence | Notes |
|---|---|---|---|
| AI crawler robots | ALREADY IMPLEMENTED | Live robots.txt explicit Allow for GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, Claude-Web, Google-Extended, CCBot. `User-Agent: *` Allow `/`. | Blocking Google-Extended would not affect Google Search or AI Overviews; it is **allowed** here. Applebot-Extended, Bytespider, Amazonbot have no named group; `*` allows them. Intel records hits only when those UAs request `/robots.txt` (`app/robots.txt/route.ts:10-14`, `lib/intel/crawlers.ts`). |
| `llms.txt` / `llms-full.txt` | ALREADY IMPLEMENTED | Live both 200. `app/llms.txt/route.ts`, `app/llms-full.txt/route.ts`. Robots comment `# AI context: /llms.txt`. HTML `Link` alternates in `next.config.ts:80-87`. `/llms.txt` is in the XML sitemap. `/pricing.md` also 200. | Present. Not a Google citation lever. Do not treat creating or expanding these as an SEO or GEO action. |
| Entity representation | PARTIALLY IMPLEMENTED | Consistent studio name, founder, phone, city, Next.js positioning across layout JSON-LD, `llms.txt`, about copy, and contact data. Person `sameAs` adds Clutch and GitHub (`app/about/page.tsx:28-33`). Organization `sameAs` is LinkedIn, Instagram, GBP only (`app/layout.tsx:107-111`). | No open-web hunt for unreferenced profiles. Clutch/GitHub are schema-only on about, not in homepage HTML. Street address missing. |
| Citation readiness | PARTIALLY IMPLEMENTED | First-party numbers and process are stated (pricing tiers, 50% deposit, 6–12 weeks, launched-site blurbs in `llms.txt`). Case studies exist as CreativeWork. Blog posts fetched include named third-party reports. | Original evidence is strongest on launched-site narratives and published prices. Awards, rankings, and traffic claims were not invented here and were not independently checked. |
| AI Overview / AI Mode appearances | CANNOT VERIFY | Intel has no ingest for AI Overview or AI Mode (`docs/SEARCH_INTELLIGENCE_ARCHITECTURE.md` §1–13; `AiPlatformsPanel` is robots.txt crawler visits). No stored appearance log in the repo. | Crawler hits ≠ retrieval or citation. |
| Snippet / index eligibility | ALREADY IMPLEMENTED | See §3. Commercial and blog URLs in the sitemap are 200 + indexable on the sample. | `/play*` is indexable and in the sitemap; that is a crawl-allocation choice, not a GEO feature. |

---

## 5. Current content architecture

### Blog inventory

49 posts in the live sitemap and on `GET /blog` 200 (49 `/blog/` hrefs). Word counts below are live HTML with `script`/`style`/`nav`/`footer` stripped — an approximation, same spirit as `lib/scan/parse.ts`. Posts not fetched in full: word count **cannot verify**.

| Slug | Title (from `/blog` H2 or fetched `<title>`) | Inferred topic | Words (live) | Sitemap lastmod | Publish / modified (JSON-LD, if fetched) | Intent | In / out links (fetched only) |
|---|---|---|---|---|---|---|---|
| how-much-does-a-website-cost-las-vegas | How Much Does a Website Cost in Las Vegas? (2026 Breakdown) | Local website cost | 938 | 2026-08-07 | 2026-03-01 / 2026-08-07 | Commercial investigation | Footer commercial set; **0** other blog hrefs |
| how-much-does-website-cost-2026 | How Much Does a Business Website Cost in 2026? | National website cost | 1428 | 2026-09-02 | 2026-01-10 / 2026-09-02 | Commercial investigation | Same; 0 blog hrefs |
| wordpress-vs-nextjs-3-year-cost-comparison | The True 3-Year Cost of WordPress vs Next.js (Real Numbers) | Platform TCO | 974 | 2026-09-06 | 2026-04-10 / 2026-09-06 | Commercial investigation | Links `/nextjs-vs-wordpress` via footer; 0 blog hrefs |
| squarespace-vs-custom-website | Squarespace vs Custom Website: Which Is Right for Your Business? | Platform choice | 1075 | 2026-09-06 | 2026-01-17 / 2026-09-06 | Commercial investigation | 0 blog hrefs |
| nextjs-seo-guide | Next.js SEO: The Complete Guide for Business Websites | Next.js SEO | 1307 | 2026-09-06 | 2026-01-03 / 2026-09-06 | Informational | 0 blog hrefs |
| real-cost-wordpress-security-breach | The Real Cost of a WordPress Security Breach | WP security cost | fetched ~ (passage present; full count in run log with sibling security post) | 2026-09-06 | 2026-04-10 / 2026-09-06 | Informational | 0 blog hrefs |
| law-firm-website-design-las-vegas | What Makes a Good Law Firm Website in Las Vegas? | Law firm sites | 694 | 2026-09-06 | 2026-03-08 / 2026-09-06 | Commercial investigation | Footer includes `/law-firm-web-design`; 0 blog hrefs |
| do-i-need-a-custom-website | Do I Actually Need a Custom Website? An Honest Assessment | Custom vs template | 1114 | 2026-09-06 | 2026-01-06 / 2026-09-06 | Commercial investigation | 0 blog hrefs |
| what-youre-paying-for-30k-website | What You're Actually Paying For With a $30k Website | $30k build composition | 1036 | 2026-09-06 | 2024-12-20 / 2026-09-06 | Commercial investigation | 0 blog hrefs |
| hidden-wordpress-costs-agencies-dont-tell-you | Hidden WordPress Costs Your Agency Is Not Telling You About | Hidden WP costs | 991 | 2026-09-06 | 2026-04-10 / 2026-09-06 | Commercial investigation | 0 blog hrefs |
| launch-website-weekend-what-it-costs | You Can Launch a Website in a Weekend. Here's What That Actually Costs You. | DIY / cheap launch cost | cannot verify | 2026-08-07 | cannot verify | Commercial investigation | cannot verify |
| your-analytics-can-fail-silently | Your Analytics Can Fail Silently. Here's How We Caught One in Hours | Analytics integrity | cannot verify | 2026-09-02 | cannot verify | Informational | cannot verify |
| why-your-website-looks-fine-but-isnt-working | Why Your Website Looks Fine But Isn't Working | Conversion / UX | cannot verify | 2026-08-07 | cannot verify | Commercial investigation | cannot verify |
| why-your-website-needs-to-work-in-every-direction | Why Your Website Needs to Work in Every Direction | Architecture | cannot verify | 2026-09-06 | cannot verify | Informational | cannot verify |
| two-searches-one-key | Two Searches, One Key: How Messy Search Data Breaks Clean Code | Search data / engineering | cannot verify | 2026-09-02 | cannot verify | Informational | cannot verify |
| what-website-monitoring-actually-catches | What Website Monitoring Actually Catches | Monitoring | cannot verify | 2026-09-02 | cannot verify | Informational | cannot verify |
| billion-dollar-companies-use-nextjs | What Billion-Dollar Companies Know About Next.js | Next.js social proof | cannot verify | 2026-09-02 | cannot verify | Informational | cannot verify |
| commercial-real-estate-website-design | What Commercial Real Estate Companies Get Wrong About Their Websites | CRE sites | cannot verify | 2026-09-02 | cannot verify | Commercial investigation | cannot verify |
| do-you-need-yoast-seo | Do You Still Need Yoast in 2026? SEO Without Plugins | Yoast / SEO plugins | cannot verify | 2026-09-06 | cannot verify | Informational | cannot verify |
| faster-website-makes-you-more-money | How a Faster Website Makes You More Money | Performance / revenue | cannot verify | 2026-09-06 | cannot verify | Commercial investigation | cannot verify |
| hospitality-website-design-las-vegas | Why Most Las Vegas Restaurant Websites Drive Guests Away | Hospitality / restaurant | cannot verify | 2026-09-06 | cannot verify | Commercial investigation | cannot verify |
| how-las-vegas-businesses-rank-higher-google | How Las Vegas Businesses Can Rank Higher on Google in 2026 | Local SEO | cannot verify | 2026-09-06 | cannot verify | Informational | cannot verify |
| how-much-does-website-maintenance-cost-2026 | How Much Does Website Maintenance Actually Cost in 2026? | Care / maintenance cost | cannot verify | 2026-08-07 | cannot verify | Commercial investigation | cannot verify |
| how-to-choose-web-design-agency-las-vegas | How to Choose a Web Design Agency in Las Vegas | Vendor selection | cannot verify | 2026-09-02 | cannot verify | Commercial investigation | cannot verify |
| how-to-get-more-bookings-restaurant-website | How to Get More Bookings From Your Restaurant Website | Restaurant conversion | cannot verify | 2026-09-06 | cannot verify | Commercial investigation | cannot verify |
| how-to-speed-up-wordpress | How to Speed Up Your WordPress Site (Without Breaking It) | WP performance | cannot verify | 2026-09-06 | cannot verify | Informational | cannot verify |
| is-wordpress-secure | Is WordPress Secure? What Business Owners Need to Know | WP security | cannot verify | 2026-09-06 | cannot verify | Informational | cannot verify |
| is-wordpress-still-relevant-2026 | Is WordPress Still Worth It in 2026? | WP relevance | cannot verify | 2026-09-06 | cannot verify | Commercial investigation | cannot verify |
| las-vegas-hospitality-website-speed | Why Las Vegas Hospitality Brands Need a Faster Website | Hospitality CWV | cannot verify | 2026-09-06 | cannot verify | Commercial investigation | cannot verify |
| luxury-salon-spa-website-design | What a Luxury Salon or Spa Website Needs to Actually Book Clients | Salon / spa | cannot verify | 2026-08-07 | cannot verify | Commercial investigation | cannot verify |
| nextjs-vs-react-business-website | Next.js vs React: What's the Difference for Business Websites? | Next vs React | cannot verify | 2026-09-05 | cannot verify | Informational | cannot verify |
| questions-to-ask-before-hiring-web-designer | Questions to Ask Before Hiring a Web Designer | Vendor selection | cannot verify | 2026-09-02 | cannot verify | Commercial investigation | cannot verify |
| the-elementor-renewal-charge-that-wasnt-supposed-to-happen | The Elementor Renewal Charge That Wasn't Supposed to Happen | Elementor cost | cannot verify | 2026-09-06 | cannot verify | Informational | cannot verify |
| the-page-builder-stack-your-wordpress-agency-didnt-explain | The Page Builder Stack Your WordPress Agency Didn't Explain | Page builders | cannot verify | 2026-09-06 | cannot verify | Informational | cannot verify |
| true-cost-of-wordpress-website | The True Cost of a WordPress Website | WP TCO | cannot verify | 2026-09-06 | cannot verify | Commercial investigation | cannot verify |
| vercel-vs-wp-engine | Vercel vs WP Engine: Which Hosting is Better for Your Site? | Hosting | cannot verify | 2026-09-06 | cannot verify | Commercial investigation | cannot verify |
| webflow-vs-nextjs | Webflow vs Next.js: A Developer's Honest Take | Webflow vs Next | cannot verify | 2026-09-06 | cannot verify | Commercial investigation | cannot verify |
| website-builders-vs-custom-development | Website Builders vs Custom Development: The Real Tradeoffs | Builders vs custom | cannot verify | 2026-09-06 | cannot verify | Commercial investigation | cannot verify |
| website-speed-matters-business | Why Your Website Speed Is Costing You Customers (And How to Fix It) | Performance | cannot verify | 2026-09-06 | cannot verify | Commercial investigation | cannot verify |
| what-a-vizantir-engagement-discloses-that-a-wordpress-agency-engagement-usually-doesnt | What a Vizantir Engagement Discloses That a WordPress Agency Engagement Usually Doesn't | Engagement transparency | cannot verify | 2026-09-02 | cannot verify | Commercial investigation | cannot verify |
| what-is-a-website-care-plan | What Is a Website Care Plan and Does Your Business Need One? | Care plans | cannot verify | 2026-09-06 | cannot verify | Commercial investigation | cannot verify |
| what-should-a-hotel-website-include | What Should a Hotel Website Include to Drive Direct Bookings? | Hotel sites | cannot verify | 2026-09-06 | cannot verify | Commercial investigation | cannot verify |
| when-wix-makes-sense-and-when-youve-outgrown-it | When Wix Makes Sense (And When You've Outgrown It) | Wix | cannot verify | 2026-09-06 | cannot verify | Commercial investigation | cannot verify |
| why-15000-website-cheaper-than-5000 | Why a $15,000 Website Is Often Cheaper Than a $5,000 One | Price framing | cannot verify | 2026-09-06 | cannot verify | Commercial investigation | cannot verify |
| why-most-agencies-still-use-wordpress | Why Most Agencies Still Use WordPress (And Why We Don't) | Why WP is default | cannot verify | 2026-09-06 | cannot verify | Informational | cannot verify |
| why-we-dont-build-wordpress-sites | Why We Don't Build WordPress Sites Anymore | Studio platform choice | cannot verify | 2026-09-06 | cannot verify | Navigational / philosophy | cannot verify |
| why-wordpress-gets-hacked | Why WordPress Gets Hacked and What to Do About It | WP security | cannot verify | 2026-09-06 | cannot verify | Informational | cannot verify |
| why-wordpress-site-slow | Why Is My WordPress Site So Slow? (And How to Fix It) | WP performance | cannot verify | 2026-09-06 | cannot verify | Informational | cannot verify |
| why-your-competitors-website-looks-better | Why Your Competitor's Website Looks Better Than Yours | Design quality | cannot verify | 2026-09-06 | cannot verify | Commercial investigation | cannot verify |

`real-cost-wordpress-security-breach` was fetched (200, BlogPosting, dates above). A precise integer word count was truncated in the tool log; treat the count as **cannot verify to the integer**, content and dates were observed.

### Topics with substantial coverage

WordPress vs custom/Next.js (pillar + a dozen spokes). Website cost / TCO (six titles). WordPress security (three titles; Intel group `wordpress-security`). Performance / speed (five titles). Hospitality / restaurant / hotel (four titles + `/hospitality-web-design`). Law firm (one post + `/law-firm-web-design`). Las Vegas local (cost, rank, hospitality, vendor-choice posts + two geo pages).

### Isolated posts (single-title topics on the index)

Analytics failure, search-data engineering, website monitoring, Next.js vs React, Yoast, Vercel vs WP Engine, Elementor renewal, billion-dollar Next.js, weekend launch, “work in every direction”. Those can still be useful; they are not a cluster.

### Editorial rule

House rule (this brief): factual platform criticism of WordPress is fine; no mocking WordPress owners or other firms; no speculating about other firms’ motives; no security absolutism.

**Titles on the live `/blog` index that speculate about other firms’ motives or frame “they didn’t tell you”:**

- Hidden WordPress Costs Your Agency Is Not Telling You About
- The Page Builder Stack Your WordPress Agency Didn't Explain
- What a Vizantir Engagement Discloses That a WordPress Agency Engagement Usually Doesn't
- Why Most Agencies Still Use WordPress (And Why We Don't)

Fetched body of `hidden-wordpress-costs-agencies-dont-tell-you` continues that frame (“None of this was in the original quote”). `how-much-does-website-cost-2026` H2: “The Ongoing Costs Most Agencies Don't Mention”.

**Security absolutism:** the fetched `real-cost-wordpress-security-breach` passage says WordPress is the most targeted CMS “not because it's uniquely insecure” and attributes Patchstack counts — that is not absolutism. Full text of `is-wordpress-secure` and `why-wordpress-gets-hacked` **cannot verify**.

### Thin-content gate (this brief)

Commercial pages under ~300 unique body words, blog posts under ~600. Then judge intent.

| URL | Approx. words | Gate | Intent judgment |
|---|---|---|---|
| `/contact` | 164 | Under 300 | Transactional form. More prose is not required for that intent. |
| `/get-started` | 177 | Under 300 | Process teaser + CTA. Overlaps `/how-we-work`. Thin if it is meant to rank; acceptable as a conversion step. |
| `/play` | 124 | Under 300 | Arcade lobby. Not a commercial search page. |
| `/technology/nextjs` | 227 | Under 300 | Stack reference; excluded from XML sitemap by design. |
| `/industries` | 266 | Under 300 | Hub that mostly lists verticals. Thin if it is meant to rank for “industries we serve”; fine as a directory. |
| `/case-studies/evolve-dance-center` | 385 | Above 300 | Proof page. Depth is the case, not a guide. |
| `/about` | 489 | Above 300 | About intent. AgriciDaniel about gate is 400; this clears it. |
| `/how-we-work` | 444 | Above 300 | Process. |
| Service slugs | 570–662 | Above 300 | Below AgriciDaniel’s 800-word service gate; above this brief’s 300. Template H2s reduce uniqueness. |
| Ten fetched posts | 694–1428 | Above 600 | `law-firm-website-design-las-vegas` at 694 is the leanest fetched post; still above 600. Several are below AgriciDaniel’s 1,500 blog gate — noted as methodology, not a defect by this brief. |
| Remaining 39 posts | cannot verify | cannot verify | Need live HTML word counts. |

Intel `thin-page` uses 350 words and cites a Phase 2b scan of 97 pages (min 118, p10 368, median 898) in `lib/intel/decisions/detectors/thin-page.ts:13-15`. Those snapshot rows are not in the repo.

### Content decay

Year “2026” appears in many titles and in fetched posts (cost, SEO guide, Patchstack 2026). That is current relative to this report’s date (2026-09-11), not stale. `what-youre-paying-for-30k-website` published 2024-12-20, modified 2026-09-06. Whether tool versions inside unfetched posts are outdated **cannot verify** (correction scripts exist: `scripts/correct-dead-tool-recs.ts`, `scripts/correct-stale-stats.ts`, `scripts/correct-cwv-ranking-claims.ts` — those are edit history, not live proof the corrections shipped).

---

## 6. Current commercial search architecture

### Business-type detection (AgriciDaniel industry profiles)

Homepage signals observed in live HTML and `app/page.tsx`: case studies (Evolve, Pink Salt, Essence), services preview, FAQ, CTA, Analytir section, Las Vegas eyebrow, no pricing table on the home hero (price is in the hero paragraph), no phone in the hero (phone in footer/schema), no street address, no Maps embed, blog exists but is not in the main nav, contact exists.

| Profile | Supported? | Evidence |
|---|---|---|
| Agency (plugin taxonomy) | Signals present | `/case-studies`, `/industries`, “Our Work”, client logos/names. This report still names the business **Vizantir Design Studio / the studio**, not an agency. |
| Local service | Signals present | Phone, Las Vegas / 89139, GBP `cid`, areaServed cities, `/las-vegas-web-design`. |
| Publisher | Signals present | `/blog`, 49 posts, BlogPosting. |
| SaaS | Not supported | No free trial, /docs, or signup. Analytir is an in-house story, not a public product signup. |
| E-commerce | Not supported | No cart or product catalog. |

Stated positioning (this brief and live copy): premium custom websites for established brands, cross-industry, Next.js as core technology.

**Match:** `llms.txt` and about copy (“established businesses”, “no templates”, Next.js + Sanity, $15,000 floor). Service pages and `/are-we-a-fit` encode fit/not-fit. Case studies are real launched sites named on the site.

**Diverge:** Homepage H1 is a craft punchline, not the commercial query. Blog gravity is WordPress comparison and cost, not vertical brand work. `/play` is an arcade in the sitemap. `/analytir` is software narrative. Vertical pages exist for law, hospitality, and CRE while `llms.txt` says active work spans broader sectors. Intel’s stored within-reach slug is `website-design` and `next-seo`, not “premium custom website”.

### Commercial pages — intent and CTA

| Route | Apparent search intent | Content / H1 / CTA serve that intent? | Status bucket | Evidence |
|---|---|---|---|---|
| `/` | Navigational + branded commercial | H1 is brand/craft; title is Las Vegas custom web design; hero CTA is case studies, not contact. | PARTIALLY IMPLEMENTED | Live title/H1/CTA (`Hero.tsx:170-214`). |
| `/services` | Commercial investigation | H1 “Strategy-led websites for established businesses”; priced catalog in schema; CTA toward strategy call. | ALREADY IMPLEMENTED | Live 1717 words, CollectionPage + Service. |
| `/services/web-design` | Commercial investigation (“web design”) | H1 matches service; template sections; footer + “Ready to talk” CTA. | PARTIALLY IMPLEMENTED | Live 594 words. Primary query is plausible; uniqueness vs other service slugs is low. |
| `/services/web-development` | Commercial investigation (Next.js development) | Same template. | PARTIALLY IMPLEMENTED | Live 639 words. |
| `/services/website-strategy` | Commercial investigation | Same template. | PARTIALLY IMPLEMENTED | Live 632 words. |
| `/services/website-care` | Commercial investigation / transactional (retainer) | Prices from $295/month in description. | ALREADY IMPLEMENTED | Live 570 words. |
| `/services/cms-integrations` | Commercial investigation | Sanity-specific. | PARTIALLY IMPLEMENTED | Live 639 words. Narrow query. |
| `/services/website-refreshes` | Commercial investigation | Overlaps `/website-redesign-las-vegas`. | PARTIALLY IMPLEMENTED | Live 635 words. |
| `/services/landing-pages` | Commercial / transactional | Canonical is `/landing-pages` (correct). OG URL still `/services/landing-pages`. Duplicate URL pair. | PARTIALLY IMPLEMENTED | Live canonical + OG mismatch. |
| `/landing-pages` and two children | Commercial investigation / transactional | Strong H1s, prices, FAQs, related services. No WebPage node (documented in `lib/schema/expected-types.ts:51-54`). | ALREADY IMPLEMENTED | Live 1644–1871 words. |
| `/las-vegas-web-design` | Commercial investigation + local | Title/H1/FAQ/pricing. 1555 words. | ALREADY IMPLEMENTED | Live extract. |
| `/website-redesign-las-vegas` | Commercial investigation | SEO-safe redesign pitch. 1512 words. | ALREADY IMPLEMENTED | Live extract. |
| `/hospitality-web-design` | Commercial investigation | Vertical. 888 words. | ALREADY IMPLEMENTED | Live extract. |
| `/law-firm-web-design` | Commercial investigation | Vertical. 983 words. Intel `buried-demand:law-firm` in finding_state. | ALREADY IMPLEMENTED | Live + `docs/intel/baselines/...json:63-66`. |
| `/commercial-real-estate-web-design` | Commercial investigation | Vertical. 931 words. | ALREADY IMPLEMENTED | Live extract. Group `cre` seeded (`0010_decision_feed.sql:95-103`); no CRE emission in the stored baseline. |
| `/nextjs-vs-wordpress` | Commercial investigation | Question H1, comparison, FAQ, CTA. 2448 words. | ALREADY IMPLEMENTED | Live extract. |
| `/how-we-work` | Informational / commercial | Process + HowTo + FAQ. 444 words. | PARTIALLY IMPLEMENTED | HowTo flagged (§12). |
| `/get-started` | Transactional | 177 words, HowTo, CTA to contact. | PARTIALLY IMPLEMENTED | Thin for ranking; fine as a step. |
| `/are-we-a-fit` | Commercial investigation | Fit criteria + cost H2 + FAQ. 394 words. | ALREADY IMPLEMENTED | Live extract. |
| `/contact` | Transactional / navigational | Form + NAP. 164 words. | ALREADY IMPLEMENTED | Intent does not need a long article. |
| `/about` | Navigational / informational | Entity + story. 489 words. | ALREADY IMPLEMENTED | Live extract. |
| `/industries` | Navigational hub | 266 words, list of verticals. | PARTIALLY IMPLEMENTED | Thin as a ranking URL. |
| `/case-studies` | Navigational / commercial proof | Index of launched work. 738 words. | ALREADY IMPLEMENTED | Live extract. Client vs studio split observed. |
| `/analytir` | Navigational / brand | Article schema. 876 words. | NOT APPLICABLE | Not a commercial web-design query. |
| `/play*` | Navigational / brand | In sitemap, indexable. | NOT APPLICABLE | Arcade. Sitemap inclusion is the only SEO question. |

### Hypothesis vs evidence (demand)

Do not assert volumes that were not observed. Intel baseline (`docs/intel/baselines/2026-09-09-detector-window-pre-correction.json`) is the only query-level demand artifact in the repo. It is a **pre-correction** 28-day window ending 2026-09-07 and is not comparable to later detector output.

| Hypothesis | Coverage on site / in repo | Intel / GSC evidence in repo | Status bucket |
|---|---|---|---|
| website design / web design | Home, `/services`, `/services/web-design` | `within-reach:website-design` emission, score 220, status new | OPPORTUNITY (query is within reach; page exists) |
| custom website design | Positioning, `do-i-need-a-custom-website` | No stored finding with that slug | PARTIALLY IMPLEMENTED |
| premium website design | About title, llms.txt “Premium custom” | No stored finding | CANNOT VERIFY demand |
| Next.js website development / web design | `/services/web-development`, `/technology/nextjs`, `nextjs-seo-guide`, pillar | `within-reach:next-seo` emission, score 107, confidence exploratory | OPPORTUNITY (technical query, not proven as primary commercial) |
| Las Vegas web design | `/las-vegas-web-design`, local posts | Group `vegas-web-design` seeded (`0010_decision_feed.sql:126-135`). **No** vegas emission in the stored baseline | CANNOT VERIFY current impressions |
| Law firm website design | `/law-firm-web-design` + blog post | `buried-demand:law-firm` in finding_state (status new). Not in the four emissions snapshot | OPPORTUNITY |
| Commercial real estate website design | Vertical page + blog post | Group `cre` seeded; no baseline emission | CANNOT VERIFY demand |
| Hospitality website design | Vertical page + four blog titles | No hospitality group in `0010`; no baseline emission | CANNOT VERIFY demand |
| WordPress alternatives / WP vs Next.js | Pillar + large blog cluster | `buried-demand:wordpress-security`; `within-reach:squarespace-vs-custom-website` | ALREADY IMPLEMENTED coverage; demand observed for security and Squarespace compare |
| Website redesign | `/website-redesign-las-vegas` | No stored finding | CANNOT VERIFY demand |
| Website performance | Speed blog cluster | No stored finding | CANNOT VERIFY demand |
| Website architecture | `two-searches-one-key`, direction post | No stored finding | CANNOT VERIFY demand |
| Reno (not in the hypothesis list) | No Reno page | `geo-signal:reno` status **seen** | OPPORTUNITY or correction — owner decision (§16) |

Impression and click **counts** for those queries are not in the repo. Scores are detector-internal, not search volume.

---

## 7. Already implemented correctly

- HTTPS, HSTS, apex → www, trailing-slash normalization, real 404, `page_id` strip.
- robots.txt allows the public site and named AI crawlers; blocks Intel, Studio, API, tokenized reports.
- XML sitemap of indexable marketing + Sanity URLs; legal noindex kept out of the sitemap.
- Self-canonicals on inspected marketing pages; `/services/landing-pages` canonicals to the commercial landing URL.
- Unique titles and descriptions on inspected routes; `title.absolute` avoids template doubling.
- One H1 per inspected page; JSON-LD in the initial HTML via server components.
- Organization + LocalBusiness + ProfessionalService + WebSite on every layout page; BlogPosting / Service / CreativeWork / BreadcrumbList on the matching templates.
- GSC and Bing verification meta tags.
- Conversion path to `/contact`; prices stated on services, llms.txt, and several posts.
- Next.js vs WordPress pillar with redirects from two old blog slugs.
- ISR for Sanity content; fonts `display: swap`; WebGL hero deferred (not SEO content).
- Intel GSC ingest + scan + eleven detectors already running on cron (`vercel.json:15-43`).

---

## 8. Actual gaps

| Gap | Evidence | Why it is a gap, not noise |
|---|---|---|
| Homepage H1 does not state the commercial offer the title and Intel query imply | Live H1 vs title; Intel `within-reach:website-design` | The URL that should absorb “website design” demand leads with a craft line and a case-study CTA. |
| Blog posts do not link to each other | Ten fetched posts: 0 `/blog/{other}` hrefs; `BlogPostContent.tsx` has no related block | A 49-post cluster without spoke links wastes the WordPress/cost/security topical mass. |
| Blog body has no dedicated commercial CTA | Same file ends after Portable Text | Footer links exist; in-article support for `/services`, `/law-firm-web-design`, `/nextjs-vs-wordpress` was not observed in those ten documents beyond the global footer set. |
| Editorial-rule collisions in live titles | Four index titles + fetched hidden-costs body | Speculates about other firms’ motives. Platform criticism would still be possible without that frame. |
| Two cost URLs, same intent | `/blog/how-much-does-a-website-cost-las-vegas` and `/blog/how-much-does-website-cost-2026` both answer “what does a website cost” | Likely cannibalization (§10). |
| OG URL ≠ canonical on `/services/landing-pages` | Live OG `https://www.vizantir.com/services/landing-pages`, canonical `/landing-pages` | Split signals on a priced commercial URL. |
| LocalBusiness lacks `streetAddress` and `openingHours` | `app/layout.tsx:83-89` vs hours in `data/contact.ts` | NAP is city + phone only. Whether a public street exists is an owner question. |
| HowTo JSON-LD on `/how-we-work` and `/get-started` | Live types; `lib/schema/index.ts:228-250` | Deprecated for Google rich results. Flag only. Not a removal mandate. |
| FAQ questions are not headings | `FAQSection.tsx`, `FAQPageClient.tsx`; `/faq` H2 count = 1 | Extractability is weaker than the FAQPage node implies. Info, not a crawl block. |
| `/play` and game URLs are in the XML sitemap | Live sitemap + `app/sitemap.ts:108-113` | Indexable arcade pages compete for crawl with commercial URLs. |
| Author URL pattern for non-founders 404s | `lib/schema/index.ts:461-467`; no `app/about/[slug]` | Noise if every live post is James Tram (true for the ten fetched). Gap only if a non-founder author is published. |
| Intel cannot see indexation, AI Overviews, backlinks, or GSC crawl errors | Capability map §13 | Not a public-site bug. It limits how future SEO work can be evaluated. |

---

## 9. Search opportunities

Only where intent, likely searcher, and a supporting commercial URL can be stated. Not “write more posts.”

| Opportunity | Likely searcher | Supporting commercial URL | Evidence it is not invented |
|---|---|---|---|
| Align `/` and `/services/web-design` to the query already within reach: website design | Owner comparing custom studios | `/`, `/services/web-design` | Intel `within-reach:website-design` |
| Strengthen the existing Squarespace comparison path (page already ranks into within-reach) | Owner on Squarespace considering custom | `/blog/squarespace-vs-custom-website`, `/nextjs-vs-wordpress`, `/services` | Intel `within-reach:squarespace-vs-custom-website` |
| Treat `next-seo` as a supporting technical query, not the brand pitch | Technical buyer | `/blog/nextjs-seo-guide`, `/services/web-development` | Intel `within-reach:next-seo` (exploratory) |
| WordPress security cluster already drawing buried demand | WP owner after an incident | `/nextjs-vs-wordpress`, `/services/website-refreshes`, care | Intel `buried-demand:wordpress-security` |
| Law-firm buried demand | Managing partner | `/law-firm-web-design` + existing post | finding_state `buried-demand:law-firm` |
| Resolve Reno geo-signal (correct or accept) | N/A until decided | None today | `geo-signal:reno` status seen |
| Differentiate or consolidate the two website-cost posts | Budget researcher | `/services`, `/get-started` | Two live URLs, same question |
| Contextual links from WordPress spokes to the pillar and from vertical posts to vertical pages | In-cluster readers | `/nextjs-vs-wordpress`, verticals | Pillar and verticals exist; spoke HTML lacks blog hrefs |

Missing **topics** that would only be opportunities with demand evidence we do not have: additional cities, additional verticals, “premium website design” as a new URL. Do not add posts to increase count.

---

## 10. Potential cannibalization or content overlap

| Pair / set | Shared intent | Evidence | Notes |
|---|---|---|---|
| `/blog/how-much-does-a-website-cost-las-vegas` vs `/blog/how-much-does-website-cost-2026` | What a website costs | Both fetched; both tiered $500–$150k narratives | Strongest pair. Local vs national is a thin differentiator. |
| Those two vs `what-youre-paying-for-30k-website`, `why-15000-website-cheaper-than-5000`, `true-cost-of-wordpress-website`, `wordpress-vs-nextjs-3-year-cost-comparison` | Cost / TCO | Titles on `/blog` + two fetched | Cluster, not all duplicates. Risk if they rank for the same head term. |
| `/nextjs-vs-wordpress` vs WordPress/Next spokes | Platform choice | Redirects already fold two old posts into the pillar (`next.config.ts:57-75`) | Remaining spokes should support, not retarget, the pillar. |
| `/services/landing-pages` vs `/landing-pages` | Landing page service | Canonical already points to `/landing-pages` | Implementation is correct if OG/internal links follow the canonical. |
| `/services/website-refreshes` vs `/website-redesign-las-vegas` | Refresh vs redesign | Both live, different H1s | Overlap if queries are “redesign my site”. |
| `/how-we-work` vs `/get-started` | How a project starts | HowTo on both; 444 vs 177 words | Get-started is a CTA page; process belongs on how-we-work. |
| `law-firm-website-design-las-vegas` vs `/law-firm-web-design` | Law firm websites | Both live | Healthy if post is informational and page is commercial. |
| Hospitality posts (4) vs `/hospitality-web-design` | Hospitality websites | Titles + vertical page | Same split. |
| CRE post vs `/commercial-real-estate-web-design` | CRE websites | Titles + vertical page | Same split. |
| Speed posts (5 titles) | Site speed | Index titles only | Possible intra-blog cannibalization; word counts cannot verify. |
| WP security posts (3 titles) | Is WordPress safe | Intel groups them as `wordpress-security` | Grouping already treats them as one demand set. |

---

## 11. AgriciDaniel recommendations that apply

Applied from claude-seo v2.2.5 / quality gates dated through May 2026, manually. No plugin run.

- Detect business type from homepage signals (Agency-taxonomy + Local + Publisher). Done in §6.
- Technical crawl: robots, sitemaps, canonicals, HTTPS, status codes. Done in §2.
- One H1, unique titles/descriptions, internal linking, orphan check. Done.
- Thin-content gates, then judge intent. Done in §5.
- Passage citability ~130–170 words, question headings, one idea per paragraph, attribution. Done in §3.
- SXO: page-type intent vs content/CTA/H1. Done in §6.
- Core Web Vitals named LCP, INP, CLS only. No lab suite was run (none configured for this hostname in-repo).
- FAQPage: flag Info; do not recommend add/remove; no AI-citation claim. Done.
- HowTo: flag; never recommend. Done.
- `llms.txt`: report presence; do not recommend as SEO/GEO. Done.
- AEO/GEO = SEO eligibility floor (indexable + snippet-capable). Done.
- Local NAP / LocalBusiness when local signals exist. Done.
- Falsifiability on recommendations (observation, dependency, failure test, leading indicator). Section 15.
- Do not invent search volume. Intel findings outrank hypotheses. Done.
- Location-page mill warning (30+/50+): **not triggered** (two Las Vegas URLs).

---

## 12. AgriciDaniel recommendations that do not apply (and why)

| Recommendation | Why it does not apply |
|---|---|
| SEO Health Score 0–100 | This brief forbids health-score theater. |
| Prioritized phased action plan / PDF report | This brief: investigation only, no plan, no phases. |
| Add HowTo schema | Deprecated. HowTo is already present; do not add more. |
| Add FAQPage for SERP or AI citations | Rich results retired 2026-05-07; AI benefit unconfirmed. FAQPage already present. |
| Create `llms.txt` / `llms-full.txt` as a ranking or citation lever | Files exist. Google Search ignores `llms.txt` as a lever. |
| Add WebSite `SearchAction` for sitelinks search box | AgriciDaniel: machine-readable only; no Google sitelinks benefit. |
| FID as a Core Web Vital | Replaced by INP. |
| Run a full Lighthouse suite | None configured in-repo for vizantir.com; this brief says do not run one. |
| Hreflang / i18n | Single locale `en-US`. No alternate languages observed. |
| E-commerce Product / Merchant schema | No catalog. |
| Programmatic location pages / 30+ city templates | Two geo URLs. Doorway-page warning does not apply. |
| QAPage | `/faq` is authored FAQ, not user-submitted Q&A. |
| Maps geo-grid / DataForSEO | Not available in this pass; no DataForSEO run. |
| Backlink audit (Moz/Ahrefs) | No credentials used; Intel has no backlink ingest. |
| AI-keyword rewriting, passage chunking, mention-farming | Contradicts Google’s “GEO is still SEO” gate in this brief. |
| Recommend LocalBusiness subtype shopping | Studio is ProfessionalService + LocalBusiness already; no storefront observed. |
| Agency case-study schema type `CaseStudy` | Schema.org/Google path used here is `CreativeWork` (`lib/schema/index.ts:609-614`), which matches the expected-type map. |

---

## 13. Existing Intel measurements that can evaluate future results

Located: `lib/intel/*`, `lib/gsc/*`, `lib/scan/*`, `app/intel/*`, `app/api/cron/*`, `vercel.json` crons, tables in `supabase/migrations/0009`–`0024`. Architecture doc Part I describes the GSC core; Part II’s “nothing exists” banner is stale — scan + scan detectors **are** in the repo.

| Capability | Can Intel evaluate it later? | How |
|---|---|---|
| Impressions and clicks by query and page | Yes | `gsc_query_page_daily`, `/intel/search`, detectors |
| Average position / near-page-one | Yes | Same GSC rows; not a rank tracker |
| Buried demand / within-reach / geo-signal | Yes | Existing detectors; groups in `gsc_query_groups` |
| Indexation (URL Inspection) | No | Proxy only: impressions + scan noindex/4xx (`indexed-but-broken`) |
| Core Web Vitals **field** for vizantir.com | No in the single-tenant search UI | CrUX is fetched for **client** dashboards (`lib/reports/crux.ts`), not stored as a vizantir.com Intel series |
| PSI / Lighthouse lab for vizantir.com | No | `psi_results` is per **client** (`lib/psi/sync.ts`) |
| AI Overview / AI Mode appearances | No | Not ingested |
| Schema.org validation | Partial | `schema-drift` vs `EXPECTED_SCHEMA_TYPES`, not Rich Results Test |
| GSC crawl errors | No | Scan stores per-URL HTTP/`error_reason` only |
| Backlinks | No | No tables or clients |
| AI crawler hits on `/robots.txt` | Yes | `crawler_hits`, `crawler-absence` |
| GBP snapshot (rating count) | Yes if `gbp_snapshots` is applied | Places API, `client_id is null` |
| On-page title/H1/canonical/word count/schema types | Yes | Daily `scan_page_snapshots` (07:00 UTC) |
| Thin pages (<350 scan words) | Yes | `thin-page` |
| Sitemap vs live status | Yes | `sitemap-contradiction` |
| llms.txt drift | Yes | `llms-drift` |
| GA4 organic sessions for this site | Partial | `ga4_daily` ingest exists; Intel Overview/Search display GSC, not GA4 organic |

Leading indicators that do **not** require re-running this reconnaissance: `/intel/search` query impressions/clicks/position; decision feed keys listed in the 2026-09-09 baseline; scan word counts and schema types; robots.txt crawler panel.

---

## 14. Systems that must remain untouched

- **Vizantir Intel** — GSC sync, scan, detectors, `/intel` UI, cron routes, `decision_items`. Read-only in this recon. Do not extend.
- **Chatbot knowledge base** — `lib/chat/knowledge`, `chatAll*` queries, `/llms-full.txt` knowledge blob. Out of scope.
- **Legal documents** — `/privacy`, `/terms`, `/cookies`, `/copyright` (noindex by design).
- **LiquidMetalTorus / WebGL hero** — deferred loader is a CWV choice, not an SEO content hole.
- **Sanity schema** — `sanity/schemaTypes/*`. Content can change in Studio without schema work.
- **Arcade `/play`** — product, not a commercial landing system. Sitemap listing is the only SEO question.
- **Analytir** — separate product narrative.
- **Client reporting / PDF / dashboards** — multi-tenant, not public-site SEO.
- **Form protection / Turnstile / contact API**.
- **Environment files** — never write `.env*`.

---

## 15. Potential implementation items

No priorities. No sequence. Effort: S small, M medium, L large.

| ID | Bucket | Route / file | Observation | Depends on / unblocks | How we would know it failed | Leading indicator (no re-recon) | Effort |
|---|---|---|---|---|---|---|---|
| R-001 | OPPORTUNITY | `/`, `components/homepage/Hero.tsx` | H1 is a craft line; title and Intel `website-design` are commercial | Unblocks query-page alignment for the within-reach term | H1/title still diverge and `within-reach:website-design` remains | Intel position/CTR for the website-design finding | S |
| R-002 | OPPORTUNITY | `/` hero CTA | Hero CTA goes to `/case-studies`, not `/contact` | Conversion vs proof; owner taste | Bounce from home with no `/contact` hit **cannot verify** in this recon | Intel will not show this; GA4 pathing if used | S |
| R-003 | ACTUAL GAP | `components/blog-page/BlogPostContent.tsx` + posts | Ten fetched posts have 0 other blog hrefs | Unblocks cluster equity | New posts still show 0 `/blog/` hrefs in the next scan `internal_links` | `scan_page_snapshots.internal_links` on `/blog/*` | M |
| R-004 | ACTUAL GAP | Same + Portable Text | No in-article CTA to the commercial URL the post supports | Unblocks post → service/vertical | Scan still finds only footer commercial hrefs | Spot-check scan HTML or a single post | S |
| R-005 | ACTUAL GAP | Four WP-agency titles listed in §5 | Titles speculate about other firms’ motives | Editorial rule; does not require new URLs | Titles still use “agency didn’t tell you / didn’t explain” | `/blog` H2 list | S |
| R-006 | OPPORTUNITY | `/blog/how-much-does-a-website-cost-las-vegas` + `/blog/how-much-does-website-cost-2026` | Same head intent | Unblocks a single cost URL for GSC | Both URLs keep splitting impressions | GSC query-page rows for both paths | M |
| R-007 | ACTUAL GAP | `app/services/[slug]/page.tsx` landing-pages branch | OG URL is `/services/landing-pages`, canonical is `/landing-pages` | Unblocks one commercial URL | Rich results / social still preview the service path | Live OG vs canonical | S |
| R-008 | PARTIALLY IMPLEMENTED | `app/layout.tsx` LocalBusiness | No `streetAddress`; hours exist in `data/contact.ts` but not in schema | Owner must confirm a public street | Schema still city-only while GBP has a different NAP **cannot verify** without GBP HTML | Intel GBP snapshot if applied; GSC local impressions | S |
| R-009 | OPPORTUNITY | `app/sitemap.ts` `/play*` | Six arcade URLs in the XML sitemap | Crawl allocation | Games still appear in sitemap lastmod list | Next `scan_site_snapshots` sitemap count | S |
| R-010 | PARTIALLY IMPLEMENTED | `/faq`, homepage FAQ | Questions are buttons, not headings; answers are in HTML | AEO extractability only | `/faq` still has one H2 | Scan H1/word count unchanged; this is heading structure | S |
| R-011 | OPPORTUNITY | `/services/*` templates | Shared H2s across seven slugs | Unlocks unique service snippets | All seven still share the same H2 list | Live H2 extract | M |
| R-012 | OPPORTUNITY | `/industries` | 266 words, directory only | Only if that hub should rank | Word count stays <350 and `thin-page` fires | Intel `thin-page` on `/industries` | S |
| R-013 | PARTIALLY IMPLEMENTED | `/get-started` | 177 words, HowTo, overlaps `/how-we-work` | Decide if this URL is a step or a landing | `thin-page` and HowTo remain | Scan word count; schema-drift still expects HowTo | S |
| R-014 | OPPORTUNITY | WordPress security posts | Intel `buried-demand:wordpress-security` already groups them | Do not add a fourth post by default | Group impressions stay buried (>40 position, <0.5% CTR) | Detector `buried-demand:wordpress-security` | M |
| R-015 | OPPORTUNITY | `/law-firm-web-design` + blog post | `buried-demand:law-firm` in finding_state | Keep roles split (page commercial, post informational) | Finding disappears without a CTR change — or both URLs rank for the same query | GSC page dimension for both URLs | M |
| R-016 | OPPORTUNITY | `/blog/squarespace-vs-custom-website` | Already within reach | Review title/H1/CTR, do not fork a second Squarespace URL | Second Squarespace URL appears or CTR stays ~0 | `within-reach:squarespace-vs-custom-website` | S |
| R-017 | OPPORTUNITY | `/blog/nextjs-seo-guide` | `within-reach:next-seo` exploratory | Keep Next.js as supporting, not the homepage pitch | Homepage retargeted to “Next.js” while `website-design` is the commercial finding | Both within-reach keys | S |
| R-018 | CANNOT VERIFY | Unfetched 39 posts | Word counts and in-body links unknown | Completes the inventory | — | Scan `word_count` per `/blog/*` already collected daily | S |
| R-019 | PARTIALLY IMPLEMENTED | `app/sitemap.ts` `STATIC_PAGE_DATES` | lastmod is manual | Process, not a feature | Google ignores lastmod (not directly visible) | Sitemap lastmod vs Sanity `_updatedAt` on a recrawl | S |
| R-020 | NOT APPLICABLE | HowTo on `/how-we-work`, `/get-started` | Present; deprecated for rich results | Do not add HowTo elsewhere | New HowTo nodes appear on other routes | `schema-drift` / scan schema types | S |
| R-021 | NOT APPLICABLE | FAQPage sitewide | Present; no Google rich result | Do not add FAQPage for SERP; do not remove for SERP | — | Schema types in scan | S |
| R-022 | NOT APPLICABLE | `llms.txt` | Present | Do not treat as an SEO task | — | `llms-drift` detector | S |
| R-023 | OPPORTUNITY | `geo-signal:reno` | Intel saw Reno queries | Owner: ignore, disavow association, or expand | Reno impressions grow while no page exists — or a Reno page is built without demand | `geo-signal:reno` status | S |
| R-024 | PARTIALLY IMPLEMENTED | `/about` Person `sameAs` vs Organization `sameAs` | Clutch/GitHub only on Person | Entity consistency | Two graphs disagree on profiles | Live JSON-LD | S |
| R-025 | OPPORTUNITY | Speed-titled posts (5) | Possible intra-blog overlap | Confirm via GSC page/query, then differentiate | Multiple posts share one speed query | GSC query-page for those slugs | M |
| R-026 | PARTIALLY IMPLEMENTED | Homepage / service passages | Short paragraphs, few 130–170 word answer blocks | Only if citability is a goal | Passages still require surrounding chrome | Human check; Intel does not score passage length | M |
| R-027 | NOT APPLICABLE | `/play` content | Thin, indexable arcade | Not a commercial gap | — | Sitemap membership | S |
| R-028 | CANNOT VERIFY | vizantir.com CrUX LCP/INP/CLS | No stored field data for this origin in the Intel search pipeline | Would need CrUX/PSI **read** of this origin (not done) | — | Search Console CWV or a one-off PSI **if** the owner runs it | S |

---

## 16. Open questions for the studio owner

Answer only changes what should be built.

1. **Primary commercial query.** Intel’s stored within-reach slug is `website-design`. The homepage title is Las Vegas custom web design. The blog’s center of gravity is WordPress vs Next.js. Which of those is the acquisition bet?
2. **Street address.** Is there a public street address that should appear in NAP / LocalBusiness, or is city + GBP enough?
3. **Reno.** `geo-signal:reno` was marked seen. Ignore, treat as mis-association, or build something?
4. **`/play` in the sitemap.** Keep as brand, or omit from XML?
5. **Cost posts.** Keep a Las Vegas cost URL and a national cost URL, or pick one canonical explainer?
6. **Editorial titles.** Are the “agency didn’t tell you” headlines intentional, or should they be rewritten to stay inside the WordPress-criticism rule?
7. **Calendar.** Contact form only, or is a booking tool desired? (None is implemented.)
8. **Non-founder authors.** Will any post be published under someone other than James Tram? If yes, `/about/{slug}` URLs in schema need a real page or a different `url`.

---

*End of reconnaissance. No implementation plan follows.*

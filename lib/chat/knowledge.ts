import 'server-only'
import { sanityFetch } from '@/lib/sanity/client'
import {
  chatAllServicesQuery,
  chatAllCaseStudiesQuery,
  chatAllFaqsQuery,
  chatAuthorQuery,
} from '@/lib/sanity/queries'
import { siteSettingsQuery } from '@/lib/sanity/queries'
import { aboutPageContent } from '@/data/about'
import {
  projectPricing,
  carePricing,
  landingPagePricing,
  publicBlogPricing,
  chatbotPricing,
  chatbotSharedIncludes,
  CHATBOT_SETUP_FEE,
  CHATBOT_USAGE_FROM,
  EXISTING_SITE_PAGE_RATE_DISPLAY,
  formatCareClientPrice,
  pricingFAQs,
} from '@/data/pricing'
import { areWeAFitPageContent, flattenAreWeAFitParagraph } from '@/data/are-we-a-fit'
import { howWeWorkProcess, howWeWorkFaqs } from '@/data/how-we-work'
import { CORE_STACK, SPECIALIZED_TOOLS } from '@/app/technology/_data'
import type { Technology } from '@/app/technology/_data'
import { SECONDARY_INDUSTRIES } from '@/app/industries/_data'

// ---- Types (loose; we only read these for serialization) ----
type AnyRec = Record<string, unknown>

// ---- Helpers ----
function section(title: string, body: string): string {
  const trimmed = body.trim()
  if (!trimmed) return ''
  return `\n## ${title}\n\n${trimmed}\n`
}

function bullets(items: readonly string[] | undefined): string {
  if (!items?.length) return ''
  return items.map((i) => `- ${i}`).join('\n')
}

// ---- Section builders ----

function buildSiteSettings(s: AnyRec | null): string {
  if (!s) return ''
  const parts = [
    s.siteName && `Studio: ${s.siteName}`,
    s.organizationDescription && `About: ${s.organizationDescription}`,
    s.email && `Email: ${s.email}`,
    s.phone && `Phone: ${s.phone}`,
    s.priceRange && `Price range: ${s.priceRange}`,
    s.areaServed && `Area served: ${Array.isArray(s.areaServed) ? s.areaServed.join(', ') : s.areaServed}`,
    s.foundingDate && `Founded: ${s.foundingDate}`,
  ].filter(Boolean)
  return section('STUDIO OVERVIEW', parts.join('\n'))
}

function buildAbout(): string {
  const a = aboutPageContent
  const secs = a.sections
    .map((sec) => `### ${sec.heading}\n${sec.paragraphs.join('\n')}`)
    .join('\n\n')
  const body = [
    a.hero?.heading,
    a.hero?.body,
    a.intro?.closing,
    secs,
  ].filter(Boolean).join('\n\n')
  return section('ABOUT VIZANTIR', body)
}

function buildPricing(): string {
  const tiers = projectPricing
    .map((t) =>
      `### ${t.name} — ${t.price}\nTimeline: ${t.timeline}\n${t.description}\nIncludes:\n${bullets(t.includes)}`
    )
    .join('\n\n')
  const care = carePricing
    .map((c) => `### ${c.name} — ${c.price}\n${c.description}\nIncludes:\n${bullets(c.includes)}`)
    .join('\n\n')
  const landingPages = landingPagePricing
    .map((t) => `### ${t.name} — ${t.price}\n${t.description}\nIncludes:\n${bullets(t.includes)}`)
    .join('\n\n')
  const blogIntro = [
    'Vizantir offers Search & Content Growth for Vizantir website and care clients.',
    'The work is strategy, implementation, and publishing into the site: search opportunity research, service page expansion, location content where it applies, editorial content, internal linking, structured data, content updates, search visibility, and AI search visibility.',
    'Plans describe the engagement, not a quantity of posts. Public monthly plans are Ongoing and Program. Do not quote Single Assignment or a $350 one-time price as a public offer.',
  ].join(' ')
  const blogTiers = publicBlogPricing
    .map((t) => {
      const standardPrice = `$${t.priceMin.toLocaleString()}/month`
      const carePrice = `${formatCareClientPrice(t.priceMin)}/month (15% off)`
      const cadenceLine = `Plan detail: monthly, typical publishing cadence of ${t.postsPerMonth} pieces`
      return [
        `### ${t.name}`,
        `Standard price: ${standardPrice}`,
        `Care client price: ${carePrice}`,
        cadenceLine,
        t.tagline,
      ].join('\n')
    })
    .join('\n\n')
  const blogBlock = `${blogIntro}\n\n${blogTiers}`
  const chatbotIntro = [
    'Vizantir offers AI Experience Integration: custom AI experiences built into the website and connected to approved business content, data, and workflows — not a generic widget.',
    'Integration scope depends on the site, data sources, CRM requirements, lead flow, and use case. Custom integration is scoped separately.',
    `Ongoing usage and management starts at $${CHATBOT_USAGE_FROM.toLocaleString()}/month.`,
    `One-time setup is ${CHATBOT_SETUP_FEE.display}. Care plan clients get 15% off usage (${formatCareClientPrice(CHATBOT_USAGE_FROM)}/month).`,
    'Conversation limits are plan detail sized during scoping, not a public product differentiator. Do not present Starter, Standard, or Scale as separately sold public plans.',
  ].join(' ')
  const chatbotShared = `Every AI Experience Integration includes:\n${bullets(chatbotSharedIncludes)}`
  const chatbotPlanDetail = chatbotPricing
    .map((t) => t.conversations)
    .join('; ')
  const chatbotBlock = `${chatbotIntro}\n\n${chatbotShared}\n\nOne-time setup: ${CHATBOT_SETUP_FEE.display} \u2014 ${CHATBOT_SETUP_FEE.description}\n\nPlan detail only (not public products): ${chatbotPlanDetail}`
  const faqBlock = Object.values(pricingFAQs).filter((v) => typeof v === 'string').join('\n\n')
  const existingSiteRate = `Existing Vizantir website clients get an existing-site page rate starting at ${EXISTING_SITE_PAGE_RATE_DISPLAY} for a single Campaign Landing Page-scope page on the existing stack. That rate applies in place of care preferred rates rather than on top of them.`
  const body = `PROJECT PRICING (one-time builds):\n\n${tiers}\n\nWEBSITE CARE (monthly retainers):\n\n${care}\n\nLANDING PAGES (one-time):\n\n${landingPages}\n\n${existingSiteRate}\n\nSEARCH & CONTENT GROWTH (monthly, for Vizantir website and care clients):\n\n${blogBlock}\n\nAI EXPERIENCE INTEGRATION (scoped custom integration):\n\n${chatbotBlock}\n\n${faqBlock}`
  return section('PRICING', body)
}

function buildFit(): string {
  const f = areWeAFitPageContent
  const body = [
    f.heroHeading,
    f.heroSubheading,
    `### ${f.idealSection.heading}\n${bullets(f.idealSection.bullets)}`,
    `### ${f.notIdealSection.heading}\n${bullets(f.notIdealSection.bullets)}`,
    `### ${f.budgetSection.heading}\n${
      f.budgetSection.paragraphs
        ?.map(flattenAreWeAFitParagraph)
        .join('\n\n') ?? f.budgetSection.body
    }`,
    `### ${f.closingSection.heading}\n${f.closingSection.body}`,
  ].filter(Boolean).join('\n\n')
  return section('WHO WE WORK WITH (FIT)', body)
}

function buildProcess(): string {
  const steps = howWeWorkProcess
    .map((s) => `${s.number}. ${s.title}: ${s.description}`)
    .join('\n')
  const faqs = howWeWorkFaqs
    .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
    .join('\n\n')
  return section('HOW WE WORK (PROCESS)', `${steps}\n\n${faqs}`)
}

function buildServices(services: AnyRec[]): string {
  const body = services.map((s) => {
    const proc = Array.isArray(s.process)
      ? (s.process as AnyRec[]).map((p) => `  ${p.step}. ${p.title}: ${p.description}`).join('\n')
      : ''
    const off = Array.isArray(s.offerings)
      ? (s.offerings as AnyRec[]).map((o) => `  - ${o.name}: ${o.description}`).join('\n')
      : ''
    const faqs = Array.isArray(s.faqs)
      ? (s.faqs as AnyRec[]).map((f) => {
          const q = String(f.question ?? '').replace(/^\s*Q:\s*/i, '')
          const a = String(f.answer ?? '').replace(/^\s*A:\s*/i, '')
          return `  Q: ${q}\n  A: ${a}`
        }).join('\n')
      : ''
    return [
      `### ${s.title}`,
      s.description,
      s.overview,
      Array.isArray(s.benefits) && s.benefits.length ? `Benefits:\n${bullets(s.benefits as string[])}` : '',
      Array.isArray(s.deliverables) && s.deliverables.length ? `Deliverables:\n${bullets(s.deliverables as string[])}` : '',
      proc && `Process:\n${proc}`,
      off && `Offerings:\n${off}`,
      faqs && `Service FAQs:\n${faqs}`,
    ].filter(Boolean).join('\n')
  }).join('\n\n')
  return section('SERVICES', body)
}

function buildCaseStudies(items: AnyRec[]): string {
  const body = items.map((c) =>
    [
      `### ${c.title}${c.client ? ` (${c.client})` : ''}`,
      c.industry && `Industry: ${c.industry}`,
      c.summary,
      c.challenge && `Challenge: ${c.challenge}`,
      c.solution && `Solution: ${c.solution}`,
      c.results && `Results: ${c.results}`,
      Array.isArray(c.stack) && c.stack.length ? `Stack: ${(c.stack as string[]).join(', ')}` : '',
      c.siteUrl && `Live site: ${c.siteUrl}`,
    ].filter(Boolean).join('\n')
  ).join('\n\n')
  return section('CASE STUDIES', body)
}

function buildFaqs(items: AnyRec[]): string {
  const body = items
    .map((f) => {
      const q = String(f.question ?? '').replace(/^\s*Q:\s*/i, '')
      const a = String(f.answer ?? '').replace(/^\s*A:\s*/i, '')
      return `Q: ${q}\nA: ${a}`
    })
    .join('\n\n')
  return section('FREQUENTLY ASKED QUESTIONS', body)
}

function buildAuthor(a: AnyRec | null): string {
  if (!a) return ''
  const body = [
    a.name && `${a.name}${a.role ? ` — ${a.role}` : ''}`,
    a.bio,
    Array.isArray(a.credentials) && a.credentials.length ? `Credentials: ${(a.credentials as string[]).join(', ')}` : '',
  ].filter(Boolean).join('\n')
  return section('FOUNDER', body)
}

function techSummary(tech: Technology): string {
  if (tech.description) return tech.description
  const match = tech.intro.match(/^[^.!?]+[.!?]/)
  return match ? match[0] : tech.intro
}

function formatTechItem(tech: Technology): string {
  return [
    `- ${tech.name}: vizantir.com/technology/${tech.slug}`,
    `  Tagline: ${tech.tagline}`,
    `  Summary: ${techSummary(tech)}`,
  ].join('\n')
}

function buildTechnology(): string {
  const coreItems = CORE_STACK.map(formatTechItem).join('\n\n')
  const specializedItems = SPECIALIZED_TOOLS.map(formatTechItem).join('\n\n')
  const body = [
    'Vizantir has a dedicated /technology hub at vizantir.com/technology that explains every technology used in our builds.',
    '### Core Stack — used on every Vizantir site',
    coreItems,
    '### Specialized Tools — used when the project calls for it',
    specializedItems,
  ].join('\n\n')
  return section('Technology Pages', body)
}

function buildIndustries(): string {
  const body = [
    'Vizantir builds custom websites for established businesses across all sectors. The /industries hub is at vizantir.com/industries.',
    '',
    `We work with clients in: ${SECONDARY_INDUSTRIES.join(', ')}`,
    '',
    'We also have dedicated SEO landing pages for these three industries:',
    '- Hospitality: vizantir.com/hospitality-web-design',
    '- Law Firms: vizantir.com/law-firm-web-design',
    '- Commercial Real Estate: vizantir.com/commercial-real-estate-web-design',
    '',
    'These three landing pages are SEO entry points, not specialty claims — Vizantir\'s work spans all the sectors listed above.',
  ].join('\n')
  return section('Industries', body)
}

function buildSiteRoutes(): string {
  const body = [
    'Main pages:',
    '- Home: vizantir.com',
    '- About: vizantir.com/about',
    '- Services: vizantir.com/services',
    '- Case Studies: vizantir.com/case-studies',
    '- Blog: vizantir.com/blog',
    '- FAQ: vizantir.com/faq',
    '- Contact: vizantir.com/contact',
    '- How We Work: vizantir.com/how-we-work',
    '- Are We a Fit: vizantir.com/are-we-a-fit',
    '- Get Started: vizantir.com/get-started',
    '',
    'Specialty pages:',
    '- Las Vegas Web Design: vizantir.com/las-vegas-web-design',
    '- Website Redesign Las Vegas: vizantir.com/website-redesign-las-vegas',
    '- Industries Hub: vizantir.com/industries',
    '- Technology Hub: vizantir.com/technology',
  ].join('\n')
  return section('Site Routes', body)
}

// ---- Main assembly (cached per request via React cache) ----
let _cachedBlob: string | null = null
let _cachedAt = 0
const CACHE_TTL_MS = 1000 * 60 * 30 // 30 min

export async function getKnowledgeBlob(): Promise<string> {
  const now = Date.now()
  if (_cachedBlob && now - _cachedAt < CACHE_TTL_MS) return _cachedBlob

  const [siteSettings, services, caseStudies, faqs, author] = await Promise.all([
    sanityFetch<AnyRec | null>(siteSettingsQuery, {}, { tags: ['siteSettings'] }),
    sanityFetch<AnyRec[]>(chatAllServicesQuery, {}, { tags: ['service'] }),
    sanityFetch<AnyRec[]>(chatAllCaseStudiesQuery, {}, { tags: ['caseStudy'] }),
    sanityFetch<AnyRec[]>(chatAllFaqsQuery, {}, { tags: ['faq'] }),
    sanityFetch<AnyRec | null>(chatAuthorQuery, {}, { tags: ['author'] }),
  ])

  const blob = [
    'VIZANTIR DESIGN STUDIO — COMPLETE SITE KNOWLEDGE',
    'Use ONLY the information below to answer questions about Vizantir.',
    buildSiteSettings(siteSettings),
    buildAbout(),
    buildServices(services ?? []),
    buildPricing(),
    buildFit(),
    buildProcess(),
    buildTechnology(),
    buildIndustries(),
    buildSiteRoutes(),
    buildCaseStudies(caseStudies ?? []),
    buildFaqs(faqs ?? []),
    buildAuthor(author),
  ].filter(Boolean).join('\n')

  _cachedBlob = blob
  _cachedAt = now
  return blob
}

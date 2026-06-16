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
  blogPricing,
  chatbotPricing,
  CHATBOT_SETUP_FEE,
  formatCareClientPrice,
  pricingFAQs,
} from '@/data/pricing'
import { areWeAFitPageContent } from '@/data/are-we-a-fit'
import { howWeWorkProcess, howWeWorkFaqs } from '@/data/how-we-work'

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
    a.intro?.paragraph,
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
    .map((c) => `### ${c.name} — ${c.price}\n${c.description}`)
    .join('\n\n')
  const blogIntro = [
    'Vizantir offers ongoing blog writing as an add-on to any Website Care plan.',
    'Posts are human-written, researched against the client\u2019s industry and audience, and published live in Sanity \u2014 not a separate engagement, not AI-generated.',
    'Available standalone as a single post; recurring tiers are care-attached only.',
  ].join(' ')
  const blogTiers = blogPricing
    .map((t) => {
      const isOneTime = t.cadence === 'one-time'
      const priceLine = isOneTime
        ? `$${t.priceMin.toLocaleString()} (one-time)`
        : `$${t.priceMin.toLocaleString()}/month`
      const careLine = isOneTime
        ? `Care clients: 15% off \u2192 ${formatCareClientPrice(t.priceMin)} (one-time)`
        : `Care clients: 15% off \u2192 ${formatCareClientPrice(t.priceMin)}/month`
      return `### ${t.name} — ${priceLine}\n${t.tagline}\n${careLine}`
    })
    .join('\n\n')
  const blogBlock = `${blogIntro}\n\n${blogTiers}`
  const chatbotIntro = [
    'Vizantir offers a custom AI chatbot trained on each client\u2019s site content, services, and FAQs.',
    'It answers visitors in the client\u2019s brand voice \u2014 not canned scripts or generic widgets.',
    'Primarily sold as an add-on to Website Care; also available standalone.',
    'This is not a self-serve product: setup, training, and conversation metering are handled per client by the Vizantir team.',
  ].join(' ')
  const chatbotTiers = chatbotPricing
    .map((t) =>
      `### ${t.name} — $${t.priceMin.toLocaleString()}/month\n${t.conversations}\n${t.tagline}\nCare clients: 15% off \u2192 ${formatCareClientPrice(t.priceMin)}/month`,
    )
    .join('\n\n')
  const chatbotBlock = `${chatbotIntro}\n\nOne-time setup: ${CHATBOT_SETUP_FEE.display} \u2014 ${CHATBOT_SETUP_FEE.description}\n\n${chatbotTiers}`
  const faqBlock = Object.values(pricingFAQs).filter((v) => typeof v === 'string').join('\n\n')
  const body = `PROJECT PRICING (one-time builds):\n\n${tiers}\n\nWEBSITE CARE (monthly retainers):\n\n${care}\n\nBLOG WRITING (monthly add-on or one-time):\n\n${blogBlock}\n\nAI CHATBOT (monthly add-on or standalone):\n\n${chatbotBlock}\n\n${faqBlock}`
  return section('PRICING', body)
}

function buildFit(): string {
  const f = areWeAFitPageContent
  const body = [
    f.heroHeading,
    f.heroSubheading,
    `### ${f.idealSection.heading}\n${bullets(f.idealSection.bullets)}`,
    `### ${f.notIdealSection.heading}\n${bullets(f.notIdealSection.bullets)}`,
    `### ${f.budgetSection.heading}\n${f.budgetSection.body}`,
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
    buildCaseStudies(caseStudies ?? []),
    buildFaqs(faqs ?? []),
    buildAuthor(author),
  ].filter(Boolean).join('\n')

  _cachedBlob = blob
  _cachedAt = now
  return blob
}

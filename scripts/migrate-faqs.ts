/**
 * One-time migration: create FAQ documents in Sanity.
 * Default: dry run. Pass --live to write.
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient, type SanityClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

import { pricingFAQs } from '../data/pricing'

const API_VERSION = '2025-12-05'

type Placement = 'homepage' | 'faqPage' | 'both'

type FaqSeed = {
  question: string
  answer: string
  placement: Placement
  sortOrder: number
}

const FAQS: FaqSeed[] = [
  {
    question: 'Why do clients choose Vizantir over larger agencies?',
    answer:
      'Larger agencies charge for overhead — account managers, layers of approval, offices. We cut all of that. What you get is senior-level strategy and execution, faster turnaround, and direct communication from kickoff to launch. No handoffs, no junior teams running your account.',
    placement: 'homepage',
    sortOrder: 10,
  },
  {
    question: 'How does your engagement model work?',
    answer:
      "We don't lock clients into long-term retainers before proving our value. We start with a strategy call to understand your goals, then propose a scoped engagement with clear deliverables and pricing. Ongoing retainers are available once we've earned them.",
    placement: 'homepage',
    sortOrder: 20,
  },
  {
    question: 'What does the timeline look like from kickoff to launch?',
    answer: `${pricingFAQs.timeline} SEO and paid media campaigns are typically live within 2 weeks.`,
    placement: 'homepage',
    sortOrder: 30,
  },
  {
    question: 'Can you work with an existing site or brand?',
    answer:
      "Yes. We audit what you have, identify what's working and what isn't, and improve from there. You don't need to start from scratch. If a full rebuild makes more sense, we'll tell you honestly and explain why.",
    placement: 'homepage',
    sortOrder: 40,
  },
  {
    question: 'What industries do you specialize in?',
    answer:
      'We work with established businesses across many sectors — beauty and wellness, creative studios, professional services, retail, luxury, and financial services. The common thread is established businesses where presentation and trust affect revenue.',
    placement: 'homepage',
    sortOrder: 50,
  },
  {
    question: "What's your philosophy on design and results?",
    answer:
      'Design without strategy is decoration. Every decision we make — layout, copy, structure, speed — is tied to a business outcome. We build sites that convert, run ads that track to revenue, and measure what actually moves your business forward.',
    placement: 'homepage',
    sortOrder: 60,
  },
  {
    question: 'How much does a website project cost?',
    answer: `${pricingFAQs.cost} Every project is scoped and priced clearly upfront — no vague starting-at numbers, no surprise invoices.`,
    placement: 'faqPage',
    sortOrder: 10,
  },
  {
    question: 'How long does a website project take?',
    answer: `${pricingFAQs.timeline} Timelines are set at scoping and held — we move as fast as your feedback allows.`,
    placement: 'faqPage',
    sortOrder: 20,
  },
  {
    question: 'Do you build in Next.js or WordPress?',
    answer:
      "Both, depending on what fits the project. Next.js for performance-critical, custom builds. WordPress when the client needs a widely supported CMS and a familiar editing environment. We'll recommend the right platform based on your goals, team, and content needs — not our preference.",
    placement: 'faqPage',
    sortOrder: 30,
  },
  {
    question: 'Do you use templates or website builders?',
    answer:
      'Every site we build is custom — scoped to your business, coded from scratch. Builders and templates have their place when budget is the only driver. When the goal is a site that performs, ranks, and holds up under real scrutiny, that approach does not get you there. We have never shipped a template.',
    placement: 'faqPage',
    sortOrder: 32,
  },
  {
    question: 'Will my website work on all devices and screen sizes?',
    answer:
      'Every site we build is tested across mobile, tablet, and desktop — portrait and landscape. Mobile is treated as the primary experience, not an afterthought. If it does not look and work correctly on every screen size and orientation, it does not ship.',
    placement: 'faqPage',
    sortOrder: 34,
  },
  {
    question: 'Do you research my competitors before designing the site?',
    answer:
      'Yes. Before any design work starts we look at how your competitors are positioning themselves online — what they are doing well and where the gaps are. That research shapes the strategy, the structure, and the direction of the site. You should not be guessing what makes you different. We find it.',
    placement: 'faqPage',
    sortOrder: 36,
  },
  {
    question: 'Do you redesign existing websites?',
    answer:
      "Yes. We audit what you have, identify what's working, and rebuild from there. You don't need to start from scratch. If a full rebuild makes more sense, we'll tell you honestly and explain why.",
    placement: 'faqPage',
    sortOrder: 40,
  },
  {
    question: 'What happens after the site launches?',
    answer: `${pricingFAQs.retainer} Most clients stay on retainer after launch so the site keeps performing as the business evolves.`,
    placement: 'faqPage',
    sortOrder: 50,
  },
  {
    question: 'Do you write copy for the website?',
    answer:
      'We can guide the copy structure and messaging strategy as part of the project scope. For full copywriting, we work with trusted partners we can bring in — or we work with your existing content and sharpen it for the web.',
    placement: 'faqPage',
    sortOrder: 60,
  },
  {
    question: 'After you build the site, will I need a developer for every change?',
    answer:
      "No. Content changes — blog posts, case studies, service descriptions, images, team members, testimonials — are all handled through Sanity Studio, a clean editor we set up with your site. It works like a better version of the WordPress admin, without the maintenance headaches. You'll need a developer only for structural or design changes (new page types, layout overhauls, new integrations). Day-to-day content management is fully yours. Unlike WordPress, there are no plugins to update, no security patches to chase, and no compatibility testing to worry about. Edit content, publish, done.",
    placement: 'both',
    sortOrder: 70,
  },
]

function requireEnv(name: string, value: string | undefined): string {
  if (!value || !String(value).trim()) {
    console.error(`Missing required environment variable: ${name}`)
    process.exit(1)
  }
  return value.trim()
}

function firstFourWordsSlug(question: string): string {
  const words = question
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .map((w) => w.toLowerCase().replace(/[^a-z0-9]+/g, ''))
    .filter(Boolean)
  return words.join('-') || 'item'
}

function faqDocumentId(sortOrder: number, question: string): string {
  return `faq-${sortOrder}-${firstFourWordsSlug(question)}`
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return `${s.slice(0, max - 1)}…`
}

async function main() {
  loadEnv({ path: join(ROOT, '.env.local') })

  const projectId = requireEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)
  const dataset = requireEnv('NEXT_PUBLIC_SANITY_DATASET', process.env.NEXT_PUBLIC_SANITY_DATASET)
  const token = requireEnv('SANITY_API_WRITE_TOKEN', process.env.SANITY_API_WRITE_TOKEN)

  const isLive = process.argv.includes('--live')
  console.log(isLive ? 'LIVE' : 'DRY RUN')
  console.log('')

  const client: SanityClient | null = isLive
    ? createClient({
        projectId,
        dataset,
        token,
        apiVersion: API_VERSION,
        useCdn: false,
      })
    : null

  const total = FAQS.length
  let n = 0

  for (const faq of FAQS) {
    n++
    const _id = faqDocumentId(faq.sortOrder, faq.question)
    const doc = {
      _id,
      _type: 'faq' as const,
      question: faq.question,
      answer: faq.answer,
      placement: faq.placement,
      sortOrder: faq.sortOrder,
    }

    const label = truncate(faq.question, 60)

    if (isLive && client) {
      await client.createOrReplace(doc)
      console.log(`[${n}/${total}] Created/Updated: ${label}`)
    } else {
      console.log(`[${n}/${total}] Would create/update: ${_id} — ${label}`)
    }
  }

  if (!isLive) {
    console.log('')
    console.log('Dry run complete — no writes. Pass --live to write to Sanity.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

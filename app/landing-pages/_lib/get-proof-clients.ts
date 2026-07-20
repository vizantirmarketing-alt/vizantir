import { sanityFetch } from '@/lib/sanity/client'
import { landingPagesProofBandQuery } from '@/lib/sanity/queries'

export type ProofClient = {
  slug: string
  title: string
}

/**
 * Intended Proof Band clients. Spec GROQ used `pink-salt-salon-and-spa`;
 * live Sanity slug is confirmed at build time (currently `pink-salt-salon`).
 */
const INTENDED_CLIENTS = [
  {
    label: 'Eloraé Nails',
    candidateSlugs: ['elorae-nails'] as const,
  },
  {
    label: 'Pink Salt Salon & Spa',
    candidateSlugs: ['pink-salt-salon-and-spa', 'pink-salt-salon'] as const,
  },
  {
    label: 'Meridian Row',
    candidateSlugs: ['meridian-row'] as const,
  },
] as const

const SPEC_SLUGS = [
  'elorae-nails',
  'pink-salt-salon-and-spa',
  'meridian-row',
] as const

export async function getProofBandClients(): Promise<ProofClient[]> {
  const results = await sanityFetch<ProofClient[]>(
    landingPagesProofBandQuery,
    {},
    { tags: ['caseStudy'] },
  )

  const bySlug = new Map(results.map((item) => [item.slug, item]))
  const verified: ProofClient[] = []

  for (const intended of INTENDED_CLIENTS) {
    const match = intended.candidateSlugs
      .map((slug) => bySlug.get(slug))
      .find((item): item is ProofClient => Boolean(item))

    if (!match) {
      console.warn(
        `[landing-pages ProofBand] Could not verify case study "${intended.label}" — removed from Proof Band copy.`,
      )
      continue
    }

    const preferredSpecSlug = intended.candidateSlugs[0]
    if (
      SPEC_SLUGS.includes(preferredSpecSlug as (typeof SPEC_SLUGS)[number]) &&
      match.slug !== preferredSpecSlug
    ) {
      console.warn(
        `[landing-pages ProofBand] Spec slug "${preferredSpecSlug}" did not resolve. Using Sanity slug "${match.slug}" (${match.title}).`,
      )
    }

    verified.push(match)
  }

  if (verified.length === 0) {
    console.warn(
      '[landing-pages ProofBand] No case studies verified — Proof Band will omit named clients.',
    )
  }

  return verified
}

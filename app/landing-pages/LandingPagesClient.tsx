'use client'

import { ClosingCTA } from './_components/ClosingCTA'
import { DeliverablesBlock } from './_components/DeliverablesBlock'
import { HandoffPreview } from './_components/HandoffPreview'
import { HomepageProblem } from './_components/HomepageProblem'
import { LandingPagesFAQ } from './_components/LandingPagesFAQ'
import { LandingPagesHero } from './_components/LandingPagesHero'
import { Process } from './_components/Process'
import { ProductDefinition } from './_components/ProductDefinition'
import { QualifierBand } from './_components/QualifierBand'
import { RelatedServices } from './_components/RelatedServices'
import { VariantComparisonTable } from './_components/VariantComparisonTable'
import { VariantSystemDemo } from './_components/VariantSystemDemo'
import { TierComparison } from '@/components/landing-pages/TierComparison'
import { variants } from './_data/variants'
import type { ProofClient } from './_lib/get-proof-clients'

type LandingPagesClientProps = {
  proofClients: ProofClient[]
}

export default function LandingPagesClient({
  proofClients: _proofClients,
}: LandingPagesClientProps) {
  const v = variants.primary

  return (
    <main className="bg-background text-foreground transition-colors duration-500">
      {/* Atmosphere image slot: focused campaign landing page / conversion surface visual to be added in follow-up */}
      <LandingPagesHero {...v.hero} />
      <HomepageProblem {...v.homepageProblem} />
      <ProductDefinition />
      <TierComparison showLiveExampleLinks={false} />
      <VariantSystemDemo />
      <VariantComparisonTable currentSlug={v.slug} />
      <DeliverablesBlock />
      <Process emphasis={v.processEmphasis} />
      <HandoffPreview trackingLocation="landing_pages_primary_handoff" />
      <QualifierBand overrides={v.qualifierOverrides} />
      <LandingPagesFAQ faqs={v.faqs} />
      <RelatedServices />
      <ClosingCTA {...v.closingCta} />
    </main>
  )
}

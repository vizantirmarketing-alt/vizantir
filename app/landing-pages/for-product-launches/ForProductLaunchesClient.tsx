'use client'

import { ClosingCTA } from '../_components/ClosingCTA'
import { DeliverablesBlock } from '../_components/DeliverablesBlock'
import { HomepageProblem } from '../_components/HomepageProblem'
import { LandingPagesFAQ } from '../_components/LandingPagesFAQ'
import { LandingPagesHero } from '../_components/LandingPagesHero'
import { Process } from '../_components/Process'
import { ProductDefinition } from '../_components/ProductDefinition'
import { ProofBand } from '../_components/ProofBand'
import { QualifierBand } from '../_components/QualifierBand'
import { RelatedServices } from '../_components/RelatedServices'
import { TierComparison } from '@/components/landing-pages/TierComparison'
import { variants } from '../_data/variants'
import type { ProofClient } from '../_lib/get-proof-clients'

type ForProductLaunchesClientProps = {
  proofClients: ProofClient[]
}

export default function ForProductLaunchesClient({
  proofClients,
}: ForProductLaunchesClientProps) {
  const v = variants.productLaunches

  return (
    <main className="bg-background text-foreground transition-colors duration-500">
      {/* Atmosphere image slot — product launch day / offer-focused visual to be added in follow-up */}
      <LandingPagesHero {...v.hero} />
      <HomepageProblem {...v.homepageProblem} />
      <ProductDefinition />
      <TierComparison />
      <DeliverablesBlock />
      <Process />
      <ProofBand clients={proofClients} />
      <QualifierBand />
      <LandingPagesFAQ faqs={v.faqs} />
      <RelatedServices />
      <ClosingCTA {...v.closingCta} />
    </main>
  )
}

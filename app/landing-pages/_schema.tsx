import { variants } from './_data/variants'
import { buildLandingPagesSchema, LandingPagesJsonLd } from './_lib/build-schema'

const v = variants.primary
const PAGE_URL = 'https://www.vizantir.com/landing-pages'

export function LandingPagesPageSchema() {
  const schema = buildLandingPagesSchema({
    pageUrl: PAGE_URL,
    serviceName: 'Landing Page Design & Development',
    serviceDescription: v.metaDescription,
    faqs: v.faqs,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Landing Pages', path: '/landing-pages' },
    ],
  })

  return <LandingPagesJsonLd schema={schema} />
}

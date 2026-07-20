import { variants } from '../_data/variants'
import { buildLandingPagesSchema, LandingPagesJsonLd } from '../_lib/build-schema'

const v = variants.productLaunches
const PAGE_URL = 'https://www.vizantir.com/landing-pages/for-product-launches'

export function ForProductLaunchesPageSchema() {
  const schema = buildLandingPagesSchema({
    pageUrl: PAGE_URL,
    serviceName: 'Product Launch Landing Pages',
    serviceDescription: v.metaDescription,
    faqs: v.faqs,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Landing Pages', path: '/landing-pages' },
      { name: 'For Product Launches', path: '/landing-pages/for-product-launches' },
    ],
  })

  return <LandingPagesJsonLd schema={schema} />
}

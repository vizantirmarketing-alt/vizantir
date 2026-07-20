import { variants } from '../_data/variants'
import { buildLandingPagesSchema, LandingPagesJsonLd } from '../_lib/build-schema'

const v = variants.googleAds
const PAGE_URL = 'https://www.vizantir.com/landing-pages/for-google-ads'

export function ForGoogleAdsPageSchema() {
  const schema = buildLandingPagesSchema({
    pageUrl: PAGE_URL,
    serviceName: 'Google Ads Landing Pages',
    serviceDescription: v.metaDescription,
    faqs: v.faqs,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Landing Pages', path: '/landing-pages' },
      { name: 'For Google Ads', path: '/landing-pages/for-google-ads' },
    ],
  })

  return <LandingPagesJsonLd schema={schema} />
}

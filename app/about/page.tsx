import { getPageSeo } from '@/sanity/lib/seo';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, graphSchema } from '@/lib/schema';
import AboutPageClient from './AboutPageClient';

const breadcrumbGraph = graphSchema([
  breadcrumbSchema([
    { name: 'Home', url: 'https://www.vizantir.com' },
    { name: 'About', url: 'https://www.vizantir.com/about' },
  ]),
]);

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageSeo('about');
  
  return {
    title: page?.seo?.metaTitle || 'About Vizantir | Premium Web Design Studio Las Vegas',
    description:
      page?.seo?.metaDescription ||
      'Learn about our team and philosophy as we craft bespoke websites for restaurants, law firms and real estate clients nationwide from Las Vegas.',
    openGraph: {
      title: page?.seo?.metaTitle || 'About Vizantir | Premium Web Design Studio Las Vegas',
      description:
        page?.seo?.metaDescription ||
        'Learn about our team and philosophy as we craft bespoke websites for restaurants, law firms and real estate clients nationwide from Las Vegas.',
      ...(page?.seo?.ogImage && { images: [page.seo.ogImage] }),
    },
  };
}

export default function AboutPage() {
  return (
    <>
      <JsonLd id="ld-breadcrumb" data={breadcrumbGraph} />
      <AboutPageClient />
    </>
  );
}

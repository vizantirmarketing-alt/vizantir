import { getPageSeo } from '@/sanity/lib/seo';
import type { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';

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
  return <AboutPageClient />;
}

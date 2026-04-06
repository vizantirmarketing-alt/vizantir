import { getPageSeo } from '@/sanity/lib/seo';
import type { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageSeo('about');
  
  return {
    title: page?.seo?.metaTitle || 'Vizantir',
    description: page?.seo?.metaDescription || 'Premium Website Design Studio',
    openGraph: {
      title: page?.seo?.metaTitle || 'Vizantir',
      description: page?.seo?.metaDescription || 'Premium Website Design Studio',
      ...(page?.seo?.ogImage && { images: [page.seo.ogImage] }),
    },
  };
}

export default function AboutPage() {
  return <AboutPageClient />;
}

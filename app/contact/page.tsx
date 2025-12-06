import { getPageSeo } from '@/sanity/lib/seo';
import type { Metadata } from 'next';
import ContactPageClient from './ContactPageClient';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageSeo('contact');
  
  return {
    title: page?.seo?.metaTitle || 'Vizantir',
    description: page?.seo?.metaDescription || 'Digital Marketing Agency',
    openGraph: {
      title: page?.seo?.metaTitle || 'Vizantir',
      description: page?.seo?.metaDescription || 'Digital Marketing Agency',
      ...(page?.seo?.ogImage && { images: [page.seo.ogImage] }),
    },
  };
}

export default function ContactPage() {
  return <ContactPageClient />;
}

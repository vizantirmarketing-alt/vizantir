import { getPageSeo } from '@/sanity/lib/seo';
import type { Metadata } from 'next';
import ContactPageClient from './ContactPageClient';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageSeo('contact');
  
  return {
    title: page?.seo?.metaTitle || 'Contact Vizantir Web Design Studio Las Vegas | Start Your Project',
    description:
      page?.seo?.metaDescription ||
      'Get in touch to discuss your custom website project, book a consultation or learn how our Las Vegas studio can elevate your online presence.',
    openGraph: {
      title: page?.seo?.metaTitle || 'Contact Vizantir Web Design Studio Las Vegas | Start Your Project',
      description:
        page?.seo?.metaDescription ||
        'Get in touch to discuss your custom website project, book a consultation or learn how our Las Vegas studio can elevate your online presence.',
      ...(page?.seo?.ogImage && { images: [page.seo.ogImage] }),
    },
  };
}

export default function ContactPage() {
  return <ContactPageClient />;
}

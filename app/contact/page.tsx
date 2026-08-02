import { getPageSeo } from '@/sanity/lib/seo';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, graphSchema } from '@/lib/schema';
import ContactPageClient from './ContactPageClient';

const breadcrumbGraph = graphSchema([
  breadcrumbSchema([
    { name: 'Home', url: 'https://www.vizantir.com' },
    { name: 'Contact', url: 'https://www.vizantir.com/contact' },
  ]),
]);

const CONTACT_URL = 'https://www.vizantir.com/contact'
const CONTACT_TITLE =
  'Contact Vizantir Web Design Studio Las Vegas | Start Your Project'
const CONTACT_DESCRIPTION =
  'Get in touch to discuss your custom website project, book a consultation or learn how our Las Vegas studio can elevate your online presence.'
const ROOT_OG_IMAGES = [
  {
    url: 'https://www.vizantir.com/og-image.png',
    width: 1200,
    height: 630,
    alt: 'Vizantir Design Studio - Premium Web Design Las Vegas',
  },
]

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageSeo('contact');
  const title = page?.seo?.metaTitle || CONTACT_TITLE
  const description = page?.seo?.metaDescription || CONTACT_DESCRIPTION
  
  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: CONTACT_URL,
    },
    openGraph: {
      title,
      description,
      url: CONTACT_URL,
      siteName: 'Vizantir',
      locale: 'en_US',
      type: 'website',
      images: page?.seo?.ogImage ? [page.seo.ogImage] : ROOT_OG_IMAGES,
    },
  };
}

export default function ContactPage() {
  return (
    <>
      <JsonLd id="ld-breadcrumb" data={breadcrumbGraph} />
      <ContactPageClient />
    </>
  );
}

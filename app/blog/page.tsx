import { getPageSeo } from '@/sanity/lib/seo';
import type { Metadata } from 'next';
import BlogPageClient from './BlogPageClient';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageSeo('blog');
  
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

export default function BlogPage() {
  return <BlogPageClient />;
}

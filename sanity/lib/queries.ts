import { groq } from 'next-sanity';

export const seoQuery = groq`
  *[_type == "page" && slug.current == $slug][0] {
    title,
    "slug": slug.current,
    seo {
      metaTitle,
      metaDescription,
      canonicalUrl,
      noIndex,
      "ogImage": ogImage.asset->url
    }
  }
`;


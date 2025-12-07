import { client } from './client';
import { seoQuery } from './queries';

export async function getPageSeo(slug: string) {
  return client.fetch(seoQuery, { slug });
}




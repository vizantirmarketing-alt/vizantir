import { author } from './author';
import { caseStudy } from './caseStudy';
import { category } from './category';
import faq from './faq';
import { location } from './location';
import { page } from './page';
import { post } from './post';
import { seo } from './seo';
import { service } from './service';
import { siteSettings } from './siteSettings';

export const schemaTypes = [
  seo,
  author,
  post,
  service,
  caseStudy,
  location,
  category,
  page,
  faq,
  siteSettings,
];

import { author } from './author';
import { category } from './category';
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
  location,
  category,
  page,
  siteSettings,
];

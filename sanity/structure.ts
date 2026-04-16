import type { StructureResolver } from 'sanity/structure';

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site settings')
        .id('siteSettings')
        .schemaType('siteSettings')
        .child(S.documentTypeList('siteSettings').title('Site settings')),
      S.divider(),
      S.listItem()
        .title('Pages')
        .id('page')
        .schemaType('page')
        .child(S.documentTypeList('page').title('Pages')),
      S.listItem()
        .title('Posts')
        .id('post')
        .schemaType('post')
        .child(S.documentTypeList('post').title('Posts')),
      S.listItem()
        .title('Authors')
        .id('author')
        .schemaType('author')
        .child(S.documentTypeList('author').title('Authors')),
      S.listItem()
        .title('Services')
        .id('service')
        .schemaType('service')
        .child(S.documentTypeList('service').title('Services')),
      S.listItem()
        .title('Case Studies')
        .id('caseStudy')
        .schemaType('caseStudy')
        .child(S.documentTypeList('caseStudy').title('Case Studies')),
      S.listItem()
        .title('Locations')
        .id('location')
        .schemaType('location')
        .child(S.documentTypeList('location').title('Locations')),
      S.listItem()
        .title('Categories')
        .id('category')
        .schemaType('category')
        .child(S.documentTypeList('category').title('Categories')),
    ]);

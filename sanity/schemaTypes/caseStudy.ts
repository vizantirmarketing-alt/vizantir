import { defineField, defineType } from 'sanity';

export const caseStudy = defineType({
  name: 'caseStudy',
  title: 'Case Studies',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'client',
      title: 'Client',
      type: 'string',
      description: 'Client or brand name',
    }),
    defineField({
      name: 'projectType',
      title: 'Project type',
      type: 'string',
      description:
        'Commissioned client work or a self-initiated studio project. Defaults to client so existing documents stay classified until they are set.',
      options: {
        list: [
          { title: 'Client', value: 'client' },
          { title: 'Studio', value: 'studio' },
        ],
        layout: 'radio',
      },
      initialValue: 'client',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'industry',
      title: 'Industry',
      type: 'string',
      description: 'Example: Luxury E-commerce',
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
      description: 'One paragraph shown on the case studies index page',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      of: [
        {
          name: 'galleryImage',
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt text',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'challenge',
      title: 'Challenge',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'solution',
      title: 'Solution',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'results',
      title: 'Results',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'stack',
      title: 'Tech stack',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'siteUrl',
      title: 'Site URL',
      type: 'url',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      description:
        'Lower numbers appear first on /case-studies. Use gaps of 10 so a case study can be inserted later without renumbering.',
      validation: (Rule) => Rule.required().integer().min(0),
      initialValue: 100,
    }),
    defineField({
      name: 'seo',
      title: 'SEO Settings',
      type: 'seo',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      client: 'client',
      projectType: 'projectType',
      sortOrder: 'sortOrder',
      media: 'heroImage',
    },
    prepare({ title, client, projectType, sortOrder, media }) {
      const clientLabel = client || 'No client';
      const typeLabel = projectType === 'studio' ? 'Studio' : 'Client';
      return {
        title,
        subtitle: `${clientLabel} · ${typeLabel} · sort: ${sortOrder ?? 100}`,
        media,
      };
    },
  },
  orderings: [
    {
      title: 'Sort order (ascending)',
      name: 'sortOrderAsc',
      by: [{ field: 'sortOrder', direction: 'asc' }],
    },
  ],
});

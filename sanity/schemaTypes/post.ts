import { defineField, defineType } from 'sanity';

export const post = defineType({
  name: 'post',
  title: 'Posts',
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
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 5,
      validation: (Rule) => Rule.max(300).warning('Keep under 300 characters'),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Platform', value: 'Platform' },
          { title: 'Cost', value: 'Cost' },
          { title: 'Performance', value: 'Performance' },
          { title: 'Security', value: 'Security' },
          { title: 'SEO', value: 'SEO' },
          { title: 'Hosting', value: 'Hosting' },
          { title: 'Business', value: 'Business' },
          { title: 'Technology', value: 'Technology' },
          { title: 'Comparison', value: 'Comparison' },
          { title: 'Philosophy', value: 'Philosophy' },
          { title: 'Strategy', value: 'Strategy' },
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'readTime',
      title: 'Read Time',
      type: 'string',
      description: 'Human-readable read time, e.g. "9 min read"',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        { type: 'block' },
        {
          type: 'object',
          name: 'codeBlock',
          title: 'Code Block',
          fields: [
            {
              name: 'language',
              title: 'Language',
              type: 'string',
              options: {
                list: [
                  { title: 'TypeScript', value: 'typescript' },
                  { title: 'JavaScript', value: 'javascript' },
                  { title: 'TSX', value: 'tsx' },
                  { title: 'JSX', value: 'jsx' },
                  { title: 'HTML', value: 'html' },
                  { title: 'CSS', value: 'css' },
                  { title: 'JSON', value: 'json' },
                  { title: 'SQL', value: 'sql' },
                  { title: 'PHP', value: 'php' },
                  { title: 'Bash', value: 'bash' },
                  { title: 'Plain text', value: 'text' },
                ],
              },
              initialValue: 'text',
            },
            {
              name: 'code',
              title: 'Code',
              type: 'text',
              rows: 10,
            },
            {
              name: 'filename',
              title: 'Filename (optional)',
              type: 'string',
              description: 'Optional filename to show above the code',
            },
          ],
          preview: {
            select: {
              language: 'language',
              code: 'code',
              filename: 'filename',
            },
            prepare({ language, code, filename }) {
              const firstLine = (code || '').split('\n')[0].slice(0, 60);
              return {
                title: filename || firstLine || 'Code block',
                subtitle: language ? `[${language}]` : undefined,
              };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO Settings',
      type: 'seo',
    }),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      description: 'Used as OG fallback when SEO social image is empty',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'mainImage',
      publishedAt: 'publishedAt',
    },
    prepare({ title, media, publishedAt }) {
      return {
        title,
        media,
        subtitle: publishedAt
          ? new Date(publishedAt).toLocaleDateString()
          : undefined,
      };
    },
  },
  orderings: [
    {
      title: 'Published date, new',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
});

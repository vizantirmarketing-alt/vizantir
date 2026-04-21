import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: (Rule) => Rule.required().max(200),
    }),
    defineField({
      name: 'answer',
      title: 'Answer',
      type: 'text',
      rows: 6,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'placement',
      title: 'Placement',
      type: 'string',
      description: 'Where this FAQ appears on the site',
      options: {
        list: [
          { title: 'Homepage only', value: 'homepage' },
          { title: 'FAQ page only', value: 'faqPage' },
          { title: 'Both homepage and FAQ page', value: 'both' },
        ],
        layout: 'radio',
      },
      initialValue: 'faqPage',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      description: 'Lower numbers appear first',
      validation: (Rule) => Rule.required().integer().min(0),
      initialValue: 100,
    }),
  ],
  preview: {
    select: {
      title: 'question',
      placement: 'placement',
      sortOrder: 'sortOrder',
    },
    prepare({ title, placement, sortOrder }) {
      const placementLabel =
        placement === 'homepage' ? 'Homepage' :
        placement === 'faqPage' ? 'FAQ Page' :
        placement === 'both' ? 'Both' : '?'
      return {
        title,
        subtitle: `${placementLabel} · sort: ${sortOrder ?? 100}`,
      }
    },
  },
  orderings: [
    {
      title: 'Sort order (ascending)',
      name: 'sortOrderAsc',
      by: [{ field: 'sortOrder', direction: 'asc' }],
    },
  ],
})

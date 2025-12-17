import { defineField, defineType } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'siteName',
      title: 'Site Name',
      type: 'string',
      description: 'The name of your website/organization',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'siteUrl',
      title: 'Site URL',
      type: 'url',
      description: 'The full URL of your website (e.g., https://vizantir.com)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'defaultMetaTitle',
      title: 'Default Meta Title',
      type: 'string',
      description: 'Default title for pages without a custom title',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'defaultMetaDescription',
      title: 'Default Meta Description',
      type: 'text',
      description: 'Default description for pages without a custom description',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'organizationDescription',
      title: 'Organization Description',
      type: 'text',
      description: 'A brief description of your organization',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      description: 'Your organization logo',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'ogImage',
      title: 'Open Graph Image',
      type: 'image',
      description: 'Default image for social media sharing (1200x630px recommended)',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Media Links',
      type: 'object',
      fields: [
        defineField({
          name: 'linkedin',
          title: 'LinkedIn',
          type: 'url',
        }),
        defineField({
          name: 'twitter',
          title: 'Twitter',
          type: 'url',
        }),
        defineField({
          name: 'instagram',
          title: 'Instagram',
          type: 'url',
        }),
      ],
    }),
    defineField({
      name: 'hasPhysicalLocation',
      title: 'Has Physical Location',
      type: 'boolean',
      description: 'Does your business have a physical location?',
      initialValue: false,
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'object',
      fields: [
        defineField({
          name: 'street',
          title: 'Street Address',
          type: 'string',
        }),
        defineField({
          name: 'city',
          title: 'City',
          type: 'string',
        }),
        defineField({
          name: 'state',
          title: 'State',
          type: 'string',
        }),
        defineField({
          name: 'zip',
          title: 'ZIP Code',
          type: 'string',
        }),
        defineField({
          name: 'country',
          title: 'Country',
          type: 'string',
          initialValue: 'US',
        }),
      ],
    }),
    defineField({
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
      description: 'Business phone number',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      description: 'Business email address',
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: 'foundingDate',
      title: 'Founding Date',
      type: 'string',
      description: 'Year the organization was founded (e.g., "2024")',
    }),
    defineField({
      name: 'priceRange',
      title: 'Price Range',
      type: 'string',
      description: 'Price range indicator for local business schema',
      options: {
        list: [
          { title: '$', value: '$' },
          { title: '$$', value: '$$' },
          { title: '$$$', value: '$$$' },
          { title: '$$$$', value: '$$$$' },
        ],
      },
    }),
    defineField({
      name: 'areaServed',
      title: 'Area Served',
      type: 'array',
      description: 'Locations, regions, or areas where your business operates',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'knowsAbout',
      title: 'Knows About (E-E-A-T)',
      type: 'array',
      description: 'Areas of expertise for E-E-A-T signals (Experience, Expertise, Authoritativeness, Trustworthiness)',
      of: [{ type: 'string' }],
    }),
  ],
  preview: {
    select: {
      title: 'siteName',
    },
  },
});


import { carePricing } from './pricing'

export const howWeWorkProcess = [
  {
    number: '01',
    title: 'Discovery',
    description:
      'We start by learning your business, your market, your competitors, and where the real opportunity is. Before any design work begins we map what the site needs to do, who it needs to reach, and what will make someone choose you over the next option they find.',
  },
  {
    number: '02',
    title: 'Proposal',
    description:
      "You receive a clear scope document: what's included, what's not, the price, and the timeline. No hidden fees. No vague estimates.",
  },
  {
    number: '03',
    title: 'Deposit',
    description:
      '50% deposit to begin. This secures your spot and lets us start work immediately.',
  },
  {
    number: '04',
    title: 'Build',
    description:
      'Design, development, and check-ins at key milestones. You see the work in progress at each milestone and give feedback before we move to the next one. You’re never left wondering where things stand.',
  },
  {
    number: '05',
    title: 'Launch',
    description:
      'Final review, remaining balance, and we go live. You get a finished product, not 70% of one.',
  },
] as const

export const howWeWorkFaqs = [
  {
    question: 'What if the scope changes?',
    answer:
      "No problem. I'll send a change order with the additional cost. You approve it before any extra work begins.",
  },
  {
    question: 'How long does a project take?',
    answer:
      'Depends on scope. Most builds run 6 to 12 weeks. Timeline is defined after scoping.',
  },
  {
    question: 'What if I need to pause the project?',
    answer:
      'Projects paused 30+ days will be re-scoped. Remaining balance becomes due. This protects both of us.',
  },
  {
    question: 'Do you offer payment plans?',
    answer:
      'Two payments are standard: 50% deposit to begin, 50% on completion before launch.',
  },
  {
    question: 'What happens after launch?',
    answer:
      `Launch support is included. For ongoing maintenance, we offer monthly Website Care retainers starting at ${carePricing[0].price} for ${carePricing[0].name}, with ${carePricing[1].name} and ${carePricing[2].name} when you need more bandwidth.`,
  },
] as const

export const howWeWorkComparisonColumns = [
  {
    name: 'Traditional Agencies',
    items: [
      'Big teams, big overhead',
      'Layers between you and the work',
      'Vague quotes, surprise invoices',
      'Account managers, not builders',
    ],
  },
  {
    name: 'Hourly Dev Shops',
    items: [
      'You buy hours, not outcomes',
      '100 hours in, project 60% done',
      'No guaranteed deliverable',
      '"Buy more hours to finish"',
    ],
  },
  {
    name: 'Vizantir',
    items: [
      'Fixed scope, fixed price',
      'You get a finished product',
      'Direct access to the builder',
      'No surprise invoices',
    ],
  },
] as const

export const howWeWorkComparisonTagline =
  'We don’t sell hours. We deliver finished products.'

export const howWeWorkIncludesHeading = 'Every Project Includes'

export const howWeWorkIncludes = [
  'Defined scope before work begins',
  'Milestone updates throughout',
  'Mobile-responsive design',
  'Basic SEO setup',
  'Launch support',
] as const

export const howWeWorkExcludesHeading = 'Not Included (Unless Scoped)'

export const howWeWorkExcludes = [
  'Unlimited revisions',
  'Ongoing maintenance ($295/mo, optional)',
  'Content writing',
  'Stock photography',
  'Hosting fees',
] as const

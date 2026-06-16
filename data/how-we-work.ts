import { carePricing } from './pricing'

export const howWeWorkProcess = [
  {
    number: '01',
    title: 'Discovery',
    description:
      'We start by learning your business — not just your goals, but your market, your competitors, and where the real opportunity is. Before any design work begins we map what the site needs to do, who it needs to reach, and what will make someone choose you over the next option they find.',
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
      "Design, development, and check-ins at key milestones. You're never left wondering where things stand.",
  },
  {
    number: '05',
    title: 'Launch',
    description:
      "Final review, remaining balance, and we go live. You get a finished product — not 70% of one.",
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
      'Depends on scope. WordPress sites: 3-5 weeks. Next.js builds: 5-8 weeks. Timeline is defined after scoping.',
  },
  {
    question: 'What if I need to pause the project?',
    answer:
      'Projects paused 30+ days will be re-scoped. Remaining balance becomes due. This protects both of us.',
  },
  {
    question: 'Do you offer payment plans?',
    answer:
      'Milestone payments are standard: 50% deposit, 25% at design approval, 25% before launch.',
  },
  {
    question: 'What happens after launch?',
    answer:
      `Launch support is included. For ongoing maintenance, we offer monthly Website Care retainers starting at ${carePricing[0].price} for Essentials Care, with Growth Care and Enterprise Care when you need more bandwidth.`,
  },
] as const

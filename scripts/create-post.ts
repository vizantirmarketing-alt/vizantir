/**
 * Create a new post document in Sanity.
 * Swap POST_DATA and run: npm run create:post
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient, type SanityClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const API_VERSION = '2025-12-05'

function requireEnv(name: string, value: string | undefined): string {
  if (!value || !String(value).trim()) {
    console.error(`Missing required environment variable: ${name}`)
    process.exit(1)
  }
  return value.trim()
}

function createWriteClient(): SanityClient {
  loadEnv({ path: join(ROOT, '.env.local') })

  const projectId = requireEnv(
    'NEXT_PUBLIC_SANITY_PROJECT_ID',
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  )
  const dataset = requireEnv('NEXT_PUBLIC_SANITY_DATASET', process.env.NEXT_PUBLIC_SANITY_DATASET)
  const token = requireEnv('SANITY_API_WRITE_TOKEN', process.env.SANITY_API_WRITE_TOKEN)

  return createClient({
    projectId,
    dataset,
    token,
    apiVersion: API_VERSION,
    useCdn: false,
  })
}

async function main() {
  const client = createWriteClient()
  const slug = POST_DATA.slug.current

  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == "post" && slug.current == $slug][0]{ _id }`,
    { slug }
  )

  if (existing) {
    console.log(`Already exists: ${slug}`)
    process.exit(0)
  }

  const created = await client.create(POST_DATA)
  console.log(created._id)
}

const POST_DATA = {
  _type: 'post',
  title: 'Is Your Marketing Company Actually Doing the Work?',
  slug: {
    _type: 'slug',
    current: 'is-your-marketing-company-doing-the-work',
  },
  publishedAt: '2026-10-28T12:00:00.000Z',
  category: 'Strategy',
  excerpt:
    'A monthly retainer, a branded report, and a website that has not changed in a year. Here is how to tell whether you are paying for work or paying a markup on a software subscription.',
  readTime: '6 min read',
  tags: ['Marketing', 'SEO', 'Retainer', 'Local Business', 'Reporting'],
  author: {
    _type: 'reference',
    _ref: 'author-james-tram',
  },
  seo: {
    metaTitle: 'Is Your Marketing Company Doing the Work?',
    metaDescription:
      'Three checks any business owner can run in an afternoon to find out whether a monthly marketing retainer is paying for real work or a resold software subscription.',
    noIndex: false,
  },
  body: [
    {
      _type: 'block',
      _key: '0f6d8b64d007',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'ee5cac53bbac',
          marks: [],
          text: 'You pay a marketing company every month. You get a report every month. The report has grades and charts and your logo somewhere near the top. And if someone asked you what changed on your website this year, you would have to think about it.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'c2030513df79',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '279b0e35027e',
          marks: [],
          text: 'That gap is common, and it is not always because the company is lazy. A lot of local marketing packages are built on a reseller platform. The provider pays wholesale for listings sync, review monitoring, and a reporting dashboard, puts their name on it, and charges you retail. The software runs on its own. The person you signed with may only log in once a month to forward the report.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'c6b2a3dc24cc',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '5df803073e24',
          marks: [],
          text: 'That can be fine if that is what you knowingly bought. It is a problem when you think you are paying for a team.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'c6b31340a6bc',
      style: 'h2',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'ff523b0efa66',
          marks: [],
          text: 'What a resold package looks like',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'dda4996ead16',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'e5d1713611b5',
          marks: [],
          text: 'Most of these packages run on the same handful of white-label platforms. Vendasta is the biggest, and its products show up under hundreds of different company names. The tell is not the company name. It is the shape of what you receive.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '46e1988d1940',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'f4be6a4b349e',
          marks: [],
          text: 'The monthly report has the same four or five sections every time: Listings, Reputation, Social, Website, maybe Advertising. The layout never changes.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'cf7540a5b359',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '97959aed4871',
          marks: [],
          text: 'The grades move a little, but nothing in the report says what someone did to move them.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'b9d95f149a07',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '7e82ed40b671',
          marks: [],
          text: 'Your website looks the way it looked at launch. Same copy, same photos, same pages.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'c57f6da5a5ee',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'ed773da61251',
          marks: [],
          text: 'Blog posts, if you get them, could have been written for any business in your industry in any city.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '4eb7f8c83510',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '648810ba22f0',
          marks: [],
          text: 'You have never been asked a question about your business that would be needed to do real work. Which jobs are most profitable, which neighborhoods you want more of, what customers actually say on the phone.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '1d6eb5bb878e',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'e7b922878af2',
          marks: [],
          text: 'None of these alone proves anything. All of them together usually does.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '721a96b0e558',
      style: 'h2',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '1b2887bd42d2',
          marks: [],
          text: 'Three checks you can run this week',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'ae5b5a05c9e4',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'dc102255ff04',
          marks: [],
          text: 'You do not need to understand SEO to figure this out. You need an afternoon and three questions.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '8ff61cc1688c',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '6ac3c33033a7',
          marks: ['strong'],
          text: 'Ask for a list of changes made in the last 90 days.',
        },
        {
          _type: 'span',
          _key: '4beeb1f10f0e',
          marks: [],
          text: ' Not a report. A list. Pages added, copy rewritten, photos replaced, technical fixes, posts published, citations corrected by hand. A company doing the work can produce this in a day because they already track it. A company reselling a platform will send you the dashboard again.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'cbb96a4f82eb',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'c6b3cad4676f',
          marks: ['strong'],
          text: 'Check your own site.',
        },
        {
          _type: 'span',
          _key: '1edc6100ceec',
          marks: [],
          text: ' Open the pages a customer would land on and read them as a stranger. Then look at the footer, the service pages, and the blog. If the newest thing on the site is older than your retainer, the retainer is not touching the site.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'be4f38c96046',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '4a18bc59af6e',
          marks: ['strong'],
          text: 'Find out who owns your Google Business Profile.',
        },
        {
          _type: 'span',
          _key: '738ed1c351d2',
          marks: [],
          text: ' Sign in to Google with the account your business uses, open Business Profile, and look at the users. You should be the primary owner. Your marketing company can be a manager. If you cannot find the profile, or someone else is listed as owner, fix that before you do anything else. That profile is worth more than the website for most local businesses, and you want it in your name no matter who you work with next.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '62b52e68fe9f',
      style: 'h2',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '77fd1f6e3067',
          marks: [],
          text: 'What the report is not telling you',
        },
      ],
    },
    {
      _type: 'block',
      _key: '7c5da18b774f',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'd56e5e4f24e6',
          marks: [],
          text: 'The grades in a platform report come from automated scans. They are built as a sales tool, meant to show a prospect where they are weak so a provider can open a conversation. They are not a record of work performed, and they are not always accurate. Owners who know their business well sometimes find the scan missed a live Facebook page or counted backlinks that do not exist.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '1414d2171ab6',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'bad52b6280c7',
          marks: [],
          text: 'So read the report for what it is. It tells you roughly where you stand. It does not tell you what anyone did about it.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '5e4f5c71608f',
      style: 'h2',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '10d335b614c7',
          marks: [],
          text: 'What real work looks like',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'ae57b8a2cb1d',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'b324e33f6a2f',
          marks: [],
          text: 'A person who is doing the work for your business leaves evidence. You see it in the site, in the writing, and in the questions they ask.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'bfc1fffb5c3c',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'c2231ac8df9d',
          marks: [],
          text: 'The copy on your site sounds like you and names the places you serve.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '3f4b7d63cd62',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '67c9b5b676e6',
          marks: [],
          text: 'New pages appear when you add a service or want more of a certain kind of job.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '3183818a5789',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'b5184e9f00c5',
          marks: [],
          text: 'Blog posts answer questions your actual customers ask, in your words, about your area.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'd29e08de5385',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'e9e225db4d76',
          marks: [],
          text: 'You get a short note each month saying what was changed and why, in plain language.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'c871f5f43b76',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '762cbb7d6ebf',
          marks: [],
          text: 'When something breaks, someone you know by name fixes it and tells you.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'd10a2d9383e8',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'cf4ec6c307e1',
          marks: [],
          text: 'It costs more per hour than a resold subscription. It also tends to cost less over a year, because you stop paying for months where nothing happened.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'a8b9c1e8e2b7',
      style: 'h2',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'c7a0d5cf4139',
          marks: [],
          text: 'Before you cancel anything',
        },
      ],
    },
    {
      _type: 'block',
      _key: '45cdf2265c76',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '6608d09825dc',
          marks: [],
          text: 'If you decide to move on, do it in order. Get your Google Business Profile ownership sorted first. Ask for a copy of your business listing data, the name, address, phone, and hours as they were submitted to the directories. Confirm you control your domain registrar. Check your agreement for a notice period, because many of these platforms require 60 or 90 days and the provider will pass that on to you. Then give notice.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '72faa60fc21c',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'ffdcddf3b30a',
          marks: [],
          text: 'Listings that were synced through a platform do not disappear when the sync stops. They just stop being enforced, so over time they can drift back to old data. That is manageable. Losing your Google profile is not.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '0f7c2fb6eccf',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'fb099a66c368',
          marks: [],
          text: 'If you want a second opinion on what your current package is actually doing, book a strategy call and bring the last three reports. We will tell you what they say and what they leave out.',
        },
      ],
    },
  ],
} as const

main().catch((err: unknown) => {
  console.error('Failed to create post:')
  if (err instanceof Error) {
    console.error(err.message)
    if (err.stack) console.error(err.stack)
  } else {
    console.error(err)
  }
  process.exit(1)
})

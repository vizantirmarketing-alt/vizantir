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
  title: 'Will a Website Redesign Hurt My SEO?',
  slug: {
    _type: 'slug',
    current: 'will-website-redesign-hurt-seo',
  },
  publishedAt: '2026-10-29T12:00:00.000Z',
  category: 'SEO',
  excerpt:
    'It can, and often does. The drop is almost never caused by the new design. It comes from a handful of things that get skipped during the switch. Here is what they are and how to avoid them.',
  readTime: '6 min read',
  tags: ['SEO', 'Website Redesign', 'Migration', 'Redirects', 'Local Business'],
  author: {
    _type: 'reference',
    _ref: 'author-james-tram',
  },
  seo: {
    metaTitle: 'Will a Website Redesign Hurt My SEO?',
    metaDescription:
      'A redesign can drop your rankings, but the new look is rarely the cause. The traffic loss comes from skipped redirects, changed URLs, and lost pages. Here is how to keep what you have.',
    noIndex: false,
  },
  body: [
    {
      _type: 'block',
      _key: 'da5e40a481c7',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '65da515088f0',
          marks: [],
          text: 'Short answer: it can, and when it does, the new design is almost never the reason. Google does not punish you for a fresh look. It punishes you, in effect, for things that disappeared or moved during the switch and were never accounted for.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '730c8aad3eef',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '572c0d8eb099',
          marks: [],
          text: 'Most of the horror stories follow the same script. The new site launches. It looks great. Three weeks later the phone is quieter, and the Search Console graph shows a cliff. By the time anyone notices, the old site is gone and nobody kept a list of what was on it.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '45269ba5b1b1',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '98bf46904924',
          marks: [],
          text: 'Here is what actually causes that cliff, and what a careful rebuild does about each one.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '281c20246ba4',
      style: 'h2',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '6355233396d7',
          marks: [],
          text: 'URLs changed and nothing redirected',
        },
      ],
    },
    {
      _type: 'block',
      _key: '0b06e7ea0853',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'c58400f7aa37',
          marks: [],
          text: 'This is the big one, and it causes most of the damage on its own.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '4e6109f8088b',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'da4e10d75c7b',
          marks: [],
          text: 'Every page on your current site has an address. Google has been ranking some of those addresses for years. Other websites link to them. When a new site uses different addresses and the old ones simply stop working, Google treats every one of those pages as gone. The rankings do not transfer to the new page automatically. They evaporate.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '2abf81f1d7e8',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'd8b07a686824',
          marks: [],
          text: 'The fix is a redirect map: a list of every old URL and the new URL it should send people to, applied as permanent redirects before launch. If a page is being retired, it redirects to the closest relevant page, not the homepage. If a page is being merged into another, it redirects there. Nothing goes to a dead end.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '4c4f895000f7',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'acd4d3cfe1a0',
          marks: [],
          text: 'If the person rebuilding your site has not asked for, or produced, a list of your current URLs, this step is not happening.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '6d4c98ea7cb0',
      style: 'h2',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'df1ce7ce3d32',
          marks: [],
          text: 'Pages got dropped because they looked unimportant',
        },
      ],
    },
    {
      _type: 'block',
      _key: '342e04466b86',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'be46e046d30b',
          marks: [],
          text: 'Old sites accumulate pages. A blog post from 2019. A service you barely offer anymore. A page for a neighborhood you rarely work in. During a redesign it is tempting to cut all of that and launch something clean.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'f886a78c2729',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'd48f607c8226',
          marks: [],
          text: 'Some of those pages are earning. Not a lot each, but together they can be a meaningful slice of traffic, and a few of them might be the only pages ranking for a query your customers actually use. Cutting them without checking is throwing away rankings you already paid for.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '39f70313bbce',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '090b49257c71',
          marks: [],
          text: 'Before anything gets cut, look at Search Console for the last twelve months and sort pages by clicks. Anything with real traffic either stays, gets rewritten in place, or gets merged into a page that redirects properly. The ones with nothing can go.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'fcfc427cfc44',
      style: 'h2',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'd8b5de984d59',
          marks: [],
          text: 'The content got shorter',
        },
      ],
    },
    {
      _type: 'block',
      _key: '2a5e79df4c2f',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '00afe50f7de1',
          marks: [],
          text: 'Designers like white space. Search engines like words. A redesign that turns a 600 word service page into a headline, three icons, and a button has removed most of what Google was using to understand that page.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'f15a65a41f01',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'c8d9bca67ac1',
          marks: [],
          text: 'You do not need walls of text. You need each service page to say, in plain language, what the service is, who it is for, where you offer it, and what people usually ask about it. If the new design cannot hold that, the design is wrong for the job.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '6e2c057009a0',
      style: 'h2',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'fe03412afd7e',
          marks: [],
          text: 'Titles and descriptions got reset',
        },
      ],
    },
    {
      _type: 'block',
      _key: '65ab473811b1',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'e2b6db78e837',
          marks: [],
          text: 'Every page has a title tag and a meta description that show up in search results. On a working site, these have usually been tuned over time, deliberately or by accident, to match what people search. A rebuild that generates fresh ones from scratch, or leaves them as "Home | Your Company," throws that away.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'd94f3805b0a6',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '9b8c85ec61e2',
          marks: [],
          text: 'Carry the existing titles over where they are working. Improve the ones that are not. Do not let the new platform auto-generate them and call it done.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '9ab06cf30b72',
      style: 'h2',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '84a24289fbdd',
          marks: [],
          text: 'The new site is slower or broken on phones',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'cf94e1d665ef',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'efcdea537038',
          marks: [],
          text: 'This one is not about losing what you had. It is about the new site introducing a problem the old one did not have. Heavy page builders, uncompressed hero images, five fonts, and a chat widget can make a brand new site slower than the ten year old one it replaced. Google measures this from real visitors, and most of your visitors are on phones.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'f6e8c6c38b6f',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'a4d1c9530ded',
          marks: [],
          text: 'Test the new site on a phone over cellular before launch, not on a laptop in the office.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'e48970ed8a4c',
      style: 'h2',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '8b928a5abf35',
          marks: [],
          text: 'Google was never told',
        },
      ],
    },
    {
      _type: 'block',
      _key: '3a7ca0740d1e',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '74cbae860250',
          marks: [],
          text: 'A small thing that gets missed. After launch, Search Console still has the old sitemap. The new one needs to be submitted, the old one removed, and the key pages requested for recrawl. If the domain or the www prefix changed, that has to be declared too. Without this, Google finds the new site eventually, but eventually can be weeks, and weeks is the gap where the phone goes quiet.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '3935002f0988',
      style: 'h2',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '7841a0298f5f',
          marks: [],
          text: 'What a redesign done right looks like',
        },
      ],
    },
    {
      _type: 'block',
      _key: '733e6ce17060',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '225aa9f9eed0',
          marks: [],
          text: 'A full list of current URLs with their traffic, before any design work starts.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'e1180ca9f125',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'acc42030204a',
          marks: [],
          text: 'A redirect map for every URL that changes or goes away, live at launch.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'f74aab67a9ff',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '221407e71396',
          marks: [],
          text: 'Earning pages kept, rewritten, or merged. Never silently dropped.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '1bd393fc0288',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '7ed84451a369',
          marks: [],
          text: 'Titles and descriptions carried over or improved, not reset.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'e0c6aa104332',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '9ea52ee64a42',
          marks: [],
          text: 'Speed tested on a phone before launch.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '164e57d5e7f7',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '005247ed545d',
          marks: [],
          text: 'Sitemap submitted and recrawl requested the day the site goes live.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'c8b4a41ad0e8',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '759388cf069d',
          marks: [],
          text: 'Search Console watched daily for the first month, so a drop gets caught in days rather than discovered in a quarterly report.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '45408b3b75ce',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'fa89dba8e15a',
          marks: [],
          text: 'None of this is complicated. It is just work, and it is the work that gets skipped when a rebuild is quoted on design alone.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '4f21246a9b3a',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '8195670ad9a5',
          marks: [],
          text: 'If you are planning a redesign and want to know what is at risk on your current site, book a strategy call. The first thing we will do is look at what the site is earning today, so you know what you are protecting.',
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

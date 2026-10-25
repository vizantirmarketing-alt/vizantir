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
  title: 'What a Real Site Audit Looks Like Before a Rebuild',
  slug: {
    _type: 'slug',
    current: 'site-audit-before-rebuild',
  },
  publishedAt: '2026-10-30T12:00:00.000Z',
  category: 'Strategy',
  excerpt:
    'Nobody should rebuild your website without first finding out what the current one is doing for you. Here is what a proper audit covers, what it protects, and what it looks like when someone skips it.',
  readTime: '7 min read',
  tags: ['Site Audit', 'Website Redesign', 'SEO', 'Migration', 'Local Business'],
  author: {
    _type: 'reference',
    _ref: 'author-james-tram',
  },
  seo: {
    metaTitle: 'What a Site Audit Covers Before a Rebuild',
    metaDescription:
      'What a real website audit looks like before a rebuild: traffic, rankings, pages that earn, technical debt, and the migration plan that keeps you from losing what already works.',
    noIndex: false,
  },
  body: [
    {
      _type: 'block',
      _key: '96a7e1f224a4',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '84a0b83e3b57',
          marks: [],
          text: 'A rebuild quote that arrives before anyone has looked at your current site is a guess. It might be a good guess. But a new website replaces something that has been running for years, and some of what it has been doing is quietly working. Pages rank. Links point at specific URLs. Customers have bookmarks. Google has an opinion about what your site is and who it serves.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'a457dd677ff4',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '2e6d39a49041',
          marks: [],
          text: 'An audit is how you find out which parts of that you are about to break.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'c29fca2e8c13',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '5800f3852c7f',
          marks: [],
          text: 'This is what I do before I quote a rebuild, in roughly the order I do it. If someone is proposing to rebuild your site and none of this comes up, ask why.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '65164587329b',
      style: 'h2',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '3c9259473c3e',
          marks: [],
          text: 'Start with what the site is already earning',
        },
      ],
    },
    {
      _type: 'block',
      _key: '9fc8ade77802',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '895aa6b7bdcf',
          marks: [],
          text: 'Before looking at design or code, I look at what the site produces. That means Google Search Console, Google Analytics if it is installed, and the Google Business Profile insights. The questions are simple.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'b43f262c1e33',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '37b2a059d89d',
          marks: [],
          text: 'Which pages get clicks from search, and for what queries?',
        },
      ],
    },
    {
      _type: 'block',
      _key: '33dbe76d07d0',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '6e12462c7806',
          marks: [],
          text: 'Which pages get almost nothing?',
        },
      ],
    },
    {
      _type: 'block',
      _key: '36df3807c419',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '8d1846486c83',
          marks: [],
          text: 'Where does the phone number get tapped and the contact form get filled out?',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'da0972f7b1ef',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '152e48c1e1e8',
          marks: [],
          text: 'Which queries bring people to the homepage when a service page would serve them better?',
        },
      ],
    },
    {
      _type: 'block',
      _key: '17e03634aa13',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '8d566ddbde07',
          marks: [],
          text: 'Most small business sites have three to eight pages that matter and a long tail that does not. Knowing which is which decides what gets rebuilt carefully, what gets merged, and what can be retired. It also catches surprises. I have seen a blog post from years ago that nobody remembered quietly pulling in a third of a site\'s traffic.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'e9a6d9816803',
      style: 'h2',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '53f38f4e8a6d',
          marks: [],
          text: 'Find the URLs that cannot change',
        },
      ],
    },
    {
      _type: 'block',
      _key: '048e22cb5806',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '299bfb73fdd0',
          marks: [],
          text: 'Every page that ranks or has links pointing at it has a URL that Google and other sites know. If the new site uses different URLs and nobody maps the old ones to the new ones, those rankings and links are gone. Not reduced. Gone.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'c0a708761b57',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '1f8a173a281b',
          marks: [],
          text: 'So the audit produces a list: every URL on the current site, what it earns, what links point at it, and what it will become on the new site. Pages that stay keep their URL or get a permanent redirect. Pages that merge redirect to the page that absorbs them. Pages that are retired redirect somewhere sensible. That list is the redirect plan, and it is the single most important document in a rebuild.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '9e207f150017',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'b3393f91891a',
          marks: [],
          text: 'Skipping it is the most common way a new site launches and traffic drops forty percent the following month.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '2b57de0f120b',
      style: 'h2',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '6d7471d42781',
          marks: [],
          text: 'Read the site the way Google reads it',
        },
      ],
    },
    {
      _type: 'block',
      _key: '5af603cad2fb',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '023706e77924',
          marks: [],
          text: 'The next pass is technical. I crawl the site the way a search engine would and look at what comes back.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '2f07e7c7444b',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'c3a7939ca7f5',
          marks: [],
          text: 'Titles and meta descriptions: which ones are missing, duplicated, or describing the wrong thing.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'e08a5c6452bc',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '7996a4ee587c',
          marks: [],
          text: 'Heading structure: whether each page says what it is about in a way a machine can read.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '09802e83492b',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'de8ee0df94c3',
          marks: [],
          text: 'Page speed on a phone, measured, not eyeballed. Core Web Vitals from real users if Search Console has the data.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'bc9336392340',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '3674fe194056',
          marks: [],
          text: 'Broken links, redirect chains, pages Google is indexing that should not exist.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '3e466d37b4db',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'd586fdfacc42',
          marks: [],
          text: 'Structured data: whether the business, services, and location are described in a way Google can use for rich results.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'dc7d15694496',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'bf8524aa044a',
          marks: [],
          text: 'Mobile layout problems: tap targets too close, text too small, content that overflows.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '8540fa819793',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '2573eb7b454d',
          marks: [],
          text: 'On a WordPress site this is also where the plugin inventory happens. Every active plugin gets a note: what it does, whether anything on the site actually needs it, and whether it gets replaced by something native in the rebuild. Most sites I audit are carrying ten to twenty plugins and using five.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'b461452db487',
      style: 'h2',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'c38d13152ba1',
          marks: [],
          text: 'Check who owns what',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'c936d7f57350',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '30af95ef1e62',
          marks: [],
          text: 'This one is short and often uncomfortable. Before a rebuild, I confirm who controls the domain registrar, the DNS, the hosting account, the Google Business Profile, Search Console, Analytics, and any ad accounts. The answer should be you, the business owner, with other people added as managers.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'a7e2ed9db89f',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'aab132e2fd09',
          marks: [],
          text: 'Often it is not. The domain is in a former web designer\'s account. Search Console was set up by a marketing company that no longer answers. The Google profile has an owner nobody recognizes. None of this stops a rebuild, but all of it has to be sorted before launch, and some of it takes weeks. Finding out at launch is how a site goes dark.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '8efbc3a66b15',
      style: 'h2',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'a9529f516a7b',
          marks: [],
          text: 'Look at the content as a customer',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'ae319b1762b7',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '9014230ef54e',
          marks: [],
          text: 'Last, I read every page as someone who has never heard of the business. Not for typos. For whether a stranger could figure out what you do, where you do it, what it costs roughly, and how to get in touch, within a few seconds of landing.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'dbc64da1b93b',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'd4b2a9242f6f',
          marks: [],
          text: 'Does the homepage say what you do and where, or does it open with a slogan?',
        },
      ],
    },
    {
      _type: 'block',
      _key: '8dbcba475ed0',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '17f447a49e0d',
          marks: [],
          text: 'Does each service have its own page, or are six services crammed into one?',
        },
      ],
    },
    {
      _type: 'block',
      _key: '666f69926365',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '5e2a148e27ca',
          marks: [],
          text: 'Are the places you serve named, or does the site say "the greater area"?',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'bd3d0339d563',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'c348bcb35fed',
          marks: [],
          text: 'Is there anything a customer would need to know before calling that the site does not say?',
        },
      ],
    },
    {
      _type: 'block',
      _key: '373e592d6e34',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '57cd66b4eec3',
          marks: [],
          text: 'Does the writing sound like you, or like a template?',
        },
      ],
    },
    {
      _type: 'block',
      _key: '527538071cf6',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'beab1dfdd0dd',
          marks: [],
          text: 'This is also where the audit finds the things the current site is doing right. A good "about" page, real photos, a review section that customers mention. Those get carried forward, not replaced because they are old.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'e79dab92519f',
      style: 'h2',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '67d8e444e5d4',
          marks: [],
          text: 'What you should get back',
        },
      ],
    },
    {
      _type: 'block',
      _key: '0f25f548839b',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'af06807b03d2',
          marks: [],
          text: 'An audit should end with a document you can read. Mine is usually four or five pages: what the site earns today, the URL and redirect plan, the technical findings ranked by what actually matters, the access and ownership checklist, and a content plan for the new site built from what the old one taught us. The rebuild quote comes after that, because only then do I know what the job is.',
        },
      ],
    },
    {
      _type: 'block',
      _key: '58e1b94b65c8',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'b6444a4a8e04',
          marks: [],
          text: 'If you are getting quotes and none of them came with anything like this, you are not comparing rebuilds. You are comparing guesses. Book a strategy call and I will walk through what an audit of your site would cover.',
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

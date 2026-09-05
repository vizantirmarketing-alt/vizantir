export const NEXTJS_VS_WORDPRESS_PATH = '/nextjs-vs-wordpress'
export const NEXTJS_VS_WORDPRESS_DATE = '2026-09-05'

export const nextjsVsWordpressTitle = 'Next.js vs WordPress: Which Should You Use?'
export const nextjsVsWordpressDescription =
  'A comparison of Next.js and WordPress on performance, security, editing, hosting cost, developers, plugins, upgrades, and total cost of ownership.'

export const nextjsVsWordpressHero = {
  eyebrow: 'Comparison',
  heading: 'Should I Use Next.js or WordPress?',
  lastUpdatedIso: NEXTJS_VS_WORDPRESS_DATE,
  lastUpdatedLabel: 'September 5, 2026',
} as const

/** 67-word direct answer. Lead passage for snippet and AI extraction. */
export const nextjsVsWordpressDirectAnswer =
  'Next.js is the better default for an established business whose site is a revenue asset. A headless CMS ships with the build, so the team edits content without a developer. WordPress still fits tight budgets, existing WordPress teams, a large plugin catalog, and owners who will change structure from the admin. Choose Next.js when control of the frontend and the release path matters more than starting price.'

export const nextjsVsWordpressComparison = {
  eyebrow: 'At a glance',
  heading: 'Next.js vs WordPress, side by side',
  intro:
    'Same criteria for both. Read the row that matches what you actually care about, then the sections below if you want the reasoning.',
  optionA: 'Next.js',
  optionB: 'WordPress',
  rows: [
    {
      criterion: 'Performance',
      nextjs:
        'Server Components, route-level code splitting, static rendering, and caching control what reaches the browser. A poorly built Next.js site can still ship more JavaScript than a lean WordPress theme.',
      wordpress:
        'Performance depends on the theme, plugins, hosting, and caching. A serious managed WordPress deployment is cached.',
    },
    {
      criterion: 'Security surface',
      nextjs:
        'The public site and the CMS admin can live on separate origins. That is an architecture choice, not a Next.js default. No plugin marketplace on the live site.',
      wordpress:
        'Core is actively patched. Risk grows with each plugin, theme, leftover admin account, and delayed update.',
    },
    {
      criterion: 'Content editing',
      nextjs:
        'A headless CMS ships with the build. Editors update copy, images, prices, and posts without a developer. New templates and new functionality are development work.',
      wordpress:
        'Editors have the same day-to-day control. The admin also lets an owner change structure and add functionality without a development workflow.',
    },
    {
      criterion: 'Hosting cost',
      nextjs:
        'Hosting is rarely the deciding cost on a commercial build. Build quality, maintenance, and future development matter more.',
      wordpress:
        'Same rule. A managed WordPress host is easy to quote, but it is not what decides the three-year bill.',
    },
    {
      criterion: 'Developer availability',
      nextjs:
        'A smaller specialist pool than WordPress. The React ecosystem is large and still growing.',
      wordpress:
        'A much larger ecosystem. Easier to find someone who already works in it, especially for ongoing maintenance.',
    },
    {
      criterion: 'Plugin dependency',
      nextjs:
        'You add packages and custom code. There is no equivalent to the WordPress plugin directory on the live site.',
      wordpress:
        'Tens of thousands of plugins. Features land fast. Update risk and conflicts scale with how many you install.',
    },
    {
      criterion: 'Upgrade path',
      nextjs:
        'Framework upgrades are controlled engineering work. Content stays in the CMS. The site ships when the build is ready.',
      wordpress:
        'Core, plugin, and theme updates can run automatically. A bad update can still take the front end down until someone fixes it.',
    },
    {
      criterion: 'Total cost of ownership',
      nextjs:
        'Higher build cost. The case is control, performance, custom functionality, and how changes reach production, not a lower three-year bill.',
      wordpress:
        'Usually cheaper to launch. Ongoing cost is hosting, licenses, updates, and cleanup after conflicts or compromised plugins.',
    },
  ],
} as const

export const nextjsVsWordpressNextBetter = {
  eyebrow: 'When Next.js wins',
  heading: 'Next.js is the better choice when',
  intro:
    'Next.js wins when the frontend is designed around the business, content stays editable in a CMS, and structural changes stay in an engineering workflow.',
  items: [
    {
      title: 'Control over performance as the site grows',
      body: 'The useful question is what happens over eighteen months, not the first speed score. Marketing will add landing pages, tracking, integrations, and new content types. Next.js gives a team Server Components, route-level code splitting, static rendering, and caching so those additions stay on a designed path. A poorly built Next.js site can still get heavy. The point is control, not a guaranteed win on day one.',
    },
    {
      title: 'You want a smaller security surface',
      body: 'The live site does not have to share an origin with the CMS admin. That is an architecture choice. A headless studio can sit elsewhere, or it can be embedded. There is no plugin marketplace executing on production. Updates are dependency bumps in a repo. The owner who wants a short package list and a public origin that is only the site will prefer that setup.',
    },
    {
      title: 'The site is closer to an app than a brochure',
      body: 'A parts catalog with filters, a client portal that shows job status, or a pricing tool that reads from your own database is ordinary Next.js work. WordPress can reach the same place with membership plugins or custom PHP, then you own the conflicts as those pieces stack. One codebase is easier to extend when the workflow changes.',
    },
    {
      title: 'Content in the CMS, structure through a release',
      body: 'Content belongs to the client team in the CMS. Application changes go through version control and deployment. Editors publish copy, images, and posts without a deploy. New templates and new functionality wait for a reviewed build. That is an operating model, not a liability. It fits a team that already has a developer, or plans to keep a studio on a retainer.',
    },
  ],
} as const

export const nextjsVsWordpressWordpressBetter = {
  eyebrow: 'When WordPress wins',
  heading: 'When WordPress still makes sense',
  intro:
    'WordPress is the right stack in several common situations. The advantages below are real. Keep the ones that match how the site will actually be run.',
  items: [
    {
      title: 'The budget is tight',
      body: 'A competent WordPress build costs less to start than a custom Next.js site. If the site needs to exist this quarter and the budget is a few thousand dollars, WordPress is the practical pick.',
    },
    {
      title: 'Your team already knows it',
      body: 'Retraining a staff that already publishes in WordPress has a real cost. If they are productive in it today, switching stacks to chase performance is often the wrong trade.',
    },
    {
      title: 'You need a large plugin catalog',
      body: 'Memberships, directories, LMS, booking, multilingual, and dozens of other features have mature WordPress plugins. Rebuilding those in Next.js means custom software, not a settings screen.',
    },
    {
      title: 'A non-technical owner will self-manage for years',
      body: 'If nobody on the team will retain a developer, WordPress is the safer long-term home. The owner can publish, change structure, install a plugin, and add a form without a deploy pipeline.',
    },
  ],
} as const

export const nextjsVsWordpressCriteria = {
  eyebrow: 'The criteria',
  heading: 'How Next.js and WordPress compare on each point',
  intro:
    'The table is the short version. These are the same eight criteria, written out so you can quote a single section.',
  sections: [
    {
      id: 'performance',
      heading: 'Which is faster, Next.js or WordPress?',
      lead: 'Next.js does not guarantee a faster page. It gives a team Server Components, route-level code splitting, static rendering, and caching so they can control what reaches the browser as the site grows. WordPress performance depends on the theme, plugins, hosting, and caching.',
      body: 'The useful comparison is eighteen months out, when marketing has added landing pages, tracking, integrations, and new content types. Next.js lets those additions stay on a designed path: render on the server, split the route, cache the result. A poorly built Next.js site can still ship more JavaScript than a lean WordPress theme. Images, fonts, third-party scripts, and hosting decide Core Web Vitals on both stacks. A well-kept WordPress site on managed hosting, with a light theme and a real cache, can be fast. It depends on that combination staying intact.',
    },
    {
      id: 'security',
      heading: 'Which is more secure, Next.js or WordPress?',
      lead: 'Where the CMS admin lives is an architecture choice, not a Next.js property. A headless studio can sit on another origin, or it can be embedded. WordPress typically puts the admin on the same site. The extension ecosystem accounts for the large majority of disclosed WordPress vulnerabilities. Neither stack is safe if nobody maintains it.',
      body: 'WordPress is a frequent target because it is widely deployed, and because plugins, themes, and leftover accounts expand what faces the internet. Next.js still has npm dependencies and server routes that need updates. A typical marketing build has fewer third-party executables on the public origin, and there is no plugin marketplace running on production. That is a smaller public surface when the team designs it that way, not because the framework hides the admin.',
    },
    {
      id: 'content-editing',
      heading: 'Which is easier to edit, Next.js or WordPress?',
      lead: 'Both stacks give a content team editorial control. A Next.js build ships with a headless CMS, so editors change copy, images, prices, and posts without a developer. WordPress also does that, and it additionally lets an owner change structure and add functionality from the admin without a development workflow. That extra reach is the actual WordPress advantage.',
      body: 'Day-to-day copy, photos, and prices feel close on both stacks. The gap shows up when someone wants a new page template, a new content type, or a form they saw in a blog post. On WordPress that is often a marketplace install or a layout change in the admin. On Next.js it is a development ticket. If the owner will invent layouts and add features for years without calling anyone, WordPress is the simpler daily tool.',
    },
    {
      id: 'hosting-cost',
      heading: 'What does hosting cost for Next.js vs WordPress?',
      lead: 'Hosting is rarely the deciding cost on a commercial build. Build quality, maintenance, and future development matter more than the monthly host invoice.',
      body: 'A managed WordPress plan and a production Next.js host are both easy to quote once the site is a real business asset. Over a year, the hours spent on the build, the updates, and the next set of features usually dwarf the hosting line.',
    },
    {
      id: 'developer-availability',
      heading: 'Is it easier to find a WordPress developer or a Next.js developer?',
      lead: 'The WordPress ecosystem is much larger. It is easier to find someone who already works in it. Next.js specialists are fewer. That matters if you need a local freelancer next month. It matters less if one studio already owns the codebase.',
      body: 'A large ecosystem means you can replace a freelancer. It also means quality varies widely. With Next.js you will interview fewer people. Treat that as a search problem, not a statement about what anyone charges.',
    },
    {
      id: 'plugin-dependency',
      heading: 'How do plugins change the Next.js vs WordPress decision?',
      lead: 'If the feature list is a row of plugin logos, WordPress matches it. Memberships, directories, LMS, booking, and multilingual tools exist as settings screens. Next.js has npm packages, which are developer tools, not site-owner installs. If the feature list is custom, the catalog is not an advantage.',
      body: 'Every plugin is code you did not write and do not control. That is fine when the plugin is maintained and you update it. It is expensive when two plugins conflict, a license lapses, or an abandoned extension becomes the way in. Next.js shifts that risk to the packages a developer chose. There is no owner-facing catalog on the live site.',
    },
    {
      id: 'upgrade-path',
      heading: 'What does the upgrade path look like?',
      lead: 'WordPress supports automatic core, plugin, and theme updates. Next.js upgrades are controlled engineering work: bump the framework, fix what the build breaks, then deploy. WordPress updates are easier for an owner to start. Next.js upgrades happen when a developer opens the work.',
      body: 'A WordPress site that skips updates becomes a security project. Automatic updates reduce that neglect, and they can still break a theme or a plugin combination until someone fixes it. A Next.js site that never upgrades becomes painful when a dependency finally forces the issue. Plan for maintenance in both cases. The difference is who does the work and when it reaches production: a site owner accepting an update, or a developer shipping a reviewed build.',
    },
    {
      id: 'total-cost',
      heading: 'What is the total cost of ownership?',
      lead: 'WordPress usually wins on initial price. The case for Next.js is not a cheaper three-year bill. It is control over the frontend, performance as the site grows, custom functionality, and how changes reach production.',
      body: 'The first invoice is the build. After that, someone hosts the site, keeps it updated, and makes changes when the business asks. If the deciding factor is the lowest three-year cost, a custom Next.js build may not be the right purchase. Buy Next.js when those controls are worth more than the cheaper start.',
    },
  ],
} as const

export const nextjsVsWordpressFaqs = [
  {
    question: 'Should I use Next.js or WordPress?',
    answer:
      'Next.js is the better default for an established business whose site is a revenue asset. A headless CMS ships with the build, so the team edits content without a developer. Use WordPress if the budget is tight, the team already knows it, you need a large plugin catalog, or an owner will change structure from the admin for years. Choose Next.js when control of the frontend and the release path matters more than starting price.',
  },
  {
    question: 'Is WordPress cheaper than Next.js?',
    answer:
      'The case for Next.js is control over the frontend, performance as the site grows, custom functionality, and how changes reach production. That is not a cheaper three-year bill. WordPress usually costs less to launch. If the lowest three-year cost decides it, a custom Next.js build may not be the right purchase.',
  },
  {
    question: 'Can a non-technical person manage a Next.js website?',
    answer:
      'A Next.js build ships with a headless CMS, so a non-technical person can change copy, images, prices, and posts without a developer. New templates, new forms, and new integrations still need a developer. WordPress gives the same editorial control, and it also lets an owner change structure or install a plugin from the admin. Day-to-day publishing on Next.js stays in the CMS and does not require a developer.',
  },
  {
    question: 'Is WordPress insecure?',
    answer:
      'A Next.js marketing site has no public admin and no production plugin installs. Changes go through version control. WordPress core is maintained and patched in public. The extension ecosystem accounts for the large majority of disclosed WordPress vulnerabilities. A Next.js site still has dependencies that require maintenance.',
  },
  {
    question: 'Can I migrate from WordPress to Next.js without losing SEO?',
    answer:
      'A WordPress site can move to Next.js without losing SEO if URLs are treated as the product. Map every indexed path, keep the same slugs where you can, and set permanent redirects for the rest. Move the content, titles, and metadata. Submit the new sitemap after launch. Rankings dip when those steps get skipped, not because the new stack is Next.js.',
  },
  {
    question: 'Do I need a developer to use WordPress?',
    answer:
      'Next.js needs a developer for new templates and new functionality. Day-to-day content lives in a headless CMS, so editors publish without a deploy. WordPress can be launched and published without a developer. An owner can also change structure or install a plugin from the admin. A developer still helps on WordPress for custom design, performance work, or when plugins conflict.',
  },
] as const

export const nextjsVsWordpressCta = {
  heading: 'If Next.js is the right call, we can talk.',
  body: 'Vizantir builds custom Next.js sites. If WordPress is the better fit for your team, we will say so. Strategy calls are 30 minutes. No pitch deck.',
  buttonLabel: 'Book a Strategy Call',
  href: '/contact',
} as const

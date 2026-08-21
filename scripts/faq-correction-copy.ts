/**
 * Canonical copy for FAQ corrections.
 * Prices and tier names come from carePricing — do not hand-author them here.
 */

import { carePricing } from '../data/pricing'

const [essentialCare, websiteCare, growthCare] = carePricing

export function afterLaunchFaqAnswer(): string {
  return `Launch support is included. After launch, Website Care is optional ongoing improvement — content, conversion, search, and related work. Plans are ${essentialCare.name} at ${essentialCare.price}, ${websiteCare.name} at ${websiteCare.price}, and ${growthCare.name} at ${growthCare.price}. Current details are on the Services page.`
}

export const WORDPRESS_FAQ_ANSWER =
  'Vizantir builds in Next.js, with Sanity CMS for content. We do not build WordPress sites. Clients currently on WordPress are migrated onto that stack rather than maintained on WordPress. Next.js is the foundation every Vizantir site runs on because it is fast on every device, free of plugin risk, and does not depend on WordPress core updates to stay secure.'

export const COMPETITOR_RESEARCH_FAQ_ANSWER =
  'Yes. Before any design work starts we look at how businesses in your space position themselves online — what works, where the gaps are, and how that market shows up. That research shapes strategy and structure. You should not be guessing what the site needs to do differently. We find it.'

export const REDESIGN_FAQ_ANSWER =
  'Yes. Vizantir rebuilds existing websites on its own stack. We audit what is there and keep what works — structure, content, and brand — then rebuild on Next.js rather than editing the existing platform. We do not modify existing WordPress installs in place.'

export const EXISTING_SITE_FAQ_ANSWER = REDESIGN_FAQ_ANSWER

export const PHILOSOPHY_FAQ_ANSWER =
  'Design without strategy is decoration. Every decision we make — layout, copy, structure, speed — is tied to a business outcome. We build the pages and the conversion tracking behind them, then measure what actually moves your business forward.'

export const WORDPRESS_REFRESH_FAQ_ANSWER =
  'Yes. Vizantir rebuilds a WordPress site on Next.js and Sanity, migrating content and keeping what works, rather than modifying the WordPress install.'

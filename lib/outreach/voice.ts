/**
 * Voice rules for outreach drafts, checked in code after every reply. Pure.
 *
 * The same rules are stated in the prompt (lib/outreach/prompt.ts). The
 * prompt asks; this file decides. A reply with any violation is retried once
 * with the violations listed, then refused.
 *
 * Some rules cannot be proved by a pattern (an invented compliment, for
 * example). Those are covered as far as a pattern can reach: every number
 * must come from the context, and claims of prior contact, urgency and false
 * familiarity are matched by phrase.
 */

import { WEBSITE_CHECK_WORDS, type OutreachContext } from '@/lib/outreach/context'
import { STUDIO_DESCRIPTION, STUDIO_SITE_HOST } from '@/lib/outreach/params'

export const BODY_MIN_WORDS = 60
export const BODY_MAX_WORDS = 110
/** The subject must be under this many characters. */
export const SUBJECT_MAX_CHARS = 60

/** Exactly the phrases the owner banned, each matched with its plain inflections. */
export const BANNED_PHRASES: readonly { phrase: string; pattern: RegExp }[] = [
  { phrase: "it's worth noting", pattern: /\b(?:it's|it is) worth noting\b/i },
  { phrase: 'dive into', pattern: /\b(?:dive|dives|diving|dove) into\b/i },
  { phrase: 'seamless', pattern: /\bseamless(?:ly)?\b/i },
  { phrase: 'robust', pattern: /\brobust\b/i },
  { phrase: 'elevate', pattern: /\belevat(?:e|es|ed|ing)\b/i },
  { phrase: 'empower', pattern: /\bempower\w*\b/i },
  { phrase: 'unlock', pattern: /\bunlock\w*\b/i },
  { phrase: 'cutting-edge', pattern: /\bcutting[\s-]?edge\b/i },
  { phrase: "in today's fast-paced world", pattern: /\bin today's fast[\s-]?paced world\b/i },
  { phrase: 'I hope this email finds you well', pattern: /\bI hope this (?:e-?mail|message|note) finds you well\b/i },
  { phrase: 'not just', pattern: /\bnot just\b/i },
]

export type VoiceRule =
  | 'subject_length'
  | 'subject_single_line'
  | 'exclamation'
  | 'word_count'
  | 'plain_text'
  | 'first_person'
  | 'studio_name'
  | 'agency'
  | 'links'
  | 'pricing'
  | 'attachments'
  | 'ai_or_tools'
  | 'dashes'
  | 'banned_phrase'
  | 'three_item_list'
  | 'urgency'
  | 'false_familiarity'
  | 'prior_contact'
  | 'invented_number'
  | 'website_claim'
  | 'signature'
  | 'studio_description'
  | 'greeting'
  | 'contractions'
  | 'subject_wording'
  | 'one_finding'
  | 'page_name'
  | 'studio_wording'
  | 'reply_format'

export type VoiceViolation = { rule: VoiceRule; message: string }

/**
 * Checks decided by a pattern that can match acceptable text: word overlap,
 * page naming, sentence classification, and phrase lists whose words have
 * innocent uses ("quote", "attached", "right away"). They never refuse a
 * draft. They are shown to the owner on the draft page as plain sentences
 * (voiceWarnings), computed at view time. Every other rule is decided with
 * certainty and refuses the reply, which is retried once.
 */
export const WARNING_RULES: ReadonlySet<VoiceRule> = new Set<VoiceRule>([
  'one_finding',
  'page_name',
  'studio_wording',
  'three_item_list',
  'urgency',
  'false_familiarity',
  'prior_contact',
  'pricing',
  'attachments',
])

export type HardRule = Exclude<VoiceRule, 'one_finding' | 'page_name' | 'studio_wording' | 'three_item_list' | 'urgency' | 'false_familiarity' | 'prior_contact' | 'pricing' | 'attachments'>

/** What the owner reads when a draft is refused: plain words, never rule keys. */
export const REFUSAL_REASONS: Record<HardRule, string> = {
  subject_length: 'The subject was empty or too long.',
  subject_single_line: 'The subject ran over more than one line.',
  exclamation: 'It used an exclamation mark.',
  word_count: 'The email was too short or too long.',
  plain_text: 'It used formatting such as bullets or bold text.',
  first_person: 'It did not write as one person (I, me, my).',
  studio_name: 'It called the studio something other than its full name.',
  agency: 'It called the studio an agency.',
  links: "It included a link or email address other than the studio's site.",
  ai_or_tools: 'It mentioned AI, automation or tools.',
  dashes: 'It used a dash.',
  banned_phrase: 'It used a banned phrase.',
  invented_number: "It used a number that is not in the lead's findings.",
  website_claim: 'It did not say carefully that no website could be found.',
  signature: 'It added a sign-off, signature line or footer text.',
  studio_description: 'It did not introduce the studio with the exact description.',
  greeting: "The opening line was not 'Hello,'.",
  contractions: "It read stiffly: no contractions, or 'I would be glad' and the like.",
  subject_wording: 'The subject used a banned word or the studio name.',
  reply_format: 'The reply was not in the expected form.',
}

/** The refused rules in plain words, each once, in check order. */
export function refusalReasons(violations: readonly VoiceViolation[]): string[] {
  const out: string[] = []
  for (const { rule } of violations) {
    if (WARNING_RULES.has(rule)) continue
    const reason = REFUSAL_REASONS[rule as HardRule]
    if (!out.includes(reason)) out.push(reason)
  }
  return out
}

export type VoiceContext = {
  /** The studio's name from settings, e.g. "Vizantir Design Studio". */
  studioName: string
  /** Every string the model was given; numbers in the draft must appear in it. */
  contextText: string
  /** True when the lead is a business whose website check found no website. */
  noWebsiteFound: boolean
  /** The findings the model was given (prospect claims and the mobile line); empty for a business. */
  findings: readonly string[]
  /** Names the email may repeat freely (company, domain, market, industry); not evidence of using a finding. */
  knownNames: string
}

/** The voice context for a draft, from exactly what the model was given. */
export function voiceContextFor(context: OutreachContext, studioName: string): VoiceContext {
  const findings =
    context.leadType === 'prospect'
      ? [...context.findings.map((f) => f.claim), ...(context.mobilePerformance === null ? [] : [context.mobilePerformance])]
      : []
  const knownNames =
    context.leadType === 'prospect'
      ? [context.company, context.domain, context.market ?? '', context.industry ?? ''].join(' ')
      : [context.business, context.businessType, context.city ?? ''].join(' ')
  return {
    studioName,
    // The same string outreachUserMessage() sends.
    contextText: JSON.stringify(context),
    noWebsiteFound: context.leadType === 'new_business' && context.websiteCheck === WEBSITE_CHECK_WORDS.no_website,
    findings,
    knownNames,
  }
}

export function bodyWordCount(body: string): number {
  const trimmed = body.trim()
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length
}

/** Curly apostrophes and quotes read as straight ones for every check. */
function plain(text: string): string {
  return text.replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"')
}

const DASH_CHARS = /[‒–—―−﹘﹣－]/
const SPACED_HYPHEN = /(?:^|\s)-{1,2}(?:\s|$)|--/m

const MARKDOWN = /(?:^|\s)(?:\*\*?|__?)\S|^\s{0,3}#{1,6}\s|^\s*[*•+]\s|`|\[[^\]]*\]\([^)]*\)|<\/?[a-z][^>]*>/im

const FIRST_PERSON_SINGULAR = /\bI\b|\bI'm\b|\bI've\b|\bI'd\b|\bmy\b|\bme\b/
const FIRST_PERSON_PLURAL = /\b(?:we|our|ours|ourselves|we're|we've|we'll|we'd)\b/i
const LOWER_US = /\bus\b/

const AGENCY = /\bagenc(?:y|ies)\b/i

const URLISH =
  /\bhttps?:\/\/[^\s<>"')]+|\bwww\.[^\s<>"')]+|\b[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9-]+)*\.(?:com|net|org|io|co|us|biz|info|law|dev|app|site|online|store|shop|me|ly|ai|nv)\b(?:\/[^\s<>"')]*)?/gi
const EMAILISH = /[^\s@]+@[^\s@]+\.[^\s@]+/

const PRICING =
  /\$\s?\d|\bpric(?:e|es|ed|ing)\b|\bpackages?\b|\bquotes?\b|\bdiscount\w*\b|\bfees?\b|\bper month\b|\bmonthly (?:plan|rate)\b|\bfree (?:consultation|audit|quote|mock-?up|trial|review)\b|\bbudget\b|\binvoice\b/i
const ATTACHMENTS = /\battach(?:ed|ment|ments|ing)?\b|\benclosed\b/i

const AI_CASED = /\bAI\b|\bA\.I\.|\bGPT\b|\bLLMs?\b/
const AI_WORDS =
  /\b(?:artificial intelligence|automat\w*|tools?|software|scrap(?:e|ed|er|ers|ing)|bots?|algorithms?|machine learning|language models?|chatgpt|claude|(?:auto-?)?generated|crawl\w*|data providers?|spreadsheet|database)\b/i

const URGENCY =
  /\b(?:urgent\w*|asap|as soon as possible|limited time|act now|hurry|last chance|don't miss|do not miss|spots? (?:left|remaining)|slots? (?:left|remaining)|only a few (?:spots|slots|openings)|this week only|expir(?:e|es|ing)|deadline|before it's too late|right away|immediately|filling up|book now|time-sensitive|time sensitive)\b/i
const FALSE_FAMILIARITY =
  /\b(?:hey there|buddy|my friend|old friend|as you know|I know how busy you are|hope you're (?:well|doing well)|hope you are (?:well|doing well)|hope all is well|hope your week)\b/i
const PRIOR_CONTACT =
  /\b(?:following up|follow(?:ing)? up on|as promised|as discussed|we spoke|we met|when we (?:talked|spoke|met)|great (?:talking|chatting|meeting)|nice (?:talking|chatting|meeting)|mutual|referred (?:me|by)|recommended (?:you|me)|reconnect\w*|circling back|touching base|thanks again|reach(?:ing)? out again|in touch again|last time)\b/i

// Three short items in one series: "fast, clear, and easy" or "calls, forms or bookings".
// A clause that merely follows a comma ("..., with no form or booking") is
// not an item, so the middle and last items may not open with a function word.
const ITEM = "[A-Za-z']+(?: [A-Za-z']+){0,2}"
const THREE_ITEM_LIST = new RegExp(`\\b(${ITEM}), (${ITEM}),? (?:and|or) ([A-Za-z']+)`, 'g')
const FUNCTION_WORDS = new Set(
  'a an the i you we he she it they this that these those which who whom whose when where while with without for to from in on at by of as because so but if then than though although since until after before about into over under like just or and nor not no'.split(' '),
)

function hasThreeItemList(sentence: string): boolean {
  for (const match of sentence.matchAll(THREE_ITEM_LIST)) {
    const second = match[2]!.split(' ')[0]!.toLowerCase()
    const third = match[3]!.toLowerCase()
    if (!FUNCTION_WORDS.has(second) && !FUNCTION_WORDS.has(third)) return true
  }
  return false
}

const NO_WEBSITE_HEDGE =
  /\b(?:could not|couldn't|could not yet|was not able to|wasn't able to|was unable to) (?:find|locate|see) (?:a|any|your|an?\s\w+) ?(?:website|web site|site)\b/i
const NO_WEBSITE_FACT =
  /\b(?:do not|don't|does not|doesn't|did not|didn't) (?:have|own|run) (?:a|any) (?:website|web site|site|web presence)\b|\bno (?:website|web site|web presence)\b|\bwithout (?:a|any) (?:website|web site|site|web presence)\b|\black(?:s|ing)? (?:a |any )?(?:website|web site|site|web presence)\b|\bhas(?:n't| not) got (?:a|any) (?:website|site)\b/i

// A short closing line such as "Best," or "Thanks, James"; a full sentence is not a sign-off.
const SIGN_OFF = /^(?:best|thanks|thank you|cheers|regards|kind regards|warm regards|warmly|sincerely|all the best|talk soon)\b[^.?]{0,20}$/i
const FOOTER_WORDS = /\bunsubscrib\w*|\bopt(?:-| )?out\b|\bnot hear from me\b|\bwon't write again\b/i

// The studio is described only by STUDIO_DESCRIPTION. Size and location
// wording is refused in any sentence about the studio or the sender's work;
// the words that only ever describe the sender are refused anywhere.
const STUDIO_WORDING_ANYWHERE = /\b(?:boutique|in the area|nearby|around here|down the road|in your area|near you)\b/i
const STUDIO_WORDING_NEAR =
  /\b(?:small|smaller|tiny|little studio|local|locally|independent|solo|one-person|one person|freelance\w*|family-run|husband|boutique|based in|[a-z]+-based|here in|neighbou?rhood|growing|full-service|full service)\b/i
const ABOUT_THE_STUDIO = /\bstudio\b|\bI (?:run|build|design|make|work|help|started|founded|own)\b/i

const GREETING_LINE = 'Hello,'
// Any other greeting, anywhere: a line opening with one, or the phrases themselves.
const OTHER_GREETING = /^\s*(?:hi|hey|dear|greetings|good (?:morning|afternoon|evening))\b|\bhi there\b|\bto whom it may concern\b/im

const CONTRACTION =
  /\b(?:I'd|I'm|I've|I'll|you've|you're|you'd|you'll|it's|that's|there's|here's|what's|who's|let's|they're|they've|don't|doesn't|didn't|couldn't|wouldn't|shouldn't|can't|isn't|wasn't|aren't|weren't|won't|haven't|hasn't|hadn't)\b/i
const UNCONTRACTED = /\bI would (?:be (?:glad|happy|delighted|pleased)|love)\b/i

const SUBJECT_BANNED =
  /\b(?:observations?|quick question|opportunit(?:y|ies)|proposals?|partnerships?|introductions?|introducing|intro|touching base|touch base)\b/i

// Words too common to show which finding an email draws on.
const COMMON_WORDS = new Set(
  'about also been being could does each find found from have here into just like made make makes more most only other over page pages same says shows site some such than that their them then there these they this those very visitors visitor website websites what when which while will with would your'.split(
    ' ',
  ),
)

function terms(text: string): Set<string> {
  const out = new Set<string>()
  for (const raw of plain(text).toLowerCase().match(/[a-z][a-z']{3,}/g) ?? []) {
    let word = raw.replace(/'s$/, '').replace(/'/g, '')
    if (word.length > 4 && word.endsWith('s') && !word.endsWith('ss')) word = word.slice(0, -1)
    if (word.length >= 4 && !COMMON_WORDS.has(word)) out.add(word)
  }
  return out
}

/**
 * Which findings a body draws on. A finding counts as used when the body
 * repeats one of its numbers, or three of the words only that finding has
 * (names of the business, market and studio excluded). A heuristic: it
 * catches two findings joined into one claim, not every paraphrase.
 */
export function findingsUsed(body: string, findings: readonly string[], knownNames: string): number[] {
  const bodyTerms = terms(body)
  const bodyNumbers = new Set(numberTokens(body))
  const excluded = terms(`${knownNames} ${STUDIO_DESCRIPTION}`)
  const sets = findings.map((finding) => terms(finding))
  const used: number[] = []
  sets.forEach((set, i) => {
    const unique = [...set].filter((term) => !excluded.has(term) && !sets.some((other, j) => j !== i && other.has(term)))
    const hits = unique.filter((term) => bodyTerms.has(term)).length
    const numbers = numberTokens(findings[i]!).some((token) => bodyNumbers.has(token))
    if (hits >= 3 || numbers) used.push(i)
  })
  return used
}

// "the contact page", "your practice area pages": the word before page(s) names it.
const PAGE_NAME = /\b([a-z]+) pages?\b/gi
const NOT_A_PAGE_NAME = new Set(
  'a an the your this that these those one each every any its their my web same single whole other first which what own new'.split(' '),
)

/** Page names in the body that no finding uses, e.g. "services page" when the finding says "contact page". */
export function unnamedPages(body: string, findings: readonly string[]): string[] {
  const source = plain(findings.join('\n')).toLowerCase()
  const out: string[] = []
  for (const match of plain(body).matchAll(PAGE_NAME)) {
    const word = match[1]!.toLowerCase()
    if (NOT_A_PAGE_NAME.has(word)) continue
    if (!new RegExp(`\\b${word} pages?\\b`).test(source)) out.push(`${word} page`)
  }
  return [...new Set(out)]
}

const STUDIO_SITE = new RegExp(`(?:https?://)?(?:www\\.)?${STUDIO_SITE_HOST.replace(/\./g, '\\.')}(?:/\\S*)?`, 'gi')
// A last line that is only the studio's site is a signature line.
const SITE_LINE = new RegExp(`^(?:https?://)?(?:www\\.)?${STUDIO_SITE_HOST.replace(/\./g, '\\.')}/?\\.?$`, 'i')
// The owner's list, refused in the sentence that names the studio.
const STUDIO_BANNED_WORDS = /\b(?:small|boutique|local|in the area|nearby)\b/i

function numberTokens(text: string): string[] {
  return (text.match(/\d+(?:[.,]\d+)*/g) ?? []).map((token) => token.replace(/,/g, ''))
}

function hostOf(match: string): string {
  return match
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split(/[/?#]/)[0]!
    .replace(/[.,;:]+$/, '')
    .toLowerCase()
}

/**
 * Every rule the draft breaks that refuses it, in a stable order. An empty
 * array means the draft passes. Messages are written so they can be handed
 * back to the model on the retry. Warnings are left out (voiceWarnings).
 */
export function checkVoice(draft: { subject: string; body: string }, context: VoiceContext): VoiceViolation[] {
  return allChecks(draft, context).filter((violation) => !WARNING_RULES.has(violation.rule))
}

/** The warning rules a draft trips, in check order. */
export function warningRules(draft: { subject: string; body: string }, context: VoiceContext): VoiceRule[] {
  return [...new Set(allChecks(draft, context).filter((v) => WARNING_RULES.has(v.rule)).map((v) => v.rule))]
}

/** Warnings for the owner, as plain sentences. Never a reason to refuse. */
export function voiceWarnings(draft: { subject: string; body: string }, context: VoiceContext): string[] {
  const out: string[] = []
  for (const { rule } of allChecks(draft, context)) {
    if (rule === 'page_name') {
      for (const page of unnamedPages(plain(draft.body), context.findings)) {
        out.push(`This email mentions the "${page}", which none of the findings name. Check the page name against the list above.`)
      }
      continue
    }
    const sentence = WARNING_SENTENCES[rule]
    if (sentence !== undefined && !out.includes(sentence)) out.push(sentence)
  }
  return out
}

const WARNING_SENTENCES: Partial<Record<VoiceRule, string>> = {
  one_finding: 'This email may draw on more than one finding. Check it against the list above.',
  studio_wording: 'This email may describe the studio in other words, such as its size or location. Check how it describes the studio.',
  three_item_list: 'This email may contain a list of three items. Read it aloud once before approving.',
  urgency: 'This email may sound urgent or time-limited. Check its tone.',
  false_familiarity: 'This email may sound more familiar than a first contact should. Check its tone.',
  prior_contact: 'This email may suggest earlier contact or a referral. Make sure that is true.',
  pricing: 'This email may mention pricing, fees, quotes or an offer. Check it.',
  attachments: 'This email may mention an attachment. Nothing is attached to it.',
}

function allChecks(draft: { subject: string; body: string }, context: VoiceContext): VoiceViolation[] {
  const out: VoiceViolation[] = []
  const add = (rule: VoiceRule, message: string) => out.push({ rule, message })

  const subject = plain(draft.subject)
  const body = plain(draft.body)
  const both = `${subject}\n${body}`

  if (/[\r\n]/.test(draft.subject)) add('subject_single_line', 'The subject must be one line.')
  if (subject.trim().length === 0 || subject.trim().length >= SUBJECT_MAX_CHARS) {
    add('subject_length', `The subject must be 1 to ${SUBJECT_MAX_CHARS - 1} characters; it was ${subject.trim().length}.`)
  }
  if (both.includes('!')) add('exclamation', 'Use no exclamation marks in the subject or the body.')

  const words = bodyWordCount(body)
  if (words < BODY_MIN_WORDS || words > BODY_MAX_WORDS) {
    add('word_count', `The body must be ${BODY_MIN_WORDS} to ${BODY_MAX_WORDS} words; it was ${words}.`)
  }

  if (MARKDOWN.test(body)) add('plain_text', 'Plain text only: no markdown, bullets, code or HTML.')

  if (!FIRST_PERSON_SINGULAR.test(body) || FIRST_PERSON_PLURAL.test(both) || LOWER_US.test(both)) {
    add('first_person', 'Write in the first person singular (I, me, my). Never "we", "our" or "us".')
  }

  const studio = context.studioName.trim()
  const brand = studio.split(/\s+/)[0] ?? ''
  if (studio.length > 0 && brand.length >= 3 && studio.includes(' ')) {
    // The studio's own site (vizantir.com) is allowed and is not a second name for the studio.
    const withoutFullName = both
      .replace(STUDIO_SITE, ' ')
      .split(new RegExp(studio.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'))
      .join(' ')
    if (new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(withoutFullName)) {
      add('studio_name', `Call the studio "${studio}" or "the studio", nothing else.`)
    }
  }
  if (AGENCY.test(both)) add('agency', 'Never call the studio an agency.')

  const links = (both.match(URLISH) ?? []).filter((match) => hostOf(match) !== STUDIO_SITE_HOST)
  if (links.length > 0 || EMAILISH.test(both)) {
    add('links', `No links, web addresses or email addresses, except ${STUDIO_SITE_HOST}.`)
  }

  if (PRICING.test(both)) add('pricing', 'No pricing, packages, quotes or offers.')
  if (ATTACHMENTS.test(both)) add('attachments', 'No attachments.')
  if (AI_CASED.test(both) || AI_WORDS.test(both)) {
    add('ai_or_tools', 'Never mention AI, automation, tools, software, scraping or how the message was written.')
  }

  if (DASH_CHARS.test(both) || SPACED_HYPHEN.test(both)) {
    add('dashes', 'No em dashes, en dashes or spaced hyphens.')
  }

  for (const { phrase, pattern } of BANNED_PHRASES) {
    if (pattern.test(both)) add('banned_phrase', `Do not use the phrase "${phrase}".`)
  }

  for (const sentence of body.split(/(?<=[.?])\s+|\n+/)) {
    if (hasThreeItemList(sentence)) {
      add('three_item_list', 'Do not write a list of three items with matching structure.')
      break
    }
  }

  if (URGENCY.test(both)) add('urgency', 'No urgency, scarcity or deadlines.')
  if (FALSE_FAMILIARITY.test(both)) add('false_familiarity', 'No false familiarity.')
  if (PRIOR_CONTACT.test(both)) add('prior_contact', 'Never claim prior contact, a referral or a mutual connection.')

  const known = numberTokens(context.contextText)
  const invented = numberTokens(both).filter((token) => !known.some((k) => k.includes(token)))
  if (invented.length > 0) {
    add('invented_number', `Use only numbers that appear in the JSON; not ${[...new Set(invented)].slice(0, 3).join(', ')}.`)
  }

  if (context.noWebsiteFound && (NO_WEBSITE_FACT.test(both) || !NO_WEBSITE_HEDGE.test(body))) {
    add('website_claim', 'Say that you could not find a website for the business. Never state as fact that it has none.')
  }

  const studioIntro = `${studio}, ${STUDIO_DESCRIPTION}`.toLowerCase()
  const flatBody = body.replace(/\s+/g, ' ')
  const sentences = flatBody.split(/(?<=[.?])\s+/).map((sentence) => sentence.toLowerCase())
  const withoutIntro = (sentence: string) => sentence.split(studioIntro).join(' ')
  // Certain: a sentence that names the studio, or says "the studio" or "my studio".
  const namingSentences = sentences.filter(
    (sentence) => (studio.length > 0 && sentence.includes(studio.toLowerCase())) || /\b(?:the|my) studio\b/.test(sentence),
  )
  if (!flatBody.toLowerCase().includes(studioIntro) || namingSentences.some((sentence) => STUDIO_BANNED_WORDS.test(withoutIntro(sentence)))) {
    add(
      'studio_description',
      `Introduce the studio exactly as "${studio}, ${STUDIO_DESCRIPTION}". Describe it no other way: no size or location wording such as "small", "boutique", "local", "in the area" or "nearby".`,
    )
  }
  // A pattern: sentences that seem to be about the sender's work, and location words anywhere.
  const aboutSentences = sentences.filter((sentence) => ABOUT_THE_STUDIO.test(sentence)).map(withoutIntro)
  if (STUDIO_WORDING_ANYWHERE.test(body) || aboutSentences.some((sentence) => STUDIO_WORDING_NEAR.test(sentence))) {
    add('studio_wording', 'Describe the studio only with its exact description, with no size or location wording.')
  }

  const lines = draft.body.trim().split(/\r?\n/)
  if (lines[0]?.trim() !== GREETING_LINE || lines.length < 2 || OTHER_GREETING.test(body)) {
    add(
      'greeting',
      `Open the body with "${GREETING_LINE}" on its own line. Never greet the business or a person by name, and never use "Hi there", "Dear" or "To whom it may concern".`,
    )
  }

  if (!CONTRACTION.test(body) || UNCONTRACTED.test(body)) {
    add('contractions', `Write with natural contractions (I'd, I'm, you've, it's, that's, don't, couldn't). Write "I'd be glad", never "I would be glad", "I would love" or "I would be happy".`)
  }

  const subjectHasStudio =
    studio.length > 0 &&
    (subject.toLowerCase().includes(studio.toLowerCase()) ||
      (brand.length >= 3 && new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(subject.replace(STUDIO_SITE, ' '))))
  if (SUBJECT_BANNED.test(subject) || subjectHasStudio) {
    add(
      'subject_wording',
      'Make the subject a plain phrase naming the one thing the email is about, such as "Your contact page". Never use "observation", "quick question", "opportunity", "proposal", "partnership", "introduction", "touching base" or the studio\'s name.',
    )
  }

  if (context.findings.length > 1 && findingsUsed(body, context.findings, context.knownNames).length > 1) {
    add('one_finding', 'Use exactly one of the findings. Do not combine two findings into one email.')
  }

  const pages = context.findings.length > 0 ? unnamedPages(body, context.findings) : []
  if (pages.length > 0) {
    add('page_name', `Name a page only the way the finding names it; "${pages[0]}" is not in the findings.`)
  }

  const lastLines = body.trim().split(/\n+/).slice(-2).map((line) => line.trim())
  if (FOOTER_WORDS.test(body) || lastLines.some((line) => SIGN_OFF.test(line) || SITE_LINE.test(line))) {
    add('signature', 'End with the ask. No sign-off, signature, address or opt-out line; those are added separately.')
  }

  return out
}
